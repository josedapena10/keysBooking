console.log("hello jose");

// Object to store listing data
let listingData = {};

// Array defining the ordered steps by their element IDs
const steps = ["get-started", "basics", "location", "amenities", "description", "pricing", "availability", "review-info"];

// Variable to track the current step
let currentStepNumber = 1;

// Function to show a specific step and update URL hash
function goToStep(stepNumber) {
    console.log(`Navigating to step ${stepNumber}`);

    // Ensure stepNumber is within bounds
    if (stepNumber < 1 || stepNumber > steps.length) {
        console.error(`Invalid step number: ${stepNumber}`);
        return;
    }

    const stepId = steps[stepNumber - 1];
    const previousStep = document.querySelector('.step.active');

    if (previousStep) {
        // Start hiding the current step
        previousStep.style.opacity = '0';
        previousStep.style.transition = 'opacity 0.5s ease-out';

        // Wait for the transition to complete before hiding it
        setTimeout(() => {
            previousStep.style.display = 'none';
            previousStep.classList.remove('active');
            showStep(stepId);
        }, 500); // Match the delay with the transition duration
    } else {
        showStep(stepId); // First step load
    }

    // Update the URL hash without reloading the page
    window.location.hash = `#${stepId}`;

    // Update the currentStepNumber
    currentStepNumber = stepNumber;

    // Disable or enable buttons based on the current step
    updateButtonStates();
}

// Function to show the current step with fade-in effect
function showStep(stepId) {
    const currentStep = document.getElementById(stepId);
    if (currentStep) {
        currentStep.style.display = 'flex';
        currentStep.style.opacity = '0'; // Start hidden
        setTimeout(() => {
            currentStep.style.transition = 'opacity 0.5s ease-in';
            currentStep.style.opacity = '1'; // Fade in
        }, 50); // Small delay to trigger the transition
        currentStep.classList.add('active');
    } else {
        console.error(`Step ID not found: ${stepId}`);
    }

    // Initialize the counter logic when the "basics" step is shown
    if (stepId === "basics") {
        initializeCounters();
    }
}

// Function to enable/disable buttons based on the current step
function updateButtonStates() {
    const nextStepLoader = document.getElementById('nextStepLoader');
    const nextStepText = document.getElementById('nextStepText');
    const prevStepButton = document.getElementById('prevStep');

    // Show the loader and hide the text during step transition
    if (nextStepLoader && nextStepText) {
        nextStepLoader.style.display = 'none'; // Hide loader
        nextStepText.style.display = 'flex'; // Always show the text once the loader is done
    }

    // Apply smooth transition to the nextStepText opacity
    if (nextStepText) {
        nextStepText.style.transition = 'opacity 0.5s ease'; // Ensure opacity transition
        nextStepText.style.opacity = '1';

        // On the first step, change the text to "Get Started"
        if (currentStepNumber === 1) {
            nextStepText.style.opacity = '0'; // Fade out
            setTimeout(() => {
                nextStepText.textContent = "Get Started";
                nextStepText.style.opacity = '1'; // Fade back in
            }, 500); // Wait for the fade-out before changing the text
        } else {
            nextStepText.style.opacity = '0'; // Fade out
            setTimeout(() => {
                nextStepText.textContent = "Next";
                nextStepText.style.opacity = '1'; // Fade back in
            }, 500); // Wait for the fade-out before changing the text
        }
    }

    // Handle visibility and transition of the "Previous" button
    if (prevStepButton) {
        if (currentStepNumber === 1) {
            prevStepButton.style.transition = 'opacity 0.5s ease-out';
            prevStepButton.style.opacity = '0';
            setTimeout(() => {
                prevStepButton.style.display = "none"; // Hide on the first step
            }, 500); // Match the delay with the step transition
        } else {
            prevStepButton.style.display = "flex"; // Show on other steps
            setTimeout(() => {
                prevStepButton.style.transition = 'opacity 0.5s ease-in';
                prevStepButton.style.opacity = '1';
            }, 50); // Delay for smooth transition
        }
    }

    // Disable "Next" button on the last step
    document.getElementById('nextStep').disabled = (currentStepNumber === steps.length);
}

// Counter logic for the "basics" step
function initializeCounters() {
    let counters = {
        guests: 0,
        bedrooms: 0,
        baths: 0,
        beds: 0
    };

    const plusButtons = {
        guests: document.getElementById('plus-button1'),
        bedrooms: document.getElementById('plus-button2'),
        baths: document.getElementById('plus-button3'),
        beds: document.getElementById('plus-button4')
    };

    const minusButtons = {
        guests: document.getElementById('minus-button1'),
        bedrooms: document.getElementById('minus-button2'),
        baths: document.getElementById('minus-button3'),
        beds: document.getElementById('minus-button4')
    };

    const textFields = {
        guests: document.getElementById('guests-text'),
        bedrooms: document.getElementById('bedrooms-text'),
        baths: document.getElementById('baths-text'),
        beds: document.getElementById('beds-text')
    };

    setupSVGButtons();
    updateAllButtonStates();

    // Add event listeners for plus and minus buttons
    Object.keys(plusButtons).forEach(type => {
        plusButtons[type].addEventListener('click', () => handleIncrement(type));
    });

    Object.keys(minusButtons).forEach(type => {
        minusButtons[type].addEventListener('click', () => handleDecrement(type));
    });

    function handleIncrement(type) {
        counters[type]++;
        updateCounterDisplay(type);
        updateAllButtonStates();
    }

    function handleDecrement(type) {
        if (counters[type] > 0) {
            counters[type]--;
            updateCounterDisplay(type);
            updateAllButtonStates();
        }
    }

    function updateCounterDisplay(type) {
        textFields[type].textContent = counters[type];
    }

    function updateAllButtonStates() {
        Object.keys(counters).forEach(type => {
            // Disable minus button if the counter is 0
            if (counters[type] <= 0) {
                minusButtons[type].disabled = true;
                minusButtons[type].style.opacity = '0.3';
            } else {
                minusButtons[type].disabled = false;
                minusButtons[type].style.opacity = '1';
            }

            // Plus buttons will always be enabled since there's no max limit
            plusButtons[type].style.opacity = '1';
        });
    }

    function setupSVGButtons() {
        const svgPlus = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
                <rect x="14" y="9" width="2" height="12" rx="2" fill="#808080"></rect>
            </svg>
        `;
        const svgMinus = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="14" fill="none" stroke="#808080" stroke-width="1"></circle>
                <rect x="9" y="14" width="12" height="2" rx="2" fill="#808080"></rect>
            </svg>
        `;

        Object.values(plusButtons).forEach(button => button.innerHTML = svgPlus);
        Object.values(minusButtons).forEach(button => button.innerHTML = svgMinus);
    }
}

// Initial step on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded, initializing steps");

    // Determine the initial step from the URL hash or default to step 1
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const initialStepId = hash ? hash : 'get-started';
    const initialStepNumber = steps.indexOf(initialStepId) !== -1 ? steps.indexOf(initialStepId) + 1 : 1;
    console.log(`Initial step ID: ${initialStepId}, Initial step number: ${initialStepNumber}`);
    goToStep(initialStepNumber);
});

// Handle next button click
document.getElementById('nextStep').addEventListener('click', function () {
    console.log(`Next step clicked: Current step ${currentStepNumber}`);

    const nextStepLoader = document.getElementById('nextStepLoader');
    const nextStepText = document.getElementById('nextStepText');

    // Show loader and hide the text during step transition
    if (nextStepLoader && nextStepText) {
        nextStepText.style.opacity = '0'; // Fade out text
        setTimeout(() => {
            nextStepText.style.display = 'none'; // Hide text after fade-out
            nextStepLoader.style.display = 'flex'; // Show loader
        }, 500); // Wait for the opacity transition to complete
    }

    // Enforce loader to show for at least 1 second
    const loaderTimeout = setTimeout(() => {
        if (nextStepLoader && nextStepText) {
            nextStepLoader.style.display = 'none'; // Hide loader
            nextStepText.style.display = 'flex'; // Show text again

            // Fade the text back in
            nextStepText.style.opacity = '0';
            setTimeout(() => {
                nextStepText.style.transition = 'opacity 0.5s ease-in';
                nextStepText.style.opacity = '1'; // Fade-in transition
            }, 50);
        }
    }, 1000); // 1 second minimum loader display

    // Simulate validation or checks
    setTimeout(() => {
        // Proceed to the next step if valid
        if (currentStepNumber < steps.length) {
            goToStep(currentStepNumber + 1);
        }

        // Ensure loader is shown for at least 1 second
        clearTimeout(loaderTimeout);
        if (nextStepLoader && nextStepText) {
            nextStepLoader.style.display = 'none'; // Hide loader
            nextStepText.style.display = 'flex'; // Show text again
            nextStepText.style.opacity = '1'; // Reset opacity
        }
    }, 500); // Simulate a 0.5s delay for validation (adjust as needed)
});

// Handle previous button click
document.getElementById('prevStep').addEventListener('click', function () {
    console.log(`Previous step clicked: Current step ${currentStepNumber}`);

    // Go to the previous step if not the first step
    if (currentStepNumber > 1) {
        goToStep(currentStepNumber - 1);
    }
});

// Handle hash change event (when the user manually changes the hash or presses back/forward)
window.addEventListener('hashchange', function () {
    const hash = window.location.hash.substring(1); // Remove the leading "#"
    const stepNumber = steps.indexOf(hash) + 1;
    console.log(`Handling hash change, step number: ${stepNumber}`);
    if (stepNumber > 0) {
        goToStep(stepNumber);
    }
});




// console.log("hello jose");

// // Object to store listing data
// let listingData = {};

// // Array defining the ordered steps by their element IDs
// const steps = ["get-started", "basics", "location", "amenities", "description", "pricing", "availability", "review-info"];

// // Variable to track the current step
// let currentStepNumber = 1;

// // Function to show a specific step and update URL hash
// function goToStep(stepNumber) {
//     console.log(`Navigating to step ${stepNumber}`);

//     // Ensure stepNumber is within bounds
//     if (stepNumber < 1 || stepNumber > steps.length) {
//         console.error(`Invalid step number: ${stepNumber}`);
//         return;
//     }

//     const stepId = steps[stepNumber - 1];
//     const previousStep = document.querySelector('.step.active');

//     if (previousStep) {
//         // Start hiding the current step
//         previousStep.style.opacity = '0';
//         previousStep.style.transition = 'opacity 0.5s ease-out';

//         // Wait for the transition to complete before hiding it
//         setTimeout(() => {
//             previousStep.style.display = 'none';
//             previousStep.classList.remove('active');
//             showStep(stepId);
//         }, 500); // Match the delay with the transition duration
//     } else {
//         showStep(stepId); // First step load
//     }

//     // Update the URL hash without reloading the page
//     window.location.hash = `#${stepId}`;

//     // Update the currentStepNumber
//     currentStepNumber = stepNumber;

//     // Disable or enable buttons based on the current step
//     updateButtonStates();
// }

// // Function to show the current step with fade-in effect
// function showStep(stepId) {
//     const currentStep = document.getElementById(stepId);
//     if (currentStep) {
//         currentStep.style.display = 'flex';
//         currentStep.style.opacity = '0'; // Start hidden
//         setTimeout(() => {
//             currentStep.style.transition = 'opacity 0.5s ease-in';
//             currentStep.style.opacity = '1'; // Fade in
//         }, 50); // Small delay to trigger the transition
//         currentStep.classList.add('active');
//     } else {
//         console.error(`Step ID not found: ${stepId}`);
//     }
// }

// // Function to enable/disable buttons based on the current step
// function updateButtonStates() {
//     const nextStepLoader = document.getElementById('nextStepLoader');
//     const nextStepText = document.getElementById('nextStepText');
//     const prevStepButton = document.getElementById('prevStep');

//     // Show the text and hide the loader after transition
//     if (nextStepLoader && nextStepText) {
//         nextStepLoader.style.display = 'none'; // Hide loader
//         nextStepText.style.display = 'flex'; // Always show the text once the loader is done
//     }

//     // Handle visibility and transition of the "Previous" button
//     if (prevStepButton) {
//         if (currentStepNumber === 1) {
//             prevStepButton.style.transition = 'opacity 0.5s ease-out';
//             prevStepButton.style.opacity = '0';
//             setTimeout(() => {
//                 prevStepButton.style.display = "none"; // Hide on the first step
//             }, 500); // Match the delay with the step transition
//         } else {
//             prevStepButton.style.display = "flex"; // Show on other steps
//             setTimeout(() => {
//                 prevStepButton.style.transition = 'opacity 0.5s ease-in';
//                 prevStepButton.style.opacity = '1';
//             }, 50); // Delay for smooth transition
//         }
//     }

//     // Disable "Next" button on the last step
//     document.getElementById('nextStep').disabled = (currentStepNumber === steps.length);
// }

// // Initial step on page load
// document.addEventListener('DOMContentLoaded', () => {
//     console.log("Page loaded, initializing steps");

//     // Determine the initial step from the URL hash or default to step 1
//     const hash = window.location.hash.substring(1); // Remove the leading "#"
//     const initialStepId = hash ? hash : 'get-started';
//     const initialStepNumber = steps.indexOf(initialStepId) !== -1 ? steps.indexOf(initialStepId) + 1 : 1;
//     console.log(`Initial step ID: ${initialStepId}, Initial step number: ${initialStepNumber}`);
//     goToStep(initialStepNumber);
// });

// // Handle next button click
// document.getElementById('nextStep').addEventListener('click', function () {
//     console.log(`Next step clicked: Current step ${currentStepNumber}`);

//     const nextStepLoader = document.getElementById('nextStepLoader');
//     const nextStepText = document.getElementById('nextStepText');

//     // Show loader and hide the text during step transition
//     if (nextStepLoader && nextStepText) {
//         nextStepText.style.display = 'none'; // Hide text
//         nextStepLoader.style.display = 'flex'; // Show loader
//     }

//     // Enforce loader to show for at least 1 second
//     const loaderTimeout = setTimeout(() => {
//         if (nextStepLoader && nextStepText) {
//             nextStepLoader.style.display = 'none'; // Hide loader
//             nextStepText.style.display = 'flex'; // Show text again
//         }
//     }, 1000); // 1 second minimum loader display

//     // Simulate validation or checks
//     setTimeout(() => {
//         // Proceed to the next step if valid
//         if (currentStepNumber < steps.length) {
//             goToStep(currentStepNumber + 1);
//         }

//         // Ensure loader is shown for at least 1 second
//         clearTimeout(loaderTimeout);
//         if (nextStepLoader && nextStepText) {
//             nextStepLoader.style.display = 'none'; // Hide loader
//             nextStepText.style.display = 'flex'; // Show text again
//         }
//     }, 500); // Simulate a 0.5s delay for validation (adjust as needed)
// });

// // Handle previous button click
// document.getElementById('prevStep').addEventListener('click', function () {
//     console.log(`Previous step clicked: Current step ${currentStepNumber}`);

//     // Go to the previous step if not the first step
//     if (currentStepNumber > 1) {
//         goToStep(currentStepNumber - 1);
//     }
// });

// // Handle hash change event (when the user manually changes the hash or presses back/forward)
// window.addEventListener('hashchange', function () {
//     const hash = window.location.hash.substring(1); // Remove the leading "#"
//     const stepNumber = steps.indexOf(hash) + 1;
//     console.log(`Handling hash change, step number: ${stepNumber}`);
//     if (stepNumber > 0) {
//         goToStep(stepNumber);
//     }
// });


