export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EditionStatus = 'open' | 'locked' | 'concluded';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      editions: {
        Row: {
          year: number;
          status: EditionStatus;
          votes_close_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          year: number;
          status?: EditionStatus;
          votes_close_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          year?: number;
          status?: EditionStatus;
          votes_close_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      edition_results: {
        Row: {
          year: number;
          category_id: string;
          winner_nominee_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          year: number;
          category_id: string;
          winner_nominee_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          year?: number;
          category_id?: string;
          winner_nominee_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          category_id: string;
          nominee_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          category_id: string;
          nominee_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          category_id?: string;
          nominee_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_community_votes_distribution: {
        Args: {
          p_year: number;
        };
        Returns: {
          category_id: string;
          nominee_id: string;
          total_votes: number;
        }[];
      };
      get_leaderboard: {
        Args: {
          p_year: number;
        };
        Returns: {
          rank: number;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          correct_picks: number;
          total_picks: number;
          accuracy: number;
        }[];
      };
    };
    Enums: {
      edition_status: EditionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
