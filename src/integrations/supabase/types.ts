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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievement_cards: {
        Row: {
          created_at: string
          created_by: string | null
          extra_heading: string
          extra_items: Json
          heading: string
          id: string
          items: Json
          published: boolean
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          extra_heading?: string
          extra_items?: Json
          heading?: string
          id?: string
          items?: Json
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          zone?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          extra_heading?: string
          extra_items?: Json
          heading?: string
          id?: string
          items?: Json
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          zone?: string
        }
        Relationships: []
      }
      commitments: {
        Row: {
          created_at: string
          created_by: string | null
          detail: string
          id: string
          list: string
          published: boolean
          sort_order: number
          status: string
          status_label: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          list: string
          published?: boolean
          sort_order?: number
          status?: string
          status_label?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detail?: string
          id?: string
          list?: string
          published?: boolean
          sort_order?: number
          status?: string
          status_label?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          published: boolean
          quote: string
          role: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          published?: boolean
          quote: string
          role?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          published?: boolean
          quote?: string
          role?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt: string
          archived: boolean
          caption: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          published: boolean
          sort_order: number
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          alt?: string
          archived?: boolean
          caption?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          alt?: string
          archived?: boolean
          caption?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          created_by: string | null
          href: string | null
          icon: string | null
          id: string
          label: string
          page_slug: string | null
          parent_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          href?: string | null
          icon?: string | null
          id?: string
          label: string
          page_slug?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          href?: string | null
          icon?: string | null
          id?: string
          label?: string
          page_slug?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          hero_alt: string
          hero_image_url: string | null
          id: string
          photos: Json
          published_at: string
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          hero_alt?: string
          hero_image_url?: string | null
          id?: string
          photos?: Json
          published_at?: string
          slug: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          hero_alt?: string
          hero_image_url?: string | null
          id?: string
          photos?: Json
          published_at?: string
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          alt: string
          completed_label: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          name: string
          night: boolean
          place: string
          published: boolean
          region: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt?: string
          completed_label?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name: string
          night?: boolean
          place?: string
          published?: boolean
          region?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt?: string
          completed_label?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name?: string
          night?: boolean
          place?: string
          published?: boolean
          region?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      signups: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          full_name: string
          handled: boolean
          handled_at: string | null
          handled_by: string | null
          id: string
          intent: string
          lga_ward: string
          message: string | null
          phone: string
          source: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email: string
          full_name: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          intent: string
          lga_ward: string
          message?: string | null
          phone: string
          source?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          full_name?: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          intent?: string
          lga_ward?: string
          message?: string | null
          phone?: string
          source?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          created_at: string
          created_by: string | null
          eyebrow: string
          hero_alt: string
          hero_image: string | null
          id: string
          intro: string
          sections: Json
          seo_description: string
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          eyebrow?: string
          hero_alt?: string
          hero_image?: string | null
          id?: string
          intro?: string
          sections?: Json
          seo_description?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          eyebrow?: string
          hero_alt?: string
          hero_image?: string | null
          id?: string
          intro?: string
          sections?: Json
          seo_description?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          created_by: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          full_name?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_staff_invite: { Args: never; Returns: string }
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: {
        Args: { p_code: string; p_full_name: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      list_staff: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          last_sign_in_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      remove_staff: { Args: { p_user_id: string }; Returns: undefined }
      set_staff_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      submit_signup: {
        Args: {
          p_consent?: boolean
          p_email: string
          p_full_name: string
          p_intent: string
          p_lga_ward: string
          p_message?: string
          p_phone: string
          p_source?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
