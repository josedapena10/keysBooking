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

    try {
        if (loader) loader.style.display = 'flex';

        const hostId = await getHostId();
        if (hostId == null) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }

        const url = `${API_BASE_URL}/integrations/manage_connection?user_id=${encodeURIComponent(hostId)}`;
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            window.location.href = REDIRECT_ON_ERROR;
            return;
        }

        const data = await response.json();
        const provider = data._integration_provider;
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

        // Store connection data for delete flow (PMS_Card_DeleteButton handler to be added later)
        window.__pmsManageConnectionData = data;

        if (deleteButton) {
            // Delete button handler will be wired up when delete flow is defined
            deleteButton.style.cursor = 'pointer';
        }
    } catch (error) {
        console.error('Manage connection load error:', error);
        window.location.href = REDIRECT_ON_ERROR;
        return;
    } finally {
        if (loader) loader.style.display = 'none';
    }
});
