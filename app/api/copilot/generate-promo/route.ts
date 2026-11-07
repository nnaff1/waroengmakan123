import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { isAdminRequest } from '@/lib/adminAuth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface GeneratedPromoResponse {
  instagramCaption: string;
  tiktokCaption: string;
  whatsappBroadcast: string;
  bundlingIdea: string;
  // Backward compatibility fields
  instagram?: {
    fullText: string;
  };
  tiktok?: {
    fullText: string;
  };
}

function getFallbackPromo(idea: string): GeneratedPromoResponse {
  const cleanIdea = idea || 'Promo Spesial WaroengMakan123 Diskon 20% Akhir Pekan';
  const igText = `Nikmati akhir pekan seru bareng keluarga di WaroengMakan123! 🎉 Dapatkan promo spesial: ${cleanIdea}. Mulai dari gurih pedasnya bumbu balado khas hingga segarnya mochi dingin sebagai penutup. Yuk, buruan reservasi tempatmu sekarang! 👇\n\n#WaroengMakan123 #PromoKeluarga #KulinerNusantara #KulinerPurwokerto`;
  const ttText = `Weekend gak usah pusing mikirin makan di mana! Ada promo spesial ${cleanIdea} di WaroengMakan123. Pilihan prasmanan lengkap, bumbu baladonya gurih pedas nampol, plus dessert mochi dingin yang kenyal manis! Yuk, mampir rame-rame sebelum kehabisan! 🔥😋\n\n#WaroengMakan123 #KulinerTikTok #KulinerNusantara #FYP`;
  const waText = `Halo Sahabat Waroeng! 👋 Ada kabar gembira nih untuk rencana akhir pekanmu. Khusus minggu ini, nikmati promo spesial:\n\n✨ *${cleanIdea}* ✨\n\nYuk ajak keluarga atau teman makan puas dengan bumbu khas Nusantara dan dessert mochi dingin favorit! Jangan sampai kehabisan meja ya. Balas pesan ini untuk reservasi sekarang! 🍱📲`;
  const bundling = 'Paket Puas Keluarga: 3 Porsi Nasi + 2 Porsi Ayam Balado + 1 Tumis Kangkung + 3 Es Teh Manis + 2 Porsi Mochi Dingin.';

  return {
    instagramCaption: igText,
    tiktokCaption: ttText,
    whatsappBroadcast: waText,
    bundlingIdea: bundling,
    instagram: { fullText: igText },
    tiktok: { fullText: ttText },
  };
}

export async function POST(req: NextRequest) {
  // Hanya admin yang sudah login yang bisa generate promo (mencegah pemborosan API key)
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { idea } = await req.json();

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'Ide promo wajib diisi.' }, { status: 400 });
    }

    // Batasi panjang + sanitasi input (anti prompt injection & DoS)
    const cleanIdea = idea.trim().slice(0, 500).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    let menuContext = '';
    let restoContext = 'WaroengMakan123, Restoran Masakan Nusantara Modern & Prasmanan Bersih';

    try {
      const [menuRes, settingsRes] = await Promise.all([
        supabase.from('menu_items').select('name, category, price, is_available').limit(25),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ]);

      if (settingsRes.data) {
        restoContext = `${settingsRes.data.resto_name || 'WaroengMakan123'}, ${settingsRes.data.address || 'Purwokerto'}.`;
      }

      if (menuRes.data && menuRes.data.length > 0) {
        menuContext = menuRes.data
          .map((m) => `${m.name} (${m.category}, Rp${Number(m.price).toLocaleString('id-ID')})`)
          .join(', ');
      }
    } catch (e) {
      console.warn('Supabase fetch failed, continuing with defaults:', e);
    }

    const systemPrompt = `Kamu adalah copywriter profesional untuk restoran "${restoContext}".
Karakter restoran: Prasmanan Nusantara modern, bumbu balado khas gurih pedas nampol, dessert mochi dingin aneka rasa yang segar, higienis, halal, dan ramah kantong.
Daftar menu andalan: ${menuContext || 'Ayam Balado, Tumis Kangkung, Mochi Dingin, Es Teh Manis, Nasi Putih'}.

TUGAS:
Buatkan draf teks promosi yang menggugah selera, santai, dan siap langsung diposting berdasarkan ide: "${cleanIdea}".

ATURAN:
- Jangan menyertakan istilah teknis video (JANGAN tulis hook 0-3 detik, storyboard, scene, voiceover, angle kamera, dll).
- Hasilkan HANYA caption/teks postingan siap pakai dengan emoji wajar dan hashtag relevan.
- Format JSON murni tanpa markdown backtick:
{
  "instagramCaption": "Teks caption lengkap Instagram beserta hashtag di akhir (misal: Nikmati akhir pekan seru... #WaroengMakan123)",
  "tiktokCaption": "Teks caption santai dan menarik untuk postingan TikTok beserta hashtag (misal: Weekend gausah pusing... #WaroengMakan123 #KulinerTikTok #FYP)",
  "whatsappBroadcast": "Draf pesan WhatsApp broadcast untuk pelanggan",
  "bundlingIdea": "Saran 1 paket menu bundling hemat untuk mendongkrak penjualan"
}`;

    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ];

    let aiResultText = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          aiResultText = data.candidates[0].content.parts[0].text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} gagal:`, err);
      }
    }

    if (aiResultText) {
      try {
        const cleaned = aiResultText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          instagramCaption: parsed.instagramCaption || parsed.instagram?.fullText || '',
          tiktokCaption: parsed.tiktokCaption || parsed.tiktok?.fullText || '',
          whatsappBroadcast: parsed.whatsappBroadcast || '',
          bundlingIdea: parsed.bundlingIdea || '',
          instagram: { fullText: parsed.instagramCaption || '' },
          tiktok: { fullText: parsed.tiktokCaption || '' },
        });
      } catch (parseErr) {
        console.error('Failed to parse Gemini response as JSON:', parseErr, aiResultText);
      }
    }

    const fallback = getFallbackPromo(idea);
    return NextResponse.json(fallback);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
