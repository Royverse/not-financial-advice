"use client";

import { PipelineStep } from "@/hooks/useStockData";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    AlertTriangle,
    Database,
    Wifi,
    Bot,
    Users
} from "lucide-react";

interface PipelineStatusProps {
    steps: PipelineStep[];
    isVisible: boolean;
}

const stepIcons: Record<string, React.ElementType> = {
    stock: Database,
    xpoz: Users,
    gemini: Bot,
    save: Wifi,
};

export default function PipelineStatus({ steps, isVisible }: PipelineStatusProps) {
    if (!isVisible || steps.length === 0) return null;

    const getStatusIcon = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-400" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-400" />;
            case 'mock':
                return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return 'border-blue-500/30 bg-blue-500/10';
            case 'success':
                return 'border-green-500/30 bg-green-500/10';
            case 'error':
                return 'border-red-500/30 bg-red-500/10';
            case 'mock':
                return 'border-yellow-500/30 bg-yellow-500/10';
            default:
                return 'border-gray-500/20 bg-gray-500/5';
        }
    };

    const getStatusBadge = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 rounded-full">Running</span>;
            case 'success':
                return <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-green-500/20 text-green-400 rounded-full">Live</span>;
            case 'error':
                return <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500/20 text-red-400 rounded-full">Failed</span>;
            case 'mock':
                return <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 rounded-full">Mock Data</span>;
            default:
                return <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 rounded-full">Pending</span>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 rounded-2xl space-y-3 bg-slate-800/40"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-purple-400" />
                    Analysis Pipeline
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">
                    {steps.filter(s => s.status === 'success' || s.status === 'mock').length}/{steps.length} complete
                </span>
            </div>

            <div className="space-y-2">
                <AnimatePresence>
                    {steps.map((step, idx) => {
                        const Icon = stepIcons[step.id] || Database;
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getStatusColor(step.status)}`}
                            >
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5">
                                    <Icon className="h-4 w-4 text-gray-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-200">{step.label}</span>
                                        {getStatusBadge(step.status)}
                                    </div>
                                    {step.message && (
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                            {step.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {step.duration && (
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {(step.duration / 1000).toFixed(1)}s
                                        </span>
                                    )}
                                    {getStatusIcon(step.status)}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Live API</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Mock/Cached</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Failed</span>
                </div>
            </div>
        </motion.div>
    );
}
