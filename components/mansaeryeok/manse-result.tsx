'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Loader2, Save, RotateCcw, Clock, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { SajuTableDetail } from './saju-table-detail'
import { OhhaengChart } from './ohhaeng-chart'
import { DaeunTimeline } from './daeun-timeline'
import { SinshalBadges } from './sinshal-badges'
import { YeonunWolun } from './yeonun-wolun'

import type {
  FourPillars,
  HeavenlyStem,
  OhhaengDistribution,
  SinGangYakAnalysis,
  Daeun,
  Sinsal,
  FiveElement,
} from '@/lib/manse'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/manse'

// 오행 색상 매핑
const ELEMENT_COLORS: Record<string, string> = {
  wood: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  fire: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  earth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  metal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  water: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

// 오행 한글 매핑
const ELEMENT_NAMES: Record<string, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

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
    longitudeCorrection?: {
      longitude: number
      correctionMinutes: number
      originalLocalTime: string
      correctedSolarTime: string
    }
  }
  analysis?: {
    ohhaeng: {
      distribution: OhhaengDistribution
      percentage: Record<FiveElement, number>
    }
    sinGangYak: SinGangYakAnalysis
    yongsin: { element: FiveElement; description: string }
    sinsals: {
      all: Sinsal[]
      gilsung: Sinsal[]
      hyungsal: Sinsal[]
    }
    daeun: {
      isForward: boolean
      startAge: number
      list: Array<{
        order: number
        startAge: number
        endAge: number
        stemBranch: { hangul: string; hanja: string }
        stemSipsung: { name: string; code: string }
        branchSipsung: { name: string; code: string }
      }>
    }
    sipsungDistribution: Record<string, number>
  }
}

interface StoredResult {
  input: {
    name: string
    birthDate: string
    birthTime: string | null
    timeAccuracy: string
    gender?: string
    city?: string | null
  }
  result: ResultData
  savedAt: string
}

export function ManseResult() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [data, setData] = useState<StoredResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // sessionStorage에서 결과 불러오기
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

  // FourPillars 객체로 변환
  const fourPillars = useMemo<FourPillars | null>(() => {
    if (!data?.result?.pillars) return null

    const getPillar = (p: PillarData | null) => {
      if (!p) return { stem: null, branch: null, stemBranch: null }

      const stem = HEAVENLY_STEMS.find((s) => s.hangul === p.stem) || null
      const branch = EARTHLY_BRANCHES.find((b) => b.hangul === p.branch) || null

      return {
        stem,
        branch,
        stemBranch: stem && branch ? {
          stem,
          branch,
          index: 0,
          hangul: p.full,
          hanja: stem.hanja + branch.hanja,
        } : null,
      }
    }

    return {
      year: getPillar(data.result.pillars.year),
      month: getPillar(data.result.pillars.month),
      day: getPillar(data.result.pillars.day),
      hour: data.input.timeAccuracy === 'unknown' ? null : getPillar(data.result.pillars.hour),
    }
  }, [data])

  // 일간 객체
  const dayMaster = useMemo<HeavenlyStem | null>(() => {
    if (!data?.result?.dayMaster) return null
    return HEAVENLY_STEMS.find((s) => s.hangul === data.result.dayMaster?.hangul) || null
  }, [data])

  // 현재 나이 계산
  const currentAge = useMemo(() => {
    if (!data?.input?.birthDate) return undefined
    const birthYear = new Date(data.input.birthDate).getFullYear()
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear + 1 // 한국 나이
  }, [data])

  // 대운 데이터 변환
  const daeunList = useMemo<Daeun[]>(() => {
    if (!data?.result?.analysis?.daeun) return []

    return data.result.analysis.daeun.list.map((d) => {
      const stem = HEAVENLY_STEMS.find((s) => s.hangul === d.stemBranch.hangul[0])
      const branch = EARTHLY_BRANCHES.find((b) => b.hangul === d.stemBranch.hangul[1])

      return {
        order: d.order,
        startAge: d.startAge,
        endAge: d.endAge,
        stemBranch: {
          stem: stem || HEAVENLY_STEMS[0],
          branch: branch || EARTHLY_BRANCHES[0],
          index: 0,
          hangul: d.stemBranch.hangul,
          hanja: d.stemBranch.hanja,
        },
        stemSipsung: {
          code: d.stemSipsung.code as any,
          name: d.stemSipsung.name,
          hanja: '',
          shortName: d.stemSipsung.name[0],
        },
        branchSipsung: {
          code: d.branchSipsung.code as any,
          name: d.branchSipsung.name,
          hanja: '',
          shortName: d.branchSipsung.name[0],
        },
      }
    })
  }, [data])

  const handleSave = async () => {
    if (!data || !isSignedIn) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/mansaeryeok/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.input.name,
          gender: data.input.gender || 'male',
          birthDate: data.input.birthDate,
          inputJson: data.input,
          resultJson: data.result,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || '저장에 실패했습니다')
      }

      setSaveSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    sessionStorage.removeItem('manse_result')
    router.push('/mansaeryeok/new')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => router.push('/mansaeryeok/new')}>
                다시 입력하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { result, input } = data
  const analysis = result.analysis

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* 게스트 알림 */}
      {!isSignedIn && (
        <Alert>
          <AlertDescription>
            지금은 임시 결과입니다. 브라우저를 닫으면 사라져요.{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push('/sign-in')}
            >
              로그인하여 보관함에 영구 저장하기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 저장 성공 알림 */}
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
          <AlertDescription className="text-green-800 dark:text-green-200">
            보관함에 저장되었습니다!
          </AlertDescription>
        </Alert>
      )}

      {/* 기본 정보 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {input.name}님의 사주팔자
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {input.birthDate} {input.birthTime || '(시간 미상)'}
          </p>
          {input.city && (
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3" />
              {input.city}
            </p>
          )}
          {result.meta.longitudeCorrection && (
            <div className="mt-3 mx-auto max-w-sm">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <Clock className="h-4 w-4" />
                  <span>
                    입력하신 지역 정보에 따라{' '}
                    <strong>
                      {result.meta.longitudeCorrection.correctionMinutes > 0 ? '+' : ''}
                      {result.meta.longitudeCorrection.correctionMinutes}분
                    </strong>
                    을 보정합니다.
                  </span>
                </div>
                <p className="text-center text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {result.meta.longitudeCorrection.originalLocalTime} →{' '}
                  {result.meta.longitudeCorrection.correctedSolarTime} (진태양시)
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* 간단한 사주 표 */}
          <div className="grid grid-cols-4 gap-2 text-center mb-6">
            <div className="text-sm text-muted-foreground py-2">시주</div>
            <div className="text-sm text-muted-foreground py-2">일주</div>
            <div className="text-sm text-muted-foreground py-2">월주</div>
            <div className="text-sm text-muted-foreground py-2">년주</div>

            {/* 천간 */}
            <PillarCell
              value={result.pillars.hour?.stem}
              unknown={input.timeAccuracy === 'unknown'}
            />
            <PillarCell value={result.pillars.day?.stem} highlight />
            <PillarCell value={result.pillars.month?.stem} />
            <PillarCell value={result.pillars.year?.stem} />

            {/* 지지 */}
            <PillarCell
              value={result.pillars.hour?.branch}
              unknown={input.timeAccuracy === 'unknown'}
            />
            <PillarCell value={result.pillars.day?.branch} />
            <PillarCell value={result.pillars.month?.branch} />
            <PillarCell value={result.pillars.year?.branch} />
          </div>

          {/* 일주 정보 */}
          {result.dayMaster && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">일주:</span>
              <Badge className={ELEMENT_COLORS[result.dayMaster.element]}>
                {result.dayMaster.hangul} ({result.dayMaster.hanja})
              </Badge>
              <span className="text-sm">
                {ELEMENT_NAMES[result.dayMaster.element]}{' '}
                {result.dayMaster.yinYang === 'yang' ? '양' : '음'}
              </span>
            </div>
          )}

          {/* 절기 정보 */}
          {result.solarTerm && (
            <div className="text-center text-sm text-muted-foreground">
              기준 절기: {result.solarTerm.name} ({result.solarTerm.hanja})
            </div>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과가 있는 경우 탭으로 표시 */}
      {analysis && fourPillars && dayMaster && (
        <Tabs defaultValue="detail" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detail">상세표</TabsTrigger>
            <TabsTrigger value="ohhaeng">오행분석</TabsTrigger>
            <TabsTrigger value="daeun">대운</TabsTrigger>
            <TabsTrigger value="yeonun">연운/월운</TabsTrigger>
          </TabsList>

          {/* 상세 사주표 */}
          <TabsContent value="detail" className="space-y-6">
            <SajuTableDetail
              pillars={fourPillars}
              dayMaster={dayMaster}
              timeUnknown={input.timeAccuracy === 'unknown'}
            />

            {/* 신살 */}
            {analysis.sinsals.all.length > 0 && (
              <SinshalBadges sinsals={analysis.sinsals.all} />
            )}
          </TabsContent>

          {/* 오행 분석 */}
          <TabsContent value="ohhaeng">
            <OhhaengChart
              distribution={analysis.ohhaeng.distribution}
              sinGangYak={analysis.sinGangYak}
              yongsin={analysis.yongsin}
            />
          </TabsContent>

          {/* 대운 */}
          <TabsContent value="daeun">
            <DaeunTimeline
              daeunList={daeunList}
              startAge={analysis.daeun.startAge}
              currentAge={currentAge}
              gender={(input.gender as 'male' | 'female') || 'male'}
              isForward={analysis.daeun.isForward}
            />
          </TabsContent>

          {/* 연운/월운 */}
          <TabsContent value="yeonun">
            <YeonunWolun dayMaster={dayMaster} />
          </TabsContent>
        </Tabs>
      )}

      {/* 분석 결과가 없는 경우 (성별 미입력) */}
      {!analysis && (
        <Alert>
          <AlertDescription>
            상세 분석을 보려면 성별을 입력해주세요.{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleReset}
            >
              다시 입력하기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 입력
        </Button>

        {isSignedIn && !saveSuccess && (
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                보관함에 저장
              </>
            )}
          </Button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* 메타 정보 (디버그용, 프로덕션에서는 숨김) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">디버그 정보</summary>
          <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
            {JSON.stringify(result.meta, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

// 사주 셀 컴포넌트
function PillarCell({
  value,
  highlight = false,
  unknown = false,
}: {
  value?: string
  highlight?: boolean
  unknown?: boolean
}) {
  if (unknown) {
    return <div className="py-4 text-2xl text-muted-foreground">?</div>
  }

  return (
    <div
      className={`py-4 text-2xl font-bold ${highlight ? 'text-primary' : ''}`}
    >
      {value || '-'}
    </div>
  )
}
