import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const scanId = searchParams.get('id');

        if (!scanId) {
            return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
        }

        // Fetch Candidates
        const { data: candidates, error: candError } = await supabase
            .from('ticker_candidates')
            .select('*')
            .eq('scan_id', scanId);

        // Fetch Opportunities
        const { data: opportunities, error: oppError } = await supabase
            .from('analyzed_opportunities')
            .select('*')
            .eq('scan_id', scanId);

        if (candError) throw candError;
        if (oppError) throw oppError;

        return NextResponse.json({
            success: true,
            candidates: candidates || [],
            opportunities: opportunities || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
