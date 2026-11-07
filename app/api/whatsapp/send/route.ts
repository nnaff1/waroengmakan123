import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/fonnteClient';
import { isAdminRequest } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  // Hanya admin yang sudah login yang bisa kirim WA broadcast
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { target, message, url, schedule } = body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return NextResponse.json({ error: 'Nomor tujuan WhatsApp wajib diisi.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Isi pesan WhatsApp tidak boleh kosong.' }, { status: 400 });
    }

    // Batasi panjang pesan
    if (message.length > 4096) {
      return NextResponse.json({ error: 'Pesan terlalu panjang (maks 4096 karakter).' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage({
      target: target.trim(),
      message: message.trim(),
      url: url?.trim() || undefined,
      schedule: schedule ? Number(schedule) : undefined,
    });

    return NextResponse.json({ success: true, message: 'Pesan WhatsApp berhasil dikirim!', data: result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim pesan WhatsApp.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
