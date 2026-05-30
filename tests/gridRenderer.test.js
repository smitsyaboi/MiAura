// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadYearGrid } from '../js/gridRenderer.js';
import { saveData } from '../js/storage.js';

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

function setupDOM() {
    document.body.innerHTML = '<div id="yearGrid"></div><div id="yearDisplay"></div><div id="loggedDays"></div>';
}

function makeData(moodMap = {}, calendarView = 'month') {
    return {
        version: 2,
        settings: { language: 'en', counterMode: 'streak', calendarView },
        moods: moodMap,
        meta: { installDate: new Date().toISOString(), totalOpens: 0, hasReviewed: false, reviewPromptShown: false, reviewPrompt2Shown: false, seenV11Banner: true, isFoundingMember: false }
    };
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

describe('loadYearGrid', () => {
    beforeEach(() => {
        chromeStore = {};
        setupDOM();
        vi.clearAllMocks();
    });

    describe('empty state', () => {
        it('renders an SVG even with no mood data', async () => {
            await loadYearGrid(makeData());
            expect(document.querySelector('#yearGrid svg')).not.toBeNull();
        });

        it('produces no wave-path when no data', async () => {
            await loadYearGrid(makeData());
            expect(document.querySelectorAll('.wave-path').length).toBe(0);
        });

        it('produces no trend line when fewer than 2 logged days', async () => {
            const moods = { [todayStr()]: { level: 3, timestamp: new Date().toISOString() } };
            await loadYearGrid(makeData(moods));
            const dashed = document.querySelector('path[stroke-dasharray="4 4"]');
            expect(dashed).toBeNull();
        });
    });

    describe('with mood data', () => {
        it('renders wave-path elements for logged segments', async () => {
            const moods = {
                [daysAgo(2)]: { level: 1, timestamp: new Date().toISOString() },
                [daysAgo(1)]: { level: 2, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 3, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods));
            expect(document.querySelectorAll('.wave-path').length).toBeGreaterThan(0);
        });

        it('renders mood-dot elements on logged days', async () => {
            const moods = {
                [daysAgo(1)]: { level: 2, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 4, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods));
            expect(document.querySelectorAll('.mood-dot').length).toBeGreaterThan(0);
        });

        it('renders a trend line when 2+ days are logged', async () => {
            const moods = {
                [daysAgo(3)]: { level: 1, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 5, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods));
            const trendLine = document.querySelector('path[stroke-dasharray="4 4"]');
            expect(trendLine).not.toBeNull();
        });

        it('trend line renders after segment strokes (later in DOM)', async () => {
            const moods = {
                [daysAgo(2)]: { level: 1, timestamp: new Date().toISOString() },
                [daysAgo(1)]: { level: 2, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 3, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods));
            const allPaths = [...document.querySelectorAll('path')];
            const waveIdx = allPaths.findIndex(p => p.classList.contains('wave-path'));
            const trendIdx = allPaths.findIndex(p => p.getAttribute('stroke-dasharray') === '4 4');
            expect(trendIdx).toBeGreaterThan(waveIdx);
        });

        it('produces separate segments for non-consecutive logged days', async () => {
            const moods = {
                [daysAgo(6)]: { level: 1, timestamp: new Date().toISOString() },
                [daysAgo(5)]: { level: 2, timestamp: new Date().toISOString() },
                // gap on day -4 and -3
                [daysAgo(2)]: { level: 4, timestamp: new Date().toISOString() },
                [daysAgo(1)]: { level: 5, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods));
            expect(document.querySelectorAll('.wave-path').length).toBe(2);
        });
    });

    describe('week view', () => {
        it('renders wave-path in week view', async () => {
            const moods = {
                [daysAgo(1)]: { level: 3, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 2, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods, 'week'));
            expect(document.querySelectorAll('.wave-path').length).toBeGreaterThan(0);
        });
    });
});
