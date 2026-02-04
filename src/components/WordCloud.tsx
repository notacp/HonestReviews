"use client";

import { motion } from "framer-motion";
import { useMemo, useRef } from "react";

interface WordCloudProps {
    words: { text: string; value: number }[];
}

export const WordCloud = ({ words = [] }: WordCloudProps) => {
    const safeWords = Array.isArray(words) ? words : [];
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate stable random positions for cloud effect
    const wordPositions = useMemo(() => {
        return safeWords.slice(0, 20).map((word, i) => {
            // Use deterministic "random" based on index and text
            const seed = (i * 17 + word.text.length * 13) % 100;
            const seed2 = (i * 23 + word.text.charCodeAt(0)) % 100;

            return {
                ...word,
                x: (seed / 100) * 20 - 10,
                y: (seed2 / 100) * 10 - 5,
                rotate: ((seed - 50) / 100) * 8,
            };
        });
    }, [safeWords]);

    // Sort by value to render larger words first (better visual stacking)
    const sortedWords = useMemo(() => {
        return [...wordPositions].sort((a, b) => b.value - a.value);
    }, [wordPositions]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full glass-card p-8 flex flex-wrap items-center justify-center content-center gap-x-3 gap-y-2 overflow-hidden min-h-[320px] relative"
        >
            {sortedWords.length > 0 ? (
                sortedWords.map((word, i) => {
                    const fontSize = Math.max(12, Math.min(32, 10 + (word.value / 100) * 22));
                    const fontWeight = word.value > 70 ? 800 : word.value > 40 ? 600 : 500;

                    return (
                        <motion.span
                            key={word.text}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                x: word.x,
                                rotate: word.rotate,
                            }}
                            transition={{
                                delay: i * 0.04,
                                type: "spring",
                                stiffness: 100,
                                damping: 15,
                            }}
                            drag
                            dragConstraints={containerRef}
                            dragElastic={0.1}
                            dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                            whileDrag={{
                                scale: 1.2,
                                zIndex: 50,
                                cursor: "grabbing",
                            }}
                            whileHover={{
                                scale: 1.1,
                                color: "#000",
                                transition: { duration: 0.15 }
                            }}
                            className="cursor-grab active:cursor-grabbing select-none whitespace-nowrap transition-colors"
                            style={{
                                fontSize: `${fontSize}px`,
                                fontWeight,
                                color: word.value > 60 ? "#1a1a1a" : word.value > 30 ? "#666" : "#999",
                            }}
                        >
                            {word.text}
                        </motion.span>
                    );
                })
            ) : (
                <p className="text-gray-400 italic text-sm text-center">No recurring patterns found yet.</p>
            )}
        </div>
    );
};
