'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

type TimeRange = 'Hari Ini' | '7 Hari Terakhir' | 'Bulan Ini';

type OrderItem = {
  id?: string;
  name: string;
  price?: number;
  qty?: number;
};

type Order = {
  id: string;
  created_at: string;
  grand_total: number;
  order_type: string;
  items: OrderItem[];
};

type MenuItemDB = {
  id: string;
  name: string;
  category: string;
  price: number;
  is_available: boolean;
  image: string;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

export default function DashboardOverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Hari Ini');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 1. AMBIL DATA ORDERS & MENU DARI SUPABASE SECARA REALTIME
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) {
        console.error('Error Orders:', ordersErr.message);
      } else if (ordersData) {
        setOrders(
          ordersData.map((o) => ({
            id: o.id,
            created_at: o.created_at,
            grand_total: Number(o.grand_total || o.total || 0),
            order_type: o.order_type || 'Dine In',
            items: Array.isArray(o.items)
              ? o.items
              : typeof o.items === 'string'
              ? JSON.parse(o.items)
              : [],
          }))
        );
      }

      const { data: menuData, error: menuErr } = await supabase
        .from('menu_items')
        .select('*');

      if (menuErr) {
        console.error('Error Menu:', menuErr.message);
      } else if (menuData) {
        setMenuItems(menuData);
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // 2. REALTIME SUBSCRIPTION + AUTO-POLLING INTERVAL (GARANSI REALTIME)
  useEffect(() => {
    fetchDashboardData();

    // Polling setiap 4 detik untuk memastikan angka sinkron 100% tanpa delay kasir
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 4000);

    // Listener saat tab kembali aktif
    const onFocus = () => fetchDashboardData(true);
    window.addEventListener('focus', onFocus);

    // Supabase Realtime Channel
    const channel = supabase
      .channel('dashboard-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchDashboardData(true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  // 3. FILTER TANGGAL PRESISI (HARIAN, 7 HARI, BULAN INI)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    return orders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();

      if (timeRange === 'Hari Ini') {
        return orderTime >= startOfToday && orderTime <= endOfToday;
      } else if (timeRange === '7 Hari Terakhir') {
        // 7 hari penuh ke belakang terhitung dari 6 hari yang lalu 00:00:00 s/d hari ini 23:59:59
        const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
        return orderTime >= startOf7Days && orderTime <= endOfToday;
      } else if (timeRange === 'Bulan Ini') {
        // Mulai tanggal 1 bulan ini 00:00:00 s/d hari ini 23:59:59
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
        return orderTime >= startOfMonth && orderTime <= endOfToday;
      }
      return true;
    });
  }, [orders, timeRange]);

  // 4. METRIK KEUANGAN & JUMLAH PORSI PESANAN
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.grand_total, 0),
    [filteredOrders]
  );

  // Total transaksi struk kasir yang dibuat
  const totalOrdersCount = filteredOrders.length;

  // Total seluruh porsi makanan/minuman yang dipesan (akumulasi qty)
  const totalItemsCount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      const orderPortions = order.items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0);
      return sum + orderPortions;
    }, 0);
  }, [filteredOrders]);

  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // 5. TOP 5 MENU PALING LARIS
  const topMenus = useMemo(() => {
    const itemMap: Record<
      string,
      { name: string; category: string; qty: number; revenue: number; image: string }
    > = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const rawName = (item.name || '').trim();
        if (!rawName) return;

        const matchedMenu = menuItems.find(
          (m) =>
            (m.name || '').trim().toLowerCase() === rawName.toLowerCase() ||
            (item.id && m.id === item.id)
        );
        const category = matchedMenu?.category || 'Menu Resto';
        const image = matchedMenu?.image || DEFAULT_IMAGE;

        if (!itemMap[rawName]) {
          itemMap[rawName] = { name: rawName, category, qty: 0, revenue: 0, image };
        }
        const q = Number(item.qty) || 1;
        const p = Number(item.price) || (matchedMenu?.price || 0);

        itemMap[rawName].qty += q;
        itemMap[rawName].revenue += p * q;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        category: item.category,
        qty: item.qty,
        sales: `${item.qty} porsi`,
        revenue: `Rp ${item.revenue.toLocaleString('id-ID')}`,
        image: item.image,
      }));
  }, [filteredOrders, menuItems]);

  const topMenuToday = topMenus[0];

  // Total porsi dari 5 menu terlaris untuk validasi silang
  const top5ItemsCount = useMemo(() => {
    return topMenus.reduce((sum, item) => sum + item.qty, 0);
  }, [topMenus]);

  // 6. LOW STOCK ALERT
  const lowStockItems = useMemo(() => {
    return menuItems
      .filter((item) => !item.is_available)
      .map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        stock: 'Stok Habis / Nonaktif',
        status: 'Kritis',
        image: item.image || DEFAULT_IMAGE,
      }));
  }, [menuItems]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#EFECE6] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2623] tracking-tight">
              Dashboard Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Realtime
            </span>
          </div>
          <p className="text-xs text-[#736D69] mt-1">
            Data penjualan tersinkronisasi otomatis dengan mesin kasir POS.
            {lastUpdated && <span className="ml-1 text-stone-400">Terakhir: {lastUpdated}</span>}
          </p>
        </div>

        {/* Filter Periode & Refresh Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#EFECE6] p-1 rounded-2xl flex items-center border border-[#E5DEC9]">
            {(['Hari Ini', '7 Hari Terakhir', 'Bulan Ini'] as TimeRange[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === tab
                    ? 'bg-white text-[#2C2623] shadow-xs'
                    : 'text-[#736D69] hover:text-[#2C2623]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            title="Segarkan Data Realtime"
            className="p-2 rounded-xl border border-[#E5DEC9] bg-white hover:bg-[#FAF8F5] text-[#524D4A] transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#8E3B24]' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* METRIK 1: TOTAL PENDAPATAN */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                TOTAL PENDAPATAN
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#6B7C5E]/15 text-[#6B7C5E] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pendapatan Kotor ({timeRange})</span>
          </div>
        </div>

        {/* METRIK 2: TOTAL PORSI DIPESAN & TRANSAKSI */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                TOTAL MENU DIPESAN
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <h3 className="text-2xl font-black text-[#2C2623]">{totalItemsCount}</h3>
                <span className="text-xs font-bold text-[#736D69]">porsi</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#E67E22]/15 text-[#E67E22] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#4E6148]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{totalOrdersCount} Transaksi Struk</span>
            </div>
            <span className="text-[10px] text-stone-400 font-normal">({timeRange})</span>
          </div>
        </div>

        {/* METRIK 3: RATA-RATA / STRUK */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                RATA-RATA / STRUK
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">
                Rp {Math.round(avgOrderValue).toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-200/60 text-[#524D4A] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#524D4A]">
            <span>Nominal Rata-rata per Struk</span>
          </div>
        </div>

        {/* METRIK 4: MENU TERLARIS */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                MENU TERLARIS
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#4E6148]/15 text-[#4E6148] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#EFECE6]">
              <Image
                src={topMenuToday ? topMenuToday.image : DEFAULT_IMAGE}
                alt={topMenuToday ? topMenuToday.name : 'Menu Terlaris'}
                fill
                unoptimized
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-[#2C2623] leading-snug truncate block">
                {topMenuToday ? topMenuToday.name : 'Belum ada data'}
              </span>
              <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                {topMenuToday ? topMenuToday.sales : '0 porsi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 5 MENU & LOW STOCK ALERT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Top 5 Menu */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#F2EDE4]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2C2623]">Top 5 Menu Paling Laris</h2>
              <p className="text-xs text-[#736D69] mt-0.5">Urutan menu berdasarkan jumlah porsi yang terjual ({timeRange})</p>
            </div>
            <span className="text-xs font-bold text-[#8E3B24] bg-[#FFF8F5] border border-[#F9EBE6] px-2.5 py-1 rounded-lg">
              {topMenus.length} Menu
            </span>
          </div>

          {topMenus.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Belum ada data penjualan menu pada periode {timeRange}.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="divide-y divide-[#F2EDE4]">
                {topMenus.map((item, index) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="w-5 text-center text-xs font-black text-[#8E3B24]">
                        #{index + 1}
                      </span>
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#EFECE6]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#2C2623]">{item.name}</h4>
                        <span className="inline-block bg-[#F2EDE4] text-[#736D69] text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-sm text-[#2C2623]">{item.sales}</span>
                      <span className="text-xs text-[#736D69] font-medium">{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rangkuman Porsi */}
              <div className="mt-4 pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-xs text-[#736D69] bg-[#FAF8F5] p-3 rounded-xl border">
                <span>Total Porsi 5 Menu Terlaris:</span>
                <span className="font-bold text-[#2C2623]">
                  {top5ItemsCount} porsi ({totalItemsCount > 0 ? Math.round((top5ItemsCount / totalItemsCount) * 100) : 0}% dari {totalItemsCount} porsi keseluruhan)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Low Stock Alert */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#F2EDE4]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2C2623]">Low Stock Alert</h2>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
              {lowStockItems.length} Item
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-medium flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Semua stok menu saat ini tersedia lengkap!</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFF8F5] p-3 rounded-2xl border border-[#F9EBE6] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#EFECE6]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-[#2C2623]">{item.name}</h4>
                      <p className="text-[11px] text-[#736D69] font-medium mt-0.5">{item.stock}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#A33838] text-white">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
