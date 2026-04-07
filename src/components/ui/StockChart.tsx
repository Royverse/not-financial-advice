"use client";

import { Line } from "react-chartjs-2";
import { StockData } from "@/types";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ScriptableContext
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StockChartProps {
    data: StockData;
}

export default function StockChart({ data }: StockChartProps) {
    const timeSeries = data?.["Time Series (Daily)"];

    if (!timeSeries) {
        return <div className="text-red-400/60 p-4 font-mono text-xs">No chart data available</div>;
    }

    const labels = Object.keys(timeSeries).reverse().slice(-30);
    const prices = labels.map((date) => parseFloat(timeSeries[date]["4. close"]));
    const symbolName = data["Meta Data"]["2. Symbol"];

    const isUp = prices[prices.length - 1] >= prices[0];

    const lineColor = isUp ? "#34d399" : "#f87171"; // emerald or red
    const lineColorAlpha = isUp ? "rgba(52, 211, 153, " : "rgba(248, 113, 113, ";

    const chartData = {
        labels,
        datasets: [
            {
                label: symbolName,
                data: prices,
                borderColor: lineColor,
                borderWidth: 1.5,
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, `${lineColorAlpha}0.12)`);
                    gradient.addColorStop(1, `${lineColorAlpha}0.0)`);
                    return gradient;
                },
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "transparent",
                pointBorderColor: "transparent",
                pointBorderWidth: 0,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `${symbolName} — 30D`,
                color: '#4a5568',
                font: {
                    size: 11,
                    weight: 'bold' as const,
                    family: 'monospace'
                },
                padding: { bottom: 16 }
            },
            tooltip: {
                backgroundColor: 'rgba(10, 14, 23, 0.95)',
                titleColor: '#8892a4',
                bodyColor: '#e8ecf1',
                titleFont: { family: 'monospace', size: 10 },
                bodyFont: { family: 'monospace', size: 12, weight: 'bold' as const },
                borderColor: 'rgba(255, 255, 255, 0.06)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        return `$${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#333d4f',
                    font: { size: 9, family: 'monospace' },
                    maxRotation: 0,
                    maxTicksLimit: 8,
                },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                ticks: {
                    color: '#333d4f',
                    font: { size: 9, family: 'monospace' },
                    callback: function (value: any) { return '$' + value; }
                },
                grid: { color: 'rgba(255, 255, 255, 0.03)', lineWidth: 1 },
                border: { display: false },
            }
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="w-full h-full min-h-[300px]">
            <Line data={chartData} options={options} />
        </div>
    );
}
