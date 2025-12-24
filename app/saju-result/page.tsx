"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import type { CSSProperties } from "react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { GUEST_SAJU_STORAGE_KEY, PENDING_ACTION_STORAGE_KEY } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";
import { FiveElement, PillarInfo, PillarKey, SajuResultPayload } from "@/types/saju";
import { BarChart3, MessageCircle, Sparkles, Zap } from "lucide-react";

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

type TabKey = "summary" | "love" | "career" | "wealth" | "health";

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

const DOMAIN_BY_TAB: Record<TabKey, string> = {
  summary: "general",
  love: "love",
  career: "career",
  wealth: "wealth",
  health: "health",
};

const SOLUTION_CHECK_KEY = "saju_solution_checks";

type InterpretationRecord = {
  id: string;
  title?: string | null;
  content?: string | null;
  trust_level?: string | null;
  domain?: string | null;
  layer?: string | null;
};

type SolutionRecord = {
  id: string;
  title?: string | null;
  content?: string | null;
  difficulty?: string | null;
  time_required?: string | null;
  severity?: string | null;
};

const ELEMENT_THEME: Record<FiveElement, { tone: string; glow: string; text: string; bg: string }> = {
  wood: {
    tone: "#34d399",
    glow: "shadow-[0_10px_30px_rgba(52,211,153,0.35)]",
    text: "text-emerald-400",
    bg: "bg-emerald-400/20",
  },
  fire: {
    tone: "#fb7185",
    glow: "shadow-[0_10px_30px_rgba(251,113,133,0.35)]",
    text: "text-rose-400",
    bg: "bg-rose-400/20",
  },
  earth: {
    tone: "#fbbf24",
    glow: "shadow-[0_10px_30px_rgba(251,191,36,0.35)]",
    text: "text-amber-400",
    bg: "bg-amber-400/20",
  },
  metal: {
    tone: "#cbd5e1",
    glow: "shadow-[0_10px_30px_rgba(148,163,184,0.35)]",
    text: "text-slate-300",
    bg: "bg-slate-400/20",
  },
  water: {
    tone: "#60a5fa",
    glow: "shadow-[0_10px_30px_rgba(96,165,250,0.35)]",
    text: "text-blue-400",
    bg: "bg-blue-400/20",
  },
};

const DEFAULT_CONTENT: Record<TabKey, { interpretations: InterpretationRecord[]; solutions: SolutionRecord[] }> = {
  summary: {
    interpretations: [
      {
        id: "default-summary-intp-1",
        title: "오행 불균형 경향",
        content:
          "목(Wood) 기운이 강하여 시작하고 키우는 힘은 뛰어나지만, 금(Metal) 기운이 약해 마무리·정리·절제가 부족해질 수 있습니다.",
        trust_level: "high",
      },
      {
        id: "default-summary-intp-2",
        title: "일간 기질 포인트",
        content:
          "일간(Day Master)은 추진력이 좋으나, 스스로에게 관대해 흐트러짐이 올 수 있습니다. 금 기운 보완 시 일관성과 단호함이 살아납니다.",
        trust_level: "high",
      },
    ],
    solutions: [
      {
        id: "default-summary-sol-1",
        title: "금 기운 보완 루틴",
        content: "흰색/메탈릭 계열 소품을 책상에 두고, 하루 한 번 ‘거절/정리’ 연습을 해보세요.",
      },
      {
        id: "default-summary-sol-2",
        title: "마무리 근육 강화",
        content: "작은 업무 3건을 오늘 안에 완결 짓는 ‘완료 세트’를 실행해 흐름을 닫는 습관을 만듭니다.",
      },
    ],
  },
  love: {
    interpretations: [
      {
        id: "default-love-intp-1",
        title: "감정 교류 확장",
        content: "정서적 교감이 잘 이뤄지는 시기입니다. 솔직한 대화가 관계를 진전시킵니다.",
        trust_level: "high",
      },
    ],
    solutions: [
      {
        id: "default-love-sol-1",
        title: "하루 15분 감정 나누기",
        content: "하루 한 번, 감사했던 일을 서로 나누며 신뢰를 쌓으세요.",
      },
    ],
  },
  career: {
    interpretations: [
      {
        id: "default-career-intp-1",
        title: "가시화가 필요한 시점",
        content: "성과를 눈에 보이게 정리하면 주변의 지지가 늘어납니다.",
        trust_level: "high",
      },
    ],
    solutions: [
      {
        id: "default-career-sol-1",
        title: "1페이지 보고서 작성",
        content: "이번 주 핵심 성과를 1페이지로 요약해 공유하세요.",
      },
      {
        id: "default-career-sol-2",
        title: "멘토 1명에게 피드백",
        content: "신뢰하는 동료나 멘토에게 초안 피드백을 요청하세요.",
      },
    ],
  },
  wealth: {
    interpretations: [
      {
        id: "default-wealth-intp-1",
        title: "현금 흐름 점검기",
        content: "고정비와 변동비를 다시 점검하면 재물운이 안정됩니다.",
        trust_level: "high",
      },
    ],
    solutions: [
      {
        id: "default-wealth-sol-1",
        title: "구독/정기결제 정리",
        content: "사용하지 않는 구독을 해지하고 자동이체 비율을 조정하세요.",
      },
    ],
  },
  health: {
    interpretations: [
      {
        id: "default-health-intp-1",
        title: "회복 리듬 형성",
        content: "잠과 수분 관리가 컨디션을 지탱합니다. 리듬을 고정하세요.",
        trust_level: "high",
      },
    ],
    solutions: [
      {
        id: "default-health-sol-1",
        title: "취침 루틴 고정",
        content: "취침 1시간 전 불빛을 줄이고 미지근한 물 한 컵을 마십니다.",
      },
      {
        id: "default-health-sol-2",
        title: "10분 스트레칭",
        content: "아침/저녁 10분 스트레칭으로 순환을 돕습니다.",
      },
    ],
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
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value) / 100;
  const dash = progress * circumference;

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-4 h-36 w-36 text-slate-600">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            className="opacity-25"
            fill="none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            stroke={tone}
            className="drop-shadow-[0_0_16px_var(--ring)] transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
            <div className="text-2xl font-semibold text-slate-50">{value.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PillarCard = ({ pillarKey, pillar }: { pillarKey: PillarKey; pillar: PillarInfo }) => {
  const theme = ELEMENT_THEME[pillar.element];
  const friendly = getFriendlyTenGod(pillar.tenGod);
  const style = { "--tone": theme.tone } as CSSProperties;
  const hanjaKey = pillar.branchElement ?? pillar.element;

  return (
    <Card
      style={style}
      className={cn(
        "relative overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-xl",
        "ring-1 ring-inset ring-white/5 transition hover:-translate-y-1 hover:shadow-2xl",
        theme.glow,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.tone}33 0%, transparent 55%)`,
        }}
      />
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="border border-white/10 bg-slate-900/60 text-xs uppercase text-slate-400">
            {PILLAR_LABEL[pillarKey]}
          </Badge>
          <span className="text-xs text-slate-500">{pillar.branchElement ?? pillar.element}</span>
        </div>
        <CardTitle className="flex items-baseline gap-2 text-2xl font-semibold text-slate-50">
          <span className="text-4xl leading-none text-slate-50">{pillar.branch}</span>
          <span className="text-lg text-slate-300">{pillar.stem}</span>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase", theme.bg, theme.text)}>
            {ELEMENT_LABEL[pillar.element]}
          </span>
          <span className={cn("text-[11px]", theme.text)}>{friendly.title}</span>
        </div>
        <span
          className={cn(
            "pointer-events-none absolute -right-2 bottom-2 text-8xl font-black opacity-10",
            theme.text.replace("text-", "text-"),
          )}
        >
          {ELEMENT_HANJA[hanjaKey]}
        </span>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-400">
          <span>십성</span>
          <span className="text-slate-50">{pillar.tenGod}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-400">
          <span>지장간</span>
          <span className="text-slate-50">{pillar.hiddenStem ?? "없음"}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-400">
          <span>12운성</span>
          <span className="text-slate-50">{pillar.twelveSpirit ?? "-"}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const typingPhrases = ["저랑 잘 맞을까요?", "올해 연애운이 궁금해요", "커리어 전성기, 언제일까요?"];

const SajuResultPageContent = () => {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const supabase = useClerkSupabaseClient();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const [resultData, setResultData] = useState<SajuResultPayload | null>(
    () => parseResultFromSearch(dataParam) ?? null,
  );
  const [ctaStatus, setCtaStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingChar, setTypingChar] = useState(0);
  const [contentMap, setContentMap] = useState<
    Record<TabKey, { interpretations: InterpretationRecord[]; solutions: SolutionRecord[] }>
  >(DEFAULT_CONTENT);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [solutionChecks, setSolutionChecks] = useState<Record<string, boolean>>({});

  const data = resultData ?? MOCK_RESULT;
  const { name, birthDate, birthTime, zodiacText, pillars, ohangScores } = data;
  const strengthLabel = data.analysis?.strengthLabel ?? "중간";
  const tenGodSummary = data.analysis?.tenGodSummary ?? "강점과 약점을 기반으로 한 맞춤 인사이트입니다.";
  const inmyeonggang = data.inmyeonggang ?? 0;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(SOLUTION_CHECK_KEY);
      if (stored) {
        setSolutionChecks(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadTabContent = useCallback(async () => {
    setIsContentLoading(true);
    setContentError(null);
    try {
      const entries = await Promise.all(
        (Object.entries(DOMAIN_BY_TAB) as [TabKey, string][]).map(async ([tabKey, domain]) => {
          const { data: interpretations, error: interpretationsError } = await supabase
            .from("master_interpretations")
            .select("*")
            .eq("domain", domain)
            .eq("is_active", true)
            .eq("lang", "ko")
            .order("priority", { ascending: true })
            .limit(6);

          const { data: solutions, error: solutionsError } = await supabase
            .from("master_solutions")
            .select("*")
            .eq("domain", domain)
            .eq("is_active", true)
            .eq("lang", "ko")
            .order("created_at", { ascending: true })
            .limit(6);

          if (interpretationsError || solutionsError) {
            throw interpretationsError ?? solutionsError;
          }

          return [
            tabKey,
            {
              interpretations: interpretations ?? [],
              solutions: solutions ?? [],
            },
          ] as const;
        }),
      );

      setContentMap((prev) => {
        const next = { ...prev };
        entries.forEach(([tabKey, content]) => {
          const hasData =
            (content.interpretations?.length ?? 0) > 0 || (content.solutions?.length ?? 0) > 0;
          next[tabKey] = hasData ? content : DEFAULT_CONTENT[tabKey];
        });
        return next;
      });
    } catch (error) {
      console.error("interpretation fetch failed", error);
      setContentError("콘텐츠를 불러오는 데 실패했어요. 기본 해석을 대신 보여드려요.");
      setContentMap(DEFAULT_CONTENT);
    } finally {
      setIsContentLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadTabContent();
  }, [loadTabContent]);

  const toggleSolutionCheck = (id: string, checked: boolean) => {
    setSolutionChecks((prev) => {
      const next = { ...prev, [id]: checked };
      try {
        localStorage.setItem(SOLUTION_CHECK_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  const topElement = useMemo(() => {
    const entries = Object.entries(ohangScores) as [FiveElement, number][];
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [ohangScores]);

  const tenGodOfDay = getFriendlyTenGod(pillars.day.tenGod);
  const topElementTheme = ELEMENT_THEME[topElement[0]];

  const typedText = typingPhrases[typingIndex].slice(0, typingChar);
  useEffect(() => {
    const current = typingPhrases[typingIndex];
    const isDone = typingChar >= current.length;
    const timer = setTimeout(() => {
      if (isDone) {
        setTypingChar(0);
        setTypingIndex((prev) => (prev + 1) % typingPhrases.length);
      } else {
        setTypingChar((prev) => prev + 1);
      }
    }, isDone ? 1400 : 90);
    return () => clearTimeout(timer);
  }, [typingChar, typingIndex]);

  const renderTabContent = (tabKey: TabKey) => {
    if (isContentLoading) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-6 text-center text-sm text-slate-400">
          데이터를 불러오는 중입니다...
        </div>
      );
    }

    const content = contentMap[tabKey] ?? { interpretations: [], solutions: [] };
    const diagnosisList = content.interpretations;
    const solutionsList = content.solutions;
    const whyList = diagnosisList
      .filter((item) => item.trust_level?.toLowerCase() === "high")
      .slice(0, 3);

    return (
      <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">진단 (Diagnosis)</p>
          {diagnosisList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
              진단 데이터가 없습니다. 기본 요약을 참고해 주세요.
            </div>
          ) : (
            diagnosisList.map((item) => (
              <Card key={item.id} className="border border-white/10 bg-slate-900/70 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-slate-50">
                      {tabKey === "summary" ? "오행 구조 및 기질 분석" : item.title ?? "제목 없음"}
                    </CardTitle>
                    {item.layer && (
                      <Badge variant="outline" className="border-white/20 text-xs text-slate-400">
                        {item.layer}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{item.content ?? "내용이 없습니다."}</p>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-300">처방 (Solution)</p>
          {solutionsList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
              처방 데이터가 없습니다. 기본 행동 가이드를 참고해 주세요.
            </div>
          ) : (
            solutionsList.map((item) => (
              <Card key={item.id} className="border border-white/10 bg-slate-900/70 backdrop-blur">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <Checkbox
                    id={`solution-${item.id}`}
                    checked={solutionChecks[item.id] ?? false}
                    onCheckedChange={(checked) => toggleSolutionCheck(item.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base text-slate-50">{item.title ?? "실행 아이템"}</CardTitle>
                      {item.difficulty && (
                        <Badge variant="secondary" className="bg-slate-800 text-xs text-slate-50">
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{item.content ?? "내용이 없습니다."}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {item.time_required && (
                        <span className="rounded-full bg-slate-800 px-2 py-1">소요 {item.time_required}</span>
                      )}
                      {item.severity && (
                        <span className="rounded-full bg-slate-800 px-2 py-1">중요도 {item.severity}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <div className="col-span-full rounded-xl border border-white/10 bg-slate-900/70 p-2 backdrop-blur">
          <Accordion type="single" collapsible>
            <AccordionItem value="why">
              <AccordionTrigger className="text-sm text-slate-50">
                이 부분은 상담가가 신뢰도 높은 근거만 추려 보여드려요
              </AccordionTrigger>
              <AccordionContent>
                {whyList.length === 0 ? (
                  <p className="text-sm text-slate-400">신뢰도 높은 근거가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {whyList.map((item) => (
                      <Card key={`why-${item.id}`} className="border border-white/10 bg-slate-900/80 backdrop-blur">
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-slate-50">{item.title ?? "근거"}</CardTitle>
                            <Badge className="bg-emerald-400/20 text-xs text-emerald-300">trust: high</Badge>
                          </div>
                          <p className="text-sm text-slate-400">{item.content ?? "내용이 없습니다."}</p>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {contentError && (
            <p className="px-2 pb-1 pt-2 text-xs text-rose-400">{contentError}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-400">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.16),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_35%)]" />
      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 pb-24 pt-10">
        <section className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
          <Card className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/10" />
            <CardHeader className="relative flex flex-col gap-4 pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/10">
                  <AvatarFallback className="bg-indigo-500/30 text-sm font-semibold text-indigo-100">
                    {name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-300">Premium Insight</p>
                  <h1 className="text-xl font-semibold text-slate-50">
                    {name}님의 사주 결과
                  </h1>
                  <p className="text-sm text-slate-400">
                    {birthDate} {birthTime} 출생 · {data.gender === "female" ? "여성" : "남성"} · {zodiacText}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 backdrop-blur">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-200">
                    <Sparkles className="h-4 w-4 text-emerald-400" /> 가장 강한 오행
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {ELEMENT_LABEL[topElement[0]]} · {topElement[1]}%
                  </p>
                  <p className="text-xs text-slate-400">균형 지표: {strengthLabel}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 backdrop-blur">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-200">
                    <Zap className="h-4 w-4 text-rose-400" /> 주인공 십성
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">{tenGodOfDay.title}</p>
                  <p className="text-xs text-slate-400">{tenGodOfDay.detail}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 backdrop-blur">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-200">
                    <BarChart3 className="h-4 w-4 text-blue-400" /> 인명강 지수
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">{inmyeonggang} 점</p>
                  <p className="text-xs text-slate-400">안정적 · 신뢰형</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative grid gap-6 md:grid-cols-[1.3fr,1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-inner backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-200">Element Balance</p>
                    <h2 className="text-lg font-semibold text-slate-50">오행 밸런스 차트</h2>
                  </div>
                  <Badge className="bg-indigo-500/20 text-xs text-indigo-100 ring-1 ring-indigo-400/40">
                    {topElement[0].toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {(Object.entries(ohangScores) as [FiveElement, number][]).map(([key, score]) => {
                    const tone = ELEMENT_THEME[key].tone;
                    const style = { "--tone": tone } as CSSProperties;
                    return (
                      <div
                        key={key}
                        style={style}
                        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center text-slate-400 backdrop-blur"
                      >
                        <span className={cn("text-xs uppercase tracking-wide font-semibold", ELEMENT_THEME[key].text)}>
                          {ELEMENT_LABEL[key]}
                        </span>
                        <div className="relative h-20 overflow-hidden rounded-lg bg-slate-900/80">
                          <div
                            className="absolute inset-x-3 top-2 bottom-2 flex items-end justify-center"
                            aria-hidden
                          >
                            <div
                              className="w-full rounded-full shadow-[0_10px_25px_-10px_var(--tone)] transition-all"
                              style={{ height: `${clamp(score)}%`, backgroundColor: tone }}
                              data-slot="element-bar"
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-50">{score}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-inner backdrop-blur">
                <DonutChart label="TOP ELEMENT" value={topElement[1]} tone={topElementTheme.tone} />
                <div className="text-center text-sm text-slate-400">
                  <p className="text-slate-50">균형 지표 {strengthLabel}</p>
                  <p>{tenGodSummary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <p className="text-xs uppercase tracking-wide text-indigo-300">Hero Insight</p>
              <CardTitle className="text-xl text-slate-50">프리미엄 리포트 요약</CardTitle>
              <p className="text-sm text-slate-400">
                가장 강한 오행과 주인 십성을 기반으로 오늘 바로 실행할 수 있는 한 줄 조언을 제공합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                <p className="text-xs uppercase tracking-wide text-indigo-300">한 줄 요약</p>
                <p className="mt-1 text-slate-50">
                  {ELEMENT_LABEL[topElement[0]]} 기운이 두드러지고, {tenGodOfDay.title} 성향이 강합니다. 팀과의 협업 속에서
                  기회가 자연스럽게 들어오니, 오늘은 연대와 연결에 투자해보세요.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-indigo-300/80">추천 액션</p>
                  <p className="mt-1 text-slate-50">새로운 협업 제안에 응답하기</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-rose-300">포커스 시간</p>
                  <p className="mt-1 text-slate-50">오전 9시~11시, 집중도 상승 구간</p>
                </div>
              </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white shadow-[0_15px_45px_rgba(99,102,241,0.35)] ring-2 ring-indigo-400/40 transition hover:translate-y-[-1px] hover:shadow-[0_18px_55px_rgba(99,102,241,0.45)]"
                    onClick={() => handleAction("consult")}
                    disabled={ctaStatus === "pending"}
                  >
                    AI 상담으로 이어보기
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_15px_45px_rgba(16,185,129,0.35)] ring-2 ring-emerald-300/40 transition hover:translate-y-[-1px] hover:shadow-[0_18px_55px_rgba(16,185,129,0.45)]"
                    onClick={() => handleAction("save")}
                    disabled={ctaStatus === "pending"}
                  >
                    리포트 저장
                  </Button>
              </div>
              {ctaMessage && (
                <p
                  className={cn(
                    "text-center text-xs",
                    ctaStatus === "error" ? "text-rose-400" : "text-slate-400",
                  )}
                >
                  {ctaMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">내 사주팔자</p>
          <h2 className="text-lg font-semibold text-slate-50">연 · 월 · 일 · 시주 카드</h2>
          <p className="text-sm text-slate-400">한자는 작게, 오행 컬러로 직관적으로 표시합니다.</p>
        </div>
      </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(pillars) as PillarKey[]).map((key) => (
              <PillarCard key={key} pillarKey={key} pillar={pillars[key]} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full flex-wrap justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/80 p-3 shadow-inner">
              <TabsTrigger value="summary" className="flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 ring-1 ring-transparent transition data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_30px_rgba(99,102,241,0.25)] data-[state=active]:ring-indigo-400/40">
                종합
              </TabsTrigger>
              <TabsTrigger value="love" className="flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 ring-1 ring-transparent transition data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_30px_rgba(236,72,153,0.2)] data-[state=active]:ring-rose-400/40">
                연애
              </TabsTrigger>
              <TabsTrigger value="career" className="flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 ring-1 ring-transparent transition data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_30px_rgba(16,185,129,0.2)] data-[state=active]:ring-emerald-400/40">
                직업
              </TabsTrigger>
              <TabsTrigger value="wealth" className="flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 ring-1 ring-transparent transition data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_30px_rgba(251,191,36,0.25)] data-[state=active]:ring-amber-300/40">
                재물
              </TabsTrigger>
              <TabsTrigger value="health" className="flex-1 min-w-[120px] rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 ring-1 ring-transparent transition data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_30px_rgba(96,165,250,0.25)] data-[state=active]:ring-blue-400/40">
                건강
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="pt-4">
              {renderTabContent("summary")}
            </TabsContent>

            <TabsContent value="love" className="pt-4">
              {renderTabContent("love")}
            </TabsContent>

            <TabsContent value="career" className="pt-4">
              {renderTabContent("career")}
            </TabsContent>

            <TabsContent value="wealth" className="pt-4">
              {renderTabContent("wealth")}
            </TabsContent>

            <TabsContent value="health" className="pt-4">
              {renderTabContent("health")}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-slate-950" />

      <div className="fixed bottom-6 right-6 z-20 flex items-end gap-3">
        <div className="pointer-events-none rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm text-slate-400 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 text-slate-50">
            <MessageCircle className="h-4 w-4 text-indigo-300" />
            <span>추천 질문</span>
          </div>
          <p className="mt-1 text-slate-50">
            {typedText}
            <span className="animate-pulse text-indigo-300">|</span>
          </p>
        </div>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 hover:scale-105"
          onClick={() => router.push("/chat")}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

const SajuResultPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">로딩 중...</div>
      </div>
    }>
      <SajuResultPageContent />
    </Suspense>
  );
};

export default SajuResultPage;
