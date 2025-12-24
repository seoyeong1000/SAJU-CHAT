/**
 * 만세력 상수 정의
 * 천간, 지지, 60갑자, 절기 등
 */

import type { HeavenlyStem, EarthlyBranch, StemBranch, FiveElement, YinYang } from './types'

// ============================================
// 천간 (十天干 / Heavenly Stems)
// ============================================
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { index: 0, hanja: '甲', hangul: '갑', code: 'jia', element: 'wood', yinYang: 'yang' },
  { index: 1, hanja: '乙', hangul: '을', code: 'yi', element: 'wood', yinYang: 'yin' },
  { index: 2, hanja: '丙', hangul: '병', code: 'bing', element: 'fire', yinYang: 'yang' },
  { index: 3, hanja: '丁', hangul: '정', code: 'ding', element: 'fire', yinYang: 'yin' },
  { index: 4, hanja: '戊', hangul: '무', code: 'wu', element: 'earth', yinYang: 'yang' },
  { index: 5, hanja: '己', hangul: '기', code: 'ji', element: 'earth', yinYang: 'yin' },
  { index: 6, hanja: '庚', hangul: '경', code: 'geng', element: 'metal', yinYang: 'yang' },
  { index: 7, hanja: '辛', hangul: '신', code: 'xin', element: 'metal', yinYang: 'yin' },
  { index: 8, hanja: '壬', hangul: '임', code: 'ren', element: 'water', yinYang: 'yang' },
  { index: 9, hanja: '癸', hangul: '계', code: 'gui', element: 'water', yinYang: 'yin' },
]

// ============================================
// 지지 (十二地支 / Earthly Branches)
// ============================================
export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { index: 0, hanja: '子', hangul: '자', code: 'zi', element: 'water', yinYang: 'yang', hiddenStems: ['계'] },
  { index: 1, hanja: '丑', hangul: '축', code: 'chou', element: 'earth', yinYang: 'yin', hiddenStems: ['기', '계', '신'] },
  { index: 2, hanja: '寅', hangul: '인', code: 'yin', element: 'wood', yinYang: 'yang', hiddenStems: ['갑', '병', '무'] },
  { index: 3, hanja: '卯', hangul: '묘', code: 'mao', element: 'wood', yinYang: 'yin', hiddenStems: ['을'] },
  { index: 4, hanja: '辰', hangul: '진', code: 'chen', element: 'earth', yinYang: 'yang', hiddenStems: ['무', '을', '계'] },
  { index: 5, hanja: '巳', hangul: '사', code: 'si', element: 'fire', yinYang: 'yin', hiddenStems: ['병', '무', '경'] },
  { index: 6, hanja: '午', hangul: '오', code: 'wu_branch', element: 'fire', yinYang: 'yang', hiddenStems: ['정', '기'] },
  { index: 7, hanja: '未', hangul: '미', code: 'wei', element: 'earth', yinYang: 'yin', hiddenStems: ['기', '정', '을'] },
  { index: 8, hanja: '申', hangul: '신', code: 'shen', element: 'metal', yinYang: 'yang', hiddenStems: ['경', '임', '무'] },
  { index: 9, hanja: '酉', hangul: '유', code: 'you', element: 'metal', yinYang: 'yin', hiddenStems: ['신'] },
  { index: 10, hanja: '戌', hangul: '술', code: 'xu', element: 'earth', yinYang: 'yang', hiddenStems: ['무', '신', '정'] },
  { index: 11, hanja: '亥', hangul: '해', code: 'hai', element: 'water', yinYang: 'yin', hiddenStems: ['임', '갑'] },
]

// ============================================
// 60갑자 (六十甲子 / Sexagenary Cycle)
// ============================================
function generateSixtyJiazi(): StemBranch[] {
  const result: StemBranch[] = []
  for (let i = 0; i < 60; i++) {
    const stemIndex = i % 10
    const branchIndex = i % 12
    const stem = HEAVENLY_STEMS[stemIndex]
    const branch = EARTHLY_BRANCHES[branchIndex]
    result.push({
      index: i,
      stem,
      branch,
      hanja: stem.hanja + branch.hanja,
      hangul: stem.hangul + branch.hangul,
    })
  }
  return result
}

export const SIXTY_JIAZI: StemBranch[] = generateSixtyJiazi()

// ============================================
// 24절기 (二十四節氣 / Solar Terms)
// ============================================
export const SOLAR_TERMS = [
  { index: 0, name: '소한', hanja: '小寒', sunLongitude: 285 },
  { index: 1, name: '대한', hanja: '大寒', sunLongitude: 300 },
  { index: 2, name: '입춘', hanja: '立春', sunLongitude: 315 },
  { index: 3, name: '우수', hanja: '雨水', sunLongitude: 330 },
  { index: 4, name: '경칩', hanja: '驚蟄', sunLongitude: 345 },
  { index: 5, name: '춘분', hanja: '春分', sunLongitude: 0 },
  { index: 6, name: '청명', hanja: '淸明', sunLongitude: 15 },
  { index: 7, name: '곡우', hanja: '穀雨', sunLongitude: 30 },
  { index: 8, name: '입하', hanja: '立夏', sunLongitude: 45 },
  { index: 9, name: '소만', hanja: '小滿', sunLongitude: 60 },
  { index: 10, name: '망종', hanja: '芒種', sunLongitude: 75 },
  { index: 11, name: '하지', hanja: '夏至', sunLongitude: 90 },
  { index: 12, name: '소서', hanja: '小暑', sunLongitude: 105 },
  { index: 13, name: '대서', hanja: '大暑', sunLongitude: 120 },
  { index: 14, name: '입추', hanja: '立秋', sunLongitude: 135 },
  { index: 15, name: '처서', hanja: '處暑', sunLongitude: 150 },
  { index: 16, name: '백로', hanja: '白露', sunLongitude: 165 },
  { index: 17, name: '추분', hanja: '秋分', sunLongitude: 180 },
  { index: 18, name: '한로', hanja: '寒露', sunLongitude: 195 },
  { index: 19, name: '상강', hanja: '霜降', sunLongitude: 210 },
  { index: 20, name: '입동', hanja: '立冬', sunLongitude: 225 },
  { index: 21, name: '소설', hanja: '小雪', sunLongitude: 240 },
  { index: 22, name: '대설', hanja: '大雪', sunLongitude: 255 },
  { index: 23, name: '동지', hanja: '冬至', sunLongitude: 270 },
] as const

// 절기 (節氣) - 월 시작 기준 (짝수 인덱스: 0, 2, 4, ...)
// 절기는 입춘(315°)부터 시작하여 1월(인월)
export const MAJOR_SOLAR_TERMS_INDICES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 0] as const

// 절기별 월 매핑 (입춘=1월(인월), 경칩=2월(묘월), ...)
export const SOLAR_TERM_TO_MONTH_BRANCH: Record<number, number> = {
  2: 2,   // 입춘 → 인월(1월)
  4: 3,   // 경칩 → 묘월(2월)
  6: 4,   // 청명 → 진월(3월)
  8: 5,   // 입하 → 사월(4월)
  10: 6,  // 망종 → 오월(5월)
  12: 7,  // 소서 → 미월(6월)
  14: 8,  // 입추 → 신월(7월)
  16: 9,  // 백로 → 유월(8월)
  18: 10, // 한로 → 술월(9월)
  20: 11, // 입동 → 해월(10월)
  22: 0,  // 대설 → 자월(11월)
  0: 1,   // 소한 → 축월(12월)
}

// ============================================
// 시주 계산용 시간대 (時辰)
// ============================================
export const HOUR_BRANCHES = [
  { branch: 0, start: 23, end: 1, name: '자시' },   // 子時: 23:00-01:00
  { branch: 1, start: 1, end: 3, name: '축시' },    // 丑時: 01:00-03:00
  { branch: 2, start: 3, end: 5, name: '인시' },    // 寅時: 03:00-05:00
  { branch: 3, start: 5, end: 7, name: '묘시' },    // 卯時: 05:00-07:00
  { branch: 4, start: 7, end: 9, name: '진시' },    // 辰時: 07:00-09:00
  { branch: 5, start: 9, end: 11, name: '사시' },   // 巳時: 09:00-11:00
  { branch: 6, start: 11, end: 13, name: '오시' },  // 午時: 11:00-13:00
  { branch: 7, start: 13, end: 15, name: '미시' },  // 未時: 13:00-15:00
  { branch: 8, start: 15, end: 17, name: '신시' },  // 申時: 15:00-17:00
  { branch: 9, start: 17, end: 19, name: '유시' },  // 酉時: 17:00-19:00
  { branch: 10, start: 19, end: 21, name: '술시' }, // 戌時: 19:00-21:00
  { branch: 11, start: 21, end: 23, name: '해시' }, // 亥時: 21:00-23:00
] as const

// ============================================
// 년간 → 월간 계산용 (年上起月法)
// 갑/기년 → 병인월, 을/경년 → 무인월, ...
// ============================================
export const YEAR_STEM_TO_MONTH_STEM_BASE: Record<number, number> = {
  0: 2,  // 갑(0) → 병(2)인월 시작
  1: 4,  // 을(1) → 무(4)인월 시작
  2: 6,  // 병(2) → 경(6)인월 시작
  3: 8,  // 정(3) → 임(8)인월 시작
  4: 0,  // 무(4) → 갑(0)인월 시작
  5: 2,  // 기(5) → 병(2)인월 시작
  6: 4,  // 경(6) → 무(4)인월 시작
  7: 6,  // 신(7) → 경(6)인월 시작
  8: 8,  // 임(8) → 임(8)인월 시작
  9: 0,  // 계(9) → 갑(0)인월 시작
}

// ============================================
// 일간 → 시간 계산용 (日上起時法)
// 갑/기일 → 갑자시, 을/경일 → 병자시, ...
// ============================================
export const DAY_STEM_TO_HOUR_STEM_BASE: Record<number, number> = {
  0: 0,  // 갑(0) → 갑(0)자시 시작
  1: 2,  // 을(1) → 병(2)자시 시작
  2: 4,  // 병(2) → 무(4)자시 시작
  3: 6,  // 정(3) → 경(6)자시 시작
  4: 8,  // 무(4) → 임(8)자시 시작
  5: 0,  // 기(5) → 갑(0)자시 시작
  6: 2,  // 경(6) → 병(2)자시 시작
  7: 4,  // 신(7) → 무(4)자시 시작
  8: 6,  // 임(8) → 경(6)자시 시작
  9: 8,  // 계(9) → 임(8)자시 시작
}

// ============================================
// 오행 매핑
// ============================================
export const ELEMENT_NAMES: Record<FiveElement, { ko: string; hanja: string }> = {
  wood: { ko: '목', hanja: '木' },
  fire: { ko: '화', hanja: '火' },
  earth: { ko: '토', hanja: '土' },
  metal: { ko: '금', hanja: '金' },
  water: { ko: '수', hanja: '水' },
}

export const YINYANG_NAMES: Record<YinYang, { ko: string; hanja: string }> = {
  yang: { ko: '양', hanja: '陽' },
  yin: { ko: '음', hanja: '陰' },
}

// ============================================
// 엔진 버전
// ============================================
export const ENGINE_VERSION = 'manse-v1.0'
