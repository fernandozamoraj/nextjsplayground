/**
 * Fetch stock data via Next.js API route (secure - API key stays on server)
 * The API route at /api/stock proxies requests to Finnhub API
 * 
 * Setup: Create .env.local file in project root with:
 * FINNHUB_API_KEY=your_actual_api_key_here
 * 
 * Get your free API key from https://finnhub.io
 */

// Mock data for demo/fallback purposes
const MOCK_STOCK_DATA = {
    'AAPL': { name: 'Apple Inc', price: 178.45, high3m: 195.30, low3m: 165.50, high12m: 199.62, low12m: 150.20 },
    'MSFT': { name: 'Microsoft Corporation', price: 405.23, high3m: 420.15, low3m: 365.80, high12m: 425.50, low12m: 310.45 },
    'GOOGL': { name: 'Alphabet Inc', price: 142.87, high3m: 155.20, low3m: 125.30, high12m: 160.75, low12m: 105.60 },
    'TSLA': { name: 'Tesla Inc', price: 245.60, high3m: 285.40, low3m: 190.25, high12m: 299.90, low12m: 152.37 },
    'AMZN': { name: 'Amazon.com Inc', price: 175.33, high3m: 188.65, low3m: 155.20, high12m: 191.70, low12m: 118.35 },
    'IBM': { name: 'IBM Corporation', price: 183.92, high3m: 195.75, low3m: 165.40, high12m: 201.20, low12m: 155.88 }
};

/**
 * Generate mock stock data for demo purposes
 * @param {string} symbol - Stock ticker symbol
 * @returns {Object} Mock stock data
 */
const generateMockData = (symbol) => {
    const symbolUpper = symbol.toUpperCase();
    const mockData = MOCK_STOCK_DATA[symbolUpper];
    
    if (mockData) {
        return {
            symbol: symbolUpper,
            companyName: mockData.name,
            currentPrice: mockData.price,
            threeMonthHigh: mockData.high3m,
            threeMonthLow: mockData.low3m,
            twelveMonthHigh: mockData.high12m,
            twelveMonthLow: mockData.low12m,
            lastUpdated: new Date().toISOString(),
            isMock: true,
            dataSource: 'mock'
        };
    }
    
    // Generate random data for unknown symbols
    const basePrice = 100 + Math.random() * 300;
    return {
        symbol: symbolUpper,
        companyName: `${symbolUpper} Corporation`,
        currentPrice: basePrice,
        threeMonthHigh: basePrice * 1.15,
        threeMonthLow: basePrice * 0.85,
        twelveMonthHigh: basePrice * 1.35,
        twelveMonthLow: basePrice * 0.65,
        lastUpdated: new Date().toISOString(),
        isMock: true,
        dataSource: 'mock'
    };
};

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
            
            // If API key not configured, fall back to mock data
            if (response.status === 500 && errorData.error === 'API key not configured') {
                console.log('API key not configured - using mock data');
                return generateMockData(symbol);
            }
            
            // For 404, also use mock data
            if (response.status === 404) {
                console.log('Symbol not found - using mock data');
                return generateMockData(symbol);
            }
            
            throw new Error(errorData.error || 'Failed to fetch stock data');
        }
        
        const data = await response.json();
        return {
            ...data,
            isMock: false,
            dataSource: 'live'
        };
        
    } catch (error) {
        console.log('Error fetching stock data - using mock data:', error.message);
        return generateMockData(symbol);
    }
};

/**
 * Save stock pick to local storage
 * @param {Object} stockData - Stock data to save
 */
export const saveStockPick = (stockData) => {
    try {
        const existingPicks = getStockPicks();
        const updatedPicks = existingPicks.filter(pick => pick.symbol !== stockData.symbol);
        updatedPicks.unshift(stockData);
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
