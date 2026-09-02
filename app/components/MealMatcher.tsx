"use client";

import { useState } from "react";

export default function MealMatcher() {
  const [preferences, setPreferences] = useState("");

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Find Your Meal</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter your food preferences..."
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Search Meals
        </button>
      </div>
    </section>
  );
}
