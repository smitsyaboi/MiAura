import { describe, it, expect } from 'vitest';
import {
    formatDateString,
    getTodayDateString,
    getCurrentYear,
    generateYearDates,
    formatDateForDisplay
} from '../js/dateUtils.js';

describe('dateUtils', () => {
    describe('formatDateString', () => {
        it('should format date as YYYY-MM-DD', () => {
            const date = new Date(2025, 0, 15); // Jan 15, 2025
            expect(formatDateString(date)).toBe('2025-01-15');
        });

        it('should pad single digit months with leading zero', () => {
            const date = new Date(2025, 4, 5); // May 5, 2025
            expect(formatDateString(date)).toBe('2025-05-05');
        });

        it('should handle December correctly', () => {
            const date = new Date(2025, 11, 31); // Dec 31, 2025
            expect(formatDateString(date)).toBe('2025-12-31');
        });

        it('should handle leap year date', () => {
            const date = new Date(2024, 1, 29); // Feb 29, 2024
            expect(formatDateString(date)).toBe('2024-02-29');
        });
    });

    describe('getTodayDateString', () => {
        it('should return today\'s date in YYYY-MM-DD format', () => {
            const today = new Date();
            const expected = formatDateString(today);
            expect(getTodayDateString()).toBe(expected);
        });

        it('should match date pattern', () => {
            const result = getTodayDateString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getCurrentYear', () => {
        it('should return the current year as a number', () => {
            const expected = new Date().getFullYear();
            expect(getCurrentYear()).toBe(expected);
        });

        it('should return a 4-digit year', () => {
            const year = getCurrentYear();
            expect(year).toBeGreaterThanOrEqual(2020);
            expect(year).toBeLessThan(3000);
        });
    });

    describe('generateYearDates', () => {
        it('should generate 365 dates for a non-leap year', () => {
            const dates = generateYearDates(2025);
            expect(dates.length).toBe(365);
        });

        it('should generate 366 dates for a leap year', () => {
            const dates = generateYearDates(2024);
            expect(dates.length).toBe(366);
        });

        it('should start with January 1st', () => {
            const dates = generateYearDates(2025);
            expect(dates[0].dateString).toBe('2025-01-01');
        });

        it('should end with December 31st', () => {
            const dates = generateYearDates(2025);
            expect(dates[dates.length - 1].dateString).toBe('2025-12-31');
        });

        it('should include both date object and dateString', () => {
            const dates = generateYearDates(2025);
            const firstDate = dates[0];
            expect(firstDate).toHaveProperty('date');
            expect(firstDate).toHaveProperty('dateString');
            expect(firstDate.date instanceof Date).toBe(true);
            expect(typeof firstDate.dateString).toBe('string');
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format date in English locale', () => {
            const date = new Date(2025, 0, 15); // Jan 15
            const result = formatDateForDisplay(date, 'en');
            expect(result).toContain('15');
            expect(result.toLowerCase()).toContain('jan');
        });

        it('should format date in French locale', () => {
            const date = new Date(2025, 0, 15); // Jan 15
            const result = formatDateForDisplay(date, 'fr');
            expect(result).toContain('15');
            // French uses "janv." for January
            expect(result.toLowerCase()).toMatch(/jan/);
        });

        it('should format date in Portuguese locale', () => {
            const date = new Date(2025, 0, 15); // Jan 15
            const result = formatDateForDisplay(date, 'pt');
            expect(result).toContain('15');
        });

        it('should handle different months', () => {
            const july = new Date(2025, 6, 4); // July 4
            const result = formatDateForDisplay(july, 'en');
            expect(result.toLowerCase()).toContain('jul');
        });
    });

    describe('year transitions', () => {
        it('should format Dec 31 correctly', () => {
            const dec31 = new Date(2025, 11, 31);
            expect(formatDateString(dec31)).toBe('2025-12-31');
        });

        it('should format Jan 1 of next year correctly', () => {
            const jan1 = new Date(2026, 0, 1);
            expect(formatDateString(jan1)).toBe('2026-01-01');
        });

        it('should generate correct dates for future years', () => {
            const dates2026 = generateYearDates(2026);
            expect(dates2026[0].dateString).toBe('2026-01-01');
            expect(dates2026[dates2026.length - 1].dateString).toBe('2026-12-31');
            expect(dates2026.length).toBe(365); // 2026 is not a leap year
        });

        it('should generate correct dates for leap year 2028', () => {
            const dates2028 = generateYearDates(2028);
            expect(dates2028.length).toBe(366);
            // Check Feb 29 exists
            const feb29 = dates2028.find(d => d.dateString === '2028-02-29');
            expect(feb29).toBeDefined();
        });

        it('should handle year 2030 correctly', () => {
            const dates2030 = generateYearDates(2030);
            expect(dates2030[0].dateString).toBe('2030-01-01');
            expect(dates2030[dates2030.length - 1].dateString).toBe('2030-12-31');
        });
    });
});
