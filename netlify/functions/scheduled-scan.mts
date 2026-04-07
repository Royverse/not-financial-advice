// Netlify Scheduled Function: Autonomous Market Scanner
// Triggers during US market hours (Mon-Fri)
// This file is built by Netlify's function bundler, not Next.js

export default async function handler() {
    const APP_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
    const CRON_SECRET = process.env.CRON_SECRET || "nfa_secret_123";

    console.log(`[Scheduled Scan] Triggering at ${new Date().toISOString()}`);
    console.log(`[Scheduled Scan] App URL: ${APP_URL}`);

    try {
        const response = await fetch(`${APP_URL}/api/cron/select-tickers`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CRON_SECRET}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Scheduled Scan] HTTP ${response.status}: ${errorText}`);
            // Don't return error yet, try validation too
        } else {
            const data = await response.json();
            console.log(`[Scheduled Scan] ✅ Scan ${data.scanId} completed. Processed: ${data.processed}`);
        }

        // --- Trigger Outcome Validation ---
        console.log(`[Scheduled Scan] Triggering Outcome Validation...`);
        const validationRes = await fetch(`${APP_URL}/api/cron/validate-outcomes`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CRON_SECRET}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        if (validationRes.ok) {
            const valData = await validationRes.json();
            console.log(`[Scheduled Scan] ✅ Validation completed. Processed: ${valData.processed}`);
        } else {
            console.warn(`[Scheduled Scan] ⚠️ Validation failed: ${validationRes.status}`);
        }

        return new Response(JSON.stringify({ success: true, message: "Scan and Validation triggered" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Scheduled Scan] ❌ Failed:`, msg);
        return new Response(`Scan error: ${msg}`, { status: 500 });
    }
}

// Schedule: Mon-Fri 9:30 AM EST = 14:30 UTC
// Schedule: Mon-Fri 14:30 UTC = 9:30 AM EST (market open)
// Note: Netlify only supports one cron per function. To run multiple times, duplicate this function.
export const config = {
    schedule: "30 14 * * 1-5",
};
