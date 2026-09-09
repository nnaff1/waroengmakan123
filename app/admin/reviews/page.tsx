'use client';

import React, { useState } from 'react';

type ReviewItem = {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  date: string;
  orderedMenu: string;
  comment: string;
  reply?: string;
  repliedAt?: string;
};

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    customerName: 'Bima Valiant',
    avatar: 'B',
    rating: 5,
    date: '2 jam yang lalu',
    orderedMenu: 'Nasi Rendang Sapi Premium + Es Kopi Susu',
    comment: 'Rendangnya empuk banget, bumbunya meresap sampai ke serat dalam. Es kopi susunya juga creamy gila!',
    reply: 'Terima kasih banyak Mas Bima! Senang sekali resep rendang 8 jam kami cocok di lidah. Ditunggu kedatangan selanjutnya ya! 🍲☕',
    repliedAt: '1 jam yang lalu',
  },
  {
    id: 'rev-2',
    customerName: 'Siti Rahma',
    avatar: 'S',
    rating: 5,
    date: 'Kemarin',
    orderedMenu: 'Nasi Ayam Geprek Sambal Ijo',
    comment: 'Sambal ijonya beneran nampol! Ayamnya krispi luar dalam, gurih banget.',
  },
  {
    id: 'rev-3',
    customerName: 'Rian Hidayat',
    avatar: 'R',
    rating: 2,
    date: '3 hari yang lalu',
    orderedMenu: 'Pisang Goreng Keju Cokelat + Mochi',
    comment: 'Mochi dinginnya sudah habis pas saya datang malam-malam. Pisang gorengnya agak terlalu berminyak.',
  },
  {
    id: 'rev-4',
    customerName: 'Dewi Lestari',
    avatar: 'D',
    rating: 4,
    date: '4 hari yang lalu',
    orderedMenu: 'Ayam Balado Sambal Merah',
    comment: 'Porsi kenyang dan bumbu baladonya mantap. Cuma waktu nunggu pesanan agak lama sedikit pas jam makan siang.',
    reply: 'Terima kasih ulasannya Kak Dewi! Mohon maaf atas keterlambatan saat jam sibuk siang. Kami sedang menambah personel dapur agar layanan bisa lebih cepat. 🙏',
    repliedAt: '3 hari yang lalu',
  },
];

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREPLIED' | 'REPLIED'>('ALL');

  // Modal State
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Stats calculation
  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / (totalReviews || 1)).toFixed(1);
  const unrepliedCount = reviews.filter((r) => !r.reply).length;
  const positivePercentage = Math.round((reviews.filter((r) => r.rating >= 4).length / (totalReviews || 1)) * 100);

  // Filter Logic
  const filteredReviews = reviews.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderedMenu.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'ALL' || item.rating === ratingFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNREPLIED' && !item.reply) ||
      (statusFilter === 'REPLIED' && item.reply);

    return matchesSearch && matchesRating && matchesStatus;
  });

  // Open Reply Modal
  const handleOpenReplyModal = (review: ReviewItem) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
  };

  // AI Auto-Reply Generator Simulation
  const handleGenerateAiReply = () => {
    if (!selectedReview) return;
    setIsGeneratingAi(true);

    setTimeout(() => {
      let generatedText = '';

      if (selectedReview.rating >= 4) {
        generatedText = `Halo Kak ${selectedReview.customerName}! Terima kasih banyak atas ulasan bintang ${selectedReview.rating}-nya untuk menu ${selectedReview.orderedMenu}. Kami sangat senang Kakak menikmati hidangan di WaroengMakan123! Sampai jumpa di pesanan berikutnya ya! 🎉✨`;
      } else {
        generatedText = `Halo Kak ${selectedReview.customerName}, mohon maaf sekali atas ketidaknyamanan terkait pesanan ${selectedReview.orderedMenu}. Catatan Kakak mengenai "${selectedReview.comment}" sudah kami teruskan ke tim dapur untuk evaluasi langsung. Semoga kami bisa memberikan pelayanan lebih baik di kesempatan berikutnya! 🙏🏼`;
      }

      setReplyText(generatedText);
      setIsGeneratingAi(false);
    }, 800);
  };

  // Save Reply
  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              reply: replyText,
              repliedAt: 'Baru saja',
            }
          : r
      )
    );

    setSelectedReview(null);
    setReplyText('');
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10 text-[#2C2623] p-2 sm:p-4 xl:p-6 font-sans">
      {/* TITLE HEADER */}
      <div className="border-b border-[#E5DEC9] pb-4">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-[#2C2623] tracking-tight">
          Customer Reviews
        </h1>
        <p className="text-xs xl:text-sm 2xl:text-base text-[#736D69] mt-1">
          Pantau ulasan pelanggan dan berikan respon balasan secara cepat dengan AI Assistant.
        </p>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 2xl:gap-8">
        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs space-y-1">
          <span className="text-xs xl:text-sm font-bold text-[#736D69] uppercase tracking-wider">Rata-rata Rating</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#2C2623]">{avgRating}</span>
            <span className="text-amber-500 font-bold text-xs xl:text-sm">★ / 5.0</span>
          </div>
        </div>

        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs space-y-1">
          <span className="text-xs xl:text-sm font-bold text-[#736D69] uppercase tracking-wider">Total Ulasan</span>
          <p className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#2C2623]">{totalReviews}</p>
        </div>

        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs space-y-1">
          <span className="text-xs xl:text-sm font-bold text-[#4E6148] uppercase tracking-wider">Sentimen Positif</span>
          <p className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#4E6148]">{positivePercentage}%</p>
        </div>

        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs space-y-1">
          <span className="text-xs xl:text-sm font-bold text-[#C0392B] uppercase tracking-wider">Belum Dibalas</span>
          <p className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#C0392B]">{unrepliedCount}</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 xl:p-6 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 xl:w-96">
          <input
            type="text"
            placeholder="Cari ulasan, nama, atau menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-full py-2 xl:py-2.5 pl-9 pr-4 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 xl:top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex bg-[#F2EDE4] p-1 rounded-full border border-[#E5DEC9]">
            {(['ALL', 'UNREPLIED', 'REPLIED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-[#8E3B24] text-white shadow-xs' : 'text-[#524D4A]'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st === 'UNREPLIED' ? 'Belum Dibalas' : 'Sudah Dibalas'}
              </button>
            ))}
          </div>

          {/* Rating Filter */}
          <div className="flex bg-[#F2EDE4] p-1 rounded-full border border-[#E5DEC9]">
            {[
              { label: 'Semua ★', val: 'ALL' },
              { label: '5 ★', val: 5 },
              { label: '4 ★', val: 4 },
              { label: '< 3 ★', val: 2 },
            ].map((rf) => (
              <button
                key={rf.label}
                onClick={() => setRatingFilter(rf.val as number | 'ALL')}
                className={`px-3 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                  ratingFilter === rf.val ? 'bg-[#4E6148] text-white shadow-xs' : 'text-[#524D4A]'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* REVIEW CARDS GRID */}
      <div className="space-y-4 xl:space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#E5DEC9] text-[#736D69] text-xs xl:text-sm">
            Tidak ada ulasan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredReviews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 xl:p-8 border border-[#E5DEC9] shadow-xs space-y-4 xl:space-y-5 transition-all hover:border-[#C5BCAB]"
            >
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2EDE4] pb-3.5">
                <div className="flex items-center gap-3 xl:gap-4">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-[#8E3B24] text-white font-bold flex items-center justify-center text-sm xl:text-base shadow-xs">
                    {item.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm xl:text-base text-[#2C2623]">{item.customerName}</h3>
                    <p className="text-[11px] xl:text-xs text-[#736D69] font-medium">Menu: {item.orderedMenu}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Star Display */}
                  <div className="flex text-amber-400 text-sm xl:text-base">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-[11px] xl:text-xs text-[#736D69]">{item.date}</span>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-xs xl:text-sm text-[#2C2623] leading-relaxed italic">
                "{item.comment}"
              </p>

              {/* Admin Reply Section if exists */}
              {item.reply ? (
                <div className="bg-[#F8F6F2] rounded-2xl p-4 xl:p-5 border border-[#E5DEC9] space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] xl:text-xs font-bold text-[#8E3B24]">
                      💬 Balasan dari WaroengMakan123
                    </span>
                    <span className="text-[10px] xl:text-xs text-[#736D69]">{item.repliedAt}</span>
                  </div>
                  <p className="text-xs xl:text-sm text-[#524D4A] leading-relaxed">{item.reply}</p>
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => handleOpenReplyModal(item)}
                      className="text-[11px] xl:text-xs font-bold text-[#4E6148] hover:underline cursor-pointer"
                    >
                      Edit Balasan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleOpenReplyModal(item)}
                    className="bg-[#4E6148] hover:bg-[#3F503A] text-white text-xs xl:text-sm font-bold px-5 xl:px-6 py-2 xl:py-2.5 rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> Balas Ulasan
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL REPLY FORM WITH AI GENERATOR */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 xl:p-8 max-w-lg xl:max-w-xl w-full space-y-4 xl:space-y-5 border border-[#E5DEC9] shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#E5DEC9]">
              <h3 className="font-bold text-base xl:text-lg text-[#2C2623]">
                Balas Ulasan: {selectedReview.customerName}
              </h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Original Customer Comment Box */}
            <div className="bg-[#F8F6F2] p-3.5 xl:p-4 rounded-2xl border border-[#E5DEC9] space-y-1">
              <div className="flex items-center justify-between text-xs xl:text-sm">
                <span className="font-bold text-[#2C2623]">{selectedReview.customerName}</span>
                <span className="text-amber-500 font-bold">★ {selectedReview.rating}.0</span>
              </div>
              <p className="text-xs xl:text-sm text-[#524D4A] italic">"{selectedReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs xl:text-sm font-bold text-[#736D69]">Pesan Balasan Admin</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={isGeneratingAi}
                    className="text-[11px] xl:text-xs font-bold text-[#4E6148] hover:text-[#3F503A] flex items-center gap-1 bg-[#EAEFE8] px-3 py-1 rounded-full transition-all border border-[#CDE0C7] cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <span>Membuat Balasan AI...</span>
                    ) : (
                      <span>✨ Auto-Generate AI Reply</span>
                    )}
                  </button>
                </div>

                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ketik balasan Anda atau gunakan AI Reply..."
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-2xl p-3.5 xl:p-4 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#4E6148] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-xs xl:text-sm font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#8E3B24] text-white text-xs xl:text-sm font-bold hover:bg-[#78301B] transition-colors cursor-pointer"
                >
                  Kirim Balasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}