import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// In-memory cache agar tidak querying Supabase setiap detik
let cachedMenuContext = '';
let cachedRestoContext = 'WaroengMakan123, Gg. Dahlia, Sumampir Kulon, Sumampir, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53125 (Google Maps: https://www.google.com/maps/place/Warung+Makan+123/@-7.398786,109.2354923,17z/data=!3m1!4b1!4m6!3m5!1s0x2e655fa3ccb4c185:0xf0395c10eac9f13d!8m2!3d-7.398786!4d109.2354923!16s%2Fg%2F11fls1wzq7). Buka setiap hari pukul 10:00 - 21:00 WIB. WhatsApp: 081234567890.';
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

async function getRestoContext() {
  const now = Date.now();
  if (cachedMenuContext && (now - lastFetchTime < CACHE_TTL_MS)) {
    return { menuContext: cachedMenuContext, restoContext: cachedRestoContext };
  }

  try {
    const [menuRes, settingsRes] = await Promise.all([
      supabase.from('menu_items').select('name, category, price, is_available').limit(30),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (settingsRes.data) {
      const s = settingsRes.data;
      cachedRestoContext = `${s.resto_name || 'WaroengMakan123'}, alamat: ${s.address || 'Gg. Dahlia, Sumampir Kulon, Sumampir, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53125'}. Jam operasional: ${s.open_hour || '10:00'} - ${s.close_hour || '21:00'} WIB. WhatsApp/Pemesanan: ${s.phone || '081234567890'}.`;
    }

    if (menuRes.data && menuRes.data.length > 0) {
      cachedMenuContext = menuRes.data
        .map((m) => `- ${m.name} (${m.category}): Rp${Number(m.price).toLocaleString('id-ID')} [${m.is_available ? 'Tersedia' : 'Habis'}]`)
        .join('\n');
    }

    lastFetchTime = now;
  } catch (err) {
    console.warn('Gagal fetch context dari Supabase, menggunakan cached data:', err);
  }

  return { menuContext: cachedMenuContext, restoContext: cachedRestoContext };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const { menuContext, restoContext } = await getRestoContext();

    const systemPrompt = `Kamu adalah "AI Chatbot", asisten virtual resmi dari WaroengMakan123.

INFORMASI RESTORAN:
${restoContext}
Konsep: Restoran prasmanan Nusantara modern, bersih, higienis, halal, dan harga terjangkau.

DAFTAR MENU & HARGA SAAT INI:
${menuContext || '- Ayam Goreng: Rp8.000\n- Tumis Kangkung: Rp3.000\n- Risol Mayo: Rp2.500\n- Es Teh: Rp2.500'}

PANDUAN MENJAWAB:
1. Bersikap sopan, ramah, dan profesional.
2. Jawab langsung ke inti pertanyaan (to the point) tanpa basa-basi berlebihan, candaan klise, atau metafora berlebihan.
3. Hindari penggunaan emoji berlebihan (cukup 1 emoji wajar jika relevan).
4. Jika pengguna hanya mengetes atau menyapa (misal: "tes", "halo", "p"), balas dengan singkat dan tanyakan apa yang ingin diketahui seputar menu atau restoran.
5. Jika ditanya rekomendasi menu, berikan saran menu andalan beserta harga resminya secara jelas.
6. Jika ditanya jam buka, lokasi, atau pemesanan katering/rombongan, berikan data akurat dan sertakan nomor WhatsApp.`;

    // Ambil maksimal 6 pesan terakhir untuk menghemat latency & token
    const contents = messages.slice(-6).map((m: { sender: 'user' | 'ai'; text: string }) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Prioritaskan model Flash Lite yang super cepat (<1s) dan memiliki kuota aktif
    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ];

    let replyText = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
            signal: AbortSignal.timeout(4500), // Timeout 4.5 detik agar tidak pernah hanging
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            replyText = candidateText;
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Model ${model} gagal status ${response.status}:`, errData?.error?.message?.slice(0, 80));
        }
      } catch (e: any) {
        console.warn(`Model ${model} request error/timeout:`, e?.name || e?.message);
      }
    }

    if (!replyText) {
      replyText = 'Halo! Ada yang bisa kami bantu seputar menu prasmanan, harga, jam buka, atau lokasi WaroengMakan123?';
    }

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses pesan.' },
      { status: 500 }
    );
  }
}
