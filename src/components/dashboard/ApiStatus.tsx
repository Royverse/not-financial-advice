"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { AlertTriangle, CheckCircle, RefreshCw, Cpu } from "lucide-react";

export default function ApiStatus() {
    const { health, loading, refreshHealth } = useApiHealth();

    const getStatusDot = (status: string) => {
        switch (status) {
            case "healthy": return "bg-emerald-400";
            case "degraded": return "bg-amber-400";
            case "error": return "bg-red-400";
            default: return "bg-gray-600";
        }
    };

    return (
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 pr-3 border-r border-white/[0.06]">
                <Cpu className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em]">SYS</span>
            </div>

            <div className="flex items-center gap-2">
                {health?.services && Object.entries(health.services).map(([name, data]) => (
                    <div
                        key={name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.04] cursor-help relative group"
                        title={`${data.message}${data.tooltip ? `\n${data.tooltip}` : ''}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(data.status)} ${data.status === 'healthy' ? 'animate-status-pulse' : ''}`} />
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            {name === 'alpha_vantage' ? 'MKT' : name === 'xpoz' ? 'SOC' : name === 'cron_job' ? 'CRON' : name.toUpperCase().slice(0, 4)}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 p-2.5 bg-[#161c2d] border border-white/10 rounded-lg text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 text-center shadow-2xl">
                            {data.message}
                            {data.tooltip && <div className="mt-1.5 text-gray-600 border-t border-white/5 pt-1.5">{data.tooltip}</div>}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={refreshHealth}
                className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-600 hover:text-gray-400 transition"
                title="Refresh"
            >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}
