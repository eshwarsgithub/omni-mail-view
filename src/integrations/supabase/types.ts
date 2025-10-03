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
      attachments: {
        Row: {
          content_type: string | null
          created_at: string | null
          filename: string
          id: string
          message_id: string
          size_bytes: number | null
          storage_key: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          filename: string
          id?: string
          message_id: string
          size_bytes?: number | null
          storage_key?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          filename?: string
          id?: string
          message_id?: string
          size_bytes?: number | null
          storage_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: number
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_accounts: {
        Row: {
          auth_type: string
          created_at: string | null
          display_name: string | null
          email: string
          error_message: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_type: string
          created_at?: string | null
          display_name?: string | null
          email: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_type?: string
          created_at?: string | null
          display_name?: string | null
          email?: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          account_id: string
          body_html: string | null
          body_text: string | null
          cc_addresses: string[] | null
          created_at: string | null
          date: string | null
          from_address: string | null
          from_name: string | null
          has_attachments: boolean | null
          id: string
          is_read: boolean | null
          is_spam: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          message_id: string
          raw_storage_key: string | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: string[] | null
          user_id: string
        }
        Insert: {
          account_id: string
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          date?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          message_id: string
          raw_storage_key?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          user_id: string
        }
        Update: {
          account_id?: string
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          date?: string | null
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_spam?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          message_id?: string
          raw_storage_key?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string | null
          account_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      threads: {
        Row: {
          created_at: string | null
          first_message_date: string | null
          id: string
          last_message_date: string | null
          message_count: number | null
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_message_date?: string | null
          id?: string
          last_message_date?: string | null
          message_count?: number | null
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_message_date?: string | null
          id?: string
          last_message_date?: string | null
          message_count?: number | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
