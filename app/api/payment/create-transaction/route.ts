// app/api/payment/create-transaction/route.ts
// POST /api/payment/create-transaction
// Membuat Midtrans Snap token berdasarkan data order dari kasir

import { NextRequest, NextResponse } from 'next/server';
import { getSnap } from '@/lib/midtrans';
import { createClient } from '@supabase/supabase-js';

function makeSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Gunakan service_role jika tersedia dan tidak kosong, fallback ke anon
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptNo, orders, subtotal, tax, grandTotal, paymentMethod, notes } = body;

    // Validasi input dasar
    if (!receiptNo || !orders?.length || !grandTotal) {
      return NextResponse.json({ error: 'Data order tidak lengkap.' }, { status: 400 });
    }

    const calculatedSubtotal = subtotal !== undefined ? subtotal : orders.reduce((s: number, i: { price: number; qty: number }) => s + (i.price * (i.qty || 1)), 0);
    const calculatedTax = tax !== undefined ? tax : Math.max(0, grandTotal - calculatedSubtotal);

    // --- 1. Simpan order ke Supabase dengan status "Pending" ---
    const supabase = makeSupabaseServer();
    const { data: savedOrder, error: dbError } = await supabase
      .from('orders')
      .insert([{
        grand_total: grandTotal,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        items: orders,
        // Kolom lama yang mungkin NOT NULL — kirim nilai default
        table_number: 'Kasir',
        order_type: 'Prasmanan',
        receipt_no: receiptNo,
        ...(paymentMethod && { payment_method: paymentMethod }),
        status: 'Pending',
        ...(notes && { notes }),
      }])
      .select('id')
      .single();

    if (dbError) {
      console.error('[Supabase] Insert order error:', dbError.message, dbError.code);
      return NextResponse.json(
        { error: `Gagal menyimpan order ke database: ${dbError.message}` },
        { status: 500 }
      );
    }

    const orderId = savedOrder.id as string;

    // --- 2. Buat Snap transaction parameter ---
    const itemDetails = orders.map((item: { id: string; name: string; price: number; qty: number }) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: item.price,
      quantity: item.qty,
    }));

    // Tambahkan pajak sebagai line item tersendiri
    if (tax > 0) {
      itemDetails.push({ id: 'TAX', name: 'Pajak Resto (10%)', price: tax, quantity: 1 });
    }

    const parameter = {
      transaction_details: {
        order_id: `${receiptNo}-${orderId.slice(0, 8)}`,
        gross_amount: grandTotal,
      },
      item_details: itemDetails,
      enabled_payments: ['other_qris', 'gopay', 'shopeepay'],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kasir/payment-success`,
      },
      custom_field1: receiptNo,
      custom_field2: orderId,
    };

    // --- 3. Hit Midtrans API untuk mendapatkan Snap Token ---
    const snapToken = await getSnap().createTransactionToken(parameter);

    return NextResponse.json({ snapToken, orderId, receiptNo });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[create-transaction] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
