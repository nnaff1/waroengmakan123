'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'resto' | 'pos' | 'keamanan' | 'ai'>('resto');
  const [saveStatus, setSaveStatus] = useState(false);

  // Form States
  const [restoName, setRestoName] = useState('WaroengMakan123');
  const [phone, setPhone] = useState('081234567890');
  const [address, setAddress] = useState('Gg. Dahlia, Sumampir Kulon, Sumampir, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53125');
  const [openHour, setOpenHour] = useState('10:00');
  const [closeHour, setCloseHour] = useState('21:00');

  const [taxPercent, setTaxPercent] = useState('10');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda! Silakan datang kembali.');

  const [adminEmail, setAdminEmail] = useState('admin@waroengmakan123.com');
  const [pinCode, setPinCode] = useState('2026');
  const [aiKey, setAiKey] = useState('AIzaSyD-resto-mockup-key-2026');
  const [autoUpsell, setAutoUpsell] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [showPinCode, setShowPinCode] = useState(false);

  // Fetch settings dari server API atau Supabase saat halaman dimuat
  const fetchSettings = useCallback(async () => {
    const applyData = (data: any) => {
      setRestoName(data.resto_name || 'WaroengMakan123');
      setPhone(data.phone || '081234567890');
      setAddress(data.address || 'Gg. Dahlia, Sumampir Kulon, Sumampir, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53125');
      setOpenHour(data.open_hour || '10:00');
      setCloseHour(data.close_hour || '21:00');
      setTaxPercent(data.tax_percent?.toString() || '10');
      setReceiptFooter(data.receipt_footer || 'Terima kasih atas kunjungan Anda! Silakan datang kembali.');
      setPinCode(String(data.pin_code || '2026').trim());
      setAdminEmail(String(data.admin_email || 'admin@waroengmakan123.com').toLowerCase().trim());
      setAutoUpsell(data.auto_upsell ?? true);
    };

    try {
      // Coba lewat internal server API dulu (same-origin, anti-CORS & adblocker)
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          applyData(json.data);
          return;
        }
      }

      // Fallback ke Supabase client
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (data) {
        applyData(data);
      }
    } catch (err) {
      console.error('Error fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Khusus simpan PIN & Email Admin secara instan ke database Supabase
  const handleSaveCredentialsOnly = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pinCode.trim();
    const cleanEmail = adminEmail.trim().toLowerCase();

    if (!cleanPin) {
      setPinErrorMsg('Password admin tidak boleh kosong.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setPinErrorMsg('Format email admin tidak valid.');
      return;
    }

    setIsSavingPin(true);
    setPinSuccessMsg('');
    setPinErrorMsg('');

    try {
      // 1. Simpan via server route (same-origin, 100% no-CORS, anti-adblocker)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_credentials',
          pin_code: cleanPin,
          admin_email: cleanEmail,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        // Fallback coba langsung ke client Supabase
        const { error: clientError } = await supabase
          .from('settings')
          .update({
            pin_code: cleanPin,
            admin_email: cleanEmail,
            updated_at: new Date().toISOString(),
          })
          .eq('id', 1);

        if (clientError) {
          throw new Error(result.error || clientError.message);
        }
      }

      setPinCode(cleanPin);
      setAdminEmail(cleanEmail);
      setPinSuccessMsg(`✓ Password & email admin berhasil diperbarui di database! (Password aktif: ${cleanPin})`);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('waroeng_admin_email', cleanEmail);
      }

      setTimeout(() => {
        setPinSuccessMsg('');
      }, 5000);
    } catch (err: any) {
      console.error('Error saving credentials:', err);
      setPinErrorMsg('Gagal memperbarui ke database Supabase: ' + (err.message || 'Koneksi error'));
    } finally {
      setIsSavingPin(false);
    }
  };

  // Simpan semua settings ke Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        action: 'update_all',
        resto_name: restoName,
        phone,
        address,
        open_hour: openHour,
        close_hour: closeHour,
        tax_percent: Number(taxPercent) || 10,
        receipt_footer: receiptFooter,
        pin_code: pinCode.trim(),
        admin_email: adminEmail.trim().toLowerCase(),
        auto_upsell: autoUpsell,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        // Fallback coba langsung ke client Supabase
        const { error: clientError } = await supabase
          .from('settings')
          .upsert({ ...payload, id: 1, updated_at: new Date().toISOString() }, { onConflict: 'id' });

        if (clientError) {
          throw new Error(result.error || clientError.message);
        }
      }

      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 2500);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      alert('Terjadi kesalahan saat menyimpan: ' + (err.message || 'Koneksi error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10 text-[#2C2623] p-2 sm:p-4 xl:p-6 font-sans">
      {/* HEADER HALAMAN */}
      <div className="border-b border-[#E5DEC9] pb-4">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight text-[#2C2623]">
          Pengaturan Restoran
        </h1>
        <p className="text-xs xl:text-sm 2xl:text-base text-[#736D69] mt-1">
          Kelola profil usaha, struk transaksi, PIN keamanan, dan konfigurasi sistem.
        </p>
      </div>

      {/* TAB NAVIGASI MINI */}
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
            className={`px-4 xl:px-6 py-2 xl:py-2.5 rounded-xl text-xs xl:text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#6B7C5E] text-white shadow-xs'
                : 'bg-white border border-[#E5DEC9] text-[#524D4A] hover:bg-[#FAF8F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 xl:space-y-8">
        {/* TAB 1: PROFIL RESTO */}
        {activeTab === 'resto' && (
          <div className="space-y-5 xl:space-y-6">
            <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-4 xl:space-y-6">
              <h3 className="text-sm xl:text-lg font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
                Identitas Usaha
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6">
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Nama Restoran</label>
                  <input
                    type="text"
                    value={restoName}
                    onChange={(e) => setRestoName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Nomor WhatsApp Kasir/Admin</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Alamat Outlet</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-4 xl:space-y-6">
              <h3 className="text-sm xl:text-lg font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
                Jam Operasional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6">
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Jam Buka</label>
                  <input
                    type="time"
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623]"
                  />
                </div>
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Jam Tutup</label>
                  <input
                    type="time"
                    value={closeHour}
                    onChange={(e) => setCloseHour(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KASIR & STRUK */}
        {activeTab === 'pos' && (
          <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-4 xl:space-y-6">
            <h3 className="text-sm xl:text-lg font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
              Pengaturan Struk Kasir (POS)
            </h3>
            <div className="space-y-4 xl:space-y-6">
              <div className="max-w-xs xl:max-w-sm">
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Tarif Pajak Restoran (PB1 %)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623] pr-8"
                  />
                  <span className="absolute right-3 top-2.5 xl:top-3 text-xs xl:text-sm text-[#736D69] font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Catatan Kaki Struk</label>
                <textarea
                  rows={3}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm text-[#2C2623] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEAMANAN AKSES */}
        {activeTab === 'keamanan' && (
          <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#F0ECE6]">
              <div>
                <h3 className="text-base xl:text-lg font-bold text-[#2C2623] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#8E3B24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Akses Portal & Kredensial Admin
                </h3>
                <p className="text-xs text-[#736D69] mt-0.5">
                  Setiap pergantian email atau password di sini langsung disinkronkan otomatis ke database Supabase.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Database Synced
              </div>
            </div>

            <div className="max-w-md space-y-5">
              {/* Email Admin */}
              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1.5">
                  Email Login Admin
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setPinSuccessMsg('');
                      setPinErrorMsg('');
                    }}
                    placeholder="admin@waroengmakan123.com"
                    className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-3 text-xs xl:text-sm text-[#2C2623] font-medium focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Live DB
                  </span>
                </div>
                <p className="text-[11px] text-[#736D69] mt-1.5 leading-relaxed">
                  Email ini tersimpan langsung di tabel <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">settings</code> Supabase dan digunakan untuk otentikasi login admin.
                </p>
              </div>

              {/* Password Admin */}
              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1.5">
                  Password Akses Admin (PIN / Sandi)
                </label>
                <div className="relative">
                  <input
                    type={showPinCode ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value);
                      setPinSuccessMsg('');
                      setPinErrorMsg('');
                    }}
                    placeholder="Masukkan password admin baru..."
                    className="w-full font-mono font-bold bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-3 pr-10 text-sm xl:text-base text-[#8E3B24] focus:outline-none focus:ring-1 focus:ring-[#8E3B24]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                    aria-label={showPinCode ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPinCode ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#736D69] mt-1.5 leading-relaxed">
                  Mendukung kombinasi angka atau huruf. Klik tombol di bawah untuk langsung menyimpan perubahan ke Supabase tanpa perlu mengisi tab lain.
                </p>
              </div>

              {/* Status Message Alerts */}
              {pinSuccessMsg && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
                  <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              {pinErrorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{pinErrorMsg}</span>
                </div>
              )}

              {/* Tombol Simpan Langsung untuk Password */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveCredentialsOnly}
                  disabled={isSavingPin || !pinCode.trim() || !adminEmail.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#8E3B24] hover:bg-[#772F1B] active:scale-98 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSavingPin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan ke Database Supabase...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Simpan Password & Email Admin ke Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRASI AI */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl p-6 xl:p-8 border border-[#EBE5D8] shadow-xs space-y-5 xl:space-y-6">
            <h3 className="text-sm xl:text-lg font-bold text-[#2C2623] border-b pb-3 border-[#F0ECE6]">
              Kunci API & Otomasi AI
            </h3>
            <div className="space-y-4 xl:space-y-6">
              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm font-mono text-[#2C2623]"
                />
              </div>

              <div className="flex items-center justify-between p-4 xl:p-5 bg-[#FAF8F5] rounded-2xl border border-[#ECE7E1]">
                <div>
                  <h4 className="text-xs xl:text-sm font-bold text-[#2C2623]">Rekomendasi Menu Pelengkap Otomatis di POS</h4>
                  <p className="text-[11px] xl:text-xs text-[#736D69] mt-0.5">
                    Menyarankan mochi/minuman segar otomatis saat kasir memilih menu pedas balado.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoUpsell}
                  onChange={(e) => setAutoUpsell(e.target.checked)}
                  className="w-4 h-4 xl:w-5 xl:h-5 accent-[#8E3B24] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE ACTION */}
        <div className="flex items-center justify-between pt-2">
          {saveStatus ? (
            <span className="text-xs xl:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
              ✓ Pengaturan berhasil disimpan ke sistem!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#8E3B24] hover:bg-[#78301B] disabled:bg-gray-300 text-white px-6 xl:px-8 py-2.5 xl:py-3.5 rounded-full text-xs xl:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
