'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ComboItem = {
  id: string;
  name: string;
  category: string;
  tags: string;
  price: number;
  image: string;
  aiReason: string;
  mood: string[];
  rasa: string;
  vibe: string[];
  maxBudget: number;
};

type MenuItem = {
  id: string;
  name: string;
  category: 'Makanan Utama' | 'Minuman' | 'Cemilan';
  price: number;
  description: string;
  image: string;
  isPopular?: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

// Database Kombinasi AI dengan Metadata Filter untuk Smart Matching
const ALL_MEAL_ITEMS: ComboItem[] = [
  {
    id: 'ai-1',
    name: 'Nasi Ayam Geprek Sambal Ijo + Es Teh',
    category: 'Paket Puas Hemat',
    tags: 'Spicy & Crispy',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Sengatan sambal ijo menyegarkan dipadu es teh dingin, pas banget buat santap siang bertenaga!',
    mood: ['Lapar Banget', 'Santai'],
    rasa: 'Pedas Nampol',
    vibe: ['Makan Siang', 'Nongkrong'],
    maxBudget: 30000,
  },
  {
    id: 'ai-2',
    name: 'Ayam Balado + Tumis Kangkung + Mochi',
    category: 'Paket Kombo Sultan',
    tags: 'Spicy & Savory',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Kombinasi komplet lauk pedas gurih khas Nusantara disempurnakan penutup mochi manis.',
    mood: ['Lapar Banget'],
    rasa: 'Pedas Nampol',
    vibe: ['Makan Siang', 'Cuaca Hujan'],
    maxBudget: 999999,
  },
  {
    id: 'ai-3',
    name: 'Nasi Rendang Sapi Premium + Perkedel',
    category: 'Paket Mantap Gurih',
    tags: 'Rich & Savory',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Rendang empuk dimasak 8 jam bumbu rempah autentik buat kamu yang cari santapan gurih mantap.',
    mood: ['Lapar Banget', 'Santai'],
    rasa: 'Gurih Manis',
    vibe: ['Makan Siang', 'Nongkrong'],
    maxBudget: 999999,
  },
  {
    id: 'ai-4',
    name: 'Nasi Telur Dadar Bumbu Kecap + Kerupuk',
    category: 'Paket Hemat Manis',
    tags: 'Sweet & Umami',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Menu comfort food rumahan gurih manis hangat yang ramah di kantong.',
    mood: ['Santai', 'Lapar Banget'],
    rasa: 'Gurih Manis',
    vibe: ['Makan Siang'],
    maxBudget: 30000,
  },
  {
    id: 'ai-5',
    name: 'Mie Goreng Jawa Pedas + Sate Taichan',
    category: 'Paket Hangat Mantap',
    tags: 'Hot & Tasty',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Bumbu rempah mie hangat ditemani sate taichan cocok buat mengusir hawa dingin.',
    mood: ['Lapar Banget', 'Santai'],
    rasa: 'Pedas Nampol',
    vibe: ['Cuaca Hujan', 'Nongkrong'],
    maxBudget: 999999,
  },
  {
    id: 'ai-6',
    name: 'Pisang Goreng Keju + Kopi Tubruk',
    category: 'Cemilan Santai',
    tags: 'Sweet & Cozy',
    price: 24000,
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Manis renyahnya pisang keju ketemu pahitnya kopi tubruk, klop banget buat nongkrong.',
    mood: ['Santai'],
    rasa: 'Gurih Manis',
    vibe: ['Nongkrong', 'Cuaca Hujan'],
    maxBudget: 30000,
  },
  {
    id: 'ai-7',
    name: 'Martabak Manis Cokelat Keju + Es Kopi Susu',
    category: 'Paket Sweet Treats',
    tags: 'Sweet & Creamy',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Sensasi manis legit meises keju dan kopi susu aren pilihan pas saat mood santai.',
    mood: ['Santai'],
    rasa: 'Gurih Manis',
    vibe: ['Nongkrong'],
    maxBudget: 999999,
  },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Nasi Rendang Sapi Premium',
    category: 'Makanan Utama',
    price: 32000,
    description: 'Daging sapi pilihan dimasak rempah khas Padang selama 8 jam.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm2',
    name: 'Ayam Balado Sambal Merah',
    category: 'Makanan Utama',
    price: 26000,
    description: 'Ayam goreng empuk dilumuri sambal balado pedas gurih.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm3',
    name: 'Nasi Ayam Geprek Sambal Ijo',
    category: 'Makanan Utama',
    price: 22000,
    description: 'Ayam krispi gurih dengan ulekan sambal ijo super pedas.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm4',
    name: 'Es Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 18000,
    description: 'Espresso robusta dengan susu segar dan gula aren asli.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm5',
    name: 'Es Jeruk Peras Segar',
    category: 'Minuman',
    price: 10000,
    description: 'Perasan jeruk segar alami penyegar tenggorokan.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm6',
    name: 'Pisang Goreng Keju Cokelat',
    category: 'Cemilan',
    price: 16000,
    description: 'Pisang raja renyah ditaburi keju parut dan meises cokelat.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm7',
    name: 'Ceker Mercon Pedas Gila',
    category: 'Cemilan',
    price: 15000,
    description: 'Ceker ayam lembut bumbu mercon ekstra pedas.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
];

export default function LandingPage() {
  // State Filter AI
  const [selectedMood, setSelectedMood] = useState('Lapar Banget');
  const [selectedRasa, setSelectedRasa] = useState('Pedas Nampol');
  const [selectedBudget, setSelectedBudget] = useState('< Rp30k');
  const [selectedVibe, setSelectedVibe] = useState('Makan Siang');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // State UI Modals & Cart
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // State Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Halo! Ada yang bisa AI bantu untuk rekomendasi santapan hari ini?' }
  ]);

  // State AI Result Initialized
  const [recommendation, setRecommendation] = useState<ComboItem>(ALL_MEAL_ITEMS[0]);

  // SMART MATCHING AI ALGORITHM
  const handleRecommend = () => {
    setIsAiLoading(true);

    setTimeout(() => {
      const budgetLimit = selectedBudget === '< Rp30k' ? 30000 : 999999;

      let candidates = ALL_MEAL_ITEMS.filter((item) => {
        const matchRasa = item.rasa === selectedRasa;
        const matchBudget = item.price <= budgetLimit;
        const matchMood = item.mood.includes(selectedMood);
        const matchVibe = item.vibe.includes(selectedVibe);

        return matchRasa && matchBudget && (matchMood || matchVibe);
      });

      if (candidates.length === 0) {
        candidates = ALL_MEAL_ITEMS.filter(
          (item) => item.rasa === selectedRasa && item.price <= budgetLimit
        );
      }

      if (candidates.length === 0) {
        candidates = ALL_MEAL_ITEMS.filter((item) => item.rasa === selectedRasa);
      }

      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      setRecommendation(selected || ALL_MEAL_ITEMS[0]);
      setIsAiLoading(false);
    }, 500);
  };

  // Cart Management
  const addToCart = (id: string, name: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, name, price, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    let message = 'Halo WaroengMakan123, saya mau pesan:\n';
    cart.forEach((item) => {
      message += `- ${item.name} x${item.qty} (Rp ${(item.price * item.qty).toLocaleString('id-ID')})\n`;
    });
    message += `\n*Total Tagihan: Rp ${totalPrice.toLocaleString('id-ID')}*`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Chatbot Handler
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let reply = 'Tentu! Kami punya Nasi Rendang Sapi dan Ayam Balado yang siap dipesan.';
      if (userMsg.toLowerCase().includes('pedas')) {
        reply = 'Buat pecinta pedas, aku rekomendasikan Nasi Ayam Geprek Sambal Ijo atau Ceker Mercon!';
      } else if (userMsg.toLowerCase().includes('murah') || userMsg.toLowerCase().includes('hemat')) {
        reply = 'Paket Hemat Es Jeruk Peras + Nasi Telur Dadar bener-bener ramah di kantong!';
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  // Filter Catalog
  const filteredMenu = MENU_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2623] font-sans antialiased flex flex-col scroll-smooth">
      {/* NAVBAR */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative">
        <span className="text-2xl font-bold text-[#A3432B] tracking-tight">
          WaroengMakan123
        </span>

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
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
          >
            <span>🛒 Keranjang</span>
            {cart.length > 0 && (
              <span className="bg-white text-[#8E3B24] text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 text-[#2C2623]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#FDFBF7] border-b border-[#ECE7E1] p-6 flex flex-col gap-4 md:hidden shadow-lg z-50">
            <Link href="#ai-matcher" onClick={() => setIsMobileMenuOpen(false)}>AI Matcher</Link>
            <Link href="#menu" onClick={() => setIsMobileMenuOpen(false)}>Menu</Link>
            <Link href="#locations" onClick={() => setIsMobileMenuOpen(false)}>Locations</Link>
            <Link href="#about" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-center border border-[#8E3B24] text-[#8E3B24] py-2 rounded-full">
              Admin Portal
            </Link>
            <button onClick={() => { setIsCartOpen(true); setIsMobileMenuOpen(false); }} className="bg-[#8E3B24] text-white py-2.5 rounded-full">
              Lihat Keranjang ({cart.reduce((a, b) => a + b.qty, 0)})
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
            <a href="#menu" className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-7 py-3 rounded-full text-sm font-medium transition-all">
              Lihat Menu
            </a>
            <a href="#locations" className="border border-[#3D3A37] hover:bg-[#ECE6DF] text-[#2C2623] px-7 py-3 rounded-full text-sm font-medium transition-all">
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
              <span className="text-xs font-semibold text-[#2C2623]">Highly Rated ★ 4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI MEAL MATCHER SECTION */}
      <section id="ai-matcher" className="bg-[#F6F2EC] py-20 px-6 mt-8 scroll-mt-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="inline-block bg-[#EAEFE8] text-[#4E6148] text-xs font-bold px-3 py-1 rounded-full mb-2">
              ✨ Waroeng AI Engine v2.0
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#2C2623]">
              Bingung Pilih Lauk? Biarkan AI Racik Kombinasimu
            </h2>
            <p className="text-sm text-[#736D69]">
              Pilih kriteria rasa dan budget, AI akan meracik kombinasi terbaik secara realtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Filter Controls Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between border border-[#EFECE6] space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-[#938C87] uppercase block mb-2">MOOD</span>
                  <div className="flex flex-wrap gap-2">
                    {['Lapar Banget', 'Santai'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedMood(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedMood === item ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/10 font-bold' : 'border border-[#DFDAD2]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-wider text-[#938C87] uppercase block mb-2">RASA</span>
                  <div className="flex flex-wrap gap-2">
                    {['Pedas Nampol', 'Gurih Manis'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedRasa(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedRasa === item ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/10 font-bold' : 'border border-[#DFDAD2]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-wider text-[#938C87] uppercase block mb-2">SUASANA</span>
                  <div className="flex flex-wrap gap-2">
                    {['Makan Siang', 'Cuaca Hujan', 'Nongkrong'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedVibe(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedVibe === item ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/10 font-bold' : 'border border-[#DFDAD2]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold tracking-wider text-[#938C87] uppercase block mb-2">BUDGET</span>
                  <div className="flex flex-wrap gap-2">
                    {['< Rp30k', 'Bebas'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedBudget(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedBudget === item ? 'border-2 border-[#4E6148] text-[#4E6148] bg-[#4E6148]/10 font-bold' : 'border border-[#DFDAD2]'
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
                className="w-full bg-[#4E6148] hover:bg-[#3F503A] text-white py-3.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <span>AI Sedang Meracik...</span>
                ) : (
                  <span>✨ Rekomendasikan Menu AI</span>
                )}
              </button>
            </div>

            {/* Recommendation Result Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EFECE6] flex flex-col justify-between relative">
              {isAiLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#4E6148] animate-pulse">Meracik Kombinasi Terenak...</span>
                </div>
              )}

              <div>
                <div className="relative h-48 sm:h-52 w-full bg-neutral-100">
                  <Image
                    src={recommendation.image}
                    alt={recommendation.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7D7672]">{recommendation.category}</span>
                    <button onClick={handleRecommend} className="text-[10px] font-bold text-[#8E3B24] border px-2 py-0.5 rounded-full hover:bg-gray-50">
                      🎲 Acak Lainnya
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#2C2623]">{recommendation.name}</h3>

                  <div className="bg-[#F8F6F2] p-3 rounded-xl border border-[#EAE5D9]">
                    <span className="text-[10px] font-bold text-[#4E6148] block mb-0.5">💡 ALASAN AI:</span>
                    <p className="text-xs text-[#524D4A] italic">"{recommendation.aiReason}"</p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[#F0ECE6] flex items-center justify-between mt-4">
                <span className="text-base font-bold text-[#2C2623]">Rp {recommendation.price.toLocaleString('id-ID')}</span>
                <button 
                  onClick={() => addToCart(recommendation.id, recommendation.name, recommendation.price)}
                  className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-colors"
                >
                  + Tambah Ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DAFTAR MENU KATALOG */}
      <section id="menu" className="max-w-7xl mx-auto w-full px-6 py-20 scroll-mt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2C2623] tracking-tight">Daftar Menu Favorit</h2>
            <p className="text-sm text-[#6C6663] mt-1">Pilihan santapan lezat buatan koki terbaik kami.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#ECE7E1] rounded-full px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
            />

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-[#F6F2EC] p-1 rounded-full border border-[#ECE7E1]">
              {['Semua', 'Makanan Utama', 'Minuman', 'Cemilan'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat ? 'bg-[#8E3B24] text-white' : 'text-[#6C6663]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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
                    <span className="absolute top-3 right-3 bg-[#A3432B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm">
                      Favorit
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[11px] font-medium text-[#7D7672] uppercase block">{item.category}</span>
                  <h3 className="font-bold text-base text-[#2C2623]">{item.name}</h3>
                  <p className="text-xs text-[#6C6663] leading-relaxed line-clamp-2">{item.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between">
                <span className="text-base font-bold text-[#A3432B]">Rp {item.price.toLocaleString('id-ID')}</span>
                <button 
                  onClick={() => addToCart(item.id, item.name, item.price)}
                  className="bg-[#4E6148] hover:bg-[#3F503A] text-white px-4 py-2 rounded-full text-xs font-medium transition-colors"
                >
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
            <span className="text-xl font-bold text-[#A3432B] tracking-tight">WaroengMakan123</span>
            <p className="text-xs text-[#6C6663] max-w-sm">Authentic Indonesian modern dining experience.</p>
            <div>
              <Link href="/admin" className="text-xs text-[#8E3B24] font-medium hover:underline">
                🔑 Kelola Data (Admin Dashboard)
              </Link>
            </div>
          </div>
          <div id="contact">
            <h4 className="text-xs font-bold text-[#2C2623] mb-3 uppercase">Contact & Hours</h4>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li>Contact: +62 812-3456-7890</li>
              <li id="hours">Hours: 10:00 - 22:00 WIB</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2C2623] mb-3 uppercase">Social Media</h4>
            <ul className="space-y-2 text-xs font-medium text-[#6C6663]">
              <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#2C2623]">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#2C2623]">Facebook</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* FLOATING CHATBOT BUTTON */}
      <button 
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        aria-label="Open AI Chatbot"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#404D3C] hover:bg-[#343F31] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* CHATBOT MODAL */}
      {isChatbotOpen && (
        <div className="fixed bottom-20 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#ECE7E1] z-50 overflow-hidden flex flex-col h-[400px]">
          <div className="bg-[#404D3C] text-white p-4 flex justify-between items-center">
            <span className="font-bold text-sm">🤖 AI Waroeng Assistant</span>
            <button onClick={() => setIsChatbotOpen(false)} className="text-xs hover:text-gray-300">✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#FDFBF7]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-[#8E3B24] text-white' : 'bg-white border border-[#EFECE6] text-[#2C2623]'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-[#ECE7E1] bg-white flex gap-2">
            <input
              type="text"
              placeholder="Tanya rekomendasi..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 text-xs border border-[#ECE7E1] rounded-full px-3 py-2 focus:outline-none"
            />
            <button type="submit" className="bg-[#404D3C] text-white text-xs px-3 rounded-full font-bold">Kirim</button>
          </form>
        </div>
      )}

      {/* CART DRAWER SLIDE-OVER */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-lg text-[#2C2623]">Keranjang Belanja</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-sm font-bold text-gray-400">✕</button>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-[#736D69] text-center py-10">Keranjang masih kosong.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-[#F8F6F2] p-3 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-[#2C2623]">{item.name}</h4>
                        <span className="text-[11px] text-[#A3432B]">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white rounded-full border text-xs font-bold">-</button>
                        <span className="text-xs font-bold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white rounded-full border text-xs font-bold">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-[#A3432B]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <button
                onClick={handleWhatsAppCheckout}
                disabled={cart.length === 0}
                className="w-full bg-[#4E6148] hover:bg-[#3F503A] text-white py-3 rounded-full text-xs font-bold transition-all disabled:bg-gray-300"
              >
                Pesan via WhatsApp 📱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}