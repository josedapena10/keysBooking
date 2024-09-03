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















//print receipt
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
            const paymentButton = document.querySelector('[data-element="tripDetail_reservationDetails_payments_button"]');
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








//print trip details
window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
    // Get the current path
    const currentPath = Wized.data.n.path;

    // Check if the current path matches "/trips/details"
    if (currentPath === "/trips/details") {
        // Get the reservation code from the parameters
        const reservationCode = Wized.data.n.parameter.reservation_code;

        // If the reservation code exists, load the trip details page in the background
        if (reservationCode) {
            const iframe = loadPrintDetailsPage(reservationCode);

            // Add event listener to print when the button is clicked
            const printButton = document.querySelector('[data-element="tripDetail_reservationDetails_printDetails_button"]');
            if (printButton) {
                printButton.addEventListener('click', () => {
                    printTripDetailsFromIframe(iframe);
                });
            }
        }
    }
});

function loadPrintDetailsPage(reservationCode) {
    // Create an iframe element
    const iframe = document.createElement('iframe');

    // Set the iframe's source to the trip details page with the reservation code parameter
    iframe.src = `/keys-booking-trip-details?reservation_code=${reservationCode}`;

    // Set the iframe to be hidden
    iframe.style.display = 'none';

    // Append the iframe to the document body to load it in the background
    document.body.appendChild(iframe);

    // Return the iframe element so it can be used later
    return iframe;
}

function printTripDetailsFromIframe(iframe) {
    // Trigger the print dialog from the loaded iframe content
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
}











//Google maps

window.Webflow ||= [];
window.Webflow.push(() => {
    const mapElement = document.querySelector('[fs-element="tripDetails_mapView"]');
    if (!mapElement) {
        return;
    }

    window.onload = () => {
        try {
            let latitude, longitude;
            const apiKey = 'AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ'; // Replace with your actual API key

            const checkDataInterval = setInterval(async () => {
                window.Wized = window.Wized || [];
                window.Wized.push(async (Wized) => {
                    try {
                        latitude = Wized.data.v.latitude;
                        longitude = Wized.data.v.longitude;
                    } catch (error) {
                        console.error("Error retrieving Wized data:", error);
                    }

                    console.log("Marker Position:", { lat: latitude, lng: longitude });

                    if (latitude && longitude) {
                        clearInterval(checkDataInterval); // Stop the interval once data is available

                        const script = document.createElement('script');
                        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
                        script.defer = true;
                        script.async = true;
                        script.onload = () => {
                            const map = new window.google.maps.Map(mapElement, {
                                zoom: 16,
                                center: { lat: latitude, lng: longitude },
                                mapTypeId: 'roadmap',
                                mapTypeControl: false,
                                fullscreenControl: false,
                                zoomControlOptions: {
                                    position: google.maps.ControlPosition.TOP_RIGHT,
                                },
                                streetViewControlOptions: false,
                                // {
                                //     position: google.maps.ControlPosition.TOP_RIGHT,
                                // },
                                scrollwheel: false,
                                styles: [
                                    { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                                    { "featureType": "landscape", "stylers": [{ "color": "#f5f5f5" }] },
                                    { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                                    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c2d2b1" }] },
                                    { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                                    { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                                    { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                                    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#9ecaff" }] },
                                    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f0f0f0" }, { "visibility": "on" }] },
                                ]
                            });



                            const pinSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
                <circle cx="24" cy="24" r="22" fill="#ffffff" filter="drop-shadow(0 0 2px rgba(0,0,0,0.2))"/>
                <g transform="translate(12 10)" stroke-linecap="round" stroke-width="1.5" stroke="#323232" fill="none" stroke-linejoin="round">
                  <path d="M3 11.69l7.93-6.81 0-.01c.61-.53 1.51-.53 2.12 0l7.93 6.8"/>
                  <path d="M20 21V4.5v0c0-.28-.23-.5-.5-.5h-3l-.01 0c-.28 0-.5.22-.5.5 0 0 0 0 0 0v2.6"/>
                  <path d="M9.54 21v-5.5l0 0c-.01-.56.44-1.01.99-1.01h2.9l-.01 0c.55-.01 1 .44 1 .99v5.5"/>
                  <path d="M4.28 10.59v10.4"/>
                  <path d="M21 21L3 21"/>
                </g>
              </svg>`;

                            const marker = new google.maps.Marker({
                                position: { lat: latitude, lng: longitude },
                                map: map,
                                icon: {
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvgString),
                                    scaledSize: new google.maps.Size(48, 48),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(24, 24)
                                },
                                title: 'A marker using a custom SVG image.'
                            });
                        };
                        document.head.appendChild(script);
                    }
                });
            }, 1000); // Check every second
        } catch (error) {
            console.error("Error:", error);
        }
    };
});