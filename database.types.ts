export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      astro_error_log: {
        Row: {
          created_at: string
          error_message: string
          id: string
          request_id: string | null
          stack: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          request_id?: string | null
          stack?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          request_id?: string | null
          stack?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "astro_error_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "astro_request"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_request: {
        Row: {
          created_at: string
          id: string
          input_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          input_json: Json
        }
        Update: {
          created_at?: string
          id?: string
          input_json?: Json
        }
        Relationships: []
      }
      astro_result: {
        Row: {
          created_at: string
          engine_type: string
          id: string
          output_json: Json
          request_id: string
        }
        Insert: {
          created_at?: string
          engine_type: string
          id?: string
          output_json: Json
          request_id: string
        }
        Update: {
          created_at?: string
          engine_type?: string
          id?: string
          output_json?: Json
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_result_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "astro_request"
            referencedColumns: ["id"]
          },
        ]
      }
      bazi_saved_results: {
        Row: {
          clerk_id: string
          created_at: string
          id: string
          payload: Json
          source_action: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          id?: string
          payload: Json
          source_action: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          id?: string
          payload?: Json
          source_action?: string
        }
        Relationships: []
      }
      chart_analysis_results: {
        Row: {
          chart_id: string
          created_at: string
          id: string
          logic_keys: string[]
          owner_id: string
          ruleset_version: string
          summary: Json
          updated_at: string
        }
        Insert: {
          chart_id: string
          created_at?: string
          id?: string
          logic_keys?: string[]
          owner_id: string
          ruleset_version?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          chart_id?: string
          created_at?: string
          id?: string
          logic_keys?: string[]
          owner_id?: string
          ruleset_version?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_analysis_results_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "bazi_saved_results"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          ref_data: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          ref_data?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          ref_data?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chart_id: string
          created_at: string
          current_topic: string | null
          id: string
          last_verdict: Json | null
          result_id: string
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_id: string
          created_at?: string
          current_topic?: string | null
          id?: string
          last_verdict?: Json | null
          result_id: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_id?: string
          created_at?: string
          current_topic?: string | null
          id?: string
          last_verdict?: Json | null
          result_id?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_sessions_chart"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "saju_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_sessions_result"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "saju_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_script: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lang: string
          message: string
          metadata: Json | null
          role: string
          script_id: string
          step: number
          variant_type: string | null
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lang?: string
          message: string
          metadata?: Json | null
          role: string
          script_id: string
          step: number
          variant_type?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lang?: string
          message?: string
          metadata?: Json | null
          role?: string
          script_id?: string
          step?: number
          variant_type?: string | null
          version?: number
        }
        Relationships: []
      }
      master_interpretations: {
        Row: {
          content: string | null
          created_at: string
          domain: string
          example_scenario: string | null
          ext_id: string
          id: string
          is_active: boolean
          lang: string
          layer: string | null
          logic_key: string
          priority: number | null
          script_id: string | null
          source_ref: string | null
          subdomain: string | null
          title: string | null
          trust_level: string | null
          variant_type: string | null
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          domain: string
          example_scenario?: string | null
          ext_id: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key: string
          priority?: number | null
          script_id?: string | null
          source_ref?: string | null
          subdomain?: string | null
          title?: string | null
          trust_level?: string | null
          variant_type?: string | null
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          domain?: string
          example_scenario?: string | null
          ext_id?: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key?: string
          priority?: number | null
          script_id?: string | null
          source_ref?: string | null
          subdomain?: string | null
          title?: string | null
          trust_level?: string | null
          variant_type?: string | null
          version?: number
        }
        Relationships: []
      }
      master_logic_definitions: {
        Row: {
          calc_params: Json | null
          calc_type: string | null
          category: string | null
          conflict_group: string | null
          created_at: string
          desc_core: string | null
          domain: string
          id: string
          is_active: boolean
          lang: string
          logic_key: string
          name_ko: string | null
          subdomain: string | null
          version: number
        }
        Insert: {
          calc_params?: Json | null
          calc_type?: string | null
          category?: string | null
          conflict_group?: string | null
          created_at?: string
          desc_core?: string | null
          domain: string
          id?: string
          is_active?: boolean
          lang?: string
          logic_key: string
          name_ko?: string | null
          subdomain?: string | null
          version?: number
        }
        Update: {
          calc_params?: Json | null
          calc_type?: string | null
          category?: string | null
          conflict_group?: string | null
          created_at?: string
          desc_core?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          lang?: string
          logic_key?: string
          name_ko?: string | null
          subdomain?: string | null
          version?: number
        }
        Relationships: []
      }
      master_persona_vibe: {
        Row: {
          context_key: string | null
          created_at: string
          domain: string
          ext_id: string
          id: string
          is_active: boolean
          lang: string
          layer: string | null
          logic_key: string | null
          persona_id: string | null
          source_ref: string | null
          subdomain: string | null
          text: string | null
          use_case: string | null
          version: number
        }
        Insert: {
          context_key?: string | null
          created_at?: string
          domain: string
          ext_id: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key?: string | null
          persona_id?: string | null
          source_ref?: string | null
          subdomain?: string | null
          text?: string | null
          use_case?: string | null
          version?: number
        }
        Update: {
          context_key?: string | null
          created_at?: string
          domain?: string
          ext_id?: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key?: string | null
          persona_id?: string | null
          source_ref?: string | null
          subdomain?: string | null
          text?: string | null
          use_case?: string | null
          version?: number
        }
        Relationships: []
      }
      master_solutions: {
        Row: {
          content: string | null
          created_at: string
          difficulty: string | null
          domain: string
          ext_id: string
          id: string
          is_active: boolean
          lang: string
          layer: string | null
          logic_key: string
          product_hint: Json | null
          requires_disclaimer: boolean
          script: string | null
          script_id: string | null
          severity: string | null
          source_ref: string | null
          subdomain: string | null
          time_required: string | null
          title: string | null
          type: string | null
          variant_type: string | null
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          difficulty?: string | null
          domain: string
          ext_id: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key: string
          product_hint?: Json | null
          requires_disclaimer?: boolean
          script?: string | null
          script_id?: string | null
          severity?: string | null
          source_ref?: string | null
          subdomain?: string | null
          time_required?: string | null
          title?: string | null
          type?: string | null
          variant_type?: string | null
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          difficulty?: string | null
          domain?: string
          ext_id?: string
          id?: string
          is_active?: boolean
          lang?: string
          layer?: string | null
          logic_key?: string
          product_hint?: Json | null
          requires_disclaimer?: boolean
          script?: string | null
          script_id?: string | null
          severity?: string | null
          source_ref?: string | null
          subdomain?: string | null
          time_required?: string | null
          title?: string | null
          type?: string | null
          variant_type?: string | null
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clerk_user_id: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saju_charts: {
        Row: {
          birth_date: string
          birth_time: string | null
          created_at: string
          gender: string
          id: string
          is_leap_month: boolean
          is_lunar: boolean
          lat: number | null
          lon: number | null
          name: string
          tzid: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_time?: string | null
          created_at?: string
          gender: string
          id?: string
          is_leap_month?: boolean
          is_lunar?: boolean
          lat?: number | null
          lon?: number | null
          name: string
          tzid?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_time?: string | null
          created_at?: string
          gender?: string
          id?: string
          is_leap_month?: boolean
          is_lunar?: boolean
          lat?: number | null
          lon?: number | null
          name?: string
          tzid?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saju_charts_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saju_results: {
        Row: {
          analysis_json: Json | null
          chart_id: string
          created_at: string
          engine_version: string
          id: string
          raw_json: Json
          updated_at: string
        }
        Insert: {
          analysis_json?: Json | null
          chart_id: string
          created_at?: string
          engine_version: string
          id?: string
          raw_json: Json
          updated_at?: string
        }
        Update: {
          analysis_json?: Json | null
          chart_id?: string
          created_at?: string
          engine_version?: string
          id?: string
          raw_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saju_results_chart"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "saju_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
