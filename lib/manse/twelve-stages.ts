/**
 * 12운성(十二運星) 계산 모듈
 * 천간이 지지를 만났을 때의 기운 상태를 나타냄
 */

import type { HeavenlyStem, EarthlyBranch, TwelveStage, TwelveStageCode } from './types'

// ============================================
// 12운성 상수
// ============================================

export const TWELVE_STAGE_INFO: Record<TwelveStageCode, TwelveStage> = {
  jangsaeng: { code: 'jangsaeng', name: '장생', hanja: '長生' },
  mokyok: { code: 'mokyok', name: '목욕', hanja: '沐浴' },
  gwandae: { code: 'gwandae', name: '관대', hanja: '冠帶' },
  imgwan: { code: 'imgwan', name: '임관', hanja: '臨官' },
  jewang: { code: 'jewang', name: '제왕', hanja: '帝旺' },
  soe: { code: 'soe', name: '쇠', hanja: '衰' },
  byeong: { code: 'byeong', name: '병', hanja: '病' },
  sa: { code: 'sa', name: '사', hanja: '死' },
  myo: { code: 'myo', name: '묘', hanja: '墓' },
  jeol: { code: 'jeol', name: '절', hanja: '絶' },
  tae: { code: 'tae', name: '태', hanja: '胎' },
  yang: { code: 'yang', name: '양', hanja: '養' },
}

// 12운성 순서 (장생부터 양까지)
const TWELVE_STAGE_ORDER: TwelveStageCode[] = [
  'jangsaeng', 'mokyok', 'gwandae', 'imgwan', 'jewang', 'soe',
  'byeong', 'sa', 'myo', 'jeol', 'tae', 'yang'
]

/**
 * 양간(陽干)의 장생 위치 (지지 인덱스)
 * 갑(木양) → 해(亥), 병(火양) → 인(寅), 무(土양) → 인(寅), 경(金양) → 사(巳), 임(水양) → 신(申)
 */
const YANG_STEM_JANGSAENG: Record<number, number> = {
  0: 11,  // 갑(甲) → 해(亥)
  2: 2,   // 병(丙) → 인(寅)
  4: 2,   // 무(戊) → 인(寅)
  6: 5,   // 경(庚) → 사(巳)
  8: 8,   // 임(壬) → 신(申)
}

/**
 * 음간(陰干)의 장생 위치 (지지 인덱스)
 * 을(木음) → 오(午), 정(火음) → 유(酉), 기(土음) → 유(酉), 신(金음) → 자(子), 계(水음) → 묘(卯)
 */
const YIN_STEM_JANGSAENG: Record<number, number> = {
  1: 6,   // 을(乙) → 오(午)
  3: 9,   // 정(丁) → 유(酉)
  5: 9,   // 기(己) → 유(酉)
  7: 0,   // 신(辛) → 자(子)
  9: 3,   // 계(癸) → 묘(卯)
}

// ============================================
// 12운성 계산 함수
// ============================================

/**
 * 천간과 지지의 12운성을 계산
 * @param stem 천간
 * @param branch 지지
 * @returns 12운성 정보
 */
export function calculateTwelveStage(
  stem: HeavenlyStem,
  branch: EarthlyBranch
): TwelveStage {
  // 양간인지 음간인지 확인
  const isYangStem = stem.yinYang === 'yang'

  // 장생 위치 가져오기
  const jangsaengBranch = isYangStem
    ? YANG_STEM_JANGSAENG[stem.index]
    : YIN_STEM_JANGSAENG[stem.index]

  // 지지로부터 장생까지의 거리 계산
  let distance: number

  if (isYangStem) {
    // 양간: 순행 (장생 → 목욕 → 관대 → ...)
    distance = (branch.index - jangsaengBranch + 12) % 12
  } else {
    // 음간: 역행 (장생 ← 목욕 ← 관대 ← ...)
    distance = (jangsaengBranch - branch.index + 12) % 12
  }

  const stageCode = TWELVE_STAGE_ORDER[distance]
  return TWELVE_STAGE_INFO[stageCode]
}

/**
 * 12운성의 강도를 반환 (0-100)
 * 제왕(100) > 임관(90) > 관대(80) > 장생(70) > 목욕(60) > 양(50)
 * > 쇠(40) > 병(30) > 사(20) > 묘(15) > 절(10) > 태(5)
 */
export function getTwelveStageStrength(stage: TwelveStage): number {
  const strengthMap: Record<TwelveStageCode, number> = {
    jewang: 100,     // 제왕 - 최고 강도
    imgwan: 90,      // 임관
    gwandae: 80,     // 관대
    jangsaeng: 70,   // 장생
    mokyok: 60,      // 목욕
    yang: 50,        // 양
    soe: 40,         // 쇠
    byeong: 30,      // 병
    sa: 20,          // 사
    myo: 15,         // 묘
    jeol: 10,        // 절
    tae: 5,          // 태
  }
  return strengthMap[stage.code]
}

/**
 * 12운성이 길(吉)한지 여부
 * 장생, 관대, 임관, 제왕은 길
 */
export function isTwelveStageAuspicious(stage: TwelveStage): boolean {
  const auspiciousStages: TwelveStageCode[] = [
    'jangsaeng', 'gwandae', 'imgwan', 'jewang'
  ]
  return auspiciousStages.includes(stage.code)
}

/**
 * 모든 12운성 목록 반환
 */
export function getAllTwelveStages(): TwelveStage[] {
  return TWELVE_STAGE_ORDER.map(code => TWELVE_STAGE_INFO[code])
}
