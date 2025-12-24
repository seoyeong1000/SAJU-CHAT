/**
 * 대운(大運) 계산 모듈
 * 사주의 대운을 계산하고 운세 흐름을 파악
 */

import type {
  HeavenlyStem,
  EarthlyBranch,
  StemBranch,
  FourPillars,
  Daeun,
  SolarTermInfo,
} from './types'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, SIXTY_JIAZI } from './constants'
import { calculateStemSipsung, calculateBranchSipsung } from './sipsung'

// ============================================
// 대운 방향 결정
// ============================================

/**
 * 대운 순행/역행 결정
 * 양남음녀(陽男陰女)는 순행, 음남양녀(陰男陽女)는 역행
 * @param yearStem 년간
 * @param gender 성별
 * @returns true면 순행, false면 역행
 */
export function isDaeunForward(
  yearStem: HeavenlyStem,
  gender: 'male' | 'female'
): boolean {
  const isYangYear = yearStem.yinYang === 'yang'
  const isMale = gender === 'male'

  // 양남음녀: 순행 (true)
  // 음남양녀: 역행 (false)
  return isYangYear === isMale
}

// ============================================
// 대운수 (대운 시작 나이) 계산
// ============================================

/**
 * 대운수를 계산
 * 생일로부터 다음/이전 절기까지의 일수를 3으로 나눈 값
 * @param birthDate 생년월일 (Date 객체)
 * @param isForward 순행 여부
 * @param currentSolarTerm 현재 절기 정보
 * @param nextSolarTerm 다음 절기 정보
 * @param prevSolarTerm 이전 절기 정보
 * @returns 대운 시작 나이 (세)
 */
export function calculateDaeunStartAge(
  birthDate: Date,
  isForward: boolean,
  currentSolarTerm: SolarTermInfo | null,
  nextSolarTerm: SolarTermInfo | null,
  prevSolarTerm: SolarTermInfo | null
): number {
  // 순행이면 다음 절기까지, 역행이면 이전 절기까지의 일수
  const targetTerm = isForward ? nextSolarTerm : prevSolarTerm

  if (!targetTerm) {
    // 절기 정보가 없으면 기본값 (3세)
    return 3
  }

  // 일수 계산
  const birthMs = birthDate.getTime()
  const termMs = targetTerm.dateTimeUtc.getTime()
  const diffMs = Math.abs(termMs - birthMs)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  // 3일 = 1년, 반올림
  const startAge = Math.round(diffDays / 3)

  // 최소 1세, 최대 10세
  return Math.max(1, Math.min(10, startAge))
}

/**
 * 간단한 대운수 계산 (절기 정보 없이 추정)
 * 생일 기준으로 월 중순인지 아닌지로 대략 계산
 */
export function estimateDaeunStartAge(
  birthDay: number,
  isForward: boolean
): number {
  // 간단한 추정: 날짜에 따라 1-10세 사이 값 반환
  // 월초면 순행일 때 대운수가 크고, 역행일 때 작음
  // 월말이면 그 반대

  if (isForward) {
    // 순행: 다음 절기까지
    // 1일 → 약 10년, 15일 → 약 5년, 30일 → 약 0년
    return Math.max(1, Math.round((30 - birthDay) / 3))
  } else {
    // 역행: 이전 절기까지
    // 1일 → 약 0년, 15일 → 약 5년, 30일 → 약 10년
    return Math.max(1, Math.round(birthDay / 3))
  }
}

// ============================================
// 대운 간지 계산
// ============================================

/**
 * 대운 간지 목록을 계산
 * @param monthPillar 월주 간지
 * @param isForward 순행 여부
 * @param count 대운 개수 (기본: 8개)
 * @returns 대운 간지 목록
 */
export function calculateDaeunStemBranches(
  monthPillar: StemBranch,
  isForward: boolean,
  count: number = 8
): StemBranch[] {
  const result: StemBranch[] = []
  const startIndex = monthPillar.index

  for (let i = 1; i <= count; i++) {
    let newIndex: number
    if (isForward) {
      // 순행: 인덱스 증가
      newIndex = (startIndex + i) % 60
    } else {
      // 역행: 인덱스 감소
      newIndex = (startIndex - i + 60) % 60
    }
    result.push(SIXTY_JIAZI[newIndex])
  }

  return result
}

// ============================================
// 대운 전체 정보 계산
// ============================================

/**
 * 전체 대운 정보를 계산
 * @param pillars 사주 팔자
 * @param dayMaster 일주 천간
 * @param gender 성별
 * @param birthDate 생년월일
 * @param solarTerms 절기 정보 (선택)
 * @returns 대운 목록과 시작 나이
 */
export function calculateFullDaeun(
  pillars: FourPillars,
  dayMaster: HeavenlyStem,
  gender: 'male' | 'female',
  birthDate: Date,
  solarTerms?: {
    current: SolarTermInfo | null
    next: SolarTermInfo | null
    prev: SolarTermInfo | null
  }
): { daeunList: Daeun[]; startAge: number } {
  // 년간 확인
  const yearStem = pillars.year.stem
  if (!yearStem) {
    return { daeunList: [], startAge: 3 }
  }

  // 월주 확인
  const monthPillar = pillars.month.stemBranch
  if (!monthPillar) {
    return { daeunList: [], startAge: 3 }
  }

  // 1. 순행/역행 결정
  const isForward = isDaeunForward(yearStem, gender)

  // 2. 대운수 계산
  let startAge: number
  if (solarTerms) {
    startAge = calculateDaeunStartAge(
      birthDate,
      isForward,
      solarTerms.current,
      solarTerms.next,
      solarTerms.prev
    )
  } else {
    // 절기 정보 없으면 추정
    startAge = estimateDaeunStartAge(birthDate.getDate(), isForward)
  }

  // 3. 대운 간지 계산 (8개)
  const daeunStemBranches = calculateDaeunStemBranches(monthPillar, isForward, 8)

  // 4. 대운 정보 구성
  const daeunList: Daeun[] = daeunStemBranches.map((sb, index) => {
    const order = index + 1
    const daeunStartAge = startAge + index * 10
    const daeunEndAge = daeunStartAge + 9

    return {
      order,
      startAge: daeunStartAge,
      endAge: daeunEndAge,
      stemBranch: sb,
      stemSipsung: calculateStemSipsung(dayMaster, sb.stem),
      branchSipsung: calculateBranchSipsung(dayMaster, sb.branch),
    }
  })

  return { daeunList, startAge }
}

// ============================================
// 현재 대운 찾기
// ============================================

/**
 * 현재 나이에 해당하는 대운을 찾기
 * @param daeunList 대운 목록
 * @param currentAge 현재 나이
 * @returns 현재 대운 또는 null
 */
export function findCurrentDaeun(
  daeunList: Daeun[],
  currentAge: number
): Daeun | null {
  for (const daeun of daeunList) {
    if (currentAge >= daeun.startAge && currentAge <= daeun.endAge) {
      return daeun
    }
  }
  return null
}

/**
 * 나이로 몇 번째 대운인지 계산
 */
export function getDaeunOrderByAge(
  startAge: number,
  currentAge: number
): number {
  if (currentAge < startAge) {
    return 0 // 아직 대운 시작 전
  }
  return Math.floor((currentAge - startAge) / 10) + 1
}

// ============================================
// 세운 (歲運 / 연운) 계산
// ============================================

/**
 * 특정 년도의 세운(연운) 간지 계산
 * @param year 서기 연도
 * @returns 해당 년도의 간지
 */
export function calculateYearStemBranch(year: number): StemBranch {
  // 4년을 기준으로 갑자(甲子)
  // 1984년이 갑자년
  const baseYear = 1984
  const diff = year - baseYear
  const index = ((diff % 60) + 60) % 60
  return SIXTY_JIAZI[index]
}

/**
 * 연운 목록 생성
 * @param dayMaster 일주 천간
 * @param startYear 시작 연도
 * @param count 연도 개수 (기본: 10)
 */
export function calculateYeonunList(
  dayMaster: HeavenlyStem,
  startYear: number,
  count: number = 10
): Array<{
  year: number
  stemBranch: StemBranch
  stemSipsung: ReturnType<typeof calculateStemSipsung>
  branchSipsung: ReturnType<typeof calculateBranchSipsung>
}> {
  const result = []

  for (let i = 0; i < count; i++) {
    const year = startYear + i
    const stemBranch = calculateYearStemBranch(year)

    result.push({
      year,
      stemBranch,
      stemSipsung: calculateStemSipsung(dayMaster, stemBranch.stem),
      branchSipsung: calculateBranchSipsung(dayMaster, stemBranch.branch),
    })
  }

  return result
}

// ============================================
// 월운 (月運) 계산
// ============================================

/**
 * 특정 년월의 월운 간지 계산
 * 절기 기준이 아닌 간단한 계산 (근사값)
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 해당 월의 간지
 */
export function calculateMonthStemBranch(year: number, month: number): StemBranch {
  // 년간에서 월간 계산
  const yearSb = calculateYearStemBranch(year)
  const yearStemIndex = yearSb.stem.index

  // 년상기월법(年上起月法)
  // 월간 시작점 계산
  const monthStemBase: Record<number, number> = {
    0: 2,  // 갑년 → 병인월
    1: 4,  // 을년 → 무인월
    2: 6,  // 병년 → 경인월
    3: 8,  // 정년 → 임인월
    4: 0,  // 무년 → 갑인월
    5: 2,  // 기년 → 병인월
    6: 4,  // 경년 → 무인월
    7: 6,  // 신년 → 경인월
    8: 8,  // 임년 → 임인월
    9: 0,  // 계년 → 갑인월
  }

  const baseMonthStem = monthStemBase[yearStemIndex]

  // 월지: 1월=인(寅), 2월=묘(卯), ..., 11월=자(子), 12월=축(丑)
  // month를 지지 인덱스로 변환: 인(2)부터 시작
  const branchIndex = ((month + 1) % 12)

  // 월간 계산: 인월(2)부터 시작
  const monthOffset = (branchIndex - 2 + 12) % 12
  const stemIndex = (baseMonthStem + monthOffset) % 10

  const stem = HEAVENLY_STEMS[stemIndex]
  const branch = EARTHLY_BRANCHES[branchIndex]

  // 60갑자에서 해당 간지 찾기
  const sixtyIndex = (stemIndex * 6 + Math.floor(branchIndex / 2) +
    (stemIndex % 2 === branchIndex % 2 ? 0 : 6)) % 60

  // 직접 간지 구성
  for (const sb of SIXTY_JIAZI) {
    if (sb.stem.index === stemIndex && sb.branch.index === branchIndex) {
      return sb
    }
  }

  // 폴백: 직접 구성
  return {
    stem,
    branch,
    index: sixtyIndex,
    hanja: stem.hanja + branch.hanja,
    hangul: stem.hangul + branch.hangul,
  }
}

/**
 * 특정 년도의 월운 목록 생성
 */
export function calculateWolunList(
  dayMaster: HeavenlyStem,
  year: number
): Array<{
  year: number
  month: number
  stemBranch: StemBranch
  stemSipsung: ReturnType<typeof calculateStemSipsung>
  branchSipsung: ReturnType<typeof calculateBranchSipsung>
}> {
  const result = []

  for (let month = 1; month <= 12; month++) {
    const stemBranch = calculateMonthStemBranch(year, month)

    result.push({
      year,
      month,
      stemBranch,
      stemSipsung: calculateStemSipsung(dayMaster, stemBranch.stem),
      branchSipsung: calculateBranchSipsung(dayMaster, stemBranch.branch),
    })
  }

  return result
}

// ============================================
// 일운 (日運) 계산
// ============================================

/**
 * 특정 날짜의 일운 간지 계산
 * @param date 날짜
 * @returns 해당 날짜의 간지
 */
export function calculateDayStemBranch(date: Date): StemBranch {
  // Julian Day 계산 (간략화)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 율리우스일 계산 공식
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // 1984년 1월 1일 = 갑자일 (실제로는 갑자일이 아닐 수 있으나 계산용)
  // 실제 기준: JD 2445697 = 1984년 1월 29일 = 갑자일
  const baseJd = 2445697
  const diff = jd - baseJd
  const index = ((diff % 60) + 60) % 60

  return SIXTY_JIAZI[index]
}
