'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ComboItem, ALL_MEAL_ITEMS } from '../data';

interface MealMatcherProps {
  onAddToCart: (id: string, name: string, price: number) => void;
}

export default function MealMatcher({ onAddToCart }: MealMatcherProps) {
  const [selectedMood, setSelectedMood] = useState('Lapar Banget');
  const [selectedRasa, setSelectedRasa] = useState('Pedas Nampol');
  const [selectedBudget, setSelectedBudget] = useState('Semua Bujet');
  const [selectedVibe, setSelectedVibe] = useState('Makan Siang');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<ComboItem>(ALL_MEAL_ITEMS[0]);

  const handleRecommend = () => {
    setIsAiLoading(true);

    setTimeout(() => {
      let filtered = ALL_MEAL_ITEMS.filter((item) => {
        if (selectedBudget === '< Rp30k') return item.price <= 30000;
        if (selectedBudget === 'Rp30k - Rp50k') return item.price > 30000 && item.price <= 50000;
        return true;
      });

      if (filtered.length === 0) filtered = ALL_MEAL_ITEMS;

      const scored = filtered.map((item) => {
        let score = 0;
        if (item.rasa === selectedRasa) score += 40;
        if (item.mood.includes(selectedMood)) score += 30;
        if (item.vibe.includes(selectedVibe)) score += 30;
        return { item, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const bestScore = scored[0]?.score ?? 0;
      const bestCandidates = scored.filter((s) => s.score === bestScore);
      const pick = bestCandidates[Math.floor(Math.random() * bestCandidates.length)].item;

      setRecommendation(pick);
      setIsAiLoading(false);
    }, 400);
  };

  return (
    <section id="ai-matcher" className="bg-[#F6F2EC] py-20 px-6 scroll-mt-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-block bg-[#E3EBE0] text-[#4E6148] text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full">
            Waroeng AI Engine v2.5
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#2C2623]">
            Bingung Makan Apa? Biarkan AI Meracik
          </h2>
          <p className="text-xs sm:text-sm text-[#736D69]">
            Pilih preferensi rasa dan bujet, sistem kami akan memadukan menu paling cocok.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EFECE6] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-black tracking-wider text-[#938C87] uppercase block mb-2.5">
                  1. Kondisi Mood
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Lapar Banget', 'Santai', 'Fokus', 'Self-Reward'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedMood(item)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        selectedMood === item
                          ? 'bg-[#4E6148] text-white shadow-sm'
                          : 'bg-[#F9F7F4] text-[#6C6663] hover:bg-[#EFECE6]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black tracking-wider text-[#938C87] uppercase block mb-2.5">
                  2. Profil Rasa
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Pedas Nampol', 'Gurih Manis'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedRasa(item)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        selectedRasa === item
                          ? 'bg-[#4E6148] text-white shadow-sm'
                          : 'bg-[#F9F7F4] text-[#6C6663] hover:bg-[#EFECE6]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black tracking-wider text-[#938C87] uppercase block mb-2.5">
                  3. Suasana Waktu
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Makan Siang', 'Cuaca Hujan', 'Nongkrong'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedVibe(item)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        selectedVibe === item
                          ? 'bg-[#4E6148] text-white shadow-sm'
                          : 'bg-[#F9F7F4] text-[#6C6663] hover:bg-[#EFECE6]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black tracking-wider text-[#938C87] uppercase block mb-2.5">
                  4. Target Bujet
                </label>
                <div className="flex flex-wrap gap-2">
                  {['< Rp30k', 'Rp30k - Rp50k', 'Semua Bujet'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedBudget(item)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        selectedBudget === item
                          ? 'bg-[#8E3B24] text-white shadow-sm'
                          : 'bg-[#F9F7F4] text-[#6C6663] hover:bg-[#EFECE6]'
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
              disabled={isAiLoading}
              className="w-full bg-[#4E6148] hover:bg-[#3D4D38] text-white py-3.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-98"
            >
              {isAiLoading ? 'Menghitung Komposisi Terbaik...' : '✨ Temukan Kombo Menu Sekarang'}
            </button>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EFECE6] flex flex-col justify-between relative">
            {isAiLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-[#4E6148] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black text-[#4E6148]">Menganalisis Rasa...</span>
              </div>
            )}

            <div>
              <div className="relative h-56 w-full bg-neutral-100">
                <Image
                  src={recommendation.image}
                  alt={recommendation.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {recommendation.category}
                </span>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8E3B24] uppercase tracking-wider">{recommendation.tags}</span>
                  <button
                    onClick={handleRecommend}
                    className="text-[10px] font-bold text-gray-500 hover:text-black transition-colors"
                  >
                    🎲 Acak Lain
                  </button>
                </div>
                <h3 className="text-lg font-bold text-[#2C2623] leading-snug">{recommendation.name}</h3>
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE7E1]">
                  <span className="text-[10px] font-black text-[#4E6148] tracking-wider uppercase block mb-1">
                    💡 Analisis AI:
                  </span>
                  <p className="text-xs text-[#524D4A] italic leading-relaxed">
                    "{recommendation.aiReason}"
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-[#F0ECE6] flex items-center justify-between mt-4">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Harga Kombo</span>
                <span className="text-lg font-extrabold text-[#2C2623]">
                  Rp {recommendation.price.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={() => onAddToCart(recommendation.id, recommendation.name, recommendation.price)}
                className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                + Tambah Kombo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}