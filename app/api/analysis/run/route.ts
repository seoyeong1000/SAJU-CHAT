/**
 * @file route.ts
 * @description 분석 엔진 API (Internal Only)
 *
 * 이 API는 서버 내부 또는 n8n 등 자동화 도구에서만 호출 가능합니다.
 * 클라이언트에서 직접 호출하는 것은 금지됩니다.
 *
 * 주요 기능:
 * 1. bazi_result 또는 chart_id를 받아서 분석 수행
 * 2. Idempotency: 동일 chart_id + ruleset_version이면 기존 결과 반환
 * 3. 분석 결과를 chart_analysis_results 테이블에 저장
 *
 * 보안:
 * - Internal Only: X-Internal-Request 헤더 또는 특정 API 키로 보호
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { analyzeBaziResult } from "@/lib/analysis/engine";

const requestSchema = z.object({
  bazi_result: z.record(z.unknown()).optional(),
  chart_id: z.string().uuid().optional(),
});

type AnalysisRequest = z.infer<typeof requestSchema>;

const RULESET_VERSION = process.env.RULESET_VERSION || "v7_2025_q1";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "internal-dev-key";

/**
 * Internal Only API 보호
 */
function checkInternalAccess(request: Request): boolean {
  const internalKey = request.headers.get("X-Internal-Key");
  const internalRequest = request.headers.get("X-Internal-Request");

  // 개발 환경에서는 헤더 체크 완화 가능
  if (process.env.NODE_ENV === "development") {
    return true; // 개발 환경에서는 허용
  }

  // 프로덕션에서는 엄격한 체크
  return (
    internalKey === INTERNAL_API_KEY || internalRequest === "true"
  );
}

export async function POST(req: Request) {
  console.group("📊 분석 엔진 API 호출");

  // Internal Only 체크
  if (!checkInternalAccess(req)) {
    console.error("❌ Internal Only API 접근 거부");
    return NextResponse.json(
      { error: "This API is internal only" },
      { status: 403 },
    );
  }

  try {
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      console.error("❌ 요청 검증 실패:", parsed.error.format());
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.format() },
        { status: 400 },
      );
    }

    const body: AnalysisRequest = parsed.data;
    const supabase = getServiceRoleClient();

    // chart_id가 제공된 경우 기존 차트 조회
    let baziResult: Record<string, unknown> | null = null;
    let chartId: string | null = null;
    let ownerId: string | null = null;

    if (body.chart_id) {
      console.log(`📋 chart_id로 차트 조회: ${body.chart_id}`);

      const { data: chart, error: chartError } = await supabase
        .from("bazi_saved_results")
        .select("id, clerk_id, payload")
        .eq("id", body.chart_id)
        .single();

      if (chartError || !chart) {
        console.error("❌ 차트 조회 실패:", chartError);
        return NextResponse.json(
          { error: "Chart not found" },
          { status: 404 },
        );
      }

      chartId = chart.id;
      ownerId = chart.clerk_id;
      baziResult = chart.payload as Record<string, unknown>;

      // Idempotency 체크: 동일 chart_id + ruleset_version이면 기존 결과 반환
      const { data: existingResult } = await supabase
        .from("chart_analysis_results")
        .select("*")
        .eq("chart_id", chartId)
        .eq("ruleset_version", RULESET_VERSION)
        .single();

      if (existingResult) {
        console.log("✅ 기존 분석 결과 반환 (Idempotency)");
        return NextResponse.json({
          chart_id: chartId,
          logic_keys: existingResult.logic_keys,
          summary: existingResult.summary,
          ruleset_version: existingResult.ruleset_version,
          cached: true,
        });
      }
    } else if (body.bazi_result) {
      baziResult = body.bazi_result;
      console.log("📋 bazi_result 직접 제공됨");
    } else {
      return NextResponse.json(
        { error: "Either bazi_result or chart_id must be provided" },
        { status: 400 },
      );
    }

    if (!baziResult) {
      return NextResponse.json(
        { error: "bazi_result is required" },
        { status: 400 },
      );
    }

    // 분석 수행
    console.log("🔍 분석 시작...");
    const analysisResult = await analyzeBaziResult(
      baziResult as Parameters<typeof analyzeBaziResult>[0],
      RULESET_VERSION,
    );

    // chart_id가 있는 경우에만 DB에 저장
    if (chartId && ownerId) {
      console.log("💾 분석 결과 저장 중...");

      const { data: savedResult, error: saveError } = await supabase
        .from("chart_analysis_results")
        .upsert(
          {
            chart_id: chartId,
            owner_id: ownerId,
            logic_keys: analysisResult.logic_keys,
            summary: analysisResult.summary,
            ruleset_version: RULESET_VERSION,
          },
          {
            onConflict: "chart_id,ruleset_version",
          },
        )
        .select()
        .single();

      if (saveError) {
        console.error("❌ 저장 실패:", saveError);
        // 저장 실패해도 분석 결과는 반환
      } else {
        console.log("✅ 저장 완료");
      }
    }

    console.groupEnd();

    return NextResponse.json({
      chart_id: chartId || null,
      logic_keys: analysisResult.logic_keys,
      summary: analysisResult.summary,
      ruleset_version: RULESET_VERSION,
      cached: false,
    });
  } catch (error) {
    console.error("💥 분석 엔진 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

