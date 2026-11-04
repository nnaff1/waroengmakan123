'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ADMIN_BASE_PATH } from '@/lib/adminConfig';

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

type CompletedReceipt = {
  receiptNo: string;
  date: string;
  customerName: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  notes?: string;
};

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
  customerName?: string;
  notes?: string;
}) {
  const cleanCustomerName = params.customerName?.trim() || '';
  const combinedNotes = [
    cleanCustomerName ? `Pelanggan: ${cleanCustomerName}` : '',
    params.notes?.trim() || '',
  ].filter(Boolean).join(' | ');

  return {
    grand_total: params.grandTotal,
    items: params.items,
    table_number: cleanCustomerName ? `Kasir (${cleanCustomerName})` : 'Kasir',
    order_type: 'Prasmanan',
    subtotal: params.subtotal ?? 0,
    tax: params.tax ?? 0,
    ...(params.receiptNo && { receipt_no: params.receiptNo }),
    ...(params.paymentMethod && { payment_method: params.paymentMethod }),
    ...(params.status && { status: params.status }),
    ...(combinedNotes && { notes: combinedNotes }),
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
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const [restoInfo, setRestoInfo] = useState({
    name: 'WaroengMakan123',
    address: 'Jl. Kuliner No. 12, Purwokerto',
    phone: '081234567890',
    taxPercent: 10,
    receiptFooter: 'Terima kasih atas kunjungan Anda!\nSelamat menikmati hidangan lezat khas Nusantara.',
  });

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<CompletedReceipt | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Generate receipt no hanya di client (anti hydration mismatch)
  useEffect(() => {
    setReceiptNo(generateReceiptNo());
  }, []);

  // Ambil pengaturan resto (nama, alamat, telepon, pajak, footer struk)
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
        if (data) {
          setRestoInfo({
            name: data.restaurant_name || data.resto_name || 'WaroengMakan123',
            address: data.address || 'Jl. Kuliner No. 12, Purwokerto',
            phone: data.whatsapp || data.phone || '081234567890',
            taxPercent: Number(data.tax_percent) || 10,
            receiptFooter: data.receipt_footer || 'Terima kasih atas kunjungan Anda!\nSelamat menikmati hidangan lezat khas Nusantara.',
          });
        }
      } catch (err) {
        console.warn('Gagal memuat pengaturan resto:', err);
      }
    }
    fetchSettings();
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

    const channel = supabase
      .channel('kasir-menu-items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setCustomerName('');
    }
  };

  const subtotal = useMemo(() => orders.reduce((sum, i) => sum + i.price * i.qty, 0), [orders]);
  const tax = Math.round(subtotal * (restoInfo.taxPercent / 100));
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

    const activeCustomerName = customerName.trim() || 'Pelanggan Umum';
    const currentReceipt: CompletedReceipt = {
      receiptNo,
      date: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' WIB',
      customerName: activeCustomerName,
      cashierName,
      items: [...orders],
      subtotal,
      tax,
      grandTotal,
      paymentMethod: selectedPayment,
      notes: customerNote.trim() || undefined,
    };

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
          customerName: activeCustomerName,
          notes: customerNote || undefined,
        })]);
        if (error) throw new Error(error.message);
        setReceiptData(currentReceipt);
        setIsSuccess(true);
        setShowReceiptModal(true);
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
          customerName: activeCustomerName,
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
          setReceiptData(currentReceipt);
          setIsSuccess(true);
          setShowReceiptModal(true);
        },
        onPending: () => {
          alert('Pembayaran masih pending. Status akan diperbarui otomatis via webhook.');
          setReceiptData(currentReceipt);
          setShowReceiptModal(true);
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

  const handlePreviewReceipt = () => {
    if (orders.length === 0) return;
    setReceiptData({
      receiptNo,
      date: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' WIB',
      customerName: customerName.trim() || 'Pelanggan Umum',
      cashierName,
      items: [...orders],
      subtotal,
      tax,
      grandTotal,
      paymentMethod: selectedPayment,
      notes: customerNote.trim() || undefined,
    });
    setShowReceiptModal(true);
  };

  const handleNewTransaction = () => {
    setOrders([]);
    setCustomerName('');
    setCustomerNote('');
    setIsSuccess(false);
    setShowReceiptModal(false);
    setReceiptNo(generateReceiptNo());
  };

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex flex-col font-sans text-[#2C2623] antialiased">

      {/* ── HEADER ── */}
      <header className="h-14 bg-[#2C2623] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <Link href={ADMIN_BASE_PATH} className="text-[#9E9894] hover:text-white transition-colors" title="Kembali ke Dashboard">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-[#4A4340]" />
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-full overflow-hidden shadow-xs border border-white/20 shrink-0">
              <Image
                src="/logo.png"
                alt="WaroengMakan123"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <span className="text-white font-black tracking-tight text-sm">WaroengMakan123</span>
            <span className="text-[10px] font-bold text-[#E56A44] bg-[#8E3B24]/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Kasir</span>
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
          <div className="px-5 pt-4 pb-3 border-b border-[#EFEBE5] flex items-center justify-between">
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

          {/* ── IDENTITAS PELANGGAN DI STRUK ── */}
          <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#EFEBE5] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#736D69] uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#8E3B24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nama Pelanggan di Struk
              </label>
              {customerName && (
                <button
                  type="button"
                  onClick={() => setCustomerName('')}
                  className="text-[10px] font-semibold text-[#A89D98] hover:text-red-500 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan (cth: Pak Budi / Meja 04)..."
                className="w-full bg-white border border-[#E5DEC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2623] placeholder:text-[#A89D98] placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#4E6148] transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'Pelanggan Umum',
                'Bungkus (Takeaway)',
                'Dine In',
                'Meja 01',
                'Meja 02',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomerName(preset)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                    customerName === preset
                      ? 'bg-[#4E6148] text-white border-[#4E6148] shadow-xs'
                      : 'bg-white text-[#736D69] border-[#E5DEC9] hover:bg-[#F2EDE4]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Preview Label Struk */}
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[10px] text-[#A89D98]">Tercetak di Struk:</span>
              <span className="font-bold text-[#8E3B24] bg-white border border-[#E8E4DF] px-2 py-0.5 rounded-md truncate max-w-[190px]">
                👤 {customerName.trim() || 'Pelanggan Umum'}
              </span>
            </div>
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
              <span>Pajak Resto ({restoInfo.taxPercent}%)</span>
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

          {/* Tombol Proses & Pratinjau */}
          <div className="px-5 pb-5 space-y-2">
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

            {orders.length > 0 && (
              <button
                type="button"
                onClick={handlePreviewReceipt}
                className="w-full py-2.5 rounded-xl border border-[#D5CEB9] bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#4E6148] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat / Pratinjau Struk
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL STRUK CETAK THERMAL ── */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print-backdrop">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DEC9] flex flex-col gap-4 max-h-[92vh] overflow-hidden">
            
            {/* Header Modal (disembunyikan saat diprint) */}
            <div className="flex items-center justify-between border-b pb-3 border-[#F0ECE6] no-print">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#2C2623]">Struk Penjualan Kasir</h3>
                  <p className="text-[10px] text-[#736D69]">Format Struk Kasir Restoran</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#EFE9DF] text-[#736D69] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Kertas Struk (Thermal Printable Container) */}
            <div
              id="printable-receipt"
              className="bg-[#FCFBF9] p-5 rounded-2xl border border-dashed border-[#DDD7CD] font-mono text-[11px] text-[#2C2623] space-y-3 overflow-y-auto shadow-inner"
            >
              {/* Identitas Resto */}
              <div className="text-center space-y-0.5">
                <h2 className="font-black text-base uppercase tracking-wider text-black">
                  {restoInfo.name}
                </h2>
                <p className="text-[10px] text-gray-600 leading-tight">
                  {restoInfo.address}
                </p>
                <p className="text-[10px] text-gray-600">
                  WA: {restoInfo.phone}
                </p>
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Info Struk & Nama Pelanggan */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Struk</span>
                  <span className="font-bold">{receiptData.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal</span>
                  <span>{receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kasir</span>
                  <span>{receiptData.cashierName}</span>
                </div>
                {/* PENAMAAN PELANGGAN DI STRUK */}
                <div className="flex justify-between items-center py-1 px-2 bg-amber-50/90 rounded border border-amber-200 my-1 font-bold">
                  <span className="text-amber-900">Pelanggan:</span>
                  <span className="text-amber-950 uppercase font-black tracking-wide">
                    {receiptData.customerName}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Rincian Item Pesanan */}
              <div className="space-y-1.5">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-2">
                      <span className="font-bold">{item.qty}x</span> {item.name}
                    </div>
                    <span className="shrink-0 font-bold tabular-nums">
                      {(item.price * item.qty).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Total & Biaya */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">Rp {receiptData.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak Resto ({restoInfo.taxPercent}%)</span>
                  <span className="tabular-nums">Rp {receiptData.tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-black pt-1 border-t border-gray-300">
                  <span>TOTAL</span>
                  <span className="tabular-nums">Rp {receiptData.grandTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 pt-0.5">
                  <span>Metode Bayar</span>
                  <span className="font-bold uppercase text-emerald-800">{receiptData.paymentMethod} (LUNAS)</span>
                </div>
                {receiptData.notes && (
                  <div className="text-[10px] text-gray-600 pt-1 italic">
                    Catatan: {receiptData.notes}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 my-2" />

              {/* Pesan Kaki Struk */}
              <div className="text-center text-[10px] text-gray-500 whitespace-pre-line leading-relaxed pt-1">
                {restoInfo.receiptFooter}
              </div>
            </div>

            {/* Tombol Aksi Modal (No-Print) */}
            <div className="space-y-2 no-print pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl bg-[#4E6148] hover:bg-[#3D4D38] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Struk (Thermal / Print)
              </button>

              <button
                type="button"
                onClick={handleNewTransaction}
                className="w-full py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFE9DF] text-[#2C2623] border border-[#E5DEC9] text-xs font-bold text-center transition-colors cursor-pointer"
              >
                ✓ Transaksi Baru Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT CSS KHUSUS STRUK KASIR ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print, .no-print-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}