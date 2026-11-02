'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/adminConfig';

type FooterProps = {
  restoName?: string;
  address?: string;
  phone?: string;
  operatingHours?: { open: string; close: string };
};

export default function Footer({
  restoName = 'WaroengMakan123',
  address = 'Jl. Kuliner No. 12, Purwokerto',
  phone = '081234567890',
  operatingHours,
}: FooterProps) {
  const router = useRouter();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [secretRedirecting, setSecretRedirecting] = useState(false);

  const openTime = (operatingHours?.open || '10:00').slice(0, 5);
  const closeTime = (operatingHours?.close || '21:00').slice(0, 5);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
      setSecretRedirecting(true);
      setTimeout(() => {
        router.push(ADMIN_BASE_PATH);
      }, 700);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);
  };

  return (
    <footer className="bg-[#1F0A10] text-[#C2B2B6] pt-14 pb-10 border-t border-[#33161F] relative">
      {/* Secret redirect HUD */}
      {secretRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1F0A10] border border-[#800020]/50 p-6 rounded-3xl shadow-2xl text-center max-w-xs mx-4 text-white space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#800020]/30 border border-[#800020] flex items-center justify-center mx-auto text-rose-400">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-widest text-[#D45060] font-bold uppercase">
                Akses Khusus Terdeteksi
              </p>
              <h3 className="text-base font-black text-[#FFF9F2] mt-0.5">
                Membuka Portal Terenkripsi
              </h3>
              <p className="text-xs text-[#C2B2B6] mt-1 font-mono text-[11px]">
                Mengalihkan ke konsol rahasia...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#33161F]">
          {/* Brand & Tagline */}
          <div className="md:col-span-5 space-y-3.5">
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer select-none group w-fit"
              title={restoName}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-xs border border-white/20 shrink-0 group-active:scale-95 transition-transform">
                <Image
                  src="/logo.png"
                  alt={restoName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-black text-[#FFF9F2] tracking-tight group-hover:text-rose-200 transition-colors">
                {restoName}
              </span>
            </div>
            <p className="text-xs text-[#A89297] leading-relaxed max-w-sm">
              Warung makan prasmanan dengan konsep modern yang menyediakan makanan dengan berbagai macam resep rempah Nusantara autentik. Ambil sendiri lauk favoritmu, higienis, enak, dan ramah di kantong setiap hari.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#2D1219] px-3 py-1.5 rounded-full text-[11px] font-bold text-[#F3E6D5] border border-[#4A1E27]">
              <span className="w-2 h-2 rounded-full bg-[#D45060]" />
              Buka {openTime} - {closeTime} WIB
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold text-[#FFF9F2] uppercase tracking-wider">Navigasi Cepat</p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#menu" className="hover:text-[#D45060] transition-colors">Katalog Menu Prasmanan</a>
              </li>
              <li>
                <a href="#katering" className="hover:text-[#D45060] transition-colors">Katering & Nasi Box</a>
              </li>
              <li>
                <a href="#locations" className="hover:text-[#D45060] transition-colors">Lokasi & Jam Buka</a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#D45060] transition-colors">Tentang Restoran</a>
              </li>
            </ul>
          </div>

          {/* Kontak & Lokasi */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-bold text-[#FFF9F2] uppercase tracking-wider">Kontak & Alamat</p>
            <p className="text-xs text-[#A89297] leading-relaxed">
              📍 {address}
            </p>
            {cleanPhone && (
              <div>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#D45060] hover:text-white bg-[#2D1219] hover:bg-[#3D1820] px-3.5 py-2 rounded-xl transition-colors border border-[#4A1E27]"
                >
                  <span>💬</span>
                  <span>WhatsApp: {phone}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8C777D]">
          <p>&copy; {new Date().getFullYear()} {restoName}. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Sistem Kasir & Prasmanan Modern</span>
            <span className="text-[#8C777D]/70">• Cita Rasa Nusantara Autentik</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
