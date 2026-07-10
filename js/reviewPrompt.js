import { getReviewSchedule, recordReviewDismissal, markReviewed, REVIEW_MAX_ASKS } from './storage.js';
import { getCachedLanguage, t } from './localization.js';

export const STORE_URL = 'https://chromewebstore.google.com/detail/miaura/apiimplkhebjnaajodfcnhlncpjdioip';

export async function maybeShowReviewPrompt() {
    const { loggedDays, askCount, nextAskAt, hasReviewed } = await getReviewSchedule();

    if (hasReviewed) return;
    if (askCount >= REVIEW_MAX_ASKS) return;
    if (loggedDays < nextAskAt) return;

    showBanner(askCount === 0 ? 'reviewPrompt' : 'reviewPrompt2', loggedDays);
}

function showBanner(textKey, loggedDays) {
    const lang = getCachedLanguage();
    const existing = document.getElementById('reviewBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'reviewBanner';
    banner.className = 'review-banner';
    banner.innerHTML = `
        <span class="review-text">${t(textKey, lang).replace('{days}', loggedDays)}</span>
        <a class="review-link" id="reviewLink" href="${STORE_URL}" target="_blank">${t('reviewAction', lang)}</a>
        <button class="review-dismiss" id="reviewDismiss">×</button>
    `;

    document.querySelector('.container').appendChild(banner);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    });

    document.getElementById('reviewLink').addEventListener('click', async (e) => {
        e.preventDefault();
        hideBanner();
        await markReviewed();
        window.open(STORE_URL, '_blank');
    });

    document.getElementById('reviewDismiss').addEventListener('click', () => {
        recordReviewDismissal();
        hideBanner();
    });
}

function hideBanner() {
    const banner = document.getElementById('reviewBanner');
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
}
