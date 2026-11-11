// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);



// for no scroll background when modal is open
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.open_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
        });
    });

    document.querySelectorAll('.close_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            document.querySelectorAll('body').forEach(target => target.classList.remove('no-scroll'));

            // Clear redirect flag if user closes sign-in modal without signing in
            localStorage.removeItem('redirectToAddHome');
        });
    });
});



(async function () {
    try {
        const profileButton = document.querySelector('[data-element="profile_button"]');
        const profileButtonDropdown = document.querySelector('[data-element="profile_button_dropdown"]');
        let isPopupOpen = false;

        profileButtonDropdown.style.display = 'none';

        const togglePopup = () => {
            isPopupOpen = !isPopupOpen;
            profileButtonDropdown.style.display = isPopupOpen ? 'flex' : 'none';
        };

        profileButton.addEventListener('click', function () {
            togglePopup();
        });

        document.body.addEventListener('click', function (evt) {
            if (!profileButton.contains(evt.target) && !profileButtonDropdown.contains(evt.target)) {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            }
        });

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


// Signup Form Validation
window.Wized = window.Wized || [];
window.Wized.push((Wized) => {

    const passwordInput = Wized.elements.get('SignUp_Password');
    const emailInput = Wized.elements.get('SignUp_Email');
    const firstNameInput = Wized.elements.get('SignUp_FirstName');
    const lastNameInput = Wized.elements.get('SignUp_LastName');
    const phoneNumberInput = Wized.elements.get('SignUp_PhoneNumber');

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    firstNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

    lastNameInput.node.addEventListener('blur', (event) => {
        const inputElement = event.target;
        inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

    phoneNumberInput.node.addEventListener('focus', (event) => {
        const inputElement = event.target;
        if (inputElement.value === '') {
            inputElement.value = '';
        }
    });

    phoneNumberInput.node.addEventListener('input', handlePhoneNumberInput);
    phoneNumberInput.node.addEventListener('keydown', handlePhoneKeyDown);
    phoneNumberInput.node.addEventListener('change', handlePhoneNumberInput);

    function handlePhoneNumberInput(event) {
        const inputElement = event.target;
        let input = inputElement.value.replace(/[\D-]/g, '');
        if (input.length > 10) {
            input = input.substr(0, 10);
        }
        inputElement.value = formatPhoneNumber(input);
    }

    function handlePhoneKeyDown(event) {
        const key = event.key;
        const inputElement = event.target;

        if (key.length === 1 && !/[0-9]/.test(key)) {
            event.preventDefault();
        }

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

    const charactersMin = document.querySelector('#charactersMin');
    const containsSymbol = document.querySelector('#containsSymbol');
    const cantContain = document.querySelector('#cantContain');

    function getSVG(fillColor, isValid = false) {
        if (isValid) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
                    </svg>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                    <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                    <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
                    <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
                </svg>`;
    }

    function initializeSVGs() {
        charactersMin.innerHTML = getSVG("#d4d4d4");
        containsSymbol.innerHTML = getSVG("#d4d4d4");
        cantContain.innerHTML = getSVG("#d4d4d4");
    }

    initializeSVGs();

    function normalizeString(str) {
        return str.replace(/[\W_]+/g, '').toLowerCase();
    }

    function validatePassword() {
        const password = passwordInput.node.value;
        const firstName = normalizeString(firstNameInput.node.value);
        const lastName = normalizeString(lastNameInput.node.value);
        const emailLocalPart = normalizeString(emailInput.node.value.split('@')[0]);

        charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");

        const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
        containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

        let disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
        const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
        cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");
    }

    passwordInput.node.addEventListener('focus', validatePassword);
    passwordInput.node.addEventListener('input', validatePassword);

    const signUpButton = Wized.elements.get('SignUp_AgreeSubmitButton');
    if (signUpButton && signUpButton.node) {
        signUpButton.node.addEventListener('click', function () {
            Wized.data.v.signup_buttonclicked = true;
        });
    }

    //forgot password
    const forgotPasswordEmailInput = Wized.elements.get('ForgotPassword_Email');

    forgotPasswordEmailInput.node.addEventListener('input', handleEmailInput);
    forgotPasswordEmailInput.node.addEventListener('keydown', handleEmailKeyDown);
    forgotPasswordEmailInput.node.addEventListener('change', handleEmailInput);

    function handleEmailInput(event) {
        const inputElement = event.target;
        inputElement.value = inputElement.value.replace(/[^a-zA-Z0-9@._-]/g, '');
    }

    function handleEmailKeyDown(event) {
        if (!/^[a-zA-Z0-9@._-]$/.test(event.key) && event.key.length === 1) {
            event.preventDefault();
        }
    }

});


// Add Home buttons: signed-in hosts go to /host/add-home, everyone else gets the sign-in modal.
// Delegated so it also works for buttons rendered by the page builder below.
let hostUserLoadStatus = null;

window.Wized = window.Wized || [];
window.Wized.push(async (Wized) => {
    if (!Wized.data.c.token) return;

    await Wized.requests.waitFor('Load_user');
    hostUserLoadStatus = Wized.data.r.Load_user.status;

    if (hostUserLoadStatus === 200 && localStorage.getItem('redirectToAddHome') === 'true') {
        localStorage.removeItem('redirectToAddHome');
        window.location.href = '/host/add-home';
    }
});

document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-element="addListing_Button"]');
    if (!button) return;
    e.preventDefault();

    if (hostUserLoadStatus === 200) {
        window.location.href = '/host/add-home';
        return;
    }

    localStorage.setItem('redirectToAddHome', 'true');
    const signupWrapper = document.querySelector('[data-element="signin-wrapper"]');
    if (signupWrapper) {
        signupWrapper.style.display = 'flex';
    }
});



/**
 * Host Home V2 — stay host landing page (homes, condos, and hotels).
 * Mounts inside [data-element="host-home-content-container"].
 * All page copy lives in the content constants below; the layout reads from them.
 */
(function () {
    'use strict';

    const CONTAINER_SELECTOR = '[data-element="host-home-content-container"]';
    const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';
    const HERO_IMAGE_API = `${API_BASE}/stockimages/1`;
    const DEMO_VIDEO_API = `${API_BASE}/demovid`;
    const FOUNDING_COUNT_API = `${API_BASE}/hostLanding_foundingPartnerCount`;
    const ADD_PROPERTY_REQUEST_API = `${API_BASE}/add_home_request`;
    const CDN = 'https://cdn.prod.website-files.com/65c420cdaa11ef67a52edb9a/';
    const DEFAULT_HERO_IMAGE = `${CDN}69c432e85f8f42f896932c0e_iStock-483475944%20copy%202%20Large.webp`;

    const BLUE = '#0A73FF';
    const BLUE_HOVER = '#005FD6';
    const BLUE_LIGHT = '#EAF3FF';
    const NAVY = '#101828';
    const TEXT = '#344054';
    const MUTED = '#667085';
    const BORDER = '#DDE2E8';
    const BORDER_LIGHT = '#EAECF0';
    const SECTION_LIGHT = '#F8FAFC';
    const GREEN = '#12B76A';
    const FONT = "'TT Fors', sans-serif";

    /* ── Page content ── */
    const CONTACT = {
        email: 'support@keysbooking.com',
        hostingGuideUrl: 'https://www.keysbooking.com/hosting-guide',
        instagramUrl: 'https://www.instagram.com/floridakeys_guide',
    };

    const FOUNDING = {
        totalSpots: 100,
        defaultFee: '3%',
        foundingFee: '0%',
        guestFee: '12%',
    };

    const HERO = {
        pill: 'Vacation rentals & hotels',
        title: 'Get bookings from travelers planning their whole Keys trip',
        text: `Keys Booking is where guests book their stay, boat rental, and fishing charter in one checkout. List your vacation rental, portfolio, or hotel alongside the channels you already use — and pay ${FOUNDING.foundingFee} host fees as a founding partner.`,
    };

    const HERO_OFFER_POINTS = [
        'Lifetime boost in search ranking',
        'Promoted to 63,000+ Florida Keys Guide followers',
        'No contract — unlist anytime',
    ];

    const TRUST_STATS = [
        { value: '63,000+', label: 'Florida Keys Guide followers' },
        { value: '14M+', label: 'views on our trip package videos' },
        { value: '70,000+', label: 'visits to Keys Booking from those videos' },
        { value: '5★', label: 'every guest review so far' },
    ];

    const PICKER = {
        label: 'What are you listing?',
        reassure: 'Free to list · No contract · Keep your other channels',
        options: [
            { icon: '🏡', title: 'A vacation rental', text: 'List it yourself in a few steps', attrs: 'data-element="addListing_Button"' },
            { icon: '🗂️', title: 'Multiple properties', text: 'We’ll build your listings for you', attrs: 'data-action="open-property-popup" data-property-type="portfolio"' },
            { icon: '🏨', title: 'A hotel, resort, or inn', text: 'Our team sets you up', attrs: 'data-action="open-property-popup" data-property-type="hotel"' },
        ],
    };

    const REASONS = [
        { icon: '🎣', title: 'Guests who come for the water', text: 'Our audience follows Florida Keys Guide for fishing and boating trips. On Keys Booking they pick a stay, then add a boat or charter — so your property sits at the center of the trip.' },
        { icon: '💸', title: 'Keep more of every booking', text: `Free to list. Founding partners pay ${FOUNDING.foundingFee} host fee. Guests pay a ${FOUNDING.guestFee} service fee on top of your price.` },
        { icon: '🔄', title: 'Works alongside your other channels', text: 'Sync your calendar with Airbnb and VRBO to prevent double bookings. We collect and remit Florida taxes, and payouts arrive the day after check-in.' },
    ];

    const PARTNER_LOGOS = [
        { name: 'A1A Boat Rentals', src: `${CDN}690a3035be075a32adff54c5_a1a%20logo.webp` },
        { name: 'Spitters Are Quitters Fishing', src: `${CDN}693b016aaf2a03f3b2d9b9cf_SpittersAreQuittersFishing.webp` },
        { name: 'Poppa Wahoo', src: `${CDN}6973b892874a08dfe99f8048_poppawahoologo.svg` },
        { name: 'Partner charter', src: `${CDN}69a73f846941024a9ca6ddc8_logo-white-300x98.webp`, dark: true },
        { name: 'Pelagic Raptors', src: `${CDN}69a73e87c6f08b62f5625e3a_pelagic-raptors-logo3-2.webp` },
        { name: 'Big Game', src: `${CDN}693b003385273e7bb780a1b3_big-game_logo.svg` },
        { name: 'Hennessey Sportfishing', src: `${CDN}69765e1e4ae1e06addeb5d76_HennesseySportfishingLogo.webp` },
        { name: 'Leatherneck Backcountry', src: `${CDN}690a304c000a9a4579bbe50e_leatherneckbackcountry.webp` },
        { name: 'Why Knot', src: `${CDN}693affd81dcb18e2c530bc98_whyKnotLogo.avif` },
        { name: 'Wet Tails', src: `${CDN}691780d0456bbdc27952af35_wetTailsLogo.webp` },
    ];

    const GUEST_FLOW = {
        stay: { image: `${CDN}65d644e14a341a94523b5477_Image2Cartoon.webp`, title: 'Sombrero beach house', subtitle: 'Hosted by Lourdes', duration: '7 Nights', price: 4200 },
        boat: { image: `${CDN}69137e3889aa2cad607d0cbc_boat11.webp`, title: '30ft Grady White Canyon Center Console', subtitle: 'Reef Runner Rentals', duration: '7 Days', price: 2500 },
        charter: { image: `${CDN}69137e2531958bac1ca0af34_offshoreImage.webp`, title: '8 Hours Offshore Fishing', subtitle: 'Bluewater Sportfishing', duration: '1 Full Day', price: 1300 },
        taxes: 503,
    };

    const AUDIENCES = [
        {
            icon: '🏡',
            title: 'Vacation rental owners',
            text: 'Already on Airbnb or VRBO? Add Keys Booking as another channel. Set your own price and rules, sync your calendar, and show boating guests your dock specs — max boat length, beam, draft, and shore power.',
            cta: 'Start your listing',
            attrs: 'data-element="addListing_Button"',
        },
        {
            icon: '🗂️',
            title: 'Property managers',
            text: 'Send us your listing links and we’ll build your listings for you. Using property management software? Reach out — we can connect to it.',
            cta: 'Onboard my properties',
            attrs: 'data-action="open-property-popup" data-property-type="portfolio"',
        },
        {
            icon: '🏨',
            title: 'Hotels, resorts & inns',
            text: 'Reach fishing and boating travelers through a channel with lower fees than the big online travel agencies. Our team sets up your listing for you.',
            cta: 'Talk to our team',
            attrs: 'data-action="open-property-popup" data-property-type="hotel"',
        },
    ];

    const FEE_ROWS = [
        { label: 'Listing fee', value: 'Free' },
        { label: 'Host fee', value: `${FOUNDING.foundingFee} for founding partners`, note: `New hosts after founding spots fill will pay ${FOUNDING.defaultFee}` },
        { label: 'Guest service fee', value: `${FOUNDING.guestFee}, paid by the guest`, note: 'Added on top of the price you set' },
        { label: 'Taxes', value: 'Handled for you', note: 'We collect and remit Florida state and county taxes' },
        { label: 'Payouts', value: 'Day after check-in', note: 'Bank transfer through Stripe' },
        { label: 'Contract', value: 'None', note: 'Unlist anytime' },
    ];

    const FOUNDING_PERKS = [
        `${FOUNDING.foundingFee} host fee`,
        'Lifetime boost in search ranking',
        'Promoted through our socials and paid ads',
    ];

    // Typical published host fees, used for the comparison table and the calculator.
    const COMPETITORS = [
        { name: 'Airbnb', feeLabel: '3–15%', calcFee: 15, calcNote: 'host-only fee' },
        { name: 'VRBO', feeLabel: '8%', calcFee: 8, calcNote: 'pay-per-booking' },
        { name: 'Booking.com', shortName: 'Booking', feeLabel: '~15%', calcFee: 15, calcNote: 'typical commission' },
    ];
    const COMPETITOR_FEE_NOTE = 'Typical published fees: Airbnb ~3% split fee or ~15% host-only fee, VRBO 8% pay-per-booking, Booking.com ~15% commission. Actual fees vary by account and plan.';

    const CALCULATOR = { min: 10000, max: 1000000, defaultRevenue: 75000 };

    const COMPARISON_ROWS = [
        { label: 'Host fee', us: `${FOUNDING.foundingFee} founding`, them: COMPETITORS.map((c) => c.feeLabel) },
        { label: 'Boat rentals & charters bundled at checkout', us: true, them: false },
        { label: 'Guest trip concierge', us: true, them: false },
        { label: 'Dock details guests can filter by', us: true, them: false },
        { label: 'Promoted to our 63,000+ followers', us: true, them: false },
        { label: 'Local Florida Keys team', us: true, them: false },
    ];

    const STEPS = [
        { title: 'Create your account', text: 'Takes about a minute.' },
        { title: 'Add your property', text: 'Details, 5+ photos, and dock info if you have one.' },
        { title: 'Set your terms', text: 'Nightly rate, cleaning fee, minimum stay, rules, and cancellation policy.' },
        { title: 'Go live', text: 'We review your listing within 48 hours.' },
    ];
    const STEPS_NEEDS = 'What you’ll need: your address, at least 5 photos, your rates, check-in instructions, and bank details for payouts.';

    const PROOF = {
        eyebrow: 'Proven demand',
        title: 'We already have the travelers',
        text: 'We run Florida Keys Guide. Our trip package videos show travelers what they can book on Keys Booking — and they’re clicking through.',
    };

    const CASE_STUDY = {
        title: 'Florida Keys Guide package videos',
        campaign: '28 short videos, each showing a real Keys trip — waterfront stay, private boat, and fishing charters — with the total price. Every one sends viewers to Keys Booking to book it.',
        results: [
            { icon: '🔥', value: '14M+', label: 'views' },
            { icon: '📈', value: '70,000+', label: 'site visits' },
            { icon: '🚀', value: '6', label: 'videos with 1M+ views' },
            { icon: '💬', value: '1,000s', label: 'of DMs asking how to book' },
        ],
        conclusion: 'Those travelers are looking for stays. Yours could be one of them.',
    };

    const TESTIMONIAL = {
        quote: 'Finally, a platform made for the Keys. Guests who book my house often add a charter or boat, which means longer stays and better exposure for me.',
        name: 'Lourdes',
        role: 'Stay host on Keys Booking',
        reviewsNote: 'Every guest who has booked through Keys Booking has left a 5-star review.',
    };

    const FAQ_ITEMS = [
        { q: 'Can I list if I’m already on Airbnb, VRBO, or Booking.com?', a: 'Yes. Keys Booking is non-exclusive. Sync your calendars to prevent double bookings.' },
        { q: 'How do bookings work?', a: 'All stays are instant book — guests confirm right away based on your calendar, rules, and minimum stay. You’ll get a text and an email, and a private text thread opens using a Keys Booking number, so your personal number stays private.' },
        { q: 'What does it cost?', a: `Listing is free. Founding partners pay ${FOUNDING.foundingFee} host fee. Guests pay a ${FOUNDING.guestFee} service fee on top of the price you set. After founding spots fill, new hosts will pay a ${FOUNDING.defaultFee} host fee.` },
        { q: 'When do I get paid?', a: 'The day after the guest checks in, by bank transfer through Stripe.' },
        { q: 'Who handles taxes?', a: 'We collect and remit Florida state and county taxes on every booking. Taxes are itemized in each payout summary.' },
        { q: 'Can I control pricing, availability, and rules?', a: 'Yes. You set your nightly rate, cleaning fee, minimum stay, house rules, and one of seven cancellation policies — from a full refund up to 24 hours before check-in, to no refund. Change any of it anytime.' },
        { q: 'Do you work with property managers and hotels?', a: 'Yes. Tell us about your properties and our team builds your listings for you. Using property management or channel software? Reach out — we can connect to it.' },
        { q: 'What if a guest damages my property?', a: 'Contact us right away. We’ll help document the issue, communicate with the guest, and coordinate next steps.' },
        { q: 'Do I need a dock?', a: 'No. A dock helps you stand out with boating guests, but it isn’t required.' },
        { q: 'What if I need to cancel a booking?', a: 'Contact support right away and we’ll help communicate with the guest. Host cancellations may carry a fee depending on the booking value and timing.' },
        { q: 'Is there a contract?', a: 'No. Unlist or delete your property anytime.' },
    ];

    const PROPERTY_FORM_TYPES = [
        { value: 'home', label: 'Vacation home or villa' },
        { value: 'condo', label: 'Condo or townhome' },
        { value: 'portfolio', label: 'Multiple properties (property manager)' },
        { value: 'hotel', label: 'Hotel or resort', usesRooms: true },
        { value: 'inn', label: 'Inn, motel, or B&B', usesRooms: true },
    ];

    /* ── Helpers ── */
    const escapeHtml = (str = '') =>
        String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const formatCurrency = (n) => Number(n).toLocaleString('en-US');
    const formatDollars = (n) => `$${formatCurrency(Math.round(n))}`;

    const icons = {
        chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>',
        cross: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        play: '<svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="rgba(0,0,0,.7)"/><path d="M32 25L55 40L32 55V25Z" fill="white"/></svg>',
    };

    /* ── Calculator math (log scale so both small homes and large hotels fit on one slider) ── */
    const SLIDER_MAX = 1000;
    const sliderToRevenue = (t) => {
        const raw = CALCULATOR.min * Math.pow(CALCULATOR.max / CALCULATOR.min, t / SLIDER_MAX);
        const step = raw < 100000 ? 1000 : raw < 500000 ? 5000 : 10000;
        return Math.round(raw / step) * step;
    };
    const revenueToSlider = (rev) =>
        Math.round((SLIDER_MAX * Math.log(rev / CALCULATOR.min)) / Math.log(CALCULATOR.max / CALCULATOR.min));
    const ourFeePercent = parseFloat(FOUNDING.foundingFee) || 0;
    const savingsVs = (revenue, competitor) => Math.max(0, (revenue * (competitor.calcFee - ourFeePercent)) / 100);

    let openFaqButton = null;

    function injectStyles() {
        if (document.getElementById('hh2-styles')) return;
        const style = document.createElement('style');
        style.id = 'hh2-styles';
        style.textContent = `
            ${CONTAINER_SELECTOR} {
                --hh2-primary: ${BLUE};
                --hh2-primary-hover: ${BLUE_HOVER};
                --hh2-primary-light: ${BLUE_LIGHT};
                --hh2-navy: ${NAVY};
                --hh2-text: ${TEXT};
                --hh2-muted: ${MUTED};
                --hh2-border: ${BORDER};
                --hh2-border-light: ${BORDER_LIGHT};
                --hh2-section-light: ${SECTION_LIGHT};
                --hh2-green: ${GREEN};
                display: block; width: 100%;
                font-family: ${FONT}; color: var(--hh2-text); background: #fff;
                line-height: 1.6; font-size: 16px; -webkit-font-smoothing: antialiased;
            }
            ${CONTAINER_SELECTOR} *, ${CONTAINER_SELECTOR} *::before, ${CONTAINER_SELECTOR} *::after { box-sizing: border-box; }
            ${CONTAINER_SELECTOR} *, .hh2-popup-overlay *, .hh2-sticky * { font-family: inherit; }
            ${CONTAINER_SELECTOR} blockquote { border: 0; padding: 0; }
            ${CONTAINER_SELECTOR} :is(h1,h2,h3,h4,strong,b,th,label), .hh2-popup-overlay :is(h2,h3,strong,b,label), .hh2-sticky strong { font-weight: 500; }
            ${CONTAINER_SELECTOR} :is(h1,h2,h3,h4), .hh2-popup-overlay :is(h2,h3) { text-wrap: balance; }
            :is(.hh2-trust__label, .hh2-result span, .hh2-fees__label, .hh2-fees__value, .hh2-option__body span, .hh2-compare td, .hh2-compare th, .hh2-step p, .hh2-faq-btn span, .hh2-listing__title, .hh2-calc__rows span, .hh2-picker__note, .hh2-head p, .hh2-case__conclusion, .hh2-flow__head p, .hh2-steps__needs, .hh2-steps__assist, .hh2-final__text, .hh2-offer__label, .hh2-perks li, .hh2-contact__value, .hh2-testimonial__note, .hh2-compare__note, .hh2-calc__note) { text-wrap: balance; }
            ${CONTAINER_SELECTOR} :is(p,li,span,blockquote,figcaption,label,small), .hh2-popup-overlay :is(p,label,small) { text-wrap: pretty; }
            .hh2-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
            .hh2-full { width: 100vw; max-width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); }

            .hh2-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                min-height: 50px; padding: 0 26px; border-radius: 8px;
                font-family: ${FONT}; font-size: 16px; font-weight: 500;
                text-decoration: none; cursor: pointer; border: none;
                transition: background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
            }
            .hh2-btn:focus-visible { outline: 3px solid rgba(10,115,255,.28); outline-offset: 2px; }
            .hh2-btn--primary { background: var(--hh2-primary); color: #fff; }
            .hh2-btn--primary:hover { background: var(--hh2-primary-hover); }
            .hh2-btn--full { width: 100%; }
            .hh2-link-btn {
                background: none; border: 0; padding: 0; cursor: pointer;
                font-family: ${FONT}; font-size: inherit; font-weight: 500; color: var(--hh2-primary);
                text-decoration: underline; text-underline-offset: 3px;
            }
            .hh2-eyebrow { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--hh2-primary); }
            .hh2-tick {
                flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
                background: var(--hh2-green); color: #fff; display: inline-grid; place-items: center;
            }
            .hh2-cross {
                flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
                background: #F2F4F7; color: #98A2B3; display: inline-grid; place-items: center;
            }
            .hh2-perks { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
            .hh2-perks li { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; font-weight: 500; color: var(--hh2-navy); line-height: 1.45; }

            /* Listing type picker */
            .hh2-picker__label { margin: 0 0 10px; font-size: 13px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: var(--hh2-muted); }
            .hh2-picker__options { display: grid; grid-template-columns: 1fr; gap: 10px; }
            .hh2-option {
                display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px;
                background: #fff; border: 1.5px solid var(--hh2-border); border-radius: 12px;
                font-family: ${FONT}; text-align: left; cursor: pointer;
                transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
            }
            .hh2-option:hover { border-color: var(--hh2-primary); box-shadow: 0 8px 22px rgba(10,115,255,.18); transform: translateY(-2px); }
            .hh2-option:focus-visible { outline: 3px solid rgba(10,115,255,.35); outline-offset: 2px; }
            .hh2-option__icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; background: var(--hh2-primary-light); display: grid; place-items: center; font-size: 22px; line-height: 1; }
            .hh2-option__body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
            .hh2-option__body strong { font-size: 16px; font-weight: 500; color: var(--hh2-navy); line-height: 1.25; }
            .hh2-option__body span { font-size: 13px; color: var(--hh2-muted); line-height: 1.35; }
            .hh2-option__arrow { flex-shrink: 0; font-size: 20px; font-weight: 500; color: var(--hh2-primary); }
            .hh2-picker__note { margin: 12px 0 0; font-size: 14px; color: var(--hh2-muted); }
            .hh2-picker--dark .hh2-picker__label { color: rgba(255,255,255,.75); }
            .hh2-picker--dark .hh2-option { border-color: transparent; }
            .hh2-picker--dark .hh2-picker__note { color: rgba(255,255,255,.75); }
            .hh2-picker--dark .hh2-link-btn { color: #fff; }
            .hh2-picker--center { max-width: 560px; margin: 0 auto; text-align: center; }
            .hh2-picker--center .hh2-option { text-align: left; }

            /* Hero */
            .hh2-hero { position: relative; background: var(--hh2-navy) center/cover no-repeat; }
            .hh2-hero__overlay {
                position: absolute; inset: 0;
                background: linear-gradient(90deg, rgba(5,18,35,.88) 0%, rgba(5,18,35,.65) 55%, rgba(5,18,35,.4) 100%);
            }
            .hh2-hero__inner {
                position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 88px 24px 112px;
                display: grid; grid-template-columns: minmax(0,1.35fr) minmax(0,1fr); gap: 48px; align-items: center;
            }
            .hh2-pill {
                display: inline-flex; align-items: center; gap: 6px;
                background: rgba(10,115,255,.22); color: #c6dbff;
                border: 1px solid rgba(158,197,255,.4); border-radius: 999px;
                padding: 7px 14px; font-size: 12px; font-weight: 500;
                letter-spacing: .06em; text-transform: uppercase; margin-bottom: 18px;
            }
            .hh2-hero h1 { margin: 0 0 16px; font-size: 52px; font-weight: 500; color: #fff; line-height: 1.06; letter-spacing: -.03em; max-width: 18ch; text-wrap: balance; }
            .hh2-hero__text { margin: 0 0 28px; font-size: 19px; color: rgba(255,255,255,.9); line-height: 1.5; max-width: 44ch; }

            /* Founding offer card */
            .hh2-offer {
                background: #fff; border-radius: 16px; padding: 28px;
                box-shadow: 0 20px 50px rgba(5,18,35,.35); text-align: center;
            }
            .hh2-offer__badge {
                display: inline-block; margin-bottom: 10px; padding: 6px 12px; border-radius: 999px;
                background: #FFF6E0; color: #B54708; font-size: 12px; font-weight: 500; letter-spacing: .05em; text-transform: uppercase;
            }
            .hh2-offer__label { margin: 0 0 14px; font-size: 14px; font-weight: 500; color: var(--hh2-muted); }
            .hh2-offer .hh2-perks { text-align: left; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--hh2-border-light); gap: 10px; }
            .hh2-offer .hh2-perks li { font-size: 14px; }
            .hh2-fee { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 16px; }
            .hh2-fee__old { position: relative; display: inline-block; font-size: 22px; font-weight: 500; color: var(--hh2-muted); }
            .hh2-fee__old::after {
                content: ''; position: absolute; left: 0; top: 52%; height: 2px; width: 0;
                background: currentColor; animation: hh2-strike 1s ease-in-out .5s forwards;
            }
            .hh2-fee__new {
                font-size: 40px; font-weight: 500; color: var(--hh2-navy); line-height: 1.1;
                opacity: 0; transform: translateY(6px); animation: hh2-reveal .7s ease 1.5s forwards;
            }
            @keyframes hh2-strike { to { width: 100%; } }
            @keyframes hh2-reveal { to { opacity: 1; transform: translateY(0); } }
            .hh2-spots { margin: 0; }
            .hh2-spots__text {
                margin: 0 0 8px; font-size: 14px; font-weight: 500;
                background: linear-gradient(90deg, #0088cc, #0066aa, #4b0082, #6600cc, #0088cc);
                background-size: 200% 100%; -webkit-background-clip: text; background-clip: text;
                -webkit-text-fill-color: transparent; animation: hh2-gradient 3s ease infinite;
            }
            @keyframes hh2-gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            .hh2-spots__bar { height: 8px; border-radius: 999px; background: var(--hh2-border-light); overflow: hidden; }
            .hh2-spots__fill { height: 100%; width: 0; border-radius: inherit; background: linear-gradient(90deg, #0A73FF, #6600cc); transition: width .8s ease; }

            /* Trust bar */
            .hh2-trust { position: relative; z-index: 2; margin-top: -48px; padding: 0 24px; }
            .hh2-trust__panel {
                max-width: 1100px; margin: 0 auto; background: #fff; border: 1px solid var(--hh2-border-light);
                border-radius: 14px; box-shadow: 0 10px 30px rgba(16,24,40,.08);
                display: grid; grid-template-columns: repeat(4,minmax(0,1fr));
            }
            .hh2-trust__item { padding: 20px 16px; text-align: center; }
            .hh2-trust__item + .hh2-trust__item { border-left: 1px solid var(--hh2-border-light); }
            .hh2-trust__value { margin: 0; font-size: 26px; font-weight: 500; color: var(--hh2-navy); line-height: 1.15; }
            .hh2-trust__label { margin: 2px 0 0; font-size: 13px; font-weight: 500; color: var(--hh2-muted); line-height: 1.35; }

            /* Sections */
            .hh2-section { padding: 88px 0; }
            .hh2-section--alt { background: var(--hh2-section-light); }
            .hh2-head { text-align: center; max-width: 720px; margin: 0 auto 48px; }
            .hh2-head h2 { text-wrap: balance; margin: 0 0 12px; font-size: 36px; font-weight: 500; color: var(--hh2-navy); line-height: 1.2; letter-spacing: -.02em; }
            .hh2-head p { margin: 0; font-size: 17px; color: var(--hh2-text); }
            .hh2-subhead { margin: 56px 0 20px; text-align: center; font-size: 13px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--hh2-muted); }
            .hh2-step__num { display: block; margin-bottom: 10px; font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--hh2-primary); }


            /* Partner logos */
            .hh2-logos { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
            .hh2-logos__track { display: flex; gap: 16px; width: max-content; animation: hh2-marquee 40s linear infinite; }
            .hh2-logos:hover .hh2-logos__track { animation-play-state: paused; }
            .hh2-logo {
                flex: 0 0 auto; width: 160px; height: 80px; padding: 12px 16px; border-radius: 12px;
                background: #fff; border: 1px solid var(--hh2-border-light); display: grid; place-items: center;
            }
            .hh2-logo--dark { background: var(--hh2-navy); border-color: var(--hh2-navy); }
            .hh2-logo img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
            @keyframes hh2-marquee { to { transform: translateX(-50%); } }

            /* Demo video */
            .hh2-video {
                position: relative; max-width: 1000px; margin: 48px auto 0; aspect-ratio: 15 / 8;
                border-radius: 16px; overflow: hidden; background: var(--hh2-navy);
                box-shadow: 0 16px 40px rgba(16,24,40,.18);
            }
            .hh2-video video { width: 100%; height: 100%; object-fit: cover; display: block; }
            .hh2-video__play {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
                display: flex; flex-direction: column; align-items: center; gap: 12px;
                background: none; border: 0; cursor: pointer; color: #fff;
                font-family: ${FONT}; font-size: 16px; font-weight: 500; transition: transform .25s ease;
            }
            .hh2-video__play:hover { transform: translate(-50%,-50%) scale(1.08); }
            .hh2-video.is-playing .hh2-video__play { display: none; }

            /* Guest flow */
            .hh2-flow { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 20px; align-items: start; }
            .hh2-flow__step { display: flex; flex-direction: column; gap: 12px; }
            .hh2-flow__head .hh2-step__num { margin-bottom: 4px; }
            .hh2-flow__head p { margin: 0; font-size: 16px; font-weight: 500; color: var(--hh2-navy); line-height: 1.4; }
            .hh2-listing { display: flex; gap: 12px; background: #fff; border: 1px solid var(--hh2-border); border-radius: 12px; padding: 10px; }
            .hh2-listing img { width: 84px; height: 84px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
            .hh2-listing__body { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
            .hh2-listing__title { margin: 0; font-size: 14px; font-weight: 500; color: var(--hh2-navy); line-height: 1.3; }
            .hh2-listing__sub { margin: 2px 0 6px; font-size: 13px; color: var(--hh2-muted); }
            .hh2-listing__price { margin: 0; font-size: 13px; color: var(--hh2-text); }
            .hh2-listing__price strong { color: var(--hh2-navy); }
            .hh2-receipt { background: #fff; border: 1px solid var(--hh2-border); border-radius: 12px; padding: 18px; }
            .hh2-receipt h4 { margin: 0 0 12px; font-size: 15px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-receipt__row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
            .hh2-receipt__row--total { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--hh2-border-light); font-weight: 500; color: var(--hh2-navy); }


            /* Reasons + audiences */
            .hh2-reasons, .hh2-audiences { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 20px; }
            .hh2-reason, .hh2-audience { background: #fff; border: 1px solid var(--hh2-border); border-radius: 14px; padding: 26px; box-shadow: 0 4px 14px rgba(16,24,40,.04); }
            .hh2-audience { display: flex; flex-direction: column; }
            .hh2-audience .hh2-btn { margin-top: auto; }
            .hh2-audience p { margin-bottom: 20px !important; }
            .hh2-reason__icon { width: 48px; height: 48px; margin-bottom: 14px; border-radius: 10px; background: var(--hh2-primary-light); display: grid; place-items: center; font-size: 24px; line-height: 1; }
            .hh2-reason h3, .hh2-audience h3 { margin: 0 0 8px; font-size: 19px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-reason p, .hh2-audience p { margin: 0; font-size: 15px; color: var(--hh2-muted); line-height: 1.55; }

            /* Testimonial */
            .hh2-testimonial { max-width: 760px; margin: 24px auto 0; padding: 32px; text-align: center; border-radius: 16px; background: var(--hh2-navy); color: #fff; }
            .hh2-testimonial__stars { color: #FDB022; font-size: 20px; letter-spacing: 2px; margin-bottom: 12px; }
            .hh2-testimonial blockquote { margin: 0 0 14px; font-size: 20px; font-weight: 500; line-height: 1.45; }
            .hh2-testimonial figcaption { font-size: 14px; color: rgba(255,255,255,.75); }
            .hh2-testimonial figcaption strong { color: #fff; }
            .hh2-testimonial__note { margin: 16px 0 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.15); font-size: 14px; color: rgba(255,255,255,.85); }

            /* Proof */
            .hh2-case {
                max-width: 860px; margin: 0 auto; text-align: center;
                background: #fff; border: 1px solid var(--hh2-border); border-radius: 16px; padding: 36px;
            }
            .hh2-case h3 { margin: 0 0 6px; font-size: 22px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-case h4 { margin: 18px 0 8px; font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--hh2-muted); }
            .hh2-case p { margin: 0; font-size: 16px; }
            .hh2-results { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; margin-top: 20px; }
            .hh2-result { background: var(--hh2-section-light); border: 1px solid var(--hh2-border-light); border-radius: 12px; padding: 14px; text-align: center; }
            .hh2-result strong { display: block; font-size: 20px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-result span { font-size: 13px; color: var(--hh2-muted); }
            .hh2-case__conclusion { margin-top: 18px !important; font-weight: 500; color: var(--hh2-navy); }
            /* Founding partner + calculator */
            .hh2-founding { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 20px; align-items: stretch; }
            .hh2-founding__card {
                display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); gap: 32px; align-items: center; margin-top: 20px;
                background: #fff; border: 1px solid var(--hh2-border); border-radius: 16px; padding: 30px;
            }
            .hh2-founding__card h3 { margin: 0 0 16px; font-size: 24px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-fees { background: #fff; border: 1px solid var(--hh2-border); border-radius: 16px; padding: 8px 24px; }
            .hh2-fees__row { display: flex; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--hh2-border-light); }
            .hh2-fees__row:last-child { border-bottom: 0; }
            .hh2-fees__label { font-size: 15px; font-weight: 500; color: var(--hh2-muted); }
            .hh2-fees__value { text-align: right; font-size: 16px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-fees__value small { display: block; font-size: 13px; font-weight: 500; color: var(--hh2-muted); }
            .hh2-calc {
                background: linear-gradient(135deg, #0B3B75 0%, #0A73FF 100%); color: #fff;
                border-radius: 16px; padding: 30px; box-shadow: 0 16px 40px rgba(10,115,255,.22);
            }
            .hh2-calc .hh2-eyebrow { color: #C6DBFF; }
            .hh2-calc h3 { margin: 0 0 20px; font-size: 24px; font-weight: 500; color: #fff; }
            .hh2-calc label { display: block; font-size: 14px; font-weight: 500; color: rgba(255,255,255,.85); }
            .hh2-calc__revenue { margin: 2px 0 10px; font-size: 34px; font-weight: 500; line-height: 1.1; }
            .hh2-calc input[type="range"] { width: 100%; accent-color: #fff; cursor: pointer; }
            .hh2-calc__scale { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,.7); }
            .hh2-calc__headline { margin: 20px 0 12px; padding: 16px; border-radius: 12px; background: rgba(255,255,255,.14); font-size: 16px; }
            .hh2-calc__headline strong { display: block; font-size: 30px; font-weight: 500; line-height: 1.15; }
            .hh2-calc__rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
            .hh2-calc__rows li { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 14px; }
            .hh2-calc__rows small { color: rgba(255,255,255,.7); }
            .hh2-calc__rows strong { font-size: 16px; }
            .hh2-calc__note { margin: 16px 0 0; font-size: 12px; color: rgba(255,255,255,.7); line-height: 1.45; }

            /* Comparison */
            .hh2-compare { max-width: 980px; margin: 0 auto; background: #fff; border: 1px solid var(--hh2-border); border-radius: 14px; overflow-x: auto; }
            .hh2-compare table { width: 100%; min-width: 640px; border-collapse: collapse; }
            .hh2-compare th, .hh2-compare td { padding: 16px 14px; text-align: center; border-bottom: 1px solid var(--hh2-border-light); font-size: 15px; }
            .hh2-compare tr:last-child td { border-bottom: 0; }
            .hh2-compare th { background: var(--hh2-section-light); font-size: 14px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-compare td { white-space: nowrap; }
            .hh2-compare td:first-child { text-align: left; font-weight: 500; color: var(--hh2-navy); white-space: normal; }
            .hh2-compare .is-us { background: rgba(10,115,255,.06); color: var(--hh2-primary); font-weight: 500; }
            .hh2-name-short { display: none; }
            .hh2-compare__note { max-width: 980px; margin: 12px auto 0; font-size: 12px; color: var(--hh2-muted); text-align: center; }

            /* Steps */
            .hh2-steps { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; margin-bottom: 20px; }
            .hh2-steps__needs, .hh2-steps__assist { max-width: 720px; margin: 0 auto 10px; text-align: center; font-size: 15px; color: var(--hh2-muted); }
            .hh2-steps__assist { margin-bottom: 40px; color: var(--hh2-text); }
            .hh2-step { background: #fff; border: 1px solid var(--hh2-border); border-radius: 14px; padding: 26px 24px; }
            .hh2-step h3 { margin: 0 0 6px; font-size: 20px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-step p { margin: 0; font-size: 15px; color: var(--hh2-muted); }


            /* FAQ + contact */
            .hh2-faq { max-width: 800px; margin: 0 auto; border: 1px solid var(--hh2-border); border-radius: 12px; overflow: hidden; background: #fff; }
            .hh2-faq-item { border-bottom: 1px solid var(--hh2-border-light); }
            .hh2-faq-item:last-child { border-bottom: 0; }
            .hh2-faq-btn {
                width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
                padding: 18px 20px; background: #fff; border: 0; text-align: left; cursor: pointer;
                font-family: ${FONT}; font-size: 16px; font-weight: 500; color: var(--hh2-navy);
            }
            .hh2-faq-btn svg { flex-shrink: 0; color: var(--hh2-muted); transition: transform .2s; }
            .hh2-faq-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
            .hh2-faq-panel { overflow: hidden; max-height: 0; transition: max-height .22s ease; }
            .hh2-faq-panel.is-open { max-height: 400px; }
            .hh2-faq-panel p { margin: 0; padding: 0 20px 18px; font-size: 15px; color: #475467; }
            .hh2-contact { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; max-width: 600px; margin: 0 auto; }
            .hh2-contact a {
                display: flex; flex-direction: column; gap: 4px; padding: 20px; border-radius: 12px;
                background: #fff; border: 1px solid var(--hh2-border); text-decoration: none;
                transition: border-color .18s ease, transform .18s ease;
            }
            .hh2-contact a:hover { border-color: var(--hh2-primary); transform: translateY(-2px); }
            .hh2-contact__icon { font-size: 22px; line-height: 1; margin-bottom: 6px; }
            .hh2-contact__label { font-size: 16px; font-weight: 500; color: var(--hh2-navy); }
            .hh2-contact__value { font-size: 14px; color: var(--hh2-muted); word-break: break-word; }

            /* Final CTA */
            .hh2-final { position: relative; padding: 88px 24px; text-align: center; background: var(--hh2-navy) center/cover no-repeat; }
            .hh2-final__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,18,35,.75), rgba(5,18,35,.88)); }
            .hh2-final__inner { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
            .hh2-final h2 { text-wrap: balance; margin: 0 0 12px; font-size: 40px; font-weight: 500; color: #fff; line-height: 1.15; }
            .hh2-final__text { margin: 0 0 28px; font-size: 18px; color: rgba(255,255,255,.9); }

            /* Sticky mobile CTA (appended to body, so no container variables) */
            .hh2-sticky {
                position: fixed; left: 0; right: 0; bottom: 0; z-index: 9000;
                display: none; align-items: center; justify-content: space-between; gap: 12px;
                padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
                background: #fff; border-top: 1px solid ${BORDER}; box-shadow: 0 -8px 24px rgba(16,24,40,.12);
                font-family: ${FONT}; transform: translateY(110%); transition: transform .25s ease;
            }
            .hh2-sticky.is-visible { transform: translateY(0); }
            .hh2-sticky__copy { display: flex; flex-direction: column; min-width: 0; }
            .hh2-sticky__copy strong { font-size: 15px; font-weight: 500; color: ${NAVY}; line-height: 1.2; }
            .hh2-sticky__copy span { font-size: 12px; color: ${MUTED}; }
            .hh2-sticky button {
                flex-shrink: 0; min-height: 46px; padding: 0 18px; border: 0; border-radius: 8px;
                background: ${BLUE}; color: #fff; font-family: ${FONT}; font-size: 15px; font-weight: 500; cursor: pointer;
            }

            /* "We add it for you" popup */
            body.hh2-no-scroll { overflow: hidden; }
            .hh2-popup-overlay {
                position: fixed; inset: 0; z-index: 10000; display: none; align-items: center; justify-content: center;
                padding: 20px; background: rgba(16,24,40,.6); backdrop-filter: blur(4px); font-family: ${FONT};
            }
            .hh2-popup-overlay.is-open { display: flex; }
            .hh2-popup {
                position: relative; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto;
                background: #fff; border-radius: 14px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
                animation: hh2-pop .3s cubic-bezier(.34,1.56,.64,1);
            }
            @keyframes hh2-pop { from { opacity: 0; transform: scale(.94) translateY(16px); } to { opacity: 1; transform: none; } }
            .hh2-popup__close {
                position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 50%;
                border: 0; background: #F2F4F7; color: #475467; font-size: 20px; cursor: pointer;
            }
            .hh2-popup h2 { margin: 0 0 6px; font-size: 24px; font-weight: 500; color: ${NAVY}; }
            .hh2-popup > p { margin: 0 0 22px; font-size: 15px; color: ${MUTED}; }
            .hh2-form { display: flex; flex-direction: column; gap: 16px; }
            .hh2-field { display: flex; flex-direction: column; gap: 6px; }
            .hh2-field label { font-size: 15px; font-weight: 500; color: ${NAVY}; }
            .hh2-field small { font-size: 12px; font-weight: 400; color: ${MUTED}; }
            .hh2-field input, .hh2-field select {
                min-height: 48px; padding: 0 14px; border: 1.5px solid ${BORDER}; border-radius: 8px;
                font-family: ${FONT}; font-size: 16px; color: ${NAVY}; background: #fff;
            }
            .hh2-field input:focus, .hh2-field select:focus { outline: none; border-color: ${BLUE}; box-shadow: 0 0 0 3px rgba(10,115,255,.15); }
            .hh2-popup .hh2-btn:disabled { opacity: .7; cursor: default; }
            .hh2-form__error { display: none; margin: 0; padding: 12px 14px; border-radius: 8px; background: #FEF3F2; color: #B42318; font-size: 14px; line-height: 1.45; }
            .hh2-form__error.is-visible { display: block; }
            .hh2-form__error a { color: inherit; font-weight: 500; }
            .hh2-form__hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
            .hh2-popup__success { display: none; text-align: center; padding: 12px 0 4px; }
            .hh2-popup.is-sent .hh2-popup__success { display: block; }
            .hh2-popup.is-sent .hh2-form, .hh2-popup.is-sent > h2, .hh2-popup.is-sent > p { display: none; }
            .hh2-popup__success-icon { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%; background: #ECFDF3; color: #12B76A; display: grid; place-items: center; font-size: 28px; }
            .hh2-popup__success h3 { margin: 0 0 8px; font-size: 22px; font-weight: 500; color: ${NAVY}; }
            .hh2-popup__success p { margin: 0 0 20px; font-size: 15px; color: ${MUTED}; }
            .hh2-popup .hh2-btn { display: flex; min-height: 50px; padding: 0 26px; border: 0; border-radius: 8px; background: ${BLUE}; color: #fff; font-family: ${FONT}; font-size: 16px; font-weight: 500; cursor: pointer; align-items: center; justify-content: center; width: 100%; }
            .hh2-links { padding: 14px; border-radius: 10px; background: ${SECTION_LIGHT}; border: 1px solid ${BORDER_LIGHT}; }
            .hh2-links__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 4px; }
            .hh2-links__add { padding: 6px 12px; border: 0; border-radius: 6px; background: ${BLUE}; color: #fff; font-family: ${FONT}; font-size: 13px; font-weight: 500; cursor: pointer; }
            .hh2-links__list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
            .hh2-link-item { position: relative; display: grid; gap: 6px; padding: 14px 40px 14px 14px; background: #fff; border: 1px solid ${BORDER_LIGHT}; border-radius: 8px; }
            .hh2-link-item input { min-height: 40px; font-size: 14px; }
            .hh2-link-item__remove { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border: 0; border-radius: 50%; background: #FEE4E2; color: #D92D20; cursor: pointer; }

            @media (max-width: 992px) {
                .hh2-hero__inner { grid-template-columns: 1fr; gap: 36px; padding: 64px 24px 96px; }
                .hh2-hero h1 { font-size: 44px; max-width: 20ch; }
                .hh2-offer { max-width: 480px; }
                .hh2-head h2 { font-size: 30px; }
                .hh2-section { padding: 64px 0; }
                .hh2-reasons, .hh2-audiences { grid-template-columns: 1fr; max-width: 640px; margin: 0 auto; }
                .hh2-steps, .hh2-results { grid-template-columns: repeat(2,minmax(0,1fr)); }
                .hh2-trust__panel { grid-template-columns: repeat(2,minmax(0,1fr)); }
                .hh2-trust__item:nth-child(3) { border-left: 0; }
                .hh2-trust__item:nth-child(n+3) { border-top: 1px solid var(--hh2-border-light); }
                .hh2-founding, .hh2-founding__card { grid-template-columns: 1fr; }
                .hh2-flow { grid-template-columns: 1fr; max-width: 520px; margin: 0 auto; }
            }
            @media (max-width: 767px) {
                .hh2-wrap { padding: 0 16px; }
                .hh2-hero__inner { padding: 44px 16px 84px; }
                .hh2-hero h1 { font-size: 34px; }
                .hh2-hero__text { font-size: 16px; }
                .hh2-picker__options { grid-template-columns: 1fr; }
                .hh2-trust { padding: 0 16px; }
                .hh2-trust__value { font-size: 22px; }
                .hh2-section { padding: 48px 0; }
                .hh2-head { margin-bottom: 32px; }
                .hh2-head h2 { font-size: 28px; }
                .hh2-steps, .hh2-contact { grid-template-columns: 1fr; }
                .hh2-founding__card, .hh2-calc, .hh2-case, .hh2-fees, .hh2-testimonial { padding: 22px; }
                .hh2-testimonial blockquote { font-size: 17px; }
                .hh2-final { padding: 56px 16px 96px; }
                .hh2-final h2 { font-size: 28px; }
                .hh2-popup { padding: 24px 18px; }
                .hh2-sticky { display: flex; }
                .hh2-pill { font-size: 11px; padding: 6px 12px; }
                .hh2-fee__new { font-size: 34px; }
                .hh2-reason, .hh2-audience { padding: 22px; }
                .hh2-reason__icon { width: 40px; height: 40px; font-size: 20px; margin-bottom: 12px; }
                .hh2-reason h3, .hh2-audience h3 { font-size: 18px; }
                .hh2-fees { padding: 4px 18px; }
                .hh2-fees__row { flex-direction: column; gap: 2px; padding: 14px 0; }
                .hh2-fees__value { text-align: left; }
                .hh2-calc__rows li { align-items: flex-start; }
                .hh2-calc__rows small { display: block; }
                .hh2-compare table { min-width: 0; table-layout: fixed; }
                .hh2-compare th, .hh2-compare td { padding: 12px 4px; font-size: 13px; white-space: normal; }
                .hh2-compare th { font-size: 12px; }
                .hh2-name-full { display: none; }
                .hh2-name-short { display: inline; }
                .hh2-compare th:first-child, .hh2-compare td:first-child { width: 36%; padding-left: 12px; }
                .hh2-tick, .hh2-cross { width: 20px; height: 20px; }
                .hh2-steps { gap: 12px; }
                .hh2-step { padding: 18px 20px; }
                .hh2-step h3 { font-size: 18px; }
                .hh2-steps__assist { margin-bottom: 0; }
                .hh2-steps__picker { display: none; }
                .hh2-contact a { padding: 16px; }
            }
            @media (max-width: 480px) {
                .hh2-results { grid-template-columns: 1fr 1fr; }
                .hh2-result { padding: 12px 8px; }
                .hh2-result strong { font-size: 18px; white-space: nowrap; }
            }
        `;
        document.head.appendChild(style);
    }

    /* ── Section renderers ── */
    function renderPicker({ dark = false, center = false, withId = false } = {}) {
        const classes = ['hh2-picker', dark ? 'hh2-picker--dark' : '', center ? 'hh2-picker--center' : ''].filter(Boolean).join(' ');
        return `
            <div class="${classes}"${withId ? ' id="hh2-start"' : ''}>
                <p class="hh2-picker__label">${escapeHtml(PICKER.label)}</p>
                <div class="hh2-picker__options">
                    ${PICKER.options.map((item) => `
                        <button type="button" class="hh2-option" ${item.attrs}>
                            <span class="hh2-option__icon">${item.icon}</span>
                            <span class="hh2-option__body"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></span>
                            <span class="hh2-option__arrow" aria-hidden="true">→</span>
                        </button>`).join('')}
                </div>
                <p class="hh2-picker__note">${escapeHtml(PICKER.reassure)}</p>
            </div>`;
    }

    function renderSpots() {
        return `
            <div class="hh2-spots">
                <p class="hh2-spots__text" data-founding-count>__ of ${FOUNDING.totalSpots} founding spots claimed 🔒</p>
                <div class="hh2-spots__bar"><div class="hh2-spots__fill" data-founding-bar></div></div>
            </div>`;
    }

    const renderTickList = (items) =>
        `<ul class="hh2-perks">${items.map((item) => `<li><span class="hh2-tick">${icons.check}</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>`;

    function renderHero(heroImage) {
        return `
            <section class="hh2-hero hh2-full" style="background-image:url('${escapeHtml(heroImage)}')">
                <div class="hh2-hero__overlay"></div>
                <div class="hh2-hero__inner">
                    <div>
                        <div class="hh2-pill">${escapeHtml(HERO.pill)}</div>
                        <h1>${escapeHtml(HERO.title)}</h1>
                        <p class="hh2-hero__text">${escapeHtml(HERO.text)}</p>
                        ${renderPicker({ dark: true, withId: true })}
                    </div>
                    <div class="hh2-offer">
                        <span class="hh2-offer__badge">Founding partner offer</span>
                        <p class="hh2-offer__label">Limited to the first ${FOUNDING.totalSpots} listings</p>
                        <div class="hh2-fee">
                            <span class="hh2-fee__old">${FOUNDING.defaultFee} Host Fee</span>
                            <span class="hh2-fee__new">${FOUNDING.foundingFee} Host Fee</span>
                        </div>
                        ${renderSpots()}
                        ${renderTickList(HERO_OFFER_POINTS)}
                    </div>
                </div>
            </section>
            <div class="hh2-trust">
                <div class="hh2-trust__panel">
                    ${TRUST_STATS.map((s) => `
                        <div class="hh2-trust__item">
                            <p class="hh2-trust__value">${escapeHtml(s.value)}</p>
                            <p class="hh2-trust__label">${escapeHtml(s.label)}</p>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    function renderReasons() {
        return `
            <section class="hh2-section">
                <div class="hh2-wrap">
                    <div class="hh2-head"><h2>Why hosts add Keys Booking</h2></div>
                    <div class="hh2-reasons">
                        ${REASONS.map((r) => `
                            <div class="hh2-reason">
                                <div class="hh2-reason__icon">${r.icon}</div>
                                <h3>${escapeHtml(r.title)}</h3>
                                <p>${escapeHtml(r.text)}</p>
                            </div>`).join('')}
                    </div>
                </div>
            </section>`;
    }

    function renderListingCard(item) {
        return `
            <div class="hh2-listing">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
                <div class="hh2-listing__body">
                    <p class="hh2-listing__title">${escapeHtml(item.title)}</p>
                    <p class="hh2-listing__sub">${escapeHtml(item.subtitle)}</p>
                    <p class="hh2-listing__price">${escapeHtml(item.duration)} · <strong>$${formatCurrency(item.price)}</strong></p>
                </div>
            </div>`;
    }

    function renderGuestFlow() {
        const { stay, boat, charter, taxes } = GUEST_FLOW;
        const total = stay.price + boat.price + charter.price + taxes;
        const row = (label, amount, extra = '') =>
            `<div class="hh2-receipt__row ${extra}"><span>${label}</span><span>$${formatCurrency(amount)}</span></div>`;
        const logos = PARTNER_LOGOS.map((logo) => `
            <div class="hh2-logo${logo.dark ? ' hh2-logo--dark' : ''}">
                <img src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.name)}" loading="lazy">
            </div>`).join('');
        return `
            <section class="hh2-section hh2-section--alt">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <span class="hh2-eyebrow">How guests book</span>
                        <h2>Your stay is the center of the trip</h2>
                        <p>Guests book your stay, add a boat or charter from local operators, and pay once. You host the stay. We handle the rest of the trip.</p>
                    </div>
                    <div class="hh2-flow">
                        <div class="hh2-flow__step">
                            <div class="hh2-flow__head"><span class="hh2-step__num">Step 1</span><p>Guest books your stay — confirmed instantly</p></div>
                            ${renderListingCard(stay)}
                        </div>
                        <div class="hh2-flow__step">
                            <div class="hh2-flow__head"><span class="hh2-step__num">Step 2</span><p>They add a boat rental or fishing charter</p></div>
                            ${renderListingCard(boat)}
                            ${renderListingCard(charter)}
                        </div>
                        <div class="hh2-flow__step">
                            <div class="hh2-flow__head"><span class="hh2-step__num">Step 3</span><p>One checkout, plus our concierge for trip plans</p></div>
                            <div class="hh2-receipt">
                                <h4>Price details</h4>
                                ${row('Stay', stay.price)}
                                ${row('Boat Rental', boat.price)}
                                ${row('Fishing Charter', charter.price)}
                                ${row('Taxes', taxes)}
                                ${row('Total', total, 'hh2-receipt__row--total')}
                            </div>
                        </div>
                    </div>
                    <div class="hh2-video" data-demo-video>
                        <video muted playsinline preload="metadata"></video>
                        <button type="button" class="hh2-video__play" data-action="play-demo">${icons.play}<span>Watch how it works</span></button>
                    </div>
                    <p class="hh2-subhead">Boats and charters guests can add</p>
                    <div class="hh2-logos"><div class="hh2-logos__track">${logos}${logos}</div></div>
                </div>
            </section>`;
    }

    function renderAudiences() {
        return `
            <section class="hh2-section">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <span class="hh2-eyebrow">Who it’s for</span>
                        <h2>Built for every kind of Keys stay</h2>
                    </div>
                    <div class="hh2-audiences">
                        ${AUDIENCES.map((a) => `
                            <div class="hh2-audience">
                                <div class="hh2-reason__icon">${a.icon}</div>
                                <h3>${escapeHtml(a.title)}</h3>
                                <p>${escapeHtml(a.text)}</p>
                                <button type="button" class="hh2-btn hh2-btn--primary hh2-btn--full" ${a.attrs}>${escapeHtml(a.cta)}</button>
                            </div>`).join('')}
                    </div>
                </div>
            </section>`;
    }

    function renderFees() {
        const startValue = revenueToSlider(CALCULATOR.defaultRevenue);
        return `
            <section class="hh2-section hh2-section--alt">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <span class="hh2-eyebrow">Fees & payouts</span>
                        <h2>What it costs and how you get paid</h2>
                    </div>
                    <div class="hh2-founding">
                        <div class="hh2-fees">
                            ${FEE_ROWS.map((row) => `
                                <div class="hh2-fees__row">
                                    <span class="hh2-fees__label">${escapeHtml(row.label)}</span>
                                    <span class="hh2-fees__value">${escapeHtml(row.value)}${row.note ? `<small>${escapeHtml(row.note)}</small>` : ''}</span>
                                </div>`).join('')}
                        </div>
                        <div class="hh2-calc" data-calc>
                            <span class="hh2-eyebrow">What you keep</span>
                            <h3>See what ${FOUNDING.foundingFee} host fees are worth</h3>
                            <label for="hh2-calc-range">Your yearly booking revenue</label>
                            <div class="hh2-calc__revenue" data-calc-revenue></div>
                            <input type="range" id="hh2-calc-range" min="0" max="${SLIDER_MAX}" step="1" value="${startValue}">
                            <div class="hh2-calc__scale"><span>$10K</span><span>$1M+</span></div>
                            <div class="hh2-calc__headline">Keep up to<strong data-calc-max></strong>more per year</div>
                            <ul class="hh2-calc__rows">
                                ${COMPETITORS.map((c, i) => `
                                    <li><span>vs ${escapeHtml(c.name)} <small>(${c.calcFee}% ${escapeHtml(c.calcNote)})</small></span><strong data-calc-row="${i}"></strong></li>`).join('')}
                            </ul>
                            <p class="hh2-calc__note">Based on typical published fees. Actual fees vary by account and plan.</p>
                        </div>
                    </div>
                    <div class="hh2-founding__card">
                        <div>
                            <span class="hh2-eyebrow">Founding partners</span>
                            <h3>Lock in ${FOUNDING.foundingFee} host fees while spots last</h3>
                            ${renderTickList(FOUNDING_PERKS)}
                        </div>
                        <div>
                            ${renderSpots()}
                            <button type="button" class="hh2-btn hh2-btn--primary hh2-btn--full" data-scroll="hh2-start" style="margin-top:16px">Claim your spot</button>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    function renderComparison() {
        const cell = (value) => {
            if (value === true) return `<span class="hh2-tick">${icons.check}</span>`;
            if (value === false) return `<span class="hh2-cross">${icons.cross}</span>`;
            return escapeHtml(value);
        };
        return `
            <section class="hh2-section">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <h2>How we compare</h2>
                        <p>Keep the big platforms. Add the one built around the full Keys trip.</p>
                    </div>
                    <div class="hh2-compare">
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th class="is-us">Keys Booking</th>
                                    ${COMPETITORS.map((c) => c.shortName
                                        ? `<th><span class="hh2-name-full">${escapeHtml(c.name)}</span><span class="hh2-name-short">${escapeHtml(c.shortName)}</span></th>`
                                        : `<th>${escapeHtml(c.name)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${COMPARISON_ROWS.map((row) => {
                                    const them = Array.isArray(row.them) ? row.them : COMPETITORS.map(() => row.them);
                                    return `
                                        <tr>
                                            <td>${escapeHtml(row.label)}</td>
                                            <td class="is-us">${cell(row.us)}</td>
                                            ${them.map((v) => `<td>${cell(v)}</td>`).join('')}
                                        </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <p class="hh2-compare__note">${escapeHtml(COMPETITOR_FEE_NOTE)}</p>
                </div>
            </section>`;
    }

    function renderHowItWorks() {
        return `
            <section class="hh2-section hh2-section--alt">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <span class="hh2-eyebrow">Getting started</span>
                        <h2>List in a few steps</h2>
                    </div>
                    <div class="hh2-steps">
                        ${STEPS.map((step, i) => `
                            <div class="hh2-step">
                                <span class="hh2-step__num">Step ${i + 1}</span>
                                <h3>${escapeHtml(step.title)}</h3>
                                <p>${escapeHtml(step.text)}</p>
                            </div>`).join('')}
                    </div>
                    <p class="hh2-steps__needs">${escapeHtml(STEPS_NEEDS)}</p>
                    <p class="hh2-steps__assist">Prefer we do it? Send us your Airbnb or VRBO link and we’ll build your listing. <button type="button" class="hh2-link-btn" data-action="open-property-popup">Have us list it</button></p>
                    <div class="hh2-steps__picker">${renderPicker({ center: true })}</div>
                </div>
            </section>`;
    }

    function renderProof() {
        return `
            <section class="hh2-section">
                <div class="hh2-wrap">
                    <div class="hh2-head">
                        <span class="hh2-eyebrow">${escapeHtml(PROOF.eyebrow)}</span>
                        <h2>${escapeHtml(PROOF.title)}</h2>
                        <p>${escapeHtml(PROOF.text)}</p>
                    </div>
                    <div class="hh2-case">
                        <span class="hh2-eyebrow">Case study</span>
                        <h3>${escapeHtml(CASE_STUDY.title)}</h3>
                        <p>${escapeHtml(CASE_STUDY.campaign)}</p>
                        <div class="hh2-results">
                            ${CASE_STUDY.results.map((r) => `<div class="hh2-result"><strong>${r.icon} ${escapeHtml(r.value)}</strong><span>${escapeHtml(r.label)}</span></div>`).join('')}
                        </div>
                        <p class="hh2-case__conclusion">${escapeHtml(CASE_STUDY.conclusion)}</p>
                        <p style="margin-top:12px"><a href="${escapeHtml(CONTACT.instagramUrl)}" target="_blank" rel="noopener" class="hh2-link-btn">See the videos on Instagram →</a></p>
                    </div>
                    <figure class="hh2-testimonial">
                        <div class="hh2-testimonial__stars" aria-label="5 stars">★★★★★</div>
                        <blockquote>“${escapeHtml(TESTIMONIAL.quote)}”</blockquote>
                        <figcaption><strong>${escapeHtml(TESTIMONIAL.name)}</strong> · ${escapeHtml(TESTIMONIAL.role)}</figcaption>
                        <p class="hh2-testimonial__note">${escapeHtml(TESTIMONIAL.reviewsNote)}</p>
                    </figure>
                </div>
            </section>`;
    }

    function renderFaq() {
        const contactCards = [
            { icon: '📘', label: 'Stay Hosting Guide', value: 'How hosting works, step by step', href: CONTACT.hostingGuideUrl, external: true },
            { icon: '✉️', label: 'Email us', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
        ];
        return `
            <section class="hh2-section hh2-section--alt">
                <div class="hh2-wrap">
                    <div class="hh2-head"><h2>Questions hosts ask</h2></div>
                    <div class="hh2-faq">
                        ${FAQ_ITEMS.map((item, i) => `
                            <div class="hh2-faq-item">
                                <button type="button" class="hh2-faq-btn" aria-expanded="false" aria-controls="hh2-faq-${i}" data-faq="${i}">
                                    <span>${escapeHtml(item.q)}</span>${icons.chevron}
                                </button>
                                <div class="hh2-faq-panel" id="hh2-faq-${i}" role="region"><p>${escapeHtml(item.a)}</p></div>
                            </div>`).join('')}
                    </div>
                    <p class="hh2-subhead">Still have questions?</p>
                    <div class="hh2-contact">
                        ${contactCards.map((c) => `
                            <a href="${escapeHtml(c.href)}"${c.external ? ' target="_blank" rel="noopener"' : ''}>
                                <span class="hh2-contact__icon">${c.icon}</span>
                                <span class="hh2-contact__label">${escapeHtml(c.label)}</span>
                                <span class="hh2-contact__value">${escapeHtml(c.value)}</span>
                            </a>`).join('')}
                    </div>
                </div>
            </section>`;
    }

    function renderFinalCta(heroImage) {
        return `
            <section class="hh2-final hh2-full" style="background-image:url('${escapeHtml(heroImage)}')" data-final-cta>
                <div class="hh2-final__overlay"></div>
                <div class="hh2-final__inner">
                    <h2>Add Keys Booking to your booking mix</h2>
                    <p class="hh2-final__text">Free to list, ${FOUNDING.foundingFee} host fee for founding partners, and no contract. Founding spots are limited to the first ${FOUNDING.totalSpots} listings.</p>
                    ${renderPicker({ dark: true, center: true })}
                </div>
            </section>`;
    }

    function buildPageHtml(heroImage) {
        return [
            renderHero(heroImage),
            renderReasons(),
            renderGuestFlow(),
            renderAudiences(),
            renderFees(),
            renderComparison(),
            renderHowItWorks(),
            renderProof(),
            renderFaq(),
            renderFinalCta(heroImage),
        ].join('');
    }

    /* ── Data loaders ── */
    function loadHeroImage(root) {
        return fetch(HERO_IMAGE_API)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const url = data?.image?.url;
                if (!url) return;
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = img.onerror = resolve;
                    img.src = url;
                }).then(() => {
                    root.querySelectorAll('.hh2-hero, .hh2-final').forEach((el) => {
                        el.style.backgroundImage = `url('${url}')`;
                    });
                });
            })
            .catch((err) => console.error('Error fetching hero image:', err));
    }

    function loadFoundingCount(root) {
        const textEls = root.querySelectorAll('[data-founding-count]');
        const barEls = root.querySelectorAll('[data-founding-bar]');
        const leftEls = document.querySelectorAll('[data-founding-left]');
        const setCount = (n) => {
            textEls.forEach((el) => { el.textContent = `${n} of ${FOUNDING.totalSpots} founding spots claimed 🔒`; });
        };

        fetch(FOUNDING_COUNT_API)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch founding partner count');
                return res.json();
            })
            .then((count) => {
                const target = Math.min(parseInt(count, 10) || 0, FOUNDING.totalSpots);
                barEls.forEach((el) => { el.style.width = `${(target / FOUNDING.totalSpots) * 100}%`; });
                leftEls.forEach((el) => { el.textContent = `Only ${FOUNDING.totalSpots - target} founding spots left`; });
                const steps = 60;
                let step = 0;
                const timer = setInterval(() => {
                    step++;
                    setCount(Math.floor((target * step) / steps));
                    if (step >= steps) clearInterval(timer);
                }, 500 / steps);
            })
            .catch((err) => console.error('Error fetching founding partner count:', err));
    }

    function loadDemoVideo(root) {
        const wrapper = root.querySelector('[data-demo-video]');
        const video = wrapper?.querySelector('video');
        if (!video) return Promise.resolve();

        video.muted = true;
        video.playsInline = true;
        video.loop = true;

        return fetch(DEMO_VIDEO_API)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const url = Array.isArray(data) ? data[0]?.video?.url : null;
                if (!url) return;
                video.src = url;
                video.load();
            })
            .catch((err) => console.error('Error fetching demo video:', err));
    }

    /* ── "We add it for you" popup ── */
    function createPropertyPopup() {
        const overlay = document.createElement('div');
        overlay.className = 'hh2-popup-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Let us add your property');
        overlay.innerHTML = `
            <div class="hh2-popup">
                <button type="button" class="hh2-popup__close" aria-label="Close">&times;</button>
                <h2>Let us add your property</h2>
                <p>We’ll handle the listing process for you — homes, condos, and hotels. Just tell us a bit about your property.</p>
                <form class="hh2-form">
                    <div class="hh2-field">
                        <label for="hh2-property-type">Property type</label>
                        <select id="hh2-property-type" name="property-type">
                            ${PROPERTY_FORM_TYPES.map((t) => `<option value="${t.value}">${escapeHtml(t.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="hh2-field">
                        <label for="hh2-email">Your email</label>
                        <input type="email" id="hh2-email" name="email" placeholder="you@example.com" autocomplete="email" required>
                    </div>
                    <div class="hh2-field">
                        <label for="hh2-property-name">Property or business name <small>(optional)</small></label>
                        <input type="text" id="hh2-property-name" name="property-name" placeholder="e.g., Sunset Key Inn">
                    </div>
                    <div class="hh2-field">
                        <label for="hh2-property-count" data-count-label>How many properties do you have?</label>
                        <input type="number" id="hh2-property-count" name="property-count" min="1" max="999" placeholder="e.g., 5" required>
                    </div>
                    <div class="hh2-field">
                        <label for="hh2-phone">Phone number <small>(optional)</small></label>
                        <input type="tel" id="hh2-phone" name="phone" placeholder="(305) 123-4567">
                        <small>We may call to discuss your property</small>
                    </div>
                    <div class="hh2-links">
                        <div class="hh2-links__head">
                            <label class="hh2-field" style="margin:0"><span style="font-size:14px;font-weight:500;color:${NAVY}">Listing links <small>(optional)</small></span></label>
                            <button type="button" class="hh2-links__add">+ Add link</button>
                        </div>
                        <small style="font-size:12px;color:${MUTED}">Add links from Airbnb, VRBO, Booking.com, Expedia, or your website</small>
                        <div class="hh2-links__list"></div>
                    </div>
                    <div class="hh2-form__hp" aria-hidden="true">
                        <label for="hh2-website">Website</label>
                        <input type="text" id="hh2-website" name="website" tabindex="-1" autocomplete="off">
                    </div>
                    <p class="hh2-form__error" role="alert"></p>
                    <button type="submit" class="hh2-btn hh2-btn--primary hh2-btn--full">Send to our team</button>
                </form>
                <div class="hh2-popup__success" role="status">
                    <div class="hh2-popup__success-icon">✓</div>
                    <h3>Thanks — we got it</h3>
                    <p>Our team will reach out soon to get your listing set up.</p>
                    <button type="button" class="hh2-btn hh2-btn--primary hh2-btn--full" data-popup-done>Done</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const form = overlay.querySelector('.hh2-form');
        const typeSelect = overlay.querySelector('#hh2-property-type');
        const nameInput = overlay.querySelector('#hh2-property-name');
        const countInput = overlay.querySelector('#hh2-property-count');
        const countLabel = overlay.querySelector('[data-count-label]');
        const phoneInput = overlay.querySelector('#hh2-phone');
        const emailInput = overlay.querySelector('#hh2-email');
        const honeypotInput = overlay.querySelector('#hh2-website');
        const linksList = overlay.querySelector('.hh2-links__list');
        const popup = overlay.querySelector('.hh2-popup');
        const errorEl = overlay.querySelector('.hh2-form__error');
        const submitBtn = form.querySelector('button[type="submit"]');
        const submitLabel = submitBtn.textContent;

        const setError = (html) => {
            errorEl.innerHTML = html;
            errorEl.classList.toggle('is-visible', Boolean(html));
        };

        const getType = () => PROPERTY_FORM_TYPES.find((t) => t.value === typeSelect.value) || PROPERTY_FORM_TYPES[0];
        const syncCountLabel = () => {
            const usesRooms = getType().usesRooms;
            countLabel.textContent = usesRooms ? 'How many rooms or units do you have?' : 'How many properties do you have?';
            countInput.placeholder = usesRooms ? 'e.g., 24' : 'e.g., 5';
        };
        typeSelect.addEventListener('change', syncCountLabel);

        overlay.querySelector('.hh2-links__add').addEventListener('click', () => {
            const item = document.createElement('div');
            item.className = 'hh2-link-item';
            item.innerHTML = `
                <input type="text" class="hh2-link-label" placeholder="Label (e.g., Oceanview Condo)">
                <input type="url" class="hh2-link-url" placeholder="https://airbnb.com/...">
                <button type="button" class="hh2-link-item__remove" aria-label="Remove link">&times;</button>`;
            item.querySelector('.hh2-link-item__remove').addEventListener('click', () => item.remove());
            linksList.appendChild(item);
            item.querySelector('.hh2-link-label').focus();
        });

        const close = () => {
            overlay.classList.remove('is-open');
            document.body.classList.remove('hh2-no-scroll');
            resetForm();
        };

        const resetForm = () => {
            form.reset();
            linksList.innerHTML = '';
            popup.classList.remove('is-sent');
            setError('');
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
        };

        const open = (propertyType) => {
            resetForm();
            if (propertyType) typeSelect.value = propertyType;
            syncCountLabel();
            overlay.classList.add('is-open');
            document.body.classList.add('hh2-no-scroll');
            setTimeout(() => emailInput.focus(), 300);
        };

        overlay.querySelector('.hh2-popup__close').addEventListener('click', close);
        overlay.querySelector('[data-popup-done]').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitBtn.disabled) return;
            const email = emailInput.value.trim();
            const type = getType();
            const count = countInput.value;
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const links = [...linksList.querySelectorAll('.hh2-link-item')]
                .map((item) => ({
                    label: item.querySelector('.hh2-link-label').value.trim(),
                    url: item.querySelector('.hh2-link-url').value.trim(),
                }))
                .filter((link) => link.label || link.url);

            const countText = type.usesRooms
                ? `${count} ${count === '1' ? 'Room' : 'Rooms'}`
                : `${count} ${count === '1' ? 'Property' : 'Properties'}`;
            const subject = `Add My Listing Request - ${type.label} - ${countText}`;

            let body = 'New "add my property" request from the host landing page.\n\n';
            body += `Email: ${email}\n`;
            if (phone) body += `Phone: ${phone}\n`;
            body += `Property Type: ${type.label}\n`;
            if (name) body += `Property Name: ${name}\n`;
            body += `${type.usesRooms ? 'Number of Rooms/Units' : 'Number of Properties'}: ${count}\n`;
            if (links.length) {
                body += '\nListing Links:\n';
                links.forEach((link, i) => {
                    body += `${i + 1}. ${[link.label, link.url].filter(Boolean).join(' - ')}\n`;
                });
            }

            setError('');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            try {
                const response = await fetch(ADD_PROPERTY_REQUEST_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        phone,
                        property_type: type.label,
                        property_name: name,
                        count: Number(count),
                        links,
                        subject,
                        body,
                        website: honeypotInput.value,
                    }),
                });
                if (!response.ok) throw new Error(`Request failed: ${response.status}`);
                popup.classList.add('is-sent');
            } catch (error) {
                console.error('Add property request failed:', error);
                const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                setError(`Something went wrong sending your request. Please try again, or <a href="${escapeHtml(mailto)}">email us directly</a>.`);
                submitBtn.disabled = false;
                submitBtn.textContent = submitLabel;
            }
        });

        return { open };
    }

    /* ── Interactions ── */
    function scrollToStart() {
        const target = document.getElementById('hh2-start');
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function initCalculator(root) {
        const calc = root.querySelector('[data-calc]');
        if (!calc) return;
        const range = calc.querySelector('input[type="range"]');
        const revenueEl = calc.querySelector('[data-calc-revenue]');
        const maxEl = calc.querySelector('[data-calc-max]');
        const rowEls = calc.querySelectorAll('[data-calc-row]');

        const update = () => {
            const revenue = sliderToRevenue(Number(range.value));
            const savings = COMPETITORS.map((c) => savingsVs(revenue, c));
            revenueEl.textContent = `${formatDollars(revenue)}${revenue >= CALCULATOR.max ? '+' : ''}`;
            maxEl.textContent = formatDollars(Math.max(...savings));
            rowEls.forEach((el) => { el.textContent = `+${formatDollars(savings[Number(el.dataset.calcRow)])}`; });
        };

        range.addEventListener('input', update);
        update();
    }

    function initStickyCta(root) {
        const bar = document.createElement('div');
        bar.className = 'hh2-sticky';
        bar.innerHTML = `
            <div class="hh2-sticky__copy">
                <strong>${FOUNDING.foundingFee} host fee for founding partners</strong>
                <span data-founding-left>Limited founding spots</span>
            </div>
            <button type="button">List your property</button>`;
        bar.querySelector('button').addEventListener('click', scrollToStart);
        document.body.appendChild(bar);

        const watched = [root.querySelector('#hh2-start'), root.querySelector('[data-final-cta]')].filter(Boolean);
        if (!('IntersectionObserver' in window) || !watched.length) {
            bar.classList.add('is-visible');
            return;
        }

        const visible = new Set();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) visible.add(entry.target);
                else visible.delete(entry.target);
            });
            const pastHero = window.scrollY > 200;
            bar.classList.toggle('is-visible', pastHero && visible.size === 0);
        });
        watched.forEach((el) => observer.observe(el));
    }

    function bindPageInteractions(root, propertyPopup) {
        if (root.dataset.hh2Bound) return;
        root.dataset.hh2Bound = 'true';

        root.addEventListener('click', (e) => {
            const popupBtn = e.target.closest('[data-action="open-property-popup"]');
            if (popupBtn) {
                e.preventDefault();
                propertyPopup.open(popupBtn.dataset.propertyType);
                return;
            }

            const scrollBtn = e.target.closest('[data-scroll="hh2-start"]');
            if (scrollBtn) {
                e.preventDefault();
                scrollToStart();
                return;
            }

            const playBtn = e.target.closest('[data-action="play-demo"]');
            if (playBtn) {
                const wrapper = playBtn.closest('[data-demo-video]');
                const video = wrapper.querySelector('video');
                video.controls = true;
                video.play()
                    .then(() => wrapper.classList.add('is-playing'))
                    .catch((err) => console.error('Error playing video:', err));
                return;
            }

            const faqBtn = e.target.closest('.hh2-faq-btn');
            if (faqBtn) {
                const panel = root.querySelector(`#hh2-faq-${faqBtn.dataset.faq}`);
                if (!panel) return;
                const isOpen = faqBtn.getAttribute('aria-expanded') === 'true';
                if (openFaqButton && openFaqButton !== faqBtn) {
                    openFaqButton.setAttribute('aria-expanded', 'false');
                    root.querySelector(`#hh2-faq-${openFaqButton.dataset.faq}`)?.classList.remove('is-open');
                }
                faqBtn.setAttribute('aria-expanded', String(!isOpen));
                panel.classList.toggle('is-open', !isOpen);
                openFaqButton = isOpen ? null : faqBtn;
            }
        });

        // Legacy Webflow "we add it for you" links outside the container
        document.querySelectorAll('[data-element="hostLanding_weAddProperty"]').forEach((button) => {
            if (root.contains(button)) return;
            button.addEventListener('click', (e) => {
                e.preventDefault();
                propertyPopup.open();
            });
        });
    }

    // Joins the last two words of each text block so a line never ends with one word alone.
    function preventOrphans(root) {
        root.querySelectorAll('h1, h2, h3, h4, p, li, label, blockquote, figcaption, small, td, th, button, span').forEach((el) => {
            const meaningful = [...el.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim());
            const last = meaningful[meaningful.length - 1];
            if (!last || last.nodeType !== Node.TEXT_NODE) return;
            const text = last.textContent;
            const words = text.trim().split(/\s+/);
            if (words.length < 3 || words[words.length - 1].length > 14) return;
            const i = text.trimEnd().lastIndexOf(' ');
            if (i > 0) last.textContent = `${text.slice(0, i)}\u00A0${text.slice(i + 1)}`;
        });
    }

    function init() {
        const container = document.querySelector(CONTAINER_SELECTOR);
        if (!container) return;

        const loader = document.querySelector('[data-element="loader"]');
        if (loader) loader.style.display = 'flex';
        const hideLoader = () => { if (loader) loader.style.display = 'none'; };

        injectStyles();
        container.innerHTML = buildPageHtml(DEFAULT_HERO_IMAGE);
        preventOrphans(container);
        const popup = createPropertyPopup();
        preventOrphans(document.querySelector('.hh2-popup-overlay'));
        bindPageInteractions(container, popup);
        initCalculator(container);
        initStickyCta(container);

        loadFoundingCount(container);
        loadDemoVideo(container);

        // Don't hold the page behind the loader if the hero API is slow
        const loaderTimeout = setTimeout(hideLoader, 2500);
        loadHeroImage(container).finally(() => {
            clearTimeout(loaderTimeout);
            hideLoader();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
