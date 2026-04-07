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
    Users,
    LucideIcon
} from "lucide-react";

interface PipelineStatusProps {
    steps: PipelineStep[];
    isVisible: boolean;
}

const stepIcons: Record<string, LucideIcon> = {
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
                return <Loader2 className="h-4 w-4 animate-spin text-solarized-blue" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-solarized-green" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-solarized-red" />;
            case 'mock':
                return <AlertTriangle className="h-4 w-4 text-solarized-yellow" />;
            default:
                return <Clock className="h-4 w-4 text-foreground/30" />;
        }
    };

    const getStatusColor = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return 'border-solarized-blue/20 bg-solarized-blue/5';
            case 'success':
                return 'border-solarized-green/20 bg-solarized-green/5';
            case 'error':
                return 'border-solarized-red/20 bg-solarized-red/5';
            case 'mock':
                return 'border-solarized-yellow/20 bg-solarized-yellow/5';
            default:
                return 'border-foreground/10 bg-foreground/5';
        }
    };

    const getStatusBadge = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-solarized-blue/10 text-solarized-blue rounded-full tracking-widest border border-solarized-blue/20">Running</span>;
            case 'success':
                return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-solarized-green/10 text-solarized-green rounded-full tracking-widest border border-solarized-green/20">Live</span>;
            case 'error':
                return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-solarized-red/10 text-solarized-red rounded-full tracking-widest border border-solarized-red/20">Failed</span>;
            case 'mock':
                return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-solarized-yellow/10 text-solarized-yellow rounded-full tracking-widest border border-solarized-yellow/20">Mock</span>;
            default:
                return <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-foreground/10 text-foreground/30 rounded-full tracking-widest border border-foreground/10">Wait</span>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 rounded-3xl space-y-4 bg-transparent border-foreground/5"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-solarized-violet" />
                    Analysis Pipeline
                </h3>
                <span className="text-[10px] text-foreground/20 font-mono font-bold uppercase">
                    {steps.filter(s => s.status === 'success' || s.status === 'mock').length}/{steps.length} SYNCED
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
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${getStatusColor(step.status)} shadow-sm`}
                            >
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-foreground/5 border border-foreground/5">
                                    <Icon className="h-5 w-5 text-foreground/40" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-foreground uppercase tracking-wider">{step.label}</span>
                                        {getStatusBadge(step.status)}
                                    </div>
                                    {step.message && (
                                        <p className="text-[10px] text-foreground/30 font-medium truncate mt-1 uppercase tracking-tight">
                                            {step.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {step.duration && (
                                        <span className="text-[10px] text-foreground/20 font-mono font-bold">
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
            <div className="flex items-center gap-5 pt-3 border-t border-foreground/5 text-[9px] font-black uppercase tracking-widest text-foreground/20">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-solarized-green/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-solarized-green" />
                    <span>Live</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-solarized-yellow/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-solarized-yellow" />
                    <span>Mock</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-solarized-red/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-solarized-red" />
                    <span>Failed</span>
                </div>
            </div>
        </motion.div>
    );
}
