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

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function PipelineStatus({ steps, isVisible }: PipelineStatusProps) {
    if (!isVisible || steps.length === 0) return null;

    const getStatusIcon = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running':
                return <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />;
            case 'success':
                return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
            case 'error':
                return <XCircle className="h-3.5 w-3.5 text-red-400" />;
            case 'mock':
                return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
            default:
                return <Clock className="h-3.5 w-3.5 text-gray-600" />;
        }
    };

    const getStatusBorder = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running': return 'border-l-indigo-500/40';
            case 'success': return 'border-l-emerald-500/40';
            case 'error': return 'border-l-red-500/40';
            case 'mock': return 'border-l-amber-500/40';
            default: return 'border-l-gray-700/40';
        }
    };

    const getStatusLabel = (status: PipelineStep['status']) => {
        switch (status) {
            case 'running': return <span className="text-indigo-400">EXEC</span>;
            case 'success': return <span className="text-emerald-400">DONE</span>;
            case 'error': return <span className="text-red-400">FAIL</span>;
            case 'mock': return <span className="text-amber-400">MOCK</span>;
            default: return <span className="text-gray-600">WAIT</span>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="glass-card p-4 rounded-xl space-y-2"
        >
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <Wifi className="h-3 w-3 text-indigo-500/50" />
                    Pipeline
                </h3>
                <span className="text-[10px] text-gray-600 font-mono tabular-nums">
                    {steps.filter(s => s.status === 'success' || s.status === 'mock').length}/{steps.length}
                </span>
            </div>

            <div className="space-y-1">
                <AnimatePresence>
                    {steps.map((step, idx) => {
                        const Icon = stepIcons[step.id] || Database;
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.3, ease }}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-2 bg-white/[0.02] transition-all ${getStatusBorder(step.status)}`}
                            >
                                <Icon className="h-3.5 w-3.5 text-gray-600 shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-medium text-gray-300">{step.label}</span>
                                    {step.message && (
                                        <p className="text-[10px] text-gray-600 truncate font-mono">{step.message}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {step.duration && (
                                        <span className="text-[9px] text-gray-600 font-mono tabular-nums">
                                            {(step.duration / 1000).toFixed(1)}s
                                        </span>
                                    )}
                                    <span className="text-[9px] font-mono font-bold tracking-wider">
                                        {getStatusLabel(step.status)}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
