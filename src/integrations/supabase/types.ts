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
      campaign_analytics: {
        Row: {
          avg_time_on_page: number | null
          campaign_id: string
          created_at: string
          date: string
          id: string
          posts_created: number | null
          posts_published: number | null
          total_engagement: number | null
          total_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_time_on_page?: number | null
          campaign_id: string
          created_at?: string
          date?: string
          id?: string
          posts_created?: number | null
          posts_published?: number | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_time_on_page?: number | null
          campaign_id?: string
          created_at?: string
          date?: string
          id?: string
          posts_created?: number | null
          posts_published?: number | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_schedule: {
        Row: {
          campaign_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          post_id: string | null
          retry_count: number | null
          scheduled_for: string
          status: string
          timezone: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          post_id?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string
          timezone?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          post_id?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string
          timezone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_schedule_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_settings: Json | null
          auto_publish_enabled: boolean | null
          bulk_generation_enabled: boolean | null
          campaign_timezone: string | null
          created_at: string
          end_date: string | null
          global_prompt: string
          id: string
          name: string
          post_type: string | null
          posts_per_period: number | null
          posts_to_generate: number | null
          publish_interval_hours: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          scheduling_config: Json | null
          site_id: string
          start_date: string | null
          status: string
          target_categories: Json | null
          thumbnail_prompt: string | null
          total_posts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_settings?: Json | null
          auto_publish_enabled?: boolean | null
          bulk_generation_enabled?: boolean | null
          campaign_timezone?: string | null
          created_at?: string
          end_date?: string | null
          global_prompt: string
          id?: string
          name: string
          post_type?: string | null
          posts_per_period?: number | null
          posts_to_generate?: number | null
          publish_interval_hours?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          scheduling_config?: Json | null
          site_id: string
          start_date?: string | null
          status?: string
          target_categories?: Json | null
          thumbnail_prompt?: string | null
          total_posts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_settings?: Json | null
          auto_publish_enabled?: boolean | null
          bulk_generation_enabled?: boolean | null
          campaign_timezone?: string | null
          created_at?: string
          end_date?: string | null
          global_prompt?: string
          id?: string
          name?: string
          post_type?: string | null
          posts_per_period?: number | null
          posts_to_generate?: number | null
          publish_interval_hours?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          scheduling_config?: Json | null
          site_id?: string
          start_date?: string | null
          status?: string
          target_categories?: Json | null
          thumbnail_prompt?: string | null
          total_posts?: number | null
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
      job_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          job_data: Json
          job_type: string
          max_attempts: number | null
          scheduled_for: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_data: Json
          job_type: string
          max_attempts?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_data?: Json
          job_type?: string
          max_attempts?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          created_at: string
          id: string
          kind: string
          prompt: string
          topic_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          prompt: string
          topic_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          prompt?: string
          topic_id?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          bounce_rate: number | null
          clicks: number | null
          comments: number | null
          created_at: string
          date: string
          id: string
          post_id: string
          shares: number | null
          time_on_page: number | null
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          bounce_rate?: number | null
          clicks?: number | null
          comments?: number | null
          created_at?: string
          date?: string
          id?: string
          post_id: string
          shares?: number | null
          time_on_page?: number | null
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          bounce_rate?: number | null
          clicks?: number | null
          comments?: number | null
          created_at?: string
          date?: string
          id?: string
          post_id?: string
          shares?: number | null
          time_on_page?: number | null
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
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
      projects: {
        Row: {
          brand_tone: string | null
          created_at: string
          default_model: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          wp_app_password_encrypted: string | null
          wp_site_url: string | null
          wp_user: string | null
        }
        Insert: {
          brand_tone?: string | null
          created_at?: string
          default_model?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          wp_app_password_encrypted?: string | null
          wp_site_url?: string | null
          wp_user?: string | null
        }
        Update: {
          brand_tone?: string | null
          created_at?: string
          default_model?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          wp_app_password_encrypted?: string | null
          wp_site_url?: string | null
          wp_user?: string | null
        }
        Relationships: []
      }
      source_snippets: {
        Row: {
          created_at: string
          id: string
          snippet: string
          title: string
          topic_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snippet: string
          title: string
          topic_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snippet?: string
          title?: string
          topic_id?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      title_generations: {
        Row: {
          created_at: string | null
          generation_metadata: Json | null
          id: string
          model_version: string | null
          prompt_used: string | null
          schedule_item_id: string | null
          title: string
          title_source: string
          title_version: number | null
        }
        Insert: {
          created_at?: string | null
          generation_metadata?: Json | null
          id?: string
          model_version?: string | null
          prompt_used?: string | null
          schedule_item_id?: string | null
          title: string
          title_source?: string
          title_version?: number | null
        }
        Update: {
          created_at?: string | null
          generation_metadata?: Json | null
          id?: string
          model_version?: string | null
          prompt_used?: string | null
          schedule_item_id?: string | null
          title?: string
          title_source?: string
          title_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "title_generations_schedule_item_id_fkey"
            columns: ["schedule_item_id"]
            isOneToOne: false
            referencedRelation: "campaign_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          audience: string
          created_at: string
          draft_markdown: string | null
          featured_image_url: string | null
          id: string
          length_words: number | null
          meta_description: string | null
          model_name: string | null
          outline_json: Json | null
          plagiarism_score: number | null
          project_id: string
          quality_score: number | null
          scheduled_at: string | null
          search_intent: string | null
          seo_title: string | null
          slug: string | null
          source_urls: string[] | null
          status: string
          target_keyword: string
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience: string
          created_at?: string
          draft_markdown?: string | null
          featured_image_url?: string | null
          id?: string
          length_words?: number | null
          meta_description?: string | null
          model_name?: string | null
          outline_json?: Json | null
          plagiarism_score?: number | null
          project_id: string
          quality_score?: number | null
          scheduled_at?: string | null
          search_intent?: string | null
          seo_title?: string | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string
          target_keyword: string
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          draft_markdown?: string | null
          featured_image_url?: string | null
          id?: string
          length_words?: number | null
          meta_description?: string | null
          model_name?: string | null
          outline_json?: Json | null
          plagiarism_score?: number | null
          project_id?: string
          quality_score?: number | null
          scheduled_at?: string | null
          search_intent?: string | null
          seo_title?: string | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string
          target_keyword?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      auto_publish_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
