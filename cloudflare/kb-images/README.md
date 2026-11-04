# kb-images — Cloudflare Worker for property photos

Serves Xano vault photos from Cloudflare's cache so repeat views stop counting
against Xano's file bandwidth. It only fetches `/vault/` photos from the one Xano
instance in `src/index.js` — it is not a general proxy.

## Deploy (one time, ~5 minutes)
1. Create a free Cloudflare account if you don't have one.
2. In this folder: `npm install`, then `npx wrangler login` (opens your browser).
3. `npm test` — should print `pass 10`.
4. `npx wrangler deploy` — prints your Worker's address, e.g.
   `https://kb-images.<your-subdomain>.workers.dev`.
5. Check it: open
   `https://kb-images.<your-subdomain>.workers.dev/vault/<any photo path>?tpl=large.jpg`
   twice. The response header `x-kb-cache` should say `MISS`, then `HIT`.

## Turn it on for the site
In `src/kb-images.js`, set `CDN_BASE` to the address from step 4, then push.
To turn it off again, set `CDN_BASE = ''` and push. Pages fall back to Xano directly.

## Using img.keysbooking.com instead (optional)
Only if keysbooking.com's DNS is on Cloudflare: uncomment `routes` in
`wrangler.toml`, deploy again, and use `https://img.keysbooking.com` as `CDN_BASE`.

## Adding a new image size
Add the template name to `ALLOWED_TPLS` in `src/index.js` and deploy before using
it in the site; unknown sizes are refused (that stops people generating endless
uncached variants).
