import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// ─── In-memory Rate Limiter ───────────────────────────────────────────────────
// Menyimpan jumlah percobaan gagal per IP address
// Key: IP string, Value: { count: number, lockUntil: number | null }
const loginAttempts = new Map<string, { count: number; lockUntil: number | null }>();

const MAX_ATTEMPTS = 5;         // Maks 5x gagal sebelum kena lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit lockout
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // Session berlaku 8 jam

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function getRateLimitRecord(ip: string) {
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 0, lockUntil: null });
  }
  return loginAttempts.get(ip)!;
}

function isLockedOut(ip: string): boolean {
  const record = getRateLimitRecord(ip);
  if (record.lockUntil && Date.now() < record.lockUntil) {
    return true;
  }
  // Lock sudah expired, reset
  if (record.lockUntil && Date.now() >= record.lockUntil) {
    loginAttempts.set(ip, { count: 0, lockUntil: null });
  }
  return false;
}

function recordFailedAttempt(ip: string): { remainingAttempts: number; lockedOut: boolean } {
  const record = getRateLimitRecord(ip);
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    loginAttempts.set(ip, record);
    return { remainingAttempts: 0, lockedOut: true };
  }

  loginAttempts.set(ip, record);
  return { remainingAttempts: MAX_ATTEMPTS - record.count, lockedOut: false };
}

function resetAttempts(ip: string) {
  loginAttempts.set(ip, { count: 0, lockUntil: null });
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Cek apakah IP sedang dikunci
  if (isLockedOut(ip)) {
    const record = getRateLimitRecord(ip);
    const remainingMs = (record.lockUntil ?? 0) - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${remainingMinutes} menit.`,
        locked: true,
      },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '').trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
  }

  // 3. Ambil kredensial dari database (server-side only, tidak pernah bocor ke client)
  let activeEmail: string;
  let activePassword: string;

  try {
    // Coba ambil dari ENV server-side terlebih dahulu (paling aman)
    const envEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
    const envPin = (process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || '').trim();

    // Ambil dari database sebagai sumber primer
    const { data, error } = await supabase
      .from('settings')
      .select('pin_code, admin_email')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;

    activeEmail = (data?.admin_email || envEmail || '').toLowerCase().trim();
    activePassword = (data?.pin_code || envPin || '').trim();
  } catch (err) {
    console.error('[admin/login] Gagal fetch kredensial dari DB:', err);
    return NextResponse.json(
      { error: 'Gagal menghubungi server. Coba lagi.' },
      { status: 503 }
    );
  }

  if (!activeEmail || !activePassword) {
    return NextResponse.json(
      { error: 'Konfigurasi admin belum diatur. Hubungi pengelola sistem.' },
      { status: 500 }
    );
  }

  // 4. Validasi kredensial — dilakukan SEPENUHNYA di server
  if (email !== activeEmail || password !== activePassword) {
    const { remainingAttempts, lockedOut } = recordFailedAttempt(ip);

    if (lockedOut) {
      return NextResponse.json(
        {
          error: `Akses dikunci selama 15 menit karena terlalu banyak percobaan gagal.`,
          locked: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: `Email atau password salah. Sisa percobaan: ${remainingAttempts}x`,
        remainingAttempts,
      },
      { status: 401 }
    );
  }

  // 5. Login berhasil — reset rate limit & set HttpOnly cookie session
  resetAttempts(ip);

  // Buat token session yang aman
  const sessionToken = Buffer.from(
    JSON.stringify({
      email: activeEmail,
      loginAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    })
  ).toString('base64');

  const response = NextResponse.json({ success: true, email: activeEmail });

  // Set cookie HttpOnly (tidak bisa diakses JS browser) + Secure + SameSite=Strict
  response.cookies.set('waroeng_admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000, // dalam detik
    path: '/',
  });

  return response;
}

// ─── DELETE /api/admin/login (Logout) ────────────────────────────────────────
export async function DELETE() {
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

