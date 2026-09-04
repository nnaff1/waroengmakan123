'use client';

import React, { useState } from 'react';

export default function ChatbotButton() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Halo! Ada yang bisa AI bantu pilihkan untuk santapan hari ini?' },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let reply = 'Kami punya ragam sajian Nusantara autentik. Coba gunakan fitur AI Matcher di atas untuk rekomendasi instan!';

      if (q.includes('pedas') || q.includes('sambal')) {
        reply = 'Pecinta pedas wajib coba Nasi Ayam Geprek Sambal Ijo atau Ceker Mercon Kuah Pedas!';
      } else if (q.includes('manis') || q.includes('kopi') || q.includes('cemil')) {
        reply = 'Pasangan sempurna buat santai: Pisang Goreng Keju Cokelat + Es Kopi Susu Gula Aren.';
      } else if (q.includes('hemat') || q.includes('murah') || q.includes('budget')) {
        reply = 'Untuk paket hemat di bawah Rp30k, Nasi Ayam Geprek + Es Teh atau Nasi Telur Dadar jadi primadona!';
      } else if (q.includes('buka') || q.includes('jam') || q.includes('lokasi')) {
        reply = 'Kami buka setiap hari pukul 10:00 - 22:00 WIB di Cabang Purwokerto dan Bandung!';
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        aria-label="Tanya AI Assistant"
        className="w-13 h-13 rounded-full bg-[#4E6148] hover:bg-[#3D4D38] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 p-3.5"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isChatbotOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#ECE7E1] overflow-hidden flex flex-col h-[420px]">
          <div className="bg-[#4E6148] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="font-bold text-xs">Waroeng AI Virtual Waiter</span>
            </div>
            <button onClick={() => setIsChatbotOpen(false)} className="text-xs hover:opacity-80">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#FAF8F5]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#8E3B24] text-white'
                      : 'bg-white border border-[#EFECE6] text-[#2C2623]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-[#ECE7E1] bg-white flex gap-2">
            <input
              type="text"
              placeholder="Tanya rasa, pedas, bujet..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 text-xs border border-[#ECE7E1] rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#4E6148]"
            />
            <button type="submit" className="bg-[#4E6148] hover:bg-[#3D4D38] text-white text-xs px-4 rounded-full font-bold">
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}