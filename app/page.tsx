'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ComboItem = {
  name: string;
  category: string;
  tags: string;
  price: string;
  image: string;
};

type MenuItem = {
  id: string;
  name: string;
  category: 'Makanan Utama' | 'Minuman' | 'Cemilan';
  price: string;
  description: string;
  image: string;
  isPopular?: boolean;
};

// Database Kombinasi AI
const MEAL_DATABASE: Record<string, ComboItem> = {
  'Lapar Banget-Pedas Nampol-< Rp30k': {
    name: 'Nasi Ayam Geprek Sambal Ijo + Es Teh',
    category: 'Paket Puas Hemat',
    tags: 'Spicy & Crispy',
    price: 'Rp 25.000',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  },
  'Lapar Banget-Pedas Nampol-Bebas': {
    name: 'Ayam Balado + Tumis Kangkung + Mochi Daifuku',
    category: 'Paket Kombo Sultan',
    tags: 'Spicy & Savory',
    price: 'Rp 45.000',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  'Lapar Banget-Gurih Manis-< Rp30k': {
    name: 'Nasi Telur Dadar Bumbu Kecap + Kerupuk',
    category: 'Paket Hemat Kenyang',
    tags: 'Sweet & Umami',
    price: 'Rp 22.000',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  },
  'Lapar Banget-Gurih Manis-Bebas': {
    name: 'Nasi Rendang Sapi + Perkedel + Es Jeruk',
    category: 'Paket Kombo Lengkap',
    tags: 'Rich & Savory',
    price: 'Rp 48.000',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
  },
  'Santai-Pedas Nampol-< Rp30k': {
    name: 'Ceker Mercon + Es Teh Manis',
    category: 'Cemilan Pedas',
    tags: 'Extra Spicy',
    price: 'Rp 20.000',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
  'Santai-Pedas Nampol-Bebas': {
    name: 'Mie Goreng Jawa Pedas + Sate Taichan',
    category: 'Paket Nongkrong Pedas',
    tags: 'Hot & Tasty',
    price: 'Rp 35.000',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
  },
  'Santai-Gurih Manis-< Rp30k': {
    name: 'Pisang Goreng Keju + Kopi Tubruk',
    category: 'Cemilan Santai',
    tags: 'Sweet & Cozy',
    price: 'Rp 24.000',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
  },
  'Santai-Gurih Manis-Bebas': {
    name: 'Martabak Manis Cokelat Keju + Es Kopi Susu',
    category: 'Paket Sweet Treats',
    tags: 'Sweet & Creamy',
    price: 'Rp 40.000',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
  },
};

// Data Katalog Menu Lengkap
const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Nasi Rendang Sapi Premium',
    category: 'Makanan Utama',
    price: 'Rp 32.000',
    description: 'Daging sapi pilihan dimasak rempah khas Padang selama 8 jam.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm2',
    name: 'Ayam Balado Sambal Merah',
    category: 'Makanan Utama',
    price: 'Rp 26.000',
    description: 'Ayam goreng empuk dilumuri sambal balado pedas gurih.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm3',
    name: 'Nasi Ayam Geprek Sambal Ijo',
    category: 'Makanan Utama',
    price: 'Rp 22.000',
    description: 'Ayam krispi gurih dengan ulekan sambal ijo super pedas.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm4',
    name: 'Es Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 'Rp 18.000',
    description: 'Espresso robusta dengan susu segar dan gula aren asli.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm5',
    name: 'Es Jeruk Peras Segar',
    category: 'Minuman',
    price: 'Rp 10.000',
    description: 'Perasan jeruk segar alami penyegar tenggorokan.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm6',
    name: 'Pisang Goreng Keju Cokelat',
    category: 'Cemilan',
    price: 'Rp 16.000',
    description: 'Pisang raja renyah ditaburi keju parut dan meises cokelat.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm7',
    name: 'Ceker Mercon Pedas Gila',
    category: 'Cemilan',
    price: 'Rp 15.000',
    description: 'Ceker ayam lembut bumbu mercon ekstra pedas.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
];

export default function LandingPage() {
  const [selectedMood, setSelectedMood] = useState('Lapar Banget');
  const [selectedRasa, setSelectedRasa] = useState('Pedas Nampol');
  const [selectedBudget, setSelectedBudget] = useState('< Rp30k');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const [recommendation, setRecommendation] = useState<ComboItem>(
    MEAL_DATABASE['Lapar Banget-Pedas Nampol-< Rp30k']
  );

  const handleRecommend = () => {
    const key = `${selectedMood}-${selectedRasa}-${selectedBudget}`;
    const result = MEAL_DATABASE[key] || MEAL_DATABASE['Lapar Banget-Pedas Nampol-Bebas'];
    setRecommendation(result);
  };

  const filteredMenu = activeCategory === 'Semua' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2623] font-sans antialiased flex flex-col scroll-smooth">
      {/* NAVBAR */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative">
        <span className="text-2xl font-bold text-[#A3432B] tracking-tight">
          WaroengMakan123
        </span>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A4543]">
          <Link href="#ai-matcher" className="hover:text-[#A3432B] transition-colors">AI Matcher</Link>
          <Link href="#menu" className="hover:text-[#A3432B] transition-colors">Menu</Link>
          <Link href="#locations" className="hover:text-[#A3432B] transition-colors">Locations</Link>
          <Link href="#about" className="hover:text-[#A3432B] transition-colors">About Us</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/admin" 
            className="text-xs font-semibold border border-[#8E3B24] text-[#8E3B24] hover:bg-[#8E3B24] hover:text-white px-4 py-2 rounded-full transition-all"
          >
            Admin Portal
          </Link>
          <button className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm">
            Order Now
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 text-[#2C2623] focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#FDFBF7] border-b border-[#ECE7E1] p-6 flex flex-col gap-4 md:hidden shadow-lg z-50">
            <Link 
              href="#ai-matcher" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-sm font-medium text-[#4A4543] hover:text-[#A3432B]"
            >
              AI Matcher
            </Link>
            <Link 
              href="#menu" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-sm font-medium text-[#4A4543] hover:text-[#A3432B]"
            >
              Menu
            </Link>
            <Link 
              href="#locations" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-sm font-medium text-[#4A4543] hover:text-[#A3432B]"
            >
              Locations
            </Link>
            <Link 
              href="#about" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-sm font-medium text-[#4A4543] hover:text-[#A3432B]"
            >
              About Us
            </Link>
            <Link 
              href="/admin" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-center text-xs font-semibold border border-[#8E3B24] text-[#8E3B24] py-2.5 rounded-full"
            >
              Admin Portal
            </Link>
            <button className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm w-full">
              Order Now
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Cita Rasa Nusantara, <br />
            <span className="text-[#4E6148]">Sentuhan Modern</span>
          </h1>
          <p className="text-[#6C6663] text-base md:text-lg leading-relaxed max-w-md">
            Nikmati kelezatan masakan khas Indonesia yang diracik higienis, cepat, dan rasa autentik di suasana modern.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="#menu" className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-7 py-3 rounded-full text-sm font-medium transition-all inline-block">
              Lihat Menu
            </a>
            <a href="#locations" className="border border-[#3D3A37] hover:bg-[#ECE6DF] text-[#2C2623] px-7 py-3 rounded-full text-sm font-medium transition-all inline-block">
              Lokasi Resto
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-sm aspect-[4/3] w-full bg-[#E8E2D9]">
            <Image
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
              alt="Indonesian dining table set"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="text-xs font-semibold text-[#2C2623]">Highly Rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI MEAL MATCHER SECTION */}
      <section id="ai-matcher" className="bg-[#F6F2EC] py-20 px-6 mt-8 scroll-mt-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#2C2623]">
              Bingung Pilih Lauk? Biarkan AI Racik Kombinasimu
            </h2>
            <p className="text-sm text-[#736D69]">
              Customize your perfect meal based on your mood, cravings, and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Filter Controls Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#EFECE6]">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-[#938C87] uppercase block mb-3">
                    MOOD
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {['Lapar Banget', 'Santai'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedMood(item)}
                        className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedMood === item
                            ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/5 font-semibold'
                            : 'border border-[#DFDAD2] text-[#4A4543] hover:border-gray-400'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-[#938C87] uppercase block mb-3">
                    RASA
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {['Pedas Nampol', 'Gurih Manis'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedRasa(item)}
                        className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedRasa === item
                            ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/5 font-semibold'
                            : 'border border-[#DFDAD2] text-[#4A4543] hover:border-gray-400'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-[#938C87] uppercase block mb-3">
                    BUDGET
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {['< Rp30k', 'Bebas'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedBudget(item)}
                        className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedBudget === item
                            ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/5 font-semibold'
                            : 'border border-[#DFDAD2] text-[#4A4543] hover:border-gray-400'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRecommend}
                className="w-full mt-8 bg-[#4E6148] hover:bg-[#3F503A] text-white py-3.5 rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                Rekomendasikan Menu
              </button>
            </div>

            {/* Recommendation Result Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EFECE6] flex flex-col justify-between">
              <div className="relative h-48 sm:h-52 w-full bg-neutral-100">
                <Image
                  src={recommendation.image}
                  alt={recommendation.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-all duration-300"
                />
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#7D7672]">
                      {recommendation.category}
                    </span>
                    <span className="bg-[#EAEFE8] text-[#4E6148] text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Best Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#2C2623] mt-1.5 min-h-[48px]">
                    {recommendation.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#A3432B] font-medium mt-1">
                    <span>{recommendation.tags}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-between">
                  <span className="text-base font-bold text-[#2C2623]">
                    {recommendation.price}
                  </span>
                  <button className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-5 py-2.5 rounded-full text-xs font-medium transition-colors">
                    Pesan Kombo Ini
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DAFTAR MENU KATALOG */}
      <section id="menu" className="max-w-7xl mx-auto w-full px-6 py-20 scroll-mt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2C2623] tracking-tight">Daftar Menu Favorit</h2>
            <p className="text-sm text-[#6C6663] mt-1">Pilihan santapan lezat buatan koki terbaik kami.</p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 bg-[#F6F2EC] p-1.5 rounded-full border border-[#ECE7E1]">
            {['Semua', 'Makanan Utama', 'Minuman', 'Cemilan'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-[#8E3B24] text-white shadow-sm'
                    : 'text-[#6C6663] hover:text-[#2C2623]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
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
                    <span className="absolute top-3 right-3 bg-[#A3432B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Favorit
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[11px] font-medium text-[#7D7672] uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-base text-[#2C2623]">{item.name}</h3>
                  <p className="text-xs text-[#6C6663] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-transparent">
                <span className="text-base font-bold text-[#A3432B]">{item.price}</span>
                <button className="bg-[#4E6148] hover:bg-[#3F503A] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors">
                  + Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATIONS SECTION */}
      <section id="locations" className="max-w-7xl mx-auto w-full px-6 py-16 border-t border-[#ECE7E1] scroll-mt-6">
        <h2 className="text-2xl font-bold text-[#2C2623] mb-6">Lokasi Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-[#EFECE6]">
            <h3 className="font-semibold text-lg text-[#A3432B]">Cabang Purwokerto Central</h3>
            <p className="text-sm text-[#6C6663] mt-1">Jl. Pahlawan No. 88, Purwokerto Selatan, Central Java</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-[#EFECE6]">
            <h3 className="font-semibold text-lg text-[#A3432B]">Cabang Bandung Central</h3>
            <p className="text-sm text-[#6C6663] mt-1">Jl. Riau No. 45, Citarum, Bandung</p>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="bg-[#ECE7E1] py-16 px-6 scroll-mt-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-[#2C2623]">Tentang WaroengMakan123</h2>
          <p className="text-sm text-[#6C6663] leading-relaxed max-w-2xl mx-auto">
            Berdiri sejak tahun 2024, WaroengMakan123 menyajikan resep autentik Indonesia yang dikemas secara modern, higienis, dan terjangkau untuk semua kalangan.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto max-w-7xl mx-auto w-full px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2 space-y-3">
            <span className="text-xl font-bold text-[#A3432B] tracking-tight">
              WaroengMakan123
            </span>
            <p className="text-xs text-[#6C6663] max-w-sm">
              Authentic Indonesian modern dining experience.
            </p>
            <div className="pt-2">
              <Link 
                href="/admin" 
                className="text-xs text-[#8E3B24] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>🔑 Kelola Data (Admin Dashboard)</span>
              </Link>
            </div>
          </div>
          <div id="contact">
            <h4 className="text-xs font-bold text-[#2C2623] mb-3 uppercase tracking-wider">Contact & Hours</h4>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li>Contact: +62 812-3456-7890</li>
              <li id="hours">Hours: 10:00 - 22:00 WIB</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2C2623] mb-3 uppercase tracking-wider">Social Media</h4>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#2C2623]">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#2C2623]">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#ECE7E1] pt-8 text-center">
          <p className="text-[11px] text-[#A69F99]">
            &copy; 2026 WaroengMakan123. All rights reserved.
          </p>
        </div>
      </footer>

      {/* FLOATING CHATBOT BUTTON */}
      <button 
        aria-label="Open AI Chatbot"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#404D3C] hover:bg-[#343F31] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
}