// // for no scroll background when modal is open
// // when DOM is ready
// document.addEventListener('DOMContentLoaded', () => {
//     // on .open-modal click
//     document.querySelectorAll('.open-modal').forEach(trigger => {
//         trigger.addEventListener('click', function () {
//             // on every click
//             document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
//         });
//     });

//     // on .close-modal click
//     document.querySelectorAll('.close-modal').forEach(trigger => {
//         trigger.addEventListener('click', function () {
//             // on every click
//             document.querySelectorAll('body').forEach(target => target.classList.remove('no-scroll'));
//         });
//     });
// });

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

        await Wized.requests.waitFor('reservation_confirmation');

        const copyDirections = Wized.elements.get('TripDetails_DirectionsModal_CopyAddress_Button');

        // Function to retrieve the address
        const getAddress = () => {
            const addressLine1 = Wized.data.r.reservation_confirmation.data[0]._reservation_confirmation_property_info[0].address_line_1;
            const addressLine2 = Wized.data.r.reservation_confirmation.data[0]._reservation_confirmation_property_info[0].address_line_2;
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

    });
});







// Print receipt
window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
    // Get the current path
    const currentPath = Wized.data.n.path;

    // Check if the current path matches "/user/reservation" or "/trips/details"
    if (currentPath === "/user/reservation" || currentPath === "/trips/details") {
        // Get the reservation code from the parameters
        const reservationCode = Wized.data.n.parameter.reservation_code;

        // If the reservation code exists, set up print functionality
        if (reservationCode) {
            const receiptUrl = `/keys-booking-receipt?reservation_code=${reservationCode}`;

            // Only preload iframe on desktop (mobile will open new window)
            let iframe = null;
            if (!isMobileDevice()) {
                iframe = loadReceiptPage(receiptUrl);
            }

            // Add event listeners to all buttons with the matching data-element
            const paymentButtons = document.querySelectorAll('[data-element="tripDetail_reservationDetails_payments_button"]');
            paymentButtons.forEach(paymentButton => {
                paymentButton.addEventListener('click', () => {
                    printReceipt(receiptUrl, iframe);
                });
            });
        }
    }
});

// Detect if user is on a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}

function loadReceiptPage(receiptUrl) {
    // Create an iframe element
    const iframe = document.createElement('iframe');

    // Set the iframe's source to the receipt page
    iframe.src = receiptUrl;

    // Set the iframe to be hidden
    iframe.style.display = 'none';

    // Append the iframe to the document body to load it in the background
    document.body.appendChild(iframe);

    // Return the iframe element so it can be used later
    return iframe;
}

function printReceipt(receiptUrl, iframe) {
    if (isMobileDevice()) {
        // On mobile, open receipt in new tab and trigger print after delay
        // Mobile browsers don't support iframe printing - they print the parent page
        const printWindow = window.open(receiptUrl, '_blank');
        if (printWindow) {
            // Wait for page to fully load before printing
            setTimeout(() => {
                printWindow.print();
            }, 1500);
        }
    } else {
        // On desktop, use the preloaded iframe
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    }
}
