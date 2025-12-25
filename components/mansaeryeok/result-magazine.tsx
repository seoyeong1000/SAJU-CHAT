'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Loader2,
  Music,
  Lock,
  Sparkles,
  BookOpen,
  MessageCircle,
  RotateCcw,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

// ============================================
// Types
// ============================================

interface PillarData {
  stem: string
  branch: string
  full: string
}

interface ResultData {
  pillars: {
    year: PillarData | null
    month: PillarData | null
    day: PillarData | null
    hour: PillarData | null
  }
  dayMaster: {
    hangul: string
    hanja: string
    element: string
    yinYang: string
  } | null
  solarTerm: {
    name: string
    hanja: string
    date: string
  } | null
  meta: {
    engineVersion: string
    calculatedAt: string
    julianDay: number
    sunLongitude: number
  }
  analysis?: {
    ohhaeng: {
      distribution: Record<string, number>
      percentage: Record<string, number>
    }
    sinGangYak: { result: string; score: number; description: string }
    yongsin: { element: string; description: string }
    daeun: {
      isForward: boolean
      startAge: number
      list: Array<{
        order: number
        startAge: number
        endAge: number
        stemBranch: { hangul: string; hanja: string }
      }>
    }
  }
  interpretation?: {
    title: string
    summary: string
    sections: {
      essence: string | null
      psychology: string | null
      personality: string | null
      relationships: string | null
    }
  } | null
}

interface StoredResult {
  input: {
    name: string
    birthDate: string
    birthTime: string | null
    timeAccuracy: string
    gender?: string
  }
  result: ResultData
  savedAt: string
}

// ============================================
// 오행 매핑
// ============================================

const ELEMENT_INFO: Record<
  string,
  { name: string; nature: string; image: string; color: string }
> = {
  wood: {
    name: '목(木)',
    nature: '봄의 숲',
    image: '🌲',
    color: 'text-emerald-700',
  },
  fire: {
    name: '화(火)',
    nature: '여름의 태양',
    image: '🔥',
    color: 'text-rose-600',
  },
  earth: {
    name: '토(土)',
    nature: '대지의 산',
    image: '🏔️',
    color: 'text-amber-700',
  },
  metal: {
    name: '금(金)',
    nature: '가을의 달',
    image: '🌙',
    color: 'text-slate-600',
  },
  water: {
    name: '수(水)',
    nature: '겨울의 바다',
    image: '🌊',
    color: 'text-blue-600',
  },
}

// TODO: 용신 설명 (Phase 2 확장용)
// const ELEMENT_YONGSIN_DESC: Record<string, string> = {
//   wood: '성장과 확장의 기운',
//   fire: '열정과 표현의 기운',
//   earth: '안정과 중심의 기운',
//   metal: '결단과 정리의 기운',
//   water: '지혜와 유연의 기운',
// }

// ============================================
// Main Component
// ============================================

export function ResultMagazine() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [data, setData] = useState<StoredResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('manse_result')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredResult
        setData(parsed)
      } catch {
        setError('결과를 불러올 수 없습니다')
      }
    } else {
      setError('결과가 없습니다. 다시 입력해주세요.')
    }
    setIsLoading(false)
  }, [])

  // 부족한 오행 계산
  const lackingElement = useMemo(() => {
    if (!data?.result?.analysis?.ohhaeng) return null
    const dist = data.result.analysis.ohhaeng.distribution
    const sorted = Object.entries(dist)
      .filter(([key]) => key !== 'total')
      .sort((a, b) => a[1] - b[1])
    return sorted[0]?.[0] || null
  }, [data])

  // TODO: 현재 대운 찾기 (Phase 2 - 대운 섹션 확장용)
  // const currentDaeun = useMemo(() => {
  //   if (!data?.result?.analysis?.daeun || !data.input.birthDate) return null
  //   const birthYear = new Date(data.input.birthDate).getFullYear()
  //   const currentYear = new Date().getFullYear()
  //   const age = currentYear - birthYear + 1
  //   return data.result.analysis.daeun.list.find(
  //     (d) => age >= d.startAge && age <= d.endAge
  //   )
  // }, [data])

  const handleReset = () => {
    sessionStorage.removeItem('manse_result')
    router.push('/mansaeryeok/new')
  }

  // ============================================
  // Loading State
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400 mx-auto" />
          <p className="text-stone-500 font-sans">운명의 흐름을 읽고 있습니다...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // Error State
  // ============================================
  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-stone-400" />
          </div>
          <p className="text-stone-600 font-sans">{error}</p>
          <Button
            onClick={() => router.push('/mansaeryeok/new')}
            className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl px-6"
          >
            다시 입력하기
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { result, input } = data
  const dayMaster = result.dayMaster
  const elementInfo = dayMaster ? ELEMENT_INFO[dayMaster.element] : null
  const interpretation = result.interpretation

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* ============================================ */}
      {/* Guest Banner */}
      {/* ============================================ */}
      {!isSignedIn && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
          <p className="text-center text-sm text-amber-800 font-sans">
            ✨ 지금은 임시 결과입니다. 브라우저를 닫으면 사라져요.
          </p>
        </div>
      )}

      {/* ============================================ */}
      {/* Hero Section */}
      {/* ============================================ */}
      <header className="pt-12 pb-8 px-4">
        <div className="max-w-lg mx-auto text-center space-y-2">
          <p className="text-stone-500 font-sans text-sm tracking-wide">
            {input.birthDate.replace(/-/g, '.')} 탄생
          </p>
          <h1 className="font-serif text-3xl text-stone-800">
            {input.name}님의 타고난 기질
          </h1>
        </div>
      </header>

      {/* ============================================ */}
      {/* Section A: Identity (나의 본질) */}
      {/* ============================================ */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* 자연물 이미지 영역 */}
            <div className="h-48 bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl">{elementInfo?.image || '🌟'}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-stone-500 font-sans text-sm mb-1">나의 고유한 기질</p>
                <h2 className="font-serif text-2xl text-stone-800">
                  {elementInfo?.nature || ''}의 성향
                </h2>
                <p className="text-stone-600 font-sans mt-2">
                  {dayMaster?.hangul}({dayMaster?.hanja}) · {elementInfo?.name}{' '}
                  {dayMaster?.yinYang === 'yang' ? '양' : '음'}
                </p>
              </div>

              {/* 사주 4주 시각화 */}
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-stone-100">
                <PillarCard
                  label="시주"
                  pillar={result.pillars.hour}
                  unknown={input.timeAccuracy === 'unknown'}
                />
                <PillarCard label="일주" pillar={result.pillars.day} highlight />
                <PillarCard label="월주" pillar={result.pillars.month} />
                <PillarCard label="년주" pillar={result.pillars.year} />
              </div>

              {/* 해석 요약 */}
              {interpretation?.summary && (
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-stone-600 font-sans text-sm leading-relaxed">
                    {interpretation.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section B: Music Therapy (무료 솔루션) */}
      {/* ============================================ */}
      {lackingElement && (
        <section className="px-4 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                {/* Album Cover Style */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                  <Music className="h-8 w-8 text-amber-600" />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-stone-500 font-sans text-xs uppercase tracking-wider">
                      기운의 밸런스
                    </p>
                    <h3 className="font-serif text-lg text-stone-800 mt-1">
                      맞춤 밸런싱 사운드
                    </h3>
                  </div>
                  <p className="text-stone-600 font-sans text-sm">
                    나에게 부족한{' '}
                    <span className="font-medium text-amber-700">
                      {ELEMENT_INFO[lackingElement]?.name}
                    </span>{' '}
                    기운을 소리로 채웁니다.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Music className="mr-2 h-4 w-4" />
                    밸런싱 사운드 재생
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* Section C: The Hook (결정적 시기) */}
      {/* ============================================ */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="relative bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Blurred Timeline Background */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-stone-500 font-sans text-xs uppercase tracking-wider">
                  Timing
                </p>
                <h3 className="font-serif text-xl text-stone-800 mt-1">
                  결정적인 때
                </h3>
              </div>

              {/* Blurred Preview */}
              <div className="relative">
                <div className="blur-sm opacity-60 select-none pointer-events-none">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-stone-100 rounded-lg flex items-center justify-center"
                      >
                        <span className="text-stone-400 text-sm">
                          {20 + i * 10}대
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-2 bg-stone-100 rounded-full" />
                </div>

                {/* Lock Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-lg border border-stone-200">
                    <Lock className="h-5 w-5 text-stone-400 mx-auto mb-2" />
                    <p className="text-stone-600 font-sans text-sm">
                      당신의 기질이 가장 빛나는 시기는?
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl">
                <Lock className="mr-2 h-4 w-4" />
                나의 전성기와 흐름 확인
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Section D: Product Cards (전문가 서비스) */}
      {/* ============================================ */}
      <section className="px-4 pb-16">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="text-center mb-6">
            <p className="text-stone-500 font-sans text-xs uppercase tracking-wider">
              Expert Services
            </p>
            <h3 className="font-serif text-xl text-stone-800 mt-1">
              더 깊은 통찰
            </h3>
          </div>

          {/* Product Card 1: 해석서 */}
          <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-white">
                BEST
              </span>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>

            <h4 className="font-serif text-lg text-stone-800 mb-2">
              평생 운세 정밀 해석서
            </h4>
            <p className="text-stone-600 font-sans text-sm mb-4">
              타고난 그릇부터 10년 대운 흐름까지, 수십 년 축적된 명리학 데이터를
              바탕으로 작성됩니다.
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <div>
                <span className="text-stone-400 font-sans text-sm line-through">
                  ₩29,000
                </span>
                <span className="text-stone-800 font-sans text-lg font-medium ml-2">
                  ₩19,000
                </span>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                자세히 보기
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Card 2: 1:1 코칭 */}
          <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Private
              </span>
              <MessageCircle className="h-5 w-5 text-amber-500" />
            </div>

            <h4 className="font-serif text-lg text-stone-800 mb-2">
              1:1 프라이빗 운세 코칭
            </h4>
            <p className="text-stone-600 font-sans text-sm mb-4">
              방대한 데이터를 학습한{' '}
              <span className="font-medium">전담 분석가</span>와 나누는 깊이 있는
              대화. 궁금한 것을 자유롭게 물어보세요.
            </p>

            <Button className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl">
              프라이빗 상담 시작
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* Footer Actions */}
      {/* ============================================ */}
      <footer className="px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <Button
            variant="ghost"
            className="w-full text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            다시 입력하기
          </Button>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

function PillarCard({
  label,
  pillar,
  highlight = false,
  unknown = false,
}: {
  label: string
  pillar: PillarData | null
  highlight?: boolean
  unknown?: boolean
}) {
  if (unknown) {
    return (
      <div className="text-center">
        <p className="text-stone-400 font-sans text-xs mb-1">{label}</p>
        <div className="bg-stone-50 rounded-xl py-3">
          <span className="text-stone-300 text-xl">?</span>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-stone-400 font-sans text-xs mb-1">{label}</p>
      <div
        className={`rounded-xl py-3 ${
          highlight
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-stone-50'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`block text-lg font-medium ${
              highlight ? 'text-amber-700' : 'text-stone-700'
            }`}
          >
            {pillar?.stem || '-'}
          </span>
          <span className="block text-lg text-stone-500">
            {pillar?.branch || '-'}
          </span>
        </div>
      </div>
    </div>
  )
}
