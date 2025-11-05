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

        await Wized.requests.waitFor('Load_user');
        const userLoadStatus = Wized.data.r.Load_user.status


        document.querySelectorAll('[data-element="addListing_Button"]').forEach(button => {
            button.addEventListener('click', async function () {
                try {
                    if (userLoadStatus === 200) {
                        // If the user is signed in, navigate to /add-home
                        window.location.href = '/host/add-home';
                    } else {
                        // User is not signed in, show signup wrapper
                        const signupWrapper = document.querySelector('[data-element="signin-wrapper"]');
                        if (signupWrapper) {
                            signupWrapper.style.display = 'flex';
                        }
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                }
            });


        });
    });
});


//copy email and phone number to clipboard

document.addEventListener('DOMContentLoaded', () => {
    // Function to copy text to the clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Select the email and phone number buttons
    const copyEmailButton = document.querySelector('[data-element="help_copyEmail"]');
    const copyPhoneButton = document.querySelector('[data-element="help_copyPhone"]');

    // Email and phone number to copy
    const email = 'support@keysbooking.com';
    const phoneNumber = '+13053011952';

    // Add click event listeners
    if (copyEmailButton) {
        copyEmailButton.addEventListener('click', () => {
            copyToClipboard(email);
            alert('Email copied to clipboard!');
        });
    }

    if (copyPhoneButton) {
        copyPhoneButton.addEventListener('click', () => {
            copyToClipboard(phoneNumber);
            alert('Phone number copied to clipboard!');
        });
    }
});


// Founding Partner Count Feature
document.addEventListener('DOMContentLoaded', async () => {
    const spotsClaimedElements = document.querySelectorAll('[data-element="hostLanding_spotsClaimedText"]');

    if (!spotsClaimedElements || spotsClaimedElements.length === 0) return;

    // Add gradient animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes coolGradient {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
        
        @keyframes strikethrough {
            0% {
                width: 0%;
            }
            100% {
                width: 100%;
            }
        }
        
        @keyframes pulsateGlow {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.03);
                opacity: 0.9;
            }
        }
        
        .cool-gradient-text {
            background: linear-gradient(
                90deg,
                #0088cc,
                #0066aa,
                #4b0082,
                #6600cc,
                #0088cc
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: coolGradient 3s ease infinite;
            display: inline-block;
            font-weight: 600;
        }
        
        .strikethrough-container {
            position: relative;
            display: inline-block;
        }
        
        .strikethrough-line {
            position: absolute;
            top: 50%;
            left: 0;
            height: 2px;
            background: currentColor;
            width: 0%;
            animation: strikethrough 1s ease-in-out forwards;
        }
        
        .founding-fee-reveal {
            animation: pulsateGlow 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);

    // Add cool gradient class to all elements
    spotsClaimedElements.forEach(element => {
        element.classList.add('cool-gradient-text');
    });

    try {
        // Fetch the founding partner count
        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/hostLanding_foundingPartnerCount');

        if (!response.ok) {
            throw new Error('Failed to fetch founding partner count');
        }

        const count = await response.json();
        const targetNumber = parseInt(count);

        // Animate count from 0 to target number
        const duration = 500; // 0.5 seconds
        const steps = 60; // Number of steps in the animation
        const increment = targetNumber / steps;
        const stepDuration = duration / steps;

        let currentNumber = 0;

        const countInterval = setInterval(() => {
            currentNumber += increment;

            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(countInterval);
            }

            // Update all elements
            spotsClaimedElements.forEach(element => {
                element.textContent = `${Math.floor(currentNumber)} of 100 founding spots claimed 🔒`;
            });
        }, stepDuration);

    } catch (error) {
        console.error('Error fetching founding partner count:', error);
        // Fallback display if fetch fails
        spotsClaimedElements.forEach(element => {
            element.textContent = '__ of 100 founding spots claimed 🔒';
        });
    }
});


// Fee Strikethrough Animation Feature
document.addEventListener('DOMContentLoaded', () => {
    const defaultFeeElements = document.querySelectorAll('[data-element="hostLanding_defaultFee"]');
    const foundingFeeElements = document.querySelectorAll('[data-element="hostLanding_foundingFee"]');
    const foundingFeeContainers = document.querySelectorAll('[data-element="hostLanding_foundingFeeContainer"]');

    // Setup founding fee elements for smooth animation
    foundingFeeElements.forEach((element, index) => {
        element.style.display = 'flex';
        element.style.maxHeight = '0px';
        element.style.opacity = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'max-height 0.8s ease-in-out, opacity 0.8s ease-in-out, margin 0.8s ease-in-out, padding 0.8s ease-in-out';
    });

    // Wait a moment after page load, then start the animation
    setTimeout(() => {
        // Add strikethrough to default fee elements
        defaultFeeElements.forEach(element => {
            // Wrap the element content if not already wrapped
            if (!element.classList.contains('strikethrough-container')) {
                const content = element.innerHTML;
                element.innerHTML = content;
                element.classList.add('strikethrough-container');

                // Add strikethrough line
                const line = document.createElement('div');
                line.classList.add('strikethrough-line');
                element.appendChild(line);
            }
        });

        // After strikethrough animation completes (1s), show founding fee
        setTimeout(() => {
            foundingFeeElements.forEach((element, index) => {
                // Ensure opacity stays at 0 during measurement
                element.style.opacity = '0';

                // Temporarily remove overflow and max-height to measure natural height
                element.style.overflow = 'visible';
                element.style.maxHeight = 'none';
                const naturalHeight = element.scrollHeight;

                // Reset to collapsed state with opacity 0
                element.style.overflow = 'hidden';
                element.style.maxHeight = '0px';
                element.style.opacity = '0';

                // Force reflow
                element.offsetHeight;

                // Start height animation first
                requestAnimationFrame(() => {
                    element.style.maxHeight = naturalHeight + 'px';
                    element.classList.add('founding-fee-reveal');

                    // Delay opacity fade-in by 200ms to make it more visible
                    setTimeout(() => {
                        element.style.opacity = '1';
                    }, 200);
                });

                // After animation, remove max-height constraint
                setTimeout(() => {
                    element.style.maxHeight = 'none';
                    element.style.overflow = 'visible';
                }, 1000);
            });
        }, 1000);

    }, 500); // Start after 500ms page load
});

