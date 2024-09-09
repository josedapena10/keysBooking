import { populateSelectOptions } from "@finsweet/ts-utils";

// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // on .open-modal click
    document.querySelectorAll('.open-modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
        });
    });

    // on .close-modal click
    document.querySelectorAll('.close-modal').forEach(trigger => {
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



window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
    // Get reference to the copyDirections element
    const copyDirections = Wized.elements.get('TripDetails_DirectionsModal_CopyAddress_Button');

    // Check if the element was found
    if (!copyDirections || !copyDirections.node) {
        console.error('Element not found or element.node is undefined.');
        return;
    }

    // Attach event listener to copyDirections element
    copyDirections.node.addEventListener('click', () => {
        const address = getAddress();
        if (!address) {
            console.error('Address is undefined or empty.');
            return;
        }
        copyToClipboard(address);
        alert('Address copied to clipboard!');
    });

    // Example implementation of getAddress and copyToClipboard
    function getAddress() {

        // Function to retrieve the address
        const addressLine1 = Wized.data.r.reservation_confirmation.data[0]._reservation_confirmation_property_info[0].address_line_1;
        const addressLine2 = Wized.data.r.reservation_confirmation.data[0]._reservation_confirmation_property_info[0].address_line_2;
        return `${addressLine1}, ${addressLine2}`;

    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard:', text);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

});






window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
    // Get the current path
    const currentPath = Wized.data.n.path;

    // Check if the current path matches "/user/reservation" or "/trips/details"
    if (currentPath === "/user/reservation" || currentPath === "/trips/details") {
        // Get the reservation code from the parameters
        const reservationCode = Wized.data.n.parameter.reservation_code;

        // If the reservation code exists, load the receipt page in the background
        if (reservationCode) {
            const iframe = loadReceiptPage(reservationCode);

            // Add event listener to print when the button is clicked
            const paymentButton = document.querySelector('[data-element="ReservationConfirmation_PrintPaymentReceipt"]');
            if (paymentButton) {
                paymentButton.addEventListener('click', () => {
                    printReceiptFromIframe(iframe);
                });
            }
        }
    }
});

function loadReceiptPage(reservationCode) {
    // Create an iframe element
    const iframe = document.createElement('iframe');

    // Set the iframe's source to the receipt page with the reservation code parameter
    iframe.src = `/keys-booking-receipt?reservation_code=${reservationCode}`;

    // Set the iframe to be hidden
    iframe.style.display = 'none';

    // Append the iframe to the document body to load it in the background
    document.body.appendChild(iframe);

    // Return the iframe element so it can be used later
    return iframe;
}

function printReceiptFromIframe(iframe) {
    // Trigger the print dialog from the loaded iframe content
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
}
