



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

    // If there is no template card on the page, bail out silently
    if (!templateCard) {
        return;
    }

    const cardsContainer = templateCard.parentElement;
    const baseTemplate = templateCard.cloneNode(true);
    templateCard.remove();

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

    const setButtonLink = (el, url) => {
        if (!el || !url) return;
        if (el.tagName === 'A') {
            el.href = url;
            el.target = '_blank';
        } else {
            el.addEventListener('click', () => {
                window.location.href = url;
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

    const getCharterImages = (fishingcharters) => {
        if (!Array.isArray(fishingcharters)) return [];
        const images = [];

        fishingcharters.forEach((charter) => {
            const charterImages = charter?._fishingcharter?.images;
            if (!Array.isArray(charterImages)) return;

            const primary = charterImages.find((img) => img?.order === 1 && img?.image?.url) ||
                charterImages.find((img) => img?.image?.url);

            if (primary?.image?.url) {
                images.push(primary.image.url);
            }
        });

        return images;
    };

    const renderTrips = (trips) => {
        trips.forEach((trip) => {
            const card = baseTemplate.cloneNode(true);

            // trip name
            setImageOrText(card.querySelector('[data-element="card_image"]'), trip?.trip_name || '');

            // cover image
            setImageOrText(card.querySelector('[data-element="card_title"]'), trip?.post_coverImage?.url || '');

            // nights
            const nightsEl = card.querySelector('[data-element="card_city_nights"]');
            if (nightsEl) {
                const nights = trip?.trip_nights;
                nightsEl.textContent = typeof nights === 'number' ? `${nights} night${nights === 1 ? '' : 's'}` : '';
            }

            // stay image
            setImageOrText(
                card.querySelector('[data-element="card_stay_image"]'),
                trip?._property?._property_main_image?.property_image?.url || ''
            );

            // boat image
            setImageOrText(
                card.querySelector('[data-element="card_boat_image"]'),
                getFirstPhotoUrl(trip?._boat?.photos)
            );

            // charter images (duplicate element for multiple charters)
            const charterImages = getCharterImages(trip?.fishingcharters);
            const charterPlaceholder = card.querySelector('[data-element="card_charter_image"]');

            if (charterPlaceholder) {
                const charterParent = charterPlaceholder.parentElement || card;

                if (!charterImages.length) {
                    charterPlaceholder.remove();
                } else {
                    charterImages.forEach((url, idx) => {
                        const targetEl = idx === 0 ? charterPlaceholder : charterPlaceholder.cloneNode(true);
                        setImageOrText(targetEl, url);
                        if (idx > 0) {
                            charterParent.appendChild(targetEl);
                        }
                    });
                }
            }

            // visit page button
            setButtonLink(card.querySelector('[data-element="card_visitPage_button"]'), trip?.trip_link);

            cardsContainer.appendChild(card);
        });
    };

    fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
            if (!Array.isArray(data)) return;
            renderTrips(data);
        })
        .catch((err) => {
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