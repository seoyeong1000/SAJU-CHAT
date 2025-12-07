/**
 * @file route.ts
 * @description 리포트 엔진 API
 *
 * 이 API는 분석된 차트를 기반으로 해석(interpretations)과 해결책(solutions)을 조회합니다.
 *
 * 주요 기능:
 * 1. chart_id의 소유권 검증 (Clerk 인증)
 * 2. chart_analysis_results에서 logic_keys 조회
 * 3. master_interpretations, master_solutions 조회
 * 4. Fallback 정책: 데이터 없을 때 generic.general.fallback 사용
 * 5. 도메인별 필터링 및 정렬
 *
 * 보안:
 * - 인증 필수 (Clerk)
 * - chart_id 소유권 체크 필수
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

const requestSchema = z.object({
  chart_id: z.string().uuid(),
  topic: z.enum(["all", "general", "career", "love", "health"]).optional().default("all"),
  depth: z.enum(["full", "summary"]).optional().default("full"),
  lang: z.string().optional().default("ko"),
});

type ReportRequest = z.infer<typeof requestSchema>;

const FALLBACK_LOGIC_KEY = "generic.general.fallback";

/**
 * chart_id의 소유권 확인
 */
async function verifyChartOwnership(
  chartId: string,
  clerkId: string,
  supabase: ReturnType<typeof getServiceRoleClient>,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bazi_saved_results")
    .select("id, clerk_id")
    .eq("id", chartId)
    .eq("clerk_id", clerkId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.clerk_id === clerkId;
}

/**
 * Fallback 데이터 조회
 */
async function getFallbackData(
  domain: string,
  lang: string,
  supabase: ReturnType<typeof getServiceRoleClient>,
) {
  const { data: interpretations } = await supabase
    .from("master_interpretations")
    .select("*")
    .eq("logic_key", FALLBACK_LOGIC_KEY)
    .eq("domain", domain)
    .eq("is_active", true)
    .eq("lang", lang)
    .order("priority", { ascending: true });

  const { data: solutions } = await supabase
    .from("master_solutions")
    .select("*")
    .eq("logic_key", FALLBACK_LOGIC_KEY)
    .eq("domain", domain)
    .eq("is_active", true)
    .eq("lang", lang)
    .order("priority", { ascending: true });

  return {
    interpretations: interpretations || [],
    solutions: solutions || [],
  };
}

export async function POST(req: Request) {
  console.group("📄 리포트 엔진 API 호출");

  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ 인증 완료: ${userId}`);

    // 요청 검증
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      console.error("❌ 요청 검증 실패:", parsed.error.format());
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.format() },
        { status: 400 },
      );
    }

    const body: ReportRequest = parsed.data;
    const supabase = getServiceRoleClient();

    console.log(`📋 chart_id: ${body.chart_id}, topic: ${body.topic}, lang: ${body.lang}`);

    // 소유권 확인
    const hasOwnership = await verifyChartOwnership(body.chart_id, userId, supabase);

    if (!hasOwnership) {
      console.error("❌ 소유권 확인 실패");
      return NextResponse.json(
        { error: "Chart not found or access denied" },
        { status: 403 },
      );
    }

    console.log("✅ 소유권 확인 완료");

    // 분석 결과 조회
    const { data: analysisResult, error: analysisError } = await supabase
      .from("chart_analysis_results")
      .select("logic_keys, summary")
      .eq("chart_id", body.chart_id)
      .single();

    if (analysisError || !analysisResult) {
      console.warn("⚠️ 분석 결과 없음, Fallback 사용");
      // 분석 결과가 없으면 Fallback만 반환
      const fallback = await getFallbackData(body.topic === "all" ? "general" : body.topic, body.lang, supabase);
      return NextResponse.json({
        chart_id: body.chart_id,
        logic_keys: [],
        topic: body.topic,
        depth: body.depth,
        lang: body.lang,
        interpretations: fallback.interpretations,
        solutions: fallback.solutions,
        fallback_used: true,
      });
    }

    const logicKeys = analysisResult.logic_keys || [];
    console.log(`🔑 logic_keys: ${logicKeys.length}개`);

    // 도메인 필터링
    const domainFilter = body.topic === "all" ? undefined : body.topic;

    // Interpretations 조회
    let interpretationsQuery = supabase
      .from("master_interpretations")
      .select("*")
      .in("logic_key", logicKeys.length > 0 ? logicKeys : [FALLBACK_LOGIC_KEY])
      .eq("is_active", true)
      .eq("lang", body.lang)
      .order("priority", { ascending: true });

    if (domainFilter) {
      interpretationsQuery = interpretationsQuery.eq("domain", domainFilter);
    }

    const { data: interpretations, error: interpretationsError } = await interpretationsQuery;

    if (interpretationsError) {
      console.error("❌ Interpretations 조회 실패:", interpretationsError);
    }

    // Solutions 조회
    let solutionsQuery = supabase
      .from("master_solutions")
      .select("*")
      .in("logic_key", logicKeys.length > 0 ? logicKeys : [FALLBACK_LOGIC_KEY])
      .eq("is_active", true)
      .eq("lang", body.lang)
      .order("priority", { ascending: true });

    if (domainFilter) {
      solutionsQuery = solutionsQuery.eq("domain", domainFilter);
    }

    const { data: solutions, error: solutionsError } = await solutionsQuery;

    if (solutionsError) {
      console.error("❌ Solutions 조회 실패:", solutionsError);
    }

    // Fallback 정책: 데이터가 없으면 Fallback 사용
    let finalInterpretations = interpretations || [];
    let finalSolutions = solutions || [];
    let fallbackUsed = false;

    if (finalInterpretations.length === 0 && finalSolutions.length === 0) {
      console.log("⚠️ 데이터 없음, Fallback 사용");
      const fallback = await getFallbackData(
        domainFilter || "general",
        body.lang,
        supabase,
      );
      finalInterpretations = fallback.interpretations;
      finalSolutions = fallback.solutions;
      fallbackUsed = true;
    }

    // depth가 summary인 경우 간소화
    if (body.depth === "summary") {
      finalInterpretations = finalInterpretations.slice(0, 3);
      finalSolutions = finalSolutions.slice(0, 3);
    }

    console.log(`✅ 리포트 생성 완료: interpretations ${finalInterpretations.length}개, solutions ${finalSolutions.length}개`);
    console.groupEnd();

    return NextResponse.json({
      chart_id: body.chart_id,
      logic_keys: logicKeys,
      topic: body.topic,
      depth: body.depth,
      lang: body.lang,
      interpretations: finalInterpretations,
      solutions: finalSolutions,
      fallback_used: fallbackUsed,
      summary: analysisResult.summary,
    });
  } catch (error) {
    console.error("💥 리포트 엔진 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Report generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

