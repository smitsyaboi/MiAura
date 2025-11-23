import { describe, it, expect, beforeEach } from 'vitest';
import {
    getSelectedColor,
    setSelectedColor,
    getActualYear,
    getViewYear,
    setViewYear,
    incrementViewYear,
    decrementViewYear,
    resetViewYear,
    getViewMonth,
    setViewMonth,
    incrementViewMonth,
    decrementViewMonth,
    getViewWeekStart,
    incrementViewWeek,
    decrementViewWeek,
    resetAllViews,
    getWeekStart
} from '../js/state.js';

describe('state', () => {
    beforeEach(() => {
        // Reset state before each test
        resetAllViews();
        setSelectedColor(null);
    });

    describe('selectedColor', () => {
        it('should return null initially', () => {
            setSelectedColor(null);
            expect(getSelectedColor()).toBeNull();
        });

        it('should set and get selected color', () => {
            setSelectedColor('rgba(144, 238, 144, 0.9)');
            expect(getSelectedColor()).toBe('rgba(144, 238, 144, 0.9)');
        });

        it('should update selected color', () => {
            setSelectedColor('rgba(144, 238, 144, 0.9)');
            setSelectedColor('rgba(100, 200, 210, 0.6)');
            expect(getSelectedColor()).toBe('rgba(100, 200, 210, 0.6)');
        });
    });

    describe('viewYear', () => {
        it('should return current year initially', () => {
            const currentYear = new Date().getFullYear();
            expect(getViewYear()).toBe(currentYear);
        });

        it('should set view year', () => {
            setViewYear(2020);
            expect(getViewYear()).toBe(2020);
        });

        it('should increment view year', () => {
            const initial = getViewYear();
            incrementViewYear();
            expect(getViewYear()).toBe(initial + 1);
        });

        it('should decrement view year', () => {
            const initial = getViewYear();
            decrementViewYear();
            expect(getViewYear()).toBe(initial - 1);
        });

        it('should reset to current year', () => {
            const currentYear = new Date().getFullYear();
            setViewYear(2000);
            resetViewYear();
            expect(getViewYear()).toBe(currentYear);
        });
    });

    describe('actualYear', () => {
        it('should return current year', () => {
            const expected = new Date().getFullYear();
            expect(getActualYear()).toBe(expected);
        });

        it('should not change when viewYear changes', () => {
            const expected = new Date().getFullYear();
            setViewYear(2000);
            expect(getActualYear()).toBe(expected);
        });
    });

    describe('viewMonth', () => {
        it('should return current month initially', () => {
            resetAllViews();
            const currentMonth = new Date().getMonth();
            expect(getViewMonth()).toBe(currentMonth);
        });

        it('should set view month', () => {
            setViewMonth(5); // June
            expect(getViewMonth()).toBe(5);
        });

        it('should increment view month', () => {
            setViewMonth(5);
            incrementViewMonth();
            expect(getViewMonth()).toBe(6);
        });

        it('should handle year rollover on increment', () => {
            setViewMonth(11); // December
            const initialYear = getViewYear();
            incrementViewMonth();
            expect(getViewMonth()).toBe(0); // January
            expect(getViewYear()).toBe(initialYear + 1);
        });

        it('should decrement view month', () => {
            setViewMonth(5);
            decrementViewMonth();
            expect(getViewMonth()).toBe(4);
        });

        it('should handle year rollover on decrement', () => {
            setViewMonth(0); // January
            const initialYear = getViewYear();
            decrementViewMonth();
            expect(getViewMonth()).toBe(11); // December
            expect(getViewYear()).toBe(initialYear - 1);
        });
    });

    describe('viewWeekStart', () => {
        it('should return a Date object', () => {
            const weekStart = getViewWeekStart();
            expect(weekStart instanceof Date).toBe(true);
        });

        it('should return Monday of current week initially', () => {
            resetAllViews();
            const weekStart = getViewWeekStart();
            // Monday is day 1 in JavaScript (0 = Sunday)
            expect(weekStart.getDay()).toBe(1);
        });

        it('should increment by 7 days', () => {
            const initial = getViewWeekStart();
            incrementViewWeek();
            const after = getViewWeekStart();
            const diffDays = (after - initial) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBe(7);
        });

        it('should decrement by 7 days', () => {
            const initial = getViewWeekStart();
            decrementViewWeek();
            const after = getViewWeekStart();
            const diffDays = (initial - after) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBe(7);
        });
    });

    describe('getWeekStart', () => {
        it('should return Monday for a Wednesday', () => {
            // Jan 15, 2025 is a Wednesday
            const wednesday = new Date(2025, 0, 15);
            const monday = getWeekStart(wednesday);
            expect(monday.getDay()).toBe(1); // Monday
            expect(monday.getDate()).toBe(13); // Jan 13
        });

        it('should return same day for a Monday', () => {
            // Jan 13, 2025 is a Monday
            const monday = new Date(2025, 0, 13);
            const result = getWeekStart(monday);
            expect(result.getDate()).toBe(13);
        });

        it('should return previous Monday for a Sunday', () => {
            // Jan 19, 2025 is a Sunday
            const sunday = new Date(2025, 0, 19);
            const monday = getWeekStart(sunday);
            expect(monday.getDay()).toBe(1);
            expect(monday.getDate()).toBe(13); // Jan 13
        });

        it('should handle month boundaries', () => {
            // Feb 1, 2025 is a Saturday
            const saturday = new Date(2025, 1, 1);
            const monday = getWeekStart(saturday);
            expect(monday.getMonth()).toBe(0); // January
            expect(monday.getDate()).toBe(27); // Jan 27
        });
    });

    describe('resetAllViews', () => {
        it('should reset all views to current date', () => {
            // Change all views
            setViewYear(2000);
            setViewMonth(0);
            incrementViewWeek();
            incrementViewWeek();

            // Reset
            resetAllViews();

            const now = new Date();
            expect(getViewYear()).toBe(now.getFullYear());
            expect(getViewMonth()).toBe(now.getMonth());

            const weekStart = getViewWeekStart();
            const expectedMonday = getWeekStart(now);
            expect(weekStart.getTime()).toBe(expectedMonday.getTime());
        });
    });

    describe('year transitions', () => {
        it('should navigate to future years', () => {
            const currentYear = new Date().getFullYear();
            setViewYear(currentYear);
            incrementViewYear();
            expect(getViewYear()).toBe(currentYear + 1);
            incrementViewYear();
            expect(getViewYear()).toBe(currentYear + 2);
        });

        it('should handle navigation to year 2030', () => {
            setViewYear(2030);
            expect(getViewYear()).toBe(2030);
        });

        it('should handle month rollover from Dec to Jan of next year', () => {
            setViewYear(2025);
            setViewMonth(11); // December
            incrementViewMonth();
            expect(getViewMonth()).toBe(0); // January
            expect(getViewYear()).toBe(2026);
        });

        it('should handle month rollover from Jan to Dec of previous year', () => {
            setViewYear(2026);
            setViewMonth(0); // January
            decrementViewMonth();
            expect(getViewMonth()).toBe(11); // December
            expect(getViewYear()).toBe(2025);
        });

        it('should handle week navigation across year boundary', () => {
            // Set to last week of 2025
            const dec29_2025 = new Date(2025, 11, 29); // Monday
            // Navigate weeks forward
            setViewYear(2025);
            setViewMonth(11);

            // Get week start for Dec 29, 2025
            const weekStart = getWeekStart(dec29_2025);
            expect(weekStart.getFullYear()).toBe(2025);
            expect(weekStart.getMonth()).toBe(11);
            expect(weekStart.getDate()).toBe(29);
        });
    });
});
