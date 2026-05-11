
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

async function testAV() {
    console.log('Testing Alpha Vantage News Sentiment API...');
    console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 5)}...` : 'MISSING');

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'NEWS_SENTIMENT',
                tickers: 'AAPL',
                limit: '5',
                apikey: API_KEY,
            },
        });

        console.log('Status:', response.status);
        if (response.data['Note'] || response.data['Information']) {
            console.log('API Limit Reached:', response.data['Note'] || response.data['Information']);
        } else {
            console.log('Feed count:', response.data.feed?.length);
            console.log('First article sentiment:', response.data.feed?.[0]?.overall_sentiment_label);
            console.log('First article score:', response.data.feed?.[0]?.overall_sentiment_score);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testAV();
