// Object to store listing data
let listingData = {
    selectedAmenities: [], // Array to store selected amenity IDs
    photos: [], // Array to store selected photos
    title: '', // Store title text
    description: '', // Store description text
    price: '', // Store price value
    cleaningFee: '', // Store cleaning fee value
    minNights: null, // Store minimum nights selection
    checkIn: {
        time: 4, // Default check-in time
        period: 'PM' // Default period
    },
    checkOut: {
        time: 10, // Default check-out time 
        period: 'AM' // Default period
    }
};

// Array defining the ordered steps by their element IDs
const steps = ["get-started", "basics", "location", "confirmLocation", "amenities", "photos", "title", "description", "pricing", "cleaningFee", "minNights", "rules", "safety", "cancellationPolicy", "review-info"];
//need to add an additional photos step for the cover photos to be selected + a boating one asking if they have a dock.
// Variable to track the current step
let currentStepNumber = 1;

// Object to track if the user has attempted to leave each section
let hasAttemptedToLeave = {
    basics: false,
    location: false,
    confirmLocation: false,
    amenities: false, // Added amenities validation tracking
    photos: false, // Added photos validation tracking
    title: false, // Added title validation tracking
    description: false, // Added description validation tracking
    pricing: false, // Added pricing validation tracking
    cleaningFee: false, // Added cleaning fee validation tracking
    minNights: false // Added minimum nights validation tracking
};

// Variable to track selected address type
let selectedAddressType = 'suggested'; // Default to suggested address

// Function to initialize rules step
function initializeRulesStep() {
    // Initialize check-in time
    const checkInInput = document.querySelector('[data-element="checkInInput"]');
    const checkInAMButton = document.querySelector('[data-element="checkInAM_button"]');
    const checkInPMButton = document.querySelector('[data-element="checkInPM_button"]');
    console.log(checkInInput)

    // Initialize check-out time
    const checkOutInput = document.querySelector('[data-element="checkOutInput"]');
    const checkOutAMButton = document.querySelector('[data-element="checkOutAM_button"]');
    const checkOutPMButton = document.querySelector('[data-element="checkOutPM_button"]');

    // Set default check-in time (4 PM)
    if (checkInInput) {
        // Set initial value and update the input element
        checkInInput.value = listingData.checkIn.time;
        checkInInput.setAttribute('value', listingData.checkIn.time);

        // Only allow numbers
        checkInInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value > 12) e.target.value = 12;
            if (e.target.value < 1) e.target.value = 1;
            listingData.checkIn.time = parseInt(e.target.value);
            e.target.setAttribute('value', e.target.value);
        });
    }

    // Set default check-out time (10 AM)
    if (checkOutInput) {
        // Set initial value and update the input element
        checkOutInput.value = listingData.checkOut.time;
        checkOutInput.setAttribute('value', listingData.checkOut.time);

        // Only allow numbers
        checkOutInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value > 12) e.target.value = 12;
            if (e.target.value < 1) e.target.value = 1;
            listingData.checkOut.time = parseInt(e.target.value);
            e.target.setAttribute('value', e.target.value);
        });
    }

    // Set up check-in AM/PM toggle
    if (checkInAMButton && checkInPMButton) {
        const updateCheckInPeriod = (period) => {
            if (period === 'AM') {
                checkInAMButton.style.backgroundColor = '#000000';
                checkInAMButton.style.color = '#ffffff';
                checkInPMButton.style.backgroundColor = '#ffffff';
                checkInPMButton.style.color = '#000000';
                listingData.checkIn.period = 'AM';
            } else {
                checkInPMButton.style.backgroundColor = '#000000';
                checkInPMButton.style.color = '#ffffff';
                checkInAMButton.style.backgroundColor = '#ffffff';
                checkInAMButton.style.color = '#000000';
                listingData.checkIn.period = 'PM';
            }
        };

        // Add button-like styles
        [checkInAMButton, checkInPMButton].forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #000000';
            btn.style.padding = '8px 16px';
            btn.style.transition = 'all 0.3s ease';
        });

        checkInAMButton.addEventListener('click', () => updateCheckInPeriod('AM'));
        checkInPMButton.addEventListener('click', () => updateCheckInPeriod('PM'));

        // Set default PM for check-in
        updateCheckInPeriod('PM');
    }

    // Set up check-out AM/PM toggle
    if (checkOutAMButton && checkOutPMButton) {
        const updateCheckOutPeriod = (period) => {
            if (period === 'AM') {
                checkOutAMButton.style.backgroundColor = '#000000';
                checkOutAMButton.style.color = '#ffffff';
                checkOutPMButton.style.backgroundColor = '#ffffff';
                checkOutPMButton.style.color = '#000000';
                listingData.checkOut.period = 'AM';
            } else {
                checkOutPMButton.style.backgroundColor = '#000000';
                checkOutPMButton.style.color = '#ffffff';
                checkOutAMButton.style.backgroundColor = '#ffffff';
                checkOutAMButton.style.color = '#000000';
                listingData.checkOut.period = 'PM';
            }
        };

        // Add button-like styles
        [checkOutAMButton, checkOutPMButton].forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #000000';
            btn.style.padding = '8px 16px';
            btn.style.transition = 'all 0.3s ease';
        });

        checkOutAMButton.addEventListener('click', () => updateCheckOutPeriod('AM'));
        checkOutPMButton.addEventListener('click', () => updateCheckOutPeriod('PM'));

        // Set default AM for check-out
        updateCheckOutPeriod('AM');
    }
}

// Function to handle photo selection
function handlePhotoSelection(event) {
    const files = event.target.files;
    const addPhotosContainer = document.getElementById('addPhotosButton_Container');
    const addPhotosButton2 = document.getElementById('addPhotosButton2');

    if (!files.length) return;

    // Hide the add photos button container once photos are selected
    if (addPhotosContainer) {
        addPhotosContainer.style.display = 'none';
    }

    // Show the second add photos button
    if (addPhotosButton2) {
        addPhotosButton2.style.display = 'flex';
    }

    // Process each selected file
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            // Store photo data
            listingData.photos.push({
                file: file,
                dataUrl: e.target.result
            });

            // Render all photos after adding new one
            renderPhotos();

            // Check photo count and update error message if needed
            if (hasAttemptedToLeave.photos) {
                validatePhotos();
            }
        };
        reader.readAsDataURL(file);
    });

    // Clear the file input value to prevent auto-reopening
    event.target.value = '';
}

// Function to render all photos
function renderPhotos() {
    const photoContainerParent = document.querySelector('[data-element="photo_container_parent"]');
    if (!photoContainerParent) return;

    // Only show photo container when we have photos
    photoContainerParent.style.display = listingData.photos.length ? 'grid' : 'none';

    // Clear existing photos
    const allContainers = document.querySelectorAll('[data-element="photo_container_parent"]');
    allContainers.forEach((container, idx) => {
        if (idx > 0) container.remove();
    });

    // Render each photo
    listingData.photos.forEach((photo, idx) => {
        if (idx === 0) {
            const firstImg = photoContainerParent.querySelector('[data-element="photo_container"]');
            if (firstImg) {
                firstImg.src = photo.dataUrl;
                setupPhotoAddedDeleteButton(photoContainerParent, 0);
            }
        } else {
            const newParent = photoContainerParent.cloneNode(true);
            const newImg = newParent.querySelector('[data-element="photo_container"]');
            if (newImg) {
                newImg.src = photo.dataUrl;
                setupPhotoAddedDeleteButton(newParent, idx);
            }
            photoContainerParent.parentNode.appendChild(newParent);
        }
    });
}

// Function to setup delete button for a photo
function setupPhotoAddedDeleteButton(containerParent, photoIndex) {
    const deleteButton = containerParent.querySelector('[data-element="deletePhotoAdded"]');
    if (!deleteButton) return;

    deleteButton.style.cursor = 'pointer';
    deleteButton.onclick = (e) => {
        e.stopPropagation();

        // Remove photo from listingData array
        listingData.photos.splice(photoIndex, 1);

        // If no photos left, reset the UI
        if (listingData.photos.length === 0) {
            resetPhotoUI();
        } else {
            // Rerender all photos
            renderPhotos();
        }

        // Revalidate if user has attempted to leave
        if (hasAttemptedToLeave.photos) {
            validatePhotos();
        }
    };
}

// Function to reset photo UI to initial state
function resetPhotoUI() {
    const addPhotosContainer = document.getElementById('addPhotosButton_Container');
    const addPhotosButton2 = document.getElementById('addPhotosButton2');
    const photoContainerParent = document.querySelector('[data-element="photo_container_parent"]');
    const photoContainer = document.querySelector('[data-element="photo_container"]');

    if (addPhotosContainer) {
        addPhotosContainer.style.display = 'flex';
        addPhotosContainer.style.flexDirection = 'column';
        addPhotosContainer.style.gap = '15px';
    }

    if (addPhotosButton2) {
        addPhotosButton2.style.display = 'none';
    }

    if (photoContainerParent) {
        photoContainerParent.style.display = 'none';
    }

    if (photoContainer) {
        photoContainer.src = '';
    }
}

// Function to validate photos
function validatePhotos() {
    const photosError = document.getElementById('photos-error');
    const photosSubText = document.getElementById('photos-subText');
    const minPhotos = 5;
    const currentPhotoCount = listingData.photos.length;
    const isValid = currentPhotoCount >= minPhotos;

    if (!isValid && hasAttemptedToLeave.photos) {
        const remainingPhotos = minPhotos - currentPhotoCount;
        if (photosError && photosSubText) {
            photosError.textContent = `Please add ${remainingPhotos} more photo${remainingPhotos > 1 ? 's' : ''} to continue`;
            photosError.style.display = 'block';
            photosSubText.style.display = 'none';
        }
    } else {
        if (photosError && photosSubText) {
            photosError.style.display = 'none';
            photosSubText.style.display = 'block';
        }
    }

    return isValid;
}

// Function to fetch and render amenities
async function fetchAndRenderAmenities() {
    try {
        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/attribute');
        const amenities = await response.json();

        // Get all amenity elements
        const amenityElements = document.querySelectorAll('[data-element="amenity"]');
        const iconElements = document.querySelectorAll('[data-element="amenity_icon"]');
        const textElements = document.querySelectorAll('[data-element="amenity_text"]');

        // Loop through amenities and update elements
        amenities.forEach((amenity, i) => {
            // Create new elements if needed
            if (i >= amenityElements.length) {
                // Clone the first amenity element and its children
                const template = amenityElements[0].cloneNode(true);
                const newIcon = template.querySelector('[data-element="amenity_icon"]');
                const newText = template.querySelector('[data-element="amenity_text"]');

                // Update the new elements
                if (newIcon) {
                    newIcon.src = amenity.attribute_icon.url;
                    newIcon.alt = amenity.attribute_name;
                }
                if (newText) {
                    newText.textContent = amenity.attribute_name;
                }

                // Add click handler and styling
                template.style.cursor = 'pointer';
                template.dataset.amenityId = amenity.id;
                template.addEventListener('click', () => toggleAmenity(template, amenity.id));

                // Insert the new element after the last amenity
                amenityElements[0].parentNode.appendChild(template);
            } else {
                // Update existing elements
                if (iconElements[i]) {
                    iconElements[i].src = amenity.attribute_icon.url;
                    iconElements[i].alt = amenity.attribute_name;
                }
                if (textElements[i]) {
                    textElements[i].textContent = amenity.attribute_name;
                }

                // Add click handler and styling to existing elements
                amenityElements[i].style.cursor = 'pointer';
                amenityElements[i].dataset.amenityId = amenity.id;
                amenityElements[i].addEventListener('click', () => toggleAmenity(amenityElements[i], amenity.id));
            }
        });

    } catch (error) {
        console.error('Error fetching amenities:', error);
    }
}

// Function to toggle amenity selection
function toggleAmenity(element, amenityId) {
    const isSelected = element.style.borderWidth === '2px';

    if (isSelected) {
        element.style.borderWidth = '1px';
        element.style.borderColor = '#e2e2e2'; // Reset to default color
        element.style.margin = '0px'; // Reset margin
        listingData.selectedAmenities = listingData.selectedAmenities.filter(id => id !== amenityId);
    } else {
        element.style.borderWidth = '2px';
        element.style.borderColor = '#000000'; // Set black border when selected
        element.style.margin = '-1px'; // Offset the larger border
        if (!listingData.selectedAmenities.includes(amenityId)) {
            listingData.selectedAmenities.push(amenityId);
        }
    }

    // Hide error message when user selects an amenity
    if (hasAttemptedToLeave.amenities) {
        validateAmenities();
    }
}

// Function to show a specific step and update URL hash
function goToStep(stepNumber) {
    //console.log(`Navigating to step ${stepNumber}`);

    // Ensure stepNumber is within bounds
    if (stepNumber < 1 || stepNumber > steps.length) {
        //console.error(`Invalid step number: ${stepNumber}`);
        return;
    }

    const currentStepId = steps[currentStepNumber - 1];
    const nextStepId = steps[stepNumber - 1];

    // Check if current step needs validation before moving on
    if (shouldValidateStep(currentStepId) && stepNumber > currentStepNumber) {
        hasAttemptedToLeave[currentStepId] = true;
        validateStep(currentStepId).then(isValid => {
            if (!isValid) {
                //console.warn(`Validation failed for ${currentStepId} section`);
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
    return stepId === 'basics' || stepId === 'location' || stepId === 'confirmLocation' || stepId === 'amenities' || stepId === 'photos' || stepId === 'title' || stepId === 'description' || stepId === 'pricing' || stepId === 'cleaningFee' || stepId === 'minNights'; // Added minNights validation
}

function validateStep(stepId) {
    switch (stepId) {
        case 'basics':
            return Promise.resolve(validateBasics());
        case 'location':
            return validateLocation();
        case 'confirmLocation':
            return Promise.resolve(validateConfirmLocation());
        case 'amenities':
            return Promise.resolve(validateAmenities());
        case 'photos':
            return Promise.resolve(validatePhotos());
        case 'title':
            return Promise.resolve(validateTitle());
        case 'description':
            return Promise.resolve(validateDescription());
        case 'pricing':
            return Promise.resolve(validatePricing());
        case 'cleaningFee':
            return Promise.resolve(validateCleaningFee());
        case 'minNights':
            return Promise.resolve(validateMinNights());
        // Add cases for other steps that need validation
        default:
            return Promise.resolve(true); // No validation needed for other steps
    }
}

function validateTitle() {
    const titleInput = document.querySelector('[data-element="title_input"]');
    const titleError = document.getElementById('title-error');
    const titleSubText = document.getElementById('title-subText');
    const maxChars = 35;

    if (!titleInput || !titleError || !titleSubText) return true;

    const text = titleInput.innerText.trim();
    const isValid = text.length > 0 && text.length <= maxChars;

    if (!isValid && hasAttemptedToLeave.title) {
        if (titleError && titleSubText) {
            if (text.length === 0) {
                titleError.textContent = "Please enter a title to continue";
            } else if (text.length > maxChars) {
                titleError.textContent = "Please shorten your title to continue";
            }
            titleError.style.display = 'block';
            titleSubText.style.display = 'none';

            if (text.length > maxChars) {
                titleInput.style.color = 'red';
                titleInput.style.border = '1px solid red';
            }
        }
    } else {
        if (titleError && titleSubText) {
            titleError.style.display = 'none';
            titleSubText.style.display = 'block';
            titleInput.style.color = '';
            titleInput.style.border = '';
        }
    }

    return isValid;
}

function validateDescription() {
    const descriptionInput = document.querySelector('[data-element="description_input"]');
    const descriptionError = document.getElementById('description-error');
    const descriptionSubText = document.getElementById('description-subText');
    const maxChars = 1000;

    if (!descriptionInput || !descriptionError || !descriptionSubText) return true;

    const text = descriptionInput.innerText.trim();
    const isValid = text.length > 0 && text.length <= maxChars;

    if (!isValid && hasAttemptedToLeave.description) {
        if (descriptionError && descriptionSubText) {
            if (text.length === 0) {
                descriptionError.textContent = "Please enter a description to continue";
            } else if (text.length > maxChars) {
                descriptionError.textContent = "Please shorten your description to continue";
            }
            descriptionError.style.display = 'block';
            descriptionSubText.style.display = 'none';

            if (text.length > maxChars) {
                descriptionInput.style.color = 'red';
                descriptionInput.style.border = '1px solid red';
            }
        }
    } else {
        if (descriptionError && descriptionSubText) {
            descriptionError.style.display = 'none';
            descriptionSubText.style.display = 'block';
            descriptionInput.style.color = '';
            descriptionInput.style.border = '';
        }
    }

    return isValid;
}

function validatePricing() {
    const priceInput = document.querySelector('[data-element="setPriceInput"]');
    const pricingError = document.getElementById('pricing-error');
    const pricingSubText = document.getElementById('pricing-subText');

    if (!priceInput || !pricingError || !pricingSubText) return true;

    const price = parseFloat(priceInput.value.replace(/[^0-9.]/g, ''));
    const isValid = !isNaN(price) && price > 0;

    if (!isValid && hasAttemptedToLeave.pricing) {
        pricingError.textContent = "Please enter a valid price to continue";
        pricingError.style.display = 'block';
        pricingSubText.style.display = 'none';
    } else {
        pricingError.style.display = 'none';
        pricingSubText.style.display = 'block';
        priceInput.style.color = '';
        priceInput.style.border = '';
    }

    return isValid;
}

function validateCleaningFee() {
    const cleaningFeeInput = document.querySelector('[data-element="setCleaningFeeInput"]');
    const cleaningFeeError = document.getElementById('cleaningFee-error');
    const cleaningFeeSubText = document.getElementById('cleaningFee-subText');
    const isValid = !isNaN(cleaningFeeInput.value.replace(/[^0-9.]/g, '')) && parseFloat(cleaningFeeInput.value.replace(/[^0-9.]/g, '')) >= 0;

    if (!isValid && hasAttemptedToLeave.cleaningFee) {
        cleaningFeeError.textContent = "Please enter a valid cleaning fee to continue";
        cleaningFeeError.style.display = 'block';
        cleaningFeeSubText.style.display = 'none';
    } else {
        cleaningFeeError.style.display = 'none';
        cleaningFeeSubText.style.display = 'block';
    }

    return isValid;
}
function validateMinNights() {
    const minNightsError = document.getElementById('minNights-error');
    const minNightsSubText = document.getElementById('minNights-subText');
    const isValid = listingData.minNights !== null;

    if (!isValid && hasAttemptedToLeave.minNights) {
        if (minNightsError && minNightsSubText) {
            minNightsError.textContent = "Please select a minimum nights option to continue";
            minNightsError.style.display = 'block';
            minNightsSubText.style.display = 'none';
        }
    } else {
        if (minNightsError && minNightsSubText) {
            minNightsError.style.display = 'none';
            minNightsSubText.style.display = 'block';
        }
    }

    return isValid;
}

function validateAmenities() {
    const amenitiesError = document.getElementById('amenities-error');
    const amenitiesSubText = document.getElementById('amenities-subText');
    const isValid = listingData.selectedAmenities.length > 0;

    if (!isValid && hasAttemptedToLeave.amenities) {
        if (amenitiesError) {
            amenitiesError.textContent = "Please select at least one amenity to continue";
            amenitiesError.style.display = 'block';
            if (amenitiesSubText) amenitiesSubText.style.display = 'none';
        }
    } else {
        if (amenitiesError) {
            amenitiesError.style.display = 'none';
            if (amenitiesSubText) amenitiesSubText.style.display = 'block';
        }
    }

    return isValid;
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

        // Check only for addressLine1, city, state and zip as required fields
        const requiredFields = [addressLine1Input, addressCityInput, addressStateInput, addressZipcodeInput];
        const hasEmptyFields = requiredFields.some(input => !input.value.trim());

        console.log('Validating location fields:');
        console.log('Address Line 1:', addressLine1Input?.value || 'empty');
        console.log('Address Line 2:', addressLine2Input?.value || 'empty');
        console.log('City:', addressCityInput?.value || 'empty');
        console.log('State:', addressStateInput?.value || 'empty');
        console.log('Zipcode:', addressZipcodeInput?.value || 'empty');

        // Florida Keys ZIP codes
        const keysZipCodes = ['33001', '33036', '33037', '33040', '33041', '33042', '33043', '33044', '33045', '33050', '33051', '33052', '33070'];

        // Check if zipcode is in Florida Keys
        const isKeysZipcode = keysZipCodes.includes(addressZipcodeInput?.value?.trim());
        console.log('Is Florida Keys ZIP code:', isKeysZipcode);

        if (hasEmptyFields) {
            console.log('Empty required fields detected');
            if (locationError && hasAttemptedToLeave.location) {
                locationError.textContent = "Please fill in all required fields";
                locationError.style.display = 'block';
                highlightInvalidInputs(requiredFields.filter(input => !input.value.trim()));
                if (locationSubText) locationSubText.style.display = 'none';
            }
            resolve(false);
            return;
        }

        if (!isKeysZipcode) {
            console.log('Not a Florida Keys ZIP code');
            if (locationError && hasAttemptedToLeave.location) {
                locationError.textContent = "Please enter a valid Florida Keys ZIP code";
                locationError.style.display = 'block';
                highlightInvalidInputs([addressZipcodeInput]);
                if (locationSubText) locationSubText.style.display = 'none';
            }
            resolve(false);
            return;
        }

        // Build address object with available data
        const address = {
            address: {
                addressLines: [addressLine1Input.value],
                locality: addressCityInput.value,
                administrativeArea: addressStateInput.value === 'Florida' ? 'FL' : addressStateInput.value,
                postalCode: addressZipcodeInput.value,
                regionCode: "US"
            }
        };

        // Add addressLine2 if it has a value
        if (addressLine2Input?.value.trim()) {
            address.address.addressLines.push(addressLine2Input.value);
        }

        console.log('Sending address to Google API:', address);

        // Validate with Google API
        validateAddressWithGoogle(address).then(result => {
            console.log('Google API response:', result);
            if (result.isValid) {
                // Show suggested address in confirmLocation step
                const confirmSuggestedAddress = document.getElementById("confirmSuggestedAddress");
                const confirmEnteredAddress = document.getElementById("confirmEnteredAddress");
                const confirmSuggestedContainer = document.getElementById("confirmSuggestedAddress_Container");
                const confirmEnteredContainer = document.getElementById("confirmEnteredAddress_Container");

                if (confirmSuggestedAddress) {
                    confirmSuggestedAddress.textContent = result.formattedAddress;
                }

                if (confirmEnteredAddress) {
                    // Format entered address similar to Google's format
                    let enteredAddress = addressLine1Input.value;
                    if (addressLine2Input?.value.trim()) {
                        enteredAddress += ` ${addressLine2Input.value}`;
                    }
                    enteredAddress += `, ${addressCityInput.value}, ${addressStateInput.value} ${addressZipcodeInput.value}, USA`;
                    confirmEnteredAddress.textContent = enteredAddress;
                }

                // Add click handlers for address selection
                if (confirmSuggestedContainer && confirmEnteredContainer) {
                    // Set initial clicked state on suggested address
                    selectedAddressType = 'suggested';
                    updateAddressSelection();

                    confirmSuggestedContainer.onclick = () => {
                        selectedAddressType = 'suggested';
                        updateAddressSelection();
                    };

                    confirmEnteredContainer.onclick = () => {
                        selectedAddressType = 'entered';
                        updateAddressSelection();
                    };
                }

                if (locationError) locationError.style.display = 'none';
                resetInputStyles([addressLine1Input, addressLine2Input, addressCityInput, addressStateInput, addressZipcodeInput]);
                if (locationSubText) locationSubText.style.display = 'block';
                resolve(true);
            } else {
                console.log('Address validation failed');
                if (locationError && hasAttemptedToLeave.location) {
                    locationError.textContent = "Please enter a valid address";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                resolve(false);
            }
        });
    });
}

function updateAddressSelection() {
    const confirmSuggestedContainer = document.getElementById("confirmSuggestedAddress_Container");
    const confirmEnteredContainer = document.getElementById("confirmEnteredAddress_Container");

    if (confirmSuggestedContainer && confirmEnteredContainer) {
        if (selectedAddressType === 'suggested') {
            confirmSuggestedContainer.style.backgroundColor = '#9ecaff';
            confirmSuggestedContainer.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.2)';
            confirmEnteredContainer.style.backgroundColor = '';
            confirmEnteredContainer.style.boxShadow = '';
        } else {
            confirmEnteredContainer.style.backgroundColor = '#9ecaff';
            confirmEnteredContainer.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.2)';
            confirmSuggestedContainer.style.backgroundColor = '';
            confirmSuggestedContainer.style.boxShadow = '';
        }
    }
}

function validateConfirmLocation() {
    const confirmLocationError = document.getElementById('confirmLocation-error');

    // Always valid since we have a default selection
    if (confirmLocationError) {
        confirmLocationError.style.display = 'none';
    }
    return true;
}

async function validateAddressWithGoogle(address) {
    try {
        console.log('Making request to Google Address Validation API');
        const response = await fetch('https://addressvalidation.googleapis.com/v1:validateAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': 'AIzaSyBtTdNYqGeF4GHpw0OA-tasMjY2yEO-4BY'
            },
            body: JSON.stringify({
                address: address.address,
                enableUspsCass: true
            })
        });

        const data = await response.json();
        console.log('Google API Response:', data);

        if (!data.result) {
            console.log('No result from Google API');
            return { isValid: false };
        }

        return {
            isValid: true,
            formattedAddress: data.result.address.formattedAddress
        };
    } catch (error) {
        console.error('Address validation failed:', error);
        return { isValid: false };
    }
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
        //console.error(`Step ID not found: ${stepId}`);
    }

    // Initialize the counter logic when the "basics" step is shown
    if (stepId === "basics") {
        initializeCounters();
    }

    // Set default address selection when showing confirmLocation step
    if (stepId === "confirmLocation") {
        selectedAddressType = 'suggested';
        updateAddressSelection();
    }

    // Fetch and render amenities when showing amenities step
    if (stepId === "amenities") {
        fetchAndRenderAmenities();
        // Hide amenities error when first showing the step
        const amenitiesError = document.getElementById('amenities-error');
        if (amenitiesError) {
            amenitiesError.style.display = 'none';
        }
    }

    // Initialize photos step when showing photos
    if (stepId === "photos") {
        initializePhotosStep();
        // Hide photos error when first showing the step
        const photosError = document.getElementById('photos-error');
        if (photosError) {
            photosError.style.display = 'none';
        }
    }

    // Call initializeTitleStep when showing the title step
    if (stepId === "title") {
        initializeTitleStep();
        // Hide title error when first showing the step
        const titleError = document.getElementById('title-error');
        if (titleError) {
            titleError.style.display = 'none';
        }
    }

    // Call initializeDescriptionStep when showing the description step
    if (stepId === "description") {
        initializeDescriptionStep();
        // Hide description error when first showing the step
        const descriptionError = document.getElementById('description-error');
        if (descriptionError) {
            descriptionError.style.display = 'none';
        }
    }

    // Initialize pricing step when showing pricing
    if (stepId === "pricing") {
        initializePricingStep();
        // Hide pricing error when first showing the step
        const pricingError = document.getElementById('pricing-error');
        if (pricingError) {
            pricingError.style.display = 'none';
        }
    }

    if (stepId === "cleaningFee") {
        initializeCleaningFeeStep();
        // Hide cleaning fee error when first showing the step
        const cleaningFeeError = document.getElementById('cleaningFee-error');
        if (cleaningFeeError) {
            cleaningFeeError.style.display = 'none';
        }
    }

    if (stepId === "minNights") {
        initializeMinNightsStep();
        // Hide min nights error when first showing the step
        const minNightsError = document.getElementById('minNights-error');
        if (minNightsError) {
            minNightsError.style.display = 'none';
        }
    }

    if (stepId === "rules") {
        initializeRulesStep();
    }
}

// Function to initialize min nights step
function initializeMinNightsStep() {
    const minNightsButtons = {
        'noMinimum': document.getElementById('minNights_noMinimum'),
        '3': document.getElementById('minNights_3'),
        '5': document.getElementById('minNights_5'),
        '7': document.getElementById('minNights_7'),
        '14': document.getElementById('minNights_14'),
        '30': document.getElementById('minNights_30'),
        '60': document.getElementById('minNights_60'),
        '90': document.getElementById('minNights_90')
    };

    // Function to update button styles
    function updateButtonStyles(selectedButton) {
        Object.values(minNightsButtons).forEach(button => {
            if (button) {
                if (button === selectedButton) {
                    button.style.outline = '2px solid black';
                    button.style.outlineOffset = '-1px';
                } else {
                    button.style.outline = '';
                    button.style.outlineOffset = '';
                }
            }
        });
    }

    // Add click handlers for all buttons
    Object.entries(minNightsButtons).forEach(([value, button]) => {
        if (button) {
            button.addEventListener('click', () => {
                // Update listingData
                listingData.minNights = value === 'noMinimum' ? 1 : parseInt(value);

                // Update button styles
                updateButtonStyles(button);

                // Revalidate if user has attempted to leave
                if (hasAttemptedToLeave.minNights) {
                    validateMinNights();
                }
            });
        }
    });

    // Set initial selection if exists in listingData
    if (listingData.minNights !== null) {
        const value = listingData.minNights === 1 ? 'noMinimum' : listingData.minNights.toString();
        const button = minNightsButtons[value];
        if (button) {
            updateButtonStyles(button);
        }
    }
}

// Function to initialize title step
function initializeTitleStep() {
    const descriptionInputField = document.querySelector('[data-element="title_input"]');
    const characterCount = document.getElementById('titleInputField_characterCount');
    const titleError = document.getElementById('title-error');
    const titleSubText = document.getElementById('title-subText');
    const maxChars = 35;

    if (descriptionInputField) {
        // Set the contentEditable attribute to true
        descriptionInputField.contentEditable = true;

        // Set styles to ensure text wraps and aligns correctly
        descriptionInputField.style.whiteSpace = 'pre-wrap';
        descriptionInputField.style.textAlign = 'left';
        descriptionInputField.style.height = '250px';
        descriptionInputField.style.overflowY = 'auto';
        descriptionInputField.style.boxSizing = 'border-box';
        descriptionInputField.style.padding = '10px';
        descriptionInputField.style.outline = 'none';
        descriptionInputField.style.caretColor = 'auto'; // Ensure cursor is always visible

        // Initialize character count display with existing text if any
        const existingText = listingData.title || '';
        if (characterCount) {
            characterCount.textContent = `${existingText.length}/${maxChars}`;
        }

        // Set existing text if any and place cursor at end
        if (existingText) {
            descriptionInputField.innerText = existingText;
            // Create a range at the end of the content
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(descriptionInputField);
            range.collapse(false); // false means collapse to end
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Add an event listener to handle input changes
        descriptionInputField.addEventListener('input', () => {
            // Get text content without trimming to preserve spaces
            const text = descriptionInputField.innerText;
            const currentLength = text.trim().length;

            // Update character count display and input styling
            if (characterCount) {
                characterCount.textContent = `${currentLength}/${maxChars}`; // Update character count
                const isOverLimit = currentLength > maxChars;
                characterCount.style.color = isOverLimit ? 'red' : 'grey'; // Change color if over limit

                // Update input field styling when over limit
                descriptionInputField.style.color = isOverLimit ? 'red' : ''; // Make text red if over limit
                descriptionInputField.style.border = isOverLimit ? '1px solid red' : ''; // Add red border if over limit
            }

            // Store the title in listingData
            listingData.title = text.trim();
        });

        // Always set initial focus to make cursor visible
        descriptionInputField.focus();

        // Ensure cursor is always visible by adding click handler
        descriptionInputField.addEventListener('click', () => {
            descriptionInputField.focus();
        });

        // Keep focus when field is empty
        descriptionInputField.addEventListener('blur', () => {
            if (!descriptionInputField.innerText.trim()) {
                descriptionInputField.focus();
            }
        });
    }
}

// Function to initialize description step
function initializeDescriptionStep() {
    const descriptionInputField = document.querySelector('[data-element="description_input"]');
    const characterCount = document.getElementById('descriptionInputField_characterCount');
    const descriptionError = document.getElementById('description-error');
    const descriptionSubText = document.getElementById('description-subText');
    const maxChars = 4000;

    if (descriptionInputField) {
        // Set the contentEditable attribute to true
        descriptionInputField.contentEditable = true;

        // Set styles to ensure text wraps and aligns correctly
        descriptionInputField.style.whiteSpace = 'pre-wrap';
        descriptionInputField.style.textAlign = 'left';
        descriptionInputField.style.height = '250px';
        descriptionInputField.style.overflowY = 'auto';
        descriptionInputField.style.boxSizing = 'border-box';
        descriptionInputField.style.padding = '10px';
        descriptionInputField.style.outline = 'none';
        descriptionInputField.style.caretColor = 'auto'; // Ensure cursor is always visible

        // Initialize character count display with existing text if any
        const existingText = listingData.description || '';
        if (characterCount) {
            characterCount.textContent = `${existingText.length}/${maxChars}`;
        }
        // Set existing text if any and place cursor at end
        if (existingText) {
            descriptionInputField.innerText = existingText;
            // Create a range at the end of the content
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(descriptionInputField);
            range.collapse(false); // false means collapse to end
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Add an event listener to handle input changes
        descriptionInputField.addEventListener('input', () => {
            // Get text content without trimming to preserve spaces
            const text = descriptionInputField.innerText;
            const currentLength = text.trim().length;

            // Update character count display and input styling
            if (characterCount) {
                characterCount.textContent = `${currentLength}/${maxChars}`; // Update character count
                const isOverLimit = currentLength > maxChars;
                characterCount.style.color = isOverLimit ? 'red' : 'grey'; // Change color if over limit

                // Update input field styling when over limit
                descriptionInputField.style.color = isOverLimit ? 'red' : ''; // Make text red if over limit
                descriptionInputField.style.border = isOverLimit ? '1px solid red' : ''; // Add red border if over limit
            }

            // Store the description in listingData
            listingData.description = text.trim();
        });

        // Always set initial focus to make cursor visible
        descriptionInputField.focus();

        // Ensure cursor is always visible by adding click handler
        descriptionInputField.addEventListener('click', () => {
            descriptionInputField.focus();
        });

        // Keep focus when field is empty
        descriptionInputField.addEventListener('blur', () => {
            if (!descriptionInputField.innerText.trim()) {
                descriptionInputField.focus();
            }
        });
    }
}

// Function to initialize pricing step
function initializePricingStep() {
    const priceInput = document.querySelector('[data-element="setPriceInput"]');
    if (priceInput) {
        // Remove default focus outline/border for all browsers
        priceInput.style.outline = 'none';
        priceInput.style.border = 'none';
        priceInput.style['-webkit-appearance'] = 'none';
        priceInput.style['-moz-appearance'] = 'none';
        priceInput.style['-ms-appearance'] = 'none';
        priceInput.style.appearance = 'none';

        // Set initial value if exists in listingData
        if (listingData.price) {
            priceInput.value = `$${listingData.price}`;
        }

        priceInput.addEventListener('focus', () => {
            if (!priceInput.value.startsWith('$')) {
                priceInput.value = '$' + priceInput.value;
            }
        });

        priceInput.addEventListener('input', (e) => {
            let value = e.target.value;

            // Ensure $ is always at start
            if (!value.startsWith('$')) {
                value = '$' + value;
            }

            // Remove non-numeric characters except leading $
            value = '$' + value.replace(/[^\d]/g, '');

            e.target.value = value;

            // Store numeric value without $ in listingData
            listingData.price = value.substring(1);

            if (hasAttemptedToLeave.pricing) {
                validatePricing();
            }
        });

        // Prevent backspace/delete from removing $
        priceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const cursorPosition = priceInput.selectionStart;
                if (cursorPosition <= 1) {
                    e.preventDefault();
                }
            }
        });
    }
}

// Function to initialize cleaning fee step
function initializeCleaningFeeStep() {
    const cleaningFeeInput = document.querySelector('[data-element="setCleaningFeeInput"]');
    if (cleaningFeeInput) {
        // Remove default focus outline/border for all browsers
        cleaningFeeInput.style.outline = 'none';
        cleaningFeeInput.style.border = 'none';
        cleaningFeeInput.style['-webkit-appearance'] = 'none';
        cleaningFeeInput.style['-moz-appearance'] = 'none';
        cleaningFeeInput.style['-ms-appearance'] = 'none';
        cleaningFeeInput.style.appearance = 'none';

        // Set initial value if exists in listingData
        if (listingData.cleaningFee) {
            cleaningFeeInput.value = `$${listingData.cleaningFee}`;
        }

        cleaningFeeInput.addEventListener('focus', () => {
            if (!cleaningFeeInput.value.startsWith('$')) {
                cleaningFeeInput.value = '$' + cleaningFeeInput.value;
            }
        });

        cleaningFeeInput.addEventListener('input', (e) => {
            let value = e.target.value;

            // Ensure $ is always at start
            if (!value.startsWith('$')) {
                value = '$' + value;
            }

            // Remove non-numeric characters except leading $
            value = '$' + value.replace(/[^\d]/g, '');

            e.target.value = value;

            // Store numeric value without $ in listingData
            listingData.cleaningFee = value.substring(1);

            if (hasAttemptedToLeave.cleaningFee) {
                validateCleaningFee();
            }
        });

        // Prevent backspace/delete from removing $
        cleaningFeeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const cursorPosition = cleaningFeeInput.selectionStart;
                if (cursorPosition <= 1) {
                    e.preventDefault();
                }
            }
        });
    }
}


// Function to initialize photos step
function initializePhotosStep() {
    const addPhotosButton = document.getElementById('addPhotosButton');
    const addPhotosButton2 = document.getElementById('addPhotosButton2');
    const addPhotosContainer = document.getElementById('addPhotosButton_Container');
    const photoContainerParent = document.querySelector('[data-element="photo_container_parent"]');
    const photoContainer = document.querySelector('[data-element="photo_container"]');
    const photosError = document.getElementById('photos-error');
    const photosSubText = document.getElementById('photos-subText');

    // Remove existing event listeners to prevent multiple triggers
    const removeEventListeners = (button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        return newButton;
    };

    // Show/hide elements based on whether photos exist
    if (listingData.photos.length > 0) {
        if (addPhotosContainer) addPhotosContainer.style.display = 'none';
        if (addPhotosButton2) addPhotosButton2.style.display = 'flex';
        if (photoContainerParent) photoContainerParent.style.display = 'grid';

        // Remove all existing photo containers first
        const allPhotoContainers = document.querySelectorAll('[data-element="photo_container_parent"]');
        allPhotoContainers.forEach((container, index) => {
            if (index > 0) container.remove();
        });

        // Display all stored photos
        listingData.photos.forEach((photo, index) => {
            if (index === 0) {
                // Use existing container for first photo
                if (photoContainer) photoContainer.src = photo.dataUrl;
            } else {
                // Create new containers for additional photos
                const newParent = photoContainerParent.cloneNode(true);
                const newImg = newParent.querySelector('[data-element="photo_container"]');
                if (newImg) newImg.src = photo.dataUrl;
                photoContainerParent.parentNode.appendChild(newParent);
            }
        });
    } else {
        // No photos exist
        if (addPhotosContainer) {
            addPhotosContainer.style.display = 'flex';
            addPhotosContainer.style.flexDirection = 'column';
            addPhotosContainer.style.gap = '15px';
        }
        if (addPhotosButton2) addPhotosButton2.style.display = 'none';
        if (photoContainerParent) photoContainerParent.style.display = 'none';
        if (photoContainer) photoContainer.src = '';
    }

    // Hide error message initially
    if (photosError) photosError.style.display = 'none';
    if (photosSubText) photosSubText.style.display = 'block';

    // Add click handler to both add photos buttons
    const setupPhotoButton = (button) => {
        if (button) {
            const newButton = removeEventListeners(button);
            newButton.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.accept = 'image/*';
                fileInput.addEventListener('change', handlePhotoSelection);
                fileInput.click();
            });
        }
    };

    setupPhotoButton(addPhotosButton);
    setupPhotoButton(addPhotosButton2);
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
    //console.log("Page loaded, initializing steps");

    // Hide the error elements initially
    const basicsError = document.getElementById('basics-error');
    const locationError = document.getElementById('location-error');
    const locationSubText = document.getElementById('location-subText');
    const confirmLocationError = document.getElementById('confirmLocation-error');
    const amenitiesError = document.getElementById('amenities-error');
    const pricingError = document.getElementById('pricing-error');
    const cleaningFeeError = document.getElementById('cleaningFee-error');

    if (basicsError) {
        basicsError.style.display = 'none';
    }
    if (locationError) {
        locationError.style.display = 'none';
    }
    if (locationSubText) {
        locationSubText.style.display = 'block';
    }
    if (confirmLocationError) {
        confirmLocationError.style.display = 'none';
    }
    if (amenitiesError) {
        amenitiesError.style.display = 'none';
    }
    if (pricingError) {
        pricingError.style.display = 'none';
    }
    if (cleaningFeeError) {
        cleaningFeeError.style.display = 'none';
    }

    // Determine the initial step from the URL hash or default to step 1
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const initialStepId = hash ? hash : 'get-started';
    const initialStepNumber = steps.indexOf(initialStepId) !== -1 ? steps.indexOf(initialStepId) + 1 : 1;
    //console.log(`Initial step ID: ${initialStepId}, Initial step number: ${initialStepNumber}`);
    goToStep(initialStepNumber);
});

// Handle next button click
document.getElementById('nextStep').addEventListener('click', function () {
    //console.log(`Next step clicked: Current step ${currentStepNumber}`);

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

// Add input event listeners for address fields
document.addEventListener('DOMContentLoaded', () => {
    const addressInputs = [
        document.getElementById("addressLine1-input"),
        document.getElementById("addressLine2-input"),
        document.getElementById("addressCity-input"),
        document.getElementById("addressState-input"),
        document.getElementById("addressZipcode-input")
    ];

    addressInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (hasAttemptedToLeave.location) {
                    validateLocation();
                }
            });
        }
    });
});

