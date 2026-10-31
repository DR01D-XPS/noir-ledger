export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          currency: string;
          display_currency: string;
          language: string;
          notifications_email: boolean;
          notifications_push: boolean;
          ai_enabled: boolean;
          ai_provider: "mock" | "openai";
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          currency?: string;
          display_currency?: string;
          language?: string;
          notifications_email?: boolean;
          notifications_push?: boolean;
          ai_enabled?: boolean;
          ai_provider?: "mock" | "openai";
          onboarding_completed?: boolean;
        };
        Update: {
          full_name?: string;
          currency?: string;
          display_currency?: string;
          language?: string;
          notifications_email?: boolean;
          notifications_push?: boolean;
          ai_enabled?: boolean;
          ai_provider?: "mock" | "openai";
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          kind: "income" | "expense" | "transfer" | "saving";
          color: string;
          icon: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          kind: "income" | "expense" | "transfer" | "saving";
          color?: string;
          icon?: string;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          kind?: "income" | "expense" | "transfer" | "saving";
          color?: string;
          icon?: string;
          is_default?: boolean;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          type: "income" | "expense" | "transfer" | "saving";
          amount: number;
          note: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          type: "income" | "expense" | "transfer" | "saving";
          amount: number;
          note?: string;
          date: string;
        };
        Update: {
          category_id?: string;
          type?: "income" | "expense" | "transfer" | "saving";
          amount?: number;
          note?: string;
          date?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount: number;
          deadline: string;
          color: string;
          icon: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount?: number;
          deadline: string;
          color?: string;
          icon?: string;
          note?: string;
        };
        Update: {
          title?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string;
          color?: string;
          icon?: string;
          note?: string;
        };
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          amount: number;
          note: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          amount: number;
          note?: string;
          date: string;
        };
        Update: {
          amount?: number;
          note?: string;
          date?: string;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          period: "week" | "month" | "long";
          title: string;
          message: string;
          recommendation: string;
          tone: "positive" | "warning" | "neutral";
          metric: string | null;
          summary: string | null;
          forecast: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period: "week" | "month" | "long";
          title: string;
          message: string;
          recommendation: string;
          tone: "positive" | "warning" | "neutral";
          metric?: string | null;
          summary?: string | null;
          forecast?: string | null;
        };
        Update: {
          period?: "week" | "month" | "long";
          title?: string;
          message?: string;
          recommendation?: string;
          tone?: "positive" | "warning" | "neutral";
          metric?: string | null;
          summary?: string | null;
          forecast?: string | null;
        };
        Relationships: [];
      };
      receipt_scans: {
        Row: {
          id: string;
          user_id: string;
          merchant: string;
          total: number;
          transaction_date: string;
          category_id: string;
          category_name: string;
          note: string;
          confidence: number;
          image_name: string;
          transaction_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant?: string;
          total: number;
          transaction_date: string;
          category_id: string;
          category_name: string;
          note?: string;
          confidence?: number;
          image_name?: string;
          transaction_id?: string | null;
        };
        Update: {
          merchant?: string;
          total?: number;
          transaction_date?: string;
          category_id?: string;
          category_name?: string;
          note?: string;
          confidence?: number;
          image_name?: string;
          transaction_id?: string | null;
        };
        Relationships: [];
      };
      ai_chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant";
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "user" | "assistant";
          message: string;
        };
        Update: {
          role?: "user" | "assistant";
          message?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
