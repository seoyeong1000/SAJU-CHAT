/**
 * 십성(十星) 계산 모듈
 * 일간(日干)을 기준으로 각 천간/지지의 십성을 계산
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, Sipsung, SipsungCode } from './types'
import { HEAVENLY_STEMS } from './constants'

// ============================================
// 십성 상수
// ============================================

export const SIPSUNG_INFO: Record<SipsungCode, Sipsung> = {
  bigyeon: { code: 'bigyeon', name: '비견', hanja: '比肩', shortName: '비' },
  geopjae: { code: 'geopjae', name: '겁재', hanja: '劫財', shortName: '겁' },
  siksin: { code: 'siksin', name: '식신', hanja: '食神', shortName: '식' },
  sanggwan: { code: 'sanggwan', name: '상관', hanja: '傷官', shortName: '상' },
  pyeonjae: { code: 'pyeonjae', name: '편재', hanja: '偏財', shortName: '편' },
  jeongjae: { code: 'jeongjae', name: '정재', hanja: '正財', shortName: '정' },
  pyeongwan: { code: 'pyeongwan', name: '편관', hanja: '偏官', shortName: '편' },
  jeonggwan: { code: 'jeonggwan', name: '정관', hanja: '正官', shortName: '정' },
  pyeonin: { code: 'pyeonin', name: '편인', hanja: '偏印', shortName: '편' },
  jeongin: { code: 'jeongin', name: '정인', hanja: '正印', shortName: '정' },
}

// ============================================
// 오행 상생/상극 관계
// ============================================

/**
 * 오행 상생 관계 (나 → 상대를 생함)
 * 목→화, 화→토, 토→금, 금→수, 수→목
 */
const ELEMENT_GENERATES: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

/**
 * 오행 상극 관계 (나 → 상대를 극함)
 * 목→토, 토→수, 수→화, 화→금, 금→목
 */
const ELEMENT_CONTROLS: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
}

/**
 * 역방향: 나를 생하는 오행
 */
const ELEMENT_GENERATED_BY: Record<FiveElement, FiveElement> = {
  wood: 'water',
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
}

/**
 * 역방향: 나를 극하는 오행
 */
const ELEMENT_CONTROLLED_BY: Record<FiveElement, FiveElement> = {
  wood: 'metal',
  fire: 'water',
  earth: 'wood',
  metal: 'fire',
  water: 'earth',
}

// ============================================
// 십성 계산 함수
// ============================================

/**
 * 두 오행 사이의 관계를 판단
 * @param myElement 일간의 오행
 * @param targetElement 대상의 오행
 * @returns 관계 유형
 */
function getElementRelation(
  myElement: FiveElement,
  targetElement: FiveElement
): 'same' | 'generate' | 'control' | 'generated' | 'controlled' {
  if (myElement === targetElement) return 'same'
  if (ELEMENT_GENERATES[myElement] === targetElement) return 'generate'
  if (ELEMENT_CONTROLS[myElement] === targetElement) return 'control'
  if (ELEMENT_GENERATED_BY[myElement] === targetElement) return 'generated'
  if (ELEMENT_CONTROLLED_BY[myElement] === targetElement) return 'controlled'
  // 이론적으로 도달하지 않음
  return 'same'
}

/**
 * 천간의 십성을 계산
 * @param dayMaster 일간 (日干)
 * @param targetStem 대상 천간
 * @returns 십성 정보
 */
export function calculateStemSipsung(
  dayMaster: HeavenlyStem,
  targetStem: HeavenlyStem
): Sipsung {
  const relation = getElementRelation(dayMaster.element, targetStem.element)
  const sameYinYang = dayMaster.yinYang === targetStem.yinYang

  let code: SipsungCode

  switch (relation) {
    case 'same':
      // 같은 오행: 비견(같은 음양) / 겁재(다른 음양)
      code = sameYinYang ? 'bigyeon' : 'geopjae'
      break
    case 'generate':
      // 내가 생하는 오행: 식신(같은 음양) / 상관(다른 음양)
      code = sameYinYang ? 'siksin' : 'sanggwan'
      break
    case 'control':
      // 내가 극하는 오행: 편재(같은 음양) / 정재(다른 음양)
      code = sameYinYang ? 'pyeonjae' : 'jeongjae'
      break
    case 'controlled':
      // 나를 극하는 오행: 편관(같은 음양) / 정관(다른 음양)
      code = sameYinYang ? 'pyeongwan' : 'jeonggwan'
      break
    case 'generated':
      // 나를 생하는 오행: 편인(같은 음양) / 정인(다른 음양)
      code = sameYinYang ? 'pyeonin' : 'jeongin'
      break
    default:
      code = 'bigyeon'
  }

  return SIPSUNG_INFO[code]
}

/**
 * 지지의 십성을 계산 (지지의 본기 기준)
 * @param dayMaster 일간 (日干)
 * @param targetBranch 대상 지지
 * @returns 십성 정보
 */
export function calculateBranchSipsung(
  dayMaster: HeavenlyStem,
  targetBranch: EarthlyBranch
): Sipsung {
  // 지지의 본기(本氣)를 기준으로 십성 계산
  // 본기는 지장간의 첫 번째 천간
  const mainHiddenStem = targetBranch.hiddenStems[0]

  // 천간 한글 이름으로 천간 객체 찾기
  const targetStem = HEAVENLY_STEMS.find(s => s.hangul === mainHiddenStem)

  if (!targetStem) {
    // 폴백: 지지의 오행으로 판단
    return calculateStemSipsung(dayMaster, {
      ...dayMaster,
      element: targetBranch.element,
      yinYang: targetBranch.yinYang,
    })
  }

  return calculateStemSipsung(dayMaster, targetStem)
}

/**
 * 지장간의 각 천간에 대한 십성을 계산
 * @param dayMaster 일간 (日干)
 * @param targetBranch 대상 지지
 * @returns 지장간별 십성 정보 배열
 */
export function calculateHiddenStemsSipsung(
  dayMaster: HeavenlyStem,
  targetBranch: EarthlyBranch
): { stem: HeavenlyStem; sipsung: Sipsung }[] {
  return targetBranch.hiddenStems.map(hangul => {
    const stem = HEAVENLY_STEMS.find(s => s.hangul === hangul)
    if (!stem) {
      // 폴백
      return {
        stem: HEAVENLY_STEMS[0],
        sipsung: SIPSUNG_INFO.bigyeon,
      }
    }
    return {
      stem,
      sipsung: calculateStemSipsung(dayMaster, stem),
    }
  })
}

/**
 * 모든 십성의 기본 목록 반환
 */
export function getAllSipsung(): Sipsung[] {
  return Object.values(SIPSUNG_INFO)
}
