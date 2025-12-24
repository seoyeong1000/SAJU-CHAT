/**
 * @file route.ts
 * @description 챗봇 API (n8n Proxy)
 *
 * 이 API는 사용자의 메시지를 Railway에 배포된 n8n Webhook으로 안전하게 전달합니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. chart_id 소유권 검증 (필수)
 * 3. message_id 생성 (Idempotency)
 * 4. n8n Webhook으로 요청 중계
 * 5. 타임아웃 및 에러 처리
 *
 * 보안:
 * - 인증 필수 (Clerk)
 * - chart_id 소유권 체크 필수
 * - n8n 호출 시 N8N_API_KEY 헤더 포함
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증
 * - @supabase/supabase-js: 소유권 검증
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { ChatMessageRequest, ChatMessageResponse, N8NRequest } from "@/types/chat";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  chart_id: z.string().uuid(),
  session_id: z.string().uuid(),
});

const N8N_TIMEOUT_MS = 30000; // 30초
const FRIENDLY_ERROR_MESSAGE =
  "도사님이 깊게 고민 중이시라 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.";

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
 * n8n Webhook으로 요청 전송 (타임아웃 포함)
 */
async function callN8NWebhook(
  payload: N8NRequest,
  webhookUrl: string,
  apiKey: string,
): Promise<ChatMessageResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    console.log("📤 n8n Webhook 호출 시작:", webhookUrl);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("❌ n8n 응답 오류:", response.status, errorText);
      throw new Error(`n8n returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ChatMessageResponse;

    // 응답 검증
    if (!data.reply_text || !data.meta) {
      console.error("❌ n8n 응답 형식 오류:", data);
      throw new Error("Invalid response format from n8n");
    }

    console.log("✅ n8n 응답 수신 완료");
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      console.error("⏱️ n8n 호출 타임아웃");
      throw new Error("TIMEOUT");
    }

    throw error;
  }
}

export async function POST(req: Request) {
  console.group("💬 챗봇 API 호출");

  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ 인증 완료: ${userId}`);

    // 2. 요청 검증
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      console.error("❌ 요청 검증 실패:", parsed.error.format());
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.format() },
        { status: 400 },
      );
    }

    const body = parsed.data as ChatMessageRequest;
    const supabase = getServiceRoleClient();

    console.log(`📋 chart_id: ${body.chart_id}, session_id: ${body.session_id}`);

    // 3. 소유권 확인 (필수)
    const hasOwnership = await verifyChartOwnership(body.chart_id, userId, supabase);

    if (!hasOwnership) {
      console.error("❌ 소유권 확인 실패");
      return NextResponse.json(
        { error: "Chart not found or access denied" },
        { status: 403 },
      );
    }

    console.log("✅ 소유권 확인 완료");

    // 4. 환경 변수 확인
    const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!webhookUrl || !apiKey) {
      console.error("❌ 환경 변수 누락:", { webhookUrl: !!webhookUrl, apiKey: !!apiKey });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // 5. message_id 생성 (Idempotency)
    const messageId = randomUUID();
    console.log(`🆔 message_id 생성: ${messageId}`);

    // 6. n8n으로 요청 전송
    const n8nPayload: N8NRequest = {
      message: body.message,
      chart_id: body.chart_id,
      session_id: body.session_id,
      message_id: messageId,
      user_id: userId,
    };

    console.log("📤 n8n으로 요청 전송 중...");
    const response = await callN8NWebhook(n8nPayload, webhookUrl, apiKey);

    console.log("✅ 챗봇 응답 생성 완료");
    console.groupEnd();

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 챗봇 API 오류:", error);

    // 타임아웃 또는 네트워크 오류 시 친절한 메시지 반환
    const isTimeout = error instanceof Error && error.message === "TIMEOUT";
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED"));

    if (isTimeout || isNetworkError) {
      console.groupEnd();
      return NextResponse.json(
        {
          reply_text: FRIENDLY_ERROR_MESSAGE,
          meta: {
            severity: "info",
            topic: "system",
          },
        },
        { status: 200 }, // 클라이언트에는 성공으로 보이지만 친절한 메시지 반환
      );
    }

    // 기타 오류는 내부 로그에만 남기고 친절한 메시지 반환
    console.groupEnd();
    return NextResponse.json(
      {
        reply_text: FRIENDLY_ERROR_MESSAGE,
        meta: {
          severity: "info",
          topic: "system",
        },
      },
      { status: 200 },
    );
  }
}

