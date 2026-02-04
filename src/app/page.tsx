"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { SentimentGauge } from "@/components/SentimentGauge";
import { WordCloud } from "@/components/WordCloud";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { SearchResult, SearchHistoryItem } from "@/types";

export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("honest_reviews_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
        setHistory([]);
      }
    }
  }, []);

  const handleSearch = useCallback(async (product: string) => {
    if (!product.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: product }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Something went wrong while consulting Reddit.");
      }

      const data: SearchResult = await response.json();
      setResult(data);

      // Update history in a clean way
      setHistory(prev => {
        const newHistory = [
          { product },
          ...prev.filter(h => h.product.toLowerCase() !== product.toLowerCase()).slice(0, 4)
        ];
        localStorage.setItem("honest_reviews_history", JSON.stringify(newHistory));
        return newHistory;
      });

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen pb-24 selection:bg-black selection:text-white">
      {/* Hero Header */}
      <header className={`pt-28 px-6 max-w-5xl mx-auto text-center transition-all ${(result || loading) ? 'pb-8' : 'pb-16'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={(result || loading) ? "mb-8" : "mb-16"}
        >
          <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-400">
            Honest Reviews
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
            The raw truth, distilled from Reddit. <br />
            <span className="text-black/30">No affiliate links. No paid promotions.</span>
          </p>
        </motion.div>

        <div className={`flex justify-center px-4 transition-all ${(result || loading) ? 'mb-8' : 'mb-16'}`}>
          <SearchBar
            onSearch={handleSearch}
            isLoading={loading}
          />
        </div>

        {/* Recent Searches */}
        <AnimatePresence>
          {!loading && !result && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(h.product)}
                  className="px-6 py-2.5 glass-card hover:bg-white text-sm font-bold tracking-tight transition-all"
                  aria-label={`Search for ${h.product}`}
                >
                  {h.product}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {loading && <LoadingAnimation />}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 glass-card border-red-100 flex items-center gap-4 max-w-2xl mx-auto text-red-600"
          >
            <Info className="w-6 h-6" />
            <p className="font-bold tracking-tight">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Highlight Card */}
              <div className="lg:col-span-8">
                <article className="glass-card p-12 h-full flex flex-col md:flex-row items-center gap-12">
                  <SentimentGauge score={result.analysis.sentiment_score} />
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <h2 className="text-4xl font-black tracking-tight text-black">
                      The Verdict
                    </h2>
                    <p className="text-2xl leading-relaxed text-gray-500 font-medium italic">
                      "{result.analysis.conclusion || "Analyzing consensus..."}"
                    </p>
                  </div>
                </article>
              </div>

              {/* Theme Cloud */}
              <div className="lg:col-span-4 flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-4">Trending Patterns</h3>
                <div className="flex-1">
                  <WordCloud words={result.analysis.word_cloud} />
                </div>
              </div>
            </div>

            {/* Pros/Cons Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="glass-card p-10 border-t-8 border-black/5">
                <div className="flex items-center gap-3 mb-8 text-black">
                  <ThumbsUp className="w-6 h-6" />
                  <h3 className="font-black text-xl uppercase tracking-widest">Strengths</h3>
                </div>
                <ul className="space-y-5">
                  {(result.analysis.pros).map((p, i) => (
                    <li key={i} className="flex items-start gap-4 text-lg text-gray-600 font-bold leading-tight">
                      <span className="mt-2.5 w-2 h-2 rounded-full bg-black shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="glass-card p-10 border-t-8 border-black/5">
                <div className="flex items-center gap-3 mb-8 text-black/40">
                  <ThumbsDown className="w-6 h-6" />
                  <h3 className="font-black text-xl uppercase tracking-widest">Flaws</h3>
                </div>
                <ul className="space-y-5">
                  {(result.analysis.cons).map((c, i) => (
                    <li key={i} className="flex items-start gap-4 text-lg text-gray-400 font-medium leading-tight line-through decoration-black/10">
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sourcing Section */}
            <section className="pt-16 pb-12">
              <div className="flex items-center gap-6 mb-12">
                <h3 className="text-3xl font-black tracking-tighter shrink-0">Evidence</h3>
                <div className="h-px w-full bg-black/5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-8 glass-card hover:-translate-y-2 flex flex-col group h-64"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 mb-4">r/{source.subreddit}</span>
                    <p className="text-lg font-bold leading-snug line-clamp-3 mb-8 group-hover:text-black transition-colors">{source.title}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-xs font-black text-gray-400">{source.score.toLocaleString()} UPVOTES</span>
                      <ExternalLink className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
}
