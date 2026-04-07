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
        <div className="group relative inline-block overflow-visible">
            {children}
            <div className={`absolute ${posClasses} w-48 p-3 bg-secondary/95 backdrop-blur-xl border border-foreground/10 rounded-2xl text-[10px] md:text-xs text-foreground group-hover:opacity-100 opacity-0 transition-all pointer-events-none z-[100] text-center shadow-2xl border-solarized-blue/20`}>
                {content}
                <div className={`absolute border-8 border-transparent ${arrowClasses}`}></div>
            </div>
        </div>
    );
}
