/**
 * 신살(神殺) 계산 모듈
 * 사주에서 나타나는 길성과 흉살을 계산
 */

import type {
  HeavenlyStem,
  EarthlyBranch,
  FourPillars,
  Sinsal,
  SinsalType,
} from './types'

// ============================================
// 신살 정보 상수
// ============================================

/** 신살 정의 목록 */
const SINSAL_INFO: Record<string, { name: string; hanja: string; type: SinsalType; description: string }> = {
  // 길성 (吉星)
  cheonEulGwiIn: {
    name: '천을귀인',
    hanja: '天乙貴人',
    type: 'gilsung',
    description: '귀인의 도움을 받아 어려움을 극복하고 출세할 수 있는 길성입니다.',
  },
  wolDeokGwiIn: {
    name: '월덕귀인',
    hanja: '月德貴人',
    type: 'gilsung',
    description: '덕망이 높고 주변의 존경을 받으며, 재물운도 좋습니다.',
  },
  taeGeukGwiIn: {
    name: '태극귀인',
    hanja: '太極貴人',
    type: 'gilsung',
    description: '학문과 예술에 재능이 있고, 정신적 발전을 이룹니다.',
  },
  cheonDeokGwiIn: {
    name: '천덕귀인',
    hanja: '天德貴人',
    type: 'gilsung',
    description: '하늘의 덕을 받아 재앙을 피하고 복을 받습니다.',
  },
  munChangGwiIn: {
    name: '문창귀인',
    hanja: '文昌貴人',
    type: 'gilsung',
    description: '학문과 시험에 재능이 있고, 문필에 뛰어납니다.',
  },
  cheonUiSung: {
    name: '천의성',
    hanja: '天醫星',
    type: 'gilsung',
    description: '의료나 치유 관련 분야에 재능이 있습니다.',
  },
  geumYeoLog: {
    name: '금여록',
    hanja: '金輿祿',
    type: 'gilsung',
    description: '재물이 풍족하고 부귀를 누릴 수 있습니다.',
  },
  rokMa: {
    name: '록마',
    hanja: '祿馬',
    type: 'gilsung',
    description: '관직운과 재물운이 좋습니다.',
  },

  // 흉살 (凶殺)
  doHwaSal: {
    name: '도화살',
    hanja: '桃花殺',
    type: 'hyungsal',
    description: '이성관계가 복잡해질 수 있으며, 외모가 출중합니다.',
  },
  yeokMaSal: {
    name: '역마살',
    hanja: '驛馬殺',
    type: 'hyungsal',
    description: '이동이 잦고 변화가 많으며, 해외운이 있습니다.',
  },
  hwaGaeSal: {
    name: '화개살',
    hanja: '華蓋殺',
    type: 'hyungsal',
    description: '예술적 재능이 있으나 고독할 수 있습니다.',
  },
  baekHoDaeSal: {
    name: '백호대살',
    hanja: '白虎大殺',
    type: 'hyungsal',
    description: '사고나 수술에 주의가 필요합니다.',
  },
  gwiMunGwanSal: {
    name: '귀문관살',
    hanja: '鬼門關殺',
    type: 'hyungsal',
    description: '신경이 예민하고 우울해지기 쉽습니다.',
  },
  yangInSal: {
    name: '양인살',
    hanja: '羊刃殺',
    type: 'hyungsal',
    description: '성격이 강하고 결단력이 있으나, 충돌이 잦을 수 있습니다.',
  },
  gongMang: {
    name: '공망',
    hanja: '空亡',
    type: 'hyungsal',
    description: '노력에 비해 결과가 부족할 수 있습니다.',
  },
  wonJin: {
    name: '원진',
    hanja: '怨嗔',
    type: 'hyungsal',
    description: '인간관계에서 미움을 받기 쉽습니다.',
  },
  gyeokGak: {
    name: '격각',
    hanja: '隔角',
    type: 'hyungsal',
    description: '가족과 멀어지거나 이별수가 있습니다.',
  },
  hyeonChim: {
    name: '현침',
    hanja: '懸針',
    type: 'hyungsal',
    description: '날카롭고 예민한 성격으로 구설수에 조심해야 합니다.',
  },
  golanSal: {
    name: '고란살',
    hanja: '孤鸞殺',
    type: 'hyungsal',
    description: '배우자운이 약하여 결혼에 어려움이 있을 수 있습니다.',
  },
}

// ============================================
// 천을귀인 계산
// ============================================

/**
 * 천을귀인 (天乙貴人) 테이블
 * 일간에 따라 천을귀인이 되는 지지
 */
const CHEON_EUL_GWI_IN: Record<number, number[]> = {
  0: [1, 7],   // 갑 → 축, 미
  1: [0, 8],   // 을 → 자, 신
  2: [11, 9],  // 병 → 해, 유
  3: [11, 9],  // 정 → 해, 유
  4: [1, 7],   // 무 → 축, 미
  5: [0, 8],   // 기 → 자, 신
  6: [1, 7],   // 경 → 축, 미 (일부는 해, 인)
  7: [2, 6],   // 신 → 인, 오
  8: [3, 5],   // 임 → 묘, 사
  9: [3, 5],   // 계 → 묘, 사
}

function calculateCheonEulGwiIn(dayMaster: HeavenlyStem, branch: EarthlyBranch): boolean {
  const targets = CHEON_EUL_GWI_IN[dayMaster.index]
  return targets.includes(branch.index)
}

// ============================================
// 월덕귀인 계산
// ============================================

/**
 * 월덕귀인 (月德貴人)
 * 월지에 따라 월덕귀인이 되는 천간
 */
const WOL_DEOK_GWI_IN: Record<number, number> = {
  2: 2,   // 인월 → 병
  5: 2,   // 사월 → 병
  8: 2,   // 신월 → 병
  11: 2,  // 해월 → 병
  3: 0,   // 묘월 → 갑
  6: 0,   // 오월 → 갑
  9: 0,   // 유월 → 갑
  0: 0,   // 자월 → 갑
  4: 8,   // 진월 → 임
  7: 8,   // 미월 → 임
  10: 8,  // 술월 → 임
  1: 8,   // 축월 → 임
}

function calculateWolDeokGwiIn(
  monthBranch: EarthlyBranch,
  stem: HeavenlyStem
): boolean {
  const targetStem = WOL_DEOK_GWI_IN[monthBranch.index]
  return stem.index === targetStem
}

// ============================================
// 태극귀인 계산
// ============================================

/**
 * 태극귀인 (太極貴人)
 * 일간에 따라 태극귀인이 되는 지지
 */
const TAE_GEUK_GWI_IN: Record<number, number[]> = {
  0: [0, 3],   // 갑 → 자, 묘
  1: [0, 3],   // 을 → 자, 묘
  2: [6, 9],   // 병 → 오, 유
  3: [6, 9],   // 정 → 오, 유
  4: [4, 7, 1, 10], // 무 → 진, 미, 축, 술
  5: [4, 7, 1, 10], // 기 → 진, 미, 축, 술
  6: [2, 11],  // 경 → 인, 해
  7: [2, 11],  // 신 → 인, 해
  8: [5, 8],   // 임 → 사, 신
  9: [5, 8],   // 계 → 사, 신
}

function calculateTaeGeukGwiIn(dayMaster: HeavenlyStem, branch: EarthlyBranch): boolean {
  const targets = TAE_GEUK_GWI_IN[dayMaster.index]
  return targets.includes(branch.index)
}

// ============================================
// 문창귀인 계산
// ============================================

/**
 * 문창귀인 (文昌貴人)
 * 일간에 따라 문창귀인이 되는 지지
 */
const MUN_CHANG_GWI_IN: Record<number, number> = {
  0: 5,   // 갑 → 사
  1: 6,   // 을 → 오
  2: 8,   // 병 → 신
  3: 9,   // 정 → 유
  4: 8,   // 무 → 신
  5: 9,   // 기 → 유
  6: 11,  // 경 → 해
  7: 0,   // 신 → 자
  8: 2,   // 임 → 인
  9: 3,   // 계 → 묘
}

function calculateMunChangGwiIn(dayMaster: HeavenlyStem, branch: EarthlyBranch): boolean {
  return MUN_CHANG_GWI_IN[dayMaster.index] === branch.index
}

// ============================================
// 도화살 계산
// ============================================

/**
 * 도화살 (桃花殺)
 * 년지 또는 일지에 따라 도화살이 되는 지지
 * 자오묘유(子午卯酉)가 도화
 */
const DO_HWA_SAL: Record<number, number> = {
  // 인오술(寅午戌) → 묘(卯)
  2: 3, 6: 3, 10: 3,
  // 사유축(巳酉丑) → 오(午)
  5: 6, 9: 6, 1: 6,
  // 신자진(申子辰) → 유(酉)
  8: 9, 0: 9, 4: 9,
  // 해묘미(亥卯未) → 자(子)
  11: 0, 3: 0, 7: 0,
}

function calculateDoHwaSal(
  yearBranch: EarthlyBranch,
  targetBranch: EarthlyBranch
): boolean {
  const doHwa = DO_HWA_SAL[yearBranch.index]
  return doHwa === targetBranch.index
}

// ============================================
// 역마살 계산
// ============================================

/**
 * 역마살 (驛馬殺)
 * 년지 또는 일지에 따라 역마살이 되는 지지
 */
const YEOK_MA_SAL: Record<number, number> = {
  // 인오술(寅午戌) → 신(申)
  2: 8, 6: 8, 10: 8,
  // 사유축(巳酉丑) → 해(亥)
  5: 11, 9: 11, 1: 11,
  // 신자진(申子辰) → 인(寅)
  8: 2, 0: 2, 4: 2,
  // 해묘미(亥卯未) → 사(巳)
  11: 5, 3: 5, 7: 5,
}

function calculateYeokMaSal(
  yearBranch: EarthlyBranch,
  targetBranch: EarthlyBranch
): boolean {
  const yeokMa = YEOK_MA_SAL[yearBranch.index]
  return yeokMa === targetBranch.index
}

// ============================================
// 화개살 계산
// ============================================

/**
 * 화개살 (華蓋殺)
 * 년지 또는 일지에 따라 화개살이 되는 지지
 */
const HWA_GAE_SAL: Record<number, number> = {
  // 인오술(寅午戌) → 술(戌)
  2: 10, 6: 10, 10: 10,
  // 사유축(巳酉丑) → 축(丑)
  5: 1, 9: 1, 1: 1,
  // 신자진(申子辰) → 진(辰)
  8: 4, 0: 4, 4: 4,
  // 해묘미(亥卯未) → 미(未)
  11: 7, 3: 7, 7: 7,
}

function calculateHwaGaeSal(
  yearBranch: EarthlyBranch,
  targetBranch: EarthlyBranch
): boolean {
  const hwaGae = HWA_GAE_SAL[yearBranch.index]
  return hwaGae === targetBranch.index
}

// ============================================
// 양인살 계산
// ============================================

/**
 * 양인살 (羊刃殺)
 * 일간에 따라 양인살이 되는 지지
 */
const YANG_IN_SAL: Record<number, number> = {
  0: 3,   // 갑 → 묘
  1: 4,   // 을 → 진
  2: 6,   // 병 → 오
  3: 7,   // 정 → 미
  4: 6,   // 무 → 오
  5: 7,   // 기 → 미
  6: 9,   // 경 → 유
  7: 10,  // 신 → 술
  8: 0,   // 임 → 자
  9: 1,   // 계 → 축
}

function calculateYangInSal(dayMaster: HeavenlyStem, branch: EarthlyBranch): boolean {
  return YANG_IN_SAL[dayMaster.index] === branch.index
}

// ============================================
// 백호대살 계산
// ============================================

/**
 * 백호대살 (白虎大殺)
 * 일지에 따라 백호대살이 되는 지지
 */
const BAEK_HO_DAE_SAL: Record<number, number> = {
  0: 6,   // 자 → 오
  1: 7,   // 축 → 미
  2: 8,   // 인 → 신
  3: 9,   // 묘 → 유
  4: 10,  // 진 → 술
  5: 11,  // 사 → 해
  6: 0,   // 오 → 자
  7: 1,   // 미 → 축
  8: 2,   // 신 → 인
  9: 3,   // 유 → 묘
  10: 4,  // 술 → 진
  11: 5,  // 해 → 사
}

function calculateBaekHoDaeSal(
  dayBranch: EarthlyBranch,
  targetBranch: EarthlyBranch
): boolean {
  return BAEK_HO_DAE_SAL[dayBranch.index] === targetBranch.index
}

// ============================================
// 귀문관살 계산
// ============================================

/**
 * 귀문관살 (鬼門關殺)
 * 특정 지지 조합
 */
const GWI_MUN_GWAN_SAL_PAIRS: [number, number][] = [
  [2, 7],   // 인-미
  [3, 8],   // 묘-신
  [4, 9],   // 진-유
  [5, 10],  // 사-술
  [6, 11],  // 오-해
  [0, 1],   // 자-축
]

function calculateGwiMunGwanSal(
  branch1: EarthlyBranch,
  branch2: EarthlyBranch
): boolean {
  for (const [a, b] of GWI_MUN_GWAN_SAL_PAIRS) {
    if (
      (branch1.index === a && branch2.index === b) ||
      (branch1.index === b && branch2.index === a)
    ) {
      return true
    }
  }
  return false
}

// ============================================
// 공망 계산
// ============================================

/**
 * 공망 (空亡) 계산
 * 60갑자에서 10개씩 묶어 마지막 2개 지지가 공망
 */
function calculateGongMang(
  dayPillarIndex: number,
  targetBranch: EarthlyBranch
): boolean {
  // 일주의 순(旬) 찾기 (0-5)
  const xunIndex = Math.floor(dayPillarIndex / 10)

  // 해당 순의 공망 지지
  // 갑자순: 술해(10, 11), 갑술순: 신유(8, 9), 갑신순: 오미(6, 7)
  // 갑오순: 진사(4, 5), 갑진순: 인묘(2, 3), 갑인순: 자축(0, 1)
  const gongMangBranches: Record<number, number[]> = {
    0: [10, 11], // 갑자순 → 술, 해
    1: [8, 9],   // 갑술순 → 신, 유
    2: [6, 7],   // 갑신순 → 오, 미
    3: [4, 5],   // 갑오순 → 진, 사
    4: [2, 3],   // 갑진순 → 인, 묘
    5: [0, 1],   // 갑인순 → 자, 축
  }

  const emptyBranches = gongMangBranches[xunIndex]
  return emptyBranches.includes(targetBranch.index)
}

// ============================================
// 원진살 계산
// ============================================

/**
 * 원진살 (怨嗔殺)
 * 특정 지지 조합 (서로 미워하는 관계)
 */
const WON_JIN_PAIRS: [number, number][] = [
  [0, 7],   // 자-미
  [1, 6],   // 축-오
  [2, 5],   // 인-사
  [3, 4],   // 묘-진
  [8, 11],  // 신-해
  [9, 10],  // 유-술
]

function calculateWonJin(
  branch1: EarthlyBranch,
  branch2: EarthlyBranch
): boolean {
  for (const [a, b] of WON_JIN_PAIRS) {
    if (
      (branch1.index === a && branch2.index === b) ||
      (branch1.index === b && branch2.index === a)
    ) {
      return true
    }
  }
  return false
}

// ============================================
// 고란살 계산
// ============================================

/**
 * 고란살 (孤鸞殺)
 * 특정 일주 조합
 */
const GO_LAN_SAL_PILLARS = [
  '을사', '정사', '신해', '무신', '갑인', '병오', '무오', '임자',
]

function calculateGoLanSal(dayPillarHangul: string): boolean {
  return GO_LAN_SAL_PILLARS.includes(dayPillarHangul)
}

// ============================================
// 통합 신살 분석 함수
// ============================================

/**
 * 사주의 모든 신살을 계산
 */
export function calculateAllSinsals(
  pillars: FourPillars,
  dayMaster: HeavenlyStem
): Sinsal[] {
  const sinsals: Sinsal[] = []
  const addedCodes = new Set<string>()

  const addSinsal = (code: string) => {
    if (!addedCodes.has(code)) {
      addedCodes.add(code)
      const info = SINSAL_INFO[code]
      if (info) {
        sinsals.push({
          code,
          name: info.name,
          hanja: info.hanja,
          type: info.type,
          description: info.description,
        })
      }
    }
  }

  const yearBranch = pillars.year.branch
  const monthBranch = pillars.month.branch
  const dayBranch = pillars.day.branch
  const hourBranch = pillars.hour?.branch

  const dayPillarIndex = pillars.day.stemBranch?.index ?? 0
  const dayPillarHangul = pillars.day.stemBranch?.hangul ?? ''

  // 모든 지지 수집
  const allBranches = [yearBranch, monthBranch, dayBranch, hourBranch].filter(
    (b): b is EarthlyBranch => b !== null && b !== undefined
  )

  // 모든 천간 수집
  const allStems = [
    pillars.year.stem,
    pillars.month.stem,
    pillars.day.stem,
    pillars.hour?.stem,
  ].filter((s): s is HeavenlyStem => s !== null && s !== undefined)

  // 1. 천을귀인 체크
  for (const branch of allBranches) {
    if (calculateCheonEulGwiIn(dayMaster, branch)) {
      addSinsal('cheonEulGwiIn')
      break
    }
  }

  // 2. 월덕귀인 체크
  if (monthBranch) {
    for (const stem of allStems) {
      if (calculateWolDeokGwiIn(monthBranch, stem)) {
        addSinsal('wolDeokGwiIn')
        break
      }
    }
  }

  // 3. 태극귀인 체크
  for (const branch of allBranches) {
    if (calculateTaeGeukGwiIn(dayMaster, branch)) {
      addSinsal('taeGeukGwiIn')
      break
    }
  }

  // 4. 문창귀인 체크
  for (const branch of allBranches) {
    if (calculateMunChangGwiIn(dayMaster, branch)) {
      addSinsal('munChangGwiIn')
      break
    }
  }

  // 5. 도화살 체크
  if (yearBranch) {
    for (const branch of allBranches) {
      if (calculateDoHwaSal(yearBranch, branch)) {
        addSinsal('doHwaSal')
        break
      }
    }
  }

  // 6. 역마살 체크
  if (yearBranch) {
    for (const branch of allBranches) {
      if (calculateYeokMaSal(yearBranch, branch)) {
        addSinsal('yeokMaSal')
        break
      }
    }
  }

  // 7. 화개살 체크
  if (yearBranch) {
    for (const branch of allBranches) {
      if (calculateHwaGaeSal(yearBranch, branch)) {
        addSinsal('hwaGaeSal')
        break
      }
    }
  }

  // 8. 양인살 체크
  for (const branch of allBranches) {
    if (calculateYangInSal(dayMaster, branch)) {
      addSinsal('yangInSal')
      break
    }
  }

  // 9. 백호대살 체크
  if (dayBranch) {
    for (const branch of allBranches) {
      if (branch !== dayBranch && calculateBaekHoDaeSal(dayBranch, branch)) {
        addSinsal('baekHoDaeSal')
        break
      }
    }
  }

  // 10. 귀문관살 체크
  for (let i = 0; i < allBranches.length; i++) {
    for (let j = i + 1; j < allBranches.length; j++) {
      if (calculateGwiMunGwanSal(allBranches[i], allBranches[j])) {
        addSinsal('gwiMunGwanSal')
        break
      }
    }
  }

  // 11. 공망 체크
  for (const branch of allBranches) {
    if (calculateGongMang(dayPillarIndex, branch)) {
      addSinsal('gongMang')
      break
    }
  }

  // 12. 원진살 체크
  for (let i = 0; i < allBranches.length; i++) {
    for (let j = i + 1; j < allBranches.length; j++) {
      if (calculateWonJin(allBranches[i], allBranches[j])) {
        addSinsal('wonJin')
        break
      }
    }
  }

  // 13. 고란살 체크
  if (calculateGoLanSal(dayPillarHangul)) {
    addSinsal('golanSal')
  }

  return sinsals
}

/**
 * 특정 기둥의 신살을 계산
 */
export function calculatePillarSinsals(
  pillars: FourPillars,
  dayMaster: HeavenlyStem,
  pillarType: 'year' | 'month' | 'day' | 'hour'
): Sinsal[] {
  const sinsals: Sinsal[] = []
  const addedCodes = new Set<string>()

  const addSinsal = (code: string) => {
    if (!addedCodes.has(code)) {
      addedCodes.add(code)
      const info = SINSAL_INFO[code]
      if (info) {
        sinsals.push({
          code,
          name: info.name,
          hanja: info.hanja,
          type: info.type,
          description: info.description,
        })
      }
    }
  }

  const targetPillar = pillars[pillarType]
  if (!targetPillar) return sinsals

  const targetBranch = targetPillar.branch
  const targetStem = targetPillar.stem
  if (!targetBranch) return sinsals

  const yearBranch = pillars.year.branch
  const monthBranch = pillars.month.branch
  const dayBranch = pillars.day.branch
  const dayPillarIndex = pillars.day.stemBranch?.index ?? 0
  const dayPillarHangul = pillars.day.stemBranch?.hangul ?? ''

  // 1. 천을귀인
  if (calculateCheonEulGwiIn(dayMaster, targetBranch)) {
    addSinsal('cheonEulGwiIn')
  }

  // 2. 월덕귀인 (천간)
  if (monthBranch && targetStem && calculateWolDeokGwiIn(monthBranch, targetStem)) {
    addSinsal('wolDeokGwiIn')
  }

  // 3. 태극귀인
  if (calculateTaeGeukGwiIn(dayMaster, targetBranch)) {
    addSinsal('taeGeukGwiIn')
  }

  // 4. 문창귀인
  if (calculateMunChangGwiIn(dayMaster, targetBranch)) {
    addSinsal('munChangGwiIn')
  }

  // 5. 도화살
  if (yearBranch && calculateDoHwaSal(yearBranch, targetBranch)) {
    addSinsal('doHwaSal')
  }

  // 6. 역마살
  if (yearBranch && calculateYeokMaSal(yearBranch, targetBranch)) {
    addSinsal('yeokMaSal')
  }

  // 7. 화개살
  if (yearBranch && calculateHwaGaeSal(yearBranch, targetBranch)) {
    addSinsal('hwaGaeSal')
  }

  // 8. 양인살
  if (calculateYangInSal(dayMaster, targetBranch)) {
    addSinsal('yangInSal')
  }

  // 9. 백호대살
  if (dayBranch && targetBranch !== dayBranch && calculateBaekHoDaeSal(dayBranch, targetBranch)) {
    addSinsal('baekHoDaeSal')
  }

  // 10. 공망
  if (calculateGongMang(dayPillarIndex, targetBranch)) {
    addSinsal('gongMang')
  }

  // 11. 고란살 (일주 전용)
  if (pillarType === 'day' && calculateGoLanSal(dayPillarHangul)) {
    addSinsal('golanSal')
  }

  return sinsals
}

/**
 * 길성만 필터링
 */
export function filterGilsung(sinsals: Sinsal[]): Sinsal[] {
  return sinsals.filter(s => s.type === 'gilsung')
}

/**
 * 흉살만 필터링
 */
export function filterHyungsal(sinsals: Sinsal[]): Sinsal[] {
  return sinsals.filter(s => s.type === 'hyungsal')
}

/**
 * 신살 정보 조회
 */
export function getSinsalInfo(code: string): Sinsal | null {
  const info = SINSAL_INFO[code]
  if (!info) return null

  return {
    code,
    name: info.name,
    hanja: info.hanja,
    type: info.type,
    description: info.description,
  }
}
