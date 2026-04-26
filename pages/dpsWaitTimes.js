import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionButton from '../comps/actionButton';
import BackLink from '../comps/backLink';
import {
    DEFAULT_ORIGIN,
    DPS_WAIT_TIMES_URL,
    LICENSE_TYPE_OPTIONS,
    calculateDistanceMiles,
    filterWaitTimeRows,
    formatAvailabilityText,
    formatDistanceText,
    formatWaitTimeText,
    geocodeOriginAddress,
    getStoredOfficeCoordsMap,
    getStoredOrigin,
    getWaitTimesCache,
    isIncomingAsOfNewer,
    markWaitTimesFetchAttempt,
    resolveOfficeCoordinates,
    reverseGeocodeOrigin,
    saveStoredOrigin,
    saveWaitTimesCache,
    shouldFetchWaitTimesToday
} from '../utils/services/dpsWaitTimesFunctions';

const DEFAULT_FILTERS = {
    searchText: '',
    maxDistance: '',
    maxWaitMinutes: '',
    maxAvailabilityDays: '',
    licenseType: 'All license types',
    sortBy: 'distance'
};

const DpsWaitTimes = () => {
    const [waitTimeRows, setWaitTimeRows] = useState([]);
    const [asOfDate, setAsOfDate] = useState('');
    const [fetchedAt, setFetchedAt] = useState('');
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
    const [addressInput, setAddressInput] = useState(DEFAULT_ORIGIN.label);
    const [officeCoordsMap, setOfficeCoordsMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Loading cached DPS wait times...');
    const [error, setError] = useState('');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const waitTimeRowsRef = useRef([]);

    useEffect(() => {
        waitTimeRowsRef.current = waitTimeRows;
    }, [waitTimeRows]);

    const hydrateAllOfficeCoordinates = useCallback(async (rows) => {
        const officeNames = Array.from(new Set(
            (Array.isArray(rows) ? rows : [])
                .map((row) => row.officeName)
                .filter(Boolean)
        ));

        if (officeNames.length === 0) {
            return;
        }

        const storedMap = getStoredOfficeCoordsMap();
        const officesToResolve = officeNames.filter(
            (officeName) => !Object.prototype.hasOwnProperty.call(storedMap, officeName)
        );

        if (officesToResolve.length === 0) {
            setOfficeCoordsMap(storedMap);
            return;
        }

        for (const officeName of officesToResolve) {
            await resolveOfficeCoordinates(officeName);
        }

        setOfficeCoordsMap(getStoredOfficeCoordsMap());
    }, []);

    const updateOrigin = useCallback((nextOrigin) => {
        const normalizedOrigin = saveStoredOrigin(nextOrigin);
        setOrigin(normalizedOrigin);
        setAddressInput(normalizedOrigin.label || '');
    }, []);

    const refreshIfEligible = useCallback(async () => {
        const decision = shouldFetchWaitTimesToday();
        setStatusMessage(decision.reason);

        if (!decision.shouldFetch) {
            void hydrateAllOfficeCoordinates(waitTimeRowsRef.current);
            return;
        }

        setLoading(true);
        setError('');
        const lastAttemptDate = markWaitTimesFetchAttempt();

        try {
            const response = await fetch('/api/dpsWaitTimes');
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to load Texas DPS wait times.');
            }

            const cached = getWaitTimesCache();
            const shouldReplaceCache = cached.rows.length === 0 || isIncomingAsOfNewer(payload.asOfDate, cached.asOfDate);
            const nextCache = shouldReplaceCache
                ? {
                    rows: payload.rows,
                    asOfDate: payload.asOfDate,
                    fetchedAt: payload.fetchedAt || new Date().toISOString(),
                    lastAttemptDate
                }
                : {
                    ...cached,
                    lastAttemptDate
                };

            const savedCache = saveWaitTimesCache(nextCache);
            setWaitTimeRows(savedCache.rows);
            setAsOfDate(savedCache.asOfDate);
            setFetchedAt(savedCache.fetchedAt);
            void hydrateAllOfficeCoordinates(savedCache.rows);
            setStatusMessage(
                shouldReplaceCache
                    ? `Loaded DPS wait times for ${payload.asOfDate}.`
                    : `No newer DPS as-of date was found, so the existing cache was kept (${cached.asOfDate || 'current cache'}).`
            );
        } catch (err) {
            setError(err.message);
            setStatusMessage('Using local cache only after today\'s single refresh attempt.');
        } finally {
            setLoading(false);
        }
    }, [hydrateAllOfficeCoordinates]);

    useEffect(() => {
        const cached = getWaitTimesCache();
        setWaitTimeRows(cached.rows);
        setAsOfDate(cached.asOfDate);
        setFetchedAt(cached.fetchedAt);
        setOfficeCoordsMap(getStoredOfficeCoordsMap());

        const storedOrigin = getStoredOrigin();
        setOrigin(storedOrigin);
        setAddressInput(storedOrigin.label || DEFAULT_ORIGIN.label);

        void hydrateAllOfficeCoordinates(cached.rows);

        refreshIfEligible();
    }, [hydrateAllOfficeCoordinates, refreshIfEligible]);

    const handleUseCurrentLocation = useCallback(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setError('Geolocation is not available in this browser.');
            return;
        }

        setLocationLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const resolvedOrigin = await reverseGeocodeOrigin(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    updateOrigin(resolvedOrigin);
                } catch (err) {
                    updateOrigin({
                        label: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        source: 'gps'
                    });
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 60 * 60 * 1000
            }
        );
    }, [updateOrigin]);

    useEffect(() => {
        handleUseCurrentLocation();
    }, [handleUseCurrentLocation]);

    const handleSetAddress = async () => {
        if (!addressInput.trim()) {
            setError('Please enter an address or city.');
            return;
        }

        setLocationLoading(true);
        setError('');

        try {
            const geocodedOrigin = await geocodeOriginAddress(addressInput.trim());
            updateOrigin({
                ...geocodedOrigin,
                label: addressInput.trim(),
                source: 'address'
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLocationLoading(false);
        }
    };

    const handleShowAllLocations = () => {
        setFilters(DEFAULT_FILTERS);
        setError('');
        setStatusMessage(`Showing all cached locations (${waitTimeRows.length} rows).`);
    };

    const rowsWithDistance = useMemo(() => {
        return waitTimeRows.map((row) => {
            const officeCoords = officeCoordsMap[row.officeName];
            const distanceMiles = officeCoords ? calculateDistanceMiles(origin, officeCoords) : null;
            return {
                ...row,
                distanceMiles
            };
        });
    }, [waitTimeRows, officeCoordsMap, origin]);

    const displayedRows = useMemo(() => {
        const maxAvailabilityDays = Number.parseFloat(filters.maxAvailabilityDays);
        const filteredRows = filterWaitTimeRows(rowsWithDistance, filters).filter((row) => {
            if (!Number.isFinite(maxAvailabilityDays)) {
                return true;
            }
            return Number.isFinite(row.availabilityDays) && row.availabilityDays <= maxAvailabilityDays;
        });

        return [...filteredRows].sort((left, right) => {
            const leftDistance = Number.isFinite(left.distanceMiles) ? left.distanceMiles : Number.POSITIVE_INFINITY;
            const rightDistance = Number.isFinite(right.distanceMiles) ? right.distanceMiles : Number.POSITIVE_INFINITY;
            const leftAvailability = Number.isFinite(left.availabilityDays) ? left.availabilityDays : Number.POSITIVE_INFINITY;
            const rightAvailability = Number.isFinite(right.availabilityDays) ? right.availabilityDays : Number.POSITIVE_INFINITY;
            const leftWait = Number.isFinite(left.waitMinutes) ? left.waitMinutes : Number.POSITIVE_INFINITY;
            const rightWait = Number.isFinite(right.waitMinutes) ? right.waitMinutes : Number.POSITIVE_INFINITY;

            if (filters.sortBy === 'appointment') {
                if (leftAvailability !== rightAvailability) {
                    return leftAvailability - rightAvailability;
                }
                if (leftDistance !== rightDistance) {
                    return leftDistance - rightDistance;
                }
                return leftWait - rightWait;
            }

            if (filters.sortBy === 'wait') {
                if (leftWait !== rightWait) {
                    return leftWait - rightWait;
                }
                if (leftAvailability !== rightAvailability) {
                    return leftAvailability - rightAvailability;
                }
                return leftDistance - rightDistance;
            }

            if (leftDistance !== rightDistance) {
                return leftDistance - rightDistance;
            }
            if (leftAvailability !== rightAvailability) {
                return leftAvailability - rightAvailability;
            }
            return leftWait - rightWait;
        });
    }, [rowsWithDistance, filters]);

    const nearestResult = displayedRows.find((row) => Number.isFinite(row.distanceMiles));

    return (
        <div>
            <div className="container pb-5">
                <BackLink />
                <h1 className="mt-3">Texas DPS Wait Times Finder</h1>
                <p className="text-muted">
                    Local-cache search for Texas driver license office wait times and appointment availability.
                </p>

                <div className="alert alert-secondary mt-3" role="alert">
                    <strong>Daily fetch rule:</strong> this page will not request DPS data more than once per day. The last retrieval date is saved in local storage, and if today was already checked, no additional fetch is made.
                </div>

                <div className="row g-3 mt-1">
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Data Status</h5>
                                <p className="mb-2"><strong>As of:</strong> {asOfDate || 'No cache yet'}</p>
                                <p className="mb-2"><strong>Last cached:</strong> {fetchedAt ? new Date(fetchedAt).toLocaleString() : 'Not cached yet'}</p>
                                <p className="mb-2"><strong>Cached locations:</strong> {waitTimeRows.length}</p>
                                <p className="mb-0 text-muted">{statusMessage}</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Origin</h5>
                                <p className="mb-2"><strong>Using:</strong> {origin.label}</p>
                                <p className="mb-2"><strong>Coordinates:</strong> {Number(origin.lat).toFixed(3)}, {Number(origin.lng).toFixed(3)}</p>
                                <p className="mb-0 text-muted">If location permission is denied, the search defaults to Downtown Austin.</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Quick Summary</h5>
                                <p className="mb-2"><strong>Matches:</strong> {displayedRows.length}</p>
                                <p className="mb-0"><strong>Nearest:</strong> {nearestResult ? `${nearestResult.officeName} (${formatDistanceText(nearestResult.distanceMiles)})` : 'Set a distance filter to calculate nearby offices'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row gx-4 mt-4">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Set your location</h5>
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-8">
                                        <label htmlFor="originInput" className="form-label">Address or city</label>
                                        <input
                                            id="originInput"
                                            type="text"
                                            className="form-control"
                                            value={addressInput}
                                            onChange={(event) => setAddressInput(event.target.value)}
                                            placeholder="Downtown Austin, TX"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-100"
                                            onClick={handleSetAddress}
                                            disabled={locationLoading}
                                        >
                                            {locationLoading ? 'Updating...' : 'Use This Address'}
                                        </button>
                                    </div>
                                </div>
                                <div className="row g-2 mt-2">
                                    <div className="col-md-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary w-100"
                                            onClick={handleUseCurrentLocation}
                                            disabled={locationLoading}
                                        >
                                            {locationLoading ? 'Locating...' : 'Use My Location'}
                                        </button>
                                    </div>
                                    <div className="col-md-8">
                                        <a href={DPS_WAIT_TIMES_URL} target="_blank" rel="noreferrer" className="btn btn-link ps-0">
                                            View the official DPS page
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 d-flex align-items-stretch">
                        <div className="w-100">
                            <ActionButton
                                onClick={refreshIfEligible}
                                text={loading ? 'Checking DPS...' : 'Refresh If Eligible'}
                            />
                        </div>
                    </div>
                </div>

                <div className="card mt-4">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <h5 className="card-title mb-0">Filters</h5>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleShowAllLocations}
                            >
                                Show All Locations
                            </button>
                        </div>
                        <div className="row g-3">
                            <div className="col-md-2">
                                <label htmlFor="citySearch" className="form-label">DL office / city</label>
                                <input
                                    id="citySearch"
                                    type="text"
                                    className="form-control"
                                    value={filters.searchText}
                                    onChange={(event) => setFilters({ ...filters, searchText: event.target.value })}
                                    placeholder="Austin, Georgetown..."
                                />
                            </div>
                            <div className="col-md-2">
                                <label htmlFor="distanceMiles" className="form-label">Max distance (miles)</label>
                                <input
                                    id="distanceMiles"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={filters.maxDistance}
                                    onChange={(event) => setFilters({ ...filters, maxDistance: event.target.value })}
                                    placeholder="All"
                                />
                            </div>
                            <div className="col-md-2">
                                <label htmlFor="waitMinutes" className="form-label">Max wait time (minutes)</label>
                                <input
                                    id="waitMinutes"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={filters.maxWaitMinutes}
                                    onChange={(event) => setFilters({ ...filters, maxWaitMinutes: event.target.value })}
                                    placeholder="All"
                                />
                            </div>
                            <div className="col-md-2">
                                <label htmlFor="availabilityDays" className="form-label">Max appt days</label>
                                <input
                                    id="availabilityDays"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={filters.maxAvailabilityDays}
                                    onChange={(event) => setFilters({ ...filters, maxAvailabilityDays: event.target.value })}
                                    placeholder="All"
                                />
                            </div>
                            <div className="col-md-2">
                                <label htmlFor="licenseType" className="form-label">License type</label>
                                <select
                                    id="licenseType"
                                    className="form-select"
                                    value={filters.licenseType}
                                    onChange={(event) => setFilters({ ...filters, licenseType: event.target.value })}
                                >
                                    {LICENSE_TYPE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label htmlFor="sortBy" className="form-label">Sort by</label>
                                <select
                                    id="sortBy"
                                    className="form-select"
                                    value={filters.sortBy}
                                    onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })}
                                >
                                    <option value="distance">Nearest first</option>
                                    <option value="appointment">Soonest appointment</option>
                                    <option value="wait">Shortest wait time</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger mt-3" role="alert">
                        {error}
                    </div>
                )}

                <div className="row mt-4">
                    <div className="col-12">
                        <h2>Matching Offices</h2>
                        {displayedRows.length === 0 ? (
                            <div className="alert alert-info" role="alert">
                                No offices match the current filters. Try widening the distance or wait-time limits.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th scope="col">DL Office</th>
                                            <th scope="col">License Type</th>
                                            <th scope="col">Service</th>
                                            <th scope="col">Availability</th>
                                            <th scope="col">In-Office Wait</th>
                                            <th scope="col">Distance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedRows.map((row, index) => (
                                            <tr key={`${row.officeName}-${row.serviceName}-${index}`}>
                                                <td>{row.officeName}</td>
                                                <td>{row.licenseType}</td>
                                                <td>{row.serviceName}</td>
                                                <td>{formatAvailabilityText(row.availabilityDays)}</td>
                                                <td>{formatWaitTimeText(row.waitMinutes)}</td>
                                                <td>{formatDistanceText(row.distanceMiles)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DpsWaitTimes;