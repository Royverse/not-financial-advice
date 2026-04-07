import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export default async (req: Request) => {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get('ticker') || searchParams.get('symbol');

    if (!ticker) {
        return Response.json({ error: 'Ticker symbol is required' }, { status: 400 });
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: ticker,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
        });

        if (response.data['Error Message']) {
            return Response.json({ error: 'Invalid ticker symbol' }, { status: 400 });
        }
        if (response.data['Note']) {
            return Response.json({ error: 'API limit reached' }, { status: 429 });
        }

        return Response.json(response.data);
    } catch (error) {
        console.error('Alpha Vantage API Error:', error);
        return Response.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
};
