// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// Global utility function to truncate text to fit within parent container
// Uses CSS text-overflow: ellipsis for reliable truncation across desktop/mobile views
// Used by both BoatRentalService and FishingCharterService across different code sections
function truncateToFit(element) {
  if (!element) return;

  // Apply CSS-based truncation styles
  // This works regardless of visibility and handles view switching automatically
  element.style.whiteSpace = "nowrap";
  element.style.overflow = "hidden";
  element.style.textOverflow = "ellipsis";
  element.style.display = "block";
  element.style.maxWidth = "100%";
}

// Page loader management - keep loader visible until all content is ready
(function initPageLoader() {
  const loadingTracker = {
    propertyDetailsLoaded: false,
    calendarQueryLoaded: false,
    reservationLogicInitialized: false
  };



  // Function to check if all critical content is loaded
  function checkAllContentLoaded() {

    const allLoaded = loadingTracker.propertyDetailsLoaded &&
      loadingTracker.calendarQueryLoaded &&
      loadingTracker.reservationLogicInitialized;

    if (allLoaded) {
      hideLoader();
    } else {
    }
  }

  // Function to hide the loader
  function hideLoader() {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader && loader.style.display !== 'none') {
      // Add fade out effect
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 300);
    } else {
    }
  }

  // Make loader visible on page load
  window.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
      loader.style.display = 'flex';
      loader.style.opacity = '1';
    } else {
    }
  });

  // Track when Wized requests complete
  window.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {

      Wized.on('requestend', (event) => {

        if (event.name === 'Load_Property_Details') {
          loadingTracker.propertyDetailsLoaded = true;
          checkAllContentLoaded();
        }
        if (event.name === 'Load_Property_Calendar_Query') {
          loadingTracker.calendarQueryLoaded = true;
          checkAllContentLoaded();
        }
      });

      // Wait for Property Details first (required)
      Wized.requests.waitFor('Load_Property_Details')
        .then(() => {

          // Check if dates are in URL (calendar query might be needed)
          const urlParams = new URLSearchParams(window.location.search);
          const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== '';
          const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== '';

          if (hasCheckin && hasCheckout) {
            // Wait for calendar query with a 3-second timeout
            Promise.race([
              Wized.requests.waitFor('Load_Property_Calendar_Query'),
              new Promise((resolve) => setTimeout(() => {
                resolve();
              }, 3000))
            ]).then(() => {
              if (!loadingTracker.calendarQueryLoaded) {
                loadingTracker.calendarQueryLoaded = true;
              }
              loadingTracker.reservationLogicInitialized = true;
              checkAllContentLoaded();
            });
          } else {
            loadingTracker.calendarQueryLoaded = true;
            loadingTracker.reservationLogicInitialized = true;
            checkAllContentLoaded();
          }
        })
        .catch(() => {
        });
    });
  });

  // Track when images are loaded
  window.trackImagesLoaded = function () {
    const splideElement = document.querySelector('.splide');
    if (!splideElement) {
      checkAllContentLoaded();
      return;
    }

    // Wait for first 5 header images to load
    const images = splideElement.querySelectorAll('img');
    const firstFiveImages = Array.from(images).slice(0, 5);

    if (firstFiveImages.length === 0) {
      checkAllContentLoaded();
      return;
    }

    let loadedCount = 0;
    const totalToLoad = Math.min(firstFiveImages.length, 5);

    firstFiveImages.forEach((img, index) => {
      if (img.complete && img.naturalHeight !== 0) {
        loadedCount++;
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount >= totalToLoad) {
            checkAllContentLoaded();
          }
        });
        img.addEventListener('error', () => {
          loadedCount++;
          if (loadedCount >= totalToLoad) {
            checkAllContentLoaded();
          }
        });
      }
    });

    if (loadedCount >= totalToLoad) {
      checkAllContentLoaded();
    }


  };

  // Fallback: Ensure loader is hidden after maximum wait time
  setTimeout(() => {
    hideLoader();
  }, 10000);
})();

// Add calendar styling
(function addCalendarStyles() {
  const calendarStyles = document.createElement('style');
  calendarStyles.textContent = `
    .lightpick__month-title {
      font-family: 'TT Fors', sans-serif;
      font-weight: 500;
    }
    .lightpick__day-of-the-week {
      font-family: 'TT Fors', sans-serif;
      font-weight: 500;
    }
    .lightpick__days {
      font-family: 'TT Fors', sans-serif;
      font-weight: 500;
    }
  `;
  document.head.appendChild(calendarStyles);
})();

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

  // Add no-scroll for calendarModal triggers on mobile (991px or less)
  const calendarTriggers = document.querySelectorAll(
    '[data-element="listing_checkAvailability_button"], ' +
    '[data-element="listing_changeDates_button"], ' +
    '[data-element="Listing_Reservaton_AddDates_Heading"], ' +
    '[data-element="Input_CheckIn"], ' +
    '[data-element="Input_CheckOut"]'
  );

  calendarTriggers.forEach(trigger => {
    trigger.addEventListener('click', function () {
      if (window.innerWidth <= 991) {
        document.body.classList.add('no-scroll');
      }
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
    try {
      const requestName = 'Load_Property_Details'; // Ensure this matches the actual request name
      await Wized.requests.waitFor(requestName);


      let counters = {
        adults: parseInt(Wized.data.n.parameter.adults) || 1,
        children: parseInt(Wized.data.n.parameter.children) || 0,
        infants: parseInt(Wized.data.n.parameter.infants) || 0,
        pets: parseInt(Wized.data.n.parameter.pets) || 0
      };

      let max_guests = Wized.data.v.max_guests;
      let max_infants = 5;
      let max_pets = 2;
      let pet_policy = Wized.data.v.pets_allowed; // Retrieve pet policy

      // Add guest count display elements
      let guestCountDisplays = {
        adults: document.querySelectorAll('[data-element="ReservationGuest_AdultNumber"]'),
        children: document.querySelectorAll('[data-element="ReservationGuest_ChildrenNumber"]'),
        infants: document.querySelectorAll('[data-element="ReservationGuest_InfantNumber"]'),
        pets: document.querySelectorAll('[data-element="ReservationGuest_PetNumber"]')
      };

      // Updated to avoid overwriting the keys
      let plusButtons = {
        adultsDesktop: document.querySelector('#plus-button'),
        childrenDesktop: document.querySelector('#plus-button1'),
        infantsDesktop: document.querySelector('#plus-button2'),
        petsDesktop: document.querySelector('#plus-button3'),
        adultsPhone: document.querySelector('#plus-buttonPhone'),
        childrenPhone: document.querySelector('#plus-button1Phone'),
        infantsPhone: document.querySelector('#plus-button2Phone'),
        petsPhone: document.querySelector('#plus-button3Phone')
      };

      let minusButtons = {
        adultsDesktop: document.querySelector('#minus-button1'),
        childrenDesktop: document.querySelector('#minus-button2'),
        infantsDesktop: document.querySelector('#minus-button3'),
        petsDesktop: document.querySelector('#minus-button4'),
        adultsPhone: document.querySelector('#minus-button1Phone'),
        childrenPhone: document.querySelector('#minus-button2Phone'),
        infantsPhone: document.querySelector('#minus-button3Phone'),
        petsPhone: document.querySelector('#minus-button4Phone')
      };

      setupSVGButtons();
      updateAllButtonStates();
      updateGuestsParameter();

      if (!pet_policy) {
        disablePetButtons(); // Disable pet buttons if pets are not allowed
      }

      // Add event listeners for both desktop and phone buttons
      Object.keys(plusButtons).forEach(type => {
        plusButtons[type].addEventListener('click', () => handleIncrement(type));
      });

      Object.keys(minusButtons).forEach(type => {
        minusButtons[type].addEventListener('click', () => handleDecrement(type));
      });

      function handleIncrement(type) {
        const counterType = getCounterType(type); // Get base counter type (adults, children, infants, pets)
        if (counterType === 'adults' || counterType === 'children') {
          if (counters.adults + counters.children < max_guests) {
            incrementCounter(counterType);
          }
        } else if (counterType === 'infants' && counters.infants < max_infants) {
          incrementCounter(counterType);
        } else if (counterType === 'pets' && counters.pets < max_pets && pet_policy) {
          incrementCounter(counterType);
        }
      }

      function handleDecrement(type) {
        const counterType = getCounterType(type); // Get base counter type (adults, children, infants, pets)
        if (counterType === 'adults' && counters[counterType] > 1 || counterType !== 'adults' && counters[counterType] > 0) {
          decrementCounter(counterType);
        }
      }

      function getCounterType(type) {
        // Get base counter type for any button (removes "Desktop" or "Phone" suffix)
        return type.replace('Desktop', '').replace('Phone', '');
      }

      function incrementCounter(type) {
        counters[type]++;
        updateCounterInDataStore(type);
        if (type === 'adults' || type === 'children') {
          updateGuestsParameter();
        }
      }

      function decrementCounter(type) {
        counters[type]--;
        updateCounterInDataStore(type);
        if (type === 'adults' || type === 'children') {
          updateGuestsParameter();
        }
      }

      function updateCounterInDataStore(type) {
        Wized.data.n.parameter[type] = counters[type];
        updateURLParameter(type, counters[type]);
        updateAllButtonStates();
        updateGuestCountDisplays();
      }

      function updateGuestsParameter() {
        const totalGuests = counters.adults + counters.children;
        Wized.data.n.parameter.guests = totalGuests;
        updateURLParameter('guests', totalGuests);
        updateGuestCountDisplays();

        // Immediately update validation to clear/show errors as soon as guest count changes
        setTimeout(() => {
          if (window.updateAvailabilityStatus) {
            window.updateAvailabilityStatus();
          }
        }, 10);
      }

      function updateURLParameter(type, value) {
        let url = new URL(window.location);
        url.searchParams.set(type, value);
        history.pushState(null, "", url);
      }

      function updateAllButtonStates() {
        Object.keys(counters).forEach(type => {
          const maxCondition = type === 'adults' || type === 'children' ? counters.adults + counters.children >= max_guests :
            type === 'infants' ? counters.infants >= max_infants :
              counters.pets >= max_pets;
          Object.keys(plusButtons).forEach(buttonType => {
            if (getCounterType(buttonType) === type) {
              plusButtons[buttonType].style.opacity = maxCondition ? '0.3' : '1';
            }
          });

          const minCondition = type === 'adults' ? counters[type] <= 1 : counters[type] <= 0;
          Object.keys(minusButtons).forEach(buttonType => {
            if (getCounterType(buttonType) === type) {
              minusButtons[buttonType].style.opacity = minCondition ? '0.3' : '1';
            }
          });
        });

        // Ensure pet buttons remain disabled and at reduced opacity if pets are not allowed
        if (!pet_policy) {
          disablePetButtons();
        }
      }

      function disablePetButtons() {
        plusButtons.petsDesktop.disabled = true;
        minusButtons.petsDesktop.disabled = true;
        plusButtons.petsPhone.disabled = true;
        minusButtons.petsPhone.disabled = true;
        plusButtons.petsDesktop.style.opacity = '0.3';  // Ensure opacity remains reduced
        minusButtons.petsDesktop.style.opacity = '0.3'; // Ensure opacity remains reduced
        plusButtons.petsPhone.style.opacity = '0.3';    // Ensure opacity remains reduced
        minusButtons.petsPhone.style.opacity = '0.3';   // Ensure opacity remains reduced
      }

      function setupSVGButtons() {
        const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
        const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';
        Object.values(plusButtons).forEach(button => button.innerHTML = svgPlus);
        Object.values(minusButtons).forEach(button => button.innerHTML = svgMinus);
      }

      function initializeURLParameters() {
        // Check if any guest parameters were missing from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const missingParams = !urlParams.has('adults') || !urlParams.has('children') ||
          !urlParams.has('infants') || !urlParams.has('pets') || !urlParams.has('guests');

        if (missingParams) {
          // Initialize all guest parameters in the URL
          updateURLParameter('adults', counters.adults);
          updateURLParameter('children', counters.children);
          updateURLParameter('infants', counters.infants);
          updateURLParameter('pets', counters.pets);
          updateURLParameter('guests', counters.adults + counters.children);
        }

        // Update displayed guest counts regardless of URL parameters
        updateGuestCountDisplays();
      }

      // Add new function to update guest count displays
      function updateGuestCountDisplays() {
        // Update all guest count displays with the current counter values
        Object.keys(counters).forEach(type => {
          if (guestCountDisplays[type]) {
            guestCountDisplays[type].forEach(element => {
              if (element) {
                element.textContent = counters[type];
              }
            });
          }
        });
      }

      // Call initializeURLParameters after counters are set up
      initializeURLParameters();

    } catch (error) {

    }

























    //signup formatting below here
    //signup formatting below here
    //signup formatting below here






    const passwordInput = Wized.elements.get('SignUp_Password');
    const emailInput = Wized.elements.get('SignUp_Email');
    const firstNameInput = Wized.elements.get('SignUp_FirstName');
    const lastNameInput = Wized.elements.get('SignUp_LastName');
    const phoneNumberInput = Wized.elements.get('SignUp_PhoneNumber');
    //const birthdateInput = Wized.elements.get('SignUp_BirthDate');























    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    // Event listener for when the user leaves the first name input field
    firstNameInput.node.addEventListener('blur', (event) => {
      const inputElement = event.target;
      inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

    // Event listener for when the user leaves the last name input field
    lastNameInput.node.addEventListener('blur', (event) => {
      const inputElement = event.target;
      inputElement.value = capitalizeFirstLetter(inputElement.value);
    });

















    phoneNumberInput.node.addEventListener('focus', (event) => {
      const inputElement = event.target;
      if (inputElement.value === '') {
        inputElement.value = '';  // Clear the field when focused if empty
      }
    });

    phoneNumberInput.node.addEventListener('input', handlePhoneNumberInput);
    phoneNumberInput.node.addEventListener('keydown', handlePhoneKeyDown);
    phoneNumberInput.node.addEventListener('change', handlePhoneNumberInput);

    function handlePhoneNumberInput(event) {
      const inputElement = event.target;
      let input = inputElement.value.replace(/[\D-]/g, ''); // Strip non-numeric characters and hyphens
      if (input.length > 10) {
        input = input.substr(0, 10); // Limit to 10 digits
      }

      // Formatting the phone number as the user types
      let formattedNumber = formatPhoneNumber(input);
      inputElement.value = formattedNumber; // Update the field with formatted input
    }

    function handlePhoneKeyDown(event) {
      const key = event.key;
      const inputElement = event.target;

      // Allow control keys such as backspace, tab, enter, etc.
      if (key.length === 1 && !/[0-9]/.test(key)) {
        event.preventDefault(); // Prevent default action for non-numeric keys
      }

      // Prevent input if the current length of digits is 10 or more
      const currentInput = inputElement.value.replace(/[\D-]/g, '');
      if (currentInput.length >= 10 && /[0-9]/.test(key)) {
        event.preventDefault();
      }
    }

    function formatPhoneNumber(input) {
      let formattedNumber = input;
      if (input.length > 2) {
        formattedNumber = input.substr(0, 3) + (input.length > 3 ? '-' : '') + input.substr(3);
      }
      if (input.length > 5) {
        formattedNumber = input.substr(0, 3) + '-' + input.substr(3, 3) + (input.length > 6 ? '-' : '') + input.substr(6);
      }
      return formattedNumber;
    }

























    // // Event listener for focusing on the input field
    // birthdateInput.node.addEventListener('focus', (event) => {
    //     const inputElement = event.target;
    //     if (!inputElement.value.trim()) {
    //         inputElement.value = 'mm/dd/yyyy'; // Set initial placeholder text
    //         highlightText(inputElement, 0, 2); // Highlight 'mm' initially
    //     }
    // });

    // // Function to highlight text within the input
    // function highlightText(inputElement, start, end) {
    //     setTimeout(() => {
    //         inputElement.setSelectionRange(start, end);
    //     }, 10);
    // }

















    const charactersMin = document.querySelector('#charactersMin');
    const containsSymbol = document.querySelector('#containsSymbol');
    const cantContain = document.querySelector('#cantContain');

    // Function to return the SVG with specified fill color and symbol type
    function getSVG(fillColor, isValid = false) {
      if (isValid) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <path d="M4.5 8L6.5 10L10.5 5" stroke="white" stroke-width="2" fill="none"/>
                    </svg>`;
      } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                        <circle cx="7.5" cy="7.5" r="7.5" fill="${fillColor}"/>
                        <line x1="5" y1="5" x2="10" y2="10" stroke="white" stroke-width="2"/>
                        <line x1="5" y2="5" x2="10" y1="10" stroke="white" stroke-width="2"/>
                    </svg>`;
      }
    }

    // Initialize SVGs with default grey color
    function initializeSVGs() {
      charactersMin.innerHTML = getSVG("#d4d4d4");
      containsSymbol.innerHTML = getSVG("#d4d4d4");
      cantContain.innerHTML = getSVG("#d4d4d4");
    }

    initializeSVGs(); // Set default SVGs on load

    function normalizeString(str) {
      return str.replace(/[\W_]+/g, '').toLowerCase();
    }

    function validatePassword() {
      const password = passwordInput.node.value; // Remove normalizeString here
      const firstName = normalizeString(firstNameInput.node.value);
      const lastName = normalizeString(lastNameInput.node.value);
      const emailLocalPart = normalizeString(emailInput.node.value.split('@')[0]);

      // Minimum 8 characters check
      charactersMin.innerHTML = password.length >= 8 ? getSVG("#00ff00", true) : getSVG("#ff0000");

      // Check for symbol or number
      const symbolRegex = /[0-9!@#$%^&*(),.?":{}|<>]/;
      containsSymbol.innerHTML = symbolRegex.test(password) ? getSVG("#00ff00", true) : getSVG("#ff0000");

      // Check for disallowed substrings (firstName, lastName, emailLocalPart)
      let disallowed = [firstName, lastName, emailLocalPart].filter(Boolean);
      const containsDisallowed = disallowed.length > 0 && disallowed.some(part => password.includes(part));
      cantContain.innerHTML = !containsDisallowed && password.length > 0 ? getSVG("#00ff00", true) : getSVG("#ff0000");
    }

    // Handle password field events to set current validation state
    passwordInput.node.addEventListener('focus', validatePassword);
    passwordInput.node.addEventListener('input', validatePassword);





    // Retrieve the WizedElement instance by its name
    const signUpButton = Wized.elements.get('SignUp_AgreeSubmitButton');

    // Ensure the element is present in the DOM
    if (signUpButton && signUpButton.node) {
      // Add click event listener to the button's DOM node
      signUpButton.node.addEventListener('click', function () {
        // Update the state in the Data Store to indicate the button was clicked
        Wized.data.v.signup_buttonclicked = true;
      });
    } else {
    }














    //forgot password
    //forgot password
    // Handle input rules for ForgotPassword_Email
    const forgotPasswordEmailInput = Wized.elements.get('ForgotPassword_Email');

    // Add validation logic for ForgotPassword_Email
    forgotPasswordEmailInput.node.addEventListener('focus', (event) => {
      const inputElement = event.target;
      if (inputElement.value === '') {
        inputElement.value = '';  // Clear the field when focused if empty
      }
    });

    forgotPasswordEmailInput.node.addEventListener('input', handleEmailInput);
    forgotPasswordEmailInput.node.addEventListener('keydown', handleEmailKeyDown);
    forgotPasswordEmailInput.node.addEventListener('change', handleEmailInput);

    // Function to handle email input
    function handleEmailInput(event) {
      const inputElement = event.target;
      let input = inputElement.value.replace(/[^a-zA-Z0-9@._-]/g, ''); // Strip invalid characters for email
      inputElement.value = input; // Update the field with sanitized input
    }

    // Function to handle email key down events
    function handleEmailKeyDown(event) {
      const key = event.key;
      const inputElement = event.target;

      // Prevent any characters that are not alphanumeric or standard email characters
      if (!/^[a-zA-Z0-9@._-]$/.test(key) && key.length === 1) {
        event.preventDefault(); // Prevent invalid characters
      }
    }





  });
});



window.Webflow ||= [];
window.Webflow.push(() => {
  const mapElement = document.querySelector('[fs-element="Listing-Map"]');
  if (!mapElement) {
    return;
  }

  window.onload = () => {
    try {
      let latitude, longitude;
      const apiKey = 'AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ';

      const checkDataInterval = setInterval(async () => {
        window.Wized = window.Wized || [];
        window.Wized.push(async (Wized) => {
          try {
            latitude = Wized.data.v.latitude;
            longitude = Wized.data.v.longitude;
          } catch (error) {
          }

          // Calculate new latitude and longitude to show 0.1 miles south and right
          const miles = 0.05;
          const earthRadius = 3958.8; // Radius of the Earth in miles
          const latOffset = -(miles / earthRadius) * (180 / Math.PI); // Negative to go south
          const lngOffset = (miles / earthRadius) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180); // Positive to go right (east)

          const fakeLatitude = latitude + latOffset;
          const fakeLongitude = longitude + lngOffset;

          if (latitude && longitude) {
            clearInterval(checkDataInterval); // Stop the interval once data is available

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            // script.defer = true;
            script.async = true;
            script.onload = () => {
              const map = new window.google.maps.Map(mapElement, {
                zoom: 16,
                center: { lat: fakeLatitude, lng: fakeLongitude },
                mapTypeId: 'roadmap',
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.TOP_RIGHT,
                },
                streetViewControlOptions: {
                  position: google.maps.ControlPosition.TOP_RIGHT,
                },
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
                position: { lat: fakeLatitude, lng: fakeLongitude },
                map: map,
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvgString),
                  scaledSize: new google.maps.Size(56, 56),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(28, 28)
                },
                title: 'A marker using a custom SVG image.'
              });

              // Add a blue circle around the altered coordinates
              const circle = new google.maps.Circle({
                strokeColor: '#67C8FF',
                strokeOpacity: 0.0,
                strokeWeight: 2,
                fillColor: '#3998ed',
                fillOpacity: 0.3,
                map: map,
                center: { lat: fakeLatitude, lng: fakeLongitude },
                radius: 0.25 * 1609.34 // 0.25 miles in meters
              });

            };
            document.head.appendChild(script);
          }
        });
      }, 1000); // Check every second
    } catch (error) {
    }
  };
});




//reserveButton
const reserveButtons = document.querySelectorAll('[data-element="listing_reserve_button"]');

// Function to reset button state (hide loader, show text)
function resetReserveButtonState() {
  reserveButtons.forEach(button => {
    if (button) {
      const buttonText = button.querySelector('[data-element="listing_reserve_button_text"]');
      const buttonLoader = button.querySelector('[data-element="listing_reserve_button_loader"]');

      if (buttonText) {
        buttonText.style.display = '';
      }
      if (buttonLoader) {
        buttonLoader.style.display = 'none';
      }
    }
  });
}

// Reset loader on page load/show (including when navigating back)
window.addEventListener('pageshow', function (event) {
  resetReserveButtonState();
});

// Initial reset
resetReserveButtonState();

reserveButtons.forEach(button => {
  if (button) {
    const buttonText = button.querySelector('[data-element="listing_reserve_button_text"]');
    const buttonLoader = button.querySelector('[data-element="listing_reserve_button_loader"]');

    button.addEventListener('click', () => {
      // Hide text and show loader
      if (buttonText) {
        buttonText.style.display = 'none';
      }
      if (buttonLoader) {
        buttonLoader.style.display = 'flex';
      }

      // Get current URL parameters
      const params = window.location.search;
      // Navigate to '/book/stay' with all current parameters
      window.location.href = '/book/stays' + params;
    });
  }
});



// //calender

// //calender
// //calender
// //calender

document.addEventListener('DOMContentLoaded', function () {
  window.Wized = window.Wized || [];
  window.Wized.push((async (Wized) => {
    // Wait for required data
    await Wized.requests.waitFor('Load_Property_Calendar_Disabled');
    await Wized.requests.waitFor('Load_Property_Details');

    // Get calendar data and property details
    let calendarData = Wized.data.r.Load_Property_Calendar_Disabled;
    let propertyData = Wized.data.r.Load_Property_Details.data.property;

    // Get DOM elements
    const checkInInput = document.querySelector('[data-element="checkInInput"]');
    const checkOutInput = document.querySelector('[data-element="checkOutInput"]');
    const mobileCheckInInput = document.querySelector('[data-element="mobileCheckInInput"]');
    const mobileCheckOutInput = document.querySelector('[data-element="mobileCheckOutInput"]');
    const calendarContainer = document.querySelector('[data-element="calendarContainer"]');
    const mobileCalendarContainer = document.querySelector('[data-element="mobileCalendarContainer"]');

    // Initialize state
    let selectedStartDate = null;
    let selectedEndDate = null;
    let disabledDates = new Set();
    let checkoutOnlyDates = new Set(); // Dates only available for checkout
    let unclickableCheckInDates = new Set(); // Available dates that can't be used as check-in
    let selectingCheckOut = false;

    // Convert disabled dates from API
    calendarData.data.forEach(item => {
      disabledDates.add(item.date);
      // Track dates that are available for checkout only
      if (item.isAvailableForCheckout === true) {
        checkoutOnlyDates.add(item.date);
      }
    });

    // Get property rules
    const advanceNotice = propertyData.advanceNotice || 0;
    const minNights = propertyData.min_nights || 1;
    const maxNights = propertyData.max_nights || 90;
    const availabilityWindow = propertyData.availabilityWindow_months || 24;

    // Calculate date constraints without time
    const today = createDateFromString(formatDate(new Date()));
    const minDate = addDays(today, advanceNotice);
    const maxDate = addMonths(today, availabilityWindow);

    // Helper function to create date from YYYY-MM-DD string without timezone issues
    function createDateFromString(dateString) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }

    // Helper function to add days to a date
    function addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    // Helper function to add months to a date
    function addMonths(date, months) {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    }

    // Add function to find gaps smaller than min nights and mark them as unavailable
    function markSmallGapsAsUnavailable() {
      const sortedDisabledDates = Array.from(disabledDates).sort();

      // Check first blocked date - verify there are enough nights from minDate
      if (sortedDisabledDates.length > 0) {
        const firstBlockedDate = createDateFromString(sortedDisabledDates[0]);
        const firstBlockedDateStr = sortedDisabledDates[0];

        // Calculate available days from minDate to first blocked date
        let availableDaysFromStart = 0;
        let checkDate = new Date(minDate);
        while (checkDate < firstBlockedDate) {
          availableDaysFromStart++;
          checkDate = addDays(checkDate, 1);
        }

        const availableNightsFromStart = availableDaysFromStart - 1;

        // If there aren't enough nights before the first blocked date, mark all dates in between as unavailable
        if (availableNightsFromStart < minNights) {
          let dateToBlock = new Date(minDate);

          while (dateToBlock < firstBlockedDate) {
            const dateStr = formatDate(dateToBlock);
            disabledDates.add(dateStr);
            // Also remove from checkoutOnlyDates if it was there
            checkoutOnlyDates.delete(dateStr);
            dateToBlock = addDays(dateToBlock, 1);
          }

          // If first blocked date is checkout-only but there aren't enough nights before it, remove from checkoutOnlyDates
          if (checkoutOnlyDates.has(firstBlockedDateStr)) {
            checkoutOnlyDates.delete(firstBlockedDateStr);
          }
        }
      }

      for (let i = 0; i < sortedDisabledDates.length - 1; i++) {
        const currentBlockedDate = createDateFromString(sortedDisabledDates[i]);
        const nextBlockedDate = createDateFromString(sortedDisabledDates[i + 1]);

        // Calculate available nights (days - 1)
        let availableDays = 0;
        let checkDate = addDays(currentBlockedDate, 1); // Start from day after blocked date

        // Count days until the next blocked date
        while (checkDate < nextBlockedDate) {
          availableDays++;
          checkDate = addDays(checkDate, 1);
        }

        // Available nights is one less than available days
        const availableNights = availableDays - 1;

        // If available nights are less than minimum required, mark all dates in between as unavailable
        if (availableNights < minNights) {
          let dateToBlock = addDays(currentBlockedDate, 1); // Start from day after blocked date

          while (dateToBlock < nextBlockedDate) {
            const dateStr = formatDate(dateToBlock);
            disabledDates.add(dateStr);
            dateToBlock = addDays(dateToBlock, 1);
          }
        }

        // If the next blocked date is checkout-only but the gap before it is too small,
        // remove it from checkoutOnlyDates so it shows as fully disabled
        const nextBlockedDateStr = formatDate(nextBlockedDate);
        if (checkoutOnlyDates.has(nextBlockedDateStr) && availableNights < minNights) {
          checkoutOnlyDates.delete(nextBlockedDateStr);
        }
      }

    }

    // Mark small gaps as unavailable
    markSmallGapsAsUnavailable();

    // Helper function to check if a date has valid checkout options
    function hasValidCheckoutOptions(checkInDate) {
      // Find first blocked date after this check-in
      let checkDate = addDays(checkInDate, 1);
      const firstBlockedDate = findFirstBlockedDateAfter(checkInDate);

      // Check if there's at least one valid checkout date
      for (let nightsCount = minNights; nightsCount <= maxNights; nightsCount++) {
        const potentialCheckout = addDays(checkInDate, nightsCount);

        // Check if this potential checkout is within maxDate
        if (potentialCheckout > maxDate) break;

        // Check if this checkout date is valid
        const checkoutDateStr = formatDate(potentialCheckout);
        const isPotentialCheckoutDisabled = isDateDisabled(potentialCheckout, false);

        // If it's not disabled (or it's checkout-only and that's ok), check if it's before blocked dates
        if (!isPotentialCheckoutDisabled) {
          // If there's no blocked date after check-in, this checkout is valid
          if (!firstBlockedDate) return true;

          // If checkout is before or equal to first blocked date, check if valid
          if (potentialCheckout <= firstBlockedDate) {
            return true;
          }
        } else if (checkoutOnlyDates.has(checkoutDateStr)) {
          // Checkout-only dates are valid as checkout
          if (!firstBlockedDate || potentialCheckout <= firstBlockedDate) {
            return true;
          }
        }
      }

      return false;
    }

    // Identify available dates that can't be used as check-in
    function markUnclickableCheckInDates() {
      let currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const dateStr = formatDate(currentDate);

        // Only check dates that are not already disabled and not checkout-only
        if (!disabledDates.has(dateStr) && !checkoutOnlyDates.has(dateStr)) {
          // Check if this date has valid checkout options
          if (!hasValidCheckoutOptions(currentDate)) {
            unclickableCheckInDates.add(dateStr);
          }
        }

        currentDate = addDays(currentDate, 1);
      }
    }

    // Mark unclickable check-in dates
    markUnclickableCheckInDates();

    // Initialize from URL parameters - Fixed to avoid timezone issues
    const urlParams = new URLSearchParams(window.location.search);
    const initialCheckIn = urlParams.get('checkin');
    const initialCheckOut = urlParams.get('checkout');

    // Set initial dates if they exist in URL - No timezone conversion
    if (initialCheckIn && initialCheckIn !== '') {
      selectedStartDate = createDateFromString(initialCheckIn);
    }
    if (initialCheckOut && initialCheckOut !== '') {
      selectedEndDate = createDateFromString(initialCheckOut);
    }

    // Set selection state based on initial dates
    if (selectedStartDate && !selectedEndDate) {
      selectingCheckOut = true;
    } else if (selectedStartDate && selectedEndDate) {
      selectingCheckOut = false;
    }

    // Set current view month based on selected dates or default to min date
    let currentViewMonth = selectedStartDate ? new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth(), 1) : new Date(minDate);

    // Helper function to find first blocked date after a given date
    // This includes checkout-only dates because they act as barriers
    function findFirstBlockedDateAfter(startDate) {
      let checkDate = addDays(startDate, 1);

      while (checkDate <= maxDate) {
        if (isDateDisabled(checkDate, true)) {
          return checkDate;
        }
        checkDate = addDays(checkDate, 1);
      }
      return null;
    }

    // Create calendar
    function createCalendar(resetViewToSelectedDate = false) {
      // Only reset view month if explicitly requested (when modal opens)
      if (resetViewToSelectedDate && selectedStartDate) {
        currentViewMonth = new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth(), 1);
      }

      // Clear existing calendar
      calendarContainer.innerHTML = '';

      // Create months container first
      const monthsContainer = document.createElement('div');
      monthsContainer.className = 'months-container';
      calendarContainer.appendChild(monthsContainer);

      // Create two months
      const month1Date = new Date(currentViewMonth);
      const month2Date = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 1);

      const month1 = createMonthElement(month1Date);
      const month2 = createMonthElement(month2Date);

      monthsContainer.appendChild(month1);
      monthsContainer.appendChild(month2);

      // Create navigation container
      const navContainer = document.createElement('div');
      navContainer.className = 'calendar-navigation';

      // Create previous month button
      const prevButton = document.createElement('button');
      prevButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
      prevButton.className = 'calendar-nav-button prev';
      prevButton.addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() - 1);
        createCalendar();
        createMobileCalendar();
      });

      // Create next month button
      const nextButton = document.createElement('button');
      nextButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
      nextButton.className = 'calendar-nav-button next';
      nextButton.addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() + 1);
        createCalendar();
        createMobileCalendar();
      });

      // Add navigation buttons
      navContainer.appendChild(prevButton);
      navContainer.appendChild(nextButton);
      calendarContainer.appendChild(navContainer);

      // Disable prev button if we're at the start
      const startMonth = new Date(minDate);
      prevButton.disabled = currentViewMonth <= startMonth;

      // Disable next button if we're at the end
      const endMonth = new Date(maxDate);
      endMonth.setMonth(endMonth.getMonth() - 1);
      nextButton.disabled = currentViewMonth >= endMonth;
    }

    // Create mobile calendar (vertical layout showing all available months)
    function createMobileCalendar() {
      if (!mobileCalendarContainer) return;

      // Clear existing calendar
      mobileCalendarContainer.innerHTML = '';

      // Create months container with vertical layout
      const monthsContainer = document.createElement('div');
      monthsContainer.className = 'mobile-months-container';
      mobileCalendarContainer.appendChild(monthsContainer);

      // Calculate how many months to show (from min date to max date)
      const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      let currentMonth = new Date(startDate);

      // Create all months vertically
      while (currentMonth <= endDate) {
        const monthElement = createMonthElement(new Date(currentMonth));
        monthElement.classList.add('mobile-month');

        // Add data attribute to identify month/year for scrolling purposes
        monthElement.setAttribute('data-month', currentMonth.getMonth());
        monthElement.setAttribute('data-year', currentMonth.getFullYear());

        monthsContainer.appendChild(monthElement);

        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }

    function createMonthElement(date) {
      const monthContainer = document.createElement('div');
      monthContainer.className = 'calendar-month';

      // Add month header
      const monthHeader = document.createElement('div');
      monthHeader.className = 'calendar-month-header';
      monthHeader.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthContainer.appendChild(monthHeader);

      // Add days of week header
      const weekdaysHeader = document.createElement('div');
      weekdaysHeader.className = 'calendar-weekdays';
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        weekdaysHeader.appendChild(dayElement);
      });
      monthContainer.appendChild(weekdaysHeader);

      // Add calendar days
      const daysContainer = document.createElement('div');
      daysContainer.className = 'calendar-days';

      // Fill in days
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Add empty cells for days before first of month
      for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysContainer.appendChild(emptyDay);
      }

      // Add actual days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
        const dateString = formatDate(currentDate);

        // Add data-date attribute for selection
        dayElement.setAttribute('data-date', dateString);

        // Check if this is a checkout-only date
        const isCheckoutOnly = checkoutOnlyDates.has(dateString);
        const isUnclickableCheckIn = unclickableCheckInDates.has(dateString);

        // Apply disabled state for past dates or API disabled dates
        if (isDateDisabled(currentDate)) {
          // If it's a checkout-only date, handle specially
          if (isCheckoutOnly) {
            dayElement.classList.add('checkout-only');
            // Make it clickable - the handleDateSelection will validate
            dayElement.addEventListener('click', (e) => {
              e.stopPropagation();
              handleDateSelection(currentDate);
            });
          } else {
            dayElement.classList.add('disabled');
            if (currentDate < today) {
              dayElement.style.color = '#D1D1D6';
              dayElement.style.cursor = 'default';
            }
          }
        } else if (isUnclickableCheckIn && !selectedStartDate) {
          // Available date but can't be used as check-in
          dayElement.classList.add('unclickable-checkin');
          dayElement.style.cursor = 'not-allowed';
          dayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showMinNightsTooltip(dayElement, minNights);
          });
        } else {
          dayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDateSelection(currentDate);
          });
        }

        // Apply styling based on selection state
        applyDateStyling(dayElement, currentDate);

        daysContainer.appendChild(dayElement);
      }

      monthContainer.appendChild(daysContainer);
      return monthContainer;
    }

    function applyDateStyling(dayElement, currentDate) {
      const dateString = formatDate(currentDate);
      const isCheckoutOnly = checkoutOnlyDates.has(dateString);

      // Reset styles first
      dayElement.style.backgroundColor = '';
      dayElement.style.color = '';
      dayElement.style.borderRadius = '';
      dayElement.style.width = '';
      dayElement.style.margin = '';
      dayElement.style.maxWidth = '';
      dayElement.style.cursor = '';

      // Remove previous classes
      dayElement.classList.remove('min-nights-blocked', 'max-nights-blocked', 'blocked-by-unavailable');

      // Style checkout-only dates based on selection state
      if (isCheckoutOnly) {
        if (!selectedStartDate) {
          // No check-in selected: show semi-disabled state
          dayElement.style.opacity = '0.4';
          dayElement.style.color = 'black';
          dayElement.style.cursor = 'not-allowed';
        } else {
          // Check-in is selected: show as available (remove checkout-only styling)
          dayElement.style.opacity = '';
          dayElement.style.color = '';
          dayElement.style.cursor = 'pointer';
        }
      }

      // Style for selected check-in date
      if (selectedStartDate && currentDate.getTime() === selectedStartDate.getTime()) {
        dayElement.style.backgroundColor = '#1374E0';
        dayElement.style.color = 'white';

        // Apply full border radius if only check-in is selected, otherwise left-side only
        if (!selectedEndDate) {
          dayElement.style.borderRadius = '50%';
        } else {
          dayElement.style.borderRadius = '50% 0 0 50%';
        }
      }

      // Style for selected check-out date
      if (selectedEndDate && currentDate.getTime() === selectedEndDate.getTime()) {
        dayElement.style.backgroundColor = '#1374E0';
        dayElement.style.color = 'white';
        dayElement.style.borderRadius = '0 50% 50% 0';
      }

      // Style for dates in between check-in and check-out
      if (selectedStartDate && selectedEndDate &&
        currentDate > selectedStartDate && currentDate < selectedEndDate) {
        dayElement.style.backgroundColor = '#E5F2FF';
        dayElement.style.borderRadius = '0';
        dayElement.style.width = '100%';
        dayElement.style.margin = '0';
        dayElement.style.maxWidth = 'none';
      }

      // Apply restrictions when check-in is selected but not check-out
      if (selectedStartDate && !selectedEndDate) {
        const daysDiff = Math.round((currentDate - selectedStartDate) / (1000 * 60 * 60 * 24));

        // Find first fully blocked date after selected start date
        const firstBlockedDate = findFirstBlockedDateAfter(selectedStartDate);

        // Check if current date is available (including checkout-only dates when selecting checkout)
        const isAvailableForThisSelection = !isDateDisabled(currentDate, false);

        if (isAvailableForThisSelection) {
          // Dates before selected start date - make unavailable
          if (currentDate < selectedStartDate) {
            dayElement.style.opacity = '0.4';
            dayElement.style.color = 'grey';
            dayElement.classList.add('blocked-by-selection');
          }

          // Dates within min nights range (blocked for checkout)
          if (currentDate > selectedStartDate && daysDiff < minNights) {
            dayElement.style.opacity = '0.4';
            dayElement.style.color = 'grey';
            dayElement.style.cursor = 'not-allowed';
            dayElement.classList.add('min-nights-blocked');
          }

          // Dates beyond max nights
          if (currentDate > selectedStartDate && daysDiff > maxNights) {
            dayElement.style.opacity = '0.4';
            dayElement.style.color = 'grey';
            dayElement.style.cursor = 'not-allowed';
            dayElement.classList.add('max-nights-blocked');
          }

          // Dates after first blocked date - make unavailable
          if (firstBlockedDate) {
            const firstBlockedDateString = formatDate(firstBlockedDate);
            const isFirstBlockedCheckoutOnly = checkoutOnlyDates.has(firstBlockedDateString);

            // If the first blocked date is checkout-only, block dates AFTER it
            // But the blocked date itself is available for checkout
            if (isFirstBlockedCheckoutOnly) {
              if (currentDate > firstBlockedDate) {
                dayElement.style.color = 'grey';
                dayElement.style.opacity = '0.4';
                dayElement.style.cursor = 'not-allowed';
                dayElement.classList.add('blocked-by-unavailable');
              }
            } else {
              // Regular blocked date - block it AND everything after
              if (currentDate >= firstBlockedDate) {
                dayElement.style.color = 'grey';
                dayElement.style.opacity = '0.4';
                dayElement.style.cursor = 'not-allowed';
                dayElement.classList.add('blocked-by-unavailable');
              }
            }
          }
        }
      }
    }

    function isDateDisabled(date, checkingForCheckIn = true) {
      const dateString = formatDate(date);

      // Check if date is before minimum date
      if (date < minDate) return true;

      // Check if date is after maximum date
      if (date > maxDate) return true;

      // Check if date is in disabled dates set
      if (disabledDates.has(dateString)) {
        // If it's a checkout-only date and we're checking for checkout, allow it
        if (checkoutOnlyDates.has(dateString) && !checkingForCheckIn) {
          return false;
        }
        return true;
      }

      return false;
    }

    function handleDateSelection(date) {
      const dateString = formatDate(date);
      const isCheckoutOnly = checkoutOnlyDates.has(dateString);

      // If no check-in selected yet, select this as check-in
      if (!selectedStartDate) {
        // Prevent selecting checkout-only dates as check-in
        if (isCheckoutOnly) {
          showError('This date is only available for checkout');
          return;
        }

        selectedStartDate = date;
        selectedEndDate = null;
        selectingCheckOut = true;

        // Clear URL parameters when starting new selection
        const url = new URL(window.location);
        url.searchParams.set('checkin', '');
        url.searchParams.set('checkout', '');
        window.history.replaceState({}, '', url);

        // Update Wized parameters
        Wized.data.n.parameter.checkin = "";
        Wized.data.n.parameter.checkout = "";

        updateInputs();
        createCalendar();
        createMobileCalendar();
        return;
      }

      // If selecting check-out
      if (selectingCheckOut) {
        // If date is before current check-in, make it the new check-in
        if (date < selectedStartDate) {
          // Prevent selecting checkout-only dates as check-in
          if (isCheckoutOnly) {
            showError('This date is only available for checkout');
            return;
          }

          selectedStartDate = date;
          selectedEndDate = null;
          selectingCheckOut = true;

          // Clear URL parameters when restarting selection
          const url = new URL(window.location);
          url.searchParams.set('checkin', '');
          url.searchParams.set('checkout', '');
          window.history.replaceState({}, '', url);

          // Update Wized parameters
          Wized.data.n.parameter.checkin = "";
          Wized.data.n.parameter.checkout = "";

          updateInputs();
          createCalendar();
          createMobileCalendar();
          return;
        }

        // Prevent selection if it violates rules
        const daysDiff = Math.round((date - selectedStartDate) / (1000 * 60 * 60 * 24));

        if (daysDiff < minNights) {
          showError(`Minimum stay is ${minNights} nights`);
          return;
        }

        if (daysDiff > maxNights) {
          showError(`Maximum stay is ${maxNights} nights`);
          return;
        }

        // Check if any dates in range are disabled
        let currentDate = new Date(selectedStartDate);
        while (currentDate <= date) {
          const checkingCheckout = (currentDate.getTime() === date.getTime());
          // For the last date in the range (checkout date), allow checkout-only dates
          if (isDateDisabled(currentDate, !checkingCheckout)) {
            showError('Selected dates include unavailable days');
            return;
          }
          currentDate = addDays(currentDate, 1);
        }

        // Check if date is after first blocked date
        const firstBlockedDate = findFirstBlockedDateAfter(selectedStartDate);
        if (firstBlockedDate && date > firstBlockedDate) {
          showError('Cannot book past unavailable dates');
          return;
        }

        // If the selected checkout date IS the first blocked date, it must be checkout-only
        if (firstBlockedDate && date.getTime() === firstBlockedDate.getTime()) {
          const firstBlockedDateString = formatDate(firstBlockedDate);
          if (!checkoutOnlyDates.has(firstBlockedDateString)) {
            showError('Cannot book past unavailable dates');
            return;
          }
        }

        // Valid check-out selection
        selectedEndDate = date;
        selectingCheckOut = false;
        updateInputs();
        updateURL();
      } else {
        // Starting new selection - set as check-in
        // Prevent selecting checkout-only dates as check-in
        if (isCheckoutOnly) {
          showError('This date is only available for checkout');
          return;
        }

        selectedStartDate = date;
        selectedEndDate = null;
        selectingCheckOut = true;

        // Clear URL parameters when starting new selection
        const url = new URL(window.location);
        url.searchParams.set('checkin', '');
        url.searchParams.set('checkout', '');
        window.history.replaceState({}, '', url);

        // Update Wized parameters
        Wized.data.n.parameter.checkin = "";
        Wized.data.n.parameter.checkout = "";

        updateInputs();
      }

      // Re-render calendar to update visual state
      createCalendar();
      createMobileCalendar();
    }

    function updateInputs() {
      // Update display elements (not input fields)
      if (checkInInput) {
        checkInInput.textContent = selectedStartDate ? formatDateForDisplay(selectedStartDate) : 'Set Date';
      }
      if (checkOutInput) {
        checkOutInput.textContent = selectedEndDate ? formatDateForDisplay(selectedEndDate) : 'Set Date';
      }

      // Update mobile inputs
      if (mobileCheckInInput) {
        mobileCheckInInput.textContent = selectedStartDate ? formatDateForDisplay(selectedStartDate) : 'Set Date';
      }
      if (mobileCheckOutInput) {
        mobileCheckOutInput.textContent = selectedEndDate ? formatDateForDisplay(selectedEndDate) : 'Set Date';
      }
    }

    function updateURL() {
      const url = new URL(window.location);

      if (selectedStartDate && selectedEndDate) {
        url.searchParams.set('checkin', formatDate(selectedStartDate));
        url.searchParams.set('checkout', formatDate(selectedEndDate));
        window.history.replaceState(null, "", url);

        // Update Wized parameters
        Wized.data.n.parameter.checkin = formatDate(selectedStartDate);
        Wized.data.n.parameter.checkout = formatDate(selectedEndDate);

        // Trigger calendar query
        Wized.requests.execute('Load_Property_Calendar_Query');

        // Immediately update the heading to hide "Add dates for pricing" when both dates are selected
        // This happens before the calendar modal closes
        if (window.updateAddDatesHeading) {
          // Use a small timeout to ensure URL params are fully updated
          setTimeout(() => {
            window.updateAddDatesHeading();
          }, 10);
        }

        // Immediately update error states - dates from calendar are always valid, so this clears any previous errors
        if (window.updateAvailabilityStatus) {
          setTimeout(() => {
            window.updateAvailabilityStatus();
          }, 10);
        }

        // Also update button visibility immediately
        if (window.updateAllButtonVisibility) {
          setTimeout(() => {
            window.updateAllButtonVisibility();
          }, 10);
        }
      }
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function formatDateForDisplay(date) {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    }

    function showError(message) {
      const errorContainer = document.querySelector('[data-element="Dates_Error_Container"]');
      const errorTexts = document.querySelectorAll('[data-element="Dates_Error_Text"]');

      if (errorContainer && errorTexts.length > 0) {
        errorTexts.forEach(element => {
          if (element) {
            element.textContent = message;
          }
        });
        errorContainer.style.display = 'flex';
      }
    }

    function showMinNightsTooltip(dayElement, minNights) {
      // Remove any existing tooltips
      const existingTooltips = document.querySelectorAll('.min-nights-tooltip');
      existingTooltips.forEach(tooltip => tooltip.remove());

      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'min-nights-tooltip';
      tooltip.textContent = `Minimum ${minNights} night${minNights > 1 ? 's' : ''} required`;

      // Position tooltip above the day element
      const rect = dayElement.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 35}px`;
      tooltip.style.transform = 'translateX(-50%)';

      document.body.appendChild(tooltip);

      // Remove tooltip after 2 seconds
      setTimeout(() => {
        tooltip.remove();
      }, 2000);
    }

    // Expose calendar function globally for modal observer
    window.resetCalendarView = function () {
      createCalendar(true); // Pass true to reset view to selected date
    };

    // Initialize inputs first, then create calendars to ensure proper styling
    updateInputs();

    // Add slight delay to ensure DOM is ready and proper styling is applied
    setTimeout(() => {
      createCalendar();
      createMobileCalendar();
    }, 10);

    // Add clear dates functionality
    const clearButtons = document.querySelectorAll('[data-element="calendarModal_clearDates"], [data-element="mobileCalendarModal_clearDates"]');
    clearButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        selectedStartDate = null;
        selectedEndDate = null;
        selectingCheckOut = false;
        updateInputs();

        // Clear URL parameters
        const url = new URL(window.location);
        url.searchParams.set('checkin', '');
        url.searchParams.set('checkout', '');
        window.history.replaceState({}, '', url);

        // Update Wized parameters
        Wized.data.n.parameter.checkin = "";
        Wized.data.n.parameter.checkout = "";

        createCalendar();
        createMobileCalendar();

        // Update display elements after clearing dates
        if (window.updateAvailabilityStatus) {
          window.updateAvailabilityStatus();
        }
        if (window.updateAddDatesHeading) {
          window.updateAddDatesHeading();
        }
        if (window.updateReservationTotalContainer) {
          window.updateReservationTotalContainer();
        }
        if (window.updateReservationTotal) {
          window.updateReservationTotal();
        }
        if (window.updateListingQueryPriceDetailsVisibility) {
          window.updateListingQueryPriceDetailsVisibility();
        }
        if (window.updateListingOnlyPricing) {
          window.updateListingOnlyPricing();
        }
        if (window.updatePhoneReservationFooter) {
          window.updatePhoneReservationFooter();
        }
        // Update button visibility after clearing dates (with timeout to ensure other updates complete first)
        setTimeout(() => {
          if (window.updateAllButtonVisibility) {
            window.updateAllButtonVisibility();
          }
        }, 100);
      });
    });

    // Fix close button functionality
    const closeButtons = document.querySelectorAll('[data-element="calendarModal_closeButton"], [data-element="mobileCalendarModal_closeButton"]');
    const calendarModal = document.querySelector('[data-element="calendarModal"]');
    const mobileCalendarModal = document.querySelector('[data-element="mobileCalendarModal"]');

    // Helper function to clear incomplete date selection
    function clearIncompleteDateSelection() {
      // Clear the incomplete date selection
      selectedStartDate = null;
      selectedEndDate = null;
      selectingCheckOut = false;

      // Update URL to clear dates
      const url = new URL(window.location);
      url.searchParams.set('checkin', '');
      url.searchParams.set('checkout', '');
      window.history.replaceState({}, '', url);

      // Update Wized parameters
      Wized.data.n.parameter.checkin = "";
      Wized.data.n.parameter.checkout = "";

      // Update input displays
      updateInputs();

      // Recreate calendars to reflect cleared state
      createCalendar();
      createMobileCalendar();

      // Update all UI elements
      if (window.updateAvailabilityStatus) {
        window.updateAvailabilityStatus();
      }
      if (window.updateAddDatesHeading) {
        window.updateAddDatesHeading();
      }
      if (window.updateReservationTotalContainer) {
        window.updateReservationTotalContainer();
      }
      if (window.updateReservationTotal) {
        window.updateReservationTotal();
      }
      if (window.updateListingQueryPriceDetailsVisibility) {
        window.updateListingQueryPriceDetailsVisibility();
      }
      if (window.updateListingOnlyPricing) {
        window.updateListingOnlyPricing();
      }
      if (window.updatePhoneReservationFooter) {
        window.updatePhoneReservationFooter();
      }
      if (window.updateAllButtonVisibility) {
        window.updateAllButtonVisibility();
      }
    }

    // Close button handlers
    closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if only one date is selected (incomplete selection)
        if (selectedStartDate && !selectedEndDate) {
          clearIncompleteDateSelection();
        }

        // Close desktop modal
        if (calendarModal) {
          calendarModal.style.display = 'none';
        }

        // Close mobile modal
        if (mobileCalendarModal) {
          mobileCalendarModal.style.display = 'none';
        }

        // Re-enable body scroll on mobile (991px or less)
        if (window.innerWidth <= 991) {
          document.body.classList.remove('no-scroll');
        }

        // Trigger calendar query if both dates are selected
        if (selectedStartDate && selectedEndDate) {
          Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
            if (window.updateAvailabilityStatus) {
              window.updateAvailabilityStatus();
            }
            // Validate extras after user completes date selection
            if (window.updateAllButtonVisibility) {
              window.updateAllButtonVisibility();
            }
          });
        }
      });
    });

    // Add click outside to close for desktop modal
    if (calendarModal) {
      calendarModal.addEventListener('click', function (event) {
        const calendarContent = calendarModal.querySelector('[data-element="calendarModal_content"]');

        if (calendarContent && !calendarContent.contains(event.target)) {
          // Check if only one date is selected (incomplete selection)
          if (selectedStartDate && !selectedEndDate) {
            clearIncompleteDateSelection();
          }

          calendarModal.style.display = 'none';

          // Re-enable body scroll on mobile (991px or less)
          if (window.innerWidth <= 991) {
            document.body.classList.remove('no-scroll');
          }

          // Trigger calendar query if both dates are selected
          if (selectedStartDate && selectedEndDate) {
            Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
              if (window.updateAvailabilityStatus) {
                window.updateAvailabilityStatus();
              }
              // Validate extras after user completes date selection
              if (window.updateAllButtonVisibility) {
                window.updateAllButtonVisibility();
              }
            });
          }
        }
      });
    }

    // Add click outside to close for mobile modal
    if (mobileCalendarModal) {
      mobileCalendarModal.addEventListener('click', function (event) {
        const mobileCalendarContent = mobileCalendarModal.querySelector('[data-element="mobileCalendarModal_content"]');

        if (mobileCalendarContent && !mobileCalendarContent.contains(event.target)) {
          // Check if only one date is selected (incomplete selection)
          if (selectedStartDate && !selectedEndDate) {
            clearIncompleteDateSelection();
          }

          mobileCalendarModal.style.display = 'none';

          // Re-enable body scroll on mobile (991px or less)
          if (window.innerWidth <= 991) {
            document.body.classList.remove('no-scroll');
          }

          // Trigger calendar query if both dates are selected
          if (selectedStartDate && selectedEndDate) {
            Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
              if (window.updateAvailabilityStatus) {
                window.updateAvailabilityStatus();
              }
              // Validate extras after user completes date selection
              if (window.updateAllButtonVisibility) {
                window.updateAllButtonVisibility();
              }
            });
          }
        }
      });
    }


    // Add styles matching index-search.js
    const styles = document.createElement('style');
    styles.textContent = `
      [data-element="calendarContainer"] {
        position: relative;
      }

      .calendar-month {
        margin: 0px;
        padding: 0;
        background: white;
        position: relative;
        flex: 1;
      }

      .calendar-month-header {
        font-size: 16px;
        font-weight: bold;
        margin: 35px 0 20px 0;
        color: black;
        text-align: center;
        font-family: 'TT Fors', sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-family: 'TT Fors', sans-serif;
        font-size: 12px;
        color: #6E6E73;
        margin-bottom: 10px;
      }

      .calendar-weekdays div {
        padding: 5px;
      }

      .calendar-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0px;
      }

      .calendar-day {
        height: 42px;
        width: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        cursor: pointer;
        border-radius: 50%;
        margin: auto;
        font-family: 'TT Fors', sans-serif;
        transition: all 0.2s ease;
      }

      .calendar-day:hover:not(.disabled):not(.empty):not(.min-nights-blocked):not(.max-nights-blocked):not(.blocked-by-unavailable):not(.blocked-by-selection):not(.unclickable-checkin) {
        background-color: #f5f5f5;
      }

      .calendar-day.empty {
        cursor: default;
        height: 40px;
      }

      .calendar-day.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        color: #999;
      }

      .calendar-day.checkout-only {
        position: relative;
      }

      .calendar-day.unclickable-checkin {
        opacity: 1;
        position: relative;
      }

      .calendar-day.min-nights-blocked,
      .calendar-day.max-nights-blocked,
      .calendar-day.blocked-by-unavailable,
      .calendar-day.blocked-by-selection {
        cursor: not-allowed !important;
      }

      .min-nights-tooltip {
        background-color: #323232;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: 'TT Fors', sans-serif;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        animation: tooltipFadeIn 0.2s ease;
      }

      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .calendar-navigation {
        position: absolute;
        width: 100%;
        top: 30px;
        left: 0;
        pointer-events: none;
        z-index: 1;
      }

      .calendar-nav-button {
        background: none;
        border: none;
        cursor: pointer;
        position: absolute;
        top: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
        pointer-events: auto;
      }

      .calendar-nav-button:hover:not(:disabled) {
        background-color: whitesmoke;
      }

      .calendar-nav-button:disabled {
        opacity: 0.3;
        cursor: default;
      }

      .calendar-nav-button.prev {
        left: 0;
      }

      .calendar-nav-button.next {
        right: 0;
      }

      .months-container {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        min-height: 370px;
        position: relative;
      }

      /* Mobile view */
      @media (max-width: 767px) {
        .months-container {
          flex-direction: column;
        }
        
        .calendar-month {
          margin: 0px;
        }

        .calendar-nav-button.prev {
          left: 10px;
        }

        .calendar-nav-button.next {
          right: 10px;
        }
      }
    `;
    document.head.appendChild(styles);
  }));
});

// Listen for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

  // Initialize Wized
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {
    // Map to track Splide instances

    Wized.on('requestend', (event) => {
      if (event.name === 'Load_Property_Details') {

        // Check property private dock status for boat rental service
        if (window.boatRentalService) {
          window.boatRentalService.checkPropertyPrivateDockStatus();
        }

        // Retrieve the properties and sliders
        var propertyPhotos = event.data.property._property_all_pictures;

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

        // Add slides for each image with optimized loading
        propertyPhotos.forEach((photoUrl, index) => {
          var li = document.createElement('li');
          li.classList.add('splide__slide');

          // First image gets highest priority for instant loading
          if (index === 0) {
            li.innerHTML = `<img src="${photoUrl.property_image.url}" 
                             alt="Property Photo"
                             loading="eager"
                             fetchpriority="high"
                             decoding="async">`;
          } else if (index < 3) {
            // Load first 3 images eagerly
            li.innerHTML = `<img src="${photoUrl.property_image.url}" 
                             alt="Property Photo"
                             loading="eager"
                             decoding="async">`;
          } else {
            // Rest load lazily
            li.innerHTML = `<img src="${photoUrl.property_image.url}" 
                             alt="Property Photo"
                             loading="lazy"
                             decoding="async">`;
          }

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

        [prevArrow, nextArrow].forEach(arrow => {
          if (arrow) {
            arrow.addEventListener('click', (e) => {
              e.preventDefault(); // Prevent the link's default behavior
              e.stopPropagation();
            });
          }
        });

        // Refresh the slider after adding slides
        slider.refresh();



      }
    });
  });
});

// Guest dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
  const guestInput = document.querySelector('[data-element="Input_Guests"]');
  const guestDropdown = document.querySelector('[data-element="Input_Guests_Dropdown"]');
  const closeText = document.querySelector('[data-element="Input_Guests_Dropdown_CloseText"]');
  const guestHeaderText = document.querySelector('[data-element="Input_Guests_HeaderText"]');
  const changeGuestsButtons = document.querySelectorAll('[data-element="listing_changeGuests_button"]');

  // Handle initial state
  if (guestDropdown) {
    guestDropdown.style.display = 'none';
  }

  // Toggle dropdown when clicking on the input
  if (guestInput) {
    guestInput.addEventListener('click', function (e) {
      e.stopPropagation(); // Prevent the click from bubbling up to document
      if (guestDropdown) {
        guestDropdown.style.display = 'flex';
      }
    });
  }

  // Note: Change guests button handlers removed per user request

  // Close dropdown when clicking on close text
  if (closeText) {
    closeText.addEventListener('click', function (e) {
      e.stopPropagation(); // Prevent the click from bubbling up to document
      if (guestDropdown) {
        guestDropdown.style.display = 'none';
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    // Check if click is on a change guests button (using data-element)
    const isChangeGuestsButton = e.target.closest('[data-element="listing_changeGuests_button"]');

    if (guestDropdown &&
      !guestDropdown.contains(e.target) &&
      !guestInput.contains(e.target) &&
      !isChangeGuestsButton) {
      guestDropdown.style.display = 'none';
    }
  });

  // Add validation for guest count
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {
    // Function to update guest input background color based on validation
    function updateGuestInputValidation() {
      if (Wized.data.n && Wized.data.r &&
        Wized.data.r.Load_Property_Details &&
        Wized.data.r.Load_Property_Details.data) {

        const n = Wized.data.n;
        const r = Wized.data.r;

        // Check if guests exceed max or is less than 1
        const isInvalid = (n.parameter.guests > r.Load_Property_Details.data.property.num_guests) || (n.parameter.guests < 1);

        // Apply background color based on validation
        if (guestInput) {
          guestInput.style.backgroundColor = isInvalid ? "#ffd4d2" : "";

          // Update header text color if element exists
          if (guestHeaderText) {
            guestHeaderText.style.color = isInvalid ? "#ff0000" : "";
          }
        }

        // After guest validation, update availability status to refresh error messages
        if (window.updateAvailabilityStatus) {
          window.updateAvailabilityStatus();
        }
      }
    }

    // Initial validation
    Wized.requests.waitFor('Load_Property_Details').then(() => {
      updateGuestInputValidation();
    });

    // Instead of using Wized.data.listen, we'll use the button click handlers directly
    // to trigger validation after the guest count changes

    // Find all plus and minus buttons in the guest dropdown
    const plusButtonsInDropdown = guestDropdown ? guestDropdown.querySelectorAll('[id^="plus-button"]') : [];
    const minusButtonsInDropdown = guestDropdown ? guestDropdown.querySelectorAll('[id^="minus-button"]') : [];

    // Add click handler to immediately update validation after guest count changes
    [...plusButtonsInDropdown, ...minusButtonsInDropdown].forEach(button => {
      button.addEventListener('click', () => {
        // Small timeout to allow Wized data to update first
        setTimeout(() => {
          updateGuestInputValidation();
        }, 50);
      });
    });
  });
});






// Calendar and date selection handler
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');
  const changeDatesButtons = document.querySelectorAll('[data-element="listing_changeDates_button"]');
  const calendarModal = document.querySelector('[data-element="calendarModal"]');

  // Add this line to get the addDatesHeading elements
  const addDatesHeadings = document.querySelectorAll('[data-element="Listing_Reservaton_AddDates_Heading"]');

  // Add error elements
  const errorContainer = document.querySelector('[data-element="Dates_Error_Container"]');
  const errorTexts = document.querySelectorAll('[data-element="Dates_Error_Text"]');

  // Initially hide the error container
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }

  // Note: Check availability and change dates button handlers removed per user request

  // Watch for when desktop calendar modal becomes visible and reset view
  if (calendarModal) {
    const desktopObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const isVisible = window.getComputedStyle(calendarModal).display !== 'none';

          // Add/remove no-scroll on body for mobile view (991px or less)
          if (window.innerWidth <= 991) {
            if (isVisible) {
              document.body.classList.add('no-scroll');
            } else {
              document.body.classList.remove('no-scroll');
            }
          }

          if (isVisible && window.resetCalendarView) {
            // Reset view to selected date when modal opens
            setTimeout(() => {
              window.resetCalendarView();
            }, 50);
          }
        }
      });
    });

    desktopObserver.observe(calendarModal, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  // Add mobile calendar modal functionality to existing buttons
  const mobileCalendarModal = document.querySelector('[data-element="mobileCalendarModal"]');

  // Watch for when mobile calendar modal becomes visible and auto-scroll
  if (mobileCalendarModal) {
    const mobileObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const isVisible = window.getComputedStyle(mobileCalendarModal).display !== 'none';
          if (isVisible) {
            scrollMobileCalendarToSelectedMonth();
          }
        }
      });
    });

    mobileObserver.observe(mobileCalendarModal, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  // Helper function to scroll mobile calendar to selected date
  function scrollMobileCalendarToSelectedMonth() {
    const mobileCalendarContainer = document.querySelector('[data-element="mobileCalendarContainer"]');
    if (!mobileCalendarContainer) return;

    // Get selected dates from URL
    const urlParams = new URLSearchParams(window.location.search);
    const checkin = urlParams.get('checkin');
    if (!checkin) return;

    // Parse the check-in date
    const [year, month] = checkin.split('-').map(Number);

    // Find the month element with matching data attributes
    setTimeout(() => {
      const targetMonth = mobileCalendarContainer.querySelector(
        `[data-month="${month - 1}"][data-year="${year}"]`
      );

      if (targetMonth) {
        // Scroll to the target month
        mobileCalendarContainer.scrollTop = targetMonth.offsetTop;
      }
    }, 150);
  }

  // Update existing buttons to also open mobile modal if it exists
  if (checkAvailabilityButtons.length > 0 && mobileCalendarModal) {
    checkAvailabilityButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function (e) {
          // The desktop modal is already handled above, also show mobile modal if it exists
          mobileCalendarModal.style.display = 'flex';
          // Prevent body scroll on mobile (991px or less)
          if (window.innerWidth <= 991) {
            document.body.classList.add('no-scroll');
          }
        });
      }
    });
  }

  if (changeDatesButtons.length > 0 && mobileCalendarModal) {
    changeDatesButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function (e) {
          // The desktop modal is already handled above, also show mobile modal if it exists
          mobileCalendarModal.style.display = 'flex';
          // Prevent body scroll on mobile (991px or less)
          if (window.innerWidth <= 991) {
            document.body.classList.add('no-scroll');
          }
        });
      }
    });
  }

  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {
    // Elements
    const checkInElement = document.querySelector('[data-element="Input_CheckIn"]');
    const checkOutElement = document.querySelector('[data-element="Input_CheckOut"]');

    // Initialize
    setupCalendarElements();

    // Wait for both calendar and property details requests to complete
    Promise.all([
      Wized.requests.waitFor('Load_Property_Calendar_Query'),
      Wized.requests.waitFor('Load_Property_Details')
    ]).then(() => {
      updateAvailabilityStatus();
      // Add this line to call updateAddDatesHeading on initial load
      updateAddDatesHeading();
    }).catch(error => {

    });

    // Set up initial state of calendar elements
    function setupCalendarElements() {


      // Initial check for availability if data is already loaded
      if (Wized.data.r.Load_Property_Calendar_Query &&
        Wized.data.r.Load_Property_Calendar_Query.hasRequested &&
        Wized.data.r.Load_Property_Details &&
        Wized.data.r.Load_Property_Details.hasRequested) {
        updateAvailabilityStatus();
        // Add this line
        updateAddDatesHeading();
      }
    }

    // Update availability status based on calendar data
    function updateAvailabilityStatus() {
      const r = Wized.data.r;
      const n = Wized.data.n;

      if (n && n.parameter) {
      }

      // Get the color for availability status
      const color = getAvailabilityColor(r);

      // Check for guest count errors
      let hasGuestError = false;
      if (r && r.Load_Property_Details && r.Load_Property_Details.data &&
        r.Load_Property_Details.data.property && n && n.parameter) {
        const maxGuests = r.Load_Property_Details.data.property.num_guests;
        const currentGuests = n.parameter.guests;
        hasGuestError = (currentGuests > maxGuests) || (currentGuests < 1);
      }

      // Get header text elements
      const checkInHeaderText = document.querySelector('[data-element="Input_CheckIn_HeaderText"]');
      const checkOutHeaderText = document.querySelector('[data-element="Input_CheckOut_HeaderText"]');

      // Apply visual feedback based on availability for check-in
      if (checkInElement) {
        checkInElement.style.backgroundColor = color;

        // Update header text color if element exists
        if (checkInHeaderText) {
          checkInHeaderText.style.color = color === "#ffd4d2" ? "#ff0000" : "";
        }
      }

      // Apply visual feedback based on availability for checkout element
      if (checkOutElement) {
        checkOutElement.style.backgroundColor = color;

        // Update header text color if element exists
        if (checkOutHeaderText) {
          checkOutHeaderText.style.color = color === "#ffd4d2" ? "#ff0000" : "";
        }
      }

      // Update error message display
      updateErrorDisplay(color === "#ffd4d2", hasGuestError, r);

      // Update add dates heading
      updateAddDatesHeading();

      // Update reservation display elements
      if (window.updateReservationTotalContainer) {
        window.updateReservationTotalContainer();
      }
      if (window.updateReservationTotal) {
        window.updateReservationTotal();
      }

      // Update boat visibility elements
      if (window.updateBoatVisibility) {
        window.updateBoatVisibility();
      }

      // Update listing query price details visibility
      if (window.updateListingQueryPriceDetailsVisibility) {
        window.updateListingQueryPriceDetailsVisibility();
      }

      // Update listing-only pricing when no boat is selected
      if (window.updateListingOnlyPricing) {
        window.updateListingOnlyPricing();
      }

      // Update phone reservation footer
      if (window.updatePhoneReservationFooter) {
        window.updatePhoneReservationFooter();
      }

      // Update boat rental button state if it exists
      const boatButtons = document.querySelectorAll('[data-element="addBoatButton"]');
      if (boatButtons.length > 0) {
        const datesValid = color !== "#ffd4d2" &&
          r && r.Load_Property_Calendar_Query &&
          r.Load_Property_Calendar_Query.data;

        boatButtons.forEach(button => {
          if (button) {
            button.style.borderColor = datesValid ? '#e2e2e2' : '#e2e2e2';
            button.style.opacity = datesValid ? '1' : '0.5';
            button.style.cursor = datesValid ? 'pointer' : 'not-allowed';
          }
        });
      }
    }

    // New function to handle error display
    function updateErrorDisplay(hasDateError, hasGuestError, r) {
      if (!errorContainer || !errorTexts || errorTexts.length === 0) {
        return;
      }

      // Check if dates are actually selected before showing date errors
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";

      // If date error but no dates selected, ignore the date error
      if (hasDateError && (!hasCheckin || !hasCheckout)) {
        hasDateError = false;
      }

      // If no errors, hide the container
      if (!hasDateError && !hasGuestError) {
        errorContainer.style.display = 'none';
        return;
      }

      // Show the container if there are errors
      errorContainer.style.display = 'flex';

      // Prioritize date errors over guest errors
      if (hasDateError) {
        // Get specific date error message
        let dateErrorMessage = "Selected dates are not available.";

        // Check if we have min_nights information to give more specific message
        if (r && r.Load_Property_Details && r.Load_Property_Details.data &&
          r.Load_Property_Details.data.property &&
          r.Load_Property_Details.data.property.min_nights) {
          const minNights = r.Load_Property_Details.data.property.min_nights;

          // Check if calendar data exists to determine if it's a min nights issue
          if (r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.data &&
            r.Load_Property_Calendar_Query.data.property_calendar_range) {

            const calendarData = r.Load_Property_Calendar_Query.data.property_calendar_range;
            let unavailableDayFound = false;

            for (let i = 0; i < calendarData.length; i++) {
              if (calendarData[i].status !== "available") {
                unavailableDayFound = true;
                break;
              }
            }

            if (unavailableDayFound) {
              dateErrorMessage = "Selected dates unavailable";
            } else if (calendarData.length < minNights) {
              dateErrorMessage = `Minimum stay is ${minNights} nights`;
            }
          }
        }

        errorTexts.forEach(element => {
          if (element) {
            element.textContent = dateErrorMessage;
          }
        });
      } else if (hasGuestError) {
        // Guest error message with more concise wording
        let guestErrorMessage = "Invalid number of guests";

        // Get property max guests for a more specific message
        if (r && r.Load_Property_Details && r.Load_Property_Details.data &&
          r.Load_Property_Details.data.property) {
          const maxGuests = r.Load_Property_Details.data.property.num_guests;
          guestErrorMessage = `Maximum number of guests is ${maxGuests}`;
        }

        errorTexts.forEach(element => {
          if (element) {
            element.textContent = guestErrorMessage;
          }
        });
      }
    }

    // Make updateAvailabilityStatus available globally so other parts of the code can use it
    window.updateAvailabilityStatus = updateAvailabilityStatus;

    // Calculate availability color based on Wized data
    function getAvailabilityColor(r) {


      // Check if dates are actually selected before showing any error state
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";

      // If no dates are selected, don't show an error state
      if (!hasCheckin || !hasCheckout) {

        return ""; // Return empty string for default background when no dates are selected
      }

      // Check if calendar query is currently executing (not completed yet)
      // When dates are selected from calendar UI, they're always valid, so clear error immediately
      if (r.Load_Property_Calendar_Query &&
        r.Load_Property_Calendar_Query.hasRequested &&
        r.Load_Property_Calendar_Query.status !== 200) {
        return ""; // Optimistically clear error while query is executing (dates from UI are always valid)
      }

      // Also verify the data exists before proceeding with validation
      if (!r.Load_Property_Calendar_Query ||
        !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Details ||
        !r.Load_Property_Details.data) {

        return ""; // Return empty for default background since we can't validate
      }

      // Check if calendar query exists and completed successfully
      if (!r.Load_Property_Calendar_Query ||
        !r.Load_Property_Calendar_Query.hasRequested ||
        r.Load_Property_Calendar_Query.status != 200 ||
        !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Calendar_Query.data.property_calendar_range) {

        return ""; // Don't show error if we don't have calendar data yet
      }

      // Detailed property details inspection

      if (r.Load_Property_Details) {

        if (r.Load_Property_Details.data) {


          if (r.Load_Property_Details.data.property) {

          }
        }
      }

      // We need to ensure min_nights exists before proceeding
      if (!r.Load_Property_Details ||
        !r.Load_Property_Details.data ||
        !r.Load_Property_Details.data.property ||
        r.Load_Property_Details.data.property.min_nights === undefined) {

        return "#ffd4d2"; // Light red for error state
      }

      const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
      const minNights = r.Load_Property_Details.data.property.min_nights;

      let allAvailable = true;
      let consecutiveAvailableDays = 0;
      let meetsMinNights = false;

      for (let i = 0; i < propertyCalendarRange.length; i++) {
        if (propertyCalendarRange[i].status === "available") {
          consecutiveAvailableDays++; // Count consecutive available days
          if (consecutiveAvailableDays >= minNights) {
            meetsMinNights = true; // If consecutive days meet min nights at any point
          }
        } else {
          consecutiveAvailableDays = 0; // Reset if a day is not available
          allAvailable = false; // Set availability to false if any day is not available
        }
      }

      // Determine color based on availability and minimum night conditions
      const color = !allAvailable || !meetsMinNights ? "#ffd4d2" : "";

      return color;
    }

    // Update the guest validation function to also update error display
    const originalUpdateGuestInputValidation = window.updateGuestInputValidation;
    if (typeof originalUpdateGuestInputValidation === 'function') {
      window.updateGuestInputValidation = function () {
        // Call original function first
        originalUpdateGuestInputValidation();

        // Then update availability status which will update error display
        if (window.updateAvailabilityStatus) {
          window.updateAvailabilityStatus();
        }

        // Update button visibility
        if (window.updateAllButtonVisibility) {
          window.updateAllButtonVisibility();
        }
      };
    }

    // Additional check-in/check-out related functions can be added here


    // Instead of using Wized.data.listen which doesn't exist, 
    // rely on the button click handlers we already set up above
    // The updateGuestInputValidation function already calls updateAvailabilityStatus

    // After the existing setupCalendarElements() function
    // Wait for both calendar and property details requests to complete
    Promise.all([
      Wized.requests.waitFor('Load_Property_Calendar_Query'),
      Wized.requests.waitFor('Load_Property_Details')
    ]).then(() => {
      updateAvailabilityStatus();
      // Add this line to call updateAddDatesHeading on initial load
      updateAddDatesHeading();
    }).catch(error => {
    });

    // Add this entire function for updating the heading
    function updateAddDatesHeading() {
      if (!addDatesHeadings || addDatesHeadings.length === 0) return;

      const r = Wized.data.r;
      const n = Wized.data.n;
      if (!r) return;

      // Check if dates are actually selected before showing any error message
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";
      const datesSelected = hasCheckin && hasCheckout;

      // Check guest validation
      let hasGuestError = false;
      if (r.Load_Property_Details && r.Load_Property_Details.data &&
        r.Load_Property_Details.data.property && n && n.parameter) {
        const maxGuests = r.Load_Property_Details.data.property.num_guests;
        const currentGuests = n.parameter.guests || 0;
        hasGuestError = (currentGuests < 1 || currentGuests > maxGuests);
      }

      // Handle visibility logic
      let shouldBeVisible = true;
      let headingText = "Add dates for pricing";

      // Priority 0: If both dates are selected, hide heading immediately (even while waiting for validation)
      // This provides instant feedback when user selects dates
      if (datesSelected) {
        // Check if calendar query is still loading
        if (r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.isRequesting) {
          // Loading - hide heading while waiting
          shouldBeVisible = false;
        }
        // Check if we have calendar query results to validate
        else if (r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.status == 200 &&
          r.Load_Property_Details && r.Load_Property_Details.data) {

          // Check if dates are valid
          const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
          const minNights = r.Load_Property_Details.data.property.min_nights;

          let allAvailable = true;
          let consecutiveAvailableDays = 0;
          let meetsMinNights = false;

          for (let i = 0; i < propertyCalendarRange.length; i++) {
            if (propertyCalendarRange[i].status === "available") {
              consecutiveAvailableDays++;
              if (consecutiveAvailableDays >= minNights) {
                meetsMinNights = true;
              }
            } else {
              consecutiveAvailableDays = 0;
              allAvailable = false;
            }
          }

          const datesValid = allAvailable && meetsMinNights;

          // If dates are valid but guests are wrong, show "Change Guests"
          if (datesValid && hasGuestError) {
            shouldBeVisible = true;
            headingText = "Change Guests";
          }
          // If dates are invalid, show "Change Dates"
          else if (!datesValid) {
            shouldBeVisible = true;
            headingText = "Change Dates";
          }
          // Both dates and guests are valid - hide heading
          else {
            shouldBeVisible = false;
          }
        }
        // Dates selected but calendar query hasn't run yet or failed
        else if (!r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.hasRequested) {
          // Hide heading immediately when both dates are selected (optimistic UI)
          shouldBeVisible = false;
        }
        // Calendar query failed
        else if (r.Load_Property_Calendar_Query.hasRequested && r.Load_Property_Calendar_Query.status != 200) {
          shouldBeVisible = true;
          headingText = "Change Dates";
        }
      }
      // No dates selected - show "Add dates for pricing"
      else {
        shouldBeVisible = true;
        headingText = "Add dates for pricing";
      }

      // Apply visibility and text to all heading elements (desktop and mobile)
      addDatesHeadings.forEach(heading => {
        if (heading) {
          heading.style.display = shouldBeVisible ? 'flex' : 'none';
          heading.textContent = headingText;
        }
      });

      // Update total container visibility - show only when heading is hidden and dates are valid
      if (window.updateReservationTotalContainer) {
        window.updateReservationTotalContainer();
      }
    }

    // Make updateAddDatesHeading available globally
    window.updateAddDatesHeading = updateAddDatesHeading;

    // Handle boat functionality when boatId is in URL params
    function handleBoatFunctionality() {
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');
      const selectedBoatBlocks = document.querySelectorAll('[data-element="selectedBoatBlock"]');

      if (boatId) {
        // Show the selected boat blocks
        selectedBoatBlocks.forEach(block => {
          if (block) {
            block.style.display = 'block';
          }
        });

        // Show listing-extras pricing (for boat selection)
        const listingOnlyPricingSections = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
        const listingExtrasPricingSections = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

        listingOnlyPricingSections.forEach(section => {
          if (section) {
            section.style.display = 'none';
          }
        });

        listingExtrasPricingSections.forEach(section => {
          if (section) {
            section.style.display = 'flex';
          }
        });

        // Variable to store selected boat data directly (not as Wized request)
        window.selectedBoatData = null;

        // Make direct fetch request for boat data
        fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/boats/${boatId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(async (boatData) => {
            // Store the boat data directly
            window.selectedBoatData = boatData;

            populateSelectedBoatBlock();

            try {
              // Wait for calendar data to be available before updating pricing
              await Wized.requests.waitFor('Load_Property_Calendar_Query');
              updatePricingDisplayForExtras();
            } catch (error) {
              // Still try to update pricing even if wait fails
              updatePricingDisplayForExtras();
            }
          })
          .catch(error => {
          });
      } else {
        // Hide the selected boat blocks when no boatId
        window.selectedBoatData = null; // Clear the boat data when no boat is selected

        selectedBoatBlocks.forEach(block => {
          if (block) {
            block.style.display = 'none';
          }
        });

        // Check if any extras are still selected
        const hasAnyExtras = window.hasAnyExtrasSelected();

        // Show listing-only pricing only if no extras are selected
        const listingOnlyPricingSections = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
        const listingExtrasPricingSections = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

        listingOnlyPricingSections.forEach(section => {
          if (section) {
            section.style.display = hasAnyExtras ? 'none' : 'flex';
          }
        });

        listingExtrasPricingSections.forEach(section => {
          if (section) {
            section.style.display = hasAnyExtras ? 'flex' : 'none';
          }
        });

        // Update pricing display for remaining extras
        if (hasAnyExtras && window.updatePricingDisplayForExtras) {
          window.updatePricingDisplayForExtras();
        }
      }
    }

    // Make handleBoatFunctionality globally available
    window.handleBoatFunctionality = handleBoatFunctionality;

    // Populate the selectedBoatBlock elements with boat data
    function populateSelectedBoatBlock() {
      const n = Wized.data.n;

      if (!window.selectedBoatData) {
        return;
      }

      // Update selectedBoatBlock_image
      const imageElements = document.querySelectorAll('[data-element="selectedBoatBlock_image"]');
      if (imageElements.length > 0) {
        imageElements.forEach(element => {
          if (element) {
            if (window.selectedBoatData.photos && window.selectedBoatData.photos[0]) {
              element.src = window.selectedBoatData.photos[0].image.url;
              // Optimize image loading
              element.loading = 'eager';
              element.fetchPriority = 'high';
              element.style.display = 'block';
            } else {
              element.style.display = 'none';
            }
          }
        });
      }

      // Update selectedBoatBlock_name
      const nameElements = document.querySelectorAll('[data-element="selectedBoatBlock_name"]');
      if (nameElements.length > 0) {
        nameElements.forEach((element) => {
          if (element) {
            // Clear any stored full text to use new name
            delete element.dataset.fullText;
            element.textContent = window.selectedBoatData.name;
            truncateToFit(element);
          }
        });
      }

      // Update selectedBoatBlock_companyName
      const companyNameElements = document.querySelectorAll('[data-element="selectedBoatBlock_companyName"]');
      if (companyNameElements.length > 0) {
        // Debug: Log the full boat data to see company name structure
        console.log('[Boat CompanyName Debug] Full selectedBoatData:', window.selectedBoatData);
        console.log('[Boat CompanyName Debug] _boat_company:', window.selectedBoatData?._boat_company);
        console.log('[Boat CompanyName Debug] All keys:', Object.keys(window.selectedBoatData || {}));

        // Try multiple data paths for company name
        const companyName = window.selectedBoatData?._boat_company?.name
          || window.selectedBoatData?.companyName
          || window.selectedBoatData?.company_name
          || window.selectedBoatData?.boatCompanyName
          || '';

        console.log('[Boat CompanyName Debug] Resolved companyName:', companyName);

        if (companyName) {
          companyNameElements.forEach(element => {
            if (element) {
              element.textContent = companyName;
            }
          });
        }
      }

      // Update selectedBoatBlock_datesDelivery
      const datesDeliveryElements = document.querySelectorAll('[data-element="selectedBoatBlock_datesDelivery"]');
      if (datesDeliveryElements.length > 0) {
        // Read directly from URL parameters instead of Wized data store
        const urlParams = new URLSearchParams(window.location.search);
        const rawDates = urlParams.get('boatDates') || n.parameter.boatDates || "";
        const boatDelivery = urlParams.get('boatDelivery') === "true" || n.parameter.boatDelivery === "true";

        // Decode if needed
        const decodedDates = decodeURIComponent(rawDates);
        const boatDates = decodedDates.split(",").filter(Boolean);

        if (boatDates.length === 0) {
          datesDeliveryElements.forEach(element => {
            if (element) {
              element.textContent = "";
            }
          });
          return;
        }

        const start = boatDates[0];
        const end = boatDates[boatDates.length - 1];

        // Helper to get month abbreviation from MM
        const getMonthAbbr = (dateStr) => {
          const month = parseInt(dateStr.split("-")[1], 10);
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months[month - 1];
        };

        // Extract month and day
        const startMonth = getMonthAbbr(start);
        const startDay = parseInt(start.split("-")[2], 10);
        const endMonth = getMonthAbbr(end);
        const endDay = parseInt(end.split("-")[2], 10);

        let formatted = "";
        if (boatDates.length === 1) {
          formatted = `${startMonth} ${startDay}`;
        } else if (startMonth === endMonth) {
          formatted = `${startMonth} ${startDay} - ${endDay}`;
        } else {
          formatted = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        }

        if (boatDelivery) {
          formatted += " - Delivered to dock";
        }

        datesDeliveryElements.forEach(element => {
          if (element) {
            element.textContent = formatted;
          }
        });
      } else {
      }
    }



    // Initialize boat functionality on page load
    handleBoatFunctionality();

    // Setup edit and remove boat handlers
    function setupBoatHandlers() {
      // Edit boat handler
      const editButtons = document.querySelectorAll('[data-element="editSelectedBoat"]');
      editButtons.forEach(editButton => {
        if (editButton) {
          editButton.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const boatId = urlParams.get('boatId');

            if (boatId) {
              // Open boat modal in details view for the selected boat
              const modal = document.querySelector('[data-element="addBoatModal"]');
              const selectWrapper = document.querySelector('[data-element="addBoatModal_selectBoatWrapper"]');
              const detailsWrapper = document.querySelector('[data-element="addBoatModal_boatDetailsWrapper"]');

              if (modal && selectWrapper && detailsWrapper) {
                modal.style.display = 'flex';
                selectWrapper.style.display = 'none';
                detailsWrapper.style.display = 'flex';

                // Prevent body scroll when modal is open
                document.body.classList.add('no-scroll');

                // Wait for boatRentalService to be available and trigger boat details loading
                const waitForService = () => {
                  if (window.boatRentalService && window.boatRentalService.handleEditBoat) {
                    // Use the new edit method that fetches boat data and opens to details view
                    window.boatRentalService.handleEditBoat(boatId);
                  } else {
                    // If service not ready, wait a bit and try again
                    setTimeout(waitForService, 100);
                  }
                };
                waitForService();
              }
            }
          });
        }
      });

      // Remove boat handler
      const removeButtons = document.querySelectorAll('[data-element="removeSelectedBoat"]');
      removeButtons.forEach(removeButton => {
        if (removeButton) {
          removeButton.addEventListener('click', () => {
            // Use the proper removal function to clean up ALL boat parameters
            if (window.removeBoatFromReservation) {
              window.removeBoatFromReservation();
            }

            // Trigger other updates if available
            if (window.updateBoatVisibility) window.updateBoatVisibility();
            if (window.updateListingOnlyPricing) window.updateListingOnlyPricing();
            if (window.updateReservationTotalContainer) window.updateReservationTotalContainer();
            if (window.updateSelectedBoatBlockVisibility) window.updateSelectedBoatBlockVisibility();
            if (window.handleBoatFunctionality) window.handleBoatFunctionality();

            // Update pricing display for remaining extras
            if (window.updatePricingDisplayForExtras) {
              window.updatePricingDisplayForExtras();
            }
          });
        }
      });
    }

    // Initialize boat handlers
    setupBoatHandlers();

    // Handle boat functionality on initial load
    handleBoatFunctionality();

    // Also handle boat functionality when URL parameters change
    window.addEventListener('popstate', handleBoatFunctionality);
  });
});



// This section handles the display of reservation information
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wized
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {

    // Function to update reservation total container visibility
    function updateReservationTotalContainer() {
      const containerElements = document.querySelectorAll('[data-element="Listing_Reservation_Amount_Total_Container"]');
      if (!containerElements || containerElements.length === 0) return;

      const r = Wized.data.r;
      const n = Wized.data.n;

      // First check if dates are actually selected
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";
      const datesSelected = hasCheckin && hasCheckout;

      // If no dates are selected, hide the container
      if (!datesSelected) {
        containerElements.forEach(containerElement => {
          if (containerElement) {
            containerElement.style.display = 'none';
          }
        });
        return;
      }

      // Check if required data exists
      if (!r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Details || !r.Load_Property_Details.data ||
        !r.Load_Property_Details.data.property) {
        return;
      }

      const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
      const minNights = r.Load_Property_Details.data.property.min_nights;

      let allAvailable = true;
      let meetsMinNights = true;

      // Calculate the total number of days available in a row
      let consecutiveAvailableDays = 0;
      let previousDayAvailable = false;

      for (let i = 0; i < propertyCalendarRange.length; i++) {
        if (propertyCalendarRange[i].status === "available") {
          if (previousDayAvailable) {
            consecutiveAvailableDays++;
          } else {
            consecutiveAvailableDays = 1;  // Restart counting as this day is available
            previousDayAvailable = true;
          }
        } else {
          // Check if the previous sequence of available days met the minimum nights requirement
          if (consecutiveAvailableDays < minNights) {
            meetsMinNights = false;
          }
          consecutiveAvailableDays = 0;  // Reset the count as this day is not available
          allAvailable = false;
          previousDayAvailable = false;
        }
      }

      // Final check at the end of the loop to catch cases where the last days are available and not followed by an unavailable day
      if (consecutiveAvailableDays < minNights && previousDayAvailable) {
        meetsMinNights = false;
      }

      // The final return statement checks both conditions
      const currentGuests = n && n.parameter ? n.parameter.guests : 1;
      const maxGuests = r.Load_Property_Details.data.property.num_guests;
      const shouldShow = allAvailable && meetsMinNights && (maxGuests >= currentGuests);

      // Update all container elements (desktop and mobile)
      containerElements.forEach(containerElement => {
        if (containerElement) {
          containerElement.style.display = shouldShow ? 'flex' : 'none';
        }
      });
    }

    // Function to update reservation total display
    function updateReservationTotal() {
      // Don't update if extras are selected - let the extras pricing handle it
      if (hasAnyExtrasSelected()) {
        return;
      }

      const totalElements = document.querySelectorAll('[data-element="Reservation_Total"]');
      const totalAmountElements = document.querySelectorAll('[data-element="Reservation_TotalAmount"]');

      const r = Wized.data.r;

      // Check if required data exists
      if (!r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Calendar_Query.data.dateRange_totalPrice) {
        return;
      }

      const totalPrice = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_totalPrice);
      const formattedPrice = "$" + totalPrice.toLocaleString();

      // Update all total elements (desktop and mobile)
      totalElements.forEach(element => {
        if (element) {
          element.textContent = formattedPrice;
        }
      });

      totalAmountElements.forEach(element => {
        if (element) {
          element.textContent = formattedPrice;
        }
      });
    }

    // Function to update selected boat block visibility
    function updateSelectedBoatBlockVisibility() {
      const selectedBoatBlocks = document.querySelectorAll('[data-element="selectedBoatBlock"]');
      if (!selectedBoatBlocks || selectedBoatBlocks.length === 0) return;

      // Use URL parameters as source of truth
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');

      // Show/hide all boat blocks (desktop and mobile)
      selectedBoatBlocks.forEach(block => {
        if (block) {
          if (boatId) {
            block.style.display = 'flex';
          } else {
            block.style.display = 'none';
          }
        }
      });
    }

    // Function to update add boat button visibility
    function updateAddBoatButtonVisibility() {
      const addBoatButtons = document.querySelectorAll('[data-element="addBoatButton"]');
      if (!addBoatButtons || addBoatButtons.length === 0) return;

      // Use URL parameters as source of truth
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');

      // Show/hide all boat buttons (desktop and mobile)
      addBoatButtons.forEach(button => {
        if (button) {
          if (!boatId) {
            button.style.display = 'flex';
          } else {
            button.style.display = 'none';
          }
        }
      });
    }

    // Function to update all boat-related visibility
    function updateBoatVisibility() {
      updateSelectedBoatBlockVisibility();
      updateAddBoatButtonVisibility();
    }

    // Function to update listing query price details visibility
    function updateListingQueryPriceDetailsVisibility() {
      const priceDetailsElement = document.querySelector('[data-element="Listing_Query_Price_Details"]');
      if (!priceDetailsElement) return;

      const r = Wized.data.r;
      const n = Wized.data.n;

      // Check if required data exists
      if (!r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Details || !r.Load_Property_Details.data ||
        !r.Load_Property_Details.data.property) {
        priceDetailsElement.style.display = 'none';
        return;
      }

      const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
      const minNights = r.Load_Property_Details.data.property.min_nights;

      let allAvailable = true;
      let meetsMinNights = true;

      // Calculate the total number of days available in a row
      let consecutiveAvailableDays = 0;
      let previousDayAvailable = false;

      for (let i = 0; i < propertyCalendarRange.length; i++) {
        if (propertyCalendarRange[i].status === "available") {
          if (previousDayAvailable) {
            consecutiveAvailableDays++;
          } else {
            consecutiveAvailableDays = 1;  // Restart counting as this day is available
            previousDayAvailable = true;
          }
        } else {
          // Check if the previous sequence of available days met the minimum nights requirement
          if (consecutiveAvailableDays < minNights) {
            meetsMinNights = false;
          }
          consecutiveAvailableDays = 0;  // Reset the count as this day is not available
          allAvailable = false;
          previousDayAvailable = false;
        }
      }

      // Final check at the end of the loop to catch cases where the last days are available and not followed by an unavailable day
      if (consecutiveAvailableDays < minNights && previousDayAvailable) {
        meetsMinNights = false;
      }

      // The final return statement checks both conditions including guests validation
      const currentGuests = n && n.parameter ? n.parameter.guests : 0;
      const maxGuests = r.Load_Property_Details.data.property.num_guests;
      const shouldShow = allAvailable && meetsMinNights && (currentGuests <= maxGuests) && (currentGuests != 0);

      priceDetailsElement.style.display = shouldShow ? 'block' : 'none';
    }

    // Function to handle listing-only pricing display (no extras selected)
    function updateListingOnlyPricing() {
      const n = Wized.data.n;
      const r = Wized.data.r;

      // Check if there's no extras selected
      const hasNoExtras = !window.hasAnyExtrasSelected();

      // Show/hide appropriate sections
      const listingOnlySections = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
      const listingExtrasSections = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

      listingOnlySections.forEach(section => {
        if (section) {
          section.style.display = hasNoExtras ? 'flex' : 'none';
        }
      });

      listingExtrasSections.forEach(section => {
        if (section) {
          section.style.display = hasNoExtras ? 'none' : 'flex';
        }
      });

      // Only update content if no extras are selected and data exists
      if (!hasNoExtras || !r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data) {
        return;
      }

      // Update Nightly Price Text
      const nightlyPriceTextElements = document.querySelectorAll('[data-element="Nightly_Price_Text"]');
      if (nightlyPriceTextElements.length > 0 && n.parameter.checkin && n.parameter.checkout) {
        const checkInDate = n.parameter.checkin;
        const checkOutDate = n.parameter.checkout;

        // Parse the dates to milliseconds
        const checkInMillis = new Date(checkInDate).getTime();
        const checkOutMillis = new Date(checkOutDate).getTime();

        // Calculate the difference in milliseconds
        const differenceMillis = Math.abs(checkOutMillis - checkInMillis);

        // Convert milliseconds to days
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const differenceDays = Math.floor(differenceMillis / millisecondsPerDay);

        // Calculate nightly rate
        const nightsTotal = r.Load_Property_Calendar_Query.data.dateRange_nightsTotal;
        const nightlyRate = Math.floor(nightsTotal / differenceDays);

        // Update all nightly price text elements (desktop and mobile)
        nightlyPriceTextElements.forEach(element => {
          if (element) {
            element.textContent = `$${nightlyRate} x ${differenceDays} nights`;
          }
        });
      }

      // Update Nightly Price Amount
      const nightlyPriceAmountElements = document.querySelectorAll('[data-element="Nightly_Price_Amount"]');
      if (nightlyPriceAmountElements.length > 0 && r.Load_Property_Calendar_Query.data.dateRange_nightsTotal) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_nightsTotal);
        nightlyPriceAmountElements.forEach(element => {
          if (element) {
            element.textContent = `$${amount.toLocaleString()}`;
          }
        });
      }

      // Update Cleaning Fee Amount
      const cleaningFeeAmountElements = document.querySelectorAll('[data-element="Cleaning_Fee_Amount"]');
      if (cleaningFeeAmountElements.length > 0 && r.Load_Property_Calendar_Query.data.dateRange_cleaningFee) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_cleaningFee);
        cleaningFeeAmountElements.forEach(element => {
          if (element) {
            element.textContent = `$${amount.toLocaleString()}`;
          }
        });
      }

      // Update Service Fee Amount
      const serviceFeeAmountElements = document.querySelectorAll('[data-element="Service_Fee_Amount"]');
      if (serviceFeeAmountElements.length > 0 && r.Load_Property_Calendar_Query.data.dateRange_serviceFee) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_serviceFee);
        serviceFeeAmountElements.forEach(element => {
          if (element) {
            element.textContent = `$${amount.toLocaleString()}`;
          }
        });
      }

      // Update Taxes Amount
      const taxesAmountElements = document.querySelectorAll('[data-element="Taxes_Amount"]');
      if (taxesAmountElements.length > 0) {
        const data = r.Load_Property_Calendar_Query.data || {};
        const salesSurTax = parseFloat(data.dateRange_taxFee_salesSurTax) || 0;
        const salesTax = parseFloat(data.dateRange_taxFee_salesTax) || 0;
        const totalTax = salesSurTax + salesTax;
        taxesAmountElements.forEach(element => {
          if (element) {
            element.textContent = `$${totalTax.toFixed().toLocaleString()}`;
          }
        });
      }

      // Update Reservation Total
      // Don't update if extras are selected - let the extras pricing handle it
      if (!hasAnyExtrasSelected()) {
        const reservationTotalElements = document.querySelectorAll('[data-element="Reservation_Total"]');
        const reservationTotalAmountElements = document.querySelectorAll('[data-element="Reservation_TotalAmount"]');
        if (r.Load_Property_Calendar_Query.data.dateRange_totalPrice) {
          const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_totalPrice);
          const formattedAmount = `$${amount.toLocaleString()}`;

          // Update all reservation total elements (desktop and mobile)
          reservationTotalElements.forEach(element => {
            if (element) {
              element.textContent = formattedAmount;
            }
          });

          reservationTotalAmountElements.forEach(element => {
            if (element) {
              element.textContent = formattedAmount;
            }
          });
        }
      } else {
      }

      // Update Free Cancellation Date Text
      const freeCancellationTextElements = document.querySelectorAll('[data-element="free_cancelation_date_text"]');

      if (freeCancellationTextElements.length > 0 && r.Load_Property_Details && r.Load_Property_Details.data) {
        const property = r.Load_Property_Details.data.property;
        const cancellationPolicy = property.cancellation_policy;

        if (!cancellationPolicy) {
          freeCancellationTextElements.forEach(element => {
            if (element) {
              element.textContent = "Non-refundable";
            }
          });
          return;
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const checkInDate = n.parameter.checkin;

        let cutoffDate;

        if (property.strict_cancellation_policy === true) {
          const strictSeconds = Number(property.strict_cancellation_policy_option || 0);
          cutoffDate = new Date(today.getTime() + strictSeconds * 1000);

          if (checkInDate < cutoffDate.toISOString().split("T")[0]) {
            freeCancellationTextElements.forEach(element => {
              if (element) {
                element.textContent = "The reservation dates selected are non-refundable";
              }
            });
            return;
          }
        } else {
          const cancellationPolicySeconds = Number(property.cancellation_policy_option || 0);
          const cancellationPolicyDays = cancellationPolicySeconds / (24 * 60 * 60);

          const [year, month, day] = checkInDate.split("-").map(Number);
          const checkInDateObj = new Date(year, month - 1, day);
          checkInDateObj.setDate(checkInDateObj.getDate() - Math.floor(cancellationPolicyDays));
          cutoffDate = checkInDateObj;

          if (todayStr > cutoffDate.toISOString().split("T")[0]) {
            freeCancellationTextElements.forEach(element => {
              if (element) {
                element.textContent = "The reservation dates selected are non-refundable";
              }
            });
            return;
          }
        }

        // Format the cutoff date
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const suffix = (d) => (d >= 11 && d <= 13) ? "th" : ["st", "nd", "rd"][((d % 10) - 1)] || "th";
        const cutoffYear = cutoffDate.getFullYear();
        const cutoffMonth = monthNames[cutoffDate.getMonth()];
        const cutoffDay = cutoffDate.getDate();
        const cutoffDaySuffix = suffix(cutoffDay);

        const isMoreThanOneYear = cutoffDate - today > 365 * 24 * 60 * 60 * 1000;

        if (isMoreThanOneYear) {
          freeCancellationTextElements.forEach(element => {
            if (element) {
              element.textContent = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
            }
          });
        } else {
          freeCancellationTextElements.forEach(element => {
            if (element) {
              element.textContent = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
            }
          });
        }
      }

      // Also update stay cancellation policy for extras view when data is available
      if (window.hasAnyExtrasSelected && window.hasAnyExtrasSelected()) {
        updateStayCancellationPolicy();
      }
    }

    // Listen for request completions and update displays
    Wized.on('requestend', (event) => {
      if (event.name === 'Load_Property_Calendar_Query' || event.name === 'Load_Property_Details') {
        updateReservationTotalContainer();
        updateReservationTotal();
        updateBoatVisibility();
        updateListingQueryPriceDetailsVisibility();
        updateListingOnlyPricing();
        updatePhoneReservationFooter();

        // NOTE: Extras validation is now handled by each service's areDatesValid() method
        // through handleExtrasWhenDatesCleared() in the centralized button visibility system
        // This prevents duplicate validation logic and timing conflicts

        // Update extras pricing when extras are selected and data is loaded
        if (window.hasAnyExtrasSelected && window.hasAnyExtrasSelected()) {
          updateStayCancellationPolicy();
          // Recalculate extras pricing with new date data
          if (window.updatePricingDisplayForExtras) {
            window.updatePricingDisplayForExtras();
          }
        }
      }
    });

    // Listen for URL parameter changes to update boat visibility
    Wized.on('requestend', (event) => {
      updateBoatVisibility();
    });

    // Listen for parameter changes
    const urlParams = new URLSearchParams(window.location.search);
    let lastBoatId = urlParams.get('boatId');

    // Check for URL changes periodically
    setInterval(() => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentBoatId = currentParams.get('boatId');

      if (currentBoatId !== lastBoatId) {
        lastBoatId = currentBoatId;
        updateBoatVisibility();
      }
    }, 100);

    // Initial update in case data is already loaded
    updateReservationTotalContainer();
    updateReservationTotal();
    updateBoatVisibility();
    updateListingQueryPriceDetailsVisibility();
    updateListingOnlyPricing();
    updatePhoneReservationFooter();

    // Initial update of stay cancellation policy for extras
    if (window.hasAnyExtrasSelected && window.hasAnyExtrasSelected()) {
      updateStayCancellationPolicy();
    }

    // Function to update phone reservation footer
    function updatePhoneReservationFooter() {
      const phoneFooterContainer = document.querySelector('[data-element="reservationFooter_datesDetailsContainer"]');
      if (!phoneFooterContainer) return;

      const r = Wized.data.r;
      const n = Wized.data.n;

      // Check if dates are actually selected
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";
      const datesSelected = hasCheckin && hasCheckout;

      // Show/hide footer based on date selection
      if (!datesSelected) {
        phoneFooterContainer.style.display = 'none';
        return;
      }

      // Check if we have valid data and dates are available
      let shouldShow = false;
      if (r && r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.data &&
        r.Load_Property_Details && r.Load_Property_Details.data &&
        r.Load_Property_Details.data.property) {

        const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
        const minNights = r.Load_Property_Details.data.property.min_nights;

        let allAvailable = true;
        let consecutiveAvailableDays = 0;
        let meetsMinNights = false;

        for (let i = 0; i < propertyCalendarRange.length; i++) {
          if (propertyCalendarRange[i].status === "available") {
            consecutiveAvailableDays++;
            if (consecutiveAvailableDays >= minNights) {
              meetsMinNights = true;
            }
          } else {
            consecutiveAvailableDays = 0;
            allAvailable = false;
          }
        }

        const currentGuests = n && n.parameter ? n.parameter.guests : 1;
        const maxGuests = r.Load_Property_Details.data.property.num_guests;
        shouldShow = allAvailable && meetsMinNights && (maxGuests >= currentGuests) && (currentGuests >= 1);
      }

      phoneFooterContainer.style.display = shouldShow ? 'flex' : 'none';

      if (!shouldShow) return;

      // Update phone total description
      updatePhoneTotalDescription();

      // Update phone dates display
      updatePhoneDatesDisplay();

      // Update phone cancellation text
      updatePhoneCancellationText();
    }

    // Function to update phone total description
    function updatePhoneTotalDescription() {
      const phoneDescriptionElements = document.querySelectorAll('[data-element="Reservation_Total_phoneTextDescription"]');
      if (!phoneDescriptionElements || phoneDescriptionElements.length === 0) return;

      // Check what extras are selected
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');
      const hasAnyExtras = window.hasAnyExtrasSelected ? window.hasAnyExtrasSelected() : false;

      // Check for fishing charters
      const hasFishingCharters = window.fishingCharterService ? window.fishingCharterService.hasAnyFishingCharters() : false;

      let descriptionText = "total after taxes";

      if (hasAnyExtras || boatId || hasFishingCharters) {
        let extraTypes = [];
        extraTypes.push("home");

        if (boatId) {
          extraTypes.push("boat");
        }

        if (hasFishingCharters) {
          extraTypes.push("charter");
        }

        // Check for other extras (excluding boat and charter since we handle them separately)
        if (hasAnyExtras && window.getSelectedExtrasTypes) {
          const otherExtras = window.getSelectedExtrasTypes();
          extraTypes = extraTypes.concat(otherExtras.filter(type => type !== "boat" && type !== "charter"));
        }

        descriptionText = `total (${extraTypes.join(" + ")})`;
      }

      phoneDescriptionElements.forEach(element => {
        if (element) {
          element.textContent = descriptionText;
        }
      });
    }

    // Make function globally available
    window.updatePhoneTotalDescription = updatePhoneTotalDescription;

    // Function to update phone dates display
    function updatePhoneDatesDisplay() {
      const phoneDatesElements = document.querySelectorAll('[data-element="Reservation_Dates_PhoneFooter"]');
      if (!phoneDatesElements || phoneDatesElements.length === 0) return;

      const n = Wized.data.n;
      if (!n || !n.parameter || !n.parameter.checkin || !n.parameter.checkout) return;

      const checkInDate = n.parameter.checkin;
      const checkOutDate = n.parameter.checkout;
      const guests = n.parameter.guests || 1;

      // Format dates
      const formatDateForPhone = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        return { month, day, year };
      };

      const checkIn = formatDateForPhone(checkInDate);
      const checkOut = formatDateForPhone(checkOutDate);

      let formattedDates = "";
      if (checkIn.month === checkOut.month && checkIn.year === checkOut.year) {
        // Same month: "May 8 - 15, 2026"
        formattedDates = `${checkIn.month} ${checkIn.day} - ${checkOut.day}, ${checkIn.year}`;
      } else if (checkIn.year === checkOut.year) {
        // Same year: "May 25 - Jun 2, 2026"
        formattedDates = `${checkIn.month} ${checkIn.day} - ${checkOut.month} ${checkOut.day}, ${checkIn.year}`;
      } else {
        // Different years: "Dec 25, 2025 - Jan 2, 2026"
        formattedDates = `${checkIn.month} ${checkIn.day}, ${checkIn.year} - ${checkOut.month} ${checkOut.day}, ${checkOut.year}`;
      }

      const guestText = guests === 1 ? "1 Guest" : `${guests} Guests`;
      const fullText = `${formattedDates} • ${guestText}`;

      phoneDatesElements.forEach(element => {
        if (element) {
          element.textContent = fullText;
        }
      });
    }

    // Function to update phone cancellation text
    function updatePhoneCancellationText() {
      const phoneCancellationElements = document.querySelectorAll('[data-element="free_cancelation_date_text_phone"]');
      if (!phoneCancellationElements || phoneCancellationElements.length === 0) return;

      const r = Wized.data.r;
      const n = Wized.data.n;

      if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data) return;

      const property = r.Load_Property_Details.data.property;
      const cancellationPolicy = property.cancellation_policy;

      // Check if any extras are selected
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');
      const hasAnyExtras = window.hasAnyExtrasSelected ? window.hasAnyExtrasSelected() : false;
      const hasExtras = hasAnyExtras || boatId;

      let cancellationText = "";

      if (!cancellationPolicy) {
        cancellationText = "Non-refundable";
      } else {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const checkInDate = n.parameter.checkin;

        let cutoffDate;

        if (property.strict_cancellation_policy === true) {
          const strictSeconds = Number(property.strict_cancellation_policy_option || 0);
          cutoffDate = new Date(today.getTime() + strictSeconds * 1000);

          if (checkInDate < cutoffDate.toISOString().split("T")[0]) {
            cancellationText = "The reservation dates selected are non-refundable";
          }
        } else {
          const cancellationPolicySeconds = Number(property.cancellation_policy_option || 0);
          const cancellationPolicyDays = cancellationPolicySeconds / (24 * 60 * 60);

          const [year, month, day] = checkInDate.split("-").map(Number);
          const checkInDateObj = new Date(year, month - 1, day);
          checkInDateObj.setDate(checkInDateObj.getDate() - Math.floor(cancellationPolicyDays));
          cutoffDate = checkInDateObj;

          if (todayStr > cutoffDate.toISOString().split("T")[0]) {
            cancellationText = "The reservation dates selected are non-refundable";
          }
        }

        if (!cancellationText) {
          // Format the cutoff date
          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];
          const suffix = (d) => (d >= 11 && d <= 13) ? "th" : ["st", "nd", "rd"][((d % 10) - 1)] || "th";
          const cutoffYear = cutoffDate.getFullYear();
          const cutoffMonth = monthNames[cutoffDate.getMonth()];
          const cutoffDay = cutoffDate.getDate();
          const cutoffDaySuffix = suffix(cutoffDay);

          const isMoreThanOneYear = cutoffDate - today > 365 * 24 * 60 * 60 * 1000;

          if (isMoreThanOneYear) {
            cancellationText = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
          } else {
            cancellationText = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
          }
        }
      }

      // Add "stay: " prefix if extras are selected
      if (hasExtras && cancellationText) {
        cancellationText = `Stay: ${cancellationText}`;
      }

      phoneCancellationElements.forEach(element => {
        if (element) {
          element.textContent = cancellationText;
        }
      });
    }

    // Make functions globally available
    window.updateReservationTotalContainer = updateReservationTotalContainer;
    window.updateReservationTotal = updateReservationTotal;
    window.updateSelectedBoatBlockVisibility = updateSelectedBoatBlockVisibility;
    window.updateAddBoatButtonVisibility = updateAddBoatButtonVisibility;
    window.updateBoatVisibility = updateBoatVisibility;
    window.updateListingQueryPriceDetailsVisibility = updateListingQueryPriceDetailsVisibility;
    window.updateListingOnlyPricing = updateListingOnlyPricing;
    window.updatePhoneReservationFooter = updatePhoneReservationFooter;
  });
});







// Global functions for ListingExtras_Query_Price_Details functionality
// These functions handle boat pricing calculations and display updates

// Update pricing display when extras (boat or fishing charter) are selected
async function updatePricingDisplayForExtras() {

  const listingOnlyPricingSections = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
  const listingExtrasPricingSections = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

  // Check if any extras are actually selected
  const hasExtras = window.hasAnyExtrasSelected();

  if (!hasExtras) {
    // No extras selected - show listing-only pricing
    listingOnlyPricingSections.forEach(section => {
      if (section) {
        section.style.display = 'flex';
      }
    });

    listingExtrasPricingSections.forEach(section => {
      if (section) {
        section.style.display = 'none';
      }
    });
    return;
  }

  // Extras are selected - show extras pricing
  listingOnlyPricingSections.forEach(section => {
    if (section) {
      section.style.display = 'none';
    }
  });

  if (listingExtrasPricingSections.length > 0) {
    listingExtrasPricingSections.forEach(section => {
      if (section) {
        section.style.display = 'flex';
      }
    });

    const r = window.Wized.data.r;
    const n = window.Wized.data.n;

    if (!r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data) {
      return;
    }

    try {
      // Calculate stay pricing components
      const stayPricing = calculateStayPricing(r);

      // Calculate boat pricing components
      const boatPricing = window.selectedBoatData ? calculateBoatPricing(window.selectedBoatData) : { totalWithFees: 0 };

      // Calculate fishing charter pricing components
      const fishingCharterPricing = await calculateFishingCharterPricing();

      // Calculate boat taxes only (stay taxes already included in stayPricing.total)
      const boatTaxableAmount = window.selectedBoatData && window.selectedBoatData._boat_company.integration_type !== 'Manual'
        ? boatPricing.totalWithFees
        : 0;
      const combinedTaxes = calculateCombinedTaxes(r, boatTaxableAmount);

      // Calculate grand total
      // Note: stayPricing.total already includes stay taxes (from dateRange_totalPrice)
      // So we only add boat taxes, not combinedTaxes.total which includes stay taxes again
      const extrasTotalWithFees = boatPricing.totalWithFees + fishingCharterPricing.totalWithFees;
      const grandTotal = stayPricing.total + extrasTotalWithFees + combinedTaxes.boat;

      // Update all pricing elements
      updatePricingElements(stayPricing, boatPricing, fishingCharterPricing, combinedTaxes, grandTotal);

      // Update stay cancellation policy for extras view (data is guaranteed to be available here)
      updateExtrasCancellationPolicies(r, n);

    } catch (error) {

    }
  } else {
  }
}

// Calculate stay pricing (use API's dateRange_totalPrice which includes ALL fees and taxes)
function calculateStayPricing(r) {
  const nightlyTotal = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_nightsTotal || 0);
  const cleaningFee = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_cleaningFee || 0);
  const serviceFee = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_serviceFee || 0);
  const dateRangeTotalPrice = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_totalPrice || 0);
  const totalWithoutTaxes = nightlyTotal + cleaningFee + serviceFee;

  return {
    nightly: nightlyTotal,
    cleaning: cleaningFee,
    service: serviceFee,
    subtotal: totalWithoutTaxes,  // For display purposes (without taxes)
    total: dateRangeTotalPrice     // For grand total calculation (includes stay taxes)
  };
}

// Calculate boat pricing based on selected dates and boat data
function calculateBoatPricing(boatData) {

  if (!boatData) {
    return { basePrice: 0, serviceFee: 0, deliveryFee: 0, publicDockFee: 0, totalWithFees: 0 };
  }

  // Get boat dates and delivery preference directly from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const rawDates = urlParams.get('boatDates') || "";
  const boatDelivery = urlParams.get('boatDelivery') === "true";

  // Parse boat dates
  const decodedDates = decodeURIComponent(rawDates);
  const boatDates = decodedDates.split(",").filter(Boolean);
  const numDates = boatDates.length;


  if (numDates === 0) {
    return { basePrice: 0, serviceFee: 0, deliveryFee: 0, publicDockFee: 0, totalWithFees: 0 };
  }

  // Calculate base price based on rental duration
  let basePrice = calculateBoatBasePrice(boatData, numDates);

  // Calculate public dock delivery fee if applicable (BEFORE service fee calculation)
  let publicDockFee = 0;
  try {
    const r = window.Wized?.data?.r;

    if (r && r.Load_Property_Details && r.Load_Property_Details.data) {
      const listingCity = r.Load_Property_Details.data.property?.listing_city;

      if (listingCity && boatData._boat_company?.publicDockDeliveryDetails) {
        const listingCityLower = listingCity.toLowerCase().trim();

        const publicDockDetails = boatData._boat_company.publicDockDeliveryDetails.find(
          detail => (detail.city || '').toLowerCase().trim() === listingCityLower
        );

        if (publicDockDetails && publicDockDetails.fee) {
          publicDockFee = Number(publicDockDetails.fee) || 0;
        }
      } else {
      }
    }
  } catch (error) {
  }

  // Calculate service fee on (basePrice + publicDockFee) - skip if integrationType is 'Manual'
  let serviceFee = 0;
  if (boatData._boat_company.integration_type !== 'Manual') {
    const serviceFeeRate = boatData._boat_company?.serviceFee || 0;
    serviceFee = (basePrice + publicDockFee) * serviceFeeRate;
  }

  // Calculate delivery fee if delivery is selected
  const deliveryFee = boatDelivery ? (boatData._boat_company?.deliveryFee || 0) : 0;

  // Calculate total with fees
  const totalWithFees = basePrice + publicDockFee + serviceFee + deliveryFee;

  return {
    basePrice: Math.round(basePrice),
    serviceFee: Math.round(serviceFee),
    deliveryFee: Math.round(deliveryFee),
    publicDockFee: Math.round(publicDockFee),
    totalWithFees: Math.round(totalWithFees)
  };
}

// Calculate boat base price based on duration and pricing tiers
function calculateBoatBasePrice(boatData, numDates) {
  if (numDates === 0) return 0;

  // Handle single day or half day
  if (numDates === 1) {
    // Check if it's a half day rental
    const urlParams = new URLSearchParams(window.location.search);
    const lengthType = urlParams.get('boatLengthType') || 'full';

    if (lengthType === 'half') {
      return boatData.pricePerHalfDay || 0;
    } else {
      return boatData.pricePerDay || 0;
    }
  }

  // Handle weekly pricing (7 days)
  if (numDates === 7 && boatData.pricePerWeek) {
    return boatData.pricePerWeek;
  }

  // Handle monthly pricing (30+ days)
  if (numDates >= 30 && boatData.pricePerMonth) {
    const months = Math.floor(numDates / 30);
    const remainingDays = numDates % 30;
    const monthlyPrice = boatData.pricePerMonth * months;

    // Use weekly daily rate for remaining days if available
    const dailyRate = boatData.pricePerWeek ? (boatData.pricePerWeek / 7) : (boatData.pricePerDay || 0);
    return Math.round(monthlyPrice + (remainingDays * dailyRate));
  }

  // Handle multi-day pricing
  if (numDates > 7 && boatData.pricePerWeek) {
    // Use weekly daily rate for longer rentals
    const weeklyDailyRate = boatData.pricePerWeek / 7;
    return Math.round(numDates * weeklyDailyRate);
  }

  // Default to daily rate
  return numDates * (boatData.pricePerDay || 0);
}

// Calculate fishing charter pricing based on selected charters
async function calculateFishingCharterPricing() {
  if (!window.fishingCharterService) {
    return { totalWithFees: 0 };
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const allNumbers = window.fishingCharterService.getAllFishingCharterNumbers();

    if (allNumbers.length === 0) {
      // Clear cached data when no charters
      window.fishingCharterCancellationData = [];
      return { totalWithFees: 0 };
    }

    let totalPrice = 0;
    const cancellationData = []; // Cache charter data for cancellation policies

    // Calculate price for each selected fishing charter using URL parameters directly
    for (const number of allNumbers) {
      const charterId = urlParams.get(`fishingCharterId${number}`);
      const tripId = urlParams.get(`fishingCharterTripId${number}`);
      const guests = parseInt(urlParams.get(`fishingCharterGuests${number}`)) || 0;
      const dates = urlParams.get(`fishingCharterDates${number}`);
      const pickup = urlParams.get(`fishingCharterPickup${number}`);

      if (!charterId || !tripId) continue;

      try {
        // Fetch charter data to get pricing info
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/fishingcharters/${charterId}`);
        if (!response.ok) continue;

        const charter = await response.json();
        const selectedTrip = charter.tripOptions?.find(t => String(t.id) === String(tripId));

        if (selectedTrip) {
          // Cache charter data for cancellation policies
          cancellationData.push({
            number: number,
            charterId: charterId,
            tripId: tripId,
            charter: charter
          });

          let tripPrice = selectedTrip.price || 0;
          const basePeople = selectedTrip.pricePeople || 1;
          const additionalPersonRate = selectedTrip.pricePerAdditionalPerson || 0;

          // Calculate additional people cost
          if (guests > basePeople && additionalPersonRate > 0) {
            const additionalPeople = guests - basePeople;
            tripPrice += (additionalPeople * additionalPersonRate);
          }

          // Add private dock pickup fee if selected
          if (pickup === 'true' && charter.privateDockPickup && charter.privateDockPickupFee) {
            tripPrice += charter.privateDockPickupFee;
          }

          // Multiply by number of dates
          const datesList = dates ? dates.split(',').filter(Boolean) : [];
          if (datesList.length > 0) {
            tripPrice *= datesList.length;
          }

          // Apply service fee if integration type is not "Manual"
          if (charter.integration_type !== 'Manual' && charter.serviceFee) {
            tripPrice = tripPrice * (1 + charter.serviceFee);
          }

          totalPrice += tripPrice;
        }
      } catch (error) {

      }
    }

    // Cache the charter data for cancellation policies
    window.fishingCharterCancellationData = cancellationData;

    // Cache the charter data for cancellation policies
    window.fishingCharterCancellationData = cancellationData;

    return {
      totalWithFees: Math.round(totalPrice)
    };
  } catch (error) {

    window.fishingCharterCancellationData = [];
    return { totalWithFees: 0 };
  }
}

// Calculate combined taxes (stay + boat only, fishing charters not taxed)
function calculateCombinedTaxes(r, boatTotalWithFees) {
  // Get stay taxes from calendar query
  const stayData = r.Load_Property_Calendar_Query.data || {};
  const staySalesSurTax = parseFloat(stayData.dateRange_taxFee_salesSurTax) || 0;
  const staySalesTax = parseFloat(stayData.dateRange_taxFee_salesTax) || 0;
  const stayTaxes = staySalesSurTax + staySalesTax;

  // Calculate boat taxes only (7.5% of boat total with fees, fishing charters not taxed)
  const boatTaxRate = 0.075;
  const boatTaxes = boatTotalWithFees * boatTaxRate;

  return {
    stay: stayTaxes,
    boat: boatTaxes,
    total: stayTaxes + boatTaxes
  };
}

// Update all pricing elements in the DOM
function updatePricingElements(stayPricing, boatPricing, fishingCharterPricing, combinedTaxes, grandTotal) {


  // Update Stay Price Amount (use subtotal which excludes taxes)
  const stayPriceElements = document.querySelectorAll('[data-element="Stay_Price_Amount"]');
  stayPriceElements.forEach(element => {
    if (element) {
      element.textContent = `$${stayPricing.subtotal.toLocaleString()}`;
    }
  });

  // Show/hide and update Boat Price Container
  const boatPriceContainers = document.querySelectorAll('[data-element="Boat_Price_Container"]');
  const boatPriceElements = document.querySelectorAll('[data-element="Boat_Price_Amount"]');

  boatPriceContainers.forEach(container => {
    if (container) {
      if (boatPricing.totalWithFees > 0) {
        container.style.display = 'flex';
      } else {
        container.style.display = 'none';
      }
    }
  });

  boatPriceElements.forEach(element => {
    if (element && boatPricing.totalWithFees > 0) {
      element.textContent = `$${boatPricing.totalWithFees.toLocaleString()}`;
    }
  });

  // Show/hide and update Fishing Charter Price Container
  const fishingCharterPriceContainers = document.querySelectorAll('[data-element="FishingCharter_Price_Container"]');
  const fishingCharterPriceElements = document.querySelectorAll('[data-element="FishingCharter_Price_Amount"]');

  fishingCharterPriceContainers.forEach(container => {
    if (container) {
      if (fishingCharterPricing.totalWithFees > 0) {
        container.style.display = 'flex';
      } else {
        container.style.display = 'none';
      }
    }
  });

  fishingCharterPriceElements.forEach(element => {
    if (element && fishingCharterPricing.totalWithFees > 0) {
      element.textContent = `$${fishingCharterPricing.totalWithFees.toLocaleString()}`;
    }
  });

  // Update Combined Taxes Amount
  const taxesElements = document.querySelectorAll('[data-element="StayBoatTaxes_Amount"]');
  taxesElements.forEach(element => {
    if (element) {
      element.textContent = `$${Math.round(combinedTaxes.total).toLocaleString()}`;
    }
  });

  // Update Grand Total
  const grandTotalElements = document.querySelectorAll('[data-element="ReservationStayBoat_Total"]');
  grandTotalElements.forEach(element => {
    if (element) {
      element.textContent = `$${Math.round(grandTotal).toLocaleString()}`;
    }
  });

  // Also update the main Reservation_Total to show the combined total when extras are selected

  const reservationTotalElements = document.querySelectorAll('[data-element="Reservation_Total"]');
  reservationTotalElements.forEach(element => {
    if (element) {
      element.textContent = `$${Math.round(grandTotal).toLocaleString()}`;
    }
  });

  // Update phone reservation footer
  if (window.updatePhoneReservationFooter) {
    window.updatePhoneReservationFooter();
  }

  // Update cancellation policies for extras
  updateExtrasCancellationPolicies();
}

// Check if any extras (boat or fishing charters) are selected
function hasAnyExtrasSelected() {
  const urlParams = new URLSearchParams(window.location.search);
  const hasBoat = urlParams.get('boatId');

  // Check for fishing charters - fallback to direct URL check if service not available
  let hasFishingCharters = false;
  if (window.fishingCharterService) {
    hasFishingCharters = window.fishingCharterService.hasAnyFishingCharters();
  } else {
    // Fallback: check URL parameters directly
    for (const [key] of urlParams) {
      if (key.match(/^fishingCharterId\d+$/)) {
        hasFishingCharters = true;
        break;
      }
    }
  }

  return !!(hasBoat || hasFishingCharters);
}

// Update cancellation policies for extras (boat and fishing charters)
async function updateExtrasCancellationPolicies() {
  // Update stay cancellation policy (same as free_cancelation_date_text)
  updateStayCancellationPolicy();

  // Update boat cancellation policy
  updateBoatCancellationPolicy();

  // Update fishing charter cancellation policies
  await updateFishingCharterCancellationPolicies();
}

// Update stay cancellation policy for extras view
function updateStayCancellationPolicy() {

  const stayFreeCancellationElements = document.querySelectorAll('[data-element="stayFree_cancelation_date_text"]');

  if (!stayFreeCancellationElements || stayFreeCancellationElements.length === 0) return;

  const r = window.Wized?.data?.r;
  const n = window.Wized?.data?.n;

  if (!r?.Load_Property_Details?.data?.property || !n?.parameter?.checkin) {
    stayFreeCancellationElements.forEach(element => {
      if (element) {
        element.textContent = "";
      }
    });
    return;
  }

  const property = r.Load_Property_Details.data.property;
  const cancellationPolicy = property.cancellation_policy;

  if (!cancellationPolicy) {
    stayFreeCancellationElements.forEach(element => {
      if (element) {
        element.textContent = "Stay: Non-refundable";
      }
    });
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const checkInDate = n.parameter.checkin;

  let cutoffDate;

  if (property.strict_cancellation_policy === true) {
    const strictSeconds = Number(property.strict_cancellation_policy_option || 0);
    cutoffDate = new Date(today.getTime() + strictSeconds * 1000);

    if (checkInDate < cutoffDate.toISOString().split("T")[0]) {
      stayFreeCancellationElements.forEach(element => {
        if (element) {
          element.textContent = "Stay: The reservation dates selected are non-refundable";
        }
      });
      return;
    }
  } else {
    const cancellationPolicySeconds = Number(property.cancellation_policy_option || 0);
    const cancellationPolicyDays = cancellationPolicySeconds / (24 * 60 * 60);

    const [year, month, day] = checkInDate.split("-").map(Number);
    const checkInDateObj = new Date(year, month - 1, day);
    checkInDateObj.setDate(checkInDateObj.getDate() - Math.floor(cancellationPolicyDays));
    cutoffDate = checkInDateObj;

    if (todayStr > cutoffDate.toISOString().split("T")[0]) {
      stayFreeCancellationElements.forEach(element => {
        if (element) {
          element.textContent = "Stay: The reservation dates selected are non-refundable";
        }
      });
      return;
    }
  }

  // Format the cutoff date
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const suffix = (d) => (d >= 11 && d <= 13) ? "th" : ["st", "nd", "rd"][((d % 10) - 1)] || "th";
  const cutoffYear = cutoffDate.getFullYear();
  const cutoffMonth = monthNames[cutoffDate.getMonth()];
  const cutoffDay = cutoffDate.getDate();
  const cutoffDaySuffix = suffix(cutoffDay);

  const currentYear = today.getFullYear();
  const isDifferentYear = cutoffYear !== currentYear;

  if (isDifferentYear) {
    stayFreeCancellationElements.forEach(element => {
      if (element) {
        element.textContent = `Stay: Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
      }
    });
  } else {
    stayFreeCancellationElements.forEach(element => {
      if (element) {
        element.textContent = `Stay: Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
      }
    });
  }
}

// Update boat cancellation policy
function updateBoatCancellationPolicy() {
  const boatCancellationContainers = document.querySelectorAll('[data-element="boatFree_cancelation_date"]');
  const boatCancellationTexts = document.querySelectorAll('[data-element="boatFree_cancelation_date_text"]');

  if (!boatCancellationContainers || boatCancellationContainers.length === 0 ||
    !boatCancellationTexts || boatCancellationTexts.length === 0) return;

  // Check if boat is selected
  if (!window.selectedBoatData) {
    boatCancellationContainers.forEach(container => {
      if (container) {
        container.style.display = 'none';
      }
    });
    return;
  }

  boatCancellationContainers.forEach(container => {
    if (container) {
      container.style.display = 'flex';
    }
  });

  const boat = window.selectedBoatData;
  const urlParams = new URLSearchParams(window.location.search);

  // Helper functions
  const isTrue = v => v === true || v === "true" || v === 1 || v === "1";
  const isFalse = v => v === false || v === "false" || v === 0 || v === "0";

  // Integration type (supports either data.integration_type or data._boat_company.integration_type)
  const integrationType = String(
    boat?.integration_type ?? boat?._boat_company?.integration_type ?? ""
  );
  const isManual = integrationType === "Manual";

  // 1) Explicit non-refundable
  if (isFalse(boat.cancellationPolicy)) {
    boatCancellationTexts.forEach(element => {
      if (element) {
        element.textContent = "Boat Rental: This reservation is non-refundable.";
      }
    });
    return;
  }

  // 2) Free-until window (from first boatDates date)
  if (isTrue(boat.cancellationPolicy)) {
    const days = Number(boat.cancellationPolicy_daysNotice);
    const raw = String(urlParams.get('boatDates') || "");
    const firstYMD = (() => {
      const s = decodeURIComponent(raw).split(",")[0]?.trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    })();

    if (!Number.isFinite(days) || days < 0 || !firstYMD) {
      // invalid config → manual note if applicable
      boatCancellationTexts.forEach(element => {
        if (element) {
          element.textContent = isManual ? "Boat Rental: Details communicated with boat rental upon payment." : "";
        }
      });
      return;
    }

    // UTC-safe subtract
    const [Y, M, D] = firstYMD.split("-").map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    dt.setUTCDate(dt.getUTCDate() - days);

    // format "Month Dth" or "Month Dth, YYYY" if different year
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const suffix = (n) =>
      (n % 10 === 1 && n % 100 !== 11) ? "st" :
        (n % 10 === 2 && n % 100 !== 12) ? "nd" :
          (n % 10 === 3 && n % 100 !== 13) ? "rd" : "th";

    const dayNum = dt.getUTCDate();
    const cancelYear = dt.getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();

    // Include year if cancellation date is in a different year
    const pretty = cancelYear !== currentYear
      ? `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}, ${cancelYear}`
      : `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}`;

    const baseMsg = `Free cancellation until ${pretty}.`;
    boatCancellationTexts.forEach(element => {
      if (element) {
        element.textContent = `Boat Rental: ${baseMsg}`;
      }
    });
    return;
  }

  // 3) Unknown/missing policy → manual note if applicable
  boatCancellationTexts.forEach(element => {
    if (element) {
      element.textContent = isManual ? "Boat Rental: Details communicated with boat rental." : "";
    }
  });
}

// Update fishing charter cancellation policies using existing data
async function updateFishingCharterCancellationPolicies() {
  const fishingCharterCancellationTemplates = document.querySelectorAll('[data-element="fishingCharterFree_cancelation_date"]');

  if (!fishingCharterCancellationTemplates || fishingCharterCancellationTemplates.length === 0) return;

  // Handle each template container separately (desktop and mobile)
  fishingCharterCancellationTemplates.forEach(template => {
    const container = template.parentElement;
    if (!container) return;

    // Remove any existing duplicated blocks (keep the template)
    const existingBlocks = container.querySelectorAll('[data-element="fishingCharterFree_cancelation_date"]');
    existingBlocks.forEach((block, index) => {
      if (index !== 0) { // Keep the template block
        block.remove();
      }
    });

    // Check if fishing charters are selected
    if (!window.fishingCharterService || !window.fishingCharterService.hasAnyFishingCharters()) {
      template.style.display = 'none';
      return;
    }

    // Use existing charter data from the cached calculation
    if (!window.fishingCharterCancellationData) {
      // If no cached data, hide for now
      template.style.display = 'none';
      return;
    }

    const selectedTrips = window.fishingCharterCancellationData;

    if (selectedTrips.length === 0) {
      template.style.display = 'none';
      return;
    }

    // Show and populate blocks for each selected fishing charter
    selectedTrips.forEach((tripData, index) => {
      let block;
      if (index === 0) {
        // Use the template block for the first fishing charter
        block = template;
      } else {
        // Clone the template for additional fishing charters
        block = template.cloneNode(true);
        container.appendChild(block);
      }

      // Show the block
      block.style.display = 'flex';

      // Populate cancellation policy for this fishing charter using cached data
      populateFishingCharterCancellationPolicyFromCache(block, tripData);
    });
  });
}

// Populate cancellation policy for a single fishing charter using cached data
function populateFishingCharterCancellationPolicyFromCache(block, tripData) {
  const cancellationTextElement = block.querySelector('[data-element="fishingCharterFree_cancelation_date_text"]');

  if (!cancellationTextElement || !tripData.charter) return;

  const charter = tripData.charter;
  const urlParams = new URLSearchParams(window.location.search);

  // Helper functions
  const isTrue = v => v === true || v === "true" || v === 1 || v === "1";
  const isFalse = v => v === false || v === "false" || v === 0 || v === "0";
  const isManual = String(charter.integration_type) === "Manual";

  // 1) Explicit non-refundable
  if (isFalse(charter.cancellationPolicy)) {
    cancellationTextElement.textContent = `${charter.name || 'Fishing Charter'}: This reservation is non-refundable.`;
    return;
  }

  // 2) Free-until (compute last day using the first date from fishingCharterDates)
  if (isTrue(charter.cancellationPolicy)) {
    const days = Number(charter.cancellationPolicy_daysNotice);

    // Pull first YYYY-MM-DD from URL param
    const key = `fishingCharterDates${tripData.number}`;
    const raw = String(urlParams.get(key) || "");
    const firstYMD = (() => {
      const s = decodeURIComponent(raw).split(",")[0]?.trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    })();

    if (!Number.isFinite(days) || days < 0 || !firstYMD) {
      // invalid config → if manual, still show details line
      cancellationTextElement.textContent = isManual ? `${charter.name || 'Fishing Charter'}: Details communicated with fishing charter.` : "";
      return;
    }

    // UTC-safe subtract: cutoff = firstYMD - days
    const [Y, M, D] = firstYMD.split("-").map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    dt.setUTCDate(dt.getUTCDate() - days);

    // format "Month Dth" or "Month Dth, YYYY" if different year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const suffix = (n) =>
      (n % 10 === 1 && n % 100 !== 11) ? "st" :
        (n % 10 === 2 && n % 100 !== 12) ? "nd" :
          (n % 10 === 3 && n % 100 !== 13) ? "rd" : "th";

    const dayNum = dt.getUTCDate();
    const cancelYear = dt.getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();

    // Include year if cancellation date is in a different year
    const pretty = cancelYear !== currentYear
      ? `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}, ${cancelYear}`
      : `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}`;

    const baseMsg = `Free cancellation until ${pretty}.`;
    cancellationTextElement.textContent = isManual ? `${charter.name || 'Fishing Charter'}: ${baseMsg}` : `${charter.name || 'Fishing Charter'}: ${baseMsg}`;
    return;
  }

  // 3) Unknown/missing policy → manual note if applicable
  cancellationTextElement.textContent = isManual ? `${charter.name || 'Fishing Charter'}: Details communicated with fishing charter.` : "";
}

// Save reference to the async function before it gets overwritten
const updatePricingDisplayForExtrasAsync = updatePricingDisplayForExtras;

// Wrapper function to handle async pricing updates
function updatePricingDisplayForExtrasSync() {
  updatePricingDisplayForExtrasAsync().catch(error => {

  });
}

// Validate that extras dates are within reservation dates
// NOTE: Boat validation now handled by BoatRentalService.areDatesValid() in handleExtrasWhenDatesCleared()
// This function kept for fishing charter validation only
function validateExtrasWithinReservationDates() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkin = urlParams.get('checkin');
  const checkout = urlParams.get('checkout');

  // If no reservation dates, don't validate
  if (!checkin || !checkout) return;

  // Create date range from checkin to checkout (including checkout day for extras)
  const reservationDates = generateDateRangeForValidation(checkin, checkout);
  const reservationDateSet = new Set(reservationDates);

  let hasRemovedExtras = false;

  // NOTE: Boat validation removed - now handled by BoatRentalService.areDatesValid()
  // in the centralized handleExtrasWhenDatesCleared() function
  // This prevents duplicate validation and timing issues on page load

  // Validate fishing charter dates
  const allCharterNumbers = getAllFishingCharterNumbersForValidation();
  for (const number of allCharterNumbers) {
    const charterDates = urlParams.get(`fishingCharterDates${number}`);
    if (charterDates) {
      const charterDatesList = charterDates.split(',').filter(Boolean);
      const isCharterValid = charterDatesList.every(date => reservationDateSet.has(date));

      if (!isCharterValid) {
        removeFishingCharterFromReservation(number);
        hasRemovedExtras = true;
      }
    }
  }

  // Update UI if any extras were removed
  if (hasRemovedExtras) {
    // Update pricing displays
    if (window.updatePricingDisplayForExtras) {
      window.updatePricingDisplayForExtras();
    }
    if (window.updateListingOnlyPricing) {
      window.updateListingOnlyPricing();
    }

    // Update boat visibility
    if (window.updateBoatVisibility) {
      window.updateBoatVisibility();
    }

    // Update fishing charter blocks
    if (window.fishingCharterService) {
      // Refresh fishing charter service state from updated URL
      if (window.fishingCharterService.initializeFromURL) {
        window.fishingCharterService.initializeFromURL();
      }
      // Only update blocks if there are still charters remaining
      const stillHasCharters = window.fishingCharterService.hasAnyFishingCharters && window.fishingCharterService.hasAnyFishingCharters();
      if (stillHasCharters && window.fishingCharterService.populateSelectedFishingCharterBlock) {
        window.fishingCharterService.populateSelectedFishingCharterBlock();
      }
    }
  }
}

// Helper function to generate date range for validation
function generateDateRangeForValidation(startDateStr, endDateStr) {
  const dateRange = [];
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

  let currentYear = startYear;
  let currentMonth = startMonth;
  let currentDay = startDay;

  while (true) {
    const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    dateRange.push(currentDateStr);

    // Include checkout date (guests can select extras on their last day)
    if (currentDateStr === endDateStr) break;

    // Move to next day
    currentDay++;

    // Handle month overflow
    const daysInMonth = getDaysInMonthForValidation(currentYear, currentMonth);
    if (currentDay > daysInMonth) {
      currentDay = 1;
      currentMonth++;

      // Handle year overflow
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }

  return dateRange;
}

// Helper function to get days in month
function getDaysInMonthForValidation(year, month) {
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYearForValidation(year)) {
    return 29;
  }
  return daysInMonths[month - 1];
}

// Helper function to check leap year
function isLeapYearForValidation(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Helper function to get all fishing charter numbers
function getAllFishingCharterNumbersForValidation() {
  const urlParams = new URLSearchParams(window.location.search);
  const numbers = [];

  for (const [key] of urlParams) {
    const match = key.match(/^fishingCharterId(\d+)$/);
    if (match) {
      numbers.push(parseInt(match[1]));
    }
  }

  return numbers.sort((a, b) => a - b);
}

// Remove boat from reservation
function removeBoatFromReservation() {

  const url = new URL(window.location);
  url.searchParams.delete('boatId');
  url.searchParams.delete('boatDates');
  url.searchParams.delete('boatGuests');
  url.searchParams.delete('boatPickupTime');
  url.searchParams.delete('boatLengthType');
  url.searchParams.delete('boatPrivateDock');
  url.searchParams.delete('boatDelivery');
  window.history.replaceState({}, '', url);

  // Clear boat data
  window.selectedBoatData = null;

  // Hide selected boat blocks
  const selectedBoatBlocks = document.querySelectorAll('[data-element="selectedBoatBlock"]');
  selectedBoatBlocks.forEach(block => {
    if (block) {
      block.style.display = 'none';
    }
  });

  // Reset boat service modal state and filter states
  if (window.boatRentalService) {
    window.boatRentalService.resetModalState();

    // Also clear the current filter states to match the removed boat
    window.boatRentalService.selectedDates = [];
    window.boatRentalService.selectedGuests = 0;
    window.boatRentalService.selectedPickupTime = '';
    window.boatRentalService.selectedLengthType = 'full';
    window.boatRentalService.selectedPrivateDock = false;
    window.boatRentalService.deliverySelected = false;

    // Update UI elements to reflect cleared state
    if (window.boatRentalService.guestNumber) {
      window.boatRentalService.guestNumber.textContent = window.boatRentalService.selectedGuests;
    }
    if (window.boatRentalService.boatDetailsGuestNumber) {
      window.boatRentalService.boatDetailsGuestNumber.textContent = window.boatRentalService.selectedGuests;
    }

    // Update filter texts and styles
    window.boatRentalService.updateDatesFilterText();
    window.boatRentalService.updatePickupTimeFilterText();
    window.boatRentalService.updateGuestsFilterText();
    window.boatRentalService.updatePrivateDockFilterText();
    window.boatRentalService.updateBoatDetailsDateFilterText();
    window.boatRentalService.updateBoatDetailsPickupTimeFilterText();
    window.boatRentalService.updateBoatDetailsGuestsFilterText();
    window.boatRentalService.updateFilterStyles();

    // Reset pickup time pills
    Object.values(window.boatRentalService.pickupTimePills).forEach(pill => {
      if (pill) {
        pill.style.borderColor = '';
        pill.style.borderWidth = '';
      }
    });
    Object.values(window.boatRentalService.boatDetailsPickupTimePills).forEach(pill => {
      if (pill) {
        pill.style.borderColor = '';
        pill.style.borderWidth = '';
      }
    });
  }
}

// Remove fishing charter from reservation
function removeFishingCharterFromReservation(numberToRemove) {
  const url = new URL(window.location);
  const allNumbers = getAllFishingCharterNumbersForValidation();

  // Remove the specific numbered parameters
  url.searchParams.delete(`fishingCharterId${numberToRemove}`);
  url.searchParams.delete(`fishingCharterTripId${numberToRemove}`);
  url.searchParams.delete(`fishingCharterGuests${numberToRemove}`);
  url.searchParams.delete(`fishingCharterDates${numberToRemove}`);
  url.searchParams.delete(`fishingCharterPickup${numberToRemove}`);

  // Get remaining numbers and renumber them sequentially
  const remainingNumbers = allNumbers.filter(num => num !== numberToRemove).sort((a, b) => a - b);

  if (remainingNumbers.length > 0) {
    const tempParams = {};

    // Store remaining parameters temporarily
    remainingNumbers.forEach(oldNumber => {
      const charterId = url.searchParams.get(`fishingCharterId${oldNumber}`);
      const tripId = url.searchParams.get(`fishingCharterTripId${oldNumber}`);
      const guests = url.searchParams.get(`fishingCharterGuests${oldNumber}`);
      const dates = url.searchParams.get(`fishingCharterDates${oldNumber}`);
      const pickup = url.searchParams.get(`fishingCharterPickup${oldNumber}`);

      if (charterId) {
        tempParams[oldNumber] = { charterId, tripId, guests, dates, pickup };
      }

      // Remove old numbered parameters
      url.searchParams.delete(`fishingCharterId${oldNumber}`);
      url.searchParams.delete(`fishingCharterTripId${oldNumber}`);
      url.searchParams.delete(`fishingCharterGuests${oldNumber}`);
      url.searchParams.delete(`fishingCharterDates${oldNumber}`);
      url.searchParams.delete(`fishingCharterPickup${oldNumber}`);
    });

    // Re-add parameters with sequential numbering
    Object.values(tempParams).forEach((params, index) => {
      const newNumber = index + 1;
      url.searchParams.set(`fishingCharterId${newNumber}`, params.charterId);
      if (params.tripId) url.searchParams.set(`fishingCharterTripId${newNumber}`, params.tripId);
      if (params.guests) url.searchParams.set(`fishingCharterGuests${newNumber}`, params.guests);
      if (params.dates) url.searchParams.set(`fishingCharterDates${newNumber}`, params.dates);
      if (params.pickup) url.searchParams.set(`fishingCharterPickup${newNumber}`, params.pickup);
    });
  }

  window.history.replaceState({}, '', url);

  // Reset fishing charter service modal state and filter states if all charters are removed
  if (window.fishingCharterService) {
    window.fishingCharterService.resetModalState();

    // If no charters remain, clear all filter states
    if (remainingNumbers.length === 0) {
      // Clear all filters when no charters remain
      window.fishingCharterService.selectedDates = [];
      window.fishingCharterService.selectedGuests = 0;
      window.fishingCharterService.selectedPickupTime = '';
      window.fishingCharterService.selectedPrivateDock = false;
      window.fishingCharterService.selectedFishingTypes = [];
      window.fishingCharterService.priceMin = 0;
      window.fishingCharterService.priceMax = 5000;

      // Also clear details section state
      window.fishingCharterService.detailsSelectedDates = [];
      window.fishingCharterService.detailsSelectedGuests = 0;
      window.fishingCharterService.detailsSelectedPrivateDock = false;

      // Update UI elements to reflect cleared state
      if (window.fishingCharterService.guestNumber) {
        window.fishingCharterService.guestNumber.textContent = window.fishingCharterService.selectedGuests;
      }
      if (window.fishingCharterService.detailsGuestNumber) {
        window.fishingCharterService.detailsGuestNumber.textContent = window.fishingCharterService.detailsSelectedGuests;
      }

      // Update filter texts and styles
      window.fishingCharterService.updateDatesFilterText();
      window.fishingCharterService.updateGuestsFilterText();
      window.fishingCharterService.updatePrivateDockFilterText();
      window.fishingCharterService.updateFishingTypeFilterText();
      window.fishingCharterService.updatePriceFilterText();
      window.fishingCharterService.updateDetailsDateFilterText();
      window.fishingCharterService.updateDetailsGuestsFilterText();
      window.fishingCharterService.updateDetailsPrivateDockFilterText();
      window.fishingCharterService.updateFilterStyles();
      window.fishingCharterService.updateDetailsFilterStyles();

      // Reset checkbox styles for fishing types
      Object.values(window.fishingCharterService.fishingTypes).forEach(checkbox => {
        if (checkbox) {
          checkbox.style.backgroundColor = '';
        }
      });

      // Reset price slider UI if it exists
      if (window.fishingCharterService.priceScrollBar) {
        const sliderMin = window.fishingCharterService.priceScrollBar.querySelector('.price-slider-min');
        const sliderMax = window.fishingCharterService.priceScrollBar.querySelector('.price-slider-max');
        if (sliderMin) sliderMin.value = 0;
        if (sliderMax) sliderMax.value = 5000;
      }
    }
  }
}

// Make functions globally available
window.hasAnyExtrasSelected = hasAnyExtrasSelected;
window.updatePricingDisplayForExtras = updatePricingDisplayForExtrasSync;
window.updatePricingDisplayForBoat = updatePricingDisplayForExtrasSync; // Backward compatibility
window.calculateStayPricing = calculateStayPricing;
window.calculateBoatPricing = calculateBoatPricing;
window.calculateFishingCharterPricing = calculateFishingCharterPricing;
window.calculateBoatBasePrice = calculateBoatBasePrice;
window.calculateCombinedTaxes = calculateCombinedTaxes;
window.updatePricingElements = updatePricingElements;
window.updateExtrasCancellationPolicies = updateExtrasCancellationPolicies;
window.updateStayCancellationPolicy = updateStayCancellationPolicy;
window.updateBoatCancellationPolicy = updateBoatCancellationPolicy;
window.updateFishingCharterCancellationPolicies = updateFishingCharterCancellationPolicies;
window.validateExtrasWithinReservationDates = validateExtrasWithinReservationDates;
window.removeBoatFromReservation = removeBoatFromReservation;








// Additional Services Section
// This section handles all extra services that can be added to a reservation
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wized
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {

    // Boat Rental Service Handler
    class BoatRentalService {
      constructor() {
        this.buttons = document.querySelectorAll('[data-element="addBoatButton"]');
        this.modal = document.querySelector('[data-element="addBoatModal"]');
        this.modalBackground = document.querySelector('[data-element="addBoatModalBackground"]');
        this.selectWrapper = document.querySelector('[data-element="addBoatModal_selectBoatWrapper"]');
        this.detailsWrapper = document.querySelector('[data-element="addBoatModal_boatDetailsWrapper"]');
        this.exitButton = document.querySelector('[data-element="addBoatModal_selectBoat_exit"]');
        this.cardTemplate = document.querySelector('[data-element="addBoatModal_selectBoat_card"]');
        this.cardWrapper = document.querySelector('[data-element="addBoatModal_selectBoat_cardWrapper"]');

        // Flag to prevent URL updates during initialization
        this.isInitializing = false;

        this.messageTimeout = null;

        // Boat details elements
        this.detailsBackButton = document.querySelector('[data-element="boatDetails_back"]');
        this.boatDetailsXButton = document.querySelector('[data-element="boatDetails_xButton"]');
        this.currentBoatData = null; // Store current boat being viewed

        // Filter elements
        this.selectedBoatBlock = document.querySelector('[data-element="selectedBoatBlock"]');
        this.datesFilter = document.querySelector('[data-element="addBoatModal_selectBoat_dates"]');
        this.datesFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_datesText"]');
        this.datesPopup = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup"]');
        this.datesPopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_exit"]');
        this.datesPopupDone = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_doneButton"]');
        this.selectDatesSection = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_selectDates"]');
        this.fullDayBtn = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_fullDay"]');
        this.halfDayBtn = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_halfDay"]');
        this.fullHalfDayContainer = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_fullHalfDayContainer"]');
        // Pickup time filter elements (separate from dates now)
        this.pickupTimeFilter = document.querySelector('[data-element="addBoatModal_selectBoat_pickupTime"]');
        this.pickupTimeFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_pickupTimeText"]');
        this.pickupTimePopup = document.querySelector('[data-element="addBoatModal_selectBoat_pickupTimePopup"]');
        this.pickupTimePopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_pickupTimePopup_exit"]');

        this.pickupTimePills = {
          '8am': document.querySelector('[data-element="pickupTime_8am"]'),
          '9am': document.querySelector('[data-element="pickupTime_9am"]'),
          '10am': document.querySelector('[data-element="pickupTime_10am"]'),
          '11am': document.querySelector('[data-element="pickupTime_11am"]'),
          '12pm': document.querySelector('[data-element="pickupTime_12pm"]'),
          '1pm': document.querySelector('[data-element="pickupTime_1pm"]'),
          '2pm': document.querySelector('[data-element="pickupTime_2pm"]'),
          '3pm': document.querySelector('[data-element="pickupTime_3pm"]'),
          '4pm': document.querySelector('[data-element="pickupTime_4pm"]')
        };

        // Boat details date filter elements (renamed from dateTime to date)
        this.boatDetailsDateFilter = document.querySelector('[data-element="boatDetails_reservation_date"]');
        this.boatDetailsDateFilterText = document.querySelector('[data-element="boatDetails_reservation_dateText"]');
        this.boatDetailsPopup = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup"]');
        this.boatDetailsPopupExit = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_exit"]');
        this.boatDetailsPopupDone = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_doneButton"]');
        this.boatDetailsSelectDatesSection = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_selectDates"]');
        this.boatDetailsFullDayBtn = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_fullDay"]');
        this.boatDetailsHalfDayBtn = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_halfDay"]');
        this.boatDetailsFullHalfDaysContainer = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_fullHalfDaysContainer"]');
        this.boatDetailsMinDaysText = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_minDaysText"]');

        // Boat details pickup time filter elements (separate from dates now)
        this.boatDetailsPickupTimeFilter = document.querySelector('[data-element="boatDetails_reservation_pickupTime"]');
        this.boatDetailsPickupTimeFilterText = document.querySelector('[data-element="boatDetails_reservation_pickupTimeText"]');
        this.boatDetailsPickupTimePopup = document.querySelector('[data-element="addBoatModal_boatDetails_boatDetails_reservation_pickupTimePopup"]');
        this.boatDetailsPickupTimePopupExit = document.querySelector('[data-element="addBoatModal_boatDetails_pickupTimePopup_exit"]');
        this.boatDetailsPickupTimePopupDone = document.querySelector('[data-element="addBoatModal_boatDetails_pickupTimePopup_doneButton"]');

        this.boatDetailsPickupTimePills = {
          '8am': document.querySelector('[data-element="boatDetailsPickupTime_8am"]'),
          '9am': document.querySelector('[data-element="boatDetailsPickupTime_9am"]'),
          '10am': document.querySelector('[data-element="boatDetailsPickupTime_10am"]'),
          '11am': document.querySelector('[data-element="boatDetailsPickupTime_11am"]'),
          '12pm': document.querySelector('[data-element="boatDetailsPickupTime_12pm"]'),
          '1pm': document.querySelector('[data-element="boatDetailsPickupTime_1pm"]'),
          '2pm': document.querySelector('[data-element="boatDetailsPickupTime_2pm"]'),
          '3pm': document.querySelector('[data-element="boatDetailsPickupTime_3pm"]'),
          '4pm': document.querySelector('[data-element="boatDetailsPickupTime_4pm"]')
        };

        // Boat details guest filter elements
        this.boatDetailsGuestsFilter = document.querySelector('[data-element="boatDetails_reservation_passengers"]');
        this.boatDetailsGuestsFilterText = document.querySelector('[data-element="boatDetails_reservation_passengersText"]');
        this.boatDetailsGuestsPopup = document.querySelector('[data-element="addBoatModal_boatDetails_guestsPopup"]');
        this.boatDetailsGuestsPopupExit = document.querySelector('[data-element="addBoatModal_boatDetails_guestsPopup_exit"]');
        this.boatDetailsGuestsPopupDone = document.querySelector('[data-element="addBoatModal_boatDetails_guestsPopup_doneButton"]');
        this.boatDetailsGuestMinus = document.querySelector('[data-element="BoatDetails_Guest_Minus"]');
        this.boatDetailsGuestNumber = document.querySelector('[data-element="boatDetailsGuest_number"]');
        this.boatDetailsGuestPlus = document.querySelector('[data-element="BoatDetails_Guest_Plus"]');
        this.boatDetailsGuestsClearBtn = document.querySelector('[data-element="boatDetails_guestsPopup_clearButton"]');

        // Error element for boat details
        this.boatDetailsErrorElement = document.querySelector('[data-element="boatDetails_reservation_addToReservationError"]');

        // Public dock address element
        this.publicDockAddressElement = document.querySelector('[data-element="boatDetails_publicDockAddress"]');

        this.guestsFilter = document.querySelector('[data-element="addBoatModal_selectBoat_guests"]');
        this.guestsFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_guestsText"]');
        this.guestsPopup = document.querySelector('[data-element="addBoatModal_selectBoat_guestsPopup"]');
        this.guestsPopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_guestsPopup_exit"]');
        this.guestMinus = document.querySelector('[data-element="Boat_Guest_Minus"]');
        this.guestNumber = document.querySelector('[data-element="boatGuest_number"]');
        this.guestPlus = document.querySelector('[data-element="Boat_Guest_Plus"]');
        this.guestsClearBtn = document.querySelector('[data-element="boat_guestsPopup_clearButton"]');

        // X button elements
        this.datesFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_datesX"]');
        this.pickupTimeFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_pickupTimeX"]');
        this.guestsFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_guestsX"]');

        // Price filter elements
        this.priceFilter = document.querySelector('[data-element="addBoatModal_selectBoat_price"]');
        this.priceFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_priceText"]');
        this.priceFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_priceX"]');
        this.pricePopup = document.querySelector('[data-element="addBoatModal_selectBoat_pricePopup"]');
        this.pricePopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_pricePopup_exit"]');
        this.priceScrollBar = document.querySelector('[data-element="boatFilterModalPrice_scrollBar"]');
        this.priceMinInput = document.querySelector('[data-element="boatFilterModalPrice_minPriceInput"]');
        this.priceMaxInput = document.querySelector('[data-element="boatFilterModalPrice_maxPriceInput"]');
        this.priceClearBtn = document.querySelector('[data-element="boat_pricePopup_clearButton"]');

        // Length filter elements
        this.lengthFilter = document.querySelector('[data-element="addBoatModal_selectBoat_length"]');
        this.lengthFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_lengthText"]');
        this.lengthFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_lengthX"]');
        this.lengthPopup = document.querySelector('[data-element="addBoatModal_selectBoat_lengthPopup"]');
        this.lengthPopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_lengthPopup_exit"]');
        this.lengthScrollBar = document.querySelector('[data-element="boatFilterModalLength_scrollBar"]');
        this.lengthMinInput = document.querySelector('[data-element="boatFilterModalLength_minPriceInput"]');
        this.lengthMaxInput = document.querySelector('[data-element="boatFilterModalLength_maxPriceInput"]');
        this.lengthClearBtn = document.querySelector('[data-element="boat_lengthPopup_clearButton"]');

        // Boat type filter elements
        this.typeFilter = document.querySelector('[data-element="addBoatModal_selectBoat_type"]');
        this.typeFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_typeText"]');
        this.typeFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_typeX"]');
        this.typePopup = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup"]');
        this.typePopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_exit"]');
        this.typeClearBtn = document.querySelector('[data-element="boat_typePopup_clearButton"]');

        // Private dock filter elements
        this.privateDockFilter = document.querySelector('[data-element="addBoatModal_selectBoat_privateDock"]');
        this.privateDockFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_privateDockText"]');
        this.privateDockFilterX = document.querySelector('[data-element="addBoatModal_selectBoat_privateDockX"]');

        // Boat type category elements
        this.centerConsoleBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_centerConsoleBlock"]');
        this.centerConsoleCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_centerConsoleCheckbox"]');
        this.flatsBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_flatsBoatBlock"]');
        this.flatsBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_flatsBoatCheckbox"]');
        this.deckBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_deckBoatBlock"]');
        this.deckBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_deckBoatCheckbox"]');
        this.pontoonBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_pontoonBoatBlock"]');
        this.pontoonBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_pontoonBoatCheckbox"]');
        this.bayBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_bayBoatBlock"]');
        this.bayBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_bayBoatCheckbox"]');
        this.dualConsoleBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_dualConsoleBlock"]');
        this.dualConsoleBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_dualConsoleCheckbox"]');

        // Filter state
        this.selectedDates = [];
        this.selectedLengthType = 'full';
        this.selectedPickupTime = '';
        this.selectedGuests = 0;
        this.selectedPriceMin = 0;
        this.selectedPriceMax = Infinity; // Use Infinity for no upper bound by default
        this.deliverySelected = false;
        this.maxPriceAdjusted = false; // Track if max price has been manually adjusted
        this.selectedLengthMin = 0;
        this.selectedLengthMax = 50;
        this.maxLengthAdjusted = false; // Track if max length has been manually adjusted
        this.selectedBoatTypes = []; // Track selected boat types
        this.selectedPrivateDock = false; // Track if private dock filter is selected
        this.userAge = null; // Store user's age for filtering
        this.availableBoats = []; // Store available boats for date disabling logic
        this.initialBoats = []; // Store initial boat results (before filters) for disabled dates logic
        this.allowsHalfDay = false; // Track if any boat allows half day

        // Track min days filtering info for no results message
        this.lastMinDaysFilterInfo = null; // { requiredDays: number, availableDays: number }

        // Edit mode tracking - store original params to restore if user cancels
        this.isEditMode = false;
        this.originalEditParams = null;

        // Flag to prevent multiple rapid calls to handleAddToReservation
        this.isAddingToReservation = false;

        this.initialize();
      }

      // Close all popups for boat rental service
      closeAllPopups() {
        // Add boat wrapper popups
        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.pickupTimePopup) this.pickupTimePopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.lengthPopup) this.lengthPopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';

        // Boat details popups
        if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
        if (this.boatDetailsPickupTimePopup) this.boatDetailsPickupTimePopup.style.display = 'none';
        if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';
      }

      // Helper method to parse property check-in time to 24-hour format
      parseCheckInTime(checkInTimeStr) {
        if (!checkInTimeStr) return null;

        try {
          // Handle formats like "4 PM", "16:00", "4PM", "16", etc.
          const timeStr = checkInTimeStr.toString().trim().toUpperCase();

          // Try to match "4 PM" or "4PM" format
          let match = timeStr.match(/^(\d{1,2})\s*(AM|PM)$/);
          if (match) {
            let hour = parseInt(match[1]);
            const period = match[2];

            if (period === 'PM' && hour !== 12) {
              hour += 12;
            } else if (period === 'AM' && hour === 12) {
              hour = 0;
            }

            return hour;
          }

          // Try to match "16:00" or "16" format
          match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?$/);
          if (match) {
            const hour = parseInt(match[1]);
            if (hour >= 0 && hour <= 23) {
              return hour;
            }
          }

          return null;
        } catch (error) {
          return null;
        }
      }

      // Helper method to convert pickup time string to 24-hour format
      pickupTimeTo24Hour(pickupTime) {
        if (!pickupTime) return null;

        const timeMap = {
          '8am': 8,
          '9am': 9,
          '10am': 10,
          '11am': 11,
          '12pm': 12,
          '1pm': 13,
          '2pm': 14,
          '3pm': 15,
          '4pm': 16
        };

        return timeMap[pickupTime] || null;
      }

      // Helper method to get all pickup times in chronological order
      getAllPickupTimesInOrder() {
        return ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];
      }

      // Helper method to get public dock delivery details for listing city
      getPublicDockDeliveryDetails(boat) {
        try {
          if (!boat || !boat.publicDockDeliveryDetails || !Array.isArray(boat.publicDockDeliveryDetails)) {
            return null;
          }

          // Get property city from Wized data
          const r = window.Wized?.data?.r;
          if (!r || !r.Load_Property_Details?.data?.property?.listing_city) {
            return null;
          }

          const propertyCityName = r.Load_Property_Details.data.property.listing_city.toLowerCase().trim();

          // Find matching public dock delivery details for this city
          const details = boat.publicDockDeliveryDetails.find(detail => {
            const detailCity = (detail?.city || '').toLowerCase().trim();
            return detailCity === propertyCityName;
          });

          return details || null;
        } catch (error) {
          return null;
        }
      }

      // Helper method to get private dock delivery details for listing city
      getPrivateDockDeliveryDetails(boat) {
        try {
          if (!boat || !boat.deliversTo || !Array.isArray(boat.deliversTo)) {
            return null;
          }

          // Get property city from Wized data
          const r = window.Wized?.data?.r;
          if (!r || !r.Load_Property_Details?.data?.property?.listing_city) {
            return null;
          }

          const propertyCityName = r.Load_Property_Details.data.property.listing_city.toLowerCase().trim();

          // Find matching private dock delivery details for this city
          const details = boat.deliversTo.find(location => {
            const locationCity = (location?.city || '').toLowerCase().trim();
            return locationCity === propertyCityName;
          });

          return details || null;
        } catch (error) {
          return null;
        }
      }

      // Method to check if pickup time gating should be enforced
      shouldEnforcePickupTimeGating() {
        try {
          // Check if Private Dock Delivery is ON
          if (!this.selectedPrivateDock) {
            return false;
          }

          // Check if we have selected dates and the first date equals property check-in date
          if (!this.selectedDates || this.selectedDates.length === 0) {
            return false;
          }

          const urlParams = new URLSearchParams(window.location.search);
          const propertyCheckinDate = urlParams.get('checkin');

          if (!propertyCheckinDate) {
            return false;
          }

          const firstSelectedDate = this.selectedDates.sort()[0];
          if (firstSelectedDate !== propertyCheckinDate) {
            return false;
          }

          // Check if property check-in time is available and parseable
          const r = window.Wized?.data?.r;
          if (!r?.Load_Property_Details?.data?.property?.check_in_time) {
            return false;
          }

          const checkInTime = this.parseCheckInTime(r.Load_Property_Details.data.property.check_in_time);
          if (checkInTime === null) {
            return false;
          }

          return true;
        } catch (error) {
          return false;
        }
      }

      // Method to get the earliest allowed pickup time based on check-in time
      getEarliestAllowedPickupTime() {
        try {
          const r = window.Wized?.data?.r;
          const checkInTimeStr = r?.Load_Property_Details?.data?.property?.check_in_time;

          if (!checkInTimeStr) {
            return null;
          }

          const checkInHour = this.parseCheckInTime(checkInTimeStr);
          if (checkInHour === null) {
            return null;
          }

          const allTimes = this.getAllPickupTimesInOrder();

          // Find the first pickup time that is >= check-in time
          for (const time of allTimes) {
            const pickupHour = this.pickupTimeTo24Hour(time);
            if (pickupHour !== null && pickupHour >= checkInHour) {
              return time;
            }
          }

          return null;
        } catch (error) {
          return null;
        }
      }

      // Method to apply pickup time gating rules
      applyPickupTimeGating(pillsObject, isBoatDetails = false) {
        if (!pillsObject) return;

        try {
          const shouldGate = this.shouldEnforcePickupTimeGating();

          // Always start by clearing all gated states to ensure clean slate
          Object.entries(pillsObject).forEach(([time, pill]) => {
            if (pill) {
              pill.style.opacity = '1';
              pill.style.cursor = 'pointer';
              pill.style.pointerEvents = 'auto';
              pill.removeAttribute('aria-disabled');
              pill.classList.remove('pickup-time-gated');
              pill.style.filter = '';
              pill.disabled = false;
              pill.removeAttribute('disabled');
            }
          });

          if (!shouldGate) {
            return;
          }

          const r = window.Wized?.data?.r;
          const checkInTimeStr = r?.Load_Property_Details?.data?.property?.check_in_time;
          const checkInHour = this.parseCheckInTime(checkInTimeStr);

          if (checkInHour === null) {
            return;
          }

          const allTimes = this.getAllPickupTimesInOrder();
          let hasValidSelection = false;
          let earliestValidTime = null;

          // Apply gating to each pickup time
          allTimes.forEach(time => {
            const pill = pillsObject[time];
            if (!pill) return;

            const pickupHour = this.pickupTimeTo24Hour(time);
            const isBeforeCheckIn = pickupHour !== null && pickupHour < checkInHour;

            if (isBeforeCheckIn) {
              // Disable times before check-in
              pill.style.opacity = '0.3';
              pill.style.cursor = 'not-allowed';
              pill.style.pointerEvents = 'none';
              pill.setAttribute('aria-disabled', 'true');
              pill.classList.add('pickup-time-gated');
            } else {
              // Enable times at or after check-in
              pill.style.opacity = '1';
              pill.style.cursor = 'pointer';
              pill.style.pointerEvents = 'auto';
              pill.removeAttribute('aria-disabled');
              pill.classList.remove('pickup-time-gated');

              if (earliestValidTime === null) {
                earliestValidTime = time;
              }

              if (this.selectedPickupTime === time) {
                hasValidSelection = true;
              }
            }
          });

          // If current selection is now invalid, auto-select earliest valid time
          if (!hasValidSelection && this.selectedPickupTime && earliestValidTime) {
            const currentPickupHour = this.pickupTimeTo24Hour(this.selectedPickupTime);
            if (currentPickupHour !== null && currentPickupHour < checkInHour) {
              // Clear current selection styling from both sets of pills
              Object.values(this.pickupTimePills).forEach(pill => {
                if (pill) {
                  pill.style.borderColor = '';
                  pill.style.borderWidth = '';
                }
              });
              Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
                if (pill) {
                  pill.style.borderColor = '';
                  pill.style.borderWidth = '';
                }
              });

              // Auto-select earliest valid time
              this.selectedPickupTime = earliestValidTime;

              // Update both sets of pills
              const mainPill = this.pickupTimePills[earliestValidTime];
              const boatDetailsPill = this.boatDetailsPickupTimePills[earliestValidTime];
              if (mainPill) {
                mainPill.style.borderColor = '#000000';
                mainPill.style.borderWidth = '2px';
              }
              if (boatDetailsPill) {
                boatDetailsPill.style.borderColor = '#000000';
                boatDetailsPill.style.borderWidth = '2px';
              }

              // Update UI and state
              this.updateDatesFilterText();
              this.updatePickupTimeFilterText();
              this.updateBoatDetailsPickupTimeFilterText(); // Always keep both texts in sync
              this.updateFilterStyles();
              this.updateURLParams();

              if (isBoatDetails) {
                this.updateBoatDetailsDateFilterText();
                this.updateBoatDetailsPrice();
                this.clearErrorIfResolved(this.boatDetailsErrorElement);
                this.updateBoatDetailsDateButtonStyles();

              } else {
                this.updateExistingCards();
              }
            }
          }
        } catch (error) {
        }
      }



      async loadUserAge() {
        try {
          const c = Wized.data.c;
          const r = Wized.data.r;

          // Check if user is signed in by checking c.token
          if (!c?.token) {
            this.userAge = null;
            return;
          }

          // User is signed in, wait for Load_user to complete
          await Wized.requests.waitFor('Load_user');

          if (r?.Load_user?.status === 200 && r?.Load_user?.data?.Birth_Date) {
            const birthDate = new Date(r.Load_user.data.Birth_Date);
            const today = new Date();

            // Calculate age
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            this.userAge = age;
          } else {
            this.userAge = null;
          }
        } catch (error) {
          this.userAge = null;
        }
      }

      initialize() {
        if (!this.buttons || this.buttons.length === 0 || !this.modal || !this.selectWrapper || !this.detailsWrapper || !this.exitButton || !this.cardTemplate || !this.cardWrapper) {
          return;
        }

        // Set initial styles
        this.modal.style.display = 'none';
        this.detailsWrapper.style.display = 'none';
        this.cardTemplate.style.display = 'none';

        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.pickupTimePopup) this.pickupTimePopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.lengthPopup) this.lengthPopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';
        if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
        if (this.boatDetailsPickupTimePopup) this.boatDetailsPickupTimePopup.style.display = 'none';
        if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';

        // Initially hide private dock filter - will be shown only if conditions are met
        if (this.privateDockFilter) this.privateDockFilter.style.display = 'none';

        // Add click handlers for all buttons
        this.buttons.forEach(button => {
          if (button) {
            button.addEventListener('click', () => this.handleButtonClick());
          }
        });
        this.exitButton.addEventListener('click', () => this.closeModal());

        // Modal background click handler - close modal when clicking on background
        if (this.modalBackground) {
          this.modalBackground.addEventListener('click', () => {
            this.closeModal();
          });
        }

        // Boat details handlers
        if (this.detailsBackButton) {
          this.detailsBackButton.addEventListener('click', () => this.hideBoatDetails());
        }

        // Boat details X button handler (mobile only)
        if (this.boatDetailsXButton) {
          this.boatDetailsXButton.addEventListener('click', () => this.closeModal());
          // // Set initial visibility based on mobile view
          // this.updateBoatDetailsXButtonVisibility();
        }

        // Filter handlers
        this.setupFilterHandlers();
        this.setupGuestButtons();
        this.setupPriceFilter();
        this.setupLengthFilter();
        this.setupBoatTypeFilter();

        // Setup X button handlers
        this.setupFilterXButtons();

        // Setup boat details handlers
        this.setupBoatDetailsHandlers();

        // Initialize from URL parameters
        this.initializeFromURL();

        // Start monitoring dates
        this.updateButtonState();

        // Monitor URL changes
        window.addEventListener('popstate', () => {
          this.initializeFromURL();
          this.updateButtonState();
        });

        // Monitor URL parameter changes for checkin/checkout dates
        this.setupDateParameterMonitoring();

        // Setup pickup time pill handlers
        this.setupPickupTimePills();

        // Check property private dock status and setup visibility
        this.checkPropertyPrivateDockStatus();

        // Check private dock filter availability on load based on property stay dates
        this.checkPrivateDockFilterAvailabilityForBoatDates();

        // Setup property details monitoring for pickup time gating
        this.setupPropertyDetailsMonitoring();

        // Monitor window resize for mobile view updates
        window.addEventListener('resize', () => {
          if (this.currentBoatData) {
            this.updateMobileFooter(this.currentBoatData);
          }
          // Update dates done button text on resize (mobile/desktop switch)
          this.updateDatesDoneButtonText();
          // // Update boat details X button visibility on resize
          // this.updateBoatDetailsXButtonVisibility();
          // Update reservation block visibility on resize
          this.updateReservationBlockVisibility();
        });
      }

      setupPropertyDetailsMonitoring() {
        // Monitor for property details loading to apply pickup time gating
        const checkForPropertyDetails = () => {
          const r = window.Wized?.data?.r;
          if (r?.Load_Property_Details?.data?.property?.check_in_time) {
            // Property details with check-in time are now available, apply gating
            this.applyPickupTimeGating(this.pickupTimePills, false);
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

            // Also check private dock filter availability now that property details are loaded
            this.checkPrivateDockFilterAvailabilityForBoatDates();

            return true; // Stop monitoring
          }
          return false; // Continue monitoring
        };

        // Check immediately
        if (!checkForPropertyDetails()) {
          // If not available yet, check periodically
          const intervalId = setInterval(() => {
            if (checkForPropertyDetails()) {
              clearInterval(intervalId);
            }
          }, 100); // Check every 100ms

          // Stop monitoring after 10 seconds to prevent infinite polling
          setTimeout(() => {
            clearInterval(intervalId);
          }, 10000);
        }
      }

      checkPropertyPrivateDockStatus() {
        // Check if property has private dock access
        const r = Wized.data.r;
        if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
          const hasPrivateDock = r.Load_Property_Details.data.property.private_dock;

          if (hasPrivateDock === false) {
            // Hide private dock filter in select boat wrapper
            if (this.privateDockFilter) {
              this.privateDockFilter.style.display = 'none';
            }

            // Hide delivery block in boat details (will be hidden for all boats)
            const deliveryBlock = document.querySelector('[data-element="boatDetails_reservation_deliveryBlock"]');
            if (deliveryBlock) {
              deliveryBlock.style.display = 'none';
            }

            // Reset any selected private dock state
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          } else {
            // Property has private dock - check if property stay meets minimum days requirement
            // Get property stay length
            const urlParams = new URLSearchParams(window.location.search);
            const checkin = urlParams.get('checkin');
            const checkout = urlParams.get('checkout');

            let propertyStayDays = 0;
            if (checkin && checkout) {
              const checkInDate = new Date(checkin);
              const checkOutDate = new Date(checkout);
              const nightsDiff = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
              propertyStayDays = nightsDiff + 1; // Convert nights to days
            }

            // Check if stay is long enough for ANY boat's private dock delivery
            // We'll hide the filter if the stay is definitely too short for all boats
            // For now, we'll show it and let individual boats hide their delivery checkbox
            // But if there are NO dates selected yet, always show the filter
            if (this.privateDockFilter) {
              this.privateDockFilter.style.display = '';
            }
          }
        }
      }

      setupPickupTimePills() {
        Object.entries(this.pickupTimePills).forEach(([time, pill]) => {
          if (!pill) return;

          pill.addEventListener('click', () => {
            // Check if this pill is disabled by gating
            if (pill.classList.contains('pickup-time-gated') || pill.getAttribute('aria-disabled') === 'true') {
              return; // Ignore clicks on gated pills
            }

            // If clicking already selected pill, deselect it
            if (this.selectedPickupTime === time) {
              this.selectedPickupTime = '';
              pill.style.borderColor = '';
              pill.style.borderWidth = '';

              // Sync with boat details pills
              Object.values(this.boatDetailsPickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });
            } else {
              // Deselect all pills first
              Object.values(this.pickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });

              // Select the clicked pill
              this.selectedPickupTime = time;
              pill.style.borderColor = '#000000';
              pill.style.borderWidth = '2px';

              // Sync with boat details pills
              Object.values(this.boatDetailsPickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });
              if (this.boatDetailsPickupTimePills[time]) {
                this.boatDetailsPickupTimePills[time].style.borderColor = '#000000';
                this.boatDetailsPickupTimePills[time].style.borderWidth = '2px';
              }
            }

            this.updateDatesFilterText();
            this.updatePickupTimeFilterText();
            this.updateBoatDetailsPickupTimeFilterText(); // Keep boat details text in sync
            this.updateFilterStyles();
            this.updateURLParams();
            this.updateExistingCards();

            // Re-apply gating after pickup time selection changes
            this.applyPickupTimeGating(this.pickupTimePills, false);
            // Also apply gating to boat details pills to keep them in sync
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
          });
        });

        // Apply initial gating
        this.applyPickupTimeGating(this.pickupTimePills, false);
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for boatId - if present, hide buttons and show selected boat block
        const boatId = urlParams.get('boatId');


        if (boatId) {
          this.buttons.forEach(button => {
            if (button) {
              button.style.display = 'none';
            }
          });
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'flex';
        } else {
          this.buttons.forEach(button => {
            if (button) {
              button.style.display = 'flex';
            }
          });
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'none';

          // If no boatId, clear all filter states to ensure clean state
          this.selectedDates = [];
          this.selectedGuests = 0;
          this.selectedPickupTime = '';
          this.selectedLengthType = 'full';
          this.selectedPrivateDock = false;
          this.deliverySelected = false;
        }

        // Initialize other parameters only if boatId exists
        if (boatId) {
          const boatGuests = urlParams.get('boatGuests');
          const boatDates = urlParams.get('boatDates');
          const boatPickupTime = urlParams.get('boatPickupTime');
          const boatLengthType = urlParams.get('boatLengthType');
          const boatPrivateDock = urlParams.get('boatPrivateDock');

          // Set guests
          this.selectedGuests = boatGuests ? parseInt(boatGuests) : 0;

          // Set dates
          this.selectedDates = boatDates ? boatDates.split(',') : [];

          // Set length type
          this.selectedLengthType = boatLengthType || 'full';

          // Set pickup time
          this.selectedPickupTime = boatPickupTime || '';

          // Set private dock filter
          this.selectedPrivateDock = boatPrivateDock === 'true';
        }

        // Update UI elements
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        if (this.boatDetailsGuestNumber) this.boatDetailsGuestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();
        this.updateLengthTypeButtons();

        // Reset pickup time pills
        Object.entries(this.pickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
            pill.style.borderWidth = time === this.selectedPickupTime ? '2px' : '';
          }
        });
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
            pill.style.borderWidth = time === this.selectedPickupTime ? '2px' : '';
          }
        });

        this.updateDatesFilterText();
        this.updatePickupTimeFilterText();
        this.updateBoatDetailsDateFilterText();
        this.updateBoatDetailsPickupTimeFilterText();
        this.updateBoatDetailsGuestsFilterText();
        this.updateFilterStyles();
        this.renderDateSelection();
        this.updatePrivateDockFilterText();
      }

      setupFilterHandlers() {
        // Function to close all popups
        const closeAllPopups = () => {
          if (this.datesPopup) this.datesPopup.style.display = 'none';
          if (this.pickupTimePopup) this.pickupTimePopup.style.display = 'none';
          if (this.guestsPopup) this.guestsPopup.style.display = 'none';
          if (this.pricePopup) this.pricePopup.style.display = 'none';
          if (this.lengthPopup) this.lengthPopup.style.display = 'none';
          if (this.typePopup) this.typePopup.style.display = 'none';
        };

        // Dates filter handlers
        if (this.datesFilter) {
          this.datesFilter.addEventListener('click', () => {
            closeAllPopups();
            this.datesPopup.style.display = 'flex';

            // Re-render date selection to ensure correct disabled states based on private dock selection
            this.renderDateSelection();

            // Apply gating when dates popup opens
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });
          });
        }

        if (this.datesPopupExit) {
          this.datesPopupExit.addEventListener('click', () => {
            closeAllPopups();

            // Apply gating when popup closes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });

            // Now that user is exiting dates section, check private dock filter availability and fetch boats
            this.checkPrivateDockFilterAvailabilityForBoatDates();
            this.fetchAndRenderBoats();
          });
        }

        if (this.datesPopupDone) {
          this.datesPopupDone.addEventListener('click', () => {
            closeAllPopups();

            // Apply gating when popup closes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });

            // Now that user is exiting dates section, check private dock filter availability and fetch boats
            this.checkPrivateDockFilterAvailabilityForBoatDates();
            this.fetchAndRenderBoats();
          });
        }

        // Pickup time filter handlers (separate from dates now)
        if (this.pickupTimeFilter) {
          this.pickupTimeFilter.addEventListener('click', () => {
            closeAllPopups();
            this.pickupTimePopup.style.display = 'flex';

            // Apply gating when pickup time popup opens
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
            });
          });
        }

        if (this.pickupTimePopupExit) {
          this.pickupTimePopupExit.addEventListener('click', () => {
            closeAllPopups();

            // Apply gating when popup closes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
            });
          });
        }

        // Day type handlers
        if (this.fullDayBtn) {
          this.fullDayBtn.addEventListener('click', () => {
            if (this.selectedDates.length <= 1) {
              this.selectedLengthType = 'full';
              this.updateLengthTypeButtons();
              this.updateDatesFilterText();
              this.updatePickupTimeFilterText();
              this.updateFilterStyles();
              this.updateExistingCards();
              this.updateURLParams();

              this.fetchAndRenderBoats();
            }
          });
        }

        if (this.halfDayBtn) {
          this.halfDayBtn.addEventListener('click', () => {
            // Allow half day selection for 0 or 1 date
            if (this.selectedDates.length <= 1) {
              this.selectedLengthType = 'half';
              this.updateLengthTypeButtons();
              this.updateDatesFilterText();
              this.updatePickupTimeFilterText();
              this.updateFilterStyles();
              this.updateExistingCards();
              this.updateURLParams();
              // Re-filter boats to apply half-day filtering
              this.fetchAndRenderBoats();
            }
          });
        }

        // Guests filter handlers
        if (this.guestsFilter) {
          this.guestsFilter.addEventListener('click', () => {
            closeAllPopups();
            this.guestsPopup.style.display = 'flex';
          });
        }

        if (this.guestsPopupExit) {
          this.guestsPopupExit.addEventListener('click', () => {
            closeAllPopups();
          });
        }

        // Price filter handlers
        if (this.priceFilter) {
          this.priceFilter.addEventListener('click', () => {
            closeAllPopups();
            this.pricePopup.style.display = 'flex';
          });
        }

        if (this.pricePopupExit) {
          this.pricePopupExit.addEventListener('click', () => {
            closeAllPopups();
          });
        }

        if (this.priceClearBtn) {
          this.priceClearBtn.addEventListener('click', () => {
            this.clearPriceFilter();
          });
        }

        if (this.guestsClearBtn) {
          this.guestsClearBtn.addEventListener('click', () => {
            this.selectedGuests = 0;
            this.guestNumber.textContent = this.selectedGuests;
            this.updateGuestsFilterText();
            this.updateFilterStyles();
            this.refilterBoatsIfModalOpen();
            this.updateURLParams();
          });
        }

        // Length filter handlers
        if (this.lengthFilter) {
          this.lengthFilter.addEventListener('click', () => {
            closeAllPopups();
            this.lengthPopup.style.display = 'flex';
          });
        }

        if (this.lengthPopupExit) {
          this.lengthPopupExit.addEventListener('click', () => {
            closeAllPopups();
          });
        }

        if (this.lengthClearBtn) {
          this.lengthClearBtn.addEventListener('click', () => {
            this.clearLengthFilter();
          });
        }

        // Boat type filter handlers
        if (this.typeFilter) {
          this.typeFilter.addEventListener('click', () => {
            closeAllPopups();
            this.typePopup.style.display = 'flex';
          });
        }

        if (this.typePopupExit) {
          this.typePopupExit.addEventListener('click', () => {
            closeAllPopups();
          });
        }

        if (this.typeClearBtn) {
          this.typeClearBtn.addEventListener('click', () => {
            this.clearBoatTypeFilter();
          });
        }

        // Private dock filter handlers
        if (this.privateDockFilter) {
          this.privateDockFilter.addEventListener('click', () => {
            // Check if disabled
            const disabledReason = this.privateDockFilter.getAttribute('data-disabled');
            if (disabledReason) {
              let tooltipMessage = '';

              if (disabledReason === 'check-in') {
                tooltipMessage = 'Private dock delivery not available on check-in date';
              } else if (disabledReason === 'min-days') {
                // Get minimum days required for tooltip
                const boatsForCheck = this.initialBoats.length > 0 ? this.initialBoats : this.availableBoats;
                let minPrivateDockDays = 3;

                if (boatsForCheck && boatsForCheck.length > 0) {
                  const minDaysArray = [];
                  boatsForCheck.forEach(boat => {
                    const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
                    if (privateDockDetails && privateDockDetails.minDays) {
                      minDaysArray.push(Number(privateDockDetails.minDays));
                    }
                  });
                  if (minDaysArray.length > 0) {
                    minPrivateDockDays = Math.min(...minDaysArray);
                  }
                }
                tooltipMessage = `${minPrivateDockDays} days needed for private dock delivery`;
              }

              if (tooltipMessage) {
                this.showTooltipMessage(this.privateDockFilter, tooltipMessage);
              }
              return;
            }

            this.selectedPrivateDock = !this.selectedPrivateDock;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();

            // Re-render date calendars to update disabled states immediately
            this.renderDateSelection();
            this.renderBoatDetailsDateSelection();

            // Sync with delivery checkbox if boat details is open
            if (this.detailsWrapper && this.detailsWrapper.style.display !== 'none') {
              const deliveryCheckbox = document.querySelector('[data-element="boatDetails_reservation_deliveryCheckbox"]');
              if (deliveryCheckbox) {
                this.deliverySelected = this.selectedPrivateDock;
                this.updateCheckboxVisual(deliveryCheckbox, this.deliverySelected);
                this.updateDeliveryURLParam(this.deliverySelected);
                // Update pricing if boat details is open
                if (this.currentBoatData) {
                  this.updateBoatDetailsPricing(this.currentBoatData);
                  // Update min days text when private dock changes
                  this.updateBoatDetailsMinDaysText(this.currentBoatData);
                  // Re-check delivery checkbox availability
                  this.setupDeliveryCheckbox(this.currentBoatData);
                }
              }
            }


            // Use requestAnimationFrame to ensure DOM updates are applied after state changes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

              // Double-check with another frame to ensure it sticks
              requestAnimationFrame(() => {
                this.applyPickupTimeGating(this.pickupTimePills, false);
                this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
              });
            });

            this.refilterBoatsIfModalOpen();
          });

          // Show tooltip on hover when disabled
          this.privateDockFilter.addEventListener('mouseenter', () => {
            const disabledReason = this.privateDockFilter.getAttribute('data-disabled');
            if (disabledReason) {
              let tooltipMessage = '';

              if (disabledReason === 'check-in') {
                tooltipMessage = 'Private dock delivery not available on check-in date';
              } else if (disabledReason === 'min-days') {
                const boatsForCheck = this.initialBoats.length > 0 ? this.initialBoats : this.availableBoats;
                let minPrivateDockDays = 3;

                if (boatsForCheck && boatsForCheck.length > 0) {
                  const minDaysArray = [];
                  boatsForCheck.forEach(boat => {
                    const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
                    if (privateDockDetails && privateDockDetails.minDays) {
                      minDaysArray.push(Number(privateDockDetails.minDays));
                    }
                  });
                  if (minDaysArray.length > 0) {
                    minPrivateDockDays = Math.min(...minDaysArray);
                  }
                }
                tooltipMessage = `${minPrivateDockDays} days needed for private dock delivery`;
              }

              if (tooltipMessage) {
                this.showTooltipMessage(this.privateDockFilter, tooltipMessage);
              }
            }
          });

          this.privateDockFilter.addEventListener('mouseleave', () => {
            if (this.privateDockFilter.hasAttribute('data-disabled')) {
              this.hideTooltipMessage();
            }
          });
        }
      }

      setupGuestButtons() {
        if (!this.guestMinus || !this.guestPlus) return;

        // Style and setup minus button
        this.guestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleGuestButton(this.guestMinus);

        // Style and setup plus button
        this.guestPlus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleGuestButton(this.guestPlus);

        // Add event listeners
        this.guestMinus.addEventListener('click', () => {
          if (this.selectedGuests > 0) {
            this.selectedGuests--;
            this.guestNumber.textContent = this.selectedGuests;
            this.updateGuestsFilterText();
            this.updateFilterStyles();
            this.refilterBoatsIfModalOpen();
            this.updateURLParams();
          }
        });

        this.guestPlus.addEventListener('click', () => {
          this.selectedGuests++;
          this.guestNumber.textContent = this.selectedGuests;
          this.updateGuestsFilterText();
          this.updateFilterStyles();
          this.refilterBoatsIfModalOpen();
          this.updateURLParams();
        });
      }

      styleGuestButton(button) {
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '32px';
        button.style.height = '32px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.borderRadius = '50%';
        button.style.transition = 'background-color 0.2s ease';

        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = 'whitesmoke';
        });

        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = '';
        });
      }

      getMonthYearHeader(startDateStr, endDateStr) {
        const [startYear, startMonth] = startDateStr.split('-').map(Number);
        const [endYear, endMonth] = endDateStr.split('-').map(Number);

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];

        const startMonthName = monthNames[startMonth - 1];
        const endMonthName = monthNames[endMonth - 1];

        // Same month and year
        if (startMonth === endMonth && startYear === endYear) {
          return `${startMonthName} ${startYear}`;
        }
        // Different months, same year
        else if (startYear === endYear) {
          return `${startMonthName} & ${endMonthName} ${startYear}`;
        }
        // Different years
        else {
          return `${startMonthName} ${startYear} & ${endMonthName} ${endYear}`;
        }
      }

      renderDateSelection() {
        if (!this.selectDatesSection) return;

        // Get checkin and checkout dates from URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout) return;

        this.selectDatesSection.innerHTML = '';

        // Create date range using string manipulation
        const dateArray = this.generateDateRange(checkin, checkout);

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

        // Create month/year header
        const monthYearHeader = document.createElement('div');
        monthYearHeader.textContent = this.getMonthYearHeader(checkin, checkout);
        monthYearHeader.style.fontSize = '16px';
        monthYearHeader.style.fontFamily = 'TT Fors, sans-serif';
        monthYearHeader.style.fontWeight = '500';
        monthYearHeader.style.color = '#000000';
        monthYearHeader.style.textAlign = 'center';
        monthYearHeader.style.marginBottom = '12px';
        calendarContainer.appendChild(monthYearHeader);

        // Create days of week header
        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.gap = '6px';
        daysHeader.style.justifyItems = 'center';

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
          const dayHeader = document.createElement('div');
          dayHeader.textContent = day;
          dayHeader.style.fontSize = '12px';
          dayHeader.style.fontFamily = 'TT Fors, sans-serif';
          dayHeader.style.color = '#808080';
          dayHeader.style.textTransform = 'uppercase';
          daysHeader.appendChild(dayHeader);
        });

        calendarContainer.appendChild(daysHeader);

        // Create dates grid
        const datesGrid = document.createElement('div');
        datesGrid.style.display = 'grid';
        datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesGrid.style.gap = '6px';
        datesGrid.style.justifyItems = 'center';

        // Calculate empty cells needed at start
        const firstDateStr = dateArray[0];
        const emptyStartCells = this.getDayOfWeek(firstDateStr);

        // Add empty cells at start
        for (let i = 0; i < emptyStartCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        // Use initial boats (not filtered) to determine disabled dates
        // This ensures disabled states don't change when user applies filters like boat type
        const boatsForDisabledCheck = this.initialBoats.length > 0 ? this.initialBoats : this.availableBoats;

        // Check if all boats require multiple days and get the minimum
        let allBoatsRequireMultipleDays = false;
        let minDaysRequired = 0;

        if (boatsForDisabledCheck && boatsForDisabledCheck.length > 0) {
          // Check each boat's minimum days requirement
          allBoatsRequireMultipleDays = boatsForDisabledCheck.every(boat => {
            const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
            const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
            const boatMinDays = boat.minReservationLength || 0;

            let privateDockMinDays = 0;
            if (this.selectedPrivateDock) {
              const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
              privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
            }

            const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
            return effectiveMinDays > 1;
          });

          if (allBoatsRequireMultipleDays) {
            // Get the minimum days required across all boats
            const minDaysArray = boatsForDisabledCheck.map(boat => {
              const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
              const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
              const boatMinDays = boat.minReservationLength || 0;

              let privateDockMinDays = 0;
              if (this.selectedPrivateDock) {
                const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
                privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
              }

              return Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
            });

            minDaysRequired = Math.min(...minDaysArray); // Use the smallest minimum to be safe
          }
        }

        // Check if we need to disable intermediate dates (when one date is selected and all boats require multiple days)
        // Don't disable dates if private dock is selected - allow user to select freely
        const shouldDisableIntermediateDates = !this.selectedPrivateDock && allBoatsRequireMultipleDays && this.selectedDates.length === 1 && minDaysRequired > 1;
        const selectedSingleDate = shouldDisableIntermediateDates ? this.selectedDates[0] : null;

        // Get property checkin/checkout dates for private dock rules
        const urlParamsForDates = new URLSearchParams(window.location.search);
        const propertyCheckin = urlParamsForDates.get('checkin');
        const propertyCheckout = urlParamsForDates.get('checkout');

        // Create date buttons
        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          // Create date button
          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          // Check if this is check-in or checkout date
          const isCheckinDate = dateStr === propertyCheckin;
          const isCheckoutDate = dateStr === propertyCheckout;

          // Determine if this date should be disabled
          let isDisabled = false;
          let disabledTooltip = null;

          // Rule: If private dock is selected, disable check-in date (even before any dates are selected)
          if (this.selectedPrivateDock && isCheckinDate) {
            isDisabled = true;
            disabledTooltip = 'Private dock delivery not available on check-in date';
          }
          // Check minimum days requirement only when private dock is NOT selected
          else if (!this.selectedPrivateDock && shouldDisableIntermediateDates && dateStr !== selectedSingleDate) {
            // Calculate how many days would be in the range if this date was selected
            const range = this.generateDateRange(
              selectedSingleDate < dateStr ? selectedSingleDate : dateStr,
              selectedSingleDate < dateStr ? dateStr : selectedSingleDate
            );
            const daysInRange = range.length;

            // Disable dates that would create a range less than minimum required
            if (daysInRange < minDaysRequired) {
              isDisabled = true;
            }
          }

          // Style the button
          dateBtn.style.background = this.selectedDates.includes(dateStr) ? '#000000' : 'white';
          dateBtn.style.color = this.selectedDates.includes(dateStr) ? 'white' : 'black';
          dateBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          if (isDisabled) {
            dateBtn.style.opacity = '0.3';
          }

          // Add event handlers
          if (isDisabled && disabledTooltip) {
            // Show tooltip for disabled dates
            dateBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showTooltipMessage(dateBtn, disabledTooltip);
            });

            dateBtn.addEventListener('mouseenter', () => {
              this.showTooltipMessage(dateBtn, disabledTooltip);
            });

            dateBtn.addEventListener('mouseleave', () => {
              this.hideTooltipMessage();
            });
          } else if (!isDisabled) {
            // Normal clickable date
            dateBtn.addEventListener('click', () => {
              this.handleDateSelection(dateStr);
            });

            // Add tooltip for checkout date if private dock is selected
            if (this.selectedPrivateDock && isCheckoutDate) {
              dateBtn.addEventListener('mouseenter', () => {
                const r = window.Wized?.data?.r;
                const checkoutTime = r?.Load_Property_Details?.data?.property?.check_out_time || '10 AM';
                this.showTooltipMessage(dateBtn, `Boat must be picked up before ${checkoutTime}`);
              });

              dateBtn.addEventListener('mouseleave', () => {
                this.hideTooltipMessage();
              });
            }
          }

          datesGrid.appendChild(dateBtn);
        });

        // Calculate empty cells needed at end
        const lastDateStr = dateArray[dateArray.length - 1];
        const emptyEndCells = 6 - this.getDayOfWeek(lastDateStr);

        // Add empty cells at end
        for (let i = 0; i < emptyEndCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        calendarContainer.appendChild(datesGrid);
        this.selectDatesSection.appendChild(calendarContainer);
      }

      getDayOfWeek(dateStr) {
        // Get day of week (0 = Sunday, 6 = Saturday) for YYYY-MM-DD string
        const [year, month, day] = dateStr.split('-').map(Number);

        // Use Zeller's congruence algorithm to avoid Date object
        let adjustedMonth = month;
        let adjustedYear = year;

        if (month < 3) {
          adjustedMonth += 12;
          adjustedYear -= 1;
        }

        const q = day;
        const m = adjustedMonth;
        const k = adjustedYear % 100;
        const j = Math.floor(adjustedYear / 100);

        const h = (q + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;

        // Convert Zeller's result (0 = Saturday) to JavaScript format (0 = Sunday)
        return (h + 6) % 7;
      }

      updateDateButtonDisabledStates() {
        // Update disabled states and selection styles without full re-render
        if (!this.selectDatesSection) return;

        const dateButtons = this.selectDatesSection.querySelectorAll('button[data-date]');
        if (dateButtons.length === 0) return;

        // Use initial boats (not filtered) to determine disabled dates
        const boatsForDisabledCheck = this.initialBoats.length > 0 ? this.initialBoats : this.availableBoats;

        // Check if all boats require multiple days and get the minimum
        let allBoatsRequireMultipleDays = false;
        let minDaysRequired = 0;

        if (boatsForDisabledCheck && boatsForDisabledCheck.length > 0) {
          allBoatsRequireMultipleDays = boatsForDisabledCheck.every(boat => {
            const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
            const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
            const boatMinDays = boat.minReservationLength || 0;

            let privateDockMinDays = 0;
            if (this.selectedPrivateDock) {
              const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
              privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
            }

            const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
            return effectiveMinDays > 1;
          });

          if (allBoatsRequireMultipleDays) {
            const minDaysArray = boatsForDisabledCheck.map(boat => {
              const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
              const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
              const boatMinDays = boat.minReservationLength || 0;

              let privateDockMinDays = 0;
              if (this.selectedPrivateDock) {
                const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
                privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
              }

              return Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
            });

            minDaysRequired = Math.min(...minDaysArray);
          }
        }

        // Check if we need to disable intermediate dates (when one date is selected and all boats require multiple days)
        // Don't disable dates if private dock is selected - allow user to select freely
        const shouldDisableIntermediateDates = !this.selectedPrivateDock && allBoatsRequireMultipleDays && this.selectedDates.length === 1 && minDaysRequired > 1;
        const selectedSingleDate = shouldDisableIntermediateDates ? this.selectedDates[0] : null;

        // Get property checkin/checkout for private dock rules
        const urlParamsForDateButtons = new URLSearchParams(window.location.search);
        const propertyCheckin = urlParamsForDateButtons.get('checkin');
        const propertyCheckout = urlParamsForDateButtons.get('checkout');

        // Update each date button
        dateButtons.forEach(dateBtn => {
          const dateStr = dateBtn.getAttribute('data-date');
          if (!dateStr) return;

          // Check if this is check-in or checkout date
          const isCheckinDate = dateStr === propertyCheckin;
          const isCheckoutDate = dateStr === propertyCheckout;

          // Update selection styling
          const isSelected = this.selectedDates.includes(dateStr);
          dateBtn.style.background = isSelected ? '#000000' : 'white';
          dateBtn.style.color = isSelected ? 'white' : 'black';
          dateBtn.style.borderColor = isSelected ? '#000000' : '#ddd';

          // Determine if this date should be disabled
          let isDisabled = false;

          // Rule: If private dock is selected, disable check-in date
          if (this.selectedPrivateDock && isCheckinDate) {
            isDisabled = true;
          }
          // Check minimum days requirement
          else if (shouldDisableIntermediateDates && dateStr !== selectedSingleDate) {
            const range = this.generateDateRange(
              selectedSingleDate < dateStr ? selectedSingleDate : dateStr,
              selectedSingleDate < dateStr ? dateStr : selectedSingleDate
            );
            const daysInRange = range.length;

            if (daysInRange < minDaysRequired) {
              isDisabled = true;
            }
          }

          // Apply disabled styling
          dateBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
          dateBtn.style.opacity = isDisabled ? '0.3' : '1';

          // Remove old event listeners by cloning
          const newDateBtn = dateBtn.cloneNode(true);
          dateBtn.parentNode.replaceChild(newDateBtn, dateBtn);

          if (isDisabled) {
            // Add tooltip for disabled check-in date
            if (this.selectedPrivateDock && isCheckinDate) {
              newDateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTooltipMessage(newDateBtn, 'Private dock delivery not available on check-in date');
              });

              newDateBtn.addEventListener('mouseenter', () => {
                this.showTooltipMessage(newDateBtn, 'Private dock delivery not available on check-in date');
              });

              newDateBtn.addEventListener('mouseleave', () => {
                this.hideTooltipMessage();
              });
            }
          } else {
            // Add normal click handler
            newDateBtn.addEventListener('click', () => {
              this.handleDateSelection(dateStr);
            });

            // Add tooltip for checkout date if private dock is selected
            if (this.selectedPrivateDock && isCheckoutDate) {
              newDateBtn.addEventListener('mouseenter', () => {
                const r = window.Wized?.data?.r;
                const checkoutTime = r?.Load_Property_Details?.data?.property?.check_out_time || '10 AM';
                this.showTooltipMessage(newDateBtn, `Boat must be picked up before ${checkoutTime}`);
              });

              newDateBtn.addEventListener('mouseleave', () => {
                this.hideTooltipMessage();
              });
            }
          }
        });
      }

      checkIfAllBoatsRequireMultipleDays() {
        // Check if all available boats require more than 1 day
        if (!this.availableBoats || this.availableBoats.length === 0) {
          return false;
        }

        // Check each boat's minimum days requirement
        return this.availableBoats.every(boat => {
          const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
          const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
          const boatMinDays = boat.minReservationLength || 0;

          // Get private dock min days if private dock is selected
          let privateDockMinDays = 0;
          if (this.selectedPrivateDock) {
            const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
            privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
          }

          const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

          // Return true if this boat requires more than 1 day
          return effectiveMinDays > 1;
        });
      }

      handleDateSelection(dateStr) {
        // Check if all boats require more than 1 day
        const allBoatsRequireMultipleDays = this.checkIfAllBoatsRequireMultipleDays();

        // If no dates selected, select this date
        if (this.selectedDates.length === 0) {
          this.selectedDates = [dateStr];

          // If all boats require > 1 day, show a message or visual indicator
          // that they need to select an end date
          if (allBoatsRequireMultipleDays) {
            // User must select an end date - the visual indication comes from
            // the date buttons showing they need a range
          }
        }
        // If one date selected
        else if (this.selectedDates.length === 1) {
          const existingDateStr = this.selectedDates[0];

          // If clicking the same date, deselect it
          if (dateStr === existingDateStr) {
            this.selectedDates = [];
          }
          // If clicking a different date, create a range
          else {
            // Compare date strings to determine order
            const startDateStr = existingDateStr < dateStr ? existingDateStr : dateStr;
            const endDateStr = existingDateStr < dateStr ? dateStr : existingDateStr;

            // Generate all dates in the range
            this.selectedDates = this.generateDateRange(startDateStr, endDateStr);

            // If multiple dates selected, switch to full day
            if (this.selectedDates.length > 1 && this.selectedLengthType === 'half') {
              this.selectedLengthType = 'full';
            }
          }
        }
        // If multiple dates selected (range exists), clear and start new selection
        else {
          this.selectedDates = [dateStr];
        }

        // Update disabled states without full re-render (prevents flickering)
        this.updateDateButtonDisabledStates();

        // Update length type options
        this.updateLengthTypeButtons();
        this.updateDatesFilterText();
        this.updatePickupTimeFilterText();
        this.updateFilterStyles();

        // Don't fetch/render boats until user exits dates section
        // this.fetchAndRenderBoats();
        this.updateURLParams();

        // Apply pickup time gating when dates change (first/last day affects gating)
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

        // Don't check private dock filter availability until user exits dates section
        // this.checkPrivateDockFilterAvailabilityForBoatDates();

        // Re-check delivery checkbox visibility if boat details is open
        if (this.currentBoatData && this.detailsWrapper && this.detailsWrapper.style.display !== 'none') {
          this.setupDeliveryCheckbox(this.currentBoatData);
        }
      }

      // Check if private dock filter should be shown based on property stay dates
      checkPrivateDockFilterAvailabilityForBoatDates() {
        const r = Wized.data.r;
        if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data || !r.Load_Property_Details.data.property) {
          return;
        }

        const property = r.Load_Property_Details.data.property;
        const hasPrivateDock = property.private_dock === true;

        // If no private dock, filter should already be hidden
        if (!hasPrivateDock || !this.privateDockFilter) {
          return;
        }

        // Get property stay dates from URL params (the overall property booking dates)
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        // If no property dates selected, show the filter
        if (!checkin || !checkout) {
          this.privateDockFilter.style.display = '';
          return;
        }

        // Calculate the number of days in the property stay
        const propertyStayDates = this.generateDateRange(checkin, checkout);
        const propertyStayDays = propertyStayDates.length;

        // Get minimum days required for private dock from available boats
        const boatsForCheck = this.initialBoats.length > 0 ? this.initialBoats : this.availableBoats;

        // If no boats are loaded yet, don't hide the filter (we'll check again after boats load)
        if (!boatsForCheck || boatsForCheck.length === 0) {
          return;
        }

        // Only consider boats that actually have private dock delivery to the property
        const minDaysArray = [];

        boatsForCheck.forEach(boat => {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          // Only include boats that actually offer private dock delivery
          if (privateDockDetails && privateDockDetails.minDays) {
            minDaysArray.push(Number(privateDockDetails.minDays));
          }
        });

        // If no boats offer private dock delivery, hide the filter
        if (minDaysArray.length === 0) {
          this.privateDockFilter.style.display = 'none';
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          }
          return;
        }

        // Get the minimum days required across all boats that offer private dock
        const minPrivateDockDays = Math.min(...minDaysArray);

        // Rule: Can't do private dock delivery on check-in date, so subtract 1 from available days
        const usablePropertyDays = propertyStayDays - 1;

        // If usable property days are less than minimum, HIDE the filter completely for main listing section
        if (usablePropertyDays < minPrivateDockDays) {
          this.privateDockFilter.style.display = 'none';

          // If private dock was selected, deselect it
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          }
          return;
        }

        // Property stay meets minimum - now check user-selected boat dates
        let disabledReason = null;

        // Check if user selected the check-in date as first date
        if (this.selectedDates.length > 0 && this.selectedDates[0] === checkin) {
          disabledReason = 'check-in';
        }
        // Check if user selected dates don't meet minimum
        else if (this.selectedDates.length > 0 && this.selectedDates.length < minPrivateDockDays) {
          disabledReason = 'min-days';
        }

        if (disabledReason) {
          // Show DISABLED state
          this.privateDockFilter.style.display = '';
          this.privateDockFilter.setAttribute('data-disabled', disabledReason);
          this.privateDockFilter.style.opacity = '0.5';
          this.privateDockFilter.style.cursor = 'not-allowed';

          // If private dock was selected, deselect it
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          }
        } else {
          // Show the filter enabled - all requirements met
          this.privateDockFilter.style.display = '';
          this.privateDockFilter.removeAttribute('data-disabled');
          this.privateDockFilter.style.opacity = '';
          this.privateDockFilter.style.cursor = '';
        }
      }

      generateDateRange(startDateStr, endDateStr) {
        const dateRange = [];

        // Parse start date components
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

        let currentYear = startYear;
        let currentMonth = startMonth;
        let currentDay = startDay;

        while (true) {
          // Format current date as string
          const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          dateRange.push(currentDateStr);

          // Break if we've reached the end date
          if (currentDateStr === endDateStr) break;

          // Move to next day
          currentDay++;

          // Handle month overflow
          const daysInMonth = this.getDaysInMonth(currentYear, currentMonth);
          if (currentDay > daysInMonth) {
            currentDay = 1;
            currentMonth++;

            // Handle year overflow
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            }
          }
        }

        return dateRange;
      }

      getDaysInMonth(year, month) {
        // Month is 1-indexed here
        const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (month === 2 && this.isLeapYear(year)) {
          return 29;
        }

        return daysInMonths[month - 1];
      }

      isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      }

      // Show tooltip message near an element
      showTooltipMessage(element, message) {
        // Remove any existing tooltip
        this.hideTooltipMessage();

        const tooltip = document.createElement('div');
        tooltip.className = 'boat-rental-tooltip';
        tooltip.textContent = message;

        // Get element position
        const rect = element.getBoundingClientRect();

        tooltip.style.cssText = `
          position: fixed;
          background: #323232;
          color: white;
          padding: 8px 12px;
          border-radius: 5px;
          font-size: 13px;
          font-family: 'TT Fors', sans-serif;
          z-index: 10999;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          top: ${rect.bottom + 8}px;
          left: ${rect.left + (rect.width / 2)}px;
          transform: translateX(-50%);
        `;

        document.body.appendChild(tooltip);

        // Auto-hide after 3 seconds
        setTimeout(() => {
          this.hideTooltipMessage();
        }, 3000);

        return tooltip;
      }

      hideTooltipMessage() {
        const existing = document.querySelector('.boat-rental-tooltip');
        if (existing) {
          existing.remove();
        }
      }

      updateDateButtonStyles() {
        // Get all date buttons
        const dateButtons = this.selectDatesSection.querySelectorAll('button');

        dateButtons.forEach(btn => {
          const btnDateStr = btn.getAttribute('data-date');
          if (btnDateStr && this.selectedDates.includes(btnDateStr)) {
            btn.style.background = '#000000';
            btn.style.color = 'white';
            btn.style.borderColor = '#000000';
          } else if (btnDateStr) {
            btn.style.background = 'white';
            btn.style.color = 'black';
            btn.style.borderColor = '#ddd';
          }
        });
      }

      updateLengthTypeButtons() {
        if (!this.fullDayBtn || !this.halfDayBtn) return;

        // Remove existing classes
        this.fullDayBtn.classList.remove('selected');
        this.halfDayBtn.classList.remove('selected');

        if (this.selectedDates.length > 1) {
          // Multiple dates - only full day available
          this.selectedLengthType = 'full';
          this.fullDayBtn.classList.add('selected');
          this.halfDayBtn.style.opacity = '0.5';
          this.halfDayBtn.style.cursor = 'not-allowed';
        } else {
          // Single or no date - both options available
          this.halfDayBtn.style.opacity = '1';
          this.halfDayBtn.style.cursor = 'pointer';

          if (this.selectedLengthType === 'full') {
            this.fullDayBtn.classList.add('selected');
          } else {
            this.halfDayBtn.classList.add('selected');
          }
        }
      }

      updateDatesFilterText() {
        if (!this.datesFilterText) return;

        if (this.selectedDates.length === 0) {
          this.datesFilterText.textContent = 'Select dates';
        } else if (this.selectedDates.length === 1) {
          const dateStr = this.selectedDates[0];
          const formattedDate = this.formatDateStringForDisplay(dateStr);
          this.datesFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day)`;
        } else {
          // Sort dates to get start and end
          const sortedDates = [...this.selectedDates].sort();
          const startDateStr = sortedDates[0];
          const endDateStr = sortedDates[sortedDates.length - 1];

          // Parse date components
          const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
          const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

          // Format months
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const startMonthName = monthNames[startMonth - 1];
          const endMonthName = monthNames[endMonth - 1];

          let dateRange;
          if (startMonth === endMonth && startYear === endYear) {
            dateRange = `${startMonthName} ${startDay} - ${endDay}`;
          } else {
            dateRange = `${startMonthName} ${startDay} - ${endMonthName} ${endDay}`;
          }

          this.datesFilterText.textContent = `${dateRange}`;
        }
      }

      updatePickupTimeFilterText() {
        if (!this.pickupTimeFilterText) return;

        if (!this.selectedPickupTime) {
          this.pickupTimeFilterText.textContent = 'Select time';
        } else {
          // Format time like "9am" to "9:00 pickup"
          const formattedTime = this.formatPickupTimeForDisplay(this.selectedPickupTime);
          this.pickupTimeFilterText.textContent = formattedTime;
        }
      }

      formatPickupTimeForDisplay(time) {
        // Convert "9am" to "9:00am", "12pm" to "12:00pm", "1pm" to "1:00pm", etc.
        const hour = time.replace(/[apm]/gi, '');
        const period = time.includes('pm') ? 'pm' : 'am';
        return `${hour}:00${period} pickup`;
      }

      formatDateStringForDisplay(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1]} ${day}`;
      }

      updateBoatDetailsDateFilterText() {
        if (!this.boatDetailsDateFilterText) return;

        if (this.selectedDates.length === 0) {
          this.boatDetailsDateFilterText.textContent = 'Select dates';
        } else if (this.selectedDates.length === 1) {
          const dateStr = this.selectedDates[0];
          const formattedDate = this.formatDateStringForDisplay(dateStr);
          this.boatDetailsDateFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day)`;
        } else {
          // Sort dates to get start and end
          const sortedDates = [...this.selectedDates].sort();
          const startDateStr = sortedDates[0];
          const endDateStr = sortedDates[sortedDates.length - 1];

          // Parse date components
          const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
          const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

          // Format months
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const startMonthName = monthNames[startMonth - 1];
          const endMonthName = monthNames[endMonth - 1];

          let dateRange;
          if (startMonth === endMonth && startYear === endYear) {
            dateRange = `${startMonthName} ${startDay} - ${endDay}`;
          } else {
            dateRange = `${startMonthName} ${startDay} - ${endMonthName} ${endDay}`;
          }

          this.boatDetailsDateFilterText.textContent = `${dateRange}`;
        }
      }

      updateBoatDetailsPickupTimeFilterText() {
        if (!this.boatDetailsPickupTimeFilterText) return;

        if (!this.selectedPickupTime) {
          this.boatDetailsPickupTimeFilterText.textContent = 'Select time';
        } else {
          // Format time like "9am" to "9:00 pickup"
          const formattedTime = this.formatPickupTimeForDisplay(this.selectedPickupTime);
          this.boatDetailsPickupTimeFilterText.textContent = formattedTime;
        }
      }

      updateBoatDetailsLengthTypeButtons() {
        if (!this.boatDetailsFullDayBtn || !this.boatDetailsHalfDayBtn) return;

        // Remove existing classes
        this.boatDetailsFullDayBtn.classList.remove('selected');
        this.boatDetailsHalfDayBtn.classList.remove('selected');

        if (this.selectedDates.length > 1) {
          // Multiple dates - only full day available
          this.selectedLengthType = 'full';
          this.boatDetailsFullDayBtn.classList.add('selected');
          this.boatDetailsHalfDayBtn.style.opacity = '0.5';
          this.boatDetailsHalfDayBtn.style.cursor = 'not-allowed';
        } else {
          // Single or no date - both options available
          this.boatDetailsHalfDayBtn.style.opacity = '1';
          this.boatDetailsHalfDayBtn.style.cursor = 'pointer';

          if (this.selectedLengthType === 'full') {
            this.boatDetailsFullDayBtn.classList.add('selected');
          } else {
            this.boatDetailsHalfDayBtn.classList.add('selected');
          }
        }
      }

      updateGuestsFilterText() {
        if (!this.guestsFilterText) return;

        if (this.selectedGuests === 0) {
          this.guestsFilterText.textContent = 'Passengers';
        } else {
          this.guestsFilterText.textContent = `${this.selectedGuests} passenger${this.selectedGuests !== 1 ? 's' : ''}`;
        }
      }

      updateURLParams() {
        // Skip URL updates when in edit mode - only update when user clicks "Add to Reservation"
        if (this.isEditMode) {
          return;
        }

        const url = new URL(window.location);

        // Update boat parameters
        if (this.selectedGuests > 0) {
          url.searchParams.set('boatGuests', this.selectedGuests);
        } else {
          url.searchParams.delete('boatGuests');
        }

        if (this.selectedDates.length > 0) {
          url.searchParams.set('boatDates', this.selectedDates.join(','));
        } else {
          url.searchParams.delete('boatDates');
        }

        if (this.selectedPickupTime) {
          url.searchParams.set('boatPickupTime', this.selectedPickupTime);
        } else {
          url.searchParams.delete('boatPickupTime');
        }

        // Always include boatLengthType when dates are selected
        if (this.selectedDates.length > 0) {
          url.searchParams.set('boatLengthType', this.selectedLengthType);
        } else {
          url.searchParams.delete('boatLengthType');
        }

        // Add private dock parameter and sync with delivery
        if (this.selectedPrivateDock) {
          url.searchParams.set('boatPrivateDock', 'true');
          url.searchParams.set('boatDelivery', 'true');
        } else {
          // Explicitly set to false to avoid auto-selection conflicts
          url.searchParams.set('boatPrivateDock', 'false');
          url.searchParams.set('boatDelivery', 'false');
        }

        window.history.replaceState({}, '', url);
      }

      formatDateForParam(date) {
        return date.toISOString().split('T')[0];
      }

      formatDateForDisplay(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      filterBoats(boats) {
        // Reset min days filter tracking before filtering
        this.lastMinDaysFilterInfo = null;
        let minDaysFilteredCount = 0;
        let maxRequiredDays = 0;
        const availableDays = this.getAvailableDaysForMinCheck();

        const filteredBoats = boats.filter(boat => {
          // Filter by guest count
          if (this.selectedGuests > 0 && boat.maxPassengers < this.selectedGuests) {
            return false;
          }

          // Filter by half-day compatibility
          if (this.selectedDates.length === 1 && this.selectedLengthType === 'half') {
            const minLength = boat.minReservationLength || 0;
            if (minLength >= 1) {
              return false; // Boat doesn't allow half days
            }
          }

          // Filter by minimum days requirement
          if (availableDays > 0) {
            const effectiveMinDays = this.getEffectiveMinDaysForBoat(boat);

            // If boat requires more days than available, filter it out
            if (effectiveMinDays > 0 && availableDays < effectiveMinDays) {
              // Track min days filtering info
              minDaysFilteredCount++;
              if (effectiveMinDays > maxRequiredDays) {
                maxRequiredDays = effectiveMinDays;
              }
              return false;
            }
          }

          // Filter by price range using unified pricing
          const quote = this.computeBoatQuote(boat);
          const totalPrice = quote.total;

          // Always enforce min price
          if (totalPrice < this.selectedPriceMin) {
            return false;
          }

          // Always enforce max price (no gating based on maxPriceAdjusted)
          if (totalPrice > this.selectedPriceMax) {
            return false;
          }

          // Filter by boat length
          const boatLength = boat.length || 0;
          if (boatLength < this.selectedLengthMin) {
            return false;
          }
          // Only apply max length filter if it has been manually adjusted
          if (this.maxLengthAdjusted && boatLength > this.selectedLengthMax) {
            return false;
          }

          // Filter by boat type (case-insensitive)
          if (this.selectedBoatTypes.length > 0) {
            const boatType = boat.boatType;
            if (!boatType) {
              return false;
            }
            // Normalize to lowercase for case-insensitive comparison
            const boatTypeLower = boatType.toLowerCase();
            const selectedTypesLower = this.selectedBoatTypes.map(type => type.toLowerCase());
            if (!selectedTypesLower.includes(boatTypeLower)) {
              return false;
            }
          }

          // Filter by user age if user is logged in and age is available
          if (this.userAge !== null && boat.minAge && this.userAge < boat.minAge) {
            return false;
          }

          // Filter by dock length restrictions (property-based)
          const r = Wized.data.r;
          if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
            const property = r.Load_Property_Details.data.property;

            // If property has private dock, apply dock length restrictions
            if (property.private_dock === true && property.dock_maxBoatLength) {
              const boatLength = boat.length || 0;
              // Extract integer value from dock_maxBoatLength (e.g., "55 ft" -> 55)
              let maxDockLength = 0;
              if (property.dock_maxBoatLength) {
                const match = property.dock_maxBoatLength.match(/\d+/);
                if (match) {
                  maxDockLength = parseInt(match[0], 10);
                }
              }

              // Filter out boats that are too long for the dock
              if (boatLength > maxDockLength) {
                return false;
              }
            }
          }

          // Filter by private dock delivery
          if (this.selectedPrivateDock) {
            // First check if property actually has a private dock
            const r = Wized.data.r;
            if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
              const hasPrivateDock = r.Load_Property_Details.data.property.private_dock;
              if (hasPrivateDock === false) {
                // Property doesn't have private dock, so skip this filter entirely
                return true; // Don't filter out this boat
              }
            }

            // Check if boat delivers
            if (!boat.delivers) {
              return false;
            }

            // Get property city from Wized data
            if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property.listing_city) {
              const propertyCityName = r.Load_Property_Details.data.property.listing_city;

              // Check if boat delivers to the property's city
              if (!boat.deliversTo || !Array.isArray(boat.deliversTo)) {
                return false;
              }

              const canDeliverToProperty = boat.deliversTo.some(location =>
                location.city && location.city.toLowerCase() === propertyCityName.toLowerCase()
              );

              if (!canDeliverToProperty) {
                return false;
              }
            } else {
              // If we can't get property city, hide boats when private dock filter is active
              return false;
            }
          }

          return true;
        });

        // Store min days filter info if boats were filtered due to min days
        if (minDaysFilteredCount > 0 && filteredBoats.length === 0 && boats.length > 0) {
          this.lastMinDaysFilterInfo = {
            requiredDays: maxRequiredDays,
            availableDays: availableDays,
            filteredCount: minDaysFilteredCount,
            totalBoats: boats.length
          };
        }

        return filteredBoats;
      }

      showSkeletonCards() {
        if (!this.cardWrapper) return;

        // Hide all existing cards (including template)
        const existingCards = this.cardWrapper.querySelectorAll('[data-element="addBoatModal_selectBoat_card"]');
        existingCards.forEach(card => {
          card.style.display = 'none';
        });

        // Remove any old skeleton cards
        const oldSkeletons = this.cardWrapper.querySelectorAll('[data-skeleton="true"]');
        oldSkeletons.forEach(skeleton => skeleton.remove());

        // Remove any existing no results message to prevent overlap
        const existingNoResultsMessage = this.cardWrapper.querySelector('.no-results-message');
        if (existingNoResultsMessage) {
          existingNoResultsMessage.remove();
        }

        // Create 6 skeleton cards
        for (let i = 0; i < 6; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'skeleton-card';
          skeleton.setAttribute('data-skeleton', 'true');
          skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-line skeleton-price"></div>
            </div>
          `;
          this.cardWrapper.appendChild(skeleton);
        }

        // Add styles if not already added
        if (!document.getElementById('boat-skeleton-styles')) {
          const style = document.createElement('style');
          style.id = 'boat-skeleton-styles';
          style.textContent = `
            .skeleton-card {
              width: 31.5%;
              height: 340px;
              background: #f9f9f9;
              border-radius: 5px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              background-clip: padding-box;
            }
            
            @media (max-width: 990px) {
              .skeleton-card {
                width: 100%;
              }
            }
            
            .skeleton-image {
              width: 100%;
              height: 200px;
              background: linear-gradient(to right, #f9f9f9 25%, #f0f0f0 50%, #f9f9f9 75%);
              background-size: 200% 100%;
              animation: skeleton-loading 1s infinite linear;
            }
            
            .skeleton-content {
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .skeleton-line {
              height: 16px;
              background: linear-gradient(to right, #f9f9f9 25%, #f0f0f0 50%, #f9f9f9 75%);
              background-size: 200% 100%;
              animation: skeleton-loading 1s infinite linear;
              border-radius: 5px;
              background-clip: padding-box;
            }
            
            .skeleton-title {
              width: 80%;
              height: 20px;
            }
            
            .skeleton-subtitle {
              width: 60%;
            }
            
            .skeleton-price {
              width: 40%;
              margin-top: auto;
            }
            
            @keyframes skeleton-loading {
              0% {
                background-position: -100% 0;
              }
              100% {
                background-position: 100% 0;
              }
            }
          `;
          document.head.appendChild(style);
        }
      }

      hideSkeletonCards() {
        if (!this.cardWrapper) return;

        // Remove all skeleton cards
        const skeletons = this.cardWrapper.querySelectorAll('[data-skeleton="true"]');
        skeletons.forEach(skeleton => skeleton.remove());
      }

      async fetchAndRenderBoats() {
        try {
          // Show skeleton cards while loading
          this.showSkeletonCards();

          // Fetch all boat options (user age is loaded inside fetchBoatOptions)
          const allBoats = await this.fetchBoatOptions();

          // Store initial boats on first fetch (for disabled dates logic)
          if (this.initialBoats.length === 0) {
            this.initialBoats = [...allBoats];

            // Check if any boat allows half day after considering all minimums
            // (boat min, public dock min, and private dock min)
            this.allowsHalfDay = allBoats.some(boat => {
              const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
              const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
              const boatMinDays = boat.minReservationLength || 0;

              // Get private dock min (consider all possible private docks)
              let privateDockMinDays = 0;
              if (boat.privateDockDeliveryLocations && boat.privateDockDeliveryLocations.length > 0) {
                // Get the minimum across all private dock options for this boat
                const privateDockMins = boat.privateDockDeliveryLocations.map(loc =>
                  loc.minDays ? Number(loc.minDays) : 0
                );
                privateDockMinDays = Math.min(...privateDockMins);
              }

              // Effective minimum is the max of all minimums
              const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

              // Allow half day only if effective minimum is less than 1
              return effectiveMinDays < 1;
            });

            // Update full/half day container visibility
            if (this.fullHalfDayContainer) {
              this.fullHalfDayContainer.style.display = this.allowsHalfDay ? 'flex' : 'none';
            }
          }

          // Filter boats based on current filters
          const filteredBoats = this.filterBoats(allBoats);

          // Sort boats by length (smallest to largest)
          const sortedBoats = filteredBoats.sort((a, b) => {
            const lengthA = a.length || 0;
            const lengthB = b.length || 0;
            return lengthA - lengthB;
          });

          // Store current available boats
          this.availableBoats = sortedBoats;

          // Hide skeleton cards
          this.hideSkeletonCards();

          // Render the sorted boats
          this.renderBoatCards(sortedBoats);

          // Check private dock filter availability now that boats are loaded
          this.checkPrivateDockFilterAvailabilityForBoatDates();

          return sortedBoats;
        } catch (error) {
          // Hide skeleton cards on error too
          this.hideSkeletonCards();
          this.renderBoatCards([]);
          this.availableBoats = [];

          // Check private dock filter availability even on error
          this.checkPrivateDockFilterAvailabilityForBoatDates();

          return [];
        }
      }

      async fetchBoatOptions() {
        try {
          // Load user age first
          await this.loadUserAge();

          // Get property ID from URL
          const urlParams = new URLSearchParams(window.location.search);
          const propertyId = urlParams.get('id');

          if (!propertyId) {
            return [];
          }

          const params = new URLSearchParams({
            propertyID: propertyId
          });

          // Add user age to params if available, otherwise send null
          if (this.userAge !== null) {
            params.set('userAge', this.userAge);
          } else {
            params.set('userAge', '');
          }

          // Make API call
          const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/boatResults_listingPage?${params}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch boat options');
          }


          const data = await response.json();

          // Handle new API response format
          if (data.boatResults && data.boatCompanyResults) {
            const boats = data.boatResults;
            const companies = data.boatCompanyResults;

            // Create a map of companies by ID for quick lookup
            const companyMap = {};
            companies.forEach(company => {
              companyMap[company.id] = company;
            });

            // Merge company data into each boat
            const mergedBoats = boats.map(boat => {
              const company = companyMap[boat.boat_company_id];
              if (company) {
                // Merge company data into boat
                return {
                  ...boat,
                  serviceFee: company.serviceFee,
                  delivers: company.delivers,
                  deliveryMinLength: company.deliveryMinLength || 0,
                  deliversTo: company.privateDockDeliveryCity || [],
                  address: company.address || '',
                  city: company.city || '',
                  companyName: company.name || '',
                  companyDescription: company.company_description || '',
                  companyProfileImage: company.profilePic || '',
                  companyDeliveryFee: company.deliveryFee || 0,
                  companyDelivers: company.delivers || false,
                  minAge: company.minAge || 0,
                  integrationType: company.integration_type || '',
                  publicDockDeliveryDetails: company.publicDockDeliveryDetails || [],
                };
              }
              return boat;
            });
            return mergedBoats;
          }

          // Fallback for old format (if data is directly an array)
          return Array.isArray(data) ? data : [];

        } catch (error) {
          return [];
        }
      }

      getNoResultsMessage() {
        // Determine the most relevant reason for no results (show only one)
        const r = window.Wized?.data?.r;
        const hasPropertyCity = r?.Load_Property_Details?.data?.property?.listing_city;

        if (!hasPropertyCity) {
          return 'No boat rentals available for this stay.';
        }

        // Priority 0: Check if boats were filtered due to minimum days requirement
        // This is the most accurate since it was tracked during actual filtering
        if (this.lastMinDaysFilterInfo) {
          const { requiredDays, availableDays } = this.lastMinDaysFilterInfo;
          return `Boat rentals for this listing's location require ${requiredDays} day${requiredDays > 1 ? 's' : ''}, but your stay is only ${availableDays} day${availableDays > 1 ? 's' : ''}. Extend your dates or select another property.`;
        }

        // Priority 1: Check private dock delivery filter (most restrictive)
        if (this.selectedPrivateDock) {
          const hasPrivateDock = r?.Load_Property_Details?.data?.property?.private_dock;
          if (hasPrivateDock === false) {
            return 'Private dock delivery filter is active, but this property has no private dock.';
          } else {
            // Check if boats exist but don't meet private dock minimum days requirement
            if (this.selectedDates.length > 0) {
              // Try to find the minimum private dock days requirement from available boats
              // This would require checking boats, but we can give a helpful generic message
              return `No boats available with private dock delivery for ${this.selectedDates.length} day${this.selectedDates.length > 1 ? 's' : ''}. Some boats may require a longer minimum rental for dock delivery. Try selecting more days or removing the private dock filter.`;
            } else {
              return 'No boats can deliver to this property\'s private dock. Try removing the private dock filter.';
            }
          }
        }

        // Priority 2: Check date-related issues (minimum days requirement)
        // Note: This is now mostly handled by lastMinDaysFilterInfo above
        if (this.selectedDates.length > 0 && this.selectedDates.length < 7) {
          return `You selected ${this.selectedDates.length} day${this.selectedDates.length > 1 ? 's' : ''}, but available boats require a longer minimum rental. Try selecting more days.`;
        }

        // Priority 3: Check boat type filter
        if (this.selectedBoatTypes.length > 0) {
          const types = this.selectedBoatTypes.join(', ');
          return `No boats match the selected type${this.selectedBoatTypes.length > 1 ? 's' : ''}: ${types}. Try removing the boat type filter.`;
        }

        // Priority 4: Check passenger filter
        if (this.selectedGuests > 0 && this.selectedGuests > 6) {
          return `${this.selectedGuests} passengers exceeds most boat capacities. Try reducing the number of passengers.`;
        }

        // Priority 5: Check price filter
        const defaultMaxPrice = 10000;
        if (this.selectedPriceMin > 0 || this.selectedPriceMax < defaultMaxPrice) {
          const priceRange = `$${this.selectedPriceMin.toLocaleString()} - $${this.selectedPriceMax.toLocaleString()}`;
          return `No boats available in the ${priceRange} price range. Try adjusting your price filter.`;
        }

        // Priority 6: Check length filter
        const defaultMaxLength = 50;
        if (this.selectedLengthMin > 0 || (this.maxLengthAdjusted && this.selectedLengthMax < defaultMaxLength)) {
          return `No boats match the ${this.selectedLengthMin}ft - ${this.selectedLengthMax}ft length range. Try adjusting the length filter.`;
        }

        // Default: No boats service this location
        return 'No boat rentals service this listing location. Try selecting a different property or check back later.';
      }

      renderBoatCards(boats) {
        if (!this.cardWrapper) return;

        // First, remove any skeleton cards - this ensures clean state transition
        const skeletons = this.cardWrapper.querySelectorAll('[data-skeleton="true"]');
        skeletons.forEach(skeleton => skeleton.remove());

        // Clear any existing duplicated cards
        const existingCards = this.cardWrapper.querySelectorAll('[data-element="addBoatModal_selectBoat_card"]');
        existingCards.forEach((card, index) => {
          if (index !== 0) { // Keep the template card
            card.remove();
          }
        });

        // Clear any existing no results message
        const existingNoResultsMessage = this.cardWrapper.querySelector('.no-results-message');
        if (existingNoResultsMessage) {
          existingNoResultsMessage.remove();
        }

        // If no boats, hide the template card and show no results message
        if (boats.length === 0) {
          this.cardTemplate.style.display = 'none';

          // Create and add no results message with specific reason
          const noResultsMessage = document.createElement('div');
          noResultsMessage.className = 'no-results-message';
          noResultsMessage.style.fontFamily = 'TT Fors, sans-serif !important';
          noResultsMessage.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
            color: black;
            font-size: 16px;
            width: 100%;
            min-height: 200px;
            gap: 12px;
          `;

          const message = this.getNoResultsMessage();
          noResultsMessage.innerHTML = `
            <div style="font-weight: 600; font-size: 18px;">No boat rentals found</div>
            <div style="font-size: 14px; color: #666; max-width: 400px;">${message}</div>
          `;

          this.cardWrapper.appendChild(noResultsMessage);
          return;
        }

        // Show and populate cards for each boat
        boats.forEach((boat, index) => {
          let card;
          if (index === 0) {
            // Use the template card for the first boat
            card = this.cardTemplate;
          } else {
            // Clone the template for additional boats
            card = this.cardTemplate.cloneNode(true);
            this.cardWrapper.appendChild(card);
          }

          // Show the card
          card.style.display = 'flex';

          // Store boat data
          card.boatData = boat;

          // Sequential loading: first 2 cards load immediately, rest load with small delays
          if (index < 2) {
            // Load first 2 immediately for instant feedback
            this.populateBoatCard(card, boat, false);
          } else {
            // Load the rest sequentially with small delays
            this.populateBoatCard(card, boat, true); // Defer carousel initially

            // Load carousel after a small delay (50ms per card after the first 2)
            setTimeout(() => {
              const photosContainer = card.querySelector('[data-element="addBoatModal_selectBoat_card_photos"]');
              if (photosContainer && boat.photos && boat.photos.length > 0) {
                this.setupBoatCardImagesCarousel(photosContainer, boat, card);
              }
            }, (index - 2) * 50); // Stagger by 50ms each
          }
        });
      }

      populateBoatCard(card, boat, deferCarousel = false) {
        // Store boat data on the card for later updates
        card.boatData = boat;

        // Add click handlers for card interactions only if not already added
        const moreDetailsButton = card.querySelector('[data-element="addBoatModal_selectBoat_card_moreDetails"]');

        // Make entire card clickable (except for specific interactive elements)
        card.style.cursor = 'pointer';

        // Remove old event listener if exists and add new one
        if (!card.hasAttribute('data-click-initialized')) {
          card.setAttribute('data-click-initialized', 'true');
          card.addEventListener('click', (e) => {
            // Prevent navigation if clicking on interactive elements
            if (e.target.closest('[data-element="addBoatModal_selectBoat_card_moreDetails"]')) {
              return;
            }
            // Get the current boat data from the card (in case it was updated)
            const currentBoat = card.boatData || boat;
            this.showBoatDetails(currentBoat);
          });
        } else {
          // Update the boat data reference for the existing listener
          card.boatData = boat;
        }

        // Add click handler for more details button if it exists
        if (moreDetailsButton && !moreDetailsButton.hasAttribute('data-click-initialized')) {
          moreDetailsButton.setAttribute('data-click-initialized', 'true');
          moreDetailsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            const currentBoat = card.boatData || boat;
            this.showBoatDetails(currentBoat);
          });
        }

        // Populate card title
        const titleElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_title"]');
        if (titleElement) {
          titleElement.textContent = boat.name || '';
        }

        // Populate card subtitle (reservation type or selected dates)
        const subtitleElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_subTitle"]');
        if (subtitleElement) {
          if (this.selectedDates.length === 0) {
            subtitleElement.textContent = this.getReservationTypeText(boat);
          } else {
            subtitleElement.textContent = this.getSelectedDatesText();
          }
        }

        // Populate card price
        const priceElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_price"]');
        if (priceElement) {
          if (this.selectedDates.length === 0) {
            priceElement.textContent = this.getStartingPriceText(boat);
          } else {
            priceElement.textContent = this.calculateSelectedPriceText(boat);
          }
        }

        // Populate card photo carousel (defer if requested for progressive loading)
        if (!deferCarousel) {
          const photosContainer = card.querySelector('[data-element="addBoatModal_selectBoat_card_photos"]');
          if (photosContainer && boat.photos && boat.photos.length > 0) {
            this.setupBoatCardImagesCarousel(photosContainer, boat, card);
          }
        } else {
          // Add placeholder for carousel to maintain layout
          const photosContainer = card.querySelector('[data-element="addBoatModal_selectBoat_card_photos"]');
          if (photosContainer) {
            photosContainer.innerHTML = '<div style="width: 100%; height: 280px; background-color: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #ccc;"></div>';
          }
        }

        // Populate review ratings
        const ratingAvgElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_ratingAvg"]');
        const ratingNumberElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_ratingNumber"]');

        if (ratingAvgElement && ratingNumberElement) {
          if (!boat.reviews || boat.reviews.length === 0) {
            // No reviews
            ratingAvgElement.textContent = 'New';
            ratingNumberElement.textContent = '';
          } else {
            // Calculate average rating
            const ratings = boat.reviews.map(review => review.rating);
            const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

            // Display average rating with one decimal place
            ratingAvgElement.textContent = averageRating.toFixed(1);
            ratingNumberElement.textContent = `(${boat.reviews.length})`;
          }
        }
      }

      getReservationTypeText(boat) {
        const boatMinLength = boat.minReservationLength || 0;

        // Check for public dock delivery minimum days
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;

        // Only consider private dock minimum if private dock delivery is selected
        let privateDockMinDays = 0;
        if (this.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        // Use the maximum of boat minimum, public dock minimum, and private dock minimum (if selected)
        const effectiveMinLength = Math.max(boatMinLength, publicDockMinDays, privateDockMinDays);

        if (effectiveMinLength === 0) {
          return "Daily (4-8 hours) • Multi-Day";
        } else if (effectiveMinLength === 0.5) {
          return "Daily (4-8 Hours) • Multi-Day";
        } else if (effectiveMinLength === 1) {
          return "Daily (8 hours) • Multi-Day";
        } else {
          return `Multi-Day (${effectiveMinLength} days min)`;
        }
      }

      getSelectedDatesText() {
        const numDates = this.selectedDates.length;

        if (numDates === 1) {
          if (this.selectedLengthType === 'half') {
            return "1 Half Day";
          } else {
            return "1 Full Day";
          }
        } else {
          return `${numDates} full days`;
        }
      }

      getStartingPriceText(boat) {
        const boatMinLength = boat.minReservationLength || 0;

        // Check for public dock delivery minimum days
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;

        // Only consider private dock minimum if private dock delivery is selected
        let privateDockMinDays = 0;
        if (this.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        // Use the maximum of boat minimum, public dock minimum, and private dock minimum (if selected)
        const effectiveMinLength = Math.max(boatMinLength, publicDockMinDays, privateDockMinDays);

        // Use unified pricing with no dates selected
        const quote = this.computeBoatQuote(boat, {
          selectedDates: [],
          selectedLengthType: this.selectedLengthType,
          selectedPrivateDock: this.selectedPrivateDock,
          selectedGuests: this.selectedGuests
        });

        return `Starting at $${quote.total.toLocaleString()}`;
      }

      calculateSelectedPriceText(boat) {
        // Use unified pricing calculation
        const quote = this.computeBoatQuote(boat);
        return `$${quote.total.toLocaleString()} total before taxes`;
      }

      updateExistingCards() {
        // Update all visible boat cards with current filter settings
        const visibleCards = this.cardWrapper.querySelectorAll('[data-element="addBoatModal_selectBoat_card"]');
        visibleCards.forEach((card, index) => {
          if (card.style.display === 'flex' && card.boatData) {
            this.populateBoatCard(card, card.boatData);
          }
        });
      }

      closeModal() {
        // Close all popups first
        this.closeAllPopups();

        this.modal.style.display = 'none';
        this.detailsWrapper.style.display = 'none';

        // Reset scroll positions
        const detailsContent = document.querySelector('[data-element="boatDetails_contentContainer"]');
        if (detailsContent) {
          detailsContent.scrollTop = 0;
        }

        // Show select wrapper for next time modal is opened
        this.selectWrapper.style.display = 'flex';

        // Re-enable body scroll
        document.body.classList.remove('no-scroll');

        // If we were in edit mode and user cancelled, restore original URL params
        if (this.isEditMode && this.originalEditParams) {
          const url = new URL(window.location);

          // Restore all original parameters
          if (this.originalEditParams.boatId) {
            url.searchParams.set('boatId', this.originalEditParams.boatId);
          }
          if (this.originalEditParams.boatGuests) {
            url.searchParams.set('boatGuests', this.originalEditParams.boatGuests);
          }
          if (this.originalEditParams.boatDates) {
            url.searchParams.set('boatDates', this.originalEditParams.boatDates);
          }
          if (this.originalEditParams.boatPickupTime) {
            url.searchParams.set('boatPickupTime', this.originalEditParams.boatPickupTime);
          }
          if (this.originalEditParams.boatLengthType) {
            url.searchParams.set('boatLengthType', this.originalEditParams.boatLengthType);
          }
          if (this.originalEditParams.boatPrivateDock) {
            url.searchParams.set('boatPrivateDock', this.originalEditParams.boatPrivateDock);
          }
          if (this.originalEditParams.boatDelivery) {
            url.searchParams.set('boatDelivery', this.originalEditParams.boatDelivery);
          }

          window.history.replaceState({}, '', url);
        }

        // Reset editing state
        this.isEditMode = false;
        this.originalEditParams = null;

        // Update reservation block visibility (should show in desktop view)
        this.updateReservationBlockVisibility();
      }

      resetModalState() {
        // Clear all filter state
        this.selectedDates = [];
        this.selectedLengthType = 'full';
        this.selectedPickupTime = '';
        this.selectedGuests = 0;
        // Don't reset price constraints unless explicitly clearing filters
        // this.selectedPriceMin = 0;
        // this.selectedPriceMax = Infinity;
        // this.maxPriceAdjusted = false;
        this.selectedLengthMin = 0;
        this.selectedLengthMax = 50;
        this.maxLengthAdjusted = false;
        this.selectedBoatTypes = [];
        this.selectedPrivateDock = false;
        this.deliverySelected = false;

        // Reset pickup time pills
        Object.values(this.pickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });

        // Reset boat details pickup time pills
        Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });

        // Update guest number displays
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        if (this.boatDetailsGuestNumber) this.boatDetailsGuestNumber.textContent = this.selectedGuests;

        // Update all filter texts
        this.updateDatesFilterText();
        this.updatePickupTimeFilterText();
        this.updateGuestsFilterText();
        this.updatePriceFilterText();
        this.updateLengthFilterText();
        this.updateBoatTypeFilterText();
        this.updatePrivateDockFilterText();
        this.updateBoatDetailsDateFilterText();
        this.updateBoatDetailsPickupTimeFilterText();
        this.updateBoatDetailsGuestsFilterText();

        // Update filter styles
        this.updateFilterStyles();
        this.updateLengthTypeButtons();
        this.updateBoatDetailsLengthTypeButtons();

        // Reset date button styles
        this.updateDateButtonStyles();
        this.updateBoatDetailsDateButtonStyles();

        // Re-render date selections
        this.renderDateSelection();
        this.renderBoatDetailsDateSelection();

        // Reset disabled states
        this.updateDateButtonDisabledStates();
      }

      async handleButtonClick() {
        if (!this.areDatesValid()) {
          const urlParams = new URLSearchParams(window.location.search);
          const checkin = urlParams.get('checkin');
          const checkout = urlParams.get('checkout');
          const hasDates = urlParams.has('checkin') && urlParams.has('checkout') &&
            checkin !== '' && checkout !== '';

          const message = hasDates
            ? 'Valid dates must be selected to add boat rental'
            : 'Dates must be selected to add boat rental';

          this.showMessage(message);

          // Flash check availability button if no dates are selected
          if (!hasDates) {
            this.flashCheckAvailabilityButton();
          }

          return;
        }

        // Close all popups when modal opens
        this.closeAllPopups();

        // Load user age for age-based filtering
        await this.loadUserAge();

        // Ensure modal always opens to select wrapper view
        this.detailsWrapper.style.display = 'none';
        this.selectWrapper.style.display = 'flex';

        // Show modal
        this.modal.style.display = 'flex';

        // Prevent body scroll when modal is open
        document.body.classList.add('no-scroll');

        // Apply pickup time gating when modal opens
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

        // Check if private dock filter should be available based on property stay length
        this.checkPrivateDockFilterAvailability();

        // Fetch and render boat options with filtering
        await this.fetchAndRenderBoats();

        // Render date selection to set up initial disabled states
        this.renderDateSelection();
      }

      // Check if private dock delivery is available for the current property stay
      checkPrivateDockFilterAvailability() {
        const r = Wized.data.r;
        if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data || !r.Load_Property_Details.data.property) {
          return;
        }

        const property = r.Load_Property_Details.data.property;
        const hasPrivateDock = property.private_dock === true;

        // If no private dock, filter should already be hidden by checkPropertyPrivateDockStatus
        if (!hasPrivateDock) {
          return;
        }

        // Get property stay length
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout) {
          // No dates selected - show filter (user can select dates that meet requirements)
          if (this.privateDockFilter) {
            this.privateDockFilter.style.display = '';
          }
          return;
        }

        const checkInDate = new Date(checkin);
        const checkOutDate = new Date(checkout);
        const nightsDiff = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const propertyStayDays = nightsDiff + 1; // Convert nights to days

        // If property stay is very short (< 3 days), likely no boats will offer private dock delivery
        // Hide the filter to avoid confusion
        if (propertyStayDays < 3 && this.privateDockFilter) {
          this.privateDockFilter.style.display = 'none';

          // If private dock was selected, deselect it
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          }
        } else {
          // Show filter - individual boats will determine if they can deliver
          if (this.privateDockFilter) {
            this.privateDockFilter.style.display = '';
          }
        }
      }

      areDatesValid() {
        // Check if dates exist in URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout || checkin === '' || checkout === '') {
          return false;
        }

        // Get calendar data from Wized (with fallback)
        const r = Wized.data.r || {};

        // Check if we have calendar data and property details
        if (!r.Load_Property_Calendar_Query ||
          !r.Load_Property_Calendar_Query.data ||
          !r.Load_Property_Details ||
          !r.Load_Property_Details.data) {
          return false;
        }

        const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
        const minNights = r.Load_Property_Details.data.property.min_nights;

        let allAvailable = true;
        let consecutiveAvailableDays = 0;
        let meetsMinNights = false;

        // Check each day in the range
        for (let i = 0; i < propertyCalendarRange.length; i++) {
          if (propertyCalendarRange[i].status === "available") {
            consecutiveAvailableDays++;
            if (consecutiveAvailableDays >= minNights) {
              meetsMinNights = true;
            }
          } else {
            consecutiveAvailableDays = 0;
            allAvailable = false;
          }
        }

        const result = allAvailable && meetsMinNights;

        // Return true only if all days are available and minimum nights requirement is met
        return result;
      }

      showMessage(message) {
        // Clear any existing message
        if (this.messageTimeout) {
          clearTimeout(this.messageTimeout);
        }

        // Create or get message element
        let messageElement = document.querySelector('.boat-rental-message');
        if (!messageElement) {
          messageElement = document.createElement('div');
          messageElement.className = 'boat-rental-message';
          document.body.appendChild(messageElement);

          // Add styles
          const style = document.createElement('style');
          style.textContent = `
            .boat-rental-message {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #323232;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              z-index: 9999;
              display: none;
              font-family: 'TT Fors', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            /* Mobile positioning - 10px above mobileBoatButton */
            @media (max-width: 990px) {
              .boat-rental-message {
                top: auto;
                bottom: calc(70px + 10px); /* mobileBoatButton height + 10px gap */
                left: 50%;
                transform: translateX(-50%);
              }
            }
            
            /* Shake animation for check availability button */
            @keyframes shake-button {
              0%, 100% { transform: translateX(0); }
              15% { transform: translateX(-3px); }
              30% { transform: translateX(3px); }
              45% { transform: translateX(-2px); }
              60% { transform: translateX(2px); }
              75% { transform: translateX(-1px); }
              90% { transform: translateX(1px); }
            }
            
            .shake-animation {
              animation: shake-button 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
            }
          `;
          document.head.appendChild(style);
        }

        // Show message
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // Shake the check availability button to draw attention
        const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');
        checkAvailabilityButtons.forEach(button => {
          // Remove existing animation if present
          button.classList.remove('shake-animation');

          // Trigger reflow to restart animation
          void button.offsetWidth;

          // Add shake animation
          button.classList.add('shake-animation');

          // Remove animation class after it completes
          setTimeout(() => {
            button.classList.remove('shake-animation');
          }, 600);
        });

        // Hide after 3 seconds
        this.messageTimeout = setTimeout(() => {
          messageElement.style.display = 'none';
        }, 3000);
      }

      updateButtonState() {
        const isValid = this.areDatesValid();

        // Update all button styles
        this.buttons.forEach(button => {
          if (button) {
            button.style.borderColor = isValid ? '' : '#e2e2e2';
            button.style.opacity = isValid ? '1' : '0.5';
            button.style.cursor = isValid ? 'pointer' : 'not-allowed';
          }
        });
      }

      setupDateParameterMonitoring() {
        // Store current parameter values
        let lastCheckin = '';
        let lastCheckout = '';

        // Check for parameter changes every second
        const checkParameters = () => {
          const urlParams = new URLSearchParams(window.location.search);
          const currentCheckin = urlParams.get('checkin') || '';
          const currentCheckout = urlParams.get('checkout') || '';

          // If checkin or checkout parameters have changed
          if (currentCheckin !== lastCheckin || currentCheckout !== lastCheckout) {
            lastCheckin = currentCheckin;
            lastCheckout = currentCheckout;

            // Re-initialize from URL parameters
            this.initializeFromURL();

            // Re-initialize date selection functionality
            this.renderDateSelection();
            this.updateButtonState();
            this.updateDatesFilterText();
            this.updatePickupTimeFilterText();
            this.updateFilterStyles();

            // Also update boat details section if it exists
            this.renderBoatDetailsDateSelection();
            this.updateBoatDetailsDateFilterText();
            this.updateBoatDetailsLengthTypeButtons();
          }
        };

        // Check initially and then every second
        checkParameters();
        setInterval(checkParameters, 1000);
      }

      setupFilterXButtons() {
        // Setup dates X button
        if (this.datesFilterX) {
          this.datesFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearDatesFilter();
          });
        }

        // Setup pickup time X button
        if (this.pickupTimeFilterX) {
          this.pickupTimeFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearPickupTimeFilter();
          });
        }

        // Setup guests X button
        if (this.guestsFilterX) {
          this.guestsFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearGuestsFilter();
          });
        }

        // Setup price X button
        if (this.priceFilterX) {
          this.priceFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearPriceFilter();
          });
        }

        // Setup length X button
        if (this.lengthFilterX) {
          this.lengthFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearLengthFilter();
          });
        }

        // Setup boat type X button
        if (this.typeFilterX) {
          this.typeFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearBoatTypeFilter();
          });
        }

        // Setup private dock X button
        if (this.privateDockFilterX) {
          this.privateDockFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearPrivateDockFilter();
          });
        }

        // Initialize X button visibility and filter styles
        this.updateFilterStyles();
      }

      clearDatesFilter() {
        // Close all popups
        this.closeAllPopups();

        // Clear date-related filters (excluding pickup time now)
        this.selectedDates = [];
        this.selectedLengthType = 'full';

        // Update UI elements
        this.updateLengthTypeButtons();
        this.updateDatesFilterText();
        this.updateDateButtonStyles();
        this.updateFilterStyles();
        this.updateExistingCards();
        this.updateURLParams();

        // Reset disabled states when dates are cleared
        this.updateDateButtonDisabledStates();

        // Re-check private dock filter availability when dates are cleared
        this.checkPrivateDockFilterAvailabilityForBoatDates();

        // Re-filter boats to show all boats again
        this.fetchAndRenderBoats();
      }

      clearPickupTimeFilter() {
        // Close all popups
        this.closeAllPopups();

        // Clear pickup time filter
        this.selectedPickupTime = '';

        // Reset pickup time pills
        Object.values(this.pickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });
        Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });

        // Update UI elements
        this.updatePickupTimeFilterText();
        this.updateBoatDetailsPickupTimeFilterText();
        this.updateFilterStyles();
        this.updateExistingCards();
        this.updateURLParams();
        // Re-filter boats to show all boats again
        this.fetchAndRenderBoats();
      }

      clearGuestsFilter() {
        // Close all popups
        this.closeAllPopups();

        // Clear guests filter
        this.selectedGuests = 0;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;

        // Update UI elements
        this.updateGuestsFilterText();
        this.updateFilterStyles();
        this.refilterBoatsIfModalOpen();
        this.updateURLParams();
      }

      updateFilterStyles() {
        // Update dates filter button style (only for dates, not pickup time)
        if (this.datesFilter && this.datesFilterText) {
          const hasDatesFilter = this.selectedDates.length > 0;

          if (hasDatesFilter) {
            this.datesFilter.style.backgroundColor = '#000000';
            this.datesFilter.style.color = '#ffffff';
            this.datesFilterText.style.color = '#ffffff';
          } else {
            this.datesFilter.style.backgroundColor = '';
            this.datesFilter.style.color = '';
            this.datesFilterText.style.color = '';
          }
        }

        // Update pickup time filter button style (separate from dates now)
        if (this.pickupTimeFilter && this.pickupTimeFilterText) {
          const hasPickupTimeFilter = this.selectedPickupTime !== '';

          if (hasPickupTimeFilter) {
            this.pickupTimeFilter.style.backgroundColor = '#000000';
            this.pickupTimeFilter.style.color = '#ffffff';
            this.pickupTimeFilterText.style.color = '#ffffff';
          } else {
            this.pickupTimeFilter.style.backgroundColor = '';
            this.pickupTimeFilter.style.color = '';
            this.pickupTimeFilterText.style.color = '';
          }
        }

        // Update guests filter button style
        if (this.guestsFilter && this.guestsFilterText) {
          const hasGuestsFilter = this.selectedGuests > 0;

          if (hasGuestsFilter) {
            this.guestsFilter.style.backgroundColor = '#000000';
            this.guestsFilter.style.color = '#ffffff';
            this.guestsFilterText.style.color = '#ffffff';
          } else {
            this.guestsFilter.style.backgroundColor = '';
            this.guestsFilter.style.color = '';
            this.guestsFilterText.style.color = '';
          }
        }

        // Update price filter button style
        if (this.priceFilter && this.priceFilterText) {
          const hasPriceFilter = this.selectedPriceMin > 0 || (this.selectedPriceMax !== Infinity && this.maxPriceAdjusted);

          if (hasPriceFilter) {
            this.priceFilter.style.backgroundColor = '#000000';
            this.priceFilter.style.color = '#ffffff';
            this.priceFilterText.style.color = '#ffffff';
          } else {
            this.priceFilter.style.backgroundColor = '';
            this.priceFilter.style.color = '';
            this.priceFilterText.style.color = '';
          }
        }

        // Update length filter button style
        if (this.lengthFilter && this.lengthFilterText) {
          const hasLengthFilter = this.selectedLengthMin > 0 || this.maxLengthAdjusted;

          if (hasLengthFilter) {
            this.lengthFilter.style.backgroundColor = '#000000';
            this.lengthFilter.style.color = '#ffffff';
            this.lengthFilterText.style.color = '#ffffff';
          } else {
            this.lengthFilter.style.backgroundColor = '';
            this.lengthFilter.style.color = '';
            this.lengthFilterText.style.color = '';
          }
        }

        // Update boat type filter button style
        if (this.typeFilter && this.typeFilterText) {
          const hasTypeFilter = this.selectedBoatTypes.length > 0;

          if (hasTypeFilter) {
            this.typeFilter.style.backgroundColor = '#000000';
            this.typeFilter.style.color = '#ffffff';
            this.typeFilterText.style.color = '#ffffff';
          } else {
            this.typeFilter.style.backgroundColor = '';
            this.typeFilter.style.color = '';
            this.typeFilterText.style.color = '';
          }
        }

        // Update private dock filter button style
        if (this.privateDockFilter && this.privateDockFilterText) {
          if (this.selectedPrivateDock) {
            this.privateDockFilter.style.backgroundColor = '#000000';
            this.privateDockFilter.style.color = '#ffffff';
            this.privateDockFilterText.style.color = '#ffffff';
          } else {
            this.privateDockFilter.style.backgroundColor = '';
            this.privateDockFilter.style.color = '';
            this.privateDockFilterText.style.color = '';
          }
        }

        // Update X button visibility
        this.updateXButtonVisibility();
      }

      updateXButtonVisibility() {
        // Show/hide dates X button (only for dates, not pickup time anymore)
        if (this.datesFilterX) {
          const hasDatesFilter = this.selectedDates.length > 0;
          this.datesFilterX.style.display = hasDatesFilter ? 'flex' : 'none';
        }

        // Show/hide pickup time X button
        if (this.pickupTimeFilterX) {
          const hasPickupTimeFilter = this.selectedPickupTime !== '';
          this.pickupTimeFilterX.style.display = hasPickupTimeFilter ? 'flex' : 'none';
        }

        // Show/hide guests X button
        if (this.guestsFilterX) {
          const hasGuestsFilter = this.selectedGuests > 0;
          this.guestsFilterX.style.display = hasGuestsFilter ? 'flex' : 'none';
        }

        // Show/hide price X button
        if (this.priceFilterX) {
          const hasPriceFilter = this.selectedPriceMin > 0 || (this.selectedPriceMax !== Infinity && this.maxPriceAdjusted);
          this.priceFilterX.style.display = hasPriceFilter ? 'flex' : 'none';
        }

        // Show/hide length X button
        if (this.lengthFilterX) {
          const hasLengthFilter = this.selectedLengthMin > 0 || this.maxLengthAdjusted;
          this.lengthFilterX.style.display = hasLengthFilter ? 'flex' : 'none';
        }

        // Show/hide boat type X button
        if (this.typeFilterX) {
          const hasTypeFilter = this.selectedBoatTypes.length > 0;
          this.typeFilterX.style.display = hasTypeFilter ? 'flex' : 'none';
        }

        // Show/hide private dock X button
        if (this.privateDockFilterX) {
          this.privateDockFilterX.style.display = this.selectedPrivateDock ? 'flex' : 'none';
        }
      }

      refilterBoatsIfModalOpen() {
        // Only re-filter if the modal is currently open
        if (this.modal && this.modal.style.display === 'flex') {
          this.fetchAndRenderBoats();
        }
      }

      // Single source of truth for boat pricing calculation
      computeBoatQuote(boat, state = null) {
        // Use current state if no state provided
        const currentState = state || {
          selectedDates: this.selectedDates,
          selectedLengthType: this.selectedLengthType,
          selectedPrivateDock: this.selectedPrivateDock,
          selectedGuests: this.selectedGuests
        };

        // Check for public and private dock delivery details
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
        const boatMinDays = boat.minReservationLength || 0;

        // Only consider private dock minimum if private dock delivery is selected
        let privateDockMinDays = 0;
        if (currentState.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        // Calculate effective minimum days (max of public dock, private dock if selected, and boat minimum)
        const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

        let basePrice = 0;
        let numDates = currentState.selectedDates.length;

        // Adjust numDates if it's less than effective minimum
        if (numDates > 0 && effectiveMinDays > 0 && numDates < effectiveMinDays) {
          numDates = effectiveMinDays;
        }

        if (numDates === 0) {
          // No dates selected, use effective minimum or boat minimum
          const minLength = effectiveMinDays > 0 ? effectiveMinDays : (boat.minReservationLength || 0);
          if (minLength <= 0.5) {
            basePrice = boat.pricePerHalfDay || 0;
          } else if (minLength < 1) {
            basePrice = boat.pricePerHalfDay || boat.pricePerDay || 0;
          } else {
            // Use minimum days for pricing
            basePrice = this.calculateMultiDayPrice(boat, minLength);
          }
        } else if (numDates === 1 && effectiveMinDays <= 1) {
          // Single day reservation (only if no minimum days restriction)
          if (currentState.selectedLengthType === 'half') {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else {
          // Multi-day reservation
          basePrice = this.calculateMultiDayPrice(boat, numDates);
        }

        // Add public dock delivery fee to base price (BEFORE service fee calculation)
        let publicDockFee = 0;
        if (publicDockDetails && publicDockDetails.fee) {
          publicDockFee = Number(publicDockDetails.fee) || 0;
        }

        // Add private dock delivery fee ONLY if private dock is selected
        let privateDockFee = 0;
        if (currentState.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          if (privateDockDetails && privateDockDetails.fee) {
            privateDockFee = Number(privateDockDetails.fee) || 0;
          }
        }

        // Calculate service fee on (basePrice + publicDockFee + privateDockFee) unless integrationType is "Manual"
        let serviceFee = 0;
        if (boat.integrationType !== "Manual") {
          serviceFee = (basePrice + publicDockFee + privateDockFee) * (boat.serviceFee || 0);
        }

        // Calculate delivery fee if private dock is selected and boat can deliver
        let deliveryFee = 0;
        if (currentState.selectedPrivateDock && boat.companyDelivers && boat.companyDeliveryFee) {
          deliveryFee = boat.companyDeliveryFee;
        }

        const total = basePrice + publicDockFee + privateDockFee + serviceFee + deliveryFee;

        return {
          base: Math.round(basePrice),
          fees: {
            service: Math.round(serviceFee),
            delivery: Math.round(deliveryFee),
            publicDock: Math.round(publicDockFee),
            privateDock: Math.round(privateDockFee)
          },
          total: Math.round(total),
          effectiveMinDays: effectiveMinDays // Return this for validation
        };
      }

      // Helper method to calculate multi-day pricing
      calculateMultiDayPrice(boat, numDates) {
        if (numDates >= 30 && boat.pricePerMonth) {
          const months = Math.floor(numDates / 30);
          const remainingDays = numDates % 30;
          const monthlyPrice = boat.pricePerMonth * months;

          let dailyRate = boat.pricePerDay || 0;
          if (boat.pricePerWeek) {
            dailyRate = boat.pricePerWeek / 7;
          }

          return Math.round(monthlyPrice + (remainingDays * dailyRate));
        } else if (numDates === 7 && boat.pricePerWeek) {
          return boat.pricePerWeek;
        } else if (numDates > 7 && boat.pricePerWeek) {
          const weeklyDailyRate = boat.pricePerWeek / 7;
          return Math.round(numDates * weeklyDailyRate);
        } else {
          return numDates * (boat.pricePerDay || 0);
        }
      }

      filterBoats(boats) {
        // Reset min days filter tracking before filtering
        this.lastMinDaysFilterInfo = null;
        let minDaysFilteredCount = 0;
        let maxRequiredDays = 0;
        const availableDays = this.getAvailableDaysForMinCheck();

        const filteredBoats = boats.filter(boat => {
          // Filter by guest count
          if (this.selectedGuests > 0 && boat.maxPassengers < this.selectedGuests) {
            return false;
          }

          // Filter by half-day compatibility
          if (this.selectedDates.length === 1 && this.selectedLengthType === 'half') {
            const minLength = boat.minReservationLength || 0;
            if (minLength >= 1) {
              return false; // Boat doesn't allow half days
            }
          }

          // Filter by minimum days requirement
          if (availableDays > 0) {
            const effectiveMinDays = this.getEffectiveMinDaysForBoat(boat);

            // If boat requires more days than available, filter it out
            if (effectiveMinDays > 0 && availableDays < effectiveMinDays) {
              // Track min days filtering info
              minDaysFilteredCount++;
              if (effectiveMinDays > maxRequiredDays) {
                maxRequiredDays = effectiveMinDays;
              }
              return false;
            }
          }

          // Filter by price range using unified pricing
          const quote = this.computeBoatQuote(boat);
          const totalPrice = quote.total;

          // Always enforce min price
          if (totalPrice < this.selectedPriceMin) {
            return false;
          }

          // Always enforce max price (no gating based on maxPriceAdjusted)
          if (totalPrice > this.selectedPriceMax) {
            return false;
          }

          // Filter by boat length
          const boatLength = boat.length || 0;
          if (boatLength < this.selectedLengthMin) {
            return false;
          }
          // Only apply max length filter if it has been manually adjusted
          if (this.maxLengthAdjusted && boatLength > this.selectedLengthMax) {
            return false;
          }

          // Filter by boat type (case-insensitive)
          if (this.selectedBoatTypes.length > 0) {
            const boatType = boat.boatType;
            if (!boatType) {
              return false;
            }
            // Normalize to lowercase for case-insensitive comparison
            const boatTypeLower = boatType.toLowerCase();
            const selectedTypesLower = this.selectedBoatTypes.map(type => type.toLowerCase());
            if (!selectedTypesLower.includes(boatTypeLower)) {
              return false;
            }
          }

          // Filter by user age if user is logged in and age is available
          if (this.userAge !== null && boat.minAge && this.userAge < boat.minAge) {
            return false;
          }

          // Filter by dock length restrictions (property-based)
          const r = Wized.data.r;
          if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
            const property = r.Load_Property_Details.data.property;

            // If property has private dock, apply dock length restrictions
            if (property.private_dock === true && property.dock_maxBoatLength) {
              const boatLength = boat.length || 0;
              // Extract integer value from dock_maxBoatLength (e.g., "55 ft" -> 55)
              let maxDockLength = 0;
              if (property.dock_maxBoatLength) {
                const match = property.dock_maxBoatLength.match(/\d+/);
                if (match) {
                  maxDockLength = parseInt(match[0], 10);
                }
              }

              // Filter out boats that are too long for the dock
              if (boatLength > maxDockLength) {
                return false;
              }
            }
          }

          // Filter by private dock delivery
          if (this.selectedPrivateDock) {
            // First check if property actually has a private dock
            const r = Wized.data.r;
            if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
              const hasPrivateDock = r.Load_Property_Details.data.property.private_dock;
              if (hasPrivateDock === false) {
                // Property doesn't have private dock, so skip this filter entirely
                return true; // Don't filter out this boat
              }
            }

            // Check if boat delivers
            if (!boat.delivers) {
              return false;
            }

            // Get property city from Wized data
            if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property.listing_city) {
              const propertyCityName = r.Load_Property_Details.data.property.listing_city;

              // Check if boat delivers to the property's city
              if (!boat.deliversTo || !Array.isArray(boat.deliversTo)) {
                return false;
              }

              const canDeliverToProperty = boat.deliversTo.some(location =>
                location.city && location.city.toLowerCase() === propertyCityName.toLowerCase()
              );

              if (!canDeliverToProperty) {
                return false;
              }
            } else {
              // If we can't get property city, hide boats when private dock filter is active
              return false;
            }
          }

          return true;
        });

        // Store min days filter info if boats were filtered due to min days
        if (minDaysFilteredCount > 0 && filteredBoats.length === 0 && boats.length > 0) {
          this.lastMinDaysFilterInfo = {
            requiredDays: maxRequiredDays,
            availableDays: availableDays,
            filteredCount: minDaysFilteredCount,
            totalBoats: boats.length
          };
        }

        return filteredBoats;
      }

      // Helper method to calculate available days for min days check
      getAvailableDaysForMinCheck() {
        let daysToCheck = 0;

        // First, check property stay dates from URL (format: YYYY-MM-DD)
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (checkin && checkout && checkin.trim() !== '' && checkout.trim() !== '') {
          const checkinParts = checkin.split('-');
          const checkoutParts = checkout.split('-');

          if (checkinParts.length === 3 && checkoutParts.length === 3) {
            const checkinDate = new Date(Date.UTC(
              parseInt(checkinParts[0]),
              parseInt(checkinParts[1]) - 1,
              parseInt(checkinParts[2]),
              12, 0, 0
            ));
            const checkoutDate = new Date(Date.UTC(
              parseInt(checkoutParts[0]),
              parseInt(checkoutParts[1]) - 1,
              parseInt(checkoutParts[2]),
              12, 0, 0
            ));

            const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
            const nightsDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            if (nightsDiff > 0) {
              daysToCheck = nightsDiff + 1;
            }
          }
        }

        // Override with boat dates if selected (boat dates take precedence)
        if (this.selectedDates.length > 0) {
          daysToCheck = this.selectedDates.length;
        }

        return daysToCheck;
      }

      // Helper method to calculate effective min days for a boat
      getEffectiveMinDaysForBoat(boat) {
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
        const boatMinDays = boat.minReservationLength || 0;

        let privateDockMinDays = 0;
        if (this.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        return Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
      }

      setupPriceFilter() {
        if (!this.priceScrollBar) return;

        const maxPrice = 12000;

        // Create range slider with larger touch targets for mobile
        this.priceScrollBar.innerHTML = `
          <div class="price-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
            <div class="price-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
            <div class="price-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
            <input type="range" class="price-slider-min" min="0" max="${maxPrice}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <input type="range" class="price-slider-max" min="0" max="${maxPrice}" value="${maxPrice}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <div class="price-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <div class="price-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
          </div>
        `;

        const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
        const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
        const range = this.priceScrollBar.querySelector('.price-slider-range');
        const thumbMin = this.priceScrollBar.querySelector('.price-slider-thumb-min');
        const thumbMax = this.priceScrollBar.querySelector('.price-slider-thumb-max');
        const container = this.priceScrollBar.querySelector('.price-slider-container');

        let isDraggingMin = false;
        let isDraggingMax = false;
        let startX = 0;
        let startLeft = 0;

        const updateSlider = () => {
          const minVal = parseInt(sliderMin.value);
          const maxVal = parseInt(sliderMax.value);
          const minPercent = (minVal / maxPrice) * 100;
          const maxPercent = (maxVal / maxPrice) * 100;

          range.style.left = minPercent + '%';
          range.style.width = (maxPercent - minPercent) + '%';
          thumbMin.style.left = minPercent + '%';
          thumbMax.style.left = maxPercent + '%';

          // Update state - use Infinity if slider is at max to represent "no upper bound"
          this.selectedPriceMin = minVal;
          this.selectedPriceMax = maxVal >= maxPrice ? Infinity : maxVal;

          // Set maxPriceAdjusted flag when max value changes from default
          this.maxPriceAdjusted = maxVal < maxPrice;

          // Update inputs
          if (this.priceMinInput) this.priceMinInput.value = '$' + minVal.toLocaleString();
          if (this.priceMaxInput) this.priceMaxInput.value = maxVal >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + maxVal.toLocaleString();

          // Update filter text and styles
          this.updatePriceFilterText();
          this.updateFilterStyles();
          this.refilterBoatsIfModalOpen();
        };

        const handleDragStart = (e, isMin) => {
          // Handle both mouse events and touch objects
          if (e.preventDefault) {
            e.preventDefault();
          }

          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);

          if (isMin) {
            isDraggingMin = true;
            startX = clientX;
            startLeft = parseInt(sliderMin.value);
          } else {
            isDraggingMax = true;
            startX = clientX;
            startLeft = parseInt(sliderMax.value);
          }
        };

        const handleDragMove = (e) => {
          if (!isDraggingMin && !isDraggingMax) return;

          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
          const moveX = clientX - startX;
          const movePercent = (moveX / containerWidth) * 100;
          const moveValue = Math.round((movePercent / 100) * maxPrice);

          if (isDraggingMin) {
            let newValue = Math.max(0, Math.min(startLeft + moveValue, parseInt(sliderMax.value)));
            sliderMin.value = newValue;
          } else if (isDraggingMax) {
            let newValue = Math.max(parseInt(sliderMin.value), Math.min(startLeft + moveValue, maxPrice));
            sliderMax.value = newValue;
          }

          updateSlider();
        };

        const handleDragEnd = () => {
          isDraggingMin = false;
          isDraggingMax = false;
        };

        // Add mouse event listeners for dragging
        thumbMin.addEventListener('mousedown', (e) => handleDragStart(e, true));
        thumbMax.addEventListener('mousedown', (e) => handleDragStart(e, false));
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        // Add touch event listeners for mobile with proper event handling
        thumbMin.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], true);
        });

        thumbMin.addEventListener('touchmove', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMin.addEventListener('touchend', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        thumbMax.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], false);
        });

        thumbMax.addEventListener('touchmove', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMax.addEventListener('touchend', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        // Input event listeners
        sliderMin?.addEventListener('input', () => {
          if (parseInt(sliderMin.value) > parseInt(sliderMax.value)) {
            sliderMin.value = sliderMax.value;
          }
          updateSlider();
        });

        sliderMax?.addEventListener('input', () => {
          if (parseInt(sliderMax.value) < parseInt(sliderMin.value)) {
            sliderMax.value = sliderMin.value;
          }
          updateSlider();
        });

        // Input field formatting
        this.priceMinInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[$,+]/g, '');
        });

        this.priceMinInput?.addEventListener('blur', () => {
          const val = parseInt(this.priceMinInput.value) || 0;
          this.priceMinInput.value = '$' + val.toLocaleString();
          if (sliderMin) {
            sliderMin.value = val;
            updateSlider();
          }
        });

        this.priceMaxInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[$,+]/g, '');
        });

        this.priceMaxInput?.addEventListener('blur', () => {
          let val = parseInt(this.priceMaxInput.value) || maxPrice;
          if (val > maxPrice) val = maxPrice;
          this.priceMaxInput.value = val >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + val.toLocaleString();
          if (sliderMax) {
            sliderMax.value = val;
            updateSlider();
          }
        });

        // Set initial values based on current state
        if (this.priceMinInput) this.priceMinInput.value = '$' + this.selectedPriceMin.toLocaleString();
        if (this.priceMaxInput) {
          if (this.selectedPriceMax === Infinity) {
            this.priceMaxInput.value = `$${maxPrice.toLocaleString()}+`;
          } else {
            this.priceMaxInput.value = this.selectedPriceMax >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + this.selectedPriceMax.toLocaleString();
          }
        }

        // Initialize slider values based on current state
        if (sliderMin) sliderMin.value = this.selectedPriceMin;
        if (sliderMax) sliderMax.value = this.selectedPriceMax === Infinity ? maxPrice : Math.min(this.selectedPriceMax, maxPrice);

        updateSlider();
      }

      clearPriceFilter() {
        // Close all popups
        this.closeAllPopups();

        // Reset price filter to default values
        this.selectedPriceMin = 0;
        this.selectedPriceMax = Infinity; // Use Infinity for no upper bound
        this.maxPriceAdjusted = false; // Reset the adjustment flag

        // Update slider if it exists
        if (this.priceScrollBar) {
          const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
          const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = 12000; // UI slider still shows 12000 as max

          // Trigger update
          const updateEvent = new Event('input');
          if (sliderMin) sliderMin.dispatchEvent(updateEvent);
        }

        // Update UI elements
        this.updatePriceFilterText();
        this.updateFilterStyles();
        this.refilterBoatsIfModalOpen();
      }

      updatePriceFilterText() {
        if (!this.priceFilterText) return;

        const hasFilter = this.selectedPriceMin > 0 || (this.selectedPriceMax !== Infinity && this.maxPriceAdjusted);

        if (!hasFilter) {
          this.priceFilterText.textContent = 'Price';
        } else {
          const minText = this.selectedPriceMin > 0 ? `$${this.selectedPriceMin.toLocaleString()}` : '$0';
          const maxText = this.selectedPriceMax === Infinity || this.selectedPriceMax >= 12000 ? '$12,000+' : `$${this.selectedPriceMax.toLocaleString()}`;
          this.priceFilterText.textContent = `${minText} - ${maxText}`;
        }
      }

      setupLengthFilter() {
        if (!this.lengthScrollBar) return;

        const maxLength = 50;

        // Create range slider with larger touch targets for mobile
        this.lengthScrollBar.innerHTML = `
          <div class="length-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
            <div class="length-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
            <div class="length-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
            <input type="range" class="length-slider-min" min="0" max="${maxLength}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <input type="range" class="length-slider-max" min="0" max="${maxLength}" value="${maxLength}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <div class="length-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <div class="length-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
          </div>
        `;

        const sliderMin = this.lengthScrollBar.querySelector('.length-slider-min');
        const sliderMax = this.lengthScrollBar.querySelector('.length-slider-max');
        const range = this.lengthScrollBar.querySelector('.length-slider-range');
        const thumbMin = this.lengthScrollBar.querySelector('.length-slider-thumb-min');
        const thumbMax = this.lengthScrollBar.querySelector('.length-slider-thumb-max');
        const container = this.lengthScrollBar.querySelector('.length-slider-container');

        let isDraggingMin = false;
        let isDraggingMax = false;
        let startX = 0;
        let startLeft = 0;

        const updateSlider = () => {
          const minVal = parseInt(sliderMin.value);
          const maxVal = parseInt(sliderMax.value);
          const minPercent = (minVal / maxLength) * 100;
          const maxPercent = (maxVal / maxLength) * 100;

          range.style.left = minPercent + '%';
          range.style.width = (maxPercent - minPercent) + '%';
          thumbMin.style.left = minPercent + '%';
          thumbMax.style.left = maxPercent + '%';

          // Update state
          this.selectedLengthMin = minVal;
          this.selectedLengthMax = maxVal;

          // Set maxLengthAdjusted flag when max value changes from default
          this.maxLengthAdjusted = maxVal < maxLength;

          // Update inputs
          if (this.lengthMinInput) this.lengthMinInput.value = minVal + 'ft';
          if (this.lengthMaxInput) this.lengthMaxInput.value = maxVal >= maxLength ? `${maxLength}ft+` : maxVal + 'ft';

          // Update filter text and styles
          this.updateLengthFilterText();
          this.updateFilterStyles();
          this.refilterBoatsIfModalOpen();
        };

        const handleDragStart = (e, isMin) => {
          // Handle both mouse events and touch objects
          if (e.preventDefault) {
            e.preventDefault();
          }

          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);

          if (isMin) {
            isDraggingMin = true;
            startX = clientX;
            startLeft = parseInt(sliderMin.value);
          } else {
            isDraggingMax = true;
            startX = clientX;
            startLeft = parseInt(sliderMax.value);
          }
        };

        const handleDragMove = (e) => {
          if (!isDraggingMin && !isDraggingMax) return;

          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
          const moveX = clientX - startX;
          const movePercent = (moveX / containerWidth) * 100;
          const moveValue = Math.round((movePercent / 100) * maxLength);

          if (isDraggingMin) {
            let newValue = Math.max(0, Math.min(startLeft + moveValue, parseInt(sliderMax.value)));
            sliderMin.value = newValue;
          } else if (isDraggingMax) {
            let newValue = Math.max(parseInt(sliderMin.value), Math.min(startLeft + moveValue, maxLength));
            sliderMax.value = newValue;
          }

          updateSlider();
        };

        const handleDragEnd = () => {
          isDraggingMin = false;
          isDraggingMax = false;
        };

        // Add mouse event listeners for dragging
        thumbMin.addEventListener('mousedown', (e) => handleDragStart(e, true));
        thumbMax.addEventListener('mousedown', (e) => handleDragStart(e, false));
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        // Add touch event listeners for mobile with proper event handling
        thumbMin.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], true);
        });

        thumbMin.addEventListener('touchmove', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMin.addEventListener('touchend', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        thumbMax.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], false);
        });

        thumbMax.addEventListener('touchmove', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMax.addEventListener('touchend', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        // Input event listeners
        sliderMin?.addEventListener('input', () => {
          if (parseInt(sliderMin.value) > parseInt(sliderMax.value)) {
            sliderMin.value = sliderMax.value;
          }
          updateSlider();
        });

        sliderMax?.addEventListener('input', () => {
          if (parseInt(sliderMax.value) < parseInt(sliderMin.value)) {
            sliderMax.value = sliderMin.value;
          }
          updateSlider();
        });

        // Input field formatting
        this.lengthMinInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[ft+]/g, '');
        });

        this.lengthMinInput?.addEventListener('blur', () => {
          const val = parseInt(this.lengthMinInput.value) || 0;
          this.lengthMinInput.value = val + 'ft';
          if (sliderMin) {
            sliderMin.value = val;
            updateSlider();
          }
        });

        this.lengthMaxInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[ft+]/g, '');
        });

        this.lengthMaxInput?.addEventListener('blur', () => {
          let val = parseInt(this.lengthMaxInput.value) || maxLength;
          if (val > maxLength) val = maxLength;
          this.lengthMaxInput.value = val >= maxLength ? `${maxLength}ft+` : val + 'ft';
          if (sliderMax) {
            sliderMax.value = val;
            updateSlider();
          }
        });

        // Set initial values
        if (this.lengthMinInput) this.lengthMinInput.value = '0ft';
        if (this.lengthMaxInput) this.lengthMaxInput.value = `${maxLength}ft+`;

        updateSlider();
      }

      clearLengthFilter() {
        // Close all popups
        this.closeAllPopups();

        // Reset length filter to default values
        this.selectedLengthMin = 0;
        this.selectedLengthMax = 50;
        this.maxLengthAdjusted = false; // Reset the adjustment flag

        // Update slider if it exists
        if (this.lengthScrollBar) {
          const sliderMin = this.lengthScrollBar.querySelector('.length-slider-min');
          const sliderMax = this.lengthScrollBar.querySelector('.length-slider-max');
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = 50;

          // Trigger update
          const updateEvent = new Event('input');
          if (sliderMin) sliderMin.dispatchEvent(updateEvent);
        }

        // Update UI elements
        this.updateLengthFilterText();
        this.updateFilterStyles();
        this.refilterBoatsIfModalOpen();
      }

      updateLengthFilterText() {
        if (!this.lengthFilterText) return;

        const hasFilter = this.selectedLengthMin > 0 || this.maxLengthAdjusted;

        if (!hasFilter) {
          this.lengthFilterText.textContent = 'Length';
        } else {
          const minText = this.selectedLengthMin > 0 ? `${this.selectedLengthMin}ft` : '0ft';
          const maxText = this.selectedLengthMax >= 50 ? '50ft+' : `${this.selectedLengthMax}ft`;
          this.lengthFilterText.textContent = `${minText} - ${maxText}`;
        }
      }

      setupBoatTypeFilter() {
        // Setup boat type category selections
        const boatTypeCategories = [
          { block: this.centerConsoleBlock, checkbox: this.centerConsoleCheckbox, type: 'Center Console' },
          { block: this.flatsBoatBlock, checkbox: this.flatsBoatCheckbox, type: 'Flats Boat' },
          { block: this.deckBoatBlock, checkbox: this.deckBoatCheckbox, type: 'Deck Boat' },
          { block: this.pontoonBoatBlock, checkbox: this.pontoonBoatCheckbox, type: 'Pontoon Boat' },
          { block: this.bayBoatBlock, checkbox: this.bayBoatCheckbox, type: 'Bay boat' },
          { block: this.dualConsoleBoatBlock, checkbox: this.dualConsoleBoatCheckbox, type: 'Dual Console' }
        ];

        boatTypeCategories.forEach(({ block, checkbox, type }) => {
          if (!block || !checkbox) return;

          // Handle clicks on both block and checkbox
          const handleSelection = () => {
            if (this.selectedBoatTypes.includes(type)) {
              // Deselect - remove from array
              this.selectedBoatTypes = this.selectedBoatTypes.filter(t => t !== type);
              checkbox.style.backgroundColor = '';
            } else {
              // Select - add to array
              this.selectedBoatTypes.push(type);
              checkbox.style.backgroundColor = '#000000';
            }

            this.updateBoatTypeFilterText();
            this.updateFilterStyles();
            this.refilterBoatsIfModalOpen();
          };

          block.addEventListener('click', handleSelection);
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent double firing from block click
            handleSelection();
          });
        });

        // Initialize filter text
        this.updateBoatTypeFilterText();
      }

      clearBoatTypeFilter() {
        // Close all popups
        this.closeAllPopups();

        // Reset boat type filter
        this.selectedBoatTypes = [];

        // Reset checkbox styles
        const checkboxes = [
          this.centerConsoleCheckbox,
          this.flatsBoatCheckbox,
          this.deckBoatCheckbox,
          this.pontoonBoatCheckbox,
          this.bayBoatCheckbox,
          this.dualConsoleBoatCheckbox
        ];

        checkboxes.forEach(checkbox => {
          if (checkbox) {
            checkbox.style.backgroundColor = '';
          }
        });

        // Update UI elements
        this.updateBoatTypeFilterText();
        this.updateFilterStyles();
        this.refilterBoatsIfModalOpen();
      }

      updateBoatTypeFilterText() {
        if (!this.typeFilterText) return;

        if (this.selectedBoatTypes.length === 0) {
          this.typeFilterText.textContent = 'Boat type';
        } else if (this.selectedBoatTypes.length === 1) {
          this.typeFilterText.textContent = this.selectedBoatTypes[0];
        } else {
          this.typeFilterText.textContent = `${this.selectedBoatTypes.length} types selected`;
        }
      }

      updatePrivateDockFilterText() {
        if (!this.privateDockFilterText) return;

        if (this.selectedPrivateDock) {
          this.privateDockFilterText.textContent = 'Private dock delivery';
        } else {
          this.privateDockFilterText.textContent = 'Private dock delivery';
        }
      }

      clearPrivateDockFilter() {
        // Close all popups
        this.closeAllPopups();

        this.selectedPrivateDock = false;
        this.updatePrivateDockFilterText();
        this.updateFilterStyles();
        this.updateURLParams(); // Update URL params

        // Sync with delivery checkbox if boat details is open
        if (this.detailsWrapper && this.detailsWrapper.style.display !== 'none') {
          const deliveryCheckbox = document.querySelector('[data-element="boatDetails_reservation_deliveryCheckbox"]');
          if (deliveryCheckbox) {
            this.deliverySelected = false;
            this.updateCheckboxVisual(deliveryCheckbox, this.deliverySelected);
            this.updateDeliveryURLParam(this.deliverySelected);
            // Update pricing if boat details is open
            if (this.currentBoatData) {
              this.updateBoatDetailsPricing(this.currentBoatData);
            }
          }
        }

        this.refilterBoatsIfModalOpen();
      }

      // ==========================================
      // BOAT DETAILS VIEW METHODS
      // ==========================================

      async showBoatDetails(boat) {
        // Close all popups when entering boat details view
        this.closeAllPopups();

        // Store the current boat data
        this.currentBoatData = boat;

        // Hide the select wrapper and show details wrapper
        this.selectWrapper.style.display = 'none';
        this.detailsWrapper.style.display = 'flex';

        // Reset details content container scroll position
        const detailsContent = document.querySelector('[data-element="boatDetails_contentContainer"]');
        if (detailsContent) {
          detailsContent.scrollTop = 0;
        }

        // Sync pickup time visual state from add boat wrapper to boat details
        // First, clear all boat details pickup time pill borders
        Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });

        // Then, apply the selected pickup time visual state
        if (this.selectedPickupTime && this.boatDetailsPickupTimePills[this.selectedPickupTime]) {
          this.boatDetailsPickupTimePills[this.selectedPickupTime].style.borderColor = '#000000';
          this.boatDetailsPickupTimePills[this.selectedPickupTime].style.borderWidth = '2px';
        }

        // Apply pickup time gating when boat details opens
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

        // Re-apply selection visual state after gating to ensure it's not lost
        // This ensures the selected pickup time is always visible even after gating is applied
        requestAnimationFrame(() => {
          if (this.selectedPickupTime && this.boatDetailsPickupTimePills[this.selectedPickupTime]) {
            this.boatDetailsPickupTimePills[this.selectedPickupTime].style.borderColor = '#000000';
            this.boatDetailsPickupTimePills[this.selectedPickupTime].style.borderWidth = '2px';
          }
          // Also sync back to main wrapper pills to ensure consistency
          if (this.selectedPickupTime && this.pickupTimePills[this.selectedPickupTime]) {
            this.pickupTimePills[this.selectedPickupTime].style.borderColor = '#000000';
            this.pickupTimePills[this.selectedPickupTime].style.borderWidth = '2px';
          }
          // Update text elements to show current selection
          this.updatePickupTimeFilterText();
          this.updateBoatDetailsPickupTimeFilterText();
        });

        // Populate the boat details
        await this.populateBoatDetails(boat);

        // Handle min days requirement (public dock, private dock if selected, or boat minimum)
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
        const boatMinDays = boat.minReservationLength || 0;

        // Only consider private dock minimum if private dock delivery is selected
        let privateDockMinDays = 0;
        if (this.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

        // Update min days text display
        if (this.boatDetailsMinDaysText) {
          if (effectiveMinDays > 1) {
            const daysText = effectiveMinDays === 1 ? 'Day' : 'Days';
            this.boatDetailsMinDaysText.textContent = `${effectiveMinDays} ${daysText} Minimum`;
            this.boatDetailsMinDaysText.style.display = 'block';
          } else {
            this.boatDetailsMinDaysText.style.display = 'none';
          }
        }

        // Hide half-day option if minimum days > 0.5
        if (effectiveMinDays > 0.5 && this.boatDetailsFullHalfDaysContainer) {
          this.boatDetailsFullHalfDaysContainer.style.display = 'none';
          // Force full day type
          this.selectedLengthType = 'full';
          // Update URL to reflect full type
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('type', 'full');
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.replaceState(null, '', newUrl);
        } else if (this.boatDetailsFullHalfDaysContainer) {
          // Show half-day option if allowed
          this.boatDetailsFullHalfDaysContainer.style.display = 'flex';
        }

        // Update mobile footer
        this.updateMobileFooter(boat);

        // Update dates done button text
        this.updateDatesDoneButtonText();

        // // Update X button visibility
        // this.updateBoatDetailsXButtonVisibility();

        // Update reservation block visibility
        this.updateReservationBlockVisibility();
      }

      updateBoatDetailsMinDaysText(boat) {
        if (!this.boatDetailsMinDaysText || !boat) return;

        // Handle min days requirement (public dock, private dock if selected, or boat minimum)
        const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
        const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
        const boatMinDays = boat.minReservationLength || 0;

        // Only consider private dock minimum if private dock delivery is selected
        let privateDockMinDays = 0;
        if (this.selectedPrivateDock) {
          const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
          privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
        }

        const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

        // Update min days text display - show if greater than 1 OR if equal to 1 but from private dock
        if (effectiveMinDays > 1 || (effectiveMinDays >= 1 && privateDockMinDays > 0 && this.selectedPrivateDock)) {
          const daysText = effectiveMinDays === 1 ? 'Day' : 'Days';
          this.boatDetailsMinDaysText.textContent = `${effectiveMinDays} ${daysText} Minimum`;
          this.boatDetailsMinDaysText.style.display = 'block';
        } else {
          this.boatDetailsMinDaysText.style.display = 'none';
        }

        // Hide half-day option if minimum days > 0.5
        if (effectiveMinDays > 0.5 && this.boatDetailsFullHalfDaysContainer) {
          this.boatDetailsFullHalfDaysContainer.style.display = 'none';
          // Force full day type
          this.selectedLengthType = 'full';
          // Update URL to reflect full type
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('type', 'full');
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.replaceState(null, '', newUrl);
        } else if (this.boatDetailsFullHalfDaysContainer) {
          // Show half-day option if allowed
          this.boatDetailsFullHalfDaysContainer.style.display = 'flex';
        }
      }

      hideBoatDetails() {
        // Hide details wrapper and show select wrapper
        this.detailsWrapper.style.display = 'none';
        this.selectWrapper.style.display = 'flex';

        // Don't call initializeFromURL() here as it resets filter state
        // The filter values are already in this.selectedDates, this.selectedGuests, etc.
        // and should be preserved when going back to selection view

        // Sync pickup time visual state from boat details back to add boat wrapper
        // First, clear all main wrapper pickup time pill borders
        Object.values(this.pickupTimePills).forEach(pill => {
          if (pill) {
            pill.style.borderColor = '';
            pill.style.borderWidth = '';
          }
        });

        // Then, apply the selected pickup time visual state
        if (this.selectedPickupTime && this.pickupTimePills[this.selectedPickupTime]) {
          this.pickupTimePills[this.selectedPickupTime].style.borderColor = '#000000';
          this.pickupTimePills[this.selectedPickupTime].style.borderWidth = '2px';
        }

        // Update UI elements to reflect current filter state
        if (this.guestNumber) {
          this.guestNumber.textContent = this.selectedGuests;
        }
        this.updateDatesFilterText();
        this.updatePickupTimeFilterText();
        this.updateBoatDetailsPickupTimeFilterText(); // Keep boat details text in sync
        this.updateGuestsFilterText();
        this.updatePrivateDockFilterText();
        this.updateLengthTypeButtons();
        this.updatePriceFilterText();
        this.updateLengthFilterText();
        this.updateBoatTypeFilterText();
        this.updateFilterStyles();
        this.updateDateButtonStyles();
        // Don't call renderDateSelection() - it rebuilds from URL params and loses filter state
        // The date buttons already exist and updateDateButtonStyles() will style them correctly

        // Re-filter and render boats with current filter parameters
        this.fetchAndRenderBoats();

        // Clear the current boat data
        this.currentBoatData = null;

        // Update reservation block visibility (should show in desktop after hiding boat details)
        this.updateReservationBlockVisibility();
      }

      async populateBoatDetails(boat) {
        // Basic boat information
        const boatDetailsTitle = document.querySelector('[data-element="boatDetails_title"]');
        if (boatDetailsTitle) {
          boatDetailsTitle.textContent = boat.name || '';
        }

        // Location
        const boatDetailsLocation = document.querySelector('[data-element="boatDetails_location"]');
        if (boatDetailsLocation) {
          boatDetailsLocation.textContent = boat.city ? `${boat.city}, FL` : '';
        }

        // Public dock address (show if applicable)
        const boatDetailsLocationContainer = document.querySelector('[data-element="boatDetails_locationContainer"]');
        if (this.publicDockAddressElement) {
          const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
          if (publicDockDetails && publicDockDetails.address) {
            this.publicDockAddressElement.textContent = `Pickup Location: ${publicDockDetails.address}`;
            this.publicDockAddressElement.style.display = 'flex';
            // Hide location container to avoid confusion
            if (boatDetailsLocationContainer) {
              boatDetailsLocationContainer.style.display = 'none';
            }
          } else {
            this.publicDockAddressElement.style.display = 'none';
            // Show location container when public dock is not displayed
            if (boatDetailsLocationContainer) {
              boatDetailsLocationContainer.style.display = '';
            }
          }
        }

        // Basic specifications
        const boatDetailsLength = document.querySelector('[data-element="boatDetails_length"]');
        if (boatDetailsLength) {
          boatDetailsLength.textContent = boat.length ? `${boat.length} Ft` : '';
        }

        const boatDetailsMaxPassengers = document.querySelector('[data-element="boatDetails_maxPassengers"]');
        if (boatDetailsMaxPassengers) {
          boatDetailsMaxPassengers.textContent = boat.maxPassengers ? `${boat.maxPassengers} Passengers` : '';
        }

        // Handle boat images carousel
        this.setupBoatImagesCarousel(boat);

        // Reviews section
        const boatDetailsReviewsAVG = document.querySelector('[data-element="boatDetails_reviewsAVG"]');
        const boatDetailsReviewsAmount = document.querySelector('[data-element="boatDetails_reviewsAmount"]');
        const boatDetailsReviewsDot = document.querySelector('[data-element="boatDetails_reviewsDot"]');

        if (boatDetailsReviewsAVG && boatDetailsReviewsAmount) {
          if (!boat.reviews || boat.reviews.length === 0) {
            boatDetailsReviewsAVG.textContent = 'New';
            boatDetailsReviewsAmount.textContent = '';
            if (boatDetailsReviewsDot) {
              boatDetailsReviewsDot.style.display = 'none';
            }
          } else {
            const ratings = boat.reviews.map(review => review.rating);
            const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            boatDetailsReviewsAVG.textContent = averageRating.toFixed(1);
            boatDetailsReviewsAmount.textContent = `${boat.reviews.length} Reviews`;
            if (boatDetailsReviewsDot) {
              boatDetailsReviewsDot.style.display = '';
            }
          }
        }

        // Detailed Reviews Section
        const reviewsSection = document.querySelector('[data-element="boatDetails_reviewsSection"]');
        const reviewsSectionAvg = document.querySelector('[data-element="boatDetails_reviewsSection_avg"]');
        const reviewsSectionAmount = document.querySelector('[data-element="boatDetails_reviewsSection_amount"]');
        const showAllButton = document.querySelector('[data-element="boatDetails_reviewsSection_showAll"]');

        if (reviewsSection) {
          if (!boat.reviews || boat.reviews.length === 0) {
            reviewsSection.style.display = 'none';
          } else {
            reviewsSection.style.display = '';

            // Calculate and display average rating and review count
            const ratings = boat.reviews.map(review => review.rating);
            const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            if (reviewsSectionAvg) {
              reviewsSectionAvg.textContent = averageRating.toFixed(1);
            }
            if (reviewsSectionAmount) {
              reviewsSectionAmount.textContent = `${boat.reviews.length} Reviews`;
            }

            // Sort reviews by date (newest first)
            const sortedReviews = [...boat.reviews].sort((a, b) =>
              new Date(b.date) - new Date(a.date)
            );

            // Get the first review block and its container
            const firstReviewBlock = document.querySelector('[data-element="boatDetails_reviewsSection_reviewBlock"]');
            const reviewBlocksContainer = firstReviewBlock?.parentElement;

            if (firstReviewBlock && reviewBlocksContainer) {
              // Remove any previously cloned review blocks
              const existingBlocks = reviewBlocksContainer.querySelectorAll('[data-element="boatDetails_reviewsSection_reviewBlock"]:not(:first-child)');
              existingBlocks.forEach(block => block.remove());

              // Function to format date to Month Year
              const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              };

              // Function to populate a review block
              const populateReviewBlock = (block, review) => {
                const firstName = block.querySelector('[data-element="boatDetails_reviewsSection_reviewBlock_firstName"]');
                const rating = block.querySelector('[data-element="boatDetails_reviewsSection_reviewBlock_rating"]');
                const monthYear = block.querySelector('[data-element="boatDetails_reviewsSection_reviewBlock_monthYear"]');
                const reviewText = block.querySelector('[data-element="boatDetails_reviewsSection_reviewBlock_reviewText"]');

                if (firstName) firstName.textContent = review.firstName || '';
                if (rating) rating.textContent = `${review.rating}/5`;
                if (monthYear) monthYear.textContent = formatDate(review.date);
                if (reviewText) reviewText.textContent = review.text || '';
              };

              // Function to toggle reviews visibility
              const toggleReviews = (showAll) => {
                const reviewBlocks = reviewBlocksContainer.querySelectorAll('[data-element="boatDetails_reviewsSection_reviewBlock"]');
                reviewBlocks.forEach((block, index) => {
                  block.style.display = showAll || index < 6 ? '' : 'none';
                });
              };

              // Create and populate review blocks
              sortedReviews.forEach((review, index) => {
                const reviewBlock = index === 0 ? firstReviewBlock : firstReviewBlock.cloneNode(true);
                populateReviewBlock(reviewBlock, review);
                if (index > 0) {
                  reviewBlocksContainer.appendChild(reviewBlock);
                }
              });

              // Handle show all button
              if (showAllButton) {
                if (sortedReviews.length <= 6) {
                  showAllButton.style.display = 'none';
                } else {
                  showAllButton.style.display = '';
                  let showingAll = false;
                  showAllButton.addEventListener('click', () => {
                    showingAll = !showingAll;
                    toggleReviews(showingAll);
                    showAllButton.textContent = showingAll ? 'Show less' : 'Show all';
                  });
                  // Initial state - show only first 6
                  toggleReviews(false);
                }
              }
            }
          }
        }

        // Boat description
        const boatDetailsDescription = document.querySelector('[data-element="boatDetails_description"]');
        const boatDetailsDescriptionShowMore = document.querySelector('[data-element="boatDetails_description_showMore"]');

        if (boatDetailsDescription) {
          const description = boat.description || '';
          const maxLength = 400;

          if (description.length > maxLength) {
            // Show truncated description initially
            boatDetailsDescription.textContent = description.substring(0, maxLength) + '...';

            // Show the "Show More" button
            if (boatDetailsDescriptionShowMore) {
              boatDetailsDescriptionShowMore.style.display = 'flex';
              boatDetailsDescriptionShowMore.textContent = 'Show More';

              // Add click handler
              boatDetailsDescriptionShowMore.onclick = () => {
                const isExpanded = boatDetailsDescriptionShowMore.textContent === 'Show Less';

                if (isExpanded) {
                  // Collapse: show truncated
                  boatDetailsDescription.textContent = description.substring(0, maxLength) + '...';
                  boatDetailsDescriptionShowMore.textContent = 'Show More';
                } else {
                  // Expand: show full description
                  boatDetailsDescription.textContent = description;
                  boatDetailsDescriptionShowMore.textContent = 'Show Less';
                }
              };
            }
          } else {
            // Description is short, show full text
            boatDetailsDescription.textContent = description;

            // Hide the "Show More" button
            if (boatDetailsDescriptionShowMore) {
              boatDetailsDescriptionShowMore.style.display = 'none';
            }
          }
        }

        // Detailed boat specifications
        const boatDetailsBoatYear = document.querySelector('[data-element="boatDetails_boatYear"]');
        const boatDetailsBoatYearContainer = document.querySelector('[data-element="boatDetails_boatYearContainer"]');
        if (boat.year) {
          boatDetailsBoatYear.textContent = boat.year;
          if (boatDetailsBoatYearContainer) boatDetailsBoatYearContainer.style.display = 'flex';
        } else {
          boatDetailsBoatYear.textContent = '';
          if (boatDetailsBoatYearContainer) boatDetailsBoatYearContainer.style.display = 'none';
        }

        const boatDetailsBoatLength = document.querySelector('[data-element="boatDetails_boatLength"]');
        if (boatDetailsBoatLength) {
          boatDetailsBoatLength.textContent = boat.length ? `${boat.length} Ft` : '';
        }

        const boatDetailsBoatMake = document.querySelector('[data-element="boatDetails_boatMake"]');
        if (boatDetailsBoatMake) {
          boatDetailsBoatMake.textContent = boat.make || '';
        }

        const boatDetailsBoatModel = document.querySelector('[data-element="boatDetails_boatModel"]');
        const boatDetailsBoatModelContainer = document.querySelector('[data-element="boatDetails_boatModelContainer"]');
        if (boatDetailsBoatModel) {
          if (boat.model) {
            boatDetailsBoatModel.textContent = boat.model;
            if (boatDetailsBoatModelContainer) boatDetailsBoatModelContainer.style.display = '';
          } else {
            boatDetailsBoatModel.textContent = '';
            if (boatDetailsBoatModelContainer) boatDetailsBoatModelContainer.style.display = 'none';
          }
        }

        const boatDetailsBoatType = document.querySelector('[data-element="boatDetails_boatType"]');
        if (boatDetailsBoatType) {
          boatDetailsBoatType.textContent = boat.boatType || '';
        }

        const boatDetailsBoatCapacity = document.querySelector('[data-element="boatDetails_boatCapacity"]');
        if (boatDetailsBoatCapacity) {
          boatDetailsBoatCapacity.textContent = boat.maxPassengers ? `${boat.maxPassengers} Passengers` : '';
        }

        // Company information
        const boatDetailsCompanyName = document.querySelector('[data-element="boatDetails_companyName"]');
        if (boatDetailsCompanyName) {
          boatDetailsCompanyName.textContent = boat.companyName ? `${boat.companyName}` : '';
        }

        const boatDetailsCompanyDescription = document.querySelector('[data-element="boatDetails_companyDescription"]');
        if (boatDetailsCompanyDescription) {
          boatDetailsCompanyDescription.textContent = boat.companyDescription || '';
        }

        const boatDetailsCompanyProfileImage = document.querySelector('[data-element="boatDetails_companyImage"]');
        if (boatDetailsCompanyProfileImage) {
          boatDetailsCompanyProfileImage.src = boat.companyProfileImage.url || '';
        }

        // Handle amenities section
        if (boat.amenities && boat.amenities.length > 0) {
          // Get the first stack block and its container
          const firstStackBlock = document.querySelector('[data-element="boatDetails_amenityBlockStackBlock"]');
          const stackBlocksContainer = firstStackBlock?.parentElement;

          if (firstStackBlock && stackBlocksContainer) {
            // Remove any previously cloned stack blocks
            const existingBlocks = stackBlocksContainer.querySelectorAll('[data-element="boatDetails_amenityBlockStackBlock"]:not(:first-child)');
            existingBlocks.forEach(block => block.remove());

            // Set text for the first amenity in the existing block
            const firstTextElement = firstStackBlock.querySelector('[data-element="boatDetails_amenityBlock_text"]');
            if (firstTextElement && boat.amenities[0]) {
              firstTextElement.textContent = boat.amenities[0].text || '';
            }

            // Create additional stack blocks for remaining amenities
            for (let i = 1; i < boat.amenities.length; i++) {
              // Clone the first stack block
              const newStackBlock = firstStackBlock.cloneNode(true);

              // Set the amenity text in the cloned stack block
              const textElement = newStackBlock.querySelector('[data-element="boatDetails_amenityBlock_text"]');
              if (textElement) {
                textElement.textContent = boat.amenities[i].text || '';
              }

              // Add to container
              stackBlocksContainer.appendChild(newStackBlock);
            }
          }
        }

        // Handle rules section
        if (boat.rules && boat.rules.length > 0) {
          // Get the first rule block and its container
          const firstRuleBlock = document.querySelector('[data-element="boatDetails_rules"]');
          const ruleBlocksContainer = firstRuleBlock?.parentElement;

          if (firstRuleBlock && ruleBlocksContainer) {
            // Remove any previously cloned rule blocks
            const existingBlocks = ruleBlocksContainer.querySelectorAll('[data-element="boatDetails_rules"]:not(:first-child)');
            existingBlocks.forEach(block => block.remove());

            // Set text for the first rule in the existing block
            const firstTextElement = firstRuleBlock.querySelector('[data-element="boatDetails_rules_text"]');
            if (firstTextElement && boat.rules[0]) {
              firstTextElement.textContent = boat.rules[0].text || '';
            }

            // Create additional rule blocks for remaining rules
            for (let i = 1; i < boat.rules.length; i++) {
              // Clone the first rule block
              const newRuleBlock = firstRuleBlock.cloneNode(true);

              // Set the rule text in the cloned rule block
              const textElement = newRuleBlock.querySelector('[data-element="boatDetails_rules_text"]');
              if (textElement) {
                textElement.textContent = boat.rules[i].text || '';
              }

              // Add to container
              ruleBlocksContainer.appendChild(newRuleBlock);
            }
          }
        }

        // Handle map section
        const mapElement = document.querySelector('[data-element="boatDetails_map"]');
        if (mapElement && boat.address) {
          const apiKey = 'AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ';

          // Function to initialize the map with coordinates
          const initializeMap = (latitude, longitude) => {
            // Check if Google Maps is already loaded
            if (window.google && window.google.maps) {
              createMap();
            } else {
              // Load Google Maps script if not already loaded
              const script = document.createElement('script');
              script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
              script.async = true;
              script.onload = createMap;
              document.head.appendChild(script);
            }

            function createMap() {
              const map = new window.google.maps.Map(mapElement, {
                zoom: 16,
                center: { lat: latitude, lng: longitude },
                mapTypeId: 'roadmap',
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_CENTER,
                  style: google.maps.ZoomControlStyle.LARGE
                },
                streetViewControlOptions: {
                  position: google.maps.ControlPosition.TOP_RIGHT,
                },
                scrollwheel: false,
                styles: [
                  { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "landscape", "stylers": [{ "color": "#f5f5f5" }] },
                  { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c2d2b1" }] },
                  { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "water", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#9ecaff" }] },
                  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f0f0f0" }, { "visibility": "on" }] },
                ]
              });

              // Use a boat icon SVG for the pin with a white fill inside
              const pinSvgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 24 24" width="48" height="48"><g><path d="M0 0h24v24h-24Z" fill="none"/><path fill="#fff" d="M12 3c-3.796 0-6.873 3.077-6.873 6.873v.172c0 3.461 4.382 8.671 6.148 10.631.389.432 1.061.432 1.45 0 1.766-1.96 6.148-7.17 6.148-10.631v-.172c0-3.796-3.077-6.873-6.873-6.873z"/><path stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4468" fill="none" d="M5.127 10.045v-.172c0-3.796 3.077-6.873 6.873-6.873v0c3.796 0 6.873 3.077 6.873 6.873v.172c0 3.461-4.382 8.671-6.148 10.631 -.389.432-1.061.432-1.45 0 -1.766-1.96-6.148-7.17-6.148-10.631Z"/><path stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4468" fill="none" d="M10 9.955c0 1.105.895 2 2 2v0c1.105 0 2-.895 2-2v-.037c0-1.105-.895-2-2-2v0c-1.105 0-2 .895-2 2"/></g></svg>`;

              const marker = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: map,
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvgString),
                  scaledSize: new google.maps.Size(32, 32),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(16, 30)
                },
                title: 'Boat Location'
              });
            }
          };

          // Geocode the address to get coordinates
          if (window.google && window.google.maps) {
            geocodeAddress();
          } else {
            // Load Google Maps script first
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.onload = geocodeAddress;
            document.head.appendChild(script);
          }

          function geocodeAddress() {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: boat.address }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const latitude = location.lat();
                const longitude = location.lng();
                initializeMap(latitude, longitude);
              } else {

                // Hide map if geocoding fails
                mapElement.style.display = 'none';
              }
            });
          }
        }

        const boatDetailsAddress = document.querySelector('[data-element="boatDetails_cityState"]');
        if (boatDetailsAddress) {
          let cityStateText = boat.city ? `${boat.city}, FL` : '';

          // Check if public dock delivery is being shown
          const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
          if (publicDockDetails && publicDockDetails.address) {
            // Extract city from public dock address
            const addressParts = publicDockDetails.address.split(',').map(part => part.trim());
            let publicDockCity = '';

            if (addressParts.length >= 2) {
              // Get the city (usually the second-to-last part before state)
              publicDockCity = addressParts[addressParts.length - 2];
            } else if (addressParts.length === 1) {
              // If only one part, try to extract city from it
              publicDockCity = addressParts[0];
            }

            // Add delivery message if we have a city
            if (publicDockCity && cityStateText) {
              cityStateText += ` (Boat is delivered to ${publicDockCity})`;
            }
          }

          boatDetailsAddress.textContent = cityStateText;
        }

        const cancellationPolicy = document.querySelector('[data-element="boatDetails_cancellationPolicy"]');
        if (cancellationPolicy) {
          cancellationPolicy.textContent = "Free cancellation up to " + boat.cancellationPolicy_daysNotice + " days prior to trip" || '';
        }

        // Handle delivery checkbox functionality
        this.setupDeliveryCheckbox(boat);

        // Handle reservation pricing with comprehensive breakdown
        this.updateBoatDetailsPricing(boat);

        // Initialize boat details date filter
        this.initializeBoatDetailsDateFilter();

        // Initialize boat details guest filter
        this.initializeBoatDetailsGuestFilter();

        // Handle Add to Reservation button functionality
        this.setupAddToReservationButton(boat);

        // Setup contact us form
        await this.setupContactUsForm(boat);

      }

      async setupContactUsForm(boat) {
        // Prevent duplicate initialization for the same boat
        if (this._contactFormInitializedForBoatId === boat.id) {
          return;
        }
        this._contactFormInitializedForBoatId = boat.id;

        // Check if user is signed in via c.token
        const hasToken = window.Wized?.data?.c?.token;

        // Only wait for Load_user if user has a token (is signed in)
        if (hasToken) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Load_user timeout')), 5000)
            );
            const loadUserPromise = Wized.requests.waitFor('Load_user');
            await Promise.race([loadUserPromise, timeoutPromise]);
          } catch (error) {
          }
        }

        // Get all contact form elements
        const firstNameInput = document.querySelector('[data-element="firstNameInput_boatRental"]');
        const emailInput = document.querySelector('[data-element="emailInput_boatRental"]');
        const messageInput = document.querySelector('[data-element="ContactUs_Input_boatRental"]');
        const errorElement = document.querySelector('[data-element="ContactUs_Error_boatRental"]');
        const submitButton = document.querySelector('[data-element="ContactUs_SubmitButton_boatRental"]');
        const buttonText = document.querySelector('[data-element="ContactUs_Button_Text_boatRental"]');
        const buttonLoader = document.querySelector('[data-element="ContactUs_Button_Loader_boatRental"]');

        if (!messageInput || !submitButton || !buttonText || !buttonLoader) {
          return;
        }

        // Initialize state
        if (errorElement) errorElement.style.display = 'none';
        if (buttonLoader) buttonLoader.style.display = 'none';
        if (buttonText) {
          buttonText.textContent = 'Submit';
          buttonText.style.display = 'block'; // Explicitly set display
        }

        // Check if user is logged in
        const isUserLoggedIn = this.isUserLoggedIn();

        // Show/hide firstName and email inputs based on login status
        if (firstNameInput && emailInput) {
          if (isUserLoggedIn) {
            firstNameInput.style.display = 'none';
            emailInput.style.display = 'none';
            // Also hide parent wrappers if they exist
            const firstNameWrapper = firstNameInput.closest('[data-element="firstNameInput_boatRental_wrapper"]');
            const emailWrapper = emailInput.closest('[data-element="emailInput_boatRental_wrapper"]');
            if (firstNameWrapper) firstNameWrapper.style.display = 'none';
            if (emailWrapper) emailWrapper.style.display = 'none';
          } else {
            firstNameInput.style.display = 'flex';
            emailInput.style.display = 'flex';
            // Show parent wrappers if they exist
            const firstNameWrapper = firstNameInput.closest('[data-element="firstNameInput_boatRental_wrapper"]');
            const emailWrapper = emailInput.closest('[data-element="emailInput_boatRental_wrapper"]');
            if (firstNameWrapper) firstNameWrapper.style.display = 'flex';
            if (emailWrapper) emailWrapper.style.display = 'flex';
          }
        }

        // Remove any existing event listeners
        const newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

        // Get fresh references from the new button
        const newButtonText = newSubmitButton.querySelector('[data-element="ContactUs_Button_Text_boatRental"]');
        const newButtonLoader = newSubmitButton.querySelector('[data-element="ContactUs_Button_Loader_boatRental"]');

        // Add submit handler
        newSubmitButton.addEventListener('click', async () => {
          await this.handleContactUsSubmit(boat, {
            firstNameInput,
            emailInput,
            messageInput,
            errorElement,
            buttonText: newButtonText,
            buttonLoader: newButtonLoader,
            isUserLoggedIn
          });
        });
      }

      isUserLoggedIn() {
        // Check if user is logged in via Wized data
        try {
          if (window.Wized && window.Wized.data && window.Wized.data.r) {
            // Check both possible property names
            const loadUserRequest = window.Wized.data.r.Load_user;
            if (loadUserRequest) {
              if (loadUserRequest.statusCode === 200 || loadUserRequest.status === 200) {
                return true;
              }
            }
          }
        } catch (error) {
        }
        return false;
      }

      getUserId() {
        // Get user ID from Wized data
        try {
          if (window.Wized && window.Wized.data && window.Wized.data.r) {
            // Check both possible property names
            const loadUserRequest = window.Wized.data.r.Load_user;
            if (loadUserRequest && loadUserRequest.data && loadUserRequest.data.id) {
              return loadUserRequest.data.id;
            }
          }
        } catch (error) {
        }
        return null;
      }

      async handleContactUsSubmit(boat, elements) {
        const { firstNameInput, emailInput, messageInput, errorElement, buttonText, buttonLoader, isUserLoggedIn } = elements;

        // Clear previous errors
        if (errorElement) {
          errorElement.style.display = 'none';
          errorElement.textContent = '';
        }

        // Get message from contenteditable div
        const message = messageInput.textContent || messageInput.innerText || '';
        const trimmedMessage = message.trim();

        // Helper function to get input value (handles both input and contenteditable)
        const getInputValue = (input) => {
          if (!input) return '';
          // Check if it's a regular input
          if (input.value !== undefined) {
            return input.value.trim();
          }
          // Check if it's contenteditable
          if (input.getAttribute('contenteditable') === 'true') {
            return (input.textContent || input.innerText || '').trim();
          }
          return '';
        };

        // Validate required fields
        let errorMessage = '';

        if (!trimmedMessage) {
          errorMessage = 'Please enter a message';
        } else if (!isUserLoggedIn) {
          // If not logged in, validate firstName and email
          const firstName = getInputValue(firstNameInput);
          const email = getInputValue(emailInput);

          if (!firstName) {
            errorMessage = 'Please enter your first name';
          } else if (!email) {
            errorMessage = 'Please enter your email';
          } else if (!this.isValidEmail(email)) {
            errorMessage = 'Please enter a valid email address';
          }
        }

        // Show error if validation failed
        if (errorMessage) {
          if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
          }
          return;
        }

        // Prepare request data
        const requestData = {
          message: trimmedMessage,
          boat_id: boat.id,
          guest_id: null,
          email: null,
          firstName: null
        };

        if (isUserLoggedIn) {
          requestData.guest_id = this.getUserId();
        } else {
          requestData.email = getInputValue(emailInput);
          requestData.firstName = getInputValue(firstNameInput);
        }

        // Show loader, hide button text
        if (buttonText) {
          buttonText.style.setProperty('display', 'none', 'important');
        }
        if (buttonLoader) {
          buttonLoader.style.setProperty('display', 'flex', 'important');
        }

        try {
          const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/listingPage_ContactUs_boatRental', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          // Hide loader, show button text
          if (buttonLoader) {
            buttonLoader.style.setProperty('display', 'none', 'important');
          }
          if (buttonText) {
            buttonText.style.setProperty('display', 'block', 'important');
          }

          if (!response.ok) {
            throw new Error(`Failed to submit message: ${response.status}`);
          }

          // Success - update button text and clear form
          if (buttonText) {
            buttonText.textContent = 'Message Submitted!';
          }

          // Clear the message input
          if (messageInput) {
            messageInput.textContent = '';
          }

          // Clear firstName and email if not logged in
          if (!isUserLoggedIn) {
            if (firstNameInput) {
              if (firstNameInput.value !== undefined) {
                firstNameInput.value = '';
              } else {
                firstNameInput.textContent = '';
              }
            }
            if (emailInput) {
              if (emailInput.value !== undefined) {
                emailInput.value = '';
              } else {
                emailInput.textContent = '';
              }
            }
          }

          // Reset button text after 3 seconds
          setTimeout(() => {
            if (buttonText) {
              buttonText.textContent = 'Submit';
            }
          }, 3000);

        } catch (error) {
          // Hide loader, show button text
          if (buttonLoader) buttonLoader.style.display = 'none';
          if (buttonText) buttonText.style.display = 'block';

          if (errorElement) {
            errorElement.textContent = 'Failed to submit message. Please try again.';
            errorElement.style.display = 'block';
          }
        }
      }

      isValidEmail(email) {
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }

      setupBoatImagesCarousel(boat) {
        const imagesContainer = document.querySelector('[data-element="boatDetails_imagesContainer"]');
        if (!imagesContainer) return;

        // Clear any existing content
        imagesContainer.innerHTML = '';

        // Check if boat has photos
        if (!boat.photos || boat.photos.length === 0) {
          imagesContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No images available</div>';
          return;
        }

        // Sort photos by order
        const sortedPhotos = [...boat.photos].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Check screen width for responsive behavior
        const isMobile = window.innerWidth <= 767;
        const carouselHeight = isMobile ? '300px' : '400px';

        // Create carousel structure
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: ${carouselHeight};
          overflow: hidden;
          border-radius: 5px;
        `;

        const imagesTrack = document.createElement('div');
        imagesTrack.style.cssText = `
          display: flex;
          transition: transform 0.3s ease;
          height: 100%;
        `;

        // Add images to track
        sortedPhotos.forEach((photo, index) => {
          const imageContainer = document.createElement('div');
          const flexBasis = isMobile ? '100%' : '50%';

          imageContainer.style.cssText = `
            flex: 0 0 ${flexBasis};
            height: ${carouselHeight};
            padding: 0 4px;
            box-sizing: border-box;
          `;

          const imageWrapper = document.createElement('div');
          imageWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 5px;
            overflow: hidden;
            background-color: #f0f0f0;
            cursor: pointer;
          `;

          const img = document.createElement('img');
          img.src = photo.image.url;
          img.alt = `Boat image ${index + 1}`;

          // Optimize loading: first 2 images eager (visible on desktop), rest lazy
          if (index === 0) {
            img.loading = 'eager';
            img.fetchPriority = 'high';
          } else if (index === 1) {
            img.loading = 'eager';
          } else {
            img.loading = 'lazy';
          }
          img.decoding = 'async';

          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          `;

          // Handle image load error
          img.onerror = () => {
            imageWrapper.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">Image unavailable</div>';
          };

          // Add click handler to open full-size modal
          imageWrapper.addEventListener('click', () => {
            this.openImageModal(sortedPhotos, index);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are more than the visible count
        const visibleCount = isMobile ? 1 : 2;

        if (sortedPhotos.length > visibleCount) {
          let currentIndex = 0;
          const maxIndex = Math.max(0, sortedPhotos.length - visibleCount); // Show based on screen size

          // Left navigation button
          const leftButton = document.createElement('button');
          leftButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          leftButton.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Right navigation button
          const rightButton = document.createElement('button');
          rightButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          rightButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Update button states
          const updateButtonStates = () => {
            leftButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
            leftButton.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            rightButton.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            rightButton.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
          };

          // Navigation functionality
          const updateCarousel = () => {
            const movePercentage = isMobile ? 100 : 50; // Move by 100% on mobile, 50% on desktop
            const translateX = -(currentIndex * movePercentage);
            imagesTrack.style.transform = `translateX(${translateX}%)`;
            updateButtonStates();
          };

          leftButton.addEventListener('click', () => {
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });

          rightButton.addEventListener('click', () => {
            if (currentIndex < maxIndex) {
              currentIndex++;
              updateCarousel();
            }
          });

          // Hover effects
          leftButton.addEventListener('mouseenter', () => {
            if (currentIndex > 0) leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          leftButton.addEventListener('mouseleave', () => {
            leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          rightButton.addEventListener('mouseenter', () => {
            if (currentIndex < maxIndex) rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          rightButton.addEventListener('mouseleave', () => {
            rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          // Initial states
          updateButtonStates();

          // Add swipe functionality for mobile
          let touchStartX = 0;
          let touchEndX = 0;
          let isSwiping = false;
          let touchStartY = 0;

          carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = true;
          }, { passive: false });

          carouselWrapper.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            const touchCurrentX = e.changedTouches[0].screenX;
            const touchCurrentY = e.changedTouches[0].screenY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);

            // If horizontal swipe is dominant, prevent page scroll
            if (deltaX > deltaY) {
              e.preventDefault();
            }

            touchEndX = touchCurrentX;
          }, { passive: false });

          carouselWrapper.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;

            const swipeThreshold = 50; // Minimum swipe distance in pixels
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
              if (swipeDistance > 0 && currentIndex < maxIndex) {
                // Swiped left - go to next
                currentIndex++;
                updateCarousel();
              } else if (swipeDistance < 0 && currentIndex > 0) {
                // Swiped right - go to previous
                currentIndex--;
                updateCarousel();
              }
            }

            touchStartX = 0;
            touchEndX = 0;
          });

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
        }

        imagesContainer.appendChild(carouselWrapper);
      }

      setupBoatCardImagesCarousel(photosContainer, boat, card) {
        // Clear any existing content
        photosContainer.innerHTML = '';

        // Check if boat has photos
        if (!boat.photos || boat.photos.length === 0) {
          photosContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No images available</div>';
          return;
        }

        // Sort photos by order
        const sortedPhotos = [...boat.photos].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Card carousel always shows 1 image at a time
        const carouselHeight = '280px';

        // Create carousel structure
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: ${carouselHeight};
          overflow: hidden;
          border-radius: 5px;
        `;

        const imagesTrack = document.createElement('div');
        imagesTrack.style.cssText = `
          display: flex;
          transition: transform 0.3s ease;
          height: 100%;
        `;

        // Add images to track
        sortedPhotos.forEach((photo, index) => {
          const imageContainer = document.createElement('div');
          imageContainer.style.cssText = `
            flex: 0 0 100%;
            height: ${carouselHeight};
            padding: 0 0px;
            box-sizing: border-box;
          `;

          const imageWrapper = document.createElement('div');
          imageWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 5px;
            overflow: hidden;
            background-color: #f0f0f0;
            cursor: pointer;
          `;

          const img = document.createElement('img');
          img.src = photo.image.url;
          img.alt = `Boat image ${index + 1}`;

          // Optimize loading: first image eager, rest lazy
          if (index === 0) {
            img.loading = 'eager';
          } else {
            img.loading = 'lazy';
          }
          img.decoding = 'async';

          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          `;

          // Handle image load error
          img.onerror = () => {
            imageWrapper.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">Image unavailable</div>';
          };

          // Add click handler to show boat details (not open modal)
          imageWrapper.addEventListener('click', () => {
            const currentBoat = card.boatData || boat;
            this.showBoatDetails(currentBoat);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are multiple images
        if (sortedPhotos.length > 1) {
          let currentIndex = 0;
          const maxIndex = sortedPhotos.length - 1;

          // Left navigation button
          const leftButton = document.createElement('button');
          leftButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          leftButton.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Right navigation button
          const rightButton = document.createElement('button');
          rightButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          rightButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Update button states
          const updateButtonStates = () => {
            leftButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
            leftButton.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            rightButton.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            rightButton.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
          };

          // Navigation functionality
          const updateCarousel = () => {
            const translateX = -(currentIndex * 100);
            imagesTrack.style.transform = `translateX(${translateX}%)`;
            updateButtonStates();
          };

          leftButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });

          rightButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (currentIndex < maxIndex) {
              currentIndex++;
              updateCarousel();
            }
          });

          // Hover effects
          leftButton.addEventListener('mouseenter', () => {
            if (currentIndex > 0) leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          leftButton.addEventListener('mouseleave', () => {
            leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          rightButton.addEventListener('mouseenter', () => {
            if (currentIndex < maxIndex) rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          rightButton.addEventListener('mouseleave', () => {
            rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          // Initial states
          updateButtonStates();

          // Add swipe functionality for mobile
          let touchStartX = 0;
          let touchEndX = 0;
          let isSwiping = false;
          let touchStartY = 0;

          carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = true;
          }, { passive: false });

          carouselWrapper.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            const touchCurrentX = e.changedTouches[0].screenX;
            const touchCurrentY = e.changedTouches[0].screenY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);

            // If horizontal swipe is dominant, prevent page scroll
            if (deltaX > deltaY) {
              e.preventDefault();
            }

            touchEndX = touchCurrentX;
          }, { passive: false });

          carouselWrapper.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;

            const swipeThreshold = 50; // Minimum swipe distance in pixels
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
              if (swipeDistance > 0 && currentIndex < maxIndex) {
                // Swiped left - go to next
                currentIndex++;
                updateCarousel();
              } else if (swipeDistance < 0 && currentIndex > 0) {
                // Swiped right - go to previous
                currentIndex--;
                updateCarousel();
              }
            }

            touchStartX = 0;
            touchEndX = 0;
          });

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
        }

        photosContainer.appendChild(carouselWrapper);
      }

      openImageModal(photos, startIndex = 0) {
        // Remove any existing modal
        const existingModal = document.querySelector('.boat-image-modal');
        if (existingModal) {
          existingModal.remove();
        }

        let currentIndex = startIndex;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'boat-image-modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // Create image element
        const img = document.createElement('img');
        img.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 5px;
          box-shadow: 0 4px 30px rgba(255, 255, 255, 0.1);
        `;

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        closeButton.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          z-index: 10001;
            transition: background-color 0.2s ease;
          `;

        // Navigation buttons (only show if more than 1 image)
        let prevButton, nextButton;
        if (photos.length > 1) {
          prevButton = document.createElement('button');
          prevButton.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          prevButton.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 56px;
            height: 56px;
            background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10001;
            transition: background-color 0.2s ease, opacity 0.2s ease;
          `;

          nextButton = document.createElement('button');
          nextButton.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
          nextButton.style.cssText = `
            position: fixed;
          right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 56px;
            height: 56px;
            background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
            z-index: 10001;
            transition: background-color 0.2s ease, opacity 0.2s ease;
          `;
        }

        // Update image
        const updateImage = () => {
          const photo = photos[currentIndex];
          img.src = photo.image.url;
          img.alt = `Boat image ${currentIndex + 1}`;

          // Update navigation button states
          if (photos.length > 1) {
            prevButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
            prevButton.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            nextButton.style.opacity = currentIndex === photos.length - 1 ? '0.5' : '1';
            nextButton.style.cursor = currentIndex === photos.length - 1 ? 'not-allowed' : 'pointer';
          }
        };

        // Navigation functionality
        const goToPrevious = () => {
          if (currentIndex > 0) {
            currentIndex--;
            updateImage();
          }
        };

        const goToNext = () => {
          if (currentIndex < photos.length - 1) {
            currentIndex++;
            updateImage();
          }
        };

        // Close modal
        const closeModal = () => {
          modal.style.opacity = '0';
          setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
          }, 300);
        };

        // Event listeners
        closeButton.addEventListener('click', closeModal);

        if (photos.length > 1) {
          prevButton.addEventListener('click', goToPrevious);
          nextButton.addEventListener('click', goToNext);

          // Hover effects
          prevButton.addEventListener('mouseenter', () => {
            if (currentIndex > 0) prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          });
          prevButton.addEventListener('mouseleave', () => {
            prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          });

          nextButton.addEventListener('mouseenter', () => {
            if (currentIndex < photos.length - 1) nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          });
          nextButton.addEventListener('mouseleave', () => {
            nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          });
        }

        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        });
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });

        // Keyboard navigation
        const handleKeydown = (e) => {
          switch (e.key) {
            case 'Escape':
              closeModal();
              break;
            case 'ArrowLeft':
              e.preventDefault();
              goToPrevious();
              break;
            case 'ArrowRight':
              e.preventDefault();
              goToNext();
              break;
          }
        };

        document.addEventListener('keydown', handleKeydown);

        // Cleanup function when modal is closed
        const originalRemove = modal.remove;
        modal.remove = function () {
          document.removeEventListener('keydown', handleKeydown);
          originalRemove.call(this);
        };

        // Assemble modal
        imageContainer.appendChild(img);
        modal.appendChild(imageContainer);
        modal.appendChild(closeButton);

        if (photos.length > 1) {
          modal.appendChild(prevButton);
          modal.appendChild(nextButton);
        }

        // Add to DOM and show
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Initialize
        updateImage();

        // Fade in
        requestAnimationFrame(() => {
          modal.style.opacity = '1';
        });
      }

      setupAddToReservationButton(boat) {
        // Get the reservation button
        const addToReservationButton = document.querySelector('[data-element="boatDetails_reservation_addToReservationButton"]');
        const addToReservationButtonFooter = document.querySelector('[data-element="boatDetails_reservation_addToReservationButton_footer"]');

        if (!addToReservationButton) return;

        // Hide error element initially
        if (this.boatDetailsErrorElement) {
          this.boatDetailsErrorElement.style.display = 'none';
        }

        // Remove any existing event listeners to prevent duplicates
        const newButton = addToReservationButton.cloneNode(true);
        addToReservationButton.parentNode.replaceChild(newButton, addToReservationButton);

        // Add click handler to the main button
        newButton.addEventListener('click', () => {
          this.handleAddToReservation(boat, this.boatDetailsErrorElement);
        });

        // Setup footer button if it exists
        if (addToReservationButtonFooter) {
          const newFooterButton = addToReservationButtonFooter.cloneNode(true);
          addToReservationButtonFooter.parentNode.replaceChild(newFooterButton, addToReservationButtonFooter);

          // Add click handler to the footer button
          newFooterButton.addEventListener('click', () => {
            this.handleAddToReservation(boat, this.boatDetailsErrorElement);
          });
        }

        // Setup select dates/guests button in footer
        const selectDatesButtonFooter = document.querySelector('[data-element="boatDetails_reservation_selectDatesOrAddGuestsButton_footer"]');
        if (selectDatesButtonFooter) {
          const newSelectButton = selectDatesButtonFooter.cloneNode(true);
          selectDatesButtonFooter.parentNode.replaceChild(newSelectButton, selectDatesButtonFooter);

          // Add click handler to scroll to relevant section or open popup
          newSelectButton.addEventListener('click', () => {
            // Show reservation block in mobile view
            const reservationBlock = document.querySelector('[data-element="boatRental_listingPage_reservationBlock"]');
            if (reservationBlock && this.isMobileView()) {
              reservationBlock.style.display = 'flex';
            }

            // Determine what's missing and take appropriate action - follow order: dates → pickup time → guests
            const hasDates = this.selectedDates && this.selectedDates.length > 0;
            const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
            const hasGuests = this.selectedGuests && this.selectedGuests > 0;

            if (!hasDates) {
              // Step 1: Open dates popup
              if (this.boatDetailsDateFilter) {
                this.boatDetailsDateFilter.click();
              }
            } else if (!hasPickupTime) {
              // Step 2: Open pickup time popup (now separate from dates)
              if (this.boatDetailsPickupTimeFilter) {
                this.boatDetailsPickupTimeFilter.click();
              }
            } else if (!hasGuests) {
              // Step 3: Open guests popup
              if (this.boatDetailsGuestsFilter) {
                this.boatDetailsGuestsFilter.click();
              }
            }
          });
        }
      }

      // Method to clear errors when conditions are met
      clearErrorIfResolved(errorElement) {
        if (!errorElement || errorElement.style.display === 'none') return;

        // Check if all required parameters are now valid
        const hasValidDates = this.selectedDates && this.selectedDates.length > 0;
        const hasValidGuests = this.selectedGuests && this.selectedGuests > 0;
        const hasValidPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
        const hasValidLengthType = this.selectedLengthType && this.selectedLengthType !== '';

        // If all conditions are met, hide the error
        if (hasValidDates && hasValidGuests && hasValidPickupTime && hasValidLengthType) {
          errorElement.style.display = 'none';
        }
      }

      // Flash check availability button with red border to get user's attention
      flashCheckAvailabilityButton() {
        const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');

        if (!checkAvailabilityButtons.length) {
          return;
        }

        checkAvailabilityButtons.forEach((button, index) => {
          // Store original border styles
          const originalBorderColor = button.style.borderColor;
          const originalBorderWidth = button.style.borderWidth;
          const originalBorderStyle = button.style.borderStyle;

          // Set red border with individual properties for better CSS specificity
          button.style.borderColor = '#dc2626';
          button.style.borderWidth = '2px';
          button.style.borderStyle = 'solid';

          // Remove red border after 2 seconds
          setTimeout(() => {
            button.style.borderColor = originalBorderColor;
            button.style.borderWidth = originalBorderWidth;
            button.style.borderStyle = originalBorderStyle;
          }, 2000);
        });
      }

      // Highlight error fields in boat details section
      highlightBoatDetailsErrorFields(errorFields) {
        // Get the filter elements
        const dateFilter = document.querySelector('[data-element="boatDetails_reservation_date"]');
        const passengersFilter = document.querySelector('[data-element="boatDetails_reservation_passengers"]');
        const pickupTimeFilter = document.querySelector('[data-element="boatDetails_reservation_pickupTime"]');

        // Apply error styles to relevant fields
        errorFields.forEach(field => {
          let element = null;

          if (field === 'date' && dateFilter) {
            element = dateFilter;
          } else if (field === 'passengers' && passengersFilter) {
            element = passengersFilter;
          } else if (field === 'pickupTime' && pickupTimeFilter) {
            element = pickupTimeFilter;
          }

          if (element) {
            element.style.backgroundColor = '#fee2e2';
          }
        });
      }

      // Clear error highlights from boat details fields
      clearBoatDetailsErrorHighlights() {
        const dateFilter = document.querySelector('[data-element="boatDetails_reservation_date"]');
        const passengersFilter = document.querySelector('[data-element="boatDetails_reservation_passengers"]');
        const pickupTimeFilter = document.querySelector('[data-element="boatDetails_reservation_pickupTime"]');

        [dateFilter, passengersFilter, pickupTimeFilter].forEach(element => {
          if (element) {
            element.style.border = '';
            element.style.backgroundColor = '';
          }
        });
      }

      handleAddToReservation(boat, errorElement) {
        // Get current URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        // Check required parameters
        const missingParams = [];
        const errorFields = []; // Track which fields have errors

        // Check boatDates
        if (!this.selectedDates || this.selectedDates.length === 0) {
          missingParams.push('Please select boat rental dates');
          errorFields.push('date');
        }

        // Check boatGuests
        if (!this.selectedGuests || this.selectedGuests === 0) {
          missingParams.push('Please add total passengers');
          errorFields.push('passengers');
        }

        // Check boatPickupTime
        if (!this.selectedPickupTime) {
          missingParams.push('Please select a pickup time');
          errorFields.push('pickupTime');
        }

        // Check boatLengthType (this should always have a default value, but let's be safe)
        if (!this.selectedLengthType) {
          missingParams.push('Please select rental duration');
        }

        // Check if selected days meet minimum days requirement
        if (this.selectedDates && this.selectedDates.length > 0 && boat) {
          const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
          const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
          const boatMinDays = boat.minReservationLength || 0;

          // Only consider private dock minimum if private dock delivery is selected
          let privateDockMinDays = 0;
          if (this.selectedPrivateDock) {
            const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
            privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
          }

          const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

          if (effectiveMinDays > 0 && this.selectedDates.length < effectiveMinDays) {
            const daysText = effectiveMinDays === 1 ? 'day' : 'days';

            // Provide specific message based on what's causing the minimum requirement
            if (privateDockMinDays > 0 && privateDockMinDays === effectiveMinDays && this.selectedPrivateDock) {
              missingParams.push(`Private dock delivery requires a minimum of ${effectiveMinDays} ${daysText}`);
            } else if (publicDockMinDays > 0 && publicDockMinDays === effectiveMinDays) {
              missingParams.push(`This location requires a minimum of ${effectiveMinDays} ${daysText}`);
            } else {
              missingParams.push(`This boat requires a minimum of ${effectiveMinDays} ${daysText}`);
            }
            errorFields.push('date');
          }
        }

        // If there are missing parameters, show error and highlight fields
        if (missingParams.length > 0) {
          if (errorElement) {
            errorElement.textContent = missingParams[0]; // Show the first missing parameter
            errorElement.style.display = 'flex';
          }

          // Highlight error fields with red border and light red background
          this.highlightBoatDetailsErrorFields(errorFields);

          return;
        }

        // All parameters are present, proceed with adding boat to reservation

        // Hide error element and remove any error highlighting
        if (errorElement) {
          errorElement.style.display = 'none';
        }
        this.clearBoatDetailsErrorHighlights();

        // Exit edit mode now that user is saving - this allows updateURLParams to work
        this.isEditMode = false;
        this.originalEditParams = null;

        // Add boatId to URL parameters
        const url = new URL(window.location);
        url.searchParams.set('boatId', boat.id);
        window.history.pushState({}, '', url);

        // Force update all URL params now that we're out of edit mode
        this.updateURLParams();

        // Update the service state to reflect the boat selection
        this.initializeFromURL();

        // Close the modal
        this.closeModal();

        // Hide reservation block if in mobile view
        if (this.isMobileView()) {
          const reservationBlock = document.querySelector('[data-element="boatRental_listingPage_reservationBlock"]');
          if (reservationBlock) {
            reservationBlock.style.display = 'none';
          }
        }

        // Ensure proper visibility: selectBoatWrapper as flex, boatDetailsWrapper hidden
        this.selectWrapper.style.display = 'flex';
        this.detailsWrapper.style.display = 'none';

        // Trigger other updates to ensure proper visibility
        if (window.updateBoatVisibility) window.updateBoatVisibility();
        if (window.handleBoatFunctionality) window.handleBoatFunctionality();

        // Update mobile handlers immediately after boat is added
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }

      setupDeliveryCheckbox(boat) {
        const deliveryBlock = document.querySelector('[data-element="boatDetails_reservation_deliveryBlock"]');

        if (!deliveryBlock) return;

        // Clone delivery block to remove old event listeners (this also clones checkbox and text inside)
        const newDeliveryBlock = deliveryBlock.cloneNode(true);
        deliveryBlock.parentNode.replaceChild(newDeliveryBlock, deliveryBlock);
        const blockElement = newDeliveryBlock;

        // Now get references to the checkbox and text from the NEW cloned block
        const checkbox = blockElement.querySelector('[data-element="boatDetails_reservation_deliveryCheckbox"]');
        const deliveryText = blockElement.querySelector('[data-element="boatDetails_reservation_deliveryText"]');

        if (!checkbox || !deliveryText) return;

        // Check if property has private dock AND if boat company can deliver to it
        const r = Wized.data.r;
        let canShowDelivery = false;
        let hasPrivateDock = false;

        if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
          const property = r.Load_Property_Details.data.property;
          hasPrivateDock = property.private_dock === true;

          if (hasPrivateDock) {
            // Property has private dock, now check if boat company can deliver to this property's city
            const propertyCityName = property.listing_city;

            if (propertyCityName && boat.deliversTo && Array.isArray(boat.deliversTo)) {
              // Check if boat delivers to the property's city
              const canDeliverToProperty = boat.deliversTo.some(location =>
                location.city && location.city.toLowerCase() === propertyCityName.toLowerCase()
              );

              canShowDelivery = canDeliverToProperty;

              // Check if property stay dates meet minimum requirements for private dock delivery
              if (canShowDelivery) {
                const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
                const privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;

                if (privateDockMinDays > 0) {
                  // Get property stay dates from URL params
                  const urlParams = new URLSearchParams(window.location.search);
                  const checkin = urlParams.get('checkin');
                  const checkout = urlParams.get('checkout');

                  if (checkin && checkout) {
                    // Calculate the number of days in the property stay
                    const propertyStayDates = this.generateDateRange(checkin, checkout);
                    const propertyStayDays = propertyStayDates.length;

                    // Rule: Can't do private dock delivery on check-in date, so subtract 1 from available days
                    const usablePropertyDays = propertyStayDays - 1;

                    // If usable property days don't meet minimum, can't show delivery at all
                    if (usablePropertyDays < privateDockMinDays) {
                      canShowDelivery = false;
                    }
                  }
                }
              }
            }
          }
        }

        // If no private dock at all, hide the delivery block completely
        if (!hasPrivateDock) {
          if (blockElement) {
            blockElement.style.display = 'none';
          }
          return;
        }

        // If property stay doesn't meet minimum, hide completely
        if (!canShowDelivery) {
          if (blockElement) {
            blockElement.style.display = 'none';
          }

          // If delivery was previously selected, uncheck it and update everything
          if (this.deliverySelected) {
            this.deliverySelected = false;
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
            this.updateDeliveryURLParam(false);

            // Update pricing to reflect no delivery
            if (this.currentBoatData) {
              this.updateBoatDetailsPricing(this.currentBoatData);
            }
          }

          return;
        }

        // Show delivery block
        if (blockElement) {
          blockElement.style.display = '';
        }

        // Initialize delivery state first - prioritize actual delivery selection over private dock auto-selection
        const urlParams = new URLSearchParams(window.location.search);
        const isDeliverySelected = urlParams.get('boatDelivery') === 'true';
        const isPrivateDockSelected = urlParams.get('boatPrivateDock') === 'true';

        // Only auto-select delivery if private dock is selected AND delivery isn't explicitly set to false
        if (isPrivateDockSelected && urlParams.get('boatDelivery') !== 'false') {
          this.deliverySelected = true;
        } else {
          this.deliverySelected = isDeliverySelected;
        }

        // Property stay meets minimum - now check if user-selected boat dates meet minimum
        const dockDetails = this.getPrivateDockDeliveryDetails(boat);
        const dockMinDays = dockDetails?.minDays ? Number(dockDetails.minDays) : 0;

        let boatDatesDisabled = false;
        let disabledReason = null;

        // Check if first selected date is check-in date
        if (this.selectedDates.length > 0) {
          const urlParams2 = new URLSearchParams(window.location.search);
          const checkin = urlParams2.get('checkin');

          if (this.selectedDates[0] === checkin) {
            boatDatesDisabled = true;
            disabledReason = 'check-in';
          }
          // Check if dates don't meet minimum
          else if (dockMinDays > 0 && this.selectedDates.length < dockMinDays) {
            boatDatesDisabled = true;
            disabledReason = 'min-days';
          }
        }

        // Handle disabled state based on user-selected boat dates
        if (boatDatesDisabled) {
          // Show disabled state
          if (blockElement) {
            blockElement.style.opacity = '0.5';
            blockElement.style.cursor = 'not-allowed';
            blockElement.setAttribute('data-disabled', 'true');
          }

          // Update text to show "Private dock delivery"
          if (deliveryText) {
            deliveryText.textContent = 'Private dock delivery';
          }

          // Uncheck the checkbox visually
          this.updateCheckboxVisual(checkbox, false);

          // If delivery was previously selected, uncheck it
          if (this.deliverySelected) {
            this.deliverySelected = false;
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
            this.updateDeliveryURLParam(false);

            // Update pricing to reflect no delivery
            if (this.currentBoatData) {
              this.updateBoatDetailsPricing(this.currentBoatData);
            }
          }

          // Add tooltip handlers - only when disabled
          let tooltipMsg = '';
          if (disabledReason === 'check-in') {
            tooltipMsg = 'Private dock delivery not available on check-in date';
          } else if (disabledReason === 'min-days') {
            tooltipMsg = `${dockMinDays} days needed for private dock delivery`;
          }

          if (tooltipMsg) {
            checkbox.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.showTooltipMessage(blockElement, tooltipMsg);
            });

            blockElement.addEventListener('mouseenter', () => {
              this.showTooltipMessage(blockElement, tooltipMsg);
            });

            blockElement.addEventListener('mouseleave', () => {
              this.hideTooltipMessage();
            });
          }

          return; // Exit early when disabled
        }

        // Enable delivery block - all conditions are met
        if (blockElement) {
          blockElement.style.opacity = '';
          blockElement.style.cursor = '';
          blockElement.removeAttribute('data-disabled');
        }

        // Set initial checkbox state (deliverySelected was already initialized above)
        this.updateCheckboxVisual(checkbox, this.deliverySelected);

        // Set delivery text based on delivery fee and minimum days
        const deliveryFee = boat.companyDeliveryFee || 0;
        const deliveryDockDetails = this.getPrivateDockDeliveryDetails(boat);
        const deliveryMinDays = deliveryDockDetails?.minDays ? Number(deliveryDockDetails.minDays) : 0;

        let deliveryTextContent = '';
        if (deliveryFee === 0 || deliveryFee === null) {
          deliveryTextContent = 'Complimentary boat delivery';
        } else {
          deliveryTextContent = `Delivered to property ($${deliveryFee})`;
        }

        // Add minimum days requirement if applicable
        if (deliveryMinDays > 1) {
          deliveryTextContent += ` (${deliveryMinDays} Day Min)`;
        }

        deliveryText.textContent = deliveryTextContent;

        // Add click handler to the new checkbox - only when NOT disabled
        checkbox.addEventListener('click', (e) => {
          e.preventDefault();
          this.deliverySelected = !this.deliverySelected;

          // Update visual state
          this.updateCheckboxVisual(checkbox, this.deliverySelected);

          // Update URL params
          this.updateDeliveryURLParam(this.deliverySelected);

          // Sync with private dock filter
          this.selectedPrivateDock = this.deliverySelected;

          // Update private dock filter UI and URL params
          this.updatePrivateDockFilterText();
          this.updateFilterStyles();
          this.updateURLParams();

          // Apply pickup time gating when delivery checkbox changes
          // Use requestAnimationFrame to ensure DOM updates are applied after state changes
          requestAnimationFrame(() => {
            this.applyPickupTimeGating(this.pickupTimePills, false);
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

            // Double-check with another frame to ensure it sticks
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.pickupTimePills, false);
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

              // Update date/time text display after pickup time gating is complete
              this.updateBoatDetailsDateFilterText();
            });
          });


          // Update pricing
          this.updateBoatDetailsPricing(boat);
        });
      }

      updateCheckboxVisual(checkbox, isChecked) {
        // Add or remove checkmark visual indicator
        if (isChecked) {
          checkbox.style.backgroundColor = '#000000';
          checkbox.style.borderColor = '#000000';
          checkbox.innerHTML = '';
          checkbox.style.color = 'white';
          checkbox.style.textAlign = 'center';
          checkbox.style.lineHeight = checkbox.style.height || '20px';
        } else {
          checkbox.style.backgroundColor = 'transparent';
          checkbox.style.borderColor = '#ccc';
          checkbox.innerHTML = '';
        }
      }

      updateDeliveryURLParam(isSelected) {
        const url = new URL(window.location);
        if (isSelected) {
          url.searchParams.set('boatDelivery', 'true');
          url.searchParams.set('boatPrivateDock', 'true');
        } else {
          // Explicitly set to false to avoid auto-selection conflicts
          url.searchParams.set('boatDelivery', 'false');
          url.searchParams.set('boatPrivateDock', 'false');
        }
        window.history.replaceState({}, '', url);
      }

      updateBoatDetailsPricing(boat) {
        const reservationPrice = document.querySelector('[data-element="boatDetails_reservation_price"]');
        const priceFeeElement = document.querySelector('[data-element="boatDetails_reservation_priceFee"]');
        const taxesElement = document.querySelector('[data-element="boatDetails_reservation_taxes"]');
        const totalPriceElement = document.querySelector('[data-element="boatDetails_reservation_totalPrice"]');
        const pricesContainer = document.querySelector('[data-element="boatDetails_reservation_prices_container"]');
        const priceTotalText = document.querySelector('[data-element="boatDetails_reservation_priceTotalText"]');

        if (this.selectedDates.length === 0) {
          if (pricesContainer) {
            pricesContainer.style.display = 'none';
          }
          // Hide "total price" text when showing starting price
          if (priceTotalText) {
            priceTotalText.style.display = 'none';
          }
          // No dates selected - show starting price
          if (reservationPrice) {
            let startingPriceText = this.getStartingPriceText(boat);

            // For boatDetails_reservation_price, add days text if min is > 1
            const boatMinLength = boat.minReservationLength || 0;
            const publicDockDetails = this.getPublicDockDeliveryDetails(boat);
            const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
            let privateDockMinDays = 0;
            if (this.deliverySelected) {
              const privateDockDetails = this.getPrivateDockDeliveryDetails(boat);
              privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
            }
            const effectiveMinLength = Math.max(boatMinLength, publicDockMinDays, privateDockMinDays);

            if (effectiveMinLength > 1) {
              startingPriceText += ` (${effectiveMinLength} Days)`;
            }

            reservationPrice.textContent = startingPriceText;
          }
          // Clear breakdown elements when no dates selected
          if (priceFeeElement) priceFeeElement.textContent = '';
          if (taxesElement) taxesElement.textContent = '';
          if (totalPriceElement) totalPriceElement.textContent = '';

          // Update mobile footer
          this.updateMobileFooter(boat);
          return;
        }

        // Use unified pricing calculation
        const quote = this.computeBoatQuote(boat, {
          selectedDates: this.selectedDates,
          selectedLengthType: this.selectedLengthType,
          selectedPrivateDock: this.deliverySelected, // Use deliverySelected for boat details pricing
          selectedGuests: this.selectedGuests
        });

        const priceWithDelivery = quote.base + quote.fees.publicDock + quote.fees.service + quote.fees.delivery;

        // Calculate taxes (7.5% of price + public dock fee + delivery fee)
        const taxRate = 0.075;
        const taxes = priceWithDelivery * taxRate;

        // Calculate total including taxes
        const totalPrice = priceWithDelivery + taxes;

        // Update price breakdown elements
        if (priceFeeElement) {
          priceFeeElement.textContent = `$${Math.round(priceWithDelivery).toLocaleString()}`;
        }

        if (taxesElement) {
          taxesElement.textContent = `$${Math.round(taxes).toLocaleString()}`;
        }

        if (totalPriceElement) {
          totalPriceElement.textContent = `$${Math.round(totalPrice).toLocaleString()}`;
        }

        if (reservationPrice) {
          reservationPrice.textContent = `$${Math.round(totalPrice).toLocaleString()}`;
        }

        // Show "total price" text when displaying total price
        if (priceTotalText) {
          priceTotalText.style.display = '';
        }

        // Make the price container flex when there are price values
        if (pricesContainer) {
          pricesContainer.style.display = 'flex';
          pricesContainer.style.flexDirection = 'column';
        }

        // Update mobile footer
        this.updateMobileFooter(boat);
      }

      // Check if in mobile view
      isMobileView() {
        return window.innerWidth <= 990;
      }

      // Update mobile footer reservation details
      updateMobileFooter(boat) {
        const reservationTotal = document.querySelector('[data-element="Boat_Reservation_Total"]');
        const reservationDatesPhone = document.querySelector('[data-element="Boat_Reservation_Dates_PhoneFooter"]');
        const cancellationDatePhone = document.querySelector('[data-element="boat_free_cancelation_date_text_phone"]');
        const datesDetailsContainer = document.querySelector('[data-element="boat_reservationFooter_datesDetailsContainer"]');
        const selectDatesButton = document.querySelector('[data-element="boatDetails_reservation_selectDatesOrAddGuestsButton_footer"]');
        const addToReservationButtonFooter = document.querySelector('[data-element="boatDetails_reservation_addToReservationButton_footer"]');

        // Always show reservation block in non-mobile view
        const reservationBlock = document.querySelector('[data-element="boatRental_listingPage_reservationBlock"]');
        if (reservationBlock && !this.isMobileView()) {
          reservationBlock.style.display = 'flex';
        }

        // Check if all required fields are selected
        const hasDates = this.selectedDates && this.selectedDates.length > 0;
        const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
        const hasGuests = this.selectedGuests && this.selectedGuests > 0;
        const allSelected = hasDates && hasPickupTime && hasGuests;

        // Update total price
        if (reservationTotal && boat) {
          if (hasDates) {
            const quote = this.computeBoatQuote(boat, {
              selectedDates: this.selectedDates,
              selectedLengthType: this.selectedLengthType,
              selectedPrivateDock: this.deliverySelected,
              selectedGuests: this.selectedGuests
            });

            const priceWithDelivery = quote.base + quote.fees.publicDock + quote.fees.service + quote.fees.delivery;
            const taxRate = 0.075;
            const taxes = priceWithDelivery * taxRate;
            const totalPrice = priceWithDelivery + taxes;

            reservationTotal.textContent = `$${Math.round(totalPrice).toLocaleString()}`;
          } else {
            reservationTotal.textContent = this.getStartingPriceText(boat);
          }
        }

        // Update dates and guests summary
        if (reservationDatesPhone) {
          reservationDatesPhone.textContent = this.getFormattedDatesSummary();
        }

        // Update cancellation text
        if (cancellationDatePhone) {
          const cancellationText = document.querySelector('[data-element="boatDetails_reservation_cancellationText"]');
          if (cancellationText) {
            cancellationDatePhone.textContent = cancellationText.textContent;
          }
        }

        // Show/hide appropriate elements based on requirements
        if (allSelected) {
          if (datesDetailsContainer) datesDetailsContainer.style.display = 'flex';
          if (selectDatesButton) selectDatesButton.style.display = 'none';
          if (addToReservationButtonFooter) addToReservationButtonFooter.style.display = 'flex';
        } else {
          if (datesDetailsContainer) datesDetailsContainer.style.display = 'none';
          if (addToReservationButtonFooter) addToReservationButtonFooter.style.display = 'none';
          if (selectDatesButton) {
            selectDatesButton.style.display = 'flex';
            // Update the button text via the nested data-element
            const buttonText = selectDatesButton.querySelector('[data-element="boatDetails_reservation_selectDatesOrAddGuestsButton_footerText"]');
            if (buttonText) {
              buttonText.textContent = this.getMissingRequirementsText();
            } else {
              // Fallback if nested element doesn't exist
              selectDatesButton.textContent = this.getMissingRequirementsText();
            }
          }
        }
      }

      // Get formatted dates summary for mobile footer
      getFormattedDatesSummary() {
        if (!this.selectedDates || this.selectedDates.length === 0) {
          return '';
        }

        const currentYear = new Date().getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let dateText = '';

        if (this.selectedDates.length === 1) {
          // Single day
          const [year, month, day] = this.selectedDates[0].split('-').map(Number);
          const monthName = monthNames[month - 1];
          const yearText = year !== currentYear ? `, ${year}` : '';
          const lengthText = this.selectedLengthType === 'half' ? ' (Half Day)' : '';
          dateText = `${monthName} ${day}${yearText}${lengthText}`;
        } else {
          // Multiple days
          const sortedDates = [...this.selectedDates].sort();
          const [startYear, startMonth, startDay] = sortedDates[0].split('-').map(Number);
          const [endYear, endMonth, endDay] = sortedDates[sortedDates.length - 1].split('-').map(Number);

          const startMonthName = monthNames[startMonth - 1];
          const endMonthName = monthNames[endMonth - 1];
          const showYear = endYear !== currentYear;
          const yearText = showYear ? `, ${endYear}` : '';

          if (startMonth === endMonth && startYear === endYear) {
            dateText = `${startMonthName} ${startDay} - ${endDay}${yearText}`;
          } else {
            dateText = `${startMonthName} ${startDay} - ${endMonthName} ${endDay}${yearText}`;
          }
        }

        // Add guests
        const guestText = this.selectedGuests === 1 ? '1 Passenger' : `${this.selectedGuests} Passengers`;
        return `${dateText} • ${guestText}`;
      }

      // Get text for missing requirements button
      getMissingRequirementsText() {
        const hasDates = this.selectedDates && this.selectedDates.length > 0;
        const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
        const hasGuests = this.selectedGuests && this.selectedGuests > 0;

        // When nothing is selected
        if (!hasDates && !hasPickupTime && !hasGuests) {
          return 'Select Dates, Time, & Passengers';
        }

        // When dates are missing (first step)
        if (!hasDates) {
          return 'Select Dates';
        }

        // When pickup time is missing (second step)
        if (!hasPickupTime) {
          return 'Select Pickup Time';
        }

        // When only guests are missing (third step)
        if (!hasGuests) {
          return 'Add Passengers';
        }

        return 'Complete Reservation Details';
      }

      // Update dates popup "Done" button text based on mobile view and what's missing
      updateDatesDoneButtonText() {
        const doneButtonText = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_doneButton_text"]');
        if (!doneButtonText) return;

        // In mobile view, show "Next" if pickup time or guests are missing
        if (this.isMobileView()) {
          const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
          const hasGuests = this.selectedGuests && this.selectedGuests > 0;

          if (!hasPickupTime || !hasGuests) {
            doneButtonText.textContent = 'Next';
          } else {
            doneButtonText.textContent = 'Done';
          }
        } else {
          doneButtonText.textContent = 'Done';
        }
      }

      // Update pickup time popup "Done" button text based on mobile view and guests
      updatePickupTimeDoneButtonText() {
        const doneButtonText = document.querySelector('[data-element="addBoatModal_boatDetails_pickupTimePopup_doneButton_text"]');
        if (!doneButtonText) return;

        // In mobile view, show "Next" if guests are missing
        if (this.isMobileView()) {
          const hasGuests = this.selectedGuests && this.selectedGuests > 0;

          if (!hasGuests) {
            doneButtonText.textContent = 'Next';
          } else {
            doneButtonText.textContent = 'Done';
          }
        } else {
          doneButtonText.textContent = 'Done';
        }
      }

      // // Update boat details X button visibility based on mobile view
      // updateBoatDetailsXButtonVisibility() {
      //   if (!this.boatDetailsXButton) return;

      //   if (this.isMobileView()) {
      //     this.boatDetailsXButton.style.display = 'flex';
      //   } else {
      //     this.boatDetailsXButton.style.display = 'none';
      //   }
      // }

      // Update reservation block visibility based on mobile/desktop view
      updateReservationBlockVisibility() {
        const reservationBlock = document.querySelector('[data-element="boatRental_listingPage_reservationBlock"]');
        if (!reservationBlock) return;

        if (this.isMobileView()) {
          // In mobile view, check if we're in boat details view
          if (this.detailsWrapper && this.detailsWrapper.style.display === 'flex') {
            // In boat details view on mobile, hide reservation block (footer takes over)
            reservationBlock.style.display = 'none';
          }
          // If not in boat details view on mobile, leave it as is
        } else {
          // In desktop view, always show reservation block
          reservationBlock.style.display = 'flex';
        }
      }



      initializeBoatDetailsDateFilter() {
        // Initialize boat details date filter text
        if (this.boatDetailsDateFilterText) {
          if (this.selectedDates.length === 0) {
            this.boatDetailsDateFilterText.textContent = 'Select dates';
          } else if (this.selectedDates.length === 1) {
            const dateStr = this.selectedDates[0];
            const formattedDate = this.formatDateStringForDisplay(dateStr);
            this.boatDetailsDateFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day)`;
          } else {
            // Sort dates to get start and end
            const sortedDates = [...this.selectedDates].sort();
            const startDateStr = sortedDates[0];
            const endDateStr = sortedDates[sortedDates.length - 1];

            // Parse date components
            const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

            // Format months
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const startMonthName = monthNames[startMonth - 1];
            const endMonthName = monthNames[endMonth - 1];

            let dateRange;
            if (startMonth === endMonth && startYear === endYear) {
              dateRange = `${startMonthName} ${startDay} - ${endDay}`;
            } else {
              dateRange = `${startMonthName} ${startDay} - ${endMonthName} ${endDay}`;
            }

            this.boatDetailsDateFilterText.textContent = `${dateRange}`;
          }
        }

        // Initialize boat details pickup time pills
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
          }
        });

        // Initialize boat details length type buttons
        if (this.boatDetailsFullDayBtn && this.boatDetailsHalfDayBtn) {
          // Remove existing classes
          this.boatDetailsFullDayBtn.classList.remove('selected');
          this.boatDetailsHalfDayBtn.classList.remove('selected');

          if (this.selectedDates.length > 1) {
            // Multiple dates - only full day available
            this.selectedLengthType = 'full';
            this.boatDetailsFullDayBtn.classList.add('selected');
            this.boatDetailsHalfDayBtn.style.opacity = '0.5';
            this.boatDetailsHalfDayBtn.style.cursor = 'not-allowed';
          } else {
            // Single or no date - both options available
            this.boatDetailsHalfDayBtn.style.opacity = '1';
            this.boatDetailsHalfDayBtn.style.cursor = 'pointer';

            if (this.selectedLengthType === 'full') {
              this.boatDetailsFullDayBtn.classList.add('selected');
            } else {
              this.boatDetailsHalfDayBtn.classList.add('selected');
            }
          }
        }

        // Render boat details date selection calendar
        this.renderBoatDetailsDateSelection();

        // Update boat details price
        this.updateBoatDetailsPrice();
      }

      renderBoatDetailsDateSelection() {
        if (!this.boatDetailsSelectDatesSection) return;

        // Get checkin and checkout dates from URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout) return;

        this.boatDetailsSelectDatesSection.innerHTML = '';

        // Create date range using string manipulation
        const dateArray = this.generateDateRange(checkin, checkout);

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

        // Create month/year header
        const monthYearHeader = document.createElement('div');
        monthYearHeader.textContent = this.getMonthYearHeader(checkin, checkout);
        monthYearHeader.style.fontSize = '16px';
        monthYearHeader.style.fontFamily = 'TT Fors, sans-serif';
        monthYearHeader.style.fontWeight = '500';
        monthYearHeader.style.color = '#000000';
        monthYearHeader.style.textAlign = 'center';
        monthYearHeader.style.marginBottom = '12px';
        calendarContainer.appendChild(monthYearHeader);

        // Create days of week header
        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.gap = '6px';
        daysHeader.style.justifyItems = 'center';

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
          const dayHeader = document.createElement('div');
          dayHeader.textContent = day;
          dayHeader.style.fontSize = '12px';
          dayHeader.style.fontFamily = 'TT Fors, sans-serif';
          dayHeader.style.color = '#808080';
          dayHeader.style.textTransform = 'uppercase';
          daysHeader.appendChild(dayHeader);
        });

        calendarContainer.appendChild(daysHeader);

        // Create dates grid
        const datesGrid = document.createElement('div');
        datesGrid.style.display = 'grid';
        datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesGrid.style.gap = '6px';
        datesGrid.style.justifyItems = 'center';

        // Calculate empty cells needed at start
        const firstDateStr = dateArray[0];
        const emptyStartCells = this.getDayOfWeek(firstDateStr);

        // Add empty cells at start
        for (let i = 0; i < emptyStartCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        // Calculate effective min days for the current boat
        let effectiveMinDays = 0;
        if (this.currentBoatData) {
          const publicDockDetails = this.getPublicDockDeliveryDetails(this.currentBoatData);
          const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
          const boatMinDays = this.currentBoatData.minReservationLength || 0;

          // Only consider private dock minimum if private dock delivery is selected
          let privateDockMinDays = 0;
          if (this.selectedPrivateDock) {
            const privateDockDetails = this.getPrivateDockDeliveryDetails(this.currentBoatData);
            privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
          }

          effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);
        }

        // Get property checkin/checkout dates for private dock rules
        const propertyCheckin = checkin;
        const propertyCheckout = checkout;

        // Create date buttons
        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          // Check if this is check-in or checkout date
          const isCheckinDate = dateStr === propertyCheckin;
          const isCheckoutDate = dateStr === propertyCheckout;

          // Check if date should be disabled based on minDays requirement or private dock rules
          let isDisabled = false;
          let disabledTooltip = null;

          // Rule: If private dock is selected, disable check-in date (even before any dates are selected)
          if (this.selectedPrivateDock && isCheckinDate) {
            isDisabled = true;
            disabledTooltip = 'Private dock delivery not available on check-in date';
          }
          // Check minimum days requirement only when private dock is NOT selected
          else if (!this.selectedPrivateDock && this.selectedDates.length === 1 && effectiveMinDays > 0) {
            const firstSelectedDate = new Date(this.selectedDates[0]);
            const currentDate = new Date(dateStr);
            const daysDiff = Math.round((currentDate - firstSelectedDate) / (1000 * 60 * 60 * 24)) + 1;

            // Disable dates that are less than minDays away from the first selected date
            if (currentDate > firstSelectedDate && daysDiff < effectiveMinDays) {
              isDisabled = true;
            }
          }

          // Create date button
          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          // Style based on state
          if (isDisabled) {
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#ccc';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.disabled = true;
          } else {
            dateBtn.style.background = this.selectedDates.includes(dateStr) ? '#000000' : 'white';
            dateBtn.style.color = this.selectedDates.includes(dateStr) ? 'white' : 'black';
            dateBtn.style.cursor = 'pointer';
          }

          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          // Add event handlers
          if (isDisabled && disabledTooltip) {
            // Show tooltip for disabled dates (checkin date when private dock selected)
            dateBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showTooltipMessage(dateBtn, disabledTooltip);
            });

            dateBtn.addEventListener('mouseenter', () => {
              this.showTooltipMessage(dateBtn, disabledTooltip);
            });

            dateBtn.addEventListener('mouseleave', () => {
              this.hideTooltipMessage();
            });
          } else if (!isDisabled) {
            // Normal clickable date
            dateBtn.addEventListener('click', () => {
              this.handleBoatDetailsDateSelection(dateStr);
            });

            // Add tooltip for checkout date if private dock is selected
            if (this.selectedPrivateDock && isCheckoutDate) {
              dateBtn.addEventListener('mouseenter', () => {
                const r = window.Wized?.data?.r;
                const checkoutTime = r?.Load_Property_Details?.data?.property?.check_out_time || '10 AM';
                this.showTooltipMessage(dateBtn, `Boat must be picked up before ${checkoutTime}`);
              });

              dateBtn.addEventListener('mouseleave', () => {
                this.hideTooltipMessage();
              });
            }
          }

          datesGrid.appendChild(dateBtn);
        });

        // Calculate empty cells needed at end
        const lastDateStr = dateArray[dateArray.length - 1];
        const emptyEndCells = 6 - this.getDayOfWeek(lastDateStr);

        // Add empty cells at end
        for (let i = 0; i < emptyEndCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        calendarContainer.appendChild(datesGrid);
        this.boatDetailsSelectDatesSection.appendChild(calendarContainer);
      }

      handleBoatDetailsDateSelection(dateStr) {
        // If no dates selected, select this date
        if (this.selectedDates.length === 0) {
          this.selectedDates = [dateStr];
        }
        // If one date selected
        else if (this.selectedDates.length === 1) {
          const existingDateStr = this.selectedDates[0];

          // If clicking the same date, deselect it
          if (dateStr === existingDateStr) {
            this.selectedDates = [];
          }
          // If clicking a different date, create a range
          else {
            // Compare date strings to determine order
            const startDateStr = existingDateStr < dateStr ? existingDateStr : dateStr;
            const endDateStr = existingDateStr < dateStr ? dateStr : existingDateStr;

            // Generate all dates in the range
            this.selectedDates = this.generateDateRange(startDateStr, endDateStr);

            // If multiple dates selected, switch to full day
            if (this.selectedDates.length > 1 && this.selectedLengthType === 'half') {
              this.selectedLengthType = 'full';
            }
          }
        }
        // If multiple dates selected (range exists), clear and start new selection
        else {
          this.selectedDates = [dateStr];
        }

        // Update all button styles
        this.updateBoatDetailsDateButtonStyles();

        // Update length type options and text
        this.initializeBoatDetailsDateFilter();
        this.updateURLParams();

        // Update existing cards if modal is open
        this.updateExistingCards();

        // Update boat details price
        this.updateBoatDetailsPrice();

        // Apply pickup time gating when dates change (first/last day affects gating)
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

        // Clear error highlights when user provides dates
        this.clearBoatDetailsErrorHighlights();

        // Don't check private dock filter availability until user exits dates section
        // this.checkPrivateDockFilterAvailabilityForBoatDates();

        // Don't check delivery checkbox and private dock filter until user exits dates section
        // This prevents auto-deselecting private dock while user is selecting dates
        // if (this.currentBoatData) {
        //   this.setupDeliveryCheckbox(this.currentBoatData);
        // }
        // this.checkPrivateDockFilterAvailabilityForBoatDates();

        // Clear error if conditions are now met
        this.clearErrorIfResolved(this.boatDetailsErrorElement);
      }

      updateBoatDetailsDateButtonStyles() {
        // Get all date buttons in boat details section
        if (!this.boatDetailsSelectDatesSection) return;

        const dateButtons = this.boatDetailsSelectDatesSection.querySelectorAll('button');

        dateButtons.forEach(btn => {
          const btnDateStr = btn.getAttribute('data-date');
          if (btnDateStr && this.selectedDates.includes(btnDateStr)) {
            btn.style.background = '#000000';
            btn.style.color = 'white';
            btn.style.borderColor = '#000000';
          } else if (btnDateStr) {
            btn.style.background = 'white';
            btn.style.color = 'black';
            btn.style.borderColor = '#ddd';
          }
        });
      }

      setupBoatDetailsHandlers() {
        // Boat details date filter handler
        if (this.boatDetailsDateFilter) {
          this.boatDetailsDateFilter.addEventListener('click', () => {
            // Close all other popups first
            if (this.guestsPopup) this.guestsPopup.style.display = 'none';
            if (this.pricePopup) this.pricePopup.style.display = 'none';
            if (this.lengthPopup) this.lengthPopup.style.display = 'none';
            if (this.typePopup) this.typePopup.style.display = 'none';
            if (this.datesPopup) this.datesPopup.style.display = 'none';

            // Show boat details dates popup
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'flex';
            if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';

            // Re-render date selection to ensure correct disabled states based on private dock selection
            this.renderBoatDetailsDateSelection();

            // Update dates done button text
            this.updateDatesDoneButtonText();
          });
        }

        // Boat details popup exit handler
        if (this.boatDetailsPopupExit) {
          this.boatDetailsPopupExit.addEventListener('click', () => {
            // Check if single date selected with min days > 1, reset if so
            if (this.selectedDates.length === 1 && this.currentBoatData) {
              const publicDockDetails = this.getPublicDockDeliveryDetails(this.currentBoatData);
              const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
              const boatMinDays = this.currentBoatData.minReservationLength || 0;

              let privateDockMinDays = 0;
              if (this.selectedPrivateDock) {
                const privateDockDetails = this.getPrivateDockDeliveryDetails(this.currentBoatData);
                privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
              }

              const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

              // If min days > 1 and only one date selected, reset to no selection
              if (effectiveMinDays > 1) {
                this.selectedDates = [];
                this.updateBoatDetailsDateButtonStyles();
                this.initializeBoatDetailsDateFilter();
                this.updateURLParams();
                this.updateBoatDetailsPrice();
              }
            }

            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
          });
        }

        // Boat details popup done handler
        if (this.boatDetailsPopupDone) {
          this.boatDetailsPopupDone.addEventListener('click', () => {
            // Check if single date selected with min days > 1, reset if so
            if (this.selectedDates.length === 1 && this.currentBoatData) {
              const publicDockDetails = this.getPublicDockDeliveryDetails(this.currentBoatData);
              const publicDockMinDays = publicDockDetails?.minDays ? Number(publicDockDetails.minDays) : 0;
              const boatMinDays = this.currentBoatData.minReservationLength || 0;

              let privateDockMinDays = 0;
              if (this.selectedPrivateDock) {
                const privateDockDetails = this.getPrivateDockDeliveryDetails(this.currentBoatData);
                privateDockMinDays = privateDockDetails?.minDays ? Number(privateDockDetails.minDays) : 0;
              }

              const effectiveMinDays = Math.max(publicDockMinDays, privateDockMinDays, boatMinDays);

              // If min days > 1 and only one date selected, reset to no selection
              if (effectiveMinDays > 1) {
                this.selectedDates = [];
                this.updateBoatDetailsDateButtonStyles();
                this.initializeBoatDetailsDateFilter();
                this.updateURLParams();
                this.updateBoatDetailsPrice();
              }
            }

            // Now that user is exiting dates section, check private dock filter availability and fetch boats
            this.checkPrivateDockFilterAvailabilityForBoatDates();
            this.fetchAndRenderBoats();

            // Re-check delivery checkbox now that user has finished selecting dates
            if (this.currentBoatData) {
              this.setupDeliveryCheckbox(this.currentBoatData);
            }

            // In mobile view, follow the flow: dates → pickup time → guests
            if (this.isMobileView()) {
              const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
              const hasGuests = this.selectedGuests && this.selectedGuests > 0;

              if (!hasPickupTime) {
                // Next step: pickup time - OPEN FIRST, then close current
                if (this.boatDetailsPickupTimePopup) {
                  this.boatDetailsPickupTimePopup.style.display = 'flex';
                }
                // Update pickup time button text
                this.updatePickupTimeDoneButtonText();
                // Now close dates popup
                if (this.boatDetailsPopup) {
                  this.boatDetailsPopup.style.display = 'none';
                }
              } else if (!hasGuests) {
                // Next step: guests - OPEN FIRST, then close current
                if (this.boatDetailsGuestsPopup) {
                  this.boatDetailsGuestsPopup.style.display = 'flex';
                }
                // Now close dates popup
                if (this.boatDetailsPopup) {
                  this.boatDetailsPopup.style.display = 'none';
                }
              } else {
                // Both selected, just close (done)
                if (this.boatDetailsPopup) {
                  this.boatDetailsPopup.style.display = 'none';
                }
              }
            } else {
              // Desktop: just close
              if (this.boatDetailsPopup) {
                this.boatDetailsPopup.style.display = 'none';
              }
            }
          });

          // Update button text based on mobile state and what's missing
          this.updateDatesDoneButtonText();
        }

        // Boat details pickup time filter handler (separate from dates now)
        if (this.boatDetailsPickupTimeFilter) {
          this.boatDetailsPickupTimeFilter.addEventListener('click', () => {
            // Close all other popups first
            if (this.datesPopup) this.datesPopup.style.display = 'none';
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
            if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';
            if (this.pricePopup) this.pricePopup.style.display = 'none';
            if (this.lengthPopup) this.lengthPopup.style.display = 'none';
            if (this.typePopup) this.typePopup.style.display = 'none';

            // Show boat details pickup time popup
            if (this.boatDetailsPickupTimePopup) this.boatDetailsPickupTimePopup.style.display = 'flex';

            // Update pickup time done button text
            this.updatePickupTimeDoneButtonText();

            // Apply gating when popup opens
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });
          });
        }

        // Boat details pickup time popup exit handler
        if (this.boatDetailsPickupTimePopupExit) {
          this.boatDetailsPickupTimePopupExit.addEventListener('click', () => {
            if (this.boatDetailsPickupTimePopup) this.boatDetailsPickupTimePopup.style.display = 'none';

            // Apply gating when popup closes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });
          });
        }

        // Boat details pickup time popup done handler
        if (this.boatDetailsPickupTimePopupDone) {
          this.boatDetailsPickupTimePopupDone.addEventListener('click', () => {
            // In mobile view, follow the flow: if guests haven't been selected, open guests popup
            if (this.isMobileView()) {
              const hasGuests = this.selectedGuests && this.selectedGuests > 0;

              if (!hasGuests) {
                // Next step: guests - OPEN FIRST, then close current
                if (this.boatDetailsGuestsPopup) {
                  this.boatDetailsGuestsPopup.style.display = 'flex';
                }
                // Now close pickup time popup
                if (this.boatDetailsPickupTimePopup) {
                  this.boatDetailsPickupTimePopup.style.display = 'none';
                }
              } else {
                // All selected, just close (done)
                if (this.boatDetailsPickupTimePopup) {
                  this.boatDetailsPickupTimePopup.style.display = 'none';
                }
              }
            } else {
              // Desktop: just close
              if (this.boatDetailsPickupTimePopup) {
                this.boatDetailsPickupTimePopup.style.display = 'none';
              }
            }

            // Apply gating when popup closes
            requestAnimationFrame(() => {
              this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            });
          });
        }

        // Boat details guest filter handler
        if (this.boatDetailsGuestsFilter) {
          this.boatDetailsGuestsFilter.addEventListener('click', () => {
            // Close all other popups first
            if (this.datesPopup) this.datesPopup.style.display = 'none';
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
            if (this.pricePopup) this.pricePopup.style.display = 'none';
            if (this.lengthPopup) this.lengthPopup.style.display = 'none';
            if (this.typePopup) this.typePopup.style.display = 'none';

            // Show boat details guests popup
            if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'flex';
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
          });
        }

        // Boat details guest popup exit handler
        if (this.boatDetailsGuestsPopupExit) {
          this.boatDetailsGuestsPopupExit.addEventListener('click', () => {
            if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';
          });
        }

        // Boat details guest popup done handler
        if (this.boatDetailsGuestsPopupDone) {
          this.boatDetailsGuestsPopupDone.addEventListener('click', () => {
            if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';
          });
        }

        // Setup boat details pickup time pills
        this.setupBoatDetailsPickupTimePills();

        // Setup boat details length type buttons
        this.setupBoatDetailsLengthTypeButtons();
      }

      setupBoatDetailsPickupTimePills() {
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (!pill) return;

          pill.addEventListener('click', () => {
            // Check if this pill is disabled by gating
            if (pill.classList.contains('pickup-time-gated') || pill.getAttribute('aria-disabled') === 'true') {
              return; // Ignore clicks on gated pills
            }

            // If clicking already selected pill, deselect it
            if (this.selectedPickupTime === time) {
              this.selectedPickupTime = '';
              pill.style.borderColor = '';
              pill.style.borderWidth = '';

              // Sync with add boat wrapper pills
              Object.values(this.pickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });
            } else {
              // Deselect all pills first
              Object.values(this.boatDetailsPickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });

              // Select the clicked pill
              this.selectedPickupTime = time;
              pill.style.borderColor = '#000000';
              pill.style.borderWidth = '2px';

              // Sync with add boat wrapper pills
              Object.values(this.pickupTimePills).forEach(p => {
                if (p) {
                  p.style.borderColor = '';
                  p.style.borderWidth = '';
                }
              });
              if (this.pickupTimePills[time]) {
                this.pickupTimePills[time].style.borderColor = '#000000';
                this.pickupTimePills[time].style.borderWidth = '2px';
              }
            }

            this.initializeBoatDetailsDateFilter();
            this.updateBoatDetailsPickupTimeFilterText();
            this.updatePickupTimeFilterText(); // Keep add boat wrapper text in sync
            this.updateURLParams();
            this.updateBoatDetailsPrice();

            // Update pickup time done button text (might change from Done to Next or vice versa)
            this.updatePickupTimeDoneButtonText();

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);

            // Clear error highlights when user provides pickup time
            this.clearBoatDetailsErrorHighlights();

            // Re-apply gating after pickup time selection changes
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            // Also apply gating to add boat wrapper pills to keep them in sync
            this.applyPickupTimeGating(this.pickupTimePills, false);
          });
        });

        // Apply initial gating
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
      }

      setupBoatDetailsLengthTypeButtons() {
        // Day type handlers for boat details
        if (this.boatDetailsFullDayBtn) {
          this.boatDetailsFullDayBtn.addEventListener('click', () => {
            if (this.selectedDates.length <= 1) {
              this.selectedLengthType = 'full';
              this.initializeBoatDetailsDateFilter();
              this.updateURLParams();
              this.updateBoatDetailsPrice();

              // Clear error if conditions are now met
              this.clearErrorIfResolved(this.boatDetailsErrorElement);
            }
          });
        }

        if (this.boatDetailsHalfDayBtn) {
          this.boatDetailsHalfDayBtn.addEventListener('click', () => {
            // Allow half day selection for 0 or 1 date
            if (this.selectedDates.length <= 1) {
              this.selectedLengthType = 'half';
              this.initializeBoatDetailsDateFilter();
              this.updateURLParams();
              this.updateBoatDetailsPrice();

              // Clear error if conditions are now met
              this.clearErrorIfResolved(this.boatDetailsErrorElement);
            }
          });
        }
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Read filter parameters from URL (regardless of boatId)
        const boatGuests = urlParams.get('boatGuests');
        const boatDates = urlParams.get('boatDates');
        const boatPickupTime = urlParams.get('boatPickupTime');
        const boatLengthType = urlParams.get('boatLengthType');
        const boatPrivateDock = urlParams.get('boatPrivateDock');

        // Set guests from URL or default to 0
        this.selectedGuests = boatGuests ? parseInt(boatGuests) : 0;

        // Set dates from URL or default to empty array
        this.selectedDates = boatDates ? boatDates.split(',').filter(d => d) : [];

        // Set length type from URL or default to 'full'
        this.selectedLengthType = boatLengthType || 'full';

        // Set pickup time from URL or default to empty
        this.selectedPickupTime = boatPickupTime || '';

        // Set private dock filter from URL or default to false
        this.selectedPrivateDock = boatPrivateDock === 'true';

        // Check for boatId - if present, hide buttons and show selected boat block
        const boatId = urlParams.get('boatId');
        if (boatId) {
          this.buttons.forEach(button => {
            if (button) {
              button.style.display = 'none';
            }
          });
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'flex';

          // Update URL params to ensure all defaults are written back to URL
          this.updateURLParams();
        } else {
          this.buttons.forEach(button => {
            if (button) {
              button.style.display = 'flex';
            }
          });
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'none';
        }

        // Update UI elements
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        if (this.boatDetailsGuestNumber) this.boatDetailsGuestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();
        this.updateLengthTypeButtons();

        // Reset pickup time pills
        Object.entries(this.pickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
            pill.style.borderWidth = time === this.selectedPickupTime ? '2px' : '';
          }
        });
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
            pill.style.borderWidth = time === this.selectedPickupTime ? '2px' : '';
          }
        });

        this.updateDatesFilterText();
        this.updatePickupTimeFilterText();
        this.updateBoatDetailsDateFilterText();
        this.updateBoatDetailsPickupTimeFilterText();
        this.updateBoatDetailsGuestsFilterText();
        this.updateFilterStyles();
        this.renderDateSelection();
        this.updatePrivateDockFilterText();
      }

      updateBoatDetailsPrice() {
        // Only update if we have current boat data
        if (!this.currentBoatData) return;

        // Use the new comprehensive pricing method
        this.updateBoatDetailsPricing(this.currentBoatData);

        // Update mobile footer
        this.updateMobileFooter(this.currentBoatData);
      }

      initializeBoatDetailsGuestFilter() {
        // Initialize boat details guest filter text
        if (this.boatDetailsGuestsFilterText) {
          if (this.selectedGuests === 0) {
            this.boatDetailsGuestsFilterText.textContent = 'Boat Passengers';
          } else {
            this.boatDetailsGuestsFilterText.textContent = `${this.selectedGuests} passenger${this.selectedGuests !== 1 ? 's' : ''}`;
          }
        }

        // Initialize boat details guest number display
        if (this.boatDetailsGuestNumber) {
          this.boatDetailsGuestNumber.textContent = this.selectedGuests;
        }

        // Setup boat details guest buttons
        this.setupBoatDetailsGuestButtons();
      }

      setupBoatDetailsGuestButtons() {
        if (!this.boatDetailsGuestMinus || !this.boatDetailsGuestPlus) return;

        // Get current boat's max passengers limit
        const maxPassengers = this.currentBoatData ? this.currentBoatData.maxPassengers : 50; // Default fallback

        // Remove any existing event listeners to prevent duplicates by cloning the buttons
        const newMinusButton = this.boatDetailsGuestMinus.cloneNode(true);
        this.boatDetailsGuestMinus.parentNode.replaceChild(newMinusButton, this.boatDetailsGuestMinus);
        this.boatDetailsGuestMinus = newMinusButton; // Update reference

        const newPlusButton = this.boatDetailsGuestPlus.cloneNode(true);
        this.boatDetailsGuestPlus.parentNode.replaceChild(newPlusButton, this.boatDetailsGuestPlus);
        this.boatDetailsGuestPlus = newPlusButton; // Update reference

        // Style and setup minus button (matching boat rental style)
        this.boatDetailsGuestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleBoatDetailsGuestButton(this.boatDetailsGuestMinus);

        // Style and setup plus button (matching boat rental style)
        this.boatDetailsGuestPlus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleBoatDetailsGuestButton(this.boatDetailsGuestPlus);

        // Function to update plus button state based on passenger limit
        const updatePlusButtonState = () => {
          if (this.selectedGuests >= maxPassengers) {
            this.boatDetailsGuestPlus.style.opacity = '0.3';
            this.boatDetailsGuestPlus.style.cursor = 'not-allowed';
            this.boatDetailsGuestPlus.disabled = true;
          } else {
            this.boatDetailsGuestPlus.style.opacity = '1';
            this.boatDetailsGuestPlus.style.cursor = 'pointer';
            this.boatDetailsGuestPlus.disabled = false;
          }
        };

        // Function to update minus button state
        const updateMinusButtonState = () => {
          if (this.selectedGuests <= 0) {
            this.boatDetailsGuestMinus.style.opacity = '0.3';
            this.boatDetailsGuestMinus.style.cursor = 'not-allowed';
            this.boatDetailsGuestMinus.disabled = true;
          } else {
            this.boatDetailsGuestMinus.style.opacity = '1';
            this.boatDetailsGuestMinus.style.cursor = 'pointer';
            this.boatDetailsGuestMinus.disabled = false;
          }
        };

        // Initialize button states
        updatePlusButtonState();
        updateMinusButtonState();

        // Add event listeners
        this.boatDetailsGuestMinus.addEventListener('click', () => {
          if (this.selectedGuests > 0) {
            this.selectedGuests--;
            this.boatDetailsGuestNumber.textContent = this.selectedGuests;
            this.updateBoatDetailsGuestsFilterText();
            this.updateURLParams();
            this.updateBoatDetailsPrice();

            // Update button states
            updatePlusButtonState();
            updateMinusButtonState();

            // Update done button texts (both dates and pickup time can show "Next")
            this.updateDatesDoneButtonText();
            this.updatePickupTimeDoneButtonText();

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);

            // Clear error highlights when user provides guests
            this.clearBoatDetailsErrorHighlights();
          }
        });

        this.boatDetailsGuestPlus.addEventListener('click', () => {
          if (this.selectedGuests < maxPassengers) {
            this.selectedGuests++;
            this.boatDetailsGuestNumber.textContent = this.selectedGuests;
            this.updateBoatDetailsGuestsFilterText();
            this.updateURLParams();
            this.updateBoatDetailsPrice();

            // Update button states
            updatePlusButtonState();
            updateMinusButtonState();

            // Clear error highlights when user provides guests
            this.clearBoatDetailsErrorHighlights();

            // Update done button texts (both dates and pickup time can show "Next")
            this.updateDatesDoneButtonText();
            this.updatePickupTimeDoneButtonText();

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);
          }
        });

        // Clear button handler
        if (this.boatDetailsGuestsClearBtn) {
          // Remove any existing event listeners from clear button
          const newClearButton = this.boatDetailsGuestsClearBtn.cloneNode(true);
          this.boatDetailsGuestsClearBtn.parentNode.replaceChild(newClearButton, this.boatDetailsGuestsClearBtn);
          this.boatDetailsGuestsClearBtn = newClearButton; // Update reference

          this.boatDetailsGuestsClearBtn.addEventListener('click', () => {
            this.selectedGuests = 0;
            this.boatDetailsGuestNumber.textContent = this.selectedGuests;
            this.updateBoatDetailsGuestsFilterText();
            this.updateURLParams();
            this.updateBoatDetailsPrice();

            // Update button states
            updatePlusButtonState();
            updateMinusButtonState();

            // Update dates done button text
            this.updateDatesDoneButtonText();

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);
          });
        }
      }

      styleBoatDetailsGuestButton(button) {
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '32px';
        button.style.height = '32px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.borderRadius = '50%';
        button.style.transition = 'background-color 0.2s ease';

        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = 'whitesmoke';
        });

        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = '';
        });
      }

      updateBoatDetailsGuestsFilterText() {
        if (!this.boatDetailsGuestsFilterText) return;

        if (this.selectedGuests === 0) {
          this.boatDetailsGuestsFilterText.textContent = 'Boat Passengers';
        } else {
          this.boatDetailsGuestsFilterText.textContent = `${this.selectedGuests} passenger${this.selectedGuests !== 1 ? 's' : ''}`;
        }
      }

      // Handle editing an existing boat - fetch data and open to details view
      async handleEditBoat(boatId) {
        try {
          // Load existing boat parameters from URL
          const urlParams = new URLSearchParams(window.location.search);
          const boatGuests = urlParams.get('boatGuests');
          const boatDates = urlParams.get('boatDates');
          const boatPickupTime = urlParams.get('boatPickupTime');
          const boatLengthType = urlParams.get('boatLengthType');
          const boatPrivateDock = urlParams.get('boatPrivateDock');
          const boatDelivery = urlParams.get('boatDelivery');

          // Enter edit mode and store original parameters to restore if user cancels
          this.isEditMode = true;
          this.originalEditParams = {
            boatId: urlParams.get('boatId'),
            boatGuests: boatGuests,
            boatDates: boatDates,
            boatPickupTime: boatPickupTime,
            boatLengthType: boatLengthType,
            boatPrivateDock: boatPrivateDock,
            boatDelivery: boatDelivery
          };

          // Set the service's internal state to match URL parameters
          this.selectedGuests = boatGuests ? parseInt(boatGuests) : 0;
          this.selectedDates = boatDates ? boatDates.split(',') : [];
          this.selectedPickupTime = boatPickupTime || '';
          this.selectedLengthType = boatLengthType || 'full';
          this.selectedPrivateDock = boatPrivateDock === 'true';
          this.deliverySelected = boatDelivery === 'true';

          // Update guest number displays
          if (this.guestNumber) {
            this.guestNumber.textContent = this.selectedGuests;
          }
          if (this.boatDetailsGuestNumber) {
            this.boatDetailsGuestNumber.textContent = this.selectedGuests;
          }

          // Fetch all boat options to get the complete boat data
          const allBoats = await this.fetchBoatOptions();

          // Find the specific boat being edited
          const boatToEdit = allBoats.find(boat => boat.id == boatId);

          if (boatToEdit) {
            // Show boat details with the fetched data
            this.showBoatDetails(boatToEdit);

            // Update mobile footer with current boat data
            this.updateMobileFooter(boatToEdit);

            // // Update X button visibility
            // this.updateBoatDetailsXButtonVisibility();

            // Update reservation block visibility
            this.updateReservationBlockVisibility();
          } else {

            this.closeModal();
          }

        } catch (error) {

          this.closeModal();
        }
      }
    }

    // Initialize boat rental service
    const boatRental = new BoatRentalService();

    // Make it globally accessible for property checks
    window.boatRentalService = boatRental;

    // Mobile Boat Button Handler
    class MobileBoatButtonHandler {
      constructor() {
        this.mobileBoatButton = document.querySelector('[data-element="mobileBoatButton"]');
        this.mobileBoatButtonXButton = document.querySelector('[data-element="mobileBoatButton_xButton"]');
        this.mobileBoatButtonAddImage = document.querySelector('[data-element="mobileBoatButton_addImage"]');
        this.mobileBoatButtonText = document.querySelector('[data-element="mobileBoatButton_text"]');

        this.messageTimeout = null;

        this.initialize();
      }

      initialize() {

        if (!this.mobileBoatButton) {
          return;
        }

        // Set initial state
        this.updateMobileBoatButtonState();

        // Add click handler for the main button
        this.mobileBoatButton.addEventListener('click', () => {
          this.handleMobileBoatButtonClick();
        });

        // Add click handler for X button
        if (this.mobileBoatButtonXButton) {
          this.mobileBoatButtonXButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent main button click
            this.handleRemoveBoat();
          });
        }

        // Monitor URL changes to update button state
        window.addEventListener('popstate', () => {
          this.updateMobileBoatButtonState();
        });

        // Monitor for boat additions/removals
        const observer = new MutationObserver(() => {
          this.updateMobileBoatButtonState();
        });

        // Observe URL changes
        let lastUrl = location.href;
        new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            this.updateMobileBoatButtonState();
          }
        }).observe(document, { subtree: true, childList: true });

        // Check periodically for state changes
        setInterval(() => {
          this.updateMobileBoatButtonState();
        }, 1000);
      }

      updateMobileBoatButtonState() {
        if (!this.mobileBoatButton) return;

        const urlParams = new URLSearchParams(window.location.search);
        const boatId = urlParams.get('boatId');
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');
        const hasValidDates = checkin && checkout && checkin !== '' && checkout !== '';

        if (boatId) {
          // Boat is selected
          this.showSelectedBoatState(boatId);
        } else {
          // No boat selected
          this.showAddBoatState(hasValidDates);
        }
      }

      async showSelectedBoatState(boatId) {
        // Hide add image, show X button
        if (this.mobileBoatButtonAddImage) {
          this.mobileBoatButtonAddImage.style.display = 'none';
        }
        if (this.mobileBoatButtonXButton) {
          this.mobileBoatButtonXButton.style.display = 'flex';
        }

        // Reset any disabled styling and apply selected state
        this.mobileBoatButton.style.opacity = '1';
        this.mobileBoatButton.style.cursor = 'pointer';
        this.mobileBoatButton.style.borderColor = '#0074ff';
        this.mobileBoatButton.style.backgroundColor = '#e5f2ff';

        // Force background color update with additional methods
        this.mobileBoatButton.style.setProperty('background-color', '#e5f2ff', 'important');
        this.mobileBoatButton.style.setProperty('border-color', '#0074ff', 'important');

        // Reset opacity for child elements
        if (this.mobileBoatButtonText) {
          this.mobileBoatButtonText.style.opacity = '1';
        }
        if (this.mobileBoatButtonXButton) {
          this.mobileBoatButtonXButton.style.opacity = '1';
        }

        // Get boat name and update text
        try {
          const boatName = await this.getBoatName(boatId);
          if (this.mobileBoatButtonText) {
            this.mobileBoatButtonText.textContent = boatName ? `🛥️ ${boatName}` : 'Boat Rental Selected';
          }
        } catch (error) {
          if (this.mobileBoatButtonText) {
            this.mobileBoatButtonText.textContent = 'Boat Rental Selected';
          }
        }
      }

      showAddBoatState(hasValidDates = true) {
        // Show add image, hide X button
        if (this.mobileBoatButtonAddImage) {
          this.mobileBoatButtonAddImage.style.display = 'flex';
        }
        if (this.mobileBoatButtonXButton) {
          this.mobileBoatButtonXButton.style.display = 'none';
        }

        // Reset styling to default state
        this.mobileBoatButton.style.borderColor = '';
        this.mobileBoatButton.style.backgroundColor = '';

        // Force clear background and border colors
        this.mobileBoatButton.style.removeProperty('background-color');
        this.mobileBoatButton.style.removeProperty('border-color');

        // Apply disabled styling if no valid dates (only to inner elements, keep background white)
        if (!hasValidDates) {
          this.mobileBoatButton.style.cursor = 'not-allowed';
          if (this.mobileBoatButtonAddImage) {
            this.mobileBoatButtonAddImage.style.opacity = '0.5';
          }
          if (this.mobileBoatButtonText) {
            this.mobileBoatButtonText.style.opacity = '0.5';
          }
        } else {
          this.mobileBoatButton.style.cursor = 'pointer';
          if (this.mobileBoatButtonAddImage) {
            this.mobileBoatButtonAddImage.style.opacity = '1';
          }
          if (this.mobileBoatButtonText) {
            this.mobileBoatButtonText.style.opacity = '1';
          }
        }

        // Update text
        if (this.mobileBoatButtonText) {
          this.mobileBoatButtonText.textContent = 'Add Boat Rental';
        }
      }

      async getBoatName(boatId) {
        try {
          // First, try to get boat name from cached data (fastest)
          if (window.selectedBoatData && window.selectedBoatData.id == boatId) {
            return window.selectedBoatData.name;
          }

          // Fallback: fetch from boat service if cache not available
          if (window.boatRentalService) {
            const allBoats = await window.boatRentalService.fetchBoatOptions();
            const boat = allBoats.find(b => b.id == boatId);
            return boat ? boat.name : null;
          }
          return null;
        } catch (error) {
          return null;
        }
      }

      handleMobileBoatButtonClick() {
        const urlParams = new URLSearchParams(window.location.search);
        const boatId = urlParams.get('boatId');

        if (boatId) {
          // Boat is selected, edit it
          this.editSelectedBoat(boatId);
        } else {
          // No boat selected, try to add one
          this.addBoat();
        }
      }

      addBoat() {
        // Check if dates are selected
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout || checkin === '' || checkout === '') {
          this.showMessage('Dates must be selected before adding a boat rental');
          // Flash check availability button if no dates are selected
          if (window.boatRentalService) {
            window.boatRentalService.flashCheckAvailabilityButton();
          }
          return;
        }

        // Check if dates are valid using the existing boat service logic
        if (window.boatRentalService && !window.boatRentalService.areDatesValid()) {
          this.showMessage('Valid dates must be selected to add boat rental');
          return;
        }

        // Open the boat modal
        const boatModal = document.querySelector('[data-element="addBoatModal"]');
        if (boatModal && window.boatRentalService) {
          window.boatRentalService.handleButtonClick();
        }
      }

      async editSelectedBoat(boatId) {
        // Use the existing boat service to edit the selected boat
        if (window.boatRentalService) {
          // FIRST: Set wrapper visibility BEFORE showing modal to prevent flash
          const selectWrapper = document.querySelector('[data-element="addBoatModal_selectBoatWrapper"]');
          const detailsWrapper = document.querySelector('[data-element="addBoatModal_boatDetailsWrapper"]');

          if (selectWrapper) selectWrapper.style.display = 'none';
          if (detailsWrapper) detailsWrapper.style.display = 'flex';

          // THEN: Show the modal (now with correct wrapper already visible)
          window.boatRentalService.modal.style.display = 'flex';
          document.body.classList.add('no-scroll');

          // Finally: Handle the edit which will populate boat details
          await window.boatRentalService.handleEditBoat(boatId);
        }
      }

      handleRemoveBoat() {
        // Remove boat from URL parameters
        const url = new URL(window.location);
        url.searchParams.delete('boatId');
        url.searchParams.delete('boatGuests');
        url.searchParams.delete('boatDates');
        url.searchParams.delete('boatPickupTime');
        url.searchParams.delete('boatLengthType');
        url.searchParams.delete('boatPrivateDock');
        url.searchParams.delete('boatDelivery');

        window.history.pushState({}, '', url);

        // Update boat service state
        if (window.boatRentalService) {
          window.boatRentalService.initializeFromURL();
          window.boatRentalService.updateButtonState();
        }

        // Update pricing displays
        if (window.updatePricingDisplayForExtras) {
          window.updatePricingDisplayForExtras();
        }
        if (window.updateListingOnlyPricing) {
          window.updateListingOnlyPricing();
        }

        // Update mobile button state
        this.updateMobileBoatButtonState();

        // Also trigger global mobile handlers update
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }

      showMessage(message) {
        // Clear any existing message
        if (this.messageTimeout) {
          clearTimeout(this.messageTimeout);
        }

        // Create or get message element
        let messageElement = document.querySelector('.mobile-boat-message');
        if (!messageElement) {
          messageElement = document.createElement('div');
          messageElement.className = 'mobile-boat-message';
          document.body.appendChild(messageElement);

          // Add styles
          const style = document.createElement('style');
          style.textContent = `
            .mobile-boat-message {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #323232;
              color: white;
              padding: 12px 24px;
              border-radius: 5px;
              z-index: 9999;
              display: none;
              font-family: 'TT Fors', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `;
          document.head.appendChild(style);
        }

        // Show message
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // Hide after 3 seconds
        this.messageTimeout = setTimeout(() => {
          messageElement.style.display = 'none';
        }, 3000);
      }
    }

    // Add mobile-specific CSS for button states
    const mobileBoatStyles = document.createElement('style');
    mobileBoatStyles.textContent = `
      @media (max-width: 990px) {
        [data-element="mobileBoatButton"] {
          transition: all 0.2s ease !important;
          cursor: pointer;
        }
        [data-element="mobileBoatButton"]:hover:not([style*="not-allowed"]) {
          opacity: 0.8 !important;
        }
        [data-element="mobileBoatButton_xButton"] {
          z-index: 10;
          cursor: pointer;
        }
        [data-element="mobileBoatButton_xButton"]:hover {
          opacity: 0.7;
        }
        /* Ensure background colors are applied with higher specificity */
        [data-element="mobileBoatButton"][style*="background-color: rgb(229, 242, 255)"],
        [data-element="mobileBoatButton"][style*="background-color:#e5f2ff"] {
          background-color: #e5f2ff !important;
        }
        [data-element="mobileBoatButton"][style*="border-color: rgb(0, 116, 255)"],
        [data-element="mobileBoatButton"][style*="border-color:#0074ff"] {
          border-color: #0074ff !important;
        }
      }
    `;
    document.head.appendChild(mobileBoatStyles);

    // Initialize mobile boat button handler only on mobile (990px or less)
    if (window.innerWidth <= 990) {
      const mobileBoatButtonHandler = new MobileBoatButtonHandler();
      window.mobileBoatButtonHandler = mobileBoatButtonHandler;
    } else {
    }

    // Re-initialize on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 990 && !window.mobileBoatButtonHandler) {
        window.mobileBoatButtonHandler = new MobileBoatButtonHandler();
      }
    });

    // Fishing Charter Service Handler
    class FishingCharterService {
      constructor() {
        this.buttons = document.querySelectorAll('[data-element="addFishingCharterButton"]');
        this.selectedFishingCharterBlocks = document.querySelectorAll('[data-element="selectedFishingCharterBlock"]');
        this.modal = document.querySelector('[data-element="addFishingCharterModal"]');
        this.modalBackground = document.querySelector('[data-element="addFishingCharterModalBackground"]');
        this.selectWrapper = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharterWrapper"]');
        this.detailsWrapper = document.querySelector('[data-element="addFishingCharterModal_FishingCharterDetailsWrapper"]');
        this.exitButton = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_exit"]');
        this.cardTemplate = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card"]');
        this.cardWrapper = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_cardWrapper"]');

        // Flag to prevent URL updates during initialization
        this.isInitializing = false;

        // Filter elements
        this.datesFilter = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_dates"]');
        this.datesText = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_datesText"]');
        this.datesX = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_datesX"]');
        this.datesPopup = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_datesPopup"]');
        this.datesPopupSelectDates = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_datesPopup_selectDates"]');
        this.datesPopupExit = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_datesPopup_exit"]');

        this.guestsFilter = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_guests"]');
        this.guestsText = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_guestsText"]');
        this.guestsX = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_guestsX"]');
        this.guestsPopup = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_guestsPopup"]');
        this.guestsPopupExit = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_guestsPopup_exit"]');
        this.guestMinus = document.querySelector('[data-element="FishingCharter_Guest_Minus"]');
        this.guestNumber = document.querySelector('[data-element="fishingCharterGuest_number"]');
        this.guestPlus = document.querySelector('[data-element="FishingCharter_Guest_Plus"]');
        this.guestsClearButton = document.querySelector('[data-element="fishingCharter_guestsPopup_clearButton"]');

        this.priceFilter = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_price"]');
        this.priceText = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_priceText"]');
        this.priceX = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_priceX"]');
        this.pricePopup = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_pricePopup"]');
        this.pricePopupExit = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_pricePopup_exit"]');
        this.priceScrollBar = document.querySelector('[data-element="fishingCharterFilterModalPrice_scrollBar"]');
        this.priceMinInput = document.querySelector('[data-element="fishingCharterFilterModalPrice_minPriceInput"]');
        this.priceMaxInput = document.querySelector('[data-element="fishingCharterFilterModalPrice_maxPriceInput"]');
        this.priceClearButton = document.querySelector('[data-element="fishingCharter_pricePopup_clearButton"]');

        this.typeFilter = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_type"]');
        this.typeText = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_typeText"]');
        this.typeX = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_typeX"]');
        this.typePopup = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_typePopup"]');
        this.typePopupExit = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_typePopup_exit"]');
        this.typeClearBtn = document.querySelector('[data-element="fishingCharter_typePopup_clearButton"]');

        // Fishing type checkboxes
        this.fishingTypes = {
          inshore: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_inshoreFishingCheckbox"]'),
          offshore: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_offshoreFishingCheckbox"]'),
          near: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_nearFishingCheckbox"]'),
          wreck: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_wreckFishingCheckbox"]'),
          reef: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_reefFishingCheckbox"]'),
          flats: document.querySelector('[data-element="addFishingCharterModal_selectBoat_typePopup_flatsFishingCheckbox"]')
        };

        this.privateDockFilter = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_privateDock"]');
        this.privateDockText = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_privateDockText"]');
        this.privateDockX = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_privateDockX"]');

        // Details section elements
        this.detailsViewTripsButton = document.querySelector('[data-element="fishingCharterDetails_viewTripsButton"]');
        this.detailsContentContainer = document.querySelector('[data-element="fishingCharterDetails_contentContainer"]');
        this.detailsTripTypeContainer = document.querySelector('[data-element="fishingCharterDetails_tripType_container"]');
        this.fishingCharterDetailsXButton = document.querySelector('[data-element="fishingCharterDetails_xButton"]');

        // Details section filters
        this.detailsDatesFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_dates"]');
        this.detailsDatesText = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_datesText"]');
        this.detailsDatesX = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_datesX"]');
        this.detailsDatesPopup = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_datesPopup"]');
        this.detailsDatesPopupSelectDates = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_datesPopup_selectDates"]');
        this.detailsDatesPopupExit = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_datesPopup_exit"]');

        this.detailsGuestsFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guests"]');
        this.detailsGuestsText = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guestsText"]');
        this.detailsGuestsX = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guestsX"]');
        this.detailsGuestsPopup = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guestsPopup"]');
        this.detailsGuestsPopupExit = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guestsPopup_exit"]');
        this.detailsGuestMinus = document.querySelector('[data-element="FishingCharterDetails_Guest_Minus"]');
        this.detailsGuestNumber = document.querySelector('[data-element="fishingCharterDetailsGuest_number"]');
        this.detailsGuestPlus = document.querySelector('[data-element="FishingCharterDetails_Guest_Plus"]');
        this.detailsGuestsClearButton = document.querySelector('[data-element="fishingCharterDetails_guestsPopup_clearButton"]');

        this.detailsPrivateDockFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_privateDock"]');
        this.detailsPrivateDockText = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_privateDockText"]');
        this.detailsPrivateDockX = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_privateDockX"]');

        // Trip type template
        this.tripTypeTemplate = document.querySelector('[data-element="fishingCharterDetails_tripType_card"]');
        this.tripTypeWrapper = this.tripTypeTemplate?.parentElement;

        // State
        this.selectedDates = [];
        this.selectedGuests = 0;
        this.selectedPickupTime = '';
        this.selectedPrivateDock = false;
        this.selectedFishingTypes = [];
        this.priceMin = 0;
        this.priceMax = 5000;
        this.allFishingCharters = [];

        // Details section state
        this.detailsSelectedDates = [];
        this.detailsSelectedGuests = 0;
        this.detailsSelectedPrivateDock = false;

        // Editing state
        this.editingCharterNumber = null;
        this.editingTripId = null;

        // Edit mode tracking - store original params to restore if user cancels
        this.isEditMode = false;
        this.originalEditParams = null;

        // Florida Keys order for proximity sorting
        this.floridaKeysOrder = [
          'Key Largo',
          'Tavernier',
          'Islamorada',
          'Duck Key',
          'Marathon',
          'Summerland Key',
          'Cudjoe Key',
          'Sugarloaf Key',
          'Key West'
        ];

        this.initialize();
      }

      // Close all popups for fishing charter service
      closeAllPopups() {
        // Select wrapper popups
        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';

        // Details wrapper popups
        if (this.detailsDatesPopup) this.detailsDatesPopup.style.display = 'none';
        if (this.detailsGuestsPopup) this.detailsGuestsPopup.style.display = 'none';
      }

      // Helper: Get check-in and check-out dates from URL
      getCheckInOutDates() {
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');
        return { checkin, checkout };
      }

      // Helper: Check if user has selected check-in or check-out date
      hasCheckInOrCheckOutSelected() {
        if (this.selectedDates.length === 0) return false;

        const { checkin, checkout } = this.getCheckInOutDates();
        if (!checkin || !checkout) return false;

        return this.selectedDates.includes(checkin) || this.selectedDates.includes(checkout);
      }

      // Helper: Check if any charter in results offers private dock pickup to property
      anyCharterOffersPrivateDock(charters) {
        if (!charters || charters.length === 0) return false;

        const r = Wized.data.r;
        if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data || !r.Load_Property_Details.data.property) {
          return false;
        }

        // First check if property has a private dock
        const hasPrivateDock = r.Load_Property_Details.data.property.private_dock;
        if (hasPrivateDock === false) {
          return false;
        }

        const propertyNeighborhood = r.Load_Property_Details.data.property.listing_neighborhood;
        if (!propertyNeighborhood) {
          return false;
        }

        return charters.some(charter => {
          if (!charter.privateDockPickup) return false;

          if (!charter.privateDockPickupAreas || !Array.isArray(charter.privateDockPickupAreas)) {
            return false;
          }

          return charter.privateDockPickupAreas.some(area =>
            area.region && area.region.toLowerCase() === propertyNeighborhood.toLowerCase()
          );
        });
      }

      // Show tooltip message near an element
      showTooltipMessage(element, message) {
        // Remove any existing tooltip
        this.hideTooltipMessage();

        const tooltip = document.createElement('div');
        tooltip.className = 'fishing-charter-tooltip';
        tooltip.textContent = message;

        // Get element position
        const rect = element.getBoundingClientRect();

        tooltip.style.cssText = `
          position: fixed;
          background: #323232;
          color: white;
          padding: 8px 12px;
          border-radius: 5px;
          font-size: 13px;
          font-family: 'TT Fors', sans-serif;
          z-index: 10999;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          top: ${rect.bottom + 8}px;
          left: ${rect.left + (rect.width / 2)}px;
          transform: translateX(-50%);
        `;

        document.body.appendChild(tooltip);

        // Auto-hide after 3 seconds
        setTimeout(() => {
          this.hideTooltipMessage();
        }, 3000);

        return tooltip;
      }

      hideTooltipMessage() {
        const existing = document.querySelector('.fishing-charter-tooltip');
        if (existing) {
          existing.remove();
        }
      }

      async getSelectedFishingCharterData() {
        const numbers = (this.getAllFishingCharterNumbers() || []).filter(Boolean);
        const base = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/fishingcharters';
        const selectedTrips = [];
        const urlParams = new URLSearchParams(window.location.search);

        for (const number of numbers) {
          const charterId = urlParams.get(`fishingCharterId${number}`);
          const tripId = urlParams.get(`fishingCharterTripId${number}`);
          const guests = urlParams.get(`fishingCharterGuests${number}`);
          const dates = urlParams.get(`fishingCharterDates${number}`);
          const pickup = urlParams.get(`fishingCharterPickup${number}`);

          if (!charterId) continue;

          try {
            const res = await fetch(`${base}/${charterId}`);

            if (!res.ok) {
              continue;
            }
            const charter = await res.json();

            // Find the selected trip for this numbered group
            const selectedTrip = Array.isArray(charter?.tripOptions)
              ? charter.tripOptions.find(t => String(t?.id) === String(tripId)) || null
              : null;

            const mainImage = charter.images?.find(image => image.order === 1);



            if (selectedTrip) {
              // Format dates for display
              const datesList = dates ? dates.split(',').filter(Boolean) : [];
              let formattedDates = this.formatDatesForDisplay(datesList);

              // Add private dock pickup text if applicable
              if (pickup === 'true' && formattedDates) {
                formattedDates += ' • Private dock pickup';
              }

              // Build the complete trip data object
              const tripData = {
                number: number,
                charterId: charterId,
                tripId: tripId,
                image: mainImage?.image?.url || '',
                tripName: selectedTrip.name || '',
                companyName: charter.name || '',
                dates: formattedDates,
              };

              selectedTrips.push(tripData);
            } else {
            }
          } catch (error) {
            // skip failures
          }
        }

        return selectedTrips;
      }



      // Get reserved dates from other fishing charters (excluding current editing charter)
      getReservedDatesForOtherCharters() {
        const urlParams = new URLSearchParams(window.location.search);
        const allNumbers = this.getAllFishingCharterNumbers();
        const reservedDates = new Set();

        allNumbers.forEach(number => {
          // Skip the charter we're currently editing
          if (this.editingCharterNumber && number === this.editingCharterNumber) {
            return;
          }

          const datesParam = urlParams.get(`fishingCharterDates${number}`);
          if (datesParam) {
            const dates = datesParam.split(',').filter(Boolean);
            dates.forEach(date => reservedDates.add(date));
          }
        });

        return Array.from(reservedDates);
      }

      // Get reserved dates only for THIS specific charter (not other charters)
      // Used in details section to prevent double-booking the same charter on the same date
      getReservedDatesForThisCharter() {
        if (!this.currentCharterData || !this.currentCharterData.id) {
          return [];
        }

        const urlParams = new URLSearchParams(window.location.search);
        const allNumbers = this.getAllFishingCharterNumbers();
        const reservedDates = new Set();
        const currentCharterId = String(this.currentCharterData.id);

        allNumbers.forEach(number => {
          // Skip the charter we're currently editing (if editing)
          if (this.editingCharterNumber && number === this.editingCharterNumber) {
            return;
          }

          const bookedCharterId = urlParams.get(`fishingCharterId${number}`);
          const datesParam = urlParams.get(`fishingCharterDates${number}`);

          // Only get dates if this booking is for the SAME charter we're viewing
          if (bookedCharterId === currentCharterId && datesParam) {
            const dates = datesParam.split(',').filter(Boolean);
            dates.forEach(date => reservedDates.add(date));
          }
        });

        return Array.from(reservedDates);
      }


      // Format dates for display like "May 1, 2, 4" or "May 1, 2 & Jun 1"
      formatDatesForDisplay(datesList) {
        if (!datesList || datesList.length === 0) return '';

        // Helper to get month abbreviation from MM
        const getMonthAbbr = (monthNum) => {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months[monthNum - 1];
        };

        // Group dates by month
        const datesByMonth = {};

        datesList.forEach(dateStr => {
          // dateStr is in format YYYY-MM-DD
          const [year, month, day] = dateStr.split('-').map(Number);
          const monthKey = `${year}-${month}`;
          const monthName = getMonthAbbr(month);

          if (!datesByMonth[monthKey]) {
            datesByMonth[monthKey] = {
              monthName: monthName,
              days: []
            };
          }

          datesByMonth[monthKey].days.push(day);
        });

        // Sort days within each month
        Object.values(datesByMonth).forEach(monthData => {
          monthData.days.sort((a, b) => a - b);
        });

        // Format the result
        const monthKeys = Object.keys(datesByMonth);

        if (monthKeys.length === 1) {
          // Single month: "May 1, 2, 4"
          const monthData = datesByMonth[monthKeys[0]];
          return `${monthData.monthName} ${monthData.days.join(', ')}`;
        } else {
          // Multiple months: "May 1, 2 & Jun 1"
          const monthParts = monthKeys.map(monthKey => {
            const monthData = datesByMonth[monthKey];
            return `${monthData.monthName} ${monthData.days.join(', ')}`;
          });

          // Join with " & " for the last month
          if (monthParts.length === 2) {
            return monthParts.join(' & ');
          } else {
            // For 3+ months, use commas and & for the last one
            const lastMonth = monthParts.pop();
            return monthParts.join(', ') + ' & ' + lastMonth;
          }
        }
      }

      // Populate the selected fishing charter block with data
      async populateSelectedFishingCharterBlock() {
        const selectedTrips = await this.getSelectedFishingCharterData();
        this.renderSelectedFishingCharterBlocks(selectedTrips);
      }

      // Render multiple selected fishing charter blocks
      renderSelectedFishingCharterBlocks(selectedTrips) {
        // Double-check: if no charters exist in URL, hide all blocks and exit
        // This prevents race conditions from async calls
        if (!this.hasAnyFishingCharters()) {
          this.selectedFishingCharterBlocks.forEach(templateBlock => {
            if (!templateBlock) return;

            const container = templateBlock.parentElement;
            if (!container) return;

            // Remove ALL existing blocks including clones
            const existingBlocks = container.querySelectorAll('[data-element="selectedFishingCharterBlock"]');
            existingBlocks.forEach((block, index) => {
              if (index !== 0) {
                // Remove cloned blocks
                block.remove();
              } else {
                // Hide template block
                block.style.display = 'none';
              }
            });
          });
          return;
        }

        // Handle all fishing charter blocks (desktop and mobile)
        this.selectedFishingCharterBlocks.forEach(templateBlock => {
          if (!templateBlock) return;

          const container = templateBlock.parentElement;
          if (!container) return;

          // Remove any existing duplicated blocks (keep the template)
          const existingBlocks = container.querySelectorAll('[data-element="selectedFishingCharterBlock"]');
          existingBlocks.forEach((block, index) => {
            if (index !== 0) { // Keep the template block
              block.remove();
            }
          });

          if (selectedTrips.length === 0) {
            templateBlock.style.display = 'none';
            return;
          }

          // Show and populate blocks for each selected trip
          selectedTrips.forEach((trip, index) => {
            let block;
            if (index === 0) {
              // Use the template block for the first trip
              block = templateBlock;
            } else {
              // Clone the template for additional trips
              block = templateBlock.cloneNode(true);
              container.appendChild(block);
            }

            // Show the block
            block.style.display = 'flex';

            // Populate block with trip data
            this.populateSingleFishingCharterBlock(block, trip);
          });
        });
      }



      // Populate a single fishing charter block with trip data
      populateSingleFishingCharterBlock(block, trip) {
        // Store trip data on the block for removal functionality
        block.tripData = trip;

        // Update selectedFishingCharterBlock_image
        const imageElement = block.querySelector('[data-element="selectedFishingCharterBlock_image"]');
        if (imageElement) {
          if (trip.image) {
            imageElement.src = trip.image;
            // Optimize image loading
            imageElement.loading = 'eager';
            imageElement.fetchPriority = 'high';
            imageElement.style.display = 'block';
          } else {
            imageElement.style.display = 'none';
          }
        }

        // Update selectedFishingCharterBlock_tripName
        const tripNameElement = block.querySelector('[data-element="selectedFishingCharterBlock_tripName"]');
        if (tripNameElement) {
          // Clear any stored full text to use new name
          delete tripNameElement.dataset.fullText;
          tripNameElement.textContent = trip.tripName;
          truncateToFit(tripNameElement);
        }

        // Update selectedFishingCharterBlock_companyName
        const companyNameElement = block.querySelector('[data-element="selectedFishingCharterBlock_companyName"]');
        if (companyNameElement) {
          companyNameElement.textContent = trip.companyName;
        }

        // Update selectedFishingCharterBlock_datesDelivery
        const datesDeliveryElement = block.querySelector('[data-element="selectedFishingCharterBlock_datesDelivery"]');
        if (datesDeliveryElement) {
          datesDeliveryElement.textContent = trip.dates;
        }

        // Setup edit button for this specific block
        const editButton = block.querySelector('[data-element="editSelectedFishingCharter"]');
        if (editButton) {
          // Remove any existing event listeners
          const newEditButton = editButton.cloneNode(true);
          editButton.parentNode.replaceChild(newEditButton, editButton);

          newEditButton.addEventListener('click', () => {
            this.handleEditSpecificFishingCharter(trip);
          });
        }

        // Setup remove button for this specific block
        const removeButton = block.querySelector('[data-element="removeSelectedFishingCharter"]');
        if (removeButton) {
          // Remove any existing event listeners
          const newRemoveButton = removeButton.cloneNode(true);
          removeButton.parentNode.replaceChild(newRemoveButton, removeButton);

          newRemoveButton.addEventListener('click', () => {
            this.handleRemoveSpecificFishingCharter(trip.number);
          });
        }
      }

      // Handle editing a specific fishing charter
      handleEditSpecificFishingCharter(trip) {
        // Store the charter number being edited
        this.editingCharterNumber = trip.number;

        // Get the original dates from URL parameters for this charter
        const urlParams = new URLSearchParams(window.location.search);
        const originalDates = urlParams.get(`fishingCharterDates${trip.number}`);
        const originalGuests = urlParams.get(`fishingCharterGuests${trip.number}`);
        const originalPickup = urlParams.get(`fishingCharterPickup${trip.number}`);
        const originalCharterId = urlParams.get(`fishingCharterId${trip.number}`);
        const originalTripId = urlParams.get(`fishingCharterTripId${trip.number}`);

        // Enter edit mode and store original parameters to restore if user cancels
        this.isEditMode = true;
        this.originalEditParams = {
          charterNumber: trip.number,
          charterId: originalCharterId,
          tripId: originalTripId,
          dates: originalDates,
          guests: originalGuests,
          pickup: originalPickup
        };

        // Set the filter values to match the trip being edited
        this.selectedDates = originalDates ? originalDates.split(',').filter(Boolean) : [];
        this.selectedGuests = originalGuests ? parseInt(originalGuests) : 0;
        this.selectedPickupTime = originalPickup === 'true' ? '' : originalPickup;
        this.selectedPrivateDock = originalPickup === 'true';

        // Also set details section values
        this.detailsSelectedDates = [...this.selectedDates];
        this.detailsSelectedGuests = this.selectedGuests;
        this.detailsSelectedPrivateDock = this.selectedPrivateDock;

        // Show modal directly to details view
        if (this.modal) this.modal.style.display = 'flex';
        this.selectWrapper.style.display = 'none';
        this.detailsWrapper.style.display = 'flex';

        // Scroll details filter container to the left
        const detailsFilterContainer = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_container"]');
        if (detailsFilterContainer) {
          detailsFilterContainer.scrollLeft = 0;
        }

        // Prevent body scroll when modal is open
        document.body.classList.add('no-scroll');

        // Fetch and show the charter details for editing
        this.fetchAndShowCharterForEdit(trip.charterId, trip.tripId);
      }

      // Fetch charter data and show details for editing
      async fetchAndShowCharterForEdit(charterId, tripId) {
        try {
          const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/fishingcharters/${charterId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch charter data');
          }

          const charter = await response.json();

          // Store the trip ID being edited for the handleAddToReservation method
          this.editingTripId = tripId;

          // Show the fishing charter details
          this.showFishingCharterDetails(charter);

        } catch (error) {

          this.closeModal();
        }
      }

      // Handle removing a specific fishing charter by its number
      async handleRemoveSpecificFishingCharter(numberToRemove) {
        const url = new URL(window.location);
        const allNumbers = this.getAllFishingCharterNumbers();

        // Remove the specific numbered parameters
        url.searchParams.delete(`fishingCharterId${numberToRemove}`);
        url.searchParams.delete(`fishingCharterTripId${numberToRemove}`);
        url.searchParams.delete(`fishingCharterGuests${numberToRemove}`);
        url.searchParams.delete(`fishingCharterDates${numberToRemove}`);
        url.searchParams.delete(`fishingCharterPickup${numberToRemove}`);

        // Get remaining numbers (excluding the one we just removed)
        const remainingNumbers = allNumbers.filter(num => num !== numberToRemove).sort((a, b) => a - b);

        if (remainingNumbers.length === 0) {
          // No more fishing charters, hide blocks and show buttons
          this.selectedFishingCharterBlocks.forEach(block => {
            if (block) {
              block.style.display = 'none';
            }
          });

          this.buttons.forEach(button => {
            if (button) {
              button.style.display = 'flex';
            }
          });
        } else {
          // Renumber remaining parameters to be sequential (1, 2, 3, etc.)
          const tempParams = {};

          // Store remaining parameters temporarily
          remainingNumbers.forEach(oldNumber => {
            const charterId = url.searchParams.get(`fishingCharterId${oldNumber}`);
            const tripId = url.searchParams.get(`fishingCharterTripId${oldNumber}`);
            const guests = url.searchParams.get(`fishingCharterGuests${oldNumber}`);
            const dates = url.searchParams.get(`fishingCharterDates${oldNumber}`);
            const pickup = url.searchParams.get(`fishingCharterPickup${oldNumber}`);

            if (charterId) {
              tempParams[oldNumber] = { charterId, tripId, guests, dates, pickup };
            }

            // Remove old numbered parameters
            url.searchParams.delete(`fishingCharterId${oldNumber}`);
            url.searchParams.delete(`fishingCharterTripId${oldNumber}`);
            url.searchParams.delete(`fishingCharterGuests${oldNumber}`);
            url.searchParams.delete(`fishingCharterDates${oldNumber}`);
            url.searchParams.delete(`fishingCharterPickup${oldNumber}`);
          });

          // Re-add parameters with sequential numbering
          Object.values(tempParams).forEach((params, index) => {
            const newNumber = index + 1;
            url.searchParams.set(`fishingCharterId${newNumber}`, params.charterId);
            if (params.tripId) url.searchParams.set(`fishingCharterTripId${newNumber}`, params.tripId);
            if (params.guests) url.searchParams.set(`fishingCharterGuests${newNumber}`, params.guests);
            if (params.dates) url.searchParams.set(`fishingCharterDates${newNumber}`, params.dates);
            if (params.pickup) url.searchParams.set(`fishingCharterPickup${newNumber}`, params.pickup);
          });
        }

        // Update URL
        window.history.pushState({}, '', url);

        // Refresh service state from updated URL
        this.initializeFromURL();

        // Re-render the blocks with updated data (only if charters remain)
        if (remainingNumbers.length > 0) {
          await this.populateSelectedFishingCharterBlock();
        }

        // Update pricing display for extras
        if (window.updatePricingDisplayForExtras) {
          await window.updatePricingDisplayForExtras();
        }

        // Update listing-only pricing display
        if (window.updateListingOnlyPricing) {
          window.updateListingOnlyPricing();
        }

        // Update button state
        this.updateButtonState();

        // Update mobile handlers immediately after charter is removed
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }

      // Helper methods for numbered URL parameters
      getNextFishingCharterNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        let maxNumber = 0;

        // Find the highest existing number
        for (const [key] of urlParams) {
          const match = key.match(/^fishingCharterId(\d+)$/);
          if (match) {
            maxNumber = Math.max(maxNumber, parseInt(match[1]));
          }
        }

        return maxNumber + 1;
      }





      getAllFishingCharterNumbers() {
        const urlParams = new URLSearchParams(window.location.search);
        const numbers = [];

        for (const [key] of urlParams) {
          const match = key.match(/^fishingCharterId(\d+)$/);
          if (match) {
            numbers.push(parseInt(match[1]));
          }
        }

        return numbers.sort((a, b) => a - b);
      }

      hasAnyFishingCharters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for legacy parameters
        const legacyCharterId = urlParams.get('fishingCharterId');
        const legacyTripId = urlParams.get('fishingCharterTripId');

        if (legacyCharterId && legacyTripId) {
          return true;
        }

        // Check for numbered parameters
        return this.getAllFishingCharterNumbers().length > 0;
      }

      // Migrate legacy parameters to numbered system
      migrateLegacyParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const legacyCharterId = urlParams.get('fishingCharterId');
        const legacyTripId = urlParams.get('fishingCharterTripId');

        if (legacyCharterId && legacyTripId) {
          const url = new URL(window.location);

          // Copy legacy parameters to numbered parameters
          url.searchParams.set('fishingCharterId1', legacyCharterId);
          url.searchParams.set('fishingCharterTripId1', legacyTripId);

          const legacyGuests = urlParams.get('fishingCharterGuests');
          if (legacyGuests) {
            url.searchParams.set('fishingCharterGuests1', legacyGuests);
          }

          const legacyDates = urlParams.get('fishingCharterDates');
          if (legacyDates) {
            url.searchParams.set('fishingCharterDates1', legacyDates);
          }

          const legacyPickup = urlParams.get('fishingCharterPickup');
          if (legacyPickup) {
            url.searchParams.set('fishingCharterPickup1', legacyPickup);
          }

          // Remove legacy parameters
          url.searchParams.delete('fishingCharterId');
          url.searchParams.delete('fishingCharterTripId');
          url.searchParams.delete('fishingCharterGuests');
          url.searchParams.delete('fishingCharterDates');
          url.searchParams.delete('fishingCharterPickup');

          window.history.replaceState({}, '', url);
        }
      }

      // Get parameters for the first fishing charter (for backward compatibility)
      getCurrentFishingCharterData() {
        const urlParams = new URLSearchParams(window.location.search);
        const numbers = this.getAllFishingCharterNumbers();

        // Check for legacy (non-numbered) parameters first
        const legacyCharterId = urlParams.get('fishingCharterId');
        const legacyTripId = urlParams.get('fishingCharterTripId');

        if (legacyCharterId && legacyTripId) {
          // Legacy parameters exist, use them
          return {
            charterId: legacyCharterId,
            tripId: legacyTripId,
            guests: urlParams.get('fishingCharterGuests') ? parseInt(urlParams.get('fishingCharterGuests')) : 0,
            dates: urlParams.get('fishingCharterDates') ? urlParams.get('fishingCharterDates').split(',') : [],
            pickup: urlParams.get('fishingCharterPickup') || ''
          };
        }

        if (numbers.length === 0) {
          return {
            charterId: null,
            tripId: null,
            guests: 0,
            dates: [],
            pickup: ''
          };
        }

        // Use the first fishing charter's data for the UI
        const number = numbers[0];
        return {
          charterId: urlParams.get(`fishingCharterId${number}`),
          tripId: urlParams.get(`fishingCharterTripId${number}`),
          guests: urlParams.get(`fishingCharterGuests${number}`) ? parseInt(urlParams.get(`fishingCharterGuests${number}`)) : 0,
          dates: urlParams.get(`fishingCharterDates${number}`) ? urlParams.get(`fishingCharterDates${number}`).split(',') : [],
          pickup: urlParams.get(`fishingCharterPickup${number}`) || ''
        };
      }

      initialize() {
        if (!this.buttons || this.buttons.length === 0 || !this.modal || !this.selectWrapper || !this.detailsWrapper || !this.exitButton || !this.cardTemplate || !this.cardWrapper) {

          return;
        }

        // Set flag to prevent URL updates during initialization
        this.isInitializing = true;

        // Set initial styles
        this.modal.style.display = 'none';
        this.detailsWrapper.style.display = 'none';
        this.cardTemplate.style.display = 'none';
        if (this.tripTypeTemplate) this.tripTypeTemplate.style.display = 'none';

        // Add CSS to ensure fishing charter button stays at bottom
        const fishingCharterButtonStyles = document.createElement('style');
        fishingCharterButtonStyles.textContent = `
          [data-element="addFishingCharterButton"] {
            order: 999 !important;
            margin-top: auto !important;
            display: flex !important;
          }
          [data-element="addBoatButton"] {
            order: 998 !important;
          }
        `;
        document.head.appendChild(fishingCharterButtonStyles);

        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';

        // Hide details section popups
        if (this.detailsDatesPopup) this.detailsDatesPopup.style.display = 'none';
        if (this.detailsGuestsPopup) this.detailsGuestsPopup.style.display = 'none';

        // Hide private dock filters initially (will show when appropriate)
        if (this.privateDockFilter) this.privateDockFilter.style.display = 'none';
        if (this.detailsPrivateDockFilter) this.detailsPrivateDockFilter.style.display = 'none';

        // Add click handlers for all buttons
        this.buttons.forEach(button => {
          if (button) {
            button.addEventListener('click', () => this.handleButtonClick());
          }
        });
        this.exitButton.addEventListener('click', () => this.closeModal());

        // Fishing charter details X button handler
        if (this.fishingCharterDetailsXButton) {
          this.fishingCharterDetailsXButton.addEventListener('click', () => this.closeModal());
        }

        // Note: Button state is now handled by centralized updateFishingCharterButtonState function

        // Listen for URL changes (handled by centralized system)
        window.addEventListener('popstate', () => {
          // Button state updates are handled by centralized system
        });

        // Monitor URL parameter changes for checkin/checkout dates
        this.setupDateParameterMonitoring();

        // Modal background click handler
        if (this.modalBackground) {
          this.modalBackground.addEventListener('click', () => {
            this.closeModal();
          });
        }

        // Filter handlers
        this.setupFilterHandlers();
        this.setupGuestButtons();
        this.setupPriceFilter();
        this.setupFishingTypeFilter();

        // Setup X button handlers
        this.setupFilterXButtons();

        // Setup details section handlers
        this.setupDetailsFilterHandlers();
        this.setupDetailsGuestButtons();
        this.setupDetailsFilterXButtons();
        this.setupViewTripsButton();

        // Initialize from URL parameters
        this.initializeFromURL();

        // Update button state
        this.updateButtonState();

        // Only populate fishing charter blocks if charters exist
        if (this.hasAnyFishingCharters()) {
          const charterResult = this.populateSelectedFishingCharterBlock();
          if (charterResult && typeof charterResult.catch === 'function') {
            charterResult.catch(err => console.error('Error populating fishing charter block:', err));
          }

          // Update pricing display if any fishing charters are selected
          if (window.updatePricingDisplayForExtras) {
            const pricingResult = window.updatePricingDisplayForExtras();
            if (pricingResult && typeof pricingResult.catch === 'function') {
              pricingResult.catch(err => console.error('Error updating pricing:', err));
            }
          }
        }
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check if any fishing charters exist using numbered parameters
        const hasCharters = this.hasAnyFishingCharters();

        const allNumbers = this.getAllFishingCharterNumbers();


        // Always keep all buttons visible at the bottom
        this.buttons.forEach(button => {
          if (button) {
            button.style.display = 'flex';
          }
        });

        if (hasCharters) {
          this.selectedFishingCharterBlocks.forEach(block => {
            if (block) {
              block.style.display = 'flex';
            }
          });
        } else {
          this.selectedFishingCharterBlocks.forEach(templateBlock => {
            if (!templateBlock) return;

            const container = templateBlock.parentElement;
            if (!container) {
              templateBlock.style.display = 'none';
              return;
            }

            // Remove ALL existing cloned blocks
            const existingBlocks = container.querySelectorAll('[data-element="selectedFishingCharterBlock"]');
            existingBlocks.forEach((block, index) => {
              if (index !== 0) {
                // Remove cloned blocks
                block.remove();
              } else {
                // Hide template block
                block.style.display = 'none';
              }
            });
          });

          // If no charters exist and not editing, clear all filter states
          if (!this.editingCharterNumber) {
            this.selectedGuests = 0;
            this.selectedDates = [];
            this.selectedPickupTime = '';
            this.selectedPrivateDock = false;
            this.selectedFishingTypes = [];
            this.priceMin = 0;
            this.priceMax = 5000;

            // Also clear details section state
            this.detailsSelectedDates = [];
            this.detailsSelectedGuests = 0;
            this.detailsSelectedPrivateDock = false;
          }
        }

        // Only load existing charter data if we're editing (not adding new)
        if (this.editingCharterNumber) {
          // Get current fishing charter data (from first charter for UI compatibility)
          const currentData = this.getCurrentFishingCharterData();

          // Set guests
          this.selectedGuests = currentData.guests;
          if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
          this.updateGuestsFilterText();

          // Set dates
          this.selectedDates = currentData.dates;

          // Set pickup
          this.selectedPickupTime = currentData.pickup;
        } else if (!hasCharters) {
          // Clear all filters when adding a new charter (not editing) and no charters exist
          this.selectedGuests = 0;
          this.selectedDates = [];
          this.selectedPickupTime = '';
          this.selectedPrivateDock = false;
          this.selectedFishingTypes = [];
          this.priceMin = 0;
          this.priceMax = 5000;

          // Update UI elements to reflect cleared state
          if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
          if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
          this.updateGuestsFilterText();
          this.updateDatesFilterText();
          this.updatePrivateDockFilterText();
          this.updateFishingTypeFilterText();
          this.updatePriceFilterText();
          this.updateDetailsDateFilterText();
          this.updateDetailsGuestsFilterText();
          this.updateDetailsPrivateDockFilterText();

          // Reset checkbox styles for fishing types
          Object.values(this.fishingTypes).forEach(checkbox => {
            if (checkbox) {
              checkbox.style.backgroundColor = '';
            }
          });

          // Reset price slider UI if it exists
          if (this.priceScrollBar) {
            const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
            const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
            if (sliderMin) sliderMin.value = 0;
            if (sliderMax) sliderMax.value = 5000;
          }
        }

        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.renderDateSelection();
        this.updatePrivateDockFilterText();

        // Clear initialization flag to allow URL updates
        this.isInitializing = false;
      }

      setupFilterHandlers() {
        const closeAllPopups = () => {
          if (this.datesPopup) this.datesPopup.style.display = 'none';
          if (this.guestsPopup) this.guestsPopup.style.display = 'none';
          if (this.pricePopup) this.pricePopup.style.display = 'none';
          if (this.typePopup) this.typePopup.style.display = 'none';
        };

        // Dates filter handlers
        if (this.datesFilter) {
          this.datesFilter.addEventListener('click', () => {
            closeAllPopups();
            if (this.datesPopup) this.datesPopup.style.display = 'flex';
          });
        }

        if (this.datesPopupExit) {
          this.datesPopupExit.addEventListener('click', () => {
            if (this.datesPopup) this.datesPopup.style.display = 'none';
          });
        }

        // Guests filter handlers
        if (this.guestsFilter) {
          this.guestsFilter.addEventListener('click', () => {
            closeAllPopups();
            if (this.guestsPopup) this.guestsPopup.style.display = 'flex';
          });
        }

        if (this.guestsPopupExit) {
          this.guestsPopupExit.addEventListener('click', () => {
            if (this.guestsPopup) this.guestsPopup.style.display = 'none';
          });
        }

        // Price filter handlers
        if (this.priceFilter) {
          this.priceFilter.addEventListener('click', () => {
            closeAllPopups();
            if (this.pricePopup) this.pricePopup.style.display = 'flex';
          });
        }

        if (this.pricePopupExit) {
          this.pricePopupExit.addEventListener('click', () => {
            if (this.pricePopup) this.pricePopup.style.display = 'none';
          });
        }

        // Type filter handlers
        if (this.typeFilter) {
          this.typeFilter.addEventListener('click', () => {
            closeAllPopups();
            if (this.typePopup) this.typePopup.style.display = 'flex';
          });
        }

        if (this.typePopupExit) {
          this.typePopupExit.addEventListener('click', () => {
            if (this.typePopup) this.typePopup.style.display = 'none';
          });
        }

        // Private dock filter
        if (this.privateDockFilter) {
          this.privateDockFilter.addEventListener('click', () => {
            // Check if disabled
            if (this.privateDockFilter.hasAttribute('data-disabled')) {
              this.showTooltipMessage(this.privateDockFilter, 'Not available on check-in/departure dates');
              return;
            }

            this.selectedPrivateDock = !this.selectedPrivateDock;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.renderDateSelection(); // Re-render dates to show disabled check-in/out if private dock selected
            // this.updateURLParams();
            this.refilterChartersIfModalOpen();
          });

          // Show tooltip on hover when disabled
          this.privateDockFilter.addEventListener('mouseenter', () => {
            if (this.privateDockFilter.hasAttribute('data-disabled')) {
              this.showTooltipMessage(this.privateDockFilter, 'Not available on check-in/departure dates');
            }
          });

          this.privateDockFilter.addEventListener('mouseleave', () => {
            if (this.privateDockFilter.hasAttribute('data-disabled')) {
              this.hideTooltipMessage();
            }
          });
        }
      }

      setupGuestButtons() {
        if (!this.guestMinus || !this.guestPlus) return;

        // Style and setup minus button (matching boat rental style)
        this.guestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleFishingCharterGuestButton(this.guestMinus);

        // Style and setup plus button (matching boat rental style)
        this.guestPlus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleFishingCharterGuestButton(this.guestPlus);

        // Add event listeners
        this.guestMinus.addEventListener('click', () => {
          if (this.selectedGuests > 0) {
            this.selectedGuests--;
            if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
            this.updateGuestsFilterText();
            this.updateFilterStyles();
            // this.updateURLParams();
            this.refilterChartersIfModalOpen();
          }
        });

        this.guestPlus.addEventListener('click', () => {
          this.selectedGuests++;
          if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
          this.updateGuestsFilterText();
          this.updateFilterStyles();
          // this.updateURLParams();
          this.refilterChartersIfModalOpen();
        });

        if (this.guestsClearButton) {
          this.guestsClearButton.addEventListener('click', () => {
            this.clearGuestsFilter();
          });
        }
      }

      styleFishingCharterGuestButton(button) {
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '32px';
        button.style.height = '32px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.borderRadius = '50%';
        button.style.transition = 'background-color 0.2s ease';

        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = 'whitesmoke';
        });

        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = '';
        });
      }

      setupPriceFilter() {
        if (!this.priceScrollBar) return;

        const maxPrice = 5000;

        // Create range slider with larger touch targets for mobile
        this.priceScrollBar.innerHTML = `
          <div class="price-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
            <div class="price-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
            <div class="price-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
            <input type="range" class="price-slider-min" min="0" max="${maxPrice}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <input type="range" class="price-slider-max" min="0" max="${maxPrice}" value="${maxPrice}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <div class="price-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <div class="price-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: white; border: 2px solid #000; border-radius: 50%; cursor: pointer; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
          </div>
        `;

        const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
        const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
        const range = this.priceScrollBar.querySelector('.price-slider-range');
        const thumbMin = this.priceScrollBar.querySelector('.price-slider-thumb-min');
        const thumbMax = this.priceScrollBar.querySelector('.price-slider-thumb-max');
        const container = this.priceScrollBar.querySelector('.price-slider-container');

        let isDraggingMin = false;
        let isDraggingMax = false;
        let startX = 0;
        let startLeft = 0;

        const updateSlider = () => {
          const minVal = parseInt(sliderMin.value);
          const maxVal = parseInt(sliderMax.value);
          const minPercent = (minVal / maxPrice) * 100;
          const maxPercent = (maxVal / maxPrice) * 100;

          range.style.left = minPercent + '%';
          range.style.width = (maxPercent - minPercent) + '%';
          thumbMin.style.left = minPercent + '%';
          thumbMax.style.left = maxPercent + '%';

          // Update state
          this.priceMin = minVal;
          this.priceMax = maxVal;

          // Update inputs
          if (this.priceMinInput) this.priceMinInput.value = '$' + minVal.toLocaleString();
          if (this.priceMaxInput) this.priceMaxInput.value = maxVal >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + maxVal.toLocaleString();

          // Update filter text and styles
          this.updatePriceFilterText();
          this.updateFilterStyles();
          // this.updateURLParams();
          this.refilterChartersIfModalOpen();
        };

        const handleDragStart = (e, isMin) => {
          // Handle both mouse events and touch objects
          if (e.preventDefault) {
            e.preventDefault();
          }

          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);

          if (isMin) {
            isDraggingMin = true;
            startX = clientX;
            startLeft = parseInt(sliderMin.value);
          } else {
            isDraggingMax = true;
            startX = clientX;
            startLeft = parseInt(sliderMax.value);
          }
        };

        const handleDragMove = (e) => {
          if (!isDraggingMin && !isDraggingMax) return;

          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const clientX = e.clientX || e.clientX === 0 ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
          const moveX = clientX - startX;
          const movePercent = (moveX / containerWidth) * 100;
          const moveValue = Math.round((movePercent / 100) * maxPrice);

          if (isDraggingMin) {
            let newValue = Math.max(0, Math.min(startLeft + moveValue, parseInt(sliderMax.value)));
            sliderMin.value = newValue;
          } else if (isDraggingMax) {
            let newValue = Math.max(parseInt(sliderMin.value), Math.min(startLeft + moveValue, maxPrice));
            sliderMax.value = newValue;
          }

          updateSlider();
        };

        const handleDragEnd = () => {
          isDraggingMin = false;
          isDraggingMax = false;
        };

        // Add mouse event listeners for dragging
        thumbMin.addEventListener('mousedown', (e) => handleDragStart(e, true));
        thumbMax.addEventListener('mousedown', (e) => handleDragStart(e, false));
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        // Add touch event listeners for mobile with proper event handling
        thumbMin.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], true);
        });

        thumbMin.addEventListener('touchmove', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMin.addEventListener('touchend', (e) => {
          if (isDraggingMin) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        thumbMax.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleDragStart(e.touches[0], false);
        });

        thumbMax.addEventListener('touchmove', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0]);
          }
        }, { passive: false });

        thumbMax.addEventListener('touchend', (e) => {
          if (isDraggingMax) {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }
        });

        // Input event listeners
        sliderMin?.addEventListener('input', () => {
          if (parseInt(sliderMin.value) > parseInt(sliderMax.value)) {
            sliderMin.value = sliderMax.value;
          }
          updateSlider();
        });

        sliderMax?.addEventListener('input', () => {
          if (parseInt(sliderMax.value) < parseInt(sliderMin.value)) {
            sliderMax.value = sliderMin.value;
          }
          updateSlider();
        });

        // Input field formatting
        this.priceMinInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[$,+]/g, '');
        });

        this.priceMinInput?.addEventListener('blur', () => {
          const val = parseInt(this.priceMinInput.value) || 0;
          this.priceMinInput.value = '$' + val.toLocaleString();
          if (sliderMin) {
            sliderMin.value = val;
            updateSlider();
          }
        });

        this.priceMaxInput?.addEventListener('focus', function () {
          this.value = this.value.replace(/[$,+]/g, '');
        });

        this.priceMaxInput?.addEventListener('blur', () => {
          let val = parseInt(this.priceMaxInput.value) || maxPrice;
          if (val > maxPrice) val = maxPrice;
          this.priceMaxInput.value = val >= maxPrice ? `$${maxPrice.toLocaleString()}+` : '$' + val.toLocaleString();
          if (sliderMax) {
            sliderMax.value = val;
            updateSlider();
          }
        });

        if (this.priceClearButton) {
          this.priceClearButton.addEventListener('click', () => {
            this.clearPriceFilter();
          });
        }

        // Set initial values
        if (this.priceMinInput) this.priceMinInput.value = '$0';
        if (this.priceMaxInput) this.priceMaxInput.value = `$${maxPrice.toLocaleString()}+`;

        updateSlider();
      }

      setupFishingTypeFilter() {
        Object.entries(this.fishingTypes).forEach(([type, checkbox]) => {
          if (checkbox) {
            // Set initial checkbox state based on selected fishing types
            if (this.selectedFishingTypes.includes(type)) {
              checkbox.style.backgroundColor = '#000000';
            }

            checkbox.addEventListener('click', () => {
              const isChecked = this.selectedFishingTypes.includes(type);
              if (isChecked) {
                // Deselect - remove from array
                this.selectedFishingTypes = this.selectedFishingTypes.filter(t => t !== type);
                checkbox.style.backgroundColor = '';
              } else {
                // Select - add to array
                this.selectedFishingTypes.push(type);
                checkbox.style.backgroundColor = '#000000';
              }
              this.updateFishingTypeFilterText();
              this.updateFilterStyles();
              // this.updateURLParams();
              this.refilterChartersIfModalOpen();
            });
          }
        });

        // Setup clear button
        if (this.typeClearBtn) {
          this.typeClearBtn.addEventListener('click', () => {
            this.clearFishingTypeFilter();
          });
        }

        // Initialize filter text
        this.updateFishingTypeFilterText();
      }

      setupFilterXButtons() {
        if (this.datesX) {
          this.datesX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDatesFilter();
          });
        }

        if (this.guestsX) {
          this.guestsX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearGuestsFilter();
          });
        }

        if (this.priceX) {
          this.priceX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearPriceFilter();
          });
        }

        if (this.typeX) {
          this.typeX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearFishingTypeFilter();
          });
        }

        if (this.privateDockX) {
          this.privateDockX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearPrivateDockFilter();
          });
        }
      }

      async handleButtonClick() {
        try {
          // Check if dates are valid (selected AND meet validation criteria)
          if (!this.areDatesValid()) {
            const urlParams = new URLSearchParams(window.location.search);
            const hasDates = urlParams.has('checkin') && urlParams.has('checkout') &&
              urlParams.get('checkin') !== '' && urlParams.get('checkout') !== '';

            const message = hasDates
              ? 'Valid dates must be selected to add fishing charter'
              : 'Dates must be selected to add fishing charter';

            this.showMessage(message);

            // Flash check availability button if no dates are selected
            if (!hasDates) {
              this.flashCheckAvailabilityButton();
            }

            return;
          }

          // Close all popups when modal opens
          this.closeAllPopups();

          // Clear editing state when adding new charter (not editing existing one)
          this.editingCharterNumber = null;
          this.editingTripId = null;

          // Clear all filters when adding a new charter (not editing)
          this.selectedGuests = 0;
          this.selectedDates = [];
          this.selectedPickupTime = '';
          this.selectedPrivateDock = false;
          this.selectedFishingTypes = [];
          this.priceMin = 0;
          this.priceMax = 5000;

          // Update UI elements to reflect cleared state
          if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
          this.updateGuestsFilterText();
          this.updateDatesFilterText();
          this.updatePrivateDockFilterText();
          this.updateFishingTypeFilterText();
          this.updatePriceFilterText();

          // Reset checkbox styles for fishing types
          Object.values(this.fishingTypes).forEach(checkbox => {
            if (checkbox) {
              checkbox.style.backgroundColor = '';
            }
          });

          // Reset price slider UI if it exists
          if (this.priceScrollBar) {
            const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
            const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
            if (sliderMin) sliderMin.value = 0;
            if (sliderMax) sliderMax.value = 5000;
          }

          // Update filter styles
          this.updateFilterStyles();

          // Show modal
          this.modal.style.display = 'flex';
          this.selectWrapper.style.display = 'flex';
          this.detailsWrapper.style.display = 'none';

          // Scroll filter container to the left
          const selectFilterContainer = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_container"]');
          if (selectFilterContainer) {
            selectFilterContainer.scrollLeft = 0;
          }

          // Prevent body scroll when modal is open
          document.body.classList.add('no-scroll');

          // Fetch and render fishing charters
          await this.fetchAndRenderFishingCharters();
        } catch (error) {

        }
      }

      areDatesValid() {
        // Check if dates exist in URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout || checkin === '' || checkout === '') {
          return false;
        }

        // Get calendar data from Wized (with fallback)
        const r = Wized.data.r || {};

        // Check if we have calendar data and property details
        if (!r.Load_Property_Calendar_Query ||
          !r.Load_Property_Calendar_Query.data ||
          !r.Load_Property_Details ||
          !r.Load_Property_Details.data) {
          return false;
        }

        const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
        const minNights = r.Load_Property_Details.data.property.min_nights;

        let allAvailable = true;
        let consecutiveAvailableDays = 0;
        let meetsMinNights = false;

        // Check each day in the range
        for (let i = 0; i < propertyCalendarRange.length; i++) {
          if (propertyCalendarRange[i].status === "available") {
            consecutiveAvailableDays++;
            if (consecutiveAvailableDays >= minNights) {
              meetsMinNights = true;
            }
          } else {
            consecutiveAvailableDays = 0;
            allAvailable = false;
          }
        }

        const result = allAvailable && meetsMinNights;

        // Return true only if all days are available AND minimum nights requirement is met
        return result;
      }

      closeModal(skipStyleUpdates = false) {
        // Close all popups first
        this.closeAllPopups();

        if (this.modal) this.modal.style.display = 'none';

        // Restore details popups to original parents (mobile fix)
        if (this.detailsDatesPopup && this.detailsDatesPopup._originalParent) {
          this.detailsDatesPopup._originalParent.appendChild(this.detailsDatesPopup);
        }
        if (this.detailsGuestsPopup && this.detailsGuestsPopup._originalParent) {
          this.detailsGuestsPopup._originalParent.appendChild(this.detailsGuestsPopup);
        }

        // If we were in edit mode and user cancelled, restore original URL params
        if (this.isEditMode && this.originalEditParams) {
          const url = new URL(window.location);
          const num = this.originalEditParams.charterNumber;

          // Restore all original parameters for this charter
          if (this.originalEditParams.charterId) {
            url.searchParams.set(`fishingCharterId${num}`, this.originalEditParams.charterId);
          }
          if (this.originalEditParams.tripId) {
            url.searchParams.set(`fishingCharterTripId${num}`, this.originalEditParams.tripId);
          }
          if (this.originalEditParams.dates) {
            url.searchParams.set(`fishingCharterDates${num}`, this.originalEditParams.dates);
          }
          if (this.originalEditParams.guests) {
            url.searchParams.set(`fishingCharterGuests${num}`, this.originalEditParams.guests);
          }
          if (this.originalEditParams.pickup) {
            url.searchParams.set(`fishingCharterPickup${num}`, this.originalEditParams.pickup);
          }

          window.history.replaceState({}, '', url);
        }

        // Reset editing state when modal is closed
        this.editingCharterNumber = null;
        this.editingTripId = null;
        this.isEditMode = false;
        this.originalEditParams = null;

        // Skip filter clearing and style updates if closing after successful save
        // (they will be handled separately after modal is closed)
        if (!skipStyleUpdates) {
          // Clear all filters when modal is closed (for next time it's opened)
          this.selectedGuests = 0;
          this.selectedDates = [];
          this.selectedPickupTime = '';
          this.selectedPrivateDock = false;
          this.selectedFishingTypes = [];
          this.priceMin = 0;
          this.priceMax = 5000;

          // Clear details section filters as well
          this.detailsSelectedDates = [];
          this.detailsSelectedGuests = 0;
          this.detailsSelectedPrivateDock = false;

          // Update UI elements to reflect cleared state
          if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
          if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
          this.updateGuestsFilterText();
          this.updateDatesFilterText();
          this.updatePrivateDockFilterText();
          this.updateFishingTypeFilterText();
          this.updatePriceFilterText();
          this.updateDetailsGuestsFilterText();
          this.updateDetailsDateFilterText();
          this.updateDetailsPrivateDockFilterText();

          // Reset checkbox styles for fishing types
          Object.values(this.fishingTypes).forEach(checkbox => {
            if (checkbox) {
              checkbox.style.backgroundColor = '';
            }
          });

          // Reset price slider UI if it exists
          if (this.priceScrollBar) {
            const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
            const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
            if (sliderMin) sliderMin.value = 0;
            if (sliderMax) sliderMax.value = 5000;
          }

          // Update filter styles
          this.updateFilterStyles();
          this.updateDetailsFilterStyles();
        }

        // Re-enable body scroll
        document.body.classList.remove('no-scroll');
      }

      resetModalState() {
        // Clear all filter state
        this.selectedDates = [];
        this.selectedGuests = 0;
        this.selectedPickupTime = '';
        this.selectedPrivateDock = false;
        this.selectedFishingTypes = [];
        this.priceMin = 0;
        this.priceMax = 5000;

        // Clear details section state
        this.detailsSelectedDates = [];
        this.detailsSelectedGuests = 0;
        this.detailsSelectedPrivateDock = false;

        // Reset editing state
        this.editingCharterNumber = null;
        this.editingTripId = null;

        // Update guest number displays
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;

        // Update all filter texts
        this.updateGuestsFilterText();
        this.updateDatesFilterText();
        this.updatePrivateDockFilterText();
        this.updateFishingTypeFilterText();
        this.updatePriceFilterText();
        this.updateDetailsGuestsFilterText();
        this.updateDetailsDateFilterText();
        this.updateDetailsPrivateDockFilterText();

        // Reset checkbox styles for fishing types
        Object.values(this.fishingTypes).forEach(checkbox => {
          if (checkbox) {
            checkbox.style.backgroundColor = '';
          }
        });

        // Reset price slider UI if it exists
        if (this.priceScrollBar) {
          const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
          const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = 5000;
        }

        // Update filter styles
        this.updateFilterStyles();
        this.updateDetailsFilterStyles();

        // Reset date button styles
        this.updateDateButtonStyles();
        this.updateDetailsDateButtonStyles();

        // Re-render date selections
        this.renderDateSelection();
        this.renderDetailsDateSelection();
      }

      showSkeletonCards() {
        if (!this.cardWrapper) return;

        // Hide all existing cards (including template)
        const existingCards = this.cardWrapper.querySelectorAll('[data-element="addFishingCharterModal_selectFishingCharter_card"]');
        existingCards.forEach(card => {
          card.style.display = 'none';
        });

        // Remove any old skeleton cards
        const oldSkeletons = this.cardWrapper.querySelectorAll('[data-skeleton="true"]');
        oldSkeletons.forEach(skeleton => skeleton.remove());

        // Hide any no results message
        const noResultsMessage = this.cardWrapper.querySelector('.no-results-message');
        if (noResultsMessage) noResultsMessage.style.display = 'none';

        // Create 6 skeleton cards
        for (let i = 0; i < 6; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'skeleton-card-charter';
          skeleton.setAttribute('data-skeleton', 'true');
          skeleton.innerHTML = `
            <div class="skeleton-image-charter"></div>
            <div class="skeleton-content-charter">
              <div class="skeleton-line-charter skeleton-title-charter"></div>
              <div class="skeleton-line-charter skeleton-subtitle-charter"></div>
              <div class="skeleton-line-charter skeleton-price-charter"></div>
            </div>
          `;
          this.cardWrapper.appendChild(skeleton);
        }

        // Add styles if not already added
        if (!document.getElementById('charter-skeleton-styles')) {
          const style = document.createElement('style');
          style.id = 'charter-skeleton-styles';
          style.textContent = `
            .skeleton-card-charter {
              width: 31.5%;
              height: 360px;
              background: #f9f9f9;
              border-radius: 5px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              background-clip: padding-box;
            }
            
            @media (max-width: 990px) {
              .skeleton-card-charter {
                width: 100%;
              }
            }
            
            .skeleton-image-charter {
              width: 100%;
              height: 220px;
              background: linear-gradient(to right, #f9f9f9 25%, #f0f0f0 50%, #f9f9f9 75%);
              background-size: 200% 100%;
              animation: skeleton-loading-charter 1s infinite linear;
            }
            
            .skeleton-content-charter {
              padding: 16px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .skeleton-line-charter {
              height: 16px;
              background: linear-gradient(to right, #f9f9f9 25%, #f0f0f0 50%, #f9f9f9 75%);
              background-size: 200% 100%;
              animation: skeleton-loading-charter 1s infinite linear;
              border-radius: 5px;
              background-clip: padding-box;
            }
            
            .skeleton-title-charter {
              width: 80%;
              height: 20px;
            }
            
            .skeleton-subtitle-charter {
              width: 60%;
            }
            
            .skeleton-price-charter {
              width: 40%;
              margin-top: auto;
            }
            
            @keyframes skeleton-loading-charter {
              0% {
                background-position: -100% 0;
              }
              100% {
                background-position: 100% 0;
              }
            }
          `;
          document.head.appendChild(style);
        }
      }

      hideSkeletonCards() {
        if (!this.cardWrapper) return;

        // Remove all skeleton cards
        const skeletons = this.cardWrapper.querySelectorAll('[data-skeleton="true"]');
        skeletons.forEach(skeleton => skeleton.remove());
      }

      async fetchAndRenderFishingCharters() {
        try {
          // Show skeleton cards while loading
          this.showSkeletonCards();

          // Fetch all fishing charter options
          const allCharters = await this.fetchFishingCharterOptions();
          this.allFishingCharters = allCharters;

          // Filter charters based on current filters
          const filteredCharters = this.filterFishingCharters(allCharters);

          // Update private dock filter visibility based on whether any charter offers it
          this.updatePrivateDockFilterVisibility(filteredCharters);

          // Hide skeleton cards
          this.hideSkeletonCards();

          // Render the filtered charters
          this.renderFishingCharterCards(filteredCharters);

          return filteredCharters;
        } catch (error) {
          // Hide skeleton cards on error too
          this.hideSkeletonCards();
          this.renderFishingCharterCards([]);
          return [];
        }
      }

      // Update private dock filter visibility based on available charters
      updatePrivateDockFilterVisibility(charters) {
        if (!this.privateDockFilter) return;

        const anyOffersPrivateDock = this.anyCharterOffersPrivateDock(charters);

        if (anyOffersPrivateDock) {
          this.privateDockFilter.style.display = 'flex';
          // Also update availability based on selected dates
          this.updatePrivateDockFilterAvailability();
        } else {
          this.privateDockFilter.style.display = 'none';
          // If it was selected, deselect it
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
          }
        }
      }

      async fetchFishingCharterOptions() {
        try {
          // Make API call to fishing charter endpoint
          const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/fishingCharterResults', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch fishing charter options');
          }

          const data = await response.json();

          // Sort by proximity to listing city
          const sortedCharters = this.sortChartersByProximity(data);

          return sortedCharters;
        } catch (error) {

          return [];
        }
      }

      sortChartersByProximity(charters) {
        // Get listing city from property data
        let listingCity = '';
        try {
          if (window.Wized && window.Wized.data && window.Wized.data.r &&
            window.Wized.data.r.Load_Property_Details &&
            window.Wized.data.r.Load_Property_Details.data &&
            window.Wized.data.r.Load_Property_Details.data.property) {
            listingCity = window.Wized.data.r.Load_Property_Details.data.property.listing_city || '';
          }
        } catch (error) {

        }

        return charters.sort((a, b) => {
          const cityA = a.city || '';
          const cityB = b.city || '';

          // If one matches the listing city exactly, prioritize it
          if (cityA.toLowerCase() === listingCity.toLowerCase()) return -1;
          if (cityB.toLowerCase() === listingCity.toLowerCase()) return 1;

          // Otherwise sort by Florida Keys order
          const indexA = this.floridaKeysOrder.findIndex(key =>
            cityA.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cityA.toLowerCase())
          );
          const indexB = this.floridaKeysOrder.findIndex(key =>
            cityB.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cityB.toLowerCase())
          );

          // If both cities are in the Keys order, sort by that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }

          // If only one is in the Keys order, prioritize it
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;

          // Otherwise, alphabetical order
          return cityA.localeCompare(cityB);
        });
      }

      filterFishingCharters(charters) {
        return charters.filter(charter => {
          // Guest filter
          if (this.selectedGuests > 0) {
            const maxCapacity = charter.boatInfo && charter.boatInfo[0] ? charter.boatInfo[0].boatCapacity : 0;
            if (maxCapacity < this.selectedGuests) return false;
          }

          // Filter charters based on available trips that match all filters
          if (charter.tripOptions && charter.tripOptions.length > 0) {
            // Get filtered trips to check if any exist
            const filteredTrips = this.getFilteredTripOptions(charter);

            // If no trips match the date/fishing type filters, exclude charter completely
            if (filteredTrips.length === 0) return false;

            // Check if any filtered trip fits the price range
            const hasValidPricedTrip = filteredTrips.some(trip => {
              if (!trip.price) return false;

              // Calculate actual price for this trip based on guest count
              let actualPrice = trip.price;
              const basePeople = trip.pricePeople || 1;
              const additionalPersonRate = trip.pricePerAdditionalPerson || 0;

              // If we have selected guests and they exceed the base people count
              if (this.selectedGuests > basePeople && additionalPersonRate > 0) {
                const additionalPeople = this.selectedGuests - basePeople;
                actualPrice += (additionalPeople * additionalPersonRate);
              }

              // Add private dock pickup fee if selected and charter offers it
              if (this.selectedPrivateDock && charter.privateDockPickup && charter.privateDockPickupFee && charter.privateDockPickupFee > 0) {
                // Add pickup fee per day if multiple dates selected
                const numberOfDays = this.selectedDates.length > 0 ? this.selectedDates.length : 1;
                actualPrice += (charter.privateDockPickupFee * numberOfDays);
              }

              // Multiply by number of selected dates if more than 0 dates are selected
              if (this.selectedDates.length > 0) {
                actualPrice *= this.selectedDates.length;
              }

              // Apply service fee if integration type is not "Manual"
              if (charter.integration_type !== 'Manual' && charter.serviceFee) {
                actualPrice = actualPrice * (1 + charter.serviceFee);
              }

              // Check if this trip's calculated price falls within the filter range
              return actualPrice >= this.priceMin && actualPrice <= this.priceMax;
            });

            // If no filtered trip fits the price range, exclude this charter completely
            if (!hasValidPricedTrip) return false;
          }

          // Fishing type filter - now handled at card level to show available trips
          // Remove this filter so charters aren't completely hidden, just show filtered trip counts

          // Private dock filter
          if (this.selectedPrivateDock) {
            // First check if charter offers private dock pickup
            if (!charter.privateDockPickup) return false;

            // Get property data from Wized
            const r = Wized.data.r;
            if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data || !r.Load_Property_Details.data.property) {
              return false;
            }

            const property = r.Load_Property_Details.data.property;

            // Check if property has a private dock
            const hasPrivateDock = property.private_dock;
            if (hasPrivateDock === false) {
              return false;
            }

            // Check if charter delivers to the property's neighborhood
            if (!property.listing_neighborhood) {
              return false;
            }

            const propertyNeighborhood = property.listing_neighborhood;

            if (!charter.privateDockPickupAreas || !Array.isArray(charter.privateDockPickupAreas)) {
              return false;
            }

            const canDeliverToProperty = charter.privateDockPickupAreas.some(area =>
              area.region && area.region.toLowerCase() === propertyNeighborhood.toLowerCase()
            );

            if (!canDeliverToProperty) {
              return false;
            }
          }

          // Filter out charters that are already booked for the selected dates
          // (but not when editing - editing charter should still show in results)
          if (this.selectedDates.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const allNumbers = this.getAllFishingCharterNumbers();

            // Check if this charter is already booked for ANY of the selected dates
            const isCharterAlreadyBookedForSelectedDates = allNumbers.some(number => {
              // Skip the charter we're currently editing
              if (this.editingCharterNumber && number === this.editingCharterNumber) {
                return false;
              }

              const bookedCharterId = urlParams.get(`fishingCharterId${number}`);
              const bookedDates = urlParams.get(`fishingCharterDates${number}`);

              // If this charter is booked
              if (bookedCharterId === String(charter.id) && bookedDates) {
                const bookedDateArray = bookedDates.split(',').filter(Boolean);

                // Check if any of the selected dates overlap with booked dates
                const hasOverlap = this.selectedDates.some(selectedDate =>
                  bookedDateArray.includes(selectedDate)
                );

                return hasOverlap;
              }

              return false;
            });

            // If charter is already booked for any of the selected dates, filter it out
            if (isCharterAlreadyBookedForSelectedDates) {
              return false;
            }
          }

          return true;
        });
      }

      renderFishingCharterCards(charters) {
        // Clear any existing duplicated cards
        const existingCards = this.cardWrapper.querySelectorAll('[data-element="addFishingCharterModal_selectFishingCharter_card"]');
        existingCards.forEach((card, index) => {
          if (index !== 0) { // Keep the template card
            card.remove();
          }
        });

        // Clear any existing no results message
        const existingNoResultsMessage = this.cardWrapper.querySelector('.no-results-message');
        if (existingNoResultsMessage) {
          existingNoResultsMessage.remove();
        }

        // If no charters, hide the template card and show no results message
        if (charters.length === 0) {
          this.cardTemplate.style.display = 'none';

          // Create and add no results message
          const noResultsMessage = document.createElement('div');
          noResultsMessage.className = 'no-results-message';
          noResultsMessage.style.fontFamily = 'TT Fors, sans-serif !important';
          noResultsMessage.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
            color: black;
            font-size: 16px;
            width: 100%;
            min-height: 200px;
          `;
          noResultsMessage.textContent = 'No fishing charters found for this listing :( Try adjusting your stay or search params.';
          this.cardWrapper.appendChild(noResultsMessage);
          return;
        }

        // Show and populate cards for each charter
        charters.forEach((charter, index) => {
          let card;
          if (index === 0) {
            // Use the template card for the first charter
            card = this.cardTemplate;
          } else {
            // Clone the template for additional charters
            card = this.cardTemplate.cloneNode(true);
            this.cardWrapper.appendChild(card);
          }

          // Show the card
          card.style.display = 'flex';

          // Store charter data
          card.charterData = charter;

          // Sequential loading: first 2 cards load immediately, rest load with small delays
          if (index < 2) {
            // Load first 2 immediately for instant feedback
            this.populateFishingCharterCard(card, charter, false);
          } else {
            // Load the rest sequentially with small delays
            this.populateFishingCharterCard(card, charter, true); // Defer carousel initially

            // Load carousel after a small delay (50ms per card after the first 2)
            setTimeout(() => {
              const photosContainer = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_photos"]');
              if (photosContainer && charter.images && charter.images.length > 0) {
                this.setupFishingCharterCardImagesCarousel(photosContainer, charter, card);
              }
            }, (index - 2) * 50); // Stagger by 50ms each
          }
        });
      }

      populateFishingCharterCard(card, charter, deferCarousel = false) {
        // Store charter data on the card
        card.charterData = charter;

        // Make entire card clickable
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          // Prevent navigation if clicking on interactive elements
          if (e.target.closest('[data-element="addFishingCharterModal_selectFishingCharter_card_moreDetails"]')) {
            return;
          }
          this.showFishingCharterDetails(charter);
        });

        // Add click handler for more details button if it exists
        const moreDetailsButton = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_moreDetails"]');
        if (moreDetailsButton) {
          moreDetailsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            this.showFishingCharterDetails(charter);
          });
        }

        // Populate card title
        const titleElement = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_title"]');
        if (titleElement) {
          titleElement.textContent = charter.name || '';
        }

        const subtitleCityElement = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_subTitleCity"]');
        if (subtitleCityElement) {
          subtitleCityElement.textContent = charter.city + ", FL" || '';
        }

        // Filter trip options based on current filters
        const availableTrips = this.getFilteredTripOptions(charter);

        // Populate card subtitle based on filtered trip options
        const subtitleElement = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_subTitle"]');
        if (subtitleElement) {
          if (availableTrips.length === 0) {
            subtitleElement.textContent = 'No trips available for selected filters';
          } else {
            const tripLengths = availableTrips.map(trip => trip.lengthOfTrip);
            const minHours = Math.min(...tripLengths);
            const maxHours = Math.max(...tripLengths);

            let subtitleText = `${availableTrips.length} Trip${availableTrips.length > 1 ? 's' : ''} available`;
            if (minHours && maxHours) {
              subtitleText += ` (${minHours === maxHours ? minHours : minHours + '-' + maxHours} hours)`;
            }
            subtitleElement.textContent = subtitleText;
          }
        }

        // Populate card photo carousel (defer if requested for progressive loading)
        if (!deferCarousel) {
          const photosContainer = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_photos"]');
          if (photosContainer && charter.images && charter.images.length > 0) {
            this.setupFishingCharterCardImagesCarousel(photosContainer, charter, card);
          }
        } else {
          // Add placeholder for carousel to maintain layout
          const photosContainer = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_photos"]');
          if (photosContainer) {
            photosContainer.innerHTML = '<div style="width: 100%; height: 280px; background-color: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #ccc;"></div>';
          }
        }

        // Populate card price based on filtered trip options
        const priceElement = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_price"]');
        if (priceElement) {
          const priceText = this.getFilteredCharterPriceText(charter, availableTrips);
          priceElement.textContent = priceText;
        }

        // Populate rating if elements exist
        const ratingAvgElement = card.querySelector('[data-element="addFishingCharterModal_selectBoat_card_ratingAvg"]');
        const ratingNumberElement = card.querySelector('[data-element="addFishingCharterModal_selectBoat_card_ratingNumber"]');

        if (ratingAvgElement && ratingNumberElement) {
          const reviews = charter.reviews || [];
          if (reviews.length === 0) {
            // No reviews
            ratingAvgElement.textContent = 'New';
            ratingNumberElement.textContent = '';
          } else {
            // Calculate average rating
            const ratings = reviews.map(review => review.rating);
            const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

            // Display average rating with one decimal place
            ratingAvgElement.textContent = averageRating.toFixed(1);
            ratingNumberElement.textContent = `(${reviews.length})`;
          }
        }
      }

      getCharterPriceText(charter) {
        if (!charter.tripOptions || charter.tripOptions.length === 0) {
          return 'Price on request';
        }

        // Get boat capacity to limit additional guests
        const boatCapacity = charter.boatInfo && charter.boatInfo[0] ? charter.boatInfo[0].boatCapacity : 0;

        // Calculate prices for each trip option based on selected guests
        const calculatedPrices = charter.tripOptions.map(trip => {
          if (!trip.price) return 0;

          let actualPrice = trip.price;
          const basePeople = trip.pricePeople || 1;
          const additionalPersonRate = trip.pricePerAdditionalPerson || 0;

          // If we have selected guests and they exceed the base people count
          if (this.selectedGuests > basePeople && additionalPersonRate > 0) {
            // Don't exceed boat capacity
            const effectiveGuests = Math.min(this.selectedGuests, boatCapacity);
            const additionalPeople = Math.max(0, effectiveGuests - basePeople);
            actualPrice += (additionalPeople * additionalPersonRate);
          }

          // Add private dock pickup fee if selected and charter offers it
          if (this.selectedPrivateDock && charter.privateDockPickup && charter.privateDockPickupFee && charter.privateDockPickupFee > 0) {
            // Add pickup fee per day if multiple dates selected
            const numberOfDays = this.selectedDates.length > 0 ? this.selectedDates.length : 1;
            actualPrice += (charter.privateDockPickupFee * numberOfDays);
          }

          // Multiply by number of selected dates if more than 0 dates are selected
          if (this.selectedDates.length > 0) {
            actualPrice *= this.selectedDates.length;
          }

          // Apply service fee if integration type is not "Manual"
          if (charter.integration_type !== 'Manual' && charter.serviceFee) {
            actualPrice = actualPrice * (1 + charter.serviceFee);
          }

          return actualPrice;
        }).filter(price => price > 0);

        if (calculatedPrices.length === 0) {
          return 'Price on request';
        }

        const minPrice = Math.min(...calculatedPrices);

        // If no guests selected, show "From" pricing
        if (this.selectedGuests === 0) {
          return `From $${minPrice.toLocaleString()}`;
        }

        // If guests selected, show calculated price for that number of guests
        return `From $${minPrice.toLocaleString()}`;
      }

      // Get trip options that match current filters (dates, fishing type, etc.)
      getFilteredTripOptions(charter) {
        if (!charter.tripOptions || charter.tripOptions.length === 0) {
          return [];
        }

        return charter.tripOptions.filter(trip => {
          // Filter by fishing type
          if (this.selectedFishingTypes.length > 0) {
            const charterTypes = charter.fishingType || [];
            const hasMatchingType = this.selectedFishingTypes.some(selectedType => {
              return charterTypes.some(charterType => {
                const typeName = charterType.type || '';
                switch (selectedType) {
                  case 'inshore': return typeName.toLowerCase().includes('inshore');
                  case 'offshore': return typeName.toLowerCase().includes('offshore');
                  case 'near': return typeName.toLowerCase().includes('nearshore');
                  case 'wreck': return typeName.toLowerCase().includes('wreck');
                  case 'reef': return typeName.toLowerCase().includes('reef');
                  case 'flats': return typeName.toLowerCase().includes('flats');
                  default: return false;
                }
              });
            });
            // Only show trips if charter has matching fishing type
            if (!hasMatchingType) return false;
          }

          // Filter by season if dates are selected
          if (this.selectedDates.length > 0) {
            const seasonStart = trip.seasonStart || '1/1';
            const seasonEnd = trip.seasonEnd || '12/31';

            // If year-round (1/1 to 12/31), always valid
            if (seasonStart === '1/1' && seasonEnd === '12/31') return true;

            // Check if any selected date falls within the season
            const isSeasonValid = this.selectedDates.some(dateStr => {
              return this.isDateInSeason(dateStr, seasonStart, seasonEnd);
            });

            if (!isSeasonValid) return false;
          }

          return true;
        });
      }

      // Get price text based on filtered trip options
      getFilteredCharterPriceText(charter, availableTrips) {
        if (availableTrips.length === 0) {
          return 'No trips match filters';
        }

        // Get boat capacity to limit additional guests
        const boatCapacity = charter.boatInfo && charter.boatInfo[0] ? charter.boatInfo[0].boatCapacity : 0;

        // Calculate prices for each available trip option based on selected guests
        const calculatedPrices = availableTrips.map(trip => {
          if (!trip.price) return 0;

          let actualPrice = trip.price;
          const basePeople = trip.pricePeople || 1;
          const additionalPersonRate = trip.pricePerAdditionalPerson || 0;

          // If we have selected guests and they exceed the base people count
          if (this.selectedGuests > basePeople && additionalPersonRate > 0) {
            // Don't exceed boat capacity
            const effectiveGuests = Math.min(this.selectedGuests, boatCapacity);
            const additionalPeople = Math.max(0, effectiveGuests - basePeople);
            actualPrice += (additionalPeople * additionalPersonRate);
          }

          // Add private dock pickup fee if selected and charter offers it
          if (this.selectedPrivateDock && charter.privateDockPickup && charter.privateDockPickupFee && charter.privateDockPickupFee > 0) {
            // Add pickup fee per day if multiple dates selected
            const numberOfDays = this.selectedDates.length > 0 ? this.selectedDates.length : 1;
            actualPrice += (charter.privateDockPickupFee * numberOfDays);
          }

          // Multiply by number of selected dates if more than 0 dates are selected
          if (this.selectedDates.length > 0) {
            actualPrice *= this.selectedDates.length;
          }

          // Apply service fee if integration type is not "Manual"
          if (charter.integration_type !== 'Manual' && charter.serviceFee) {
            actualPrice = actualPrice * (1 + charter.serviceFee);
          }

          return actualPrice;
        }).filter(price => price > 0);

        if (calculatedPrices.length === 0) {
          return 'Price on request';
        }

        const minPrice = Math.min(...calculatedPrices);

        // If no guests selected, show "From" pricing
        if (this.selectedGuests === 0) {
          return `From $${minPrice.toLocaleString()}`;
        }

        // If guests selected, show calculated price for that number of guests
        return `From $${minPrice.toLocaleString()}`;
      }

      async showFishingCharterDetails(charter) {
        // Close all popups when entering charter details view
        this.closeAllPopups();

        // Hide select wrapper and show details wrapper
        this.selectWrapper.style.display = 'none';
        this.detailsWrapper.style.display = 'flex';

        // Scroll details content container to top
        if (this.detailsContentContainer) {
          this.detailsContentContainer.scrollTop = 0;
        }

        // Scroll details filter container to the left
        const detailsFilterContainer = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_container"]');
        if (detailsFilterContainer) {
          detailsFilterContainer.scrollLeft = 0;
        }

        // Store current charter data
        this.currentCharterData = charter;

        // Check and show/hide private dock option based on charter availability
        this.updatePrivateDockAvailability(charter);

        // Transfer values from main modal to details section
        this.transferValuesToDetails();

        // Populate fishing charter details
        await this.populateFishingCharterDetails(charter);

        // Setup back button
        this.setupFishingCharterDetailsBackButton();

        // Setup map
        this.setupFishingCharterMap(charter);

        // Render trip types
        this.renderTripTypes(charter);

        // Setup contact us form
        await this.setupFishingCharterContactUsForm(charter);
      }

      async setupFishingCharterContactUsForm(charter) {
        // Prevent duplicate initialization for the same charter
        if (this._charterContactFormInitializedForCharterId === charter.id) {
          return;
        }
        this._charterContactFormInitializedForCharterId = charter.id;

        // Check if user is signed in via c.token
        const hasToken = window.Wized?.data?.c?.token;

        // Only wait for Load_user if user has a token (is signed in)
        if (hasToken) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Load_user timeout')), 5000)
            );
            const loadUserPromise = Wized.requests.waitFor('Load_user');
            await Promise.race([loadUserPromise, timeoutPromise]);
          } catch (error) {
          }
        }

        // Get all contact form elements
        const firstNameInput = document.querySelector('[data-element="firstNameInput_fishingCharter"]');
        const emailInput = document.querySelector('[data-element="emailInput_fishingCharter"]');
        const messageInput = document.querySelector('[data-element="ContactUs_Input_fishingCharter"]');
        const errorElement = document.querySelector('[data-element="ContactUs_Error_fishingCharter"]');
        const submitButton = document.querySelector('[data-element="ContactUs_SubmitButton_fishingCharter"]');
        const buttonText = document.querySelector('[data-element="ContactUs_Button_Text_fishingCharter"]');
        const buttonLoader = document.querySelector('[data-element="ContactUs_Button_Loader_fishingCharter"]');

        if (!messageInput || !submitButton || !buttonText || !buttonLoader) {
          return;
        }

        // Initialize state
        if (errorElement) errorElement.style.display = 'none';
        if (buttonLoader) buttonLoader.style.display = 'none';
        if (buttonText) {
          buttonText.textContent = 'Submit';
          buttonText.style.display = 'block'; // Explicitly set display
        }

        // Check if user is logged in
        const isUserLoggedIn = this.isFishingCharterUserLoggedIn();

        // Show/hide firstName and email inputs based on login status
        if (firstNameInput && emailInput) {
          if (isUserLoggedIn) {
            firstNameInput.style.display = 'none';
            emailInput.style.display = 'none';
            // Also hide parent wrappers if they exist
            const firstNameWrapper = firstNameInput.closest('[data-element="firstNameInput_fishingCharter_wrapper"]');
            const emailWrapper = emailInput.closest('[data-element="emailInput_fishingCharter_wrapper"]');
            if (firstNameWrapper) firstNameWrapper.style.display = 'none';
            if (emailWrapper) emailWrapper.style.display = 'none';
          } else {
            firstNameInput.style.display = 'flex';
            emailInput.style.display = 'flex';
            // Show parent wrappers if they exist
            const firstNameWrapper = firstNameInput.closest('[data-element="firstNameInput_fishingCharter_wrapper"]');
            const emailWrapper = emailInput.closest('[data-element="emailInput_fishingCharter_wrapper"]');
            if (firstNameWrapper) firstNameWrapper.style.display = 'flex';
            if (emailWrapper) emailWrapper.style.display = 'flex';
          }
        }

        // Remove any existing event listeners
        const newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

        // Get fresh references from the new button
        const newButtonText = newSubmitButton.querySelector('[data-element="ContactUs_Button_Text_fishingCharter"]');
        const newButtonLoader = newSubmitButton.querySelector('[data-element="ContactUs_Button_Loader_fishingCharter"]');

        // Add submit handler
        newSubmitButton.addEventListener('click', async () => {
          await this.handleFishingCharterContactUsSubmit(charter, {
            firstNameInput,
            emailInput,
            messageInput,
            errorElement,
            buttonText: newButtonText,
            buttonLoader: newButtonLoader,
            isUserLoggedIn
          });
        });
      }

      isFishingCharterUserLoggedIn() {
        // Check if user is logged in via Wized data
        try {
          if (window.Wized && window.Wized.data && window.Wized.data.r) {
            // Check both possible property names
            const loadUserRequest = window.Wized.data.r.Load_user;
            if (loadUserRequest) {
              if (loadUserRequest.statusCode === 200 || loadUserRequest.status === 200) {
                return true;
              }
            }
          }

        } catch (error) {
        }
        return false;
      }

      getFishingCharterUserId() {
        // Get user ID from Wized data
        try {
          if (window.Wized && window.Wized.data && window.Wized.data.r) {
            // Check both possible property names
            const loadUserRequest = window.Wized.data.r.Load_user;
            if (loadUserRequest && loadUserRequest.data && loadUserRequest.data.id) {
              return loadUserRequest.data.id;
            }
          }
        } catch (error) {
        }
        return null;
      }

      async handleFishingCharterContactUsSubmit(charter, elements) {
        const { firstNameInput, emailInput, messageInput, errorElement, buttonText, buttonLoader, isUserLoggedIn } = elements;

        // Clear previous errors
        if (errorElement) {
          errorElement.style.display = 'none';
          errorElement.textContent = '';
        }

        // Get message from contenteditable div
        const message = messageInput.textContent || messageInput.innerText || '';
        const trimmedMessage = message.trim();

        // Helper function to get input value (handles both input and contenteditable)
        const getInputValue = (input) => {
          if (!input) return '';
          // Check if it's a regular input
          if (input.value !== undefined) {
            return input.value.trim();
          }
          // Check if it's contenteditable
          if (input.getAttribute('contenteditable') === 'true') {
            return (input.textContent || input.innerText || '').trim();
          }
          return '';
        };

        // Validate required fields
        let errorMessage = '';

        if (!trimmedMessage) {
          errorMessage = 'Please enter a message';
        } else if (!isUserLoggedIn) {
          // If not logged in, validate firstName and email
          const firstName = getInputValue(firstNameInput);
          const email = getInputValue(emailInput);

          if (!firstName) {
            errorMessage = 'Please enter your first name';
          } else if (!email) {
            errorMessage = 'Please enter your email';
          } else if (!this.isFishingCharterValidEmail(email)) {
            errorMessage = 'Please enter a valid email address';
          }
        }

        // Show error if validation failed
        if (errorMessage) {
          if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
          }
          return;
        }

        // Prepare request data
        const requestData = {
          message: trimmedMessage,
          fishingCharter_id: charter.id,
          guest_id: null,
          email: null,
          firstName: null
        };

        if (isUserLoggedIn) {
          requestData.guest_id = this.getFishingCharterUserId();
        } else {
          requestData.email = getInputValue(emailInput);
          requestData.firstName = getInputValue(firstNameInput);
        }

        // Show loader, hide button text
        if (buttonText) {
          buttonText.style.setProperty('display', 'none', 'important');
        }
        if (buttonLoader) {
          buttonLoader.style.setProperty('display', 'flex', 'important');
        }

        try {
          const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/listingPage_ContactUs_fishingCharters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          // Hide loader, show button text
          if (buttonLoader) {
            buttonLoader.style.setProperty('display', 'none', 'important');
          }
          if (buttonText) {
            buttonText.style.setProperty('display', 'block', 'important');
          }

          if (!response.ok) {
            throw new Error(`Failed to submit message: ${response.status}`);
          }

          // Success - update button text and clear form
          if (buttonText) {
            buttonText.textContent = 'Message Submitted!';
          }

          // Clear the message input
          if (messageInput) {
            messageInput.textContent = '';
          }

          // Clear firstName and email if not logged in
          if (!isUserLoggedIn) {
            if (firstNameInput) {
              if (firstNameInput.value !== undefined) {
                firstNameInput.value = '';
              } else {
                firstNameInput.textContent = '';
              }
            }
            if (emailInput) {
              if (emailInput.value !== undefined) {
                emailInput.value = '';
              } else {
                emailInput.textContent = '';
              }
            }
          }

          // Reset button text after 3 seconds
          setTimeout(() => {
            if (buttonText) {
              buttonText.textContent = 'Submit';
            }
          }, 3000);

        } catch (error) {
          // Hide loader, show button text
          if (buttonLoader) buttonLoader.style.display = 'none';
          if (buttonText) buttonText.style.display = 'block';

          if (errorElement) {
            errorElement.textContent = 'Failed to submit message. Please try again.';
            errorElement.style.display = 'block';
          }
        }
      }

      isFishingCharterValidEmail(email) {
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }

      setupFishingCharterDetailsBackButton() {
        const backButton = document.querySelector('[data-element="fishingCharterDetails_back"]');
        if (backButton) {
          // Remove existing listeners
          backButton.replaceWith(backButton.cloneNode(true));
          const newBackButton = document.querySelector('[data-element="fishingCharterDetails_back"]');

          newBackButton.addEventListener('click', async () => {
            // DON'T reset editing state when going back - preserve it so user can select different charter
            // this.editingCharterNumber and this.editingTripId remain set

            // Sync all filter states back to main view
            this.transferValuesToMain();

            // Show select wrapper
            this.detailsWrapper.style.display = 'none';
            this.selectWrapper.style.display = 'flex';

            // Scroll select filter container to the left
            const selectFilterContainer = document.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_container"]');
            if (selectFilterContainer) {
              selectFilterContainer.scrollLeft = 0;
            }

            // Fetch and render charters if not already loaded
            if (this.allFishingCharters.length === 0) {
              await this.fetchAndRenderFishingCharters();
            } else {
              this.refilterChartersIfModalOpen();
            }
          });
        }
      }

      updatePrivateDockAvailability(charter) {
        if (!this.detailsPrivateDockFilter) return;

        // Check if charter offers private dock pickup
        if (!charter.privateDockPickup) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        // Get property data from Wized
        const r = Wized.data.r;
        if (!r || !r.Load_Property_Details || !r.Load_Property_Details.data || !r.Load_Property_Details.data.property) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        const property = r.Load_Property_Details.data.property;

        // First check if property has a private dock
        const hasPrivateDock = property.private_dock;
        if (hasPrivateDock === false) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        // Check if charter delivers to the property's neighborhood
        if (!property.listing_neighborhood) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        const propertyNeighborhood = property.listing_neighborhood;

        if (!charter.privateDockPickupAreas || !Array.isArray(charter.privateDockPickupAreas)) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        const canDeliverToProperty = charter.privateDockPickupAreas.some(area =>
          area.region && area.region.toLowerCase() === propertyNeighborhood.toLowerCase()
        );

        if (!canDeliverToProperty) {
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        // If we get here, private dock is available for this charter
        this.detailsPrivateDockFilter.style.display = 'flex';

        // Also update availability based on selected dates (check-in/out restriction)
        this.updateDetailsPrivateDockFilterAvailability();
      }

      async populateFishingCharterDetails(charter) {
        // Images container
        this.setupFishingCharterImagesCarousel(charter);

        // Title
        const titleElement = document.querySelector('[data-element="fishingCharterDetails_title"]');
        if (titleElement) {
          titleElement.textContent = charter.name || '';
        }

        // Location
        const locationElement = document.querySelector('[data-element="fishingCharterDetails_location"]');
        if (locationElement) {
          locationElement.textContent = (charter.city || '') + ', FL';
        }

        // Reviews
        this.populateFishingCharterReviews(charter);

        // Description
        const descriptionElement = document.querySelector('[data-element="fishingCharterDetails_description"]');
        const fishingCharterDescriptionShowMore = document.querySelector('[data-element="fishingCharterDetails_description_showMore"]');

        if (descriptionElement) {
          const description = charter.description || '';
          const maxLength = 400;

          if (description.length > maxLength) {
            // Show truncated description initially
            descriptionElement.textContent = description.substring(0, maxLength) + '...';

            // Show the "Show More" button
            if (fishingCharterDescriptionShowMore) {
              fishingCharterDescriptionShowMore.style.display = 'flex';
              fishingCharterDescriptionShowMore.textContent = 'Show More';

              // Add click handler
              fishingCharterDescriptionShowMore.onclick = () => {
                const isExpanded = fishingCharterDescriptionShowMore.textContent === 'Show Less';

                if (isExpanded) {
                  // Collapse: show truncated
                  descriptionElement.textContent = description.substring(0, maxLength) + '...';
                  fishingCharterDescriptionShowMore.textContent = 'Show More';
                } else {
                  // Expand: show full description
                  descriptionElement.textContent = description;
                  fishingCharterDescriptionShowMore.textContent = 'Show Less';
                }
              };
            }
          } else {
            // Description is short, show full text
            descriptionElement.textContent = description;

            // Hide the "Show More" button
            if (fishingCharterDescriptionShowMore) {
              fishingCharterDescriptionShowMore.style.display = 'none';
            }
          }
        }

        // Boat information
        this.populateFishingCharterBoatInfo(charter);

        // Captain information
        this.populateFishingCharterCaptainInfo(charter);

        // Type of fishing blocks
        this.populateFishingCharterFishingTypes(charter);

        // Amenity blocks
        this.populateFishingCharterAmenities(charter);

        // What's included blocks
        this.populateFishingCharterWhatsIncluded(charter);

        // Fishing techniques blocks
        this.populateFishingCharterFishingTechniques(charter);

        // Reviews section
        this.populateFishingCharterReviewsSection(charter);

        // Policies
        this.populateFishingCharterPolicies(charter);

        // Cancellation policy
        this.populateFishingCharterCancellationPolicy(charter);

        // City state
        const cityStateElement = document.querySelector('[data-element="fishingCharterDetails_cityState"]');
        if (cityStateElement) {
          cityStateElement.textContent = (charter.city || '') + ', FL';
        }
      }

      setupFishingCharterImagesCarousel(charter) {
        const imagesContainer = document.querySelector('[data-element="fishingCharterDetails_imagesContainer"]');
        if (!imagesContainer) return;

        // Clear any existing content
        imagesContainer.innerHTML = '';

        // Check if charter has images
        if (!charter.images || charter.images.length === 0) {
          imagesContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No images available</div>';
          return;
        }

        // Sort images by order if available, otherwise keep original order
        const sortedImages = [...charter.images];

        // Check screen width for responsive behavior
        const isMobile = window.innerWidth <= 767;
        const carouselHeight = isMobile ? '300px' : '400px';

        // Create carousel structure
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: ${carouselHeight};
          overflow: hidden;
          border-radius: 5px;
        `;

        const imagesTrack = document.createElement('div');
        imagesTrack.style.cssText = `
          display: flex;
          transition: transform 0.3s ease;
          height: 100%;
        `;

        // Add images to track
        sortedImages.forEach((image, index) => {
          const imageContainer = document.createElement('div');
          const flexBasis = isMobile ? '100%' : '50%';

          imageContainer.style.cssText = `
            flex: 0 0 ${flexBasis};
            height: ${carouselHeight};
            padding: 0 4px;
            box-sizing: border-box;
          `;

          const imageWrapper = document.createElement('div');
          imageWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 5px;
            overflow: hidden;
            background-color: #f0f0f0;
            cursor: pointer;
          `;

          const img = document.createElement('img');
          img.src = image.image?.url || '';
          img.alt = `${charter.name} image ${index + 1}`;

          // Optimize loading: first 2 images eager (visible on desktop), rest lazy
          if (index === 0) {
            img.loading = 'eager';
            img.fetchPriority = 'high';
          } else if (index === 1) {
            img.loading = 'eager';
          } else {
            img.loading = 'lazy';
          }
          img.decoding = 'async';

          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          `;

          // Handle image load error
          img.onerror = () => {
            imageWrapper.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">Image unavailable</div>';
          };

          // Add click handler to open full-size modal
          imageWrapper.addEventListener('click', () => {
            this.openFishingCharterImageModal(sortedImages, index);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are more than the visible count
        const visibleCount = isMobile ? 1 : 2;

        if (sortedImages.length > visibleCount) {
          let currentIndex = 0;
          const maxIndex = Math.max(0, sortedImages.length - visibleCount); // Show based on screen size

          // Create counter first so it can be referenced in navigation
          const counter = document.createElement('div');
          counter.style.cssText = `
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 5px;
            font-size: 12px;
            font-family: 'TT Fors, sans-serif';
            z-index: 10;
          `;

          // Left navigation button
          const leftButton = document.createElement('button');
          leftButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          leftButton.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Right navigation button
          const rightButton = document.createElement('button');
          rightButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          rightButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Update button states
          const updateButtonStates = () => {
            leftButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
            leftButton.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            rightButton.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            rightButton.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
          };

          // Navigation functionality
          const updateCarousel = () => {
            const movePercentage = isMobile ? 100 : 50; // Move by 100% on mobile, 50% on desktop
            const translateX = -(currentIndex * movePercentage);
            imagesTrack.style.transform = `translateX(${translateX}%)`;
            updateButtonStates();
          };

          leftButton.addEventListener('click', () => {
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });

          rightButton.addEventListener('click', () => {
            if (currentIndex < maxIndex) {
              currentIndex++;
              updateCarousel();
            }
          });

          // Hover effects
          leftButton.addEventListener('mouseenter', () => {
            if (currentIndex > 0) leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          leftButton.addEventListener('mouseleave', () => {
            leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          rightButton.addEventListener('mouseenter', () => {
            if (currentIndex < maxIndex) rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          rightButton.addEventListener('mouseleave', () => {
            rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          // Initial states
          updateButtonStates();

          // Add swipe functionality for mobile
          let touchStartX = 0;
          let touchEndX = 0;
          let isSwiping = false;
          let touchStartY = 0;

          carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = true;
          }, { passive: false });

          carouselWrapper.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            const touchCurrentX = e.changedTouches[0].screenX;
            const touchCurrentY = e.changedTouches[0].screenY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);

            // If horizontal swipe is dominant, prevent page scroll
            if (deltaX > deltaY) {
              e.preventDefault();
            }

            touchEndX = touchCurrentX;
          }, { passive: false });

          carouselWrapper.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;

            const swipeThreshold = 50; // Minimum swipe distance in pixels
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
              if (swipeDistance > 0 && currentIndex < maxIndex) {
                // Swiped left - go to next
                currentIndex++;
                updateCarousel();
              } else if (swipeDistance < 0 && currentIndex > 0) {
                // Swiped right - go to previous
                currentIndex--;
                updateCarousel();
              }
            }

            touchStartX = 0;
            touchEndX = 0;
          });

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
        }

        imagesContainer.appendChild(carouselWrapper);
      }

      setupFishingCharterCardImagesCarousel(photosContainer, charter, card) {
        // Clear any existing content
        photosContainer.innerHTML = '';

        // Check if charter has images
        if (!charter.images || charter.images.length === 0) {
          photosContainer.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No images available</div>';
          return;
        }

        // Sort images by order if available, otherwise keep original order
        const sortedImages = [...charter.images];

        // Card carousel always shows 1 image at a time
        const carouselHeight = '280px';

        // Create carousel structure
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: ${carouselHeight};
          overflow: hidden;
          border-radius: 5px;
        `;

        const imagesTrack = document.createElement('div');
        imagesTrack.style.cssText = `
          display: flex;
          transition: transform 0.3s ease;
          height: 100%;
        `;

        // Add images to track
        sortedImages.forEach((image, index) => {
          const imageContainer = document.createElement('div');
          imageContainer.style.cssText = `
            flex: 0 0 100%;
            height: ${carouselHeight};
            padding: 0 0px;
            box-sizing: border-box;
          `;

          const imageWrapper = document.createElement('div');
          imageWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 5px;
            overflow: hidden;
            background-color: #f0f0f0;
            cursor: pointer;
          `;

          const img = document.createElement('img');
          img.src = image.image?.url || '';
          img.alt = `${charter.name} image ${index + 1}`;

          // Optimize loading: first image eager, rest lazy
          if (index === 0) {
            img.loading = 'eager';
          } else {
            img.loading = 'lazy';
          }
          img.decoding = 'async';

          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          `;

          // Handle image load error
          img.onerror = () => {
            imageWrapper.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px;">Image unavailable</div>';
          };

          // Add click handler to show fishing charter details (not open modal)
          imageWrapper.addEventListener('click', () => {
            this.showFishingCharterDetails(charter);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are multiple images
        if (sortedImages.length > 1) {
          let currentIndex = 0;
          const maxIndex = sortedImages.length - 1;

          // Left navigation button
          const leftButton = document.createElement('button');
          leftButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          leftButton.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Right navigation button
          const rightButton = document.createElement('button');
          rightButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          rightButton.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.2s ease;
          `;

          // Update button states
          const updateButtonStates = () => {
            leftButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
            leftButton.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            rightButton.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            rightButton.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
          };

          // Navigation functionality
          const updateCarousel = () => {
            const translateX = -(currentIndex * 100);
            imagesTrack.style.transform = `translateX(${translateX}%)`;
            updateButtonStates();
          };

          leftButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });

          rightButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (currentIndex < maxIndex) {
              currentIndex++;
              updateCarousel();
            }
          });

          // Hover effects
          leftButton.addEventListener('mouseenter', () => {
            if (currentIndex > 0) leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          leftButton.addEventListener('mouseleave', () => {
            leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          rightButton.addEventListener('mouseenter', () => {
            if (currentIndex < maxIndex) rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          rightButton.addEventListener('mouseleave', () => {
            rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          // Initial states
          updateButtonStates();

          // Add swipe functionality for mobile
          let touchStartX = 0;
          let touchEndX = 0;
          let isSwiping = false;
          let touchStartY = 0;

          carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = true;
          }, { passive: false });

          carouselWrapper.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;

            const touchCurrentX = e.changedTouches[0].screenX;
            const touchCurrentY = e.changedTouches[0].screenY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);

            // If horizontal swipe is dominant, prevent page scroll
            if (deltaX > deltaY) {
              e.preventDefault();
            }

            touchEndX = touchCurrentX;
          }, { passive: false });

          carouselWrapper.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;

            const swipeThreshold = 50; // Minimum swipe distance in pixels
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
              if (swipeDistance > 0 && currentIndex < maxIndex) {
                // Swiped left - go to next
                currentIndex++;
                updateCarousel();
              } else if (swipeDistance < 0 && currentIndex > 0) {
                // Swiped right - go to previous
                currentIndex--;
                updateCarousel();
              }
            }

            touchStartX = 0;
            touchEndX = 0;
          });

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
        }

        photosContainer.appendChild(carouselWrapper);
      }

      openFishingCharterImageModal(images, startIndex = 0) {
        // Remove any existing modal
        const existingModal = document.querySelector('.fishing-charter-image-modal');
        if (existingModal) {
          existingModal.remove();
        }

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fishing-charter-image-modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10200;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // Create image element
        const modalImage = document.createElement('img');
        modalImage.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 5px;
          box-shadow: 0 4px 30px rgba(255, 255, 255, 0.1);
        `;

        let currentImageIndex = startIndex;

        // Navigation functions
        const goToPrevious = () => {
          if (currentImageIndex > 0) {
            currentImageIndex--;
            updateImage();
          }
        };

        const goToNext = () => {
          if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            updateImage();
          }
        };

        // Navigation buttons if more than one image
        let prevButton, nextButton;
        if (images.length > 1) {

          // Previous button
          prevButton = document.createElement('button');
          prevButton.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          prevButton.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 56px;
            height: 56px;
            background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10201;
            transition: background-color 0.2s ease, opacity 0.2s ease;
          `;

          prevButton.addEventListener('click', goToPrevious);

          // Next button
          nextButton = document.createElement('button');
          nextButton.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          nextButton.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 56px;
            height: 56px;
            background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10201;
            transition: background-color 0.2s ease, opacity 0.2s ease;
          `;

          nextButton.addEventListener('click', goToNext);

          // Hover effects
          prevButton.addEventListener('mouseenter', () => {
            if (currentImageIndex > 0) prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          });
          prevButton.addEventListener('mouseleave', () => {
            prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          });

          nextButton.addEventListener('mouseenter', () => {
            if (currentImageIndex < images.length - 1) nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          });
          nextButton.addEventListener('mouseleave', () => {
            nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          });
        }

        // Update image
        const updateImage = () => {
          const image = images[currentImageIndex];
          modalImage.src = image.image.url;
          modalImage.alt = `Fishing charter image ${currentImageIndex + 1}`;

          // Update navigation button states
          if (images.length > 1) {
            prevButton.style.opacity = currentImageIndex === 0 ? '0.5' : '1';
            prevButton.style.cursor = currentImageIndex === 0 ? 'not-allowed' : 'pointer';
            nextButton.style.opacity = currentImageIndex === images.length - 1 ? '0.5' : '1';
            nextButton.style.cursor = currentImageIndex === images.length - 1 ? 'not-allowed' : 'pointer';
          }
        };

        // Keyboard navigation
        const handleKeydown = (e) => {
          switch (e.key) {
            case 'Escape':
              closeModal();
              break;
            case 'ArrowLeft':
              e.preventDefault();
              if (images.length > 1) goToPrevious();
              break;
            case 'ArrowRight':
              e.preventDefault();
              if (images.length > 1) goToNext();
              break;
          }
        };

        document.addEventListener('keydown', handleKeydown);

        // Cleanup function when modal is closed
        const originalRemove = modal.remove;
        modal.remove = function () {
          document.removeEventListener('keydown', handleKeydown);
          originalRemove.call(this);
        };

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        closeButton.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10201;
          transition: background-color 0.2s ease;
        `;

        const closeModal = () => {
          modal.style.opacity = '0';
          setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
          }, 300);
        };

        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        });
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });

        closeButton.addEventListener('click', closeModal);

        // Assemble modal
        imageContainer.appendChild(modalImage);
        modal.appendChild(imageContainer);
        modal.appendChild(closeButton);

        if (images.length > 1) {
          modal.appendChild(prevButton);
          modal.appendChild(nextButton);
        }

        // Add to DOM and show
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Initialize
        updateImage();

        // Fade in
        requestAnimationFrame(() => {
          modal.style.opacity = '1';
        });
      }

      populateFishingCharterReviews(charter) {
        const reviewsAvgElement = document.querySelector('[data-element="fishingCharterDetails_reviewsAVG"]');
        const reviewsDot = document.querySelector('[data-element="fishingCharterDetails_reviewsDot"]');
        const reviewsAmountElement = document.querySelector('[data-element="fishingCharterDetails_reviewsAmount"]');

        if (reviewsAvgElement && reviewsAmountElement) {
          if (!charter.reviews || charter.reviews.length === 0) {
            reviewsAvgElement.textContent = 'New';
            reviewsAmountElement.textContent = '';
            reviewsDot.style.display = 'none';
          } else {
            const avgRating = charter.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / charter.reviews.length;
            reviewsAvgElement.textContent = avgRating.toFixed(1);
            reviewsAmountElement.textContent = `(${charter.reviews.length})`;
            reviewsDot.style.display = 'flex';
          }
        }
      }

      populateFishingCharterBoatInfo(charter) {
        if (!charter.boatInfo || charter.boatInfo.length === 0) return;

        const boatInfo = charter.boatInfo[0];

        // Boat image
        const boatImageElement = document.querySelector('[data-element="fishingCharterDetails_boatImage"]');
        if (boatImageElement && boatInfo.image) {
          boatImageElement.src = boatInfo.image.url;
          boatImageElement.alt = 'Boat';
        }

        // Boat year
        const boatYearElement = document.querySelector('[data-element="fishingCharterDetails_boatYear"]');
        const boatYearContainer = document.querySelector('[data-element="fishingCharterDetails_boatYearContainer"]');
        if (boatYearElement) {
          if (boatInfo.boatYear) {
            boatYearElement.textContent = boatInfo.boatYear;
            if (boatYearContainer) boatYearContainer.style.display = 'flex';
          } else {
            boatYearElement.textContent = '';
            if (boatYearContainer) boatYearContainer.style.display = 'none';
          }
        }

        // Boat length
        const boatLengthElement = document.querySelector('[data-element="fishingCharterDetails_boatLength"]');
        if (boatLengthElement) {
          boatLengthElement.textContent = boatInfo.boatLength ? `${boatInfo.boatLength}ft` : '';
        }

        // Boat manufacturer
        const boatManufacturerElement = document.querySelector('[data-element="fishingCharterDetails_boatManufacturer"]');
        if (boatManufacturerElement) {
          boatManufacturerElement.textContent = boatInfo.boatManufacturer || '';
        }

        // Boat type
        const boatTypeElement = document.querySelector('[data-element="fishingCharterDetails_boatType"]');
        if (boatTypeElement) {
          boatTypeElement.textContent = boatInfo.boatType || '';
        }
      }

      populateFishingCharterCaptainInfo(charter) {
        if (!charter.captainInfo || charter.captainInfo.length === 0) return;

        const captainInfo = charter.captainInfo[0];

        // Captain image
        const captainImageElement = document.querySelector('[data-element="fishingCharterDetails_captainImage"]');
        if (captainImageElement && captainInfo.image) {
          captainImageElement.src = captainInfo.image.url;
          captainImageElement.alt = captainInfo.name || 'Captain';
        }

        // Captain name
        const captainNameElement = document.querySelector('[data-element="fishingCharterDetails_captainName"]');
        if (captainNameElement) {
          captainNameElement.textContent = captainInfo.name || '';
        }

        // Captain description
        const captainDescriptionElement = document.querySelector('[data-element="fishingCharterDetails_captainDescription"]');
        if (captainDescriptionElement) {
          captainDescriptionElement.textContent = captainInfo.description || '';
        }
      }

      populateFishingCharterFishingTypes(charter) {
        const section = document.querySelector('[data-element="fishingCharterDetails_typeOfFishingSection"]');
        const templateStackBlock = document.querySelector('[data-element="fishingCharterDetails_typeOfFishingBlockStackBlock"]');
        const parentContainer = templateStackBlock?.parentElement;

        // Hide section if no fishing types
        if (!charter.fishingType || charter.fishingType.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        // Show section if it has data
        if (section) section.style.display = 'flex';

        if (!templateStackBlock || !parentContainer) return;

        // Clear existing stack blocks except template
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="fishingCharterDetails_typeOfFishingBlockStackBlock"]');
        existingStackBlocks.forEach((block, index) => {
          if (index > 0) block.remove();
        });

        // Populate fishing types
        charter.fishingType.forEach((fishingType, index) => {
          let stackBlock;
          if (index === 0) {
            stackBlock = templateStackBlock;
          } else {
            stackBlock = templateStackBlock.cloneNode(true);
            parentContainer.appendChild(stackBlock);
          }

          stackBlock.style.display = 'flex';

          const textElement = stackBlock.querySelector('[data-element="fishingCharterDetails_typeOfFishingBlock_text"]');
          if (textElement) {
            textElement.textContent = fishingType.type || '';
          }
        });
      }

      populateFishingCharterAmenities(charter) {

        const section = document.querySelector('[data-element="fishingCharterDetails_amenitySection"]');
        const templateStackBlock = document.querySelector('[data-element="fishingCharterDetails_amenityBlockStackBlock"]');
        const parentContainer = templateStackBlock?.parentElement;

        // Hide section if no amenities
        if (!charter.amenities || charter.amenities.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        // Show section if it has data
        if (section) {
          section.style.display = 'flex';
        }

        if (!templateStackBlock || !parentContainer) {
          return;
        }

        // Clear existing stack blocks except template
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="fishingCharterDetails_amenityBlockStackBlock"]');
        existingStackBlocks.forEach((block, index) => {
          if (index > 0) block.remove();
        });

        // Populate amenities
        charter.amenities.forEach((amenity, index) => {

          let stackBlock;
          if (index === 0) {
            stackBlock = templateStackBlock;
          } else {
            stackBlock = templateStackBlock.cloneNode(true);
            parentContainer.appendChild(stackBlock);
          }

          stackBlock.style.display = 'flex';

          const textElement = stackBlock.querySelector('[data-element="fishingCharterDetails_amenityBlock_text"]');

          if (textElement) {
            textElement.textContent = amenity.amenity || '';
          }
        });
      }

      populateFishingCharterWhatsIncluded(charter) {
        const section = document.querySelector('[data-element="fishingCharterDetails_whatsIncludedSection"]');
        const templateStackBlock = document.querySelector('[data-element="fishingCharterDetails_whatsIncludedBlockStackBlock"]');
        const parentContainer = templateStackBlock?.parentElement;

        // Hide section if no items
        if (!charter.whatsIncluded || charter.whatsIncluded.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        // Show section if it has data
        if (section) section.style.display = 'flex';

        if (!templateStackBlock || !parentContainer) return;

        // Clear existing stack blocks except template
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="fishingCharterDetails_whatsIncludedBlockStackBlock"]');
        existingStackBlocks.forEach((block, index) => {
          if (index > 0) block.remove();
        });

        // Populate what's included
        charter.whatsIncluded.forEach((item, index) => {
          let stackBlock;
          if (index === 0) {
            stackBlock = templateStackBlock;
          } else {
            stackBlock = templateStackBlock.cloneNode(true);
            parentContainer.appendChild(stackBlock);
          }

          stackBlock.style.display = 'flex';

          const textElement = stackBlock.querySelector('[data-element="fishingCharterDetails_whatsIncludedBlock_text"]');
          if (textElement) {
            textElement.textContent = item.item || '';
          }
        });
      }

      populateFishingCharterFishingTechniques(charter) {
        const section = document.querySelector('[data-element="fishingCharterDetails_fishingTechniquesSection"]');
        const templateStackBlock = document.querySelector('[data-element="fishingCharterDetails_fishingTechniquesBlockStackBlock"]');
        const parentContainer = templateStackBlock?.parentElement;

        // Hide section if no fishing techniques
        if (!charter.fishingTechniques || charter.fishingTechniques.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        // Show section if it has data
        if (section) section.style.display = 'flex';

        if (!templateStackBlock || !parentContainer) return;

        // Clear existing stack blocks except template
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="fishingCharterDetails_fishingTechniquesBlockStackBlock"]');
        existingStackBlocks.forEach((block, index) => {
          if (index > 0) block.remove();
        });

        // Populate fishing techniques
        charter.fishingTechniques.forEach((technique, index) => {
          let stackBlock;
          if (index === 0) {
            stackBlock = templateStackBlock;
          } else {
            stackBlock = templateStackBlock.cloneNode(true);
            parentContainer.appendChild(stackBlock);
          }

          stackBlock.style.display = 'flex';

          const textElement = stackBlock.querySelector('[data-element="fishingCharterDetails_fishingTechniquesBlock_text"]');
          if (textElement) {
            textElement.textContent = technique.technique || '';
          }
        });
      }

      populateFishingCharterReviewsSection(charter) {
        const reviewsSection = document.querySelector('[data-element="fishingCharterDetails_reviewsSection"]');
        if (!reviewsSection) return;

        if (!charter.reviews || charter.reviews.length === 0) {
          reviewsSection.style.display = 'none';
          return;
        }

        reviewsSection.style.display = 'flex';

        // Average rating
        const avgElement = document.querySelector('[data-element="fishingCharterDetails_reviewsSection_avg"]');
        if (avgElement) {
          const avgRating = charter.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / charter.reviews.length;
          avgElement.textContent = avgRating.toFixed(1);
        }

        // Amount of reviews
        const amountElement = document.querySelector('[data-element="fishingCharterDetails_reviewsSection_amount"]');
        if (amountElement) {
          amountElement.textContent = `${charter.reviews.length} review${charter.reviews.length !== 1 ? 's' : ''}`;
        }

        // Sort reviews by date (most recent first)
        const sortedReviews = [...charter.reviews].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Show all vs show more button
        const showAllButton = document.querySelector('[data-element="fishingCharterDetails_reviewsSection_showAll"]');
        if (showAllButton) {
          if (charter.reviews.length <= 4) {
            showAllButton.style.display = 'none';
          } else {
            showAllButton.style.display = 'block';
            this.setupFishingCharterReviewsToggle(sortedReviews, showAllButton);
          }
        }

        // Populate review blocks (initially show first 4)
        this.renderFishingCharterReviewBlocks(sortedReviews.slice(0, 4));
      }

      setupFishingCharterReviewsToggle(sortedReviews, showAllButton) {
        let showingAll = false;

        const toggleReviews = () => {
          if (showingAll) {
            this.renderFishingCharterReviewBlocks(sortedReviews.slice(0, 4));
            showAllButton.textContent = 'Show more';
            showingAll = false;
          } else {
            this.renderFishingCharterReviewBlocks(sortedReviews);
            showAllButton.textContent = 'Show less';
            showingAll = true;
          }
        };

        // Remove existing listeners
        showAllButton.replaceWith(showAllButton.cloneNode(true));
        const newShowAllButton = document.querySelector('[data-element="fishingCharterDetails_reviewsSection_showAll"]');
        newShowAllButton.textContent = 'Show more';
        newShowAllButton.addEventListener('click', toggleReviews);
      }

      renderFishingCharterReviewBlocks(reviews) {
        const templateBlock = document.querySelector('[data-element="fishingCharterDetails_reviewsSection_reviewBlock"]');
        const container = templateBlock?.parentElement;

        if (!templateBlock || !container) return;

        // Clear existing blocks except template
        const existingBlocks = container.querySelectorAll('[data-element="fishingCharterDetails_reviewsSection_reviewBlock"]');
        existingBlocks.forEach((block, index) => {
          if (index > 0) block.remove();
        });

        // Hide template if no reviews
        if (reviews.length === 0) {
          templateBlock.style.display = 'none';
          return;
        }

        reviews.forEach((review, index) => {
          let block;
          if (index === 0) {
            block = templateBlock;
          } else {
            block = templateBlock.cloneNode(true);
            container.appendChild(block);
          }

          block.style.display = 'flex';

          // First name
          const firstNameElement = block.querySelector('[data-element="fishingCharterDetails_reviewsSection_reviewBlock_firstName"]');
          if (firstNameElement) {
            firstNameElement.textContent = review.firstName || '';
          }

          // Rating
          const ratingElement = block.querySelector('[data-element="fishingCharterDetails_reviewsSection_reviewBlock_rating"]');
          if (ratingElement) {
            ratingElement.textContent = review.rating || '';
          }

          // Month and year
          const monthYearElement = block.querySelector('[data-element="fishingCharterDetails_reviewsSection_reviewBlock_monthYear"]');
          if (monthYearElement && review.date) {
            const date = new Date(review.date);
            const options = { month: 'short', year: 'numeric' };
            monthYearElement.textContent = date.toLocaleDateString('en-US', options);
          }

          // Review text
          const reviewTextElement = block.querySelector('[data-element="fishingCharterDetails_reviewsSection_reviewBlock_reviewText"]');
          if (reviewTextElement) {
            reviewTextElement.textContent = review.description || '';
          }
        });
      }

      populateFishingCharterPolicies(charter) {
        const templatePolicy = document.querySelector('[data-element="fishingCharterDetails_policies_text"]');
        const container = templatePolicy?.parentElement;

        if (!templatePolicy || !container || !charter.policies) return;

        // Clear existing policies except template
        const existingPolicies = container.querySelectorAll('[data-element="fishingCharterDetails_policies_text"]');
        existingPolicies.forEach((policy, index) => {
          if (index > 0) policy.remove();
        });

        // Hide template if no policies
        if (charter.policies.length === 0) {
          templatePolicy.style.display = 'none';
          return;
        }

        // Populate policies
        charter.policies.forEach((policy, index) => {
          let policyElement;
          if (index === 0) {
            policyElement = templatePolicy;
          } else {
            policyElement = templatePolicy.cloneNode(true);
            container.appendChild(policyElement);
          }

          policyElement.style.display = 'block';
          policyElement.textContent = policy.policy || '';
        });
      }

      populateFishingCharterCancellationPolicy(charter) {
        const cancellationPolicyElement = document.querySelector('[data-element="fishingCharterDetails_cancellationPolicy"]');
        if (!cancellationPolicyElement) return;

        if (charter.cancellationPolicy) {
          const days = charter.cancellationPolicy_daysNotice || 0;
          cancellationPolicyElement.textContent = `Free cancellation up to ${days} day${days !== 1 ? 's' : ''} prior to trip`;
        } else {
          cancellationPolicyElement.textContent = 'No cancellations allowed';
        }
      }

      setupFishingCharterMap(charter) {
        const mapElement = document.querySelector('[data-element="fishingCharterDetails_map"]');
        if (!mapElement || !charter.address) return;

        const apiKey = 'AIzaSyDIsh3z39SZKKEsHm59QVcOucjCrFMepfQ';

        // Function to initialize the map with coordinates
        const initializeMap = (latitude, longitude) => {
          // Check if Google Maps is already loaded
          if (window.google && window.google.maps) {
            createMap();
          } else {
            // Load Google Maps script if not already loaded
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.onload = createMap;
            document.head.appendChild(script);
          }

          function createMap() {
            const map = new window.google.maps.Map(mapElement, {
              zoom: 16,
              center: { lat: latitude, lng: longitude },
              mapTypeId: 'roadmap',
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
                style: google.maps.ZoomControlStyle.LARGE
              },
              streetViewControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT,
              },
              scrollwheel: false,
              styles: [
                { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "landscape", "stylers": [{ "color": "#f5f5f5" }] },
                { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c2d2b1" }] },
                { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "water", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#9ecaff" }] },
                { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f0f0f0" }, { "visibility": "on" }] },
              ]
            });

            // Use a fishing icon SVG for the pin
            const pinSvgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 24 24" width="48" height="48"><g><path d="M0 0h24v24h-24Z" fill="none"/><path fill="#fff" d="M12 3c-3.796 0-6.873 3.077-6.873 6.873v.172c0 3.461 4.382 8.671 6.148 10.631.389.432 1.061.432 1.45 0 1.766-1.96 6.148-7.17 6.148-10.631v-.172c0-3.796-3.077-6.873-6.873-6.873z"/><path stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4468" fill="none" d="M5.127 10.045v-.172c0-3.796 3.077-6.873 6.873-6.873v0c3.796 0 6.873 3.077 6.873 6.873v.172c0 3.461-4.382 8.671-6.148 10.631 -.389.432-1.061.432-1.45 0 -1.766-1.96-6.148-7.17-6.148-10.631Z"/><path stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4468" fill="none" d="M10 9.955c0 1.105.895 2 2 2v0c1.105 0 2-.895 2-2v-.037c0-1.105-.895-2-2-2v0c-1.105 0-2 .895-2 2"/></g></svg>`;

            const marker = new google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: map,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvgString),
                scaledSize: new google.maps.Size(32, 32),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(16, 30)
              },
              title: 'Fishing Charter Location'
            });
          }
        };

        // Geocode the address to get coordinates
        if (window.google && window.google.maps) {
          geocodeAddress();
        } else {
          // Load Google Maps script first
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          script.async = true;
          script.onload = geocodeAddress;
          document.head.appendChild(script);
        }

        function geocodeAddress() {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: charter.address }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location;
              const latitude = location.lat();
              const longitude = location.lng();
              initializeMap(latitude, longitude);
            } else {

              // Hide map if geocoding fails
              mapElement.style.display = 'none';
            }
          });
        }
      }

      // Filter management methods
      clearDatesFilter() {
        // Close all popups
        this.closeAllPopups();

        this.selectedDates = [];
        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.updateDateButtonStyles();
        this.updatePrivateDockFilterAvailability(); // Update private dock when dates cleared
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearGuestsFilter() {
        // Close all popups
        this.closeAllPopups();

        this.selectedGuests = 0;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();
        this.updateFilterStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearPriceFilter() {
        // Close all popups
        this.closeAllPopups();

        // Reset price filter to default values
        this.priceMin = 0;
        this.priceMax = 5000;

        // Update slider if it exists
        if (this.priceScrollBar) {
          const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
          const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = 5000;

          // Trigger update
          const updateEvent = new Event('input');
          if (sliderMin) sliderMin.dispatchEvent(updateEvent);
        }

        // Update UI elements
        if (this.priceMinInput) this.priceMinInput.value = '$0';
        if (this.priceMaxInput) this.priceMaxInput.value = '$5,000+';
        this.updatePriceFilterText();
        this.updateFilterStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearFishingTypeFilter() {
        // Close all popups
        this.closeAllPopups();

        // Reset fishing type filter
        this.selectedFishingTypes = [];

        // Reset checkbox styles
        Object.values(this.fishingTypes).forEach(checkbox => {
          if (checkbox) {
            checkbox.style.backgroundColor = '';
          }
        });

        // Update UI elements
        this.updateFishingTypeFilterText();
        this.updateFilterStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearPrivateDockFilter() {
        // Close all popups
        this.closeAllPopups();

        this.selectedPrivateDock = false;
        this.updatePrivateDockFilterText();
        this.updateFilterStyles();
        this.renderDateSelection(); // Re-render dates to remove disabled state from check-in/out
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      // Update private dock filter availability based on selected dates
      updatePrivateDockFilterAvailability() {
        if (!this.privateDockFilter) return;

        const hasCheckInOut = this.hasCheckInOrCheckOutSelected();

        if (hasCheckInOut) {
          // Disable private dock filter
          this.privateDockFilter.setAttribute('data-disabled', 'true');
          this.privateDockFilter.style.backgroundColor = '#f5f5f5';
          this.privateDockFilter.style.color = '#999';
          this.privateDockFilter.style.cursor = 'default';
          this.privateDockFilter.style.opacity = '0.5';

          // If private dock was selected, deselect it
          if (this.selectedPrivateDock) {
            this.selectedPrivateDock = false;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.refilterChartersIfModalOpen();
          }
        } else {
          // Enable private dock filter
          this.privateDockFilter.removeAttribute('data-disabled');
          this.privateDockFilter.style.cursor = 'pointer';
          this.privateDockFilter.style.opacity = '1';

          // Only reset colors if not selected - let updateFilterStyles handle selected state
          if (!this.selectedPrivateDock) {
            this.privateDockFilter.style.backgroundColor = '';
            this.privateDockFilter.style.color = '';
          }
        }
      }

      // Filter text update methods
      updateDatesFilterText() {
        if (!this.datesText) return;

        if (this.selectedDates.length === 0) {
          this.datesText.textContent = 'Add Dates';
        } else if (this.selectedDates.length === 1) {
          this.datesText.textContent = this.formatDateForDisplay(this.selectedDates[0]);
        } else if (this.selectedDates.length === 2) {
          const startDate = this.formatDateForDisplay(this.selectedDates[0]);
          const endDate = this.formatDateForDisplay(this.selectedDates[1]);
          this.datesText.textContent = `${startDate}, ${endDate}`;
        } else if (this.selectedDates.length === 3) {
          const startDate = this.formatDateForDisplay(this.selectedDates[0]);
          const secondDate = this.formatDateForDisplay(this.selectedDates[1]);
          const endDate = this.formatDateForDisplay(this.selectedDates[2]);
          this.datesText.textContent = `${startDate}, ${secondDate}, ${endDate}`;
        } else {
          this.datesText.textContent = `${this.selectedDates.length} dates selected`;
        }
      }

      updateGuestsFilterText() {
        if (!this.guestsText) return;

        if (this.selectedGuests === 0) {
          this.guestsText.textContent = 'Add Guests';
        } else {
          this.guestsText.textContent = `${this.selectedGuests} guest${this.selectedGuests !== 1 ? 's' : ''}`;
        }
      }

      updatePriceFilterText() {
        if (!this.priceText) return;

        if (this.priceMin === 0 && this.priceMax === 5000) {
          this.priceText.textContent = 'Price Range';
        } else if (this.priceMin > 0 && this.priceMax === 5000) {
          // User only set minimum price, show as "min+"
          this.priceText.textContent = `$${this.priceMin.toLocaleString()}+`;
        } else if (this.priceMin === 0 && this.priceMax < 5000) {
          // User only set maximum price, show as "0 - max"
          this.priceText.textContent = `$0 - $${this.priceMax.toLocaleString()}`;
        } else {
          // User set both min and max, show range
          this.priceText.textContent = `$${this.priceMin.toLocaleString()} - $${this.priceMax.toLocaleString()}`;
        }
      }

      updateFishingTypeFilterText() {
        if (!this.typeText) return;

        if (this.selectedFishingTypes.length === 0) {
          this.typeText.textContent = 'Fishing Type';
        } else if (this.selectedFishingTypes.length === 1) {
          const typeLabels = {
            inshore: 'Inshore',
            offshore: 'Offshore',
            near: 'Nearshore',
            wreck: 'Wreck',
            reef: 'Reef',
            flats: 'Flats'
          };
          this.typeText.textContent = typeLabels[this.selectedFishingTypes[0]] || this.selectedFishingTypes[0];
        } else {
          this.typeText.textContent = `${this.selectedFishingTypes.length} Types`;
        }
      }

      updatePrivateDockFilterText() {
        if (!this.privateDockText) return;

        if (this.selectedPrivateDock) {
          this.privateDockText.textContent = 'Private Dock Pickup';
        } else {
          this.privateDockText.textContent = 'Private Dock Pickup';
        }
      }

      updateFilterStyles() {
        // Update dates filter button style
        if (this.datesFilter && this.datesText) {
          const hasDatesFilter = this.selectedDates.length > 0;

          if (hasDatesFilter) {
            this.datesFilter.style.backgroundColor = '#000000';
            this.datesFilter.style.color = '#ffffff';
            this.datesText.style.color = '#ffffff';
          } else {
            this.datesFilter.style.backgroundColor = '';
            this.datesFilter.style.color = '';
            this.datesText.style.color = '';
          }
        }

        // Update guests filter button style
        if (this.guestsFilter && this.guestsText) {
          const hasGuestsFilter = this.selectedGuests > 0;

          if (hasGuestsFilter) {
            this.guestsFilter.style.backgroundColor = '#000000';
            this.guestsFilter.style.color = '#ffffff';
            this.guestsText.style.color = '#ffffff';
          } else {
            this.guestsFilter.style.backgroundColor = '';
            this.guestsFilter.style.color = '';
            this.guestsText.style.color = '';
          }
        }

        // Update price filter button style
        if (this.priceFilter && this.priceText) {
          const hasPriceFilter = this.priceMin > 0 || this.priceMax < 5000;

          if (hasPriceFilter) {
            this.priceFilter.style.backgroundColor = '#000000';
            this.priceFilter.style.color = '#ffffff';
            this.priceText.style.color = '#ffffff';
          } else {
            this.priceFilter.style.backgroundColor = '';
            this.priceFilter.style.color = '';
            this.priceText.style.color = '';
          }
        }

        // Update fishing type filter button style
        if (this.typeFilter && this.typeText) {
          const hasTypeFilter = this.selectedFishingTypes.length > 0;

          if (hasTypeFilter) {
            this.typeFilter.style.backgroundColor = '#000000';
            this.typeFilter.style.color = '#ffffff';
            this.typeText.style.color = '#ffffff';
          } else {
            this.typeFilter.style.backgroundColor = '';
            this.typeFilter.style.color = '';
            this.typeText.style.color = '';
          }
        }

        // Update private dock filter button style
        if (this.privateDockFilter && this.privateDockText) {
          if (this.selectedPrivateDock) {
            this.privateDockFilter.style.backgroundColor = '#000000';
            this.privateDockFilter.style.color = '#ffffff';
            this.privateDockText.style.color = '#ffffff';
          } else {
            this.privateDockFilter.style.backgroundColor = '';
            this.privateDockFilter.style.color = '';
            this.privateDockText.style.color = '';
          }
        }

        // Update X button visibility
        this.updateXButtonVisibility();
      }

      updateXButtonVisibility() {
        // Update X button visibility based on whether filters are active
        if (this.datesX) {
          this.datesX.style.display = this.selectedDates.length > 0 ? 'flex' : 'none';
        }
        if (this.guestsX) {
          this.guestsX.style.display = this.selectedGuests > 0 ? 'flex' : 'none';
        }
        if (this.priceX) {
          this.priceX.style.display = (this.priceMin > 0 || this.priceMax < 5000) ? 'flex' : 'none';
        }
        if (this.typeX) {
          this.typeX.style.display = this.selectedFishingTypes.length > 0 ? 'flex' : 'none';
        }
        if (this.privateDockX) {
          this.privateDockX.style.display = this.selectedPrivateDock ? 'flex' : 'none';
        }
      }

      updateButtonState() {
        // Update button state based on current selections
        const hasCharters = this.hasAnyFishingCharters();

        // Always keep all buttons visible at the bottom
        this.buttons.forEach(button => {
          if (button) {
            button.style.display = 'flex';
          }
        });

        if (hasCharters) {
          this.selectedFishingCharterBlocks.forEach(block => {
            if (block) {
              block.style.display = 'flex';
            }
          });
        } else {
          this.selectedFishingCharterBlocks.forEach(templateBlock => {
            if (!templateBlock) return;

            const container = templateBlock.parentElement;
            if (!container) {
              templateBlock.style.display = 'none';
              return;
            }

            // Remove ALL existing cloned blocks
            const existingBlocks = container.querySelectorAll('[data-element="selectedFishingCharterBlock"]');
            existingBlocks.forEach((block, index) => {
              if (index !== 0) {
                // Remove cloned blocks
                block.remove();
              } else {
                // Hide template block
                block.style.display = 'none';
              }
            });
          });
        }
      }

      setupDateParameterMonitoring() {
        // Store current parameter values
        let lastCheckin = '';
        let lastCheckout = '';

        // Check for parameter changes every second
        const checkParameters = () => {
          const urlParams = new URLSearchParams(window.location.search);
          const currentCheckin = urlParams.get('checkin') || '';
          const currentCheckout = urlParams.get('checkout') || '';

          // If checkin or checkout parameters have changed
          if (currentCheckin !== lastCheckin || currentCheckout !== lastCheckout) {
            lastCheckin = currentCheckin;
            lastCheckout = currentCheckout;

            // Only re-initialize from URL if we're not adding a new charter
            // (i.e., if modal is closed or we're editing an existing charter)
            const isModalOpenForNewCharter = this.modal && this.modal.style.display === 'flex' && !this.editingCharterNumber;

            if (!isModalOpenForNewCharter) {
              // Re-initialize from URL parameters
              this.initializeFromURL();
            }

            // Re-initialize date selection functionality
            this.renderDateSelection();
            // Note: Button availability handled by centralized system
            this.updateDatesFilterText();
            this.updateFilterStyles();
            this.updatePrivateDockFilterAvailability(); // Update private dock when dates change

            // Also update details section if it exists
            this.renderDetailsDateSelection();
            this.updateDetailsDateFilterText();
            this.updateDetailsFilterStyles();
            this.updateDetailsPrivateDockFilterAvailability(); // Update details private dock
          }
        };

        // Check initially and then every second
        checkParameters();
        setInterval(checkParameters, 1000);
      }

      refilterChartersIfModalOpen() {
        // If modal is open, refilter and re-render charters
        if (this.modal && this.modal.style.display === 'flex' && this.allFishingCharters.length > 0) {
          const filteredCharters = this.filterFishingCharters(this.allFishingCharters);
          this.renderFishingCharterCards(filteredCharters);
        }
      }

      formatDateForDisplay(dateStr) {
        // Manual date formatting to avoid timezone issues
        // dateStr is in format YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1]} ${day}`;
      }

      getMonthYearHeader(startDateStr, endDateStr) {
        const [startYear, startMonth] = startDateStr.split('-').map(Number);
        const [endYear, endMonth] = endDateStr.split('-').map(Number);

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];

        const startMonthName = monthNames[startMonth - 1];
        const endMonthName = monthNames[endMonth - 1];

        // Same month and year
        if (startMonth === endMonth && startYear === endYear) {
          return `${startMonthName} ${startYear}`;
        }
        // Different months, same year
        else if (startYear === endYear) {
          return `${startMonthName} & ${endMonthName} ${startYear}`;
        }
        // Different years
        else {
          return `${startMonthName} ${startYear} & ${endMonthName} ${endYear}`;
        }
      }

      renderDateSelection() {
        if (!this.datesPopupSelectDates) return;

        const { checkin, checkout } = this.getCheckInOutDates();

        if (!checkin || !checkout) return;

        this.datesPopupSelectDates.innerHTML = '';

        const dateArray = this.generateDateRange(checkin, checkout);

        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

        // Create month/year header
        const monthYearHeader = document.createElement('div');
        monthYearHeader.textContent = this.getMonthYearHeader(checkin, checkout);
        monthYearHeader.style.fontSize = '16px';
        monthYearHeader.style.fontFamily = 'TT Fors, sans-serif';
        monthYearHeader.style.fontWeight = '500';
        monthYearHeader.style.color = '#000000';
        monthYearHeader.style.textAlign = 'center';
        monthYearHeader.style.marginBottom = '12px';
        calendarContainer.appendChild(monthYearHeader);

        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.gap = '6px';
        daysHeader.style.justifyItems = 'center';

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
          const dayHeader = document.createElement('div');
          dayHeader.textContent = day;
          dayHeader.style.fontSize = '12px';
          dayHeader.style.fontFamily = 'TT Fors, sans-serif';
          dayHeader.style.color = '#808080';
          dayHeader.style.textTransform = 'uppercase';
          daysHeader.appendChild(dayHeader);
        });

        calendarContainer.appendChild(daysHeader);

        const datesGrid = document.createElement('div');
        datesGrid.style.display = 'grid';
        datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesGrid.style.gap = '6px';
        datesGrid.style.justifyItems = 'center';

        const firstDateStr = dateArray[0];
        const emptyStartCells = this.getDayOfWeek(firstDateStr);

        for (let i = 0; i < emptyStartCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        // Use check-in and check-out dates for disabling when private dock is selected
        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          const isSelected = this.selectedDates.includes(dateStr);
          const isCheckIn = dateStr === checkin;
          const isCheckOut = dateStr === checkout;
          const isCheckInOrOut = isCheckIn || isCheckOut;

          // Disable check-in/out dates if private dock is selected
          if (this.selectedPrivateDock && isCheckInOrOut) {
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#999';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.setAttribute('data-disabled', 'true');

            // Show tooltip on hover or click
            const message = isCheckIn ? 'Private dock pickup is not available on check-in date' : 'Private dock pickup is not available on departure date';

            dateBtn.addEventListener('mouseenter', () => {
              this.showTooltipMessage(dateBtn, message);
            });

            dateBtn.addEventListener('mouseleave', () => {
              this.hideTooltipMessage();
            });

            dateBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showTooltipMessage(dateBtn, message);
            });
          } else {
            // Normal date button
            if (isSelected) {
              dateBtn.style.background = '#000000';
              dateBtn.style.color = 'white';
            } else {
              dateBtn.style.background = 'white';
              dateBtn.style.color = 'black';
            }

            dateBtn.style.cursor = 'pointer';

            dateBtn.addEventListener('click', () => {
              this.handleDateSelection(dateStr);
            });
          }

          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          datesGrid.appendChild(dateBtn);
        });

        const lastDateStr = dateArray[dateArray.length - 1];
        const emptyEndCells = 6 - this.getDayOfWeek(lastDateStr);

        for (let i = 0; i < emptyEndCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        calendarContainer.appendChild(datesGrid);
        this.datesPopupSelectDates.appendChild(calendarContainer);
      }

      getDayOfWeek(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);

        let adjustedMonth = month;
        let adjustedYear = year;

        if (month < 3) {
          adjustedMonth += 12;
          adjustedYear -= 1;
        }

        const q = day;
        const m = adjustedMonth;
        const k = adjustedYear % 100;
        const j = Math.floor(adjustedYear / 100);

        const h = (q + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;

        return (h + 6) % 7;
      }

      handleDateSelection(dateStr) {
        if (this.selectedDates.includes(dateStr)) {
          this.selectedDates = this.selectedDates.filter(date => date !== dateStr);
        } else {
          this.selectedDates.push(dateStr);
          this.selectedDates.sort();
        }

        this.updateDateButtonStyles();
        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.updatePrivateDockFilterAvailability(); // Update private dock based on selected dates
        this.refilterChartersIfModalOpen();
      }

      generateDateRange(startDateStr, endDateStr) {
        const dateRange = [];

        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

        let currentYear = startYear;
        let currentMonth = startMonth;
        let currentDay = startDay;

        while (true) {
          const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          dateRange.push(currentDateStr);

          if (currentDateStr === endDateStr) break;

          currentDay++;

          const daysInMonth = this.getDaysInMonth(currentYear, currentMonth);
          if (currentDay > daysInMonth) {
            currentDay = 1;
            currentMonth++;

            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            }
          }
        }

        return dateRange;
      }

      getDaysInMonth(year, month) {
        const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (month === 2 && this.isLeapYear(year)) {
          return 29;
        }

        return daysInMonths[month - 1];
      }

      isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      }

      updateDateButtonStyles() {
        if (!this.datesPopupSelectDates) return;

        const dateButtons = this.datesPopupSelectDates.querySelectorAll('button');

        dateButtons.forEach(btn => {
          const btnDateStr = btn.getAttribute('data-date');

          // Skip buttons that are disabled (check-in/out when private dock selected)
          if (btn.hasAttribute('data-disabled')) {
            return;
          }

          if (btnDateStr && this.selectedDates.includes(btnDateStr)) {
            btn.style.background = '#000000';
            btn.style.color = 'white';
            btn.style.borderColor = '#000000';
          } else if (btnDateStr) {
            btn.style.background = 'white';
            btn.style.color = 'black';
            btn.style.borderColor = '#ddd';
          }
        });
      }

      // Details Section Methods

      setupViewTripsButton() {
        if (!this.detailsViewTripsButton) return;

        this.detailsViewTripsButton.addEventListener('click', () => {
          if (this.detailsContentContainer && this.detailsTripTypeContainer) {
            this.detailsTripTypeContainer.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      transferValuesToDetails() {
        // Transfer dates
        this.detailsSelectedDates = [...this.selectedDates];
        this.updateDetailsDateFilterText();

        // Transfer guests
        this.detailsSelectedGuests = this.selectedGuests;
        if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
        this.updateDetailsGuestsFilterText();

        // Transfer private dock
        this.detailsSelectedPrivateDock = this.selectedPrivateDock;
        this.updateDetailsPrivateDockFilterText();

        this.updateDetailsFilterStyles();
        this.updateDetailsPrivateDockFilterAvailability(); // Update availability based on dates
        this.renderDetailsDateSelection();
      }

      transferValuesToMain() {
        // Transfer dates
        this.selectedDates = [...this.detailsSelectedDates];
        this.updateDatesFilterText();

        // Transfer guests
        this.selectedGuests = this.detailsSelectedGuests;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();

        // Transfer private dock
        this.selectedPrivateDock = this.detailsSelectedPrivateDock;
        this.updatePrivateDockFilterText();

        this.updateFilterStyles();
        this.updatePrivateDockFilterAvailability(); // Update availability based on dates
        this.updateDateButtonStyles();
        this.renderDateSelection();
      }

      setupDetailsFilterHandlers() {
        const closeAllDetailsPopups = () => {
          if (this.detailsDatesPopup) this.detailsDatesPopup.style.display = 'none';
          if (this.detailsGuestsPopup) this.detailsGuestsPopup.style.display = 'none';
        };

        // Details dates filter handlers
        if (this.detailsDatesFilter) {
          this.detailsDatesFilter.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDetailsPopups();
            if (this.detailsDatesPopup) {
              // Only move to body on mobile (991px and below) where popup is position: fixed
              if (window.innerWidth <= 991) {
                // Store original parent to restore later
                if (!this.detailsDatesPopup._originalParent) {
                  this.detailsDatesPopup._originalParent = this.detailsDatesPopup.parentElement;
                }

                // Move popup to body to escape stacking context (mobile fix)
                document.body.appendChild(this.detailsDatesPopup);


              }

              this.detailsDatesPopup.style.display = 'flex';
            } else {

            }
          });
        } else {

        }

        if (this.detailsDatesPopupExit) {
          this.detailsDatesPopupExit.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.detailsDatesPopup) this.detailsDatesPopup.style.display = 'none';
          });
        }

        // Details guests filter handlers
        if (this.detailsGuestsFilter) {
          this.detailsGuestsFilter.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDetailsPopups();
            if (this.detailsGuestsPopup) {
              // Only move to body on mobile (991px and below) where popup is position: fixed
              if (window.innerWidth <= 991) {
                // Store original parent to restore later
                if (!this.detailsGuestsPopup._originalParent) {
                  this.detailsGuestsPopup._originalParent = this.detailsGuestsPopup.parentElement;
                }

                // Move popup to body to escape stacking context (mobile fix)
                document.body.appendChild(this.detailsGuestsPopup);

              }

              this.detailsGuestsPopup.style.display = 'flex';
            } else {

            }
          });
        } else {

        }

        if (this.detailsGuestsPopupExit) {
          this.detailsGuestsPopupExit.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.detailsGuestsPopup) this.detailsGuestsPopup.style.display = 'none';
          });
        }

        // Details private dock filter
        if (this.detailsPrivateDockFilter) {
          this.detailsPrivateDockFilter.addEventListener('click', (e) => {
            e.stopPropagation();

            // Check if disabled
            if (this.detailsPrivateDockFilter.hasAttribute('data-disabled')) {
              this.showTooltipMessage(this.detailsPrivateDockFilter, 'Not available on check-in/departure dates');
              return;
            }

            this.detailsSelectedPrivateDock = !this.detailsSelectedPrivateDock;
            // Sync with main filter variable
            this.selectedPrivateDock = this.detailsSelectedPrivateDock;
            this.updateDetailsPrivateDockFilterText();
            this.updateDetailsFilterStyles();
            this.renderDetailsDateSelection(); // Re-render dates to show disabled check-in/out if private dock selected
            this.renderTripTypes(this.currentCharterData);
          });

          // Show tooltip on hover when disabled
          this.detailsPrivateDockFilter.addEventListener('mouseenter', () => {
            if (this.detailsPrivateDockFilter.hasAttribute('data-disabled')) {
              this.showTooltipMessage(this.detailsPrivateDockFilter, 'Not available on check-in/departure dates');
            }
          });

          this.detailsPrivateDockFilter.addEventListener('mouseleave', () => {
            if (this.detailsPrivateDockFilter.hasAttribute('data-disabled')) {
              this.hideTooltipMessage();
            }
          });
        }
      }

      setupDetailsGuestButtons() {
        if (!this.detailsGuestMinus || !this.detailsGuestPlus) return;

        // Style and setup minus button
        this.detailsGuestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleFishingCharterGuestButton(this.detailsGuestMinus);

        // Style and setup plus button
        this.detailsGuestPlus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 4.5L16.5 12L8.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleFishingCharterGuestButton(this.detailsGuestPlus);

        // Add event listeners
        this.detailsGuestMinus.addEventListener('click', () => {
          if (this.detailsSelectedGuests > 0) {
            this.detailsSelectedGuests--;
            // Sync with main filter variable
            this.selectedGuests = this.detailsSelectedGuests;
            if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
            this.updateDetailsGuestsFilterText();
            this.updateDetailsFilterStyles();
            this.renderTripTypes(this.currentCharterData);
          }
        });

        this.detailsGuestPlus.addEventListener('click', () => {
          // Check boat capacity limit
          const maxCapacity = this.currentCharterData && this.currentCharterData.boatInfo && this.currentCharterData.boatInfo[0]
            ? this.currentCharterData.boatInfo[0].boatCapacity
            : 99; // Default high limit if capacity not found

          if (this.detailsSelectedGuests < maxCapacity) {
            this.detailsSelectedGuests++;
            // Sync with main filter variable
            this.selectedGuests = this.detailsSelectedGuests;
            if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
            this.updateDetailsGuestsFilterText();
            this.updateDetailsFilterStyles();
            this.renderTripTypes(this.currentCharterData);
          }
        });

        if (this.detailsGuestsClearButton) {
          this.detailsGuestsClearButton.addEventListener('click', () => {
            this.clearDetailsGuestsFilter();
          });
        }
      }

      setupDetailsFilterXButtons() {
        if (this.detailsDatesX) {
          this.detailsDatesX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDetailsDateFilter();
          });
        }

        if (this.detailsGuestsX) {
          this.detailsGuestsX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDetailsGuestsFilter();
          });
        }

        if (this.detailsPrivateDockX) {
          this.detailsPrivateDockX.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearDetailsPrivateDockFilter();
          });
        }
      }

      clearDetailsDateFilter() {
        // Close all popups
        this.closeAllPopups();

        this.detailsSelectedDates = [];
        // Sync with main filter variable
        this.selectedDates = [];
        this.updateDetailsDateFilterText();
        this.updateDetailsFilterStyles();
        this.updateDetailsPrivateDockFilterAvailability(); // Update private dock when dates cleared
        this.renderDetailsDateSelection();
        this.renderTripTypes(this.currentCharterData);
      }

      // Update details private dock filter availability based on selected dates
      updateDetailsPrivateDockFilterAvailability() {
        if (!this.detailsPrivateDockFilter) return;

        const hasCheckInOut = this.hasCheckInOrCheckOutSelected();

        if (hasCheckInOut) {
          // Disable private dock filter
          this.detailsPrivateDockFilter.setAttribute('data-disabled', 'true');
          this.detailsPrivateDockFilter.style.backgroundColor = '#f5f5f5';
          this.detailsPrivateDockFilter.style.color = '#999';
          this.detailsPrivateDockFilter.style.cursor = 'default';
          this.detailsPrivateDockFilter.style.opacity = '0.5';

          // If private dock was selected, deselect it
          if (this.detailsSelectedPrivateDock) {
            this.detailsSelectedPrivateDock = false;
            this.selectedPrivateDock = false;
            this.updateDetailsPrivateDockFilterText();
            this.updateDetailsFilterStyles();
            this.renderTripTypes(this.currentCharterData);
          }
        } else {
          // Enable private dock filter
          this.detailsPrivateDockFilter.removeAttribute('data-disabled');
          this.detailsPrivateDockFilter.style.cursor = 'pointer';
          this.detailsPrivateDockFilter.style.opacity = '1';

          // Only reset colors if not selected - let updateDetailsFilterStyles handle selected state
          if (!this.detailsSelectedPrivateDock) {
            this.detailsPrivateDockFilter.style.backgroundColor = '';
            this.detailsPrivateDockFilter.style.color = '';
          }
        }
      }

      clearDetailsGuestsFilter() {
        // Close all popups
        this.closeAllPopups();

        this.detailsSelectedGuests = 0;
        // Sync with main filter variable
        this.selectedGuests = 0;
        if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
        this.updateDetailsGuestsFilterText();
        this.updateDetailsFilterStyles();
        this.renderTripTypes(this.currentCharterData);
      }

      clearDetailsPrivateDockFilter() {
        // Close all popups
        this.closeAllPopups();

        this.detailsSelectedPrivateDock = false;
        // Sync with main filter variable
        this.selectedPrivateDock = false;
        this.updateDetailsPrivateDockFilterText();
        this.updateDetailsFilterStyles();
        this.renderDetailsDateSelection(); // Re-render dates to remove disabled state from check-in/out
        this.renderTripTypes(this.currentCharterData);
      }

      updateDetailsDateFilterText() {
        if (!this.detailsDatesText) return;

        if (this.detailsSelectedDates.length === 0) {
          this.detailsDatesText.textContent = 'Select dates';
        } else if (this.detailsSelectedDates.length === 1) {
          this.detailsDatesText.textContent = this.formatDateForDisplay(this.detailsSelectedDates[0]);
        } else if (this.detailsSelectedDates.length === 2) {
          const startDate = this.formatDateForDisplay(this.detailsSelectedDates[0]);
          const endDate = this.formatDateForDisplay(this.detailsSelectedDates[1]);
          this.detailsDatesText.textContent = `${startDate} - ${endDate}`;
        } else {
          const startDate = this.formatDateForDisplay(this.detailsSelectedDates[0]);
          const secondDate = this.formatDateForDisplay(this.detailsSelectedDates[1]);
          const endDate = this.formatDateForDisplay(this.detailsSelectedDates[2]);
          this.detailsDatesText.textContent = `${startDate}, ${secondDate} +${this.detailsSelectedDates.length - 2} more`;
        }
      }

      updateDetailsGuestsFilterText() {
        if (!this.detailsGuestsText) return;

        if (this.detailsSelectedGuests === 0) {
          this.detailsGuestsText.textContent = 'Add guests';
        } else {
          this.detailsGuestsText.textContent = `${this.detailsSelectedGuests} guest${this.detailsSelectedGuests !== 1 ? 's' : ''}`;
        }
      }

      updateDetailsPrivateDockFilterText() {
        if (!this.detailsPrivateDockText) return;

        if (this.detailsSelectedPrivateDock) {
          this.detailsPrivateDockText.textContent = 'Private dock pickup';
        } else {
          this.detailsPrivateDockText.textContent = 'Private dock pickup';
        }
      }

      updateDetailsFilterStyles() {
        // Update dates filter button style
        if (this.detailsDatesFilter && this.detailsDatesText) {
          const hasDatesFilter = this.detailsSelectedDates.length > 0;

          if (hasDatesFilter) {
            this.detailsDatesFilter.style.backgroundColor = '#000000';
            this.detailsDatesFilter.style.color = '#ffffff';
            this.detailsDatesText.style.color = '#ffffff';
          } else {
            this.detailsDatesFilter.style.backgroundColor = '';
            this.detailsDatesFilter.style.color = '';
            this.detailsDatesText.style.color = '';
          }
        }

        // Update guests filter button style
        if (this.detailsGuestsFilter && this.detailsGuestsText) {
          const hasGuestsFilter = this.detailsSelectedGuests > 0;

          if (hasGuestsFilter) {
            this.detailsGuestsFilter.style.backgroundColor = '#000000';
            this.detailsGuestsFilter.style.color = '#ffffff';
            this.detailsGuestsText.style.color = '#ffffff';
          } else {
            this.detailsGuestsFilter.style.backgroundColor = '';
            this.detailsGuestsFilter.style.color = '';
            this.detailsGuestsText.style.color = '';
          }
        }

        // Update private dock filter button style
        if (this.detailsPrivateDockFilter && this.detailsPrivateDockText) {
          if (this.detailsSelectedPrivateDock) {
            this.detailsPrivateDockFilter.style.backgroundColor = '#000000';
            this.detailsPrivateDockFilter.style.color = '#ffffff';
            this.detailsPrivateDockText.style.color = '#ffffff';
          } else {
            this.detailsPrivateDockFilter.style.backgroundColor = '';
            this.detailsPrivateDockFilter.style.color = '';
            this.detailsPrivateDockText.style.color = '';
          }
        }

        // Update X button visibility
        this.updateDetailsXButtonVisibility();

        // Update Add to Reservation button availability
        this.updateAddToReservationButtonsAvailability();
      }

      updateDetailsXButtonVisibility() {
        if (this.detailsDatesX) {
          this.detailsDatesX.style.display = this.detailsSelectedDates.length > 0 ? 'flex' : 'none';
        }
        if (this.detailsGuestsX) {
          this.detailsGuestsX.style.display = this.detailsSelectedGuests > 0 ? 'flex' : 'none';
        }
        if (this.detailsPrivateDockX) {
          this.detailsPrivateDockX.style.display = this.detailsSelectedPrivateDock ? 'flex' : 'none';
        }
      }

      renderDetailsDateSelection() {
        if (!this.detailsDatesPopupSelectDates) return;

        const { checkin, checkout } = this.getCheckInOutDates();

        if (!checkin || !checkout) return;

        this.detailsDatesPopupSelectDates.innerHTML = '';

        const dateArray = this.generateDateRange(checkin, checkout);

        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

        // Create month/year header
        const monthYearHeader = document.createElement('div');
        monthYearHeader.textContent = this.getMonthYearHeader(checkin, checkout);
        monthYearHeader.style.fontSize = '16px';
        monthYearHeader.style.fontFamily = 'TT Fors, sans-serif';
        monthYearHeader.style.fontWeight = '500';
        monthYearHeader.style.color = '#000000';
        monthYearHeader.style.textAlign = 'center';
        monthYearHeader.style.marginBottom = '12px';
        calendarContainer.appendChild(monthYearHeader);

        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.gap = '6px';
        daysHeader.style.justifyItems = 'center';

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
          const dayHeader = document.createElement('div');
          dayHeader.textContent = day;
          dayHeader.style.fontSize = '12px';
          dayHeader.style.fontFamily = 'TT Fors, sans-serif';
          dayHeader.style.color = '#808080';
          dayHeader.style.textTransform = 'uppercase';
          daysHeader.appendChild(dayHeader);
        });

        calendarContainer.appendChild(daysHeader);

        const datesGrid = document.createElement('div');
        datesGrid.style.display = 'grid';
        datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        datesGrid.style.gap = '6px';
        datesGrid.style.justifyItems = 'center';

        const firstDateStr = dateArray[0];
        const emptyStartCells = this.getDayOfWeek(firstDateStr);

        for (let i = 0; i < emptyStartCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        // Get reserved dates only for THIS specific charter
        // (not all other charters - users can book different charters on the same day)
        const reservedDatesForThisCharter = this.getReservedDatesForThisCharter();

        // Use check-in and check-out dates for disabling when private dock is selected
        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          // Check if this date is already reserved for THIS specific charter
          const isReserved = reservedDatesForThisCharter.includes(dateStr);
          const isSelected = this.detailsSelectedDates.includes(dateStr);
          const isCheckIn = dateStr === checkin;
          const isCheckOut = dateStr === checkout;
          const isCheckInOrOut = isCheckIn || isCheckOut;

          if (isReserved) {
            // Date is reserved for THIS charter already - disable it (takes priority over private dock logic)
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#999';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.disabled = true;
          } else if (this.detailsSelectedPrivateDock && isCheckInOrOut) {
            // Disable check-in/out dates if private dock is selected
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#999';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.setAttribute('data-disabled', 'true');

            // Show tooltip on hover or click
            const message = isCheckIn ? 'Not available on check-in date' : 'Not available on departure date';

            dateBtn.addEventListener('mouseenter', () => {
              this.showTooltipMessage(dateBtn, message);
            });

            dateBtn.addEventListener('mouseleave', () => {
              this.hideTooltipMessage();
            });

            dateBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showTooltipMessage(dateBtn, message);
            });
          } else {
            // Date is available or selected
            dateBtn.style.background = isSelected ? '#000000' : 'white';
            dateBtn.style.color = isSelected ? 'white' : 'black';
            dateBtn.style.cursor = 'pointer';
            dateBtn.addEventListener('click', () => {
              this.handleDetailsDateSelection(dateStr);
            });
          }

          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          datesGrid.appendChild(dateBtn);
        });

        const lastDateStr = dateArray[dateArray.length - 1];
        const emptyEndCells = 6 - this.getDayOfWeek(lastDateStr);

        for (let i = 0; i < emptyEndCells; i++) {
          const emptyCell = document.createElement('div');
          datesGrid.appendChild(emptyCell);
        }

        calendarContainer.appendChild(datesGrid);
        this.detailsDatesPopupSelectDates.appendChild(calendarContainer);
      }

      handleDetailsDateSelection(dateStr) {
        const index = this.detailsSelectedDates.indexOf(dateStr);

        if (index === -1) {
          // Add date
          this.detailsSelectedDates.push(dateStr);
          this.detailsSelectedDates.sort();
        } else {
          // Remove date
          this.detailsSelectedDates.splice(index, 1);
        }

        // Sync with main filter variable
        this.selectedDates = [...this.detailsSelectedDates];

        // Clear error highlights first, before updating filter styles
        this.clearFishingCharterErrorHighlights();

        this.updateDetailsDateFilterText();
        this.updateDetailsFilterStyles();
        this.updateDetailsDateButtonStyles();
        this.updateDetailsPrivateDockFilterAvailability(); // Update private dock based on selected dates
        this.renderTripTypes(this.currentCharterData);

        // Call main updateURLParams method like main filters do
        // this.updateURLParams();
      }

      updateDetailsDateButtonStyles() {
        if (!this.detailsDatesPopupSelectDates) return;

        const dateButtons = this.detailsDatesPopupSelectDates.querySelectorAll('button');

        dateButtons.forEach(btn => {
          const btnDateStr = btn.getAttribute('data-date');

          // Skip buttons that are disabled (check-in/out when private dock selected, or reserved dates)
          if (btn.hasAttribute('data-disabled') || btn.disabled) {
            return;
          }

          if (btnDateStr && this.detailsSelectedDates.includes(btnDateStr)) {
            btn.style.background = '#000000';
            btn.style.color = 'white';
            btn.style.borderColor = '#000000';
          } else if (btnDateStr) {
            btn.style.background = 'white';
            btn.style.color = 'black';
            btn.style.borderColor = '#ddd';
          }
        });
      }

      renderTripTypes(charter) {
        if (!this.tripTypeTemplate || !this.tripTypeWrapper || !charter.tripOptions) return;

        // Clear existing trip type cards except template
        const existingCards = this.tripTypeWrapper.querySelectorAll('[data-element="fishingCharterDetails_tripType_card"]');
        existingCards.forEach((card, index) => {
          if (index > 0) card.remove();
        });

        // Filter trip options based on season and dates if selected
        let filteredTripOptions = charter.tripOptions.filter(trip => {
          return this.isTripSeasonValid(trip);
        });

        // Hide template if no valid trips
        if (filteredTripOptions.length === 0) {
          this.tripTypeTemplate.style.display = 'none';
          return;
        }

        // Render trip type cards
        filteredTripOptions.forEach((trip, index) => {
          let card;
          if (index === 0) {
            card = this.tripTypeTemplate;
          } else {
            card = this.tripTypeTemplate.cloneNode(true);
            this.tripTypeWrapper.appendChild(card);
          }

          card.style.display = 'flex';
          this.populateTripTypeCard(card, trip, charter);
        });
      }

      isTripSeasonValid(trip) {
        // If no dates selected, show all trips
        if (this.detailsSelectedDates.length === 0) return true;

        const seasonStart = trip.seasonStart || '1/1';
        const seasonEnd = trip.seasonEnd || '12/31';

        // If year-round (1/1 to 12/31), always valid
        if (seasonStart === '1/1' && seasonEnd === '12/31') return true;

        // Check if any selected date falls within the season
        return this.detailsSelectedDates.some(dateStr => {
          return this.isDateInSeason(dateStr, seasonStart, seasonEnd);
        });
      }

      isDateInSeason(dateStr, seasonStart, seasonEnd) {
        const date = new Date(dateStr);
        const currentYear = date.getFullYear();

        // Parse season dates
        const [startMonth, startDay] = seasonStart.split('/').map(Number);
        const [endMonth, endDay] = seasonEnd.split('/').map(Number);

        const seasonStartDate = new Date(currentYear, startMonth - 1, startDay);
        const seasonEndDate = new Date(currentYear, endMonth - 1, endDay);

        // Handle seasons that cross year boundary
        if (seasonStartDate > seasonEndDate) {
          // Season crosses New Year (e.g., Dec 1 - Feb 28)
          return date >= seasonStartDate || date <= seasonEndDate;
        } else {
          // Normal season within same year
          return date >= seasonStartDate && date <= seasonEndDate;
        }
      }

      populateTripTypeCard(card, trip, charter) {
        // Trip name
        const nameElement = card.querySelector('[data-element="fishingCharterDetails_tripType_name"]');
        if (nameElement) {
          nameElement.textContent = trip.name || '';
        }

        // Trip length and time
        const lengthTimeElement = card.querySelector('[data-element="fishingCharterDetails_tripType_lengthTime"]');
        if (lengthTimeElement) {
          const lengthText = `${trip.lengthOfTrip || 0} Hour Trip`;
          const timeText = this.formatMilitaryTime(trip.tripStartTime || 0);
          lengthTimeElement.textContent = `${lengthText}, starts at ${timeText}`;
        }

        // Seasonal info
        const seasonalElement = card.querySelector('[data-element="fishingCharterDetails_tripType_seasonal"]');
        if (seasonalElement) {
          if (trip.seasonStart === '1/1' && trip.seasonEnd === '12/31') {
            seasonalElement.style.display = 'none';
          } else {
            seasonalElement.style.display = 'block';
            const startDate = this.formatSeasonDate(trip.seasonStart);
            const endDate = this.formatSeasonDate(trip.seasonEnd);
            seasonalElement.textContent = `Seasonal trip ${startDate} - ${endDate}`;
          }
        }

        // Price calculation
        const priceElement = card.querySelector('[data-element="fishingCharterDetails_tripType_price"]');
        const pricePeopleElement = card.querySelector('[data-element="fishingCharterDetails_tripType_pricePeople"]');

        const basePeople = trip.pricePeople || 1;
        const basePrice = trip.price || 0;

        // Only update price if guests exceed the base pricePeople
        if (this.detailsSelectedGuests > basePeople) {
          const calculatedPrice = this.calculateTripPrice(trip, charter);
          const peopleCount = this.calculatePeopleCount(trip);

          if (priceElement) {
            priceElement.textContent = `$${calculatedPrice.toLocaleString()}`;
          }

          if (pricePeopleElement) {
            pricePeopleElement.textContent = `Price for ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`;
          }
        } else {
          // Show base price for base number of people
          let displayPrice = basePrice;

          // Add private dock fee if selected
          if (this.detailsSelectedPrivateDock && charter.privateDockPickup && charter.privateDockPickupFee) {
            displayPrice += charter.privateDockPickupFee;
          }

          // Multiply by number of selected dates
          if (this.detailsSelectedDates.length > 0) {
            displayPrice *= this.detailsSelectedDates.length;
          }

          // Apply service fee if integration type is not "Manual"
          if (charter.integration_type !== 'Manual' && charter.serviceFee) {
            displayPrice = displayPrice * (1 + charter.serviceFee);
          }

          if (priceElement) {
            priceElement.textContent = `$${displayPrice.toLocaleString()}`;
          }

          if (pricePeopleElement) {
            pricePeopleElement.textContent = `Price for ${basePeople} ${basePeople === 1 ? 'person' : 'people'}`;
          }
        }

        // Show trip details button
        const showDetailsButton = card.querySelector('[data-element="fishingCharterDetails_tripType_showTripDetails"]');
        const descriptionElement = card.querySelector('[data-element="fishingCharterDetails_tripType_description"]');
        const targetedFishContainer = card.querySelector('[data-element="fishingCharterDetails_tripType_targetedFishContainer"]');

        // Hide show details button if no description or targeted fish
        const hasDescription = trip.description && trip.description.trim() !== '';
        const hasTargetedFish = trip.targetedFish && trip.targetedFish.length > 0;

        if (showDetailsButton) {
          if (!hasDescription && !hasTargetedFish) {
            showDetailsButton.style.display = 'none';
          } else {
            showDetailsButton.style.display = 'flex';
          }
        }

        if (showDetailsButton && descriptionElement && (hasDescription || hasTargetedFish)) {
          // Initially hide details
          descriptionElement.style.display = 'none';
          if (targetedFishContainer) targetedFishContainer.style.display = 'none';

          // Remove any existing event listeners by cloning and replacing the button
          const newShowDetailsButton = showDetailsButton.cloneNode(true);
          showDetailsButton.parentNode.replaceChild(newShowDetailsButton, showDetailsButton);
          newShowDetailsButton.textContent = 'Show trip details';

          newShowDetailsButton.addEventListener('click', () => {
            const isHidden = descriptionElement.style.display === 'none';

            if (isHidden) {
              if (hasDescription) {
                descriptionElement.style.display = 'flex';
              }
              if (targetedFishContainer && hasTargetedFish) {
                targetedFishContainer.style.display = 'flex';
                this.populateTargetedFish(targetedFishContainer, trip.targetedFish);
              }
              newShowDetailsButton.textContent = 'Show less';
            } else {
              descriptionElement.style.display = 'none';
              if (targetedFishContainer) targetedFishContainer.style.display = 'none';
              newShowDetailsButton.textContent = 'Show trip details';
            }
          });

          // Populate description
          if (descriptionElement && hasDescription) {
            descriptionElement.textContent = trip.description || '';
          }
        }

        // Add to reservation button
        const addToReservationButton = card.querySelector('[data-element="fishingCharterDetails_tripType_addToReservationButton"]');
        if (addToReservationButton) {
          // Remove any existing event listeners to prevent duplicates
          const newButton = addToReservationButton.cloneNode(true);
          addToReservationButton.parentNode.replaceChild(newButton, addToReservationButton);

          // Add click handler to the new button
          newButton.addEventListener('click', () => {
            this.handleAddToReservation(charter.id, trip);
          });
        }
      }

      formatMilitaryTime(time) {
        const hour = Math.floor(time);
        const minute = Math.round((time - hour) * 60);

        let period = 'am';
        let displayHour = hour;

        if (hour >= 12) {
          period = 'pm';
          if (hour > 12) displayHour = hour - 12;
        }
        if (hour === 0) displayHour = 12;

        const minuteStr = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '';
        return `${displayHour}${minuteStr}${period}`;
      }

      formatSeasonDate(dateStr) {
        const [month, day] = dateStr.split('/').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[month - 1]} ${day}`;
      }

      calculateTripPrice(trip, charter) {
        let basePrice = trip.price || 0;
        const basePeople = trip.pricePeople || 1;
        const additionalPersonRate = trip.pricePerAdditionalPerson || 0;

        // Calculate additional people cost
        if (this.detailsSelectedGuests > basePeople && additionalPersonRate > 0) {
          const additionalPeople = this.detailsSelectedGuests - basePeople;
          basePrice += (additionalPeople * additionalPersonRate);
        }

        // Add private dock pickup fee if selected
        if (this.detailsSelectedPrivateDock && charter.privateDockPickup && charter.privateDockPickupFee) {
          basePrice += charter.privateDockPickupFee;
        }

        // Multiply by number of selected dates
        if (this.detailsSelectedDates.length > 0) {
          basePrice *= this.detailsSelectedDates.length;
        }

        // Apply service fee if integration type is not "Manual"
        if (charter.integration_type !== 'Manual' && charter.serviceFee) {
          basePrice = basePrice * (1 + charter.serviceFee);
        }

        return basePrice;
      }

      calculatePeopleCount(trip) {
        if (this.detailsSelectedGuests > 0) {
          return this.detailsSelectedGuests;
        }
        return trip.pricePeople || 1;
      }

      populateTargetedFish(container, targetedFish) {
        const cardTemplate = container.querySelector('[data-element="fishingCharterDetails_tripType_targetedFishCard"]');
        const cardContainer = container.querySelector('[data-element="fishingCharterDetails_tripType_targetedFishCardContainer"]');

        if (!cardTemplate || !cardContainer) return;

        // Clear existing cards except template
        const existingCards = cardContainer.querySelectorAll('[data-element="fishingCharterDetails_tripType_targetedFishCard"]');
        existingCards.forEach((card, index) => {
          if (index > 0) card.remove();
        });

        if (targetedFish.length === 0) {
          cardTemplate.style.display = 'none';
          return;
        }

        targetedFish.forEach((fish, index) => {
          let card;
          if (index === 0) {
            card = cardTemplate;
          } else {
            card = cardTemplate.cloneNode(true);
            cardContainer.appendChild(card);
          }

          card.style.display = 'flex';

          const textElement = card.querySelector('[data-element="fishingCharterDetails_tripType_targetedFishCardText"]');
          if (textElement) {
            textElement.textContent = fish.fish || '';
          }
        });
      }

      // Flash check availability button with red border to get user's attention
      flashCheckAvailabilityButton() {
        const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');

        if (!checkAvailabilityButtons.length) {
          return;
        }

        checkAvailabilityButtons.forEach((button, index) => {
          // Store original border styles
          const originalBorderColor = button.style.borderColor;
          const originalBorderWidth = button.style.borderWidth;
          const originalBorderStyle = button.style.borderStyle;

          // Set red border with individual properties for better CSS specificity
          button.style.borderColor = '#dc2626';
          button.style.borderWidth = '2px';
          button.style.borderStyle = 'solid';

          // Remove red border after 2 seconds
          setTimeout(() => {
            button.style.borderColor = originalBorderColor;
            button.style.borderWidth = originalBorderWidth;
            button.style.borderStyle = originalBorderStyle;
          }, 2000);
        });
      }

      // Highlight error fields in fishing charter details section
      highlightFishingCharterErrorFields(errorFields) {
        // Get the filter elements
        const datesFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_dates"]');
        const guestsFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guests"]');

        // Apply error styles to relevant fields
        errorFields.forEach(field => {
          let element = null;

          if (field === 'dates' && datesFilter) {
            element = datesFilter;
          } else if (field === 'guests' && guestsFilter) {
            element = guestsFilter;
          }

          if (element) {
            element.style.backgroundColor = '#fee2e2';
          }
        });

        // Scroll to the first error field
        if (errorFields.length > 0) {
          let firstErrorElement = null;

          if (errorFields[0] === 'dates' && datesFilter) {
            firstErrorElement = datesFilter;
          } else if (errorFields[0] === 'guests' && guestsFilter) {
            firstErrorElement = guestsFilter;
          }

          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      // Clear error highlights from fishing charter details fields
      clearFishingCharterErrorHighlights() {
        const datesFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_dates"]');
        const guestsFilter = document.querySelector('[data-element="fishingCharterDetailsModal_selectFishingCharter_guests"]');

        [datesFilter, guestsFilter].forEach(element => {
          if (element) {
            // Only clear error highlighting (red background), not the selected state (black background)
            // Check if element has error state before clearing
            if (element.style.backgroundColor === 'rgb(254, 226, 226)' || element.style.backgroundColor === '#fee2e2') {
              element.style.backgroundColor = '';
            }
            element.style.border = '';
          }
        });
      }

      async handleAddToReservation(charterId, trip) {
        // Prevent multiple rapid calls
        if (this.isAddingToReservation) {

          return;
        }
        this.isAddingToReservation = true;

        try {
          // Check if dates and guests are selected
          const needsDates = this.detailsSelectedDates.length === 0;
          const needsGuests = this.detailsSelectedGuests === 0;

          if (needsDates || needsGuests) {
            let message = 'Please select ';
            const errorFields = [];

            if (needsDates && needsGuests) {
              message += 'date(s) and guests';
              errorFields.push('dates', 'guests');
            } else if (needsDates) {
              message += 'date(s)';
              errorFields.push('dates');
            } else {
              message += 'guests';
              errorFields.push('guests');
            }

            this.showMessage(message + ' before adding to reservation.');

            // Highlight error fields
            this.highlightFishingCharterErrorFields(errorFields);

            return;
          }

          // Clear any error highlights since validation passed
          this.clearFishingCharterErrorHighlights();

          // Check if we're editing an existing charter or adding a new one
          let charterNumber;
          const url = new URL(window.location);

          if (this.editingCharterNumber) {
            // We're editing an existing charter, use the same number
            charterNumber = this.editingCharterNumber;
          } else {
            // We're adding a new charter, migrate legacy parameters and get next number
            this.migrateLegacyParameters();
            charterNumber = this.getNextFishingCharterNumber();
          }

          // Add/update numbered parameters to URL
          url.searchParams.set(`fishingCharterId${charterNumber}`, charterId);
          url.searchParams.set(`fishingCharterTripId${charterNumber}`, trip.id || '');
          url.searchParams.set(`fishingCharterGuests${charterNumber}`, this.detailsSelectedGuests.toString());
          url.searchParams.set(`fishingCharterDates${charterNumber}`, this.detailsSelectedDates.join(','));

          // Set pickup parameter based on private dock selection
          if (this.detailsSelectedPrivateDock) {
            url.searchParams.set(`fishingCharterPickup${charterNumber}`, 'true');
          } else if (this.detailsSelectedPickupTime) {
            url.searchParams.set(`fishingCharterPickup${charterNumber}`, this.detailsSelectedPickupTime);
          } else {
            url.searchParams.set(`fishingCharterPickup${charterNumber}`, '');
          }

          window.history.replaceState({}, '', url);

          await this.populateSelectedFishingCharterBlock();

          // Update pricing display for extras
          if (window.updatePricingDisplayForExtras) {
            await window.updatePricingDisplayForExtras();
          }

          // Update mobile handlers immediately after charter is added
          if (window.updateMobileHandlersState) {
            window.updateMobileHandlersState();
          }

          // Exit edit mode - user has successfully saved
          this.isEditMode = false;
          this.originalEditParams = null;

          // Reset editing state
          this.editingCharterNumber = null;
          this.editingTripId = null;

          // Close modal first without clearing filters (pass true to skip style updates)
          this.closeModal(true);

          // Clear all filters after modal is closed to avoid visual glitches
          this.clearDatesFilter();
          this.clearGuestsFilter();
          this.clearPriceFilter();
          this.clearFishingTypeFilter();
          this.clearPrivateDockFilter();
        } finally {
          // Reset the flag after a short delay to prevent legitimate consecutive calls
          setTimeout(() => {
            this.isAddingToReservation = false;
          }, 500);
        }
      }

      showMessage(message) {
        // Clear any existing message
        if (this.messageTimeout) {
          clearTimeout(this.messageTimeout);
        }

        // Create or get message element
        let messageElement = document.querySelector('.fishing-charter-message');
        if (!messageElement) {
          messageElement = document.createElement('div');
          messageElement.className = 'fishing-charter-message';
          document.body.appendChild(messageElement);

          // Add styles
          const style = document.createElement('style');
          style.textContent = `
            .fishing-charter-message {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #323232;
              color: white;
              padding: 12px 24px;
              border-radius: 5px;
              z-index: 10112;
              display: none;
              font-family: 'TT Fors', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            /* Mobile positioning - 10px above mobile charter button */
            @media (max-width: 990px) {
              .fishing-charter-message {
                top: auto;
                bottom: calc(70px + 10px);
                left: 50%;
                transform: translateX(-50%);
              }
            }
          `;
          document.head.appendChild(style);
        }

        // Show message
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // Shake the check availability button to draw attention
        const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');
        checkAvailabilityButtons.forEach(button => {
          // Remove existing animation if present
          button.classList.remove('shake-animation');

          // Trigger reflow to restart animation
          void button.offsetWidth;

          // Add shake animation
          button.classList.add('shake-animation');

          // Remove animation class after it completes
          setTimeout(() => {
            button.classList.remove('shake-animation');
          }, 600);
        });

        // Hide after 3 seconds
        this.messageTimeout = setTimeout(() => {
          messageElement.style.display = 'none';
        }, 3000);
      }

      // Note: Button availability is now handled by the centralized updateFishingCharterButtonState function

      updateAddToReservationButtonsAvailability() {
        // Find all Add to Reservation buttons in the details view
        const addToReservationButtons = document.querySelectorAll('[data-element="fishingCharterDetails_tripType_addToReservationButton"]');

        const needsDates = this.detailsSelectedDates.length === 0;
        const needsGuests = this.detailsSelectedGuests === 0;
        const isDisabled = needsDates || needsGuests;

        addToReservationButtons.forEach(button => {
          if (isDisabled) {
            // Disable button appearance and set not-allowed cursor
            button.style.cursor = 'not-allowed';


            let tooltipMessage = 'Please select ';
            if (needsDates && needsGuests) {
              tooltipMessage += 'date(s) and guests';
            } else if (needsDates) {
              tooltipMessage += 'date(s)';
            } else {
              tooltipMessage += 'guests';
            }
            tooltipMessage += ' before adding to reservation.';

            button.setAttribute('title', tooltipMessage);
          } else {
            // Enable button appearance and set normal cursor
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            button.removeAttribute('title');
          }
        });
      }
    }

    // Initialize fishing charter service
    const fishingCharter = new FishingCharterService();

    // Make it globally accessible
    window.fishingCharterService = fishingCharter;

    // Mobile Fishing Charter Button Handler
    class MobileFishingCharterButtonHandler {
      constructor() {
        this.mobileFishingCharterButton = document.querySelector('[data-element="mobileFishingCharterButton"]');
        this.mobileFishingCharterButtonPlusImage = document.querySelector('[data-element="mobileFishingCharterButton_plusImage"]');
        this.mobileFishingCharterButtonText = document.querySelector('[data-element="mobileFishingCharterButton_text"]');
        this.mobileFishingCharterButtonXButton = document.querySelector('[data-element="mobileFishingCharterButton_xButton"]');

        this.messageTimeout = null;

        this.initialize();
      }

      initialize() {

        if (!this.mobileFishingCharterButton) {
          return;
        }

        // Set initial state
        this.updateMobileFishingCharterButtonState();

        // Add click handler for the main button
        this.mobileFishingCharterButton.addEventListener('click', () => {
          this.handleMobileFishingCharterButtonClick();
        });

        // Add click handler for X button
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent main button click
            this.handleRemoveAllFishingCharters();
          });
        }

        // Monitor URL changes to update button state
        window.addEventListener('popstate', () => {
          this.updateMobileFishingCharterButtonState();
        });

        // Observe URL changes
        let lastUrl = location.href;
        new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            this.updateMobileFishingCharterButtonState();
          }
        }).observe(document, { subtree: true, childList: true });

        // Check periodically for state changes
        setInterval(() => {
          this.updateMobileFishingCharterButtonState();
        }, 1000);
      }

      updateMobileFishingCharterButtonState() {
        if (!this.mobileFishingCharterButton) return;

        const charterCount = this.getFishingCharterCount();
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');
        const hasValidDates = checkin && checkout && checkin !== '' && checkout !== '';

        if (charterCount === 0) {
          // No charters selected
          this.showAddCharterState(hasValidDates);
        } else if (charterCount === 1) {
          // Single charter selected
          this.showSingleCharterState();
        } else {
          // Multiple charters selected
          this.showMultipleChartersState(charterCount);
        }
      }

      getFishingCharterCount() {
        if (!window.fishingCharterService) return 0;
        return window.fishingCharterService.getAllFishingCharterNumbers().length;
      }

      showAddCharterState(hasValidDates = true) {
        // Show plus image, hide X button
        if (this.mobileFishingCharterButtonPlusImage) {
          this.mobileFishingCharterButtonPlusImage.style.display = 'flex';
        }
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.style.display = 'none';
        }

        // Reset styling to default state
        this.mobileFishingCharterButton.style.borderColor = '';
        this.mobileFishingCharterButton.style.backgroundColor = '';

        // Force clear background and border colors
        this.mobileFishingCharterButton.style.removeProperty('background-color');
        this.mobileFishingCharterButton.style.removeProperty('border-color');

        // Apply disabled styling if no valid dates (only to inner elements, keep background white)
        if (!hasValidDates) {
          this.mobileFishingCharterButton.style.cursor = 'not-allowed';
          if (this.mobileFishingCharterButtonPlusImage) {
            this.mobileFishingCharterButtonPlusImage.style.opacity = '0.5';
          }
          if (this.mobileFishingCharterButtonText) {
            this.mobileFishingCharterButtonText.style.opacity = '0.5';
          }
        } else {
          this.mobileFishingCharterButton.style.cursor = 'pointer';
          if (this.mobileFishingCharterButtonPlusImage) {
            this.mobileFishingCharterButtonPlusImage.style.opacity = '1';
          }
          if (this.mobileFishingCharterButtonText) {
            this.mobileFishingCharterButtonText.style.opacity = '1';
          }
        }

        // Update text
        if (this.mobileFishingCharterButtonText) {
          this.mobileFishingCharterButtonText.textContent = 'Add Fishing Charter';
        }
      }

      async showSingleCharterState() {
        // Hide plus image, show X button
        if (this.mobileFishingCharterButtonPlusImage) {
          this.mobileFishingCharterButtonPlusImage.style.display = 'none';
        }
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.style.display = 'flex';
        }

        // Reset any disabled styling and apply selected state
        this.mobileFishingCharterButton.style.opacity = '1';
        this.mobileFishingCharterButton.style.cursor = 'pointer';
        this.mobileFishingCharterButton.style.borderColor = '#0074ff';
        this.mobileFishingCharterButton.style.backgroundColor = '#e5f2ff';

        // Force background color update with additional methods
        this.mobileFishingCharterButton.style.setProperty('background-color', '#e5f2ff', 'important');
        this.mobileFishingCharterButton.style.setProperty('border-color', '#0074ff', 'important');

        // Reset opacity for child elements
        if (this.mobileFishingCharterButtonText) {
          this.mobileFishingCharterButtonText.style.opacity = '1';
        }
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.style.opacity = '1';
        }

        // Get charter trip name and update text
        try {
          const tripName = await this.getSingleCharterTripName();
          if (this.mobileFishingCharterButtonText) {
            this.mobileFishingCharterButtonText.textContent = tripName ? `🎣 ${tripName}` : 'Fishing Charter Selected';
          }
        } catch (error) {
          if (this.mobileFishingCharterButtonText) {
            this.mobileFishingCharterButtonText.textContent = 'Fishing Charter Selected';
          }
        }
      }

      showMultipleChartersState(count) {
        // Hide plus image, show X button
        if (this.mobileFishingCharterButtonPlusImage) {
          this.mobileFishingCharterButtonPlusImage.style.display = 'none';
        }
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.style.display = 'flex';
        }

        // Reset any disabled styling and apply selected state
        this.mobileFishingCharterButton.style.opacity = '1';
        this.mobileFishingCharterButton.style.cursor = 'pointer';
        this.mobileFishingCharterButton.style.borderColor = '#0074ff';
        this.mobileFishingCharterButton.style.backgroundColor = '#e5f2ff';

        // Force background color update with additional methods
        this.mobileFishingCharterButton.style.setProperty('background-color', '#e5f2ff', 'important');
        this.mobileFishingCharterButton.style.setProperty('border-color', '#0074ff', 'important');

        // Reset opacity for child elements
        if (this.mobileFishingCharterButtonText) {
          this.mobileFishingCharterButtonText.style.opacity = '1';
        }
        if (this.mobileFishingCharterButtonXButton) {
          this.mobileFishingCharterButtonXButton.style.opacity = '1';
        }

        // Update text to show count with a fishing rod emoji
        if (this.mobileFishingCharterButtonText) {
          this.mobileFishingCharterButtonText.textContent = `🎣 ${count} Charters`;
        }
      }

      async getSingleCharterTripName() {
        try {
          if (!window.fishingCharterService) return null;

          const selectedTrips = await window.fishingCharterService.getSelectedFishingCharterData();
          if (selectedTrips && selectedTrips.length > 0) {
            return selectedTrips[0].tripName;
          }
          return null;
        } catch (error) {
          return null;
        }
      }

      handleMobileFishingCharterButtonClick() {
        const charterCount = this.getFishingCharterCount();

        if (charterCount === 0) {
          // No charters selected, try to add one
          this.addFishingCharter();
        } else if (charterCount === 1) {
          // Single charter selected, edit it
          this.editSingleCharter();
        } else {
          // Multiple charters selected, show reservation container
          this.showReservationContainer();
        }
      }

      addFishingCharter() {
        // Check if dates are selected
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout || checkin === '' || checkout === '') {
          this.showMessage('Dates must be selected before adding a fishing charter');
          // Flash check availability button if no dates are selected
          if (window.fishingCharterService) {
            window.fishingCharterService.flashCheckAvailabilityButton();
          }
          return;
        }

        // Open the fishing charter modal
        if (window.fishingCharterService) {
          window.fishingCharterService.handleButtonClick();
        }
      }

      async editSingleCharter() {
        try {
          if (!window.fishingCharterService) return;

          const selectedTrips = await window.fishingCharterService.getSelectedFishingCharterData();
          if (selectedTrips && selectedTrips.length > 0) {
            const trip = selectedTrips[0];
            window.fishingCharterService.handleEditSpecificFishingCharter(trip);
          }
        } catch (error) {
        }
      }

      showReservationContainer() {
        // Show the reservation block phone container
        const reservationContainer = document.querySelector('[data-element="reservationBlock_phoneContainer"]');
        if (reservationContainer) {
          reservationContainer.style.display = 'flex';
        }
      }

      async handleRemoveAllFishingCharters() {
        if (!window.fishingCharterService) return;

        const allNumbers = window.fishingCharterService.getAllFishingCharterNumbers();
        const url = new URL(window.location);

        // Remove all fishing charter parameters
        allNumbers.forEach(number => {
          url.searchParams.delete(`fishingCharterId${number}`);
          url.searchParams.delete(`fishingCharterTripId${number}`);
          url.searchParams.delete(`fishingCharterGuests${number}`);
          url.searchParams.delete(`fishingCharterDates${number}`);
          url.searchParams.delete(`fishingCharterPickup${number}`);
        });

        // Also remove legacy parameters
        url.searchParams.delete('fishingCharterId');
        url.searchParams.delete('fishingCharterTripId');
        url.searchParams.delete('fishingCharterGuests');
        url.searchParams.delete('fishingCharterDates');
        url.searchParams.delete('fishingCharterPickup');

        window.history.pushState({}, '', url);

        // Update fishing charter service state
        window.fishingCharterService.initializeFromURL();
        window.fishingCharterService.updateButtonState();
        // Don't call populateSelectedFishingCharterBlock() - we just removed all charters
        // initializeFromURL() already hid the blocks

        // Update pricing displays
        if (window.updatePricingDisplayForExtras) {
          await window.updatePricingDisplayForExtras();
        }
        if (window.updateListingOnlyPricing) {
          window.updateListingOnlyPricing();
        }

        // Update mobile button state
        this.updateMobileFishingCharterButtonState();

        // Also trigger global mobile handlers update
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }

      showMessage(message) {
        // Clear any existing message
        if (this.messageTimeout) {
          clearTimeout(this.messageTimeout);
        }

        // Create or get message element
        let messageElement = document.querySelector('.mobile-fishing-charter-message');
        if (!messageElement) {
          messageElement = document.createElement('div');
          messageElement.className = 'mobile-fishing-charter-message';
          document.body.appendChild(messageElement);

          // Add styles
          const style = document.createElement('style');
          style.textContent = `
            .mobile-fishing-charter-message {
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #323232;
              color: white;
              padding: 12px 24px;
              border-radius: 5px;
              z-index: 9999;
              display: none;
              font-family: 'TT Fors', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `;
          document.head.appendChild(style);
        }

        // Show message
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // Hide after 3 seconds
        this.messageTimeout = setTimeout(() => {
          messageElement.style.display = 'none';
        }, 3000);
      }
    }

    // Add mobile-specific CSS for fishing charter button states
    const mobileFishingCharterStyles = document.createElement('style');
    mobileFishingCharterStyles.textContent = `
      @media (max-width: 990px) {
        [data-element="mobileFishingCharterButton"] {
          transition: all 0.2s ease !important;
          cursor: pointer;
        }
        [data-element="mobileFishingCharterButton"]:hover:not([style*="not-allowed"]) {
          opacity: 0.8 !important;
        }
        [data-element="mobileFishingCharterButton_xButton"] {
          z-index: 10;
          cursor: pointer;
        }
        [data-element="mobileFishingCharterButton_xButton"]:hover {
          opacity: 0.7;
        }
        /* Ensure background colors are applied with higher specificity */
        [data-element="mobileFishingCharterButton"][style*="background-color: rgb(229, 242, 255)"],
        [data-element="mobileFishingCharterButton"][style*="background-color:#e5f2ff"] {
          background-color: #e5f2ff !important;
        }
        [data-element="mobileFishingCharterButton"][style*="border-color: rgb(0, 116, 255)"],
        [data-element="mobileFishingCharterButton"][style*="border-color:#0074ff"] {
          border-color: #0074ff !important;
        }
      }
    `;
    document.head.appendChild(mobileFishingCharterStyles);

    // Initialize mobile fishing charter button handler only on mobile (990px or less)

    if (window.innerWidth <= 990) {
      const mobileFishingCharterButtonHandler = new MobileFishingCharterButtonHandler();
      window.mobileFishingCharterButtonHandler = mobileFishingCharterButtonHandler;
    } else {
    }

    // Re-initialize on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 990 && !window.mobileFishingCharterButtonHandler) {
        window.mobileFishingCharterButtonHandler = new MobileFishingCharterButtonHandler();
      }
    });

    // Note: Button availability is now handled by centralized updateFishingCharterButtonState function

    // Initial pricing update if fishing charters are selected
    if (fishingCharter.hasAnyFishingCharters() && window.updatePricingDisplayForExtras) {
      // Wait for calendar data to be available
      Wized.requests.waitFor('Load_Property_Calendar_Query').then(() => {
        window.updatePricingDisplayForExtras();
      });
    }

    // Integration functions to keep mobile handlers in sync
    window.updateMobileHandlersState = function () {
      if (window.innerWidth <= 990) {
        if (window.mobileBoatButtonHandler) {
          window.mobileBoatButtonHandler.updateMobileBoatButtonState();
        }
        if (window.mobileFishingCharterButtonHandler) {
          window.mobileFishingCharterButtonHandler.updateMobileFishingCharterButtonState();
        }
      }

      // Also update phone total description when mobile handlers update
      if (window.updatePhoneTotalDescription) {
        window.updatePhoneTotalDescription();
      }
    };

    // Hook into existing pricing update functions to also update mobile handlers
    const originalUpdatePricingDisplayForExtras = window.updatePricingDisplayForExtras;
    if (originalUpdatePricingDisplayForExtras) {
      window.updatePricingDisplayForExtras = function () {
        originalUpdatePricingDisplayForExtras.apply(this, arguments);
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      };
    }

    const originalUpdateListingOnlyPricing = window.updateListingOnlyPricing;
    if (originalUpdateListingOnlyPricing) {
      window.updateListingOnlyPricing = function () {
        originalUpdateListingOnlyPricing.apply(this, arguments);
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      };
    }

    // Also update mobile handlers when URL changes (for external changes)
    let lastMobileUrl = location.href;
    setInterval(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastMobileUrl) {
        lastMobileUrl = currentUrl;
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }
    }, 500);

    // Override history methods to trigger immediate updates
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      setTimeout(() => {
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }, 100);
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      setTimeout(() => {
        if (window.updateMobileHandlersState) {
          window.updateMobileHandlersState();
        }
      }, 100);
    };
  });
});


// Comprehensive Button Visibility Management System
document.addEventListener('DOMContentLoaded', () => {
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {

    // Central function to manage all button visibility based on validation states
    function updateAllButtonVisibility() {
      const validation = getValidationState();

      // Update main action buttons
      updateReserveButtonVisibility(validation);
      updateChangeDatesButtonVisibility(validation);
      updateChangeGuestsButtonVisibility(validation);
      updateCheckAvailabilityButtonVisibility(validation);

      // Update boat and fishing charter button states
      updateBoatButtonState(validation);
      updateFishingCharterButtonState(validation);

      // Update price details visibility
      updatePriceDetailsVisibility(validation);

      // Update "Won't be charged" text visibility
      updateWontBeChargedTextVisibility(validation);

      // Handle boat rental and fishing charter clearing if dates are cleared
      handleExtrasWhenDatesCleared(validation);
    }

    // Get comprehensive validation state
    function getValidationState() {
      const urlParams = new URLSearchParams(window.location.search);
      const r = Wized.data.r || {};
      const n = Wized.data.n || {};

      // Check if dates are selected
      const checkin = urlParams.get('checkin');
      const checkout = urlParams.get('checkout');
      const datesSelected = !!(checkin && checkout && checkin.trim() !== '' && checkout.trim() !== '');

      // Check if dates are valid
      let datesValid = false;
      if (datesSelected && r && r.Load_Property_Calendar_Query &&
        r.Load_Property_Calendar_Query.data && r.Load_Property_Details &&
        r.Load_Property_Details.data) {

        const propertyCalendarRange = r.Load_Property_Calendar_Query.data.property_calendar_range;
        const minNights = r.Load_Property_Details.data.property.min_nights;

        let allAvailable = true;
        let consecutiveAvailableDays = 0;
        let meetsMinNights = false;

        for (let i = 0; i < propertyCalendarRange.length; i++) {
          if (propertyCalendarRange[i].status === "available") {
            consecutiveAvailableDays++;
            if (consecutiveAvailableDays >= minNights) {
              meetsMinNights = true;
            }
          } else {
            consecutiveAvailableDays = 0;
            allAvailable = false;
          }
        }

        datesValid = allAvailable && meetsMinNights;
      }

      // Check guest validation
      let guestsValid = false;
      if (r && r.Load_Property_Details && r.Load_Property_Details.data &&
        r.Load_Property_Details.data.property && n && n.parameter) {
        const maxGuests = r.Load_Property_Details.data.property.num_guests;
        const currentGuests = n.parameter.guests || 0;
        guestsValid = (currentGuests >= 1 && currentGuests <= maxGuests);
      } else {
        // If we don't have data yet, assume guests are valid to avoid showing guest errors prematurely
        guestsValid = true;
      }

      return {
        datesSelected,
        datesValid,
        guestsValid,
        datesUnavailable: datesSelected && !datesValid,
        guestsIncorrect: !guestsValid,
        noErrors: datesSelected && datesValid && guestsValid
      };
    }

    // Update reserve button visibility
    function updateReserveButtonVisibility(validation) {
      const reserveButtons = document.querySelectorAll('[data-element="listing_reserve_button"]');
      reserveButtons.forEach(button => {
        if (button) {
          button.style.display = validation.noErrors ? 'flex' : 'none';
        }
      });
    }

    // Update change dates button visibility
    function updateChangeDatesButtonVisibility(validation) {
      const changeDatesButtons = document.querySelectorAll('[data-element="listing_changeDates_button"]');
      changeDatesButtons.forEach(button => {
        if (button) {
          button.style.display = validation.datesUnavailable ? 'flex' : 'none';
        }
      });
    }

    // Update change guests button visibility
    function updateChangeGuestsButtonVisibility(validation) {
      const changeGuestsButtons = document.querySelectorAll('[data-element="listing_changeGuests_button"]');
      changeGuestsButtons.forEach(button => {
        if (button) {
          button.style.display = validation.guestsIncorrect ? 'flex' : 'none';
        }
      });
    }

    // Update check availability button visibility
    function updateCheckAvailabilityButtonVisibility(validation) {
      const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');
      const shouldShow = !validation.datesSelected;

      checkAvailabilityButtons.forEach((button, index) => {
        if (button) {
          const newDisplay = shouldShow ? 'flex' : 'none';
          button.style.display = newDisplay;
        }
      });
    }

    // Update price details visibility
    function updatePriceDetailsVisibility(validation) {
      const priceDetailsElements = document.querySelectorAll('[data-element="Listing_Query_Price_Details"]');
      const listingOnlyElements = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
      const listingExtrasElements = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

      // Show pricing only when dates are selected, valid, AND guests are valid
      const shouldShowPricing = validation.datesSelected && validation.datesValid && validation.guestsValid;

      // Handle main price details container
      priceDetailsElements.forEach(element => {
        if (element) {
          element.style.display = shouldShowPricing ? 'block' : 'none';
        }
      });

      // Handle listing-only vs listing-extras visibility
      if (shouldShowPricing) {
        const hasExtras = window.hasAnyExtrasSelected && window.hasAnyExtrasSelected();

        listingOnlyElements.forEach(element => {
          if (element) {
            element.style.display = hasExtras ? 'none' : 'flex';
          }
        });

        listingExtrasElements.forEach(element => {
          if (element) {
            element.style.display = hasExtras ? 'flex' : 'none';
          }
        });
      } else {
        // Hide both when dates are invalid/not selected OR guests are invalid
        listingOnlyElements.forEach(element => {
          if (element) {
            element.style.display = 'none';
          }
        });

        listingExtrasElements.forEach(element => {
          if (element) {
            element.style.display = 'none';
          }
        });
      }
    }

    // Update boat rental button state (opacity/cursor)
    function updateBoatButtonState(validation) {
      const boatButtons = document.querySelectorAll('[data-element="addBoatButton"]');
      if (boatButtons.length > 0) {
        const datesValid = validation.datesSelected && validation.datesValid;

        boatButtons.forEach(button => {
          if (button) {
            button.style.opacity = datesValid ? '1' : '0.5';
            button.style.cursor = datesValid ? 'pointer' : 'not-allowed';
          }
        });
      }
    }

    // Update fishing charter button state (opacity/cursor)
    function updateFishingCharterButtonState(validation) {
      const fishingCharterButtons = document.querySelectorAll('[data-element="addFishingCharterButton"]');
      if (fishingCharterButtons.length > 0) {
        const datesValid = validation.datesSelected && validation.datesValid;

        fishingCharterButtons.forEach(button => {
          if (button) {
            button.style.opacity = datesValid ? '1' : '0.5';
            button.style.cursor = datesValid ? 'pointer' : 'not-allowed';
          }
        });
      }
    }

    // Update "Won't be charged" text visibility
    function updateWontBeChargedTextVisibility(validation) {
      const wontBeChargedElements = document.querySelectorAll('[data-element="ListingReservation_WontBeCharged_Text"]');
      wontBeChargedElements.forEach(element => {
        if (element) {
          element.style.display = validation.noErrors ? 'flex' : 'none';
        }
      });
    }

    // Handle boat rentals and fishing charters when dates are invalid or cleared
    function handleExtrasWhenDatesCleared(validation) {
      const urlParams = new URLSearchParams(window.location.search);

      // Case 1: No dates selected - BUT check if user is actively selecting new dates in calendar
      if (!validation.datesSelected) {
        // Check if calendar modal is open (user is selecting new dates)
        const calendarModal = document.querySelector('[data-element="calendarModal"]');
        const mobileCalendarModal = document.querySelector('[data-element="mobileCalendarModal"]');
        const isCalendarOpen = (calendarModal && calendarModal.style.display === 'flex') ||
          (mobileCalendarModal && mobileCalendarModal.style.display === 'flex');

        if (isCalendarOpen) {
          return; // Don't remove extras while user is actively selecting dates
        }

        removeAllExtras();
        return;
      }

      // Case 2: Dates selected - validate extras are within date range
      const checkin = urlParams.get('checkin');
      const checkout = urlParams.get('checkout');

      if (!checkin || !checkout) {
        return;
      }

      // Parse check-in and check-out dates manually (YYYY-MM-DD format)
      const [checkInYear, checkInMonth, checkInDay] = checkin.split('-').map(Number);
      const [checkOutYear, checkOutMonth, checkOutDay] = checkout.split('-').map(Number);
      const checkInTime = Date.UTC(checkInYear, checkInMonth - 1, checkInDay);
      const checkOutTime = Date.UTC(checkOutYear, checkOutMonth - 1, checkOutDay);


      let hasRemovedExtras = false;

      // Validate boat rental dates
      const boatDates = urlParams.get('boatDates');
      if (boatDates) {
        const boatDateArray = boatDates.split(',');
        const allBoatDatesValid = boatDateArray.every(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);
          const dateTime = Date.UTC(year, month - 1, day);
          // Include checkout date: >= checkin AND <= checkout
          return dateTime >= checkInTime && dateTime <= checkOutTime;
        });

        if (!allBoatDatesValid) {
          removeBoatFromReservation();
          hasRemovedExtras = true;
        } else {
        }
      }

      // Validate fishing charter dates
      if (window.fishingCharterService) {
        const allNumbers = window.fishingCharterService.getAllFishingCharterNumbers();
        allNumbers.forEach(number => {
          const charterDates = urlParams.get(`fishingCharterDates${number}`);
          if (charterDates) {
            const charterDateArray = charterDates.split(',');
            const allCharterDatesValid = charterDateArray.every(dateStr => {
              const [year, month, day] = dateStr.split('-').map(Number);
              const dateTime = Date.UTC(year, month - 1, day);
              // Include checkout date: >= checkin AND <= checkout
              return dateTime >= checkInTime && dateTime <= checkOutTime;
            });

            if (!allCharterDatesValid) {
              removeFishingCharterFromReservation(number);
              hasRemovedExtras = true;
            } else {
            }
          }
        });

        // Update fishing charter UI after removals
        if (hasRemovedExtras) {
          // First, refresh fishing charter service state from updated URL
          if (window.fishingCharterService.initializeFromURL) {
            window.fishingCharterService.initializeFromURL();
          }
          // Only update blocks if there are still charters remaining
          const stillHasCharters = window.fishingCharterService.hasAnyFishingCharters && window.fishingCharterService.hasAnyFishingCharters();
          if (stillHasCharters && window.fishingCharterService.populateSelectedFishingCharterBlock) {
            const charterResult = window.fishingCharterService.populateSelectedFishingCharterBlock();
            if (charterResult && typeof charterResult.catch === 'function') {
              charterResult.catch(err => console.error('Error updating fishing charter UI:', err));
            }
          }
        }
      }

      // Update pricing if any extras were removed
      if (hasRemovedExtras) {
        if (window.updatePricingDisplayForExtras) {
          const pricingResult = window.updatePricingDisplayForExtras();
          if (pricingResult && typeof pricingResult.catch === 'function') {
            pricingResult.catch(err => console.error('Error updating pricing:', err));
          }
        }
      }
    }

    // Helper to remove all extras from URL (used when no dates selected)
    function removeAllExtras() {
      const urlParams = new URLSearchParams(window.location.search);
      let hasRemovedExtras = false;

      // Remove boat rental if present
      if (urlParams.get('boatId')) {
        removeBoatFromReservation();
        hasRemovedExtras = true;
      }

      // Remove fishing charters if present
      if (window.fishingCharterService && window.fishingCharterService.hasAnyFishingCharters()) {
        const allNumbers = window.fishingCharterService.getAllFishingCharterNumbers();
        allNumbers.forEach(number => {
          removeFishingCharterFromReservation(number);
        });
        hasRemovedExtras = true;
      }

      if (hasRemovedExtras) {
        updateExtrasUI();
      }
    }

    // Helper to update UI after extras are removed
    function updateExtrasUI() {
      // Update boat UI
      if (window.updateBoatVisibility) {
        window.updateBoatVisibility();
      }

      // Update fishing charter UI
      if (window.fishingCharterService) {
        // First, refresh fishing charter service state from updated URL
        if (window.fishingCharterService.initializeFromURL) {
          window.fishingCharterService.initializeFromURL();
        }
        // Only update blocks if there are still charters remaining
        const stillHasCharters = window.fishingCharterService.hasAnyFishingCharters && window.fishingCharterService.hasAnyFishingCharters();
        if (stillHasCharters && window.fishingCharterService.populateSelectedFishingCharterBlock) {
          const charterResult = window.fishingCharterService.populateSelectedFishingCharterBlock();
          if (charterResult && typeof charterResult.catch === 'function') {
            charterResult.catch(err => console.error('Error populating fishing charter:', err));
          }
        }
      }

      // Update pricing display
      if (window.updatePricingDisplayForExtras) {
        const pricingResult = window.updatePricingDisplayForExtras();
        if (pricingResult && typeof pricingResult.catch === 'function') {
          pricingResult.catch(err => console.error('Error updating pricing:', err));
        }
      }
    }

    // NOTE: removeBoatFromReservation() and removeFishingCharterFromReservation() 
    // are defined globally (lines 4688 and 4742) and reused here

    // Helper function to remove fishing charter from reservation
    function removeFishingCharterFromReservation(numberToRemove) {
      const url = new URL(window.location);
      const allNumbers = window.fishingCharterService ? window.fishingCharterService.getAllFishingCharterNumbers() : [];

      // Remove the specific numbered parameters
      url.searchParams.delete(`fishingCharterId${numberToRemove}`);
      url.searchParams.delete(`fishingCharterTripId${numberToRemove}`);
      url.searchParams.delete(`fishingCharterGuests${numberToRemove}`);
      url.searchParams.delete(`fishingCharterDates${numberToRemove}`);
      url.searchParams.delete(`fishingCharterPickup${numberToRemove}`);

      // Get remaining numbers (excluding the one we just removed)
      const remainingNumbers = allNumbers.filter(num => num !== numberToRemove).sort((a, b) => a - b);

      // If there are remaining charters, renumber them sequentially
      if (remainingNumbers.length > 0) {
        const tempParams = {};

        // Store remaining parameters temporarily
        remainingNumbers.forEach(oldNumber => {
          const charterId = url.searchParams.get(`fishingCharterId${oldNumber}`);
          const tripId = url.searchParams.get(`fishingCharterTripId${oldNumber}`);
          const guests = url.searchParams.get(`fishingCharterGuests${oldNumber}`);
          const dates = url.searchParams.get(`fishingCharterDates${oldNumber}`);
          const pickup = url.searchParams.get(`fishingCharterPickup${oldNumber}`);

          if (charterId) {
            tempParams[oldNumber] = { charterId, tripId, guests, dates, pickup };
          }

          // Remove old numbered parameters
          url.searchParams.delete(`fishingCharterId${oldNumber}`);
          url.searchParams.delete(`fishingCharterTripId${oldNumber}`);
          url.searchParams.delete(`fishingCharterGuests${oldNumber}`);
          url.searchParams.delete(`fishingCharterDates${oldNumber}`);
          url.searchParams.delete(`fishingCharterPickup${oldNumber}`);
        });

        // Re-add parameters with sequential numbering (1, 2, 3, etc.)
        Object.values(tempParams).forEach((params, index) => {
          const newNumber = index + 1;
          url.searchParams.set(`fishingCharterId${newNumber}`, params.charterId);
          if (params.tripId) url.searchParams.set(`fishingCharterTripId${newNumber}`, params.tripId);
          if (params.guests) url.searchParams.set(`fishingCharterGuests${newNumber}`, params.guests);
          if (params.dates) url.searchParams.set(`fishingCharterDates${newNumber}`, params.dates);
          if (params.pickup) url.searchParams.set(`fishingCharterPickup${newNumber}`, params.pickup);
        });
      }

      // Update URL
      window.history.replaceState({}, '', url);

      // Check if any fishing charters remain and reset filter states if none remain
      if (window.fishingCharterService) {
        const remainingNumbers = window.fishingCharterService.getAllFishingCharterNumbers();

        // If no charters remain after this removal, clear all filter states
        if (remainingNumbers.length === 0) {
          // Clear all filters when no charters remain
          window.fishingCharterService.selectedDates = [];
          window.fishingCharterService.selectedGuests = 0;
          window.fishingCharterService.selectedPickupTime = '';
          window.fishingCharterService.selectedPrivateDock = false;
          window.fishingCharterService.selectedFishingTypes = [];
          window.fishingCharterService.priceMin = 0;
          window.fishingCharterService.priceMax = 5000;

          // Also clear details section state
          window.fishingCharterService.detailsSelectedDates = [];
          window.fishingCharterService.detailsSelectedGuests = 0;
          window.fishingCharterService.detailsSelectedPrivateDock = false;

          // Update UI elements to reflect cleared state
          if (window.fishingCharterService.guestNumber) {
            window.fishingCharterService.guestNumber.textContent = window.fishingCharterService.selectedGuests;
          }
          if (window.fishingCharterService.detailsGuestNumber) {
            window.fishingCharterService.detailsGuestNumber.textContent = window.fishingCharterService.detailsSelectedGuests;
          }

          // Update filter texts and styles
          window.fishingCharterService.updateDatesFilterText();
          window.fishingCharterService.updateGuestsFilterText();
          window.fishingCharterService.updatePrivateDockFilterText();
          window.fishingCharterService.updateFishingTypeFilterText();
          window.fishingCharterService.updatePriceFilterText();
          window.fishingCharterService.updateDetailsDateFilterText();
          window.fishingCharterService.updateDetailsGuestsFilterText();
          window.fishingCharterService.updateDetailsPrivateDockFilterText();
          window.fishingCharterService.updateFilterStyles();
          window.fishingCharterService.updateDetailsFilterStyles();

          // Reset checkbox styles for fishing types
          Object.values(window.fishingCharterService.fishingTypes).forEach(checkbox => {
            if (checkbox) {
              checkbox.style.backgroundColor = '';
            }
          });

          // Reset price slider UI if it exists
          if (window.fishingCharterService.priceScrollBar) {
            const sliderMin = window.fishingCharterService.priceScrollBar.querySelector('.price-slider-min');
            const sliderMax = window.fishingCharterService.priceScrollBar.querySelector('.price-slider-max');
            if (sliderMin) sliderMin.value = 0;
            if (sliderMax) sliderMax.value = 5000;
          }
        }
      }
    }

    // Helper function to get all fishing charter numbers from URL
    function getAllFishingCharterNumbersForValidation() {
      const urlParams = new URLSearchParams(window.location.search);
      const numbers = [];

      for (const [key] of urlParams) {
        const match = key.match(/^fishingCharterId(\d+)$/);
        if (match) {
          numbers.push(match[1]);
        }
      }

      return numbers;
    }

    // Make the function globally accessible
    window.updateAllButtonVisibility = updateAllButtonVisibility;

    // Hook into existing update functions to trigger button visibility updates
    const originalUpdateAvailabilityStatus = window.updateAvailabilityStatus;
    if (originalUpdateAvailabilityStatus) {
      window.updateAvailabilityStatus = function () {
        originalUpdateAvailabilityStatus.apply(this, arguments);
        updateAllButtonVisibility();
      };
    }

    // Initial update when page loads - run immediately and also after data loads
    updateAllButtonVisibility();

    // Force check availability buttons to show if no dates are selected (fallback)
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const checkin = urlParams.get('checkin');
      const checkout = urlParams.get('checkout');
      const noDatesSelected = !(checkin && checkout && checkin.trim() !== '' && checkout.trim() !== '');

      if (noDatesSelected) {
        const checkAvailabilityButtons = document.querySelectorAll('[data-element="listing_checkAvailability_button"]');
        checkAvailabilityButtons.forEach(button => {
          if (button) {
            button.style.display = 'flex';
            button.style.visibility = 'visible';
          }
        });
      }
    }, 50);

    Wized.requests.waitFor('Load_Property_Details').then(() => {
      setTimeout(() => {
        updateAllButtonVisibility();
      }, 100);
    });

    // Update when calendar data changes
    Wized.on('requestend', (event) => {
      if (event.name === 'Load_Property_Calendar_Query') {
        setTimeout(() => {
          updateAllButtonVisibility();
        }, 100);
      }
    });

    // Update when parameters change (URL changes)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      setTimeout(() => {
        updateAllButtonVisibility();
      }, 100);
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      setTimeout(() => {
        updateAllButtonVisibility();
      }, 100);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        updateAllButtonVisibility();
      }, 100);
    });

  });
});

