/**
 * 사주 해석 데이터 조회 모듈
 *
 * interpretation_base 테이블에서 logic_key 기반으로 해석 데이터를 조회합니다.
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role'
import type { StemBranch } from '@/lib/manse/types'

/**
 * interpretation_base 테이블의 content_sections 구조
 */
export interface InterpretationSections {
  essence?: string       // 핵심 엔진
  psychology?: string    // 심리/행동 패턴
  personality?: string   // 성격 분석
  relationships?: string // 관계/실천 가이드
}

/**
 * interpretation_base 테이블 레코드 타입
 */
export interface InterpretationBase {
  id: string
  logic_key: string
  domain: string
  subdomain: string
  title: string
  one_line_summary: string
  content_sections: InterpretationSections
  created_at: string
  updated_at: string
}

/**
 * 조회 결과 타입 (클라이언트에 반환할 형태)
 */
export interface InterpretationResult {
  title: string
  summary: string
  sections: {
    essence: string | null
    psychology: string | null
    personality: string | null
    relationships: string | null
  }
}

/**
 * 간지(StemBranch)에서 logic_key를 생성합니다.
 *
 * @param stemBranch - 간지 정보 (천간 + 지지)
 * @param pillarType - 기둥 유형 ('daily' | 'yearly' | 'monthly' | 'hourly')
 * @returns logic_key 문자열 (예: 'ganji.daily.jia_zi')
 *
 * @example
 * ```ts
 * const stemBranch = result.pillars.day.stemBranch;
 * const logicKey = buildLogicKey(stemBranch, 'daily');
 * // returns: 'ganji.daily.jia_zi'
 * ```
 */
export function buildLogicKey(
  stemBranch: StemBranch,
  pillarType: 'daily' | 'yearly' | 'monthly' | 'hourly' = 'daily'
): string {
  const stemCode = stemBranch.stem.code.toLowerCase()
  const branchCode = stemBranch.branch.code.toLowerCase()
  return `ganji.${pillarType}.${stemCode}_${branchCode}`
}

/**
 * 한글 간지명에서 logic_key를 생성합니다.
 *
 * @param hangul - 한글 간지명 (예: '갑자')
 * @param pillarType - 기둥 유형
 * @returns logic_key 또는 null (매핑 실패 시)
 */
export function buildLogicKeyFromHangul(
  hangul: string,
  pillarType: 'daily' | 'yearly' | 'monthly' | 'hourly' = 'daily'
): string | null {
  // 천간 매핑
  const stemMap: Record<string, string> = {
    '갑': 'jia', '을': 'yi', '병': 'bing', '정': 'ding', '무': 'wu',
    '기': 'ji', '경': 'geng', '신': 'xin', '임': 'ren', '계': 'gui'
  }

  // 지지 매핑
  const branchMap: Record<string, string> = {
    '자': 'zi', '축': 'chou', '인': 'yin', '묘': 'mao', '진': 'chen', '사': 'si',
    '오': 'wu', '미': 'wei', '신': 'shen', '유': 'you', '술': 'xu', '해': 'hai'
  }

  if (hangul.length !== 2) return null

  const stem = hangul[0]
  const branch = hangul[1]

  const stemCode = stemMap[stem]
  const branchCode = branchMap[branch]

  if (!stemCode || !branchCode) return null

  return `ganji.${pillarType}.${stemCode}_${branchCode}`
}

/**
 * logic_key로 해석 데이터를 조회합니다.
 *
 * @param logicKey - 조회할 logic_key
 * @returns InterpretationResult 또는 null
 */
export async function getInterpretationByLogicKey(
  logicKey: string
): Promise<InterpretationResult | null> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('interpretation_base')
    .select('title, one_line_summary, content_sections')
    .eq('logic_key', logicKey)
    .single()

  if (error || !data) {
    console.log(`[Interpretation] No data found for logic_key: ${logicKey}`)
    return null
  }

  const sections = data.content_sections as InterpretationSections | null

  return {
    title: data.title || '',
    summary: data.one_line_summary || '',
    sections: {
      essence: sections?.essence || null,
      psychology: sections?.psychology || null,
      personality: sections?.personality || null,
      relationships: sections?.relationships || null,
    }
  }
}

/**
 * 일주(日柱)로 해석 데이터를 조회합니다.
 *
 * @param dayStemBranch - 일주 간지 정보
 * @returns InterpretationResult 또는 null
 */
export async function getDayPillarInterpretation(
  dayStemBranch: StemBranch
): Promise<InterpretationResult | null> {
  const logicKey = buildLogicKey(dayStemBranch, 'daily')
  return getInterpretationByLogicKey(logicKey)
}

/**
 * 여러 기둥의 해석 데이터를 한 번에 조회합니다.
 *
 * @param pillars - 사주 기둥들
 * @returns 각 기둥별 해석 결과
 */
export async function getAllPillarInterpretations(pillars: {
  year?: StemBranch | null
  month?: StemBranch | null
  day?: StemBranch | null
  hour?: StemBranch | null
}): Promise<{
  year: InterpretationResult | null
  month: InterpretationResult | null
  day: InterpretationResult | null
  hour: InterpretationResult | null
}> {
  const [year, month, day, hour] = await Promise.all([
    pillars.year ? getInterpretationByLogicKey(buildLogicKey(pillars.year, 'yearly')) : null,
    pillars.month ? getInterpretationByLogicKey(buildLogicKey(pillars.month, 'monthly')) : null,
    pillars.day ? getInterpretationByLogicKey(buildLogicKey(pillars.day, 'daily')) : null,
    pillars.hour ? getInterpretationByLogicKey(buildLogicKey(pillars.hour, 'hourly')) : null,
  ])

  return { year, month, day, hour }
}
