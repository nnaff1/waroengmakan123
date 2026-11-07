import { NextRequest, NextResponse } from 'next/server';
import { sendPromoToBuffer, PublishOptions } from '@/lib/bufferClient';
import { isAdminRequest } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  // Hanya admin yang sudah login yang bisa publish ke Buffer
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: PublishOptions = await req.json();

    if (!body.platform || !body.text) {
      return NextResponse.json(
        { error: 'Platform (instagram/tiktok) dan konten teks promo wajib diisi.' },
        { status: 400 }
      );
    }

    // Batasi panjang teks untuk mencegah abuse
    if (body.text.length > 2200) {
      return NextResponse.json({ error: 'Teks terlalu panjang (maks 2200 karakter).' }, { status: 400 });
    }

    const result = await sendPromoToBuffer(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
