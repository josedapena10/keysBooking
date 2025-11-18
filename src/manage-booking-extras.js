
// API Base URL
const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

// =============================================================================
// 1) URL PARSING
// =============================================================================

/**
 * Parse the URL 'id' query parameter
 * @returns {Object|null} { type: 'boat'|'charter', reservationCode, paymentIntentId, charterId?, tripId? } or null if invalid
 */
function parseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id || id.length < 2) return null;

    const firstChar = id.charAt(0).toUpperCase();
    const rest = id.substring(1);

    if (firstChar === 'B') {
        // Boat: B<reservationCode>-<paymentIntentId>
        const parts = rest.split('-');
        if (parts.length !== 2) return null;

        const reservationCode = parts[0];
        const paymentIntentId = parts[1];

        if (!reservationCode || !paymentIntentId) return null;

        return {
            type: 'boat',
            reservationCode,
            paymentIntentId
        };
    } else if (firstChar === 'C') {
        // Charter: C<reservationCode>-<paymentIntentId>-<charterId>-<tripId>-<firstDate>
        const parts = rest.split('-');

        console.log('[PARSE URL] Charter URL parts:', parts);
        console.log('[PARSE URL] Parts length:', parts.length);

        // Support both old format (4 parts) and new format (7 parts with date YYYY-MM-DD)
        // New format: parts[0-3] are the same, parts[4-6] are the date (YYYY-MM-DD becomes 3 parts when split by -)
        let reservationCode, paymentIntentId, charterId, tripId, firstDate;

        if (parts.length === 7) {
            // New format with date: C<code>-<piId>-<charterId>-<tripId>-YYYY-MM-DD
            [reservationCode, paymentIntentId, charterId, tripId] = parts.slice(0, 4);
            firstDate = `${parts[4]}-${parts[5]}-${parts[6]}`;
            console.log('[PARSE URL] New format - firstDate:', firstDate);
        } else if (parts.length === 4) {
            // Old format without date (for backward compatibility)
            [reservationCode, paymentIntentId, charterId, tripId] = parts;
            firstDate = null;
            console.log('[PARSE URL] Old format - no firstDate');
        } else {
            console.log('[PARSE URL] ERROR: Invalid parts length');
            return null;
        }

        if (!reservationCode || !paymentIntentId || !charterId || !tripId) {
            console.log('[PARSE URL] ERROR: Missing required parameters');
            return null;
        }

        console.log('[PARSE URL] Parsed charter data:', {
            reservationCode,
            paymentIntentId,
            charterId,
            tripId,
            firstDate
        });

        return {
            type: 'charter',
            reservationCode,
            paymentIntentId,
            charterId,
            tripId,
            firstDate
        };
    }

    return null;
}

// =============================================================================
// 2) HELPER UTILITIES
// =============================================================================

// ---------- DOM Helpers ----------
function showFlex(id) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.style.display = 'flex';
}

function hide(id) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.style.display = 'none';
}

// Loader timing management
let loaderStartTime = null;
const MIN_LOADER_DISPLAY_TIME = 2000; // 2 seconds minimum

function createLoader() {
    // Check if loader already exists
    let loader = document.querySelector('[data-element="manageBooking_loader"]');
    if (loader) return loader;

    // Find the bodyContainer
    const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
    if (!bodyContainer) {
        // Fallback to full screen if bodyContainer not found
        return createFullScreenLoader();
    }

    // Create loader element
    loader = document.createElement('div');
    loader.setAttribute('data-element', 'manageBooking_loader');

    // Ensure bodyContainer has relative positioning
    Object.assign(bodyContainer.style, {
        position: 'relative'
    });

    // Style the loader to be contained within bodyContainer
    Object.assign(loader.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        paddingTop: '100px',
        height: '100%',
        backgroundColor: 'rgb(255, 255, 255)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'top',
        zIndex: '10',
        gap: '20px'
    });

    // Create spinner
    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    });

    // Create loading text
    const text = document.createElement('div');
    text.setAttribute('data-loader-text', 'true');
    text.textContent = 'Loading booking details...';
    Object.assign(text.style, {
        fontSize: '16px',
        color: '#333',
        fontFamily: 'TT Fors',
        fontWeight: '500'
    });

    // Add CSS animation for spinner
    if (!document.getElementById('loader-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'loader-animation-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Append elements
    loader.appendChild(spinner);
    loader.appendChild(text);

    // Append to bodyContainer instead of document.body
    bodyContainer.appendChild(loader);

    return loader;
}

function createFullScreenLoader() {
    // Fallback function for when bodyContainer is not found
    const loader = document.createElement('div');
    loader.setAttribute('data-element', 'manageBooking_loader');

    Object.assign(loader.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        gap: '20px'
    });

    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    });

    const text = document.createElement('div');
    text.setAttribute('data-loader-text', 'true');
    text.textContent = 'Loading booking details...';
    Object.assign(text.style, {
        fontSize: '16px',
        color: '#333',
        fontFamily: 'TT Fors',
        fontWeight: '500'
    });

    loader.appendChild(spinner);
    loader.appendChild(text);
    document.body.appendChild(loader);

    return loader;
}

function showLoader(message = 'Loading booking details...') {
    // Hide all content within bodyContainer
    hideAllContentInBodyContainer();

    const loader = createLoader();
    loader.style.display = 'flex';

    // Update loader text
    const textElement = loader.querySelector('[data-loader-text]');
    if (textElement) {
        textElement.textContent = message;
    }

    loaderStartTime = Date.now();
}

async function hideLoader() {
    if (!loaderStartTime) {
        const loader = document.querySelector('[data-element="manageBooking_loader"]');
        if (loader) loader.style.display = 'none';
        return;
    }

    const elapsedTime = Date.now() - loaderStartTime;
    const remainingTime = MIN_LOADER_DISPLAY_TIME - elapsedTime;

    if (remainingTime > 0) {
        // Wait for the remaining time to ensure minimum display duration
        await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    const loader = document.querySelector('[data-element="manageBooking_loader"]');
    if (loader) {
        loader.style.display = 'none';
    }

    loaderStartTime = null;
}

function setText(id, str) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.textContent = str;
}

function setHTML(id, html) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.innerHTML = html;
}

function setImg(id, url) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.src = url;
}

function setDotColor(id, hex) {
    const el = document.querySelector(`[data-element="${id}"]`);
    if (el) el.style.backgroundColor = hex;
}

function smoothScrollTo(el) {
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ---------- Formatting Helpers ----------
function formatMoney(n) {
    if (!n && n !== 0) return '$0.00';
    // Always show 2 decimal places
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPhone(e164) {
    if (!e164) return '';
    // Remove non-digits
    const digits = e164.replace(/\D/g, '');
    // Assume 10 digits: (xxx) xxx-xxxx
    if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        // +1 prefix
        return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
    return e164;
}

function formatTime24To12(h) {
    if (h === undefined || h === null) return '';
    const n = Number(h);
    if (isNaN(n)) return '';

    let hour = Math.floor(n);
    let minutes = Math.round((n - hour) * 60);

    // Handle rounding up minutes to next hour
    if (minutes >= 60) {
        hour += 1;
        minutes = 0;
    }

    const ampm = hour < 12 ? 'AM' : 'PM';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
}

// ---------- UTC Date Helpers ----------
function ymd(d) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

function parseYMD(ymdStr) {
    // ymdStr: 'YYYY-MM-DD' → Date at 00:00:00 UTC
    return new Date(ymdStr + 'T00:00:00Z');
}

function todayUTC() {
    return ymd(new Date());
}

function formatRangeFromDatesArray(dates) {
    // dates are 'YYYY-MM-DD' strings (UTC)
    if (!dates || !dates.length) return '';
    const sorted = [...dates].sort();
    const first = parseYMD(sorted[0]);
    const last = parseYMD(sorted[sorted.length - 1]);
    return formatRangeYMD(ymd(first), ymd(last));
}

function formatRangeYMD(startYMD, endYMD, includeYear = false) {
    // Returns "Jan 5" or "Jan 5 - 12" or "Jan 27 - Feb 3" or with year "Jan 5, 2025" or "Jan 5 - 12, 2025" or "Jan 27, 2024 - Feb 3, 2025"
    const [sY, sM, sD] = startYMD.split('-').map(Number);
    const [eY, eM, eD] = endYMD.split('-').map(Number);
    const s = new Date(Date.UTC(sY, sM - 1, sD));
    const e = new Date(Date.UTC(eY, eM - 1, eD));
    const sm = s.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const em = e.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const sd = s.getUTCDate();
    const ed = e.getUTCDate();

    if (includeYear) {
        if (startYMD === endYMD) return `${sm} ${sd}, ${sY}`;
        if (sY === eY && sM === eM) return `${sm} ${sd} - ${ed}, ${sY}`;
        if (sY === eY) return `${sm} ${sd} - ${em} ${ed}, ${sY}`;
        return `${sm} ${sd}, ${sY} - ${em} ${ed}, ${eY}`;
    } else {
        if (startYMD === endYMD) return `${sm} ${sd}`;
        if (sY === eY && sM === eM) return `${sm} ${sd} - ${ed}`;
        return `${sm} ${sd} - ${em} ${ed}`;
    }
}

function formatSingleDate(ymdStr) {
    // Returns "Jan 5, 2025" from "2025-01-05"
    if (!ymdStr) return '';
    const [y, m, d] = ymdStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
}

function olderThan(aYMD, bYMD) {
    // true if a < b in UTC
    return parseYMD(aYMD).getTime() < parseYMD(bYMD).getTime();
}

function ageFromDob(dobYMD) {
    const dob = parseYMD(dobYMD);
    const today = parseYMD(todayUTC());
    let age = today.getUTCFullYear() - dob.getUTCFullYear();
    const m = today.getUTCMonth() - dob.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) age--;
    return age;
}

function formatDobWithAge(dobYMD) {
    if (!dobYMD) return '';
    const dob = parseYMD(dobYMD);
    const monthName = dob.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const day = dob.getUTCDate();
    const year = dob.getUTCFullYear();
    const age = ageFromDob(dobYMD);

    // Add ordinal suffix
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${monthName} ${day}${suffix(day)}, ${year} • ${age} years old`;
}

// =============================================================================
// 3) API SERVICES
// =============================================================================

async function fetchReservationCode(reservationCode, isBoat) {
    const url = new URL(`${API_BASE}/boat_charter_manageTrip_reservationCode`);
    url.searchParams.set('reservationCode', reservationCode);
    if (isBoat) {
        url.searchParams.set('boatRental', 'true');
    } else {
        url.searchParams.set('fishingCharter', 'true');
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch reservation code');
    return await response.json();
}

async function fetchPaymentIntent(paymentIntentId, isBoat) {
    const url = new URL(`${API_BASE}/boat_charter_manageTrip_paymentIntentId`);
    url.searchParams.set('extras_paymentIntentId', paymentIntentId);
    if (isBoat) {
        url.searchParams.set('boatRental', 'true');
    } else {
        url.searchParams.set('fishingCharter', 'true');
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch payment intent');
    return await response.json();
}

async function postHostEdits(params) {
    const url = new URL(`${API_BASE}/boat_charter_manageTrip_hostEdits`);

    // Add all params to query string
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (typeof value === 'object') {
            url.searchParams.set(key, JSON.stringify(value));
        } else {
            url.searchParams.set(key, String(value));
        }
    });


    const response = await fetch(url.toString(), {
        method: 'POST'
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post host edits: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
}

// =============================================================================
// 4) STATE DETERMINATION
// =============================================================================

function determineStatusVariant(data) {
    const {
        reservationApproved,
        reservation_notAvailable,
        reservation_active,
        cancellation_date,
        host_cancellation_date
    } = data;

    // Check in priority order
    if (host_cancellation_date != null && reservation_active === false) {
        return 'hostCancelled';
    }

    if (cancellation_date != null && reservation_active === false) {
        return 'guestCancelled';
    }

    if (reservation_notAvailable === true) {
        return 'declined';
    }

    if (reservationApproved === true && reservation_active === true) {
        // Check if completed (day after first date)
        // Changed to allow host cancellation on the first day of reservation
        const firstDate = getFirstDate(data);
        if (firstDate) {
            // Calculate the day after the first date
            const firstDateObj = parseYMD(firstDate);
            firstDateObj.setUTCDate(firstDateObj.getUTCDate() + 1);
            const dayAfterFirst = ymd(firstDateObj);

            // Only mark as completed if we're past the first day (on or after day 2)
            if (olderThan(dayAfterFirst, todayUTC()) || dayAfterFirst === todayUTC()) {
                return 'completed';
            }
        }
        return 'accepted';
    }

    if (reservationApproved === false && reservation_notAvailable === false && cancellation_date == null) {
        return 'request';
    }

    return 'unknown';
}

function getFirstDate(data) {
    // For boat: data.boatDates[]
    // For charter: data.dates[]
    if (data.boatDates && data.boatDates.length > 0) {
        const sorted = [...data.boatDates].map(d => d.date).sort();
        return sorted[0];
    }
    if (data.dates && data.dates.length > 0) {
        const sorted = [...data.dates].map(d => d.date).sort();
        return sorted[0];
    }
    return null;
}

// =============================================================================
// 5) BOAT RENTAL LOGIC
// =============================================================================

async function handleBoatRental(parsed) {
    const { reservationCode, paymentIntentId } = parsed;

    try {
        // Show loader while fetching data
        showLoader();

        // Step 1: Fetch ReservationCode data
        const resCodeData = await fetchReservationCode(reservationCode, true);

        // Step 2: Determine linkage
        let state = 'error';
        let piData = null;

        if (resCodeData.boat_additionalinfo_paymentintent_id == paymentIntentId) {
            state = 'linked';
            piData = await fetchPaymentIntent(paymentIntentId, true);
        } else if (resCodeData.boat_inactive_paymentIntents && Array.isArray(resCodeData.boat_inactive_paymentIntents)) {
            const found = resCodeData.boat_inactive_paymentIntents.find(pi => pi.id == paymentIntentId);
            if (found) {
                piData = await fetchPaymentIntent(paymentIntentId, true);

                // ALWAYS check for new_boat_paymentintent_id when in inactive list
                if (piData.new_boat_paymentintent_id) {
                    const newPiId = piData.new_boat_paymentintent_id;
                    const newPiData = await fetchPaymentIntent(newPiId, true);

                    // Compare boat id, guests, and dates
                    if (compareBoatData(piData, newPiData)) {
                        // Details match - migrate to new PI and show its status normally
                        piData = newPiData;
                        state = 'linked';
                    } else {
                        // Details changed - treat old booking as cancelled
                        state = 'unlinked-cancelled';
                    }
                } else {
                    // No new PI, standard unlinked
                    state = 'unlinked';
                }
            }
        }

        if (state === 'error' || !piData) {
            await hideLoader();
            showErrorState();
            return;
        }

        // Step 3: Render the page
        renderBoatRental(piData, resCodeData, state);

        // Hide loader after rendering is complete
        await hideLoader();

    } catch (error) {
        await hideLoader();
        showErrorState();
    }
}

function renderBoatRental(piData, resCodeData, linkState) {

    // CRITICAL: Hide charter sections to ensure only boat sections are visible
    hide('manageBooking_requestDetails_charter');
    hide('manageBooking_customerDetails_fishingCharter');

    // Determine status variant
    let statusVariant = determineStatusVariant(piData);

    // Force cancelled status if this is an old booking with changed details
    if (linkState === 'unlinked-cancelled') {
        statusVariant = 'systemCancelled';
    }

    // Show summary container
    showFlex('summary_container');

    // Show boat sections
    showFlex('manageBooking_requestDetails_boat');
    showFlex('manageBooking_customerDetails_boat');

    // Render summary
    renderBoatSummary(piData, resCodeData, statusVariant);

    // Render request details
    renderBoatRequestDetails(piData, resCodeData, statusVariant);

    // Render customer details
    renderBoatCustomerDetails(piData, resCodeData, statusVariant, linkState);

    // Render manage booking actions
    renderBoatManageActions(piData, statusVariant);

}

function renderBoatSummary(piData, resCodeData, statusVariant) {
    // Show summary section elements
    showFlex('manageBooking_textHeader');
    showFlex('manageBooking_statusDot');
    showFlex('manageBooking_statusText');
    showFlex('manageBooking_image');
    showFlex('manageBooking_name');
    showFlex('manageBooking_company');
    showFlex('manageBooking_datesGuests');
    showFlex('manageBooking_payout');

    // Status dot and text
    const { color, text } = getBoatStatusDotAndText(piData, statusVariant);
    setDotColor('manageBooking_statusDot', color);
    setText('manageBooking_statusText', text);

    // Image
    const boat = piData._boat;
    if (boat && boat.photos && boat.photos.length > 0) {
        const ordered = boat.photos.find(p => p.order === 1);
        const img = ordered || boat.photos[0];
        if (img && img.image && img.image.url) {
            setImg('manageBooking_image', img.image.url);
        }
    }

    // Name
    if (boat && boat.name) {
        setText('manageBooking_name', boat.name);
    }

    // Company
    if (boat && boat.__boatcompany && boat.__boatcompany.name) {
        setText('manageBooking_company', boat.__boatcompany.name);
    }

    // Dates & Guests
    const datesStr = formatRangeFromDatesArray(piData.boatDates.map(d => d.date));
    const guestsStr = (piData.boatGuests !== null && piData.boatGuests !== undefined) ? ` • ${piData.boatGuests} Passenger${piData.boatGuests > 1 ? 's' : ''}` : '';
    setText('manageBooking_datesGuests', datesStr + guestsStr);

    // Payout
    const payoutText = getBoatPayoutText(piData, statusVariant);
    setText('manageBooking_payout', payoutText);

    // Text header
    setText('manageBooking_textHeader', getBoatHeaderText(piData, statusVariant));
}

function getBoatStatusDotAndText(piData, statusVariant = null) {
    const RED = '#EF4444';
    const YELLOW = '#FACC15';
    const GREEN = '#22C55E';

    // Check for system cancelled FIRST (old booking superseded by new one)
    if (statusVariant === 'systemCancelled') {
        return { color: RED, text: 'RESERVATION CANCELLED' };
    }

    const {
        integration_type,
        reservation_notAvailable,
        reservation_active,
        reservationApproved,
        paymentConfirmed,
        paid_out,
        host_cancellation_date,
        cancellation_date
    } = piData;

    // Check cancellation states FIRST (takes precedence over everything)
    if (host_cancellation_date != null && reservation_active === false) {
        return { color: RED, text: 'HOST CANCELLED RESERVATION' };
    }

    if (cancellation_date != null && reservation_active === false) {
        return { color: RED, text: 'GUEST CANCELLED RESERVATION' };
    }

    // Check for NOT AVAILABLE (declined)
    if (reservation_notAvailable) {
        return { color: RED, text: 'REQUEST DENIED' };
    }

    // If Reservation NOT Approved (pending)
    if (!reservationApproved) {
        return { color: YELLOW, text: 'PENDING CONFIRMATION' };
    }

    // Reservation Approved
    let color = GREEN;
    let text = 'RESERVATION ACCEPTED';

    if (integration_type === 'Request') {
        if (reservation_active && paymentConfirmed) {
            color = GREEN;
            text = 'RESERVATION CONFIRMED';
        } else {
            color = GREEN;
            text = 'RESERVATION ACCEPTED';
        }
    } else if (integration_type === 'Manual') {
        color = GREEN;
        text = 'RESERVATION ACCEPTED (PAID DIRECTLY TO HOST)';
    }

    if (paid_out) {
        color = GREEN;
        text = 'PAID OUT';
    }

    return { color, text };
}

function getBoatHeaderText(piData, statusVariant = null) {
    if (!statusVariant) {
        statusVariant = determineStatusVariant(piData);
    }
    switch (statusVariant) {
        case 'request': return 'Reservation Request Details';
        case 'declined': return 'Declined Reservation Details';
        case 'guestCancelled':
        case 'hostCancelled':
        case 'systemCancelled': return 'Cancelled Reservation Details';
        default: return 'Reservation Details';
    }
}

function getBoatPayoutText(piData, statusVariant = null) {
    if (!statusVariant) {
        statusVariant = determineStatusVariant(piData);
    }

    const integration = piData.integration_type;
    const pricing = piData.pricing && piData.pricing.length > 0 ? piData.pricing[0].price : 0;

    let amount = 0;
    let note = '';

    if (statusVariant === 'systemCancelled') {
        amount = 0;
    } else if (statusVariant === 'declined') {
        amount = 0;
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else if (statusVariant === 'hostCancelled') {
        amount = 0;
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else if (statusVariant === 'guestCancelled') {
        if (integration === 'Request') {
            // Check cancellation policy
            if (piData.cancellationPolicyDate && piData.cancellation_date) {
                const policyDate = piData.cancellationPolicyDate;
                const cancelDate = piData.cancellation_date;
                if (olderThan(cancelDate, policyDate) || cancelDate === policyDate) {
                    // Cancelled before or on policy date
                    amount = 0;
                } else {
                    amount = pricing * 0.97;
                }
            } else {
                amount = pricing * 0.97;
            }
        }
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else {
        // Normal payout
        if (integration === 'Request') {
            amount = pricing * 0.97;
        } else if (integration === 'Manual') {
            amount = pricing;
            note = ' (Paid Directly)';
        }
    }

    return `Payout: ${formatMoney(amount)}${note}`;
}

function getBoatPayoutAmount(piData, statusVariant) {
    // Returns just the dollar amount without "Payout:" prefix
    const integration = piData.integration_type;
    const pricing = piData.pricing && piData.pricing[0] && piData.pricing[0].price ? piData.pricing[0].price : 0;
    let amount = 0;

    if (statusVariant === 'systemCancelled') {
        amount = 0;
    } else if (statusVariant === 'declined' || statusVariant === 'hostCancelled') {
        amount = 0;
    } else if (statusVariant === 'guestCancelled') {
        if (integration === 'Request') {
            // Check cancellation policy
            if (piData.cancellationPolicyDate && piData.cancellation_date) {
                const policyDate = piData.cancellationPolicyDate;
                const cancelDate = piData.cancellation_date;
                if (olderThan(cancelDate, policyDate) || cancelDate === policyDate) {
                    amount = 0;
                } else {
                    amount = pricing * 0.97;
                }
            } else {
                amount = pricing * 0.97;
            }
        }
    } else {
        // Normal payout
        if (integration === 'Request') {
            amount = pricing * 0.97;
        } else if (integration === 'Manual') {
            amount = pricing;
        }
    }

    return formatMoney(amount);
}

function renderBoatRequestDetails(piData, resCodeData, statusVariant) {
    // Show all request detail elements
    showFlex('manageBooking_requestDetails_boat_header');
    showFlex('manageBooking_requestDetails_boat_name');
    showFlex('manageBooking_requestDetails_boat_dates');
    showFlex('manageBooking_requestDetails_boat_datesLabel');
    showFlex('manageBooking_requestDetails_boat_pickupTime');
    showFlex('manageBooking_requestDetails_boat_passengers');
    showFlex('manageBooking_requestDetails_boat_payoutAmount');
    showFlex('manageBooking_requestDetails_boat_stayDates');
    showFlex('manageBooking_requestDetails_boat_privateDockDelivery');

    // Header
    setText('manageBooking_requestDetails_boat_header', getBoatHeaderText(piData, statusVariant));

    // Boat name
    if (piData._boat && piData._boat.name) {
        setText('manageBooking_requestDetails_boat_name', piData._boat.name);
    }

    // Dates
    const boatDates = piData.boatDates.map(d => d.date);
    const sorted = [...boatDates].sort();
    const datesStr = boatDates.length > 0 ? formatRangeYMD(sorted[0], sorted[sorted.length - 1], true) : '';
    setText('manageBooking_requestDetails_boat_dates', datesStr);

    // Dates label
    const numDates = piData.boatDates ? piData.boatDates.length : 0;
    setText('manageBooking_requestDetails_boat_datesLabel', numDates === 1 ? 'Date:' : 'Dates:');

    // Day length
    if (piData.numDays <= 1) {
        const lengthText = piData.boatLengthType === 'half' ? 'Half Day' : 'Full Day';
        setText('manageBooking_requestDetails_boat_dayLength', lengthText);
        showFlex('manageBooking_requestDetails_boat_dayLengthContainer');
        showFlex('manageBooking_requestDetails_boat_dayLength');
    } else {
        hide('manageBooking_requestDetails_boat_dayLengthContainer');
    }

    // Pickup time
    if (piData.boatPickupTime !== undefined && piData.boatPickupTime !== null) {
        setText('manageBooking_requestDetails_boat_pickupTime', formatTime24To12(piData.boatPickupTime));
    }

    // Passengers
    const passengers = piData.boatGuests !== null && piData.boatGuests !== undefined ? piData.boatGuests : '';
    setText('manageBooking_requestDetails_boat_passengers', passengers !== '' ? `${passengers} guest${passengers === 1 ? '' : 's'}` : '');

    // Payout amount (just $ amount, no "Payout:" text)
    setText('manageBooking_requestDetails_boat_payoutAmount', getBoatPayoutAmount(piData, statusVariant));

    // Stay dates (from ReservationCode)
    if (resCodeData.check_in && resCodeData.check_out) {
        const stayDatesStr = formatRangeYMD(resCodeData.check_in, resCodeData.check_out, true);
        setText('manageBooking_requestDetails_boat_stayDates', stayDatesStr);
    }

    // Private Dock Delivery
    if (piData.boatPrivateDock === true) {
        // Private dock: use property address from reservationCode data
        const addressLine1 = resCodeData._property_details?.address_line_1 || '';
        const addressLine2 = resCodeData._property_details?.address_line_2 || '';
        const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(' ');
        setText('manageBooking_requestDetails_boat_privateDockDelivery', `Private Dock - ${fullAddress}`);
    } else if (piData.boatPrivateDock === false) {
        // Not private dock: check if listing city matches any public dock delivery location
        const listingCity = resCodeData._property_details?.listing_city;
        const publicDockDetails = piData._boat?.__boatcompany?.publicDockDeliveryDetails;

        let publicDockAddress = null;
        if (listingCity && publicDockDetails && Array.isArray(publicDockDetails)) {
            const matchingDock = publicDockDetails.find(dock => dock.city === listingCity);
            if (matchingDock && matchingDock.address) {
                publicDockAddress = matchingDock.address;
            }
        }

        if (publicDockAddress) {
            setText('manageBooking_requestDetails_boat_privateDockDelivery', `Public Dock - ${publicDockAddress}`);
        } else {
            setText('manageBooking_requestDetails_boat_privateDockDelivery', 'Business Location');
        }
    }

    // Cancellation date (show for guest cancelled, host cancelled, or declined)
    if (statusVariant === 'guestCancelled' || statusVariant === 'hostCancelled' || statusVariant === 'declined') {
        showFlex('manageBooking_requestDetails_boat_guestHostCancellationDate_Container');
        showFlex('manageBooking_requestDetails_boat_guestHostCancellationDate_header');
        showFlex('manageBooking_requestDetails_boat_guestHostCancellationDate_text');

        let header = '';
        let dateValue = '';

        if (statusVariant === 'guestCancelled' && piData.cancellation_date) {
            header = 'GUEST CANCELLATION DATE:';
            dateValue = formatSingleDate(piData.cancellation_date);
        } else if (statusVariant === 'hostCancelled' && piData.host_cancellation_date) {
            header = 'HOST CANCELLATION DATE:';
            dateValue = formatSingleDate(piData.host_cancellation_date);
        } else if (statusVariant === 'declined' && piData.host_cancellation_date) {
            header = 'HOST DECLINED DATE:';
            dateValue = formatSingleDate(piData.host_cancellation_date);
        }

        setText('manageBooking_requestDetails_boat_guestHostCancellationDate_header', header);
        setText('manageBooking_requestDetails_boat_guestHostCancellationDate_text', dateValue);
    } else {
        hide('manageBooking_requestDetails_boat_guestHostCancellationDate_Container');
    }
}

function renderBoatCustomerDetails(piData, resCodeData, statusVariant, linkState) {
    // Show basic customer detail elements
    showFlex('manageBooking_customerDetails_boat_name');
    showFlex('manageBooking_customerDetails_boat_dateOfBirth');

    // Customer name
    if (resCodeData._guestuser) {
        const firstName = resCodeData._guestuser.First_Name || '';
        const lastName = resCodeData._guestuser.Last_Name || '';
        setText('manageBooking_customerDetails_boat_name', `${firstName} ${lastName}`.trim());
    }

    // Phone number
    if (statusVariant === 'accepted') {
        showFlex('manageBooking_customerDetails_boat_phoneNumberContainer');
        showFlex('manageBooking_customerDetails_boat_phoneNumber');
        if (resCodeData.guest_number) {
            setText('manageBooking_customerDetails_boat_phoneNumber', formatPhone(resCodeData.guest_number));
        }
    } else if (statusVariant === 'completed') {
        showFlex('manageBooking_customerDetails_boat_phoneNumberContainer');
        showFlex('manageBooking_customerDetails_boat_phoneNumber');
        setText('manageBooking_customerDetails_boat_phoneNumber', '');
    } else {
        hide('manageBooking_customerDetails_boat_phoneNumberContainer');
        setText('manageBooking_customerDetails_boat_phoneNumber', '');
    }

    // Date of birth
    if (resCodeData._guestuser && resCodeData._guestuser.Birth_Date) {
        setText('manageBooking_customerDetails_boat_dateOfBirth', formatDobWithAge(resCodeData._guestuser.Birth_Date));
    }

    // Conditional fields (only for Request, Accepted, Completed and Linked)
    const showConditionals = (statusVariant === 'request' || statusVariant === 'accepted' || statusVariant === 'completed') && linkState === 'linked';

    // Home address
    const homeAddress = piData._boat_additionalinfo && piData._boat_additionalinfo.address;
    const requireHomeAddress = piData._boat && piData._boat.__boatcompany && piData._boat.__boatcompany.requirements_homeAddress;
    if (showConditionals && requireHomeAddress === true && homeAddress) {
        showFlex('manageBooking_customerDetails_boat_homeAddressContainer');
        showFlex('manageBooking_customerDetails_boat_homeAddress');
        setText('manageBooking_customerDetails_boat_homeAddress', homeAddress);
    } else {
        hide('manageBooking_customerDetails_boat_homeAddressContainer');
        hide('manageBooking_customerDetails_boat_homeAddress');
    }

    // Boating experience
    const boatingExperience = piData._boat_additionalinfo && piData._boat_additionalinfo.boatingExperience;
    const requireExperience = piData._boat && piData._boat.__boatcompany && piData._boat.__boatcompany.requirements_experience;
    if (showConditionals && requireExperience === true && boatingExperience) {
        showFlex('manageBooking_customerDetails_boat_boatingExperienceContainer');
        showFlex('manageBooking_customerDetails_boat_boatingExperience');
        setText(
            'manageBooking_customerDetails_boat_boatingExperience',
            `${boatingExperience} year${boatingExperience == 1 ? '' : 's'}`
        );
    } else {
        hide('manageBooking_customerDetails_boat_boatingExperienceContainer');
        hide('manageBooking_customerDetails_boat_boatingExperience');
    }

    // Driver's license
    const driversLicense = piData._boat_additionalinfo && piData._boat_additionalinfo.dln;
    const requireDriversLicense = piData._boat && piData._boat.__boatcompany && piData._boat.__boatcompany.requirements_driversLicense;
    if (showConditionals && requireDriversLicense === true && driversLicense) {
        showFlex('manageBooking_customerDetails_boat_driversLicenseContainer');
        showFlex('manageBooking_customerDetails_boat_driversLicense');
        setText('manageBooking_customerDetails_boat_driversLicense', driversLicense);
    } else {
        hide('manageBooking_customerDetails_boat_driversLicenseContainer');
        hide('manageBooking_customerDetails_boat_driversLicense');
    }

    // Boater safety ID
    const boaterSafetyId = piData._boat_additionalinfo && piData._boat_additionalinfo.boaterSafetyId;
    const requireBoaterSafetyId = piData._boat && piData._boat.__boatcompany && piData._boat.__boatcompany.requirements_boaterSafetyId;
    if (showConditionals && requireBoaterSafetyId === true && boaterSafetyId) {
        showFlex('manageBooking_customerDetails_boat_boaterSafetyIdContainer');
        showFlex('manageBooking_customerDetails_boat_boaterSafetyId');
        setText('manageBooking_customerDetails_boat_boaterSafetyId', boaterSafetyId);
    } else {
        hide('manageBooking_customerDetails_boat_boaterSafetyIdContainer');
        hide('manageBooking_customerDetails_boat_boaterSafetyId');
    }
}

function renderBoatManageActions(piData, statusVariant) {
    const { paymentIntentId } = window.currentPageData || {};

    // Hide all by default
    hide('manageBooking_acceptButton');
    hide('manageBooking_declineButton');
    hide('manageBooking_cancelReservationButton');
    hide('manageBooking_declineCancelTextBox');
    hide('manageBooking_confirmDeclineCancelButton');

    if (statusVariant === 'request') {
        // Show Accept and Decline
        showFlex('manageBooking_acceptButton');
        showFlex('manageBooking_declineButton');

        // Wire up Accept button
        const acceptBtn = document.querySelector('[data-element="manageBooking_acceptButton"]');
        if (acceptBtn) {
            acceptBtn.onclick = async () => {
                try {
                    showLoader('Accepting reservation...');
                    await postHostEdits({
                        boatRental: true,
                        extras_paymentIntentId: piData.id,
                        reservationApproved: true,
                        reservation_active: true
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to accept reservation. Please try again.');
                }
            };
        }

        // Wire up Decline button
        const declineBtn = document.querySelector('[data-element="manageBooking_declineButton"]');
        if (declineBtn) {
            declineBtn.onclick = () => {
                showFlex('manageBooking_declineCancelTextBox');
                showFlex('manageBooking_confirmDeclineCancelButton');
                showFlex('manageBooking_confirmDeclineCancelButton_text');
                setText('manageBooking_confirmDeclineCancelButton_text', 'Decline Reservation');

                // Scroll bodyContainer down to reveal textbox
                const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
                if (bodyContainer) {
                    bodyContainer.scrollBy({ top: 350, behavior: 'smooth' });
                }
            };
        }

        // Wire up Confirm Decline button
        const confirmBtn = document.querySelector('[data-element="manageBooking_confirmDeclineCancelButton"]');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    showLoader('Declining reservation...');
                    // Get the textbox value
                    const textBox = document.querySelector('[data-element="manageBooking_declineCancelTextBox"]');
                    const textBoxValue = textBox ? textBox.value : '';

                    await postHostEdits({
                        boatRental: true,
                        extras_paymentIntentId: piData.id,
                        reservation_notAvailable: true,
                        reservation_notAvailable_textBox: textBoxValue
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to decline reservation. Please try again.');
                }
            };
        }

    } else if (statusVariant === 'accepted') {
        // Show Cancel
        showFlex('manageBooking_cancelReservationButton');

        // Wire up Cancel button
        const cancelBtn = document.querySelector('[data-element="manageBooking_cancelReservationButton"]');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                showFlex('manageBooking_declineCancelTextBox');
                showFlex('manageBooking_confirmDeclineCancelButton');
                showFlex('manageBooking_confirmDeclineCancelButton_text');
                setText('manageBooking_confirmDeclineCancelButton_text', 'Confirm Cancellation');

                // Scroll bodyContainer down to reveal textbox
                const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
                if (bodyContainer) {
                    bodyContainer.scrollBy({ top: 350, behavior: 'smooth' });
                }
            };
        }

        // Wire up Confirm Cancel button
        const confirmBtn = document.querySelector('[data-element="manageBooking_confirmDeclineCancelButton"]');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    showLoader('Cancelling reservation...');
                    // Get the textbox value
                    const textBox = document.querySelector('[data-element="manageBooking_declineCancelTextBox"]');
                    const textBoxValue = textBox ? textBox.value : '';

                    await postHostEdits({
                        boatRental: true,
                        extras_paymentIntentId: piData.id,
                        reservation_active: false,
                        host_cancellation_date: todayUTC(),
                        reservation_notAvailable_textBox: textBoxValue
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to cancel reservation. Please try again.');
                }
            };
        }
    }
    // For other statuses (declined, cancelled, completed), hide all action buttons
}

// =============================================================================
// 6) FISHING CHARTER LOGIC
// =============================================================================

async function handleFishingCharter(parsed) {
    const { reservationCode, paymentIntentId, charterId, tripId, firstDate } = parsed;

    console.log('[HANDLE FISHING CHARTER] Starting with:', {
        reservationCode,
        paymentIntentId,
        charterId,
        tripId,
        firstDate
    });

    try {
        // Show loader while fetching data
        showLoader();

        // Step 1: Fetch ReservationCode data
        const resCodeData = await fetchReservationCode(reservationCode, false);
        console.log('[HANDLE FISHING CHARTER] ReservationCode data fetched');

        // Step 2: Determine linkage with new PI backfill
        let state = 'error';
        let piData = null;
        let workingPaymentIntentId = paymentIntentId;

        console.log('[HANDLE FISHING CHARTER] Checking linkage...');
        console.log('[HANDLE FISHING CHARTER] resCodeData.fishingcharters_paymentintent_id:', resCodeData.fishingcharters_paymentintent_id);

        if (resCodeData.fishingcharters_paymentintent_id == paymentIntentId) {
            console.log('[HANDLE FISHING CHARTER] Payment intent is LINKED (active)');
            // Provisionally linked
            piData = await fetchPaymentIntent(paymentIntentId, false);

            // Validate charter/trip exists in fishingCharters[]
            const match = findMatchingCharter(piData, charterId, tripId, firstDate);
            if (match) {
                console.log('[HANDLE FISHING CHARTER] Match found - state: linked');
                state = 'linked';
            } else {
                console.log('[HANDLE FISHING CHARTER] No match found - state: error');
                state = 'error';
            }
        } else if (resCodeData.fishingCharter_inactive_paymentIntents && Array.isArray(resCodeData.fishingCharter_inactive_paymentIntents)) {
            const found = resCodeData.fishingCharter_inactive_paymentIntents.find(pi => pi.id == paymentIntentId);
            if (found) {
                // Provisionally unlinked
                piData = await fetchPaymentIntent(paymentIntentId, false);

                const match = findMatchingCharter(piData, charterId, tripId, firstDate);

                // ALWAYS check for new_fishingcharters_paymentintent_id when in inactive list
                if (piData.new_fishingcharters_paymentintent_id) {
                    const newPiId = piData.new_fishingcharters_paymentintent_id;
                    const newPiData = await fetchPaymentIntent(newPiId, false);

                    // Compare old vs new for same charter/trip
                    const oldMatch = findMatchingCharter(piData, charterId, tripId, firstDate);
                    const newMatch = findMatchingCharter(newPiData, charterId, tripId, firstDate);

                    if (oldMatch && newMatch && compareCharterEntries(oldMatch, newMatch)) {
                        // Details match - migrate to new PI and show its status normally
                        piData = newPiData;
                        workingPaymentIntentId = newPiId;
                        state = 'linked';
                    } else if (oldMatch && newMatch) {
                        // Details changed - treat old booking as cancelled
                        state = 'unlinked-cancelled';
                    } else if (!newMatch) {
                        // Charter/trip not found in new PI - old booking is cancelled
                        state = 'unlinked-cancelled';
                    } else {
                        state = 'error';
                    }
                } else if (match) {
                    // No new PI, but match found in old PI - standard unlinked
                    state = 'unlinked';
                } else {
                    // No match and no new PI
                    state = 'error';
                }
            }
        }
        if (state === 'error' || !piData) {
            await hideLoader();
            showErrorState();
            return;
        }
        renderFishingCharter(piData, resCodeData, state, charterId, tripId, firstDate);

        // Hide loader after rendering is complete
        await hideLoader();

    } catch (error) {
        await hideLoader();
        showErrorState();
    }
}

function findMatchingCharter(piData, charterId, tripId, firstDate = null) {
    console.log('[FIND MATCHING CHARTER] Looking for:', { charterId, tripId, firstDate });

    if (!piData.fishingCharters || !Array.isArray(piData.fishingCharters)) {
        console.log('[FIND MATCHING CHARTER] No fishingCharters array found');
        return null;
    }

    console.log('[FIND MATCHING CHARTER] Total charters in piData:', piData.fishingCharters.length);

    // If firstDate is provided, match all three: charterId, tripId, and firstDate
    if (firstDate) {
        console.log('[FIND MATCHING CHARTER] Using firstDate matching');

        const match = piData.fishingCharters.find(c => {
            console.log('[FIND MATCHING CHARTER] Checking charter:', {
                charterId: c.charterId,
                tripId: c.tripId,
                dates: c.dates
            });

            if (c.charterId != charterId || c.tripId != tripId) {
                console.log('[FIND MATCHING CHARTER] Charter/Trip ID mismatch');
                return false;
            }

            // Get the first date from this charter's dates
            const charterDates = (c.dates || []).map(d => d.date).sort();
            const charterFirstDate = charterDates.length > 0 ? charterDates[0] : null;

            console.log('[FIND MATCHING CHARTER] Comparing dates:', {
                charterFirstDate,
                urlFirstDate: firstDate,
                match: charterFirstDate === firstDate
            });

            return charterFirstDate === firstDate;
        });

        console.log('[FIND MATCHING CHARTER] Match found:', match ? 'YES' : 'NO');
        return match;
    }

    // If no firstDate provided (old format), match just charterId and tripId
    console.log('[FIND MATCHING CHARTER] Using legacy matching (no firstDate)');
    const match = piData.fishingCharters.find(c => c.charterId == charterId && c.tripId == tripId);
    console.log('[FIND MATCHING CHARTER] Match found:', match ? 'YES' : 'NO');
    return match;
}

function compareCharterEntries(a, b) {
    if (a.charterId != b.charterId) {
        return false;
    }
    if (a.tripId != b.tripId) {
        return false;
    }
    if (a.guests != b.guests) {
        return false;
    }

    // Compare dates
    const aDates = (a.dates || []).map(d => d.date).sort();
    const bDates = (b.dates || []).map(d => d.date).sort();

    if (aDates.length !== bDates.length) {
        return false;
    }
    for (let i = 0; i < aDates.length; i++) {
        if (aDates[i] !== bDates[i]) {
            return false;
        }
    }

    return true;
}

function compareBoatData(oldPi, newPi) {
    // Compare boat ID (boats_id field)
    const oldBoatId = oldPi.boats_id;
    const newBoatId = newPi.boats_id;
    if (oldBoatId != newBoatId) {
        return false;
    }

    // Compare guests
    if (oldPi.boatGuests != newPi.boatGuests) {
        return false;
    }

    // Compare dates
    const oldDates = (oldPi.boatDates || []).map(d => d.date).sort();
    const newDates = (newPi.boatDates || []).map(d => d.date).sort();
    if (oldDates.length !== newDates.length) {
        return false;
    }
    for (let i = 0; i < oldDates.length; i++) {
        if (oldDates[i] !== newDates[i]) {
            return false;
        }
    }

    return true;
}

function renderFishingCharter(piData, resCodeData, linkState, charterId, tripId, firstDate = null) {

    // Find the matching charter entry
    const charterEntry = findMatchingCharter(piData, charterId, tripId, firstDate);
    if (!charterEntry) {
        showErrorState();
        return;
    }

    // Store for later use in actions
    window.currentPageData = {
        ...window.currentPageData,
        charterEntry,
        allCharters: piData.fishingCharters,
        charterId,
        tripId
    };

    // CRITICAL: Hide boat sections to ensure only charter sections are visible
    hide('manageBooking_requestDetails_boat');
    hide('manageBooking_customerDetails_boat');

    // Determine status variant
    let statusVariant = determineStatusVariant(charterEntry);

    // Force cancelled status if this is an old booking with changed details
    if (linkState === 'unlinked-cancelled') {
        statusVariant = 'systemCancelled';
    }

    // Show summary container
    showFlex('summary_container');

    // Show charter sections
    showFlex('manageBooking_requestDetails_charter');
    showFlex('manageBooking_customerDetails_fishingCharter');

    // Render summary
    renderCharterSummary(piData, resCodeData, charterEntry, statusVariant);

    // Render request details
    renderCharterRequestDetails(piData, resCodeData, charterEntry, statusVariant);

    // Render customer details
    renderCharterCustomerDetails(piData, resCodeData, charterEntry, statusVariant, linkState);

    // Render manage booking actions
    renderCharterManageActions(piData, charterEntry, statusVariant);

}

function renderCharterSummary(piData, resCodeData, charterEntry, statusVariant) {
    // Show summary section elements
    showFlex('manageBooking_textHeader');
    showFlex('manageBooking_statusDot');
    showFlex('manageBooking_statusText');
    showFlex('manageBooking_image');
    showFlex('manageBooking_name');
    showFlex('manageBooking_company');
    showFlex('manageBooking_datesGuests');
    showFlex('manageBooking_payout');

    // Status dot and text
    const { color, text } = getCharterStatusDotAndText(charterEntry, statusVariant);
    setDotColor('manageBooking_statusDot', color);
    setText('manageBooking_statusText', text);

    // Image (from the charter entry's _fishingcharter)
    const charter = charterEntry._fishingcharter;
    if (charter && charter.images && charter.images.length > 0) {
        const ordered = charter.images.find(p => p.order === 1);
        const img = ordered || charter.images[0];
        if (img && img.image && img.image.url) {
            setImg('manageBooking_image', img.image.url);
        }
    }

    // Name (tripLabel)
    if (charterEntry.tripLabel) {
        setText('manageBooking_name', charterEntry.tripLabel);
    }

    // Company (charterName)
    if (charterEntry.charterName) {
        setText('manageBooking_company', charterEntry.charterName);
    }

    // Dates & Guests
    const datesStr = formatRangeFromDatesArray(charterEntry.dates.map(d => d.date));
    const guestsStr = (charterEntry.guests !== null && charterEntry.guests !== undefined) ? ` • ${charterEntry.guests} Guest${charterEntry.guests > 1 ? 's' : ''}` : '';
    setText('manageBooking_datesGuests', datesStr + guestsStr);

    // Payout
    const payoutText = getCharterPayoutText(charterEntry, statusVariant);
    setText('manageBooking_payout', payoutText);

    // Text header
    setText('manageBooking_textHeader', getCharterHeaderText(charterEntry, statusVariant));
}

function getCharterStatusDotAndText(charterEntry, statusVariant = null) {
    const RED = '#EF4444';
    const YELLOW = '#FACC15';
    const GREEN = '#22C55E';

    // Check for system cancelled FIRST (old booking superseded by new one)
    if (statusVariant === 'systemCancelled') {
        return { color: RED, text: 'RESERVATION CANCELLED' };
    }

    const {
        integrationType,
        reservation_notAvailable,
        reservation_active,
        reservationApproved,
        paymentConfirmed,
        paid_out,
        host_cancellation_date,
        cancellation_date
    } = charterEntry;

    // Check cancellation states FIRST (takes precedence over everything)
    if (host_cancellation_date != null && reservation_active === false) {
        return { color: RED, text: 'HOST CANCELLED RESERVATION' };
    }

    if (cancellation_date != null && reservation_active === false) {
        return { color: RED, text: 'GUEST CANCELLED RESERVATION' };
    }

    // Check for NOT AVAILABLE (declined)
    if (reservation_notAvailable) {
        return { color: RED, text: 'REQUEST DENIED' };
    }

    // If Reservation NOT Approved (pending)
    if (!reservationApproved) {
        return { color: YELLOW, text: 'PENDING CONFIRMATION' };
    }

    // Reservation Approved
    let color = GREEN;
    let text = 'RESERVATION ACCEPTED';

    if (integrationType === 'Request') {
        if (reservation_active && paymentConfirmed) {
            color = GREEN;
            text = 'RESERVATION CONFIRMED';
        } else {
            color = GREEN;
            text = 'RESERVATION ACCEPTED';
        }
    } else if (integrationType === 'Manual') {
        color = GREEN;
        text = 'RESERVATION ACCEPTED (PAID DIRECTLY TO HOST)';
    }

    if (paid_out) {
        color = GREEN;
        text = 'PAID OUT';
    }

    return { color, text };
}

function getCharterHeaderText(charterEntry, statusVariant = null) {
    if (!statusVariant) {
        statusVariant = determineStatusVariant(charterEntry);
    }
    switch (statusVariant) {
        case 'request': return 'Reservation Request Details';
        case 'declined': return 'Declined Reservation Details';
        case 'guestCancelled':
        case 'hostCancelled':
        case 'systemCancelled': return 'Cancelled Reservation Details';
        default: return 'Reservation Details';
    }
}

function getCharterPayoutText(charterEntry, statusVariant = null) {
    if (!statusVariant) {
        statusVariant = determineStatusVariant(charterEntry);
    }

    const integration = charterEntry.integrationType;
    const subtotal = charterEntry.pricing && charterEntry.pricing.subtotal ? charterEntry.pricing.subtotal : 0;

    let amount = 0;
    let note = '';

    if (statusVariant === 'systemCancelled') {
        amount = 0;
    } else if (statusVariant === 'declined') {
        amount = 0;
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else if (statusVariant === 'hostCancelled') {
        amount = 0;
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else if (statusVariant === 'guestCancelled') {
        if (integration === 'Request') {
            // Check cancellation policy
            if (charterEntry.cancellationPolicyDate && charterEntry.cancellation_date) {
                const policyDate = charterEntry.cancellationPolicyDate;
                const cancelDate = charterEntry.cancellation_date;
                if (olderThan(cancelDate, policyDate) || cancelDate === policyDate) {
                    amount = 0;
                } else {
                    amount = subtotal * 0.97;
                }
            } else {
                amount = subtotal * 0.97;
            }
        }
        if (integration === 'Manual') {
            note = ' (Handled off platform)';
        }
    } else {
        // Normal payout
        if (integration === 'Request') {
            amount = subtotal * 0.97;
        } else if (integration === 'Manual') {
            amount = subtotal;
            note = ' (Paid Directly)';
        }
    }

    return `Payout: ${formatMoney(amount)}${note}`;
}

function getCharterPayoutAmount(charterEntry, statusVariant) {
    const integration = charterEntry.integrationType;
    const subtotal = charterEntry.pricing && charterEntry.pricing.subtotal ? charterEntry.pricing.subtotal : 0;

    let amount = 0;

    if (statusVariant === 'systemCancelled') {
        amount = 0;
    } else if (statusVariant === 'declined' || statusVariant === 'hostCancelled') {
        amount = 0;
    } else if (statusVariant === 'guestCancelled') {
        if (integration === 'Request') {
            // Check cancellation policy
            if (charterEntry.cancellationPolicyDate && charterEntry.cancellation_date) {
                const policyDate = charterEntry.cancellationPolicyDate;
                const cancelDate = charterEntry.cancellation_date;
                if (olderThan(cancelDate, policyDate) || cancelDate === policyDate) {
                    amount = 0;
                } else {
                    amount = subtotal * 0.97;
                }
            } else {
                amount = subtotal * 0.97;
            }
        }
    } else {
        // Normal payout
        if (integration === 'Request') {
            amount = subtotal * 0.97;
        } else if (integration === 'Manual') {
            amount = subtotal;
        }
    }

    return formatMoney(amount);
}

function renderCharterRequestDetails(piData, resCodeData, charterEntry, statusVariant) {
    // Show all charter request detail elements
    showFlex('manageBooking_requestDetails_charter_header');
    showFlex('manageBooking_requestDetails_charter_tripName');
    showFlex('manageBooking_requestDetails_charter_dates');
    showFlex('manageBooking_requestDetails_charter_time');
    showFlex('manageBooking_requestDetails_charter_guests');
    showFlex('manageBooking_requestDetails_charter_payoutAmount');
    showFlex('manageBooking_requestDetails_charter_stayDates');
    showFlex('manageBooking_requestDetails_charter_privateDockPickup');

    // Header
    setText('manageBooking_requestDetails_charter_header', getCharterHeaderText(charterEntry, statusVariant));

    // Trip name
    if (charterEntry.tripLabel) {
        setText('manageBooking_requestDetails_charter_tripName', charterEntry.tripLabel);
    }

    // Dates
    const charterDates = charterEntry.dates.map(d => d.date);
    const sortedCharterDates = [...charterDates].sort();
    const charterDatesStr = charterDates.length > 0 ? formatRangeYMD(sortedCharterDates[0], sortedCharterDates[sortedCharterDates.length - 1], true) : '';
    setText('manageBooking_requestDetails_charter_dates', charterDatesStr);

    // Time (find tripId in _fishingcharter.tripOptions)
    if (charterEntry._fishingcharter && charterEntry._fishingcharter.tripOptions) {
        const tripOption = charterEntry._fishingcharter.tripOptions.find(t => t.id == charterEntry.tripId);
        if (tripOption && tripOption.tripStartTime !== undefined) {
            setText('manageBooking_requestDetails_charter_time', formatTime24To12(tripOption.tripStartTime));
        }
    }

    // Guests
    const guestsCount = charterEntry.guests !== null && charterEntry.guests !== undefined ? charterEntry.guests : '';
    setText('manageBooking_requestDetails_charter_guests', guestsCount !== '' ? `${guestsCount} guest${guestsCount === 1 ? '' : 's'}` : '');

    // Payout amount (just the dollar value, no label)
    setText('manageBooking_requestDetails_charter_payoutAmount', getCharterPayoutAmount(charterEntry, statusVariant));

    // Stay dates (from ReservationCode)
    if (resCodeData.check_in && resCodeData.check_out) {
        const charterStayDatesStr = formatRangeYMD(resCodeData.check_in, resCodeData.check_out, true);
        setText('manageBooking_requestDetails_charter_stayDates', charterStayDatesStr);
    }

    // Private Dock Pickup
    if (charterEntry.pickup === false) {
        setText('manageBooking_requestDetails_charter_privateDockPickup', 'Business Location');
    } else if (charterEntry.pickup === true) {
        const address = charterEntry._fishingcharter?.address || '';
        setText('manageBooking_requestDetails_charter_privateDockPickup', `Private Dock - ${address}`);
    }

    // Cancellation date (show for guest cancelled, host cancelled, or declined)
    if (statusVariant === 'guestCancelled' || statusVariant === 'hostCancelled' || statusVariant === 'declined') {
        showFlex('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_Container');
        showFlex('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_header');
        showFlex('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_text');

        let header = '';
        let dateValue = '';

        if (statusVariant === 'guestCancelled' && charterEntry.cancellation_date) {
            header = 'GUEST CANCELLATION DATE:';
            dateValue = formatSingleDate(charterEntry.cancellation_date);
        } else if (statusVariant === 'hostCancelled' && charterEntry.host_cancellation_date) {
            header = 'HOST CANCELLATION DATE:';
            dateValue = formatSingleDate(charterEntry.host_cancellation_date);
        } else if (statusVariant === 'declined' && charterEntry.host_cancellation_date) {
            header = 'HOST DECLINED DATE:';
            dateValue = formatSingleDate(charterEntry.host_cancellation_date);
        }

        setText('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_header', header);
        setText('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_text', dateValue);
    } else {
        hide('manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_Container');
    }
}

function renderCharterCustomerDetails(piData, resCodeData, charterEntry, statusVariant, linkState) {
    // Show basic charter customer detail elements
    showFlex('manageBooking_customerDetails_fishingCharter_name');
    showFlex('manageBooking_customerDetails_fishingCharter_dateOfBirth');

    // Customer name (_guestuser is an array, so access first element)
    if (resCodeData._guestuser && resCodeData._guestuser[0]) {
        const guestUser = resCodeData._guestuser[0];
        const firstName = guestUser.First_Name || '';
        const lastName = guestUser.Last_Name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        setText('manageBooking_customerDetails_fishingCharter_name', fullName);
    }

    // Phone number
    if (statusVariant === 'accepted') {
        showFlex('manageBooking_customerDetails_fishingCharter_phoneNumberContainer');
        showFlex('manageBooking_customerDetails_fishingCharter_phoneNumber');
        if (resCodeData.guest_number) {
            setText('manageBooking_customerDetails_fishingCharter_phoneNumber', formatPhone(resCodeData.guest_number));
        }
    } else if (statusVariant === 'completed') {
        showFlex('manageBooking_customerDetails_fishingCharter_phoneNumberContainer');
        showFlex('manageBooking_customerDetails_fishingCharter_phoneNumber');
        setText('manageBooking_customerDetails_fishingCharter_phoneNumber', '');
    } else {
        hide('manageBooking_customerDetails_fishingCharter_phoneNumberContainer');
        setText('manageBooking_customerDetails_fishingCharter_phoneNumber', '');
    }

    // Date of birth (_guestuser is an array, so access first element)
    if (resCodeData._guestuser && resCodeData._guestuser[0] && resCodeData._guestuser[0].Birth_Date) {
        const dobFormatted = formatDobWithAge(resCodeData._guestuser[0].Birth_Date);
        setText('manageBooking_customerDetails_fishingCharter_dateOfBirth', dobFormatted);
    }
}

function renderCharterManageActions(piData, charterEntry, statusVariant) {
    // Hide all by default
    hide('manageBooking_acceptButton');
    hide('manageBooking_declineButton');
    hide('manageBooking_cancelReservationButton');
    hide('manageBooking_declineCancelTextBox');
    hide('manageBooking_confirmDeclineCancelButton');

    const { allCharters, charterId, tripId } = window.currentPageData || {};

    if (statusVariant === 'request') {
        // Show Accept and Decline
        showFlex('manageBooking_acceptButton');
        showFlex('manageBooking_declineButton');

        // Wire up Accept button
        const acceptBtn = document.querySelector('[data-element="manageBooking_acceptButton"]');
        if (acceptBtn) {
            acceptBtn.onclick = async () => {
                try {
                    showLoader('Accepting reservation...');
                    const updatedCharters = allCharters.map(c => {
                        if (c.charterId == charterId && c.tripId == tripId) {
                            return { ...c, reservationApproved: true, reservation_active: true };
                        }
                        return c;
                    });

                    // Remove _fishingcharter object before sending (too large for URL)
                    const cleanedCharters = updatedCharters.map(({ _fishingcharter, ...rest }) => rest);

                    // Get the first date from the charter dates
                    const charterDates = charterEntry.dates.map(d => d.date).sort();
                    const firstDate = charterDates.length > 0 ? charterDates[0] : null;

                    await postHostEdits({
                        fishingCharter: true,
                        extras_paymentIntentId: piData.id,
                        fishingCharters: cleanedCharters,
                        charterId: charterId,
                        tripId: tripId,
                        reservationApproved: true,
                        reservation_active: true,
                        firstDate: firstDate
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to accept reservation. Please try again.');
                }
            };
        }

        // Wire up Decline button
        const declineBtn = document.querySelector('[data-element="manageBooking_declineButton"]');
        if (declineBtn) {
            declineBtn.onclick = () => {
                showFlex('manageBooking_declineCancelTextBox');
                showFlex('manageBooking_confirmDeclineCancelButton');
                showFlex('manageBooking_confirmDeclineCancelButton_text');
                setText('manageBooking_confirmDeclineCancelButton_text', 'Decline Reservation');

                // Scroll bodyContainer down to reveal textbox
                const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
                if (bodyContainer) {
                    bodyContainer.scrollBy({ top: 350, behavior: 'smooth' });
                }
            };
        }

        // Wire up Confirm Decline button
        const confirmBtn = document.querySelector('[data-element="manageBooking_confirmDeclineCancelButton"]');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    showLoader('Declining reservation...');
                    // Get the textbox value
                    const textBox = document.querySelector('[data-element="manageBooking_declineCancelTextBox"]');
                    const textBoxValue = textBox ? textBox.value : '';

                    const updatedCharters = allCharters.map(c => {
                        if (c.charterId == charterId && c.tripId == tripId) {
                            return {
                                ...c,
                                reservation_notAvailable: true,
                                reservation_notAvailable_textBox: textBoxValue
                            };
                        }
                        return c;
                    });

                    // Remove _fishingcharter object before sending (too large for URL)
                    const cleanedCharters = updatedCharters.map(({ _fishingcharter, ...rest }) => rest);

                    // Get the first date from the charter dates
                    const charterDatesDecline = charterEntry.dates.map(d => d.date).sort();
                    const firstDateDecline = charterDatesDecline.length > 0 ? charterDatesDecline[0] : null;

                    await postHostEdits({
                        fishingCharter: true,
                        extras_paymentIntentId: piData.id,
                        fishingCharters: cleanedCharters,
                        charterId: charterId,
                        tripId: tripId,
                        reservation_notAvailable: true,
                        firstDate: firstDateDecline
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to decline reservation. Please try again.');
                }
            };
        }

    } else if (statusVariant === 'accepted') {
        // Show Cancel
        showFlex('manageBooking_cancelReservationButton');

        // Wire up Cancel button
        const cancelBtn = document.querySelector('[data-element="manageBooking_cancelReservationButton"]');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                showFlex('manageBooking_declineCancelTextBox');
                showFlex('manageBooking_confirmDeclineCancelButton');
                showFlex('manageBooking_confirmDeclineCancelButton_text');
                setText('manageBooking_confirmDeclineCancelButton_text', 'Confirm Cancellation');

                // Scroll bodyContainer down to reveal textbox
                const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
                if (bodyContainer) {
                    bodyContainer.scrollBy({ top: 350, behavior: 'smooth' });
                }
            };
        }

        // Wire up Confirm Cancel button
        const confirmBtn = document.querySelector('[data-element="manageBooking_confirmDeclineCancelButton"]');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    showLoader('Cancelling reservation...');
                    // Get the textbox value
                    const textBox = document.querySelector('[data-element="manageBooking_declineCancelTextBox"]');
                    const textBoxValue = textBox ? textBox.value : '';

                    const updatedCharters = allCharters.map(c => {
                        if (c.charterId == charterId && c.tripId == tripId) {
                            return {
                                ...c,
                                reservation_active: false,
                                host_cancellation_date: todayUTC(),
                                reservation_notAvailable_textBox: textBoxValue
                            };
                        }
                        return c;
                    });

                    // Remove _fishingcharter object before sending (too large for URL)
                    const cleanedCharters = updatedCharters.map(({ _fishingcharter, ...rest }) => rest);

                    // Get the first date from the charter dates
                    const charterDatesCancel = charterEntry.dates.map(d => d.date).sort();
                    const firstDateCancel = charterDatesCancel.length > 0 ? charterDatesCancel[0] : null;

                    await postHostEdits({
                        fishingCharter: true,
                        extras_paymentIntentId: piData.id,
                        fishingCharters: cleanedCharters,
                        charterId: charterId,
                        tripId: tripId,
                        reservation_active: false,
                        host_cancellation_date: todayUTC(),
                        firstDate: firstDateCancel
                    });
                    // Reload page
                    window.location.reload();
                } catch (error) {
                    await hideLoader();
                    alert('Failed to cancel reservation. Please try again.');
                }
            };
        }
    }
    // For other statuses (declined, cancelled, completed), hide all action buttons
}

// =============================================================================
// 7) ERROR STATE
// =============================================================================

function hideAllContentInBodyContainer() {
    // Hide all data-elements within bodyContainer
    const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
    if (!bodyContainer) return;

    // Find all elements with data-element attribute within bodyContainer
    const allDataElements = bodyContainer.querySelectorAll('[data-element]');
    allDataElements.forEach(el => {
        // Skip the loader itself
        if (el.getAttribute('data-element') !== 'manageBooking_loader') {
            el.style.display = 'none';
        }
    });
}


function hideAllContent() {
    // Hide all data-elements including containers
    const allElements = [
        // Summary section
        'summary_container',
        'manageBooking_textHeader',
        'manageBooking_statusDot',
        'manageBooking_statusText',
        'manageBooking_image',
        'manageBooking_name',
        'manageBooking_company',
        'manageBooking_datesGuests',
        'manageBooking_payout',

        // Boat rental section
        'manageBooking_requestDetails_boat',
        'manageBooking_requestDetails_boat_header',
        'manageBooking_requestDetails_boat_name',
        'manageBooking_requestDetails_boat_dates',
        'manageBooking_requestDetails_boat_datesLabel',
        'manageBooking_requestDetails_boat_dayLength',
        'manageBooking_requestDetails_boat_dayLengthContainer',
        'manageBooking_requestDetails_boat_pickupTime',
        'manageBooking_requestDetails_boat_passengers',
        'manageBooking_requestDetails_boat_payoutAmount',
        'manageBooking_requestDetails_boat_stayDates',
        'manageBooking_requestDetails_boat_privateDockDelivery',
        'manageBooking_requestDetails_boat_guestHostCancellationDate_Container',
        'manageBooking_requestDetails_boat_guestHostCancellationDate_header',
        'manageBooking_requestDetails_boat_guestHostCancellationDate_text',

        'manageBooking_customerDetails_boat',
        'manageBooking_customerDetails_boat_name',
        'manageBooking_customerDetails_boat_phoneNumberContainer',
        'manageBooking_customerDetails_boat_phoneNumber',
        'manageBooking_customerDetails_boat_dateOfBirth',
        'manageBooking_customerDetails_boat_homeAddressContainer',
        'manageBooking_customerDetails_boat_homeAddress',
        'manageBooking_customerDetails_boat_boatingExperienceContainer',
        'manageBooking_customerDetails_boat_boatingExperience',
        'manageBooking_customerDetails_boat_driversLicenseContainer',
        'manageBooking_customerDetails_boat_driversLicense',
        'manageBooking_customerDetails_boat_boaterSafetyIdContainer',
        'manageBooking_customerDetails_boat_boaterSafetyId',

        // Fishing charter section
        'manageBooking_requestDetails_charter',
        'manageBooking_requestDetails_charter_header',
        'manageBooking_requestDetails_charter_tripName',
        'manageBooking_requestDetails_charter_dates',
        'manageBooking_requestDetails_charter_time',
        'manageBooking_requestDetails_charter_guests',
        'manageBooking_requestDetails_charter_payoutAmount',
        'manageBooking_requestDetails_charter_stayDates',
        'manageBooking_requestDetails_charter_privateDockPickup',
        'manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_Container',
        'manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_header',
        'manageBooking_requestDetails_fishingCharter_guestHostCancellationDate_text',

        'manageBooking_customerDetails_fishingCharter',
        'manageBooking_customerDetails_fishingCharter_name',
        'manageBooking_customerDetails_fishingCharter_phoneNumberContainer',
        'manageBooking_customerDetails_fishingCharter_phoneNumber',
        'manageBooking_customerDetails_fishingCharter_dateOfBirth',

        // Manage booking section
        'manageBooking_acceptButton',
        'manageBooking_declineButton',
        'manageBooking_cancelReservationButton',
        'manageBooking_declineCancelTextBox',
        'manageBooking_confirmDeclineCancelButton',
        'manageBooking_confirmDeclineCancelButton_text'
    ];

    allElements.forEach(hide);
}

function showErrorState() {
    // Hide all content
    hideAllContent();

    // Show error message
    alert('Invalid link / Unable to locate reservation.');
}

// =============================================================================
// 8) MAIN INITIALIZATION
// =============================================================================

async function init() {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    const bodyContainer = document.querySelector('[data-element="bodyContainer"]');
    if (bodyContainer) {
        bodyContainer.scrollTop = 0;
    }

    // Show loader and hide all content initially
    showLoader();
    hideAllContent();

    console.log('[INIT] Starting initialization...');
    console.log('[INIT] Current URL:', window.location.href);

    // Parse URL
    const parsed = parseIdFromURL();

    console.log('[INIT] Parsed result:', parsed);

    if (!parsed) {
        console.log('[INIT] ERROR: Failed to parse URL');
        await hideLoader();
        showErrorState();
        return;
    }

    // Store for global access
    window.currentPageData = {
        ...parsed
    };

    // Route to appropriate handler
    if (parsed.type === 'boat') {
        console.log('[INIT] Routing to handleBoatRental');
        await handleBoatRental(parsed);
    } else if (parsed.type === 'charter') {
        console.log('[INIT] Routing to handleFishingCharter');
        await handleFishingCharter(parsed);
    } else {
        console.log('[INIT] ERROR: Unknown type');
        await hideLoader();
        showErrorState();
    }
}

// Prevent browser from restoring scroll position
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Immediately scroll to top
window.scrollTo(0, 0);

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

