"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { useUser } from "@clerk/nextjs";
import { Sparkles, TrendingUp, Share2, Music, ExternalLink, Shield, Zap, Target, Save, Printer, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SajuChart, Json } from "@/types/database.types";
import { solarToLunar } from "@/lib/utils/lunar-converter";

// --- 타입 정의 ---
interface PillarData {
  stem: string;
  branch: string;
  full: string;
}

interface ResultJson {
  pillars: {
    year: PillarData | null;
    month: PillarData | null;
    day: PillarData | null;
    hour: PillarData | null;
  };
  dayMaster: {
    hangul: string;
    hanja: string;
    element: string;
    yinYang: string;
  } | null;
  gyeokguk?: {
    name: string;
    hanja: string;
    description: string;
    type: "신강" | "신약";
  };
  yongsin?: {
    main: string;
    mainElement: string;
    sub?: string;
    subElement?: string;
    description: string;
  };
  sinsal?: Array<{
    name: string;
    hanja: string;
    type: "길신" | "흉살" | "중성";
    pillar: "년" | "월" | "일" | "시";
    description: string;
  }>;
  analysis?: {
    ohhaeng?: {
      percentage: Record<string, number>;
    };
    personality?: string;
    strength?: string;
    weakness?: string;
  };
  daeunSeun?: {
    currentDaeun: {
      startAge: number;
      endAge: number;
      stem: string;
      branch: string;
      element: string;
      description: string;
    };
    currentSeun: {
      year: number;
      stem: string;
      branch: string;
      element: string;
      rating: number;
      keywords: string[];
    };
    yearlyForecast: string;
  };
}

interface GanjiPillar {
  gan: string;
  ji: string;
  text: string;
}

interface ElementInfo {
  symbol: string;
  name: string;
  desc: string;
}

interface FiveElementBar {
  label: string;
  value: number;
  color: string;
  text: string;
  element: string;
}

// --- 일간 오행 매핑 ---
const DAY_MASTER_INFO: Record<string, ElementInfo> = {
  갑: { symbol: "🌲", name: "큰 나무 (갑목)", desc: "하늘을 향해 곧게 뻗는 소나무의 기운" },
  을: { symbol: "🌿", name: "풀과 꽃 (을목)", desc: "유연하게 적응하는 덩굴의 기운" },
  병: { symbol: "☀️", name: "태양 (병화)", desc: "세상을 밝히는 강렬한 빛의 기운" },
  정: { symbol: "🕯️", name: "촛불 (정화)", desc: "어둠을 밝히는 은은한 빛의 기운" },
  무: { symbol: "⛰️", name: "큰 산 (무토)", desc: "모든 것을 품어주는 웅장한 흙의 기운" },
  기: { symbol: "🏡", name: "논밭 (기토)", desc: "생명을 키워내는 부드러운 흙의 기운" },
  경: { symbol: "⚔️", name: "강철 (경금)", desc: "단단하고 결단력 있는 금속의 기운" },
  신: { symbol: "💎", name: "보석 (신금)", desc: "정교하고 섬세한 금속의 기운" },
  임: { symbol: "🌊", name: "큰 바다 (임수)", desc: "거침없이 흐르는 대양의 기운" },
  계: { symbol: "💧", name: "이슬비 (계수)", desc: "촉촉하게 적시는 빗물의 기운" },
};

// 천간 오행/음양 매핑
const STEM_INFO: Record<string, { element: string; elementHanja: string; yinYang: string; color: string }> = {
  갑: { element: "목", elementHanja: "木", yinYang: "양", color: "text-emerald-500" },
  을: { element: "목", elementHanja: "木", yinYang: "음", color: "text-emerald-400" },
  병: { element: "화", elementHanja: "火", yinYang: "양", color: "text-red-500" },
  정: { element: "화", elementHanja: "火", yinYang: "음", color: "text-red-400" },
  무: { element: "토", elementHanja: "土", yinYang: "양", color: "text-amber-500" },
  기: { element: "토", elementHanja: "土", yinYang: "음", color: "text-amber-400" },
  경: { element: "금", elementHanja: "金", yinYang: "양", color: "text-slate-300" },
  신: { element: "금", elementHanja: "金", yinYang: "음", color: "text-slate-200" },
  임: { element: "수", elementHanja: "水", yinYang: "양", color: "text-blue-500" },
  계: { element: "수", elementHanja: "水", yinYang: "음", color: "text-blue-400" },
};

// 지지 오행 매핑
const BRANCH_INFO: Record<string, { element: string; elementHanja: string; color: string }> = {
  자: { element: "수", elementHanja: "水", color: "text-blue-500" },
  축: { element: "토", elementHanja: "土", color: "text-amber-500" },
  인: { element: "목", elementHanja: "木", color: "text-emerald-500" },
  묘: { element: "목", elementHanja: "木", color: "text-emerald-400" },
  진: { element: "토", elementHanja: "土", color: "text-amber-400" },
  사: { element: "화", elementHanja: "火", color: "text-red-500" },
  오: { element: "화", elementHanja: "火", color: "text-red-400" },
  미: { element: "토", elementHanja: "土", color: "text-amber-500" },
  신: { element: "금", elementHanja: "金", color: "text-slate-300" },
  유: { element: "금", elementHanja: "金", color: "text-slate-200" },
  술: { element: "토", elementHanja: "土", color: "text-amber-400" },
  해: { element: "수", elementHanja: "水", color: "text-blue-400" },
};

// 천간 한자 매핑
const STEM_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

// 지지 한자 매핑
const BRANCH_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

// 지지 → 띠 동물 매핑
const BRANCH_ANIMAL: Record<string, string> = {
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼", 진: "용", 사: "뱀",
  오: "말", 미: "양", 신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
};

// 지지 → 띠 동물 이모지 매핑
const BRANCH_ANIMAL_EMOJI: Record<string, string> = {
  자: "🐭", 축: "🐂", 인: "🐯", 묘: "🐰", 진: "🐲", 사: "🐍",
  오: "🐴", 미: "🐑", 신: "🐵", 유: "🐔", 술: "🐕", 해: "🐷",
};

// 천간 → 색상 매핑 (갑을=푸른, 병정=붉은, 무기=노란, 경신=흰, 임계=검은)
const STEM_COLOR_NAME: Record<string, string> = {
  갑: "푸른", 을: "푸른", 병: "붉은", 정: "붉은", 무: "노란",
  기: "노란", 경: "흰", 신: "흰", 임: "검은", 계: "검은",
};

// --- 오행 기본 분포 ---
const DEFAULT_FIVE_ELEMENTS: FiveElementBar[] = [
  { label: "목(Wood)", value: 20, color: "bg-emerald-400", text: "text-emerald-300", element: "목" },
  { label: "화(Fire)", value: 20, color: "bg-rose-500", text: "text-rose-300", element: "화" },
  { label: "토(Earth)", value: 20, color: "bg-amber-400", text: "text-amber-300", element: "토" },
  { label: "금(Metal)", value: 20, color: "bg-slate-300", text: "text-slate-300", element: "금" },
  { label: "수(Water)", value: 20, color: "bg-blue-500", text: "text-blue-300", element: "수" },
];

// --- Props 인터페이스 ---
interface ResultDashboardProps {
  chartData: SajuChart;
  isSaved?: boolean;
}

// --- 헬퍼 함수들 ---
function parseResultJson(json: Json | null): ResultJson | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  return json as unknown as ResultJson;
}

function getGanjiData(result: ResultJson | null): Record<string, GanjiPillar> {
  if (!result?.pillars) {
    return {
      year: { gan: "-", ji: "-", text: "" },
      month: { gan: "-", ji: "-", text: "" },
      day: { gan: "-", ji: "-", text: "" },
      time: { gan: "-", ji: "-", text: "" },
    };
  }

  const mapPillar = (p: PillarData | null): GanjiPillar => {
    if (!p) return { gan: "-", ji: "-", text: "" };
    return { gan: p.stem, ji: p.branch, text: p.full };
  };

  return {
    year: mapPillar(result.pillars.year),
    month: mapPillar(result.pillars.month),
    day: mapPillar(result.pillars.day),
    time: mapPillar(result.pillars.hour),
  };
}

function getMyElement(result: ResultJson | null): ElementInfo {
  const defaultInfo: ElementInfo = {
    symbol: "✨",
    name: "알 수 없음",
    desc: "일간 정보가 없습니다",
  };

  if (!result?.dayMaster?.hangul) return defaultInfo;
  return DAY_MASTER_INFO[result.dayMaster.hangul] || defaultInfo;
}

function getFiveElements(result: ResultJson | null): FiveElementBar[] {
  if (!result?.analysis?.ohhaeng?.percentage) {
    return DEFAULT_FIVE_ELEMENTS;
  }

  const pct = result.analysis.ohhaeng.percentage;
  return [
    { label: "목(Wood)", value: pct.wood ?? 0, color: "bg-emerald-400", text: "text-emerald-300", element: "목" },
    { label: "화(Fire)", value: pct.fire ?? 0, color: "bg-rose-500", text: "text-rose-300", element: "화" },
    { label: "토(Earth)", value: pct.earth ?? 0, color: "bg-amber-400", text: "text-amber-300", element: "토" },
    { label: "금(Metal)", value: pct.metal ?? 0, color: "bg-slate-300", text: "text-slate-300", element: "금" },
    { label: "수(Water)", value: pct.water ?? 0, color: "bg-blue-500", text: "text-blue-300", element: "수" },
  ];
}

function getLowestElement(elements: FiveElementBar[]): FiveElementBar | null {
  if (elements.length === 0) return null;
  return elements.reduce((min, el) => (el.value < min.value ? el : min), elements[0]);
}

function getHighestElement(elements: FiveElementBar[]): FiveElementBar | null {
  if (elements.length === 0) return null;
  return elements.reduce((max, el) => (el.value > max.value ? el : max), elements[0]);
}

// 오행별 힐링 사운드 유튜브 채널 링크
const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@YourChannelName";

const ELEMENT_MUSIC: Record<string, { element: string; hanja: string }> = {
  "목(Wood)": { element: "목", hanja: "木" },
  "화(Fire)": { element: "화", hanja: "火" },
  "토(Earth)": { element: "토", hanja: "土" },
  "금(Metal)": { element: "금", hanja: "金" },
  "수(Water)": { element: "수", hanja: "水" },
};

// Mock 데이터 생성 헬퍼
function getMockGyeokguk(): ResultJson["gyeokguk"] {
  return {
    name: "식신격",
    hanja: "食神格",
    description: "식신이 투출하여 격을 이루었습니다. 식신격은 의식주가 풍족하고 예술적 재능이 뛰어난 격입니다.",
    type: "신약",
  };
}

function getMockYongsin(): ResultJson["yongsin"] {
  return {
    main: "인성",
    mainElement: "수(水)",
    sub: "비겁",
    subElement: "토(土)",
    description: "신약사주이므로 나를 도와주는 인성(수)이 용신입니다. 학문과 자격증 취득이 운을 높여줍니다.",
  };
}

function getMockSinsal(): ResultJson["sinsal"] {
  return [
    { name: "천을귀인", hanja: "天乙貴人", type: "길신", pillar: "일", description: "귀인의 도움을 받아 위기에서 벗어납니다." },
    { name: "문창귀인", hanja: "文昌貴人", type: "길신", pillar: "월", description: "학문과 시험에 유리합니다." },
    { name: "역마살", hanja: "驛馬殺", type: "중성", pillar: "년", description: "이동, 출장, 해외운이 있습니다." },
  ];
}

// 대운 Mock 데이터
function getMockDaeunList() {
  return [
    { age: "10대", years: "2008-2017", stem: "임", branch: "오", keyword: "탐색기" },
    { age: "20대", years: "2018-2027", stem: "계", branch: "미", keyword: "성장기" },
    { age: "30대", years: "2028-2037", stem: "갑", branch: "신", keyword: "전성기", current: true },
    { age: "40대", years: "2038-2047", stem: "을", branch: "유", keyword: "확장기" },
    { age: "50대", years: "2048-2057", stem: "병", branch: "술", keyword: "안정기" },
    { age: "60대", years: "2058-2067", stem: "정", branch: "해", keyword: "정리·준비" },
  ];
}

// --- 메인 컴포넌트 ---
export default function ResultDashboard({ chartData, isSaved = true }: ResultDashboardProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [selectedDaeun, setSelectedDaeun] = useState(2); // 30대 기본 선택
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    isSaved ? "saved" : "idle"
  );
  const [isPending, startTransition] = useTransition();
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const result = parseResultJson(chartData.result_json);
  const ganji = getGanjiData(result);
  const myElement = getMyElement(result);
  const fiveElements = getFiveElements(result);
  const lowestElement = getLowestElement(fiveElements);
  const highestElement = getHighestElement(fiveElements);

  const userName = chartData.name || "사용자";
  // 비회원이지만 로그인한 경우 저장 가능
  const canSave = isSignedIn && !isSaved && saveStatus !== "saved";
  const showLoginButton = !isSignedIn && !isSaved;

  // Mock 데이터 사용
  const gyeokguk = result?.gyeokguk || getMockGyeokguk();
  const yongsin = result?.yongsin || getMockYongsin();
  const sinsal = result?.sinsal || getMockSinsal();
  const daeunList = getMockDaeunList();
  const lowestElementInfo = lowestElement ? ELEMENT_MUSIC[lowestElement.label] : null;

  // 저장 기능
  const handleSave = async () => {
    if (!isSignedIn || saveStatus === "saving") return;

    setSaveStatus("saving");

    try {
      const inputJson = chartData.input_json as {
        birthDate?: string;
        birthTime?: string;
        timeAccuracy?: string;
        gender?: string;
        city?: string;
      } | null;

      const response = await fetch("/api/mansaeryeok/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: chartData.name || undefined,
          gender: chartData.gender || "male",
          birthDate: inputJson?.birthDate || chartData.birth_date?.split("T")[0] || "",
          birthTime: inputJson?.birthTime || null,
          inputJson: {
            birthDate: inputJson?.birthDate || chartData.birth_date?.split("T")[0] || "",
            birthTime: inputJson?.birthTime || null,
            timeAccuracy: inputJson?.timeAccuracy || "unknown",
            gender: chartData.gender || undefined,
          },
          resultJson: chartData.result_json,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus("saved");
        // 저장 후 ID 기반 URL로 리다이렉트
        startTransition(() => {
          router.replace(`/mansaeryeok/result?id=${data.data.id}`);
        });
      } else {
        setSaveStatus("error");
        alert(data.error?.message || "저장에 실패했습니다");
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      alert("저장 중 오류가 발생했습니다");
    }
  };

  // 공유 기능
  const handleShare = async () => {
    const shareData = {
      title: `${userName}님의 사주 분석 결과`,
      text: `${userName}님은 ${myElement.name}입니다. 사주 분석 결과를 확인해보세요!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 사용자가 공유 취소
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  // 이미지로 저장 기능
  const handleSaveImage = async () => {
    if (!captureRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        windowWidth: captureRef.current.scrollWidth,
        windowHeight: captureRef.current.scrollHeight,
      });

      // 캔버스를 이미지로 변환
      const dataUrl = canvas.toDataURL("image/png");

      // 다운로드 링크 생성
      const link = document.createElement("a");
      link.download = `${userName}_사주분석_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "").replace(/ /g, "")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("이미지 저장 실패:", error);
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* ========== 캡처 영역 시작 ========== */}
        <div ref={captureRef} className="bg-white">

        {/* ========== 상단 헤더 ========== */}
        {(() => {
          // input_json 파싱
          const inputJson = chartData.input_json as {
            birthDate?: string;
            birthTime?: string;
            calendarType?: string;
            lunarDate?: string;
            isLeapMonth?: boolean;
            localTimeOffset?: number;
            city?: string;
            gender?: string;
          } | null;

          const yearStem = ganji.year.gan;
          const yearBranch = ganji.year.ji;
          const colorName = STEM_COLOR_NAME[yearStem] || "";
          const animalName = BRANCH_ANIMAL[yearBranch] || "";
          const animalEmoji = BRANCH_ANIMAL_EMOJI[yearBranch] || "🔮";
          const ganjiText = `${yearStem}${yearBranch}`;
          const ganjiHanja = `${STEM_HANJA[yearStem] || ""}${BRANCH_HANJA[yearBranch] || ""}`;

          const genderText = chartData.gender === 'male' ? '남자' : chartData.gender === 'female' ? '여자' : '';
          const city = inputJson?.city || '';

          // 양력 날짜/시간 파싱
          const birthDateStr = inputJson?.birthDate || chartData.birth_date || '';
          const birthTimeStr = inputJson?.birthTime || '';
          const birthDate = birthDateStr ? new Date(birthDateStr) : null;
          const solarDateDisplay = birthDate
            ? `${birthDate.getFullYear()}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${String(birthDate.getDate()).padStart(2, '0')}`
            : '';

          // 음력 변환 - 양력 날짜를 음력으로 변환
          const lunarData = birthDate ? solarToLunar(birthDate) : null;
          const lunarDateDisplay = lunarData?.lunarDateString || inputJson?.lunarDate || '';
          const isLeapMonth = lunarData?.isLeapMonth || inputJson?.isLeapMonth || false;
          const leapText = isLeapMonth ? '윤달' : '평달';

          // 지역시 보정
          const localTimeOffset = inputJson?.localTimeOffset || 0;
          const hasLocalTimeCorrection = localTimeOffset !== 0;

          return (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white overflow-hidden shadow-lg">
                  <span className="text-3xl">{animalEmoji}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-slate-800">{userName}</h1>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200 text-xs px-2 py-0.5">
                      {ganjiText}({colorName} {animalName})
                    </Badge>
                    <span className="text-xs text-slate-400">{ganjiHanja}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    {/* 양력 */}
                    <div className="flex items-center gap-1">
                      <span className="text-pink-500 font-medium">양</span>
                      <span>{solarDateDisplay}</span>
                      {birthTimeStr && <span>{birthTimeStr}</span>}
                      <span>{genderText}</span>
                      {city && <span>{city}</span>}
                    </div>

                    {/* 음력 */}
                    {lunarDateDisplay && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500 font-medium">음</span>
                        <span className="text-slate-400">({leapText})</span>
                        <span>{lunarDateDisplay}</span>
                        {birthTimeStr && <span>{birthTimeStr}</span>}
                        <span>{genderText}</span>
                        {city && <span>{city}</span>}
                      </div>
                    )}

                    {/* 지역시 보정 (보정이 있을 때만) */}
                    {hasLocalTimeCorrection && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-purple-500 font-medium">양</span>
                        <span>{solarDateDisplay}</span>
                        <span>지역시 보정</span>
                        <span className="text-purple-600 font-medium">({localTimeOffset > 0 ? '+' : ''}{localTimeOffset}분)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========== 사주팔자 테이블 ========== */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 text-center border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800">내 사주팔자</CardTitle>
            <p className="text-xs text-slate-500">천간/지지 · 지장간 · 12운성 · 12신살 · 길성/흉성을 한눈에 볼 수 있어요.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="py-2 font-medium">구분</th>
                    <th className="py-2 font-medium">시주</th>
                    <th className="py-2 font-medium">일주 <span className="text-amber-500">★</span> 본인</th>
                    <th className="py-2 font-medium">월주</th>
                    <th className="py-2 font-medium">연주</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 천간·십성 */}
                  <tr>
                    <td className="py-2 text-xs text-slate-500">천간·십성</td>
                    {(["time", "day", "month", "year"] as const).map((key) => {
                      const stem = ganji[key].gan;
                      const info = STEM_INFO[stem];
                      const hanja = STEM_HANJA[stem] || "?";
                      return (
                        <td key={key} className="py-2">
                          <div className={`mx-auto w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                            key === "day" ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50"
                          }`}>
                            <span className={`text-2xl font-bold ${info?.color || "text-slate-800"}`}>{hanja}</span>
                            <span className="text-[10px] text-slate-500">{info?.element || "?"} / {info?.elementHanja || "?"}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* 지지·십성 */}
                  <tr>
                    <td className="py-2 text-xs text-slate-500">지지·십성</td>
                    {(["time", "day", "month", "year"] as const).map((key) => {
                      const branch = ganji[key].ji;
                      const info = BRANCH_INFO[branch];
                      const hanja = BRANCH_HANJA[branch] || "?";
                      return (
                        <td key={key} className="py-2">
                          <div className={`mx-auto w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                            key === "day" ? "bg-amber-50 border-2 border-amber-300" : "bg-slate-50"
                          }`}>
                            <span className={`text-2xl font-bold ${info?.color || "text-slate-800"}`}>{hanja}</span>
                            <span className="text-[10px] text-slate-500">{info?.element || "?"} / {info?.elementHanja || "?"}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* 지장간 */}
                  <tr className="border-t border-slate-100">
                    <td className="py-2 text-xs text-slate-500">지장간</td>
                    <td className="py-2 text-sm text-slate-600">계수</td>
                    <td className="py-2 text-sm text-slate-600">갑병무</td>
                    <td className="py-2 text-sm text-purple-600 font-medium">신금</td>
                    <td className="py-2 text-sm text-slate-600">경임무</td>
                  </tr>
                  {/* 12운성 */}
                  <tr>
                    <td className="py-2 text-xs text-slate-500">12운성</td>
                    <td className="py-2 text-sm text-slate-600">목욕</td>
                    <td className="py-2 text-sm text-slate-600">건록</td>
                    <td className="py-2 text-sm text-purple-600 font-medium">관대</td>
                    <td className="py-2 text-sm text-slate-600">목욕</td>
                  </tr>
                  {/* 12신살 */}
                  <tr>
                    <td className="py-2 text-xs text-slate-500">12신살</td>
                    <td className="py-2 text-sm text-slate-600">재살</td>
                    <td className="py-2 text-sm text-slate-600">장성살</td>
                    <td className="py-2 text-sm text-purple-600 font-medium">백호살</td>
                    <td className="py-2 text-sm text-slate-600">목해살</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ========== 격국 & 용신 ========== */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              격국 & 용신
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-200 text-amber-800 border-0">{gyeokguk?.type}</Badge>
                <span className="font-bold text-amber-700">{gyeokguk?.name}</span>
                <span className="text-sm text-amber-600/70">({gyeokguk?.hanja})</span>
              </div>
              <p className="text-sm text-amber-800/80">{gyeokguk?.description}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">용신 (用神)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-emerald-200 text-emerald-800 border-0">
                  주용신: {yongsin?.main} ({yongsin?.mainElement})
                </Badge>
                {yongsin?.sub && (
                  <Badge className="bg-blue-200 text-blue-800 border-0">
                    부용신: {yongsin.sub} ({yongsin.subElement})
                  </Badge>
                )}
              </div>
              <p className="text-sm text-emerald-800/80">{yongsin?.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== 인생 운세 주기 (대운) ========== */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              인생 운세 주기 (대운)
            </CardTitle>
            <p className="text-xs text-slate-500">10~60세 핵심 구간을 먼저 보여드려요. 더 보고 싶으면 펼쳐주세요.</p>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 대운 탭 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {daeunList.map((daeun, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDaeun(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDaeun === idx
                      ? "bg-purple-600 text-white shadow-md"
                      : daeun.current
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {daeun.age} ({daeun.years})
                </button>
              ))}
            </div>

            {/* 대운 상세 카드 */}
            <div className="grid grid-cols-3 gap-3">
              {daeunList.slice(0, 3).map((daeun, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-center border ${
                    daeun.current
                      ? "bg-purple-50 border-purple-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className="text-xs text-slate-500 mb-1">{daeun.age} ({daeun.years})</p>
                  <p className="text-xl font-bold text-slate-800">{daeun.stem}{daeun.branch}</p>
                  <p className={`text-xs ${daeun.current ? "text-purple-600 font-medium" : "text-slate-500"}`}>
                    {daeun.keyword}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {daeunList.slice(3, 6).map((daeun, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl text-center border bg-slate-50 border-slate-200"
                >
                  <p className="text-xs text-slate-500 mb-1">{daeun.age} ({daeun.years})</p>
                  <p className="text-xl font-bold text-slate-800">{daeun.stem}{daeun.branch}</p>
                  <p className="text-xs text-slate-500">{daeun.keyword}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========== 오행 균형 상세 ========== */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              오행 균형 상세
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 오행 설명 */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl mb-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {highestElement && lowestElement && (
                  <>
                    <span className={highestElement.text.replace("text-", "text-")} style={{fontWeight: 600}}>
                      {highestElement.element}({highestElement.element === "목" ? "水" : highestElement.element === "화" ? "火" : highestElement.element === "토" ? "土" : highestElement.element === "금" ? "金" : "水"})
                    </span>{" "}
                    기운이 {highestElement.value}%로 가장 강하고,{" "}
                    <span className={lowestElement.text.replace("text-", "text-")} style={{fontWeight: 600}}>
                      {lowestElement.element}({lowestElement.element === "목" ? "土" : lowestElement.element === "화" ? "火" : lowestElement.element === "토" ? "土" : lowestElement.element === "금" ? "金" : "水"})
                    </span>{" "}
                    기운이 {lowestElement.value}%로 그 다음입니다.{" "}
                    <span className="text-indigo-700 font-medium">
                      {lowestElement.element === "금" || lowestElement.element === "목"
                        ? "금(金)과 목(木) 기운이 부족하므로 파란색, 초록색 옷이나 소품을 가까이하면 좋습니다."
                        : `${lowestElement.element}의 기운을 보충하면 좋습니다.`}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* 오행 바 차트 */}
            <div className="space-y-3">
              {fiveElements.map((el) => (
                <div key={el.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">{el.label}</span>
                    <span className={el.text}>{el.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${el.color} transition-all duration-1000`}
                      style={{ width: `${el.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========== 주요 신살 ========== */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              주요 신살
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {sinsal?.map((sal, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    sal.type === "길신"
                      ? "bg-emerald-50 border-emerald-200"
                      : sal.type === "흉살"
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={
                        sal.type === "길신"
                          ? "bg-emerald-200 text-emerald-800 border-0"
                          : sal.type === "흉살"
                          ? "bg-red-200 text-red-800 border-0"
                          : "bg-slate-200 text-slate-700 border-0"
                      }
                    >
                      {sal.type}
                    </Badge>
                    <span className="font-medium text-slate-800">{sal.name}</span>
                    <span className="text-xs text-slate-500">({sal.hanja})</span>
                    <span className="text-xs text-slate-400 ml-auto">{sal.pillar}주</span>
                  </div>
                  <p className="text-xs text-slate-600">{sal.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========== 정통 명리 해석 카드 ========== */}
        <Card className="mb-6 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  정통 명리학 기반 해석
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  적천수(滴天髓), 궁통보감(窮通寶鑑), 자평진전(子平眞詮) 등 <span className="font-medium text-indigo-700">고전 명리 원전</span>과
                  현대 명리학 연구를 바탕으로 <span className="font-medium text-indigo-700">정확하고 깊이 있는</span> 사주 해석을 제공합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-white rounded-full text-[10px] text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    고전 원전 기반
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-white rounded-full text-[10px] text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                    전문가 검증
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-white rounded-full text-[10px] text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
                    맞춤형 해석
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        </div>
        {/* ========== 캡처 영역 끝 ========== */}

        {/* ========== 사주상담 / 저장 버튼 ========== */}
        <div className="space-y-3 mb-6">
          <Link
            href={chartData.id ? `/chat?chart_id=${chartData.id}` : "/chat"}
            className="block"
          >
            <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-2xl shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 mr-2" />
              맞춤 사주상담 시작하기
            </Button>
          </Link>
          <p className="text-center text-[11px] text-slate-500">
            커리어 · 재물운 · 연애 · 건강 등 궁금한 영역을 질문해보세요
          </p>

          {showLoginButton ? (
            // 비회원 + 비로그인: 로그인 유도
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/mansaeryeok/result')}`} className="block mt-4">
              <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl">
                <Save className="w-5 h-5 mr-2" />
                로그인하고 저장하기
              </Button>
            </Link>
          ) : canSave ? (
            // 로그인했지만 아직 저장 안 됨: 저장 버튼
            <Button
              onClick={handleSave}
              disabled={saveStatus === "saving" || isPending}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl mt-4"
            >
              <Save className="w-5 h-5 mr-2" />
              {saveStatus === "saving" || isPending ? "저장 중..." : "내 사주 저장하기"}
            </Button>
          ) : (
            // 이미 저장됨
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-2xl mt-4"
              disabled
            >
              <Save className="w-5 h-5 mr-2" />
              내 사주 저장 완료
            </Button>
          )}
        </div>

        {/* ========== 공유 / 인쇄 버튼 ========== */}
        <div className="space-y-3 mb-8">
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              링크 공유
            </Button>
            <Button
              onClick={handleSaveImage}
              disabled={isCapturing}
              variant="outline"
              className="flex-1 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              {isCapturing ? "저장 중..." : "이미지 저장"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
          </div>
        </div>

        {/* ========== 오행 밸런싱 사운드 (맨 하단) ========== */}
        {lowestElementInfo && lowestElement && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 border border-purple-500/20 relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">오행 밸런싱 사운드</p>
                  <p className="text-xs text-purple-300/60">Elemental Healing Sound</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                <span className="text-purple-400 font-medium">{lowestElementInfo.element}({lowestElementInfo.hanja})</span>의
                기운이 부족한 분들을 위해 특별히 설계된 힐링 사운드입니다.
              </p>

              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                <Music className="w-4 h-4" />
                지금 들으러 가기
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
