import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { signSession, SESSION_DURATION_MS } from '@/lib/adminAuth';

// ─── Rate Limiter (In-Memory sebagai lapisan cepat pertama) ──────────────────
const loginAttempts = new Map<string, { count: number; lockUntil: number | null }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { locked: boolean; remaining: number; lockUntilMs: number | null } {
  const record = loginAttempts.get(ip) ?? { count: 0, lockUntil: null };

  // Reset jika lock sudah expired
  if (record.lockUntil && Date.now() >= record.lockUntil) {
    loginAttempts.set(ip, { count: 0, lockUntil: null });
    return { locked: false, remaining: MAX_ATTEMPTS, lockUntilMs: null };
  }

  if (record.lockUntil && Date.now() < record.lockUntil) {
    return { locked: true, remaining: 0, lockUntilMs: record.lockUntil };
  }

  return { locked: false, remaining: MAX_ATTEMPTS - record.count, lockUntilMs: null };
}

function recordFailure(ip: string): { locked: boolean; remaining: number } {
  const record = loginAttempts.get(ip) ?? { count: 0, lockUntil: null };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    loginAttempts.set(ip, record);
    return { locked: true, remaining: 0 };
  }

  loginAttempts.set(ip, record);
  return { locked: false, remaining: MAX_ATTEMPTS - record.count };
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Cek rate limit
  const rl = checkRateLimit(ip);
  if (rl.locked) {
    const mins = Math.ceil(((rl.lockUntilMs ?? 0) - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${mins} menit.`, locked: true },
      { status: 429 }
    );
  }

  // 2. Validasi CSRF — wajib ada header X-Requested-With
  const xrw = req.headers.get('x-requested-with');
  if (xrw !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Parse body
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '').trim();

  // 4. Validasi input dasar + panjang maksimal (anti injection)
  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
  }
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: 'Input tidak valid.' }, { status: 400 });
  }

  // 5. Ambil kredensial dari server (tidak pernah dikirim ke client)
  let activeEmail: string;
  let activePassword: string;

  try {
    const envEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
    const envPin = (process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || '').trim();

    const { data, error } = await supabase
      .from('settings')
      .select('pin_code, admin_email')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;

    activeEmail = (data?.admin_email || envEmail || '').toLowerCase().trim();
    activePassword = (data?.pin_code || envPin || '').trim();
  } catch (err) {
    console.error('[admin/login] Gagal fetch kredensial:', err);
    return NextResponse.json({ error: 'Gagal menghubungi server. Coba lagi.' }, { status: 503 });
  }

  if (!activeEmail || !activePassword) {
    return NextResponse.json({ error: 'Konfigurasi admin belum diatur.' }, { status: 500 });
  }

  // 6. Validasi kredensial — dilakukan SEPENUHNYA di server
  if (email !== activeEmail || password !== activePassword) {
    const { locked, remaining } = recordFailure(ip);

    if (locked) {
      return NextResponse.json(
        { error: 'Akses dikunci 15 menit karena terlalu banyak percobaan gagal.', locked: true },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Email atau password salah. Sisa percobaan: ${remaining}x`, remainingAttempts: remaining },
      { status: 401 }
    );
  }

  // 7. Login berhasil — reset rate limit & set HMAC-signed HttpOnly session cookie
  resetRateLimit(ip);

  const sessionToken = signSession(activeEmail);

  const response = NextResponse.json({ success: true, email: activeEmail });

  response.cookies.set('waroeng_admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });

  return response;
}

// ─── DELETE /api/admin/login (Logout) ────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  // Verifikasi CSRF untuk logout juga
  const xrw = req.headers.get('x-requested-with');
  if (xrw !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('waroeng_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
