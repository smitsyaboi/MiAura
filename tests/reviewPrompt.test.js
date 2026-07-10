// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { maybeShowReviewPrompt } from '../js/reviewPrompt.js';
import { loadData, saveData, REVIEW_FIRST_ASK_AT, REVIEW_REARM_DAYS, REVIEW_MAX_ASKS } from '../js/storage.js';
import { formatDateString } from '../js/dateUtils.js';

// Chrome storage mock
let chromeStore = {};
global.chrome = {
    storage: {
        local: {
            get: vi.fn((key) => Promise.resolve({ [key]: chromeStore[key] || undefined })),
            set: vi.fn((obj) => { Object.assign(chromeStore, obj); return Promise.resolve(); }),
            remove: vi.fn((key) => { delete chromeStore[key]; return Promise.resolve(); })
        }
    }
};

// Minimal DOM scaffold: review banner attaches to .container
function setupDOM() {
    document.body.innerHTML = '<div class="container"></div>';
}

// Uses local-date keys (formatDateString) to match the app, not UTC
function buildMoods(n, { isTest = false } = {}) {
    const moods = {};
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = formatDateString(d);
        moods[key] = { level: 1, timestamp: d.toISOString() };
        if (isTest) moods[key].isTest = true;
    }
    return moods;
}

async function setLoggedDays(n, opts) {
    const data = await loadData();
    data.moods = buildMoods(n, opts);
    await saveData(data);
}

async function setMeta(overrides) {
    const data = await loadData();
    data.meta = { ...data.meta, ...overrides };
    await saveData(data);
}

function banner() {
    return document.getElementById('reviewBanner');
}

describe('maybeShowReviewPrompt', () => {
    beforeEach(() => {
        chromeStore = {};
        setupDOM();
        vi.clearAllMocks();
    });

    it('shows no banner below the first-ask threshold', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT - 1);
        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();
    });

    it('shows first banner at the first-ask threshold', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        await maybeShowReviewPrompt();
        expect(banner()).not.toBeNull();
    });

    it('counts non-consecutive days — no streak required', async () => {
        const data = await loadData();
        const moods = {};
        const today = new Date();
        // Every other day: never a 2-day streak, but enough total days
        for (let i = 0; i < REVIEW_FIRST_ASK_AT; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i * 2);
            moods[formatDateString(d)] = { level: 1, timestamp: d.toISOString() };
        }
        data.moods = moods;
        await saveData(data);

        await maybeShowReviewPrompt();
        expect(banner()).not.toBeNull();
    });

    it('interpolates the logged-day count into the banner text', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        await maybeShowReviewPrompt();
        expect(banner().querySelector('.review-text').textContent).toContain(String(REVIEW_FIRST_ASK_AT));
    });

    it('ignores test-mode entries when counting logged days', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT, { isTest: true });
        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();
    });

    it('does not re-show after dismissal until re-armed', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        await maybeShowReviewPrompt();
        banner().querySelector('#reviewDismiss').click();
        await new Promise(r => setTimeout(r, 0));
        document.body.innerHTML = '<div class="container"></div>';

        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();
    });

    it('re-arms after enough additional logged days', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        await setMeta({ reviewAskCount: 1, reviewNextAskAt: REVIEW_FIRST_ASK_AT + REVIEW_REARM_DAYS });
        await setLoggedDays(REVIEW_FIRST_ASK_AT + REVIEW_REARM_DAYS);

        await maybeShowReviewPrompt();
        expect(banner()).not.toBeNull();
    });

    it('shows no banner once the lifetime ask cap is reached', async () => {
        await setLoggedDays(100);
        await setMeta({ reviewAskCount: REVIEW_MAX_ASKS, reviewNextAskAt: 0 });
        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();
    });

    it('shows no banner when user has already reviewed', async () => {
        await setLoggedDays(100);
        await setMeta({ hasReviewed: true });
        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();
    });

    it('gives users burned under the old streak rules one final ask', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        // Legacy meta: prompts burned, no v2 schedule fields
        const data = await loadData();
        data.meta.reviewPromptShown = true;
        data.meta.reviewPrompt2Shown = true;
        delete data.meta.reviewAskCount;
        delete data.meta.reviewNextAskAt;
        await saveData(data);

        // Not yet: re-armed for REVIEW_REARM_DAYS more logged days
        await maybeShowReviewPrompt();
        expect(banner()).toBeNull();

        await setLoggedDays(REVIEW_FIRST_ASK_AT + REVIEW_REARM_DAYS);
        await maybeShowReviewPrompt();
        expect(banner()).not.toBeNull();
    });

    it('does not create a second banner if one is already shown', async () => {
        await setLoggedDays(REVIEW_FIRST_ASK_AT);
        await maybeShowReviewPrompt();
        await maybeShowReviewPrompt();
        expect(document.querySelectorAll('#reviewBanner').length).toBe(1);
    });
});
