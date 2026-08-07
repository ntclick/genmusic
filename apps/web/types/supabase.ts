export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ringtones: {
        Row: {
          ringtone_id: number
          title: string
          slug: string
          artist: string
          description: string | null
          duration_seconds: number
          file_size_kb: number | null
          file_url_mp3: string | null
          file_url_m4r: string | null
          file_url_wav: string | null
          file_url_flac: string | null
          artwork_url: string | null
          waveform_data: Json | null
          category_id: number | null
          uploaded_by: number | null
          upload_source: string | null
          play_count: number
          download_count: number
          like_count: number
          view_count: number
          rating_avg: number
          rating_count: number
          is_featured: boolean
          is_trending: boolean
          is_active: boolean
          moderation_status: string
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          created_at: string
          updated_at: string
          published_at: string | null
          r2_bucket_name: string | null
          r2_original_key: string | null
          r2_processed_keys: Json | null
          file_checksums: Json | null
          total_storage_kb: number | null
        }
        Insert: {
          ringtone_id?: number
          title: string
          slug: string
          artist?: string
          description?: string | null
          duration_seconds?: number
          file_size_kb?: number | null
          file_url_mp3?: string | null
          file_url_m4r?: string | null
          file_url_wav?: string | null
          file_url_flac?: string | null
          artwork_url?: string | null
          waveform_data?: Json | null
          category_id?: number | null
          uploaded_by?: number | null
          upload_source?: string | null
          play_count?: number
          download_count?: number
          like_count?: number
          view_count?: number
          rating_avg?: number
          rating_count?: number
          is_featured?: boolean
          is_trending?: boolean
          is_active?: boolean
          moderation_status?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          r2_bucket_name?: string | null
          r2_original_key?: string | null
          r2_processed_keys?: Json | null
          file_checksums?: Json | null
          total_storage_kb?: number | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          artist?: string
          description?: string | null
          duration?: number
          download_count?: number
          play_count?: number
          like_count?: number
          rating_avg?: number
          rating_count?: number
          is_active?: boolean
          processing_status?: string
          is_trending?: boolean
          category_id?: number | null
          uploader_id?: string | null
          upload_source?: string | null
          external_id?: string | null
          r2_bucket_name?: string | null
          r2_original_key?: string | null
          r2_processed_keys?: Json | null
          file_checksums?: Json | null
          total_storage_kb?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ringtones_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ringtones_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          category_id: number
          category_name: string
          category_slug: string
          icon_emoji: string | null
          description: string | null
          parent_category_id: number | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          category_id?: number
          category_name: string
          category_slug: string
          icon_emoji?: string | null
          description?: string | null
          parent_category_id?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: number
          category_name?: string
          category_slug?: string
          icon_emoji?: string | null
          description?: string | null
          parent_category_id?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          }
        ]
      }
      trending_cache: {
        Row: {
          cache_id: number
          ringtone_id: number
          time_period: string
          rank_position: number
          trending_score: number | null
          last_updated: string
        }
        Insert: {
          cache_id?: number
          ringtone_id: number
          time_period: string
          rank_position: number
          trending_score?: number | null
          last_updated?: string
        }
        Update: {
          cache_id?: number
          ringtone_id?: number
          time_period?: string
          rank_position?: number
          trending_score?: number | null
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "trending_cache_ringtone_id_fkey"
            columns: ["ringtone_id"]
            isOneToOne: false
            referencedRelation: "ringtones"
            referencedColumns: ["ringtone_id"]
          }
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          review_id: number
          ringtone_id: number
          user_id: number | null
          username: string | null
          rating: number | null
          review_text: string | null
          is_verified_purchase: boolean | null
          helpful_count: number | null
          is_approved: boolean | null
          is_flagged: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          review_id?: number
          ringtone_id: number
          user_id?: number | null
          username?: string | null
          rating?: number | null
          review_text?: string | null
          is_verified_purchase?: boolean | null
          helpful_count?: number | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          review_id?: number
          ringtone_id?: number
          user_id?: number | null
          username?: string | null
          rating?: number | null
          review_text?: string | null
          is_verified_purchase?: boolean | null
          helpful_count?: number | null
          is_approved?: boolean | null
          is_flagged?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ringtone_id_fkey"
            columns: ["ringtone_id"]
            isOneToOne: false
            referencedRelation: "ringtones"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          email_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: string
          email_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          email_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: string
          filename: string
          size: number
          mime_type: string
          r2_key: string
          status: string
          user_id: string | null
          ringtone_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filename: string
          size: number
          mime_type: string
          r2_key: string
          status?: string
          user_id?: string | null
          ringtone_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filename?: string
          size?: number
          mime_type?: string
          r2_key?: string
          status?: string
          user_id?: string | null
          ringtone_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_ringtone_id_fkey"
            columns: ["ringtone_id"]
            isOneToOne: false
            referencedRelation: "ringtones"
            referencedColumns: ["id"]
          }
        ]
      }
      _ringtones_tags: {
        Row: {
          ringtone_id: string
          tag_id: number
        }
        Insert: {
          ringtone_id: string
          tag_id: number
        }
        Update: {
          ringtone_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "_ringtones_tags_ringtone_id_fkey"
            columns: ["ringtone_id"]
            isOneToOne: false
            referencedRelation: "ringtones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_ringtones_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_download_count: {
        Args: { p_ringtone_id: string }
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
