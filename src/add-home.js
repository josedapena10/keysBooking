
// Object to store listing data
let listingData = {};

// Array defining the ordered steps by their element IDs
const steps = ["get-started", "basics", "location", "confirmLocation", "amenities", "photos", "description", "pricing", "availability", "rules", "review-info"];

// Variable to track the current step
let currentStepNumber = 1;

// Object to track if the user has attempted to leave each section
let hasAttemptedToLeave = {
    basics: false,
    location: false,
    // Add other sections here as needed
};

// Function to show a specific step and update URL hash
function goToStep(stepNumber) {
    console.log(`Navigating to step ${stepNumber}`);

    // Ensure stepNumber is within bounds
    if (stepNumber < 1 || stepNumber > steps.length) {
        console.error(`Invalid step number: ${stepNumber}`);
        return;
    }

    const currentStepId = steps[currentStepNumber - 1];
    const nextStepId = steps[stepNumber - 1];

    // Check if current step needs validation before moving on
    if (shouldValidateStep(currentStepId) && stepNumber > currentStepNumber) {
        hasAttemptedToLeave[currentStepId] = true;
        validateStep(currentStepId).then(isValid => {
            if (!isValid) {
                console.warn(`Validation failed for ${currentStepId} section`);
                return; // Exit if validation fails
            }
            proceedToNextStep();
        });
    } else {
        proceedToNextStep();
    }

    function proceedToNextStep() {
        // Reset the hasAttemptedToLeave flag when leaving a step
        if (hasAttemptedToLeave[currentStepId]) {
            hasAttemptedToLeave[currentStepId] = false;
        }

        const previousStep = document.querySelector('.step.active');

        if (previousStep) {
            // Start hiding the current step
            previousStep.style.opacity = '0';
            previousStep.style.transition = 'opacity 0.5s ease-out';

            // Wait for the transition to complete before hiding it
            setTimeout(() => {
                previousStep.style.display = 'none';
                previousStep.classList.remove('active');
                showStep(nextStepId);
            }, 500); // Match the delay with the transition duration
        } else {
            showStep(nextStepId); // First step load
        }

        // Update the URL hash without reloading the page
        window.location.hash = `#${nextStepId}`;

        // Update the currentStepNumber
        currentStepNumber = stepNumber;

        // Disable or enable buttons based on the current step
        updateButtonStates();
    }
}

function shouldValidateStep(stepId) {
    // Add logic here to determine which steps need validation
    return stepId === 'basics' || stepId === 'location'; // Now 'basics' and 'location' need validation
}

function validateStep(stepId) {
    switch (stepId) {
        case 'basics':
            return Promise.resolve(validateBasics());
        case 'location':
            return validateLocation();
        // Add cases for other steps that need validation
        default:
            return Promise.resolve(true); // No validation needed for other steps
    }
}

function validateBasics() {
    const requiredFields = ["guests", "bedrooms", "baths", "beds"];
    let isValid = true;

    requiredFields.forEach(type => {
        const titleElement = document.getElementById(`${type}-title`);
        const textElement = document.getElementById(`${type}-text`);
        const plusButton = document.getElementById(`plus-button${requiredFields.indexOf(type) + 1}`);
        const minusButton = document.getElementById(`minus-button${requiredFields.indexOf(type) + 1}`);

        // Define SVGs for the plus and minus buttons with error colors
        const svgPlusRed = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="red" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="red"></rect>
                <rect x="14" y="9" width="2" height="12" rx="2" fill="red"></rect>
            </svg>
        `;
        const svgMinusRed = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="red" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="red"></rect>
            </svg>
        `;

        const svgPlusDefault = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
                <rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect>
            </svg>
        `;
        const svgMinusDefault = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
            </svg>
        `;

        if (listingData[type] === undefined || listingData[type] < 1) {
            if (hasAttemptedToLeave.basics) {
                // Highlight the text fields, titles, and buttons if error is triggered
                if (textElement) textElement.style.color = 'red';
                if (titleElement) titleElement.style.color = 'red';
                if (plusButton) plusButton.innerHTML = svgPlusRed;
                if (minusButton) minusButton.innerHTML = svgMinusRed;
            }
            isValid = false;
        } else {
            // Reset styles if valid
            if (textElement) textElement.style.color = 'black';
            if (titleElement) titleElement.style.color = 'black';
            if (plusButton) plusButton.innerHTML = svgPlusDefault;
            if (minusButton) minusButton.innerHTML = svgMinusDefault;
        }
    });

    // Show or hide the error message based on validation result
    const basicsError = document.getElementById('basics-error');
    if (!isValid && basicsError && hasAttemptedToLeave.basics) {
        basicsError.textContent = "Please enter missing information";
        basicsError.style.display = 'block';
    } else if (basicsError) {
        basicsError.style.display = 'none';
    }

    return isValid;
}

function validateLocation() {
    return new Promise((resolve) => {
        const addressLine1Input = document.getElementById("addressLine1-input");
        const addressLine2Input = document.getElementById("addressLine2-input");
        const addressCityInput = document.getElementById("addressCity-input");
        const addressStateInput = document.getElementById("addressState-input");
        const addressZipcodeInput = document.getElementById("addressZipcode-input");
        const locationError = document.getElementById('location-error');
        const locationSubText = document.getElementById('location-subText');

        // Function to get actual value or placeholder if empty
        const getValue = (input) => input.value.trim() || input.placeholder;

        // Combine all address inputs
        const fullAddress = `${getValue(addressLine1Input)}, ${getValue(addressLine2Input)}, ${getValue(addressCityInput)}, ${getValue(addressStateInput)} ${getValue(addressZipcodeInput)}`.trim();

        if (fullAddress === `${addressLine1Input.placeholder}, ${addressLine2Input.placeholder}, ${addressCityInput.placeholder}, ${addressStateInput.placeholder} ${addressZipcodeInput.placeholder}`) {
            if (locationError && hasAttemptedToLeave.location) {
                locationError.textContent = "Please enter a complete residential address in the Florida Keys.";
                locationError.style.display = 'block';
                highlightInvalidInputs([addressLine1Input, addressCityInput, addressStateInput, addressZipcodeInput]);
                if (locationSubText) {
                    locationSubText.style.display = 'none';
                }
            }
            resolve(false);
        } else {
            // Use the Google Maps Geocoding API to validate the address
            isValidFloridaKeysAddress(fullAddress).then(isValid => {
                if (!isValid && locationError && hasAttemptedToLeave.location) {
                    locationError.textContent = "Please enter a complete residential address in the Florida Keys.";
                    locationError.style.display = 'block';
                    highlightInvalidInputs([addressLine1Input, addressCityInput, addressStateInput, addressZipcodeInput]);
                    if (locationSubText) {
                        locationSubText.style.display = 'none';
                    }
                } else {
                    if (locationError) {
                        locationError.style.display = 'none';
                    }
                    resetInputStyles([addressLine1Input, addressLine2Input, addressCityInput, addressStateInput, addressZipcodeInput]);
                    if (locationSubText) {
                        locationSubText.style.display = 'block';
                    }
                }
                resolve(isValid);
            });
        }
    });
}

function highlightInvalidInputs(inputs) {
    inputs.forEach(input => {
        if (input) {
            input.style.borderColor = 'red';
            input.style.backgroundColor = '#ffeeee';
            input.style.color = 'red';
        }
    });
}

function resetInputStyles(inputs) {
    inputs.forEach(input => {
        if (input) {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
            input.style.color = '';
        }
    });
}

function isValidFloridaKeysAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                const place = results[0];

                // Check if the address is in the Florida Keys
                const isInFloridaKeys = place.address_components.some(component =>
                    component.long_name.toLowerCase().includes('florida keys') ||
                    component.long_name.toLowerCase().includes('monroe county')
                );

                // Check if it's a residential address
                const isResidential = place.types.includes('street_address') || place.types.includes('premise');

                // Check for unit/apt number
                const hasUnitNumber = place.address_components.some(component =>
                    component.types.includes('subpremise')
                );

                // Determine if it's a multi-unit building (apartment, condo, etc.)
                const isMultiUnit = place.types.includes('premise') && !place.types.includes('street_address');

                // Check if the address has a street number, street name, city, state, and zip code
                const hasStreetNumber = place.address_components.some(component => component.types.includes('street_number'));
                const hasStreetName = place.address_components.some(component => component.types.includes('route'));
                const hasCity = place.address_components.some(component => component.types.includes('locality'));
                const hasState = place.address_components.some(component => component.types.includes('administrative_area_level_1'));
                const hasZipCode = place.address_components.some(component => component.types.includes('postal_code'));

                const isComplete = hasStreetNumber && hasStreetName && hasCity && hasState && hasZipCode;

                // For multi-unit buildings, require a unit number. For single-family homes, don't require it.
                const hasRequiredUnitInfo = isMultiUnit ? hasUnitNumber : true;

                // Additional check for multi-unit addresses
                if (isMultiUnit && !hasUnitNumber) {
                    // If it's a multi-unit building but no unit number is provided, it's invalid
                    resolve(false);
                } else {
                    // Resolve with true if all conditions are met
                    resolve(isInFloridaKeys && isResidential && isComplete && hasRequiredUnitInfo);
                }
            } else {
                resolve(false);
            }
        });
    });
}

// Function to show the current step with fade-in effect
function showStep(stepId) {
    const currentStep = document.getElementById(stepId);
    if (currentStep) {
        currentStep.style.display = 'flex';
        currentStep.style.opacity = '0'; // Start hidden
        setTimeout(() => {
            currentStep.style.transition = 'opacity 0.5s ease-in';
            currentStep.style.opacity = '1'; // Fade in
        }, 50); // Small delay to trigger the transition
        currentStep.classList.add('active');
    } else {
        console.error(`Step ID not found: ${stepId}`);
    }

    // Initialize the counter logic when the "basics" step is shown
    if (stepId === "basics") {
        initializeCounters();
    }
}

// Function to enable/disable buttons based on the current step
function updateButtonStates() {
    const nextStepText = document.getElementById('nextStepText');
    const prevStepButton = document.getElementById('prevStep');

    // Update the text content based on the current step
    if (nextStepText) {
        nextStepText.textContent = currentStepNumber === 1 ? "Get Started" : "Next";
    }

    // Handle visibility of the "Previous" button
    if (prevStepButton) {
        if (currentStepNumber === 1) {
            prevStepButton.style.display = "none"; // Hide on the first step
        } else {
            prevStepButton.style.display = "flex"; // Show on other steps
        }
    }

    // Disable "Next" button on the last step
    document.getElementById('nextStep').disabled = (currentStepNumber === steps.length);
}

// Counter logic for the "basics" step
function initializeCounters() {
    let counters = {
        guests: listingData.guests || 0,
        bedrooms: listingData.bedrooms || 0,
        baths: listingData.baths || 0,
        beds: listingData.beds || 0
    };

    const plusButtons = {
        guests: document.getElementById('plus-button1'),
        bedrooms: document.getElementById('plus-button2'),
        baths: document.getElementById('plus-button3'),
        beds: document.getElementById('plus-button4')
    };

    const minusButtons = {
        guests: document.getElementById('minus-button1'),
        bedrooms: document.getElementById('minus-button2'),
        baths: document.getElementById('minus-button3'),
        beds: document.getElementById('minus-button4')
    };

    const textFields = {
        guests: document.getElementById('guests-text'),
        bedrooms: document.getElementById('bedrooms-text'),
        baths: document.getElementById('baths-text'),
        beds: document.getElementById('beds-text')
    };

    setupSVGButtons();
    updateAllButtonStates();

    // Add event listeners for plus and minus buttons
    Object.keys(plusButtons).forEach(type => {
        plusButtons[type].addEventListener('click', () => handleIncrement(type));
    });

    Object.keys(minusButtons).forEach(type => {
        minusButtons[type].addEventListener('click', () => handleDecrement(type));
    });

    function handleIncrement(type) {
        counters[type]++;
        listingData[type] = counters[type]; // Save updated value to listingData
        updateCounterDisplay(type);
        updateAllButtonStates();
        if (hasAttemptedToLeave.basics) {
            validateBasics(); // Revalidate after updating value only if user has attempted to leave
        }
    }

    function handleDecrement(type) {
        if (counters[type] > 0) {
            counters[type]--;
            listingData[type] = counters[type]; // Save updated value to listingData
            updateCounterDisplay(type);
            updateAllButtonStates();
            if (hasAttemptedToLeave.basics) {
                validateBasics(); // Revalidate after updating value only if user has attempted to leave
            }
        }
    }


    function updateCounterDisplay(type) {
        textFields[type].textContent = counters[type];
    }

    function updateAllButtonStates() {
        Object.keys(counters).forEach(type => {
            // Disable minus button if the counter is 0
            if (counters[type] <= 0) {
                minusButtons[type].disabled = true;
                minusButtons[type].style.opacity = '0.3';
            } else {
                minusButtons[type].disabled = false;
                minusButtons[type].style.opacity = '1';
            }

            // Plus buttons will always be enabled since there's no max limit
            plusButtons[type].style.opacity = '1';
        });
    }

    function setupSVGButtons() {
        const svgPlus = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
                <rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect>
            </svg>
        `;
        const svgMinus = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
            </svg>
        `;

        Object.values(plusButtons).forEach(button => button.innerHTML = svgPlus);
        Object.values(minusButtons).forEach(button => button.innerHTML = svgMinus);
    }
}

// Initial step on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded, initializing steps");

    // Hide the error elements initially
    const basicsError = document.getElementById('basics-error');
    const locationError = document.getElementById('location-error');
    const locationSubText = document.getElementById('location-subText');
    if (basicsError) {
        basicsError.style.display = 'none';
    }
    if (locationError) {
        locationError.style.display = 'none';
    }
    if (locationSubText) {
        locationSubText.style.display = 'block';
    }

    // Determine the initial step from the URL hash or default to step 1
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const initialStepId = hash ? hash : 'get-started';
    const initialStepNumber = steps.indexOf(initialStepId) !== -1 ? steps.indexOf(initialStepId) + 1 : 1;
    console.log(`Initial step ID: ${initialStepId}, Initial step number: ${initialStepNumber}`);
    goToStep(initialStepNumber);
});

// Handle next button click
document.getElementById('nextStep').addEventListener('click', function () {
    console.log(`Next step clicked: Current step ${currentStepNumber}`);

    const currentStepId = steps[currentStepNumber - 1];

    // Set hasAttemptedToLeave to true for the current step when trying to move forward
    if (shouldValidateStep(currentStepId)) {
        hasAttemptedToLeave[currentStepId] = true;
    }

    // Proceed to the next step if valid
    if (currentStepNumber < steps.length) {
        goToStep(currentStepNumber + 1);
    }
});

// Handle previous button click
document.getElementById('prevStep').addEventListener('click', function () {
    console.log(`Previous step clicked: Current step ${currentStepNumber}`);

    // Go to the previous step if not the first step
    if (currentStepNumber > 1) {
        goToStep(currentStepNumber - 1);
    }
});

// Handle hash change event (when the user manually changes the hash or presses back/forward)
window.addEventListener('hashchange', function () {
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const stepNumber = steps.indexOf(hash) + 1;
    console.log(`Handling hash change, step number: ${stepNumber}`);
    if (stepNumber > 0) {
        goToStep(stepNumber);
    }
});

// Function to load the Google Maps API
function loadGoogleMapsAPI() {
    if (typeof google === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ&libraries=places";
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
    } else {
        initAutocomplete();
    }
}

// Function to initialize the Google Maps Autocomplete widget
function initAutocomplete() {
    // Comment: The Google Maps Autocomplete widget typically works with a single input field.
    // Splitting the address into multiple fields may not be compatible with the widget's functionality.
    // For now, we'll comment out the autocomplete initialization.

    /*
    const addressLine1Input = document.getElementById("addressLine1-input");

    if (addressLine1Input) {
        const autocomplete = new google.maps.places.Autocomplete(addressLine1Input, {
            types: ["address"],
            componentRestrictions: { country: "us" },
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(24.3, -82.2), // Southwest corner of Florida Keys
                new google.maps.LatLng(25.2, -80.1)  // Northeast corner of Florida Keys
            ),
            strictBounds: true,
            fields: ["place_id", "geometry", "name", "formatted_address", "address_components", "types"]
        });

        autocomplete.setFields(['address_components', 'formatted_address', 'geometry', 'type']);

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
                console.error("No details available for input: '" + addressLine1Input.value + "'");
                return;
            }

            isValidFloridaKeysAddress(place.formatted_address).then(isValid => {
                if (!isValid) {
                    console.error("Selected location is not a valid residential address in the Florida Keys");
                    return;
                }

                fillAddressFields(place);

                console.log("Selected place:", place);

                validateLocation();
            });
        });
    } else {
        console.error("Input element with ID 'addressLine1-input' not found.");
    }
    */

    // Add input event listeners for manual address entry
    const addressInputs = [
        document.getElementById("addressLine1-input"),
        document.getElementById("addressLine2-input"),
        document.getElementById("addressCity-input"),
        document.getElementById("addressState-input"),
        document.getElementById("addressZipcode-input")
    ];

    addressInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', validateLocation);
        }
    });
}

// Function to fill address fields based on selected place
function fillAddressFields(place) {
    let addressLine1 = '';
    let addressLine2 = '';
    let city = '';
    let state = '';
    let zipcode = '';

    for (const component of place.address_components) {
        const componentType = component.types[0];

        switch (componentType) {
            case "street_number":
                addressLine1 = component.long_name + ' ';
                break;
            case "route":
                addressLine1 += component.long_name;
                break;
            case "subpremise":
                addressLine2 = component.long_name;
                break;
            case "locality":
                city = component.long_name;
                break;
            case "administrative_area_level_1":
                state = component.short_name;
                break;
            case "postal_code":
                zipcode = component.long_name;
                break;
        }
    }

    document.getElementById("addressLine1-input").value = addressLine1;
    document.getElementById("addressLine2-input").value = addressLine2;
    document.getElementById("addressCity-input").value = city;
    document.getElementById("addressState-input").value = state;
    document.getElementById("addressZipcode-input").value = zipcode;
}

// Initialize the autocomplete widget when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", loadGoogleMapsAPI);

// Function to check if a unit number is required
function isUnitNumberRequired(place) {
    return place.types.includes('premise') && !place.types.includes('street_address');
}
