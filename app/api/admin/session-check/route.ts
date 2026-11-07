import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/adminAuth';

/**
 * GET /api/admin/session-check
 * Cek apakah session cookie masih valid (HMAC-verified).
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('waroeng_admin_session')?.value;

  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const payload = verifySession(cookie);
    return NextResponse.json({ authenticated: true, email: payload.email });
  } catch {
    // Token invalid atau expired — hapus cookie
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.set('waroeng_admin_session', '', { maxAge: 0, path: '/' });
    return response;
  }
}
