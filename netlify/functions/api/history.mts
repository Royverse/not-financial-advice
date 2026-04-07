import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const ticker = searchParams.get('ticker');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (ticker) {
            query = query.eq('ticker', ticker.toUpperCase());
        }

        const { data, error } = await query;

        if (error) throw error;

        return Response.json({ success: true, data });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
};
