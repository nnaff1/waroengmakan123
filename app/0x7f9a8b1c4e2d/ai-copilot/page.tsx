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

interface FonnteStatus {
  connected: boolean;
  device?: string;
  name?: string;
  quota?: string;
  expired?: string;
  statusString?: 'connect' | 'disconnect';
  error?: string;
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
  const [editableWA, setEditableWA] = useState(DEFAULT_PROMO.whatsappBroadcast);
  const [isEditingIG, setIsEditingIG] = useState(false);
  const [isEditingTikTok, setIsEditingTikTok] = useState(false);
  const [isEditingWA, setIsEditingWA] = useState(false);

  // Scheduling states for Instagram
  const [igMode, setIgMode] = useState<PublishMode>('customScheduled');
  const [igScheduleDate, setIgScheduleDate] = useState('');

  // WhatsApp / Fonnte states
  const [fonnteStatus, setFonnteStatus] = useState<FonnteStatus | null>(null);
  const [waTarget, setWaTarget] = useState('081213517208');
  const [waMode, setWaMode] = useState<'single' | 'broadcast'>('single');

  // Service Status & Publishing
  const [bufferStatus, setBufferStatus] = useState<BufferStatus | null>(null);
  const [isPublishing, setIsPublishing] = useState<'instagram' | 'tiktok' | 'whatsapp' | null>(null);
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

    fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data) => setFonnteStatus(data))
      .catch((err) => console.error('Error fetching Fonnte status:', err));
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
      setEditableWA(newPromo.whatsappBroadcast);
      setIsEditingIG(false);
      setIsEditingTikTok(false);
      setIsEditingWA(false);
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

  const handleSendToWhatsApp = async () => {
    setIsPublishing('whatsapp');
    setNotification(null);

    const target = waTarget.trim();
    if (!target) {
      setNotification({
        type: 'error',
        message: 'Nomor tujuan WhatsApp wajib diisi.',
      });
      setIsPublishing(null);
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          message: editableWA.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim WhatsApp');
      }

      setNotification({
        type: 'success',
        message: `Pesan WhatsApp berhasil dikirim ke target via Fonnte!`,
      });
      fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim WhatsApp';
      setNotification({
        type: 'error',
        message: msg,
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

        {/* Clean Service Connection Statuses */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Buffer Status */}
          <div className="inline-flex items-center gap-2 text-xs bg-[#FAF8F5] border border-[#EBE5D8] px-3.5 py-1.5 rounded-full text-[#524D4A] shadow-2xs">
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
              Buffer ↗
            </a>
          </div>

          {/* Fonnte WhatsApp Status */}
          <div className="inline-flex items-center gap-2 text-xs bg-[#FAF8F5] border border-[#EBE5D8] px-3.5 py-1.5 rounded-full text-[#524D4A] shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                fonnteStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-[#2C2623]">
              {fonnteStatus?.connected
                ? `WA: ${fonnteStatus.device || 'Online'}`
                : fonnteStatus?.name
                ? `WA: ${fonnteStatus.name} (Scan QR)`
                : 'Fonnte WA'}
            </span>
            <span className="text-[#D5CDBD]">•</span>
            <a
              href="https://md.fonnte.com/new/device.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline font-medium shrink-0"
            >
              Fonnte ↗
            </a>
          </div>
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

                {/* SCHEDULING CONTROL BAR (MODERN CLEAN BUFFER STYLE) */}
                <div className="space-y-3 pt-3 border-t border-[#F0ECE6]">
                  {/* Mode Selector - Clean Segmented Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium text-[11px]">
                        Opsi Publikasi
                      </span>
                    </div>

                    <div className="grid grid-cols-3 p-1 bg-stone-100/90 rounded-xl border border-stone-200/70 gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setIgMode('shareNow')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                          igMode === 'shareNow'
                            ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>Post Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIgMode('customScheduled')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                          igMode === 'customScheduled'
                            ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Schedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIgMode('addToQueue')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                          igMode === 'addToQueue'
                            ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
                          <line x1="3" y1="12" x2="3.01" y2="12" />
                          <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        <span>Antrean</span>
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Picker Area (When Schedule is Selected) */}
                  {igMode === 'customScheduled' && (
                    <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7E1] space-y-2.5 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>Pilih Tanggal & Waktu</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={igScheduleDate}
                          onChange={(e) => setIgScheduleDate(e.target.value)}
                          className="bg-white border border-[#EBE5D8] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2623] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E3B24]/20 focus:border-[#8E3B24] transition-all cursor-pointer shadow-2xs"
                        />
                      </div>

                      {/* Quick Schedule Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#EFEBE4]">
                        <span className="text-[11px] text-stone-400 font-medium mr-0.5">Preset:</span>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(1, 11, 30)}
                          className="text-[11px] bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-stone-300 px-2.5 py-1 rounded-lg text-stone-700 hover:text-stone-900 transition-all cursor-pointer font-medium shadow-2xs"
                        >
                          Besok 11:30
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(1, 17, 0)}
                          className="text-[11px] bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-stone-300 px-2.5 py-1 rounded-lg text-stone-700 hover:text-stone-900 transition-all cursor-pointer font-medium shadow-2xs"
                        >
                          Besok 17:00
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule(2, 11, 0)}
                          className="text-[11px] bg-white hover:bg-stone-50 border border-stone-200/90 hover:border-stone-300 px-2.5 py-1 rounded-lg text-stone-700 hover:text-stone-900 transition-all cursor-pointer font-medium shadow-2xs"
                        >
                          +2 Hari 11:00
                        </button>
                      </div>
                    </div>
                  )}

                  {igMode === 'shareNow' && (
                    <div className="flex items-start gap-2.5 text-xs text-amber-900/90 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl">
                      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="leading-relaxed">
                        Postingan akan langsung dipublikasikan sekarang ke Instagram <strong className="font-semibold text-amber-950">@{instagramName || 'waroengmakan123'}</strong>.
                      </span>
                    </div>
                  )}

                  {igMode === 'addToQueue' && (
                    <div className="flex items-start gap-2.5 text-xs text-stone-600 bg-[#FAF8F5] border border-[#ECE7E1] p-2.5 rounded-xl">
                      <svg className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="leading-relaxed">
                        Mengikuti slot jadwal otomatis berikutnya yang sudah ditentukan di akun Buffer Anda.
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(editableIG, 'ig')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'ig' ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-emerald-700 font-medium">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPublishing === 'instagram'}
                      onClick={() => handleSendToBuffer('instagram')}
                      className="inline-flex items-center gap-2 bg-[#8E3B24] hover:bg-[#78301B] active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isPublishing === 'instagram' ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : igMode === 'shareNow' ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span>Posting Sekarang</span>
                        </>
                      ) : igMode === 'customScheduled' ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Jadwalkan ke Instagram</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          <span>Masukkan Antrean</span>
                        </>
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
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'tt' ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-emerald-700 font-medium">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Salin</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isPublishing === 'tiktok'}
                    onClick={() => handleSendToBuffer('tiktok')}
                    className="inline-flex items-center gap-2 bg-[#2C2623] hover:bg-black active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPublishing === 'tiktok' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span>Kirim ke Buffer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: WHATSAPP BROADCAST & STATUS (FONNTE POWERED) */}
            <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2.5">
                <div className="flex items-center gap-2.5 text-xs xl:text-sm font-bold text-[#2C2623]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <span>WhatsApp Broadcast & Status</span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          fonnteStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={
                          fonnteStatus?.connected
                            ? 'text-emerald-700 font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {fonnteStatus?.connected
                          ? `${fonnteStatus.device || '081213517208'} (Device Online · Kuota: ${
                              fonnteStatus.quota || '1000'
                            })`
                          : 'Perangkat belum tersambung (Scan QR di Fonnte)'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingWA(!isEditingWA)}
                  className="text-[11px] text-[#736D69] hover:text-[#8E3B24] font-medium cursor-pointer"
                >
                  {isEditingWA ? 'Selesai' : 'Edit'}
                </button>
              </div>

              {/* Message Content Preview / Textarea */}
              <div className="bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6]">
                {isEditingWA ? (
                  <textarea
                    rows={5}
                    value={editableWA}
                    onChange={(e) => setEditableWA(e.target.value)}
                    className="w-full bg-transparent text-xs xl:text-sm text-[#2C2623] leading-relaxed focus:outline-none resize-none"
                  />
                ) : (
                  <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed whitespace-pre-line">
                    {editableWA}
                  </p>
                )}
              </div>

              {/* WhatsApp Controls & Delivery Option */}
              <div className="space-y-3 pt-2 border-t border-[#F0ECE6]">
                {/* Mode Selector - Clean Segmented Control */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-stone-500 font-medium text-[11px]">
                    Target Pengiriman:
                  </span>
                  <div className="grid grid-cols-2 p-1 bg-stone-100/90 rounded-xl border border-stone-200/70 gap-1 text-xs sm:w-80">
                    <button
                      type="button"
                      onClick={() => {
                        setWaMode('single');
                        setWaTarget('081213517208');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                        waMode === 'single'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Nomor Resto (Tes)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWaMode('broadcast');
                        if (waTarget === '081213517208') {
                          setWaTarget('081213517208, 085712345678');
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                        waMode === 'broadcast'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-semibold'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Broadcast Multi-Nomor</span>
                    </button>
                  </div>
                </div>

                {/* Target Input */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE7E1] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                      <span>{waMode === 'single' ? 'Nomor Penerima WhatsApp:' : 'Daftar Nomor Pelanggan (Pisahkan dengan koma):'}</span>
                    </label>
                    <input
                      type="text"
                      value={waTarget}
                      onChange={(e) => setWaTarget(e.target.value)}
                      placeholder="08123456789 atau multi-nomor: 0812xx,0857xx"
                      className="bg-white border border-[#EBE5D8] rounded-xl px-3 py-1.5 text-xs text-[#2C2623] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:w-80 shadow-2xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#EFEBE4]">
                    <span className="text-[11px] text-stone-400 font-medium mr-0.5">Shortcut:</span>
                    <button
                      type="button"
                      onClick={() => setWaTarget('081213517208')}
                      className="text-[11px] bg-white hover:bg-stone-50 border border-stone-200/90 px-2.5 py-0.5 rounded-lg text-stone-700 transition-all cursor-pointer font-medium shadow-2xs"
                    >
                      Nomor Resto (081213517208)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaTarget('081213517208, 085712345678')}
                      className="text-[11px] bg-white hover:bg-stone-50 border border-stone-200/90 px-2.5 py-0.5 rounded-lg text-stone-700 transition-all cursor-pointer font-medium shadow-2xs"
                    >
                      Multi-Nomor (Contoh)
                    </button>
                  </div>
                </div>

                {/* Helpful note for WhatsApp Status / Story */}
                <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 border border-stone-200/80 px-3 py-2 rounded-xl">
                  <span>
                    💡 <strong>Tips Story WhatsApp:</strong> Klik <em>Salin</em> lalu buka WA Web untuk menempelkan teks promosi ini langsung ke Status Anda.
                  </span>
                  <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-semibold shrink-0 ml-2"
                  >
                    Buka Status WA ↗
                  </a>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(editableWA, 'wa')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'wa' ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-emerald-700 font-medium">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(editableWA)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1.5 transition-all"
                      title="Buka secara manual di Web WhatsApp"
                    >
                      <span>Buka Chat WA</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  </div>

                  <button
                    type="button"
                    disabled={isPublishing === 'whatsapp'}
                    onClick={handleSendToWhatsApp}
                    className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPublishing === 'whatsapp' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mengirim via Fonnte...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Kirim Pesan via Fonnte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
