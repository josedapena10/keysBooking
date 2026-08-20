
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

// Require sign-in: force the Login-Modal open for signed-out users and block any dismissal
(function () {
    const LOGIN_MODAL_SELECTOR = '[data-element="LoginModal"]';

    const hasSessionToken = (Wized) => {
        const t = Wized && Wized.data && Wized.data.c && Wized.data.c.token;
        return t != null && String(t).trim() !== '';
    };

    const forceOpen = (loginModal) => {
        loginModal.style.setProperty('display', 'flex', 'important');
        document.body.classList.add('no-scroll');
    };

    const lockLoginModal = (loginModal) => {
        forceOpen(loginModal);

        // Re-assert flex if anything (Webflow interactions, close buttons, etc.) tries to hide it
        const observer = new MutationObserver(() => {
            if (loginModal.style.display !== 'flex') {
                forceOpen(loginModal);
            } else {
                document.body.classList.add('no-scroll');
            }
        });
        observer.observe(loginModal, { attributes: true, attributeFilter: ['style', 'class'] });

        // Neutralize close triggers inside the modal so there's no way to reach the page
        loginModal.querySelectorAll('.close_modal').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                forceOpen(loginModal);
            }, true);
        });
    };

    const whenModalReady = (cb) => {
        const existing = document.querySelector(LOGIN_MODAL_SELECTOR);
        if (existing) return cb(existing);

        const start = Date.now();
        const interval = setInterval(() => {
            const el = document.querySelector(LOGIN_MODAL_SELECTOR);
            if (el) {
                clearInterval(interval);
                cb(el);
            } else if (Date.now() - start > 10000) {
                clearInterval(interval);
            }
        }, 100);
    };

    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
        if (!hasSessionToken(Wized)) {
            whenModalReady(lockLoginModal);
        }
    });
})();

// Boat host dashboard. Renders the full page UI inside [data-element="boatHostDashboard"].
// Host identity comes from Wized Load_user; ownership is resolved server side
// (user -> boat_company -> boats -> boat_paymentIntent).
(function () {
    'use strict';

    const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';
    const ROOT_SELECTOR = '[data-element="boatHostDashboard"]';

    // Deep link into the shared manage-booking page (manage-booking-extras.js).
    // Boat format: B<reservationCode>-<paymentIntentId>
    const MANAGE_BOOKING_PATH = '/host/manage-booking';

    // Platform keeps 3% of the boat price on "Request" (on-platform) bookings.
    const PAYOUT_RATE = 0.97;

    const RED = '#EF4444';
    const YELLOW = '#FACC15';
    const GREEN = '#22C55E';
    const GREY = '#9CA3AF';

    const state = {
        userId: null,
        companies: [],
        companyById: {},
        rows: [],
        activeTab: 'requests',
        refs: {}
    };

    // =========================================================================
    // 1) DOM HELPERS
    // =========================================================================

    function el(tag, opts, children) {
        const node = document.createElement(tag);
        const o = opts || {};
        if (o.class) node.className = o.class;
        if (o.text != null) node.textContent = o.text;
        if (o.html != null) node.innerHTML = o.html;
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
        if (document.getElementById('bhd-styles')) return;
        const style = document.createElement('style');
        style.id = 'bhd-styles';
        style.textContent = `
            [data-element="boatHostDashboard"], [data-element="boatHostDashboard"] *, .bhd-overlay, .bhd-overlay * { font-family: 'TT Fors', sans-serif; }
            [data-element="boatHostDashboard"] { color: #111827; }
            .bhd-wrap { display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 1040px; margin: 0 auto; padding: 32px 20px 80px; }
            .bhd-header { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
            .bhd-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: #F3F4F6; }
            .bhd-title { font-size: 24px; font-weight: 600; margin: 0; }
            .bhd-subtitle { font-size: 14px; font-weight: 400; color: #6B7280; margin: 2px 0 0; }
            .bhd-stats { display: flex; gap: 12px; flex-wrap: wrap; }
            .bhd-stat { flex: 1 1 150px; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 16px; background: #fff; }
            .bhd-stat-value { font-size: 22px; font-weight: 600; }
            .bhd-stat-label { font-size: 13px; color: #6B7280; margin-top: 2px; }
            .bhd-tabs { display: flex; gap: 8px; border-bottom: 1px solid #E5E7EB; overflow-x: auto; }
            .bhd-tab { appearance: none; background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 4px; margin-right: 16px; font-family: inherit; font-size: 15px; font-weight: 500; color: #6B7280; cursor: pointer; white-space: nowrap; }
            .bhd-tab:hover { color: #111827; }
            .bhd-tab.is-active { color: #111827; border-bottom-color: #111827; }
            .bhd-tab-count { display: inline-block; min-width: 20px; margin-left: 6px; padding: 1px 6px; border-radius: 999px; background: #111827; color: #fff; font-size: 12px; text-align: center; }
            .bhd-tab:not(.is-active) .bhd-tab-count { background: #E5E7EB; color: #374151; }
            .bhd-list { display: flex; flex-direction: column; gap: 14px; }
            .bhd-card { display: flex; gap: 16px; border: 1px solid #E5E7EB; border-radius: 14px; padding: 16px; background: #fff; cursor: pointer; transition: box-shadow .15s ease, border-color .15s ease; }
            .bhd-card:hover { border-color: #D1D5DB; box-shadow: 0 4px 14px rgba(0,0,0,.06); }
            .bhd-card-img { width: 132px; height: 100px; border-radius: 10px; object-fit: cover; background: #F3F4F6; flex-shrink: 0; }
            .bhd-card-body { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
            .bhd-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
            .bhd-card-name { font-size: 17px; font-weight: 600; }
            .bhd-card-line { font-size: 14px; color: #374151; }
            .bhd-card-muted { font-size: 13px; color: #6B7280; }
            .bhd-card-payout { font-size: 15px; font-weight: 600; }
            .bhd-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #374151; }
            .bhd-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
            .bhd-empty { border: 1px dashed #E5E7EB; border-radius: 14px; padding: 40px 20px; text-align: center; color: #6B7280; font-size: 15px; }
            .bhd-overlay { position: fixed; inset: 0; background: rgba(17,24,39,.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 9999; }
            .bhd-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 620px; max-height: 88vh; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
            .bhd-modal-head { display: flex; gap: 16px; align-items: flex-start; }
            .bhd-modal-img { width: 110px; height: 84px; border-radius: 10px; object-fit: cover; background: #F3F4F6; flex-shrink: 0; }
            .bhd-modal-title { font-size: 19px; font-weight: 600; }
            .bhd-close { margin-left: auto; appearance: none; border: none; background: none; font-size: 26px; line-height: 1; color: #6B7280; cursor: pointer; padding: 0 4px; }
            .bhd-section-title { font-size: 13px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #6B7280; margin-bottom: 10px; }
            .bhd-rows { display: flex; flex-direction: column; gap: 8px; }
            .bhd-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14px; }
            .bhd-row-label { color: #6B7280; flex-shrink: 0; }
            .bhd-row-value { color: #111827; text-align: right; font-weight: 500; }
            .bhd-divider { height: 1px; background: #E5E7EB; }
            .bhd-actions { display: flex; flex-direction: column; gap: 12px; }
            .bhd-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
            .bhd-btn { appearance: none; font-family: inherit; font-size: 15px; font-weight: 500; padding: 11px 20px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
            .bhd-btn[disabled] { opacity: .5; cursor: not-allowed; }
            .bhd-btn-sm { font-size: 14px; padding: 8px 14px; }
            .bhd-card-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
            .bhd-btn-primary { background: #111827; color: #fff; }
            .bhd-btn-secondary { background: #fff; color: #111827; border-color: #D1D5DB; }
            .bhd-note { font-size: 13px; color: #6B7280; }
            .bhd-loader { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 20px; }
            .bhd-spinner { width: 44px; height: 44px; border: 4px solid #F3F4F6; border-top-color: #111827; border-radius: 50%; animation: bhd-spin 1s linear infinite; }
            @keyframes bhd-spin { to { transform: rotate(360deg); } }
            @media (max-width: 640px) {
                .bhd-card { flex-direction: column; }
                .bhd-card-img { width: 100%; height: 160px; }
                .bhd-row { flex-direction: column; gap: 2px; }
                .bhd-row-value { text-align: left; }
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

    function formatDatesList(dates, includeYear) {
        if (!dates || !dates.length) return '';
        const sorted = [...dates].sort();
        return formatRangeYMD(sorted[0], sorted[sorted.length - 1], includeYear);
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
        return `${monthName} ${day}${suffix(day)}, ${dob.getUTCFullYear()} • ${ageFromDob(dobYMD)} years old`;
    }

    function formatBoatingExperience(value) {
        if (value === undefined || value === null) return '';
        const str = String(value).trim();
        if (!str) return '';
        const match = str.match(/^(\d+(?:\.\d+)?)/);
        if (!match) return str;
        const num = parseFloat(match[1]);
        return `${match[1]} ${num === 1 ? 'year' : 'years'}`;
    }

    function capitalize(str) {
        if (!str) return '';
        const s = String(str);
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
        const url = new URL(`${API_BASE}/boat_host_reservations`);
        url.searchParams.set('user_id', userId);
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const err = new Error(`Failed to load boat host reservations (${response.status})`);
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
        const boat = raw.boat || raw._boat || {};
        const stay = raw.stay || raw.reservation || {};
        const guest = raw.guest || raw._guestuser || {};
        const info = raw.additional_info || raw._boat_additionalinfo || {};
        const pricing = Array.isArray(raw.pricing) ? raw.pricing[0] || {} : raw.pricing || {};

        const companyId = pick(raw, ['boat_company_id'], boat.boat_company_id);
        const company = state.companyById[companyId] || state.companies[0] || {};

        return {
            id: raw.id,
            paymentIntent: raw.paymentIntent,
            isCurrent: raw.is_current !== false,
            supersededById: raw.superseded_by_id || raw.new_boat_paymentintent_id || null,
            createdAt: raw.created_at,
            integrationType: pick(raw, ['integration_type'], company.integration_type || ''),

            boatId: raw.boats_id,
            boatName: pick(raw, ['boat_name'], boat.name || 'Boat rental'),
            boatPhoto: photoUrl(raw.boat_photo) || photoUrl(boat.photos),
            boatType: boat.boatType || '',
            maxPassengers: boat.maxPassengers,

            companyId: companyId,
            company: company,

            dates: toDateStrings(raw.dates || raw.boatDates),
            numDays: Number(raw.numDays) || 0,
            lengthType: raw.boatLengthType || '',
            pickupTime: pick(raw, ['boatPickupTime'], null),
            privateDock: raw.boatPrivateDock === true,
            guests: pick(raw, ['boatGuests'], null),

            price: Number(pick(pricing, ['price'], 0)) || 0,
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
                birthDate: pick(guest, ['birth_date', 'Birth_Date'], ''),
                phone: pick(guest, ['phone', 'phoneNumber'], '')
            },

            info: {
                address: info.address || '',
                boatingExperience: info.boatingExperience || '',
                dln: info.dln || '',
                boaterSafetyId: info.boaterSafetyId || '',
                ownABoat: info.ownABoat || '',
                operatedInKeys: info.operatedInKeys || ''
            }
        };
    }

    function firstDate(row) {
        return row.dates.length ? row.dates[0] : null;
    }

    // Mirrors determineStatusVariant() in manage-booking-extras.js so both surfaces agree.
    function getStatus(row) {
        if (!row.isCurrent) return 'superseded';
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
        if (status === 'superseded') return { color: GREY, text: 'Replaced by updated booking' };
        if (status === 'hostCancelled') return { color: RED, text: 'You cancelled' };
        if (status === 'guestCancelled') return { color: RED, text: 'Guest cancelled' };
        if (status === 'declined') return { color: RED, text: 'Request declined' };
        if (status === 'request') return { color: YELLOW, text: 'Pending your response' };
        if (row.paidOut) return { color: GREEN, text: 'Paid out' };
        if (status === 'completed') return { color: GREEN, text: 'Completed' };
        if (row.integrationType === 'Manual') return { color: GREEN, text: 'Accepted (paid directly to you)' };
        if (row.paymentConfirmed) return { color: GREEN, text: 'Confirmed' };
        return { color: GREEN, text: 'Accepted' };
    }

    function payoutAmount(row, status) {
        const price = row.price;
        if (status === 'superseded' || status === 'declined' || status === 'hostCancelled') return 0;

        if (status === 'guestCancelled') {
            if (row.integrationType !== 'Request') return 0;
            if (row.cancellationPolicyDate && row.cancellationDate) {
                const policy = String(row.cancellationPolicyDate).slice(0, 10);
                const cancelled = String(row.cancellationDate).slice(0, 10);
                if (olderThan(cancelled, policy) || cancelled === policy) return 0;
            }
            return price * PAYOUT_RATE;
        }

        if (row.integrationType === 'Manual') return price;
        if (row.integrationType === 'Request') return price * PAYOUT_RATE;
        return price * PAYOUT_RATE;
    }

    function payoutLabel(row, status) {
        const amount = payoutAmount(row, status);
        if (row.integrationType === 'Manual') return `${formatMoney(amount)} (paid directly)`;
        return formatMoney(amount);
    }

    function pickupLocation(row) {
        const address = [row.stay.addressLine1, row.stay.addressLine2].filter(Boolean).join(' ');
        if (row.privateDock) return address ? `Private dock — ${address}` : 'Private dock';

        const docks = row.company.publicDockDeliveryDetails;
        if (row.stay.listingCity && Array.isArray(docks)) {
            const match = docks.find((d) => d && d.city === row.stay.listingCity);
            if (match && match.address) return `Public dock — ${match.address}`;
        }
        return 'Business location';
    }

    // =========================================================================
    // 5) TABS
    // =========================================================================

    const TABS = [
        { id: 'requests', label: 'Requests', statuses: ['request'], sort: 'asc', empty: 'No pending reservation requests right now.' },
        { id: 'upcoming', label: 'Upcoming', statuses: ['accepted'], sort: 'asc', empty: 'No upcoming reservations right now.' },
        { id: 'past', label: 'Past', statuses: ['completed'], sort: 'desc', empty: 'No completed reservations yet.' },
        { id: 'cancelled', label: 'Cancelled & declined', statuses: ['declined', 'guestCancelled', 'hostCancelled', 'superseded'], sort: 'desc', empty: 'No cancelled or declined reservations.' }
    ];

    function rowsForTab(tabId) {
        const tab = TABS.find((t) => t.id === tabId) || TABS[0];
        const filtered = state.rows.filter((row) => tab.statuses.indexOf(getStatus(row)) !== -1);
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
            el('div', { class: 'bhd-wrap' }, [
                el('div', { class: 'bhd-loader' }, [
                    el('div', { class: 'bhd-spinner' }),
                    el('div', { class: 'bhd-note', text: message || 'Loading your reservations...' })
                ])
            ])
        );
    }

    function renderMessage(title, message) {
        const root = getRoot();
        if (!root) return;
        clear(root);
        root.appendChild(
            el('div', { class: 'bhd-wrap' }, [
                el('div', {}, [
                    el('h1', { class: 'bhd-title', text: title }),
                    el('p', { class: 'bhd-subtitle', text: message })
                ])
            ])
        );
    }

    function buildHeader() {
        const company = state.companies[0] || {};
        const avatarUrl = photoUrl(company.profilePic);
        const companyNames = state.companies.map((c) => c.name).filter(Boolean).join(' • ');

        const children = [];
        if (avatarUrl) {
            children.push(el('img', { class: 'bhd-avatar', attrs: { src: avatarUrl, alt: company.name || 'Company' } }));
        }
        children.push(
            el('div', {}, [
                el('h1', { class: 'bhd-title', text: 'Boat rental dashboard' }),
                el('p', { class: 'bhd-subtitle', text: companyNames || 'Your reservations' })
            ])
        );
        return el('div', { class: 'bhd-header' }, children);
    }

    function buildStats() {
        const requests = rowsForTab('requests');
        const upcoming = rowsForTab('upcoming');
        const upcomingPayout = upcoming.reduce((sum, row) => sum + payoutAmount(row, 'accepted'), 0);

        const stat = (value, label) =>
            el('div', { class: 'bhd-stat' }, [
                el('div', { class: 'bhd-stat-value', text: value }),
                el('div', { class: 'bhd-stat-label', text: label })
            ]);

        return el('div', { class: 'bhd-stats' }, [
            stat(String(requests.length), 'Requests awaiting response'),
            stat(String(upcoming.length), 'Upcoming reservations'),
            stat(formatMoney(upcomingPayout), 'Upcoming payout')
        ]);
    }

    function buildTabs() {
        const nav = el('div', { class: 'bhd-tabs' });
        TABS.forEach((tab) => {
            const count = rowsForTab(tab.id).length;
            const button = el('button', {
                class: 'bhd-tab' + (state.activeTab === tab.id ? ' is-active' : ''),
                attrs: { type: 'button' },
                onClick: () => {
                    state.activeTab = tab.id;
                    render();
                }
            }, [el('span', { text: tab.label })]);

            if (count > 0) {
                button.appendChild(el('span', { class: 'bhd-tab-count', text: String(count) }));
            }
            nav.appendChild(button);
        });
        return nav;
    }

    // =========================================================================
    // 7) RENDER — CARDS
    // =========================================================================

    function manageBookingUrl(row) {
        const code = row.stay.reservationCode;
        if (!code || !row.id) return '';
        return `${MANAGE_BOOKING_PATH}?id=B${code}-${row.id}`;
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
        const dates = formatDatesList(row.dates, true);
        const guests = row.guests != null ? `${row.guests} passenger${Number(row.guests) === 1 ? '' : 's'}` : '';
        const pickup = row.pickupTime != null ? `Pickup ${formatTime24To12(row.pickupTime)}` : '';

        const children = [];
        if (row.boatPhoto) {
            children.push(el('img', { class: 'bhd-card-img', attrs: { src: row.boatPhoto, alt: row.boatName } }));
        }

        const secondLine = [dates, guests].filter(Boolean).join(' • ');
        const thirdLine = [pickup, row.stay.reservationCode ? `Trip #${row.stay.reservationCode}` : ''].filter(Boolean).join(' • ');

        const body = el('div', { class: 'bhd-card-body' }, [
            el('div', { class: 'bhd-card-top' }, [
                el('div', { class: 'bhd-card-name', text: row.boatName }),
                el('div', { class: 'bhd-status' }, [
                    el('span', { class: 'bhd-dot', style: { backgroundColor: meta.color } }),
                    el('span', { text: meta.text })
                ])
            ]),
            el('div', { class: 'bhd-card-line', text: guestName }),
            el('div', { class: 'bhd-card-line', text: secondLine }),
            thirdLine ? el('div', { class: 'bhd-card-muted', text: thirdLine }) : null,
            el('div', { class: 'bhd-card-payout', text: `Payout: ${payoutLabel(row, status)}` })
        ]);

        if (status === 'accepted') {
            const days = daysUntil(firstDate(row));
            if (days === 0) body.appendChild(el('div', { class: 'bhd-card-muted', text: 'Happening today' }));
            else if (days === 1) body.appendChild(el('div', { class: 'bhd-card-muted', text: 'Tomorrow' }));
            else if (days > 1) body.appendChild(el('div', { class: 'bhd-card-muted', text: `In ${days} days` }));
        }

        if (status === 'request' || status === 'accepted') {
            const manageButton = buildManageButton(row, 'bhd-btn bhd-btn-secondary bhd-btn-sm');
            if (manageButton) {
                body.appendChild(el('div', { class: 'bhd-card-actions' }, [manageButton]));
            }
        }

        children.push(body);
        return el('div', { class: 'bhd-card', onClick: () => openModal(row) }, children);
    }

    function buildList() {
        const tab = TABS.find((t) => t.id === state.activeTab) || TABS[0];
        const rows = rowsForTab(tab.id);
        if (!rows.length) {
            return el('div', { class: 'bhd-empty', text: tab.empty });
        }
        return el('div', { class: 'bhd-list' }, rows.map(buildCard));
    }

    function render() {
        const root = getRoot();
        if (!root) return;
        clear(root);
        root.appendChild(
            el('div', { class: 'bhd-wrap' }, [buildHeader(), buildStats(), buildTabs(), buildList()])
        );
    }

    // =========================================================================
    // 8) RENDER — DETAIL MODAL
    // =========================================================================

    function detailRow(label, value) {
        if (value === undefined || value === null || value === '') return null;
        return el('div', { class: 'bhd-row' }, [
            el('div', { class: 'bhd-row-label', text: label }),
            el('div', { class: 'bhd-row-value', text: String(value) })
        ]);
    }

    function section(title, rows) {
        const visible = rows.filter(Boolean);
        if (!visible.length) return null;
        return el('div', {}, [
            el('div', { class: 'bhd-section-title', text: title }),
            el('div', { class: 'bhd-rows' }, visible)
        ]);
    }

    function buildTripSection(row, status) {
        const dayLength = row.numDays <= 1 ? (row.lengthType === 'half' ? 'Half day' : 'Full day') : `${row.numDays} days`;
        return section('Reservation details', [
            detailRow('Boat', row.boatName),
            detailRow(row.dates.length === 1 ? 'Date' : 'Dates', formatDatesList(row.dates, true)),
            detailRow('Length', dayLength),
            detailRow('Pickup time', row.pickupTime != null ? formatTime24To12(row.pickupTime) : ''),
            detailRow('Passengers', row.guests != null ? String(row.guests) : ''),
            detailRow('Pickup / delivery', pickupLocation(row)),
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
            detailRow('Stay address', row.privateDock ? '' : address),
            detailRow('City', row.stay.listingCity)
        ]);
    }

    function buildGuestSection(row, status) {
        const requirements = row.company || {};
        const showDetails = status === 'request' || status === 'accepted' || status === 'completed';
        const showContact = status === 'accepted' || status === 'completed';
        const contactNumber = showContact ? (row.stay.guestNumber || row.guest.phone) : '';

        const rows = [
            detailRow('Name', `${row.guest.firstName} ${row.guest.lastName}`.trim()),
            detailRow('Date of birth', formatDobWithAge(row.guest.birthDate)),
            detailRow('Contact number', contactNumber ? formatPhone(contactNumber) : '')
        ];

        if (showDetails) {
            if (requirements.requirements_homeAddress) rows.push(detailRow('Home address', row.info.address));
            if (requirements.requirements_experience) rows.push(detailRow('Boating experience', formatBoatingExperience(row.info.boatingExperience)));
            if (requirements.requirements_driversLicense) rows.push(detailRow("Driver's license", row.info.dln));
            if (requirements.requirements_boaterSafetyId) rows.push(detailRow('Boater safety ID', row.info.boaterSafetyId));
            if (requirements.requirements_ownABoat) rows.push(detailRow('Owns a boat', capitalize(row.info.ownABoat)));
            if (requirements.requirements_operatedInKeys) rows.push(detailRow('Operated in the Keys', capitalize(row.info.operatedInKeys)));
        }

        return section('Guest details', rows);
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
        if (status === 'superseded') {
            rows.push(detailRow('Note', 'The guest changed this booking. A newer reservation replaced it.'));
        }
        return section('Status', rows);
    }

    function closeModal() {
        const overlay = document.querySelector('.bhd-overlay');
        if (overlay) overlay.remove();
    }

    function buildActions(row, status) {
        if (status !== 'request' && status !== 'accepted') return null;
        const manageButton = buildManageButton(row, 'bhd-btn bhd-btn-primary');
        if (!manageButton) return null;

        return el('div', { class: 'bhd-actions' }, [
            el('div', { class: 'bhd-divider' }),
            el('div', { class: 'bhd-btn-row' }, [manageButton]),
            el('div', {
                class: 'bhd-note',
                text: status === 'request'
                    ? 'Accept or decline this request on the manage reservation page.'
                    : 'Cancel this reservation on the manage reservation page.'
            })
        ]);
    }

    function openModal(row) {
        closeModal();
        const status = getStatus(row);
        const meta = statusMeta(row, status);

        const head = el('div', { class: 'bhd-modal-head' }, [
            row.boatPhoto ? el('img', { class: 'bhd-modal-img', attrs: { src: row.boatPhoto, alt: row.boatName } }) : null,
            el('div', {}, [
                el('div', { class: 'bhd-modal-title', text: row.boatName }),
                el('div', { class: 'bhd-status', style: { marginTop: '6px' } }, [
                    el('span', { class: 'bhd-dot', style: { backgroundColor: meta.color } }),
                    el('span', { text: meta.text })
                ])
            ]),
            el('button', { class: 'bhd-close', text: '×', attrs: { type: 'button', 'aria-label': 'Close' }, onClick: closeModal })
        ]);

        const modal = el('div', { class: 'bhd-modal' }, [
            head,
            buildTripSection(row, status),
            buildStaySection(row),
            buildGuestSection(row, status),
            buildStatusSection(row, status),
            buildActions(row, status)
        ]);

        const overlay = el('div', {
            class: 'bhd-overlay',
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
        state.companies = data.companies || (data.company ? [data.company] : []);
        state.companyById = {};
        state.companies.forEach((c) => {
            state.companyById[c.id] = c;
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
                renderMessage('Boat host dashboard', 'This account is not linked to a boat rental company yet.');
            } else {
                renderMessage('Boat host dashboard', 'We could not load your reservations. Please refresh and try again.');
            }
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {
        // Signed-out visitors are held on the locked Login-Modal, so don't boot the dashboard
        const token = Wized && Wized.data && Wized.data.c && Wized.data.c.token;
        if (token == null || String(token).trim() === '') return;

        await Wized.requests.waitFor('Load_user');
        const userId = Wized.data.r.Load_user.data.id;
        window.keysBookingHostUserId = userId;
        if (!getRoot()) return;
        await init(userId);
    });
})();
