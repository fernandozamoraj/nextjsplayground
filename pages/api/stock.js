// Next.js API route - runs on server, keeps API key secure
// Proxies stock data requests to Finnhub API

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }

    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    if (!FINNHUB_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const symbolUpper = symbol.toUpperCase();

        // Fetch current quote
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbolUpper}&token=${FINNHUB_API_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        if (quoteResponse.status === 401) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (quoteData.error || !quoteData.c || quoteData.c === 0) {
            return res.status(404).json({ error: `No data available for symbol ${symbolUpper}` });
        }

        // Fetch company profile
        const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbolUpper}&token=${FINNHUB_API_KEY}`;
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        // Calculate date ranges for historical data
        const now = Math.floor(Date.now() / 1000);
        const threeMonthsDate = new Date();
        threeMonthsDate.setMonth(threeMonthsDate.getMonth() - 3);
        const threeMonthsAgo = Math.floor(threeMonthsDate.getTime() / 1000);
        
        const twelveMonthsDate = new Date();
        twelveMonthsDate.setMonth(twelveMonthsDate.getMonth() - 12);
        const twelveMonthsAgo = Math.floor(twelveMonthsDate.getTime() / 1000);

        // Fetch 12-month historical data (daily candles)
        const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbolUpper}&resolution=D&from=${twelveMonthsAgo}&to=${now}&token=${FINNHUB_API_KEY}`;
        const candleResponse = await fetch(candleUrl);
        const candleData = await candleResponse.json();

        let threeMonthHigh = quoteData.h || quoteData.c * 1.1;
        let threeMonthLow = quoteData.l || quoteData.c * 0.9;
        let twelveMonthHigh = quoteData.h || quoteData.c * 1.2;
        let twelveMonthLow = quoteData.l || quoteData.c * 0.8;

        // If we have historical data, calculate actual highs/lows
        if (candleData.s === 'ok' && candleData.h && candleData.l && candleData.h.length > 0) {
            const timestamps = candleData.t;
            const highs = candleData.h;
            const lows = candleData.l;

            // Calculate 12-month highs/lows from all data
            twelveMonthHigh = Math.max(...highs);
            twelveMonthLow = Math.min(...lows);

            // Calculate 3-month highs/lows
            const threeMonthHighs = [];
            const threeMonthLows = [];
            
            timestamps.forEach((timestamp, index) => {
                if (timestamp >= threeMonthsAgo) {
                    threeMonthHighs.push(highs[index]);
                    threeMonthLows.push(lows[index]);
                }
            });

            // Only update if we found data in the 3-month range
            if (threeMonthHighs.length > 0) {
                threeMonthHigh = Math.max(...threeMonthHighs);
                threeMonthLow = Math.min(...threeMonthLows);
            }
        }

        // Return the aggregated data
        res.status(200).json({
            symbol: symbolUpper,
            companyName: profileData.name || symbolUpper,
            currentPrice: quoteData.c,
            threeMonthHigh: threeMonthHigh,
            threeMonthLow: threeMonthLow,
            twelveMonthHigh: twelveMonthHigh,
            twelveMonthLow: twelveMonthLow,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Stock API error:', error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
}
