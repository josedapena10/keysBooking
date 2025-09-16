document.addEventListener('DOMContentLoaded', function () {

    // Global variable to store user age
    let userAge = null;
    let userDataLoaded = false;

    // Helper function to wait for user data to be loaded
    async function waitForUserData(timeout = 5000) {
        return new Promise((resolve) => {
            if (userDataLoaded) {
                resolve();
                return;
            }

            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (userDataLoaded || (Date.now() - startTime) > timeout) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {
        try {
            const requestName = 'Load_user'; // Ensure this matches the actual request name
            await Wized.requests.waitFor(requestName);

            if (Wized.data.r.Load_user.status === 200 && Wized.data.r.Load_user.data.Birth_Date) {
                const birthDateStr = Wized.data.r.Load_user.data.Birth_Date; // e.g. "1999-07-18"
                // Manually parse birth date
                const [birthYear, birthMonth, birthDay] = birthDateStr.split('-').map(Number);

                // Manually get today's date
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1; // JS months are 0-based
                const currentDay = now.getDate();

                let age = currentYear - birthYear;
                if (
                    currentMonth < birthMonth ||
                    (currentMonth === birthMonth && currentDay < birthDay)
                ) {
                    age--;
                }

                // Store user age globally
                userAge = age;
                userDataLoaded = true;

            } else {
                // User not logged in or no birth date
                userDataLoaded = true;
            }
        } catch (err) {

            userDataLoaded = true; // Still mark as loaded even if error
        }
    });







    // Get all button elements
    const typeButton = document.querySelector('[data-element="navBarSearch_typeButton"]');
    const locationButton = document.querySelector('[data-element="navBarSearch_locationButton"]');
    const datesButton = document.querySelector('[data-element="navBarSearch_datesButton"]');
    const guestsButton = document.querySelector('[data-element="navBarSearch_guestsButton"]');
    const searchButton = document.querySelector('[data-element="navBarSearch_searchButton"]');
    const guestsSearchContainer = document.querySelector('[data-element="navBarSearch_guestsSearchContainer"]');

    // Get all popup elements
    const typePopup = document.querySelector('[data-element="navBarSearch_typePopup"]');
    const locationPopup = document.querySelector('[data-element="navBarSearch_locationPopup"]');
    const datesPopup = document.querySelector('[data-element="navBarSearch_datesPopup"]');
    const guestsPopup = document.querySelector('[data-element="navBarSearch_guestsPopup"]');

    // Get all popup background elements
    const typePopupBackground = document.querySelector('[data-element="navBarSearch_typePopupBackground"]');
    const locationPopupBackground = document.querySelector('[data-element="navBarSearch_locationPopupBackground"]');
    const datesPopupBackground = document.querySelector('[data-element="navBarSearch_datesPopupBackground"]');
    const guestsPopupBackground = document.querySelector('[data-element="navBarSearch_guestsPopupBackground"]');

    // Get all button text elements
    const typeButtonText = document.querySelector('[data-element="navBarSearch_typeButton_text"]');
    const locationButtonText = document.querySelector('[data-element="navBarSearch_locationButton_text"]');
    const datesButtonText = document.querySelector('[data-element="navBarSearch_datesButton_text"]');
    const guestsButtonText = document.querySelector('[data-element="navBarSearch_guestsButton_text"]');

    // Default placeholder values
    const defaultValues = {
        type: "Private Home",
        location: "Florida Keys, FL",
        dates: "Select dates",
        guests: "Add guests"
    };

    // ADD THIS: Flag to track if map has been initialized
    let isMapInitialized = false;

    // ADD a flag to track when user is manually exploring
    let isUserExploring = false;

    // ADD a flag to track when we're centering on a marker (to prevent API requests)
    let isCenteringOnMarker = false;

    // ADD THIS: Pagination state variables
    let currentPage = 1;
    const listingsPerPage = 20;
    let currentListings = []; // Store current listings for pagination

    // Filter state object - stores all active (applied) filters
    const activeFilters = {
        priceRange: {
            min: null,
            max: null
        },
        bedrooms: null,
        beds: null,
        bathrooms: null,
        dock: {
            hasPrivateDock: null,
            hasShorePower: null,
            hasFreshWater: null,
            hasCleaningStation: null,
            hasDockLights: null,
            hasBoatSpecsLength: null,
            hasBoatSpecsDraft: null,
            hasBoatSpecsBeam: null,
            hasMinBoatLength: null, // New property for minimum boat length requirement
        },
        amenities: [],
        petsAllowed: null,
    };

    // Pending filter state - stores filters being edited (before applying)
    const pendingFilters = {
        priceRange: {
            min: null,
            max: null
        },
        bedrooms: null,
        beds: null,
        bathrooms: null,
        dock: {
            hasPrivateDock: null,
            hasShorePower: null,
            hasFreshWater: null,
            hasCleaningStation: null,
            hasDockLights: null,
            hasBoatSpecsLength: null,
            hasBoatSpecsDraft: null,
            hasBoatSpecsBeam: null,
            hasMinBoatLength: null, // New property for minimum boat length requirement
        },
        amenities: [],
        petsAllowed: null,
    };

    var boatRentals = [];
    var fishingCharters = [];

    // Store original unfiltered results
    let unfilteredListings = [];

    // --- Phase 0: Pricing helpers ---
    const fmtMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
    const hasDates = () => Boolean(apiFormats?.dates?.checkIn && apiFormats?.dates?.checkOut);
    const wantBoat = () => Boolean(currentSelections?.typeFlags?.boatRental);
    const wantChar = () => Boolean(currentSelections?.typeFlags?.fishingCharter);

    // Home "starting-at" (NO DATES): includes cleaning & serviceFee multiplier
    const computeHomeStartNoDates = (listing) => {
        const minNights = Number(listing?.min_nights) || 1;
        const nightly = Number(listing?.nightlyPrice);

        if (!Number.isFinite(nightly)) {
            return null; // signals "Price unavailable"
        }

        const cleaning = Number(listing?.cleaning_fee) || 0;
        const svcMult = 1 + (Number(listing?.serviceFee) || 0); // e.g. 1 + 0.12 = 1.12
        const result = (minNights * nightly + cleaning) * svcMult;
        return result;
    };



    // Extras min prices (using existing badge logic)
    const minBoat = (listing) => {
        if (!wantBoat()) {
            return 0;
        }

        if (typeof boatModule === 'undefined') {
            return 0;
        }

        try {
            // Fix: Convert Date objects to proper format for boat module
            let datesForBoat = apiFormats?.dates;
            if (datesForBoat?.checkIn && datesForBoat?.checkOut) {
                // Convert Date objects to YYYY-MM-DD strings if needed
                if (datesForBoat.checkIn instanceof Date) {
                    datesForBoat = {
                        checkIn: formatDateForAPI(datesForBoat.checkIn),
                        checkOut: formatDateForAPI(datesForBoat.checkOut)
                    };
                }
            }

            // Fix: Use charter module's active guest filter instead of search guest count
            // This ensures charter filter changes are reflected in listing prices
            const charterFilters = charterModule.getCurrentFilters();
            const guestCount = Math.max(1, charterFilters.guests || apiFormats?.guests?.total || 1);

            const badgeData = boatModule.getBoatBadgeData(listing, datesForBoat, guestCount);
            const result = Number(badgeData?.minPrice || 0);

            return result;
        } catch (e) {
            return 0;
        }
    };

    const minChar = (listing) => {
        if (!wantChar()) {
            return 0;
        }
        try {

            // Fix: Convert Date objects to proper format for charter module
            let datesForCharter = apiFormats?.dates;
            if (datesForCharter?.checkIn && datesForCharter?.checkOut) {
                // Convert Date objects to YYYY-MM-DD strings if needed
                if (datesForCharter.checkIn instanceof Date) {
                    datesForCharter = {
                        checkIn: formatDateForAPI(datesForCharter.checkIn),
                        checkOut: formatDateForAPI(datesForCharter.checkOut)
                    };
                }
            }

            // Fix: Use charter module's active guest filter instead of search guest count
            // This ensures charter filter changes are reflected in listing prices
            const charterFilters = charterModule.getCurrentFilters();
            const guestCount = Math.max(1, charterFilters.guests || apiFormats?.guests?.total || 1);

            const badgeData = charterModule.getCharterBadgeData(listing, datesForCharter, guestCount);
            const result = Number(badgeData?.minPrice || 0);

            if (badgeData?.count === 0) {
            }

            return result;
        } catch (e) {
            return 0;
        }
    };

    // Initial styles for filter modal
    const filterModal = document.querySelector('[data-element="filterModal"]');
    if (filterModal) {
        filterModal.style.display = 'none';
    }

    // Set initial placeholder text and apply grey color for placeholders
    if (typeButtonText) {
        typeButtonText.textContent = defaultValues.type;
        // No placeholder styling for type since it's a selected value
    }
    if (locationButtonText) {
        locationButtonText.textContent = defaultValues.location;
        // No placeholder styling for location since it's a selected value
    }
    if (datesButtonText) {
        datesButtonText.textContent = defaultValues.dates;
        datesButtonText.style.color = "#6E6E73"; // Grey color for placeholder
        datesButtonText.style.fontWeight = "400"; // Font weight 400 for placeholder
    }
    if (guestsButtonText) {
        guestsButtonText.textContent = defaultValues.guests;
        guestsButtonText.style.color = "#6E6E73"; // Grey color for placeholder
        guestsButtonText.style.fontWeight = "400"; // Font weight 400 for placeholder
    }

    // Hide all popups initially
    const allPopups = [typePopup, locationPopup, datesPopup, guestsPopup];
    allPopups.forEach(popup => {
        if (popup) popup.style.display = 'none';
    });

    // Array of button and popup pairs for easier management
    const buttonPopupPairs = [
        { button: typeButton, popup: typePopup, background: typePopupBackground, isGuests: false, textElement: typeButtonText, defaultValue: defaultValues.type },
        { button: locationButton, popup: locationPopup, background: locationPopupBackground, isGuests: false, textElement: locationButtonText, defaultValue: defaultValues.location },
        { button: datesButton, popup: datesPopup, background: datesPopupBackground, isGuests: false, textElement: datesButtonText, defaultValue: defaultValues.dates },
        { button: guestsButton, popup: guestsPopup, background: guestsPopupBackground, isGuests: true, textElement: guestsButtonText, defaultValue: defaultValues.guests }
    ];

    // Track current confirmed selections and pending selections
    const currentSelections = {
        type: defaultValues.type,
        location: defaultValues.location,
        dates: defaultValues.dates,
        guests: defaultValues.guests,
        selectedDatesObj: { checkIn: null, checkOut: null }, // <-- add this
        typeFlags: { boatRental: false, fishingCharter: false }
    };

    // Pending selections (not yet confirmed with search)
    const pendingSelections = { ...currentSelections };
    pendingSelections.typeFlags = { boatRental: false, fishingCharter: false };

    // API-ready format for the search endpoint
    const apiFormats = {
        type: { boatRental: false, fishingCharter: false },
        location: {
            name: defaultValues.location,
            bounds: {
                // Default bounds for the Florida Keys
                northeast: {
                    lat: 25.2,
                    lng: -80.0
                },
                southwest: {
                    lat: 24.4,
                    lng: -82.2
                },
                center: {
                    lat: 24.7,
                    lng: -81.1
                }
            }
        },
        dates: {
            checkIn: null, // Will store as YYYY-MM-DD
            checkOut: null // Will store as YYYY-MM-DD
        },
        guests: {
            adults: 0,
            children: 0,
            infants: 0,
            pets: 0,
            total: 0
        }
    };

    // Function to ensure YYYY-MM-DD format, accepting YYYY-MM-DD and "Thu Feb 18 2027 00:00:00 GMT-0500 (Eastern Standard Time)"-like strings, without creating a new Date object
    function formatDateToYYYYMMDD(date) {
        if (!date) return '';

        if (typeof date === 'string') {
            // If it's already a string in YYYY-MM-DD format, return as-is
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return date;
            }
            // Try to match formats like "Thu Feb 18 2027 00:00:00 GMT-0500 (Eastern Standard Time)"
            // Look for pattern: DayOfWeek Month Day Year ...
            const match = date.match(/^[A-Za-z]{3,},?\s([A-Za-z]{3,})\s(\d{1,2})\s(\d{4})/);
            // Or fallback: "Thu Feb 18 2027 00:00:00 GMT-0500 (Eastern Standard Time)"
            const fallbackMatch = date.match(/^[A-Za-z]{3}\s([A-Za-z]{3})\s(\d{1,2})\s(\d{4})/);
            const months = {
                Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
            };
            let m = match || fallbackMatch;
            if (m) {
                const month = months[m[1]];
                const day = String(m[2]).padStart(2, '0');
                const year = m[3];
                if (month && year && day) {
                    return `${year}-${month}-${day}`;
                }
            }
        }

        // If it's a Date object, format as YYYY-MM-DD
        if (date instanceof Date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // If it's not a proper string or Date, return empty
        return '';
    }

    // Updated function to format date range that handles both Date objects and YYYY-MM-DD strings
    function formatDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let startMonth, startDay, endMonth, endDay;

        // Handle startDate - either Date object or YYYY-MM-DD string
        if (startDate instanceof Date && !isNaN(startDate.getTime())) {
            // It's a Date object
            startMonth = months[startDate.getMonth()];
            startDay = startDate.getDate();
        } else if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // It's a YYYY-MM-DD string
            const startParts = startDate.split('-');
            startMonth = months[parseInt(startParts[1]) - 1]; // Month is 1-indexed in string
            startDay = parseInt(startParts[2]);
        } else {
            return '';
        }

        // Handle endDate - either Date object or YYYY-MM-DD string
        if (endDate instanceof Date && !isNaN(endDate.getTime())) {
            // It's a Date object
            endMonth = months[endDate.getMonth()];
            endDay = endDate.getDate();
        } else if (typeof endDate === 'string' && endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // It's a YYYY-MM-DD string
            const endParts = endDate.split('-');
            endMonth = months[parseInt(endParts[1]) - 1]; // Month is 1-indexed in string
            endDay = parseInt(endParts[2]);
        } else {
            return '';
        }

        // Only show end month if different from start month
        return startMonth === endMonth
            ? `${startMonth} ${startDay} - ${endDay}`
            : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }

    // Function to get location bounds from Google Maps Geocoding API
    async function getLocationBounds(locationName) {

        if (!locationName || locationName === defaultValues.location) {
            return null;
        }

        // Clean the location name (remove ", FL" and any extra spaces)
        const cleanLocation = locationName.replace(/, FL$/, '').trim();

        // Check for special locations first
        const specialLocations = {
            "Sombrero Beach": {
                bounds: {
                    northeast: { lat: 24.710746, lng: -81.074342 },
                    southwest: { lat: 24.689237, lng: -81.092847 },
                    center: { lat: 24.699992, lng: -81.083595 }
                }
            },
            "Upper Keys": {
                bounds: {
                    northeast: { lat: 25.3, lng: -80.0 },
                    southwest: { lat: 24.5, lng: -80.9 },
                    center: { lat: 24.9, lng: -80.45 }
                }
            },
            "Middle Keys": {
                bounds: {
                    northeast: { lat: 24.8, lng: -80.8 },
                    southwest: { lat: 24.4, lng: -81.3 },
                    center: { lat: 24.6, lng: -81.05 }
                }
            },
            "Lower Keys": {
                bounds: {
                    northeast: { lat: 24.5, lng: -81.2 },
                    southwest: { lat: 24.4, lng: -82.0 },
                    center: { lat: 24.45, lng: -81.6 }
                }
            }
        };

        // Check if the location contains any of our special locations
        for (const [specialName, data] of Object.entries(specialLocations)) {
            // Check if the location starts with the special location name
            // or contains it after a comma (e.g., "Sombrero Beach" or "Something, Sombrero Beach")
            if (cleanLocation.startsWith(specialName) ||
                cleanLocation.includes(`, ${specialName}`) ||
                cleanLocation.toLowerCase().includes(specialName.toLowerCase())) {
                return data.bounds;
            }
        }

        // Add "Florida Keys" context if it's not already included
        let searchLocation = locationName;
        if (!searchLocation.toLowerCase().includes('florida keys') &&
            !searchLocation.toLowerCase().includes('fl, usa')) {
            // Ensure we're searching for the location in Florida, USA
            searchLocation = searchLocation.replace(', FL', ', Florida Keys, FL, USA');
        }

        try {

            const googleMapsApiKey = 'AIzaSyBtTdNYqGeF4GHpw0OA-tasMjY2yEO-4BY';
            const encodedLocation = encodeURIComponent(locationName);

            const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${googleMapsApiKey}`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch location data');
            }

            const data = await response.json();

            if (data.status !== 'OK' || !data.results || !data.results[0]) {
                return null;
            }

            const location = data.results[0];

            const viewport = location.geometry.viewport;

            const result = {
                northeast: {
                    lat: viewport.northeast.lat,
                    lng: viewport.northeast.lng
                },
                southwest: {
                    lat: viewport.southwest.lat,
                    lng: viewport.southwest.lng
                },
                center: {
                    lat: location.geometry.location.lat,
                    lng: location.geometry.location.lng
                }
            };

            return result;
        } catch (error) {
            return null;
        }
    }

    // Function to update API formats based on current selections
    async function updateAPIFormats() {
        // Update type booleans for request (always present)
        (function updateTypeBooleans() {
            const str = (currentSelections.type || '').toLowerCase();
            apiFormats.type = {
                boatRental: !!(currentSelections.typeFlags?.boatRental || str.includes('boat')),
                fishingCharter: !!(currentSelections.typeFlags?.fishingCharter || str.includes('charter') || str.includes('fishing'))
            };
        })();

        // Update location (only if not default)
        if (currentSelections.location !== defaultValues.location) {
            apiFormats.location.name = currentSelections.location;

            // Special handling for "Map area" - don't overwrite existing bounds
            if (currentSelections.location === "Map area") {
                // If we already have bounds for Map area, keep them
                // Only update if we don't have bounds yet
                if (!apiFormats.location.bounds) {
                    // This shouldn't happen, but as fallback get current map bounds
                    if (window.currentMap) {
                        const bounds = window.currentMap.getBounds();
                        if (bounds) {
                            const ne = bounds.getNorthEast();
                            const sw = bounds.getSouthWest();
                            apiFormats.location.bounds = {
                                northeast: { lat: ne.lat(), lng: ne.lng() },
                                southwest: { lat: sw.lat(), lng: sw.lng() },
                                center: {
                                    lat: (ne.lat() + sw.lat()) / 2,
                                    lng: (ne.lng() + sw.lng()) / 2
                                }
                            };
                        }
                    }
                }
                // For "Map area", we keep the existing bounds and don't call getLocationBounds
            } else {
                // For regular locations, get bounds from Google Maps API (cached if already queried)
                if (!apiFormats.location.bounds || currentSelections.location !== defaultValues.location) {
                    apiFormats.location.bounds = await getLocationBounds(currentSelections.location);
                }
            }
        } else {
            // If using default location, use default Florida Keys bounds
            apiFormats.location = {
                name: defaultValues.location,
                bounds: {
                    northeast: {
                        lat: 25.2,
                        lng: -80.0
                    },
                    southwest: {
                        lat: 24.4,
                        lng: -82.2
                    },
                    center: {
                        lat: 24.7,
                        lng: -81.1
                    }
                }
            };
        }

        // Update dates if they're set
        if (currentSelections.dates && currentSelections.dates !== defaultValues.dates) {
            if (currentSelections.selectedDatesObj) {
                apiFormats.dates = {
                    checkIn: currentSelections.selectedDatesObj.checkIn,
                    checkOut: currentSelections.selectedDatesObj.checkOut
                };
            } else {
                // If we somehow have a date string but no date objects, clear the dates
                apiFormats.dates = {
                    checkIn: null,
                    checkOut: null
                };
            }
        } else {
            apiFormats.dates = {
                checkIn: null,
                checkOut: null
            };
        }

        // Update guests if they're set
        if (currentSelections.guests !== defaultValues.guests) {
            if (currentSelections.guestDetails) {
                apiFormats.guests = {
                    adults: currentSelections.guestDetails.adults || 0,
                    children: currentSelections.guestDetails.children || 0,
                    infants: currentSelections.guestDetails.infants || 0,
                    pets: currentSelections.guestDetails.pets || 0,
                    total: (currentSelections.guestDetails.adults || 0) +
                        (currentSelections.guestDetails.children || 0)
                };
            }
        } else {
            apiFormats.guests = {
                adults: 0,
                children: 0,
                infants: 0,
                pets: 0,
                total: 0
            };
        }

        // Here you would pass apiFormats to your search endpoint
        // You can access it in your search handler with: apiFormats

        return apiFormats;
    }

    // Function to update text color based on whether it's a placeholder or user-selected value
    function updateTextColor(textElement, defaultValue) {
        if (textElement) {
            // Only apply placeholder styling for dates and guests
            if (textElement === datesButtonText || textElement === guestsButtonText) {
                if (textElement.textContent === defaultValue) {
                    textElement.style.color = "#6E6E73"; // Grey color for placeholder
                    textElement.style.fontWeight = "400"; // Font weight 400 for placeholder
                } else {
                    textElement.style.color = ""; // Default color for selected value
                    textElement.style.fontWeight = ""; // Default font weight for selected value
                }
            }
        }
    }

    // Note: Scroll blocking logic removed - users can scroll background when modals are open

    // Function to close all popups and remove all selected classes
    function closeAllPopups() {
        // Hide all popups
        allPopups.forEach(popup => {
            if (popup) popup.style.display = 'none';
        });

        // Remove selected class from all buttons
        buttonPopupPairs.forEach(pair => {
            if (pair.button) pair.button.classList.remove('selected');
        });

        // Remove selected class from guests container
        if (guestsSearchContainer) guestsSearchContainer.classList.remove('selected');
    }

    // Function to open a specific popup
    function openPopup(popupInfo) {
        // Check if we're in mobile view and navBar_Container is visible
        const navBarContainer = document.querySelector('[data-element="navBar_Container"]');
        const isMobileView = window.innerWidth <= 991;
        const isMobilePopupVisible = navBarContainer && navBarContainer.classList.contains('show-mobile-popup');

        if (isMobileView && isMobilePopupVisible) {
            // In mobile view with container visible, only close the popup elements without hiding the container
            // Hide all popups
            allPopups.forEach(popup => {
                if (popup) popup.style.display = 'none';
            });

            // Remove selected class from all buttons
            buttonPopupPairs.forEach(pair => {
                if (pair.button) pair.button.classList.remove('selected');
            });

            // Remove selected class from guests container
            if (guestsSearchContainer) guestsSearchContainer.classList.remove('selected');

            // DON'T call hideMobilePopup() here - keep the container visible
        } else {
            // Desktop view or mobile container not visible - use normal closeAllPopups
            closeAllPopups();
        }

        // Then open the selected popup
        if (popupInfo.popup) {
            popupInfo.popup.style.display = 'flex';

            // Add selected class to the appropriate element
            if (popupInfo.isGuests) {
                if (guestsSearchContainer) guestsSearchContainer.classList.add('selected');
            } else {
                if (popupInfo.button) popupInfo.button.classList.add('selected');
            }

            // Note: Scroll blocking removed - background scrolling allowed
        }
    }

    // Add click event listeners to buttons
    buttonPopupPairs.forEach(pair => {
        if (pair.button) {
            pair.button.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent event from bubbling up
                openPopup(pair);
            });
        }
    });

    // Add click event listeners to popup backgrounds to close them
    buttonPopupPairs.forEach(pair => {
        if (pair.background) {
            pair.background.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent event from bubbling up
                closeAllPopups();

                // Revert any pending changes since user clicked background
                revertPendingChanges();
            });
        }
    });

    // Function to revert pending changes to current selections
    function revertPendingChanges() {
        // Reset pending selections to match current confirmed selections
        Object.assign(pendingSelections, currentSelections);

        // Update all button texts to reflect current selections
        updateButtonText(typeButtonText, currentSelections.type, defaultValues.type);
        updateButtonText(locationButtonText, currentSelections.location, defaultValues.location);
        updateButtonText(datesButtonText, currentSelections.dates, defaultValues.dates);
        updateButtonText(guestsButtonText, currentSelections.guests, defaultValues.guests);

        // Update visual state of type options based on current selection
        if (typeof typePopupHandlers !== 'undefined' && typePopupHandlers.updateTypeSelectionVisual) {
            typePopupHandlers.updateTypeSelectionVisual();
        }
    }

    // Add click event listener to the search button
    if (searchButton) {
        // Store original click handler
        const originalGlobalSearchClick = searchButton.onclick;

        searchButton.onclick = async function (e) {
            console.log("Main search handler executing");
            e.preventDefault();
            e.stopPropagation();  // Prevent event bubbling

            // Update current selections from pending
            if (pendingSelections.location === defaultValues.location) {
                currentSelections.location = defaultValues.location;
            } else {
                currentSelections.location = pendingSelections.location;
            }

            if (pendingSelections.dates === defaultValues.dates) {
                currentSelections.dates = defaultValues.dates;
            } else {
                currentSelections.dates = pendingSelections.dates;
            }

            if (pendingSelections.guests === defaultValues.guests) {
                currentSelections.guests = defaultValues.guests;
            } else {
                currentSelections.guests = pendingSelections.guests;
            }

            if (pendingSelections.type === defaultValues.type) {
                currentSelections.type = defaultValues.type;
                currentSelections.typeFlags = { boatRental: false, fishingCharter: false };
            } else {
                currentSelections.type = pendingSelections.type;
                if (pendingSelections.typeFlags) {
                    currentSelections.typeFlags = { ...pendingSelections.typeFlags };
                } else {
                    const str = (pendingSelections.type || '').toLowerCase();
                    currentSelections.typeFlags = {
                        boatRental: str.includes('boat'),
                        fishingCharter: str.includes('charter') || str.includes('fishing')
                    };
                }
            }

            // Update API formats based on current selections
            await updateAPIFormats();

            // Update extras visibility based on type selections
            updateExtrasVisibility();

            // Phase 4: Update price filter when search state changes
            if (typeof filterSystem !== 'undefined' && filterSystem.updatePriceFilter) {
                filterSystem.updatePriceFilter();
            }

            // Fetch property search results
            const searchResults = await fetchPropertySearchResults();

            // Handle search results
            if (!searchResults?.error) {
                localStorage.setItem('propertySearchResults', JSON.stringify(searchResults));
            } else {
            }

            // Close all popups after search is clicked
            closeAllPopups();
        };
    }

    // Close popups when clicking outside of them
    document.addEventListener('click', function (e) {
        const isClickInsideAnyPopup = allPopups.some(popup =>
            popup && popup.contains(e.target)
        );

        const isClickOnAnyButton = buttonPopupPairs.some(pair =>
            pair.button && pair.button.contains(e.target)
        );

        // Check if click is inside map listing overlay
        const isClickInsideMapOverlay = window.currentListingOverlay &&
            window.currentListingOverlay.div &&
            window.currentListingOverlay.div.contains(e.target);

        if (!isClickInsideAnyPopup && !isClickOnAnyButton && !searchButton.contains(e.target) && !isClickInsideMapOverlay) {
            closeAllPopups();
            revertPendingChanges();
            // Note: Scroll blocking removed - background scrolling allowed
        }
    });

    // Function to update text and color when a value is selected
    function updateButtonText(textElement, newValue, defaultValue) {
        if (textElement) {
            textElement.textContent = newValue;
            updateTextColor(textElement, defaultValue);
        }
    }

    // Add custom hover styles for guests button when container has selected class
    const style = document.createElement('style');
    style.textContent = `
        /* When guestsSearchContainer has selected class, change hover background color */
        [data-element="navBarSearch_guestsSearchContainer"].selected [data-element="navBarSearch_guestsButton"]:hover {
            background-color: rgba(207, 229, 255, 0.00) !important;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    // Type popup functionality
    function setupTypePopup() {
        const privateHomeEl = document.querySelector('[data-element="navBarSearch_typePopup_privateHome"]');
        const boatSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_boatRentalSelected"]');
        const boatNotSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_boatRentalNotSelected"]');
        const fishSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_fishingCharterSelected"]');
        const fishNotSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_fishingCharterNotSelected"]');

        // Ensure Private Home is always selected
        if (privateHomeEl) {
            privateHomeEl.classList.add('selected');
        }

        // Internal pending state for toggles
        let pendingBoat = false;
        let pendingFishing = false;

        // Parse a type text into flags
        function parseTypeString(typeStr) {
            const str = (typeStr || '').toLowerCase();
            return {
                boat: str.includes('boat'),
                fishing: str.includes('fishing')
            };
        }

        // Build the button text from flags
        function buildTypeText(flags) {
            const parts = ['Home'];
            if (flags.boat) parts.push('Boat');
            if (flags.fishing) parts.push('Charter');
            // if (parts.length === 3) {
            //     parts[2] = parts[2].slice(0, 2) + '..';
            // }
            return parts.join(' + ');
        }

        // Apply visibility for selected/not-selected UI blocks
        function applyToggleVisibility(flags) {
            if (boatSelectedEl) boatSelectedEl.style.display = flags.boat ? 'flex' : 'none';
            if (boatNotSelectedEl) boatNotSelectedEl.style.display = flags.boat ? 'none' : 'flex';
            if (fishSelectedEl) fishSelectedEl.style.display = flags.fishing ? 'flex' : 'none';
            if (fishNotSelectedEl) fishNotSelectedEl.style.display = flags.fishing ? 'none' : 'flex';

            // Hide NotSelectedContainer if both extras are selected
            const notSelectedContainer = document.querySelector('[data-element="navBarSearch_typePopup_NotSelectedContainer"]');
            if (notSelectedContainer) {
                const bothSelected = flags.boat && flags.fishing;
                notSelectedContainer.style.display = bothSelected ? 'none' : 'flex';
            }
        }

        // Initialize from confirmed selection
        const initialFlags = parseTypeString(currentSelections.type);
        // Prefer explicit flags if present
        if (currentSelections.typeFlags) {
            initialFlags.boat = !!currentSelections.typeFlags.boatRental;
            initialFlags.fishing = !!currentSelections.typeFlags.fishingCharter;
        }
        pendingBoat = initialFlags.boat;
        pendingFishing = initialFlags.fishing;
        applyToggleVisibility(initialFlags);
        // Sync button and pending selection text to confirmed value on open
        updateButtonText(typeButtonText, buildTypeText(initialFlags), defaultValues.type);
        pendingSelections.type = buildTypeText(initialFlags);
        pendingSelections.typeFlags = { boatRental: pendingBoat, fishingCharter: pendingFishing };

        function syncPendingAndText() {
            const flags = { boat: pendingBoat, fishing: pendingFishing };
            const text = buildTypeText(flags);
            pendingSelections.type = text;
            pendingSelections.typeFlags = { boatRental: pendingBoat, fishingCharter: pendingFishing };
            updateButtonText(typeButtonText, text, defaultValues.type);
            applyToggleVisibility(flags);
        }

        // Toggle helpers
        function toggleBoatRental() {
            pendingBoat = !pendingBoat;
            syncPendingAndText();
        }

        function toggleFishingCharter() {
            pendingFishing = !pendingFishing;
            syncPendingAndText();
        }

        // Click listeners to toggle visibility; stop propagation to avoid closing popup
        if (boatNotSelectedEl) boatNotSelectedEl.addEventListener('click', (e) => { e.stopPropagation(); toggleBoatRental(); });
        if (boatSelectedEl) boatSelectedEl.addEventListener('click', (e) => { e.stopPropagation(); toggleBoatRental(); });
        if (fishNotSelectedEl) fishNotSelectedEl.addEventListener('click', (e) => { e.stopPropagation(); toggleFishingCharter(); });
        if (fishSelectedEl) fishSelectedEl.addEventListener('click', (e) => { e.stopPropagation(); toggleFishingCharter(); });

        // Ensure UI matches confirmed selection and revert pending
        function updateTypeSelectionVisual() {
            const flags = parseTypeString(currentSelections.type);
            // Prefer explicit flags if present
            if (currentSelections.typeFlags) {
                flags.boat = !!currentSelections.typeFlags.boatRental;
                flags.fishing = !!currentSelections.typeFlags.fishingCharter;
            }
            pendingBoat = flags.boat;
            pendingFishing = flags.fishing;
            if (privateHomeEl) privateHomeEl.classList.add('selected');
            applyToggleVisibility(flags);
            const text = buildTypeText(flags);
            pendingSelections.type = text;
            pendingSelections.typeFlags = { boatRental: pendingBoat, fishingCharter: pendingFishing };
            updateButtonText(typeButtonText, text, defaultValues.type);
        }

        function revertPendingType() {
            updateTypeSelectionVisual();
        }

        // Make functions available outside
        return { updateTypeSelectionVisual, revertPendingType };
    }

    // Location popup functionality
    function setupLocationPopup() {
        const locationInput = document.querySelector('[data-element="navBarSearch_locationPopup_input"]');
        const suggestionsContainer = document.querySelector('[data-element="navBarSearch_locationPopup_suggestionsContainer"]');

        if (!locationInput || !suggestionsContainer) return; // Exit if elements don't exist

        // Add placeholder text to the input
        locationInput.placeholder = "Enter location";

        // Add styling for location suggestions
        const suggestionStyle = document.createElement('style');
        suggestionStyle.textContent = `
            .location-suggestion {
                width: calc(100%);
                font-family: 'TT Fors', sans-serif;
                font-size: 17px;
                font-weight: 400;
                color: #000000;
                border: 1px solid #E5E5E5;
                border-radius: 5px;
                margin-bottom: 8px;
                padding-top: 15px;
                padding-bottom: 15px;
                padding-left: 12px;
                padding-right: 12px;
                cursor: pointer;
                margin-right: 10px;
            }
            
            .location-suggestion:hover {
                background-color: #F5F5F5;
            }
            
            .location-suggestion.selected {
                background-color: #E5F2FF;
                border-color: #3498db;
            }
            
            /* Keep input border black when focused */
            [data-element="navBarSearch_locationPopup_input"]:focus {
                outline: none;
                border-color: #000000;
                box-shadow: none;
            }
        `;
        document.head.appendChild(suggestionStyle);

        // Define neighborhood data structure - neighborhoods mapped to their cities
        const neighborhoods = {
            "Key Largo": ["Port Largo", "Rock Harbor", "Sunset Cove", "Sexton Cove", "Garden Cove"],
            "Islamorada": ["Plantation Key Colony", "Lower Matecumbe", "Venetian Shores", "Port Antigua", "Upper Matecumbe", "Windley Key"],
            "Marathon": ["Boot Key Harbor", "Sombrero Beach", "Coco Plum", "Key Colony Beach"],
            "Big Pine Key": ["Eden Pines", "Doctor's Arm", "No Name Key", "Pine Channel Estates"],
            "Key West": ["Old Town", "New Town", "Bahama Village", "Truman Annex", "Casa Marina"]
        };

        // Define regions and their associated cities
        const regions = {
            "Upper Keys": ["Key Largo", "Tavernier", "Islamorada", "Plantation Key"],
            "Middle Keys": ["Marathon", "Duck Key", "Grassy Key", "Conch Key", "Long Key"],
            "Lower Keys": ["Big Pine Key", "Little Torch Key", "Ramrod Key", "Cudjoe Key", "Sugarloaf Key", "Big Coppit Key", "Stock Island", "Key West"]
        };

        // Define all valid Florida Keys locations for suggestions and validation
        const floridaKeysLocations = [
            "Key Largo", "Islamorada", "Marathon", "Big Pine Key", "Key West",
            "Cudjoe Key", "Summerland Key", "Little Torch Key", "Ramrod Key",
            "Sugarloaf Key", "Big Coppit Key", "Stock Island", "Tavernier",
            "Plantation Key", "Duck Key", "Grassy Key", "Conch Key", "Long Key",
            "Upper Keys", "Middle Keys", "Lower Keys", "Florida Keys"
        ];

        // Add all neighborhoods to the list of searchable locations
        const allSearchableLocations = [...floridaKeysLocations];

        // Add neighborhoods to searchable locations
        Object.entries(neighborhoods).forEach(([city, cityNeighborhoods]) => {
            cityNeighborhoods.forEach(neighborhood => {
                allSearchableLocations.push(`${neighborhood}, ${city}`);
            });
        });

        // Define major keys to show when nothing is typed
        const majorKeys = [
            "Key Largo", "Islamorada", "Marathon", "Big Pine Key", "Key West",
            "Upper Keys", "Middle Keys", "Lower Keys", "Florida Keys"
        ];

        // Function to check if input matches a valid Florida Keys location
        function isInFloridaKeys(input) {
            const lowercaseName = input.toLowerCase();

            // Check main locations
            if (floridaKeysLocations.some(location =>
                lowercaseName.includes(location.toLowerCase()))) {
                return true;
            }

            // Check neighborhoods
            for (const [city, cityNeighborhoods] of Object.entries(neighborhoods)) {
                if (cityNeighborhoods.some(neighborhood =>
                    lowercaseName.includes(neighborhood.toLowerCase()))) {
                    return true;
                }
            }

            return false;
        }

        // Function to display suggestions based on input
        function showSuggestions(input) {
            // Clear previous suggestions
            suggestionsContainer.innerHTML = '';

            let locationsToShow = [];
            const isExactMatch = allSearchableLocations.some(loc =>
                (loc + ', FL').toLowerCase() === input.toLowerCase() ||
                loc.toLowerCase() === input.toLowerCase()
            );

            // If input exactly matches a location (i.e., user has selected something)
            // but we still want to show a good selection of other options
            if (isExactMatch && input) {
                // Get the selected location without FL suffix for comparison
                let selectedLocationBase = input;
                if (selectedLocationBase.endsWith(', FL')) {
                    selectedLocationBase = selectedLocationBase.substring(0, selectedLocationBase.length - 4);
                }

                // Determine if selection is a neighborhood
                let selectedCity = '';
                let isNeighborhood = false;

                if (selectedLocationBase.includes(', ')) {
                    // Format: "Neighborhood, City"
                    const parts = selectedLocationBase.split(', ');
                    const neighborhood = parts[0];
                    selectedCity = parts[1];
                    isNeighborhood = true;
                } else {
                    // It's a city or region
                    selectedCity = selectedLocationBase;
                }

                // Always include the selected location first
                locationsToShow.push({
                    text: selectedLocationBase,
                    type: isNeighborhood ? 'neighborhood' : 'city',
                    selected: true
                });

                // 1. Add other neighborhoods from the same city
                if (neighborhoods[selectedCity]) {
                    neighborhoods[selectedCity].forEach(neighborhood => {
                        const fullLocation = `${neighborhood}, ${selectedCity}`;
                        if (fullLocation !== selectedLocationBase) {
                            locationsToShow.push({
                                text: fullLocation,
                                type: 'neighborhood',
                                related: true
                            });
                        }
                    });
                }

                // 2. Find region of the selected city
                let selectedRegion = '';
                for (const [region, cities] of Object.entries(regions)) {
                    if (cities.includes(selectedCity)) {
                        selectedRegion = region;
                        break;
                    }
                }

                // 3. Add other cities from the same region
                if (selectedRegion && regions[selectedRegion]) {
                    regions[selectedRegion].forEach(city => {
                        if (city !== selectedCity) {
                            locationsToShow.push({
                                text: city,
                                type: 'city',
                                related: true
                            });
                        }
                    });
                }

                // 4. Add all major keys for context
                majorKeys.forEach(location => {
                    if (location !== selectedCity && location !== selectedRegion) {
                        locationsToShow.push({
                            text: location,
                            type: 'city',
                            featured: true
                        });
                    }
                });

                // 5. If we still need more, add some other Florida Keys locations
                if (locationsToShow.length < 20) {
                    floridaKeysLocations.forEach(location => {
                        if (!locationsToShow.some(item => item.text === location) &&
                            !majorKeys.includes(location)) {
                            locationsToShow.push({
                                text: location,
                                type: 'city'
                            });

                            // Stop once we have enough
                            if (locationsToShow.length >= 20) return;
                        }
                    });
                }

                // Limit to about 20 suggestions in total
                if (locationsToShow.length > 20) {
                    // Keep selected, related, and featured items
                    const selectedItems = locationsToShow.filter(item => item.selected);
                    const relatedItems = locationsToShow.filter(item => item.related);
                    const featuredItems = locationsToShow.filter(item => item.featured && !item.related && !item.selected);
                    const otherItems = locationsToShow.filter(item => !item.selected && !item.related && !item.featured);

                    // Prioritize selections while keeping the count around 20
                    locationsToShow = [
                        ...selectedItems,
                        ...relatedItems.slice(0, Math.min(10, relatedItems.length)),
                        ...featuredItems.slice(0, Math.min(5, featuredItems.length)),
                        ...otherItems.slice(0, Math.max(0, 20 - selectedItems.length - Math.min(10, relatedItems.length) - Math.min(5, featuredItems.length)))
                    ];
                }
            }
            else if (!input.trim()) {
                // Show expanded recommendations when nothing is typed
                // First add all major keys as primary recommendations
                majorKeys.forEach(location => {
                    locationsToShow.push({ text: location, type: 'city', featured: true });
                });

                // Then add a selection of other Florida Keys locations
                // Skip ones already included in majorKeys
                floridaKeysLocations.forEach(location => {
                    if (!majorKeys.includes(location)) {
                        locationsToShow.push({ text: location, type: 'city' });
                    }
                });

                // Add a selection of popular neighborhoods (limit to first 2 neighborhoods per city)
                Object.entries(neighborhoods).forEach(([city, cityNeighborhoods]) => {
                    // Only add neighborhoods for major cities to avoid overwhelming the list
                    if (majorKeys.includes(city)) {
                        cityNeighborhoods.slice(0, 2).forEach(neighborhood => {
                            locationsToShow.push({
                                text: `${neighborhood}, ${city}`,
                                type: 'neighborhood'
                            });
                        });
                    }
                });
            } else {
                // Filter based on input
                const inputLower = input.toLowerCase();

                // Search in cities and regions
                floridaKeysLocations.forEach(location => {
                    if (location.toLowerCase().includes(inputLower)) {
                        locationsToShow.push({ text: location, type: 'city' });
                    }
                });

                // Search in neighborhoods
                Object.entries(neighborhoods).forEach(([city, cityNeighborhoods]) => {
                    cityNeighborhoods.forEach(neighborhood => {
                        if (neighborhood.toLowerCase().includes(inputLower) ||
                            city.toLowerCase().includes(inputLower)) {
                            locationsToShow.push({
                                text: `${neighborhood}, ${city}`,
                                type: 'neighborhood'
                            });
                        }
                    });
                });
            }

            // Always show suggestions, even if there are no matches
            if (locationsToShow.length === 0) {
                locationsToShow = majorKeys.map(location => ({ text: location, type: 'city' }));
            }

            // Create and append suggestion elements
            locationsToShow.forEach(location => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'location-suggestion';

                // Add classes based on location type
                if (location.selected) {
                    suggestionItem.classList.add('selected');
                }
                if (location.featured) {
                    suggestionItem.classList.add('featured-location');
                }
                if (location.related) {
                    suggestionItem.classList.add('related-location');
                }

                // Standardize location format
                let formattedLocation = standardizeLocationFormat(location.text);
                suggestionItem.textContent = formattedLocation;

                // Add click event to select the suggestion
                suggestionItem.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event from bubbling up and closing the popup
                    selectLocation(formattedLocation);
                });

                suggestionsContainer.appendChild(suggestionItem);
            });

            // Always show suggestions container
            suggestionsContainer.style.display = 'block';
        }

        // Function to truncate text if it's too long (simplified)
        function truncateLocationText(text) {
            const maxLength = 15;

            if (text.length > maxLength) {
                return text.substring(0, 12) + '...';
            }

            return text;
        }

        // Function to handle location selection
        function selectLocation(formattedLocation) {
            // Reset map area state
            if (currentSelections.location === "Map area") {
                currentSelections.location = defaultValues.location;
            }

            // Capitalize the location and standardize format
            formattedLocation = standardizeLocationFormat(capitalizeWords(formattedLocation));

            // Update the input field
            locationInput.value = formattedLocation;

            // Get truncated version if necessary
            const displayLocation = truncateLocationText(formattedLocation);

            // Update pending selection (store full version)
            pendingSelections.location = formattedLocation;

            // But display potentially truncated version
            updateButtonText(locationButtonText, displayLocation, defaultValues.location);

            // Update suggestions to highlight the selected one
            showSuggestions(formattedLocation);

            // Scroll back to the top of the suggestions container
            if (suggestionsContainer) {
                suggestionsContainer.scrollTop = 0;
            }
        }

        // Function to capitalize first letter of each word
        function capitalizeWords(text) {
            if (!text) return text;
            return text.split(' ').map(word => {
                // Handle words with commas
                return word.split(',').map(part => {
                    if (part.length === 0) return part;
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                }).join(',');
            }).join(' ');
        }

        // Function to standardize location format and prevent duplicate FL
        function standardizeLocationFormat(location) {
            if (!location) return location;

            // Remove any trailing commas and spaces
            let formattedLocation = location.trim().replace(/,\s*$/, '');

            // Remove any existing ", FL" suffix (case insensitive)
            formattedLocation = formattedLocation.replace(/,\s*fl\s*$/i, '');

            // Now add the standardized ", FL" suffix
            if (!formattedLocation.endsWith(', FL')) {
                formattedLocation = `${formattedLocation}, FL`;
            }

            return formattedLocation;
        }

        // Add input event listener
        locationInput.addEventListener('input', function () {
            // Check if input is empty and update accordingly
            if (!this.value.trim()) {
                // If input is empty, reset to default placeholder
                pendingSelections.location = defaultValues.location;
                updateButtonText(locationButtonText, defaultValues.location, defaultValues.location);
            } else {
                // Capitalize the first letter of each word
                const cursorPosition = this.selectionStart;
                this.value = capitalizeWords(this.value);
                // Restore cursor position
                this.setSelectionRange(cursorPosition, cursorPosition);
            }

            showSuggestions(this.value);
        });

        // Add clear input button functionality
        const clearInputButton = document.querySelector('[data-element="navBarSearch_locationPopup_clearInput"]');
        if (clearInputButton) {
            clearInputButton.addEventListener('click', function () {
                // Clear input field
                locationInput.value = '';
                locationInput.placeholder = "Enter location";

                // Reset to default placeholder value (not current selection)
                pendingSelections.location = defaultValues.location;
                updateButtonText(locationButtonText, defaultValues.location, defaultValues.location);

                // Show default suggestions without any selected
                showSuggestions('');

                // Keep focus on input after clearing
                locationInput.focus();
            });
        }

        // Add focus event to show suggestions for current input
        locationInput.addEventListener('focus', function () {
            // Always show suggestions when focused, even if input is empty
            showSuggestions(this.value);
        });

        // Set input value to current location when popup opens
        if (locationButton) {

            locationButton.addEventListener('click', function () {
                // If current location is "Map area", clear the input
                if (pendingSelections.location === "Map area") {
                    locationInput.value = '';
                    locationInput.placeholder = "Enter location";
                    showSuggestions(''); // Show default suggestions
                } else {
                    // If it's not the default placeholder, set the input value
                    if (pendingSelections.location !== defaultValues.location) {
                        locationInput.value = pendingSelections.location;
                    } else {
                        locationInput.value = '';
                    }
                }

                // Focus on the input field and show suggestions
                setTimeout(() => {
                    locationInput.focus();
                    showSuggestions(locationInput.value);
                }, 100);
            });
        }

        // Clear input when popup background is clicked but keep suggestions visible
        if (locationPopupBackground) {
            locationPopupBackground.addEventListener('click', function () {
                locationInput.value = '';
                showSuggestions(''); // Show default suggestions instead of hiding
            });
        }

        // Keep suggestions visible even when clicking outside
        document.addEventListener('click', function (e) {
            if (!suggestionsContainer.contains(e.target) && e.target !== locationInput) {
                // Don't hide suggestions, just ensure they match current selection
                if (locationPopup.style.display !== 'none') {
                    showSuggestions(locationInput.value);
                }
            }
        });

        // Add custom validation on form submission or when user tries to confirm location
        locationInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();

                const input = locationInput.value;

                // Capitalize and standardize the input
                const standardizedInput = standardizeLocationFormat(capitalizeWords(input));
                locationInput.value = standardizedInput;

                // Check if input is a valid Florida Keys location
                if (!isInFloridaKeys(standardizedInput)) {
                    alert("Please select a location within the Florida Keys area");
                    return;
                }

                selectLocation(standardizedInput);
                closeAllPopups();
            }
        });
    }

    // Guests popup functionality
    function setupGuestsPopup() {
        // Get all guest count elements
        const adultMinus = document.querySelector('[data-element="NavBar_Guest_Adult_Minus"]');
        const adultCount = document.querySelector('[data-element="NavBar_ReservationGuest_AdultNumber"]');
        const adultPlus = document.querySelector('[data-element="NavBar_Guest_Adult_Plus"]');

        const childrenMinus = document.querySelector('[data-element="NavBar_Guest_Children_Minus"]');
        const childrenCount = document.querySelector('[data-element="NavBar_ReservationGuest_ChildrenNumber"]');
        const childrenPlus = document.querySelector('[data-element="NavBar_Guest_Children_Plus"]');

        const infantMinus = document.querySelector('[data-element="NavBar_Guest_Infant_Minus"]');
        const infantCount = document.querySelector('[data-element="NavBar_ReservationGuest_InfantNumber"]');
        const infantPlus = document.querySelector('[data-element="NavBar_Guest_Infant_Plus"]');

        const petMinus = document.querySelector('[data-element="NavBar_Guest_Pet_Minus"]');
        const petCount = document.querySelector('[data-element="NavBar_ReservationGuest_PetNumber"]');
        const petPlus = document.querySelector('[data-element="NavBar_Guest_Pet_Plus"]');

        // Initialize guest counts
        let guests = {
            adults: 0,
            children: 0,
            infants: 0,
            pets: 0
        };

        // Keep a copy of confirmed guest counts
        let confirmedGuests = { ...guests };

        // Set initial count displays
        if (adultCount) adultCount.textContent = guests.adults;
        if (childrenCount) childrenCount.textContent = guests.children;
        if (infantCount) infantCount.textContent = guests.infants;
        if (petCount) petCount.textContent = guests.pets;

        // Define guest limits
        const guestLimits = {
            adults: 16, // Reasonable default
            children: 16, // Reasonable default
            infants: 5,  // Maximum 5 infants
            pets: 2      // Maximum 2 pets
        };

        // Function to update plus button state based on limits
        function updatePlusButtonState(plusButton, count, limit) {
            if (!plusButton) return;

            if (count >= limit) {
                plusButton.disabled = true;
                plusButton.style.opacity = '0.3';
            } else {
                plusButton.disabled = false;
                plusButton.style.opacity = '1';
            }
        }

        // Initialize plus button states based on limits
        updatePlusButtonState(adultPlus, guests.adults, guestLimits.adults);
        updatePlusButtonState(childrenPlus, guests.children, guestLimits.children);
        updatePlusButtonState(infantPlus, guests.infants, guestLimits.infants);
        updatePlusButtonState(petPlus, guests.pets, guestLimits.pets);

        // Function to update the minus button state (disabled when count is 0)
        function updateMinusButtonState(minusButton, count) {
            if (!minusButton) return;

            // Special handling for adults - check if we should disable the minus button when count is 1
            if (minusButton === adultMinus && count === 1) {
                // Disable adult minus button if there are children, infants, or pets
                if (guests.children > 0 || guests.infants > 0 || guests.pets > 0) {
                    minusButton.disabled = true;
                    minusButton.style.opacity = '0.3';
                    return;
                }
            }

            if (count <= 0) {
                minusButton.disabled = true;
                minusButton.style.opacity = '0.3';
            } else {
                minusButton.disabled = false;
                minusButton.style.opacity = '1';
            }
        }

        // Initialize button states
        updateMinusButtonState(adultMinus, guests.adults);
        updateMinusButtonState(childrenMinus, guests.children);
        updateMinusButtonState(infantMinus, guests.infants);
        updateMinusButtonState(petMinus, guests.pets);

        // Set up SVGs for plus and minus buttons
        function setupGuestSVGButtons() {
            const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
            const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';

            // Set SVGs for all plus buttons
            if (adultPlus) adultPlus.innerHTML = svgPlus;
            if (childrenPlus) childrenPlus.innerHTML = svgPlus;
            if (infantPlus) infantPlus.innerHTML = svgPlus;
            if (petPlus) petPlus.innerHTML = svgPlus;

            // Set SVGs for all minus buttons
            if (adultMinus) adultMinus.innerHTML = svgMinus;
            if (childrenMinus) childrenMinus.innerHTML = svgMinus;
            if (infantMinus) infantMinus.innerHTML = svgMinus;
            if (petMinus) petMinus.innerHTML = svgMinus;
        }

        // Initialize SVG buttons
        setupGuestSVGButtons();

        // Function to update the guest button text based on current selections
        function updateGuestButtonText() {
            const totalGuests = guests.adults + guests.children;
            let guestText = defaultValues.guests;

            if (totalGuests > 0) {
                guestText = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`;

                // Check if we need to add infants and pets
                const hasInfants = guests.infants > 0;
                const hasPets = guests.pets > 0;

                // Only proceed with overflow checking if we have infants or pets
                if (hasInfants || hasPets) {
                    // Create a temp span to measure text width
                    const tempSpan = document.createElement('span');
                    tempSpan.style.visibility = 'hidden';
                    tempSpan.style.position = 'absolute';
                    tempSpan.style.whiteSpace = 'nowrap';
                    tempSpan.style.font = window.getComputedStyle(guestsButtonText).font;
                    document.body.appendChild(tempSpan);

                    // Calculate available width (parent width minus padding)
                    const buttonRect = guestsButton.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(guestsButton);
                    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 20; // Reduced padding estimate
                    const paddingRight = parseFloat(computedStyle.paddingRight) || 20; // Reduced padding estimate
                    const availableWidth = buttonRect.width - paddingLeft - paddingRight;

                    // Start with the base guest text
                    tempSpan.textContent = guestText;
                    const baseWidth = tempSpan.offsetWidth;

                    // Generate full text with infants and pets
                    let fullText = guestText;
                    let infantText = hasInfants ? `, ${guests.infants} infant${guests.infants > 1 ? 's' : ''}` : '';
                    let petText = hasPets ? `, ${guests.pets} pet${guests.pets > 1 ? 's' : ''}` : '';

                    // Check if full text would overflow
                    tempSpan.textContent = fullText + infantText + petText;
                    if (tempSpan.offsetWidth > availableWidth * 1.05) { // Added 5% tolerance
                        // Try abbreviated version for infants only first
                        if (hasInfants) {
                            const infantShort = `, ${guests.infants} inf.`;
                            tempSpan.textContent = fullText + infantShort + petText;

                            if (tempSpan.offsetWidth <= availableWidth * 1.05) {
                                // Abbreviated infants version fits
                                infantText = infantShort;
                                fullText = fullText + infantShort + petText;
                            } else {
                                // Try with abbreviated infants and no pets
                                if (hasPets) {
                                    tempSpan.textContent = fullText + infantShort;
                                    if (tempSpan.offsetWidth <= availableWidth * 1.05) {
                                        // Just show guests and abbreviated infants
                                        fullText = fullText + infantShort;
                                    } else {
                                        // If still too wide, show just guests with ellipsis
                                        fullText = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}...`;
                                    }
                                } else {
                                    // No pets but still too wide with abbreviated infants
                                    fullText = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}...`;
                                }
                            }
                        } else if (hasPets) {
                            // No infants, just pets, but still too wide
                            tempSpan.textContent = fullText + '...';
                            if (tempSpan.offsetWidth <= availableWidth) {
                                fullText = fullText + '...';
                            } else {
                                // Even with ellipsis it's too wide
                                fullText = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}...`;
                            }
                        }
                    } else {
                        // Full text fits
                        fullText = fullText + infantText + petText;
                    }

                    document.body.removeChild(tempSpan);
                    guestText = fullText;
                } else {
                    // No infants or pets, just show guests
                    guestText = `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`;
                }
            }

            // Update pending selection
            pendingSelections.guests = guestText;

            // Also store the detailed guest counts in pendingSelections for later retrieval
            pendingSelections.guestDetails = { ...guests };

            // Update button text
            updateButtonText(guestsButtonText, guestText, defaultValues.guests);
        }

        // Function to handle increment
        function handleIncrement(type, countElement, minusButton, plusButton) {
            // If incrementing a non-adult category and no adults are selected, add an adult
            if (type !== 'adults' && guests.adults === 0) {
                guests.adults = 1;
                if (adultCount) adultCount.textContent = guests.adults;
                updateMinusButtonState(adultMinus, guests.adults);
                updatePlusButtonState(adultPlus, guests.adults, guestLimits.adults);
            }

            // Check if we've reached the limit
            if (guests[type] < guestLimits[type]) {
                guests[type]++;
                if (countElement) countElement.textContent = guests[type];
                updateMinusButtonState(minusButton, guests[type]);
                updatePlusButtonState(plusButton, guests[type], guestLimits[type]);

                // If we're incrementing a non-adult category, also update the adult minus button state
                if (type !== 'adults') {
                    updateMinusButtonState(adultMinus, guests.adults);
                }

                updateGuestButtonText();
            }
        }

        // Function to handle decrement
        function handleDecrement(type, countElement, minusButton, plusButton) {
            if (guests[type] > 0) {
                // Special handling for adults - prevent decrementing below 1 if any children/infants/pets
                if (type === 'adults' && guests[type] === 1 &&
                    (guests.children > 0 || guests.infants > 0 || guests.pets > 0)) {
                    // Don't allow decrementing adults below 1 if other categories have values
                    return;
                }

                guests[type]--;
                if (countElement) countElement.textContent = guests[type];
                updateMinusButtonState(minusButton, guests[type]);
                updatePlusButtonState(plusButton, guests[type], guestLimits[type]);

                // If we're decrementing a non-adult category, also update the adult minus button state
                // This ensures adult minus button is re-enabled when all children, infants, pets are removed
                if (type !== 'adults') {
                    updateMinusButtonState(adultMinus, guests.adults);
                }

                updateGuestButtonText();
            }
        }

        // Add click event listeners to all plus buttons
        if (adultPlus) {
            adultPlus.addEventListener('click', () => handleIncrement('adults', adultCount, adultMinus, adultPlus));
        }

        if (childrenPlus) {
            childrenPlus.addEventListener('click', () => handleIncrement('children', childrenCount, childrenMinus, childrenPlus));
        }

        if (infantPlus) {
            infantPlus.addEventListener('click', () => handleIncrement('infants', infantCount, infantMinus, infantPlus));
        }

        if (petPlus) {
            petPlus.addEventListener('click', () => handleIncrement('pets', petCount, petMinus, petPlus));
        }

        // Add click event listeners to all minus buttons
        if (adultMinus) {
            adultMinus.addEventListener('click', () => handleDecrement('adults', adultCount, adultMinus, adultPlus));
        }

        if (childrenMinus) {
            childrenMinus.addEventListener('click', () => handleDecrement('children', childrenCount, childrenMinus, childrenPlus));
        }

        if (infantMinus) {
            infantMinus.addEventListener('click', () => handleDecrement('infants', infantCount, infantMinus, infantPlus));
        }

        if (petMinus) {
            petMinus.addEventListener('click', () => handleDecrement('pets', petCount, petMinus, petPlus));
        }

        // Function to reset guest counts to confirmed values
        function resetGuestCounts() {
            // Copy confirmed values back to working guest object
            guests = { ...confirmedGuests };

            // Update display counts
            if (adultCount) adultCount.textContent = guests.adults;
            if (childrenCount) childrenCount.textContent = guests.children;
            if (infantCount) infantCount.textContent = guests.infants;
            if (petCount) petCount.textContent = guests.pets;

            // Update button states
            updateMinusButtonState(adultMinus, guests.adults);
            updateMinusButtonState(childrenMinus, guests.children);
            updateMinusButtonState(infantMinus, guests.infants);
            updateMinusButtonState(petMinus, guests.pets);

            // Update plus button states based on limits
            updatePlusButtonState(adultPlus, guests.adults, guestLimits.adults);
            updatePlusButtonState(childrenPlus, guests.children, guestLimits.children);
            updatePlusButtonState(infantPlus, guests.infants, guestLimits.infants);
            updatePlusButtonState(petPlus, guests.pets, guestLimits.pets);
        }

        // Reset guest counts when popup opens
        if (guestsButton) {
            guestsButton.addEventListener('click', function () {
                // If we have stored detailed guest counts, use them directly
                if (currentSelections.guestDetails) {
                    confirmedGuests = { ...currentSelections.guestDetails };
                } else if (currentSelections.guests !== defaultValues.guests) {
                    // Try to parse the current selection text
                    const guestText = currentSelections.guests;

                    // Reset confirmed guests object first
                    confirmedGuests = {
                        adults: 0,
                        children: 0,
                        infants: 0,
                        pets: 0
                    };

                    // Extract numbers using regex
                    const guestMatch = guestText.match(/(\d+) guest/);
                    const infantMatch = guestText.match(/(\d+) infant/);
                    const petMatch = guestText.match(/(\d+) pet/);

                    if (guestMatch) {
                        // For backward compatibility - if we don't have detailed counts,
                        // assume all guests are adults
                        confirmedGuests.adults = parseInt(guestMatch[1]) || 0;
                    }

                    if (infantMatch) {
                        confirmedGuests.infants = parseInt(infantMatch[1]) || 0;
                    }

                    if (petMatch) {
                        confirmedGuests.pets = parseInt(petMatch[1]) || 0;
                    }
                } else {
                    // If using default, reset both objects
                    confirmedGuests = {
                        adults: 0,
                        children: 0,
                        infants: 0,
                        pets: 0
                    };
                }

                // Set working guests to match confirmed values
                guests = { ...confirmedGuests };

                // Update display counts
                if (adultCount) adultCount.textContent = guests.adults;
                if (childrenCount) childrenCount.textContent = guests.children;
                if (infantCount) infantCount.textContent = guests.infants;
                if (petCount) petCount.textContent = guests.pets;

                // Update button states
                updateMinusButtonState(adultMinus, guests.adults);
                updateMinusButtonState(childrenMinus, guests.children);
                updateMinusButtonState(infantMinus, guests.infants);
                updateMinusButtonState(petMinus, guests.pets);

                // Update plus button states based on limits
                updatePlusButtonState(adultPlus, guests.adults, guestLimits.adults);
                updatePlusButtonState(childrenPlus, guests.children, guestLimits.children);
                updatePlusButtonState(infantPlus, guests.infants, guestLimits.infants);
                updatePlusButtonState(petPlus, guests.pets, guestLimits.pets);
            });
        }

        // Add search button click handler to confirm guest selections
        if (searchButton) {
            const originalSearchClickHandler = searchButton.onclick;
            searchButton.onclick = function (e) {
                console.log("Guest search handler executing");
                // Update confirmed guests with current selections
                confirmedGuests = { ...guests };

                // Store detailed guest counts in currentSelections
                currentSelections.guestDetails = { ...guests };

                // Call original handler if it exists
                if (originalSearchClickHandler) {
                    originalSearchClickHandler.call(this, e);
                }
            };
        }

        // Override revertPendingChanges to reset guest counts
        const originalRevertFunction = revertPendingChanges;
        revertPendingChanges = function () {
            // Call original revert function first
            originalRevertFunction();

            // Reset guest counts to confirmed values
            resetGuestCounts();
        };

        // Get the clear button
        const clearButton = document.querySelector('[data-element="navBarSearch_guestsPopup_clearButton"]');

        // Add clear button functionality
        if (clearButton) {
            clearButton.addEventListener('click', function () {
                // Reset all guest counts to 0
                guests = {
                    adults: 0,
                    children: 0,
                    infants: 0,
                    pets: 0
                };

                // Update display counts
                if (adultCount) adultCount.textContent = '0';
                if (childrenCount) childrenCount.textContent = '0';
                if (infantCount) infantCount.textContent = '0';
                if (petCount) petCount.textContent = '0';

                // Update button states
                updateMinusButtonState(adultMinus, 0);
                updateMinusButtonState(childrenMinus, 0);
                updateMinusButtonState(infantMinus, 0);
                updateMinusButtonState(petMinus, 0);

                // Update plus button states
                updatePlusButtonState(adultPlus, 0, guestLimits.adults);
                updatePlusButtonState(childrenPlus, 0, guestLimits.children);
                updatePlusButtonState(infantPlus, 0, guestLimits.infants);
                updatePlusButtonState(petPlus, 0, guestLimits.pets);

                // Update button text
                updateGuestButtonText();
            });
        }
    }

    // Dates popup functionality
    function setupDatesPopup() {
        const calendarContainer = document.querySelector('[data-element="navBarSearch_datesPopup_calendarContainer"]');
        if (!calendarContainer) return;

        // State variables
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        let selectedDates = {
            checkIn: null,
            checkOut: null
        };
        let selectingCheckOut = false;

        // Initialize temporary storage for in-progress date selections
        let tempSelectedDates = { ...selectedDates };

        // ... existing code ...
        function renderCalendars() {
            calendarContainer.innerHTML = '';

            // Create container for months
            const monthsContainer = document.createElement('div');
            monthsContainer.className = 'months-container';

            // Add responsive styles for the months container
            const responsiveStyles = document.createElement('style');
            responsiveStyles.textContent = `
        .months-container {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            position: relative;
        }
        
        @media screen and (max-width: 650px) {
            .months-container {
                flex-direction: column;
                gap: 20px;
                overflow-y: auto;
                max-height: 68vh;
                padding: 0 10px;
            }
            
            .calendar-nav-btn {
                display: none !important; /* Hide navigation buttons on mobile */
            }
        }
    `;
            document.head.appendChild(responsiveStyles);

            // Determine how many months to show based on screen width
            const isMobile = window.innerWidth <= 650;
            const numberOfMonths = isMobile ? 24 : 2; // Show 12 months for mobile scroll, 2 for desktop

            // Generate multiple months
            let currentMonthToRender = currentMonth;
            let currentYearToRender = currentYear;

            for (let i = 0; i < numberOfMonths; i++) {
                // Create month calendar
                const monthCalendar = createMonthCalendar(currentMonthToRender, currentYearToRender);
                monthCalendar.style.flex = '1';
                monthsContainer.appendChild(monthCalendar);

                // Move to next month
                currentMonthToRender++;
                if (currentMonthToRender > 11) {
                    currentMonthToRender = 0;
                    currentYearToRender++;
                }
            }

            // Only add navigation buttons for desktop view
            if (!isMobile) {
                // Add navigation buttons with complete styling
                const prevBtn = document.createElement('button');
                prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
                prevBtn.className = 'calendar-nav-btn prev-btn';
                prevBtn.style.background = 'none';
                prevBtn.style.border = 'none';
                prevBtn.style.cursor = 'pointer';
                prevBtn.style.position = 'absolute';
                prevBtn.style.left = '0';
                prevBtn.style.top = '5px';
                prevBtn.style.width = '32px';
                prevBtn.style.height = '32px';
                prevBtn.style.display = 'flex';
                prevBtn.style.alignItems = 'center';
                prevBtn.style.justifyContent = 'center';
                prevBtn.style.borderRadius = '50%';
                prevBtn.style.transition = 'background-color 0.2s ease';
                prevBtn.addEventListener('click', navigatePrevMonth);

                const nextBtn = document.createElement('button');
                nextBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
                nextBtn.className = 'calendar-nav-btn next-btn';
                nextBtn.style.background = 'none';
                nextBtn.style.border = 'none';
                nextBtn.style.cursor = 'pointer';
                nextBtn.style.position = 'absolute';
                nextBtn.style.right = '0';
                nextBtn.style.top = '5px';
                nextBtn.style.width = '32px';
                nextBtn.style.height = '32px';
                nextBtn.style.display = 'flex';
                nextBtn.style.alignItems = 'center';
                nextBtn.style.justifyContent = 'center';
                nextBtn.style.borderRadius = '50%';
                nextBtn.style.transition = 'background-color 0.2s ease';
                nextBtn.addEventListener('click', navigateNextMonth);

                // Add hover effect via style element
                const navButtonStyle = document.createElement('style');
                navButtonStyle.textContent = `
                    .calendar-nav-btn:not([disabled]):hover {
                        background-color: whitesmoke !important;
                    }
                `;
                document.head.appendChild(navButtonStyle);

                monthsContainer.appendChild(prevBtn);
                monthsContainer.appendChild(nextBtn);
            }

            // Append the months container to the calendar container
            calendarContainer.appendChild(monthsContainer);

            // Update navigation buttons only for desktop view
            if (!isMobile) {
                updateNavigationButtons();
            }
        }

        // Add a resize listener to handle view changes
        window.addEventListener('resize', () => {
            renderCalendars();
        });

        // Function to create a calendar for a specific month
        function createMonthCalendar(month, year) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-calendar';

            // Month header with navigation
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.style.textAlign = 'center';
            monthHeader.style.color = 'black';
            monthHeader.style.fontFamily = "'TT Fors', sans-serif";
            monthHeader.style.fontSize = '16px';
            monthHeader.style.fontWeight = '500';
            monthHeader.style.margin = '10px 0 20px 0';
            monthHeader.style.display = 'flex';
            monthHeader.style.justifyContent = 'center';
            monthHeader.style.alignItems = 'center';

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

            const monthNameSpan = document.createElement('span');
            monthNameSpan.textContent = `${monthNames[month]} ${year}`;
            monthHeader.appendChild(monthNameSpan);
            monthDiv.appendChild(monthHeader);

            // Days of week header
            const daysHeader = document.createElement('div');
            daysHeader.className = 'days-header';
            daysHeader.style.display = 'grid';
            daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
            daysHeader.style.textAlign = 'center';
            daysHeader.style.fontFamily = "'TT Fors', sans-serif";
            daysHeader.style.fontSize = '12px';
            daysHeader.style.color = '#6E6E73';
            daysHeader.style.marginBottom = '10px';

            const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            daysOfWeek.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.textContent = day;
                daysHeader.appendChild(dayDiv);
            });
            monthDiv.appendChild(daysHeader);

            // Calendar grid
            const calendarGrid = document.createElement('div');
            calendarGrid.className = 'calendar-grid';
            calendarGrid.style.display = 'grid';
            calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            calendarGrid.style.gap = '0px';

            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Get today's date for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Add empty cells for days before first day of month
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                emptyDay.style.height = '40px';
                calendarGrid.appendChild(emptyDay);
            }

            // Add cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                date.setHours(0, 0, 0, 0);

                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = day;
                dayCell.dataset.date = date.toISOString();
                dayCell.style.height = '42px';
                dayCell.style.width = '42px';
                dayCell.style.display = 'flex';
                dayCell.style.fontSize = '15px';
                dayCell.style.alignItems = 'center';
                dayCell.style.justifyContent = 'center';
                dayCell.style.cursor = 'pointer';
                dayCell.style.borderRadius = '12px';
                dayCell.style.margin = 'auto';

                // Style for past days - disable selection
                if (date < today) {
                    dayCell.style.color = '#D1D1D6';
                    dayCell.style.cursor = 'default';
                } else {
                    // Style for selected check-in date
                    if (tempSelectedDates.checkIn && date.getTime() === tempSelectedDates.checkIn.getTime()) {
                        dayCell.style.backgroundColor = '#1374E0';
                        dayCell.style.color = 'white';

                        // Apply full border radius if only check-in is selected, otherwise extend to full width
                        if (!tempSelectedDates.checkOut) {
                            dayCell.style.borderRadius = '12px'; // Full circle when only one date selected
                            dayCell.style.width = '42px';
                            dayCell.style.margin = 'auto';
                        } else {
                            dayCell.style.borderRadius = '12px 0 0 12px'; // Rounded on the left side only when range
                            dayCell.style.width = '100%'; // Extend to full width of the cell
                            dayCell.style.margin = '0'; // Remove margin to extend over padding
                            dayCell.style.maxWidth = 'none'; // Override any max-width constraints
                        }
                    }

                    // Style for selected check-out date
                    if (tempSelectedDates.checkOut && date.getTime() === tempSelectedDates.checkOut.getTime()) {
                        dayCell.style.backgroundColor = '#1374E0';
                        dayCell.style.color = 'white';

                        // Apply full border radius if only check-out is selected, otherwise extend to full width
                        if (!tempSelectedDates.checkIn) {
                            dayCell.style.borderRadius = '12px'; // Full circle when only one date selected
                            dayCell.style.width = '42px';
                            dayCell.style.margin = 'auto';
                        } else {
                            dayCell.style.borderRadius = '0 12px 12px 0'; // Rounded on the right side only when range
                            dayCell.style.width = '100%'; // Extend to full width of the cell
                            dayCell.style.margin = '0'; // Remove margin to extend over padding
                            dayCell.style.maxWidth = 'none'; // Override any max-width constraints
                        }
                    }

                    // Style for dates in between check-in and check-out
                    if (tempSelectedDates.checkIn && tempSelectedDates.checkOut &&
                        date > tempSelectedDates.checkIn && date < tempSelectedDates.checkOut) {
                        dayCell.style.backgroundColor = '#E5F2FF';
                        dayCell.style.borderRadius = '0';
                        dayCell.style.width = '100%'; // Extend to full width of the cell
                        dayCell.style.margin = '0'; // Remove margin to extend over padding
                        dayCell.style.maxWidth = 'none'; // Override any max-width constraints
                        // Add a slight padding to maintain text position
                        dayCell.style.paddingLeft = '0';
                        dayCell.style.paddingRight = '0';
                    }

                    // Add click event for future dates
                    dayCell.addEventListener('click', (e) => {
                        e.stopPropagation(); // Stop event propagation to prevent popup closing
                        handleDateClick(date);
                    });
                }

                calendarGrid.appendChild(dayCell);
            }

            monthDiv.appendChild(calendarGrid);
            return monthDiv;
        }

        // Add a new function to update calendar styles without re-rendering
        function updateCalendarStyles() {
            // Find all calendar day cells
            const dayElements = calendarContainer.querySelectorAll('.calendar-day');

            dayElements.forEach(dayElement => {
                const dateStr = dayElement.dataset.date;
                if (!dateStr) return;

                const date = new Date(dateStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Reset styles for all cells first
                if (date >= today) {
                    dayElement.style.backgroundColor = '';
                    dayElement.style.color = '';
                    dayElement.style.borderRadius = '12px';
                    dayElement.style.width = '42px';
                    dayElement.style.margin = 'auto';
                    dayElement.style.paddingLeft = '';
                    dayElement.style.paddingRight = '';
                    dayElement.style.maxWidth = '';
                }

                // Apply styles for selected dates
                if (tempSelectedDates.checkIn && date.getTime() === tempSelectedDates.checkIn.getTime()) {
                    dayElement.style.backgroundColor = '#1374E0';
                    dayElement.style.color = 'white';

                    if (!tempSelectedDates.checkOut) {
                        // Only check-in selected - keep it circular
                        dayElement.style.borderRadius = '12px';
                        dayElement.style.width = '42px';
                        dayElement.style.margin = 'auto';
                    } else {
                        // Part of a range - extend to full width and round left side only
                        dayElement.style.borderRadius = '12px 0 0 12px';
                        dayElement.style.width = '100%';
                        dayElement.style.margin = '0';
                        dayElement.style.maxWidth = 'none';
                    }
                }

                if (tempSelectedDates.checkOut && date.getTime() === tempSelectedDates.checkOut.getTime()) {
                    dayElement.style.backgroundColor = '#1374E0';
                    dayElement.style.color = 'white';

                    if (!tempSelectedDates.checkIn) {
                        // Only check-out selected - keep it circular
                        dayElement.style.borderRadius = '12px';
                        dayElement.style.width = '42px';
                        dayElement.style.margin = 'auto';
                    } else {
                        // Part of a range - extend to full width and round right side only
                        dayElement.style.borderRadius = '0 12px 12px 0';
                        dayElement.style.width = '100%';
                        dayElement.style.margin = '0';
                        dayElement.style.maxWidth = 'none';
                    }
                }

                // Apply styles for dates in between check-in and check-out
                if (tempSelectedDates.checkIn && tempSelectedDates.checkOut &&
                    date > tempSelectedDates.checkIn && date < tempSelectedDates.checkOut) {
                    dayElement.style.backgroundColor = '#E5F2FF';
                    dayElement.style.borderRadius = '0';
                    dayElement.style.width = '100%';
                    dayElement.style.margin = '0';
                    dayElement.style.maxWidth = 'none';
                    dayElement.style.paddingLeft = '0';
                    dayElement.style.paddingRight = '0';
                }
            });
        }

        // Handle date selection
        function handleDateClick(date) {
            // Stop the event from bubbling up to prevent popup from closing
            event.stopPropagation(); // Stop event propagation

            if (!selectingCheckOut) {
                // Selecting check-in date
                tempSelectedDates.checkIn = date;
                tempSelectedDates.checkOut = null;
                selectingCheckOut = true;

                // Update button text even with just one date selected
                updateDatesButtonText();
            } else {
                // Check if user is selecting the same date as check-in
                if (date.getTime() === tempSelectedDates.checkIn.getTime()) {
                    // Don't set checkout to the same day, just keep check-in selected
                    // and remain in checkout selection mode
                    return;
                }

                // Selecting check-out date
                if (date < tempSelectedDates.checkIn) {
                    // If selected date is before check-in, swap them
                    // This allows users to select checkout date first if they want
                    tempSelectedDates.checkOut = tempSelectedDates.checkIn;
                    tempSelectedDates.checkIn = date;
                } else {
                    // Normal check-out selection
                    tempSelectedDates.checkOut = date;
                }

                selectingCheckOut = false;

                // Update the button text
                updateDatesButtonText();
            }

            // Instead of re-rendering the entire calendar, just update the styles
            updateCalendarStyles();
        }

        // Update the dates button text
        function updateDatesButtonText() {
            if (tempSelectedDates.checkIn) {
                const checkInDate = formatDate(tempSelectedDates.checkIn);

                if (tempSelectedDates.checkOut) {
                    const checkOutDate = formatDate(tempSelectedDates.checkOut);
                    const formattedDates = `${checkInDate} - ${checkOutDate}`;
                    pendingSelections.dates = formattedDates;
                    updateButtonText(datesButtonText, formattedDates, defaultValues.dates);
                } else {
                    const formattedDate = `${checkInDate}`;
                    pendingSelections.dates = formattedDate;
                    updateButtonText(datesButtonText, formattedDate, defaultValues.dates);
                }
            } else {
                pendingSelections.dates = defaultValues.dates;
                updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);
            }
        }

        // Format date as MMM D (e.g., "Jan 15")
        function formatDate(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        }

        // Navigate to previous month
        function navigatePrevMonth() {
            // Get the current date's month and year for comparison
            const today = new Date();
            const currentRealMonth = today.getMonth();
            const currentRealYear = today.getFullYear();

            // Only allow navigation if not going before current month/year
            if (currentMonth > currentRealMonth || currentYear > currentRealYear) {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendars();
                updateNavigationButtons(); // Update button disabled states
            }
        }

        // Navigate to next month
        function navigateNextMonth() {
            // Calculate max allowed date (2 years from today)
            const today = new Date();
            const maxYear = today.getFullYear() + 2;
            const maxMonth = today.getMonth();

            // Only allow navigation if not exceeding 2 years from now
            // Adjust logic to account for showing two months at a time
            const nextMonthValue = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYearValue = currentMonth === 11 ? currentYear + 1 : currentYear;

            if ((nextYearValue < maxYear) ||
                (nextYearValue === maxYear && nextMonthValue < maxMonth)) {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendars();
                updateNavigationButtons(); // Update button disabled states
            }
        }

        // Function to update navigation button states
        function updateNavigationButtons() {
            const prevBtn = document.querySelector('.calendar-nav-btn.prev-btn');
            const nextBtn = document.querySelector('.calendar-nav-btn.next-btn');

            if (!prevBtn || !nextBtn) return;

            // Check if prev button should be disabled (at current month)
            const today = new Date();
            const currentRealMonth = today.getMonth();
            const currentRealYear = today.getFullYear();

            if (currentMonth === currentRealMonth && currentYear === currentRealYear) {
                prevBtn.disabled = true;
                prevBtn.style.opacity = '0.3';
                prevBtn.style.cursor = 'default';
            } else {
                prevBtn.disabled = false;
                prevBtn.style.opacity = '1';
                prevBtn.style.cursor = 'pointer';
            }

            // Check if next button should be disabled (at 2 years from now)
            const maxYear = today.getFullYear() + 2;
            const maxMonth = today.getMonth();

            // Calculate the second month that's being displayed
            const secondMonthValue = currentMonth === 11 ? 0 : currentMonth + 1;
            const secondYearValue = currentMonth === 11 ? currentYear + 1 : currentYear;

            // Disable next button when second month displayed reaches the max date
            if ((secondYearValue === maxYear && secondMonthValue >= maxMonth) ||
                secondYearValue > maxYear) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.3';
                nextBtn.style.cursor = 'default';
            } else {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            }
        }

        // Reset selected dates
        function resetDates() {
            tempSelectedDates = {
                checkIn: null,
                checkOut: null
            };
            selectedDates = { ...tempSelectedDates };
            selectingCheckOut = false;
            updateDatesButtonText();
            renderCalendars();
        }

        // Function to reset dates to previous state (without saving)
        function revertTempDateSelections() {
            // Revert the temporary selections back to the confirmed selections
            tempSelectedDates = {
                checkIn: selectedDates.checkIn ? new Date(selectedDates.checkIn) : null,
                checkOut: selectedDates.checkOut ? new Date(selectedDates.checkOut) : null
            };

            // Reset the selection mode based on current state
            selectingCheckOut = !(tempSelectedDates.checkIn && tempSelectedDates.checkOut);

            // Update button text to show confirmed dates
            if (selectedDates.checkIn) {
                const checkInDate = formatDate(selectedDates.checkIn);

                if (selectedDates.checkOut) {
                    const checkOutDate = formatDate(selectedDates.checkOut);
                    const formattedDates = `${checkInDate} - ${checkOutDate}`;
                    pendingSelections.dates = formattedDates;
                    updateButtonText(datesButtonText, formattedDates, defaultValues.dates);
                } else {
                    const formattedDate = `${checkInDate} - ?`;
                    pendingSelections.dates = formattedDate;
                    updateButtonText(datesButtonText, formattedDate, defaultValues.dates);
                }
            } else {
                pendingSelections.dates = defaultValues.dates;
                updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);
            }

            renderCalendars();
        }

        // Function to apply temporary selections
        function applyDateSelections() {
            // Update the confirmed selections with the temporary ones
            selectedDates = { ...tempSelectedDates };

            // Update currentSelections with both the formatted string and the actual date objects
            if (selectedDates.checkIn && selectedDates.checkOut) {
                currentSelections.dates = formatDateRange(selectedDates.checkIn, selectedDates.checkOut);
                // Add this line to store the actual Date objects
                currentSelections.selectedDatesObj = {
                    checkIn: selectedDates.checkIn,
                    checkOut: selectedDates.checkOut
                };
            } else {
                currentSelections.dates = defaultValues.dates;
                currentSelections.selectedDatesObj = null;
            }

            // Update pending selections
            pendingSelections.dates = currentSelections.dates;
            pendingSelections.selectedDatesObj = currentSelections.selectedDatesObj;

            // Update the button text
            updateDatesButtonText();
        }

        // Add click handler for dates popup background
        if (datesPopupBackground) {
            datesPopupBackground.addEventListener('click', function (e) {
                e.stopPropagation(); // Prevent event from bubbling

                // Revert any pending changes to the dates
                revertTempDateSelections();

                // Close all popups
                closeAllPopups();
            });
        }

        // When dates popup opens, restore any pending selections
        if (datesButton) {
            datesButton.addEventListener('click', function () {
                // Reset selection state when opening popup
                selectingCheckOut = false;

                // Always reset to current month if no dates are selected
                if (pendingSelections.dates === defaultValues.dates) {
                    // Reset to current month/year
                    const today = new Date();
                    currentMonth = today.getMonth();
                    currentYear = today.getFullYear();

                    // Ensure temp selections are reset
                    tempSelectedDates = {
                        checkIn: null,
                        checkOut: null
                    };
                } else {
                    // Parse dates from current selection if not default
                    const dateRangeMatch = pendingSelections.dates.match(/([A-Za-z]+)\s+(\d+)\s+-\s+([A-Za-z]+)\s+(\d+)/);

                    if (dateRangeMatch) {
                        const months = {
                            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                        };

                        const checkInMonth = months[dateRangeMatch[1]];
                        const checkInDay = parseInt(dateRangeMatch[2]);
                        const checkOutMonth = months[dateRangeMatch[3]];
                        const checkOutDay = parseInt(dateRangeMatch[4]);

                        // Determine year (handle Dec-Jan transitions)
                        let checkInYear = currentYear;
                        let checkOutYear = currentYear;

                        if (checkInMonth > currentMonth + 5) checkInYear--;
                        if (checkOutMonth > currentMonth + 5) checkOutYear--;
                        if (checkInMonth < currentMonth - 5) checkInYear++;
                        if (checkOutMonth < currentMonth - 5) checkOutYear++;

                        selectedDates.checkIn = new Date(checkInYear, checkInMonth, checkInDay);
                        selectedDates.checkOut = new Date(checkOutYear, checkOutMonth, checkOutDay);

                        // Also update temp selections
                        tempSelectedDates = { ...selectedDates };

                        selectingCheckOut = false;

                        // Set current month to show check-in date
                        currentMonth = checkInMonth;
                        currentYear = checkInYear;
                    }
                }

                renderCalendars();
            });
        }

        // Add search button click handler to confirm date selections
        if (searchButton) {
            const originalSearchClickHandler = searchButton.onclick;
            searchButton.onclick = function (e) {
                console.log("Dates search handler executing");

                // Check if dates popup is open and selection is incomplete
                if (datesPopup && datesPopup.style.display === 'flex' &&
                    ((tempSelectedDates.checkIn && !tempSelectedDates.checkOut) ||
                        (!tempSelectedDates.checkIn && tempSelectedDates.checkOut))) {


                    // Reset to default or previously confirmed complete selection
                    if (selectedDates.checkIn && selectedDates.checkOut) {
                        // Revert to previous valid selection
                        tempSelectedDates = {
                            checkIn: new Date(selectedDates.checkIn),
                            checkOut: new Date(selectedDates.checkOut)
                        };
                        selectingCheckOut = false;

                        // Update button text to show confirmed dates
                        const checkInDate = formatDate(selectedDates.checkIn);
                        const checkOutDate = formatDate(selectedDates.checkOut);
                        const formattedDates = `${checkInDate} - ${checkOutDate}`;
                        pendingSelections.dates = formattedDates;
                        updateButtonText(datesButtonText, formattedDates, defaultValues.dates);

                    } else {
                        // Reset everything to default
                        tempSelectedDates = {
                            checkIn: null,
                            checkOut: null
                        };
                        selectingCheckOut = false;
                        pendingSelections.dates = defaultValues.dates;
                        updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);


                    }

                    // Still close the popup but don't update the currentSelections
                    closeAllPopups();

                    // Don't call the original handler to prevent the search from executing
                    return;
                }

                // If we have both dates selected, apply them
                if (tempSelectedDates.checkIn && tempSelectedDates.checkOut) {
                    // Apply date selections
                    applyDateSelections();

                    // Confirm the pending date selections
                    if (pendingSelections.dates) {
                        currentSelections.dates = pendingSelections.dates;
                    }

                }

                // Always call original handler unless we specifically returned earlier
                if (originalSearchClickHandler) {
                    originalSearchClickHandler.call(this, e);
                }
            };
        }

        // Override revertPendingChanges to reset date selections if needed
        const originalRevertFunction = revertPendingChanges;
        revertPendingChanges = function () {
            // Call original revert function
            originalRevertFunction();

            // Reset date selection state to match current confirmed selections
            if (currentSelections.dates === defaultValues.dates) {
                selectedDates = {
                    checkIn: null,
                    checkOut: null
                };
                tempSelectedDates = {
                    checkIn: null,
                    checkOut: null
                };
                selectingCheckOut = false;
            } else {
                // Try to parse the current selection dates
                const dateRangeMatch = currentSelections.dates.match(/([A-Za-z]+)\s+(\d+)\s+-\s+([A-Za-z]+)\s+(\d+)/);

                if (dateRangeMatch) {
                    const months = {
                        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    };

                    const checkInMonth = months[dateRangeMatch[1]];
                    const checkInDay = parseInt(dateRangeMatch[2]);
                    const checkOutMonth = months[dateRangeMatch[3]];
                    const checkOutDay = parseInt(dateRangeMatch[4]);

                    // Determine year (handle Dec-Jan transitions)
                    let checkInYear = currentYear;
                    let checkOutYear = currentYear;

                    if (checkInMonth > currentMonth + 5) checkInYear--;
                    if (checkOutMonth > currentMonth + 5) checkOutYear--;
                    if (checkInMonth < currentMonth - 5) checkInYear++;
                    if (checkOutMonth < currentMonth - 5) checkOutYear++;

                    selectedDates = {
                        checkIn: new Date(checkInYear, checkInMonth, checkInDay),
                        checkOut: new Date(checkOutYear, checkOutMonth, checkOutDay)
                    };
                    tempSelectedDates = {
                        checkIn: new Date(checkInYear, checkInMonth, checkInDay),
                        checkOut: new Date(checkOutYear, checkOutMonth, checkOutDay)
                    };

                    selectingCheckOut = false;
                }
            }

            if (calendarContainer.style.display !== 'none') {
                renderCalendars();
            }
        };

        // Day cells themselves should also stop propagation
        const dayClickHandler = (e, date) => {
            e.stopPropagation(); // Stop event propagation
            handleDateClick(date);
        };

        // Make the entire calendar container stop propagation to prevent popup closing
        calendarContainer.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // Initialize the calendar
        renderCalendars();

        // Add clear button functionality
        const clearButton = document.querySelector('[data-element="navBarSearch_datesPopup_clearButton_calendarContainer"]');
        if (clearButton) {
            clearButton.addEventListener('click', function (e) {
                // Prevent event from bubbling up
                e.stopPropagation();

                // Clear temporary selections
                tempSelectedDates = {
                    checkIn: null,
                    checkOut: null
                };

                // Reset selection mode
                selectingCheckOut = false;

                // Update button text to default
                pendingSelections.dates = defaultValues.dates;
                updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);

                // Reset to current month/year
                const today = new Date();
                currentMonth = today.getMonth();
                currentYear = today.getFullYear();

                // Re-render calendar with cleared selections
                renderCalendars();
            });
        }
    }

    // Add this after the existing variables and before the filter system setup

    // ADD THIS: Responsive navigation setup
    function setupResponsiveNavigation() {
        // ADD THIS: Layout styles for map and listings containers
        // Add this right after the setupResponsiveNavigation function

        // Add layout CSS for map and listings containers
        const mapListingsLayoutStyles = document.createElement('style');
        mapListingsLayoutStyles.textContent = `
    @media screen and (min-width: 992px) {
        [data-element="map-container"] {
            display: flex !important;
            width: 40% !important;
        }

        [data-element="listings-container-wrapper"] {
            display: flex !important;
            width: 60% !important;
        }
    }

    /* Make Nav Bar logo hide if less than 360px */
    @media screen and (max-width: 360px) {
        [data-element="LogoNavBar"] {
            display: none !important;
        }
    }
    
    /* Make listing-card-extras-container flex vertically between 990px and 1250px */
    @media screen and (max-width: 1250px) and (min-width: 990px) {
        [data-element="listing-card-extras-container"] {
            flex-direction: column !important;
            display: flex !important;
        }
    }
    /* And also for less than 480px */
    @media screen and (max-width: 480px) {
        [data-element="listing-card-extras-container"] {
            flex-direction: column !important;
            display: flex !important;
        }
    }
`;
        document.head.appendChild(mapListingsLayoutStyles);

        // Function to ensure layout is applied only when width > 991px
        function ensureProperLayout() {
            const mapContainer = document.querySelector('[data-element="map-container"]');
            const listingsWrapper = document.querySelector('[data-element="listings-container-wrapper"]');

            if (window.innerWidth > 991) {
                if (mapContainer) {
                    mapContainer.style.display = 'flex';
                    mapContainer.style.width = '40%';
                }
                if (listingsWrapper) {
                    listingsWrapper.style.display = 'flex';
                    listingsWrapper.style.width = '60%';
                }
            } else {
                // Remove our inline styles when width <= 991px to let HTML handle it
                if (mapContainer) {
                    mapContainer.style.removeProperty('display');
                    mapContainer.style.removeProperty('width');
                }
                if (listingsWrapper) {
                    listingsWrapper.style.removeProperty('display');
                    listingsWrapper.style.removeProperty('width');
                }
            }
        }

        // Apply layout immediately
        ensureProperLayout();

        // Apply layout on window resize
        window.addEventListener('resize', ensureProperLayout);

        // Add responsive CSS
        const responsiveNavStyles = document.createElement('style');
        responsiveNavStyles.textContent = `
        /* Desktop view - show normal nav bar */
        @media screen and (min-width: 992px) {
            [data-element="navBar_Container"] {
                display: flex !important;
            }
            
            [data-element="navBar_PhoneViewContainer"] {
                display: none !important;
            }
        }
        
        /* Mobile/Tablet view - show phone view */
        @media screen and (max-width: 991px) {
            [data-element="navBar_Container"] {
                display: none !important;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                background: white;
                flex-direction: column;
                padding: 20px;
                overflow-y: auto;
            }
            
            [data-element="navBar_Container"].show-mobile-popup {
                display: flex !important;
            }
            
            [data-element="navBar_PhoneViewContainer"] {
                display: flex !important;
                cursor: pointer;
            }
            
            /* Make search popups full screen on mobile */
            [data-element="navBarSearch_typePopup"],
            [data-element="navBarSearch_locationPopup"],
            [data-element="navBarSearch_datesPopup"],
            [data-element="navBarSearch_guestsPopup"] {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10001 !important;
            }
        }
    `;
        document.head.appendChild(responsiveNavStyles);

        // Get phone view elements
        const phoneViewContainer = document.querySelector('[data-element="navBar_PhoneViewContainer"]');
        const phoneViewLocation = document.querySelector('[data-element="navBar_PhoneViewLocation"]');
        const phoneViewDatesGuests = document.querySelector('[data-element="navBar_PhoneViewDatesGuests"]');
        const navBarContainer = document.querySelector('[data-element="navBar_Container"]');

        if (!phoneViewContainer || !phoneViewLocation || !phoneViewDatesGuests || !navBarContainer) {
            return;
        }

        // Function to update phone view content
        function updatePhoneViewContent() {
            // Update location
            if (currentSelections.location === defaultValues.location) {
                phoneViewLocation.textContent = "Where to?";
            } else {
                phoneViewLocation.textContent = currentSelections.location;
            }

            // Update dates and guests
            const hasCustomDates = currentSelections.dates !== defaultValues.dates;
            const hasCustomGuests = currentSelections.guests !== defaultValues.guests;
            const hasCustomType = currentSelections.type !== defaultValues.type;

            if (!hasCustomDates && !hasCustomGuests && !hasCustomType) {
                // Default search - hide dates/guests
                phoneViewDatesGuests.style.display = 'none';
            } else {
                // Show dates/guests
                phoneViewDatesGuests.style.display = '';

                let datesGuestsText = '';

                if (hasCustomType) {
                    const typeStr = (currentSelections.type || '').toLowerCase();
                    if (typeStr.includes('boat')) {
                        datesGuestsText += '🛥️';
                    }
                    if (typeStr.includes('charter')) {
                        datesGuestsText += '🎣';
                    }
                }

                if (hasCustomDates) {
                    if (datesGuestsText) datesGuestsText += ' • ';
                    datesGuestsText += currentSelections.dates;
                }

                if (hasCustomGuests) {
                    if (datesGuestsText) datesGuestsText += ' • ';
                    datesGuestsText += currentSelections.guests;
                }

                phoneViewDatesGuests.textContent = datesGuestsText;
            }
        }

        // Function to show mobile popup
        function showMobilePopup() {
            navBarContainer.classList.add('show-mobile-popup');
            // Note: Scroll blocking removed - background scrolling allowed
        }

        // Function to hide mobile popup
        function hideMobilePopup() {
            navBarContainer.classList.remove('show-mobile-popup');
            // Note: Scroll blocking removed - background scrolling allowed
        }

        // Add click handler to phone view container
        phoneViewContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            showMobilePopup();
        });

        // Add click handler to close mobile popup when clicking outside search elements
        navBarContainer.addEventListener('click', (e) => {
            // Don't close if clicking on search buttons or their children
            if (e.target.closest('[data-element="navBarSearch_typeButton"]') ||
                e.target.closest('[data-element="navBarSearch_locationButton"]') ||
                e.target.closest('[data-element="navBarSearch_datesButton"]') ||
                e.target.closest('[data-element="navBarSearch_guestsButton"]') ||
                e.target.closest('[data-element="navBarSearch_searchButton"]')) {
                return;
            }

            // Close popup if clicking outside search area
            hideMobilePopup();
        });

        // Override the existing closeAllPopups function to handle mobile
        const originalCloseAllPopups = closeAllPopups;
        closeAllPopups = function () {
            // Call original function
            originalCloseAllPopups();

            // Hide mobile popup if on mobile
            if (window.innerWidth <= 991) {
                hideMobilePopup();
            }

            // Note: Scroll blocking removed - background scrolling allowed
        };

        // // Override the search button click to close mobile popup
        // if (searchButton) {
        //     const originalSearchClick = searchButton.onclick;
        //     searchButton.onclick = function (e) {
        //         // Call original handler
        //         if (originalSearchClick) {
        //             originalSearchClick.call(this, e);
        //         }

        //         // Close mobile popup after search
        //         if (window.innerWidth <= 991) {
        //             hideMobilePopup();
        //         }

        //         // Update phone view content after search
        //         updatePhoneViewContent();
        //     };
        // }

        // Update phone view content initially and when selections change
        updatePhoneViewContent();

        // Add resize listener to handle orientation changes
        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) {
                // Desktop view - make sure mobile popup is hidden
                hideMobilePopup();
            }
            updatePhoneViewContent();
        });

        // Override the existing revertPendingChanges to update phone view
        const originalRevertPendingChanges = revertPendingChanges;
        revertPendingChanges = function () {
            originalRevertPendingChanges();
            updatePhoneViewContent();
        };

        // ADD THIS: Enhanced mobile navigation with new buttons
        // Add this inside the setupResponsiveNavigation function, after the existing code

        // Get the new mobile navigation buttons
        const navBarCloseButton = document.querySelector('[data-element="navBarSearch_closeButton"]');
        const navBarClearButton = document.querySelector('[data-element="navBarSearch_clearButton"]');
        const phoneViewSearchButton = document.querySelector('[data-element="navBarSearch_phone_searchButton"]');

        // Type popup buttons
        const typePopupCloseButton = document.querySelector('[data-element="navBarSearch_typePopup_closeButton"]');
        const typePopupNextButton = document.querySelector('[data-element="navBarSearch_typePopup_nextButton"]');

        // Location popup buttons
        const locationPopupCloseButton = document.querySelector('[data-element="navBarSearch_locationPopup_closeButton"]');
        const locationPopupNextButton = document.querySelector('[data-element="navBarSearch_locationPopup_nextButton"]');

        // Dates popup buttons
        const datesPopupCloseButton = document.querySelector('[data-element="navBarSearch_datesPopup_closeButton"]');
        const datesPopupNextButton = document.querySelector('[data-element="navBarSearch_datesPopup_nextButton"]');

        // Guests popup buttons
        const guestsPopupCloseButton = document.querySelector('[data-element="navBarSearch_guestsPopup_closeButton"]');
        const guestsPopupSearchButton = document.querySelector('[data-element="navBarSearch_guestsPopup_searchButton"]');



        // Function to reset to default values (for clear button)
        function resetToDefaults() {
            // Reset pending selections to defaults
            pendingSelections.type = defaultValues.type;
            pendingSelections.location = defaultValues.location;
            pendingSelections.dates = defaultValues.dates;
            pendingSelections.guests = defaultValues.guests;
            pendingSelections.selectedDatesObj = { checkIn: null, checkOut: null };
            pendingSelections.guestDetails = null;

            // Update button texts to show defaults
            updateButtonText(typeButtonText, defaultValues.type, defaultValues.type);
            updateButtonText(locationButtonText, defaultValues.location, defaultValues.location);
            updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);
            updateButtonText(guestsButtonText, defaultValues.guests, defaultValues.guests);

            // Reset type popup visual state
            if (typeof typePopupHandlers !== 'undefined' && typePopupHandlers.updateTypeSelectionVisual) {
                const privateHomeEl = document.querySelector('[data-element="navBarSearch_typePopup_privateHome"]');
                const boatSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_boatRentalSelected"]');
                const boatNotSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_boatRentalNotSelected"]');
                const fishSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_fishingCharterSelected"]');
                const fishNotSelectedEl = document.querySelector('[data-element="navBarSearch_typePopup_fishingCharterNotSelected"]');

                if (privateHomeEl) privateHomeEl.classList.add('selected');
                if (boatSelectedEl) boatSelectedEl.style.display = 'none';
                if (boatNotSelectedEl) boatNotSelectedEl.style.display = 'flex';
                if (fishSelectedEl) fishSelectedEl.style.display = 'none';
                if (fishNotSelectedEl) fishNotSelectedEl.style.display = 'flex';
            }

            // Reset location input
            const locationInput = document.querySelector('[data-element="navBarSearch_locationPopup_input"]');
            if (locationInput) {
                locationInput.value = '';
                locationInput.placeholder = "Enter location";
            }

            // Reset dates calendar if needed
            const calendarContainer = document.querySelector('[data-element="navBarSearch_datesPopup_calendarContainer"]');
            if (calendarContainer) {
                // This will trigger the dates popup reset logic
                const clearButton = document.querySelector('[data-element="navBarSearch_datesPopup_clearButton_calendarContainer"]');
                if (clearButton) {
                    clearButton.click();
                }
            }

            // Reset guests popup
            const guestsClearButton = document.querySelector('[data-element="navBarSearch_guestsPopup_clearButton"]');
            if (guestsClearButton) {
                guestsClearButton.click();
            }

            // Update phone view
            updatePhoneViewContent();
        }

        // Function to navigate to next popup in sequence
        function navigateToNextPopup(currentPopup, nextPopup) {
            // Hide current popup
            if (currentPopup) {
                currentPopup.style.display = 'none';
            }

            // Show next popup
            if (nextPopup) {
                nextPopup.style.display = 'flex';

                // Handle special cases for popup initialization
                if (nextPopup === locationPopup) {
                    // Focus on location input when opening location popup
                    const locationInput = document.querySelector('[data-element="navBarSearch_locationPopup_input"]');
                    if (locationInput) {
                        setTimeout(() => {
                            locationInput.focus();
                        }, 100);
                    }
                }
            }
        }

        // Add event handlers for navBar_Container level buttons
        if (navBarCloseButton) {
            navBarCloseButton.addEventListener('click', (e) => {
                e.stopPropagation();
                hideMobilePopup();

                // Revert any pending changes
                revertPendingChanges();
            });
        }

        if (navBarClearButton) {
            navBarClearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                resetToDefaults();
            });
        }

        // // Override the main search button to hide container on success
        // if (searchButton) {
        //     const existingSearchClick = searchButton.onclick;
        //     searchButton.onclick = async function (e) {
        //         e.preventDefault();
        //         e.stopPropagation();

        //         // Call the existing search logic
        //         if (existingSearchClick) {
        //             await existingSearchClick.call(this, e);
        //         }

        //         // Hide mobile popup after successful search
        //         if (window.innerWidth <= 991) {
        //             hideMobilePopup();
        //         }

        //         // Update phone view content
        //         updatePhoneViewContent();
        //     };
        // }

        // Type popup button handlers
        if (typePopupCloseButton) {
            typePopupCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // // Revert pending type changes to last confirmed selection
                // if (typeof typePopupHandlers !== 'undefined' && typePopupHandlers.updateTypeSelectionVisual) {
                //     typePopupHandlers.updateTypeSelectionVisual();
                // }

                // Only hide this specific popup, don't close entire container
                if (typePopup) typePopup.style.display = 'none';

                // Remove selected class from type button
                if (typeButton) typeButton.classList.remove('selected');

                // Note: Scroll blocking removed - background scrolling allowed

                return false;
            });
        }

        if (typePopupNextButton) {
            typePopupNextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToNextPopup(typePopup, locationPopup);
                // Remove selected class from type button
                if (typeButton) typeButton.classList.remove('selected');
            });
        }

        // Location popup button handlers
        if (locationPopupCloseButton) {
            locationPopupCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ADD THIS to prevent all other handlers

                // Only hide this specific popup, don't close entire container
                if (locationPopup) locationPopup.style.display = 'none';

                // Remove selected class from location button
                if (locationButton) locationButton.classList.remove('selected');

                // Note: Scroll blocking removed - background scrolling allowed

                // Don't revert changes - keep temp selections
                return false; // ADD THIS to prevent further event handling
            });
        }

        if (locationPopupNextButton) {
            locationPopupNextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToNextPopup(locationPopup, datesPopup);
                // Remove selected class from location button
                if (locationButton) locationButton.classList.remove('selected');
            });
        }

        // Dates popup button handlers
        if (datesPopupCloseButton) {
            datesPopupCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ADD THIS to prevent all other handlers

                // Only hide this specific popup, don't close entire container
                if (datesPopup) datesPopup.style.display = 'none';

                // Remove selected class from dates button
                if (datesButton) datesButton.classList.remove('selected');

                // Note: Scroll blocking removed - background scrolling allowed

                // Don't revert changes - keep temp selections
                return false; // ADD THIS to prevent further event handling
            });
        }

        if (datesPopupNextButton) {
            datesPopupNextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToNextPopup(datesPopup, guestsPopup);
                // Remove selected class from dates button
                if (datesButton) datesButton.classList.remove('selected');
            });
        }

        // Guests popup button handlers
        if (guestsPopupCloseButton) {
            guestsPopupCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // ADD THIS to prevent all other handlers

                // Only hide this specific popup, don't close entire container
                if (guestsPopup) guestsPopup.style.display = 'none';

                // Remove selected class from guests container
                if (guestsSearchContainer) guestsSearchContainer.classList.remove('selected');

                // Note: Scroll blocking removed - background scrolling allowed

                // Don't revert changes - keep temp selections
                return false; // ADD THIS to prevent further event handling
            });
        }

        if (guestsPopupSearchButton) {
            guestsPopupSearchButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Update current selections from pending (same logic as main search button)
                if (pendingSelections.location === defaultValues.location) {
                    currentSelections.location = defaultValues.location;
                } else {
                    currentSelections.location = pendingSelections.location;
                }

                if (pendingSelections.dates === defaultValues.dates) {
                    currentSelections.dates = defaultValues.dates;
                } else {
                    currentSelections.dates = pendingSelections.dates;
                }

                if (pendingSelections.guests === defaultValues.guests) {
                    currentSelections.guests = defaultValues.guests;
                } else {
                    currentSelections.guests = pendingSelections.guests;
                }

                if (pendingSelections.type === defaultValues.type) {
                    currentSelections.type = defaultValues.type;
                    currentSelections.typeFlags = { boatRental: false, fishingCharter: false };
                } else {
                    currentSelections.type = pendingSelections.type;
                    if (pendingSelections.typeFlags) {
                        currentSelections.typeFlags = { ...pendingSelections.typeFlags };
                    } else {
                        const str = (pendingSelections.type || '').toLowerCase();
                        currentSelections.typeFlags = {
                            boatRental: str.includes('boat'),
                            fishingCharter: str.includes('charter') || str.includes('fishing')
                        };
                    }
                }

                // Copy selected dates object if available
                if (pendingSelections.selectedDatesObj) {
                    currentSelections.selectedDatesObj = pendingSelections.selectedDatesObj;
                }

                // Copy guest details if available
                if (pendingSelections.guestDetails) {
                    currentSelections.guestDetails = pendingSelections.guestDetails;
                }

                // Update API formats based on current selections
                await updateAPIFormats();

                // Update extras visibility based on type selections
                updateExtrasVisibility();

                // Phase 4: Update price filter when search state changes
                if (typeof filterSystem !== 'undefined' && filterSystem.updatePriceFilter) {
                    filterSystem.updatePriceFilter();
                }

                // Fetch property search results
                const searchResults = await fetchPropertySearchResults();

                // Handle search results
                if (!searchResults?.error) {
                    localStorage.setItem('propertySearchResults', JSON.stringify(searchResults));
                } else {
                }

                // Update listing cards with new extras state and pricing
                const filtered = filterSystem ? filterSystem.applyFilters(unfilteredListings) : unfilteredListings;
                renderListingCards(filtered, false, 1);
                updateMarkersVisibilityWithFilters(filtered);

                // Update badges if needed (boat/charter)
                updateBoatBadgeForAllVisibleCards(filtered);
                updateCharterBadgeForAllVisibleCards(filtered);

                // Close guests popup and hide mobile container
                if (guestsPopup) guestsPopup.style.display = 'none';
                hideMobilePopup();

                // Update phone view content
                updatePhoneViewContent();
            });
        }

        if (phoneViewSearchButton) {
            phoneViewSearchButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Update current selections from pending (same logic as main search button)
                if (pendingSelections.location === defaultValues.location) {
                    currentSelections.location = defaultValues.location;
                } else {
                    currentSelections.location = pendingSelections.location;
                }

                if (pendingSelections.dates === defaultValues.dates) {
                    currentSelections.dates = defaultValues.dates;
                } else {
                    currentSelections.dates = pendingSelections.dates;
                }

                if (pendingSelections.guests === defaultValues.guests) {
                    currentSelections.guests = defaultValues.guests;
                } else {
                    currentSelections.guests = pendingSelections.guests;
                }

                if (pendingSelections.type === defaultValues.type) {
                    currentSelections.type = defaultValues.type;
                    currentSelections.typeFlags = { boatRental: false, fishingCharter: false };
                } else {
                    currentSelections.type = pendingSelections.type;
                    if (pendingSelections.typeFlags) {
                        currentSelections.typeFlags = { ...pendingSelections.typeFlags };
                    } else {
                        const str = (pendingSelections.type || '').toLowerCase();
                        currentSelections.typeFlags = {
                            boatRental: str.includes('boat'),
                            fishingCharter: str.includes('charter') || str.includes('fishing')
                        };
                    }
                }

                // Copy selected dates object if available
                if (pendingSelections.selectedDatesObj) {
                    currentSelections.selectedDatesObj = pendingSelections.selectedDatesObj;
                }

                // Copy guest details if available
                if (pendingSelections.guestDetails) {
                    currentSelections.guestDetails = pendingSelections.guestDetails;
                }

                // Update API formats based on current selections
                await updateAPIFormats();

                // Update extras visibility based on type selections
                updateExtrasVisibility();

                // Phase 4: Update price filter when search state changes
                if (typeof filterSystem !== 'undefined' && filterSystem.updatePriceFilter) {
                    filterSystem.updatePriceFilter();
                }

                // Fetch property search results
                const searchResults = await fetchPropertySearchResults();

                // Handle search results
                if (!searchResults?.error) {
                    localStorage.setItem('propertySearchResults', JSON.stringify(searchResults));
                } else {
                }

                // Update listing cards with new extras state and pricing
                const filtered = filterSystem ? filterSystem.applyFilters(unfilteredListings) : unfilteredListings;
                renderListingCards(filtered, false, 1);
                updateMarkersVisibilityWithFilters(filtered);

                // Update badges if needed (boat/charter)
                updateBoatBadgeForAllVisibleCards(filtered);
                updateCharterBadgeForAllVisibleCards(filtered);

                // Close all popups after search is clicked
                closeAllPopups();

                hideMobilePopup();

                // Update phone view content
                updatePhoneViewContent();
            });
        }

        // Add CSS to hide these buttons on desktop
        const mobileButtonStyles = document.createElement('style');
        mobileButtonStyles.textContent = `
    @media screen and (min-width: 992px) {
        [data-element="navBarSearch_closeButton"],
        [data-element="navBarSearch_clearButton"],
        [data-element="navBarSearch_typePopup_closeButton"],
        [data-element="navBarSearch_typePopup_nextButton"],
        [data-element="navBarSearch_locationPopup_closeButton"],
        [data-element="navBarSearch_locationPopup_nextButton"],
        [data-element="navBarSearch_datesPopup_closeButton"],
        [data-element="navBarSearch_datesPopup_nextButton"],
        [data-element="navBarSearch_guestsPopup_closeButton"],
        [data-element="navBarSearch_guestsPopup_searchButton"] {
            display: none !important;
        }
    }
    
    @media screen and (max-width: 991px) {
        [data-element="navBarSearch_closeButton"],
        [data-element="navBarSearch_clearButton"],
        [data-element="navBarSearch_typePopup_closeButton"],
        [data-element="navBarSearch_typePopup_nextButton"],
        [data-element="navBarSearch_locationPopup_closeButton"],
        [data-element="navBarSearch_locationPopup_nextButton"],
        [data-element="navBarSearch_datesPopup_closeButton"],
        [data-element="navBarSearch_datesPopup_nextButton"],
        [data-element="navBarSearch_guestsPopup_closeButton"],
        [data-element="navBarSearch_guestsPopup_searchButton"] {
            display: flex !important;
        }
    }
`;
        document.head.appendChild(mobileButtonStyles);

        // Return update function for external use
        return {
            updatePhoneView: updatePhoneViewContent,
            showPopup: showMobilePopup,
            hidePopup: hideMobilePopup
        };



    }

    // ADD THIS: Call the setup function after the existing setup
    const responsiveNav = setupResponsiveNavigation();

    // ADD THIS: Update phone view whenever selections change
    // Override updateButtonText to also update phone view
    const originalUpdateButtonText = updateButtonText;
    updateButtonText = function (textElement, newValue, defaultValue) {
        originalUpdateButtonText(textElement, newValue, defaultValue);

        // Update phone view content when any button text changes
        if (responsiveNav && responsiveNav.updatePhoneView) {
            responsiveNav.updatePhoneView();
        }
    };

    // Initialize the popups
    const typePopupHandlers = setupTypePopup();
    setupLocationPopup();
    setupDatesPopup();
    setupGuestsPopup();

    /***** BOAT MODULE (boats only; charter-ready shape) *****/
    const boatModule = (() => {
        // Public "enabled" flag (toggle from your "Type" UI)
        let enabled = false;

        // Active filters that apply to boats (applied state)
        const filters = {
            days: 0.5,                    // 0.5 for half day, 1+ for full days
            passengers: 1,                // minimum passengers/capacity
            dockDelivery: false,          // if true, must deliver to listing's city
            selectedDates: [],            // array of selected date strings
            lengthType: 'half',           // 'half' or 'full'
            boatTypes: []                // array of selected boat types ["Center Console", "Pontoon", etc.]
        };

        // Pending filters (being edited in modal)
        const pendingFilters = {
            days: 0.5,
            passengers: 1,
            dockDelivery: false,
            selectedDates: [],
            lengthType: 'half',
            boatTypes: []
        };

        // Preindexed data
        const boatsByListingId = new Map(); // listingId -> Boat[]

        // --- Utils ---
        const lc = s => String(s ?? "").trim().toLowerCase();
        const getCity = v => {
            // For listings, try different city field names
            if (v?.listing_city) return lc(v.listing_city);
            if (v?.city) return lc(v.city);
            if (v?.locationCity) return lc(v.locationCity);
            if (v?.pickupCity) return lc(v.pickupCity);

            // For boats, check if it has _boatcompany with service cities
            if (v?._boatcompany) {
                // Try to get the primary service city (usually servicesTo_city1)
                for (let i = 1; i <= 10; i++) {
                    const cityField = `servicesTo_city${i}`;
                    if (v._boatcompany[cityField] && typeof v._boatcompany[cityField] === 'string' && v._boatcompany[cityField].trim()) {
                        return lc(v._boatcompany[cityField]);
                    }
                }
            }

            return "";
        };
        const priceNum = v => Number(v || 0);
        const hasArr = a => Array.isArray(a) && a.length > 0;

        // Helper function to get all service cities for a boat
        const getBoatServiceCities = (boat) => {
            const cities = [];
            if (boat?._boatcompany) {
                for (let i = 1; i <= 10; i++) {
                    const cityField = `servicesTo_city${i}`;
                    if (boat._boatcompany[cityField] && typeof boat._boatcompany[cityField] === 'string' && boat._boatcompany[cityField].trim()) {
                        cities.push(lc(boat._boatcompany[cityField]));
                    }
                }
            }
            return cities;
        };

        // Helper function to check if boat can service a specific city
        // If useDeliveryCities is true, allow delivery cities; otherwise, only primary/service cities
        const checkBoatServicesCity = (boat, targetCity, useDeliveryCities = false) => {
            const normalizedTarget = lc(targetCity);
            const serviceCities = getBoatServiceCities(boat);
            const primaryCity = getCity(boat);
            const inPrimaryOrService = normalizedTarget === primaryCity || serviceCities.includes(normalizedTarget);

            if (inPrimaryOrService) return true;

            if (useDeliveryCities) {
                const deliveryCities = (boat?._boatcompany?.privateDockDeliveryCity || []).map(cityObj => lc(cityObj?.city || ""));
                return deliveryCities.includes(normalizedTarget);
            }

            return false;
        };

        // Very simple YMD overlap helpers; adapt to your real availability
        const isDateRangeBlocked = (checkInYMD, checkOutYMD, blockedRanges = []) => {
            if (!checkInYMD || !checkOutYMD || !hasArr(blockedRanges)) return false;
            // TODO: replace with your real overlap logic
            return false;
        };

        // --- Build index once per results load ---
        function buildIndex(listings, allBoats) {

            boatsByListingId.clear();
            if (!Array.isArray(listings) || !Array.isArray(allBoats)) {
                return;
            }

            // Group listings by normalized city
            const cityToListingIds = new Map();
            for (const l of listings) {
                const c = getCity(l);
                if (!cityToListingIds.has(c)) cityToListingIds.set(c, []);
                cityToListingIds.get(c).push(l.id);
            }

            // Attach boats by city match (or delivery cities)
            for (const boat of allBoats) {
                // Get all service cities for this boat (from commented code logic)
                const serviceCities = [];
                if (boat?._boatcompany) {
                    for (let i = 1; i <= 10; i++) {
                        const cityField = `servicesTo_city${i}`;
                        if (boat._boatcompany[cityField] && typeof boat._boatcompany[cityField] === 'string' && boat._boatcompany[cityField].trim()) {
                            serviceCities.push(lc(boat._boatcompany[cityField]));
                        }
                    }
                }

                const boatCity = getCity(boat);
                const deliveryCities = (boat?._boatcompany?.privateDockDeliveryCity || []).map(cityObj => lc(cityObj?.city || ""));


                // candidate listing ids = primary city + all service cities + all delivery cities
                const candidateListingIds = new Set([
                    ...(cityToListingIds.get(boatCity) || []),
                    ...serviceCities.flatMap(sc => cityToListingIds.get(sc) || []),
                    ...deliveryCities.flatMap(dc => cityToListingIds.get(dc) || []),
                ]);


                for (const listingId of candidateListingIds) {
                    if (!boatsByListingId.has(listingId)) boatsByListingId.set(listingId, []);
                    boatsByListingId.get(listingId).push(boat);
                }
            }

        }

        // --- Filter boats for a single listing (pure) ---
        function filterBoatsForListing(listing, dates, guestCount) {
            const options = boatsByListingId.get(listing.id) || [];

            if (!options.length) {
                return [];
            }

            const needGuests = Math.max(1, Number(guestCount || filters.passengers || 1));
            const cIn = dates?.checkIn, cOut = dates?.checkOut;
            const listingCity = getCity(listing);

            const filteredBoats = options.filter(b => {

                // FIRST CHECK: Can this boat actually service the listing's city?
                // Only consider delivery cities if the user toggled dock delivery
                const canServiceListing = checkBoatServicesCity(b, listingCity, !!filters.dockDelivery);
                if (!canServiceListing) {
                    return false;
                }

                // Age check - only apply if user data is loaded and user is signed in
                if (userDataLoaded && userAge !== null && b._boatcompany?.minAge) {
                    const minAge = Number(b._boatcompany.minAge);
                    if (!isNaN(minAge) && userAge < minAge) {
                        return false;
                    }
                }

                // Passenger capacity check (from original code logic)
                if (filters.passengers > 1 && (b.maxPassengers || 0) < filters.passengers) {
                    return false;
                }
                if (needGuests && (b.maxPassengers || 0) < needGuests) {
                    return false;
                }

                // Legacy capacity filter removed

                // Boat type filtering (multiple types supported)
                if (filters.boatTypes.length > 0) {
                    const boatTypeMatches = filters.boatTypes.some(filterType =>
                        lc(b.boatType) === lc(filterType)
                    );
                    if (!boatTypeMatches) {
                        return false;
                    }
                }

                // Dock delivery requirement
                if (filters.dockDelivery) {
                    const deliv = (b?._boatcompany?.privateDockDeliveryCity || []).map(cityObj => lc(cityObj?.city || ""));
                    if (!deliv.includes(listingCity)) {
                        return false;
                    }
                }

                // Minimum reservation length check (from original logic)
                // For default half-day (0.5), be permissive - accept boats with min reservation <= 1
                // For user-selected longer periods, enforce minimum reservation length
                if (filters.days === 0.5) {
                    // Default half-day: accept if min reservation is 1 day or less (most boats should qualify)
                    const minRes = b.minReservationLength || 0;
                    if (minRes > 1) {
                        return false;
                    }
                } else if (filters.days > 0.5) {
                    // Full-day+ request: check minimum reservation length
                    if ((b.minReservationLength || 0) > filters.days) {
                        return false;
                    }
                }

                // Date availability check for selected dates
                if (filters.selectedDates.length > 0) {
                    // This would need real availability logic
                    // For now, we'll assume all boats are available on selected dates
                    // TODO: implement real date availability checking
                }

                // Basic date availability (stubbed – replace with real logic)
                if (isDateRangeBlocked(cIn, cOut, b.unavailableRanges)) {
                    return false;
                }

                return true;
            });

            return filteredBoats;
        }

        // --- Badge data (decoupled from filtering/UI) ---
        function getBoatBadgeData(listing, dates, guestCount) {

            const filtered = filterBoatsForListing(listing, dates, guestCount);

            if (!filtered.length) {
                return { count: 0, minPrice: null, formatted: "0 Boats" };
            }

            // Calculate minimum price using sophisticated pricing logic from commented code
            let min = null;
            let minDaysUsed = null; // Track the days used for the min price

            filtered.forEach(boat => {
                let basePrice = 0;
                let daysToCalculate = filters.days || 0;

                // If numDays is 0, use the minimum reservation length
                if (daysToCalculate === 0) {
                    daysToCalculate = boat.minReservationLength || 1;
                }

                // Calculate base price based on rental duration (from commented code logic)
                if (daysToCalculate < 1) {
                    // Half day rental - use half day price, or fall back to daily price
                    basePrice = boat.pricePerHalfDay || boat.pricePerDay || 0;
                } else if (daysToCalculate >= 1 && daysToCalculate <= 6) {
                    // Daily rental (1-6 days)
                    basePrice = (boat.pricePerDay || 0) * daysToCalculate;
                } else if (daysToCalculate >= 7 && daysToCalculate <= 29) {
                    // Weekly rental (7-29 days)
                    if (boat.pricePerWeek && boat.pricePerWeek > 0) {
                        // Calculate based on weekly rate and round to avoid decimals
                        const dailyWeeklyRate = boat.pricePerWeek / 7;
                        basePrice = Math.round(dailyWeeklyRate * daysToCalculate);
                    } else {
                        // Fall back to daily rate if weekly not available
                        basePrice = (boat.pricePerDay || 0) * daysToCalculate;
                    }
                } else if (daysToCalculate >= 30) {
                    // Monthly rental (30+ days)
                    if (boat.pricePerMonth && boat.pricePerMonth > 0) {
                        // Calculate based on monthly rate and round to avoid decimals
                        const dailyMonthlyRate = boat.pricePerMonth / 30;
                        basePrice = Math.round(dailyMonthlyRate * daysToCalculate);
                    } else if (boat.pricePerWeek && boat.pricePerWeek > 0) {
                        // Fall back to weekly rate if monthly not available and round to avoid decimals
                        const dailyWeeklyRate = boat.pricePerWeek / 7;
                        basePrice = Math.round(dailyWeeklyRate * daysToCalculate);
                    } else {
                        // Fall back to daily rate if neither monthly nor weekly available
                        basePrice = (boat.pricePerDay || 0) * daysToCalculate;
                    }
                }

                if (filters.dockDelivery === true) {
                    basePrice += boat._boatcompany?.deliveryFee || 0;
                }

                // Apply service fee if not manual integration (from commented code)
                let finalPrice = Math.round(basePrice); // Ensure base price is rounded
                if (boat._boatcompany && boat._boatcompany.integration_type !== 'Manual') {
                    const serviceFee = boat._boatcompany.serviceFee || 0;
                    finalPrice = Math.round(basePrice * (1 + serviceFee));
                }

                // Update cheapest price if this boat is cheaper
                if (finalPrice > 0 && (min === null || finalPrice < min)) {
                    min = finalPrice;
                    minDaysUsed = daysToCalculate;
                }
            });

            const boatLabel = filtered.length === 1 ? 'Boat' : 'Boats';
            const formatted = min != null
                ? `${filtered.length} ${boatLabel} • $${min.toLocaleString()}+`.trim()
                : `${filtered.length} ${boatLabel}`;

            return { count: filtered.length, minPrice: min, formatted };
        }

        // --- Gate used by listing filter pass ---
        function listingPassesBoatGate(listing, dates, guestCount) {

            if (!enabled) {
                return true; // feature not selected → do not gate
            }

            const hasBoats = filterBoatsForListing(listing, dates, guestCount).length > 0;
            return hasBoats;
        }

        // Get active filter count for badge display (uses active filters, not pending)
        function getActiveFilterCount() {
            let count = 0;
            if (filters.days !== 0.5) count++;
            if (filters.passengers !== 1) count++;
            if (filters.dockDelivery) count++;
            if (filters.selectedDates.length > 0) count++;
            if (filters.boatTypes.length > 0) count++;
            return count;
        }

        // Get current filter state for debugging/UI
        function getCurrentFilters() {
            return { ...filters };
        }

        // Function to initialize pending state from active state
        function initializePendingState() {
            Object.assign(pendingFilters, filters);
        }

        // Function to apply pending filters to active filters
        function applyPendingFilters() {
            Object.assign(filters, pendingFilters);
        }

        // Function to revert pending filters to active state
        function revertPendingFilters() {
            Object.assign(pendingFilters, filters);
        }

        // Public API
        return {
            setEnabled(v) { enabled = !!v; },
            setFilters(partial) { Object.assign(filters, partial || {}); },
            setPendingFilters(partial) { Object.assign(pendingFilters, partial || {}); },
            resetFilters() {
                const resetState = {
                    days: 0.5,
                    passengers: 1,
                    dockDelivery: false,
                    selectedDates: [],
                    lengthType: 'half',
                    boatTypes: []
                };
                Object.assign(filters, resetState);
                Object.assign(pendingFilters, resetState);
            },
            resetPendingFilters() {
                const resetState = {
                    days: 0.5,
                    passengers: 1,
                    dockDelivery: false,
                    selectedDates: [],
                    lengthType: 'half',
                    boatTypes: []
                };
                Object.assign(pendingFilters, resetState);
            },
            buildIndex,
            getBoatBadgeData,
            listingPassesBoatGate,
            getActiveFilterCount,
            getCurrentFilters: () => ({ ...filters }),
            getPendingFilters: () => ({ ...pendingFilters }),
            initializePendingState,
            applyPendingFilters,
            revertPendingFilters,
            isEnabled: () => enabled,
            _debug: { boatsByListingId }, // optional
        };
    })();

    // Make boat module globally accessible for future UI integration
    window.boatModule = boatModule;

    /***** FISHING CHARTER MODULE (charters only; parallel to boats) *****/
    const charterModule = (() => {
        // Public "enabled" flag (toggle from your "Type" UI or charter modal)
        let enabled = false;

        // Active filters that apply to fishing charters (applied state)
        const filters = {
            guests: 1,                    // minimum guests/capacity
            days: 1,                      // number of charter days (>=1)
            requirePrivateDockPickup: false, // if true, must have private dock pickup
            fishingTypes: new Set(),      // set of selected fishing types
        };

        // Pending filters (being edited in modal)
        const pendingFilters = {
            guests: 1,
            days: 1,
            requirePrivateDockPickup: false,
            fishingTypes: new Set(),
        };

        // Preindexed data
        const chartersByListingId = new Map(); // listingId -> Charter[]

        // --- Utils ---
        const lc = s => String(s ?? "").trim().toLowerCase();
        const getCity = v => {
            // For listings, try different city field names
            if (v?.listing_city) return lc(v.listing_city);
            if (v?.city) return lc(v.city);
            if (v?.locationCity) return lc(v.locationCity);

            // For charter companies, check company location fields
            if (v?.companyCity) return lc(v.companyCity);
            if (v?.location) return lc(v.location);
            if (v?.baseLocation) return lc(v.baseLocation);

            return "";
        };

        // Helper function to parse M/D season strings
        function parseMD(md) {
            if (!md || typeof md !== 'string') return null;
            const parts = md.split('/');
            if (parts.length !== 2) return null;
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
                return null;
            }
            return { month, day };
        }

        // Helper function to check if a date falls within a season (handles year wrap)
        function dateInSeason(date, startMD, endMD) {
            if (!date || !startMD || !endMD) return false;

            const month = date.getMonth() + 1; // getMonth() is 0-based
            const day = date.getDate();

            // Check if season wraps around year end
            if (startMD.month > endMD.month ||
                (startMD.month === endMD.month && startMD.day > endMD.day)) {
                // Season wraps (e.g., Nov 15 to Feb 15)
                return (month > startMD.month || (month === startMD.month && day >= startMD.day)) ||
                    (month < endMD.month || (month === endMD.month && day <= endMD.day));
            } else {
                // Normal season (e.g., Mar 1 to Oct 31)
                return (month > startMD.month || (month === startMD.month && day >= startMD.day)) &&
                    (month < endMD.month || (month === endMD.month && day <= endMD.day));
            }
        }

        // Helper function to convert "M/D" season format to current year date
        function parseSeasonDate(seasonStr) {
            if (!seasonStr || typeof seasonStr !== 'string') return null;
            const parts = seasonStr.split('/');
            if (parts.length !== 2) return null;
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
                return null;
            }

            const currentYear = new Date().getFullYear();
            const date = new Date(currentYear, month - 1, day); // month is 0-indexed in Date constructor
            return date;
        }

        // Helper function to check if a date falls within a season (handles cross-year seasons)
        function isDateInSeason(checkDate, seasonStart, seasonEnd) {
            if (!checkDate || !seasonStart || !seasonEnd) return false;

            const startDate = parseSeasonDate(seasonStart);
            const endDate = parseSeasonDate(seasonEnd);

            if (!startDate || !endDate) return false;

            // Check for year-round season (1/1 to 12/31)
            if (startDate.getMonth() === 0 && startDate.getDate() === 1 &&
                endDate.getMonth() === 11 && endDate.getDate() === 31) {
                return true; // Year-round season
            }

            // Create date objects with same year for comparison
            const checkMonth = checkDate.getMonth();
            const checkDay = checkDate.getDate();
            const startMonth = startDate.getMonth();
            const startDay = startDate.getDate();
            const endMonth = endDate.getMonth();
            const endDay = endDate.getDate();

            // Check if season crosses year boundary (e.g., Aug 30 to Mar 30)
            if (startMonth > endMonth || (startMonth === endMonth && startDay > endDay)) {
                // Season crosses year boundary
                return (checkMonth > startMonth || (checkMonth === startMonth && checkDay >= startDay)) ||
                    (checkMonth < endMonth || (checkMonth === endMonth && checkDay <= endDay));
            } else {
                // Normal season within same year
                return (checkMonth > startMonth || (checkMonth === startMonth && checkDay >= startDay)) &&
                    (checkMonth < endMonth || (checkMonth === endMonth && checkDay <= endDay));
            }
        }

        // Helper function to check if date range overlaps with season
        function rangeOverlapsSeason(checkInDate, checkOutDate, seasonStart, seasonEnd) {
            if (!checkInDate || !checkOutDate || !seasonStart || !seasonEnd) return false;

            // Convert string dates to Date objects if needed
            let startDate = checkInDate;
            let endDate = checkOutDate;

            if (typeof checkInDate === 'string') {
                startDate = new Date(checkInDate);
            }
            if (typeof checkOutDate === 'string') {
                endDate = new Date(checkOutDate);
            }

            // Check if any day in the date range falls within the season
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                if (isDateInSeason(currentDate, seasonStart, seasonEnd)) {
                    return true;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            return false;
        }

        // Helper function to compute trip base price per day (without service fee)
        function computeTripBasePricePerDay(trip, boatCapacity, guests) {
            if (!trip || guests <= 0) return null;

            // Check capacity
            if (guests > boatCapacity) return null;

            const pricePeople = Math.min(trip.pricePeople || 0, boatCapacity);
            let basePrice = trip.price || 0;
            const additionalPersonPrice = trip.pricePerAdditionalPerson || 0;

            // Calculate base price with guest adjustments
            if (guests <= pricePeople) {
                basePrice = basePrice;
            } else {
                basePrice = basePrice + (guests - pricePeople) * additionalPersonPrice;
            }

            return basePrice;
        }

        // Helper function to apply service fee to total cost
        function applyServiceFee(totalCost, charter) {
            if (!charter || charter.integration_type === "Manual") {
                return totalCost;
            }

            const serviceFee = charter.serviceFee || 0;
            return totalCost * (serviceFee + 1);
        }

        // Helper function to check if trip matches selected types
        function tripMatchesTypes(trip, selectedTypes) {
            if (selectedTypes.size === 0) return true; // No filter applied

            if (!trip.type || !Array.isArray(trip.type)) return false;

            return trip.type.some(typeObj => {
                const typeText = normalizeCharterType(typeObj.text || '');
                return selectedTypes.has(typeText);
            });
        }

        // Helper function to normalize charter type labels
        function normalizeCharterType(label) {
            const normalized = lc(label);
            const mappings = {
                'inshore': 'Inshore Fishing',
                'inshore fishing': 'Inshore Fishing',
                'nearshore': 'Nearshore Fishing',
                'nearshore fishing': 'Nearshore Fishing',
                'near fishing': 'Nearshore Fishing',
                'offshore': 'Offshore Fishing',
                'offshore fishing': 'Offshore Fishing',
                'reef': 'Reef Fishing',
                'reef fishing': 'Reef Fishing',
                'wreck': 'Wreck Fishing',
                'wreck fishing': 'Wreck Fishing',
                'flats': 'Flats Fishing',
                'flats fishing': 'Flats Fishing',
                'backcountry': 'Backcountry Fishing',
                'backcountry fishing': 'Backcountry Fishing'
            };
            return mappings[normalized] || label;
        }

        // Florida Keys city positions (approximate order from north to south)
        const floridaKeysOrder = {
            'key largo': 0,
            'tavernier': 1,
            'plantation key': 2,
            'islamorada': 3,
            'upper matecumbe key': 4,
            'lower matecumbe key': 5,
            'long key': 6,
            'conch key': 7,
            'duck key': 8,
            'grassy key': 9,
            'crawl key': 10,
            'marathon': 11,
            'key colony beach': 12,
            'boot key': 13,
            'knight key': 14,
            'little duck key': 15,
            'ohio key': 16,
            'missouri key': 17,
            'bahia honda key': 18,
            'spanish harbor key': 19,
            'big pine key': 20,
            'little torch key': 21,
            'ramrod key': 22,
            'summerland key': 23,
            'cudjoe key': 24,
            'sugarloaf key': 25,
            'saddlebunch keys': 26,
            'big coppit key': 27,
            'rockland key': 28,
            'stock island': 29,
            'key west': 30
        };

        // Helper function to get normalized city position
        function getCityPosition(cityName) {
            if (!cityName) return -1;

            const normalized = lc(cityName);

            // Direct match
            if (floridaKeysOrder.hasOwnProperty(normalized)) {
                return floridaKeysOrder[normalized];
            }

            // Handle common variations and abbreviations
            const variations = {
                'kl': 'key largo',
                'largo': 'key largo',
                'islamorada village': 'islamorada',
                'village of islamorada': 'islamorada',
                'marathon shores': 'marathon',
                'marathon key': 'marathon',
                'key colony': 'key colony beach',
                'big pine': 'big pine key',
                'little torch': 'little torch key',
                'torch key': 'little torch key',
                'ramrod': 'ramrod key',
                'summerland': 'summerland key',
                'cudjoe': 'cudjoe key',
                'sugarloaf': 'sugarloaf key',
                'stock': 'stock island',
                'kw': 'key west',
                'key west city': 'key west'
            };

            // Check variations
            if (variations[normalized]) {
                return floridaKeysOrder[variations[normalized]];
            }

            // Fuzzy matching for partial matches
            for (const [key, position] of Object.entries(floridaKeysOrder)) {
                if (normalized.includes(key) || key.includes(normalized)) {
                    return position;
                }
            }

            return -1; // Unknown city
        }

        // Helper function to check if two cities are within reasonable charter distance
        function isWithinCharterDistance(charterCity, listingCity) {
            const charterPos = getCityPosition(charterCity);
            const listingPos = getCityPosition(listingCity);

            // If we can't determine positions, allow it (fallback)
            if (charterPos === -1 || listingPos === -1) {
                return true;
            }

            // Allow charters within ~8 positions (roughly 30 miles in the Keys)
            // This allows Islamorada to Marathon but not Marathon to Key West
            const distance = Math.abs(charterPos - listingPos);
            return distance <= 8;
        }

        // Helper function to check if company can serve the listing location
        function companyCanServeListing(company, listing) {
            const listingCity = getCity(listing);
            const charterCity = getCity(company);

            // First check geographic distance
            if (!isWithinCharterDistance(charterCity, listingCity)) {
                return false;
            }

            return true;
        }

        // Helper function to check if company satisfies dock pickup requirements
        function companySatisfiesDockPickup(company, listing) {
            if (!filters.requirePrivateDockPickup) return true;

            // Company must offer private dock pickup
            if (!company.privateDockPickup) return false;

            // Listing must have a private dock
            if (!listing.private_dock) return false;

            const listingCity = getCity(listing);

            // If no specific cities listed, assume they can serve anywhere (within distance)
            if (!company.privateDockPickupCity || company.privateDockPickupCity.length === 0) {
                return true;
            }

            // Check if listing city is in the pickup cities
            if (listingCity) {
                const normalizedListingCity = lc(listingCity);
                return company.privateDockPickupCity.some(cityObj =>
                    lc(cityObj.city || '') === normalizedListingCity
                );
            }

            return true; // If no listing city provided, don't filter
        }

        // --- Build index once per results load ---
        function buildIndex(listings, allCharters) {
            chartersByListingId.clear();
            if (!Array.isArray(listings) || !Array.isArray(allCharters)) {
                return;
            }

            // Filter charters by geographic proximity and dock pickup requirements
            for (const listing of listings) {
                const listingCity = getCity(listing);
                const eligibleCharters = [];

                for (const charter of allCharters) {
                    // Check if charter can serve this listing (geographic distance)
                    if (!companyCanServeListing(charter, listing)) {
                        continue;
                    }

                    eligibleCharters.push(charter);
                }

                if (eligibleCharters.length > 0) {
                    chartersByListingId.set(listing.id, eligibleCharters);
                }

            }

        }

        // --- Filter charters for a single listing (pure) ---
        function filterChartersForListing(listing, dates, guestCount) {
            const options = chartersByListingId.get(listing.id) || [];

            if (!options.length) {
                return [];
            }

            const needGuests = Math.max(1, Number(guestCount || filters.guests || 1));
            const eligibleTrips = [];

            for (const charter of options) {
                // Check dock pickup requirement (now includes private dock check on listing)
                if (!companySatisfiesDockPickup(charter, listing)) {
                    continue;
                }

                // Age check - only apply if user data is loaded and user is signed in
                if (userDataLoaded && userAge !== null && charter.minAge) {
                    const minAge = Number(charter.minAge);
                    if (!isNaN(minAge) && userAge < minAge) {
                        continue;
                    }
                }

                const boatCapacity = charter.boatInfo?.[0]?.boatCapacity || Infinity;
                if (needGuests > boatCapacity) {
                    continue;
                }

                // Check each trip option
                if (charter.tripOptions && Array.isArray(charter.tripOptions)) {
                    for (const trip of charter.tripOptions) {
                        // Season check - only if dates are provided
                        if (dates?.checkIn && dates?.checkOut) {
                            // Use the new season checking that properly handles M/D format
                            if (!rangeOverlapsSeason(dates.checkIn, dates.checkOut, trip.seasonStart, trip.seasonEnd)) {
                                continue;
                            }
                        }

                        // Type check
                        if (!tripMatchesTypes(trip, filters.fishingTypes)) {
                            continue;
                        }

                        // Price calculation - build up total cost before applying service fee
                        let basePricePerDay = computeTripBasePricePerDay(trip, boatCapacity, needGuests);
                        if (basePricePerDay === null) {
                            continue;
                        }

                        // Add private dock pickup fee if required and available
                        const dockPickupFee = (filters.requirePrivateDockPickup && charter.privateDockPickup)
                            ? (charter.privateDockPickupFee || 0)
                            : 0;

                        // Calculate total cost per day (base + dock fee)
                        let totalCostPerDay = basePricePerDay + dockPickupFee;

                        // Apply service fee to the total cost (LAST STEP)
                        const finalPricePerDay = applyServiceFee(totalCostPerDay, charter);

                        // Trip passes all filters
                        const eligibleTrip = {
                            companyId: charter.id,
                            tripId: trip.id,
                            basePricePerDay: finalPricePerDay,
                            basePriceForSelectedDays: filters.days > 1 ? finalPricePerDay * filters.days : finalPricePerDay,
                            tripLabel: trip.name,
                            startTime: trip.tripStartTime,
                            lengthHours: trip.lengthOfTrip,
                            privateDockPickup: charter.privateDockPickup,
                            privateDockPickupFee: dockPickupFee
                        };

                        eligibleTrips.push(eligibleTrip);
                    }
                }
            }

            return eligibleTrips;
        }

        // --- Badge data (decoupled from filtering/UI) ---
        function getCharterBadgeData(listing, dates, guestCount) {
            const eligibleTrips = filterChartersForListing(listing, dates, guestCount);

            if (!eligibleTrips.length) {
                return { count: 0, minPrice: null, formatted: "0 Charters" };
            }

            // Calculate minimum price per day
            const minPricePerDay = Math.min(...eligibleTrips.map(trip => trip.basePricePerDay));
            const totalEstimate = minPricePerDay * filters.days;

            const charterLabel = eligibleTrips.length === 1 ? 'Charter' : 'Charters';
            let formatted = `${eligibleTrips.length} ${charterLabel} • $${totalEstimate.toLocaleString()}+`;


            return {
                count: eligibleTrips.length,
                minPrice: totalEstimate, // Return total estimate instead of per-day price
                formatted
            };
        }

        // --- Gate used by listing filter pass ---
        function listingPassesCharterGate(listing, dates, guestCount) {
            if (!enabled) {
                return true; // feature not selected → do not gate
            }

            const eligibleTrips = filterChartersForListing(listing, dates, guestCount);
            const hasCharters = eligibleTrips.length > 0;
            return hasCharters;
        }

        // Get active filter count for badge display (uses active filters, not pending)
        function getActiveFilterCount() {
            let count = 0;
            if (filters.guests !== 1) count++;
            if (filters.days !== 1) count++;
            if (filters.requirePrivateDockPickup) count++;
            if (filters.fishingTypes.size > 0) count++;
            return count;
        }

        // Get current filter state for debugging/UI
        function getCurrentFilters() {
            return {
                ...filters,
                fishingTypes: Array.from(filters.fishingTypes) // Convert Set to Array for easier inspection
            };
        }

        // Function to initialize pending state from active state
        function initializePendingState() {
            Object.assign(pendingFilters, filters);
            // Handle Set type specially
            pendingFilters.fishingTypes = new Set(filters.fishingTypes);
        }

        // Function to apply pending filters to active filters
        function applyPendingFilters() {
            Object.assign(filters, pendingFilters);
            // Handle Set type specially
            filters.fishingTypes = new Set(pendingFilters.fishingTypes);
        }

        // Function to revert pending filters to active state
        function revertPendingFilters() {
            Object.assign(pendingFilters, filters);
            // Handle Set type specially
            pendingFilters.fishingTypes = new Set(filters.fishingTypes);
        }

        // Public API
        return {
            setEnabled(v) { enabled = !!v; },
            setFilters(partial) {
                if (partial) {
                    Object.assign(filters, partial);
                    // Handle fishingTypes specially since it's a Set
                    if (partial.fishingTypes) {
                        if (Array.isArray(partial.fishingTypes)) {
                            filters.fishingTypes = new Set(partial.fishingTypes);
                        } else if (partial.fishingTypes instanceof Set) {
                            filters.fishingTypes = new Set(partial.fishingTypes);
                        }
                    }
                }
            },
            setPendingFilters(partial) {
                if (partial) {
                    Object.assign(pendingFilters, partial);
                    // Handle fishingTypes specially since it's a Set
                    if (partial.fishingTypes) {
                        if (Array.isArray(partial.fishingTypes)) {
                            pendingFilters.fishingTypes = new Set(partial.fishingTypes);
                        } else if (partial.fishingTypes instanceof Set) {
                            pendingFilters.fishingTypes = new Set(partial.fishingTypes);
                        }
                    }
                }
            },
            resetFilters() {
                const resetState = {
                    guests: 1,
                    days: 1,
                    requirePrivateDockPickup: false,
                    fishingTypes: new Set()
                };
                Object.assign(filters, resetState);
                Object.assign(pendingFilters, resetState);
            },
            resetPendingFilters() {
                const resetState = {
                    guests: 1,
                    days: 1,
                    requirePrivateDockPickup: false,
                    fishingTypes: new Set()
                };
                Object.assign(pendingFilters, resetState);
            },
            buildIndex,
            getCharterBadgeData,
            listingPassesCharterGate,
            getActiveFilterCount,
            getCurrentFilters: () => ({
                ...filters,
                fishingTypes: Array.from(filters.fishingTypes) // Convert Set to Array for easier inspection
            }),
            getPendingFilters: () => ({
                ...pendingFilters,
                fishingTypes: Array.from(pendingFilters.fishingTypes) // Convert Set to Array for easier inspection
            }),
            initializePendingState,
            applyPendingFilters,
            revertPendingFilters,
            isEnabled: () => enabled,
            _debug: { chartersByListingId }, // optional
        };
    })();

    // Make charter module globally accessible for future UI integration
    window.charterModule = charterModule;

    // Note: Scroll blocking logic removed - background scrolling is now allowed

    // Ensure charter module is available globally before filter system setup
    if (typeof window.charterModule === 'undefined') {
    }

    // Function to update charter badge text for all visible cards
    function updateCharterBadgeForAllVisibleCards(visibleListings) {

        if (!visibleListings || !visibleListings.length) {
            return;
        }

        for (const l of visibleListings) {

            // Try the specific selector first, then fallback to general
            let el = document.querySelector(`[data-listing-id="${l.id}"] [data-element="listing-card-extras-fishingCharterBlockText"]`);
            if (!el) {
                // Fallback to any fishing charter block text element
                el = document.querySelector('[data-element="listing-card-extras-fishingCharterBlockText"]');
            }

            if (!el) {
                continue;
            }

            // Fix: Use the same date and guest count fixes as minChar function
            let datesForCharter = apiFormats?.dates;
            if (datesForCharter?.checkIn && datesForCharter?.checkOut) {
                if (datesForCharter.checkIn instanceof Date) {
                    datesForCharter = {
                        checkIn: formatDateForAPI(datesForCharter.checkIn),
                        checkOut: formatDateForAPI(datesForCharter.checkOut)
                    };
                }
            }
            // Fix: Use charter module's active guest filter for badge consistency
            const charterFilters = charterModule.getCurrentFilters();
            const guestCount = Math.max(1, charterFilters.guests || apiFormats?.guests?.total || 1);

            const badge = charterModule.getCharterBadgeData(l, datesForCharter, guestCount);

            el.textContent = badge.formatted;
        }
    }

    // Function to update boat badge text for all visible cards
    function updateBoatBadgeForAllVisibleCards(visibleListings) {

        if (!visibleListings || !visibleListings.length) {
            return;
        }

        for (const l of visibleListings) {

            // Try the specific selector first, then fallback to general
            let el = document.querySelector(`[data-listing-id="${l.id}"] [data-element="listing-card-extras-boatRentalBlockText"]`);
            if (!el) {
                // Fallback to any boat rental block text element
                el = document.querySelector('[data-element="listing-card-extras-boatRentalBlockText"]');
            }

            if (!el) {
                continue;
            }

            // Fix: Use the same date and guest count fixes as minBoat function
            let datesForBoat = apiFormats?.dates;
            if (datesForBoat?.checkIn && datesForBoat?.checkOut) {
                if (datesForBoat.checkIn instanceof Date) {
                    datesForBoat = {
                        checkIn: formatDateForAPI(datesForBoat.checkIn),
                        checkOut: formatDateForAPI(datesForBoat.checkOut)
                    };
                }
            }
            const guestCount = Math.max(1, apiFormats?.guests?.total || 1);

            const badge = boatModule.getBoatBadgeData(l, datesForBoat, guestCount);

            el.textContent = badge.formatted;
        }
    }

    // ADD THIS: Track previous pricing mode to detect changes
    let previousPricingMode = null;

    // Function to get current pricing mode
    // Pricing modes:
    // - 'per-night': No dates, no extras (shows nightly price, max ~$2000)
    // - 'total-stay': Has dates, no extras (shows total stay price, max ~$12000)
    // - 'total-with-extras': Has extras (with or without dates, shows combined total, max ~$15000)
    function getCurrentPricingMode() {
        const datesSelected = hasDates();
        const hasExtras = wantBoat() || wantChar();

        if (!hasExtras && !datesSelected) {
            return 'per-night';
        } else if (!hasExtras && datesSelected) {
            return 'total-stay';
        } else {
            return 'total-with-extras';
        }
    }

    // Function to clear price filters when mode changes
    function clearPriceFiltersOnModeChange() {
        const currentMode = getCurrentPricingMode();

        // If this is the first time or mode hasn't changed, do nothing
        if (previousPricingMode === null || previousPricingMode === currentMode) {
            previousPricingMode = currentMode;
            return false; // No change occurred
        }


        // Mode has changed - clear price filters
        activeFilters.priceRange.min = null;
        activeFilters.priceRange.max = null;
        pendingFilters.priceRange.min = null;
        pendingFilters.priceRange.max = null;

        // Update previous mode
        previousPricingMode = currentMode;

        // Filter count will be updated when setupPriceSlider is called

        return true; // Change occurred and filters were cleared
    }

    const filterSystem = setupFilterSystem();

    // Example: Wiring boat filter UI to the module (for future implementation)
    // When a user changes boat filters:
    // 
    // Basic filters:
    // boatModule.setFilters({ passengers: 8 });                    // minimum passenger capacity
    // boatModule.setFilters({ dockDelivery: true });               // require dock delivery
    // boatModule.setFilters({ days: 1 });                         // 0.5 for half day, 1+ for full days
    // boatModule.setFilters({ lengthType: 'full' });              // 'half' or 'full'
    // 
    // Boat type filters (multiple selection):
    // boatModule.setFilters({ boatTypes: ["Center Console", "Pontoon"] });
    // 
    // Date selection filters:
    // boatModule.setFilters({ selectedDates: ["2024-01-15", "2024-01-16"] });
    // 
    // Legacy single filters (for backward compatibility):
    // boatModule.setFilters({ capacityMin: 8, type: "Pontoon", requireDockDelivery: true });
    // 
    // Check filter state:
    // const filterCount = boatModule.getActiveFilterCount();       // get number of active filters
    // const currentFilters = boatModule.getCurrentFilters();       // get current filter state
    // const isEnabled = boatModule.isEnabled();                    // check if boat filtering is enabled
    // 
    // Re-run property filtering and refresh text:
    // const filtered = filterSystem.applyFilters(unfilteredListings);
    // renderListingCards(filtered, false, 1);
    // updateBoatBadgeForAllVisibleCards(filtered);

    // Add event listeners to buttons to update visual state when popups open
    if (typeButton) {
        typeButton.addEventListener('click', function () {
            // Only update type selection visual state if there are no pending changes
            // This allows users to switch between popups without losing their changes
            if (pendingSelections.type === currentSelections.type) {
                typePopupHandlers.updateTypeSelectionVisual();
            }
        });
    }

    // ADD THIS: Filter system setup function (modify the existing one around line 2353)
    function setupFilterSystem() {
        const filterButton = document.querySelector('[data-element="filterButton"]');
        const filterModal = document.querySelector('[data-element="filterModal"]');
        const filterModalBackground = document.querySelector('[data-element="filterModal_modalBackground"]');
        const applyFiltersButton = document.querySelector('[data-element="filterModal_viewResultsButton"]');
        const clearFiltersButton = document.querySelector('[data-element="filterModal_clearFiltersButton"]');
        const closeFilterButton = document.querySelector('[data-element="filterModal_closeButton"]');
        const activeFiltersCount = document.querySelector('[data-element="activeFiltersCount"]');



        // Price elements
        const priceScrollBar = document.querySelector('[data-element="filterModalPrice_scrollBar"]');
        const priceDescription = document.querySelector('[data-element="filterModalPrice_description"]');
        const priceMinInput = document.querySelector('[data-element="filterModalPrice_minPriceInput"]');
        const priceMinInputContainer = document.querySelector('[data-element="filterModalPrice_minPriceInputContainer"]');
        const priceMaxInput = document.querySelector('[data-element="filterModalPrice_maxPriceInput"]');

        // Rooms elements
        const bedroomsElements = {
            minus: document.querySelector('[data-element="filterModalRooms_bedroomsMinusButton"]'),
            number: document.querySelector('[data-element="filterModalRooms_bedroomsNumber"]'),
            plus: document.querySelector('[data-element="filterModalRooms_bedroomsPlusButton"]')
        };
        const bedsElements = {
            minus: document.querySelector('[data-element="filterModalRooms_bedsMinusButton"]'),
            number: document.querySelector('[data-element="filterModalRooms_bedsNumber"]'),
            plus: document.querySelector('[data-element="filterModalRooms_bedsPlusButton"]')
        };
        const bathroomsElements = {
            minus: document.querySelector('[data-element="filterModalRooms_bathroomsMinusButton"]'),
            number: document.querySelector('[data-element="filterModalRooms_bathroomsNumber"]'),
            plus: document.querySelector('[data-element="filterModalRooms_bathroomsPlusButton"]')
        };

        // Dock elements
        const privateDockCheckbox = document.querySelector('[data-element="filterModalDock_privateDockCheckbox"]');
        const privateDockOptions = document.querySelector('[data-element="filterModalDock_privateDockOptions"]');
        const dockSpecs = {
            shorePower: document.querySelector('[data-element="filterModalDock_shorePower"]'),
            freshWater: document.querySelector('[data-element="filterModalDock_freshWater"]'),
            cleaningStation: document.querySelector('[data-element="filterModalDock_cleaningStation"]'),
            dockLights: document.querySelector('[data-element="filterModalDock_dockLights"]')
        };
        const boatLengthScrollBar = document.querySelector('[data-element="filterModalDock_boatLengthScrollBar"]');
        const boatLengthInput = document.querySelector('[data-element="filterModalDock_boatLengthInput"]');
        const boatDraftInput = document.querySelector('[data-element="filterModalDock_boatDraftInput"]');
        const boatBeamInput = document.querySelector('[data-element="filterModalDock_boatBeamInput"]');

        // New boat length section elements
        const dockBoatLengthScrollBar = document.querySelector('[data-element="filterModalDock_boatLength_scrollBar"]');
        const dockBoatLengthInput = document.querySelector('[data-element="filterModalDock_boatLength_input"]');

        // Add this with the other element selections at the top of setupFilterSystem
        const petsAllowedCheckbox = document.querySelector('[data-element="filterModalPets_petsAllowedCheckbox"]');

        // Amenities elements


        // initially hide filter count
        if (activeFiltersCount) {
            activeFiltersCount.style.display = 'none';
        }




        function setupPriceSlider() {
            // Phase 4: Dynamic price filter logic
            const datesSelected = hasDates();
            const hasExtras = wantBoat() || wantChar();

            let maxPrice, description;
            if (!hasExtras && !datesSelected) {
                // Home-only & NO dates (per-night)
                maxPrice = 2000;
                description = "Price per night";
            } else if (!hasExtras && datesSelected) {
                // Home-only & WITH dates (total stay)
                maxPrice = 12000;
                description = "Total price";
            } else {
                // Home + Extras
                maxPrice = 15000;
                if (wantBoat() && wantChar()) {
                    description = "Total price (stay + fishing charter + boat rental)";
                } else if (wantChar()) {
                    description = "Total price (stay + fishing charter)";
                } else {
                    description = "Total price (stay + boat rental)";
                }
            }

            // Initialize pending price state from active state
            function initializePendingPriceState() {
                pendingFilters.priceRange.min = activeFilters.priceRange.min;
                pendingFilters.priceRange.max = activeFilters.priceRange.max;
                updatePriceUI();
            }

            function updatePriceUI() {
                const minVal = pendingFilters.priceRange.min || 0;
                const maxVal = pendingFilters.priceRange.max || maxPrice;

                // Phase 4: Hide min controls when extras are active
                const sliderMin = priceScrollBar?.querySelector('.price-slider-min');
                const sliderMax = priceScrollBar?.querySelector('.price-slider-max');
                const thumbMin = priceScrollBar?.querySelector('.price-slider-thumb-min');

                if (hasExtras) {
                    // Hide min controls visually but keep state at 0
                    if (thumbMin) thumbMin.style.display = 'none';
                    if (priceMinInput) priceMinInput.style.display = 'none';
                    if (priceMinInputContainer) priceMinInputContainer.style.display = 'none';
                    if (sliderMin) sliderMin.value = 0;
                    pendingFilters.priceRange.min = 0;
                } else {
                    // Show min controls
                    if (thumbMin) thumbMin.style.display = '';
                    if (priceMinInputContainer) priceMinInputContainer.style.display = 'block';
                    if (priceMinInput) {
                        priceMinInput.style.display = '';
                        priceMinInput.value = '$' + minVal.toLocaleString();
                    }
                    if (sliderMin) sliderMin.value = minVal;
                }

                if (priceMaxInput) priceMaxInput.value = maxVal >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + maxVal.toLocaleString();
                if (sliderMax) sliderMax.value = maxVal;

                // Update visual slider elements
                updateSlider();
            }

            // Update description
            if (priceDescription) {
                priceDescription.textContent = description;
            }

            // Create range slider
            if (priceScrollBar) {
                priceScrollBar.innerHTML = `
            <div class="price-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
                <div class="price-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
                <div class="price-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
                <input type="range" class="price-slider-min" min="0" max="${maxPrice}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
                <input type="range" class="price-slider-max" min="0" max="${maxPrice}" value="${maxPrice}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
                <div class="price-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
                <div class="price-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
            </div>
        `;

                const sliderMin = priceScrollBar.querySelector('.price-slider-min');
                const sliderMax = priceScrollBar.querySelector('.price-slider-max');
                const range = priceScrollBar.querySelector('.price-slider-range');
                const thumbMin = priceScrollBar.querySelector('.price-slider-thumb-min');
                const thumbMax = priceScrollBar.querySelector('.price-slider-thumb-max');
                const container = priceScrollBar.querySelector('.price-slider-container');


                let isDraggingMin = false;
                let isDraggingMax = false;
                let startX = 0;
                let startLeft = 0;

                function updateSlider() {
                    const minVal = parseInt(sliderMin.value);
                    const maxVal = parseInt(sliderMax.value);
                    const minPercent = (minVal / maxPrice) * 100;
                    const maxPercent = (maxVal / maxPrice) * 100;

                    range.style.left = minPercent + '%';
                    range.style.width = (maxPercent - minPercent) + '%';
                    thumbMin.style.left = minPercent + '%';
                    thumbMax.style.left = maxPercent + '%';

                    // Update inputs
                    if (priceMinInput) priceMinInput.value = '$' + minVal.toLocaleString();
                    if (priceMaxInput) priceMaxInput.value = maxVal >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + maxVal.toLocaleString();

                    // CRITICAL FIX: Also update pending filters
                    pendingFilters.priceRange.min = minVal || null;
                    pendingFilters.priceRange.max = maxVal >= maxPrice ? null : maxVal;
                }

                function handleDragStart(e, isMin) {
                    // Handle both mouse events and touch objects
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);

                    if (isMin) {
                        isDraggingMin = true;
                        startX = clientX;
                        startLeft = parseInt(sliderMin.value);
                    } else {
                        isDraggingMax = true;
                        startX = clientX;
                        startLeft = parseInt(sliderMax.value);
                    }
                }

                function handleDragMove(e) {
                    if (!isDraggingMin && !isDraggingMax) return;

                    const containerRect = container.getBoundingClientRect();
                    const containerWidth = containerRect.width;
                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
                    const moveX = clientX - startX;
                    const movePercent = (moveX / containerWidth) * 100;
                    const moveValue = Math.round((movePercent / 100) * maxPrice);

                    if (isDraggingMin) {
                        let newValue = Math.max(0, Math.min(startLeft + moveValue, parseInt(sliderMax.value)));
                        sliderMin.value = newValue;
                        // Update pending filters immediately
                        pendingFilters.priceRange.min = newValue || null;
                    } else if (isDraggingMax) {
                        let newValue = Math.max(parseInt(sliderMin.value), Math.min(startLeft + moveValue, maxPrice));
                        sliderMax.value = newValue;
                        // Update pending filters immediately
                        const newMaxValue = newValue >= maxPrice ? null : newValue;
                        pendingFilters.priceRange.max = newMaxValue;
                    }

                    updateSlider();
                }

                function handleDragEnd() {
                    isDraggingMin = false;
                    isDraggingMax = false;
                }

                // Add mouse event listeners for dragging
                thumbMin.addEventListener('mousedown', (e) => handleDragStart(e, true));
                thumbMax.addEventListener('mousedown', (e) => handleDragStart(e, false));
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);

                // Add touch event listeners for mobile - use container approach
                const priceSliderContainer = container;

                thumbMin.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Stop event from bubbling to container
                    handleDragStart(e.touches[0], true);
                });

                thumbMin.addEventListener('touchmove', (e) => {
                    if (isDraggingMin) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragMove(e.touches[0]);
                    }
                }, { passive: false });

                thumbMin.addEventListener('touchend', (e) => {
                    if (isDraggingMin) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragEnd();
                    }
                });

                thumbMax.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Stop event from bubbling to container
                    handleDragStart(e.touches[0], false);
                });

                thumbMax.addEventListener('touchmove', (e) => {
                    if (isDraggingMax) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragMove(e.touches[0]);
                    }
                }, { passive: false });

                thumbMax.addEventListener('touchend', (e) => {
                    if (isDraggingMax) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragEnd();
                    }
                });

                // Container listeners are not needed since we handle everything directly on thumbs

                // Keep the original input event listeners
                sliderMin?.addEventListener('input', () => {
                    if (parseInt(sliderMin.value) > parseInt(sliderMax.value)) {
                        sliderMin.value = sliderMax.value;
                    }
                    // Update pending filters
                    const newMinValue = parseInt(sliderMin.value) || null;
                    pendingFilters.priceRange.min = newMinValue;
                    updateSlider();
                });

                sliderMax?.addEventListener('input', () => {
                    if (parseInt(sliderMax.value) < parseInt(sliderMin.value)) {
                        sliderMax.value = sliderMin.value;
                    }
                    // Update pending filters
                    const newMaxValue = parseInt(sliderMax.value) >= maxPrice ? null : parseInt(sliderMax.value);
                    pendingFilters.priceRange.max = newMaxValue;
                    updateSlider();
                });

                updateSlider();
            }

            // Keep the existing input formatting code
            priceMinInput?.addEventListener('focus', function () {
                this.value = this.value.replace(/[$,+]/g, '');
            });

            priceMinInput?.addEventListener('blur', function () {
                const val = parseInt(this.value) || 0;
                this.value = '$' + val.toLocaleString();
                pendingFilters.priceRange.min = val || null;
                if (priceScrollBar) {
                    const slider = priceScrollBar.querySelector('.price-slider-min');
                    if (slider) slider.value = val;
                    updateSlider();
                }
            });

            priceMaxInput?.addEventListener('focus', function () {
                this.value = this.value.replace(/[$,+]/g, '');
            });

            priceMaxInput?.addEventListener('blur', function () {
                let val = parseInt(this.value) || maxPrice;
                if (val > maxPrice) val = maxPrice;
                this.value = val >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + val.toLocaleString();
                pendingFilters.priceRange.max = val >= maxPrice ? null : val;
                if (priceScrollBar) {
                    const slider = priceScrollBar.querySelector('.price-slider-max');
                    if (slider) slider.value = val;
                    updateSlider();
                }
            });

            // Store initialization function for later use
            setupPriceSlider.initialize = initializePendingPriceState;
        }


        // Setup Room Controls
        function setupRoomControls() {
            // SVG icons for buttons
            const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
            const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';

            function initializePendingRoomState() {
                pendingFilters.bedrooms = activeFilters.bedrooms;
                pendingFilters.beds = activeFilters.beds;
                pendingFilters.bathrooms = activeFilters.bathrooms;
                updateRoomUI();
            }

            function updateRoomUI() {
                const values = [pendingFilters.bedrooms, pendingFilters.beds, pendingFilters.bathrooms];
                const elements = [bedroomsElements, bedsElements, bathroomsElements];

                elements.forEach((elementSet, index) => {
                    const isBoathrooms = index === 2;
                    const value = values[index];

                    if (elementSet.number) {
                        if (value === null) {
                            elementSet.number.textContent = 'Any';
                        } else {
                            elementSet.number.textContent = isBoathrooms && value % 1 !== 0 ? value.toFixed(1) : value.toString();
                        }
                    }

                    if (elementSet.minus) {
                        elementSet.minus.style.opacity = value === null ? '0.3' : '1';
                        elementSet.minus.disabled = value === null;
                    }
                });
            }

            // Setup each room type
            [bedroomsElements, bedsElements, bathroomsElements].forEach((elements, index) => {
                const isBoathrooms = index === 2;
                const increment = isBoathrooms ? 0.5 : 1;
                const filterKeys = ['bedrooms', 'beds', 'bathrooms'];
                const filterKey = filterKeys[index];

                // Set SVG icons
                if (elements.minus) elements.minus.innerHTML = svgMinus;
                if (elements.plus) elements.plus.innerHTML = svgPlus;

                // Remove existing event listeners to prevent duplicates
                if (elements.plus && !elements.plus.hasAttribute('data-room-listener-added')) {
                    elements.plus.addEventListener('click', () => {
                        let value = pendingFilters[filterKey];
                        if (value === null) {
                            value = increment;
                        } else {
                            value += increment;
                        }
                        pendingFilters[filterKey] = value;
                        updateRoomUI();
                    });
                    elements.plus.setAttribute('data-room-listener-added', 'true');
                }

                if (elements.minus && !elements.minus.hasAttribute('data-room-listener-added')) {
                    elements.minus.addEventListener('click', () => {
                        let value = pendingFilters[filterKey];
                        if (value !== null) {
                            value -= increment;
                            if (value <= 0) {
                                value = null;
                            }
                            pendingFilters[filterKey] = value;
                            updateRoomUI();
                        }
                    });
                    elements.minus.setAttribute('data-room-listener-added', 'true');
                }

                // Store getter for filter collection (for backward compatibility)
                elements.getValue = () => pendingFilters[filterKey];
            });

            // Store initialization function for later use
            setupRoomControls.initialize = initializePendingRoomState;
        }

        // Setup Dock Section
        function setupDockSection() {
            // Initialize pending dock state from active state
            function initializePendingDockState() {
                // Copy active state to pending
                Object.assign(pendingFilters.dock, activeFilters.dock);

                // Update UI to match pending state
                updateDockUI();
            }

            function updateDockUI() {
                const hasPrivateDock = !!pendingFilters.dock.hasPrivateDock;

                if (privateDockCheckbox) {
                    privateDockCheckbox.style.backgroundColor = hasPrivateDock ? '#000' : '#fff';
                }

                if (privateDockOptions) {
                    privateDockOptions.style.display = hasPrivateDock ? 'flex' : 'none';
                }

                // Update dock specs UI
                Object.entries(dockSpecs).forEach(([key, element]) => {
                    if (element) {
                        const dockKey = 'has' + key.charAt(0).toUpperCase() + key.slice(1);
                        const isSelected = !!pendingFilters.dock[dockKey];
                        if (isSelected) {
                            element.classList.add('selected');
                        } else {
                            element.classList.remove('selected');
                        }
                    }
                });

                // Update boat specs inputs
                if (boatLengthInput) {
                    const lengthVal = pendingFilters.dock.hasBoatSpecsLength;
                    boatLengthInput.value = lengthVal ? (lengthVal >= 80 ? '80+ ft' : lengthVal + ' ft') : 'Any';
                }
                if (boatDraftInput) {
                    const draftVal = pendingFilters.dock.hasBoatSpecsDraft;
                    boatDraftInput.value = draftVal ? draftVal + ' ft' : 'Any';
                }
                if (boatBeamInput) {
                    const beamVal = pendingFilters.dock.hasBoatSpecsBeam;
                    boatBeamInput.value = beamVal ? beamVal + ' ft' : 'Any';
                }

                // Update new dock boat length input
                if (dockBoatLengthInput) {
                    const dockLengthVal = pendingFilters.dock.hasMinBoatLength;
                    dockBoatLengthInput.value = dockLengthVal ? (dockLengthVal >= 55 ? '55+ ft' : dockLengthVal + ' ft') : '0 ft';
                }

                // Update boat length slider
                if (boatLengthScrollBar) {
                    const slider = boatLengthScrollBar.querySelector('.boat-slider');
                    const thumb = boatLengthScrollBar.querySelector('.slider-thumb');
                    if (slider && thumb) {
                        const lengthVal = pendingFilters.dock.hasBoatSpecsLength || 15;
                        slider.value = lengthVal;
                        const percent = (lengthVal / 80) * 100;
                        thumb.style.left = percent + '%';
                    }
                }

                // Update new dock boat length slider
                if (dockBoatLengthScrollBar) {
                    const slider = dockBoatLengthScrollBar.querySelector('.dock-boat-slider');
                    const thumb = dockBoatLengthScrollBar.querySelector('.dock-slider-thumb');
                    if (slider && thumb) {
                        const dockLengthVal = pendingFilters.dock.hasMinBoatLength || 0;
                        slider.value = dockLengthVal;
                        const percent = (dockLengthVal / 55) * 100;
                        thumb.style.left = percent + '%';
                    }
                }
            }

            if (privateDockCheckbox) {
                privateDockCheckbox.style.cursor = 'pointer';
                if (!privateDockCheckbox.hasAttribute('data-dock-listener-added')) {
                    privateDockCheckbox.addEventListener('click', () => {
                        const hasPrivateDock = !pendingFilters.dock.hasPrivateDock;
                        pendingFilters.dock.hasPrivateDock = hasPrivateDock ? true : null;
                        updateDockUI();
                    });
                    privateDockCheckbox.setAttribute('data-dock-listener-added', 'true');
                }
            }

            // Dock specs
            Object.entries(dockSpecs).forEach(([key, element]) => {
                if (element) {
                    element.style.cursor = 'pointer';
                    if (!element.hasAttribute('data-dock-spec-listener-added')) {
                        element.addEventListener('click', () => {
                            const dockKey = 'has' + key.charAt(0).toUpperCase() + key.slice(1);
                            const isSelected = !pendingFilters.dock[dockKey];
                            pendingFilters.dock[dockKey] = isSelected ? true : null;
                            updateDockUI();
                        });
                        element.setAttribute('data-dock-spec-listener-added', 'true');
                    }
                }
            });

            // Store initialization function for later use
            setupDockSection.initialize = initializePendingDockState;

            // Boat length slider
            let boatLengthValue = null;
            if (boatLengthScrollBar) {
                boatLengthScrollBar.innerHTML = `
            <div class="boat-length-slider" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
                <div class="slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
                <input type="range" class="boat-slider" min="0" max="80" value="15" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
                <div class="slider-thumb" style="position: absolute; top: 50%; transform: translate(-50%, -50%); left: 18.75%; width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
            </div>
        `;

                const slider = boatLengthScrollBar.querySelector('.boat-slider');
                const thumb = boatLengthScrollBar.querySelector('.slider-thumb');
                const container = boatLengthScrollBar.querySelector('.boat-length-slider');

                let isDragging = false;
                let startX = 0;
                let startValue = 0;

                function updateSlider(value) {
                    const percent = (value / 80) * 100;
                    thumb.style.left = percent + '%';
                    thumb.style.background = '#fff';
                    thumb.style.borderColor = '#000';
                    boatLengthValue = value;
                    pendingFilters.dock.hasBoatSpecsLength = value > 15 ? value : null;

                    if (boatLengthInput) {
                        boatLengthInput.value = value >= 80 ? '80+ ft' : value + ' ft';
                    }
                }

                function handleDragStart(e) {
                    // Handle both mouse events and touch objects
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    isDragging = true;
                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
                    startX = clientX;
                    startValue = parseInt(slider.value);
                }

                function handleDragMove(e) {
                    if (!isDragging) return;

                    const containerRect = container.getBoundingClientRect();
                    const containerWidth = containerRect.width;
                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
                    const moveX = clientX - startX;
                    const movePercent = (moveX / containerWidth) * 100;
                    const moveValue = Math.round((movePercent / 100) * 80);
                    const newValue = Math.max(0, Math.min(startValue + moveValue, 80));

                    slider.value = newValue;
                    updateSlider(newValue);
                }

                function handleDragEnd() {
                    isDragging = false;
                }

                // Add mouse event listeners for dragging
                thumb.addEventListener('mousedown', handleDragStart);
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);

                // Add touch event listeners for mobile - use container approach
                const roomSliderContainer = container;

                thumb.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Stop event from bubbling to container
                    handleDragStart(e.touches[0]);
                });

                thumb.addEventListener('touchmove', (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragMove(e.touches[0]);
                    }
                }, { passive: false });

                thumb.addEventListener('touchend', (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragEnd();
                    }
                });

                // Container listeners are not needed since we handle everything directly on thumb

                // Keep the original input event listener
                slider?.addEventListener('input', () => {
                    updateSlider(parseInt(slider.value));
                });

                // Initialize slider
                updateSlider(parseInt(slider.value));
            }

            // New dock boat length slider (separate from boat specs)
            if (dockBoatLengthScrollBar) {
                dockBoatLengthScrollBar.innerHTML = `
                <div class="dock-boat-length-slider" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
                    <div class="dock-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
                    <input type="range" class="dock-boat-slider" min="0" max="55" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
                    <div class="dock-slider-thumb" style="position: absolute; top: 50%; transform: translate(-50%, -50%); left: 0%; width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
                </div>
            `;

                const dockSlider = dockBoatLengthScrollBar.querySelector('.dock-boat-slider');
                const dockThumb = dockBoatLengthScrollBar.querySelector('.dock-slider-thumb');
                const dockContainer = dockBoatLengthScrollBar.querySelector('.dock-boat-length-slider');

                let isDockDragging = false;
                let dockStartX = 0;
                let dockStartValue = 0;

                function updateDockSlider(value) {
                    const percent = (value / 55) * 100;
                    dockThumb.style.left = percent + '%';
                    dockThumb.style.background = '#fff';
                    dockThumb.style.borderColor = '#000';
                    pendingFilters.dock.hasMinBoatLength = value > 0 ? value : null;

                    if (dockBoatLengthInput) {
                        dockBoatLengthInput.value = value >= 55 ? '55+ ft' : value + ' ft';
                    }
                }

                function handleDockDragStart(e) {
                    // Handle both mouse events and touch objects
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    isDockDragging = true;
                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
                    dockStartX = clientX;
                    dockStartValue = parseInt(dockSlider.value);
                }

                function handleDockDragMove(e) {
                    if (!isDockDragging) return;

                    const containerRect = dockContainer.getBoundingClientRect();
                    const containerWidth = containerRect.width;
                    const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
                    const moveX = clientX - dockStartX;
                    const movePercent = (moveX / containerWidth) * 100;
                    const moveValue = Math.round((movePercent / 100) * 55);
                    const newValue = Math.max(0, Math.min(dockStartValue + moveValue, 55));

                    dockSlider.value = newValue;
                    updateDockSlider(newValue);
                }

                function handleDockDragEnd() {
                    isDockDragging = false;
                }

                // Add mouse event listeners for dragging
                dockThumb.addEventListener('mousedown', handleDockDragStart);
                document.addEventListener('mousemove', handleDockDragMove);
                document.addEventListener('mouseup', handleDockDragEnd);

                // Add touch event listeners for mobile - use container approach
                const dockSliderContainer = dockContainer;

                dockThumb.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Stop event from bubbling to container
                    handleDockDragStart(e.touches[0]);
                });

                dockThumb.addEventListener('touchmove', (e) => {
                    if (isDockDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDockDragMove(e.touches[0]);
                    }
                }, { passive: false });

                dockThumb.addEventListener('touchend', (e) => {
                    if (isDockDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDockDragEnd();
                    }
                });

                // Container listeners are not needed since we handle everything directly on thumb

                // Keep the original input event listener
                dockSlider?.addEventListener('input', () => {
                    updateDockSlider(parseInt(dockSlider.value));
                });

                // Initialize dock slider
                updateDockSlider(parseInt(dockSlider.value));
            }

            // Boat input fields
            [boatLengthInput, boatDraftInput, boatBeamInput].forEach(input => {
                if (input) {
                    input.value = 'Any';

                    input.addEventListener('focus', function () {
                        if (this.value === 'Any') this.value = '';
                        else this.value = this.value.replace(/ ft\+?/g, '');
                    });

                    input.addEventListener('input', function () {
                        this.value = this.value.replace(/[^\d]/g, '');
                    });

                    input.addEventListener('blur', function () {
                        if (this.value === '') {
                            this.value = 'Any';
                            if (input === boatLengthInput) {
                                pendingFilters.dock.hasBoatSpecsLength = null;
                            } else if (input === boatDraftInput) {
                                pendingFilters.dock.hasBoatSpecsDraft = null;
                            } else if (input === boatBeamInput) {
                                pendingFilters.dock.hasBoatSpecsBeam = null;
                            }
                        } else {
                            let val = parseInt(this.value);
                            if (input === boatLengthInput && val > 80) val = 80;
                            this.value = (input === boatLengthInput && val >= 80) ? '80+ ft' : val + ' ft';

                            // Update pending filters
                            if (input === boatLengthInput) {
                                pendingFilters.dock.hasBoatSpecsLength = val;
                            } else if (input === boatDraftInput) {
                                pendingFilters.dock.hasBoatSpecsDraft = val;
                            } else if (input === boatBeamInput) {
                                pendingFilters.dock.hasBoatSpecsBeam = val;
                            }
                        }
                    });
                }
            });

            // New dock boat length input handling
            if (dockBoatLengthInput) {
                dockBoatLengthInput.value = '0 ft';

                dockBoatLengthInput.addEventListener('focus', function () {
                    this.value = this.value.replace(/ ft\+?/g, '');
                });

                dockBoatLengthInput.addEventListener('input', function () {
                    this.value = this.value.replace(/[^\d]/g, '');
                });

                dockBoatLengthInput.addEventListener('blur', function () {
                    if (this.value === '') {
                        this.value = '0 ft';
                        pendingFilters.dock.hasMinBoatLength = null;
                    } else {
                        let val = parseInt(this.value);
                        if (val > 55) val = 55;
                        this.value = val >= 55 ? '55+ ft' : val + ' ft';

                        // Update pending filters
                        pendingFilters.dock.hasMinBoatLength = val > 0 ? val : null;

                        // Update slider if present
                        if (dockBoatLengthScrollBar) {
                            const slider = dockBoatLengthScrollBar.querySelector('.dock-boat-slider');
                            if (slider) slider.value = val;
                            const thumb = dockBoatLengthScrollBar.querySelector('.dock-slider-thumb');
                            if (thumb) {
                                const percent = (val / 55) * 100;
                                thumb.style.left = percent + '%';
                            }
                        }
                    }
                });
            }
        }

        // Add this function to setupFilterSystem
        function setupAmenitiesSection() {


            const amenityItem = document.querySelector('[data-element="filterModalAmenity_item"]');
            const amenitiesContainer = amenityItem?.parentElement;



            if (!amenityItem || !amenitiesContainer) {
                return;
            }

            // Fetch amenities on load
            async function fetchAmenities() {
                try {
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/guestFilterAmenities');
                    const amenities = await response.json();
                    return amenities;
                } catch (error) {
                    return [];
                }
            }

            function initializePendingAmenitiesState() {
                pendingFilters.amenities = [...activeFilters.amenities];
                updateAmenitiesUI();
            }

            function updateAmenitiesUI() {
                const amenityButtons = amenitiesContainer.querySelectorAll('[data-amenity-id]');
                amenityButtons.forEach(button => {
                    const amenityId = parseInt(button.getAttribute('data-amenity-id'));
                    const isSelected = pendingFilters.amenities.includes(amenityId);
                    if (isSelected) {
                        button.classList.add('selected');
                    } else {
                        button.classList.remove('selected');
                    }
                });
            }

            function createAmenityButton(amenity) {
                const button = amenityItem.cloneNode(true);
                const img = button.querySelector('[data-element="filterModalAmenity_itemImg"]');
                const text = button.querySelector('[data-element="filterModalAmenity_itemText"]');

                if (img) {
                    img.src = amenity.attribute_icon.url;
                }
                if (text) {
                    text.textContent = amenity.attribute_name;
                }

                // Make sure the button is visible
                button.style.display = 'flex';

                // Add data attribute for tracking
                button.setAttribute('data-amenity-id', amenity.id);

                // Add click handler
                button.addEventListener('click', () => {
                    const isSelected = pendingFilters.amenities.includes(amenity.id);

                    // Update pendingFilters
                    if (isSelected) {
                        const index = pendingFilters.amenities.indexOf(amenity.id);
                        if (index > -1) {
                            pendingFilters.amenities.splice(index, 1);
                        }
                    } else {
                        if (!pendingFilters.amenities.includes(amenity.id)) {
                            pendingFilters.amenities.push(amenity.id);
                        }
                    }

                    updateAmenitiesUI();
                });

                return button;
            }

            // Initialize amenities section
            async function initializeAmenities() {

                const amenities = await fetchAmenities();



                // Clear existing items except the template
                while (amenitiesContainer.children.length > 1) {
                    amenitiesContainer.removeChild(amenitiesContainer.lastChild);
                }

                // Make sure the template item is visible initially
                amenityItem.style.display = 'flex';


                // Create buttons for each amenity
                amenities.forEach(amenity => {
                    const button = createAmenityButton(amenity);
                    amenitiesContainer.appendChild(button);

                });

                // Hide the template item after creating all buttons
                amenityItem.style.display = 'none';

            }

            // Call initialize on setup
            initializeAmenities();

            // Store initialization function for later use
            setupAmenitiesSection.initialize = initializePendingAmenitiesState;
        }

        // Add this function before the return statement in setupFilterSystem
        function setupPetsSection() {
            function initializePendingPetsState() {
                pendingFilters.petsAllowed = activeFilters.petsAllowed;
                updatePetsUI();
            }

            function updatePetsUI() {
                if (petsAllowedCheckbox) {
                    const isSelected = !!pendingFilters.petsAllowed;
                    petsAllowedCheckbox.style.backgroundColor = isSelected ? '#000' : '#fff';
                }
            }

            // Initially set the checkbox style
            if (petsAllowedCheckbox) {
                petsAllowedCheckbox.style.cursor = 'pointer';
            }

            // Add click handler
            if (petsAllowedCheckbox) {
                if (!petsAllowedCheckbox.hasAttribute('data-pets-listener-added')) {
                    petsAllowedCheckbox.addEventListener('click', () => {
                        // Toggle the pending state
                        pendingFilters.petsAllowed = !pendingFilters.petsAllowed;
                        updatePetsUI();
                    });
                    petsAllowedCheckbox.setAttribute('data-pets-listener-added', 'true');
                }
            }

            // Store initialization function for later use
            setupPetsSection.initialize = initializePendingPetsState;
        }



        // Note: The old setupBoatRentalFilterSystem() has been replaced with the modular boatModule above.
        // Filter UI elements can now be wired to boatModule.setFilters() for cleaner separation of concerns.




        // Function to update filter count badge
        function updateFilterCount() {
            let count = 0;

            // Phase 4: Updated price filter count logic
            const datesSelected = hasDates();
            const hasExtras = wantBoat() || wantChar();
            const displayCap = hasExtras ? 15000 : (datesSelected ? 12000 : 2000);

            // Count price filter (updated logic for new caps)
            if (activeFilters.priceRange.min || (activeFilters.priceRange.max && activeFilters.priceRange.max < displayCap)) {
                count++;
            }

            if (activeFilters.bedrooms) {
                count++;
            }
            if (activeFilters.beds) {
                count++;
            }
            if (activeFilters.bathrooms) {
                count++;
            }

            // Count each amenity individually
            count += activeFilters.amenities.length;
            if (activeFilters.amenities.length > 0) {
            }

            if (activeFilters.petsAllowed !== null) {
                count++;
            }

            // Count dock features
            const dockFeatures = Object.values(activeFilters.dock);
            if (dockFeatures.some(feature => feature !== null)) {
                count++;
            }


            // Update UI
            if (activeFiltersCount) {
                if (count > 0) {
                    activeFiltersCount.textContent = count;
                    activeFiltersCount.style.display = 'flex';
                } else {
                    activeFiltersCount.style.display = 'none';
                }
            } else {
            }

            return count;
        }

        // Function to apply pending filters to active filters
        function applyPendingFilters() {
            // Copy all pending filters to active filters
            activeFilters.priceRange.min = pendingFilters.priceRange.min;
            activeFilters.priceRange.max = pendingFilters.priceRange.max;
            activeFilters.bedrooms = pendingFilters.bedrooms;
            activeFilters.beds = pendingFilters.beds;
            activeFilters.bathrooms = pendingFilters.bathrooms;

            // Copy dock filters
            Object.assign(activeFilters.dock, pendingFilters.dock);

            // Copy amenities and pets
            activeFilters.amenities = [...(pendingFilters.amenities || [])];
            activeFilters.petsAllowed = pendingFilters.petsAllowed;
        }

        // Function to collect filter values from UI (kept for backward compatibility)
        function collectFilterValues() {
            // This function is now mainly for legacy support
            // The pending filters are updated in real-time by the UI components
        }

        // Function to apply filters to listings
        function applyFiltersToListings(listings) {
            const base = Array.isArray(unfilteredListings) && unfilteredListings.length
                ? unfilteredListings
                : (Array.isArray(listings) ? listings : []);
            if (!base.length) return [];


            let cardIndex = 0; // Track card index for boat rental text updates
            return base.filter((listing, index) => {
                // Phase 4: Price filter with new logic
                const datesSelected = hasDates();
                const hasExtras = wantBoat() || wantChar();
                let priceToCompare;


                // Determine price caps for "no max" logic
                const displayCap = hasExtras ? 15000 : (datesSelected ? 12000 : 2000);
                const userMax = activeFilters.priceRange.max;
                const effectiveMax = (userMax && userMax >= displayCap) ? null : userMax; // null means no limit


                if (!hasExtras && !datesSelected) {
                    // Home-only & NO dates: compare nightly price
                    priceToCompare = Number(listing.nightlyPrice || 0);
                } else if (!hasExtras && datesSelected) {
                    // Home-only & WITH dates: compare total stay price
                    priceToCompare = Number(listing.customDatesTotalPrice || 0);
                } else if (hasExtras && !datesSelected) {
                    // Extras & NO dates: compare combined starting-at
                    const homeStart = computeHomeStartNoDates(listing);
                    if (homeStart == null) {
                        return false; // Price unavailable, exclude from price-based filtering
                    }
                    const extrasStart = minBoat(listing) + minChar(listing);
                    priceToCompare = homeStart + extrasStart;
                } else {
                    // Extras & WITH dates: compare combined total
                    const base = Number(listing.customDatesTotalPrice || 0);
                    const extrasPrice = minBoat(listing) + minChar(listing);
                    priceToCompare = base + extrasPrice;

                }


                if (activeFilters.priceRange.min && priceToCompare < activeFilters.priceRange.min) {
                    return false;
                }
                if (effectiveMax && priceToCompare > effectiveMax) {
                    return false;
                }


                // Room filters
                if (activeFilters.bedrooms && listing.num_bedrooms < activeFilters.bedrooms) return false;
                if (activeFilters.beds && listing.num_beds < activeFilters.beds) return false;
                if (activeFilters.bathrooms && listing.num_bathrooms < activeFilters.bathrooms) return false;

                // Dock features filter
                if (activeFilters.dock.hasPrivateDock && !listing.private_dock) return false;
                if (activeFilters.dock.hasShorePower && !listing.dock_shorePower) return false;
                if (activeFilters.dock.hasFreshWater && !listing.dock_freshWater) return false;
                if (activeFilters.dock.hasCleaningStation && !listing.dock_cleaningStation) return false;
                if (activeFilters.dock.hasDockLights && !listing.dock_light) return false;

                // Boat specs
                if (activeFilters.dock.hasBoatSpecsLength && listing.dock_max_vessel_length < activeFilters.dock.hasBoatSpecsLength) return false;
                if (activeFilters.dock.hasBoatSpecsDraft && listing.dock_max_vessel_draft < activeFilters.dock.hasBoatSpecsDraft) return false;
                if (activeFilters.dock.hasBoatSpecsBeam && listing.dock_max_vessel_beam < activeFilters.dock.hasBoatSpecsBeam) return false;

                // New dock boat length filter - extract numeric value from string like "55 ft"
                if (activeFilters.dock.hasMinBoatLength) {
                    const dockMaxLengthStr = listing.dock_maxBoatLength;
                    if (dockMaxLengthStr) {
                        // Extract numeric value from string like "55 ft"
                        const dockMaxLength = parseInt(dockMaxLengthStr.replace(/[^\d]/g, ''));
                        if (isNaN(dockMaxLength) || dockMaxLength < activeFilters.dock.hasMinBoatLength) {
                            return false;
                        }
                    } else {
                        // If no dock max length info available, exclude from filter
                        return false;
                    }
                }

                // Amenities filter
                if (activeFilters.amenities.length > 0) {
                    const listingAmenityIds = listing._amenities?.map(a => a.attribute_id) || [];

                    // Check if the listing has all selected amenities
                    const hasAllAmenities = activeFilters.amenities.every(id => {
                        // Special case for pool: if private pool is selected, also accept shared pool
                        if (id === 55) { // Assuming 72 is the ID for private pool
                            return listingAmenityIds.includes(id) || listingAmenityIds.includes(73); // 73 is shared pool
                        }
                        return listingAmenityIds.includes(id);
                    });

                    if (!hasAllAmenities) {
                        return false;
                    }
                }

                // In the applyFiltersToListings function, make sure this condition is present
                if (activeFilters.petsAllowed !== null && listing.pets_allowed !== activeFilters.petsAllowed) return false;

                // --- CROSS-FEATURE GATING (boats + charters) ---
                const boatEnabled = (currentSelections?.typeFlags?.boatRental === true);
                const charterEnabled = (currentSelections?.typeFlags?.fishingCharter === true);

                // Set module enabled states
                if (boatEnabled) boatModule.setEnabled(true);
                else boatModule.setEnabled(false);

                if (charterEnabled) charterModule.setEnabled(true);
                else charterModule.setEnabled(false);

                // Check individual gates
                const passesBoatGate = boatModule.listingPassesBoatGate(
                    listing,
                    apiFormats?.dates,
                    apiFormats?.guests?.total
                );

                const passesCharterGate = charterModule.listingPassesCharterGate(
                    listing,
                    apiFormats?.dates,
                    apiFormats?.guests?.total
                );

                // Apply cross-feature gating rules
                if (!boatEnabled && !charterEnabled) {
                    // Neither feature active - no gating
                } else if (boatEnabled && !charterEnabled) {
                    // Only boat active - require boat
                    if (!passesBoatGate) {
                        return false;
                    }
                } else if (charterEnabled && !boatEnabled) {
                    // Only charter active - require charter
                    if (!passesCharterGate) {
                        return false;
                    }
                } else if (boatEnabled && charterEnabled) {
                    // Both active - require both
                    if (!passesBoatGate) {
                        return false;
                    }

                    if (!passesCharterGate) {
                        return false;
                    }
                }

                return true;
            });

        }



        // Initialize all components
        setupPriceSlider();
        setupRoomControls();
        setupDockSection();
        setupAmenitiesSection();
        setupPetsSection();

        // Simplified boat rental filter system using the boat module
        function setupBoatRentalFilterSystem() {
            const boatRentalFilter = document.querySelector('[data-element="boatRentalFilter"]');
            const boatFilterModal = document.querySelector('[data-element="boatFilterModal"]');
            const boatFilterBackground = document.querySelector('[data-element="boatFilter_background"]');
            const boatFilterExit = document.querySelector('[data-element="boatFilter_exit"]');
            const boatFilterViewResults = document.querySelector('[data-element="boatFilter_viewResultsButton"]');
            const boatFilterClearFilters = document.querySelector('[data-element="boatFilter_clearFiltersButton"]');
            const activeBoatFiltersCount = document.querySelector('[data-element="activeBoatFiltersCount"]');

            // Guest section elements
            const guestMinus = document.querySelector('[data-element="boatFilter_Guest_Minus"]');
            const guestNumber = document.querySelector('[data-element="boatFilter_guest_number"]');
            const guestPlus = document.querySelector('[data-element="boatFilter_guest_Plus"]');

            // Dock delivery elements
            const dockDeliveryCheckbox = document.querySelector('[data-element="boatFilter_dockDeliveryCheckbox"]');

            // Days counter elements
            const datesHowManyDaysContainer = document.querySelector('[data-element="boatFilter_datesHalfOrFull_howManyDays"]');

            // Boat type elements
            const centerConsoleCheckbox = document.querySelector('[data-element="boatFilter_selectBoat_typePopup_centerConsoleCheckbox"]');
            const flatsBoatCheckbox = document.querySelector('[data-element="boatFilter_selectBoat_typePopup_flatsBoatCheckbox"]');
            const deckBoatCheckbox = document.querySelector('[data-element="boatFilter_selectBoat_typePopup_deckBoatCheckbox"]');
            const pontoonBoatCheckbox = document.querySelector('[data-element="boatFilter_selectBoat_typePopup_pontoonBoatCheckbox"]');

            if (!boatRentalFilter || !boatFilterModal) {
                return;
            }

            // --- Setup guest controls HTML if not present ---
            // Only add button HTML if not already present (idempotent)
            if (guestMinus && guestNumber && guestPlus && !guestMinus.innerHTML.trim()) {
                guestMinus.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12h12" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                `;
                guestMinus.style.display = "flex";
                guestMinus.style.alignItems = "center";
                guestMinus.style.justifyContent = "center";
                guestMinus.style.border = "none";
                guestMinus.style.background = "none";
                guestMinus.style.cursor = "pointer";
                guestMinus.style.width = "48px";
                guestMinus.style.height = "48px";
                guestMinus.style.borderRadius = "8px 0 0 8px";
                guestMinus.type = "button";
                guestMinus.setAttribute("aria-label", "Decrease guests");
            }
            if (guestPlus && !guestPlus.innerHTML.trim()) {
                guestPlus.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v12M6 12h12" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                `;
                guestPlus.style.display = "flex";
                guestPlus.style.alignItems = "center";
                guestPlus.style.justifyContent = "center";
                guestPlus.style.border = "none";
                guestPlus.style.background = "none";
                guestPlus.style.cursor = "pointer";
                guestPlus.style.width = "48px";
                guestPlus.style.height = "48px";
                guestPlus.style.borderRadius = "0 8px 8px 0";
                guestPlus.type = "button";
                guestPlus.setAttribute("aria-label", "Increase guests");
            }
            if (guestNumber) {
                guestNumber.style.flex = "1 1 0";
                guestNumber.style.fontFamily = "'TT Fors', sans-serif";
                guestNumber.style.fontWeight = "500";
                guestNumber.style.textAlign = "center";
                guestNumber.style.padding = "0 8px";
                guestNumber.style.fontSize = "1.1rem";
            }

            // Initialize modal
            boatFilterModal.style.display = 'none';
            if (activeBoatFiltersCount) activeBoatFiltersCount.style.display = 'none';

            // Modal handlers
            boatRentalFilter.addEventListener('click', () => {
                boatFilterModal.style.display = 'flex';
                // Note: Scroll blocking removed - background scrolling allowed
                // Initialize pending state when opening modal
                boatModule.initializePendingState();
                updateBoatFilterDisplay();
            });

            boatFilterBackground?.addEventListener('click', () => {
                // Revert pending changes when closing without applying
                boatModule.revertPendingFilters();
                closeBoatFilterModal();
            });

            boatFilterExit?.addEventListener('click', () => {
                // Revert pending changes when closing without applying
                boatModule.revertPendingFilters();
                closeBoatFilterModal();
            });

            boatFilterViewResults?.addEventListener('click', () => {
                applyBoatFilters();
                closeBoatFilterModal();
            });

            boatFilterClearFilters?.addEventListener('click', () => {
                boatModule.resetPendingFilters();
                updateBoatFilterDisplay();
                // Don't update active filters display - that should only happen when Apply is clicked
            });

            function closeBoatFilterModal() {
                boatFilterModal.style.display = 'none';
            }

            function updateBoatFilterDisplay() {
                const currentFilters = boatModule.getPendingFilters();

                // Update guest count and button state
                if (guestNumber) guestNumber.textContent = currentFilters.passengers;
                if (guestMinus) {
                    if (currentFilters.passengers <= 1) {
                        guestMinus.disabled = true;
                        guestMinus.style.opacity = '0.3';
                        guestMinus.style.cursor = 'not-allowed';
                    } else {
                        guestMinus.disabled = false;
                        guestMinus.style.opacity = '1';
                        guestMinus.style.cursor = 'pointer';
                    }
                }

                // Update dock delivery checkbox
                if (dockDeliveryCheckbox) {
                    dockDeliveryCheckbox.style.backgroundColor = currentFilters.dockDelivery ? '#000' : 'transparent';
                }

                // Update days counter display
                if (datesHowManyDaysContainer) {
                    const daysDisplay = datesHowManyDaysContainer.querySelector('.days-display');
                    const daysMinus = datesHowManyDaysContainer.querySelector('.days-minus');

                    if (daysDisplay) {
                        if (currentFilters.days === 0.5) {
                            daysDisplay.textContent = '1 Half Day';
                        } else if (currentFilters.days === 1) {
                            daysDisplay.textContent = '1 Full Day';
                        } else {
                            daysDisplay.textContent = `${currentFilters.days} Days`;
                        }
                    }

                    if (daysMinus) {
                        daysMinus.style.opacity = currentFilters.days <= 0.5 ? '0.3' : '1';
                        daysMinus.style.cursor = currentFilters.days <= 0.5 ? 'not-allowed' : 'pointer';
                    }
                }

                // Update boat type checkboxes
                const boatTypeCheckboxes = [
                    { checkbox: centerConsoleCheckbox, type: 'Center console' },
                    { checkbox: flatsBoatCheckbox, type: 'Flats boat' },
                    { checkbox: deckBoatCheckbox, type: 'Deck boat' },
                    { checkbox: pontoonBoatCheckbox, type: 'Pontoon boat' }
                ];

                boatTypeCheckboxes.forEach(({ checkbox, type }) => {
                    if (checkbox) {
                        const isSelected = currentFilters.boatTypes.includes(type);
                        checkbox.style.backgroundColor = isSelected ? '#000' : 'transparent';
                    }
                });
            }

            function updateActiveBoatFiltersDisplay() {
                const filterCount = boatModule.getActiveFilterCount();
                if (activeBoatFiltersCount) {
                    if (filterCount > 0) {
                        activeBoatFiltersCount.style.display = 'flex';
                        activeBoatFiltersCount.textContent = filterCount.toString();
                    } else {
                        activeBoatFiltersCount.style.display = 'none';
                    }
                }
            }

            function applyBoatFilters() {
                // Apply pending filters to active filters
                boatModule.applyPendingFilters();

                const filteredListings = filterSystem.applyFilters(unfilteredListings || currentListings);
                currentPage = 1;
                renderListingCards(filteredListings, false, 1);
                updateMarkersVisibilityWithFilters(filteredListings);

                // Fix: Update map markers when boat filters change (affects pricing)
                if (window.currentMap && filteredListings.length > 0) {
                    // Add delay to ensure badge calculations are complete
                    setTimeout(() => {
                        clearMapMarkers();
                        addMarkersToMap(filteredListings);
                    }, 50);
                }

                // Update both boat and charter badges when boat filters are applied
                const shouldUpdateBoatBadges =
                    currentSelections?.typeFlags?.boatRental === true ||
                    apiFormats?.type?.boatRental === true;

                const shouldUpdateCharterBadges =
                    currentSelections?.typeFlags?.fishingCharter === true ||
                    apiFormats?.type?.fishingCharter === true;

                if (shouldUpdateBoatBadges) {
                    updateBoatBadgeForAllVisibleCards(filteredListings);
                }

                if (shouldUpdateCharterBadges) {
                    updateCharterBadgeForAllVisibleCards(filteredListings);
                }

                updateActiveBoatFiltersDisplay();
            }

            // Guest controls
            if (guestMinus) {
                guestMinus.addEventListener('click', () => {
                    const current = boatModule.getPendingFilters();
                    if (current.passengers > 1) {
                        boatModule.setPendingFilters({ passengers: current.passengers - 1 });
                        updateBoatFilterDisplay();
                    }
                });
            }
            if (guestPlus) {
                guestPlus.addEventListener('click', () => {
                    const current = boatModule.getPendingFilters();
                    boatModule.setPendingFilters({ passengers: current.passengers + 1 });
                    updateBoatFilterDisplay();
                });
            }

            // Dock delivery toggle
            dockDeliveryCheckbox?.addEventListener('click', () => {
                const current = boatModule.getPendingFilters();
                boatModule.setPendingFilters({ dockDelivery: !current.dockDelivery });
                updateBoatFilterDisplay();
            });

            // Boat type toggles
            const boatTypeCheckboxes = [
                { checkbox: centerConsoleCheckbox, type: 'Center console' },
                { checkbox: flatsBoatCheckbox, type: 'Flats boat' },
                { checkbox: deckBoatCheckbox, type: 'Deck boat' },
                { checkbox: pontoonBoatCheckbox, type: 'Pontoon boat' }
            ];

            boatTypeCheckboxes.forEach(({ checkbox, type }) => {
                checkbox?.addEventListener('click', () => {
                    const current = boatModule.getPendingFilters();
                    const newTypes = current.boatTypes.includes(type)
                        ? current.boatTypes.filter(t => t !== type)
                        : [...current.boatTypes, type];

                    boatModule.setPendingFilters({ boatTypes: newTypes });
                    updateBoatFilterDisplay();
                });
            });

            // Setup days counter
            function setupDaysCounter() {
                if (!datesHowManyDaysContainer) return;

                // Clear and setup days counter
                datesHowManyDaysContainer.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 0 0;
                        border: 1px solid #e2e2e2;
                        border-radius: 8px;
                        background: #fff;
                        min-height: 56px;
                        box-sizing: border-box;
                    ">
                        <button class="days-minus" style="
                            width: 48px;
                            height: 56px;
                            border: none;
                            background: none;
                            cursor: pointer;
                            border-radius: 8px 0 0 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0;
                        ">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </button>
                        <div class="days-display" style="
                            flex: 1 1 0;
                            font-family: 'TT Fors', sans-serif;
                            font-weight: 500;
                            min-width: 80px;
                            text-align: center;
                            padding: 0 8px;
                            font-size: 1.1rem;
                        ">1 Half Day</div>
                        <button class="days-plus" style="
                            width: 48px;
                            height: 56px;
                            border: none;
                            background: none;
                            cursor: pointer;
                            border-radius: 0 8px 8px 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0;
                        ">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </button>
                    </div>
                `;

                const daysDisplay = datesHowManyDaysContainer.querySelector('.days-display');
                const daysMinus = datesHowManyDaysContainer.querySelector('.days-minus');
                const daysPlus = datesHowManyDaysContainer.querySelector('.days-plus');

                // Add hover effects
                [daysMinus, daysPlus].forEach(btn => {
                    btn.addEventListener('mouseenter', () => btn.style.backgroundColor = 'whitesmoke');
                    btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '');
                });

                function updateDaysDisplay() {
                    const currentFilters = boatModule.getPendingFilters();

                    if (currentFilters.days === 0.5) {
                        daysDisplay.textContent = '1 Half Day';
                        boatModule.setPendingFilters({ lengthType: 'half' });
                    } else if (currentFilters.days === 1) {
                        daysDisplay.textContent = '1 Full Day';
                        boatModule.setPendingFilters({ lengthType: 'full' });
                    } else {
                        daysDisplay.textContent = `${currentFilters.days} Full Days`;
                        boatModule.setPendingFilters({ lengthType: 'full' });
                    }

                    // Update button states
                    daysMinus.style.opacity = currentFilters.days <= 0.5 ? '0.3' : '1';
                    daysMinus.style.cursor = currentFilters.days <= 0.5 ? 'not-allowed' : 'pointer';
                }

                daysMinus.addEventListener('click', () => {
                    const current = boatModule.getPendingFilters();
                    if (current.days > 0.5) {
                        if (current.days === 1) {
                            boatModule.setPendingFilters({ days: 0.5 });
                        } else {
                            boatModule.setPendingFilters({ days: current.days - 1 });
                        }
                        updateDaysDisplay();
                        updateBoatFilterDisplay();
                    }
                });

                daysPlus.addEventListener('click', () => {
                    const current = boatModule.getPendingFilters();
                    if (current.days === 0.5) {
                        boatModule.setPendingFilters({ days: 1 });
                    } else {
                        boatModule.setPendingFilters({ days: current.days + 1 });
                    }
                    updateDaysDisplay();
                    updateBoatFilterDisplay();
                });

                updateDaysDisplay();
            }

            setupDaysCounter();

            // Initialize display
            updateBoatFilterDisplay();
            updateActiveBoatFiltersDisplay();
        }

        setupBoatRentalFilterSystem();

        // Fishing charter filter system using the charter module
        function setupFishingCharterFilterSystem() {
            if (typeof charterModule === 'undefined') {
                return;
            }

            const fishingChartersFilter = document.querySelector('[data-element="fishingChartersFilter"]');
            const fishingCharterFilterModal = document.querySelector('[data-element="fishingCharterFilterModal"]');
            const fishingCharterFilterBackground = document.querySelector('[data-element="fishingCharterFilter_background"]');
            const fishingCharterFilterExit = document.querySelector('[data-element="fishingCharterFilter_exit"]');
            const fishingCharterFilterViewResults = document.querySelector('[data-element="fishingCharterFilter_viewResultsButton"]');
            const fishingCharterFilterClearFilters = document.querySelector('[data-element="fishingCharterFilter_clearFiltersButton"]');
            const activeFishingChartersFiltersCount = document.querySelector('[data-element="activeFishingChartersFiltersCount"]');

            // Guest section elements
            const guestMinus = document.querySelector('[data-element="fishingCharterFilter_Guest_Minus"]');
            const guestNumber = document.querySelector('[data-element="fishingCharterFilter_guest_number"]');
            const guestPlus = document.querySelector('[data-element="fishingCharterFilter_guest_Plus"]');

            // Dock delivery elements
            const dockDeliveryCheckbox = document.querySelector('[data-element="fishingCharterFilter_dockDeliveryCheckbox"]');

            // Days counter elements
            const datesHowManyDaysContainer = document.querySelector('[data-element="fishingCharterFilter_datesHalfOrFull_howManyDays"]');

            // Fishing type elements
            const inshoreFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_inshoreFishingCheckbox"]');
            const offshoreFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_offshoreFishingCheckbox"]');
            const nearFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_nearFishingCheckbox"]');
            const wreckFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_wreckFishingCheckbox"]');
            const reefFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_reefFishingCheckbox"]');
            const flatsFishingCheckbox = document.querySelector('[data-element="fishingCharterFilter_flatsFishingCheckbox"]');

            // Debug: Check which elements are found
            if (!fishingChartersFilter || !fishingCharterFilterModal) {
                return;
            }

            // --- Setup guest controls HTML if not present ---
            // Only add button HTML if not already present (idempotent)

            if (guestMinus && guestNumber && guestPlus && !guestMinus.innerHTML.trim()) {
                guestMinus.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12h12" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                `;
                guestMinus.style.display = "flex";
                guestMinus.style.alignItems = "center";
                guestMinus.style.justifyContent = "center";
                guestMinus.style.border = "none";
                guestMinus.style.background = "none";
                guestMinus.style.cursor = "pointer";
                guestMinus.style.width = "48px";
                guestMinus.style.height = "48px";
                guestMinus.style.borderRadius = "8px 0 0 8px";
                guestMinus.type = "button";
                guestMinus.setAttribute("aria-label", "Decrease guests");
            }
            if (guestPlus && !guestPlus.innerHTML.trim()) {
                guestPlus.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v12M6 12h12" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                `;
                guestPlus.style.display = "flex";
                guestPlus.style.alignItems = "center";
                guestPlus.style.justifyContent = "center";
                guestPlus.style.border = "none";
                guestPlus.style.background = "none";
                guestPlus.style.cursor = "pointer";
                guestPlus.style.width = "48px";
                guestPlus.style.height = "48px";
                guestPlus.style.borderRadius = "0 8px 8px 0";
                guestPlus.type = "button";
                guestPlus.setAttribute("aria-label", "Increase guests");
            }
            if (guestNumber) {
                guestNumber.style.flex = "1 1 0";
                guestNumber.style.fontFamily = "'TT Fors', sans-serif";
                guestNumber.style.fontWeight = "500";
                guestNumber.style.textAlign = "center";
                guestNumber.style.padding = "0 8px";
                guestNumber.style.fontSize = "1.1rem";
            }

            // Initialize modal
            fishingCharterFilterModal.style.display = 'none';
            if (activeFishingChartersFiltersCount) activeFishingChartersFiltersCount.style.display = 'none';

            // Modal handlers
            fishingChartersFilter.addEventListener('click', () => {
                fishingCharterFilterModal.style.display = 'flex';
                // Note: Scroll blocking removed - background scrolling allowed
                // Initialize pending state when opening modal
                if (typeof charterModule !== 'undefined') {
                    charterModule.initializePendingState();
                }
                updateCharterFilterDisplay();
            });

            fishingCharterFilterBackground?.addEventListener('click', () => {
                // Revert pending changes when closing without applying
                if (typeof charterModule !== 'undefined') {
                    charterModule.revertPendingFilters();
                }
                closeFishingCharterFilterModal();
            });

            fishingCharterFilterExit?.addEventListener('click', () => {
                // Revert pending changes when closing without applying
                if (typeof charterModule !== 'undefined') {
                    charterModule.revertPendingFilters();
                }
                closeFishingCharterFilterModal();
            });

            fishingCharterFilterViewResults?.addEventListener('click', () => {
                applyCharterFilters();
                closeFishingCharterFilterModal();
            });

            fishingCharterFilterClearFilters?.addEventListener('click', () => {
                if (typeof charterModule !== 'undefined') {
                    charterModule.resetPendingFilters();
                    updateCharterFilterDisplay();
                    // Don't update active filters display - that should only happen when Apply is clicked
                }
            });

            function closeFishingCharterFilterModal() {
                fishingCharterFilterModal.style.display = 'none';
            }

            function updateCharterFilterDisplay() {
                if (typeof charterModule === 'undefined') return;
                const currentFilters = charterModule.getPendingFilters();

                // Update guest count and button state
                if (guestNumber) guestNumber.textContent = currentFilters.guests;
                if (guestMinus) {
                    if (currentFilters.guests <= 1) {
                        guestMinus.disabled = true;
                        guestMinus.style.opacity = '0.3';
                        guestMinus.style.cursor = 'not-allowed';
                    } else {
                        guestMinus.disabled = false;
                        guestMinus.style.opacity = '1';
                        guestMinus.style.cursor = 'pointer';
                    }
                }

                // Update dock delivery checkbox
                if (dockDeliveryCheckbox) {
                    dockDeliveryCheckbox.style.backgroundColor = currentFilters.requirePrivateDockPickup ? '#000' : 'transparent';
                }

                // Update days counter display
                if (datesHowManyDaysContainer) {
                    const daysDisplay = datesHowManyDaysContainer.querySelector('.days-display');
                    const daysMinus = datesHowManyDaysContainer.querySelector('.days-minus');

                    if (daysDisplay) {
                        daysDisplay.textContent = `${currentFilters.days} Day${currentFilters.days > 1 ? 's' : ''}`;
                    }

                    if (daysMinus) {
                        daysMinus.style.opacity = currentFilters.days <= 1 ? '0.3' : '1';
                        daysMinus.style.cursor = currentFilters.days <= 1 ? 'not-allowed' : 'pointer';
                    }
                }

                // Update fishing type checkboxes
                const fishingTypeCheckboxes = [
                    { checkbox: inshoreFishingCheckbox, type: 'Inshore Fishing' },
                    { checkbox: offshoreFishingCheckbox, type: 'Offshore Fishing' },
                    { checkbox: nearFishingCheckbox, type: 'Nearshore Fishing' },
                    { checkbox: wreckFishingCheckbox, type: 'Wreck Fishing' },
                    { checkbox: reefFishingCheckbox, type: 'Reef Fishing' },
                    { checkbox: flatsFishingCheckbox, type: 'Flats Fishing' }
                ];

                fishingTypeCheckboxes.forEach(({ checkbox, type }) => {
                    if (checkbox) {
                        const isSelected = currentFilters.fishingTypes.includes(type);
                        checkbox.style.backgroundColor = isSelected ? '#000' : 'transparent';
                    }
                });
            }

            function updateActiveCharterFiltersDisplay() {
                if (typeof charterModule === 'undefined') return;
                const filterCount = charterModule.getActiveFilterCount();
                if (activeFishingChartersFiltersCount) {
                    if (filterCount > 0) {
                        activeFishingChartersFiltersCount.style.display = 'flex';
                        activeFishingChartersFiltersCount.textContent = filterCount.toString();
                    } else {
                        activeFishingChartersFiltersCount.style.display = 'none';
                    }
                }
            }

            function applyCharterFilters() {

                // Apply pending filters to active filters
                if (typeof charterModule !== 'undefined') {
                    charterModule.applyPendingFilters();
                }

                const filteredListings = filterSystem.applyFilters(unfilteredListings || currentListings);
                currentPage = 1;
                renderListingCards(filteredListings, false, 1);
                updateMarkersVisibilityWithFilters(filteredListings);

                // Fix: Update map markers when charter filters change (affects pricing)

                if (window.currentMap && filteredListings.length > 0) {
                    // Add delay to ensure badge calculations are complete
                    setTimeout(() => {
                        clearMapMarkers();
                        addMarkersToMap(filteredListings);
                    }, 50);
                }

                // Update both boat and charter badges when charter filters are applied
                const shouldUpdateBoatBadges =
                    currentSelections?.typeFlags?.boatRental === true ||
                    apiFormats?.type?.boatRental === true;

                const shouldUpdateCharterBadges =
                    currentSelections?.typeFlags?.fishingCharter === true ||
                    apiFormats?.type?.fishingCharter === true;

                if (shouldUpdateBoatBadges) {
                    updateBoatBadgeForAllVisibleCards(filteredListings);
                }

                if (shouldUpdateCharterBadges) {
                    updateCharterBadgeForAllVisibleCards(filteredListings);
                }

                updateActiveCharterFiltersDisplay();
            }

            // Guest controls
            if (guestMinus) {
                guestMinus.addEventListener('click', () => {
                    if (typeof charterModule === 'undefined') return;
                    const current = charterModule.getPendingFilters();
                    if (current.guests > 1) {
                        charterModule.setPendingFilters({ guests: current.guests - 1 });
                        updateCharterFilterDisplay();
                    }
                });
            }
            if (guestPlus) {
                guestPlus.addEventListener('click', () => {
                    if (typeof charterModule === 'undefined') return;
                    const current = charterModule.getPendingFilters();
                    charterModule.setPendingFilters({ guests: current.guests + 1 });
                    updateCharterFilterDisplay();
                });
            }

            // Dock delivery toggle
            dockDeliveryCheckbox?.addEventListener('click', () => {
                if (typeof charterModule === 'undefined') return;
                const current = charterModule.getPendingFilters();
                charterModule.setPendingFilters({ requirePrivateDockPickup: !current.requirePrivateDockPickup });
                updateCharterFilterDisplay();
            });

            // Fishing type toggles
            const fishingTypeCheckboxes = [
                { checkbox: inshoreFishingCheckbox, type: 'Inshore Fishing' },
                { checkbox: offshoreFishingCheckbox, type: 'Offshore Fishing' },
                { checkbox: nearFishingCheckbox, type: 'Nearshore Fishing' },
                { checkbox: wreckFishingCheckbox, type: 'Wreck Fishing' },
                { checkbox: reefFishingCheckbox, type: 'Reef Fishing' },
                { checkbox: flatsFishingCheckbox, type: 'Flats Fishing' }
            ];

            fishingTypeCheckboxes.forEach(({ checkbox, type }) => {
                checkbox?.addEventListener('click', () => {
                    if (typeof charterModule === 'undefined') return;
                    const current = charterModule.getPendingFilters();
                    const newTypes = new Set(current.fishingTypes);
                    if (newTypes.has(type)) {
                        newTypes.delete(type);
                    } else {
                        newTypes.add(type);
                    }

                    charterModule.setPendingFilters({ fishingTypes: Array.from(newTypes) });
                    updateCharterFilterDisplay();
                });
            });

            // Setup days counter
            function setupDaysCounter() {
                if (!datesHowManyDaysContainer) return;

                // Clear and setup days counter
                datesHowManyDaysContainer.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 0 0;
                        border: 1px solid #e2e2e2;
                        border-radius: 8px;
                        background: #fff;
                        min-height: 56px;
                        box-sizing: border-box;
                    ">
                        <button class="days-minus" style="
                            width: 48px;
                            height: 56px;
                            border: none;
                            background: none;
                            cursor: pointer;
                            border-radius: 8px 0 0 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0;
                        ">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </button>
                        <div class="days-display" style="
                            flex: 1 1 0;
                            font-family: 'TT Fors', sans-serif;
                            font-weight: 500;
                            min-width: 80px;
                            text-align: center;
                            padding: 0 8px;
                            font-size: 1.1rem;
                        ">1 Day</div>
                        <button class="days-plus" style="
                            width: 48px;
                            height: 56px;
                            border: none;
                            background: none;
                            cursor: pointer;
                            border-radius: 0 8px 8px 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0;
                        ">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </button>
                    </div>
                `;

                const daysDisplay = datesHowManyDaysContainer.querySelector('.days-display');
                const daysMinus = datesHowManyDaysContainer.querySelector('.days-minus');
                const daysPlus = datesHowManyDaysContainer.querySelector('.days-plus');

                // Add hover effects
                [daysMinus, daysPlus].forEach(btn => {
                    btn.addEventListener('mouseenter', () => btn.style.backgroundColor = 'whitesmoke');
                    btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '');
                });

                function updateDaysDisplay() {
                    if (typeof charterModule === 'undefined') {
                        return;
                    }
                    const currentFilters = charterModule.getPendingFilters();

                    daysDisplay.textContent = `${currentFilters.days} Day${currentFilters.days > 1 ? 's' : ''}`;

                    // Update button states
                    daysMinus.style.opacity = currentFilters.days <= 1 ? '0.3' : '1';
                    daysMinus.style.cursor = currentFilters.days <= 1 ? 'not-allowed' : 'pointer';
                }

                daysMinus.addEventListener('click', () => {
                    if (typeof charterModule === 'undefined') return;
                    const current = charterModule.getPendingFilters();
                    if (current.days > 1) {
                        charterModule.setPendingFilters({ days: current.days - 1 });
                        updateDaysDisplay();
                        updateCharterFilterDisplay();
                    }
                });

                daysPlus.addEventListener('click', () => {
                    if (typeof charterModule === 'undefined') return;
                    const current = charterModule.getPendingFilters();
                    charterModule.setPendingFilters({ days: current.days + 1 });
                    updateDaysDisplay();
                    updateCharterFilterDisplay();
                });

                updateDaysDisplay();
            }

            setupDaysCounter();

            // Initialize display
            updateCharterFilterDisplay();
            updateActiveCharterFiltersDisplay();
        }

        setupFishingCharterFilterSystem();

        // Function to initialize all pending states from active states
        function initializeAllPendingStates() {
            if (setupPriceSlider.initialize) setupPriceSlider.initialize();
            if (setupRoomControls.initialize) setupRoomControls.initialize();
            if (setupDockSection.initialize) setupDockSection.initialize();
            if (setupAmenitiesSection.initialize) setupAmenitiesSection.initialize();
            if (setupPetsSection.initialize) setupPetsSection.initialize();
        }

        // Function to revert pending changes back to active state
        function revertPendingFilterChanges() {
            initializeAllPendingStates();
        }

        // Event handlers
        filterButton?.addEventListener('click', () => {

            if (filterModal) {
                filterModal.style.display = 'flex';
                // Initialize pending state when opening modal
                initializeAllPendingStates();
            }
        });

        filterModalBackground?.addEventListener('click', () => {
            if (filterModal) {
                filterModal.style.display = 'none';
                // Revert pending changes when closing without applying
                revertPendingFilterChanges();
            }
        });

        closeFilterButton?.addEventListener('click', () => {
            if (filterModal) {
                filterModal.style.display = 'none';
                // Revert pending changes when closing without applying
                revertPendingFilterChanges();
            }
        });

        applyFiltersButton?.addEventListener('click', async () => {
            // Apply pending filters to active filters
            applyPendingFilters();

            updateFilterCount();
            if (filterModal) {
                filterModal.style.display = 'none';
            }

            // Just apply filters to existing results

            const filteredListings = applyFiltersToListings(unfilteredListings || currentListings);

            currentPage = 1;
            renderListingCards(filteredListings, false, 1);
            updateMarkersVisibilityWithFilters(filteredListings);

            // Fix: Update map marker prices when filters are applied

            if (window.currentMap && filteredListings.length > 0) {
                // Add delay to ensure all badge calculations are complete
                setTimeout(() => {
                    clearMapMarkers();
                    addMarkersToMap(filteredListings);

                }, 100);
            }

            // Update badges for enabled extras - ALWAYS update both when any filter is applied
            const shouldUpdateBoatBadges =
                currentSelections?.typeFlags?.boatRental === true ||
                apiFormats?.type?.boatRental === true;

            const shouldUpdateCharterBadges =
                currentSelections?.typeFlags?.fishingCharter === true ||
                apiFormats?.type?.fishingCharter === true;

            if (shouldUpdateBoatBadges) {
                updateBoatBadgeForAllVisibleCards(filteredListings);
            }

            if (shouldUpdateCharterBadges) {
                updateCharterBadgeForAllVisibleCards(filteredListings);
            }
        });

        clearFiltersButton?.addEventListener('click', () => {
            clearAllFilters();
        });

        // Define clearAllFilters function here
        function clearAllFilters() {
            // Define the reset state
            const resetState = {
                priceRange: { min: null, max: null },
                bedrooms: null,
                beds: null,
                bathrooms: null,
                dock: {
                    hasPrivateDock: null,
                    hasShorePower: null,
                    hasFreshWater: null,
                    hasCleaningStation: null,
                    hasDockLights: null,
                    hasBoatSpecsLength: null,
                    hasBoatSpecsDraft: null,
                    hasBoatSpecsBeam: null,
                    hasMinBoatLength: null,
                },
                amenities: [],
                petsAllowed: null,
            };

            // Reset ONLY pending states (not active filters - those should only change when Apply is clicked)
            Object.assign(pendingFilters, JSON.parse(JSON.stringify(resetState)));

            // Update UI elements to show the cleared state
            // We need to manually update the UI instead of using initialize functions
            // because initialize functions copy from active filters

            // Update price UI manually
            const maxPrice = apiFormats.dates.checkIn ? 12000 : 2000;
            if (priceMinInput) priceMinInput.value = '$0';
            if (priceMaxInput) {
                priceMaxInput.value = `$${maxPrice.toLocaleString()}+`;
            }

            // Update price slider elements
            if (priceScrollBar) {
                const sliderMin = priceScrollBar.querySelector('.price-slider-min');
                const sliderMax = priceScrollBar.querySelector('.price-slider-max');
                const range = priceScrollBar.querySelector('.price-slider-range');
                const thumbMin = priceScrollBar.querySelector('.price-slider-thumb-min');
                const thumbMax = priceScrollBar.querySelector('.price-slider-thumb-max');

                if (sliderMin) sliderMin.value = 0;
                if (sliderMax) sliderMax.value = maxPrice;

                if (range) {
                    range.style.left = '0%';
                    range.style.width = '100%';
                }
                if (thumbMin) thumbMin.style.left = '0%';
                if (thumbMax) thumbMax.style.left = '100%';
            }

            // Update room UI manually
            if (bedroomsElements.number) bedroomsElements.number.textContent = 'Any';
            if (bedsElements.number) bedsElements.number.textContent = 'Any';
            if (bathroomsElements.number) bathroomsElements.number.textContent = 'Any';

            // Update minus button states
            if (bedroomsElements.minus) {
                bedroomsElements.minus.style.opacity = '0.3';
                bedroomsElements.minus.disabled = true;
            }
            if (bedsElements.minus) {
                bedsElements.minus.style.opacity = '0.3';
                bedsElements.minus.disabled = true;
            }
            if (bathroomsElements.minus) {
                bathroomsElements.minus.style.opacity = '0.3';
                bathroomsElements.minus.disabled = true;
            }

            // Update dock UI manually
            if (privateDockCheckbox) {
                privateDockCheckbox.style.backgroundColor = '#fff';
            }
            if (privateDockOptions) {
                privateDockOptions.style.display = 'none';
            }

            // Clear dock specs
            Object.entries(dockSpecs).forEach(([key, element]) => {
                if (element) {
                    element.classList.remove('selected');
                }
            });

            // Reset boat specs inputs
            if (boatLengthInput) boatLengthInput.value = 'Any';
            if (boatDraftInput) boatDraftInput.value = 'Any';
            if (boatBeamInput) boatBeamInput.value = 'Any';

            // Reset boat length slider
            if (boatLengthScrollBar) {
                const slider = boatLengthScrollBar.querySelector('.boat-slider');
                const thumb = boatLengthScrollBar.querySelector('.slider-thumb');
                if (slider) slider.value = 15;
                if (thumb) thumb.style.left = '18.75%'; // 15/80 * 100
            }

            // Reset new dock boat length input and slider
            if (dockBoatLengthInput) dockBoatLengthInput.value = '0 ft';
            if (dockBoatLengthScrollBar) {
                const dockSlider = dockBoatLengthScrollBar.querySelector('.dock-boat-slider');
                const dockThumb = dockBoatLengthScrollBar.querySelector('.dock-slider-thumb');
                if (dockSlider) dockSlider.value = 0;
                if (dockThumb) dockThumb.style.left = '0%';
            }

            // Update pets UI manually
            if (petsAllowedCheckbox) {
                petsAllowedCheckbox.style.backgroundColor = '#fff';
            }

            // Update amenities UI manually
            const amenityButtons = document.querySelectorAll('[data-amenity-id]');
            amenityButtons.forEach(button => {
                button.classList.remove('selected');
            });

            // Don't update filter count yet - that should only happen when filters are applied
            // Don't re-render results - that should only happen when Apply Changes is clicked
        }

        return {
            applyFilters: applyFiltersToListings,
            clearFilters: clearAllFilters,
            updateCount: updateFilterCount,
            getActiveFilters: () => activeFilters,
            updatePriceFilter: () => {

                // Clear price filters if pricing mode has changed
                const filtersCleared = clearPriceFiltersOnModeChange();

                // Safely reinitialize price slider when search state changes
                try {
                    setupPriceSlider();
                } catch (e) {
                }

                // If filters were cleared, re-apply filters to update the listings
                if (filtersCleared) {
                    // Update filter count after clearing
                    updateFilterCount();

                    // Re-apply filters with cleared price filters
                    const filteredListings = filterSystem.applyFilters(unfilteredListings || currentListings);
                    currentPage = 1;
                    renderListingCards(filteredListings, false, 1);
                    updateMarkersVisibilityWithFilters(filteredListings);

                    // Update map markers if needed
                    if (window.currentMap && filteredListings.length > 0) {
                        setTimeout(() => {
                            clearMapMarkers();
                            addMarkersToMap(filteredListings);
                        }, 50);
                    }

                    // Update badges for enabled extras
                    const shouldUpdateBoatBadges =
                        currentSelections?.typeFlags?.boatRental === true ||
                        apiFormats?.type?.boatRental === true;

                    const shouldUpdateCharterBadges =
                        currentSelections?.typeFlags?.fishingCharter === true ||
                        apiFormats?.type?.fishingCharter === true;

                    if (shouldUpdateBoatBadges) {
                        updateBoatBadgeForAllVisibleCards(filteredListings);
                    }

                    if (shouldUpdateCharterBadges) {
                        updateCharterBadgeForAllVisibleCards(filteredListings);
                    }
                }
            }
        };
    }

    // ADD THIS: Modified function to update markers visibility with filters
    function updateMarkersVisibilityWithFilters(filteredListings) {
        if (!window.mapMarkers) return;

        const filteredListingIds = filteredListings.map(listing => listing.id);

        // Hide all markers first
        Object.entries(window.mapMarkers).forEach(([listingId, marker]) => {
            const shouldBeVisible = filteredListingIds.includes(parseInt(listingId));

            if (marker.setMap) {
                marker.setMap(shouldBeVisible ? window.currentMap : null);
            } else if (marker.div) {
                marker.div.style.display = shouldBeVisible ? 'block' : 'none';
            }
        });
    }

    // New function to properly format dates for API without timezone issues
    function formatDateForAPI(date) {
        if (!date) return '';

        // If it's already a string in YYYY-MM-DD format, return as-is
        if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
        }

        // If it's a Date object, extract components manually
        if (date instanceof Date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
            const day = date.getDate();

            // Format with leading zeros
            const formattedMonth = String(month).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');

            return `${year}-${formattedMonth}-${formattedDay}`;
        }

        // If it's neither a valid Date object nor a YYYY-MM-DD string, return empty
        return '';
    }

    // Add this at the top of your file with other variables
    let isSearchInProgress = false;

    // ADD THIS: Skeleton loading functionality at the top after the existing variables
    let skeletonTimeout = null;
    let skeletonStartTime = null;
    const MINIMUM_SKELETON_TIME = 1500; // 1.5 seconds minimum display

    // Add skeleton CSS styles
    const skeletonStyles = document.createElement('style');
    skeletonStyles.textContent = `
        /* Skeleton container styling */
        [data-element="listings-skeleton-container"] {
            display: none;
            flex-wrap: wrap;
            column-gap: 20px;
            row-gap: 20px !important;
            width: 100%;
            justify-content: flex-start;
        }
        
        /* Individual skeleton card styling */
        .skeleton-card {
            width: 48%;
            min-width: 264px;
            height: 320px;
            max-height: 320px;
            background: #f0f0f0;
            border-radius: 5px;
            position: relative;
            overflow: hidden;
            animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        
        /* Skeleton shimmer effect */
        .skeleton-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.6),
                transparent
            );
            animation: skeleton-shimmer 2s infinite;
        }
        
        /* Skeleton pulse animation */
        @keyframes skeleton-pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.8;
            }
        }
        
        /* Skeleton shimmer animation */
        @keyframes skeleton-shimmer {
            0% {
                left: -100%;
            }
            100% {
                left: 100%;
            }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .skeleton-card {
                width: 100%;
                min-width: unset;
            }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
            .skeleton-card {
                width: 48%;
            }
        }
        
        @media (min-width: 1025px) {
            .skeleton-card {
                width: 48%;
            }
        }
    `;
    document.head.appendChild(skeletonStyles);

    // Function to create skeleton container if it doesn't exist
    function createSkeletonContainer() {
        let skeletonContainer = document.querySelector('[data-element="listings-skeleton-container"]');

        if (!skeletonContainer) {
            skeletonContainer = document.createElement('div');
            skeletonContainer.setAttribute('data-element', 'listings-skeleton-container');
            skeletonContainer.style.display = 'flex';
            skeletonContainer.style.flexWrap = 'wrap';
            skeletonContainer.style.gap = '20px';
            skeletonContainer.style.width = '100%';
            skeletonContainer.style.justifyContent = 'flex-start';

            // Insert skeleton container right after listings container
            const listingsContainer = document.querySelector('[data-element="listings-container"]');
            if (listingsContainer && listingsContainer.parentNode) {
                listingsContainer.parentNode.insertBefore(skeletonContainer, listingsContainer.nextSibling);
            }
        }

        return skeletonContainer;
    }

    // Function to create skeleton cards
    function createSkeletonCards(count = 4) {
        const skeletonContainer = createSkeletonContainer();
        skeletonContainer.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonContainer.appendChild(skeletonCard);
        }
    }

    // Function to show skeleton loading with minimum time (NON-BLOCKING VERSION)
    function showSkeletonLoading() {
        const listingsContainer = document.querySelector('[data-element="listings-container"]');
        const skeletonContainer = createSkeletonContainer();
        const paginationContainer = document.querySelector('[data-element="pagination-container"]');

        // Record when skeleton loading started
        skeletonStartTime = Date.now();

        // Use requestAnimationFrame to avoid blocking map interactions
        requestAnimationFrame(() => {
            // Create and show skeleton cards
            createSkeletonCards(4);

            // Hide listings container and pagination
            if (listingsContainer) {
                listingsContainer.style.display = 'none';
            }
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }

            // Show skeleton container
            skeletonContainer.style.display = 'flex';
        });
    }

    // Function to hide skeleton loading with minimum time check (NON-BLOCKING VERSION)
    function hideSkeletonLoading() {
        const listingsContainer = document.querySelector('[data-element="listings-container"]');
        const skeletonContainer = document.querySelector('[data-element="listings-skeleton-container"]');

        if (!skeletonStartTime) {
            // If skeleton wasn't shown, just ensure containers are visible
            requestAnimationFrame(() => {
                if (listingsContainer) listingsContainer.style.display = '';
                if (skeletonContainer) skeletonContainer.style.display = 'none';
            });
            return;
        }

        const elapsedTime = Date.now() - skeletonStartTime;
        const remainingTime = Math.max(0, MINIMUM_SKELETON_TIME - elapsedTime);

        // Clear any existing timeout
        if (skeletonTimeout) {
            clearTimeout(skeletonTimeout);
        }

        // Use requestAnimationFrame for smooth transitions
        const hideSkeletonElements = () => {
            requestAnimationFrame(() => {
                // Hide skeleton container
                if (skeletonContainer) {
                    skeletonContainer.style.display = 'none';
                }

                // Show listings container
                if (listingsContainer) {
                    listingsContainer.style.display = '';
                }

                // Reset timing variables
                skeletonStartTime = null;
                skeletonTimeout = null;
            });
        };

        // If minimum time hasn't passed, wait for remaining time
        if (remainingTime > 0) {
            skeletonTimeout = setTimeout(hideSkeletonElements, remainingTime);
        } else {
            // Minimum time has passed, hide immediately
            hideSkeletonElements();
        }
    }



    // MODIFY the fetchPropertySearchResults function to include skeleton loading
    async function fetchPropertySearchResults() {
        console.log("fetchPropertySearchResults called");
        console.trace("Call stack for fetchPropertySearchResults");

        // Prevent multiple simultaneous searches
        if (isSearchInProgress) {
            console.log("fetchPropertySearchResults blocked - already in progress");
            return;
        }

        try {
            isSearchInProgress = true;

            // Wait for user data to be loaded (for age-based filtering)
            await waitForUserData();

            // Show skeleton loading
            showSkeletonLoading();

            // Show loading state on search button
            const searchButton = document.querySelector('[data-element="navBarSearch_searchButton"]');
            if (searchButton) {
                searchButton.classList.add('loading');
            }

            // Convert apiFormats to URL parameters
            const params = new URLSearchParams();

            // Add parameters based on apiFormats object
            // Type flags (always send booleans)
            params.append('boatRental', String(!!apiFormats.type?.boatRental));
            params.append('fishingCharter', String(!!apiFormats.type?.fishingCharter));

            // Location
            if (apiFormats.location && apiFormats.location.name) {
                params.append('location_name', apiFormats.location.name);

                // Add bounds if available
                if (apiFormats.location.bounds) {
                    if (apiFormats.location.bounds.northeast) {
                        params.append('ne_lat', apiFormats.location.bounds.northeast.lat);
                        params.append('ne_lng', apiFormats.location.bounds.northeast.lng);
                    }
                    if (apiFormats.location.bounds.southwest) {
                        params.append('sw_lat', apiFormats.location.bounds.southwest.lat);
                        params.append('sw_lng', apiFormats.location.bounds.southwest.lng);
                    }
                }
            }

            // Dates - use the new formatting function
            if (apiFormats.dates) {
                const formattedCheckIn = formatDateForAPI(apiFormats.dates.checkIn);
                const formattedCheckOut = formatDateForAPI(apiFormats.dates.checkOut);

                if (formattedCheckIn) params.append('check_in', formattedCheckIn);
                if (formattedCheckOut) params.append('check_out', formattedCheckOut);
            }

            // Guests
            if (apiFormats.guests) {
                if (apiFormats.guests.adults > 0) params.append('adults', apiFormats.guests.adults);
                if (apiFormats.guests.children > 0) params.append('children', apiFormats.guests.children);
                if (apiFormats.guests.infants > 0) params.append('infants', apiFormats.guests.infants);
                if (apiFormats.guests.pets > 0) params.append('pets', apiFormats.guests.pets);
                if (apiFormats.guests.total > 0) params.append('guests_total', apiFormats.guests.total);
            }

            // Make the API request as GET with query parameters
            const apiUrl = `https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_search?${params.toString()}`;

            const response = await fetch(apiUrl, {
                method: 'GET'
            });
            console.log("request is happening")

            // Remove loading state from search button
            if (searchButton) {
                searchButton.classList.remove('loading');
            }

            // Check if the response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error: ${response.status}`);
            }

            // Parse the data
            const apiResponse = await response.json();
            // The endpoint now returns { availableProperties: [...] }
            const availableProperties = apiResponse.availableProperties || [];
            boatRentals = apiResponse.boatRentals || [];
            fishingCharters = apiResponse.fishingCharters || [];



            // Store results in localStorage
            localStorage.setItem('propertySearchResults', JSON.stringify(availableProperties));

            // Set the base list for filtering
            currentListings = Array.isArray(availableProperties) ? availableProperties : [];
            unfilteredListings = [...currentListings];

            boatModule.buildIndex(availableProperties || [], boatRentals || []);

            // Build charter index after results are loaded
            charterModule.buildIndex(availableProperties || [], fishingCharters || []);

            // Now re-apply any active filters to the new base list
            const filtered = filterSystem ? filterSystem.applyFilters(unfilteredListings) : unfilteredListings;
            currentPage = 1;
            renderListingCards(filtered, false, currentPage);
            updateMarkersVisibilityWithFilters(filtered);

            // Update badges if needed (boat/charter)

            if (apiFormats?.type?.boatRental || currentSelections?.typeFlags?.boatRental) {
                updateBoatBadgeForAllVisibleCards(filtered);
            }
            if (apiFormats?.type?.fishingCharter || currentSelections?.typeFlags?.fishingCharter) {
                updateCharterBadgeForAllVisibleCards(filtered);
            }

            // Setup map with filtered results
            await setupMapIntegration(filtered);

            // Fix: Update map markers after search to reflect current pricing state

            if (window.currentMap && filtered.length > 0) {
                // Force marker recreation with current pricing logic
                setTimeout(() => {
                    clearMapMarkers();
                    addMarkersToMap(filtered);
                }, 100);
            }

            return availableProperties;
        } catch (error) {
            return { error: true, message: error.message };
        } finally {
            // Always reset the search flag when done
            isSearchInProgress = false;

            // Remove loading state from search button
            const searchButton = document.querySelector('[data-element="navBarSearch_searchButton"]');
            if (searchButton) {
                searchButton.classList.remove('loading');
            }

            // Hide skeleton loading
            hideSkeletonLoading();
        }
    }

    // MODIFY setupMapIntegration to initialize map only once:
    function setupMapIntegration(filteredResults) {
        // filteredResults are already filtered, no need to re-apply filters

        // Load Google Maps API if not already loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            loadGoogleMapsAPI(() => {
                initializeMap(); // Initialize map once
                renderSearchResults(filteredResults);
            });
        } else {
            if (!isMapInitialized) {
                initializeMap(); // Initialize map once
            }
            renderSearchResults(filteredResults);
        }
    }

    // MODIFY the renderSearchResults function to use the new approach:
    function renderSearchResults(filteredResults) {
        // Cards and badges are already rendered, just update map with filtered results
        updateMapWithResults(filteredResults);
    }

    // Function to load Google Maps API with callback
    function loadGoogleMapsAPI(callback) {


        // Check if API is already loading or loaded
        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
            // If already loading, set a timeout to check again
            setTimeout(() => {
                if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                    callback();
                } else {
                    loadGoogleMapsAPI(callback); // Keep checking
                }
            }, 100);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        // Define global callback for Google Maps
        window.initMap = function () {
            callback();
        };
    }

    function initializeCustomCarouselForCard(card, listing) {
        // Find the images container within the card
        const imagesContainer = card.querySelector('[data-element="listing-card-images-container"]');

        if (!imagesContainer || !listing._images || listing._images.length === 0) {
            return; // No container or no images
        }

        // Check if already initialized
        if (imagesContainer.classList.contains('is-initialized')) {
            return; // Already initialized
        }

        // Create carousel structure
        const carouselHTML = `
            <div class="custom-carousel" style="position: relative; width: 100%; height: 100%; border-radius: 5px; overflow: hidden;">
                <div class="carousel-track" style="display: flex; width: 100%; height: 100%; transition: transform 0.3s ease;">
                    ${listing._images.map((imageData, index) => {
            if (imageData && imageData.property_image && imageData.property_image.url) {
                const loadingStrategy = index < 3 ? 'eager' : 'lazy';
                return `
                                <div class="carousel-slide" style="flex: 0 0 100%; height: 100%;">
                                    <img src="${imageData.property_image.url}" 
                                         alt="${listing.property_name || 'Property Photo'}"
                                         loading="${loadingStrategy}"
                                         style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            `;
            }
            return '';
        }).join('')}
                </div>
                
                ${listing._images.length > 1 ? `
                    <button class="image_arrow_prev" style="
                        position: absolute;
                        left: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(255, 255, 255, 0.8);
                        border: none;
                        border-radius: 50%;
                        width: 34px;
                        height: 34px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        z-index: 100;
                        box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.4);
                        opacity: 0.8;
                        transition: opacity 0.2s ease;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <button class="image_arrow_next" style="
                        position: absolute;
                        right: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(255, 255, 255, 0.8);
                        border: none;
                        border-radius: 50%;
                        width: 34px;
                        height: 34px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        z-index: 100;
                        box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.4);
                        opacity: 0.8;
                        transition: opacity 0.2s ease;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <div class="carousel-pagination" style="
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 6px;
                        z-index: 100;
                    ">
                        ${listing._images.slice(0, Math.min(5, listing._images.length)).map((_, index) => `
                            <div class="carousel-dot" data-index="${index}" style="
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: rgba(255, 255, 255, 0.5);
                                cursor: pointer;
                                transition: background 0.2s ease;
                                ${index === 0 ? 'background: white;' : ''}
                            "></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        imagesContainer.innerHTML = carouselHTML;

        // Initialize carousel functionality
        let currentIndex = 0;
        const totalImages = listing._images.length;
        const track = imagesContainer.querySelector('.carousel-track');
        const prevButton = imagesContainer.querySelector('.image_arrow_prev');
        const nextButton = imagesContainer.querySelector('.image_arrow_next');
        const dots = imagesContainer.querySelectorAll('.carousel-dot');

        // Touch/scroll variables
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;
        let hasMoved = false;
        const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
        const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity for a swipe
        const CLICK_THRESHOLD = 10; // Maximum movement to still be considered a click
        const CLICK_TIME_THRESHOLD = 300; // Maximum time for a click (ms)

        function updateCarousel(skipTransition = false) {
            if (track) {
                if (skipTransition) {
                    track.style.transition = 'none';
                    track.style.transform = `translateX(-${currentIndex * 100}%)`;
                    // Re-enable transition after a brief delay
                    requestAnimationFrame(() => {
                        track.style.transition = 'transform 0.3s ease';
                    });
                } else {
                    track.style.transform = `translateX(-${currentIndex * 100}%)`;
                }
            }

            // Update dots (max 5 dots, cycling through)
            dots.forEach((dot, index) => {
                const isActive = index === (currentIndex % Math.min(5, totalImages));
                dot.style.background = isActive ? 'white' : 'rgba(255, 255, 255, 0.5)';
            });
        }

        function goToNext() {
            const wasLastImage = currentIndex === totalImages - 1;
            currentIndex = (currentIndex + 1) % totalImages;
            updateCarousel(wasLastImage); // Skip transition when wrapping from last to first
        }

        function goToPrev() {
            const wasFirstImage = currentIndex === 0;
            if (currentIndex === 0) {
                currentIndex = totalImages - 1;
            } else {
                currentIndex = currentIndex - 1;
            }
            updateCarousel(wasFirstImage); // Skip transition when wrapping from first to last
        }

        // Touch/Mouse event handlers
        function handleStart(e) {
            isDragging = true;
            hasMoved = false;
            startTime = Date.now();
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            currentX = startX;
        }

        function handleMove(e) {
            if (!isDragging) return;

            currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const deltaX = currentX - startX;

            // Only start preventing default and showing visual feedback if user has moved significantly
            if (Math.abs(deltaX) > CLICK_THRESHOLD && !hasMoved) {
                hasMoved = true;
                // Now disable transition and prevent default
                if (track) {
                    track.style.transition = 'none';
                }
            }

            // Only prevent default and show visual feedback if user has moved significantly
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                const translateX = -currentIndex * 100 + (deltaX / track.offsetWidth) * 100;

                if (track) {
                    track.style.transform = `translateX(${translateX}%)`;
                }
            }
        }

        function handleEnd(e) {
            if (!isDragging) return;

            const deltaX = currentX - startX;
            const deltaTime = Date.now() - startTime;
            const velocity = Math.abs(deltaX) / deltaTime;

            // Check if this was a click: short time AND minimal movement
            const isClick = deltaTime < CLICK_TIME_THRESHOLD && Math.abs(deltaX) <= CLICK_THRESHOLD && !hasMoved;

            if (isClick) {
                isDragging = false;
                hasMoved = false;
                return; // Let the click event handle navigation
            }

            // User did drag, so prevent any click events and handle swipe
            e.preventDefault();
            e.stopPropagation();
            isDragging = false;
            hasMoved = false;

            // Re-enable transition
            if (track) {
                track.style.transition = 'transform 0.3s ease';
            }

            // Determine if we should change slides
            const shouldSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;

            if (shouldSwipe) {
                if (deltaX > 0) {
                    // Swipe right - go to previous
                    goToPrev();
                } else {
                    // Swipe left - go to next
                    goToNext();
                }
            } else {
                // Snap back to current slide
                updateCarousel();
            }
        }

        // Add event listeners
        if (prevButton) {
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrev();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
            });
        }

        // Add touch/mouse event listeners to the carousel
        const carousel = imagesContainer.querySelector('.custom-carousel');
        if (carousel) {
            // Touch events for mobile
            carousel.addEventListener('touchstart', handleStart, { passive: false });
            carousel.addEventListener('touchmove', handleMove, { passive: false });
            carousel.addEventListener('touchend', handleEnd, { passive: false });

            // Mouse events for desktop
            carousel.addEventListener('mousedown', handleStart);
            carousel.addEventListener('mousemove', handleMove);
            carousel.addEventListener('mouseup', handleEnd);
            carousel.addEventListener('mouseleave', handleEnd); // Handle mouse leaving the area

            // Prevent default drag behavior on images
            const images = carousel.querySelectorAll('img');
            images.forEach(img => {
                img.addEventListener('dragstart', (e) => e.preventDefault());
            });
        }

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentIndex = index;
                updateCarousel();
            });
        });

        // Mark as initialized
        imagesContainer.classList.add('is-initialized');

        // Store drag state on the card for access by click handlers
        card._dragState = {
            isDragging: () => isDragging,
            hasMoved: () => hasMoved
        };
    }



    // Function to render pagination controls
    function renderPagination(totalListings) {
        const paginationContainer = document.querySelector('[data-element="pagination-container"]');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalListings / listingsPerPage);

        // Hide pagination if only 1 page or no listings
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        // Show pagination container
        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = '';

        // Previous button
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '←';
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderListingCards(currentListings, false, currentPage);
                renderPagination(totalListings);
                updateMarkersVisibility(currentPage); // ADD THIS
                // Update badges for paginated listings
                const startIndex = (currentPage - 1) * listingsPerPage;
                const endIndex = startIndex + listingsPerPage;
                const paginatedListings = currentListings.slice(startIndex, endIndex);

                const shouldUpdateBoatBadges =
                    currentSelections?.typeFlags?.boatRental === true ||
                    apiFormats?.type?.boatRental === true;

                const shouldUpdateCharterBadges =
                    currentSelections?.typeFlags?.fishingCharter === true ||
                    apiFormats?.type?.fishingCharter === true;

                if (shouldUpdateBoatBadges) {
                    updateBoatBadgeForAllVisibleCards(paginatedListings);
                }

                if (shouldUpdateCharterBadges) {
                    updateCharterBadgeForAllVisibleCards(paginatedListings);
                }
            });
            paginationContainer.appendChild(prevBtn);
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === currentPage);
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderListingCards(currentListings, false, currentPage);
                renderPagination(totalListings);
                updateMarkersVisibility(currentPage); // ADD THIS
                // Update badges for paginated listings
                const startIndex = (currentPage - 1) * listingsPerPage;
                const endIndex = startIndex + listingsPerPage;
                const paginatedListings = currentListings.slice(startIndex, endIndex);

                const shouldUpdateBoatBadges =
                    currentSelections?.typeFlags?.boatRental === true ||
                    apiFormats?.type?.boatRental === true;

                const shouldUpdateCharterBadges =
                    currentSelections?.typeFlags?.fishingCharter === true ||
                    apiFormats?.type?.fishingCharter === true;

                if (shouldUpdateBoatBadges) {
                    updateBoatBadgeForAllVisibleCards(paginatedListings);
                }

                if (shouldUpdateCharterBadges) {
                    updateCharterBadgeForAllVisibleCards(paginatedListings);
                }
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Next button
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '→';
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderListingCards(currentListings, false, currentPage);
                renderPagination(totalListings);
                updateMarkersVisibility(currentPage); // ADD THIS
                // Update badges for paginated listings
                const startIndex = (currentPage - 1) * listingsPerPage;
                const endIndex = startIndex + listingsPerPage;
                const paginatedListings = currentListings.slice(startIndex, endIndex);

                const shouldUpdateBoatBadges =
                    currentSelections?.typeFlags?.boatRental === true ||
                    apiFormats?.type?.boatRental === true;

                const shouldUpdateCharterBadges =
                    currentSelections?.typeFlags?.fishingCharter === true ||
                    apiFormats?.type?.fishingCharter === true;

                if (shouldUpdateBoatBadges) {
                    updateBoatBadgeForAllVisibleCards(paginatedListings);
                }

                if (shouldUpdateCharterBadges) {
                    updateCharterBadgeForAllVisibleCards(paginatedListings);
                }
            });
            paginationContainer.appendChild(nextBtn);
        }
    }

    // Add CSS for pagination styling
    const paginationStyle = document.createElement('style');
    paginationStyle.textContent = `
            [data-element="pagination-container"] {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                margin-top: 20px;
                margin-bottom: 20px;
            }
            
            [data-element="pagination-container"] button {
                width: 40px;
                height: 40px;
                padding: 8px;
                border: 1px solid #ddd;
                background: white;
                cursor: pointer;
                border-radius: 50%;
                font-family: "TT Fors", sans-serif;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            [data-element="pagination-container"] button:hover {
                background: #f5f5f5;
            }
            
            [data-element="pagination-container"] button.active {
                background:rgb(0, 0, 0);
                color: white;
                border-color: #000000;
            }
            
            [data-element="pagination-container"] button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
    document.head.appendChild(paginationStyle);



    // Function to render listing cards (with custom carousel)
    function renderListingCards(listings, filteredOnly = false, page = 1) {

        console.log("renderListingCards is happening")
        const listingCardTemplate = document.querySelector('[data-element="listingCard_block"]');
        const listingContainer = document.querySelector('[data-element="listings-container"]');

        if (!listingCardTemplate || !listingContainer) {
            return;
        }

        // Store listings for pagination
        if (!filteredOnly) {
            currentListings = listings || [];
            currentPage = page;
        } else {
            // IMPORTANT: When filtering, update currentListings to the filtered set
            currentListings = listings || [];
            // ALWAYS reset to page 1 when the view changes (when filtering)
            currentPage = 1;  // Changed this line - always reset to 1, not conditionally
        }

        // Update listings count display
        let listingsCountElement = document.querySelector('[data-element="listings-count"]');
        if (!listingsCountElement) {
            listingsCountElement = document.createElement('div');
            listingsCountElement.setAttribute('data-element', 'listings-count');
            // Insert before the listings container
            listingContainer.parentNode.insertBefore(listingsCountElement, listingContainer);
        }

        // Update count text
        const totalListings = currentListings.length;
        listingsCountElement.textContent = totalListings === 1
            ? '1 Listing'
            : `${totalListings} Listings`;

        // Calculate pagination
        const startIndex = (currentPage - 1) * listingsPerPage;
        const endIndex = startIndex + listingsPerPage;
        const paginatedListings = (currentListings || []).slice(startIndex, endIndex);

        // If this is a filter update, hide all cards first
        if (filteredOnly) {
            const existingCards = listingContainer.querySelectorAll('[data-listing-id]');
            existingCards.forEach(card => card.style.display = 'none');
        } else {
            // First-time initialization - hide template and clear container
            // Instead of removing template, just hide it
            listingCardTemplate.style.display = 'none';

            // Clear container but preserve template
            const cards = listingContainer.querySelectorAll('[data-listing-id]');
            cards.forEach(card => card.remove());
        }

        // No listings? Show empty state
        if (!listings || listings.length === 0) {
            // First, remove ALL existing empty state elements
            const existingEmptyMessages = listingContainer.querySelectorAll('.no-results-message');
            const existingResetButtons = listingContainer.querySelectorAll('button[data-reset-search]');

            existingEmptyMessages.forEach(msg => msg.remove());
            existingResetButtons.forEach(btn => btn.remove());

            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-results-message';
            emptyMessage.textContent = 'No properties found in this area :(\n' +
                'Try adjusting your search.';
            emptyMessage.style.padding = '20px 40px 0px 20px';
            emptyMessage.style.fontSize = '16px';
            emptyMessage.style.fontFamily = 'TT Fors, sans-serif';
            emptyMessage.style.color = '#000000';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.width = '100%';

            // Create reload button
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Reset search';
            // Add a data attribute to make it easier to find and remove
            reloadButton.setAttribute('data-reset-search', 'true');
            reloadButton.style.marginTop = '15px';
            reloadButton.style.padding = '10px 0px 10px 10px';
            reloadButton.style.fontSize = '16px';
            reloadButton.style.fontFamily = 'TT Fors, sans-serif';
            reloadButton.style.backgroundColor = '#9ecaff';
            reloadButton.style.color = '#000000';
            reloadButton.style.border = 'none';
            reloadButton.style.borderRadius = '4px';
            reloadButton.style.cursor = 'pointer';
            reloadButton.style.textAlign = 'center';
            reloadButton.style.fontWeight = '500';
            reloadButton.style.display = 'flex';
            reloadButton.style.margin = '15px auto 0';
            reloadButton.style.alignItems = 'center';
            reloadButton.style.justifyContent = 'center';
            reloadButton.style.gap = '10px';
            reloadButton.style.width = '100%';
            reloadButton.style.maxWidth = '200px';
            reloadButton.style.height = '40px';
            reloadButton.addEventListener('click', () => {
                window.location.reload();
            });

            // Add message and button to container
            listingContainer.appendChild(emptyMessage);
            listingContainer.appendChild(reloadButton);

            // Hide pagination for empty state
            const paginationContainer = document.querySelector('[data-element="pagination-container"]');
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        // Remove any existing empty state elements when there are listings
        const existingEmptyMessages = listingContainer.querySelectorAll('.no-results-message');
        const existingResetButtons = listingContainer.querySelectorAll('button[data-reset-search]');
        existingEmptyMessages.forEach(msg => msg.remove());
        existingResetButtons.forEach(btn => btn.remove());

        paginatedListings.forEach((listing) => {
            // Check if card for this listing already exists
            let card = listingContainer.querySelector(`[data-listing-id="${listing.id}"]`);

            if (!card) {
                // Card doesn't exist, create a new one from template
                card = listingCardTemplate.cloneNode(true);
                card.style.display = ''; // Make sure the new card is visible

                // Update card content
                const title = card.querySelector('[data-element="listing-card-title"]');
                const subtitle = card.querySelector('[data-element="listing-card-subtitle"]');
                const totalPrice = card.querySelector('[data-element="ListingCardTotalPrice"]');
                const totalPriceSubText = card.querySelector('[data-element="ListingCardTotalPrice_subText"]');
                const image = card.querySelector('[data-element="listing-card-image"]');
                // Add review elements
                const reviewAverage = card.querySelector('[data-element="ListingCardReviewAverage"]');
                const reviewCount = card.querySelector('[data-element="ListingCardReviewCount"]');
                // Add minNights element
                const minNightsElement = card.querySelector('[data-element="listing-card-minNights"]');

                // Set basic info
                if (title) {
                    title.textContent = listing.property_name || 'Property Name';
                    // Add requestAnimationFrame to ensure DOM is updated
                    requestAnimationFrame(() => {
                        handleTextTruncation(title);
                    });
                }
                if (subtitle) subtitle.textContent = listing.listing_city_state || '';
                if (image && listing.image_url) image.src = listing.image_url;

                // Set review info
                if (reviewAverage && reviewCount) {
                    if (!listing.reviews_amount || !listing.review_average) {
                        reviewAverage.textContent = 'New';
                        reviewCount.style.display = 'none';
                    } else {
                        reviewAverage.textContent = listing.review_average;
                        reviewCount.textContent = `(${listing.reviews_amount})`;
                        reviewCount.style.display = '';
                    }
                }

                // Handle minNights display
                if (minNightsElement) {
                    const hasExtras = wantBoat() || wantChar();
                    const datesSelected = hasDates();

                    if (hasExtras && !datesSelected) {
                        // Show minNights when extras are selected but no dates
                        const minNights = listing.min_nights || 1;
                        minNightsElement.textContent = `${minNights} night${minNights > 1 ? 's' : ''}`;
                        minNightsElement.style.display = 'flex';
                    } else {
                        // Hide minNights in all other cases
                        minNightsElement.style.display = 'none';
                    }
                }

                // Phase 2-3: Handle price display with new logic
                if (totalPrice) {
                    const hasExtras = wantBoat() || wantChar();
                    const datesSelected = hasDates();

                    if (!hasExtras && !datesSelected) {
                        // Home-only & NO dates: Starting at nightly
                        if (listing.nightlyPrice && Number.isFinite(Number(listing.nightlyPrice))) {
                            const priceText = fmtMoney(listing.nightlyPrice);
                            const minNights = listing.min_nights || 1;
                            totalPrice.textContent = priceText;
                            if (totalPriceSubText) totalPriceSubText.textContent = "per night (" + minNights + " night" + (minNights > 1 ? 's' : '') + " min)";
                        } else {
                            totalPrice.textContent = "Price unavailable";
                            if (totalPriceSubText) totalPriceSubText.textContent = "";
                        }
                    } else if (!hasExtras && datesSelected) {
                        // Home-only & WITH dates: Total stay price
                        const stayPrice = Number(listing.customDatesTotalPrice || 0);
                        const priceText = fmtMoney(stayPrice);
                        totalPrice.textContent = priceText;
                        if (totalPriceSubText) totalPriceSubText.textContent = "total before taxes";
                    } else if (hasExtras && !datesSelected) {
                        // Extras & NO dates: Combined starting at
                        const homeStart = computeHomeStartNoDates(listing);
                        if (homeStart == null) {
                            totalPrice.textContent = "Price unavailable";
                            if (totalPriceSubText) totalPriceSubText.textContent = "";
                        } else {
                            const extrasStart = minBoat(listing) + minChar(listing);
                            const combinedPrice = homeStart + extrasStart;
                            const priceText = "Starting at " + fmtMoney(combinedPrice);
                            totalPrice.textContent = priceText;
                            // Create dynamic subtext based on selected extras
                            const hasBoat = wantBoat();
                            const hasCharter = wantChar();
                            let subtextParts = ['home'];
                            if (hasBoat) subtextParts.push('boat');
                            if (hasCharter) subtextParts.push('charter');
                            const subtextContent = `(${subtextParts.join(' + ')})`;
                            if (totalPriceSubText) totalPriceSubText.textContent = subtextContent;
                        }
                    } else {
                        // Extras & WITH dates: Combined total
                        const base = Number(listing.customDatesTotalPrice || 0);
                        const extrasPrice = minBoat(listing) + minChar(listing);
                        const combinedPrice = base + extrasPrice;
                        const priceText = "Starting at " + fmtMoney(combinedPrice);
                        totalPrice.textContent = priceText;
                        // Create dynamic subtext based on selected extras
                        const hasBoat = wantBoat();
                        const hasCharter = wantChar();
                        let subtextParts = ['home'];
                        if (hasBoat) subtextParts.push('boat');
                        if (hasCharter) subtextParts.push('charter');
                        const subtextContent = `(${subtextParts.join(' + ')})`;
                        if (totalPriceSubText) totalPriceSubText.textContent = subtextContent;
                    }
                }

                // Set data attribute for map interaction
                card.setAttribute('data-listing-id', listing.id);


                // Add click event to listingCard_bodyBlock for navigation
                const bodyBlock = card.querySelector('[data-element="listingCard_bodyBlock"]');
                if (bodyBlock) {
                    bodyBlock.addEventListener('click', (e) => {
                        // Don't navigate if clicking on carousel arrows or dots
                        if (e.target.closest('.image_arrow_prev') ||
                            e.target.closest('.image_arrow_next') ||
                            e.target.closest('.carousel-dot')) {
                            return;
                        }

                        // Don't navigate if user was dragging
                        if (card._dragState && (card._dragState.isDragging() || card._dragState.hasMoved())) {
                            return;
                        }

                        // Build URL parameters
                        const params = new URLSearchParams();

                        // Add listing ID
                        params.append('id', listing.id);

                        // Add dates (use search dates if available, otherwise default dates)
                        let checkInDate, checkOutDate;
                        if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                            checkInDate = formatDateToYYYYMMDD(apiFormats.dates.checkIn);
                            checkOutDate = formatDateToYYYYMMDD(apiFormats.dates.checkOut);
                        } else {
                            checkInDate = '';
                            checkOutDate = '';
                        }
                        params.append('checkin', checkInDate);
                        params.append('checkout', checkOutDate);

                        // Add guest counts (use search guests if available, otherwise defaults)
                        let guestParams = {
                            guests: 1,
                            adults: 1,
                            children: 0,
                            infants: 0,
                            pets: 0
                        };

                        if (apiFormats.guests && apiFormats.guests.total > 0) {
                            guestParams = {
                                guests: apiFormats.guests.total,
                                adults: apiFormats.guests.adults || 0,
                                children: apiFormats.guests.children || 0,
                                infants: apiFormats.guests.infants || 0,
                                pets: apiFormats.guests.pets || 0
                            };
                        }

                        // Append guest parameters
                        Object.entries(guestParams).forEach(([key, value]) => {
                            params.append(key, value);
                        });

                        // Open in new tab
                        const url = `/listing/page?${params.toString()}`;
                        window.open(url, '_blank');
                    });
                }

                // Add click event to highlight on map (keep existing functionality)
                card.addEventListener('click', () => {
                    highlightMarker(listing.id);
                });

                // Add hover effects for marker interaction
                card.addEventListener('mouseenter', () => {
                    setMarkerBackgroundColor(listing.id, '#9ecaff');
                });

                card.addEventListener('mouseleave', () => {
                    // Only reset if there's no active overlay for this listing
                    if (!window.currentListingOverlay ||
                        window.currentListingOverlay.listing.id !== listing.id) {
                        setMarkerBackgroundColor(listing.id, 'white');
                    }
                });

                // Append to container
                listingContainer.appendChild(card);

                // Initialize custom carousel for this card after it's in the DOM
                requestAnimationFrame(() => {

                    initializeCustomCarouselForCard(card, listing);
                });
            } else {

                // Card exists, update its content
                const totalPrice = card.querySelector('[data-element="ListingCardTotalPrice"]');
                const totalPriceSubText = card.querySelector('[data-element="ListingCardTotalPrice_subText"]');
                // Add review elements
                const reviewAverage = card.querySelector('[data-element="ListingCardReviewAverage"]');
                const reviewCount = card.querySelector('[data-element="ListingCardReviewCount"]');
                // Add minNights element
                const minNightsElement = card.querySelector('[data-element="listing-card-minNights"]');

                // Update review info
                if (reviewAverage && reviewCount) {
                    if (!listing.reviews_amount || !listing.review_average) {
                        reviewAverage.textContent = 'New';
                        reviewCount.style.display = 'none';
                    } else {
                        reviewAverage.textContent = listing.review_average;
                        reviewCount.textContent = `(${listing.reviews_amount})`;
                        reviewCount.style.display = '';
                    }
                }

                // Handle minNights display for existing cards
                if (minNightsElement) {
                    const hasExtras = wantBoat() || wantChar();
                    const datesSelected = hasDates();

                    if (hasExtras && !datesSelected) {
                        // Show minNights when extras are selected but no dates
                        const minNights = listing.min_nights || 1;
                        minNightsElement.textContent = `${minNights} night${minNights > 1 ? 's' : ''}`;
                        minNightsElement.style.display = 'flex';
                    } else {
                        // Hide minNights in all other cases
                        minNightsElement.style.display = 'none';
                    }
                }

                // Phase 2-3: Update price display with new logic
                if (totalPrice) {
                    const hasExtras = wantBoat() || wantChar();
                    const datesSelected = hasDates();

                    if (!hasExtras && !datesSelected) {
                        // Home-only & NO dates: Starting at nightly
                        if (listing.nightlyPrice && Number.isFinite(Number(listing.nightlyPrice))) {
                            totalPrice.textContent = fmtMoney(listing.nightlyPrice);
                            if (totalPriceSubText) totalPriceSubText.textContent = "per night (" + listing.min_nights + " night" + (listing.min_nights > 1 ? 's' : '') + " min)";
                        } else {
                            totalPrice.textContent = "Price unavailable";
                            if (totalPriceSubText) totalPriceSubText.textContent = "";
                        }
                    } else if (!hasExtras && datesSelected) {
                        // Home-only & WITH dates: Total stay price
                        const stayPrice = Number(listing.customDatesTotalPrice || 0);
                        totalPrice.textContent = fmtMoney(stayPrice);
                        if (totalPriceSubText) totalPriceSubText.textContent = "total before taxes";
                    } else if (hasExtras && !datesSelected) {
                        // Extras & NO dates: Combined starting at
                        const homeStart = computeHomeStartNoDates(listing);
                        if (homeStart == null) {
                            totalPrice.textContent = "Price unavailable";
                            if (totalPriceSubText) totalPriceSubText.textContent = "";
                        } else {
                            const extrasStart = minBoat(listing) + minChar(listing);
                            totalPrice.textContent = "Starting at " + fmtMoney(homeStart + extrasStart);
                            // Create dynamic subtext based on selected extras
                            const hasBoat = wantBoat();
                            const hasCharter = wantChar();
                            let subtextParts = ['home'];
                            if (hasBoat) subtextParts.push('boat');
                            if (hasCharter) subtextParts.push('charter');
                            const subtextContent = `(${subtextParts.join(' + ')})`;
                            if (totalPriceSubText) totalPriceSubText.textContent = subtextContent;
                        }
                    } else {
                        // Extras & WITH dates: Combined total
                        const base = Number(listing.customDatesTotalPrice || 0);
                        const extrasPrice = minBoat(listing) + minChar(listing);
                        const combinedPrice = base + extrasPrice;
                        totalPrice.textContent = "Starting at " + fmtMoney(combinedPrice);
                        // Create dynamic subtext based on selected extras
                        const hasBoat = wantBoat();
                        const hasCharter = wantChar();
                        let subtextParts = ['home'];
                        if (hasBoat) subtextParts.push('boat');
                        if (hasCharter) subtextParts.push('charter');
                        const subtextContent = `(${subtextParts.join(' + ')})`;
                        if (totalPriceSubText) totalPriceSubText.textContent = subtextContent;

                    }
                }

                // Make the card visible
                card.style.display = '';

                // For existing cards, update title if needed
                const title = card.querySelector('[data-element="listing-card-title"]');
                if (title) {
                    title.textContent = listing.property_name || 'Property Name';
                    requestAnimationFrame(() => {
                        handleTextTruncation(title);
                    });
                }

                // Check if custom carousel needs to be initialized
                requestAnimationFrame(() => {
                    initializeCustomCarouselForCard(card, listing);
                });

                // Add/update click event handler for existing cards
                const bodyBlock = card.querySelector('[data-element="listingCard_bodyBlock"]');
                if (bodyBlock && !bodyBlock.hasAttribute('data-click-handler')) {
                    bodyBlock.setAttribute('data-click-handler', 'true'); // Mark as having handler

                    bodyBlock.addEventListener('click', (e) => {
                        // Don't navigate if clicking on carousel arrows or dots
                        if (e.target.closest('.image_arrow_prev') ||
                            e.target.closest('.image_arrow_next') ||
                            e.target.closest('.carousel-dot')) {
                            return;
                        }

                        // Don't navigate if user was dragging
                        if (card._dragState && (card._dragState.isDragging() || card._dragState.hasMoved())) {
                            return;
                        }

                        // Build URL parameters
                        const params = new URLSearchParams();

                        // Add listing ID
                        params.append('id', listing.id);

                        // Add dates (use search dates if available, otherwise default dates)
                        let checkInDate, checkOutDate;
                        if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                            checkInDate = formatDateToYYYYMMDD(apiFormats.dates.checkIn);
                            checkOutDate = formatDateToYYYYMMDD(apiFormats.dates.checkOut);
                        } else {
                            checkInDate = formatDateToYYYYMMDD(listing.default_startDate);
                            checkOutDate = formatDateToYYYYMMDD(listing.default_endDate);
                        }
                        params.append('checkin', checkInDate);
                        params.append('checkout', checkOutDate);

                        // Add guest parameters if they exist
                        if (apiFormats.guests && apiFormats.guests.total > 0) {
                            const guestParams = {
                                guests: apiFormats.guests.total,
                                adults: apiFormats.guests.adults || 0,
                                children: apiFormats.guests.children || 0,
                                infants: apiFormats.guests.infants || 0,
                                pets: apiFormats.guests.pets || 0
                            };
                            Object.entries(guestParams).forEach(([key, value]) => {
                                params.append(key, value);
                            });
                        }

                        // Open in new tab
                        const url = `/listing/page?${params.toString()}`;
                        window.open(url, '_blank');
                    });
                }
            }
        });

        // MODIFY THIS SECTION: Always render pagination, not just when !filteredOnly
        // Remove the if (!filteredOnly) condition
        renderPagination(currentListings.length);

        // Update markers visibility after rendering cards
        requestAnimationFrame(() => {
            updateMarkersVisibility(currentPage);
        });
    }



    // Function to filter listings based on map bounds
    function filterListingsByBounds(listings, bounds) {
        if (!listings) return [];

        const filteredListings = listings.filter(listing => {
            // Skip listings without coordinates
            if (!listing.latitude || !listing.longitude) return false;

            // Check if listing is within bounds
            const latLng = new google.maps.LatLng(listing.latitude, listing.longitude);
            return bounds.contains(latLng);
        });

        // Update marker visibility is already handled in renderListingCards
        // via updateMarkersVisibility, so we don't need the complex logic here

        return filteredListings;
    }


    // Function to fit map to contain all markers
    function fitMapToBounds(map, listings) {
        if (!listings || listings.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        let hasValidCoordinates = false;
        let shouldCenterOnLocation = false;
        let locationCenter = null;

        // First use the search location bounds if available
        if (apiFormats.location && apiFormats.location.bounds) {
            const locationBounds = apiFormats.location.bounds;
            if (locationBounds.northeast && locationBounds.southwest) {
                bounds.extend(new google.maps.LatLng(
                    locationBounds.northeast.lat,
                    locationBounds.northeast.lng
                ));
                bounds.extend(new google.maps.LatLng(
                    locationBounds.southwest.lat,
                    locationBounds.southwest.lng
                ));
                hasValidCoordinates = true;

                // Store location center for better positioning
                if (locationBounds.center) {
                    locationCenter = new google.maps.LatLng(
                        locationBounds.center.lat,
                        locationBounds.center.lng
                    );
                    shouldCenterOnLocation = true;
                }
            }
        }

        // MODIFY THIS: Only include listings on current page for bounds calculation
        const startIndex = (currentPage - 1) * listingsPerPage;
        const endIndex = startIndex + listingsPerPage;
        const paginatedListings = listings.slice(startIndex, endIndex);

        paginatedListings.forEach(listing => {
            if (listing.latitude && listing.longitude) {
                // Parse strings to numbers
                const lat = parseFloat(listing.latitude);
                const lng = parseFloat(listing.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    bounds.extend({ lat, lng });
                    hasValidCoordinates = true;
                }
            }
        });

        if (hasValidCoordinates) {
            // Fit to bounds first
            map.fitBounds(bounds, { padding: 50 });

            // Then handle zoom limit and centering
            google.maps.event.addListenerOnce(map, 'bounds_changed', function () {
                // Limit maximum zoom
                if (map.getZoom() > 15) {
                    map.setZoom(15);
                }

                // If we have location center coordinates, center the map there
                // This ensures the searched location is in the center, not offset
                if (shouldCenterOnLocation && locationCenter) {
                    map.setCenter(locationCenter);
                }
            });
        }
    }

    // Update the highlightMarker function
    function highlightMarker(listingId) {
        const marker = window.mapMarkers[listingId];
        if (!marker) return;

        // For custom markers, we'll add a pulsing effect
        let markerElement;

        if (marker.content) {
            // AdvancedMarkerElement
            markerElement = marker.content;
        } else if (marker.div) {
            // Custom overlay
            markerElement = marker.div.firstElementChild;
        }

        if (markerElement) {

            // Trigger click event
            markerElement.click();
        }
    }

    // Add CSS for highlighted card
    const mapStyle = document.createElement('style');
    mapStyle.textContent = `
        [data-listing-id].highlighted {
            box-shadow: 0 0 15px rgba(0, 123, 255, 0.7);
            transform: scale(1.02);
            transition: all 0.3s ease;
        }
        
        .map-info-window {
            padding: 5px;
            max-width: 200px;
        }
        
        .map-info-window h3 {
            margin: 0 0 5px 0;
            font-size: 14px;
        }
        
        .map-info-window p {
            margin: 5px 0;
            font-size: 12px;
        }
    `;
    document.head.appendChild(mapStyle);

    // Add CSS for map listing card styling
    const mapListingCardStyle = document.createElement('style');
    mapListingCardStyle.textContent = `
    .map-listing-card:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
    }
    
    .map-listing-card .close-btn:hover {
        background-color: #f5f5f5 !important;
    }
    

`;
    document.head.appendChild(mapListingCardStyle);


    // Function to handle text truncation with ellipsis
    function handleTextTruncation(element) {
        if (!element) return;

        // Store the original text
        const originalText = element.textContent;

        // Create a range to measure text
        const range = document.createRange();
        range.selectNodeContents(element);

        // Get the client rect of the text
        const clientRects = range.getClientRects();

        // If there's more than one line or the content is wider than the container
        if (clientRects.length > 1 || element.scrollWidth > element.clientWidth) {
            // Start with the full text
            let text = originalText;
            let low = 0;
            let high = text.length;
            let best = '';

            // Binary search for the best length that fits
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const truncated = text.slice(0, mid) + '...';
                element.textContent = truncated;

                range.selectNodeContents(element);
                const newClientRects = range.getClientRects();

                if (newClientRects.length === 1 && element.scrollWidth <= element.clientWidth) {
                    best = truncated;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            // Set the best truncated version that fits
            element.textContent = best;

            // Add title attribute for hover tooltip with full text
            element.title = originalText;
        }
    }

    // Function to update marker visibility based on current page with delay and opacity transition
    function updateMarkersVisibility(page = currentPage) {
        if (!window.mapMarkers || !currentListings) return;

        // Calculate which listings should be visible on current page
        const startIndex = (page - 1) * listingsPerPage;
        const endIndex = startIndex + listingsPerPage;
        const visibleListingIds = currentListings.slice(startIndex, endIndex).map(listing => listing.id);

        // Use requestAnimationFrame to avoid blocking map interactions
        requestAnimationFrame(() => {
            // Only update markers that need to change visibility
            Object.entries(window.mapMarkers).forEach(([listingId, marker]) => {
                const shouldBeVisible = visibleListingIds.includes(parseInt(listingId));
                const isCurrentlyVisible = marker.setMap ?
                    (marker.getMap() !== null) :
                    (marker.div && marker.div.style.display !== 'none');

                // Only update if visibility needs to change
                if (shouldBeVisible !== isCurrentlyVisible) {
                    if (shouldBeVisible) {
                        // Show marker with delay and opacity transition
                        setTimeout(() => {
                            if (marker.setMap) {
                                // Add opacity transition for AdvancedMarkerElement
                                if (marker.content) {
                                    marker.content.style.transition = 'opacity 0.3s ease';
                                    marker.content.style.opacity = '0';
                                }
                                marker.setMap(window.currentMap);

                                // Fade in after being added to map
                                if (marker.content) {
                                    requestAnimationFrame(() => {
                                        marker.content.style.opacity = '1';
                                    });
                                }
                            } else if (marker.div) {
                                // Add opacity transition for custom overlay
                                const markerElement = marker.div.firstElementChild;
                                if (markerElement) {
                                    markerElement.style.transition = 'opacity 0.3s ease';
                                    markerElement.style.opacity = '0';
                                }
                                marker.div.style.display = 'block';

                                // Fade in
                                if (markerElement) {
                                    requestAnimationFrame(() => {
                                        markerElement.style.opacity = '1';
                                    });
                                }
                            }
                        }, 300);
                    } else {
                        // Hide marker immediately
                        if (marker.setMap) {
                            marker.setMap(null);
                        } else if (marker.div) {
                            marker.div.style.display = 'none';
                        }
                    }
                }
            });
        });
    }

    // Call fetchPropertySearchResults on page load to display initial properties
    fetchPropertySearchResults()
        .then(results => {
            // Update extras visibility on initial load
            updateExtrasVisibility();

            // Initialize pricing mode tracking
            previousPricingMode = getCurrentPricingMode();
        })
        .catch(error => {
        });

    // Function to change marker background color
    function setMarkerBackgroundColor(listingId, color) {
        const marker = window.mapMarkers[listingId];
        if (!marker) return;

        let markerElement;
        if (marker.content) {
            // AdvancedMarkerElement
            markerElement = marker.content;
        } else if (marker.div) {
            // Custom overlay
            markerElement = marker.div?.firstElementChild;
        }

        if (markerElement) {
            markerElement.style.backgroundColor = color;
        }
    }




    // Function to create a custom listing card overlay for map
    function createListingCardOverlay(listing, position, map) {
        class ListingCardOverlay extends google.maps.OverlayView {
            constructor(listing, position) {
                super();
                this.listing = listing;
                this.position = position;
                this.div = null;
                this.setMap(map);
            }

            onAdd() {
                this.div = document.createElement('div');
                this.div.style.position = 'absolute';
                this.div.style.transform = 'translate(-50%, -100%)';
                this.div.style.marginBottom = '0px';
                this.div.style.zIndex = '1000';

                // Create the card content (similar to listing card)
                const cardHTML = `
                    <div class="map-listing-card" style="
                        background: white;
                        border-radius: 5px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        width: 300px;
                        cursor: pointer;
                        overflow: hidden;  /* This stays to ensure everything stays within the border radius */
                        font-family: 'TT Fors', sans-serif;
                    ">
                        <div class="close-btn" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            width: 30px;
                            height: 30px;
                            background: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            z-index: 10;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        ">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1L13 13M13 1L1 13" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        
                        <div class="map-custom-carousel" style="position: relative; width: 100%; height: 200px; border-radius: 5px 5px 0 0; overflow: hidden;">
                            <div class="map-carousel-track" style="display: flex; width: 100%; height: 100%; transition: transform 0.3s ease;">
                                ${this.listing._images && this.listing._images.length > 0 ?
                        this.listing._images.map((img, index) =>
                            `<div class="map-carousel-slide" style="flex: 0 0 100%; height: 100%;">
                                <img src="${img.property_image?.url || ''}" 
                                     alt="${this.listing.property_name}" 
                                     loading="${index < 3 ? 'eager' : 'lazy'}"
                                     style="width: 100%; height: 200px; object-fit: cover;">
                            </div>`
                        ).join('') :
                        `<div class="map-carousel-slide" style="flex: 0 0 100%; height: 100%;">
                            <img src="${this.listing.image_url || ''}" 
                                 alt="${this.listing.property_name}" 
                                 style="width: 100%; height: 200px; object-fit: cover;">
                        </div>`
                    }
                            </div>
                            
                            ${this.listing._images && this.listing._images.length > 1 ? `
                                <button class="map-image_arrow_prev" style="
                                    position: absolute;
                                    left: 10px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    background: rgba(255, 255, 255, 0.8);
                                    border: none;
                                    border-radius: 50%;
                                    width: 34px;
                                    height: 34px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    z-index: 1001;
                                    box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.4);
                                    opacity: 0.8;
                                    transition: opacity 0.2s ease;
                                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 18L9 12L15 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                
                                <button class="map-image_arrow_next" style="
                                    position: absolute;
                                    right: 10px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    background: rgba(255, 255, 255, 0.8);
                                    border: none;
                                    border-radius: 50%;
                                    width: 34px;
                                    height: 34px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    z-index: 1001;
                                    box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.4);
                                    opacity: 0.8;
                                    transition: opacity 0.2s ease;
                                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 18L15 12L9 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                
                                <div class="map-carousel-pagination" style="
                                    position: absolute;
                                    bottom: 10px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    display: flex;
                                    gap: 6px;
                                    z-index: 1001;
                                ">
                                    ${this.listing._images.slice(0, Math.min(5, this.listing._images.length)).map((_, index) => `
                                        <div class="map-carousel-dot" data-index="${index}" style="
                                            width: 8px;
                                            height: 8px;
                                            border-radius: 50%;
                                            background: rgba(255, 255, 255, 0.5);
                                            cursor: pointer;
                                            transition: background 0.2s ease;
                                            ${index === 0 ? 'background: white;' : ''}
                                        "></div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        ${this.getExtrasSection()}
                        
                        <div style="padding: 8px 8px 12px 8px; display: flex; align-items: top; align-items: stretch; flex-direction: column; gap: 2px; margin-top: 0px; font-family: 'TT Fors', sans-serif;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0; line-height: 1;">
                                <h3 style="margin: 0; padding: 0; font-size: 14px; color: #000000; font-weight: 500; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; font-family: 'TT Fors', sans-serif; line-height: 1;">
                                    ${this.listing.property_name || 'Property'}
                                </h3>
                                <div style="display: flex; align-items: center; gap: 3px; font-family: 'TT Fors', sans-serif; line-height: 1; margin: 0; padding: 0;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" style="margin: 0; padding: 0; display: block;">
                                        <path d="M12 2l2.59 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.41-1.01L12 2z" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
                                    </svg>
                                    <span style="font-size: 14px; font-weight: 500; font-family: 'TT Fors', sans-serif; line-height: 1;">
                                        ${(!this.listing.reviews_amount || !this.listing.review_average) ? 'New' : this.listing.review_average}
                                    </span>
                                    ${(this.listing.reviews_amount && this.listing.review_average) ?
                        `<span style="font-size: 14px; color: #000000; font-family: 'TT Fors', sans-serif; line-height: 1;">(${this.listing.reviews_amount})</span>` :
                        ''
                    }
                                </div>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; color: #000000; font-family: 'TT Fors', sans-serif;">
                                ${this.listing.listing_city_state || ''}
                            </p>
                            
                            ${this.getDateRange() ? `
                            <div style="margin: 0;">
                                <span style="font-size: 14px; color: #000000; font-family: 'TT Fors', sans-serif;">
                                    ${this.getDateRange()}
                                </span>
                            </div>
                            ` : ''}
                            
                            <div style="display: flex; flex-direction: horizontal; align-items: bottom; gap: 4px; margin: 0;">
                                <span style="font-size: 14px; font-weight: 500; color: #000000; font-family: 'TT Fors', sans-serif;">
                                    ${this.getPrice()}
                                </span>
                                <span style="font-size: 14px; color: #000000; font-family: 'TT Fors', sans-serif;">
                                    ${this.getPriceSubText()}
                                </span>
                            </div>
                        </div>
                    </div>
                `;

                this.div.innerHTML = cardHTML;

                // Add click handler to close button
                const closeBtn = this.div.querySelector('.close-btn');

                // Handle both click and touch events for mobile compatibility
                const handleClose = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.setMap(null);
                    // Reset marker color
                    setMarkerBackgroundColor(this.listing.id, 'white');
                    // Clear the global reference
                    if (window.currentListingOverlay === this) {
                        window.currentListingOverlay = null;
                    }
                };

                closeBtn.addEventListener('click', handleClose);
                closeBtn.addEventListener('touchend', handleClose, { passive: false });

                // Add click handler to card for navigation
                const card = this.div.querySelector('.map-listing-card');

                // Carousel navigation buttons will be handled by the carousel initialization

                // Add mobile touch event handlers to prevent accidental closure
                card.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                }, { passive: true });

                card.addEventListener('touchend', (e) => {
                    e.stopPropagation();
                }, { passive: false });

                // Add click handler for the entire card
                card.addEventListener('click', (e) => {
                    // Don't navigate if clicking on carousel navigation buttons
                    if (e.target.closest('.map-image_arrow_prev') || e.target.closest('.map-image_arrow_next') || e.target.closest('.map-carousel-dot') || e.target.closest('.close-btn')) {
                        return;
                    }

                    // Stop propagation to prevent global click handlers from interfering
                    e.stopPropagation();

                    // Build URL parameters
                    const params = new URLSearchParams();
                    params.append('id', this.listing.id);

                    let checkInDate, checkOutDate;
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        checkInDate = formatDateToYYYYMMDD(apiFormats.dates.checkIn);
                        checkOutDate = formatDateToYYYYMMDD(apiFormats.dates.checkOut);
                    } else {
                        checkInDate = formatDateToYYYYMMDD(this.listing.default_startDate);
                        checkOutDate = formatDateToYYYYMMDD(this.listing.default_endDate);
                    }
                    params.append('checkin', checkInDate);
                    params.append('checkout', checkOutDate);

                    // Add guest parameters if they exist
                    if (apiFormats.guests && apiFormats.guests.total > 0) {
                        const guestParams = {
                            guests: apiFormats.guests.total,
                            adults: apiFormats.guests.adults || 0,
                            children: apiFormats.guests.children || 0,
                            infants: apiFormats.guests.infants || 0,
                            pets: apiFormats.guests.pets || 0
                        };
                        Object.entries(guestParams).forEach(([key, value]) => {
                            params.append(key, value);
                        });
                    }

                    // Open in new tab
                    const url = `/listing/page?${params.toString()}`;
                    window.open(url, '_blank');
                });

                const panes = this.getPanes();
                panes.floatPane.appendChild(this.div);

                // Initialize custom carousel after adding to DOM
                requestAnimationFrame(() => {
                    const carouselElement = this.div.querySelector('.map-custom-carousel');
                    if (carouselElement && this.listing._images && this.listing._images.length > 1) {
                        // Initialize carousel functionality
                        let currentIndex = 0;
                        const totalImages = this.listing._images.length;
                        const track = carouselElement.querySelector('.map-carousel-track');
                        const prevButton = carouselElement.querySelector('.map-image_arrow_prev');
                        const nextButton = carouselElement.querySelector('.map-image_arrow_next');
                        const dots = carouselElement.querySelectorAll('.map-carousel-dot');

                        function updateCarousel(skipTransition = false) {
                            if (track) {
                                if (skipTransition) {
                                    track.style.transition = 'none';
                                    track.style.transform = `translateX(-${currentIndex * 100}%)`;
                                    // Re-enable transition after a brief delay
                                    requestAnimationFrame(() => {
                                        track.style.transition = 'transform 0.3s ease';
                                    });
                                } else {
                                    track.style.transform = `translateX(-${currentIndex * 100}%)`;
                                }
                            }

                            // Update dots (max 5 dots, cycling through)
                            dots.forEach((dot, index) => {
                                const isActive = index === (currentIndex % Math.min(5, totalImages));
                                dot.style.background = isActive ? 'white' : 'rgba(255, 255, 255, 0.5)';
                            });
                        }

                        function goToNext() {
                            const wasLastImage = currentIndex === totalImages - 1;
                            currentIndex = (currentIndex + 1) % totalImages;
                            updateCarousel(wasLastImage); // Skip transition when wrapping from last to first
                        }

                        function goToPrev() {
                            const wasFirstImage = currentIndex === 0;
                            if (currentIndex === 0) {
                                currentIndex = totalImages - 1;
                            } else {
                                currentIndex = currentIndex - 1;
                            }
                            updateCarousel(wasFirstImage); // Skip transition when wrapping from first to last
                        }

                        // Add event listeners with high z-index to prevent click-through
                        if (prevButton) {
                            prevButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                goToPrev();
                            });
                        }

                        if (nextButton) {
                            nextButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                goToNext();
                            });
                        }

                        // Dot navigation
                        dots.forEach((dot, index) => {
                            dot.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                currentIndex = index;
                                updateCarousel();
                            });
                        });
                    }
                }, 10);
            }

            draw() {
                if (!this.div) return;

                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.position);

                if (position) {
                    this.div.style.left = position.x + 'px';
                    this.div.style.top = position.y + 'px';
                }
            }

            onRemove() {
                if (this.div) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            }

            getDateRange() {
                if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                    return formatDateRange(apiFormats.dates.checkIn, apiFormats.dates.checkOut);
                } else {
                    // Check if we should show minimum nights (extras selected but no dates)
                    const hasExtras = wantBoat() || wantChar();
                    if (hasExtras) {
                        const minNights = this.listing.min_nights || 1;
                        return `${minNights} night${minNights > 1 ? 's' : ''}`;
                    }
                    return null; // Hide date section when no dates and no extras
                }
            }

            getPrice() {
                // Use the same price logic as listing cards
                const hasExtras = wantBoat() || wantChar();
                const datesSelected = hasDates();

                if (!hasExtras && !datesSelected) {
                    // Home-only & NO dates: Starting at nightly
                    if (this.listing.nightlyPrice && Number.isFinite(Number(this.listing.nightlyPrice))) {
                        return fmtMoney(this.listing.nightlyPrice);
                    } else {
                        return "Price unavailable";
                    }
                } else if (!hasExtras && datesSelected) {
                    // Home-only & WITH dates: Total stay price
                    const stayPrice = Number(this.listing.customDatesTotalPrice || 0);
                    return fmtMoney(stayPrice);
                } else if (hasExtras && !datesSelected) {
                    // Extras & NO dates: Combined starting at
                    const homeStart = computeHomeStartNoDates(this.listing);
                    if (homeStart == null) {
                        return "Price unavailable";
                    } else {
                        const extrasStart = minBoat(this.listing) + minChar(this.listing);
                        const combinedPrice = homeStart + extrasStart;
                        return "Starting at " + fmtMoney(combinedPrice);
                    }
                } else {
                    // Extras & WITH dates: Combined total
                    const base = Number(this.listing.customDatesTotalPrice || 0);
                    const extrasPrice = minBoat(this.listing) + minChar(this.listing);
                    const combinedPrice = base + extrasPrice;
                    return "Starting at " + fmtMoney(combinedPrice);
                }
            }

            getPriceSubText() {
                // Use the same price subtext logic as listing cards
                const hasExtras = wantBoat() || wantChar();
                const datesSelected = hasDates();

                if (!hasExtras && !datesSelected) {
                    // Home-only & NO dates: per night
                    if (this.listing.nightlyPrice && Number.isFinite(Number(this.listing.nightlyPrice))) {
                        return "per night (" + this.listing.min_nights + " night" + (this.listing.min_nights > 1 ? 's' : '') + " min)";
                    } else {
                        return "";
                    }
                } else if (!hasExtras && datesSelected) {
                    // Home-only & WITH dates: total before taxes
                    return "total before taxes";
                } else if (hasExtras && !datesSelected) {
                    // Extras & NO dates: dynamic subtext
                    const homeStart = computeHomeStartNoDates(this.listing);
                    if (homeStart == null) {
                        return "";
                    } else {
                        // Create dynamic subtext based on selected extras
                        const hasBoat = wantBoat();
                        const hasCharter = wantChar();
                        let subtextParts = ['home'];
                        if (hasBoat) subtextParts.push('boat');
                        if (hasCharter) subtextParts.push('charter');
                        return `(${subtextParts.join(' + ')})`;
                    }
                } else {
                    // Extras & WITH dates: dynamic subtext
                    const hasBoat = wantBoat();
                    const hasCharter = wantChar();
                    let subtextParts = ['home'];
                    if (hasBoat) subtextParts.push('boat');
                    if (hasCharter) subtextParts.push('charter');
                    return `(${subtextParts.join(' + ')})`;
                }
            }

            getExtrasSection() {
                const hasBoatRental = wantBoat();
                const hasFishingCharter = wantChar();

                if (!hasBoatRental && !hasFishingCharter) {
                    return '';
                }

                let extrasHtml = '';

                if (hasBoatRental) {
                    extrasHtml += `
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            background: #f0f0f0;
                            border-radius: 20px;
                            padding: 6px 12px;
                            margin: 4px 4px 0 0;
                            font-family: 'TT Fors', sans-serif;
                            font-size: 12px;
                            font-weight: 500;
                            color: #333;
                        ">+ Boat Rental</div>
                    `;
                }

                if (hasFishingCharter) {
                    extrasHtml += `
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            background: #f0f0f0;
                            border-radius: 20px;
                            padding: 6px 12px;
                            margin: 4px 4px 0 0;
                            font-family: 'TT Fors', sans-serif;
                            font-size: 12px;
                            font-weight: 500;
                            color: #333;
                        ">+ Fishing Charter</div>
                    `;
                }

                return `
                    <div style="
                        padding: 2px 2px 0 8px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0;
                    ">
                        ${extrasHtml}
                    </div>
                `;
            }
        }

        return new ListingCardOverlay(listing, position);
    }

    // Function to initialize the map only once
    function initializeMap() {
        if (isMapInitialized) return;

        const mapContainer = document.querySelector('[data-element="search_map"]');
        if (!mapContainer) {
            return;
        }

        // Define Florida Keys bounds
        const floridaKeysBounds = {
            north: 26.2,
            south: 23.4,
            west: -83.2,
            east: -79.0
        };

        // Create map with default center and zoom
        const map = new google.maps.Map(mapContainer, {
            center: { lat: 24.7, lng: -81.1 },
            zoom: 11,
            minZoom: 9,
            maxZoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            disableDoubleClickZoom: true,  // Disable double click zoom
            gestureHandling: 'greedy',  // Allow single-finger panning on mobile
            restriction: {
                latLngBounds: floridaKeysBounds,
                strictBounds: false
            },
            styles: [
                {
                    featureType: "water",
                    elementType: "geometry.fill",
                    stylers: [{ color: "#d0e7ff" }]
                },
                {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [{ color: "#e6f3e6" }]
                },
                {
                    featureType: "landscape.natural",
                    elementType: "geometry",
                    stylers: [{ color: "#e6f3e6" }]
                },
                {
                    featureType: "poi.park",
                    elementType: "geometry",
                    stylers: [
                        { visibility: "on" },
                        { color: "#e6f3e6" }
                    ]
                },
                {
                    featureType: "landscape.man_made",
                    elementType: "geometry",
                    stylers: [{ color: "#f9f9f9" }]
                },
                {
                    featureType: "poi",
                    elementType: "all",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "transit",
                    elementType: "all",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#ffffff" }]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry",
                    stylers: [{ color: "#e0e0e0" }]
                },
                {
                    featureType: "road",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "administrative",
                    elementType: "geometry",
                    stylers: [{ visibility: "simplified" }]
                },
                {
                    featureType: "administrative.locality",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#808080" }]
                },
                {
                    featureType: "all",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "administrative.locality",
                    elementType: "labels",
                    stylers: [{ visibility: "on" }]
                }
            ]
        });

        // Store map reference globally
        window.currentMap = map;
        window.mapMarkers = {};

        // Initialize map bounds tracking variables
        let searchBounds = null;
        let isInitialLoad = true;
        let searchTimeout = null;
        let userHasInteracted = false;

        // Function to update current map bounds in apiFormats
        function updateCurrentMapBounds() {
            const bounds = map.getBounds();
            if (!bounds) return;

            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            apiFormats.location = {
                name: "Map area",
                bounds: {
                    northeast: { lat: ne.lat(), lng: ne.lng() },
                    southwest: { lat: sw.lat(), lng: sw.lng() },
                    center: {
                        lat: (ne.lat() + sw.lat()) / 2,
                        lng: (ne.lng() + sw.lng()) / 2
                    }
                }
            };
        }

        // Function to check if current view is within the search bounds
        function isWithinSearchBounds(currentBounds, searchBounds) {
            if (!searchBounds) return false;

            const currentNE = currentBounds.getNorthEast();
            const currentSW = currentBounds.getSouthWest();
            const searchNE = searchBounds.getNorthEast();
            const searchSW = searchBounds.getSouthWest();

            return currentNE.lat() <= searchNE.lat() &&
                currentSW.lat() >= searchSW.lat() &&
                currentNE.lng() <= searchNE.lng() &&
                currentSW.lng() >= searchSW.lng();
        }

        // Function to check if user has moved outside search bounds
        function hasMovedOutsideSearchBounds(currentBounds, searchBounds) {
            if (!searchBounds) return true;

            const currentNE = currentBounds.getNorthEast();
            const currentSW = currentBounds.getSouthWest();
            const searchNE = searchBounds.getNorthEast();
            const searchSW = searchBounds.getSouthWest();

            return currentNE.lat() > searchNE.lat() ||
                currentSW.lat() < searchSW.lat() ||
                currentNE.lng() > searchNE.lng() ||
                currentSW.lng() < searchSW.lng();
        }

        // Add listeners to detect user interaction
        map.addListener('dragstart', () => {
            userHasInteracted = true;
        });

        map.addListener('zoom_changed', () => {
            if (!isInitialLoad) {
                userHasInteracted = true;
            }
        });

        // Add map click handler to close overlay when clicking on empty map area
        map.addListener('click', (e) => {
            // Only close overlay if clicking on empty map area (not on markers)
            if (window.currentListingOverlay && !e.domEvent.target.closest('.map-listing-card')) {
                window.currentListingOverlay.setMap(null);
                const listingId = window.currentListingOverlay.listing.id;
                setMarkerBackgroundColor(listingId, 'white');
                window.currentListingOverlay = null;
            }
        });

        isMapInitialized = true;


        // MODIFY the initializeMap function's idle listener:
        // Single idle listener with clear logic (FIXED VERSION)
        map.addListener('idle', () => {
            const currentBounds = map.getBounds();
            if (!currentBounds) return;

            // On initial load, set the search bounds and exit - don't trigger any updates
            if (isInitialLoad) {
                searchBounds = currentBounds;
                isInitialLoad = false;
                return;
            }

            // If we're centering on a marker, don't trigger API requests - just reset the flag and return
            if (isCenteringOnMarker) {
                isCenteringOnMarker = false;
                return;
            }

            // Only proceed if user has actually interacted with the map
            if (!userHasInteracted) {
                return;
            }

            // Use requestAnimationFrame to avoid blocking map interactions
            requestAnimationFrame(() => {
                // Store the original listings before filtering
                if (!window.originalListings) {
                    window.originalListings = unfilteredListings;
                }

                // Filter listings based on current bounds
                const visibleListings = filterListingsByBounds(window.originalListings, currentBounds);
                const filteredVisibleListings = filterSystem ? filterSystem.applyFilters(visibleListings) : visibleListings;

                // Defer marker updates to avoid blocking
                setTimeout(() => {
                    // Only update markers that need visibility changes
                    Object.entries(window.mapMarkers).forEach(([listingId, marker]) => {
                        const shouldBeVisible = filteredVisibleListings.some(listing => listing.id === parseInt(listingId));
                        const isCurrentlyVisible = marker.setMap ?
                            (marker.getMap() !== null) :
                            (marker.div && marker.div.style.display !== 'none');

                        // Only update if visibility needs to change
                        if (shouldBeVisible !== isCurrentlyVisible) {
                            if (marker.setMap) {
                                marker.setMap(shouldBeVisible ? window.currentMap : null);
                            } else if (marker.div) {
                                marker.div.style.display = shouldBeVisible ? 'block' : 'none';
                            }
                        }
                    });
                }, 0);

                // Only update listings if we've moved significantly outside search bounds
                if (hasMovedOutsideSearchBounds(currentBounds, searchBounds)) {
                    const locationButtonTextElement = document.querySelector('[data-element="navBarSearch_locationButton_text"]');
                    if (locationButtonTextElement) {
                        updateButtonText(locationButtonTextElement, "Map area", defaultValues.location);
                        currentSelections.location = "Map area";
                        pendingSelections.location = "Map area";
                    }

                    updateCurrentMapBounds();

                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }

                    // SET flag to indicate user is exploring
                    isUserExploring = true;

                    searchTimeout = setTimeout(() => {
                        fetchPropertySearchResults();
                    }, 500);

                    searchBounds = currentBounds;
                } else {
                    // Show skeleton loading for bounds filtering if the amount of listings changes significantly
                    const currentListingCount = currentListings ? currentListings.length : 0;
                    const newListingCount = filteredVisibleListings ? filteredVisibleListings.length : 0;

                    // Only show skeleton if there's a significant change in listing count (more than 25% difference)
                    if (Math.abs(currentListingCount - newListingCount) > Math.max(currentListingCount * 0.25, 2)) {
                        showSkeletonLoading();

                        // Add a small delay to make the loading feel responsive
                        setTimeout(() => {
                            renderListingCards(filteredVisibleListings, true);
                            updateBoatBadgeForAllVisibleCards(filteredVisibleListings);
                            hideSkeletonLoading();
                        }, 300);
                    } else {
                        // Just update the visible listings without skeleton for small changes
                        setTimeout(() => {
                            renderListingCards(filteredVisibleListings, true);
                            updateBoatBadgeForAllVisibleCards(filteredVisibleListings);
                        }, 0);
                    }
                }
            });
        });

        // ALSO ADD dragstart listener to detect when user starts dragging:
        // Add listeners to detect user interaction
        map.addListener('dragstart', () => {
            userHasInteracted = true;
            isUserExploring = true; // User is actively exploring
        });

        map.addListener('dragend', () => {
            // Reset exploration flag after a short delay
            setTimeout(() => {
                isUserExploring = false;
            }, 1000);
        });

        map.addListener('zoom_changed', () => {
            if (!isInitialLoad) {
                userHasInteracted = true;
            }
        });

    }

    // Function to update map with new search results
    function updateMapWithResults(listings) {
        if (!window.currentMap) {
            return;
        }

        // Clear existing markers
        clearMapMarkers();

        // Store all listings globally for filtering
        window.allListings = listings;

        // Add new markers
        addMarkersToMap(listings);

        // ONLY fit map bounds if user is not actively exploring
        if (!isUserExploring) {
            // Update map bounds to fit new results
            fitMapToBounds(window.currentMap, listings);
        } else {
            // Reset the exploration flag after a delay to allow normal behavior later
            setTimeout(() => {
                isUserExploring = false;
            }, 2000);
        }

        // Update markers visibility for current page
        updateMarkersVisibility(currentPage);
    }

    // Function to clear all existing markers
    function clearMapMarkers() {
        if (!window.mapMarkers) return;

        Object.values(window.mapMarkers).forEach(marker => {
            if (marker.setMap) {
                marker.setMap(null);
            } else if (marker.onRemove) {
                marker.onRemove();
            }
        });

        window.mapMarkers = {};

        // Close any open listing overlay
        if (window.currentListingOverlay) {
            window.currentListingOverlay.setMap(null);
            window.currentListingOverlay = null;
        }
    }

    // Function to add markers to the map
    function addMarkersToMap(listings) {
        listings.forEach(listing => {
            if (listing.latitude && listing.longitude) {
                const lat = parseFloat(listing.latitude);
                const lng = parseFloat(listing.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    // Phase 3: Determine which price to show (mirror card logic)
                    let priceText;
                    const hasExtras = wantBoat() || wantChar();
                    const datesSelected = hasDates();

                    if (!hasExtras) {
                        // Home-only: keep current logic exactly
                        if (datesSelected) {
                            const totalPrice = listing.customDatesTotalPrice || 0;
                            priceText = `$${Math.round(totalPrice).toLocaleString()}`;
                        } else {
                            const nightlyPrice = listing.nightlyPrice || 0;
                            priceText = `$${nightlyPrice}`;
                        }
                    } else {
                        // Extras active: compute combined value with trailing +
                        if (!datesSelected) {
                            // NO dates: homeStart + extras
                            const homeStart = computeHomeStartNoDates(listing);
                            if (homeStart == null) {
                                priceText = "Unavailable";
                            } else {
                                const extrasStart = minBoat(listing) + minChar(listing);
                                const combinedPrice = homeStart + extrasStart;
                                priceText = `$${Math.round(combinedPrice).toLocaleString()}+`;
                            }
                        } else {
                            // WITH dates: customDatesTotalPrice + extras
                            const base = Number(listing.customDatesTotalPrice || 0);
                            const extrasPrice = minBoat(listing) + minChar(listing);
                            const combinedPrice = base + extrasPrice;
                            priceText = `$${Math.round(combinedPrice).toLocaleString()}+`;
                        }
                    }
                    // Create custom marker HTML
                    const markerHTML = `
                    <div style="
                        background-color: white;
                        border: 1px solid #e2e2e2;
                        border-radius: 20px;
                        padding: 6px 12px;
                        font-family: 'TT Fors', sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        color: #000;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    " onmouseover="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" 
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">

                        ${priceText}
                    </div>
                `;

                    // Create the marker
                    let marker;

                    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                        const markerDiv = document.createElement('div');
                        markerDiv.innerHTML = markerHTML;

                        marker = new google.maps.marker.AdvancedMarkerElement({
                            position: { lat, lng },
                            map: window.currentMap,
                            content: markerDiv.firstElementChild,
                            title: listing.property_name
                        });

                        // Add click handler to center map on marker
                        marker.addListener('click', () => {
                            // Prevent multiple rapid clicks on mobile
                            if (window.markerClickTimeout) {
                                return;
                            }

                            window.markerClickTimeout = setTimeout(() => {
                                window.markerClickTimeout = null;
                            }, 300);

                            // Set flag to prevent API request during centering
                            isCenteringOnMarker = true;

                            // Center the map on this marker
                            window.currentMap.setCenter({ lat, lng });

                            // Pan the view down so marker appears lower in viewport
                            // This ensures the card overlay above the marker stays visible
                            window.currentMap.panBy(0, -100);

                            // Close any existing overlay
                            if (window.currentListingOverlay) {
                                window.currentListingOverlay.setMap(null);
                                const prevListingId = window.currentListingOverlay.listing.id;
                                setMarkerBackgroundColor(prevListingId, 'white');
                            }

                            // Change marker background
                            setMarkerBackgroundColor(listing.id, '#9ecaff');

                            // Create and show listing card overlay with slight delay to prevent race conditions
                            setTimeout(() => {
                                const position = new google.maps.LatLng(listing.latitude, listing.longitude);
                                window.currentListingOverlay = createListingCardOverlay(listing, position, window.currentMap);
                            }, 50);
                        });
                    } else {
                        // Fallback to custom overlay
                        class CustomMarker extends google.maps.OverlayView {
                            constructor(position, map, html, listing) {
                                super();
                                this.position = position;
                                this.html = html;
                                this.listing = listing;
                                this.setMap(map);
                            }

                            onAdd() {
                                this.div = document.createElement('div');
                                this.div.style.position = 'absolute';
                                this.div.innerHTML = this.html;

                                const panes = this.getPanes();
                                panes.overlayMouseTarget.appendChild(this.div);

                                // Add click handler
                                this.div.firstElementChild.addEventListener('click', (e) => {
                                    e.stopPropagation();

                                    // Prevent multiple rapid clicks on mobile
                                    if (window.markerClickTimeout) {
                                        return;
                                    }

                                    window.markerClickTimeout = setTimeout(() => {
                                        window.markerClickTimeout = null;
                                    }, 300);

                                    // Set flag to prevent API request during centering
                                    isCenteringOnMarker = true;

                                    // Center the map on this marker
                                    window.currentMap.setCenter({ lat: this.listing.latitude, lng: this.listing.longitude });

                                    // Pan the view down so marker appears lower in viewport
                                    // This ensures the card overlay above the marker stays visible
                                    window.currentMap.panBy(0, -100);

                                    // Close any existing overlay
                                    if (window.currentListingOverlay) {
                                        window.currentListingOverlay.setMap(null);
                                        const prevListingId = window.currentListingOverlay.listing.id;
                                        setMarkerBackgroundColor(prevListingId, 'white');
                                    }

                                    // Change marker background
                                    setMarkerBackgroundColor(this.listing.id, '#9ecaff');

                                    // Create and show listing card overlay with slight delay to prevent race conditions
                                    setTimeout(() => {
                                        const position = new google.maps.LatLng(this.listing.latitude, this.listing.longitude);
                                        window.currentListingOverlay = createListingCardOverlay(this.listing, position, window.currentMap);
                                    }, 50);
                                });
                            }

                            draw() {
                                const overlayProjection = this.getProjection();
                                const position = overlayProjection.fromLatLngToDivPixel(this.position);

                                if (position) {
                                    this.div.style.left = (position.x - this.div.offsetWidth / 2) + 'px';
                                    this.div.style.top = (position.y - this.div.offsetHeight / 2) + 'px';
                                }
                            }

                            onRemove() {
                                if (this.div) {
                                    this.div.parentNode.removeChild(this.div);
                                    this.div = null;
                                }
                            }
                        }

                        marker = new CustomMarker(
                            new google.maps.LatLng(lat, lng),
                            window.currentMap,
                            markerHTML,
                            listing
                        );
                    }

                    // Store marker with listing data
                    window.mapMarkers[listing.id] = marker;
                    marker.listingData = listing;
                }
            }
        });
    }

    // Function to update extra type information visibility based on search selections
    function updateExtrasVisibility() {

        // Get the main search extras container
        const searchExtrasContainer = document.querySelector('[data-element="searchExtrasFilter_container"]');
        const boatRentalFilter = document.querySelector('[data-element="boatRentalFilter"]');
        const fishingChartersFilter = document.querySelector('[data-element="fishingChartersFilter"]');

        // Check if any extras are selected
        const hasBoatRental = !!(currentSelections.typeFlags?.boatRental || apiFormats.type?.boatRental);
        const hasFishingCharter = !!(currentSelections.typeFlags?.fishingCharter || apiFormats.type?.fishingCharter);
        const hasAnyExtras = hasBoatRental || hasFishingCharter;


        // Update search extras container visibility
        if (searchExtrasContainer) {
            searchExtrasContainer.style.display = hasAnyExtras ? 'flex' : 'none';
        }

        // Update individual filter visibility
        if (boatRentalFilter) {
            boatRentalFilter.style.display = hasBoatRental ? 'flex' : 'none';
        }

        if (fishingChartersFilter) {
            fishingChartersFilter.style.display = hasFishingCharter ? 'flex' : 'none';
        }

        // Update all listing card extras containers
        const listingExtrasContainers = document.querySelectorAll('[data-element="listing-card-extras-container"]');
        const boatRentalBlocks = document.querySelectorAll('[data-element="listing-card-extras-boatRentalBlock"]');
        const fishingCharterBlocks = document.querySelectorAll('[data-element="listing-card-extras-fishingCharterBlock"]');

        // Show/hide listing card extras containers
        listingExtrasContainers.forEach(container => {
            container.style.display = hasAnyExtras ? 'flex' : 'none';
        });

        // Show/hide individual listing card extras blocks
        boatRentalBlocks.forEach(block => {
            block.style.display = hasBoatRental ? 'flex' : 'none';
        });

        fishingCharterBlocks.forEach(block => {
            block.style.display = hasFishingCharter ? 'flex' : 'none';
        });
    }

});
