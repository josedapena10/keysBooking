// Host additional charges modal (inlined; canonical copy: src/host-additional-charges-modal.js)
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

// Host Navigation Dropdown functionality
(async function () {
    try {
        const hostNavBarBlock = document.querySelector('[data-element="hostNavBar_navBarBlock"]');
        const hostNavBarDropdown = document.querySelector('[data-element="hostNavBar_dropdown"]');
        const hostNavBarBlockText = document.querySelector('[data-element="hostNavBar_navBarBlockText"]');
        let isHostDropdownOpen = false;

        if (!hostNavBarBlock || !hostNavBarDropdown) return;

        // Close the dropdown initially
        hostNavBarDropdown.style.display = 'none';

        // Function to get current page from URL
        const getCurrentPage = () => {
            const path = window.location.pathname;
            if (path.includes('/host/dashboard')) return 'dashboard';
            if (path.includes('/host/listings')) return 'listings';
            if (path.includes('/host/calendar')) return 'calendar';
            if (path.includes('/host/reservations')) return 'reservations';
            return null;
        };

        // Function to update the navbar block text and hide current page from dropdown
        const updateNavBarForCurrentPage = () => {
            const currentPage = getCurrentPage();
            const dashboardItem = document.querySelector('[data-element="hostNavBar_dashboard"]');
            const listingsItem = document.querySelector('[data-element="hostNavBar_listings"]');
            const calendarItem = document.querySelector('[data-element="hostNavBar_calendar"]');
            const reservationsItem = document.querySelector('[data-element="hostNavBar_reservations"]');

            // Show all items first
            [dashboardItem, listingsItem, calendarItem, reservationsItem].forEach(item => {
                if (item) item.style.display = 'block';
            });

            // Update text and hide current page item
            switch (currentPage) {
                case 'dashboard':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Dashboard';
                    if (dashboardItem) dashboardItem.style.display = 'none';
                    break;
                case 'listings':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Listings';
                    if (listingsItem) listingsItem.style.display = 'none';
                    break;
                case 'calendar':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Calendar';
                    if (calendarItem) calendarItem.style.display = 'none';
                    break;
                case 'reservations':
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Reservations';
                    if (reservationsItem) reservationsItem.style.display = 'none';
                    break;
                default:
                    if (hostNavBarBlockText) hostNavBarBlockText.textContent = 'Host';
                    break;
            }
        };

        // Initialize the navbar for current page
        updateNavBarForCurrentPage();

        // Function to toggle the dropdown
        const toggleHostDropdown = () => {
            isHostDropdownOpen = !isHostDropdownOpen;
            hostNavBarDropdown.style.display = isHostDropdownOpen ? 'flex' : 'none';
        };

        // Event listener for host navbar block click
        hostNavBarBlock.addEventListener('click', function () {
            toggleHostDropdown();
        });

        // Event listener for body click to close the dropdown
        document.body.addEventListener('click', function (evt) {
            if (!hostNavBarBlock.contains(evt.target) && !hostNavBarDropdown.contains(evt.target)) {
                isHostDropdownOpen = false;
                hostNavBarDropdown.style.display = 'none';
            }
        });

        // Navigation handlers
        const setupNavigationHandler = (elementSelector, targetPath) => {
            const element = document.querySelector(`[data-element="${elementSelector}"]`);
            if (element) {
                element.addEventListener('click', function () {
                    isHostDropdownOpen = false;
                    hostNavBarDropdown.style.display = 'none';
                    window.location.href = targetPath;
                });
            }
        };

        // Setup navigation handlers for each menu item
        setupNavigationHandler('hostNavBar_dashboard', '/host/dashboard');
        setupNavigationHandler('hostNavBar_listings', '/host/listings');
        setupNavigationHandler('hostNavBar_calendar', '/host/calendar');
        setupNavigationHandler('hostNavBar_reservations', '/host/reservations');

    } catch (err) {
        console.error('Host navigation dropdown error:', err);
    }
})();

// Initialize loader on page load
(function () {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader) {
        loader.style.display = 'flex';
    }
})();

// Track when content is visually loaded
let contentVisuallyLoaded = false;
let dataFetchingComplete = false;

// Function to hide loader only when both conditions are met
function checkAndHideLoader() {
    const loader = document.querySelector('[data-element="loader"]');
    if (loader && contentVisuallyLoaded && dataFetchingComplete) {
        // Use requestAnimationFrame twice to ensure all rendering and layout is complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Add a small additional delay to ensure all dynamic content has settled
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 100);
            });
        });
    }
}

// Wait for all visual content to load (images, fonts, etc.)
window.addEventListener('load', () => {
    contentVisuallyLoaded = true;
    checkAndHideLoader();
});

// Initialize Wized and get host ID
window.Wized = window.Wized || [];
window.Wized.push((async (Wized) => {
    await Wized.requests.waitFor('Load_user');
    const hostId = Wized.data.r.Load_user.data.id;
    window.keysBookingHostUserId = hostId;

    // Use Promise.all to track when both data fetches complete
    await Promise.all([
        initializeReservations(hostId),
        initializeNotifications(hostId)
    ]);

    // Mark data fetching as complete
    dataFetchingComplete = true;
    checkAndHideLoader();
}));


// Main function to fetch and display reservations
async function initializeReservations(hostId) {
    try {
        // Fetch reservations
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/host_reservations?host_id=${hostId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            window.location.href = '/404';
            //throw new Error('Failed to fetch reservations');
        }

        const data = await response.json();

        // Extract reservations from active_reservations - handle nested array structure
        // active_reservations is an array of arrays, so we need to flatten it
        const activeReservationsArrays = data.active_reservations || [];
        const reservations = activeReservationsArrays.flat() || [];

        processAndDisplayReservations(reservations);

    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

// Function to process and display reservations
function processAndDisplayReservations(reservations) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Get today as YYYY-MM-DD
    const currentReservations = [];
    const upcomingReservations = [];

    // Check if reservations is defined and is an array before using forEach
    if (Array.isArray(reservations)) {
        // Sort reservations into current and upcoming
        reservations.forEach(reservation => {
            // Extract dates as YYYY-MM-DD
            const checkInStr = reservation.check_in.split('T')[0];
            const checkOutStr = reservation.check_out.split('T')[0];

            // Compare date strings
            if (todayStr >= checkInStr && todayStr <= checkOutStr) {
                currentReservations.push(reservation);
            } else if (checkInStr > todayStr) {
                upcomingReservations.push(reservation);
            }
        });
    }

    // Sort both arrays by check-in date
    const sortByCheckIn = (a, b) => {
        const aDate = a.check_in.split('T')[0];
        const bDate = b.check_in.split('T')[0];
        return aDate.localeCompare(bDate);
    };
    currentReservations.sort(sortByCheckIn);
    upcomingReservations.sort(sortByCheckIn);

    // Set up toggle buttons
    const currentButton = document.getElementById('hostDashboard_reservations_current');
    const upcomingButton = document.getElementById('hostDashboard_reservations_upcoming');

    // Default to showing current reservations
    currentButton.classList.add('clicked');
    displayReservations(currentReservations, true);

    // Add click handlers
    currentButton.addEventListener('click', () => {
        currentButton.classList.add('clicked');
        upcomingButton.classList.remove('clicked');
        displayReservations(currentReservations, true);
    });

    upcomingButton.addEventListener('click', () => {
        upcomingButton.classList.add('clicked');
        currentButton.classList.remove('clicked');
        displayReservations(upcomingReservations, false);
    });
}

// Function to display reservations
function displayReservations(reservations, isCurrent) {
    const templateBlock = document.querySelector('[data-element="hostDashboard_reservationBlock"]');
    const noReservationsBlock = document.querySelector('[data-element="hostDashboard_noReservations"]');
    const noReservationsText = document.querySelector('[data-element="hostDashboard_noReservations_text"]');

    // Find the container - either the one with the specific attribute or the parent of the template
    const container = document.querySelector('[data-element="hostDashboard_reservationContainer"]') ||
        (templateBlock && templateBlock.parentElement);

    // Check if container exists
    if (!container) {
        console.error('Reservation container not found');
        return;
    }

    // Clear the container first, but preserve the template block and no reservations block
    const originalTemplateBlock = templateBlock ? templateBlock.cloneNode(true) : null;
    const originalNoReservationsBlock = noReservationsBlock ? noReservationsBlock.cloneNode(true) : null;
    container.innerHTML = '';

    // Add the template block back to the container (but keep it hidden)
    if (originalTemplateBlock) {
        originalTemplateBlock.style.display = 'none';
        container.appendChild(originalTemplateBlock);
    }

    // Add the no reservations block back to the container
    if (originalNoReservationsBlock) {
        container.appendChild(originalNoReservationsBlock);
        // Initially hide the no reservations block
        originalNoReservationsBlock.style.display = 'none';
    }

    // Check if there are no reservations to display
    if (!reservations || reservations.length === 0) {
        // Show the no reservations block with appropriate message
        if (originalNoReservationsBlock) {
            const textElement = originalNoReservationsBlock.querySelector('[data-element="hostDashboard_noReservations_text"]');
            if (textElement) {
                originalNoReservationsBlock.style.display = 'flex';
                textElement.style.fontFamily = 'TT Fors';
                textElement.style.fontSize = '15px';
                textElement.style.fontWeight = '500';
                if (isCurrent) {
                    textElement.textContent = "There are no active reservations right now.";
                } else {
                    textElement.textContent = "There are no upcoming reservations right now.";
                }
            } else {
                // Fallback if text element doesn't exist within the block
                originalNoReservationsBlock.style.display = 'flex';
                originalNoReservationsBlock.textContent = 'No reservations to display';
                originalNoReservationsBlock.style.fontFamily = 'TT Fors';
                originalNoReservationsBlock.style.fontSize = '15px';
                originalNoReservationsBlock.style.fontWeight = '500';
            }
        } else {
            // Fallback if the no reservations block doesn't exist
            const fallbackMessage = document.createElement('div');
            fallbackMessage.textContent = 'No reservations to display';
            fallbackMessage.style.fontFamily = 'TT Fors';
            fallbackMessage.style.fontSize = '15px';
            fallbackMessage.style.fontWeight = '500';
            container.appendChild(fallbackMessage);
        }
        return;
    }

    // If we have reservations but no template block, we can't proceed
    if (!originalTemplateBlock) {
        console.error('Reservation template block not found');
        return;
    }

    // Hide the no reservations block when there are reservations
    if (originalNoReservationsBlock) {
        originalNoReservationsBlock.style.display = 'none';
    }

    reservations.forEach(reservation => {
        const block = originalTemplateBlock.cloneNode(true);
        block.style.display = ''; // Make the cloned block visible
        block.classList.add('open_modal'); // Add open_modal class to each block

        const arrivalTime = block.querySelector('[data-element="hostDashboard_reservationBlock_arrivalTime"]');
        const homeTitle = block.querySelector('[data-element="hostDashboard_reservationBlock_homeTitle"]');
        const guestName = block.querySelector('[data-element="hostDashboard_reservationBlock_guestName"]');
        const dates = block.querySelector('[data-element="hostDashboard_reservationBlock_dates"]');
        const phoneNumber = block.querySelector('[data-element="hostDashboard_reservationBlock_phoneNumber"]');

        // Set home title
        if (reservation._host_property[0]?.property_name) {
            homeTitle.textContent = reservation._host_property[0].property_name;
        }

        // Set guest name
        if (reservation._guest_user?.First_Name && reservation._guest_user?.Last_Name) {
            guestName.textContent = `${reservation._guest_user.First_Name} ${reservation._guest_user.Last_Name}`;
        }

        // Extract dates as YYYY-MM-DD
        const checkInDate = reservation.check_in.split('T')[0];
        const checkOutDate = reservation.check_out.split('T')[0];

        // Parse dates without creating Date objects
        const checkInYear = parseInt(checkInDate.substring(0, 4));
        const checkInMonth = parseInt(checkInDate.substring(5, 7)) - 1; // 0-based month index
        const checkInDay = parseInt(checkInDate.substring(8, 10));

        const checkOutYear = parseInt(checkOutDate.substring(0, 4));
        const checkOutMonth = parseInt(checkOutDate.substring(5, 7)) - 1; // 0-based month index
        const checkOutDay = parseInt(checkOutDate.substring(8, 10));

        // Manually format the dates
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const checkInMonthStr = months[checkInMonth];
        const checkOutMonthStr = months[checkOutMonth];

        const checkInStr = `${checkInMonthStr}. ${checkInDay}`;
        const checkOutStr = `${checkOutMonthStr}. ${checkOutDay}`;
        dates.textContent = `${checkInStr} - ${checkOutStr}`;

        // Format and set phone number
        if (reservation.twilio_proxy_number) {
            const phone = reservation.twilio_proxy_number.replace(/\D/g, ''); // Remove non-digits
            const formattedPhone = `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
            phoneNumber.textContent = formattedPhone;
        }

        // Set arrival time text
        if (isCurrent) {
            arrivalTime.textContent = 'Currently hosting';
        } else {
            // Calculate days until arrival without creating Date objects
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth() + 1; // 1-based month
            const todayDay = today.getDate();

            // Convert to YYYY-MM-DD format for comparison
            const todayStr = `${todayYear}-${todayMonth.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`;

            // Calculate days difference using string comparison and manual calculation
            const daysUntilArrival = calculateDaysDifference(todayStr, checkInDate);
            arrivalTime.textContent = daysUntilArrival === 1 ? 'Arrives in 1 day' : `Arrives in ${daysUntilArrival} days`;
        }

        // Add click event to open reservation details modal
        block.addEventListener('click', () => {
            displayReservationModal(reservation);
        });

        container.appendChild(block);
    });

    // Helper function to calculate days difference without Date objects
    function calculateDaysDifference(startDateStr, endDateStr) {
        // Parse dates
        const startYear = parseInt(startDateStr.substring(0, 4));
        const startMonth = parseInt(startDateStr.substring(5, 7));
        const startDay = parseInt(startDateStr.substring(8, 10));

        const endYear = parseInt(endDateStr.substring(0, 4));
        const endMonth = parseInt(endDateStr.substring(5, 7));
        const endDay = parseInt(endDateStr.substring(8, 10));

        // For simplicity, we'll use Date objects just for the calculation
        // In a real implementation, you might want to use a more complex algorithm
        // that doesn't rely on Date objects at all
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);

        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
}

// Function to update and display the reservation modal
function displayReservationModal(reservation) {
    const modal = document.querySelector('[data-element="reservationInfoModal"]');
    if (!modal) return;

    if (window.keysBookingAdditionalCharges && typeof window.keysBookingAdditionalCharges.setHostReservationContext === 'function') {
        window.keysBookingAdditionalCharges.setHostReservationContext(modal, reservation);
    }

    // Update modal information
    const nameElement = modal.querySelector('[data-element="reservationInfoModal_name"]');
    if (nameElement && reservation._guest_user?.First_Name && reservation._guest_user?.Last_Name) {
        nameElement.textContent = `${reservation._guest_user.First_Name} ${reservation._guest_user.Last_Name}`;
    }

    // Update property name
    const propertyNameElement = modal.querySelector('[data-element="reservationInfoModal_propertyName"]');
    if (propertyNameElement && reservation._host_property[0]?.property_name) {
        propertyNameElement.textContent = reservation._host_property[0]?.property_name;
    }

    const propertyDatesElement = modal.querySelector('[data-element="reservationInfoModal_dates"]');
    if (propertyDatesElement && reservation.check_in && reservation.check_out) {
        // Extract dates as YYYY-MM-DD
        const checkInStr = reservation.check_in.split('T')[0];
        const checkOutStr = reservation.check_out.split('T')[0];

        // Parse dates for display
        const checkInParts = checkInStr.split('-');
        const checkOutParts = checkOutStr.split('-');

        // Calculate number of nights using the date difference
        const checkInDate = new Date(checkInStr);
        const checkOutDate = new Date(checkOutStr);
        const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        // Format for display (using month abbreviation and day)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const checkInMonth = months[parseInt(checkInParts[1]) - 1];
        const checkOutMonth = months[parseInt(checkOutParts[1]) - 1];
        const checkInDay = parseInt(checkInParts[2]);
        const checkOutDay = parseInt(checkOutParts[2]);

        // Check if the check-in and check-out months are different
        if (checkInParts[1] !== checkOutParts[1]) {
            propertyDatesElement.textContent = `${checkInMonth} ${checkInDay} – ${checkOutMonth} ${checkOutDay} (${nights} nights)`;
        } else {
            propertyDatesElement.textContent = `${checkInMonth} ${checkInDay} – ${checkOutDay} (${nights} nights)`;
        }
    }

    // Update current status
    const statusElement = modal.querySelector('[data-element="reservationInfoModal_currentStatus"]');
    if (statusElement && reservation.check_in && reservation.check_out) {
        // Check if reservation is cancelled
        if (reservation.reservation_active === false) {
            statusElement.textContent = "Reservation Cancelled";
        } else {
            // Extract dates as YYYY-MM-DD
            const todayStr = new Date().toISOString().split('T')[0];
            const checkInStr = reservation.check_in.split('T')[0];
            const checkOutStr = reservation.check_out.split('T')[0];

            if (todayStr >= checkInStr && todayStr <= checkOutStr) {
                statusElement.textContent = "Currently Hosting";
            } else {
                statusElement.textContent = "Reservation Active";
            }
        }
    }

    const guestsPreviewElement = modal.querySelector('[data-element="reservationInfoModal_guestsPreview"]');
    if (guestsPreviewElement && reservation.guests) {
        guestsPreviewElement.textContent = `${reservation.guests} guests`;
    }
    const payoutPreviewElement = modal.querySelector('[data-element="reservationInfoModal_hostPayoutPreview"]');
    if (payoutPreviewElement && reservation.nights_amount) {
        // Make sure all values exist and are numbers, defaulting to 0 if undefined
        const nightsAmount = parseFloat(reservation.nights_amount) || 0;
        const cleaningFee = parseFloat(reservation.cleaning_amount) || 0;
        const hostFee = parseFloat(reservation.hostFee_amount) || 0;

        // Check if this is a cancelled reservation with a refund
        if (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0) {
            payoutPreviewElement.textContent = `Payout: $0.00`;
        } else {
            const totalPayout = nightsAmount + cleaningFee - hostFee;
            // Format to 2 decimal places with thousands separator
            const formattedPayout = totalPayout.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            payoutPreviewElement.textContent = `Payout: $${formattedPayout}`;
        }
    }

    const messagingElement = modal.querySelector('[data-element="reservationInfoModal_proxyNumber"]');
    if (messagingElement && reservation.twilio_proxy_number) {
        // Format the phone number as +X (XXX) XXX-XXXX
        const phoneNumber = reservation.twilio_proxy_number;
        // Remove any non-digit characters
        const digitsOnly = phoneNumber.replace(/\D/g, '');

        // Check if we have enough digits to format
        if (digitsOnly.length >= 10) {
            // Extract parts of the phone number
            const countryCode = digitsOnly.length > 10 ? `+${digitsOnly.slice(0, digitsOnly.length - 10)}` : '+1';
            const areaCode = digitsOnly.slice(-10, -7);
            const firstPart = digitsOnly.slice(-7, -4);
            const secondPart = digitsOnly.slice(-4);

            // Format the phone number
            const formattedNumber = `${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
            messagingElement.textContent = formattedNumber;
        } else {
            // If the number doesn't have enough digits, display it as is
            messagingElement.textContent = phoneNumber;
        }
    }

    const checkInDateElement = modal.querySelector('[data-element="reservationInfoModal_checkIn"]');
    if (checkInDateElement && reservation.check_in) {
        // Extract date as YYYY-MM-DD
        const checkInDate = reservation.check_in.split('T')[0];

        // Parse date without creating Date objects
        const checkInYear = parseInt(checkInDate.substring(0, 4));
        const checkInMonth = parseInt(checkInDate.substring(5, 7)) - 1; // 0-based month index
        const checkInDay = parseInt(checkInDate.substring(8, 10));

        // Manually format the date
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${months[checkInMonth]} ${checkInDay}, ${checkInYear}`;

        checkInDateElement.textContent = formattedDate;
    }

    const checkOutDateElement = modal.querySelector('[data-element="reservationInfoModal_checkout"]');
    if (checkOutDateElement && reservation.check_out) {
        // Extract date as YYYY-MM-DD
        const checkOutDate = reservation.check_out.split('T')[0];

        // Parse date without creating Date objects
        const checkOutYear = parseInt(checkOutDate.substring(0, 4));
        const checkOutMonth = parseInt(checkOutDate.substring(5, 7)) - 1; // 0-based month index
        const checkOutDay = parseInt(checkOutDate.substring(8, 10));

        // Manually format the date
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${months[checkOutMonth]} ${checkOutDay}, ${checkOutYear}`;

        checkOutDateElement.textContent = formattedDate;
    }

    const guestsElement = modal.querySelector('[data-element="reservationInfoModal_guests"]');
    if (guestsElement) {
        let guestDetails = [];

        // Add adult guests if present
        if (reservation.adult_guests && reservation.adult_guests > 0) {
            guestDetails.push(`${reservation.adult_guests} Adult${reservation.adult_guests !== 1 ? 's' : ''}`);
        }

        // Add children if present
        if (reservation.children_guests && reservation.children_guests > 0) {
            guestDetails.push(`${reservation.children_guests} Child${reservation.children_guests !== 1 ? 'ren' : ''}`);
        }

        // Add infants if present
        if (reservation.infant_guests && reservation.infant_guests > 0) {
            guestDetails.push(`${reservation.infant_guests} Infant${reservation.infant_guests !== 1 ? 's' : ''}`);
        }

        // Add pets if present
        if (reservation.pet_guests && reservation.pet_guests > 0) {
            guestDetails.push(`${reservation.pet_guests} Pet${reservation.pet_guests !== 1 ? 's' : ''}`);
        }

        // If no specific guest details are available, fall back to total guests
        if (guestDetails.length === 0 && reservation.guests) {
            guestsElement.textContent = `${reservation.guests} guests`;
        } else {
            guestsElement.textContent = guestDetails.join(', ');
        }
    }

    const reservationCodeElement = modal.querySelector('[data-element="reservationInfoModal_reservationCode"]');
    if (reservationCodeElement && reservation.reservation_code) {
        reservationCodeElement.textContent = `${reservation.reservation_code}`;
    }

    const reservedOnElement = modal.querySelector('[data-element="reservationInfoModal_reservedOn"]');
    if (reservedOnElement && reservation.created_at) {
        reservedOnElement.textContent = new Date(reservation.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const cancellationPolicyTypeElement = modal.querySelector('[data-element="reservationInfoModal_cancellationPolicyType"]');
    if (cancellationPolicyTypeElement && reservation.cancellationPolicy_type) {
        let policyText = reservation.cancellationPolicy_type;

        // Check if reservation is not active and has a cancellation refund date
        if (reservation.reservation_active === false && reservation.cancelled_refundDate) {
            // Extract the date in YYYY-MM-DD format
            const refundDateStr = reservation.cancelled_refundDate.split('T')[0];

            // Parse the date components
            const [year, month, day] = refundDateStr.split('-').map(num => parseInt(num, 10));

            // Format the date as "Month Day, Year"
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const formattedRefundDate = `${months[month - 1]} ${day}, ${year}`;

            // Append the formatted date to the policy text
            policyText += ` - Cancelled on ${formattedRefundDate}`;
        }

        cancellationPolicyTypeElement.textContent = policyText;
    }

    const guestPaymentNightsTextElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_nightsText"]');
    if (guestPaymentNightsTextElement && reservation.nights_amount) {
        // Use the reservation's check_in and check_out dates directly
        if (reservation.check_in && reservation.check_out) {
            // Extract dates as YYYY-MM-DD
            const checkInDate = reservation.check_in.split('T')[0];
            const checkOutDate = reservation.check_out.split('T')[0];

            // Calculate nights by using the date difference
            const date1 = new Date(checkInDate);
            const date2 = new Date(checkOutDate);
            const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

            // Calculate price per night
            const pricePerNight = reservation.nights_amount / nightsStay;

            // Format the text to show price per night and total nights with accounting format
            const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(pricePerNight);

            guestPaymentNightsTextElement.textContent = `${formattedPrice} x ${nightsStay} night${nightsStay !== 1 ? 's' : ''}`;
        }
    }

    const guestPaymentNightsTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_nightsTotal"]');
    if (guestPaymentNightsTotalElement && reservation.nights_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedNightsTotal = reservation.nights_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentNightsTotalElement.textContent = `$${formattedNightsTotal}`;
    }

    const guestPaymentCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_cleaningFeeTotal"]');
    if (guestPaymentCleaningFeeElement && reservation.cleaning_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedCleaningFee = reservation.cleaning_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
    }

    const guestPaymentServiceFeeElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_guestServiceFeeTotal"]');
    if (guestPaymentServiceFeeElement && reservation.serviceFee_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedServiceFee = reservation.serviceFee_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentServiceFeeElement.textContent = `$${formattedServiceFee}`;
    }

    const guestPaymentSalesTaxElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_salesTaxTotal"]');
    if (guestPaymentSalesTaxElement && reservation.sales_tax_amount && reservation.sales_surTax_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedSalesTax = (reservation.sales_tax_amount + reservation.sales_surTax_amount).toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentSalesTaxElement.textContent = `$${formattedSalesTax}`;
    }

    const guestPaymentTotalElement = modal.querySelector('[data-element="reservationInfoModal_guestPayment_total"]');
    if (guestPaymentTotalElement && reservation.reservation_amount_total) {
        // Format to 2 decimal places with thousands separator
        const formattedTotal = reservation.reservation_amount_total.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        guestPaymentTotalElement.textContent = `$${formattedTotal}`;
    }

    // Handle refund information for guest payment
    const guestPaymentRefundContainer = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundContainer"]');
    const guestPaymentRefundAmount = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundAmount"]');
    const guestPaymentRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_guestPayment_refundNewTotal"]');

    if (guestPaymentRefundContainer && guestPaymentRefundAmount && guestPaymentRefundNewTotal) {
        if (!reservation.reservation_active || (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0)) {
            // Show the refund container
            guestPaymentRefundContainer.style.display = 'flex';

            // Get the refund amount (default to 0 if not specified)
            const refundAmount = reservation.cancelled_refundAmount || 0;

            // Format the refund amount
            const formattedRefund = refundAmount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentRefundAmount.textContent = `- $${formattedRefund}`;

            // Calculate and format the new total
            const newTotal = reservation.reservation_amount_total - refundAmount;
            const formattedNewTotal = newTotal.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            guestPaymentRefundNewTotal.textContent = `$${formattedNewTotal}`;
        } else {
            // Hide the refund container if reservation is active and no refund
            guestPaymentRefundContainer.style.display = 'none';
        }
    }

    const hostPayoutNightsTextElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_nightsText"]');
    if (hostPayoutNightsTextElement && reservation.nights_amount) {
        // Use the reservation's check_in and check_out dates directly
        if (reservation.check_in && reservation.check_out) {
            // Extract dates as YYYY-MM-DD
            const checkInDate = reservation.check_in.split('T')[0];
            const checkOutDate = reservation.check_out.split('T')[0];

            // Calculate nights by using the date difference
            const date1 = new Date(checkInDate);
            const date2 = new Date(checkOutDate);
            const nightsStay = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

            // Calculate price per night
            const pricePerNight = reservation.nights_amount / nightsStay;

            // Format the text to show price per night and total nights with accounting format
            const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(pricePerNight);

            hostPayoutNightsTextElement.textContent = `${formattedPrice} x ${nightsStay} night${nightsStay !== 1 ? 's' : ''}`;
        }
    }
    const hostPayoutNightsTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_nightsTotal"]');
    if (hostPayoutNightsTotalElement && reservation.nights_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedNightsTotal = reservation.nights_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutNightsTotalElement.textContent = `$${formattedNightsTotal}`;
    }

    const hostPayoutCleaningFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_cleaningFeeTotal"]');
    if (hostPayoutCleaningFeeElement && reservation.cleaning_amount) {
        // Format to 2 decimal places with thousands separator
        const formattedCleaningFee = reservation.cleaning_amount.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutCleaningFeeElement.textContent = `$${formattedCleaningFee}`;
    }

    const hostPayoutHostFeeElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_hostServiceFeeTotal"]');
    if (hostPayoutHostFeeElement) {
        const hostFee = reservation.hostFee_amount || 0;
        // Format to 2 decimal places with thousands separator
        const formattedHostFee = hostFee.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutHostFeeElement.textContent = `- $${formattedHostFee}`;
    }

    const hostPayoutHostFeeTextElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_hostServiceFeeText"]');
    if (hostPayoutHostFeeTextElement) {
        const hostFee = reservation.hostFee_amount || 0;
        if (hostFee === 0) {
            hostPayoutHostFeeTextElement.textContent = "Host service fee - 0%";
        } else {
            hostPayoutHostFeeTextElement.textContent = "Host service fee - 3%";
        }
    }

    const hostPayoutTotalElement = modal.querySelector('[data-element="reservationInfoModal_hostPayout_payoutTotal"]');
    if (hostPayoutTotalElement) {
        // Calculate total as nightly total + cleaning fee - host fee
        const nightlyTotal = reservation.nights_amount || 0;
        const cleaningFee = reservation.cleaning_amount || 0;
        const hostFee = reservation.hostFee_amount || 0;

        const calculatedTotal = nightlyTotal + cleaningFee - hostFee;

        // Format to 2 decimal places with thousands separator
        const formattedTotal = calculatedTotal.toLocaleString('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        hostPayoutTotalElement.textContent = `$${formattedTotal}`;
    }
    // Handle refund information for host payout
    const hostPayoutRefundContainer = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundContainer"]');
    const hostPayoutRefundAmount = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundAmount"]');
    const hostPayoutRefundNewTotal = modal.querySelector('[data-element="reservationInfoModal_hostPayout_refundNewTotal"]');

    if (hostPayoutRefundContainer && hostPayoutRefundAmount && hostPayoutRefundNewTotal) {
        if (reservation.reservation_active) {
            // Hide the refund container if reservation is active
            hostPayoutRefundContainer.style.display = 'none';
        } else {
            // Show the refund container
            hostPayoutRefundContainer.style.display = 'flex';

            // Calculate the host payout total
            const nightlyTotal = reservation.nights_amount || 0;
            const cleaningFee = reservation.cleaning_amount || 0;
            const hostFee = reservation.hostFee_amount || 0;
            const calculatedTotal = nightlyTotal + cleaningFee - hostFee;

            // If refund amount is 0 or not specified, no money was refunded
            const refundAmount = (reservation.cancelled_refundAmount && reservation.cancelled_refundAmount !== 0)
                ? calculatedTotal
                : 0;

            // Format the refund amount
            const formattedRefund = refundAmount.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutRefundAmount.textContent = `- $${formattedRefund}`;

            // New total is the calculated total minus the refund amount
            const newTotal = calculatedTotal - refundAmount;
            const formattedNewTotal = newTotal.toLocaleString('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            hostPayoutRefundNewTotal.textContent = `$${formattedNewTotal}`;
        }
    }

    const helpCenterButton = modal.querySelector('[data-element="reservationInfoModal_helpCenterButton"]');
    if (helpCenterButton) {
        helpCenterButton.addEventListener('click', () => {
            window.open('https://www.keysbooking.com/help', '_blank');
        });
    }



    // Get the modal content element and scroll it to the top
    const modalContent = modal.querySelector('[data-element="reservationInfoModal_content"]');
    if (modalContent) {
        // Force scroll to top with a slight delay to ensure it works when reopening the modal
        modalContent.scrollTop = 0;
        setTimeout(() => {
            modalContent.scrollTop = 0;
        }, 50);

        // Make scrollbar always visible
        modalContent.style.overflowY = 'scroll';
    }

    if (window.keysBookingAdditionalCharges && typeof window.keysBookingAdditionalCharges.loadAndRenderAdditionalCharges === 'function') {
        void window.keysBookingAdditionalCharges.loadAndRenderAdditionalCharges(modal, reservation);
    }

    // Show the modal
    modal.style.display = 'flex';
}


//copy email and phone number to clipboard
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
    const phoneNumber = '+17863388401';

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

// Notifications section for host dashboard
async function initializeNotifications(hostId) {
    try {
        const response = await fetch(`https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/host_dashboard_notifications?host_id=${hostId}`);
        const data = await response.json();

        if (!response.ok) {
            window.location.href = '/404';
            //throw new Error('Failed to fetch notifications');
        }

        // Initialize new listings with the same data
        initializeNewListings(data);

        // Hide calendar nav item if host_editListings is null
        const calendarNavItem = document.querySelector('[data-element="hostDashboardNavBar_Calendar"]');
        if (calendarNavItem && (!data.host_editListings || data.host_editListings.length === 0)) {
            calendarNavItem.style.display = 'none';
        }

        // Handle edit listing notifications
        const editListingNotificationContainer = document.querySelector('[data-element="hostDashboardNotifications_editListing"]');
        const addHomeNotificationContainer = document.querySelector('[data-element="hostDashboardNotifications_addHome"]');
        const payoutsNotificationContainer = document.querySelector('[data-element="hostDashboardNotifications_payouts"]');
        const taxesNotificationContainer = document.querySelector('[data-element="hostDashboardNotifications_taxes"]');

        if (editListingNotificationContainer) {
            // Hide original container
            editListingNotificationContainer.style.display = 'none';


            // Keep track of notifications displayed
            let notificationsDisplayed = 0;

            // Check each listing and display notification if needed
            data.host_editListings.forEach((listing, index) => {

                const issues = hasListingIssues(listing);
                if (issues) {
                    displayNotification(editListingNotificationContainer, listing);
                    notificationsDisplayed++;
                } else {
                }
            });

            // Only remove original container after processing all listings
            if (notificationsDisplayed > 0) {
                editListingNotificationContainer.remove();
            }
        }

        // Handle add home notification
        if (addHomeNotificationContainer) {
            if (data.host_addHome && data.host_addHome.length > 0) {
                addHomeNotificationContainer.style.display = 'flex';
                addHomeNotificationContainer.style.cursor = 'pointer';

                // Update the notification text with number of listings
                const notificationText = addHomeNotificationContainer.querySelector('[data-element="hostDashboardNotifications_addHome_text"]');
                if (notificationText && data.host_addHome) {
                    const listingCount = data.host_addHome.length;
                    notificationText.textContent = `${listingCount} Listing${listingCount !== 1 ? 's' : ''} currently in progress`;
                }

                addHomeNotificationContainer.addEventListener('click', () => {
                    window.open('/host/add-home', '_blank');
                });
            } else {
                addHomeNotificationContainer.style.display = 'none';
            }
        }

        // Handle payouts notification
        if (payoutsNotificationContainer && data.host_payouts) {
            const unconnectedPayouts = data.host_payouts.filter(property => !property.payout_connected);
            const payoutsWithRequirementsDue = data.host_payouts.filter(property =>
                (property.requirement_currentlyDue !== null &&
                    property.requirement_currentlyDue.length > 0) ||
                (property.requirement_pastDue !== null &&
                    property.requirement_pastDue.length > 0)
            );

            const hasUnconnectedPayouts = unconnectedPayouts.length > 0;
            const hasRequirementsDue = payoutsWithRequirementsDue.length > 0;
            const hasAnyConnectedPayout = data.host_payouts.some(property => property.payout_connected === true);

            // Show notification if there are unconnected payouts or requirements due
            const showNotification = hasUnconnectedPayouts || hasRequirementsDue;
            payoutsNotificationContainer.style.display = showNotification ? 'flex' : 'none';

            if (showNotification) {
                const errorText = payoutsNotificationContainer.querySelector('[data-element="hostDashboardNotifications_payouts_errorText"]');
                const linkText = payoutsNotificationContainer.querySelector('[data-element="hostDashboardNotifications_payouts_linkText"]');

                if (errorText) {
                    if (hasRequirementsDue) {
                        errorText.textContent = "Update to receive payments";
                    } else if (hasUnconnectedPayouts) {
                        errorText.textContent = hasAnyConnectedPayout
                            ? `${unconnectedPayouts.length} Listing${unconnectedPayouts.length !== 1 ? 's' : ''} without payout method`
                            : "Required to receive payment";
                    }
                }

                if (linkText) {
                    if (hasRequirementsDue) {
                        linkText.textContent = "Update payout method";
                    } else {
                        linkText.textContent = hasAnyConnectedPayout ? "Edit payout method" : "Edit payout method";
                    }
                }

                payoutsNotificationContainer.style.cursor = 'pointer';
                payoutsNotificationContainer.addEventListener('click', () => {
                    window.location.href = '/account/payments-payouts?section=payouts';
                });
            }
        }

        // Handle taxes notification
        if (taxesNotificationContainer) {
            // Show notification if no tax data is returned
            const hasTaxData = data.host_taxes && data.host_taxes.length > 0;
            taxesNotificationContainer.style.display = hasTaxData ? 'none' : 'flex';

            if (!hasTaxData) {
                taxesNotificationContainer.style.cursor = 'pointer';
                taxesNotificationContainer.addEventListener('click', () => {
                    window.location.href = '/account/taxes';
                });
            }
        }

        // Show/hide entire notifications container based on whether any notifications are visible
        const notificationsContainer = document.querySelector('[data-element="hostDashboardNotifications_Container"]');
        if (notificationsContainer) {
            // Check if any notification is currently visible
            const hasVisibleEditListings = document.querySelector('[data-element="hostDashboardNotifications_editListing"]:not([style*="display: none"])');
            const isAddHomeVisible = addHomeNotificationContainer && addHomeNotificationContainer.style.display !== 'none';
            const isPayoutsVisible = payoutsNotificationContainer && payoutsNotificationContainer.style.display !== 'none';
            const isTaxesVisible = taxesNotificationContainer && taxesNotificationContainer.style.display !== 'none';

            // Show container only if at least one notification is visible
            const hasAnyNotification = hasVisibleEditListings || isAddHomeVisible || isPayoutsVisible || isTaxesVisible;
            notificationsContainer.style.display = hasAnyNotification ? 'flex' : 'none';
        }

    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

function hasListingIssues(listing) {
    // Check for missing host information
    const missingHostInfo = !listing._host_information?.host_description ||
        !listing._host_information?.Profile_Picture;

    // Check for missing check-in method
    const missingCheckInMethod = listing.check_in_method === null;

    // Check for missing cancellation policy
    const missingCancellationPolicy = listing.cancellationPolicy_type === null;

    // Check bedroom photos
    const bedroomPhotos = listing._host_property_pictures.filter(pic => pic.inBedroomSection === true);
    const insufficientBedroomPhotos = bedroomPhotos.length < listing.num_bedrooms;

    // Check dock photos if property has private dock
    const dockPhotos = listing._host_property_pictures.filter(pic => pic.in_dock_section === true);
    const insufficientDockPhotos = listing.private_dock && dockPhotos.length < 2;

    const hasIssues =
        missingHostInfo ||
        missingCheckInMethod ||
        missingCancellationPolicy ||
        insufficientBedroomPhotos ||
        insufficientDockPhotos;
    return hasIssues;
}

function displayNotification(container, listing) {
    const notification = container.cloneNode(true);
    notification.style.display = 'flex';

    // Update notification header with property name
    const header = notification.querySelector('[data-element="hostDashboardNotifications_editListing_header"]');
    if (header && listing.property_name) {
        const truncatedName = listing.property_name.length > 13
            ? listing.property_name.substring(0, 13) + '...'
            : listing.property_name;
        header.textContent = `Edit Listing - ${truncatedName}`;
    }

    // Add click handler to redirect to edit page
    notification.style.cursor = 'pointer';
    notification.addEventListener('click', () => {
        window.location.href = '/host/listings/edit?id=' + listing.id;
    });

    container.parentNode.insertBefore(notification, container);
}

// New Listings section for host dashboard
function initializeNewListings(data) {
    try {
        const newListingsSection = document.querySelector('[data-element="hostDashboardNewListing_section"]');

        if (!newListingsSection) {
            return;
        }

        // Check if we have new listings data
        if (!data.host_newListings || data.host_newListings.length === 0) {
            newListingsSection.style.display = 'none';
            return;
        }

        // Filter out approved listings that are already active
        const filteredListings = data.host_newListings.filter(listing => {
            const isApproved = listing.keysBookingApprovedDate !== null && listing.keysBookingApprovedDate !== undefined;
            // Show if not approved, or if approved but not yet active
            return !isApproved || !listing.is_active;
        });

        // If no listings to show after filtering, hide the section
        if (filteredListings.length === 0) {
            newListingsSection.style.display = 'none';
            return;
        }

        // Sort listings: pending first, then approved (most recent approval first)
        filteredListings.sort((a, b) => {
            const aIsApproved = a.keysBookingApprovedDate !== null && a.keysBookingApprovedDate !== undefined;
            const bIsApproved = b.keysBookingApprovedDate !== null && b.keysBookingApprovedDate !== undefined;

            // If one is pending and one is approved, pending comes first
            if (!aIsApproved && bIsApproved) return -1;
            if (aIsApproved && !bIsApproved) return 1;

            // If both are approved, sort by most recent first (soonest)
            if (aIsApproved && bIsApproved) {
                return b.keysBookingApprovedDate.localeCompare(a.keysBookingApprovedDate);
            }

            // Both are pending, maintain original order
            return 0;
        });

        // Show the section
        newListingsSection.style.display = 'flex';

        // Get the template block
        const templateBlock = newListingsSection.querySelector('[data-element="hostDashboardNewListing_block"]');

        if (!templateBlock) {
            console.error('New listing block template not found');
            return;
        }

        // Clone the original template
        const originalTemplateBlock = templateBlock.cloneNode(true);

        // Clear any existing blocks except the template
        const container = templateBlock.parentElement;
        container.innerHTML = '';

        // Process each filtered listing
        filteredListings.forEach((listing, index) => {
            const block = originalTemplateBlock.cloneNode(true);
            block.style.display = 'flex';

            // Determine if listing is approved
            const isApproved = listing.keysBookingApprovedDate !== null && listing.keysBookingApprovedDate !== undefined;

            // Set background color based on approval status
            if (isApproved) {
                block.style.backgroundColor = '#e8f5e9'; // Light green
            } else {
                block.style.backgroundColor = '#fffde7'; // Light yellow
            }

            // Update block header
            const blockHeader = block.querySelector('[data-element="hostDashboardNewListing_blockHeader"]');
            if (blockHeader) {
                blockHeader.textContent = isApproved ? 'LISTING APPROVED!' : 'LISTING UNDER REVIEW';
            }

            // Update listing name
            const blockListingName = block.querySelector('[data-element="hostDashboardNewListing_blockListingName"]');
            if (blockListingName && listing.property_name) {
                const truncatedName = listing.property_name.length > 13
                    ? listing.property_name.substring(0, 13) + '...'
                    : listing.property_name;
                blockListingName.textContent = truncatedName;
            }

            // Update status text
            const blockText = block.querySelector('[data-element="hostDashboardNewListing_blockText"]');
            if (blockText) {
                if (isApproved) {
                    blockText.textContent = 'Your listing is approved! Edit to activate or update details.';
                } else {
                    blockText.textContent = 'We are reviewing your listing. You\'ll hear back within 48 hours.';
                }
            }

            // Handle button text visibility
            const blockButtonText = block.querySelector('[data-element="hostDashboardNewListing_blockButtonText"]');
            if (blockButtonText) {
                if (isApproved) {
                    blockButtonText.style.display = 'block';
                } else {
                    blockButtonText.style.display = 'none';
                }
            }

            // Handle time ago container visibility
            const timeAgoContainer = block.querySelector('[data-element="hostDashboardNewListing_blockTimeAgoContainer"]');
            if (timeAgoContainer) {
                if (isApproved && listing.keysBookingApprovedDate) {
                    timeAgoContainer.style.display = 'flex';

                    // Calculate days ago
                    const timeAgoElement = block.querySelector('[data-element="hostDashboardNewListing_blockTimeAgo"]');
                    if (timeAgoElement) {
                        const daysAgo = calculateDaysAgo(listing.keysBookingApprovedDate);
                        if (daysAgo === 0) {
                            timeAgoElement.textContent = 'Today';
                        } else if (daysAgo === 1) {
                            timeAgoElement.textContent = '1 Day Ago';
                        } else {
                            timeAgoElement.textContent = `${daysAgo} Days Ago`;
                        }
                    }
                } else {
                    timeAgoContainer.style.display = 'none';
                }
            }

            // Add click handler for approved listings
            if (isApproved) {
                block.style.cursor = 'pointer';
                block.addEventListener('click', () => {
                    window.location.href = `/host/listings/edit?id=${listing.id}`;
                });
            }

            // Append the block to container
            container.appendChild(block);
        });

    } catch (error) {
        console.error('Error initializing new listings:', error);
    }
}

// Helper function to calculate days ago from a date string (YYYY-MM-DD format)
function calculateDaysAgo(dateString) {
    if (!dateString) return 0;

    // Extract date as YYYY-MM-DD (handle if it includes time)
    const dateStr = dateString.split('T')[0];

    // Get today's date as YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Parse dates
    const approvedDate = new Date(dateStr);
    const currentDate = new Date(todayStr);

    // Calculate difference in days
    const diffTime = currentDate - approvedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}
