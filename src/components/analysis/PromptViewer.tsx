"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface PromptViewerProps {
    prompt: string;
}

export default function PromptViewer({ prompt }: PromptViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Split logic: matches content between <<< and >>>
    const parts = prompt.split(/(<<<.*?>>>)/g);

    return (
        <div className="w-full mt-8 border-t border-white/10 pt-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition group w-full text-left"
            >
                <Terminal className="h-5 w-5 text-pink-500" />
                <span className="font-mono text-sm uppercase tracking-wider">Inspect AI Prompt</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 p-6 bg-black/50 rounded-xl border border-white/10 font-mono text-sm whitespace-pre-wrap text-gray-400 shadow-inner overflow-x-auto">
                            {parts.map((part, i) => {
                                if (part.startsWith("<<<") && part.endsWith(">>>")) {
                                    // Remove delimiters
                                    const content = part.slice(3, -3);
                                    return (
                                        <span
                                            key={i}
                                            className="text-pink-400 font-bold bg-pink-500/10 px-1 rounded mx-0.5 animate-pulse"
                                            style={{ textShadow: "0 0 10px rgba(244, 114, 182, 0.5)" }}
                                        >
                                            {content}
                                        </span>
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
