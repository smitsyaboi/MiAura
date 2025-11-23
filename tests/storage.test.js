import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    migrateColor,
    getMoodData,
    saveMoodForDate,
    getMoodForDate,
    getLanguagePreference,
    setLanguagePreference,
    getCounterMode,
    setCounterMode,
    getCalendarView,
    setCalendarView,
    calculateStreak,
    getStreakHeatLevel,
    setTestStreak,
    clearTestStreak
} from '../js/storage.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('storage', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('migrateColor', () => {
        it('should migrate old hex color #90ee90 to rgba', () => {
            expect(migrateColor('#90ee90')).toBe('rgba(144, 238, 144, 0.9)');
        });

        it('should migrate old hex color #6eb86e to rgba', () => {
            expect(migrateColor('#6eb86e')).toBe('rgba(120, 220, 180, 0.75)');
        });

        it('should migrate old hex color #528f62 to rgba', () => {
            expect(migrateColor('#528f62')).toBe('rgba(100, 200, 210, 0.6)');
        });

        it('should migrate old hex color #3d5d55 to rgba', () => {
            expect(migrateColor('#3d5d55')).toBe('rgba(140, 180, 220, 0.45)');
        });

        it('should migrate old hex color #252525 to rgba', () => {
            expect(migrateColor('#252525')).toBe('rgba(160, 180, 200, 0.3)');
        });

        it('should return original color if no migration needed', () => {
            const newColor = 'rgba(144, 238, 144, 0.9)';
            expect(migrateColor(newColor)).toBe(newColor);
        });

        it('should return unknown colors unchanged', () => {
            expect(migrateColor('#ffffff')).toBe('#ffffff');
        });
    });

    describe('getMoodData / saveMoodForDate', () => {
        it('should return empty object when no data exists', () => {
            expect(getMoodData()).toEqual({});
        });

        it('should save and retrieve mood data', () => {
            saveMoodForDate('2025-01-15', 'rgba(144, 238, 144, 0.9)');

            expect(localStorageMock.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedData['2025-01-15']).toBeDefined();
            expect(savedData['2025-01-15'].color).toBe('rgba(144, 238, 144, 0.9)');
        });

        it('should not save when color is null', () => {
            saveMoodForDate('2025-01-15', null);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('should include timestamp in saved data', () => {
            saveMoodForDate('2025-01-15', 'rgba(144, 238, 144, 0.9)');

            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedData['2025-01-15'].timestamp).toBeDefined();
        });
    });

    describe('getMoodForDate', () => {
        it('should return null for non-existent date', () => {
            expect(getMoodForDate('2025-01-15')).toBeNull();
        });

        it('should return mood data for existing date', () => {
            const mockData = {
                '2025-01-15': { color: 'rgba(144, 238, 144, 0.9)', timestamp: '2025-01-15T12:00:00Z' }
            };
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockData));

            const result = getMoodForDate('2025-01-15');
            expect(result).toEqual(mockData['2025-01-15']);
        });
    });

    describe('getLanguagePreference / setLanguagePreference', () => {
        it('should return "en" as default language', () => {
            expect(getLanguagePreference()).toBe('en');
        });

        it('should save language preference', () => {
            setLanguagePreference('fr');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'fr');
        });

        it('should retrieve saved language preference', () => {
            localStorageMock.getItem.mockReturnValueOnce('pt');
            expect(getLanguagePreference()).toBe('pt');
        });
    });

    describe('getCounterMode / setCounterMode', () => {
        it('should return "streak" as default counter mode', () => {
            expect(getCounterMode()).toBe('streak');
        });

        it('should save counter mode', () => {
            setCounterMode('total');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('counterMode', 'total');
        });

        it('should retrieve saved counter mode', () => {
            localStorageMock.getItem.mockReturnValueOnce('total');
            expect(getCounterMode()).toBe('total');
        });
    });

    describe('getCalendarView / setCalendarView', () => {
        it('should return "year" as default view', () => {
            expect(getCalendarView()).toBe('year');
        });

        it('should save calendar view', () => {
            setCalendarView('month');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('calendarView', 'month');
        });

        it('should retrieve saved calendar view', () => {
            localStorageMock.getItem.mockReturnValueOnce('week');
            expect(getCalendarView()).toBe('week');
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

    describe('calculateStreak', () => {
        it('should return 0 when no mood data', () => {
            expect(calculateStreak()).toBe(0);
        });

        it('should calculate streak correctly', () => {
            // Mock today and yesterday being logged
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const formatDate = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const mockData = {
                [formatDate(today)]: { color: 'rgba(144, 238, 144, 0.9)' },
                [formatDate(yesterday)]: { color: 'rgba(144, 238, 144, 0.9)' }
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

            expect(calculateStreak()).toBe(2);
        });

        it('should calculate streak across year boundary', () => {
            // Simulate a streak that spans Dec 31 -> Jan 1
            const mockData = {
                '2025-01-03': { color: 'rgba(144, 238, 144, 0.9)' },
                '2025-01-02': { color: 'rgba(144, 238, 144, 0.9)' },
                '2025-01-01': { color: 'rgba(144, 238, 144, 0.9)' },
                '2024-12-31': { color: 'rgba(144, 238, 144, 0.9)' },
                '2024-12-30': { color: 'rgba(144, 238, 144, 0.9)' }
            };

            // Mock "today" as Jan 3, 2025
            const originalDate = global.Date;
            const mockDate = new Date('2025-01-03T12:00:00');
            global.Date = class extends originalDate {
                constructor(...args) {
                    if (args.length === 0) {
                        return mockDate;
                    }
                    return new originalDate(...args);
                }
                static now() {
                    return mockDate.getTime();
                }
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
            expect(calculateStreak()).toBe(5);

            global.Date = originalDate;
        });

        it('should handle streak starting on Jan 1 of new year', () => {
            const mockData = {
                '2025-01-02': { color: 'rgba(144, 238, 144, 0.9)' },
                '2025-01-01': { color: 'rgba(144, 238, 144, 0.9)' }
            };

            const originalDate = global.Date;
            const mockDate = new Date('2025-01-02T12:00:00');
            global.Date = class extends originalDate {
                constructor(...args) {
                    if (args.length === 0) {
                        return mockDate;
                    }
                    return new originalDate(...args);
                }
                static now() {
                    return mockDate.getTime();
                }
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
            expect(calculateStreak()).toBe(2);

            global.Date = originalDate;
        });

        it('should break streak if Dec 31 is missing', () => {
            const mockData = {
                '2025-01-02': { color: 'rgba(144, 238, 144, 0.9)' },
                '2025-01-01': { color: 'rgba(144, 238, 144, 0.9)' },
                // Dec 31 missing
                '2024-12-30': { color: 'rgba(144, 238, 144, 0.9)' }
            };

            const originalDate = global.Date;
            const mockDate = new Date('2025-01-02T12:00:00');
            global.Date = class extends originalDate {
                constructor(...args) {
                    if (args.length === 0) {
                        return mockDate;
                    }
                    return new originalDate(...args);
                }
                static now() {
                    return mockDate.getTime();
                }
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
            expect(calculateStreak()).toBe(2); // Only Jan 1-2

            global.Date = originalDate;
        });
    });
});
