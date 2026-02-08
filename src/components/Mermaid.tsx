"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: "dark", // Using dark theme for the new Twilight aesthetics
    securityLevel: "loose",
    themeVariables: {
        primaryColor: "#4f46e5", // indigo-600
        primaryTextColor: "#e2e8f0", // slate-200
        primaryBorderColor: "#818cf8", // indigo-400
        lineColor: "#94a3b8", // slate-400
        secondaryColor: "#1e293b", // slate-800
        tertiaryColor: "#0f172a", // slate-900
        fontFamily: "ui-sans-serif, system-ui, sans-serif"
    },
});

export default function Mermaid({ chart }: { chart: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            mermaid.contentLoaded();
        }
    }, [chart]);

    return (
        <div key={chart} className="mermaid flex justify-center py-6 overflow-x-auto" ref={ref}>
            {chart}
        </div>
    );
}
