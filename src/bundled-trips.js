



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


// Bundled trips card renderer
document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/bundled_trips';
    const templateCard = document.querySelector('[data-element="card_block"]');

    // simple truncate to keep names in a single line
    const truncateToFit = (el) => {
        if (!el) return;
        if (!el.dataset.fullText) {
            el.dataset.fullText = (el.textContent || '').trim();
        }
        const full = el.dataset.fullText;
        const parent = el.parentElement;
        if (!full || !parent) return;

        el.textContent = '';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.display = 'block';
        el.style.maxWidth = '100%';

        const measure = document.createElement('span');
        measure.style.visibility = 'hidden';
        measure.style.position = 'absolute';
        measure.style.whiteSpace = 'nowrap';
        measure.style.font = window.getComputedStyle(el).font;
        document.body.appendChild(measure);

        measure.textContent = full;
        const parentWidth = parent.clientWidth;
        if (parentWidth <= 0) {
            document.body.removeChild(measure);
            el.textContent = full;
            setTimeout(() => truncateToFit(el), 100);
            return;
        }

        if (measure.offsetWidth <= parentWidth) {
            el.textContent = full;
            document.body.removeChild(measure);
            return;
        }

        let text = full;
        while (text.length > 0) {
            measure.textContent = `${text}…`;
            if (measure.offsetWidth <= parentWidth) {
                el.textContent = `${text}…`;
                document.body.removeChild(measure);
                return;
            }
            text = text.slice(0, -1);
        }

        el.textContent = '…';
        document.body.removeChild(measure);
    };

    // If there is no template card on the page, bail out silently
    if (!templateCard) {
        return;
    }

    const cardsContainer = templateCard.parentElement;
    const baseTemplate = templateCard.cloneNode(true);
    templateCard.remove();

    // Loader element
    const loaderEl = document.querySelector('[data-element="loader"]');
    const setLoading = (isLoading) => {
        if (!loaderEl) return;
        loaderEl.style.display = isLoading ? 'block' : 'none';
    };

    const setImageOrText = (el, value) => {
        if (!el) return;

        if (el.tagName === 'IMG') {
            if (value) {
                el.src = value;
                if (!el.alt) el.alt = '';
            } else {
                el.removeAttribute('src');
            }
        } else {
            el.textContent = value || '';
        }
    };

    // Session + helpers for matching/logging
    const sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() :
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const normalizeForMatch = (str = '') =>
        str.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

    const toTitleLike = (str = '') =>
        normalizeForMatch(str).replace(/\b\w/g, c => c.toUpperCase());

    const logEvent = (payload = {}) => {
        const body = {
            session_id: sessionId,
            on_load: false,
            link_used: '',
            linked_used_name: '',
            on_link_click: false,
            link_clicked: '',
            link_clicked_trip_name: '',
            ...payload
        };

        try {
            fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/bundled_trips_eventlog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                keepalive: true
            }).catch(() => { });
        } catch (e) {
            // ignore network errors
        }
    };

    const setButtonLink = (el, url, tripName = '') => {
        if (!el || !url) return;
        const handleClick = () => {
            logEvent({
                on_link_click: true,
                link_clicked: url.toLowerCase(),
                link_clicked_trip_name: tripName
            });
        };

        if (el.tagName === 'A') {
            el.href = url;
            el.target = '_blank';
            el.rel = 'noopener';
            el.addEventListener('click', handleClick);
        } else {
            el.addEventListener('click', () => {
                handleClick();
                window.open(url, '_blank', 'noopener');
            });
        }
    };

    const getFirstPhotoUrl = (photos) => {
        if (!Array.isArray(photos)) return '';
        const ordered = photos.find((p) => p?.order === 1 && p?.image?.url);
        if (ordered && ordered.image.url) return ordered.image.url;
        const fallback = photos.find((p) => p?.image?.url);
        return fallback?.image?.url || '';
    };

    const getCharterImage = (charter) => {
        const charterImages = charter?._fishingcharter?.images;
        if (!Array.isArray(charterImages)) return '';

        const primary = charterImages.find((img) => img?.order === 1 && img?.image?.url) ||
            charterImages.find((img) => img?.image?.url);

        return primary?.image?.url || '';
    };

    const renderTrips = (trips) => {
        trips.forEach((trip) => {
            const card = baseTemplate.cloneNode(true);
            const toTruncate = [];

            // trip name
            setImageOrText(card.querySelector('[data-element="card_title"]'), trip?.trip_name || '');

            // cover image
            setImageOrText(card.querySelector('[data-element="card_image"]'), trip?.post_coverImage?.url || '');

            // nights
            const nightsEl = card.querySelector('[data-element="card_city_nights"]');
            if (nightsEl) {
                const nights = trip?.trip_nights;
                const city = trip?._property?.listing_city_state || '';
                const nightsText = typeof nights === 'number' ? `${nights} night${nights === 1 ? '' : 's'}` : '';

                if (city && nightsText) {
                    nightsEl.textContent = `${city} · ${nightsText}`;
                } else if (city) {
                    nightsEl.textContent = city;
                } else {
                    nightsEl.textContent = nightsText;
                }
            }

            // stay image
            setImageOrText(
                card.querySelector('[data-element="card_stay_image"]'),
                trip?._property?._property_main_image?.property_image?.url || ''
            );
            const stayBlock = card.querySelector('[data-element="card_stay_block"]');
            const stayNameEl = card.querySelector('[data-element="card_stay_name"]');
            const stayCompanyEl = card.querySelector('[data-element="card_stay_company"]');
            if (stayNameEl) {
                stayNameEl.textContent = trip?._property?.property_name || '';
                toTruncate.push(stayNameEl);
            }
            if (stayCompanyEl) {
                const hostFirst = trip?._property?._host_info?.First_Name || '';
                stayCompanyEl.textContent = hostFirst ? `Hosted by ${hostFirst}` : '';
                toTruncate.push(stayCompanyEl);
            }

            // boat image
            const boatBlock = card.querySelector('[data-element="card_boat_block"]');
            const boatImageEl = card.querySelector('[data-element="card_boat_image"]');
            const boatNameEl = card.querySelector('[data-element="card_boat_name"]');
            const boatCompanyEl = card.querySelector('[data-element="card_boat_company"]');
            if (!trip?.hasBoatRental) {
                boatBlock?.remove();
            } else {
                setImageOrText(
                    boatImageEl,
                    getFirstPhotoUrl(trip?._boat?.photos)
                );
                if (boatNameEl) {
                    boatNameEl.textContent = trip?._boat?.name || '';
                    toTruncate.push(boatNameEl);
                }
                if (boatCompanyEl) {
                    boatCompanyEl.textContent =
                        trip?._boat?.__boatcompany?.name ||
                        trip?._boat?._boatcompany?.name ||
                        trip?._boat?.boat_company?.name ||
                        '';
                    toTruncate.push(boatCompanyEl);
                }
            }

            // charter images (duplicate element for multiple charters)
            const charterBlockTemplate = card.querySelector('[data-element="card_charter_block"]');
            if (!trip?.hasFishingCharter || !Array.isArray(trip?.fishingcharters) || !charterBlockTemplate) {
                charterBlockTemplate?.remove();
            } else {
                const charterParent = charterBlockTemplate.parentElement || card;
                charterBlockTemplate.remove();

                trip.fishingcharters.forEach((charter) => {
                    const block = charterBlockTemplate.cloneNode(true);
                    const charterImageEl = block.querySelector('[data-element="card_charter_image"]');
                    const charterNameEl = block.querySelector('[data-element="card_charter_name"]');
                    const charterCompanyEl = block.querySelector('[data-element="card_charter_company"]');

                    setImageOrText(charterImageEl, getCharterImage(charter));

                    const tripId = charter?.trip_id;
                    const tripOptionName = charter?._fishingcharter?.tripOptions?.find((opt) => opt?.id === tripId)?.name || '';
                    if (charterNameEl) {
                        charterNameEl.textContent = tripOptionName;
                        toTruncate.push(charterNameEl);
                    }

                    if (charterCompanyEl) {
                        charterCompanyEl.textContent = charter?.__fishingcharter?.name || charter?._fishingcharter?.name || '';
                        toTruncate.push(charterCompanyEl);
                    }

                    charterParent.appendChild(block);
                });
            }

            // visit page button
            setButtonLink(card.querySelector('[data-element="card_visitPage_button"]'), trip?.trip_link, trip?.trip_name || '');

            cardsContainer.appendChild(card);

            // defer truncation until after layout
            if (toTruncate.length) {
                requestAnimationFrame(() => {
                    toTruncate.forEach(truncateToFit);
                });
            }
        });
    };

    setLoading(true);

    fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
            setLoading(false);
            if (!Array.isArray(data)) return;

            const params = new URLSearchParams(window.location.search);
            const referenceRaw = params.get('reference') || '';
            const referenceNormalized = normalizeForMatch(referenceRaw);

            // baseline order: soonest publish_date first
            const sorted = [...data].sort((a, b) => {
                const da = a?.publish_date ? new Date(a.publish_date).getTime() : Infinity;
                const db = b?.publish_date ? new Date(b.publish_date).getTime() : Infinity;
                return da - db;
            });

            let tripsToRender = sorted;
            if (referenceNormalized) {
                const idx = sorted.findIndex(trip => normalizeForMatch(trip?.trip_name || '') === referenceNormalized);
                if (idx > -1) {
                    const [match] = sorted.splice(idx, 1);
                    tripsToRender = [match, ...sorted];
                }
            }

            // log on-load event
            logEvent({
                on_load: true,
                link_used: referenceRaw || '',
                linked_used_name: referenceNormalized ? toTitleLike(referenceRaw) : '',
            });

            renderTrips(tripsToRender);
        })
        .catch((err) => {
            setLoading(false);
            console.error('Failed to load bundled trips', err);
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