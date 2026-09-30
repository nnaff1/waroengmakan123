import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { scrollToElement } from '@/lib/smoothScroll';

type HeroProps = {
  operatingHours?: { open: string; close: string };
  restoName?: string;
  address?: string;
};

export default function Hero({ operatingHours, restoName = 'WaroengMakan123', address }: HeroProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format jam buka tanpa detik (misal '10:00:00' -> '10:00')
  const openTime = (operatingHours?.open || '10:00').slice(0, 5);
  const closeTime = (operatingHours?.close || '21:00').slice(0, 5);

  // Status buka/tutup dinamis
  const isOpen = useMemo(() => {
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [oH, oM] = openTime.split(':').map(Number);
      const [cH, cM] = closeTime.split(':').map(Number);
      const openMinutes = (oH || 0) * 60 + (oM || 0);
      const closeMinutes = (cH || 0) * 60 + (cM || 0);
      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch {
      return true;
    }
  }, [openTime, closeTime]);

  return (
    <section className="relative isolate overflow-hidden w-full py-12 sm:py-18 md:py-24 border-b border-[#EAE2D6] bg-[#F7F2EB]">
      {/* LATAR BELAKANG GAMBAR MENU MAKANAN (OPASITAS 80% & PARALLAX SCROLL DEPTH) */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none will-change-transform transition-transform duration-75 ease-out"
        style={{ transform: `translate3d(0, ${Math.min(scrollY * 0.22, 120)}px, 0)` }}
      >
        <Image
          src="/hero-bg.jpg"
          alt="Latar Belakang Menu Prasmanan"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-110 filter blur-[6px] opacity-80 contrast-[1.04] brightness-[0.98] transform-gpu"
        />
        {/* Layer Overlay: lembut & hangat agar makanan lezat terlihat jelas di sisi kanan & teks terbaca tajam di sisi kiri */}
        <div className="absolute inset-0 bg-[#F7F2EB]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F2EB]/95 via-[#F7F2EB]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F2EB]/60 via-transparent to-[#F7F2EB]" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6">
          {/* Status Jam Buka */}
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md border border-[#EAE2D6] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2A2F23] shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-[#8B9A6E] animate-pulse' : 'bg-amber-600'}`} />
            {isOpen ? (
              <span>Buka Hari Ini: <strong className="text-[#2A2F23]">{openTime} - {closeTime} WIB</strong></span>
            ) : (
              <span>Tutup Sementara • Buka Pukul <strong className="text-[#2A2F23]">{openTime} WIB</strong></span>
            )}
          </div>

          {/* Headline Prasmanan */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-[#2A2F23]">
              Sensasi Prasmanan Nusantara, <br />
              <span className="text-[#8B9A6E]">Bebas Pilih Sesuka Hati.</span>
            </h1>
            <p className="text-[#5C6353] text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Ambil piringmu dan tentukan sendiri kombinasi lauk pauk favoritmu di <strong className="text-[#2A2F23] font-bold">{restoName}</strong>. 
              Diracik setiap hari dengan rempah autentik Nusantara, higienis, dan harga bersahabat.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <a
              href="#menu"
              onClick={(e) => {
                e.preventDefault();
                scrollToElement('menu', { highlight: true });
              }}
              className="bg-[#8B9A6E] hover:bg-[#728157] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              Lihat Menu Prasmanan
            </a>
            <a
              href="#katering"
              onClick={(e) => {
                e.preventDefault();
                scrollToElement('katering', { highlight: true });
              }}
              className="bg-[#EAE2D6] hover:bg-[#DDD4C7] text-[#2A2F23] border border-[#D5C9B7] px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>📦</span>
              Pesanan Katering & Nasi Box
            </a>
          </div>

          {/* Mini Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#EAE2D6]">
            <div>
              <span className="block text-base sm:text-lg font-black text-[#2A2F23]">100% Halal</span>
              <span className="text-[11px] text-[#686E60] font-medium">Bahan Segar Alami</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-[#8B9A6E]">Prasmanan</span>
              <span className="text-[11px] text-[#686E60] font-medium">Ambil Sendiri Laukmu</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-[#8B9A6E]">4.9 / 5.0</span>
              <span className="text-[11px] text-[#686E60] font-medium">1.200+ Ulasan Puas</span>
            </div>
          </div>
        </div>

        {/* Visual Brand Logo Showcase */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8B9A6E]/20 via-[#EAE2D6]/40 to-transparent rounded-3xl filter blur-2xl opacity-70 pointer-events-none" />

          <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] w-full border-4 border-white bg-gradient-to-br from-white via-[#FAF7F2] to-[#F7F2EB] flex flex-col items-center justify-center p-6 pb-16 sm:pb-20 group">
            {/* Subtle decorative concentric rings */}
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[#EAE2D6]/70 pointer-events-none" />
            <div className="absolute w-84 h-84 sm:w-96 sm:h-96 rounded-full border border-[#EAE2D6]/40 pointer-events-none" />

            {/* Brand Logo Circular Emblem */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-md border-3 border-white bg-white group-hover:scale-105 transition-transform duration-500 shrink-0">
              <Image
                src="/logo.png"
                alt={restoName}
                fill
                priority
                sizes="(max-width: 640px) 176px, 224px"
                className="object-contain p-2"
              />
            </div>

            {/* Floating Info Pill at bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-md flex items-center justify-between border border-[#EAE2D6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B9A6E]" />
                <span className="text-xs font-bold text-[#2A2F23]">Prasmanan Fresh Dari Dapur</span>
              </div>
              {address && (
                <span className="text-[11px] text-[#686E60] font-medium hidden sm:inline truncate max-w-[200px]">
                  📍 {address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}