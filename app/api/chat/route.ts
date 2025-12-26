/**
 * AI 사주 상담 채팅 API
 *
 * 이 API는 사용자의 메시지를 받아 OpenAI를 통해 AI 상담 응답을 생성합니다.
 * Memory RAG를 활용하여 이전 대화 컨텍스트를 참조합니다.
 *
 * @endpoint POST /api/chat
 * @auth Clerk 인증 필수
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import { searchLongTermMemory } from "@/lib/services/memory";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { ChatMessageInsert } from "@/types/database.types";

// 요청 스키마
const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid(),
});

// 시스템 프롬프트 생성
function buildSystemPrompt(memoryContext: string): string {
  const basePrompt = `당신은 따뜻하고 지혜로운 사주 상담가입니다.
사용자의 질문에 친절하고 공감하며 답변합니다.
사주명리학 지식을 바탕으로 조언하되, 지나치게 단정적인 표현은 피합니다.
답변은 자연스러운 대화체로, 2-3문단 정도로 적절히 작성합니다.`;

  if (memoryContext) {
    return `${basePrompt}

[이전 상담 기억]
다음은 이 사용자와의 이전 상담 내용입니다. 참고하여 일관성 있게 답변하세요:
${memoryContext}`;
  }

  return basePrompt;
}

export async function POST(req: Request) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 검증
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;

    // 3. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 4. 세션 존재 확인 (없으면 생성)
    const { data: existingSession } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("owner_id", userId)
      .single();

    if (!existingSession) {
      // 새 세션 생성
      const { error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          id: sessionId,
          owner_id: userId,
        });

      if (sessionError) {
        console.error("[Chat API] 세션 생성 실패:", sessionError);
        return NextResponse.json(
          { error: "세션 생성에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 5. 사용자 메시지 저장
    const userMessage: ChatMessageInsert = {
      session_id: sessionId,
      owner_id: userId,
      role: "user",
      content: message,
    };

    const { error: userMsgError } = await supabase
      .from("chat_messages")
      .insert(userMessage);

    if (userMsgError) {
      console.error("[Chat API] 사용자 메시지 저장 실패:", userMsgError);
    }

    // 6. 장기 기억 검색 (RAG)
    let memoryContext = "";
    try {
      memoryContext = await searchLongTermMemory(userId, message, {
        matchThreshold: 0.7,
        matchCount: 3,
      });
    } catch (memoryError) {
      console.error("[Chat API] 기억 검색 실패:", memoryError);
      // 기억 검색 실패해도 계속 진행
    }

    // 7. 최근 대화 히스토리 조회 (컨텍스트용)
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 최근 메시지를 시간순으로 정렬
    const messageHistory = (recentMessages || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

    // 8. OpenAI API 호출
    const systemPrompt = buildSystemPrompt(memoryContext);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messageHistory,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantContent =
      completion.choices[0]?.message?.content ||
      "죄송합니다. 응답을 생성하지 못했습니다.";

    // 9. AI 응답 저장
    const assistantMessage: ChatMessageInsert = {
      session_id: sessionId,
      owner_id: userId,
      role: "assistant",
      content: assistantContent,
      meta: {
        model: "gpt-4o-mini",
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : null,
        hasMemoryContext: !!memoryContext,
      },
    };

    const { error: assistantMsgError } = await supabase
      .from("chat_messages")
      .insert(assistantMessage);

    if (assistantMsgError) {
      console.error("[Chat API] AI 응답 저장 실패:", assistantMsgError);
    }

    // 10. 응답 반환
    return NextResponse.json({
      response: assistantContent,
      sessionId,
    });
  } catch (error) {
    console.error("[Chat API] 예상치 못한 오류:", error);

    // OpenAI API 오류 처리
    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        { error: "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 세션의 메시지 히스토리 조회
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 세션 소유권 확인 및 메시지 조회
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Chat API] 메시지 조회 실패:", error);
      return NextResponse.json(
        { error: "메시지를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("[Chat API] GET 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
