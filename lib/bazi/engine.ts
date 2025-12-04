import path from "path";

type SwissWasmCtor = typeof import("swisseph-wasm").default;
type SwissWasmInstance = InstanceType<SwissWasmCtor>;

export type SwissEngineSource = "swisseph-wasm";

export type SwissCalcResult = {
  longitude: number;
  latitude: number;
  distance: number;
  speedLongitude?: number;
  speedLatitude?: number;
  speedDistance?: number;
};

export type SwissEngine = {
  source: SwissEngineSource;
  swe_julday: (year: number, month: number, day: number, utHour: number) => number;
  swe_calc_ut: (julianDay: number, body: number, flags: number) => SwissCalcResult;
  swe_set_ephe_path: (ephePath: string) => unknown;
  swe_time_equ?: (julianDay: number) => number | null;
  constants: {
    SE_SUN: number;
    SEFLG_SWIEPH: number;
    SE_GREG_CAL?: number;
  };
  cleanup?: () => Promise<void> | void;
};

const EPHE_PATH = path.join(process.cwd(), "public", "ephe");
const NORMALIZED_EPHE_PATH = EPHE_PATH.replace(/\\/g, "/");

let enginePromise: Promise<SwissEngine> | null = null;

const toWasmResult = (result: ArrayLike<number>): SwissCalcResult => {
  const longitude = result[0] ?? 0;
  const latitude = result[1] ?? 0;
  const distance = result[2] ?? 0;

  return {
    longitude,
    latitude,
    distance,
    speedLongitude: result[3],
    speedLatitude: result[4],
    speedDistance: result[5],
  };
};

const loadWasmEngine = async (): Promise<SwissEngine> => {
  const SwissEph: SwissWasmCtor = (await import("swisseph-wasm")).default;
  const swe = new SwissEph() as SwissWasmInstance;

  await swe.initSwissEph();
  swe.set_ephe_path(NORMALIZED_EPHE_PATH);

  return {
    source: "swisseph-wasm",
    swe_julday: (year, month, day, utHour) => swe.julday(year, month, day, utHour),
    swe_calc_ut: (julianDay, body, flags) => toWasmResult(swe.calc_ut(julianDay, body, flags)),
    swe_set_ephe_path: swe.set_ephe_path.bind(swe),
    swe_time_equ: () => null, // wasm 빌드는 swe_time_equ 결과를 제공하지 않음
    constants: {
      SE_SUN: swe.SE_SUN,
      SEFLG_SWIEPH: swe.SEFLG_SWIEPH,
      SE_GREG_CAL: swe.SE_GREG_CAL,
    },
    cleanup: typeof swe.close === "function" ? () => swe.close() : undefined,
  };
};

const loadEngine = async (): Promise<SwissEngine> => {
  // 네이티브(swisseph-v2) 경로는 빌드 의존성을 피하기 위해 제거하고 WASM만 사용
  return loadWasmEngine();
};

export const getSwissEngine = async (): Promise<SwissEngine> => {
  if (!enginePromise) {
    enginePromise = loadEngine();
  }
  return enginePromise;
};

export const testSwissConnection = async (): Promise<{
  engine: SwissEngineSource;
  ephePath: string;
  julianDayUTC: number;
  sunLongitude: number;
}> => {
  const engine = await getSwissEngine();
  const julianDayUTC = engine.swe_julday(2024, 2, 4, 12);
  const sunPosition = engine.swe_calc_ut(
    julianDayUTC,
    engine.constants.SE_SUN,
    engine.constants.SEFLG_SWIEPH,
  );

  return {
    engine: engine.source,
    ephePath: NORMALIZED_EPHE_PATH,
    julianDayUTC,
    sunLongitude: sunPosition.longitude,
  };
};
