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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcement_recipients: {
        Row: {
          announcement_id: string
          id: string
          member_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          member_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_recipients_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          recipient_type: Database["public"]["Enums"]["recipient_type_enum"]
          sent_at: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_type?: Database["public"]["Enums"]["recipient_type_enum"]
          sent_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_type?: Database["public"]["Enums"]["recipient_type_enum"]
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: Database["public"]["Enums"]["document_access_enum"]
          file_type: string | null
          file_url: string
          id: string
          title: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["document_access_enum"]
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["document_access_enum"]
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_group_members: {
        Row: {
          group_id: string
          id: string
          is_booker: boolean
          member_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_booker?: boolean
          member_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_booker?: boolean
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "draw_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_group_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_groups: {
        Row: {
          created_at: string
          event_id: string
          group_number: number
          id: string
          start_tee: number | null
          tee_time: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          group_number: number
          id?: string
          start_tee?: number | null
          tee_time?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          group_number?: number
          id?: string
          start_tee?: number | null
          tee_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draw_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          course_layout: string
          created_at: string
          draw_generated_at: string | null
          draw_pdf_url: string | null
          event_date: string
          group_size: number
          id: string
          notes: string | null
          registration_closes: string | null
          scoring_format: Database["public"]["Enums"]["scoring_format_enum"]
          start_time: string
          tee_interval_mins: number
        }
        Insert: {
          course_layout: string
          created_at?: string
          draw_generated_at?: string | null
          draw_pdf_url?: string | null
          event_date: string
          group_size?: number
          id?: string
          notes?: string | null
          registration_closes?: string | null
          scoring_format?: Database["public"]["Enums"]["scoring_format_enum"]
          start_time: string
          tee_interval_mins?: number
        }
        Update: {
          course_layout?: string
          created_at?: string
          draw_generated_at?: string | null
          draw_pdf_url?: string | null
          event_date?: string
          group_size?: number
          id?: string
          notes?: string | null
          registration_closes?: string | null
          scoring_format?: Database["public"]["Enums"]["scoring_format_enum"]
          start_time?: string
          tee_interval_mins?: number
        }
        Relationships: []
      }
      members: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"]
          alt_phone: string | null
          committee: boolean
          created_at: string
          does_not_book: boolean
          email: string
          first_name: string
          first_tee_count: number
          games_played: number
          id: string
          is_active: boolean
          joined: string
          last_booker_date: string | null
          last_name: string
          login_name: string
          member_number: string
          phone: string | null
          status: string
          tenth_tee_count: number
          times_as_booker: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          alt_phone?: string | null
          committee?: boolean
          created_at?: string
          does_not_book?: boolean
          email: string
          first_name: string
          first_tee_count?: number
          games_played?: number
          id: string
          is_active?: boolean
          joined?: string
          last_booker_date?: string | null
          last_name: string
          login_name: string
          member_number: string
          phone?: string | null
          status?: string
          tenth_tee_count?: number
          times_as_booker?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          alt_phone?: string | null
          committee?: boolean
          created_at?: string
          does_not_book?: boolean
          email?: string
          first_name?: string
          first_tee_count?: number
          games_played?: number
          id?: string
          is_active?: boolean
          joined?: string
          last_booker_date?: string | null
          last_name?: string
          login_name?: string
          member_number?: string
          phone?: string | null
          status?: string
          tenth_tee_count?: number
          times_as_booker?: number
        }
        Relationships: []
      }
      playing_partners: {
        Row: {
          id: string
          member_id: string
          partner_id: string
          play_count: number
        }
        Insert: {
          id?: string
          member_id: string
          partner_id: string
          play_count?: number
        }
        Update: {
          id?: string
          member_id?: string
          partner_id?: string
          play_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "playing_partners_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playing_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      red_book: {
        Row: {
          event_id: string
          id: string
          member_id: string
          registered_at: string
        }
        Insert: {
          event_id: string
          id?: string
          member_id: string
          registered_at?: string
        }
        Update: {
          event_id?: string
          id?: string
          member_id?: string
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_book_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_book_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          actually_played: boolean
          entered_at: string
          entered_by: string | null
          event_id: string
          id: string
          member_id: string
          score: number | null
        }
        Insert: {
          actually_played?: boolean
          entered_at?: string
          entered_by?: string | null
          event_id: string
          id?: string
          member_id: string
          score?: number | null
        }
        Update: {
          actually_played?: boolean
          entered_at?: string
          entered_by?: string | null
          event_id?: string
          id?: string
          member_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_access_level: { Args: never; Returns: string }
      increment_play_count: {
        Args: { p_member_id: string; p_partner_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_rundown_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      access_level_enum: "admin" | "rundown" | "member"
      document_access_enum: "all" | "rundown" | "admin"
      recipient_type_enum: "all" | "specific"
      scoring_format_enum: "stableford" | "gross" | "net" | "par"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_level_enum: ["admin", "rundown", "member"],
      document_access_enum: ["all", "rundown", "admin"],
      recipient_type_enum: ["all", "specific"],
      scoring_format_enum: ["stableford", "gross", "net", "par"],
    },
  },
} as const
