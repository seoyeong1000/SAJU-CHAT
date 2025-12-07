"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { GUEST_SAJU_STORAGE_KEY, PENDING_ACTION_STORAGE_KEY } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";
import { FiveElement, PillarInfo, PillarKey, SajuResultPayload } from "@/types/saju";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  Compass,
  DollarSign,
  Info,
  Palette,
  Printer,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";

const ELEMENT_LABEL: Record<FiveElement, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const ELEMENT_HANJA: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const PILLAR_LABEL: Record<PillarKey, string> = {
  hour: "시주",
  day: "일주",
  month: "월주",
  year: "연주",
};

const TENGOD_FRIENDLY: Record<string, { label: string; meaning: string }> = {
  비견: { label: "협력자형", meaning: "동료와 함께할 때 힘이 납니다." },
  겁재: { label: "경쟁자형", meaning: "경쟁 속에서 성장합니다." },
  식신: { label: "표현가형", meaning: "아이디어를 실행에 옮깁니다." },
  상관: { label: "도전가형", meaning: "새로운 걸 시도하며 앞서갑니다." },
  편재: { label: "사업가형", meaning: "기회를 포착하고 확장합니다." },
  정재: { label: "재물관리형", meaning: "안정적으로 재물을 지킵니다." },
  편관: { label: "도전형 리더", meaning: "위기 속에서 실력을 발휘합니다." },
  정관: { label: "책임형 리더", meaning: "원칙과 책임감을 중시합니다." },
  편인: { label: "창의력형", meaning: "배움과 연구에 강합니다." },
  정인: { label: "후원자형", meaning: "돌봄과 지원을 잘합니다." },
};

const ELEMENT_COLORS: Record<
  FiveElement,
  { text: string; soft: string; bar: string; gradient: string; ring: string }
> = {
  wood: {
    text: "text-emerald-600",
    soft: "bg-emerald-50",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    gradient: "from-emerald-400 to-emerald-600",
    ring: "ring-emerald-200",
  },
  fire: {
    text: "text-red-500",
    soft: "bg-red-50",
    bar: "bg-gradient-to-r from-red-400 to-red-600",
    gradient: "from-red-400 to-red-600",
    ring: "ring-red-200",
  },
  earth: {
    text: "text-amber-600",
    soft: "bg-amber-50",
    bar: "bg-gradient-to-r from-amber-300 to-amber-500",
    gradient: "from-amber-300 to-amber-500",
    ring: "ring-amber-200",
  },
  metal: {
    text: "text-slate-700",
    soft: "bg-slate-100",
    bar: "bg-gradient-to-r from-slate-300 to-slate-500",
    gradient: "from-slate-300 to-slate-500",
    ring: "ring-slate-200",
  },
  water: {
    text: "text-blue-600",
    soft: "bg-blue-50",
    bar: "bg-gradient-to-r from-blue-400 to-blue-600",
    gradient: "from-blue-400 to-blue-600",
    ring: "ring-blue-200",
  },
};
const MOCK_RESULT: SajuResultPayload = {
  name: "서영",
  birthDate: "1988-08-28",
  birthTime: "08:00",
  gender: "female",
  zodiacText: "병신(붉은원숭이)년",
  pillars: {
    hour: {
      stem: "庚",
      branch: "子",
      element: "metal",
      branchElement: "water",
      tenGod: "정재",
      hiddenStem: "계수",
      twelveSpirit: "목욕",
      twelveKiller: "재살",
      auspicious: "천덕귀인",
      inauspicious: "혈인",
    },
    day: {
      stem: "戊",
      branch: "寅",
      element: "earth",
      branchElement: "wood",
      tenGod: "비견",
      hiddenStem: "갑병무",
      twelveSpirit: "건록",
      twelveKiller: "장성살",
      auspicious: "문창귀인",
    },
    month: {
      stem: "乙",
      branch: "酉",
      element: "wood",
      branchElement: "metal",
      tenGod: "편인",
      hiddenStem: "신금",
      twelveSpirit: "관대",
      twelveKiller: "백호살",
    },
    year: {
      stem: "丙",
      branch: "申",
      element: "fire",
      branchElement: "metal",
      tenGod: "편재",
      hiddenStem: "경임무",
      twelveSpirit: "목욕",
      twelveKiller: "육해살",
    },
  },
  sipseong: {
    hour: "정재",
    day: "비견",
    month: "편인",
    year: "편재",
  },
  woonsung: {
    hour: "목욕",
    day: "건록",
    month: "관대",
    year: "목욕",
  },
  inmyeonggang: 89,
  analysis: {
    strengthIndex: 62,
    strengthLabel: "중간-신강",
    fiveElementDetail: {
      wood: 15,
      fire: 20,
      earth: 25,
      metal: 15,
      water: 25,
    },
    tenGodSummary: "재물 관리형 + 협력자형 성향이 강합니다.",
  },
  ohangScores: {
    wood: 65,
    fire: 88,
    earth: 72,
    metal: 55,
    water: 40,
  },
  balance: {
    geumun: 75,
    seongsaundong: 62,
  },
};

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

type CtaAction = "save" | "consult";

const parseResultFromSearch = (raw?: string | null): SajuResultPayload | null => {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded) as SajuResultPayload;
  } catch {
    return null;
  }
};

const getFriendlyTenGod = (name?: string | null): { title: string; detail: string } => {
  if (!name) return { title: "관계 미정", detail: "추가 정보가 오면 설명해드릴게요." };
  const friendly = TENGOD_FRIENDLY[name];
  if (friendly) return { title: friendly.label, detail: friendly.meaning };
  return { title: `${name} (관계)`, detail: "나와의 관계를 나타내는 기운입니다." };
};
const DonutChart = ({
  label,
  value,
  colorClass,
  trackColor = "#E5E7EB",
}: {
  label: string;
  value: number;
  colorClass: string;
  trackColor?: string;
}) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value) / 100;
  const dash = progress * circumference;

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-3 h-36 w-36">
        <svg className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={radius} stroke={trackColor} strokeWidth="16" fill="none" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className={cn(colorClass, "transition-all duration-500")}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 rotate-90">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xl font-semibold text-slate-900">{value.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const SajuResultPage = () => {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const supabase = useClerkSupabaseClient();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { openSignIn } = useClerk();

  const [resultData, setResultData] = useState<SajuResultPayload | null>(
    () => parseResultFromSearch(dataParam) ?? null,
  );
  const [ctaStatus, setCtaStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const [showLongFortune, setShowLongFortune] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  const data = resultData ?? MOCK_RESULT;
  const { name, birthDate, birthTime, zodiacText, pillars, ohangScores } = data;

  useEffect(() => {
    const parsed = parseResultFromSearch(dataParam);
    if (parsed) {
      setResultData(parsed);
      try {
        localStorage.setItem(GUEST_SAJU_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // ignore localStorage errors
      }
      return;
    }

    if (typeof window !== "undefined") {
      const storedRaw = localStorage.getItem(GUEST_SAJU_STORAGE_KEY);
      if (storedRaw) {
        try {
          setResultData(JSON.parse(storedRaw) as SajuResultPayload);
          return;
        } catch {
          // ignore parse errors
        }
      }
    }

    setResultData(MOCK_RESULT);
  }, [dataParam]);

  const persistResult = useCallback(
    async (action: CtaAction) => {
      if (!resultData || !userId) {
        setCtaStatus("error");
        setCtaMessage("저장할 사주 정보나 사용자 정보를 찾지 못했습니다.");
        return;
      }

      setCtaStatus("pending");
      setCtaMessage(
        action === "save" ? "사주 결과를 저장하고 있어요..." : "상담 준비용으로 저장 중입니다...",
      );
      const { error } = await supabase.from("bazi_saved_results").insert({
        clerk_id: userId,
        source_action: action,
        payload: resultData,
      });

      if (error) {
        setCtaStatus("error");
        setCtaMessage("DB 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setCtaStatus("success");
      setCtaMessage(
        action === "save"
          ? "방금 본 사주가 내 계정에 저장됐어요."
          : "상담용 사주 정보를 저장했어요. 채팅을 시작하세요!",
      );
      try {
        localStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
      } catch {
        // ignore
      }
    },
    [resultData, supabase, userId],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !resultData) return;
    const pending =
      typeof window !== "undefined" ? localStorage.getItem(PENDING_ACTION_STORAGE_KEY) : null;
    if (pending === "save" || pending === "consult") {
      void persistResult(pending);
    }
  }, [isLoaded, isSignedIn, persistResult, resultData]);

  const handleAction = async (action: CtaAction) => {
    if (!resultData) return;

    try {
      localStorage.setItem(GUEST_SAJU_STORAGE_KEY, JSON.stringify(resultData));
      localStorage.setItem(PENDING_ACTION_STORAGE_KEY, action);
    } catch {
      // ignore
    }

    if (!isLoaded) {
      setCtaStatus("pending");
      setCtaMessage("로그인 상태를 확인하고 있어요...");
      return;
    }

    if (!isSignedIn) {
      openSignIn({ redirectUrl: window.location.href });
      return;
    }

    await persistResult(action);
  };

  const hasKillerData = useMemo(
    () =>
      Object.values(pillars).some(
        (p) => p.twelveKiller || p.auspicious || p.inauspicious || p.twelveSpirit,
      ),
    [pillars],
  );

  const monthScores = [65, 72, 68, 85, 90, 88, 75, 82, 78, 70, 80, 85];

  const bigLuck = [
    { label: "10대", years: "2008-2017", ganji: "임오", mood: "탐색기", color: "text-blue-600" },
    { label: "20대", years: "2018-2027", ganji: "계미", mood: "성장기", color: "text-emerald-600" },
    { label: "30대", years: "2028-2037", ganji: "갑신", mood: "전성기", color: "text-violet-600" },
    { label: "40대", years: "2038-2047", ganji: "을유", mood: "확장기", color: "text-amber-600" },
    { label: "50대", years: "2048-2057", ganji: "병술", mood: "안정기", color: "text-slate-700" },
    { label: "60대", years: "2058-2067", ganji: "정해", mood: "정리·준비", color: "text-pink-600" },
    { label: "70대", years: "2068-2077", ganji: "무자", mood: "회고·여유", color: "text-teal-600" },
    { label: "80대", years: "2078-2087", ganji: "기축", mood: "여유", color: "text-slate-600" },
    { label: "90대", years: "2088-2097", ganji: "경인", mood: "안정", color: "text-slate-600" },
    { label: "100세", years: "2098-2107", ganji: "신묘", mood: "안정", color: "text-slate-600" },
  ];
  const visibleBigLuck = showLongFortune ? bigLuck : bigLuck.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");
        * {
          font-family: "Pretendard Variable", "Pretendard", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      `}</style>

      <header className="bg-gradient-to-br from-violet-50 to-purple-50 border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            <AvatarFallback className="bg-violet-500 text-xl font-bold text-white">
              {name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{name}님의 사주</h1>
            <p className="mt-1 text-sm text-slate-600">
              {birthDate} {birthTime} 출생 · {data.gender === "female" ? "여자" : "남자"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-violet-100 text-violet-700">{zodiacText ?? "간지 정보"}</Badge>
              <Badge className="bg-amber-100 text-amber-700">토(土) 일주</Badge>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 print:space-y-4">
        {/* 내 사주팔자 (만세력 핵심 정보) */}
        <Card className="border-2 border-violet-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
            <CardTitle className="text-center text-xl">내 사주팔자</CardTitle>
            <p className="text-center text-sm text-slate-600">
              천간/지지 · 지장간 · 12운성 · 12신살 · 길성/흉성을 한눈에 볼 수 있어요.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">구분</th>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => (
                      <th
                        key={`head-${key}`}
                        className={cn(
                          "px-4 py-3 text-center text-xs font-semibold text-slate-700",
                          key === "day" && "text-violet-700",
                        )}
                      >
                        {PILLAR_LABEL[key]}
                        {key === "day" && <span className="ml-1 text-[11px] text-violet-600">⭐ 본인</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">천간·십성</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      const tg = getFriendlyTenGod(p.tenGod);
                      const element = p.element;
                      const palette = ELEMENT_COLORS[element];
                      return (
                        <td key={`stem-${key}`} className="px-4 py-3 text-center">
                          <div
                            className={cn(
                              "inline-flex flex-col items-center justify-center rounded-xl border px-3 py-2",
                              palette.soft,
                              palette.text,
                              "border-slate-200 shadow-sm",
                            )}
                          >
                            <div className="text-3xl font-bold">{p.stem}</div>
                            <div className="text-xs font-semibold uppercase text-slate-600">
                              {ELEMENT_HANJA[element]} / {ELEMENT_LABEL[element]}
                            </div>
                            <div className="mt-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700 shadow-inner">
                              {tg.title}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">지지·십성</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      const tg = getFriendlyTenGod(p.tenGodBranch ?? p.tenGod);
                      const branchElement = p.branchElement ?? p.element;
                      const palette = ELEMENT_COLORS[branchElement];
                      return (
                        <td key={`branch-${key}`} className="px-4 py-3 text-center">
                          <div
                            className={cn(
                              "inline-flex flex-col items-center justify-center rounded-xl border px-3 py-2",
                              palette.soft,
                              palette.text,
                              "border-slate-200 shadow-sm",
                            )}
                          >
                            <div className="text-3xl font-bold">{p.branch}</div>
                            <div className="text-xs font-semibold uppercase text-slate-600">
                              {ELEMENT_HANJA[branchElement]} / {ELEMENT_LABEL[branchElement]}
                            </div>
                            <div className="mt-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700 shadow-inner">
                              {tg.title}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">지장간</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      return (
                        <td key={`hidden-${key}`} className="px-4 py-3 text-center text-xs text-slate-700">
                          {p.hiddenStem ?? "지장간 없음"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">12운성</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      return (
                        <td key={`spirit-${key}`} className="px-4 py-3 text-center text-xs text-slate-700">
                          {p.twelveSpirit ?? "미제공"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">12신살</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      return (
                        <td key={`killer-${key}`} className="px-4 py-3 text-center text-xs text-slate-700">
                          {p.twelveKiller ?? "없음"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">길성/흉성</td>
                    {(Object.keys(pillars) as PillarKey[]).map((key) => {
                      const p = pillars[key];
                      return (
                        <td key={`goodbad-${key}`} className="px-4 py-3 text-center text-[11px] text-slate-700">
                          <div className="text-emerald-700">{p.auspicious ?? "길성 없음"}</div>
                          <div className="text-rose-600">{p.inauspicious ?? "흉성 없음"}</div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4 pt-3 text-xs text-slate-600">
              신강/신약은 내 기운의 강약을 뜻해요. 신강이면 스스로 주도적으로 움직이고, 신약이면 주변 도움과 균형 잡기가 더 중요합니다.
              점수형 요약은 상세 사주풀이에서 확인할 수 있습니다.
            </div>
            <div className="px-4 pb-4">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setShowGlossary((prev) => !prev)}
              >
                {showGlossary ? "용어 설명 닫기" : "용어 설명 보기"}
              </Button>
              {showGlossary && (
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  <li>천간: 하늘 기운, 겉으로 드러난 성향</li>
                  <li>지지: 땅의 기운, 뿌리/환경</li>
                  <li>지장간: 지지 속에 숨은 보조 기운</li>
                  <li>12운성: 삶의 단계 흐름(목욕·건록 등)</li>
                  <li>12신살: 길흉을 나타내는 별자리(재살·장성살 등)</li>
                  <li>길성/흉성: 도움을 주는 기운 / 주의해야 할 기운</li>
                </ul>
              )}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2 px-4 pb-4 pt-3">
              {hasKillerData ? (
                (Object.keys(pillars) as PillarKey[]).map((key) => {
                  const p = pillars[key];
                  const killer = p.twelveKiller;
                  const spirit = p.twelveSpirit;
                  const ausp = p.auspicious;
                  const inausp = p.inauspicious;
                  return (
                    <div
                      key={`highlight-${key}`}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                    >
                      <span className="font-semibold text-slate-700">{PILLAR_LABEL[key]}</span>
                      {killer && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">{killer}</span>}
                      {spirit && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">{spirit}</span>}
                      {ausp && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">{ausp}</span>}
                      {inausp && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{inausp}</span>
                      )}
                      {!killer && !spirit && !ausp && !inausp && (
                        <span className="text-slate-500">표시할 데이터 없음</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-sm text-slate-700">
                  아직 분석 데이터가 없어요. ‘상세 사주풀이’에서 요청하기.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        {/* 내 성격과 재능 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">🎯 내 성격과 재능</CardTitle>
            <p className="mt-2 text-sm text-slate-600">사주로 본 나의 타고난 특성입니다</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">협력자형</div>
                    <div className="text-xs text-blue-600">비견(나와 같은 기운)</div>
                  </div>
                </div>
                <p className="text-sm text-blue-800">팀워크를 중시하고 동료들과 잘 협력합니다.</p>
              </div>
              <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900">재물관리형</div>
                    <div className="text-xs text-emerald-600">정재(재물운)</div>
                  </div>
                </div>
                <p className="text-sm text-emerald-800">돈을 안정적으로 관리하고 저축을 잘합니다.</p>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-900">창의력형</div>
                    <div className="text-xs text-purple-600">편인(학습/연구)</div>
                  </div>
                </div>
                <p className="text-sm text-purple-800">새로운 것을 배우고 창의적으로 생각합니다.</p>
              </div>
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900">사업가형</div>
                    <div className="text-xs text-amber-600">편재(사업/기회)</div>
                  </div>
                </div>
                <p className="text-sm text-amber-800">사업 감각이 좋고 기회를 잘 포착합니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 나에게 좋은 것들 */}
        <Card className="shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl">✨ 나에게 좋은 것들</CardTitle>
            <p className="mt-2 text-sm text-slate-600">이런 것들을 가까이하면 운이 좋아집니다</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-slate-900">행운의 색상</span>
              </div>
              <div className="flex gap-2">
                <div className="h-12 w-12 rounded-full border-2 border-white shadow" style={{ backgroundColor: "#3B82F6" }} />
                <div className="h-12 w-12 rounded-full border-2 border-white shadow" style={{ backgroundColor: "#10B981" }} />
                <div className="h-12 w-12 rounded-full border-2 border-white shadow" style={{ backgroundColor: "#111827" }} />
              </div>
              <p className="mt-2 text-xs text-slate-600">수(水), 목(木) 계열 색상</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Compass className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-slate-900">행운의 방향</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-4xl">🧭</div>
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-slate-700">북쪽, 동쪽</p>
              <p className="mt-1 text-center text-xs text-slate-600">중요한 일은 이 방향에서</p>
            </div>
            <div className="col-span-1 rounded-lg bg-white p-4 md:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-slate-900">어울리는 직업</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                  교육/강사
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  IT/기술
                </Badge>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  의료/건강
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  예술/디자인
                </Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  경영/사업
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* 월별 흐름 */}
        {/* 월별 흐름 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">2024년 월별 운세 흐름</CardTitle>
            <p className="mt-2 text-sm text-slate-600">이번 달이 어떤지 한눈에 확인하세요</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex h-48 items-end justify-between gap-2">
              {["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"].map(
                (month, idx) => {
                  const score = monthScores[idx];
                  const isCurrent = idx === new Date().getMonth();
                  return (
                    <div key={month} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all",
                          isCurrent
                            ? "bg-gradient-to-t from-violet-500 to-purple-500 shadow-lg"
                            : "bg-gradient-to-t from-violet-200 to-purple-300",
                        )}
                        style={{ height: `${score}%` }}
                      />
                      <span className={cn("text-xs", isCurrent ? "font-bold text-violet-600" : "text-slate-600")}>
                        {month}
                      </span>
                      {isCurrent && <span className="text-[11px] font-semibold text-violet-600">현재</span>}
                    </div>
                  );
                },
              )}
            </div>
            <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
              <p className="mb-1 text-sm font-semibold text-violet-900">이번 달 운세</p>
              <p className="text-sm text-violet-800">이번 달은 새로운 기회가 많은 달입니다. 적극적으로 도전해보세요!</p>
            </div>
          </CardContent>
        </Card>

        {/* 전문가용 상세 정보 */}
        <Collapsible>
          <Card className="shadow-lg">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex cursor-pointer flex-row items-center justify-between hover:bg-slate-50">
                <div>
                  <CardTitle className="text-left text-lg">전문가용 상세 정보</CardTitle>
                  <p className="mt-1 text-left text-sm text-slate-600">궁금하면 펼쳐보세요. 상담에서 더 깊게 안내합니다.</p>
                </div>
                <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 border-t">
                <div className="space-y-3">
                  <h4 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
                    <Calendar className="h-5 w-5 text-violet-600" />
                    인생 운세 주기 (대운)
                  </h4>
                  <p className="text-sm text-slate-600">10~60세 핵심 구간을 먼저 보여드려요. 더 보고 싶으면 펼쳐주세요.</p>
                  <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    {visibleBigLuck.map((item, idx) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm",
                          idx === 2 && "border-violet-200 bg-violet-50 text-violet-700",
                        )}
                      >
                        {item.label} ({item.years})
                      </div>
                    ))}
                    {!showLongFortune && (
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 shadow-sm hover:bg-slate-100"
                        onClick={() => setShowLongFortune(true)}
                      >
                        70세 이후 보기
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {visibleBigLuck.map((item, idx) => (
                      <div
                        key={`${item.label}-${item.ganji}`}
                        className={cn(
                          "rounded-lg bg-slate-50 p-3 text-center shadow-sm",
                          idx === 2 && "border-2 border-violet-300 bg-violet-50",
                        )}
                      >
                        <div className="mb-1 text-xs text-slate-600">
                          {item.label} ({item.years})
                        </div>
                        <div className="font-semibold text-slate-900">{item.ganji}</div>
                        <div className={cn("text-xs", item.color)}>{item.mood}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                    오행 균형 상세
                  </h4>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-700">
                      수(水) 기운이 50%로 가장 강하고, 토(土) 기운이 25%로 그 다음입니다. 금(金)과 목(木) 기운이 부족하므로
                      파란색, 초록색 옷이나 소품을 가까이하면 좋습니다.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-violet-700">여기서 더 궁금해요</p>
                    <p className="text-sm text-slate-800">
                      커리어 방향, 투자 시기, 이직 타이밍 등 맞춤 질문을 남기면 상담사가 추가 풀이를 준비합니다.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-amber-700">한 끗 차이 팁</p>
                    <p className="text-sm text-slate-800">
                      부족한 오행을 채우는 컬러·공간·습관을 조합해드립니다. 예: 파란색 소품+아침 물 한 컵 루틴.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-emerald-700">다음 상담 준비</p>
                    <ul className="space-y-1 text-sm text-slate-800">
                      <li>- 최근 고민 1~2개 적어두기</li>
                      <li>- 선택지(이직/투자/연애) 정리</li>
                      <li>- 원하는 시점(달/분기) 표시</li>
                    </ul>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-indigo-700">전성기 타이머</p>
                    <p className="text-2xl font-bold text-indigo-700">전성기까지 D-420일</p>
                    <p className="mt-1 text-sm text-slate-700">30대 초반에 큰 기회가 옵니다. 지금부터 준비하세요.</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                      <li>- 올해 목표 3개만 집중</li>
                      <li>- 멘토 1명 섭외</li>
                      <li>- 불필요한 소비 줄이기</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-amber-700">맞춤 제안 받고 싶다면</p>
                    <p className="text-sm text-slate-800">“직업/이직/투자/연애” 중 하나를 선택하면 상담사가 물어볼 핵심 질문 3개를 만들어드립니다.</p>
                    <Button className="mt-3 h-10 w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
                      맞춤 질문 3개 받기
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-slate-700">실수 예방 체크리스트</p>
                    <ul className="space-y-1 text-sm text-slate-800">
                      <li>- 큰 계약 전에 하루 더 숙려</li>
                      <li>- 가족·연인 의사 먼저 듣기</li>
                      <li>- 잠 부족하면 결정 미루기</li>
                      <li>- 한 달 예산 초과 시 소비 중단</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-violet-700">한 줄 Q&A 예시</p>
                    <ul className="space-y-1 text-sm text-slate-800">
                      <li>Q. 내년 이직, 언제가 좋을까요?</li>
                      <li className="text-xs text-slate-600">→ 3~4월 추천, 7월 이후는 속도 조절</li>
                      <li>Q. 올해 투자 방향은?</li>
                      <li className="text-xs text-slate-600">→ 안전자산 비중 확대, 9월 이후 분할 접근</li>
                      <li>Q. 연애운이 궁금해요.</li>
                      <li className="text-xs text-slate-600">→ 8~10월 소개팅/소개 자리에 행운</li>
                    </ul>
                  </div>
                </div>

              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 하단 액션 - 정리된 CTA */}
        <section className="sticky bottom-0 z-10 bg-white/95 pb-6 pt-3 backdrop-blur print:static">
          <div className="mx-auto max-w-5xl space-y-3">
            <Button
              size="lg"
              className="h-14 w-full text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:from-violet-700 hover:to-purple-700"
              onClick={() => handleAction("consult")}
              disabled={ctaStatus === "pending"}
            >
              AI 상담하기
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-full text-lg font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:from-pink-600 hover:to-rose-600"
              onClick={() => handleAction("save")}
              disabled={ctaStatus === "pending"}
            >
              저장하기
            </Button>
            {ctaMessage && (
              <p
                className={cn(
                  "text-center text-sm",
                  ctaStatus === "error" ? "text-rose-600" : "text-slate-700",
                )}
              >
                {ctaMessage}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-12">
                <Share2 className="mr-1 h-4 w-4" />
                친구에게 공유
              </Button>
              <Button variant="outline" size="sm" className="h-12">
                <Printer className="mr-1 h-4 w-4" />
                인쇄/저장
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SajuResultPage;
