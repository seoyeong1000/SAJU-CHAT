/**
 * 만세력 결과 저장 API
 * POST /api/mansaeryeok/save
 *
 * 로그인 사용자만 사주 결과를 저장할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createClerkSupabaseClient } from '@/lib/supabase/server'
import { TABLE_SAJU_CHARTS } from '@/lib/constants'

// 요청 스키마
const SaveRequestSchema = z.object({
  // 저장할 이름 (선택)
  name: z.string().max(50).optional(),

  // 성별
  gender: z.enum(['male', 'female']),

  // 생년월일시
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  birthHour: z.string().optional(), // 시진 표시용 (예: "오시")

  // 입력 정보 (원본)
  inputJson: z.object({
    birthDate: z.string(),
    birthTime: z.string().nullable().optional(),
    timeAccuracy: z.enum(['exact', 'approximate', 'unknown']),
    gender: z.enum(['male', 'female']).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timezone: z.string().optional(),
  }),

  // 계산 결과
  resultJson: z.object({
    pillars: z.object({
      year: z.object({ stem: z.string(), branch: z.string(), full: z.string() }).nullable(),
      month: z.object({ stem: z.string(), branch: z.string(), full: z.string() }).nullable(),
      day: z.object({ stem: z.string(), branch: z.string(), full: z.string() }).nullable(),
      hour: z.object({ stem: z.string(), branch: z.string(), full: z.string() }).nullable(),
    }),
    dayMaster: z.object({
      hangul: z.string(),
      hanja: z.string(),
      element: z.string(),
      yinYang: z.string(),
    }).nullable(),
    solarTerm: z.object({
      name: z.string(),
      hanja: z.string(),
      date: z.string(),
    }).nullable(),
    meta: z.object({
      engineVersion: z.string(),
      calculatedAt: z.string(),
      julianDay: z.number(),
      sunLongitude: z.number(),
    }),
  }),
})

type SaveRequest = z.infer<typeof SaveRequestSchema>

// 응답 타입
interface SaveResponse {
  success: boolean
  data?: {
    id: string
    name: string | null
    createdAt: string
  }
  error?: {
    code: string
    message: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SaveResponse>> {
  try {
    // 1. 인증 확인
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다',
          },
        },
        { status: 401 }
      )
    }

    // 2. 요청 파싱
    const body = await request.json()

    // 3. 유효성 검증
    const parseResult = SaveRequestSchema.safeParse(body)

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

    // 4. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient()

    // 5. 차트 저장
    const { data: savedChart, error: saveError } = await supabase
      .from(TABLE_SAJU_CHARTS)
      .insert({
        owner_id: userId,
        name: data.name || null,
        gender: data.gender,
        birth_date: new Date(data.birthDate).toISOString(),
        birth_hour: data.birthHour || null,
        input_json: data.inputJson,
        result_json: data.resultJson,
        is_locked: false,
      })
      .select('id, name, created_at')
      .single()

    if (saveError) {
      console.error('[API] /api/mansaeryeok/save error:', saveError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '저장에 실패했습니다',
          },
        },
        { status: 500 }
      )
    }

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        id: savedChart.id,
        name: savedChart.name,
        createdAt: savedChart.created_at,
      },
    })
  } catch (error) {
    console.error('[API] /api/mansaeryeok/save error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 내부 오류가 발생했습니다',
        },
      },
      { status: 500 }
    )
  }
}
