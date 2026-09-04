// app/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export default function Navbar({ cartCount, onOpenCart }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#ECE7E1]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-[#8E3B24] tracking-tight">
          WaroengMakan<span className="text-[#4E6148]">123</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#554F4C]">
          <a href="#ai-matcher" className="hover:text-[#8E3B24] transition-colors">AI Matcher</a>
          <a href="#menu" className="hover:text-[#8E3B24] transition-colors">Daftar Menu</a>
          <a href="#locations" className="hover:text-[#8E3B24] transition-colors">Lokasi</a>
          <a href="#about" className="hover:text-[#8E3B24] transition-colors">Tentang Kami</a>
        </nav>

        {/* Tombol Keranjang Saja (Tombol Admin Dihilangkan) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative bg-[#8E3B24] hover:bg-[#78301B] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <span>🛒 Pesanan</span>
            {cartCount > 0 && (
              <span className="bg-white text-[#8E3B24] text-[11px] font-black px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation"
          className="md:hidden p-2 text-[#2C2623]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-b border-[#ECE7E1] bg-[#FDFBF7] px-6 py-5 flex flex-col gap-4 md:hidden shadow-lg">
          <a href="#ai-matcher" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">AI Matcher</a>
          <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">Daftar Menu</a>
          <a href="#locations" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">Lokasi Kami</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-semibold">Tentang Waroeng</a>
          <button
            onClick={() => { onOpenCart(); setIsMobileMenuOpen(false); }}
            className="bg-[#8E3B24] text-white py-2.5 rounded-full text-xs font-bold text-center mt-2"
          >
            Lihat Keranjang ({cartCount})
          </button>
        </div>
      )}
    </header>
  );
}