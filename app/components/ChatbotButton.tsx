'use client';

import React, { useState } from 'react';

type ChatbotProps = {
  restoName?: string;
  address?: string;
  phone?: string;
  operatingHours?: { open: string; close: string };
};

export default function ChatbotButton({
  restoName = 'WaroengMakan123',
  address = 'Jl. Kuliner No. 12, Purwokerto',
  phone = '081234567890',
  operatingHours,
}: ChatbotProps) {
  const openTime = (operatingHours?.open || '10:00').slice(0, 5);
  const closeTime = (operatingHours?.close || '21:00').slice(0, 5);

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: `Halo! Saya asisten virtual ${restoName}. Ada yang bisa dibantu tentang menu prasmanan hari ini?` },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let reply = `Kami menyajikan konsep prasmanan Nusantara hangat & higienis di ${restoName}. Silakan cek katalog menu atau coba AI Matcher untuk rekomendasi kombo!`;

      if (q.includes('prasmanan') || q.includes('konsep') || q.includes('pesan')) {
        reply = `${restoName} mengusung konsep prasmanan: kamu bisa ambil dan kombinasikan aneka lauk, sayur, dan sambal sesuai selera langsung di outlet!`;
      } else if (q.includes('pedas') || q.includes('sambal')) {
        reply = 'Pecinta pedas wajib coba olahan Sambal Ijo, Sambal Balado, atau Ceker Mercon racikan bumbu khas kami!';
      } else if (q.includes('manis') || q.includes('kopi') || q.includes('minum')) {
        reply = 'Segarkan dahaga dengan Es Kopi Susu Gula Aren atau Es Jeruk Peras Murni kami!';
      } else if (q.includes('hemat') || q.includes('murah') || q.includes('harga') || q.includes('budget')) {
        reply = 'Harga menu kami sangat terjangkau, mulai dari Rp10.000-an saja untuk lauk dan sayur lezat berkualitas!';
      } else if (q.includes('buka') || q.includes('jam') || q.includes('lokasi') || q.includes('alamat')) {
        reply = `${restoName} buka setiap hari pukul ${openTime} - ${closeTime} WIB. Alamat kami di ${address}. WhatsApp: ${phone}`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 350);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        aria-label="Tanya AI Assistant"
        className="w-13 h-13 rounded-full bg-[#8B9A6E] hover:bg-[#728157] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 p-3.5"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isChatbotOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#EAE2D6] overflow-hidden flex flex-col h-[420px]">
          <div className="bg-[#8B9A6E] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EAE2D6] animate-pulse" />
              <span className="font-bold text-xs">Waroeng AI Virtual Waiter</span>
            </div>
            <button onClick={() => setIsChatbotOpen(false)} className="text-xs hover:opacity-80">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#F7F2EB]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#8B9A6E] text-white'
                      : 'bg-white border border-[#EAE2D6] text-[#2A2F23]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-[#EAE2D6] bg-white flex gap-2">
            <input
              type="text"
              placeholder="Tanya rasa, pedas, bujet..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 text-xs border border-[#EAE2D6] rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#8B9A6E]"
            />
            <button type="submit" className="bg-[#8B9A6E] hover:bg-[#728157] text-white text-xs px-4 rounded-full font-bold transition-colors">
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}