
// API Base URL
const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

// =============================================================================
// 1) URL PARSING
// =============================================================================

/**
 * Parse the URL 'id' query parameter
 * @returns {string|null} The UUID from the id parameter or null if not found
 */
function parseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id || null;
}

// =============================================================================
// 2) API CALLS
// =============================================================================

/**
 * Fetch the iCal endpoint URL using the UUID
 * @param {string} uuid - The UUID from the URL parameter
 * @returns {Promise<string>} The calendar sync endpoint URL
 */
async function fetchICalEndpoint(uuid) {
    try {
        const response = await fetch(`${API_BASE}/ical_endpointRequest?uuid=${uuid}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch iCal endpoint: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.calendar_sync_endpoint) {
            throw new Error('No calendar_sync_endpoint in response');
        }

        return data.calendar_sync_endpoint;
    } catch (error) {
        console.error('Error fetching iCal endpoint:', error);
        throw error;
    }
}

/**
 * Fetch the iCal file from the calendar sync endpoint
 * @param {string} calendarUrl - The calendar sync endpoint URL
 * @returns {Promise<string>} The iCal file content
 */
async function fetchICalFile(calendarUrl) {
    try {
        const response = await fetch(calendarUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch iCal file: ${response.status} ${response.statusText}`);
        }

        const icalContent = await response.text();
        return icalContent;
    } catch (error) {
        console.error('Error fetching iCal file:', error);
        throw error;
    }
}

// =============================================================================
// 3) AUTO DOWNLOAD
// =============================================================================

/**
 * Automatically download the iCal file
 * @param {string} icalContent - The iCal file content
 * @param {string} uuid - The UUID for filename
 */
function autoDownloadICalFile(icalContent, uuid) {
    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-${uuid}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================================================================
// 4) INITIALIZATION
// =============================================================================

/**
 * Initialize the iCal page - fetch and auto-download calendar
 */
async function initICalPage() {
    // Get the UUID from URL
    const uuid = parseIdFromURL();

    if (!uuid) {
        console.error('No ID found in URL. Please provide an "id" parameter.');
        return;
    }

    try {
        // Step 1: Fetch the iCal endpoint URL using the UUID
        const calendarUrl = await fetchICalEndpoint(uuid);

        // Step 2: Fetch the iCal file from the returned URL
        const icalContent = await fetchICalFile(calendarUrl);

        // Step 3: Auto-download the calendar file
        autoDownloadICalFile(icalContent, uuid);

    } catch (error) {
        console.error(`Failed to load calendar: ${error.message}`);
    }
}

// =============================================================================
// 5) PAGE LOAD
// =============================================================================

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initICalPage);
} else {
    initICalPage();
}

