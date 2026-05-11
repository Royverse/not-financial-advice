"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { RefreshCw } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import Lottie from "lottie-react";
import siriAnimation from "../../../public/Siri Animation.json";

export default function ApiStatus() {
    const { health, loading, refreshHealth } = useApiHealth();

    const getPillStyle = (status: string) => {
        switch (status) {
            case "healthy": return { dot: "bg-solarized-green ring-2 ring-solarized-green/20", text: "text-solarized-green" };
            case "degraded": return { dot: "bg-solarized-yellow ring-2 ring-solarized-yellow/20 animate-pulse", text: "text-solarized-yellow" };
            case "error": return { dot: "bg-solarized-red ring-2 ring-solarized-red/20", text: "text-solarized-red" };
            default: return { dot: "bg-foreground/20 ring-2 ring-foreground/5", text: "text-foreground/40" };
        }
    };

    const getDisplayName = (name: string) => {
        switch (name) {
            case 'alpha_vantage': return 'Mkt';
            case 'xpoz': return 'Soc';
            case 'cron_job': return 'Crn';
            case 'gemini': return 'AI';
            default: return name;
        }
    };

    return (
        <div className="inline-flex items-center gap-1 md:gap-1.5 bg-background border border-foreground/10 rounded-xl p-1 md:p-1.5 relative shadow-sm">
            <div className="hidden sm:flex items-center gap-1.5 pr-1 md:pr-2 border-r border-foreground/10 h-full py-0.5">
                <div className="w-5 h-5 md:w-6 md:h-6 -ml-1 flex items-center justify-center">
                    <Lottie animationData={siriAnimation} loop={true} />
                </div>
                <span className="hidden lg:inline text-[9px] md:text-[10px] font-black tracking-widest text-foreground/40 uppercase whitespace-nowrap">Core</span>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
                {health?.services && Object.entries(health.services).map(([name, data]) => {
                    const style = getPillStyle(data.status);
                    return (
                        <Tooltip key={name} content={
                            <div>
                                <strong className="font-semibold block mb-0.5 text-solarized-base1">{getDisplayName(name)} API</strong>
                                <span className="text-solarized-base1/80">{data.message || 'Status unknown'}</span>
                            </div>
                        }>
                            <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-transparent cursor-default transition-colors hover:bg-foreground/5 select-none">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}></span>
                                <span className={`text-[9px] md:text-[11px] font-bold tracking-widest uppercase ${style.text}`}>
                                    {getDisplayName(name)}
                                </span>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
            
            <div className="w-[1px] h-4 md:h-5 bg-foreground/10 mx-0.5"></div>
            
            <button
                onClick={refreshHealth}
                className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors shrink-0"
                title="Refresh Status"
                aria-label="Refresh status"
            >
                <RefreshCw className={`h-3 w-3 md:h-3.5 md:w-3.5 ${loading ? 'animate-spin text-foreground' : ''}`} />
            </button>
        </div>
    );
}
