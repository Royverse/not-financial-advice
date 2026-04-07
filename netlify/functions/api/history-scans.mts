import { supabase } from '../../../src/lib/services/supabase';

export default async (req: Request) => {
    try {
        const { data, error } = await supabase
            .from('market_scans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
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
