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
      asset_edit_history: {
        Row: {
          asset_id: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_asset_id"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_check: string | null
          asset_condition: string | null
          asset_id: string
          asset_value_recovery: number | null
          assigned_date: string | null
          assigned_to: string | null
          brand: string
          configuration: string | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          far_code: string | null
          id: string
          location: string
          name: string
          provider: string | null
          received_by: string | null
          recovery_amount: number | null
          remarks: string | null
          return_date: string | null
          serial_number: string
          status: string
          type: string
          updated_at: string
          updated_by: string | null
          warranty_end: string | null
          warranty_start: string | null
          warranty_status: string | null
        }
        Insert: {
          asset_check?: string | null
          asset_condition?: string | null
          asset_id: string
          asset_value_recovery?: number | null
          assigned_date?: string | null
          assigned_to?: string | null
          brand: string
          configuration?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          far_code?: string | null
          id?: string
          location: string
          name: string
          provider?: string | null
          received_by?: string | null
          recovery_amount?: number | null
          remarks?: string | null
          return_date?: string | null
          serial_number: string
          status?: string
          type: string
          updated_at?: string
          updated_by?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
          warranty_status?: string | null
        }
        Update: {
          asset_check?: string | null
          asset_condition?: string | null
          asset_id?: string
          asset_value_recovery?: number | null
          assigned_date?: string | null
          assigned_to?: string | null
          brand?: string
          configuration?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          far_code?: string | null
          id?: string
          location?: string
          name?: string
          provider?: string | null
          received_by?: string | null
          recovery_amount?: number | null
          remarks?: string | null
          return_date?: string | null
          serial_number?: string
          status?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
          warranty_status?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_id: string
          employee_name: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_id: string
          employee_name: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          employee_name?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_comments: string | null
          asset_condition: string | null
          asset_id: string
          assign_to: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          employee_email: string | null
          employee_id: string | null
          id: string
          new_location: string | null
          new_status: string | null
          original_assigned_to: string | null
          original_employee_id: string | null
          received_by: string | null
          rejection_reason: string | null
          request_type: string
          requested_at: string
          requested_by: string
          return_location: string | null
          return_remarks: string | null
          return_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comments?: string | null
          asset_condition?: string | null
          asset_id: string
          assign_to?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          employee_email?: string | null
          employee_id?: string | null
          id?: string
          new_location?: string | null
          new_status?: string | null
          original_assigned_to?: string | null
          original_employee_id?: string | null
          received_by?: string | null
          rejection_reason?: string | null
          request_type: string
          requested_at?: string
          requested_by: string
          return_location?: string | null
          return_remarks?: string | null
          return_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comments?: string | null
          asset_condition?: string | null
          asset_id?: string
          assign_to?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          employee_email?: string | null
          employee_id?: string | null
          id?: string
          new_location?: string | null
          new_status?: string | null
          original_assigned_to?: string | null
          original_employee_id?: string | null
          received_by?: string | null
          rejection_reason?: string | null
          request_type?: string
          requested_at?: string
          requested_by?: string
          return_location?: string | null
          return_remarks?: string | null
          return_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_requests_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          role?: string | null
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
