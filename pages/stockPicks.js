import { useState, useEffect, useRef } from 'react';
import ActionButton from '../comps/actionButton';
import BackLink from '../comps/backLink';
import { fetchStockData, saveStockPick, getStockPicks, removeStockPick, getStockListFromCsv } from '../utils/services/stockPicksFunctions';

const StockPicks = () => {
    const [symbol, setSymbol] = useState('');
    const [shares, setShares] = useState('');
    const [stockPicks, setStockPicks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stockList, setStockList] = useState([]);
    const refreshStartedRef = useRef(false);
    const importFileRef = useRef(null);

    const getEasternTimeParts = () => {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        const parts = formatter.formatToParts(new Date());
        const map = parts.reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
        }, {});

        return {
            weekday: map.weekday,
            hour: Number(map.hour),
            minute: Number(map.minute)
        };
    };

    const isMarketOpen = () => {
        const { weekday, hour, minute } = getEasternTimeParts();
        const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
        if (!isWeekday) {
            return false;
        }

        const minutesSinceMidnight = hour * 60 + minute;
        const marketOpen = 9 * 60 + 30;
        const marketClose = 16 * 60 + 30;
        return minutesSinceMidnight >= marketOpen && minutesSinceMidnight <= marketClose;
    };

    const shouldRefreshStock = (stock) => {
        if (!stock || !stock.lastUpdated) {
            return true;
        }
        if (!Number.isFinite(stock.fiftyTwoWeekHigh) || !Number.isFinite(stock.fiftyTwoWeekLow)) {
            return true;
        }
        const lastUpdateTime = new Date(stock.lastUpdated).getTime();
        if (Number.isNaN(lastUpdateTime)) {
            return true;
        }
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        return Date.now() - lastUpdateTime >= twentyFourHoursMs;
    };

    // Load saved stock picks on component mount
    useEffect(() => {
        let isMounted = true;
        if (refreshStartedRef.current) {
            return () => {
                isMounted = false;
            };
        }
        refreshStartedRef.current = true;
        const savedPicks = getStockPicks();
        setStockPicks(savedPicks);

        const refreshIfNeeded = async () => {
            const picksToRefresh = savedPicks.filter((stock) => shouldRefreshStock(stock));
            if (picksToRefresh.length === 0) {
                return;
            }

            try {
                for (const stock of picksToRefresh) {
                    const freshData = await fetchStockData(stock.symbol);
                    saveStockPick(freshData);
                }
                if (isMounted) {
                    const updatedPicks = getStockPicks();
                    setStockPicks(updatedPicks);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            }
        };

        refreshIfNeeded();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        getStockListFromCsv()
            .then((list) => {
                if (isMounted) {
                    setStockList(list);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setStockList([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleAddStock = async () => {
        if (!symbol.trim()) {
            setError('Please enter a stock symbol');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const parsedShares = Number.parseInt(shares, 10);
            const safeShares = Number.isFinite(parsedShares) && parsedShares >= 0 ? parsedShares : 0;
            const stockData = await fetchStockData(symbol.trim());
            saveStockPick({
                ...stockData,
                shares: safeShares
            });
            
            // Update the displayed list
            const updatedPicks = getStockPicks();
            setStockPicks(updatedPicks);
            
            // Clear input
            setSymbol('');
            setShares('');
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

    const handleRefreshAll = async () => {
        setLoading(true);
        setError('');

        try {
            const currentPicks = getStockPicks();
            for (const stock of currentPicks) {
                const freshData = await fetchStockData(stock.symbol);
                saveStockPick(freshData);
            }
            const updatedPicks = getStockPicks();
            setStockPicks(updatedPicks);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const picksToExport = getStockPicks();
        const payload = JSON.stringify(picksToExport, null, 2);
        const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock-picks-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        if (importFileRef.current) {
            importFileRef.current.value = '';
            importFileRef.current.click();
        }
    };

    const handleImportFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!Array.isArray(parsed)) {
                    throw new Error('Invalid file format. Expected an array of stock picks.');
                }

                const normalized = parsed
                    .filter((item) => item && item.symbol)
                    .map((item) => ({
                        ...item,
                        symbol: String(item.symbol).toUpperCase(),
                        shares: Number.isFinite(Number(item.shares)) ? Number(item.shares) : 0
                    }));

                localStorage.setItem('stockPicks', JSON.stringify(normalized));
                setStockPicks(normalized);
                setError('');
            } catch (err) {
                setError(err.message);
            }
        };
        reader.onerror = () => {
            setError('Unable to read the selected file.');
        };
        reader.readAsText(file);
    };

    const handleSharesUpdate = (symbolToUpdate, value) => {
        const parsedShares = Number.parseInt(value, 10);
        const safeShares = Number.isFinite(parsedShares) && parsedShares >= 0 ? parsedShares : 0;

        const updatedPicks = stockPicks.map((stock) =>
            stock.symbol === symbolToUpdate
                ? { ...stock, shares: safeShares }
                : stock
        );

        setStockPicks(updatedPicks);
        localStorage.setItem('stockPicks', JSON.stringify(updatedPicks));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddStock();
        }
    };

    const getFormattedCurrency = (value) => {
        if (!Number.isFinite(value)) {
            return 'N/A';
        }
        return `$ ${value.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    };

    const getFormattedDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    const getMarketValue = (stock) => {
        if (!Number.isFinite(stock.currentPrice) || !Number.isFinite(stock.shares)) {
            return NaN;
        }
        return stock.currentPrice * stock.shares;
    };

    const getTotalMarketValue = () => {
        return stockPicks.reduce((total, stock) => {
            const marketValue = getMarketValue(stock);
            if (!Number.isFinite(marketValue)) {
                return total;
            }
            return total + marketValue;
        }, 0);
    };

    const getSourceLabel = (stock) => {
        if (stock.isMock === true) {
            return 'Mock';
        }
        if (stock.isMock === false) {
            return 'Live';
        }
        return 'Unknown';
    };

    const getFiftyTwoWeekHigh = (stock) => {
        return stock.fiftyTwoWeekHigh;
    };

    const getFiftyTwoWeekLow = (stock) => {
        return stock.fiftyTwoWeekLow;
    };

    const normalizedQuery = symbol.trim().toUpperCase();
    const selectedStockName = normalizedQuery.length === 0
        ? ''
        : (stockList.find((item) => item.symbol === normalizedQuery) || {}).name || '';

    return (
        <div>
            <div className="container">
                <BackLink />
                <h1 className="mt-3">Stock Picks Tracker</h1>

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
                        {selectedStockName && (
                            <div className="form-text">{selectedStockName}</div>
                        )}
                    </div>
                </div>

                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="sharesInput" className="form-label">Shares</label>
                    </div>
                    <div className="col-6">
                        <input
                            type="number"
                            className="form-control"
                            id="sharesInput"
                            placeholder="Enter shares (e.g., 10)"
                            min="0"
                            step="1"
                            value={shares}
                            onChange={(e) => setShares(e.target.value.replace(/\D/g, ''))}
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
                    <div className="col-sm-3">
                        <ActionButton
                            onClick={handleRefreshAll}
                            text={loading ? "Refreshing..." : "Refresh All"}
                        />
                    </div>
                </div>

                <div className="row mt-2">
                    <div className="col-sm-6">
                        <button
                            type="button"
                            className="btn w-100"
                            style={{ backgroundColor: '#ffffff', color: '#f97316', borderColor: '#f97316', borderWidth: '2px' }}
                            onClick={handleExport}
                        >
                            Export JSON
                        </button>
                    </div>
                    <div className="col-sm-6">
                        <button
                            type="button"
                            className="btn w-100"
                            style={{ backgroundColor: '#ffffff', color: '#f97316', borderColor: '#f97316', borderWidth: '2px' }}
                            onClick={handleImportClick}
                        >
                            Import JSON
                        </button>
                        <input
                            type="file"
                            accept="application/json"
                            ref={importFileRef}
                            onChange={handleImportFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {stockPicks.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <h2>Saved Stock Picks</h2>
                            <div className="alert alert-secondary" role="alert">
                                <strong>Total Market Value:</strong> {getFormattedCurrency(getTotalMarketValue())}
                            </div>
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th scope="col">Symbol</th>
                                            <th scope="col">Company</th>
                                            <th scope="col">Current Price</th>
                                            <th scope="col">52W High</th>
                                            <th scope="col">52W Low</th>
                                            <th scope="col">Shares</th>
                                            <th scope="col">Market Value</th>
                                            <th scope="col">Last Updated</th>
                                            <th scope="col">Source</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockPicks.map((stock, index) => (
                                            <tr key={`stock-${stock.symbol}-${index}`}>
                                                <th>{stock.symbol}</th>
                                                <td>{stock.companyName}</td>
                                                <td>{getFormattedCurrency(stock.currentPrice)}</td>
                                                <td>{getFormattedCurrency(getFiftyTwoWeekHigh(stock))}</td>
                                                <td>{getFormattedCurrency(getFiftyTwoWeekLow(stock))}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        min="0"
                                                        step="1"
                                                        value={Number.isFinite(stock.shares) ? stock.shares : ''}
                                                        onChange={(e) => handleSharesUpdate(stock.symbol, e.target.value)}
                                                        disabled={loading}
                                                    />
                                                </td>
                                                <td>{getFormattedCurrency(getMarketValue(stock))}</td>
                                                <td>{getFormattedDate(stock.lastUpdated)}</td>
                                                <td>
                                                    <span className={`badge ${getSourceLabel(stock) === 'Live' ? 'bg-success' : getSourceLabel(stock) === 'Mock' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                        {getSourceLabel(stock)}
                                                    </span>
                                                </td>
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

                <div className="alert alert-info mt-3" role="alert">
                    <strong>Powered by: Finnhub</strong> 
                </div>
            </div>
        </div>
    );
};

export default StockPicks;
