import { AlphaVantageService } from './alpha-vantage';

// Define the shape of a raw candidate from the scanner
export interface RawCandidate {
    ticker: string;
    price: number;
    volume: number;
    change_sub: number;
    change_percent: string;
}

export class ScannerService {
    private av: AlphaVantageService;

    constructor() {
        this.av = new AlphaVantageService();
    }

    /**
     * The Discovery Engine: Finds initial candidates
     * Logic: Top Gainers -> Filtered by Price > $2 and Vol > 500k
     */
    async discoverCandidates(): Promise<RawCandidate[]> {
        console.log("Starting Market Discovery...");

        try {
            const data = await this.av.getTopGainersLosers();

            if (!data.top_gainers) {
                console.warn("No top gainers data returned");
                return [];
            }

            const candidates: RawCandidate[] = [];

            // Filter Top Gainers
            for (const stock of data.top_gainers) {
                const price = parseFloat(stock.price);
                const volume = parseInt(stock.volume);

                // Filter 1: Price > $2 (Avoid garbage penny stocks)
                // Filter 2: Volume > 500k (Ensure liquidity)
                // Note: The API returns 'volume' as a string usually

                if (price > 2.0 && volume > 500000) {
                    candidates.push({
                        ticker: stock.ticker,
                        price,
                        volume,
                        change_sub: parseFloat(stock.change_amount),
                        change_percent: stock.change_percentage
                    });
                }
            }

            // Also check 'most_actively_traded' for high volume plays
            if (data.most_actively_traded) {
                for (const stock of data.most_actively_traded) {
                    const price = parseFloat(stock.price);
                    const volume = parseInt(stock.volume);

                    // Stricter filter for active: Must be up at least 3%
                    const change = parseFloat(stock.change_percentage.replace('%', ''));

                    if (price > 2.0 && volume > 1000000 && change > 3.0) {
                        // Avoid duplicates
                        if (!candidates.find(c => c.ticker === stock.ticker)) {
                            candidates.push({
                                ticker: stock.ticker,
                                price,
                                volume,
                                change_sub: parseFloat(stock.change_amount),
                                change_percent: stock.change_percentage
                            });
                        }
                    }
                }
            }

            console.log(`Discovered ${candidates.length} potential candidates.`);
            return candidates;

        } catch (error) {
            console.error("Discovery failed:", error);
            return [];
        }
    }
}
