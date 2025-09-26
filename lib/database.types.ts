// Database types for TypeScript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
        username: string
          public_key: string | null
        custom_prompt: string | null
        openrouter_api_key: string | null
        ai_filter_enabled: boolean
        ai_reviewer_enabled: boolean
        auto_delete_mean: boolean
          feedback_note: string | null
          context_proof_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
        email: string
        username: string
          public_key?: string | null
        custom_prompt?: string | null
        openrouter_api_key?: string | null
        ai_filter_enabled?: boolean
        ai_reviewer_enabled?: boolean
        auto_delete_mean?: boolean
          feedback_note?: string | null
          context_proof_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
        email?: string
        username?: string
          public_key?: string | null
        custom_prompt?: string | null
        openrouter_api_key?: string | null
        ai_filter_enabled?: boolean
        ai_reviewer_enabled?: boolean
        auto_delete_mean?: boolean
          feedback_note?: string | null
          context_proof_enabled?: boolean
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          encrypted_content: string
          encrypted_reasoning: string
          encrypted_context: string | null
          is_mean: boolean
          status: 'unread' | 'read' | 'archived'
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_content: string
          encrypted_reasoning: string
          encrypted_context?: string | null
          is_mean: boolean
          status?: 'unread' | 'read' | 'archived'
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_content?: string
          encrypted_reasoning?: string
          encrypted_context?: string | null
          is_mean?: boolean
          status?: 'unread' | 'read' | 'archived'
          created_at?: string
          read_at?: string | null
        }
      }
      feedback_links: {
        Row: {
          id: string
          user_id: string
          share_token: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          share_token: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          share_token?: string
          is_active?: boolean
          created_at?: string
        }
      }
      scheduled_feedback: {
        Row: {
          id: string
          user_id: string
          encrypted_content: string
          encrypted_reasoning: string
          encrypted_context: string | null
          is_mean: boolean
          deliver_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_content: string
          encrypted_reasoning: string
          encrypted_context?: string | null
          is_mean?: boolean
          deliver_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_content?: string
          encrypted_reasoning?: string
          encrypted_context?: string | null
          is_mean?: boolean
          deliver_at?: string
          created_at?: string
        }
      }
    }
  }
}
