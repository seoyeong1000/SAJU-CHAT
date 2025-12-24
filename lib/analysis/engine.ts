/**
 * @file engine.ts
 * @description 사주 분석 엔진 Service Layer
 *
 * 이 모듈은 만세력 결과(bazi_result)를 분석하여 logic_key를 추출합니다.
 *
 * 주요 기능:
 * 1. master_logic_definitions의 calc_params를 기반으로 계산 수행
 * 2. calc_type별 계산 로직 분기 (score_range, pattern_match, star_check, relation_compare)
 * 3. 계산 결과를 logic_keys 배열로 반환
 *
 * @dependencies
 * - @supabase/supabase-js: 데이터베이스 조회
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export type BaziResult = {
  yearPillar: { stem: { code: string } | null; branch: { code: string } | null };
  monthPillar: { stem: { code: string } | null; branch: { code: string } | null };
  dayPillar: { stem: { code: string } | null; branch: { code: string } | null };
  hourPillar: { stem: { code: string } | null; branch: { code: string } | null };
  raw?: {
    julianDayUTC?: number;
    sunLongitude?: number;
  };
  [key: string]: unknown;
};

type LogicDefinition = {
  logic_key: string;
  calc_type: string;
  calc_params: Record<string, unknown>;
  is_active: boolean;
};

type AnalysisResult = {
  logic_keys: string[];
  summary: Record<string, unknown>;
};

/**
 * 오행 점수 계산 (간단한 구현)
 * 실제로는 십성, 오행 강약 등을 정밀하게 계산해야 함
 */
function calculateElementScores(baziResult: BaziResult): Record<string, number> {
  const scores: Record<string, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const elementMap: Record<string, string> = {
    // 간지 → 오행 매핑 (간단 버전)
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    // 申(신)은 천간 辛(신)과 동일 키라 중복 제거 - 둘 다 metal
    유: "metal",
    술: "earth",
    해: "water",
  };

  const pillars = [
    baziResult.yearPillar,
    baziResult.monthPillar,
    baziResult.dayPillar,
    baziResult.hourPillar,
  ];

  pillars.forEach((pillar) => {
    if (pillar.stem?.code) {
      const element = elementMap[pillar.stem.code];
      if (element) scores[element] = (scores[element] || 0) + 10;
    }
    if (pillar.branch?.code) {
      const element = elementMap[pillar.branch.code];
      if (element) scores[element] = (scores[element] || 0) + 10;
    }
  });

  return scores;
}

/**
 * score_range 타입 계산
 * 예: { element: "wood", threshold_count: 4, threshold_score: 40 }
 */
function evaluateScoreRange(
  calcParams: Record<string, unknown>,
  baziResult: BaziResult,
): boolean {
  const element = calcParams.element as string;
  const thresholdCount = (calcParams.threshold_count as number) || 0;
  const thresholdScore = (calcParams.threshold_score as number) || 0;

  const scores = calculateElementScores(baziResult);
  const elementScore = scores[element] || 0;

  // threshold_count: 해당 오행이 나타나는 횟수
  // threshold_score: 해당 오행의 총 점수
  const count = Object.values(calculateElementScores(baziResult)).filter(
    (score) => score > 0,
  ).length;

  return elementScore >= thresholdScore || count >= thresholdCount;
}

/**
 * pattern_match 타입 계산
 * 예: { target: "monthly_branch_main", value: "jeong_gwan" }
 */
function evaluatePatternMatch(
  calcParams: Record<string, unknown>,
  baziResult: BaziResult,
): boolean {
  const target = calcParams.target as string;
  const value = calcParams.value as string;

  // 간단한 패턴 매칭 로직
  // 실제로는 더 복잡한 패턴 분석이 필요
  if (target === "monthly_branch_main") {
    const monthBranch = baziResult.monthPillar?.branch?.code;
    // 실제로는 월지 기반으로 정관격 등을 판단해야 함
    return monthBranch === value;
  }

  return false;
}

/**
 * star_check 타입 계산
 * 예: { branches: ["zi", "wu", "mao", "you"] }
 */
function evaluateStarCheck(
  calcParams: Record<string, unknown>,
  baziResult: BaziResult,
): boolean {
  const branches = (calcParams.branches as string[]) || [];

  const branchCodes = [
    baziResult.yearPillar?.branch?.code,
    baziResult.monthPillar?.branch?.code,
    baziResult.dayPillar?.branch?.code,
    baziResult.hourPillar?.branch?.code,
  ].filter(Boolean) as string[];

  // 간지 코드 매핑 (실제로는 더 정확한 매핑 필요)
  const branchMap: Record<string, string> = {
    자: "zi",
    축: "chou",
    인: "yin",
    묘: "mao",
    진: "chen",
    사: "si",
    오: "wu",
    미: "wei",
    신: "shen",
    유: "you",
    술: "xu",
    해: "hai",
  };

  const normalizedBranches = branchCodes.map((code) => branchMap[code] || code);

  return branches.some((branch) => normalizedBranches.includes(branch));
}

/**
 * relation_compare 타입 계산
 * 예: { user_a: "siksang_excess", user_b: "gwanseong_excess" }
 * 주의: 이 타입은 두 사용자 간 비교이므로 단일 차트로는 계산 불가
 */
function evaluateRelationCompare(
  calcParams: Record<string, unknown>,
  baziResult: BaziResult,
): boolean {
  // 관계 비교는 두 차트가 필요하므로 현재는 false 반환
  // 향후 두 차트를 받아서 비교하는 로직 구현 필요
  console.log("relation_compare는 두 차트 비교가 필요합니다", calcParams);
  return false;
}

/**
 * 단일 로직 정의 평가
 */
function evaluateLogic(
  logicDef: LogicDefinition,
  baziResult: BaziResult,
): boolean {
  if (!logicDef.is_active) return false;

  const { calc_type, calc_params } = logicDef;

  switch (calc_type) {
    case "score_range":
      return evaluateScoreRange(calc_params, baziResult);
    case "pattern_match":
      return evaluatePatternMatch(calc_params, baziResult);
    case "star_check":
      return evaluateStarCheck(calc_params, baziResult);
    case "relation_compare":
      return evaluateRelationCompare(calc_params, baziResult);
    default:
      console.warn(`Unknown calc_type: ${calc_type}`, logicDef);
      return false;
  }
}

/**
 * 만세력 결과를 분석하여 logic_keys 추출
 */
export async function analyzeBaziResult(
  baziResult: BaziResult,
  rulesetVersion: string = "v7_2025_q1",
): Promise<AnalysisResult> {
  console.group("🔍 사주 분석 시작");
  console.log("입력 데이터:", JSON.stringify(baziResult, null, 2));

  const supabase = getServiceRoleClient();

  // 활성화된 모든 로직 정의 조회
  const { data: logicDefinitions, error } = await supabase
    .from("master_logic_definitions")
    .select("*")
    .eq("is_active", true)
    .order("logic_key");

  if (error) {
    console.error("❌ 로직 정의 조회 실패:", error);
    throw new Error(`Failed to fetch logic definitions: ${error.message}`);
  }

  if (!logicDefinitions || logicDefinitions.length === 0) {
    console.warn("⚠️ 활성화된 로직 정의가 없습니다");
    return { logic_keys: [], summary: {} };
  }

  console.log(`📋 ${logicDefinitions.length}개 로직 정의 로드 완료`);

  // 각 로직 정의 평가
  const matchedLogicKeys: string[] = [];
  const summary: Record<string, unknown> = {
    total_definitions: logicDefinitions.length,
    matched_count: 0,
    element_scores: calculateElementScores(baziResult),
  };

  for (const logicDef of logicDefinitions) {
    const matched = evaluateLogic(logicDef, baziResult);
    if (matched) {
      matchedLogicKeys.push(logicDef.logic_key);
      console.log(`✅ 매칭: ${logicDef.logic_key}`);
    }
  }

  summary.matched_count = matchedLogicKeys.length;
  summary.matched_logic_keys = matchedLogicKeys;

  console.log(`✅ 분석 완료: ${matchedLogicKeys.length}개 logic_key 추출`);
  console.groupEnd();

  return {
    logic_keys: matchedLogicKeys,
    summary,
  };
}

