import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    migrateIfNeeded,
    loadData,
    saveData,
    getMoodForDate,
    saveMoodForDate,
    getSetting,
    setSetting,
    calculateStreak,
    calculateStreakFromMoods,
    getStreakHeatLevel,
    setTestStreak,
    clearTestStreak
} from '../js/storage.js';

// Mock chrome.storage.local
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

global.chrome = { storage: { local: chromeStorageMock } };

// Mock localStorage for migration tests
const localStorageStore = {};
const localStorageMock = {
    getItem: vi.fn((key) => localStorageStore[key] || null),
    setItem: vi.fn((key, value) => { localStorageStore[key] = value; }),
    removeItem: vi.fn((key) => { delete localStorageStore[key]; }),
    clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); })
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('storage', () => {
    beforeEach(() => {
        chromeStore = {};
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('loadData / saveData', () => {
        it('should return default data when nothing stored', async () => {
            const data = await loadData();
            expect(data).toEqual({
                version: 2,
                settings: { language: 'en', counterMode: 'streak', calendarView: 'year' },
                moods: {}
            });
        });

        it('should save and load data', async () => {
            const newData = {
                version: 2,
                settings: { language: 'fr', counterMode: 'total', calendarView: 'month' },
                moods: { '2026-03-01': { level: 1, timestamp: '2026-03-01T10:00:00.000Z' } }
            };
            await saveData(newData);
            const loaded = await loadData();
            expect(loaded).toEqual(newData);
        });
    });

    describe('saveMoodForDate / getMoodForDate', () => {
        it('should return null for non-existent date', async () => {
            expect(await getMoodForDate('2026-01-15')).toBeNull();
        });

        it('should save and retrieve mood with level integer', async () => {
            await saveMoodForDate('2026-01-15', 1);
            const mood = await getMoodForDate('2026-01-15');
            expect(mood).toBeDefined();
            expect(mood.level).toBe(1);
            expect(mood.timestamp).toBeDefined();
        });

        it('should not save when level is falsy', async () => {
            await saveMoodForDate('2026-01-15', 0);
            expect(await getMoodForDate('2026-01-15')).toBeNull();
        });
    });

    describe('getSetting / setSetting', () => {
        it('should return undefined for unset setting when no data', async () => {
            const val = await getSetting('language');
            // Default data has language: 'en'
            expect(val).toBe('en');
        });

        it('should save and retrieve a setting', async () => {
            await setSetting('language', 'fr');
            expect(await getSetting('language')).toBe('fr');
        });

        it('should save counterMode setting', async () => {
            await setSetting('counterMode', 'total');
            expect(await getSetting('counterMode')).toBe('total');
        });

        it('should save calendarView setting', async () => {
            await setSetting('calendarView', 'week');
            expect(await getSetting('calendarView')).toBe('week');
        });
    });

    describe('getStreakHeatLevel', () => {
        it('should return 0 for streak < 3', () => {
            expect(getStreakHeatLevel(0)).toBe(0);
            expect(getStreakHeatLevel(1)).toBe(0);
            expect(getStreakHeatLevel(2)).toBe(0);
        });

        it('should return 1 for streak 3-6', () => {
            expect(getStreakHeatLevel(3)).toBe(1);
            expect(getStreakHeatLevel(6)).toBe(1);
        });

        it('should return 2 for streak 7-13', () => {
            expect(getStreakHeatLevel(7)).toBe(2);
            expect(getStreakHeatLevel(13)).toBe(2);
        });

        it('should return 3 for streak 14-29', () => {
            expect(getStreakHeatLevel(14)).toBe(3);
            expect(getStreakHeatLevel(29)).toBe(3);
        });

        it('should return 4 for streak 30+', () => {
            expect(getStreakHeatLevel(30)).toBe(4);
            expect(getStreakHeatLevel(100)).toBe(4);
            expect(getStreakHeatLevel(365)).toBe(4);
        });
    });

    describe('calculateStreakFromMoods', () => {
        it('should return 0 when no moods', () => {
            expect(calculateStreakFromMoods({})).toBe(0);
        });

        it('should calculate streak for consecutive days', () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const formatDate = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const moods = {
                [formatDate(today)]: { level: 1 },
                [formatDate(yesterday)]: { level: 2 }
            };

            expect(calculateStreakFromMoods(moods)).toBe(2);
        });
    });

    describe('calculateStreak', () => {
        it('should return 0 when no mood data', async () => {
            expect(await calculateStreak()).toBe(0);
        });

        it('should calculate streak from stored data', async () => {
            const today = new Date();
            const formatDate = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const data = {
                version: 2,
                settings: { language: 'en', counterMode: 'streak', calendarView: 'year' },
                moods: {
                    [formatDate(today)]: { level: 1, timestamp: today.toISOString() }
                }
            };
            await saveData(data);
            expect(await calculateStreak()).toBe(1);
        });
    });

    describe('migrateIfNeeded', () => {
        it('should skip if miAura_v2 already exists', async () => {
            const existing = { version: 2, settings: { language: 'en', counterMode: 'streak', calendarView: 'year' }, moods: {} };
            chromeStore.miAura_v2 = existing;
            await migrateIfNeeded();
            // localStorage should not have been queried for moodTracker
            expect(localStorageMock.getItem).not.toHaveBeenCalledWith('moodTracker');
        });

        it('should migrate old localStorage data to chrome.storage.local', async () => {
            const oldData = {
                '2026-03-01': { color: 'rgba(144, 238, 144, 0.9)', timestamp: '2026-03-01T10:00:00.000Z' },
                '2026-03-02': { color: 'rgba(100, 200, 210, 0.6)', timestamp: '2026-03-02T09:00:00.000Z' },
                '2026-03-03': { color: '#90ee90', timestamp: '2026-03-03T08:00:00.000Z' }
            };
            localStorageStore.moodTracker = JSON.stringify(oldData);
            localStorageStore.language = 'en';
            localStorageStore.counterMode = 'streak';
            localStorageStore.calendarView = 'year';

            await migrateIfNeeded();

            const migrated = chromeStore.miAura_v2;
            expect(migrated).toBeDefined();
            expect(migrated.version).toBe(2);
            expect(Object.keys(migrated.moods)).toHaveLength(3);
            expect(migrated.moods['2026-03-01'].level).toBe(1);
            expect(migrated.moods['2026-03-02'].level).toBe(3);
            expect(migrated.moods['2026-03-03'].level).toBe(1); // #90ee90 -> level 1
            expect(migrated.settings.language).toBe('en');
            expect(migrated.settings.counterMode).toBe('streak');
            expect(migrated.settings.calendarView).toBe('year');
        });

        it('should remove old localStorage keys after successful migration', async () => {
            localStorageStore.moodTracker = JSON.stringify({
                '2026-03-01': { color: 'rgba(144, 238, 144, 0.9)', timestamp: '2026-03-01T10:00:00.000Z' }
            });
            localStorageStore.language = 'en';

            await migrateIfNeeded();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('moodTracker');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('language');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('counterMode');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('calendarView');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('testStreakDays');
        });

        it('should handle empty localStorage gracefully', async () => {
            await migrateIfNeeded();
            const data = chromeStore.miAura_v2;
            expect(data).toBeDefined();
            expect(data.moods).toEqual({});
            expect(data.settings.language).toBe('en');
        });

        it('should preserve isTest flag during migration', async () => {
            localStorageStore.moodTracker = JSON.stringify({
                '2026-03-01': { color: 'rgba(144, 238, 144, 0.9)', timestamp: '2026-03-01T10:00:00.000Z', isTest: true }
            });

            await migrateIfNeeded();

            expect(chromeStore.miAura_v2.moods['2026-03-01'].isTest).toBe(true);
        });
    });

    describe('setTestStreak / clearTestStreak', () => {
        it('should create test entries with level 1 and isTest flag', async () => {
            await setTestStreak(3);
            const data = await loadData();
            const entries = Object.values(data.moods);
            expect(entries.length).toBe(3);
            entries.forEach(entry => {
                expect(entry.level).toBe(1);
                expect(entry.isTest).toBe(true);
            });
        });

        it('should clear only test entries', async () => {
            // Add a real entry first
            await saveMoodForDate('2020-01-01', 3);
            // Add test entries
            await setTestStreak(3);

            const beforeClear = await loadData();
            expect(Object.keys(beforeClear.moods).length).toBe(4); // 1 real + 3 test

            await clearTestStreak();

            const afterClear = await loadData();
            expect(Object.keys(afterClear.moods).length).toBe(1);
            expect(afterClear.moods['2020-01-01']).toBeDefined();
        });
    });
});
