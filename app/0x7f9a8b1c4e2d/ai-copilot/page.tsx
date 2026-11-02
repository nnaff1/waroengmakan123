'use client';

import React, { useState } from 'react';

export default function AICopilotPage() {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI Berhasil meracik draf promo terbaru!');
    }, 1000);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10 text-[#2C2623] p-2 sm:p-4 xl:p-6">
      {/* HEADER PAGE */}
      <div className="border-b border-[#EBE5D8] pb-4">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight text-[#2C2623]">
          AI Marketing Copilot
        </h1>
        <p className="text-xs xl:text-sm 2xl:text-base text-[#736D69] mt-1">
          Generate promos, analyze reviews, and optimize your menu with AI assistant.
        </p>
      </div>

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
                  className="w-full bg-[#FAF8F5] border border-[#ECE7E1] rounded-2xl p-3.5 xl:p-4 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#8E3B24] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 xl:px-8 py-2.5 xl:py-3 rounded-full text-xs xl:text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? 'Memproses...' : 'Generate Promo AI'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Suggestions Cards */}
          <div className="space-y-3 xl:space-y-4">
            <span className="text-[11px] xl:text-xs font-bold text-[#938C87] uppercase tracking-wider block px-1">
              AI Suggestions
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
              {/* Instagram Caption */}
              <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-3 xl:space-y-4">
                <div className="flex items-center gap-2 text-xs xl:text-sm font-bold text-[#2C2623]">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  <span>Instagram Caption</span>
                </div>
                <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6]">
                  Nikmati akhir pekan seru bareng keluarga di WaroengMakan123! 🎉 Dapatkan diskon 20% untuk semua menu keluarga khusus Sabtu-Minggu ini. Yuk, buruan reservasi tempatmu sekarang! 👇
                  <br /><br />
                  <span className="text-[#8E3B24] font-medium">#WaroengMakan123 #PromoKeluarga #KulinerNusantara</span>
                </p>
              </div>

              {/* WhatsApp Broadcast */}
              <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs space-y-3 xl:space-y-4">
                <div className="flex items-center gap-2 text-xs xl:text-sm font-bold text-[#2C2623]">
                  <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>WhatsApp Broadcast</span>
                </div>
                <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed bg-[#FAF8F5] p-3.5 xl:p-4 rounded-2xl border border-[#F0ECE6]">
                  Halo Sahabat Waroeng! 👋 Ada kabar gembira nih untuk akhir pekanmu. Khusus Sabtu & Minggu ini, nikmati Promo Spesial Keluarga dengan diskon 20% all items! 🍱✨
                  <br /><br />
                  Klik link di bawah untuk reservasi ya! Jangan sampai kehabisan meja! 😋👇
                </p>
              </div>
            </div>

            {/* Bundling Idea */}
            <div className="bg-white rounded-3xl p-5 xl:p-7 border border-[#EBE5D8] shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs xl:text-sm font-bold text-[#2C2623]">Menu Bundling Idea</h4>
                <p className="text-xs xl:text-sm text-[#524D4A] mt-1 leading-relaxed">
                  Berdasarkan tren pesanan, kami sarankan membuat paket:{' '}
                  <strong className="text-[#8E3B24]">&apos;Paket Hemat Dimsum Kukus + Mochi Aneka Rasa&apos;</strong>{' '}
                  sebagai penutup makan siang.
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