'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

type TimeRange = 'Hari Ini' | '7 Hari Terakhir' | 'Bulan Ini';

type Order = {
  id: string;
  created_at: string;
  grand_total: number;
  order_type: string;
  items: Array<{ id: string; name: string; price: number; qty: number }>;
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

  // 1. TARIK DATA UTAMA DARI SUPABASE
  const fetchDashboardData = async () => {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) console.error('Error Orders:', ordersErr.message);
      else if (ordersData) {
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

      if (menuErr) console.error('Error Menu:', menuErr.message);
      else if (menuData) {
        setMenuItems(menuData);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
    }
  };

  // 2. REALTIME SUBSCRIPTION SUPABASE
  useEffect(() => {
    fetchDashboardData();

    // Dengar perubahan tabel orders secara Live
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchDashboardData(); // Otomatis update angka saat ada transaksi kasir baru
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. FILTER TANGGAL LOKAL (FIX TIMEZONE)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (timeRange === 'Hari Ini') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (timeRange === '7 Hari Terakhir') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      } else if (timeRange === 'Bulan Ini') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [orders, timeRange]);

  // 4. METRIK KEUANGAN
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.grand_total, 0),
    [filteredOrders]
  );
  const totalOrdersCount = filteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // 5. TOP 5 MENU TERLARIS
  const topMenus = useMemo(() => {
    const itemMap: Record<string, { name: string; category: string; qty: number; revenue: number; image: string }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const matchedMenu = menuItems.find((m) => m.name === item.name || m.id === item.id);
        const category = matchedMenu?.category || 'Menu Resto';
        const image = matchedMenu?.image || DEFAULT_IMAGE;

        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, category, qty: 0, revenue: 0, image };
        }
        itemMap[item.name].qty += item.qty || 1;
        itemMap[item.name].revenue += (item.price || 0) * (item.qty || 1);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        category: item.category,
        sales: `${item.qty} porsi`,
        revenue: `Rp ${item.revenue.toLocaleString('id-ID')}`,
        image: item.image,
      }));
  }, [filteredOrders, menuItems]);

  const topMenuToday = topMenus[0];

  // 6. LOW STOCK ALERT
  const lowStockItems = useMemo(() => {
    return menuItems
      .filter((item) => !item.is_available)
      .map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        stock: 'Stok Tidak Tersedia',
        status: 'Kritis',
        statusType: 'critical',
        image: item.image || DEFAULT_IMAGE,
      }));
  }, [menuItems]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2623] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[#736D69] mt-1">Pantau performa restoran Anda secara real-time.</p>
        </div>

        {/* Time Tabs */}
        <div className="bg-[#EFECE6] p-1 rounded-xl flex items-center border border-[#E5DEC9] self-start sm:self-auto">
          {(['Hari Ini', '7 Hari Terakhir', 'Bulan Ini'] as TimeRange[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeRange(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === tab
                  ? 'bg-white text-[#2C2623] shadow-sm'
                  : 'text-[#736D69] hover:text-[#2C2623]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm flex flex-col justify-between">
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
              💰
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#4E6148]">
            <span>📊 Live Data Supabase</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                TOTAL PESANAN
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">{totalOrdersCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#E67E22]/15 text-[#E67E22] flex items-center justify-center shrink-0">
              🛍️
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#4E6148]">
            <span>Transaksi Terbuat</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm flex flex-col justify-between">
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
              📊
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#524D4A]">
            <span>Nominal Rata-rata</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                MENU TERLARIS
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#4E6148]/15 text-[#4E6148] flex items-center justify-center shrink-0">
              🔥
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
            <span className="font-extrabold text-sm text-[#2C2623] leading-snug truncate">
              {topMenuToday ? topMenuToday.name : 'Belum ada data'}
            </span>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart & Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2C2623]">Top 5 Menu Paling Laris</h2>
          </div>

          {topMenus.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada data penjualan menu pada periode ini.
            </div>
          ) : (
            <div className="divide-y divide-[#F2EDE4]">
              {topMenus.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
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
                    <span className="block font-extrabold text-sm text-[#2C2623]">{item.sales}</span>
                    <span className="text-xs text-[#98928E] font-medium">{item.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-600 text-lg">⚠️</span>
            <h2 className="text-xl font-bold text-[#2C2623]">Low Stock Alert</h2>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-medium">
              ✓ Semua stok menu saat ini tersedia lengkap!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFF8F5] p-3.5 rounded-2xl border border-[#F9EBE6] flex items-center justify-between gap-3"
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
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#A33838] text-white">
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