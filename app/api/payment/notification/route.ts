// app/api/payment/notification/route.ts
// POST /api/payment/notification
// Webhook endpoint untuk menerima notifikasi status pembayaran dari Midtrans server
// URL ini harus didaftarkan di Midtrans Dashboard → Settings → Payment Notification URL

import { NextRequest, NextResponse } from 'next/server';
import { getCoreApi } from '@/lib/midtrans';
import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map Midtrans transaction_status ke status internal
function resolveStatus(
  transactionStatus: string,
  fraudStatus: string
): 'Selesai' | 'Pending' | 'Gagal' | 'Refund' {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'Selesai' : 'Gagal';
  }
  if (transactionStatus === 'settlement') return 'Selesai';
  if (transactionStatus === 'pending') return 'Pending';
  if (['deny', 'expire', 'cancel', 'failure'].includes(transactionStatus)) return 'Gagal';
  if (transactionStatus === 'refund') return 'Refund';
  return 'Pending';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verifikasi signature Midtrans (anti-spoofing)
    // coreApi.transaction.notification() otomatis verifikasi signature_key
    const notification = await getCoreApi().transaction.notification(body);

    const {
      order_id: midtransOrderId,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      payment_type: paymentType,
      custom_field2: supabaseOrderId,
    } = notification;

    const newStatus = resolveStatus(transactionStatus, fraudStatus ?? 'accept');

    console.log(`[Webhook] ${midtransOrderId} → ${transactionStatus}/${fraudStatus} → ${newStatus}`);

    // Update status order di Supabase berdasarkan ID internal
    const { error } = await supabaseServer
      .from('orders')
      .update({
        status: newStatus,
        payment_method: paymentType || undefined,
        midtrans_order_id: midtransOrderId,
        paid_at: newStatus === 'Selesai' ? new Date().toISOString() : undefined,
      })
      .eq('id', supabaseOrderId);

    if (error) {
      console.error('[Webhook] Supabase update error:', error.message);
      // Tetap return 200 agar Midtrans tidak retry terus-menerus
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true, status: newStatus });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    console.error('[Webhook] Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
