'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MealMatcher from './components/MealMatcher';
import Footer from './components/Footer';
import ChatbotButton from './components/ChatbotButton';
import { CartItem, MenuItem, MENU_ITEMS } from './data';

export default function LandingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Makanan Utama' | 'Minuman' | 'Cemilan'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Checkout WhatsApp
  const [customerName, setCustomerName] = useState('');
  const [customerTable, setCustomerTable] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Persistensi Keranjang
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

  const addToCart = (id: string, name: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id, name, price, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const totalCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*PESANAN BARU - WAROENGMAKAN123*\n`;
    message += `─────────────────────────\n`;
    message += `👤 *Pemesan:* ${customerName || 'Pelanggan Walk-in'}\n`;
    message += `📍 *Meja/Alamat:* ${customerTable || 'Bungkus / Takeaway'}\n`;
    if (customerNotes) message += `📝 *Catatan:* ${customerNotes}\n`;
    message += `─────────────────────────\n\n`;
    message += `*Rincian Menu:*\n`;

    cart.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} (x${item.qty}) - Rp ${(item.price * item.qty).toLocaleString('id-ID')}\n`;
    });

    message += `\n*TOTAL TAGIHAN: Rp ${totalPrice.toLocaleString('id-ID')}*\n`;
    message += `─────────────────────────\n`;
    message += `Mohon konfirmasi ketersediaan pesanan ini ya, terima kasih!`;

    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2623] font-sans antialiased flex flex-col">
      <Navbar cartCount={totalCount} onOpenCart={() => setIsCartOpen(true)} />
      <Hero />
      <MealMatcher onAddToCart={addToCart} />

      {/* KATALOG MENU */}
      <section id="menu" className="max-w-7xl mx-auto w-full px-6 py-20 scroll-mt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-[#2C2623] tracking-tight">Katalog Pilihan</h2>
            <p className="text-xs sm:text-sm text-[#6C6663] mt-1">Diramu higienis dengan bumbu rempah asli Nusantara.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Cari sajian favorit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E2DDD5] rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E3B24]"
            />

            <div className="flex flex-wrap gap-1 bg-[#F1ECE4] p-1 rounded-full border border-[#E2DDD5]">
              {(['Semua', 'Makanan Utama', 'Minuman', 'Cemilan'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat ? 'bg-[#8E3B24] text-white shadow-sm' : 'text-[#6C6663] hover:text-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredMenu.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 font-medium">Menu yang dicari tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#EFECE6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-neutral-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                    {item.isPopular && (
                      <span className="absolute top-3 right-3 bg-[#A3432B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Favorit
                      </span>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold text-[#8E3B24] uppercase tracking-wider block">{item.category}</span>
                    <h3 className="font-bold text-sm text-[#2C2623]">{item.name}</h3>
                    <p className="text-xs text-[#6C6663] leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between">
                  <span className="text-sm font-black text-[#2C2623]">Rp {item.price.toLocaleString('id-ID')}</span>
                  <button
                    onClick={() => addToCart(item.id, item.name, item.price)}
                    className="bg-[#4E6148] hover:bg-[#3D4D38] text-white px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOKASI RESTO */}
      <section id="locations" className="max-w-7xl mx-auto w-full px-6 py-16 border-t border-[#ECE7E1] scroll-mt-10">
        <h2 className="text-2xl font-black text-[#2C2623] mb-6">Outlet & Lokasi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-[#EFECE6] shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#4E6148] tracking-wider">Outlet</span>
            <h3 className="font-bold text-lg text-[#8E3B24] mt-1">North Purwokerto  </h3>
            <p className="text-xs text-[#6C6663] mt-2 leading-relaxed">
               Sumampir, Jl. Riyanto, Purwokerto Utara, Banyumas, Jawa Tengah. (Tersedia Dine-in & Parkir Luas).
            </p>
          </div>
        </div>
      </section>

      {/* TENTANG KAMI */}
      <section id="about" className="bg-[#ECE7DF] py-16 px-6 scroll-mt-10">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-2xl font-black text-[#2C2623]">Filosofi WaroengMakan123</h2>
          <p className="text-xs sm:text-sm text-[#615B57] leading-relaxed">
            Menjembatani kehangatan resep rumahan Nusantara dengan efisiensi dan higienitas modern. Setiap hidangan diracik tanpa pengawet sintetis berlebih menggunakan bahan segar langsung dari petani lokal.
          </p>
        </div>
      </section>

      <Footer />
      <ChatbotButton />

      {/* DRAWER KERANJANG */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#2C2623]">Keranjang Belanja</h3>
                  <span className="text-[11px] text-gray-500">{totalCount} item dalam pesanan</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <span className="text-3xl">🍲</span>
                  <p className="text-xs text-[#736D69] font-medium">Keranjang masih kosong.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-[#F0ECE6]">
                      <div className="pr-2">
                        <h4 className="text-xs font-bold text-[#2C2623]">{item.name}</h4>
                        <span className="text-[11px] font-semibold text-[#8E3B24]">
                          Rp {(item.price * item.qty).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 bg-white rounded-full border border-gray-300 text-xs font-bold hover:bg-gray-50 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold min-w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 bg-white rounded-full border border-gray-300 text-xs font-bold hover:bg-gray-50 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#ECE7E1]">
                  <span className="text-xs font-bold text-[#2C2623] block">Data Pemesan</span>
                  <input
                    type="text"
                    placeholder="Nama Lengkap *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs border border-[#ECE7E1] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Meja / Alamat Pengiriman *"
                    value={customerTable}
                    onChange={(e) => setCustomerTable(e.target.value)}
                    className="w-full text-xs border border-[#ECE7E1] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                  <textarea
                    placeholder="Catatan tambahan (misal: sambal dipisah, tidak pakai es)"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-[#ECE7E1] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#ECE7E1] space-y-3 mt-6">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Total Biaya:</span>
                <span className="text-lg font-black text-[#8E3B24]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <button
                onClick={handleWhatsAppCheckout}
                disabled={cart.length === 0}
                className="w-full bg-[#4E6148] hover:bg-[#3D4D38] disabled:bg-gray-300 text-white py-3.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-98"
              >
                Pesan Lewat WhatsApp 📱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}