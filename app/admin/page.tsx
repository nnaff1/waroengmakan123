'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<'hari' | '7hari' | 'bulan'>('hari');

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER OVERVIEW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#2C2623]">
            Dashboard Overview
          </h1>
          <p className="text-xs text-[#736D69] mt-1">
            Pantau performa restoran Anda hari ini.
          </p>
        </div>

        {/* TIME FILTER BUTTONS */}
        <div className="bg-[#EFE9DE] p-1 rounded-2xl inline-flex items-center gap-1 border border-[#E2DCce]">
          <button
            onClick={() => setTimeRange('hari')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === 'hari'
                ? 'bg-white text-[#2C2623] shadow-sm font-bold'
                : 'text-[#736D69] hover:text-[#2C2623]'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setTimeRange('7hari')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === '7hari'
                ? 'bg-white text-[#2C2623] shadow-sm font-bold'
                : 'text-[#736D69] hover:text-[#2C2623]'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setTimeRange('bulan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === 'bulan'
                ? 'bg-white text-[#2C2623] shadow-sm font-bold'
                : 'text-[#736D69] hover:text-[#2C2623]'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pendapatan */}
        <div className="bg-white rounded-3xl p-5 border border-[#EBE5D8] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#938C87] uppercase">
              Total Pendapatan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-[#2C2623]">
            Rp 12.500.000
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <span>↗ +12%</span>
            <span className="text-[#938C87] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-white rounded-3xl p-5 border border-[#EBE5D8] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#938C87] uppercase">
              Total Pesanan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-[#2C2623]">
            145
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <span>↗ +5%</span>
            <span className="text-[#938C87] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Rata-rata Nilai Pesanan */}
        <div className="bg-white rounded-3xl p-5 border border-[#EBE5D8] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#938C87] uppercase">
              Rata-rata Nilai Pesanan
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-[#2C2623]">
            Rp 86.200
          </div>
          <div className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
            <span>↘ -2%</span>
            <span className="text-[#938C87] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Menu Terlaris Hari Ini */}
        <div className="bg-white rounded-3xl p-5 border border-[#EBE5D8] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#938C87] uppercase">
              Menu Terlaris Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-black/5 bg-stone-100">
              <Image
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80"
                alt="Ayam Goreng Balado"
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2C2623] truncate">Ayam Goreng Balado</p>
              <p className="text-[11px] text-[#736D69]">48 porsi terjual</p>
            </div>
          </div>
        </div>
      </div>

      {/* SALES TREND CHART CARD */}
      <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#2C2623]">Sales Trend</h3>
            <p className="text-xs text-[#736D69] mt-0.5">Grafik volume pesanan Dine-in vs Takeaway</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4E6148]"></span>
              <span className="text-[#524D4A]">Dine-in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8E3B24]"></span>
              <span className="text-[#524D4A]">Takeaway</span>
            </div>
          </div>
        </div>

        {/* SVG Representation of Trend Lines */}
        <div className="w-full h-56 relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#F3EFE6" strokeWidth="1" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#F3EFE6" strokeWidth="1" />
            <line x1="0" y1="140" x2="800" y2="140" stroke="#F3EFE6" strokeWidth="1" />
            <line x1="0" y1="190" x2="800" y2="190" stroke="#F3EFE6" strokeWidth="1" />

            {/* Dine-in Curve (Green) */}
            <path
              d="M 0 160 Q 200 60, 400 70 T 800 50"
              fill="none"
              stroke="#4E6148"
              strokeWidth="3"
            />
            {/* Takeaway Curve (Terracotta dashed) */}
            <path
              d="M 0 175 Q 200 120, 400 110 T 800 120"
              fill="none"
              stroke="#8E3B24"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          </svg>

          {/* Time markers */}
          <div className="flex justify-between text-[10px] text-[#938C87] font-semibold pt-3">
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>21:00</span>
          </div>
        </div>
      </div>

      {/* BOTTOM 2 COLUMNS: TOP 5 MENU & LOW STOCK ALERT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Menu */}
        <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#F0ECE6]">
            <h4 className="text-sm font-bold text-[#2C2623]">Top 5 Menu Paling Laris</h4>
            <span className="text-[11px] font-semibold text-[#8E3B24] cursor-pointer hover:underline">
              Lihat Semua
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Ayam Goreng Balado', sold: '48 porsi', price: 'Rp 25.000' },
              { name: 'Dimsum Siu Mai Kukus', sold: '39 porsi', price: 'Rp 18.000' },
              { name: 'Mochi Daifuku Strawberry', sold: '34 porsi', price: 'Rp 15.000' },
              { name: 'Tumis Kangkung Terasi', sold: '29 porsi', price: 'Rp 12.000' },
              { name: 'Es Jeruk Nipis Madu', sold: '25 gelas', price: 'Rp 8.000' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-[#938C87]">{idx + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-[#2C2623]">{item.name}</p>
                    <p className="text-[10px] text-[#736D69]">{item.sold}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2C2623]">{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[#F0ECE6]">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <h4 className="text-sm font-bold text-[#2C2623]">Low Stock Alert</h4>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              3 Bahan Kritis
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Bahan Kulit Mochi (Tepung Ketan)', remaining: 'Sisa 1.2 kg', status: 'Kritis' },
              { name: 'Strawberry Segar (Daifuku)', remaining: 'Sisa 8 pack', status: 'Menipis' },
              { name: 'Daging Ayam Paha Fillet', remaining: 'Sisa 3.5 kg', status: 'Menipis' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE7E1] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#2C2623]">{item.name}</p>
                  <p className="text-[10px] text-[#736D69]">{item.remaining}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  item.status === 'Kritis'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}