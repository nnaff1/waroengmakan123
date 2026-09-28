'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Extend window type untuk Midtrans Snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

type SupabaseMenuItem = {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number | string;
  category: string;
  image: string;
  is_available: boolean;
  is_popular?: boolean;
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
  price: number;
  qty: number;
};

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Cemilan', 'Hewani (Goreng/Balado)', 'Aneka Sayur', 'Dimsum & Mochi', 'Paket Kombo'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

// Bangun payload order yang aman — hanya kirim kolom yang sudah ada di DB.
// Kolom opsional (receipt_no, subtotal, tax, payment_method, status, notes)
// hanya dikirim jika nilainya ada, sehingga tidak crash jika kolom belum
// dimigrasikan. Jalankan supabase/migrations/add_kasir_columns.sql untuk
// mengaktifkan semua fitur.
function buildOrderPayload(params: {
  receiptNo: string;
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  items: OrderItem[];
  notes?: string;
}) {
  return {
    grand_total: params.grandTotal,
    items: params.items,
    // Kolom lama yang mungkin NOT NULL — kirim nilai default
    table_number: 'Kasir',
    order_type: 'Prasmanan',
    subtotal: params.subtotal ?? 0,
    tax: params.tax ?? 0,
    // Kolom opsional — ada setelah migration dijalankan
    ...(params.receiptNo && { receipt_no: params.receiptNo }),
    ...(params.paymentMethod && { payment_method: params.paymentMethod }),
    ...(params.status && { status: params.status }),
    ...(params.notes && { notes: params.notes }),
  };
}

function generateReceiptNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `WM${yy}${mm}${dd}-${seq}`;
}

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-xs font-mono font-semibold text-[#6E6866] hidden sm:inline tabular-nums">{time}</span>;
}

export default function KasirPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [receiptNo, setReceiptNo] = useState('');
  const [cashierName] = useState('Kasir 01');
  const [customerNote, setCustomerNote] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  // Generate receipt no hanya di client (anti hydration mismatch)
  useEffect(() => {
    setReceiptNo(generateReceiptNo());
  }, []);

  // Inject Midtrans Snap.js script
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey || document.getElementById('midtrans-snap')) return;
    const script = document.createElement('script');
    script.id = 'midtrans-snap';
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    document.head.appendChild(script);
    return () => { document.getElementById('midtrans-snap')?.remove(); };
  }, []);

  useEffect(() => {
    async function fetchMenus() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Gagal mengambil data menu:', error.message);
      } else if (data) {
        const formatted: POSItem[] = (data as SupabaseMenuItem[]).map((item) => ({
          id: item.id,
          name: item.name,
          subtitle: item.subtitle || item.description || '',
          tag: item.is_popular ? 'Favorit' : undefined,
          price: Number(item.price),
          category: item.category,
          image: item.image || DEFAULT_IMAGE,
          isAvailable: item.is_available ?? true,
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
      if (exist) return prev.map((o) => (o.id === item.id ? { ...o, qty: o.qty + 1 } : o));
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, qty: o.qty + delta } : o)).filter((o) => o.qty > 0)
    );
  };

  const clearOrders = () => {
    if (orders.length === 0) return;
    if (confirm('Hapus semua item dari struk ini?')) {
      setOrders([]);
      setCustomerNote('');
    }
  };

  const subtotal = useMemo(() => orders.reduce((sum, i) => sum + i.price * i.qty, 0), [orders]);
  const tax = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + tax;
  const totalItems = useMemo(() => orders.reduce((sum, i) => sum + i.qty, 0), [orders]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProcessPayment = async () => {
    if (orders.length === 0) return;
    setIsSubmitting(true);

    try {
      // Untuk pembayaran Tunai — langsung simpan ke Supabase (tidak perlu gateway)
      if (selectedPayment === 'Tunai') {
        const { error } = await supabase.from('orders').insert([buildOrderPayload({
          receiptNo,
          subtotal,
          tax,
          grandTotal,
          paymentMethod: 'Tunai',
          status: 'Selesai',
          items: orders,
          notes: customerNote || undefined,
        })]);
        if (error) throw new Error(error.message);
        setIsSuccess(true);
        setTimeout(() => { setOrders([]); setCustomerNote(''); setIsSuccess(false); }, 2200);
        return;
      }

      // Untuk QRIS — pakai Midtrans Snap
      if (!window.snap) {
        alert('Midtrans Snap belum siap. Pastikan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY sudah di-set di .env.local dan reload halaman.');
        return;
      }

      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNo,
          orders,
          subtotal,
          tax,
          grandTotal,
          paymentMethod: selectedPayment,
          notes: customerNote || null,
        }),
      });

      // Parse response defensif — antisipasi server error non-JSON
      const rawText = await res.text();
      let data: { snapToken?: string; error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 200)}`);
      }

      if (!res.ok || !data.snapToken) {
        throw new Error(data.error || `Gagal mendapatkan token (HTTP ${res.status})`);
      }

      // Buka Midtrans Snap popup
      window.snap.pay(data.snapToken, {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => { setOrders([]); setCustomerNote(''); setIsSuccess(false); setReceiptNo(generateReceiptNo()); }, 2200);
        },
        onPending: () => {
          alert('Pembayaran masih pending. Status akan diperbarui otomatis via webhook.');
          setOrders([]);
          setCustomerNote('');
          setReceiptNo(generateReceiptNo());
        },
        onError: (err) => {
          console.error('Snap error:', err);
          alert('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          // User menutup popup tanpa bayar — order masih Pending di DB
        },
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      alert('Error: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans text-[#2C2623] antialiased">

      {/* ── HEADER ── */}
      <header className="h-14 bg-[#2C2623] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#9E9894] hover:text-white transition-colors" title="Kembali ke Dashboard">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-[#4A4340]" />
          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-tight text-sm">WaroengMakan123</span>
            <span className="text-[10px] font-bold text-[#8E3B24] bg-[#8E3B24]/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Kasir</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-[#6E6866] font-medium leading-none">No. Struk</span>
            <span className="text-[11px] font-bold text-[#C0B9B5] font-mono leading-none mt-0.5">{receiptNo}</span>
          </div>
          <div className="h-4 w-px bg-[#4A4340] hidden sm:block" />
          <LiveClock />
          <div className="h-4 w-px bg-[#4A4340]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#8E3B24] text-white flex items-center justify-center text-[10px] font-black">
              {cashierName.slice(-2)}
            </div>
            <span className="text-xs font-semibold text-[#9E9894] hidden sm:inline">{cashierName}</span>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── KATALOG KIRI ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Filter & Search */}
          <div className="bg-white border-b border-[#E5DEC9] px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-64 shrink-0">
              <svg className="w-4 h-4 text-[#A89D98] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl py-2 pl-9 pr-4 text-xs text-[#2C2623] placeholder:text-[#A69F99] focus:outline-none focus:ring-1 focus:ring-[#4E6148]"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#4E6148] text-white shadow-sm'
                      : 'bg-[#F4F0EB] text-[#6C6663] hover:bg-[#EAE5DE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Menu */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-[#4E6148] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#736D69] font-medium">Memuat menu...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[#8C857E] text-sm">
                Tidak ada menu yang cocok.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {filteredProducts.map((item) => {
                  const orderEntry = orders.find((o) => o.id === item.id);
                  const isSelected = !!orderEntry;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      disabled={!item.isAvailable}
                      className={`relative group bg-white rounded-xl overflow-hidden border text-left transition-all flex flex-col ${
                        !item.isAvailable
                          ? 'opacity-40 cursor-not-allowed border-transparent'
                          : isSelected
                          ? 'border-[#4E6148] ring-1 ring-[#4E6148] shadow-sm cursor-pointer'
                          : 'border-[#EAE5DE] hover:border-[#CABFB5] hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="relative h-28 sm:h-32 w-full bg-[#EFE9DF] shrink-0">
                        <Image
                          src={item.image || DEFAULT_IMAGE}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                        {item.tag && (
                          <span className="absolute top-2 left-2 text-[9px] font-bold bg-[#8E3B24] text-white px-1.5 py-0.5 rounded-md">
                            {item.tag}
                          </span>
                        )}
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold bg-red-600 px-2 py-0.5 rounded">Habis</span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#4E6148] text-white text-xs font-black flex items-center justify-center shadow-md">
                            {orderEntry!.qty}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between gap-1">
                        <p className="text-[11px] sm:text-xs font-bold text-[#2C2623] leading-snug line-clamp-2">{item.name}</p>
                        <span className="text-[11px] font-bold text-[#8E3B24]">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── STRUK KANAN ── */}
        <div className="w-full lg:w-[360px] xl:w-[400px] bg-white flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-[#E8E4DF]">

          {/* Header struk */}
          <div className="px-5 pt-5 pb-4 border-b border-[#EFEBE5] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#A89D98] uppercase tracking-wider">Struk Penjualan</p>
              <p className="text-xs font-bold text-[#4E6148] font-mono mt-0.5">{receiptNo}</p>
            </div>
            <button
              onClick={clearOrders}
              disabled={orders.length === 0}
              className="text-[11px] font-semibold text-[#A89D98] hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Kosongkan
            </button>
          </div>

          {/* List pesanan */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F0EB] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#B5ADA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-[#A89D98] font-medium leading-relaxed">
                  Ketuk menu di sebelah kiri<br />untuk menambah ke struk
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {orders.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[#F4F0EB] last:border-b-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-[#F4F0EB] text-[#6C6663] text-sm font-bold flex items-center justify-center hover:bg-[#EAE5DE] transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#2C2623]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-[#F4F0EB] text-[#6C6663] text-sm font-bold flex items-center justify-center hover:bg-[#EAE5DE] transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <p className="flex-1 text-xs font-semibold text-[#2C2623] truncate">{item.name}</p>
                    <span className="text-xs font-bold text-[#2C2623] shrink-0 tabular-nums">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan */}
          {orders.length > 0 && (
            <div className="px-5 pb-3">
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Catatan untuk dapur (opsional)..."
                rows={2}
                className="w-full text-[11px] text-[#2C2623] placeholder:text-[#C0B9B5] bg-[#FDFBF7] border border-[#E8E4DF] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4E6148] resize-none"
              />
            </div>
          )}

          {/* Ringkasan biaya */}
          <div className="px-5 pt-3 pb-4 border-t border-[#EFEBE5] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[#A89D98]">
              <span>{totalItems} item</span>
              <span className="font-semibold text-[#2C2623] tabular-nums">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#A89D98]">
              <span>Pajak (10%)</span>
              <span className="font-semibold text-[#2C2623] tabular-nums">Rp {tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#E5DEC9]">
              <span className="text-sm font-bold text-[#2C2623]">Total</span>
              <span className="text-xl font-black text-[#8E3B24] tabular-nums">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="px-5 pb-4 space-y-2">
            <p className="text-[10px] font-bold text-[#A89D98] uppercase tracking-wider">Metode Pembayaran</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Tunai', 'QRIS'] as const).map((method) => {
                const isActive = selectedPayment === method;
                const iconMap: Record<string, React.ReactNode> = {
                  Tunai: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  QRIS: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  ),
                };
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? 'border-[#4E6148] bg-[#4E6148] text-white shadow-emerald-950/10'
                        : 'border-[#E5DEC9] bg-white text-[#736D69] hover:bg-[#FAF8F5] hover:border-[#D5CEB9]'
                    }`}
                  >
                    {iconMap[method]}
                    <span>{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tombol Proses */}
          <div className="px-5 pb-5">
            <button
              disabled={orders.length === 0 || isSubmitting}
              onClick={handleProcessPayment}
              className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${
                isSuccess
                  ? 'bg-[#4E6148] text-white'
                  : orders.length === 0
                  ? 'bg-[#E8E4DF] text-[#A89D98]'
                  : 'bg-[#8E3B24] hover:bg-[#78301B] text-white'
              }`}
            >
              {isSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Transaksi Berhasil
                </span>
              ) : isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : orders.length === 0 ? (
                'Pilih Menu Terlebih Dahulu'
              ) : (
                `Proses — Rp ${grandTotal.toLocaleString('id-ID')}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}