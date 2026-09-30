import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  const openTime = (operatingHours?.open || '10:00').slice(0, 5);
  const closeTime = (operatingHours?.close || '21:00').slice(0, 5);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  return (
    <footer className="bg-[#20251C] text-[#9EA695] pt-14 pb-10 border-t border-[#2F3628]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#2F3628]">
          {/* Brand & Tagline */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-xs border border-white/20 shrink-0">
                <Image
                  src="/logo.png"
                  alt={restoName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-black text-[#F7F2EB] tracking-tight">{restoName}</span>
            </div>
            <p className="text-xs text-[#8A9281] leading-relaxed max-w-sm">
              Warung makan prasmanan dengan konsep modern yang menyediakan makanan dengan berbagai macam resep rempah Nusantara autentik. Ambil sendiri lauk favoritmu, higienis, enak, dan ramah di kantong setiap hari.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#293023] px-3 py-1.5 rounded-full text-[11px] font-bold text-[#EAE2D6]">
              <span className="w-2 h-2 rounded-full bg-[#8B9A6E]" />
              Buka {openTime} - {closeTime} WIB
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold text-[#F7F2EB] uppercase tracking-wider">Navigasi Cepat</p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#menu" className="hover:text-[#8B9A6E] transition-colors">Katalog Menu Prasmanan</a>
              </li>
              <li>
                <a href="#katering" className="hover:text-[#8B9A6E] transition-colors">Katering & Nasi Box</a>
              </li>
              <li>
                <a href="#locations" className="hover:text-[#8B9A6E] transition-colors">Lokasi & Jam Buka</a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#8B9A6E] transition-colors">Tentang Restoran</a>
              </li>
            </ul>
          </div>

          {/* Kontak & Lokasi */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-bold text-[#F7F2EB] uppercase tracking-wider">Kontak & Alamat</p>
            <p className="text-xs text-[#8A9281] leading-relaxed">
              📍 {address}
            </p>
            {cleanPhone && (
              <div>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#8B9A6E] hover:text-white bg-[#293023] hover:bg-[#343D2D] px-3.5 py-2 rounded-xl transition-colors border border-[#3C4733]"
                >
                  <span>💬</span>
                  <span>WhatsApp: {phone}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71796B]">
          <p>&copy; {new Date().getFullYear()} {restoName}. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Sistem Kasir & Prasmanan Modern</span>
            <Link href="/admin" className="hover:text-[#8B9A6E] text-[#8A9281] transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
