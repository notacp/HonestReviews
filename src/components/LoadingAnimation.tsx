"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
    "Consulting the Reddit hivemind...",
    "Extracting authentic user experiences...",
    "Filtering out paid promotions...",
    "Detecting sentiment patterns...",
    "Synthesizing the raw truth...",
    "Bypassing marketing fluff...",
];

export const LoadingAnimation = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-10 py-20">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer breathing circle */}
                <motion.div
                    className="absolute inset-0 border-[1px] border-black/5 rounded-full"
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Main rotating segments */}
                <div className="relative w-20 h-20">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 border-t-2 border-black rounded-full"
                            style={{ padding: i * 4 }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1 + (i * 0.5),
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.1
                            }}
                        />
                    ))}
                </div>

                {/* Center dot */}
                <motion.div
                    className="absolute w-1.5 h-1.5 bg-black rounded-full"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            </div>

            <div className="h-8 relative w-full flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-xl font-serif font-medium text-gray-500 italic text-center absolute"
                    >
                        {messages[index]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};
