"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GUEST_SAJU_STORAGE_KEY } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";
import { FiveElement, PillarKey, SajuResultPayload } from "@/types/saju";
import { AlertCircle, Loader2, Search } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

type CalendarType = "solar" | "lunar" | "lunar-leap";

type FormState = {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  calendarType: CalendarType;
  tzid: string;
  locationText: string;
  locationUnknown: boolean;
  lat: string;
  lon: string;
  useTrueSolarTime: boolean;
  zishiSplit: "traditional" | "modern";
  fallbackStrategy: "allowApprox" | "strict";
};

type Polarity = "yin" | "yang";

type PillarElement = {
  hanja: string | null;
  hangul: string | null;
  code: string | null;
};

type ChartElement = PillarElement & {
  element?: FiveElement | null;
  polarity?: Polarity | null;
  tenGod?: string | null;
  pronunciation?: string | null;
};

type Pillar = {
  stem: PillarElement | null;
  branch: PillarElement | null;
};

type ChartPillar = {
  stem: ChartElement | null;
  branch: ChartElement | null;
};

type RawChart = {
  day_master?: ChartElement | null;
  pillars?: Partial<Record<PillarKey, ChartPillar>>;
  five_elements_count?: Partial<Record<FiveElement, number>>;
};

type UsefulGod = {
  name: string;
  element?: FiveElement | null;
  description?: string | null;
  score?: number | null;
};

type AnalysisResult = {
  core?: {
    strength_label?: string | null;
    strength_score?: number | null;
    strength_element?: FiveElement | null;
    summary?: string | null;
  };
  useful_gods?: UsefulGod[];
};

type BaziResponse = {
  hourPillar: Pillar;
  dayPillar: Pillar;
  monthPillar: Pillar;
  yearPillar: Pillar;
  flags?: {
    usedTrueSolarTime: boolean;
    usedFallbackEngine: boolean;
    hourUnknown: boolean;
    locationUnknown: boolean;
  };
  meta?: {
    note?: string;
  };
  raw?: {
    julianDayUTC: number | null;
    sunLongitude: number | null;
  };
  raw_chart?: RawChart;
  analysis_result?: AnalysisResult;
};

type NormalizedChart = {
  dayStemCode: string | null;
  dayMaster: ChartElement | null;
  pillars: Record<PillarKey, ChartPillar>;
};

const presets: Record<"ipchun" | "seoul" | "busan" | "unknown", Partial<FormState>> = {
  ipchun: {
    birthDate: "2024-02-04",
    birthTime: "16:28:00",
    gender: "female",
    lat: "37.5665",
    lon: "126.9780",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  seoul: {
    birthDate: new Date().toISOString().split("T")[0],
    birthTime: "12:00:00",
    gender: "female",
    lat: "37.5665",
    lon: "126.9780",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  busan: {
    birthDate: new Date().toISOString().split("T")[0],
    birthTime: "12:00:00",
    gender: "male",
    lat: "35.1796",
    lon: "129.0756",
    tzid: "Asia/Seoul",
    timeUnknown: false,
    locationUnknown: false,
  },
  unknown: {
    birthDate: "1990-01-01",
    birthTime: "",
    gender: "female",
    lat: "",
    lon: "",
    tzid: "Asia/Seoul",
    timeUnknown: true,
    locationUnknown: true,
  },
};

const cityOptions = [
  // 대한민국 주요 도시
  { label: "서울특별시, 대한민국", lat: "37.5665", lon: "126.9780", tzid: "Asia/Seoul" },
  { label: "부산광역시, 대한민국", lat: "35.1796", lon: "129.0756", tzid: "Asia/Seoul" },
  { label: "대구광역시, 대한민국", lat: "35.8714", lon: "128.6014", tzid: "Asia/Seoul" },
  { label: "인천광역시, 대한민국", lat: "37.4563", lon: "126.7052", tzid: "Asia/Seoul" },
  { label: "광주광역시, 대한민국", lat: "35.1595", lon: "126.8526", tzid: "Asia/Seoul" },
  { label: "대전광역시, 대한민국", lat: "36.3504", lon: "127.3845", tzid: "Asia/Seoul" },
  { label: "울산광역시, 대한민국", lat: "35.5384", lon: "129.3114", tzid: "Asia/Seoul" },
  { label: "세종특별자치시, 대한민국", lat: "36.48", lon: "127.289", tzid: "Asia/Seoul" },
  { label: "수원시, 대한민국", lat: "37.2636", lon: "127.0286", tzid: "Asia/Seoul" },
  { label: "성남시, 대한민국", lat: "37.42", lon: "127.1265", tzid: "Asia/Seoul" },
  { label: "고양시, 대한민국", lat: "37.6584", lon: "126.832", tzid: "Asia/Seoul" },
  { label: "용인시, 대한민국", lat: "37.2411", lon: "127.1775", tzid: "Asia/Seoul" },
  { label: "창원시, 대한민국", lat: "35.228", lon: "128.6812", tzid: "Asia/Seoul" },
  { label: "청주시, 대한민국", lat: "36.6424", lon: "127.489", tzid: "Asia/Seoul" },
  { label: "전주시, 대한민국", lat: "35.8242", lon: "127.148", tzid: "Asia/Seoul" },
  { label: "제주시, 대한민국", lat: "33.4996", lon: "126.5312", tzid: "Asia/Seoul" },
  { label: "포항시, 대한민국", lat: "36.019", lon: "129.3435", tzid: "Asia/Seoul" },
  { label: "김해시, 대한민국", lat: "35.2285", lon: "128.889", tzid: "Asia/Seoul" },
  { label: "남양주시, 대한민국", lat: "37.6542", lon: "127.308", tzid: "Asia/Seoul" },
  { label: "안산시, 대한민국", lat: "37.3219", lon: "126.8309", tzid: "Asia/Seoul" },
  { label: "안양시, 대한민국", lat: "37.3943", lon: "126.9568", tzid: "Asia/Seoul" },
  { label: "수영구, 부산, 대한민국", lat: "35.1644", lon: "129.114", tzid: "Asia/Seoul" },
  { label: "성동구, 서울, 대한민국", lat: "37.5634", lon: "127.0364", tzid: "Asia/Seoul" },
  { label: "동대문구, 서울, 대한민국", lat: "37.5744", lon: "127.0396", tzid: "Asia/Seoul" },

  // 해외 주요 도시
  { label: "도쿄, 일본", lat: "35.6895", lon: "139.6917", tzid: "Asia/Tokyo" },
  { label: "오사카, 일본", lat: "34.6937", lon: "135.5023", tzid: "Asia/Tokyo" },
  { label: "뉴욕, 미국", lat: "40.7128", lon: "-74.0060", tzid: "America/New_York" },
  { label: "로스앤젤레스, 미국", lat: "34.0522", lon: "-118.2437", tzid: "America/Los_Angeles" },
  { label: "런던, 영국", lat: "51.5074", lon: "-0.1278", tzid: "Europe/London" },
  { label: "파리, 프랑스", lat: "48.8566", lon: "2.3522", tzid: "Europe/Paris" },
  { label: "베를린, 독일", lat: "52.5200", lon: "13.4050", tzid: "Europe/Berlin" },
  { label: "시드니, 호주", lat: "-33.8688", lon: "151.2093", tzid: "Australia/Sydney" },
  { label: "상하이, 중국", lat: "31.2304", lon: "121.4737", tzid: "Asia/Shanghai" },
  { label: "베이징, 중국", lat: "39.9042", lon: "116.4074", tzid: "Asia/Shanghai" },
];

const ELEMENT_ORDER: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];

const ELEMENT_LABELS: Record<FiveElement, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const ELEMENT_STYLES: Record<
  FiveElement,
  { bg: string; text: string; ring: string; badge: string; subtle: string }
> = {
  wood: {
    bg: "bg-green-50",
    text: "text-green-900",
    ring: "ring-green-200",
    badge: "bg-green-100 text-green-800",
    subtle: "text-green-600",
  },
  fire: {
    bg: "bg-rose-50",
    text: "text-rose-900",
    ring: "ring-rose-200",
    badge: "bg-rose-100 text-rose-800",
    subtle: "text-rose-600",
  },
  earth: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    ring: "ring-amber-200",
    badge: "bg-amber-100 text-amber-900",
    subtle: "text-amber-600",
  },
  metal: {
    bg: "bg-slate-100",
    text: "text-slate-900",
    ring: "ring-slate-300",
    badge: "bg-slate-200 text-slate-800",
    subtle: "text-slate-600",
  },
  water: {
    bg: "bg-slate-900",
    text: "text-sky-50",
    ring: "ring-slate-700",
    badge: "bg-slate-800 text-sky-100",
    subtle: "text-sky-500",
  },
};

const STEM_ELEMENT_MAP: Record<string, FiveElement> = {
  jia: "wood",
  yi: "wood",
  bing: "fire",
  ding: "fire",
  wu: "earth",
  ji: "earth",
  geng: "metal",
  xin: "metal",
  ren: "water",
  gui: "water",
};

const BRANCH_ELEMENT_MAP: Record<string, FiveElement> = {
  zi: "water",
  chou: "earth",
  yin: "wood",
  mao: "wood",
  chen: "earth",
  si: "fire",
  wu: "fire",
  wei: "earth",
  shen: "metal",
  you: "metal",
  xu: "earth",
  hai: "water",
};

const STEM_POLARITY_MAP: Record<string, Polarity> = {
  jia: "yang",
  yi: "yin",
  bing: "yang",
  ding: "yin",
  wu: "yang",
  ji: "yin",
  geng: "yang",
  xin: "yin",
  ren: "yang",
  gui: "yin",
};

const BRANCH_POLARITY_MAP: Record<string, Polarity> = {
  zi: "yang",
  chou: "yin",
  yin: "yang",
  mao: "yin",
  chen: "yang",
  si: "yin",
  wu: "yang",
  wei: "yin",
  shen: "yang",
  you: "yin",
  xu: "yang",
  hai: "yin",
};

const PRODUCT_MAP: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const CONTROL_MAP: Record<FiveElement, FiveElement> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

const PILLAR_LABELS: Record<PillarKey, string> = {
  hour: "시주",
  day: "일주",
  month: "월주",
  year: "연주",
};

const getElementByCode = (code?: string | null): FiveElement | null => {
  if (!code) return null;
  const normalized = code.toLowerCase();
  return STEM_ELEMENT_MAP[normalized] ?? BRANCH_ELEMENT_MAP[normalized] ?? null;
};

const getPolarityByCode = (code?: string | null): Polarity | null => {
  if (!code) return null;
  const normalized = code.toLowerCase();
  return STEM_POLARITY_MAP[normalized] ?? BRANCH_POLARITY_MAP[normalized] ?? null;
};

const getElementStyle = (element?: FiveElement | null) => ELEMENT_STYLES[element ?? "earth"];

const getTenGod = (
  dayStemCode: string | null,
  target: { element?: FiveElement | null; polarity?: Polarity | null } | null,
): string | null => {
  if (!dayStemCode || !target?.element || !target.polarity) return null;

  const dayElement = getElementByCode(dayStemCode);
  const dayPolarity = getPolarityByCode(dayStemCode);
  if (!dayElement || !dayPolarity) return null;

  const targetElement = target.element;
  const targetPolarity = target.polarity;

  let relation: "peer" | "output" | "wealth" | "power" | "resource" | null = null;

  if (targetElement === dayElement) {
    relation = "peer";
  } else if (PRODUCT_MAP[dayElement] === targetElement) {
    relation = "output";
  } else if (CONTROL_MAP[dayElement] === targetElement) {
    relation = "wealth";
  } else if (CONTROL_MAP[targetElement] === dayElement) {
    relation = "power";
  } else if (PRODUCT_MAP[targetElement] === dayElement) {
    relation = "resource";
  }

  if (!relation) return null;

  const samePolarity = targetPolarity === dayPolarity;
  switch (relation) {
    case "peer":
      return samePolarity ? "비견" : "겁재";
    case "output":
      return samePolarity ? "식신" : "상관";
    case "wealth":
      return samePolarity ? "편재" : "정재";
    case "power":
      return samePolarity ? "편관" : "정관";
    case "resource":
      return samePolarity ? "편인" : "정인";
    default:
      return null;
  }
};

const buildChartElement = (
  rawElement?: PillarElement | ChartElement | null,
  dayStemCode?: string | null,
): ChartElement | null => {
  if (!rawElement) return null;

  const computedElement = (rawElement as ChartElement).element ?? getElementByCode(rawElement.code);
  const polarity = (rawElement as ChartElement).polarity ?? getPolarityByCode(rawElement.code);
  const pronunciation = (rawElement as ChartElement).pronunciation ?? rawElement.hangul ?? null;

  return {
    ...rawElement,
    element: computedElement,
    polarity,
    pronunciation,
    tenGod: (rawElement as ChartElement).tenGod ?? getTenGod(dayStemCode ?? null, { element: computedElement, polarity }),
  };
};

const normalizeChart = (result: BaziResponse | null): NormalizedChart | null => {
  if (!result) return null;

  const rawPillars = (result.raw_chart?.pillars ?? {}) as Partial<Record<PillarKey, ChartPillar>>;
  const basePillars: Record<PillarKey, Pillar | undefined> = {
    hour: result.hourPillar,
    day: result.dayPillar,
    month: result.monthPillar,
    year: result.yearPillar,
  };

  const dayStemCode = rawPillars.day?.stem?.code ?? basePillars.day?.stem?.code ?? null;

  const build = (key: PillarKey): ChartPillar => {
    const candidate = rawPillars[key] ?? basePillars[key];
    return {
      stem: buildChartElement(candidate?.stem as PillarElement | ChartElement | null, dayStemCode),
      branch: buildChartElement(candidate?.branch as PillarElement | ChartElement | null, dayStemCode),
    };
  };

  const dayMasterRaw = (result.raw_chart?.day_master as ChartElement | null) ?? (basePillars.day?.stem as ChartElement | null);

  return {
    dayStemCode,
    dayMaster: buildChartElement(dayMasterRaw, dayStemCode),
    pillars: {
      hour: build("hour"),
      day: build("day"),
      month: build("month"),
      year: build("year"),
    },
  };
};

const deriveElementCounts = (
  result: BaziResponse | null,
  normalized: NormalizedChart | null,
): Record<FiveElement, number> => {
  const counts = ELEMENT_ORDER.reduce(
    (acc, cur) => {
      acc[cur] = 0;
      return acc;
    },
    {} as Record<FiveElement, number>,
  );

  const provided = result?.raw_chart?.five_elements_count;
  if (provided) {
    ELEMENT_ORDER.forEach((key) => {
      const value = provided[key];
      counts[key] = Number.isFinite(value) ? Number(value) : 0;
    });
  }

  if (normalized) {
    Object.values(normalized.pillars).forEach((pillar) => {
      [pillar.stem, pillar.branch].forEach((char) => {
        if (char?.element) {
          counts[char.element] = (counts[char.element] ?? 0) + 1;
        }
      });
    });
  }

  return counts;
};

const DEFAULT_FORM: FormState = {
  name: "",
  gender: "female",
  birthDate: new Date().toISOString().split("T")[0],
  birthTime: "08:00",
  timeUnknown: false,
  calendarType: "solar",
  tzid: "Asia/Seoul",
  locationText: "",
  locationUnknown: false,
  lat: "37.5665",
  lon: "126.9780",
  useTrueSolarTime: true,
  zishiSplit: "traditional",
  fallbackStrategy: "allowApprox",
};

const buildOhangScores = (counts: Record<FiveElement, number>): Record<FiveElement, number> => {
  const total = Object.values(counts).reduce((acc, cur) => acc + (cur ?? 0), 0);
  return ELEMENT_ORDER.reduce((acc, key) => {
    const value = counts[key] ?? 0;
    acc[key] = total > 0 ? Math.round((value / total) * 100) : 0;
    return acc;
  }, {} as Record<FiveElement, number>);
};

const buildSajuPayload = (
  form: FormState,
  normalized: NormalizedChart | null,
  counts: Record<FiveElement, number>,
  analysis?: AnalysisResult,
): SajuResultPayload | null => {
  if (!normalized) return null;

  const toPillarInfo = (key: PillarKey, pillar?: ChartPillar | null) => ({
    stem: pillar?.stem?.hanja ?? "?",
    branch: pillar?.branch?.hanja ?? "?",
    element: pillar?.stem?.element ?? "earth",
    branchElement: pillar?.branch?.element ?? pillar?.stem?.element ?? "earth",
    tenGod: pillar?.stem?.tenGod ?? undefined,
    tenGodBranch: pillar?.branch?.tenGod ?? undefined,
    hiddenStem: pillar?.branch?.pronunciation ?? pillar?.branch?.hangul ?? undefined,
    label: PILLAR_LABELS[key],
  });

  const birthTime = form.timeUnknown ? "시간 미상" : form.birthTime || "00:00";
  const yearStem = normalized.pillars.year?.stem?.hanja ?? "";
  const yearBranch = normalized.pillars.year?.branch?.hanja ?? "";
  const zodiacText = yearStem && yearBranch ? `${yearStem}${yearBranch}년` : undefined;
  const ohangScores = buildOhangScores(counts);

  return {
    name: form.name || "게스트",
    birthDate: form.birthDate,
    birthTime,
    gender: form.gender,
    zodiacText,
    pillars: {
      hour: toPillarInfo("hour", normalized.pillars.hour),
      day: toPillarInfo("day", normalized.pillars.day),
      month: toPillarInfo("month", normalized.pillars.month),
      year: toPillarInfo("year", normalized.pillars.year),
    },
    sipseong: {
      hour: normalized.pillars.hour?.stem?.tenGod ?? undefined,
      day: normalized.pillars.day?.stem?.tenGod ?? undefined,
      month: normalized.pillars.month?.stem?.tenGod ?? undefined,
      year: normalized.pillars.year?.stem?.tenGod ?? undefined,
    },
    woonsung: undefined,
    inmyeonggang: analysis?.core?.strength_score ?? undefined,
    ohangScores,
    balance: {
      geumun: ohangScores.metal ?? 0,
      seongsaundong: ohangScores.wood ?? 0,
    },
    analysis: {
      strengthIndex: analysis?.core?.strength_score ?? undefined,
      strengthLabel: analysis?.core?.strength_label ?? undefined,
      fiveElementDetail: counts,
      tenGodSummary: analysis?.core?.summary ?? undefined,
    },
    meta: {
      source: "guest",
      savedAt: new Date().toISOString(),
    },
  };
};

const BaziTestPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<BaziResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showZishiGuide, setShowZishiGuide] = useState(false);
  const [showYajasiGuide, setShowYajasiGuide] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const onChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildLocalWallTime = () => {
    if (!form.birthDate) return null;
    const rawTime =
      !form.timeUnknown && form.birthTime && form.birthTime.trim().length > 0
        ? form.birthTime
        : "00:00";
    const normalizedTime = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
    return `${form.birthDate}T${normalizedTime}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const localWallTime = buildLocalWallTime();
      if (!localWallTime) {
        throw new Error("생년월일을 입력해주세요.");
      }

      const parsedLon = Number.parseFloat(form.lon);
      const parsedLat = Number.parseFloat(form.lat);
      const hasCoords =
        !form.locationUnknown &&
        form.locationText.trim() !== "" &&
        form.lat.trim() !== "" &&
        form.lon.trim() !== "" &&
        Number.isFinite(parsedLon) &&
        Number.isFinite(parsedLat);

      const body = {
        localWallTime,
        tzid: form.tzid || "Asia/Seoul",
        lon: hasCoords ? parsedLon : undefined,
        lat: hasCoords ? parsedLat : undefined,
        options: {
          useTrueSolarTime: hasCoords && form.useTrueSolarTime,
          zishiSplit: form.zishiSplit,
          fallbackStrategy: form.fallbackStrategy,
        },
      };

      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const detail = JSON.parse(text);
          if (detail?.error) {
            message = detail.error;
          } else if (detail?.issues) {
            message = "입력값을 다시 확인해주세요.";
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = (await res.json()) as BaziResponse;
      setResult(data);

      const normalized = normalizeChart(data);
      const counts = deriveElementCounts(data, normalized);
      const sharePayload = buildSajuPayload(form, normalized, counts, data.analysis_result);
      if (sharePayload) {
        const serialized = JSON.stringify(sharePayload);
        try {
          localStorage.setItem(GUEST_SAJU_STORAGE_KEY, serialized);
        } catch {
          // ignore storage write failures
        }
        const encoded = encodeURIComponent(serialized);
        router.push(`/saju-result?data=${encoded}&source=guest`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (key: keyof typeof presets) => {
    setForm((prev) => ({ ...prev, ...presets[key] }));
    setResult(null);
    setError(null);
  };

  const filteredCities = useMemo(() => {
    const q = form.locationText.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => c.label.toLowerCase().includes(q));
  }, [form.locationText]);

  const selectCity = (city: (typeof cityOptions)[number]) => {
    setForm((prev) => ({
      ...prev,
      locationText: city.label,
      lat: city.lat,
      lon: city.lon,
      tzid: city.tzid,
      locationUnknown: false,
    }));
    setShowCityDropdown(false);
    setShowCityModal(false);
  };

  const normalizedChart = useMemo(() => normalizeChart(result), [result]);
  const fiveElementCounts = useMemo(
    () => deriveElementCounts(result, normalizedChart),
    [normalizedChart, result],
  );
  const fiveElementSeries = useMemo(
    () =>
      ELEMENT_ORDER.map((key) => ({
        key,
        label: `${ELEMENT_LABELS[key]} (${fiveElementCounts[key] ?? 0})`,
        value: fiveElementCounts[key] ?? 0,
      })),
    [fiveElementCounts],
  );
  const dominantElement = useMemo(() => {
    const entries = Object.entries(fiveElementCounts) as [FiveElement, number][];
    return entries.length > 0
      ? entries.reduce((prev, cur) => (cur[1] > prev[1] ? cur : prev), entries[0])[0]
      : null;
  }, [fiveElementCounts]);
  const analysisCore = result?.analysis_result?.core;
  const usefulGods = result?.analysis_result?.useful_gods ?? [];
  const dayMaster = normalizedChart?.dayMaster;
  const hasResult = Boolean(result);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");
        * {
          font-family: "Pretendard Variable", "Pretendard", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      `}</style>

      <header className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">Bazi Intake</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">만세력 입력</h1>
              <p className="text-sm text-slate-600">
                결과 화면과 동일한 톤으로 정보를 입력하고 바로 사주 풀이를 확인하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border border-violet-100 bg-white text-violet-700">UI 동기화</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-2 border-violet-100 bg-white shadow-lg">
            <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <CardTitle className="text-slate-900">프로필 입력</CardTitle>
              <p className="text-sm text-slate-600">결과 화면과 같은 톤으로 입력값을 정리했어요.</p>
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">
                  이름
                </Label>
                <Input
                  id="name"
                  placeholder="최대 12글자 이내로 입력하세요"
                  maxLength={12}
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">성별</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["female", "male"] as const).map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={form.gender === g ? "default" : "outline"}
                      className={cn(
                        "h-11 w-full rounded-full border-slate-200 text-base",
                        form.gender === g
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : "bg-white text-slate-700 hover:border-violet-200",
                      )}
                      onClick={() => onChange("gender", g)}
                    >
                      {g === "female" ? "여자" : "남자"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">생년월일시</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowZishiGuide(true)}
                    className="text-violet-600"
                  >
                    12간지 시간표
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={form.calendarType}
                    onValueChange={(v) => onChange("calendarType", v as CalendarType)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="달력" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solar">양력</SelectItem>
                      <SelectItem value="lunar">음력</SelectItem>
                      <SelectItem value="lunar-leap">음력(윤달)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    className="col-span-2 h-11 rounded-xl border-slate-200 bg-white"
                    value={form.birthDate}
                    onChange={(e) => onChange("birthDate", e.target.value)}
                  />
                </div>
                <Input
                  type="time"
                  step={60}
                  className="h-11 rounded-xl border-slate-200 bg-white"
                  value={form.birthTime}
                  onChange={(e) => onChange("birthTime", e.target.value)}
                  disabled={form.timeUnknown}
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unknown-time"
                      checked={form.timeUnknown}
                      onCheckedChange={(v) => onChange("timeUnknown", Boolean(v))}
                    />
                    <Label
                      htmlFor="unknown-time"
                      className="cursor-pointer text-sm font-semibold text-slate-700"
                    >
                      시간 모름
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowYajasiGuide(true)}
                    className="px-2 text-violet-600"
                  >
                    야자시/조자시 안내
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">도시</Label>
                <div className="relative">
                  <Input
                    placeholder="서울특별시, 대한민국"
                    value={form.locationText}
                    onChange={(e) => onChange("locationText", e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white pr-10"
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 120)}
                    onClick={() => setShowCityModal(true)}
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {filteredCities.slice(0, 5).map((city) => (
                        <button
                          type="button"
                          key={city.label}
                          className="flex w-full items-start px-3 py-2 text-left text-sm text-slate-700 hover:bg-violet-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCity(city)}
                        >
                          <div>
                            <div className="font-medium">{city.label}</div>
                            <div className="text-xs text-slate-400">
                              위도 {city.lat}, 경도 {city.lon} · {city.tzid}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredCities.length > 5 && (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-xs text-violet-700 hover:bg-violet-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowCityModal(true)}
                        >
                          더 보기 (+{filteredCities.length - 5})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 세부 설정과 빠른 테스트 섹션 제거됨 */}

              {error && (
                <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>계산 실패</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  className="h-14 w-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 text-lg text-white shadow-lg shadow-violet-200 hover:from-violet-600 hover:to-violet-700"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    "만세력 보러가기"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-slate-200 text-slate-700 hover:border-violet-200"
                  onClick={() => loadPreset("unknown")}
                >
                  저장된 만세력 불러오기
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden border-2 border-violet-100 bg-white shadow-lg">
              <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="text-slate-900">사주 결과</CardTitle>
                <p className="text-sm text-slate-600">입력 화면과 동일한 톤으로 미리 결과를 확인하세요.</p>
              </CardHeader>
              <CardContent className="space-y-6 bg-white">
              {!hasResult && (
                <p className="text-sm text-slate-500">
                  정보를 입력하고 &ldquo;만세력 보러가기&rdquo;를 누르면 사주가 표시됩니다.
                </p>
              )}

              {hasResult && (
                <div className="space-y-6">
                  <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 p-5 text-white shadow-xl shadow-violet-200/60">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
                          Premium Report
                        </p>
                        <h3 className="text-2xl font-bold leading-tight">포스텔러 스타일 리포트</h3>
                        <p className="text-sm text-violet-100">
                          입력한 생년월일·시간 기준으로 오행 균형과 신강약을 요약했어요.
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
                          일간 {dayMaster?.hanja ?? "미정"}
                        </Badge>
                        {analysisCore?.strength_label && (
                          <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
                            신강약 {analysisCore.strength_label}
                          </Badge>
                        )}
                        {dominantElement && (
                          <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur">
                            중심 오행 {ELEMENT_LABELS[dominantElement]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-violet-100">
                      <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white">
                        생년월일 {form.birthDate || "미상"}
                      </Badge>
                      <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white">
                        출생시각 {form.timeUnknown ? "미상" : form.birthTime || "00:00"}
                      </Badge>
                      <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white">
                        달력 {form.calendarType === "solar" ? "양력" : form.calendarType === "lunar" ? "음력" : "음력(윤달)"}
                      </Badge>
                      <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white">
                        타임존 {form.tzid}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-white/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">네 기둥</p>
                        <p className="text-sm text-slate-600">천간/지지를 오행 컬러로 한눈에 확인하세요.</p>
                      </div>
                      {dayMaster?.hanja && (
                        <Badge className="rounded-full bg-violet-600 px-3 py-1 text-xs text-white shadow-sm shadow-violet-200">
                          일간 {dayMaster.hanja}
                        </Badge>
                      )}
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                      {ELEMENT_ORDER.map((el) => {
                        const style = getElementStyle(el);
                        const count = fiveElementCounts[el] ?? 0;
                        return (
                          <div
                            key={el}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm",
                              style.bg,
                              style.text,
                              style.ring,
                            )}
                          >
                            <span>{ELEMENT_LABELS[el]}</span>
                            <span className="text-sm">{count}개</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {(["hour", "day", "month", "year"] as PillarKey[]).map((key) => (
                        <PillarCard
                          key={key}
                          label={PILLAR_LABELS[key]}
                          pillar={normalizedChart?.pillars[key]}
                          dayMaster={dayMaster}
                        />
                      ))}
                    </div>
                  </div>

                  <FiveElementsChart data={fiveElementSeries} highlight={dayMaster?.element ?? null} />

                  <StrengthDashboard
                    core={analysisCore}
                    usefulGods={usefulGods}
                    dayMaster={dayMaster}
                    fiveElementCounts={fiveElementCounts}
                  />

                  {result?.flags && (
                    <div className="flex flex-wrap gap-2">
                      {result.flags.usedTrueSolarTime && (
                        <Badge className="bg-violet-100 text-violet-800">진태양시 적용</Badge>
                      )}
                      {result.flags.usedFallbackEngine && (
                        <Badge className="bg-amber-100 text-amber-800">근사 엔진 사용</Badge>
                      )}
                      {result.flags.hourUnknown && (
                        <Badge variant="outline" className="border-slate-300 text-slate-600">
                          생시 미상
                        </Badge>
                      )}
                      {result.flags.locationUnknown && (
                        <Badge variant="outline" className="border-slate-300 text-slate-600">
                          장소 미상
                        </Badge>
                      )}
                    </div>
                  )}
                  {result?.meta?.note && (
                    <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-800">{result.meta.note}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      <Dialog open={showZishiGuide} onOpenChange={setShowZishiGuide}>
        <DialogContent className="max-w-md" aria-describedby="zishi-desc">
          <DialogHeader>
            <DialogTitle>12간지 시간표</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p id="zishi-desc" className="text-sm text-slate-600">
              경계 시간은 입력 시 유의해주세요. 예) 자시 → 01:20, 축시 → 03:00.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>간지</TableHead>
                  <TableHead>시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["자시", "23:30(전날) ~ 01:30"],
                  ["축시", "01:30 ~ 03:30"],
                  ["인시", "03:30 ~ 05:30"],
                  ["묘시", "05:30 ~ 07:30"],
                  ["진시", "07:30 ~ 09:30"],
                  ["사시", "09:30 ~ 11:30"],
                  ["오시", "11:30 ~ 13:30"],
                  ["미시", "13:30 ~ 15:30"],
                  ["신시", "15:30 ~ 17:30"],
                  ["유시", "17:30 ~ 19:30"],
                  ["술시", "19:30 ~ 21:30"],
                  ["해시", "21:30 ~ 23:30"],
                ].map(([label, time]) => (
                  <TableRow key={label}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell>{time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showYajasiGuide} onOpenChange={setShowYajasiGuide}>
        <DialogContent className="max-w-md" aria-describedby="yajasi-desc">
          <DialogHeader>
            <DialogTitle>야자시 / 조자시 안내</DialogTitle>
          </DialogHeader>
          <div id="yajasi-desc" className="space-y-2 text-sm text-slate-600">
            <p>
              modern 자시 정책: 23~24시는 당일, 00~01시는 다음 날 일주로 처리합니다. traditional은 23시부터
              다음 날로 넘어갑니다.
            </p>
            <p>시간/장소가 불확실하면 체크박스를 활용해 안전하게 입력하세요.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCityModal} onOpenChange={setShowCityModal}>
        <DialogContent className="max-w-3xl" aria-describedby="city-dialog-desc">
          <DialogHeader>
            <DialogTitle>도시 검색</DialogTitle>
          </DialogHeader>
          <p id="city-dialog-desc" className="text-sm text-slate-600">
            도시명을 입력하거나 목록에서 선택해주세요.
          </p>
          <div className="space-y-4">
            <Input
              autoFocus
              placeholder="도시명을 입력하세요 (예: 서울, 부산, 도쿄, New York)"
              value={form.locationText}
              onChange={(e) => onChange("locationText", e.target.value)}
              className="h-11"
            />
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              {filteredCities.map((city) => (
                <button
                  key={city.label}
                  type="button"
                  className="flex w-full items-start px-4 py-3 text-left hover:bg-violet-50"
                  onClick={() => selectCity(city)}
                >
                  <div>
                    <div className="font-medium text-slate-800">{city.label}</div>
                    <div className="text-xs text-slate-500">
                      위도 {city.lat}, 경도 {city.lon} · {city.tzid}
                    </div>
                  </div>
                </button>
              ))}
              {filteredCities.length === 0 && (
                <p className="px-4 py-6 text-sm text-slate-500">검색 결과가 없습니다.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PillarCard = ({
  label,
  pillar,
  dayMaster,
}: {
  label: string;
  pillar?: ChartPillar | null;
  dayMaster?: ChartElement | null;
}) => {
  const stem = pillar?.stem;
  const branch = pillar?.branch;
  const isDayPillar = label.includes("일");

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-sm shadow-violet-50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {isDayPillar && dayMaster?.hanja && (
          <Badge className="rounded-full bg-violet-600 px-2 py-1 text-[11px] text-white shadow-sm shadow-violet-200">
            일간 {dayMaster.hanja}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PillarCharacter character={stem} subtitle="천간" />
        <PillarCharacter character={branch} subtitle="지지" />
      </div>
    </div>
  );
};

const PillarCharacter = ({
  character,
  subtitle,
}: {
  character: ChartElement | null | undefined;
  subtitle: string;
}) => {
  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-slate-400">
        <span className="text-2xl">?</span>
        <span className="text-[11px]">{subtitle}</span>
      </div>
    );
  }

  const style = getElementStyle(character.element);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white/70 p-3 text-center ring-2",
        style.bg,
        style.ring,
      )}
    >
      <Badge
        className={cn(
          "absolute left-1/2 top-2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm",
          style.badge,
        )}
      >
        {character.tenGod ?? "십신 분석"}
      </Badge>
      <div className="pt-6">
        <div className={cn("text-4xl font-bold leading-tight", style.text)}>
          {character.hanja ?? "?"}
        </div>
        <div className="text-xs text-slate-500">
          {character.pronunciation ?? character.hangul ?? character.code ?? ""}
        </div>
        <p className={cn("mt-1 text-[11px] font-semibold uppercase tracking-wide", style.subtle)}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

const FiveElementsChart = ({
  data,
  highlight,
}: {
  data: { key: FiveElement; label: string; value: number }[];
  highlight: FiveElement | null;
}) => {
  const maxValue = Math.max(...data.map((d) => d.value ?? 0), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-sm shadow-violet-50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">오행 분포</p>
          <p className="text-sm text-slate-600">목·화·토·금·수의 균형을 Radar 차트로 시각화합니다.</p>
        </div>
        {highlight && (
          <Badge className={cn("rounded-full px-3", getElementStyle(highlight).badge)}>
            일간 오행: {ELEMENT_LABELS[highlight]}
          </Badge>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <defs>
                <linearGradient id="five-elements" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} tick={{ fill: "#cbd5e1" }} domain={[0, Math.max(maxValue, 1)]} />
              <Radar dataKey="value" stroke="#7c3aed" fill="url(#five-elements)" fillOpacity={0.75} />
              <RechartsTooltip
                formatter={(value: number, _name, props) => [`${value}개`, props.payload?.label ?? ""]}
                contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item) => {
            const style = getElementStyle(item.key);
            const percent = Math.round((item.value / Math.max(maxValue, 1)) * 100);
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    style.bg,
                    style.text,
                  )}
                >
                  {ELEMENT_LABELS[item.key]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {ELEMENT_LABELS[item.key]} · {item.value}개
                    </span>
                    <span className={cn("font-semibold", style.subtle)}>{percent}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className={cn("h-2 rounded-full", style.bg)}
                      style={{ width: `${Math.min(100, (item.value / Math.max(maxValue, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StrengthDashboard = ({
  core,
  usefulGods,
  dayMaster,
  fiveElementCounts,
}: {
  core?: AnalysisResult["core"];
  usefulGods: UsefulGod[];
  dayMaster?: ChartElement | null;
  fiveElementCounts: Record<FiveElement, number>;
}) => {
  const highlightElement = core?.strength_element ?? dayMaster?.element ?? null;
  const coreLabel = core?.strength_label ?? "신강약 분석 대기";
  const scoreText =
    core?.strength_score !== undefined && core?.strength_score !== null
      ? `점수: ${core.strength_score}`
      : null;
  const summary =
    core?.summary ??
    (dayMaster?.hanja
      ? `당신의 일간은 ${dayMaster.hanja}(${dayMaster.pronunciation ?? ""}) 입니다.`
      : "룰엔진 결과가 도착하면 신강/신약 요약이 표시됩니다.");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-md md:col-span-1">
        <p className="text-sm font-semibold text-violet-100">신강약</p>
        <p className="text-2xl font-bold leading-tight">{coreLabel}</p>
        {scoreText && <p className="text-sm text-violet-100">{scoreText}</p>}
        <p className="mt-3 text-sm text-violet-50">{summary}</p>
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm md:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">용신 / 균형 카드</p>
          {highlightElement && (
            <Badge className={cn("rounded-full px-3 text-xs", getElementStyle(highlightElement).badge)}>
              포인트 오행: {ELEMENT_LABELS[highlightElement]}
            </Badge>
          )}
        </div>
        {usefulGods.length === 0 ? (
          <p className="text-sm text-slate-500">룰엔진 결과가 들어오면 용신/희신이 카드로 표시됩니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {usefulGods.map((god) => {
              const style = getElementStyle(god.element);
              return (
                <div
                  key={`${god.name}-${god.element ?? "unknown"}`}
                  className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-slate-800">{god.name}</div>
                    {god.element && (
                      <Badge className={cn("rounded-full px-2 text-[11px]", style.badge)}>
                        {ELEMENT_LABELS[god.element]}
                      </Badge>
                    )}
                  </div>
                  {god.score !== undefined && god.score !== null && (
                    <p className="text-xs text-slate-500">점수: {god.score}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {god.description ?? "오행 균형을 돕는 보조 기운입니다."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600">
          오행 분포 ·{" "}
          {ELEMENT_ORDER.map((el) => `${ELEMENT_LABELS[el]} ${fiveElementCounts[el] ?? 0}`).join(" / ")}
        </div>
      </div>
    </div>
  );
};

export default BaziTestPage;
