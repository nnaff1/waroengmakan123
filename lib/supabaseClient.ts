import { createClient } from '@supabase/supabase-js';

// ⚠️ Jangan hardcode URL/key di sini. Set via environment variables:
// NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
// Lihat .env.example untuk panduan.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Di development, beri peringatan jelas
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[supabaseClient] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset di .env.local'
    );
  }
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Export untuk kompatibilitas backward dengan file yang masih import constant ini
export const DEFAULT_SUPABASE_URL = supabaseUrl || '';
export const DEFAULT_SUPABASE_ANON_KEY = supabaseAnonKey || '';
