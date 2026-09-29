'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
  isFeatured?: boolean;
};

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREPLIED' | 'REPLIED' | 'FEATURED'>('ALL');

  // Modal State
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);

  // 1. Tarik Data Review dari Supabase Database
  const fetchReviewsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews from Supabase:', error.message);
        return;
      }

      if (data) {
        const formattedReviews: ReviewItem[] = data.map((item) => ({
          id: item.id,
          customerName: item.customer_name || 'Anonim',
          avatar: (item.customer_name || 'A').charAt(0).toUpperCase(),
          rating: Number(item.rating) || 5,
          date: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'Baru saja',
          orderedMenu: item.ordered_menu || 'Menu Prasmanan',
          comment: item.comment || '',
          reply: item.reply || undefined,
          repliedAt: item.replied_at || undefined,
          isFeatured: item.is_featured ?? false,
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error('Catch Error fetch reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewsFromSupabase();

    // Subscribe ke Realtime Postgres Changes agar ulasan baru dari Landing Page langsung muncul di Admin tanpa Refresh
    const reviewsChannel = supabase
      .channel('admin-reviews-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          fetchReviewsFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
    };
  }, [fetchReviewsFromSupabase]);

  // Stats calculation
  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / (totalReviews || 1)).toFixed(1);
  const unrepliedCount = reviews.filter((r) => !r.reply).length;
  const featuredCount = reviews.filter((r) => r.isFeatured).length;

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
      (statusFilter === 'REPLIED' && item.reply) ||
      (statusFilter === 'FEATURED' && item.isFeatured);

    return matchesSearch && matchesRating && matchesStatus;
  });

  // Open Reply Modal
  const handleOpenReplyModal = (review: ReviewItem) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
  };

  // 2. Toggle Tampilkan di Landing Page (Update status is_featured di Supabase)
  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic Update UI
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFeatured: newStatus } : r))
    );

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_featured: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Gagal update status featured:', error.message);
        // Rollback jika gagal
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isFeatured: currentStatus } : r))
        );
      }
    } catch (err) {
      console.error('Catch Error update featured:', err);
    }
  };

  // AI Auto-Reply Generator
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

  // 3. Simpan Balasan Admin ke Supabase
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    setIsSavingReply(true);
    const timeNow = 'Baru saja';

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          reply: replyText,
          replied_at: timeNow,
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id ? { ...r, reply: replyText, repliedAt: timeNow } : r
        )
      );
      setSelectedReview(null);
      setReplyText('');
    } catch (err) {
      console.error('Gagal menyimpan balasan:', err);
      alert('Gagal menyimpan balasan admin ke database.');
    } finally {
      setIsSavingReply(false);
    }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10 text-[#2C2623] p-2 sm:p-4 xl:p-6 font-sans">
      <div className="border-b border-[#E5DEC9] pb-4">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-[#2C2623] tracking-tight">
          Customer Reviews
        </h1>
        <p className="text-xs xl:text-sm 2xl:text-base text-[#736D69] mt-1">
          Pantau ulasan pelanggan, balas dengan AI Assistant, dan pilih ulasan terbaik untuk ditampilkan di Landing Page.
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
          <span className="text-xs xl:text-sm font-bold text-[#C0392B] uppercase tracking-wider">Belum Dibalas</span>
          <p className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#C0392B]">{unrepliedCount}</p>
        </div>

        <div className="bg-[#FAF8F5] p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#C5BCAB] shadow-xs space-y-1 relative overflow-hidden">
          <span className="text-xs xl:text-sm font-bold text-[#4E6148] uppercase tracking-wider">Tampil di Landing Page</span>
          <p className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#4E6148]">{featuredCount}</p>
          <span className="absolute -right-4 -bottom-4 text-6xl opacity-10">🌟</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 xl:p-6 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-80 xl:w-96">
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

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex bg-[#F2EDE4] p-1 rounded-full border border-[#E5DEC9]">
            {(['ALL', 'UNREPLIED', 'REPLIED', 'FEATURED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-[#8E3B24] text-white shadow-xs' : 'text-[#524D4A] hover:bg-[#E5DEC9]/50'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'UNREPLIED' ? 'Belum Dibalas' : st === 'FEATURED' ? '⭐ Featured' : 'Sudah Dibalas'}
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
                  ratingFilter === rf.val ? 'bg-[#4E6148] text-white shadow-xs' : 'text-[#524D4A] hover:bg-[#E5DEC9]/50'
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
        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#E5DEC9]">
            <div className="w-8 h-8 border-3 border-[#8E3B24] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs xl:text-sm text-[#736D69] font-medium">Memuat ulasan dari Supabase...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#E5DEC9] text-[#736D69] text-xs xl:text-sm">
            Tidak ada ulasan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredReviews.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 xl:p-8 border shadow-xs space-y-4 xl:space-y-5 transition-all hover:shadow-md ${
                item.isFeatured ? 'border-[#C5BCAB] ring-2 ring-[#4E6148]/10' : 'border-[#E5DEC9]'
              }`}
            >
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#F2EDE4] pb-3.5">
                <div className="flex items-center gap-3 xl:gap-4">
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-[#8E3B24] text-white font-bold flex items-center justify-center text-sm xl:text-base shadow-xs shrink-0">
                    {item.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm xl:text-base text-[#2C2623]">{item.customerName}</h3>
                    <p className="text-[11px] xl:text-xs text-[#736D69] font-medium mt-0.5">Menu: {item.orderedMenu}</p>
                    <div className="flex items-center gap-2 mt-1 lg:hidden">
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#736D69]">• {item.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3 self-end sm:self-auto">
                  {/* Toggle Button for Landing Page */}
                  <button
                    onClick={() => handleToggleFeatured(item.id, item.isFeatured || false)}
                    className={`text-[11px] xl:text-xs font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all border flex items-center gap-1.5 cursor-pointer ${
                      item.isFeatured
                        ? 'bg-[#EAEFE8] text-[#4E6148] border-[#4E6148]/30 hover:bg-[#D5E1D1]'
                        : 'bg-white text-[#736D69] border-[#D5CEB9] hover:bg-[#F2EDE4]'
                    }`}
                  >
                    {item.isFeatured ? (
                      <><span>🌟</span> Ditampilkan di Landing Page</>
                    ) : (
                      <><span>📌</span> Pin ke Landing Page</>
                    )}
                  </button>

                  {/* Desktop Date & Star */}
                  <div className="hidden lg:flex flex-col items-end">
                    <div className="flex text-amber-400 text-sm xl:text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-[11px] xl:text-xs text-[#736D69]">{item.date}</span>
                  </div>
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
          <div className="bg-white rounded-3xl p-6 xl:p-8 max-w-lg xl:max-w-xl w-full space-y-4 border border-[#E5DEC9] shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#E5DEC9]">
              <h3 className="font-bold text-base text-[#2C2623]">
                Balas Ulasan: {selectedReview.customerName}
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="bg-[#F8F6F2] p-4 rounded-2xl border border-[#E5DEC9] space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{selectedReview.customerName}</span>
                <span className="text-amber-500 font-bold">★ {selectedReview.rating}.0</span>
              </div>
              <p className="text-sm text-[#524D4A] italic">"{selectedReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#736D69]">Pesan Balasan Admin</label>
                <button
                  type="button"
                  onClick={handleGenerateAiReply}
                  disabled={isGeneratingAi}
                  className="text-xs font-bold text-[#4E6148] bg-[#EAEFE8] px-3 py-1 rounded-full cursor-pointer hover:bg-[#D8E4D5] transition-colors"
                >
                  {isGeneratingAi ? 'Membuat AI...' : '✨ Auto-Generate AI'}
                </button>
              </div>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tulis balasan admin..."
                className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#4E6148] resize-none"
              />
              <div className="flex justify-end gap-2 border-t border-[#E5DEC9] pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-full border text-sm font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingReply}
                  className="px-6 py-2 rounded-full bg-[#8E3B24] text-white text-sm font-bold hover:bg-[#78301B] cursor-pointer disabled:opacity-50"
                >
                  {isSavingReply ? 'Menyimpan...' : 'Kirim Balasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}