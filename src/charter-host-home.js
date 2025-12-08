
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




// Charter Host Home - Adapted from host-home.js

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


// Hero Image Loader
document.addEventListener('DOMContentLoaded', async () => {
    const heroImageElement = document.querySelector('[data-element="charter_becomeAHostHeroImage"]');
    const loaderElement = document.querySelector('[data-element="loader"]');

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
                heroImageElement.alt = data.image.name || 'Fishing charter hero image';
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


// Fishing Charter Interest Popup Feature
document.addEventListener('DOMContentLoaded', () => {
    const addListingButtons = document.querySelectorAll('[data-element="charter_addListing_Button"]');

    if (!addListingButtons || addListingButtons.length === 0) return;

    // Add popup styles
    const style = document.createElement('style');
    style.textContent = `
        .charter-popup-overlay {
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
        
        .charter-popup-overlay.active {
            display: flex;
        }
        
        .charter-popup {
            background: white;
            border-radius: 5px;
            padding: 32px;
            max-width: 700px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: charterPopupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes charterPopupSlideIn {
            0% {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .charter-popup-close {
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
        
        .charter-popup-close:hover {
            background: #e0e0e0;
            color: #000;
            transform: rotate(90deg);
        }
        
        .charter-popup h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #000;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup p {
            margin: 0 0 24px 0;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .charter-popup-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup-row {
            display: flex;
            gap: 16px;
        }
        
        .charter-popup-row .charter-popup-field {
            flex: 1;
        }
        
        @media (max-width: 600px) {
            .charter-popup-row {
                flex-direction: column;
                gap: 12px;
            }
            
            .charter-popup {
                padding: 20px;
                max-height: 85vh;
            }
            
            .charter-popup h2 {
                font-size: 20px;
            }
            
            .charter-popup p {
                font-size: 14px;
                margin-bottom: 16px;
            }
            
            .charter-popup-form {
                gap: 12px;
            }
            
            .charter-popup-section {
                padding: 12px;
            }
            
            .charter-popup-section-title {
                margin-bottom: 12px;
                font-size: 13px;
            }
            
            .charter-popup-field label {
                font-size: 14px;
            }
            
            .charter-popup-field input,
            .charter-popup-field textarea {
                padding: 10px 12px;
                font-size: 14px;
            }
            
            .charter-popup-field textarea {
                min-height: 60px;
            }
            
            .charter-popup-submit {
                padding: 12px 20px;
                font-size: 14px;
            }
        }
        
        .charter-popup-field label {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup-field input,
        .charter-popup-field select,
        .charter-popup-field textarea {
            padding: 12px 16px;
            border: 2px solid #e2e2e2;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s ease;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup-field textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .charter-popup-field input:focus,
        .charter-popup-field select:focus,
        .charter-popup-field textarea:focus {
            outline: none;
            border-color: #1a6b3d;
            box-shadow: 0 0 0 3px rgba(26, 107, 61, 0.1);
        }
        
        .charter-popup-submit {
            padding: 14px 24px;
            background: linear-gradient(135deg, #1a6b3d 0%, #0d4a2a 100%);
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
        
        .charter-popup-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(26, 107, 61, 0.4);
        }
        
        .charter-popup-submit:active {
            transform: translateY(0);
        }
        
        .charter-popup-field small {
            color: #999;
            font-size: 12px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .charter-popup-section {
            padding: 16px;
            background: #f0f7f3;
            border-radius: 8px;
            border: 1px solid #d0e8d8;
        }
        
        .charter-popup-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #1a6b3d;
            margin-bottom: 16px;
            font-family: 'TT Fors', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .charter-popup-section-title svg {
            width: 20px;
            height: 20px;
        }
    `;
    document.head.appendChild(style);

    // Create popup HTML
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'charter-popup-overlay';
    popupOverlay.innerHTML = `
        <div class="charter-popup">
            <button class="charter-popup-close" type="button">×</button>
            <h2>Join Keys Booking - Fishing Charters</h2>
            <p>Interested in listing your fishing charter with us? Fill out this form and our team will reach out to discuss partnership opportunities.</p>
            <form class="charter-popup-form">
                <div class="charter-popup-section">
                    <div class="charter-popup-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#1a6b3d"/>
                        </svg>
                        Contact Information
                    </div>
                    <div class="charter-popup-row">
                        <div class="charter-popup-field">
                            <label for="charter-first-name">First Name *</label>
                            <input 
                                type="text" 
                                id="charter-first-name" 
                                name="first-name" 
                                placeholder="John"
                                required
                            />
                        </div>
                        <div class="charter-popup-field">
                            <label for="charter-last-name">Last Name *</label>
                            <input 
                                type="text" 
                                id="charter-last-name" 
                                name="last-name" 
                                placeholder="Smith"
                                required
                            />
                        </div>
                    </div>
                    <div class="charter-popup-row" style="margin-top: 16px;">
                        <div class="charter-popup-field">
                            <label for="charter-email">Email *</label>
                            <input 
                                type="email" 
                                id="charter-email" 
                                name="email" 
                                placeholder="captain@example.com"
                                required
                            />
                        </div>
                        <div class="charter-popup-field">
                            <label for="charter-phone">Phone Number</label>
                            <input 
                                type="tel" 
                                id="charter-phone" 
                                name="phone" 
                                placeholder="(305) 123-4567"
                            />
                        </div>
                    </div>
                </div>
                
                <div class="charter-popup-section">
                    <div class="charter-popup-section-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C10.9 2 10 2.9 10 4C10 4.74 10.4 5.39 11 5.73V7H13V5.73C13.6 5.39 14 4.74 14 4C14 2.9 13.1 2 12 2ZM18.6 9.27L17.9 8.55L16.5 9.95L17.2 10.67C18.08 11.55 18.08 12.99 17.2 13.87L12.7 18.37C12.31 18.76 11.68 18.76 11.29 18.37L6.79 13.87C5.91 12.99 5.91 11.55 6.79 10.67L7.5 9.95L6.1 8.55L5.39 9.27C3.79 10.86 3.79 13.43 5.39 15.02L9.89 19.52C11.49 21.12 14.05 21.12 15.65 19.52L20.15 15.02C21.75 13.43 21.75 10.86 20.15 9.27H18.6Z" fill="#1a6b3d"/>
                            <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#1a6b3d"/>
                        </svg>
                        Charter Information
                    </div>
                    <div class="charter-popup-field">
                        <label for="charter-fleet-count">Fleet Size *</label>
                        <input 
                            type="number" 
                            id="charter-fleet-count" 
                            name="fleet-count" 
                            min="1" 
                            max="99"
                            placeholder="e.g., 2"
                            required
                        />
                        <small>How many boats in your fleet?</small>
                    </div>
                    <div class="charter-popup-field" style="margin-top: 16px;">
                        <label for="charter-location">Marina / Departure Location *</label>
                        <input 
                            type="text" 
                            id="charter-location" 
                            name="location" 
                            placeholder="e.g., Islamorada, Marathon, Key West"
                            required
                        />
                        <small>Where do your trips depart from?</small>
                    </div>
                    <div class="charter-popup-field" style="margin-top: 16px;">
                        <label for="charter-additional">Additional Information</label>
                        <textarea 
                            id="charter-additional" 
                            name="additional" 
                            placeholder="Tell us more about your charter: years of experience, specialties, boat details, certifications, or any questions..."
                        ></textarea>
                    </div>
                </div>
                
                <button type="submit" class="charter-popup-submit">
                    Submit Interest
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(popupOverlay);

    // Get references
    const popup = popupOverlay.querySelector('.charter-popup');
    const closeBtn = popupOverlay.querySelector('.charter-popup-close');
    const form = popupOverlay.querySelector('.charter-popup-form');
    const firstNameInput = document.getElementById('charter-first-name');
    const lastNameInput = document.getElementById('charter-last-name');
    const emailInput = document.getElementById('charter-email');
    const phoneInput = document.getElementById('charter-phone');
    const fleetCountInput = document.getElementById('charter-fleet-count');
    const locationInput = document.getElementById('charter-location');
    const additionalInput = document.getElementById('charter-additional');

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
        const fleetCount = fleetCountInput.value;
        const location = locationInput.value.trim();
        const additional = additionalInput.value.trim();

        // Prepare form data
        const formData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            fleet_count: parseInt(fleetCount),
            location: location,
            additional_info: additional
        };

        // Disable submit button while processing
        const submitBtn = form.querySelector('.charter-popup-submit');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // POST request to endpoint
            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/addFishingCharter_inquiry', {
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
            console.error('Error submitting fishing charter interest form:', error);
            alert('There was an error submitting your request. Please try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
});
