"use client";

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface SentimentGaugeProps {
    score: number; // 0 to 100
}

export const SentimentGauge = ({ score }: SentimentGaugeProps) => {
    const [displayScore, setDisplayScore] = useState(0);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    // Spring animation for the path
    const springScore = useSpring(0, { stiffness: 40, damping: 20 });
    const pathOffset = useTransform(springScore, [0, 100], [circumference, 0]);

    useEffect(() => {
        springScore.set(score);

        // Animate the number counting up
        const controls = animate(0, score, {
            duration: 2,
            ease: "easeOut",
            onUpdate: (value) => setDisplayScore(Math.round(value)),
        });

        return () => controls.stop();
    }, [score, springScore]);

    const getColor = (val: number) => {
        if (val > 70) return "#000000"; // Black for high trust
        if (val > 40) return "#666666"; // Gray for mid
        return "#999999"; // Light gray for low (keep it neutral/monochrome for trust theme)
    };

    return (
        <div className="relative flex items-center justify-center w-56 h-56 glass-card shadow-2xl group">
            {/* Decorative Outer Ring */}
            <div className="absolute inset-4 rounded-full border border-black/[0.03]" />

            <svg className="w-48 h-48 transform -rotate-90">
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="rgba(0,0,0,0.03)"
                    strokeWidth="6"
                    fill="transparent"
                />
                <motion.circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke={getColor(score)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: pathOffset }}
                    strokeLinecap="round"
                />
            </svg>

            <div className="absolute flex flex-col items-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl font-black text-black tracking-tighter"
                >
                    {displayScore}
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">
                    Truth Index
                </span>
            </div>

            {/* Subtle Glow Effect on Hover */}
            <div className="absolute inset-0 rounded-full bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
    );
};
