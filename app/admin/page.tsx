'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'; // Sesuaikan path jika lokasi lib kamu berbeda

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  order_type: 'Dine In' | 'Takeaway';
  grand_total: number;
  subtotal: number;
  tax: number;
  created_at: string;
  items: OrderItem[];
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  image: string;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month'>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch data pesanan dan menu dari Supabase
 const fetchDashboardData = async () => {
  setIsLoading(true);
  try {
    // 1. Fetch Orders dari Supabase
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('Error orders:', ordersErr.message);
    } else if (ordersData) {
      const formattedOrders: Order[] = ordersData.map((o) => ({
        id: o.id,
        order_type: o.order_type || 'Dine In',
        grand_total: Number(o.grand_total || 0),
        subtotal: Number(o.subtotal || 0),
        tax: Number(o.tax || 0),
        created_at: o.created_at,
        items: Array.isArray(o.items) ? o.items : [],
      }));
      setOrders(formattedOrders);
    }

    // 2. Fetch Menu Items dari Supabase
    const { data: menuData, error: menuErr } = await supabase
      .from('menu_items')
      .select('*');

    if (menuErr) {
      console.error('Error menu:', menuErr.message);
    } else if (menuData) {
      setMenuItems(
        menuData.map((m) => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
          is_available: m.is_available,
          image: m.image || DEFAULT_IMAGE,
        }))
      );
    }
  } catch (err) {
    console.error('Crash fetching dashboard:', err);
  } finally {
    setIsLoading(false); // Apapun yang terjadi, indikator loading PASTI mati
  }
};
  // 2. Filter pesanan berdasarkan rentang waktu yang dipilih
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (timeRange === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeRange === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      } else if (timeRange === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [orders, timeRange]);

  // 3. Kalkulasi metrik keuangan
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.grand_total, 0),
    [filteredOrders]
  );
  const totalOrdersCount = filteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // 4. Aggregasi menu terlaris
  const topSellers = useMemo(() => {
    const itemMap: Record<string, { id: string; name: string; qty: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { id: item.id, name: item.name, qty: 0, revenue: 0 };
        }
        itemMap[item.name].qty += item.qty || 1;
        itemMap[item.name].revenue += (item.price || 0) * (item.qty || 1);
      });
    });

    return Object.values(itemMap).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const bestSellerToday = topSellers[0];

  // 5. Filter stok kosong / habis
  const outOfStockItems = useMemo(
    () => menuItems.filter((item) => !item.is_available),
    [menuItems]
  );

  // 6. Hitung rasio Dine-In vs Takeaway
  const orderTypeCounts = useMemo(() => {
    const counts = { dineIn: 0, takeaway: 0 };
    filteredOrders.forEach((o) => {
      if (o.order_type === 'Takeaway') counts.takeaway++;
      else counts.dineIn++;
    });
    return counts;
  }, [filteredOrders]);

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center text-[#736D69] text-sm font-semibold">
        Memuat data transaksi dan performa restoran...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-8 text-[#2C2623] font-sans">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-[#2C2623]">
            Dashboard Overview
          </h1>
          <p className="text-xs xl:text-sm text-[#736D69] mt-1">
            Pantau performa restoran Anda secara real-time dari data transaksi Supabase.
          </p>
        </div>

        {/* TIME RANGE SELECTOR */}
        <div className="bg-white border border-[#E5DEC9] p-1 rounded-2xl flex items-center text-xs font-bold shadow-xs">
          {(
            [
              { key: 'today', label: 'Hari Ini' },
              { key: '7days', label: '7 Hari Terakhir' },
              { key: 'month', label: 'Bulan Ini' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTimeRange(tab.key)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                timeRange === tab.key
                  ? 'bg-[#8E3B24] text-white shadow-xs'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pendapatan */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBE5D8] shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#736D69] uppercase tracking-wider">
              Total Pendapatan
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              💰
            </span>
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-black text-[#2C2623]">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#736D69] mt-1">
              {timeRange === 'today' ? 'Transaksi hari ini' : 'Total akumulasi'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Pesanan */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBE5D8] shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#736D69] uppercase tracking-wider">
              Total Pesanan
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              🛍️
            </span>
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-black text-[#2C2623]">
              {totalOrdersCount} <span className="text-sm font-normal text-gray-500">transaksi</span>
            </h2>
            <p className="text-[11px] text-[#736D69] mt-1">
              Dine-In: {orderTypeCounts.dineIn} | Takeaway: {orderTypeCounts.takeaway}
            </p>
          </div>
        </div>

        {/* Card 3: Rata-Rata Nilai Pesanan */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBE5D8] shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#736D69] uppercase tracking-wider">
              Rata-Rata / Struk
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              📊
            </span>
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-black text-[#2C2623]">
              Rp {Math.round(avgOrderValue).toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#736D69] mt-1">Nominal rata-rata per pelanggan</p>
          </div>
        </div>

        {/* Card 4: Menu Terlaris */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBE5D8] shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#736D69] uppercase tracking-wider">
              Menu Terlaris
            </span>
            <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
              🔥
            </span>
          </div>
          <div>
            {bestSellerToday ? (
              <>
                <h2 className="text-lg xl:text-xl font-bold text-[#8E3B24] truncate">
                  {bestSellerToday.name}
                </h2>
                <p className="text-xs text-[#736D69] font-medium mt-0.5">
                  Terjual {bestSellerToday.qty} porsi
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL PERFORMA MENU & ALERT STOK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TOP 5 MENU PALING LARIS */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE5D8] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#F0ECE6]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2C2623]">
                Top Menu Paling Laris
              </h3>
              <p className="text-xs text-[#736D69]">Peringkat hidangan terfavorit pelanggan</p>
            </div>
            <span className="text-xs font-bold text-[#4E6148] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E5DEC9]">
              {topSellers.length} Menu Terjual
            </span>
          </div>

          {topSellers.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Belum ada data penjualan pada periode ini.
            </div>
          ) : (
            <div className="space-y-4">
              {topSellers.slice(0, 5).map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#F0ECE6]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#3A4836] text-white font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#2C2623]">{item.name}</h4>
                      <p className="text-[11px] text-[#736D69]">{item.qty} porsi terjual</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#8E3B24]">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOW STOCK ALERT */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE5D8] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#F0ECE6]">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-base sm:text-lg font-bold text-[#2C2623]">Status Stok Habis</h3>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              {outOfStockItems.length} Kosong
            </span>
          </div>

          {outOfStockItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-medium">
              ✓ Semua stok menu saat ini tersedia!
            </div>
          ) : (
            <div className="space-y-3">
              {outOfStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-2xl border border-red-100"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2623]">{item.name}</h4>
                    <p className="text-[11px] text-red-600 font-semibold">Stok Tidak Tersedia</p>
                  </div>
                  <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg">
                    Habis
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