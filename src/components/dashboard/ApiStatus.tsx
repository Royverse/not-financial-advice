"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { AlertTriangle, CheckCircle, RefreshCw, Server, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function ApiStatus() {
    const { health, loading, refreshHealth } = useApiHealth();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy": return "text-solarized-green border-solarized-green/20 bg-solarized-green/10";
            case "degraded": return "text-solarized-yellow border-solarized-yellow/20 bg-solarized-yellow/10";
            case "error": return "text-solarized-red border-solarized-red/20 bg-solarized-red/10";
            default: return "text-foreground/40 border-foreground/10 bg-foreground/5";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy": return <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />;
            case "degraded": return <Activity className="h-3.5 w-3.5 md:h-4 md:w-4" />;
            case "error": return <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />;
            default: return <Server className="h-3.5 w-3.5 md:h-4 md:w-4" />;
        }
    };

    return (
        <div className="flex items-center gap-2 md:gap-4 glass-card p-2 md:p-3 w-full md:w-auto shadow-none border-foreground/10 overflow-visible">
            <div className="flex items-center gap-2 pr-2 md:pr-4 border-r border-foreground/10 h-full py-1">
                <Cpu className="h-4 w-4 text-solarized-violet" />
                <span className="hidden lg:inline text-[10px] font-black tracking-widest text-foreground/40 uppercase whitespace-nowrap">Core</span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 overflow-visible">
                {health?.services && Object.entries(health.services).map(([name, data]) => (
                    <motion.div
                        key={name}
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border ${getStatusColor(data.status)} transition-all cursor-help relative group shadow-sm`}
                    >
                        {getStatusIcon(data.status)}
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                            {name === 'alpha_vantage' ? 'Mkt' : name === 'xpoz' ? 'Soc' : name === 'cron_job' ? 'Crn' : name === 'gemini' ? 'AI' : name}
                        </span>

                        {/* Tooltip Popup */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 p-3 bg-secondary border border-foreground/10 rounded-2xl text-[10px] md:text-xs text-foreground group-hover:opacity-100 opacity-0 transition-all pointer-events-none z-[100] text-center shadow-2xl backdrop-blur-3xl border-solarized-blue/20">
                            <div className="font-bold mb-1 uppercase tracking-wider text-solarized-blue">{data.message}</div>
                            {data.tooltip && <div className="mt-2 text-foreground/50 border-t border-foreground/5 pt-2 uppercase text-[9px] tracking-tight">{data.tooltip}</div>}
                        </div>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={refreshHealth}
                className="ml-auto p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/30 border border-transparent hover:border-foreground/10 transition shadow-sm"
                title="Refresh Status"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}
