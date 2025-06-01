document.addEventListener('DOMContentLoaded', function () {
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

    // ADD THIS: Pagination state variables
    let currentPage = 1;
    const listingsPerPage = 16;
    let currentListings = []; // Store current listings for pagination

    // Filter state object - stores all active filters
    const activeFilters = {
        typeOfSearch: null,
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
        },
        amenities: [],
        petsAllowed: null,
    };

    // Store original unfiltered results
    let unfilteredListings = [];
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
        selectedDatesObj: { checkIn: null, checkOut: null } // <-- add this
    };

    // Pending selections (not yet confirmed with search)
    const pendingSelections = { ...currentSelections };

    // API-ready format for the search endpoint
    const apiFormats = {
        type: defaultValues.type,
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

    // Simplified function to ensure YYYY-MM-DD format without date manipulation
    function formatDateToYYYYMMDD(date) {
        if (!date) return '';

        if (typeof date === 'string') {
            // If it's already a string in YYYY-MM-DD format, return as-is
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return date;
            }
        }

        // If it's not a proper string, return empty
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
        console.log('getLocationBounds called with:', locationName);

        if (!locationName || locationName === defaultValues.location) {
            console.log('Location is empty or default, returning null');
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
            }
        };

        // Check if the location contains any of our special locations
        for (const [specialName, data] of Object.entries(specialLocations)) {
            // Check if the location starts with the special location name
            // or contains it after a comma (e.g., "Sombrero Beach" or "Something, Sombrero Beach")
            if (cleanLocation.startsWith(specialName) ||
                cleanLocation.includes(`, ${specialName}`) ||
                cleanLocation.toLowerCase().includes(specialName.toLowerCase())) {
                console.log('Found special location match:', specialName);
                return data.bounds;
            }
        }

        // Add "Florida Keys" context if it's not already included
        let searchLocation = locationName;
        if (!searchLocation.toLowerCase().includes('florida keys') &&
            !searchLocation.toLowerCase().includes('fl, usa')) {
            // Ensure we're searching for the location in Florida, USA
            searchLocation = searchLocation.replace(', FL', ', Florida Keys, FL, USA');
            console.log('Modified search location to:', searchLocation);
        }

        try {

            const googleMapsApiKey = 'AIzaSyBtTdNYqGeF4GHpw0OA-tasMjY2yEO-4BY';
            const encodedLocation = encodeURIComponent(locationName);

            console.log('Encoded location for API call:', encodedLocation);

            const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${googleMapsApiKey}`;
            console.log('Calling Google Maps API with URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API response status:', response.status);

            if (!response.ok) {
                console.error('API response not OK:', response.status, response.statusText);
                throw new Error('Failed to fetch location data');
            }

            const data = await response.json();
            console.log('API response data:', JSON.stringify(data));

            if (data.status !== 'OK' || !data.results || !data.results[0]) {
                console.log('No valid location data found. Status:', data.status);
                return null;
            }

            const location = data.results[0];
            console.log('Found location:', location.formatted_address);

            const viewport = location.geometry.viewport;
            console.log('Viewport bounds:', JSON.stringify(viewport));

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

            console.log('Returning location bounds:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error('Error fetching location bounds:', error);
            console.error('Error details:', error.message, error.stack);
            return null;
        }
    }

    // Function to update API formats based on current selections
    async function updateAPIFormats() {
        // Update type
        apiFormats.type = currentSelections.type;

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

        console.log("API-ready formats:", apiFormats);

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

        // Re-enable scrolling on body
        const body = document.querySelector('[data-element="body"]');
        if (body) {
            body.style.overflow = '';
            body.style.position = '';
            body.style.height = '';
        }
    }

    // Function to open a specific popup
    function openPopup(popupInfo) {
        // First close all popups
        closeAllPopups();

        // Then open the selected popup
        if (popupInfo.popup) {
            popupInfo.popup.style.display = 'flex';

            // Add selected class to the appropriate element
            if (popupInfo.isGuests) {
                if (guestsSearchContainer) guestsSearchContainer.classList.add('selected');
            } else {
                if (popupInfo.button) popupInfo.button.classList.add('selected');
            }

            // Disable scrolling on body
            const body = document.querySelector('[data-element="body"]');
            if (body) {
                body.style.overflow = 'hidden';
                body.style.position = 'fixed';
                body.style.height = '100%';
                body.style.width = '100%';
            }
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
            } else {
                currentSelections.type = pendingSelections.type;
            }

            // Update API formats based on current selections
            await updateAPIFormats();

            // Fetch property search results
            const searchResults = await fetchPropertySearchResults();

            // Handle search results
            if (!searchResults?.error) {
                localStorage.setItem('propertySearchResults', JSON.stringify(searchResults));
            } else {
                console.error('Search failed:', searchResults?.message);
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

        if (!isClickInsideAnyPopup && !isClickOnAnyButton && !searchButton.contains(e.target)) {
            closeAllPopups();
            revertPendingChanges();
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
        const homeBoatOption = document.querySelector('[data-element="navBarSearch_typePopup_homeBoat"]');
        const privateHomeOption = document.querySelector('[data-element="navBarSearch_typePopup_privateHome"]');

        // Set initial selection (Private Home is default)
        if (privateHomeOption) {
            privateHomeOption.classList.add('selected');
        }

        // Function to update the visual state of type options based on current selection
        function updateTypeSelectionVisual() {
            // Remove selected class from both options
            if (homeBoatOption) homeBoatOption.classList.remove('selected');
            if (privateHomeOption) privateHomeOption.classList.remove('selected');

            // Add selected class based on current confirmed selection
            if (currentSelections.type === "Home & Boat" && homeBoatOption) {
                homeBoatOption.classList.add('selected');
            } else if (currentSelections.type === "Private Home" && privateHomeOption) {
                privateHomeOption.classList.add('selected');
            }
        }

        // Function to handle type selection
        function handleTypeSelection(selectedElement, selectedType) {
            // Remove selected class from both options
            if (homeBoatOption) homeBoatOption.classList.remove('selected');
            if (privateHomeOption) privateHomeOption.classList.remove('selected');

            // Add selected class to the clicked option
            if (selectedElement) selectedElement.classList.add('selected');

            // Update pending selection and button text
            pendingSelections.type = selectedType;
            updateButtonText(typeButtonText, selectedType, defaultValues.type);
        }

        // Add click event listeners to options
        if (homeBoatOption) {
            homeBoatOption.addEventListener('click', function () {
                handleTypeSelection(homeBoatOption, "Home & Boat");
            });
        }

        if (privateHomeOption) {
            privateHomeOption.addEventListener('click', function () {
                handleTypeSelection(privateHomeOption, "Private Home");
            });
        }

        // Make updateTypeSelectionVisual available outside this function
        return { updateTypeSelectionVisual };
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

        // Create calendar layout
        function renderCalendars() {
            calendarContainer.innerHTML = '';

            // Create container for two months
            const monthsContainer = document.createElement('div');
            monthsContainer.className = 'months-container';
            monthsContainer.style.display = 'flex';
            monthsContainer.style.justifyContent = 'space-between';
            monthsContainer.style.gap = '20px';
            monthsContainer.style.position = 'relative';

            // Add navigation buttons
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

            // Render current month
            const month1 = createMonthCalendar(currentMonth, currentYear);
            month1.style.flex = '1';

            // Render next month
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 11) {
                nextMonth = 0;
                nextYear++;
            }
            const month2 = createMonthCalendar(nextMonth, nextYear);
            month2.style.flex = '1';

            // Append months to container
            monthsContainer.appendChild(month1);
            monthsContainer.appendChild(month2);

            // Append navigation buttons to the calendar container
            monthsContainer.appendChild(prevBtn);
            monthsContainer.appendChild(nextBtn);

            // Append the months container to the calendar container
            calendarContainer.appendChild(monthsContainer);

            // Update navigation button states
            updateNavigationButtons();
        }

        // Function to create a calendar for a specific month
        function createMonthCalendar(month, year) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-calendar';

            // Month header with navigation
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.style.textAlign = 'center';
            monthHeader.style.fontFamily = "'TT Fors', sans-serif";
            monthHeader.style.fontSize = '16px';
            monthHeader.style.fontWeight = 'bold';
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
                dayCell.style.alignItems = 'center';
                dayCell.style.justifyContent = 'center';
                dayCell.style.cursor = 'pointer';
                dayCell.style.borderRadius = '50%';
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

                        // Apply full border radius if only check-in is selected, otherwise left-side only
                        if (!tempSelectedDates.checkOut) {
                            dayCell.style.borderRadius = '50%'; // Full circle when only one date selected
                        } else {
                            dayCell.style.borderRadius = '50% 0 0 50%'; // Rounded on the left side only when range
                        }
                    }

                    // Style for selected check-out date
                    if (tempSelectedDates.checkOut && date.getTime() === tempSelectedDates.checkOut.getTime()) {
                        dayCell.style.backgroundColor = '#1374E0';
                        dayCell.style.color = 'white';

                        // Apply full border radius if only check-out is selected, otherwise right-side only
                        if (!tempSelectedDates.checkIn) {
                            dayCell.style.borderRadius = '50%'; // Full circle when only one date selected
                        } else {
                            dayCell.style.borderRadius = '0 50% 50% 0'; // Rounded on the right side only when range
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

            // Sync the UI with the temporary selection state
            renderCalendars();
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
                // Always reset to current month if no dates are selected
                if (pendingSelections.dates === defaultValues.dates) {
                    // Reset to current month/year
                    const today = new Date();
                    currentMonth = today.getMonth();
                    currentYear = today.getFullYear();
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
                console.log("Search button clicked, current selections:", JSON.stringify(currentSelections));

                // Check if dates popup is open and selection is incomplete
                if (datesPopup && datesPopup.style.display === 'flex' &&
                    ((tempSelectedDates.checkIn && !tempSelectedDates.checkOut) ||
                        (!tempSelectedDates.checkIn && tempSelectedDates.checkOut))) {

                    console.log("Incomplete date selection when search clicked:", JSON.stringify(tempSelectedDates));

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

                        console.log("Reverted to previous valid selection:", JSON.stringify(selectedDates));
                    } else {
                        // Reset everything to default
                        tempSelectedDates = {
                            checkIn: null,
                            checkOut: null
                        };
                        selectingCheckOut = false;
                        pendingSelections.dates = defaultValues.dates;
                        updateButtonText(datesButtonText, defaultValues.dates, defaultValues.dates);

                        console.log("Reset to default dates");
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

                    console.log("After selecting both dates, updated selections:", JSON.stringify(currentSelections));
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

    // Initialize the popups
    const typePopupHandlers = setupTypePopup();
    setupLocationPopup();
    setupDatesPopup();
    setupGuestsPopup();
    const filterSystem = setupFilterSystem();

    // Add event listeners to buttons to update visual state when popups open
    if (typeButton) {
        typeButton.addEventListener('click', function () {
            // Update type selection visual state when popup opens
            typePopupHandlers.updateTypeSelectionVisual();
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

        // Type toggle elements
        const entireHomeToggle = document.querySelector('[data-element="filterModalType_entireHome"]');
        const homeAndBoatToggle = document.querySelector('[data-element="filterModalType_homeAndBoat"]');
        const boatContainer = document.querySelector('[data-element="filterModalBoat_container"]');
        const dockBoatSpecsContainer = document.querySelector('[data-element="filterModalDock_boatSpecsContainer"]');

        // Price elements
        const priceScrollBar = document.querySelector('[data-element="filterModalPrice_scrollBar"]');
        const priceDescription = document.querySelector('[data-element="filterModalPrice_description"]');
        const priceMinInput = document.querySelector('[data-element="filterModalPrice_minPriceInput"]');
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

        // Add this with the other element selections at the top of setupFilterSystem
        const petsAllowedCheckbox = document.querySelector('[data-element="filterModalPets_petsAllowedCheckbox"]');

        // Amenities elements
        // Track if type has changed
        let initialType = null;

        // initially hide filter count
        if (activeFiltersCount) {
            activeFiltersCount.style.display = 'none';
        }

        // Setup Type Toggle
        function setupTypeToggle() {
            // Set initial state based on current selection
            const currentType = currentSelections.type || defaultValues.type;
            initialType = currentType;

            if (currentType === "Private Home") {
                entireHomeToggle?.classList.add('selected');
                homeAndBoatToggle?.classList.remove('selected');
                if (boatContainer) boatContainer.style.display = 'none';
                if (dockBoatSpecsContainer) dockBoatSpecsContainer.style.display = 'flex';
            } else if (currentType === "Home & Boat") {
                homeAndBoatToggle?.classList.add('selected');
                entireHomeToggle?.classList.remove('selected');
                if (boatContainer) boatContainer.style.display = 'flex';
                if (dockBoatSpecsContainer) dockBoatSpecsContainer.style.display = 'none';
            }

            // Add click handlers
            entireHomeToggle?.addEventListener('click', () => {
                entireHomeToggle.classList.add('selected');
                homeAndBoatToggle?.classList.remove('selected');
                if (boatContainer) boatContainer.style.display = 'none';
                if (dockBoatSpecsContainer) dockBoatSpecsContainer.style.display = 'flex';
                activeFilters.typeOfSearch = "Private Home";
            });

            homeAndBoatToggle?.addEventListener('click', () => {
                homeAndBoatToggle.classList.add('selected');
                entireHomeToggle?.classList.remove('selected');
                if (boatContainer) boatContainer.style.display = 'flex';
                if (dockBoatSpecsContainer) dockBoatSpecsContainer.style.display = 'none';
                activeFilters.typeOfSearch = "Home & Boat";
            });
        }


        function setupPriceSlider() {
            const hasDates = apiFormats.dates.checkIn && apiFormats.dates.checkOut;
            const maxPrice = hasDates ? 12000 : 2000;

            // Update description
            if (priceDescription) {
                priceDescription.textContent = hasDates ? "Trip price, before taxes" : "Price per night";
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
                }

                function handleDragStart(e, isMin) {
                    e.preventDefault();
                    if (isMin) {
                        isDraggingMin = true;
                        startX = e.clientX;
                        startLeft = parseInt(sliderMin.value);
                    } else {
                        isDraggingMax = true;
                        startX = e.clientX;
                        startLeft = parseInt(sliderMax.value);
                    }
                }

                function handleDragMove(e) {
                    if (!isDraggingMin && !isDraggingMax) return;

                    const containerRect = container.getBoundingClientRect();
                    const containerWidth = containerRect.width;
                    const moveX = e.clientX - startX;
                    const movePercent = (moveX / containerWidth) * 100;
                    const moveValue = Math.round((movePercent / 100) * maxPrice);

                    if (isDraggingMin) {
                        let newValue = Math.max(0, Math.min(startLeft + moveValue, parseInt(sliderMax.value)));
                        sliderMin.value = newValue;
                    } else if (isDraggingMax) {
                        let newValue = Math.max(parseInt(sliderMin.value), Math.min(startLeft + moveValue, maxPrice));
                        sliderMax.value = newValue;
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

                // Add touch event listeners for mobile
                thumbMin.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], true));
                thumbMax.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], false));
                document.addEventListener('touchmove', (e) => handleDragMove(e.touches[0]));
                document.addEventListener('touchend', handleDragEnd);

                // Keep the original input event listeners
                sliderMin?.addEventListener('input', () => {
                    if (parseInt(sliderMin.value) > parseInt(sliderMax.value)) {
                        sliderMin.value = sliderMax.value;
                    }
                    updateSlider();
                });

                sliderMax?.addEventListener('input', () => {
                    if (parseInt(sliderMax.value) < parseInt(sliderMin.value)) {
                        sliderMax.value = sliderMin.value;
                    }
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
                if (priceScrollBar) {
                    const slider = priceScrollBar.querySelector('.price-slider-max');
                    if (slider) slider.value = val;
                    updateSlider();
                }
            });

            // Set initial values
            if (priceMinInput) priceMinInput.value = '$0';
            if (priceMaxInput) priceMaxInput.value = `$${maxPrice.toLocaleString()}+`;
        }


        // Setup Room Controls
        function setupRoomControls() {
            // SVG icons for buttons
            const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
            const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';

            // Setup each room type
            [bedroomsElements, bedsElements, bathroomsElements].forEach((elements, index) => {
                const isBoathrooms = index === 2;
                const increment = isBoathrooms ? 0.5 : 1;
                let value = null; // null represents "Any"

                // Set SVG icons
                if (elements.minus) elements.minus.innerHTML = svgMinus;
                if (elements.plus) elements.plus.innerHTML = svgPlus;

                // Set initial display
                if (elements.number) elements.number.textContent = 'Any';

                // Update button states
                function updateButtonStates() {
                    if (elements.minus) {
                        elements.minus.style.opacity = value === null ? '0.3' : '1';
                        elements.minus.disabled = value === null;
                    }
                }

                elements.plus?.addEventListener('click', () => {
                    if (value === null) {
                        value = increment;
                    } else {
                        value += increment;
                    }
                    if (elements.number) {
                        elements.number.textContent = isBoathrooms && value % 1 !== 0 ? value.toFixed(1) : value.toString();
                    }
                    updateButtonStates();
                });

                elements.minus?.addEventListener('click', () => {
                    if (value !== null) {
                        value -= increment;
                        if (value <= 0) {
                            value = null;
                            if (elements.number) elements.number.textContent = 'Any';
                        } else {
                            if (elements.number) {
                                elements.number.textContent = isBoathrooms && value % 1 !== 0 ? value.toFixed(1) : value.toString();
                            }
                        }
                    }
                    updateButtonStates();
                });

                updateButtonStates();

                // Store getter for filter collection
                if (index === 0) { // bedrooms
                    elements.getValue = () => value;
                } else if (index === 1) { // beds
                    elements.getValue = () => value;
                } else { // bathrooms
                    elements.getValue = () => value;
                }
            });
        }

        // Setup Dock Section
        function setupDockSection() {
            // Private dock checkbox
            let hasPrivateDock = false;

            //initially hide private dock options
            if (privateDockOptions) {
                privateDockOptions.style.display = 'none';
            }

            if (privateDockCheckbox) {
                privateDockCheckbox.style.cursor = 'pointer';
                privateDockCheckbox.addEventListener('click', () => {
                    hasPrivateDock = !hasPrivateDock;
                    privateDockCheckbox.style.backgroundColor = hasPrivateDock ? '#000' : '#fff';
                    if (privateDockOptions) {
                        privateDockOptions.style.display = hasPrivateDock ? 'flex' : 'none';
                    }
                    activeFilters.dock.hasPrivateDock = hasPrivateDock ? true : null;
                });
            }

            // Dock specs
            Object.entries(dockSpecs).forEach(([key, element]) => {
                if (element) {
                    element.style.cursor = 'pointer';
                    element.addEventListener('click', () => {
                        element.classList.toggle('selected');
                        const dockKey = 'has' + key.charAt(0).toUpperCase() + key.slice(1);
                        activeFilters.dock[dockKey] = element.classList.contains('selected') ? true : null;
                    });
                }
            });

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

                    if (boatLengthInput) {
                        boatLengthInput.value = value >= 80 ? '80+ ft' : value + ' ft';
                    }
                }

                function handleDragStart(e) {
                    e.preventDefault();
                    isDragging = true;
                    startX = e.clientX;
                    startValue = parseInt(slider.value);
                }

                function handleDragMove(e) {
                    if (!isDragging) return;

                    const containerRect = container.getBoundingClientRect();
                    const containerWidth = containerRect.width;
                    const moveX = e.clientX - startX;
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

                // Add touch event listeners for mobile
                thumb.addEventListener('touchstart', (e) => handleDragStart(e.touches[0]));
                document.addEventListener('touchmove', (e) => handleDragMove(e.touches[0]));
                document.addEventListener('touchend', handleDragEnd);

                // Keep the original input event listener
                slider?.addEventListener('input', () => {
                    updateSlider(parseInt(slider.value));
                });

                // Initialize slider
                updateSlider(parseInt(slider.value));
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
                        } else {
                            let val = parseInt(this.value);
                            if (input === boatLengthInput && val > 80) val = 80;
                            this.value = (input === boatLengthInput && val >= 80) ? '80+ ft' : val + ' ft';
                        }
                    });
                }
            });
        }

        // Add this function to setupFilterSystem
        function setupAmenitiesSection() {


            const amenityItem = document.querySelector('[data-element="filterModalAmenity_item"]');
            const amenitiesContainer = amenityItem?.parentElement;



            if (!amenityItem || !amenitiesContainer) {
                console.error('Required amenity elements not found');
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

                // Add click handler
                button.addEventListener('click', () => {
                    button.classList.toggle('selected');
                    const isSelected = button.classList.contains('selected');

                    // Update activeFilters
                    if (isSelected) {
                        if (!activeFilters.amenities.includes(amenity.id)) {
                            activeFilters.amenities.push(amenity.id);
                        }
                    } else {
                        const index = activeFilters.amenities.indexOf(amenity.id);
                        if (index > -1) {
                            activeFilters.amenities.splice(index, 1);
                        }
                    }
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
        }

        // Add this function before the return statement in setupFilterSystem
        function setupPetsSection() {
            // Initially set the checkbox style
            if (petsAllowedCheckbox) {
                petsAllowedCheckbox.style.cursor = 'pointer';
                petsAllowedCheckbox.style.backgroundColor = '#fff';
            }

            // Add click handler
            if (petsAllowedCheckbox) {
                petsAllowedCheckbox.addEventListener('click', () => {
                    // Get the current state by checking if the background is black
                    const isCurrentlySelected = petsAllowedCheckbox.style.backgroundColor === 'rgb(0, 0, 0)' ||
                        petsAllowedCheckbox.style.backgroundColor === '#000';

                    // Toggle the background color
                    petsAllowedCheckbox.style.backgroundColor = isCurrentlySelected ? '#fff' : '#000';

                    // Update the filter state
                    activeFilters.petsAllowed = !isCurrentlySelected;

                    // Update the count only once
                    updateFilterCount();
                });
            }
        }

        // Function to update filter count badge
        function updateFilterCount() {
            let count = 0;

            // Count active filters
            if (activeFilters.priceRange.min || (activeFilters.priceRange.max && activeFilters.priceRange.max < (apiFormats.dates.checkIn ? 12000 : 2000))) count++;
            if (activeFilters.bedrooms) count++;
            if (activeFilters.beds) count++;
            if (activeFilters.bathrooms) count++;
            // Change this line to count each amenity individually
            count += activeFilters.amenities.length;
            if (activeFilters.petsAllowed !== null) count++;

            // Count dock features
            const dockFeatures = Object.values(activeFilters.dock);
            if (dockFeatures.some(feature => feature !== null)) count++;

            console.log("count", count);

            // Update UI
            if (activeFiltersCount) {
                if (count > 0) {
                    console.log("count", count);
                    activeFiltersCount.textContent = count;
                    activeFiltersCount.style.display = 'flex';
                } else {
                    console.log("count", count);
                    activeFiltersCount.style.display = 'none';
                }
            }

            return count;
        }

        // Function to collect filter values from UI
        function collectFilterValues() {
            // Type
            if (entireHomeToggle?.classList.contains('selected')) {
                activeFilters.typeOfSearch = "Private Home";
            } else if (homeAndBoatToggle?.classList.contains('selected')) {
                activeFilters.typeOfSearch = "Home & Boat";
            }

            // Price range
            const priceMin = priceMinInput?.value.replace(/[$,+]/g, '');
            const priceMax = priceMaxInput?.value.replace(/[$,+]/g, '');
            activeFilters.priceRange.min = priceMin ? parseFloat(priceMin) : null;
            activeFilters.priceRange.max = priceMax && priceMax < (apiFormats.dates.checkIn ? 12000 : 2000) ? parseFloat(priceMax) : null;

            // Rooms
            activeFilters.bedrooms = bedroomsElements.getValue ? bedroomsElements.getValue() : null;
            activeFilters.beds = bedsElements.getValue ? bedsElements.getValue() : null;
            activeFilters.bathrooms = bathroomsElements.getValue ? bathroomsElements.getValue() : null;

            // Dock features are already updated in real-time
        }

        // Function to apply filters to listings
        function applyFiltersToListings(listings) {
            if (!listings) return [];
            unfilteredListings = [...listings];

            return listings.filter(listing => {
                // Price filter
                const hasDates = apiFormats.dates.checkIn && apiFormats.dates.checkOut;
                const price = hasDates ? listing.customDatesTotalPrice : listing.nightlyPrice;

                if (activeFilters.priceRange.min && price < activeFilters.priceRange.min) return false;
                if (activeFilters.priceRange.max && price > activeFilters.priceRange.max) return false;

                // Room filters
                if (activeFilters.bedrooms && listing.num_bedrooms < activeFilters.bedrooms) return false;
                if (activeFilters.beds && listing.num_beds < activeFilters.beds) return false;
                if (activeFilters.bathrooms && listing.num_bathrooms < activeFilters.bathrooms) return false;

                // Dock features filter
                if (activeFilters.dock.hasPrivateDock && !listing.has_private_dock) return false;
                if (activeFilters.dock.hasShorePower && !listing.dock_shorePower) return false;
                if (activeFilters.dock.hasFreshWater && !listing.dock_freshWater) return false;
                if (activeFilters.dock.hasCleaningStation && !listing.dock_cleaningStation) return false;
                if (activeFilters.dock.hasDockLights && !listing.dock_light) return false;

                // Boat specs
                if (activeFilters.dock.hasBoatSpecsLength && listing.dock_max_vessel_length < activeFilters.dock.hasBoatSpecsLength) return false;
                if (activeFilters.dock.hasBoatSpecsDraft && listing.dock_max_vessel_draft < activeFilters.dock.hasBoatSpecsDraft) return false;
                if (activeFilters.dock.hasBoatSpecsBeam && listing.dock_max_vessel_beam < activeFilters.dock.hasBoatSpecsBeam) return false;

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

                return true;
            });
        }

        // Initialize all components
        setupTypeToggle();
        setupPriceSlider();
        setupRoomControls();
        setupDockSection();
        setupAmenitiesSection();
        setupPetsSection();

        // Event handlers
        filterButton?.addEventListener('click', () => {
            if (filterModal) {
                filterModal.style.display = 'flex';
                // Reset initial type tracking
                initialType = currentSelections.type || defaultValues.type;
            }
        });

        filterModalBackground?.addEventListener('click', () => {
            if (filterModal) filterModal.style.display = 'none';
        });

        closeFilterButton?.addEventListener('click', () => {
            if (filterModal) filterModal.style.display = 'none';
        });

        applyFiltersButton?.addEventListener('click', async () => {
            collectFilterValues();
            updateFilterCount();
            if (filterModal) filterModal.style.display = 'none';

            // Check if type changed
            const typeChanged = activeFilters.typeOfSearch && activeFilters.typeOfSearch !== initialType;

            if (typeChanged) {
                // Update current selections with new type
                currentSelections.type = activeFilters.typeOfSearch;
                pendingSelections.type = activeFilters.typeOfSearch;
                updateButtonText(typeButtonText, activeFilters.typeOfSearch, defaultValues.type);

                // Update API formats and fetch new results
                await updateAPIFormats();
                await fetchPropertySearchResults();
            } else {
                // Just apply filters to existing results
                const filteredListings = applyFiltersToListings(window.allListings || currentListings);
                currentPage = 1;
                renderListingCards(filteredListings, false, 1);
                updateMarkersVisibilityWithFilters(filteredListings);
            }
        });

        clearFiltersButton?.addEventListener('click', () => {
            clearAllFilters();
        });

        // Define clearAllFilters function here
        function clearAllFilters() {
            // Reset filter state to initial values
            activeFilters.typeOfSearch = null;
            activeFilters.priceRange = { min: null, max: null };
            activeFilters.bedrooms = null;
            activeFilters.beds = null;
            activeFilters.bathrooms = null;
            activeFilters.dock = {
                hasPrivateDock: null,
                hasShorePower: null,
                hasFreshWater: null,
                hasCleaningStation: null,
                hasDockLights: null,
                hasBoatSpecsLength: null,
                hasBoatSpecsDraft: null,
                hasBoatSpecsBeam: null,
            };
            activeFilters.amenities = [];
            activeFilters.petsAllowed = null;

            // Reset UI elements
            setupTypeToggle();
            setupPriceSlider();
            setupRoomControls();
            setupDockSection();
            setupAmenitiesSection();
            setupPetsSection();

            // Explicitly reset private dock checkbox
            if (privateDockCheckbox) {
                privateDockCheckbox.style.backgroundColor = '#fff';
            }
            if (privateDockOptions) {
                privateDockOptions.style.display = 'none';
            }
            if (petsAllowedCheckbox) {
                petsAllowedCheckbox.style.backgroundColor = '#fff';
            }

            updateFilterCount();
        }

        return {
            applyFilters: applyFiltersToListings,
            clearFilters: clearAllFilters,
            updateCount: updateFilterCount,
            getActiveFilters: () => activeFilters,

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

    // Modify the fetchPropertySearchResults function
    async function fetchPropertySearchResults() {
        // Prevent multiple simultaneous searches
        if (isSearchInProgress) {
            console.log("Search already in progress, skipping...");
            return;
        }

        try {
            isSearchInProgress = true;

            // Show skeleton and store show time
            const skeleton = document.querySelector('[data-element="map_skeleton"]');
            if (skeleton) {
                skeleton.setAttribute('data-show-time', Date.now().toString());
                showMapSkeleton();
            }

            console.log("Fetching properties with search parameters:", apiFormats);

            // Show loading state
            const searchButton = document.querySelector('[data-element="navBarSearch_searchButton"]');
            if (searchButton) {
                searchButton.classList.add('loading');
            }

            // Convert apiFormats to URL parameters
            const params = new URLSearchParams();

            // Add parameters based on apiFormats object
            // Type
            if (apiFormats.type) {
                params.append('type', apiFormats.type);
            }

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

                console.log("Original dates:", apiFormats.dates);
                console.log("Formatted check-in:", formattedCheckIn);
                console.log("Formatted check-out:", formattedCheckOut);

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
            console.log("API URL:", apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET'
            });

            // Remove loading state
            if (searchButton) {
                searchButton.classList.remove('loading');
            }

            // Check if the response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Search API error:', response.status, errorData);
                throw new Error(`API error: ${response.status}`);
            }

            // Parse the data
            const data = await response.json();
            console.log("Property search results:", data);

            // Store results in localStorage
            localStorage.setItem('propertySearchResults', JSON.stringify(data));

            // Setup map and render listings
            await setupMapIntegration(data);

            return data;
        } catch (error) {
            console.error('Error fetching property search results:', error);
            // Hide skeleton even on error
            hideMapSkeleton();
            return { error: true, message: error.message };
        } finally {
            // Always reset the search flag when done
            isSearchInProgress = false;

            // Remove loading state
            const searchButton = document.querySelector('[data-element="navBarSearch_searchButton"]');
            if (searchButton) {
                searchButton.classList.remove('loading');
            }
        }
    }

    // MODIFY THIS: Update the setupMapIntegration function (around line 2470)
    function setupMapIntegration(searchResults) {
        // Apply filters before rendering
        const filteredResults = filterSystem ? filterSystem.applyFilters(searchResults) : searchResults;

        // Load Google Maps API if not already loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            loadGoogleMapsAPI(() => {
                renderSearchResults(filteredResults);
            });
        } else {
            renderSearchResults(filteredResults);
        }
    }

    // Modify the renderSearchResults function to preserve map bounds
    function renderSearchResults(searchResults) {
        currentPage = 1; // Reset to first page on new search

        // Store current map bounds if they exist
        let currentBounds = null;
        if (window.currentMap && window.currentMap.getBounds()) {
            currentBounds = window.currentMap.getBounds();
        }

        // Render listing cards
        renderListingCards(searchResults);

        // Create map with preserved bounds
        createMap(searchResults, currentBounds);
    }

    // Function to load Google Maps API with callback
    function loadGoogleMapsAPI(callback) {
        // Show skeleton when starting to load Maps API
        showMapSkeleton();

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
            console.log('Google Maps API loaded');
            callback();
            // Note: Don't hide skeleton here as it will be handled by createMap
        };
    }

    // Function to initialize Splide for a listing card
    function initializeSplideForCard(card, listing) {
        // Find the splide element within the card
        const splideElement = card.querySelector('.splide');

        if (!splideElement || !listing._images || listing._images.length === 0) {
            return; // No slider element or no images
        }

        // Check if Splide is already initialized on this element
        if (splideElement.classList.contains('is-initialized')) {
            return; // Already initialized
        }

        // Initialize Splide for this slider
        const slider = new Splide(splideElement, {
            type: 'loop',   // Enable looping
        });

        slider.on('pagination:mounted', function (data) {
            // Limit the number of pagination dots to a maximum of 5
            const maxDots = 5;

            // Hide excess pagination dots beyond maxDots
            data.items.forEach((item, i) => {
                if (i >= maxDots) {
                    item.li.style.display = 'none';
                }
            });
        });

        slider.on('move', function (newIndex) {
            const maxDots = 5;

            // Calculate which dot should be highlighted based on the current slide
            const activeDotIndex = newIndex % maxDots;

            // Get all pagination dots
            const dots = splideElement.querySelectorAll('.splide__pagination__page');

            // Remove active class from all dots
            dots.forEach((dot) => {
                dot.classList.remove('is-active');
            });

            // Add active class to the correct dot
            if (dots[activeDotIndex]) {
                dots[activeDotIndex].classList.add('is-active');
            }
        });

        slider.mount();

        // Add slides for each image
        listing._images.forEach((imageData) => {
            if (imageData && imageData.property_image && imageData.property_image.url) {
                const li = document.createElement('li');
                li.classList.add('splide__slide');
                li.innerHTML = `<img src="${imageData.property_image.url}" alt="${listing.property_name || 'Property Photo'}">`;
                slider.add(li);
            }
        });

        // Style the arrows
        const prevArrow = splideElement.querySelector('.splide__arrow--prev');
        const nextArrow = splideElement.querySelector('.splide__arrow--next');

        // Style the arrows themselves (opacity and padding)
        [prevArrow, nextArrow].forEach((arrow) => {
            if (arrow) {
                arrow.style.opacity = '0.8'; // Make less transparent
                arrow.style.height = '34px';
                arrow.style.width = '34px';
                arrow.style.boxShadow = '0px 0px 2px rgba(255, 255, 255, 0.4)';
            }
        });

        // Ensure the icon inside the arrows (usually an SVG) remains visible
        const arrowIcons = splideElement.querySelectorAll('.splide__arrow svg');
        arrowIcons.forEach((icon) => {
            icon.style.width = '16px'; // Set a fixed size for the icon
            icon.style.height = '16px'; // Adjust as needed
        });

        // Stop propagation when clicking on arrows
        [prevArrow, nextArrow].forEach(arrow => {
            if (arrow) {
                arrow.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent the link's default behavior
                    e.stopPropagation();
                });
            }
        });

        // Refresh the slider after adding slides
        slider.refresh();

        // Mark as initialized
        splideElement.classList.add('is-initialized');
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



    // Function to render listing cards (modified to include Splide)
    function renderListingCards(listings, filteredOnly = false, page = 1) {
        const listingCardTemplate = document.querySelector('[data-element="listingCard_block"]');
        const listingContainer = document.querySelector('[data-element="listings-container"]');

        if (!listingCardTemplate || !listingContainer) {
            console.error('Listing template or container not found');
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
            reloadButton.style.fontWeight = 'bold';
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
            console.log("Listing:", listing);
            // Check if card for this listing already exists
            let card = listingContainer.querySelector(`[data-listing-id="${listing.id}"]`);

            if (!card) {
                // Card doesn't exist, create a new one from template
                card = listingCardTemplate.cloneNode(true);
                card.style.display = ''; // Make sure the new card is visible

                // Update card content
                const title = card.querySelector('[data-element="listing-card-title"]');
                const subtitle = card.querySelector('[data-element="listing-card-subtitle"]');
                const calendarText = card.querySelector('[data-element="ListingCardCalendarText"]');
                const totalPrice = card.querySelector('[data-element="ListingCardTotalPrice"]');
                const image = card.querySelector('[data-element="listing-card-image"]');
                // Add review elements
                const reviewAverage = card.querySelector('[data-element="ListingCardReviewAverage"]');
                const reviewCount = card.querySelector('[data-element="ListingCardReviewCount"]');

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

                // Handle dates and price display
                if (calendarText) {
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        // Using search dates
                        calendarText.textContent = formatDateRange(
                            apiFormats.dates.checkIn,
                            apiFormats.dates.checkOut
                        );
                    } else {
                        // Using default dates
                        calendarText.textContent = formatDateRange(
                            listing.default_startDate,
                            listing.default_endDate
                        );
                    }
                }

                // Handle price display
                if (totalPrice) {
                    let priceValue;
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        // Using custom dates price
                        priceValue = listing.customDatesTotalPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    } else {
                        // Using default dates price
                        priceValue = listing.total_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                    totalPrice.textContent = priceValue ? `$${priceValue}` : 'Price on request';
                }

                // Set data attribute for map interaction
                card.setAttribute('data-listing-id', listing.id);

                // Add click event to listingCard_bodyBlock for navigation
                const bodyBlock = card.querySelector('[data-element="listingCard_bodyBlock"]');
                if (bodyBlock) {
                    bodyBlock.addEventListener('click', (e) => {
                        // Don't navigate if clicking on splide arrows or dots
                        if (e.target.closest('.splide__arrow') ||
                            e.target.closest('.splide__pagination')) {
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

                // Initialize Splide for this card after it's in the DOM
                requestAnimationFrame(() => {
                    initializeSplideForCard(card, listing);
                });
            } else {
                // Card exists, update its content
                const calendarText = card.querySelector('[data-element="ListingCardCalendarText"]');
                const totalPrice = card.querySelector('[data-element="ListingCardTotalPrice"]');
                // Add review elements
                const reviewAverage = card.querySelector('[data-element="ListingCardReviewAverage"]');
                const reviewCount = card.querySelector('[data-element="ListingCardReviewCount"]');

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

                // Update dates if needed
                if (calendarText) {
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        calendarText.textContent = formatDateRange(
                            apiFormats.dates.checkIn,
                            apiFormats.dates.checkOut
                        );
                    } else {
                        calendarText.textContent = formatDateRange(
                            listing.default_startDate,
                            listing.default_endDate
                        );
                    }
                }

                // Update price if needed
                if (totalPrice) {
                    let priceValue;
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        // Using custom dates price
                        priceValue = listing.customDatesTotalPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    } else {
                        // Using default dates price
                        priceValue = listing.total_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                    totalPrice.textContent = priceValue ? `$${priceValue}` : 'Price on request';
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

                // Check if Splide needs to be initialized
                requestAnimationFrame(() => {
                    initializeSplideForCard(card, listing);
                });

                // Add/update click event handler for existing cards
                const bodyBlock = card.querySelector('[data-element="listingCard_bodyBlock"]');
                if (bodyBlock && !bodyBlock.hasAttribute('data-click-handler')) {
                    bodyBlock.setAttribute('data-click-handler', 'true'); // Mark as having handler

                    bodyBlock.addEventListener('click', (e) => {
                        // Don't navigate if clicking on splide arrows or dots
                        if (e.target.closest('.splide__arrow') ||
                            e.target.closest('.splide__pagination')) {
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

    // Replace the createMap function with this corrected version
    function createMap(listings, preserveBounds = null) {
        const mapContainer = document.querySelector('[data-element="search_map"]');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Show skeleton at start of map creation
        showMapSkeleton();

        // Store all listings globally for filtering
        window.allListings = listings;

        // Define neighborhoods for zoom level check
        const neighborhoods = {
            "Key Largo": ["Port Largo", "Rock Harbor", "Sunset Cove", "Sexton Cove", "Garden Cove"],
            "Islamorada": ["Plantation Key Colony", "Lower Matecumbe", "Venetian Shores", "Port Antigua", "Upper Matecumbe", "Windley Key"],
            "Marathon": ["Boot Key Harbor", "Sombrero Beach", "Coco Plum", "Key Colony Beach"],
            "Big Pine Key": ["Eden Pines", "Doctor's Arm", "No Name Key", "Pine Channel Estates"],
            "Key West": ["Old Town", "New Town", "Bahama Village", "Truman Annex", "Casa Marina"]
        };

        // Define special locations with specific coordinates
        const specialLocations = {
            "Sombrero Beach": {
                bounds: {
                    northeast: { lat: 24.710746, lng: -81.074342 },
                    southwest: { lat: 24.689237, lng: -81.092847 },
                    center: { lat: 24.699992, lng: -81.083595 }
                }
            }
        };

        // Function to check if location is a neighborhood
        function isNeighborhood(location) {
            if (!location) return false;
            const cleanLocation = location.replace(/, FL$/, '').trim();

            for (const specialName of Object.keys(specialLocations)) {
                if (cleanLocation.startsWith(specialName) ||
                    cleanLocation.includes(`, ${specialName}`) ||
                    cleanLocation.toLowerCase().includes(specialName.toLowerCase())) {
                    return true;
                }
            }

            if (cleanLocation.includes(',')) {
                const [neighborhood] = cleanLocation.split(',').map(part => part.trim());
                return Object.values(neighborhoods).some(cityNeighborhoods =>
                    cityNeighborhoods.includes(neighborhood)
                );
            }
            return false;
        }

        // Define Florida Keys bounds
        const floridaKeysBounds = {
            north: 25.2,
            south: 24.4,
            west: -82.2,
            east: -80.0
        };

        // Determine initial zoom level based on search location
        let initialZoom = 11;
        let initialCenter = { lat: 24.7, lng: -81.1 };

        if (apiFormats.location && apiFormats.location.name) {
            const cleanLocation = apiFormats.location.name.replace(/, FL$/, '').trim();

            if (specialLocations[cleanLocation]) {
                initialZoom = 15;
                initialCenter = specialLocations[cleanLocation].bounds.center;
            } else if (isNeighborhood(apiFormats.location.name)) {
                initialZoom = 15;
            }
        }

        // Create map
        const map = new google.maps.Map(mapContainer, {
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 9,
            maxZoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
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

        // Store markers for later reference
        window.mapMarkers = {};

        // Add markers for each listing
        listings.forEach(listing => {
            console.log('Processing listing:', listing.id); // Add this log
            if (listing.latitude && listing.longitude) {
                console.log('Listing has valid coordinates:', listing.id); // Add this log
                const lat = parseFloat(listing.latitude);
                const lng = parseFloat(listing.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    // Determine which price to show
                    let priceText;
                    if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                        // User has searched for specific dates - show total price
                        const totalPrice = listing.customDatesTotalPrice || 0;
                        priceText = `$${Math.ceil(totalPrice).toLocaleString()}`;
                    } else {
                        // Default dates - show nightly price
                        const nightlyPrice = listing.nightlyPrice || 0;
                        priceText = `$${nightlyPrice}`;
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
                            font-weight: 600;
                            color: #000;
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" 
                           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                            ${priceText}
                        </div>
                    `;

                    // Create the marker using AdvancedMarkerElement or fallback to OverlayView
                    let marker;

                    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                        console.log('Using AdvancedMarkerElement for marker:', listing.id);
                        // Use AdvancedMarkerElement (newer Google Maps API)
                        const markerDiv = document.createElement('div');
                        markerDiv.innerHTML = markerHTML;

                        // Add direct click handler to the div
                        markerDiv.firstElementChild.addEventListener('click', (e) => {
                            console.log('Direct click on marker div:', listing.id);
                        });

                        marker = new google.maps.marker.AdvancedMarkerElement({
                            position: { lat, lng },
                            map: map,
                            content: markerDiv.firstElementChild,
                            title: listing.property_name
                        });
                    } else {
                        console.log('Using CustomMarker (OverlayView) for marker:', listing.id);
                        // Fallback to custom overlay
                        class CustomMarker extends google.maps.OverlayView {
                            constructor(position, map, html, listing) { // Add listing parameter
                                super();
                                this.position = position;
                                this.html = html;
                                this.listing = listing; // Store listing data
                                this.setMap(map);
                            }

                            onAdd() {
                                console.log('CustomMarker onAdd called for listing:', this.listing.id);
                                this.div = document.createElement('div');
                                this.div.style.position = 'absolute';
                                this.div.innerHTML = this.html;

                                const panes = this.getPanes();
                                panes.overlayMouseTarget.appendChild(this.div);
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
                            map,
                            markerHTML,
                            listing // Pass the listing data
                        );
                    }

                    // Store marker with listing data
                    window.mapMarkers[listing.id] = marker;
                    marker.listingData = listing;

                    // For custom markers, add click handler after onAdd
                    const originalOnAdd = marker.onAdd;
                    marker.onAdd = function () {
                        originalOnAdd.call(this);

                        // Now add click handler
                        if (this.div) {
                            console.log('Adding click event listener to CustomMarker div');
                            this.div.firstElementChild.addEventListener('click', (e) => {
                                console.log('CustomMarker clicked:', this.listing.id);
                                e.stopPropagation();

                                // Close any existing overlay
                                if (window.currentListingOverlay) {
                                    window.currentListingOverlay.setMap(null);
                                    // Reset previous marker color
                                    const prevListingId = window.currentListingOverlay.listing.id;
                                    setMarkerBackgroundColor(prevListingId, 'white');
                                }

                                // Change marker background
                                setMarkerBackgroundColor(this.listing.id, '#9ecaff');

                                // Create and show listing card overlay
                                const position = new google.maps.LatLng(this.listing.latitude, this.listing.longitude);
                                window.currentListingOverlay = createListingCardOverlay(this.listing, position, map);
                            });
                        }
                    };
                }
            }
        });

        // SIMPLIFIED MAP AREA LOGIC
        let searchBounds = null; // The bounds of our current search results
        let isInitialLoad = true;
        let searchTimeout = null;
        let userHasInteracted = false; // Track if user has manually moved/zoomed the map

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

            // Check if current bounds are completely within search bounds
            return currentNE.lat() <= searchNE.lat() &&
                currentSW.lat() >= searchSW.lat() &&
                currentNE.lng() <= searchNE.lng() &&
                currentSW.lng() >= searchSW.lng();
        }

        // Function to check if user has moved outside search bounds (not just zoomed)
        function hasMovedOutsideSearchBounds(currentBounds, searchBounds) {
            if (!searchBounds) return true;

            const currentNE = currentBounds.getNorthEast();
            const currentSW = currentBounds.getSouthWest();
            const searchNE = searchBounds.getNorthEast();
            const searchSW = searchBounds.getSouthWest();

            // Check if any part of current view is outside the search bounds
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
            // Only set userHasInteracted if this isn't the initial load
            if (!isInitialLoad) {
                userHasInteracted = true;
            }
        });

        // Single idle listener with clear logic
        map.addListener('idle', () => {
            const currentBounds = map.getBounds();
            if (!currentBounds) return;

            // On initial load, set the search bounds and exit
            if (isInitialLoad) {
                searchBounds = currentBounds;
                isInitialLoad = false;
                hideMapSkeleton();
                return;
            }

            // Only proceed if user has actually interacted with the map
            if (!userHasInteracted) {
                // Just filter existing listings for programmatic map changes
                const visibleListings = filterListingsByBounds(window.allListings, currentBounds);
                renderListingCards(visibleListings, true);
                return;
            }

            // Check if user is within search bounds (just zooming)
            if (isWithinSearchBounds(currentBounds, searchBounds)) {
                // User is zooming within existing search area
                // Update to "Map area" since user has interacted with the map
                const locationButtonTextElement = document.querySelector('[data-element="navBarSearch_locationButton_text"]');
                if (locationButtonTextElement && currentSelections.location !== "Map area") {
                    updateButtonText(locationButtonTextElement, "Map area", defaultValues.location);
                    currentSelections.location = "Map area";
                    pendingSelections.location = "Map area";

                    // Update the bounds in apiFormats for search button functionality
                    updateCurrentMapBounds();
                }

                // Just filter existing listings, no new API call
                const visibleListings = filterListingsByBounds(window.allListings, currentBounds);
                renderListingCards(visibleListings, true);
                return;
            }

            // User has moved outside search bounds - need new search
            if (hasMovedOutsideSearchBounds(currentBounds, searchBounds)) {
                // Update location to "Map area"
                const locationButtonTextElement = document.querySelector('[data-element="navBarSearch_locationButton_text"]');
                if (locationButtonTextElement) {
                    updateButtonText(locationButtonTextElement, "Map area", defaultValues.location);
                    currentSelections.location = "Map area";
                    pendingSelections.location = "Map area";
                }

                // Update bounds in apiFormats
                updateCurrentMapBounds();

                // Clear existing timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                // Show skeleton and trigger new search after delay
                const skeleton = document.querySelector('[data-element="map_skeleton"]');
                if (skeleton) {
                    skeleton.setAttribute('data-show-time', Date.now().toString());
                    showMapSkeleton();
                }

                searchTimeout = setTimeout(() => {
                    fetchPropertySearchResults();
                }, 500);

                // Update search bounds to current bounds
                searchBounds = currentBounds;
            }

            // Update the filterListingsByBounds function call
            const visibleListings = filterListingsByBounds(window.allListings, currentBounds);
            const filteredVisibleListings = filterSystem ? filterSystem.applyFilters(visibleListings) : visibleListings;
            renderListingCards(filteredVisibleListings, true);
        });

        // Store map reference globally for search button access
        window.currentMap = map;

        // After creating markers, decide whether to fit to all bounds or preserve current view
        if (preserveBounds && userHasInteracted) {
            // If we have bounds to preserve and user has interacted with the map,
            // keep the current view
            map.setCenter(preserveBounds.getCenter());
            map.setZoom(map.getZoom());
        } else {
            // Otherwise fit to show all markers
            fitMapToBounds(map, listings);
        }

        // Update markers visibility for initial page
        updateMarkersVisibility(1);
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

    // Add this near the top of the file where other style elements are added
    const mapSkeletonStyle = document.createElement('style');
    mapSkeletonStyle.textContent = `
        [data-element="map_skeleton"] {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            pointer-events: none;
            z-index: 1;
            transition: opacity 0.2s ease-in-out;
        }

        [data-element="map_skeleton"].visible {
            opacity: 1;
        }
    `;
    document.head.appendChild(mapSkeletonStyle);

    // Add CSS for map listing card styling
    const mapListingCardStyle = document.createElement('style');
    mapListingCardStyle.textContent = `
    .map-listing-card:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
    }
    
    .map-listing-card .close-btn:hover {
        background-color: #f5f5f5 !important;
    }
    
    .map-card-splide .splide__arrow {
        background: white;
        opacity: 0.8;
        width: 32px;
        height: 32px;
    }
    
    .map-card-splide .splide__arrow:hover {
        opacity: 1;
    }
    
    .map-card-splide .splide__pagination__page {
        background: rgba(255, 255, 255, 0.5);
    }
    
    .map-card-splide .splide__pagination__page.is-active {
        background: white;
    }
    
    .map-listing-card .splide__arrow {
        position: absolute;
        z-index: 1000;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        padding: 8px;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .map-listing-card .splide__arrow:hover {
        background: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .map-listing-card .splide__arrow--prev {
        left: 10px;
    }

    .map-listing-card .splide__arrow--next {
        right: 10px;
    }
`;
    document.head.appendChild(mapListingCardStyle);

    // Add these utility functions for skeleton management
    function showMapSkeleton() {
        const skeleton = document.querySelector('[data-element="map_skeleton"]');
        if (skeleton) {
            skeleton.classList.add('visible');
        }
    }

    function hideMapSkeleton(minimumDelay = 1000) {
        const skeleton = document.querySelector('[data-element="map_skeleton"]');
        if (skeleton) {
            // Get the time the skeleton was shown
            const showTime = parseInt(skeleton.getAttribute('data-show-time') || '0');
            const currentTime = Date.now();
            const elapsedTime = currentTime - showTime;

            // Calculate remaining time to meet minimum delay
            const remainingDelay = Math.max(0, minimumDelay - elapsedTime);

            // Hide after remaining delay
            setTimeout(() => {
                skeleton.classList.remove('visible');
            }, remainingDelay);
        }
    }

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

    // ADD THIS: New function to update marker visibility based on current page
    function updateMarkersVisibility(page = currentPage) {
        if (!window.mapMarkers || !currentListings) return;

        // Calculate which listings should be visible on current page
        const startIndex = (page - 1) * listingsPerPage;
        const endIndex = startIndex + listingsPerPage;
        const visibleListingIds = currentListings.slice(startIndex, endIndex).map(listing => listing.id);

        // Update all markers visibility
        Object.entries(window.mapMarkers).forEach(([listingId, marker]) => {
            const shouldBeVisible = visibleListingIds.includes(parseInt(listingId));

            if (marker.setMap) {
                // AdvancedMarkerElement - show/hide by setting map
                marker.setMap(shouldBeVisible ? window.currentMap : null);
            } else if (marker.div) {
                // Custom overlay - show/hide via display style
                marker.div.style.display = shouldBeVisible ? 'block' : 'none';
            }
        });
    }

    // Call fetchPropertySearchResults on page load to display initial properties
    fetchPropertySearchResults()
        .then(results => {
            console.log('Initial property search loaded with default parameters');
        })
        .catch(error => {
            console.error('Error loading initial properties:', error);
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
                        border-radius: 10px;
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
                        
                        <div class="splide map-card-splide" style="height: 200px;">
                            <div class="splide__track">
                                <ul class="splide__list">
                                    ${this.listing._images && this.listing._images.length > 0 ?
                        this.listing._images.map(img =>
                            `<li class="splide__slide">
                                <img src="${img.property_image?.url || ''}" 
                                     alt="${this.listing.property_name}" 
                                     style="width: 100%; height: 200px; object-fit: cover;">
                            </li>`
                        ).join('') :
                        `<li class="splide__slide">
                            <img src="${this.listing.image_url || ''}" 
                                 alt="${this.listing.property_name}" 
                                 style="width: 100%; height: 200px; object-fit: cover;">
                        </li>`
                    }
                                </ul>
                            </div>
                            <div class="splide__arrows"></div>
                            <ul class="splide__pagination"></ul>
                        </div>
                        
                        <div style="padding: 8px 8px 12px 8px; display: flex; align-items: top; align-items: stretch; flex-direction: column; gap: 2px; margin-top: 0px; font-family: 'TT Fors', sans-serif;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0; line-height: 1;">
                                <h3 style="margin: 0; padding: 0; font-size: 15px; color: #000000; font-weight: 600; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; font-family: 'TT Fors', sans-serif; line-height: 1;">
                                    ${this.listing.property_name || 'Property'}
                                </h3>
                                <div style="display: flex; align-items: center; gap: 3px; font-family: 'TT Fors', sans-serif; line-height: 1; margin: 0; padding: 0;">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#000000" style="margin: 0; padding: 0; display: block;">
                                        <path d="M12 2l2.59 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.41-1.01L12 2z" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
                                    </svg>
                                    <span style="font-size: 15px; font-weight: 500; font-family: 'TT Fors', sans-serif; line-height: 1;">
                                        ${this.listing.review_average || 'New'}
                                    </span>
                                    ${this.listing.reviews_amount ?
                        `<span style="font-size: 15px; color: #000000; font-family: 'TT Fors', sans-serif; line-height: 1;">(${this.listing.reviews_amount})</span>` :
                        ''
                    }
                                </div>
                            </div>
                            
                            <p style="margin: 0; font-size: 15px; color: #000000; font-family: 'TT Fors', sans-serif;">
                                ${this.listing.listing_city_state || ''}
                            </p>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin: 0;">
                                <span style="font-size: 15px; color: #000000; font-family: 'TT Fors', sans-serif;">
                                    ${this.getDateRange()}
                                </span>
                                <span style="font-size: 15px; font-weight: 600; color: #000000; font-family: 'TT Fors', sans-serif;">
                                    ${this.getPrice()}
                                </span>
                            </div>
                        </div>
                    </div>
                `;

                this.div.innerHTML = cardHTML;

                // Add click handler to close button
                const closeBtn = this.div.querySelector('.close-btn');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setMap(null);
                    // Reset marker color
                    setMarkerBackgroundColor(this.listing.id, 'white');
                    // Clear the global reference
                    if (window.currentListingOverlay === this) {
                        window.currentListingOverlay = null;
                    }
                });

                // Add click handler to card for navigation
                const card = this.div.querySelector('.map-listing-card');

                // Add click handlers for slider navigation buttons
                const sliderNavButtons = card.querySelectorAll('.splide__arrow');
                sliderNavButtons.forEach(button => {
                    button.style.zIndex = '1000'; // Ensure buttons are above other content
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent click from bubbling to card
                    });
                });

                // Add click handler for the entire card
                card.addEventListener('click', (e) => {
                    // Don't navigate if clicking on slider navigation buttons
                    if (e.target.closest('.splide__arrow') || e.target.closest('.close-btn')) {
                        return;
                    }

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

                // Initialize Splide after adding to DOM
                setTimeout(() => {
                    const splideElement = this.div.querySelector('.map-card-splide');
                    if (splideElement && this.listing._images && this.listing._images.length > 1) {
                        const splide = new Splide(splideElement, {
                            type: 'loop',
                            height: '200px',
                            perPage: 1,
                            arrows: true,
                            pagination: true
                        });

                        // Add pagination dots limit
                        splide.on('pagination:mounted', function (data) {
                            // Limit the number of pagination dots to a maximum of 5
                            const maxDots = 5;

                            // Hide excess pagination dots beyond maxDots
                            data.items.forEach((item, i) => {
                                if (i >= maxDots) {
                                    item.li.style.display = 'none';
                                }
                            });
                        });

                        splide.on('move', function (newIndex) {
                            const maxDots = 5;

                            // Calculate which dot should be highlighted based on the current slide
                            const activeDotIndex = newIndex % maxDots;

                            // Get all pagination dots
                            const dots = splideElement.querySelectorAll('.splide__pagination__page');

                            // Remove active class from all dots
                            dots.forEach((dot) => {
                                dot.classList.remove('is-active');
                            });

                            // Add active class to the correct dot
                            if (dots[activeDotIndex]) {
                                dots[activeDotIndex].classList.add('is-active');
                            }
                        });

                        // Add click handlers to prevent map clicks
                        const arrows = splideElement.querySelectorAll('.splide__arrow');
                        const pagination = splideElement.querySelector('.splide__pagination');

                        arrows.forEach(arrow => {
                            arrow.addEventListener('click', (e) => {
                                e.stopPropagation();
                            });
                        });

                        if (pagination) {
                            pagination.addEventListener('click', (e) => {
                                e.stopPropagation();
                            });
                        }

                        splide.mount();
                    }
                }, 100);
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
                    return formatDateRange(this.listing.default_startDate, this.listing.default_endDate);
                }
            }

            getPrice() {
                let priceValue;
                if (apiFormats.dates.checkIn && apiFormats.dates.checkOut) {
                    priceValue = this.listing.customDatesTotalPrice;
                } else {
                    priceValue = this.listing.total_price;
                }

                if (priceValue) {
                    const formatted = priceValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    return `$${formatted}`;
                }
                return 'Price on request';
            }
        }

        return new ListingCardOverlay(listing, position);
    }



});
