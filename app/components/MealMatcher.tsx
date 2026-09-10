'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'; // Sesuaikan path jika lokasi lib kamu berbeda

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  is_available: boolean;
};

type MealMatcherProps = {
  onAddToCart?: (id: string, name: string, price: number) => void;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export default function MealMatcher({ onAddToCart }: MealMatcherProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Preference States
  const [mood, setMood] = useState('Lapar Banget');
  const [taste, setTaste] = useState('Pedas Nampol');
  const [time, setTime] = useState('Makan Siang');
  const [budget, setBudget] = useState('Semua Bujet');

  // Matched Output State
  const [matchedCombo, setMatchedCombo] = useState<{
    title: string;
    tag: string;
    items: MenuItem[];
    totalPrice: number;
    rationale: string;
    image: string;
  } | null>(null);

  // 1. Fetch menu asli & tersedia dari Supabase
  useEffect(() => {
    const fetchAvailableMenu = async () => {
      setIsLoadingMenu(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true);

        if (error) {
          console.error('Error MealMatcher:', error.message);
        } else if (data && data.length > 0) {
          const formatted: MenuItem[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: Number(item.price),
            description: item.description || '',
            image: item.image || DEFAULT_IMAGE,
            is_available: item.is_available,
          }));
          setMenuItems(formatted);
          generateRecommendation(formatted, budget, taste, mood);
        }
      } catch (err) {
        console.error('Crash fetch menu:', err);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchAvailableMenu();
  }, []);

  // 2. Racik kombo secara dinamis dari data asli Supabase
  const generateRecommendation = (
    items: MenuItem[],
    currentBudget = budget,
    currentTaste = taste,
    currentMood = mood
  ) => {
    if (!items || items.length === 0) return;

    // Filter batas maksimal bujet
    let maxBudget = Infinity;
    if (currentBudget === '< Rp30k') maxBudget = 30000;
    else if (currentBudget === 'Rp30k - Rp50k') maxBudget = 50000;

    let availableForCombo = items.filter((i) => i.price <= maxBudget);
    if (availableForCombo.length === 0) availableForCombo = items; // Fallback jika tidak ada yang masuk di bawah bujet

    // Kelompokkan Makanan Utama & Minuman/Cemilan
    const mains = availableForCombo.filter(
      (i) =>
        i.category.toLowerCase().includes('makanan') ||
        i.category.toLowerCase().includes('hewani') ||
        i.category.toLowerCase().includes('paket')
    );
    const sides = availableForCombo.filter(
      (i) =>
        i.category.toLowerCase().includes('minuman') ||
        i.category.toLowerCase().includes('cemilan') ||
        i.category.toLowerCase().includes('dimsum')
    );

    const pickedItems: MenuItem[] = [];

    // Pilih 1 Makanan Utama
    if (mains.length > 0) {
      const randomMain = mains[Math.floor(Math.random() * mains.length)];
      pickedItems.push(randomMain);
    } else if (availableForCombo.length > 0) {
      pickedItems.push(availableForCombo[Math.floor(Math.random() * availableForCombo.length)]);
    }

    // Tambah 1 Minuman/Pendamping kalau bujet masih muat
    let currentCost = pickedItems.reduce((acc, curr) => acc + curr.price, 0);
    for (const side of sides) {
      if (!pickedItems.find((p) => p.id === side.id) && currentCost + side.price <= maxBudget) {
        pickedItems.push(side);
        break;
      }
    }

    const totalPrice = pickedItems.reduce((sum, item) => sum + item.price, 0);
    const comboTitle = pickedItems.map((i) => i.name).join(' + ');
    const mainImage = pickedItems[0]?.image || DEFAULT_IMAGE;

    // Analisis rasional dinamis
    let rationale = `Sajian pas untuk mood ${currentMood.toLowerCase()} dengan karakter rasa ${currentTaste.toLowerCase()}.`;
    if (pickedItems.length > 1) {
      rationale += ` Kombinasi segar ${pickedItems[0].name} dipadu ${pickedItems[1].name} bikin makan makin pas di kantong.`;
    }

    setMatchedCombo({
      title: comboTitle,
      tag: pickedItems.length > 1 ? 'PAKET KOMBO AI' : 'REKOMENDASI AI',
      items: pickedItems,
      totalPrice,
      rationale,
      image: mainImage,
    });
  };

  const handleMatchClick = () => {
    generateRecommendation(menuItems, budget, taste, mood);
  };

  const handleAddComboToCart = () => {
    if (!matchedCombo || !onAddToCart) return;
    matchedCombo.items.forEach((item) => {
      onAddToCart(item.id, item.name, item.price);
    });
  };

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-10 py-12">
      {/* Header */}
      <div className="text-center space-y-2 mb-10">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#4E6148] bg-[#EFE9DF] px-3.5 py-1 rounded-full border border-[#E2DDD5]">
          WAROENG AI ENGINE V2.5
        </span>
        <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-[#2C2623] tracking-tight">
          Bingung Makan Apa? Biarkan AI Meracik
        </h2>
        <p className="text-xs sm:text-sm text-[#6C6663]">
          Pilih preferensi rasa dan bujet, sistem kami akan memadukan menu paling cocok dari stok dapur real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Preferensi (Kiri) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFECE6] shadow-xs space-y-6">
          {/* 1. MOOD */}
          <div>
            <label className="text-xs font-bold text-[#8C857E] uppercase tracking-wider block mb-2.5">
              1. KONDISI MOOD
            </label>
            <div className="flex flex-wrap gap-2">
              {['Lapar Banget', 'Santal', 'Fokus', 'Self-Reward'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMood(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mood === item
                      ? 'bg-[#3A4836] text-white shadow-xs'
                      : 'bg-[#F6F4F0] text-[#6C6663] hover:text-black'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 2. PROFIL RASA */}
          <div>
            <label className="text-xs font-bold text-[#8C857E] uppercase tracking-wider block mb-2.5">
              2. PROFIL RASA
            </label>
            <div className="flex flex-wrap gap-2">
              {['Pedas Nampol', 'Gurih Manis'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTaste(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    taste === item
                      ? 'bg-[#3A4836] text-white shadow-xs'
                      : 'bg-[#F6F4F0] text-[#6C6663] hover:text-black'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 3. SUASANA WAKTU */}
          <div>
            <label className="text-xs font-bold text-[#8C857E] uppercase tracking-wider block mb-2.5">
              3. SUASANA WAKTU
            </label>
            <div className="flex flex-wrap gap-2">
              {['Makan Siang', 'Cuaca Hujan', 'Nongkrong'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTime(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    time === item
                      ? 'bg-[#3A4836] text-white shadow-xs'
                      : 'bg-[#F6F4F0] text-[#6C6663] hover:text-black'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 4. TARGET BUJET */}
          <div>
            <label className="text-xs font-bold text-[#8C857E] uppercase tracking-wider block mb-2.5">
              4. TARGET BUJET
            </label>
            <div className="flex flex-wrap gap-2">
              {['< Rp30k', 'Rp30k - Rp50k', 'Semua Bujet'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBudget(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    budget === item
                      ? 'bg-[#8E3B24] text-white shadow-xs'
                      : 'bg-[#F6F4F0] text-[#6C6663] hover:text-black'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleMatchClick}
            disabled={isLoadingMenu || menuItems.length === 0}
            className="w-full bg-[#3A4836] hover:bg-[#2D382A] disabled:bg-gray-300 text-white py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-98 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            ✨ TEMUKAN KOMBO MENU SEKARANG
          </button>
        </div>

        {/* Tampilan Hasil Kombo AI (Kanan) */}
        <div className="lg:col-span-5">
          {isLoadingMenu ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EFECE6] text-[#736D69] text-xs font-semibold">
              Menganalisis menu aktif di dapur Supabase...
            </div>
          ) : matchedCombo ? (
            <div className="bg-white rounded-3xl overflow-hidden border border-[#EFECE6] shadow-md flex flex-col justify-between">
              <div className="relative h-56 sm:h-64 w-full bg-neutral-100">
                <Image
                  src={matchedCombo.image}
                  alt={matchedCombo.title}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <span className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  {matchedCombo.tag}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-base sm:text-lg text-[#2C2623] leading-snug">
                    {matchedCombo.title}
                  </h3>
                  <button
                    type="button"
                    onClick={handleMatchClick}
                    className="text-xs font-bold text-[#8E3B24] hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    🎲 Acak Lain
                  </button>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EFECE6] p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#4E6148] uppercase tracking-wider block">
                    💡 ANALISIS AI:
                  </span>
                  <p className="text-xs text-[#6C6663] italic leading-relaxed">
                    &quot;{matchedCombo.rationale}&quot;
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#F0ECE6]">
                  <div>
                    <span className="text-[10px] font-bold text-[#8C857E] uppercase block">Harga Kombo</span>
                    <span className="text-lg font-black text-[#8E3B24]">
                      Rp {matchedCombo.totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddComboToCart}
                    className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    + Tambah Kombo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EFECE6] text-[#736D69] text-xs font-semibold">
              Belum ada menu yang tersedia di dapur.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}