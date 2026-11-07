/**
 * lib/adminAuth.ts
 * Server-side only. Jangan import di komponen client.
 *
 * Menyediakan:
 * - signSession()   : buat session token HMAC-SHA256
 * - verifySession() : verifikasi & decode session token
 * - isAdminRequest(): helper cek session dari NextRequest
 */
import { createHmac } from 'crypto';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  // Fallback deterministik agar tidak undefined saat env belum diset
  // (di production WAJIB set env ADMIN_SESSION_SECRET)
  'wm123-fallback-secret-change-in-production';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

export interface SessionPayload {
  email: string;
  loginAt: number;
  expiresAt: number;
}

/**
 * Buat session token HMAC-SHA256.
 * Format: base64(payload).<hmac-hex>
 */
export function signSession(email: string): string {
  const payload: SessionPayload = {
    email,
    loginAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifikasi token dan kembalikan payload.
 * Throw jika token invalid, expired, atau tanda tangan tidak cocok.
 */
export function verifySession(token: string): SessionPayload {
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('Invalid token format');

  const [payloadB64, signature] = parts;
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');

  // Constant-time comparison untuk mencegah timing attack
  if (!timingSafeEqual(signature, expectedSig)) {
    throw new Error('Invalid token signature');
  }

  const payload: SessionPayload = JSON.parse(
    Buffer.from(payloadB64, 'base64url').toString('utf-8')
  );

  if (Date.now() > payload.expiresAt) {
    throw new Error('Token expired');
  }

  return payload;
}

/** Constant-time string comparison untuk mencegah timing side-channel attack */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Helper: cek apakah request punya session admin yang valid.
 * Gunakan di setiap API route yang perlu dilindungi.
 */
export function isAdminRequest(req: Request): boolean {
  try {
    // Ambil cookie dari header (kompatibel dengan NextRequest & Request)
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k.trim(), decodeURIComponent(v.join('='))];
      })
    );
    const token = cookies['waroeng_admin_session'];
    if (!token) return false;
    verifySession(token);
    return true;
  } catch {
    return false;
  }
}

export { SESSION_DURATION_MS };

