import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || '0x7f9a8b1c4e2d';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  try {
    const decoded = JSON.parse(Buffer.from(cookieValue, 'base64').toString('utf-8'));
    if (!decoded.email || !decoded.expiresAt) return false;
    // Cek expired
    if (Date.now() > decoded.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPrefix = `/${ADMIN_SLUG}`;

  // Hanya lindungi route admin
  if (!pathname.startsWith(adminPrefix)) {
    return NextResponse.next();
  }

  // Cek session cookie (HttpOnly, set oleh /api/admin/login)
  const sessionCookie = request.cookies.get('waroeng_admin_session')?.value;

  if (!isValidSession(sessionCookie)) {
    // Redirect ke halaman login (yang akan dirender oleh layout.tsx)
    // Kita set header khusus agar layout.tsx tahu bahwa ini dari proxy redirect
    const response = NextResponse.redirect(new URL(adminPrefix, request.url));
    // Hapus cookie yang invalid/expired jika ada
    if (sessionCookie) {
      response.cookies.set('waroeng_admin_session', '', { maxAge: 0, path: '/' });
    }
    return response;
  }

  // Session valid — lanjutkan dan suntikkan header identitas admin ke request
  const decoded = JSON.parse(Buffer.from(sessionCookie!, 'base64').toString('utf-8'));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-email', decoded.email);
  requestHeaders.set('x-admin-authenticated', 'true');

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Proteksi semua route admin kecuali static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};

