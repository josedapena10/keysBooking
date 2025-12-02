



// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// Add a new script element to load your file
var scriptToAdd = document.createElement('script');
scriptToAdd.src = 'index-search.js'; // Update this path accordingly
document.body.appendChild(scriptToAdd);

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


// Signup Form Validation
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


// Concierge Form Functionality
(async function () {
    try {
        // Get all form elements
        const modal = document.querySelector('[data-element="concierge_modal"]');
        const nameInput = document.querySelector('[data-element="concierge_name"]');
        const emailInput = document.querySelector('[data-element="concierge_email"]');
        const phoneInput = document.querySelector('[data-element="concierge_phoneNumber"]');
        const reservationInput = document.querySelector('[data-element="concierge_reservationCodeDates"]');
        const textboxInput = document.querySelector('[data-element="concierge_textbox"]');
        const submitButton = document.querySelector('[data-element="concierge_submitButton"]');
        const submitButtonText = document.querySelector('[data-element="concierge_submitButtonText"]');
        const submitButtonLoader = document.querySelector('[data-element="concierge_submitButtonLoader"]');

        // Service checkboxes mapping
        const serviceCheckboxes = {
            concierge_checkbox_helpPlanning: { element: null, text: '🏠 Help planning my trip (home, boat, or charter)' },
            concierge_checkbox_boatCharter: { element: null, text: '⚓ Boat or charter rental coordination' },
            concierge_checkbox_addServices: { element: null, text: '🛥️ Add services to my existing booking' },
            concierge_checkbox_privateChef: { element: null, text: '👨‍🍳 Private chef or in-home dining' },
            concierge_checkbox_golfCart: { element: null, text: '🚗 Golf cart or vehicle rental' },
            concierge_checkbox_groceryDelivery: { element: null, text: '🛒 Grocery delivery before arrival' },
            concierge_checkbox_spaWellness: { element: null, text: '💆 Spa or wellness services' },
            concierge_checkbox_fishingCharter: { element: null, text: '🎣 Fishing charters or local tours' },
            concierge_checkbox_restaurant: { element: null, text: '🍽️ Restaurant reservations or recommendations' },
            concierge_checkbox_familyGroup: { element: null, text: '👨‍👩‍👧 Family or group experiences' },
            concierge_checkbox_other: { element: null, text: '✨ Other (custom request)' }
        };

        // Timing checkboxes mapping
        const timingCheckboxes = {
            concierge_checkbox_asSoonAsPossible: { element: null, text: 'As soon as possible' },
            concierge_checkbox_beforeTrip: { element: null, text: 'Before my trip' },
            concierge_checkbox_duringTrip: { element: null, text: 'During my stay' }
        };

        // Get all checkbox elements
        Object.keys(serviceCheckboxes).forEach(key => {
            serviceCheckboxes[key].element = document.querySelector(`[data-element="${key}"]`);
        });

        Object.keys(timingCheckboxes).forEach(key => {
            timingCheckboxes[key].element = document.querySelector(`[data-element="${key}"]`);
        });

        // Initially hide the loader
        if (submitButtonLoader) {
            submitButtonLoader.style.display = 'none';
        }

        // Set to track selected checkboxes
        let selectedServices = new Set();
        let selectedTiming = null;

        // Setup service checkbox click handlers
        Object.keys(serviceCheckboxes).forEach(key => {
            const checkbox = serviceCheckboxes[key].element;
            if (checkbox) {
                checkbox.style.cursor = 'pointer';
                checkbox.addEventListener('click', function () {
                    if (selectedServices.has(key)) {
                        // Unselect
                        selectedServices.delete(key);
                        checkbox.style.backgroundColor = '';
                    } else {
                        // Select
                        selectedServices.add(key);
                        checkbox.style.backgroundColor = 'black';
                    }
                });
            }
        });

        // Setup timing checkbox click handlers (only one can be selected)
        Object.keys(timingCheckboxes).forEach(key => {
            const checkbox = timingCheckboxes[key].element;
            if (checkbox) {
                checkbox.style.cursor = 'pointer';
                checkbox.addEventListener('click', function () {
                    // Unselect all timing checkboxes first
                    Object.keys(timingCheckboxes).forEach(k => {
                        const cb = timingCheckboxes[k].element;
                        if (cb) {
                            cb.style.backgroundColor = '';
                        }
                    });

                    // Select this one
                    selectedTiming = key;
                    checkbox.style.backgroundColor = 'black';
                });
            }
        });

        // Form validation helper
        function validateForm() {
            const errors = [];

            // Name is required
            if (!nameInput || !nameInput.value.trim()) {
                errors.push('Full Name is required');
            }

            // Email is required and should be valid
            if (!emailInput || !emailInput.value.trim()) {
                errors.push('Email Address is required');
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value.trim())) {
                    errors.push('Please enter a valid email address');
                }
            }

            // At least one service must be selected
            if (selectedServices.size === 0) {
                errors.push('Please select at least one service');
            }

            // Text description is required
            if (!textboxInput || !textboxInput.value.trim()) {
                errors.push('Please tell us more about what you need');
            }

            // Timing preference is required
            if (!selectedTiming) {
                errors.push('Please select when you would like assistance');
            }

            return errors;
        }

        // Submit button handler
        if (submitButton) {
            submitButton.addEventListener('click', async function () {
                // Validate form
                const errors = validateForm();
                if (errors.length > 0) {
                    alert('Please complete the form:\n\n' + errors.join('\n'));
                    return;
                }

                // Show loader, hide text
                if (submitButtonLoader) {
                    submitButtonLoader.style.display = 'block';
                }
                if (submitButtonText) {
                    submitButtonText.style.display = 'none';
                }

                // Disable button during submission
                submitButton.style.pointerEvents = 'none';
                submitButton.style.opacity = '0.6';

                try {
                    // Build the checkboxSelected string
                    const selectedServiceTexts = Array.from(selectedServices).map(
                        key => serviceCheckboxes[key].text
                    );
                    const checkboxSelectedString = selectedServiceTexts.join(', ');

                    // Get the timing preference text
                    const whenText = selectedTiming ? timingCheckboxes[selectedTiming].text : '';

                    // Prepare the payload
                    const payload = {
                        name: nameInput.value.trim(),
                        email: emailInput.value.trim(),
                        phoneNumber: phoneInput ? phoneInput.value.trim() : '',
                        reservationCodeDates: reservationInput ? reservationInput.value.trim() : '',
                        checkboxSelected: checkboxSelectedString,
                        textBox: textboxInput.value.trim(),
                        when: whenText
                    };

                    // Make the API request
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/concierge_form_submission', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    // Success - close the modal
                    // Reset form
                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                    if (phoneInput) phoneInput.value = '';
                    if (reservationInput) reservationInput.value = '';
                    if (textboxInput) textboxInput.value = '';

                    // Clear all checkbox selections
                    selectedServices.clear();
                    Object.keys(serviceCheckboxes).forEach(key => {
                        const checkbox = serviceCheckboxes[key].element;
                        if (checkbox) {
                            checkbox.style.backgroundColor = '';
                        }
                    });

                    selectedTiming = null;
                    Object.keys(timingCheckboxes).forEach(key => {
                        const checkbox = timingCheckboxes[key].element;
                        if (checkbox) {
                            checkbox.style.backgroundColor = '';
                        }
                    });

                    // Close the modal by triggering close button
                    const closeButton = modal?.querySelector('.close_modal');
                    if (closeButton) {
                        closeButton.click();
                    }

                    // Show success message
                    alert('Thank you! Your concierge request has been submitted. Our team will be in touch soon.');

                } catch (error) {
                    console.error('Error submitting concierge form:', error);
                    alert('There was an error submitting your request. Please try again or contact support.');
                } finally {
                    // Hide loader, show text
                    if (submitButtonLoader) {
                        submitButtonLoader.style.display = 'none';
                    }
                    if (submitButtonText) {
                        submitButtonText.style.display = 'block';
                    }

                    // Re-enable button
                    submitButton.style.pointerEvents = '';
                    submitButton.style.opacity = '';
                }
            });
        }

    } catch (err) {
        console.error('Error initializing concierge form:', err);
    }
})();
