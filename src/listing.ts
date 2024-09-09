import { populateSelectOptions } from "@finsweet/ts-utils";

// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);

console.log("test");



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











(async function () {
  try {

    const guestButton = document.querySelector('[data-element="Input_Guests"]');
    const guestButtonDropdown = document.querySelector('[data-element="Input_Guests_Dropdown"]');
    let isPopupOpen = false;

    // Close the dropdown initially
    guestButtonDropdown.style.display = 'none';

    // Function to toggle the dropdown
    const togglePopup = () => {
      isPopupOpen = !isPopupOpen;
      guestButtonDropdown.style.display = isPopupOpen ? 'flex' : 'none';
    };

    // Event listener for guest button click and toggling the dropdown
    guestButton.addEventListener('click', function () {
      togglePopup();
    });

    // Event listener for body click to close the dropdown
    document.body.addEventListener('click', function (evt) {
      if (!guestButton.contains(evt.target) && !guestButtonDropdown.contains(evt.target)) {
        isPopupOpen = false;
        guestButtonDropdown.style.display = 'none';
      }
    });

    // Event listeners to close the popup when buttons inside are clicked
    const closeButton = document.querySelectorAll('[data-element*="Input_Guests_Dropdown_CloseText"]');
    closeButton.forEach(button => {
      button.addEventListener('click', function () {
        isPopupOpen = false;
        guestButtonDropdown.style.display = 'none';
      });
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
})();







document.addEventListener('DOMContentLoaded', () => {
  window.Wized = window.Wized || [];
  window.Wized.push(async (Wized) => {
    try {
      const requestName = 'Load_Property_Details'; // Ensure this matches the actual request name
      await Wized.requests.waitFor(requestName);

      let counters = {
        adults: parseInt(Wized.data.n.parameter.adults),
        children: parseInt(Wized.data.n.parameter.children),
        infants: parseInt(Wized.data.n.parameter.infants),
        pets: parseInt(Wized.data.n.parameter.pets)
      };

      let max_guests = Wized.data.v.max_guests;
      let max_infants = 5;
      let max_pets = 2;
      let pet_policy = Wized.data.v.pets_allowed; // Retrieve pet policy

      let plusButtons = {
        adults: document.querySelector('#plus-button'),
        children: document.querySelector('#plus-button1'),
        infants: document.querySelector('#plus-button2'),
        pets: document.querySelector('#plus-button3')
      };

      let minusButtons = {
        adults: document.querySelector('#minus-button1'),
        children: document.querySelector('#minus-button2'),
        infants: document.querySelector('#minus-button3'),
        pets: document.querySelector('#minus-button4')
      };

      setupSVGButtons();
      updateAllButtonStates();
      updateGuestsParameter();

      if (!pet_policy) {
        disablePetButtons(); // Disable pet buttons if pets are not allowed
      }

      Object.keys(plusButtons).forEach(type => {
        plusButtons[type].addEventListener('click', () => handleIncrement(type));
      });

      Object.keys(minusButtons).forEach(type => {
        minusButtons[type].addEventListener('click', () => handleDecrement(type));
      });

      function handleIncrement(type) {
        if (type === 'adults' || type === 'children') {
          if (counters.adults + counters.children < max_guests) {
            incrementCounter(type);
          }
        } else if (type === 'infants' && counters.infants < max_infants) {
          incrementCounter(type);
        } else if (type === 'pets' && counters.pets < max_pets && pet_policy) {
          incrementCounter(type);
        }
      }

      function handleDecrement(type) {
        if (type === 'adults' && counters[type] > 1 || type !== 'adults' && counters[type] > 0) {
          decrementCounter(type);
        }
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
          plusButtons[type].style.opacity = maxCondition ? '0.3' : '1';

          const minCondition = type === 'adults' ? counters[type] <= 1 : counters[type] <= 0;
          minusButtons[type].style.opacity = minCondition ? '0.3' : '1';
        });

        // Ensure pet buttons remain disabled and at reduced opacity if pets are not allowed
        if (!pet_policy) {
          disablePetButtons();
        }
      }

      function disablePetButtons() {
        plusButtons.pets.disabled = true;
        minusButtons.pets.disabled = true;
        plusButtons.pets.style.opacity = '0.3';  // Ensure opacity remains reduced
        minusButtons.pets.style.opacity = '0.3'; // Ensure opacity remains reduced
      }


      function setupSVGButtons() {
        const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
        const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';
        Object.values(plusButtons).forEach(button => button.innerHTML = svgPlus);
        Object.values(minusButtons).forEach(button => button.innerHTML = svgMinus);
      }

    } catch (error) {
      console.error("Error waiting for request or accessing max_guests:", error);
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
      console.error('SignUp_AgreeSubmitButton not found or not rendered.');
    }














  });
});

// document.addEventListener('DOMContentLoaded', () => {
//   window.Wized = window.Wized || [];
//   window.Wized.push(async (Wized) => {
//     try {
//       const requestName = 'Load_Property_Details'; // Ensure this matches the actual request name
//       await Wized.requests.waitFor(requestName);

//       let counters = {
//         adults: parseInt(Wized.data.n.parameter.adults),
//         children: parseInt(Wized.data.n.parameter.children),
//         infants: parseInt(Wized.data.n.parameter.infants),
//         pets: parseInt(Wized.data.n.parameter.pets)
//       };

//       let max_guests = Wized.data.v.max_guests;
//       let max_infants = 5;
//       let max_pets = 2;

//       let plusButtons = {
//         adults: document.querySelector('#plus-button'),
//         children: document.querySelector('#plus-button1'),
//         infants: document.querySelector('#plus-button2'),
//         pets: document.querySelector('#plus-button3')
//       };

//       let minusButtons = {
//         adults: document.querySelector('#minus-button1'),
//         children: document.querySelector('#minus-button2'),
//         infants: document.querySelector('#minus-button3'),
//         pets: document.querySelector('#minus-button4')
//       };

//       setupSVGButtons();
//       updateAllButtonStates();
//       updateGuestsParameter();

//       Object.keys(plusButtons).forEach(type => {
//         plusButtons[type].addEventListener('click', () => handleIncrement(type));
//       });

//       Object.keys(minusButtons).forEach(type => {
//         minusButtons[type].addEventListener('click', () => handleDecrement(type));
//       });

//       function handleIncrement(type) {
//         if (type === 'adults' || type === 'children') {
//           if (counters.adults + counters.children < max_guests) {
//             incrementCounter(type);
//           }
//         } else if (type === 'infants' && counters.infants < max_infants) {
//           incrementCounter(type);
//         } else if (type === 'pets' && counters.pets < max_pets) {
//           incrementCounter(type);
//         }
//       }

//       function handleDecrement(type) {
//         if (type === 'adults' && counters[type] > 1 || type !== 'adults' && counters[type] > 0) {
//           decrementCounter(type);
//         }
//       }

//       function incrementCounter(type) {
//         counters[type]++;
//         updateCounterInDataStore(type);
//         if (type === 'adults' || type === 'children') {
//           updateGuestsParameter();
//         }
//       }

//       function decrementCounter(type) {
//         counters[type]--;
//         updateCounterInDataStore(type);
//         if (type === 'adults' || type === 'children') {
//           updateGuestsParameter();
//         }
//       }

//       function updateCounterInDataStore(type) {
//         Wized.data.n.parameter[type] = counters[type];
//         updateURLParameter(type, counters[type]);
//         updateAllButtonStates();
//       }

//       function updateGuestsParameter() {
//         const totalGuests = counters.adults + counters.children;
//         Wized.data.n.parameter.guests = totalGuests;
//         updateURLParameter('guests', totalGuests);
//       }

//       function updateURLParameter(type, value) {
//         let url = new URL(window.location);
//         url.searchParams.set(type, value);
//         history.pushState(null, "", url);
//       }

//       function updateAllButtonStates() {
//         Object.keys(counters).forEach(type => {
//           const maxCondition = type === 'adults' || type === 'children' ? counters.adults + counters.children >= max_guests :
//             type === 'infants' ? counters.infants >= max_infants :
//               counters.pets >= max_pets;
//           plusButtons[type].style.opacity = maxCondition ? '0.2' : '1';

//           const minCondition = type === 'adults' ? counters[type] <= 1 : counters[type] <= 0;
//           minusButtons[type].style.opacity = minCondition ? '0.2' : '1';
//         });
//       }

//       function setupSVGButtons() {
//         const svgPlus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="2"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect><rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect></svg>';
//         const svgMinus = '<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="2"></circle><rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect></svg>';
//         Object.values(plusButtons).forEach(button => button.innerHTML = svgPlus);
//         Object.values(minusButtons).forEach(button => button.innerHTML = svgMinus);
//       }

//     } catch (error) {
//       console.error("Error waiting for request or accessing max_guests:", error);
//     }
//   });
// });






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
            console.error("Error retrieving Wized data:", error);
          }

          // Calculate new latitude and longitude to show 0.1 miles south and right
          const miles = 0.05;
          const earthRadius = 3958.8; // Radius of the Earth in miles
          const latOffset = -(miles / earthRadius) * (180 / Math.PI); // Negative to go south
          const lngOffset = (miles / earthRadius) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180); // Positive to go right (east)

          const fakeLatitude = latitude + latOffset;
          const fakeLongitude = longitude + lngOffset;

          console.log("True Position:", { lat: latitude, lng: longitude });
          console.log("Marker Position (0.1 miles south and right):", { lat: fakeLatitude, lng: fakeLongitude });

          if (latitude && longitude) {
            clearInterval(checkDataInterval); // Stop the interval once data is available

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.defer = true;
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
      console.error("Error:", error);
    }
  };
});















// //calender
// //calender
// //calender
// //calender





window.Wized = window.Wized || [];
window.Wized.push((Wized) => {
  // // Get references to the elements using data-element attributes
  // const reservationCardDatesElement = document.querySelector('[data-element="calendarModal_reservationCardDates"]');
  // const closeButtonElement = document.querySelector('[data-element="calendarModal_closeButton"]');
  // const calendarModalElement = document.querySelector('[data-element="calendarModal"]');
  // const bodyElement = document.querySelector('[data-element="body"]');


  // // Ensure the calendar modal is initially hidden
  // if (calendarModalElement) {
  //   calendarModalElement.style.display = 'none'; // Hide the modal on page load
  // }

  // // Show or hide the calendar modal when the reservation card dates element is clicked
  // if (reservationCardDatesElement) {
  //   reservationCardDatesElement.addEventListener('click', () => {
  //     if (calendarModalElement) {
  //       if (calendarModalElement.style.display === 'block') {
  //         // If the modal is already visible, hide it
  //         calendarModalElement.style.display = 'none';
  //       } else {
  //         // Otherwise, show the modal
  //         calendarModalElement.style.display = 'block';
  //       }
  //     }
  //   });
  // }

  // // Hide the calendar modal when the close button is clicked
  // if (closeButtonElement) {
  //   closeButtonElement.addEventListener('click', () => {
  //     if (calendarModalElement) {
  //       calendarModalElement.style.display = 'none'; // Hide the modal
  //     }
  //   });
  // }

  // // Hide the calendar modal when clicking outside the modal (on the body)
  // if (bodyElement) {
  //   bodyElement.addEventListener('click', (event) => {
  //     if (calendarModalElement && calendarModalElement.style.display === 'block') {
  //       // Check if the click was outside the modal
  //       if (!calendarModalElement.contains(event.target) && !reservationCardDatesElement.contains(event.target)) {
  //         calendarModalElement.style.display = 'none'; // Hide the modal
  //       }
  //     }
  //   });
  // }



  //const calendarModalMonths = document.querySelector('[data-element="calendarModal_monthsContainer"]');
  // Select the element

  // Define the HTML content to add
  //const htmlContent = `
  //<input id="start-date" />
  // <input id="end-date" />
  //`;

  // Add the HTML content to the element
  // calendarModalMonths.innerHTML = htmlContent;

  console.log("calendar element")

  //console.log(calendarModalMonths)
  const startDate = Wized.data.n.parameter.checkin;
  console.log("ealh start date")
  console.log(startDate)
  // Fetch the start date from Wized data
  const endDate = Wized.data.n.parameter.checkout

  const script1 = document.createElement('script');
  script1.innerHTML = `
    const picker = new easepick.create({
        element: document.getElementById('Input_CheckIn'),
        css: [
            'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',
            'https://cdn.jsdelivr.net/npm/@easepick/range-plugin@1.2.1/dist/index.css',
            'calendar1.css'
        ],
        firstDay: 0,
        calendars: 2,
        index: 100,
        format: "YYYY-MM-DD",
        plugins: ['RangePlugin'],
        RangePlugin: {
          elementEnd: document.getElementById('Input_CheckOut'),
          startDate: "${startDate}",
            endDate: "${endDate}",
            minDays: 7,
            tooltip: false
        }
    });
`;
  document.body.appendChild(script1);

  picker.on('select', (event) => {
    const startDate = picker.getStartDate();

    if (startDate) {
        // Automatically set the end date to 7 days after the start date
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        // Format the end date to match the required format
        const formattedEndDate = endDate.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"

        // Set the end date in the picker
        picker.setEndDate(formattedEndDate);
    }
});


});










// window.onload = async () => {
//   // Wait for Wized to be ready
//   await Wized.request.awaitAllPageLoad();

//   // Import necessary modules (if using ES modules syntax)


//   // Function to disable past dates
//   function disablePastDates() {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const dayElements = document.querySelectorAll('.calendar .days-grid .day');

//     dayElements.forEach(function (day) {
//       const dayDate = new Date(parseInt(day.getAttribute('data-time') || ''));

//       if (dayDate < today) {
//         day.classList.add('disabled');
//         day.removeAttribute('onclick');
//       }
//     });
//   }

//   // Initialize easepick date range picker
//   document.addEventListener('DOMContentLoaded', function () {
//     const startInput = document.getElementById('start-date');
//     const endInput = document.getElementById('end-date');

//     const picker = new easepick.create({
//       element: startInput,
//       css: [
//         'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',
//         'https://cdn.jsdelivr.net/npm/@easepick/range-plugin@1.2.1/dist/index.css',
//         'calendar1.css'
//       ],
//       firstDay: 0,
//       calendars: 2,
//       format: 'MM-DD-YYYY',
//       plugins: ['RangePlugin'],
//       RangePlugin: {
//         elementEnd: endInput,
//         // Replace with dynamic values for startDate and endDate
//         startDate: '05-12-2024',
//         endDate: '05-19-2024',
//         minDays: 7,
//         tooltip: false
//       }
//     });

//     // Disable past dates after the picker is initialized
//     disablePastDates();
//   });
// };
