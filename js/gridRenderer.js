/**
 * Grid renderer module - handles year calendar grid rendering
 */

import { getMoodData, migrateColor } from './storage.js';
import { generateYearDates, getTodayDateString, formatDateForDisplay } from './dateUtils.js';
import { getCurrentLanguage, getMoodLabel, t } from './localization.js';
import { getViewYear, getActualYear } from './state.js';

/**
 * Creates a single day cell element
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @param {Object|null} moodEntry - Mood data for the date
 * @param {boolean} isToday - Whether this is today's date
 * @returns {HTMLElement} - The day cell element
 */
function createDayCell(dateString, date, moodEntry, isToday) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    if (isToday) {
        cell.classList.add('today');
    }

    if (moodEntry) {
        const color = migrateColor(moodEntry.color);
        cell.style.background = color;
        cell.classList.add('logged');

        const language = getCurrentLanguage();
        const formattedDate = formatDateForDisplay(date, language);
        const mood = getMoodLabel(color, language);
        cell.setAttribute('data-tooltip', `${formattedDate} • ${mood}`);
    }

    return cell;
}

/**
 * Renders the year grid with mood data
 * @returns {number} - Number of logged days
 */
export function renderYearGrid() {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';

    const viewYear = getViewYear();
    const currentYear = getActualYear();
    const moodData = getMoodData();
    const today = getTodayDateString();
    const yearDates = generateYearDates(viewYear);

    let loggedCount = 0;

    yearDates.forEach(({ date, dateString }) => {
        const moodEntry = moodData[dateString];
        const isToday = dateString === today && viewYear === currentYear;

        const cell = createDayCell(dateString, date, moodEntry, isToday);
        grid.appendChild(cell);

        if (moodEntry) {
            loggedCount++;
        }
    });

    return loggedCount;
}

/**
 * Updates the year display and logged days count
 * @param {number} loggedCount - Number of logged days
 */
export function updateYearStats(loggedCount) {
    const yearDisplay = document.getElementById('yearDisplay');
    const loggedDays = document.getElementById('loggedDays');
    const language = getCurrentLanguage();

    if (yearDisplay) {
        yearDisplay.textContent = getViewYear();
    }

    if (loggedDays) {
        loggedDays.textContent = `${loggedCount} ${t('daysLogged', language)}`;
    }
}

/**
 * Full grid load - renders grid and updates stats
 */
export function loadYearGrid() {
    const loggedCount = renderYearGrid();
    updateYearStats(loggedCount);
}
