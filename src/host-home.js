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



document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {

        await Wized.requests.waitFor('Load_user');
        const userLoadStatus = Wized.data.r.Load_user.status


        document.querySelector('[data-element="addListing_Button"]').addEventListener('click', async function () {
            try {
                if (userLoadStatus === 200) {
                    // If the user is signed in, navigate to /add-home
                    window.location.href = '/add-home';
                } else {
                    // User is not signed in, show signup wrapper
                    const signupWrapper = document.querySelector('[data-element="signin-wrapper"]');
                    if (signupWrapper) {
                        signupWrapper.style.display = 'flex';
                    }
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        });


    });
})
