import { NextRequest, NextResponse } from 'next/server';
import { sendPromoToBuffer, PublishOptions } from '@/lib/bufferClient';

export async function POST(req: NextRequest) {
  try {
    const body: PublishOptions = await req.json();

    if (!body.platform || !body.text) {
      return NextResponse.json(
        { error: 'Platform (instagram/tiktok) dan konten teks promo wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await sendPromoToBuffer(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
