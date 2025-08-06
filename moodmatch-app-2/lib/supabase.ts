import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
export interface Favorite {
  id: string
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  movie_tmdb_id: number
  movie_type: 'movie' | 'series'
  movie_rating: number
  movie_description: string | null
  created_at: string
}

export interface User {
  id: string
  email?: string
}
