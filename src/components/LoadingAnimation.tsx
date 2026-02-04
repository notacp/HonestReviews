"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
    "Scouring Reddit for the raw truth...",
    "Filtering out the corporate fluff...",
    "Reading between the lines of fanboys...",
    "Digging through the comment sections...",
    "Synthesizing authentic opinions...",
    "Bypassing the fake 5-star reviews...",
];

export const LoadingAnimation = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="relative w-24 h-24">
                <motion.div
                    className="absolute inset-0 border-4 border-primary rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                    className="absolute inset-2 border-4 border-primary/40 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </div>
            <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-muted-foreground text-center italic"
            >
                {messages[index]}
            </motion.p>
        </div>
    );
};
