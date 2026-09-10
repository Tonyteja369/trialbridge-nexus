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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
          org_id: string
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
          org_id: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          confidence: string
          created_at: string
          criteria_snapshot_at: string
          explanation: Json
          id: string
          match_score: number
          org_id: string
          participant_id: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          screened_protocol_version: string
          site_id: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          study_id: string
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          criteria_snapshot_at?: string
          explanation?: Json
          id?: string
          match_score?: number
          org_id: string
          participant_id: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screened_protocol_version?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          study_id: string
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          criteria_snapshot_at?: string
          explanation?: Json
          id?: string
          match_score?: number
          org_id?: string
          participant_id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screened_protocol_version?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          study_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          created_at: string
          document_version: string
          granted_at: string | null
          id: string
          org_id: string
          participant_id: string
          recorded_by: string | null
          revoked_at: string | null
          scope: string[]
          status: Database["public"]["Enums"]["consent_status"]
          study_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_version?: string
          granted_at?: string | null
          id?: string
          org_id: string
          participant_id: string
          recorded_by?: string | null
          revoked_at?: string | null
          scope?: string[]
          status?: Database["public"]["Enums"]["consent_status"]
          study_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_version?: string
          granted_at?: string | null
          id?: string
          org_id?: string
          participant_id?: string
          recorded_by?: string | null
          revoked_at?: string | null
          scope?: string[]
          status?: Database["public"]["Enums"]["consent_status"]
          study_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          org_id: string
          participant_id: string | null
          storage_path: string
          study_id: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: string
          id?: string
          org_id: string
          participant_id?: string | null
          storage_path?: string
          study_id?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          org_id?: string
          participant_id?: string | null
          storage_path?: string
          study_id?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_criteria: {
        Row: {
          attribute: string
          created_at: string
          hard: boolean
          id: string
          kind: string
          label: string
          operator: string
          org_id: string
          study_id: string
          value: Json
          weight: number
        }
        Insert: {
          attribute: string
          created_at?: string
          hard?: boolean
          id?: string
          kind?: string
          label: string
          operator: string
          org_id: string
          study_id: string
          value?: Json
          weight?: number
        }
        Update: {
          attribute?: string
          created_at?: string
          hard?: boolean
          id?: string
          kind?: string
          label?: string
          operator?: string
          org_id?: string
          study_id?: string
          value?: Json
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_criteria_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_criteria_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          idempotency_key: string
          job_type: string
          last_error: string
          max_attempts: number
          next_run_at: string
          org_id: string
          payload: Json
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          idempotency_key: string
          job_type: string
          last_error?: string
          max_attempts?: number
          next_run_at?: string
          org_id: string
          payload?: Json
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          job_type?: string
          last_error?: string
          max_attempts?: number
          next_run_at?: string
          org_id?: string
          payload?: Json
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_runs: {
        Row: {
          assignment: Json
          backend: string
          created_at: string
          created_by: string | null
          id: string
          method: string
          metrics: Json
          objective: number
          org_id: string
          qubo_size: number
          runtime_ms: number
          study_id: string
        }
        Insert: {
          assignment?: Json
          backend?: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          metrics?: Json
          objective?: number
          org_id: string
          qubo_size?: number
          runtime_ms?: number
          study_id: string
        }
        Update: {
          assignment?: Json
          backend?: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          metrics?: Json
          objective?: number
          org_id?: string
          qubo_size?: number
          runtime_ms?: number
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_runs_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          plan: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          plan?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          plan?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          age: number | null
          attributes: Json
          city: string
          code: string
          conditions: string[]
          contact_consent: boolean
          created_at: string
          display_name: string
          id: string
          medications: string[]
          org_id: string
          sex: string
          source: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          attributes?: Json
          city?: string
          code: string
          conditions?: string[]
          contact_consent?: boolean
          created_at?: string
          display_name?: string
          id?: string
          medications?: string[]
          org_id: string
          sex?: string
          source?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          attributes?: Json
          city?: string
          code?: string
          conditions?: string[]
          contact_consent?: boolean
          created_at?: string
          display_name?: string
          id?: string
          medications?: string[]
          org_id?: string
          sex?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          active: boolean
          city: string
          created_at: string
          id: string
          name: string
          org_id: string
          study_id: string | null
          weekly_capacity: number
        }
        Insert: {
          active?: boolean
          city?: string
          created_at?: string
          id?: string
          name: string
          org_id: string
          study_id?: string | null
          weekly_capacity?: number
        }
        Update: {
          active?: boolean
          city?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          study_id?: string | null
          weekly_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      studies: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          criteria_updated_at: string
          id: string
          org_id: string
          phase: string
          protocol_version: string
          sponsor: string
          status: Database["public"]["Enums"]["study_status"]
          summary: string
          target_enrollment: number
          therapeutic_area: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          criteria_updated_at?: string
          id?: string
          org_id: string
          phase?: string
          protocol_version?: string
          sponsor?: string
          status?: Database["public"]["Enums"]["study_status"]
          summary?: string
          target_enrollment?: number
          therapeutic_area?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          criteria_updated_at?: string
          id?: string
          org_id?: string
          phase?: string
          protocol_version?: string
          sponsor?: string
          status?: Database["public"]["Enums"]["study_status"]
          summary?: string
          target_enrollment?: number
          therapeutic_area?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          created_at: string
          detail: string
          due_at: string | null
          id: string
          org_id: string
          participant_id: string | null
          priority: string
          status: Database["public"]["Enums"]["task_status"]
          study_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          detail?: string
          due_at?: string | null
          id?: string
          org_id: string
          participant_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          study_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          detail?: string
          due_at?: string | null
          id?: string
          org_id?: string
          participant_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          study_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          id: string
          notes: string
          org_id: string
          participant_id: string
          scheduled_at: string
          site_id: string | null
          status: Database["public"]["Enums"]["visit_status"]
          study_id: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          org_id: string
          participant_id: string
          scheduled_at: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          study_id: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          org_id?: string
          participant_id?: string
          scheduled_at?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          study_id?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "investigator"
        | "coordinator"
        | "site_staff"
        | "sponsor"
        | "participant"
      candidate_status:
        | "suggested"
        | "under_review"
        | "contacted"
        | "consented"
        | "screen_failed"
        | "ineligible"
        | "enrolled"
        | "withdrawn"
      consent_status:
        | "not_started"
        | "sent"
        | "granted"
        | "declined"
        | "revoked"
        | "expired"
      job_status: "pending" | "processing" | "sent" | "failed" | "dead_letter"
      study_status: "draft" | "recruiting" | "active" | "paused" | "closed"
      task_status: "open" | "in_progress" | "done" | "blocked"
      visit_status: "scheduled" | "completed" | "missed" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "investigator",
        "coordinator",
        "site_staff",
        "sponsor",
        "participant",
      ],
      candidate_status: [
        "suggested",
        "under_review",
        "contacted",
        "consented",
        "screen_failed",
        "ineligible",
        "enrolled",
        "withdrawn",
      ],
      consent_status: [
        "not_started",
        "sent",
        "granted",
        "declined",
        "revoked",
        "expired",
      ],
      job_status: ["pending", "processing", "sent", "failed", "dead_letter"],
      study_status: ["draft", "recruiting", "active", "paused", "closed"],
      task_status: ["open", "in_progress", "done", "blocked"],
      visit_status: ["scheduled", "completed", "missed", "cancelled"],
    },
  },
} as const
