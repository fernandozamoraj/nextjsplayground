export const DPS_WAIT_TIMES_URL = 'https://www.dps.texas.gov/apps/Viewer/Document/Vue/WAITTIMES';

const WAIT_TIMES_CACHE_KEY = 'txDpsWaitTimesCache';
const WAIT_TIMES_LAST_ATTEMPT_KEY = 'txDpsWaitTimesLastAttemptDate';
const STORED_ORIGIN_KEY = 'txDpsWaitTimesOrigin';
const OFFICE_COORDS_KEY = 'txDpsWaitTimesOfficeCoords';

export const LICENSE_TYPE_OPTIONS = [
    'All license types',
    'CDL Drive Test',
    'CDL Renewal',
    'Non CDL Drive Test',
    'Original',
    'Renewal/Replacement'
];

export const DEFAULT_ORIGIN = {
    label: 'Downtown Austin, TX',
    lat: 30.2672,
    lng: -97.7431,
    source: 'default'
};

const pendingGeocodeRequests = {};

const safeParseJson = (value, fallbackValue) => {
    try {
        return value ? JSON.parse(value) : fallbackValue;
    } catch (error) {
        return fallbackValue;
    }
};

export const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isWeekday = (date = new Date()) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
};

export const getLastFetchAttemptDate = () => {
    if (typeof window === 'undefined') {
        return '';
    }
    return window.localStorage.getItem(WAIT_TIMES_LAST_ATTEMPT_KEY) || '';
};

export const markWaitTimesFetchAttempt = () => {
    if (typeof window === 'undefined') {
        return '';
    }
    const today = getLocalDateString();
    window.localStorage.setItem(WAIT_TIMES_LAST_ATTEMPT_KEY, today);
    return today;
};

export const shouldFetchWaitTimesToday = () => {
    if (!isWeekday()) {
        return {
            shouldFetch: false,
            reason: 'Weekend detected — using cached DPS data only.'
        };
    }

    const today = getLocalDateString();
    const lastAttemptDate = getLastFetchAttemptDate();

    if (lastAttemptDate === today) {
        return {
            shouldFetch: false,
            reason: 'This page already retrieved DPS data today — no additional fetch will be made.'
        };
    }

    return {
        shouldFetch: true,
        reason: 'Eligible for the once-per-weekday DPS refresh.'
    };
};

export const getWaitTimesCache = () => {
    if (typeof window === 'undefined') {
        return {
            rows: [],
            asOfDate: '',
            fetchedAt: '',
            lastAttemptDate: ''
        };
    }

    const payload = safeParseJson(window.localStorage.getItem(WAIT_TIMES_CACHE_KEY), {});
    return {
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        asOfDate: typeof payload.asOfDate === 'string' ? payload.asOfDate : '',
        fetchedAt: typeof payload.fetchedAt === 'string' ? payload.fetchedAt : '',
        lastAttemptDate: getLastFetchAttemptDate()
    };
};

export const saveWaitTimesCache = (payload) => {
    if (typeof window === 'undefined') {
        return payload;
    }

    const normalizedPayload = {
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        asOfDate: payload.asOfDate || '',
        fetchedAt: payload.fetchedAt || new Date().toISOString(),
        lastAttemptDate: payload.lastAttemptDate || getLastFetchAttemptDate()
    };

    window.localStorage.setItem(WAIT_TIMES_CACHE_KEY, JSON.stringify(normalizedPayload));

    if (normalizedPayload.lastAttemptDate) {
        window.localStorage.setItem(WAIT_TIMES_LAST_ATTEMPT_KEY, normalizedPayload.lastAttemptDate);
    }

    return normalizedPayload;
};

const parseComparableDate = (value) => {
    if (!value) {
        return null;
    }

    const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        const [, month, day, year] = match;
        return new Date(`${year}-${month}-${day}T00:00:00`).getTime();
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

export const isIncomingAsOfNewer = (incomingAsOfDate, currentAsOfDate) => {
    if (!incomingAsOfDate) {
        return false;
    }

    if (!currentAsOfDate) {
        return true;
    }

    const incomingTime = parseComparableDate(incomingAsOfDate);
    const currentTime = parseComparableDate(currentAsOfDate);

    if (incomingTime === null || currentTime === null) {
        return incomingAsOfDate !== currentAsOfDate;
    }

    return incomingTime > currentTime;
};

export const getStoredOrigin = () => {
    if (typeof window === 'undefined') {
        return DEFAULT_ORIGIN;
    }

    const storedOrigin = safeParseJson(window.localStorage.getItem(STORED_ORIGIN_KEY), DEFAULT_ORIGIN);
    if (
        storedOrigin &&
        Number.isFinite(Number(storedOrigin.lat)) &&
        Number.isFinite(Number(storedOrigin.lng))
    ) {
        return {
            label: storedOrigin.label || DEFAULT_ORIGIN.label,
            lat: Number(storedOrigin.lat),
            lng: Number(storedOrigin.lng),
            source: storedOrigin.source || 'stored'
        };
    }

    return DEFAULT_ORIGIN;
};

export const saveStoredOrigin = (origin) => {
    if (typeof window === 'undefined') {
        return origin;
    }

    const normalizedOrigin = {
        label: origin.label || DEFAULT_ORIGIN.label,
        lat: Number(origin.lat),
        lng: Number(origin.lng),
        source: origin.source || 'custom'
    };

    window.localStorage.setItem(STORED_ORIGIN_KEY, JSON.stringify(normalizedOrigin));
    return normalizedOrigin;
};

export const getStoredOfficeCoordsMap = () => {
    if (typeof window === 'undefined') {
        return {};
    }

    const storedMap = safeParseJson(window.localStorage.getItem(OFFICE_COORDS_KEY), {});
    return storedMap && typeof storedMap === 'object' ? storedMap : {};
};

const saveStoredOfficeCoordsMap = (map) => {
    if (typeof window === 'undefined') {
        return map;
    }

    window.localStorage.setItem(OFFICE_COORDS_KEY, JSON.stringify(map));
    return map;
};

const getReadableLocationLabel = (address = {}, fallbackLabel = '') => {
    const city = address.city || address.town || address.village || address.hamlet || address.county || '';
    const state = address.state_code || address.state || '';
    const zipCode = address.postcode || '';
    const cityAndState = [city, state].filter(Boolean).join(', ');

    if (cityAndState && zipCode) {
        return `${cityAndState} ${zipCode}`;
    }

    return cityAndState || zipCode || fallbackLabel;
};

const geocodeLocation = async (query) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`, {
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Unable to geocode that location right now.');
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
        throw new Error('No matching location was found.');
    }

    return {
        label: getReadableLocationLabel(results[0].address, results[0].display_name || query),
        lat: Number(results[0].lat),
        lng: Number(results[0].lon),
        source: 'geocoded'
    };
};

export const geocodeOriginAddress = async (address) => {
    return geocodeLocation(address);
};

export const reverseGeocodeOrigin = async (lat, lng) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, {
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Unable to identify your current area right now.');
    }

    const result = await response.json();
    const label = getReadableLocationLabel(result.address, result.display_name || 'My current location');

    return {
        label,
        lat: Number(lat),
        lng: Number(lng),
        source: 'gps'
    };
};

const extractTownFromOfficeName = (officeName = '') => {
    const normalized = String(officeName)
        .replace(/\bMega Center\b/gi, '')
        .replace(/\bCOMMERCIAL LICENSE ONLY\b/gi, '')
        .replace(/\bMUST HAVE ACCESS TO MILITARY BASE\b/gi, '')
        .replace(/\bGateway\b/gi, '')
        .replace(/\bHondo Pass\b/gi, '')
        .replace(/\bScott Simpson\b/gi, '')
        .replace(/\bGen McMullen\b/gi, '')
        .replace(/\bPat Booker\b/gi, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const directionalPrefixes = ['Northwest', 'Northeast', 'Southwest', 'Southeast', 'North', 'South', 'East', 'West'];
    for (const prefix of directionalPrefixes) {
        if (normalized.endsWith(` ${prefix}`)) {
            return normalized.slice(0, -(` ${prefix}`).length).trim();
        }
    }

    return normalized;
};

export const resolveOfficeCoordinates = async (officeName) => {
    if (!officeName) {
        return null;
    }

    const cachedMap = getStoredOfficeCoordsMap();
    if (Object.prototype.hasOwnProperty.call(cachedMap, officeName)) {
        return cachedMap[officeName];
    }

    if (pendingGeocodeRequests[officeName]) {
        return pendingGeocodeRequests[officeName];
    }

    const townName = extractTownFromOfficeName(officeName) || officeName;
    const searchQueries = [
        `${townName}, TX`,
        `${officeName}, TX`
    ];

    pendingGeocodeRequests[officeName] = (async () => {
        try {
            for (const query of searchQueries) {
                try {
                    const coords = await geocodeLocation(query);
                    const updatedMap = {
                        ...getStoredOfficeCoordsMap(),
                        [officeName]: coords
                    };
                    saveStoredOfficeCoordsMap(updatedMap);
                    return coords;
                } catch (error) {
                    // Try the next TX-based search variation.
                }
            }

            const unresolvedValue = null;
            const updatedMap = {
                ...getStoredOfficeCoordsMap(),
                [officeName]: unresolvedValue
            };
            saveStoredOfficeCoordsMap(updatedMap);
            return unresolvedValue;
        } finally {
            delete pendingGeocodeRequests[officeName];
        }
    })();

    return pendingGeocodeRequests[officeName];
};

const toRadians = (value) => (value * Math.PI) / 180;

export const calculateDistanceMiles = (origin, destination) => {
    if (!origin || !destination) {
        return null;
    }

    const originLat = Number(origin.lat);
    const originLng = Number(origin.lng);
    const destinationLat = Number(destination.lat);
    const destinationLng = Number(destination.lng);

    if (
        !Number.isFinite(originLat) ||
        !Number.isFinite(originLng) ||
        !Number.isFinite(destinationLat) ||
        !Number.isFinite(destinationLng)
    ) {
        return null;
    }

    const earthRadiusMiles = 3958.8;
    const deltaLat = toRadians(destinationLat - originLat);
    const deltaLng = toRadians(destinationLng - originLng);
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(originLat)) * Math.cos(toRadians(destinationLat)) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
};

export const formatAvailabilityText = (days) => {
    if (!Number.isFinite(days)) {
        return 'N/A';
    }
    return `${days} day${days === 1 ? '' : 's'}`;
};

export const formatWaitTimeText = (minutes) => {
    if (!Number.isFinite(minutes)) {
        return 'N/A';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
    }

    return `${remainingMinutes} min`;
};

export const formatDistanceText = (distanceMiles) => {
    if (!Number.isFinite(distanceMiles)) {
        return 'N/A';
    }
    return `${distanceMiles.toFixed(1)} mi`;
};

export const filterWaitTimeRows = (rows, filters) => {
    const normalizedSearch = (filters.searchText || '').trim().toLowerCase();
    const maxWaitMinutes = Number.parseFloat(filters.maxWaitMinutes);
    const maxDistance = Number.parseFloat(filters.maxDistance);

    return rows.filter((row) => {
        if (filters.licenseType && filters.licenseType !== 'All license types' && row.licenseType !== filters.licenseType) {
            return false;
        }

        if (normalizedSearch) {
            const haystack = `${row.officeName} ${row.serviceName}`.toLowerCase();
            if (!haystack.includes(normalizedSearch)) {
                return false;
            }
        }

        if (Number.isFinite(maxWaitMinutes)) {
            if (!Number.isFinite(row.waitMinutes) || row.waitMinutes > maxWaitMinutes) {
                return false;
            }
        }

        if (Number.isFinite(maxDistance)) {
            if (!Number.isFinite(row.distanceMiles) || row.distanceMiles > maxDistance) {
                return false;
            }
        }

        return true;
    });
};