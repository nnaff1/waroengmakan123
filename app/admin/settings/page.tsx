'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'resto' | 'pos' | 'keamanan' | 'ai'>('resto');
  const [saveStatus, setSaveStatus] = useState(false);

  // Form States
  const [restoName, setRestoName] = useState('WaroengMakan123');
  const [phone, setPhone] = useState('081234567890');
  const [address, setAddress] = useState('Jl. Kuliner No. 12, Purwokerto');
  const [openHour, setOpenHour] = useState('10:00');
  const [closeHour, setCloseHour] = useState('21:00');

  const [taxPercent, setTaxPercent] = useState('10');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda! Silakan datang kembali.');

  const [pinCode, setPinCode] = useState('2026');
  const [aiKey, setAiKey] = useState('AIzaSyD-resto-mockup-key-2026');
  const [autoUpsell, setAutoUpsell] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans text-[#2C2623]">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#2C2623]">
          Pengaturan Restoran
        </h1>
        <p className="text-xs text-[#736D69] mt-1">
          Kelola profil usaha, struk transaksi, PIN keamanan, dan konfigurasi sistem.
        </p>
      </div>

      {/* Tab Navigasi Mini */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5DEC9] pb-3">
        {[
          { key: 'resto', label: 'Profil Resto & Jam Buka' },
          { key: 'pos', label: 'Kasir & Struk Transaksi' },
          { key: 'keamanan', label: 'PIN & Akses Admin' },
          { key: 'ai', label: 'Integrasi AI & Fitur' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#6B7C5E] text-white shadow-xs'
                : 'bg-white border border-[#E5DEC9] text-[#524D4A] hover:bg-[#FAF8F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: PROFIL RESTO */}
        {activeTab === 'resto' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
                Identitas Usaha
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Nama Restoran</label>
                  <input
                    type="text"
                    value={restoName}
                    onChange={(e) => setRestoName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Nomor WhatsApp Kasir/Admin</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Alamat Outlet</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
                Jam Operasional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Jam Buka</label>
                  <input
                    type="time"
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Jam Tutup</label>
                  <input
                    type="time"
                    value={closeHour}
                    onChange={(e) => setCloseHour(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KASIR & STRUK */}
        {activeTab === 'pos' && (
          <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
              Pengaturan Struk Kasir (POS)
            </h3>
            <div className="space-y-4">
              <div className="max-w-xs">
                <label className="text-xs font-bold text-[#736D69] block mb-1">Tarif Pajak Restoran (PB1 %)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623] pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#736D69] font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Catatan Kaki Struk</label>
                <textarea
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs text-[#2C2623] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEAMANAN PIN */}
        {activeTab === 'keamanan' && (
          <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
              Akses Portal Admin
            </h3>
            <div className="max-w-sm space-y-2">
              <label className="text-xs font-bold text-[#736D69] block">Ganti PIN Keamanan (Saat ini: {pinCode})</label>
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full tracking-widest text-center font-mono font-bold bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-sm text-[#8E3B24]"
              />
              <p className="text-[11px] text-[#736D69]">
                PIN ini digunakan seluruh staf berwenang untuk membuka portal manajemen.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRASI AI */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl p-6 border border-[#EBE5D8] shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
              Kunci API & Otomasi AI
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 text-xs font-mono text-[#2C2623]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7E1]">
                <div>
                  <h4 className="text-xs font-bold text-[#2C2623]">Rekomendasi Menu Pelengkap Otomatis di POS</h4>
                  <p className="text-[11px] text-[#736D69]">
                    Menyarankan mochi/minuman segar otomatis saat kasir memilih menu pedas balado.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoUpsell}
                  onChange={(e) => setAutoUpsell(e.target.checked)}
                  className="w-4 h-4 accent-[#8E3B24] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="flex items-center justify-between pt-2">
          {saveStatus ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              ✓ Pengaturan berhasil disimpan ke sistem!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="bg-[#8E3B24] hover:bg-[#78301B] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}