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


window.Wized = window.Wized || [];
window.Wized.push((async (Wized) => {
    try {
        await window.Wized.requests.waitFor('Load_Host_Properties');
        await window.Wized.requests.waitFor('Load_Host_Properties_inProgress');

        console.log('Requests completed successfully');

        const hostProperties = window.Wized.data.r.Load_Host_Properties.data;
        const hostPropertiesInProgress = window.Wized.data.r.Load_Host_Properties_inProgress.data;

        console.log('Host properties data:', hostProperties);
        console.log('Host properties in progress data:', hostPropertiesInProgress);

        const hostPropertiesSection = document.querySelector('[data-element="hostListing_section"]');
        const hostPropertiesInProgressSection = document.querySelector('[data-element="hostListing_section_inProgress"]');

        console.log('Host properties section element:', hostPropertiesSection);
        console.log('Host properties in progress section element:', hostPropertiesInProgressSection);

        const calendarNavItem = document.querySelector('[data-element="hostDashboardNavBar_Calendar"]');

        if (hostPropertiesInProgressSection) {
            if (hostPropertiesInProgress.length > 0) {
                hostPropertiesInProgressSection.style.display = 'flex';
            } else {
                hostPropertiesInProgressSection.style.display = 'none';
            }
        } else {
            console.error('Could not find element with data-element="hostListing_section_inProgress"');
        }

        if (hostPropertiesSection) {
            if (hostProperties.length > 0) {
                hostPropertiesSection.style.display = 'flex';
            } else {
                hostPropertiesSection.style.display = 'none';
                // Hide calendar nav item if host_editListings is null

                calendarNavItem.style.display = 'none';

            }
        } else {
            console.error('Could not find element with data-element="hostListing_section"');
        }
    } catch (error) {
        console.error('Error in host listings script:', error);
    }
}));













