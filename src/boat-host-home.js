
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




// Boat Host Home - Adapted from host-home.js

// Copy email and phone number to clipboard
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
    const copyEmailButton = document.querySelector('[data-element="boat_help_copyEmail"]');
    const copyPhoneButton = document.querySelector('[data-element="boat_help_copyPhone"]');

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


// Hero Image Loader
document.addEventListener('DOMContentLoaded', async () => {
    const heroImageElement = document.querySelector('[data-element="boat_becomeAHostHeroImage"]');
    const loaderElement = document.querySelector('[data-element="boat_loader"]');

    // Keep loader visible initially
    if (loaderElement) {
        loaderElement.style.display = 'flex';
    }

    // Load Hero Image
    if (heroImageElement) {
        try {
            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/stockimages/1');

            if (!response.ok) {
                throw new Error('Failed to fetch hero image');
            }

            const data = await response.json();

            if (data.image && data.image.url) {
                heroImageElement.onload = () => {
                    if (loaderElement) {
                        loaderElement.style.display = 'none';
                    }
                };

                heroImageElement.onerror = () => {
                    console.error('Error loading hero image');
                    if (loaderElement) {
                        loaderElement.style.display = 'none';
                    }
                };

                heroImageElement.src = data.image.url;
                heroImageElement.alt = data.image.name || 'Boat rental hero image';
            } else {
                if (loaderElement) {
                    loaderElement.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error fetching hero image:', error);
            if (loaderElement) {
                loaderElement.style.display = 'none';
            }
        }
    } else {
        if (loaderElement) {
            loaderElement.style.display = 'none';
        }
    }
});


// Boat Rental Interest Popup Feature
document.addEventListener('DOMContentLoaded', () => {
    const addListingButtons = document.querySelectorAll('[data-element="boat_addListing_Button"]');

    if (!addListingButtons || addListingButtons.length === 0) return;

    // Add popup styles
    const style = document.createElement('style');
    style.textContent = `
        .boat-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        }
        
        .boat-popup-overlay.active {
            display: flex;
        }
        
        .boat-popup {
            background: white;
            border-radius: 5px;
            padding: 32px;
            max-width: 700px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: boatPopupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes boatPopupSlideIn {
            0% {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .boat-popup-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border: none;
            background: #f0f0f0;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-family: 'TT Fors', sans-serif;
            color: #666;
            transition: all 0.2s ease;
        }
        
        .boat-popup-close:hover {
            background: #e0e0e0;
            color: #000;
            transform: rotate(90deg);
        }
        
        .boat-popup h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #000;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup p {
            margin: 0 0 24px 0;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .boat-popup-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-row {
            display: flex;
            gap: 16px;
        }
        
        .boat-popup-row .boat-popup-field {
            flex: 1;
        }
        
        @media (max-width: 600px) {
            .boat-popup-row {
                flex-direction: column;
                gap: 20px;
            }
        }
        
        .boat-popup-field label {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-field input,
        .boat-popup-field select,
        .boat-popup-field textarea {
            padding: 12px 16px;
            border: 2px solid #e2e2e2;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s ease;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-field textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .boat-popup-field input:focus,
        .boat-popup-field select:focus,
        .boat-popup-field textarea:focus {
            outline: none;
            border-color: #0099cc;
            box-shadow: 0 0 0 3px rgba(0, 153, 204, 0.1);
        }
        
        .boat-popup-submit {
            padding: 14px 24px;
            background: linear-gradient(135deg, #0099cc 0%, #006699 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 8px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 153, 204, 0.4);
        }
        
        .boat-popup-submit:active {
            transform: translateY(0);
        }
        
        .boat-popup-field small {
            color: #999;
            font-size: 12px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .boat-popup-section {
            padding: 16px;
            background: #f0f9fc;
            border-radius: 8px;
            border: 1px solid #d0e8f0;
        }
        
        .boat-popup-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #006699;
            margin-bottom: 16px;
            font-family: 'TT Fors', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .boat-popup-section-title svg {
            width: 20px;
            height: 20px;
        }
    `;
    document.head.appendChild(style);

    // Create popup HTML
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'boat-popup-overlay';
    popupOverlay.innerHTML = `
        <div class="boat-popup">
            <button class="boat-popup-close" type="button">×</button>
            <h2>Join Keys Booking - Boat Rentals</h2>
            <p>Interested in listing your boats with us? Fill out this form and our team will reach out to discuss partnership opportunities.</p>
            <form class="boat-popup-form">
                <div class="boat-popup-section">
                    <div class="boat-popup-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#006699"/>
                        </svg>
                        Contact Information
                    </div>
                    <div class="boat-popup-row">
                        <div class="boat-popup-field">
                            <label for="boat-first-name">First Name *</label>
                            <input 
                                type="text" 
                                id="boat-first-name" 
                                name="first-name" 
                                placeholder="John"
                                required
                            />
                        </div>
                        <div class="boat-popup-field">
                            <label for="boat-last-name">Last Name *</label>
                            <input 
                                type="text" 
                                id="boat-last-name" 
                                name="last-name" 
                                placeholder="Smith"
                                required
                            />
                        </div>
                    </div>
                    <div class="boat-popup-row" style="margin-top: 16px;">
                        <div class="boat-popup-field">
                            <label for="boat-email">Email *</label>
                            <input 
                                type="email" 
                                id="boat-email" 
                                name="email" 
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div class="boat-popup-field">
                            <label for="boat-phone">Phone Number</label>
                            <input 
                                type="tel" 
                                id="boat-phone" 
                                name="phone" 
                                placeholder="(305) 123-4567"
                            />
                        </div>
                    </div>
                </div>
                
                <div class="boat-popup-section">
                    <div class="boat-popup-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21C20 21.55 19.55 22 19 22H5C4.45 22 4 21.55 4 21V20H20V21ZM3 19C3 18.45 3.45 18 4 18H20C20.55 18 21 18.45 21 19C21 19.55 20.55 20 20 20H4C3.45 20 3 19.55 3 19ZM6 16L3 13L9 11L7 9L15 5L14 10L18 9L19 14L6 16Z" fill="#006699"/>
                        </svg>
                        Boat Information
                    </div>
                    <div class="boat-popup-row">
                        <div class="boat-popup-field">
                            <label for="boat-count">Number of Boats *</label>
                            <input 
                                type="number" 
                                id="boat-count" 
                                name="boat-count" 
                                min="1" 
                                max="999"
                                placeholder="e.g., 3"
                                required
                            />
                        </div>
                        <div class="boat-popup-field">
                            <label for="boat-types">Types of Boats</label>
                            <input 
                                type="text" 
                                id="boat-types" 
                                name="boat-types" 
                                placeholder="e.g., Pontoon, Jet Ski, Yacht"
                            />
                            <small>Separate multiple types with commas</small>
                        </div>
                    </div>
                    <div class="boat-popup-field" style="margin-top: 16px;">
                        <label for="boat-location">Marina / Location *</label>
                        <input 
                            type="text" 
                            id="boat-location" 
                            name="location" 
                            placeholder="e.g., Key Largo Marina, Key West"
                            required
                        />
                        <small>Where are your boats docked?</small>
                    </div>
                    <div class="boat-popup-field" style="margin-top: 16px;">
                        <label for="boat-additional">Additional Information</label>
                        <textarea 
                            id="boat-additional" 
                            name="additional" 
                            placeholder="Tell us more about your boats, services offered, or any questions you have..."
                        ></textarea>
                    </div>
                </div>
                
                <button type="submit" class="boat-popup-submit">
                    Submit Interest
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(popupOverlay);

    // Get references
    const popup = popupOverlay.querySelector('.boat-popup');
    const closeBtn = popupOverlay.querySelector('.boat-popup-close');
    const form = popupOverlay.querySelector('.boat-popup-form');
    const firstNameInput = document.getElementById('boat-first-name');
    const lastNameInput = document.getElementById('boat-last-name');
    const emailInput = document.getElementById('boat-email');
    const phoneInput = document.getElementById('boat-phone');
    const boatCountInput = document.getElementById('boat-count');
    const boatTypesInput = document.getElementById('boat-types');
    const locationInput = document.getElementById('boat-location');
    const additionalInput = document.getElementById('boat-additional');

    // Phone number formatting
    if (phoneInput) {
        phoneInput.addEventListener('input', (event) => {
            const inputElement = event.target;
            let input = inputElement.value.replace(/[\D-]/g, '');
            if (input.length > 10) {
                input = input.substr(0, 10);
            }
            let formattedNumber = input;
            if (input.length > 2) {
                formattedNumber = input.substr(0, 3) + (input.length > 3 ? '-' : '') + input.substr(3);
            }
            if (input.length > 5) {
                formattedNumber = input.substr(0, 3) + '-' + input.substr(3, 3) + (input.length > 6 ? '-' : '') + input.substr(6);
            }
            inputElement.value = formattedNumber;
        });
    }

    // Capitalize first letter helper
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    // Auto-capitalize names
    [firstNameInput, lastNameInput].forEach(input => {
        if (input) {
            input.addEventListener('blur', (event) => {
                const inputElement = event.target;
                if (inputElement.value) {
                    inputElement.value = capitalizeFirstLetter(inputElement.value);
                }
            });
        }
    });

    // Open popup when button clicked
    addListingButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            popupOverlay.classList.add('active');
            // Focus on first input after animation
            setTimeout(() => firstNameInput.focus(), 300);
        });
    });

    // Close popup
    const closePopup = () => {
        popupOverlay.classList.remove('active');
        form.reset();
    };

    closeBtn.addEventListener('click', closePopup);

    // Close when clicking overlay (not popup itself)
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closePopup();
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const boatCount = boatCountInput.value;
        const boatTypes = boatTypesInput.value.trim();
        const location = locationInput.value.trim();
        const additional = additionalInput.value.trim();

        // Prepare form data
        const formData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            boat_count: parseInt(boatCount),
            boat_types: boatTypes,
            location: location,
            additional_info: additional
        };

        // Disable submit button while processing
        const submitBtn = form.querySelector('.boat-popup-submit');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // POST request to endpoint
            const response = await fetch('ENDPOINT_URL_HERE', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit form');
            }

            // Success - close popup and show confirmation
            alert('Thank you for your interest! We will be in touch soon.');
            closePopup();

        } catch (error) {
            console.error('Error submitting boat rental interest form:', error);
            alert('There was an error submitting your request. Please try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
});

