// Prevent zoom on mobile when focusing inputs
(function () {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
    }
})();

// Show loader on page load
(function () {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
        loader.style.display = 'flex';
    }
})();

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

// Object to store listing data
let listingData = {
    selectedAmenities: [], // Array to store selected amenity IDs
    photos: [], // Array to store selected photos with file extension, url, and selection info
    title: '', // Store title text
    description: '', // Store description text
    price: '', // Store price value
    cleaningFee: '', // Store cleaning fee value
    minNights: null, // Store minimum nights selection
    basics: {
        guests: 0, // Store guest count
        bedrooms: 0, // Store bedroom count  
        beds: 0, // Store bed count
        baths: 0 // Store bath count
    },
    checkIn: {
        time: 4, // Default check-in time
        period: 'PM', // Default period
        method: null // Store selected check-in method
    },
    checkOut: {
        time: 10, // Default check-out time 
        period: 'AM' // Default period
    },
    dock: {
        hasPrivateDock: null, // Store if property has private dock
        boatSize: '', // Store boat size with ft unit
        beam: '', // Store beam size with ft unit
        draft: '', // Store draft with ft unit
        selectedButtons: [] // Store selected dock buttons
    },
    address: {
        addressLine1: '', // Store street address like "127 Mockingbird Lane"
        addressLine2: '', // Store city/state/zip like "Marathon, FL 33050"
        cityState: '', // Store city and state like "Marathon, Florida"
        neighborhood: '',
        unit: '', // Store unit number like "201"
        city: '', // Store city like "Marathon"
        state: '', // Store state like "Florida"
        zipcode: '', // Store zipcode like "33050"
        longitude: '', // Store longitude like "-80.9319"
        latitude: '' // Store latitude like "24.7433"
    },
    addressNotSelected: null,
    addressChosen: null,
    addressVerified: null,
    duringStayRules: [],
    beforeDepartureRules: [], // Array to store selected departure rules
    safetyFeatures: [], // Array to store selected safety features
    cancellationPolicy: null, // Store selected cancellation policy
    userId: null, // Will be set when user data loads
    unfinishedPropertyId: null // Store ID of unfinished property if continuing one
};

// Add event listeners for save and exit button and submit button
document.addEventListener('DOMContentLoaded', function () {
    const saveAndExitButton = document.querySelector('[data-element="addHome_saveAndExit"]');
    const submitButton = document.getElementById('submitButton');
    const saveAndExitText = document.querySelector('[data-element="addHome_saveAndExit_text"]');
    const submitButtonText = document.querySelector('[data-element="submitButton_text"]');
    const saveExitLoader = document.querySelector('[data-element="Login_Button_Loader"]');
    const submitLoader = document.querySelector('[data-element="Submit_Button_Loader"]');

    saveExitLoader.style.display = 'none';
    submitLoader.style.display = 'none';

    // Immediately hide save and exit button to prevent flash on initial load
    if (saveAndExitButton) {
        saveAndExitButton.style.display = 'none';
    }

    // Hide save and exit button on manageAddHome and get-started steps
    function updateSaveAndExitVisibility() {
        const manageAddHomeStep = document.getElementById('manageAddHome');
        const getStartedStep = document.getElementById('get-started');
        const hash = window.location.hash;

        if (!saveAndExitButton) return;

        const isOnInitialSteps = (manageAddHomeStep && window.getComputedStyle(manageAddHomeStep).display !== 'none') ||
            (getStartedStep && window.getComputedStyle(getStartedStep).display !== 'none');

        // Use opacity and transition for smooth visibility changes
        saveAndExitButton.style.transition = 'opacity 0.3s ease-in-out';
        saveAndExitButton.style.opacity = (isOnInitialSteps || !hash) ? '0' : '1';

        // After fade out completes, update display property
        setTimeout(() => {
            saveAndExitButton.style.display = (isOnInitialSteps || !hash) ? 'none' : 'flex';
        }, (isOnInitialSteps || !hash) ? 300 : 0);
    }

    // Call initially
    updateSaveAndExitVisibility();

    // Function to handle saving property data
    async function handlePropertySave(isFinalSubmit = false) {
        try {
            // Show appropriate loader and hide text based on which button was clicked
            if (isFinalSubmit) {
                if (submitLoader) submitLoader.style.display = 'flex';
                if (submitButtonText) submitButtonText.style.display = 'none';
            } else {
                if (saveExitLoader) saveExitLoader.style.display = 'flex';
                if (saveAndExitText) saveAndExitText.style.display = 'none';
            }

            // Track pending requests
            const pendingRequests = [];

            // Check if userId is set before proceeding
            if (!listingData.userId) {
                console.log('Cannot save property: User ID is not set');
                return;
            }

            // Generate UUID
            const uuid = crypto.randomUUID();

            // Prepare the data object to match API schema
            const propertyData = {
                host_user_id: listingData.userId,
                uuid: uuid
            };

            // Add unfinished property ID if continuing an existing listing
            if (listingData.unfinishedPropertyId) {
                propertyData.unfinished_propertyID = listingData.unfinishedPropertyId;
            }

            // Check if user is in review info step
            const reviewInfoStep = document.getElementById('reviewInfo');
            if (reviewInfoStep && window.getComputedStyle(reviewInfoStep).display !== 'none') {
                propertyData.addHome_complete = true;
                propertyData.serviceFee = 0.12;
            }

            // Only add fields that have been filled out
            if (listingData.title) propertyData.property_name = listingData.title;
            if (listingData.description) propertyData.listing_description = listingData.description;
            if (listingData.price) propertyData.nightlyPrice = parseFloat(listingData.price);
            if (listingData.cleaningFee) propertyData.cleaning_fee = parseFloat(listingData.cleaningFee);
            if (listingData.minNights) propertyData.min_nights = parseInt(listingData.minNights);
            if (listingData.minNights) propertyData.max_nights = 365;
            if (listingData.minNights) propertyData.availabilityWindow_months = 24;
            if (listingData.minNights) propertyData.advanceNotice = 1;

            // Only add basics if they've been modified from default 0
            if (listingData.basics.guests > 0) propertyData.num_guests = listingData.basics.guests;
            if (listingData.basics.bedrooms > 0) propertyData.num_bedrooms = listingData.basics.bedrooms;
            if (listingData.basics.beds > 0) propertyData.num_beds = listingData.basics.beds;
            if (listingData.basics.baths > 0) propertyData.num_bathrooms = listingData.basics.baths;

            // Only add check in/out if method is selected
            if (listingData.checkIn.method) {
                propertyData.check_in_time = `${listingData.checkIn.time} ${listingData.checkIn.period.toUpperCase()}`;
                propertyData.check_out_time = `${listingData.checkOut.time} ${listingData.checkOut.period.toUpperCase()}`;
                propertyData.check_in_method = listingData.checkIn.method.text;
            }

            // Only add address fields if they exist
            if (listingData.address.addressLine1) propertyData.address_line_1 = listingData.address.addressLine1;
            if (listingData.address.addressLine2) propertyData.address_line_2 = listingData.address.addressLine2;
            if (listingData.address.cityState) propertyData.listing_city_state = listingData.address.cityState;
            if (listingData.address.neighborhood) propertyData.listing_neighborhood = listingData.address.neighborhood;
            if (listingData.address.unit) {
                const unitValue = listingData.address.unit;
                if (!unitValue.toLowerCase().includes('apt') &&
                    !unitValue.toLowerCase().includes('unit') &&
                    !unitValue.toLowerCase().includes('suite')) {
                    propertyData.listing_unit = '#' + unitValue;
                } else {
                    propertyData.listing_unit = unitValue;
                }
            }
            if (listingData.address.city) propertyData.listing_city = listingData.address.city;
            if (listingData.address.state) propertyData.listing_state = listingData.address.state;
            if (listingData.address.zipcode) propertyData.listing_zipcode = listingData.address.zipcode;
            if (listingData.addressVerified !== null) propertyData.addressVerified = listingData.addressVerified;
            if (listingData.addressNotSelected !== null) propertyData.address_notSelected = listingData.addressNotSelected;
            if (listingData.addressChosen !== null) propertyData.address_chosen = listingData.addressChosen;
            if (listingData.address.longitude) propertyData.longitude = parseFloat(listingData.address.longitude);
            if (listingData.address.latitude) propertyData.latitude = parseFloat(listingData.address.latitude);

            // Only add cancellation policy if one is selected
            if (listingData.cancellationPolicy) {
                propertyData.cancellationPolicy_type = listingData.cancellationPolicy;

                switch (listingData.cancellationPolicy) {
                    case "Relaxed":
                        propertyData.cancellation_policy = true;
                        propertyData.cancellation_policy_option = 86400;
                        propertyData.cancellationPolicy_type = "Relaxed";
                        break;
                    case "Standard":
                        propertyData.cancellation_policy = true;
                        propertyData.cancellation_policy_option = 432000;
                        propertyData.cancellationPolicy_type = "Standard";
                        break;
                    case "Firm":
                        propertyData.cancellation_policy = true;
                        propertyData.cancellation_policy_option = 2592000;
                        propertyData.cancellationPolicy_type = "Firm";
                        break;
                    case "Grace window":
                        propertyData.cancellation_policy = true;
                        propertyData.strict_cancellation_policy = true;
                        propertyData.strict_cancellation_policy_option = 172800;
                        propertyData.cancellationPolicy_type = "Grace window";
                        break;
                    case "No refund":
                        propertyData.cancellation_policy = false;
                        propertyData.cancellationPolicy_type = "No refund";
                        break;
                }
            }

            // Add private dock step response
            if (listingData.dock.hasPrivateDock !== null) {
                propertyData.addHome_privateDockStep = listingData.dock.hasPrivateDock ? 'yes' : 'no';
            }

            // Only add dock data if property has private dock and fields are filled
            if (listingData.dock.hasPrivateDock === true) {
                propertyData.private_dock = true;
                if (listingData.dock.boatSize) propertyData.dock_maxBoatLength = listingData.dock.boatSize;
                if (listingData.dock.beam) propertyData.dock_maxBeamLength = listingData.dock.beam;
                if (listingData.dock.draft) propertyData.dock_maxDraftLength = listingData.dock.draft;

                // Only add dock features that are selected
                if (listingData.dock.selectedButtons.includes('Fresh water hookup')) propertyData.dock_freshWater = true;
                if (listingData.dock.selectedButtons.includes('Cleaning station')) propertyData.dock_cleaningStation = true;
                if (listingData.dock.selectedButtons.includes('Dock light')) propertyData.dock_light = true;
                if (listingData.dock.selectedButtons.includes('Underwater light')) propertyData.dock_underwaterLight = true;
                if (listingData.dock.selectedButtons.includes('Shore power')) propertyData.dock_shorePower = true;
                if (listingData.dock.selectedButtons.includes('Ice maker')) propertyData.dock_iceMaker = true;
            }

            // Send POST request to property API
            const propertyPromise = fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyData)
            });
            pendingRequests.push(propertyPromise);

            const propertyResponse = await propertyPromise;
            if (!propertyResponse.ok) {
                throw new Error('Failed to save property data');
            }

            const propertyResult = await propertyResponse.json();
            console.log('Property saved successfully:', propertyResult);

            // If amenities were selected, make the property_attribute_add_home request
            if (listingData.selectedAmenities.length > 0) {
                const amenityData = {
                    property_id: propertyResult.id,
                    selectedAmenities: listingData.selectedAmenities.map(id => ({ amenity_id: id }))
                };

                if (listingData.unfinishedPropertyId) {
                    amenityData.unfinishedListing = true;
                }

                const amenityPromise = fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_addOrEdit_home_attribute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(amenityData)
                });
                pendingRequests.push(amenityPromise);
            }

            // Make the property_rules_add_home request with all rules data
            if (listingData.checkIn.time && listingData.checkIn.period &&
                listingData.checkOut.time && listingData.checkOut.period &&
                listingData.checkIn.method &&
                listingData.duringStayRules.length > 0) {
                const rulesData = {
                    property_id: propertyResult.id,
                    checkIn: "Check in after " + listingData.checkIn.time + " " + listingData.checkIn.period.toUpperCase(),
                    checkOut: "Check out before " + listingData.checkOut.time + " " + listingData.checkOut.period.toUpperCase(),
                    checkInMethod: listingData.checkIn.method.text,
                    guestMax: listingData.basics.guests,
                    duringStay: listingData.duringStayRules.map(rule => ({
                        selectedDuringStayOptions: rule.text
                    })),
                    beforeDeparture: listingData.beforeDepartureRules.map(rule => ({
                        selectedBeforeDepartureOptions: rule.text
                    }))
                };

                if (listingData.unfinishedPropertyId) {
                    rulesData.unfinishedListing = true;
                }

                const rulesPromise = fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_add_home_rules', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rulesData)
                });
                pendingRequests.push(rulesPromise);
            }

            // If photos or cover photos were added, make the property_photos_add_home request
            if (listingData.photos.length > 0) {
                const coverPhotos = listingData.photos.filter(p => p.isCoverPhoto);
                const hasValidCoverPhotos = coverPhotos.length === 5 &&
                    [1, 2, 3, 4, 5].every(num =>
                        coverPhotos.some(p => p.coverPhotoOrder === num)
                    );

                let processedPhotos = [...listingData.photos];

                if (hasValidCoverPhotos) {
                    let nextOrder = 6;
                    processedPhotos = processedPhotos.map(photo => {
                        if (photo.coverPhotoOrder >= 1 && photo.coverPhotoOrder <= 5) {
                            return {
                                ...photo,
                                isCoverPhoto: true
                            };
                        } else {
                            return {
                                ...photo,
                                isCoverPhoto: false,
                                coverPhotoOrder: nextOrder++
                            };
                        }
                    });
                }

                const photoData = {
                    property_id: propertyResult.id,
                    addedPhotos: processedPhotos.map(photo => ({
                        image: photo.dataUrl,
                        isCoverPhoto: photo.isCoverPhoto,
                        coverPhotoOrder: photo.coverPhotoOrder,
                        isDockPhoto: photo.isDockPhoto,
                        in_dock_section_order: photo.in_dock_section_order
                    })),
                };

                if (listingData.unfinishedPropertyId) {
                    photoData.unfinishedListing = true;
                }

                console.log(photoData);

                const photoPromise = fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_add_home_photos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(photoData)
                });
                pendingRequests.push(photoPromise);
            }

            // If safety features were added, make the property_add_home_safety request
            if (listingData.safetyFeatures.length > 0) {
                const safetyData = {
                    property_id: propertyResult.id,
                    selectedSafety: listingData.safetyFeatures.map(feature => ({
                        attribute: feature.text
                    }))
                };

                if (listingData.unfinishedPropertyId) {
                    safetyData.unfinishedListing = true;
                }

                const safetyPromise = fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_addOrEdit_home_safety', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(safetyData)
                });
                pendingRequests.push(safetyPromise);
            }

            // Wait for all requests to complete
            await Promise.all(pendingRequests);

            // Only redirect after all requests are successful
            window.location.href = '/host/dashboard';

        } catch (error) {
            console.error('Error saving property:', error);
            // Hide loader and show text on error
            if (isFinalSubmit) {
                if (submitLoader) submitLoader.style.display = 'none';
                if (submitButtonText) submitButtonText.style.display = 'block';
            } else {
                if (saveExitLoader) saveExitLoader.style.display = 'none';
                if (saveAndExitText) saveAndExitText.style.display = 'block';
            }
            // Handle error - show error message to user
        }
    }

    // Add click handler for save and exit button
    if (saveAndExitButton) {
        saveAndExitButton.addEventListener('click', () => handlePropertySave(false));
    }

    // Add click handler for submit button
    if (submitButton) {
        submitButton.addEventListener('click', () => handlePropertySave(true));
    }

    // Add mutation observer to watch for display changes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                updateSaveAndExitVisibility();
            }
        });
    });

    // Observe both steps for style changes
    const manageAddHomeStep = document.getElementById('manageAddHome');
    const getStartedStep = document.getElementById('get-started');

    if (manageAddHomeStep) {
        observer.observe(manageAddHomeStep, { attributes: true });
    }
    if (getStartedStep) {
        observer.observe(getStartedStep, { attributes: true });
    }
});





// Set up Wized to get user ID and check for unfinished listings
document.addEventListener('DOMContentLoaded', async function () {
    window.Wized = window.Wized || [];
    window.Wized.push((async (Wized) => {
        await Wized.requests.waitFor('Load_user');
        listingData.userId = Wized.data.r.Load_user.data.id;

        // Check for unfinished listings
        try {
            const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_addHome_inProgress?user_id=${listingData.userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                window.location.href = '/host/dashboarx';
                return;
            }

            const unfinishedListings = await response.json();

            if (unfinishedListings && unfinishedListings.length > 0) {
                // Show manageAddHome step
                const manageAddHomeStep = document.getElementById('manageAddHome');
                const listingBlockTemplate = document.querySelector('[data-element="manageAddHome_continueListingBlock"]');
                const listingContainer = listingBlockTemplate.parentElement;
                const addListingBlock = document.querySelector('[data-element="manageAddHome_addListingBlock"]');

                // Clear existing blocks
                listingContainer.innerHTML = '';

                // Create blocks for each unfinished listing
                unfinishedListings.forEach(listing => {
                    const newBlock = listingBlockTemplate.cloneNode(true);
                    const textElement = newBlock.querySelector('[data-element="manageAddHome_continueListingText"]');

                    const createdDate = new Date(listing.created_at);
                    const formattedDate = createdDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    textElement.textContent = `Your listing started on ${formattedDate}`;

                    // Add click handler to resume listing
                    newBlock.addEventListener('click', async () => {
                        // Store the unfinished property ID
                        listingData.unfinishedPropertyId = listing.id;

                        // Populate listingData with existing data
                        if (listing.num_guests) listingData.basics.guests = listing.num_guests;
                        if (listing.num_bedrooms) listingData.basics.bedrooms = listing.num_bedrooms;
                        if (listing.num_beds) listingData.basics.beds = listing.num_beds;
                        if (listing.num_bathrooms) listingData.basics.baths = listing.num_bathrooms;

                        if (listing.address_line_1) listingData.address.addressLine1 = listing.address_line_1;
                        if (listing.address_line_2) listingData.address.addressLine2 = listing.address_line_2;
                        if (listing.listing_city_state) listingData.address.cityState = listing.listing_city_state;
                        if (listing.listing_neighborhood) listingData.address.neighborhood = listing.listing_neighborhood;
                        if (listing.listing_unit) listingData.address.unit = listing.listing_unit;
                        if (listing.listing_city) listingData.address.city = listing.listing_city;
                        if (listing.listing_state) listingData.address.state = listing.listing_state;
                        if (listing.listing_zipcode) listingData.address.zipcode = listing.listing_zipcode;
                        if (listing.address_notSelected) listingData.addressNotSelected = listing.address_notSelected;
                        if (listing.address_chosen) listingData.addressChosen = listing.address_chosen;
                        if (listing.addressVerified !== null) listingData.addressVerified = listing.addressVerified;
                        if (listing.longitude) listingData.address.longitude = listing.longitude;
                        if (listing.latitude) listingData.address.latitude = listing.latitude;

                        if (listing._property_attribute) {
                            // Handle amenities
                            listingData.selectedAmenities = listing._property_attribute.map(attr => attr.attribute_id);

                            // Handle safety features
                            listingData.safetyFeatures = listing._property_attribute
                                .filter(attr => attr.inSafetyInformationSection)
                                .map(attr => {
                                    let type;
                                    const text = attr.attribute_custom_name.toLowerCase();

                                    if (text.includes('carbon monoxide')) {
                                        if (text.includes('no carbon monoxide')) {
                                            type = 'noCarbonMonoxideAlarm';
                                        } else {
                                            type = 'carbonMonoxideAlarm';
                                        }
                                    } else if (text.includes('camera')) {
                                        if (text.includes('doorbell')) {
                                            type = 'doorbellCamera';
                                        } else {
                                            type = 'securityCamera';
                                        }
                                    } else if (text.includes('fire extinguisher')) {
                                        type = 'fireExtinguisher';
                                    } else if (text.includes('smoke')) {
                                        type = 'smokeAlarm';
                                    } else if (text.includes('first aid')) {
                                        type = 'firstAidKit';
                                    }

                                    return {
                                        type,
                                        text: attr.attribute_custom_name
                                    };
                                })
                                .filter(feature => feature && feature.type); // Remove any undefined entries
                        }

                        if (listing.addHome_privateDockStep === 'no') {
                            listingData.dock.hasPrivateDock = false;
                        } else if (listing.private_dock === true) {
                            listingData.dock.hasPrivateDock = true;
                            if (listing.dock_maxBoatLength) listingData.dock.boatSize = listing.dock_maxBoatLength;
                            if (listing.dock_maxBeamLength) listingData.dock.beam = listing.dock_maxBeamLength;
                            if (listing.dock_maxDraftLength) listingData.dock.draft = listing.dock_maxDraftLength;

                            const dockFeatures = [];
                            if (listing.dock_freshWater) dockFeatures.push('Fresh water hookup');
                            if (listing.dock_cleaningStation) dockFeatures.push('Cleaning station');
                            if (listing.dock_light) dockFeatures.push('Dock light');
                            if (listing.dock_underwaterLight) dockFeatures.push('Underwater light');
                            if (listing.dock_shorePower) dockFeatures.push('Shore power');
                            if (listing.dock_iceMaker) dockFeatures.push('Ice maker');
                            listingData.dock.selectedButtons = dockFeatures;
                        }

                        if (listing._property_pictures) {
                            listingData.photos = listing._property_pictures.map(pic => ({
                                url: pic.property_image.url,
                                dataUrl: pic.property_image.url,
                                isCoverPhoto: pic.inHeaderPreview || false,
                                coverPhotoOrder: pic.inPreviewOrder || null,
                                isDockPhoto: pic.in_dock_section || false,
                                in_dock_section_order: pic.in_dock_section_order || null
                            }));
                        }

                        if (listing.property_name) listingData.title = listing.property_name;
                        if (listing.listing_description) listingData.description = listing.listing_description;
                        if (listing.nightlyPrice) listingData.price = listing.nightlyPrice.toString();
                        if (listing.cleaning_fee) listingData.cleaningFee = listing.cleaning_fee.toString();
                        if (listing.min_nights) listingData.minNights = listing.min_nights;

                        // Set check-in/check-out times and method from property rules
                        if (listing._property_rules) {
                            // Group rules by category
                            const checkInRules = listing._property_rules.filter(rule => rule.rules_category_id === 1);
                            const duringVisitRules = listing._property_rules.filter(rule => rule.rules_category_id === 2);
                            const beforeDepartureRules = listing._property_rules.filter(rule => rule.rules_category_id === 3);

                            // Set check-in method from rules
                            const checkInMethodRule = checkInRules.find(rule => rule.rules_id === 3);
                            if (checkInMethodRule) {
                                const methodText = checkInMethodRule.rules_custom.toLowerCase();
                                let methodType;

                                // Map text to type
                                if (methodText.includes('keypad')) methodType = 'keypad';
                                else if (methodText.includes('lockbox')) methodType = 'lockbox';
                                else if (methodText.includes('person')) methodType = 'inPerson';
                                else if (methodText.includes('digital key')) methodType = 'digitalCard';

                                listingData.checkIn.method = {
                                    type: methodType,
                                    text: checkInMethodRule.rules_custom
                                };
                            }

                            // Set check-in/check-out times
                            if (listing.check_in_time) {
                                const [time, period] = listing.check_in_time.split(' ');
                                listingData.checkIn = {
                                    ...listingData.checkIn,
                                    time: parseInt(time),
                                    period: period
                                };
                            }

                            if (listing.check_out_time) {
                                const [time, period] = listing.check_out_time.split(' ');
                                listingData.checkOut = {
                                    time: parseInt(time),
                                    period: period
                                };
                            }

                            // Map during visit rules
                            listingData.duringStayRules = duringVisitRules.map(rule => {
                                if (rule.rules_id === 4) {
                                    return {
                                        type: 'guestMax',
                                        text: 'guests maximum'
                                    };
                                } else if (rule.rules_id === 6) {
                                    return {
                                        type: 'noParty',
                                        text: rule.rules_custom
                                    };
                                } else if (rule.rules_id === 5) {
                                    return {
                                        type: 'noPet',
                                        text: rule.rules_custom
                                    };
                                } else if (rule.rules_id === 7) {
                                    return {
                                        type: 'noSmoking',
                                        text: rule.rules_custom
                                    };
                                }
                            }).filter(Boolean);

                            // Map before departure rules
                            listingData.beforeDepartureRules = beforeDepartureRules.map(rule => {
                                if (rule.rules_id === 8) {
                                    return {
                                        type: 'towels',
                                        text: rule.rules_custom
                                    };
                                } else if (rule.rules_id === 9) {
                                    return {
                                        type: 'trash',
                                        text: rule.rules_custom
                                    };
                                } else if (rule.rules_id === 10) {
                                    return {
                                        type: 'bedsheets',
                                        text: rule.rules_custom
                                    };
                                } else if (rule.rules_id === 11) {
                                    return {
                                        type: 'furniture',
                                        text: rule.rules_custom
                                    };
                                }
                            }).filter(Boolean);

                            if (listing.cancellationPolicy_type !== null) listingData.cancellationPolicy = listing.cancellationPolicy_type;
                        }

                        // Determine which step to resume from
                        let resumeStep = 'basics';
                        if (listing.num_guests && listing.num_bedrooms && listing.num_beds && listing.num_bathrooms) {
                            if (listing.address_line_1 && listing.listing_city_state && listing.listing_zipcode) {
                                if (listing.addressVerified) {
                                    if (listing._property_attribute?.length) {
                                        // Check dock step conditions
                                        if (listing.addHome_privateDockStep === null) {
                                            resumeStep = 'dock';
                                        } else if (listing.private_dock === true &&
                                            (!listing.dock_maxBoatLength ||
                                                !listing.dock_maxBeamLength ||
                                                !listing.dock_maxDraftLength)) {
                                            resumeStep = 'dock';
                                        } else if (listing._property_pictures?.length < 5) {
                                            resumeStep = 'photos';
                                        } else {
                                            // Check cover photos condition
                                            const coverPhotoCount = listing._property_pictures.filter(pic => pic.inHeaderPreview).length;
                                            if (coverPhotoCount < 5) {
                                                resumeStep = 'coverPhotos';
                                            } else if (listing.private_dock === true && listing._property_pictures.filter(pic => pic.in_dock_section).length < 2) {
                                                resumeStep = 'dockPhotos';
                                            } else if (!listing.property_name) {
                                                console.log("Leah gets here resume step is title")
                                                resumeStep = 'title';
                                            } else if (!listing.listing_description) {
                                                resumeStep = 'description';
                                            } else if (!listing.nightlyPrice) {
                                                resumeStep = 'pricing';
                                            } else if (!listing.cleaning_fee) {
                                                resumeStep = 'cleaningFee';
                                            } else if (!listing.min_nights) {
                                                resumeStep = 'minNights';
                                            } else if (!listing._property_rules?.length) {
                                                resumeStep = 'rules';
                                            } else if (!listing._property_attribute.filter(attr => attr.inSafetyInformationSection).length) {
                                                resumeStep = 'safety';
                                            } else if (!listing.cancellationPolicy_type) {
                                                resumeStep = 'cancellationPolicy';
                                            } else {
                                                resumeStep = 'reviewInfo';
                                            }
                                        }
                                    } else {
                                        resumeStep = 'amenities';
                                    }
                                } else {
                                    resumeStep = 'confirmLocation';
                                }
                            } else {
                                resumeStep = 'location';
                            }
                        }

                        console.log({ resumeStep })
                        // Navigate to the determined step
                        const stepIndex = steps.indexOf(resumeStep);
                        console.log({ stepIndex })
                        if (stepIndex !== -1) {
                            // Initialize and populate all previous steps before navigating
                            for (let i = 0; i <= stepIndex; i++) {
                                const stepId = steps[i];
                                switch (stepId) {
                                    case 'basics':
                                        await initializeCounters();
                                        // Update UI with stored values using correct element IDs
                                        const guestsText = document.getElementById('guests-text');
                                        const bedroomsText = document.getElementById('bedrooms-text');
                                        const bedsText = document.getElementById('beds-text');
                                        const bathsText = document.getElementById('baths-text');

                                        if (guestsText) guestsText.textContent = listingData.basics.guests;
                                        if (bedroomsText) bedroomsText.textContent = listingData.basics.bedrooms;
                                        if (bedsText) bedsText.textContent = listingData.basics.beds;
                                        if (bathsText) bathsText.textContent = listingData.basics.baths;
                                        break;
                                    case 'location':
                                        // Populate location form fields first
                                        const addressLine1Input = document.getElementById("addressLine1-input");
                                        const addressLine2Input = document.getElementById("addressLine2-input");
                                        const addressCityInput = document.getElementById("addressCity-input");
                                        const addressStateInput = document.getElementById("addressState-input");
                                        const addressZipcodeInput = document.getElementById("addressZipcode-input");

                                        if (addressLine1Input) addressLine1Input.value = listingData.address.addressLine1;
                                        if (addressLine2Input) addressLine2Input.value = listingData.address.unit;
                                        if (addressCityInput) addressCityInput.value = listingData.address.city;
                                        if (addressStateInput) addressStateInput.value = listingData.address.state;
                                        if (addressZipcodeInput) addressZipcodeInput.value = listingData.address.zipcode;

                                        // Then validate location
                                        await validateLocation();
                                        break;

                                    case 'confirmLocation':
                                        // Set selectedAddressType based on previously chosen address
                                        selectedAddressType = listingData.addressChosen || 'suggested';

                                        // Set up the addresses in the UI
                                        const confirmSuggestedAddress = document.getElementById("confirmSuggestedAddress");
                                        const confirmEnteredAddress = document.getElementById("confirmEnteredAddress");

                                        if (confirmSuggestedAddress && confirmEnteredAddress) {
                                            if (selectedAddressType === 'suggested') {
                                                let suggestedAddress = listingData.address.addressLine1;
                                                if (listingData.address.unit) {
                                                    suggestedAddress += ` ${listingData.address.unit}`;
                                                }
                                                suggestedAddress += `, ${listingData.address.city}, ${listingData.address.state} ${listingData.address.zipcode}`;
                                                confirmSuggestedAddress.textContent = suggestedAddress;
                                                confirmEnteredAddress.textContent = listingData.addressNotSelected;
                                            } else {
                                                let enteredAddress = listingData.address.addressLine1;
                                                if (listingData.address.unit) {
                                                    enteredAddress += ` ${listingData.address.unit}`;
                                                }
                                                enteredAddress += `, ${listingData.address.city}, ${listingData.address.state} ${listingData.address.zipcode}`;
                                                confirmEnteredAddress.textContent = enteredAddress;
                                                confirmSuggestedAddress.textContent = listingData.addressNotSelected;
                                            }
                                        }

                                        updateAddressSelection();
                                        break;

                                    case 'amenities':
                                        await fetchAndRenderAmenities();
                                        // Select previously chosen amenities by triggering clicks
                                        // Need to wait for amenities to be fully rendered
                                        setTimeout(() => {
                                            listingData.selectedAmenities.forEach(amenityId => {
                                                const amenityElement = document.querySelector(`[data-amenity-id="${amenityId}"]`);
                                                if (amenityElement) {
                                                    // Check if not already selected to avoid double-toggling
                                                    if (amenityElement.style.borderWidth !== '2px') {
                                                        amenityElement.click();
                                                    }
                                                }
                                            });
                                        }, 100);
                                        break;
                                    case 'dock':
                                        await initializeDockStep();
                                        // Restore dock selections
                                        const dockRadios = document.querySelectorAll('[name="dockOption"]');
                                        dockRadios.forEach(radio => {
                                            if ((radio.value === 'yes' && listingData.dock.hasPrivateDock) ||
                                                (radio.value === 'no' && !listingData.dock.hasPrivateDock)) {
                                                radio.checked = true;
                                            }
                                        });
                                        break;
                                    case 'photos':
                                        await initializePhotosStep();
                                        // Restore uploaded photos
                                        const photoContainer = document.querySelector('[data-element="photos_container"]');
                                        if (photoContainer && listingData.photos.length) {
                                            listingData.photos.forEach(photo => {
                                                // Create and append photo preview elements
                                                const photoPreview = createPhotoPreview(photo.url);
                                                photoContainer.appendChild(photoPreview);
                                            });
                                        }
                                        break;
                                    case 'coverPhotos':
                                        await initializeCoverPhotosStep();
                                        break;
                                    case 'dockPhotos':
                                        if (listingData.dock.hasPrivateDock) {
                                            await initializeDockPhotosStep();
                                        }
                                        break;
                                    case 'title':
                                        console.log("Leah gets here title step is ab to be rendered")
                                        await initializeTitleStep();
                                        console.log("leah after title step is rendered")
                                        break;
                                    case 'description':
                                        console.log("Leah gets here description step is ab to be rendered")
                                        await initializeDescriptionStep();
                                        console.log("Leah gets here description step was rendered")
                                        const descriptionInput = document.querySelector('[data-element="description_input"]');
                                        if (descriptionInput) descriptionInput.value = listingData.description;
                                        break;
                                    case 'pricing':
                                        await initializePricingStep();
                                        const priceInput = document.querySelector('[data-element="pricing_input"]');
                                        if (priceInput) priceInput.value = listingData.price;
                                        break;
                                    case 'cleaningFee':
                                        await initializeCleaningFeeStep();
                                        const cleaningFeeInput = document.querySelector('[data-element="cleaningFee_input"]');
                                        if (cleaningFeeInput) cleaningFeeInput.value = listingData.cleaningFee;
                                        break;
                                    case 'minNights':
                                        await initializeMinNightsStep();
                                        const minNightsInput = document.querySelector('[data-element="minNights_input"]');
                                        if (minNightsInput) minNightsInput.value = listingData.minNights;
                                        break;
                                    case 'rules':
                                        await initializeRulesStep();

                                        // Restore check-in/check-out times
                                        const checkInInput = document.querySelector('[data-element="checkInInput"]');
                                        const checkOutInput = document.querySelector('[data-element="checkOutInput"]');

                                        if (checkInInput && listingData.checkIn) {
                                            checkInInput.value = listingData.checkIn.time;
                                            checkInInput.setAttribute('value', listingData.checkIn.time);

                                            // Set AM/PM for check-in
                                            const checkInAMButton = document.querySelector('[data-element="checkInAM_button"]');
                                            const checkInPMButton = document.querySelector('[data-element="checkInPM_button"]');
                                            if (listingData.checkIn.period === 'AM') {
                                                checkInAMButton.style.border = '2px solid black';
                                                checkInPMButton.style.border = '1px solid #e2e2e2';
                                            } else {
                                                checkInPMButton.style.border = '2px solid black';
                                                checkInAMButton.style.border = '1px solid #e2e2e2';
                                            }
                                        }

                                        if (checkOutInput && listingData.checkOut) {
                                            checkOutInput.value = listingData.checkOut.time;
                                            checkOutInput.setAttribute('value', listingData.checkOut.time);

                                            // Set AM/PM for check-out
                                            const checkOutAMButton = document.querySelector('[data-element="checkOutAM_button"]');
                                            const checkOutPMButton = document.querySelector('[data-element="checkOutPM_button"]');
                                            if (listingData.checkOut.period === 'AM') {
                                                checkOutAMButton.style.border = '2px solid black';
                                                checkOutPMButton.style.border = '1px solid #e2e2e2';
                                            } else {
                                                checkOutPMButton.style.border = '2px solid black';
                                                checkOutAMButton.style.border = '1px solid #e2e2e2';
                                            }
                                        }

                                        // Restore check-in method
                                        if (listingData.checkIn.method) {
                                            const methodButton = document.querySelector(`[data-element="checkInMethod_${listingData.checkIn.method.type}"]`);
                                            if (methodButton) {
                                                methodButton.style.outline = '2px solid black';
                                                methodButton.style.outlineOffset = '-1px';
                                            }
                                        }

                                        // Restore during stay rules
                                        const guestMaxButton = document.querySelector('[data-element="duringVisit_guestMax"]');
                                        if (guestMaxButton) {
                                            guestMaxButton.textContent = `${listingData.basics.guests} guests maximum`;
                                            guestMaxButton.style.outline = '2px solid black';
                                            guestMaxButton.style.outlineOffset = '-1px';
                                        }

                                        listingData.duringStayRules.forEach(rule => {
                                            if (rule.type !== 'guestMax') {
                                                const ruleButton = document.querySelector(`[data-element="duringVisit_${rule.type}"]`);
                                                if (ruleButton) {
                                                    ruleButton.style.outline = '2px solid black';
                                                    ruleButton.style.outlineOffset = '-1px';
                                                }
                                            }
                                        });

                                        // Restore before departure rules
                                        listingData.beforeDepartureRules.forEach(rule => {
                                            const ruleButton = document.querySelector(`[data-element="beforeDeparture_${rule.type}"]`);
                                            if (ruleButton) {
                                                ruleButton.style.outline = '2px solid black';
                                                ruleButton.style.outlineOffset = '-1px';
                                            }
                                        });
                                        break;
                                    case 'safety':
                                        await initializeSafetyStep();
                                        // initializeSafetyStep already restores selected features based on listingData
                                        break;
                                    case 'cancellationPolicy':
                                        await initializeCancellationPolicyStep();
                                        // initializeCancellationPolicyStep already restores selected policy based on listingData
                                        break;
                                }
                            }

                            // Navigate to the next incomplete step
                            goToStep(stepIndex + 1);
                        }
                    });

                    listingContainer.appendChild(newBlock);
                });

                // Add click handler for new listing block
                if (addListingBlock) {
                    addListingBlock.addEventListener('click', () => {
                        goToStep(steps.indexOf('get-started') + 1);
                    });
                }

                showStep('manageAddHome');



                // Hide next step button when on manageAddHome step
                const nextStepButton = document.getElementById('nextStep');
                if (nextStepButton) {
                    nextStepButton.style.display = 'none';
                }

            } else {
                // Go directly to get-started step if no unfinished listings
                const hash = window.location.hash.substring(1);
                const initialStepId = hash || 'get-started';
                const initialStepNumber = steps.indexOf(initialStepId) !== -1 ? steps.indexOf(initialStepId) + 1 : 1;
                goToStep(initialStepNumber);
            }
        } catch (error) {
            console.error('Error checking unfinished listings:', error);
            window.location.href = '/host/dashboard';
        }
    }));
});


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
        if (photoContainerParent) {
            photoContainerParent.style.display = 'grid';
            // Clear existing photos first
            const existingPhotos = document.querySelectorAll('[data-element="photo_container_parent"]');
            existingPhotos.forEach((container, index) => {
                if (index > 0) { // Keep the first container
                    container.remove();
                }
            });

            // Update first photo container
            const firstPhotoContainer = photoContainerParent.querySelector('[data-element="photo_container"]');
            if (firstPhotoContainer) {
                firstPhotoContainer.src = listingData.photos[0].url || listingData.photos[0].dataUrl;
                setupPhotoAddedDeleteButton(photoContainerParent, 0); // Add delete button to first photo
            }

            // Add remaining photos
            for (let i = 1; i < listingData.photos.length; i++) {
                const newParent = photoContainerParent.cloneNode(true);
                const newImg = newParent.querySelector('[data-element="photo_container"]');
                if (newImg) {
                    newImg.src = listingData.photos[i].url || listingData.photos[i].dataUrl;
                    setupPhotoAddedDeleteButton(newParent, i); // Add delete button to each photo
                }
                photoContainerParent.parentNode.appendChild(newParent);
            }
        }
    } else {
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
                fileInput.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
                fileInput.addEventListener('change', handlePhotoSelection);
                fileInput.click();
            });
        }
    };

    setupPhotoButton(addPhotosButton);
    setupPhotoButton(addPhotosButton2);
}

// Function to handle photo selection
function handlePhotoSelection(event) {
    const files = event.target.files;
    const addPhotosContainer = document.getElementById('addPhotosButton_Container');
    const addPhotosButton2 = document.getElementById('addPhotosButton2');
    const imageSkeletonLoader = document.querySelector('[data-element="addPhotos_imageSkeletonLoader"]');

    if (!files.length) return;

    // Hide the add photos button container once photos are selected
    if (addPhotosContainer) {
        addPhotosContainer.style.display = 'none';
    }

    // Show the second add photos button
    if (addPhotosButton2) {
        addPhotosButton2.style.display = 'flex';
    }

    // Show loader while photos are being processed
    if (imageSkeletonLoader) {
        imageSkeletonLoader.style.display = 'block';
    }

    let filesProcessed = 0;
    const totalFiles = Array.from(files).filter(file =>
        ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)
    ).length;

    // Process each selected file
    Array.from(files).forEach(file => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            filesProcessed++;
            return;
        }

        const reader = new FileReader();

        reader.onloadstart = function () {
            // File reading has started
            console.log(`Started loading file: ${file.name}`);
        };

        reader.onprogress = function (e) {
            // File reading in progress
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                console.log(`Loading file ${file.name}: ${percentLoaded}%`);
            }
        };

        reader.onload = function (e) {
            // Extract file extension from file type
            const fileExtension = file.type.split('/')[1];

            // Create object URL for the file
            const url = URL.createObjectURL(file);

            // Store photo data
            listingData.photos.push({
                dataUrl: e.target.result,
                url: url,
                fileExtension: fileExtension,
                isCoverPhoto: false,
                coverPhotoOrder: null,
                isDockPhoto: false
            });

            filesProcessed++;

            // Check if all files have been processed
            if (filesProcessed === totalFiles) {
                // Hide loader when all files are processed
                if (imageSkeletonLoader) {
                    imageSkeletonLoader.style.display = 'none';
                }

                // Render all photos after adding new ones
                renderPhotos();

                // Check photo count and update error message if needed
                if (hasAttemptedToLeave.photos) {
                    validatePhotos();
                }
            }
        };

        reader.onerror = function () {
            console.error(`Error loading file: ${file.name}`);
            filesProcessed++;

            // Check if all files have been processed even if there was an error
            if (filesProcessed === totalFiles && imageSkeletonLoader) {
                imageSkeletonLoader.style.display = 'none';
            }
        };

        reader.readAsDataURL(file);
    });

    // Clear the file input value to prevent auto-reopening
    event.target.value = '';
}

// Function to setup delete button for a photo
function setupPhotoAddedDeleteButton(containerParent, photoIndex) {
    const deleteButton = containerParent.querySelector('[data-element="deletePhotoAdded"]');
    if (!deleteButton) return;

    deleteButton.style.cursor = 'pointer';

    // Remove any existing click handlers
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

    newDeleteButton.onclick = (e) => {
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

// Function to render all photos
function renderPhotos() {
    const photoContainerParent = document.querySelector('[data-element="photo_container_parent"]');
    if (!photoContainerParent) return;

    // Only show photo container when we have photos
    photoContainerParent.style.display = listingData.photos.length ? 'grid' : 'none';

    // Log photos array
    console.log('Current photos:', listingData.photos);

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
                firstImg.src = photo.url || photo.dataUrl;
                setupPhotoAddedDeleteButton(photoContainerParent, 0);
            }
        } else {
            const newParent = photoContainerParent.cloneNode(true);
            const newImg = newParent.querySelector('[data-element="photo_container"]');
            if (newImg) {
                newImg.src = photo.url || photo.dataUrl;
                setupPhotoAddedDeleteButton(newParent, idx);
            }
            photoContainerParent.parentNode.appendChild(newParent);
        }
    });
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

// Function to initialize cover photos section
function initializeCoverPhotosStep() {
    console.log(listingData.photos);
    let coverPhotosContainer = document.querySelector('[data-element="coverPhotos_photoContainer"]');
    const coverPhotosError = document.getElementById('coverPhotos-error');
    const coverPhotosSubText = document.getElementById('coverPhotos-subText');

    if (!coverPhotosContainer) {
        return;
    }

    // Remove any existing photo containers first
    const existingContainers = document.querySelectorAll('[data-element="coverPhotos_photoContainer"]');
    existingContainers.forEach((container, index) => {
        if (index > 0) { // Keep the first container
            container.remove();
        }
    });

    // Create a fresh container to replace the original one
    const newContainer = document.createElement('div');
    newContainer.setAttribute('data-element', 'coverPhotos_photoContainer');
    // Copy any existing styles or attributes from the original container
    newContainer.className = coverPhotosContainer.className;
    coverPhotosContainer.parentNode.replaceChild(newContainer, coverPhotosContainer);
    coverPhotosContainer = newContainer;

    // Create a reusable function to set up a photo container
    const setupPhotoContainer = (container, photo, photoIndex) => {
        const photoImage = document.createElement('img');
        photoImage.setAttribute('data-element', 'coverPhotos_image');
        photoImage.style.borderRadius = '5px';
        container.appendChild(photoImage);

        // Create number element with all styles applied directly
        const numberEl = document.createElement('div');
        numberEl.setAttribute('data-element', 'coverPhotos_number');
        numberEl.className = 'coverPhotos_number';
        numberEl.style.display = 'none';
        numberEl.style.position = 'absolute';
        numberEl.style.top = '8px';
        numberEl.style.right = '8px';
        numberEl.style.width = '30px';
        numberEl.style.height = '30px';
        numberEl.style.borderRadius = '100%';
        numberEl.style.backgroundColor = 'white';
        numberEl.style.border = '2px solid black';
        numberEl.style.alignItems = 'center';
        numberEl.style.justifyContent = 'center';
        numberEl.style.fontSize = '15px';
        numberEl.style.fontWeight = 'bold';
        numberEl.style.color = 'black';
        numberEl.style.fontFamily = 'Tt Fors, sans-serif';
        numberEl.style.transition = 'all 0.3s ease';
        numberEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        container.appendChild(numberEl);

        const photoUrl = photo.dataUrl;

        if (!photoUrl.startsWith('data:')) {
            const timestamp = new Date().getTime();
            photoImage.src = photoUrl + '?' + timestamp;
        } else {
            photoImage.src = photoUrl;
        }

        photoImage.style.display = 'block';
        photoImage.style.visibility = 'visible';
        photoImage.style.opacity = '1';

        photoImage.addEventListener('load', () => { });
        photoImage.addEventListener('error', () => { });

        // Make container clickable
        container.style.cursor = 'pointer';
        container.style.position = 'relative';

        // Function to update all number colors based on total selected
        const updateNumberColors = () => {
            const selectedCoverPhotos = listingData.photos.filter(p => p.isCoverPhoto).length;
            const allNumberElements = document.querySelectorAll('[data-element="coverPhotos_number"]');
            allNumberElements.forEach(el => {
                if (el.style.display === 'flex') {
                    el.style.backgroundColor = selectedCoverPhotos === 5 ? '#90EE90' : 'white';
                }
            });
        };

        // Add click handler for photo selection
        container.addEventListener('click', () => {
            const numberEl = container.querySelector('[data-element="coverPhotos_number"]');

            // If already selected, remove from selection
            if (numberEl.style.display === 'flex') {
                const currentOrder = listingData.photos[photoIndex].coverPhotoOrder;
                numberEl.style.display = 'none';
                numberEl.textContent = '';

                // Remove cover photo properties from the photo in listingData
                delete listingData.photos[photoIndex].isCoverPhoto;
                delete listingData.photos[photoIndex].coverPhotoOrder;

                // Update order numbers for remaining photos
                listingData.photos.forEach(p => {
                    if (p.isCoverPhoto && p.coverPhotoOrder > currentOrder) {
                        p.coverPhotoOrder--;
                    }
                });

                // Update displayed numbers
                document.querySelectorAll('[data-element="coverPhotos_number"]').forEach(el => {
                    if (el.style.display === 'flex') {
                        const num = parseInt(el.textContent);
                        if (num > currentOrder) {
                            el.textContent = (num - 1).toString();
                        }
                    }
                });

                // Reset container border styles when unselected
                container.style.outline = 'none';
                container.style.border = '1px solid #e2e2e2';

                // Update colors for all numbers
                updateNumberColors();
            }
            // Add to selection if less than 5 photos are selected
            else if (listingData.photos.filter(p => p.isCoverPhoto).length < 5) {
                const order = listingData.photos.filter(p => p.isCoverPhoto).length + 1;
                numberEl.style.display = 'flex';
                numberEl.textContent = order.toString();
                container.style.outline = '2px solid black';
                container.style.outlineOffset = '-1px';
                container.style.border = 'none';

                // Add cover photo properties to the photo in listingData
                listingData.photos[photoIndex].isCoverPhoto = true;
                listingData.photos[photoIndex].coverPhotoOrder = order;

                // Update colors for all numbers
                updateNumberColors();
            }
        });

        // Check if this photo is already a cover photo and restore its state
        if (listingData.photos[photoIndex].isCoverPhoto) {
            numberEl.style.display = 'flex';
            numberEl.textContent = listingData.photos[photoIndex].coverPhotoOrder.toString();
            container.style.outline = '2px solid black';
            container.style.outlineOffset = '-1px';
            container.style.border = 'none';
            numberEl.style.backgroundColor = listingData.photos.filter(p => p.isCoverPhoto).length === 5 ? '#90EE90' : 'white';
        }
    };

    // Check if we have any photos with coverPhotoOrder
    const hasCoverPhotos = listingData.photos.some(photo => photo.coverPhotoOrder);

    let photosToDisplay = listingData.photos;
    if (hasCoverPhotos) {
        // Sort photos by coverPhotoOrder, with non-cover photos at the end
        photosToDisplay = [...listingData.photos].sort((a, b) => {
            if (!a.coverPhotoOrder && !b.coverPhotoOrder) return 0;
            if (!a.coverPhotoOrder) return 1;
            if (!b.coverPhotoOrder) return -1;
            return a.coverPhotoOrder - b.coverPhotoOrder;
        });
    }

    // Display photos
    photosToDisplay.forEach((photo, index) => {
        let currentContainer;
        if (index === 0) {
            currentContainer = coverPhotosContainer;
        } else {
            currentContainer = coverPhotosContainer.cloneNode(true);
            currentContainer.innerHTML = '';
            coverPhotosContainer.parentNode.appendChild(currentContainer);
        }

        // Find original index in listingData.photos to maintain correct reference
        const originalIndex = listingData.photos.indexOf(photo);
        setupPhotoContainer(currentContainer, photo, originalIndex);
    });

    // Hide error initially 
    if (coverPhotosError) {
        coverPhotosError.style.display = 'none';
    }
    if (coverPhotosSubText) {
        coverPhotosSubText.style.display = 'block';
    }
}

// Function to initialize dock photos section
function initializeDockPhotosStep() {
    // Skip this step if no private dock
    if (!listingData.dock.hasPrivateDock) {
        const titleStepIndex = steps.indexOf('title');
        if (titleStepIndex !== -1) {
            goToStep(titleStepIndex + 1);
        }
        return;
    }

    let dockPhotosContainer = document.querySelector('[data-element="dockPhotos_photoContainer"]');
    const dockPhotosError = document.getElementById('dockPhotos-error');
    const dockPhotosSubText = document.getElementById('dockPhotos-subText');

    if (!dockPhotosContainer) {
        return;
    }

    // Remove any existing photo containers first
    const existingContainers = document.querySelectorAll('[data-element="dockPhotos_photoContainer"]');
    existingContainers.forEach((container, index) => {
        if (index > 0) { // Keep the first container
            container.remove();
        }
    });

    // Create a fresh container to replace the original one
    const newContainer = document.createElement('div');
    newContainer.setAttribute('data-element', 'dockPhotos_photoContainer');
    // Copy any existing styles or attributes from the original container
    newContainer.className = dockPhotosContainer.className;
    dockPhotosContainer.parentNode.replaceChild(newContainer, dockPhotosContainer);
    dockPhotosContainer = newContainer;

    // Create a reusable function to set up a photo container
    const setupPhotoContainer = (container, photo, photoIndex) => {
        const photoImage = document.createElement('img');
        photoImage.setAttribute('data-element', 'dockPhotos_image');
        photoImage.style.borderRadius = '5px';
        container.appendChild(photoImage);

        // Create number element with all styles applied directly
        const numberEl = document.createElement('div');
        numberEl.setAttribute('data-element', 'dockPhotos_number');
        numberEl.className = 'dockPhotos_number';
        numberEl.style.display = 'none';
        numberEl.style.position = 'absolute';
        numberEl.style.top = '8px';
        numberEl.style.right = '8px';
        numberEl.style.width = '30px';
        numberEl.style.height = '30px';
        numberEl.style.borderRadius = '100%';
        numberEl.style.backgroundColor = 'white';
        numberEl.style.border = '2px solid black';
        numberEl.style.alignItems = 'center';
        numberEl.style.justifyContent = 'center';
        numberEl.style.fontSize = '15px';
        numberEl.style.fontWeight = 'bold';
        numberEl.style.color = 'black';
        numberEl.style.fontFamily = 'Tt Fors, sans-serif';
        numberEl.style.transition = 'all 0.3s ease';
        numberEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        container.appendChild(numberEl);

        // Set photo source
        photoImage.src = photo.dataUrl;

        // Make container clickable
        container.style.cursor = 'pointer';
        container.style.position = 'relative';

        // Function to update all number colors based on total selected
        const updateNumberColors = () => {
            const selectedDockPhotos = listingData.photos.filter(p => p.isDockPhoto).length;
            const allNumberElements = document.querySelectorAll('[data-element="dockPhotos_number"]');
            allNumberElements.forEach(el => {
                if (el.style.display === 'flex') {
                    el.style.backgroundColor = selectedDockPhotos === 2 ? '#90EE90' : 'white';
                }
            });
        };

        // Add click handler
        container.addEventListener('click', () => {
            const numberEl = container.querySelector('[data-element="dockPhotos_number"]');

            // If already selected, remove from selection
            if (numberEl.style.display === 'flex') {
                numberEl.style.display = 'none';
                numberEl.textContent = '';

                // Remove dock photo properties
                delete listingData.photos[photoIndex].isDockPhoto;
                delete listingData.photos[photoIndex].in_dock_section_order;

                // Update displayed numbers and orders
                const selectedPhotos = listingData.photos.filter(p => p.isDockPhoto);
                selectedPhotos.forEach((photo, idx) => {
                    photo.in_dock_section_order = idx + 1;
                    const selectedContainer = document.querySelector(`[data-element="dockPhotos_number"][style*="display: flex"]:nth-of-type(${idx + 1})`);
                    if (selectedContainer) {
                        selectedContainer.textContent = (idx + 1).toString();
                    }
                });

                // Reset container border styles
                container.style.outline = 'none';
                container.style.border = '1px solid #e2e2e2';

                // Update colors for all numbers
                updateNumberColors();
            }
            // Add to selection if less than 2 photos selected
            else if (listingData.photos.filter(p => p.isDockPhoto).length < 2) {
                const selectedCount = listingData.photos.filter(p => p.isDockPhoto).length + 1;
                numberEl.style.display = 'flex';
                numberEl.textContent = selectedCount.toString();
                container.style.outline = '2px solid black';
                container.style.outlineOffset = '-1px';
                container.style.border = 'none';

                // Add dock photo properties
                listingData.photos[photoIndex].isDockPhoto = true;
                listingData.photos[photoIndex].in_dock_section_order = selectedCount;

                // Update colors for all numbers
                updateNumberColors();
            }
        });

        // Check if this photo is already a dock photo and restore its state
        if (listingData.photos[photoIndex].isDockPhoto) {
            numberEl.style.display = 'flex';
            numberEl.textContent = listingData.photos[photoIndex].in_dock_section_order.toString();
            container.style.outline = '2px solid black';
            container.style.outlineOffset = '-1px';
            container.style.border = 'none';
            numberEl.style.backgroundColor = listingData.photos.filter(p => p.isDockPhoto).length === 2 ? '#90EE90' : 'white';
        }
    };

    // Display all photos
    listingData.photos.forEach((photo, index) => {
        let currentContainer;
        if (index === 0) {
            currentContainer = dockPhotosContainer;
        } else {
            currentContainer = dockPhotosContainer.cloneNode(true);
            currentContainer.innerHTML = '';
            dockPhotosContainer.parentNode.appendChild(currentContainer);
        }

        setupPhotoContainer(currentContainer, photo, index);
    });

    // Hide error initially 
    if (dockPhotosError) {
        dockPhotosError.style.display = 'none';
    }
    if (dockPhotosSubText) {
        dockPhotosSubText.style.display = 'block';
    }
}

// Function to validate dock photos selection
function validateDockPhotos() {
    const dockPhotosError = document.getElementById('dockPhotos-error');
    const dockPhotosSubText = document.getElementById('dockPhotos-subText');

    // Skip validation if dock photos not required
    if (!listingData.dock.hasPrivateDock) {
        return true;
    }

    // Only validate if user has attempted to leave
    if (!hasAttemptedToLeave.dockPhotos) {
        return true;
    }

    // Count photos marked as dock photos
    const dockPhotoCount = listingData.photos.filter(photo => photo.isDockPhoto).length;

    // Hide error and show subtext if 2 photos selected
    if (dockPhotoCount === 2) {
        if (dockPhotosError) {
            dockPhotosError.style.display = 'none';
        }
        if (dockPhotosSubText) {
            dockPhotosSubText.style.display = 'block';
        }
        return true;
    }

    // Show error and hide subtext if less than 2 photos
    if (dockPhotosError) {
        const remainingPhotos = 2 - dockPhotoCount;
        const photoText = remainingPhotos === 1 ? 'photo' : 'photos';
        dockPhotosError.textContent = `Please select ${remainingPhotos} more ${photoText} to continue`;
        dockPhotosError.style.display = 'block';
        if (dockPhotosSubText) {
            dockPhotosSubText.style.display = 'none';
        }
    }
    return false;
}

// Function to validate cover photos selection
function validateCoverPhotos() {
    const coverPhotosError = document.getElementById('coverPhotos-error');
    const coverPhotosSubText = document.getElementById('coverPhotos-subText');

    // Only validate if user has attempted to leave
    if (!hasAttemptedToLeave.coverPhotos) {
        return true;
    }

    // Count photos marked as cover photos with valid order 1-5
    const coverPhotoCount = listingData.photos.filter(photo =>
        photo.isCoverPhoto &&
        photo.coverPhotoOrder >= 1 &&
        photo.coverPhotoOrder <= 5
    ).length;

    // Hide error and show subtext if 5 cover photos selected
    if (coverPhotoCount === 5) {
        if (coverPhotosError) {
            coverPhotosError.style.display = 'none';
        }
        if (coverPhotosSubText) {
            coverPhotosSubText.style.display = 'block';
        }
        return true;
    }

    // Show error and hide subtext if less than 5 cover photos
    if (coverPhotosError) {
        const remainingPhotos = 5 - coverPhotoCount;
        const photoText = remainingPhotos === 1 ? 'photo' : 'photos';
        coverPhotosError.textContent = `Please select ${remainingPhotos} more ${photoText} to continue`;
        coverPhotosError.style.display = 'block';
        if (coverPhotosSubText) {
            coverPhotosSubText.style.display = 'none';
        }
    }
    return false;
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

// Initial step on page load
document.addEventListener('DOMContentLoaded', () => {
    //console.log("Page loaded, initializing steps");

    // Hide the error elements initially
    const basicsError = document.getElementById('basics-error');
    const locationError = document.getElementById('location-error');
    const locationSubText = document.getElementById('location-subText');
    const confirmLocationError = document.getElementById('confirmLocation-error');
    const amenitiesError = document.getElementById('amenities-error');
    const dockError = document.getElementById('dock-error');
    const coverPhotosError = document.getElementById('coverPhotos-error');
    const dockPhotosError = document.getElementById('dockPhotos-error');
    const pricingError = document.getElementById('pricing-error');
    const cleaningFeeError = document.getElementById('cleaningFee-error');
    const minNightsError = document.getElementById('minNights-error');
    const rulesError = document.getElementById('rules-error');
    const safetyError = document.getElementById('safety-error');
    const cancellationPolicyError = document.getElementById('cancellationPolicy-error');

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
    if (dockError) {
        dockError.style.display = 'none';
    }
    if (coverPhotosError) {
        coverPhotosError.style.display = 'none';
    }
    if (dockPhotosError) {
        dockPhotosError.style.display = 'none';
    }
    if (pricingError) {
        pricingError.style.display = 'none';
    }
    if (cleaningFeeError) {
        cleaningFeeError.style.display = 'none';
    }
    if (minNightsError) {
        minNightsError.style.display = 'none';
    }
    if (rulesError) {
        rulesError.style.display = 'none';
    }
    if (safetyError) {
        safetyError.style.display = 'none';
    }
    if (cancellationPolicyError) {
        cancellationPolicyError.style.display = 'none';
    }
});

// Array defining the ordered steps by their element IDs
const steps = ["get-started", "basics", "location", "confirmLocation", "amenities", "dock", "photos", "coverPhotos", "dockPhotos", "title", "description", "pricing", "cleaningFee", "minNights", "rules", "safety", "cancellationPolicy", "reviewInfo"];
// Variable to track the current step
let currentStepNumber = 1;

// Object to track if the user has attempted to leave each section
let hasAttemptedToLeave = {
    basics: false,
    location: false,
    confirmLocation: false,
    amenities: false,
    dock: false,
    photos: false,
    coverPhotos: false,
    dockPhotos: false,
    title: false,
    description: false,
    pricing: false,
    cleaningFee: false,
    minNights: false,
    rules: false,
    safety: false,
    cancellationPolicy: false
};

function shouldValidateStep(stepId) {
    // Add logic here to determine which steps need validation
    return stepId === 'basics' || stepId === 'location' || stepId === 'confirmLocation' || stepId === 'amenities' || stepId === 'dock' || stepId === 'photos' || stepId === 'coverPhotos' || stepId === 'dockPhotos' || stepId === 'title' || stepId === 'description' || stepId === 'pricing' || stepId === 'cleaningFee' || stepId === 'minNights' || stepId === 'rules' || stepId === 'safety' || stepId === 'cancellationPolicy';
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
        case 'dock':
            return Promise.resolve(validateDock());
        case 'photos':
            return Promise.resolve(validatePhotos());
        case 'coverPhotos':
            return Promise.resolve(validateCoverPhotos());
        case 'dockPhotos':
            return Promise.resolve(validateDockPhotos());
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
        case 'rules':
            return Promise.resolve(validateRules());
        case 'safety':
            return Promise.resolve(validateSafety());
        case 'cancellationPolicy':
            return Promise.resolve(validateCancellationPolicy());
        default:
            return Promise.resolve(true);
    }
}

// Track last click time for throttling
let lastClickTime = 0;
const CLICK_DELAY = 1000; // 1 second delay between clicks

// Handle next button click
document.getElementById('nextStep').addEventListener('click', function () {
    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) {
        return; // Exit if clicked too soon
    }
    lastClickTime = now;

    const currentStepId = steps[currentStepNumber - 1];

    // Set hasAttemptedToLeave to true for the current step when trying to move forward
    if (shouldValidateStep(currentStepId)) {
        hasAttemptedToLeave[currentStepId] = true;
    }

    // Proceed to the next step if valid
    if (currentStepNumber < steps.length) {
        goToStep(currentStepNumber + 1, 'forward');
    }
});

// Handle previous button click 
document.getElementById('prevStep').addEventListener('click', function () {
    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) {
        return; // Exit if clicked too soon
    }
    lastClickTime = now;

    console.log(`Previous step clicked: Current step ${currentStepNumber}`);

    // Go to the previous step if not the first step
    if (currentStepNumber > 1) {
        goToStep(currentStepNumber - 1, 'back');
    }
});

// Handle hash change event (when the user manually changes the hash or presses back/forward)
window.addEventListener('hashchange', function () {
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const stepNumber = steps.indexOf(hash) + 1;
    console.log(`Handling hash change, step number: ${stepNumber}`);
    if (stepNumber > 0) {
        goToStep(stepNumber, currentStepNumber < stepNumber ? 'forward' : 'back');
    }
});

// Function to show a specific step and update URL hash
function goToStep(stepNumber, direction = 'forward') {
    //console.log(`Navigating to step ${stepNumber}`);
    console.log(listingData);
    // Ensure stepNumber is within bounds
    if (stepNumber < 1 || stepNumber > steps.length) {
        //console.error(`Invalid step number: ${stepNumber}`);
        return;
    }

    const currentStepId = steps[currentStepNumber - 1];
    let nextStepId = steps[stepNumber - 1];

    // Handle dockPhotos step navigation when no private dock
    if (nextStepId === 'dockPhotos' && !listingData.dock.hasPrivateDock) {
        if (direction === 'forward') {
            nextStepId = 'title';
            stepNumber = steps.indexOf('title') + 1;
        } else {
            nextStepId = 'coverPhotos';
            stepNumber = steps.indexOf('coverPhotos') + 1;
        }
    }

    // Check if current step needs validation before moving on
    if (shouldValidateStep(currentStepId) && direction === 'forward') {
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

        // Update progress bar
        updateProgressBar();

        // Disable or enable buttons based on the current step
        updateButtonStates();
    }
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
        // Pre-fetch amenities for next step
        fetchAndRenderAmenities();
    }

    // Set default address selection when showing confirmLocation step
    if (stepId === "confirmLocation") {
        // selectedAddressType = 'suggested';
        // updateAddressSelection();
    }

    // When showing amenities step, amenities should already be loaded
    if (stepId === "amenities") {
        // Hide amenities error when first showing the step
        const amenitiesError = document.getElementById('amenities-error');
        if (amenitiesError) {
            amenitiesError.style.display = 'none';
        }
    }

    if (stepId === "dock") {
        initializeDockStep();
        // Hide dock error when first showing the step
        const dockError = document.getElementById('dock-error');
        if (dockError) {
            dockError.style.display = 'none';
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

    // Initialize cover photos step when showing cover photos
    if (stepId === "coverPhotos") {
        initializeCoverPhotosStep();
        // Hide cover photos error when first showing the step
        const coverPhotosError = document.getElementById('coverPhotos-error');
        if (coverPhotosError) {
            coverPhotosError.style.display = 'none';
        }
    }

    // Initialize dock photos step when showing dock photos
    if (stepId === "dockPhotos") {
        // Only show and initialize if user has private dock
        if (listingData.dock.hasPrivateDock) {
            initializeDockPhotosStep();
            // Hide dock photos error when first showing the step
            const dockPhotosError = document.getElementById('dockPhotos-error');
            if (dockPhotosError) {
                dockPhotosError.style.display = 'none';
            }
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
        // Hide rules error when first showing the step
        const rulesError = document.getElementById('rules-error');
        if (rulesError) {
            rulesError.style.display = 'none';
        }
    }

    if (stepId === "safety") {
        initializeSafetyStep();
        // Hide safety error when first showing the step
        const safetyError = document.getElementById('safety-error');
        if (safetyError) {
            safetyError.style.display = 'none';
        }
    }

    if (stepId === "cancellationPolicy") {
        initializeCancellationPolicyStep();
        // Hide cancellation policy error when first showing the step
        const cancellationPolicyError = document.getElementById('cancellationPolicy-error');
        if (cancellationPolicyError) {
            cancellationPolicyError.style.display = 'none';
        }
    }

    if (stepId === "reviewInfo") {
        initializeReviewInfoStep();
    }
}

// Function to enable/disable buttons based on the current step
function updateButtonStates() {
    const nextStepText = document.getElementById('nextStepText');
    const prevStepButton = document.getElementById('prevStep');
    const nextStepButton = document.getElementById('nextStep');
    const submitButton = document.getElementById('submitButton');

    // Update the text content based on the current step
    if (nextStepText) {
        if (currentStepNumber === 1) {
            nextStepText.textContent = "Get Started";
        } else {
            nextStepText.textContent = "Next";
        }
    }

    // Handle visibility of the "Previous" button
    if (prevStepButton) {
        if (currentStepNumber === 1) {
            prevStepButton.style.display = "none"; // Hide on the first step
        } else {
            prevStepButton.style.display = "flex"; // Show on other steps
        }
    }

    // Handle visibility of the "Next" and "Submit" buttons
    if (nextStepButton && submitButton) {
        if (steps[currentStepNumber - 1] === "manageAddHome") {
            nextStepButton.style.display = "none";
            submitButton.style.display = "none";
        } else if (steps[currentStepNumber - 1] === "reviewInfo") {
            nextStepButton.style.display = "none";
            submitButton.style.display = "flex";
        } else {
            nextStepButton.style.display = "flex";
            submitButton.style.display = "none";
            nextStepButton.disabled = (currentStepNumber === steps.length);
        }
    }
}

// Function to update progress bar based on current step
function updateProgressBar() {
    const progressBar = document.querySelector('[data-element="progressBar"]');
    if (!progressBar) return;

    // Progress bar should only show from "basics" (step 2) onwards
    const basicsStepIndex = steps.indexOf('basics'); // Index 1 (step 2)
    const reviewInfoStepIndex = steps.indexOf('reviewInfo'); // Index 17 (step 18)

    // Hide progress bar on get-started and manageAddHome steps
    if (currentStepNumber <= basicsStepIndex || steps[currentStepNumber - 1] === 'manageAddHome') {
        progressBar.style.width = '0%';
        return;
    }

    // Calculate progress: from basics to reviewInfo
    // Total progress steps = number of steps from basics to reviewInfo (inclusive)
    const totalProgressSteps = reviewInfoStepIndex - basicsStepIndex + 1;

    // Current progress position (1-indexed from basics)
    // At basics: position = 1, at location: position = 2, etc.
    const currentProgressPosition = (currentStepNumber - 1) - basicsStepIndex + 1;

    // Calculate percentage
    // At basics (step 2): (1 / 17) * 100 = 5.88%
    // At reviewInfo (step 18): (17 / 17) * 100 = 100%
    const progressPercentage = (currentProgressPosition / totalProgressSteps) * 100;

    // Update progress bar width
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.style.transition = 'width 0.3s ease-in-out';
}

// Variable to track selected address type
let selectedAddressType = 'suggested'; // Default to suggested address

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
                    newIcon.loading = 'eager'; // Set eager loading
                }
                if (newText) {
                    newText.textContent = amenity.attribute_name;
                }

                // Add click handler and styling
                template.style.cursor = 'pointer';
                template.dataset.amenityId = amenity.id;
                template.addEventListener('click', () => handleAmenityClick(template, amenity.id));

                // Insert the new element after the last amenity
                amenityElements[0].parentNode.appendChild(template);
            } else {
                // Update existing elements
                if (iconElements[i]) {
                    iconElements[i].src = amenity.attribute_icon.url;
                    iconElements[i].alt = amenity.attribute_name;
                    iconElements[i].loading = 'eager'; // Set eager loading
                }
                if (textElements[i]) {
                    textElements[i].textContent = amenity.attribute_name;
                }

                // Add click handler and styling to existing elements
                amenityElements[i].style.cursor = 'pointer';
                amenityElements[i].dataset.amenityId = amenity.id;
                amenityElements[i].addEventListener('click', () => handleAmenityClick(amenityElements[i], amenity.id));
            }
        });

    } catch (error) {
        console.error('Error fetching amenities:', error);
    }
}

// Function to handle amenity click
function handleAmenityClick(element, amenityId) {
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

    // Revalidate if user has attempted to leave
    if (hasAttemptedToLeave.amenities) {
        validateAmenities();
    }
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

        // Update listingData with all address fields
        listingData.address = {
            addressLine1: addressLine1Input.value.trim(),
            addressLine2: addressCityInput.value.trim() + ', ' + addressStateInput.value.trim() + ' ' + addressZipcodeInput.value.trim(),
            cityState: `${addressCityInput.value.trim()}, ${addressStateInput.value.trim()}`,
            neighborhood: '', // This would need to come from another source
            unit: addressLine2Input.value.trim(), // Add unit from addressLine2
            city: addressCityInput.value.trim(),
            state: addressStateInput.value.trim(),
            zipcode: addressZipcodeInput.value.trim(),
            longitude: '',
            latitude: ''
        };

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

                // Set addressVerified to true since we've validated the address
                listingData.addressVerified = true;

                // Format entered address similar to Google's format
                let enteredAddress = addressLine1Input.value;
                if (addressLine2Input?.value.trim()) {
                    enteredAddress += ` ${addressLine2Input.value}`;
                }
                enteredAddress += `, ${addressCityInput.value}, ${addressStateInput.value} ${addressZipcodeInput.value}`;

                if (confirmSuggestedAddress) {
                    confirmSuggestedAddress.textContent = result.formattedAddress;
                }

                if (confirmEnteredAddress) {
                    confirmEnteredAddress.textContent = enteredAddress;
                }

                // Use previously selected address type if it exists, otherwise default to suggested
                selectedAddressType = listingData.addressChosen || 'suggested';
                listingData.addressChosen = selectedAddressType;
                listingData.addressNotSelected = selectedAddressType === 'suggested' ? enteredAddress : result.formattedAddress;

                // Set initial neighborhood based on coordinates if not already set
                if (!listingData.address.neighborhood && result.latitude && result.longitude) {
                    listingData.address.neighborhood = determineNeighborhood(result.latitude, result.longitude);
                    console.log('Initial neighborhood determined:', listingData.address.neighborhood);
                }

                // Add click handlers for address selection
                if (confirmSuggestedContainer && confirmEnteredContainer) {
                    updateAddressSelection();

                    confirmSuggestedContainer.onclick = () => {
                        selectedAddressType = 'suggested';
                        listingData.addressChosen = 'suggested';
                        // Update listingData with suggested address
                        const addressParts = result.formattedAddress.split(',').map(part => part.trim());

                        // Extract unit number from suggested address if present
                        let addressLine1 = addressParts[0];
                        let unit = '';
                        const unitMatch = addressLine1.match(/(.*?)\s+(#.+)$/);
                        if (unitMatch) {
                            addressLine1 = unitMatch[1];
                            unit = unitMatch[2]; // Keeps the # if present
                        } else {
                            unit = addressLine2Input.value.trim(); // Fallback to entered unit
                        }

                        // Determine neighborhood from coordinates
                        const neighborhood = determineNeighborhood(result.latitude, result.longitude);

                        listingData.address = {
                            addressLine1: addressLine1,
                            addressLine2: addressParts.slice(1).join(',').trim(),
                            cityState: `${addressParts[1]}, ${addressParts[2].split(' ')[0]}`,
                            neighborhood: neighborhood,
                            unit: unit,
                            city: addressParts[1],
                            state: addressParts[2].split(' ')[0],
                            zipcode: addressParts[2].split(' ')[1],
                            longitude: result.longitude || '',
                            latitude: result.latitude || ''
                        };
                        listingData.addressNotSelected = enteredAddress;
                        updateAddressSelection();
                        console.log('Listing data:', listingData);
                        console.log('Determined neighborhood:', neighborhood);
                    };

                    confirmEnteredContainer.onclick = () => {
                        selectedAddressType = 'entered';
                        listingData.addressChosen = 'entered';

                        // Determine neighborhood from coordinates
                        const neighborhood = determineNeighborhood(result.latitude, result.longitude);

                        // Revert to originally entered address but keep coordinates and neighborhood
                        listingData.address = {
                            addressLine1: addressLine1Input.value.trim(),
                            addressLine2: addressCityInput.value.trim() + ', ' + addressStateInput.value.trim() + ' ' + addressZipcodeInput.value.trim(),
                            cityState: `${addressCityInput.value.trim()}, ${addressStateInput.value.trim()}`,
                            neighborhood: neighborhood,
                            unit: addressLine2Input.value.trim(),
                            city: addressCityInput.value.trim(),
                            state: addressStateInput.value.trim(),
                            zipcode: addressZipcodeInput.value.trim(),
                            longitude: result.longitude || '',
                            latitude: result.latitude || ''
                        };
                        listingData.addressNotSelected = result.formattedAddress;
                        updateAddressSelection();
                        console.log('Determined neighborhood:', neighborhood);
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

// Function to determine neighborhood based on precise lat/lon coordinates
function determineNeighborhood(latitude, longitude) {
    // Parse and truncate to 3 decimal places for consistent matching
    const lat = Math.floor(parseFloat(latitude) * 1000) / 1000;
    const lon = Math.floor(Math.abs(parseFloat(longitude)) * 1000) / 1000; // Convert to positive and truncate

    if (!lat || !lon) return '';

    // Upper Keys
    if (lat >= 25.190 && lat <= 25.330 && lon >= 80.280 && lon <= 80.400) return 'North Key Largo';
    if (lat >= 25.030 && lat <= 25.190 && lon >= 80.350 && lon <= 80.530) return 'Key Largo';
    if (lat >= 24.970 && lat <= 25.030 && lon >= 80.480 && lon <= 80.560) return 'Tavernier';
    if (lat >= 24.920 && lat <= 24.970 && lon >= 80.520 && lon <= 80.600) return 'Plantation Key';
    if (lat >= 24.880 && lat <= 24.920 && lon >= 80.600 && lon <= 80.660) return 'Windley Key';
    if (lat >= 24.850 && lat <= 24.880 && lon >= 80.660 && lon <= 80.750) return 'Upper Matecumbe Key';
    if (lat >= 24.800 && lat <= 24.850 && lon >= 80.740 && lon <= 80.820) return 'Lower Matecumbe Key';

    // Middle Keys
    if (lat >= 24.800 && lat <= 24.850 && lon >= 80.820 && lon <= 80.880) return 'Long Key';
    if (lat >= 24.780 && lat <= 24.800 && lon >= 80.870 && lon <= 80.900) return 'Conch Key';
    if (lat >= 24.760 && lat <= 24.780 && lon >= 80.900 && lon <= 80.920) return 'Duck Key';
    if (lat >= 24.730 && lat <= 24.750 && lon >= 81.020 && lon <= 81.030) return 'Coco Plum Beach';
    if (lat >= 24.720 && lat <= 24.730 && lon >= 81.000 && lon <= 81.020) return 'Key Colony Beach';
    if (lat >= 24.685 && lat <= 24.705 && lon >= 81.070 && lon <= 81.095) return 'Sombrero Beach';
    if (lat >= 24.750 && lat <= 24.780 && lon >= 81.030 && lon <= 81.150) return 'Marathon';
    if (lat >= 24.705 && lat <= 24.730 && lon >= 81.020 && lon <= 81.150) return 'Marathon';
    if (lat >= 24.680 && lat <= 24.685 && lon >= 81.070 && lon <= 81.150) return 'Marathon';

    // Lower Keys
    if (lat >= 24.650 && lat <= 24.720 && lon >= 81.300 && lon <= 81.380) return 'Big Pine Key';
    if (lat >= 24.640 && lat <= 24.670 && lon >= 81.370 && lon <= 81.400) return 'Little Torch Key';
    if (lat >= 24.630 && lat <= 24.650 && lon >= 81.400 && lon <= 81.420) return 'Ramrod Key';
    if (lat >= 24.630 && lat <= 24.650 && lon >= 81.420 && lon <= 81.450) return 'Summerland Key';
    if (lat >= 24.640 && lat <= 24.660 && lon >= 81.470 && lon <= 81.490) return 'Cudjoe Key';
    if (lat >= 24.650 && lat <= 24.670 && lon >= 81.500 && lon <= 81.540) return 'Upper Sugarloaf Key';
    if (lat >= 24.630 && lat <= 24.650 && lon >= 81.540 && lon <= 81.570) return 'Lower Sugarloaf Key';
    if (lat >= 24.620 && lat <= 24.640 && lon >= 81.580 && lon <= 81.610) return 'Saddlebunch Keys';
    if (lat >= 24.600 && lat <= 24.620 && lon >= 81.630 && lon <= 81.650) return 'Shark Key';
    if (lat >= 24.590 && lat <= 24.600 && lon >= 81.640 && lon <= 81.660) return 'Big Coppitt Key';
    if (lat >= 24.580 && lat <= 24.590 && lon >= 81.720 && lon <= 81.740) return 'Key Haven';
    if (lat >= 24.560 && lat <= 24.580 && lon >= 81.740 && lon <= 81.750) return 'Stock Island';
    if (lat >= 24.520 && lat <= 24.590 && lon >= 81.760 && lon <= 81.820) return 'Key West';

    // Default fallback
    return 'Florida Keys';
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

        // Extract coordinates from the API response
        const geocode = data.result.geocode;
        const longitude = geocode?.location?.longitude || '';
        const latitude = geocode?.location?.latitude || '';

        // Update listingData with coordinates immediately after receiving them
        if (listingData.address) {
            listingData.address.longitude = longitude;
            listingData.address.latitude = latitude;
        }

        return {
            isValid: true,
            formattedAddress: data.result.address.formattedAddress,
            longitude: longitude,
            latitude: latitude
        };
    } catch (error) {
        console.error('Address validation failed:', error);
        return { isValid: false };
    }
}

// Function to initialize cancellation policy step
function initializeCancellationPolicyStep() {
    const cancellationPolicies = {
        relaxed: document.querySelector('[data-element="cancellationPolicy_relaxed"]'),
        standard: document.querySelector('[data-element="cancellationPolicy_standard"]'),
        firm: document.querySelector('[data-element="cancellationPolicy_firm"]'),
        graceWindow: document.querySelector('[data-element="cancellationPolicy_graceWindow"]'),
        noRefund: document.querySelector('[data-element="cancellationPolicy_noRefund"]')
    };

    const policyValues = {
        relaxed: "Relaxed",
        standard: "Standard",
        firm: "Firm",
        graceWindow: "Grace window",
        noRefund: "No refund"
    };

    const cancellationPolicyError = document.getElementById('cancellationPolicy-error');
    const cancellationPolicySubText = document.getElementById('cancellationPolicy-subText');

    // Hide error message initially
    if (cancellationPolicyError) cancellationPolicyError.style.display = 'none';
    if (cancellationPolicySubText) cancellationPolicySubText.style.display = 'block';

    // Set up click handlers for all policy options
    Object.entries(cancellationPolicies).forEach(([policy, button]) => {
        if (button) {
            button.style.cursor = 'pointer';

            button.addEventListener('click', () => {
                // Clear selection styling from all buttons
                Object.values(cancellationPolicies).forEach(btn => {
                    if (btn) {
                        btn.style.outline = '';
                        btn.style.outlineOffset = '';
                    }
                });

                // Set selected policy
                listingData.cancellationPolicy = policyValues[policy];
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';

                if (hasAttemptedToLeave.cancellationPolicy) {
                    validateCancellationPolicy();
                }
            });

            // Set initial state if policy was previously selected
            if (listingData.cancellationPolicy === policyValues[policy]) {
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }
    });
}

// Function to initialize safety step
function initializeSafetyStep() {
    // Remove any existing event listeners first
    const existingButtons = document.querySelectorAll('[data-element^="safety_"]');
    existingButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });

    const safetyFeatures = {
        securityCamera: document.querySelector('[data-element="safety_securityCamera"]'),
        doorbellCamera: document.querySelector('[data-element="safety_doorbellCamera"]'),
        fireExtinguisher: document.querySelector('[data-element="safety_fireExtinguisher"]'),
        smokeAlarm: document.querySelector('[data-element="safety_smokeAlarm"]'),
        carbonMonoxideAlarm: document.querySelector('[data-element="safety_carbonMonoxideAlarm"]'),
        firstAidKit: document.querySelector('[data-element="safety_firstAidKit"]')
    };

    const safetyError = document.getElementById('safety-error');
    const safetySubText = document.getElementById('safety-subText');

    // Hide error message initially
    if (safetyError) safetyError.style.display = 'none';
    if (safetySubText) safetySubText.style.display = 'block';

    // Initialize safetyFeatures array if undefined
    if (!listingData.safetyFeatures) {
        listingData.safetyFeatures = [];
    }

    // Clean up any duplicate CO alarm entries first
    const hasCarbonMonoxideAlarm = listingData.safetyFeatures.some(f => f.type === 'carbonMonoxideAlarm');
    if (hasCarbonMonoxideAlarm) {
        // Remove any "no alarm" entries if CO alarm is present
        listingData.safetyFeatures = listingData.safetyFeatures.filter(f => f.type !== 'noCarbonMonoxideAlarm');
    }

    // Set up safety features
    Object.entries(safetyFeatures).forEach(([feature, button]) => {
        if (button) {
            // Add button-like styles
            button.style.cursor = 'pointer';
            button.style.userSelect = 'none'; // Prevent text selection
            button.style.WebkitUserSelect = 'none';

            // Add click handlers for all safety features
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any default behavior

                const featureIndex = listingData.safetyFeatures.findIndex(f => f.type === feature);
                if (featureIndex === -1) {
                    // Feature not in array, add it with text from button
                    listingData.safetyFeatures.push({
                        type: feature,
                        text: button.textContent.trim()
                    });

                    // If adding carbonMonoxideAlarm, ensure "no alarm" is removed
                    if (feature === 'carbonMonoxideAlarm') {
                        listingData.safetyFeatures = listingData.safetyFeatures.filter(f => f.type !== 'noCarbonMonoxideAlarm');
                    }

                    button.style.outline = '2px solid black';
                    button.style.outlineOffset = '-1px';
                } else {
                    // Feature in array, remove it
                    listingData.safetyFeatures.splice(featureIndex, 1);

                    button.style.outline = '';
                    button.style.outlineOffset = '';

                    // If removing carbonMonoxideAlarm, add "no alarm" entry
                    if (feature === 'carbonMonoxideAlarm') {
                        listingData.safetyFeatures.push({
                            type: 'noCarbonMonoxideAlarm',
                            text: 'No carbon monoxide alarm'
                        });
                    }
                }

                if (hasAttemptedToLeave.safety) {
                    validateSafety();
                }
            });

            // Set initial state based on existing features
            const existingFeature = listingData.safetyFeatures.find(f => f.type === feature);
            if (existingFeature) {
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }
    });

    // Only add noCarbonMonoxideAlarm if carbonMonoxideAlarm is not present and user has attempted to leave
    if (hasAttemptedToLeave.safety) {
        const currentHasCarbonMonoxideAlarm = listingData.safetyFeatures.some(f => f.type === 'carbonMonoxideAlarm');
        const currentHasNoCarbonMonoxideAlarm = listingData.safetyFeatures.some(f => f.type === 'noCarbonMonoxideAlarm');

        if (!currentHasCarbonMonoxideAlarm && !currentHasNoCarbonMonoxideAlarm) {
            listingData.safetyFeatures.push({
                type: 'noCarbonMonoxideAlarm',
                text: 'No carbon monoxide alarm'
            });
        }
    }
}


// Counter logic for the "basics" step
function initializeCounters() {
    let counters = {
        guests: listingData.basics.guests || 0,
        bedrooms: listingData.basics.bedrooms || 0,
        baths: listingData.basics.baths || 0,
        beds: listingData.basics.beds || 0
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
        const increment = type === 'baths' ? 0.5 : 1;
        counters[type] += increment;
        listingData.basics[type] = counters[type]; // Save to basics object
        updateCounterDisplay(type);
        updateAllButtonStates();
        if (hasAttemptedToLeave.basics) {
            validateBasics();
        }
    }

    function handleDecrement(type) {
        if (counters[type] > 0) {
            const decrement = type === 'baths' ? 0.5 : 1;
            counters[type] -= decrement;
            listingData.basics[type] = counters[type]; // Save to basics object
            updateCounterDisplay(type);
            updateAllButtonStates();
            if (hasAttemptedToLeave.basics) {
                validateBasics();
            }
        }
    }

    function updateCounterDisplay(type) {
        // Format baths to show decimal point only if it's not a whole number
        if (type === 'baths') {
            textFields[type].textContent = counters[type] % 1 === 0 ? counters[type].toFixed(0) : counters[type].toFixed(1);
        } else {
            textFields[type].textContent = counters[type];
        }
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



// Function to initialize dock step
function initializeDockStep() {
    const dockOptions = {
        yes: document.querySelector('[data-element="dock_yes"]'),
        no: document.querySelector('[data-element="dock_no"]')
    };

    const dockInputContainer = document.querySelector('[data-element="dock_input_container"]');
    const dockButtonsContainer = document.querySelector('[data-element="dock_buttons_container"]');
    const dockError = document.getElementById('dock-error');
    const dockSubText = document.getElementById('dock-subText');

    // Get dock input fields
    const boatSizeInput = document.querySelector('[data-element="dock_input_boatSize"]');
    const beamInput = document.querySelector('[data-element="dock_input_beam"]');
    const draftInput = document.querySelector('[data-element="dock_input_draft"]');

    // Get dock button options
    const dockButtonOptions = {
        shorePower: document.querySelector('[data-element="dock_buttons_shorePower"]'),
        freshWater: document.querySelector('[data-element="dock_buttons_freshWater"]'),
        cleaningStation: document.querySelector('[data-element="dock_buttons_cleaningStation"]'),
        dockLight: document.querySelector('[data-element="dock_buttons_dockLight"]'),
        underwaterLight: document.querySelector('[data-element="dock_buttons_underwaterLight"]'),
        iceMaker: document.querySelector('[data-element="dock_buttons_iceMaker"]')
    };

    // Initialize selected buttons array if not exists
    listingData.dock.selectedButtons = listingData.dock.selectedButtons || [];

    // Set up numeric input validation and formatting
    const setupNumericInput = (input, field) => {
        if (input) {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value) {
                    listingData.dock[field] = `${e.target.value} ft`;
                } else {
                    listingData.dock[field] = '';
                }
            });

            // Set initial value from listingData if exists
            if (listingData.dock[field]) {
                input.value = listingData.dock[field].replace(' ft', '');
            }
        }
    };

    setupNumericInput(boatSizeInput, 'boatSize');
    setupNumericInput(beamInput, 'beam');
    setupNumericInput(draftInput, 'draft');

    // Hide error message and containers initially
    if (dockError) dockError.style.display = 'none';
    if (dockSubText) dockSubText.style.display = 'block';
    if (dockInputContainer) dockInputContainer.style.display = 'none';
    if (dockButtonsContainer) dockButtonsContainer.style.display = 'none';

    // Set up click handlers for dock options
    Object.entries(dockOptions).forEach(([option, button]) => {
        if (button) {
            // Remove existing click listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            dockOptions[option] = newButton;

            newButton.addEventListener('click', () => {
                // Reset styles for all buttons
                Object.values(dockOptions).forEach(btn => {
                    if (btn) {
                        btn.classList.remove('selected');
                        btn.style.outline = '';
                        btn.style.outlineOffset = '';
                    }
                });

                // Style selected button
                newButton.classList.add('selected');
                newButton.style.outline = '2px solid #000000';
                newButton.style.outlineOffset = '-1px';

                // Update listingData
                listingData.dock.hasPrivateDock = (option === 'yes');

                // Show/hide containers based on selection
                if (dockInputContainer && dockButtonsContainer) {
                    if (option === 'yes') {
                        dockInputContainer.style.display = 'flex';
                        dockButtonsContainer.style.display = 'flex';

                        setTimeout(() => {
                            dockInputContainer.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }, 100);
                    } else {
                        dockInputContainer.style.display = 'none';
                        dockButtonsContainer.style.display = 'none';
                        // Clear all dock-related data
                        listingData.dock = {
                            hasPrivateDock: false,
                            selectedButtons: [],
                            boatSize: '',
                            beam: '',
                            draft: ''
                        };
                        // Reset all button styles
                        Object.values(dockButtonOptions).forEach(btn => {
                            if (btn) {
                                btn.classList.remove('selected');
                                btn.style.outline = '';
                                btn.style.outlineOffset = '';
                            }
                        });
                    }
                }

                // Validate after selection
                validateDock();
            });
        }
    });

    // Set up click handlers for dock button options
    const buttonLabels = {
        shorePower: "Shore power",
        freshWater: "Fresh water hookup",
        cleaningStation: "Cleaning station",
        dockLight: "Dock light",
        underwaterLight: "Underwater light",
        iceMaker: "Ice maker"
    };

    Object.entries(dockButtonOptions).forEach(([option, button]) => {
        if (button) {
            // Remove existing click listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            dockButtonOptions[option] = newButton;

            newButton.addEventListener('click', () => {
                const isSelected = newButton.classList.contains('selected');

                if (isSelected) {
                    newButton.classList.remove('selected');
                    newButton.style.outline = '';
                    newButton.style.outlineOffset = '';

                    const index = listingData.dock.selectedButtons.indexOf(buttonLabels[option]);
                    if (index > -1) {
                        listingData.dock.selectedButtons.splice(index, 1);
                    }
                } else {
                    newButton.classList.add('selected');
                    newButton.style.outline = '2px solid #000000';
                    newButton.style.outlineOffset = '-1px';

                    listingData.dock.selectedButtons.push(buttonLabels[option]);
                }
            });
        }
    });

    // Initialize state if there's existing data
    if (listingData.dock.hasPrivateDock !== null) {
        const selectedOption = listingData.dock.hasPrivateDock ? 'yes' : 'no';
        const selectedButton = dockOptions[selectedOption];
        if (selectedButton) {
            selectedButton.click();
        }

        // Restore selected dock buttons
        if (listingData.dock.hasPrivateDock) {
            listingData.dock.selectedButtons.forEach(label => {
                const option = Object.keys(buttonLabels).find(key => buttonLabels[key] === label);
                if (option && dockButtonOptions[option]) {
                    dockButtonOptions[option].classList.add('selected');
                    dockButtonOptions[option].style.outline = '2px solid #000000';
                    dockButtonOptions[option].style.outlineOffset = '-1px';
                }
            });
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

    // Always show subtext if error is not visible
    if (titleError && titleSubText) {
        if (titleError.style.display === 'none') {
            titleSubText.style.display = 'block';
        }
    }

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

// Function to initialize rules step
function initializeRulesStep() {
    // Initialize check-in time
    const checkInInput = document.querySelector('[data-element="checkInInput"]');
    const checkInAMButton = document.querySelector('[data-element="checkInAM_button"]');
    const checkInPMButton = document.querySelector('[data-element="checkInPM_button"]');
    const rulesError = document.getElementById('rules-error');
    const rulesSubText = document.getElementById('rules-subText');

    // Initialize check-out time
    const checkOutInput = document.querySelector('[data-element="checkOutInput"]');
    const checkOutAMButton = document.querySelector('[data-element="checkOutAM_button"]');
    const checkOutPMButton = document.querySelector('[data-element="checkOutPM_button"]');

    // Initialize check-in method buttons
    const checkInMethodButtons = {
        keypad: document.querySelector('[data-element="checkInMethod_keypad"]'),
        lockbox: document.querySelector('[data-element="checkInMethod_lockbox"]'),
        inPerson: document.querySelector('[data-element="checkInMethod_inPerson"]'),
        digitalCard: document.querySelector('[data-element="checkInMethod_digitalCard"]')
    };

    // Initialize during visit rules
    const duringVisitRules = {
        guestMax: document.querySelector('[data-element="duringVisit_guestMax"]'),
        noParty: document.querySelector('[data-element="duringVisit_noParty"]'),
        noPet: document.querySelector('[data-element="duringVisit_noPet"]'),
        noSmoking: document.querySelector('[data-element="duringVisit_noSmoking"]')
    };

    // Initialize before departure rules
    const beforeDepartureRules = {
        towels: document.querySelector('[data-element="beforeDeparture_towels"]'),
        trash: document.querySelector('[data-element="beforeDeparture_trash"]'),
        bedsheets: document.querySelector('[data-element="beforeDeparture_bedsheets"]'),
        furniture: document.querySelector('[data-element="beforeDeparture_furniture"]')
    };

    // Hide error message initially
    if (rulesError) rulesError.style.display = 'none';
    if (rulesSubText) rulesSubText.style.display = 'block';

    // Set up check-in method buttons
    Object.entries(checkInMethodButtons).forEach(([method, button]) => {
        if (button) {
            // Add button-like styles
            button.style.cursor = 'pointer';

            button.addEventListener('click', () => {
                // Clear all button styles first
                Object.values(checkInMethodButtons).forEach(btn => {
                    if (btn) {
                        btn.style.outline = '';
                        btn.style.outlineOffset = '';
                    }
                });

                // Set this button's style and update listingData
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';

                listingData.checkIn.method = {
                    type: method,
                    text: button.textContent.trim()
                };

                if (hasAttemptedToLeave.rules) {
                    validateRules();
                }
            });

            // Set initial state if this method is already selected
            if (listingData.checkIn.method && listingData.checkIn.method.type === method) {
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }
    });

    // Initialize during visit rules array if empty
    if (!listingData.duringStayRules.length) {
        // Add required rules by default with their text content
        const guestMaxButton = duringVisitRules.guestMax;
        const noPartyButton = duringVisitRules.noParty;

        // Set guest max text based on listingData.basics.guests
        const guestMaxDisplayText = `${listingData.basics.guests} guests maximum`;
        const guestMaxStoredText = 'guests maximum';

        listingData.duringStayRules = [
            { type: 'guestMax', text: guestMaxStoredText },
            { type: 'noParty', text: noPartyButton ? noPartyButton.textContent.trim() : '' }
        ];

        // Update the guestMax button text content
        if (guestMaxButton) {
            guestMaxButton.textContent = guestMaxDisplayText;
        }
    }

    // Set up during visit rules
    Object.entries(duringVisitRules).forEach(([rule, button]) => {
        if (button) {
            // Remove any existing click event listeners
            button.replaceWith(button.cloneNode(true));
            // Get the fresh reference
            button = document.querySelector(`[data-element="duringVisit_${rule}"]`);

            // Add button-like styles
            button.style.cursor = rule === 'guestMax' || rule === 'noParty' ? 'default' : 'pointer';

            // Set initial state for required rules
            if (rule === 'guestMax' || rule === 'noParty') {
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }

            // Add click handlers for optional rules
            if (rule === 'noPet' || rule === 'noSmoking') {
                button.addEventListener('click', () => {
                    const ruleIndex = listingData.duringStayRules.findIndex(r => r.type === rule);
                    if (ruleIndex === -1) {
                        // Rule not in array, add it with text
                        listingData.duringStayRules.push({
                            type: rule,
                            text: button.textContent.trim()
                        });
                        button.style.outline = '2px solid black';
                        button.style.outlineOffset = '-1px';
                    } else {
                        // Rule in array, remove it
                        listingData.duringStayRules.splice(ruleIndex, 1);
                        button.style.outline = '';
                        button.style.outlineOffset = '';
                    }
                    if (hasAttemptedToLeave.rules) {
                        validateRules();
                    }
                });
            }
        }
    });

    // Set up before departure rules
    Object.entries(beforeDepartureRules).forEach(([rule, button]) => {
        if (button) {
            // Remove any existing click event listeners
            button.replaceWith(button.cloneNode(true));
            // Get the fresh reference
            button = document.querySelector(`[data-element="beforeDeparture_${rule}"]`);

            // Add button-like styles
            button.style.cursor = 'pointer';

            // Add click handlers for all departure rules
            button.addEventListener('click', () => {
                const ruleIndex = listingData.beforeDepartureRules.findIndex(r => r.type === rule);
                if (ruleIndex === -1) {
                    // Rule not in array, add it with text
                    listingData.beforeDepartureRules.push({
                        type: rule,
                        text: button.textContent.trim()
                    });
                    button.style.outline = '2px solid black';
                    button.style.outlineOffset = '-1px';
                } else {
                    // Rule in array, remove it
                    listingData.beforeDepartureRules.splice(ruleIndex, 1);
                    button.style.outline = '';
                    button.style.outlineOffset = '';
                }
                if (hasAttemptedToLeave.rules) {
                    validateRules();
                }
            });

            // Set initial state based on existing rules
            const existingRule = listingData.beforeDepartureRules.find(r => r.type === rule);
            if (existingRule) {
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }
    });

    // Set default check-in time (4 PM)
    if (checkInInput) {
        // Set initial value and update the input element
        checkInInput.value = listingData.checkIn.time;
        checkInInput.setAttribute('value', listingData.checkIn.time);

        // Only allow numbers
        checkInInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            listingData.checkIn.time = parseInt(e.target.value);
            e.target.setAttribute('value', e.target.value);
            if (hasAttemptedToLeave.rules) {
                validateRules();
            }
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
            listingData.checkOut.time = parseInt(e.target.value);
            e.target.setAttribute('value', e.target.value);
            if (hasAttemptedToLeave.rules) {
                validateRules();
            }
        });
    }

    // Set up check-in AM/PM toggle
    if (checkInAMButton && checkInPMButton) {
        const updateCheckInPeriod = (period) => {
            if (period === 'AM') {
                checkInAMButton.style.border = '2px solid black';
                checkInPMButton.style.border = '1px solid #e2e2e2';
                listingData.checkIn.period = 'AM';
            } else {
                checkInPMButton.style.border = '2px solid black';
                checkInAMButton.style.border = '1px solid #e2e2e2';
                listingData.checkIn.period = 'PM';
            }
            if (hasAttemptedToLeave.rules) {
                validateRules();
            }
        };

        // Add button-like styles
        [checkInAMButton, checkInPMButton].forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #e2e2e2';
            btn.style.padding = '8px 16px';
            btn.style.color = '#000000';
            btn.style.backgroundColor = '#ffffff';
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
                checkOutAMButton.style.border = '2px solid black';
                checkOutPMButton.style.border = '1px solid #e2e2e2';
                listingData.checkOut.period = 'AM';
            } else {
                checkOutPMButton.style.border = '2px solid black';
                checkOutAMButton.style.border = '1px solid #e2e2e2';
                listingData.checkOut.period = 'PM';
            }
            if (hasAttemptedToLeave.rules) {
                validateRules();
            }
        };

        // Add button-like styles
        [checkOutAMButton, checkOutPMButton].forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.style.border = '1px solid #e2e2e2';
            btn.style.padding = '8px 16px';
            btn.style.color = '#000000';
            btn.style.backgroundColor = '#ffffff';
        });

        checkOutAMButton.addEventListener('click', () => updateCheckOutPeriod('AM'));
        checkOutPMButton.addEventListener('click', () => updateCheckOutPeriod('PM'));

        // Set default AM for check-out
        updateCheckOutPeriod('AM');
    }
}

function initializeReviewInfoStep() {
    // Set cover photo
    const reviewImage = document.querySelector('[data-element="reviewInfo_image"]');
    const coverPhoto = listingData.photos.find(photo => photo.isCoverPhoto && photo.coverPhotoOrder === 1);
    if (reviewImage && coverPhoto) {
        reviewImage.src = coverPhoto.dataUrl;
    }

    // Set title
    const reviewTitle = document.querySelector('[data-element="reviewInfo_title"]');
    if (reviewTitle) {
        reviewTitle.textContent = listingData.title;
    }

    // Set location
    const reviewLocation = document.querySelector('[data-element="reviewInfo_location"]');
    if (reviewLocation) {
        reviewLocation.textContent = listingData.address.cityState;
    }

    // Calculate dates and total
    const reviewDateTotal = document.querySelector('[data-element="reviewInfo_dateTotal"]');
    if (reviewDateTotal) {
        const startDate = new Date();
        const nights = Math.max(7, listingData.minNights || 7);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + nights);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        const pricePerNight = parseFloat(listingData.price) || 0;
        const cleaningFee = parseFloat(listingData.cleaningFee) || 0;
        const subtotal = (pricePerNight * nights) + cleaningFee;
        const total = subtotal * 1.1;

        reviewDateTotal.textContent = `${formatDate(startDate)} - ${formatDate(endDate)} • $${total.toLocaleString()}`;
    }
}

// Function to validate rules
function validateRules() {
    let errors = [];

    // Check check-in time and period
    if (!listingData.checkIn.time || !listingData.checkIn.period) {
        errors.push({
            type: "check-in time",
            element: document.querySelector('[data-element="checkInInput"]')
        });
    }

    // Check check-out time and period  
    if (!listingData.checkOut.time || !listingData.checkOut.period) {
        errors.push({
            type: "check-out time",
            element: document.querySelector('[data-element="checkOutInput"]')
        });
    }

    // Check check-in method
    if (!listingData.checkIn.method) {
        errors.push({
            type: "check-in method",
            element: document.querySelector('[data-element="checkInMethod_keypad"]')?.parentElement
        });
    }

    // Check required during stay rules (guestMax and noParty)
    const hasRequiredRules = listingData.duringStayRules.some(rule => rule.type === 'guestMax') &&
        listingData.duringStayRules.some(rule => rule.type === 'noParty');
    if (!hasRequiredRules) {
        errors.push({
            type: "required house rules",
            element: document.querySelector('[data-element="duringVisit_guestMax"]')?.parentElement
        });
    }

    const isValid = errors.length === 0;
    const rulesError = document.getElementById('rules-error');
    const rulesSubText = document.getElementById('rules-subText');

    if (!isValid && hasAttemptedToLeave.rules) {
        if (rulesError) {
            rulesError.textContent = `Please set the following: ${errors.map(e => e.type).join(", ")}`;
            rulesError.style.display = 'block';
            rulesSubText.style.display = 'none';

            // Scroll to the first error element after 1 second delay
            if (errors[0].element) {
                setTimeout(() => {
                    errors[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 1000);
            }
        }
    } else {
        if (rulesError && rulesSubText) {
            rulesError.style.display = 'none';
            rulesSubText.style.display = 'block';
        }
    }

    return isValid;
}

function validateConfirmLocation() {
    const confirmLocationError = document.getElementById('confirmLocation-error');

    // Always valid since we have a default selection
    if (confirmLocationError) {
        confirmLocationError.style.display = 'none';
    }
    return true;
}



// Function to validate dock selection
function validateDock() {
    const dockError = document.getElementById('dock-error');
    const dockSubText = document.getElementById('dock-subText');
    const dockInputContainer = document.querySelector('[data-element="dock_input_container"]');

    // Only validate if user has attempted to leave
    if (!hasAttemptedToLeave.dock) {
        return true;
    }

    // Check if dock selection has been made
    if (listingData.dock.hasPrivateDock === null) {
        if (dockError) {
            dockError.textContent = "Please select whether the property has a private dock";
            dockError.style.display = 'block';
            dockSubText.style.display = 'none';
        }
        return false;
    }

    // If "Yes" is selected, validate required inputs
    if (listingData.dock.hasPrivateDock) {
        const requiredInputs = {
            boatSize: document.querySelector('[data-element="dock_input_boatSize"]'),
            beam: document.querySelector('[data-element="dock_input_beam"]'),
            draft: document.querySelector('[data-element="dock_input_draft"]')
        };

        let firstError = null;

        // Add input event listeners to reset border on input
        Object.values(requiredInputs).forEach(input => {
            if (input && !input.hasInputListener) {
                input.addEventListener('input', function () {
                    if (this.value) {
                        this.style.border = '1px solid #e2e2e2';
                    }
                });
                input.hasInputListener = true;
            }
        });

        // Check each required input
        for (const [field, input] of Object.entries(requiredInputs)) {
            if (!input.value) {
                input.style.border = '2px solid red';
                if (!firstError) firstError = input;
            } else {
                input.style.border = '1px solid #e2e2e2'; // Reset to default border when filled
            }
        }

        if (firstError) {
            if (dockError) {
                dockError.textContent = "Please fill in all required dock information";
                dockError.style.display = 'block';
                dockSubText.style.display = 'none';
            }

            // Scroll to first error after a brief delay
            setTimeout(() => {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

            return false;
        }
    }

    if (dockError) {
        dockError.style.display = 'none';
        dockSubText.style.display = 'block';
    }
    return true;
}

// Function to validate cancellation policy selection
function validateCancellationPolicy() {
    const cancellationPolicyError = document.getElementById('cancellationPolicy-error');
    const cancellationPolicySubText = document.getElementById('cancellationPolicy-subText');

    if (!listingData.cancellationPolicy) {
        if (cancellationPolicyError) {
            cancellationPolicyError.textContent = "Please select a cancellation Policy option";
            cancellationPolicyError.style.display = 'block';
            cancellationPolicySubText.style.display = 'none';
        }
        return false;
    }

    if (cancellationPolicyError) {
        cancellationPolicyError.style.display = 'none';
        cancellationPolicySubText.style.display = 'block';
    }
    return true;
}

// Function to validate safety features
function validateSafety() {
    // Safety features are optional, so always valid
    const safetyError = document.getElementById('safety-error');
    const safetySubText = document.getElementById('safety-subText');

    if (safetyError && safetySubText) {
        safetyError.style.display = 'none';
        safetySubText.style.display = 'block';
    }

    return true;
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

        if (listingData.basics[type] === undefined ||
            (type === 'baths' ? listingData.basics[type] < 0.5 : listingData.basics[type] < 1)) {
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

// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);


//copy email and phone number to clipboard
document.addEventListener('DOMContentLoaded', () => {
    // Function to copy text to the clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Select the email and phone number buttons
    const copyEmailButton = document.querySelector('[data-element="help_copyEmail"]');
    const copyPhoneButton = document.querySelector('[data-element="help_copyPhone"]');

    // Email and phone number to copy
    const email = 'support@keysbooking.com';
    const phoneNumber = '+13053011952';

    // Add click event listeners
    if (copyEmailButton) {
        copyEmailButton.addEventListener('click', () => {
            copyToClipboard(email);
            alert('Email copied to clipboard!');
        });
    }

    if (copyPhoneButton) {
        copyPhoneButton.addEventListener('click', () => {
            copyToClipboard(phoneNumber);
            alert('Phone number copied to clipboard!');
        });
    }
});

// Hide loader when page is fully loaded and ready
window.addEventListener('load', () => {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
        loader.style.display = 'none';
    }
});
