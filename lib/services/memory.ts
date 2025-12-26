import { createEmbedding } from "@/lib/openai";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

/**
 * 장기 기억 검색 결과 타입
 */
interface MemorySearchResult {
  id: string;
  session_id: string;
  summary_json: Json;
  similarity: number;
}

/**
 * 사용자의 장기 기억(채팅 요약)에서 관련 내용을 검색
 *
 * OpenAI 임베딩을 사용하여 쿼리를 벡터로 변환하고,
 * Supabase의 match_summaries RPC 함수를 호출하여 유사한 기억을 검색합니다.
 *
 * @param userId - 검색할 사용자 ID (Clerk user ID)
 * @param query - 검색 쿼리 텍스트
 * @param options - 검색 옵션
 * @returns 검색된 기억 텍스트 (없으면 빈 문자열)
 *
 * @example
 * ```ts
 * const memory = await searchLongTermMemory(userId, "작년 운세에 대해 물어봤던 내용");
 * if (memory) {
 *   console.log("관련 기억:", memory);
 * }
 * ```
 */
export async function searchLongTermMemory(
  userId: string,
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
  } = {}
): Promise<string> {
  const { matchThreshold = 0.7, matchCount = 5 } = options;

  try {
    // 1. 쿼리를 임베딩 벡터로 변환
    const embedding = await createEmbedding(query, "text-embedding-3-small");

    // 2. Clerk 인증된 Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 3. match_summaries RPC 함수 호출
    const { data, error } = await supabase.rpc("match_summaries", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
      search_user_id: userId,
    });

    if (error) {
      console.error("[Memory Service] RPC 호출 실패:", error);
      return "";
    }

    // 4. 검색 결과가 없으면 빈 문자열 반환
    if (!data || data.length === 0) {
      return "";
    }

    // 5. 검색된 요약들을 텍스트로 변환
    const results = data as MemorySearchResult[];
    const memoryTexts = results
      .map((result) => {
        const summary = result.summary_json;
        if (typeof summary === "string") {
          return summary;
        }
        if (summary && typeof summary === "object" && "text" in summary) {
          return (summary as { text: string }).text;
        }
        return JSON.stringify(summary);
      })
      .filter(Boolean);

    return memoryTexts.join("\n\n---\n\n");
  } catch (error) {
    console.error("[Memory Service] 장기 기억 검색 실패:", error);
    return "";
  }
}

/**
 * 새로운 기억(채팅 요약)을 저장
 *
 * @param sessionId - 채팅 세션 ID
 * @param summaryJson - 요약 내용 (JSON)
 * @param summaryText - 요약 텍스트 (임베딩용)
 * @returns 저장 성공 여부
 */
export async function saveLongTermMemory(
  sessionId: string,
  summaryJson: Json,
  summaryText: string
): Promise<boolean> {
  try {
    // 1. 요약 텍스트를 임베딩 벡터로 변환
    const embedding = await createEmbedding(summaryText, "text-embedding-3-small");

    // 2. Clerk 인증된 Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 3. chat_summaries 테이블에 저장
    const { error } = await supabase.from("chat_summaries").insert({
      session_id: sessionId,
      summary_json: summaryJson,
      embedding: JSON.stringify(embedding),
    });

    if (error) {
      console.error("[Memory Service] 기억 저장 실패:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Memory Service] 기억 저장 중 오류:", error);
    return false;
  }
}
