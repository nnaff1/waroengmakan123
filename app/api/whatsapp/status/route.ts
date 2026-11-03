import { NextResponse } from 'next/server';
import { getFonnteDeviceStatus } from '@/lib/fonnteClient';

export async function GET() {
  try {
    const status = await getFonnteDeviceStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

