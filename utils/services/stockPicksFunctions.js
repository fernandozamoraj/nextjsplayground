/**
 * Fetch stock data via Next.js API route (secure - API key stays on server)
 * The API route at /api/stock proxies requests to Finnhub API
 * 
 * Setup: Create .env.local file in project root with:
 * FINNHUB_API_KEY=your_actual_api_key_here
 * 
 * Get your free API key from https://finnhub.io
 */

/**
 * Fetch stock quote and company information via Next.js API route
 * @param {string} symbol - Stock ticker symbol (e.g., 'AAPL', 'MSFT', 'IBM')
 * @returns {Promise<Object>} Stock data including price, highs, lows, and company name
 */
export const fetchStockData = async (symbol) => {
    try {
        const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch stock data');
        }
        
        const data = await response.json();
        return {
            ...data,
            isMock: false,
            dataSource: 'live'
        };
        
    } catch (error) {
        console.log('Error fetching stock data:', error.message);
        throw error;
    }
};

/**
 * Save stock pick to local storage
 * @param {Object} stockData - Stock data to save
 */
export const saveStockPick = (stockData) => {
    try {
        const existingPicks = getStockPicks();
        const existingPick = existingPicks.find(pick => pick.symbol === stockData.symbol);
        const mergedPick = {
            ...existingPick,
            ...stockData
        };
        const updatedPicks = existingPicks.filter(pick => pick.symbol !== stockData.symbol);
        updatedPicks.unshift(mergedPick);
        localStorage.setItem('stockPicks', JSON.stringify(updatedPicks));
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
};

/**
 * Get all stock picks from local storage
 * @returns {Array} Array of saved stock picks
 */
export const getStockPicks = () => {
    try {
        const picks = localStorage.getItem('stockPicks');
        return picks ? JSON.parse(picks) : [];
    } catch (error) {
        console.error('Error reading from local storage:', error);
        return [];
    }
};

/**
 * Remove a stock pick from local storage
 * @param {string} symbol - Stock symbol to remove
 */
export const removeStockPick = (symbol) => {
    try {
        const existingPicks = getStockPicks();
        const updatedPicks = existingPicks.filter(pick => pick.symbol !== symbol);
        localStorage.setItem('stockPicks', JSON.stringify(updatedPicks));
    } catch (error) {
        console.error('Error removing from local storage:', error);
    }
};

let cachedStockList = null;

const parseCsvLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && nextChar === '"') {
            current += '"';
            i += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values.map((value) => value.trim());
};

export const getStockListFromCsv = async () => {
    if (cachedStockList) {
        return cachedStockList;
    }

    const response = await fetch('/js/stocks.csv');
    if (!response.ok) {
        throw new Error('Unable to load stock list.');
    }

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) {
        cachedStockList = [];
        return cachedStockList;
    }

    const dataLines = lines.slice(1);
    cachedStockList = dataLines
        .map((line) => parseCsvLine(line))
        .filter((fields) => fields.length >= 2)
        .map((fields) => ({
            symbol: fields[0].toUpperCase(),
            name: fields[1]
        }))
        .filter((item) => item.symbol && item.name);

    return cachedStockList;
};
