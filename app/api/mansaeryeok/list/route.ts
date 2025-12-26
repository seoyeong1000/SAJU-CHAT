/**
 * 저장된 만세력 목록 조회 API
 * GET /api/mansaeryeok/list
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase/server'
import { TABLE_SAJU_CHARTS } from '@/lib/constants'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      )
    }

    const supabase = await createClerkSupabaseClient()

    const { data, error } = await supabase
      .from(TABLE_SAJU_CHARTS)
      .select('id, name, gender, birth_date, birth_hour, created_at, result_json')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[API] /api/mansaeryeok/list error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '목록 조회에 실패했습니다' } },
        { status: 500 }
      )
    }

    // 간단한 정보만 반환
    const list = (data || []).map(item => {
      const resultJson = item.result_json as { pillars?: { day?: { stem?: string; branch?: string } } } | null
      const dayPillar = resultJson?.pillars?.day
        ? `${resultJson.pillars.day.stem || ''}${resultJson.pillars.day.branch || ''}`
        : null

      return {
        id: item.id,
        name: item.name,
        gender: item.gender,
        birthDate: item.birth_date,
        birthHour: item.birth_hour,
        dayPillar,
        createdAt: item.created_at,
      }
    })

    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    console.error('[API] /api/mansaeryeok/list error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
