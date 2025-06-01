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
    // Get toggle buttons
    const paymentsToggle = document.querySelector('[data-element="paymentPayoutToggle_payments"]');
    const payoutsToggle = document.querySelector('[data-element="paymentPayoutToggle_payouts"]');

    // Get content blocks
    const paymentsBlock = document.querySelector('[data-element="paymentPayout_paymentsBlock"]');
    const payoutsBlock = document.querySelector('[data-element="paymentPayout_payoutsBlock"]');

    // Hide both blocks immediately to prevent flash
    if (paymentsBlock) paymentsBlock.style.display = 'none';
    if (payoutsBlock) payoutsBlock.style.display = 'none';

    // Check URL parameters for section
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    const showPayouts = sectionParam === 'payouts';
    const showPayments = sectionParam === 'payments' || (!showPayouts);

    // Set initial state based on URL parameters
    if (showPayouts) {
        payoutsToggle.classList.add('clicked');
        paymentsToggle.classList.remove('clicked');
        payoutsBlock.style.display = 'flex';
    } else {
        paymentsToggle.classList.add('clicked');
        payoutsToggle.classList.remove('clicked');
        paymentsBlock.style.display = 'flex';
    }

    // Add click handlers
    paymentsToggle.addEventListener('click', () => {
        // Update toggle buttons
        paymentsToggle.classList.add('clicked');
        payoutsToggle.classList.remove('clicked');

        // Show/hide content blocks
        paymentsBlock.style.display = 'flex';
        payoutsBlock.style.display = 'none';
    });

    payoutsToggle.addEventListener('click', () => {
        // Update toggle buttons
        payoutsToggle.classList.add('clicked');
        paymentsToggle.classList.remove('clicked');

        // Show/hide content blocks
        payoutsBlock.style.display = 'flex';
        paymentsBlock.style.display = 'none';
    });
});

// Initialize with Wized
window.Wized = window.Wized || [];
window.Wized.push((async (Wized) => {
    try {
        await Wized.requests.waitFor('Load_user');
        const userId = Wized.data.r.Load_user.data.id;
        handlePayments(userId);
    } catch (error) {
        console.error('Error getting user ID:', error);
    }
}));

// Function to handle user payouts display
function handleUserPayouts(payouts) {
    const payoutsBlock = document.querySelector('[data-element="payoutsBlock"]');
    const noPayoutsBlock = document.querySelector('[data-element="noPayoutsBlock"]');
    const connectedAccountBlockTemplate = document.querySelector('[data-element="payoutsBlock_connectedAccountBlock"]');
    const connectedAccountContainer = connectedAccountBlockTemplate?.parentElement;
    const errorText = document.querySelector('[data-element="payoutsBlock_errorText"]');
    const subText = document.querySelector('[data-element="payoutsBlock_subText"]');
    const addPayoutMethodButton = document.querySelector('[data-element="payoutsBlock_connectedAccountBlock_addPayoutMethodButton"]');
    const addPayoutMethodLoader = document.querySelector('[data-element="addPayoutMethod_Loader"]');
    const addPayoutMethodText = document.querySelector('[data-element="addPayoutMethod_text"]');

    // Hide loader initially, show text
    if (addPayoutMethodLoader) {
        addPayoutMethodLoader.style.display = 'none';
    }
    if (addPayoutMethodText) {
        addPayoutMethodText.style.display = 'block';
    }

    if (!payouts || payouts.length === 0) {
        // If no payouts, hide payouts block and show no payouts message
        payoutsBlock.style.display = 'none';
        noPayoutsBlock.style.display = 'flex';
        if (connectedAccountBlockTemplate) {
            connectedAccountBlockTemplate.style.display = 'none';
        }
        errorText.style.display = 'none';
        subText.style.display = 'flex';
        if (addPayoutMethodButton) {
            addPayoutMethodButton.style.display = 'flex';
        }
    } else {
        // If there are payouts, show payouts block and hide no payouts message
        payoutsBlock.style.display = 'flex';
        noPayoutsBlock.style.display = 'none';

        // Get unique non-null connect account IDs
        const uniqueConnectAccounts = [...new Set(
            payouts
                .filter(payout => payout.connect_account_id !== null)
                .map(payout => payout.connect_account_id)
        )];

        // Check if any payout has connected account
        const hasConnectedAccount = uniqueConnectAccounts.length > 0;
        const hasUnconnectedAccount = payouts.some(payout => payout.connect_account_id === null);

        // Handle add payout method button visibility
        if (addPayoutMethodButton) {
            addPayoutMethodButton.style.display = hasConnectedAccount ? 'none' : 'flex';
        }

        if (hasConnectedAccount && hasUnconnectedAccount) {
            // Get names of unconnected properties
            const unconnectedProperties = payouts
                .filter(payout => payout.connect_account_id === null)
                .map(payout => payout._user_property.property_name);

            // Show error text with unconnected property names
            errorText.textContent = `Please link ${unconnectedProperties.join(', ')} to your payout method. To edit click the edit button below.`;
            errorText.style.display = 'flex';
            subText.style.display = 'none';
        } else {
            errorText.style.display = 'none';
            subText.style.display = 'flex';
        }

        // Handle connected account blocks
        if (connectedAccountBlockTemplate && connectedAccountContainer) {
            // Hide template initially
            connectedAccountBlockTemplate.style.display = 'none';

            if (!hasConnectedAccount) {
                // If no connected accounts, hide the template block
                connectedAccountBlockTemplate.style.display = 'none';
            } else {
                // Create and display blocks for each unique connect account
                uniqueConnectAccounts.forEach((connectAccountId, index) => {
                    let currentBlock;
                    if (index === 0) {
                        // Use existing template for first account
                        currentBlock = connectedAccountBlockTemplate;
                        currentBlock.style.display = 'flex';
                    } else {
                        // Clone template for additional accounts
                        currentBlock = connectedAccountBlockTemplate.cloneNode(true);
                        connectedAccountContainer.appendChild(currentBlock);
                        currentBlock.style.display = 'flex';
                    }
                    currentBlock.setAttribute('data-connect-account', connectAccountId);

                    // Get all properties linked to this connect account
                    const linkedProperties = payouts
                        .filter(payout => payout.connect_account_id !== null && payout.connect_account_id === connectAccountId)
                        .map(payout => payout._user_property.property_name);

                    // Get the first payout for this connect account to display details
                    const payout = payouts.find(p => p.connect_account_id !== null && p.connect_account_id === connectAccountId);

                    // Find and update the linked listings element
                    const linkedListingsElement = currentBlock.querySelector('[data-element="payoutsBlock_connectedAccountBlock_linkedListing"]');
                    if (linkedListingsElement) {
                        // Check if requirements are due or payout is not connected
                        if ((payout && payout.requirement_currentlyDue !== null && payout.requirement_currentlyDue.length > 0) ||
                            (payout && payout.requirement_pastDue !== null && payout.requirement_pastDue.length > 0) ||
                            (payout && payout.payout_connected === false)) {
                            linkedListingsElement.textContent = "Update your payout method to receive payments.";
                            linkedListingsElement.style.color = "#ff4d4d"; // Optional: make it red to highlight
                        } else {
                            const prefix = linkedProperties.length > 1 ? 'Linked Listings: ' : 'Linked Listing: ';
                            linkedListingsElement.textContent = prefix + linkedProperties.join(', ');
                            linkedListingsElement.style.color = ""; // Reset color if previously set
                        }
                    }

                    if (payout) {
                        // Update method type
                        const methodTypeElement = currentBlock.querySelector('[data-element="payoutsBlock_connectedAccountBlock_methodType"]');
                        if (methodTypeElement && payout.method_type) {
                            if (payout.method_type === "bank_account") {
                                methodTypeElement.textContent = "Bank Account";
                            } else if (payout.method_type === "card") {
                                methodTypeElement.textContent = "Debit Card";
                            }
                        }

                        // Update account details
                        const detailsElement = currentBlock.querySelector('[data-element="payoutsBlock_connectedAccountBlock_details"]');
                        if (detailsElement) {
                            // Check if we have the necessary data
                            if (payout.bank_name && payout.last4) {
                                // Use business name if available, otherwise use first and last name
                                let accountName = payout.business_name;
                                if (!accountName && payout._user_payouts) {
                                    accountName = `${payout._user_payouts.First_Name} ${payout._user_payouts.Last_Name}`;
                                }

                                // Format the details string if accountName exists
                                if (accountName) {
                                    const details = `${accountName}, ${payout.bank_name} ****${payout.last4}`;
                                    detailsElement.textContent = details;
                                } else {
                                    // Just show bank info if no account name
                                    detailsElement.textContent = `${payout.bank_name} ****${payout.last4}`;
                                }
                            } else {
                                // If no data found, show empty text
                                detailsElement.textContent = " ";
                            }
                        }
                    }

                    // Add click handler for the edit button
                    const editButton = currentBlock.querySelector('[data-element="payoutsBlock_connectedAccountBlock_editButton"]');
                    if (editButton && payout) {
                        editButton.addEventListener('click', async () => {
                            try {
                                // Show loader if it exists
                                const editButtonLoader = currentBlock.querySelector('[data-element="editButton_Loader"]');
                                const editButtonText = currentBlock.querySelector('[data-element="editButton_text"]');

                                if (editButtonLoader) {
                                    editButtonLoader.style.display = 'flex';
                                }
                                if (editButtonText) {
                                    editButtonText.style.display = 'none';
                                }

                                // Make API request to get account login link
                                const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:FNhKS6jt/account_login', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        account_id: payout.connect_account_id
                                    })
                                });

                                if (!response.ok) {
                                    throw new Error('Failed to get account login link');
                                }

                                const data = await response.json();

                                // Get the redirect URL from the response
                                const redirectUrl = data.response.result.url;

                                // Open the Stripe account link in a new tab
                                if (redirectUrl) {
                                    window.open(redirectUrl, '_blank');
                                } else {
                                    throw new Error('No redirect URL found in response');
                                }

                                // Reset button state before opening new tab
                                if (editButtonLoader) {
                                    editButtonLoader.style.display = 'none';
                                }
                                if (editButtonText) {
                                    editButtonText.style.display = 'block';
                                }

                            } catch (error) {
                                console.error('Error getting account login link:', error);

                                // Hide loader, show text on error
                                const editButtonLoader = currentBlock.querySelector('[data-element="editButton_Loader"]');
                                const editButtonText = currentBlock.querySelector('[data-element="editButton_text"]');

                                if (editButtonLoader) {
                                    editButtonLoader.style.display = 'none';
                                }
                                if (editButtonText) {
                                    editButtonText.style.display = 'block';
                                }
                            }
                        });
                    }
                });
            }
        }
    }

    // Add click handler for the add payout method button
    if (addPayoutMethodButton) {
        addPayoutMethodButton.addEventListener('click', async () => {
            try {
                // Show loader, hide text
                if (addPayoutMethodLoader) {
                    addPayoutMethodLoader.style.display = 'flex';
                }
                if (addPayoutMethodText) {
                    addPayoutMethodText.style.display = 'none';
                }

                // Get user ID from Wized
                await Wized.requests.waitFor('Load_user');
                const userId = Wized.data.r.Load_user.data.id;

                // Make API request to add account
                const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:FNhKS6jt/add_account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to add payout method');
                }

                const data = await response.json();

                // Get the redirect URL from the response
                const redirectUrl = data.account_links.response.result.url;

                // Redirect the user to the Stripe account link
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    throw new Error('No redirect URL found in response');
                }
            } catch (error) {
                console.error('Error adding payout method:', error);

                // Hide loader, show text on error
                if (addPayoutMethodLoader) {
                    addPayoutMethodLoader.style.display = 'none';
                }
                if (addPayoutMethodText) {
                    addPayoutMethodText.style.display = 'block';
                }
            }
        });
    }
}

// Function to handle payments data
async function handlePayments(userId) {
    // Find the loader element
    const loader = document.querySelector('[data-element="loader"]');

    // Hide all elements initially to prevent flash
    const elementsToHide = [
        // Payments elements
        '[data-element="paymentsBlock"]',
        '[data-element="noPaymentsBlock"]',
        '[data-element="paymentBlockHeader"]',
        '[data-element="paymentsBlock_container"]',

        // Payouts elements
        '[data-element="payoutsBlock"]',
        '[data-element="noPayoutsBlock"]',
        '[data-element="payoutsBlock_errorText"]',
        '[data-element="payoutsBlock_subText"]',
        '[data-element="payoutsBlock_connectedAccountBlock"]',
        '[data-element="addPayoutMethod_Loader"]'
    ];

    // Hide all elements
    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    });

    // Show loader before request starts
    if (loader) {
        loader.style.display = 'flex';
    }

    try {
        // Get payments and payouts data
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/payments_payouts?user_id=${userId}`);
        const data = await response.json();

        // Handle user payments and payouts - await both operations
        await Promise.all([
            // Convert these functions to return promises
            Promise.resolve(handleUserPayments(data.user_payments)),
            Promise.resolve(handleUserPayouts(data.user_payouts))
        ]);

        // Add a small delay to ensure DOM updates are complete
        await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
        window.location.href = '/404';
        //console.error('Error fetching payments:', error);
    }

    // Move loader hiding outside the try/catch block
    // so it only hides after ALL processing is complete
    if (loader) {
        loader.style.display = 'none';
    }
}



// Function to handle user payments display
function handleUserPayments(payments) {
    const paymentsBlockTemplate = document.querySelector('[data-element="paymentsBlock"]');
    const paymentsContainer = document.querySelector('[data-element="paymentsBlock_container"]');
    const noPaymentsBlock = document.querySelector('[data-element="noPaymentsBlock"]');
    const paymentBlockHeader = document.querySelector('[data-element="paymentBlockHeader"]');

    // Hide template block initially
    paymentsBlockTemplate.style.display = 'none';
    if (paymentsContainer) {
        paymentsContainer.style.display = 'none';
    }

    if (payments && payments.length > 0) {
        // Hide no payments message and show header and container
        noPaymentsBlock.style.display = 'none';
        if (paymentBlockHeader) {
            paymentBlockHeader.style.display = 'flex';
        }
        if (paymentsContainer) {
            paymentsContainer.style.display = 'flex';
        }

        // Create and append payment blocks
        payments.forEach((payment, index) => {
            let currentBlock;
            if (index === 0) {
                // Use the existing template for first item
                currentBlock = paymentsBlockTemplate;
                currentBlock.style.display = 'flex';
            } else {
                // Clone template for additional items
                currentBlock = paymentsBlockTemplate.cloneNode(true);
                if (paymentsContainer) {
                    paymentsContainer.appendChild(currentBlock);
                } else {
                    paymentsBlockTemplate.parentElement.appendChild(currentBlock);
                }
            }

            populatePaymentBlock(currentBlock, payment);
        });
    } else {
        // If no payments, hide the template block, header, container and show no payments message
        paymentsBlockTemplate.style.display = 'none';
        noPaymentsBlock.style.display = 'flex';
        if (paymentBlockHeader) {
            paymentBlockHeader.style.display = 'none';
        }
        if (paymentsContainer) {
            paymentsContainer.style.display = 'none';
        }
    }
}

// Function to populate individual payment block
function populatePaymentBlock(block, payment) {
    // Set payment image
    const imageBlock = block.querySelector('[data-element="paymentsBlock_image"]');
    if (imageBlock) {
        imageBlock.src = payment._property_main_image.property_image.url;
    }

    // Set payment status
    const statusBlock = block.querySelector('[data-element="paymentsBlock_paymentStatus"]');
    if (statusBlock) {
        // Display "Paid" if payment status is succeeded
        statusBlock.textContent = payment.payment_status === 'succeeded' ? 'Paid' : payment.payment_status;
    }

    // Set payment date
    const dateBlock = block.querySelector('[data-element="paymentsBlock_date"]');
    if (dateBlock) {
        const date = new Date(payment.created_at);
        dateBlock.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Set card info
    const cardBlock = block.querySelector('[data-element="paymentsBlock_card"]');
    if (cardBlock) {
        cardBlock.textContent = `${payment.card_type} ****${payment.card_last4}`;
    }

    // Set city and date range
    const cityDateBlock = block.querySelector('[data-element="paymentsBlock_cityDate"]');
    if (cityDateBlock) {
        const dateRange = formatDateRange(payment.check_in, payment.check_out);
        cityDateBlock.textContent = `${payment._property.listing_city} • ${dateRange}`;
    }

    // Set amount
    const amountBlock = block.querySelector('[data-element="paymentsBlock_amount"]');
    if (amountBlock) {
        amountBlock.textContent = `$${payment.amount_total.toFixed(2)}`;
    }
}

// Helper function to format date range
function formatDateRange(checkIn, checkOut) {
    // Extract month and day from date strings
    const [, checkInMonth, checkInDay] = checkIn.split('-');
    const [, checkOutMonth, checkOutDay] = checkOut.split('-');

    // Convert month numbers to month names
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const inMonth = months[parseInt(checkInMonth) - 1];
    const outMonth = months[parseInt(checkOutMonth) - 1];

    // Remove leading zeros from days
    const inDay = parseInt(checkInDay);
    const outDay = parseInt(checkOutDay);

    // Format the date range
    if (checkInMonth === checkOutMonth) {
        return `${inMonth} ${inDay} - ${outDay}`;
    } else {
        return `${inMonth} ${inDay} - ${outMonth} ${outDay}`;
    }
}


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
