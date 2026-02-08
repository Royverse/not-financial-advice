import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const {
            ticker, trend, support_resistance, projection, recommendation, stock_price,
            sentiment_score, sentiment_label, sentiment_evidence,
            conviction_score,
            price_range_low,
            price_range_high
        } = await request.json();

        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        const trendStr = typeof trend === 'object' ? JSON.stringify(trend) : trend;
        const supportResistanceStr = typeof support_resistance === 'object' ? JSON.stringify(support_resistance) : support_resistance;
        const projectionStr = typeof projection === 'object' ? JSON.stringify(projection) : projection;

        const { data, error } = await supabase
            .from('recommendations')
            .insert([
                {
                    ticker: ticker.toUpperCase(),
                    trend: trendStr,
                    support_resistance: supportResistanceStr,
                    projection: projectionStr,
                    recommendation: recommendation,
                    stock_price: stock_price || null,
                    rec_price: stock_price || null, // Populate the new column
                    sentiment_score: sentiment_score || null,
                    sentiment_label: sentiment_label || null,
                    sentiment_evidence: sentiment_evidence || null,
                    conviction_score: conviction_score || null,
                    price_range_low: price_range_low || null,
                    price_range_high: price_range_high || null,
                    created_at: new Date().toISOString(),
                },
            ])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to save recommendation' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { data, error } = await supabase
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
