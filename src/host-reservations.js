// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);


// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Hide the reservation template block initially
    const templateBlock = document.querySelector('[data-element="reservationBlock"]');
    if (templateBlock) {
        templateBlock.style.display = 'none';
    }

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

// Initialize Wized and get host ID
window.Wized = window.Wized || [];
window.Wized.push((async (Wized) => {
    await Wized.requests.waitFor('Load_user');
    const hostId = Wized.data.r.Load_user.data.id;
    initializeReservations(hostId);
}));

// Main function to fetch and display reservations
async function initializeReservations(hostId) {
    // Show loader while fetching and processing data
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) loader.style.display = 'flex';

    try {
        // Fetch reservations
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/host_reservations?host_id=${hostId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            window.location.href = '/404';
            //throw new Error('Failed to fetch reservations');
        }

        const data = await response.json();

        // Extract reservations from active_reservations - handle nested array structure
        // active_reservations is an array of arrays, so we need to flatten it
        const activeReservationsArrays = data.active_reservations || [];
        const reservations = activeReservationsArrays.flat() || [];

        // Extract cancelled reservations - handle nested array structure
        const cancelledReservationsArrays = data.cancelled_reservations || [];
        const cancelledReservations = cancelledReservationsArrays.flat() || [];

        processAndDisplayReservations(reservations, cancelledReservations);

        // Check if a reservation_code URL parameter exists and open that reservation modal
        const urlParams = new URLSearchParams(window.location.search);
        const reservationCodeParam = urlParams.get('reservation_code');

        if (reservationCodeParam) {
            // Combine active and cancelled reservations to search through all of them
            const allReservations = [...reservations, ...cancelledReservations];

            // Find the reservation with the matching code
            const targetReservation = allReservations.find(res =>
                res.reservation_code && res.reservation_code.toString() === reservationCodeParam);

            // If found, display the modal for that reservation
            if (targetReservation) {
                // Use setTimeout to ensure DOM is fully rendered before showing modal
                setTimeout(() => {
                    displayReservationModal(targetReservation);
                }, 500);
            }
        }

        // Handle Calendar navigation visibility based on property completion status
        const calendarNavItem = document.querySelector('[data-element="hostDashboardNavBar_Calendar"]');
        if (calendarNavItem) {
            // Check if any properties have addHome_complete as true
            const properties = data.property1 || [];
            const hasCompletedHome = properties.some(property => property.addHome_complete === true);

            // Hide calendar nav item if no completed homes
            if (!hasCompletedHome) {
                calendarNavItem.style.display = 'none';
            }
        }

        // Use requestAnimationFrame to ensure the DOM is fully updated,
        // then use a small timeout to give browser time to paint everything
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Hide loader after all content has been rendered
                if (loader) loader.style.display = 'none';
            }, 300); // 300ms delay should be enough for most rendering
        });

    } catch (error) {
        console.error('Error fetching reservations:', error);
        // Hide loader in case of error (also with delay to be consistent)
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
            }, 300);
        });
    }
}

// Function to process and display reservations
function processAndDisplayReservations(reservations, cancelledReservations) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Get today as YYYY-MM-DD
    const currentReservations = [];
    const upcomingReservations = [];
    const pastReservations = [];
    const allReservations = [];

    // Check if reservations is defined and is an array before using forEach
    if (Array.isArray(reservations)) {
        // Sort reservations into current, upcoming, and past
        reservations.forEach(reservation => {
            // Extract dates as YYYY-MM-DD
            const checkInStr = reservation.check_in.split('T')[0];
            const checkOutStr = reservation.check_out.split('T')[0];

            // Add to all reservations
            allReservations.push(reservation);

            // Compare date strings
            if (todayStr >= checkInStr && todayStr <= checkOutStr) {
                currentReservations.push(reservation);
            } else if (checkInStr > todayStr) {
                upcomingReservations.push(reservation);
            } else if (checkOutStr < todayStr) {
                pastReservations.push(reservation);
            }
        });
    }

    // Add cancelled reservations to the allReservations array
    if (Array.isArray(cancelledReservations)) {
        cancelledReservations.forEach(reservation => {
            allReservations.push(reservation);
        });
    }

    // Sort all arrays by check-in date
    const sortByCheckIn = (a, b) => {
        const aDate = a.check_in.split('T')[0];
        const bDate = b.check_in.split('T')[0];
        return aDate.localeCompare(bDate);
    };
    currentReservations.sort(sortByCheckIn);
    upcomingReservations.sort(sortByCheckIn);
    pastReservations.sort(sortByCheckIn);
    allReservations.sort(sortByCheckIn);
    if (Array.isArray(cancelledReservations)) {
        cancelledReservations.sort(sortByCheckIn);
    }

    // Set up toggle buttons
    const currentButton = document.querySelector('[data-element="currentReservationsToggle"]');
    const upcomingButton = document.querySelector('[data-element="upcomingReservationsToggle"]');
    const pastButton = document.querySelector('[data-element="pastReservationsToggle"]');
    const allButton = document.querySelector('[data-element="allReservationsToggle"]');
    const cancelledButton = document.querySelector('[data-element="cancelledReservationsToggle"]');

    // Default to showing all reservations
    if (allButton) {
        allButton.classList.add('clicked');
        displayReservations(allReservations, 'all');
    }

    // Add click handlers
    if (currentButton) {
        currentButton.addEventListener('click', () => {
            removeAllClicked();
            currentButton.classList.add('clicked');
            displayReservations(currentReservations, 'current');
        });
    }

    if (upcomingButton) {
        upcomingButton.addEventListener('click', () => {
            removeAllClicked();
            upcomingButton.classList.add('clicked');
            displayReservations(upcomingReservations, 'upcoming');
        });
    }

    if (pastButton) {
        pastButton.addEventListener('click', () => {
            removeAllClicked();
            pastButton.classList.add('clicked');
            displayReservations(pastReservations, 'past');
        });
    }

    if (allButton) {
        allButton.addEventListener('click', () => {
            removeAllClicked();
            allButton.classList.add('clicked');
            displayReservations(allReservations, 'all');
        });
    }

    if (cancelledButton) {
        cancelledButton.addEventListener('click', () => {
            removeAllClicked();
            cancelledButton.classList.add('clicked');
            displayReservations(cancelledReservations, 'cancelled');
        });
    }

    // Helper function to remove 'clicked' class from all buttons
    function removeAllClicked() {
        if (currentButton) currentButton.classList.remove('clicked');
        if (upcomingButton) upcomingButton.classList.remove('clicked');
        if (pastButton) pastButton.classList.remove('clicked');
        if (allButton) allButton.classList.remove('clicked');
        if (cancelledButton) cancelledButton.classList.remove('clicked');
    }
}

// Function to display reservations
function displayReservations(reservations, type) {
    const templateBlock = document.querySelector('[data-element="reservationBlock"]');
    const noReservationsBlock = document.querySelector('[data-element="noReservations"]');
    const noReservationsText = document.querySelector('[data-element="noReservations_text"]');

    // Find the container - either the one with the specific attribute or the parent of the template
    const container = document.querySelector('[data-element="reservationContainer"]') ||
        (templateBlock && templateBlock.parentElement);

    // Check if container exists
    if (!container) {
        console.error('Reservation container not found');
        return;
    }

    // Clear the container first, but preserve the template block
    const originalTemplateBlock = templateBlock ? templateBlock.cloneNode(true) : null;
    container.innerHTML = '';

    // Add the template block back to the container (but keep it hidden)
    if (originalTemplateBlock) {
        originalTemplateBlock.style.display = 'none';
        container.appendChild(originalTemplateBlock);
    }

    // Add the no reservations block back to the container
    if (noReservationsBlock) {
        container.appendChild(noReservationsBlock);
        // Initially hide the no reservations block
        noReservationsBlock.style.display = 'none';
    }

    // Check if there are no reservations to display
    if (!reservations || reservations.length === 0) {
        // Show the no reservations block with appropriate message
        if (noReservationsBlock && noReservationsText) {
            noReservationsBlock.style.display = 'flex';
            if (type === 'current') {
                noReservationsText.textContent = "There are no active reservations right now.";
            } else if (type === 'upcoming') {
                noReservationsText.textContent = "There are no upcoming reservations right now.";
            } else if (type === 'past') {
                noReservationsText.textContent = "There are no past reservations.";
            } else if (type === 'cancelled') {
                noReservationsText.textContent = "There are no cancelled reservations.";
            } else {
                noReservationsText.textContent = "There are no reservations to display.";
            }
        } else {
            // Fallback if the elements don't exist
            const fallbackMessage = document.createElement('div');
            fallbackMessage.textContent = 'No reservations to display';
            container.appendChild(fallbackMessage);
        }
        return;
    }

    // If we have reservations but no template block, we can't proceed
    if (!originalTemplateBlock) {
        console.error('Reservation template block not found');
        return;
    }

    // Hide the no reservations block when there are reservations
    if (noReservationsBlock) {
        noReservationsBlock.style.display = 'none';
    }
    reservations.forEach(reservation => {
        const block = originalTemplateBlock.cloneNode(true);
        block.style.display = ''; // Make the cloned block visible
        block.classList.add('open_modal'); // Add open_modal class to each block

        const status = block.querySelector('[data-element="reservationBlock_status"]');
        const guest = block.querySelector('[data-element="reservationBlock_guest"]');
        const checkInDate = block.querySelector('[data-element="reservationBlock_checkInDate"]');
        const checkOutDate = block.querySelector('[data-element="reservationBlock_checkOutDate"]');
        const listingName = block.querySelector('[data-element="reservationBlock_listingName"]');
        const reservationCode = block.querySelector('[data-element="reservationBlock_reservationCode"]');
        const payout = block.querySelector('[data-element="reservationBlock_payout"]');

        // Set listing name with max 15 characters
        if (reservation._host_property[0]?.property_name) {
            const propertyName = reservation._host_property[0].property_name;
            listingName.textContent = propertyName.length > 16 ?
                propertyName.substring(0, 14) + '...' :
                propertyName;
        }

        // Set guest name
        if (reservation._guest_user?.First_Name && reservation._guest_user?.Last_Name) {
            guest.textContent = `${reservation._guest_user.First_Name} ${reservation._guest_user.Last_Name}`;
        }

        // Extract dates as YYYY-MM-DD
        const checkInDateStr = reservation.check_in.split('T')[0];
        const checkOutDateStr = reservation.check_out.split('T')[0];

        // Parse dates without creating Date objects
        const checkInYear = parseInt(checkInDateStr.substring(0, 4));
        const checkInMonth = parseInt(checkInDateStr.substring(5, 7)) - 1; // 0-based month index
        const checkInDay = parseInt(checkInDateStr.substring(8, 10));

        const checkOutYear = parseInt(checkOutDateStr.substring(0, 4));
        const checkOutMonth = parseInt(checkOutDateStr.substring(5, 7)) - 1; // 0-based month index
        const checkOutDay = parseInt(checkOutDateStr.substring(8, 10));

        // Manually format the dates
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const checkInMonthStr = months[checkInMonth];
        const checkOutMonthStr = months[checkOutMonth];

        // Set check-in and check-out dates
        checkInDate.textContent = `${checkInMonthStr}. ${checkInDay}, ${checkInYear}`;
        checkOutDate.textContent = `${checkOutMonthStr}. ${checkOutDay}, ${checkOutYear}`;

        // Set reservation code if available
        if (reservation.id) {
            reservationCode.textContent = `${reservation.reservation_code}`;
        }

        // Set payout amount if available
        if (reservation.nights_amount && reservation.cleaning_amount && reservation.hostFee_amount) {
            // For cancelled reservations, check if there's a refund amount
            if (type === 'cancelled' && reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0) {
                // If there's a refund, payout is $0
                payout.textContent = '$0.00';
            } else {
                const total = reservation.nights_amount + reservation.cleaning_amount - reservation.hostFee_amount;
                // Format to accounting format with thousands separator and 2 decimal places
                const formattedTotal = total.toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                payout.textContent = `$${formattedTotal}`;
            }
        }

        // Set status text based on reservation type
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (type === 'current') {
            status.textContent = 'Currently hosting';
        } else if (type === 'upcoming') {
            // Calculate days until arrival
            const daysUntilArrival = calculateDaysDifference(todayStr, checkInDateStr);
            status.textContent = daysUntilArrival === 1 ? 'Arrives in 1 day' : `Arrives in ${daysUntilArrival} days`;
        } else if (type === 'past') {
            status.textContent = 'Past reservation';
        } else if (type === 'cancelled') {
            status.textContent = 'Cancelled';
        } else {
            // For 'all' type, determine the appropriate text based on dates
            if (reservation.reservation_active === false) {
                status.textContent = 'Cancelled';
            } else if (todayStr >= checkInDateStr && todayStr <= checkOutDateStr) {
                status.textContent = 'Currently hosting';
            } else if (checkInDateStr > todayStr) {
                const daysUntilArrival = calculateDaysDifference(todayStr, checkInDateStr);
                status.textContent = daysUntilArrival === 1 ? 'Arrives in 1 day' : `Arrives in ${daysUntilArrival} days`;
            } else {
                status.textContent = 'Past reservation';
            }
        }

        // Add click event to open reservation details modal
        block.addEventListener('click', () => {
            displayReservationModal(reservation);
        });

        container.appendChild(block);
    });

    // Helper function to calculate days difference without Date objects
    function calculateDaysDifference(startDateStr, endDateStr) {
        // Parse dates
        const startYear = parseInt(startDateStr.substring(0, 4));
        const startMonth = parseInt(startDateStr.substring(5, 7));
        const startDay = parseInt(startDateStr.substring(8, 10));

        const endYear = parseInt(endDateStr.substring(0, 4));
        const endMonth = parseInt(endDateStr.substring(5, 7));
        const endDay = parseInt(endDateStr.substring(8, 10));

        // For simplicity, we'll use Date objects just for the calculation
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
}

// Function to update and display the reservation modal
function displayReservationModal(reservation) {
    const modal = document.querySelector('[data-element="reservationInfoModal"]');
    if (!modal) return;

    // Update modal information
    const nameElement = modal.querySelector('[data-element="reservationInfoModal_name"]');
    if (nameElement && reservation._guest_user?.First_Name && reservation._guest_user?.Last_Name) {
        nameElement.textContent = `${reservation._guest_user.First_Name} ${reservation._guest_user.Last_Name}`;
    }

    // Update property name
    const propertyNameElement = modal.querySelector('[data-element="reservationInfoModal_propertyName"]');
    if (propertyNameElement && reservation._host_property[0]?.property_name) {
        propertyNameElement.textContent = reservation._host_property[0]?.property_name;
    }

    const propertyDatesElement = modal.querySelector('[data-element="reservationInfoModal_dates"]');
    if (propertyDatesElement && reservation.check_in && reservation.check_out) {
        // Extract dates as YYYY-MM-DD
        const checkInStr = reservation.check_in.split('T')[0];
        const checkOutStr = reservation.check_out.split('T')[0];

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
    if (statusElement && reservation.check_in && reservation.check_out) {
        // Check if reservation is cancelled
        if (reservation.reservation_active === false) {
            statusElement.textContent = "Reservation Cancelled";
        } else {
            // Extract dates as YYYY-MM-DD
            const todayStr = new Date().toISOString().split('T')[0];
            const checkInStr = reservation.check_in.split('T')[0];
            const checkOutStr = reservation.check_out.split('T')[0];

            if (todayStr >= checkInStr && todayStr <= checkOutStr) {
                statusElement.textContent = "Currently Hosting";
            } else {
                statusElement.textContent = "Reservation Active";
            }
        }
    }

    const guestsPreviewElement = modal.querySelector('[data-element="reservationInfoModal_guestsPreview"]');
    if (guestsPreviewElement && reservation.guests) {
        guestsPreviewElement.textContent = `${reservation.guests} guests`;
    }
    const payoutPreviewElement = modal.querySelector('[data-element="reservationInfoModal_hostPayoutPreview"]');
    if (payoutPreviewElement && reservation.nights_amount) {
        // Make sure all values exist and are numbers, defaulting to 0 if undefined
        const nightsAmount = parseFloat(reservation.nights_amount) || 0;
        const cleaningFee = parseFloat(reservation.cleaning_amount) || 0;
        const hostFee = parseFloat(reservation.hostFee_amount) || 0;

        // Check if this is a cancelled reservation with a refund
        if (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0) {
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
    if (messagingElement && reservation.twilio_proxy_number) {
        // Format the phone number as +X (XXX) XXX-XXXX
        const phoneNumber = reservation.twilio_proxy_number;
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
    if (checkInDateElement && reservation.check_in) {
        // Extract date as YYYY-MM-DD
        const checkInDate = reservation.check_in.split('T')[0];

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
    if (checkOutDateElement && reservation.check_out) {
        // Extract date as YYYY-MM-DD
        const checkOutDate = reservation.check_out.split('T')[0];

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
        if (reservation.adult_guests && reservation.adult_guests > 0) {
            guestDetails.push(`${reservation.adult_guests} Adult${reservation.adult_guests !== 1 ? 's' : ''}`);
        }

        // Add children if present
        if (reservation.children_guests && reservation.children_guests > 0) {
            guestDetails.push(`${reservation.children_guests} Child${reservation.children_guests !== 1 ? 'ren' : ''}`);
        }

        // Add infants if present
        if (reservation.infant_guests && reservation.infant_guests > 0) {
            guestDetails.push(`${reservation.infant_guests} Infant${reservation.infant_guests !== 1 ? 's' : ''}`);
        }

        // Add pets if present
        if (reservation.pet_guests && reservation.pet_guests > 0) {
            guestDetails.push(`${reservation.pet_guests} Pet${reservation.pet_guests !== 1 ? 's' : ''}`);
        }

        // If no specific guest details are available, fall back to total guests
        if (guestDetails.length === 0 && reservation.guests) {
            guestsElement.textContent = `${reservation.guests} guests`;
        } else {
            guestsElement.textContent = guestDetails.join(', ');
        }
    }

    const reservationCodeElement = modal.querySelector('[data-element="reservationInfoModal_reservationCode"]');
    if (reservationCodeElement && reservation.reservation_code) {
        reservationCodeElement.textContent = `${reservation.reservation_code}`;
    }

    const reservedOnElement = modal.querySelector('[data-element="reservationInfoModal_reservedOn"]');
    if (reservedOnElement && reservation.created_at) {
        reservedOnElement.textContent = new Date(reservation.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const cancellationPolicyTypeElement = modal.querySelector('[data-element="reservationInfoModal_cancellationPolicyType"]');
    if (cancellationPolicyTypeElement && reservation.cancellationPolicy_type) {
        let policyText = reservation.cancellationPolicy_type;

        // Check if reservation is not active and has a cancellation refund date
        if (reservation.reservation_active === false && reservation.cancelled_refundDate) {
            // Extract the date in YYYY-MM-DD format
            const refundDateStr = reservation.cancelled_refundDate.split('T')[0];

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
    if (guestPaymentNightsTextElement && reservation.nights_amount) {
        // Use the reservation's check_in and check_out dates directly
        if (reservation.check_in && reservation.check_out) {
            // Extract dates as YYYY-MM-DD
            const checkInDate = reservation.check_in.split('T')[0];
            const checkOutDate = reservation.check_out.split('T')[0];

            // Calculate nights by using the date difference
            const date1 = new Date(checkInDate);
            const date2 = new Date(checkOutDate);
            const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

            // Calculate price per night
            const pricePerNight = reservation.nights_amount / nightsStay;

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
    if (guestPaymentNightsTotalElement && reservation.nights_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedNightsTotal = reservation.nights_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentNightsTotalElement.textContent = `$${formattedNightsTotal}`;
    }

    const guestPaymentCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_cleaningFeeTotal"]');
    if (guestPaymentCleaningFeeElement && reservation.cleaning_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedCleaningFee = reservation.cleaning_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
    }

    const guestPaymentServiceFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_guestServiceFeeTotal"]');
    if (guestPaymentServiceFeeElement && reservation.serviceFee_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedServiceFee = reservation.serviceFee_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentServiceFeeElement.textContent = `$${formattedServiceFee}`;
    }

    const guestPaymentSalesTaxElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_salesTaxTotal"]');
    if (guestPaymentSalesTaxElement && reservation.sales_tax_amount && reservation.sales_surTax_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedSalesTax = (reservation.sales_tax_amount + reservation.sales_surTax_amount).toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentSalesTaxElement.textContent = `$${formattedSalesTax}`;
    }

    const guestPaymentTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_total"]');
    if (guestPaymentTotalElement && reservation.reservation_amount_total) {
        // Format to 2 decimal places with thousands separator
        const formattedTotal = reservation.reservation_amount_total.toLocaleString('en-US', {
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
        if (!reservation.reservation_active || (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0)) {
            // Show the refund container
            guestPaymentRefundContainer.style.display = 'flex';

            // Get the refund amount (default to 0 if not specified)
            const refundAmount = reservation.cancelled_refundAmount || 0;

            // Format the refund amount
            const formattedRefund = refundAmount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentRefundAmount.textContent = `- $${formattedRefund}`;

            // Calculate and format the new total
            const newTotal = reservation.reservation_amount_total - refundAmount;
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
    if (hostPayoutNightsTextElement && reservation.nights_amount) {
        // Use the reservation's check_in and check_out dates directly
        if (reservation.check_in && reservation.check_out) {
            // Extract dates as YYYY-MM-DD
            const checkInDate = reservation.check_in.split('T')[0];
            const checkOutDate = reservation.check_out.split('T')[0];

            // Calculate nights by using the date difference
            const date1 = new Date(checkInDate);
            const date2 = new Date(checkOutDate);
            const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

            // Calculate price per night
            const pricePerNight = reservation.nights_amount / nightsStay;

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
    if (hostPayoutNightsTotalElement && reservation.nights_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedNightsTotal = reservation.nights_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutNightsTotalElement.textContent = `$${formattedNightsTotal}`;
    }

    const hostPayoutCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_cleaningFeeTotal"]');
    if (hostPayoutCleaningFeeElement && reservation.cleaning_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedCleaningFee = reservation.cleaning_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
    }

    const hostPayoutHostFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_hostServiceFeeTotal"]');
    if (hostPayoutHostFeeElement && reservation.hostFee_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedHostFee = reservation.hostFee_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutHostFeeElement.textContent = `- $${formattedHostFee}`;
    }

    const hostPayoutTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_payoutTotal"]');
    if (hostPayoutTotalElement) {
        // Calculate total as nightly total + cleaning fee - host fee
        const nightlyTotal = reservation.nights_amount || 0;
        const cleaningFee = reservation.cleaning_amount || 0;
        const hostFee = reservation.hostFee_amount || 0;

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
        if (reservation.reservation_active) {
            // Hide the refund container if reservation is active
            hostPayoutRefundContainer.style.display = 'none';
        } else {
            // Show the refund container
            hostPayoutRefundContainer.style.display = 'flex';

            // Calculate the host payout total
            const nightlyTotal = reservation.nights_amount || 0;
            const cleaningFee = reservation.cleaning_amount || 0;
            const hostFee = reservation.hostFee_amount || 0;
            const calculatedTotal = nightlyTotal + cleaningFee - hostFee;

            // If refund amount is 0 or not specified, no money was refunded
            const refundAmount = (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0)
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
