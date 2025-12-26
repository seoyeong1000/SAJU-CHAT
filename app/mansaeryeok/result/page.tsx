import { Metadata } from 'next'
import { createClerkSupabaseClient } from '@/lib/supabase/server'
import { TABLE_SAJU_CHARTS } from '@/lib/constants'
import ResultDashboard from '@/components/mansaeryeok/result-dashboard'
import type { SajuChart } from '@/types/database.types'

export const metadata: Metadata = {
  title: '사주 결과 - 나의 타고난 기질',
  description: '당신만의 고유한 기질과 운명의 흐름을 확인하세요',
}

interface PageProps {
  searchParams: Promise<{
    id?: string
    // 비회원용 URL 파라미터
    birthDate?: string
    gender?: string
    birthTime?: string
    calendarType?: string
    timeUnknown?: string
    city?: string
    name?: string
  }>
}

/**
 * URL 파라미터에서 비회원용 임시 결과 생성
 */
function createGuestResult(params: {
  birthDate: string
  gender?: string
  birthTime?: string
  calendarType?: string
  timeUnknown?: string
  city?: string
  name?: string
}): SajuChart {
  const { birthDate, gender, birthTime, timeUnknown, city, name } = params

  // 시간 파싱
  let birthHour: number | null = null
  if (timeUnknown !== 'true' && birthTime) {
    const hourPart = birthTime.split(':')[0]
    birthHour = parseInt(hourPart, 10)
  }

  // [임시] Mock 만세력 결과 생성
  // 추후 실제 엔진 연동 시 여기서 계산 수행
  const mockResultJson = {
    pillars: {
      year: { stem: '갑', branch: '진', full: '갑진' },
      month: { stem: '병', branch: '인', full: '병인' },
      day: { stem: '무', branch: '자', full: '무자' },
      hour: birthHour !== null ? { stem: '경', branch: '신', full: '경신' } : null,
    },
    dayMaster: {
      hangul: '무',
      hanja: '戊',
      element: 'earth',
      yinYang: 'yang',
    },
    solarTerm: {
      name: '입춘',
      hanja: '立春',
      date: '2024-02-04',
    },
    meta: {
      engineVersion: 'mock-1.0.0',
      calculatedAt: new Date().toISOString(),
      julianDay: 2460000,
      sunLongitude: 315.0,
    },
    analysis: {
      ohhaeng: {
        percentage: {
          wood: 30,
          fire: 20,
          earth: 30,
          metal: 10,
          water: 10,
        },
      },
      personality: '당신의 사주를 분석했습니다. 결과를 저장하려면 로그인해주세요.',
      strength: '실시간 계산 결과',
      weakness: '로그인 후 저장 가능',
    },
  }

  return {
    id: '', // 비회원은 ID 없음
    name: name || '이름 없음',
    gender: gender || null,
    birth_date: birthDate,
    birth_hour: birthHour,
    input_json: {
      birthDate,
      birthTime,
      calendarType: params.calendarType,
      timeAccuracy: timeUnknown === 'true' ? 'unknown' : 'exact',
      gender,
      city,
    },
    result_json: mockResultJson,
    created_at: new Date().toISOString(),
  } as unknown as SajuChart
}

export default async function MansaeryeokResultPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { id, birthDate } = params

  // ========================================
  // Case A: ID가 있으면 DB에서 조회 (회원)
  // ========================================
  if (id) {
    const supabase = await createClerkSupabaseClient()
    const { data: chartData, error } = await supabase
      .from(TABLE_SAJU_CHARTS)
      .select('*')
      .eq('id', id)
      .single<SajuChart>()

    if (error || !chartData) {
      console.error('[Result Page] Error fetching chart:', error)
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-slate-400">분석 결과를 찾을 수 없습니다.</p>
            <a
              href="/mansaeryeok/new"
              className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              새로 입력하기
            </a>
          </div>
        </div>
      )
    }

    // 회원: isSaved = true
    return <ResultDashboard chartData={chartData} isSaved={true} />
  }

  // ========================================
  // Case B: birthDate가 있으면 URL 파라미터에서 파싱 (비회원)
  // ========================================
  if (birthDate) {
    const guestData = createGuestResult({
      birthDate,
      gender: params.gender,
      birthTime: params.birthTime,
      calendarType: params.calendarType,
      timeUnknown: params.timeUnknown,
      city: params.city,
      name: params.name,
    })

    // 비회원: isSaved = false
    return <ResultDashboard chartData={guestData} isSaved={false} />
  }

  // ========================================
  // 둘 다 없으면 에러
  // ========================================
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-slate-400">분석 결과가 없습니다.</p>
        <a
          href="/mansaeryeok/new"
          className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          새로 입력하기
        </a>
      </div>
    </div>
  )
}
