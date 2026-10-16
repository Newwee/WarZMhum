import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lgodorglbrkjifehulma.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_v88ms3tcf20pUC31i0oWUQ_mlfCWtVe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 20
);

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 15,
        },
      },
    });
  }
  return clientInstance;
}
