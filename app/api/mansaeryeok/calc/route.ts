/**
 * 만세력 계산 API
 * POST /api/mansaeryeok/calc
 *
 * 생년월일시를 입력받아 사주팔자를 계산합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateManse, ManseError, performFullAnalysis, formatAnalysisForApi } from '@/lib/manse'
import type { ManseInput, TimeAccuracy } from '@/lib/manse'

// 요청 스키마
const CalcRequestSchema = z.object({
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

  // 출생지 좌표 (선택)
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // 타임존 (기본: Asia/Seoul)
  timezone: z.string().optional().default('Asia/Seoul'),
})

type CalcRequest = z.infer<typeof CalcRequestSchema>

// 응답 타입
interface CalcResponse {
  success: boolean
  data?: {
    pillars: {
      year: { stem: string; branch: string; full: string } | null
      month: { stem: string; branch: string; full: string } | null
      day: { stem: string; branch: string; full: string } | null
      hour: { stem: string; branch: string; full: string } | null
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
  }
  error?: {
    code: string
    message: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CalcResponse>> {
  try {
    // 1. 요청 파싱
    const body = await request.json()

    // 2. 유효성 검증
    const parseResult = CalcRequestSchema.safeParse(body)

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
    // timeAccuracy가 unknown이거나 birthTime이 없으면 시간 모름으로 처리
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
          next: null, // TODO: 다음 절기 정보 추가
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

    // 6. 응답 포맷팅
    const response = {
      success: true,
      data: {
        pillars: {
          year: result.pillars.year.stemBranch
            ? {
                stem: result.pillars.year.stemBranch.stem.hangul,
                branch: result.pillars.year.stemBranch.branch.hangul,
                full: result.pillars.year.stemBranch.hangul,
              }
            : null,
          month: result.pillars.month.stemBranch
            ? {
                stem: result.pillars.month.stemBranch.stem.hangul,
                branch: result.pillars.month.stemBranch.branch.hangul,
                full: result.pillars.month.stemBranch.hangul,
              }
            : null,
          day: result.pillars.day.stemBranch
            ? {
                stem: result.pillars.day.stemBranch.stem.hangul,
                branch: result.pillars.day.stemBranch.branch.hangul,
                full: result.pillars.day.stemBranch.hangul,
              }
            : null,
          hour: result.pillars.hour?.stemBranch
            ? {
                stem: result.pillars.hour.stemBranch.stem.hangul,
                branch: result.pillars.hour.stemBranch.branch.hangul,
                full: result.pillars.hour.stemBranch.hangul,
              }
            : null,
        },
        dayMaster: result.dayMaster
          ? {
              hangul: result.dayMaster.hangul,
              hanja: result.dayMaster.hanja,
              element: result.dayMaster.element,
              yinYang: result.dayMaster.yinYang,
            }
          : null,
        solarTerm: result.solarTerm.current
          ? {
              name: result.solarTerm.current.name,
              hanja: result.solarTerm.current.hanja,
              date: result.solarTerm.current.dateTimeUtc.toISOString(),
            }
          : null,
        meta: {
          engineVersion: result.meta.engineVersion,
          calculatedAt: result.meta.calculatedAt,
          julianDay: result.meta.julianDay,
          sunLongitude: result.meta.sunLongitude,
          ...(result.meta.longitudeCorrection && {
            longitudeCorrection: result.meta.longitudeCorrection,
          }),
        },
        // 분석 결과 추가
        analysis: analysisData,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // 에러 로깅 시 한글 문자열 깨짐 방지
    const safeErrorLog = (err: unknown): string => {
      if (err instanceof Error) {
        // ASCII 문자만 포함하도록 변환 (WASM panic 방지)
        return err.message.replace(/[^\x00-\x7F]/g, '?')
      }
      return String(err).replace(/[^\x00-\x7F]/g, '?')
    }

    console.error('[API] /api/mansaeryeok/calc error:', safeErrorLog(error))

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

    // 일반 에러 - 사용자에게는 안전한 메시지 표시
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
