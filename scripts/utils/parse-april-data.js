const fs = require('fs');

function parse() {
    const rawData = fs.readFileSync('full-db-dump.json');
    const db = JSON.parse(rawData);

    const recs = db.recommendations || [];
    const opps = db.analyzed_opportunities || [];

    console.log(`--- OVERALL ---`);
    console.log(`Total Recommendations: ${recs.length}`);
    console.log(`Total Analyzed Opportunities: ${opps.length}`);
    
    // Win Rate logic
    let buyWins = 0;
    let buyLosses = 0;
    let sellWins = 0;
    let sellLosses = 0;

    let takeProfitsHit = 0;
    let stopLossesHit = 0;

    recs.forEach(rec => {
        if (!rec.is_correct === null) return; // Skip unvalidated
        
        if (rec.recommendation === 'Buy') {
            if (rec.is_correct) buyWins++;
            else if (rec.is_correct === false) buyLosses++;

            // Check if projection has take_profit/stop_loss
            if (rec.projection && rec.projection.includes('Take-Profit')) {
               // A bit raw, but we'll see how many follow the new prompt
            }
        }
        if (rec.recommendation === 'Sell') {
            if (rec.is_correct) sellWins++;
            else if (rec.is_correct === false) sellLosses++;
        }
    });

    console.log(`\n--- WIN/LOSS STATS ---`);
    console.log(`Buy Wins: ${buyWins} | Buy Losses: ${buyLosses}`);
    console.log(`Sell Wins: ${sellWins} | Sell Losses: ${sellLosses}`);
    
    const buytotal = buyWins + buyLosses;
    const selltotal = sellWins + sellLosses;
    if (buytotal > 0) console.log(`Buy Acc: ${((buyWins / buytotal) * 100).toFixed(1)}%`);
    if (selltotal > 0) console.log(`Sell Acc: ${((sellWins / selltotal) * 100).toFixed(1)}%`);

    // Look at new data distributions
    const recentOpps = opps.slice(-20);
    console.log(`\n--- RECENT OPPORTUNITIES (Last 20) ---`);
    recentOpps.forEach(opp => {
        console.log(`${opp.ticker} | Score: ${opp.conviction_score} | Sentiment Vel: ${opp.sentiment_velocity}`);
        console.log(`Summary: ${opp.ai_summary.substring(0, 80)}...`);
    });
}

parse();
