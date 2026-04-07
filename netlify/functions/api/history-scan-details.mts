import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    try {
        const url = new URL(req.url);
        const scanId = url.searchParams.get('id');

        if (!scanId) {
            return new Response(JSON.stringify({ error: 'Scan ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
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

        return new Response(JSON.stringify({
            success: true,
            candidates: candidates || [],
            opportunities: opportunities || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
