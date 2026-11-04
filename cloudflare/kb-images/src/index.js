/**
 * kb-images — Cloudflare Worker that serves Keys Booking's Xano vault photos from
 * Cloudflare's cache, so repeat views stop counting against Xano's file bandwidth.
 *
 *   https://<this worker>/vault/<path>.jpg?tpl=large.jpg
 *     → first request: fetched once from https://<XANO_ORIGIN>/vault/<path>.jpg?tpl=large.jpg
 *     → every later request: served from Cloudflare's cache
 *
 * This is deliberately NOT a general proxy. It refuses anything that isn't:
 *   - a GET or HEAD request
 *   - under /vault/ with a photo file extension
 *   - for the one Xano instance hard-coded below (callers cannot pick the host)
 *   - an image response from Xano
 * Query parameters other than an allow-listed ?tpl= are dropped, so cache-busters
 * like ?imgRetryTs=... can't be used to force fresh fetches from Xano.
 */

// The only origin this Worker will ever fetch from. Must match XANO_HOST in src/kb-images.js.
const XANO_ORIGIN = 'https://xruq-v9q0-hayo.n7c.xano.io';

// Resize templates the site actually uses. Add one here before using it in the site.
const ALLOWED_TPLS = new Set(['large.jpg', 'xlarge.jpg']);

const PHOTO_PATH = /^\/vault\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|heic|heif)$/i;

// Vault files never change once uploaded (a new upload gets a new URL), so cache for a year.
const BROWSER_CACHE = 'public, max-age=31536000, immutable';
const EDGE_TTL_SECONDS = 60 * 60 * 24 * 365;

function reject(status, message) {
    return new Response(message, {
        status,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
}

/**
 * Turns an incoming request into the exact Xano URL to fetch, or null if the request
 * isn't one this Worker serves. Exported for tests.
 */
export function buildOriginUrl(requestUrl) {
    let url;
    try {
        url = new URL(requestUrl);
    } catch (_) {
        return null;
    }
    const path = url.pathname;
    if (path.includes('..') || path.includes('//') || !PHOTO_PATH.test(path)) {
        return null;
    }
    const origin = new URL(path, XANO_ORIGIN);
    const tpl = url.searchParams.get('tpl');
    if (tpl !== null) {
        if (!ALLOWED_TPLS.has(tpl)) return null;
        origin.searchParams.set('tpl', tpl);
    }
    return origin.toString();
}

export default {
    async fetch(request, env, ctx) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return reject(405, 'Method not allowed');
        }

        const originUrl = buildOriginUrl(request.url);
        if (!originUrl) {
            return reject(404, 'Not found');
        }

        // Cache key = the normalized origin URL, so every page that asks for the same
        // photo + size shares one cached copy, whatever extra query params it sent.
        const cache = caches.default;
        const cacheKey = new Request(originUrl, { method: 'GET' });

        let response = await cache.match(cacheKey);
        if (!response) {
            const upstream = await fetch(originUrl, {
                method: 'GET',
                cf: { cacheEverything: true, cacheTtl: EDGE_TTL_SECONDS },
            });

            const type = upstream.headers.get('content-type') || '';
            if (!upstream.ok || !type.startsWith('image/')) {
                // Don't cache errors or anything that isn't a picture.
                return reject(upstream.status === 404 ? 404 : 502, 'Image unavailable');
            }

            const headers = new Headers();
            headers.set('content-type', type);
            const length = upstream.headers.get('content-length');
            if (length) headers.set('content-length', length);
            const etag = upstream.headers.get('etag');
            if (etag) headers.set('etag', etag);
            headers.set('cache-control', BROWSER_CACHE);
            headers.set('access-control-allow-origin', '*');
            headers.set('x-content-type-options', 'nosniff');

            response = new Response(upstream.body, { status: 200, headers });
            ctx.waitUntil(cache.put(cacheKey, response.clone()));
            response.headers.set('x-kb-cache', 'MISS');
        } else {
            response = new Response(response.body, response);
            response.headers.set('x-kb-cache', 'HIT');
        }

        if (request.method === 'HEAD') {
            return new Response(null, { status: response.status, headers: response.headers });
        }
        return response;
    },
};
