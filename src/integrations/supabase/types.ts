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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          ai_settings: Json | null
          created_at: string
          global_prompt: string
          id: string
          name: string
          post_type: string | null
          scheduling_config: Json | null
          site_id: string
          status: string
          target_categories: Json | null
          thumbnail_prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_settings?: Json | null
          created_at?: string
          global_prompt: string
          id?: string
          name: string
          post_type?: string | null
          scheduling_config?: Json | null
          site_id: string
          status?: string
          target_categories?: Json | null
          thumbnail_prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_settings?: Json | null
          created_at?: string
          global_prompt?: string
          id?: string
          name?: string
          post_type?: string | null
          scheduling_config?: Json | null
          site_id?: string
          status?: string
          target_categories?: Json | null
          thumbnail_prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          campaign_id: string
          category_name: string | null
          content: string | null
          created_at: string
          error_message: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          scheduled_for: string | null
          site_id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          wordpress_media_id: number | null
          wordpress_post_id: number | null
        }
        Insert: {
          campaign_id: string
          category_name?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          site_id: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          wordpress_media_id?: number | null
          wordpress_post_id?: number | null
        }
        Update: {
          campaign_id?: string
          category_name?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          site_id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          wordpress_media_id?: number | null
          wordpress_post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_sites: {
        Row: {
          auth_type: string
          categories_count: number | null
          created_at: string
          error_message: string | null
          id: string
          last_sync: string | null
          name: string
          password_encrypted: string
          posts_count: number | null
          status: string
          updated_at: string
          url: string
          user_id: string
          username: string
        }
        Insert: {
          auth_type: string
          categories_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync?: string | null
          name: string
          password_encrypted: string
          posts_count?: number | null
          status?: string
          updated_at?: string
          url: string
          user_id: string
          username: string
        }
        Update: {
          auth_type?: string
          categories_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync?: string | null
          name?: string
          password_encrypted?: string
          posts_count?: number | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
          username?: string
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
