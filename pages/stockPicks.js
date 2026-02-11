import { useState, useEffect } from 'react';
import ActionButton from '../comps/actionButton';
import BackLink from '../comps/backLink';
import { fetchStockData, saveStockPick, getStockPicks, removeStockPick } from '../utils/services/stockPicksFunctions';

const StockPicks = () => {
    const [symbol, setSymbol] = useState('');
    const [stockPicks, setStockPicks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load saved stock picks on component mount
    useEffect(() => {
        const savedPicks = getStockPicks();
        setStockPicks(savedPicks);
    }, []);

    const handleAddStock = async () => {
        if (!symbol.trim()) {
            setError('Please enter a stock symbol');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const stockData = await fetchStockData(symbol.trim());
            saveStockPick(stockData);
            
            // Update the displayed list
            const updatedPicks = getStockPicks();
            setStockPicks(updatedPicks);
            
            // Clear input
            setSymbol('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStock = (symbolToRemove) => {
        removeStockPick(symbolToRemove);
        const updatedPicks = getStockPicks();
        setStockPicks(updatedPicks);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddStock();
        }
    };

    const getFormattedCurrency = (value) => {
        return `$ ${value.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    };

    const getFormattedDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    return (
        <div>
            <div className="container">
                <BackLink />
                <h1 className="mt-3">Stock Picks Tracker</h1>
                
                <div className="alert alert-info mt-3" role="alert">
                    <strong>Setup Instructions:</strong> To use real-time stock data with your Finnhub API key:
                    <ol className="mb-0 mt-2">
                        <li>Create a file named <code>.env.local</code> in the project root</li>
                        <li>Add: <code>FINNHUB_API_KEY=your_api_key_here</code></li>
                        <li>Restart the dev server</li>
                    </ol>
                    Get your free API key at <a href="https://finnhub.io" target="_blank" rel="noreferrer">finnhub.io</a> (60 requests/minute free tier).
                    Currently using mock data for demo.
                </div>

                <div className="row gx-5 form-group mt-4">
                    <div className="col-3">
                        <label htmlFor="symbolInput" className="form-label">Stock Symbol</label>
                    </div>
                    <div className="col-6">
                        <input
                            type="text"
                            className="form-control"
                            id="symbolInput"
                            placeholder="Enter symbol (e.g., AAPL, MSFT)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="row mt-2">
                        <div className="col-9">
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        </div>
                    </div>
                )}

                <div className="row mt-3">
                    <div className="col-sm-9">
                        <ActionButton 
                            onClick={handleAddStock} 
                            text={loading ? "Loading..." : "Add Stock"} 
                        />
                    </div>
                </div>

                {stockPicks.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <h2>Saved Stock Picks</h2>
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th scope="col">Symbol</th>
                                            <th scope="col">Company</th>
                                            <th scope="col">Current Price</th>
                                            <th scope="col">3M High</th>
                                            <th scope="col">3M Low</th>
                                            <th scope="col">12M High</th>
                                            <th scope="col">12M Low</th>
                                            <th scope="col">Last Updated</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockPicks.map((stock, index) => (
                                            <tr key={`stock-${stock.symbol}-${index}`}>
                                                <th>{stock.symbol}</th>
                                                <td>{stock.companyName}</td>
                                                <td>{getFormattedCurrency(stock.currentPrice)}</td>
                                                <td>{getFormattedCurrency(stock.threeMonthHigh)}</td>
                                                <td>{getFormattedCurrency(stock.threeMonthLow)}</td>
                                                <td>{getFormattedCurrency(stock.twelveMonthHigh)}</td>
                                                <td>{getFormattedCurrency(stock.twelveMonthLow)}</td>
                                                <td>{getFormattedDate(stock.lastUpdated)}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemoveStock(stock.symbol)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {stockPicks.length === 0 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <div className="alert alert-secondary" role="alert">
                                No stock picks saved yet. Enter a symbol above to get started!
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockPicks;
