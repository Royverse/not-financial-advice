import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'not financial advice.';
        workbook.lastModifiedBy = 'not financial advice.';
        workbook.created = new Date();
        workbook.modified = new Date();

        // --- Sheet 1: Track Record ---
        const sheetTrackRecord = workbook.addWorksheet('Track Record', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });
        sheetTrackRecord.columns = [
            { header: 'Date', key: 'created_at', width: 18 },
            { header: 'Ticker', key: 'ticker', width: 10 },
            { header: 'Rec', key: 'recommendation', width: 16 },
            { header: 'Conviction', key: 'conviction_score', width: 12 },
            { header: 'Entry', key: 'rec_price', width: 14 },
            { header: 'Target Low', key: 'price_range_low', width: 14 },
            { header: 'Target High', key: 'price_range_high', width: 14 },
            { header: 'Actual', key: 'actual_outcome', width: 14 },
            { header: 'P&L %', key: 'pnl', width: 10 },
            { header: 'Result', key: 'is_correct', width: 10 },
            { header: 'Sentiment', key: 'sentiment_label', width: 12 }
        ];

        const { data: recommendations } = await supabase
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (recommendations) {
            recommendations.forEach(item => {
                const recPrice = item.rec_price ? parseFloat(item.rec_price) : null;
                const actualPrice = item.actual_outcome ? parseFloat(item.actual_outcome) : null;
                const pnl = recPrice && actualPrice ? ((actualPrice - recPrice) / recPrice) * 100 : null;

                sheetTrackRecord.addRow({
                    created_at: new Date(item.created_at).toLocaleString(),
                    ticker: item.ticker,
                    recommendation: item.recommendation,
                    conviction_score: item.conviction_score,
                    rec_price: recPrice,
                    price_range_low: item.price_range_low,
                    price_range_high: item.price_range_high,
                    actual_outcome: actualPrice,
                    pnl: pnl !== null ? `${pnl.toFixed(2)}%` : '-',
                    is_correct: item.is_correct === true ? 'WIN' : item.is_correct === false ? 'MISS' : 'Pending',
                    sentiment_label: item.sentiment_label
                });
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="nfa_history_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
