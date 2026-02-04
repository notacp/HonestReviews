"use client";

import { motion } from "framer-motion";

interface WordCloudProps {
    words: { text: string; value: number }[];
}

export const WordCloud = ({ words = [] }: WordCloudProps) => {
    // Safe check for words
    const safeWords = Array.isArray(words) ? words : [];

    return (
        <div className="w-full min-h-64 glass-card p-6 flex flex-wrap items-center justify-center gap-4 overflow-hidden">
            {safeWords.length > 0 ? (
                safeWords.slice(0, 20).map((word, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="font-medium hover:text-primary transition-colors cursor-default select-none"
                        style={{
                            fontSize: `${Math.max(14, Math.min(48, word.value / 2))}px`,
                            opacity: Math.max(0.4, word.value / 100),
                        }}
                    >
                        {word.text}
                    </motion.span>
                ))
            ) : (
                <p className="text-muted-foreground italic text-sm text-center">No recurring patterns found yet.</p>
            )}
        </div>
    );
};
