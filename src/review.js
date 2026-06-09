const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

const GUEST_MESSAGES = {
    invalidLink: ['Invalid review link', 'We couldn\u2019t find a reservation for this link.'],
    submitFailed: 'Could not submit your review. Please try again.'
};

const BRAND = '#9ecaff';
const STAR_ON = '#f5a623';
const STAR_OFF = '#d8d8d8';

function $(name) {
    return document.querySelector(`[data-element="${name}"]`);
}

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('token') || '').trim();
}

function ensureStyles() {
    if (document.getElementById('kb-review-styles')) return;
    const style = document.createElement('style');
    style.id = 'kb-review-styles';
    style.textContent = `
        .kb-review-wrap { width: 100%; max-width: 560px; margin: 0 auto; padding: 40px 20px 72px; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #111; animation: kb-fade .3s ease both; }
        .kb-review-wrap * { box-sizing: border-box; }
        .kb-review-title { font-size: 26px; line-height: 1.25; font-weight: 500; margin: 0 0 6px; }
        .kb-review-sub { font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.5; }
        .kb-review-card { border: 1px solid #e6e6e6; border-radius: 5px; padding: 20px; margin-bottom: 16px; background: #fff; transition: border-color .15s ease, box-shadow .15s ease; }
        .kb-review-card:focus-within { border-color: ${BRAND}; box-shadow: 0 0 0 3px rgba(158,202,255,.35); }
        .kb-review-card h3 { font-size: 17px; font-weight: 500; margin: 0 0 2px; }
        .kb-review-card .kb-card-sub { font-size: 13px; color: #777; margin: 0 0 14px; line-height: 1.4; }
        .kb-stars { display: inline-flex; gap: 6px; margin-bottom: 14px; }
        .kb-star { font-size: 30px; line-height: 1; background: none; border: none; padding: 0; cursor: pointer; color: ${STAR_OFF}; transition: color .12s ease, transform .08s ease; }
        .kb-star:hover { transform: scale(1.12); }
        .kb-star.on { color: ${STAR_ON}; }
        .kb-review-label { display: block; font-size: 13px; font-weight: 500; color: #444; margin: 4px 0 6px; }
        .kb-review-input, .kb-review-textarea { width: 100%; border: 1px solid #d8d8d8; border-radius: 5px; padding: 11px 12px; font-size: 14px; font-family: inherit; color: #111; resize: vertical; transition: border-color .12s ease, box-shadow .12s ease; }
        .kb-review-input:focus, .kb-review-textarea:focus { outline: none; border-color: ${BRAND}; box-shadow: 0 0 0 3px rgba(158,202,255,.3); }
        .kb-review-textarea { min-height: 84px; }
        .kb-review-btn { display: block; width: 100%; border: 1px solid #e2e2e2; border-radius: 5px; background: ${BRAND}; color: #000; font-size: 16px; font-weight: 500; padding: 15px 20px; cursor: pointer; margin-top: 8px; transition: filter .15s ease, opacity .15s ease; }
        .kb-review-btn:hover:not(:disabled) { filter: brightness(.95); }
        .kb-review-btn:disabled { opacity: .6; cursor: default; }
        .kb-review-error { display: none; align-items: center; gap: 8px; color: #b42318; background: #fef3f2; border: 1px solid #fda29b; border-radius: 5px; font-size: 14px; line-height: 1.4; padding: 11px 12px; margin: 14px 0 0; animation: kb-fade .2s ease both; }
        .kb-review-error.show { display: flex; }
        .kb-review-error svg { flex: 0 0 auto; }
        .kb-review-state { width: 100%; max-width: 480px; margin: 0 auto; padding: 72px 24px; text-align: center; font-family: Arial, Helvetica, sans-serif; color: #111; animation: kb-fade .3s ease both; }
        .kb-review-state h1 { font-size: 24px; font-weight: 500; margin: 18px 0 10px; }
        .kb-review-state p { font-size: 15px; color: #555; margin: 0; line-height: 1.5; }
        .kb-state-badge { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; animation: kb-pop .35s cubic-bezier(.18,.89,.32,1.28) both; }
        .kb-state-badge svg { width: 32px; height: 32px; }
        .kb-state-badge.success { background: #ecfdf3; color: #079455; }
        .kb-state-badge.error { background: #fef3f2; color: #d92d20; }
        .kb-state-badge.info { background: #eff8ff; color: #1570ef; }
        .kb-review-spinner { width: 40px; height: 40px; border: 3px solid rgba(0,0,0,.12); border-top-color: ${BRAND}; border-radius: 50%; margin: 0 auto; animation: kb-review-spin .8s linear infinite; }
        @keyframes kb-review-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes kb-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes kb-pop { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
    `;
    document.head.appendChild(style);
}

function getBody() {
    return $('body');
}

function clearBody() {
    const body = getBody();
    if (body) body.innerHTML = '';
    return body;
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function renderLoading() {
    ensureStyles();
    const body = clearBody();
    if (!body) return;
    const wrap = el('div', 'kb-review-state');
    wrap.appendChild(el('div', 'kb-review-spinner'));
    body.appendChild(wrap);
}

function scrollToTop() {
    try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        window.scrollTo(0, 0);
    }
}

function stateIconSvg(variant) {
    if (variant === 'success') {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    }
    if (variant === 'error') {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
}

function renderMessage(title, subtitle, variant) {
    ensureStyles();
    const body = clearBody();
    if (!body) return;
    const wrap = el('div', 'kb-review-state');
    if (variant) {
        const badge = el('div', `kb-state-badge ${variant}`);
        badge.innerHTML = stateIconSvg(variant);
        wrap.appendChild(badge);
    }
    wrap.appendChild(el('h1', null, title));
    if (subtitle) wrap.appendChild(el('p', null, subtitle));
    body.appendChild(wrap);
    scrollToTop();
}

function buildStars() {
    let value = 0;
    const wrap = el('div', 'kb-stars');
    const stars = [];

    const paint = (n) => {
        stars.forEach((star, idx) => star.classList.toggle('on', idx < n));
    };

    for (let i = 1; i <= 5; i++) {
        const star = el('button', 'kb-star', '\u2605');
        star.type = 'button';
        star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
        star.addEventListener('mouseenter', () => paint(i));
        star.addEventListener('click', () => {
            value = i;
            paint(value);
        });
        stars.push(star);
        wrap.appendChild(star);
    }

    wrap.addEventListener('mouseleave', () => paint(value));

    return {
        element: wrap,
        get: () => value
    };
}

function buildSection(title, subtitle, commentPlaceholder) {
    const card = el('div', 'kb-review-card');
    card.appendChild(el('h3', null, title));
    if (subtitle) card.appendChild(el('p', 'kb-card-sub', subtitle));

    const stars = buildStars();
    card.appendChild(stars.element);

    const comment = el('textarea', 'kb-review-textarea');
    comment.placeholder = commentPlaceholder || 'Tell us more (optional)';
    card.appendChild(comment);

    return { card, stars, comment };
}

async function getReviewSession(token) {
    const url = `${API_BASE}/review-session?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const text = await res.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        /* ignore malformed response */
    }
    if (!res.ok) {
        console.error('Review session failed:', data.message || data.error || res.status);
        throw new Error('review_session_failed');
    }
    return data;
}

async function submitReview(payload) {
    const res = await fetch(`${API_BASE}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('Submit review failed:', data.message || data.error || res.status);
        throw new Error('submit_review_failed');
    }
    return data;
}

function renderForm(token, session) {
    ensureStyles();
    const body = clearBody();
    if (!body) return;

    const firstName = session.guest_first_name || '';
    const hasBoat = session.has_boat === true;
    const charters = Array.isArray(session.charters) ? session.charters : [];

    const wrap = el('div', 'kb-review-wrap');

    wrap.appendChild(el('h1', 'kb-review-title', firstName ? `How was your trip, ${firstName}?` : 'How was your trip?'));
    wrap.appendChild(el('p', 'kb-review-sub', 'Your feedback helps Keys Booking and future guests. It only takes a minute.'));

    // Stay (always shown)
    const stay = buildSection(
        session.stay_name ? session.stay_name : 'Your stay',
        'How was your overall experience?',
        'What stood out about your stay?'
    );
    wrap.appendChild(stay.card);

    // Boat (optional)
    let boat = null;
    if (hasBoat) {
        boat = buildSection(
            session.boat_name ? session.boat_name : 'Boat rental',
            'How was the boat rental?',
            'How was the boat and the operator?'
        );
        wrap.appendChild(boat.card);
    }

    // Charters (one section per booked trip)
    const charterSections = [];
    charters.forEach((c) => {
        const title = c.charter_name || c.trip_label || 'Fishing charter';
        const subParts = [];
        if (c.trip_label) subParts.push(c.trip_label);
        if (c.dates_label) subParts.push(c.dates_label);
        const section = buildSection(
            title,
            subParts.join(' \u2022 ') || 'How was the fishing charter?',
            'How was the charter and the crew?'
        );
        section.charterId = c.charterId;
        section.tripLabel = c.trip_label;
        charterSections.push(section);
        wrap.appendChild(section.card);
    });

    // Private feedback
    const extras = el('div', 'kb-review-card');
    const privateLabel = el('label', 'kb-review-label', "Anything you'd like us to know privately? (optional)");
    const privateInput = el('textarea', 'kb-review-textarea');
    privateInput.placeholder = 'Private feedback for the Keys Booking team';
    extras.appendChild(privateLabel);
    extras.appendChild(privateInput);
    wrap.appendChild(extras);

    const errorEl = el('div', 'kb-review-error');
    const errorIcon = el('span');
    errorIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
    const errorText = el('span');
    errorEl.appendChild(errorIcon);
    errorEl.appendChild(errorText);
    wrap.appendChild(errorEl);

    const submitBtn = el('button', 'kb-review-btn', 'Submit review');
    submitBtn.type = 'button';
    wrap.appendChild(submitBtn);

    const showError = (msg) => {
        if (!msg) {
            errorEl.classList.remove('show');
            errorText.textContent = '';
            return;
        }
        errorText.textContent = msg;
        errorEl.classList.add('show');
        try {
            errorEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch (e) {
            /* no-op */
        }
    };

    submitBtn.addEventListener('click', async () => {
        showError('');

        if (stay.stars.get() < 1) {
            showError('Please rate your overall experience.');
            return;
        }
        if (!stay.comment.value.trim()) {
            showError('Please write a short review of your stay.');
            return;
        }
        if (hasBoat && boat.stars.get() < 1) {
            showError('Please rate your boat rental.');
            return;
        }
        if (hasBoat && !boat.comment.value.trim()) {
            showError('Please write a short review of your boat rental.');
            return;
        }
        for (const cs of charterSections) {
            if (cs.stars.get() < 1) {
                showError(`Please rate your ${cs.tripLabel || 'fishing charter'}.`);
                return;
            }
            if (!cs.comment.value.trim()) {
                showError(`Please write a short review of your ${cs.tripLabel || 'fishing charter'}.`);
                return;
            }
        }

        const payload = {
            token,
            stay_rating: stay.stars.get() || null,
            stay_comment: stay.comment.value.trim() || null,
            boat_rating: hasBoat ? (boat.stars.get() || null) : null,
            boat_comment: hasBoat ? (boat.comment.value.trim() || null) : null,
            charter_reviews: charterSections.map((cs) => ({
                charterId: cs.charterId,
                rating: cs.stars.get() || null,
                comment: cs.comment.value.trim() || null
            })),
            private_feedback: privateInput.value.trim() || null,
            guest_display_name: null
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const result = await submitReview(payload);
            if (result && result.success) {
                renderMessage('Thanks for the feedback!', 'Your review has been submitted \u2014 we really appreciate you taking the time.', 'success');
            } else {
                throw new Error('Could not submit your review.');
            }
        } catch (e) {
            console.error('Review submit failed:', e);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit review';
            showError(GUEST_MESSAGES.submitFailed);
        }
    });

    body.appendChild(wrap);
}

async function init() {
    ensureStyles();
    if (!getBody()) return;

    const token = getTokenFromUrl();
    if (!token) {
        renderMessage(...GUEST_MESSAGES.invalidLink, 'error');
        return;
    }

    renderLoading();

    try {
        const session = await getReviewSession(token);

        if (!session || session.can_review !== true) {
            const reason = session && session.reason;
            if (reason === 'already_submitted') {
                renderMessage("You've already reviewed this trip", 'Thanks again for your feedback.', 'success');
            } else if (reason === 'not_yet') {
                renderMessage('Your review opens after checkout', 'Come back once your trip has ended and we\u2019ll be ready for your feedback.', 'info');
            } else {
                renderMessage(...GUEST_MESSAGES.invalidLink, 'error');
            }
            return;
        }

        renderForm(token, session);
    } catch (e) {
        console.error('Review init failed:', e);
        renderMessage(...GUEST_MESSAGES.invalidLink, 'error');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
