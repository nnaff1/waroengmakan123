import { NextResponse } from 'next/server';
import { getBufferAccountStatus } from '@/lib/bufferClient';

export async function GET() {
  try {
    const status = await getBufferAccountStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        connected: false,
        channels: [],
        hasInstagram: false,
        hasTikTok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
