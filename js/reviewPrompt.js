import { calculateStreak, getReviewMeta, markReviewPromptShown, markReviewed } from './storage.js';
import { getCachedLanguage, t } from './localization.js';

const STORE_URL = 'https://chromewebstore.google.com/detail/miaura/apiimplkhebjnaajodfcnhlncpjdioip';

export async function maybeShowReviewPrompt() {
    const streak = await calculateStreak();
    if (streak < 7) return;

    const meta = await getReviewMeta();
    if (meta.reviewPromptShown || meta.hasReviewed) return;

    showBanner();
}

function showBanner() {
    const lang = getCachedLanguage();
    const existing = document.getElementById('reviewBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'reviewBanner';
    banner.className = 'review-banner';
    banner.innerHTML = `
        <span class="review-text">${t('reviewPrompt', lang)}</span>
        <a class="review-link" id="reviewLink" href="${STORE_URL}" target="_blank">${t('reviewAction', lang)}</a>
        <button class="review-dismiss" id="reviewDismiss">\u00d7</button>
    `;

    document.querySelector('.container').appendChild(banner);

    // Trigger animation after insert
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    });

    document.getElementById('reviewLink').addEventListener('click', async () => {
        await markReviewPromptShown();
        await markReviewed();
        hideBanner();
        chrome.tabs.create({ url: STORE_URL });
    });

    document.getElementById('reviewDismiss').addEventListener('click', async () => {
        await markReviewPromptShown();
        hideBanner();
    });
}

function hideBanner() {
    const banner = document.getElementById('reviewBanner');
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
}
