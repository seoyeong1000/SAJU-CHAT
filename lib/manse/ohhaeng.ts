/**
 * 오행(五行) 분석 모듈
 * 사주 내 오행 분포 및 신강/신약 분석
 */

import type {
  FourPillars,
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  OhhaengDistribution,
  SinGangYak,
  SinGangYakAnalysis,
  SipsungCode,
} from './types'
import { HEAVENLY_STEMS } from './constants'
import { calculateStemSipsung, calculateHiddenStemsSipsung } from './sipsung'

// ============================================
// 오행 분포 계산
// ============================================

/**
 * 사주의 오행 분포를 계산
 * 천간, 지지, 지장간을 모두 고려
 * @param pillars 사주 팔자
 * @param includeHiddenStems 지장간 포함 여부 (기본: true)
 * @returns 오행 분포
 */
export function calculateOhhaengDistribution(
  pillars: FourPillars,
  includeHiddenStems: boolean = true
): OhhaengDistribution {
  const distribution: OhhaengDistribution = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
    total: 0,
  }

  // 각 기둥 순회
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour]

  for (const pillar of pillarList) {
    if (!pillar) continue

    // 천간 오행 카운트
    if (pillar.stem) {
      distribution[pillar.stem.element]++
      distribution.total++
    }

    // 지지 오행 카운트 (본기 기준)
    if (pillar.branch) {
      distribution[pillar.branch.element]++
      distribution.total++

      // 지장간 오행 카운트
      if (includeHiddenStems) {
        for (const hiddenStemHangul of pillar.branch.hiddenStems) {
          const stem = HEAVENLY_STEMS.find(s => s.hangul === hiddenStemHangul)
          if (stem) {
            // 지장간은 0.5로 카운트 (가중치 적용)
            distribution[stem.element] += 0.5
            distribution.total += 0.5
          }
        }
      }
    }
  }

  return distribution
}

/**
 * 오행 분포를 퍼센트로 변환
 */
export function getOhhaengPercentage(
  distribution: OhhaengDistribution
): Record<FiveElement, number> {
  const total = distribution.total || 1
  return {
    wood: Math.round((distribution.wood / total) * 100 * 10) / 10,
    fire: Math.round((distribution.fire / total) * 100 * 10) / 10,
    earth: Math.round((distribution.earth / total) * 100 * 10) / 10,
    metal: Math.round((distribution.metal / total) * 100 * 10) / 10,
    water: Math.round((distribution.water / total) * 100 * 10) / 10,
  }
}

// ============================================
// 십성 분포 계산
// ============================================

/**
 * 사주의 십성 분포를 계산
 */
export function calculateSipsungDistribution(
  pillars: FourPillars,
  dayMaster: HeavenlyStem
): Record<SipsungCode, number> {
  const distribution: Record<SipsungCode, number> = {
    bigyeon: 0,
    geopjae: 0,
    siksin: 0,
    sanggwan: 0,
    pyeonjae: 0,
    jeongjae: 0,
    pyeongwan: 0,
    jeonggwan: 0,
    pyeonin: 0,
    jeongin: 0,
  }

  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour]

  for (const pillar of pillarList) {
    if (!pillar) continue

    // 천간 십성 (일간 자신은 제외)
    if (pillar.stem && pillar !== pillars.day) {
      const sipsung = calculateStemSipsung(dayMaster, pillar.stem)
      distribution[sipsung.code]++
    }

    // 지지 지장간 십성
    if (pillar.branch) {
      const hiddenSipsungs = calculateHiddenStemsSipsung(dayMaster, pillar.branch)
      for (const { sipsung } of hiddenSipsungs) {
        // 지장간은 0.5로 카운트
        distribution[sipsung.code] += 0.5
      }
    }
  }

  return distribution
}

// ============================================
// 신강/신약 분석
// ============================================

/**
 * 신강/신약을 판단
 * 일간의 강도를 분석하여 신강/신약/중화를 판단
 */
export function analyzeSinGangYak(
  pillars: FourPillars,
  dayMaster: HeavenlyStem,
  monthBranch: EarthlyBranch
): SinGangYakAnalysis {
  // 점수 계산 (0-100, 50이 기준점)
  let score = 50

  // 1. 월지(月支)에서 일간이 득령(得令)했는지 확인
  // 월지가 일간을 생하거나 같은 오행이면 득령
  const isMonthSupporting = checkMonthSupport(dayMaster, monthBranch)
  if (isMonthSupporting) {
    score += 15
  }

  // 2. 인성(印星), 비겁(比劫)의 힘 계산
  const sipsungDist = calculateSipsungDistribution(pillars, dayMaster)

  // 인성(편인, 정인)은 일간을 생함 → 신강
  const inSeongScore = (sipsungDist.pyeonin + sipsungDist.jeongin) * 5
  score += inSeongScore

  // 비겁(비견, 겁재)는 같은 오행 → 신강
  const biGyeopScore = (sipsungDist.bigyeon + sipsungDist.geopjae) * 5
  score += biGyeopScore

  // 3. 식상(食傷), 재성(財星), 관성(官星)의 힘 계산
  // 이들은 일간의 힘을 빼앗음 → 신약

  // 식상(식신, 상관)은 일간이 생함 → 기운 소모
  const sikSangScore = (sipsungDist.siksin + sipsungDist.sanggwan) * 3
  score -= sikSangScore

  // 재성(편재, 정재)은 일간이 극함 → 기운 소모
  const jaeSungScore = (sipsungDist.pyeonjae + sipsungDist.jeongjae) * 3
  score -= jaeSungScore

  // 관성(편관, 정관)은 일간을 극함 → 억압
  const gwanSungScore = (sipsungDist.pyeongwan + sipsungDist.jeonggwan) * 4
  score -= gwanSungScore

  // 점수 범위 제한
  score = Math.max(0, Math.min(100, score))

  // 판정
  let result: SinGangYak
  let description: string

  if (score >= 60) {
    result = 'singang'
    description = '일간의 힘이 강합니다. 재성이나 관성으로 기운을 빼주는 것이 좋습니다.'
  } else if (score <= 40) {
    result = 'sinyak'
    description = '일간의 힘이 약합니다. 인성이나 비겁으로 기운을 보충하는 것이 좋습니다.'
  } else {
    result = 'junghwa'
    description = '일간의 힘이 중화됩니다. 균형 잡힌 사주입니다.'
  }

  return {
    result,
    score: Math.round(score),
    description,
  }
}

/**
 * 월지가 일간을 돕는지 확인
 */
function checkMonthSupport(
  dayMaster: HeavenlyStem,
  monthBranch: EarthlyBranch
): boolean {
  // 같은 오행이면 도움
  if (dayMaster.element === monthBranch.element) return true

  // 월지가 일간을 생하면 도움
  // 목→화, 화→토, 토→금, 금→수, 수→목
  const elementGenerates: Record<FiveElement, FiveElement> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  }

  // 월지 오행이 일간 오행을 생하는지 확인
  return elementGenerates[monthBranch.element] === dayMaster.element
}

/**
 * 용신(用神) 판단 - 간략 버전
 * 신강이면 설기(泄氣)/극기(剋氣)하는 오행이 용신
 * 신약이면 생조(生助)하는 오행이 용신
 */
export function suggestYongsin(
  dayMaster: HeavenlyStem,
  sinGangYak: SinGangYak
): { element: FiveElement; description: string } {
  const elementGenerates: Record<FiveElement, FiveElement> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  }

  const elementGeneratedBy: Record<FiveElement, FiveElement> = {
    wood: 'water',
    fire: 'wood',
    earth: 'fire',
    metal: 'earth',
    water: 'metal',
  }

  const elementControls: Record<FiveElement, FiveElement> = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood',
  }

  if (sinGangYak === 'singang') {
    // 신강: 일간이 생하는 오행(식상) 또는 일간이 극하는 오행(재성)
    const yongsin = elementGenerates[dayMaster.element]
    return {
      element: yongsin,
      description: `신강 사주이므로 ${getElementKo(yongsin)}(식상)이 용신입니다.`,
    }
  } else if (sinGangYak === 'sinyak') {
    // 신약: 일간을 생하는 오행(인성) 또는 같은 오행(비겁)
    const yongsin = elementGeneratedBy[dayMaster.element]
    return {
      element: yongsin,
      description: `신약 사주이므로 ${getElementKo(yongsin)}(인성)이 용신입니다.`,
    }
  } else {
    // 중화: 가장 부족한 오행
    return {
      element: dayMaster.element,
      description: '중화 사주이므로 균형 유지가 중요합니다.',
    }
  }
}

function getElementKo(element: FiveElement): string {
  const map: Record<FiveElement, string> = {
    wood: '목',
    fire: '화',
    earth: '토',
    metal: '금',
    water: '수',
  }
  return map[element]
}
