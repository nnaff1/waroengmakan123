'use client';

import React, { useState } from 'react';
import Image from 'next/image';

type TimeRange = 'Hari Ini' | '7 Hari Terakhir' | 'Bulan Ini';

export default function DashboardOverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('Hari Ini');

  // Top Menu Data
  const topMenus = [
    {
      id: 1,
      name: 'Ayam Goreng Balado',
      category: 'Lauk Hewani',
      sales: '42 porsi',
      revenue: 'Rp 1.470.000',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      name: 'Tumis Kangkung Terasi',
      category: 'Sayur',
      sales: '38 porsi',
      revenue: 'Rp 570.000',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      name: 'Dimsum Hakau',
      category: 'Dimsum/Mochi',
      sales: '29 porsi',
      revenue: 'Rp 725.000',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 4,
      name: 'Sayur Asem Jakarta',
      category: 'Sayur',
      sales: '24 porsi',
      revenue: 'Rp 360.000',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // Low Stock Items Data
  const lowStockItems = [
    {
      id: 1,
      name: 'Stok Kulit Dimsum',
      stock: 'Sisa 2 pack',
      status: 'Kritis',
      statusType: 'critical',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 2,
      name: 'Cabai Balado',
      stock: 'Sisa 1.5 kg',
      status: 'Rendah',
      statusType: 'warning',
      image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      name: 'Kangkung Segar',
      stock: 'Sisa 2 ikat',
      status: 'Rendah',
      statusType: 'warning',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2623] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[#736D69] mt-1">Pantau performa restoran Anda hari ini.</p>
        </div>

        {/* Time Tabs */}
        <div className="bg-[#EFECE6] p-1 rounded-xl flex items-center border border-[#E5DEC9] self-start sm:self-auto">
          {(['Hari Ini', '7 Hari Terakhir', 'Bulan Ini'] as TimeRange[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeRange(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
        {/* Total Pendapatan */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                TOTAL PENDAPATAN HARI INI
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">Rp 12.500.000</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#6B7C5E]/15 text-[#6B7C5E] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#4E6148]">
            <span>📈 +12%</span>
            <span className="text-[#98928E] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                TOTAL PESANAN
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">145</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#E67E22]/15 text-[#E67E22] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#4E6148]">
            <span>📈 +5%</span>
            <span className="text-[#98928E] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Rata-rata Nilai Pesanan */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                RATA-RATA NILAI PESANAN
              </span>
              <h3 className="text-2xl font-black text-[#2C2623] mt-2">Rp 86.200</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-200/60 text-[#524D4A] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#C0392B]">
            <span>📉 -2%</span>
            <span className="text-[#98928E] font-normal">vs kemarin</span>
          </div>
        </div>

        {/* Menu Terlaris Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#736D69] uppercase">
                MENU TERLARIS HARI INI
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#4E6148]/15 text-[#4E6148] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#EFECE6]">
              <Image
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80"
                alt="Ayam Goreng Balado"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <span className="font-extrabold text-sm text-[#2C2623] leading-snug">
              Ayam Goreng Balado
            </span>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2C2623]">Sales Trend</h2>
          <div className="flex items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#596E54]"></span>
              <span className="text-[#524D4A]">Dine-in</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A35238]"></span>
              <span className="text-[#524D4A]">Takeaway</span>
            </div>
          </div>
        </div>

        {/* Dynamic SVG Chart */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[650px] h-64 relative pt-4 pb-8">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="780" y2="20" stroke="#F0ECE6" strokeWidth="1" />
              <line x1="40" y1="60" x2="780" y2="60" stroke="#F0ECE6" strokeWidth="1" />
              <line x1="40" y1="100" x2="780" y2="100" stroke="#F0ECE6" strokeWidth="1" />
              <line x1="40" y1="140" x2="780" y2="140" stroke="#F0ECE6" strokeWidth="1" />
              <line x1="40" y1="180" x2="780" y2="180" stroke="#F0ECE6" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="15" y="24" fill="#98928E" fontSize="11" textAnchor="end">80</text>
              <text x="15" y="64" fill="#98928E" fontSize="11" textAnchor="end">60</text>
              <text x="15" y="104" fill="#98928E" fontSize="11" textAnchor="end">40</text>
              <text x="15" y="144" fill="#98928E" fontSize="11" textAnchor="end">20</text>
              <text x="15" y="184" fill="#98928E" fontSize="11" textAnchor="end">0</text>

              {/* Gradient Area under Dine-in line */}
              <defs>
                <linearGradient id="dineInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#596E54" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#596E54" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dine-in Shaded Path */}
              <path
                d="M 50 160 Q 115 145 180 100 T 310 70 T 440 130 T 570 140 T 700 40 T 770 130 L 770 180 L 50 180 Z"
                fill="url(#dineInGrad)"
              />

              {/* Dine-in Solid Green Line */}
              <path
                d="M 50 160 Q 115 145 180 100 T 310 70 T 440 130 T 570 140 T 700 40 T 770 130"
                fill="none"
                stroke="#596E54"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Takeaway Dashed Brown Line */}
              <path
                d="M 50 168 Q 115 155 180 120 T 310 105 T 440 145 T 570 155 T 700 80 T 770 145"
                fill="none"
                stroke="#A35238"
                strokeWidth="2.5"
                strokeDasharray="5,5"
                strokeLinecap="round"
              />

              {/* Data Dots Dine-In */}
              {[
                { x: 50, y: 160 }, { x: 115, y: 145 }, { x: 180, y: 100 }, { x: 245, y: 70 },
                { x: 310, y: 75 }, { x: 375, y: 125 }, { x: 440, y: 135 }, { x: 505, y: 140 },
                { x: 570, y: 110 }, { x: 635, y: 40 }, { x: 700, y: 50 }, { x: 770, y: 130 }
              ].map((pt, i) => (
                <circle key={`d-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#596E54" stroke="#FFF" strokeWidth="1.5" />
              ))}

              {/* Data Dots Takeaway */}
              {[
                { x: 50, y: 168 }, { x: 115, y: 155 }, { x: 180, y: 120 }, { x: 245, y: 105 },
                { x: 310, y: 107 }, { x: 375, y: 138 }, { x: 440, y: 145 }, { x: 505, y: 152 },
                { x: 570, y: 130 }, { x: 635, y: 80 }, { x: 700, y: 88 }, { x: 770, y: 145 }
              ].map((pt, i) => (
                <circle key={`t-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#A35238" stroke="#FFF" strokeWidth="1" />
              ))}
            </svg>

            {/* X Axis Time Labels */}
            <div className="flex justify-between pl-10 pr-2 pt-2 text-[11px] text-[#98928E] font-medium">
              <span>10:00</span>
              <span>11:00</span>
              <span>12:00</span>
              <span>13:00</span>
              <span>14:00</span>
              <span>15:00</span>
              <span>16:00</span>
              <span>17:00</span>
              <span>18:00</span>
              <span>19:00</span>
              <span>20:00</span>
              <span>21:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top 5 Menu vs Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top 5 Menu Paling Laris */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2C2623]">Top 5 Menu Paling Laris</h2>
            <button className="text-xs font-bold text-[#736D69] hover:text-[#2C2623] transition-colors">
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-[#F2EDE4]">
            {topMenus.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#EFECE6]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
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
        </div>

        {/* Low Stock Alert */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#EFECE6] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg">⚠️</span>
                <h2 className="text-xl font-bold text-[#2C2623]">Low Stock Alert</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

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
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-[#2C2623]">{item.name}</h4>
                      <p className="text-[11px] text-[#736D69] font-medium mt-0.5">{item.stock}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      item.statusType === 'critical'
                        ? 'bg-[#A33838] text-white'
                        : 'bg-[#8A3E2A] text-white'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-4 bg-[#EFECE6] hover:bg-[#E2DDD3] text-[#2C2623] py-2.5 rounded-xl text-xs font-bold transition-all">
            Buat Pesanan Bahan Baku
          </button>
        </div>
      </div>
    </div>
  );
}