import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldShowBadge, updateBadge, clearBadge } from '../js/badge.js';
import { saveData, loadData } from '../js/storage.js';
import { formatDateString } from '../js/dateUtils.js';

// Mock chrome.storage.local (storage.js pattern from tests/storage.test.js)
let chromeStore = {};
const chromeStorageMock = {
    get: vi.fn((key) => {
        if (typeof key === 'string') {
            return Promise.resolve({ [key]: chromeStore[key] || undefined });
        }
        return Promise.resolve({});
    }),
    set: vi.fn((obj) => {
        Object.assign(chromeStore, obj);
        return Promise.resolve();
    }),
    remove: vi.fn((key) => {
        delete chromeStore[key];
        return Promise.resolve();
    })
};

const actionMock = {
    setBadgeText: vi.fn(() => Promise.resolve()),
    setBadgeBackgroundColor: vi.fn(() => Promise.resolve())
};

global.chrome = { storage: { local: chromeStorageMock }, action: actionMock };

function daysAgo(n, from = new Date()) {
    const d = new Date(from);
    d.setDate(d.getDate() - n);
    return formatDateString(d);
}

describe('shouldShowBadge', () => {
    const today = '2026-07-14';

    it('shows the badge for an active user who has not logged today', () => {
        const moods = {
            [daysAgo(2, new Date(today))]: { level: 3, timestamp: '2026-07-12T10:00:00.000Z' }
        };
        expect(shouldShowBadge(moods, today)).toBe(true);
    });

    it('does not show the badge when today is already logged', () => {
        const moods = {
            [today]: { level: 2, timestamp: '2026-07-14T09:00:00.000Z' },
            [daysAgo(1, new Date(today))]: { level: 3, timestamp: '2026-07-13T09:00:00.000Z' }
        };
        expect(shouldShowBadge(moods, today)).toBe(false);
    });

    it('does not show the badge when there are no logs in the last 7 days', () => {
        const moods = {
            [daysAgo(10, new Date(today))]: { level: 3, timestamp: '2026-07-04T10:00:00.000Z' }
        };
        expect(shouldShowBadge(moods, today)).toBe(false);
    });

    it('does not show the badge when the only recent logs are isTest entries', () => {
        const moods = {
            [daysAgo(1, new Date(today))]: { level: 3, timestamp: '2026-07-13T10:00:00.000Z', isTest: true },
            [daysAgo(3, new Date(today))]: { level: 4, timestamp: '2026-07-11T10:00:00.000Z', isTest: true }
        };
        expect(shouldShowBadge(moods, today)).toBe(false);
    });

    it('does not show the badge when there are no moods at all', () => {
        expect(shouldShowBadge({}, today)).toBe(false);
    });

    it('counts a real mood exactly 6 days ago as within the active window', () => {
        const moods = {
            [daysAgo(6, new Date(today))]: { level: 1, timestamp: '2026-07-08T10:00:00.000Z' }
        };
        expect(shouldShowBadge(moods, today)).toBe(true);
    });
});

describe('updateBadge / clearBadge', () => {
    beforeEach(() => {
        chromeStore = {};
        vi.clearAllMocks();
    });

    it('sets the dot badge for an active, unlogged-today user', async () => {
        const data = await loadData();
        data.moods[daysAgo(1)] = { level: 3, timestamp: new Date().toISOString() };
        await saveData(data);

        await updateBadge();

        expect(actionMock.setBadgeText).toHaveBeenCalledWith({ text: '•' });
        expect(actionMock.setBadgeBackgroundColor).toHaveBeenCalledWith(
            expect.objectContaining({ color: expect.any(String) })
        );
        const [{ color }] = actionMock.setBadgeBackgroundColor.mock.calls[0];
        expect(color.toLowerCase()).not.toBe('#ff0000');
        expect(color.toLowerCase()).not.toContain('red');
    });

    it('clears the badge when there is nothing to show', async () => {
        await updateBadge();
        expect(actionMock.setBadgeText).toHaveBeenCalledWith({ text: '' });
        expect(actionMock.setBadgeBackgroundColor).not.toHaveBeenCalled();
    });

    it('clearBadge always clears the badge text', async () => {
        await clearBadge();
        expect(actionMock.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
});
