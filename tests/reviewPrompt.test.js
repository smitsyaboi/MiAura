// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { maybeShowReviewPrompt } from '../js/reviewPrompt.js';
import { loadData, saveData } from '../js/storage.js';

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

function buildMoodsForStreak(n) {
    const moods = {};
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        moods[key] = { level: 1, timestamp: d.toISOString() };
    }
    return moods;
}

async function setStreak(n) {
    const data = await loadData();
    data.moods = buildMoodsForStreak(n);
    await saveData(data);
}

async function setMeta(overrides) {
    const data = await loadData();
    data.meta = { ...data.meta, ...overrides };
    await saveData(data);
}

describe('maybeShowReviewPrompt', () => {
    beforeEach(() => {
        chromeStore = {};
        setupDOM();
        vi.clearAllMocks();
    });

    it('shows no banner when streak < 3', async () => {
        await setStreak(2);
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).toBeNull();
    });

    it('shows first banner at streak >= 3 with no prompts shown', async () => {
        await setStreak(3);
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).not.toBeNull();
    });

    it('first banner contains reviewPrompt text key', async () => {
        await setStreak(3);
        await maybeShowReviewPrompt();
        const banner = document.getElementById('reviewBanner');
        expect(banner).not.toBeNull();
        // Localization falls back to en; reviewPrompt text should be present
        expect(banner.querySelector('.review-text')).not.toBeNull();
    });

    it('shows no banner when reviewPromptShown and streak < 7', async () => {
        await setStreak(4);
        await setMeta({ reviewPromptShown: true });
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).toBeNull();
    });

    it('shows second banner when reviewPromptShown and streak >= 7', async () => {
        await setStreak(7);
        await setMeta({ reviewPromptShown: true, reviewPrompt2Shown: false });
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).not.toBeNull();
    });

    it('shows no banner when both prompts already shown', async () => {
        await setStreak(10);
        await setMeta({ reviewPromptShown: true, reviewPrompt2Shown: true });
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).toBeNull();
    });

    it('shows no banner when user has already reviewed', async () => {
        await setStreak(10);
        await setMeta({ hasReviewed: true });
        await maybeShowReviewPrompt();
        expect(document.getElementById('reviewBanner')).toBeNull();
    });

    it('does not create a second banner if one is already shown', async () => {
        await setStreak(3);
        await maybeShowReviewPrompt();
        await maybeShowReviewPrompt();
        expect(document.querySelectorAll('#reviewBanner').length).toBe(1);
    });
});
