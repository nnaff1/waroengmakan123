import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-6 space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#ECE7DF] px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[#574F4A]">
          <span className="w-2 h-2 rounded-full bg-[#4E6148] animate-ping" />
          Buka Setiap Hari: 10:00 - 22:00 WIB
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
          Cita Rasa Nusantara, <br />
          <span className="text-[#8E3B24]">Sentuhan Rasa Modern.</span>
        </h1>
        <p className="text-[#6C6663] text-sm md:text-base leading-relaxed max-w-lg">
          Santap racikan bumbu rempah autentik warisan leluhur. Dibuat fresh setiap hari dengan standar higienis dapur modern dan harga ramah kantong.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href="#ai-matcher"
            className="bg-[#4E6148] hover:bg-[#3D4D38] text-white px-7 py-3.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            ✨ Rekomendasi Menu AI
          </a>
          <a
            href="#menu"
            className="border border-[#2C2623] hover:bg-[#ECE6DF] text-[#2C2623] px-7 py-3.5 rounded-full text-xs font-bold transition-all active:scale-95"
          >
            Jelajahi Menu
          </a>
        </div>
      </div>

      <div className="lg:col-span-6 relative">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] w-full border-4 border-white">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
            alt="Hidangan Tradisional Modern"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 border border-[#ECE7E1]">
            <span className="text-amber-500 font-bold">★ 4.9/5.0</span>
            <span className="text-[11px] font-medium text-[#7D7672]">| 1,200+ Ulasan Puas</span>
          </div>
        </div>
      </div>
    </section>
  );
}