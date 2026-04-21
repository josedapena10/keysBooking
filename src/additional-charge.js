const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';
const STRIPE_API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:FNhKS6jt';

function $(name) {
    return document.querySelector(`[data-element="${name}"]`);
}

function formatMoney(amount) {
    const n = parseFloat(amount);
    const v = Number.isFinite(n) ? n : 0;
    return `$${v.toLocaleString('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('id') || '').trim();
}

function setError(message) {
    const err = $('additionalFee_errorText');
    if (!err) return;
    if (message) {
        err.textContent = message;
        err.style.display = 'block';
    } else {
        err.style.display = 'none';
    }
}

function setPageLoader(isLoading) {
    const loader = $('loader');
    if (!loader) return;
    loader.style.display = isLoading ? 'flex' : 'none';
}

function setStatus(status) {
    const dot = $('additionalFee_statusDot');
    const text = $('additionalFee_statusText');
    const s = (status || '').toLowerCase();

    let label = status || 'Unknown';
    let color = '#737373';

    if (s === 'pending_guest') {
        label = 'Pending your response';
        color = '#ca8a04';
    } else if (s === 'payment_succeeded') {
        label = 'Paid';
        color = '#15803d';
    } else if (s === 'declined') {
        label = 'Declined';
        color = '#dc2626';
    } else if (s === 'refunded') {
        label = 'Refunded';
        color = '#dc2626';
    } else if (s === 'payment_failed') {
        label = 'Payment failed';
        color = '#dc2626';
    } else if (s === 'expired') {
        label = 'Expired';
        color = '#737373';
    }

    if (dot) dot.style.backgroundColor = color;
    if (text) {
        text.textContent = label;
        text.style.color = color;
    }
}

function hideActionSection() {
    const ids = [
        'acceptPayButton',
        'additionalFee_declineButton',
        'additionalFee_declineCancelTextBox',
        'additionalFee_confirmDeclineCancelButton'
    ];
    ids.forEach((id) => {
        const el = $(id);
        if (el) el.style.display = 'none';
    });
}

function showPendingActionSection() {
    const accept = $('acceptPayButton');
    const decline = $('additionalFee_declineButton');
    const hostFee = $('additionalFee_hostFeeTotal');
    const taxes = $('additionalFee_serviceFeeTaxesTotal');
    const declineBox = $('additionalFee_declineCancelTextBox');
    const declineConfirm = $('additionalFee_confirmDeclineCancelButton');
    if (accept) accept.style.display = 'flex';
    if (decline) decline.style.display = 'flex';
    if (hostFee) hostFee.style.display = '';
    if (taxes) taxes.style.display = '';
    if (declineBox) declineBox.style.display = 'none';
    if (declineConfirm) declineConfirm.style.display = 'none';
}

function createLoader() {
    const body = $('bodyContainer');
    if (!body) return null;
    let loader = body.querySelector('[data-element="additionalCharge_loader"]');
    if (loader) return loader;

    loader = document.createElement('div');
    loader.setAttribute('data-element', 'additionalCharge_loader');
    Object.assign(loader.style, {
        position: 'absolute',
        inset: '0',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(255,255,255,0.9)',
        zIndex: '20'
    });

    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
        width: '34px',
        height: '34px',
        border: '3px solid rgba(0,0,0,0.15)',
        borderTopColor: '#111',
        borderRadius: '50%',
        animation: 'kb-additional-charge-spin 0.8s linear infinite'
    });

    const text = document.createElement('div');
    text.textContent = 'Processing...';
    Object.assign(text.style, {
        fontSize: '14px',
        color: '#111',
        fontWeight: '500'
    });

    loader.appendChild(spinner);
    loader.appendChild(text);

    if (!document.getElementById('kb-additional-charge-spin-style')) {
        const style = document.createElement('style');
        style.id = 'kb-additional-charge-spin-style';
        style.textContent = `
            @keyframes kb-additional-charge-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    if (getComputedStyle(body).position === 'static') {
        body.style.position = 'relative';
    }
    body.appendChild(loader);
    return loader;
}

function setLoading(isLoading) {
    const body = $('bodyContainer');
    const loader = createLoader();
    if (!body || !loader) return;

    if (isLoading) {
        body.querySelectorAll('[data-element]').forEach((el) => {
            if (el.getAttribute('data-element') === 'additionalCharge_loader') return;
            el.dataset.kbPrevVisibility = el.style.visibility || '';
            el.style.visibility = 'hidden';
        });
        loader.style.display = 'flex';
    } else {
        loader.style.display = 'none';
        body.querySelectorAll('[data-element]').forEach((el) => {
            if (el.getAttribute('data-element') === 'additionalCharge_loader') return;
            el.style.visibility = el.dataset.kbPrevVisibility || '';
            delete el.dataset.kbPrevVisibility;
        });
    }
}

function normalizeChargeResponse(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] || null;
    if (data.charge) return data.charge;
    if (data.item) return data.item;
    if (Array.isArray(data.items)) return data.items[0] || null;
    if (Array.isArray(data.reservation_additional_charges)) return data.reservation_additional_charges[0] || null;
    return data;
}

async function getChargeByToken(token, userId) {
    const qs = new URLSearchParams({ token, user_id: String(userId) });
    const url = `${API_BASE}/additional_charge_get_by_token?${qs.toString()}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || data.error || 'Could not load additional fee request.');
    return normalizeChargeResponse(data);
}

async function acceptAndChargeByToken(token, userId) {
    const body = { token: String(token), user_id: userId };
    const res = await fetch(`${STRIPE_API_BASE}/additional_charge_accept_and_charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Could not start payment.');
    return data;
}

async function declineCharge(token, userId, reason) {
    const body = {
        token: String(token),
        user_id: userId,
        decline_description: reason
    };
    const res = await fetch(`${API_BASE}/additional_charge_decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Could not decline request.');
    return data;
}

function renderCharge(charge) {
    if (!charge) return;
    setStatus(charge.status);

    const image = $('additionalFee_propertyImage');
    const propName = $('additionalFee_propertyName');
    const title = $('additionalFee_title');
    const description = $('additionalFee_description');
    const hostFeeTotal = $('additionalFee_hostFeeTotal');
    const feesTaxes = $('additionalFee_serviceFeeTaxesTotal');
    const total = $('additionalFee_totalDueAmount');
    const totalLabel = $('additionalFee_totalDueText');

    const imageUrl =
        charge.property_main_image ||
        charge.property_image_url ||
        (charge._property && charge._property._email_image && charge._property._email_image[0] && charge._property._email_image[0].image && charge._property._email_image[0].image.url) ||
        '';

    if (image && imageUrl) image.src = imageUrl;
    if (propName) propName.textContent = charge.property_name || (charge._property && charge._property.property_name) || '';
    if (title) title.textContent = charge.title || '';
    if (description) description.textContent = charge.description || '';
    const baseAmountForDisplay =
        charge.base_amount != null
            ? charge.base_amount
            : (charge.baseAmount != null ? charge.baseAmount : null);
    if (hostFeeTotal) hostFeeTotal.textContent = formatMoney(baseAmountForDisplay);
    if (feesTaxes) {
        const service = parseFloat(charge.serviceFee_amount) || 0;
        const salesTax = parseFloat(charge.sales_tax_amount) || 0;
        const surTax = parseFloat(charge.sales_surTax_amount) || 0;
        feesTaxes.textContent = formatMoney(service + salesTax + surTax);
    }
    if (total) total.textContent = formatMoney(charge.total_amount);

    const status = (charge.status || '').toLowerCase();
    if (totalLabel) {
        if (status === 'payment_succeeded') {
            totalLabel.textContent = 'Total paid';
        } else if (status === 'declined') {
            totalLabel.textContent = 'Total declined';
        } else {
            totalLabel.textContent = 'Total due';
        }
    }
    if (status === 'pending_guest') showPendingActionSection();
    else hideActionSection();
}

function getSignedInUserIdFromWized(Wized) {
    const id = Wized && Wized.data && Wized.data.r && Wized.data.r.Load_user && Wized.data.r.Load_user.data && Wized.data.r.Load_user.data.id;
    return id != null ? id : null;
}

function hasWizedSessionToken(Wized) {
    const t = Wized && Wized.data && Wized.data.c && Wized.data.c.token;
    return t != null && String(t).trim() !== '';
}

function showOnlyLogin() {
    const loginModal = $('loginModal');
    const body = $('bodyContainer');
    if (loginModal) loginModal.style.display = 'flex';
    if (body) body.style.display = 'none';
}

function showBodyAndHideLogin() {
    const loginModal = $('loginModal');
    const body = $('bodyContainer');
    if (loginModal) loginModal.style.display = 'none';
    if (body) body.style.display = 'flex';
}

function redirectUnauthorized() {
    showOnlyLogin();
    window.location.href = '/404';
}

function getDeclineDescription() {
    const box = $('additionalFee_declineCancelTextBox');
    if (!box) return '';
    if ('value' in box) return String(box.value || '').trim();
    const nested = box.querySelector('textarea, input, [contenteditable="true"]');
    if (!nested) return '';
    if ('value' in nested) return String(nested.value || '').trim();
    return String(nested.textContent || '').trim();
}

function setDeclineDescription(value) {
    const box = $('additionalFee_declineCancelTextBox');
    if (!box) return;
    if ('value' in box) {
        box.value = value;
        return;
    }
    const nested = box.querySelector('textarea, input, [contenteditable="true"]');
    if (!nested) return;
    if ('value' in nested) nested.value = value;
    else nested.textContent = value;
}

function bindActions(ctx) {
    const acceptBtn = $('acceptPayButton');
    const declineBtn = $('additionalFee_declineButton');
    const declineBox = $('additionalFee_declineCancelTextBox');
    const confirmDeclineBtn = $('additionalFee_confirmDeclineCancelButton');

    if (declineBox) declineBox.style.display = 'none';
    if (confirmDeclineBtn) confirmDeclineBtn.style.display = 'none';

    if (acceptBtn) {
        acceptBtn.onclick = async () => {
            setError('');
            try {
                setLoading(true);
                const data = await acceptAndChargeByToken(ctx.token, ctx.userId);
                const stripeStatus = (data.stripe_status || '').toLowerCase();
                if (stripeStatus === 'succeeded') {
                    ctx.charge.status = 'payment_succeeded';
                    setStatus('payment_succeeded');
                    hideActionSection();
                    setError('');
                } else {
                    // Off-session charge may be processing; webhook will finalize state.
                    hideActionSection();
                    setStatus('pending_guest');
                    setError('Payment is being processed. Please refresh in a moment to see final status.');
                }
            } catch (e) {
                setLoading(false);
                setError(e.message || 'Could not continue to payment.');
            } finally {
                setLoading(false);
            }
        };
    }

    if (declineBtn) {
        declineBtn.onclick = () => {
            setError('');
            if (declineBox) declineBox.style.display = 'flex';
            if (confirmDeclineBtn) confirmDeclineBtn.style.display = 'flex';
        };
    }

    if (confirmDeclineBtn) {
        confirmDeclineBtn.onclick = async () => {
            setError('');
            const reason = getDeclineDescription();
            if (!reason) {
                setError('Please enter a description before declining.');
                return;
            }
            try {
                setLoading(true);
                await declineCharge(ctx.token, ctx.userId, reason);
                ctx.charge.status = 'declined';
                setStatus('declined');
                hideActionSection();
                if (declineBox) declineBox.style.display = 'none';
                if (confirmDeclineBtn) confirmDeclineBtn.style.display = 'none';
                setDeclineDescription('');
            } catch (e) {
                setError(e.message || 'Could not decline request.');
            } finally {
                setLoading(false);
            }
        };
    }
}

async function init() {
    setPageLoader(true);
    setError('');
    const token = getTokenFromUrl();
    if (!token) {
        setError('Invalid additional fee link.');
        showBodyAndHideLogin();
        hideActionSection();
        setPageLoader(false);
        return;
    }

    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {
        if (!hasWizedSessionToken(Wized)) {
            showOnlyLogin();
            setPageLoader(false);
            return;
        }

        try {
            await Wized.requests.waitFor('Load_user');
        } catch (_) {
            showOnlyLogin();
            setPageLoader(false);
            return;
        }

        const loadUserStatus = Wized && Wized.data && Wized.data.r && Wized.data.r.Load_user && Wized.data.r.Load_user.status;
        const userId = getSignedInUserIdFromWized(Wized);
        if (loadUserStatus !== 200 || !userId) {
            showOnlyLogin();
            setPageLoader(false);
            return;
        }

        showBodyAndHideLogin();

        try {
            setLoading(true);
            const charge = await getChargeByToken(token, userId);
            if (!charge || !charge.id) {
                throw new Error('Additional fee request not found.');
            }
            renderCharge(charge);
            bindActions({ charge, userId, token });
        } catch (e) {
            const msg = (e && e.message ? e.message : '').toLowerCase();
            if (msg.includes('not authorized')) {
                hideActionSection();
                setPageLoader(false);
                redirectUnauthorized();
                return;
            }
            hideActionSection();
            setError(e.message || 'Could not load additional fee request.');
        } finally {
            setLoading(false);
            setPageLoader(false);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
