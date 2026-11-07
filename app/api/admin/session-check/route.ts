import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/session-check
 * Digunakan oleh layout admin untuk memeriksa apakah session cookie masih valid.
 * Tidak mengembalikan password atau data sensitif apapun.
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('waroeng_admin_session')?.value;

  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));

    if (!decoded.email || !decoded.expiresAt) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (Date.now() > decoded.expiresAt) {
      // Session expired — hapus cookie
      const response = NextResponse.json({ authenticated: false, reason: 'expired' }, { status: 401 });
      response.cookies.set('waroeng_admin_session', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      email: decoded.email,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

