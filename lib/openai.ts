import OpenAI from "openai";

/**
 * OpenAI 클라이언트 인스턴스 (Lazy Initialization)
 *
 * 환경 변수 OPENAI_API_KEY를 사용하여 초기화됩니다.
 * 서버 사이드에서만 사용해야 합니다.
 * 빌드 시점이 아닌 실제 호출 시점에 초기화됩니다.
 *
 * @example
 * ```ts
 * import { getOpenAI } from '@/lib/openai';
 *
 * const openai = getOpenAI();
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o-mini',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

/**
 * 텍스트를 임베딩 벡터로 변환
 *
 * @param text - 임베딩할 텍스트
 * @param model - 사용할 임베딩 모델 (기본값: text-embedding-3-small)
 * @returns 임베딩 벡터 배열
 */
export async function createEmbedding(
  text: string,
  model: "text-embedding-3-small" | "text-embedding-3-large" = "text-embedding-3-small"
): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model,
    input: text,
  });

  return response.data[0].embedding;
}
