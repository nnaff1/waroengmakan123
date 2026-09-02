// app/page.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  const [selectedMood, setSelectedMood] = useState('Lapar Banget');
  const [selectedRasa, setSelectedRasa] = useState('Pedas Nampol');
  const [selectedBudget, setSelectedBudget] = useState('< Rp30k');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2623] font-sans antialiased flex flex-col">
      {/* NAVBAR */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <span className="text-2xl font-bold text-[#A3432B] tracking-tight">
          WaroengMakan123
        </span>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A4543]">
          <Link href="#menu" className="hover:text-[#A3432B] transition-colors">Menu</Link>
          <Link href="#locations" className="hover:text-[#A3432B] transition-colors">Locations</Link>
          <Link href="#about" className="hover:text-[#A3432B] transition-colors">About Us</Link>
        </nav>
        <button className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm">
          Order Now
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Cita Rasa Nusantara, <br />
            <span className="text-[#4E6148]">Sentuhan Modern</span>
          </h1>
          <p className="text-[#6C6663] text-base md:text-lg leading-relaxed max-w-md">
            Experience the authentic flavors of Indonesia reimagined with culinary precision. Our warm minimalist space awaits you.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-7 py-3 rounded-full text-sm font-medium transition-all">
              View Menu
            </button>
            <button className="border border-[#3D3A37] hover:bg-[#ECE6DF] text-[#2C2623] px-7 py-3 rounded-full text-sm font-medium transition-all">
              Book a Table
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-sm aspect-[4/3] w-full bg-[#E8E2D9]">
            <Image
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80"
              alt="Indonesian dining table set"
              fill
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
      <section className="bg-[#F6F2EC] py-20 px-6 mt-8">
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

              <button className="w-full mt-8 bg-[#4E6148] hover:bg-[#3F503A] text-white py-3.5 rounded-full text-sm font-medium transition-colors">
                Rekomendasikan Menu
              </button>
            </div>

            {/* Recommendation Result Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EFECE6] flex flex-col justify-between">
              <div className="relative h-48 sm:h-52 w-full bg-neutral-100">
                <Image
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
                  alt="Ayam Balado, Tumis Kangkung, Mochi Daifuku"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#7D7672]">Paket Kombo</span>
                    <span className="bg-[#EAEFE8] text-[#4E6148] text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Best Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#2C2623] mt-1.5">
                    Ayam Balado + Tumis Kangkung + Mochi Daifuku
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#A3432B] font-medium mt-1">
                    <span>Spicy & Savory</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-between">
                  <span className="text-base font-bold text-[#2C2623]">
                    Rp 45.000
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

      {/* FOOTER */}
      <footer className="mt-auto max-w-7xl mx-auto w-full px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <span className="text-xl font-bold text-[#A3432B] tracking-tight">
              WaroengMakan123
            </span>
          </div>
          <div>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li><Link href="#contact" className="hover:text-[#2C2623]">Contact</Link></li>
              <li><Link href="#hours" className="hover:text-[#2C2623]">Hours</Link></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li><Link href="#instagram" className="hover:text-[#2C2623]">Instagram</Link></li>
              <li><Link href="#facebook" className="hover:text-[#2C2623]">Facebook</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#ECE7E1] pt-8 text-center">
          <p className="text-[11px] text-[#A69F99]">
            &copy; 2024 WaroengMakan123. All rights reserved.
          </p>
        </div>
      </footer>

      {/* FLOATING CHATBOT BUTTON */}
      <button 
        aria-label="Open AI Chatbot"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#404D3C] hover:bg-[#343F31] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
      </button>
    </div>
  );
}