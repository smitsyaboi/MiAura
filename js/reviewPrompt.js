import { calculateStreak, getReviewMeta, markReviewPromptShown, markReviewed, markReviewPrompt2Shown } from './storage.js';
import { getCachedLanguage, t } from './localization.js';

export const STORE_URL = 'https://chromewebstore.google.com/detail/miaura/apiimplkhebjnaajodfcnhlncpjdioip';

export async function maybeShowReviewPrompt() {
    const streak = await calculateStreak();
    const meta = await getReviewMeta();

    if (!meta.hasReviewed) {
        if (!meta.reviewPromptShown && streak >= 3) {
            showBanner('reviewPrompt', markReviewPromptShown);
            return;
        }
        if (meta.reviewPromptShown && !meta.reviewPrompt2Shown && streak >= 7) {
            showBanner('reviewPrompt2', markReviewPrompt2Shown);
        }
    }
}

function showBanner(textKey, onDismiss) {
    const lang = getCachedLanguage();
    const existing = document.getElementById('reviewBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'reviewBanner';
    banner.className = 'review-banner';
    banner.innerHTML = `
        <span class="review-text">${t(textKey, lang)}</span>
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
        await onDismiss();
        await markReviewed();
        window.open(STORE_URL, '_blank');
    });

    document.getElementById('reviewDismiss').addEventListener('click', () => {
        onDismiss();
        hideBanner();
    });
}

function hideBanner() {
    const banner = document.getElementById('reviewBanner');
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
}
