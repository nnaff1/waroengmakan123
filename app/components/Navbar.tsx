// app/components/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { scrollToElement } from '@/lib/smoothScroll';
import { ADMIN_BASE_PATH } from '@/lib/adminConfig';

interface NavbarProps {
  restoName?: string;
  phone?: string;
}

const NAV_ITEMS = [
  { id: 'menu', label: 'Menu Prasmanan' },
  { id: 'katering', label: 'Katering & Nasi Box' },
  { id: 'locations', label: 'Lokasi Outlet' },
  { id: 'about', label: 'Tentang Kami' },
];

export default function Navbar({ restoName = 'WaroengMakan123', phone }: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [secretRedirecting, setSecretRedirecting] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 30);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / totalHeight) * 100)));
      }

      // Deteksi section aktif hanya jika pengguna tidak sedang dalam animasi klik navbar
      if (!isNavigatingRef.current) {
        if (currentScrollY < 120) {
          setActiveSection('');
          return;
        }

        const sections = ['menu', 'katering', 'locations', 'about'];
        const navClearance = 120;
        let matched = '';

        for (const id of sections) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= navClearance && rect.bottom > navClearance) {
              matched = id;
            }
          }
        }

        // Jika sudah scroll sampai paling bawah halaman, sorot section terakhir
        if (window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 60) {
          matched = 'about';
        }

        setActiveSection(matched);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    setActiveSection(targetId === 'top' ? '' : targetId);
    isNavigatingRef.current = true;

    const navOffset = isScrolled ? 76 : 84;
    scrollToElement(targetId, {
      duration: 700,
      offset: navOffset,
      highlight: false,
      onComplete: () => {
        isNavigatingRef.current = false;
      },
    });

    // Fallback timer untuk memastikan flag navigasi selalu di-reset
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 850);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      e.preventDefault();
      e.stopPropagation();
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

    scrollToSection(e, 'top');
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 ease-out">
      {/* Scroll Reading Progress Bar (Burgundy to Rose gradient) */}
      <div
        className="h-[2.5px] bg-gradient-to-r from-[#800020] via-[#D45060] to-[#800020] transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className={`transition-all duration-300 ease-out ${isScrolled ? 'px-3 sm:px-6 pt-2 pb-1' : 'px-0 pt-0 pb-0'}`}>
        <div
          className={`mx-auto transition-all duration-300 ease-out flex items-center justify-between ${
            isScrolled
              ? 'max-w-6xl py-2.5 px-4 sm:px-6 bg-[#FFF9F2]/95 backdrop-blur-xl rounded-2xl border border-[#F3E6D5] shadow-[0_10px_30px_rgba(45,21,27,0.08)]'
              : 'max-w-7xl py-3.5 px-4 sm:px-6 lg:px-8 bg-[#FFF9F2]/85 backdrop-blur-md border border-b-[#F3E6D5]/80 border-t-transparent border-x-transparent rounded-none shadow-none'
          }`}
        >
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 sm:gap-3 group active:scale-[0.98] transition-transform duration-150"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-xs border border-[#800020]/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Image
                src="/logo.png"
                alt={restoName}
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-[#2D151B] tracking-tight block leading-tight">
                {restoName}
              </span>
              <span className="text-[10px] font-bold text-[#800020] uppercase tracking-wider block">
                Prasmanan Nusantara
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`relative py-2 px-3.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center select-none active:scale-95 ${
                    isActive
                      ? 'text-[#800020] font-bold bg-[#800020]/10 shadow-2xs ring-1 ring-[#800020]/25'
                      : 'text-[#735A60] font-semibold hover:text-[#2D151B] hover:bg-[#F3E6D5]/50'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* Subtle active pill indicator at the bottom edge */}
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-[#800020] transition-all duration-300 ease-out ${
                      isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Tombol Aksi Kontak & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs font-bold text-white bg-[#800020] hover:bg-[#66001A] rounded-full transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${
                  isScrolled ? 'px-3.5 py-2' : 'px-4 py-2 sm:py-2.5'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.069-2.023-.482-1.616-.672-2.65-2.316-2.731-2.424-.081-.108-.654-.871-.654-1.662 0-.791.414-1.179.562-1.339.148-.16.323-.2.431-.2.108 0 .216.002.311.007.1.005.234-.038.366.279.135.324.46 1.125.5 1.206.04.081.067.176.013.283-.054.108-.081.176-.162.27-.081.094-.171.21-.244.282-.081.08-.166.167-.071.33.095.162.42 6.94 1.488 7.892 1.378 1.229 2.54 1.613 2.901 1.776.36.163.57.135.782-.108.212-.243.909-1.06 1.15-1.424.24-.364.48-.303.805-.182.324.121 2.056.97 2.408 1.146.351.175.586.262.672.411.085.148.085.861-.059 1.266z" />
                </svg>
                <span>Hubungi Kami</span>
              </a>
            )}

            {/* Smooth Animated Hamburger / Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation"
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl text-[#2D151B] hover:bg-[#F3E6D5]/60 transition-colors"
            >
              <span
                className={`w-5 h-0.5 bg-[#2D151B] rounded-full transition-all duration-300 transform origin-center ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[#2D151B] rounded-full transition-all duration-200 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[#2D151B] rounded-full transition-all duration-300 transform origin-center ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
          } ${isScrolled ? 'max-w-6xl mx-auto' : 'w-full'}`}
        >
          <div className="border border-[#F3E6D5] bg-[#FFF9F2]/95 backdrop-blur-xl px-5 py-4 rounded-2xl flex flex-col gap-1.5 shadow-xl">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer select-none active:scale-[0.98] ${
                    isActive
                      ? 'text-[#800020] bg-[#800020]/10 font-bold ring-1 ring-[#800020]/25'
                      : 'text-[#735A60] hover:text-[#2D151B] hover:bg-[#F3E6D5]/40'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full bg-[#D45060] transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-100 shadow-[0_0_6px_rgba(212,80,96,0.6)]' : 'opacity-0 scale-0'
                    }`}
                  />
                </a>
              );
            })}
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#800020] hover:text-[#66001A] pt-2.5 mt-1 border-t border-[#F3E6D5] flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.069-2.023-.482-1.616-.672-2.65-2.316-2.731-2.424-.081-.108-.654-.871-.654-1.662 0-.791.414-1.179.562-1.339.148-.16.323-.2.431-.2.108 0 .216.002.311.007.1.005.234-.038.366.279.135.324.46 1.125.5 1.206.04.081.067.176.013.283-.054.108-.081.176-.162.27-.081.094-.171.21-.244.282-.081.08-.166.167-.071.33.095.162.42 6.94 1.488 7.892 1.378 1.229 2.54 1.613 2.901 1.776.36.163.57.135.782-.108.212-.243.909-1.06 1.15-1.424.24-.364.48-.303.805-.182.324.121 2.056.97 2.408 1.146.351.175.586.262.672.411.085.148.085.861-.059 1.266z" />
                </svg>
                <span>WhatsApp: {phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Secret Encrypted Portal Redirect HUD */}
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
                Akses Khusus Terdeteksi (3x Klik)
              </p>
              <h3 className="text-base font-black text-[#FFF9F2] mt-0.5">
                Membuka Portal Terenkripsi
              </h3>
              <p className="text-xs text-[#C2B2B6] mt-1 font-mono text-[11px]">
                Mengalihkan ke konsol rahasia...
              </p>
            </div>
            <div className="w-full bg-[#33161F] h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#800020] to-[#D45060] h-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}