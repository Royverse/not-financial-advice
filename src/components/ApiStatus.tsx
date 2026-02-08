"use client";

import { useApiHealth } from "@/hooks/useApiHealth";
import { AlertTriangle, CheckCircle, RefreshCw, Server, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function ApiStatus() {
    const { health, loading, refreshHealth } = useApiHealth();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy": return "text-green-400 border-green-500/30 bg-green-500/10";
            case "degraded": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
            case "error": return "text-red-400 border-red-500/30 bg-red-500/10";
            default: return "text-gray-400 border-gray-500/30 bg-gray-500/10";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy": return <CheckCircle className="h-4 w-4" />;
            case "degraded": return <Activity className="h-4 w-4" />;
            case "error": return <AlertTriangle className="h-4 w-4" />;
            default: return <Server className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md w-full md:w-auto">
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                <Cpu className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-bold tracking-wider text-gray-300 uppercase">System Status</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {health?.services && Object.entries(health.services).map(([name, data]) => (
                    <motion.div
                        key={name}
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(data.status)} transition-all cursor-help relative group`}
                        title={`${data.message} ${data.tooltip ? `\n${data.tooltip}` : ''}`}
                    >
                        {getStatusIcon(data.status)}
                        <span className="text-xs font-bold uppercase tracking-wide">
                            {name === 'alpha_vantage' ? 'Market Data' : name === 'xpoz' ? 'Social' : name}
                        </span>

                        {/* Tooltip Popup */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 text-center shadow-xl">
                            {data.message}
                            {data.tooltip && <div className="mt-1 text-gray-500 border-t border-gray-700 pt-1">{data.tooltip}</div>}
                        </div>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={refreshHealth}
                className="ml-auto p-2 rounded-xl hover:bg-white/10 text-gray-400 transition"
                title="Refresh Status"
            >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}
