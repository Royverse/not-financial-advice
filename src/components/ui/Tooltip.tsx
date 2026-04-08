"use client";

import React from "react";

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: "top" | "bottom";
}

export default function Tooltip({ children, content, position = "top" }: TooltipProps) {
    const posClasses = position === "top" 
        ? "bottom-full left-1/2 -translate-x-1/2 mb-2" 
        : "top-full left-1/2 -translate-x-1/2 mt-2";
    
    const arrowClasses = position === "top"
        ? "top-full left-1/2 -translate-x-1/2 border-t-secondary/95"
        : "bottom-full left-1/2 -translate-x-1/2 border-b-secondary/95";

    return (
        <div className="group relative inline-block">
            {children}
            <div className={`absolute ${posClasses} w-48 p-3 bg-tooltip-bg/95 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] md:text-xs text-solarized-base1 group-hover:opacity-100 opacity-0 transition-all pointer-events-none z-[200] text-center shadow-tooltip border-solarized-blue/20`}>
                {content}
                <div className={`absolute border-8 border-transparent ${arrowClasses} opacity-90`}></div>
            </div>
        </div>
    );
}
