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




// Require sign-in: force the Login-Modal open for signed-out users and block any dismissal
(function () {
    const LOGIN_MODAL_SELECTOR = '[data-element="LoginModal"]';

    const hasSessionToken = (Wized) => {
        const t = Wized && Wized.data && Wized.data.c && Wized.data.c.token;
        return t != null && String(t).trim() !== '';
    };

    const forceOpen = (loginModal) => {
        loginModal.style.setProperty('display', 'flex', 'important');
        document.body.classList.add('no-scroll');
    };

    const lockLoginModal = (loginModal) => {
        forceOpen(loginModal);

        // Re-assert flex if anything (Webflow interactions, close buttons, etc.) tries to hide it
        const observer = new MutationObserver(() => {
            if (loginModal.style.display !== 'flex') {
                forceOpen(loginModal);
            } else {
                document.body.classList.add('no-scroll');
            }
        });
        observer.observe(loginModal, { attributes: true, attributeFilter: ['style', 'class'] });

        // Neutralize close triggers inside the modal so there's no way to reach the page
        loginModal.querySelectorAll('.close_modal').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                forceOpen(loginModal);
            }, true);
        });
    };

    const whenModalReady = (cb) => {
        const existing = document.querySelector(LOGIN_MODAL_SELECTOR);
        if (existing) return cb(existing);

        const start = Date.now();
        const interval = setInterval(() => {
            const el = document.querySelector(LOGIN_MODAL_SELECTOR);
            if (el) {
                clearInterval(interval);
                cb(el);
            } else if (Date.now() - start > 10000) {
                clearInterval(interval);
            }
        }, 100);
    };

    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
        if (!hasSessionToken(Wized)) {
            whenModalReady(lockLoginModal);
        }
    });
})();





//Function to copy text to clipboard
const copyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};

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

        // // Function to copy text to clipboard
        // const copyToClipboard = (text) => {
        //     const textarea = document.createElement('textarea');
        //     textarea.value = text;
        //     document.body.appendChild(textarea);
        //     textarea.select();
        //     document.execCommand('copy');
        //     document.body.removeChild(textarea);
        // };

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




        const copyChangeReservationSubject = Wized.elements.get('TripDetails_ChangeReservationModal_CopySubjectLine');

        // Function to retrieve the address
        const getSubjectLine = () => {
            return "Change Reservation - " + Wized.data.r.trip_details.data.reservation_code;
        };


        // Attach event listener to copyDirections element
        copyChangeReservationSubject.node.addEventListener('click', () => {
            const address = getSubjectLine();
            copyToClipboard(address);
            alert('Subject line copied!');
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









// Google maps — stay + boat/charter pickup locations
window.Webflow ||= [];
window.Webflow.push(() => {
    const MAP_SELECTORS = {
        desktop: '[fs-element="tripDetails_mapView"]',
        mobile: '[fs-element="tripDetails_mapView_mobile"]',
    };

    const getMapElements = () => {
        const elements = [];
        const seen = new Set();

        const addElements = (nodeList, variant) => {
            nodeList.forEach((el) => {
                if (seen.has(el)) {
                    return;
                }
                seen.add(el);
                el.__tripDetailsMapVariant = variant;
                elements.push(el);
            });
        };

        addElements(document.querySelectorAll(MAP_SELECTORS.desktop), 'desktop');
        addElements(document.querySelectorAll(MAP_SELECTORS.mobile), 'mobile');
        return elements;
    };

    const mapElements = getMapElements();
    if (!mapElements.length) {
        return;
    }

    const API_KEY = 'AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ';
    const MAP_STYLES = [
        { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c2d2b1' }] },
        { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#9ecaff' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }, { visibility: 'on' }] },
    ];
    const PIN_EMOJIS = {
        stay: '🏠',
        boat: '🚤',
        charter: '🎣',
    };
    const PIN_SIZE = 44;
    const PIN_GAP = 3;
    const MARKER_Z_INDEX = { stay: 10, boat: 20, charter: 30 };
    const CLOSE_PIN_SPREAD_M = 40;
    const LABEL_SHOW_MS = 4000;
    const SAME_LOCATION_EPS = 0.00003;
    const emojiIconCache = new Map();

    let mapsLoadPromise = null;
    let mapsApi = null;
    let lastRenderKey = null;

    const isMapElementVisible = (mapElement) => {
        const rect = mapElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }
        const style = window.getComputedStyle(mapElement);
        return style.display !== 'none' && style.visibility !== 'hidden';
    };

    const scheduleMapRenderWhenVisible = (mapElement, pins, api) => {
        if (mapElement.__tripDetailsMapRenderObserver) {
            return;
        }

        const tryRender = () => {
            if (!isMapElementVisible(mapElement)) {
                return;
            }
            renderMapOnElement(mapElement, pins, api);
            if (mapElement.__tripDetailsMapRenderObserver) {
                mapElement.__tripDetailsMapRenderObserver.disconnect();
                mapElement.__tripDetailsMapRenderObserver = null;
            }
        };

        const observer = new ResizeObserver(() => tryRender());
        observer.observe(mapElement);

        let parent = mapElement.parentElement;
        let depth = 0;
        while (parent && depth < 6) {
            observer.observe(parent);
            parent = parent.parentElement;
            depth += 1;
        }

        mapElement.__tripDetailsMapRenderObserver = observer;
        tryRender();
    };

    const toCoordinate = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    const toCoordinatePair = (lat, lng) => {
        const parsedLat = toCoordinate(lat);
        const parsedLng = toCoordinate(lng);
        if (parsedLat === null || parsedLng === null) {
            return null;
        }
        return { lat: parsedLat, lng: parsedLng };
    };

    const normalizeCity = (value) => String(value ?? '').trim().toLowerCase();

    const getBoatCompany = (boatPI) => {
        return boatPI?._boat?.__boatcompany
            || boatPI?._boat?._boat_company
            || null;
    };

    const getPublicDockForCity = (boatCompany, listingCity) => {
        const details = boatCompany?.publicDockDeliveryDetails;
        if (!listingCity || !Array.isArray(details)) {
            return null;
        }
        const target = normalizeCity(listingCity);
        return details.find((dock) => normalizeCity(dock?.city) === target) || null;
    };

    const isExtraCancelled = (extra) => {
        if (!extra || extra.reservation_notAvailable === true) {
            return true;
        }
        if (extra.reservation_active === false) {
            return extra.cancellation_date != null || extra.host_cancellation_date != null;
        }
        return false;
    };

    const getCharterEntries = (trip) => {
        const charterPI = trip?._fishingcharters_paymentintent
            || trip?._fishingcharters_paymentsmade
            || null;
        const charters = charterPI?.fishingCharters
            || trip?.fishingCharters
            || trip?.fishingcharters
            || [];
        return Array.isArray(charters) ? charters.filter((entry) => !isExtraCancelled(entry)) : [];
    };

    const getTripOptionName = (entry) => {
        const options = entry?._fishingcharter?.tripOptions;
        if (!Array.isArray(options)) {
            return '';
        }
        const tripOption = options.find((opt) => String(opt?.id) === String(entry?.tripId));
        return tripOption?.name || tripOption?.tripLabel || '';
    };

    const loadGoogleMaps = () => {
        if (mapsApi) {
            return Promise.resolve(mapsApi);
        }
        if (mapsLoadPromise) {
            return mapsLoadPromise;
        }

        mapsLoadPromise = (async () => {
            const waitForImportLibrary = () => new Promise((resolve, reject) => {
                const start = Date.now();
                const tick = () => {
                    if (window.google?.maps?.importLibrary) {
                        resolve();
                        return;
                    }
                    if (Date.now() - start > 15000) {
                        reject(new Error('Google Maps importLibrary timed out'));
                        return;
                    }
                    setTimeout(tick, 50);
                };
                tick();
            });

            const waitForLegacyApi = () => new Promise((resolve, reject) => {
                const start = Date.now();
                const tick = () => {
                    if (typeof window.google?.maps?.Map === 'function'
                        && typeof window.google?.maps?.Geocoder === 'function') {
                        resolve();
                        return;
                    }
                    if (Date.now() - start > 15000) {
                        reject(new Error('Google Maps legacy API timed out'));
                        return;
                    }
                    setTimeout(tick, 50);
                };
                tick();
            });

            if (!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async`;
                    script.async = true;
                    script.defer = true;
                    script.onload = () => resolve();
                    script.onerror = (error) => reject(error);
                    document.head.appendChild(script);
                });
            }

            if (window.google?.maps?.importLibrary) {
                await waitForImportLibrary();
                const mapsLib = await google.maps.importLibrary('maps');
                const geocodingLib = await google.maps.importLibrary('geocoding');
                mapsApi = {
                    Map: mapsLib.Map,
                    Marker: mapsLib.Marker,
                    InfoWindow: mapsLib.InfoWindow,
                    LatLngBounds: mapsLib.LatLngBounds,
                    Size: mapsLib.Size,
                    Point: mapsLib.Point,
                    Geocoder: geocodingLib.Geocoder,
                    event: google.maps.event,
                    ControlPosition: google.maps.ControlPosition,
                };
            } else {
                await waitForLegacyApi();
                mapsApi = {
                    Map: google.maps.Map,
                    Marker: google.maps.Marker,
                    InfoWindow: google.maps.InfoWindow,
                    LatLngBounds: google.maps.LatLngBounds,
                    Size: google.maps.Size,
                    Point: google.maps.Point,
                    Geocoder: google.maps.Geocoder,
                    event: google.maps.event,
                    ControlPosition: google.maps.ControlPosition,
                };
            }

            return mapsApi;
        })().catch((error) => {
            mapsLoadPromise = null;
            throw error;
        });

        return mapsLoadPromise;
    };

    const geocodeAddress = (geocoder, address, cache) => {
        const normalized = String(address || '').trim();
        if (!normalized) {
            return Promise.resolve(null);
        }
        if (cache.has(normalized)) {
            return Promise.resolve(cache.get(normalized));
        }
        return new Promise((resolve) => {
            geocoder.geocode({ address: normalized }, (results, status) => {
                let coords = null;
                if (status === 'OK' && results?.[0]) {
                    const loc = results[0].geometry.location;
                    coords = { lat: loc.lat(), lng: loc.lng() };
                }
                cache.set(normalized, coords);
                resolve(coords);
            });
        });
    };

    const resolveLocation = async (geocoder, cache, { lat, lng, address }) => {
        const fromCoords = toCoordinatePair(lat, lng);
        if (fromCoords) {
            return fromCoords;
        }
        return geocodeAddress(geocoder, address, cache);
    };

    const getStayPinLabel = (property) => {
        return (property?.property_name || property?.listing_title || property?.title || '').trim() || 'Your stay';
    };

    const getBoatPinLabel = (boatPI) => {
        const boatName = (boatPI?._boat?.name || '').trim();
        if (boatName) {
            return boatName;
        }
        const companyName = (getBoatCompany(boatPI)?.name || '').trim();
        return companyName || 'Boat rental';
    };

    const getCharterPinLabel = (entry) => {
        const tripName = (entry?.tripLabel || getTripOptionName(entry) || '').trim();
        if (tripName) {
            return tripName;
        }
        const charterName = (entry?._fishingcharter?.name || entry?._fishingcharter?.companyName || '').trim();
        return charterName || 'Charter trip';
    };

    const getBoatPinTitle = (boatPI, hasPublicDock) => {
        if (boatPI?.boatPrivateDock === true) {
            return 'Boat pickup · Private dock';
        }
        if (hasPublicDock) {
            return 'Boat pickup · Public dock';
        }
        const companyName = getBoatCompany(boatPI)?.name;
        return companyName ? `Boat pickup · ${companyName}` : 'Boat pickup';
    };

    const getCharterPinTitle = (entry, charterCount) => {
        const tripName = entry?.tripLabel || getTripOptionName(entry);
        if (entry?.pickup === true) {
            if (charterCount > 1 && tripName) {
                return `${tripName} · Private dock pickup`;
            }
            return 'Charter pickup · Private dock';
        }
        if (charterCount > 1 && tripName) {
            return `${tripName} · Charter pickup`;
        }
        const charterName = entry?._fishingcharter?.name || entry?._fishingcharter?.companyName;
        return charterName ? `Charter pickup · ${charterName}` : 'Charter pickup';
    };

    const toRadians = (deg) => deg * (Math.PI / 180);

    const pinDistanceDeg = (a, b, cosLat) => {
        const dLat = b.lat - a.lat;
        const dLng = (b.lng - a.lng) * cosLat;
        return Math.sqrt((dLat * dLat) + (dLng * dLng));
    };

    const clusterPins = (pins) => {
        const parent = pins.map((_, index) => index);
        const find = (index) => {
            let current = index;
            while (parent[current] !== current) {
                parent[current] = parent[parent[current]];
                current = parent[current];
            }
            return current;
        };
        const union = (left, right) => {
            parent[find(left)] = find(right);
        };

        for (let i = 0; i < pins.length; i++) {
            for (let j = i + 1; j < pins.length; j++) {
                const cosLat = Math.cos(toRadians((pins[i].lat + pins[j].lat) / 2));
                if (pinDistanceDeg(pins[i], pins[j], cosLat) <= SAME_LOCATION_EPS) {
                    union(i, j);
                }
            }
        }

        const clusters = new Map();
        pins.forEach((pin, index) => {
            const root = find(index);
            if (!clusters.has(root)) {
                clusters.set(root, []);
            }
            clusters.get(root).push(pin);
        });
        return [...clusters.values()];
    };

    const groupPinsForDisplay = (pins) => {
        return clusterPins(pins).map((cluster) => {
            const centerLat = cluster.reduce((sum, pin) => sum + pin.lat, 0) / cluster.length;
            const centerLng = cluster.reduce((sum, pin) => sum + pin.lng, 0) / cluster.length;
            const stayPin = cluster.find((pin) => pin.type === 'stay');
            const anchor = stayPin
                ? { lat: stayPin.lat, lng: stayPin.lng }
                : { lat: centerLat, lng: centerLng };

            const pinOrder = { stay: 0, boat: 1, charter: 2 };
            const sortedPins = [...cluster].sort((a, b) => {
                const orderDiff = (pinOrder[a.type] ?? 3) - (pinOrder[b.type] ?? 3);
                if (orderDiff !== 0) {
                    return orderDiff;
                }
                return String(a.id).localeCompare(String(b.id));
            });

            return { anchor, pins: sortedPins };
        });
    };

    const escapeHtml = (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    const isTouchDevice = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

    const isInteractiveElement = (el) => {
        if (!el) {
            return false;
        }
        const tag = el.tagName;
        if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(tag)) {
            return true;
        }
        if (el.isContentEditable) {
            return true;
        }
        if (el.getAttribute('role') === 'button' || el.getAttribute('tabindex') != null) {
            return true;
        }
        return Boolean(el.closest('a, button, input, select, textarea, [role="button"]'));
    };

    const prepareMapContainer = (mapElement) => {
        mapElement.style.position = mapElement.style.position || 'relative';
        mapElement.style.overflow = 'hidden';

        Array.from(mapElement.children).forEach((child) => {
            if (child.classList.contains('gm-style') || child.classList.contains('gm-style-mtc')) {
                return;
            }
            child.style.pointerEvents = 'none';
            child.style.display = 'none';
        });
    };

    const fixMapPointerBlockers = (mapElement) => {
        const rect = mapElement.getBoundingClientRect();
        const parent = mapElement.parentElement;
        if (parent) {
            Array.from(parent.children).forEach((sibling) => {
                if (sibling === mapElement || isInteractiveElement(sibling)) {
                    return;
                }
                const siblingRect = sibling.getBoundingClientRect();
                if (siblingRect.width <= 0 || siblingRect.height <= 0) {
                    return;
                }
                const overlaps = !(
                    siblingRect.right < rect.left
                    || siblingRect.left > rect.right
                    || siblingRect.bottom < rect.top
                    || siblingRect.top > rect.bottom
                );
                if (!overlaps) {
                    return;
                }
                const overlapWidth = Math.min(siblingRect.right, rect.right) - Math.max(siblingRect.left, rect.left);
                const overlapHeight = Math.min(siblingRect.bottom, rect.bottom) - Math.max(siblingRect.top, rect.top);
                const overlapArea = overlapWidth * overlapHeight;
                const mapArea = rect.width * rect.height;
                if (mapArea <= 0 || overlapArea / mapArea < 0.25) {
                    return;
                }
                sibling.style.pointerEvents = 'none';
            });
        }
    };

    const ensureMapInteractionReady = (mapElement, map, api) => {
        const rect = mapElement.getBoundingClientRect();

        mapElement.style.pointerEvents = 'auto';
        mapElement.style.position = mapElement.style.position || 'relative';
        mapElement.style.zIndex = '20';
        mapElement.style.isolation = 'isolate';
        mapElement.style.touchAction = isTouchDevice() ? 'none' : 'manipulation';

        if (rect.height > 0) {
            mapElement.style.minHeight = `${Math.round(rect.height)}px`;
        }
        mapElement.style.width = '100%';

        const mapDiv = map.getDiv?.();
        if (mapDiv) {
            mapDiv.style.pointerEvents = 'auto';
            mapDiv.style.touchAction = isTouchDevice() ? 'none' : 'manipulation';
            mapDiv.style.height = '100%';
            mapDiv.style.width = '100%';
        }

        mapElement.querySelectorAll('.gm-style').forEach((gmStyle) => {
            gmStyle.style.pointerEvents = 'auto';
            gmStyle.style.touchAction = isTouchDevice() ? 'none' : 'manipulation';
            gmStyle.style.height = '100%';
            gmStyle.style.width = '100%';
        });

        map.setOptions({
            draggable: true,
            gestureHandling: 'greedy',
            scrollwheel: !isTouchDevice(),
            zoomControl: true,
            disableDoubleClickZoom: false,
        });

        fixMapPointerBlockers(mapElement);
        api.event.trigger(map, 'resize');
    };

    const drawEmojiPin = (ctx, x, y, emoji) => {
        const center = x + (PIN_SIZE / 2);
        const middle = y + (PIN_SIZE / 2);
        const radius = (PIN_SIZE / 2) - 3;

        ctx.beginPath();
        ctx.arc(center, middle + 1, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(center, middle, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(PIN_SIZE * 0.5)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, center, middle + 1);
    };

    const makeEmojiIcon = (type) => {
        const emoji = PIN_EMOJIS[type] || PIN_EMOJIS.stay;
        const cacheKey = `single:${emoji}`;
        if (emojiIconCache.has(cacheKey)) {
            return emojiIconCache.get(cacheKey);
        }

        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = PIN_SIZE * scale;
        canvas.height = PIN_SIZE * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        drawEmojiPin(ctx, 0, 0, emoji);

        const icon = {
            url: canvas.toDataURL(),
            scaledSize: new mapsApi.Size(PIN_SIZE, PIN_SIZE),
            origin: new mapsApi.Point(0, 0),
            anchor: new mapsApi.Point(PIN_SIZE / 2, PIN_SIZE / 2),
        };
        emojiIconCache.set(cacheKey, icon);
        return icon;
    };

    const makeCombinedEmojiIcon = (pins) => {
        const cacheKey = `combined:${pins.map((pin) => pin.type).join(',')}`;
        if (emojiIconCache.has(cacheKey)) {
            return emojiIconCache.get(cacheKey);
        }

        const width = (pins.length * PIN_SIZE) + ((pins.length - 1) * PIN_GAP);
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = PIN_SIZE * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        pins.forEach((pin, index) => {
            const x = index * (PIN_SIZE + PIN_GAP);
            drawEmojiPin(ctx, x, 0, PIN_EMOJIS[pin.type] || PIN_EMOJIS.stay);
        });

        const icon = {
            url: canvas.toDataURL(),
            scaledSize: new mapsApi.Size(width, PIN_SIZE),
            origin: new mapsApi.Point(0, 0),
            anchor: new mapsApi.Point(width / 2, PIN_SIZE / 2),
        };
        emojiIconCache.set(cacheKey, icon);
        return icon;
    };

    const getMapInitOptions = (api, center) => {
        return {
            zoom: 16,
            maxZoom: 16,
            center,
            mapTypeId: 'roadmap',
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: api.ControlPosition.TOP_RIGHT,
            },
            streetViewControl: false,
            scrollwheel: !isTouchDevice(),
            gestureHandling: 'greedy',
            draggable: true,
            styles: MAP_STYLES,
        };
    };

    const spreadClosePinGroups = (pinGroups) => {
        if (pinGroups.length < 2) {
            return pinGroups;
        }

        const spread = pinGroups.map((group) => ({
            anchor: { lat: group.anchor.lat, lng: group.anchor.lng },
            pins: group.pins,
        }));

        for (let i = 0; i < spread.length; i++) {
            for (let j = i + 1; j < spread.length; j++) {
                const dist = metersBetween(spread[i].anchor, spread[j].anchor);
                if (dist >= CLOSE_PIN_SPREAD_M) {
                    continue;
                }

                const pushMeters = ((CLOSE_PIN_SPREAD_M - dist) / 2) + 8;
                const midLat = (spread[i].anchor.lat + spread[j].anchor.lat) / 2;
                const angle = Math.atan2(
                    spread[j].anchor.lng - spread[i].anchor.lng,
                    spread[j].anchor.lat - spread[i].anchor.lat
                );
                const latStep = (pushMeters / 111320) * Math.cos(angle);
                const lngStep = (pushMeters / (111320 * Math.cos(toRadians(midLat)))) * Math.sin(angle);

                spread[i].anchor.lat -= latStep;
                spread[i].anchor.lng -= lngStep;
                spread[j].anchor.lat += latStep;
                spread[j].anchor.lng += lngStep;
            }
        }

        return spread;
    };

    const getMarkerZIndex = (group) => {
        if (group.pins.length === 1) {
            return MARKER_Z_INDEX[group.pins[0].type] ?? 15;
        }
        return Math.max(...group.pins.map((pin) => MARKER_Z_INDEX[pin.type] ?? 15));
    };

    const metersBetween = (a, b) => {
        const earthRadius = 6371000;
        const dLat = toRadians(b.lat - a.lat);
        const dLng = toRadians(b.lng - a.lng);
        const lat1 = toRadians(a.lat);
        const lat2 = toRadians(b.lat);
        const haversine = (Math.sin(dLat / 2) ** 2)
            + (Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2));
        return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
    };

    const getTouchHitRadiusMeters = (map, lat) => {
        const zoom = map.getZoom() || 16;
        const metersPerPixel = 156543.03392 * Math.cos(toRadians(lat)) / (2 ** zoom);
        return metersPerPixel * ((PIN_SIZE / 2) + 8);
    };

    const getLatLngFromClientPoint = (map, clientX, clientY) => {
        const projection = map.getProjection?.();
        const bounds = map.getBounds?.();
        const mapDiv = map.getDiv?.();
        if (!projection || !bounds || !mapDiv) {
            return null;
        }

        const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
        const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
        const rect = mapDiv.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return null;
        }

        const relX = (clientX - rect.left) / rect.width;
        const relY = (clientY - rect.top) / rect.height;
        const point = new mapsApi.Point(
            bottomLeft.x + (relX * (topRight.x - bottomLeft.x)),
            topRight.y + (relY * (bottomLeft.y - topRight.y))
        );
        const latLng = projection.fromPointToLatLng(point);
        return latLng ? { lat: latLng.lat(), lng: latLng.lng() } : null;
    };

    const findNearestMarkerEntry = (map, entries, clickPoint) => {
        if (!clickPoint || !entries.length) {
            return null;
        }

        const click = clickPoint.lat != null
            ? clickPoint
            : { lat: clickPoint.lat(), lng: clickPoint.lng() };
        const hitRadius = getTouchHitRadiusMeters(map, click.lat);
        let best = null;
        let bestDistance = Infinity;

        entries.forEach((entry) => {
            const position = entry.marker.getPosition?.();
            if (!position) {
                return;
            }
            const distance = metersBetween(click, { lat: position.lat(), lng: position.lng() });
            if (distance > hitRadius) {
                return;
            }
            const zIndex = entry.marker.getZIndex?.() ?? 0;
            const bestZIndex = best?.marker.getZIndex?.() ?? 0;
            if (distance < bestDistance - 0.5 || (Math.abs(distance - bestDistance) <= 0.5 && zIndex > bestZIndex)) {
                bestDistance = distance;
                best = entry;
            }
        });

        return best;
    };

    const createMapMarker = (api, map, group) => {
        const title = group.pins.map((pin) => pin.label || pin.title).join(' · ');
        const icon = group.pins.length === 1
            ? makeEmojiIcon(group.pins[0].type)
            : makeCombinedEmojiIcon(group.pins);
        return new api.Marker({
            position: group.anchor,
            map,
            icon,
            optimized: false,
            clickable: true,
            zIndex: getMarkerZIndex(group),
            title,
        });
    };

    const removeMarkerFromMap = (marker) => {
        if (marker.map != null) {
            marker.map = null;
            return;
        }
        marker.setMap?.(null);
    };

    const getPinLabelHtml = (pins) => {
        if (pins.length === 1) {
            return escapeHtml(pins[0].label || pins[0].title || '');
        }
        return pins.map((pin) => escapeHtml(pin.label || pin.title || '')).join('<br>');
    };

    const injectMapLabelStyles = () => {
        if (document.getElementById('trip-details-map-label-styles-v3')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'trip-details-map-label-styles-v3';
        style.textContent = `
            .trip-details-map-iw.gm-style-iw-c {
                padding: 0 !important;
                border-radius: 999px !important;
                border: none !important;
                outline: none !important;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12) !important;
            }
            .trip-details-map-iw.gm-style-iw-c:focus,
            .trip-details-map-iw.gm-style-iw-c:focus-visible,
            .trip-details-map-iw .gm-style-iw-d:focus,
            .trip-details-map-iw .gm-style-iw-d:focus-visible {
                outline: none !important;
                border: none !important;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12) !important;
            }
            .trip-details-map-iw.gm-style-iw-c .gm-style-iw-d {
                overflow: visible !important;
                border: none !important;
                outline: none !important;
            }
            .trip-details-map-iw.gm-style-iw-c .gm-style-iw-chr,
            .trip-details-map-iw.gm-style-iw-c button.gm-ui-hover-effect {
                display: none !important;
            }
            .trip-details-map-label {
                display: flex;
                align-items: center;
                box-sizing: border-box;
                padding: 8px 14px;
                font-family: 'TT Fors', sans-serif;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.35;
                color: #202020;
                border: none;
                outline: none;
            }
            .trip-details-map-label--with-close {
                gap: 10px;
                padding: 8px 10px 8px 14px;
            }
            .trip-details-map-label-text {
                flex: 1;
                min-width: 0;
                outline: none;
            }
            .trip-details-map-label-close {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                margin: 0;
                padding: 0;
                border: none;
                border-radius: 50%;
                background: transparent;
                color: #676767;
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                outline: none;
                box-shadow: none;
                -webkit-tap-highlight-color: transparent;
            }
            .trip-details-map-label-close:hover {
                background: rgba(0, 0, 0, 0.06);
                color: #202020;
            }
            .trip-details-map-label-close:focus,
            .trip-details-map-label-close:focus-visible {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
            }
            [fs-element="tripDetails_mapView"] .gm-style div[role="button"],
            [fs-element="tripDetails_mapView_mobile"] .gm-style div[role="button"] {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
            }
            [fs-element="tripDetails_mapView"] .gm-style div[role="button"]:focus,
            [fs-element="tripDetails_mapView"] .gm-style div[role="button"]:focus-visible,
            [fs-element="tripDetails_mapView_mobile"] .gm-style div[role="button"]:focus,
            [fs-element="tripDetails_mapView_mobile"] .gm-style div[role="button"]:focus-visible {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    };

    const getMapInfoWindow = (map) => {
        if (!map.__tripDetailsInfoWindow) {
            map.__tripDetailsInfoWindow = new mapsApi.InfoWindow({
                disableAutoPan: true,
                maxWidth: 320,
            });
            map.__tripDetailsInfoWindowCloseTimer = null;
            map.__tripDetailsLabelSeq = 0;
            map.__tripDetailsActiveMarker = null;
            map.__tripDetailsActiveLabelEl = null;
        }
        return map.__tripDetailsInfoWindow;
    };

    const clearPinLabelState = (map) => {
        map.__tripDetailsActiveMarker = null;
        map.__tripDetailsActiveLabelEl = null;
        if (map.__tripDetailsInfoWindowCloseTimer) {
            clearTimeout(map.__tripDetailsInfoWindowCloseTimer);
            map.__tripDetailsInfoWindowCloseTimer = null;
        }
    };

    const setPinLabelAutoClose = (map, infoWindow, autoCloseMs) => {
        if (map.__tripDetailsInfoWindowCloseTimer) {
            clearTimeout(map.__tripDetailsInfoWindowCloseTimer);
            map.__tripDetailsInfoWindowCloseTimer = null;
        }
        if (!autoCloseMs) {
            return;
        }
        map.__tripDetailsInfoWindowCloseTimer = setTimeout(() => {
            clearPinLabelState(map);
            infoWindow.close();
        }, autoCloseMs);
    };

    const wireCloseButton = (map, infoWindow, closeBtn) => {
        if (!closeBtn || closeBtn.__tripDetailsWired) {
            return;
        }
        closeBtn.__tripDetailsWired = true;
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            clearPinLabelState(map);
            infoWindow.close();
        });
    };

    const addCloseButtonToLabel = (map, infoWindow, labelEl) => {
        if (!labelEl) {
            return;
        }
        labelEl.classList.add('trip-details-map-label--with-close');
        let closeBtn = labelEl.querySelector('.trip-details-map-label-close');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'trip-details-map-label-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '&times;';
            labelEl.appendChild(closeBtn);
        }
        wireCloseButton(map, infoWindow, closeBtn);
    };

    const isPinLabelOpenForMarker = (map, marker, infoWindow) => {
        return map.__tripDetailsActiveMarker === marker
            && map.__tripDetailsActiveLabelEl
            && infoWindow.getMap() != null;
    };

    const showPinLabel = (map, marker, pins, autoCloseMs = null, showCloseButton = false) => {
        injectMapLabelStyles();
        const infoWindow = getMapInfoWindow(map);

        if (isPinLabelOpenForMarker(map, marker, infoWindow)) {
            if (showCloseButton) {
                addCloseButtonToLabel(map, infoWindow, map.__tripDetailsActiveLabelEl);
            }
            setPinLabelAutoClose(map, infoWindow, autoCloseMs);
            return;
        }

        clearPinLabelState(map);

        map.__tripDetailsLabelSeq += 1;
        const labelId = `trip-details-map-label-${map.__tripDetailsLabelSeq}`;
        const labelClass = showCloseButton
            ? 'trip-details-map-label trip-details-map-label--with-close'
            : 'trip-details-map-label';
        const closeHtml = showCloseButton
            ? '<button type="button" class="trip-details-map-label-close" aria-label="Close">&times;</button>'
            : '';
        infoWindow.setContent(
            `<div id="${labelId}" class="${labelClass}">` +
            `<span class="trip-details-map-label-text">${getPinLabelHtml(pins)}</span>` +
            closeHtml +
            '</div>'
        );

        mapsApi.event.addListenerOnce(infoWindow, 'domready', () => {
            const labelEl = document.getElementById(labelId);
            if (!labelEl) {
                return;
            }
            map.__tripDetailsActiveMarker = marker;
            map.__tripDetailsActiveLabelEl = labelEl;
            labelEl.closest('.gm-style-iw-c')?.classList.add('trip-details-map-iw');
            wireCloseButton(map, infoWindow, labelEl.querySelector('.trip-details-map-label-close'));
        });

        infoWindow.open({ map, anchor: marker });
        setPinLabelAutoClose(map, infoWindow, autoCloseMs);
    };

    const attachMarkerInteractions = (map, marker, pins) => {
        if (isTouchDevice()) {
            return;
        }

        marker.addListener('click', () => {
            showPinLabel(map, marker, pins, LABEL_SHOW_MS, true);
        });
        marker.addListener('mouseover', () => {
            showPinLabel(map, marker, pins);
        });
        marker.addListener('mouseout', () => {
            const infoWindow = getMapInfoWindow(map);
            if (!map.__tripDetailsInfoWindowCloseTimer) {
                clearPinLabelState(map);
                infoWindow.close();
            }
        });
    };

    const bindTouchMarkerSelection = (map, mapElement) => {
        if (mapElement.__tripDetailsTouchSelectionBound) {
            return;
        }
        mapElement.__tripDetailsTouchSelectionBound = true;

        const mapDiv = map.getDiv?.();
        if (!mapDiv) {
            return;
        }

        let touchStart = null;

        mapDiv.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) {
                touchStart = null;
                return;
            }
            const touch = event.touches[0];
            touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        }, { passive: true });

        mapDiv.addEventListener('touchend', (event) => {
            if (!touchStart || event.changedTouches.length !== 1) {
                touchStart = null;
                return;
            }

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStart.x;
            const deltaY = touch.clientY - touchStart.y;
            const elapsed = Date.now() - touchStart.time;
            touchStart = null;

            if (elapsed > 450 || Math.hypot(deltaX, deltaY) > 14) {
                return;
            }

            const tapPoint = getLatLngFromClientPoint(map, touch.clientX, touch.clientY);
            if (!tapPoint) {
                return;
            }

            const hit = findNearestMarkerEntry(map, mapElement.__tripDetailsMarkerEntries || [], tapPoint);
            if (!hit) {
                return;
            }

            showPinLabel(map, hit.marker, hit.pins, LABEL_SHOW_MS, true);
        }, { passive: true });
    };

    const clearMapLayers = (mapElement) => {
        if (mapElement.__tripDetailsMapMarkers) {
            mapElement.__tripDetailsMapMarkers.forEach((marker) => removeMarkerFromMap(marker));
        }
        mapElement.__tripDetailsMapMarkers = [];
        mapElement.__tripDetailsMarkerEntries = [];
    };

    const buildMapPins = async (trip, wizedVars, api) => {
        const property = trip?._property || {};
        const stayCoords = toCoordinatePair(
            property.latitude ?? wizedVars?.latitude,
            property.longitude ?? wizedVars?.longitude
        );

        if (!stayCoords) {
            return [];
        }

        const pins = [{
            id: 'stay',
            type: 'stay',
            lat: stayCoords.lat,
            lng: stayCoords.lng,
            title: 'Your stay',
            label: getStayPinLabel(property),
        }];

        const geocoder = new api.Geocoder();
        const geocodeCache = new Map();
        const listingCity = property.listing_city || '';

        const boatPI = trip?._boat_paymentintent || trip?._boat_paymentsmade || null;
        if (trip?.hasBoatRental && boatPI && !isExtraCancelled(boatPI)) {
            let boatCoords = null;
            let hasPublicDock = false;

            if (boatPI.boatPrivateDock === true) {
                boatCoords = { ...stayCoords };
            } else {
                const boatCompany = getBoatCompany(boatPI);
                const publicDock = getPublicDockForCity(boatCompany, listingCity);
                if (publicDock) {
                    hasPublicDock = true;
                    boatCoords = await resolveLocation(geocoder, geocodeCache, {
                        lat: publicDock.latitude ?? publicDock.lat,
                        lng: publicDock.longitude ?? publicDock.lng,
                        address: publicDock.address,
                    });
                } else {
                    const companyAddress = (boatCompany?.address || boatPI?._boat?.address || '').trim();
                    boatCoords = await resolveLocation(geocoder, geocodeCache, {
                        lat: boatCompany?.latitude ?? boatCompany?.lat,
                        lng: boatCompany?.longitude ?? boatCompany?.lng,
                        address: companyAddress,
                    });
                }
            }

            if (boatCoords) {
                pins.push({
                    id: 'boat',
                    type: 'boat',
                    lat: boatCoords.lat,
                    lng: boatCoords.lng,
                    title: getBoatPinTitle(boatPI, hasPublicDock),
                    label: getBoatPinLabel(boatPI),
                });
            }
        }

        const charterEntries = getCharterEntries(trip);
        for (let i = 0; i < charterEntries.length; i++) {
            const entry = charterEntries[i];
            let charterCoords = null;

            if (entry.pickup === true) {
                charterCoords = { ...stayCoords };
            } else {
                const charter = entry._fishingcharter || {};
                charterCoords = await resolveLocation(geocoder, geocodeCache, {
                    lat: charter.latitude ?? charter.lat,
                    lng: charter.longitude ?? charter.lng,
                    address: charter.address,
                });
            }

            if (charterCoords) {
                pins.push({
                    id: `charter-${entry.charterId || i}-${entry.tripId || i}`,
                    type: 'charter',
                    lat: charterCoords.lat,
                    lng: charterCoords.lng,
                    title: getCharterPinTitle(entry, charterEntries.length),
                    label: getCharterPinLabel(entry),
                });
            }
        }

        return pins;
    };

    const renderMapOnElement = (mapElement, pins, api) => {
        if (!pins.length) {
            return;
        }

        if (!api) {
            return;
        }

        if (!isMapElementVisible(mapElement)) {
            scheduleMapRenderWhenVisible(mapElement, pins, api);
            return;
        }

        const pinGroups = spreadClosePinGroups(groupPinsForDisplay(pins));

        const center = { lat: pinGroups[0].anchor.lat, lng: pinGroups[0].anchor.lng };
        prepareMapContainer(mapElement);

        let map = mapElement.__tripDetailsMapInstance;
        if (!map) {
            map = new api.Map(mapElement, getMapInitOptions(api, center));
            mapElement.__tripDetailsMapInstance = map;
            mapElement.__tripDetailsMapMarkers = [];
        } else {
            map.setOptions({
                zoomControl: true,
                scrollwheel: !isTouchDevice(),
                gestureHandling: 'greedy',
                draggable: true,
                maxZoom: 16,
            });
            clearMapLayers(mapElement);
            api.event.trigger(map, 'resize');
        }

        const bounds = new api.LatLngBounds();
        mapElement.__tripDetailsMarkerEntries = [];
        pinGroups.forEach((group) => {
            bounds.extend(group.anchor);
            const marker = createMapMarker(api, map, group);
            const entry = { marker, pins: group.pins };
            mapElement.__tripDetailsMarkerEntries.push(entry);
            attachMarkerInteractions(map, marker, group.pins);
            mapElement.__tripDetailsMapMarkers.push(marker);
        });
        bindTouchMarkerSelection(map, mapElement);

        if (pinGroups.length === 1 && pinGroups[0].pins.length === 1) {
            map.setCenter(center);
            map.setZoom(16);
        } else {
            map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
        }

        api.event.trigger(map, 'resize');
        ensureMapInteractionReady(mapElement, map, api);
    };

    const getRenderKey = (trip, wizedVars) => {
        const charters = getCharterEntries(trip);
        return JSON.stringify({
            code: trip?.reservation_code || '',
            lat: trip?._property?.latitude ?? wizedVars?.latitude,
            lng: trip?._property?.longitude ?? wizedVars?.longitude,
            propertyName: trip?._property?.property_name || '',
            hasBoat: Boolean(trip?.hasBoatRental),
            boatPrivateDock: trip?._boat_paymentintent?.boatPrivateDock ?? trip?._boat_paymentsmade?.boatPrivateDock,
            boatName: trip?._boat_paymentintent?._boat?.name || trip?._boat_paymentsmade?._boat?.name || '',
            charters: charters.map((entry) => ({
                charterId: entry.charterId,
                tripId: entry.tripId,
                pickup: entry.pickup,
                tripLabel: entry.tripLabel || '',
            })),
        });
    };

    const renderTripDetailsMap = async (trip, wizedVars) => {
        if (!trip) {
            return;
        }

        const renderKey = getRenderKey(trip, wizedVars);
        if (renderKey === lastRenderKey) {
            return;
        }

        try {
            const api = await loadGoogleMaps();
            const pins = await buildMapPins(trip, wizedVars, api);
            if (!pins.length) {
                return;
            }

            lastRenderKey = renderKey;
            mapElements.forEach((mapElement) => {
                renderMapOnElement(mapElement, pins, api);
            });
        } catch (error) {
            console.error('[tripDetailsMap]', error);
        }
    };

    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
        Wized.on('requestend', (event) => {
            if (event.name !== 'trip_details') {
                return;
            }
            renderTripDetailsMap(event.data, Wized.data?.v);
        });

        const existingTrip = Wized.data?.r?.trip_details?.data;
        if (existingTrip) {
            renderTripDetailsMap(existingTrip, Wized.data?.v);
        }
    });
});





// Listen for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Wized
    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
        // Map to track Splide instances

        Wized.on('requestend', (event) => {
            if (event.name === 'trip_details') {

                // Retrieve the properties and sliders
                var propertyPhotos = event.data._property._propertypictures; // Adjust this based on your actual data structure


                // Select all elements that should be Splide sliders
                var splide = document.querySelector('.splide');


                // Initialize Splide for this slider
                var slider = new Splide(splide, {
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
                    const dots = splide.querySelectorAll('.splide__pagination__page');

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

                propertyPhotos.forEach((photoUrl) => {
                    var li = document.createElement('li');
                    li.classList.add('splide__slide');
                    li.innerHTML = `<img src="${photoUrl.property_image.url}" alt="Property Photo">`;
                    slider.add(li);
                });

                var prevArrow = splide.querySelector('.splide__arrow--prev');
                var nextArrow = splide.querySelector('.splide__arrow--next');

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
                var arrowIcons = splide.querySelectorAll('.splide__arrow svg');
                arrowIcons.forEach((icon) => {
                    icon.style.width = '16px'; // Set a fixed size for the icon
                    icon.style.height = '16px'; // Adjust as needed
                });

                // Refresh the slider after adding slides
                slider.refresh();

            }
        });
    });
});
