import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseConfig(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    
    if (savedUrl && savedKey) {
      return { url: savedUrl, key: savedKey };
    }
  }
  
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

export function createSupabaseClient(): SupabaseClient<Database> {
  const { url, key } = getSupabaseConfig();
  
  if (!url || !key) {
    console.warn('Supabase not configured. Running in local mode.');
  }
  
  return createClient<Database>(url || 'https://placeholder.supabase.co', key || 'placeholder-key');
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    return getSupabase()[prop as keyof SupabaseClient<Database>];
  },
});

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return !!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key');
}

export type { Database };
