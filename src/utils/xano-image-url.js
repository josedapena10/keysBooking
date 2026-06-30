/**
 * Xano vault dynamic image transforms (?tpl=).
 * One vault file per photo — append tpl for display context (no separate uploads).
 */

const XANO_VAULT_PATH = '/vault/';
const PHOTO_EXT = /\.(jpe?g|png|webp|gif|heic|heif)(\?|#|$)/i;

let propertyOptimizeRunning = false;

export function isXanoVaultPhotoUrl(url) {
    if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) {
        return false;
    }
    try {
        const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
        if (!parsed.hostname.includes('xano.io') || !parsed.pathname.includes(XANO_VAULT_PATH)) {
            return false;
        }
        const path = url.split('?')[0].split('#')[0];
        if (/\.svg(\?|#|$)/i.test(path)) {
            return false;
        }
        return PHOTO_EXT.test(path);
    } catch (_) {
        return false;
    }
}

export function stripXanoImageTpl(url) {
    if (!url || typeof url !== 'string') {
        return url || '';
    }
    return url
        .replace(/([?&])tpl=[^&#]*/gi, '$1')
        .replace(/[?&]$/, '')
        .replace(/\?&/, '?');
}

/**
 * @param {string} rawUrl
 * @param {string} tpl e.g. 'large.jpg' | 'xlarge.jpg'
 */
export function withXanoImageTpl(rawUrl, tpl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return rawUrl || '';
    }
    const trimmed = stripXanoImageTpl(rawUrl.trim());
    if (!trimmed || !isXanoVaultPhotoUrl(trimmed)) {
        return trimmed;
    }
    const joiner = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${joiner}tpl=${tpl}`;
}

/** Listing cards, map popups, property header preview, mobile carousel — ~800px */
export function xanoListingCardImageUrl(rawUrl) {
    return withXanoImageTpl(rawUrl, 'large.jpg');
}

/** Alias for property page preview slots */
export function xanoPropertyPreviewImageUrl(rawUrl) {
    return xanoListingCardImageUrl(rawUrl);
}

/** "Show all photos" grid — ~1920px */
export function xanoPropertyGalleryImageUrl(rawUrl) {
    return withXanoImageTpl(rawUrl, 'xlarge.jpg');
}

export function getRawVaultUrlFromImg(img) {
    if (!img) {
        return '';
    }
    const candidates = [
        img.dataset.fullSrc,
        img.getAttribute('setsrc'),
        img.getAttribute('src'),
        img.getAttribute('srcset'),
        img.currentSrc,
        img.src,
    ];
    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'string' || candidate.startsWith('data:')) {
            continue;
        }
        const raw = stripXanoImageTpl(candidate.trim());
        if (isXanoVaultPhotoUrl(raw)) {
            return raw;
        }
    }
    return '';
}

function urlAlreadyHasTpl(url, tpl) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    return new RegExp(`[?&]tpl=${tpl.replace('.', '\\.')}`, 'i').test(url);
}

export function setOptimizedImgSrc(img, rawUrl, transformFn, tplName) {
    if (!img || !rawUrl) {
        return false;
    }
    const raw = stripXanoImageTpl(String(rawUrl).trim());
    if (!isXanoVaultPhotoUrl(raw)) {
        return false;
    }
    const displayUrl = transformFn(raw);
    const currentSrc = img.currentSrc || img.getAttribute('src') || img.src || '';
    const currentSetsrc = img.getAttribute('setsrc') || '';

    if (
        urlAlreadyHasTpl(currentSrc, tplName) &&
        urlAlreadyHasTpl(currentSetsrc || currentSrc, tplName)
    ) {
        if (!img.dataset.fullSrc) {
            img.dataset.fullSrc = raw;
        }
        return false;
    }

    if (!img.dataset.fullSrc) {
        img.dataset.fullSrc = raw;
    }

    if (img.src && !img.src.startsWith('data:') && currentSrc !== displayUrl) {
        img.src = displayUrl;
    }
    if (img.hasAttribute('setsrc') && currentSetsrc !== displayUrl) {
        img.setAttribute('setsrc', displayUrl);
    }
    const srcset = img.getAttribute('srcset');
    if (srcset && isXanoVaultPhotoUrl(stripXanoImageTpl(srcset)) && srcset !== displayUrl) {
        img.setAttribute('srcset', displayUrl);
    }
    return true;
}

export function optimizePropertyPageImages(root = document) {
    if (propertyOptimizeRunning) {
        return;
    }
    propertyOptimizeRunning = true;
    try {
        root.querySelectorAll(
            '.images-stack .listingheader_image, [data-element^="ListingImage"]'
        ).forEach((img) => {
            const raw = getRawVaultUrlFromImg(img);
            if (raw) {
                setOptimizedImgSrc(img, raw, xanoPropertyPreviewImageUrl, 'large.jpg');
            }
        });

        root.querySelectorAll('.allphotos_image, [w-el="ImageModulPage"]').forEach((img) => {
            const raw = getRawVaultUrlFromImg(img);
            if (raw) {
                setOptimizedImgSrc(img, raw, xanoPropertyGalleryImageUrl, 'xlarge.jpg');
            }
        });
    } catch (_) {
        /* never block property page load */
    } finally {
        propertyOptimizeRunning = false;
    }
}

/** Run after Wized binds desktop header / all-photos markup (no MutationObserver — avoids src feedback loops). */
export function scheduleOptimizePropertyPageImages() {
    const run = () => optimizePropertyPageImages();
    run();
    requestAnimationFrame(() => run());
    setTimeout(run, 100);
    setTimeout(run, 400);
    setTimeout(run, 1200);
}
