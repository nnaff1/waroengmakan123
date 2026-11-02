'use client';

import React, { useState, useEffect } from 'react';

interface BufferChannel {
  id: string;
  name: string;
  service: string;
  avatar?: string;
}

interface BufferStatus {
  connected: boolean;
  email?: string;
  organization?: {
    id: string;
    name: string;
  };
  channels?: BufferChannel[];
  hasInstagram?: boolean;
  hasTikTok?: boolean;
  instagramChannel?: BufferChannel;
  tiktokChannel?: BufferChannel;
}

interface PromoData {
  instagramCaption: string;
  tiktokCaption: string;
  whatsappBroadcast: string;
  bundlingIdea: string;
}

type PublishMode = 'shareNow' | 'customScheduled' | 'addToQueue';

const DEFAULT_PROMO: PromoData = {
  instagramCaption:
    'Nikmati akhir pekan seru bareng keluarga di WaroengMakan123! 🎉 Dapatkan diskon 20% untuk semua menu keluarga khusus Sabtu-Minggu ini. Yuk, buruan reservasi tempatmu sekarang! 👇\n\n#WaroengMakan123 #PromoKeluarga #KulinerNusantara',
  tiktokCaption:
    'Weekend gak usah pusing mikirin makan di mana! Ada promo diskon 20% menu keluarga di WaroengMakan123. Pilihan prasmanan lengkap, bumbu baladonya gurih pedas nampol, plus dessert mochi dingin yang kenyal manis! Yuk, mampir sekarang sebelum kehabisan! 🔥😋\n\n#WaroengMakan123 #KulinerTikTok #KulinerPurwokerto #FYP',
  whatsappBroadcast:
    'Halo Sahabat Waroeng! 👋 Ada kabar gembira nih untuk akhir pekanmu. Khusus Sabtu & Minggu ini, nikmati Promo Spesial Keluarga dengan diskon 20% all items! 🍱✨\n\nKlik link di bawah untuk reservasi ya! Jangan sampai kehabisan meja! 😋👇',
  bundlingIdea:
    "Berdasarkan tren pesanan, kami sarankan membuat paket: 'Paket Hemat Dimsum Kukus + Mochi Aneka Rasa' sebagai penutup makan siang.",
};

const QUICK_IDEAS = [
  'Promo akhir pekan diskon 20% menu keluarga',
  'Menu balado pedas nampol dan mochi dingin',
  'Paket makan siang hemat pelajar Rp15.000',
  'Flash sale sore beli 2 gratis 1 minuman',
];

export default function AICopilotPage() {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promoData, setPromoData] = useState<PromoData>(DEFAULT_PROMO);

  // Editable text states
  const [editableIG, setEditableIG] = useState(DEFAULT_PROMO.instagramCaption);
  const [editableTikTok, setEditableTikTok] = useState(DEFAULT_PROMO.tiktokCaption);
  const [isEditingIG, setIsEditingIG] = useState(false);
  const [isEditingTikTok, setIsEditingTikTok] = useState(false);

  // Scheduling states for Instagram
  const [igMode, setIgMode] = useState<PublishMode>('customScheduled');
  const [igScheduleDate, setIgScheduleDate] = useState('');

  // Buffer Status
  const [bufferStatus, setBufferStatus] = useState<BufferStatus | null>(null);
  const [isPublishing, setIsPublishing] = useState<'instagram' | 'tiktok' | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Helper formatting for datetime-local string
  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchStatus = () => {
    fetch('/api/buffer/status')
      .then((res) => res.json())
      .then((data) => setBufferStatus(data))
      .catch((err) => console.error('Error fetching Buffer status:', err));
  };

  useEffect(() => {
    fetchStatus();

    // Default jadwal: Besok jam 11:30 WIB (jam emas promo makan siang)
    const tomorrowLunch = new Date();
    tomorrowLunch.setDate(tomorrowLunch.getDate() + 1);
    tomorrowLunch.setHours(11, 30, 0, 0);
    setIgScheduleDate(formatDateTimeLocal(tomorrowLunch));
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsGenerating(true);
    setNotification(null);

    try {
      const res = await fetch('/api/copilot/generate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: promptInput.trim() }),
      });

      if (!res.ok) throw new Error('Gagal memproses AI');
      const data = await res.json();

      const newPromo: PromoData = {
        instagramCaption: data.instagramCaption || data.instagram?.fullText || DEFAULT_PROMO.instagramCaption,
        tiktokCaption: data.tiktokCaption || data.tiktok?.fullText || DEFAULT_PROMO.tiktokCaption,
        whatsappBroadcast: data.whatsappBroadcast || DEFAULT_PROMO.whatsappBroadcast,
        bundlingIdea: data.bundlingIdea || DEFAULT_PROMO.bundlingIdea,
      };

      setPromoData(newPromo);
      setEditableIG(newPromo.instagramCaption);
      setEditableTikTok(newPromo.tiktokCaption);
      setIsEditingIG(false);
      setIsEditingTikTok(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan promo, template default tetap digunakan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToBuffer = async (platform: 'instagram' | 'tiktok') => {
    setIsPublishing(platform);
    setNotification(null);

    const isIG = platform === 'instagram';
    const text = isIG ? editableIG : editableTikTok;
    const title = `Promo ${isIG ? 'Instagram' : 'TikTok'} WaroengMakan123`;

    // Ambil mode yang dipilih pengguna
    const mode = isIG ? igMode : 'addToQueue';
    const scheduledAt = isIG && igMode === 'customScheduled' && igScheduleDate ? igScheduleDate : undefined;

    try {
      const res = await fetch('/api/buffer/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          text,
          title,
          mode,
          scheduledAt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim ke Buffer');
      }

      setNotification({
        type: 'success',
        message: data.message || `Berhasil diproses untuk ${isIG ? 'Instagram' : 'TikTok'}.`,
        url: data.url || 'https://publish.buffer.com',
      });

      fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan';
      setNotification({
        type: 'error',
        message: `Gagal mengirim ke Buffer: ${msg}`,
      });
    } finally {
      setIsPublishing(null);
    }
  };

  const setPresetSchedule = (daysFromNow: number, hours: number, minutes: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    setIgScheduleDate(formatDateTimeLocal(d));
    setIgMode('customScheduled');
  };

  // Helper untuk memformat teks caption dengan hashtag berwarna khas
  const renderFormattedCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return (
      <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed whitespace-pre-line">
        {parts.map((part, index) =>
          part.startsWith('#') ? (
            <span key={index} className="text-[#8E3B24] font-medium mr-1">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    );
  };

  const instagramName = bufferStatus?.instagramChannel?.name;
  const isIGConnected = Boolean(instagramName || bufferStatus?.hasInstagram);

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 text-[#2C2623] p-2 sm:p-4 xl:p-6 font-sans">
      {/* HEADER PAGE */}
      <div className="border-b border-[#EBE5D8] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-[#2C2623]">
            AI Marketing Copilot
          </h1>
          <p className="text-xs xl:text-sm text-[#736D69] mt-1">
            Generate promos, analyze reviews, and optimize your menu with AI assistant.
          </p>
        </div>

        {/* Clean Buffer Connection Status */}
        <div className="inline-flex items-center gap-2 text-xs bg-[#FAF8F5] border border-[#EBE5D8] px-3.5 py-1.5 rounded-full text-[#524D4A] self-start sm:self-auto shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-[#2C2623]">
            {isIGConnected ? `Buffer: @${instagramName || 'waroengmakan123'}` : 'Buffer Aktif'}
          </span>
          <span className="text-[#D5CDBD]">•</span>
          <a
            href="https://publish.buffer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8E3B24] hover:underline font-medium shrink-0"
          >
            Dashboard ↗
          </a>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-[#FAF8F5] border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✕'}</span>
            <span>{notification.message}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {notification.url && (
              <a
                href={notification.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#8E3B24] hover:underline text-xs"
              >
                Lihat di Buffer ↗
              </a>
            )}
            <button
              onClick={() => setNotification(null)}
              className="text-[#736D69] hover:text-[#2C2623] text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* KOLOM KIRI: PROMO GENERATOR & SUGGESTIONS */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 xl:space-y-8">
          {/* Form Input Generator */}
          <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm xl:text-lg font-bold text-[#2C2623]">
              <svg className="w-5 h-5 text-[#8E3B24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Promo Generator</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-[11px] xl:text-xs font-bold text-[#938C87] uppercase block mb-1.5 tracking-wider">
                  Your Idea
                </label>
                <textarea
                  rows={4}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ketik ide promo Anda... (e.g., promo akhir pekan untuk keluarga dengan menu balado dan mochi)"
                  className="w-full bg-[#FAF8F5] border border-[#ECE7E1] rounded-2xl p-3.5 xl:p-4 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#8E3B24] resize-none leading-relaxed"
                />
              </div>

              {/* Minimal Idea Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[10px] text-[#938C87] uppercase font-bold tracking-wider mr-1">
                  Ide Cepat:
                </span>
                {QUICK_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptInput(idea)}
                    className="text-[11px] bg-[#FAF8F5] hover:bg-[#F0ECE6] text-[#524D4A] hover:text-[#2C2623] border border-[#ECE7E1] px-3 py-1 rounded-full transition-all cursor-pointer font-medium"
                  >
                    {idea}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !promptInput.trim()}
                  className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 xl:px-8 py-2.5 xl:py-3 rounded-full text-xs xl:text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Generate Promo AI</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* AI SUGGESTIONS CARDS */}
          <div className="space-y-4">
            <span className="text-[11px] xl:text-xs font-bold text-[#938C87] uppercase tracking-wider block px-1">
              AI Suggestions
            </span>

            {/* INSTAGRAM & TIKTOK SIDE BY SIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
              {/* CARD 1: INSTAGRAM CAPTION WITH SCHEDULING & POST NOW */}
              <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2.5">
                    <div className="flex items-center gap-2 text-xs xl:text-sm font-bold text-[#2C2623]">
                      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                      <div>
                        <span>Instagram Caption</span>
                        {isIGConnected && (
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            ● @{instagramName || 'waroengmakan123'} (Terhubung)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingIG(!isEditingIG)}
                      className="text-[11px] text-[#736D69] hover:text-[#8E3B24] font-medium cursor-pointer"
                    >
                      {isEditingIG ? 'Selesai' : 'Edit'}
                    </button>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6]">
                    {isEditingIG ? (
                      <textarea
                        rows={6}
                        value={editableIG}
                        onChange={(e) => setEditableIG(e.target.value)}
                        className="w-full bg-transparent text-xs xl:text-sm text-[#2C2623] leading-relaxed focus:outline-none resize-none"
                      />
                    ) : (
                      renderFormattedCaption(editableIG)
                    )}
                  </div>
                </div>

                {/* SCHEDULING CONTROL BAR (BUFFER STYLE) */}
                <div className="space-y-2.5 pt-2 border-t border-[#F0ECE6]">
                  {/* Mode Selector Pill Buttons */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#938C87] font-semibold text-[10px] uppercase tracking-wider">
                      Opsi Kirim:
                    </span>
                    <div className="flex bg-[#FAF8F5] border border-[#ECE7E1] rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => setIgMode('shareNow')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          igMode === 'shareNow'
                            ? 'bg-[#8E3B24] text-white shadow-2xs'
                            : 'text-[#736D69] hover:text-[#2C2623]'
                        }`}
                      >
                        ⚡ Post Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setIgMode('customScheduled')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          igMode === 'customScheduled'
                            ? 'bg-[#8E3B24] text-white shadow-2xs'
                            : 'text-[#736D69] hover:text-[#2C2623]'
                        }`}
                      >
                        ⏰ Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setIgMode('addToQueue')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          igMode === 'addToQueue'
                            ? 'bg-[#8E3B24] text-white shadow-2xs'
                            : 'text-[#736D69] hover:text-[#2C2623]'
                        }`}
                      >
                        📥 Antrean
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Picker Area (When Schedule is Selected) */}
                  {igMode === 'customScheduled' && (
                    <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#ECE7E1] space-y-2 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-bold text-[#736D69] uppercase tracking-wider">
                          Pilih Tanggal & Jam Tayang:
                        </label>
                        <input
                          type="datetime-local"
                          value={igScheduleDate}
                          onChange={(e) => setIgScheduleDate(e.target.value)}
                          className="bg-white border border-[#EBE5D8] rounded-xl px-2.5 py-1 text-xs text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                        />
                      </div>

                      {/* Quick Schedule Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] text-[#938C87] uppercase font-bold">Cepat:</span>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(1, 11, 30)}
                          className="text-[10px] bg-white border border-[#ECE7E1] px-2 py-0.5 rounded-lg text-[#524D4A] hover:text-[#8E3B24] cursor-pointer"
                        >
                          Besok 11:30
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(1, 17, 0)}
                          className="text-[10px] bg-white border border-[#ECE7E1] px-2 py-0.5 rounded-lg text-[#524D4A] hover:text-[#8E3B24] cursor-pointer"
                        >
                          Besok 17:00
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(2, 11, 0)}
                          className="text-[10px] bg-white border border-[#ECE7E1] px-2 py-0.5 rounded-lg text-[#524D4A] hover:text-[#8E3B24] cursor-pointer"
                        >
                          +2 Hari 11:00
                        </button>
                      </div>
                    </div>
                  )}

                  {igMode === 'shareNow' && (
                    <div className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1.5 rounded-xl">
                      ⚡ Postingan akan langsung dipublikasikan detik ini juga ke akun Instagram @{instagramName || 'waroengmakan123'}.
                    </div>
                  )}

                  {igMode === 'addToQueue' && (
                    <div className="text-[10px] text-[#736D69] bg-[#FAF8F5] border border-[#ECE7E1] px-2.5 py-1.5 rounded-xl">
                      📥 Mengikuti slot jadwal tayang otomatis berikutnya yang sudah Anda atur di Buffer.
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(editableIG, 'ig')}
                      className="text-xs font-semibold text-[#524D4A] hover:text-[#2C2623] px-3 py-1.5 rounded-xl hover:bg-[#FAF8F5] transition-all cursor-pointer"
                    >
                      {copiedKey === 'ig' ? '✓ Tersalin' : 'Salin'}
                    </button>

                    <button
                      type="button"
                      disabled={isPublishing === 'instagram'}
                      onClick={() => handleSendToBuffer('instagram')}
                      className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      {isPublishing === 'instagram' ? (
                        <span>Memproses...</span>
                      ) : igMode === 'shareNow' ? (
                        <span>⚡ Posting Sekarang</span>
                      ) : igMode === 'customScheduled' ? (
                        <span>⏰ Jadwalkan ke Instagram</span>
                      ) : (
                        <span>📥 Masukkan Antrean</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: TIKTOK CAPTION */}
              <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-3 xl:space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2.5">
                    <div className="flex items-center gap-2 text-xs xl:text-sm font-bold text-[#2C2623]">
                      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-[#2C2623]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                      <div>
                        <span>TikTok Caption</span>
                        <span className="block text-[10px] text-[#938C87]">
                          Format siap posting TikTok
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingTikTok(!isEditingTikTok)}
                      className="text-[11px] text-[#736D69] hover:text-[#8E3B24] font-medium cursor-pointer"
                    >
                      {isEditingTikTok ? 'Selesai' : 'Edit'}
                    </button>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6]">
                    {isEditingTikTok ? (
                      <textarea
                        rows={6}
                        value={editableTikTok}
                        onChange={(e) => setEditableTikTok(e.target.value)}
                        className="w-full bg-transparent text-xs xl:text-sm text-[#2C2623] leading-relaxed focus:outline-none resize-none"
                      />
                    ) : (
                      renderFormattedCaption(editableTikTok)
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F0ECE6]">
                  <button
                    type="button"
                    onClick={() => handleCopy(editableTikTok, 'tt')}
                    className="text-xs font-semibold text-[#524D4A] hover:text-[#2C2623] px-3 py-1.5 rounded-xl hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    {copiedKey === 'tt' ? '✓ Tersalin' : 'Salin'}
                  </button>

                  <button
                    type="button"
                    disabled={isPublishing === 'tiktok'}
                    onClick={() => handleSendToBuffer('tiktok')}
                    className="bg-[#2C2623] hover:bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPublishing === 'tiktok' ? 'Menyimpan...' : 'Kirim ke Buffer'}
                  </button>
                </div>
              </div>
            </div>

            {/* WHATSAPP BROADCAST */}
            <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2.5">
                <div className="flex items-center gap-2 text-xs xl:text-sm font-bold text-[#2C2623]">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>WhatsApp Broadcast</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(promoData.whatsappBroadcast, 'wa')}
                    className="text-xs font-semibold text-[#524D4A] hover:text-[#2C2623] px-3 py-1.5 rounded-xl hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    {copiedKey === 'wa' ? '✓ Tersalin' : 'Salin'}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(promoData.whatsappBroadcast)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition-all"
                  >
                    Kirim WA ↗
                  </a>
                </div>
              </div>

              <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6] whitespace-pre-line">
                {promoData.whatsappBroadcast}
              </p>
            </div>

            {/* BUNDLING IDEA */}
            <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs xl:text-sm font-bold text-[#2C2623]">Menu Bundling Idea</h4>
                <p className="text-xs xl:text-sm text-[#524D4A] mt-1 leading-relaxed">
                  {promoData.bundlingIdea}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: REVIEW INSIGHTS */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-3">
            <h3 className="text-sm xl:text-lg font-bold text-[#2C2623]">Review Insights</h3>
            <span className="bg-[#FAF8F5] border border-[#E5DEC9] text-[10px] xl:text-xs font-bold text-[#736D69] px-3 py-1 rounded-full">
              This Week
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-[#6B7C5E]">92%</span>
            <span className="text-xs xl:text-sm font-semibold text-[#736D69]">Satisfaction Score</span>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF8F5] rounded-2xl p-4 xl:p-5 border border-[#ECE7E1]">
              <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed">
                <strong className="text-[#2C2623]">Highlight:</strong> Ulasan mayoritas puas dengan rasa bumbu balado yang khas dan konsisten.
              </p>
            </div>

            <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 xl:p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Action Required</span>
              </div>
              <p className="text-xs xl:text-sm text-red-800 leading-relaxed">
                Ada 3 catatan pelanggan minggu ini terkait <strong>stok mochi dingin yang cepat habis di malam hari</strong>. Pertimbangkan untuk menambah prep porsi sore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}