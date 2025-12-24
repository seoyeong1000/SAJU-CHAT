/**
 * 만세력 엔진 타입 정의
 */

/** 오행 (Five Elements) */
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

/** 오행 한글 */
export type FiveElementKo = '목' | '화' | '토' | '금' | '수'

/** 음양 (Yin-Yang) */
export type YinYang = 'yang' | 'yin'

/** 천간 (Heavenly Stem) */
export interface HeavenlyStem {
  index: number       // 0-9
  hanja: string       // 甲
  hangul: string      // 갑
  code: string        // jia
  element: FiveElement
  yinYang: YinYang
}

/** 지지 (Earthly Branch) */
export interface EarthlyBranch {
  index: number       // 0-11
  hanja: string       // 子
  hangul: string      // 자
  code: string        // zi
  element: FiveElement
  yinYang: YinYang
  hiddenStems: string[] // 지장간 (Hidden Stems)
}

/** 간지 (Stem-Branch pair) = 60갑자 중 하나 */
export interface StemBranch {
  stem: HeavenlyStem
  branch: EarthlyBranch
  index: number       // 60갑자 인덱스 (0-59)
  hanja: string       // 甲子
  hangul: string      // 갑자
}

/** 단일 기둥 (Pillar) */
export interface Pillar {
  stem: HeavenlyStem | null
  branch: EarthlyBranch | null
  stemBranch: StemBranch | null
}

/** 사주 팔자 (Four Pillars) */
export interface FourPillars {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar | null  // 시간 모름인 경우 null
}

/** 시간 정확도 */
export type TimeAccuracy = 'exact' | 'approximate' | 'unknown'

/** 만세력 입력 */
export interface ManseInput {
  /** 생년월일 (YYYY-MM-DD) */
  birthDate: string
  /** 출생시간 (HH:mm), 시간 모름이면 null */
  birthTime: string | null
  /** 시간 정확도 */
  timeAccuracy: TimeAccuracy
  /** 성별 (선택) */
  gender?: 'male' | 'female'
  /** 출생지 위도 (선택) */
  latitude?: number
  /** 출생지 경도 (선택) */
  longitude?: number
  /** 타임존 (기본: Asia/Seoul) */
  timezone?: string
}

/** 절기 정보 */
export interface SolarTermInfo {
  /** 절기 인덱스 (0-23) */
  index: number
  /** 절기 이름 (한글) */
  name: string
  /** 절기 이름 (한자) */
  hanja: string
  /** 절기 시작 시간 (UTC) */
  dateTimeUtc: Date
  /** 태양 황경 */
  sunLongitude: number
}

/** 만세력 계산 결과 */
export interface ManseResult {
  /** 입력 정보 */
  input: ManseInput
  /** 사주 팔자 */
  pillars: FourPillars
  /** 일주 (Day Master) */
  dayMaster: HeavenlyStem | null
  /** 계산에 사용된 절기 정보 */
  solarTerm: {
    current: SolarTermInfo | null
    previous: SolarTermInfo | null
  }
  /** 음력 정보 (선택) */
  lunar?: {
    year: number
    month: number
    day: number
    isLeapMonth: boolean
  }
  /** 계산 메타 정보 */
  meta: {
    /** 계산 엔진 버전 */
    engineVersion: string
    /** 계산 시간 (ISO) */
    calculatedAt: string
    /** 사용된 UTC 시간 */
    utcDateTime: string
    /** Julian Day */
    julianDay: number
    /** 태양 황경 */
    sunLongitude: number
    /** 경도 보정 정보 (시간 보정 적용 시) */
    longitudeCorrection?: {
      /** 입력된 경도 */
      longitude: number
      /** 보정 시간 (분 단위, 음수면 시간을 빼야 함) */
      correctionMinutes: number
      /** 보정 전 현지 시간 */
      originalLocalTime: string
      /** 보정 후 진태양시 */
      correctedSolarTime: string
    }
  }
}

// ============================================
// 십성 (十星 / Ten Gods)
// ============================================

/** 십성 코드 */
export type SipsungCode =
  | 'bigyeon'    // 비견 (比肩)
  | 'geopjae'    // 겁재 (劫財)
  | 'siksin'     // 식신 (食神)
  | 'sanggwan'   // 상관 (傷官)
  | 'pyeonjae'   // 편재 (偏財)
  | 'jeongjae'   // 정재 (正財)
  | 'pyeongwan'  // 편관 (偏官/七殺)
  | 'jeonggwan'  // 정관 (正官)
  | 'pyeonin'    // 편인 (偏印/梟神)
  | 'jeongin'    // 정인 (正印)

/** 십성 정보 */
export interface Sipsung {
  code: SipsungCode
  name: string      // 한글 이름 (비견, 겁재 등)
  hanja: string     // 한자 (比肩, 劫財 등)
  shortName: string // 축약 이름 (비, 겁 등)
}

// ============================================
// 12운성 (十二運星 / Twelve Stages)
// ============================================

/** 12운성 코드 */
export type TwelveStageCode =
  | 'jangsaeng'  // 장생 (長生)
  | 'mokyok'     // 목욕 (沐浴)
  | 'gwandae'    // 관대 (冠帶)
  | 'imgwan'     // 임관 (臨官)
  | 'jewang'     // 제왕 (帝旺)
  | 'soe'        // 쇠 (衰)
  | 'byeong'     // 병 (病)
  | 'sa'         // 사 (死)
  | 'myo'        // 묘 (墓)
  | 'jeol'       // 절 (絶)
  | 'tae'        // 태 (胎)
  | 'yang'       // 양 (養)

/** 12운성 정보 */
export interface TwelveStage {
  code: TwelveStageCode
  name: string    // 한글 이름
  hanja: string   // 한자
}

// ============================================
// 신살 (神殺 / Divine Spirits)
// ============================================

/** 신살 타입 */
export type SinsalType = 'gilsung' | 'hyungsal' // 길성 / 흉살

/** 신살 정보 */
export interface Sinsal {
  code: string
  name: string     // 한글 이름
  hanja: string    // 한자
  type: SinsalType
  description?: string
}

// ============================================
// 대운 (大運 / Major Luck Cycle)
// ============================================

/** 대운 정보 */
export interface Daeun {
  /** 대운 순번 (1, 2, 3, ...) */
  order: number
  /** 시작 나이 */
  startAge: number
  /** 종료 나이 */
  endAge: number
  /** 대운 간지 */
  stemBranch: StemBranch
  /** 대운 십성 (천간 기준) */
  stemSipsung: Sipsung
  /** 대운 십성 (지지 기준) */
  branchSipsung: Sipsung
}

// ============================================
// 연운/월운 (Year/Month Luck)
// ============================================

/** 연운 정보 */
export interface Yeonun {
  year: number
  stemBranch: StemBranch
  stemSipsung: Sipsung
  branchSipsung: Sipsung
}

/** 월운 정보 */
export interface Wolun {
  year: number
  month: number // 1-12
  stemBranch: StemBranch
  stemSipsung: Sipsung
  branchSipsung: Sipsung
}

// ============================================
// 오행 분석 (Five Elements Analysis)
// ============================================

/** 오행 분포 */
export interface OhhaengDistribution {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
  total: number
}

/** 신강/신약 판단 */
export type SinGangYak = 'singang' | 'sinyak' | 'junghwa'

/** 신강/신약 분석 결과 */
export interface SinGangYakAnalysis {
  result: SinGangYak
  score: number       // 0-100
  description: string
}

// ============================================
// 확장된 사주 분석 결과
// ============================================

/** 기둥별 상세 분석 */
export interface PillarAnalysis {
  /** 천간 십성 */
  stemSipsung: Sipsung | null
  /** 지지 십성 */
  branchSipsung: Sipsung | null
  /** 지장간 정보 */
  hiddenStems: {
    stem: HeavenlyStem
    sipsung: Sipsung
  }[]
  /** 12운성 */
  twelveStage: TwelveStage | null
  /** 신살 목록 */
  sinsals: Sinsal[]
}

/** 사주 상세 분석 결과 */
export interface SajuAnalysis {
  /** 기둥별 분석 */
  pillars: {
    year: PillarAnalysis
    month: PillarAnalysis
    day: PillarAnalysis
    hour: PillarAnalysis | null
  }
  /** 오행 분포 */
  ohhaeng: OhhaengDistribution
  /** 십성 분포 */
  sipsungDistribution: Record<SipsungCode, number>
  /** 신강/신약 분석 */
  sinGangYak: SinGangYakAnalysis
  /** 전체 신살 목록 */
  allSinsals: Sinsal[]
  /** 대운 목록 */
  daeunList: Daeun[]
  /** 대운 시작 나이 */
  daeunStartAge: number
}

/** 에러 타입 */
export type ManseErrorCode =
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'DST_AMBIGUOUS'
  | 'DST_INVALID'
  | 'ENGINE_ERROR'
  | 'UNKNOWN_ERROR'

export class ManseError extends Error {
  constructor(
    public code: ManseErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ManseError'
  }
}
