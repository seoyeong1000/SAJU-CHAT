/**
 * Supabase 데이터베이스 테이블 이름 상수
 * 하드코딩 방지를 위해 모든 테이블 이름을 여기서 관리합니다.
 */

// ============================================
// 사용자 관련 테이블
// ============================================
export const TABLE_USERS = 'users' as const
export const TABLE_PROFILES = 'profiles' as const

// ============================================
// 사주/명식 관련 테이블
// ============================================
export const TABLE_SAJU_CHARTS = 'saju_charts' as const
export const TABLE_SAJU_RESULTS = 'saju_results' as const
export const TABLE_BAZI_SAVED_RESULTS = 'bazi_saved_results' as const
export const TABLE_CHART_ANALYSIS_RESULTS = 'chart_analysis_results' as const

// ============================================
// 마스터 데이터 테이블 (Seed 데이터)
// ============================================
export const TABLE_INTERPRETATION_BASE = 'interpretation_base' as const
export const TABLE_SOLUTION_ACTION = 'solution_action' as const
export const TABLE_CONVERSATION_SCRIPT = 'conversation_script' as const
export const TABLE_PERSONA_VIBE_HOOK = 'persona_vibe_hook' as const

// 레거시 마스터 테이블 (필요시 사용)
export const TABLE_MASTER_LOGIC_DEFINITIONS = 'master_logic_definitions' as const
export const TABLE_MASTER_INTERPRETATIONS = 'master_interpretations' as const
export const TABLE_MASTER_SOLUTIONS = 'master_solutions' as const
export const TABLE_MASTER_PERSONA_VIBE = 'master_persona_vibe' as const

// ============================================
// 상업/권한 관련 테이블 (Commerce)
// ============================================
export const TABLE_ENTITLEMENTS = 'entitlements' as const
export const TABLE_CREDIT_LOGS = 'credit_logs' as const
export const TABLE_INTERPRETATION_REPORTS = 'interpretation_reports' as const

// ============================================
// 채팅 관련 테이블
// ============================================
export const TABLE_CHAT_SESSIONS = 'chat_sessions' as const
export const TABLE_CHAT_MESSAGES = 'chat_messages' as const
export const TABLE_MESSAGES = 'messages' as const // 레거시 채팅 테이블

// ============================================
// 천문 계산 관련 테이블 (Astro)
// ============================================
export const TABLE_ASTRO_REQUEST = 'astro_request' as const
export const TABLE_ASTRO_RESULT = 'astro_result' as const
export const TABLE_ASTRO_ERROR_LOG = 'astro_error_log' as const

// ============================================
// 그룹화된 상수 객체
// ============================================
export const DB_TABLES = {
  // 사용자
  users: TABLE_USERS,
  profiles: TABLE_PROFILES,

  // 사주/명식
  sajuCharts: TABLE_SAJU_CHARTS,
  sajuResults: TABLE_SAJU_RESULTS,
  baziSavedResults: TABLE_BAZI_SAVED_RESULTS,
  chartAnalysisResults: TABLE_CHART_ANALYSIS_RESULTS,

  // 마스터 데이터 (v3 - 주요 4개 테이블)
  interpretationBase: TABLE_INTERPRETATION_BASE,
  solutionAction: TABLE_SOLUTION_ACTION,
  conversationScript: TABLE_CONVERSATION_SCRIPT,
  personaVibeHook: TABLE_PERSONA_VIBE_HOOK,

  // 상업/권한
  entitlements: TABLE_ENTITLEMENTS,
  creditLogs: TABLE_CREDIT_LOGS,
  interpretationReports: TABLE_INTERPRETATION_REPORTS,

  // 채팅
  chatSessions: TABLE_CHAT_SESSIONS,
  chatMessages: TABLE_CHAT_MESSAGES,

  // 천문 계산
  astroRequest: TABLE_ASTRO_REQUEST,
  astroResult: TABLE_ASTRO_RESULT,
  astroErrorLog: TABLE_ASTRO_ERROR_LOG,
} as const

// 타입 추출
export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES]
