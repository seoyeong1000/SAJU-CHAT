/**
 * 만세력 엔진 공개 API
 *
 * @example
 * ```typescript
 * import { calculateManse, getSimpleSaju } from '@/lib/manse'
 *
 * // 전체 결과
 * const result = await calculateManse({
 *   birthDate: '1990-05-15',
 *   birthTime: '14:30',
 *   timeAccuracy: 'exact',
 * })
 *
 * // 간단한 결과 (문자열)
 * const saju = await getSimpleSaju('1990-05-15', '14:30')
 * // { year: '경오', month: '신사', day: '갑진', hour: '신미' }
 * ```
 */

// 메인 계산 함수
export { calculateManse, getSimpleSaju } from './calculator'

// 타입 정의
export type {
  ManseInput,
  ManseResult,
  FourPillars,
  Pillar,
  HeavenlyStem,
  EarthlyBranch,
  StemBranch,
  SolarTermInfo,
  FiveElement,
  YinYang,
  TimeAccuracy,
  ManseErrorCode,
} from './types'

export { ManseError } from './types'

// 상수
export {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  SIXTY_JIAZI,
  SOLAR_TERMS,
  HOUR_BRANCHES,
  ELEMENT_NAMES,
  YINYANG_NAMES,
  ENGINE_VERSION,
} from './constants'

// 절기 관련 유틸리티
export {
  getSunLongitude,
  getSolarTermsForYear,
  findSurroundingSolarTerms,
  getMonthFromDateTime,
} from './solar-terms'

// 십성 계산
export {
  calculateStemSipsung,
  calculateBranchSipsung,
  calculateHiddenStemsSipsung,
  getAllSipsung,
  SIPSUNG_INFO,
} from './sipsung'

// 12운성 계산
export {
  calculateTwelveStage,
  getTwelveStageStrength,
  isTwelveStageAuspicious,
  getAllTwelveStages,
  TWELVE_STAGE_INFO,
} from './twelve-stages'

// 오행 분석
export {
  calculateOhhaengDistribution,
  getOhhaengPercentage,
  calculateSipsungDistribution,
  analyzeSinGangYak,
  suggestYongsin,
} from './ohhaeng'

// 신살/길성 계산
export {
  calculateAllSinsals,
  calculatePillarSinsals,
  filterGilsung,
  filterHyungsal,
  getSinsalInfo,
} from './sinshal'

// 대운/연운/월운 계산
export {
  isDaeunForward,
  calculateDaeunStartAge,
  estimateDaeunStartAge,
  calculateDaeunStemBranches,
  calculateFullDaeun,
  findCurrentDaeun,
  getDaeunOrderByAge,
  calculateYearStemBranch,
  calculateYeonunList,
  calculateMonthStemBranch,
  calculateWolunList,
  calculateDayStemBranch,
} from './daeun'

// 통합 분석
export {
  performFullAnalysis,
  formatAnalysisForApi,
} from './analysis'

// 확장 타입
export type {
  SipsungCode,
  Sipsung,
  TwelveStageCode,
  TwelveStage,
  Sinsal,
  SinsalType,
  Daeun,
  Yeonun,
  Wolun,
  OhhaengDistribution,
  SinGangYak,
  SinGangYakAnalysis,
  PillarAnalysis,
  SajuAnalysis,
} from './types'
