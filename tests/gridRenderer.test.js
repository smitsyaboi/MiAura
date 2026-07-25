// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadYearGrid } from '../js/gridRenderer.js';
import { setViewMonth, setViewYear } from '../js/state.js';

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

// The structural bucketing tests view a fully-past month so that no "today"
// point is injected (today is drawn as its own un-bucketed point in the
// current month) and 3-day bucketing stays deterministic regardless of the
// run date. bucket = floor((day-1)/3); days are picked per-bucket below.
const PAST = new Date();
PAST.setDate(1);
PAST.setMonth(PAST.getMonth() - 1);
const PAST_YEAR = PAST.getFullYear();
const PAST_MONTH = PAST.getMonth(); // 0-based

function dayOfMonth(n) {
    return `${PAST_YEAR}-${String(PAST_MONTH + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
}

function moodsOnDays(days, level = 3) {
    const moods = {};
    days.forEach(day => {
        moods[dayOfMonth(day)] = { level, timestamp: new Date().toISOString() };
    });
    return moods;
}

describe('loadYearGrid', () => {
    beforeEach(() => {
        chromeStore = {};
        setupDOM();
        vi.clearAllMocks();
        // Default to the current month/year; the structural block overrides this.
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
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
        beforeEach(() => {
            setViewYear(PAST_YEAR);
            setViewMonth(PAST_MONTH);
        });

        it('renders wave-path elements for logged segments', async () => {
            // days 1-6 span buckets 0 and 1 → one two-point segment
            await loadYearGrid(makeData(moodsOnDays([1, 2, 3, 4, 5, 6])));
            expect(document.querySelectorAll('.wave-path').length).toBeGreaterThan(0);
        });

        it('renders mood-dot elements on logged days', async () => {
            await loadYearGrid(makeData(moodsOnDays([1, 2])));
            expect(document.querySelectorAll('.mood-dot').length).toBeGreaterThan(0);
        });

        it('renders a trend line when 2+ separated days are logged', async () => {
            // day 1 (bucket 0) and day 10 (bucket 3): empty buckets between
            await loadYearGrid(makeData(moodsOnDays([1, 10])));
            const trendLine = document.querySelector('path[stroke-dasharray="4 4"]');
            expect(trendLine).not.toBeNull();
        });

        it('draws no dashed connector when logged days are consecutive', async () => {
            // days 1-9 fill buckets 0-2 with no gap
            await loadYearGrid(makeData(moodsOnDays([1, 2, 3, 4, 5, 6, 7, 8, 9])));
            expect(document.querySelectorAll('.gap-path').length).toBe(0);
        });

        it('dashed connector only bridges the gap, one per gap', async () => {
            // buckets 0-1 logged, buckets 2-3 empty, bucket 4 logged
            await loadYearGrid(makeData(moodsOnDays([1, 2, 3, 4, 5, 6, 13, 14, 15])));
            const connectors = document.querySelectorAll('.gap-path');
            expect(connectors.length).toBe(1);
            // connector renders underneath the solid segments
            const allPaths = [...document.querySelectorAll('path')];
            const gapIdx = allPaths.findIndex(p => p.classList.contains('gap-path'));
            const waveIdx = allPaths.findIndex(p => p.classList.contains('wave-path'));
            expect(gapIdx).toBeLessThan(waveIdx);
        });

        it('produces separate segments for non-consecutive logged days', async () => {
            // buckets 0-1 and buckets 4-5, empty buckets 2-3 between
            await loadYearGrid(makeData(moodsOnDays([1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18])));
            expect(document.querySelectorAll('.wave-path').length).toBe(2);
        });
    });

    // Today is drawn as its own point at its exact level (not blended into a
    // bucket average) and must sit directly under the dashed today marker.
    // LEVEL_TO_Y[1] (Fantastique) === 25.
    describe('today is exact and aligned', () => {
        it('month view: today sits at its true level, on the today line', async () => {
            const moods = { [todayStr()]: { level: 1, timestamp: new Date().toISOString() } };
            await loadYearGrid(makeData(moods, 'month'));

            const halo = document.querySelector('.today-halo');
            expect(halo).not.toBeNull();
            expect(halo.getAttribute('cy')).toBe('25');

            const marker = document.querySelector('line[stroke-dasharray="3 2"]');
            expect(marker).not.toBeNull();
            expect(marker.getAttribute('x1')).toBe(halo.getAttribute('cx'));
        });

        it('month view: a fresh Fantastique is not diluted by the prior days in its bucket', async () => {
            // Without pulling today out, today (level 1) would average with the
            // two prior days (level 5) → a mid-graph point, not the top.
            const moods = {
                [daysAgo(2)]: { level: 5, timestamp: new Date().toISOString() },
                [daysAgo(1)]: { level: 5, timestamp: new Date().toISOString() },
                [todayStr()]: { level: 1, timestamp: new Date().toISOString() },
            };
            await loadYearGrid(makeData(moods, 'month'));
            expect(document.querySelector('.today-halo').getAttribute('cy')).toBe('25');
        });

        it('year view: today dot lands on the today marker, not the week center', async () => {
            const moods = { [todayStr()]: { level: 1, timestamp: new Date().toISOString() } };
            await loadYearGrid(makeData(moods, 'year'));

            const halo = document.querySelector('.today-halo');
            expect(halo).not.toBeNull();
            expect(halo.getAttribute('cy')).toBe('25');

            const marker = document.querySelector('line[stroke-dasharray="3 2"]');
            expect(marker).not.toBeNull();
            expect(marker.getAttribute('x1')).toBe(halo.getAttribute('cx'));
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
