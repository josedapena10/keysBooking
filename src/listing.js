// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

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
      //console.error(error);
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
    phoneNumberInput.node.addEventListener('keydown', handleKeyDown);
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

    function handleKeyDown(event) {
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
    forgotPasswordEmailInput.node.addEventListener('keydown', handleKeyDown);
    forgotPasswordEmailInput.node.addEventListener('change', handleEmailInput);

    // Function to handle email input
    function handleEmailInput(event) {
      const inputElement = event.target;
      let input = inputElement.value.replace(/[^a-zA-Z0-9@._-]/g, ''); // Strip invalid characters for email
      inputElement.value = input; // Update the field with sanitized input
    }

    // Function to handle key down events
    function handleKeyDown(event) {
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
    const calendarContainer = document.querySelector('[data-element="calendarContainer"]');

    // Initialize state
    let selectedStartDate = null;
    let selectedEndDate = null;
    let disabledDates = new Set();
    let selectingCheckOut = false;

    // Convert disabled dates from API
    calendarData.data.forEach(item => {
      disabledDates.add(item.date);
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
      }

    }

    // Mark small gaps as unavailable
    markSmallGapsAsUnavailable();

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
    function findFirstBlockedDateAfter(startDate) {
      let checkDate = addDays(startDate, 1);

      while (checkDate <= maxDate) {
        if (isDateDisabled(checkDate)) {
          return checkDate;
        }
        checkDate = addDays(checkDate, 1);
      }
      return null;
    }

    // Create calendar
    function createCalendar() {
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

        // Apply disabled state for past dates or API disabled dates
        if (isDateDisabled(currentDate)) {
          dayElement.classList.add('disabled');
          if (currentDate < today) {
            dayElement.style.color = '#D1D1D6';
            dayElement.style.cursor = 'default';
          }
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
      if (selectedStartDate && !selectedEndDate && !isDateDisabled(currentDate)) {
        const daysDiff = Math.round((currentDate - selectedStartDate) / (1000 * 60 * 60 * 24));

        // Find first blocked date after selected start date
        const firstBlockedDate = findFirstBlockedDateAfter(selectedStartDate);

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
        if (firstBlockedDate && currentDate >= firstBlockedDate) {
          dayElement.style.color = 'grey';
          dayElement.style.opacity = '0.4';
          dayElement.style.cursor = 'not-allowed';
          dayElement.classList.add('blocked-by-unavailable');
        }
      }
    }

    function isDateDisabled(date) {
      const dateString = formatDate(date);

      // Check if date is before minimum date
      if (date < minDate) return true;

      // Check if date is after maximum date
      if (date > maxDate) return true;

      // Check if date is in disabled dates set
      if (disabledDates.has(dateString)) return true;

      return false;
    }

    function handleDateSelection(date) {
      // If no check-in selected yet, select this as check-in
      if (!selectedStartDate) {
        selectedStartDate = date;
        selectedEndDate = null;
        selectingCheckOut = true;
        updateInputs();
        createCalendar();
        return;
      }

      // If selecting check-out
      if (selectingCheckOut) {
        // If date is before current check-in, make it the new check-in
        if (date < selectedStartDate) {
          selectedStartDate = date;
          selectedEndDate = null;
          selectingCheckOut = true;
          updateInputs();
          createCalendar();
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
          if (isDateDisabled(currentDate)) {
            showError('Selected dates include unavailable days');
            return;
          }
          currentDate = addDays(currentDate, 1);
        }

        // Check if date is after first blocked date
        const firstBlockedDate = findFirstBlockedDateAfter(selectedStartDate);
        if (firstBlockedDate && date >= firstBlockedDate) {
          showError('Cannot book past unavailable dates');
          return;
        }

        // Valid check-out selection
        selectedEndDate = date;
        selectingCheckOut = false;
        updateInputs();
        updateURL();
      } else {
        // Starting new selection - set as check-in
        selectedStartDate = date;
        selectedEndDate = null;
        selectingCheckOut = true;
        updateInputs();
      }

      // Re-render calendar to update visual state
      createCalendar();
    }

    function updateInputs() {
      // Update display elements (not input fields)
      if (checkInInput) {
        checkInInput.textContent = selectedStartDate ? formatDateForDisplay(selectedStartDate) : 'Set Date';
      }
      if (checkOutInput) {
        checkOutInput.textContent = selectedEndDate ? formatDateForDisplay(selectedEndDate) : 'Set Date';
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
      const errorText = document.querySelector('[data-element="Dates_Error_Text"]');

      if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.style.display = 'flex';
      }
    }

    // Initialize inputs first, then create calendar to ensure proper styling
    updateInputs();

    // Add slight delay to ensure DOM is ready and proper styling is applied
    setTimeout(() => {
      createCalendar();
    }, 10);

    // Add clear dates functionality
    const clearButtons = document.querySelectorAll('[data-element="calendarModal_clearDates"]');
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
      });
    });

    // Fix close button functionality
    const closeButtons = document.querySelectorAll('[data-element="calendarModal_closeButton"]');
    const calendarModal = document.querySelector('[data-element="calendarModal"]');

    closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (calendarModal) {
          calendarModal.style.display = 'none';
        }

        // Trigger calendar query if dates are selected
        if (selectedStartDate && selectedEndDate) {
          Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
            if (window.updateAvailabilityStatus) {
              window.updateAvailabilityStatus();
            }
          });
        }
      });
    });

    // Add click outside to close
    if (calendarModal) {
      calendarModal.addEventListener('click', function (event) {
        const calendarContent = calendarModal.querySelector('[data-element="calendarModal_content"]');

        if (calendarContent && !calendarContent.contains(event.target)) {
          calendarModal.style.display = 'none';

          // Trigger calendar query if dates are selected
          if (selectedStartDate && selectedEndDate) {
            Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
              if (window.updateAvailabilityStatus) {
                window.updateAvailabilityStatus();
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

      .calendar-day:hover:not(.disabled):not(.empty):not(.min-nights-blocked):not(.max-nights-blocked):not(.blocked-by-unavailable):not(.blocked-by-selection) {
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

      .calendar-day.min-nights-blocked,
      .calendar-day.max-nights-blocked,
      .calendar-day.blocked-by-unavailable,
      .calendar-day.blocked-by-selection {
        cursor: not-allowed !important;
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

          // Load first 3 images eagerly, rest lazily
          const loadingStrategy = index < 3 ? 'eager' : 'lazy';

          li.innerHTML = `<img src="${photoUrl.property_image.url}" 
                             alt="Property Photo"
                             loading="${loadingStrategy}">`;
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
  const changeGuestsButton = document.querySelector('[data-element="listing_changeGuests_button"]');

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

  // Open dropdown when clicking on change button
  if (changeGuestsButton) {
    changeGuestsButton.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default action (scrolling to top)
      e.stopPropagation(); // Prevent the click from bubbling up to document
      if (guestDropdown) {
        guestDropdown.style.display = 'flex';
      }
    });
  }

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
    if (guestDropdown &&
      !guestDropdown.contains(e.target) &&
      !guestInput.contains(e.target) &&
      (!changeGuestsButton || !changeGuestsButton.contains(e.target))) {
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
  const checkAvailabilityButton = document.querySelector('[data-element="listing_checkAvailability_button"]');
  const changeDatesButton = document.querySelector('[data-element="listing_changeDates_button"]');
  const calendarModal = document.querySelector('[data-element="calendarModal"]');

  // Add this line to get the addDatesHeading element
  const addDatesHeading = document.querySelector('[data-element="Listing_Reservaton_AddDates_Heading"]');

  // Add error elements
  const errorContainer = document.querySelector('[data-element="Dates_Error_Container"]');
  const errorText = document.querySelector('[data-element="Dates_Error_Text"]');

  // Initially hide the error container
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }

  // Add click handlers for availability and change dates buttons
  if (checkAvailabilityButton && calendarModal) {
    checkAvailabilityButton.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default action (scrolling to top)
      e.stopPropagation(); // Prevent the click from bubbling up to document
      calendarModal.style.display = 'flex'; // Show the calendar modal
    });
  }

  if (changeDatesButton && calendarModal) {
    changeDatesButton.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default action (scrolling to top)
      e.stopPropagation(); // Prevent the click from bubbling up to document
      calendarModal.style.display = 'flex'; // Show the calendar modal
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
      console.error('Error waiting for requests:', error);
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

      // Update boat rental button state if it exists
      const boatButton = document.querySelector('[data-element="addBoatButton"]');
      if (boatButton) {
        const datesValid = color !== "#ffd4d2" &&
          r && r.Load_Property_Calendar_Query &&
          r.Load_Property_Calendar_Query.data;

        boatButton.style.borderColor = datesValid ? '#000000' : '#e2e2e2';
        boatButton.style.opacity = datesValid ? '1' : '0.5';
        boatButton.style.cursor = datesValid ? 'pointer' : 'not-allowed';
      }
    }

    // New function to handle error display
    function updateErrorDisplay(hasDateError, hasGuestError, r) {
      if (!errorContainer || !errorText) {
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

        errorText.textContent = dateErrorMessage;
      } else if (hasGuestError) {
        // Guest error message with more concise wording
        let guestErrorMessage = "Invalid number of guests";

        // Get property max guests for a more specific message
        if (r && r.Load_Property_Details && r.Load_Property_Details.data &&
          r.Load_Property_Details.data.property) {
          const maxGuests = r.Load_Property_Details.data.property.num_guests;
          guestErrorMessage = `Maximum number of guests is ${maxGuests}`;
        }

        errorText.textContent = guestErrorMessage;
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
      console.error('Error waiting for requests:', error);
    });

    // Add this entire function for updating the heading
    function updateAddDatesHeading() {
      if (!addDatesHeading) return;

      const r = Wized.data.r;
      if (!r) return;

      // Check if dates are actually selected before showing any error message
      const urlParams = new URLSearchParams(window.location.search);
      const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== "";
      const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== "";
      const datesSelected = hasCheckin && hasCheckout;

      // Handle visibility logic
      let shouldBeVisible = true;
      let headingText = "Add dates for pricing";

      if (r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.isRequesting) {
        shouldBeVisible = false;
      } else if (!r.Load_Property_Calendar_Query ||
        !r.Load_Property_Calendar_Query.hasRequested ||
        (r.Load_Property_Calendar_Query.hasRequested &&
          r.Load_Property_Calendar_Query.status != 200)) {
        shouldBeVisible = true;
        // Only show "Invalid Dates" if dates are actually selected
        headingText = (datesSelected && r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.hasRequested)
          ? "Invalid Dates"
          : "Add dates for pricing";
      } else if (r.Load_Property_Calendar_Query.status == 200 &&
        r.Load_Property_Details &&
        r.Load_Property_Details.data) {
        // Only validate dates if they're actually selected
        if (datesSelected) {
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

          if (!allAvailable || !meetsMinNights) {
            shouldBeVisible = true;
            headingText = "Invalid Dates";
          } else {
            shouldBeVisible = false;
          }
        } else {
          // If no dates selected, keep default message
          shouldBeVisible = true;
          headingText = "Add dates for pricing";
        }
      }

      // Apply visibility and text
      addDatesHeading.style.display = shouldBeVisible ? 'flex' : 'none';
      addDatesHeading.textContent = headingText;
    }

    // Make updateAddDatesHeading available globally
    window.updateAddDatesHeading = updateAddDatesHeading;

    // Handle boat functionality when boatId is in URL params
    function handleBoatFunctionality() {
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');
      const selectedBoatBlock = document.querySelector('[data-element="selectedBoatBlock"]');
      
      if (boatId) {
        // Show the selected boat block
        if (selectedBoatBlock) {
          selectedBoatBlock.style.display = 'block';
        }

        // Show listing-extras pricing (for boat selection)
        const listingOnlyPricing = document.querySelector('[data-element="ListingOnly_Query_Price_Details"]');
        const listingExtrasPricing = document.querySelector('[data-element="ListingExtras_Query_Price_Details"]');
        
        if (listingOnlyPricing) {
          listingOnlyPricing.style.display = 'none';
        }
        
        if (listingExtrasPricing) {
          listingExtrasPricing.style.display = 'block';
        }

        // Make direct fetch request for boat data
        fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/boats/${boatId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(boatData => {
            // Store the boat data in a way that can be accessed by other functions
            if (!Wized.data.r) {
              Wized.data.r = {};
            }
            Wized.data.r.Load_Selected_Boat = {
              data: boatData,
              status: 200,
              hasRequested: true
            };
            
            populateSelectedBoatBlock();
            updatePricingDisplayForBoat();
          })
          .catch(error => {
            console.error('Error loading selected boat:', error);
          });
      } else {
        // Hide the selected boat block when no boatId
        if (selectedBoatBlock) {
          selectedBoatBlock.style.display = 'none';
        }

        // Show listing-only pricing
        const listingOnlyPricing = document.querySelector('[data-element="ListingOnly_Query_Price_Details"]');
        const listingExtrasPricing = document.querySelector('[data-element="ListingExtras_Query_Price_Details"]');
        
        if (listingOnlyPricing) {
          listingOnlyPricing.style.display = 'block';
        }
        
        if (listingExtrasPricing) {
          listingExtrasPricing.style.display = 'none';
        }
      }
    }

    // Make handleBoatFunctionality globally available
    window.handleBoatFunctionality = handleBoatFunctionality;

    // Populate the selectedBoatBlock elements with boat data
    function populateSelectedBoatBlock() {
      const r = Wized.data.r;
      const n = Wized.data.n;

      if (!r.Load_Selected_Boat || !r.Load_Selected_Boat.data) {
        return;
      }

      // Update selectedBoatBlock_image
      const imageElement = document.querySelector('[data-element="selectedBoatBlock_image"]');
      if (imageElement && r.Load_Selected_Boat.data.photos && r.Load_Selected_Boat.data.photos[0]) {
        imageElement.src = r.Load_Selected_Boat.data.photos[0].image.url;
      }

      // Update selectedBoatBlock_name
      const nameElement = document.querySelector('[data-element="selectedBoatBlock_name"]');
      if (nameElement) {
        nameElement.textContent = r.Load_Selected_Boat.data.name;
      }

      // Update selectedBoatBlock_companyName
      const companyNameElement = document.querySelector('[data-element="selectedBoatBlock_companyName"]');
      if (companyNameElement && r.Load_Selected_Boat.data._boat_company) {
        companyNameElement.textContent = r.Load_Selected_Boat.data._boat_company.name;
      }

      // Update selectedBoatBlock_datesDelivery
      const datesDeliveryElement = document.querySelector('[data-element="selectedBoatBlock_datesDelivery"]');
      if (datesDeliveryElement) {
        const rawDates = n.parameter.boatDates || "";
        const boatDelivery = n.parameter.boatDelivery === "true";
        
        // Decode if needed
        const decodedDates = decodeURIComponent(rawDates);
        const boatDates = decodedDates.split(",").filter(Boolean);
        
        if (boatDates.length === 0) {
          datesDeliveryElement.textContent = "";
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
        
        datesDeliveryElement.textContent = formatted;
      }
    }

    // Update pricing display when boat is selected
    function updatePricingDisplayForBoat() {
      const listingOnlyPricing = document.querySelector('[data-element="ListingOnly_Query_Price_Details"]');
      const listingExtrasPricing = document.querySelector('[data-element="ListingExtras_Query_Price_Details"]');
      
      if (listingOnlyPricing) {
        listingOnlyPricing.style.display = 'none';
      }
      
      if (listingExtrasPricing) {
        listingExtrasPricing.style.display = 'block';
        
        // Update Stay_Price_Amount
        const stayPriceElement = document.querySelector('[data-element="Stay_Price_Amount"]');
        if (stayPriceElement) {
          const r = Wized.data.r;
          if (r.Load_Property_Calendar_Query && r.Load_Property_Calendar_Query.data) {
            const total = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_nightsTotal) + 
                         Math.floor(r.Load_Property_Calendar_Query.data.dateRange_cleaningFee) + 
                         Math.floor(r.Load_Property_Calendar_Query.data.dateRange_serviceFee);
            stayPriceElement.textContent = "$" + total.toLocaleString();
          }
        }
      }
    }

    // Initialize boat functionality on page load
    handleBoatFunctionality();

    // Setup edit and remove boat handlers
    function setupBoatHandlers() {
      // Edit boat handler
      const editButton = document.querySelector('[data-element="editSelectedBoat"]');
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
                if (window.boatRentalService && window.boatRentalService.showBoatDetails) {
                  // Get the current boat data from the Load_Selected_Boat request
                  const r = Wized.data.r;
                  if (r.Load_Selected_Boat && r.Load_Selected_Boat.data) {
                    window.boatRentalService.showBoatDetails(r.Load_Selected_Boat.data);
                  } else {
                    // Fallback: create a minimal boat object with the ID
                    window.boatRentalService.showBoatDetails({ id: boatId });
                  }
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

      // Remove boat handler
      const removeButton = document.querySelector('[data-element="removeSelectedBoat"]');
      if (removeButton) {
        removeButton.addEventListener('click', () => {
          // Remove boatId and related parameters from URL
          const url = new URL(window.location);
          url.searchParams.delete('boatId');
          url.searchParams.delete('boatDates');
          url.searchParams.delete('boatLengthType');
          url.searchParams.delete('boatPickupTime');
          url.searchParams.delete('boatGuests');
          url.searchParams.delete('boatDelivery');

          window.history.pushState({}, '', url);

          // Hide the selected boat block
          const selectedBoatBlock = document.querySelector('[data-element="selectedBoatBlock"]');
          if (selectedBoatBlock) {
            selectedBoatBlock.style.display = 'none';
          }

          // Show listing-only pricing again
          const listingOnlyPricing = document.querySelector('[data-element="ListingOnly_Query_Price_Details"]');
          const listingExtrasPricing = document.querySelector('[data-element="ListingExtras_Query_Price_Details"]');
          
          if (listingOnlyPricing) {
            listingOnlyPricing.style.display = 'block';
          }
          
          if (listingExtrasPricing) {
            listingExtrasPricing.style.display = 'none';
          }

          // Trigger other updates if available
          if (window.updateBoatVisibility) window.updateBoatVisibility();
          if (window.updateListingOnlyPricing) window.updateListingOnlyPricing();
          if (window.updateReservationTotalContainer) window.updateReservationTotalContainer();
          if (window.updateSelectedBoatBlockVisibility) window.updateSelectedBoatBlockVisibility();
          if (window.handleBoatFunctionality) window.handleBoatFunctionality();
        });
      }
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
      const containerElement = document.querySelector('[data-element="Listing_Reservaton_Amount_Total_Container"]');
      if (!containerElement) return;

      const r = Wized.data.r;
      const n = Wized.data.n;

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
      containerElement.style.display = shouldShow ? 'flex' : 'none';
    }

    // Function to update reservation total display
    function updateReservationTotal() {
      const totalElement = document.querySelector('[data-element="Reservation_Total"]');
      const totalAmountElement = document.querySelector('[data-element="Reservation_TotalAmount"]');

      const r = Wized.data.r;

      // Check if required data exists
      if (!r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data ||
        !r.Load_Property_Calendar_Query.data.dateRange_totalPrice) {
        return;
      }

      const totalPrice = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_totalPrice);
      const formattedPrice = "$" + totalPrice.toLocaleString();

      // Update both elements with the same value
      if (totalElement) {
        totalElement.textContent = formattedPrice;
      }
      if (totalAmountElement) {
        totalAmountElement.textContent = formattedPrice;
      }
    }

    // Function to update selected boat block visibility
    function updateSelectedBoatBlockVisibility() {
      const selectedBoatBlock = document.querySelector('[data-element="selectedBoatBlock"]');
      if (!selectedBoatBlock) return;

      // Use URL parameters as source of truth
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');

      // Show block if boatId exists in URL
      if (boatId) {
        selectedBoatBlock.style.display = 'flex';
      } else {
        selectedBoatBlock.style.display = 'none';
      }
    }

    // Function to update add boat button visibility
    function updateAddBoatButtonVisibility() {
      const addBoatButton = document.querySelector('[data-element="addBoatButton"]');
      if (!addBoatButton) return;

      // Use URL parameters as source of truth
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');

      // Show button if boatId doesn't exist in URL
      if (!boatId) {
        addBoatButton.style.display = 'flex';
      } else {
        addBoatButton.style.display = 'none';
      }
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

    // Function to handle listing-only pricing display (no boat selected)
    function updateListingOnlyPricing() {
      const n = Wized.data.n;
      const r = Wized.data.r;

      // Check if there's no boatId (no boat selected)
      const hasNoBoat = !n || !n.parameter || n.parameter.boatId === null || !n.parameter.boatId;

      // Show/hide appropriate sections
      const listingOnlySection = document.querySelector('[data-element="ListingOnly_Query_Price_Details"]');
      const listingExtrasSection = document.querySelector('[data-element="ListingExtras_Query_Price_Details"]');

      if (listingOnlySection) {
        listingOnlySection.style.display = hasNoBoat ? 'flex' : 'none';
      }
      if (listingExtrasSection) {
        listingExtrasSection.style.display = hasNoBoat ? 'none' : 'flex';
      }

      // Only update content if no boat is selected and data exists
      if (!hasNoBoat || !r || !r.Load_Property_Calendar_Query || !r.Load_Property_Calendar_Query.data) {
        return;
      }

      // Update Nightly Price Text
      const nightlyPriceText = document.querySelector('[data-element="Nightly_Price_Text"]');
      if (nightlyPriceText && n.parameter.checkin && n.parameter.checkout) {
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

        nightlyPriceText.textContent = `$${nightlyRate} x ${differenceDays} nights`;
      }

      // Update Nightly Price Amount
      const nightlyPriceAmount = document.querySelector('[data-element="Nightly_Price_Amount"]');
      if (nightlyPriceAmount && r.Load_Property_Calendar_Query.data.dateRange_nightsTotal) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_nightsTotal);
        nightlyPriceAmount.textContent = `$${amount.toLocaleString()}`;
      }

      // Update Cleaning Fee Amount
      const cleaningFeeAmount = document.querySelector('[data-element="Cleaning_Fee_Amount"]');
      if (cleaningFeeAmount && r.Load_Property_Calendar_Query.data.dateRange_cleaningFee) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_cleaningFee);
        cleaningFeeAmount.textContent = `$${amount.toLocaleString()}`;
      }

      // Update Service Fee Amount
      const serviceFeeAmount = document.querySelector('[data-element="Service_Fee_Amount"]');
      if (serviceFeeAmount && r.Load_Property_Calendar_Query.data.dateRange_serviceFee) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_serviceFee);
        serviceFeeAmount.textContent = `$${amount.toLocaleString()}`;
      }

      // Update Taxes Amount
      const taxesAmount = document.querySelector('[data-element="Taxes_Amount"]');
      if (taxesAmount) {
        const data = r.Load_Property_Calendar_Query.data || {};
        const salesSurTax = parseFloat(data.dateRange_taxFee_salesSurTax) || 0;
        const salesTax = parseFloat(data.dateRange_taxFee_salesTax) || 0;
        const totalTax = salesSurTax + salesTax;
        taxesAmount.textContent = `$${totalTax.toFixed().toLocaleString()}`;
      }

      // Update Reservation Total
      const reservationTotal = document.querySelector('[data-element="Reservation_Total"]');
      const reservationTotalAmount = document.querySelector('[data-element="Reservation_TotalAmount"]');
      if (r.Load_Property_Calendar_Query.data.dateRange_totalPrice) {
        const amount = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_totalPrice);
        const formattedAmount = `$${amount.toLocaleString()}`;

        // Update both elements with the same value
        if (reservationTotal) {
          reservationTotal.textContent = formattedAmount;
        }
        if (reservationTotalAmount) {
          reservationTotalAmount.textContent = formattedAmount;
        }
      }

      // Update Free Cancellation Date Text
      const freeCancellationText = document.querySelector('[data-element="free_cancelation_date_text"]');
      if (freeCancellationText && r.Load_Property_Details && r.Load_Property_Details.data) {
        const property = r.Load_Property_Details.data.property;
        const cancellationPolicy = property.cancellation_policy;

        if (!cancellationPolicy) {
          freeCancellationText.textContent = "Non-refundable";
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
            freeCancellationText.textContent = "The reservation dates selected are non-refundable";
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
            freeCancellationText.textContent = "The reservation dates selected are non-refundable";
            return;
          }
        }

        // Format the cutoff date
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const suffix = (d) => (d >= 11 && d <= 13) ? "th" : ["st", "nd", "rd"][((d % 10) - 1)] || "th";
        const cutoffYear = cutoffDate.getFullYear();
        const cutoffMonth = monthNames[cutoffDate.getMonth()];
        const cutoffDay = cutoffDate.getDate();
        const cutoffDaySuffix = suffix(cutoffDay);

        const isMoreThanOneYear = cutoffDate - today > 365 * 24 * 60 * 60 * 1000;

        if (isMoreThanOneYear) {
          freeCancellationText.textContent = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
        } else {
          freeCancellationText.textContent = `Free cancellation until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
        }
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

    // Make functions globally available
    window.updateReservationTotalContainer = updateReservationTotalContainer;
    window.updateReservationTotal = updateReservationTotal;
    window.updateSelectedBoatBlockVisibility = updateSelectedBoatBlockVisibility;
    window.updateAddBoatButtonVisibility = updateAddBoatButtonVisibility;
    window.updateBoatVisibility = updateBoatVisibility;
    window.updateListingQueryPriceDetailsVisibility = updateListingQueryPriceDetailsVisibility;
    window.updateListingOnlyPricing = updateListingOnlyPricing;
  });
});


// Additional Services Section
// This section handles all extra services that can be added to a reservation
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wized
  window.Wized = window.Wized || [];
  window.Wized.push((Wized) => {



    // Boat Rental Service Handler
    class BoatRentalService {
      constructor() {
        this.button = document.querySelector('[data-element="addBoatButton"]');
        this.modal = document.querySelector('[data-element="addBoatModal"]');
        this.modalBackground = document.querySelector('[data-element="addBoatModalBackground"]');
        this.selectWrapper = document.querySelector('[data-element="addBoatModal_selectBoatWrapper"]');
        this.detailsWrapper = document.querySelector('[data-element="addBoatModal_boatDetailsWrapper"]');
        this.exitButton = document.querySelector('[data-element="addBoatModal_selectBoat_exit"]');
        this.cardTemplate = document.querySelector('[data-element="addBoatModal_selectBoat_card"]');
        this.cardWrapper = document.querySelector('[data-element="addBoatModal_selectBoat_cardWrapper"]');
        this.messageTimeout = null;

        // Boat details elements
        this.detailsBackButton = document.querySelector('[data-element="boatDetails_back"]');
        this.currentBoatData = null; // Store current boat being viewed

        // Filter elements
        this.selectedBoatBlock = document.querySelector('[data-element="selectedBoatBlock"]');
        this.datesFilter = document.querySelector('[data-element="addBoatModal_selectBoat_dates"]');
        this.datesFilterText = document.querySelector('[data-element="addBoatModal_selectBoat_datesText"]');
        this.datesPopup = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup"]');
        this.datesPopupExit = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_exit"]');
        this.selectDatesSection = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_selectDates"]');
        this.fullDayBtn = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_fullDay"]');
        this.halfDayBtn = document.querySelector('[data-element="addBoatModal_selectBoat_datesPopup_halfDay"]');
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

        // Boat details date filter elements
        this.boatDetailsDateFilter = document.querySelector('[data-element="boatDetails_reservation_dateTime"]');
        this.boatDetailsDateFilterText = document.querySelector('[data-element="boatDetails_reservation_dateTimeText"]');
        this.boatDetailsPopup = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup"]');
        this.boatDetailsPopupExit = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_exit"]');
        this.boatDetailsSelectDatesSection = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_selectDates"]');
        this.boatDetailsFullDayBtn = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_fullDay"]');
        this.boatDetailsHalfDayBtn = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_halfDay"]');
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
        this.boatDetailsGuestMinus = document.querySelector('[data-element="BoatDetails_Guest_Minus"]');
        this.boatDetailsGuestNumber = document.querySelector('[data-element="boatDetailsGuest_number"]');
        this.boatDetailsGuestPlus = document.querySelector('[data-element="BoatDetails_Guest_Plus"]');
        this.boatDetailsGuestsClearBtn = document.querySelector('[data-element="boatDetails_guestsPopup_clearButton"]');

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

        console.log(this.centerConsoleBlock);

        // Filter state
        this.selectedDates = [];
        this.selectedLengthType = 'full';
        this.selectedPickupTime = '';
        this.selectedGuests = 0;
        this.selectedPriceMin = 0;
        this.selectedPriceMax = 12000;
        this.deliverySelected = false;
        this.maxPriceAdjusted = false; // Track if max price has been manually adjusted
        this.selectedLengthMin = 0;
        this.selectedLengthMax = 50;
        this.maxLengthAdjusted = false; // Track if max length has been manually adjusted
        this.selectedBoatTypes = []; // Track selected boat types
        this.selectedPrivateDock = false; // Track if private dock filter is selected

        this.initialize();
      }

      initialize() {
        if (!this.button || !this.modal || !this.selectWrapper || !this.detailsWrapper || !this.exitButton || !this.cardTemplate || !this.cardWrapper) {
          console.warn('Some boat rental elements are missing from the DOM');
          return;
        }

        // Set initial styles
        this.modal.style.display = 'none';
        this.detailsWrapper.style.display = 'none';
        this.cardTemplate.style.display = 'none';

        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.lengthPopup) this.lengthPopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';
        if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
        if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';

        // Add click handlers
        this.button.addEventListener('click', () => this.handleButtonClick());
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

        // Setup pickup time pill handlers
        this.setupPickupTimePills();

        // Check property private dock status and setup visibility
        this.checkPropertyPrivateDockStatus();
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
            // Show elements if property has private dock
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
            // If clicking already selected pill, deselect it
            if (this.selectedPickupTime === time) {
              this.selectedPickupTime = '';
              pill.style.borderColor = '';
            } else {
              // Deselect all pills first
              Object.values(this.pickupTimePills).forEach(p => {
                if (p) p.style.borderColor = '';
              });

              // Select the clicked pill
              this.selectedPickupTime = time;
              pill.style.borderColor = '#000000';
            }

            this.updateDatesFilterText();
            this.updateFilterStyles();
            this.updateURLParams();
          });
        });
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for boatId - if present, hide button and show selected boat block
        const boatId = urlParams.get('boatId');
        if (boatId) {
          this.button.style.display = 'none';
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'flex';
        } else {
          this.button.style.display = 'flex';
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'none';
        }

        // Initialize other parameters
        const boatGuests = urlParams.get('boatGuests');
        const boatDates = urlParams.get('boatDates');
        const boatPickupTime = urlParams.get('boatPickupTime');
        const boatLengthType = urlParams.get('boatLengthType');
        const boatPrivateDock = urlParams.get('boatPrivateDock');

        // Set guests
        this.selectedGuests = boatGuests ? parseInt(boatGuests) : 0;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();

        // Set dates
        if (boatDates) {
          this.selectedDates = boatDates.split(',');
        }

        // Set length type
        this.selectedLengthType = boatLengthType || 'full';
        this.updateLengthTypeButtons();

        // Set pickup time
        this.selectedPickupTime = boatPickupTime || '';
        Object.entries(this.pickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
          }
        });

        // Set private dock filter
        this.selectedPrivateDock = boatPrivateDock === 'true';

        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.renderDateSelection();
        this.updatePrivateDockFilterText();
      }

      setupFilterHandlers() {
        // Function to close all popups
        const closeAllPopups = () => {
          if (this.datesPopup) this.datesPopup.style.display = 'none';
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
          });
        }

        if (this.datesPopupExit) {
          this.datesPopupExit.addEventListener('click', () => {
            closeAllPopups();
          });
        }

        // Day type handlers
        if (this.fullDayBtn) {
          this.fullDayBtn.addEventListener('click', () => {
            if (this.selectedDates.length <= 1) {
              this.selectedLengthType = 'full';
              this.updateLengthTypeButtons();
              this.updateDatesFilterText();
              this.updateFilterStyles();
              this.updateExistingCards();
              this.updateURLParams();
            }
          });
        }

        if (this.halfDayBtn) {
          this.halfDayBtn.addEventListener('click', () => {
            if (this.selectedDates.length === 1) {
              this.selectedLengthType = 'half';
              this.updateLengthTypeButtons();
              this.updateDatesFilterText();
              this.updateFilterStyles();
              this.updateExistingCards();
              this.updateURLParams();
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
            this.selectedPrivateDock = !this.selectedPrivateDock;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            this.updateURLParams();

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
                }
              }
            }

            this.refilterBoatsIfModalOpen();
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
          dateBtn.style.background = this.selectedDates.includes(dateStr) ? '#000000' : 'white';
          dateBtn.style.color = this.selectedDates.includes(dateStr) ? 'white' : 'black';
          dateBtn.style.cursor = 'pointer';
          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          dateBtn.addEventListener('click', () => {
            this.handleDateSelection(dateStr);
          });

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

      handleDateSelection(dateStr) {
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
          }
        }
        // If multiple dates selected (range exists), clear and start new selection
        else {
          this.selectedDates = [dateStr];
        }

        // Update all button styles
        this.updateDateButtonStyles();

        // Update length type options
        this.updateLengthTypeButtons();
        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.updateExistingCards();
        this.updateURLParams();
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
          const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
          this.datesFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day${timeText})`;
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

          const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
          this.datesFilterText.textContent = `${dateRange}${timeText}`;
        }
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
          const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
          this.boatDetailsDateFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day${timeText})`;
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

          const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
          this.boatDetailsDateFilterText.textContent = `${dateRange}${timeText}`;
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

        if (this.selectedLengthType !== 'full') {
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
        return boats.filter(boat => {
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

          // Filter by price range
          const totalPrice = this.calculateBoatPrice(boat);
          if (totalPrice < this.selectedPriceMin) {
            return false;
          }
          // Only apply max price filter if it has been manually adjusted
          if (this.maxPriceAdjusted && totalPrice > this.selectedPriceMax) {
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

          // Filter by boat type
          if (this.selectedBoatTypes.length > 0) {
            const boatType = boat.boatType;
            if (!this.selectedBoatTypes.includes(boatType)) {
              return false;
            }
          }



          // Filter by private dock delivery
          if (this.selectedPrivateDock) {
            // Check if boat delivers
            if (!boat.delivers) {
              return false;
            }

            // Get property city from Wized data
            const r = Wized.data.r;



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
      }

      async fetchAndRenderBoats() {
        try {
          // Fetch all boat options
          const allBoats = await this.fetchBoatOptions();

          // Filter boats based on guest count
          const filteredBoats = this.filterBoats(allBoats);

          // Render the filtered boats
          this.renderBoatCards(filteredBoats);

          return filteredBoats;
        } catch (error) {
          console.error('Error in fetchAndRenderBoats:', error);
          this.renderBoatCards([]);
          return [];
        }
      }

      async fetchBoatOptions() {
        try {
          // Get property ID from URL
          const urlParams = new URLSearchParams(window.location.search);
          const propertyId = urlParams.get('id');

          if (!propertyId) {
            console.warn('Property ID not found in URL');
            return [];
          }

          const params = new URLSearchParams({
            propertyID: propertyId
          });

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
                  deliversTo: company.privateDockDeliveryCity || [],
                  address: company.address || '',
                  city: company.city || '',
                  companyName: company.name || '',
                  companyDescription: company.company_description || '',
                  companyProfileImage: company.profilePic || '',
                  companyDeliveryFee: company.deliveryFee || 0,
                  companyDelivers: company.delivers || false,
                };
              }
              return boat;
            });

            return mergedBoats;
          }

          // Fallback for old format (if data is directly an array)
          return Array.isArray(data) ? data : [];

        } catch (error) {
          console.error('Error fetching boat options:', error);
          return [];
        }
      }

      renderBoatCards(boats) {
        // Clear any existing duplicated cards
        const existingCards = this.cardWrapper.querySelectorAll('[data-element="addBoatModal_selectBoat_card"]');
        existingCards.forEach((card, index) => {
          if (index !== 0) { // Keep the template card
            card.remove();
          }
        });

        // If no boats, hide the template card
        if (boats.length === 0) {
          this.cardTemplate.style.display = 'none';
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

          // Populate card with boat data
          this.populateBoatCard(card, boat);
        });
      }

      populateBoatCard(card, boat) {
        // Store boat data on the card for later updates
        card.boatData = boat;

        // Add click handlers for card interactions
        const moreDetailsButton = card.querySelector('[data-element="addBoatModal_selectBoat_card_moreDetails"]');

        // Make entire card clickable (except for specific interactive elements)
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          // Prevent navigation if clicking on interactive elements
          if (e.target.closest('[data-element="addBoatModal_selectBoat_card_moreDetails"]')) {
            return;
          }
          this.showBoatDetails(boat);
        });

        // Add click handler for more details button if it exists
        if (moreDetailsButton) {
          moreDetailsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            this.showBoatDetails(boat);
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

        // Populate card photo
        const photoElement = card.querySelector('[data-element="addBoatModal_selectBoat_card_photo"]');
        if (photoElement && boat.photos && boat.photos.length > 0) {
          // Find photo with order = 1
          const mainPhoto = boat.photos.find(photo => photo.order === 1);
          if (mainPhoto && mainPhoto.image && mainPhoto.image.url) {
            photoElement.style.backgroundImage = `url('${mainPhoto.image.url}')`;
            photoElement.style.backgroundSize = 'cover';
            photoElement.style.backgroundPosition = 'center';
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
        const minLength = boat.minReservationLength || 0;

        if (minLength === 0) {
          return "Daily (4-8 hours) • Multi-Day";
        } else if (minLength === 1) {
          return "Daily (8 hours) • Multi-Day";
        } else {
          return `Multi-Day (${minLength} days min)`;
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
        const minLength = boat.minReservationLength || 0;
        let basePrice = 0;

        if (minLength <= 0.5) {
          basePrice = boat.pricePerHalfDay || 0;
        } else if (minLength === 1) {
          basePrice = boat.pricePerDay || 0;
        } else {
          basePrice = boat.pricePerDay || 0;
        }

        // Add delivery fee if private dock filter is selected and boat can deliver
        if (this.selectedPrivateDock && boat.companyDelivers && boat.companyDeliveryFee) {
          basePrice += boat.companyDeliveryFee;
        }

        if (minLength <= 0.5) {
          return `Starting at $${basePrice.toLocaleString()}`;
        } else if (minLength === 1) {
          return `Starting at $${basePrice.toLocaleString()}`;
        } else {
          return `Starting at $${basePrice.toLocaleString()} per day`;
        }
      }

      calculateSelectedPriceText(boat) {
        let basePrice = 0;
        const numDates = this.selectedDates.length;

        if (numDates === 1) {
          // Single day reservation
          if (this.selectedLengthType === 'half') {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else {
          // Multi-day reservation
          if (numDates >= 30 && boat.pricePerMonth) {
            // Handle 30+ days with monthly rate
            const months = Math.floor(numDates / 30);
            const remainingDays = numDates % 30;
            const monthlyPrice = boat.pricePerMonth * months;

            // Calculate remaining days price
            let dailyRate = boat.pricePerDay || 0;
            if (boat.pricePerWeek) {
              dailyRate = boat.pricePerWeek / 7; // Use weekly daily rate if available
            }

            basePrice = monthlyPrice + (remainingDays * dailyRate);
          } else if (numDates === 7 && boat.pricePerWeek) {
            // Use weekly rate for exactly 7 days if available
            basePrice = boat.pricePerWeek;
          } else if (numDates > 7 && boat.pricePerWeek) {
            // Use weekly daily rate for periods longer than a week to continue discount
            const weeklyDailyRate = boat.pricePerWeek / 7;
            basePrice = numDates * weeklyDailyRate;
          } else {
            // Use daily rate for shorter periods or when no weekly/monthly rates available
            basePrice = numDates * (boat.pricePerDay || 0);
          }
        }

        // Apply service fee
        const serviceFee = boat.serviceFee || 0;
        let totalPrice = basePrice * (1 + serviceFee);

        // Add delivery fee if private dock filter is selected and boat can deliver
        if (this.selectedPrivateDock && boat.companyDelivers && boat.companyDeliveryFee) {
          totalPrice += boat.companyDeliveryFee;
        }

        // Round and format with commas
        return `$${Math.round(totalPrice).toLocaleString()} total price`;
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
      }

      async handleButtonClick() {
        if (!this.areDatesValid()) {
          const urlParams = new URLSearchParams(window.location.search);
          const hasDates = urlParams.has('checkin') && urlParams.has('checkout');

          const message = hasDates
            ? 'Valid dates must be selected to add boat rental'
            : 'Dates must be selected to add boat rental';

          this.showMessage(message);
          return;
        }

        // Ensure modal always opens to select wrapper view
        this.detailsWrapper.style.display = 'none';
        this.selectWrapper.style.display = 'flex';

        // Show modal
        this.modal.style.display = 'flex';

        // Prevent body scroll when modal is open
        document.body.classList.add('no-scroll');

        // Fetch and render boat options with filtering
        await this.fetchAndRenderBoats();
      }

      areDatesValid() {
        // Check if dates exist in URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout || checkin === '' || checkout === '') {
          return false;
        }

        // Get calendar data from Wized
        const r = Wized.data.r;

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

        // Return true only if all days are available and minimum nights requirement is met
        return allAvailable && meetsMinNights;
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

      updateButtonState() {
        const isValid = this.areDatesValid();

        // Update button styles
        this.button.style.borderColor = isValid ? '' : '#e2e2e2';
        this.button.style.opacity = isValid ? '1' : '0.5';
        this.button.style.cursor = isValid ? 'pointer' : 'not-allowed';
      }

      setupFilterXButtons() {
        // Setup dates X button
        if (this.datesFilterX) {
          this.datesFilterX.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening the popup
            this.clearDatesFilter();
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
        // Clear all date-related filters
        this.selectedDates = [];
        this.selectedLengthType = 'full';
        this.selectedPickupTime = '';

        // Reset pickup time pills
        Object.values(this.pickupTimePills).forEach(pill => {
          if (pill) pill.style.borderColor = '';
        });

        // Update UI elements
        this.updateLengthTypeButtons();
        this.updateDatesFilterText();
        this.updateDateButtonStyles();
        this.updateFilterStyles();
        this.updateExistingCards();
        this.updateURLParams();
      }

      clearGuestsFilter() {
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
        // Update dates filter button style
        if (this.datesFilter && this.datesFilterText) {
          const hasDatesFilter = this.selectedDates.length > 0 || this.selectedPickupTime;

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
          const hasPriceFilter = this.selectedPriceMin > 0 || this.maxPriceAdjusted;

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
        // Show/hide dates X button
        if (this.datesFilterX) {
          const hasDatesFilter = this.selectedDates.length > 0 || this.selectedPickupTime;
          this.datesFilterX.style.display = hasDatesFilter ? 'flex' : 'none';
        }

        // Show/hide guests X button
        if (this.guestsFilterX) {
          const hasGuestsFilter = this.selectedGuests > 0;
          this.guestsFilterX.style.display = hasGuestsFilter ? 'flex' : 'none';
        }

        // Show/hide price X button
        if (this.priceFilterX) {
          const hasPriceFilter = this.selectedPriceMin > 0 || this.maxPriceAdjusted;
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

      calculateBoatPrice(boat) {
        // Calculate the total price for filtering purposes
        let basePrice = 0;
        const numDates = this.selectedDates.length;

        if (numDates === 0) {
          // No dates selected, use minimum price (starting price)
          const minLength = boat.minReservationLength || 0;
          if (minLength <= 0.5) {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else if (numDates === 1) {
          // Single day reservation
          if (this.selectedLengthType === 'half') {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else {
          // Multi-day reservation - same logic as calculateSelectedPriceText
          if (numDates >= 30 && boat.pricePerMonth) {
            const months = Math.floor(numDates / 30);
            const remainingDays = numDates % 30;
            const monthlyPrice = boat.pricePerMonth * months;

            let dailyRate = boat.pricePerDay || 0;
            if (boat.pricePerWeek) {
              dailyRate = boat.pricePerWeek / 7; // Use weekly daily rate if available
            }

            basePrice = monthlyPrice + (remainingDays * dailyRate);
          } else if (numDates === 7 && boat.pricePerWeek) {
            basePrice = boat.pricePerWeek;
          } else if (numDates > 7 && boat.pricePerWeek) {
            const weeklyDailyRate = boat.pricePerWeek / 7;
            basePrice = numDates * weeklyDailyRate;
          } else {
            basePrice = numDates * (boat.pricePerDay || 0);
          }
        }

        // Apply service fee
        const serviceFee = boat.serviceFee || 0;
        const totalPrice = basePrice * (1 + serviceFee);

        return Math.round(totalPrice);
      }

      setupPriceFilter() {
        if (!this.priceScrollBar) return;

        const maxPrice = 12000;

        // Create range slider
        this.priceScrollBar.innerHTML = `
          <div class="price-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
            <div class="price-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
            <div class="price-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
            <input type="range" class="price-slider-min" min="0" max="${maxPrice}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <input type="range" class="price-slider-max" min="0" max="${maxPrice}" value="${maxPrice}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <div class="price-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
            <div class="price-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
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
          this.selectedPriceMin = minVal;
          this.selectedPriceMax = maxVal;

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
          e.preventDefault();
          if (isMin) {
            isDraggingMin = true;
            startX = e.clientX;
            startLeft = parseInt(sliderMin.value);
          } else {
            isDraggingMax = true;
            startX = e.clientX;
            startLeft = parseInt(sliderMax.value);
          }
        };

        const handleDragMove = (e) => {
          if (!isDraggingMin && !isDraggingMax) return;

          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const moveX = e.clientX - startX;
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

        // Add touch event listeners for mobile
        thumbMin.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], true));
        thumbMax.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], false));
        document.addEventListener('touchmove', (e) => handleDragMove(e.touches[0]));
        document.addEventListener('touchend', handleDragEnd);

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

        // Set initial values
        if (this.priceMinInput) this.priceMinInput.value = '$0';
        if (this.priceMaxInput) this.priceMaxInput.value = `$${maxPrice.toLocaleString()}+`;

        updateSlider();
      }

      clearPriceFilter() {
        // Reset price filter to default values
        this.selectedPriceMin = 0;
        this.selectedPriceMax = 12000;
        this.maxPriceAdjusted = false; // Reset the adjustment flag

        // Update slider if it exists
        if (this.priceScrollBar) {
          const sliderMin = this.priceScrollBar.querySelector('.price-slider-min');
          const sliderMax = this.priceScrollBar.querySelector('.price-slider-max');
          if (sliderMin) sliderMin.value = 0;
          if (sliderMax) sliderMax.value = 12000;

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

        const hasFilter = this.selectedPriceMin > 0 || this.maxPriceAdjusted;

        if (!hasFilter) {
          this.priceFilterText.textContent = 'Price';
        } else {
          const minText = this.selectedPriceMin > 0 ? `$${this.selectedPriceMin.toLocaleString()}` : '$0';
          const maxText = this.selectedPriceMax >= 12000 ? '$12,000+' : `$${this.selectedPriceMax.toLocaleString()}`;
          this.priceFilterText.textContent = `${minText} - ${maxText}`;
        }
      }

      setupLengthFilter() {
        if (!this.lengthScrollBar) return;

        const maxLength = 50;

        // Create range slider
        this.lengthScrollBar.innerHTML = `
          <div class="length-slider-container" style="position: relative; width: 100%; height: 32px; margin: 20px 0;">
            <div class="length-slider-track" style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: #E5E5E5; border-radius: 2px;"></div>
            <div class="length-slider-range" style="position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #000; border-radius: 2px;"></div>
            <input type="range" class="length-slider-min" min="0" max="${maxLength}" value="0" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <input type="range" class="length-slider-max" min="0" max="${maxLength}" value="${maxLength}" style="position: absolute; width: 100%; opacity: 0; cursor: pointer;">
            <div class="length-slider-thumb-min" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
            <div class="length-slider-thumb-max" style="position: absolute; top: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: white; border: 1px solid #000; border-radius: 50%; cursor: pointer;"></div>
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
          e.preventDefault();
          if (isMin) {
            isDraggingMin = true;
            startX = e.clientX;
            startLeft = parseInt(sliderMin.value);
          } else {
            isDraggingMax = true;
            startX = e.clientX;
            startLeft = parseInt(sliderMax.value);
          }
        };

        const handleDragMove = (e) => {
          if (!isDraggingMin && !isDraggingMax) return;

          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const moveX = e.clientX - startX;
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

        // Add touch event listeners for mobile
        thumbMin.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], true));
        thumbMax.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], false));
        document.addEventListener('touchmove', (e) => handleDragMove(e.touches[0]));
        document.addEventListener('touchend', handleDragEnd);

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
          { block: this.centerConsoleBlock, checkbox: this.centerConsoleCheckbox, type: 'Center console' },
          { block: this.flatsBoatBlock, checkbox: this.flatsBoatCheckbox, type: 'Flats boat' },
          { block: this.deckBoatBlock, checkbox: this.deckBoatCheckbox, type: 'Deck boat' },
          { block: this.pontoonBoatBlock, checkbox: this.pontoonBoatCheckbox, type: 'Pontoon boat' }
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
        // Reset boat type filter
        this.selectedBoatTypes = [];

        // Reset checkbox styles
        const checkboxes = [
          this.centerConsoleCheckbox,
          this.flatsBoatCheckbox,
          this.deckBoatCheckbox,
          this.pontoonBoatCheckbox
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

      showBoatDetails(boat) {
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

        // Populate the boat details
        this.populateBoatDetails(boat);
      }

      hideBoatDetails() {
        // Hide details wrapper and show select wrapper
        this.detailsWrapper.style.display = 'none';
        this.selectWrapper.style.display = 'flex';

        // Sync state from URL parameters to reflect any changes made in boat details
        this.initializeFromURL();

        // Re-filter and render boats with updated parameters
        this.fetchAndRenderBoats();

        // Clear the current boat data
        this.currentBoatData = null;
      }

      populateBoatDetails(boat) {
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
        if (boatDetailsDescription) {
          boatDetailsDescription.textContent = boat.description || '';
        }

        // Detailed boat specifications
        const boatDetailsBoatYear = document.querySelector('[data-element="boatDetails_boatYear"]');
        if (boatDetailsBoatYear) {
          boatDetailsBoatYear.textContent = boat.year || '';
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
        if (boatDetailsBoatModel) {
          boatDetailsBoatModel.textContent = boat.model || '';
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
          boatDetailsCompanyName.textContent = boat.companyName ? `Hosted by ${boat.companyName}` : '';
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
                console.error('Geocoding failed:', status);
                // Hide map if geocoding fails
                mapElement.style.display = 'none';
              }
            });
          }
        }

        const boatDetailsAddress = document.querySelector('[data-element="boatDetails_cityState"]');
        if (boatDetailsAddress) {
          boatDetailsAddress.textContent = boat.address || '';
        }

        const cancellationPolicy = document.querySelector('[data-element="boatDetails_cancellationPolicy"]');
        if (cancellationPolicy) {
          cancellationPolicy.textContent = boat.cancellationPolicy || '';
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

        // Create carousel structure
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: 320px;
          overflow: hidden;
          border-radius: 12px;
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
            flex: 0 0 50%;
            height: 320px;
            padding: 0 6px;
            box-sizing: border-box;
          `;

          const imageWrapper = document.createElement('div');
          imageWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 8px;
            overflow: hidden;
            background-color: #f0f0f0;
            cursor: pointer;
            transition: transform 0.2s ease;
          `;

          const img = document.createElement('img');
          img.src = photo.image.url;
          img.alt = `Boat image ${index + 1}`;
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

          // Add hover effect
          imageWrapper.addEventListener('mouseenter', () => {
            imageWrapper.style.transform = 'scale(1.02)';
          });
          imageWrapper.addEventListener('mouseleave', () => {
            imageWrapper.style.transform = 'scale(1)';
          });

          // Add click handler to open full-size modal
          imageWrapper.addEventListener('click', () => {
            this.openImageModal(sortedPhotos, index);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are more than 2 images
        if (sortedPhotos.length > 2) {
          let currentIndex = 0;
          const maxIndex = Math.max(0, sortedPhotos.length - 2); // Show 2 images at a time

          // Create counter first so it can be referenced in navigation
          const counter = document.createElement('div');
          counter.style.cssText = `
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-family: 'TT Fors', sans-serif;
            z-index: 10;
          `;

          const updateCounter = () => {
            const startImage = currentIndex + 1;
            const endImage = Math.min(currentIndex + 2, sortedPhotos.length);
            counter.textContent = `${startImage}-${endImage} of ${sortedPhotos.length}`;
          };

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
            const translateX = -(currentIndex * 50); // Move by exactly 50% (width of one image container)
            imagesTrack.style.transform = `translateX(${translateX}%)`;
            updateButtonStates();
            updateCounter();
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
          updateCounter();

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
          carouselWrapper.appendChild(counter);
        }

        // Add simple counter for 1-2 images
        else if (sortedPhotos.length > 1) {
          const counter = document.createElement('div');
          counter.style.cssText = `
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-family: 'TT Fors', sans-serif;
            z-index: 10;
          `;
          counter.textContent = `1-${sortedPhotos.length} of ${sortedPhotos.length}`;
          carouselWrapper.appendChild(counter);
        }

        imagesContainer.appendChild(carouselWrapper);
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
          border-radius: 8px;
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

        // Image counter
        const counter = document.createElement('div');
        counter.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-family: 'TT Fors', sans-serif;
          z-index: 10001;
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

        // Update image and counter
        const updateImage = () => {
          const photo = photos[currentIndex];
          img.src = photo.image.url;
          img.alt = `Boat image ${currentIndex + 1}`;
          counter.textContent = `${currentIndex + 1} of ${photos.length}`;

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
        modal.appendChild(counter);

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
        // Get the reservation button and error element
        const addToReservationButton = document.querySelector('[data-element="boatDetails_reservation_addToReservationButton"]');
        const errorElement = document.querySelector('[data-element="boatDetails_reservation_addToReservationError"]');

        if (!addToReservationButton) return;

        // Hide error element initially
        if (errorElement) {
          errorElement.style.display = 'none';
        }

        // Remove any existing event listeners to prevent duplicates
        const newButton = addToReservationButton.cloneNode(true);
        addToReservationButton.parentNode.replaceChild(newButton, addToReservationButton);

        // Add click handler to the new button
        newButton.addEventListener('click', () => {
          this.handleAddToReservation(boat, errorElement);
        });
      }

      handleAddToReservation(boat, errorElement) {
        // Get current URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        // Check required parameters
        const missingParams = [];

        // Check boatDates
        if (!this.selectedDates || this.selectedDates.length === 0) {
          missingParams.push('Please select boat rental dates');
        }

        // Check boatGuests
        if (!this.selectedGuests || this.selectedGuests === 0) {
          missingParams.push('Please add total passengers');
        }

        // Check boatPickupTime
        if (!this.selectedPickupTime) {
          missingParams.push('Please select a pickup time');
        }

        // Check boatLengthType (this should always have a default value, but let's be safe)
        if (!this.selectedLengthType) {
          missingParams.push('Please select rental duration');
        }

        // If there are missing parameters, show error and return
        if (missingParams.length > 0) {
          if (errorElement) {
            errorElement.textContent = missingParams[0]; // Show the first missing parameter
            errorElement.style.display = 'flex';
          }
          return;
        }

        // All parameters are present, proceed with adding boat to reservation

        // Hide error element
        if (errorElement) {
          errorElement.style.display = 'none';
        }

        // Add boatId to URL parameters
        const url = new URL(window.location);
        url.searchParams.set('boatId', boat.id);
        window.history.pushState({}, '', url);

        // Update the service state to reflect the boat selection
        this.initializeFromURL();

        // Close the modal
        this.closeModal();

        // Ensure proper visibility: selectBoatWrapper as flex, boatDetailsWrapper hidden
        this.selectWrapper.style.display = 'flex';
        this.detailsWrapper.style.display = 'none';

        // Trigger other updates to ensure proper visibility
        if (window.updateBoatVisibility) window.updateBoatVisibility();
        if (window.handleBoatFunctionality) window.handleBoatFunctionality();
      }

      setupDeliveryCheckbox(boat) {
        const deliveryCheckbox = document.querySelector('[data-element="boatDetails_reservation_deliveryCheckbox"]');
        const deliveryText = document.querySelector('[data-element="boatDetails_reservation_deliveryText"]');
        const deliveryBlock = document.querySelector('[data-element="boatDetails_reservation_deliveryBlock"]');

        if (!deliveryCheckbox || !deliveryText) return;

        // Remove any existing event listeners to prevent duplicates
        const newCheckbox = deliveryCheckbox.cloneNode(true);
        deliveryCheckbox.parentNode.replaceChild(newCheckbox, deliveryCheckbox);
        const checkbox = newCheckbox; // Use the new checkbox reference

        // Check if property has private dock - hide delivery block if it doesn't
        const r = Wized.data.r;
        if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property) {
          const hasPrivateDock = r.Load_Property_Details.data.property.private_dock;
          if (hasPrivateDock === false) {
            if (deliveryBlock) {
              deliveryBlock.style.display = 'none';
            }
            // Don't reset URL parameters - just hide the delivery option for this boat
            this.deliverySelected = false;
            return;
          }
        }

        // Check if company delivers - hide block if they don't
        if (boat.companyDelivers === false) {
          if (deliveryBlock) {
            deliveryBlock.style.display = 'none';
          }
          // Don't reset URL parameters - just hide the delivery option for this boat
          this.deliverySelected = false;
          return;
        } else {
          // Show delivery block if company delivers
          if (deliveryBlock) {
            deliveryBlock.style.display = '';
          }
        }

        // Initialize delivery state - prioritize actual delivery selection over private dock auto-selection
        const urlParams = new URLSearchParams(window.location.search);
        const isDeliverySelected = urlParams.get('boatDelivery') === 'true';
        const isPrivateDockSelected = urlParams.get('boatPrivateDock') === 'true';

        // Only auto-select delivery if private dock is selected AND delivery isn't explicitly set to false
        if (isPrivateDockSelected && urlParams.get('boatDelivery') !== 'false') {
          this.deliverySelected = true;
        } else {
          this.deliverySelected = isDeliverySelected;
        }

        // Set initial checkbox state
        this.updateCheckboxVisual(checkbox, this.deliverySelected);

        // Set delivery text based on delivery fee
        const deliveryFee = boat.companyDeliveryFee || 0;
        if (deliveryFee === 0 || deliveryFee === null) {
          deliveryText.textContent = 'Complimentary boat delivery';
        } else {
          deliveryText.textContent = `Delivered to property ($${deliveryFee})`;
        }

        // Add click handler to the new checkbox
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

          // Update pricing
          this.updateBoatDetailsPricing(boat);
        });
      }

      updateCheckboxVisual(checkbox, isChecked) {
        // Add or remove checkmark visual indicator
        if (isChecked) {
          checkbox.style.backgroundColor = '#000000';
          checkbox.style.borderColor = '#000000';
          checkbox.innerHTML = '✓';
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

        if (this.selectedDates.length === 0) {
          // No dates selected - show starting price
          if (reservationPrice) {
            reservationPrice.textContent = this.getStartingPriceText(boat);
          }
          // Clear breakdown elements when no dates selected
          if (priceFeeElement) priceFeeElement.textContent = '';
          if (taxesElement) taxesElement.textContent = '';
          if (totalPriceElement) totalPriceElement.textContent = '';
          return;
        }

        // Calculate base price
        let basePrice = this.calculateBasePrice(boat);

        // Add delivery fee if selected
        const deliveryFee = (this.deliverySelected && boat.companyDeliveryFee) ? boat.companyDeliveryFee : 0;
        const priceWithDelivery = basePrice + deliveryFee;

        // Calculate taxes (7.5% of price + delivery fee)
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
          reservationPrice.textContent = `$${Math.round(totalPrice).toLocaleString()} total price`;
        }
      }

      calculateBasePrice(boat) {
        let basePrice = 0;
        const numDates = this.selectedDates.length;

        if (numDates === 1) {
          // Single day reservation
          if (this.selectedLengthType === 'half') {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else {
          // Multi-day reservation
          if (numDates >= 30 && boat.pricePerMonth) {
            // Handle 30+ days with monthly rate
            const months = Math.floor(numDates / 30);
            const remainingDays = numDates % 30;
            const monthlyPrice = boat.pricePerMonth * months;

            // Calculate remaining days price
            let dailyRate = boat.pricePerDay || 0;
            if (boat.pricePerWeek) {
              dailyRate = boat.pricePerWeek / 7; // Use weekly daily rate if available
            }

            basePrice = monthlyPrice + (remainingDays * dailyRate);
          } else if (numDates === 7 && boat.pricePerWeek) {
            // Use weekly rate for exactly 7 days if available
            basePrice = boat.pricePerWeek;
          } else if (numDates > 7 && boat.pricePerWeek) {
            // Use weekly daily rate for periods longer than a week to continue discount
            const weeklyDailyRate = boat.pricePerWeek / 7;
            basePrice = numDates * weeklyDailyRate;
          } else {
            // Use daily rate for shorter periods or when no weekly/monthly rates available
            basePrice = numDates * (boat.pricePerDay || 0);
          }
        }

        // Apply service fee
        const serviceFee = boat.serviceFee || 0;
        return basePrice * (1 + serviceFee);
      }

      initializeBoatDetailsDateFilter() {
        // Initialize boat details date filter text
        if (this.boatDetailsDateFilterText) {
          if (this.selectedDates.length === 0) {
            this.boatDetailsDateFilterText.textContent = 'Select dates';
          } else if (this.selectedDates.length === 1) {
            const dateStr = this.selectedDates[0];
            const formattedDate = this.formatDateStringForDisplay(dateStr);
            const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
            this.boatDetailsDateFilterText.textContent = `${formattedDate} (${this.selectedLengthType} day${timeText})`;
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

            const timeText = this.selectedPickupTime ? ` at ${this.selectedPickupTime}` : '';
            this.boatDetailsDateFilterText.textContent = `${dateRange}${timeText}`;
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
          dateBtn.style.background = this.selectedDates.includes(dateStr) ? '#000000' : 'white';
          dateBtn.style.color = this.selectedDates.includes(dateStr) ? 'white' : 'black';
          dateBtn.style.cursor = 'pointer';
          dateBtn.style.display = 'flex';
          dateBtn.style.alignItems = 'center';
          dateBtn.style.justifyContent = 'center';
          dateBtn.style.fontSize = '14px';
          dateBtn.style.fontFamily = 'TT Fors, sans-serif';
          dateBtn.style.fontWeight = '500';

          dateBtn.addEventListener('click', () => {
            this.handleBoatDetailsDateSelection(dateStr);
          });

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
          });
        }

        // Boat details popup exit handler
        if (this.boatDetailsPopupExit) {
          this.boatDetailsPopupExit.addEventListener('click', () => {
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
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
          });
        }

        // Boat details guest popup exit handler
        if (this.boatDetailsGuestsPopupExit) {
          this.boatDetailsGuestsPopupExit.addEventListener('click', () => {
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
            // If clicking already selected pill, deselect it
            if (this.selectedPickupTime === time) {
              this.selectedPickupTime = '';
              pill.style.borderColor = '';
            } else {
              // Deselect all pills first
              Object.values(this.boatDetailsPickupTimePills).forEach(p => {
                if (p) p.style.borderColor = '';
              });

              // Select the clicked pill
              this.selectedPickupTime = time;
              pill.style.borderColor = '#000000';
            }

            this.initializeBoatDetailsDateFilter();
            this.updateURLParams();
            this.updateBoatDetailsPrice();
          });
        });
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
            }
          });
        }

        if (this.boatDetailsHalfDayBtn) {
          this.boatDetailsHalfDayBtn.addEventListener('click', () => {
            if (this.selectedDates.length === 1) {
              this.selectedLengthType = 'half';
              this.initializeBoatDetailsDateFilter();
              this.updateURLParams();
              this.updateBoatDetailsPrice();
            }
          });
        }
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for boatId - if present, hide button and show selected boat block
        const boatId = urlParams.get('boatId');
        if (boatId) {
          this.button.style.display = 'none';
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'flex';
        } else {
          this.button.style.display = 'flex';
          if (this.selectedBoatBlock) this.selectedBoatBlock.style.display = 'none';
        }

        // Initialize other parameters
        const boatGuests = urlParams.get('boatGuests');
        const boatDates = urlParams.get('boatDates');
        const boatPickupTime = urlParams.get('boatPickupTime');
        const boatLengthType = urlParams.get('boatLengthType');
        const boatPrivateDock = urlParams.get('boatPrivateDock');

        // Set guests
        this.selectedGuests = boatGuests ? parseInt(boatGuests) : 0;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();

        // Set dates
        if (boatDates) {
          this.selectedDates = boatDates.split(',');
        }

        // Set length type
        this.selectedLengthType = boatLengthType || 'full';
        this.updateLengthTypeButtons();

        // Set pickup time
        this.selectedPickupTime = boatPickupTime || '';
        Object.entries(this.pickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
          }
        });

        // Set private dock filter
        this.selectedPrivateDock = boatPrivateDock === 'true';

        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.renderDateSelection();
        this.updatePrivateDockFilterText();
      }

      updateBoatDetailsPrice() {
        // Only update if we have current boat data
        if (!this.currentBoatData) return;

        // Use the new comprehensive pricing method
        this.updateBoatDetailsPricing(this.currentBoatData);
      }

      initializeBoatDetailsGuestFilter() {
        // Initialize boat details guest filter text
        if (this.boatDetailsGuestsFilterText) {
          if (this.selectedGuests === 0) {
            this.boatDetailsGuestsFilterText.textContent = 'Who\'s coming?';
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

        // Style and setup minus button
        this.boatDetailsGuestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleBoatDetailsGuestButton(this.boatDetailsGuestMinus);

        // Style and setup plus button
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
          this.boatDetailsGuestsFilterText.textContent = 'Who\'s coming?';
        } else {
          this.boatDetailsGuestsFilterText.textContent = `${this.selectedGuests} passenger${this.selectedGuests !== 1 ? 's' : ''}`;
        }
      }

      setupAddToReservationButton(boat) {
        // Get the reservation button and error element
        const addToReservationButton = document.querySelector('[data-element="boatDetails_reservation_addToReservationButton"]');
        const errorElement = document.querySelector('[data-element="boatDetails_reservation_addToReservationError"]');

        if (!addToReservationButton) return;

        // Hide error element initially
        if (errorElement) {
          errorElement.style.display = 'none';
        }

        // Remove any existing event listeners to prevent duplicates
        const newButton = addToReservationButton.cloneNode(true);
        addToReservationButton.parentNode.replaceChild(newButton, addToReservationButton);

        // Add click handler to the new button
        newButton.addEventListener('click', () => {
          this.handleAddToReservation(boat, errorElement);
        });
      }

      handleAddToReservation(boat, errorElement) {
        // Get current URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        // Check required parameters
        const missingParams = [];

        // Check boatDates
        if (!this.selectedDates || this.selectedDates.length === 0) {
          missingParams.push('Please select boat rental dates');
        }

        // Check boatGuests
        if (!this.selectedGuests || this.selectedGuests === 0) {
          missingParams.push('Please add total passengers');
        }

        // Check boatPickupTime
        if (!this.selectedPickupTime) {
          missingParams.push('Please select a pickup time');
        }

        // Check boatLengthType (this should always have a default value, but let's be safe)
        if (!this.selectedLengthType) {
          missingParams.push('Please select rental duration');
        }

        // If there are missing parameters, show error and return
        if (missingParams.length > 0) {
          if (errorElement) {
            errorElement.textContent = missingParams[0]; // Show the first missing parameter
            errorElement.style.display = 'flex';
          }
          return;
        }

        // All parameters are present, proceed with adding boat to reservation

        // Hide error element
        if (errorElement) {
          errorElement.style.display = 'none';
        }

        // Add boatId to URL parameters
        const url = new URL(window.location);
        url.searchParams.set('boatId', boat.id);
        window.history.pushState({}, '', url);

        // Update the service state to reflect the boat selection
        this.initializeFromURL();

        // Close the modal
        this.closeModal();

        // Ensure proper visibility: selectBoatWrapper as flex, boatDetailsWrapper hidden
        this.selectWrapper.style.display = 'flex';
        this.detailsWrapper.style.display = 'none';

        // Trigger other updates to ensure proper visibility
        if (window.updateBoatVisibility) window.updateBoatVisibility();
        if (window.handleBoatFunctionality) window.handleBoatFunctionality();
      }
    }

    // Initialize boat rental service
    const boatRental = new BoatRentalService();

    // Make it globally accessible for property checks
    window.boatRentalService = boatRental;
  });
});








