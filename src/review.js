const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

const BRAND = '#9ecaff';
const STAR_ON = '#f5a623';
const STAR_OFF = '#d8d8d8';

let IS_MOCK = false;

function $(name) {
    return document.querySelector(`[data-element="${name}"]`);
}

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('token') || '').trim();
}

function isMockFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mock') === '1' || params.get('preview') === '1';
}

function getMockSession() {
    return {
        can_review: true,
        guest_first_name: 'John',
        reservation_id: 0,
        stay_name: 'Sombrero Beach Chic',
        has_stay: true,
        has_boat: true,
        has_charter: true,
        boat_name: '28ft Dusky Center Console',
        charter_names: ['Big Game Sportfishing']
    };
}

function ensureStyles() {
    if (document.getElementById('kb-review-styles')) return;
    const style = document.createElement('style');
    style.id = 'kb-review-styles';
    style.textContent = `
        .kb-review-wrap { width: 100%; max-width: 560px; margin: 0 auto; padding: 32px 20px 64px; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #111; }
        .kb-review-wrap * { box-sizing: border-box; }
        .kb-review-title { font-size: 26px; line-height: 1.25; font-weight: 700; margin: 0 0 6px; }
        .kb-review-sub { font-size: 15px; color: #555; margin: 0 0 24px; }
        .kb-review-card { border: 1px solid #e6e6e6; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .kb-review-card h3 { font-size: 17px; font-weight: 700; margin: 0 0 2px; }
        .kb-review-card .kb-card-sub { font-size: 13px; color: #777; margin: 0 0 14px; }
        .kb-stars { display: inline-flex; gap: 4px; margin-bottom: 12px; }
        .kb-star { font-size: 30px; line-height: 1; background: none; border: none; padding: 0; cursor: pointer; color: ${STAR_OFF}; transition: color .12s ease; }
        .kb-star.on { color: ${STAR_ON}; }
        .kb-review-label { display: block; font-size: 13px; font-weight: 600; color: #444; margin: 4px 0 6px; }
        .kb-review-input, .kb-review-textarea { width: 100%; border: 1px solid #d8d8d8; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; color: #111; resize: vertical; }
        .kb-review-input:focus, .kb-review-textarea:focus { outline: none; border-color: ${BRAND}; }
        .kb-review-textarea { min-height: 84px; }
        .kb-review-btn { display: block; width: 100%; border: 1px solid #e2e2e2; border-radius: 8px; background: ${BRAND}; color: #000; font-size: 16px; font-weight: 600; padding: 15px 20px; cursor: pointer; margin-top: 8px; transition: opacity .12s ease; }
        .kb-review-btn:disabled { opacity: .6; cursor: default; }
        .kb-review-error { color: #dc2626; font-size: 14px; margin: 10px 0 0; display: none; }
        .kb-review-state { width: 100%; max-width: 480px; margin: 0 auto; padding: 60px 24px; text-align: center; font-family: Arial, Helvetica, sans-serif; color: #111; }
        .kb-review-state h1 { font-size: 24px; font-weight: 700; margin: 0 0 10px; }
        .kb-review-state p { font-size: 15px; color: #555; margin: 0; }
        .kb-review-spinner { width: 36px; height: 36px; border: 3px solid rgba(0,0,0,.12); border-top-color: #111; border-radius: 50%; margin: 0 auto; animation: kb-review-spin .8s linear infinite; }
        @keyframes kb-review-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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

function renderMessage(title, subtitle) {
    ensureStyles();
    const body = clearBody();
    if (!body) return;
    const wrap = el('div', 'kb-review-state');
    wrap.appendChild(el('h1', null, title));
    if (subtitle) wrap.appendChild(el('p', null, subtitle));
    body.appendChild(wrap);
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
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || data.error || 'Could not load your review.');
    return data;
}

async function submitReview(payload) {
    if (IS_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { success: true };
    }
    const res = await fetch(`${API_BASE}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Could not submit your review.');
    return data;
}

function renderForm(token, session) {
    ensureStyles();
    const body = clearBody();
    if (!body) return;

    const firstName = session.guest_first_name || '';
    const hasBoat = session.has_boat === true;
    const hasCharter = session.has_charter === true;

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

    // Charter (optional)
    let charter = null;
    if (hasCharter) {
        const charterTitle = Array.isArray(session.charter_names) && session.charter_names.length
            ? session.charter_names.join(', ')
            : 'Fishing charter';
        charter = buildSection(
            charterTitle,
            'How was the fishing charter?',
            'How was the charter and the crew?'
        );
        wrap.appendChild(charter.card);
    }

    // Display name + private feedback
    const extras = el('div', 'kb-review-card');
    const nameLabel = el('label', 'kb-review-label', 'Display name for your review');
    const nameInput = el('input', 'kb-review-input');
    nameInput.type = 'text';
    nameInput.value = firstName;
    nameInput.placeholder = 'e.g. John';
    extras.appendChild(nameLabel);
    extras.appendChild(nameInput);

    const privateLabel = el('label', 'kb-review-label', "Anything you'd like us to know privately? (optional)");
    privateLabel.style.marginTop = '14px';
    const privateInput = el('textarea', 'kb-review-textarea');
    privateInput.placeholder = 'Private feedback for the Keys Booking team';
    extras.appendChild(privateLabel);
    extras.appendChild(privateInput);
    wrap.appendChild(extras);

    const errorEl = el('p', 'kb-review-error');
    wrap.appendChild(errorEl);

    const submitBtn = el('button', 'kb-review-btn', 'Submit review');
    submitBtn.type = 'button';
    wrap.appendChild(submitBtn);

    const showError = (msg) => {
        if (!msg) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
            return;
        }
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    };

    submitBtn.addEventListener('click', async () => {
        showError('');

        if (stay.stars.get() < 1) {
            showError('Please rate your overall experience.');
            return;
        }
        if (hasBoat && boat.stars.get() < 1) {
            showError('Please rate your boat rental.');
            return;
        }
        if (hasCharter && charter.stars.get() < 1) {
            showError('Please rate your fishing charter.');
            return;
        }

        const payload = {
            token,
            stay_rating: stay.stars.get() || null,
            stay_comment: stay.comment.value.trim() || null,
            boat_rating: hasBoat ? (boat.stars.get() || null) : null,
            boat_comment: hasBoat ? (boat.comment.value.trim() || null) : null,
            charter_rating: hasCharter ? (charter.stars.get() || null) : null,
            charter_comment: hasCharter ? (charter.comment.value.trim() || null) : null,
            private_feedback: privateInput.value.trim() || null,
            guest_display_name: nameInput.value.trim() || null
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const result = await submitReview(payload);
            if (result && result.success) {
                renderMessage('Thanks for the feedback', 'We really appreciate it.');
            } else {
                throw new Error('Could not submit your review.');
            }
        } catch (e) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit review';
            showError(e.message || 'Could not submit your review. Please try again.');
        }
    });

    body.appendChild(wrap);
}

async function init() {
    ensureStyles();
    if (!getBody()) return;

    if (isMockFromUrl()) {
        IS_MOCK = true;
        renderForm('mock', getMockSession());
        return;
    }

    const token = getTokenFromUrl();
    if (!token) {
        renderMessage('Invalid review link', 'This link is missing its review token.');
        return;
    }

    renderLoading();

    try {
        const session = await getReviewSession(token);

        if (!session || session.can_review !== true) {
            const reason = session && session.reason;
            if (reason === 'already_submitted') {
                renderMessage("You've already reviewed this trip", 'Thanks again for your feedback.');
            } else if (reason === 'not_yet') {
                renderMessage('Your review opens after checkout', 'Come back once your trip has ended and we\u2019ll be ready for your feedback.');
            } else {
                renderMessage('Invalid review link', 'We couldn\u2019t find a reservation for this link.');
            }
            return;
        }

        renderForm(token, session);
    } catch (e) {
        renderMessage('Something went wrong', e.message || 'Please try opening your review link again.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
