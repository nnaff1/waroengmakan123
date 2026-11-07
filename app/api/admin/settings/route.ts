import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sembunyikan pin_code dari response — jangan pernah kirim ke client
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pin_code, ...safeData } = data;
      return NextResponse.json({ data: safeData });
    }

    return NextResponse.json({ data: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_credentials') {
      const pin_code = String(body.pin_code || '').trim();
      const admin_email = String(body.admin_email || '').toLowerCase().trim();

      if (!pin_code || pin_code.length < 4) {
        return NextResponse.json({ error: 'Password admin minimal 4 karakter.' }, { status: 400 });
      }
      if (!admin_email || !admin_email.includes('@')) {
        return NextResponse.json({ error: 'Format email admin tidak valid.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('settings')
        .update({ pin_code, admin_email, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select('id, admin_email')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Jangan kembalikan pin_code ke client
      return NextResponse.json({ success: true, admin_email, data: { id: data?.id, admin_email } });
    }

    // Default: update semua settings (kecuali credentials)
    const payload = {
      id: 1,
      resto_name: body.resto_name,
      phone: body.phone,
      address: body.address,
      open_hour: body.open_hour,
      close_hour: body.close_hour,
      tax_percent: Number(body.tax_percent) || 10,
      receipt_footer: body.receipt_footer,
      pin_code: String(body.pin_code || '').trim(),
      admin_email: String(body.admin_email || '').toLowerCase().trim(),
      auto_upsell: body.auto_upsell,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sembunyikan pin_code dari response
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pin_code, ...safeData } = data;
      return NextResponse.json({ success: true, data: safeData });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/admin/settings] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
