
(async function () {
    try {
        const profileButton = document.querySelector('[data-element="profile_button"]');
        const profileButtonDropdown = document.querySelector('[data-element="profile_button_dropdown"]');
        let isPopupOpen = false;

        // Close the dropdown initially
        profileButtonDropdown.style.display = 'none';

        // Function to toggle the dropdown
        const togglePopup = () => {
            isPopupOpen = !isPopupOpen;
            profileButtonDropdown.style.display = isPopupOpen ? 'flex' : 'none';
        };

        // Event listener for profile button click and toggling the dropdown
        profileButton.addEventListener('click', function () {
            togglePopup();
        });

        // Event listener for body click to close the dropdown
        document.body.addEventListener('click', function (evt) {
            if (!profileButton.contains(evt.target) && !profileButtonDropdown.contains(evt.target)) {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            }
        });

        // Event listeners to close the popup when buttons inside are clicked
        const popupButtons = profileButtonDropdown.querySelectorAll('[data-element*="Button"]');
        popupButtons.forEach(button => {
            button.addEventListener('click', function () {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            });
        });

    } catch (err) {
    }
})();


// Fishing charter host dashboard. Renders the full page UI inside [data-element="charterHostDashboard"].
// Host identity comes from Wized Load_user; ownership is resolved server side
// (user -> fishingCharters -> fishingCharters_paymentIntent entries).
//
// One payment intent can hold charter entries belonging to several operators, and accepting one
// requires posting back the whole fishingCharters[] array, so all actions deep link to the
// manage-booking page (manage-booking-extras.js) rather than running here.
(function () {
    'use strict';

    const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';
    const ROOT_SELECTOR = '[data-element="charterHostDashboard"]';

    // Charter format: C<reservationCode>-<paymentIntentId>-<charterId>-<tripId>-<YYYY-MM-DD>
    const MANAGE_BOOKING_PATH = '/host/manage-booking';

    // Platform keeps 3% of the trip subtotal on "Request" (on-platform) bookings.
    const PAYOUT_RATE = 0.97;

    const RED = '#EF4444';
    const YELLOW = '#FACC15';
    const GREEN = '#22C55E';
    const GREY = '#9CA3AF';

    const state = {
        userId: null,
        charters: [],
        charterById: {},
        rows: [],
        activeTab: 'requests',
        charterFilter: 'all'
    };

    // =========================================================================
    // 1) DOM HELPERS
    // =========================================================================

    function el(tag, opts, children) {
        const node = document.createElement(tag);
        const o = opts || {};
        if (o.class) node.className = o.class;
        if (o.text != null) node.textContent = o.text;
        if (o.attrs) Object.keys(o.attrs).forEach((k) => node.setAttribute(k, o.attrs[k]));
        if (o.style) Object.assign(node.style, o.style);
        if (o.onClick) node.addEventListener('click', o.onClick);
        (children || []).forEach((c) => {
            if (c) node.appendChild(c);
        });
        return node;
    }

    function clear(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function injectStyles() {
        if (document.getElementById('chd-styles')) return;
        const style = document.createElement('style');
        style.id = 'chd-styles';
        style.textContent = `
            [data-element="charterHostDashboard"], [data-element="charterHostDashboard"] *, .chd-overlay, .chd-overlay * { font-family: 'TT Fors', sans-serif; }
            [data-element="charterHostDashboard"] { color: #111827; }
            .chd-wrap { display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 1040px; margin: 0 auto; padding: 32px 20px 80px; }
            .chd-header { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
            .chd-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: #F3F4F6; }
            .chd-title { font-size: 24px; font-weight: 600; margin: 0; }
            .chd-subtitle { font-size: 14px; font-weight: 400; color: #6B7280; margin: 2px 0 0; }
            .chd-stats { display: flex; gap: 12px; flex-wrap: wrap; }
            .chd-stat { flex: 1 1 150px; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 16px; background: #fff; }
            .chd-stat-value { font-size: 22px; font-weight: 600; }
            .chd-stat-label { font-size: 13px; color: #6B7280; margin-top: 2px; }
            .chd-tabs { display: flex; gap: 8px; border-bottom: 1px solid #E5E7EB; overflow-x: auto; }
            .chd-tab { appearance: none; background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 4px; margin-right: 16px; font-size: 15px; font-weight: 500; color: #6B7280; cursor: pointer; white-space: nowrap; }
            .chd-tab:hover { color: #111827; }
            .chd-tab.is-active { color: #111827; border-bottom-color: #111827; }
            .chd-tab-count { display: inline-block; min-width: 20px; margin-left: 6px; padding: 1px 6px; border-radius: 999px; background: #111827; color: #fff; font-size: 12px; text-align: center; }
            .chd-tab:not(.is-active) .chd-tab-count { background: #E5E7EB; color: #374151; }
            .chd-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .chd-filter-label { font-size: 14px; color: #6B7280; }
            .chd-select { font-size: 14px; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 8px; background: #fff; color: #111827; }
            .chd-list { display: flex; flex-direction: column; gap: 14px; }
            .chd-card { display: flex; gap: 16px; border: 1px solid #E5E7EB; border-radius: 14px; padding: 16px; background: #fff; cursor: pointer; transition: box-shadow .15s ease, border-color .15s ease; }
            .chd-card:hover { border-color: #D1D5DB; box-shadow: 0 4px 14px rgba(0,0,0,.06); }
            .chd-card-img { width: 132px; height: 100px; border-radius: 10px; object-fit: cover; background: #F3F4F6; flex-shrink: 0; }
            .chd-card-body { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
            .chd-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
            .chd-card-name { font-size: 17px; font-weight: 600; }
            .chd-chip { display: inline-block; margin-left: 8px; padding: 2px 9px; border-radius: 999px; background: #EEF2FF; color: #3730A3; font-size: 12px; font-weight: 600; vertical-align: middle; }
            .chd-dates { display: flex; flex-direction: column; gap: 2px; }
            .chd-card-line { font-size: 14px; color: #374151; }
            .chd-card-muted { font-size: 13px; color: #6B7280; }
            .chd-card-payout { font-size: 15px; font-weight: 600; }
            .chd-card-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
            .chd-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #374151; }
            .chd-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
            .chd-empty { border: 1px dashed #E5E7EB; border-radius: 14px; padding: 40px 20px; text-align: center; color: #6B7280; font-size: 15px; }
            .chd-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 9999; }
            .chd-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 620px; max-height: 88vh; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
            .chd-modal-head { display: flex; gap: 16px; align-items: flex-start; }
            .chd-modal-img { width: 110px; height: 84px; border-radius: 10px; object-fit: cover; background: #F3F4F6; flex-shrink: 0; }
            .chd-modal-title { font-size: 19px; font-weight: 600; }
            .chd-modal-sub { font-size: 14px; color: #6B7280; margin-top: 2px; }
            .chd-close { margin-left: auto; appearance: none; border: none; background: none; font-size: 26px; line-height: 1; color: #6B7280; cursor: pointer; padding: 0 4px; }
            .chd-section-title { font-size: 13px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #6B7280; margin-bottom: 10px; }
            .chd-rows { display: flex; flex-direction: column; gap: 8px; }
            .chd-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14px; }
            .chd-row-label { color: #6B7280; flex-shrink: 0; }
            .chd-row-value { color: #111827; text-align: right; font-weight: 500; }
            .chd-divider { height: 1px; background: #E5E7EB; }
            .chd-actions { display: flex; flex-direction: column; gap: 12px; }
            .chd-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
            .chd-btn { appearance: none; font-size: 15px; font-weight: 500; padding: 11px 20px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
            .chd-btn-sm { font-size: 14px; padding: 8px 14px; }
            .chd-btn-primary { background: #111827; color: #fff; }
            .chd-btn-secondary { background: #fff; color: #111827; border-color: #D1D5DB; }
            .chd-note { font-size: 13px; color: #6B7280; }
            .chd-loader { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 20px; }
            .chd-spinner { width: 44px; height: 44px; border: 4px solid #F3F4F6; border-top-color: #111827; border-radius: 50%; animation: chd-spin 1s linear infinite; }
            @keyframes chd-spin { to { transform: rotate(360deg); } }
            @media (max-width: 640px) {
                .chd-card { flex-direction: column; }
                .chd-card-img { width: 100%; height: 160px; }
                .chd-row { flex-direction: column; gap: 2px; }
                .chd-row-value { text-align: left; }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================================================================
    // 2) FORMATTING HELPERS
    // =========================================================================

    function formatMoney(n) {
        const v = Number(n);
        if (!Number.isFinite(v)) return '$0.00';
        return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatPhone(raw) {
        if (!raw) return '';
        const digits = String(raw).replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        if (digits.length === 11 && digits[0] === '1') {
            return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return String(raw);
    }

    function formatTime24To12(h) {
        if (h === undefined || h === null || h === '') return '';
        const n = Number(h);
        if (!Number.isFinite(n)) return '';
        let hour = Math.floor(n);
        let minutes = Math.round((n - hour) * 60);
        if (minutes >= 60) {
            hour += 1;
            minutes = 0;
        }
        const ampm = hour < 12 ? 'AM' : 'PM';
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    function ymd(d) {
        return d.toISOString().slice(0, 10);
    }

    function parseYMD(str) {
        return new Date(String(str).slice(0, 10) + 'T00:00:00Z');
    }

    function todayUTC() {
        return ymd(new Date());
    }

    function olderThan(aYMD, bYMD) {
        return parseYMD(aYMD).getTime() < parseYMD(bYMD).getTime();
    }

    function formatSingleYMD(str, includeYear) {
        if (!str) return '';
        const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        return includeYear ? `${month} ${date.getUTCDate()}, ${y}` : `${month} ${date.getUTCDate()}`;
    }

    function formatRangeYMD(startYMD, endYMD, includeYear) {
        if (!startYMD || !endYMD) return '';
        const [sY, sM, sD] = String(startYMD).slice(0, 10).split('-').map(Number);
        const [eY, eM, eD] = String(endYMD).slice(0, 10).split('-').map(Number);
        const s = new Date(Date.UTC(sY, sM - 1, sD));
        const e = new Date(Date.UTC(eY, eM - 1, eD));
        const sm = s.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const em = e.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const sd = s.getUTCDate();
        const ed = e.getUTCDate();
        if (includeYear) {
            if (sY === eY && sM === eM && sD === eD) return `${sm} ${sd}, ${sY}`;
            if (sY === eY && sM === eM) return `${sm} ${sd} - ${ed}, ${sY}`;
            if (sY === eY) return `${sm} ${sd} - ${em} ${ed}, ${sY}`;
            return `${sm} ${sd}, ${sY} - ${em} ${ed}, ${eY}`;
        }
        if (sY === eY && sM === eM && sD === eD) return `${sm} ${sd}`;
        if (sY === eY && sM === eM) return `${sm} ${sd} - ${ed}`;
        return `${sm} ${sd} - ${em} ${ed}`;
    }

    // Charter dates can be non-contiguous, so list them rather than showing a range.
    function formatCharterDatesList(dates, includeYear) {
        if (!dates || !dates.length) return '';
        return [...dates].sort().map((d) => formatSingleYMD(d, includeYear)).join(' \u2022 ');
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
        const suffix = (d) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        return `${monthName} ${day}${suffix(day)}, ${dob.getUTCFullYear()} \u2022 ${ageFromDob(dobYMD)} years old`;
    }

    function daysUntil(dateYMD) {
        if (!dateYMD) return null;
        const diff = parseYMD(dateYMD).getTime() - parseYMD(todayUTC()).getTime();
        return Math.round(diff / 86400000);
    }

    // =========================================================================
    // 3) API
    // =========================================================================

    async function fetchDashboardData(userId) {
        const url = new URL(`${API_BASE}/charter_host_reservations`);
        url.searchParams.set('user_id', userId);
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const err = new Error(`Failed to load charter host reservations (${response.status})`);
            err.status = response.status;
            throw err;
        }
        return response.json();
    }

    // =========================================================================
    // 4) NORMALIZATION + STATUS
    // =========================================================================

    function pick(obj, keys, fallback) {
        for (let i = 0; i < keys.length; i++) {
            const v = obj ? obj[keys[i]] : undefined;
            if (v !== undefined && v !== null && v !== '') return v;
        }
        return fallback;
    }

    function toDateStrings(value) {
        if (!Array.isArray(value)) return [];
        return value
            .map((d) => {
                if (typeof d === 'string') return d.slice(0, 10);
                if (d && d.date) return String(d.date).slice(0, 10);
                return null;
            })
            .filter(Boolean)
            .sort();
    }

    function photoUrl(source) {
        if (!source) return '';
        if (typeof source === 'string') return source;
        if (source.url) return source.url;
        if (Array.isArray(source) && source.length) {
            const ordered = source.find((p) => p && p.order === 1) || source[0];
            if (ordered && ordered.image && ordered.image.url) return ordered.image.url;
            if (ordered && ordered.url) return ordered.url;
        }
        return '';
    }

    function normalizeRow(raw) {
        const stay = raw.stay || {};
        const guest = raw.guest || {};
        const pricing = raw.pricing || {};
        const charterId = raw.charterId;
        const charter = state.charterById[charterId] || {};

        return {
            paymentIntentId: raw.pi_id,
            paymentIntent: raw.payment_intent,
            createdAt: raw.created_at,

            charterId: charterId,
            tripId: raw.tripId,
            charter: charter,
            charterName: pick(raw, ['charterName'], charter.name || 'Fishing charter'),
            tripLabel: pick(raw, ['tripLabel'], 'Charter trip'),
            charterPhoto: photoUrl(charter.images),

            dates: toDateStrings(raw.dates),
            numDays: Number(raw.numDays) || 0,
            guests: pick(raw, ['guests'], null),
            pickup: raw.pickup === true,
            integrationType: pick(raw, ['integrationType'], charter.integration_type || ''),

            subtotal: Number(pick(pricing, ['subtotal'], 0)) || 0,
            total: Number(pick(pricing, ['total'], 0)) || 0,
            cancellationPolicyDate: raw.cancellationPolicyDate || null,

            reservationApproved: raw.reservationApproved === true,
            paymentConfirmed: raw.paymentConfirmed === true,
            reservationActive: raw.reservation_active,
            notAvailable: raw.reservation_notAvailable === true,
            declineReason: raw.reservation_notAvailable_textBox || '',
            cancellationDate: raw.cancellation_date || null,
            hostCancellationDate: raw.host_cancellation_date || null,
            cancellationReason: raw.cancellation_reason || '',
            paidOut: raw.paid_out === true,

            stay: {
                reservationCode: pick(stay, ['reservation_code'], ''),
                checkIn: stay.check_in ? String(stay.check_in).slice(0, 10) : '',
                checkOut: stay.check_out ? String(stay.check_out).slice(0, 10) : '',
                guests: stay.guests,
                propertyName: pick(stay, ['property_name'], ''),
                addressLine1: pick(stay, ['address_line_1'], ''),
                addressLine2: pick(stay, ['address_line_2'], ''),
                listingCity: pick(stay, ['listing_city'], ''),
                guestNumber: pick(stay, ['guest_number'], '')
            },

            guest: {
                firstName: pick(guest, ['first_name', 'First_Name'], ''),
                lastName: pick(guest, ['last_name', 'Last_Name'], ''),
                birthDate: pick(guest, ['birth_date', 'Birth_Date'], '')
            }
        };
    }

    function firstDate(row) {
        return row.dates.length ? row.dates[0] : null;
    }

    function tripStartTime(row) {
        const options = row.charter && row.charter.tripOptions;
        if (!Array.isArray(options)) return '';
        const option = options.find((o) => o && String(o.id) === String(row.tripId));
        if (!option || option.tripStartTime === undefined || option.tripStartTime === null) return '';
        return formatTime24To12(option.tripStartTime);
    }

    // Mirrors determineStatusVariant() in manage-booking-extras.js so both surfaces agree.
    function getStatus(row) {
        if (row.hostCancellationDate != null && row.reservationActive === false) return 'hostCancelled';
        if (row.cancellationDate != null && row.reservationActive === false) return 'guestCancelled';
        if (row.notAvailable) return 'declined';

        if (row.reservationApproved && row.reservationActive === true) {
            const first = firstDate(row);
            if (first) {
                const d = parseYMD(first);
                d.setUTCDate(d.getUTCDate() + 1);
                const dayAfterFirst = ymd(d);
                if (olderThan(dayAfterFirst, todayUTC()) || dayAfterFirst === todayUTC()) return 'completed';
            }
            return 'accepted';
        }

        if (!row.reservationApproved && !row.notAvailable && row.cancellationDate == null) return 'request';
        return 'unknown';
    }

    function statusMeta(row, status) {
        if (status === 'hostCancelled') return { color: RED, text: 'You cancelled' };
        if (status === 'guestCancelled') return { color: RED, text: 'Guest cancelled' };
        if (status === 'declined') return { color: RED, text: 'Request declined' };
        if (status === 'request') return { color: YELLOW, text: 'Pending your response' };
        if (row.paidOut) return { color: GREEN, text: 'Paid out' };
        if (status === 'completed') return { color: GREEN, text: 'Completed' };
        if (row.integrationType === 'Manual') return { color: GREEN, text: 'Accepted (paid directly to you)' };
        if (row.paymentConfirmed) return { color: GREEN, text: 'Confirmed' };
        if (status === 'accepted') return { color: GREEN, text: 'Accepted' };
        return { color: GREY, text: 'Unknown' };
    }

    function payoutAmount(row, status) {
        const subtotal = row.subtotal;
        if (status === 'declined' || status === 'hostCancelled') return 0;

        if (status === 'guestCancelled') {
            if (row.integrationType !== 'Request') return 0;
            if (row.cancellationPolicyDate && row.cancellationDate) {
                const policy = String(row.cancellationPolicyDate).slice(0, 10);
                const cancelled = String(row.cancellationDate).slice(0, 10);
                if (olderThan(cancelled, policy) || cancelled === policy) return 0;
            }
            return subtotal * PAYOUT_RATE;
        }

        if (row.integrationType === 'Manual') return subtotal;
        return subtotal * PAYOUT_RATE;
    }

    function payoutLabel(row, status) {
        const amount = payoutAmount(row, status);
        if (row.integrationType === 'Manual') return `${formatMoney(amount)} (paid directly)`;
        return formatMoney(amount);
    }

    function pickupLocation(row) {
        if (!row.pickup) return 'Business location';
        const address = [row.stay.addressLine1, row.stay.addressLine2].filter(Boolean).join(' ');
        return address ? `Private dock — ${address}` : 'Private dock';
    }

    // =========================================================================
    // 5) TABS + FILTERING
    // =========================================================================

    const TABS = [
        { id: 'requests', label: 'Requests', statuses: ['request'], sort: 'asc', empty: 'No pending trip requests right now.' },
        { id: 'upcoming', label: 'Upcoming', statuses: ['accepted'], sort: 'asc', empty: 'No upcoming trips right now.' },
        { id: 'past', label: 'Past', statuses: ['completed'], sort: 'desc', empty: 'No completed trips yet.' },
        { id: 'cancelled', label: 'Cancelled & declined', statuses: ['declined', 'guestCancelled', 'hostCancelled'], sort: 'desc', empty: 'No cancelled or declined trips.' }
    ];

    function rowsForTab(tabId) {
        const tab = TABS.find((t) => t.id === tabId) || TABS[0];
        const filtered = state.rows.filter((row) => {
            if (tab.statuses.indexOf(getStatus(row)) === -1) return false;
            if (state.charterFilter !== 'all' && String(row.charterId) !== String(state.charterFilter)) return false;
            return true;
        });
        filtered.sort((a, b) => {
            const av = firstDate(a) || '';
            const bv = firstDate(b) || '';
            return tab.sort === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        return filtered;
    }

    // =========================================================================
    // 6) RENDER — SHELL
    // =========================================================================

    function getRoot() {
        return document.querySelector(ROOT_SELECTOR);
    }

    function renderLoader(message) {
        const root = getRoot();
        if (!root) return;
        clear(root);
        root.appendChild(
            el('div', { class: 'chd-wrap' }, [
                el('div', { class: 'chd-loader' }, [
                    el('div', { class: 'chd-spinner' }),
                    el('div', { class: 'chd-note', text: message || 'Loading your trips...' })
                ])
            ])
        );
    }

    function renderMessage(title, message) {
        const root = getRoot();
        if (!root) return;
        clear(root);
        root.appendChild(
            el('div', { class: 'chd-wrap' }, [
                el('div', {}, [
                    el('h1', { class: 'chd-title', text: title }),
                    el('p', { class: 'chd-subtitle', text: message })
                ])
            ])
        );
    }

    function buildHeader() {
        const first = state.charters[0] || {};
        const avatarUrl = photoUrl(first.images);
        const names = state.charters.map((c) => c.name).filter(Boolean).join(' • ');

        const children = [];
        if (avatarUrl) {
            children.push(el('img', { class: 'chd-avatar', attrs: { src: avatarUrl, alt: first.name || 'Charter' } }));
        }
        children.push(
            el('div', {}, [
                el('h1', { class: 'chd-title', text: 'Fishing charter dashboard' }),
                el('p', { class: 'chd-subtitle', text: names || 'Your trips' })
            ])
        );
        return el('div', { class: 'chd-header' }, children);
    }

    function buildStats() {
        const requests = rowsForTab('requests');
        const upcoming = rowsForTab('upcoming');
        const upcomingPayout = upcoming.reduce((sum, row) => sum + payoutAmount(row, 'accepted'), 0);

        const stat = (value, label) =>
            el('div', { class: 'chd-stat' }, [
                el('div', { class: 'chd-stat-value', text: value }),
                el('div', { class: 'chd-stat-label', text: label })
            ]);

        return el('div', { class: 'chd-stats' }, [
            stat(String(requests.length), 'Requests awaiting response'),
            stat(String(upcoming.length), 'Upcoming trips'),
            stat(formatMoney(upcomingPayout), 'Upcoming payout')
        ]);
    }

    function buildTabs() {
        const nav = el('div', { class: 'chd-tabs' });
        TABS.forEach((tab) => {
            const count = rowsForTab(tab.id).length;
            const button = el('button', {
                class: 'chd-tab' + (state.activeTab === tab.id ? ' is-active' : ''),
                attrs: { type: 'button' },
                onClick: () => {
                    state.activeTab = tab.id;
                    render();
                }
            }, [el('span', { text: tab.label })]);

            if (count > 0) {
                button.appendChild(el('span', { class: 'chd-tab-count', text: String(count) }));
            }
            nav.appendChild(button);
        });
        return nav;
    }

    // Hosts can own several charter listings, so let them narrow to one.
    function buildCharterFilter() {
        if (state.charters.length < 2) return null;

        const select = el('select', { class: 'chd-select' });
        select.appendChild(el('option', { text: 'All charters', attrs: { value: 'all' } }));
        state.charters.forEach((charter) => {
            select.appendChild(el('option', { text: charter.name || `Charter ${charter.id}`, attrs: { value: String(charter.id) } }));
        });
        select.value = String(state.charterFilter);
        select.addEventListener('change', () => {
            state.charterFilter = select.value;
            render();
        });

        return el('div', { class: 'chd-filters' }, [
            el('span', { class: 'chd-filter-label', text: 'Showing' }),
            select
        ]);
    }

    // =========================================================================
    // 7) RENDER — CARDS
    // =========================================================================

    function manageBookingUrl(row) {
        const code = row.stay.reservationCode;
        const first = firstDate(row);
        if (!code || !row.paymentIntentId || !row.charterId || !row.tripId || !first) return '';
        return `${MANAGE_BOOKING_PATH}?id=C${code}-${row.paymentIntentId}-${row.charterId}-${row.tripId}-${first}`;
    }

    function buildManageButton(row, className) {
        const url = manageBookingUrl(row);
        if (!url) return null;
        return el('a', {
            class: className,
            text: 'Manage reservation',
            attrs: { href: url },
            onClick: (event) => event.stopPropagation()
        });
    }

    function buildCard(row) {
        const status = getStatus(row);
        const meta = statusMeta(row, status);
        const guestName = `${row.guest.firstName} ${row.guest.lastName}`.trim() || 'Guest';
        const dates = formatCharterDatesList(row.dates, true);
        const guests = row.guests != null ? `${row.guests} guest${Number(row.guests) === 1 ? '' : 's'}` : '';
        const startTime = tripStartTime(row);

        const children = [];
        if (row.charterPhoto) {
            children.push(el('img', { class: 'chd-card-img', attrs: { src: row.charterPhoto, alt: row.charterName } }));
        }

        const secondLine = [dates, guests].filter(Boolean).join(' • ');
        const thirdLine = [startTime, row.stay.reservationCode ? `Trip #${row.stay.reservationCode}` : ''].filter(Boolean).join(' • ');

        const nameEl = el('div', { class: 'chd-card-name', text: row.tripLabel });
        if (row.dates.length > 1) {
            nameEl.appendChild(el('span', { class: 'chd-chip', text: `${row.dates.length} trip dates` }));
        }

        const body = el('div', { class: 'chd-card-body' }, [
            el('div', { class: 'chd-card-top' }, [
                nameEl,
                el('div', { class: 'chd-status' }, [
                    el('span', { class: 'chd-dot', style: { backgroundColor: meta.color } }),
                    el('span', { text: meta.text })
                ])
            ]),
            el('div', { class: 'chd-card-muted', text: row.charterName }),
            el('div', { class: 'chd-card-line', text: guestName }),
            el('div', { class: 'chd-card-line', text: secondLine }),
            thirdLine ? el('div', { class: 'chd-card-muted', text: thirdLine }) : null,
            el('div', { class: 'chd-card-payout', text: `Payout: ${payoutLabel(row, status)}` })
        ]);

        if (status === 'accepted') {
            const days = daysUntil(firstDate(row));
            const subject = row.dates.length > 1 ? 'First trip' : 'Trip';
            let countdown = '';
            if (days === 0) countdown = `${subject} is today`;
            else if (days === 1) countdown = `${subject} is tomorrow`;
            else if (days > 1) countdown = `${subject} in ${days} days`;
            if (countdown) body.appendChild(el('div', { class: 'chd-card-muted', text: countdown }));
        }

        if (status === 'request' || status === 'accepted') {
            const manageButton = buildManageButton(row, 'chd-btn chd-btn-secondary chd-btn-sm');
            if (manageButton) {
                body.appendChild(el('div', { class: 'chd-card-actions' }, [manageButton]));
            }
        }

        children.push(body);
        return el('div', { class: 'chd-card', onClick: () => openModal(row) }, children);
    }

    function buildList() {
        const tab = TABS.find((t) => t.id === state.activeTab) || TABS[0];
        const rows = rowsForTab(tab.id);
        if (!rows.length) {
            return el('div', { class: 'chd-empty', text: tab.empty });
        }
        return el('div', { class: 'chd-list' }, rows.map(buildCard));
    }

    function render() {
        const root = getRoot();
        if (!root) return;
        clear(root);
        root.appendChild(
            el('div', { class: 'chd-wrap' }, [
                buildHeader(),
                buildStats(),
                buildTabs(),
                buildCharterFilter(),
                buildList()
            ])
        );
    }

    // =========================================================================
    // 8) RENDER — DETAIL MODAL
    // =========================================================================

    function detailRow(label, value) {
        if (value === undefined || value === null || value === '') return null;
        return el('div', { class: 'chd-row' }, [
            el('div', { class: 'chd-row-label', text: label }),
            el('div', { class: 'chd-row-value', text: String(value) })
        ]);
    }

    function detailRowLines(label, lines) {
        const clean = (lines || []).filter(Boolean);
        if (!clean.length) return null;
        return el('div', { class: 'chd-row' }, [
            el('div', { class: 'chd-row-label', text: label }),
            el('div', { class: 'chd-row-value chd-dates' }, clean.map((text) => el('div', { text: text })))
        ]);
    }

    function section(title, rows) {
        const visible = rows.filter(Boolean);
        if (!visible.length) return null;
        return el('div', {}, [
            el('div', { class: 'chd-section-title', text: title }),
            el('div', { class: 'chd-rows' }, visible)
        ]);
    }

    function buildTripSection(row, status) {
        const multiDate = row.dates.length > 1;
        return section('Trip details', [
            detailRow('Trip', row.tripLabel),
            detailRow('Charter', row.charterName),
            multiDate
                ? detailRowLines(`Dates (${row.dates.length} trips)`, row.dates.map((d) => formatSingleYMD(d, true)))
                : detailRow('Date', formatCharterDatesList(row.dates, true)),
            multiDate ? detailRow('Booked as', 'One booking covering all dates') : null,
            detailRow('Start time', tripStartTime(row)),
            detailRow('Guests', row.guests != null ? String(row.guests) : ''),
            detailRow('Pickup', pickupLocation(row)),
            detailRow('Payout', payoutLabel(row, status)),
            detailRow('Booking type', row.integrationType === 'Manual' ? 'Paid directly to you' : 'Booked through KeysBooking'),
            detailRow('Requested on', row.createdAt ? formatSingleYMD(new Date(row.createdAt).toISOString(), true) : '')
        ]);
    }

    function buildStaySection(row) {
        const stayDates = row.stay.checkIn && row.stay.checkOut
            ? formatRangeYMD(row.stay.checkIn, row.stay.checkOut, true)
            : '';
        const address = [row.stay.addressLine1, row.stay.addressLine2].filter(Boolean).join(' ');
        return section('Guest stay', [
            detailRow('Trip number', row.stay.reservationCode ? `#${row.stay.reservationCode}` : ''),
            detailRow('Stay dates', stayDates),
            detailRow('Property', row.stay.propertyName),
            detailRow('Stay address', row.pickup ? address : ''),
            detailRow('City', row.stay.listingCity)
        ]);
    }

    function buildGuestSection(row, status) {
        const showContact = status === 'accepted' || status === 'completed';
        const contactNumber = showContact ? row.stay.guestNumber : '';
        return section('Guest details', [
            detailRow('Name', `${row.guest.firstName} ${row.guest.lastName}`.trim()),
            detailRow('Date of birth', formatDobWithAge(row.guest.birthDate)),
            detailRow('Contact number', contactNumber ? formatPhone(contactNumber) : '')
        ]);
    }

    function buildStatusSection(row, status) {
        const rows = [];
        if (status === 'guestCancelled') {
            rows.push(detailRow('Guest cancelled on', formatSingleYMD(row.cancellationDate, true)));
            rows.push(detailRow('Reason', row.cancellationReason));
        }
        if (status === 'hostCancelled') {
            rows.push(detailRow('You cancelled on', formatSingleYMD(row.hostCancellationDate, true)));
            rows.push(detailRow('Reason', row.declineReason));
        }
        if (status === 'declined') {
            rows.push(detailRow('Declined on', formatSingleYMD(row.hostCancellationDate, true)));
            rows.push(detailRow('Reason', row.declineReason));
        }
        return section('Status', rows);
    }

    function closeModal() {
        const overlay = document.querySelector('.chd-overlay');
        if (overlay) overlay.remove();
    }

    function buildActions(row, status) {
        if (status !== 'request' && status !== 'accepted') return null;
        const manageButton = buildManageButton(row, 'chd-btn chd-btn-primary');
        if (!manageButton) return null;

        const base = status === 'request'
            ? 'Accept or decline this request on the manage reservation page.'
            : 'Cancel this trip on the manage reservation page.';
        const note = row.dates.length > 1
            ? `${base} All ${row.dates.length} dates are managed together.`
            : base;

        return el('div', { class: 'chd-actions' }, [
            el('div', { class: 'chd-divider' }),
            el('div', { class: 'chd-btn-row' }, [manageButton]),
            el('div', { class: 'chd-note', text: note })
        ]);
    }

    function openModal(row) {
        closeModal();
        const status = getStatus(row);
        const meta = statusMeta(row, status);

        const head = el('div', { class: 'chd-modal-head' }, [
            row.charterPhoto ? el('img', { class: 'chd-modal-img', attrs: { src: row.charterPhoto, alt: row.charterName } }) : null,
            el('div', {}, [
                el('div', { class: 'chd-modal-title', text: row.tripLabel }),
                el('div', { class: 'chd-modal-sub', text: row.charterName }),
                el('div', { class: 'chd-status', style: { marginTop: '6px' } }, [
                    el('span', { class: 'chd-dot', style: { backgroundColor: meta.color } }),
                    el('span', { text: meta.text })
                ])
            ]),
            el('button', { class: 'chd-close', text: '×', attrs: { type: 'button', 'aria-label': 'Close' }, onClick: closeModal })
        ]);

        const modal = el('div', { class: 'chd-modal' }, [
            head,
            buildTripSection(row, status),
            buildStaySection(row),
            buildGuestSection(row, status),
            buildStatusSection(row, status),
            buildActions(row, status)
        ]);

        const overlay = el('div', {
            class: 'chd-overlay',
            onClick: (event) => {
                if (event.target === overlay) closeModal();
            }
        }, [modal]);

        document.body.appendChild(overlay);
    }

    // =========================================================================
    // 9) BOOTSTRAP
    // =========================================================================

    async function refresh() {
        const data = await fetchDashboardData(state.userId);
        state.charters = data.charters || [];
        state.charterById = {};
        state.charters.forEach((c) => {
            state.charterById[c.id] = c;
        });
        state.rows = (data.reservations || []).map(normalizeRow);
        render();
    }

    async function init(userId) {
        injectStyles();
        state.userId = userId;
        renderLoader();
        try {
            await refresh();
        } catch (error) {
            if (error && error.status === 403) {
                renderMessage('Fishing charter dashboard', 'This account is not linked to a fishing charter yet.');
            } else {
                renderMessage('Fishing charter dashboard', 'We could not load your trips. Please refresh and try again.');
            }
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {
        await Wized.requests.waitFor('Load_user');
        const userId = Wized.data.r.Load_user.data.id;
        window.keysBookingHostUserId = userId;
        if (!getRoot()) return;
        await init(userId);
    });
})();
