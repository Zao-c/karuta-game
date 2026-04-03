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
          display_name: string
          avatar: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name: string
          avatar?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          code: string
          host_id: string | null
          game_mode: number
          game_phase: number
          deck_type: string | null
          deck_cards: Json | null
          custom_cards: Json | null
          current_character_id: string | null
          current_quote: string | null
          turn_start_time: string | null
          paused: boolean
          paused_time_remaining: number
          created_at: string
          game_ended_at: string | null
        }
        Insert: {
          id?: string
          code: string
          host_id?: string | null
          game_mode?: number
          game_phase?: number
          deck_type?: string | null
          deck_cards?: Json | null
          custom_cards?: Json | null
          current_character_id?: string | null
          current_quote?: string | null
          turn_start_time?: string | null
          paused?: boolean
          paused_time_remaining?: number
          created_at?: string
          game_ended_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          host_id?: string | null
          game_mode?: number
          game_phase?: number
          deck_type?: string | null
          deck_cards?: Json | null
          custom_cards?: Json | null
          current_character_id?: string | null
          current_quote?: string | null
          turn_start_time?: string | null
          paused?: boolean
          paused_time_remaining?: number
          created_at?: string
          game_ended_at?: string | null
        }
      }
      room_players: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          name: string
          avatar: string | null
          is_host: boolean
          is_observer: boolean
          is_ready: boolean
          is_locked: boolean
          score: number
          combo: number
          max_combo: number
          correct_count: number
          wrong_count: number
          total_reaction_time: number
          seat_index: number
          deck: Json | null
          collected: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          name: string
          avatar?: string | null
          is_host?: boolean
          is_observer?: boolean
          is_ready?: boolean
          is_locked?: boolean
          score?: number
          combo?: number
          max_combo?: number
          correct_count?: number
          wrong_count?: number
          total_reaction_time?: number
          seat_index?: number
          deck?: Json | null
          collected?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          name?: string
          avatar?: string | null
          is_host?: boolean
          is_observer?: boolean
          is_ready?: boolean
          is_locked?: boolean
          score?: number
          combo?: number
          max_combo?: number
          correct_count?: number
          wrong_count?: number
          total_reaction_time?: number
          seat_index?: number
          deck?: Json | null
          collected?: Json | null
          created_at?: string
        }
      }
      pick_events: {
        Row: {
          id: string
          room_id: string
          player_id: string
          card_id: string
          is_correct: boolean
          reaction_time: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          card_id: string
          is_correct: boolean
          reaction_time: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          card_id?: string
          is_correct?: boolean
          reaction_time?: number
          created_at?: string
        }
      }
      decks: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          cards: Json
          is_public: boolean
          play_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          cards: Json
          is_public?: boolean
          play_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          cards?: Json
          is_public?: boolean
          play_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      song_libraries: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          songs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          songs: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          songs?: Json
          created_at?: string
          updated_at?: string
        }
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
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomPlayer = Database['public']['Tables']['room_players']['Row']
export type PickEvent = Database['public']['Tables']['pick_events']['Row']
export type Deck = Database['public']['Tables']['decks']['Row']
export type SongLibrary = Database['public']['Tables']['song_libraries']['Row']
