"use client";

import { motion } from "framer-motion";

interface SentimentGaugeProps {
    score: number; // 0 to 100
}

export const SentimentGauge = ({ score }: SentimentGaugeProps) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (val: number) => {
        if (val > 70) return "#1c1c1c"; // Neutral Black for high scores
        if (val > 40) return "#86868b"; // Neutral Gray
        return "#555555"; // Darker Gray
    };

    return (
        <div className="relative flex items-center justify-center w-52 h-52 glass-card shadow-2xl">
            <svg className="w-44 h-44 transform -rotate-90">
                <circle
                    cx="88"
                    cy="88"
                    r={radius}
                    stroke="rgba(0,0,0,0.03)"
                    strokeWidth="8"
                    fill="transparent"
                />
                <motion.circle
                    cx="88"
                    cy="88"
                    r={radius}
                    stroke={getColor(score)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-black tracking-tighter">{score}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Honesty Score</span>
            </div>
        </div>
    );
};
