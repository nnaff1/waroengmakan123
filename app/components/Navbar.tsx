// app/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  restoName?: string;
  phone?: string;
}

export default function Navbar({ cartCount, onOpenCart, restoName = 'WaroengMakan123', phone }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5DEC9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#8E3B24] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
            WM
          </div>
          <div>
            <span className="text-xl font-black text-[#2C2623] tracking-tight block leading-tight">
              {restoName}
            </span>
            <span className="text-[10px] font-bold text-[#4E6148] uppercase tracking-wider block">
              Prasmanan Nusantara
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-[#554F4C]">
          <a href="#menu" className="hover:text-[#8E3B24] transition-colors py-1">Menu Prasmanan</a>
          <a href="#katering" className="hover:text-[#8E3B24] transition-colors py-1">Katering & Nasi Box</a>
          <a href="#locations" className="hover:text-[#8E3B24] transition-colors py-1">Lokasi Outlet</a>
          <a href="#about" className="hover:text-[#8E3B24] transition-colors py-1">Tentang Kami</a>
        </nav>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-2.5">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#4E6148] hover:text-[#3A4836] bg-[#EAE5D8]/60 hover:bg-[#EAE5D8] px-3.5 py-2 rounded-full border border-[#DCD5C3] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.069-2.023-.482-1.616-.672-2.65-2.316-2.731-2.424-.081-.108-.654-.871-.654-1.662 0-.791.414-1.179.562-1.339.148-.16.323-.2.431-.2.108 0 .216.002.311.007.1.005.234-.038.366.279.135.324.46 1.125.5 1.206.04.081.067.176.013.283-.054.108-.081.176-.162.27-.081.094-.171.21-.244.282-.081.08-.166.167-.071.33.095.162.42 6.94 1.488 7.892 1.378 1.229 2.54 1.613 2.901 1.776.36.163.57.135.782-.108.212-.243.909-1.06 1.15-1.424.24-.364.48-.303.805-.182.324.121 2.056.97 2.408 1.146.351.175.586.262.672.411.085.148.085.861-.059 1.266z" />
              </svg>
              <span>Hubungi Kami</span>
            </a>
          )}

          <button
            onClick={onOpenCart}
            className="relative bg-[#8E3B24] hover:bg-[#78301B] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Pesanan</span>
            {cartCount > 0 && (
              <span className="bg-white text-[#8E3B24] text-[11px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
            className="md:hidden p-2 text-[#2C2623] rounded-xl hover:bg-[#EAE5D8]"
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
      </div>

      {isMobileMenuOpen && (
        <div className="border-b border-[#E5DEC9] bg-[#FAF8F5] px-6 py-5 flex flex-col gap-3.5 md:hidden shadow-lg animate-in slide-in-from-top-2">
          <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-bold text-[#554F4C] hover:text-[#8E3B24]">Menu Prasmanan</a>
          <a href="#katering" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-bold text-[#554F4C] hover:text-[#8E3B24]">Katering & Nasi Box</a>
          <a href="#locations" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-bold text-[#554F4C] hover:text-[#8E3B24]">Lokasi Outlet</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-bold text-[#554F4C] hover:text-[#8E3B24]">Tentang Waroeng</a>
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#4E6148] pt-2 border-t border-[#E5DEC9]"
            >
              WhatsApp: {phone}
            </a>
          )}
        </div>
      )}
    </header>
  );
}