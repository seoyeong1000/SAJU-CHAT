/**
 * @file chat.ts
 * @description 챗봇 API 타입 정의
 */

/**
 * 챗봇 API 요청 타입
 */
export type ChatMessageRequest = {
  message: string;
  chart_id: string; // UUID
  session_id: string; // UUID
};

/**
 * 챗봇 API 응답 타입
 */
export type ChatMessageResponse = {
  reply_text: string;
  meta: ChatMessageMeta;
};

/**
 * 챗봇 메시지 메타데이터
 */
export type ChatMessageMeta = {
  tone?: string; // 페르소나 톤 (예: "warm_sister")
  topic?: string; // 주제 (예: "love", "career", "health")
  severity?: "info" | "warning" | "critical"; // 심각도
  shareable_summary?: string; // 공유 가능한 요약
  is_premium_advice?: boolean; // 프리미엄 조언 여부
  cta?: ChatMessageCTA; // Call-to-Action
};

/**
 * Call-to-Action 타입
 */
export type ChatMessageCTA = {
  type: "open_report" | "upgrade" | "consult";
  target?: string; // 리포트 타겟 (예: "love")
  label: string; // 버튼 라벨
};

/**
 * n8n으로 전송하는 요청 타입
 */
export type N8NRequest = {
  message: string;
  chart_id: string;
  session_id: string;
  message_id: string; // Idempotency를 위한 고유 ID
  user_id: string; // Clerk user ID
};

