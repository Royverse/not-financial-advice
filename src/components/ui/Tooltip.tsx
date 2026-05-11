"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode; // Can be string or elements
    position?: "top" | "bottom"; // Keeping prop for backwards compatibility but always using top portal
}

export default function Tooltip({ children, content, position = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showTip = () => {
        if (!triggerRef.current) return;
        setIsVisible(true);
        const rect = triggerRef.current.getBoundingClientRect();
        
        // Calculate position (top-centered above element)
        setPos({ 
            top: rect.top - 10,
            left: rect.left + rect.width / 2 
        });
    };

    const hideTip = () => setIsVisible(false);

    return (
        <>
            <div 
                ref={triggerRef}
                onMouseEnter={showTip}
                onMouseLeave={hideTip}
                onFocus={showTip}
                onBlur={hideTip}
                className="inline-block"
            >
                {children}
            </div>
            {mounted && isVisible && createPortal(
                <div 
                    className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full"
                    style={{ top: pos.top, left: pos.left }}
                >
                    <div className="bg-tooltip-bg/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-[11px] text-solarized-base1 shadow-tooltip border-solarized-blue/20 max-w-[220px] whitespace-normal">
                        {content}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-tooltip-bg/95 opacity-90"></div>
                </div>,
                document.body
            )}
        </>
    );
}
