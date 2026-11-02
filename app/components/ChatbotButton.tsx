'use client';

import React, { useState, useRef, useEffect } from 'react';

type Message = {
  sender: 'ai' | 'user';
  text: string;
  time?: string;
};

type ChatbotProps = {
  restoName?: string;
  address?: string;
  phone?: string;
  operatingHours?: { open: string; close: string };
};

const QUICK_SUGGESTIONS = [
  'Rekomendasi Menu Favorit',
  'Menu Pedas & Sambal',
  'Jam Buka & Lokasi',
  'Info Harga & Paket',
  'Cara Pesan / WhatsApp',
];

export default function ChatbotButton({
  restoName = 'WaroengMakan123',
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const initialWelcomeText = `Halo! Selamat datang di ${restoName}. 

Ada yang bisa saya bantu terkait menu prasmanan, harga, jam buka, atau lokasi kami?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: initialWelcomeText,
      time: formatCurrentTime(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const trimmedText = userText.trim();
    const newMsg: Message = {
      sender: 'user',
      text: trimmedText,
      time: formatCurrentTime(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi asisten');
      }

      const data = await response.json();
      const aiReply = data.reply || 'Maaf, belum ada respons. Silakan tanyakan kembali.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: formatCurrentTime(),
        },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Koneksi terganggu. Silakan tanyakan kembali atau hubungi WhatsApp kami.',
          time: formatCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: `Obrolan telah direset. Ada yang ingin Anda tanyakan seputar ${restoName}?`,
        time: formatCurrentTime(),
      },
    ]);
  };

  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} className="block min-h-[1.15rem]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-stone-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Buka AI Chatbot"
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#800020] hover:bg-[#68001a] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="text-xs font-semibold tracking-tight">AI Chatbot</span>
        </button>
      )}

      {/* Chat Dialog Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header (Clean, No Live Badge, No AI Slop) */}
          <div className="bg-[#800020] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight leading-tight">AI Chatbot</h3>
                <p className="text-[11px] text-white/80">{restoName}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset Obrolan"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips (Clean, No scrollbar bar showing) */}
          <div className="bg-[#FAF8F5] px-3 py-2 border-b border-stone-200 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex gap-1.5">
            {QUICK_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(item)}
                disabled={isLoading}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-stone-100 text-stone-700 font-medium px-3 py-1 rounded-full border border-stone-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-white text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-[#800020] text-white rounded-2xl rounded-tr-xs'
                      : 'bg-[#F9F7F5] border border-stone-200/80 text-stone-800 rounded-2xl rounded-tl-xs'
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>
                {msg.time && (
                  <span className="text-[10px] text-stone-400 mt-1 px-1">
                    {msg.time}
                  </span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-[#F9F7F5] border border-stone-200/80 rounded-2xl rounded-tl-xs w-fit text-stone-500">
                <span className="text-[11px]">Mengetik</span>
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Clean Input Form */}
          <div className="p-3 bg-white border-t border-stone-200">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Tanya menu, harga, lokasi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-[#FAF8F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 rounded-full px-4 py-2.5 focus:outline-none focus:border-[#800020] focus:bg-white transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Kirim pesan"
                className="bg-[#800020] hover:bg-[#68001a] disabled:bg-stone-200 disabled:text-stone-400 text-white p-2.5 rounded-full transition-all duration-150 cursor-pointer disabled:cursor-not-allowed shrink-0 flex items-center justify-center shadow-xs"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}