// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadYearGrid } from '../js/gridRenderer.js';

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

// Fixed day of the current month (local date). Month view aggregates 3-day
// buckets (bucket = floor((day-1)/3)), so days are picked per-bucket below.
function dayOfMonth(n) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
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
