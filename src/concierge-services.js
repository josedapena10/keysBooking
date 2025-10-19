



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
