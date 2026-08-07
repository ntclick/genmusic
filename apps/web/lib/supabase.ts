import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

let globalSupabase: SupabaseClient<Database> | null = null;
let globalSupabaseAdmin: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  // Lazy load env vars to ensure they're available when called
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client cannot be initialized: missing environment variables.');
  }

  if (!globalSupabase) {
    globalSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return globalSupabase;
}

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  // Lazy load env vars to ensure they're available when called
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin client cannot be initialized: missing environment variables.');
  }

  if (!globalSupabaseAdmin) {
    globalSupabaseAdmin = createClient<Database>(
      supabaseUrl,
      serviceRoleKey
    );
  }
  return globalSupabaseAdmin;
}

// Remove the direct export of instances, components should call the functions
// export const supabase = getSupabaseClient()
// export const supabaseAdmin = getSupabaseAdminClient()
