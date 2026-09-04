'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

const POS_PRODUCTS: POSItem[] = [
  {
    id: 'p1',
    name: 'Ayam Goreng Lengkuas',
    subtitle: 'Porsi Sedang',
    price: 25000,
    category: 'Hewani (Goreng/Balado)',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'p2',
    name: 'Daging Sapi Balado',
    subtitle: 'Pedas Sedang',
    price: 35000,
    category: 'Hewani (Goreng/Balado)',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'p3',
    name: 'Tumis Kangkung Polos',
    subtitle: 'Segar & Gurih',
    price: 15000,
    category: 'Aneka Sayur',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'p4',
    name: 'Dimsum Ayam Udang',
    subtitle: 'Kukus Isi 4',
    price: 20000,
    category: 'Dimsum & Mochi',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    isAvailable: false,
  },
  {
    id: 'p5',
    name: 'Mochi Stroberi Dingin',
    subtitle: 'Isi 2 (Penawar Pedas)',
    price: 12000,
    category: 'Dimsum & Mochi',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
];

const CATEGORIES = ['Semua', 'Hewani (Goreng/Balado)', 'Aneka Sayur', 'Dimsum & Mochi', 'Paket Kombo'];

export default function KasirPage() {
  const [orderType, setOrderType] = useState<'Dine In' | 'Takeaway'>('Dine In');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'QRIS' | 'Tunai' | 'Debit/Kartu'>('Tunai');

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: 'p2',
      name: 'Daging Sapi Balado',
      subtitle: 'Pedas Sedang',
      price: 35000,
      qty: 1,
    },
    {
      id: 'p3',
      name: 'Tumis Kangkung Polos',
      subtitle: 'Segar & Gurih',
      price: 15000,
      qty: 2,
    },
  ]);

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
    const upsellItem = POS_PRODUCTS.find((p) => p.id === 'p5');
    if (upsellItem) {
      handleAddItem(upsellItem);
    }
  };

  const clearOrders = () => {
    if (confirm('Kosongkan semua pesanan di Meja 12?')) {
      setOrders([]);
    }
  };

  const subtotal = useMemo(() => orders.reduce((sum, item) => sum + item.price * item.qty, 0), [orders]);
  const tax = subtotal * 0.1;
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  const filteredProducts = useMemo(() => {
    return POS_PRODUCTS.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col font-sans text-[#2C2623] antialiased">
      {/* ================= MODERN CLEAN NAVBAR ================= */}
      <header className="h-16 bg-white border-b border-[#E8E4DF] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-bold text-[#736D69] hover:text-[#8E3B24] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-[#E8E4DF]" />

          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#8E3B24] tracking-tight">WaroengMakan123</span>
            <span className="text-[11px] font-semibold text-[#8C857E] bg-[#F4EFEA] px-2 py-0.5 rounded-md">
              Point of Sale
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Order Type Switcher */}
          <div className="bg-[#F4EFEA] p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setOrderType('Dine In')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                orderType === 'Dine In'
                  ? 'bg-white text-[#2C2623] shadow-xs font-bold'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('Takeaway')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                orderType === 'Takeaway'
                  ? 'bg-white text-[#2C2623] shadow-xs font-bold'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              Takeaway
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#736D69] border-l border-[#E8E4DF] pl-4">
            <div className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#6B7C5E] font-bold flex items-center justify-center text-[11px]">
              01
            </div>
            <span>Kasir Shift Pagi</span>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= KATALOG MENU ================= */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Controls: Search & Categories */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#4E6148] text-white shadow-xs font-bold'
                      : 'bg-white border border-[#E5DEC9] text-[#524D4A] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Clean Search Input */}
            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari menu makanan/minuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5DEC9] rounded-xl py-2 pl-9 pr-4 text-xs text-[#2C2623] placeholder:text-[#A69F99] focus:outline-none focus:ring-1 focus:ring-[#4E6148]"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      ? 'border-[#4E6148] shadow-sm ring-1 ring-[#4E6148]'
                      : 'border-[#EAE5DE] hover:border-[#D5CDC2] hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="relative h-32 w-full bg-[#EFE9DF]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Simple Clean Badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                      {item.tag ? (
                        <span className="text-[9px] font-bold tracking-wider bg-white/95 text-[#4E6148] px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                          {item.tag}
                        </span>
                      ) : <span />}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${
                          item.isAvailable
                            ? 'bg-white/95 text-[#4E6148]'
                            : 'bg-red-600/90 text-white'
                        }`}
                      >
                        {item.isAvailable ? 'Tersedia' : 'Habis'}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute bottom-2 right-2 bg-[#4E6148] text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                        {orderEntry.qty}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-1">
                    <h4 className="text-xs font-bold text-[#2C2623] leading-snug line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-[#736D69] font-medium">{item.subtitle}</p>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8E3B24]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-[#4E6148] font-bold group-hover:translate-x-0.5 transition-transform">
                        + Tambah
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= ORDER SUMMARY / BILLING PANEL ================= */}
        <div className="w-full lg:w-[380px] bg-white flex flex-col justify-between p-6 shrink-0 border-t lg:border-t-0 lg:border-l border-[#E8E4DF] shadow-xs">
          <div className="space-y-5">
            {/* Header Meja */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEBE5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] flex items-center justify-center font-black text-sm text-[#8E3B24]">
                  12
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2623]">Meja 12</h3>
                  <p className="text-[11px] text-[#736D69] font-medium">{orderType} &bull; 2 Tamu</p>
                </div>
              </div>

              <button
                onClick={clearOrders}
                className="text-xs font-semibold text-[#8C857E] hover:text-red-600 transition-colors cursor-pointer"
                title="Kosongkan Pesanan"
              >
                Reset
              </button>
            </div>

            {/* Order Items List */}
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-[#8C857E]">Belum ada menu yang dipilih</p>
                </div>
              ) : (
                orders.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#2C2623] truncate">{item.name}</h4>
                      <p className="text-[10px] text-[#736D69]">{item.subtitle}</p>
                      <span className="text-xs font-semibold text-[#8E3B24]">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F8F6F2] border border-[#E8E4DF] px-2 py-1 rounded-xl">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="text-xs font-bold text-[#736D69] hover:text-black w-4 text-center cursor-pointer"
                      >
                        –
                      </button>
                      <span className="text-xs font-bold min-w-3 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="text-xs font-bold text-[#736D69] hover:text-black w-4 text-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Menu Pelengkap (Clean Replacement for AI Upsell) */}
            <div className="bg-[#FAF8F5] border border-[#EAE5DE] p-3 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#4E6148] tracking-wider uppercase block">
                  Saran Menu Pendamping
                </span>
                <p className="text-xs text-[#2C2623] font-semibold mt-0.5">
                  Mochi Stroberi Dingin
                </p>
                <p className="text-[10px] text-[#736D69]">Pilihan segar penawar pedas balado</p>
              </div>

              <button
                onClick={handleAddUpsell}
                className="bg-white border border-[#D5CDC2] hover:border-[#4E6148] hover:text-[#4E6148] text-[#2C2623] text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                + Rp 12k
              </button>
            </div>

            {/* Rincian Finansial */}
            <div className="space-y-1.5 pt-2 text-xs border-t border-[#EFEBE5] text-[#736D69]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C2623]">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak Resto (10%)</span>
                <span className="font-semibold text-[#2C2623]">Rp {tax.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t border-dashed border-[#DDD5C5] flex items-baseline justify-between">
              <span className="text-xs font-bold text-[#2C2623]">Total Pembayaran</span>
              <span className="text-xl font-black text-[#8E3B24]">
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
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

          {/* Action Button */}
          <button
            disabled={orders.length === 0}
            onClick={() => alert(`Transaksi berhasil dicetak! Metode: ${selectedPayment}, Nominal: Rp ${grandTotal.toLocaleString('id-ID')}`)}
            className="w-full mt-5 bg-[#8E3B24] hover:bg-[#78301B] disabled:bg-[#DDD5C5] text-white py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed"
          >
            Proses Transaksi & Cetak
          </button>
        </div>
      </div>
    </div>
  );
}