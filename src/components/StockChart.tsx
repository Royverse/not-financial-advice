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
        return <div className="text-red-400 p-4 font-bold">No chart data available</div>;
    }

    const labels = Object.keys(timeSeries).reverse().slice(-30); // Last 30 days
    const prices = labels.map((date) => parseFloat(timeSeries[date]["4. close"]));
    const symbolName = data["Meta Data"]["2. Symbol"];

    const chartData = {
        labels,
        datasets: [
            {
                label: symbolName,
                data: prices,
                borderColor: "#818cf8", // indigo-400
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, "rgba(129, 140, 248, 0.4)");
                    gradient.addColorStop(1, "rgba(129, 140, 248, 0.0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#818cf8",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
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
                text: `${symbolName} - 30 Day Trend`,
                color: '#94a3b8', // slate-400
                font: {
                    size: 16,
                    weight: 'bold' as const,
                    family: 'sans-serif'
                },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
                titleColor: '#e2e8f0', // slate-200
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
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
                ticks: { color: '#64748b', font: { size: 10 } }, // slate-500
                grid: { display: false }
            },
            y: {
                ticks: {
                    color: '#64748b', // slate-500 
                    font: { size: 10 },
                    callback: function (value: any) { return '$' + value; }
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [4, 4] }
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
