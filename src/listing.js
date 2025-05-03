

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
      }

      function updateGuestsParameter() {
        const totalGuests = counters.adults + counters.children;
        Wized.data.n.parameter.guests = totalGuests;
        updateURLParameter('guests', totalGuests);
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

    await Wized.requests.waitFor('Load_Property_Calendar_Disabled')


    let data = Wized.data.r.Load_Property_Calendar_Disabled;

    // Convert the list of date strings into Date objects without modifying the day
    let disabledDates = data.data.map(item => {
      // Split the date string into parts (assuming format YYYY-MM-DD)
      let [year, month, day] = item.date.split('-');

      // Create a new Date object in local time without changing the date by explicitly setting the time to noon
      return new Date(year, month - 1, day, 12, 0, 0); // Months are 0-indexed in JavaScript Date
    });

    //works but missing stuff
    var checkIn = document.getElementById('datepicker1');
    var checkOut = document.getElementById('datepicker2');
    var mobileCheckIn = document.getElementById('datepicker1Phone')
    var mobileCheckOut = document.getElementById('datepicker2Phone')

    checkIn.setAttribute('readonly', true);
    checkOut.setAttribute('readonly', true);
    mobileCheckIn.setAttribute('readonly', true);
    mobileCheckOut.setAttribute('readonly', true);

    // Step 1: Get the checkin and checkout parameters from the URL
    var urlParams = new URLSearchParams(window.location.search);
    var initialCheckIn = urlParams.get('checkin');  // Example: '2024-10-20'
    var initialCheckOut = urlParams.get('checkout'); // Example: '2024-10-23'



    let today = new Date();
    let twoYearsLater = new Date(today);
    twoYearsLater.setFullYear(today.getFullYear() + 2);
    var newCheckIn = urlParams.get('checkin');
    var newCheckOut = urlParams.get('checkout');

    const elements = document.querySelectorAll('.calendar-inline');


    // Step 2: Initialize Lightpick and set initial date range if available
    var picker = new Lightpick({
      field: checkIn,
      secondField: checkOut,
      singleDate: false,
      parentEl: elements[0],
      inline: true,
      minDays: 8,
      numberOfColumns: 2,
      format: "MM/DD/YY",
      minDate: today,
      maxDate: twoYearsLater,
      disableDates: disabledDates,
      disabledDatesInRange: false,
      tooltipNights: true, // Enables calculation of nights instead of days in the tooltip
      numberOfMonths: 2,
      locale: {
        tooltip: {
          one: 'night',     // Singular form
          other: 'nights'   // Plural form
        }
      },
      startDate: newCheckIn ? moment(newCheckIn, 'YYYY-MM-DD') : today,  // Open to check-in date if set
      onSelect: function (start, end) {

        // Step 4: When user selects new dates, update the URL parameters
        if (start && end) {

          newCheckIn = start.format('YYYY-MM-DD');
          newCheckOut = end.format('YYYY-MM-DD');

          // Update the URL parameters without reloading the page
          var url = new URL(window.location.href);
          url.searchParams.set('checkin', newCheckIn);
          url.searchParams.set('checkout', newCheckOut);
          window.history.replaceState({}, '', url);

          var oldCheckOut = Wized.data.n.parameter.checkout
          let newEndDate = formatTimestamp(end._i)
          if (oldCheckOut == newEndDate) {
            Wized.data.n.parameter.checkout = ""
            url.searchParams.set('checkout', "");
            window.history.replaceState({}, '', url);
            return
          }

          if (newCheckIn == null || newCheckIn == null) {
            Wized.data.n.parameter.checkin = ""
            Wized.data.n.parameter.checkout = ""
          } else {
            Wized.data.n.parameter.checkin = newCheckIn
            Wized.data.n.parameter.checkout = newCheckOut
          }
        } else {
        }
      }
    });

    function formatTimestamp(timestamp) {
      // Check if the timestamp is already in the format 'yyyy-mm-dd'
      if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
        return timestamp;
      }
      const date = new Date(timestamp);  // Parse the timestamp
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Add leading zero if needed
      const day = ('0' + date.getDate()).slice(-2);  // Add leading zero if needed
      return `${year}-${month}-${day}`;
    }

    // CREATE CALENDAR FOR MOBILE
    var pickerMobile = new Lightpick({
      field: mobileCheckIn,
      secondField: mobileCheckOut,
      singleDate: false,
      parentEl: elements[1],
      inline: true,
      minDays: 8,
      numberOfColumns: 1,
      format: "MM/DD/YY",
      minDate: today,
      maxDate: twoYearsLater,
      disableDates: disabledDates,
      disabledDatesInRange: false,
      tooltipNights: true, // Enables calculation of nights instead of days in the tooltip
      numberOfMonths: 1,
      locale: {
        tooltip: {
          one: 'night',     // Singular form
          other: 'nights'   // Plural form
        }
      },
      startDate: newCheckIn ? moment(newCheckIn, 'YYYY-MM-DD') : today,  // Open to check-in date if set
      onSelect: function (start, end) {

        if (start && end) {

          newCheckIn = start.format('YYYY-MM-DD');
          newCheckOut = end.format('YYYY-MM-DD');

          // Update the URL parameters without reloading the page
          var url = new URL(window.location.href);
          url.searchParams.set('checkin', newCheckIn);
          url.searchParams.set('checkout', newCheckOut);
          window.history.replaceState({}, '', url);

          var oldCheckOut = Wized.data.n.parameter.checkout
          let newEndDate = formatTimestamp(end._i)
          if (oldCheckOut == newEndDate) {
            Wized.data.n.parameter.checkout = ""
            url.searchParams.set('checkout', "");
            window.history.replaceState({}, '', url);
            return
          }

          if (newCheckIn == null || newCheckIn == null) {
            Wized.data.n.parameter.checkin = ""
            Wized.data.n.parameter.checkout = ""
          } else {
            Wized.data.n.parameter.checkin = newCheckIn
            Wized.data.n.parameter.checkout = newCheckOut
          }
        }
      }
    });

    if ((initialCheckIn == "") || (initialCheckOut == "")) {
      picker.setDateRange(null, null);
      pickerMobile.setDateRange(null, null)

    }

    // Step 3: If initial check-in and check-out exist, set the date range in the picker
    if (initialCheckIn && initialCheckOut) {

      // Set the date range with the adjusted dates
      picker.setDateRange(initialCheckIn, initialCheckOut);
      pickerMobile.setDateRange(initialCheckIn, initialCheckOut)

    } else {
      if (!initialCheckIn) datepicker1.placeholder = 'Set Date';
      if (!initialCheckOut) datepicker2.placeholder = 'Set Date';
    }

    let clearButtons = document.querySelectorAll('[data-element="calendarModal_clearDates"]')
    clearButtons.forEach(button => {
      button.addEventListener('click', async function () {
        newCheckIn = null
        newCheckOut = null
        Wized.data.n.parameter.checkin = ""
        Wized.data.n.parameter.checkout = ""
        picker.setDateRange(null, null);
        pickerMobile.setDateRange(null, null)
      });
    });





    let closeButtons = document.querySelectorAll('[data-element="calendarModal_closeButton"]')

    closeButtons.forEach(button =>
      button.addEventListener('click', async function () {
        await Wized.requests.execute('Load_Property_Calendar_Query');

      }))


    let calendarModal = document.querySelector('[data-element="calendarModal"]');

    // Add event listener for clicking outside the modal
    // document.addEventListener('click', function (event) {
    // Check if the click is outside the calendar modal
    //  if (!calendarModal.contains(event.target) && !closeButton[0].contains(event.target)) {
    // If clicked outside the modal, trigger the same action as close button
    //    closeButton[0].click();
    //   }
    // });




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



