import { NextRequest, NextResponse } from 'next/server';
import { getBufferAccountStatus } from '@/lib/bufferClient';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getBufferAccountStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { connected: false, channels: [], hasInstagram: false, hasTikTok: false, error: message },
      { status: 500 }
    );
  }
}
