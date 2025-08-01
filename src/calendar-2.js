// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// Add this at the top level of the file (outside any function)
let isSaving = false;

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


// Global variables
let currentView = 'pricing'; // 'pricing' or 'availability'
let selectedDates = [];
let selectedDateTypes = {};
let propertiesDataRef = null; // Add a global reference to property data


// Helper function to check if two dates are consecutive
function areDatesConsecutive(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.abs(date2 - date1) === oneDay;
}

document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.querySelector('[data-element="calendarLibraryContainer"]');

    // Show loader at the beginning
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
        loader.style.display = 'flex';
    }

    // Track loading state
    let isDataLoading = true;

    // Initialize variables for user and property data
    let userId = null;
    let propertyId = null; // We'll handle this later
    let calendarEvents = []; // This includes keys booking reservations and 3rd party reservations
    let calendar = null;
    let propertiesData = []; // Store all properties data
    let hostReservations = []; // Store host reservations data

    // Initialize all toolbar elements to be hidden by default
    const initializeToolbar = document.querySelector('[data-element="toolbar"]');
    if (initializeToolbar) {
        initializeToolbar.style.display = 'flex';
    }

    // Set display:none for all toolbar elements
    const toolbarElements = [
        document.querySelector('[data-element="toolbarEdit_basePrice"]'),
        document.querySelector('[data-element="toolbarEdit_cleaningFee"]'),
        document.querySelector('[data-element="toolbarEdit_tripLength"]'),
        document.querySelector('[data-element="toolbarEdit_advanceNotice"]'),
        document.querySelector('[data-element="toolbarEdit_availabilityWindow"]'),
        document.querySelector('[data-element="toolbarEdit_customDates"]'),
        document.querySelector('[data-element="toolbarEdit_connectCalendar"]')
    ];

    toolbarElements.forEach(element => {
        if (element) {
            element.style.display = 'none';
        }
    });

    // Get user ID from Wized
    window.Wized = window.Wized || [];
    window.Wized.push((async (Wized) => {
        try {
            await Wized.requests.waitFor('Load_user');
            userId = Wized.data.r.Load_user.data.id;

            // Fetch host reservations data
            await fetchHostReservations();

            // Fetch calendar data once we have the user ID
            fetchCalendarData();
        } catch (error) {
            isDataLoading = false;
            initializeCalendar(); // Initialize calendar even if there's an error
            hideLoaderIfReady();
        }
    }));

    // Track key elements that need to be populated before we hide loader
    let allContentLoaded = false;

    // Function to hide loader if all data is ready
    function hideLoaderIfReady() {
        if (!isDataLoading && loader) {
            // Use a much longer delay to ensure everything is fully rendered
            setTimeout(() => {
                // Before hiding, verify that key elements have content
                verifyContentLoaded(() => {
                    loader.style.display = 'none';
                });
            }, 1500); // Increase to 1.5 seconds to ensure DOM is fully rendered
        }
    }

    // Function to verify essential content has been loaded
    function verifyContentLoaded(callback) {
        // Check if we already verified content is loaded
        if (allContentLoaded) {
            callback();
            return;
        }

        // Create a list of key elements that must have content before we hide loader
        const keyElements = [
            // Current property/listing name element
            document.querySelector('[data-element="currentListingName"]'),
            // Check if calendar has any visible events
            document.querySelector('.fc-event'),
            // Calendar month titles should be populated
            document.querySelector('.fc-multimonth-title')
        ];

        // Check for property data in calendar events
        const hasCalendarData = calendarEvents && calendarEvents.length > 0;

        // Check calendar has been rendered properly
        const calendarRendered = document.querySelector('.fc-view-harness') &&
            document.querySelector('.fc-daygrid-body');

        // Verify all key elements have content and calendar data is present
        const allElementsPopulated = keyElements.every(el => el && (el.textContent || el.innerText));

        if (hasCalendarData && calendarRendered && allElementsPopulated) {
            allContentLoaded = true;
            callback();
        } else {
            // If content is not ready yet, check again after a short delay
            setTimeout(() => verifyContentLoaded(callback), 300);
        }
    }

    // Function to fetch host reservations
    async function fetchHostReservations() {
        if (!userId) return;

        try {
            const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/host_reservations?host_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                window.location.href = '/host/dashboard';
            }

            hostReservations = await response.json();
        } catch (error) {
            console.error('Error fetching host reservations:', error);
        }
    }

    // Function to fetch calendar data from API
    async function fetchCalendarData(selectedPropertyId = null) {
        if (!userId) {
            isDataLoading = false;
            initializeCalendar(); //This may be able to be deleted
            hideLoaderIfReady();
            return;
        }

        // Clear any selected dates when switching properties
        if (selectedPropertyId) {
            // Check if we're coming from a calendar connection save
            const isCalendarConnection = sessionStorage.getItem('calendarConnectionInProgress') === 'true';
            clearDateSelections({ showMainToolbar: !isCalendarConnection });
        }

        let apiUrl = `https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/host_property_calendar?user_id=${userId}`;

        if (selectedPropertyId) {
            propertyId = selectedPropertyId;
            apiUrl += `&property_id=${propertyId}`;
        } else if (propertyId) {
            apiUrl += `&property_id=${propertyId}`;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                window.location.href = '/host/dashboard';
                //throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Store properties data
            if (data.properties && data.properties.length > 0) {
                propertiesData = data.properties;

                // Find the current property data based on propertyId
                const currentProperty = data.properties.find(property =>
                    property.id.toString() === propertyId?.toString()
                ) || data.properties[0];

                // Update the current listing name in the UI
                updateCurrentListingName(currentProperty.property_name);

                // Setup property listing block click handler
                setupListingBlockHandler();

                // Setup toolbar with property data
                setupToolbar(currentProperty);
            }

            processCalendarData(data);
            isDataLoading = false;
            initializeCalendar();
            hideLoaderIfReady();
            // After calendar data is loaded, hide months beyond 2 years
            setTimeout(hideMonthsBeyondTwoYears, 100);
        } catch (error) {
            isDataLoading = false;
            initializeCalendar(); // Initialize calendar even if there's an error
            hideLoaderIfReady();
        }
    }
    // Setup edit dates functionality
    function setupEditDatesFeature(propertyId, propertiesData) {
        // Store property data in global reference for use in other functions
        propertiesDataRef = propertiesData;

        const editDatesLink = document.querySelector('[data-element="toolbarEdit_customDates_headerText_editDates"]');
        const bodyContainer = document.querySelector('[data-element="toolbarEdit_customDates_bodyContainer"]');
        const editDatesContainer = document.querySelector('[data-element="toolbarEdit_customDates_editDates"]');
        const startDateContainer = document.querySelector('[data-element="toolbarEdit_customDates_editDates_startDateContainer"]');
        const endDateContainer = document.querySelector('[data-element="toolbarEdit_customDates_editDates_endDateContainer"]');
        const startDateText = document.querySelector('[data-element="toolbarEdit_customDates_editDates_startDateContainer_text"]');
        const endDateText = document.querySelector('[data-element="toolbarEdit_customDates_editDates_endDateContainer_text"]');
        const submitButton = document.querySelector('[data-element="toolbarEdit_customDates_editDates_submit"]');
        const cancelButton = document.querySelector('[data-element="toolbarEdit_customDates_editDates_cancel"]');
        const customDatesText = document.querySelector('[data-element="toolbarEdit_customDates_headerText"]');
        const exitButton = document.querySelector('[data-element="toolbarEdit_customDates_exit"]');
        const priceInput = document.querySelector('[data-element="toolbarEdit_customDates_price_input"]');
        const saveButton = document.querySelector('[data-element="toolbarEdit_customDates_saveButton"]');
        const saveButtonText = document.querySelector('[data-element="toolbarEdit_customDates_saveButtonText"]');
        const saveButtonLoader = document.querySelector('[data-element="toolbarEdit_customDates_saveButtonLoader"]');
        const pricingToggle = document.querySelector('[data-element="toolbarEdit_customDates_pricing_toggle"]');
        const availabilityToggle = document.querySelector('[data-element="toolbarEdit_customDates_availability_toggle"]');
        const priceContainer = document.querySelector('[data-element="toolbarEdit_customDates_priceContainer"]');
        const availabilityContainer = document.querySelector('[data-element="toolbarEdit_customDates_availabilityContainer"]');

        // Hide edit dates container by default
        if (editDatesContainer) {
            editDatesContainer.style.display = 'none';
        }

        if (saveButtonLoader) {
            saveButtonLoader.style.display = 'none';
        }

        // Set pricing toggle as default selected and initialize view
        switchView('pricing');

        // Setup toggle functionality
        if (pricingToggle && availabilityToggle) {
            pricingToggle.addEventListener('click', function () {
                switchView('pricing');
            });

            availabilityToggle.addEventListener('click', function () {
                switchView('availability');
            });
        }

        // Setup price input functionality
        if (priceInput) {
            // Set initial value
            if (priceInput.value === '') {
                priceInput.value = '$';
            }

            // Handle focus event
            priceInput.addEventListener('focus', function () {
                // If it's a price range, show only the min price when focused
                if (priceInput.value.includes('-') && priceInput.dataset.minPrice) {
                    priceInput.value = `$${priceInput.dataset.minPrice}`;
                }

                // Position cursor at the end
                const valueLength = priceInput.value.length;
                setTimeout(() => {
                    priceInput.setSelectionRange(valueLength, valueLength);
                }, 0);
            });

            // Handle input event
            priceInput.addEventListener('input', function (e) {
                const cursorPosition = priceInput.selectionStart;
                let value = priceInput.value;

                // Ensure the $ is always present at the beginning
                if (!value.startsWith('$')) {
                    value = '$' + value;
                }

                // Remove any non-digit characters except the $ at the beginning
                value = '$' + value.substring(1).replace(/\D/g, '');

                // Update the input value
                priceInput.value = value;

                // Adjust cursor position if needed
                const newCursorPosition = Math.max(1, Math.min(cursorPosition, value.length));
                priceInput.setSelectionRange(newCursorPosition, newCursorPosition);
            });

            // Prevent deletion of the $ sign
            priceInput.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    const cursorPosition = priceInput.selectionStart;
                    const selectionLength = priceInput.selectionEnd - priceInput.selectionStart;

                    // Prevent deletion if it would remove the $ sign
                    if ((cursorPosition <= 1 && e.key === 'Backspace') ||
                        (cursorPosition === 0 && e.key === 'Delete') ||
                        (selectionLength > 0 && priceInput.selectionStart === 0)) {
                        e.preventDefault();
                    }
                }
            });
        }

        // Setup save button functionality
        if (saveButton) {
            saveButton.addEventListener('click', async function () {
                // Check if we're already processing a save
                if (isSaving) {
                    console.log('Save already in progress, ignoring duplicate request');
                    return;
                }

                // Set flag to prevent duplicate saves
                isSaving = true;

                // Original pricing logic
                if (currentView === 'pricing') {
                    // Original pricing logic
                    if (!priceInput || selectedDates.length === 0) return;

                    // Get the price value (remove $ sign)
                    const priceValue = parseInt(priceInput.value.substring(1));

                    if (isNaN(priceValue) || priceValue <= 0) {
                        alert('Please enter a valid price');
                        return;
                    }

                    // Prepare data for API request - using numerically indexed array
                    const datesArray = [];
                    for (let i = 0; i < selectedDates.length; i++) {
                        datesArray.push({
                            Date: selectedDates[i]
                        });
                    }

                    // Show loader and hide text when making the request
                    if (saveButtonText) saveButtonText.style.display = 'none';
                    if (saveButtonLoader) saveButtonLoader.style.display = 'flex';

                    if (isNaN(propertyId) || !propertyId) {
                        alert('Property ID not found. Please refresh the page and try again.');
                        // Hide loader and show text again
                        if (saveButtonText) saveButtonText.style.display = 'block';
                        if (saveButtonLoader) saveButtonLoader.style.display = 'none';
                        return;
                    }

                    // Send the API request to update custom prices
                    fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_customPrice', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            property_id: propertyId,
                            customPrice: priceValue,
                            dates: datesArray
                        })
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Hide loader and show text again
                            if (saveButtonText) saveButtonText.style.display = 'block';
                            if (saveButtonLoader) saveButtonLoader.style.display = 'none';
                            exitCustomDatesToolbar();

                            // Refresh calendar data after successful update
                            fetchCalendarData(propertyId);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Failed to update prices. Please try again.');
                            // Hide loader and show text again
                            if (saveButtonText) saveButtonText.style.display = 'block';
                            if (saveButtonLoader) saveButtonLoader.style.display = 'none';
                        });
                } else {
                    // Availability view logic
                    // Show loader and hide text
                    if (saveButtonText) saveButtonText.style.display = 'none';
                    if (saveButtonLoader) saveButtonLoader.style.display = 'flex';

                    try {
                        // Only proceed if checkboxes are selected
                        if (window.checkedOpenRanges.length > 0 || window.checkedBlockedRanges.length > 0) {
                            // Prepare data arrays for API
                            const openDates = [];
                            const blockedDates = [];

                            // Process open ranges (dates to be made available)
                            window.checkedOpenRanges.forEach(item => {
                                const startDate = item.dateRange.startDate;
                                const endDate = item.dateRange.endDate;
                                const minNights = item.minNights;

                                // Add all dates in this range
                                const currentDate = new Date(startDate);
                                while (currentDate <= endDate) {
                                    openDates.push({
                                        Date: formatDateYYYYMMDD(currentDate),
                                        minNights: minNights
                                    });
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                            });

                            // Process blocked ranges (dates to be blocked)
                            window.checkedBlockedRanges.forEach(item => {
                                const startDate = item.dateRange.startDate;
                                const endDate = item.dateRange.endDate;

                                // Add all dates in this range
                                const currentDate = new Date(startDate);
                                while (currentDate <= endDate) {
                                    blockedDates.push({
                                        Date: formatDateYYYYMMDD(currentDate)
                                    });
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                            });

                            console.log('openDates', openDates);
                            console.log('blockedDates', blockedDates);

                            // First API call - update availability
                            if (openDates.length > 0 || blockedDates.length > 0) {
                                const availabilityResponse = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_customAvailability', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        property_id: propertyId,
                                        openDates: openDates,
                                        blockedDates: blockedDates
                                    })
                                });

                                if (!availabilityResponse.ok) {
                                    throw new Error('Failed to update availability');
                                }
                                await availabilityResponse.json();
                            }

                            // Process blocked date ranges for second API call
                            console.log('Initial blockedDateRanges at save time:', window.blockedDateRanges);
                            // Use the globally stored ranges
                            let blockedDateRanges = window.blockedDateRanges || [];

                            // Initialize new ranges to add
                            let newBlockedRanges = [];

                            // Add user-selected blocked dates to the array
                            if (window.checkedBlockedRanges && window.checkedBlockedRanges.length > 0) {
                                window.checkedBlockedRanges.forEach(item => {
                                    const startDate = formatDateYYYYMMDD(item.dateRange.startDate);
                                    const endDate = formatDateYYYYMMDD(item.dateRange.endDate);
                                    newBlockedRanges.push({
                                        range_start: startDate,
                                        range_end: endDate
                                    });
                                });
                            }

                            // Process dates to be made available (unblocked)
                            if (window.checkedOpenRanges && window.checkedOpenRanges.length > 0) {
                                // Convert ranges to individual dates for easier filtering
                                const datesToRemove = new Set();
                                window.checkedOpenRanges.forEach(item => {
                                    const start = item.dateRange.startDate;
                                    const end = item.dateRange.endDate;

                                    // Add all dates in the range to the set
                                    const currentDate = new Date(start);
                                    while (currentDate <= end) {
                                        datesToRemove.add(formatDateYYYYMMDD(currentDate));
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }
                                });

                                // Remove these dates from existing blocked dates
                                const remainingBlockedDates = [];
                                blockedDateRanges.forEach(range => {
                                    const start = new Date(range.range_start);
                                    const end = new Date(range.range_end);

                                    // Check all dates in the range
                                    const currentDate = new Date(start);
                                    while (currentDate <= end) {
                                        const dateStr = formatDateYYYYMMDD(currentDate);
                                        if (!datesToRemove.has(dateStr)) {
                                            remainingBlockedDates.push(dateStr);
                                        }
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }
                                });

                                // Convert remaining dates back to ranges
                                const sortedDates = remainingBlockedDates.sort();
                                blockedDateRanges = convertToDateRanges(sortedDates);
                            }

                            // Add new blocked ranges
                            blockedDateRanges = [...blockedDateRanges, ...newBlockedRanges];
                            console.log('Combined blocked date ranges:', blockedDateRanges);

                            // Merge adjacent ranges
                            blockedDateRanges = mergeAdjacentRanges(blockedDateRanges);
                            console.log('Final merged blocked date ranges:', blockedDateRanges);

                            // Second API call - update blocked dates
                            const blockedResponse = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/blocked_dates', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    property_id: propertyId,
                                    dateRanges: blockedDateRanges
                                })
                            });

                            if (!blockedResponse.ok) {
                                throw new Error('Failed to update blocked dates');
                            }

                            const blockedResult = await blockedResponse.json();
                            console.log('Blocked dates updated successfully:', blockedResult);
                        } else {
                            console.log('No checkboxes selected, skipping API calls');
                        }

                        // Refresh calendar data only once after all API calls
                        await fetchCalendarData(propertyId);

                        // Hide loader and show text again
                        if (saveButtonText) saveButtonText.style.display = 'block';
                        if (saveButtonLoader) saveButtonLoader.style.display = 'none';

                        // Exit toolbar only after all operations are complete
                        exitCustomDatesToolbar();
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to update availability. Please try again.');
                        // Hide loader and show text again
                        if (saveButtonText) saveButtonText.style.display = 'block';
                        if (saveButtonLoader) saveButtonLoader.style.display = 'none';
                    } finally {
                        // Reset the saving flag so future saves can proceed
                        isSaving = false;
                    }
                }

                // Reset the saving flag when price view completes too
                if (currentView === 'pricing') {
                    isSaving = false;
                }
            });
        }

        // Variables to store selected dates
        let selectedStartDate = null;
        let selectedEndDate = null;



        // Create input fields for date entry
        function createDateInput(container, isStartDate) {
            // Clear existing content
            if (container) {
                // Keep the original text element but hide it
                const textElement = isStartDate ? startDateText : endDateText;
                if (textElement) {
                    textElement.style.display = 'none';
                }

                // Create input field
                const dateInput = document.createElement('input');
                dateInput.type = 'text';
                dateInput.placeholder = 'MM/DD/YYYY';
                dateInput.className = 'date-input';
                dateInput.id = isStartDate ? 'start-date-input' : 'end-date-input';

                // Style the input
                dateInput.style.width = '100%';
                dateInput.style.fontFamily = "'TT Fors', sans-serif";
                dateInput.style.fontSize = '17px';
                dateInput.style.color = '#000';
                dateInput.style.border = '1px solid transparent';
                dateInput.style.padding = '0';

                // Add event listeners
                dateInput.addEventListener('blur', function () {
                    // Only validate if there's content
                    if (dateInput.value.trim() !== '') {
                        validateDateInput(dateInput, isStartDate);
                    } else {
                        // Just remove the input and show the text
                        if (textElement) {
                            textElement.style.display = 'block';
                        }
                        dateInput.remove();
                    }
                });

                dateInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        if (dateInput.value.trim() !== '') {
                            validateDateInput(dateInput, isStartDate);
                        } else {
                            // Just remove the input and show the text
                            if (textElement) {
                                textElement.style.display = 'block';
                            }
                            dateInput.remove();
                        }
                    }
                });

                // Add smart input masking for MM/DD/YYYY format
                dateInput.addEventListener('input', function (e) {
                    const input = e.target;
                    const originalValue = input.value;
                    const originalSelectionStart = input.selectionStart;

                    // Remove non-digits
                    let value = originalValue.replace(/\D/g, '');
                    let formattedValue = '';
                    let cursorOffset = 0;

                    // Format as MM/DD/YYYY
                    if (value.length > 0) {
                        // Month part (first 2 digits)
                        if (value.length >= 1) {
                            let month = value.substring(0, 2);
                            const monthInt = parseInt(month);

                            // Handle single digit month with special cases
                            if (value.length === 1) {
                                if (monthInt > 1) {
                                    month = '0' + month;
                                    cursorOffset += 1;
                                    // Add slash after auto-formatted month
                                    formattedValue += month + '/';
                                    cursorOffset += 1;
                                } else {
                                    formattedValue += month;
                                }
                            } else {
                                // Validate month range (01-12)
                                if (monthInt > 12) {
                                    month = '12';
                                } else if (monthInt === 0) {
                                    month = '01';
                                }
                                formattedValue += month;

                                // Add slash after month if we have 2 digits
                                formattedValue += '/';
                                // If user just typed the second digit of month, add slash and adjust cursor
                                if (value.length === 2 && originalValue.length < formattedValue.length) {
                                    cursorOffset += 1;
                                }
                            }
                        }

                        // Day part (next 2 digits)
                        if (value.length > 2) {
                            let day = value.substring(2, 4);
                            const dayInt = parseInt(day);

                            // Handle single digit day with special cases
                            if (value.length === 3) {
                                if (dayInt > 3) {
                                    day = '0' + day;
                                    cursorOffset += 1;
                                    // Add slash after auto-formatted day
                                    formattedValue += day + '/';
                                    cursorOffset += 1;
                                } else {
                                    formattedValue += day;
                                }
                            } else if (value.length >= 4) {
                                // Validate day range (01-31)
                                if (dayInt > 31) {
                                    day = '31';
                                } else if (dayInt === 0) {
                                    day = '01';
                                }
                                formattedValue += day;

                                // Add slash after day if we have 4 digits
                                formattedValue += '/';
                                // If user just typed the second digit of day, add slash and adjust cursor
                                if (value.length === 4 && originalValue.length < formattedValue.length) {
                                    cursorOffset += 1;
                                }
                            }
                        }

                        // Year part (last 4 digits)
                        if (value.length > 4) {
                            formattedValue += value.substring(4, 8);
                        }
                    }

                    // Update input value if it changed
                    if (formattedValue !== originalValue) {
                        input.value = formattedValue;

                        // Calculate new cursor position
                        const newPosition = originalSelectionStart + cursorOffset;
                        input.setSelectionRange(newPosition, newPosition);
                    }
                });

                // Handle delete key to properly handle slashes
                dateInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        const input = e.target;
                        const cursorPos = input.selectionStart;

                        // If cursor is right after a slash, delete both the slash and the character before it
                        if ((e.key === 'Backspace' && cursorPos > 0 && input.value.charAt(cursorPos - 1) === '/') ||
                            (e.key === 'Delete' && cursorPos < input.value.length && input.value.charAt(cursorPos) === '/')) {

                            e.preventDefault();

                            // Create new value without the slash and the digit
                            let newValue;
                            if (e.key === 'Backspace') {
                                // Remove the slash and the character before it
                                newValue = input.value.substring(0, cursorPos - 2) + input.value.substring(cursorPos);
                                input.value = newValue;
                                input.setSelectionRange(cursorPos - 2, cursorPos - 2);
                            } else { // Delete key
                                // Remove the slash and the character after it
                                newValue = input.value.substring(0, cursorPos) + input.value.substring(cursorPos + 2);
                                input.value = newValue;
                                input.setSelectionRange(cursorPos, cursorPos);
                            }
                        }
                    }
                });

                container.appendChild(dateInput);

                // Focus the input
                dateInput.focus();
            }
        }

        // Validate date input
        function validateDateInput(inputElement, isStartDate) {
            const dateValue = inputElement.value;
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

            if (!dateRegex.test(dateValue)) {
                // Don't show alert on blur, only when submitting
                if (textElement = isStartDate ? startDateText : endDateText) {
                    textElement.style.display = 'block';
                }
                inputElement.remove();
                return false;
            }

            const matches = dateValue.match(dateRegex);
            const month = parseInt(matches[1], 10) - 1; // 0-based month
            const day = parseInt(matches[2], 10);
            const year = parseInt(matches[3], 10);

            const selectedDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Basic validation
            if (selectedDate < today) {
                // Don't show alert on blur, only when submitting
                if (textElement = isStartDate ? startDateText : endDateText) {
                    textElement.style.display = 'block';
                }
                inputElement.remove();
                return false;
            }

            if (isStartDate) {
                // For start date
                if (selectedEndDate && selectedDate >= selectedEndDate) {
                    // Don't show alert on blur, only when submitting
                    if (startDateText) {
                        startDateText.style.display = 'block';
                    }
                    inputElement.remove();
                    return false;
                }

                selectedStartDate = selectedDate;
                if (startDateText) {
                    startDateText.textContent = formatDateForDisplay(selectedDate);
                    startDateText.style.display = 'block';
                }

                // Remove the input field
                inputElement.remove();
                return true;
            } else {
                // For end date
                if (!selectedStartDate) {
                    // Don't show alert on blur, only when submitting
                    if (endDateText) {
                        endDateText.style.display = 'block';
                    }
                    inputElement.remove();
                    return false;
                }

                if (selectedDate <= selectedStartDate) {
                    // Don't show alert on blur, only when submitting
                    if (endDateText) {
                        endDateText.style.display = 'block';
                    }
                    inputElement.remove();
                    return false;
                }

                selectedEndDate = selectedDate;
                if (endDateText) {
                    endDateText.textContent = formatDateForDisplay(selectedDate);
                    endDateText.style.display = 'block';
                }

                // Remove the input field
                inputElement.remove();
                return true;
            }
        }

        // Format date for display
        function formatDateForDisplay(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }

        // Validate date range to ensure no reservations or reserved dates are in the range
        function validateDateRange(startDate, endDate) {
            // Convert to date objects if they're not already
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            const end = endDate instanceof Date ? endDate : new Date(endDate);

            // Check each day in the range
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];

                // Find event for this date
                const eventOnDate = calendarEvents.find(event => {
                    // Extract date parts directly from ISO string to avoid timezone issues
                    const eventDateStr = typeof event.start === 'string'
                        ? event.start.split('T')[0] // Get YYYY-MM-DD part if it's a string
                        : event.start.toISOString().split('T')[0]; // Convert to ISO string first if it's a Date

                    const currentDateStr = currentDate.toISOString().split('T')[0];
                    return eventDateStr === currentDateStr;
                });

                // Check if event type is reservation or reserved
                if (eventOnDate && (eventOnDate.extendedProps.type === 'reservation' ||
                    eventOnDate.extendedProps.type === 'reserved')) {
                    return {
                        valid: false,
                        message: `Cannot select date range containing reservations: ${formatDateForDisplay(currentDate)} contains a reservation. Please select dates that don't overlap with existing reservations.`
                    };
                }

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            return { valid: true };
        }

        // Function to apply the selected date range
        function applyDateRange() {
            if (!selectedStartDate || !selectedEndDate) {
                alert('Please select both start and end dates');
                return;
            }

            // Validate the date range
            const validation = validateDateRange(selectedStartDate, selectedEndDate);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }

            // Clear previous selections
            selectedDates = [];

            // Remove selected-day class from all date elements first
            const selectedDayElements = document.querySelectorAll('.selected-day');
            selectedDayElements.forEach(el => {
                el.classList.remove('selected-day');
            });

            // Add all dates in the range to selectedDates
            const currentDate = new Date(selectedStartDate);
            while (currentDate <= selectedEndDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                selectedDates.push(dateStr);

                // Add selected styling to the day
                const dateElement = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);
                if (dateElement) {
                    dateElement.classList.add('selected-day');
                }

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Update the custom dates text
            updateCustomDatesText();

            // Hide edit dates container and show body container
            if (editDatesContainer) editDatesContainer.style.display = 'none';
            if (bodyContainer) bodyContainer.style.display = 'flex';

            // Switch back to pricing view when new dates are selected
            if (pricingToggle && availabilityToggle) {
                pricingToggle.classList.add('selected');
                availabilityToggle.classList.remove('selected');
                if (priceContainer) priceContainer.style.display = 'flex';
                if (availabilityContainer) availabilityContainer.style.display = 'none';
            }
        }

        // Function to exit custom dates toolbar and return to regular toolbar
        function exitCustomDatesToolbar() {
            const toolbar = document.querySelector('[data-element="toolbar"]');
            const customDates = document.querySelector('[data-element="toolbarEdit_customDates"]');

            if (!toolbar || !customDates) {
                return;
            }

            // Clear all selected dates
            selectedDates = [];

            // Remove selected-day class from all date elements
            const selectedDayElements = document.querySelectorAll('.selected-day');
            selectedDayElements.forEach(el => {
                el.classList.remove('selected-day');
            });

            // Hide custom dates toolbar and show regular toolbar
            customDates.style.display = 'none';
            toolbar.style.display = 'flex';
            console.log('TOOLBAR SET TO FLEX: exitCustomDatesToolbar function');
        }

        // Add event listeners
        if (editDatesLink) {
            editDatesLink.addEventListener('click', function () {
                if (bodyContainer) bodyContainer.style.display = 'none';
                if (editDatesContainer) editDatesContainer.style.display = 'flex';

                // Temporarily change the customDatesText to "Select Dates"
                if (customDatesText) {
                    customDatesText.textContent = "Select Dates";
                }

                // Reset date selections
                selectedStartDate = null;
                selectedEndDate = null;
                if (startDateText) startDateText.textContent = 'Select Start Date';
                if (endDateText) endDateText.textContent = 'Select End Date';

                // Remove any existing input fields
                const existingInputs = document.querySelectorAll('.date-input');
                existingInputs.forEach(input => input.remove());

                // Show the text elements
                if (startDateText) startDateText.style.display = 'block';
                if (endDateText) endDateText.style.display = 'block';
            });
        }

        // Add event listener for exit button
        if (exitButton) {
            exitButton.addEventListener('click', exitCustomDatesToolbar);
        }

        if (startDateContainer) {
            startDateContainer.addEventListener('click', function () {
                // Only create input if not already present
                if (!document.getElementById('start-date-input')) {
                    createDateInput(startDateContainer, true);
                }
            });
        }

        if (endDateContainer) {
            endDateContainer.addEventListener('click', function () {
                // Only create input if not already present and start date is selected
                if (!document.getElementById('end-date-input') && selectedStartDate) {
                    createDateInput(endDateContainer, false);
                } else if (!selectedStartDate) {
                    alert('Please select a start date first');
                }
            });
        }

        if (submitButton) {
            submitButton.addEventListener('click', function () {
                // Check if there are any active inputs that need validation
                const startInput = document.getElementById('start-date-input');
                const endInput = document.getElementById('end-date-input');

                if (startInput) {
                    if (!validateDateInput(startInput, true)) {
                        const dateValue = startInput.value;
                        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

                        if (!dateRegex.test(dateValue)) {
                            alert('Please enter a valid start date in MM/DD/YYYY format');
                        } else {
                            const matches = dateValue.match(dateRegex);
                            const month = parseInt(matches[1], 10) - 1;
                            const day = parseInt(matches[2], 10);
                            const year = parseInt(matches[3], 10);
                            const selectedDate = new Date(year, month, day);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (selectedDate < today) {
                                alert('Start date cannot be in the past');
                            } else if (selectedEndDate && selectedDate >= selectedEndDate) {
                                alert('Start date must be before the end date');
                            }
                        }
                        return;
                    }
                }

                if (endInput) {
                    if (!validateDateInput(endInput, false)) {
                        const dateValue = endInput.value;
                        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

                        if (!dateRegex.test(dateValue)) {
                            alert('Please enter a valid end date in MM/DD/YYYY format');
                        } else {
                            const matches = dateValue.match(dateRegex);
                            const month = parseInt(matches[1], 10) - 1;
                            const day = parseInt(matches[2], 10);
                            const year = parseInt(matches[3], 10);
                            const selectedDate = new Date(year, month, day);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (selectedDate < today) {
                                alert('End date cannot be in the past');
                            } else if (!selectedStartDate) {
                                alert('Please select a start date first');
                            } else if (selectedDate <= selectedStartDate) {
                                alert('End date must be after the start date');
                            }
                        }
                        return;
                    }
                }

                // Check if the selected date range contains any reservation or reserved dates
                if (selectedStartDate && selectedEndDate) {
                    const validation = validateDateRange(selectedStartDate, selectedEndDate);
                    if (!validation.valid) {
                        alert(validation.message);
                        return;
                    }
                }

                applyDateRange();
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', function () {
                // Hide edit dates container and show body container
                if (editDatesContainer) editDatesContainer.style.display = 'none';
                if (bodyContainer) bodyContainer.style.display = 'flex';

                // Remove any existing input fields
                const existingInputs = document.querySelectorAll('.date-input');
                existingInputs.forEach(input => input.remove());

                // Show the text elements
                if (startDateText) startDateText.style.display = 'block';
                if (endDateText) endDateText.style.display = 'block';

                // Restore the customDatesText by calling updateCustomDatesText
                updateCustomDatesText();
            });
        }
    }



    // Process the API response data into calendar events
    function processCalendarData(data) {
        // Reset content loaded flag whenever processing new data
        allContentLoaded = false;

        calendarEvents = [];

        // Process reservations if they exist
        if (data.reservations && data.reservations.length > 0) {
            data.reservations.forEach((reservation) => {

                // Create an event for each reservation
                const checkInDate = reservation.check_in;
                const checkOutDate = reservation.check_out;

                // Calculate payout amount
                const payoutAmount = (reservation.nights_amount + reservation.cleaning_amount - reservation.hostFee_amount).toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                // Format guest information
                let guestInfo = reservation._user_1.First_Name;
                // Only show "+ X guests" if there are additional guests (more than 1 total)
                if (reservation.guests > 1) {
                    const additionalGuests = reservation.guests - 1;
                    guestInfo += ` + ${additionalGuests} guest${additionalGuests > 1 ? 's' : ''}`;
                }

                // Format the title with guest info and payout amount
                const title = `${guestInfo} • $${payoutAmount}`;

                // Fix: Use the checkout date directly instead of manipulating the date object
                // This ensures the event ends on the day before checkout (as the last night)
                calendarEvents.push({
                    id: reservation.id, // Add reservation ID to the event
                    title: title,
                    start: checkInDate,
                    end: checkOutDate, // Use checkout date directly - FullCalendar treats end dates as exclusive
                    backgroundColor: '#9ecaff',
                    borderColor: '#9ecaff',
                    textColor: '#000000',
                    allDay: true,
                    display: 'block', // Ensure the event displays as a block across multiple days
                    classNames: ['multi-day-reservation'], // Add a class for custom styling
                    extendedProps: {
                        type: 'reservation',
                        reservationId: reservation.id,
                        reservationCode: reservation.reservation_code,
                        nights: reservation.nights,
                        guests: reservation.guests
                    }
                });
            });
        }

        // Find the current property data based on propertyId
        const currentProperty = data.properties && data.properties.length > 0 ?
            data.properties.find(property => property.id.toString() === propertyId?.toString()) || data.properties[0] : null;

        // Get minimum nights requirement if available
        const minNights = currentProperty?.min_nights || 1;

        // Process property calendar data to identify unavailable dates
        if (data.property_calendar && data.property_calendar.length > 0) {
            data.property_calendar.forEach(day => {
                if (day.status === 'reserved' && day.isKeysBooking_reservation != true) {
                    calendarEvents.push({
                        title: day.price ? `$${day.price}` : 'Reserved',
                        start: day.date,
                        allDay: true,
                        display: 'background',
                        backgroundColor: '#d0d0d0',
                        borderColor: '#d0d0d0',
                        textColor: '#000000',
                        extendedProps: {
                            type: 'reserved',
                            price: day.price,
                            reservationArrivalDate: day.reservation_arrivalDate
                        },
                        classNames: ['reserved-day']
                    });
                } else if (day.status === 'blocked') {
                    calendarEvents.push({
                        title: day.price ? `$${day.price}` : 'Blocked',
                        start: day.date,
                        allDay: true,
                        display: 'background',
                        backgroundColor: '#d0d0d0',
                        borderColor: '#d0d0d0',
                        textColor: '#000000',
                        extendedProps: {
                            type: 'blocked',
                            price: day.price
                        }
                    });
                } else if (day.status === 'available') {
                    console.log('day.status', day.date);
                    calendarEvents.push({
                        title: `$${day.price}`,
                        start: day.date,
                        allDay: true,
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        textColor: 'black',
                        extendedProps: {
                            type: 'available',
                            price: day.price
                        }
                    });
                }
            });
        }




        // First identify all dates with custom minimum nights settings
        const datesWithCustomMinNights = [];
        if (data.property_calendar && data.property_calendar.length > 0) {
            data.property_calendar.forEach(day => {
                if (day.custom_minNights !== undefined && day.custom_minNights !== null) {
                    datesWithCustomMinNights.push({
                        date: day.date,
                        minNights: day.custom_minNights
                    });
                }
            });
        }
    }


    // Initialize and render the calendar
    function initializeCalendar() {
        // Reset content loaded flag when initializing calendar
        allContentLoaded = false;

        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(calendarEvents);
            calendar.render();

            calendar.on('eventSourceSuccess', function () {
                // Events have been successfully loaded from source
                setTimeout(checkAllLoaded, 100);
            });

            calendar.on('_eventsPositioned', function () {
                // Events have been positioned in the calendar
                eventsPositioned = true;
                setTimeout(checkAllLoaded, 100);
            });

            calendar.on('datesSet', function () {
                // Date range has been set and rendered
                datesRendered = true;
                setTimeout(checkAllLoaded, 100);
            });

            // Set multiple timed checks regardless of events
            setTimeout(checkAllLoaded, 800);  // Check after 0.8 second
            setTimeout(checkAllLoaded, 1200); // Check after 1.2 seconds
            setTimeout(checkAllLoaded, 1600); // Check after 1.6 seconds

            function checkAllLoaded() {
                if (!isDataLoading) {
                    hideLoaderIfReady();
                }
            }

            return;
        }

        // Determine the initial date to show
        const today = new Date();
        let initialDate = today;

        // Check if there's an active reservation that started in the previous month
        const currentActiveReservation = calendarEvents.find(event => {
            if (event.extendedProps?.type === 'reservation') {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                // Check if reservation is currently active
                return startDate <= today && endDate > today &&
                    // Check if it started in the previous month
                    (startDate.getMonth() !== today.getMonth() ||
                        startDate.getFullYear() !== today.getFullYear());
            }
            return false;
        });

        // If there's an active reservation that started in the previous month, show that month
        if (currentActiveReservation) {
            const reservationStartDate = new Date(currentActiveReservation.start);
            initialDate = new Date(reservationStartDate.getFullYear(), reservationStartDate.getMonth(), 1);
        }


        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);


        // Add custom CSS for calendar cell formatting
        const customStyles = document.createElement('style');
        customStyles.textContent = `
                .fc .fc-daygrid-day-top {
                    display: flex;
                    flex-direction: row;
                    padding-left: 12px;
                    padding-top: 5px;
                    padding-right: 5px;
                    height: 60%;
                }
                .fc-daygrid-block-event .fc-event-time, 
                .fc-daygrid-block-event .fc-event-title {
                    padding: 1px 2px !important;
                }
                /* Base styles for fc-bg-event */
                .fc .fc-bg-event {
                    padding-bottom: 1vh !important;
                    padding-left: 13px !important;
                }
                .fc-daygrid-event {
                    margin-top: auto !important;
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: flex-start !important;
                    align-items: center !important;
                    height: 100% !important;
                    border-radius: 20px !important;
                    padding-left: 5px !important;
                    padding-right: 5px !important;
                }
                @media screen and (max-width: 530px) {
                    .fc .fc-daygrid-day-top {
                        padding-left: 3px !important;
                        padding-top: 0px !important;
                        height: 45% !important;
                    }
                    .fc .fc-daygrid-day-frame {
                        padding-left: 3px !important;
                        padding-top: 3px !important;
                        padding-right: 3px !important;
                        padding-bottom: 0px !important;
                    }
                    .fc .fc-bg-event {
                        padding-left: 3px !important;
                    }
                    .fc .fc-daygrid-day-frame {
                        padding-left: 0px !important;
                    }
                    .fc-daygrid-event {
                        padding-left: 0px !important;
                    }
                    .fc-col-header-cell.fc-day {
                        padding-left: 10px !important;
                    }
                    .fc .fc-daygrid-body-balanced .fc-daygrid-day-events {
                        height: 55% !important;
                    }
                }
                .fc-event-past .fc-event-title {
                    opacity: 0.3 !important;
                }
                
                /* Small screens (700px and below) */
                @media screen and (max-width: 700px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.8vh !important;
                    }
                }
                @media screen and (max-width: 650px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.7vh !important;
                    }
                }
                @media screen and (max-width: 600px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.5vh !important;
                    }
                }
                @media screen and (max-width: 550px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.4vh !important;
                    }
                }
                @media screen and (max-width: 500px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.3vh !important;
                    }
                }
                @media screen and (max-width: 450px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.2vh !important;
                    }
                }
                @media screen and (max-width: 400px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.1vh !important;
                    }
                }
                @media screen and (max-width: 350px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.0vh !important;
                    }
                }
                @media screen and (max-width: 300px) {
                    .fc .fc-bg-event {
                        padding-bottom: 0.0vh !important;
                    }
                }
                
                /* Larger screens (1000px and above) - existing code */
                @media screen and (min-width: 1000px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.12vh !important;
                    }
                }
                @media screen and (min-width: 1025px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.2vh !important;
                    }
                }
                @media screen and (min-width: 1050px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.25vh !important;
                    }
                }
                @media screen and (min-width: 1075px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.35vh !important;
                    }
                }
                @media screen and (min-width: 1100px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.4vh !important;
                    }
                }
                @media screen and (min-width: 1125px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.5vh !important;
                    }
                }
                @media screen and (min-width: 1150px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.675vh !important;
                    }
                }
                @media screen and (min-width: 1175px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.75vh !important;
                    }
                }
                @media screen and (min-width: 1200px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.85vh !important;
                    }
                }
                @media screen and (min-width: 1225px) {
                    .fc .fc-bg-event {
                        padding-bottom: 1.9375vh !important;
                    }
                }
                @media screen and (min-width: 1250px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.025vh !important;
                    }
                }
                @media screen and (min-width: 1275px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.1125vh !important;
                    }
                }
                @media screen and (min-width: 1300px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.2vh !important;
                    }
                }
                @media screen and (min-width: 1325px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.275vh !important;
                    }
                }
                @media screen and (min-width: 1350px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.35vh !important;
                    }
                }
                @media screen and (min-width: 1375px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.475vh !important;
                    }
                }
                @media screen and (min-width: 1400px) {
                    .fc .fc-bg-event {
                        padding-bottom: 2.6vh !important;
                    }
                }
                .fc .fc-multimonth {
                    border: none !important;
                }
                .fc .fc-multimonth-daygrid {
                    border-top: 1px solid #dddddd;
                    border-right: 1px solid #dddddd;
                    border-bottom: none;
                    border-left: none;
                }
                .fc .fc-daygrid-day-number {
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 500;
                }
                @media screen and (max-width: 600px) {
                    .fc .fc-daygrid-day-number {
                        font-size: 14px !important;
                    }
                }
                 @media screen and (max-width: 450px) {
                .fc .fc-daygrid-day-number {
                font-size: 12px !important;
                    }
                }
                .fc .fc-daygrid-day-number {
                    text-align: left;
                }
                .fc .fc-bg-event .fc-event-title {
                    color: #000000 !important;
                    font-style: normal !important;
                }
                .fc .fc-daygrid-body-balanced .fc-daygrid-day-events {
                    position: relative !important;
                    min-height: 0em;
                    text-align: left;
                    height: 40%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    margin-top: 0px !important;
                }
                .fc .fc-daygrid-day-bottom {
                    display: none !important;
                    margin-top: 0 !important;
                }
                .fc .fc-daygrid-day-bg {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: flex-end;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1;
                }
                .fc-daygrid-bg-harness {
                    padding-left: 10px !important;
                    padding-right: 10px !important;
                    padding-top: 10px !important;
                    padding-bottom: 50px !important;
                    position: absolute !important;
                }
                @media screen and (max-width: 600px) {
                    .fc-daygrid-bg-harness {
                        padding-bottom: 0px !important;
                        padding-left: 0px !important;
                        padding-right: 0px !important;
                        padding-top: 0px !important;
                    }
                }
                .fc-event {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: left;
                    
                    cursor: pointer;    
                }
                .fc-event-title {
                    text-align: left !important;
                    font-size: 17px !important;
                    font-weight: 400 !important;
                }
                @media screen and (max-width: 600px) {
                    .fc-event-title {
                        font-size: 14px !important;
                    }
                }
                @media screen and (max-width: 450px) {
                    .fc-event-title {
                        font-size: 12px !important;
                        margin-top: 5px !important;
                        margin-left: 3px !important;
                        margin-right: 0px !important;
                        margin-bottom: 5px !important;
                    }
                    .fc-event-title {
                        padding: 1px 0px !important;
                    }
                }
                .fc .fc-daygrid-day-frame {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    min-height: 100%;
                    height: 100%;
                    width: 100%;
                    padding-left: 5px;
                    padding-top: 10px;
                    padding-bottom: 10px;
                    padding-right: 5px;
                    box-sizing: border-box;
                    position: relative;
                    z-index: 2;
                }
                .fc-daygrid-day-frame.fc-scrollgrid-sync-inner {
                    aspect-ratio: 1 !important;
                    aspect-ratio: 1 !important; /* Using aspect-ratio instead of fixed height */
                    max-height: none !important;
                }
                .fc-event-title {
                    text-align: left;
                }
                .fc-daygrid-event-harness {
                    height: 100% !important;
                }

                /* Styles for multi-week events */
                .fc-event-start:not(.fc-event-end) {
                    border-top-right-radius: 0 !important;
                    border-bottom-right-radius: 0 !important;
                }
                .fc-event-end:not(.fc-event-start) {
                    border-top-left-radius: 0 !important;
                    border-bottom-left-radius: 0 !important;
                }
                .fc-event:not(.fc-event-start):not(.fc-event-end) {
                    border-radius: 0 !important;
                }
                .fc-daygrid-event-harness.fc-daygrid-event-harness-abs {
                    height: 100% !important;
                }
                .multi-day-reservation {
                    z-index: 5;
                }
                .fc-col-header-cell.fc-day.fc-day-sun,
                .fc-col-header-cell.fc-day.fc-day-mon,
                .fc-col-header-cell.fc-day.fc-day-tue,
                .fc-col-header-cell.fc-day.fc-day-wed,
                .fc-col-header-cell.fc-day.fc-day-thu,
                .fc-col-header-cell.fc-day.fc-day-fri,
                .fc-col-header-cell.fc-day.fc-day-sat {
                    border: none;
                    text-align: left;
                    padding-left: 15px;
                }
                .fc-day fc-day-sun fc-day-past fc-daygrid-day,
                .fc-day fc-day-mon fc-day-past fc-daygrid-day,
                .fc-day fc-day-tue fc-day-past fc-daygrid-day,
                .fc-day fc-day-wed fc-day-past fc-daygrid-day,
                .fc-day fc-day-thu fc-day-past fc-daygrid-day,
                .fc-day fc-day-fri fc-day-past fc-daygrid-day,
                .fc-day fc-day-sat fc-day-past fc-daygrid-day,
                .fc-day fc-day-sun fc-day-future fc-daygrid-day,
                .fc-day fc-day-mon fc-day-future fc-daygrid-day,
                .fc-day fc-day-tue fc-day-future fc-daygrid-day,
                .fc-day fc-day-wed fc-day-future fc-daygrid-day,
                .fc-day fc-day-thu fc-day-future fc-daygrid-day,
                .fc-day fc-day-fri fc-day-future fc-daygrid-day,
                .fc-day fc-day-sat fc-day-future fc-daygrid-day,
                .fc-day fc-day-sun fc-day-today fc-daygrid-day,
                .fc-day fc-day-mon fc-day-today fc-daygrid-day,
                .fc-day fc-day-tue fc-day-today fc-daygrid-day,
                .fc-day fc-day-wed fc-day-today fc-daygrid-day,
                .fc-day fc-day-thu fc-day-today fc-daygrid-day,
                .fc-day fc-day-fri fc-day-today fc-daygrid-day,
                .fc-day fc-day-sat fc-day-today fc-daygrid-day
                {
                    aspect-ratio: 1 !important;
                    aspect-ratio: 1 !important; /* Using aspect-ratio instead of fixed height */
                    max-height: none !important;
                }
                /* Ensure all month tables have the same cell heights */
                .fc-multimonth-month {
                    min-height: 0 !important;
                }
                .fc-daygrid-body {
                    min-height: 0 !important;
                }
                .fc-scrollgrid-sync-table {
                    min-height: 0 !important;
                    height: auto !important;
                }
                /* Force all rows to have the same height */
                .fc-daygrid-body table tbody tr {
                    aspect-ratio: 1 !important; /* Using aspect-ratio instead of fixed height */
                    max-height: none !important;
                }
                .fc-col-header-cell-cushion {
                    font-size: 14px;
                    font-weight: 400;
                    color: grey;
                    text-decoration: none;
                }
                /* Prevent container from scrolling */
                .w-layout-blockcontainer.container-3.w-container.fc.fc-media-screen.fc-direction-ltr.fc-theme-standard {
                    overflow: hidden;
                    position: relative;
                }
                /* Allow only the view harness to scroll */
                .fc-view-harness.fc-view-harness-active {
                    overflow-y: auto;
                    max-height: 100% !important;
                    height: 100% !important;
                }
                .fc-header-toolbar.fc-toolbar.fc-toolbar-ltr {
                    padding-top: 20px;
                    padding-left: 20px;
                    padding-right: 20px;
                }
                .fc-toolbar-title {
                    font-size: 24px !important;
                    font-weight: 500 !important;
                    color: #000000 !important;
                    text-decoration: none !important;
                }
                .fc-multimonth-title {
                    font-size: 20px !important;
                    font-weight: 500 !important;
                    color: #000000 !important;
                    text-decoration: none !important;
                    padding-bottom: 20px !important;
                    padding-top: 20px !important;
                }
                .fc-button-primary {
                    background-color:rgb(255, 255, 255) !important;
                    color: rgb(0, 0, 0) !important;
                }
                .fc-toolbar-chunk {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                /* Hide title for multi-week events except on the first day */
                .fc-event:not(.fc-event-start) .fc-event-title {
                    display: none;
                }
                .fc-day-past {
                    background-color: #f2f2f2 !important;
                }
                .fc-day-past .fc-daygrid-day-number {
                    color: #777777 !important;
                    opacity: 0.8;
                }
                .fc .fc-daygrid-day.fc-day-today {
                    background-color: transparent !important;
                }
                /* Custom cursor for past days without events */
                .fc-day-past {
                    cursor: not-allowed;
                }
                /* Custom cursor for reserved days */
                .reserved-day {
                    cursor: not-allowed;
                }
                /* Selected day styling */
                .selected-day {
                    border-radius: 10px !important;
                    outline: 3px solid black !important;
                    outline-offset: -6px !important;
                    background-color: transparent !important;
                }
                .fc-view-harness.fc-view-harness-active  {
                    max-height: 80vh !important;
                }
            `;
        document.head.appendChild(customStyles);


        // Flag to prevent double-click handling
        let isProcessingClick = false;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'multiMonthYear',
            multiMonthMaxColumns: 1,
            multiMonthTitleFormat: { year: 'numeric', month: 'long' },
            aspectRatio: 1.5,
            initialDate: initialDate,
            headerToolbar: {
                left: '',
                center: '',
                right: 'title prev,next',
            },
            titleFormat: {
                year: 'numeric',
            },
            events: calendarEvents,
            eventDisplay: 'block',
            displayEventTime: false,
            eventTimeFormat: {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            },

            eventClick: function (info) {
                // Handle event click
                info.jsEvent.preventDefault();

                // Check if the clicked event is a reservation
                if (info.event.extendedProps.type === 'reservation') {
                    // Get the reservation ID from the event
                    // For multi-day events, we need to get the ID from the original event
                    // This ensures middle days of a reservation also have the correct ID
                    const clickedReservationId = info.event.id || info.event.extendedProps.reservationId ||
                        info.event.groupId || info.event.extendedProps.groupId;

                    // Find the matching reservation from the host reservations data
                    if (hostReservations && hostReservations.active_reservations) {
                        // Create a flattened array of all reservations from the nested structure
                        const allReservations = [];

                        // Iterate through each array in active_reservations
                        hostReservations.active_reservations.forEach(reservationArray => {
                            // Each item in active_reservations is an array, so we need to iterate through it
                            reservationArray.forEach(reservation => {
                                allReservations.push(reservation);
                            });
                        });

                        // Now search in the flattened array
                        const matchedReservation = allReservations.find(
                            res => res.id === parseInt(clickedReservationId) ||
                                res.id === clickedReservationId ||
                                res.reservationId === parseInt(clickedReservationId) ||
                                res.reservationId === clickedReservationId
                        );

                        if (matchedReservation) {
                            const selectedReservation = matchedReservation;

                            // Show reservation modal here using selectedReservation
                            const reservationModal = document.querySelector('[data-element="reservationInfoModal"]');
                            if (reservationModal) {
                                // Populate modal with reservation data
                                // This is just a placeholder - the actual implementation would depend on the modal structure
                                displayReservationModal(selectedReservation);

                                // Show the modal
                                // Show reservation modal here using selectedReservation
                                reservationModal.style.display = 'flex';
                            }
                        }
                    }
                }
                if (info.event.extendedProps.type == 'reserved') {
                    return;
                } else if (['blocked', 'available'].includes(info.event.extendedProps.type)) {
                    // Handle click on unavailable period, short gap, blocked, or available dates

                    // Use the event's start date directly
                    const clickedDate = info.event.start;

                    // Prevent double-click handling
                    if (!isProcessingClick) {
                        isProcessingClick = true;
                        handleNonReservationDateClick(clickedDate);

                        // Reset the flag after a short delay
                        setTimeout(() => {
                            isProcessingClick = false;
                        }, 300);
                    }
                }
            },
            dateClick: function (info) {
                // Prevent double-click handling
                if (isProcessingClick) return;

                // Handle date click
                const clickedDate = new Date(info.dateStr);

                // Find any reservation events that span this date
                const reservationOnDate = calendarEvents.find(event => {
                    if (event.extendedProps?.type === 'reservation') {
                        const eventStart = new Date(event.start);
                        const eventEnd = event.end ? new Date(event.end) : new Date(eventStart);

                        // Check if clicked date falls within the reservation period
                        return clickedDate >= eventStart && clickedDate < eventEnd;
                    }
                    return false;
                });

                // If we found a reservation that spans this date, simulate clicking on it
                if (reservationOnDate) {

                    // Get the reservation ID
                    const reservationId = reservationOnDate.id ||
                        reservationOnDate.extendedProps.reservationId ||
                        reservationOnDate.groupId ||
                        reservationOnDate.extendedProps.groupId;

                    if (reservationId && hostReservations && hostReservations.active_reservations) {
                        // Flatten all reservations
                        const allReservations = [];
                        hostReservations.active_reservations.forEach(reservationArray => {
                            reservationArray.forEach(reservation => {
                                allReservations.push(reservation);
                            });
                        });

                        // Find the matching reservation
                        const matchedReservation = allReservations.find(
                            res => res.id === parseInt(reservationId) ||
                                res.id === reservationId ||
                                res.reservationId === parseInt(reservationId) ||
                                res.reservationId === reservationId
                        );

                        if (matchedReservation) {
                            // Display the reservation modal
                            const reservationModal = document.querySelector('[data-element="reservationInfoModal"]');
                            if (reservationModal) {
                                displayReservationModal(matchedReservation);
                                reservationModal.style.display = 'flex';
                            }
                        }
                    }
                } else {
                    // Set the flag to prevent double handling
                    isProcessingClick = true;

                    // Pass the actual event object instead of just the date string
                    handleNonReservationDateClick(clickedDate);

                    // Reset the flag after a short delay
                    setTimeout(() => {
                        isProcessingClick = false;
                    }, 300);

                }
            },
            datesSet: function (info) {
                // After the calendar view is set, ensure events are visible
                // This helps with the issue of events not showing with validRange
                setTimeout(() => {
                    // Remove and re-add events to force refresh
                    calendar.removeAllEvents();
                    calendar.addEventSource(calendarEvents);
                }, 100);

                // Check if there are events in the current view range
                const eventsInView = calendarEvents.filter(event => {
                    const eventStart = new Date(event.start);
                    return eventStart >= info.start && eventStart <= info.end;
                });
            },
            eventContent: function (arg) {
                let innerHtml;

                if (arg.event.extendedProps.type === 'reservation') {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">${arg.event.title}</div>`;
                } else if (arg.event.extendedProps.type === 'available') {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">$${arg.event.extendedProps.price}</div>`;
                } else if (arg.event.extendedProps.type === 'reserved' && arg.event.extendedProps.price) {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">$${arg.event.extendedProps.price}</div>`;
                } else if (arg.event.extendedProps.type === 'blocked') {
                    innerHtml = arg.event.extendedProps.price ?
                        `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">$${arg.event.extendedProps.price}</div>` :
                        `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">Blocked</div>`;
                } else if (arg.event.extendedProps.type === 'short_gap') {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">$${arg.event.extendedProps.price}</div>`;
                } else if (arg.event.extendedProps.type === 'unavailablePeriod') {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">$${arg.event.extendedProps.price}</div>`;
                } else {
                    innerHtml = `<div class="fc-event-title" style="font-family: 'TT Fors', sans-serif;">${arg.event.title}</div>`;
                }

                return { html: innerHtml };
            }
        });


        // Function to handle clicks on non-reservation dates
        function handleNonReservationDateClick(date) {

            // Ensure date is a Date object
            const dateObj = date instanceof Date ? date : new Date(date);
            // Format as YYYY-MM-DD for consistent comparison
            const dateStr = dateObj.toISOString().split('T')[0];
            //  console.log({ dateObj })
            // Get the toolbar and custom dates elements
            const toolbar = document.querySelector('[data-element="toolbar"]');
            const customDates = document.querySelector('[data-element="toolbarEdit_customDates"]');

            if (!toolbar || !customDates) {
                return;
            }

            // Find the event for this date to check its type
            const eventOnDate = calendarEvents.find(event => {
                const eventDate = event.start;
                return eventDate === dateStr
            });
            let dateObjString = dateObj.toDateString();
            //  console.log({ dateObjString })
            //  console.log({ eventOnDate })
            if (!eventOnDate) {
                return; // Exit if no event found for this date
            }


            // Get the event type and log it
            const eventType = eventOnDate.extendedProps.type;
            if (eventType == 'reserved') {
                return;
            }
            console.log(`Clicked date: ${dateStr}, Type: ${eventType}`);

            // Get the event price
            const eventPrice = eventOnDate.extendedProps.price;

            // Check if this date is already in the selected dates array
            const dateIndex = selectedDates.indexOf(dateStr);

            // Find the date element in the DOM
            const dateElement = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);

            if (dateIndex !== -1) {
                // Date is already selected, so unselect it (for all event types including blocked)
                selectedDates.splice(dateIndex, 1);

                // Remove from selectedDateTypes
                delete selectedDateTypes[dateStr];

                // Remove selected styling from this day
                if (dateElement) {
                    dateElement.classList.remove('selected-day');
                }
            } else {
                // Date is not selected, so add it to the selection
                selectedDates.push(dateStr);
                console.log({ eventType })

                // Store the date type
                selectedDateTypes[dateStr] = eventType;

                // Add selected styling to the clicked day
                if (dateElement) {
                    dateElement.classList.add('selected-day');
                } else {

                    // Try to find the element using a more specific selector
                    const allDateElements = document.querySelectorAll('.fc-daygrid-day');

                    // Try to find the element by iterating through all date cells
                    let foundElement = false;
                    allDateElements.forEach(el => {
                        const elDate = el.getAttribute('data-date');
                        if (elDate === dateStr) {
                            el.classList.add('selected-day');
                            foundElement = true;
                        }
                    });

                }
            }

            // Switch to pricing view when date selection changes
            switchView('pricing');

            // Update toolbar display based on whether any dates are selected
            if (selectedDates.length > 0) {
                toolbar.style.display = 'none';
                customDates.style.display = 'flex';

                // Update the custom dates text based on selection
                updateCustomDatesText();

                // Update the price input based on selection
                updatePriceInput();

                // Update availability containers
                updateAvailabilityContainers();
            } else {
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: handleNonReservationDateClick - no selected dates');
                customDates.style.display = 'none';
            }

        }

        // Apply TT Fors font to the entire calendar
        calendarEl.style.fontFamily = "'TT Fors', sans-serif";

        calendar.render();

        addNextYearButtonListener();

        addNavigationButtonListeners();

        // Function to handle responsive behavior
        function setupResponsiveCalendar() {
            const toolbarContainer = document.querySelector('[data-element="calendarToolbarContainer"]');
            let mobileNoticePopup;

            // Create mobile notice popup if it doesn't exist
            function createMobileNoticePopup() {
                // Check if popup already exists
                if (document.querySelector('#mobile-notice-popup')) {
                    return document.querySelector('#mobile-notice-popup');
                }

                // Create popup element
                const popup = document.createElement('div');
                popup.id = 'mobile-notice-popup';
                popup.style.position = 'fixed';
                popup.style.bottom = '20px';
                popup.style.left = '50%';
                popup.style.transform = 'translateX(-50%)';
                popup.style.backgroundColor = '#333';
                popup.style.color = 'white';
                popup.style.padding = '12px 20px';
                popup.style.borderRadius = '8px';
                popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                popup.style.zIndex = '9999';
                popup.style.maxWidth = '90%';
                popup.style.textAlign = 'center';
                popup.style.fontSize = '14px';
                popup.style.display = 'none';

                // Add message
                popup.innerHTML = 'Please use a laptop or desktop to edit calendar settings <button id="close-mobile-notice" style="background:none;border:none;color:white;margin-left:10px;font-size:16px;cursor:pointer">×</button>';

                // Add to document
                document.body.appendChild(popup);

                // Add close button functionality
                document.getElementById('close-mobile-notice').addEventListener('click', (e) => {
                    e.stopPropagation();
                    popup.style.display = 'none';
                });

                return popup;
            }

            // Function to show mobile notice
            function showMobileNotice() {
                if (!mobileNoticePopup) {
                    mobileNoticePopup = createMobileNoticePopup();
                }
                mobileNoticePopup.style.display = 'block';

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    mobileNoticePopup.style.display = 'none';
                }, 5000);
            }

            // Function to check screen width and apply restrictions
            function applyMobileRestrictions() {
                if (window.innerWidth < 992) {
                    // Hide toolbar container on mobile
                    if (toolbarContainer) {
                        toolbarContainer.style.display = 'none';
                    }

                    // Show mobile notice
                    showMobileNotice();

                    // If calendar is initialized, modify its click handling
                    if (calendar) {
                        // Store the original eventClick function
                        if (!calendar._originalEventClick && calendar.getOption('eventClick')) {
                            calendar._originalEventClick = calendar.getOption('eventClick');

                            // Replace with restricted version that only allows reservation clicks
                            calendar.setOption('eventClick', function (info) {
                                // Only allow clicks on reservation type events
                                if (info.event.extendedProps.type === 'reservation') {
                                    // Call the original handler for reservations
                                    calendar._originalEventClick(info);
                                } else {
                                    // Show notice for other event types
                                    showMobileNotice();
                                }
                            });
                        }

                        // Store original dateClick and replace with notice
                        if (!calendar._originalDateClick && calendar.getOption('dateClick')) {
                            calendar._originalDateClick = calendar.getOption('dateClick');

                            // Show notice when clicking on dates
                            calendar.setOption('dateClick', function () {
                                showMobileNotice();
                            });
                        } else if (!calendar.getOption('dateClick')) {
                            // If no dateClick handler exists, add one to show notice
                            calendar.setOption('dateClick', function () {
                                showMobileNotice();
                            });
                        }
                    }
                } else {
                    // Restore normal functionality on desktop
                    if (toolbarContainer) {
                        toolbarContainer.style.display = 'flex';
                    }

                    // Hide mobile notice if visible
                    if (mobileNoticePopup) {
                        mobileNoticePopup.style.display = 'none';
                    }

                    // Restore original click handlers if they exist
                    if (calendar && calendar._originalEventClick) {
                        calendar.setOption('eventClick', calendar._originalEventClick);

                        // Restore date click functionality if needed
                        if (calendar._originalDateClick) {
                            calendar.setOption('dateClick', calendar._originalDateClick);
                        }
                    }
                }
            }

            // Apply restrictions on load
            applyMobileRestrictions();

            // Update on window resize
            window.addEventListener('resize', applyMobileRestrictions);
        }

        // Call the responsive setup function
        setupResponsiveCalendar();
    }

    // Centralized function to switch between pricing and availability views
    function switchView(viewName) {
        if (viewName !== 'pricing' && viewName !== 'availability') {
            console.error('Invalid view name:', viewName);
            return;
        }

        const pricingToggle = document.querySelector('[data-element="toolbarEdit_customDates_pricing_toggle"]');
        const availabilityToggle = document.querySelector('[data-element="toolbarEdit_customDates_availability_toggle"]');
        const priceContainer = document.querySelector('[data-element="toolbarEdit_customDates_priceContainer"]');
        const availabilityContainer = document.querySelector('[data-element="toolbarEdit_customDates_availabilityContainer"]');

        if (!pricingToggle || !availabilityToggle || !priceContainer || !availabilityContainer) {
            return;
        }

        // Explicitly set the display properties for both containers and toggle states
        // regardless of current view to ensure consistent state
        if (viewName === 'pricing') {
            // Update toggle buttons
            pricingToggle.classList.add('selected');
            availabilityToggle.classList.remove('selected');

            // Force container visibility
            priceContainer.style.display = 'flex';
            availabilityContainer.style.display = 'none';
        } else { // viewName === 'availability'
            // Update toggle buttons
            availabilityToggle.classList.add('selected');
            pricingToggle.classList.remove('selected');

            // Force container visibility
            availabilityContainer.style.display = 'flex';
            priceContainer.style.display = 'none';

            // Update availability containers when switching to availability view
            updateAvailabilityContainers();
        }

        // Update the current view
        currentView = viewName;
    }
    // Function to update the custom dates text based on selection
    function updateCustomDatesText() {
        const customDatesText = document.querySelector('[data-element="toolbarEdit_customDates_headerText"]');
        if (!customDatesText || selectedDates.length === 0) return;

        // Sort dates chronologically
        const sortedDates = [...selectedDates].sort();

        // Format for single date
        if (sortedDates.length === 1) {
            // Use the date string directly to avoid timezone issues
            const dateParts = sortedDates[0].split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed in JS
            const day = parseInt(dateParts[2]);

            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            const date = new Date(year, month, day);
            customDatesText.textContent = date.toLocaleDateString('en-US', options);
            return;
        }

        // Check if dates are consecutive and have the same type
        let areConsecutive = true;
        let allSameType = true;
        let prevType = null;

        // Get the types of all selected dates
        const dateTypes = sortedDates.map(dateStr => {
            const event = calendarEvents.find(event => {
                // Use date strings directly for comparison to avoid timezone issues
                const eventDateStr = event.start.split('T')[0];
                return eventDateStr === dateStr;
            });

            if (event) {

                return event.extendedProps.type;
            }
            return 'unknown';
        });

        // Check if all dates are consecutive
        for (let i = 1; i < sortedDates.length; i++) {
            // Parse dates using the date strings directly
            const currParts = sortedDates[i].split('-');
            const prevParts = sortedDates[i - 1].split('-');

            const curr = new Date(
                parseInt(currParts[0]),
                parseInt(currParts[1]) - 1,
                parseInt(currParts[2])
            );

            const prev = new Date(
                parseInt(prevParts[0]),
                parseInt(prevParts[1]) - 1,
                parseInt(prevParts[2])
            );

            // Add one day to prev to check if it equals curr
            prev.setDate(prev.getDate() + 1);

            // Compare year, month, and day directly
            const prevYear = prev.getFullYear();
            const prevMonth = prev.getMonth() + 1;
            const prevDay = prev.getDate();
            const prevDateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;

            if (prevDateStr !== sortedDates[i]) {
                areConsecutive = false;
                break;
            }
        }

        // Check if all dates have the same type
        if (dateTypes.length > 0) {
            prevType = dateTypes[0];
            for (let i = 1; i < dateTypes.length; i++) {
                if (dateTypes[i] !== prevType) {
                    allSameType = false;
                    break;
                }
            }
        }

        // Format the text based on the conditions
        if (areConsecutive && allSameType) {
            // Show date range for consecutive dates with same type
            // Parse dates using the date strings directly to avoid timezone issues
            const startParts = sortedDates[0].split('-');
            const endParts = sortedDates[sortedDates.length - 1].split('-');

            const startDate = new Date(
                parseInt(startParts[0]),
                parseInt(startParts[1]) - 1,
                parseInt(startParts[2])
            );

            const endDate = new Date(
                parseInt(endParts[0]),
                parseInt(endParts[1]) - 1,
                parseInt(endParts[2])
            );

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // If same month and year, use format: Aug 1 - 5, 2024
            if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
                const month = months[startDate.getMonth()];
                const startDay = startDate.getDate();
                const endDay = endDate.getDate();
                const year = endDate.getFullYear();
                customDatesText.textContent = `${month} ${startDay} - ${endDay}, ${year}`;
            } else {
                // Different months or years, use format: Aug 25 - Sep 2, 2024
                const startMonth = months[startDate.getMonth()];
                const endMonth = months[endDate.getMonth()];
                const startDay = startDate.getDate();
                const endDay = endDate.getDate();
                const year = endDate.getFullYear();
                customDatesText.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
            }
        } else {
            // Show number of nights for non-consecutive dates or mixed types
            const nightsCount = sortedDates.length;
            customDatesText.textContent = `${nightsCount} ${nightsCount === 1 ? 'night' : 'nights'}`;
        }
    }

    // Function to group selected dates into consecutive ranges by type
    function groupConsecutiveDatesByType() {
        if (selectedDates.length === 0) return { open: [], blocked: [] };

        // Sort dates chronologically
        const sortedDates = [...selectedDates].sort();

        const openRanges = [];
        const blockedRanges = [];

        let currentRange = null;
        let prevDate = null;

        sortedDates.forEach(dateStr => {
            const dateParts = dateStr.split('-');
            const currentDate = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
            );

            const type = selectedDateTypes[dateStr];
            // Only 'available' dates are considered open now
            const isOpen = type === 'available';

            // If this is the first date or there was a break in consecutive dates or type changed
            if (!currentRange || !prevDate || !areDatesConsecutive(prevDate, currentDate) ||
                (isOpen && currentRange.type === 'blocked') || (!isOpen && currentRange.type === 'open')) {

                // Store the previous range if it exists
                if (currentRange) {
                    if (currentRange.type === 'open') {
                        openRanges.push(currentRange);
                    } else {
                        blockedRanges.push(currentRange);
                    }
                }

                // Start a new range
                currentRange = {
                    type: isOpen ? 'open' : 'blocked',
                    startDate: currentDate,
                    endDate: currentDate
                };
            } else {
                // Extend the current range
                currentRange.endDate = currentDate;
            }

            prevDate = currentDate;
        });

        // Don't forget the last range
        if (currentRange) {
            if (currentRange.type === 'open') {
                openRanges.push(currentRange);
            } else {
                blockedRanges.push(currentRange);
            }
        }

        console.log('openRanges', openRanges);
        console.log('blockedRanges', blockedRanges);

        return { open: openRanges, blocked: blockedRanges };
    }

    // Function to update UI blocks for each date range
    function updateDateRangeBlocks(dateRanges) {
        const openNightsContainer = document.querySelector('[data-element="toolbarEdit_customDates_openNights_container"]');
        const blockedNightsContainer = document.querySelector('[data-element="toolbarEdit_customDates_blockedNights_container"]');

        if (!openNightsContainer || !blockedNightsContainer) {
            console.error('Night containers not found');
            return;
        }

        // Get the flex blocks containers (where blocks should be nested)
        const openFlexBlocks = openNightsContainer.querySelector('[data-element="toolbarEdit_customDates_openNights_flexBlocks"]');
        const blockedFlexBlocks = blockedNightsContainer.querySelector('[data-element="toolbarEdit_customDates_blockedNights_flexBlocks"]');

        if (!openFlexBlocks || !blockedFlexBlocks) {
            console.error('Flex blocks containers not found');
            return;
        }

        // Get the original blocks
        const originalOpenBlock = document.querySelector('[data-element="toolbarEdit_customDates_openNights_block"]');
        const originalBlockedBlock = document.querySelector('[data-element="toolbarEdit_customDates_blockedNights_block"]');

        if (!originalOpenBlock || !originalBlockedBlock) {
            console.error('Original blocks not found');
            return;
        }

        // Remove any existing cloned blocks
        const allOpenBlocks = openFlexBlocks.querySelectorAll('[data-element="toolbarEdit_customDates_openNights_block"]');
        const allBlockedBlocks = blockedFlexBlocks.querySelectorAll('[data-element="toolbarEdit_customDates_blockedNights_block"]');

        for (let i = 1; i < allOpenBlocks.length; i++) {
            allOpenBlocks[i].remove();
        }

        for (let i = 1; i < allBlockedBlocks.length; i++) {
            allBlockedBlocks[i].remove();
        }

        // Initialize arrays to track checked date ranges
        window.checkedOpenRanges = [];
        window.checkedBlockedRanges = [];

        // Put blocked ranges in the open container (to make available)
        if (dateRanges.blocked.length > 0) {
            // Use the first open block for the first blocked range
            const dateText = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_date"]');
            if (dateText) {
                dateText.textContent = formatDateRange(dateRanges.blocked[0].startDate, dateRanges.blocked[0].endDate);
            }

            // Setup checkbox for the first blocked range
            setupCheckbox(
                originalOpenBlock,
                '[data-element="toolbarEdit_customDates_openNights_checkbox"]',
                dateRanges.blocked[0],
                'open'
            );

            // Update min nights input for the first blocked range
            const minNightsInput = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_input"]');
            if (minNightsInput) {
                // Calculate number of nights in this range
                const nightsCount = calculateNightsInRange(dateRanges.blocked[0].startDate, dateRanges.blocked[0].endDate);

                // Cap the minimum nights at property's min_nights if available
                const propertyMinNights = propertiesDataRef && propertiesDataRef.min_nights ? propertiesDataRef.min_nights : nightsCount;

                const cappedNightsCount = Math.min(nightsCount, propertyMinNights);

                minNightsInput.value = cappedNightsCount;

                // Update the label next to the input
                const minNightsLabel = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_label"]');
                if (minNightsLabel) {
                    minNightsLabel.textContent = cappedNightsCount === 1 ? 'night' : 'nights';
                }

                // Update the descriptive text
                const minNightsText = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_text"]');
                if (minNightsText) {
                    minNightsText.textContent = `To open these nights, the minimum trip length should be ${cappedNightsCount} ${cappedNightsCount === 1 ? 'night' : 'nights'}.`;
                }

                // Add input event listener to update text when input changes
                minNightsInput.addEventListener('input', function () {
                    const value = parseInt(this.value) || 1;
                    const minNightsText = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_text"]');
                    if (minNightsText) {
                        minNightsText.textContent = `To open these nights, the minimum trip length should be ${value} ${value === 1 ? 'night' : 'nights'}.`;
                    }

                    // Also update the label
                    const minNightsLabel = originalOpenBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_label"]');
                    if (minNightsLabel) {
                        minNightsLabel.textContent = value === 1 ? 'night' : 'nights';
                    }
                });
            }

            originalOpenBlock.style.display = 'flex';

            // Clone for additional ranges if needed
            for (let i = 1; i < dateRanges.blocked.length; i++) {
                const clonedBlock = originalOpenBlock.cloneNode(true);
                const dateText = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_date"]');
                if (dateText) {
                    dateText.textContent = formatDateRange(dateRanges.blocked[i].startDate, dateRanges.blocked[i].endDate);
                }

                // Setup checkbox for this cloned blocked range
                setupCheckbox(
                    clonedBlock,
                    '[data-element="toolbarEdit_customDates_openNights_checkbox"]',
                    dateRanges.blocked[i],
                    'open'
                );

                // Update min nights input for this blocked range
                const minNightsInput = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_input"]');
                if (minNightsInput) {
                    // Calculate number of nights in this range
                    const nightsCount = calculateNightsInRange(dateRanges.blocked[i].startDate, dateRanges.blocked[i].endDate);

                    // Cap the minimum nights at property's min_nights if available
                    const propertyMinNights = propertiesDataRef && propertiesDataRef.min_nights ? propertiesDataRef.min_nights : nightsCount;

                    const cappedNightsCount = Math.min(nightsCount, propertyMinNights);

                    minNightsInput.value = cappedNightsCount;

                    // Update the label next to the input
                    const minNightsLabel = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_label"]');
                    if (minNightsLabel) {
                        minNightsLabel.textContent = cappedNightsCount === 1 ? 'night' : 'nights';
                    }

                    // Update the descriptive text
                    const minNightsText = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_text"]');
                    if (minNightsText) {
                        minNightsText.textContent = `To open these nights, the minimum trip length should be ${cappedNightsCount} ${cappedNightsCount === 1 ? 'night' : 'nights'}.`;
                    }

                    // Add input event listener to update text when input changes
                    minNightsInput.addEventListener('input', function () {
                        const value = parseInt(this.value) || 1;
                        const minNightsText = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_text"]');
                        if (minNightsText) {
                            minNightsText.textContent = `To open these nights, the minimum trip length should be ${value} ${value === 1 ? 'night' : 'nights'}.`;
                        }

                        // Also update the label
                        const minNightsLabel = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_openNights_minNights_label"]');
                        if (minNightsLabel) {
                            minNightsLabel.textContent = value === 1 ? 'night' : 'nights';
                        }
                    });
                }

                openFlexBlocks.appendChild(clonedBlock);
            }
        } else {
            originalOpenBlock.style.display = 'none';
        }

        // Put open ranges in the blocked container (to block)
        if (dateRanges.open.length > 0) {
            // Use the first blocked block for the first open range
            const dateText = originalBlockedBlock.querySelector('[data-element="toolbarEdit_customDates_blockedNights_date"]');
            if (dateText) {
                dateText.textContent = formatDateRange(dateRanges.open[0].startDate, dateRanges.open[0].endDate);
            }

            // Setup checkbox for the first open range
            setupCheckbox(
                originalBlockedBlock,
                '[data-element="toolbarEdit_customDates_blockedNights_checkbox"]',
                dateRanges.open[0],
                'blocked'
            );

            // Hide min nights container for blocked nights
            const minNightsContainer = originalBlockedBlock.querySelector('[data-element="toolbarEdit_customDates_blockedNights_minNights_Container"]');
            if (minNightsContainer) {
                minNightsContainer.style.display = 'none';
            }

            originalBlockedBlock.style.display = 'flex';

            // Clone for additional ranges if needed
            for (let i = 1; i < dateRanges.open.length; i++) {
                const clonedBlock = originalBlockedBlock.cloneNode(true);
                const dateText = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_blockedNights_date"]');
                if (dateText) {
                    dateText.textContent = formatDateRange(dateRanges.open[i].startDate, dateRanges.open[i].endDate);
                }

                // Setup checkbox for this cloned open range
                setupCheckbox(
                    clonedBlock,
                    '[data-element="toolbarEdit_customDates_blockedNights_checkbox"]',
                    dateRanges.open[i],
                    'blocked'
                );

                // Hide min nights container for blocked nights in cloned blocks
                const minNightsContainer = clonedBlock.querySelector('[data-element="toolbarEdit_customDates_blockedNights_minNights_Container"]');
                if (minNightsContainer) {
                    minNightsContainer.style.display = 'none';
                }

                blockedFlexBlocks.appendChild(clonedBlock);
            }
        } else {
            originalBlockedBlock.style.display = 'none';
        }
    }

    // Helper function to format a date range as text
    function formatDateRange(startDate, endDate) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // If same month and year, use format: Aug 1 - 5, 2024
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            const month = months[startDate.getMonth()];
            const startDay = startDate.getDate();
            const endDay = endDate.getDate();
            const year = endDate.getFullYear();

            // If single day, just show one date
            if (startDay === endDay) {
                return `${month} ${startDay}, ${year}`;
            }

            return `${month} ${startDay} - ${endDay}, ${year}`;
        } else {
            // Different months or years, use format: Aug 25 - Sep 2, 2024
            const startMonth = months[startDate.getMonth()];
            const endMonth = months[endDate.getMonth()];
            const startDay = startDate.getDate();
            const endDay = endDate.getDate();
            const year = endDate.getFullYear();
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
        }
    }

    // Helper function to setup checkbox functionality
    function setupCheckbox(blockElement, checkboxSelector, dateRange, type) {
        const checkbox = blockElement.querySelector(checkboxSelector);
        if (!checkbox) return;

        // Set initial state
        checkbox.isChecked = false;

        // Set checkbox style to unchecked initially
        checkbox.style.backgroundColor = 'transparent';
        checkbox.style.border = '2px solid #000';
        checkbox.style.borderRadius = '5px';
        checkbox.style.padding = '5px'; // Added padding all around

        // Store date range data as attributes
        checkbox.dateRange = dateRange;

        // Add click event handler
        checkbox.addEventListener('click', function () {
            this.isChecked = !this.isChecked;

            // Update visual appearance
            if (this.isChecked) {
                this.style.backgroundColor = '#000';
                // Create and append checkmark
                const checkmark = document.createElement('div');
                checkmark.className = 'checkbox-checkmark';
                checkmark.style.color = 'white';
                checkmark.style.fontSize = '14px';
                checkmark.style.fontWeight = 'bold';
                checkmark.style.display = 'flex';
                checkmark.style.justifyContent = 'center';
                checkmark.style.alignItems = 'center';
                checkmark.textContent = '✓'; // Using textContent instead of innerHTML for security
                this.innerHTML = '';
                this.appendChild(checkmark);

                // Ensure the checkmark is visible by setting explicit dimensions and position
                checkmark.style.width = '100%';
                checkmark.style.height = '100%';
                checkmark.style.position = 'relative';
                checkmark.style.top = '0';
                checkmark.style.left = '0';

                // Add to appropriate tracking array
                if (type === 'open') {
                    window.checkedOpenRanges.push({
                        dateRange: this.dateRange,
                        minNights: getMinNightsForRange(blockElement)
                    });
                } else {
                    window.checkedBlockedRanges.push({
                        dateRange: this.dateRange
                    });
                }
            } else {
                this.style.backgroundColor = 'transparent';
                this.innerHTML = '';

                // Remove from tracking array
                if (type === 'open') {
                    window.checkedOpenRanges = window.checkedOpenRanges.filter(item =>
                        !(areSameDates(item.dateRange.startDate, this.dateRange.startDate) &&
                            areSameDates(item.dateRange.endDate, this.dateRange.endDate))
                    );
                } else {
                    window.checkedBlockedRanges = window.checkedBlockedRanges.filter(item =>
                        !(areSameDates(item.dateRange.startDate, this.dateRange.startDate) &&
                            areSameDates(item.dateRange.endDate, this.dateRange.endDate))
                    );
                }
            }
        });
    }



    // Function to update the price input based on selection
    function updatePriceInput() {
        const priceInput = document.querySelector('[data-element="toolbarEdit_customDates_price_input"]');
        if (!priceInput || selectedDates.length === 0) return;

        // Get prices for all selected dates
        const prices = selectedDates.map(dateStr => {
            const event = calendarEvents.find(event => {
                const eventDateStr = event.start.split('T')[0];
                return eventDateStr === dateStr;
            });

            return event && event.extendedProps.price ? parseInt(event.extendedProps.price) : 0;
        }).filter(price => price > 0); // Filter out zero prices

        if (prices.length === 0) {
            priceInput.value = '$';
            priceInput.placeholder = '$';
            return;
        }

        // Sort prices to find min and max
        prices.sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        // If all prices are the same, show single price
        if (minPrice === maxPrice) {
            priceInput.value = `$${minPrice}`;
            priceInput.placeholder = `$${minPrice}`;
        } else {
            // Show price range
            priceInput.value = `$${minPrice} - ${maxPrice}`;
            priceInput.placeholder = `$${minPrice} - ${maxPrice}`;

            // Store the min price as data attribute for when user clicks
            priceInput.dataset.minPrice = minPrice;
        }
    }

    // Function to update availability containers based on selected date types
    function updateAvailabilityContainers() {
        const openNightsContainer = document.querySelector('[data-element="toolbarEdit_customDates_openNights_container"]');
        const blockedNightsContainer = document.querySelector('[data-element="toolbarEdit_customDates_blockedNights_container"]');

        if (!openNightsContainer || !blockedNightsContainer) {
            return;
        }
        console.log(selectedDateTypes)

        // Check if there are any open nights (only available dates now)
        const hasOpenNights = selectedDates.some(dateStr => {
            const type = selectedDateTypes[dateStr];
            return type === 'available';
        });

        // Check if there are any blocked nights (including unavailablePeriod and short_gap)
        const hasBlockedNights = selectedDates.some(dateStr => {
            const type = selectedDateTypes[dateStr];
            return type === 'blocked' || type === 'unavailablePeriod' || type === 'short_gap';
        });

        // Show both containers correctly based on selected date types
        // For blocked dates (including short_gap), show the openNights container to make them available
        openNightsContainer.style.display = hasBlockedNights ? 'flex' : 'none';

        // For available dates, show the blockedNights container to block them
        blockedNightsContainer.style.display = hasOpenNights ? 'flex' : 'none';

        // Group dates by type and consecutive ranges
        const dateRanges = groupConsecutiveDatesByType();

        // Update UI blocks for each group
        updateDateRangeBlocks(dateRanges);
    }

    // Function to update and display the reservation modal
    function displayReservationModal(selectedReservation) {
        const modal = document.querySelector('[data-element="reservationInfoModal"]');
        if (!modal) return;

        // Update modal information
        const nameElement = modal.querySelector('[data-element="reservationInfoModal_name"]');
        if (nameElement && selectedReservation._guest_user?.First_Name && selectedReservation._guest_user?.Last_Name) {
            nameElement.textContent = `${selectedReservation._guest_user.First_Name} ${selectedReservation._guest_user.Last_Name}`;
        }

        // Update property name
        const propertyNameElement = modal.querySelector('[data-element="reservationInfoModal_propertyName"]');
        if (propertyNameElement && selectedReservation._host_property[0]?.property_name) {
            propertyNameElement.textContent = selectedReservation._host_property[0]?.property_name;
        }

        const propertyDatesElement = modal.querySelector('[data-element="reservationInfoModal_dates"]');
        if (propertyDatesElement && selectedReservation.check_in && selectedReservation.check_out) {
            // Extract dates as YYYY-MM-DD
            const checkInStr = selectedReservation.check_in.split('T')[0];
            const checkOutStr = selectedReservation.check_out.split('T')[0];

            // Parse dates for display
            const checkInParts = checkInStr.split('-');
            const checkOutParts = checkOutStr.split('-');

            // Calculate number of nights using the date difference
            const checkInDate = new Date(checkInStr);
            const checkOutDate = new Date(checkOutStr);
            const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

            // Format for display (using month abbreviation and day)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const checkInMonth = months[parseInt(checkInParts[1]) - 1];
            const checkOutMonth = months[parseInt(checkOutParts[1]) - 1];
            const checkInDay = parseInt(checkInParts[2]);
            const checkOutDay = parseInt(checkOutParts[2]);

            // Check if the check-in and check-out months are different
            if (checkInParts[1] !== checkOutParts[1]) {
                propertyDatesElement.textContent = `${checkInMonth} ${checkInDay} – ${checkOutMonth} ${checkOutDay} (${nights} nights)`;
            } else {
                propertyDatesElement.textContent = `${checkInMonth} ${checkInDay} – ${checkOutDay} (${nights} nights)`;
            }
        }

        // Update current status
        const statusElement = modal.querySelector('[data-element="reservationInfoModal_currentStatus"]');
        if (statusElement && selectedReservation.check_in && selectedReservation.check_out) {
            // Check if reservation is cancelled
            if (selectedReservation.reservation_active === false) {
                statusElement.textContent = "Reservation Cancelled";
            } else {
                // Extract dates as YYYY-MM-DD
                const todayStr = new Date().toISOString().split('T')[0];
                const checkInStr = selectedReservation.check_in.split('T')[0];
                const checkOutStr = selectedReservation.check_out.split('T')[0];

                if (todayStr >= checkInStr && todayStr <= checkOutStr) {
                    statusElement.textContent = "Currently Hosting";
                } else {
                    statusElement.textContent = "Reservation Active";
                }
            }
        }

        const guestsPreviewElement = modal.querySelector('[data-element="reservationInfoModal_guestsPreview"]');
        if (guestsPreviewElement && selectedReservation.guests) {
            guestsPreviewElement.textContent = `${selectedReservation.guests} guests`;
        }
        const payoutPreviewElement = modal.querySelector('[data-element="reservationInfoModal_hostPayoutPreview"]');
        if (payoutPreviewElement && selectedReservation.nights_amount) {
            // Make sure all values exist and are numbers, defaulting to 0 if undefined
            const nightsAmount = parseFloat(selectedReservation.nights_amount) || 0;
            const cleaningFee = parseFloat(selectedReservation.cleaning_amount) || 0;
            const hostFee = parseFloat(selectedReservation.hostFee_amount) || 0;

            // Check if this is a cancelled reservation with a refund
            if (selectedReservation.cancelled_refundAmount && selectedReservation.cancelled_refundAmount !== 0) {
                payoutPreviewElement.textContent = `Payout: $0.00`;
            } else {
                const totalPayout = nightsAmount + cleaningFee - hostFee;
                // Format to 2 decimal places with thousands separator
                const formattedPayout = totalPayout.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                payoutPreviewElement.textContent = `Payout: $${formattedPayout}`;
            }
        }

        const messagingElement = modal.querySelector('[data-element="reservationInfoModal_proxyNumber"]');
        if (messagingElement && selectedReservation.twilio_proxy_number) {
            // Format the phone number as +X (XXX) XXX-XXXX
            const phoneNumber = selectedReservation.twilio_proxy_number;
            // Remove any non-digit characters
            const digitsOnly = phoneNumber.replace(/\D/g, '');

            // Check if we have enough digits to format
            if (digitsOnly.length >= 10) {
                // Extract parts of the phone number
                const countryCode = digitsOnly.length > 10 ? `+${digitsOnly.slice(0, digitsOnly.length - 10)}` : '+1';
                const areaCode = digitsOnly.slice(-10, -7);
                const firstPart = digitsOnly.slice(-7, -4);
                const secondPart = digitsOnly.slice(-4);

                // Format the phone number
                const formattedNumber = `${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
                messagingElement.textContent = formattedNumber;
            } else {
                // If the number doesn't have enough digits, display it as is
                messagingElement.textContent = phoneNumber;
            }
        }

        const checkInDateElement = modal.querySelector('[data-element="reservationInfoModal_checkIn"]');
        if (checkInDateElement && selectedReservation.check_in) {
            // Extract date as YYYY-MM-DD
            const checkInDate = selectedReservation.check_in.split('T')[0];

            // Parse date without creating Date objects
            const checkInYear = parseInt(checkInDate.substring(0, 4));
            const checkInMonth = parseInt(checkInDate.substring(5, 7)) - 1; // 0-based month index
            const checkInDay = parseInt(checkInDate.substring(8, 10));

            // Manually format the date
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const formattedDate = `${months[checkInMonth]} ${checkInDay}, ${checkInYear}`;

            checkInDateElement.textContent = formattedDate;
        }

        const checkOutDateElement = modal.querySelector('[data-element="reservationInfoModal_checkout"]');
        if (checkOutDateElement && selectedReservation.check_out) {
            // Extract date as YYYY-MM-DD
            const checkOutDate = selectedReservation.check_out.split('T')[0];

            // Parse date without creating Date objects
            const checkOutYear = parseInt(checkOutDate.substring(0, 4));
            const checkOutMonth = parseInt(checkOutDate.substring(5, 7)) - 1; // 0-based month index
            const checkOutDay = parseInt(checkOutDate.substring(8, 10));

            // Manually format the date
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const formattedDate = `${months[checkOutMonth]} ${checkOutDay}, ${checkOutYear}`;

            checkOutDateElement.textContent = formattedDate;
        }

        const guestsElement = modal.querySelector('[data-element="reservationInfoModal_guests"]');
        if (guestsElement) {
            let guestDetails = [];

            // Add adult guests if present
            if (selectedReservation.adult_guests && selectedReservation.adult_guests > 0) {
                guestDetails.push(`${selectedReservation.adult_guests} Adult${selectedReservation.adult_guests !== 1 ? 's' : ''}`);
            }

            // Add children if present
            if (selectedReservation.children_guests && selectedReservation.children_guests > 0) {
                guestDetails.push(`${selectedReservation.children_guests} Child${selectedReservation.children_guests !== 1 ? 'ren' : ''}`);
            }

            // Add infants if present
            if (selectedReservation.infant_guests && selectedReservation.infant_guests > 0) {
                guestDetails.push(`${selectedReservation.infant_guests} Infant${selectedReservation.infant_guests !== 1 ? 's' : ''}`);
            }

            // Add pets if present
            if (selectedReservation.pet_guests && selectedReservation.pet_guests > 0) {
                guestDetails.push(`${selectedReservation.pet_guests} Pet${selectedReservation.pet_guests !== 1 ? 's' : ''}`);
            }

            // If no specific guest details are available, fall back to total guests
            if (guestDetails.length === 0 && selectedReservation.guests) {
                guestsElement.textContent = `${selectedReservation.guests} guests`;
            } else {
                guestsElement.textContent = guestDetails.join(', ');
            }
        }

        const reservationCodeElement = modal.querySelector('[data-element="reservationInfoModal_reservationCode"]');
        if (reservationCodeElement && selectedReservation.reservation_code) {
            reservationCodeElement.textContent = `${selectedReservation.reservation_code}`;
        }

        const reservedOnElement = modal.querySelector('[data-element="reservationInfoModal_reservedOn"]');
        if (reservedOnElement && selectedReservation.created_at) {
            reservedOnElement.textContent = new Date(selectedReservation.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        const cancellationPolicyTypeElement = modal.querySelector('[data-element="reservationInfoModal_cancellationPolicyType"]');
        if (cancellationPolicyTypeElement && selectedReservation.cancellationPolicy_type) {
            let policyText = selectedReservation.cancellationPolicy_type;

            // Check if reservation is not active and has a cancellation refund date
            if (selectedReservation.reservation_active === false && selectedReservation.cancelled_refundDate) {
                // Extract the date in YYYY-MM-DD format
                const refundDateStr = selectedReservation.cancelled_refundDate.split('T')[0];

                // Parse the date components
                const [year, month, day] = refundDateStr.split('-').map(num => parseInt(num, 10));

                // Format the date as "Month Day, Year"
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const formattedRefundDate = `${months[month - 1]} ${day}, ${year}`;

                // Append the formatted date to the policy text
                policyText += ` - Cancelled on ${formattedRefundDate}`;
            }

            cancellationPolicyTypeElement.textContent = policyText;
        }

        const guestPaymentNightsTextElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_nightsText"]');
        if (guestPaymentNightsTextElement && selectedReservation.nights_amount) {
            // Use the reservation's check_in and check_out dates directly
            if (selectedReservation.check_in && selectedReservation.check_out) {
                // Extract dates as YYYY-MM-DD
                const checkInDate = selectedReservation.check_in.split('T')[0];
                const checkOutDate = selectedReservation.check_out.split('T')[0];

                // Calculate nights by using the date difference
                const date1 = new Date(checkInDate);
                const date2 = new Date(checkOutDate);
                const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

                // Calculate price per night
                const pricePerNight = selectedReservation.nights_amount / nightsStay;

                // Format the text to show price per night and total nights with accounting format
                const formattedPrice = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(pricePerNight);

                guestPaymentNightsTextElement.textContent = `${formattedPrice} x ${nightsStay} night${nightsStay !== 1 ? 's' : ''}`;
            }
        }

        const guestPaymentNightsTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_nightsTotal"]');
        if (guestPaymentNightsTotalElement && selectedReservation.nights_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedNightsTotal = selectedReservation.nights_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentNightsTotalElement.textContent = `$${formattedNightsTotal}`;
        }

        const guestPaymentCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_cleaningFeeTotal"]');
        if (guestPaymentCleaningFeeElement && selectedReservation.cleaning_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedCleaningFee = selectedReservation.cleaning_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
        }

        const guestPaymentServiceFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_guestServiceFeeTotal"]');
        if (guestPaymentServiceFeeElement && selectedReservation.serviceFee_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedServiceFee = selectedReservation.serviceFee_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentServiceFeeElement.textContent = `$${formattedServiceFee}`;
        }

        const guestPaymentSalesTaxElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_salesTaxTotal"]');
        if (guestPaymentSalesTaxElement && selectedReservation.sales_tax_amount && selectedReservation.sales_surTax_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedSalesTax = (selectedReservation.sales_tax_amount + selectedReservation.sales_surTax_amount).toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentSalesTaxElement.textContent = `$${formattedSalesTax}`;
        }

        const guestPaymentTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_total"]');
        if (guestPaymentTotalElement && selectedReservation.reservation_amount_total) {
            // Format to 2 decimal places with thousands separator
            const formattedTotal = selectedReservation.reservation_amount_total.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentTotalElement.textContent = `$${formattedTotal}`;
        }

        // Handle refund information for guest payment
        const guestPaymentRefundContainer = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundContainer"]');
        const guestPaymentRefundAmount = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundAmount"]');
        const guestPaymentRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundNewTotal"]');

        if (guestPaymentRefundContainer && guestPaymentRefundAmount && guestPaymentRefundNewTotal) {
            if (!selectedReservation.reservation_active || (selectedReservation.cancelled_refundAmount && selectedReservation.cancelled_refundAmount !== 0)) {
                // Show the refund container
                guestPaymentRefundContainer.style.display = 'flex';

                // Get the refund amount (default to 0 if not specified)
                const refundAmount = selectedReservation.cancelled_refundAmount || 0;

                // Format the refund amount
                const formattedRefund = refundAmount.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                guestPaymentRefundAmount.textContent = `- $${formattedRefund}`;

                // Calculate and format the new total
                const newTotal = selectedReservation.reservation_amount_total - refundAmount;
                const formattedNewTotal = newTotal.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                guestPaymentRefundNewTotal.textContent = `$${formattedNewTotal}`;
            } else {
                // Hide the refund container if reservation is active and no refund
                guestPaymentRefundContainer.style.display = 'none';
            }
        }

        const hostPayoutNightsTextElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_nightsText"]');
        if (hostPayoutNightsTextElement && selectedReservation.nights_amount) {
            // Use the reservation's check_in and check_out dates directly
            if (selectedReservation.check_in && selectedReservation.check_out) {
                // Extract dates as YYYY-MM-DD
                const checkInDate = selectedReservation.check_in.split('T')[0];
                const checkOutDate = selectedReservation.check_out.split('T')[0];

                // Calculate nights by using the date difference
                const date1 = new Date(checkInDate);
                const date2 = new Date(checkOutDate);
                const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

                // Calculate price per night
                const pricePerNight = selectedReservation.nights_amount / nightsStay;

                // Format the text to show price per night and total nights with accounting format
                const formattedPrice = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(pricePerNight);

                hostPayoutNightsTextElement.textContent = `${formattedPrice} x ${nightsStay} night${nightsStay !== 1 ? 's' : ''}`;
            }
        }
        const hostPayoutNightsTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_nightsTotal"]');
        if (hostPayoutNightsTotalElement && selectedReservation.nights_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedNightsTotal = selectedReservation.nights_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutNightsTotalElement.textContent = `$${formattedNightsTotal}`;
        }

        const hostPayoutCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_cleaningFeeTotal"]');
        if (hostPayoutCleaningFeeElement && selectedReservation.cleaning_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedCleaningFee = selectedReservation.cleaning_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
        }

        const hostPayoutHostFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_hostServiceFeeTotal"]');
        if (hostPayoutHostFeeElement && selectedReservation.hostFee_amount) {
            // Format to 2 decimal places with thousands separator
            const formattedHostFee = selectedReservation.hostFee_amount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutHostFeeElement.textContent = `- $${formattedHostFee}`;
        }

        const hostPayoutTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_payoutTotal"]');
        if (hostPayoutTotalElement) {
            // Calculate total as nightly total + cleaning fee - host fee
            const nightlyTotal = selectedReservation.nights_amount || 0;
            const cleaningFee = selectedReservation.cleaning_amount || 0;
            const hostFee = selectedReservation.hostFee_amount || 0;

            const calculatedTotal = nightlyTotal + cleaningFee - hostFee;

            // Format to 2 decimal places with thousands separator
            const formattedTotal = calculatedTotal.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutTotalElement.textContent = `$${formattedTotal}`;
        }
        // Handle refund information for host payout
        const hostPayoutRefundContainer = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundContainer"]');
        const hostPayoutRefundAmount = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundAmount"]');
        const hostPayoutRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundNewTotal"]');

        if (hostPayoutRefundContainer && hostPayoutRefundAmount && hostPayoutRefundNewTotal) {
            if (selectedReservation.reservation_active) {
                // Hide the refund container if reservation is active
                hostPayoutRefundContainer.style.display = 'none';
            } else {
                // Show the refund container
                hostPayoutRefundContainer.style.display = 'flex';

                // Calculate the host payout total
                const nightlyTotal = selectedReservation.nights_amount || 0;
                const cleaningFee = selectedReservation.cleaning_amount || 0;
                const hostFee = selectedReservation.hostFee_amount || 0;
                const calculatedTotal = nightlyTotal + cleaningFee - hostFee;

                // If refund amount is 0 or not specified, no money was refunded
                const refundAmount = (selectedReservation.cancelled_refundAmount && selectedReservation.cancelled_refundAmount !== 0)
                    ? calculatedTotal
                    : 0;

                // Format the refund amount
                const formattedRefund = refundAmount.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                hostPayoutRefundAmount.textContent = `- $${formattedRefund}`;

                // New total is the calculated total minus the refund amount
                const newTotal = calculatedTotal - refundAmount;
                const formattedNewTotal = newTotal.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                hostPayoutRefundNewTotal.textContent = `$${formattedNewTotal}`;
            }
        }

        const helpCenterButton = modal.querySelector('[data-element="reservationInfoModal_helpCenterButton"]');
        if (helpCenterButton) {
            helpCenterButton.addEventListener('click', () => {
                window.open('https://www.keysbooking.com/help', '_blank');
            });
        }










        // Get the modal content element and scroll it to the top
        const modalContent = modal.querySelector('[data-element="reservationInfoModal_content"]');
        if (modalContent) {
            // Force scroll to top with a slight delay to ensure it works when reopening the modal
            modalContent.scrollTop = 0;
            setTimeout(() => {
                modalContent.scrollTop = 0;
            }, 50);

            // Make scrollbar always visible
            modalContent.style.overflowY = 'scroll';
        }

        // Show the modal
        modal.style.display = 'flex';
    }



    // Function to setup the toolbar with property data
    function setupToolbar(propertyData) {
        if (!propertyData) return;

        propertyId = propertyData.id;

        // Setup base price display
        updateToolbarBasePrice(propertyData.nightlyPrice);

        // Setup base price edit functionality
        setupBasePriceEdit(propertyData.nightlyPrice, propertyData.id);

        // Setup cleaning fee display
        updateToolbarCleaningFee(propertyData.cleaning_fee);

        // Setup cleaning fee edit functionality
        setupCleaningFeeEdit(propertyData.cleaning_fee, propertyData.id);

        // Setup trip length display
        updateToolbarTripLength(propertyData.min_nights, propertyData.max_nights);

        // Setup trip length edit functionality
        setupTripLengthEdit(propertyData.min_nights, propertyData.max_nights, propertyData.id);

        // Setup advance notice display
        updateToolbarAdvanceNotice(propertyData.advanceNotice);

        // Setup advance notice edit functionality
        setupAdvanceNoticeEdit(propertyData.advanceNotice, propertyData.id);

        // Setup availability window display
        updateToolbarAvailabilityWindow(propertyData.availabilityWindow_months);

        // Setup availability window edit functionality
        setupAvailabilityWindowEdit(propertyData.availabilityWindow_months, propertyData.id);

        // Setup connect calendar display
        updateToolbarConnectCalendar(propertyData.is_synced, propertyData.calendar_url);

        // Setup connect calendar edit functionality
        setupConnectCalendarEdit(propertyData.is_synced, propertyData.calendar_sync_endpoint, propertyData.id, propertyData._property_icals);

        setupEditDatesFeature(propertyId, propertyData);

    }

    // Function to update the base price display in the toolbar
    function updateToolbarBasePrice(price) {
        const basePriceElement = document.querySelector('[data-element="toolbar_basePrice_price"]');
        if (basePriceElement && price !== undefined) {
            basePriceElement.textContent = `$${price}`;
        }
    }

    // Function to setup the base price edit functionality
    function setupBasePriceEdit(currentPrice, propertyId) {
        const basePriceContainer = document.querySelector('[data-element="toolbar_basePrice"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const basePriceEditContainer = document.querySelector('[data-element="toolbarEdit_basePrice"]');
        const basePriceInput = document.querySelector('[data-element="toolbarEdit_basePrice_input"]');
        const basePriceSaveButton = document.querySelector('[data-element="toolbarEdit_basePrice_saveButton"]');
        const basePriceSaveButtonText = document.querySelector('[data-element="toolbarEdit_basePrice_saveButtonText"]');
        const basePriceSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_basePrice_saveButtonLoader"]');
        const basePriceCancelButton = document.querySelector('[data-element="toolbarEdit_basePrice_cancel"]');
        const basePriceExitButton = document.querySelector('[data-element="toolbarEdit_basePrice_exit"]');

        if (!basePriceContainer || !toolbar || !basePriceEditContainer || !basePriceInput) return;

        // Remove any existing event listeners by cloning and replacing elements
        const newBasePriceContainer = basePriceContainer.cloneNode(true);
        basePriceContainer.parentNode.replaceChild(newBasePriceContainer, basePriceContainer);

        const newBasePriceSaveButton = basePriceSaveButton ? basePriceSaveButton.cloneNode(true) : null;
        if (basePriceSaveButton && newBasePriceSaveButton) {
            basePriceSaveButton.parentNode.replaceChild(newBasePriceSaveButton, basePriceSaveButton);
        }

        const newBasePriceCancelButton = basePriceCancelButton ? basePriceCancelButton.cloneNode(true) : null;
        if (basePriceCancelButton && newBasePriceCancelButton) {
            basePriceCancelButton.parentNode.replaceChild(newBasePriceCancelButton, basePriceCancelButton);
        }

        const newBasePriceExitButton = basePriceExitButton ? basePriceExitButton.cloneNode(true) : null;
        if (basePriceExitButton && newBasePriceExitButton) {
            basePriceExitButton.parentNode.replaceChild(newBasePriceExitButton, basePriceExitButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedBasePriceSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_basePrice_saveButtonLoader"]');
        const updatedBasePriceSaveButtonText = document.querySelector('[data-element="toolbarEdit_basePrice_saveButtonText"]');

        // hide basePriceSaveButtonLoader
        if (updatedBasePriceSaveButtonLoader) updatedBasePriceSaveButtonLoader.style.display = 'none';

        // Show edit container when base price is clicked
        newBasePriceContainer.addEventListener('click', function () {
            toolbar.style.display = 'none';
            basePriceEditContainer.style.display = 'flex';

            // Set the current price in the input field with $ prefix
            basePriceInput.value = `$${currentPrice}`;

            // Position cursor at the end of the input
            setTimeout(() => {
                basePriceInput.focus();
                basePriceInput.selectionStart = basePriceInput.value.length;
                basePriceInput.selectionEnd = basePriceInput.value.length;
            }, 0);
        });

        // Ensure $ is always present in the input and only allow numbers
        basePriceInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters except $
            this.value = this.value.replace(/[^0-9$]/g, '');

            // Ensure $ is at the beginning
            if (!this.value.startsWith('$')) {
                this.value = '$' + this.value.replace(/\$/g, '');
            } else {
                // If there are multiple $ signs, keep only the first one
                const parts = this.value.split('$');
                if (parts.length > 2) {
                    this.value = '$' + parts.slice(1).join('');
                }
            }
        });

        // Handle save button click
        if (newBasePriceSaveButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newBasePriceSaveButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) return;

                // Extract the numeric value (remove $ and any non-numeric characters)
                const newPrice = parseFloat(basePriceInput.value.replace('$', '').trim());

                // Check if the input has a valid integer value
                if (!isNaN(newPrice) && Number.isFinite(newPrice) && basePriceInput.value.replace('$', '').trim() !== '') {
                    // Set saving flag to true
                    isSaving = true;

                    // Show loader and hide text
                    if (updatedBasePriceSaveButtonLoader) updatedBasePriceSaveButtonLoader.style.display = 'flex';
                    if (updatedBasePriceSaveButtonText) updatedBasePriceSaveButtonText.style.display = 'none';

                    try {
                        // Make API call to save the new price
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_basePrice', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                basePrice: newPrice,
                                property_id: propertyId
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        // Update the displayed price
                        updateToolbarBasePrice(newPrice);

                        // Hide edit container and show toolbar
                        basePriceEditContainer.style.display = 'none';
                        toolbar.style.display = 'flex';
                        console.log('TOOLBAR SET TO FLEX: basePriceEditContainer.style.display = none');

                        // Re-fetch calendar data for the currently selected property
                        // This ensures we stay on the same property after updating
                        fetchCalendarData(propertyId);

                    } catch (error) {
                        console.error('Error saving base price:', error);
                        alert('Failed to save the new price. Please try again.');
                    } finally {
                        // Hide loader and show text regardless of outcome
                        if (updatedBasePriceSaveButtonLoader) updatedBasePriceSaveButtonLoader.style.display = 'none';
                        if (updatedBasePriceSaveButtonText) updatedBasePriceSaveButtonText.style.display = 'flex';
                        // Reset saving flag
                        isSaving = false;
                    }
                } else {
                    alert('Please enter a valid price');
                }
            });
        }

        // Handle cancel button click
        if (newBasePriceCancelButton) {
            newBasePriceCancelButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                basePriceEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: basePriceCancelButton.addEventListener - no selected dates');
            });
        }

        // Handle exit button click
        if (newBasePriceExitButton) {
            newBasePriceExitButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                basePriceEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: basePriceExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to update the cleaning fee display in the toolbar
    function updateToolbarCleaningFee(price) {
        const cleaningFeeElement = document.querySelector('[data-element="toolbar_cleaningFee_price"]');
        if (cleaningFeeElement && price !== undefined) {
            cleaningFeeElement.textContent = `$${price}`;
        }
    }

    // Function to setup the cleaning fee edit functionality
    function setupCleaningFeeEdit(currentPrice, propertyId) {
        const cleaningFeeContainer = document.querySelector('[data-element="toolbar_cleaningFee"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const cleaningFeeEditContainer = document.querySelector('[data-element="toolbarEdit_cleaningFee"]');
        const cleaningFeeInput = document.querySelector('[data-element="toolbarEdit_cleaningFee_input"]');
        const cleaningFeeSaveButton = document.querySelector('[data-element="toolbarEdit_cleaningFee_saveButton"]');
        const cleaningFeeSaveButtonText = document.querySelector('[data-element="toolbarEdit_cleaningFee_saveButtonText"]');
        const cleaningFeeSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_cleaningFee_saveButtonLoader"]');
        const cleaningFeeCancelButton = document.querySelector('[data-element="toolbarEdit_cleaningFee_cancel"]');
        const cleaningFeeExitButton = document.querySelector('[data-element="toolbarEdit_cleaningFee_exit"]');

        if (!cleaningFeeContainer || !toolbar || !cleaningFeeEditContainer || !cleaningFeeInput) return;

        // Remove any existing event listeners by cloning and replacing elements
        const newCleaningFeeContainer = cleaningFeeContainer.cloneNode(true);
        cleaningFeeContainer.parentNode.replaceChild(newCleaningFeeContainer, cleaningFeeContainer);

        const newCleaningFeeSaveButton = cleaningFeeSaveButton ? cleaningFeeSaveButton.cloneNode(true) : null;
        if (cleaningFeeSaveButton && newCleaningFeeSaveButton) {
            cleaningFeeSaveButton.parentNode.replaceChild(newCleaningFeeSaveButton, cleaningFeeSaveButton);
        }

        const newCleaningFeeCancelButton = cleaningFeeCancelButton ? cleaningFeeCancelButton.cloneNode(true) : null;
        if (cleaningFeeCancelButton && newCleaningFeeCancelButton) {
            cleaningFeeCancelButton.parentNode.replaceChild(newCleaningFeeCancelButton, cleaningFeeCancelButton);
        }

        const newCleaningFeeExitButton = cleaningFeeExitButton ? cleaningFeeExitButton.cloneNode(true) : null;
        if (cleaningFeeExitButton && newCleaningFeeExitButton) {
            cleaningFeeExitButton.parentNode.replaceChild(newCleaningFeeExitButton, cleaningFeeExitButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedCleaningFeeSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_cleaningFee_saveButtonLoader"]');
        const updatedCleaningFeeSaveButtonText = document.querySelector('[data-element="toolbarEdit_cleaningFee_saveButtonText"]');

        // hide cleaningFeeSaveButtonLoader
        if (updatedCleaningFeeSaveButtonLoader) updatedCleaningFeeSaveButtonLoader.style.display = 'none';

        // Show edit container when cleaning fee is clicked
        newCleaningFeeContainer.addEventListener('click', function () {
            toolbar.style.display = 'none';
            cleaningFeeEditContainer.style.display = 'flex';

            // Set the current price in the input field with $ prefix
            cleaningFeeInput.value = `$${currentPrice}`;

            // Position cursor at the end of the input
            setTimeout(() => {
                cleaningFeeInput.focus();
                cleaningFeeInput.selectionStart = cleaningFeeInput.value.length;
                cleaningFeeInput.selectionEnd = cleaningFeeInput.value.length;
            }, 0);
        });

        // Ensure $ is always present in the input and only allow numbers
        cleaningFeeInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters except $
            this.value = this.value.replace(/[^0-9$]/g, '');

            // Ensure $ is at the beginning
            if (!this.value.startsWith('$')) {
                this.value = '$' + this.value.replace(/\$/g, '');
            } else {
                // If there are multiple $ signs, keep only the first one
                const parts = this.value.split('$');
                if (parts.length > 2) {
                    this.value = '$' + parts.slice(1).join('');
                }
            }
        });

        // Handle save button click
        if (newCleaningFeeSaveButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newCleaningFeeSaveButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) return;

                // Extract the numeric value (remove $ and any non-numeric characters)
                const newPrice = parseFloat(cleaningFeeInput.value.replace('$', '').trim());

                // Check if the input has a valid integer value
                if (!isNaN(newPrice) && Number.isFinite(newPrice) && cleaningFeeInput.value.replace('$', '').trim() !== '') {
                    // Set saving flag to true
                    isSaving = true;

                    // Show loader and hide text
                    if (updatedCleaningFeeSaveButtonLoader) updatedCleaningFeeSaveButtonLoader.style.display = 'flex';
                    if (updatedCleaningFeeSaveButtonText) updatedCleaningFeeSaveButtonText.style.display = 'none';

                    try {
                        // Make API call to save the new price
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_cleaningFee', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                cleaningFee: newPrice,
                                property_id: propertyId
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        // Update the displayed price
                        updateToolbarCleaningFee(newPrice);

                        // Hide edit container and show toolbar
                        cleaningFeeEditContainer.style.display = 'none';
                        toolbar.style.display = 'flex';
                        console.log('TOOLBAR SET TO FLEX: cleaningFeeEditContainer.style.display = none');

                        // Re-fetch calendar data for the currently selected property
                        // This ensures we stay on the same property after updating
                        fetchCalendarData(propertyId);

                    } catch (error) {
                        console.error('Error saving cleaning fee:', error);
                        alert('Failed to save the new cleaning fee. Please try again.');
                    } finally {
                        // Hide loader and show text regardless of outcome
                        if (updatedCleaningFeeSaveButtonLoader) updatedCleaningFeeSaveButtonLoader.style.display = 'none';
                        if (updatedCleaningFeeSaveButtonText) updatedCleaningFeeSaveButtonText.style.display = 'flex';
                        // Reset saving flag
                        isSaving = false;
                    }
                } else {
                    alert('Please enter a valid price');
                }
            });
        }

        // Handle cancel button click
        if (newCleaningFeeCancelButton) {
            newCleaningFeeCancelButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                cleaningFeeEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newCleaningFeeCancelButton.addEventListener - no selected dates');
            });
        }

        // Handle exit button click
        if (newCleaningFeeExitButton) {
            newCleaningFeeExitButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                cleaningFeeEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newCleaningFeeExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to update the trip length display in the toolbar
    function updateToolbarTripLength(minNights, maxNights) {
        const tripLengthElement = document.querySelector('[data-element="toolbar_tripLength_nights"]');
        if (tripLengthElement && minNights !== undefined && maxNights !== undefined) {
            tripLengthElement.textContent = `${minNights} - ${maxNights} Nights`;
        }
    }

    // Function to setup the trip length edit functionality
    function setupTripLengthEdit(currentMinNights, currentMaxNights, propertyId) {

        const tripLengthContainer = document.querySelector('[data-element="toolbar_tripLength"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const tripLengthEditContainer = document.querySelector('[data-element="toolbarEdit_tripLength"]');
        const tripLengthMinInput = document.querySelector('[data-element="toolbarEdit_tripLength_min_input"]');
        const tripLengthMaxInput = document.querySelector('[data-element="toolbarEdit_tripLength_max_input"]');
        const tripLengthSaveButton = document.querySelector('[data-element="toolbarEdit_tripLength_saveButton"]');
        const tripLengthSaveButtonText = document.querySelector('[data-element="toolbarEdit_tripLength_saveButtonText"]');
        const tripLengthSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_tripLength_saveButtonLoader"]');
        const tripLengthCancelButton = document.querySelector('[data-element="toolbarEdit_tripLength_cancel"]');
        const tripLengthExitButton = document.querySelector('[data-element="toolbarEdit_tripLength_exit"]');

        if (!tripLengthContainer || !toolbar || !tripLengthEditContainer || !tripLengthMinInput || !tripLengthMaxInput) {
            console.error('Missing required elements for trip length edit');
            return;
        }

        // Remove any existing event listeners by cloning and replacing elements
        const newTripLengthContainer = tripLengthContainer.cloneNode(true);
        tripLengthContainer.parentNode.replaceChild(newTripLengthContainer, tripLengthContainer);

        const newTripLengthSaveButton = tripLengthSaveButton ? tripLengthSaveButton.cloneNode(true) : null;
        if (tripLengthSaveButton && newTripLengthSaveButton) {
            tripLengthSaveButton.parentNode.replaceChild(newTripLengthSaveButton, tripLengthSaveButton);
        }

        const newTripLengthCancelButton = tripLengthCancelButton ? tripLengthCancelButton.cloneNode(true) : null;
        if (tripLengthCancelButton && newTripLengthCancelButton) {
            tripLengthCancelButton.parentNode.replaceChild(newTripLengthCancelButton, tripLengthCancelButton);
        }

        const newTripLengthExitButton = tripLengthExitButton ? tripLengthExitButton.cloneNode(true) : null;
        if (tripLengthExitButton && newTripLengthExitButton) {
            tripLengthExitButton.parentNode.replaceChild(newTripLengthExitButton, tripLengthExitButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedTripLengthSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_tripLength_saveButtonLoader"]');
        const updatedTripLengthSaveButtonText = document.querySelector('[data-element="toolbarEdit_tripLength_saveButtonText"]');

        // hide tripLengthSaveButtonLoader
        if (updatedTripLengthSaveButtonLoader) updatedTripLengthSaveButtonLoader.style.display = 'none';

        // Show edit container when trip length is clicked
        newTripLengthContainer.addEventListener('click', function () {
            toolbar.style.display = 'none';
            tripLengthEditContainer.style.display = 'flex';

            // Set the current min and max nights in the input fields
            tripLengthMinInput.value = currentMinNights;
            tripLengthMaxInput.value = currentMaxNights;

            // Position cursor at the end of the min input
            setTimeout(() => {
                tripLengthMinInput.focus();
                tripLengthMinInput.selectionStart = tripLengthMinInput.value.length;
                tripLengthMinInput.selectionEnd = tripLengthMinInput.value.length;
            }, 0);
        });

        // Only allow numbers in the inputs and enforce max value of 999
        tripLengthMinInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, '');

            // Ensure value is less than 1000
            if (parseInt(this.value) >= 1000) {
                this.value = '999';
            }
        });

        tripLengthMaxInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, '');

            // Ensure value is less than 1000
            if (parseInt(this.value) >= 1000) {
                this.value = '999';
            }
        });

        // Handle save button click
        if (newTripLengthSaveButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newTripLengthSaveButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) {
                    return;
                }

                // Extract the numeric values
                const newMinNights = parseInt(tripLengthMinInput.value.trim());
                const newMaxNights = parseInt(tripLengthMaxInput.value.trim());

                // Check if the inputs have valid integer values
                if (!isNaN(newMinNights) && !isNaN(newMaxNights) &&
                    Number.isFinite(newMinNights) && Number.isFinite(newMaxNights) &&
                    tripLengthMinInput.value.trim() !== '' && tripLengthMaxInput.value.trim() !== '' &&
                    newMinNights <= newMaxNights) {

                    // Set saving flag to true
                    isSaving = true;

                    // Show loader and hide text
                    if (updatedTripLengthSaveButtonLoader) updatedTripLengthSaveButtonLoader.style.display = 'flex';
                    if (updatedTripLengthSaveButtonText) updatedTripLengthSaveButtonText.style.display = 'none';

                    try {
                        // Make API call to save the new trip length
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_tripLength', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                minNights: newMinNights,
                                maxNights: newMaxNights,
                                property_id: propertyId
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        // Update the displayed trip length
                        updateToolbarTripLength(newMinNights, newMaxNights);

                        // Hide edit container and show toolbar
                        tripLengthEditContainer.style.display = 'none';
                        toolbar.style.display = 'flex';
                        console.log('TOOLBAR SET TO FLEX: tripLengthEditContainer.style.display = none');

                        // Re-fetch calendar data for the currently selected property
                        // This ensures we stay on the same property after updating
                        fetchCalendarData(propertyId);

                    } catch (error) {
                        console.error('Error saving trip length:', error);
                        alert('Failed to save the new trip length. Please try again.');
                    } finally {
                        // Hide loader and show text regardless of outcome
                        if (updatedTripLengthSaveButtonLoader) updatedTripLengthSaveButtonLoader.style.display = 'none';
                        if (updatedTripLengthSaveButtonText) updatedTripLengthSaveButtonText.style.display = 'flex';
                        // Reset saving flag
                        isSaving = false;
                    }
                } else {
                    if (newMinNights > newMaxNights) {
                        alert('Minimum nights cannot be greater than maximum nights');
                    } else {
                        alert('Please enter valid numbers for minimum and maximum nights');
                    }
                }
            });
        }

        // Handle cancel button click
        if (newTripLengthCancelButton) {
            newTripLengthCancelButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                tripLengthEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newTripLengthCancelButton.addEventListener - no selected dates');
            });
        }

        // Handle exit button click
        if (newTripLengthExitButton) {
            newTripLengthExitButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                tripLengthEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newTripLengthExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to update the advance notice display in the toolbar
    function updateToolbarAdvanceNotice(days) {
        const advanceNoticeElement = document.querySelector('[data-element="toolbar_advanceNotice_text"]');
        if (advanceNoticeElement && days !== undefined) {
            advanceNoticeElement.textContent = days === 1 ? `${days} Day` : `${days} Days`;
        }
    }

    // Function to setup the advance notice edit functionality
    function setupAdvanceNoticeEdit(currentDays, propertyId) {
        const advanceNoticeContainer = document.querySelector('[data-element="toolbar_advanceNotice"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const advanceNoticeEditContainer = document.querySelector('[data-element="toolbarEdit_advanceNotice"]');
        const advanceNoticeInput = document.querySelector('[data-element="toolbarEdit_advanceNotice_input"]');
        const advanceNoticeSaveButton = document.querySelector('[data-element="toolbarEdit_advanceNotice_saveButton"]');
        const advanceNoticeSaveButtonText = document.querySelector('[data-element="toolbarEdit_advanceNotice_saveButtonText"]');
        const advanceNoticeSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_advanceNotice_saveButtonLoader"]');
        const advanceNoticeCancelButton = document.querySelector('[data-element="toolbarEdit_advanceNotice_cancel"]');
        const advanceNoticeExitButton = document.querySelector('[data-element="toolbarEdit_advanceNotice_exit"]');
        const advanceNoticeSubText = document.querySelector('[data-element="toolbarEdit_advanceNotice_subText"]');

        if (!advanceNoticeContainer || !toolbar || !advanceNoticeEditContainer || !advanceNoticeInput) return;

        // Remove any existing event listeners by cloning and replacing elements
        const newAdvanceNoticeContainer = advanceNoticeContainer.cloneNode(true);
        advanceNoticeContainer.parentNode.replaceChild(newAdvanceNoticeContainer, advanceNoticeContainer);

        const newAdvanceNoticeSaveButton = advanceNoticeSaveButton ? advanceNoticeSaveButton.cloneNode(true) : null;
        if (advanceNoticeSaveButton && newAdvanceNoticeSaveButton) {
            advanceNoticeSaveButton.parentNode.replaceChild(newAdvanceNoticeSaveButton, advanceNoticeSaveButton);
        }

        const newAdvanceNoticeCancelButton = advanceNoticeCancelButton ? advanceNoticeCancelButton.cloneNode(true) : null;
        if (advanceNoticeCancelButton && newAdvanceNoticeCancelButton) {
            advanceNoticeCancelButton.parentNode.replaceChild(newAdvanceNoticeCancelButton, advanceNoticeCancelButton);
        }

        const newAdvanceNoticeExitButton = advanceNoticeExitButton ? advanceNoticeExitButton.cloneNode(true) : null;
        if (advanceNoticeExitButton && newAdvanceNoticeExitButton) {
            advanceNoticeExitButton.parentNode.replaceChild(newAdvanceNoticeExitButton, advanceNoticeExitButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedAdvanceNoticeSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_advanceNotice_saveButtonLoader"]');
        const updatedAdvanceNoticeSaveButtonText = document.querySelector('[data-element="toolbarEdit_advanceNotice_saveButtonText"]');
        const updatedAdvanceNoticeSubText = document.querySelector('[data-element="toolbarEdit_advanceNotice_subText"]');

        // hide advanceNoticeSaveButtonLoader
        if (updatedAdvanceNoticeSaveButtonLoader) updatedAdvanceNoticeSaveButtonLoader.style.display = 'none';

        // Update subText based on current days
        if (updatedAdvanceNoticeSubText) {
            updatedAdvanceNoticeSubText.textContent = currentDays === 1 ? 'Day' : 'Days';
        }

        // Show edit container when advance notice is clicked
        newAdvanceNoticeContainer.addEventListener('click', function () {
            toolbar.style.display = 'none';
            advanceNoticeEditContainer.style.display = 'flex';

            // Set the current days in the input field
            advanceNoticeInput.value = currentDays;

            // Position cursor at the end of the input
            setTimeout(() => {
                advanceNoticeInput.focus();
                advanceNoticeInput.selectionStart = advanceNoticeInput.value.length;
                advanceNoticeInput.selectionEnd = advanceNoticeInput.value.length;
            }, 0);
        });

        // Only allow numbers in the input
        advanceNoticeInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, '');

            // Limit to values less than 100
            const numValue = parseInt(this.value) || 0;
            if (numValue >= 100) {
                this.value = '99';
            }

            // Update subText based on input value
            if (updatedAdvanceNoticeSubText) {
                const days = parseInt(this.value) || 0;
                updatedAdvanceNoticeSubText.textContent = days === 1 ? 'Day' : 'Days';
            }
        });

        // Handle save button click
        if (newAdvanceNoticeSaveButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newAdvanceNoticeSaveButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) return;

                // Extract the numeric value
                const newDays = parseInt(advanceNoticeInput.value.trim());

                // Check if the input has a valid integer value and is less than 100
                if (!isNaN(newDays) && Number.isFinite(newDays) && advanceNoticeInput.value.trim() !== '' && newDays < 100) {
                    // Set saving flag to true
                    isSaving = true;

                    // Show loader and hide text
                    if (updatedAdvanceNoticeSaveButtonLoader) updatedAdvanceNoticeSaveButtonLoader.style.display = 'flex';
                    if (updatedAdvanceNoticeSaveButtonText) updatedAdvanceNoticeSaveButtonText.style.display = 'none';

                    try {
                        // Make API call to save the new advance notice
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_advanceNotice', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                advanceNotice: newDays,
                                property_id: propertyId
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        // Update the displayed advance notice
                        updateToolbarAdvanceNotice(newDays);

                        // Hide edit container and show toolbar
                        advanceNoticeEditContainer.style.display = 'none';
                        toolbar.style.display = 'flex';
                        console.log('TOOLBAR SET TO FLEX: newAvailabilityWindowSaveButton.addEventListener - no selected dates');

                        // Re-fetch calendar data for the currently selected property
                        // This ensures we stay on the same property after updating
                        fetchCalendarData(propertyId);

                    } catch (error) {
                        alert('Failed to save the new advance notice. Please try again.');
                    } finally {
                        // Hide loader and show text regardless of outcome
                        if (updatedAdvanceNoticeSaveButtonLoader) updatedAdvanceNoticeSaveButtonLoader.style.display = 'none';
                        if (updatedAdvanceNoticeSaveButtonText) updatedAdvanceNoticeSaveButtonText.style.display = 'flex';
                        // Reset saving flag
                        isSaving = false;
                    }
                } else {
                    alert('Please enter a valid number of days (less than 100)');
                }
            });
        }

        // Handle cancel button click
        if (newAdvanceNoticeCancelButton) {
            newAdvanceNoticeCancelButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                advanceNoticeEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newAdvanceNoticeCancelButton.addEventListener - no selected dates');
            });
        }

        // Handle exit button click
        if (newAdvanceNoticeExitButton) {
            newAdvanceNoticeExitButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                advanceNoticeEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newAdvanceNoticeExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to update the connect calendar display in the toolbar
    function updateToolbarConnectCalendar(isSynced, calendarUrl) {
        const connectCalendarElement = document.querySelector('[data-element="toolbar_connectCalendar_text"]');
        if (connectCalendarElement) {
            connectCalendarElement.textContent = isSynced ? 'Connected' : 'Not Connected';
        }

        // If we have additional elements to display calendar URL, update them here
        const calendarUrlElement = document.querySelector('[data-element="toolbar_connectCalendar_url"]');
        if (calendarUrlElement && isSynced && calendarUrl) {
            calendarUrlElement.textContent = calendarUrl;
            calendarUrlElement.style.display = 'block';
        } else if (calendarUrlElement) {
            calendarUrlElement.style.display = 'none';
        }
    }

    // Function to setup the connect calendar edit functionality
    function setupConnectCalendarEdit(isSynced, calendarUrl, propertyId, propertyIcals) {
        console.log('Setting up connect calendar edit with propertyIcals:', propertyIcals);

        const connectCalendarContainer = document.querySelector('[data-element="toolbar_connectCalendar"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const connectCalendarEditContainer = document.querySelector('[data-element="toolbarEdit_connectCalendar"]');
        const connectCalendarExitButton = document.querySelector('[data-element="toolbarEdit_connectCalendar_exit"]');
        const connectCalendarCancelButton = document.querySelector('[data-element="toolbarEdit_connectCalendar_cancel"]');
        const connectCalendarSubmitButton = document.querySelector('[data-element="toolbarEdit_connectCalendar_submit"]');
        const connectCalendarSubmitText = document.querySelector('[data-element="toolbarEdit_connectCalendar_submit_text"]');
        const connectCalendarSubmitLoader = document.querySelector('[data-element="toolbarEdit_connectCalendar_submit_loader"]');
        const connectCalendarAddSyncButton = document.querySelector('[data-element="toolbarEdit_connectCalender_addSync_button"]');
        const connectCalendarAddSyncContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_addSync"]');
        const connectCalendarInputContainer = document.querySelector('[data-element="toolbarEdit_connectCalendar_inputContainer"]');
        const copyLinkContainer = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer"]');
        const copyLinkText = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer_text"]');
        const copyLinkButton = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer_copyUrl"]');
        const syncedContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_syncedContainer"]');
        const syncedContainerSection = document.querySelector('[data-element="toolbarEdit_connectCalender_syncedContainerSection"]');
        const connectCalendarBody = document.querySelector('[data-element="toolbarEdit_connectCalender_body"]');


        if (!connectCalendarContainer || !toolbar || !connectCalendarEditContainer) {
            console.error('Missing required elements for connect calendar edit');
            return;
        }

        // Set placeholders for input fields
        const calendarNameInput = document.querySelector('[data-element="toolbarEdit_connectCalendar_name_inputContainer"]');
        if (calendarNameInput) {
            calendarNameInput.placeholder = "Calendar name";
        }

        if (connectCalendarInputContainer) {
            connectCalendarInputContainer.placeholder = "External website link";
        }

        // Handle synced calendars container based on propertyIcals length
        if (syncedContainer && syncedContainerSection) {
            // First, remove all existing synced containers
            const existingSyncedContainers = document.querySelectorAll('[data-element="toolbarEdit_connectCalender_syncedContainer"]');
            console.log('Found existing synced containers:', existingSyncedContainers.length);
            existingSyncedContainers.forEach(container => {
                if (container !== syncedContainer) { // Keep the original for cloning
                    container.remove();
                }
            });

            // If there are no synced calendars, hide the original container
            if (!propertyIcals || propertyIcals.length === 0) {
                console.log('No propertyIcals found, hiding synced container');
                syncedContainer.style.display = 'none';
            } else {
                console.log('Found propertyIcals:', propertyIcals.length);
                // Show the original for the first calendar
                syncedContainer.style.display = 'flex';

                // Clone and append additional containers for each additional calendar
                if (propertyIcals.length > 1) {
                    console.log('Cloning synced containers for additional calendars:', propertyIcals.length - 1);
                    for (let i = 1; i < propertyIcals.length; i++) {
                        const clonedContainer = syncedContainer.cloneNode(true);
                        syncedContainerSection.appendChild(clonedContainer);
                    }
                }

                // Now populate all containers with data
                const allSyncedContainers = document.querySelectorAll('[data-element="toolbarEdit_connectCalender_syncedContainer"]');
                console.log('Total synced containers after cloning:', allSyncedContainers.length);
                propertyIcals.forEach((ical, index) => {
                    if (index < allSyncedContainers.length) {
                        const container = allSyncedContainers[index];
                        console.log(`Populating container ${index} with ical:`, ical);

                        // Add data attributes for edit functionality and set up edit button
                        container.setAttribute('data-calendar-id', ical.id || '');
                        container.setAttribute('data-calendar-name', ical.calendar_name || '');
                        container.setAttribute('data-calendar-url', ical.calendar_url || '');

                        // Setup edit button click handler
                        const editButton = container.querySelector('[data-element="toolbarEdit_connectCalender_synced_editButton"]');
                        if (editButton) {
                            // Remove any existing click handler by cloning the button
                            const newEditButton = editButton.cloneNode(true);
                            editButton.parentNode.replaceChild(newEditButton, editButton);

                            // Add click handler to the new button
                            newEditButton.addEventListener('click', function (e) {
                                e.stopPropagation(); // Prevent event bubbling

                                // Get the edit sync container and body container
                                const editSyncContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync"]');
                                const bodyContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_body"]');

                                if (editSyncContainer && bodyContainer) {
                                    // Get calendar data from container attributes
                                    const calendarId = container.getAttribute('data-calendar-id');
                                    const calendarName = container.getAttribute('data-calendar-name');
                                    const calendarUrl = container.getAttribute('data-calendar-url');

                                    // Fill in the edit form with calendar data
                                    const nameInput = editSyncContainer.querySelector('[data-element="toolbarEdit_connectCalender_editSync_name"]');
                                    const linkInput = editSyncContainer.querySelector('[data-element="toolbarEdit_connectCalender_editSync_link"]');

                                    if (nameInput) nameInput.value = calendarName || '';
                                    if (linkInput) linkInput.value = calendarUrl || '';

                                    // Store the calendar ID in a data attribute for later use
                                    editSyncContainer.setAttribute('data-editing-calendar-id', calendarId || '');

                                    // Hide body and show edit form
                                    bodyContainer.style.display = 'none';
                                    editSyncContainer.style.display = 'flex';
                                }
                            });
                        }

                        // Add calendar name to the synced container
                        const nameElement = container.querySelector('[data-element="toolbarEdit_connectCalender_synced_name"]');
                        if (nameElement && ical.calendar_name) {
                            nameElement.textContent = ical.calendar_name;
                            console.log(`Set calendar name for container ${index}:`, ical.calendar_name);
                        } else {
                            console.warn(`Could not set calendar name for container ${index}. nameElement:`, !!nameElement, 'ical.calendar_name:', ical.calendar_name);
                        }

                        // Add last updated date to the synced container
                        const lastUpdatedElement = container.querySelector('[data-element="toolbarEdit_connectCalender_synced_lastUpdated"]');
                        if (lastUpdatedElement) {
                            // First check if last_updated exists
                            if (ical.last_updated) {
                                // Parse the date from the ical data
                                const lastSyncedDate = new Date(ical.last_updated);

                                // Format the date as "Last updated on Month Day, Year at Hour:Minute AM/PM"
                                const formattedDate = lastSyncedDate.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: '2-digit'
                                });

                                const formattedTime = lastSyncedDate.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                });

                                lastUpdatedElement.textContent = `Last updated ${formattedDate} at ${formattedTime}`;
                                console.log(`Set last updated date for container ${index}:`, `${formattedDate} at ${formattedTime}`);
                            } else {
                                // Display a fallback message when last_updated is missing
                                lastUpdatedElement.textContent = "Initial sync pending";
                                console.log(`Set default last updated message for container ${index}`);
                            }
                        }
                    }
                });
            }
        } else {
            console.error('Missing synced container elements');
        }

        // Get the edit sync container and setup its functionality
        const editSyncContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync"]');
        const editSyncCancelButton = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync_cancel"]');
        const editSyncSubmitButton = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync_submit"]');
        const editSyncSubmitText = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync_submit_text"]');
        const editSyncSubmitLoader = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync_submit_loader"]');
        const editSyncDeleteButton = document.querySelector('[data-element="toolbarEdit_connectCalender_editSync_delete"]');

        // Hide edit sync container initially
        if (editSyncContainer) {
            editSyncContainer.style.display = 'none';
        }

        // Hide loader initially
        if (editSyncSubmitLoader) {
            editSyncSubmitLoader.style.display = 'none';
        }

        // Clone and replace the edit sync delete button to remove existing event listeners
        if (editSyncDeleteButton) {
            const newEditSyncDeleteButton = editSyncDeleteButton.cloneNode(true);
            editSyncDeleteButton.parentNode.replaceChild(newEditSyncDeleteButton, editSyncDeleteButton);

            // Add click handler to the new delete button
            newEditSyncDeleteButton.addEventListener('click', async function () {
                console.log('Edit sync delete button clicked');

                // Get calendar ID from the container's data attribute
                const calendarId = editSyncContainer.getAttribute('data-editing-calendar-id');
                console.log('Calendar ID to delete:', calendarId);

                if (!calendarId) {
                    console.error('No calendar ID found for deletion');
                    alert('Could not delete calendar: Missing calendar ID');
                    return;
                }

                // Show confirmation dialog
                const confirmDelete = confirm('Are you sure you want to delete this calendar connection? This action cannot be undone.');
                if (!confirmDelete) {
                    console.log('User cancelled calendar deletion');
                    return;
                }

                try {
                    // Set a flag to indicate we're in the middle of a calendar operation
                    sessionStorage.setItem('calendarConnectionInProgress', 'true');

                    console.log('Making API request to delete calendar with ID:', calendarId);

                    // Make API call to delete the calendar
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_ical/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cal_id: calendarId
                        })
                    });

                    console.log('API response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const responseData = await response.json();
                    console.log('Calendar deletion successful:', responseData);

                    // Hide edit sync container and show body container
                    if (editSyncContainer) editSyncContainer.style.display = 'none';
                    if (connectCalendarBody) connectCalendarBody.style.display = 'flex';

                    // Re-fetch calendar data to update the UI without showing the main toolbar
                    await fetchCalendarData(propertyId, { showMainToolbar: false });

                    // After fetching data, update the connected calendars display with new data
                    if (responseData && responseData.property && responseData.property._property_icals) {
                        // Update the UI with the latest calendar data
                        setupConnectCalendarEdit(true, calendarUrl, propertyId, responseData.property._property_icals);

                        // Ensure edit container remains visible and toolbar remains hidden
                        if (connectCalendarEditContainer) connectCalendarEditContainer.style.display = 'flex';
                        if (toolbar) toolbar.style.display = 'none';
                    }

                } catch (error) {
                    console.error('Error deleting calendar:', error);
                    alert('Failed to delete calendar. Please try again.');
                } finally {
                    // Clear the flag when done
                    sessionStorage.removeItem('calendarConnectionInProgress');
                }
            });
        }

        // Clone and replace the edit sync cancel button to remove existing event listeners
        if (editSyncCancelButton) {
            const newEditSyncCancelButton = editSyncCancelButton.cloneNode(true);
            editSyncCancelButton.parentNode.replaceChild(newEditSyncCancelButton, editSyncCancelButton);

            // Add click handler to the new cancel button
            newEditSyncCancelButton.addEventListener('click', function () {
                // Hide edit sync container and show body container
                if (editSyncContainer) editSyncContainer.style.display = 'none';
                if (connectCalendarBody) connectCalendarBody.style.display = 'flex';
            });
        }

        // Clone and replace the edit sync submit button to remove existing event listeners
        if (editSyncSubmitButton) {
            const newEditSyncSubmitButton = editSyncSubmitButton.cloneNode(true);
            editSyncSubmitButton.parentNode.replaceChild(newEditSyncSubmitButton, editSyncSubmitButton);

            // Add click handler to the new submit button
            newEditSyncSubmitButton.addEventListener('click', async function () {
                console.log('Edit sync submit button clicked');
                // Get calendar data from inputs
                const nameInput = editSyncContainer.querySelector('[data-element="toolbarEdit_connectCalender_editSync_name"]');
                const linkInput = editSyncContainer.querySelector('[data-element="toolbarEdit_connectCalender_editSync_link"]');
                const calendarId = editSyncContainer.getAttribute('data-editing-calendar-id');


                console.log('Input values:', {
                    nameInput: nameInput ? nameInput.value : 'not found',
                    linkInput: linkInput ? linkInput.value : 'not found',
                    calendarId: calendarId || 'not found'
                });

                const newName = nameInput ? nameInput.value.trim() : '';
                const newUrl = linkInput ? linkInput.value.trim() : '';

                // Validate inputs
                if (!newName) {
                    console.log('Validation failed: Empty calendar name');
                    alert('Please enter a calendar name');
                    return;
                }

                if (!newUrl) {
                    console.log('Validation failed: Empty calendar URL');
                    alert('Please enter a calendar URL');
                    return;
                }

                console.log('Validation passed, preparing to update calendar');

                // Show loader and hide text
                if (editSyncSubmitLoader) editSyncSubmitLoader.style.display = 'flex';
                if (editSyncSubmitText) editSyncSubmitText.style.display = 'none';
                console.log('Loader displayed, text hidden');

                try {
                    // Set a flag to indicate we're in the middle of a calendar connection
                    sessionStorage.setItem('calendarConnectionInProgress', 'true');

                    console.log('Making API request with data:', {
                        property_id: propertyId,
                        ical_id: calendarId,
                        calendar_name: newName,
                        calendar_url: newUrl
                    });

                    // Make API call to update the calendar
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_ical/edit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            property_id: propertyId,
                            ical_id: calendarId,
                            calendar_name: newName,
                            calendar_url: newUrl
                        })
                    });

                    console.log('API response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const responseData = await response.json();
                    console.log('Calendar update successful:', responseData);

                    // Hide edit sync container and show body container
                    if (editSyncContainer) editSyncContainer.style.display = 'none';
                    if (connectCalendarBody) connectCalendarBody.style.display = 'flex';
                    console.log('UI updated: edit container hidden, body container shown');

                    // Re-fetch calendar data to update the UI without showing the main toolbar
                    console.log('Re-fetching calendar data');
                    fetchCalendarData(propertyId, { showMainToolbar: false }).then(() => {
                        // After fetching data, update the connected calendars display with new data
                        if (responseData && responseData.property && responseData.property._property_icals) {
                            console.log('Updating UI with new calendar data');
                            // Update the UI with the latest calendar data
                            setupConnectCalendarEdit(true, calendarUrl, propertyId, responseData.property._property_icals);

                            // Ensure the edit container stays visible and toolbar stays hidden
                            if (connectCalendarEditContainer) connectCalendarEditContainer.style.display = 'flex';
                            if (toolbar) toolbar.style.display = 'none';
                        } else {
                            console.log('Response data missing expected properties:', responseData);
                        }

                        // Clear the flag when done
                        sessionStorage.removeItem('calendarConnectionInProgress');
                    });

                } catch (error) {
                    console.error('Error updating calendar:', error);
                    alert('Failed to update calendar. Please try again.');
                } finally {
                    console.log('Request completed, resetting UI elements');
                    // Hide loader and show text regardless of outcome
                    if (editSyncSubmitLoader) editSyncSubmitLoader.style.display = 'none';
                    if (editSyncSubmitText) editSyncSubmitText.style.display = 'flex';
                    // Reset saving flag
                    isSaving = false;
                    // Clear the flag on error too
                    sessionStorage.removeItem('calendarConnectionInProgress');
                }
            });
        }

        // Remove any existing event listeners by cloning and replacing elements
        const newConnectCalendarContainer = connectCalendarContainer.cloneNode(true);
        connectCalendarContainer.parentNode.replaceChild(newConnectCalendarContainer, connectCalendarContainer);

        const newConnectCalendarSubmitButton = connectCalendarSubmitButton ? connectCalendarSubmitButton.cloneNode(true) : null;
        if (connectCalendarSubmitButton && newConnectCalendarSubmitButton) {
            connectCalendarSubmitButton.parentNode.replaceChild(newConnectCalendarSubmitButton, connectCalendarSubmitButton);
        }

        const newConnectCalendarCancelButton = connectCalendarCancelButton ? connectCalendarCancelButton.cloneNode(true) : null;
        if (connectCalendarCancelButton && newConnectCalendarCancelButton) {
            connectCalendarCancelButton.parentNode.replaceChild(newConnectCalendarCancelButton, connectCalendarCancelButton);
        }

        const newConnectCalendarExitButton = connectCalendarExitButton ? connectCalendarExitButton.cloneNode(true) : null;
        if (connectCalendarExitButton && newConnectCalendarExitButton) {
            connectCalendarExitButton.parentNode.replaceChild(newConnectCalendarExitButton, connectCalendarExitButton);
        }

        const newConnectCalendarAddSyncButton = connectCalendarAddSyncButton ? connectCalendarAddSyncButton.cloneNode(true) : null;
        if (connectCalendarAddSyncButton && newConnectCalendarAddSyncButton) {
            connectCalendarAddSyncButton.parentNode.replaceChild(newConnectCalendarAddSyncButton, connectCalendarAddSyncButton);
        }

        const newCopyLinkButton = copyLinkButton ? copyLinkButton.cloneNode(true) : null;
        if (copyLinkButton && newCopyLinkButton) {
            copyLinkButton.parentNode.replaceChild(newCopyLinkButton, copyLinkButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedConnectCalendarSubmitLoader = document.querySelector('[data-element="toolbarEdit_connectCalendar_submit_loader"]');
        const updatedConnectCalendarSubmitText = document.querySelector('[data-element="toolbarEdit_connectCalendar_submit_text"]');
        const updatedConnectCalendarAddSyncContainer = document.querySelector('[data-element="toolbarEdit_connectCalender_addSync"]');
        const updatedCopyLinkText = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer_text"]');
        const updatedConnectCalendarBody = document.querySelector('[data-element="toolbarEdit_connectCalender_body"]');

        // Hide loader initially
        if (updatedConnectCalendarSubmitLoader) updatedConnectCalendarSubmitLoader.style.display = 'none';

        // Hide the add sync container initially
        if (updatedConnectCalendarAddSyncContainer) updatedConnectCalendarAddSyncContainer.style.display = 'none';

        // Show edit container when connect calendar is clicked
        newConnectCalendarContainer.addEventListener('click', function () {
            console.log('Connect calendar container clicked');
            toolbar.style.display = 'none';
            connectCalendarEditContainer.style.display = 'flex';

            // Check synced containers visibility after container is shown
            const visibleSyncedContainers = document.querySelectorAll('[data-element="toolbarEdit_connectCalender_syncedContainer"]:not([style*="display: none"])');
            console.log('Visible synced containers after click:', visibleSyncedContainers.length);

            // Clear the input field for new syncing
            if (connectCalendarInputContainer) {
                connectCalendarInputContainer.value = "";
            }

            // Populate the copy link text with the calendar URL
            const copyLinkTextInput = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer_text"]');
            if (copyLinkTextInput && calendarUrl) {
                copyLinkTextInput.value = calendarUrl;
                copyLinkTextInput.setAttribute('readonly', 'readonly');
                copyLinkTextInput.style.cursor = 'text';
            } else if (copyLinkTextInput) {
                copyLinkTextInput.value = '';
                copyLinkTextInput.setAttribute('readonly', 'readonly');
                copyLinkTextInput.style.cursor = 'text';
            }
        });

        // Handle add sync button click
        if (newConnectCalendarAddSyncButton) {
            newConnectCalendarAddSyncButton.addEventListener('click', function () {
                if (updatedConnectCalendarAddSyncContainer) {
                    updatedConnectCalendarAddSyncContainer.style.display = 'flex';
                }
                if (updatedConnectCalendarBody) {
                    updatedConnectCalendarBody.style.display = 'none';
                }
            });
        }

        // Handle copy link button click
        if (newCopyLinkButton) {
            newCopyLinkButton.addEventListener('click', function () {
                const copyLinkTextInput = document.querySelector('[data-element="toolbarEdit_connectCalendar_copyLinkContainer_text"]');
                const linkText = copyLinkTextInput ? copyLinkTextInput.value : '';
                if (linkText) {
                    // Select the text in the input field
                    copyLinkTextInput.select();

                    navigator.clipboard.writeText(linkText)
                        .then(() => {
                            // Show a temporary "Copied!" message
                            const originalText = newCopyLinkButton.textContent;
                            newCopyLinkButton.textContent = "Copied!";

                            // Create and show a tooltip/notification
                            const notification = document.createElement('div');
                            notification.textContent = "Link copied to clipboard!";
                            notification.style.position = 'absolute';
                            notification.style.backgroundColor = 'white';
                            notification.style.color = 'black';
                            notification.style.border = '1px solid black';
                            notification.style.fontFamily = 'TT Fors';
                            notification.style.fontSize = '14px';
                            notification.style.padding = '8px 12px';
                            notification.style.borderRadius = '4px';
                            notification.style.zIndex = '1000';
                            notification.style.opacity = '0';
                            notification.style.transition = 'opacity 0.3s';

                            // Position near the button
                            const buttonRect = newCopyLinkButton.getBoundingClientRect();
                            notification.style.top = `${buttonRect.bottom + 10}px`;
                            notification.style.left = `${buttonRect.left}px`;

                            document.body.appendChild(notification);

                            // Fade in
                            setTimeout(() => {
                                notification.style.opacity = '1';
                            }, 10);

                            // Remove after delay
                            setTimeout(() => {
                                notification.style.opacity = '0';
                                setTimeout(() => {
                                    document.body.removeChild(notification);
                                    newCopyLinkButton.textContent = originalText;
                                }, 300);
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                            alert('Failed to copy link. Please try again.');
                        });
                }
            });
        }

        // Handle submit button click
        if (newConnectCalendarSubmitButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newConnectCalendarSubmitButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) return;

                // Get the URL from input
                const newCalendarUrl = connectCalendarInputContainer ? connectCalendarInputContainer.value.trim() : '';

                // Get the calendar name from input
                const calendarNameInput = document.querySelector('[data-element="toolbarEdit_connectCalendar_name_inputContainer"]');
                const newCalendarName = calendarNameInput ? calendarNameInput.value.trim() : '';

                // Basic validation for calendar URL
                if (!newCalendarUrl) {
                    alert('Please enter a calendar URL');
                    return;
                }

                // Basic validation for calendar name
                if (!newCalendarName) {
                    alert('Please enter a calendar name');
                    return;
                }

                // Check if URL has a valid calendar format (basic check)
                const isValidCalendarUrl = newCalendarUrl.endsWith('.ics') ||
                    newCalendarUrl.includes('calendar') ||
                    newCalendarUrl.includes('ical');

                if (!isValidCalendarUrl) {
                    const confirmContinue = confirm('The URL does not appear to be a standard calendar format. Are you sure you want to continue?');
                    if (!confirmContinue) return;
                }

                // Set saving flag to true
                isSaving = true;

                // Show loader and hide text
                if (updatedConnectCalendarSubmitLoader) updatedConnectCalendarSubmitLoader.style.display = 'flex';
                if (updatedConnectCalendarSubmitText) updatedConnectCalendarSubmitText.style.display = 'none';

                try {
                    // Set a flag to indicate we're in the middle of a calendar connection
                    sessionStorage.setItem('calendarConnectionInProgress', 'true');

                    // Make API call to save the calendar connection
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_ical', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            property_id: propertyId,
                            calendar_url: newCalendarUrl,
                            calendar_name: newCalendarName
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const responseData = await response.json();
                    console.log('Calendar connection successful:', responseData);

                    // Update the displayed connect calendar status
                    updateToolbarConnectCalendar(true, newCalendarUrl);

                    // Clear the input fields after successful save
                    if (connectCalendarInputContainer) {
                        connectCalendarInputContainer.value = "";
                    }
                    if (calendarNameInput) {
                        calendarNameInput.value = "";
                    }

                    // Explicitly keep toolbar hidden
                    if (toolbar) {
                        toolbar.style.display = 'none';
                    }

                    // Hide add sync container if it was open
                    if (updatedConnectCalendarAddSyncContainer) {
                        updatedConnectCalendarAddSyncContainer.style.display = 'none';
                    }

                    // Show the main body again if it was hidden
                    if (updatedConnectCalendarBody) {
                        updatedConnectCalendarBody.style.display = 'flex';
                    }

                    // Re-fetch calendar data using await instead of promise chain
                    // Explicitly specify not to show the main toolbar
                    await fetchCalendarData(propertyId, { showMainToolbar: false });

                    // After fetching data, update the connected calendars display with new data
                    if (responseData && responseData.property && responseData.property._property_icals) {
                        // Update the UI with the latest calendar data
                        setupConnectCalendarEdit(true, newCalendarUrl, propertyId, responseData.property._property_icals);

                        // Ensure edit container remains visible and toolbar remains hidden
                        if (connectCalendarEditContainer) connectCalendarEditContainer.style.display = 'flex';
                        if (toolbar) toolbar.style.display = 'none';
                    }

                    // Clear the flag when done
                    sessionStorage.removeItem('calendarConnectionInProgress');

                } catch (error) {
                    console.error('Error connecting calendar:', error);
                    alert('Failed to connect calendar. Please try again.');
                } finally {
                    // Hide loader and show text regardless of outcome
                    if (updatedConnectCalendarSubmitLoader) updatedConnectCalendarSubmitLoader.style.display = 'none';
                    if (updatedConnectCalendarSubmitText) updatedConnectCalendarSubmitText.style.display = 'flex';
                    // Reset saving flag
                    isSaving = false;
                    // Clear the flag on error too
                    sessionStorage.removeItem('calendarConnectionInProgress');
                }
            });
        }

        // Handle cancel button click
        if (newConnectCalendarCancelButton) {
            newConnectCalendarCancelButton.addEventListener('click', function () {
                // Hide add sync container if it was open
                if (updatedConnectCalendarAddSyncContainer) {
                    updatedConnectCalendarAddSyncContainer.style.display = 'none';
                }

                // Show the main body again if it was hidden
                if (updatedConnectCalendarBody) {
                    updatedConnectCalendarBody.style.display = 'flex';
                }

                // Do NOT close the entire edit container - just return to the main view
                // The following lines are removed:
                // connectCalendarEditContainer.style.display = 'none';
                // toolbar.style.display = 'flex';
            });
        }

        // Handle exit button click
        if (newConnectCalendarExitButton) {
            newConnectCalendarExitButton.addEventListener('click', function () {
                // Hide add sync container if it was open
                if (updatedConnectCalendarAddSyncContainer) {
                    updatedConnectCalendarAddSyncContainer.style.display = 'none';
                }

                // Show the main body again if it was hidden
                if (updatedConnectCalendarBody) {
                    updatedConnectCalendarBody.style.display = 'flex';
                }

                // Exit should still close the entire edit container and show the toolbar
                connectCalendarEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newConnectCalendarExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to update the availability window display in the toolbar
    function updateToolbarAvailabilityWindow(months) {
        const availabilityWindowElement = document.querySelector('[data-element="toolbar_availabilityWindow_text"]');
        if (availabilityWindowElement && months !== undefined) {
            availabilityWindowElement.textContent = months === 1 ? `${months} Month` : `${months} Months`;
        }
    }


    // Function to setup the availability window edit functionality
    function setupAvailabilityWindowEdit(currentMonths, propertyId) {
        const availabilityWindowContainer = document.querySelector('[data-element="toolbar_availabilityWindow"]');
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const availabilityWindowEditContainer = document.querySelector('[data-element="toolbarEdit_availabilityWindow"]');
        const availabilityWindowInput = document.querySelector('[data-element="toolbarEdit_availabilityWindow_input"]');
        const availabilityWindowSaveButton = document.querySelector('[data-element="toolbarEdit_availabilityWindow_saveButton"]');
        const availabilityWindowSaveButtonText = document.querySelector('[data-element="toolbarEdit_availabilityWindow_saveButtonText"]');
        const availabilityWindowSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_availabilityWindow_saveButtonLoader"]');
        const availabilityWindowCancelButton = document.querySelector('[data-element="toolbarEdit_availabilityWindow_cancel"]');
        const availabilityWindowExitButton = document.querySelector('[data-element="toolbarEdit_availabilityWindow_exit"]');
        const availabilityWindowSubText = document.querySelector('[data-element="toolbarEdit_availabilityWindow_subText"]');

        if (!availabilityWindowContainer || !toolbar || !availabilityWindowEditContainer || !availabilityWindowInput) return;

        // Remove any existing event listeners by cloning and replacing elements
        const newAvailabilityWindowContainer = availabilityWindowContainer.cloneNode(true);
        availabilityWindowContainer.parentNode.replaceChild(newAvailabilityWindowContainer, availabilityWindowContainer);

        const newAvailabilityWindowSaveButton = availabilityWindowSaveButton ? availabilityWindowSaveButton.cloneNode(true) : null;
        if (availabilityWindowSaveButton && newAvailabilityWindowSaveButton) {
            availabilityWindowSaveButton.parentNode.replaceChild(newAvailabilityWindowSaveButton, availabilityWindowSaveButton);
        }

        const newAvailabilityWindowCancelButton = availabilityWindowCancelButton ? availabilityWindowCancelButton.cloneNode(true) : null;
        if (availabilityWindowCancelButton && newAvailabilityWindowCancelButton) {
            availabilityWindowCancelButton.parentNode.replaceChild(newAvailabilityWindowCancelButton, availabilityWindowCancelButton);
        }

        const newAvailabilityWindowExitButton = availabilityWindowExitButton ? availabilityWindowExitButton.cloneNode(true) : null;
        if (availabilityWindowExitButton && newAvailabilityWindowExitButton) {
            availabilityWindowExitButton.parentNode.replaceChild(newAvailabilityWindowExitButton, availabilityWindowExitButton);
        }

        // Get updated references to elements after DOM replacements
        const updatedAvailabilityWindowSaveButtonLoader = document.querySelector('[data-element="toolbarEdit_availabilityWindow_saveButtonLoader"]');
        const updatedAvailabilityWindowSaveButtonText = document.querySelector('[data-element="toolbarEdit_availabilityWindow_saveButtonText"]');
        const updatedAvailabilityWindowSubText = document.querySelector('[data-element="toolbarEdit_availabilityWindow_subText"]');

        // hide availabilityWindowSaveButtonLoader
        if (updatedAvailabilityWindowSaveButtonLoader) updatedAvailabilityWindowSaveButtonLoader.style.display = 'none';

        // Update subText based on current months
        if (updatedAvailabilityWindowSubText) {
            updatedAvailabilityWindowSubText.textContent = currentMonths === 1 ? 'Month' : 'Months';
        }

        // Show edit container when availability window is clicked
        newAvailabilityWindowContainer.addEventListener('click', function () {
            toolbar.style.display = 'none';
            availabilityWindowEditContainer.style.display = 'flex';

            // Set the current months in the input field
            availabilityWindowInput.value = currentMonths;

            // Position cursor at the end of the input
            setTimeout(() => {
                availabilityWindowInput.focus();
                availabilityWindowInput.selectionStart = availabilityWindowInput.value.length;
                availabilityWindowInput.selectionEnd = availabilityWindowInput.value.length;
            }, 0);
        });

        // Only allow numbers in the input
        availabilityWindowInput.addEventListener('input', function (e) {
            // Remove any non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, '');

            // Limit to values less than 100
            const numValue = parseInt(this.value) || 0;
            if (numValue >= 25) {
                this.value = '24';
            }

            // Update subText based on input value
            if (updatedAvailabilityWindowSubText) {
                const months = parseInt(this.value) || 0;
                updatedAvailabilityWindowSubText.textContent = months === 1 ? 'Month' : 'Months';
            }
        });

        // Handle save button click
        if (newAvailabilityWindowSaveButton) {
            // Flag to prevent multiple simultaneous save requests
            let isSaving = false;

            newAvailabilityWindowSaveButton.addEventListener('click', async function () {
                // Prevent multiple clicks while saving
                if (isSaving) return;

                // Extract the numeric value
                const newMonths = parseInt(availabilityWindowInput.value.trim());

                // Check if the input has a valid integer value and is less than 100
                if (!isNaN(newMonths) && Number.isFinite(newMonths) && availabilityWindowInput.value.trim() !== '' && newMonths < 100) {
                    // Set saving flag to true
                    isSaving = true;

                    // Show loader and hide text
                    if (updatedAvailabilityWindowSaveButtonLoader) updatedAvailabilityWindowSaveButtonLoader.style.display = 'flex';
                    if (updatedAvailabilityWindowSaveButtonText) updatedAvailabilityWindowSaveButtonText.style.display = 'none';

                    try {
                        // Make API call to save the new availability window
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_availabilityWindow', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                availabilityWindow: newMonths,
                                property_id: propertyId
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }

                        // Update the displayed availability window
                        updateToolbarAvailabilityWindow(newMonths);

                        // Hide edit container and show toolbar
                        availabilityWindowEditContainer.style.display = 'none';
                        toolbar.style.display = 'flex';
                        console.log('TOOLBAR SET TO FLEX: newAvailabilityWindowSaveButton.addEventListener - no selected dates');

                        // Re-fetch calendar data for the currently selected property
                        // This ensures we stay on the same property after updating
                        fetchCalendarData(propertyId);

                    } catch (error) {
                        alert('Failed to save the new availability window. Please try again.');
                    } finally {
                        // Hide loader and show text regardless of outcome
                        if (updatedAvailabilityWindowSaveButtonLoader) updatedAvailabilityWindowSaveButtonLoader.style.display = 'none';
                        if (updatedAvailabilityWindowSaveButtonText) updatedAvailabilityWindowSaveButtonText.style.display = 'flex';
                        // Reset saving flag
                        isSaving = false;
                    }
                } else {
                    alert('Please enter a valid number of months (1-24)');
                }
            });
        }

        // Handle cancel button click
        if (newAvailabilityWindowCancelButton) {
            newAvailabilityWindowCancelButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                availabilityWindowEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newAvailabilityWindowCancelButton.addEventListener - no selected dates');
            });
        }

        // Handle exit button click
        if (newAvailabilityWindowExitButton) {
            newAvailabilityWindowExitButton.addEventListener('click', function () {
                // Hide edit container and show toolbar without saving changes
                availabilityWindowEditContainer.style.display = 'none';
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: newAvailabilityWindowExitButton.addEventListener - no selected dates');
            });
        }
    }

    // Function to close all edit toolbars
    function closeAllEditToolbars(options = {}) {
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const editToolbars = [
            document.querySelector('[data-element="toolbarEdit_basePrice"]'),
            document.querySelector('[data-element="toolbarEdit_cleaningFee"]'),
            document.querySelector('[data-element="toolbarEdit_tripLength"]'),
            document.querySelector('[data-element="toolbarEdit_advanceNotice"]'),
            document.querySelector('[data-element="toolbarEdit_availabilityWindow"]'),
            document.querySelector('[data-element="toolbarEdit_customDates"]'),
            document.querySelector('[data-element="toolbarEdit_connectCalendar"]')
        ];

        // Hide all edit toolbars
        editToolbars.forEach(editToolbar => {
            if (editToolbar) editToolbar.style.display = 'none';
        });

        // Only show the main toolbar if not explicitly prevented
        if (toolbar && options.showMainToolbar !== false) {
            toolbar.style.display = 'flex';
            console.log('TOOLBAR SET TO FLEX: closeAllEditToolbars function');
        }
    }



    // Function to update the current listing name in the UI
    function updateCurrentListingName(propertyName) {
        const listingNameElement = document.querySelector('[data-element="hostCalendar_listingBlock_text"]');
        if (listingNameElement) {
            // Apply responsive truncation
            truncateListingName(listingNameElement, propertyName);
        }
    }

    // Function to truncate listing name based on screen width
    function truncateListingName(element, fullName) {
        const truncate = (text, maxLength) =>
            text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

        function applyTruncation() {
            const width = window.innerWidth;

            // For smaller screens, apply truncation
            let maxChars = 15; // Default for screens below 1100px

            // if (width < 580) maxChars = 8; // Mobile
            // else if (width < 768) maxChars = 15; // Small tablets
            // else if (width < 992) maxChars = 20; // Large tablets
            // else if (width < 1100) maxChars = 25; // Small desktops

            element.textContent = truncate(fullName, maxChars);
        }

        // Initial application
        applyTruncation();

        // Always remove previous listener before adding a new one
        window.removeEventListener('resize', window.listingNameResizeHandler);

        // Store the handler function for future removal
        window.listingNameResizeHandler = applyTruncation;

        // Add the event listener
        window.addEventListener('resize', window.listingNameResizeHandler);
    }

    // Function to setup the listing block click handler
    function setupListingBlockHandler() {
        const listingBlock = document.querySelector('[data-element="hostCalendar_listingBlock"]');
        const listingNameElement = document.querySelector('[data-element="hostCalendar_listingBlock_text"]');
        const listingsPopUp = document.querySelector('[data-element="hostCalendar_listingsPopUp"]');
        const cancelButton = document.querySelector('[data-element="hostCalendar_listingsPopUp_cancel"]');
        const submitButton = document.querySelector('[data-element="hostCalendar_listingsPopUp_submit"]');

        // Remove any existing arrow elements first to prevent duplicates
        const existingArrows = listingBlock.querySelectorAll('div[data-arrow="true"]');
        existingArrows.forEach(arrow => arrow.remove());

        // Create and append the arrow icon element
        const arrowElement = document.createElement('div');
        arrowElement.setAttribute('data-arrow', 'true');
        arrowElement.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        arrowElement.style.display = 'inline-flex';
        arrowElement.style.height = '100%';
        arrowElement.style.alignItems = 'center';
        arrowElement.style.justifyContent = 'center';
        arrowElement.style.marginLeft = '8px';
        arrowElement.style.transition = 'transform 0.3s ease';
        if (listingBlock) {
            listingBlock.appendChild(arrowElement);
        }

        // Function to toggle arrow direction
        function toggleArrow(isOpen) {
            if (isOpen) {
                // Rotate the arrow to point up when open
                arrowElement.style.transform = 'rotate(180deg)';
            } else {
                // Reset rotation to point down when closed
                arrowElement.style.transform = 'rotate(0deg)';
            }
        }

        // Function to show popup
        function showPopup() {
            populateListingsPopup();
            listingsPopUp.style.display = 'flex';
            toggleArrow(true);
        }

        // Function to hide popup
        function hidePopup() {
            listingsPopUp.style.display = 'none';
            toggleArrow(false);
        }

        if (listingBlock && listingsPopUp) {
            // Remove any existing event listeners to prevent duplicates
            const newListingBlock = listingBlock.cloneNode(true);
            listingBlock.parentNode.replaceChild(newListingBlock, listingBlock);

            // Show/hide popup when listing block is clicked
            newListingBlock.addEventListener('click', function () {
                if (listingsPopUp.style.display === 'flex') {
                    hidePopup();
                } else {
                    showPopup();
                }
            });

            // Also show/hide popup when listing name is clicked
            if (listingNameElement) {
                const newListingNameElement = listingNameElement.cloneNode(true);
                listingNameElement.parentNode.replaceChild(newListingNameElement, listingNameElement);

                newListingNameElement.addEventListener('click', function (e) {
                    e.stopPropagation(); // Prevent triggering the listingBlock click event
                    if (listingsPopUp.style.display === 'flex') {
                        hidePopup();
                    } else {
                        showPopup();
                    }
                });
            }

            // Close popup when cancel button is clicked
            if (cancelButton) {
                cancelButton.addEventListener('click', function () {
                    hidePopup();
                });
            }

            // Close popup when clicking outside
            document.addEventListener('click', function (event) {
                if (listingsPopUp.style.display === 'flex' &&
                    !listingsPopUp.contains(event.target) &&
                    event.target !== newListingBlock &&
                    event.target !== newListingNameElement) {
                    hidePopup();
                }
            });

            // Handle submit button click
            if (submitButton) {
                submitButton.addEventListener('click', function () {
                    const selectedBlock = document.querySelector('[data-element="hostCalendar_listingsPopUp_listingBlock"].clicked');
                    if (selectedBlock) {
                        const selectedPropertyId = selectedBlock.getAttribute('data-property-id');
                        if (selectedPropertyId) {
                            // Find the property name for the selected property
                            const selectedProperty = propertiesData.find(property => property.id.toString() === selectedPropertyId.toString());
                            if (selectedProperty) {
                                // Store the selected property name to ensure it persists
                                const selectedPropertyName = selectedProperty.property_name;

                                // Update the listing name in the UI immediately
                                updateCurrentListingName(selectedPropertyName);

                                // Store the selected property ID to maintain selection
                                propertyId = selectedPropertyId;

                                // Fetch calendar data with the selected property ID
                                fetchCalendarData(selectedPropertyId).then(() => {
                                    // Update the name again after data is loaded to ensure it stays
                                    updateCurrentListingName(selectedPropertyName);

                                    // Re-setup the listing block handler to ensure it works after data refresh
                                    setupListingBlockHandler();

                                    // Re-setup the toolbar with the selected property data
                                    setupToolbar(selectedProperty);

                                    closeAllEditToolbars();

                                });

                                // Re-setup the toolbar with the selected property data
                                setupToolbar(selectedProperty);





                            } else {
                                // Fallback if property not found
                                fetchCalendarData(selectedPropertyId).then(() => {
                                    // Re-setup the listing block handler
                                    setupListingBlockHandler();
                                });
                            }

                            hidePopup();
                        }
                    }
                });
            }
        }
    }

    // Function to populate the listings popup with property data
    function populateListingsPopup() {
        const popupContainer = document.querySelector('[data-element="hostCalendar_listingsPopUp"]');
        if (!popupContainer || !propertiesData.length) return;

        // Clear existing listing blocks except the first one (template)
        const existingBlocks = popupContainer.querySelectorAll('[data-element="hostCalendar_listingsPopUp_listingBlock"]');
        const templateBlock = existingBlocks[0];
        const listingBlocksContainer = templateBlock.parentElement;

        // Remove all blocks except the template
        for (let i = 1; i < existingBlocks.length; i++) {
            existingBlocks[i].remove();
        }

        // Reset template block (remove clicked class)
        templateBlock.classList.remove('clicked');

        // Track the currently selected property ID
        let currentPropertyId = propertyId;
        let firstBlockSelected = false;

        // Populate and clone blocks for each property
        propertiesData.forEach((property, index) => {
            let block;

            if (index === 0) {
                // Use the template block for the first property
                block = templateBlock;
            } else {
                // Clone the template for additional properties
                block = templateBlock.cloneNode(true);
                // Insert after the previous block to maintain order
                listingBlocksContainer.appendChild(block);
            }

            // Set property ID as data attribute
            block.setAttribute('data-property-id', property.id);

            // Set property name
            const propertyNameElement = block.querySelector('[data-element="hostCalendar_listingsPopUp_propertyName"]');
            if (propertyNameElement) {
                propertyNameElement.textContent = property.property_name;
            }

            // Set listing status
            const listingStatusElement = block.querySelector('[data-element="hostCalendar_listingsPopUp_listingStatus"]');
            if (listingStatusElement) {
                listingStatusElement.textContent = property.is_active ? "Listed" : "Not listed";
            }

            // Set property image
            const imageElement = block.querySelector('[data-element="hostCalendar_listingsPopUp_image"]');
            if (imageElement && property._property_pic && property._property_pic.length > 0) {
                // Check if property_image and url exist before accessing
                if (property._property_pic[0].property_image && property._property_pic[0].property_image.url) {
                    imageElement.src = property._property_pic[0].property_image.url;
                } else {
                    // Set a default/placeholder image if needed
                    // imageElement.src = 'path/to/default/image.jpg';
                }
            } else {

            }

            // Clear any previous click event listeners to prevent duplicates
            const newBlock = block.cloneNode(true);
            block.parentNode.replaceChild(newBlock, block);
            block = newBlock;

            // Select the block if it matches the current property ID
            if (property.id && currentPropertyId && property.id.toString() === currentPropertyId.toString()) {
                block.classList.add('clicked');
                firstBlockSelected = true;
            }

            // Add click event to toggle selection
            block.addEventListener('click', function (e) {
                // Remove clicked class from all blocks
                document.querySelectorAll('[data-element="hostCalendar_listingsPopUp_listingBlock"]')
                    .forEach(el => el.classList.remove('clicked'));

                // Add clicked class to this block only
                this.classList.add('clicked');
            });
        });

        // If no block was selected (current property not in list), select the first one
        if (!firstBlockSelected && propertiesData.length > 0) {
            const firstBlock = popupContainer.querySelector('[data-element="hostCalendar_listingsPopUp_listingBlock"]');
            if (firstBlock) {
                firstBlock.classList.add('clicked');
            }
        }
    }


    // Initialize with empty calendar (will be updated after API call)
    initializeCalendar();




    // Function to disable browser default input field styles
    function disableBrowserDefaultInputStyles() {
        // Create a style element for custom input styles
        const inputStyles = document.createElement('style');
        inputStyles.textContent = `
                                    /* Remove default focus styles for all input elements */
                                    input:focus,
                                    textarea:focus,
                                    select:focus,
                                    button:focus {
                                        outline: none !important;
                                        box-shadow: none !important;
                                        -webkit-box-shadow: none !important;
                                        -moz-box-shadow: none !important;
                                    }
                        
                                    /* Remove default blue border on Chrome/Safari */
                                    input:focus-visible,
                                    textarea:focus-visible,
                                    select:focus-visible,
                                    button:focus-visible {
                                        outline: none !important;
                                        outline-offset: 0 !important;
                                    }
                        
                                    /* Remove default blue highlight on mobile tap */
                                    input,
                                    textarea,
                                    select,
                                    button {
                                        -webkit-tap-highlight-color: transparent !important;
                                        -webkit-appearance: none !important;
                                    }
                        
                                    /* Remove default styling for number inputs */
                                    input[type=number]::-webkit-inner-spin-button, 
                                    input[type=number]::-webkit-outer-spin-button { 
                                        -webkit-appearance: none !important;
                                        margin: 0 !important;
                                    }
                                    input[type=number] {
                                        -moz-appearance: textfield !important;
                                    }
                        
                                    /* Remove default styling for search inputs */
                                    input[type=search]::-webkit-search-decoration,
                                    input[type=search]::-webkit-search-cancel-button,
                                    input[type=search]::-webkit-search-results-button,
                                    input[type=search]::-webkit-search-results-decoration {
                                        -webkit-appearance: none !important;
                                    }
                        
                                    /* Remove default autocomplete highlight */
                                    input:-webkit-autofill,
                                    input:-webkit-autofill:hover,
                                    input:-webkit-autofill:focus,
                                    textarea:-webkit-autofill,
                                    textarea:-webkit-autofill:hover,
                                    textarea:-webkit-autofill:focus,
                                    select:-webkit-autofill,
                                    select:-webkit-autofill:hover,
                                    select:-webkit-autofill:focus {
                                        -webkit-box-shadow: 0 0 0px 1000px white inset !important;
                                        transition: background-color 5000s ease-in-out 0s !important;
                                    }
                                `;
        document.head.appendChild(inputStyles);
    }

    // Call the function to apply the styles
    disableBrowserDefaultInputStyles();

    // Function to clear all date selections
    function clearDateSelections(options = {}) {
        // Clear the selectedDates array
        selectedDates = [];

        // Remove selected-day class from all date elements
        const selectedDayElements = document.querySelectorAll('.selected-day');
        selectedDayElements.forEach(el => {
            el.classList.remove('selected-day');
        });

        // Reset toolbar UI state
        const toolbar = document.querySelector('[data-element="toolbar"]');
        const customDates = document.querySelector('[data-element="toolbarEdit_customDates"]');

        if (toolbar && customDates) {
            // Only show the toolbar if not explicitly prevented
            if (options.showMainToolbar !== false) {
                toolbar.style.display = 'flex';
                console.log('TOOLBAR SET TO FLEX: clearDateSelections function');
            }
            customDates.style.display = 'none';
        }

        // Reset edit dates UI if it exists
        const bodyContainer = document.querySelector('[data-element="toolbarEdit_customDates_bodyContainer"]');
        const editDatesContainer = document.querySelector('[data-element="toolbarEdit_customDates_editDates"]');

        if (bodyContainer && editDatesContainer) {
            bodyContainer.style.display = 'flex';
            editDatesContainer.style.display = 'none';
        }
    }

    // Helper function to calculate nights between two dates
    function calculateNightsInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because we count the nights including the start date
    }

    // Helper function to format date as YYYY-MM-DD
    function formatDateYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Function to hide months beyond 2 years from current date
    function hideMonthsBeyondTwoYears() {
        // Get current date
        const currentDate = new Date();

        // Calculate date 2 years from now
        const twoYearsFromNow = new Date(currentDate);
        twoYearsFromNow.setFullYear(currentDate.getFullYear() + 2);

        // Find the end of the month (to include the full month)
        const cutoffYear = twoYearsFromNow.getFullYear();
        const cutoffMonth = twoYearsFromNow.getMonth() + 1; // JavaScript months are 0-based

        // Format as YYYY-MM string for comparison
        const cutoffDateStr = `${cutoffYear}-${String(cutoffMonth).padStart(2, '0')}`;

        // Select all month elements in the calendar
        const monthElements = document.querySelectorAll('.fc-multimonth-month[data-date]');

        // Loop through month elements and hide those beyond the cutoff
        monthElements.forEach(monthElement => {
            const monthDate = monthElement.getAttribute('data-date');

            // If this month is beyond our cutoff, hide it
            if (monthDate > cutoffDateStr) {
                monthElement.style.display = 'none';
            }
        });
    }

    // Function to add event listener to the next year button
    function addNextYearButtonListener() {
        // Find the next year button
        const nextYearButton = document.querySelector('.fc-next-button');

        if (nextYearButton) {
            // Add our listener without removing FullCalendar's listener
            nextYearButton.addEventListener('click', function () {
                // Use setTimeout to ensure the calendar has updated before we check
                setTimeout(() => {
                    checkAndDisableNextButton();

                    // Check if we're showing any months that are 2+ years in the future
                    const visibleMonths = document.querySelectorAll('.fc-multimonth-month[data-date]');
                    const currentDate = new Date();
                    const cutoffYear = currentDate.getFullYear() + 2;

                    // Check if any visible month is in or beyond the cutoff year
                    const needsHiding = Array.from(visibleMonths).some(monthEl => {
                        const monthDate = monthEl.getAttribute('data-date');
                        const monthYear = parseInt(monthDate.split('-')[0]);
                        return monthYear >= cutoffYear;
                    });

                    // If any months are beyond the cutoff, hide them
                    if (needsHiding) {
                        hideMonthsBeyondTwoYears();
                    }
                }, 100); // Small delay to ensure calendar has updated
            });

            // Initial check to see if button should be disabled
            checkAndDisableNextButton();
        }
    }

    // Function to check if we're at max year and disable the next button if needed
    function checkAndDisableNextButton() {
        const nextYearButton = document.querySelector('.fc-next-button');
        if (!nextYearButton) return;

        // Get visible months and extract the year from the latest visible month
        const visibleMonths = document.querySelectorAll('.fc-multimonth-month[data-date]');
        if (visibleMonths.length === 0) return;

        // Find the latest month shown
        let latestYearShown = 0;
        visibleMonths.forEach(monthEl => {
            const monthDate = monthEl.getAttribute('data-date');
            const monthYear = parseInt(monthDate.split('-')[0]);
            if (monthYear > latestYearShown) {
                latestYearShown = monthYear;
            }
        });

        // Calculate max allowed year (2 years from now)
        const currentDate = new Date();
        const maxAllowedYear = currentDate.getFullYear() + 2;

        // If we're at or beyond max year, disable the button
        if (latestYearShown >= maxAllowedYear) {
            // Disable the button
            nextYearButton.disabled = true;
            nextYearButton.setAttribute('aria-disabled', 'true');

            // Add greyed out styling
            nextYearButton.style.opacity = '0.5';
            nextYearButton.style.cursor = 'not-allowed';
            nextYearButton.style.backgroundColor = '#e9e9e9';
            nextYearButton.style.borderColor = '#d3d3d3';
        } else {
            // Enable the button
            nextYearButton.disabled = false;
            nextYearButton.setAttribute('aria-disabled', 'false');

            // Reset styling
            nextYearButton.style.opacity = '1';
            nextYearButton.style.cursor = 'pointer';
            nextYearButton.style.backgroundColor = '';
            nextYearButton.style.borderColor = '';
        }
    }

    // Function to add event listeners to navigation buttons
    function addNavigationButtonListeners() {
        // Add listener for next button
        const nextYearButton = document.querySelector('.fc-next-button');
        if (nextYearButton) {
            nextYearButton.addEventListener('click', function () {
                // Use setTimeout to ensure the calendar has updated before we check
                setTimeout(() => {
                    checkAndDisableNextButton();

                    // Check if we're showing any months that are 2+ years in the future
                    const visibleMonths = document.querySelectorAll('.fc-multimonth-month[data-date]');
                    const currentDate = new Date();
                    const cutoffYear = currentDate.getFullYear() + 2;

                    // Check if any visible month is in or beyond the cutoff year
                    const needsHiding = Array.from(visibleMonths).some(monthEl => {
                        const monthDate = monthEl.getAttribute('data-date');
                        const monthYear = parseInt(monthDate.split('-')[0]);
                        return monthYear >= cutoffYear;
                    });

                    // If any months are beyond the cutoff, hide them
                    if (needsHiding) {
                        hideMonthsBeyondTwoYears();
                    }
                }, 100); // Small delay to ensure calendar has updated
            });
        }

        // Add listener for prev button
        const prevYearButton = document.querySelector('.fc-prev-button');
        if (prevYearButton) {
            prevYearButton.addEventListener('click', function () {
                // Use setTimeout to ensure the calendar has updated before we check
                setTimeout(() => {
                    // Re-check if next button should be enabled or disabled
                    checkAndDisableNextButton();
                }, 100); // Small delay to ensure calendar has updated
            });
        }

        // Initial check to see if button should be disabled
        checkAndDisableNextButton();
    }


});
