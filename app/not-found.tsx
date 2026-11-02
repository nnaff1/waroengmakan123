import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center p-6 text-[#2D151B] font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#800020]/10 text-[#800020] font-black text-2xl border border-[#800020]/20">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-[#735A60] leading-relaxed">
            Halaman yang Anda tuju tidak tersedia atau telah dipindahkan ke alamat lain.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#800020] hover:bg-[#66001A] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>←</span> Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
