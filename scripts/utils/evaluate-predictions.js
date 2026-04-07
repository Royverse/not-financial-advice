require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function evaluate() {
    const data = JSON.parse(fs.readFileSync('db-dump.json', 'utf8'));

    const uniqueTickers = [...new Set(data.map(r => r.ticker))];
    console.log(`Found ${data.length} records across ${uniqueTickers.length} tickers: ${uniqueTickers.join(', ')}`);

    // We will simulate fetching current prices. Let's try to get latest prices from AV or just use the most recent price in the DB for each ticker for a quick offline check.
    // To be precise, let's find the latest record for each ticker in the DB to use as the "current price" proxy if we don't want to hit the API, 
    // or we can just fetch from Alpha Vantage.

    const proxyCurrentPrices = {};
    for (const ticker of uniqueTickers) {
        const tickerRecords = data.filter(r => r.ticker === ticker).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (tickerRecords.length > 0) {
            proxyCurrentPrices[ticker] = tickerRecords[0].stock_price || tickerRecords[0].rec_price;
        }
    }

    console.log('Proxy Current Prices (from latest DB records):', proxyCurrentPrices);

    let totalBuys = 0;
    let buyWins = 0;
    let buyLosses = 0;
    let totalHolds = 0;

    let simulatedPortfolioReturn = 0; // sum of percentage returns for buys

    console.log('\n--- EVALUATION OF "BUY" RECOMMENDATIONS ---');

    for (const rec of data) {
        if (!rec.rec_price || !rec.recommendation) continue;

        const currentPrice = proxyCurrentPrices[rec.ticker];
        const pctChange = ((currentPrice - rec.rec_price) / rec.rec_price) * 100;

        if (rec.recommendation === 'Buy') {
            totalBuys++;
            if (pctChange > 0) buyWins++;
            else if (pctChange < 0) buyLosses++;

            simulatedPortfolioReturn += pctChange;

            console.log(`[BUY] ${rec.ticker} on ${new Date(rec.created_at).toLocaleDateString()}: Rec Price $${rec.rec_price} -> Current $${currentPrice.toFixed(2)} | Return: ${pctChange.toFixed(2)}%`);
        } else if (rec.recommendation === 'Hold') {
            totalHolds++;
        }
    }

    console.log('\n--- SUMMARY ---');
    console.log(`Total Records: ${data.length}`);
    console.log(`Total Buys Evaluated: ${totalBuys}`);
    console.log(`Buy Wins: ${buyWins}`);
    console.log(`Buy Losses: ${buyLosses}`);
    console.log(`Average Return per Buy: ${totalBuys > 0 ? (simulatedPortfolioReturn / totalBuys).toFixed(2) : 0}%`);
    console.log(`Total Holds: ${totalHolds}`);

    // What about validated records specifically?
    const validated = data.filter(r => r.validation_date !== null);
    console.log(`\nOfficially Validated by System: ${validated.length}`);
    const officialCorrect = validated.filter(r => r.is_correct === true).length;
    console.log(`Official Accuracy: ${validated.length > 0 ? ((officialCorrect / validated.length) * 100).toFixed(2) : 0}%`);
}

evaluate();
