import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'not financial advice.';
        workbook.lastModifiedBy = 'not financial advice.';
        workbook.created = new Date();
        workbook.modified = new Date();

        // --- Sheet 1: High Conviction (Score > 70) ---
        const sheetHighlights = workbook.addWorksheet('High Conviction Plays', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        sheetHighlights.columns = [
            { header: 'Date', key: 'created_at', width: 20 },
            { header: 'Ticker', key: 'ticker', width: 10 },
            { header: 'Conviction', key: 'conviction_score', width: 12 },
            { header: 'Recommendation', key: 'ai_summary', width: 40 },
            { header: 'RVOL', key: 'rvol', width: 10 },
            { header: 'Float Rot', key: 'float_rotation', width: 10 },
            { header: 'Sent. Vel', key: 'sentiment_velocity', width: 10 },
        ];

        // Fetch High Conviction Data
        const { data: highConviction } = await supabase
            .from('analyzed_opportunities')
            .select('*')
            .gt('conviction_score', 70)
            .order('created_at', { ascending: false });

        if (highConviction) {
            highConviction.forEach(item => {
                const row = sheetHighlights.addRow({
                    ...item,
                    created_at: new Date(item.created_at).toLocaleString()
                });

                // Style: Green for Buy
                if (item.ai_summary.includes('Buy')) {
                    row.getCell('ai_summary').font = { color: { argb: 'FF006400' }, bold: true };
                }
            });
        }

        // --- Sheet 2: Full History ---
        const sheetHistory = workbook.addWorksheet('Full Scan History', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        sheetHistory.columns = [
            { header: 'Date', key: 'created_at', width: 20 },
            { header: 'Ticker', key: 'ticker', width: 10 },
            { header: 'Conviction', key: 'conviction_score', width: 12 },
            { header: 'RVOL', key: 'rvol', width: 10 },
            { header: 'Float Rot', key: 'float_rotation', width: 10 },
            { header: 'Sent. Vel', key: 'sentiment_velocity', width: 10 },
            { header: 'AI Summary', key: 'ai_summary', width: 50 },
        ];

        // Fetch All Data
        const { data: allHistory } = await supabase
            .from('analyzed_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (allHistory) {
            allHistory.forEach(item => {
                sheetHistory.addRow({
                    ...item,
                    created_at: new Date(item.created_at).toLocaleString()
                });
            });
        }

        // --- Sheet 3: Scan Logs ---
        const sheetLogs = workbook.addWorksheet('Scan Logs', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        sheetLogs.columns = [
            { header: 'Date', key: 'created_at', width: 20 },
            { header: 'Type', key: 'scan_type', width: 15 },
            { header: 'Found', key: 'tickers_found', width: 10 },
            { header: 'Status', key: 'status', width: 10 },
            { header: 'Duration (ms)', key: 'duration_ms', width: 15 },
        ];

        const { data: logs } = await supabase
            .from('market_scans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logs) {
            logs.forEach(item => {
                sheetLogs.addRow({
                    ...item,
                    created_at: new Date(item.created_at).toLocaleString()
                });
            });
        }

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="nfa_history_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
