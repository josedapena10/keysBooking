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
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {
        try {
            const requestName = 'trip_details'; // Ensure this matches the actual request name
            await Wized.requests.waitFor(requestName);

            let counters = {
                adults: parseInt(Wized.data.n.parameter.adults),
                children: parseInt(Wized.data.n.parameter.children),
                infants: parseInt(Wized.data.n.parameter.infants),
                pets: parseInt(Wized.data.n.parameter.pets)
            };

            let max_guests = Wized.data.r.trip_details.data._property.num_guests;
            let max_infants = 5;
            let max_pets = 2;
            let pet_policy = Wized.data.r.trip_details.data._property.pets_allowed; // Retrieve pet policy

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
        }

    });
});


