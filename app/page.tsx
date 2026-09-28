'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { CartItem, MenuItem } from './data';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Pemesanan Prasmanan (Tanpa nomor meja / dine in)
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

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
  }, [fetchMenuFromSupabase, fetchSettingsFromSupabase]);

  // Persistensi Keranjang Belanja
  useEffect(() => {
    const saved = localStorage.getItem('waroeng_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('waroeng_cart', JSON.stringify(cart));
  }, [cart]);

  // Manajemen Item Keranjang
  const addToCart = (item: { id: string; name: string; price: number; image?: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, image: item.image }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const getItemQty = (id: string) => {
    return cart.find((i) => i.id === id)?.qty || 0;
  };

  const subtotalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const taxAmount = useMemo(() => Math.round(subtotalPrice * (settings.taxPercent / 100)), [subtotalPrice, settings.taxPercent]);
  const totalPrice = useMemo(() => subtotalPrice + taxAmount, [subtotalPrice, taxAmount]);
  const totalCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  // Checkout Pesanan ke WhatsApp
  const handleWhatsAppCheckout = () => {
    if (cart.length === 0 || !customerName.trim()) return;

    const cleanPhone = settings.phone ? settings.phone.replace(/\D/g, '') : (process.env.NEXT_PUBLIC_WA_NUMBER || '6281234567890');

    let message = `*PESANAN HIDANGAN PRASMANAN - ${settings.restoName.toUpperCase()}*\n`;
    message += `─────────────────────────\n`;
    message += `👤 *Nama Pemesan:* ${customerName.trim()}\n`;
    if (customerNotes.trim()) {
      message += `📝 *Catatan Sajian:* ${customerNotes.trim()}\n`;
    }
    message += `─────────────────────────\n\n`;
    message += `*Daftar Lauk & Sayur Dipilih:*\n`;

    cart.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} (${item.qty}x) - Rp ${(item.price * item.qty).toLocaleString('id-ID')}\n`;
    });

    message += `\n─────────────────────────\n`;
    message += `Subtotal: Rp ${subtotalPrice.toLocaleString('id-ID')}\n`;
    if (taxAmount > 0) {
      message += `Pajak Resto (${settings.taxPercent}%): Rp ${taxAmount.toLocaleString('id-ID')}\n`;
    }
    message += `*TOTAL PEMBAYARAN: Rp ${totalPrice.toLocaleString('id-ID')}*\n`;
    message += `─────────────────────────\n`;
    message += `Halo ${settings.restoName}, saya ingin mengonfirmasi pesanan di atas. Mohon infokan ketersediaannya ya. Terima kasih!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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
        cartCount={totalCount}
        onOpenCart={() => setIsCartOpen(true)}
        restoName={settings.restoName}
        phone={settings.phone}
      />

      {/* HERO SECTION */}
      <Hero
        operatingHours={{ open: settings.openHour, close: settings.closeHour }}
        restoName={settings.restoName}
        address={settings.address}
      />

      {/* KATALOG MENU PRASMANAN */}
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
              Dimasak segar setiap pagi dengan bumbu rempah Nusantara autentik. Tambahkan ke piring pesananmu.
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
              const qtyInCart = getItemQty(item.id);
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
                    <div className="relative h-44 sm:h-48 w-full bg-[#FAF8F5]">
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

                  {/* Price & Action */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-3 border-t border-[#FAF8F5]">
                    <div>
                      <span className="text-[10px] text-[#A89D98] block uppercase font-bold">Harga</span>
                      <span className="text-sm sm:text-base font-black text-[#2C2623]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {!isAvailable ? (
                      <span className="text-xs font-bold text-[#A89D98] bg-[#F2EDE4] px-3.5 py-1.5 rounded-full">
                        Stok Kosong
                      </span>
                    ) : qtyInCart > 0 ? (
                      <div className="flex items-center gap-1.5 bg-[#4E6148] text-white px-2 py-1 rounded-full shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black min-w-4 text-center">{qtyInCart}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="bg-[#4E6148] hover:bg-[#3D4D38] text-white px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>+</span> Tambah
                      </button>
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

      {/* DRAWER KERANJANG BELANJA PRASMANAN */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#FAF8F5] h-full p-5 sm:p-7 flex flex-col justify-between shadow-2xl overflow-y-auto border-l border-[#E5DEC9]">
            <div className="space-y-5">
              {/* Header Drawer */}
              <div className="flex justify-between items-center border-b border-[#E5DEC9] pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#2C2623]">Pilihan Sajian Prasmanan</h3>
                  <span className="text-xs font-semibold text-[#736D69]">{totalCount} porsi dalam daftar pesanan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-[#E5DEC9] flex items-center justify-center font-bold text-[#736D69] hover:bg-[#F2EDE4] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5DEC9] flex items-center justify-center mx-auto text-[#A89D98]">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-[#736D69] font-semibold">Belum ada hidangan dipilih.</p>
                  <p className="text-[11px] text-[#A89D98]">Silakan jelajahi katalog menu prasmanan dan klik + Tambah.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E5DEC9] shadow-xs"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        {item.image && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#F2EDE4]">
                            <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#2C2623] line-clamp-1">{item.name}</h4>
                          <span className="text-xs font-black text-[#8E3B24]">
                            Rp {(item.price * item.qty).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#F2EDE4] px-1.5 py-1 rounded-full border border-[#D5CEB9]">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-xs font-bold text-[#2C2623] shadow-2xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold min-w-4 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-xs font-bold text-[#2C2623] shadow-2xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Data Pemesan (Tanpa Meja / Dine-in) */}
              {cart.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#E5DEC9]">
                  <span className="text-xs font-extrabold text-[#2C2623] uppercase tracking-wider block">
                    Data Pemesan Prasmanan
                  </span>
                  <div>
                    <label className="text-[11px] font-bold text-[#736D69] block mb-1">
                      Nama Pemesan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama Anda..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8E3B24]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#736D69] block mb-1">
                      Catatan Sajian (Opsional)
                    </label>
                    <textarea
                      placeholder="Misal: Sambal dipisah, bungkus 2 porsi terpisah, ambil jam 12..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-white border border-[#E5DEC9] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8E3B24] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Summary & WhatsApp Checkout */}
            <div className="pt-4 border-t border-[#E5DEC9] space-y-3 mt-4">
              <div className="space-y-1.5 text-xs text-[#736D69]">
                <div className="flex justify-between">
                  <span>Subtotal ({totalCount} item):</span>
                  <span className="font-semibold text-[#2C2623]">Rp {subtotalPrice.toLocaleString('id-ID')}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak Restoran ({settings.taxPercent}%):</span>
                    <span className="font-semibold text-[#2C2623]">Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-[#2C2623] pt-1.5 border-t border-[#E5DEC9]">
                  <span>Total Tagihan:</span>
                  <span className="text-lg font-black text-[#8E3B24]">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                disabled={cart.length === 0 || !customerName.trim()}
                className="w-full bg-[#4E6148] hover:bg-[#3D4D38] disabled:bg-gray-300 text-white py-3.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.069-2.023-.482-1.616-.672-2.65-2.316-2.731-2.424-.081-.108-.654-.871-.654-1.662 0-.791.414-1.179.562-1.339.148-.16.323-.2.431-.2.108 0 .216.002.311.007.1.005.234-.038.366.279.135.324.46 1.125.5 1.206.04.081.067.176.013.283-.054.108-.081.176-.162.27-.081.094-.171.21-.244.282-.081.08-.166.167-.071.33.095.162.42 6.94 1.488 7.892 1.378 1.229 2.54 1.613 2.901 1.776.36.163.57.135.782-.108.212-.243.909-1.06 1.15-1.424.24-.364.48-.303.805-.182.324.121 2.056.97 2.408 1.146.351.175.586.262.672.411.085.148.085.861-.059 1.266z" />
                </svg>
                <span>Pesan Lewat WhatsApp</span>
              </button>

              {!customerName.trim() && cart.length > 0 && (
                <p className="text-[11px] text-[#8E3B24] font-medium text-center">
                  * Harap isi nama pemesan terlebih dahulu
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}