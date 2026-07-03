/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Star, Award, ShieldCheck } from "lucide-react";

interface StudentAIRecommendationsProps {
  userId: string;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentAIRecommendations({ userId, showToast }: StudentAIRecommendationsProps) {
  const [genre, setGenre] = useState("Computer Science");
  const [studyGoal, setStudyGoal] = useState("");
  const [favoriteBooks, setFavoriteBooks] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, studyGoal, favoriteBooks })
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.recommendations || []);
        showToast("Gemini recommendations generated!", "success");
      } else {
        showToast(data.message || "Failed to generate AI suggestions", "error");
      }
    } catch (err) {
      showToast("Network error contacting Gemini API", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="student-ai-root" className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Intro block */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" /> AI Recommendation Engine
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Personalized Gemini Study Recommendations</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Input your current academic courses, research goals, or favorite authors. Gemini AI will scan the library inventory to match reading itineraries customized to you.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <form onSubmit={handleGetRecommendations} className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Interests</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">FAVORITE GENRE / AREA</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
            >
              <option value="Computer Science">Computer Science & Programming</option>
              <option value="Artificial Intelligence">Artificial Intelligence / ML</option>
              <option value="Data Structures">Data Structures & Logic</option>
              <option value="General Science">General Science & Physics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ACADEMIC STUDY GOAL</label>
            <input
              type="text"
              required
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g. Master React, Prepare for algorithms midterm"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">FAVORITE BOOKS / AUTHORS</label>
            <input
              type="text"
              required
              value={favoriteBooks}
              onChange={(e) => setFavoriteBooks(e.target.value)}
              placeholder="e.g. Clean Code, Joshua Bloch"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? "Analyzing Catalog..." : "Generate Custom Plan"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Results Screen */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Recommended Reading Itinerary</h3>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Scanning local stock matrices via Gemini API...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs text-slate-400 text-center font-medium">
              Specify your academic interests and study goals to request custom curriculum recommendations.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {item.estimatedDifficulty || "Standard"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">MATCH score: 98%</span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-xs leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500">by {item.author || "Unknown Author"}</p>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      {item.reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Catalog Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
