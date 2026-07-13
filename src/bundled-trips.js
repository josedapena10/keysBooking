



// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // on .open-modal click
    document.querySelectorAll('.open_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
        });
    });

    // on .close-modal click
    document.querySelectorAll('.close_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.remove('no-scroll'));
        });
    });
});





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


window.Wized = window.Wized || [];
window.Wized.push((Wized) => {


    const passwordInput = Wized.elements.get('SignUp_Password');
    const emailInput = Wized.elements.get('SignUp_Email');
    const firstNameInput = Wized.elements.get('SignUp_FirstName');
    const lastNameInput = Wized.elements.get('SignUp_LastName');
    const phoneNumberInput = Wized.elements.get('SignUp_PhoneNumber');
    //const birthdateInput = Wized.elements.get('SignUp_BirthDate');
























    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    // Event listener for when the user leaves the first name input field
    firstNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

    // Event listener for when the user leaves the last name input field
    lastNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

















    phoneNumberInput.node.addEventListener('focus', (event) => {
        const inputElement = event.target;
        if (inputElement.value === '') {
            inputElement.value = '';  // Clear the field when focused if empty
        }
    });

    phoneNumberInput.node.addEventListener('input', handlePhoneNumberInput);
    phoneNumberInput.node.addEventListener('keydown', handlePhoneKeyDown);
    phoneNumberInput.node.addEventListener('change', handlePhoneNumberInput);

    function handlePhoneNumberInput(event) {
        const inputElement = event.target;
        let input = inputElement.value.replace(/[\D-]/g, ''); // Strip non-numeric characters and hyphens
        if (input.length > 10) {
            input = input.substr(0, 10); // Limit to 10 digits
        }

        // Formatting the phone number as the user types
        let formattedNumber = formatPhoneNumber(input);
        inputElement.value = formattedNumber; // Update the field with formatted input
    }

    function handlePhoneKeyDown(event) {
        const key = event.key;
        const inputElement = event.target;

        // Allow control keys such as backspace, tab, enter, etc.
        if (key.length === 1 && !/[0-9]/.test(key)) {
            event.preventDefault(); // Prevent default action for non-numeric keys
        }

        // Prevent input if the current length of digits is 10 or more
        const currentInput = inputElement.value.replace(/[\D-]/g, '');
        if (currentInput.length >= 10 && /[0-9]/.test(key)) {
            event.preventDefault();
        }
    }

    function formatPhoneNumber(input) {
        let formattedNumber = input;
        if (input.length > 2) {
            formattedNumber = input.substr(0, 3) + (input.length > 3 ? '-' : '') + input.substr(3);
        }
        if (input.length > 5) {
            formattedNumber = input.substr(0, 3) + '-' + input.substr(3, 3) + (input.length > 6 ? '-' : '') + input.substr(6);
        }
        return formattedNumber;
    }

























    // // Event listener for focusing on the input field
    // birthdateInput.node.addEventListener('focus', (event) => {
    //     const inputElement = event.target;
    //     if (!inputElement.value.trim()) {
    //         inputElement.value = 'mm/dd/yyyy'; // Set initial placeholder text
    //         highlightText(inputElement, 0, 2); // Highlight 'mm' initially
    //     }
    // });

    // // Function to highlight text within the input
    // function highlightText(inputElement, start, end) {
    //     setTimeout(() => {
    //         inputElement.setSelectionRange(start, end);
    //     }, 10);
    // }

















    const charactersMin = document.querySelector('#charactersMin');
    const containsSymbol = document.querySelector('#containsSymbol');
    const cantContain = document.querySelector('#cantContain');

    // Function to return the SVG with specified fill color and symbol type
    function getSVG(fillColor, isValid = false) {
        if (isValid) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
                    </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
                        <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
                    </svg>`;
        }
    }

    // Initialize SVGs with default grey color
    function initializeSVGs() {
        charactersMin.innerHTML = getSVG("#d4d4d4");
        containsSymbol.innerHTML = getSVG("#d4d4d4");
        cantContain.innerHTML = getSVG("#d4d4d4");
    }

    initializeSVGs(); // Set default SVGs on load

    function normalizeString(str) {
        return str.replace(/[\W_]+/g, '').toLowerCase();
    }

    function validatePassword() {
        const password = passwordInput.node.value; // Remove normalizeString here
        const firstName = normalizeString(firstNameInput.node.value);
        const lastName = normalizeString(lastNameInput.node.value);
        const emailLocalPart = normalizeString(emailInput.node.value.split('@')[0]);

        // Minimum 8 characters check
        charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");

        // Check for symbol or number
        const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
        containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

        // Check for disallowed substrings (firstName, lastName, emailLocalPart)
        let disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
        const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
        cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");
    }


    // Handle password field events to set current validation state
    passwordInput.node.addEventListener('focus', validatePassword);
    passwordInput.node.addEventListener('input', validatePassword);





    // Retrieve the WizedElement instance by its name
    const signUpButton = Wized.elements.get('SignUp_AgreeSubmitButton');

    // Ensure the element is present in the DOM
    if (signUpButton && signUpButton.node) {
        // Add click event listener to the button's DOM node
        signUpButton.node.addEventListener('click', function () {
            // Update the state in the Data Store to indicate the button was clicked
            Wized.data.v.signup_buttonclicked = true;
        });
    } else {
    }









    //forgot password
    //forgot password
    // Handle input rules for ForgotPassword_Email
    const forgotPasswordEmailInput = Wized.elements.get('ForgotPassword_Email');

    // If the element is missing (e.g., different page), skip attaching handlers
    if (!forgotPasswordEmailInput || !forgotPasswordEmailInput.node) {
        return;
    }

    // Add validation logic for ForgotPassword_Email
    forgotPasswordEmailInput.node.addEventListener('focus', (event) => {
        const inputElement = event.target;
        if (inputElement.value === '') {
            inputElement.value = '';  // Clear the field when focused if empty
        }
    });

    forgotPasswordEmailInput.node.addEventListener('input', handleEmailInput);
    forgotPasswordEmailInput.node.addEventListener('keydown', handleEmailKeyDown);
    forgotPasswordEmailInput.node.addEventListener('change', handleEmailInput);

    // Function to handle email input
    function handleEmailInput(event) {
        const inputElement = event.target;
        let input = inputElement.value.replace(/[^a-zA-Z0-9@._-]/g, ''); // Strip invalid characters for email
        inputElement.value = input; // Update the field with sanitized input
    }

    // Function to handle email key down events
    function handleEmailKeyDown(event) {
        const key = event.key;
        const inputElement = event.target;

        // Prevent any characters that are not alphanumeric or standard email characters
        if (!/^[a-zA-Z0-9@._-]$/.test(key) && key.length === 1) {
            event.preventDefault(); // Prevent invalid characters
        }
    }

});



/**
 * Bundled Trips V2 — conversion-focused discovery page.
 * Mounts inside [data-element="bundled-trips-body-container"].
 * Booking logic (package URLs, schedule params, event logging) preserved from bundled-trips.js.
 */
(function () {
    'use strict';

    const API_URL = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/bundled_trips';
    const EVENTLOG_URL = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/bundled_trips_eventlog';
    const EMAIL_LEADS_API = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/email-leads';
    const CONTACT_EMAIL = 'support@keysbooking.com';
    const CONTACT_PHONE = '+17863388401';
    const HOME_URL = '/';
    const HELP_HERO_IMAGE = 'https://cdn.prod.website-files.com/65c420cdaa11ef67a52edb9a/69c432e85f8f42f896932c0e_iStock-483475944%20copy%202%20Large.webp';
    const BLUE = '#0A73FF';
    const BLUE_HOVER = '#005FD6';
    const BLUE_LIGHT = '#EAF3FF';
    const NAVY = '#101828';
    const NAVY_SOFT = '#1D2939';
    const TEXT = '#344054';
    const MUTED = '#667085';
    const BORDER = '#DDE2E8';
    const BORDER_LIGHT = '#EAECF0';
    const PAGE_BG = '#F7F6F2';
    const SECTION_LIGHT = '#F8FAFC';
    const BLUE_SOFT = '#EFF6FF';
    const FONT = "'TT Fors', sans-serif";

    const sessionId = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const params = new URLSearchParams(window.location.search);
    const referenceRaw = params.get('reference') || '';
    const referenceNormalized = referenceRaw.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

    const normalizeForMatch = (str = '') =>
        str.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

    const toTitleLike = (str = '') =>
        normalizeForMatch(str).replace(/\b\w/g, (c) => c.toUpperCase());

    const escapeHtml = (str = '') =>
        String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const formatCurrency = (n) => {
        const num = Number(String(n).replace(/,/g, ''));
        if (Number.isNaN(num)) return '';
        return num.toLocaleString('en-US');
    };

    const logEvent = (payload = {}) => {
        const body = {
            session_id: sessionId,
            on_load: false,
            link_used: referenceRaw,
            linked_used_name: referenceNormalized ? toTitleLike(referenceRaw) : '',
            on_link_click: false,
            link_clicked: '',
            link_clicked_trip_name: '',
            ...payload,
        };
        try {
            fetch(EVENTLOG_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                keepalive: true,
            }).catch(() => { });
        } catch (_) { }
    };

    /* ── Package schedule (unchanged from bundled-trips.js) ── */
    const PACKAGE_SCHEDULE_FALLBACK_BY_TRIP_ID = {
        3: { boatStartOffset: 1, boatLength: 7, charterSlots: [{ tripId: 1, offsets: [1] }, { tripId: 3, offsets: [3] }] },
        214: { boatStartOffset: 1, boatLength: 7, charterSlots: [] },
        307: { boatStartOffset: 2, boatLength: 5, charterSlots: [{ tripId: 5, offsets: [1] }] },
        216: { boatStartOffset: 1, boatLength: 7, charterSlots: [{ tripId: 1, offsets: [1] }, { tripId: 9, offsets: [3] }] },
        303: { boatStartOffset: 1, boatLength: 7, charterSlots: [] },
        308: { boatStartOffset: 1, boatLength: 7, charterSlots: [{ tripId: 1, offsets: [1] }, { tripId: 1, offsets: [3] }] },
        285: { charterSlots: [{ tripId: 8, offsets: [0, 3, 5] }] },
        302: { boatStartOffset: 1, boatLength: 7, charterSlots: [{ tripId: 1, offsets: [1] }, { tripId: 4, offsets: [3] }] },
        297: { boatStartOffset: 1, boatLength: 7, charterSlots: [{ tripId: 3, offsets: [1] }, { tripId: 8, offsets: [3] }] },
    };

    const parseJsonField = (value) => {
        if (value == null || value === '') return null;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return null; }
        }
        return null;
    };

    const parseCharterOffsetsValue = (value) => {
        if (Array.isArray(value)) return value.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
        if (typeof value === 'string' && value.trim()) {
            return value.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
        }
        return [];
    };

    const normalizeCharterSlotEntry = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const tripIdRaw = raw.tripId ?? raw.trip_id;
        const tripId = tripIdRaw != null && tripIdRaw !== '' ? Number(tripIdRaw) : null;
        const offsets = parseCharterOffsetsValue(raw.offsets ?? raw.dayOffsets ?? raw.day_offsets);
        if (offsets.length === 0) return null;
        return { tripId: Number.isNaN(tripId) ? null : tripId, offsets };
    };

    const parseCharterSlotsFromSchedule = (scheduleJson) => {
        if (!scheduleJson || typeof scheduleJson !== 'object') return [];
        const raw = scheduleJson.charterSlots ?? scheduleJson.charter_slots;
        if (!Array.isArray(raw)) return [];
        return raw.map(normalizeCharterSlotEntry).filter(Boolean);
    };

    const charterSlotsToFlatOffsets = (slots) => {
        if (!Array.isArray(slots) || slots.length === 0) return [];
        return slots.flatMap((slot) => slot.offsets);
    };

    const buildCharterSlotsFromJunction = (fishingcharters, flatOffsets) => {
        if (!Array.isArray(fishingcharters) || fishingcharters.length === 0) {
            return flatOffsets.map((offset) => ({ tripId: null, offsets: [offset] }));
        }
        return fishingcharters
            .map((charter, index) => {
                const offset = flatOffsets[index];
                if (offset == null || Number.isNaN(Number(offset))) return null;
                return { tripId: charter?.trip_id != null ? Number(charter.trip_id) : null, offsets: [Number(offset)] };
            })
            .filter(Boolean);
    };

    const getCharterOffsetsFromFishingCharters = (trip) => {
        if (!Array.isArray(trip?.fishingcharters) || trip.fishingcharters.length === 0) return [];
        const offsets = trip.fishingcharters.map((charter) => {
            const raw = charter?.day_offset ?? charter?.charter_day_offset ?? charter?.dayOffset;
            if (raw == null || raw === '') return NaN;
            return Number(raw);
        });
        if (offsets.some((n) => Number.isNaN(n))) return [];
        return offsets;
    };

    const getPackageScheduleFromTrip = (trip) => {
        const packageNights = Number(trip?.trip_nights) || 7;
        const scheduleFromJson = parseJsonField(trip?.package_schedule);
        let boatStartOffset = null;
        let boatLength = null;
        let charterOffsets = [];
        let charterSlots = [];

        if (scheduleFromJson && typeof scheduleFromJson === 'object') {
            boatStartOffset = scheduleFromJson.boatStartOffset ?? scheduleFromJson.boat_start_offset;
            boatLength = scheduleFromJson.boatLength ?? scheduleFromJson.boat_length;
            charterSlots = parseCharterSlotsFromSchedule(scheduleFromJson);
            charterOffsets = parseCharterOffsetsValue(scheduleFromJson.charterOffsets ?? scheduleFromJson.charter_offsets);
        } else {
            const rowBoatStart = trip?.boat_start_offset ?? trip?.package_boat_start_offset;
            const rowBoatLength = trip?.boat_length ?? trip?.package_boat_length;
            const rowCharterOffsets = trip?.charter_offsets ?? trip?.package_charter_offsets;
            if (rowBoatStart != null && rowBoatStart !== '') boatStartOffset = Number(rowBoatStart);
            if (rowBoatLength != null && rowBoatLength !== '') boatLength = Number(rowBoatLength);
            charterOffsets = parseCharterOffsetsValue(rowCharterOffsets);
        }

        if (!charterSlots.length && charterOffsets.length > 0 && Array.isArray(trip?.fishingcharters)) {
            charterSlots = buildCharterSlotsFromJunction(trip.fishingcharters, charterOffsets);
        }
        if (!charterOffsets.length && trip?.hasFishingCharter) {
            charterOffsets = getCharterOffsetsFromFishingCharters(trip);
            if (!charterSlots.length && charterOffsets.length > 0) {
                charterSlots = buildCharterSlotsFromJunction(trip.fishingcharters, charterOffsets);
            }
        }

        const fallback = PACKAGE_SCHEDULE_FALLBACK_BY_TRIP_ID[trip?.id];
        if (fallback) {
            if (trip?.hasBoatRental) {
                if ((boatStartOffset == null || Number.isNaN(boatStartOffset)) && fallback.boatStartOffset != null) {
                    boatStartOffset = fallback.boatStartOffset;
                }
                if ((boatLength == null || Number.isNaN(boatLength) || boatLength <= 0) && fallback.boatLength != null) {
                    boatLength = fallback.boatLength;
                }
            }
            if (trip?.hasFishingCharter && !charterSlots.length) {
                if (Array.isArray(fallback.charterSlots) && fallback.charterSlots.length > 0) {
                    charterSlots = fallback.charterSlots.map(normalizeCharterSlotEntry).filter(Boolean);
                } else if (Array.isArray(fallback.charterOffsets) && fallback.charterOffsets.length > 0) {
                    charterOffsets = fallback.charterOffsets;
                    charterSlots = buildCharterSlotsFromJunction(trip.fishingcharters, charterOffsets);
                }
            }
        }

        if (charterSlots.length > 0) charterOffsets = charterSlotsToFlatOffsets(charterSlots);

        if (trip?.hasBoatRental) {
            if (boatStartOffset == null || Number.isNaN(boatStartOffset)) boatStartOffset = 1;
            if (boatLength == null || Number.isNaN(boatLength) || boatLength <= 0) boatLength = packageNights;
        } else {
            boatStartOffset = null;
            boatLength = 0;
        }

        return { packageNights, boatStartOffset, boatLength, charterOffsets, charterSlots };
    };

    const buildPackageListingUrl = (trip) => {
        if (!trip?.trip_link) return trip?.trip_link || '';
        let url;
        try { url = new URL(trip.trip_link); } catch {
            try { url = new URL(trip.trip_link, window.location.origin); } catch { return trip.trip_link; }
        }
        const schedule = getPackageScheduleFromTrip(trip);
        url.searchParams.set('package', 'true');
        url.searchParams.set('packageNights', String(schedule.packageNights));
        url.searchParams.set('scheduleNights', String(schedule.packageNights));
        if (trip.hasBoatRental && schedule.boatLength > 0) {
            url.searchParams.set('boatStartOffset', String(schedule.boatStartOffset ?? 1));
            url.searchParams.set('boatLength', String(schedule.boatLength));
        }
        if (trip.hasFishingCharter && schedule.charterOffsets.length > 0) {
            url.searchParams.set('charterOffsets', schedule.charterOffsets.join(','));
        }
        if (trip.hasFishingCharter && schedule.charterSlots.length > 0) {
            url.searchParams.set('charterSlots', JSON.stringify(schedule.charterSlots.map((slot) => ({
                tripId: slot.tripId,
                offsets: slot.offsets,
            }))));
        }
        if (trip.id != null) url.searchParams.set('bundledTripId', String(trip.id));
        return url.toString();
    };

    const getFirstPhotoUrl = (photos) => {
        if (!Array.isArray(photos)) return '';
        const ordered = photos.find((p) => p?.order === 1 && p?.image?.url);
        if (ordered?.image?.url) return ordered.image.url;
        const fallback = photos.find((p) => p?.image?.url);
        return fallback?.image?.url || '';
    };

    const getCharterOptionName = (charter) => {
        const tripId = charter?.trip_id;
        return charter?._fishingcharter?.tripOptions?.find((opt) => opt?.id === tripId)?.name || '';
    };

    const getCharterCompanyName = (charter) => {
        const company = (
            charter?._fishingcharter?.name
            || charter?._fishingcharter?.companyName
            || charter?.charterName
            || charter?.companyName
            || ''
        ).trim();
        return company;
    };

    const getCharterTripType = (name = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('offshore')) return 'Offshore';
        if (lower.includes('reef')) return 'Reef';
        if (lower.includes('inshore')) return 'Inshore';
        if (lower.includes('wreck')) return 'Wreck';
        return 'Fishing';
    };

    const getCharterDurationLabel = (name = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('full day')) return 'Full Day';
        if (lower.includes('half day')) return 'Half Day';
        return 'Charter';
    };

    const parseDetailsText = (html = '') => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const sections = {};
        let currentKey = null;

        wrapper.childNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'H4') {
                const label = (node.textContent || '').trim().toLowerCase();
                if (label.includes('overview')) currentKey = 'overview';
                else if (label.includes('included')) currentKey = 'included';
                else if (label.includes('how it works')) currentKey = 'howItWorks';
                else if (label.includes('good to know')) currentKey = 'goodToKnow';
                else if (label.includes('customize')) currentKey = 'customize';
                else currentKey = null;
                if (currentKey && !sections[currentKey]) sections[currentKey] = [];
            } else if (currentKey) {
                sections[currentKey].push(node.outerHTML);
            }
        });

        const text = wrapper.textContent || '';
        const totalMatch = text.match(/\$([0-9,]+)\s*total/i) || text.match(/around\s*\$([0-9,]+)/i);
        const ppMatch = text.match(/~\$([0-9,]+)\s*pp/i) || text.match(/\$([0-9,]+)\s*per person/i);
        const guestMatch = text.match(/crew of (\d+)/i) || text.match(/group of (\d+)/i) || text.match(/preset for (\d+) guests/i);

        const listItems = (key) => {
            const items = [];
            const div = document.createElement('div');
            (sections[key] || []).forEach((h) => { div.innerHTML += h; });
            div.querySelectorAll('li').forEach((li) => {
                const t = (li.textContent || '').trim();
                if (t) items.push(t);
            });
            return items;
        };

        const paragraphs = (key) => {
            const div = document.createElement('div');
            (sections[key] || []).forEach((h) => { div.innerHTML += h; });
            return Array.from(div.querySelectorAll('p')).map((p) => (p.textContent || '').trim()).filter(Boolean);
        };

        return {
            startingTotalPrice: totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : null,
            estimatedPerPersonPrice: ppMatch ? Number(ppMatch[1].replace(/,/g, '')) : null,
            estimatedGuestCount: guestMatch ? Number(guestMatch[1]) : null,
            includedItems: listItems('included'),
            howItWorks: listItems('howItWorks'),
            goodToKnow: listItems('goodToKnow'),
            customizeText: paragraphs('customize').join(' '),
            overviewLines: paragraphs('overview'),
        };
    };

    const formatBathroomsShort = (value) => {
        const num = Number(value);
        if (Number.isNaN(num)) return null;
        return `${num} bath${num === 1 ? '' : 's'}`;
    };

    /**
     * Xano bundled_trips fields read by v2 (add these columns to bundled_trips):
     *
     * short_description       text      Card one-liner under location (~1-2 sentences)
     * why_you_will_love_it    text      Expanded "Why You'll Love This Trip" paragraph
     *
     * Optional pricing fields (otherwise parsed from details_text):
     * starting_total_price    decimal
     * estimated_per_person_price decimal
     * estimated_guest_count   integer
     */
    const getTripField = (trip, ...keys) => {
        for (const key of keys) {
            const value = trip?.[key];
            if (value != null && String(value).trim() !== '') return String(value).trim();
        }
        return '';
    };

    const getTripLinkParams = (trip) => {
        if (!trip?.trip_link) return new URLSearchParams();
        try {
            return new URL(trip.trip_link).searchParams;
        } catch {
            try {
                return new URL(trip.trip_link, window.location.origin).searchParams;
            } catch {
                return new URLSearchParams();
            }
        }
    };

    const isTruthyParam = (value) => {
        const v = String(value || '').toLowerCase();
        return v === 'true' || v === '1' || v === 'yes';
    };

    const getCharterPickupFlags = (params) => {
        const flags = [];
        params.forEach((value, key) => {
            if (/^fishingCharterPickup\d+$/i.test(key)) {
                flags.push(isTruthyParam(value));
            }
        });
        return flags;
    };

    /**
     * Location rules:
     * - boatDelivery=true (and stay has private dock) → delivered to private dock, left docked there.
     * - Stay has private dock but boatDelivery is false → pickup at a nearby dock (not the stay dock).
     * - Stay without private dock → pickup / leave docked at the boat rental location.
     * - Charter fishingCharterPickupN=true → pickup at stay dock; otherwise pickup at charter location.
     */
    const getPackageLocationInfo = (property, trip) => {
        const hasPrivateDock = Boolean(property?.private_dock);
        const hasBoat = Boolean(trip?.hasBoatRental);
        const hasCharter = Boolean(trip?.hasFishingCharter);
        const params = getTripLinkParams(trip);
        const boatDelivery = hasBoat && hasPrivateDock && isTruthyParam(params.get('boatDelivery'));
        const boatPickupTimeRaw = params.get('boatPickupTime') || '';
        const boatPickupTime = String(boatPickupTimeRaw).trim();
        const boatPickupTimeLabel = boatPickupTime
            ? (/pickup/i.test(boatPickupTime) ? boatPickupTime : `${boatPickupTime} pickup`)
            : '';
        const charterPickupFlags = getCharterPickupFlags(params);

        const amenities = [];
        if (property?.dock_maxBoatLength) amenities.push(`Up to ${property.dock_maxBoatLength}`);
        if (property?.dock_shorePower) amenities.push('Shore power');
        if (property?.dock_freshWater) amenities.push('Fresh water');
        if (property?.dock_cleaningStation) amenities.push('Cleaning station');
        if (property?.dock_light) amenities.push('Dock lights');
        if (property?.dock_underwaterLight) amenities.push('Underwater lights');

        let boatLocation = '';
        let boatStatLabel = '';
        let boatPickupLabel = '';
        let boatOvernightLabel = '';
        if (hasBoat) {
            if (boatDelivery) {
                boatPickupLabel = boatPickupTimeLabel
                    ? `Private dock delivery · ${boatPickupTimeLabel}`
                    : 'Private dock delivery';
                boatOvernightLabel = 'Leave docked at private dock';
                boatLocation = 'Boat is delivered to the stay’s private dock and stays there overnight.';
                boatStatLabel = 'Private dock delivery';
            } else if (hasPrivateDock) {
                boatPickupLabel = boatPickupTimeLabel
                    ? `${boatPickupTimeLabel} at nearby dock`
                    : 'Pickup at nearby dock';
                boatOvernightLabel = 'Leave docked at nearby dock';
                boatLocation = boatPickupTimeLabel
                    ? `You'll pick the boat up at a nearby dock (${boatPickupTimeLabel}). Between uses, leave it docked there, not at the stay’s private dock.`
                    : "You'll pick the boat up at a nearby dock. Between uses, leave it docked there, not at the stay’s private dock.";
                boatStatLabel = 'Pickup at nearby dock · leave docked there';
            } else {
                boatPickupLabel = boatPickupTimeLabel
                    ? `${boatPickupTimeLabel} at boat rental location`
                    : 'Pickup at boat rental location';
                boatOvernightLabel = 'Leave docked at boat rental location';
                boatLocation = boatPickupTimeLabel
                    ? `You'll pick the boat up at the boat rental location (${boatPickupTimeLabel}). Between uses, leave it docked there, not at your stay.`
                    : "You'll pick the boat up at the boat rental location. Between uses, leave it docked there, not at your stay.";
                boatStatLabel = 'Pickup at boat rental location · leave docked there';
            }
        }

        let charterLocation = '';
        let charterStatLabel = '';
        if (hasCharter) {
            if (charterPickupFlags.length === 0) {
                charterLocation = hasPrivateDock
                    ? 'Confirm fishing charter pickup location during checkout.'
                    : 'Fishing charter meets at the charter dock around 9am.';
                charterStatLabel = hasPrivateDock ? '' : 'Charter dock 9am';
            } else if (charterPickupFlags.every(Boolean)) {
                charterLocation = 'Fishing charter pickup is at the stay’s private dock.';
                charterStatLabel = 'Private dock pickup';
            } else if (charterPickupFlags.every((v) => !v)) {
                charterLocation = 'Fishing charter meets at the charter dock around 9am.';
                charterStatLabel = 'Charter dock 9am';
            } else {
                charterLocation = 'Some charters pick up at the private dock; others meet at the charter dock.';
                charterStatLabel = 'Mixed pickup';
            }
        }

        const noteParts = [];
        if (hasPrivateDock) {
            const max = property?.dock_maxBoatLength ? ` (up to ${property.dock_maxBoatLength})` : '';
            noteParts.push(`Stay has a private dock${max}`);
        }
        if (boatLocation) noteParts.push(boatLocation.replace(/\.$/, ''));
        if (charterLocation && charterStatLabel) noteParts.push(charterLocation.replace(/\.$/, ''));

        return {
            hasPrivateDock,
            hasBoat,
            hasCharter,
            boatDelivery,
            boatPickupTime,
            boatPickupTimeLabel,
            boatLocation,
            boatStatLabel,
            boatPickupLabel,
            boatOvernightLabel,
            charterLocation,
            charterStatLabel,
            maxBoatLength: property?.dock_maxBoatLength || '',
            amenities,
            packageNote: noteParts.length ? `${noteParts.join('. ')}.` : '',
        };
    };

    const buildIncludedComponents = ({
        trip,
        schedule,
        locationInfo,
        boatLabel,
        boatDays,
        stayGuestCount,
        nights,
    }) => {
        const components = [];
        const property = trip?._property;

        const stayMeta = [];
        if (stayGuestCount) stayMeta.push(`Sleeps ${stayGuestCount}`);
        if (property?.num_beds != null && property.num_beds !== '') {
            const n = Number(property.num_beds);
            stayMeta.push(`${n} bed${n === 1 ? '' : 's'}`);
        }
        if (property?.num_bedrooms != null && property.num_bedrooms !== '') {
            const n = Number(property.num_bedrooms);
            stayMeta.push(`${n} BR`);
        }
        const baths = formatBathroomsShort(property?.num_bathrooms);
        if (baths) stayMeta.push(baths);
        if (locationInfo?.hasPrivateDock) stayMeta.push('Private dock');

        components.push({
            kind: 'stay',
            emoji: '🏠',
            typeLabel: 'Private stay',
            title: property?.property_name || `${nights}-night Florida Keys stay`,
            meta: stayMeta.join(' · '),
            timing: nights ? `${nights} nights` : '',
        });

        if (trip?.hasBoatRental && schedule.boatLength > 0) {
            const start = schedule.boatStartOffset ?? 1;
            const boatMeta = [];
            const max = trip?._boat?.maxPassengers
                ?? trip?._boat?.max_passengers
                ?? trip?._boat?.passengerLimit
                ?? trip?._boat?.passenger_limit;
            if (max != null && max !== '' && Number(max) > 0) boatMeta.push(`${Number(max)} passengers max`);
            if (boatDays || schedule.boatLength) boatMeta.push(`${boatDays || schedule.boatLength}-day rental`);
            if (locationInfo?.boatPickupLabel) boatMeta.push(locationInfo.boatPickupLabel);
            if (locationInfo?.boatOvernightLabel) boatMeta.push(locationInfo.boatOvernightLabel);

            components.push({
                kind: 'boat',
                emoji: '🚤',
                typeLabel: 'Boat rental',
                title: boatLabel || 'Boat rental',
                meta: boatMeta.join(' · '),
                timing: dayRangeLabel(start, schedule.boatLength),
            });
        }

        const pushCharterComponent = (charter, timing) => {
            const optionName = charter ? getCharterOptionName(charter) : '';
            const duration = getCharterDurationLabel(optionName);
            const type = getCharterTripType(optionName);
            const guestLimit = charter ? getCharterGuestLimit(charter) : null;
            const tripLabel = optionName || `${duration} ${type}`.trim() || 'Fishing charter';
            const title = tripLabel;
            const charterMeta = [];
            if (guestLimit) charterMeta.push(`${guestLimit} guests max`);
            if (locationInfo?.charterStatLabel) charterMeta.push(locationInfo.charterStatLabel);
            components.push({
                kind: 'charter',
                emoji: '🎣',
                typeLabel: 'Fishing charter',
                title,
                meta: charterMeta.join(' · '),
                timing: timing || '',
            });
        };

        if (trip?.hasFishingCharter) {
            const slots = Array.isArray(schedule.charterSlots) ? schedule.charterSlots : [];
            if (slots.length) {
                slots.forEach((slot, slotIndex) => {
                    const offsets = Array.isArray(slot.offsets) ? slot.offsets : [];
                    const charter = (trip.fishingcharters || [])[slotIndex];
                    if (offsets.length) {
                        offsets.forEach((offset) => pushCharterComponent(charter, dayLabelFromOffset(offset)));
                    } else {
                        pushCharterComponent(charter, '');
                    }
                });
            } else if (Array.isArray(schedule.charterOffsets) && schedule.charterOffsets.length) {
                schedule.charterOffsets.forEach((offset, index) => {
                    pushCharterComponent((trip.fishingcharters || [])[index], dayLabelFromOffset(offset));
                });
            }
        }

        return components;
    };

    const getCharterGuestLimit = (charter) => {
        const tripId = charter?.trip_id;
        const tripOption = charter?._fishingcharter?.tripOptions?.find((opt) => opt?.id === tripId);
        if (tripOption?.pricePeople != null && tripOption.pricePeople !== '') {
            return Number(tripOption.pricePeople);
        }
        const boatInfo = charter?._fishingcharter?.boatInfo;
        if (Array.isArray(boatInfo) && boatInfo[0]?.boatCapacity != null) {
            return Number(boatInfo[0].boatCapacity);
        }
        return null;
    };

    const resolveShortDescription = (trip) => {
        const fromDb = getTripField(trip, 'short_description', 'card_summary', 'package_summary', 'trip_summary');
        if (fromDb) return fromDb;
        console.warn('[bt2] Add short_description to bundled_trips for:', trip?.trip_name, '(id:', trip?.id, ')');
        return '';
    };

    const resolveWhyYouWillLove = (trip) => {
        const fromDb = getTripField(trip, 'why_you_will_love_it', 'why_youll_love_it', 'trip_highlight');
        if (fromDb) return fromDb;
        return '';
    };

    const toPositiveNumber = (value) => {
        if (value == null || value === '') return null;
        const num = Number(String(value).replace(/,/g, ''));
        return Number.isFinite(num) && num > 0 ? num : null;
    };

    /** Offset 0 = check-in day → display as Day 1 */
    const dayLabelFromOffset = (offset) => {
        const day = Number(offset);
        if (Number.isNaN(day)) return '';
        return `Day ${day + 1}`;
    };

    const dayRangeLabel = (startOffset, length) => {
        const start = Number(startOffset);
        const days = Number(length) || 1;
        if (Number.isNaN(start) || days < 1) return '';
        const startDay = start + 1;
        const endDay = start + days;
        if (days === 1) return `Day ${startDay}`;
        return `Days ${startDay} to ${endDay}`;
    };

    const buildPackageItinerary = (trip, schedule, locationInfo, charters, boatLabel, boatDays) => {
        const nights = schedule.packageNights || Number(trip?.trip_nights) || 7;
        const steps = [];

        steps.push({
            day: 1,
            dayLabel: 'Day 1',
            emoji: '🏠',
            title: 'Check-in',
            detail: `${nights}-night stay starts`,
            kind: 'stay',
        });

        if (trip?.hasBoatRental && schedule.boatLength > 0) {
            const start = schedule.boatStartOffset ?? 1;
            const startLabel = dayLabelFromOffset(start);
            const endLabel = dayLabelFromOffset(start + schedule.boatLength - 1);
            const rangeLabel = dayRangeLabel(start, schedule.boatLength);
            let detail;
            if (locationInfo?.boatPickupLabel && locationInfo?.boatOvernightLabel) {
                detail = `${locationInfo.boatPickupLabel} · ${locationInfo.boatOvernightLabel}`;
            } else if (locationInfo?.boatDelivery) {
                detail = 'Private dock delivery';
            } else if (locationInfo?.hasPrivateDock) {
                detail = locationInfo.boatPickupTimeLabel
                    ? `Pickup at nearby dock · leave docked there · ${locationInfo.boatPickupTimeLabel}`
                    : 'Pickup at nearby dock · leave docked there';
            } else {
                detail = locationInfo.boatPickupTimeLabel
                    ? `Pickup at boat rental location · leave docked there · ${locationInfo.boatPickupTimeLabel}`
                    : 'Pickup at boat rental location · leave docked there';
            }
            steps.push({
                day: Number(start) + 1,
                dayLabel: rangeLabel || (startLabel === endLabel ? startLabel : `${startLabel} to ${endLabel}`),
                emoji: '🚤',
                title: boatLabel || 'Boat rental',
                detail: `${boatDays || schedule.boatLength}-day rental · ${detail}`,
                kind: 'boat',
            });
        }

        if (trip?.hasFishingCharter && Array.isArray(schedule.charterSlots) && schedule.charterSlots.length) {
            schedule.charterSlots.forEach((slot, slotIndex) => {
                const offsets = Array.isArray(slot.offsets) ? slot.offsets : [];
                const charterFromTrip = (trip.fishingcharters || [])[slotIndex];
                const companyName = charterFromTrip ? getCharterCompanyName(charterFromTrip) : '';
                const name = charterFromTrip
                    ? getCharterOptionName(charterFromTrip)
                    : (charters[slotIndex]?.name || 'Fishing charter');
                const duration = getCharterDurationLabel(name);
                const type = getCharterTripType(name);
                const pickup = locationInfo?.charterStatLabel === 'Private dock pickup'
                    ? 'Private dock pickup'
                    : locationInfo?.charterStatLabel === 'Mixed pickup'
                        ? 'Confirm pickup during checkout'
                        : (locationInfo?.charterStatLabel || 'Charter dock 9am');
                const title = name && name !== 'Fishing charter' ? name : `${duration} ${type}`.trim();
                const detailParts = [];
                if (companyName && companyName !== name) detailParts.push(companyName);
                detailParts.push(pickup);

                offsets.forEach((offset) => {
                    steps.push({
                        day: Number(offset) + 1,
                        dayLabel: dayLabelFromOffset(offset),
                        emoji: '🎣',
                        title,
                        detail: detailParts.join(' · '),
                        kind: 'charter',
                    });
                });
            });
        } else if (trip?.hasFishingCharter && schedule.charterOffsets?.length) {
            schedule.charterOffsets.forEach((offset, index) => {
                const charter = (trip.fishingcharters || [])[index];
                const companyName = charter ? getCharterCompanyName(charter) : '';
                const name = charter ? getCharterOptionName(charter) : 'Fishing charter';
                const duration = getCharterDurationLabel(name);
                const type = getCharterTripType(name);
                const pickup = locationInfo?.charterStatLabel === 'Private dock pickup'
                    ? 'Private dock pickup'
                    : locationInfo?.charterStatLabel || 'Charter dock 9am';
                const title = name && name !== 'Fishing charter' ? name : `${duration} ${type}`.trim();
                const detailParts = [];
                if (companyName && companyName !== name) detailParts.push(companyName);
                detailParts.push(pickup);
                steps.push({
                    day: Number(offset) + 1,
                    dayLabel: dayLabelFromOffset(offset),
                    emoji: '🎣',
                    title,
                    detail: detailParts.join(' · '),
                    kind: 'charter',
                });
            });
        }

        steps.push({
            day: nights + 1,
            dayLabel: `Day ${nights + 1}`,
            emoji: '👋',
            title: 'Checkout',
            detail: 'Trip ends',
            kind: 'checkout',
        });

        return steps.sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            const order = { stay: 0, charter: 1, boat: 2, checkout: 3 };
            return (order[a.kind] ?? 9) - (order[b.kind] ?? 9);
        });
    };

    const tripToPackage = (trip, isReferenceMatch = false) => {
        const parsed = parseDetailsText(trip?.details_text || '');
        const schedule = getPackageScheduleFromTrip(trip);
        const nights = Number(trip?.trip_nights) || schedule.packageNights || 7;

        const startingTotalPrice =
            toPositiveNumber(trip?.starting_total_price) ??
            parsed.startingTotalPrice;
        const guestCount =
            toPositiveNumber(trip?.estimated_guest_count) ??
            parsed.estimatedGuestCount ??
            toPositiveNumber(trip?._property?.num_guests) ??
            6;
        const stayGuestCount = toPositiveNumber(trip?._property?.num_guests) || guestCount;
        let perPerson =
            toPositiveNumber(trip?.estimated_per_person_price) ??
            parsed.estimatedPerPersonPrice;
        if (!perPerson && startingTotalPrice && guestCount) {
            perPerson = Math.round(startingTotalPrice / guestCount);
        }

        const boatDays = schedule.boatLength || nights;
        const charters = (trip?.fishingcharters || []).map((c) => ({
            name: getCharterOptionName(c),
            tripType: getCharterTripType(getCharterOptionName(c)),
            durationLabel: getCharterDurationLabel(getCharterOptionName(c)),
        }));

        const mainImage =
            trip?._property?._property_main_image?.property_image?.url ||
            getFirstPhotoUrl(trip?._boat?.photos) ||
            '';

        const boatName = trip?._boat?.name || '';
        const boatSize = trip?._boat?.length ? `${trip._boat.length}ft` : '';
        const boatLabel = boatName || (boatSize ? `${boatSize} Boat` : 'Boat Rental');

        const locationInfo = getPackageLocationInfo(trip?._property, trip);
        const itinerary = buildPackageItinerary(trip, schedule, locationInfo, charters, boatLabel, boatDays);
        const includedComponents = buildIncludedComponents({
            trip,
            schedule,
            locationInfo,
            boatLabel,
            boatDays,
            stayGuestCount,
            nights,
        });

        return {
            id: String(trip.id),
            title: trip.trip_name || '',
            location: trip?._property?.listing_city_state || 'Florida Keys, FL',
            isFeatured: Boolean(isReferenceMatch),
            mainImage,
            shortDescription: resolveShortDescription(trip),
            startingTotalPrice,
            estimatedPerPersonPrice: perPerson,
            estimatedGuestCount: guestCount,
            stayGuestCount,
            nights,
            itinerary,
            includedComponents,
            charterCount: Array.isArray(trip?.fishingcharters) ? trip.fishingcharters.length : 0,
            locationInfo,
            whyYouWillLoveIt: resolveWhyYouWillLove(trip),
            includedItems: parsed.includedItems,
            goodToKnow: parsed.goodToKnow,
            customizationOptions: [
                'Swap the boat or charter',
                'Add or remove a fishing day',
                'Extend your stay beyond the package nights',
            ],
            listingUrl: buildPackageListingUrl(trip),
        };
    };

    /* ── Emojis + minimal UI icons ── */
    const EMOJI = {
        stay: '🏠',
        boat: '🚤',
        charter: '🎣',
        pin: '📍',
        phone: '📞',
        email: '✉️',
        play: '🌴',
        guests: '👥',
        trustStay: '🏡',
        trustBoat: '🚤',
        trustCharter: '🎣',
        trustFollowers: '📱',
        check: '✓',
    };

    const icons = {
        chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    };

    const FAQ_ITEMS = [
        { q: 'Can I customize a package?', a: 'Yes. Keep it as shown, or change the stay, boat, charters, and dates before you book, based on what’s available.' },
        { q: 'Is the per-person price what I pay?', a: 'No. You pay one private trip total. The per-person number is only that total divided by the example group size.' },
        { q: 'Why does the price change with dates?', a: 'Rates change by season and availability. The price here is a starting point. Pick dates on the listing to see your exact total.' },
        { q: 'Do I need boating experience?', a: 'Usually yes for bareboat rentals. You’ll answer a few questions at checkout, and the rental company reviews your request.' },
        { q: 'What happens after I book?', a: 'You pay for the stay at checkout. Boat and charter requests go to the operators. Once approved, each is charged separately on the card on file. Most replies come within 24 hours.' },
        { q: 'Are boats and charters private?', a: 'Yes. Package boats and fishing charters are private for your group. Not everyone staying has to join the charter. Most charters allow up to 6 guests.' },
    ];

    const BENEFITS = [
        { icon: EMOJI.trustStay, title: 'Already coordinated', text: 'Stay, boat, and fishing days lined up so you skip the scramble of booking each piece alone.' },
        { icon: EMOJI.trustBoat, title: 'One place to book', text: 'Review the full package, make changes, and check out without chasing separate vendors.' },
        { icon: EMOJI.trustCharter, title: 'Private on the water', text: 'Boat rentals and fishing charters in these packages are for your group only.' },
        { icon: EMOJI.trustFollowers, title: 'Talk to locals', text: 'Questions before or after booking? Call or email the Keys Booking team.' },
    ];

    let openPackageAccordion = null;
    let openFaqAccordion = null;

    function injectStyles() {
        if (document.getElementById('bt2-styles')) return;
        const style = document.createElement('style');
        style.id = 'bt2-styles';
        style.textContent = `
            [data-element="bundled-trips-body-container"] {
                --bt2-primary: ${BLUE};
                --bt2-primary-hover: ${BLUE_HOVER};
                --bt2-primary-light: ${BLUE_LIGHT};
                --bt2-navy: ${NAVY};
                --bt2-text: ${TEXT};
                --bt2-muted: ${MUTED};
                --bt2-border: ${BORDER};
                --bt2-border-light: ${BORDER_LIGHT};
                --bt2-page: ${PAGE_BG};
                --bt2-section-light: ${SECTION_LIGHT};
                --bt2-blue-soft: ${BLUE_SOFT};
                font-family: ${FONT};
                color: var(--bt2-text);
                background: var(--bt2-page);
                line-height: 1.6;
                font-size: 16px;
                -webkit-font-smoothing: antialiased;
            }
            [data-element="bundled-trips-body-container"] *, [data-element="bundled-trips-body-container"] *::before, [data-element="bundled-trips-body-container"] *::after { box-sizing: border-box; }
            .bt2-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
            .bt2-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                min-height: 50px; padding: 0 26px; border-radius: 8px;
                font-family: ${FONT}; font-size: 16px; font-weight: 700;
                text-decoration: none; cursor: pointer; border: none;
                transition: background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
            }
            .bt2-btn:focus-visible { outline: 3px solid rgba(10,115,255,.28); outline-offset: 2px; }
            .bt2-btn--primary { background: var(--bt2-primary); color: #fff; }
            .bt2-btn--primary:hover { background: var(--bt2-primary-hover); }
            .bt2-btn--primary:disabled { opacity: .55; cursor: not-allowed; }
            .bt2-btn--outline { background: rgba(0,0,0,.12); color: #fff; border: 2px solid rgba(255,255,255,.9); min-height: 52px; }
            .bt2-btn--outline:hover { background: rgba(255,255,255,.1); }
            .bt2-btn--ghost {
                background: transparent; color: rgba(255,255,255,.92); border: 0; min-height: 44px;
                padding: 0 10px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px;
            }
            .bt2-btn--ghost:hover { color: #fff; background: transparent; }
            .bt2-btn--full { width: 100%; }
            .bt2-hero-wrap {
                position: relative; background: var(--bt2-navy);
                width: 100vw; max-width: 100vw;
                margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);
            }
            .bt2-hero {
                position: relative; width: 100%; max-width: none; min-height: 520px;
                display: flex; align-items: flex-end;
                background: var(--bt2-navy) center/cover no-repeat;
            }
            .bt2-hero__overlay {
                position: absolute; inset: 0;
                background:
                    linear-gradient(180deg, rgba(5,18,35,.55) 0%, rgba(5,18,35,.78) 55%, rgba(5,18,35,.88) 100%),
                    linear-gradient(90deg, rgba(5,18,35,.82) 0%, rgba(5,18,35,.45) 55%, rgba(5,18,35,.2) 100%);
            }
            .bt2-hero__inner {
                position: relative; z-index: 1; width: 100%;
                display: flex; flex-direction: column; align-items: flex-start; gap: 18px;
                padding: 72px 24px 56px; max-width: 1200px; margin: 0 auto;
            }
            .bt2-hero__content { max-width: 640px; width: 100%; }
            .bt2-hero__pill {
                display: inline-flex; align-items: center; gap: 6px;
                background: rgba(10,115,255,.22); color: #c6dbff;
                border: 1px solid rgba(158,197,255,.4); border-radius: 999px;
                padding: 7px 14px; font-size: 11px; font-weight: 800;
                letter-spacing: .06em; text-transform: uppercase; margin-bottom: 16px;
            }
            .bt2-hero h1 {
                margin: 0 0 12px; font-size: 46px; font-weight: 700; color: #fff;
                line-height: 1.08; letter-spacing: -.03em; max-width: 11ch;
            }
            .bt2-hero__text { margin: 0 0 22px; font-size: 18px; color: rgba(255,255,255,.9); line-height: 1.5; max-width: 38ch; }
            .bt2-hero__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 8px; }
            .bt2-hero__contact {
                margin: 16px 0 0; padding: 0; border: 0; background: transparent;
                font-size: 14px; line-height: 1.45; font-weight: 500;
                color: rgba(255,255,255,.7); white-space: nowrap;
            }
            .bt2-hero__contact a {
                color: #fff; font-weight: 650; text-decoration: underline;
                text-underline-offset: 3px; text-decoration-thickness: 1px;
            }
            .bt2-hero__contact a:hover { opacity: .9; }
            .bt2-trust {
                position: relative; z-index: 2; margin-top: -20px;
                padding: 0 24px 28px; background: transparent;
            }
            .bt2-trust__panel {
                max-width: 1200px; margin: 0 auto;
                background: #fff; border: 1px solid var(--bt2-border-light);
                border-radius: 12px; box-shadow: 0 4px 16px rgba(16,24,40,.05);
                padding: 16px 18px;
            }
            .bt2-trust__grid {
                display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px 16px;
                align-items: start;
            }
            .bt2-trust__item {
                display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                gap: 4px; text-align: center; padding: 4px 6px; min-width: 0;
            }
            .bt2-trust__num {
                font-size: 18px; font-weight: 800; color: var(--bt2-navy); margin: 0; line-height: 1.15;
            }
            .bt2-trust__label {
                font-size: 12px; font-weight: 600; color: var(--bt2-muted); margin: 0; line-height: 1.3;
            }
            .bt2-section { padding: 80px 0; }
            .bt2-section--packages { padding-top: 56px; }
            .bt2-section--alt { background: var(--bt2-section-light); }
            .bt2-section__head { text-align: center; max-width: 720px; margin: 0 auto 48px; }
            .bt2-section__head h2 { margin: 0 0 12px; font-size: 34px; font-weight: 700; color: var(--bt2-navy); line-height: 1.2; }
            .bt2-section__head p { margin: 0 0 8px; font-size: 16px; color: var(--bt2-text); line-height: 1.6; }
            .bt2-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 24px; }
            .bt2-card {
                background: #fff; border: 1px solid var(--bt2-border); border-radius: 14px;
                overflow: hidden; box-shadow: 0 6px 20px rgba(16,24,40,.06);
                display: flex; flex-direction: column;
                transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
            }
            .bt2-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(16,24,40,.1); }
            .bt2-card--featured {
                border-color: #7CB3FF; box-shadow: 0 10px 32px rgba(10,115,255,.18);
                outline: 2px solid rgba(10,115,255,.25); outline-offset: 0;
            }
            .bt2-featured-label {
                display: inline-flex; align-items: center; gap: 6px;
                margin: 0 0 10px; padding: 5px 10px;
                background: #EEF5FF; border: 1px solid #C8DCFF; border-radius: 999px;
                font-size: 12px; font-weight: 700; color: #175CD3;
            }
            .bt2-card__media { position: relative; aspect-ratio: 16/10; background: #e8edf2; }
            .bt2-card__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .bt2-card__badge {
                position: absolute; top: 12px; left: 12px;
                padding: 6px 10px; border-radius: 999px;
                font-size: 11px; font-weight: 800; text-transform: uppercase;
                letter-spacing: .04em; color: #fff;
            }
            .bt2-card__badge--blue { background: #0A73FF; }
            .bt2-card__badge--green { background: #12B76A; }
            .bt2-card__badge--purple { background: #7F56D9; }
            .bt2-card__badge--gold { background: #D99A00; }
            .bt2-card__stack {
                position: absolute; left: 12px; right: 12px; bottom: 12px;
                display: flex; flex-wrap: wrap; gap: 6px;
            }
            .bt2-card__stack-chip {
                display: inline-flex; align-items: center; gap: 4px;
                padding: 5px 8px; border-radius: 999px;
                background: rgba(5,18,35,.78); color: #fff;
                font-size: 11px; font-weight: 700; line-height: 1; backdrop-filter: blur(4px);
            }
            .bt2-card__body { padding: 18px; flex: 1; display: flex; flex-direction: column; }
            .bt2-card__title { margin: 0 0 6px; font-size: 19px; font-weight: 700; color: var(--bt2-navy); line-height: 1.25; }
            .bt2-card__meta {
                display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px;
                font-size: 13px; color: var(--bt2-muted); margin-bottom: 10px;
            }
            .bt2-card__meta span { display: inline-flex; align-items: center; gap: 4px; }
            .bt2-card__summary {
                margin: 0 0 12px; font-size: 14px; color: var(--bt2-text); line-height: 1.45;
            }
            .bt2-pricing {
                background: #F4F8FF; border: 1px solid #DCEBFF; border-radius: 10px;
                padding: 12px 14px; margin: 0 0 12px;
            }
            .bt2-pricing__from { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--bt2-muted); }
            .bt2-pricing__total { margin: 2px 0 4px; line-height: 1; color: var(--bt2-navy); }
            .bt2-pricing__amount { font-size: 30px; font-weight: 700; }
            .bt2-pricing__suffix { font-size: 13px; font-weight: 700; margin-left: 4px; }
            .bt2-pricing__pp { font-size: 13px; font-weight: 600; color: var(--bt2-text); margin: 0; }
            .bt2-pricing__note { font-size: 12px; color: var(--bt2-muted); margin: 6px 0 0; line-height: 1.35; }
            .bt2-card__cta { margin: 0 0 14px; }
            .bt2-card__reassure {
                margin: 8px 0 0; text-align: center; font-size: 12px;
                font-weight: 600; color: var(--bt2-muted); line-height: 1.3;
            }
            .bt2-btn--secondary {
                background: #fff; color: var(--bt2-navy);
                border: 1.5px solid var(--bt2-border);
            }
            .bt2-btn--secondary:hover { border-color: var(--bt2-primary); background: var(--bt2-primary-light); }
            .bt2-included {
                background: transparent; border: 0; border-top: 1px solid var(--bt2-border-light);
                border-radius: 0; padding: 12px 0 4px; margin: 0 0 4px;
            }
            .bt2-included__label {
                margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: .05em;
                text-transform: uppercase; color: var(--bt2-muted);
            }
            .bt2-included__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
            .bt2-included__item { display: flex; gap: 8px; align-items: flex-start; }
            .bt2-included__emoji {
                flex-shrink: 0; width: 28px; height: 28px; border-radius: 7px;
                background: var(--bt2-section-light); border: 1px solid var(--bt2-border-light);
                display: grid; place-items: center; font-size: 14px; line-height: 1;
            }
            .bt2-included__body { min-width: 0; flex: 1; }
            .bt2-included__top {
                display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 10px;
            }
            .bt2-included__type {
                font-size: 11px; font-weight: 800; letter-spacing: .04em;
                text-transform: uppercase; color: var(--bt2-primary);
            }
            .bt2-included__timing {
                font-size: 11px; font-weight: 700; color: var(--bt2-muted); white-space: nowrap;
            }
            .bt2-included__title {
                margin: 1px 0 0; font-size: 13px; font-weight: 700; color: var(--bt2-navy); line-height: 1.3;
            }
            .bt2-mid-cta {
                display: none; grid-column: 1 / -1;
                background: linear-gradient(135deg, #0B3B75 0%, #0A73FF 100%);
                border: 0; border-radius: 14px;
                padding: 20px 22px; align-items: center; justify-content: space-between; gap: 16px 20px;
                box-shadow: 0 8px 22px rgba(10,115,255,.18);
            }
            .bt2-mid-cta__copy { min-width: 0; flex: 1; }
            .bt2-mid-cta .bt2-card__badge {
                position: static; display: inline-flex; margin: 0 0 8px;
            }
            .bt2-mid-cta__copy h3 {
                margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #fff; line-height: 1.2;
            }
            .bt2-mid-cta__copy > p {
                margin: 0; font-size: 14px; color: rgba(255,255,255,.88); line-height: 1.45; max-width: 42ch;
            }
            .bt2-mid-cta__steps {
                list-style: none; margin: 12px 0 0; padding: 0;
                display: grid; gap: 6px;
            }
            .bt2-mid-cta__steps li {
                display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 8px;
                align-items: center; font-size: 13px; font-weight: 650; color: #fff; line-height: 1.3;
            }
            .bt2-mid-cta__num {
                width: 20px; height: 20px; border-radius: 50%;
                background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35);
                display: grid; place-items: center;
                font-size: 10px; font-weight: 800; line-height: 1; color: #fff;
            }
            .bt2-mid-cta .bt2-btn {
                flex-shrink: 0; white-space: nowrap; align-self: center;
                min-height: 44px; padding: 0 18px; font-size: 14px;
                background: #fff; color: var(--bt2-navy); border: 0;
            }
            .bt2-mid-cta .bt2-btn:hover { background: #F0F7FF; }
            @media (min-width: 993px) { .bt2-mid-cta--desktop { display: flex; } }
            @media (min-width: 768px) and (max-width: 992px) { .bt2-mid-cta--tablet { display: flex; } }
            @media (max-width: 767px) {
                .bt2-mid-cta--mobile { display: flex; flex-direction: column; align-items: stretch; text-align: left; padding: 18px 16px; }
                .bt2-mid-cta--mobile .bt2-btn { width: 100%; align-self: stretch; }
                .bt2-mid-cta__copy h3 { font-size: 18px; }
            }
            .bt2-accordion-btn {
                display: flex; align-items: center; justify-content: center; gap: 6px;
                width: 100%; background: transparent; border: 0; padding: 8px 0 0;
                font-family: ${FONT}; font-size: 13px; font-weight: 600;
                text-decoration: underline; color: var(--bt2-muted); cursor: pointer; margin-top: auto;
            }
            .bt2-accordion-btn:hover { color: var(--bt2-navy); }
            .bt2-accordion-btn svg { transition: transform .2s ease; }
            .bt2-accordion-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
            .bt2-accordion-panel { overflow: hidden; max-height: 0; transition: max-height .22s ease; }
            .bt2-accordion-panel.is-open { max-height: 2800px; }
            .bt2-details { padding: 14px 0 2px; border-top: 1px solid var(--bt2-border-light); margin-top: 10px; }
            .bt2-details h4 {
                margin: 20px 0 10px; font-size: 12px; font-weight: 800; color: var(--bt2-muted);
                letter-spacing: .06em; text-transform: uppercase;
            }
            .bt2-details h4:first-child { margin-top: 0; }
            .bt2-details p { margin: 0 0 10px; font-size: 14px; color: var(--bt2-text); line-height: 1.6; }
            .bt2-details ul { margin: 0 0 4px; padding-left: 0; list-style: none; font-size: 14px; color: var(--bt2-text); }
            .bt2-details ul li {
                position: relative; padding-left: 14px; margin-bottom: 8px; line-height: 1.55;
            }
            .bt2-details ul li::before {
                content: ''; position: absolute; left: 0; top: .55em;
                width: 5px; height: 5px; border-radius: 50%; background: #98A2B3;
            }
            .bt2-itinerary {
                list-style: none; margin: 0 0 4px; padding: 0;
                border: 1px solid var(--bt2-border-light); border-radius: 10px; overflow: hidden;
            }
            .bt2-itinerary li {
                display: flex; flex-direction: column; gap: 4px;
                padding: 12px 14px; margin: 0; font-size: 14px; line-height: 1.5;
                color: var(--bt2-text); background: #fff;
                border-bottom: 1px solid var(--bt2-border-light);
            }
            .bt2-itinerary li:last-child { border-bottom: 0; }
            .bt2-itinerary li:nth-child(even) { background: #F8FAFC; }
            .bt2-itinerary__day {
                font-size: 11px; font-weight: 800; color: var(--bt2-muted);
                letter-spacing: .04em; text-transform: uppercase;
            }
            .bt2-itinerary__body { min-width: 0; }
            .bt2-itinerary__title { margin: 0; font-weight: 650; color: var(--bt2-navy); line-height: 1.35; }
            .bt2-itinerary__detail { margin: 3px 0 0; font-size: 13px; color: var(--bt2-muted); line-height: 1.45; }
            .bt2-steps {
                list-style: none; margin: 0 0 4px; padding: 0; counter-reset: bt2how;
            }
            .bt2-steps li {
                counter-increment: bt2how; position: relative;
                padding: 0 0 12px 28px; margin: 0; font-size: 14px;
                color: var(--bt2-text); line-height: 1.5;
            }
            .bt2-steps li:last-child { padding-bottom: 0; }
            .bt2-steps li::before {
                content: counter(bt2how);
                position: absolute; left: 0; top: 0;
                width: 18px; height: 18px;
                font-size: 11px; font-weight: 800; line-height: 18px; text-align: center;
                color: var(--bt2-muted); background: transparent; border: 0;
            }
            .bt2-customize-box {
                background: #F8FAFC; border: 1px solid var(--bt2-border-light);
                border-radius: 10px; padding: 14px 16px; margin-top: 4px;
            }
            .bt2-customize-box p { margin: 0 0 8px; font-size: 14px; font-weight: 650; color: var(--bt2-navy); }
            .bt2-customize-box ul { margin: 0; }
            .bt2-customize-box li { margin-bottom: 6px; }
            .bt2-customize-box li:last-child { margin-bottom: 0; }
            .bt2-benefits { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
            .bt2-benefit { text-align: center; padding: 8px; }
            .bt2-benefit__icon {
                width: 48px; height: 48px; margin: 0 auto 12px;
                background: var(--bt2-blue-soft); border-radius: 10px;
                display: grid; place-items: center; font-size: 24px; line-height: 1;
            }
            .bt2-benefit h3 { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: var(--bt2-navy); }
            .bt2-benefit p { margin: 0; font-size: 13px; color: var(--bt2-muted); line-height: 1.5; }
            .bt2-faq { max-width: 760px; margin: 0 auto; border: 1px solid var(--bt2-border); border-radius: 10px; overflow: hidden; background: #fff; }
            .bt2-faq-item { border-bottom: 1px solid var(--bt2-border-light); }
            .bt2-faq-item:last-child { border-bottom: none; }
            .bt2-faq-btn {
                width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
                padding: 18px 20px; background: #fff; border: none; text-align: left;
                font-family: ${FONT}; font-size: 15px; font-weight: 650; color: var(--bt2-navy); cursor: pointer;
            }
            .bt2-faq-btn svg { flex-shrink: 0; transition: transform .2s; color: var(--bt2-muted); }
            .bt2-faq-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
            .bt2-faq-panel { overflow: hidden; max-height: 0; transition: max-height .22s ease; }
            .bt2-faq-panel.is-open { max-height: 400px; }
            .bt2-faq-panel p { margin: 0; padding: 0 20px 18px; font-size: 15px; color: #475467; line-height: 1.6; }
            .bt2-final-cta {
                position: relative;
                display: flex; align-items: center; justify-content: center;
                min-height: 320px; padding: 88px 24px; text-align: center;
                background: var(--bt2-navy) center/cover no-repeat;
                width: 100vw; max-width: 100vw;
                margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);
            }
            .bt2-final-cta__overlay {
                position: absolute; inset: 0;
                background:
                    linear-gradient(180deg, rgba(5,18,35,.72) 0%, rgba(5,18,35,.82) 100%),
                    linear-gradient(90deg, rgba(5,18,35,.55) 0%, rgba(5,18,35,.35) 100%);
            }
            .bt2-final-cta__inner {
                position: relative; z-index: 1;
                width: 100%; max-width: 680px; margin: 0 auto;
                display: flex; flex-direction: column; align-items: center;
            }
            .bt2-final-cta h2 {
                margin: 0 0 12px; font-size: 40px; font-weight: 700; color: #fff;
                line-height: 1.15; letter-spacing: -.02em;
            }
            .bt2-final-cta p {
                margin: 0 0 28px; font-size: 18px; color: rgba(255,255,255,.9);
                line-height: 1.5; max-width: 36ch;
            }
            .bt2-final-cta__actions {
                display: flex; flex-wrap: wrap; gap: 12px;
                justify-content: center; align-items: center;
            }
            .bt2-final-cta__actions .bt2-btn {
                min-width: 180px;
            }
            .bt2-skeleton { background: linear-gradient(90deg,#eef1f4 25%,#f6f8fa 50%,#eef1f4 75%); background-size: 200% 100%; animation: bt2-shimmer 1.4s infinite; border-radius: 8px; }
            @keyframes bt2-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            .bt2-skeleton-card { height: 520px; border-radius: 14px; border: 1px solid var(--bt2-border); overflow: hidden; background: #fff; }
            .bt2-skeleton-card__img { height: 200px; }
            .bt2-skeleton-card__body { padding: 20px; }
            .bt2-skeleton-line { height: 14px; margin-bottom: 10px; }
            .bt2-skeleton-line--lg { height: 22px; width: 70%; }
            .bt2-skeleton-line--md { width: 50%; }
            .bt2-fallback { text-align: center; padding: 48px 24px; background: #fff; border-radius: 14px; border: 1px solid var(--bt2-border); grid-column: 1 / -1; }
            .bt2-fallback p { margin: 0 0 16px; font-size: 16px; color: var(--bt2-text); }
            .bt2-card.is-loaded { animation: bt2-fade-in .3s ease; }
            @keyframes bt2-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 992px) {
                .bt2-hero h1 { font-size: 40px; max-width: none; }
                .bt2-section__head h2 { font-size: 30px; }
                .bt2-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
                .bt2-benefits { grid-template-columns: repeat(2,1fr); }
                .bt2-section { padding: 64px 0; }
                .bt2-final-cta { min-height: 280px; padding: 72px 32px; }
                .bt2-final-cta h2 { font-size: 34px; }
                .bt2-final-cta p { font-size: 16px; margin-bottom: 24px; }
            }
            @media (max-width: 767px) {
                .bt2-wrap { padding: 0 16px; }
                .bt2-hero { min-height: auto; }
                .bt2-hero__inner { padding: 48px 16px 64px; gap: 16px; }
                .bt2-hero__content { max-width: none; }
                .bt2-hero h1 { font-size: 34px; line-height: 1.1; max-width: none; }
                .bt2-hero__text { font-size: 16px; margin-bottom: 18px; max-width: none; }
                .bt2-hero__actions { flex-direction: column; }
                .bt2-hero__actions .bt2-btn { width: 100%; min-height: 50px; }
                .bt2-hero__actions .bt2-btn--ghost {
                    width: auto; min-height: 40px; align-self: center; padding: 4px 8px;
                }
                .bt2-hero__contact {
                    width: 100%; margin-top: 14px; font-size: 13px; white-space: normal;
                }
                .bt2-trust { padding: 0 16px 24px; margin-top: -16px; }
                .bt2-trust__panel { padding: 14px 12px; }
                .bt2-trust__grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px 10px; }
                .bt2-trust__item { align-items: center; }
                .bt2-trust__num { font-size: 17px; }
                .bt2-trust__label { font-size: 12px; }
                .bt2-section { padding: 48px 0; }
                .bt2-section__head { margin-bottom: 32px; }
                .bt2-section__head h2 { font-size: 28px; }
                .bt2-grid { grid-template-columns: 1fr; gap: 18px; }
                .bt2-card:hover { transform: none; }
                .bt2-card__media { aspect-ratio: 4/3; }
                .bt2-card__body { padding: 18px; }
                .bt2-pricing__amount { font-size: 28px; }
                .bt2-benefits { grid-template-columns: 1fr 1fr; gap: 16px; }
                .bt2-final-cta { padding: 56px 16px; min-height: 260px; }
                .bt2-final-cta h2 { font-size: 28px; }
                .bt2-final-cta__actions { flex-direction: column; align-items: stretch; width: 100%; }
                .bt2-final-cta__actions .bt2-btn { width: 100%; min-width: 0; }
            }
            @media (max-width: 420px) {
                .bt2-wrap { padding: 0 14px; }
                .bt2-hero h1 { font-size: 30px; }
                .bt2-benefits { grid-template-columns: 1fr; }
            }
            .bt2-email-overlay {
                position: fixed; inset: 0; z-index: 10000;
                display: none; align-items: flex-end; justify-content: center;
                padding: 0; background: rgba(16,24,40,.55); backdrop-filter: blur(4px);
            }
            .bt2-email-overlay.is-open { display: flex; }
            .bt2-email-modal {
                position: relative; width: 100%; max-width: 440px;
                background: #fff; border-radius: 16px 16px 0 0; overflow: hidden;
                box-shadow: 0 -8px 40px rgba(16,24,40,.2);
            }
            .bt2-email-modal__hero {
                height: 100px; background: var(--bt2-navy) center/cover no-repeat; position: relative;
            }
            .bt2-email-modal__hero::after {
                content: ''; position: absolute; inset: 0;
                background: linear-gradient(180deg, rgba(5,18,35,.25), rgba(5,18,35,.65));
            }
            .bt2-email-modal__close {
                position: absolute; top: 12px; right: 12px; z-index: 2;
                width: 36px; height: 36px; border-radius: 50%; border: none;
                background: rgba(255,255,255,.2); color: #fff; font-size: 20px;
                cursor: pointer; display: flex; align-items: center; justify-content: center;
            }
            .bt2-email-modal__body { padding: 24px 20px 28px; }
            .bt2-email-modal__body h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: var(--bt2-navy); }
            .bt2-email-modal__body p { margin: 0 0 16px; font-size: 14px; color: var(--bt2-muted); line-height: 1.55; }
            .bt2-email-input {
                width: 100%; min-height: 50px; padding: 0 16px; border: 1px solid var(--bt2-border);
                border-radius: 8px; font-size: 16px; font-family: ${FONT}; margin-bottom: 8px;
            }
            .bt2-email-input:focus { outline: none; border-color: var(--bt2-primary); box-shadow: 0 0 0 3px rgba(10,115,255,.15); }
            .bt2-email-error { display: none; font-size: 13px; color: #d93025; margin-bottom: 8px; }
            .bt2-email-submit { width: 100%; min-height: 50px; border-radius: 8px; }
            .bt2-email-submit .bt2-spinner {
                display: none; width: 20px; height: 20px;
                border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
                border-radius: 50%; animation: bt2-spin .7s linear infinite;
            }
            @keyframes bt2-spin { to { transform: rotate(360deg); } }
            .bt2-email-success {
                position: fixed; inset: 0; z-index: 10001;
                display: none; align-items: center; justify-content: center;
                padding: 20px; background: rgba(16,24,40,.45);
            }
            .bt2-email-success.is-open { display: flex; }
            .bt2-email-success__card {
                background: #fff; border-radius: 14px; padding: 32px 28px;
                text-align: center; box-shadow: 0 16px 48px rgba(16,24,40,.2);
                max-width: 320px; width: 100%;
            }
            .bt2-email-success__card h4 { margin: 0; font-size: 22px; font-weight: 700; color: var(--bt2-navy); }
            body.bt2-no-scroll { overflow: hidden; }
            @media (min-width: 768px) {
                .bt2-email-overlay { align-items: center; padding: 20px; }
                .bt2-email-modal { border-radius: 16px; max-width: 420px; }
            }
        `;
        document.head.appendChild(style);
    }

    function renderPackageCard(pkg, index) {
        const priceBlock = pkg.startingTotalPrice
            ? `<div class="bt2-pricing">
                <div class="bt2-pricing__from">From</div>
                <div class="bt2-pricing__total">
                    <span class="bt2-pricing__amount">$${formatCurrency(pkg.startingTotalPrice)}</span>
                    <span class="bt2-pricing__suffix">total package</span>
                </div>
                ${pkg.estimatedPerPersonPrice && pkg.estimatedGuestCount
                ? `<p class="bt2-pricing__pp">About $${formatCurrency(pkg.estimatedPerPersonPrice)} per person for ${pkg.estimatedGuestCount} guests</p>`
                : ''}
                <p class="bt2-pricing__note">Pricing may vary by dates and season. Exact total once you pick dates.</p>
               </div>`
            : `<div class="bt2-pricing"><p class="bt2-pricing__note">Pricing may vary by dates and season. Pick dates on the listing for your exact total.</p></div>`;

        const includedHtmlFace = pkg.includedComponents?.length
            ? `<div class="bt2-included">
                <p class="bt2-included__label">What's included</p>
                <ul class="bt2-included__list">
                    ${pkg.includedComponents.map((item) => `
                        <li class="bt2-included__item">
                            <span class="bt2-included__emoji" aria-hidden="true">${item.emoji || ''}</span>
                            <div class="bt2-included__body">
                                <div class="bt2-included__top">
                                    <span class="bt2-included__type">${escapeHtml(item.typeLabel)}</span>
                                    ${item.timing ? `<span class="bt2-included__timing">${escapeHtml(item.timing)}</span>` : ''}
                                </div>
                                <p class="bt2-included__title">${escapeHtml(item.title)}</p>
                            </div>
                        </li>
                    `).join('')}
                </ul>
               </div>`
            : '';

        const ctaBlock = pkg.listingUrl
            ? `<div class="bt2-card__cta">
                <a class="bt2-btn bt2-btn--primary bt2-btn--full bt2-cta-link"
                   href="${escapeHtml(pkg.listingUrl)}"
                   data-trip-name="${escapeHtml(pkg.title)}">Check dates and book</a>
                <p class="bt2-card__reassure">Live pricing and full details on the listing</p>
               </div>`
            : '';

        const kinds = new Set((pkg.includedComponents || []).map((c) => c.kind));
        const charterCount = Number(pkg.charterCount) || 0;
        const charterChip = charterCount > 1
            ? `${EMOJI.charter} ${charterCount} Charters`
            : (kinds.has('charter') || charterCount === 1 ? `${EMOJI.charter} Charter` : null);
        const stackChips = [
            kinds.has('stay') ? `${EMOJI.stay} Stay` : null,
            kinds.has('boat') ? `${EMOJI.boat} Boat` : null,
            charterChip,
        ].filter(Boolean);
        const stackHtml = stackChips.length
            ? `<div class="bt2-card__stack" aria-hidden="true">${stackChips.map((chip) => `<span class="bt2-card__stack-chip">${chip}</span>`).join('')}</div>`
            : '';

        const fullItineraryHtml = pkg.itinerary?.length
            ? `<h4>Day by day</h4>
                <ol class="bt2-itinerary">${pkg.itinerary.map((step) => `
                    <li>
                        <span class="bt2-itinerary__day">${escapeHtml(step.dayLabel)}</span>
                        <div class="bt2-itinerary__body">
                            <p class="bt2-itinerary__title">${escapeHtml(step.title)}</p>
                            ${step.detail ? `<p class="bt2-itinerary__detail">${escapeHtml(step.detail)}</p>` : ''}
                        </div>
                    </li>
                `).join('')}</ol>`
            : '';

        const detailsId = `bt2-details-${index}`;
        const goodHtml = pkg.goodToKnow.length
            ? `<h4>Good to know</h4><ul>${pkg.goodToKnow.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>`
            : '';
        const customizeHtml = `
            <div class="bt2-customize-box">
                <p>You can still change:</p>
                <ul>${pkg.customizationOptions.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
            </div>`;

        const summaryHtml = pkg.shortDescription
            ? `<p class="bt2-card__summary">${escapeHtml(pkg.shortDescription)}</p>`
            : '';
        const whyHtml = pkg.whyYouWillLoveIt
            ? `<h4>Why you’ll love this trip</h4><p>${escapeHtml(pkg.whyYouWillLoveIt)}</p>`
            : '';

        const featuredClass = pkg.isFeatured ? ' bt2-card--featured' : '';
        const featuredLabel = pkg.isFeatured
            ? `<div class="bt2-featured-label">${EMOJI.check} This is the trip from your video</div>`
            : '';

        const nightsLabel = pkg.nights ? `${pkg.nights}-night stay` : '';

        const capacityBits = (pkg.includedComponents || [])
            .filter((c) => c.title || c.meta)
            .map((c) => {
                if (c.kind === 'charter') {
                    const parts = [c.title, c.meta].filter(Boolean);
                    return `${c.typeLabel}: ${parts.join(' · ')}`;
                }
                if (c.meta) return `${c.typeLabel}: ${c.meta}`;
                return `${c.typeLabel}: ${c.title}`;
            });
        const capacityHtml = capacityBits.length
            ? `<h4>Capacities and logistics</h4><ul>${capacityBits.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>`
            : '';

        return `
            <article class="bt2-card${featuredClass} is-loaded" data-package-id="${escapeHtml(pkg.id)}">
                <div class="bt2-card__media">
                    ${pkg.mainImage ? `<img src="${escapeHtml(pkg.mainImage)}" alt="${escapeHtml(pkg.title)}" loading="lazy">` : ''}
                    ${stackHtml}
                </div>
                <div class="bt2-card__body">
                    ${featuredLabel}
                    <h3 class="bt2-card__title">${escapeHtml(pkg.title)}</h3>
                    <div class="bt2-card__meta">
                        ${nightsLabel ? `<span>${EMOJI.stay} ${escapeHtml(nightsLabel)}</span>` : ''}
                        <span>${EMOJI.pin} ${escapeHtml(pkg.location)}</span>
                    </div>
                    ${summaryHtml}
                    ${priceBlock}
                    ${ctaBlock}
                    ${includedHtmlFace}
                    <button type="button" class="bt2-accordion-btn bt2-package-toggle"
                            aria-expanded="false" aria-controls="${detailsId}" data-target="${detailsId}">
                        Trip details ${icons.chevron}
                    </button>
                    <div class="bt2-accordion-panel" id="${detailsId}" role="region">
                        <div class="bt2-details">
                            ${whyHtml}
                            ${capacityHtml}
                            ${fullItineraryHtml}
                            ${goodHtml}
                            <h4>Make it yours</h4>
                            ${customizeHtml}
                        </div>
                    </div>
                </div>
            </article>`;
    }

    function renderSkeletons(count = 3) {
        return Array.from({ length: count }, () => `
            <div class="bt2-skeleton-card">
                <div class="bt2-skeleton bt2-skeleton-card__img"></div>
                <div class="bt2-skeleton-card__body">
                    <div class="bt2-skeleton bt2-skeleton-line bt2-skeleton-line--lg"></div>
                    <div class="bt2-skeleton bt2-skeleton-line bt2-skeleton-line--md"></div>
                    <div class="bt2-skeleton bt2-skeleton-line"></div>
                    <div class="bt2-skeleton bt2-skeleton-line"></div>
                    <div class="bt2-skeleton bt2-skeleton-line" style="height:48px;margin-top:16px"></div>
                </div>
            </div>`).join('');
    }

    function buildPageHtml(heroImage) {
        return `
            <div class="bt2-hero-wrap">
            <section class="bt2-hero" style="background-image:url('${escapeHtml(heroImage)}')">
                <div class="bt2-hero__overlay"></div>
                <div class="bt2-hero__inner">
                    <div class="bt2-hero__content">
                        <div class="bt2-hero__pill">${EMOJI.play} As seen on Florida Keys Guide</div>
                        <h1>Stay. Boat. Fish. One booking.</h1>
                        <p class="bt2-hero__text">Private packages for the Florida Keys. Choose a trip, pick dates, and book.</p>
                        <div class="bt2-hero__actions">
                            <button type="button" class="bt2-btn bt2-btn--primary" data-scroll="featured-packages">Browse packages</button>
                            <a href="${HOME_URL}" class="bt2-btn bt2-btn--ghost bt2-build-own">Or build your own</a>
                        </div>
                        <p class="bt2-hero__contact">Questions? <a href="tel:${CONTACT_PHONE}" class="bt2-contact-call">Call</a> or <a href="mailto:${CONTACT_EMAIL}" class="bt2-contact-email">Email</a></p>
                    </div>
                </div>
            </section>

            <section class="bt2-trust" aria-label="Trust indicators">
                <div class="bt2-trust__panel">
                <div class="bt2-trust__grid">
                    <div class="bt2-trust__item">
                        <p class="bt2-trust__num">35+</p>
                        <p class="bt2-trust__label">Stays</p>
                    </div>
                    <div class="bt2-trust__item">
                        <p class="bt2-trust__num">34+</p>
                        <p class="bt2-trust__label">Boat rentals</p>
                    </div>
                    <div class="bt2-trust__item">
                        <p class="bt2-trust__num">18+</p>
                        <p class="bt2-trust__label">Fishing charters</p>
                    </div>
                    <div class="bt2-trust__item">
                        <p class="bt2-trust__num">32,000+</p>
                        <p class="bt2-trust__label">Followers</p>
                    </div>
                </div>
                </div>
            </section>
            </div>

            <section class="bt2-section bt2-section--packages" id="featured-packages">
                <div class="bt2-wrap">
                    <div class="bt2-section__head">
                        <h2>Featured packages</h2>
                        <p>Choose a trip, then check dates for live pricing. Package prices may vary by week and season.</p>
                    </div>
                    <div class="bt2-grid" id="bt2-packages-grid">${renderSkeletons(6)}</div>
                </div>
            </section>

            <section class="bt2-section bt2-section--alt">
                <div class="bt2-wrap">
                    <div class="bt2-section__head">
                        <h2>Why book a package?</h2>
                        <p>Less planning. A clearer next step. One path to lock in your Keys trip.</p>
                    </div>
                    <div class="bt2-benefits">
                        ${BENEFITS.map((b) => `
                            <div class="bt2-benefit">
                                <div class="bt2-benefit__icon">${b.icon}</div>
                                <h3>${escapeHtml(b.title)}</h3>
                                <p>${escapeHtml(b.text)}</p>
                            </div>`).join('')}
                    </div>
                </div>
            </section>

            <section class="bt2-section">
                <div class="bt2-wrap">
                    <div class="bt2-section__head">
                        <h2>Frequently asked questions</h2>
                    </div>
                    <div class="bt2-faq">
                        ${FAQ_ITEMS.map((item, i) => `
                            <div class="bt2-faq-item">
                                <button type="button" class="bt2-faq-btn" aria-expanded="false"
                                        aria-controls="bt2-faq-${i}" data-faq="${i}">
                                    <span>${escapeHtml(item.q)}</span>
                                    ${icons.chevron}
                                </button>
                                <div class="bt2-faq-panel" id="bt2-faq-${i}" role="region">
                                    <p>${escapeHtml(item.a)}</p>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>
            </section>

            <section class="bt2-final-cta" style="background-image:url('${escapeHtml(heroImage)}')">
                <div class="bt2-final-cta__overlay"></div>
                <div class="bt2-final-cta__inner">
                    <h2>Ready to pick dates?</h2>
                    <p>Start with a featured package, or build your own.</p>
                    <div class="bt2-final-cta__actions">
                        <button type="button" class="bt2-btn bt2-btn--primary" data-scroll="featured-packages">Browse packages</button>
                        <a href="${HOME_URL}" class="bt2-btn bt2-btn--outline bt2-build-own">Build your own trip</a>
                    </div>
                </div>
            </section>`;
    }

    function bindPageInteractions(root) {
        if (root.dataset.bt2Bound) return;
        root.dataset.bt2Bound = 'true';

        root.addEventListener('click', (e) => {
            const scrollBtn = e.target.closest('[data-scroll="featured-packages"]');
            if (scrollBtn) {
                e.preventDefault();
                root.querySelector('#featured-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const buildOwn = e.target.closest('.bt2-build-own');
            if (buildOwn) {
                logEvent({ on_link_click: true, link_clicked: '/', link_clicked_trip_name: 'Build Your Own Trip' });
                return;
            }

            const cta = e.target.closest('.bt2-cta-link');
            if (cta && cta.href && cta.href !== '#') {
                logEvent({
                    on_link_click: true,
                    link_clicked: cta.href.toLowerCase(),
                    link_clicked_trip_name: cta.dataset.tripName || '',
                });
                return;
            }

            const pkgBtn = e.target.closest('.bt2-package-toggle');
            if (pkgBtn) {
                const targetId = pkgBtn.dataset.target;
                const panel = root.querySelector(`#${targetId}`);
                if (!panel) return;
                const isOpen = pkgBtn.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    pkgBtn.setAttribute('aria-expanded', 'false');
                    panel.classList.remove('is-open');
                    openPackageAccordion = null;
                } else {
                    if (openPackageAccordion && openPackageAccordion !== pkgBtn) {
                        openPackageAccordion.setAttribute('aria-expanded', 'false');
                        root.querySelector(`#${openPackageAccordion.dataset.target}`)?.classList.remove('is-open');
                    }
                    pkgBtn.setAttribute('aria-expanded', 'true');
                    panel.classList.add('is-open');
                    openPackageAccordion = pkgBtn;
                }
                return;
            }

            const faqBtn = e.target.closest('.bt2-faq-btn');
            if (faqBtn) {
                const panel = root.querySelector(`#bt2-faq-${faqBtn.dataset.faq}`);
                if (!panel) return;
                const isOpen = faqBtn.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    faqBtn.setAttribute('aria-expanded', 'false');
                    panel.classList.remove('is-open');
                    openFaqAccordion = null;
                } else {
                    if (openFaqAccordion && openFaqAccordion !== faqBtn) {
                        openFaqAccordion.setAttribute('aria-expanded', 'false');
                        root.querySelector(`#bt2-faq-${openFaqAccordion.dataset.faq}`)?.classList.remove('is-open');
                    }
                    faqBtn.setAttribute('aria-expanded', 'true');
                    panel.classList.add('is-open');
                    openFaqAccordion = faqBtn;
                }
            }
        });
    }

    function renderMidCta(variant) {
        return `
            <div class="bt2-mid-cta bt2-mid-cta--${variant}">
                <div class="bt2-mid-cta__copy">
                    <span class="bt2-card__badge bt2-card__badge--blue">Build your own</span>
                    <h3>Don’t see the right trip?</h3>
                    <p>Start on the homepage and put your trip together in three steps.</p>
                    <ol class="bt2-mid-cta__steps">
                        <li><span class="bt2-mid-cta__num">1</span><span>Pick your dates</span></li>
                        <li><span class="bt2-mid-cta__num">2</span><span>Choose a stay</span></li>
                        <li><span class="bt2-mid-cta__num">3</span><span>Add a boat, a charter, or both</span></li>
                    </ol>
                </div>
                <a href="${HOME_URL}" class="bt2-btn bt2-build-own">Build your own trip</a>
            </div>`;
    }

    function renderPackages(grid, trips) {
        if (!trips.length) {
            grid.innerHTML = `
                <div class="bt2-fallback" style="grid-column:1/-1">
                    <p>We couldn't load the featured trips right now. Please refresh the page or build your own trip.</p>
                    <a href="${HOME_URL}" class="bt2-btn bt2-btn--primary">Build your own trip</a>
                </div>`;
            return;
        }
        const packages = trips.map((trip) => {
            const isRef = referenceNormalized && normalizeForMatch(trip.trip_name || '') === referenceNormalized;
            return tripToPackage(trip, isRef);
        });
        packages.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

        const parts = [];
        packages.forEach((pkg, i) => {
            parts.push(renderPackageCard(pkg, i));
            // After first row: mobile=1, tablet=2, desktop=3
            if (i === 0) parts.push(renderMidCta('mobile'));
            if (i === 1) parts.push(renderMidCta('tablet'));
            if (i === 2) parts.push(renderMidCta('desktop'));
        });
        grid.innerHTML = parts.join('');
    }

    function initEmailPopup() {
        const STORAGE_KEY = 'kb_trip_updates_popup_v2';
        const VISITOR_KEY = 'kb_visitor_id';
        const SHOW_DELAY_MS = 10000;
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const POPUP_TYPE = 'trip_packages_timed';
        const SUCCESS_VISIBLE_MS = 1000;
        const SUCCESS_FADE_MS = 400;

        const overlay = document.createElement('div');
        overlay.className = 'bt2-email-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Trip updates signup');
        overlay.innerHTML = `
            <div class="bt2-email-modal">
                <div class="bt2-email-modal__hero" id="bt2-email-hero">
                    <button type="button" class="bt2-email-modal__close" aria-label="Close">&times;</button>
                </div>
                <div class="bt2-email-modal__body">
                    <h3>Get Florida Keys trip updates</h3>
                    <p>New fishing packages, seasonal pricing, and featured trips from Florida Keys Guide, sent straight to your inbox.</p>
                    <input type="email" class="bt2-email-input" placeholder="Your email address" autocomplete="email" aria-label="Email address">
                    <p class="bt2-email-error" role="alert"></p>
                    <button type="button" class="bt2-btn bt2-btn--primary bt2-email-submit">
                        <span class="bt2-email-submit-text">Notify me</span>
                        <span class="bt2-spinner" aria-hidden="true"></span>
                    </button>
                </div>
            </div>`;

        const successOverlay = document.createElement('div');
        successOverlay.className = 'bt2-email-success';
        successOverlay.innerHTML = `
            <div class="bt2-email-success__card">
                <h4>You're in!</h4>
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(successOverlay);

        const closeBtn = overlay.querySelector('.bt2-email-modal__close');
        const emailInput = overlay.querySelector('.bt2-email-input');
        const errorEl = overlay.querySelector('.bt2-email-error');
        const submitBtn = overlay.querySelector('.bt2-email-submit');
        const submitText = overlay.querySelector('.bt2-email-submit-text');
        const spinner = overlay.querySelector('.bt2-spinner');
        const heroEl = overlay.querySelector('#bt2-email-hero');
        if (heroEl) heroEl.style.backgroundImage = `url('${HELP_HERO_IMAGE}')`;

        const getPopupState = () => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
        };
        const setPopupState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        const shouldShow = () => {
            const s = getPopupState();
            if (s.submitted) return false;
            if (s.lastShown && Date.now() - s.lastShown < THIRTY_DAYS_MS) return false;
            return true;
        };
        const getVisitorId = () => {
            let id = localStorage.getItem(VISITOR_KEY);
            if (!id) {
                id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                localStorage.setItem(VISITOR_KEY, id);
            }
            return id;
        };
        const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

        const setLoading = (loading) => {
            submitBtn.disabled = loading;
            submitText.style.display = loading ? 'none' : 'inline';
            spinner.style.display = loading ? 'inline-block' : 'none';
        };

        const open = () => {
            overlay.classList.add('is-open');
            document.body.classList.add('bt2-no-scroll');
            emailInput.focus();
        };
        const close = () => {
            overlay.classList.remove('is-open');
            document.body.classList.remove('bt2-no-scroll');
            errorEl.style.display = 'none';
            emailInput.value = '';
            setLoading(false);
        };

        let successTimer = null;
        const showSuccess = () => {
            successOverlay.classList.add('is-open');
            successTimer = setTimeout(() => {
                successOverlay.classList.remove('is-open');
            }, SUCCESS_VISIBLE_MS + SUCCESS_FADE_MS);
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });
        emailInput.addEventListener('input', () => { errorEl.style.display = 'none'; });

        submitBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            if (!email) { errorEl.textContent = 'Please enter your email address'; errorEl.style.display = 'block'; return; }
            if (!isValidEmail(email)) { errorEl.textContent = 'Please enter a valid email address'; errorEl.style.display = 'block'; return; }
            setLoading(true);
            try {
                const res = await fetch(EMAIL_LEADS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        visitor_id: getVisitorId(),
                        source_page: 'bundled-trips-v2',
                        page_url: window.location.href,
                        popup_type: POPUP_TYPE,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
                setPopupState({ submitted: true, submittedAt: Date.now() });
                close();
                showSuccess();
            } catch (err) {
                errorEl.textContent = err.message || 'Something went wrong. Please try again.';
                errorEl.style.display = 'block';
                setLoading(false);
            }
        });

        if (!shouldShow()) return { setHeroImage: (url) => { if (url) heroEl.style.backgroundImage = `url('${url}')`; } };

        let showTimer = setTimeout(() => {
            if (!shouldShow()) return;
            open();
            const s = getPopupState();
            setPopupState({ ...s, lastShown: Date.now() });
        }, SHOW_DELAY_MS);

        return {
            setHeroImage: (url) => { if (url) heroEl.style.backgroundImage = `url('${url}')`; },
            cancel: () => { if (showTimer) clearTimeout(showTimer); },
        };
    }

    function init() {
        const container = document.querySelector('[data-element="bundled-trips-body-container"]');
        if (!container) return;

        injectStyles();

        const defaultHero = HELP_HERO_IMAGE;
        container.innerHTML = buildPageHtml(defaultHero);
        bindPageInteractions(container);

        const grid = container.querySelector('#bt2-packages-grid');
        const emailPopup = initEmailPopup();

        fetch(API_URL)
            .then((res) => res.json())
            .then((data) => {
                if (!Array.isArray(data)) {
                    renderPackages(grid, []);
                    return;
                }

                const activeTrips = data.filter((t) => t?.active === true);
                const sorted = [...activeTrips].sort((a, b) => {
                    const da = a?.publish_date ? new Date(a.publish_date).getTime() : -Infinity;
                    const db = b?.publish_date ? new Date(b.publish_date).getTime() : -Infinity;
                    return db - da;
                });

                let tripsToRender = sorted;
                if (referenceNormalized) {
                    const idx = sorted.findIndex((t) => normalizeForMatch(t?.trip_name || '') === referenceNormalized);
                    if (idx > -1) {
                        const [match] = sorted.splice(idx, 1);
                        tripsToRender = [match, ...sorted];
                    }
                }

                const heroImg = HELP_HERO_IMAGE;
                container.querySelector('.bt2-hero').style.backgroundImage = `url('${heroImg}')`;
                container.querySelector('.bt2-final-cta').style.backgroundImage = `url('${heroImg}')`;
                if (emailPopup?.setHeroImage) emailPopup.setHeroImage(heroImg);

                logEvent({
                    on_load: true,
                    link_used: referenceRaw,
                    linked_used_name: referenceNormalized ? toTitleLike(referenceRaw) : '',
                });

                renderPackages(grid, tripsToRender);

                if (referenceNormalized && tripsToRender.length) {
                    requestAnimationFrame(() => {
                        const firstCard = grid.querySelector('.bt2-card');
                        if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to load bundled trips', err);
                renderPackages(grid, []);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
