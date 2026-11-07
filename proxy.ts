import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || '0x7f9a8b1c4e2d';
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'wm123-fallback-secret-change-in-production';

/** Verifikasi HMAC session token (duplikasi ringan dari lib/adminAuth agar bisa jalan di Proxy) */
function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadB64, signature] = parts;
    const expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');

    // Constant-time comparison
    if (signature.length !== expectedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.email || !payload.expiresAt) return false;
    if (Date.now() > payload.expiresAt) return false;

    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPrefix = `/${ADMIN_SLUG}`;

  // Hanya lindungi route admin (page & api)
  if (!pathname.startsWith(adminPrefix)) {
    return NextResponse.next();
  }

  // Izinkan akses ke endpoint login (untuk proses login itu sendiri)
  if (pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('waroeng_admin_session')?.value;

  if (!isValidSession(sessionCookie)) {
    // Jika request ke API route → return 401 JSON (bukan redirect)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Jika request ke page → redirect ke halaman login admin
    const response = NextResponse.redirect(new URL(adminPrefix, request.url));
    if (sessionCookie) {
      response.cookies.set('waroeng_admin_session', '', { maxAge: 0, path: '/' });
    }
    return response;
  }

  // Session valid — inject header identitas admin ke request
  try {
    const [payloadB64] = sessionCookie!.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-email', decoded.email);
    requestHeaders.set('x-admin-authenticated', 'true');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
