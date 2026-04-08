"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { AlertTriangle, CheckCircle, RefreshCw, Server, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Tooltip from "@/components/ui/Tooltip";
import Lottie from "lottie-react";
import siriAnimation from "../../../public/Siri Animation.json";

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
        <div className="flex items-center gap-1 md:gap-4 glass-card p-1.5 md:p-3 w-auto md:w-auto shadow-none border-foreground/10 overflow-visible max-w-full">
            <div className="hidden sm:flex items-center gap-2 pr-2 md:pr-4 border-r border-foreground/10 h-full py-1">
                <div className="w-6 h-6 -ml-1 flex items-center justify-center">
                    <Lottie animationData={siriAnimation} loop={true} />
                </div>
                <span className="hidden lg:inline text-[10px] font-black tracking-widest text-foreground/40 uppercase whitespace-nowrap">Core</span>
            </div>

            <div className="grid grid-cols-2 md:flex items-center gap-1 md:gap-2 overflow-visible">
                {health?.services && Object.entries(health.services).map(([name, data]) => (
                    <Tooltip key={name} content={data.message} position="bottom">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`flex items-center justify-center gap-1 md:gap-1.5 px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg border ${getStatusColor(data.status)} transition-all cursor-pointer relative group shadow-sm`}
                        >
                            {getStatusIcon(data.status)}
                            <span className="hidden md:inline text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                {name === 'alpha_vantage' ? 'Mkt' : name === 'xpoz' ? 'Soc' : name === 'cron_job' ? 'Crn' : name === 'gemini' ? 'AI' : name}
                            </span>
                        </motion.div>
                    </Tooltip>
                ))}
            </div>

            <button
                onClick={refreshHealth}
                className="ml-auto p-1 rounded-lg hover:bg-foreground/5 text-foreground/30 border border-transparent hover:border-foreground/10 transition shadow-sm"
                title="Refresh Status"
            >
                <RefreshCw className={`h-3 w-3 md:h-3.5 md:w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}
