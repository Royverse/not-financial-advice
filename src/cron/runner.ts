/**
 * Cron Job Runner for Stock Analysis
 * 
 * This script runs stock analysis automatically at scheduled times.
 * 
 * Usage:
 *   1. Run manually: node src/cron/runner.js
 *   2. Or add to system cron/Task Scheduler
 * 
 * Schedule (US Market Hours):
 *   - 9:30 AM EST (Market Open)
 *   - 12:00 PM EST (Mid-day)
 *   - 4:00 PM EST (Market Close)
 */

const cron = require('node-cron');
const axios = require('axios');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'nfa_secret_123';

async function runDynamicSelection() {
    console.log(`\n[${new Date().toISOString()}] Starting Dynamic Ticker Selection...`);

    try {
        const response = await axios.post(`${APP_URL}/api/cron/select-tickers`, {}, {
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            },
            timeout: 300000 // 5 minute timeout for deep dives
        });

        const data = response.data;
        if (data.success) {
            console.log(`✅ Scan ${data.scanId} Completed!`);
            console.log(`   Processed: ${data.processed} opportunities.`);

            if (data.opportunities) {
                data.opportunities.forEach((op: any) => {
                    console.log(`   🎯 ${op.ticker}: Score ${op.conviction_score} (RVOL: ${op.rvol}) -> Watchlisted: ${op.is_watchlisted}`);
                });
            }
        } else {
            console.log('⚠️ Scan completed but success flag missing.');
        }

    } catch (error: any) {
        console.error('❌ Ticker Selection failed:', error.message);
        if (error.response) {
            console.error('   Server Response:', error.response.data);
        }
    }
}

// Run immediately on start
console.log('NFA Cron - Dynamic Ticker Selection System');
console.log(`App URL: ${APP_URL}`);
console.log('Schedule: M-F 9:30 AM, 12:00 PM, 4:00 PM EST\n');

// Schedule: 9:30 AM EST
cron.schedule('30 14 * * 1-5', () => {
    console.log('🔔 9:30 AM EST - Market Open Scan');
    runDynamicSelection();
}, { timezone: 'America/New_York' });

// Schedule: 12:00 PM EST
cron.schedule('0 12 * * 1-5', () => {
    console.log('🔔 12:00 PM EST - Mid-day Scan');
    runDynamicSelection();
}, { timezone: 'America/New_York' });

// Schedule: 4:00 PM EST
cron.schedule('0 16 * * 1-5', () => {
    console.log('🔔 4:00 PM EST - Market Close Scan');
    runDynamicSelection();
}, { timezone: 'America/New_York' });

// Keep the process running
console.log('Cron jobs scheduled. Waiting for triggers...');
console.log('To run manually now: npm run cron -- --now\n');

// Option to run immediately
if (process.argv.includes('--now')) {
    runDynamicSelection();
}
