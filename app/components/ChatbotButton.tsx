"use client";

import { useState } from "react";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
        title="Open chatbot"
      >
        💬
      </button>
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="bg-gray-100 p-3 rounded mb-3">
            <p className="text-sm">Hi! How can I help you find the perfect meal?</p>
          </div>
        </div>
      )}
    </div>
  );
}
