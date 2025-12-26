/**
 * Supabase Database Type Definitions
 *
 * 이 파일은 프론트엔드에서 사용할 데이터베이스 타입을 정의합니다.
 * Supabase 클라이언트와 함께 사용하여 타입 안전성을 보장합니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Relationships: []
      }
      saju_charts: {
        Row: {
          id: string
          owner_id: string
          name: string
          gender: string | null
          birth_date: string
          birth_hour: number | null
          input_json: Json | null
          result_json: Json | null
          is_locked: boolean
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          gender?: string | null
          birth_date: string
          birth_hour?: number | null
          input_json?: Json | null
          result_json?: Json | null
          is_locked?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          gender?: string | null
          birth_date?: string
          birth_hour?: number | null
          input_json?: Json | null
          result_json?: Json | null
          is_locked?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saju_charts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      entitlements: {
        Row: {
          id: string
          owner_id: string
          product_type: string
          status: string
          bound_chart_id: string | null
          linked_payment_id: string | null
          parent_entitlement_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          product_type: string
          status?: string
          bound_chart_id?: string | null
          linked_payment_id?: string | null
          parent_entitlement_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          product_type?: string
          status?: string
          bound_chart_id?: string | null
          linked_payment_id?: string | null
          parent_entitlement_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_bound_chart_id_fkey"
            columns: ["bound_chart_id"]
            isOneToOne: false
            referencedRelation: "saju_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_parent_entitlement_id_fkey"
            columns: ["parent_entitlement_id"]
            isOneToOne: false
            referencedRelation: "entitlements"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          owner_id: string
          entitlement_id: string | null
          report_id: string | null
          summary_mode: string | null
          session_summary_structured: Json | null
          session_summary_text: string | null
          summary_fail_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          entitlement_id?: string | null
          report_id?: string | null
          summary_mode?: string | null
          session_summary_structured?: Json | null
          session_summary_text?: string | null
          summary_fail_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          entitlement_id?: string | null
          report_id?: string | null
          summary_mode?: string | null
          session_summary_structured?: Json | null
          session_summary_text?: string | null
          summary_fail_streak?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "entitlements"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          owner_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          meta: Json | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          owner_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          meta?: Json | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          owner_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          meta?: Json | null
          idempotency_key?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_summaries: {
        Row: {
          id: string
          session_id: string
          summary_json: Json | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          summary_json?: Json | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          summary_json?: Json | null
          embedding?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_summaries: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          search_user_id: string
        }
        Returns: {
          id: string
          session_id: string
          summary_json: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Helper Types - 편의를 위한 타입 별칭
// ============================================================================

type PublicSchema = Database["public"]

export type Tables<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Update"]

export type Functions<
  FunctionName extends keyof PublicSchema["Functions"]
> = PublicSchema["Functions"][FunctionName]

// ============================================================================
// Convenience Type Exports - 자주 사용되는 타입 직접 export
// ============================================================================

// Row Types (조회 시 반환되는 전체 데이터)
export type Profile = Tables<"profiles">
export type SajuChart = Tables<"saju_charts">
export type Entitlement = Tables<"entitlements">
export type ChatSession = Tables<"chat_sessions">
export type ChatMessage = Tables<"chat_messages">
export type ChatSummary = Tables<"chat_summaries">

// Insert Types (새 데이터 삽입 시 사용)
export type ProfileInsert = TablesInsert<"profiles">
export type SajuChartInsert = TablesInsert<"saju_charts">
export type EntitlementInsert = TablesInsert<"entitlements">
export type ChatSessionInsert = TablesInsert<"chat_sessions">
export type ChatMessageInsert = TablesInsert<"chat_messages">
export type ChatSummaryInsert = TablesInsert<"chat_summaries">

// Update Types (데이터 수정 시 사용)
export type ProfileUpdate = TablesUpdate<"profiles">
export type SajuChartUpdate = TablesUpdate<"saju_charts">
export type EntitlementUpdate = TablesUpdate<"entitlements">
export type ChatSessionUpdate = TablesUpdate<"chat_sessions">
export type ChatMessageUpdate = TablesUpdate<"chat_messages">
export type ChatSummaryUpdate = TablesUpdate<"chat_summaries">

// Function Types
export type MatchSummariesArgs = Functions<"match_summaries">["Args"]
export type MatchSummariesReturn = Functions<"match_summaries">["Returns"]

// Role Types
export type UserRole = Profile["role"]
export type MessageRole = ChatMessage["role"]
