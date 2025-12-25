/**
 * 사주 계산 + 해석 조회 API
 * POST /api/saju/calculate
 *
 * 생년월일시를 입력받아 사주팔자를 계산하고 해석 데이터를 조회합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateManse, ManseError, performFullAnalysis, formatAnalysisForApi } from '@/lib/manse'
import type { ManseInput, TimeAccuracy } from '@/lib/manse'
import { getDayPillarInterpretation, type InterpretationResult } from '@/lib/interpretation'

// 요청 스키마
const CalculateRequestSchema = z.object({
  // 생년월일 (필수)
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD 이어야 합니다'),

  // 출생시간 (선택)
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '시간 형식은 HH:mm 이어야 합니다')
    .nullable()
    .optional(),

  // 시간 정확도
  timeAccuracy: z
    .enum(['exact', 'approximate', 'unknown'])
    .optional()
    .default('exact'),

  // 성별 (선택)
  gender: z.enum(['male', 'female']).optional(),

  // 이름 (선택)
  name: z.string().optional(),

  // 출생지 좌표 (선택)
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // 타임존 (기본: Asia/Seoul)
  timezone: z.string().optional().default('Asia/Seoul'),
})

// 응답 타입
interface CalculateResponse {
  success: boolean
  data?: {
    // 입력 정보
    name?: string
    birthDate: string
    birthTime: string | null
    gender?: string
    // 사주 정보
    saju: {
      year: string | null  // 년주 (예: "갑자")
      month: string | null // 월주
      day: string | null   // 일주
      hour: string | null  // 시주
    }
    // 일간 정보
    dayMaster: {
      hangul: string
      hanja: string
      element: string
      yinYang: string
    } | null
    // 해석 데이터
    interpretation: {
      title: string
      summary: string
      sections: {
        essence: string | null
        psychology: string | null
        personality: string | null
        relationships: string | null
      }
    } | null
    // 상세 분석 (선택)
    analysis?: unknown
    // 메타 정보
    meta: {
      engineVersion: string
      calculatedAt: string
    }
  }
  error?: {
    code: string
    message: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CalculateResponse>> {
  try {
    // 1. 요청 파싱
    const body = await request.json()

    // 2. 유효성 검증
    const parseResult = CalculateRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors.map((e) => e.message).join(', '),
          },
        },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // 3. 시간 모름 처리
    const timeAccuracy: TimeAccuracy =
      data.timeAccuracy === 'unknown' || !data.birthTime ? 'unknown' : data.timeAccuracy

    // 4. 만세력 계산
    const input: ManseInput = {
      birthDate: data.birthDate,
      birthTime: timeAccuracy === 'unknown' ? null : data.birthTime || null,
      timeAccuracy,
      gender: data.gender,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
    }

    const result = await calculateManse(input)

    // 5. 분석 수행 (성별과 일간이 있는 경우)
    let analysisData = null
    if (result.dayMaster && data.gender) {
      const birthDate = new Date(data.birthDate)
      const analysis = performFullAnalysis(
        result.pillars,
        result.dayMaster,
        data.gender,
        birthDate,
        {
          current: result.solarTerm.current,
          next: null,
          prev: result.solarTerm.previous,
        }
      )
      analysisData = formatAnalysisForApi(
        analysis,
        result.dayMaster,
        result.pillars.year.stem,
        data.gender
      )
    }

    // 6. 일주 해석 데이터 조회 (DB)
    let interpretation: InterpretationResult | null = null
    if (result.pillars.day.stemBranch) {
      try {
        interpretation = await getDayPillarInterpretation(result.pillars.day.stemBranch)
      } catch (error) {
        console.error('[API] Interpretation lookup error:', error)
        // 해석 조회 실패해도 API는 정상 응답
      }
    }

    // 7. 응답 포맷팅
    const response: CalculateResponse = {
      success: true,
      data: {
        // 입력 정보
        name: data.name,
        birthDate: data.birthDate,
        birthTime: data.birthTime || null,
        gender: data.gender,
        // 사주 정보 (간단 형식)
        saju: {
          year: result.pillars.year.stemBranch?.hangul || null,
          month: result.pillars.month.stemBranch?.hangul || null,
          day: result.pillars.day.stemBranch?.hangul || null,
          hour: result.pillars.hour?.stemBranch?.hangul || null,
        },
        // 일간 정보
        dayMaster: result.dayMaster
          ? {
              hangul: result.dayMaster.hangul,
              hanja: result.dayMaster.hanja,
              element: result.dayMaster.element,
              yinYang: result.dayMaster.yinYang,
            }
          : null,
        // 해석 데이터
        interpretation: interpretation
          ? {
              title: interpretation.title,
              summary: interpretation.summary,
              sections: interpretation.sections,
            }
          : null,
        // 상세 분석
        analysis: analysisData,
        // 메타 정보
        meta: {
          engineVersion: result.meta.engineVersion,
          calculatedAt: result.meta.calculatedAt,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // 에러 로깅
    const safeErrorLog = (err: unknown): string => {
      if (err instanceof Error) {
        return err.message.replace(/[^\x00-\x7F]/g, '?')
      }
      return String(err).replace(/[^\x00-\x7F]/g, '?')
    }

    console.error('[API] /api/saju/calculate error:', safeErrorLog(error))

    // ManseError 처리
    if (error instanceof ManseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 422 }
      )
    }

    // 일반 에러
    const isSwissEphError = error instanceof Error && error.message.includes('SwissEph')

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isSwissEphError ? 'CALCULATION_ERROR' : 'INTERNAL_ERROR',
          message: isSwissEphError
            ? '천문 계산 중 오류가 발생했습니다. 입력값을 확인해주세요.'
            : '서버 내부 오류가 발생했습니다',
        },
      },
      { status: 500 }
    )
  }
}
