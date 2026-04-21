/**
 * Host reservation modal: additional charges (guest payment rows, host payout rows, existing fees list, request modal).
 * Loaded after host-dashboard.js / host-reservations.js / calendar.js or inlined — see those files for integration.
 *
 * Host user id for Xano calls must match the signed-in host from Wized: each page runs
 * `await Wized.requests.waitFor('Load_user')` then sets `window.keysBookingHostUserId = Wized.data.r.Load_user.data.id`.
 * `getHostUserId()` uses that global when set, otherwise reads the same id from `Wized.data.r.Load_user` if available.
 */
(function () {
    'use strict';

    const API_BASE = 'https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX';

    // @returns {number|string|undefined} Host id from Wized Load_user (see module comment).
    function getHostUserId() {
        const g = window.keysBookingHostUserId;
        if (g != null && g !== '') return g;
        try {
            const lu = window.Wized && window.Wized.data && window.Wized.data.r && window.Wized.data.r.Load_user;
            const id = lu && lu.data && lu.data.id;
            if (id != null) {
                window.keysBookingHostUserId = id;
                return id;
            }
        } catch (_) {
            /* ignore */
        }
        return undefined;
    }

    function formatUsd(amount) {
        const n = parseFloat(amount);
        if (!Number.isFinite(n)) return '$0.00';
        return n.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /** First matching numeric field (Xano may return camelCase or snake_case). */
    function numField(obj, ...keys) {
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const v = obj[k];
            if (v == null || v === '') continue;
            const n = parseFloat(v);
            if (Number.isFinite(n)) return n;
        }
        return 0;
    }

    function hostNetOnCharge(charge) {
        const base = numField(charge, 'base_amount');
        const hostFee = numField(charge, 'hostFee_amount', 'host_fee_amount');
        return Math.max(0, base - hostFee);
    }

    /** Matches host-dashboard / host-reservations total line formatting. */
    function formatModalMoney(n) {
        const x = parseFloat(n);
        const v = Number.isFinite(x) ? x : 0;
        return v.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function sumGuestPaidAdditionalTotals(charges) {
        let s = 0;
        (charges || []).forEach((c) => {
            if ((c.status || '').toLowerCase() !== 'payment_succeeded') return;
            s += numField(c, 'total_amount');
        });
        return s;
    }

    function sumHostPaidAdditionalNet(charges) {
        let s = 0;
        (charges || []).forEach((c) => {
            if ((c.status || '').toLowerCase() !== 'payment_succeeded') return;
            s += hostNetOnCharge(c);
        });
        return s;
    }

    /**
     * After line items are filled, roll paid additional charges into the main guest total and host payout total.
     * Booking base comes from `reservation` (same as displayReservationModal). Only `payment_succeeded` fees add in
     * (pending/declined are not part of the grand total). If Xano already includes paid fees in reservation totals,
     * you would double-count — keep reservation fields booking-only or skip this.
     */
    function updateReservationModalGrandTotals(modal, reservation, charges) {
        if (!modal || !reservation) return;

        const guestAdd = sumGuestPaidAdditionalTotals(charges);
        const hostAdd = sumHostPaidAdditionalNet(charges);

        const baseGuest = parseFloat(reservation.reservation_amount_total);
        const guestTotal = (Number.isFinite(baseGuest) ? baseGuest : 0) + guestAdd;

        const nightlyTotal = parseFloat(reservation.nights_amount) || 0;
        const cleaningFee = parseFloat(reservation.cleaning_amount) || 0;
        const hostFee = parseFloat(reservation.hostFee_amount) || 0;
        const baseHost = nightlyTotal + cleaningFee - hostFee;
        const hostTotal = baseHost + hostAdd;

        const fmt = formatModalMoney;

        const guestPaymentTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_total"]');
        if (guestPaymentTotalElement && (Number.isFinite(baseGuest) || guestAdd > 0)) {
            guestPaymentTotalElement.textContent = `$${fmt(guestTotal)}`;
        }

        const hostPayoutTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_payoutTotal"]');
        if (hostPayoutTotalElement) {
            hostPayoutTotalElement.textContent = `$${fmt(hostTotal)}`;
        }

        const payoutPreviewElement = modal.querySelector('[data-element="reservationInfoModal_hostPayoutPreview"]');
        if (payoutPreviewElement && reservation.nights_amount != null) {
            if (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0) {
                payoutPreviewElement.textContent = 'Payout: $0.00';
            } else {
                payoutPreviewElement.textContent = `Payout: $${fmt(hostTotal)}`;
            }
        }

        const guestPaymentRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundNewTotal"]');
        if (guestPaymentRefundNewTotal) {
            const showGuestRefund =
                !reservation.reservation_active ||
                (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0);
            if (showGuestRefund) {
                const refundAmount = parseFloat(reservation.cancelled_refundAmount) || 0;
                guestPaymentRefundNewTotal.textContent = `$${fmt(guestTotal - refundAmount)}`;
            }
        }

        const hostPayoutRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundNewTotal"]');
        if (hostPayoutRefundNewTotal) {
            const showHostRefund = !reservation.reservation_active;
            if (showHostRefund) {
                const refundAmount =
                    reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0 ? hostTotal : 0;
                hostPayoutRefundNewTotal.textContent = `$${fmt(hostTotal - refundAmount)}`;
            }
        }
    }

    function statusStyle(status) {
        const s = (status || '').toLowerCase();
        if (s === 'payment_succeeded') {
            return { label: 'Guest paid', color: '#15803d' };
        }
        if (s === 'pending_guest' || s === 'payment_failed') {
            return { label: s === 'payment_failed' ? 'Guest payment failed' : 'Pending guest', color: '#ca8a04' };
        }
        if (s === 'declined') {
            return { label: 'Guest declined', color: '#dc2626' };
        }
        if (s === 'refunded') {
            return { label: 'Guest refunded', color: '#dc2626' };
        }
        return { label: status || '—', color: '#525252' };
    }

    function clearClones(parent, selector, attr) {
        if (!parent) return;
        parent.querySelectorAll(`[${attr}]`).forEach((el) => el.remove());
    }

    function fillGuestFeeRow(row, charge) {
        const textEl = row.querySelector('[data-element="reservationInfoModal_guestPayment_additionalFeeText"]');
        const totalEl = row.querySelector('[data-element="reservationInfoModal_guestPayment_additionalFeeTotal"]');
        const total = numField(charge, 'total_amount');
        if (textEl) textEl.textContent = charge.title || 'Additional fee';
        if (totalEl) totalEl.textContent = `$${formatUsd(total)}`;
        row.style.display = 'flex';
    }

    function fillHostPayoutFeeRow(row, charge) {
        const textEl = row.querySelector('[data-element="reservationInfoModal_hostPayout_additionalFeeText"]');
        const totalEl = row.querySelector('[data-element="reservationInfoModal_hostPayout_additionalFeeTotal"]');
        const net = hostNetOnCharge(charge);
        if (textEl) textEl.textContent = charge.title || 'Additional fee';
        if (totalEl) totalEl.textContent = `$${formatUsd(net)}`;
        row.style.display = 'flex';
    }

    function renderFeeRows(modal, charges, templateSelector, fillFn, cloneAttr) {
        const template = modal.querySelector(`[data-element="${templateSelector}"]`);
        if (!template) return;
        const parent = template.parentElement;
        clearClones(parent, null, cloneAttr);

        const paid = (charges || []).filter((c) => {
            const s = (c.status || '').toLowerCase();
            return s === 'payment_succeeded' || s === 'refunded';
        });

        if (paid.length === 0) {
            template.style.display = 'none';
            return;
        }

        fillFn(template, paid[0]);
        for (let i = 1; i < paid.length; i++) {
            const clone = template.cloneNode(true);
            clone.setAttribute(cloneAttr, 'true');
            fillFn(clone, paid[i]);
            parent.appendChild(clone);
        }
    }

    function renderExistingBlocks(modal, charges) {
        const template = modal.querySelector('[data-element="reservationInfoModal_additionalFees_existingFeeBlock"]');
        if (!template) return;
        const parent = template.parentElement;
        clearClones(parent, null, 'data-kb-existing-fee-clone');

        const list = charges || [];
        if (list.length === 0) {
            template.style.display = 'none';
            return;
        }

        function fillBlock(block, charge) {
            const titleEl = block.querySelector('[data-element="reservationInfoModal_additionalFees_existingFeeTitle"]');
            const descEl = block.querySelector('[data-element="reservationInfoModal_additionalFees_existingFeeDescription"]');
            const statusEl = block.querySelector('[data-element="reservationInfoModal_additionalFees_existingFeeStatus"]');
            if (titleEl) titleEl.textContent = charge.title || '';
            if (descEl) descEl.textContent = charge.description || '';
            if (statusEl) {
                const st = statusStyle(charge.status);
                statusEl.textContent = st.label;
                statusEl.style.color = st.color;
            }
            block.style.display = 'flex';
        }

        fillBlock(template, list[0]);
        for (let i = 1; i < list.length; i++) {
            const clone = template.cloneNode(true);
            clone.setAttribute('data-kb-existing-fee-clone', 'true');
            fillBlock(clone, list[i]);
            parent.appendChild(clone);
        }
    }

    /**
     * Optional Webflow wrapper (data-element="reservationInfoModal_additionalFees_chargesOnlyArea"):
     * put guest/host fee rows + existing-fee list inside; keep "Request additional fee" outside so the first
     * request stays available when there are zero charges.
     */
    function setChargesOnlyAreaVisibility(modal, charges) {
        const wrap = modal.querySelector('[data-element="reservationInfoModal_additionalFees_chargesOnlyArea"]');
        if (!wrap) return;
        const has = Array.isArray(charges) && charges.length > 0;
        wrap.style.display = has ? '' : 'none';
    }

    function parseJsonArrayResponse(text) {
        const t = (text || '').trim();
        if (!t) return [];
        try {
            const data = JSON.parse(t);
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.items)) return data.items;
            if (data && Array.isArray(data.reservation_additional_charges)) return data.reservation_additional_charges;
        } catch (_) {
            /* non-JSON or empty — treat as no rows */
        }
        return [];
    }

    /** Webflow may use reservationDetailsModal or reservationInfoModal for the host booking details view. */
    function getHostReservationDetailsModal() {
        return (
            document.querySelector('[data-element="reservationDetailsModal"]') ||
            document.querySelector('[data-element="reservationInfoModal"]')
        );
    }

    function scrollHostReservationDetailsModalTop(modal) {
        if (!modal) return;
        const content =
            modal.querySelector('[data-element="reservationInfoModal_content"]') ||
            modal.querySelector('[data-element="reservationDetailsModal_content"]');
        if (!content) return;
        content.scrollTop = 0;
        requestAnimationFrame(() => {
            content.scrollTop = 0;
        });
    }

    function setRequestAdditionalFeeButtonVisibility(modal, reservation) {
        if (!modal || !reservation) return;
        const btn = modal.querySelector('[data-element="reservationInfoModal_additionalFees_requestAdditionalFeeButton"]');
        if (!btn) return;
        const isActive = reservation.reservation_active === true;
        btn.style.display = isActive ? '' : 'none';
    }

    /**
     * Keeps the last full reservation object on the modal so after a successful additional-fee request we can
     * re-fetch charges and recompute totals without re-running displayReservationModal.
     */
    function mergeReservationContext(modal, reservation) {
        if (!modal || !reservation || reservation.id == null) return reservation;
        const prev = modal._keysBookingReservation;
        const sameId = prev && String(prev.id) === String(reservation.id);
        const merged = sameId ? { ...prev, ...reservation } : { ...reservation };
        modal._keysBookingReservation = merged;
        setRequestAdditionalFeeButtonVisibility(modal, merged);
        return merged;
    }

    /** Call when opening host reservation details so additional-fee flows have full totals even before the first async load finishes. */
    function setHostReservationContext(modal, reservation) {
        if (!modal || !reservation || reservation.id == null) return;
        modal._keysBookingReservation = reservation;
        modal.dataset.kbReservationId = String(reservation.id);
        setRequestAdditionalFeeButtonVisibility(modal, reservation);
    }

    async function fetchAdditionalCharges(reservationId, hostUserId) {
        if (!reservationId || !hostUserId) return [];
        const url = `${API_BASE}/additional_charges_by_reservation?reservation_id=${encodeURIComponent(reservationId)}&user_id=${encodeURIComponent(hostUserId)}&viewer_type=host`;
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const text = await res.text();
            const rows = parseJsonArrayResponse(text);
            if (Array.isArray(rows)) return rows;
            return [];
        } catch (_) {
            return [];
        }
    }

    async function loadAndRenderAdditionalCharges(modal, reservation) {
        if (!modal || !reservation || reservation.id == null) return;
        const ctx = mergeReservationContext(modal, reservation);
        const hostId = getHostUserId();
        modal.dataset.kbReservationId = String(ctx.id);
        modal.dataset.kbHostUserId = hostId != null ? String(hostId) : '';

        const charges = await fetchAdditionalCharges(ctx.id, hostId);

        renderFeeRows(
            modal,
            charges,
            'reservationInfoModal_guestPayment_additionalFeeContainer',
            fillGuestFeeRow,
            'data-kb-guest-fee-clone'
        );
        renderFeeRows(
            modal,
            charges,
            'reservationInfoModal_hostPayout_additionalFeeContainer',
            fillHostPayoutFeeRow,
            'data-kb-host-fee-clone'
        );
        renderExistingBlocks(modal, charges);
        setChargesOnlyAreaVisibility(modal, charges);
        updateReservationModalGrandTotals(modal, ctx, charges);
    }

    async function postAdditionalChargeCreate(reservationId, hostUserId, payload) {
        const body = {
            user_id: hostUserId,
            reservation_id: reservationId,
            title: payload.title,
            description: payload.description,
            base_amount: payload.base_amount
        };
        const res = await fetch(`${API_BASE}/additional_charge_create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.message || data.error || `Request failed (${res.status})`;
            throw new Error(msg);
        }
        return data;
    }

    const PRICE_INPUT_SELECTOR = '[data-element="requestAdditionalFee_priceInput"]';

    function sanitizeMoneyDigitsAfterDollar(rest) {
        if (!rest) return '';
        let s = String(rest).replace(/[^\d.]/g, '');
        const d = s.indexOf('.');
        if (d === -1) return s;
        const intPart = s.slice(0, d).replace(/\D/g, '') || '0';
        const frac = s
            .slice(d + 1)
            .replace(/\D/g, '')
            .replace(/\./g, '')
            .slice(0, 2);
        return intPart + '.' + frac;
    }

    /** Keeps a single leading `$` and only digits + one decimal point (max 2 fractional digits). */
    function formatPriceInputEl(el) {
        if (!el) return;
        if (String(el.type || '').toLowerCase() === 'number') {
            const normalized = sanitizeMoneyDigitsAfterDollar(String(el.value == null ? '' : el.value));
            if (el.value !== normalized) el.value = normalized;
            return;
        }
        let raw = el.value == null ? '' : String(el.value);
        if (!raw.startsWith('$')) {
            raw = '$' + raw.replace(/^\$*/, '');
        }
        const rest = sanitizeMoneyDigitsAfterDollar(raw.slice(1));
        const next = '$' + rest;
        if (el.value !== next) el.value = next;
    }

    function getPriceInputNumericAmount(el) {
        if (!el) return NaN;
        const raw = String(el.value || '');
        const rest = raw.startsWith('$') ? raw.slice(1) : sanitizeMoneyDigitsAfterDollar(raw);
        return parseFloat(rest);
    }

    function resolveFormControl(modal, selector) {
        const node = modal && modal.querySelector(selector);
        if (!node) return null;
        if ('value' in node) return node;
        if (node.isContentEditable || String(node.getAttribute('contenteditable') || '').toLowerCase() === 'true') {
            return node;
        }
        return node.querySelector('input, textarea, [contenteditable="true"]');
    }

    function readControlText(control) {
        if (!control) return '';
        if ('value' in control) return String(control.value || '').trim();
        return String(control.textContent || '').trim();
    }

    function readFallbackModalText(modal, excluded) {
        if (!modal) return '';
        const excludedSet = new Set((excluded || []).filter(Boolean));
        const candidates = modal.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
        for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            if (excludedSet.has(c)) continue;
            const t = readControlText(c);
            if (t) return t;
        }
        return '';
    }

    let kbPriceInputFormattingBound = false;
    function bindAdditionalFeePriceInputFormatting() {
        if (kbPriceInputFormattingBound) return;
        kbPriceInputFormattingBound = true;

        document.addEventListener('beforeinput', (e) => {
            const el = e.target;
            if (!el || !el.matches || !el.matches(PRICE_INPUT_SELECTOR)) return;

            if (e.inputType === 'insertFromPaste') return;

            if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                const end = el.selectionEnd != null ? el.selectionEnd : 0;
                if (end <= 1) {
                    e.preventDefault();
                }
                return;
            }

            if (e.inputType && e.inputType.indexOf('insert') === 0 && e.data != null && e.data !== '') {
                const rest = String(el.value || '').slice(1);
                const hasDot = rest.indexOf('.') !== -1;
                for (let i = 0; i < e.data.length; i++) {
                    const ch = e.data[i];
                    if (ch >= '0' && ch <= '9') continue;
                    if (ch === '.' && !hasDot) continue;
                    e.preventDefault();
                    return;
                }
            }
        });

        document.addEventListener('input', (e) => {
            const el = e.target;
            if (!el.matches || !el.matches(PRICE_INPUT_SELECTOR)) return;
            formatPriceInputEl(el);
        });

        document.addEventListener('paste', (e) => {
            const el = e.target;
            if (!el.matches || !el.matches(PRICE_INPUT_SELECTOR)) return;
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
            const selStart = el.selectionStart != null ? el.selectionStart : 1;
            const selEnd = el.selectionEnd != null ? el.selectionEnd : 1;
            const before = String(el.value || '').slice(1, Math.max(1, selStart));
            const after = String(el.value || '').slice(Math.max(1, selEnd));
            const inject = pasted.replace(/[^\d.]/g, '');
            const merged = sanitizeMoneyDigitsAfterDollar(before + inject + after);
            el.value = '$' + merged;
            formatPriceInputEl(el);
            try {
                el.setSelectionRange(el.value.length, el.value.length);
            } catch (_) {
                /* ignore */
            }
        });

        document.addEventListener(
            'focusin',
            (e) => {
                const el = e.target;
                if (!el.matches || !el.matches(PRICE_INPUT_SELECTOR)) return;
                if (String(el.type || '').toLowerCase() === 'number') return;
                if (!el.value || el.value === '') el.value = '$';
            },
            true
        );
    }

    let kbAdditionalFeeHandlersBound = false;
    function bindAdditionalFeeGlobalHandlers() {
        if (kbAdditionalFeeHandlersBound) return;
        kbAdditionalFeeHandlersBound = true;

        document.addEventListener('click', (e) => {
            const openBtn = e.target.closest('[data-element="reservationInfoModal_additionalFees_requestAdditionalFeeButton"]');
            if (openBtn) {
                const reservationModal = getHostReservationDetailsModal();
                const additionalModal = document.querySelector('[data-element="additionalFeeModal"]');
                if (reservationModal) reservationModal.style.display = 'none';
                if (additionalModal) {
                    additionalModal.style.display = 'flex';
                    document.body.classList.add('no-scroll');
                }
                const priceInOpen = additionalModal && additionalModal.querySelector(PRICE_INPUT_SELECTOR);
                if (priceInOpen) {
                    if (String(priceInOpen.type || '').toLowerCase() === 'number') {
                        priceInOpen.value = '';
                    } else {
                        priceInOpen.value = '$';
                    }
                }
                const err = additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_errorText"]');
                if (err) err.style.display = 'none';
                const resetLoader = additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_loader"]');
                const resetText = additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_text"]');
                const resetBtn = additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton"]');
                if (resetLoader) {
                    resetLoader.style.display = 'none';
                    resetLoader.style.visibility = 'hidden';
                }
                if (resetText) {
                    resetText.style.visibility = '';
                    resetText.style.display = '';
                }
                if (resetBtn) resetBtn.removeAttribute('disabled');
                return;
            }

            const closeBtn = e.target.closest('[data-element="close_requestAdditionalFeeModal"]');
            if (closeBtn) {
                const reservationModal = getHostReservationDetailsModal();
                const additionalModal = document.querySelector('[data-element="additionalFeeModal"]');
                if (additionalModal) {
                    additionalModal.style.display = 'none';
                    const resetLoader = additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_loader"]');
                    const resetText = additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_text"]');
                    const resetBtn = additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton"]');
                    if (resetLoader) {
                        resetLoader.style.display = 'none';
                        resetLoader.style.visibility = 'hidden';
                    }
                    if (resetText) {
                        resetText.style.visibility = '';
                        resetText.style.display = '';
                    }
                    if (resetBtn) resetBtn.removeAttribute('disabled');
                }
                if (reservationModal) reservationModal.style.display = 'flex';
                document.body.classList.remove('no-scroll');
            }
        });

        document.addEventListener('click', async (e) => {
            const createBtn = e.target.closest('[data-element="requestAdditionalFee_createRequestButton"]');
            if (!createBtn) return;

            const additionalModal = document.querySelector('[data-element="additionalFeeModal"]');
            const reservationModal = getHostReservationDetailsModal();
            const reservationId = reservationModal && reservationModal.dataset.kbReservationId;
            const hostUserId = getHostUserId();

            const titleIn = resolveFormControl(additionalModal, '[data-element="requestAdditionalFee_titleInput"]');
            const descIn = resolveFormControl(additionalModal, '[data-element="requestAdditionalFee_descriptionInput"]');
            const priceIn = resolveFormControl(additionalModal, '[data-element="requestAdditionalFee_priceInput"]');
            const errEl = additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_errorText"]');
            const loader =
                createBtn.querySelector('[data-element="requestAdditionalFee_createRequestButton_loader"]') ||
                (additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_loader"]'));
            const btnText =
                createBtn.querySelector('[data-element="requestAdditionalFee_createRequestButton_text"]') ||
                (additionalModal && additionalModal.querySelector('[data-element="requestAdditionalFee_createRequestButton_text"]'));

            const title = readControlText(titleIn);
            let description = readControlText(descIn);
            if (!description) {
                description = readFallbackModalText(additionalModal, [titleIn, priceIn]);
            }
            if (priceIn) formatPriceInputEl(priceIn);
            const baseAmount = getPriceInputNumericAmount(priceIn);

            console.log('[additional-fee:create] raw inputs', {
                titleRaw: titleIn ? titleIn.value : null,
                descriptionRaw: descIn ? descIn.value : null,
                priceRaw: priceIn ? priceIn.value : null,
                priceType: priceIn ? priceIn.type : null,
                reservationId,
                hostUserId
            });
            console.log('[additional-fee:create] parsed inputs', {
                title,
                description,
                baseAmount,
                isFiniteBaseAmount: Number.isFinite(baseAmount),
                hasTitle: !!title,
                hasDescription: !!description
            });

            if (!title || !description || !Number.isFinite(baseAmount) || baseAmount <= 0) {
                console.warn('[additional-fee:create] validation failed', {
                    hasTitle: !!title,
                    hasDescription: !!description,
                    isFiniteBaseAmount: Number.isFinite(baseAmount),
                    baseAmount
                });
                if (errEl) {
                    errEl.textContent = 'Please enter a title, description, and a valid price.';
                    errEl.style.display = 'block';
                }
                return;
            }
            if (errEl) errEl.style.display = 'none';
            if (btnText) {
                btnText.style.visibility = 'hidden';
                btnText.style.display = 'none';
            }
            if (loader) {
                loader.style.display = 'flex';
                loader.style.visibility = 'visible';
            }
            createBtn.setAttribute('disabled', 'true');

            try {
                console.log('[additional-fee:create] posting request', {
                    reservationIdParsed: parseInt(reservationId, 10),
                    hostUserId,
                    title,
                    description,
                    base_amount: baseAmount
                });
                await postAdditionalChargeCreate(parseInt(reservationId, 10), hostUserId, {
                    title,
                    description,
                    base_amount: baseAmount
                });
                console.log('[additional-fee:create] create success');
                if (additionalModal) additionalModal.style.display = 'none';
                const detailsModal = getHostReservationDetailsModal();
                if (detailsModal) {
                    detailsModal.style.display = 'flex';
                    const rid = detailsModal.dataset.kbReservationId || reservationId;
                    if (rid && getHostUserId()) {
                        await loadAndRenderAdditionalCharges(detailsModal, { id: parseInt(String(rid), 10) });
                    }
                    scrollHostReservationDetailsModalTop(detailsModal);
                }
                document.body.classList.remove('no-scroll');
                if (titleIn) titleIn.value = '';
                if (descIn) descIn.value = '';
                if (priceIn) {
                    if (String(priceIn.type || '').toLowerCase() === 'number') {
                        priceIn.value = '';
                    } else {
                        priceIn.value = '$';
                    }
                }
            } catch (err) {
                console.error(err);
                console.error('[additional-fee:create] create failed', {
                    message: err && err.message ? err.message : String(err)
                });
                if (errEl) {
                    errEl.textContent = err.message || 'Could not create request.';
                    errEl.style.display = 'block';
                }
            } finally {
                if (loader) {
                    loader.style.display = 'none';
                    loader.style.visibility = 'hidden';
                }
                if (btnText) {
                    btnText.style.visibility = '';
                    btnText.style.display = '';
                }
                createBtn.removeAttribute('disabled');
            }
        });
    }

    window.keysBookingAdditionalCharges = {
        loadAndRenderAdditionalCharges,
        bindAdditionalFeeGlobalHandlers,
        updateReservationModalGrandTotals,
        setHostReservationContext
    };

    function runWhenDomReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function hideAdditionalFeeModalLoadersOnLoad() {
        document.querySelectorAll('[data-element="additionalFeeModal"]').forEach((modal) => {
            const loader = modal.querySelector('[data-element="requestAdditionalFee_createRequestButton_loader"]');
            if (loader) {
                loader.style.display = 'none';
                loader.style.visibility = 'hidden';
            }
        });
    }

    runWhenDomReady(() => {
        bindAdditionalFeePriceInputFormatting();
        bindAdditionalFeeGlobalHandlers();
        hideAdditionalFeeModalLoadersOnLoad();
        document.querySelectorAll(PRICE_INPUT_SELECTOR).forEach((el) => {
            if (String(el.type || '').toLowerCase() === 'number') {
                formatPriceInputEl(el);
            } else {
                if (!el.value || el.value.trim() === '') el.value = '$';
                else formatPriceInputEl(el);
            }
        });
    });
})();
