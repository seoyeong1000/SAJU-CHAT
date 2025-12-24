import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";

import { heavenlyStems, earthlyBranches } from "@/lib/bazi/constants";
import { getSwissEngine } from "@/lib/bazi/engine";
import { calculateEoT, calculateLongitudeOffset } from "@/lib/bazi/eot-approx";

const requestSchema = z.object({
  localWallTime: z.string().min(1),
  tzid: z.string().min(1),
  lon: z.number().optional(),
  lat: z.number().optional(),
  options: z
    .object({
      useTrueSolarTime: z.boolean().optional().default(true),
      zishiSplit: z.enum(["traditional", "modern"]).optional().default("traditional"),
      fallbackStrategy: z.enum(["allowApprox", "strict"]).optional().default("allowApprox"),
    })
    .optional()
    .default({}),
});

type BaziRequest = z.infer<typeof requestSchema>;

type PillarElement = {
  hanja: string;
  hangul: string;
  code: string;
};

type Pillar = {
  stem: PillarElement | null;
  branch: PillarElement | null;
};

type PillarResult = {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;
};

const toJulianDayUTC = (utc: DateTime): number => {
  const a = Math.floor((14 - utc.month) / 12);
  const y = utc.year + 4800 - a;
  const m = utc.month + 12 * a - 3;

  const jdn =
    utc.day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  const dayFraction =
    (utc.hour - 12) / 24 + utc.minute / 1440 + utc.second / 86400 + utc.millisecond / 86400000;

  return jdn + dayFraction;
};

const BRANCHES = earthlyBranches.map((b) => b.hanja);
const STEMS = heavenlyStems.map((s) => s.hanja);

const FIRST_MONTH_STEM_BY_YEAR_STEM = [2, 3, 4, 5, 6, 7, 8, 9, 0, 1]; // 甲/乙→丙/丁, 丙/丁→戊/己 ...

const toCycleIndex = (value: number, modulo: number): number => ((value % modulo) + modulo) % modulo;

const getStemByIndex = (idx: number): PillarElement => heavenlyStems[toCycleIndex(idx, heavenlyStems.length)];
const getBranchByIndex = (idx: number): PillarElement =>
  earthlyBranches[toCycleIndex(idx, earthlyBranches.length)];

const computeMonthBranchIndex = (sunLongitude: number): number => {
  const normalized = ((sunLongitude - 315) % 360 + 360) % 360;
  const idx = Math.floor(normalized / 30);
  return toCycleIndex(idx + 2, 12); // 315°→寅(2)
};

const computeHourBranchIndex = (date: DateTime, split: "traditional" | "modern"): number => {
  const minutes = date.hour * 60 + date.minute;
  const offsetFrom23 = minutes - 23 * 60;
  const idx = offsetFrom23 >= 0 ? Math.floor(offsetFrom23 / 120) : Math.floor((minutes + 60) / 120);
  const branchIndex = ((idx % 12) + 12) % 12;

  if (split === "modern" && branchIndex === 0 && date.hour >= 23) {
    return 0;
  }

  return branchIndex;
};

const BASE_DAY_JD = (() => {
  const base = DateTime.fromISO("1984-02-02T00:00:00Z");
  return toJulianDayUTC(base);
})();

const buildSuccessResponse = (
  input: BaziRequest,
  utc: DateTime,
  local: DateTime,
  tst: DateTime,
  pillars: PillarResult,
  sunLongitude: number,
  julianDayUTC: number,
  engine: string,
  eotMinutes: number | null,
  flags: {
    usedTrueSolarTime: boolean;
    usedFallbackEngine: boolean;
    hourUnknown: boolean;
    locationUnknown: boolean;
  },
  debugNote?: string,
  offsets?: {
    longitudeOffsetMin: number | null;
    totalOffsetMin: number | null;
    eotSource: "native" | "approx" | null;
  },
) => {
  return NextResponse.json({
    ...pillars,
    raw: {
      julianDayUTC,
      sunLongitude,
    },
    flags,
    meta: {
      engine,
      note: debugNote ?? "월지=태양황경(절기), 시주=경도 보정(간단 TST)",
      debug: {
        tzid: input.tzid,
        tzOffsetMin: local.offset,
        lon: input.lon ?? null,
        lat: input.lat ?? null,
        localWallISO: local.toISO(),
        utcISO: utc.toISO(),
        tstLocal: tst.toISO(),
        eotMin: eotMinutes,
        longitudeOffsetMin: offsets?.longitudeOffsetMin ?? null,
        totalOffsetMin: offsets?.totalOffsetMin ?? null,
        eotSource: offsets?.eotSource ?? null,
      },
    },
  });
};

export const POST = async (req: Request) => {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.format() }, { status: 400 });
  }

  const raw = parsed.data;
  const body: BaziRequest = {
    ...raw,
    lon: Number.isFinite(raw.lon) ? raw.lon : undefined,
    lat: Number.isFinite(raw.lat) ? raw.lat : undefined,
  };
  const options = body.options;

  const local = DateTime.fromISO(body.localWallTime, { zone: body.tzid, setZone: true });
  if (!local.isValid) {
    return NextResponse.json({ error: "Invalid localWallTime or tzid" }, { status: 400 });
  }

  const utc = local.toUTC();
  const utcHour = utc.hour + utc.minute / 60 + utc.second / 3600 + utc.millisecond / 3_600_000;
  const julianDayApprox = toJulianDayUTC(utc);

  const locationUnknown = body.lon === undefined || body.lat === undefined;

  const compute = async () => {
    const engine = await getSwissEngine();
    const julianDayUTC = engine.swe_julday(utc.year, utc.month, utc.day, utcHour);
    const sun = engine.swe_calc_ut(julianDayUTC, engine.constants.SE_SUN, engine.constants.SEFLG_SWIEPH);

    const usedTrueSolarTime = options.useTrueSolarTime === true && body.lon !== undefined;
    const longitudeOffsetMin =
      usedTrueSolarTime && body.lon !== undefined
        ? calculateLongitudeOffset(body.lon, local.offset)
        : null;

    const eotInfo =
      usedTrueSolarTime && body.lon !== undefined
        ? (() => {
            const native = engine.swe_time_equ ? engine.swe_time_equ(julianDayUTC) : null;
            if (typeof native === "number") {
              return { minutes: native, source: "native" as const };
            }
            return { minutes: calculateEoT(julianDayUTC), source: "approx" as const };
          })()
        : { minutes: null, source: null };

    const totalOffsetMinutes =
      usedTrueSolarTime && longitudeOffsetMin !== null
        ? longitudeOffsetMin + (eotInfo.minutes ?? 0)
        : null;

    const tst =
      usedTrueSolarTime && totalOffsetMinutes !== null
        ? local.plus({ minutes: totalOffsetMinutes })
        : local;

    // Branch indices
    const monthBranchIndex = computeMonthBranchIndex(sun.longitude);
    const hourBranchIndex = computeHourBranchIndex(tst, options.zishiSplit ?? "traditional");

    // Year pillar: 입춘(태양황경 315°) 이전이면 이전 해 적용
    const lichunPassed = sun.longitude >= 315;
    const solarYear = lichunPassed ? local.year : local.year - 1;
    const yearStemIndex = toCycleIndex(solarYear - 1984, STEMS.length);
    const yearBranchIndex = toCycleIndex(solarYear - 1984, BRANCHES.length);

    // Month pillar: 첫 달(寅)을 1월로 계산
    const monthNumber = toCycleIndex(monthBranchIndex + 10, 12) + 1; // branchIndex 2(寅) -> 1
    const firstMonthStemIndex = FIRST_MONTH_STEM_BY_YEAR_STEM[yearStemIndex];
    const monthStemIndex = toCycleIndex(firstMonthStemIndex + (monthNumber - 1), STEMS.length);

    // Day pillar: 1984-02-02 00:00 UTC = 甲子 기준
    const dayNumber = Math.floor(julianDayUTC + 0.5);
    const baseDayNumber = Math.floor(BASE_DAY_JD + 0.5);
    const dayOffset = dayNumber - baseDayNumber;
    const dayStemIndex = toCycleIndex(dayOffset, STEMS.length);
    const dayBranchIndex = toCycleIndex(dayOffset, BRANCHES.length);

    // Hour pillar: 일간 기반 공식
    const hourStemIndex = toCycleIndex((dayStemIndex % 5) * 2 + hourBranchIndex, STEMS.length);

    const pillars: PillarResult = {
      yearPillar: { stem: getStemByIndex(yearStemIndex), branch: getBranchByIndex(yearBranchIndex) },
      monthPillar: { stem: getStemByIndex(monthStemIndex), branch: getBranchByIndex(monthBranchIndex) },
      dayPillar: { stem: getStemByIndex(dayStemIndex), branch: getBranchByIndex(dayBranchIndex) },
      hourPillar: { stem: getStemByIndex(hourStemIndex), branch: getBranchByIndex(hourBranchIndex) },
    };

    return buildSuccessResponse(
      body,
      utc,
      local,
      tst,
      pillars,
      sun.longitude,
      julianDayUTC,
      engine.source,
      eotInfo.minutes,
      {
        usedTrueSolarTime,
        usedFallbackEngine: false,
        hourUnknown: false,
        locationUnknown,
      },
      usedTrueSolarTime
        ? eotInfo.source === "native"
          ? "경도 + 균시차(EoT) 보정 TST 적용 (swisseph)"
          : "경도 + 균시차(EoT) 보정 TST 적용 (Spencer 1971 근사식, ±0.5분)"
        : "경도/진태양시 미적용 (간단 표준시 기준)",
      {
        longitudeOffsetMin,
        totalOffsetMin: totalOffsetMinutes,
        eotSource: eotInfo.source,
      },
    );
  };

  try {
    return await compute();
  } catch (error) {
    const usedTrueSolarTime = options.useTrueSolarTime === true && body.lon !== undefined;
    const fallbackLongitudeOffset =
      usedTrueSolarTime && body.lon !== undefined
        ? calculateLongitudeOffset(body.lon, local.offset)
        : null;
    const fallbackEot = usedTrueSolarTime ? calculateEoT(julianDayApprox) : null;
    const fallbackTotalOffset =
      usedTrueSolarTime && fallbackLongitudeOffset !== null
        ? fallbackLongitudeOffset + (fallbackEot ?? 0)
        : null;

    if ((options.fallbackStrategy ?? "allowApprox") === "allowApprox") {
      return NextResponse.json({
        yearPillar: { stem: null, branch: null },
        monthPillar: { stem: null, branch: null },
        dayPillar: { stem: null, branch: null },
        hourPillar: { stem: null, branch: null },
        raw: {
          julianDayUTC: null,
          sunLongitude: null,
        },
        flags: {
          usedTrueSolarTime,
          usedFallbackEngine: true,
          hourUnknown: false,
          locationUnknown,
        },
        meta: {
          engine: "date-chinese",
          note: "Swiss 엔진 실패로 fallback 사용 (간단 스텁). 상세 계산 미수행.",
          debug: {
            error: error instanceof Error ? error.message : "Unknown error",
            tzid: body.tzid,
            lon: body.lon ?? null,
            lat: body.lat ?? null,
            eotMin: fallbackEot,
            longitudeOffsetMin: fallbackLongitudeOffset,
            totalOffsetMin: fallbackTotalOffset,
            eotSource: usedTrueSolarTime ? "approx" : null,
          },
        },
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Swiss engine error" },
      { status: 500 },
    );
  }
};
