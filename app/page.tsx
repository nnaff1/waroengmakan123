'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { MenuItem } from './data';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Profil & Pengaturan Restoran dari Supabase
  const [settings, setSettings] = useState({
    restoName: 'WaroengMakan123',
    phone: '081234567890',
    address: 'Jl. Kuliner No. 12, Purwokerto',
    openHour: '10:00',
    closeHour: '21:00',
    taxPercent: 10,
    receiptFooter: 'Terima kasih atas kunjungan Anda! Silakan datang kembali.',
  });

  // 1. Tarik Data Menu dari Supabase
  const fetchMenuFromSupabase = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('is_popular', { ascending: false });

      if (error) {
        console.error('Error Supabase menu_items:', error.message);
      } else if (data) {
        const formattedData: MenuItem[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          description: item.description || '',
          image: item.image || DEFAULT_IMAGE,
          isAvailable: item.is_available ?? true,
          isPopular: item.is_popular ?? false,
        }));
        setMenuItems(formattedData);
      }
    } catch (err) {
      console.error('Catch Error fetchMenu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // 2. Tarik Data Settings dari Supabase
  const fetchSettingsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Error Supabase settings:', error.message);
      } else if (data) {
        setSettings({
          restoName: data.resto_name || data.restaurant_name || 'WaroengMakan123',
          phone: data.phone || data.whatsapp || '081234567890',
          address: data.address || 'Jl. Kuliner No. 12, Purwokerto',
          openHour: (data.open_hour || data.opening_time || '10:00').slice(0, 5),
          closeHour: (data.close_hour || data.closing_time || '21:00').slice(0, 5),
          taxPercent: Number(data.tax_percent) || 10,
          receiptFooter: data.receipt_footer || 'Terima kasih atas kunjungan Anda! Silakan datang kembali.',
        });
      }
    } catch (err) {
      console.error('Error fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchMenuFromSupabase();
    fetchSettingsFromSupabase();

    // Subscribe ke perubahan menu_items secara real-time
    const menuChannel = supabase
      .channel('landing-menu-items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenuFromSupabase();
        }
      )
      .subscribe();

    // Subscribe ke perubahan settings resto secara real-time
    const settingsChannel = supabase
      .channel('landing-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => {
          fetchSettingsFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [fetchMenuFromSupabase, fetchSettingsFromSupabase]);

  // Kategori Dinamis dari Menu yang Tersedia
  const dynamicCategories = useMemo(() => {
    const rawCategories = Array.from(new Set(menuItems.map((item) => item.category).filter(Boolean)));
    const defaultOrder = ['Makanan Utama', 'Hewani (Goreng/Balado)', 'Aneka Sayur', 'Minuman', 'Cemilan', 'Paket Kombo'];
    const merged = Array.from(new Set([...rawCategories, ...defaultOrder]));
    const presentCategories = merged.filter((cat) => menuItems.some((m) => m.category === cat));
    return ['Semua', ...(presentCategories.length > 0 ? presentCategories : rawCategories)];
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#2C2623] font-sans antialiased flex flex-col selection:bg-[#8E3B24] selection:text-white">
      {/* NAVBAR */}
      <Navbar
        restoName={settings.restoName}
        phone={settings.phone}
      />

      {/* HERO SECTION */}
      <Hero
        operatingHours={{ open: settings.openHour, close: settings.closeHour }}
        restoName={settings.restoName}
        address={settings.address}
      />

      {/* KATALOG MENU PRASMANAN (SHOWCASE / PROFILE) */}
      <section id="menu" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-18 scroll-mt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4E6148] uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4E6148]" />
              Display Sajian Hari Ini
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2C2623] tracking-tight">
              Katalog Pilihan Prasmanan
            </h2>
            <p className="text-xs sm:text-sm text-[#736D69] mt-1 max-w-lg">
              Dimasak segar setiap pagi dengan bumbu rempah Nusantara autentik. Pilihan lauk dan sayur fresh yang siap disajikan langsung di etalase kami.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 md:w-80">
            <input
              type="text"
              placeholder="Cari lauk, sayur, minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5DEC9] rounded-full py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8E3B24] placeholder-[#A89D98] shadow-xs"
            />
            <svg className="w-4 h-4 text-[#A89D98] absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-8">
          {dynamicCategories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#8E3B24] text-white shadow-xs'
                    : 'bg-white text-[#524D4A] border border-[#E5DEC9] hover:bg-[#F2EDE4]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        {isLoadingMenu ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-[#DCD5C3]">
            <div className="w-10 h-10 border-3 border-[#8E3B24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-[#736D69] font-semibold">Menyiapkan hidangan lezat dari dapur...</p>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#DCD5C3] space-y-2">
            <p className="text-sm font-bold text-[#2C2623]">Menu tidak ditemukan</p>
            <p className="text-xs text-[#736D69]">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredMenu.map((item) => {
              const isAvailable = item.isAvailable;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl overflow-hidden border transition-all flex flex-col justify-between ${
                    isAvailable
                      ? 'border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-[#D5CEB9]'
                      : 'border-[#ECE7E1] opacity-75'
                  }`}
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative h-44 sm:h-52 w-full bg-[#FAF8F5]">
                      <Image
                        src={item.image || DEFAULT_IMAGE}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={`object-cover transition-transform duration-300 ${isAvailable ? 'hover:scale-105' : 'grayscale'}`}
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="bg-[#FAF8F5]/90 backdrop-blur-md text-[#8E3B24] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#E5DEC9]">
                          {item.category}
                        </span>
                        {item.isPopular && isAvailable && (
                          <span className="bg-[#8E3B24] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <span>🔥</span> Favorit
                          </span>
                        )}
                        {!isAvailable && (
                          <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            Habis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 space-y-1.5">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#2C2623] leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#736D69] leading-relaxed line-clamp-2">
                        {item.description || 'Sajian lezat khas WaroengMakan123 dengan racikan bumbu rempah pilihan.'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Availability Status (Murni Showcase Profile) */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-3 border-t border-[#FAF8F5]">
                    <div>
                      <span className="text-[10px] text-[#A89D98] block uppercase font-bold">Harga Porsi</span>
                      <span className="text-sm sm:text-base font-black text-[#8E3B24]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {!isAvailable ? (
                      <span className="text-xs font-bold text-[#A89D98] bg-[#F2EDE4] px-3.5 py-1.5 rounded-full">
                        Stok Habis
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#4E6148] bg-[#4E6148]/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4E6148]" />
                        Tersedia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: PAKET NASI KOTAK & KATERING PRASMANAN */}
      <section id="katering" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-t border-[#E5DEC9] scroll-mt-10">
        <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-10 border border-[#E5DEC9] shadow-xs">
          <div className="max-w-2xl mb-8 space-y-2">
            <span className="text-xs font-bold text-[#8E3B24] uppercase tracking-wider block">
              Layanan Pesanan Khusus
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2C2623] tracking-tight">
              Nasi Kotak & Katering Prasmanan Acara
            </h2>
            <p className="text-xs sm:text-sm text-[#736D69] leading-relaxed">
              Butuh sajian untuk rapat kantor, pengajian, syukuran, atau arisan keluarga? Kami melayani pesanan partai besar dengan kemasan higienis, tepat waktu, dan bumbu rempah juara.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Paket 1 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5DEC9] shadow-2xs space-y-3">
              <span className="text-[10px] font-black uppercase text-[#4E6148] tracking-wider block">
                Paket Praktis
              </span>
              <h3 className="font-extrabold text-base text-[#2C2623]">Nasi Box Rames Nusantara</h3>
              <p className="text-xs text-[#736D69] leading-relaxed">
                Nasi putih pulen, ayam goreng rempah/lengkuas, tempe orek manis, sambal bajak, dan lalap segar.
              </p>
              <div className="pt-3 border-t border-[#FAF8F5] flex items-center justify-between">
                <span className="text-xs font-bold text-[#8E3B24]">Mulai Rp 22.000 / box</span>
                <span className="text-[11px] text-[#A89D98]">Min. 10 Box</span>
              </div>
            </div>

            {/* Paket 2 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#8E3B24] shadow-sm space-y-3 relative">
              <span className="absolute -top-2.5 right-4 bg-[#8E3B24] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Paling Laris
              </span>
              <span className="text-[10px] font-black uppercase text-[#8E3B24] tracking-wider block">
                Paket Istimewa
              </span>
              <h3 className="font-extrabold text-base text-[#2C2623]">Nasi Box Rendang & Telur</h3>
              <p className="text-xs text-[#736D69] leading-relaxed">
                Nasi liwet/uduk, rendang sapi masak 8 jam, telur balado bulat, tumis buncis jagung manis, dan kerupuk udang.
              </p>
              <div className="pt-3 border-t border-[#FAF8F5] flex items-center justify-between">
                <span className="text-xs font-bold text-[#8E3B24]">Mulai Rp 35.000 / box</span>
                <span className="text-[11px] text-[#A89D98]">Min. 15 Box</span>
              </div>
            </div>

            {/* Paket 3 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5DEC9] shadow-2xs space-y-3">
              <span className="text-[10px] font-black uppercase text-[#4E6148] tracking-wider block">
                Acara & Hajatan
              </span>
              <h3 className="font-extrabold text-base text-[#2C2623]">Set Prasmanan Lokasi</h3>
              <p className="text-xs text-[#736D69] leading-relaxed">
                Pemanas buffet lengkap, meja saji, peralatan makan, 5 pilihan lauk utama, 2 sayuran, aneka sambal, dan buah potong segar.
              </p>
              <div className="pt-3 border-t border-[#FAF8F5] flex items-center justify-between">
                <span className="text-xs font-bold text-[#8E3B24]">Hubungi untuk Custom</span>
                <span className="text-[11px] text-[#A89D98]">Min. 30 Porsi</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5DEC9]">
            <p className="text-xs text-[#736D69]">
              💡 Pesanan katering harap dikonfirmasikan minimal 1-2 hari sebelum acara.
            </p>
            {settings.phone && (
              <a
                href={`https://wa.me/${settings.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Halo ${settings.restoName}, saya ingin menanyakan paket nasi kotak / katering prasmanan untuk acara.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#4E6148] hover:bg-[#3D4D38] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <span>💬</span>
                <span>Konsultasi Katering via WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* OUTLET & LOKASI */}
      <section id="locations" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 border-t border-[#E5DEC9] scroll-mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-[#4E6148] uppercase tracking-wider block mb-1">
              Kunjungi Outlet Kami
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2C2623] tracking-tight">
              Outlet & Jam Operasional
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E5DEC9] px-4 py-2 rounded-full text-xs font-bold text-[#554F4C]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4E6148]" />
            Buka Setiap Hari: {settings.openHour} - {settings.closeHour} WIB
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8E3B24]" />
              <h3 className="text-lg sm:text-xl font-black text-[#2C2623]">
                {settings.restoName} — Outlet Utama
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#736D69] leading-relaxed">
              📍 {settings.address}
            </p>
            <p className="text-xs text-[#8F8884] leading-relaxed">
              Nikmati kenyamanan memilih langsung aneka hidangan prasmanan hangat dengan ruang makan bersih, higienis, dan parkir luas.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="text-xs font-bold text-[#554F4C]">
                🕒 Jam Buka: <span className="text-[#8E3B24]">{settings.openHour} - {settings.closeHour} WIB</span>
              </div>
              <div className="text-xs font-bold text-[#554F4C]">
                📞 WhatsApp: <span className="text-[#4E6148]">{settings.phone}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-3 justify-center">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address + ' ' + settings.restoName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#8E3B24] hover:bg-[#78301B] text-white py-3 px-5 rounded-2xl text-xs font-bold text-center transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Petunjuk Arah (Google Maps)</span>
            </a>

            {settings.phone && (
              <a
                href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#4E6148] border border-[#D5CEB9] py-3 px-5 rounded-2xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
              >
                <span>💬 Hubungi Pengelola Via WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FILOSOFI / TENTANG KAMI */}
      <section id="about" className="bg-[#F2EDE4] py-14 sm:py-18 px-6 border-t border-[#E5DEC9] scroll-mt-10">
        <div className="max-w-3xl mx-auto text-center space-y-3.5">
          <span className="text-[11px] font-black text-[#8E3B24] uppercase tracking-wider block">
            Semangat Warung Prasmanan Nusantara
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2C2623] tracking-tight">
            Filosofi Dapur {settings.restoName}
          </h2>
          <p className="text-xs sm:text-sm text-[#554F4C] leading-relaxed">
            Menghidupkan kembali kehangatan santap prasmanan khas Nusantara dengan standar kebersihan modern. 
            Semua olahan diracik setiap pagi dari rempah asli petani lokal, tanpa bahan pengawet sintetis berlebih, 
            memberikan kebebasan penuh bagi Anda untuk meracik piring makan sesuai selera dan isi kantong.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <Footer
        restoName={settings.restoName}
        address={settings.address}
        phone={settings.phone}
        operatingHours={{ open: settings.openHour, close: settings.closeHour }}
      />
    </div>
  );
}