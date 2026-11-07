import { NextRequest, NextResponse } from 'next/server';
import { getFonnteDeviceStatus } from '@/lib/fonnteClient';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getFonnteDeviceStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}
