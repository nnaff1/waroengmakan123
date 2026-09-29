'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { MenuItem } from './data';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

type FeaturedReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  ordered_menu: string;
};

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Review Terpilih (Murni Real-Time dari Supabase)
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([]);

  // State Form Input Review Baru oleh User
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formReview, setFormReview] = useState({
    customerName: '',
    rating: 5,
    orderedMenu: '',
    comment: '',
  });

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

  // 3. Tarik Data Review Murni dari Supabase (Hanya yang is_featured = true)
  const fetchReviewsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, comment, ordered_menu')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error Supabase reviews:', error.message);
        return;
      }

      // HANYA SET DATA REVIEWS JIKA ADA DI DATABASE (TIDAK PAKAI DUMMY FALLBACK)
      setFeaturedReviews(data || []);
    } catch (err) {
      console.error('Catch Error fetch reviews:', err);
    }
  }, []);

  // Handler Submit Review Baru dari User
  const handleSubmitNewReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReview.customerName || !formReview.comment) return;

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert([
        {
          customer_name: formReview.customerName,
          rating: formReview.rating,
          ordered_menu: formReview.orderedMenu || 'Menu Prasmanan',
          comment: formReview.comment,
          is_featured: false, // Default false, menunggu di-approve/dipin oleh admin
        },
      ]);

      if (error) {
        console.error('Error detail insert review:', error.message);
        alert(`Gagal mengirimkan ulasan: ${error.message}`);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsReviewModalOpen(false);
        setFormReview({ customerName: '', rating: 5, orderedMenu: '', comment: '' });
      }, 1500);
    } catch (err) {
      console.error('Error insert review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchMenuFromSupabase();
    fetchSettingsFromSupabase();
    fetchReviewsFromSupabase();

    // Channel Realtime Menu
    const menuChannel = supabase
      .channel('landing-menu-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchMenuFromSupabase)
      .subscribe();

    // Channel Realtime Settings
    const settingsChannel = supabase
      .channel('landing-settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettingsFromSupabase)
      .subscribe();

    // Channel Realtime Reviews (Mendeteksi aksi Pin/Unpin Admin secara langsung)
    const reviewsChannel = supabase
      .channel('landing-reviews-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviewsFromSupabase)
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, [fetchMenuFromSupabase, fetchSettingsFromSupabase, fetchReviewsFromSupabase]);

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
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#2C2623] font-sans antialiased flex flex-col selection:bg-[#8E3B24] selection:text-white">
      {/* NAVBAR */}
      <Navbar restoName={settings.restoName} phone={settings.phone} />

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

                  {/* Price & Availability Status */}
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

      {/* SECTION ULASAN PELANGGAN & TOMBOL TULIS ULASAN */}
      <section id="reviews" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-t border-[#E5DEC9] scroll-mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#4E6148] uppercase tracking-wider block">
              Testimoni
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2C2623] tracking-tight">
              Apa Kata Pelanggan Kami?
            </h2>
            <p className="text-xs sm:text-sm text-[#736D69] leading-relaxed max-w-xl">
              Kepuasan Anda adalah resep rahasia kami. Simak ulasan jujur dari pelanggan setia {settings.restoName} atau bagikan pengalaman kuliner Anda.
            </p>
          </div>

          {/* Tombol Buka Modal Tulis Ulasan */}
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>✍️</span>
            <span>Tulis Ulasan Anda</span>
          </button>
        </div>

        {featuredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-[#E5DEC9] text-[#736D69] text-xs sm:text-sm">
            Belum ada ulasan pilihan yang ditampilkan. Jadilah yang pertama memberikan ulasan!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {featuredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DEC9] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex text-amber-400 text-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-sm text-[#524D4A] leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>
                <div className="pt-4 border-t border-[#F2EDE4] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8E3B24] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#2C2623]">{review.customer_name}</h4>
                    <p className="text-[11px] text-[#736D69] font-medium line-clamp-1">Favorit: {review.ordered_menu}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL FORM TULIS ULASAN UNTUK USER */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-[#E5DEC9] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-4 border-[#E5DEC9]">
              <div>
                <h3 className="font-black text-lg text-[#2C2623]">
                  Bagikan Ulasan Anda
                </h3>
                <p className="text-xs text-[#736D69] mt-0.5">
                  Pendapat Anda sangat berharga bagi peningkatan mutu {settings.restoName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <span className="text-4xl block">🎉</span>
                <h4 className="font-black text-base text-[#2C2623]">Terima Kasih Atas Ulasan Anda!</h4>
                <p className="text-xs text-[#736D69]">
                  Ulasan Anda telah tersimpan dan akan ditinjau oleh pengelola resto.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitNewReview} className="space-y-4">
                {/* Rating Bintang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#554F4C] block">
                    Rating Kepuasan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 text-2xl cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormReview({ ...formReview, rating: star })}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <span className={star <= formReview.rating ? 'text-amber-400' : 'text-gray-300'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama Pelanggan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#554F4C] block">
                    Nama Anda <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formReview.customerName}
                    onChange={(e) => setFormReview({ ...formReview, customerName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#8E3B24]"
                  />
                </div>

                {/* Menu yang Dipesan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#554F4C] block">
                    Menu yang Dipesan / Ditiptip (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Nasi Rendang Sapi & Es Teh"
                    value={formReview.orderedMenu}
                    onChange={(e) => setFormReview({ ...formReview, orderedMenu: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#8E3B24]"
                  />
                </div>

                {/* Isi Ulasan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#554F4C] block">
                    Ulasan / Pengalaman Makan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ceritakan cita rasa makanan, kebersihan, atau pelayanan yang Anda rasakan..."
                    value={formReview.comment}
                    onChange={(e) => setFormReview({ ...formReview, comment: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-3.5 text-xs font-medium text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#8E3B24] resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DEC9]">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-gray-300 text-xs font-bold text-[#554F4C] hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 rounded-full bg-[#8E3B24] hover:bg-[#78301B] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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