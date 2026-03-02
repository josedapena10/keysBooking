// Manage PMS connection: load connection by host_id, show provider info, delete (handled separately)
document.addEventListener('DOMContentLoaded', async function () {
    const API_BASE_URL = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';
    const REDIRECT_ON_ERROR = '/account';

    // Ensure Wized is available and wait for Load_user so we have host id
    window.Wized = window.Wized || [];
    window.Wized.push((async (Wized) => {
        const hasToken = Wized.data?.c?.token;
        if (!hasToken) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }
        try {
            await Wized.requests.waitFor('Load_user');
            const userLoadStatus = Wized.data.r.Load_user?.status;
            if (userLoadStatus !== 200) {
                window.location.href = REDIRECT_ON_ERROR;
                return;
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }
    }));

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

    const loader = document.querySelector('[data-element="loader"]');
    const pageHeader = document.querySelector('[data-element="pageHeader"]');
    const providerNameEl = document.querySelector('[data-element="PMS_Card_ProviderName"]');
    const deleteButton = document.querySelector('[data-element="PMS_Card_DeleteButton"]');

    // Show loader immediately on load while we run the GET request
    if (loader) loader.style.display = 'flex';

    try {
        const hostId = await getHostId();
        if (hostId == null) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }

        const url = `${API_BASE_URL}/integrations/manage_connection?host_id=${encodeURIComponent(hostId)}`;
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }

        const data = await response.json();
        // New structure: { connection: {...}, properties: [...] }
        const connection = data.connection;
        const properties = data.properties || [];
        const provider = connection?._integration_provider;
        if (!provider) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }

        const displayName = provider.display_name || 'PMS';

        if (pageHeader) {
            pageHeader.textContent = 'Manage ' + displayName + ' Connection';
        }
        if (providerNameEl) {
            providerNameEl.textContent = displayName;
        }

        // Store connection and properties for delete flow
        window.__pmsManageConnectionData = { connection, properties, _integration_provider: provider };

        if (deleteButton) {
            deleteButton.style.cursor = 'pointer';
            deleteButton.addEventListener('click', openDeleteConfirmModal);
        }
    } catch (error) {
        console.error('Manage connection load error:', error);
        window.location.href = REDIRECT_ON_ERROR;
        return;
    } finally {
        if (loader) loader.style.display = 'none';
    }

    // ---------- Delete confirmation modal ----------
    const DELETE_API_URL = `${API_BASE_URL}/integrations/delete_integration`;
    const REDIRECT_SUCCESS = '/host/dashboard';

    let deleteModalEl = null;
    let deleteModalBackdrop = null;
    let deleteConfirmBtn = null;
    let deleteOptionKeepActive = null;
    let deleteOptionMakeInactive = null;
    let deleteLoadingOverlay = null;

    function createDeleteModal() {
        if (deleteModalBackdrop) return;

        const backdrop = document.createElement('div');
        backdrop.setAttribute('data-pms-delete-modal-backdrop', 'true');
        backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity 0.2s ease;';
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeDeleteModal();
        });

        const modal = document.createElement('div');
        modal.setAttribute('data-pms-delete-modal', 'true');
        modal.style.cssText = 'background:#fff;border-radius:16px;max-width:440px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;transform:scale(0.96);transition:transform 0.2s ease;';
        modal.addEventListener('click', (e) => e.stopPropagation());

        const providerName = (window.__pmsManageConnectionData && window.__pmsManageConnectionData._integration_provider?.display_name) || 'PMS';
        const properties = window.__pmsManageConnectionData?.properties || [];
        const hasAnyActive = properties.some(p => p.is_active === true);

        modal.innerHTML = `
            <div style="padding:28px 24px 24px;">
                <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Delete connection</h2>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#555;" data-pms-delete-desc>${hasAnyActive
            ? `This will remove your ${providerName} integration. Your imported listings will remain, but calendar sync will stop. Choose what happens to those listings:`
            : `This will remove your ${providerName} integration. Your imported listings will remain but will stay inactive. Calendar sync will stop.`}</p>
                <div data-pms-delete-options style="display:${hasAnyActive ? 'flex' : 'none'};flex-direction:column;gap:12px;margin-bottom:24px;">
                    <label style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:border-color 0.2s, background 0.2s;">
                        <input type="radio" name="pms-delete-listing-option" value="keep" style="margin-top:3px;accent-color:#0f766e;">
                        <div>
                            <span style="font-weight:600;color:#111;">Keep my listings active</span>
                            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Listings stay live; you can manage availability and calendar manually.</p>
                        </div>
                    </label>
                    <label style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:border-color 0.2s, background 0.2s;">
                        <input type="radio" name="pms-delete-listing-option" value="inactive" style="margin-top:3px;accent-color:#0f766e;">
                        <div>
                            <span style="font-weight:600;color:#111;">Make my listings inactive</span>
                            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Listings are unpublished until you update them.</p>
                        </div>
                    </label>
                </div>
                <div style="display:flex;gap:12px;justify-content:flex-end;">
                    <button type="button" data-pms-delete-cancel style="padding:10px 20px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:15px;font-weight:500;color:#374151;cursor:pointer;">Cancel</button>
                    <button type="button" data-pms-delete-confirm style="padding:10px 20px;border:none;border-radius:10px;background:#9ca3af;color:#fff;font-size:15px;font-weight:600;cursor:not-allowed;">Confirm deletion</button>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const optionKeep = modal.querySelector('input[value="keep"]');
        const optionInactive = modal.querySelector('input[value="inactive"]');
        const confirmBtn = modal.querySelector('[data-pms-delete-confirm]');
        const cancelBtn = modal.querySelector('[data-pms-delete-cancel]');

        function updateConfirmState() {
            // When no listings are active, confirm is always enabled (we always send keepListingActive: false)
            const chosen = !hasAnyActive || optionKeep?.checked || optionInactive?.checked;
            if (confirmBtn) {
                confirmBtn.disabled = !chosen;
                confirmBtn.style.cursor = chosen ? 'pointer' : 'not-allowed';
                confirmBtn.style.background = chosen ? '#b91c1c' : '#9ca3af';
            }
        }

        function updateOptionStyles() {
            modal.querySelectorAll('label').forEach(function (label) {
                const radio = label.querySelector('input[type="radio"]');
                const selected = radio && radio.checked;
                label.style.borderColor = selected ? '#0f766e' : '#e5e7eb';
                label.style.background = selected ? '#f0fdfa' : '#fff';
            });
        }

        optionKeep?.addEventListener('change', function () {
            updateConfirmState();
            updateOptionStyles();
        });
        optionInactive?.addEventListener('change', function () {
            updateConfirmState();
            updateOptionStyles();
        });

        modal.querySelectorAll('label').forEach(function (label) {
            label.addEventListener('click', function () {
                requestAnimationFrame(function () {
                    updateConfirmState();
                    updateOptionStyles();
                });
            });
        });

        cancelBtn?.addEventListener('click', closeDeleteModal);
        confirmBtn?.addEventListener('click', submitDelete);

        deleteModalEl = modal;
        deleteModalBackdrop = backdrop;
        deleteConfirmBtn = confirmBtn;
        deleteOptionKeepActive = optionKeep;
        deleteOptionMakeInactive = optionInactive;
        window.__pmsUpdateDeleteConfirmState = updateConfirmState;
    }

    function openDeleteConfirmModal() {
        const data = window.__pmsManageConnectionData;
        const connectionId = data?.connection?.id;
        if (!data || connectionId == null) {
            console.error('No connection data for delete');
            return;
        }
        createDeleteModal();
        if (deleteOptionKeepActive) deleteOptionKeepActive.checked = false;
        if (deleteOptionMakeInactive) deleteOptionMakeInactive.checked = false;
        window.__pmsUpdateDeleteConfirmState?.();
        if (deleteModalBackdrop) {
            deleteModalBackdrop.style.opacity = '1';
            deleteModalBackdrop.style.pointerEvents = 'auto';
            const m = deleteModalEl;
            if (m) requestAnimationFrame(() => { m.style.transform = 'scale(1)'; });
        }
        document.body.classList.add('no-scroll');
    }

    function closeDeleteModal() {
        if (!deleteModalBackdrop) return;
        deleteModalBackdrop.style.opacity = '0';
        deleteModalBackdrop.style.pointerEvents = 'none';
        if (deleteModalEl) deleteModalEl.style.transform = 'scale(0.96)';
        document.body.classList.remove('no-scroll');
    }

    function showDeleteLoadingOverlay() {
        if (deleteLoadingOverlay) return;
        const overlay = document.createElement('div');
        overlay.setAttribute('data-pms-delete-loading', 'true');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:system-ui,sans-serif;';
        overlay.innerHTML = `
            <div style="margin-bottom:20px;">
                <svg width="48" height="48" viewBox="0 0 50 50" style="animation: pms-delete-spin 0.8s linear infinite;">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#4ade80" stroke-width="4" stroke-dasharray="80 40" stroke-linecap="round"/>
                </svg>
            </div>
            <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Deleting connection…</p>
            <p style="font-size:14px;color:#94a3b8;margin:0;">Please don't close or refresh this page.</p>
        `;
        const style = document.createElement('style');
        style.textContent = '@keyframes pms-delete-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        deleteLoadingOverlay = overlay;
    }

    function hideDeleteLoadingOverlay() {
        if (deleteLoadingOverlay && deleteLoadingOverlay.parentNode) {
            deleteLoadingOverlay.parentNode.removeChild(deleteLoadingOverlay);
            deleteLoadingOverlay = null;
        }
    }

    async function submitDelete() {
        const data = window.__pmsManageConnectionData;
        const connectionId = data?.connection?.id;
        if (!data || connectionId == null) return;

        const properties = data.properties || [];
        const hasAnyActive = properties.some(p => p.is_active === true);
        // When no listings are active, always send false; otherwise use user's choice
        const keepActive = hasAnyActive ? (deleteOptionKeepActive?.checked === true) : false;
        if (hasAnyActive && !deleteOptionKeepActive?.checked && !deleteOptionMakeInactive?.checked) return;

        closeDeleteModal();
        showDeleteLoadingOverlay();

        window.onbeforeunload = function (e) {
            e.preventDefault();
            e.returnValue = 'Deletion in progress. Are you sure you want to leave?';
            return e.returnValue;
        };

        try {
            const response = await fetch(DELETE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connection_id: parseInt(connectionId, 10),
                    keepListingActive: keepActive
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                hideDeleteLoadingOverlay();
                window.onbeforeunload = null;
                alert(result.message || result.error || 'Failed to delete connection. Please try again.');
                openDeleteConfirmModal();
                return;
            }

            window.onbeforeunload = null;
            window.location.href = REDIRECT_SUCCESS;
        } catch (err) {
            console.error('Delete integration error:', err);
            hideDeleteLoadingOverlay();
            window.onbeforeunload = null;
            alert('Something went wrong. Please try again.');
            openDeleteConfirmModal();
        }
    }
});
