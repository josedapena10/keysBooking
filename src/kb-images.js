/*
 * kb-images.js — one place that decides how property photos are loaded.
 *
 * Load this ONCE, site-wide, in Webflow: Site settings → Custom code → Head code,
 * ABOVE the page scripts (no `defer`, so it runs first):
 *
 *   <script src="https://josedapena10.github.io/keysBooking/src/kb-images.js"></script>
 *
 * It does two things for Xano vault photos:
 *   1. Resizing — adds Xano's ?tpl= so we never download the original upload
 *      when a smaller version will do (large.jpg ≈ 800px, xlarge.jpg for galleries).
 *   2. CDN — when CDN_BASE is set, rewrites https://<instance>.xano.io/vault/...
 *      to https://<CDN_BASE>/vault/... so Cloudflare serves cached copies and
 *      repeat views no longer count against Xano's file bandwidth.
 *
 * Safe to ship before the Cloudflare Worker exists: with CDN_BASE empty, it only
 * resizes. Turning the CDN on (or off again) is a one-line change below.
 */
(function () {
    'use strict';

    // Set to your Worker's address once it is deployed, e.g. 'https://img.keysbooking.com'
    // or 'https://kb-images.<your-subdomain>.workers.dev'. Leave '' to disable the CDN.
    var CDN_BASE = '';

    // Only this Xano instance is rewritten. Must match XANO_ORIGIN in the Worker.
    var XANO_HOST = 'xruq-v9q0-hayo.n7c.xano.io';

    var PHOTO_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
    var cdnHost = '';
    try {
        cdnHost = CDN_BASE ? new URL(CDN_BASE).host : '';
    } catch (_) {
        cdnHost = '';
    }

    function parse(url) {
        if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) {
            return null;
        }
        try {
            return new URL(url.trim(), window.location.href);
        } catch (_) {
            return null;
        }
    }

    /** True for a photo stored in Xano's vault, served from Xano or already from the CDN. */
    function isVaultPhoto(url) {
        var u = parse(url);
        if (!u) return false;
        var fromXano = u.host === XANO_HOST || u.hostname.endsWith('.xano.io');
        var fromCdn = cdnHost && u.host === cdnHost;
        if (!fromXano && !fromCdn) return false;
        if (!u.pathname.startsWith('/vault/')) return false;
        return PHOTO_EXT.test(u.pathname);
    }

    /** Adds (or replaces) Xano's resize template. Non-vault URLs pass through untouched. */
    function withTpl(url, tpl) {
        if (!tpl || !isVaultPhoto(url)) return url || '';
        var u = parse(url);
        u.searchParams.set('tpl', tpl);
        return u.toString();
    }

    /** Rewrites a Xano vault photo to the CDN. Anything else passes through untouched. */
    function toCdn(url) {
        if (!CDN_BASE || !isVaultPhoto(url)) return url || '';
        var u = parse(url);
        if (u.host !== XANO_HOST) return u.toString(); // other instance or already on CDN
        return CDN_BASE.replace(/\/$/, '') + u.pathname + u.search;
    }

    /** The one call page scripts should use: resize (optional) + CDN. */
    function imageUrl(url, tpl) {
        return toCdn(tpl ? withTpl(url, tpl) : url);
    }

    window.KBImages = {
        CDN_BASE: CDN_BASE,
        isVaultPhoto: isVaultPhoto,
        withTpl: withTpl,
        toCdn: toCdn,
        url: imageUrl,
        // Shared sizes so every page asks for the same cached file.
        CARD: 'large.jpg', // listing cards, sliders, map popups (~800px)
        GALLERY: 'xlarge.jpg', // full-screen gallery / lightbox
    };
})();
