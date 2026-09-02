'use client';

import React, { useState } from 'react';

type ReviewPeriod = 'This Week' | 'This Month';

export default function AICopilotPage() {
  const [ideaText, setIdeaText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reviewPeriod, setReviewPeriod] = useState<ReviewPeriod>('This Week');
  const [showNewMenuModal, setShowNewMenuModal] = useState(false);

  // Dynamic Output State
  const [output, setOutput] = useState({
    igCaption:
      'Nikmati akhir pekan seru bareng keluarga di WaroengMakan123! 🎉 Dapatkan diskon 20% untuk semua menu keluarga khusus Sabtu-Minggu ini. Yuk, buruan reservasi tempatmu sekarang! 🖐️',
    hashtags: '#WaroengMakan123 #PromoKeluarga #KulinerNusantara #MakanEnak',
    waBroadcast:
      'Halo Sahabat Waroeng! 👋 Ada kabar gembira nih untuk akhir pekanmu.\n\nKhusus Sabtu & Minggu ini, nikmati Promo Spesial Keluarga dengan diskon 20% all items! 🥳🔥🍲\n\nKlik link di bawah untuk reservasi ya! Jangan sampai kehabisan meja! 🥳👇',
    bundlingIdea:
      'Berdasarkan tren pesanan, kami sarankan membuat paket: "Paket Hemat Dimsum Kukus + Mochi Aneka Rasa".',
  });

  // Modal State Form New Menu
  const [newMenuForm, setNewMenuForm] = useState({
    name: '',
    category: 'Makanan Utama',
    price: '',
  });

  // Dynamic Review Data based on Period
  const reviewData = {
    'This Week': {
      score: 92,
      highlight:
        'Ulasan mayoritas puas dengan rasa bumbu balado yang khas dan konsisten.',
      actionRequired:
        'Ada 3 catatan pelanggan minggu ini terkait stok mochi dingin yang cepat habis di malam hari. Pertimbangkan untuk menambah prep porsi sore.',
    },
    'This Month': {
      score: 95,
      highlight:
        'Penjualan menu Rendang Sapi naik 35% setelah update foto produk berkualitas tinggi.',
      actionRequired:
        'Waktu tunggu pesanan di jam makan siang (12:00-13:00) rata-rata naik 8 menit. Butuh optimasi alur dapur.',
    },
  };

  // AI Generation Simulation logic based on prompt keyword
  const handleGenerate = () => {
    if (!ideaText.trim()) return;

    setIsGenerating(true);

    setTimeout(() => {
      const topic = ideaText.toLowerCase();

      let caption = `Spesial promo ${ideaText}! 🎉 Dapatkan penawaran terbaik hanya di WaroengMakan123. Ajak teman dan keluargamu mampir sekarang juga! 🍲✨`;
      let tags = `#WaroengMakan123 #PromoSpesial #KulinerNusantara #MakanEnak`;
      let wa = `Halo Kak! 👋 Mampir yuk ke WaroengMakan123!\n\nAda promo menarik nih: ${ideaText}. Kunjungi outlet terdekat atau pesan online sekarang sebelum kehabisan! 🔥🍲`;
      let bundle = `Berdasarkan ide "${ideaText}", kami menyarankan kombinasi: "Paket Kombo hemat Nasi Balado + Es Kopi Susu Aren".`;

      if (topic.includes('keluarga') || topic.includes('family')) {
        caption = `Kumpul keluarga jadi makin hangat di WaroengMakan123! 👨‍👩‍👧‍👦 Nikmati Paket Makan Bersama dengan porsi melimpah & harga lebih hemat!`;
        tags = `#PromoKeluarga #WaroengMakan123 #MakanBersama #KulinerIndonesia`;
        wa = `Halo Sahabat Waroeng! 👋 Mau makan rame-rame bareng keluarga akhir pekan ini?\n\nManfaatkan Promo Keluarga Spesial Hemat 20%! Meja terbatas, yuk booking sekarang! 🥳❤️`;
        bundle = `Saran Paket: "Family Feast Combo: 4 Nasi + Rendang Sapi + Ayam Balado + 4 Es Jeruk".`;
      } else if (topic.includes('pedas') || topic.includes('spicy')) {
        caption = `Tantang lidahmu dengan promo Pedas Nampol di WaroengMakan123! 🌶️🔥 Dijamin bikin nagih dan keringetan!`;
        tags = `#PedasNampol #WaroengMakan123 #KulinerPedas #AyamBalado`;
        wa = `Panggilan buat pecinta pedas! 🌶️🔥\n\nBeli Ayam Balado Extra Pedas hari ini gratis Es Teh Manis buat penawar pedasmu! Gass order sekarang! 🚀`;
        bundle = `Saran Paket: "Combo Mercon: Ayam Geprek Sambal Ijo + Ceker Mercon + Es Teh Jumbo".`;
      }

      setOutput({
        igCaption: caption,
        hashtags: tags,
        waBroadcast: wa,
        bundlingIdea: bundle,
      });

      setIsGenerating(false);
    }, 1200);
  };

  // Clipboard functionality
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentReview = reviewData[reviewPeriod];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2623] tracking-tight">AI Marketing Copilot</h1>
          <p className="text-sm text-[#736D69] mt-1">
            Generate promos, analyze reviews, and optimize your menu with AI.
          </p>
        </div>
        <button
          onClick={() => setShowNewMenuModal(true)}
          className="bg-[#8E3B24] hover:bg-[#78301B] text-white py-2.5 px-5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span> Add New Menu
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Promo Generator & AI Suggestions (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Promo Generator Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5DEC9] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#4E6148] font-bold text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Promo Generator</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider block">
                YOUR IDEA
              </label>
              <textarea
                rows={3}
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Ketik ide promo Anda... (e.g., promo akhir pekan untuk keluarga)"
                className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-2xl p-4 text-xs text-[#2C2623] focus:outline-none focus:ring-2 focus:ring-[#4E6148] resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !ideaText.trim()}
                className={`text-xs font-bold px-7 py-3 rounded-full transition-all shadow-sm flex items-center gap-2 ${
                  isGenerating || !ideaText.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#8E3B24] hover:bg-[#78301B] text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>

          {/* AI SUGGESTIONS SECTION */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider block">
              AI SUGGESTIONS
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram Caption Card */}
              <div className="bg-[#F8F5F0] rounded-2xl p-5 border border-[#E8E1D5] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E3B24]">
                      <span>📷</span> Instagram Caption
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${output.igCaption}\n\n${output.hashtags}`, 'ig')}
                      className="text-[10px] font-bold text-[#8E3B24] hover:underline"
                    >
                      {copiedField === 'ig' ? 'Tersalin! ✅' : 'Salin'}
                    </button>
                  </div>
                  <p className="text-xs text-[#4A4543] leading-relaxed">
                    {output.igCaption}
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-semibold text-[#736D69]">
                  {output.hashtags}
                </div>
              </div>

              {/* WhatsApp Broadcast Card */}
              <div className="bg-[#F8F5F0] rounded-2xl p-5 border border-[#E8E1D5] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4E6148]">
                      <span>💬</span> WhatsApp Broadcast
                    </div>
                    <button
                      onClick={() => copyToClipboard(output.waBroadcast, 'wa')}
                      className="text-[10px] font-bold text-[#4E6148] hover:underline"
                    >
                      {copiedField === 'wa' ? 'Tersalin! ✅' : 'Salin'}
                    </button>
                  </div>
                  <p className="text-xs text-[#4A4543] leading-relaxed whitespace-pre-line">
                    {output.waBroadcast}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Bundling Idea Card */}
            <div className="bg-[#F8F5F0] rounded-2xl p-4 border border-[#E8E1D5] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-sm border border-[#E0D9CB] shrink-0">
                💡
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#6C6663] block">Menu Bundling Idea</span>
                <p className="text-xs text-[#2C2623] font-semibold">
                  {output.bundlingIdea}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Review Insights (4 Cols) */}
        <div className="lg:col-span-4 bg-[#F8F5F0] rounded-3xl p-6 border border-[#E5DEC9] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8E3B24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="font-extrabold text-base text-[#2C2623]">Review Insights</h3>
            </div>
            
            {/* Interactive Period Switcher */}
            <select
              value={reviewPeriod}
              onChange={(e) => setReviewPeriod(e.target.value as ReviewPeriod)}
              className="bg-[#EAE5D9] text-[#2C2623] text-[11px] font-bold px-3 py-1.5 rounded-full border-none focus:outline-none cursor-pointer"
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {/* Satisfaction Score Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#2C2623] transition-all duration-300">
                {currentReview.score}%
              </span>
              <span className="text-xs font-semibold text-[#736D69]">Satisfaction Score</span>
            </div>
            <div className="w-full bg-[#E5DEC9] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#4E6148] h-full rounded-full transition-all duration-500"
                style={{ width: `${currentReview.score}%` }}
              />
            </div>
          </div>

          {/* Highlight Box */}
          <div className="bg-[#EAE5DC]/60 rounded-2xl p-4 border border-[#DFD8CB] text-xs text-[#4A4543] leading-relaxed">
            <span className="font-bold text-[#2C2623]">Highlight: </span>
            {currentReview.highlight}
          </div>

          {/* Action Required Box */}
          <div className="bg-[#FDECEB] rounded-2xl p-4 border border-[#FAD4D0] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#C0392B]">
              <span>⚠️</span> Action Required
            </div>
            <p className="text-xs text-[#5C2C28] leading-relaxed">
              {currentReview.actionRequired}
            </p>
          </div>
        </div>

      </div>

      {/* MODAL ADD NEW MENU */}
      {showNewMenuModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-[#E5DEC9] shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#E5DEC9]">
              <h3 className="font-bold text-lg text-[#2C2623]">Tambah Menu Baru</h3>
              <button
                onClick={() => setShowNewMenuModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Menu "${newMenuForm.name}" berhasil ditambahkan!`);
                setShowNewMenuModal(false);
                setNewMenuForm({ name: '', category: 'Makanan Utama', price: '' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={newMenuForm.name}
                  onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                  placeholder="e.g., Ayam Geprek Sambal Matah"
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Kategori</label>
                <select
                  value={newMenuForm.category}
                  onChange={(e) => setNewMenuForm({ ...newMenuForm, category: e.target.value })}
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs"
                >
                  <option value="Makanan Utama">Makanan Utama</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Cemilan">Cemilan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  value={newMenuForm.price}
                  onChange={(e) => setNewMenuForm({ ...newMenuForm, price: e.target.value })}
                  placeholder="25000"
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMenuModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8E3B24] text-white text-xs font-bold hover:bg-[#78301B]"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}