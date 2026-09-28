import React, { useMemo } from 'react';
import Image from 'next/image';

type HeroProps = {
  operatingHours?: { open: string; close: string };
  restoName?: string;
  address?: string;
};

export default function Hero({ operatingHours, restoName = 'WaroengMakan123', address }: HeroProps) {
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
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
      <div className="lg:col-span-6 space-y-6">
        {/* Status Jam Buka */}
        <div className="inline-flex items-center gap-2.5 bg-[#EAE5D8]/80 border border-[#DCD5C3] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#463F3A]">
          <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-[#4E6148] animate-pulse' : 'bg-amber-600'}`} />
          {isOpen ? (
            <span>Buka Hari Ini: <strong className="text-[#2C2623]">{openTime} - {closeTime} WIB</strong></span>
          ) : (
            <span>Tutup Sementara • Buka Pukul <strong className="text-[#2C2623]">{openTime} WIB</strong></span>
          )}
        </div>

        {/* Headline Prasmanan */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-[#2C2623]">
            Sensasi Prasmanan Nusantara, <br />
            <span className="text-[#8E3B24]">Bebas Pilih Sesuka Hati.</span>
          </h1>
          <p className="text-[#6C6663] text-sm sm:text-base leading-relaxed max-w-xl">
            Ambil piringmu dan tentukan sendiri kombinasi lauk pauk favoritmu di <strong className="text-[#2C2623]">{restoName}</strong>. 
            Diracik setiap hari dengan rempah autentik Nusantara, higienis, dan harga bersahabat.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 pt-1">
          <a
            href="#menu"
            className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Lihat Menu Prasmanan
          </a>
          <a
            href="#katering"
            className="bg-[#4E6148] hover:bg-[#3D4D38] text-white px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>📦</span>
            Pesanan Katering & Nasi Box
          </a>
        </div>

        {/* Mini Badges */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5DEC9]/80">
          <div>
            <span className="block text-base sm:text-lg font-black text-[#2C2623]">100% Halal</span>
            <span className="text-[11px] text-[#736D69] font-medium">Bahan Segar Alami</span>
          </div>
          <div>
            <span className="block text-base sm:text-lg font-black text-[#4E6148]">Prasmanan</span>
            <span className="text-[11px] text-[#736D69] font-medium">Ambil Sendiri Laukmu</span>
          </div>
          <div>
            <span className="block text-base sm:text-lg font-black text-[#8E3B24]">4.9 / 5.0</span>
            <span className="text-[11px] text-[#736D69] font-medium">1.200+ Ulasan Puas</span>
          </div>
        </div>
      </div>

      {/* Visual Image */}
      <div className="lg:col-span-6 relative">
        <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] w-full border-4 border-white bg-neutral-100">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
            alt="Sajian Prasmanan WaroengMakan123"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover hover:scale-103 transition-transform duration-500"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg flex items-center justify-between border border-[#E5DEC9]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4E6148]" />
              <span className="text-xs font-bold text-[#2C2623]">Prasmanan Fresh Dari Dapur</span>
            </div>
            {address && (
              <span className="text-[11px] text-[#736D69] font-medium hidden sm:inline truncate max-w-[200px]">
                📍 {address}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}