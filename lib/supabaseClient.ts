import { createClient } from '@supabase/supabase-js';

// Gunakan fallback URL placeholder agar kompilasi 'next build' di Vercel tidak crash
// ketika Environment Variables sedang dimuat.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
