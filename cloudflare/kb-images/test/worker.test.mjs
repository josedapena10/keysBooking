// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { buildOriginUrl } from '../src/index.js';

const X = 'https://xruq-v9q0-hayo.n7c.xano.io';
const W = 'https://kb-images.example.workers.dev';

// --- Minimal stand-ins for the Workers runtime -------------------------------
function setup(upstream = { status: 200, type: 'image/jpeg', body: 'JPEGDATA' }) {
    const store = new Map();
    const fetched = [];
    globalThis.caches = {
        default: {
            match: async (req) => {
                const hit = store.get(req.url);
                return hit ? hit.clone() : undefined;
            },
            put: async (req, res) => {
                store.set(req.url, res);
            },
        },
    };
    globalThis.fetch = async (url) => {
        fetched.push(String(url));
        return new Response(upstream.body, {
            status: upstream.status,
            headers: { 'content-type': upstream.type },
        });
    };
    const pending = [];
    const ctx = { waitUntil: (p) => pending.push(p) };
    const run = async (url, method = 'GET') => {
        const res = await worker.fetch(new Request(url, { method }), {}, ctx);
        await Promise.all(pending);
        return res;
    };
    return { run, fetched };
}

// --- URL allow-listing --------------------------------------------------------
test('maps a vault photo to the fixed Xano origin', () => {
    assert.equal(
        buildOriginUrl(`${W}/vault/abc/123/def/photo-preview.jpeg?tpl=large.jpg`),
        `${X}/vault/abc/123/def/photo-preview.jpeg?tpl=large.jpg`,
    );
});

test('drops cache-busting and unknown query params', () => {
    assert.equal(
        buildOriginUrl(`${W}/vault/a/b.jpg?tpl=xlarge.jpg&imgRetryTs=123&x=1`),
        `${X}/vault/a/b.jpg?tpl=xlarge.jpg`,
    );
    assert.equal(buildOriginUrl(`${W}/vault/a/b.jpg?imgRetryTs=1`), `${X}/vault/a/b.jpg`);
});

test('refuses anything that is not a vault photo', () => {
    for (const bad of [
        `${W}/api:WurmsjHX/user`, // Xano API
        `${W}/vault/a/b.pdf`, // not a photo
        `${W}/vault/a/b.svg`, // svg can carry scripts
        `${W}/vault/../api:WurmsjHX/user.jpg`, // path traversal
        `${W}/vault//evil.com/x.jpg`,
        `${W}/https://evil.com/x.jpg`, // open-proxy attempt
        `${W}/vault/a/b.jpg?tpl=../../x`, // unknown template
        `${W}/vault/a/b.jpg?tpl=huge.jpg`,
    ]) {
        assert.equal(buildOriginUrl(bad), null, bad);
    }
});

// --- Request handling ---------------------------------------------------------
test('first request fetches from Xano, second is served from cache', async () => {
    const { run, fetched } = setup();
    const url = `${W}/vault/a/b.jpg?tpl=large.jpg`;
    const first = await run(url);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('x-kb-cache'), 'MISS');
    assert.equal(await first.text(), 'JPEGDATA');
    const second = await run(`${url}&imgRetryTs=999`);
    assert.equal(second.headers.get('x-kb-cache'), 'HIT');
    assert.equal(await second.text(), 'JPEGDATA');
    assert.deepEqual(fetched, [`${X}/vault/a/b.jpg?tpl=large.jpg`]);
    assert.match(second.headers.get('cache-control'), /max-age=31536000/);
});

test('rejects POST and other methods', async () => {
    const { run, fetched } = setup();
    const res = await run(`${W}/vault/a/b.jpg`, 'POST');
    assert.equal(res.status, 405);
    assert.equal(fetched.length, 0);
});

test('never fetches for refused URLs', async () => {
    const { run, fetched } = setup();
    const res = await run(`${W}/api:WurmsjHX/user`);
    assert.equal(res.status, 404);
    assert.equal(fetched.length, 0);
});

test('does not cache or pass through non-image responses', async () => {
    const { run } = setup({ status: 200, type: 'text/html', body: '<script>x</script>' });
    const res = await run(`${W}/vault/a/b.jpg`);
    assert.equal(res.status, 502);
    assert.doesNotMatch(await res.text(), /script/);
});

test('passes Xano 404s through without caching them', async () => {
    const { run, fetched } = setup({ status: 404, type: 'text/plain', body: 'nope' });
    assert.equal((await run(`${W}/vault/a/b.jpg`)).status, 404);
    assert.equal((await run(`${W}/vault/a/b.jpg`)).status, 404);
    assert.equal(fetched.length, 2);
});

test('HEAD returns headers only', async () => {
    const { run } = setup();
    const res = await run(`${W}/vault/a/b.jpg`, 'HEAD');
    assert.equal(res.status, 200);
    assert.equal(await res.text(), '');
});
