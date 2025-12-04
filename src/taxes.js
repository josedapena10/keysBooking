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


// Function to copy text to the clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

document.addEventListener('DOMContentLoaded', () => {
    // Select the email button
    const copyEmailButton = document.querySelector('[data-element="help_copyEmail"]');

    // Email to copy
    const email = 'support@keysbooking.com';

    // Add click event listener
    if (copyEmailButton) {
        copyEmailButton.addEventListener('click', () => {
            copyToClipboard(email);
            alert('Email copied to clipboard!');
        });
    }
});


// Initialize Wized and get host ID
window.Wized = window.Wized || [];
window.Wized.push((async (Wized) => {
    // Set both sections to none initially
    const enterW9Element = document.getElementById('taxes_enterW9');
    const userW9Element = document.getElementById('taxes_userW9');
    if (enterW9Element) enterW9Element.style.display = 'none';
    if (userW9Element) userW9Element.style.display = 'none';

    await Wized.requests.waitFor('Load_user');
    const hostId = Wized.data.r.Load_user.data.id;

    // Store the W9 record ID globally for later use in updates
    window.userW9RecordId = null;
    // Store user's W9 data globally for pre-populating edit form
    window.userW9Data = null;
    window.userW9Last4TaxID = null;

    // Check if user has already submitted W9
    try {
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/user_taxes?user_id=${hostId}`);
        const data = await response.json();

        // Show appropriate section based on whether user has submitted W9
        if (data.result1 && data.result1.length > 0) {
            // User has submitted W9, show userW9 section
            if (enterW9Element) enterW9Element.style.display = 'none';
            if (userW9Element) userW9Element.style.display = 'flex';

            // Display user's W9 information
            const userW9Data = data.result1[0]; // Get the first W9 record
            // Store W9 data globally for edit functionality
            window.userW9Data = userW9Data;
            window.userW9Last4TaxID = data.last4taxID;

            const nameElement = document.querySelector('[data-element="taxes_userW9_name"]');
            const taxIDElement = document.querySelector('[data-element="taxes_userW9_taxID"]');

            if (nameElement && userW9Data.name) {
                nameElement.textContent = userW9Data.name;
            }

            if (taxIDElement && data.last4taxID) {
                // Use the last4taxID from the response
                const maskedTaxID = `${userW9Data.taxID_type}: *****${data.last4taxID}`;
                taxIDElement.textContent = maskedTaxID;
            }

            // Set up edit button functionality
            const editButton = document.querySelector('[data-element="taxes_userW9_editButton"]');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    const taxModal = document.getElementById('tax-modal');
                    if (taxModal) {
                        taxModal.style.display = 'flex';
                        document.body.classList.add('no-scroll');

                        // Pre-populate form fields with existing data
                        if (window.userW9Data) {
                            const w9Data = window.userW9Data;

                            // Populate name
                            const nameInput = document.getElementById('w9_name');
                            if (nameInput && w9Data.name) {
                                nameInput.value = w9Data.name;
                            }

                            // Populate DBA (disregarded entity name)
                            const dbaInput = document.getElementById('w9_dba');
                            if (dbaInput && w9Data.disregardedEntityName) {
                                dbaInput.value = w9Data.disregardedEntityName;
                            }

                            // Populate classification dropdown
                            const classificationSelect = document.getElementById('w9_classification');
                            if (classificationSelect && w9Data.taxClassification) {
                                classificationSelect.value = w9Data.taxClassification;
                                classificationSelect.classList.remove('placeholder');
                            }

                            // Set tax ID type toggle (SSN/EIN)
                            const ssnToggle = document.getElementById('w9_ssn_toggle');
                            const einToggle = document.getElementById('w9_ein_toggle');
                            const taxIdInput = document.getElementById('w9_taxId');

                            if (ssnToggle && einToggle && w9Data.taxID_type) {
                                if (w9Data.taxID_type === 'SSN') {
                                    ssnToggle.classList.add('clicked');
                                    einToggle.classList.remove('clicked');
                                    if (taxIdInput) taxIdInput.placeholder = 'SSN';
                                } else if (w9Data.taxID_type === 'EIN') {
                                    einToggle.classList.add('clicked');
                                    ssnToggle.classList.remove('clicked');
                                    if (taxIdInput) taxIdInput.placeholder = 'EIN';
                                }
                            }

                            // Show masked tax ID - clears on click
                            if (taxIdInput && window.userW9Last4TaxID) {
                                taxIdInput.value = `*****${window.userW9Last4TaxID}`;
                                taxIdInput.dataset.isMasked = 'true';

                                // Clear the masked value on click/focus
                                const clearMaskedTaxId = () => {
                                    if (taxIdInput.dataset.isMasked === 'true') {
                                        taxIdInput.value = '';
                                        taxIdInput.dataset.isMasked = 'false';
                                    }
                                };
                                taxIdInput.addEventListener('click', clearMaskedTaxId, { once: true });
                                taxIdInput.addEventListener('focus', clearMaskedTaxId, { once: true });
                            }

                            // Populate address fields
                            const addressStreet = document.getElementById('w9_address_street');
                            if (addressStreet && w9Data.address_street) {
                                addressStreet.value = w9Data.address_street;
                            }

                            const addressUnit = document.getElementById('w9_address_unit');
                            if (addressUnit && w9Data.address_unit) {
                                addressUnit.value = w9Data.address_unit;
                            }

                            const addressCity = document.getElementById('w9_address_city');
                            if (addressCity && w9Data.address_city) {
                                addressCity.value = w9Data.address_city;
                            }

                            const addressState = document.getElementById('w9_address_state');
                            if (addressState && w9Data.address_state) {
                                addressState.value = w9Data.address_state;
                            }

                            const addressZipcode = document.getElementById('w9_address_zipcode');
                            if (addressZipcode && w9Data.address_zipcode) {
                                addressZipcode.value = w9Data.address_zipcode;
                            }

                            // Keep date as today's date (already set by DOMContentLoaded)
                            // Re-set it to ensure it's today's date
                            const signedDate = document.getElementById('w9_signedDate');
                            if (signedDate) {
                                const today = new Date();
                                const month = String(today.getMonth() + 1).padStart(2, '0');
                                const day = String(today.getDate()).padStart(2, '0');
                                const year = today.getFullYear();
                                signedDate.value = `${month}-${day}-${year}`;
                            }

                            // Clear signature - user must re-sign
                            const signedText = document.getElementById('w9_signedText');
                            if (signedText) {
                                signedText.value = '';
                            }
                        }
                    }
                });
            }
        } else {
            // User has not submitted W9, show enterW9 section
            if (enterW9Element) enterW9Element.style.display = 'flex';
            if (userW9Element) userW9Element.style.display = 'none';
        }
    } catch (error) {
        window.location.href = '/404';
        console.error('Error checking W9 status:', error);
        // Default to showing enterW9 on error
        if (enterW9Element) enterW9Element.style.display = 'flex';
        if (userW9Element) userW9Element.style.display = 'none';
    }
}));

document.addEventListener('DOMContentLoaded', () => {
    // Get error text element
    const errorText = document.querySelector('[data-element="taxForm_errorText"]');

    // Set up name field with placeholder
    const nameInput = document.getElementById('w9_name');
    if (nameInput) {
        nameInput.placeholder = 'Taxpayer or business name';
        nameInput.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    // Set up DBA field with placeholder
    const dbaInput = document.getElementById('w9_dba');
    if (dbaInput) {
        dbaInput.placeholder = 'Disregarded entity name (optional)';
    }

    // Convert classification div to dropdown
    const classificationDiv = document.getElementById('w9_classification');
    if (classificationDiv) {
        // Create select element
        const selectElement = document.createElement('select');
        selectElement.id = 'w9_classification';
        selectElement.name = 'w9_classification';

        // Apply styles to the dropdown
        selectElement.style.height = '50px';
        selectElement.style.paddingLeft = '17px';
        selectElement.style.paddingRight = '17px';
        selectElement.style.borderRadius = '5px';
        selectElement.style.border = '1px solid #e2e2e2';
        selectElement.style.fontFamily = 'TT Fors';
        selectElement.style.fontSize = '16px';
        selectElement.style.fontWeight = '400';
        selectElement.style.color = '#000000';
        selectElement.style.appearance = 'none'; // Remove default dropdown icon
        selectElement.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg fill=\'black\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z\'/></svg>")';
        selectElement.style.backgroundPosition = 'calc(100% - 17px) center'; // Position icon 17px from right
        selectElement.style.backgroundRepeat = 'no-repeat';
        selectElement.style.backgroundSize = '24px';

        // Add placeholder option with CSS class instead of inline style
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.text = 'Tax Classification';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        selectElement.appendChild(placeholderOption);

        // Create and add a style element for the placeholder color
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            #w9_classification {
                color: #000000;
            }
            #w9_classification option[value=""] {
                color: #999999;
            }
            #w9_classification option:not([value=""]) {
                color: #000000;
            }
            /* Apply grey color to the select when showing placeholder */
            #w9_classification.placeholder {
                color: #999999;
            }
            .error-field {
                border: 1px solid red !important;
                background-color: #ffeeee !important;
            }
        `;
        document.head.appendChild(styleElement);

        // Add classification options
        const classifications = [
            'Individual / sole proprietership',
            'LLC',
            'Partnership',
            'S corporation',
            'C corporation',
            'Trust / estate',
            'Other'
        ];

        classifications.forEach(classification => {
            const option = document.createElement('option');
            option.value = classification;
            option.text = classification;
            selectElement.appendChild(option);
        });

        // Add class to show placeholder in grey initially
        selectElement.classList.add('placeholder');

        // Add event listener to change color when selection changes
        selectElement.addEventListener('change', function () {
            if (this.value === '') {
                this.classList.add('placeholder');
            } else {
                this.classList.remove('placeholder');
                this.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });

        // Replace the div with the select element
        classificationDiv.parentNode.replaceChild(selectElement, classificationDiv);
    }

    // Set up tax ID type toggle (SSN/EIN)
    const ssnToggle = document.getElementById('w9_ssn_toggle');
    const einToggle = document.getElementById('w9_ein_toggle');
    const taxIdInput = document.getElementById('w9_taxId');

    if (ssnToggle && einToggle && taxIdInput) {
        // Set SSN as default
        ssnToggle.classList.add('clicked');
        taxIdInput.placeholder = 'SSN';

        // Only allow numbers in the tax ID input
        taxIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });

        // Add keypress event to prevent non-numeric input
        taxIdInput.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Add click handlers for toggles
        ssnToggle.addEventListener('click', () => {
            ssnToggle.classList.add('clicked');
            einToggle.classList.remove('clicked');
            taxIdInput.placeholder = 'SSN';
        });

        einToggle.addEventListener('click', () => {
            einToggle.classList.add('clicked');
            ssnToggle.classList.remove('clicked');
            taxIdInput.placeholder = 'EIN';
        });
    }

    // Set up address fields with placeholders
    const addressStreet = document.getElementById('w9_address_street');
    if (addressStreet) {
        addressStreet.placeholder = 'Street address';
        addressStreet.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    const addressUnit = document.getElementById('w9_address_unit');
    if (addressUnit) {
        addressUnit.placeholder = 'Apt, suite, etc. (if applicable)';
    }

    const addressCity = document.getElementById('w9_address_city');
    if (addressCity) {
        addressCity.placeholder = 'City';
        addressCity.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    const addressState = document.getElementById('w9_address_state');
    if (addressState) {
        addressState.placeholder = 'State';
        addressState.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    const addressZipcode = document.getElementById('w9_address_zipcode');
    if (addressZipcode) {
        addressZipcode.placeholder = 'Zipcode';
        addressZipcode.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    // Set country to US and make it non-editable
    const addressCountry = document.getElementById('w9_address_country');
    if (addressCountry) {
        addressCountry.value = 'US';
        addressCountry.readOnly = true;
    }

    // Set up signature section
    const signedDate = document.getElementById('w9_signedDate');
    if (signedDate) {
        // Get current date in MM-DD-YYYY format
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${month}-${day}-${year}`;

        signedDate.value = formattedDate;
        signedDate.readOnly = true; // Make the date field non-editable
    }

    const signedText = document.getElementById('w9_signedText');
    if (signedText) {
        signedText.placeholder = 'Your signature';
        signedText.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.classList.remove('error-field');
            }
            if (errorText) errorText.style.display = 'none';
        });
    }

    // Set up form submission
    const submitButton = document.getElementById('w9_submit');
    const submitLoader = document.getElementById('w9_submit_loader');
    const submitText = document.getElementById('w9_submit_text');

    if (submitButton) {
        // Initially hide the loader and error text
        if (submitLoader) {
            submitLoader.style.display = 'none';
            submitLoader.style.visibility = 'hidden';
            submitLoader.style.opacity = '0';
        }
        if (errorText) {
            errorText.style.display = 'none';
        }

        submitButton.addEventListener('click', async () => {
            // Ensure text is visible at the start and hide error
            if (submitLoader) submitLoader.style.display = 'none';
            if (submitText) submitText.style.display = 'block';
            if (errorText) errorText.style.display = 'none';

            // Validate form
            let isValid = true;
            const requiredFields = [
                { element: nameInput, name: 'name' },
                { element: document.getElementById('w9_classification'), name: 'classification' },
                { element: taxIdInput, name: 'taxId' },
                { element: addressStreet, name: 'street' },
                { element: addressCity, name: 'city' },
                { element: addressState, name: 'state' },
                { element: addressZipcode, name: 'zipcode' },
                { element: signedText, name: 'signature' }
            ];

            // Check each required field
            const missingFields = [];
            requiredFields.forEach(field => {
                if (!field.element || !field.element.value) {
                    isValid = false;
                    if (field.element) {
                        field.element.classList.add('error-field');
                    }
                    missingFields.push(field.name);
                }
            });

            // Validate tax ID is exactly 9 digits
            if (taxIdInput && taxIdInput.value && (taxIdInput.value.length !== 9)) {
                isValid = false;
                taxIdInput.classList.add('error-field');
                if (errorText) {
                    errorText.textContent = 'Tax ID must be exactly 9 digits.';
                    errorText.style.display = 'flex';
                }
                return;
            }

            if (!isValid) {
                if (errorText) {
                    errorText.textContent = 'Please fill in all required fields.';
                    errorText.style.display = 'flex';
                }
                return;
            }

            // Show loader, hide text
            if (submitLoader) {
                submitLoader.style.display = 'flex';
                submitLoader.style.visibility = 'visible'; // Ensure visibility is set
                submitLoader.style.opacity = '1'; // Ensure opacity is set
            }

            if (submitText) submitText.style.display = 'none';

            try {
                // Get user ID from Wized
                await window.Wized.requests.waitFor('Load_user');
                const userId = window.Wized.data.r.Load_user.data.id;

                // Determine tax ID type
                const taxIdType = ssnToggle.classList.contains('clicked') ? 'SSN' : 'EIN';

                // Prepare form data
                const formData = {
                    user_id: userId,
                    name: nameInput.value,
                    disregardedEntityName: dbaInput.value,
                    taxClassification: document.getElementById('w9_classification').value,
                    taxID_type: taxIdType,
                    taxID_number: taxIdInput.value,
                    address_street: addressStreet.value,
                    address_unit: addressUnit.value,
                    address_city: addressCity.value,
                    address_state: addressState.value,
                    address_zipcode: addressZipcode.value,
                    signature_date: signedDate.value,
                    signature_text: signedText.value
                };

                let response;
                let responseData;

                // Create new record
                response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/user_taxes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                responseData = await response.json();

                // Store the new record ID
                if (responseData && responseData.id) {
                    window.userW9RecordId = responseData.id;
                }

                if (!response.ok) {
                    if (errorText) {
                        errorText.textContent = `Failed to submit form: ${response.status} ${response.statusText}`;
                        errorText.style.display = 'flex';
                    }
                    throw new Error('Failed to submit form');
                }

                // Close modal on success
                const taxModal = document.getElementById('tax-modal');
                if (taxModal) {
                    taxModal.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                }

                // Update the display to show userW9 instead of enterW9
                const enterW9Element = document.getElementById('taxes_enterW9');
                const userW9Element = document.getElementById('taxes_userW9');
                if (enterW9Element) enterW9Element.style.display = 'none';
                if (userW9Element) userW9Element.style.display = 'flex';

                // Update the displayed W9 information with the submitted data
                const nameElement = document.querySelector('[data-element="taxes_userW9_name"]');
                const taxIDElement = document.querySelector('[data-element="taxes_userW9_taxID"]');

                if (nameElement) {
                    nameElement.textContent = formData.name;
                }

                if (taxIDElement) {
                    // Get the actual last 4 digits of the submitted tax ID
                    const last4Digits = formData.taxID_number.slice(-4);
                    const maskedTaxID = `${formData.taxID_type}: *****${last4Digits}`;
                    taxIDElement.textContent = maskedTaxID;
                }

                // Update the global W9 data with the new submitted data for future edits
                window.userW9Data = {
                    name: formData.name,
                    disregardedEntityName: formData.disregardedEntityName,
                    taxClassification: formData.taxClassification,
                    taxID_type: formData.taxID_type,
                    address_street: formData.address_street,
                    address_unit: formData.address_unit,
                    address_city: formData.address_city,
                    address_state: formData.address_state,
                    address_zipcode: formData.address_zipcode
                };
                window.userW9Last4TaxID = formData.taxID_number.slice(-4);


            } catch (error) {
                console.error('Error submitting form:', error);
                if (errorText) {
                    errorText.textContent = error.message || 'An unexpected error occurred. Please try again.';
                    errorText.style.display = 'flex';
                }
            } finally {
                // Reset loader and text
                if (submitLoader) {
                    submitLoader.style.display = 'none';
                }
                if (submitText) submitText.style.display = 'block';
            }
        });
    }
});
