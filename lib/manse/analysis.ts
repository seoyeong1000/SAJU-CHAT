/**
 * 사주 통합 분석 모듈
 * 모든 분석 결과를 종합
 */

import type {
  FourPillars,
  HeavenlyStem,
  EarthlyBranch,
  SolarTermInfo,
  Daeun,
  Sinsal,
  OhhaengDistribution,
  SinGangYakAnalysis,
  PillarAnalysis,
  SajuAnalysis,
  FiveElement,
} from './types'

import { calculateStemSipsung, calculateBranchSipsung, calculateHiddenStemsSipsung } from './sipsung'
import { calculateTwelveStage } from './twelve-stages'
import { calculateOhhaengDistribution, calculateSipsungDistribution, analyzeSinGangYak, suggestYongsin } from './ohhaeng'
import { calculateAllSinsals, calculatePillarSinsals } from './sinshal'
import { calculateFullDaeun, isDaeunForward } from './daeun'

/**
 * 사주의 모든 분석을 수행
 */
export function performFullAnalysis(
  pillars: FourPillars,
  dayMaster: HeavenlyStem,
  gender: 'male' | 'female' = 'male',
  birthDate: Date,
  solarTerms?: {
    current: SolarTermInfo | null
    next: SolarTermInfo | null
    prev: SolarTermInfo | null
  }
): SajuAnalysis {
  const monthBranch = pillars.month.branch

  // 1. 기둥별 분석
  const pillarAnalysis = {
    year: analyzePillar(pillars, dayMaster, 'year'),
    month: analyzePillar(pillars, dayMaster, 'month'),
    day: analyzePillar(pillars, dayMaster, 'day'),
    hour: pillars.hour ? analyzePillar(pillars, dayMaster, 'hour') : null,
  }

  // 2. 오행 분포
  const ohhaeng = calculateOhhaengDistribution(pillars, true)

  // 3. 십성 분포
  const sipsungDistribution = calculateSipsungDistribution(pillars, dayMaster)

  // 4. 신강/신약 분석
  const sinGangYak = monthBranch
    ? analyzeSinGangYak(pillars, dayMaster, monthBranch)
    : { result: 'junghwa' as const, score: 50, description: '분석 불가' }

  // 5. 전체 신살
  const allSinsals = calculateAllSinsals(pillars, dayMaster)

  // 6. 대운
  const { daeunList, startAge } = calculateFullDaeun(
    pillars,
    dayMaster,
    gender,
    birthDate,
    solarTerms
  )

  return {
    pillars: pillarAnalysis,
    ohhaeng,
    sipsungDistribution,
    sinGangYak,
    allSinsals,
    daeunList,
    daeunStartAge: startAge,
  }
}

/**
 * 단일 기둥 분석
 */
function analyzePillar(
  pillars: FourPillars,
  dayMaster: HeavenlyStem,
  pillarType: 'year' | 'month' | 'day' | 'hour'
): PillarAnalysis {
  const pillar = pillars[pillarType]

  if (!pillar) {
    return {
      stemSipsung: null,
      branchSipsung: null,
      hiddenStems: [],
      twelveStage: null,
      sinsals: [],
    }
  }

  // 천간 십성 (일간 자신은 제외)
  const stemSipsung =
    pillar.stem && pillarType !== 'day'
      ? calculateStemSipsung(dayMaster, pillar.stem)
      : null

  // 지지 십성
  const branchSipsung = pillar.branch
    ? calculateBranchSipsung(dayMaster, pillar.branch)
    : null

  // 지장간
  const hiddenStems = pillar.branch
    ? calculateHiddenStemsSipsung(dayMaster, pillar.branch)
    : []

  // 12운성
  const twelveStage =
    pillar.branch ? calculateTwelveStage(dayMaster, pillar.branch) : null

  // 신살
  const sinsals = calculatePillarSinsals(pillars, dayMaster, pillarType)

  return {
    stemSipsung,
    branchSipsung,
    hiddenStems,
    twelveStage,
    sinsals,
  }
}

/**
 * 분석 결과를 API 응답 형식으로 변환
 */
export function formatAnalysisForApi(
  analysis: SajuAnalysis,
  dayMaster: HeavenlyStem,
  yearStem: HeavenlyStem | null,
  gender: 'male' | 'female'
): {
  ohhaeng: {
    distribution: OhhaengDistribution
    percentage: Record<FiveElement, number>
  }
  sinGangYak: SinGangYakAnalysis
  yongsin: { element: FiveElement; description: string }
  sinsals: {
    all: Sinsal[]
    gilsung: Sinsal[]
    hyungsal: Sinsal[]
  }
  daeun: {
    isForward: boolean
    startAge: number
    list: Array<{
      order: number
      startAge: number
      endAge: number
      stemBranch: { hangul: string; hanja: string }
      stemSipsung: { name: string; code: string }
      branchSipsung: { name: string; code: string }
    }>
  }
  sipsungDistribution: Record<string, number>
} {
  const { ohhaeng, sinGangYak, allSinsals, daeunList, daeunStartAge, sipsungDistribution } = analysis

  // 용신 계산
  const yongsin = suggestYongsin(dayMaster, sinGangYak.result)

  // 오행 퍼센티지
  const total = ohhaeng.total || 1
  const percentage: Record<FiveElement, number> = {
    wood: Math.round((ohhaeng.wood / total) * 100 * 10) / 10,
    fire: Math.round((ohhaeng.fire / total) * 100 * 10) / 10,
    earth: Math.round((ohhaeng.earth / total) * 100 * 10) / 10,
    metal: Math.round((ohhaeng.metal / total) * 100 * 10) / 10,
    water: Math.round((ohhaeng.water / total) * 100 * 10) / 10,
  }

  // 대운 순행/역행
  const isForward = yearStem ? isDaeunForward(yearStem, gender) : true

  return {
    ohhaeng: {
      distribution: ohhaeng,
      percentage,
    },
    sinGangYak,
    yongsin,
    sinsals: {
      all: allSinsals,
      gilsung: allSinsals.filter(s => s.type === 'gilsung'),
      hyungsal: allSinsals.filter(s => s.type === 'hyungsal'),
    },
    daeun: {
      isForward,
      startAge: daeunStartAge,
      list: daeunList.map(d => ({
        order: d.order,
        startAge: d.startAge,
        endAge: d.endAge,
        stemBranch: {
          hangul: d.stemBranch.hangul,
          hanja: d.stemBranch.hanja,
        },
        stemSipsung: {
          name: d.stemSipsung.name,
          code: d.stemSipsung.code,
        },
        branchSipsung: {
          name: d.branchSipsung.name,
          code: d.branchSipsung.code,
        },
      })),
    },
    sipsungDistribution: sipsungDistribution as unknown as Record<string, number>,
  }
}
