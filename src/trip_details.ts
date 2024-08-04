// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);
console.log("Leah 1")



// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("leah")
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
        console.error('Error:', err.message);
    }
})();




document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {

        const copyDirections = Wized.elements.get('TripDetails_DirectionsModal_CopyAddress_Button');
        const copyAddressButton = Wized.elements.get('tripDetail_gettingThereSection_copyAddress_button');

        // Function to retrieve the address
        const getAddress = () => {
            const addressLine1 = Wized.data.r.trip_details.data._property.address_line_1;
            const addressLine2 = Wized.data.r.trip_details.data._property.address_line_2;
            return `${addressLine1}, ${addressLine2}`;
        };

        // Function to copy text to clipboard
        const copyToClipboard = (text) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        };

        // Attach event listener to copyDirections element
        copyDirections.node.addEventListener('click', () => {
            const address = getAddress();
            copyToClipboard(address);
            alert('Address copied to clipboard!');
        });

        // Attach event listener to copyAddressButton element
        copyAddressButton.node.addEventListener('click', () => {
            const address = getAddress();
            copyToClipboard(address);
            alert('Address copied to clipboard!');
        });

    });
});


document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {

        const copyDirections = Wized.elements.get('TripDetails_DirectionsModal_CopyAddress_Button');
        const copyAddressButton = Wized.elements.get('tripDetail_gettingThereSection_copyAddress_button');
        const printButton = Wized.elements.get('tripDetail_reservationDetails_printDetails_button');

        // Function to retrieve the address
        const getAddress = () => {
            const addressLine1 = Wized.data.r.trip_details.data._property.address_line_1;
            const addressLine2 = Wized.data.r.trip_details.data._property.address_line_2;
            return `${addressLine1}, ${addressLine2}`;
        };

        // Function to copy text to clipboard
        const copyToClipboard = (text) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        };

        // Attach event listener to copyDirections element
        copyDirections.node.addEventListener('click', () => {
            const address = getAddress();
            copyToClipboard(address);
            alert('Address copied to clipboard!');
        });

        // Attach event listener to copyAddressButton element
        copyAddressButton.node.addEventListener('click', () => {
            const address = getAddress();
            copyToClipboard(address);
            alert('Address copied to clipboard!');
        });

        // Attach event listener to printButton element
        printButton.node.addEventListener('click', () => {
            window.print();
        });

    });
});
