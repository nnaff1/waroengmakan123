// app/kasir/payment-success/page.tsx
// Halaman redirect setelah pelanggan menyelesaikan pembayaran di Midtrans Snap

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') ?? '';
  const status = searchParams.get('transaction_status') ?? '';
  const [countdown, setCountdown] = useState(6);

  const isSuccess = ['settlement', 'capture'].includes(status);
  const isPending = status === 'pending';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/kasir';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center p-6 font-sans antialiased">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E8E4DF] max-w-sm w-full p-8 text-center space-y-6">

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
          isSuccess ? 'bg-[#4E6148]' : isPending ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : isPending ? (
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Status text */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-[#2C2623]">
            {isSuccess ? 'Pembayaran Berhasil' : isPending ? 'Menunggu Pembayaran' : 'Pembayaran Gagal'}
          </h1>
          <p className="text-xs text-[#736D69]">
            {isSuccess
              ? 'Transaksi dikonfirmasi. Pesanan sedang disiapkan dapur.'
              : isPending
              ? 'Pembayaran sedang diproses. Status akan diperbarui otomatis.'
              : 'Transaksi tidak berhasil. Silakan coba lagi.'}
          </p>
          {orderId && (
            <p className="text-[11px] font-mono text-[#4E6148] font-bold mt-2">
              ID: {orderId}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Link
            href="/kasir"
            className="w-full block py-3 rounded-xl bg-[#8E3B24] hover:bg-[#78301B] text-white text-sm font-bold text-center transition-colors"
          >
            Kembali ke Kasir
          </Link>
          <p className="text-[10px] text-[#A89D98]">
            Otomatis kembali dalam {countdown} detik...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4E6148] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
