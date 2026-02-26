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

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Date string
 */
export const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get month string in YYYY-MM format from date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Month string
 */
export const getMonthString = (dateString) => {
    return dateString.substring(0, 7);
};

/**
 * Get growth history from local storage
 * @returns {Object} Growth history with daily and monthly values
 */
export const getGrowthHistory = () => {
    try {
        const history = localStorage.getItem('stockGrowthHistory');
        if (!history) {
            return { daily: [], monthly: [] };
        }
        const parsed = JSON.parse(history);
        return {
            daily: Array.isArray(parsed.daily) ? parsed.daily : [],
            monthly: Array.isArray(parsed.monthly) ? parsed.monthly : []
        };
    } catch (error) {
        console.error('Error reading growth history from local storage:', error);
        return { daily: [], monthly: [] };
    }
};

/**
 * Save growth history to local storage
 * @param {Object} history - Growth history object
 */
export const saveGrowthHistory = (history) => {
    try {
        localStorage.setItem('stockGrowthHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving growth history to local storage:', error);
    }
};

/**
 * Update growth history with today's total value
 * @param {number} totalValue - Today's total portfolio value
 */
export const updateGrowthHistory = (totalValue) => {
    const today = getTodayDateString();
    const history = getGrowthHistory();
    
    // Check if today's value already exists
    const todayExists = history.daily.some(entry => entry.date === today);
    if (todayExists) {
        return; // Already saved today
    }
    
    // Add today's value
    history.daily.push({ date: today, value: totalValue });
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().substring(0, 10);
    
    // Filter out daily entries older than 7 days
    const recentDaily = [];
    const oldDaily = [];
    
    for (const entry of history.daily) {
        if (entry.date >= sevenDaysAgoString) {
            recentDaily.push(entry);
        } else {
            oldDaily.push(entry);
        }
    }
    
    // Process old daily entries - keep highest per month
    const monthlyMap = new Map();
    
    // First, load existing monthly data
    for (const entry of history.monthly) {
        monthlyMap.set(entry.month, entry.value);
    }
    
    // Then, process old daily entries
    for (const entry of oldDaily) {
        const month = getMonthString(entry.date);
        const currentMax = monthlyMap.get(month);
        
        if (currentMax === undefined || entry.value > currentMax) {
            monthlyMap.set(month, entry.value);
        }
    }
    
    // Convert monthly map to array and sort by month
    const monthly = Array.from(monthlyMap.entries())
        .map(([month, value]) => ({ month, value }))
        .sort((a, b) => a.month.localeCompare(b.month));
    
    // Update history
    history.daily = recentDaily.sort((a, b) => a.date.localeCompare(b.date));
    history.monthly = monthly;
    
    saveGrowthHistory(history);
};
