// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);



// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // // Add responsive behavior for different screen sizes
    // function handleResponsiveLayout() {
    //     const editContainer = document.querySelector('[data-element="editListing_bodyContainer"]');
    //     const cantEditContainer = document.querySelector('[data-element="cantEditListing_bodyContainer"]');

    //     if (window.innerWidth <= 768) {
    //         // For tablet and mobile: show the "can't edit" container
    //         if (cantEditContainer) cantEditContainer.style.display = 'flex';
    //         if (editContainer) editContainer.style.display = 'none';
    //     } else {
    //         // For desktop: show the edit container
    //         if (cantEditContainer) cantEditContainer.style.display = 'none';
    //         if (editContainer) editContainer.style.display = 'flex';
    //     }
    // }

    // // Run initially and add window resize event listener
    // handleResponsiveLayout();
    // window.addEventListener('resize', handleResponsiveLayout);

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

// Host Navigation Dropdown functionality
(async function () {
    try {
        const hostNavBarBlock = document.querySelector('[data-element="hostNavBar_navBarBlock"]');
        const hostNavBarDropdown = document.querySelector('[data-element="hostNavBar_dropdown"]');
        const hostNavBarBlockText = document.querySelector('[data-element="hostNavBar_navBarBlockText"]');
        let isHostDropdownOpen = false;

        if (!hostNavBarBlock || !hostNavBarDropdown) return;

        // Close the dropdown initially
        hostNavBarDropdown.style.display = 'none';

        // Function to get current page from URL
        const getCurrentPage = () => {
            const path = window.location.pathname;
            if (path.includes('/host/listings/edit')) return 'editListing';
            if (path.includes('/host/dashboard')) return 'dashboard';
            if (path.includes('/host/listings')) return 'listings';
            if (path.includes('/host/calendar')) return 'calendar';
            if (path.includes('/host/reservations')) return 'reservations';
            return null;
        };

        // Function to update the navbar block text and hide current page from dropdown
        const updateNavBarForCurrentPage = () => {
            const currentPage = getCurrentPage();
            const dashboardItem = document.querySelector('[data-element="hostNavBar_dashboard"]');
            const listingsItem = document.querySelector('[data-element="hostNavBar_listings"]');
            const calendarItem = document.querySelector('[data-element="hostNavBar_calendar"]');
            const reservationsItem = document.querySelector('[data-element="hostNavBar_reservations"]');

            // Show all items first
            [dashboardItem, listingsItem, calendarItem, reservationsItem].forEach(item => {
                if (item) item.style.display = 'block';
            });

            // Update text and hide current page item
            switch (currentPage) {
                case 'editListing':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Edit Listing';
                    // Show all dropdown items including listings
                    break;
                case 'dashboard':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Dashboard';
                    if (dashboardItem) dashboardItem.style.display = 'none';
                    break;
                case 'listings':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Listings';
                    if (listingsItem) listingsItem.style.display = 'none';
                    break;
                case 'calendar':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Calendar';
                    if (calendarItem) calendarItem.style.display = 'none';
                    break;
                case 'reservations':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Reservations';
                    if (reservationsItem) reservationsItem.style.display = 'none';
                    break;
                default:
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Host';
                    break;
            }
        };

        // Initialize the navbar for current page
        updateNavBarForCurrentPage();

        // Function to toggle the dropdown
        const toggleHostDropdown = () => {
            isHostDropdownOpen = !isHostDropdownOpen;
            hostNavBarDropdown.style.display = isHostDropdownOpen ? 'flex' : 'none';
        };

        // Event listener for host navbar block click
        hostNavBarBlock.addEventListener('click', function () {
            toggleHostDropdown();
        });

        // Event listener for body click to close the dropdown
        document.body.addEventListener('click', function (evt) {
            if (!hostNavBarBlock.contains(evt.target) && !hostNavBarDropdown.contains(evt.target)) {
                isHostDropdownOpen = false;
                hostNavBarDropdown.style.display = 'none';
            }
        });

        // Navigation handlers
        const setupNavigationHandler = (elementSelector, targetPath) => {
            const element = document.querySelector(`[data-element="${elementSelector}"]`);
            if (element) {
                element.addEventListener('click', function () {
                    isHostDropdownOpen = false;
                    hostNavBarDropdown.style.display = 'none';
                    window.location.href = targetPath;
                });
            }
        };

        // Setup navigation handlers for each menu item
        setupNavigationHandler('hostNavBar_dashboard', '/host/dashboard');
        setupNavigationHandler('hostNavBar_listings', '/host/listings');
        setupNavigationHandler('hostNavBar_calendar', '/host/calendar');
        setupNavigationHandler('hostNavBar_reservations', '/host/reservations');

    } catch (err) {
        console.error('Host navigation dropdown error:', err);
    }
})();


// Include jQuery first
var jQueryScript = document.createElement('script');
jQueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
document.head.appendChild(jQueryScript);

// Include jQuery UI after jQuery loads
jQueryScript.onload = function () {
    var jQueryUIScript = document.createElement('script');
    jQueryUIScript.src = 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js';
    document.head.appendChild(jQueryUIScript);

    // Include jQuery UI Sortable after jQuery UI loads
    jQueryUIScript.onload = function () {
        var jQueryUISortableScript = document.createElement('script');
        jQueryUISortableScript.src = 'https://code.jquery.com/ui/1.13.2/jquery-ui.js';
        document.head.appendChild(jQueryUISortableScript);
    };
};

// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

document.addEventListener('DOMContentLoaded', function () {

    // Get property ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');

    // Function to initialize color status monitoring
    function initializeColorStatusMonitoring(data) {
        const colorStatusElement = document.getElementById('editListingColorStatus');
        if (!colorStatusElement) return;

        // Keep a reference to the latest data
        let currentData = data;

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            background: white;
            border: 1.2px solid #e2e2e2;
            padding: 12px;
            border-radius: 4px;
            font-size: 14px;
            font-family: 'Tt Fors';
            font-weight: 400;
            font-color: #000000;
            max-width: 250px;
            display: none;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            flex-direction: column;
            gap: 20px;
        `;
        document.body.appendChild(tooltip);

        // Function to update tooltip content
        function updateTooltipContent() {
            // Create two separate divs for the sections
            const suggestedSection = document.createElement('div');
            const listingStatusSection = document.createElement('div');

            // Only show suggested section if there are errors
            if (hasSuggestedSectionErrors) {
                const titleSpan = document.createElement('span');
                titleSpan.textContent = 'Suggested Information\n';
                titleSpan.style.fontWeight = '500';

                const messageSpan = document.createElement('span');
                messageSpan.textContent = 'Missing in: ';
                messageSpan.textContent += errorSections.map(section => `${section} section`).join(', ');

                suggestedSection.appendChild(titleSpan);
                suggestedSection.appendChild(messageSpan);
            }

            // Listing status message
            const titleSpan = document.createElement('span');
            titleSpan.textContent = 'Listing Status\n';
            titleSpan.style.fontWeight = '500';

            const messageSpan = document.createElement('span');

            // Check if listing is approved
            const isApproved = currentData.keysBookingApprovedListing === true;
            const hasTaxData = currentData._host_taxes && currentData._host_taxes.length > 0;

            if (!hasTaxData) {
                messageSpan.textContent = 'Listing is currently inactive.\nComplete required items to activate.';
            } else if (!isApproved) {
                messageSpan.textContent = 'Listing is pending approval.\nYou\'ll be notified when approved.';
            } else if (currentData.is_active) {
                messageSpan.textContent = 'Listing is active!';
            } else {
                messageSpan.textContent = 'Listing is currently inactive.\nVisit the Listing Status section to activate.';
            }

            listingStatusSection.appendChild(titleSpan);
            listingStatusSection.appendChild(messageSpan);

            // Clear tooltip and append sections
            tooltip.innerHTML = '';
            if (hasSuggestedSectionErrors) {
                tooltip.appendChild(suggestedSection);
            }
            tooltip.appendChild(listingStatusSection);
        }

        let hasSuggestedSectionErrors = false;
        let errorSections = [];

        // Function to check for validation errors and update status color
        function updateColorStatus(newData) {
            // Update current data if new data is provided
            if (newData) {
                currentData = { ...currentData, ...newData };
            }

            // Use currentData for validation checks
            if (!currentData) return;

            hasSuggestedSectionErrors = false;
            errorSections = [];

            // Get relevant sections
            const photosSection = document.querySelector('[data-element="edit_photos"]');
            const hostSection = document.querySelector('[data-element="edit_host"]');
            const locationSection = document.querySelector('[data-element="edit_location"]');

            // Setup interval to continuously check background colors
            setInterval(() => {
                // Check photos section
                if (photosSection) {
                    const photosColor = window.getComputedStyle(photosSection).backgroundColor;
                    if (photosColor === 'rgb(255, 229, 229)') { // #FFE5E5
                        hasSuggestedSectionErrors = true;
                        if (!errorSections.includes('Photos')) {
                            errorSections.push('Photos');
                        }
                    }
                }

                // Check host section
                if (hostSection) {
                    const hostColor = window.getComputedStyle(hostSection).backgroundColor;
                    if (hostColor === 'rgb(255, 229, 229)') { // #FFE5E5
                        hasSuggestedSectionErrors = true;
                        if (!errorSections.includes('Host')) {
                            errorSections.push('Host');
                        }
                    }
                }

                // Check location section
                if (locationSection) {
                    const locationColor = window.getComputedStyle(locationSection).backgroundColor;
                    if (locationColor === 'rgb(255, 229, 229)') { // #FFE5E5
                        hasSuggestedSectionErrors = true;
                        if (!errorSections.includes('Location')) {
                            errorSections.push('Location');
                        }
                    }
                }

                // Update color status based on errors, approval status and listing status
                const isApprovedForColorStatus = currentData.keysBookingApprovedListing === true;

                if (!currentData.is_active) {
                    colorStatusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.18)';
                } else if (!isApprovedForColorStatus) {
                    colorStatusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.18)';
                } else if (hasSuggestedSectionErrors) {
                    colorStatusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.18)';
                } else {
                    colorStatusElement.style.backgroundColor = 'rgba(0, 255, 0, 0.18)';
                }

                // Update tooltip content regardless of visibility
                updateTooltipContent();
            }, 1000); // Check every second
        }

        // Function to position and show tooltip
        function showTooltip() {
            const rect = colorStatusElement.getBoundingClientRect();
            const screenWidth = window.innerWidth;

            // Position tooltip to the left on mobile/tablet (991px or less)
            if (screenWidth <= 991) {
                tooltip.style.right = `${window.innerWidth - rect.left}px`;
                tooltip.style.left = 'auto';
                tooltip.style.top = `${rect.bottom + 5}px`;
            } else {
                // Position tooltip below on desktop
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.right = 'auto';
                tooltip.style.top = `${rect.bottom + 5}px`;
            }

            tooltip.style.display = 'flex';
        }

        // Add hover events for desktop
        colorStatusElement.addEventListener('mouseenter', (e) => {
            if (window.innerWidth > 991) {
                showTooltip();
            }
        });

        colorStatusElement.addEventListener('mouseleave', () => {
            if (window.innerWidth > 991) {
                tooltip.style.display = 'none';
            }
        });

        // Add click events for mobile (991px or less)
        colorStatusElement.addEventListener('click', (e) => {
            if (window.innerWidth <= 991) {
                e.stopPropagation();
                if (tooltip.style.display === 'flex') {
                    tooltip.style.display = 'none';
                } else {
                    showTooltip();
                }
            }
        });

        // Close tooltip when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 991 &&
                !colorStatusElement.contains(e.target) &&
                !tooltip.contains(e.target)) {
                tooltip.style.display = 'none';
            }
        });

        // Initial check
        updateColorStatus();

        // Re-check status after any API request completes
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);
            const url = args[0];

            if (typeof url === 'string' && url.includes('xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX')) {
                const clonedResponse = response.clone();
                try {
                    const responseData = await clonedResponse.json();
                    updateColorStatus(responseData);
                } catch (e) {
                    console.error('Error updating color status:', e);
                }
            }

            return response;
        };
    }

    // Initialize delete listing section functionality
    function initializeDeleteListingSection(data) {
        const deleteButton = document.querySelector('[data-element="deleteListing_delete"]');
        const editButton = document.getElementById('editListing_editButton_deleteListing');
        const buttonContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_deleteListing');
        const cancelButton = document.getElementById('editListing_cancelButton_deleteListing');
        const saveButton = document.getElementById('editListing_saveButton_deleteListing');
        const container = document.querySelector('[data-element="deleteListing_container"]');
        const deleteListingError = document.getElementById('deleteListing-error');

        let isDeleted = false;
        let originalState = false;
        let originalBackgroundColor = container.style.backgroundColor;
        let hasFutureReservations = false;

        // Function to check for future reservations
        async function checkFutureReservations() {
            try {
                const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_reservations?property_id=${propertyId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch reservations');
                }

                const reservations = await response.json();
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of day

                // Check if any reservation has checkout date today or in the future
                hasFutureReservations = reservations.some(reservation => {
                    const checkoutDate = new Date(reservation.check_out);
                    return checkoutDate >= today;
                });

                return hasFutureReservations;
            } catch (error) {
                console.error('Error checking reservations:', error);
                return false;
            }
        }

        if (deleteButton && editButton && buttonContainer && container) {
            // Initial state
            buttonContainer.style.display = 'none';
            deleteButton.style.opacity = '0.5';
            if (deleteListingError) deleteListingError.style.display = 'none';

            // Check for future reservations when initializing
            checkFutureReservations();

            // Edit button click handler
            editButton.addEventListener('click', async () => {
                // Re-check for future reservations when edit is clicked
                await checkFutureReservations();

                originalState = isDeleted;
                editButton.style.display = 'none';
                buttonContainer.style.display = 'flex';
                container.style.opacity = '1';
                container.style.backgroundColor = '#FFFFFF';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.opacity = '1';

                if (deleteListingError) {
                    // Show warning if there are future reservations
                    if (hasFutureReservations) {
                        deleteListingError.textContent = "Unable to delete listing with future reservations. All guest stays must be completed first.";
                        deleteListingError.style.display = 'block';
                        // Disable the delete button
                        deleteButton.style.opacity = '0.5';
                        deleteButton.style.cursor = 'not-allowed';
                    } else {
                        deleteListingError.style.display = 'none';
                    }
                }
            });

            // Delete button click handler
            deleteButton.addEventListener('click', () => {
                if (buttonContainer.style.display === 'flex' && !hasFutureReservations) {
                    isDeleted = !isDeleted;
                    deleteButton.style.outline = isDeleted ? '2px solid black' : 'none';
                    deleteButton.style.outlineOffset = isDeleted ? '-1px' : '0';
                } else if (hasFutureReservations) {
                    // If user tries to click with future reservations, show error
                    if (deleteListingError) {
                        deleteListingError.textContent = "Unable to delete listing with future reservations. All guest stays must be completed first.";
                        deleteListingError.style.display = 'block';
                    }
                }
            });

            // Cancel button click handler
            cancelButton.addEventListener('click', () => {
                isDeleted = originalState;
                deleteButton.style.outline = isDeleted ? '2px solid black' : 'none';
                deleteButton.style.outlineOffset = isDeleted ? '-1px' : '0';
                editButton.style.display = 'flex';
                buttonContainer.style.display = 'none';
                container.style.opacity = '0.5';
                container.style.backgroundColor = originalBackgroundColor;
                deleteButton.style.cursor = 'default';
                deleteButton.style.opacity = '0.5';
                if (deleteListingError) deleteListingError.style.display = 'none';
            });

            // Save button click handler
            saveButton.addEventListener('click', async () => {
                // Check again for future reservations before saving
                await checkFutureReservations();

                if (hasFutureReservations) {
                    if (deleteListingError) {
                        deleteListingError.textContent = "Unable to delete listing with future reservations. All guest stays must be completed first.";
                        deleteListingError.style.display = 'block';
                    }
                    return;
                }

                try {
                    // Wait for user ID to be available
                    window.Wized = window.Wized || [];
                    await window.Wized.requests.waitFor('Load_user');
                    const userId = window.Wized.data.r.Load_user.data.id;

                    const requestData = {
                        property_id: propertyId,
                        user_id: userId,
                        delete: isDeleted
                    };

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_deleteListing', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    container.style.backgroundColor = originalBackgroundColor;
                    editButton.style.display = 'flex';
                    buttonContainer.style.display = 'none';
                    container.style.opacity = '0.5';
                    deleteButton.style.cursor = 'default';
                    deleteButton.style.opacity = '0.5';
                    if (deleteListingError) deleteListingError.style.display = 'none';

                    // Redirect to dashboard after successful request
                    window.location.href = '/host/dashboard';

                } catch (error) {
                    console.error('Error updating delete status:', error);
                    if (deleteListingError) {
                        deleteListingError.textContent = "Request could not be processed. Please try again later.";
                        deleteListingError.style.display = 'block';
                    }
                }
            });
        }
    }

    // Initialize photos section functionality  
    function initializePhotosSection(data) {
        const addPhotosButton2 = document.getElementById('addPhotosButton_edit');
        const photoContainerParent = document.querySelector('[data-element="photo_container_parent"]');
        const photoContainer = document.querySelector('[data-element="photo_container"]');
        const photosError = document.getElementById('photos-error');
        const photosSubText = document.getElementById('photos-subText');
        const addRemovePhotosButton = document.querySelector('[data-element="edit_photos_addRemovePhotos"]');
        const addRemovePhotosModal = document.getElementById('addRemovePhotos-modal');
        const bedroomPhotosModal = document.getElementById('bedroomPhotos-modal');
        const dockPhotosModal = document.getElementById('dockPhotos-modal');
        const cancelButton = document.getElementById('editListing_cancelButton_addPhotos');
        const saveButton = document.getElementById('editListing_saveButton_addPhotos');
        const bedroomCancelButton = document.getElementById('editListing_cancelButton_bedroomPhotos');
        const bedroomSaveButton = document.getElementById('editListing_saveButton_bedroomPhotos');
        const dockCancelButton = document.getElementById('editListing_cancelButton_dockPhotos');
        const dockSaveButton = document.getElementById('editListing_saveButton_dockPhotos');
        const bedroomPhotosError = document.getElementById('bedroomPhotos-error');
        const bedroomPhotosSubText = document.getElementById('bedroomPhotos-subText');
        const dockPhotosError = document.getElementById('dockPhotos-error');
        const dockPhotosSubText = document.getElementById('dockPhotos-subText');
        const previewImage = document.querySelector('[data-element="edit_photos_addRemovePhotos_image"]');
        const editPhotosText = document.querySelector('[data-element="edit_photos_text"]');
        const arrangePhotosButton = document.querySelector('[data-element="edit_photos_arrangePhotos"]');
        const arrangePhotosImage = document.querySelector('[data-element="edit_photos_arrangePhotos_image"]');
        const arrangePhotosModal = document.getElementById('arrangePhotos-modal');
        const arrangeCancelButton = document.getElementById('editListing_cancelButton_arrangePhotos');
        const arrangeSaveButton = document.getElementById('editListing_saveButton_arrangePhotos');
        const arrangePhotosGrid = document.getElementById('arrangePhotos_gridContainer');
        const arrangePhotosError = document.getElementById('arrangePhotos-error');
        const arrangePhotosSubText = document.getElementById('arrangePhotos-subText');

        // Store photos data locally
        let localPhotos = [];
        let savedPhotosCount = 0;
        let currentBedroomNumber = 1;
        let tempBedroomSelections = {}; // Store temporary bedroom photo selections
        let tempDockSelections = {}; // Store temporary dock photo selections

        // Store bed counts for each bedroom
        let bedroomBeds = {};
        let initialBedroomBeds = {};
        let initialBedroomDescriptions = {};

        // Bed types available
        const bedTypes = ['single', 'double', 'queen', 'king', 'twin', 'bunkBed', 'sofaBed', 'crib'];

        function initializeArrangePhotos() {
            if (arrangePhotosButton && arrangePhotosModal) {
                arrangePhotosButton.addEventListener('click', () => {
                    // Create a deep copy of localPhotos for temporary changes
                    const tempPhotos = localPhotos.map(photo => ({ ...photo }));

                    arrangePhotosModal.style.display = 'flex';
                    initializeArrangePhotosModal(tempPhotos);
                });
            }

            if (arrangePhotosImage && localPhotos.length > 0) {
                // Show first photo in preview
                const firstPhoto = localPhotos.find(photo => photo.coverPhotoOrder === 1);
                if (firstPhoto) {
                    arrangePhotosImage.src = firstPhoto.url || firstPhoto.image;
                }
            }
        }

        function initializeArrangePhotosModal(tempPhotos) {
            const gridContainer = document.getElementById('arrangePhotos_gridContainer');

            if (!gridContainer || !tempPhotos.length) return;

            // Clear existing content
            gridContainer.innerHTML = '';

            // Add CSS styles to constrain photo sizes
            gridContainer.style.display = 'grid';
            gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, 220px)';
            gridContainer.style.gap = '10px';
            gridContainer.style.padding = '10px';

            // Sort photos by inPreviewOrder before creating grid
            tempPhotos.sort((a, b) => (a.coverPhotoOrder || 999) - (b.coverPhotoOrder || 999));

            // Create and append image elements to grid
            tempPhotos.forEach(photo => {
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'photo-item';
                imageWrapper.style.width = '220px';
                imageWrapper.style.height = '220px';
                imageWrapper.style.aspectRatio = '1 / 1';
                imageWrapper.style.maxWidth = '220px';
                imageWrapper.style.maxHeight = '220px';
                imageWrapper.style.borderRadius = '5px';
                imageWrapper.style.cursor = 'move';

                const img = document.createElement('img');
                img.src = photo.url;
                img.alt = photo.description || '';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '5px';
                img.style.objectFit = 'cover';
                img.draggable = false;

                imageWrapper.appendChild(img);
                gridContainer.appendChild(imageWrapper);
            });

            // Initialize jQuery UI sortable
            $(gridContainer).sortable({
                swapThreshold: 0.5,
                animation: 150,
                items: '.photo-item',
                containment: 'parent',
                cursor: 'move',
                tolerance: 'pointer',
                revert: true,
                helper: 'clone',
                opacity: 1,
                zIndex: 9999,
                stop: function (event, ui) {
                    const items = gridContainer.getElementsByClassName('photo-item');

                    Array.from(items).forEach((item, i) => {
                        const imgSrc = item.querySelector('img').src;
                        const photo = tempPhotos.find(p => p.url === imgSrc);
                        if (photo) {
                            photo.coverPhotoOrder = i + 1;
                            photo.isCoverPhoto = i < 5;
                        }
                    });
                }
            });

            const closeModal = () => {
                arrangePhotosModal.style.display = 'none';
            };

            // Close modal when clicking cancel button
            if (arrangeCancelButton) {
                arrangeCancelButton.removeEventListener('click', closeModal);
                arrangeCancelButton.addEventListener('click', closeModal);
            }

            // Close modal when clicking outside
            if (arrangePhotosModal) {
                arrangePhotosModal.removeEventListener('click', closeModal);
                arrangePhotosModal.addEventListener('click', (e) => {
                    if (e.target === arrangePhotosModal) {
                        closeModal();
                    }
                });
            }

            // Hide error message initially
            if (arrangePhotosError) {
                arrangePhotosError.style.display = 'none';
            }

            // Remove any existing click handlers from save button
            if (arrangeSaveButton) {
                const oldClickHandlers = $._data(arrangeSaveButton, "events");
                if (oldClickHandlers && oldClickHandlers.click) {
                    $(arrangeSaveButton).off('click');
                }

                // Get text and loader elements
                const saveButtonText = document.getElementById('editListing_saveButton_arrangePhotos_text');
                const saveButtonLoader = document.getElementById('editListing_saveButton_arrangePhotos_loader');

                // Initially hide loader
                if (saveButtonLoader) {
                    saveButtonLoader.style.display = 'none';
                }

                // Add new click handler
                arrangeSaveButton.addEventListener('click', async () => {
                    if (arrangeSaveButton.dataset.saving === 'true') return;
                    arrangeSaveButton.dataset.saving = 'true';

                    // Show loader and hide text while requesting
                    if (saveButtonLoader && saveButtonText) {
                        saveButtonLoader.style.display = 'block';
                        saveButtonText.style.display = 'none';
                    }

                    try {
                        // Get current order from DOM to ensure latest changes
                        const currentItems = gridContainer.getElementsByClassName('photo-item');
                        Array.from(currentItems).forEach((item, i) => {
                            const imgSrc = item.querySelector('img').src;
                            const photo = tempPhotos.find(p => p.url === imgSrc);
                            if (photo) {
                                photo.coverPhotoOrder = i + 1;
                                photo.isCoverPhoto = i < 5;
                            }
                        });

                        const requestData = {
                            property_id: data.id,
                            host_id: data.host_user_id,
                            addedPhotos: tempPhotos.map(photo => ({
                                image: photo.id ? photo.url : photo.image,
                                isCoverPhoto: photo.isCoverPhoto,
                                coverPhotoOrder: photo.coverPhotoOrder,
                                isDockPhoto: photo.isDockPhoto,
                                dockPhotoOrder: photo.dockPhotoOrder,
                                isBedroomPhoto: photo.isBedroomPhoto,
                                bedroomOrder: photo.bedroomOrder,
                                description: photo.description,
                                description_header: photo.bedroomOrder ? `Bedroom ${photo.bedroomOrder}` : null
                            }))
                        };

                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_photos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestData)
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Failed to save photos');
                        }

                        // Update localPhotos with the new arrangement
                        localPhotos = JSON.parse(JSON.stringify(tempPhotos)); // Deep copy to ensure complete separation

                        // Update arrange photos preview image with new first photo
                        if (arrangePhotosImage) {
                            const firstPhoto = localPhotos.find(photo => photo.coverPhotoOrder === 1);
                            if (firstPhoto) {
                                arrangePhotosImage.src = firstPhoto.url;
                                if (previewImage) {
                                    previewImage.src = firstPhoto.url;
                                }
                            }
                        }

                        // Hide error and show subtext on success
                        if (arrangePhotosError) arrangePhotosError.style.display = 'none';
                        if (arrangePhotosSubText) arrangePhotosSubText.style.display = 'block';

                        closeModal();

                        // Reload the page after everything else is done
                        window.location.reload();

                    } catch (error) {
                        console.error('Error saving photos:', error);
                        if (arrangePhotosError) {
                            arrangePhotosError.textContent = "Request failed. Please try again later.";
                            arrangePhotosError.style.display = 'block';
                        }
                        if (arrangePhotosSubText) arrangePhotosSubText.style.display = 'none';
                    } finally {
                        arrangeSaveButton.dataset.saving = 'false';
                        // Show text and hide loader after request completes
                        if (saveButtonLoader && saveButtonText) {
                            saveButtonLoader.style.display = 'none';
                            saveButtonText.style.display = 'block';
                        }
                    }
                });
            }
        }

        // Function to check if all bedrooms have photos and beds assigned and dock photos
        function checkMissingBedroomAndDockData() {
            let hasErrors = false;
            let errorMessages = [];

            // Get number of bedrooms from data
            const numBedrooms = data.num_bedrooms || 0;

            if (numBedrooms > 0) {
                // Check each bedroom and track missing ones
                const missingBedrooms = [];
                for (let i = 1; i <= numBedrooms; i++) {
                    // Check if this bedroom has an assigned photo
                    const hasPhoto = localPhotos.some(photo =>
                        photo.isBedroomPhoto && photo.bedroomOrder === i
                    );

                    // Check if this bedroom has beds configured
                    const hasBeds = bedroomBeds[i] && Object.values(bedroomBeds[i]).some(count => count > 0);

                    if (!hasPhoto || !hasBeds) {
                        missingBedrooms.push(i);
                    }
                }

                if (missingBedrooms.length > 0) {
                    const bedroomList = missingBedrooms.map(num => `Bedroom ${num}`).join(' & ');
                    errorMessages.push(`Please add missing information for ${bedroomList}`);
                    hasErrors = true;
                }
            }

            // Check dock photos only if property has a private dock
            if (data.private_dock) {
                const dockPhotos = localPhotos.filter(photo => photo.isDockPhoto);
                if (dockPhotos.length !== 2) {
                    errorMessages.push('Please select two dock photos');
                    hasErrors = true;
                } else {
                    // Clear dock photos error if exactly 2 dock photos are present
                    if (dockPhotosError) dockPhotosError.style.display = 'none';
                    if (dockPhotosSubText) dockPhotosSubText.style.display = 'block';
                }
            }

            // Update error display
            if (hasErrors) {
                if (photosError) {
                    photosError.textContent = errorMessages.join('. ');
                    photosError.style.display = 'block';
                }
                if (photosSubText) {
                    photosSubText.style.display = 'none';
                }
                const editPhotosElement = document.querySelector('[data-element="edit_photos"]');
                if (editPhotosElement) {
                    editPhotosElement.style.backgroundColor = '#FFE5E5';
                }
                return false;
            }

            // If we get here, everything is properly configured
            if (photosError) photosError.style.display = 'none';
            if (photosSubText) photosSubText.style.display = 'block';
            const editPhotosElement = document.querySelector('[data-element="edit_photos"]');
            if (editPhotosElement) {
                editPhotosElement.style.backgroundColor = '#FFFFFF';
            }
            return true;
        }

        // SVG button templates
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
        const svgMinusNull = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#D3D3D3" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#D3D3D3"></rect>
            </svg>
        `;

        if (data._pictures && data._pictures.length > 0) {
            localPhotos = data._pictures.map(pic => {
                // Parse bed info from description if available
                if (pic.property_image_description_subheader) {
                    const bedInfo = parseBedDescription(pic.property_image_description_subheader, pic.bedroomOrder);
                    if (bedInfo) {
                        bedroomBeds[pic.bedroomOrder] = bedInfo;
                        initialBedroomBeds[pic.bedroomOrder] = { ...bedInfo }; // Store initial state
                        initialBedroomDescriptions[pic.bedroomOrder] = pic.property_image_description_subheader;
                    }
                }

                return {
                    id: pic.id,
                    url: pic.property_image.url,
                    image: pic.property_image.url,
                    isCoverPhoto: pic.inHeaderPreview,
                    coverPhotoOrder: pic.inPreviewOrder,
                    isDockPhoto: pic.in_dock_section,
                    dockPhotoOrder: pic.in_dock_section_order,
                    isBedroomPhoto: pic.inBedroomSection,
                    bedroomOrder: pic.bedroomOrder,
                    description: pic.property_image_description_subheader
                };
            });

            // Sort by coverPhotoOrder if it exists
            localPhotos.sort((a, b) => a.coverPhotoOrder - b.coverPhotoOrder);
            savedPhotosCount = localPhotos.length;

            // Set initial preview image
            if (previewImage && localPhotos.length > 0) {
                previewImage.src = localPhotos[0].url;
            }

            // Set initial photos count text
            if (editPhotosText) {
                editPhotosText.textContent = `${savedPhotosCount} photos`;
            }
        }


        function parseBedDescription(description, bedroomNumber) {
            const bedCounts = {
                single: 0,
                double: 0,
                queen: 0,
                king: 0,
                twin: 0,
                bunkBed: 0,
                sofaBed: 0,
                crib: 0
            };

            const parts = description.toLowerCase().split('&');
            parts.forEach(part => {
                const match = part.match(/(\d+)\s+(.*?)\s+bed/);
                if (match) {
                    const count = parseInt(match[1]);
                    const type = match[2];

                    if (type.includes('king')) bedCounts.king = count;
                    else if (type.includes('queen')) bedCounts.queen = count;
                    else if (type.includes('full') || type.includes('double')) bedCounts.double = count;
                    else if (type.includes('twin')) bedCounts.twin = count;
                    else if (type.includes('single')) bedCounts.single = count;
                    else if (type.includes('bunk')) bedCounts.bunkBed = count;
                    else if (type.includes('sofa')) bedCounts.sofaBed = count;
                    else if (type.includes('crib')) bedCounts.crib = count;
                }
            });

            return bedCounts;
        }

        // Initialize bedroom photos section
        function initializeBedroomPhotos() {
            const numBedrooms = data.num_bedrooms || 0;
            const bedroomContainer = document.querySelector('[data-element="bedroomPhotos_container"]');
            const bedroomParentContainer = bedroomContainer?.parentElement;

            if (!bedroomContainer || !bedroomParentContainer) return;

            // Clear existing bedroom containers first
            const existingContainers = document.querySelectorAll('[data-element="bedroomPhotos_container"]');
            existingContainers.forEach((container, index) => {
                if (index > 0) container.remove();
            });

            // Create containers for each bedroom
            for (let i = 0; i < numBedrooms; i++) {
                const bedroomIndex = i + 1;
                const container = i === 0 ? bedroomContainer : bedroomContainer.cloneNode(true);

                // Find all assigned photos for this bedroom
                const assignedPhotos = localPhotos.filter(photo =>
                    photo.isBedroomPhoto && photo.bedroomOrder === bedroomIndex
                );

                const addImageElement = container.querySelector('[data-element="bedroomPhotos_addImage"]');
                const imageElement = container.querySelector('[data-element="bedroomPhotos_image"]');
                const containerText = container.querySelector('[data-element="bedroomPhotos_containerText"]');
                const headerText = container.querySelector('[data-element="bedroomPhotos_header"]');

                // Update bedroom number text for both elements
                const bedroomText = `Bedroom ${bedroomIndex}`;
                if (containerText) {
                    containerText.textContent = bedroomText;
                }
                if (headerText) {
                    headerText.textContent = bedroomText;
                }

                // Move containerText after imageElement
                if (containerText && imageElement && containerText.parentNode) {
                    containerText.parentNode.insertBefore(imageElement, containerText);
                }

                if (assignedPhotos.length > 0) {
                    // Hide add image button
                    if (addImageElement) addImageElement.style.display = 'none';

                    // Remove any existing image elements
                    const existingImages = container.querySelectorAll('[data-element="bedroomPhotos_image"]');
                    existingImages.forEach(img => img.remove());

                    // Create and append image elements for each assigned photo
                    assignedPhotos.forEach((photo, index) => {
                        const newImageElement = imageElement.cloneNode(true);
                        newImageElement.style.display = 'flex';
                        newImageElement.src = photo.url;
                        container.insertBefore(newImageElement, containerText);
                    });
                } else {
                    // Show add image button if no photos assigned
                    if (addImageElement) addImageElement.style.display = 'flex';
                    if (imageElement) imageElement.style.display = 'none';
                }

                // Add click handler for bedroom container
                container.addEventListener('click', () => {
                    currentBedroomNumber = bedroomIndex;
                    if (bedroomPhotosModal) {
                        bedroomPhotosModal.style.display = 'flex';
                        initializeBedroomPhotosModal(bedroomIndex);

                        // Update modal header text
                        const modalHeaderText = bedroomPhotosModal.querySelector('[data-element="bedroomPhotos_header"]');
                        if (modalHeaderText) {
                            modalHeaderText.textContent = `Bedroom ${bedroomIndex}`;
                        }

                        // Initialize bed counters with initial values
                        initializeBedroomBedCounters(bedroomIndex, true);

                        // Hide error and show subtext initially
                        if (bedroomPhotosError) bedroomPhotosError.style.display = 'none';
                        if (bedroomPhotosSubText) bedroomPhotosSubText.style.display = 'block';
                    }
                });

                if (i > 0) {
                    bedroomParentContainer.appendChild(container);
                }
            }
        }

        // Initialize dock photos modal
        function initializeDockPhotosModal() {
            const modalContainer = document.querySelector('[data-element="dockPhotos_Container"]');
            if (!modalContainer) return;

            const photoContainer = modalContainer.querySelector('[data-element="dockPhotos_photoContainer"]');
            if (!photoContainer) return;

            // Clear existing photo containers
            modalContainer.querySelectorAll('[data-element="dockPhotos_photoContainer"]').forEach(container => {
                if (container !== photoContainer) {
                    container.remove();
                }
            });

            // Initialize tempDockSelections with current dock photos
            tempDockSelections = {};
            const currentDockPhotos = localPhotos.filter(photo => photo.isDockPhoto)
                .sort((a, b) => a.dockPhotoOrder - b.dockPhotoOrder)
                .slice(0, 2);

            currentDockPhotos.forEach(photo => {
                tempDockSelections[photo.id] = {
                    photoId: photo.id,
                    isDockPhoto: true,
                    dockPhotoOrder: photo.dockPhotoOrder
                };
            });

            // Create containers for all available photos
            localPhotos.forEach((photo, index) => {
                const newPhotoContainer = index === 0 ? photoContainer : photoContainer.cloneNode(true);

                const img = newPhotoContainer.querySelector('[data-element="dockPhotos_image"]');
                const numberElement = newPhotoContainer.querySelector('[data-element="dockPhotos_number"]');

                if (img) {
                    img.src = photo.url;
                    img.style.display = 'block';
                }

                // Initially hide number element
                if (numberElement) {
                    numberElement.style.display = 'none';
                }

                // Check if this photo is already a dock photo
                if (tempDockSelections[photo.id]) {
                    newPhotoContainer.style.outline = '2px solid black';
                    newPhotoContainer.style.outlineOffset = '-1px';
                    if (numberElement) {
                        numberElement.style.display = 'flex';
                        numberElement.textContent = tempDockSelections[photo.id].dockPhotoOrder;
                        numberElement.style.backgroundColor = Object.keys(tempDockSelections).length === 2 ? '#90EE90' : 'white';
                    }
                }

                newPhotoContainer.addEventListener('click', () => {
                    const isSelected = tempDockSelections[photo.id];
                    const selectedCount = Object.keys(tempDockSelections).length;

                    if (isSelected) {
                        // Deselect photo
                        newPhotoContainer.style.outline = 'none';
                        if (numberElement) numberElement.style.display = 'none';
                        delete tempDockSelections[photo.id];

                        // Update remaining photo number if needed
                        const remainingPhotoId = Object.keys(tempDockSelections)[0];
                        if (remainingPhotoId) {
                            tempDockSelections[remainingPhotoId].dockPhotoOrder = 1;
                        }
                    } else if (selectedCount < 2) {
                        // Select new photo
                        newPhotoContainer.style.outline = '2px solid black';
                        newPhotoContainer.style.outlineOffset = '-1px';
                        if (numberElement) {
                            numberElement.style.display = 'flex';
                            numberElement.textContent = selectedCount + 1;
                        }
                        tempDockSelections[photo.id] = {
                            photoId: photo.id,
                            isDockPhoto: true,
                            dockPhotoOrder: selectedCount + 1
                        };
                    }

                    // Update all number displays and colors
                    const newSelectedCount = Object.keys(tempDockSelections).length;
                    modalContainer.querySelectorAll('[data-element="dockPhotos_photoContainer"]').forEach((container, idx) => {
                        const num = container.querySelector('[data-element="dockPhotos_number"]');
                        const currentPhotoId = localPhotos[idx].id;

                        if (tempDockSelections[currentPhotoId]) {
                            container.style.outline = '2px solid black';
                            container.style.outlineOffset = '-1px';
                            if (num) {
                                num.style.display = 'flex';
                                num.textContent = tempDockSelections[currentPhotoId].dockPhotoOrder;
                                num.style.backgroundColor = newSelectedCount === 2 ? '#90EE90' : 'white';
                            }
                        } else {
                            container.style.outline = 'none';
                            if (num) num.style.display = 'none';
                        }
                    });
                });

                if (index > 0) {
                    modalContainer.appendChild(newPhotoContainer);
                }
            });
        }

        function initializeBedroomBedCounters(bedroomNumber, useInitialState = false) {
            // Use initial state if specified or available, otherwise use current state or default to zeros
            const bedCounts = useInitialState ?
                {
                    ...(initialBedroomBeds[bedroomNumber] || {
                        single: 0,
                        double: 0,
                        queen: 0,
                        king: 0,
                        twin: 0,
                        bunkBed: 0,
                        sofaBed: 0,
                        crib: 0
                    })
                } :
                {
                    ...(bedroomBeds[bedroomNumber] || {
                        single: 0,
                        double: 0,
                        queen: 0,
                        king: 0,
                        twin: 0,
                        bunkBed: 0,
                        sofaBed: 0,
                        crib: 0
                    })
                };

            // Update text fields with stored values
            bedTypes.forEach(type => {
                const textElement = document.getElementById(`${type}-text`);
                if (textElement) {
                    textElement.textContent = bedCounts[type];
                }

                const plusButton = document.getElementById(`${type}-plus-button`);
                const minusButton = document.getElementById(`${type}-minus-button`);

                // Set SVG buttons
                if (plusButton) plusButton.innerHTML = svgPlus;
                if (minusButton) {
                    // Set minus button to null state if count is 0
                    minusButton.innerHTML = bedCounts[type] === 0 ? svgMinusNull : svgMinus;
                }
            });

            // Setup plus/minus buttons
            bedTypes.forEach(type => {
                const plusButton = document.getElementById(`${type}-plus-button`);
                const minusButton = document.getElementById(`${type}-minus-button`);
                const textElement = document.getElementById(`${type}-text`);

                if (plusButton && minusButton && textElement) {
                    plusButton.onclick = () => {
                        bedCounts[type]++;
                        textElement.textContent = bedCounts[type];
                        minusButton.innerHTML = svgMinus; // Enable minus button
                        bedroomBeds[bedroomNumber] = { ...bedCounts };
                    };

                    minusButton.onclick = () => {
                        if (bedCounts[type] > 0) {
                            bedCounts[type]--;
                            textElement.textContent = bedCounts[type];
                            if (bedCounts[type] === 0) {
                                minusButton.innerHTML = svgMinusNull; // Disable minus button
                            }
                            bedroomBeds[bedroomNumber] = { ...bedCounts };
                        }
                    };
                }
            });
        }

        // Initialize bedroom photos modal
        function initializeBedroomPhotosModal(bedroomNumber) {
            const modalContainer = document.querySelector('[data-element="bedroomPhotos_Container"]');
            if (!modalContainer) return;

            const photoContainer = modalContainer.querySelector('[data-element="bedroomPhotos_photoContainer"]');
            if (!photoContainer) return;

            // Update modal header text
            const modalHeaderText = modalContainer.querySelector('[data-element="bedroomPhotos_header"]');
            if (modalHeaderText) {
                modalHeaderText.textContent = `Bedroom ${bedroomNumber}`;
            }

            // Clear existing photo containers
            modalContainer.querySelectorAll('[data-element="bedroomPhotos_photoContainer"]').forEach(container => {
                if (container !== photoContainer) {
                    container.remove();
                }
            });

            // Create containers for all available photos
            localPhotos.forEach((photo, index) => {
                const newPhotoContainer = index === 0 ? photoContainer : photoContainer.cloneNode(true);

                const img = newPhotoContainer.querySelector('[data-element="bedroomPhotos_image"]');
                const numberElement = newPhotoContainer.querySelector('[data-element="bedroomPhotos_number"]');

                if (img) {
                    img.src = photo.url;
                    img.style.display = 'block'; // Make sure image is visible
                }

                // Initially hide number element
                if (numberElement) {
                    numberElement.style.display = 'none';
                }

                // Check if this photo is already assigned to this bedroom
                if (photo.isBedroomPhoto && photo.bedroomOrder === bedroomNumber) {
                    newPhotoContainer.style.outline = '2px solid black';
                    newPhotoContainer.style.outlineOffset = '-1px';
                    if (numberElement) {
                        numberElement.style.display = 'flex';
                        numberElement.textContent = '1';
                        numberElement.style.backgroundColor = '#90EE90';
                    }
                }

                newPhotoContainer.addEventListener('click', () => {
                    // Store selection temporarily
                    if (!tempBedroomSelections[bedroomNumber]) {
                        tempBedroomSelections[bedroomNumber] = {};
                    }

                    // Clear all selections in modal
                    modalContainer.querySelectorAll('[data-element="bedroomPhotos_photoContainer"]')
                        .forEach(container => {
                            container.style.outline = 'none';
                            const num = container.querySelector('[data-element="bedroomPhotos_number"]');
                            if (num) num.style.display = 'none';
                        });

                    // Set new selection visually
                    newPhotoContainer.style.outline = '2px solid black';
                    newPhotoContainer.style.outlineOffset = '-1px';
                    if (numberElement) {
                        numberElement.style.display = 'flex';
                        numberElement.textContent = '1';
                        numberElement.style.backgroundColor = '#90EE90';
                    }

                    // Store temporary selection
                    tempBedroomSelections[bedroomNumber] = {
                        photoId: photo.id,
                        isBedroomPhoto: true,
                        bedroomOrder: bedroomNumber
                    };
                });

                if (index > 0) {
                    modalContainer.appendChild(newPhotoContainer);
                }
            });
        }

        // Initialize dock photos section
        function initializeDockPhotos() {
            // Check if property has private dock
            const dockSectionContainer = document.querySelector('[data-element="dockPhotos_sectionContainer"]');
            if (!dockSectionContainer) return;

            // Show/hide dock section based on private_dock value
            if (!data.private_dock) {
                dockSectionContainer.style.display = 'none';
                return;
            }
            dockSectionContainer.style.display = 'flex';

            const dockContainer = document.querySelector('[data-element="dockPhotos_container"]');
            if (!dockContainer) return;

            // Find assigned dock photos
            let assignedPhotos = localPhotos.filter(photo => photo.isDockPhoto)
                .sort((a, b) => a.dockPhotoOrder - b.dockPhotoOrder);

            // If there's only 1 photo and its order is 2, change it to 1
            if (assignedPhotos.length === 1 && assignedPhotos[0].dockPhotoOrder === 2) {
                assignedPhotos[0].dockPhotoOrder = 1;
                // Update the photo in localPhotos as well
                const photoIndex = localPhotos.findIndex(p => p.id === assignedPhotos[0].id);
                if (photoIndex !== -1) {
                    localPhotos[photoIndex].dockPhotoOrder = 1;
                }
            }

            const addImageElement = dockContainer.querySelector('[data-element="dockPhotos_addImage"]');
            const imageElement = dockContainer.querySelector('[data-element="dockPhotos_image"]');

            // Hide imageElement by default
            if (imageElement) imageElement.style.display = 'none';

            if (assignedPhotos.length > 0) {
                // Hide add image button
                if (addImageElement) addImageElement.style.display = 'none';

                // Remove any existing image elements
                const existingImages = dockContainer.querySelectorAll('[data-element="dockPhotos_image"]');
                existingImages.forEach(img => img.remove());

                // Create and append image elements for each assigned photo
                assignedPhotos.forEach((photo, index) => {
                    const newImageElement = imageElement.cloneNode(true);
                    newImageElement.style.display = 'flex';
                    newImageElement.src = photo.url;
                    dockContainer.appendChild(newImageElement);
                });
            } else {
                // Show add image button if no photos assigned
                if (addImageElement) addImageElement.style.display = 'flex';
            }

            // Add click handler for dock container
            dockContainer.addEventListener('click', () => {
                if (dockPhotosModal) {
                    dockPhotosModal.style.display = 'flex';
                    initializeDockPhotosModal();

                    // Hide error and show subtext initially
                    if (dockPhotosError) dockPhotosError.style.display = 'none';
                    if (dockPhotosSubText) dockPhotosSubText.style.display = 'block';
                }
            });
        }

        if (dockSaveButton) {
            dockSaveButton.addEventListener('click', async () => {
                try {
                    // Check if exactly 2 photos are selected
                    const selectedPhotos = Object.values(tempDockSelections)
                        .sort((a, b) => a.dockPhotoOrder - b.dockPhotoOrder);

                    if (selectedPhotos.length !== 2) {
                        if (dockPhotosError) {
                            dockPhotosError.textContent = "Please select exactly two photos for the dock section.";
                            dockPhotosError.style.display = 'block';
                            if (dockPhotosSubText) dockPhotosSubText.style.display = 'none';
                        }
                        return;
                    }

                    const requestData = {
                        property_id: data.id,
                        user_id: data.host_user_id,
                        photos: selectedPhotos.map(selection => ({
                            photo_id: selection.photoId,
                            dock_photo_order: selection.dockPhotoOrder
                        }))
                    };

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_photos_dock', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Update localPhotos with the new selections
                    localPhotos.forEach(photo => {
                        photo.isDockPhoto = false;
                        photo.dockPhotoOrder = null;

                        const selection = tempDockSelections[photo.id];
                        if (selection) {
                            photo.isDockPhoto = true;
                            photo.dockPhotoOrder = selection.dockPhotoOrder;
                        }
                    });

                    // Clear temporary selections after successful save
                    tempDockSelections = {};

                    dockPhotosModal.style.display = 'none';
                    if (dockPhotosError) dockPhotosError.style.display = 'none';
                    if (dockPhotosSubText) dockPhotosSubText.style.display = 'block';

                    initializeDockPhotos();

                    checkMissingBedroomAndDockData();

                } catch (error) {
                    console.error('Error saving dock photos:', error);
                    if (dockPhotosError) {
                        dockPhotosError.textContent = "Unable to save dock photos. Please reload page and try again.";
                        dockPhotosError.style.display = 'block';
                        if (dockPhotosSubText) dockPhotosSubText.style.display = 'none';
                    }
                }
            });
        }

        // Handle modal open/close
        if (addRemovePhotosButton && addRemovePhotosModal) {
            addRemovePhotosButton.addEventListener('click', () => {
                addRemovePhotosModal.style.display = 'flex';
            });

            addRemovePhotosModal.addEventListener('click', (e) => {
                if (e.target === addRemovePhotosModal) {
                    addRemovePhotosModal.style.display = 'none';
                    // Revert any changes made in the modal
                    localPhotos = data._pictures.map(pic => ({
                        id: pic.id,
                        url: pic.property_image.url,
                        image: pic.property_image.url,
                        isCoverPhoto: pic.inHeaderPreview,
                        coverPhotoOrder: pic.inPreviewOrder,
                        isDockPhoto: pic.in_dock_section,
                        isBedroomPhoto: pic.inBedroomSection,
                        bedroomOrder: pic.bedroomOrder,
                        description: pic.property_image_description_subheader
                    }));
                    renderPhotos();
                    initializeBedroomPhotos();
                    initializeDockPhotos();
                }
            });
        }

        if (bedroomPhotosModal) {
            bedroomPhotosModal.addEventListener('click', (e) => {
                if (e.target === bedroomPhotosModal) {
                    bedroomPhotosModal.style.display = 'none';
                    // Clear temporary selections
                    tempBedroomSelections = {};
                    // Revert to initial state
                    initializeBedroomBedCounters(currentBedroomNumber, true);
                }
            });
        }

        if (dockPhotosModal) {
            dockPhotosModal.addEventListener('click', (e) => {
                if (e.target === dockPhotosModal) {
                    dockPhotosModal.style.display = 'none';
                    // Clear temporary selections
                    tempDockSelections = {};
                }
            });
        }

        if (bedroomCancelButton) {
            bedroomCancelButton.addEventListener('click', () => {
                bedroomPhotosModal.style.display = 'none';
                // Clear temporary selections
                tempBedroomSelections = {};
                // Revert to initial state
                initializeBedroomBedCounters(currentBedroomNumber, true);
            });
        }

        if (dockCancelButton) {
            dockCancelButton.addEventListener('click', () => {
                dockPhotosModal.style.display = 'none';
                // Clear temporary selections
                tempDockSelections = {};
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                addRemovePhotosModal.style.display = 'none';
                // Revert any changes made in the modal
                localPhotos = data._pictures.map(pic => ({
                    id: pic.id,
                    url: pic.property_image.url,
                    image: pic.property_image.url,
                    isCoverPhoto: pic.inHeaderPreview,
                    coverPhotoOrder: pic.inPreviewOrder,
                    isDockPhoto: pic.in_dock_section,
                    isBedroomPhoto: pic.inBedroomSection,
                    bedroomOrder: pic.bedroomOrder,
                    description: pic.property_image_description_subheader
                }));
                renderPhotos();
                initializeBedroomPhotos();
                initializeDockPhotos();
            });
        }

        if (bedroomSaveButton) {
            bedroomSaveButton.addEventListener('click', async () => {
                try {
                    // Check if a photo is selected and beds are configured
                    const tempSelection = tempBedroomSelections[currentBedroomNumber];
                    const selectedPhoto = tempSelection ? localPhotos.find(p => p.id === tempSelection.photoId) : null;
                    const hasBeds = Object.values(bedroomBeds[currentBedroomNumber] || {})
                        .some(count => count > 0);

                    if (!selectedPhoto || !hasBeds) {
                        if (bedroomPhotosError) {
                            bedroomPhotosError.textContent = "Please select a photo and add at least one bed.";
                            bedroomPhotosError.style.display = 'block';
                            if (bedroomPhotosSubText) bedroomPhotosSubText.style.display = 'none';
                        }
                        return;
                    }

                    // Format bed configuration string
                    const bedConfig = bedroomBeds[currentBedroomNumber];
                    const bedDescriptions = [];

                    if (bedConfig.king > 0) {
                        bedDescriptions.push(`${bedConfig.king} King ${bedConfig.king === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.queen > 0) {
                        bedDescriptions.push(`${bedConfig.queen} Queen ${bedConfig.queen === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.double > 0) {
                        bedDescriptions.push(`${bedConfig.double} Double ${bedConfig.double === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.twin > 0) {
                        bedDescriptions.push(`${bedConfig.twin} Twin ${bedConfig.twin === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.single > 0) {
                        bedDescriptions.push(`${bedConfig.single} Single ${bedConfig.single === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.bunkBed > 0) {
                        bedDescriptions.push(`${bedConfig.bunkBed} Bunk ${bedConfig.bunkBed === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.sofaBed > 0) {
                        bedDescriptions.push(`${bedConfig.sofaBed} Sofa ${bedConfig.sofaBed === 1 ? 'bed' : 'beds'}`);
                    }
                    if (bedConfig.crib > 0) {
                        bedDescriptions.push(`${bedConfig.crib} Crib${bedConfig.crib === 1 ? '' : 's'}`);
                    }

                    const bedConfigString = bedDescriptions.join(' & ');

                    const requestData = {
                        property_id: data.id,
                        user_id: data.host_user_id,
                        bedroom_number: `Bedroom ${currentBedroomNumber}`,
                        bed_configuration: bedConfigString,
                        photo_id: selectedPhoto.id,
                        bedroom_order: currentBedroomNumber
                    };

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_photos_bedroom', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Update localPhotos with the new selection
                    localPhotos.forEach(photo => {
                        if (photo.bedroomOrder === currentBedroomNumber) {
                            photo.isBedroomPhoto = false;
                            photo.bedroomOrder = null;
                        }
                        if (photo.id === selectedPhoto.id) {
                            photo.isBedroomPhoto = true;
                            photo.bedroomOrder = currentBedroomNumber;
                            photo.description = bedConfigString;
                        }
                    });

                    // Update initial state after successful save
                    initialBedroomBeds[currentBedroomNumber] = { ...bedroomBeds[currentBedroomNumber] };

                    // Clear temporary selections after successful save
                    tempBedroomSelections = {};

                    bedroomPhotosModal.style.display = 'none';
                    if (bedroomPhotosError) bedroomPhotosError.style.display = 'none';
                    if (bedroomPhotosSubText) bedroomPhotosSubText.style.display = 'block';

                    initializeBedroomPhotos();

                    // Check bedroom photos and beds after successful save
                    checkMissingBedroomAndDockData();



                } catch (error) {
                    console.error('Error saving bedroom configuration:', error);
                    if (bedroomPhotosError) {
                        bedroomPhotosError.textContent = "Unable to save bedroom configuration. Please reload page and try again.";
                        bedroomPhotosError.style.display = 'block';
                        if (bedroomPhotosSubText) bedroomPhotosSubText.style.display = 'none';
                    }
                }
            });
        }



        if (saveButton) {
            // Get text and loader elements
            const saveButtonText = document.getElementById('editListing_saveButton_addPhotos_text');
            const saveButtonLoader = document.getElementById('editListing_saveButton_addPhotos_loader');

            // Initially hide loader
            if (saveButtonLoader) {
                saveButtonLoader.style.display = 'none';
            }

            saveButton.addEventListener('click', async () => {
                const addRemovePhotosError = document.getElementById('addRemovePhotos-error');
                const addRemovePhotosSubText = document.getElementById('addRemovePhotos-subText');

                // Validate minimum 5 photos
                if (localPhotos.length < 5) {
                    if (addRemovePhotosError) {
                        addRemovePhotosError.textContent = "Please add at least 5 photos before saving";
                        addRemovePhotosError.style.display = 'block';
                    }
                    if (addRemovePhotosSubText) {
                        addRemovePhotosSubText.style.display = 'none';
                    }
                    return;
                }

                try {
                    // Show loader and hide text while requesting
                    if (saveButtonLoader && saveButtonText) {
                        saveButtonLoader.style.display = 'block';
                        saveButtonText.style.display = 'none';
                    }

                    // Separate existing and new photos
                    const existingPhotos = localPhotos.filter(photo => photo.coverPhotoOrder);
                    const newPhotos = localPhotos.filter(photo => !photo.coverPhotoOrder);

                    // Sort existing photos by current order
                    existingPhotos.sort((a, b) => a.coverPhotoOrder - b.coverPhotoOrder);

                    // Combine arrays with new photos at the end
                    const orderedPhotos = [...existingPhotos, ...newPhotos];

                    // Reassign consecutive order numbers starting from 1
                    orderedPhotos.forEach((photo, index) => {
                        photo.coverPhotoOrder = index + 1;
                        photo.isCoverPhoto = index < 5;
                    });

                    // Update localPhotos with new ordering
                    localPhotos = orderedPhotos;

                    const requestData = {
                        property_id: data.id,
                        host_id: data.host_user_id,
                        addedPhotos: localPhotos.map(photo => ({
                            image: photo.id ? photo.url : photo.image,
                            isCoverPhoto: photo.isCoverPhoto,
                            coverPhotoOrder: photo.coverPhotoOrder,
                            isDockPhoto: photo.isDockPhoto,
                            dockPhotoOrder: photo.dockPhotoOrder,
                            isBedroomPhoto: photo.isBedroomPhoto,
                            bedroomOrder: photo.bedroomOrder,
                            description: photo.description,
                            description_header: photo.bedroomOrder ? `Bedroom ${photo.bedroomOrder}` : null
                        }))
                    };

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_photos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to save photos');
                    }

                    // Update photos count
                    savedPhotosCount = localPhotos.length;
                    if (editPhotosText) {
                        editPhotosText.textContent = `${savedPhotosCount} photos`;
                    }

                    // Hide modals
                    addRemovePhotosModal.style.display = 'none';
                    bedroomPhotosModal.style.display = 'none';
                    dockPhotosModal.style.display = 'none';
                    arrangePhotosModal.style.display = 'none';

                    // Hide error and show subtext
                    if (addRemovePhotosError) {
                        addRemovePhotosError.style.display = 'none';
                    }
                    if (addRemovePhotosSubText) {
                        addRemovePhotosSubText.style.display = 'block';
                    }

                    // Re-render all photo-related sections to ensure consistency
                    renderPhotos(); // Main photos display
                    initializeDockPhotos(); // Update dock photos section

                    // Update bedroom photos - remove any references to deleted photos
                    localPhotos.forEach(photo => {
                        if (photo.isBedroomPhoto && !localPhotos.some(p => p.id === photo.id)) {
                            photo.isBedroomPhoto = false;
                            photo.bedroomOrder = null;
                        }
                    });

                    // Update dock photos - remove any references to deleted photos
                    localPhotos.forEach(photo => {
                        if (photo.isDockPhoto && !localPhotos.some(p => p.id === photo.id)) {
                            photo.isDockPhoto = false;
                            photo.dockPhotoOrder = null;
                        }
                    });

                    // Reload the page after everything else is done
                    window.location.reload();

                } catch (error) {
                    console.error('Error saving photos:', error);
                    // Show error and hide subtext
                    if (addRemovePhotosError) {
                        addRemovePhotosError.textContent = "Request could not be processed. Please try again later.";
                        addRemovePhotosError.style.display = 'block';
                    }
                    if (addRemovePhotosSubText) {
                        addRemovePhotosSubText.style.display = 'none';
                    }
                } finally {
                    // Show text and hide loader after request completes
                    if (saveButtonLoader && saveButtonText) {
                        saveButtonLoader.style.display = 'none';
                        saveButtonText.style.display = 'block';
                    }
                }
            });
        }

        // Function to render all photos
        function renderPhotos() {
            const addRemovePhotosError = document.getElementById('addRemovePhotos-error');
            const addRemovePhotosSubText = document.getElementById('addRemovePhotos-subText');

            if (localPhotos.length > 0) {
                if (photoContainerParent) {
                    photoContainerParent.style.display = 'grid';
                    // Clear existing photos first
                    const existingPhotos = document.querySelectorAll('[data-element="photo_container_parent"]');
                    existingPhotos.forEach((container, index) => {
                        if (index > 0) container.remove();
                    });

                    // Update first photo container
                    const firstPhotoContainer = photoContainerParent.querySelector('[data-element="photo_container"]');
                    if (firstPhotoContainer) {
                        firstPhotoContainer.src = localPhotos[0].url;
                        setupPhotoDeleteButton(photoContainerParent, 0);
                    }

                    // Add remaining photos
                    for (let i = 1; i < localPhotos.length; i++) {
                        const newParent = photoContainerParent.cloneNode(true);
                        const newImg = newParent.querySelector('[data-element="photo_container"]');
                        if (newImg) {
                            newImg.src = localPhotos[i].url;
                            setupPhotoDeleteButton(newParent, i);
                        }
                        photoContainerParent.parentNode.appendChild(newParent);
                    }

                    // Show error if less than 5 photos
                    if (localPhotos.length < 5) {
                        if (addRemovePhotosError) {
                            addRemovePhotosError.style.display = 'block';
                            addRemovePhotosError.textContent = "Please add at least 5 photos";
                        }
                        if (addRemovePhotosSubText) {
                            addRemovePhotosSubText.style.display = 'none';
                        }
                    } else {
                        if (addRemovePhotosError) {
                            addRemovePhotosError.style.display = 'none';
                        }
                        if (addRemovePhotosSubText) {
                            addRemovePhotosSubText.style.display = 'block';
                        }
                    }
                }
            } else {
                if (photoContainerParent) photoContainerParent.style.display = 'none';
                if (photoContainer) photoContainer.src = '';

                // Show error for no photos
                if (addRemovePhotosError) {
                    addRemovePhotosError.style.display = 'block';
                    addRemovePhotosError.textContent = "Please add at least 5 photos";
                }
                if (addRemovePhotosSubText) {
                    addRemovePhotosSubText.style.display = 'none';
                }
            }

            // Always show add photos button
            if (addPhotosButton2) addPhotosButton2.style.display = 'flex';
        }

        // Initial render
        renderPhotos();
        initializeBedroomPhotos();
        initializeDockPhotos();
        initializeArrangePhotos();
        checkMissingBedroomAndDockData();

        // Setup photo upload buttons
        const setupPhotoButton = (button) => {
            if (button) {
                button.addEventListener('click', () => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.multiple = true;
                    fileInput.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
                    fileInput.addEventListener('change', handlePhotoSelection);
                    fileInput.click();
                });
            }
        };

        // Setup the add photos button
        if (addPhotosButton2) {
            setupPhotoButton(addPhotosButton2);
        }

        // Function to handle photo selection
        function handlePhotoSelection(event) {
            const files = event.target.files;
            if (!files.length) return;

            Array.from(files).forEach(file => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) return;

                const reader = new FileReader();
                reader.onload = function (e) {
                    const newPhoto = {
                        url: URL.createObjectURL(file),
                        image: e.target.result,
                        isCoverPhoto: false,
                        coverPhotoOrder: null,
                        isDockPhoto: false,
                        isBedroomPhoto: false,
                        bedroomOrder: null,
                        description: null
                    };
                    localPhotos.push(newPhoto);
                    renderPhotos();
                };
                reader.readAsDataURL(file);
            });

            event.target.value = '';
        }

        // Function to setup delete button for a photo
        function setupPhotoDeleteButton(containerParent, photoIndex) {
            const deleteButton = containerParent.querySelector('[data-element="deletePhotoAdded"]');
            if (!deleteButton) return;

            deleteButton.style.cursor = 'pointer';
            const newDeleteButton = deleteButton.cloneNode(true);
            deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

            newDeleteButton.onclick = (e) => {
                e.stopPropagation();
                const deletedPhoto = localPhotos[photoIndex];

                // Clear any bedroom or dock assignments
                if (deletedPhoto.isBedroomPhoto) {
                    delete tempBedroomSelections[deletedPhoto.id];
                }
                if (deletedPhoto.isDockPhoto) {
                    delete tempDockSelections[deletedPhoto.id];
                }

                localPhotos.splice(photoIndex, 1);
                renderPhotos();
                initializeBedroomPhotos();
                initializeDockPhotos();
                initializeArrangePhotos();
                checkMissingBedroomAndDockData();
            };
        }
    }

    // Initialize basics section functionality
    function initializeBasicsSection(data) {
        // Update basics section text elements
        document.getElementById('beds-text').textContent = data.num_beds;
        document.getElementById('bedrooms-text').textContent = data.num_bedrooms;
        document.getElementById('baths-text').textContent = data.num_bathrooms;
        document.getElementById('guests-text').textContent = data.num_guests;

        // Hide error message initially
        const errorElement = document.getElementById('basics-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Update summary text
        const basicsText = document.querySelector('[data-element="edit_basics_text"]');
        if (basicsText) {
            basicsText.textContent = `${data.num_guests} Guests, ${data.num_bedrooms} Bedrooms, ${data.num_beds} Beds, ${data.num_bathrooms} Baths`;
        }

        let counters = {
            guests: data.num_guests || 0,
            bedrooms: data.num_bedrooms || 0,
            baths: data.num_bathrooms || 0,
            beds: data.num_beds || 0
        };

        // Store initial values for cancel functionality
        const initialCounters = { ...counters };

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

        // Initially hide all plus and minus buttons
        Object.values(plusButtons).forEach(button => {
            if (button) button.style.display = 'none';
        });
        Object.values(minusButtons).forEach(button => {
            if (button) button.style.display = 'none';
        });

        // Make text fields read-only initially
        Object.values(textFields).forEach(field => {
            if (field) field.readOnly = true;
        });

        // Show buttons and enable editing when edit button is clicked
        const editButton = document.getElementById('editListing_editButton_basics');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_basics');
        const cancelButton = document.getElementById('editListing_cancelButton_basics');
        const saveButton = document.getElementById('editListing_saveButton_basics');
        const basicsContainer = document.getElementById('basicsEditListingContainer');

        if (editButton) {
            editButton.addEventListener('click', () => {
                // Hide edit button and show cancel/save buttons
                editButton.style.display = 'none';
                if (cancelSaveContainer) {
                    cancelSaveContainer.style.display = 'flex';
                }

                // Change background and border of basics container
                if (basicsContainer) {
                    basicsContainer.style.backgroundColor = 'white';
                    basicsContainer.style.border = '1px solid #e2e2e2';
                }

                // Show plus/minus buttons and enable text fields
                Object.values(plusButtons).forEach(button => {
                    if (button) button.style.display = 'block';
                });
                Object.values(minusButtons).forEach(button => {
                    if (button) button.style.display = 'block';
                });
                Object.values(textFields).forEach(field => {
                    if (field) field.readOnly = false;
                });
            });
        }

        // Handle cancel button click
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Hide error message if visible
                if (errorElement) {
                    errorElement.style.display = 'none';
                }

                // Restore initial values
                counters = { ...initialCounters };
                Object.keys(counters).forEach(type => {
                    updateCounterDisplay(type);
                });

                // Hide plus/minus buttons and disable text fields
                Object.values(plusButtons).forEach(button => {
                    if (button) button.style.display = 'none';
                });
                Object.values(minusButtons).forEach(button => {
                    if (button) button.style.display = 'none';
                });
                Object.values(textFields).forEach(field => {
                    if (field) field.readOnly = true;
                });

                // Show edit button and hide cancel/save buttons
                editButton.style.display = 'flex';
                cancelSaveContainer.style.display = 'none';

                // Reset basics container background and border
                basicsContainer.style.backgroundColor = '';
                basicsContainer.style.border = '';
            });
        }

        // Function to validate basics values
        function validateBasics() {
            if (counters.guests === 0 || counters.beds === 0 || counters.baths === 0) {
                if (errorElement) {
                    errorElement.textContent = 'Guests, beds, and baths must have at least 1 each';
                    errorElement.style.display = 'block';
                }
                return false;
            }
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            return true;
        }

        // Handle save button click
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                if (!validateBasics()) {
                    return; // Don't proceed if validation fails
                }

                // Wait for user ID to be available
                window.Wized = window.Wized || [];
                await window.Wized.requests.waitFor('Load_user');
                const userId = window.Wized.data.r.Load_user.data.id;

                // Prepare data for backend
                const updatedData = {
                    property_id: propertyId,
                    user_id: userId,
                    num_guests: parseInt(counters.guests),
                    num_bedrooms: parseInt(counters.bedrooms),
                    num_beds: parseInt(counters.beds),
                    num_bathrooms: parseFloat(counters.baths) // Changed to parseFloat for decimal values
                };

                try {
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_basics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const data = await response.json();

                    // Only update UI if request was successful
                    // Update initial counters with new values
                    Object.assign(initialCounters, counters);

                    // Update summary text
                    if (basicsText) {
                        basicsText.textContent = `${counters.guests} Guests, ${counters.bedrooms} Bedrooms, ${counters.beds} Beds, ${counters.baths} Baths`;
                    }

                    // Reset UI state
                    editButton.style.display = 'flex';
                    cancelSaveContainer.style.display = 'none';
                    basicsContainer.style.backgroundColor = '';
                    basicsContainer.style.border = '';

                    // Hide plus/minus buttons and disable text fields
                    Object.values(plusButtons).forEach(button => {
                        if (button) button.style.display = 'none';
                    });
                    Object.values(minusButtons).forEach(button => {
                        if (button) button.style.display = 'none';
                    });
                    Object.values(textFields).forEach(field => {
                        if (field) field.readOnly = true;
                    });

                    // Hide any existing error messages
                    if (errorElement) {
                        errorElement.style.display = 'none';
                    }

                } catch (error) {
                    console.error('Error updating basics:', error);
                    // Show error message
                    if (errorElement) {
                        errorElement.textContent = 'Unable to save changes. Please try again later.';
                        errorElement.style.display = 'block';
                    }
                    // Restore previous values since save failed
                    counters = { ...initialCounters };
                    Object.keys(counters).forEach(type => {
                        updateCounterDisplay(type);
                    });
                }
            });
        }

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
            if (type === 'baths') {
                counters[type] += 0.5;
            } else {
                counters[type]++;
            }
            updateCounterDisplay(type);
            updateAllButtonStates();
            validateBasics();
        }

        function handleDecrement(type) {
            if (counters[type] > 0) {
                if (type === 'baths') {
                    counters[type] -= 0.5;
                } else {
                    counters[type]--;
                }
                updateCounterDisplay(type);
                updateAllButtonStates();
                validateBasics();
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

    // Function to initialize title section
    function initializeTitleSection(data) {
        const titleInput = document.querySelector('[data-element="title_input"]');
        const titleText = document.querySelector('[data-element="edit_title_text"]');
        const characterCount = document.getElementById('titleInputField_characterCount');
        const titleError = document.getElementById('title-error');
        const titleSubText = document.getElementById('title-subText');
        const editButton = document.getElementById('editListing_editButton_title');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_title');
        const cancelButton = document.getElementById('editListing_cancelButton_title');
        const saveButton = document.getElementById('editListing_saveButton_title');
        const maxChars = 35;

        // Always show subtext if error is not visible
        if (titleError && titleSubText) {
            titleError.style.display = 'none';
            titleSubText.style.display = 'block';
        }

        // Validation function
        function validateTitle() {
            const text = titleInput.innerText.trim();

            if (text.length === 0) {
                if (titleError) {
                    titleError.textContent = 'Please enter a title for your listing';
                    titleError.style.display = 'block';
                    if (titleSubText) titleSubText.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (text.length > maxChars) {
                if (titleError) {
                    titleError.textContent = `Title cannot exceed ${maxChars} characters`;
                    titleError.style.display = 'block';
                    if (titleSubText) titleSubText.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (titleError) titleError.style.display = 'none';
            if (titleSubText) titleSubText.style.display = 'block';
            if (saveButton) saveButton.disabled = false;
            return true;
        }

        if (titleInput) {
            // Initially set contentEditable to false
            titleInput.contentEditable = false;

            // Set styles to ensure text wraps and aligns correctly
            titleInput.style.whiteSpace = 'pre-wrap';
            titleInput.style.textAlign = 'left';
            titleInput.style.height = '250px';
            titleInput.style.overflowY = 'auto';
            titleInput.style.boxSizing = 'border-box';
            titleInput.style.padding = '10px';
            titleInput.style.outline = 'none';
            titleInput.style.caretColor = 'auto';
            titleInput.style.backgroundColor = '';
            titleInput.style.border = '';

            // Initialize with existing title if any
            const existingText = data.property_name || '';
            if (characterCount) {
                characterCount.textContent = `${existingText.length}/${maxChars}`;
            }

            // Set existing text in both input and display elements
            if (existingText) {
                titleInput.innerText = existingText;
                if (titleText) {
                    titleText.textContent = existingText;
                }
            }

            let originalText = existingText;

            if (editButton) {
                editButton.addEventListener('click', () => {
                    titleInput.contentEditable = true;
                    editButton.style.display = 'none';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'flex';
                    }
                    titleInput.style.backgroundColor = 'white';
                    titleInput.style.border = '1px solid #e2e2e2';
                    titleInput.focus();

                    // Ensure border stays #e2e2e2 when typing
                    titleInput.addEventListener('input', () => {
                        titleInput.style.border = '1px solid #e2e2e2';
                    });

                    // Place cursor at end
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(titleInput);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            }

            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    titleInput.contentEditable = false;
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'none';
                    }
                    titleInput.style.backgroundColor = '';
                    titleInput.style.border = '';
                    titleInput.innerText = originalText;
                    if (characterCount) {
                        characterCount.textContent = `${originalText.length}/${maxChars}`;
                        characterCount.style.color = 'grey';
                    }
                    titleInput.style.color = '';
                    titleInput.style.border = '';

                    // Reset validation state
                    if (titleError) titleError.style.display = 'none';
                    if (titleSubText) titleSubText.style.display = 'block';
                });
            }

            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    // Validate before saving
                    if (!validateTitle()) return;

                    titleInput.contentEditable = false;
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'none';
                    }
                    titleInput.style.backgroundColor = '';
                    titleInput.style.border = '';
                    originalText = titleInput.innerText.trim();

                    // Wait for user ID to be available
                    window.Wized = window.Wized || [];
                    await window.Wized.requests.waitFor('Load_user');
                    const userId = window.Wized.data.r.Load_user.data.id;

                    const updatedData = {
                        property_id: propertyId,
                        user_id: userId,
                        title: originalText
                    };

                    try {
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_title', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updatedData)
                        });

                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }

                        // Update title text element after successful save
                        if (titleText) {
                            titleText.textContent = originalText;
                        }

                    } catch (error) {
                        console.error('Error updating title:', error);
                        if (titleError) {
                            titleError.textContent = 'Unable to save changes. Please try again later.';
                            titleError.style.display = 'block';
                            if (titleSubText) titleSubText.style.display = 'none';
                        }
                        // Revert to edit mode
                        titleInput.contentEditable = true;
                        editButton.style.display = 'none';
                        if (cancelSaveContainer) {
                            cancelSaveContainer.style.display = 'flex';
                        }
                        titleInput.style.backgroundColor = 'white';
                        titleInput.style.border = '1px solid #e2e2e2';
                    }
                });
            }

            // Handle input changes
            titleInput.addEventListener('input', () => {
                const text = titleInput.innerText;
                const currentLength = text.trim().length;

                if (characterCount) {
                    characterCount.textContent = `${currentLength}/${maxChars}`;
                    const isOverLimit = currentLength > maxChars;
                    characterCount.style.color = isOverLimit ? 'red' : 'grey';
                    titleInput.style.color = isOverLimit ? 'red' : '';
                    titleInput.style.border = isOverLimit ? '1px solid red' : '';
                }

                validateTitle();
            });

            // Keep cursor visible when editable
            titleInput.addEventListener('click', () => {
                if (titleInput.contentEditable === 'true') {
                    titleInput.focus();
                }
            });

            titleInput.addEventListener('blur', () => {
                if (titleInput.contentEditable === 'true' && !titleInput.innerText.trim()) {
                    titleInput.focus();
                }
            });
        }
    }

    // Function to initialize description section
    function initializeDescriptionSection(data) {
        const descriptionInput = document.querySelector('[data-element="description_input"]');
        const descriptionText = document.querySelector('[data-element="edit_description_text"]');
        const characterCount = document.getElementById('descriptionInputField_characterCount');
        const descriptionError = document.getElementById('description-error');
        const descriptionSubText = document.getElementById('description-subText');
        const editButton = document.getElementById('editListing_editButton_description');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_description');
        const cancelButton = document.getElementById('editListing_cancelButton_description');
        const saveButton = document.getElementById('editListing_saveButton_description');
        const maxChars = 4000;
        const maxDisplayChars = 300;

        // Always show subtext if error is not visible
        if (descriptionError && descriptionSubText) {
            descriptionError.style.display = 'none';
            descriptionSubText.style.display = 'block';
        }

        // Function to truncate text for display
        function truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;

            // Truncate to max length
            let truncated = text.substring(0, maxLength);

            // Remove trailing space if it exists
            if (truncated.charAt(truncated.length - 1) === ' ') {
                truncated = truncated.substring(0, truncated.length - 1);
            }

            return truncated + '...';
        }

        // Validation function
        function validateDescription() {
            const text = descriptionInput.innerText.trim();

            if (text.length === 0) {
                if (descriptionError) {
                    descriptionError.textContent = 'Please enter a description for your listing';
                    descriptionError.style.display = 'block';
                    if (descriptionSubText) descriptionSubText.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (text.length > maxChars) {
                if (descriptionError) {
                    descriptionError.textContent = `Description cannot exceed ${maxChars} characters`;
                    descriptionError.style.display = 'block';
                    if (descriptionSubText) descriptionSubText.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (descriptionError) descriptionError.style.display = 'none';
            if (descriptionSubText) descriptionSubText.style.display = 'block';
            if (saveButton) saveButton.disabled = false;
            return true;
        }

        if (descriptionInput) {
            // Initially set contentEditable to false
            descriptionInput.contentEditable = false;

            // Set styles to ensure text wraps and aligns correctly
            descriptionInput.style.whiteSpace = 'pre-wrap';
            descriptionInput.style.textAlign = 'left';
            descriptionInput.style.height = '250px';
            descriptionInput.style.overflowY = 'auto';
            descriptionInput.style.boxSizing = 'border-box';
            descriptionInput.style.padding = '10px';
            descriptionInput.style.outline = 'none';
            descriptionInput.style.caretColor = 'auto';
            descriptionInput.style.backgroundColor = '';
            descriptionInput.style.border = '';

            // Initialize with existing description if any
            const existingText = data.listing_description || '';
            if (characterCount) {
                characterCount.textContent = `${existingText.length}/${maxChars}`;
            }

            // Set existing text
            if (existingText) {
                descriptionInput.innerText = existingText;
                if (descriptionText) {
                    descriptionText.textContent = truncateText(existingText, maxDisplayChars);
                }
            }

            let originalText = existingText;

            if (editButton) {
                editButton.addEventListener('click', () => {
                    descriptionInput.contentEditable = true;
                    editButton.style.display = 'none';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'flex';
                    }
                    descriptionInput.style.backgroundColor = 'white';
                    descriptionInput.style.border = '1px solid #e2e2e2';
                    descriptionInput.focus();

                    // Ensure border stays #e2e2e2 when typing
                    descriptionInput.addEventListener('input', () => {
                        descriptionInput.style.border = '1px solid #e2e2e2';
                    });

                    // Place cursor at end
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(descriptionInput);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            }

            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    descriptionInput.contentEditable = false;
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'none';
                    }
                    descriptionInput.style.backgroundColor = '';
                    descriptionInput.style.border = '';
                    descriptionInput.innerText = originalText;
                    if (characterCount) {
                        characterCount.textContent = `${originalText.length}/${maxChars}`;
                        characterCount.style.color = 'grey';
                    }
                    descriptionInput.style.color = '';
                    descriptionInput.style.border = '';

                    // Reset validation state
                    if (descriptionError) descriptionError.style.display = 'none';
                    if (descriptionSubText) descriptionSubText.style.display = 'block';
                });
            }

            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    // Validate before saving
                    if (!validateDescription()) return;

                    descriptionInput.contentEditable = false;
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'none';
                    }
                    descriptionInput.style.backgroundColor = '';
                    descriptionInput.style.border = '';
                    originalText = descriptionInput.innerText.trim();

                    // Wait for user ID to be available
                    window.Wized = window.Wized || [];
                    await window.Wized.requests.waitFor('Load_user');
                    const userId = window.Wized.data.r.Load_user.data.id;

                    const updatedData = {
                        property_id: propertyId,
                        user_id: userId,
                        description: originalText
                    };

                    try {
                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_description', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updatedData)
                        });

                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }

                        // Update description text element after successful save
                        if (descriptionText) {
                            descriptionText.textContent = truncateText(originalText, maxDisplayChars);
                        }

                    } catch (error) {
                        console.error('Error updating description:', error);
                        if (descriptionError) {
                            descriptionError.textContent = 'Unable to save changes. Please try again later.';
                            descriptionError.style.display = 'block';
                            if (descriptionSubText) descriptionSubText.style.display = 'none';
                        }
                        // Revert to edit mode
                        descriptionInput.contentEditable = true;
                        editButton.style.display = 'none';
                        if (cancelSaveContainer) {
                            cancelSaveContainer.style.display = 'flex';
                        }
                        descriptionInput.style.backgroundColor = 'white';
                        descriptionInput.style.border = '1px solid #e2e2e2';
                    }
                });
            }

            // Handle input changes
            descriptionInput.addEventListener('input', () => {
                const text = descriptionInput.innerText;
                const currentLength = text.trim().length;

                if (characterCount) {
                    characterCount.textContent = `${currentLength}/${maxChars}`;
                    const isOverLimit = currentLength > maxChars;
                    characterCount.style.color = isOverLimit ? 'red' : 'grey';
                    descriptionInput.style.color = isOverLimit ? 'red' : '';
                    descriptionInput.style.border = isOverLimit ? '1px solid red' : '';
                }

                validateDescription();
            });

            // Keep cursor visible when editable
            descriptionInput.addEventListener('click', () => {
                if (descriptionInput.contentEditable === 'true') {
                    descriptionInput.focus();
                }
            });

            descriptionInput.addEventListener('blur', () => {
                if (descriptionInput.contentEditable === 'true' && !descriptionInput.innerText.trim()) {
                    descriptionInput.focus();
                }
            });
        }
    }

    // Initialize check-in/out section functionality
    function initializeCheckInOutSection(data) {
        const checkInInput = document.querySelector('[data-element="checkInInput"]');
        const checkInAMButton = document.querySelector('[data-element="checkInAM_button"]');
        const checkInPMButton = document.querySelector('[data-element="checkInPM_button"]');
        const checkOutInput = document.querySelector('[data-element="checkOutInput"]');
        const checkOutAMButton = document.querySelector('[data-element="checkOutAM_button"]');
        const checkOutPMButton = document.querySelector('[data-element="checkOutPM_button"]');
        const checkInMethodButtons = {
            keypad: document.querySelector('[data-element="checkInMethod_keypad"]'),
            lockbox: document.querySelector('[data-element="checkInMethod_lockbox"]'),
            inPerson: document.querySelector('[data-element="checkInMethod_inPerson"]'),
            digitalCard: document.querySelector('[data-element="checkInMethod_digitalCard"]')
        };
        const methodText = document.querySelector('[data-element="edit_checkingInOut_methodText"]');
        const timeText = document.querySelector('[data-element="edit_checkingInOut_timeText"]');

        const editButton = document.getElementById('editListing_editButton_checkInAndOut');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_checkInAndOut');
        const cancelButton = document.getElementById('editListing_cancelButton_checkInAndOut');
        const saveButton = document.getElementById('editListing_saveButton_checkInAndOut');
        const container = document.querySelector('[data-element="checkInAndOut_container"]');
        const errorElement = document.getElementById('CheckInOut-error');
        const subTextElement = document.getElementById('CheckInOut-subText');

        // Hide error initially and show subtext
        if (errorElement) errorElement.style.display = 'none';
        if (subTextElement) subTextElement.style.display = 'block';

        // Store initial state
        let initialState = {
            checkInTime: '',
            checkInPeriod: '',
            checkOutTime: '',
            checkOutPeriod: '',
            checkInMethod: ''
        };

        // Initially disable inputs and buttons
        function disableAllInputs() {
            if (checkInInput) checkInInput.disabled = true;
            if (checkOutInput) checkOutInput.disabled = true;

            // Remove event listeners from AM/PM buttons
            [checkInAMButton, checkInPMButton, checkOutAMButton, checkOutPMButton].forEach(button => {
                if (button) {
                    button.style.pointerEvents = 'none';
                }
            });

            // Remove event listeners from check-in method buttons
            Object.values(checkInMethodButtons).forEach(button => {
                if (button) {
                    button.style.pointerEvents = 'none';
                }
            });
        }

        // Initially disable everything
        disableAllInputs();

        // Enable inputs and buttons
        function enableAllInputs() {
            if (checkInInput) checkInInput.disabled = false;
            if (checkOutInput) checkOutInput.disabled = false;

            // Enable AM/PM buttons
            [checkInAMButton, checkInPMButton, checkOutAMButton, checkOutPMButton].forEach(button => {
                if (button) {
                    button.style.pointerEvents = 'auto';
                }
            });

            // Enable check-in method buttons
            Object.values(checkInMethodButtons).forEach(button => {
                if (button) {
                    button.style.pointerEvents = 'auto';
                }
            });
        }

        // Function to update time text display
        function updateTimeText() {
            if (timeText) {
                const checkInTime = checkInInput.value;
                const checkInPeriod = checkInAMButton.style.border.includes('2px') ? 'am' : 'pm';
                const checkOutTime = checkOutInput.value;
                const checkOutPeriod = checkOutAMButton.style.border.includes('2px') ? 'am' : 'pm';

                return `Check-in: ${checkInTime}:00${checkInPeriod} | Checkout: ${checkOutTime}:00${checkOutPeriod}`;
            }
        }

        // Validation function
        function validateCheckInOut() {
            const checkInTime = parseInt(checkInInput.value);
            const checkOutTime = parseInt(checkOutInput.value);

            // Check for empty or invalid inputs
            if (!checkInInput.value || !checkOutInput.value || isNaN(checkInTime) || isNaN(checkOutTime)) {
                if (errorElement) {
                    errorElement.textContent = 'Please enter both check-in and check-out times';
                    errorElement.style.display = 'block';
                    if (subTextElement) subTextElement.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (checkInTime <= 0 || checkInTime > 12 || checkOutTime <= 0 || checkOutTime > 12) {
                if (errorElement) {
                    errorElement.textContent = 'Please enter valid check-in and check-out times between 1-12';
                    errorElement.style.display = 'block';
                    if (subTextElement) subTextElement.style.display = 'none';
                }
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (errorElement) errorElement.style.display = 'none';
            if (subTextElement) subTextElement.style.display = 'block';
            if (saveButton) saveButton.disabled = false;
            return true;
        }

        // Set up edit button click handler to enable interactions
        if (editButton) {
            editButton.addEventListener('click', () => {
                // Store current state before editing
                initialState = {
                    checkInTime: checkInInput.value,
                    checkInPeriod: checkInAMButton.style.border.includes('2px') ? 'AM' : 'PM',
                    checkOutTime: checkOutInput.value,
                    checkOutPeriod: checkOutAMButton.style.border.includes('2px') ? 'AM' : 'PM',
                    checkInMethod: Object.entries(checkInMethodButtons).find(([_, button]) =>
                        button && button.style.outline.includes('2px'))?.[0] || ''
                };

                editButton.style.display = 'none';
                if (cancelSaveContainer) {
                    cancelSaveContainer.style.display = 'flex';
                }
                if (container) {
                    container.style.backgroundColor = 'white';
                    container.style.border = '1px solid #e2e2e2';
                }

                // Enable all inputs and buttons
                enableAllInputs();

                // Add input event listeners
                if (checkInInput) checkInInput.addEventListener('input', handleTimeInput);
                if (checkOutInput) checkOutInput.addEventListener('input', handleTimeInput);
            });
        }

        // Set up cancel button click handler
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Hide error and show subtext
                if (errorElement) errorElement.style.display = 'none';
                if (subTextElement) subTextElement.style.display = 'block';

                // Restore initial state
                if (checkInInput) {
                    checkInInput.value = initialState.checkInTime;
                }
                if (checkOutInput) {
                    checkOutInput.value = initialState.checkOutTime;
                }

                // Restore AM/PM states
                if (initialState.checkInPeriod === 'AM') {
                    checkInAMButton.style.border = '2px solid black';
                    checkInPMButton.style.border = '1px solid #e2e2e2';
                } else {
                    checkInPMButton.style.border = '2px solid black';
                    checkInAMButton.style.border = '1px solid #e2e2e2';
                }

                if (initialState.checkOutPeriod === 'AM') {
                    checkOutAMButton.style.border = '2px solid black';
                    checkOutPMButton.style.border = '1px solid #e2e2e2';
                } else {
                    checkOutPMButton.style.border = '2px solid black';
                    checkOutAMButton.style.border = '1px solid #e2e2e2';
                }

                // Restore check-in method
                Object.values(checkInMethodButtons).forEach(button => {
                    if (button) {
                        button.style.outline = 'none';
                        button.style.outlineOffset = '0';
                    }
                });
                if (initialState.checkInMethod && checkInMethodButtons[initialState.checkInMethod]) {
                    checkInMethodButtons[initialState.checkInMethod].style.outline = '2px solid black';
                    checkInMethodButtons[initialState.checkInMethod].style.outlineOffset = '-1px';
                }

                // Disable all inputs and buttons
                disableAllInputs();

                editButton.style.display = 'flex';
                cancelSaveContainer.style.display = 'none';
                if (container) {
                    container.style.backgroundColor = '';
                    container.style.border = '';
                }
            });
        }

        // Set up save button click handler
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                // Validate before saving
                if (!validateCheckInOut()) return;

                // Wait for user ID to be available
                window.Wized = window.Wized || [];
                await window.Wized.requests.waitFor('Load_user');
                const userId = window.Wized.data.r.Load_user.data.id;

                // Get check-in time and period
                const checkInTime = checkInInput.value;
                const checkInPeriod = checkInAMButton.style.border.includes('2px') ? 'AM' : 'PM';
                const formattedCheckIn = `${checkInTime} ${checkInPeriod}`;

                // Get check-out time and period
                const checkOutTime = checkOutInput.value;
                const checkOutPeriod = checkOutAMButton.style.border.includes('2px') ? 'AM' : 'PM';
                const formattedCheckOut = `${checkOutTime} ${checkOutPeriod}`;

                // Get selected check-in method
                let checkInMethod;
                if (checkInMethodButtons.keypad.style.outline.includes('2px')) {
                    checkInMethod = 'Self Check-In with Keypad';
                } else if (checkInMethodButtons.lockbox.style.outline.includes('2px')) {
                    checkInMethod = 'Key lockbox';
                } else if (checkInMethodButtons.inPerson.style.outline.includes('2px')) {
                    checkInMethod = 'In-person key handoff';
                } else if (checkInMethodButtons.digitalCard.style.outline.includes('2px')) {
                    checkInMethod = 'Digital key card';
                }

                const updatedData = {
                    property_id: propertyId,
                    user_id: userId,
                    checkIn: formattedCheckIn,
                    checkOut: formattedCheckOut,
                    checkInMethod: checkInMethod
                };

                try {
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_checkInAndOut', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Only update display texts after successful save
                    if (timeText) {
                        timeText.textContent = updateTimeText();
                    }
                    if (methodText) {
                        methodText.textContent = checkInMethod;
                    }

                    // Reset UI state after successful save
                    editButton.style.display = 'flex';
                    cancelSaveContainer.style.display = 'none';
                    if (container) {
                        container.style.backgroundColor = '';
                        container.style.border = '';
                    }

                    // Disable all inputs after saving
                    disableAllInputs();

                } catch (error) {
                    console.error('Error updating check-in/out:', error);
                    if (errorElement) {
                        errorElement.textContent = 'Unable to save changes. Please try again later.';
                        errorElement.style.display = 'block';
                        if (subTextElement) subTextElement.style.display = 'none';
                    }
                    // Keep edit mode active
                    editButton.style.display = 'none';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'flex';
                    }
                    if (container) {
                        container.style.backgroundColor = 'white';
                        container.style.border = '1px solid #e2e2e2';
                    }
                }
            });
        }

        // Helper functions for handling interactions
        function handleTimeInput(e) {
            validateCheckInOut();
        }

        function handlePeriodToggle(type, clickedButton) {
            const isAM = clickedButton.dataset.element.includes('AM');
            const amButton = type === 'checkIn' ? checkInAMButton : checkOutAMButton;
            const pmButton = type === 'checkIn' ? checkInPMButton : checkOutPMButton;

            if (isAM) {
                amButton.style.border = '2px solid black';
                pmButton.style.border = '1px solid #e2e2e2';
            } else {
                pmButton.style.border = '2px solid black';
                amButton.style.border = '1px solid #e2e2e2';
            }
        }

        function handleMethodSelection(e) {
            Object.values(checkInMethodButtons).forEach(button => {
                if (button) {
                    button.style.outline = 'none';
                    button.style.outlineOffset = '0';
                }
            });

            e.target.style.outline = '2px solid black';
            e.target.style.outlineOffset = '-1px';
        }

        // Set up event listeners for AM/PM buttons
        [checkInAMButton, checkInPMButton].forEach(button => {
            if (button) {
                button.addEventListener('click', () => handlePeriodToggle('checkIn', button));
            }
        });

        [checkOutAMButton, checkOutPMButton].forEach(button => {
            if (button) {
                button.addEventListener('click', () => handlePeriodToggle('checkOut', button));
            }
        });

        // Set up event listeners for check-in method buttons
        Object.values(checkInMethodButtons).forEach(button => {
            if (button) {
                button.addEventListener('click', handleMethodSelection);
            }
        });

        // Parse and set initial data
        if (data.check_in_time) {
            const checkInMatch = data.check_in_time.match(/(\d+)\s*(AM|PM)/i);
            if (checkInMatch) {
                const [_, time, period] = checkInMatch;
                if (checkInInput) checkInInput.value = time;
                if (period.toUpperCase() === 'AM') {
                    if (checkInAMButton) {
                        checkInAMButton.style.border = '2px solid black';
                        checkInPMButton.style.border = '1px solid #e2e2e2';
                    }
                } else {
                    if (checkInPMButton) {
                        checkInPMButton.style.border = '2px solid black';
                        checkInAMButton.style.border = '1px solid #e2e2e2';
                    }
                }
            }
        }

        if (data.check_out_time) {
            const checkOutMatch = data.check_out_time.match(/(\d+)\s*(AM|PM)/i);
            if (checkOutMatch) {
                const [_, time, period] = checkOutMatch;
                if (checkOutInput) checkOutInput.value = time;
                if (period.toUpperCase() === 'AM') {
                    if (checkOutAMButton) {
                        checkOutAMButton.style.border = '2px solid black';
                        checkOutPMButton.style.border = '1px solid #e2e2e2';
                    }
                } else {
                    if (checkOutPMButton) {
                        checkOutPMButton.style.border = '2px solid black';
                        checkOutAMButton.style.border = '1px solid #e2e2e2';
                    }
                }
            }
        }

        if (data.check_in_method) {
            const methodMap = {
                'Self Check-In with Keypad': 'keypad',
                'Key lockbox': 'lockbox',
                'In-person key handoff': 'inPerson',
                'Digital key card': 'digitalCard'
            };

            const methodType = methodMap[data.check_in_method];
            if (methodType) {
                const methodButton = checkInMethodButtons[methodType];
                if (methodButton) {
                    methodButton.style.outline = '2px solid black';
                    methodButton.style.outlineOffset = '-1px';
                }
                if (methodText) {
                    methodText.textContent = data.check_in_method;
                }
            }
        }

        // Initialize time text display
        if (timeText) {
            timeText.textContent = updateTimeText();
        }
    }

    // Function to initialize dock section
    function initializeDockSection(data) {
        const dockOptions = {
            yes: document.querySelector('[data-element="dock_yes"]'),
            no: document.querySelector('[data-element="dock_no"]')
        };

        const dockInputContainer = document.querySelector('[data-element="dock_input_container"]');
        const dockButtonsContainer = document.querySelector('[data-element="dock_buttons_container"]');
        const dockError = document.getElementById('dock-error');
        const dockSubText = document.getElementById('dock-subText');
        const dockText = document.querySelector('[data-element="edit_dock_text"]');

        // Update dock text based on data
        if (dockText) {
            dockText.textContent = data.private_dock ? 'Private dock' : 'No private dock';
        }

        // Get dock input fields
        const boatSizeInput = document.querySelector('[data-element="dock_input_boatSize"]');
        const beamInput = document.querySelector('[data-element="dock_input_beam"]');
        const draftInput = document.querySelector('[data-element="dock_input_draft"]');

        // Add input validation for numeric fields
        [boatSizeInput, beamInput, draftInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    // Remove any non-numeric characters
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
            }
        });

        // Get dock button options
        const dockButtonOptions = {
            shorePower: document.querySelector('[data-element="dock_buttons_shorePower"]'),
            freshWater: document.querySelector('[data-element="dock_buttons_freshWater"]'),
            cleaningStation: document.querySelector('[data-element="dock_buttons_cleaningStation"]'),
            dockLight: document.querySelector('[data-element="dock_buttons_dockLight"]'),
            underwaterLight: document.querySelector('[data-element="dock_buttons_underwaterLight"]'),
            iceMaker: document.querySelector('[data-element="dock_buttons_iceMaker"]')
        };

        // Get edit/cancel/save buttons and container
        const editButton = document.getElementById('editListing_editButton_dock');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_dock');
        const cancelButton = document.getElementById('editListing_cancelButton_dock');
        const saveButton = document.getElementById('editListing_saveButton_dock');
        const container = document.querySelector('[data-element="dock_container"]');

        // Hide error initially and show subtext
        if (dockError) dockError.style.display = 'none';
        if (dockSubText) dockSubText.style.display = 'block';

        // Initially hide dock input and buttons containers
        if (dockInputContainer) dockInputContainer.style.display = 'none';
        if (dockButtonsContainer) dockButtonsContainer.style.display = 'none';

        // Store initial state
        let initialState = {
            hasDock: false,
            boatSize: '',
            beam: '',
            draft: '',
            amenities: {
                shorePower: false,
                freshWater: false,
                cleaningStation: false,
                dockLight: false,
                underwaterLight: false
            }
        };

        // Function to validate dock inputs
        function validateDockInputs() {
            const hasDock = dockOptions.yes.style.outline.includes('2px');

            if (hasDock) {
                const emptyInputs = [
                    { input: boatSizeInput, name: 'Boat Size' },
                    { input: beamInput, name: 'Beam' },
                    { input: draftInput, name: 'Draft' }
                ].filter(({ input }) => !input?.value);

                if (emptyInputs.length > 0) {
                    if (dockError) {
                        dockError.textContent = `Please fill in the following fields: ${emptyInputs.map(({ name }) => name).join(', ')}`;
                        dockError.style.display = 'block';
                    }
                    if (dockSubText) dockSubText.style.display = 'none';
                    return false;
                }
            }

            if (dockError) dockError.style.display = 'none';
            if (dockSubText) dockSubText.style.display = 'block';
            return true;
        }

        // Function to disable all inputs
        function disableAllInputs() {
            Object.values(dockOptions).forEach(button => {
                if (button) button.style.pointerEvents = 'none';
            });

            if (boatSizeInput) boatSizeInput.disabled = true;
            if (beamInput) beamInput.disabled = true;
            if (draftInput) draftInput.disabled = true;

            Object.values(dockButtonOptions).forEach(button => {
                if (button) button.style.pointerEvents = 'none';
            });
        }

        // Function to enable all inputs
        function enableAllInputs() {
            Object.values(dockOptions).forEach(button => {
                if (button) button.style.pointerEvents = 'auto';
            });

            if (boatSizeInput) boatSizeInput.disabled = false;
            if (beamInput) beamInput.disabled = false;
            if (draftInput) draftInput.disabled = false;

            Object.values(dockButtonOptions).forEach(button => {
                if (button) button.style.pointerEvents = 'auto';
            });
        }

        // Initially disable everything
        disableAllInputs();

        // Set up edit button click handler
        if (editButton) {
            editButton.addEventListener('click', () => {
                // Store current state
                initialState = {
                    hasDock: dockOptions.yes.style.outline.includes('2px'),
                    boatSize: boatSizeInput ? boatSizeInput.value : '',
                    beam: beamInput ? beamInput.value : '',
                    draft: draftInput ? draftInput.value : '',
                    amenities: {
                        shorePower: dockButtonOptions.shorePower?.classList.contains('selected') || false,
                        freshWater: dockButtonOptions.freshWater?.classList.contains('selected') || false,
                        cleaningStation: dockButtonOptions.cleaningStation?.classList.contains('selected') || false,
                        dockLight: dockButtonOptions.dockLight?.classList.contains('selected') || false,
                        underwaterLight: dockButtonOptions.underwaterLight?.classList.contains('selected') || false,
                        iceMaker: dockButtonOptions.iceMaker?.classList.contains('selected') || false
                    }
                };

                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                if (container) {
                    container.style.backgroundColor = 'white';
                    container.style.border = '1px solid #e2e2e2';
                }

                enableAllInputs();
            });
        }

        // Set up cancel button click handler
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Hide error and show subtext
                if (dockError) dockError.style.display = 'none';
                if (dockSubText) dockSubText.style.display = 'block';

                // Restore initial state
                if (initialState.hasDock) {
                    dockOptions.yes.style.outline = '2px solid #000000';
                    dockOptions.yes.style.outlineOffset = '-1px';
                    dockOptions.no.style.outline = '';
                    dockOptions.no.style.outlineOffset = '';
                    if (dockInputContainer) dockInputContainer.style.display = 'flex';
                    if (dockButtonsContainer) dockButtonsContainer.style.display = 'flex';
                } else {
                    dockOptions.no.style.outline = '2px solid #000000';
                    dockOptions.no.style.outlineOffset = '-1px';
                    dockOptions.yes.style.outline = '';
                    dockOptions.yes.style.outlineOffset = '';
                    if (dockInputContainer) dockInputContainer.style.display = 'none';
                    if (dockButtonsContainer) dockButtonsContainer.style.display = 'none';
                }

                // Restore input values
                if (boatSizeInput) boatSizeInput.value = initialState.boatSize;
                if (beamInput) beamInput.value = initialState.beam;
                if (draftInput) draftInput.value = initialState.draft;

                // Restore amenity buttons
                Object.entries(initialState.amenities).forEach(([key, value]) => {
                    const button = dockButtonOptions[key];
                    if (button) {
                        if (value) {
                            button.classList.add('selected');
                            button.style.outline = '2px solid #000000';
                            button.style.outlineOffset = '-1px';
                        } else {
                            button.classList.remove('selected');
                            button.style.outline = '';
                            button.style.outlineOffset = '';
                        }
                    }
                });

                // Reset UI state
                editButton.style.display = 'flex';
                cancelSaveContainer.style.display = 'none';
                if (container) {
                    container.style.backgroundColor = '';
                    container.style.border = '';
                }

                disableAllInputs();
            });
        }

        // Set up save button click handler
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                // Validate inputs before saving
                if (!validateDockInputs()) {
                    return;
                }

                // Wait for user ID to be available
                window.Wized = window.Wized || [];
                await window.Wized.requests.waitFor('Load_user');
                const userId = window.Wized.data.r.Load_user.data.id;

                const hasDock = dockOptions.yes.style.outline.includes('2px');

                const updatedData = {
                    property_id: propertyId,
                    user_id: userId,
                    private_dock: hasDock,
                    dock_maxBoatLength: hasDock ? `${boatSizeInput.value} ft` : '',
                    dock_maxBeamLength: hasDock ? `${beamInput.value} ft` : '',
                    dock_maxDraftLength: hasDock ? `${draftInput.value} ft` : '',
                    dock_shorePower: hasDock && dockButtonOptions.shorePower?.classList.contains('selected'),
                    dock_freshWater: hasDock && dockButtonOptions.freshWater?.classList.contains('selected'),
                    dock_cleaningStation: hasDock && dockButtonOptions.cleaningStation?.classList.contains('selected'),
                    dock_light: hasDock && dockButtonOptions.dockLight?.classList.contains('selected'),
                    dock_underwaterLight: hasDock && dockButtonOptions.underwaterLight?.classList.contains('selected'),
                    dock_iceMaker: hasDock && dockButtonOptions.iceMaker?.classList.contains('selected')
                };

                try {
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_dock', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Update dock text after successful save
                    if (dockText) {
                        dockText.textContent = hasDock ? 'Private dock' : 'No private dock';
                    }

                    // Update data object with new dock info
                    data.private_dock = hasDock;
                    data.dock_maxBoatLength = updatedData.dock_maxBoatLength;
                    data.dock_maxBeamLength = updatedData.dock_maxBeamLength;
                    data.dock_maxDraftLength = updatedData.dock_maxDraftLength;
                    data.dock_shorePower = updatedData.dock_shorePower;
                    data.dock_freshWater = updatedData.dock_freshWater;
                    data.dock_cleaningStation = updatedData.dock_cleaningStation;
                    data.dock_light = updatedData.dock_light;
                    data.dock_underwaterLight = updatedData.dock_underwaterLight;

                    initializePhotosSection(data);

                    // Reset UI state after successful save
                    editButton.style.display = 'flex';
                    cancelSaveContainer.style.display = 'none';
                    if (container) {
                        container.style.backgroundColor = '';
                        container.style.border = '';
                    }

                    disableAllInputs();

                } catch (error) {
                    console.error('Error updating dock information:', error);
                    if (dockError) {
                        dockError.textContent = 'Unable to save changes. Please try again later.';
                        dockError.style.display = 'block';
                        if (dockSubText) dockSubText.style.display = 'none';
                    }
                }
            });
        }

        // Initialize dock based on data
        const selectedOption = data.private_dock ? 'yes' : 'no';

        // Reset all buttons first
        Object.values(dockOptions).forEach(button => {
            if (button) {
                button.style.outline = '';
                button.style.outlineOffset = '';
            }
        });

        // Select appropriate button and show/hide containers
        if (selectedOption === 'yes') {
            if (dockOptions.yes) {
                dockOptions.yes.style.outline = '2px solid #000000';
                dockOptions.yes.style.outlineOffset = '-1px';
            }
            if (dockInputContainer) dockInputContainer.style.display = 'flex';
            if (dockButtonsContainer) dockButtonsContainer.style.display = 'flex';

            // Set input values
            if (boatSizeInput && data.dock_maxBoatLength) {
                boatSizeInput.value = data.dock_maxBoatLength.replace(' ft', '');
            }
            if (beamInput && data.dock_maxBeamLength) {
                beamInput.value = data.dock_maxBeamLength.replace(' ft', '');
            }
            if (draftInput && data.dock_maxDraftLength) {
                draftInput.value = data.dock_maxDraftLength.replace(' ft', '');
            }

            // Reset all amenity buttons first
            Object.values(dockButtonOptions).forEach(button => {
                if (button) {
                    button.style.outline = '';
                    button.style.outlineOffset = '';
                    button.classList.remove('selected');
                }
            });

            // Set dock amenity buttons
            const amenityMap = {
                shorePower: data.dock_shorePower,
                freshWater: data.dock_freshWater,
                cleaningStation: data.dock_cleaningStation,
                dockLight: data.dock_light,
                underwaterLight: data.dock_underwaterLight,
                iceMaker: data.dock_iceMaker
            };

            Object.entries(amenityMap).forEach(([key, value]) => {
                if (value && dockButtonOptions[key]) {
                    dockButtonOptions[key].style.outline = '2px solid #000000';
                    dockButtonOptions[key].style.outlineOffset = '-1px';
                    dockButtonOptions[key].classList.add('selected');
                }
            });
        } else {
            if (dockOptions.no) {
                dockOptions.no.style.outline = '2px solid #000000';
                dockOptions.no.style.outlineOffset = '-1px';
            }
        }

        // Add click handlers for dock options
        Object.entries(dockOptions).forEach(([option, button]) => {
            if (button) {
                button.addEventListener('click', () => {
                    Object.values(dockOptions).forEach(btn => {
                        if (btn) {
                            btn.style.outline = '';
                            btn.style.outlineOffset = '';
                        }
                    });

                    button.style.outline = '2px solid #000000';
                    button.style.outlineOffset = '-1px';

                    if (option === 'yes') {
                        if (dockInputContainer) dockInputContainer.style.display = 'flex';
                        if (dockButtonsContainer) dockButtonsContainer.style.display = 'flex';
                    } else {
                        if (dockInputContainer) dockInputContainer.style.display = 'none';
                        if (dockButtonsContainer) dockButtonsContainer.style.display = 'none';
                    }
                });
            }
        });

        // Add click handlers for amenity buttons
        Object.values(dockButtonOptions).forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    button.classList.toggle('selected');
                    button.style.outline = button.classList.contains('selected') ? '2px solid #000000' : '';
                    button.style.outlineOffset = button.classList.contains('selected') ? '-1px' : '';
                });
            }
        });
    }

    // Function to initialize amenities section
    function initializeAmenitiesSection(data) {
        // Get edit/cancel/save buttons and container
        const editButton = document.getElementById('editListing_editButton_amenities');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_amenities');
        const cancelButton = document.getElementById('editListing_cancelButton_amenities');
        const saveButton = document.getElementById('editListing_saveButton_amenities');
        const container = document.querySelector('[data-element="amenities_container"]');
        const amenitiesText = document.querySelector('[data-element="edit_amenities_text"]');
        const amenitiesError = document.getElementById('amenities-error');
        const amenitiesSubText = document.getElementById('amenities-subText');

        // Initially hide error text
        if (amenitiesError) {
            amenitiesError.style.display = 'none';
        }

        let initialState = [];
        let amenityElements = [];

        // Function to handle error display
        function handleError(show, message = '') {
            if (amenitiesError && amenitiesSubText) {
                amenitiesError.style.display = show ? 'block' : 'none';
                amenitiesSubText.style.display = show ? 'none' : 'block';
                if (show && message) {
                    amenitiesError.textContent = message;
                }
            }
        }

        // Function to validate amenities selection
        function validateAmenities() {
            const selectedCount = Array.from(amenityElements)
                .filter(element => element.style.borderWidth === '2px')
                .length;

            if (selectedCount === 0) {
                handleError(true);
                return false;
            }

            handleError(false);
            return true;
        }

        // Function to update amenities text
        function updateAmenitiesText() {
            const selectedElements = Array.from(amenityElements)
                .filter(element => element.style.borderWidth === '2px');

            const selectedCount = selectedElements.length;

            if (amenitiesText) {
                if (selectedCount === 0) {
                    amenitiesText.textContent = 'No amenities selected';
                } else {
                    amenitiesText.textContent = `${selectedCount} Selected`;
                }
            }
        }

        // Function to disable all amenity elements
        function disableAllAmenities() {
            amenityElements.forEach(element => {
                if (element) element.style.pointerEvents = 'none';
            });
        }

        // Function to enable all amenity elements
        function enableAllAmenities() {
            amenityElements.forEach(element => {
                if (element) element.style.pointerEvents = 'auto';
            });
        }

        // Function to fetch and render amenities
        async function fetchAndRenderAmenities() {
            try {
                const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/attribute');
                const amenities = await response.json();

                // Get all amenity elements
                amenityElements = document.querySelectorAll('[data-element="amenity"]');
                const iconElements = document.querySelectorAll('[data-element="amenity_icon"]');
                const textElements = document.querySelectorAll('[data-element="amenity_text"]');

                // Get selected amenity IDs from property data
                const selectedAmenityIds = data._property_attribute.map(a => a.attribute_id);

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
                            newIcon.loading = 'eager';
                        }
                        if (newText) {
                            newText.textContent = amenity.attribute_name;
                        }

                        // Add click handler and styling
                        template.style.cursor = 'pointer';
                        template.dataset.amenityId = amenity.id;
                        template.addEventListener('click', () => {
                            toggleAmenity(template);
                            handleError(false); // Hide error when user makes a selection
                        });

                        // Set default border style
                        template.style.borderWidth = '1px';
                        template.style.borderColor = '#e2e2e2';
                        template.style.margin = '0px';

                        // Pre-select if this amenity was previously selected
                        if (selectedAmenityIds.includes(amenity.id)) {
                            template.style.borderWidth = '2px';
                            template.style.borderColor = '#000000';
                            template.style.margin = '-1px';
                        }

                        // Insert the new element
                        amenityElements[0].parentNode.appendChild(template);
                        amenityElements = document.querySelectorAll('[data-element="amenity"]');
                    } else {
                        // Update existing elements
                        if (iconElements[i]) {
                            iconElements[i].src = amenity.attribute_icon.url;
                            iconElements[i].alt = amenity.attribute_name;
                            iconElements[i].loading = 'eager';
                        }
                        if (textElements[i]) {
                            textElements[i].textContent = amenity.attribute_name;
                        }

                        // Add click handler and styling
                        amenityElements[i].style.cursor = 'pointer';
                        amenityElements[i].dataset.amenityId = amenity.id;
                        amenityElements[i].addEventListener('click', () => {
                            toggleAmenity(amenityElements[i]);
                            handleError(false); // Hide error when user makes a selection
                        });

                        // Set default border style
                        amenityElements[i].style.borderWidth = '1px';
                        amenityElements[i].style.borderColor = '#e2e2e2';
                        amenityElements[i].style.margin = '0px';

                        // Pre-select if this amenity was previously selected
                        if (selectedAmenityIds.includes(amenity.id)) {
                            amenityElements[i].style.borderWidth = '2px';
                            amenityElements[i].style.borderColor = '#000000';
                            amenityElements[i].style.margin = '-1px';
                        }
                    }
                });

                // Update amenities text on initial load
                updateAmenitiesText();

                // Initially disable all amenities
                disableAllAmenities();

                // Set up edit button click handler
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        // Store current state
                        initialState = Array.from(amenityElements).map(element => ({
                            id: element.dataset.amenityId,
                            selected: element.style.borderWidth === '2px'
                        }));

                        editButton.style.display = 'none';
                        if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                        if (container) {
                            container.style.backgroundColor = 'white';
                            container.style.border = '1px solid #e2e2e2';
                        }

                        enableAllAmenities();
                    });
                }

                // Set up cancel button click handler
                if (cancelButton) {
                    cancelButton.addEventListener('click', () => {
                        // Restore initial state
                        initialState.forEach(state => {
                            const element = document.querySelector(`[data-amenity-id="${state.id}"]`);
                            if (element) {
                                if (state.selected) {
                                    element.style.borderWidth = '2px';
                                    element.style.borderColor = '#000000';
                                    element.style.margin = '-1px';
                                } else {
                                    element.style.borderWidth = '1px';
                                    element.style.borderColor = '#e2e2e2';
                                    element.style.margin = '0px';
                                }
                            }
                        });

                        // Reset UI state
                        editButton.style.display = 'flex';
                        if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                        if (container) {
                            container.style.backgroundColor = '';
                            container.style.border = '';
                        }
                        handleError(false);
                        disableAllAmenities();
                    });
                }

                // Set up save button click handler
                if (saveButton) {
                    saveButton.addEventListener('click', async () => {
                        if (!validateAmenities()) {
                            return;
                        }

                        const selectedAmenities = Array.from(amenityElements)
                            .filter(element => element.style.borderWidth === '2px')
                            .map(element => ({ amenity_id: parseInt(element.dataset.amenityId) }));

                        const updatedData = {
                            property_id: propertyId,
                            selectedAmenities: selectedAmenities,
                            unfinishedListing: true
                        };

                        try {
                            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_addOrEdit_home_attribute', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(updatedData)
                            });

                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            // Reset UI state after successful save
                            editButton.style.display = 'flex';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                            if (container) {
                                container.style.backgroundColor = '';
                                container.style.border = '';
                            }

                            disableAllAmenities();
                            updateAmenitiesText(); // Update text only after successful save
                            handleError(false);

                        } catch (error) {
                            console.error('Error updating amenities:', error);
                            handleError(true, 'Unable to save changes. Please try again later.');
                            // Keep edit mode active
                            if (container) {
                                container.style.backgroundColor = 'white';
                                container.style.border = '1px solid #e2e2e2';
                            }
                            enableAllAmenities();
                            editButton.style.display = 'none';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                        }
                    });
                }

            } catch (error) {
                console.error('Error fetching amenities:', error);
            }
        }

        // Function to toggle amenity selection
        function toggleAmenity(element) {
            const isSelected = element.style.borderWidth === '2px';

            if (isSelected) {
                element.style.borderWidth = '1px';
                element.style.borderColor = '#e2e2e2';
                element.style.margin = '0px';
            } else {
                element.style.borderWidth = '2px';
                element.style.borderColor = '#000000';
                element.style.margin = '-1px';
            }
        }

        // Initialize amenities
        fetchAndRenderAmenities();
    }

    // Function to initialize location section
    function initializeLocationSection(data) {
        // Get edit/cancel/save buttons and container
        const editButton = document.getElementById('editListing_editButton_location');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_location');
        const cancelButton = document.getElementById('editListing_cancelButton_location');
        const saveButton = document.getElementById('editListing_saveButton_location');
        const container = document.querySelector('[data-element="location_container"]');
        const locationError = document.getElementById('location-error');
        const locationSubText = document.getElementById('location-subText');
        const locationText = document.querySelector('[data-element="edit_location_text"]');
        const locationDescriptionInput = document.getElementById('locationDescription_input');
        const characterCount = document.getElementById('locationDescriptionInputField_characterCount');
        const maxChars = 4000; // Maximum characters for location description
        const editLocationElement = document.querySelector('[data-element="edit_location"]');

        // Hide error text initially
        if (locationError) {
            locationError.style.display = 'none';
        }

        // Get input elements
        const addressLine1Input = document.getElementById('addressLine1-input');
        const addressLine2Input = document.getElementById('addressLine2-input');
        const addressCityInput = document.getElementById('addressCity-input');
        const addressStateInput = document.getElementById('addressState-input');
        const addressZipcodeInput = document.getElementById('addressZipcode-input');

        let initialState = {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipcode: '',
            locationDescription: ''
        };

        // Store the original unit prefix (if any)
        let unitPrefix = '';
        let hadInitialUnit = false;

        // Function to extract just the number from a string
        function extractUnitNumber(value) {
            const match = value.match(/(\D*)(\d+)/);
            if (match) {
                return {
                    prefix: match[1],
                    number: match[2]
                };
            }
            return {
                prefix: '',
                number: value
            };
        }

        // Function to format unit with prefix
        function formatUnitWithPrefix(prefix, number) {
            if (!prefix && !hadInitialUnit) {
                return `#${number}`;
            }
            if (!prefix) return number;
            // Add space after prefix if it's not just '#'
            return prefix.trim() === '#' ? `${prefix}${number}` : `${prefix} ${number}`;
        }

        // Function to clean unit number - extract only digits
        function cleanUnitNumber(value) {
            const numbers = value.match(/\d+/);
            return numbers ? numbers[0] : '';
        }

        // Function to validate location fields
        function validateLocationFields() {
            // Check required fields
            const requiredFields = [addressLine1Input, addressCityInput, addressStateInput, addressZipcodeInput];
            const hasEmptyFields = requiredFields.some(input => !input.value.trim());

            // Florida Keys ZIP codes
            const keysZipCodes = ['33001', '33036', '33037', '33040', '33041', '33042', '33043', '33044', '33045', '33050', '33051', '33052', '33070'];

            // Check if zipcode is in Florida Keys
            const isKeysZipcode = keysZipCodes.includes(addressZipcodeInput.value.trim());

            // Check if state is Florida
            const stateValue = addressStateInput.value.trim().toLowerCase();
            const isFloridaState = stateValue === 'fl' || stateValue === 'florida';

            // Check if location description is filled
            const hasLocationDescription = locationDescriptionInput && locationDescriptionInput.innerText.trim().length > 0;

            if (hasEmptyFields) {
                if (locationError) {
                    locationError.textContent = "Please fill in all required fields";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                return false;
            }

            if (!hasLocationDescription) {
                if (locationError) {
                    locationError.textContent = "Please provide a location description";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                return false;
            }

            if (!isFloridaState) {
                if (locationError) {
                    locationError.textContent = "Property must be located in Florida";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                return false;
            }

            if (!isKeysZipcode) {
                if (locationError) {
                    locationError.textContent = "Please enter a valid Florida Keys ZIP code";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                return false;
            }

            if (locationError) locationError.style.display = 'none';
            if (locationSubText) locationSubText.style.display = 'block';
            return true;
        }

        // Function to update character count for location description
        function updateCharacterCount() {
            if (locationDescriptionInput && characterCount) {
                const currentLength = locationDescriptionInput.innerText.length;
                characterCount.textContent = `${currentLength}/${maxChars}`;

                // Change color if approaching limit
                if (currentLength > maxChars * 0.9) {
                    characterCount.style.color = '#FF5C5C';
                } else {
                    characterCount.style.color = '';
                }
            }
        }

        // Function to validate location description
        function validateLocationDescription() {
            if (locationDescriptionInput) {
                const currentLength = locationDescriptionInput.innerText.length;
                if (currentLength > maxChars) {
                    locationDescriptionInput.innerText = locationDescriptionInput.innerText.substring(0, maxChars);
                    updateCharacterCount();
                }

                // Check if description is empty
                if (currentLength === 0) {
                    if (locationError) {
                        locationError.textContent = "Please provide a location description";
                        locationError.style.display = 'block';
                        if (locationSubText) locationSubText.style.display = 'none';
                    }
                } else {
                    if (locationError) locationError.style.display = 'none';
                    if (locationSubText) locationSubText.style.display = 'block';
                }
            }
        }

        // Set initial values and disable inputs
        if (addressLine1Input && data.address_line_1) {
            addressLine1Input.value = data.address_line_1;
            initialState.addressLine1 = data.address_line_1;
            addressLine1Input.disabled = true;
        }

        if (addressLine2Input) {
            if (data.listing_unit) {
                hadInitialUnit = true;
                const { prefix, number } = extractUnitNumber(data.listing_unit);
                unitPrefix = prefix;
                addressLine2Input.value = number;
                initialState.addressLine2 = number;
            }
            addressLine2Input.disabled = true;
        }

        // Set location description if available
        if (locationDescriptionInput) {
            if (data.location_description) {
                locationDescriptionInput.innerText = data.location_description;
                initialState.locationDescription = data.location_description;
            } else {
                locationDescriptionInput.innerText = '';
                initialState.locationDescription = '';

                // Show error on load if location description is missing
                if (locationError) {
                    locationError.textContent = "Please provide a location description";
                    locationError.style.display = 'block';
                    if (locationSubText) locationSubText.style.display = 'none';
                }
                if (editLocationElement) {
                    editLocationElement.style.backgroundColor = '#FFE5E5';
                }
            }
            locationDescriptionInput.contentEditable = "false"; // Make it not editable initially
            updateCharacterCount();
        }

        // Parse city, state, zip from address_line_2
        if (data.address_line_2) {
            const matches = data.address_line_2.match(/([^,]+),\s*(\w+)\s+(\d+)/);
            if (matches) {
                const [, city, state, zipCode] = matches;

                if (addressCityInput) {
                    addressCityInput.value = city.trim();
                    initialState.city = city.trim();
                    addressCityInput.disabled = true;
                }
                if (addressStateInput) {
                    addressStateInput.value = state.trim();
                    initialState.state = state.trim();
                    addressStateInput.disabled = true;
                }
                if (addressZipcodeInput) {
                    addressZipcodeInput.value = zipCode.trim();
                    initialState.zipcode = zipCode.trim();
                    addressZipcodeInput.disabled = true;
                }
            }
        }

        // Set initial location text
        if (locationText && data.address_line_1) {
            let fullAddress = data.address_line_1;
            if (data.listing_unit) {
                fullAddress += ` ${data.listing_unit}`;
            }
            if (data.address_line_2) {
                fullAddress += `, ${data.address_line_2}`;
            }
            locationText.textContent = fullAddress;
        }

        // Add input event listener for location description
        if (locationDescriptionInput) {
            locationDescriptionInput.addEventListener('input', () => {
                updateCharacterCount();
                validateLocationDescription();
            });
        }

        // Add click handler for edit button
        if (editButton) {
            editButton.addEventListener('click', () => {
                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                if (container) {
                    container.style.backgroundColor = 'white';
                    container.style.border = '1px solid #e2e2e2';
                }

                // Enable inputs
                if (addressLine1Input) addressLine1Input.disabled = true;
                if (addressLine2Input) addressLine2Input.disabled = true;
                if (addressCityInput) addressCityInput.disabled = true;
                if (addressStateInput) addressStateInput.disabled = true;
                if (addressZipcodeInput) addressZipcodeInput.disabled = true;
                if (locationDescriptionInput) {
                    locationDescriptionInput.contentEditable = "true";
                    locationDescriptionInput.style.backgroundColor = 'white';
                    locationDescriptionInput.focus(); // Focus on the input to make it active
                }
            });
        }

        // Add click handler for cancel button
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Reset values to initial state
                if (addressLine1Input) {
                    addressLine1Input.value = initialState.addressLine1;
                    addressLine1Input.disabled = true;
                }
                if (addressLine2Input) {
                    addressLine2Input.value = initialState.addressLine2;
                    addressLine2Input.disabled = true;
                }
                if (addressCityInput) {
                    addressCityInput.value = initialState.city;
                    addressCityInput.disabled = true;
                }
                if (addressStateInput) {
                    addressStateInput.value = initialState.state;
                    addressStateInput.disabled = true;
                }
                if (addressZipcodeInput) {
                    addressZipcodeInput.value = initialState.zipcode;
                    addressZipcodeInput.disabled = true;
                }
                if (locationDescriptionInput) {
                    locationDescriptionInput.innerText = initialState.locationDescription;
                    locationDescriptionInput.contentEditable = "false";
                    locationDescriptionInput.style.backgroundColor = '';
                    updateCharacterCount();

                    // Show error if location description is still empty after cancel
                    if (!initialState.locationDescription.trim()) {
                        if (locationError) {
                            locationError.textContent = "Please provide a location description";
                            locationError.style.display = 'block';
                            if (locationSubText) locationSubText.style.display = 'none';
                        }
                    } else {
                        if (locationError) locationError.style.display = 'none';
                        if (locationSubText) locationSubText.style.display = 'block';
                    }
                }

                // Reset UI state
                editButton.style.display = 'flex';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                if (container) {
                    container.style.backgroundColor = '';
                    container.style.border = '';
                }
                if (locationError && initialState.locationDescription.trim()) {
                    locationError.style.display = 'none';
                }
                if (locationSubText && initialState.locationDescription.trim()) {
                    locationSubText.style.display = 'block';
                }
            });
        }

        // Add click handler for save button
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                if (!validateLocationFields()) {
                    return;
                }

                try {
                    // Wait for user ID to be available
                    window.Wized = window.Wized || [];
                    await window.Wized.requests.waitFor('Load_user');
                    const userId = window.Wized.data.r.Load_user.data.id;

                    const cityState = `${addressCityInput.value}, ${addressStateInput.value}`;

                    // Clean unit number before formatting
                    const cleanedUnitNumber = addressLine2Input.value ? cleanUnitNumber(addressLine2Input.value) : '';
                    const formattedUnit = cleanedUnitNumber ? formatUnitWithPrefix(unitPrefix, cleanedUnitNumber) : '';

                    const locationDescriptionValue = locationDescriptionInput ? locationDescriptionInput.innerText : '';

                    const updatedData = {
                        property_id: data.id,
                        user_id: userId,
                        address_line_1: addressLine1Input.value,
                        address_line_2: `${cityState} ${addressZipcodeInput.value}`,
                        listing_unit: formattedUnit,
                        listing_city_state: cityState,
                        listing_city: addressCityInput.value,
                        listing_state: addressStateInput.value,
                        listing_zipcode: addressZipcodeInput.value,
                        location_description: locationDescriptionValue
                    };

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Update initial state with new values
                    initialState = {
                        addressLine1: addressLine1Input.value,
                        addressLine2: cleanedUnitNumber,
                        city: addressCityInput.value,
                        state: addressStateInput.value,
                        zipcode: addressZipcodeInput.value,
                        locationDescription: locationDescriptionValue
                    };

                    // Update location text after successful save
                    if (locationText) {
                        let fullAddress = addressLine1Input.value;
                        if (cleanedUnitNumber) {
                            fullAddress += ` ${formattedUnit}`;
                        }
                        fullAddress += `, ${cityState} ${addressZipcodeInput.value}`;
                        locationText.textContent = fullAddress;
                    }

                    // Reset UI state
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                    if (container) {
                        container.style.backgroundColor = '';
                        container.style.border = '';
                    }

                    // Check if there's an error after save (e.g., missing location description)
                    if (!locationDescriptionValue.trim()) {
                        if (locationError) {
                            locationError.textContent = "Please provide a location description";
                            locationError.style.display = 'block';
                            if (locationSubText) locationSubText.style.display = 'none';
                        }
                        if (editLocationElement) {
                            editLocationElement.style.backgroundColor = '#FFE5E5';
                        }
                    } else {
                        if (locationError) {
                            locationError.style.display = 'none';
                        }
                        if (locationSubText) {
                            locationSubText.style.display = 'block';
                        }
                        if (editLocationElement) {
                            editLocationElement.style.backgroundColor = '';
                        }
                    }

                    // Disable inputs
                    if (addressLine1Input) addressLine1Input.disabled = true;
                    if (addressLine2Input) addressLine2Input.disabled = true;
                    if (addressCityInput) addressCityInput.disabled = true;
                    if (addressStateInput) addressStateInput.disabled = true;
                    if (addressZipcodeInput) addressZipcodeInput.disabled = true;
                    if (locationDescriptionInput) {
                        locationDescriptionInput.contentEditable = "false";
                        locationDescriptionInput.style.backgroundColor = '';
                    }

                } catch (error) {
                    console.error('Error updating location:', error);
                    if (locationError) {
                        locationError.textContent = "Unable to save changes. Please try again later.";
                        locationError.style.display = 'block';
                        if (locationSubText) locationSubText.style.display = 'none';
                    }
                    // Keep edit mode active
                    if (container) {
                        container.style.backgroundColor = 'white';
                        container.style.border = '1px solid #e2e2e2';
                    }
                    // Keep inputs enabled
                    if (addressLine1Input) addressLine1Input.disabled = false;
                    if (addressLine2Input) addressLine2Input.disabled = false;
                    if (addressCityInput) addressCityInput.disabled = false;
                    if (addressStateInput) addressStateInput.disabled = false;
                    if (addressZipcodeInput) addressZipcodeInput.disabled = false;
                    if (locationDescriptionInput) {
                        locationDescriptionInput.contentEditable = "true";
                        locationDescriptionInput.style.backgroundColor = 'white';
                    }
                    editButton.style.display = 'none';
                    if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                }
            });
        }
    }

    // Function to initialize host section
    function initializeHostSection(data) {
        // Get DOM elements
        const hostInput = document.querySelector('[data-element="host_input"]');
        const characterCount = document.getElementById('hostInputField_characterCount');
        const hostError = document.getElementById('host-error');
        const hostSubText = document.getElementById('host-subText');
        const editButton = document.getElementById('editListing_editButton_host');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_host');
        const cancelButton = document.getElementById('editListing_cancelButton_host');
        const saveButton = document.getElementById('editListing_saveButton_host');
        const maxCharacters = 400;
        const photoContainerParent = document.querySelector('[data-element="photo_container_parent_host"]');
        const photoContainer = document.querySelector('[data-element="photo_container_host"]');
        const addHostPhotoButton = document.querySelector('[data-element="add_host_photo_button"]');
        const hostContainer = document.querySelector('[data-element="host_container"]');
        const profilePicText = document.querySelector('[data-element="edit_host_text_profilePic"]');
        const descriptionText = document.querySelector('[data-element="edit_host_text_description"]');
        const editHostElement = document.querySelector('[data-element="edit_host"]');

        // Store initial states
        const initialPhotoState = {
            display: data._user_host?.Profile_Picture?.url ? 'flex' : 'none',
            url: data._user_host?.Profile_Picture?.url || ''
        };

        const initialHostState = {
            text: data._user_host?.host_description || '',
            backgroundColor: '',
            border: ''
        };

        // Set initial text states
        if (profilePicText) {
            profilePicText.textContent = initialPhotoState.url ? 'Profile picture added' : 'No profile picture';
        }

        if (descriptionText) {
            descriptionText.textContent = initialHostState.text ? initialHostState.text.substring(0, 40) + '...' : 'No host description';
        }

        // Track current photo URL
        let currentPhotoUrl = initialPhotoState.url;

        // Function to handle error display
        function handleError(show, message = '') {
            if (hostError && hostSubText) {
                hostError.style.display = show ? 'block' : 'none';
                hostSubText.style.display = show ? 'none' : 'block';
                if (show && message) {
                    hostError.textContent = message;
                }
            }
        }

        // Function to update background state
        function updateBackgroundState() {
            if (editHostElement) {
                const hasValidData = initialHostState.text && initialPhotoState.url;
                editHostElement.style.backgroundColor = hasValidData ? '' : '#FFE5E5';
            }
        }

        // Validation function
        function validateHost() {
            const text = hostInput.innerText.trim();
            const hasPhoto = currentPhotoUrl !== '';

            if (!hasPhoto && text.length === 0) {
                handleError(true, 'Please add a profile picture and host description');
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (!hasPhoto) {
                handleError(true, 'Please add a profile picture');
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (text.length === 0) {
                handleError(true, 'Please add a host description');
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            if (text.length > maxCharacters) {
                handleError(true, `Description cannot exceed ${maxCharacters} characters`);
                if (saveButton) saveButton.disabled = true;
                return false;
            }

            handleError(false);
            if (saveButton) saveButton.disabled = false;
            return true;
        }

        // Initial background state update
        updateBackgroundState();

        // Function to handle host photo selection
        function handleHostPhotoSelection(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                currentPhotoUrl = e.target.result;

                if (photoContainerParent) {
                    photoContainerParent.style.display = 'flex';
                    const photoImg = photoContainerParent.querySelector('[data-element="photo_container_host"]');
                    if (photoImg) {
                        photoImg.src = currentPhotoUrl;
                    }
                }
                validateHost();
            };
            reader.readAsDataURL(file);
        }

        // Function to disable photo upload functionality
        function disablePhotoUpload() {
            if (addHostPhotoButton) {
                addHostPhotoButton.onclick = null;
                addHostPhotoButton.style.border = '1px solid black';
            }
        }

        if (hostInput) {
            // Initially set contentEditable to false
            hostInput.contentEditable = false;

            // Set styles to ensure text wraps and aligns correctly
            hostInput.style.whiteSpace = 'pre-wrap';
            hostInput.style.textAlign = 'left';
            hostInput.style.height = '250px';
            hostInput.style.overflowY = 'auto';
            hostInput.style.boxSizing = 'border-box';
            hostInput.style.padding = '10px';
            hostInput.style.outline = 'none';
            hostInput.style.caretColor = 'auto';
            hostInput.style.backgroundColor = initialHostState.backgroundColor;
            hostInput.style.border = initialHostState.border;

            // Initialize with existing description if any
            if (characterCount) {
                characterCount.textContent = `${initialHostState.text.length}/${maxCharacters}`;
            }

            // Set existing text in input element
            if (initialHostState.text) {
                hostInput.innerText = initialHostState.text;
            }

            let originalText = initialHostState.text;

            // Create file input element once
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
            fileInput.addEventListener('change', handleHostPhotoSelection);

            // Initially disable photo upload
            disablePhotoUpload();

            // Initial validation
            validateHost();

            if (editButton) {
                editButton.addEventListener('click', () => {
                    hostInput.contentEditable = true;
                    editButton.style.display = 'none';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'flex';
                    }
                    hostInput.style.backgroundColor = 'white';
                    hostInput.style.border = '1px solid #e2e2e2';
                    if (hostContainer) {
                        hostContainer.style.backgroundColor = 'white';
                        hostContainer.style.border = '1px solid #e2e2e2';
                    }
                    hostInput.focus();

                    // Enable photo upload functionality
                    if (addHostPhotoButton) {
                        addHostPhotoButton.style.border = '1px solid #e2e2e2';
                        addHostPhotoButton.onclick = () => fileInput.click();
                    }

                    // Place cursor at end
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(hostInput);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            }

            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    hostInput.contentEditable = false;
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) {
                        cancelSaveContainer.style.display = 'none';
                    }

                    // Reset host input to initial state
                    hostInput.style.backgroundColor = initialHostState.backgroundColor;
                    hostInput.style.border = initialHostState.border;
                    if (hostContainer) {
                        hostContainer.style.backgroundColor = initialHostState.backgroundColor;
                        hostContainer.style.border = initialHostState.border;
                    }
                    hostInput.innerText = initialHostState.text;
                    hostInput.style.color = '';

                    if (characterCount) {
                        characterCount.textContent = `${initialHostState.text.length}/${maxCharacters}`;
                        characterCount.style.color = 'grey';
                    }

                    // Reset photo to initial state
                    if (photoContainerParent) {
                        photoContainerParent.style.display = initialPhotoState.display;
                        const photoImg = photoContainerParent.querySelector('[data-element="photo_container_host"]');
                        if (photoImg) {
                            photoImg.src = initialPhotoState.url;
                        }
                    }

                    // Reset current photo URL to initial state
                    currentPhotoUrl = initialPhotoState.url;

                    // Disable photo upload functionality
                    disablePhotoUpload();

                    // Validate after reset
                    validateHost();
                });
            }

            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    // Validate before saving
                    if (!validateHost()) return;

                    try {
                        // Wait for user ID to be available
                        window.Wized = window.Wized || [];
                        await window.Wized.requests.waitFor('Load_user');
                        const userId = window.Wized.data.r.Load_user.data.id;

                        const updatedData = {
                            property_id: propertyId,
                            user_id: userId,
                            host_description: hostInput.innerText.trim(),
                            profile_picture: currentPhotoUrl
                        };

                        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_host', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updatedData)
                        });

                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }

                        // Update UI after successful save
                        hostInput.contentEditable = false;
                        editButton.style.display = 'flex';
                        if (cancelSaveContainer) {
                            cancelSaveContainer.style.display = 'none';
                        }
                        hostInput.style.backgroundColor = initialHostState.backgroundColor;
                        hostInput.style.border = initialHostState.border;
                        if (hostContainer) {
                            hostContainer.style.backgroundColor = initialHostState.backgroundColor;
                            hostContainer.style.border = initialHostState.border;
                        }

                        // Update initial states after successful save
                        originalText = hostInput.innerText.trim();
                        initialHostState.text = originalText;
                        initialPhotoState.url = currentPhotoUrl;
                        initialPhotoState.display = 'flex';

                        // Update text elements after successful save
                        if (profilePicText) {
                            profilePicText.textContent = currentPhotoUrl ? 'Profile picture added' : 'No profile picture';
                        }

                        if (descriptionText) {
                            descriptionText.textContent = originalText ? originalText.substring(0, 40) + '...' : 'No host description';
                        }

                        // Disable photo upload functionality
                        disablePhotoUpload();

                        // Clear any errors
                        handleError(false);

                        // Update background state after successful save
                        updateBackgroundState();



                    } catch (error) {
                        console.error('Error updating host description:', error);
                        handleError(true, 'Unable to save changes. Please try again later.');

                        // Keep edit mode active
                        if (hostContainer) {
                            hostContainer.style.backgroundColor = 'white';
                            hostContainer.style.border = '1px solid #e2e2e2';
                        }
                        hostInput.contentEditable = true;
                        editButton.style.display = 'none';
                        if (cancelSaveContainer) {
                            cancelSaveContainer.style.display = 'flex';
                        }
                    }
                });
            }

            // Handle input changes
            hostInput.addEventListener('input', () => {
                const text = hostInput.innerText;
                const currentLength = text.trim().length;

                if (characterCount) {
                    characterCount.textContent = `${currentLength}/${maxCharacters}`;
                    const isOverLimit = currentLength > maxCharacters;
                    characterCount.style.color = isOverLimit ? 'red' : 'grey';
                    hostInput.style.color = isOverLimit ? 'red' : '';
                    hostInput.style.border = isOverLimit ? '1px solid red' : '1px solid #e2e2e2';
                }

                validateHost();
            });

            // Keep cursor visible when editable
            hostInput.addEventListener('click', () => {
                if (hostInput.contentEditable === 'true') {
                    hostInput.focus();
                }
            });

            hostInput.addEventListener('blur', () => {
                if (hostInput.contentEditable === 'true' && !hostInput.innerText.trim()) {
                    hostInput.focus();
                }
            });
        }

        // Show initial photo if it exists
        if (data._user_host?.Profile_Picture?.url) {
            if (photoContainerParent) {
                photoContainerParent.style.display = 'flex';
                const photoImg = photoContainerParent.querySelector('[data-element="photo_container_host"]');
                if (photoImg) {
                    photoImg.src = data._user_host.Profile_Picture.url;
                }
            }
        } else {
            if (photoContainerParent) {
                photoContainerParent.style.display = 'none';
            }
            if (photoContainer) {
                photoContainer.src = '';
            }
        }

        if (photoContainerParent) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        // Handle style changes if needed
                    }
                });
            });

            observer.observe(photoContainerParent, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }

    // Function to initialize rules section
    function initializeRulesSection(data) {
        // Get DOM elements
        const editButton = document.getElementById('editListing_editButton_rules');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_rules');
        const cancelButton = document.getElementById('editListing_cancelButton_rules');
        const saveButton = document.getElementById('editListing_saveButton_rules');
        const container = document.querySelector('[data-element="rules_container"]');
        const rulesText = document.querySelector('[data-element="edit_rules_text"]');
        const rulesError = document.getElementById('rules-error');
        const rulesSubText = document.getElementById('rules-subText');

        // Hide error and show subtext initially
        if (rulesError) {
            rulesError.style.display = 'none';
            rulesError.textContent = 'Unable to save changes. Please try again later.';
        }
        if (rulesSubText) {
            rulesSubText.style.display = 'block';
            rulesSubText.textContent = 'Select the rules that apply to your property.';
        }

        // Get all rule buttons upfront to set initial visual state
        const duringVisitRules = {
            guestMax: document.querySelector('[data-element="duringVisit_guestMax"]'),
            noParty: document.querySelector('[data-element="duringVisit_noParty"]'),
            noPet: document.querySelector('[data-element="duringVisit_noPet"]'),
            noSmoking: document.querySelector('[data-element="duringVisit_noSmoking"]')
        };

        const beforeDepartureRules = {
            towels: document.querySelector('[data-element="beforeDeparture_towels"]'),
            trash: document.querySelector('[data-element="beforeDeparture_trash"]'),
            bedsheets: document.querySelector('[data-element="beforeDeparture_bedsheets"]'),
            furniture: document.querySelector('[data-element="beforeDeparture_furniture"]')
        };

        // Map rules_custom text to button types
        const duringVisitMap = {
            'guests maximum': 'guestMax',
            'No parties or events': 'noParty',
            'No pets': 'noPet',
            'No smoking': 'noSmoking'
        };

        const beforeDepartureMap = {
            'Gather used towels': 'towels',
            'Throw trash away': 'trash',
            'Gather used bedsheets': 'bedsheets',
            'Organize moved furniture': 'furniture'
        };

        // Store initial state
        let selectedDuringVisitRules = new Set(['guests maximum', 'No parties or events']); // Initialize with required rules
        let selectedBeforeDepartureRules = new Set();

        // Apply selected rules from data first
        if (data._property_rules) {
            data._property_rules.forEach(rule => {
                let ruleText = rule.rules_custom.replace(/^[0-9]+ /, ''); // Remove leading numbers

                if (rule.rules_category_id === 2) { // During visit rules
                    selectedDuringVisitRules.add(ruleText);
                    const buttonType = duringVisitMap[ruleText];
                    const button = duringVisitRules[buttonType];
                    if (button) {
                        button.style.outline = '2px solid black';
                        button.style.outlineOffset = '-1px';
                    }
                } else if (rule.rules_category_id === 3) { // Before departure rules
                    selectedBeforeDepartureRules.add(ruleText);
                    const buttonType = beforeDepartureMap[ruleText];
                    const button = beforeDepartureRules[buttonType];
                    if (button) {
                        button.style.outline = '2px solid black';
                        button.style.outlineOffset = '-1px';
                    }
                }
            });
        }

        // Set required rules visual state
        if (duringVisitRules.guestMax) {
            duringVisitRules.guestMax.style.outline = '2px solid black';
            duringVisitRules.guestMax.style.outlineOffset = '-1px';
            duringVisitRules.guestMax.style.opacity = '0.7';
            if (data.num_guests) {
                duringVisitRules.guestMax.textContent = `${data.num_guests} guests maximum`;
            }
        }
        if (duringVisitRules.noParty) {
            duringVisitRules.noParty.style.outline = '2px solid black';
            duringVisitRules.noParty.style.outlineOffset = '-1px';
            duringVisitRules.noParty.style.opacity = '0.7';
        }

        // Store initial state
        const initialState = {
            duringVisit: new Set(selectedDuringVisitRules),
            beforeDeparture: new Set(selectedBeforeDepartureRules)
        };

        // Update rules text initially
        if (rulesText) {
            const totalSelected = selectedDuringVisitRules.size + selectedBeforeDepartureRules.size;
            rulesText.textContent = `${totalSelected} Selected`;
        }

        // Initially disable all non-required rules
        Object.entries(duringVisitRules).forEach(([rule, button]) => {
            if (button && rule !== 'guestMax' && rule !== 'noParty') {
                button.style.pointerEvents = 'none';
                button.style.cursor = 'default';
            }
        });
        Object.values(beforeDepartureRules).forEach(button => {
            if (button) {
                button.style.pointerEvents = 'none';
                button.style.cursor = 'default';
            }
        });

        // Function to handle rule button clicks
        function handleDuringVisitRuleClick(rule, button) {
            const ruleText = Object.entries(duringVisitMap).find(([_, val]) => val === rule)[0];
            if (selectedDuringVisitRules.has(ruleText)) {
                selectedDuringVisitRules.delete(ruleText);
                button.style.outline = '';
                button.style.outlineOffset = '';
            } else {
                selectedDuringVisitRules.add(ruleText);
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }

        function handleBeforeDepartureRuleClick(rule, button) {
            const ruleText = Object.entries(beforeDepartureMap).find(([_, val]) => val === rule)[0];
            if (selectedBeforeDepartureRules.has(ruleText)) {
                selectedBeforeDepartureRules.delete(ruleText);
                button.style.outline = '';
                button.style.outlineOffset = '';
            } else {
                selectedBeforeDepartureRules.add(ruleText);
                button.style.outline = '2px solid black';
                button.style.outlineOffset = '-1px';
            }
        }

        // Set up edit button click handler
        if (editButton) {
            editButton.addEventListener('click', () => {
                // Hide error and show subtext when editing starts
                if (rulesError) rulesError.style.display = 'none';
                if (rulesSubText) rulesSubText.style.display = 'block';

                // Function to enable all rules except required ones
                function enableAllRules() {
                    Object.entries(duringVisitRules).forEach(([rule, button]) => {
                        if (button && rule !== 'guestMax' && rule !== 'noParty') {
                            button.style.pointerEvents = 'auto';
                            button.style.cursor = 'pointer';
                            // Remove existing listeners before adding new ones
                            button.replaceWith(button.cloneNode(true));
                            const newButton = duringVisitRules[rule] = document.querySelector(`[data-element="duringVisit_${rule}"]`);
                            newButton.addEventListener('click', () => handleDuringVisitRuleClick(rule, newButton));
                        }
                    });
                    Object.entries(beforeDepartureRules).forEach(([rule, button]) => {
                        if (button) {
                            button.style.pointerEvents = 'auto';
                            button.style.cursor = 'pointer';
                            // Remove existing listeners before adding new ones
                            button.replaceWith(button.cloneNode(true));
                            const newButton = beforeDepartureRules[rule] = document.querySelector(`[data-element="beforeDeparture_${rule}"]`);
                            newButton.addEventListener('click', () => handleBeforeDepartureRuleClick(rule, newButton));
                        }
                    });
                }

                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                if (container) {
                    container.style.backgroundColor = 'white';
                    container.style.border = '1px solid #e2e2e2';
                }
                enableAllRules();

                // Set up cancel button click handler
                if (cancelButton) {
                    const cancelHandler = () => {
                        // Hide error and show subtext when canceling
                        if (rulesError) rulesError.style.display = 'none';
                        if (rulesSubText) rulesSubText.style.display = 'block';

                        // Restore initial state
                        selectedDuringVisitRules = new Set(initialState.duringVisit);
                        selectedBeforeDepartureRules = new Set(initialState.beforeDeparture);

                        // Reset UI
                        editButton.style.display = 'flex';
                        if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                        if (container) {
                            container.style.backgroundColor = '';
                            container.style.border = '';
                        }

                        // Reset visual state and disable buttons
                        Object.entries(duringVisitRules).forEach(([rule, button]) => {
                            if (button) {
                                if (rule !== 'guestMax' && rule !== 'noParty') {
                                    const ruleText = Object.entries(duringVisitMap).find(([_, val]) => val === rule)[0];
                                    button.style.outline = selectedDuringVisitRules.has(ruleText) ? '2px solid black' : '';
                                    button.style.outlineOffset = selectedDuringVisitRules.has(ruleText) ? '-1px' : '';
                                    button.style.pointerEvents = 'none';
                                    button.style.cursor = 'default';
                                }
                            }
                        });

                        Object.entries(beforeDepartureRules).forEach(([rule, button]) => {
                            if (button) {
                                const ruleText = Object.entries(beforeDepartureMap).find(([_, val]) => val === rule)[0];
                                button.style.outline = selectedBeforeDepartureRules.has(ruleText) ? '2px solid black' : '';
                                button.style.outlineOffset = selectedBeforeDepartureRules.has(ruleText) ? '-1px' : '';
                                button.style.pointerEvents = 'none';
                                button.style.cursor = 'default';
                            }
                        });

                        // Remove the cancel handler to prevent multiple bindings
                        cancelButton.removeEventListener('click', cancelHandler);
                    };

                    cancelButton.addEventListener('click', cancelHandler);
                }

                // Set up save button click handler
                if (saveButton) {
                    const saveHandler = async () => {
                        // Get guest max number from text content
                        const guestMaxButton = duringVisitRules.guestMax;
                        const guestMaxText = guestMaxButton?.textContent || '';
                        const guestMax = parseInt(guestMaxText.split(' ')[0]) || 0;

                        // Include all during stay rules including guest max
                        const duringStay = Array.from(selectedDuringVisitRules).map(rule => ({
                            rule: rule
                        }));
                        const beforeDeparture = Array.from(selectedBeforeDepartureRules).map(rule => ({
                            rule: rule
                        }));

                        try {
                            const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_rules`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    property_id: propertyId,
                                    user_id: data.user_id,
                                    duringStay,
                                    beforeDeparture,
                                    guestMax
                                })
                            });

                            if (!response.ok) {
                                throw new Error('Unable to save changes. Please try again later.');
                            }

                            // Update initial state after successful save
                            initialState.duringVisit = new Set(selectedDuringVisitRules);
                            initialState.beforeDeparture = new Set(selectedBeforeDepartureRules);

                            // Update rules text after successful save
                            if (rulesText) {
                                const totalSelected = selectedDuringVisitRules.size + selectedBeforeDepartureRules.size;
                                rulesText.textContent = `${totalSelected} Selected`;
                            }

                            // Reset UI state after save
                            editButton.style.display = 'flex';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                            if (container) {
                                container.style.backgroundColor = '';
                                container.style.border = '';
                            }

                            // Hide error and show subtext after successful save
                            if (rulesError) rulesError.style.display = 'none';
                            if (rulesSubText) rulesSubText.style.display = 'block';

                            // Disable all non-required rules
                            Object.entries(duringVisitRules).forEach(([rule, button]) => {
                                if (button && rule !== 'guestMax' && rule !== 'noParty') {
                                    button.style.pointerEvents = 'none';
                                    button.style.cursor = 'default';
                                }
                            });
                            Object.values(beforeDepartureRules).forEach(button => {
                                if (button) {
                                    button.style.pointerEvents = 'none';
                                    button.style.cursor = 'default';
                                }
                            });

                            // Remove the save handler to prevent multiple bindings
                            saveButton.removeEventListener('click', saveHandler);

                        } catch (error) {
                            console.error('Error saving rules:', error);
                            if (rulesError && rulesSubText) {
                                rulesError.textContent = 'Unable to save changes. Please try again later.';
                                rulesError.style.display = 'block';
                                rulesSubText.style.display = 'none';
                            }
                            // Keep edit mode active
                            if (container) {
                                container.style.backgroundColor = 'white';
                                container.style.border = '1px solid #e2e2e2';
                            }
                            editButton.style.display = 'none';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                        }
                    };

                    saveButton.addEventListener('click', saveHandler);
                }
            });
        }
    }

    // Function to initialize safety section
    function initializeSafetySection(data) {
        // Get DOM elements
        const editButton = document.getElementById('editListing_editButton_safety');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_safety');
        const cancelButton = document.getElementById('editListing_cancelButton_safety');
        const saveButton = document.getElementById('editListing_saveButton_safety');
        const container = document.querySelector('[data-element="safety_container"]');
        const safetyText = document.querySelector('[data-element="edit_safety_text"]');
        const safetyError = document.getElementById('safety-error');
        const safetySubText = document.getElementById('safety-subText');

        // Hide error and show subtext initially
        if (safetyError) {
            safetyError.style.display = 'none';
            safetyError.textContent = 'Unable to save changes. Please try again later.';
        }
        if (safetySubText) safetySubText.style.display = 'block';

        // Get all safety feature buttons
        const safetyFeatures = {
            securityCamera: document.querySelector('[data-element="safety_securityCamera"]'),
            doorbellCamera: document.querySelector('[data-element="safety_doorbellCamera"]'),
            fireExtinguisher: document.querySelector('[data-element="safety_fireExtinguisher"]'),
            smokeAlarm: document.querySelector('[data-element="safety_smokeAlarm"]'),
            carbonMonoxideAlarm: document.querySelector('[data-element="safety_carbonMonoxideAlarm"]'),
            firstAidKit: document.querySelector('[data-element="safety_firstAidKit"]')
        };

        // Store initial state
        let selectedSafetyFeatures = new Set();

        // Apply selected features from data
        if (data._property_safety) {
            data._property_safety.forEach(feature => {
                // Skip "No carbon monoxide alarm" since it's handled separately
                if (feature.attribute_custom_name !== "No carbon monoxide alarm") {
                    selectedSafetyFeatures.add(feature.attribute_custom_name);
                    const featureType = Object.keys(safetyFeatures).find(key =>
                        safetyFeatures[key]?.textContent.trim() === feature.attribute_custom_name
                    );
                    if (featureType && safetyFeatures[featureType]) {
                        safetyFeatures[featureType].style.outline = '2px solid black';
                        safetyFeatures[featureType].style.outlineOffset = '-1px';
                    }
                }
            });
        }

        // Store initial state for comparison
        const initialState = {
            safety: new Set(selectedSafetyFeatures)
        };

        // Update safety text with initial count
        if (safetyText) {
            safetyText.textContent = `${initialState.safety.size} Selected`;
        }

        // Disable all buttons initially
        Object.values(safetyFeatures).forEach(button => {
            if (button) {
                button.style.pointerEvents = 'none';
                button.style.cursor = 'default';
            }
        });

        // Function to setup button click handlers
        function setupButtonHandlers() {
            Object.values(safetyFeatures).forEach(button => {
                if (button) {
                    button.onclick = () => {
                        const featureText = button.textContent.trim();
                        if (selectedSafetyFeatures.has(featureText)) {
                            selectedSafetyFeatures.delete(featureText);
                            button.style.outline = '';
                            button.style.outlineOffset = '';
                        } else {
                            selectedSafetyFeatures.add(featureText);
                            button.style.outline = '2px solid black';
                            button.style.outlineOffset = '-1px';
                        }
                    };
                }
            });
        }

        // Add edit button click handler
        if (editButton) {
            editButton.addEventListener('click', () => {
                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                if (container) {
                    container.style.backgroundColor = 'white';
                    container.style.border = '1px solid #e2e2e2';
                }

                // Enable all buttons and setup handlers
                Object.values(safetyFeatures).forEach(button => {
                    if (button) {
                        button.style.pointerEvents = 'auto';
                        button.style.cursor = 'pointer';
                    }
                });
                setupButtonHandlers();

                // Add cancel button handler
                if (cancelButton) {
                    cancelButton.onclick = () => {
                        selectedSafetyFeatures = new Set(initialState.safety);

                        // Reset button states
                        Object.values(safetyFeatures).forEach(button => {
                            if (button) {
                                const featureText = button.textContent.trim();
                                if (selectedSafetyFeatures.has(featureText)) {
                                    button.style.outline = '2px solid black';
                                    button.style.outlineOffset = '-1px';
                                } else {
                                    button.style.outline = '';
                                    button.style.outlineOffset = '';
                                }
                                button.style.pointerEvents = 'none';
                                button.style.cursor = 'default';
                                button.onclick = null;
                            }
                        });

                        // Reset UI state
                        editButton.style.display = 'flex';
                        if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                        if (container) {
                            container.style.backgroundColor = '';
                            container.style.border = '';
                        }

                        // Hide error and show subtext
                        if (safetyError) safetyError.style.display = 'none';
                        if (safetySubText) safetySubText.style.display = 'block';
                    };
                }

                // Add save button handler
                if (saveButton) {
                    saveButton.onclick = async () => {
                        try {
                            // Prepare safety features for API
                            const safetyFeaturesList = Array.from(selectedSafetyFeatures);

                            // Add "No carbon monoxide alarm" if carbon monoxide alarm is not selected
                            if (!selectedSafetyFeatures.has(safetyFeatures.carbonMonoxideAlarm?.textContent.trim())) {
                                safetyFeaturesList.push("No carbon monoxide alarm");
                            }

                            // Make API call to save safety features
                            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/property_addOrEdit_home_safety', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    property_id: propertyId,
                                    selectedSafety: safetyFeaturesList.map(feature => ({
                                        attribute: feature
                                    })),
                                    unfinishedListing: true
                                })
                            });

                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            // Update initial state and text only after successful save
                            initialState.safety = new Set(selectedSafetyFeatures);
                            if (safetyText) {
                                safetyText.textContent = `${initialState.safety.size} Selected`;
                            }

                            // Reset UI state
                            editButton.style.display = 'flex';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                            if (container) {
                                container.style.backgroundColor = '';
                                container.style.border = '';
                            }

                            // Hide error and show subtext after successful save
                            if (safetyError) safetyError.style.display = 'none';
                            if (safetySubText) safetySubText.style.display = 'block';

                            // Disable all buttons and remove handlers
                            Object.values(safetyFeatures).forEach(button => {
                                if (button) {
                                    button.style.pointerEvents = 'none';
                                    button.style.cursor = 'default';
                                    button.onclick = null;
                                }
                            });

                        } catch (error) {
                            console.error('Error saving safety features:', error);
                            // Show error and hide subtext
                            if (safetyError) {
                                safetyError.style.display = 'block';
                                safetySubText.style.display = 'none';
                            }
                            // Keep edit mode active
                            if (container) {
                                container.style.backgroundColor = 'white';
                                container.style.border = '1px solid #e2e2e2';
                            }
                            editButton.style.display = 'none';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                        }
                    };
                }
            });
        }
    }

    // Function to initialize cancellation policy section
    function initializeCancellationPolicySection(data) {
        // Get DOM elements
        const editButton = document.getElementById('editListing_editButton_cancellationPolicy');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_cancellationPolicy');
        const cancelButton = document.getElementById('editListing_cancelButton_cancellationPolicy');
        const saveButton = document.getElementById('editListing_saveButton_cancellationPolicy');
        const container = document.querySelector('[data-element="cancellationPolicy_container"]');
        const policyText = document.querySelector('[data-element="edit_cancellationPolicy_text"]');
        const policyError = document.getElementById('cancellationPolicy-error');
        const policySubText = document.getElementById('cancellationPolicy-subText');

        // Hide error and show subtext initially
        if (policyError) policyError.style.display = 'none';
        if (policySubText) policySubText.style.display = 'block';

        // Get all cancellation policy buttons
        const cancellationPolicies = {
            relaxed: document.querySelector('[data-element="cancellationPolicy_relaxed"]'),
            standard: document.querySelector('[data-element="cancellationPolicy_standard"]'),
            firm: document.querySelector('[data-element="cancellationPolicy_firm"]'),
            graceWindow: document.querySelector('[data-element="cancellationPolicy_graceWindow"]'),
            noRefund: document.querySelector('[data-element="cancellationPolicy_noRefund"]')
        };

        // Store initial state
        let selectedPolicy = '';
        let policyOption = null;
        let strictPolicy = false;
        let strictPolicyOption = null;

        // Apply selected policy from data
        if (data.cancellationPolicy_type) {
            selectedPolicy = data.cancellationPolicy_type;
            policyOption = data.cancellation_policy_option || null;
            strictPolicy = data.strict_cancellation_policy || false;
            strictPolicyOption = data.strict_cancellation_policy_option || null;

            // Update policy text display
            if (policyText) {
                policyText.textContent = selectedPolicy;
            }

            const policyMap = {
                'Relaxed': 'relaxed',
                'Standard': 'standard',
                'Firm': 'firm',
                'Grace window': 'graceWindow',
                'No refund': 'noRefund'
            };

            const policyKey = policyMap[selectedPolicy];
            if (policyKey && cancellationPolicies[policyKey]) {
                cancellationPolicies[policyKey].style.outline = '2px solid black';
                cancellationPolicies[policyKey].style.outlineOffset = '-1px';
            }
        }

        // Store initial state for comparison
        const initialState = {
            policy: selectedPolicy,
            policyOption: policyOption,
            strictPolicy: strictPolicy,
            strictPolicyOption: strictPolicyOption
        };

        // Disable all buttons initially
        Object.values(cancellationPolicies).forEach(button => {
            if (button) {
                button.style.pointerEvents = 'none';
                button.style.cursor = 'default';
            }
        });

        // Add click handler to edit button
        if (editButton) {
            editButton.addEventListener('click', () => {
                // Show save/cancel buttons
                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';
                if (container) {
                    container.style.backgroundColor = '#FFFFFF';
                    container.style.border = '1px solid #e2e2e2';
                }

                // Enable all buttons
                Object.values(cancellationPolicies).forEach(button => {
                    if (button) {
                        button.style.pointerEvents = 'auto';
                        button.style.cursor = 'pointer';
                    }
                });

                // Add click handlers to policy buttons
                Object.entries(cancellationPolicies).forEach(([policy, button]) => {
                    if (button) {
                        button.onclick = () => {
                            // Clear all selections
                            Object.values(cancellationPolicies).forEach(btn => {
                                if (btn) {
                                    btn.style.outline = '';
                                    btn.style.outlineOffset = '';
                                }
                            });

                            // Set new selection
                            button.style.outline = '2px solid black';
                            button.style.outlineOffset = '-1px';

                            // Update selected policy
                            const policyMap = {
                                'relaxed': 'Relaxed',
                                'standard': 'Standard',
                                'firm': 'Firm',
                                'graceWindow': 'Grace window',
                                'noRefund': 'No refund'
                            };
                            selectedPolicy = policyMap[policy];
                        };
                    }
                });

                // Add click handler to cancel button
                if (cancelButton) {
                    cancelButton.onclick = () => {
                        // Reset to initial state
                        Object.values(cancellationPolicies).forEach(button => {
                            if (button) {
                                button.style.outline = '';
                                button.style.outlineOffset = '';
                            }
                        });

                        const policyMap = {
                            'Relaxed': 'relaxed',
                            'Standard': 'standard',
                            'Firm': 'firm',
                            'Grace window': 'graceWindow',
                            'No refund': 'noRefund'
                        };

                        const initialPolicyKey = policyMap[initialState.policy];
                        if (initialPolicyKey && cancellationPolicies[initialPolicyKey]) {
                            cancellationPolicies[initialPolicyKey].style.outline = '2px solid black';
                            cancellationPolicies[initialPolicyKey].style.outlineOffset = '-1px';
                        }

                        // Reset UI
                        editButton.style.display = 'flex';
                        if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                        if (container) {
                            container.style.backgroundColor = '';
                            container.style.border = '';
                        }

                        // Hide error and show subtext
                        if (policyError) policyError.style.display = 'none';
                        if (policySubText) policySubText.style.display = 'block';

                        // Disable all buttons
                        Object.values(cancellationPolicies).forEach(button => {
                            if (button) {
                                button.style.pointerEvents = 'none';
                                button.style.cursor = 'default';
                                button.onclick = null;
                            }
                        });
                    };
                }

                // Add save handler
                if (saveButton) {
                    const saveHandler = async () => {
                        try {
                            // Wait for user ID to be available
                            window.Wized = window.Wized || [];
                            await window.Wized.requests.waitFor('Load_user');
                            const userId = window.Wized.data.r.Load_user.data.id;

                            let policyOption = null;
                            let strictPolicy = false;
                            let strictPolicyOption = null;

                            switch (selectedPolicy) {
                                case "Relaxed":
                                    policyOption = 86400;
                                    break;
                                case "Standard":
                                    policyOption = 432000;
                                    break;
                                case "Firm":
                                    policyOption = 2592000;
                                    break;
                                case "Grace window":
                                    policyOption = null;
                                    strictPolicy = true;
                                    strictPolicyOption = 172800;
                                    break;
                                case "No refund":
                                    policyOption = null;
                                    break;
                            }

                            const requestBody = {
                                property_id: propertyId || null,
                                user_id: userId || null,
                                cancellation_policy: selectedPolicy === "No refund" ? false : true,
                                cancellationPolicy_type: selectedPolicy || null,
                                cancellation_policy_option: policyOption,
                                strict_cancellation_policy: strictPolicy,
                                strict_cancellation_policy_option: strictPolicyOption
                            };

                            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_cancellationPolicy', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requestBody)
                            });

                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            // Update initial state after successful save
                            initialState.policy = selectedPolicy;
                            initialState.policyOption = policyOption;
                            initialState.strictPolicy = strictPolicy;
                            initialState.strictPolicyOption = strictPolicyOption;

                            // Update policy text display after successful save
                            if (policyText) {
                                policyText.textContent = selectedPolicy;
                            }

                            // Reset UI state
                            editButton.style.display = 'flex';
                            if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';
                            if (container) {
                                container.style.backgroundColor = '';
                                container.style.border = '';
                            }

                            // Hide error and show subtext after successful save
                            if (policyError) policyError.style.display = 'none';
                            if (policySubText) policySubText.style.display = 'block';

                            // Disable all buttons
                            Object.values(cancellationPolicies).forEach(button => {
                                if (button) {
                                    button.style.pointerEvents = 'none';
                                    button.style.cursor = 'default';
                                    button.onclick = null;
                                }
                            });

                        } catch (error) {
                            console.error('Error saving cancellation policy:', error);
                            // Show error and hide subtext
                            if (policyError) {
                                policyError.textContent = "Unable to save changes. Please try again later.";
                                policyError.style.display = 'block';
                            }
                            if (policySubText) policySubText.style.display = 'none';
                        }
                    };

                    saveButton.addEventListener('click', saveHandler);
                }
            });
        }
    }

    // Initialize availability section functionality
    function initializeAvailabilitySection(data) {
        const container = document.querySelector('[data-element="availability_container"]');
        const editButton = document.getElementById('editListing_editButton_availability');
        const cancelButton = document.getElementById('editListing_cancelButton_availability');
        const saveButton = document.getElementById('editListing_saveButton_availability');
        const cancelSaveContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_availability');
        const availabilityError = document.getElementById('availability-error');
        const availabilitySubText = document.getElementById('availability-subText');
        const nightStaysText = document.querySelector('[data-element="edit_availability_nightStays"]');
        const advanceNoticeText = document.querySelector('[data-element="edit_availability_advanceText"]');

        const minNightsInput = container.querySelector('[data-element="minimumNights"]');
        const maxNightsInput = container.querySelector('[data-element="maximumNights"]');
        const advanceNoticeInput = container.querySelector('[data-element="advanceNoticeInput"]');

        // Store original background color
        const originalBackgroundColor = container.style.backgroundColor;

        // Store initial state
        const initialState = {
            minNights: data.min_nights || '',
            maxNights: data.max_nights || '',
            advanceNotice: data.advanceNotice || 1
        };

        // Function to update display texts
        const updateDisplayTexts = (min, max, advance) => {
            if (nightStaysText) {
                nightStaysText.textContent = `${min} - ${max} night stay`;
            }
            if (advanceNoticeText) {
                advanceNoticeText.textContent = `${advance} day${advance > 1 ? 's' : ''} advance notice`;
            }
        };

        // Function to format advance notice input
        const formatAdvanceNotice = (value) => {
            const numValue = parseInt(value) || 1;
            return `${numValue} Day${numValue > 1 ? 's' : ''}`;
        };

        // Set initial values and display texts
        if (minNightsInput) minNightsInput.value = initialState.minNights;
        if (maxNightsInput) maxNightsInput.value = initialState.maxNights;
        if (advanceNoticeInput) {
            advanceNoticeInput.value = formatAdvanceNotice(initialState.advanceNotice);
            advanceNoticeInput.disabled = true;
            advanceNoticeInput.style.opacity = '1'; // Keep text opacity at 1 even when disabled
            advanceNoticeInput.style.color = '#000000';
        }

        // Set initial display texts
        updateDisplayTexts(initialState.minNights, initialState.maxNights, initialState.advanceNotice);

        // Initially hide error text
        if (availabilityError) availabilityError.style.display = 'none';

        // Add event listener for advance notice input to handle formatting
        if (advanceNoticeInput) {
            advanceNoticeInput.addEventListener('focus', function () {
                if (!this.disabled) {
                    // Extract just the number when focused
                    const numValue = parseInt(this.value) || 1;
                    this.value = numValue;
                }
            });

            advanceNoticeInput.addEventListener('blur', function () {
                if (!this.disabled) {
                    // Format the value when focus is lost
                    this.value = formatAdvanceNotice(this.value);
                }
            });

            advanceNoticeInput.addEventListener('input', function () {
                // Allow only numbers
                this.value = this.value.replace(/[^0-9]/g, '');


                // Limit to maximum of 99 days
                if (parseInt(this.value) > 99) {
                    this.value = '99';
                }
            });
        }

        // Add event listener for max nights input to limit to 999
        if (maxNightsInput) {
            maxNightsInput.addEventListener('input', function () {
                // Allow only numbers
                this.value = this.value.replace(/[^0-9]/g, '');

                // Limit to maximum of 999 nights
                if (parseInt(this.value) > 999) {
                    this.value = '999';
                }
            });
        }

        if (editButton) {
            editButton.addEventListener('click', () => {
                // Update UI for edit mode
                container.style.backgroundColor = '#FFFFFF';
                container.style.border = '1px solid #E2E2E2';
                editButton.style.display = 'none';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'flex';

                // Show subtext and hide error
                if (availabilityError) availabilityError.style.display = 'none';
                if (availabilitySubText) availabilitySubText.style.display = 'block';

                // Enable inputs
                if (minNightsInput) minNightsInput.disabled = false;
                if (maxNightsInput) maxNightsInput.disabled = false;
                if (advanceNoticeInput) {
                    advanceNoticeInput.disabled = false;
                    // Show just the number for editing
                    const numValue = parseInt(advanceNoticeInput.value) || 1;
                    advanceNoticeInput.value = numValue;
                }
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // Reset UI state
                container.style.backgroundColor = originalBackgroundColor;
                container.style.border = '';
                editButton.style.display = 'flex';
                if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';

                // Reset input values
                if (minNightsInput) {
                    minNightsInput.value = initialState.minNights;
                    minNightsInput.disabled = true;
                }
                if (maxNightsInput) {
                    maxNightsInput.value = initialState.maxNights;
                    maxNightsInput.disabled = true;
                }
                if (advanceNoticeInput) {
                    advanceNoticeInput.value = formatAdvanceNotice(initialState.advanceNotice);
                    advanceNoticeInput.disabled = true;
                }

                // Reset display texts
                updateDisplayTexts(initialState.minNights, initialState.maxNights, initialState.advanceNotice);

                // Hide error and show subtext
                if (availabilityError) availabilityError.style.display = 'none';
                if (availabilitySubText) availabilitySubText.style.display = 'block';
            });
        }

        if (saveButton) {
            const saveHandler = async () => {
                try {
                    const minNights = minNightsInput ? parseInt(minNightsInput.value) : null;
                    const maxNights = maxNightsInput ? parseInt(maxNightsInput.value) : null;

                    // Extract just the number from advance notice input
                    let advanceNotice = 1;
                    if (advanceNoticeInput) {
                        // If in edit mode, the value might be just a number
                        // If not in edit mode, we need to extract the number from "X Days"
                        const value = advanceNoticeInput.value;
                        advanceNotice = parseInt(value) || 1;
                    }

                    // Validate min/max nights
                    if (minNights && maxNights && minNights > maxNights) {
                        if (availabilityError) {
                            availabilityError.textContent = "Minimum nights cannot be greater than maximum nights.";
                            availabilityError.style.display = 'block';
                        }
                        if (availabilitySubText) availabilitySubText.style.display = 'none';
                        return;
                    }

                    // Validate max nights doesn't exceed 999
                    if (maxNights && maxNights > 999) {
                        if (availabilityError) {
                            availabilityError.textContent = "Maximum nights cannot exceed 999 nights.";
                            availabilityError.style.display = 'block';
                        }
                        if (availabilitySubText) availabilitySubText.style.display = 'none';
                        return;
                    }

                    // Wait for user ID to be available
                    window.Wized = window.Wized || [];
                    await window.Wized.requests.waitFor('Load_user');
                    const userId = window.Wized.data.r.Load_user.data.id;

                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_availability', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            property_id: propertyId,
                            user_id: userId,
                            min_nights: minNights,
                            max_nights: maxNights,
                            advanceNotice: advanceNotice
                        })
                    });

                    if (!response.ok) {
                        if (availabilityError) {
                            availabilityError.textContent = "Unable to save changes. Please try again later.";
                            availabilityError.style.display = 'block';
                        }
                        if (availabilitySubText) availabilitySubText.style.display = 'none';
                        throw new Error('Network response was not ok');
                    }

                    // Update initial state
                    initialState.minNights = minNightsInput ? minNightsInput.value : '';
                    initialState.maxNights = maxNightsInput ? maxNightsInput.value : '';
                    initialState.advanceNotice = advanceNotice;

                    // Update display texts after successful save
                    updateDisplayTexts(initialState.minNights, initialState.maxNights, initialState.advanceNotice);

                    // Reset UI state after successful save
                    container.style.backgroundColor = originalBackgroundColor;
                    container.style.border = '';
                    editButton.style.display = 'flex';
                    if (cancelSaveContainer) cancelSaveContainer.style.display = 'none';

                    // Disable inputs and format advance notice
                    if (minNightsInput) minNightsInput.disabled = true;
                    if (maxNightsInput) maxNightsInput.disabled = true;
                    if (advanceNoticeInput) {
                        advanceNoticeInput.value = formatAdvanceNotice(advanceNotice);
                        advanceNoticeInput.disabled = true;
                    }

                    // Hide error and show subtext
                    if (availabilityError) availabilityError.style.display = 'none';
                    if (availabilitySubText) availabilitySubText.style.display = 'block';

                } catch (error) {
                    console.error('Error saving availability:', error);
                    if (availabilityError) {
                        availabilityError.textContent = "Unable to save changes. Please try again later.";
                        availabilityError.style.display = 'block';
                    }
                    if (availabilitySubText) availabilitySubText.style.display = 'none';
                }
            };

            saveButton.addEventListener('click', saveHandler);
        }
    }

    function initializeListingStatusSection(data) {
        let initialListingStatus = null;
        let currentListingStatus = null;
        const listingStatusSection = document.querySelector('[data-element="listingStatus_container"]');
        const listedOption = document.querySelector('[data-element="listingStatus_listed"]');
        const notListedOption = document.querySelector('[data-element="listingStatus_notListed"]');
        const editListingStatusButton = document.getElementById('editListing_editButton_listingStatus');
        const buttonContainer = document.getElementById('editListing_cancelAndSaveButtonContainer_listingStatus');
        const saveListingStatusButton = document.getElementById('editListing_saveButton_listingStatus');
        const cancelListingStatusButton = document.getElementById('editListing_cancelButton_listingStatus');
        const errorElement = document.getElementById('listingStatus-error');
        const editListingStatus = document.querySelector('[data-element="edit_listingStatus"]');
        const editListingStatusDetailsSection = document.querySelector('[data-element="edit_listingStatus_detalsSection"]');
        const editPhotosText = document.querySelector('[data-element="edit_photos_text"]');

        function updateListingStatusText(isActive) {
            if (editPhotosText) {
                editPhotosText.textContent = isActive ? 'Active' : 'Inactive';
            }
        }

        function initializeListingStatus() {
            if (!listingStatusSection || !data) return;

            // Set initial listing status text
            updateListingStatusText(data.is_active);

            // Set background color based on is_active
            if (editListingStatus) {
                editListingStatus.style.backgroundColor = data.is_active ? '' : '#FFE5E5';
            }
            if (editListingStatusDetailsSection) {
                editListingStatusDetailsSection.style.backgroundColor = data.is_active ? '' : '#FFE5E5';
            }

            // Check if host taxes data exists and has at least one entry
            const hasTaxData = data._host_taxes && data._host_taxes.length > 0;
            console.log(hasTaxData);

            // Check if listing is approved by keysBooking
            const isApproved = data.keysBookingApprovedListing === true;
            console.log('Listing approved:', isApproved);

            // Check if there are any blocking issues (independent checks, no hierarchy)
            const canPublish = hasTaxData && isApproved;

            // Set initial state based on whether listing can be published
            if (!canPublish) {
                // Listing cannot be published due to one or more issues
                initialListingStatus = 'not_listed';
                currentListingStatus = 'not_listed';
                notListedOption.style.outline = '2px solid black';
                notListedOption.style.outlineOffset = '-1px';
                editListingStatusButton.style.display = 'none';
                buttonContainer.style.display = 'none';

                // Build error message based on what's missing
                if (errorElement) {
                    let errorMessages = [];

                    if (!hasTaxData) {
                        errorMessages.push("Complete your listing before publishing. Visit <a href='/host/dashboard' style='text-decoration: underline; color: inherit;'>dashboard</a> to view all missing items");
                    }

                    if (!isApproved) {
                        errorMessages.push("Your listing is pending approval. You'll be notified once it's approved and ready to publish");
                    }

                    errorElement.innerHTML = errorMessages.join('<br><br>');
                    errorElement.style.display = 'block';
                }
            } else {
                // Listing can be published
                initialListingStatus = data.is_active ? 'listed' : 'not_listed';
                currentListingStatus = initialListingStatus;

                if (data.is_active) {
                    listedOption.style.outline = '2px solid black';
                    listedOption.style.outlineOffset = '-1px';
                    notListedOption.style.outline = '';
                    notListedOption.style.outlineOffset = '';
                } else {
                    notListedOption.style.outline = '2px solid black';
                    notListedOption.style.outlineOffset = '-1px';
                    listedOption.style.outline = '';
                    listedOption.style.outlineOffset = '';
                }
                buttonContainer.style.display = 'none';

                // Hide error message for complete listing
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }

            // Add event listeners
            editListingStatusButton?.addEventListener('click', () => {
                buttonContainer.style.display = 'flex';
                editListingStatusButton.style.display = 'none';
                listingStatusSection.style.backgroundColor = '#FFFFFF';
            });

            cancelListingStatusButton?.addEventListener('click', () => {
                // Reset everything back to initial state
                buttonContainer.style.display = 'none';
                editListingStatusButton.style.display = 'flex';
                listingStatusSection.style.backgroundColor = '';
                currentListingStatus = initialListingStatus;

                // Reset visual state of options
                listedOption.style.outline = '';
                listedOption.style.outlineOffset = '';
                notListedOption.style.outline = '';
                notListedOption.style.outlineOffset = '';

                if (initialListingStatus === 'listed') {
                    listedOption.style.outline = '2px solid black';
                    listedOption.style.outlineOffset = '-1px';
                } else {
                    notListedOption.style.outline = '2px solid black';
                    notListedOption.style.outlineOffset = '-1px';
                }

                // Hide any error messages
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            });

            listedOption?.addEventListener('click', () => {
                if (!canPublish || buttonContainer.style.display === 'none') return;

                listedOption.style.outline = '2px solid black';
                listedOption.style.outlineOffset = '-1px';
                notListedOption.style.outline = '';
                notListedOption.style.outlineOffset = '';
                currentListingStatus = 'listed';
            });

            notListedOption?.addEventListener('click', () => {
                if (!canPublish || buttonContainer.style.display === 'none') return;

                notListedOption.style.outline = '2px solid black';
                notListedOption.style.outlineOffset = '-1px';
                listedOption.style.outline = '';
                listedOption.style.outlineOffset = '';
                currentListingStatus = 'not_listed';
            });

            saveListingStatusButton?.addEventListener('click', async () => {
                try {
                    // Make API call to update status
                    const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property_listingStatus', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: data.host_user_id,
                            property_id: data.id,
                            is_active: currentListingStatus === 'listed'
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update listing status');
                    }

                    // Update initial state to match new saved state
                    initialListingStatus = currentListingStatus;
                    data.is_active = currentListingStatus === 'listed';

                    // Update listing status text
                    updateListingStatusText(data.is_active);

                    // Update background color based on new is_active state
                    if (editListingStatus) {
                        editListingStatus.style.backgroundColor = data.is_active ? '' : '#FFE5E5';
                    }
                    if (editListingStatusDetailsSection) {
                        editListingStatusDetailsSection.style.backgroundColor = data.is_active ? '' : '#FFE5E5';
                    }

                    // Reset UI
                    buttonContainer.style.display = 'none';
                    editListingStatusButton.style.display = 'flex';
                    listingStatusSection.style.backgroundColor = '';

                    // Hide error message on successful save
                    if (errorElement) {
                        errorElement.style.display = 'none';
                    }



                } catch (error) {
                    console.error('Error updating listing status:', error);
                    if (errorElement) {
                        errorElement.textContent = "Unable to update listing status. Please try again later.";
                        errorElement.style.display = 'block';
                    }
                }
            });
        }

        initializeListingStatus();
    }

    // Fetch property data
    if (propertyId) {
        // Show loader and hide main content container at the beginning of the fetch process
        const loader = document.querySelector('[data-element="loader"]');
        const contentContainer = document.querySelector('[data-element="editListing_bodyContainer"]');

        if (loader) {
            loader.style.display = 'flex';
        }

        if (contentContainer) {
            contentContainer.style.display = 'none';
        }

        // Wait for user ID to be available first
        window.Wized = window.Wized || [];
        window.Wized.push((Wized) => {
            Wized.requests.waitFor('Load_user')
                .then(() => {
                    const userId = Wized.data.r.Load_user.data.id;

                    // Include user_id in the request
                    return fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/edit_property?property_id=${propertyId}&user_id=${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Property Data:', data);

                    const userId = window.Wized.data.r.Load_user.data.id;

                    // Check if user is authorized to edit this property
                    if (data.host_user_id !== userId) {
                        window.location.href = '/host/listings';
                        return;
                    }

                    // Initialize all sections one by one
                    initializePhotosSection(data);
                    initializeBasicsSection(data);
                    initializeCheckInOutSection(data);
                    initializeTitleSection(data);
                    initializeDescriptionSection(data);
                    initializeDockSection(data);
                    initializeAmenitiesSection(data);
                    initializeLocationSection(data);
                    initializeHostSection(data);
                    initializeRulesSection(data);
                    initializeSafetySection(data);
                    initializeCancellationPolicySection(data);
                    initializeDeleteListingSection(data);
                    initializeAvailabilitySection(data);
                    initializeListingStatusSection(data);
                    initializeColorStatusMonitoring(data);

                    // Hide loader and show content container after all sections are initialized
                    if (loader) {
                        loader.style.display = 'none';
                    }
                    if (contentContainer) {
                        contentContainer.style.display = 'flex';
                    }
                })
                .catch(error => {
                    console.error('Error fetching property data:', error);

                    // Hide loader if there's an error
                    if (loader) {
                        loader.style.display = 'none';
                    }

                    // Still show the content container even if there's an error
                    // This way users can see something rather than a blank page
                    if (contentContainer) {
                        contentContainer.style.display = 'flex';
                    }
                });
        });
    }

    // Get elements
    const detailsButton = document.querySelector('[data-element="editListing_details_button"]');
    const preferencesButton = document.querySelector('[data-element="editListing_preferences_button"]');
    const detailsSection = document.querySelector('[data-element="editListing_details_section"]');
    const preferencesSection = document.querySelector('[data-element="editListing_preferences_section"]');

    // Define subsection types at the top level of the DOMContentLoaded callback
    const subsectionTypes = [
        'photos', 'basics', 'checkingInOut', 'title', 'description',
        'dock', 'amenities', 'location', 'host', 'rules', 'safety',
        'cancellationPolicy', 'listingStatus', 'propertyManagementSoftware',
        'deleteListing', 'availability'
    ];

    // Function to hide all subsections and reset their styles
    function hideAllSubsections() {
        subsectionTypes.forEach(type => {
            const section = document.querySelector(`[data-element="edit_${type}_section"]`);
            const button = document.querySelector(`[data-element="edit_${type}"]`);
            const detailsButton = document.querySelector(`[data-element="edit_${type}_detalsSection"]`);

            if (section) {
                section.style.display = 'none';
            }
            if (button) {
                button.style.border = '1px solid #e2e2e2';
                button.style.boxShadow = 'none';
            }
            if (detailsButton) {
                detailsButton.style.border = '1px solid #e2e2e2';
                detailsButton.style.boxShadow = 'none';
            }
        });
    }

    // Function to handle section visibility and button selection
    function switchSection(showDetails) {
        // Handle button selection
        detailsButton.classList.toggle('selected', showDetails);
        preferencesButton.classList.toggle('selected', !showDetails);

        // Handle section visibility
        detailsSection.style.display = showDetails ? 'flex' : 'none';
        preferencesSection.style.display = showDetails ? 'none' : 'flex';

        // Hide all subsections first
        hideAllSubsections();

        // Set default subsection based on which main section is shown
        // Only show default subsection on desktop (width > 991px)
        if (window.innerWidth > 991) {
            if (showDetails) {
                // Show photos section by default when details is selected
                const photosSection = document.querySelector('[data-element="edit_photos_section"]');
                const photosButton = document.querySelector('[data-element="edit_photos"]');
                if (photosSection && photosButton) {
                    photosSection.style.display = 'flex';
                    photosButton.style.border = '1.2px solid black';
                    photosButton.style.boxShadow = '0 1px 20px 0 rgba(0, 0, 0, 0.1)';
                }
            } else {
                // Show listing status section by default when preferences is selected
                const listingStatusSection = document.querySelector('[data-element="edit_listingStatus_section"]');
                const listingStatusButton = document.querySelector('[data-element="edit_listingStatus"]');
                if (listingStatusSection && listingStatusButton) {
                    listingStatusSection.style.display = 'flex';
                    listingStatusButton.style.border = '1.2px solid black';
                    listingStatusButton.style.boxShadow = '0 1px 20px 0 rgba(0, 0, 0, 0.1)';
                }
            }
        }
    }

    // Set default state (details selected) only on desktop
    if (window.innerWidth > 991) {
        switchSection(true);
    } else {
        // On mobile, just set the details button as selected but don't show any subsection
        detailsButton.classList.add('selected');
        preferencesButton.classList.remove('selected');
        detailsSection.style.display = 'flex';
        preferencesSection.style.display = 'none';
    }

    // Add click listeners
    detailsButton.addEventListener('click', () => switchSection(true));
    preferencesButton.addEventListener('click', () => switchSection(false));

    // Function to check if screen is mobile (990px or less)
    function isMobile() {
        return window.innerWidth <= 990;
    }

    // Function to show section container for mobile
    function showSectionContainerMobile() {
        const sectionContainer = document.querySelector('[data-element="editListingSectionContainer"]');
        if (sectionContainer && isMobile()) {
            sectionContainer.style.display = 'flex';
        }
    }

    // Function to hide section container for mobile
    function hideSectionContainerMobile() {
        const sectionContainer = document.querySelector('[data-element="editListingSectionContainer"]');
        if (sectionContainer && isMobile()) {
            sectionContainer.style.display = 'none';
        }
    }

    // Function to handle section opening (works for both desktop and mobile)
    function openSection(type, button, section, detailsButton) {
        hideAllSubsections();
        section.style.display = 'flex';
        button.style.border = '1.2px solid black';
        button.style.boxShadow = '0 1px 20px 0 rgba(0, 0, 0, 0.1)';

        if (detailsButton) {
            detailsButton.style.border = '1.2px solid black';
        }

        // Show section container for mobile
        showSectionContainerMobile();
    }

    // Function to handle section closing (mobile specific)
    function closeSection() {
        hideAllSubsections();
        hideSectionContainerMobile();
    }

    // Add X button click handlers for mobile
    const xButtonElements = [
        'edit_photos_xButton',
        'edit_basicInfo_xButton',
        'edit_checkInAndOut_xButton',
        'edit_availability_xButton',
        'edit_title_xButton',
        'edit_description_xButton',
        'edit_dock_xButton',
        'edit_amenities_xButton',
        'edit_location_xButton',
        'edit_hostInfo_xButton',
        'edit_rules_xButton',
        'edit_safety_xButton',
        'edit_cancellationPolicy_xButton',
        'edit_status_xButton',
        'edit_delete_xButton'
    ];

    xButtonElements.forEach(buttonElement => {
        const xButton = document.querySelector(`[data-element="${buttonElement}"]`);
        if (xButton) {
            xButton.addEventListener('click', closeSection);
        }
    });

    // Function to add/remove modal classes based on screen width
    function updateModalClasses() {
        const isMobileView = window.innerWidth <= 991;

        // Update section buttons with open_modal class
        subsectionTypes.forEach(type => {
            const button = document.querySelector(`[data-element="edit_${type}"]`);
            const detailsButton = document.querySelector(`[data-element="edit_${type}_detalsSection"]`);

            if (button) {
                if (isMobileView) {
                    button.classList.add('open_modal');
                } else {
                    button.classList.remove('open_modal');
                }
            }

            if (detailsButton) {
                if (isMobileView) {
                    detailsButton.classList.add('open_modal');
                } else {
                    detailsButton.classList.remove('open_modal');
                }
            }
        });

        // Update X buttons with close_modal class
        xButtonElements.forEach(buttonElement => {
            const xButton = document.querySelector(`[data-element="${buttonElement}"]`);
            if (xButton) {
                if (isMobileView) {
                    xButton.classList.add('close_modal');
                } else {
                    xButton.classList.remove('close_modal');
                }
            }
        });
    }

    // Initial update of modal classes
    updateModalClasses();

    // Update modal classes on window resize
    window.addEventListener('resize', updateModalClasses);

    // Handle subsection visibility within details section
    subsectionTypes.forEach(type => {
        const button = document.querySelector(`[data-element="edit_${type}"]`);
        const section = document.querySelector(`[data-element="edit_${type}_section"]`);
        const detailsButton = document.querySelector(`[data-element="edit_${type}_detalsSection"]`);

        if (button && section) {
            // Add hover effect (only for desktop)
            button.addEventListener('mouseenter', () => {
                if (!isMobile() && section.style.display !== 'flex') {
                    button.style.boxShadow = '0 1px 20px 0 rgba(0, 0, 0, 0.1)';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (!isMobile() && section.style.display !== 'flex') {
                    button.style.boxShadow = 'none';
                }
            });

            button.addEventListener('click', () => {
                openSection(type, button, section, detailsButton);
            });

            // Add same click handler for details section button if it exists
            if (detailsButton) {
                detailsButton.addEventListener('mouseenter', () => {
                    if (!isMobile() && section.style.display !== 'flex') {
                        detailsButton.style.boxShadow = '0 1px 20px 0 rgba(0, 0, 0, 0.1)';
                    }
                });

                detailsButton.addEventListener('mouseleave', () => {
                    if (!isMobile() && section.style.display !== 'flex') {
                        detailsButton.style.boxShadow = 'none';
                    }
                });

                detailsButton.addEventListener('click', () => {
                    openSection(type, button, section, detailsButton);
                });
            }
        }
    });
});

