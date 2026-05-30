import { getReviewMeta, markReviewed, markV11BannerSeen, markFoundingMember } from './storage.js';
import { getCachedLanguage, t } from './localization.js';
import { STORE_URL } from './reviewPrompt.js';

const CONTACT_EMAIL = 'hello@joshuatrees.ca';

export async function maybeShowWelcomeBanner() {
    const meta = await getReviewMeta();
    if (meta.seenV11Banner) return;

    showWelcomeBanner();
    await markV11BannerSeen();
    await markFoundingMember();
}

function showWelcomeBanner() {
    const lang = getCachedLanguage();
    const existing = document.getElementById('welcomeBanner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'welcomeBanner';
    banner.className = 'welcome-banner';
    banner.innerHTML = `
        <button class="review-dismiss" id="welcomeDismiss">×</button>
        <p class="welcome-title">${t('welcomeTitle', lang)}</p>
        <p class="welcome-body">${t('welcomeBody', lang)}</p>
        <div class="welcome-actions">
            <a class="review-link" href="${STORE_URL}" target="_blank" id="welcomeReviewLink">${t('welcomeReview', lang)}</a>
            <a class="welcome-hello-link" href="mailto:${CONTACT_EMAIL}">${t('welcomeSayHello', lang)}</a>
        </div>
    `;

    document.querySelector('.container').appendChild(banner);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    });

    document.getElementById('welcomeDismiss').addEventListener('click', () => {
        hideWelcomeBanner();
    });

    document.getElementById('welcomeReviewLink').addEventListener('click', async (e) => {
        e.preventDefault();
        hideWelcomeBanner();
        await markReviewed();
        window.open(STORE_URL, '_blank');
    });

    banner.querySelector('.welcome-hello-link').addEventListener('click', () => {
        hideWelcomeBanner();
    });
}

function hideWelcomeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
}
