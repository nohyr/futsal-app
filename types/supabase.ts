export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          kakao_id: string;
          name: string;
          profile_image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          kakao_id: string;
          name: string;
          profile_image?: string | null;
        };
        Update: {
          name?: string;
          profile_image?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string;
          logo: string | null;
          invite_code: string;
          home_ground: string;
          founded_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          logo?: string | null;
          invite_code: string;
          home_ground?: string;
          founded_date?: string;
        };
        Update: {
          name?: string;
          description?: string;
          logo?: string | null;
          home_ground?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          role: string;
          number: number;
          position: string;
          goals: number;
          assists: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          role?: string;
          number?: number;
          position?: string;
        };
        Update: {
          role?: string;
          number?: number;
          position?: string;
          goals?: number;
          assists?: number;
        };
      };
      posts: {
        Row: {
          id: string;
          team_id: string;
          author_id: string;
          type: string;
          title: string;
          content: string;
          video_url: string | null;
          thumbnail_url: string | null;
          video_duration: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          author_id: string;
          type: string;
          title: string;
          content: string;
          video_url?: string | null;
          thumbnail_url?: string | null;
          video_duration?: string | null;
        };
        Update: {
          title?: string;
          content?: string;
          video_url?: string | null;
          thumbnail_url?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: never;
      };
      schedules: {
        Row: {
          id: string;
          team_id: string;
          type: string;
          date: string;
          time: string;
          location: string;
          opponent: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          type: string;
          date: string;
          time: string;
          location: string;
          opponent?: string | null;
          description?: string | null;
        };
        Update: {
          type?: string;
          date?: string;
          time?: string;
          location?: string;
          opponent?: string | null;
          description?: string | null;
        };
      };
      attendances: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          user_id: string;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      notices: {
        Row: {
          id: string;
          team_id: string;
          author_id: string;
          title: string;
          content: string;
          category: string;
          is_pinned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          author_id: string;
          title: string;
          content: string;
          category?: string;
          is_pinned?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          is_pinned?: boolean;
        };
      };
      records: {
        Row: {
          id: string;
          team_id: string;
          type: string;
          title: string;
          date: string;
          location: string;
          opponent: string | null;
          our_score: number | null;
          their_score: number | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          type: string;
          title: string;
          date: string;
          location: string;
          opponent?: string | null;
          our_score?: number | null;
          their_score?: number | null;
          memo?: string | null;
        };
        Update: {
          title?: string;
          date?: string;
          location?: string;
          opponent?: string | null;
          our_score?: number | null;
          their_score?: number | null;
          memo?: string | null;
        };
      };
    };
  };
}
