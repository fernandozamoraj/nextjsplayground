const DPS_WAIT_TIMES_URL = 'https://www.dps.texas.gov/apps/Viewer/Document/Vue/WAITTIMES';

const LICENSE_TYPES = [
    'Non CDL Drive Test',
    'Renewal/Replacement',
    'CDL Drive Test',
    'CDL Renewal',
    'Original'
];

const decodeHtmlEntities = (value = '') => {
    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');
};

const cleanText = (value = '') => {
    return decodeHtmlEntities(value)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const parseAvailabilityDays = (value = '') => {
    const availabilityText = String(value).trim();
    const labeledMatch = availabilityText.match(/Availability in\s+(\d+)\s+day/i);
    if (labeledMatch) {
        return Number.parseInt(labeledMatch[1], 10);
    }

    if (/^\d+$/.test(availabilityText)) {
        return Number.parseInt(availabilityText, 10);
    }

    return null;
};

const parseWaitMinutes = (value = '') => {
    const waitText = String(value).trim();
    const clockMatch = waitText.match(/^(\d{1,2}):(\d{2})$/);
    if (clockMatch) {
        return Number.parseInt(clockMatch[1], 10) * 60 + Number.parseInt(clockMatch[2], 10);
    }

    const hoursMatch = waitText.match(/(\d+)\s*hours?/i);
    const minutesMatch = waitText.match(/(\d+)\s*minutes?/i);

    if (!hoursMatch && !minutesMatch) {
        return null;
    }

    const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0;
    return hours * 60 + minutes;
};

const parseLicenseType = (serviceName = '') => {
    const normalizedService = serviceName.trim();
    return LICENSE_TYPES.find((type) => normalizedService.endsWith(type) || normalizedService.includes(type)) || 'Unknown';
};

const getAttributeValue = (attributes = '', attributeName) => {
    const match = attributes.match(new RegExp(`${attributeName}\\s*=\\s*['\"]([^'\"]*)['\"]`, 'i'));
    return match ? cleanText(match[1]) : '';
};

const parseRowsFromTable = (html) => {
    const parsedRows = [];
    const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    let currentOfficeName = '';

    for (const rowHtml of rowMatches) {
        const cells = Array.from(rowHtml.matchAll(/<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi)).map((match) => ({
            tag: match[1].toLowerCase(),
            text: cleanText(match[3]),
            title: getAttributeValue(match[2], 'title') || getAttributeValue(match[2], 'aria-label') || cleanText(match[3])
        }));

        if (cells.length === 0) {
            continue;
        }

        if (cells.some((cell) => /Appointment Type|Estimated Appointment|Average In Office Wait/i.test(cell.text))) {
            continue;
        }

        let officeName = currentOfficeName;
        let serviceCell;
        let availabilityCell;
        let waitCell;

        if (cells[0].tag === 'th' && cells.length >= 4) {
            officeName = cells[0].text;
            currentOfficeName = officeName;
            serviceCell = cells[1];
            availabilityCell = cells[2];
            waitCell = cells[3];
        } else if (cells.length >= 3 && currentOfficeName) {
            serviceCell = cells[0];
            availabilityCell = cells[1];
            waitCell = cells[2];
        } else {
            continue;
        }

        const serviceName = (serviceCell && serviceCell.text) || '';
        const availabilityText = (availabilityCell && (availabilityCell.title || availabilityCell.text)) || '';
        const waitText = (waitCell && (waitCell.title || waitCell.text)) || '';

        if (!officeName || !serviceName) {
            continue;
        }

        parsedRows.push({
            officeName,
            serviceName,
            licenseType: parseLicenseType(serviceName),
            availabilityDays: parseAvailabilityDays(availabilityCell ? availabilityCell.text || availabilityText : availabilityText),
            waitMinutes: parseWaitMinutes(waitCell ? waitCell.text || waitText : waitText),
            availabilityText,
            waitText
        });
    }

    return parsedRows;
};

const parseRowsFromPlainText = (html) => {
    const text = cleanText(html);
    const rows = [];
    const pattern = /([A-Za-z0-9()/'&.,\-\s]+?)\s+([A-Za-z0-9()/'&.,\-\s]+?(?:CDL Drive Test|CDL Renewal|Non CDL Drive Test|Original|Renewal\/Replacement))\s+Availability in\s+(\d+)\s+days?\s+Average in office wait\s+((?:\d+\s+hours?\s+)?\d+\s+minutes?)/gi;

    let match = pattern.exec(text);
    while (match) {
        const officeName = match[1].replace(/\s+/g, ' ').trim();
        const serviceName = match[2].replace(/\s+/g, ' ').trim();
        const availabilityText = `Availability in ${match[3]} days`;
        const waitText = `Average in office wait ${match[4]}`;

        rows.push({
            officeName,
            serviceName,
            licenseType: parseLicenseType(serviceName),
            availabilityDays: Number.parseInt(match[3], 10),
            waitMinutes: parseWaitMinutes(waitText),
            availabilityText,
            waitText
        });

        match = pattern.exec(text);
    }

    return rows;
};

const parseWaitTimesDocument = (html) => {
    const asOfMatch = html.match(/as of\s*(\d{2}\/\d{2}\/\d{4})/i);
    const asOfDate = asOfMatch ? asOfMatch[1] : '';

    const tableRows = parseRowsFromTable(html);
    const fallbackRows = tableRows.length > 0 ? tableRows : parseRowsFromPlainText(html);
    const dedupedMap = new Map();

    for (const row of fallbackRows) {
        if (!row.officeName || !row.serviceName) {
            continue;
        }
        const rowKey = `${row.officeName}__${row.serviceName}`;
        if (!dedupedMap.has(rowKey)) {
            dedupedMap.set(rowKey, row);
        }
    }

    const rows = Array.from(dedupedMap.values()).sort((left, right) => {
        if (left.officeName !== right.officeName) {
            return left.officeName.localeCompare(right.officeName);
        }
        return left.serviceName.localeCompare(right.serviceName);
    });

    return {
        asOfDate,
        rows
    };
};

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch(DPS_WAIT_TIMES_URL, {
            headers: {
                Accept: 'text/html,application/xhtml+xml'
            }
        });

        if (!response.ok) {
            return res.status(502).json({ error: 'Unable to retrieve Texas DPS wait times.' });
        }

        const html = await response.text();
        const parsed = parseWaitTimesDocument(html);

        if (!parsed.asOfDate || parsed.rows.length === 0) {
            return res.status(500).json({ error: 'Unable to parse Texas DPS wait time data.' });
        }

        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
            sourceUrl: DPS_WAIT_TIMES_URL,
            asOfDate: parsed.asOfDate,
            fetchedAt: new Date().toISOString(),
            rows: parsed.rows
        });
    } catch (error) {
        console.error('DPS wait times API error:', error);
        return res.status(500).json({ error: 'Failed to fetch Texas DPS wait times.' });
    }
}