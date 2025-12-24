/**
 * 절기 계산 모듈
 * Swiss Ephemeris를 사용하여 태양 황경을 계산하고 절기를 판단
 */

import { getSwissEngine } from '@/lib/bazi/engine'
import { SOLAR_TERMS, SOLAR_TERM_TO_MONTH_BRANCH } from './constants'
import type { SolarTermInfo } from './types'

/**
 * 안전한 에러 메시지 생성 (WASM panic 방지)
 */
function createSafeError(message: string, context?: Record<string, unknown>): Error {
  // 컨텍스트 정보에서 한글 제거 (Rust WASM 문자열 슬라이싱 버그 방지)
  const safeContext = context
    ? JSON.stringify(context).replace(/[^\x00-\x7F]/g, '?')
    : ''
  return new Error(`${message}${safeContext ? ` (context: ${safeContext})` : ''}`)
}

/**
 * Julian Day를 Date 객체로 변환
 */
function julianDayToDate(jd: number): Date {
  // Julian Day → Unix timestamp 변환
  // JD 2440587.5 = 1970-01-01 00:00:00 UTC
  const unixDays = jd - 2440587.5
  const ms = unixDays * 86400000
  return new Date(ms)
}

/**
 * Date 객체를 Julian Day로 변환
 */
function dateToJulianDay(date: Date): number {
  const ms = date.getTime()
  const unixDays = ms / 86400000
  return unixDays + 2440587.5
}

/**
 * 특정 시점의 태양 황경 계산
 */
export async function getSunLongitude(julianDay: number): Promise<number> {
  const engine = await getSwissEngine()
  const result = engine.swe_calc_ut(
    julianDay,
    engine.constants.SE_SUN,
    engine.constants.SEFLG_SWIEPH
  )
  return result.longitude
}

/**
 * 특정 황경에 도달하는 시점 찾기 (Newton-Raphson 방법)
 * @param targetLongitude 목표 황경 (0-360)
 * @param startJd 검색 시작 Julian Day
 * @param maxIterations 최대 반복 횟수
 */
async function findSolarLongitudeTime(
  targetLongitude: number,
  startJd: number,
  maxIterations = 50
): Promise<number> {
  const engine = await getSwissEngine()
  let jd = startJd

  for (let i = 0; i < maxIterations; i++) {
    const sunPos = engine.swe_calc_ut(
      jd,
      engine.constants.SE_SUN,
      engine.constants.SEFLG_SWIEPH
    )

    let diff = targetLongitude - sunPos.longitude

    // 각도 차이 정규화 (-180 ~ 180)
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360

    // 충분히 가까우면 종료 (약 1분 이내)
    if (Math.abs(diff) < 0.0001) {
      break
    }

    // 태양 평균 이동 속도: 약 1도/일
    // 더 정밀한 계산을 위해 속도 정보 사용
    const speed = sunPos.speedLongitude || 1
    jd += diff / speed
  }

  return jd
}

/**
 * 특정 연도의 모든 절기 시간 계산
 */
export async function getSolarTermsForYear(year: number): Promise<SolarTermInfo[]> {
  const result: SolarTermInfo[] = []

  for (const term of SOLAR_TERMS) {
    // 각 절기의 대략적인 시작 시점 추정
    // 소한(285°)은 1월 초, 입춘(315°)은 2월 초, ...
    let estimatedMonth: number
    if (term.sunLongitude >= 285) {
      estimatedMonth = Math.floor((term.sunLongitude - 285) / 30) + 1
    } else {
      estimatedMonth = Math.floor(term.sunLongitude / 30) + 4
    }

    // 월 보정
    if (estimatedMonth > 12) estimatedMonth -= 12

    // 해당 월의 1일을 시작점으로
    const startDate = new Date(Date.UTC(year, estimatedMonth - 1, 1))
    const startJd = dateToJulianDay(startDate)

    // 정확한 절기 시간 찾기
    const exactJd = await findSolarLongitudeTime(term.sunLongitude, startJd)
    const exactDate = julianDayToDate(exactJd)

    // 연도 보정 (소한, 대한은 이전 연도일 수 있음)
    if (term.index <= 1 && exactDate.getUTCFullYear() > year) {
      // 다음 해로 넘어간 경우, 이전 연도로 재계산
      const prevStartJd = startJd - 365
      const prevExactJd = await findSolarLongitudeTime(term.sunLongitude, prevStartJd)
      const prevExactDate = julianDayToDate(prevExactJd)

      result.push({
        index: term.index,
        name: term.name,
        hanja: term.hanja,
        dateTimeUtc: prevExactDate,
        sunLongitude: term.sunLongitude,
      })
      continue
    }

    result.push({
      index: term.index,
      name: term.name,
      hanja: term.hanja,
      dateTimeUtc: exactDate,
      sunLongitude: term.sunLongitude,
    })
  }

  // 시간순 정렬
  result.sort((a, b) => a.dateTimeUtc.getTime() - b.dateTimeUtc.getTime())

  return result
}

/**
 * 특정 시점 직전의 절기 찾기
 * @param julianDay 기준 시점 (Julian Day)
 * @returns 직전 절기와 다음 절기 정보
 */
export async function findSurroundingSolarTerms(
  julianDay: number
): Promise<{ previous: SolarTermInfo; next: SolarTermInfo }> {
  const date = julianDayToDate(julianDay)
  const year = date.getUTCFullYear()

  // 해당 연도와 인접 연도의 절기 계산
  const [prevYearTerms, currentYearTerms, nextYearTerms] = await Promise.all([
    getSolarTermsForYear(year - 1),
    getSolarTermsForYear(year),
    getSolarTermsForYear(year + 1),
  ])

  const allTerms = [...prevYearTerms, ...currentYearTerms, ...nextYearTerms]
  allTerms.sort((a, b) => a.dateTimeUtc.getTime() - b.dateTimeUtc.getTime())

  const targetTime = date.getTime()

  // 직전 절기와 다음 절기 찾기
  let previousTerm: SolarTermInfo | null = null
  let nextTerm: SolarTermInfo | null = null

  for (let i = 0; i < allTerms.length; i++) {
    const termTime = allTerms[i].dateTimeUtc.getTime()

    if (termTime <= targetTime) {
      previousTerm = allTerms[i]
    } else {
      nextTerm = allTerms[i]
      break
    }
  }

  if (!previousTerm || !nextTerm) {
    throw createSafeError('Solar term calculation error: out of range', {
      julianDay,
      date: date.toISOString(),
    })
  }

  return { previous: previousTerm, next: nextTerm }
}

/**
 * 절기 인덱스로 해당 월의 지지 찾기
 * 절기(節氣)만 월 변경의 기준이 됨 (입춘, 경칩, 청명, ...)
 */
export function getMonthBranchFromSolarTerm(solarTermIndex: number): number | null {
  return SOLAR_TERM_TO_MONTH_BRANCH[solarTermIndex] ?? null
}

/**
 * 주어진 시점이 어느 월에 속하는지 계산
 * 절기 기준으로 월을 판단 (입춘 이후 = 인월(1월))
 */
export async function getMonthFromDateTime(julianDay: number): Promise<{
  monthBranch: number
  solarTerm: SolarTermInfo
}> {
  const { previous } = await findSurroundingSolarTerms(julianDay)

  // 이전 절기가 "절"(節)인지 확인
  // 절기 인덱스: 0(소한), 2(입춘), 4(경칩), ... = 짝수가 절
  // 중기 인덱스: 1(대한), 3(우수), 5(춘분), ... = 홀수가 중기

  // 이전 "절"(節) 찾기
  let currentTermIndex = previous.index

  // 홀수(중기)면 이전 짝수(절)로
  if (currentTermIndex % 2 === 1) {
    currentTermIndex = currentTermIndex - 1
    if (currentTermIndex < 0) currentTermIndex = 22  // 대설(22)
  }

  const monthBranch = SOLAR_TERM_TO_MONTH_BRANCH[currentTermIndex]

  if (monthBranch === undefined) {
    throw createSafeError('Month branch mapping error', {
      solarTermIndex: currentTermIndex,
    })
  }

  return {
    monthBranch,
    solarTerm: previous,
  }
}
