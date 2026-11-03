'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ADMIN_BASE_PATH } from '@/lib/adminConfig';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_DEFAULT_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@waroengmakan123.com').toLowerCase().trim();
const ADMIN_DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PIN || '2026';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [validEmail, setValidEmail] = useState(ADMIN_DEFAULT_EMAIL);
  const [validPassword, setValidPassword] = useState(ADMIN_DEFAULT_PASSWORD);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('waroeng_admin_auth');
    const savedEmail = sessionStorage.getItem('waroeng_admin_email') || ADMIN_DEFAULT_EMAIL;
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setCurrentAdminEmail(savedEmail);
    }

    const fetchValidCredentials = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('pin_code, admin_email')
          .eq('id', 1)
          .maybeSingle();
        if (data?.pin_code) {
          setValidPassword(String(data.pin_code));
        }
        if (data?.admin_email) {
          setValidEmail(String(data.admin_email).toLowerCase().trim());
        }
      } catch (err) {
        console.error('Error fetching admin credentials:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchValidCredentials();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoadingAuth) {
      emailInputRef.current?.focus();
    }
  }, [isAuthenticated, isLoadingAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = inputEmail.trim().toLowerCase();
    const passTrimmed = inputPassword.trim();

    if (!emailTrimmed || !passTrimmed) {
      setErrorMsg('Mohon masukkan email dan password.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Selalu ambil kredensial paling segar langsung dari database Supabase
      let activePassword = validPassword;
      let activeEmail = validEmail;

      const { data, error } = await supabase
        .from('settings')
        .select('pin_code, admin_email')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        if (data.pin_code) {
          activePassword = String(data.pin_code);
          setValidPassword(activePassword);
        }
        if (data.admin_email) {
          activeEmail = String(data.admin_email).toLowerCase().trim();
          setValidEmail(activeEmail);
        }
      }

      // Validasi KETAT: hanya cocokkan dengan kredensial aktif saat ini
      if (emailTrimmed !== activeEmail) {
        setErrorMsg('Email tidak terdaftar sebagai admin.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        emailInputRef.current?.focus();
      } else if (passTrimmed !== activePassword) {
        setErrorMsg('Password salah! Akses ditolak.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        passwordInputRef.current?.focus();
      } else {
        sessionStorage.setItem('waroeng_admin_auth', 'true');
        sessionStorage.setItem('waroeng_admin_email', emailTrimmed);
        setCurrentAdminEmail(emailTrimmed);
        setIsAuthenticated(true);
        setErrorMsg('');
        setInputPassword('');
        setInputEmail('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Gagal memverifikasi ke database. Silakan coba lagi.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('waroeng_admin_auth');
    sessionStorage.removeItem('waroeng_admin_email');
    setIsAuthenticated(false);
    setInputPassword('');
    setInputEmail('');
    setCurrentAdminEmail('');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: ADMIN_BASE_PATH,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: 'Menu Manager',
      href: `${ADMIN_BASE_PATH}/menu`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'AI Copilot',
      href: `${ADMIN_BASE_PATH}/ai-copilot`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Customer Reviews',
      href: `${ADMIN_BASE_PATH}/reviews`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: `${ADMIN_BASE_PATH}/settings`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
    },
  ];

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-[#F8F6F2]" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4 sm:p-6 text-stone-800 font-sans relative overflow-hidden select-none">
        {/* Subtle clean background decorative grid & ambient light */}
        <div className="absolute inset-0 bg-[radial-gradient(#e7e5e4_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-gradient-to-tr from-amber-100/30 via-stone-100/20 to-orange-100/20 rounded-full blur-3xl pointer-events-none" />

        <div
          className={`w-full max-w-[390px] bg-white rounded-3xl border border-stone-200/90 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.06)] p-7 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Header & Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-14 h-14 rounded-2xl bg-[#FFF9F2] border border-[#EADBCC] shadow-xs mb-3 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="WaroengMakan123"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>


            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Otentikasi Pengelola
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-[270px] leading-relaxed">
              Masukkan email dan password untuk mengakses konsol admin.
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleLogin} className="mt-6 space-y-3.5 text-left">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Email
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>

                <input
                  id="admin-email"
                  ref={emailInputRef}
                  type="email"
                  placeholder="admin@waroengmakan123.com"
                  value={inputEmail}
                  onChange={(e) => {
                    setInputEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-stone-50/60 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8E3B24]/15 focus:border-[#8E3B24] transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <input
                  id="admin-password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password admin..."
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm bg-stone-50/60 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8E3B24]/15 focus:border-[#8E3B24] transition-all shadow-xs"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 py-2.5 px-3 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputEmail.trim() || !inputPassword.trim() || isSubmitting}
              className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1 ${
                inputEmail.trim() && inputPassword.trim()
                  ? 'bg-[#8E3B24] hover:bg-[#772F1B] text-white hover:shadow-md active:scale-98'
                  : 'bg-stone-100 text-stone-400 border border-stone-200/80 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-medium transition-colors"
            >
              <span>←</span> Kembali ke Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex text-[#2C2623] font-sans antialiased">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 bg-[#F2EDE4] p-6 flex-col justify-between border-r border-[#E5DEC9] shrink-0 min-h-screen">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-xs border border-[#8E3B24]/20 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/logo.png"
                alt="WaroengMakan123"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-base font-black text-[#8E3B24] tracking-tight leading-tight">WaroengMakan123</h1>
              <p className="text-[10px] text-[#736D69] font-bold uppercase tracking-wider">Admin Console</p>
            </div>
          </Link>

          <nav className="space-y-1.5 text-xs font-semibold text-[#524D4A]">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.label === 'Dashboard' && pathname === `${ADMIN_BASE_PATH}/dashboard`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#6B7C5E] text-white font-bold shadow-sm'
                      : 'hover:bg-[#E4DCCF] text-[#524D4A]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E5DEC9] space-y-3">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-[#524D4A] hover:text-[#8E3B24]">
            <span>←</span> Back to Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors border border-red-200 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Kunci & Keluar
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="relative w-72 h-full bg-[#F2EDE4] p-6 flex flex-col justify-between border-r border-[#E5DEC9] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Link href="/" onClick={() => setIsMobileSidebarOpen(false)} className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-xs border border-[#8E3B24]/20 shrink-0">
                    <Image
                      src="/logo.png"
                      alt="WaroengMakan123"
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-[#8E3B24] tracking-tight leading-tight">WaroengMakan123</h1>
                    <p className="text-[10px] text-[#736D69] font-bold uppercase tracking-wider">Admin Console</p>
                  </div>
                </Link>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[#E4DCCF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-1.5 text-xs font-semibold text-[#524D4A]">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.label === 'Dashboard' && pathname === `${ADMIN_BASE_PATH}/dashboard`);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#6B7C5E] text-white font-bold shadow-sm'
                          : 'hover:bg-[#E4DCCF] text-[#524D4A]'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E5DEC9] space-y-3">
              <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-[#524D4A] hover:text-[#8E3B24]">
                <span>←</span> Back to Website
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-colors border border-red-200 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Kunci & Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="h-14 md:h-16 bg-[#F8F6F2] border-b border-[#E5DEC9] px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-[#EAE4D7] transition-colors"
              aria-label="Buka navigasi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-xs border border-[#8E3B24]/20 shrink-0 md:hidden">
                <Image
                  src="/logo.png"
                  alt="WaroengMakan123"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#2C2623] tracking-tight uppercase">
                  Admin Portal
                </h2>
                <p className="text-[10px] text-[#736D69] font-medium hidden sm:block">
                  WaroengMakan123 Console
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-[#E5DEC9]" />

            <div className="hidden sm:inline-flex items-center gap-2 bg-stone-50/90 border border-stone-200/90 px-2.5 py-1 rounded-lg text-stone-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium tracking-tight">Resto Buka</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3.5">
            <Link
              href="/kasir"
              className="inline-flex items-center gap-1.5 bg-white border border-[#DDD5C5] hover:border-[#8E3B24] hover:text-[#8E3B24] text-[#4A4543] px-2.5 md:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-[#8E3B24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Buka Kasir</span>
              <span className="text-[10px] opacity-60">↗</span>
            </Link>

            <div className="h-5 w-[1px] bg-[#E5DEC9]" />

            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#8E3B24] text-white flex items-center justify-center text-xs font-black shadow-xs uppercase">
                {currentAdminEmail ? currentAdminEmail[0] : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#2C2623] leading-none">Admin Shift</p>
                <p className="text-[10px] text-[#736D69] font-medium mt-0.5 truncate max-w-[150px]">
                  {currentAdminEmail || 'Manager'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}