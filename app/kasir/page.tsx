'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

// Type data khusus mentahan dari Supabase untuk memperbaiki error TS(7006)
type SupabaseMenuItem = {
  id: string;
  name: string;
  subtitle?: string;
  price: number | string;
  category: string;
  image: string;
  is_available: boolean;
};

type POSItem = {
  id: string;
  name: string;
  subtitle: string;
  tag?: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
};

type OrderItem = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  qty: number;
};

const CATEGORIES = ['Semua', 'Hewani (Goreng/Balado)', 'Aneka Sayur', 'Dimsum & Mochi', 'Paket Kombo'];

export default function KasirPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderType, setOrderType] = useState<'Dine In' | 'Takeaway'>('Dine In');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'QRIS' | 'Tunai' | 'Debit/Kartu'>('Tunai');
  const [orders, setOrders] = useState<OrderItem[]>([]);

  // 1. Fetch data menu dari Supabase saat halaman dibuka
  useEffect(() => {
    async function fetchMenus() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Gagal mengambil data menu:', error.message);
      } else if (data) {
        // PERBAIKAN TS(7006): Type assertion (data as SupabaseMenuItem[])
        const formatted: POSItem[] = (data as SupabaseMenuItem[]).map((item) => ({
          id: item.id,
          name: item.name,
          subtitle: item.subtitle || '',
          price: Number(item.price),
          category: item.category,
          image: item.image,
          isAvailable: item.is_available,
        }));
        setProducts(formatted);
      }
      setIsLoading(false);
    }

    fetchMenus();
  }, []);

  const handleAddItem = (item: POSItem) => {
    if (!item.isAvailable) return;
    setOrders((prev) => {
      const exist = prev.find((o) => o.id === item.id);
      if (exist) {
        return prev.map((o) => (o.id === item.id ? { ...o, qty: o.qty + 1 } : o));
      }
      return [...prev, { id: item.id, name: item.name, subtitle: item.subtitle, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setOrders((prev) =>
      prev
        .map((o) => (o.id === id ? { ...o, qty: o.qty + delta } : o))
        .filter((o) => o.qty > 0)
    );
  };

  const handleAddUpsell = () => {
    const upsellItem = products.find((p) => p.name.toLowerCase().includes('mochi'));
    if (upsellItem) {
      handleAddItem(upsellItem);
    }
  };

  const clearOrders = () => {
    if (confirm('Kosongkan semua pesanan di Meja 12?')) {
      setOrders([]);
    }
  };

  // Perhitungan Keuangan
  const subtotal = useMemo(() => orders.reduce((sum, item) => sum + item.price * item.qty, 0), [orders]);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // 2. Simpan transaksi ke Supabase
  const handleProcessPayment = async () => {
    if (orders.length === 0) return;

    setIsSubmitting(true);
    const newOrder = {
      table_number: 'Meja 12',
      order_type: orderType,
      subtotal: subtotal,
      tax: tax,
      grand_total: grandTotal,
      payment_method: selectedPayment,
      status: 'cooking',
      items: orders,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select();

    setIsSubmitting(false);

    if (error) {
      alert('Gagal memproses transaksi: ' + error.message);
    } else {
      const orderId = data?.[0]?.order_number || data?.[0]?.id;
      alert(`Transaksi Berhasil Disimpan ke Supabase!\nNo Order: #${orderId}\nTotal: Rp ${grandTotal.toLocaleString('id-ID')}`);
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col font-sans text-[#2C2623] antialiased">
      {/* NAVBAR RESPONSIVE */}
      <header className="h-16 xl:h-20 bg-white border-b border-[#E8E4DF] px-4 sm:px-6 xl:px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-[#736D69] hover:text-[#8E3B24] transition-colors"
          >
            <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-[#E8E4DF] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg xl:text-xl font-black text-[#8E3B24] tracking-tight">WaroengMakan123</span>
            <span className="text-[10px] sm:text-[11px] xl:text-xs font-semibold text-[#8C857E] bg-[#F4EFEA] px-2 py-0.5 rounded-md">
              POS System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="bg-[#F4EFEA] p-1 rounded-xl flex items-center text-xs xl:text-sm font-semibold">
            <button
              onClick={() => setOrderType('Dine In')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderType === 'Dine In'
                  ? 'bg-white text-[#2C2623] shadow-xs font-bold'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('Takeaway')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                orderType === 'Takeaway'
                  ? 'bg-white text-[#2C2623] shadow-xs font-bold'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              Takeaway
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs xl:text-sm font-medium text-[#736D69] border-l border-[#E8E4DF] pl-4">
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-[#EFE9DF] text-[#6B7C5E] font-bold flex items-center justify-center text-xs">
              01
            </div>
            <span>Kasir Shift Pagi</span>
          </div>
        </div>
      </header>

      {/* BODY CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* KATALOG MENU */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 xl:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Horizontal Scrollable Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#4E6148] text-white shadow-xs font-bold'
                      : 'bg-white border border-[#E5DEC9] text-[#524D4A] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 xl:w-80 shrink-0">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari menu makanan/minuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5DEC9] rounded-xl py-2 xl:py-2.5 pl-9 pr-4 text-xs xl:text-sm text-[#2C2623] placeholder:text-[#A69F99] focus:outline-none focus:ring-1 focus:ring-[#4E6148]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-24 text-[#736D69] text-xs xl:text-sm font-medium">
              Memuat data menu dari Supabase...
            </div>
          ) : (
            /* Responsive Grid Sizing */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 xl:gap-6">
              {filteredProducts.map((item) => {
                const orderEntry = orders.find((o) => o.id === item.id);
                const isSelected = !!orderEntry;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className={`relative group bg-white rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                      !item.isAvailable
                        ? 'opacity-50 cursor-not-allowed border-transparent'
                        : isSelected
                        ? 'border-[#4E6148] shadow-sm ring-2 ring-[#4E6148]'
                        : 'border-[#EAE5DE] hover:border-[#D5CDC2] hover:shadow-sm cursor-pointer'
                    }`}
                  >
                    <div className="relative h-32 xl:h-40 2xl:h-44 w-full bg-[#EFE9DF]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1536px) 25vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                        {item.tag ? (
                          <span className="text-[9px] xl:text-[10px] font-bold tracking-wider bg-white/95 text-[#4E6148] px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                            {item.tag}
                          </span>
                        ) : <span />}

                        <span
                          className={`text-[9px] xl:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${
                            item.isAvailable
                              ? 'bg-white/95 text-[#4E6148]'
                              : 'bg-red-600/90 text-white'
                          }`}
                        >
                          {item.isAvailable ? 'Tersedia' : 'Habis'}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-2 right-2 bg-[#4E6148] text-white text-xs xl:text-sm font-bold w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center shadow-md">
                          {orderEntry.qty}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 xl:p-4 space-y-1">
                      <h4 className="text-xs xl:text-sm font-bold text-[#2C2623] leading-snug line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] xl:text-xs text-[#736D69] font-medium">{item.subtitle}</p>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs xl:text-sm font-bold text-[#8E3B24]">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] xl:text-xs text-[#4E6148] font-bold group-hover:translate-x-0.5 transition-transform">
                          + Tambah
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDEBAR ORDER / PEMBAYARAN RESPONSIVE */}
        <div className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px] bg-white flex flex-col justify-between p-5 xl:p-7 shrink-0 border-t lg:border-t-0 lg:border-l border-[#E8E4DF] shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEBE5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 xl:w-11 xl:h-11 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] flex items-center justify-center font-black text-sm xl:text-base text-[#8E3B24]">
                  12
                </div>
                <div>
                  <h3 className="text-sm xl:text-base font-bold text-[#2C2623]">Meja 12</h3>
                  <p className="text-[11px] xl:text-xs text-[#736D69] font-medium">{orderType} &bull; 2 Tamu</p>
                </div>
              </div>

              <button
                onClick={clearOrders}
                className="text-xs xl:text-sm font-semibold text-[#8C857E] hover:text-red-600 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* List Item Orders */}
            <div className="space-y-3.5 max-h-[220px] xl:max-h-[320px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs xl:text-sm text-[#8C857E]">Belum ada menu yang dipilih</p>
                </div>
              ) : (
                orders.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs xl:text-sm font-bold text-[#2C2623] truncate">{item.name}</h4>
                      <p className="text-[10px] xl:text-xs text-[#736D69]">{item.subtitle}</p>
                      <span className="text-xs xl:text-sm font-semibold text-[#8E3B24]">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F8F6F2] border border-[#E8E4DF] px-2 py-1 rounded-xl">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="text-xs xl:text-sm font-bold text-[#736D69] hover:text-black w-4 text-center cursor-pointer"
                      >
                        –
                      </button>
                      <span className="text-xs xl:text-sm font-bold min-w-3 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="text-xs xl:text-sm font-bold text-[#736D69] hover:text-black w-4 text-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rekomendasi Menu Pendamping */}
            <div className="bg-[#FAF8F5] border border-[#EAE5DE] p-3 xl:p-4 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] xl:text-[11px] font-bold text-[#4E6148] tracking-wider uppercase block">
                  Saran Menu Pendamping
                </span>
                <p className="text-xs xl:text-sm text-[#2C2623] font-semibold mt-0.5">
                  Mochi Stroberi Dingin
                </p>
                <p className="text-[10px] xl:text-xs text-[#736D69]">Dessert manis penawar pedas balado</p>
              </div>

              <button
                onClick={handleAddUpsell}
                className="bg-white border border-[#D5CDC2] hover:border-[#4E6148] hover:text-[#4E6148] text-[#2C2623] text-xs xl:text-sm font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
              >
                + Rp 12k
              </button>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1.5 pt-2 text-xs xl:text-sm border-t border-[#EFEBE5] text-[#736D69]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C2623]">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak Resto (10%)</span>
                <span className="font-semibold text-[#2C2623]">Rp {tax.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-[#DDD5C5] flex items-baseline justify-between">
              <span className="text-xs xl:text-sm font-bold text-[#2C2623]">Total Pembayaran</span>
              <span className="text-xl xl:text-2xl font-black text-[#8E3B24]">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Metode Pembayaran */}
            <div className="grid grid-cols-3 gap-2">
              {(['QRIS', 'Tunai', 'Debit/Kartu'] as const).map((method) => {
                const isActive = selectedPayment === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={`py-2 rounded-xl text-xs xl:text-sm font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#4E6148] bg-[#4E6148]/5 text-[#4E6148]'
                        : 'border-[#E5DEC9] bg-white text-[#736D69] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={orders.length === 0 || isSubmitting}
            onClick={handleProcessPayment}
            className="w-full mt-5 bg-[#8E3B24] hover:bg-[#78301B] disabled:bg-[#DDD5C5] text-white py-3.5 xl:py-4 rounded-2xl text-xs xl:text-sm font-bold uppercase tracking-wider transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Menyimpan ke Supabase...' : 'Proses Transaksi & Cetak'}
          </button>
        </div>
      </div>
    </div>
  );
} 