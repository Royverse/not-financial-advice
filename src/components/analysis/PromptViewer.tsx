"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface PromptViewerProps {
    prompt: string;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function PromptViewer({ prompt }: PromptViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const parts = prompt.split(/(<<<.*?>>>)/g);

    return (
        <div className="w-full mt-4 border-t border-white/[0.04] pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition group w-full text-left"
            >
                <Terminal className="h-3.5 w-3.5 text-indigo-500/40" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Inspect Prompt</span>
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 p-4 bg-black/30 rounded-lg border border-white/[0.04] font-mono text-[11px] whitespace-pre-wrap text-gray-500 overflow-x-auto leading-relaxed">
                            {parts.map((part, i) => {
                                if (part.startsWith("<<<") && part.endsWith(">>>")) {
                                    const content = part.slice(3, -3);
                                    return (
                                        <span
                                            key={i}
                                            className="text-indigo-400 font-bold bg-indigo-500/10 px-1 rounded"
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
