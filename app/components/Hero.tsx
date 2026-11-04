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
    <section className="relative isolate overflow-hidden w-full py-12 sm:py-18 md:py-24 border-b border-[#F3E6D5] bg-[#FFF9F2]">
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
        {/* Layer Overlay: hangat & elegan agar makanan lezat terlihat jelas di sisi kanan & teks terbaca tajam di sisi kiri */}
        <div className="absolute inset-0 bg-[#FFF9F2]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F2]/95 via-[#FFF9F2]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF9F2]/60 via-transparent to-[#FFF9F2]" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6">
          {/* Status Jam Buka */}
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md border border-[#F3E6D5] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2D151B] shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-[#800020] animate-pulse' : 'bg-[#D45060]'}`} />
            {isOpen ? (
              <span>Buka Hari Ini: <strong className="text-[#2D151B]">{openTime} - {closeTime} WIB</strong></span>
            ) : (
              <span>Tutup Sementara • Buka Pukul <strong className="text-[#2D151B]">{openTime} WIB</strong></span>
            )}
          </div>

          {/* Headline Prasmanan */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-[#2D151B]">
              Sensasi Prasmanan Nusantara, <br />
              <span className="text-[#800020]">Bebas Pilih Sesuka Hati.</span>
            </h1>
            <p className="text-[#735A60] text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Ambil piringmu dan tentukan sendiri kombinasi lauk pauk favoritmu di <strong className="text-[#2D151B] font-bold">{restoName}</strong>. 
              Diracik setiap hari dengan rempah autentik Nusantara, higienis, dan harga bersahabat.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <a
              href="#menu"
              onClick={(e) => {
                e.preventDefault();
                scrollToElement('menu');
              }}
              className="bg-[#800020] hover:bg-[#66001A] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              Lihat Menu Prasmanan
            </a>
            <a
              href="#katering"
              onClick={(e) => {
                e.preventDefault();
                scrollToElement('katering');
              }}
              className="bg-[#F3E6D5] hover:bg-[#E5D3BE] text-[#2D151B] border border-[#E5D3BE] px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>📦</span>
              Pesanan Katering & Nasi Box
            </a>
          </div>

          {/* Mini Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#F3E6D5]">
            <div>
              <span className="block text-base sm:text-lg font-black text-[#2D151B]">100% Halal</span>
              <span className="text-[11px] text-[#735A60] font-medium">Bahan Segar Alami</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-[#800020]">Prasmanan</span>
              <span className="text-[11px] text-[#735A60] font-medium">Ambil Sendiri Laukmu</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-black text-[#800020]">4.9 / 5.0</span>
              <span className="text-[11px] text-[#735A60] font-medium">1.200+ Ulasan Puas</span>
            </div>
          </div>
        </div>

        {/* Visual Brand Logo Showcase */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#800020]/25 via-[#D45060]/15 to-transparent rounded-3xl filter blur-3xl opacity-70 pointer-events-none" />

          {/* Black Glass Card Container (50% Opacity) */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] w-full border border-white/25 bg-black/50 backdrop-blur-xl flex flex-col items-center justify-center p-6 pb-16 sm:pb-20 group">
            {/* Top glass reflection line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Subtle decorative concentric rings */}
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute w-84 h-84 sm:w-96 sm:h-96 rounded-full border border-white/10 pointer-events-none" />

            {/* Brand Logo Circular Emblem */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-2xl border-4 border-white/90 bg-white group-hover:scale-105 transition-transform duration-500 shrink-0 ring-4 ring-white/10">
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
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-xl p-3.5 rounded-2xl shadow-lg flex items-center justify-between border border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D45060] shadow-[0_0_8px_#D45060] animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">Prasmanan Fresh Dari Dapur</span>
              </div>
              {address && (
                <a href="https://www.google.com/maps/place/Warung+Makan+123/@-7.398786,109.2354923,17z/data=!3m1!4b1!4m6!3m5!1s0x2e655fa3ccb4c185:0xf0395c10eac9f13d!8m2!3d-7.398786!4d109.2354923!16s%2Fg%2F11fls1wzq7" target="_blank" rel="noopener noreferrer" title="Buka di Google Maps" className="inline-flex items-center gap-1.5 text-[11px] text-[#F3E6D5] hover:text-white font-medium hidden sm:inline-flex truncate max-w-[240px] transition-colors">
                  <svg className="w-3.5 h-3.5 text-[#D45060] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{address}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}