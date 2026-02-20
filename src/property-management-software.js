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


// PMS Integrations functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Check if user is signed in via Wized
    window.Wized = window.Wized || [];
    window.Wized.push((async (Wized) => {
        // Check if user is signed in via c.token
        const hasToken = Wized.data?.c?.token;

        if (!hasToken) {
            // User is not signed in, redirect to host home
            window.location.href = '/host/home';
            return;
        }

        // Wait for Load_user to verify auth
        try {
            await Wized.requests.waitFor('Load_user');
            const userLoadStatus = Wized.data.r.Load_user?.status;

            if (userLoadStatus !== 200) {
                // User auth failed, redirect to host home
                window.location.href = '/host/home';
                return;
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = '/host/home';
            return;
        }
    }));

    const loader = document.querySelector('[data-element="loader"]');
    const pmsModal = document.querySelector('[data-element="PMS_modal"]');
    const pmsCloseButton = document.querySelector('[data-element="PMS_closeButton"]');
    const pmsHeaderText = document.querySelector('[data-element="PMS_headerText"]');
    const pmsHeaderSubText = document.querySelector('[data-element="PMS_headerSubText"]');
    const pmsInput = document.querySelector('[data-element="PMS_input"]');
    const pmsErrorText = document.querySelector('[data-element="PMS_errorText"]');
    const pmsSubmitButton = document.querySelector('[data-element="PMS_submitButton"]');
    const pmsSubmitButtonText = document.querySelector('[data-element="PMS_submitButton_text"]');
    const pmsSubmitButtonLoader = document.querySelector('[data-element="PMS_submitButton_loader"]');

    // Store integrations data globally for modal usage
    let integrationsData = [];
    let selectedIntegration = null;

    try {
        // Show loader
        if (loader) loader.style.display = 'flex';

        // Fetch integrations from API
        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/integrations_providers');

        if (!response.ok) {
            throw new Error('Failed to fetch integrations');
        }

        integrationsData = await response.json();

        // Get the template card
        const templateCard = document.querySelector('[data-element="PMS_Card"]');

        if (!templateCard) {
            throw new Error('PMS_Card template not found');
        }

        const cardContainer = templateCard.parentElement;

        // Clear existing cards (in case template has duplicates)
        cardContainer.innerHTML = '';

        // Render cards based on integrations data
        integrationsData.forEach((integration, index) => {
            // Clone the template card
            const card = templateCard.cloneNode(true);

            // Find and populate card elements
            const cardText = card.querySelector('[data-element="PMS_Card_Text"]');
            const cardImage = card.querySelector('[data-element="PMS_Card_Image"]');

            if (cardText) {
                cardText.textContent = integration.display_name || '';
            }

            if (cardImage && integration.logo && integration.logo.url) {
                cardImage.src = integration.logo.url;
                cardImage.alt = integration.display_name || 'PMS Logo';
            }

            // Add click event to open modal
            card.addEventListener('click', function () {
                openPMSModal(integration);
            });

            // Append card to container
            cardContainer.appendChild(card);
        });

        // Hide loader after all cards are rendered
        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error('Error loading PMS integrations:', error);
        // Hide loader even on error
        if (loader) loader.style.display = 'none';
    }

    // Function to open and populate the PMS modal
    function openPMSModal(integration) {
        selectedIntegration = integration;

        // Populate modal content
        if (pmsHeaderText) {
            pmsHeaderText.textContent = integration.display_name || '';
        }

        if (pmsHeaderSubText) {
            pmsHeaderSubText.textContent = `Enter your ${integration.display_name || ''} API key to import your listing and sync availability.`;
        }

        // Clear input and error text
        if (pmsInput) {
            pmsInput.value = '';
        }

        if (pmsErrorText) {
            pmsErrorText.style.display = 'none';
            pmsErrorText.textContent = '';
        }

        // Reset submit button state
        if (pmsSubmitButtonLoader) {
            pmsSubmitButtonLoader.style.display = 'none';
        }

        if (pmsSubmitButtonText) {
            pmsSubmitButtonText.style.display = 'block';
        }

        // Show modal
        if (pmsModal) {
            pmsModal.style.display = 'flex';
            document.body.classList.add('no-scroll');
        }
    }

    // Close modal functionality
    if (pmsCloseButton) {
        pmsCloseButton.addEventListener('click', function () {
            if (pmsModal) {
                pmsModal.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
            selectedIntegration = null;
        });
    }

    // Close modal on background click
    if (pmsModal) {
        pmsModal.addEventListener('click', function (e) {
            if (e.target === pmsModal) {
                pmsModal.style.display = 'none';
                document.body.classList.remove('no-scroll');
                selectedIntegration = null;
            }
        });
    }

    // API Configuration
    const API_BASE_URL = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

    // Helper function to get host_id from Wized Load_user request
    function getHostId() {
        return new Promise((resolve) => {
            window.Wized = window.Wized || [];
            window.Wized.push((async (Wized) => {
                try {
                    await Wized.requests.waitFor('Load_user');
                    const hostId = Wized.data.r.Load_user.data.id;
                    resolve(hostId);
                } catch (error) {
                    console.error('Error getting host_id:', error);
                    resolve(null);
                }
            }));
        });
    }

    // Create progress overlay element
    function createProgressOverlay(providerName) {
        const overlay = document.createElement('div');
        overlay.id = 'pms-import-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 40px; width: 100%;">
                <div id="pms-progress-icon" style="margin-bottom: 24px;">
                    <svg width="80" height="80" viewBox="0 0 50 50" style="animation: pms-spin 1s linear infinite;">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#4CAF50" stroke-width="4" stroke-dasharray="80 40" stroke-linecap="round"/>
                    </svg>
                </div>
                <h2 id="pms-progress-title" style="font-size: 28px; margin-bottom: 8px; font-weight: 700;">
                    Importing from ${providerName || 'PMS'}
                </h2>
                <p id="pms-progress-subtitle" style="font-size: 16px; color: #94a3b8; margin-bottom: 32px;">
                    Please don't close or refresh this page
                </p>
                
                <!-- Progress Bar Container -->
                <div style="width: 100%; background: rgba(255,255,255,0.1); border-radius: 12px; height: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                    <div id="pms-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 12px; transition: width 0.3s ease; position: relative;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: pms-shimmer 2s infinite;"></div>
                    </div>
                </div>
                
                <!-- Progress Stats -->
                <div id="pms-progress-stats" style="display: flex; justify-content: center; gap: 32px; margin-bottom: 24px;">
                    <div style="text-align: center;">
                        <div id="pms-stat-completed" style="font-size: 32px; font-weight: 700; color: #4CAF50;">0</div>
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Imported</div>
                    </div>
                    <div style="text-align: center;">
                        <div id="pms-stat-total" style="font-size: 32px; font-weight: 700; color: #fff;">0</div>
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Total</div>
                    </div>
                    <div style="text-align: center;">
                        <div id="pms-stat-percentage" style="font-size: 32px; font-weight: 700; color: #8BC34A;">0%</div>
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Progress</div>
                    </div>
                </div>
                
                <!-- Status Text -->
                <p id="pms-progress-text" style="font-size: 16px; color: #e2e8f0; margin-bottom: 8px;">
                    Connecting to ${providerName || 'PMS'}...
                </p>
                <p id="pms-progress-current" style="font-size: 13px; color: #64748b; min-height: 20px;">
                    
                </p>
                
                <!-- Detailed Breakdown (hidden initially) -->
                <div id="pms-progress-breakdown" style="display: none; margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; text-align: left;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #94a3b8;">Importing:</span>
                            <span id="pms-detail-importing" style="color: #fbbf24; font-weight: 600;">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #94a3b8;">Completed:</span>
                            <span id="pms-detail-completed" style="color: #4CAF50; font-weight: 600;">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #94a3b8;">Errors:</span>
                            <span id="pms-detail-errors" style="color: #ef4444; font-weight: 600;">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #94a3b8;">Status:</span>
                            <span id="pms-detail-status" style="color: #8BC34A; font-weight: 600;">Running</span>
                        </div>
                    </div>
                </div>
                
                <!-- Elapsed Time -->
                <p id="pms-elapsed-time" style="font-size: 12px; color: #475569; margin-top: 16px;">
                    
                </p>
                
                <button id="pms-complete-button" style="
                    display: none;
                    margin-top: 32px;
                    padding: 16px 40px;
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(76, 175, 80, 0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(76, 175, 80, 0.3)'">
                    View Your Listings
                </button>
            </div>
            <style>
                @keyframes pms-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pms-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;

        document.body.appendChild(overlay);

        // Store start time for elapsed calculation
        overlay.dataset.startTime = Date.now().toString();

        return overlay;
    }

    // Update progress overlay
    function updateProgressOverlay(data) {
        const progressBar = document.getElementById('pms-progress-bar');
        const progressText = document.getElementById('pms-progress-text');
        const progressCurrent = document.getElementById('pms-progress-current');
        const progressTitle = document.getElementById('pms-progress-title');
        const progressSubtitle = document.getElementById('pms-progress-subtitle');
        const progressIcon = document.getElementById('pms-progress-icon');
        const completeButton = document.getElementById('pms-complete-button');
        const statCompleted = document.getElementById('pms-stat-completed');
        const statTotal = document.getElementById('pms-stat-total');
        const statPercentage = document.getElementById('pms-stat-percentage');
        const progressBreakdown = document.getElementById('pms-progress-breakdown');
        const detailImporting = document.getElementById('pms-detail-importing');
        const detailCompleted = document.getElementById('pms-detail-completed');
        const detailErrors = document.getElementById('pms-detail-errors');
        const detailStatus = document.getElementById('pms-detail-status');
        const elapsedTime = document.getElementById('pms-elapsed-time');
        const overlay = document.getElementById('pms-import-overlay');

        if (!progressBar) return;

        const { status, progress, error, started_at, finished_at } = data;
        const percentage = Math.round(progress?.percentage || 0);
        const completed = progress?.completed || 0;
        const total = progress?.total || 0;
        const importing = progress?.importing || 0;
        const errors = progress?.errors || 0;

        // Update progress bar
        progressBar.style.width = `${percentage}%`;

        // Update stats
        if (statCompleted) statCompleted.textContent = completed;
        if (statTotal) statTotal.textContent = total;
        if (statPercentage) statPercentage.textContent = `${percentage}%`;

        // Update elapsed time
        if (elapsedTime && overlay?.dataset?.startTime) {
            const startTime = parseInt(overlay.dataset.startTime);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            elapsedTime.textContent = `Elapsed: ${minutes}m ${seconds}s`;
        }

        // Show breakdown when we have data
        if (total > 0 && progressBreakdown) {
            progressBreakdown.style.display = 'block';
            if (detailImporting) detailImporting.textContent = importing;
            if (detailCompleted) detailCompleted.textContent = completed;
            if (detailErrors) detailErrors.textContent = errors;
        }

        if (status === 'running') {
            if (detailStatus) {
                detailStatus.textContent = 'Running';
                detailStatus.style.color = '#8BC34A';
            }
            progressText.textContent = `Importing ${completed} of ${total} ${total === 1 ? 'property' : 'properties'}...`;
            if (data.current_property) {
                progressCurrent.textContent = `Currently processing: Property #${data.current_property}`;
            } else {
                progressCurrent.textContent = 'Processing your listings...';
            }
        } else if (status === 'success') {
            progressBar.style.width = '100%';
            progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';

            if (statPercentage) statPercentage.textContent = '100%';
            if (detailStatus) {
                detailStatus.textContent = 'Complete';
                detailStatus.style.color = '#4CAF50';
            }

            progressTitle.textContent = '🎉 Import Complete!';
            progressTitle.style.color = '#4CAF50';
            progressSubtitle.textContent = `Successfully imported ${completed} ${completed === 1 ? 'property' : 'properties'}`;
            progressSubtitle.style.color = '#e2e8f0';
            progressText.textContent = 'Your listings are ready to review and publish';
            progressCurrent.textContent = errors > 0 ? `${errors} ${errors === 1 ? 'property' : 'properties'} had issues - check your listings page` : '';

            progressIcon.innerHTML = `
                <svg width="80" height="80" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="23" fill="#4CAF50"/>
                    <path d="M15 25 L22 32 L35 18" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

            completeButton.style.display = 'inline-block';
            completeButton.onclick = () => {
                window.location.href = '/host/listings';
            };

            // Update elapsed to show total time
            if (elapsedTime && overlay?.dataset?.startTime) {
                const startTime = parseInt(overlay.dataset.startTime);
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                elapsedTime.textContent = `Completed in ${minutes}m ${seconds}s`;
            }
        } else if (status === 'failed') {
            if (detailStatus) {
                detailStatus.textContent = 'Failed';
                detailStatus.style.color = '#ef4444';
            }

            progressTitle.textContent = '❌ Import Failed';
            progressTitle.style.color = '#ef4444';
            progressSubtitle.textContent = error || 'An error occurred during import';
            progressSubtitle.style.color = '#fca5a5';
            progressText.textContent = 'Please try again or contact support if the issue persists';
            progressCurrent.textContent = completed > 0 ? `${completed} ${completed === 1 ? 'property was' : 'properties were'} imported before the error` : '';

            progressBar.style.background = '#ef4444';

            progressIcon.innerHTML = `
                <svg width="80" height="80" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="23" fill="#ef4444"/>
                    <path d="M17 17 L33 33 M33 17 L17 33" stroke="white" stroke-width="4" stroke-linecap="round"/>
                </svg>
            `;

            completeButton.textContent = 'Try Again';
            completeButton.style.display = 'inline-block';
            completeButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            completeButton.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            completeButton.onmouseover = function () {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            };
            completeButton.onmouseout = function () {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            };
            completeButton.onclick = () => {
                document.getElementById('pms-import-overlay')?.remove();
                window.onbeforeunload = null;
            };
        } else if (status === 'queued') {
            if (detailStatus) {
                detailStatus.textContent = 'Queued';
                detailStatus.style.color = '#fbbf24';
            }
            progressText.textContent = 'Import queued, waiting to start...';
            progressCurrent.textContent = 'Your import will begin shortly due to high demand';
        }
    }

    // Poll for import progress
    function pollImportProgress(jobId) {
        let pollCount = 0;
        let consecutiveErrors = 0;
        const maxPolls = 600; // 20 minutes max (600 * 2 seconds)
        const maxConsecutiveErrors = 5; // Stop after 5 errors in a row

        const stopPolling = (errorMessage) => {
            clearInterval(pollInterval);
            window.onbeforeunload = null;
            if (errorMessage) {
                updateProgressOverlay({
                    status: 'failed',
                    error: errorMessage,
                    progress: { percentage: 0, completed: 0, total: 0 }
                });
            }
        };

        const pollInterval = setInterval(async () => {
            pollCount++;

            try {
                const url = `${API_BASE_URL}/integrations/import_progress`;
                const params = new URLSearchParams({ job_id: jobId });
                const response = await fetch(`${url}?${params.toString()}`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    consecutiveErrors++;
                    // 404 = endpoint missing or job not found; stop immediately
                    if (response.status === 404) {
                        stopPolling('Import progress unavailable. The import may still be running — check your listings page.');
                        return;
                    }
                    // Other HTTP errors: stop after max consecutive errors
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        stopPolling('Unable to load import progress. Please check your listings page.');
                        return;
                    }
                    throw new Error('Failed to fetch progress');
                }

                // Success: reset error count
                consecutiveErrors = 0;

                const data = await response.json();
                updateProgressOverlay(data);

                // Check if complete or failed
                if (data.status === 'success' || data.status === 'failed') {
                    stopPolling(null);
                }

                // Safety timeout
                if (pollCount >= maxPolls) {
                    stopPolling('Import is taking longer than expected. Please check your listings page.');
                }

            } catch (error) {
                consecutiveErrors++;
                console.error('Progress poll error:', error);
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    stopPolling('Connection problem while checking progress. Please check your listings page.');
                }
            }
        }, 2000); // Poll every 2 seconds
    }

    // Submit button click handler
    if (pmsSubmitButton) {
        pmsSubmitButton.addEventListener('click', async function () {
            const apiKey = pmsInput?.value?.trim();

            // Validate input
            if (!apiKey) {
                if (pmsErrorText) {
                    pmsErrorText.textContent = 'Please enter an API key';
                    pmsErrorText.style.display = 'block';
                }
                return;
            }

            // Show loading state immediately
            if (pmsSubmitButtonText) pmsSubmitButtonText.style.display = 'none';
            if (pmsSubmitButtonLoader) pmsSubmitButtonLoader.style.display = 'block';
            if (pmsErrorText) pmsErrorText.style.display = 'none';
            pmsSubmitButton.disabled = true;

            try {
                // Get host_id (async)
                const hostId = await getHostId();
                if (!hostId) {
                    throw new Error('Unable to identify your account. Please log in again.');
                }

                // STEP 1: Validate API key and create connection
                const connectResponse = await fetch(`${API_BASE_URL}/integrations/connect`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        provider_key: selectedIntegration?.provider_key,
                        api_key: apiKey,
                        host_id: hostId
                    })
                });

                const connectData = await connectResponse.json();

                if (!connectResponse.ok || !connectData.success) {
                    throw new Error(connectData.message || connectData.error || 'Invalid API key');
                }

                // STEP 2: Close modal and show progress overlay as soon as API key is validated
                if (pmsModal) {
                    pmsModal.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                }

                const providerName = selectedIntegration?.display_name || 'PMS';
                createProgressOverlay(providerName);

                // Show "Starting import..." until we have a job_id and start polling
                updateProgressOverlay({
                    status: 'running',
                    progress: { percentage: 0, completed: 0, total: 0 },
                    current_property: null
                });
                const progressTextEl = document.getElementById('pms-progress-text');
                const progressCurrentEl = document.getElementById('pms-progress-current');
                if (progressTextEl) progressTextEl.textContent = `Starting import from ${providerName}...`;
                if (progressCurrentEl) progressCurrentEl.textContent = 'Please wait';

                window.onbeforeunload = function (e) {
                    e.preventDefault();
                    e.returnValue = 'Import in progress. Are you sure you want to leave?';
                    return e.returnValue;
                };

                // STEP 3: Start import (may take a moment; overlay is already visible)
                const importResponse = await fetch(`${API_BASE_URL}/integrations/start_import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        connection_id: connectData.connection_id
                    })
                });

                const importData = await importResponse.json();

                if (!importResponse.ok || !importData.success) {
                    updateProgressOverlay({
                        status: 'failed',
                        error: importData.message || importData.error || 'Failed to start import',
                        progress: { percentage: 0, completed: 0, total: 0 }
                    });
                    const completeBtn = document.getElementById('pms-complete-button');
                    if (completeBtn) {
                        completeBtn.textContent = 'Try Again';
                        completeBtn.style.display = 'inline-block';
                        completeBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                        completeBtn.onclick = () => {
                            document.getElementById('pms-import-overlay')?.remove();
                            window.onbeforeunload = null;
                            if (pmsModal) {
                                pmsModal.style.display = 'flex';
                                document.body.classList.add('no-scroll');
                            }
                            if (pmsSubmitButtonText) pmsSubmitButtonText.style.display = 'block';
                            if (pmsSubmitButtonLoader) pmsSubmitButtonLoader.style.display = 'none';
                            pmsSubmitButton.disabled = false;
                        };
                    }
                    return;
                }

                // STEP 4: Start polling for progress
                pollImportProgress(importData.job_id);

            } catch (error) {
                console.error('PMS connection error:', error);

                if (pmsErrorText) {
                    pmsErrorText.textContent = error.message || 'Failed to connect. Please check your API key.';
                    pmsErrorText.style.display = 'block';
                }

                // Reset button state
                if (pmsSubmitButtonText) pmsSubmitButtonText.style.display = 'block';
                if (pmsSubmitButtonLoader) pmsSubmitButtonLoader.style.display = 'none';
                pmsSubmitButton.disabled = false;
            }
        });
    }

});

