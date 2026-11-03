import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/fonnteClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, message, url, schedule } = body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return NextResponse.json(
        { error: 'Nomor tujuan WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Isi pesan WhatsApp tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({
      target: target.trim(),
      message: message.trim(),
      url: url?.trim() || undefined,
      schedule: schedule ? Number(schedule) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Pesan WhatsApp berhasil dikirim / diproses oleh Fonnte!',
      data: result,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim pesan WhatsApp.';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
