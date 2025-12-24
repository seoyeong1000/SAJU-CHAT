/**
 * 만세력 계산기 (핵심 모듈)
 * 생년월일시를 입력받아 사주팔자를 계산
 */

import { DateTime } from 'luxon'
import { getSwissEngine } from '@/lib/bazi/engine'
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  SIXTY_JIAZI,
  HOUR_BRANCHES,
  YEAR_STEM_TO_MONTH_STEM_BASE,
  DAY_STEM_TO_HOUR_STEM_BASE,
  ENGINE_VERSION,
} from './constants'
import { getSunLongitude, findSurroundingSolarTerms, getMonthFromDateTime } from './solar-terms'
import { calculateLongitudeOffset } from '@/lib/bazi/eot-approx'
import type {
  ManseInput,
  ManseResult,
  FourPillars,
  Pillar,
  HeavenlyStem,
  EarthlyBranch,
  StemBranch,
  ManseError,
} from './types'
import { ManseError as ManseErrorClass } from './types'

/**
 * 안전한 에러 메시지 생성 (WASM panic 방지)
 * Rust WASM은 UTF-8 바이트 경계를 고려하지 않고 문자열을 자를 수 있음
 */
function sanitizeForError(value: unknown): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  // ASCII 문자만 남기기
  return str.replace(/[^\x00-\x7F]/g, '?')
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * Date를 Julian Day로 변환
 */
function dateToJulianDay(date: Date): number {
  const ms = date.getTime()
  const unixDays = ms / 86400000
  return unixDays + 2440587.5
}

/**
 * 입력 날짜 파싱 및 검증
 */
function parseDateTime(input: ManseInput): DateTime {
  const timezone = input.timezone || 'Asia/Seoul'

  // 날짜 파싱
  let dt: DateTime

  if (input.birthTime && input.timeAccuracy !== 'unknown') {
    // 시간이 있는 경우
    const dateTimeStr = `${input.birthDate}T${input.birthTime}`
    dt = DateTime.fromISO(dateTimeStr, { zone: timezone })
  } else {
    // 시간 모름 - 정오(12:00)로 설정 (일주 계산용)
    const dateTimeStr = `${input.birthDate}T12:00`
    dt = DateTime.fromISO(dateTimeStr, { zone: timezone })
  }

  if (!dt.isValid) {
    throw new ManseErrorClass('INVALID_DATE', `Invalid date format: ${sanitizeForError(input.birthDate)}`)
  }

  // DST 체크 (선택적)
  // Asia/Seoul은 현재 DST를 사용하지 않지만, 역사적 DST 처리 필요시 여기에 추가

  return dt
}

/**
 * 시간 → 시진(時辰) 지지 인덱스 계산
 */
function getHourBranchIndex(hour: number): number {
  // 자시(子時): 23:00-01:00 → 0
  // 축시(丑時): 01:00-03:00 → 1
  // ...
  if (hour >= 23 || hour < 1) return 0   // 자시
  if (hour >= 1 && hour < 3) return 1    // 축시
  if (hour >= 3 && hour < 5) return 2    // 인시
  if (hour >= 5 && hour < 7) return 3    // 묘시
  if (hour >= 7 && hour < 9) return 4    // 진시
  if (hour >= 9 && hour < 11) return 5   // 사시
  if (hour >= 11 && hour < 13) return 6  // 오시
  if (hour >= 13 && hour < 15) return 7  // 미시
  if (hour >= 15 && hour < 17) return 8  // 신시
  if (hour >= 17 && hour < 19) return 9  // 유시
  if (hour >= 19 && hour < 21) return 10 // 술시
  return 11                               // 해시 (21:00-23:00)
}

// ============================================
// 사주 기둥 계산
// ============================================

/**
 * 연주(年柱) 계산
 * 입춘 기준으로 연도 결정
 */
async function calculateYearPillar(
  julianDay: number,
  solarYear: number
): Promise<StemBranch> {
  // 입춘 기준 연도 판단을 위해 절기 확인
  const { previous } = await findSurroundingSolarTerms(julianDay)

  let yearForCalc = solarYear

  // 입춘(인덱스 2) 이전이면 전년도
  // 입춘 이전의 절기: 소한(0), 대한(1)
  if (previous.index < 2) {
    yearForCalc = solarYear - 1
  }

  // 60갑자 인덱스 계산
  // 기준: 서기 4년 = 갑자년 (index 0)
  const base = 4
  let index = (yearForCalc - base) % 60
  if (index < 0) index += 60

  return SIXTY_JIAZI[index]
}

/**
 * 월주(月柱) 계산
 * 절기 기준으로 월 결정, 년간에서 월간 도출
 */
async function calculateMonthPillar(
  julianDay: number,
  yearStem: HeavenlyStem
): Promise<StemBranch> {
  // 절기 기반 월 지지 계산
  const { monthBranch } = await getMonthFromDateTime(julianDay)

  // 년간 → 월간 계산 (年上起月法)
  // 인월(2)이 기준
  const monthStemBase = YEAR_STEM_TO_MONTH_STEM_BASE[yearStem.index]
  const monthOffset = (monthBranch - 2 + 12) % 12  // 인월 기준 오프셋
  const monthStemIndex = (monthStemBase + monthOffset) % 10

  // 60갑자 인덱스 계산
  // 천간과 지지의 조합으로 60갑자 인덱스 찾기
  const stemIndex = monthStemIndex
  const branchIndex = monthBranch

  // 60갑자에서 해당 조합 찾기
  for (const jiazi of SIXTY_JIAZI) {
    if (jiazi.stem.index === stemIndex && jiazi.branch.index === branchIndex) {
      return jiazi
    }
  }

  // 직접 계산 (위에서 못 찾은 경우)
  // 60갑자 인덱스 = (stemIndex * 6 + branchIndex) mod 60 형태가 아님
  // 올바른 공식 필요
  let jiaziIndex = 0
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIndex && i % 12 === branchIndex) {
      jiaziIndex = i
      break
    }
  }

  return SIXTY_JIAZI[jiaziIndex]
}

/**
 * 일주(日柱) 계산
 * Julian Day 기반으로 60갑자 순환
 */
async function calculateDayPillar(julianDay: number): Promise<StemBranch> {
  // 기준일: 서기 1900년 1월 1일 = 갑진일 (JD 2415021)
  // 더 정확한 기준: JD 2415020.5 = 1899년 12월 31일 정오(UTC)
  // 갑자일 기준: JD 0 (기원전 4713년 1월 1일)은 갑자일이 아님

  // 실제 기준: 서기 -4712년 1월 1일(JD 0)은 갑자(甲子)일이 아님
  // 우리는 알려진 갑자일을 기준으로 사용
  // 1984년 12월 26일 = 갑자일 (JD 2446066)

  const baseJd = 2446066 // 1984년 12월 26일 = 갑자일
  const daysSince = Math.floor(julianDay + 0.5) - Math.floor(baseJd + 0.5)
  let index = daysSince % 60
  if (index < 0) index += 60

  return SIXTY_JIAZI[index]
}

/**
 * 시주(時柱) 계산
 * 일간에서 시간 도출
 */
function calculateHourPillar(
  localHour: number,
  dayStem: HeavenlyStem
): StemBranch {
  // 시진 지지 계산
  const hourBranchIndex = getHourBranchIndex(localHour)

  // 일간 → 시간 계산 (日上起時法)
  const hourStemBase = DAY_STEM_TO_HOUR_STEM_BASE[dayStem.index]
  const hourStemIndex = (hourStemBase + hourBranchIndex) % 10

  // 60갑자 찾기
  for (const jiazi of SIXTY_JIAZI) {
    if (jiazi.stem.index === hourStemIndex && jiazi.branch.index === hourBranchIndex) {
      return jiazi
    }
  }

  // 폴백 (이론적으로 도달하지 않음)
  return SIXTY_JIAZI[0]
}

// ============================================
// 메인 계산 함수
// ============================================

/**
 * 경도 기반 시간 보정 계산
 * @param dt 원본 DateTime
 * @param longitude 출생지 경도
 * @returns 보정 정보
 */
function calculateTimeCorrection(
  dt: DateTime,
  longitude: number
): {
  correctedHour: number
  correctedMinute: number
  correctionMinutes: number
  originalLocalTime: string
  correctedSolarTime: string
} {
  // 타임존 오프셋 (분 단위)
  const tzOffsetMinutes = dt.offset // luxon은 분 단위로 오프셋 제공

  // 경도 보정값 계산 (분 단위)
  // KST(+9)의 표준 자오선은 135도
  // 서울(127도)의 경우: (127 - 135) * 4 = -32분
  const correctionMinutes = calculateLongitudeOffset(longitude, tzOffsetMinutes)

  // 보정된 시간 계산
  const correctedDt = dt.plus({ minutes: correctionMinutes })

  return {
    correctedHour: correctedDt.hour,
    correctedMinute: correctedDt.minute,
    correctionMinutes: Math.round(correctionMinutes),
    originalLocalTime: dt.toFormat('HH:mm'),
    correctedSolarTime: correctedDt.toFormat('HH:mm'),
  }
}

/**
 * 만세력 계산 메인 함수
 * @param input 생년월일시 입력
 * @returns 사주팔자 계산 결과
 */
export async function calculateManse(input: ManseInput): Promise<ManseResult> {
  // 1. 입력 파싱 및 검증
  const dt = parseDateTime(input)

  // 2. UTC 변환 및 Julian Day 계산
  const utcDate = dt.toUTC().toJSDate()
  const julianDay = dateToJulianDay(utcDate)

  // 3. 태양 황경 계산
  const sunLongitude = await getSunLongitude(julianDay)

  // 4. 절기 정보 조회
  const solarTerms = await findSurroundingSolarTerms(julianDay)

  // 5. 연주 계산
  const yearPillar = await calculateYearPillar(julianDay, dt.year)

  // 6. 월주 계산
  const monthPillar = await calculateMonthPillar(julianDay, yearPillar.stem)

  // 7. 일주 계산
  const dayPillar = await calculateDayPillar(julianDay)

  // 8. 경도 보정 계산 (경도가 제공된 경우)
  let timeCorrection: ReturnType<typeof calculateTimeCorrection> | null = null
  let hourForCalculation = dt.hour

  if (input.longitude !== undefined && input.birthTime && input.timeAccuracy !== 'unknown') {
    timeCorrection = calculateTimeCorrection(dt, input.longitude)
    hourForCalculation = timeCorrection.correctedHour

    // 자시(23:00~01:00) 보정으로 인해 날짜가 바뀌는 경우 처리
    // 예: 23:30 → 보정 후 23:00 이전이면 전날 해시(亥時)
    // 예: 00:30 → 보정 후 01:00 이후면 당일 축시(丑時)
    // 참고: 자시 경계 문제는 복잡하므로 현재는 시간만 보정
  }

  // 9. 시주 계산 (시간 모름이면 null)
  let hourPillarResult: Pillar | null = null

  if (input.birthTime && input.timeAccuracy !== 'unknown') {
    const hourPillar = calculateHourPillar(hourForCalculation, dayPillar.stem)
    hourPillarResult = {
      stem: hourPillar.stem,
      branch: hourPillar.branch,
      stemBranch: hourPillar,
    }
  }

  // 10. 결과 조합
  const pillars: FourPillars = {
    year: {
      stem: yearPillar.stem,
      branch: yearPillar.branch,
      stemBranch: yearPillar,
    },
    month: {
      stem: monthPillar.stem,
      branch: monthPillar.branch,
      stemBranch: monthPillar,
    },
    day: {
      stem: dayPillar.stem,
      branch: dayPillar.branch,
      stemBranch: dayPillar,
    },
    hour: hourPillarResult,
  }

  const result: ManseResult = {
    input,
    pillars,
    dayMaster: dayPillar.stem,
    solarTerm: {
      current: solarTerms.previous,
      previous: solarTerms.previous,
    },
    meta: {
      engineVersion: ENGINE_VERSION,
      calculatedAt: new Date().toISOString(),
      utcDateTime: utcDate.toISOString(),
      julianDay,
      sunLongitude,
      // 경도 보정 정보 추가
      ...(timeCorrection && input.longitude !== undefined
        ? {
            longitudeCorrection: {
              longitude: input.longitude,
              correctionMinutes: timeCorrection.correctionMinutes,
              originalLocalTime: timeCorrection.originalLocalTime,
              correctedSolarTime: timeCorrection.correctedSolarTime,
            },
          }
        : {}),
    },
  }

  return result
}

/**
 * 간단한 사주 계산 (문자열 반환)
 */
export async function getSimpleSaju(
  birthDate: string,
  birthTime: string | null = null
): Promise<{
  year: string
  month: string
  day: string
  hour: string | null
}> {
  const result = await calculateManse({
    birthDate,
    birthTime,
    timeAccuracy: birthTime ? 'exact' : 'unknown',
  })

  return {
    year: result.pillars.year.stemBranch?.hangul || '',
    month: result.pillars.month.stemBranch?.hangul || '',
    day: result.pillars.day.stemBranch?.hangul || '',
    hour: result.pillars.hour?.stemBranch?.hangul || null,
  }
}
