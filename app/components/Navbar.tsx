// app/components/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { scrollToElement } from '@/lib/smoothScroll';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [clickedTarget, setClickedTarget] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / totalHeight) * 100)));
      }

      // Deteksi section aktif hanya jika pengguna tidak sedang dalam animasi klik navbar
      if (!isNavigatingRef.current) {
        const sections = ['menu', 'katering', 'locations', 'about'];
        const scrollPosition = currentScrollY + 140;

        for (let i = sections.length - 1; i >= 0; i--) {
          const sec = document.getElementById(sections[i]);
          if (sec && sec.offsetTop <= scrollPosition) {
            setActiveSection(sections[i]);
            return;
          }
        }
        if (currentScrollY < 120) {
          setActiveSection('');
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Efek tactile click feedback
    setClickedTarget(targetId);
    setActiveSection(targetId === 'top' ? '' : targetId);
    isNavigatingRef.current = true;

    setTimeout(() => {
      setClickedTarget(null);
    }, 300);

    const navOffset = isScrolled ? 80 : 90;
    scrollToElement(targetId, {
      duration: 850,
      offset: navOffset,
      highlight: true,
      onComplete: () => {
        isNavigatingRef.current = false;
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 transition-all duration-300 w-full">
      {/* Scroll Reading Progress Bar */}
      <div
        className="h-[2.5px] bg-gradient-to-r from-[#8B9A6E] via-[#A2B184] to-[#6D7C52] transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className={`transition-all duration-300 ${isScrolled ? 'px-3 sm:px-6' : 'px-0'}`}>
        <div
          className={`mx-auto transition-all duration-300 ease-out flex items-center justify-between ${
            isScrolled
              ? 'max-w-6xl mt-2 py-2.5 px-4 sm:px-6 bg-[#F7F2EB]/90 backdrop-blur-xl rounded-2xl border border-[#EAE2D6] shadow-[0_10px_30px_rgba(42,47,35,0.06)]'
              : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4.5 bg-[#F7F2EB]/80 backdrop-blur-md border-b border-[#EAE2D6]/80 rounded-none shadow-none'
          }`}
        >
          <Link
            href="/"
            onClick={(e) => scrollToSection(e, 'top')}
            className="flex items-center gap-3 group active:scale-98 transition-transform"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-xs border border-[#8B9A6E]/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
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
              <span className="text-lg sm:text-xl font-black text-[#2A2F23] tracking-tight block leading-tight">
                {restoName}
              </span>
              <span className="text-[10px] font-bold text-[#8B9A6E] uppercase tracking-wider block">
                Prasmanan Nusantara
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 text-xs font-bold">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const isClicked = clickedTarget === item.id;

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`relative py-1.5 px-3.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                    isClicked ? 'scale-90 opacity-90' : 'hover:scale-102'
                  } ${
                    isActive
                      ? 'text-[#2A2F23] bg-[#8B9A6E]/18 font-extrabold shadow-2xs ring-1 ring-[#8B9A6E]/40'
                      : 'text-[#5C6353] hover:text-[#2A2F23] hover:bg-[#EAE2D6]/50'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B9A6E] animate-pulse shrink-0" />
                  )}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Tombol Aksi Kontak */}
          <div className="flex items-center gap-2.5">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B9A6E] hover:bg-[#728157] rounded-full transition-all duration-300 shadow-xs active:scale-95 ${
                  isScrolled ? 'px-3.5 py-2' : 'px-4 py-2.5'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.069-2.023-.482-1.616-.672-2.65-2.316-2.731-2.424-.081-.108-.654-.871-.654-1.662 0-.791.414-1.179.562-1.339.148-.16.323-.2.431-.2.108 0 .216.002.311.007.1.005.234-.038.366.279.135.324.46 1.125.5 1.206.04.081.067.176.013.283-.054.108-.081.176-.162.27-.081.094-.171.21-.244.282-.081.08-.166.167-.071.33.095.162.42 6.94 1.488 7.892 1.378 1.229 2.54 1.613 2.901 1.776.36.163.57.135.782-.108.212-.243.909-1.06 1.15-1.424.24-.364.48-.303.805-.182.324.121 2.056.97 2.408 1.146.351.175.586.262.672.411.085.148.085.861-.059 1.266z" />
                </svg>
                <span>Hubungi Kami</span>
              </a>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation"
              className="md:hidden p-2 text-[#2A2F23] rounded-xl hover:bg-[#EAE2D6] transition-colors"
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            className={`transition-all duration-300 ${
              isScrolled ? 'max-w-6xl mx-auto mt-2 rounded-2xl' : 'w-full'
            } border border-[#EAE2D6] bg-[#F7F2EB]/95 backdrop-blur-xl px-6 py-5 flex flex-col gap-2 md:hidden shadow-xl animate-in slide-in-from-top-2`}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const isClicked = clickedTarget === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isClicked ? 'scale-95 bg-[#8B9A6E]/20' : 'active:scale-98'
                  } ${
                    isActive
                      ? 'text-[#2A2F23] bg-[#8B9A6E]/18 font-extrabold'
                      : 'text-[#5C6353] hover:text-[#2A2F23] hover:bg-[#EAE2D6]/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#8B9A6E] animate-ping" />
                  )}
                </a>
              );
            })}
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#8B9A6E] pt-2 border-t border-[#EAE2D6]"
              >
                WhatsApp: {phone}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}