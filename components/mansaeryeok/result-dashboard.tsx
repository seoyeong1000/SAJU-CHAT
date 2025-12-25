"use client";

import React from "react";
import { Lock, Sparkles, TrendingUp, Info, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- [MOCK DATA] 디자인 확인용 샘플 데이터 ---
const mockData = {
  userName: "김토스",
  ganji: {
    year: { gan: "甲", ji: "辰", text: "푸른 용" },
    month: { gan: "丙", ji: "寅", text: "붉은 호랑이" },
    day: { gan: "戊", ji: "子", text: "황금 쥐(나)" },
    time: { gan: "庚", ji: "申", text: "흰 원숭이" },
  },
  myElement: {
    symbol: "⛰️",
    name: "큰 산 (무토)",
    desc: "모든 것을 품어주는 웅장한 흙의 기운",
  },
  fiveElements: [
    { label: "목(Wood)", value: 30, color: "bg-emerald-400", text: "text-emerald-300" },
    { label: "화(Fire)", value: 15, color: "bg-rose-500", text: "text-rose-300" },
    { label: "토(Earth)", value: 40, color: "bg-amber-400", text: "text-amber-300" },
    { label: "금(Metal)", value: 10, color: "bg-slate-300", text: "text-slate-300" },
    { label: "수(Water)", value: 5, color: "bg-blue-500", text: "text-blue-300" },
  ],
  keywords: ["#뚝심대장", "#현실적인", "#포용력"],
  analysis: {
    personality: "당신은 마치 웅장한 태백산맥과 같습니다. 한번 마음먹은 일은 끝까지 밀고 나가는 뚝심이 있으며, 주변 사람들을 품어주는 포용력이 돋보입니다.",
    strength: "어떤 상황에서도 당황하지 않는 침착함과 신뢰감",
    weakness: "변화에 대한 대처가 조금 늦을 수 있으니 유연함을 기르세요.",
  },
};

export default function ResultDashboard() {
  const data = mockData;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 selection:bg-purple-500 selection:text-white">
      {/* 배경 효과 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 pt-12">

        {/* 헤더 섹션 */}
        <div className="text-center space-y-4 mb-10">
          <Badge variant="outline" className="border-purple-500/50 text-purple-200 px-3 py-1 mb-2 bg-purple-900/20 backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-1 inline" /> 사주 정밀 분석
          </Badge>
          <h1 className="text-3xl font-extrabold leading-snug text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-200">
            {data.userName}님은<br/>
            <span className="text-amber-400 drop-shadow-lg">{data.myElement.name}</span> 입니다
          </h1>
          <div className="text-7xl py-4 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-pulse">
            {data.myElement.symbol}
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            &quot;{data.myElement.desc}&quot;
          </p>
        </div>

        {/* 4주 8자 카드 */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          {Object.entries(data.ganji).map(([key, pillar]) => (
            <div key={key} className="flex flex-col items-center gap-2">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {key === 'year' ? '년' : key === 'month' ? '월' : key === 'day' ? '일(나)' : '시'}
               </span>
               <div className={`w-full aspect-[3/4] rounded-xl flex flex-col items-center justify-center border backdrop-blur-md transition-all ${
                 key === 'day'
                 ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                 : 'bg-slate-800/40 border-slate-700'
               }`}>
                 <span className="text-lg font-bold text-white mb-1">{pillar.gan}</span>
                 <span className="text-lg font-bold text-white">{pillar.ji}</span>
               </div>
            </div>
          ))}
        </div>

        {/* 오행 차트 섹션 */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md shadow-xl mb-6">
          <CardHeader className="pb-4 border-b border-slate-800/50">
            <CardTitle className="text-base text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              오행 밸런스 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
             {data.fiveElements.map((el) => (
                <div key={el.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold tracking-wide">
                    <span className="text-slate-400">{el.label}</span>
                    <span className={el.text}>{el.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${el.color} shadow-[0_0_10px_currentColor] transition-all duration-1000`}
                      style={{ width: `${el.value}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
             ))}
             <div className="mt-4 p-4 rounded-lg bg-blue-900/20 border border-blue-800/30 flex gap-3">
               <Info className="w-5 h-5 text-blue-400 shrink-0" />
               <p className="text-xs text-blue-200 leading-relaxed">
                 <strong className="text-white">수(Water)</strong> 기운이 부족합니다.
                 검은색 아이템이나 물가 산책이 운을 틔워줍니다.
               </p>
             </div>
          </CardContent>
        </Card>

        {/* 대운 잠금 섹션 (The Hook) */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 shadow-2xl mb-8 group cursor-pointer">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="p-8 text-center relative z-10">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white mb-4 shadow-lg shadow-purple-600/40 group-hover:scale-110 transition-transform">
               <Lock className="w-5 h-5" />
             </div>
             <h3 className="text-lg font-bold text-white mb-1">2025년 대운 흐름</h3>
             <p className="text-slate-400 text-xs mb-6">나의 전성기 그래프 확인하기</p>
             <Button className="w-full bg-white text-purple-900 hover:bg-slate-200 font-bold border-0 shadow-lg h-12 rounded-xl">
                <Crown className="w-4 h-4 mr-2" /> 잠금 해제
             </Button>
           </div>
        </div>

      </div>
    </div>
  );
}
