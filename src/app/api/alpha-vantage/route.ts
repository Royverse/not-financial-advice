import { NextResponse } from 'next/server';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || searchParams.get('symbol');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
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
            return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
        }
        if (response.data['Note']) {
            return NextResponse.json({ error: 'API limit reached' }, { status: 429 });
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Alpha Vantage API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
