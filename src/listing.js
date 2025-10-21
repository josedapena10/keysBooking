// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

// Page loader management - keep loader visible until all content is ready
(function initPageLoader() {
  const loadingTracker = {
    propertyDetailsLoaded: false,
    calendarQueryLoaded: false,
    reservationLogicInitialized: false
  };

  console.log('🔄 Loader: Initializing page loader...');

  // Function to check if all critical content is loaded
  function checkAllContentLoaded() {
    console.log('🔍 Loader: Checking loading status:', {
      propertyDetailsLoaded: loadingTracker.propertyDetailsLoaded,
      calendarQueryLoaded: loadingTracker.calendarQueryLoaded,
      reservationLogicInitialized: loadingTracker.reservationLogicInitialized
    });

    const allLoaded = loadingTracker.propertyDetailsLoaded &&
      loadingTracker.calendarQueryLoaded &&
      loadingTracker.reservationLogicInitialized;

    if (allLoaded) {
      console.log('✅ Loader: All content loaded! Hiding loader...');
      hideLoader();
    } else {
      console.log('⏳ Loader: Still waiting for content...');
    }
  }

  // Function to hide the loader
  function hideLoader() {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader && loader.style.display !== 'none') {
      console.log('🎉 Loader: Hiding loader with fade effect');
      // Add fade out effect
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        console.log('✨ Loader: Hidden successfully');
      }, 300);
    } else {
      console.log('⚠️ Loader: Loader element not found or already hidden');
    }
  }

  // Make loader visible on page load
  window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Loader: DOM Content Loaded');
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
      loader.style.display = 'flex';
      loader.style.opacity = '1';
      console.log('👁️ Loader: Loader made visible');
    } else {
      console.warn('⚠️ Loader: Loader element not found in DOM');
    }
  });

  // Track when Wized requests complete
  window.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push((Wized) => {
      console.log('🔌 Loader: Wized initialized, listening for requests...');

      Wized.on('requestend', (event) => {
        console.log(`📥 Loader: Wized request completed: ${event.name}`);

        if (event.name === 'Load_Property_Details') {
          console.log('🏠 Loader: Property Details loaded!');
          loadingTracker.propertyDetailsLoaded = true;
          checkAllContentLoaded();
        }
        if (event.name === 'Load_Property_Calendar_Query') {
          console.log('📅 Loader: Calendar Query loaded!');
          loadingTracker.calendarQueryLoaded = true;
          checkAllContentLoaded();
        }
      });

      // Wait for Property Details first (required)
      console.log('⏰ Loader: Waiting for Property Details...');
      Wized.requests.waitFor('Load_Property_Details')
        .then(() => {
          console.log('✅ Loader: Property Details ready!');

          // Check if dates are in URL (calendar query might be needed)
          const urlParams = new URLSearchParams(window.location.search);
          const hasCheckin = urlParams.has('checkin') && urlParams.get('checkin') !== '';
          const hasCheckout = urlParams.has('checkout') && urlParams.get('checkout') !== '';

          if (hasCheckin && hasCheckout) {
            console.log('📅 Loader: Dates detected, waiting for Calendar Query...');
            // Wait for calendar query with a 3-second timeout
            Promise.race([
              Wized.requests.waitFor('Load_Property_Calendar_Query'),
              new Promise((resolve) => setTimeout(() => {
                console.warn('⚠️ Loader: Calendar Query timeout (3s), proceeding without it');
                resolve();
              }, 3000))
            ]).then(() => {
              if (!loadingTracker.calendarQueryLoaded) {
                console.log('📅 Loader: Marking calendar as loaded (timeout or completed)');
                loadingTracker.calendarQueryLoaded = true;
              }
              loadingTracker.reservationLogicInitialized = true;
              checkAllContentLoaded();
            });
          } else {
            console.log('📅 Loader: No dates in URL, skipping Calendar Query');
            loadingTracker.calendarQueryLoaded = true;
            loadingTracker.reservationLogicInitialized = true;
            checkAllContentLoaded();
          }
        })
        .catch(() => {
          console.error('❌ Loader: Property Details failed to load');
        });
    });
  });

  // Track when images are loaded
  window.trackImagesLoaded = function () {
    const splideElement = document.querySelector('.splide');
    if (!splideElement) {
      console.warn('⚠️ Loader: Splide element not found, marking images as loaded');
      checkAllContentLoaded();
      return;
    }

    // Wait for first 5 header images to load
    const images = splideElement.querySelectorAll('img');
    const firstFiveImages = Array.from(images).slice(0, 5);
    console.log(`🖼️ Loader: Found ${images.length} total images, tracking first ${firstFiveImages.length} images`);

    if (firstFiveImages.length === 0) {
      console.warn('⚠️ Loader: No images found, marking as loaded');
      checkAllContentLoaded();
      return;
    }

    let loadedCount = 0;
    const totalToLoad = Math.min(firstFiveImages.length, 5);
    console.log(`🖼️ Loader: Need to load ${totalToLoad} images`);

    firstFiveImages.forEach((img, index) => {
      if (img.complete && img.naturalHeight !== 0) {
        loadedCount++;
        console.log(`✅ Loader: Image ${index + 1} already loaded (${loadedCount}/${totalToLoad})`);
      } else {
        console.log(`⏳ Loader: Image ${index + 1} not yet loaded, adding listeners`);
        img.addEventListener('load', () => {
          loadedCount++;
          console.log(`✅ Loader: Image ${index + 1} loaded successfully (${loadedCount}/${totalToLoad})`);
          if (loadedCount >= totalToLoad) {
            console.log('🎨 Loader: All required images loaded!');
            checkAllContentLoaded();
          }
        });
        img.addEventListener('error', () => {
          loadedCount++;
          console.log(`❌ Loader: Image ${index + 1} failed to load (${loadedCount}/${totalToLoad})`);
          if (loadedCount >= totalToLoad) {
            console.log('🎨 Loader: All images processed (some may have failed)');
            checkAllContentLoaded();
          }
        });
      }
    });

    if (loadedCount >= totalToLoad) {
      console.log(`✅ Loader: All ${loadedCount} images already loaded!`);
      checkAllContentLoaded();
    }


  };

  // Fallback: Ensure loader is hidden after maximum wait time
  console.log('⏰ Loader: Setting 10-second maximum fallback timeout');
  setTimeout(() => {
    console.warn('⚠️ Loader: Maximum timeout reached (10s), forcing loader to hide');
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




//reserveButton
const reserveButtons = document.querySelectorAll('[data-element="listing_reserve_button"]');
reserveButtons.forEach(button => {
  if (button) {
    button.addEventListener('click', () => {
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
        createMobileCalendar();
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

        // Trigger calendar query if both dates are selected
        if (selectedStartDate && selectedEndDate) {
          Wized.requests.execute('Load_Property_Calendar_Query').then(() => {
            if (window.updateAvailabilityStatus) {
              window.updateAvailabilityStatus();
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

          // Trigger calendar query if both dates are selected
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

          // Trigger calendar query if both dates are selected
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

  // Open dropdown when clicking on change button
  if (changeGuestsButtons.length > 0) {
    changeGuestsButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault(); // Prevent default action (scrolling to top)
          e.stopPropagation(); // Prevent the click from bubbling up to document
          if (guestDropdown) {
            guestDropdown.style.display = 'flex';
          }
        });
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
      !Array.from(changeGuestsButtons).some(button => button && button.contains(e.target))) {
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

  // Add click handlers for availability and change dates buttons
  if (checkAvailabilityButtons.length > 0 && calendarModal) {
    checkAvailabilityButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function (e) {
          // e.preventDefault(); // Prevent default action (scrolling to top)
          // e.stopPropagation(); // Prevent the click from bubbling up to document
          calendarModal.style.display = 'flex'; // Show the calendar modal

        });
      }
    });
  }

  if (changeDatesButtons.length > 0 && calendarModal) {
    changeDatesButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault(); // Prevent default action (scrolling to top)
          e.stopPropagation(); // Prevent the click from bubbling up to document
          calendarModal.style.display = 'flex'; // Show the calendar modal
        });
      }
    });
  }

  // Watch for when desktop calendar modal becomes visible and reset view
  if (calendarModal) {
    const desktopObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const isVisible = window.getComputedStyle(calendarModal).display !== 'none';
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

      // Apply visibility and text to all heading elements (desktop and mobile)
      addDatesHeadings.forEach(heading => {
        if (heading) {
          heading.style.display = shouldBeVisible ? 'flex' : 'none';
          heading.textContent = headingText;
        }
      });
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
      if (imageElements.length > 0 && window.selectedBoatData.photos && window.selectedBoatData.photos[0]) {
        imageElements.forEach(element => {
          if (element) {
            element.src = window.selectedBoatData.photos[0].image.url;
          }
        });
      }

      // Update selectedBoatBlock_name
      const nameElements = document.querySelectorAll('[data-element="selectedBoatBlock_name"]');
      if (nameElements.length > 0) {
        nameElements.forEach(element => {
          if (element) {
            element.textContent = window.selectedBoatData.name;
          }
        });
      }

      // Update selectedBoatBlock_companyName
      const companyNameElements = document.querySelectorAll('[data-element="selectedBoatBlock_companyName"]');
      if (companyNameElements.length > 0 && window.selectedBoatData._boat_company) {
        companyNameElements.forEach(element => {
          if (element) {
            element.textContent = window.selectedBoatData._boat_company.name;
          }
        });
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
            // Remove boatId and related parameters from URL
            const url = new URL(window.location);
            url.searchParams.delete('boatId');


            window.history.pushState({}, '', url);

            // Hide the selected boat blocks
            const selectedBoatBlocks = document.querySelectorAll('[data-element="selectedBoatBlock"]');
            selectedBoatBlocks.forEach(block => {
              if (block) {
                block.style.display = 'none';
              }
            });

            // Show listing-only pricing again
            const listingOnlyPricingSections = document.querySelectorAll('[data-element="ListingOnly_Query_Price_Details"]');
            const listingExtrasPricingSections = document.querySelectorAll('[data-element="ListingExtras_Query_Price_Details"]');

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
              element.textContent = `Free cancel until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
            }
          });
        } else {
          freeCancellationTextElements.forEach(element => {
            if (element) {
              element.textContent = `Free cancel until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
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

        // Validate extras dates after calendar query completes
        if (event.name === 'Load_Property_Calendar_Query') {
          validateExtrasWithinReservationDates();
        }

        // Update stay cancellation policy for extras when data is loaded
        if (window.hasAnyExtrasSelected && window.hasAnyExtrasSelected()) {
          updateStayCancellationPolicy();
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
            cancellationText = `Free cancel until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}, ${cutoffYear}`;
          } else {
            cancellationText = `Free cancel until ${cutoffMonth} ${cutoffDay}${cutoffDaySuffix}`;
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

      // Calculate combined taxes (only boat is taxed if not Manual integration, fishing charters are not taxed)
      const boatTaxableAmount = window.selectedBoatData && window.selectedBoatData._boat_company.integration_type !== 'Manual'
        ? boatPricing.totalWithFees
        : 0;
      const combinedTaxes = calculateCombinedTaxes(r, boatTaxableAmount);

      // Calculate grand total
      const extrasTotalWithFees = boatPricing.totalWithFees + fishingCharterPricing.totalWithFees;
      const grandTotal = stayPricing.total + extrasTotalWithFees + combinedTaxes.total;

      // Update all pricing elements
      updatePricingElements(stayPricing, boatPricing, fishingCharterPricing, combinedTaxes, grandTotal);

      // Update stay cancellation policy for extras view (data is guaranteed to be available here)
      updateExtrasCancellationPolicies(r, n);

    } catch (error) {

    }
  } else {
  }
}

// Calculate stay pricing (nightly + cleaning + service fees)
function calculateStayPricing(r) {
  const nightlyTotal = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_nightsTotal || 0);
  const cleaningFee = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_cleaningFee || 0);
  const serviceFee = Math.floor(r.Load_Property_Calendar_Query.data.dateRange_serviceFee || 0);

  return {
    nightly: nightlyTotal,
    cleaning: cleaningFee,
    service: serviceFee,
    total: nightlyTotal + cleaningFee + serviceFee
  };
}

// Calculate boat pricing based on selected dates and boat data
function calculateBoatPricing(boatData) {
  if (!boatData) {
    return { basePrice: 0, serviceFee: 0, deliveryFee: 0, totalWithFees: 0 };
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
    return { basePrice: 0, serviceFee: 0, deliveryFee: 0, totalWithFees: 0 };
  }

  // Calculate base price based on rental duration
  let basePrice = calculateBoatBasePrice(boatData, numDates);

  // Calculate service fee (from boat company) - skip if integrationType is 'Manual'
  let serviceFee = 0;
  if (boatData._boat_company.integration_type !== 'Manual') {
    const serviceFeeRate = boatData._boat_company?.serviceFee || 0;
    serviceFee = basePrice * serviceFeeRate;
  }

  // Calculate delivery fee if delivery is selected
  const deliveryFee = boatDelivery ? (boatData._boat_company?.deliveryFee || 0) : 0;

  // Calculate total with fees
  const totalWithFees = basePrice + serviceFee + deliveryFee;

  return {
    basePrice: Math.round(basePrice),
    serviceFee: Math.round(serviceFee),
    deliveryFee: Math.round(deliveryFee),
    totalWithFees: Math.round(totalWithFees)
  };
}

// Calculate boat base price based on duration and pricing tiers
function calculateBoatBasePrice(boatData, numDates) {
  if (numDates === 0) return 0;

  // Handle single day or half day
  if (numDates === 1) {
    return boatData.pricePerDay || 0;
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
  // Update Stay Price Amount
  const stayPriceElements = document.querySelectorAll('[data-element="Stay_Price_Amount"]');
  stayPriceElements.forEach(element => {
    if (element) {
      element.textContent = `$${stayPricing.total.toLocaleString()}`;
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

  const isMoreThanOneYear = cutoffDate - today > 365 * 24 * 60 * 60 * 1000;

  if (isMoreThanOneYear) {
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

    // format "Month Dth"
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const suffix = (n) =>
      (n % 10 === 1 && n % 100 !== 11) ? "st" :
        (n % 10 === 2 && n % 100 !== 12) ? "nd" :
          (n % 10 === 3 && n % 100 !== 13) ? "rd" : "th";

    const dayNum = dt.getUTCDate();
    const pretty = `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}`;

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

    // format "Month Dth"
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const suffix = (n) =>
      (n % 10 === 1 && n % 100 !== 11) ? "st" :
        (n % 10 === 2 && n % 100 !== 12) ? "nd" :
          (n % 10 === 3 && n % 100 !== 13) ? "rd" : "th";

    const dayNum = dt.getUTCDate();
    const pretty = `${monthNames[dt.getUTCMonth()]} ${dayNum}${suffix(dayNum)}`;

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
function validateExtrasWithinReservationDates() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkin = urlParams.get('checkin');
  const checkout = urlParams.get('checkout');

  // If no reservation dates, don't validate
  if (!checkin || !checkout) return;

  // Create date range from checkin to checkout (excluding checkout day)
  const reservationDates = generateDateRangeForValidation(checkin, checkout);
  const reservationDateSet = new Set(reservationDates);

  let hasRemovedExtras = false;

  // Validate boat dates
  const boatDates = urlParams.get('boatDates');
  if (boatDates) {
    const boatDatesList = boatDates.split(',').filter(Boolean);
    const isBoatValid = boatDatesList.every(date => reservationDateSet.has(date));

    if (!isBoatValid) {
      removeBoatFromReservation();
      hasRemovedExtras = true;
    }
  }

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
      window.updatePricingDisplayForExtras().catch(err => console.error('Error updating pricing:', err));
    }
    if (window.updateListingOnlyPricing) {
      window.updateListingOnlyPricing();
    }

    // Update boat visibility
    if (window.updateBoatVisibility) {
      window.updateBoatVisibility();
    }

    // Update fishing charter blocks
    if (window.fishingCharterService && window.fishingCharterService.populateSelectedFishingCharterBlock) {
      window.fishingCharterService.populateSelectedFishingCharterBlock().catch(err => console.error('Error populating fishing charter:', err));
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

    // Stop before checkout date (checkout day is not included in stay)
    if (currentDateStr === endDateStr) break;

    dateRange.push(currentDateStr);

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
    window.boatRentalService.updateGuestsFilterText();
    window.boatRentalService.updatePrivateDockFilterText();
    window.boatRentalService.updateBoatDetailsDateFilterText();
    window.boatRentalService.updateBoatDetailsGuestsFilterText();
    window.boatRentalService.updateFilterStyles();

    // Reset pickup time pills
    Object.values(window.boatRentalService.pickupTimePills).forEach(pill => {
      if (pill) pill.style.borderColor = '';
    });
    Object.values(window.boatRentalService.boatDetailsPickupTimePills).forEach(pill => {
      if (pill) pill.style.borderColor = '';
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
        this.pickupTimePills = {
          '8am': document.querySelector('[data-element="pickupTime_8am"]'),
          '9am': document.querySelector('[data-element="pickupTime_9am"]'),
          '10am': document.querySelector('[data-element="pickupTime_10am"]'),
          '11am': document.querySelector('[data-element="pickupTime_11am"]'),
          '12pm': document.querySelector('[data-element="pickupTime_12pm"]'),
          '1pm': document.querySelector('[data-element="pickupTime_1pm"]'),
          '2pm': document.querySelector('[data-element="pickupTime_2pm"]'),
          '3pm': document.querySelector('[data-element="pickupTime_3pm"]'),
          '4pm': document.querySelector('[data-element="pickupTime_4pm"]'),
          '5pm': document.querySelector('[data-element="pickupTime_5pm"]'),
          '6pm': document.querySelector('[data-element="pickupTime_6pm"]')
        };

        // Boat details date filter elements
        this.boatDetailsDateFilter = document.querySelector('[data-element="boatDetails_reservation_dateTime"]');
        this.boatDetailsDateFilterText = document.querySelector('[data-element="boatDetails_reservation_dateTimeText"]');
        this.boatDetailsPopup = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup"]');
        this.boatDetailsPopupExit = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_exit"]');
        this.boatDetailsPopupDone = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_doneButton"]');
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
          '4pm': document.querySelector('[data-element="boatDetailsPickupTime_4pm"]'),
          '5pm': document.querySelector('[data-element="boatDetailsPickupTime_5pm"]'),
          '6pm': document.querySelector('[data-element="boatDetailsPickupTime_6pm"]')
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
        this.bayBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_bayBoatBlock"]');
        this.bayBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_bayBoatCheckbox"]');
        this.dualConsoleBoatBlock = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_dualConsoleBoatBlock"]');
        this.dualConsoleBoatCheckbox = document.querySelector('[data-element="addBoatModal_selectBoat_typePopup_dualConsoleBoatCheckbox"]');

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

        // Flag to prevent multiple rapid calls to handleAddToReservation
        this.isAddingToReservation = false;

        this.initialize();
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
          '4pm': 16,
          '5pm': 17,
          '6pm': 18
        };

        return timeMap[pickupTime] || null;
      }

      // Helper method to get all pickup times in chronological order
      getAllPickupTimesInOrder() {
        return ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
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
                if (pill) pill.style.borderColor = '';
              });
              Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
                if (pill) pill.style.borderColor = '';
              });

              // Auto-select earliest valid time
              this.selectedPickupTime = earliestValidTime;

              // Update both sets of pills
              const mainPill = this.pickupTimePills[earliestValidTime];
              const boatDetailsPill = this.boatDetailsPickupTimePills[earliestValidTime];
              if (mainPill) mainPill.style.borderColor = '#000000';
              if (boatDetailsPill) boatDetailsPill.style.borderColor = '#000000';

              // Update UI and state
              this.updateDatesFilterText();
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
          const r = Wized.data.r;
          await Wized.requests.waitFor('Load_user');
          if (r?.Load_user?.status === 200 && r?.Load_user?.data.Birth_Date) {
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
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.lengthPopup) this.lengthPopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';
        if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
        if (this.boatDetailsGuestsPopup) this.boatDetailsGuestsPopup.style.display = 'none';

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
            // Check if this pill is disabled by gating
            if (pill.classList.contains('pickup-time-gated') || pill.getAttribute('aria-disabled') === 'true') {
              return; // Ignore clicks on gated pills
            }

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
            this.updateExistingCards();

            // Re-apply gating after pickup time selection changes
            this.applyPickupTimeGating(this.pickupTimePills, false);
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
          }
        });
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
          }
        });

        this.updateDatesFilterText();
        this.updateBoatDetailsDateFilterText();
        this.updateBoatDetailsGuestsFilterText();
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

              this.fetchAndRenderBoats();
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
        this.fetchAndRenderBoats();
        this.updateURLParams();

        // Apply pickup time gating when dates change (first/last day affects gating)
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
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

          // Filter by boat type
          if (this.selectedBoatTypes.length > 0) {
            const boatType = boat.boatType;
            if (!this.selectedBoatTypes.includes(boatType)) {
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

          // Filter boats based on guest count
          const filteredBoats = this.filterBoats(allBoats);

          // Hide skeleton cards
          this.hideSkeletonCards();

          // Render the filtered boats
          this.renderBoatCards(filteredBoats);

          return filteredBoats;
        } catch (error) {
          // Hide skeleton cards on error too
          this.hideSkeletonCards();
          this.renderBoatCards([]);
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
                };
              }
              return boat;
            });
            console.log(mergedBoats);
            return mergedBoats;
          }

          // Fallback for old format (if data is directly an array)
          return Array.isArray(data) ? data : [];

        } catch (error) {
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

        // Clear any existing no results message
        const existingNoResultsMessage = this.cardWrapper.querySelector('.no-results-message');
        if (existingNoResultsMessage) {
          existingNoResultsMessage.remove();
        }

        // If no boats, hide the template card and show no results message
        if (boats.length === 0) {
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
          noResultsMessage.textContent = 'No boat rentals found for this listing :( Try adjusting your stay or search params.';
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
            photoElement.src = mainPhoto.image.url;
            photoElement.alt = boat.name || 'Boat Photo';
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

        // Use unified pricing with no dates selected
        const quote = this.computeBoatQuote(boat, {
          selectedDates: [],
          selectedLengthType: this.selectedLengthType,
          selectedPrivateDock: this.selectedPrivateDock,
          selectedGuests: this.selectedGuests
        });

        if (minLength <= 0.5) {
          return `Starting at $${quote.total.toLocaleString()}`;
        } else if (minLength === 1) {
          return `Starting at $${quote.total.toLocaleString()}`;
        } else {
          return `Starting at $${quote.total.toLocaleString()} per day`;
        }
      }

      calculateSelectedPriceText(boat) {
        // Use unified pricing calculation
        const quote = this.computeBoatQuote(boat);
        return `$${quote.total.toLocaleString()} total price`;
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

        // Reset editing state
        this.editingCharterNumber = null;

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
          if (pill) pill.style.borderColor = '';
        });

        // Reset boat details pickup time pills
        Object.values(this.boatDetailsPickupTimePills).forEach(pill => {
          if (pill) pill.style.borderColor = '';
        });

        // Update guest number displays
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        if (this.boatDetailsGuestNumber) this.boatDetailsGuestNumber.textContent = this.selectedGuests;

        // Update all filter texts
        this.updateDatesFilterText();
        this.updateGuestsFilterText();
        this.updatePriceFilterText();
        this.updateLengthFilterText();
        this.updateBoatTypeFilterText();
        this.updatePrivateDockFilterText();
        this.updateBoatDetailsDateFilterText();
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
        // Re-filter boats to show all boats again
        this.fetchAndRenderBoats();
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

        let basePrice = 0;
        const numDates = currentState.selectedDates.length;

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
          if (currentState.selectedLengthType === 'half') {
            basePrice = boat.pricePerHalfDay || 0;
          } else {
            basePrice = boat.pricePerDay || 0;
          }
        } else {
          // Multi-day reservation
          if (numDates >= 30 && boat.pricePerMonth) {
            const months = Math.floor(numDates / 30);
            const remainingDays = numDates % 30;
            const monthlyPrice = boat.pricePerMonth * months;

            let dailyRate = boat.pricePerDay || 0;
            if (boat.pricePerWeek) {
              dailyRate = boat.pricePerWeek / 7;
            }

            basePrice = Math.round(monthlyPrice + (remainingDays * dailyRate));
          } else if (numDates === 7 && boat.pricePerWeek) {
            basePrice = boat.pricePerWeek;
          } else if (numDates > 7 && boat.pricePerWeek) {
            const weeklyDailyRate = boat.pricePerWeek / 7;
            basePrice = Math.round(numDates * weeklyDailyRate);
          } else {
            basePrice = numDates * (boat.pricePerDay || 0);
          }
        }

        // Calculate service fee unless integrationType is "Manual"
        let serviceFee = 0;
        if (boat.integrationType !== "Manual") {
          serviceFee = basePrice * (boat.serviceFee || 0);
        }

        // Calculate delivery fee if private dock is selected and boat can deliver
        let deliveryFee = 0;
        if (currentState.selectedPrivateDock && boat.companyDelivers && boat.companyDeliveryFee) {
          deliveryFee = boat.companyDeliveryFee;
        }

        const total = basePrice + serviceFee + deliveryFee;

        return {
          base: Math.round(basePrice),
          fees: {
            service: Math.round(serviceFee),
            delivery: Math.round(deliveryFee)
          },
          total: Math.round(total)
        };
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

          // Filter by boat type
          if (this.selectedBoatTypes.length > 0) {
            const boatType = boat.boatType;
            if (!this.selectedBoatTypes.includes(boatType)) {
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
          { block: this.pontoonBoatBlock, checkbox: this.pontoonBoatCheckbox, type: 'Pontoon boat' },
          { block: this.bayBoatBlock, checkbox: this.bayBoatCheckbox, type: 'Bay boat' },
          { block: this.dualConsoleBoatBlock, checkbox: this.dualConsoleBoatCheckbox, type: 'Dual console' }
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

        // Apply pickup time gating when boat details opens
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

        // Populate the boat details
        this.populateBoatDetails(boat);

        // Update mobile footer
        this.updateMobileFooter(boat);

        // Update dates done button text
        this.updateDatesDoneButtonText();

        // // Update X button visibility
        // this.updateBoatDetailsXButtonVisibility();

        // Update reservation block visibility
        this.updateReservationBlockVisibility();
      }

      hideBoatDetails() {
        // Hide details wrapper and show select wrapper
        this.detailsWrapper.style.display = 'none';
        this.selectWrapper.style.display = 'flex';

        // Don't call initializeFromURL() here as it resets filter state
        // The filter values are already in this.selectedDates, this.selectedGuests, etc.
        // and should be preserved when going back to selection view

        // Update UI elements to reflect current filter state
        if (this.guestNumber) {
          this.guestNumber.textContent = this.selectedGuests;
        }
        this.updateDatesFilterText();
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
          // Check screen width for responsive behavior
          const isMobile = window.innerWidth < 767;
          const flexBasis = isMobile ? '100%' : '50%';

          imageContainer.style.cssText = `
            flex: 0 0 ${flexBasis};
            height: 320px;
            padding: 0 0px;
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

        // Add navigation buttons only if there are more than the visible count
        const isMobile = window.innerWidth < 767;
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

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
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

            // Determine what's missing and take appropriate action
            const hasDates = this.selectedDates && this.selectedDates.length > 0;
            const hasPickupTime = this.selectedPickupTime && this.selectedPickupTime !== '';
            const hasGuests = this.selectedGuests && this.selectedGuests > 0;

            if (!hasDates) {
              // Open dates popup
              if (this.boatDetailsDateFilter) {
                this.boatDetailsDateFilter.click();
              }
            } else if (!hasPickupTime) {
              // Open dates popup (includes pickup time)
              if (this.boatDetailsDateFilter) {
                this.boatDetailsDateFilter.click();
              }
            } else if (!hasGuests) {
              // Open guests popup
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
        const pricesContainer = document.querySelector('[data-element="boatDetails_reservation_prices_container"]');

        if (this.selectedDates.length === 0) {
          if (pricesContainer) {
            pricesContainer.style.display = 'none';
          }
          // No dates selected - show starting price
          if (reservationPrice) {
            reservationPrice.textContent = this.getStartingPriceText(boat);
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

        const priceWithDelivery = quote.base + quote.fees.service + quote.fees.delivery;

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

            const priceWithDelivery = quote.base + quote.fees.service + quote.fees.delivery;
            const taxRate = 0.075;
            const taxes = priceWithDelivery * taxRate;
            const totalPrice = priceWithDelivery + taxes;

            reservationTotal.textContent = `$${Math.round(totalPrice).toLocaleString()} total price`;
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
            selectDatesButton.textContent = this.getMissingRequirementsText();
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

        if (!hasDates && !hasGuests) {
          return 'Select Dates & Add Guests';
        } else if (!hasDates) {
          return 'Select Dates';
        } else if (!hasPickupTime && !hasGuests) {
          return 'Select Pickup Time & Add Guests';
        } else if (!hasPickupTime) {
          return 'Select Pickup Time';
        } else if (!hasGuests) {
          return 'Add Guests';
        }

        return 'Complete Reservation Details';
      }

      // Update dates popup "Done" button text based on mobile view and guest selection
      updateDatesDoneButtonText() {
        const doneButtonText = document.querySelector('[data-element="addBoatModal_boatDetails_datesPopup_doneButton_text"]');
        if (!doneButtonText) return;

        if (this.isMobileView() && (!this.selectedGuests || this.selectedGuests === 0)) {
          doneButtonText.textContent = 'Next';
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

        // Apply pickup time gating when dates change (first/last day affects gating)
        this.applyPickupTimeGating(this.pickupTimePills, false);
        this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);

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

            // Update dates done button text
            this.updateDatesDoneButtonText();
          });
        }

        // Boat details popup exit handler
        if (this.boatDetailsPopupExit) {
          this.boatDetailsPopupExit.addEventListener('click', () => {
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';
          });
        }

        // Boat details popup done handler
        if (this.boatDetailsPopupDone) {
          this.boatDetailsPopupDone.addEventListener('click', () => {
            if (this.boatDetailsPopup) this.boatDetailsPopup.style.display = 'none';

            // In mobile view, if guests haven't been selected, open guests popup
            if (this.isMobileView() && (!this.selectedGuests || this.selectedGuests === 0)) {
              // Small delay to ensure dates popup closes first
              setTimeout(() => {
                if (this.boatDetailsGuestsFilter) {
                  this.boatDetailsGuestsFilter.click();
                }
              }, 100);
            }
          });

          // Update button text based on mobile state and guest selection
          this.updateDatesDoneButtonText();
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

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);

            // Re-apply gating after pickup time selection changes
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
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
            if (this.selectedDates.length === 1) {
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

          // Update URL params to ensure all defaults are written back to URL
          this.updateURLParams();
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
          }
        });
        Object.entries(this.boatDetailsPickupTimePills).forEach(([time, pill]) => {
          if (pill) {
            pill.style.borderColor = time === this.selectedPickupTime ? '#000000' : '';
          }
        });

        this.updateDatesFilterText();
        this.updateBoatDetailsDateFilterText();
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

            // Update dates done button text
            this.updateDatesDoneButtonText();

            // Clear error if conditions are now met
            this.clearErrorIfResolved(this.boatDetailsErrorElement);
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

            // Update dates done button text
            this.updateDatesDoneButtonText();

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
          this.boatDetailsGuestsFilterText.textContent = 'Who\'s coming?';
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
        if (!this.mobileBoatButton) return;

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
          // Try to get boat name from the existing boat service
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
          // First show the modal
          window.boatRentalService.modal.style.display = 'flex';
          document.body.classList.add('no-scroll');

          // Then handle the edit which will show boat details
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
              console.warn(`Failed to fetch fishing charter ${charterId}: ${res.status}`);
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
              console.warn(`No matching trip found for charter ${charterId}, trip ${tripId}`);
            }
          } catch (error) {
            console.error(`Error fetching fishing charter ${charterId}:`, error);
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
        if (imageElement && trip.image) {
          imageElement.src = trip.image;
        }

        // Update selectedFishingCharterBlock_tripName
        const tripNameElement = block.querySelector('[data-element="selectedFishingCharterBlock_tripName"]');
        if (tripNameElement) {
          tripNameElement.textContent = trip.tripName;
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

        // Re-render the blocks with updated data
        await this.populateSelectedFishingCharterBlock();

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

        // Add click handlers for all buttons
        this.buttons.forEach(button => {
          if (button) {
            button.addEventListener('click', () => this.handleButtonClick());
          }
        });
        this.exitButton.addEventListener('click', () => this.closeModal());

        // Set initial button state based on dates
        this.updateButtonAvailability();

        // Listen for URL changes to update button availability when dates change
        window.addEventListener('popstate', () => {
          this.updateButtonAvailability();
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

        this.populateSelectedFishingCharterBlock().catch(err => console.error('Error populating fishing charter block:', err));

        // Update pricing display if any fishing charters are selected
        if (this.hasAnyFishingCharters() && window.updatePricingDisplayForExtras) {
          window.updatePricingDisplayForExtras().catch(err => console.error('Error updating pricing:', err));
        }
      }

      initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Check if any fishing charters exist using numbered parameters
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
          this.selectedFishingCharterBlocks.forEach(block => {
            if (block) {
              block.style.display = 'none';
            }
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
            this.selectedPrivateDock = !this.selectedPrivateDock;
            this.updatePrivateDockFilterText();
            this.updateFilterStyles();
            // this.updateURLParams();
            this.refilterChartersIfModalOpen();
          });
        }
      }

      setupGuestButtons() {
        if (!this.guestMinus || !this.guestPlus) return;

        // Style and setup minus button
        this.guestMinus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 4.5L7.5 12L15.5 19.5" stroke="#323232" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
        this.styleFishingCharterGuestButton(this.guestMinus);

        // Style and setup plus button
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
          // Check if valid dates are selected
          const urlParams = new URLSearchParams(window.location.search);
          const hasDates = urlParams.has('checkin') && urlParams.has('checkout');
          const checkIn = urlParams.get('checkin');
          const checkOut = urlParams.get('checkout');

          if (!checkIn || !checkOut || checkIn === '' || checkOut === '') {
            const message = hasDates
              ? 'Valid dates must be selected to add fishing charter'
              : 'Dates must be selected to add fishing charter';

            this.showMessage(message);
            return;
          }

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

          // Prevent body scroll when modal is open
          document.body.classList.add('no-scroll');

          // Fetch and render fishing charters
          await this.fetchAndRenderFishingCharters();
        } catch (error) {

        }
      }

      closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        if (this.datesPopup) this.datesPopup.style.display = 'none';
        if (this.guestsPopup) this.guestsPopup.style.display = 'none';
        if (this.pricePopup) this.pricePopup.style.display = 'none';
        if (this.typePopup) this.typePopup.style.display = 'none';

        // Reset editing state when modal is closed
        this.editingCharterNumber = null;
        this.editingTripId = null;

        // Clear all filters when modal is closed (for next time it's opened)
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

            // Get property neighborhood from Wized data
            const r = Wized.data.r;
            if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property.listing_neighborhood) {
              const propertyNeighborhood = r.Load_Property_Details.data.property.listing_neighborhood;

              // Check if charter delivers to the property's neighborhood
              if (!charter.privateDockPickupAreas || !Array.isArray(charter.privateDockPickupAreas)) {
                return false;
              }

              const canDeliverToProperty = charter.privateDockPickupAreas.some(area =>
                area.region && area.region.toLowerCase() === propertyNeighborhood.toLowerCase()
              );

              if (!canDeliverToProperty) {
                return false;
              }
            } else {
              // If we can't get property neighborhood, hide charters when private dock filter is active
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

          // Populate card with charter data
          this.populateFishingCharterCard(card, charter);
        });
      }

      populateFishingCharterCard(card, charter) {
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

        // Populate card photo
        const photoElement = card.querySelector('[data-element="addFishingCharterModal_selectFishingCharter_card_photo"]');
        if (photoElement && charter.images && charter.images[0] && charter.images[0].image) {
          photoElement.src = charter.images[0].image.url;
          photoElement.alt = charter.name || '';
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

      showFishingCharterDetails(charter) {
        // Hide select wrapper and show details wrapper
        this.selectWrapper.style.display = 'none';
        this.detailsWrapper.style.display = 'flex';

        // Scroll details content container to top
        if (this.detailsContentContainer) {
          this.detailsContentContainer.scrollTop = 0;
        }

        // Store current charter data
        this.currentCharterData = charter;

        // Check and show/hide private dock option based on charter availability
        this.updatePrivateDockAvailability(charter);

        // Transfer values from main modal to details section
        this.transferValuesToDetails();

        // Populate fishing charter details
        this.populateFishingCharterDetails(charter);

        // Setup back button
        this.setupFishingCharterDetailsBackButton();

        // Setup map
        this.setupFishingCharterMap(charter);

        // Render trip types
        this.renderTripTypes(charter);
      }

      setupFishingCharterDetailsBackButton() {
        const backButton = document.querySelector('[data-element="fishingCharterDetails_back"]');
        if (backButton) {
          // Remove existing listeners
          backButton.replaceWith(backButton.cloneNode(true));
          const newBackButton = document.querySelector('[data-element="fishingCharterDetails_back"]');

          newBackButton.addEventListener('click', () => {
            // Reset editing state when going back
            this.editingCharterNumber = null;
            this.editingTripId = null;

            // Sync all filter states back to main view
            this.transferValuesToMain();
            // this.updateURLParams();
            this.refilterChartersIfModalOpen();

            this.detailsWrapper.style.display = 'none';
            this.selectWrapper.style.display = 'flex';
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

        // Get property neighborhood from Wized data
        const r = Wized.data.r;
        if (r && r.Load_Property_Details && r.Load_Property_Details.data && r.Load_Property_Details.data.property.listing_neighborhood) {
          const propertyNeighborhood = r.Load_Property_Details.data.property.listing_neighborhood;

          // Check if charter delivers to the property's neighborhood
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
        } else {
          // If we can't get property neighborhood, hide private dock option
          this.detailsPrivateDockFilter.style.display = 'none';
          return;
        }

        // If we get here, private dock is available
        this.detailsPrivateDockFilter.style.display = 'flex';
      }

      populateFishingCharterDetails(charter) {
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
        if (descriptionElement) {
          descriptionElement.textContent = charter.description || '';
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
        sortedImages.forEach((image, index) => {
          const imageContainer = document.createElement('div');
          // Check screen width for responsive behavior
          const isMobile = window.innerWidth < 767;
          const flexBasis = isMobile ? '100%' : '50%';

          imageContainer.style.cssText = `
            flex: 0 0 ${flexBasis};
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
          img.src = image.image?.url || '';
          img.alt = `${charter.name} image ${index + 1}`;
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
            this.openFishingCharterImageModal(sortedImages, index);
          });

          imageWrapper.appendChild(img);
          imageContainer.appendChild(imageWrapper);
          imagesTrack.appendChild(imageContainer);
        });

        carouselWrapper.appendChild(imagesTrack);

        // Add navigation buttons only if there are more than the visible count
        const isMobile = window.innerWidth < 767;
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
            border-radius: 12px;
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

          carouselWrapper.appendChild(leftButton);
          carouselWrapper.appendChild(rightButton);
        }

        imagesContainer.appendChild(carouselWrapper);
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
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          box-sizing: border-box;
        `;

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          width: 90vw;
          height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // Create image element
        const modalImage = document.createElement('img');
        modalImage.style.cssText = `
          width: 100%;
          height: 100%;
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          display: block;
        `;

        let currentImageIndex = startIndex;

        const updateImage = () => {
          if (images[currentImageIndex] && images[currentImageIndex].image) {
            modalImage.src = images[currentImageIndex].image.url;
            modalImage.alt = `Fishing charter image ${currentImageIndex + 1}`;
          }
        };

        updateImage();

        // Navigation buttons if more than one image
        if (images.length > 1) {
          const goToPrevious = () => {
            currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
            updateImage();
          };

          const goToNext = () => {
            currentImageIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
            updateImage();
          };

          // Previous button
          const prevButton = document.createElement('button');
          prevButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          prevButton.style.cssText = `
            position: absolute;
            left: -60px;
            top: 50%;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
          `;

          prevButton.addEventListener('click', goToPrevious);
          prevButton.addEventListener('mouseenter', () => {
            prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          prevButton.addEventListener('mouseleave', () => {
            prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          // Next button
          const nextButton = document.createElement('button');
          nextButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          nextButton.style.cssText = `
            position: absolute;
            right: -60px;
            top: 50%;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
          `;

          nextButton.addEventListener('click', goToNext);
          nextButton.addEventListener('mouseenter', () => {
            nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          nextButton.addEventListener('mouseleave', () => {
            nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          });

          imageContainer.appendChild(prevButton);
          imageContainer.appendChild(nextButton);

          // Keyboard navigation
          const handleKeydown = (e) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'Escape') closeModal();
          };

          document.addEventListener('keydown', handleKeydown);

          // Store cleanup function
          modal._cleanup = () => {
            document.removeEventListener('keydown', handleKeydown);
          };
        }

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        closeButton.style.cssText = `
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        `;

        const closeModal = () => {
          if (modal._cleanup) modal._cleanup();
          modal.remove();
        };

        closeButton.addEventListener('click', closeModal);
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        });
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });

        imageContainer.appendChild(modalImage);
        modal.appendChild(imageContainer);
        modal.appendChild(closeButton);

        document.body.appendChild(modal);
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
        const templateStackBlock = document.querySelector('[data-element="boatDetails_typeOfFishingBlockStackBlock"]');
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
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="boatDetails_typeOfFishingBlockStackBlock"]');
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
        const templateStackBlock = document.querySelector('[data-element="boatDetails_amenityBlockStackBlock"]');
        const parentContainer = templateStackBlock?.parentElement;

        // Hide section if no amenities
        if (!charter.amenities || charter.amenities.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        // Show section if it has data
        if (section) section.style.display = 'flex';

        if (!templateStackBlock || !parentContainer) return;

        // Clear existing stack blocks except template
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="boatDetails_amenityBlockStackBlock"]');
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
        const templateStackBlock = document.querySelector('[data-element="boatDetails_whatsIncludedBlockStackBlock"]');
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
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="boatDetails_whatsIncludedBlockStackBlock"]');
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
        const templateStackBlock = document.querySelector('[data-element="boatDetails_fishingTechniquesBlockStackBlock"]');
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
        const existingStackBlocks = parentContainer.querySelectorAll('[data-element="boatDetails_fishingTechniquesBlockStackBlock"]');
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
                { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "landscape", "stylers": [{ "color": "#f5f5f0" }] },
                { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c2d2b1" }] },
                { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
                { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
                { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
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
        this.selectedDates = [];
        this.updateDatesFilterText();
        this.updateFilterStyles();
        this.updateDateButtonStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearGuestsFilter() {
        this.selectedGuests = 0;
        if (this.guestNumber) this.guestNumber.textContent = this.selectedGuests;
        this.updateGuestsFilterText();
        this.updateFilterStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
      }

      clearPriceFilter() {
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
        this.selectedPrivateDock = false;
        this.updatePrivateDockFilterText();
        this.updateFilterStyles();
        // this.updateURLParams();
        this.refilterChartersIfModalOpen();
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
          this.selectedFishingCharterBlocks.forEach(block => {
            if (block) {
              block.style.display = 'none';
            }
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
            this.updateButtonAvailability();
            this.updateDatesFilterText();
            this.updateFilterStyles();

            // Also update details section if it exists
            this.renderDetailsDateSelection();
            this.updateDetailsDateFilterText();
            this.updateDetailsFilterStyles();
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

      renderDateSelection() {
        if (!this.datesPopupSelectDates) return;

        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout) return;

        this.datesPopupSelectDates.innerHTML = '';

        const dateArray = this.generateDateRange(checkin, checkout);

        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

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

        // Get reserved dates from other fishing charters
        const reservedDates = this.getReservedDatesForOtherCharters();

        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          // Check if this date is reserved by other charters
          const isReserved = reservedDates.includes(dateStr);
          const isSelected = this.selectedDates.includes(dateStr);

          if (isReserved) {
            // Date is reserved by another charter - disable it
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#999';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.disabled = true;
          } else if (isSelected) {
            // Date is selected for current charter
            dateBtn.style.background = '#000000';
            dateBtn.style.color = 'white';
            dateBtn.style.cursor = 'pointer';
            dateBtn.addEventListener('click', () => {
              this.handleDateSelection(dateStr);
            });
          } else {
            // Date is available
            dateBtn.style.background = 'white';
            dateBtn.style.color = 'black';
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
            this.detailsSelectedPrivateDock = !this.detailsSelectedPrivateDock;
            // Sync with main filter variable
            this.selectedPrivateDock = this.detailsSelectedPrivateDock;
            this.updateDetailsPrivateDockFilterText();
            this.updateDetailsFilterStyles();
            this.renderTripTypes(this.currentCharterData);


            // Apply pickup time gating and update date/time text
            this.applyPickupTimeGating(this.pickupTimePills, false);
            this.applyPickupTimeGating(this.boatDetailsPickupTimePills, true);
            this.updateBoatDetailsDateFilterText();
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
        this.detailsSelectedDates = [];
        // Sync with main filter variable
        this.selectedDates = [];
        this.updateDetailsDateFilterText();
        this.updateDetailsFilterStyles();
        this.renderDetailsDateSelection();
        this.renderTripTypes(this.currentCharterData);
      }

      clearDetailsGuestsFilter() {
        this.detailsSelectedGuests = 0;
        // Sync with main filter variable
        this.selectedGuests = 0;
        if (this.detailsGuestNumber) this.detailsGuestNumber.textContent = this.detailsSelectedGuests;
        this.updateDetailsGuestsFilterText();
        this.updateDetailsFilterStyles();
        this.renderTripTypes(this.currentCharterData);
      }

      clearDetailsPrivateDockFilter() {
        this.detailsSelectedPrivateDock = false;
        // Sync with main filter variable
        this.selectedPrivateDock = false;
        this.updateDetailsPrivateDockFilterText();
        this.updateDetailsFilterStyles();
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

        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');

        if (!checkin || !checkout) return;

        this.detailsDatesPopupSelectDates.innerHTML = '';

        const dateArray = this.generateDateRange(checkin, checkout);

        const calendarContainer = document.createElement('div');
        calendarContainer.style.display = 'flex';
        calendarContainer.style.flexDirection = 'column';
        calendarContainer.style.gap = '6px';

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

        // Get reserved dates from other fishing charters
        const reservedDates = this.getReservedDatesForOtherCharters();

        dateArray.forEach(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);

          const dateBtn = document.createElement('button');
          dateBtn.textContent = day;
          dateBtn.setAttribute('data-date', dateStr);
          dateBtn.style.width = '40px';
          dateBtn.style.height = '40px';
          dateBtn.style.border = '1px solid #ddd';
          dateBtn.style.borderRadius = '1000px';

          // Check if this date is reserved by other charters
          const isReserved = reservedDates.includes(dateStr);
          const isSelected = this.detailsSelectedDates.includes(dateStr);

          if (isReserved) {
            // Date is reserved by another charter - disable it
            dateBtn.style.background = '#f5f5f5';
            dateBtn.style.color = '#999';
            dateBtn.style.cursor = 'not-allowed';
            dateBtn.style.opacity = '0.5';
            dateBtn.disabled = true;
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
        this.updateDetailsDateFilterText();
        this.updateDetailsFilterStyles();
        this.updateDetailsDateButtonStyles();
        this.renderTripTypes(this.currentCharterData);
        // Call main updateURLParams method like main filters do
        // this.updateURLParams();
      }

      updateDetailsDateButtonStyles() {
        if (!this.detailsDatesPopupSelectDates) return;

        const dateButtons = this.detailsDatesPopupSelectDates.querySelectorAll('button');

        dateButtons.forEach(btn => {
          const btnDateStr = btn.getAttribute('data-date');
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
            pricePeopleElement.textContent = `Price for ${peopleCount} people`;
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
            pricePeopleElement.textContent = `Price for ${basePeople} people`;
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
          showDetailsButton.textContent = 'Show trip details';

          showDetailsButton.addEventListener('click', () => {
            const isHidden = descriptionElement.style.display === 'none';

            if (isHidden) {
              if (hasDescription) {
                descriptionElement.style.display = 'flex';
              }
              if (targetedFishContainer && hasTargetedFish) {
                targetedFishContainer.style.display = 'flex';
                this.populateTargetedFish(targetedFishContainer, trip.targetedFish);
              }
              showDetailsButton.textContent = 'Show less';
            } else {
              descriptionElement.style.display = 'none';
              if (targetedFishContainer) targetedFishContainer.style.display = 'none';
              showDetailsButton.textContent = 'Show trip details';
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
            if (needsDates && needsGuests) {
              message += 'date(s) and guests';
            } else if (needsDates) {
              message += 'date(s)';
            } else {
              message += 'guests';
            }
            this.showMessage(message + ' before adding to reservation.');
            return;
          }

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

          // Clear all filters since user will likely search for different charter next time
          this.clearDatesFilter();
          this.clearGuestsFilter();
          this.clearPriceFilter();
          this.clearFishingTypeFilter();
          this.clearPrivateDockFilter();


          await this.populateSelectedFishingCharterBlock();

          // Update pricing display for extras
          if (window.updatePricingDisplayForExtras) {
            await window.updatePricingDisplayForExtras();
          }

          // Update mobile handlers immediately after charter is added
          if (window.updateMobileHandlersState) {
            window.updateMobileHandlersState();
          }

          // Reset editing state
          this.editingCharterNumber = null;
          this.editingTripId = null;

          // Reset editing state after successful completion
          this.editingCharterNumber = null;
          this.editingTripId = null;

          this.closeModal();
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

      updateButtonAvailability() {
        if (!this.buttons || this.buttons.length === 0) return;

        const urlParams = new URLSearchParams(window.location.search);
        const hasDates = urlParams.has('checkin') && urlParams.has('checkout');
        const checkIn = urlParams.get('checkin');
        const checkOut = urlParams.get('checkout');

        if (!checkIn || !checkOut || checkIn === '' || checkOut === '') {
          // Disable button appearance and set not-allowed cursor
          this.buttons.forEach(button => {
            if (button) {
              button.style.cursor = 'not-allowed';
              button.style.opacity = '0.5';

              const tooltipMessage = hasDates
                ? 'Valid dates must be selected to add fishing charter'
                : 'Dates must be selected to add fishing charter';

              button.setAttribute('title', tooltipMessage);
            }
          });
        } else {
          // Enable button appearance and set normal cursor
          this.buttons.forEach(button => {
            if (button) {
              button.style.cursor = 'pointer';
              button.style.opacity = '1';
              button.removeAttribute('title');
            }
          });
        }
      }

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
        if (!this.mobileFishingCharterButton) return;

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
          console.error('Error editing single charter:', error);
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
        await window.fishingCharterService.populateSelectedFishingCharterBlock();

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
    }

    // Re-initialize on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 990 && !window.mobileFishingCharterButtonHandler) {
        window.mobileFishingCharterButtonHandler = new MobileFishingCharterButtonHandler();
      }
    });

    // Periodically check button availability in case URL changes through other means
    setInterval(() => {
      fishingCharter.updateButtonAvailability();
    }, 1000);

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

      const shouldShowPricing = validation.datesSelected && validation.datesValid;

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
        // Hide both when dates are invalid/not selected
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

    // Handle boat rentals and fishing charters when dates are cleared
    function handleExtrasWhenDatesCleared(validation) {
      // Only act if dates were cleared (not selected)
      if (!validation.datesSelected) {
        const urlParams = new URLSearchParams(window.location.search);
        let hasRemovedExtras = false;

        // Check and remove boat rental if present
        if (urlParams.get('boatId')) {
          removeBoatFromReservation();
          hasRemovedExtras = true;
        }

        // Check and remove fishing charters if present
        if (window.fishingCharterService && window.fishingCharterService.hasAnyFishingCharters()) {
          const allNumbers = window.fishingCharterService.getAllFishingCharterNumbers();
          allNumbers.forEach(number => {
            removeFishingCharterFromReservation(number);
          });
          hasRemovedExtras = true;
        }

        // Update UI if any extras were removed
        if (hasRemovedExtras) {
          // Update boat UI
          if (window.updateBoatVisibility) {
            window.updateBoatVisibility();
          }

          // Update fishing charter UI
          if (window.fishingCharterService && window.fishingCharterService.populateSelectedFishingCharterBlock) {
            window.fishingCharterService.populateSelectedFishingCharterBlock().catch(err => console.error('Error populating fishing charter:', err));
          }

          // Update pricing display
          if (window.updatePricingDisplayForExtras) {
            window.updatePricingDisplayForExtras().catch(err => console.error('Error updating pricing:', err));
          }
        }
      }
    }

    // Helper function to remove boat from reservation
    function removeBoatFromReservation() {
      const urlParams = new URLSearchParams(window.location.search);

      // Remove boat-related parameters
      urlParams.delete('boatId');
      urlParams.delete('boatDates');
      urlParams.delete('boatGuests');
      urlParams.delete('boatPickupTime');
      urlParams.delete('boatLengthType');
      urlParams.delete('boatPrivateDock');
      urlParams.delete('boatDelivery');

      // Clear boat data
      window.selectedBoatData = null;

      // Update URL
      const newUrl = window.location.pathname + '?' + urlParams.toString();
      window.history.replaceState({}, '', newUrl);

      // Reset boat service filter states
      if (window.boatRentalService) {
        // Clear the current filter states to match the removed boat
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
        window.boatRentalService.updateGuestsFilterText();
        window.boatRentalService.updatePrivateDockFilterText();
        window.boatRentalService.updateBoatDetailsDateFilterText();
        window.boatRentalService.updateBoatDetailsGuestsFilterText();
        window.boatRentalService.updateFilterStyles();

        // Reset pickup time pills
        Object.values(window.boatRentalService.pickupTimePills).forEach(pill => {
          if (pill) pill.style.borderColor = '';
        });
        Object.values(window.boatRentalService.boatDetailsPickupTimePills).forEach(pill => {
          if (pill) pill.style.borderColor = '';
        });
      }
    }

    // Helper function to remove fishing charter from reservation
    function removeFishingCharterFromReservation(number) {
      const urlParams = new URLSearchParams(window.location.search);

      // Remove fishing charter related parameters for this number
      urlParams.delete(`fishingCharterId${number}`);
      urlParams.delete(`fishingCharterTripId${number}`);
      urlParams.delete(`fishingCharterGuests${number}`);
      urlParams.delete(`fishingCharterDates${number}`);
      urlParams.delete(`fishingCharterPickup${number}`);

      // Update URL
      const newUrl = window.location.pathname + '?' + urlParams.toString();
      window.history.replaceState({}, '', newUrl);

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

