/**
 * Grid renderer module - handles year/month/week calendar grid rendering
 */

import { loadData, calculateStreakFromMoods, getStreakHeatLevel } from './storage.js';
import { LEVEL_TO_COLOR } from './themes.js';
import { generateYearDates, getTodayDateString, formatDateForDisplay, formatDateString } from './dateUtils.js';
import { getMoodLabel, t } from './localization.js';
import { getViewYear, getActualYear, getViewMonth, getViewWeekStart } from './state.js';

/**
 * Creates a single day cell element (year view)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @param {Object|null} moodEntry - { level, timestamp } or null
 * @param {boolean} isToday
 * @param {string} language - Current language code
 * @returns {HTMLElement}
 */
function createDayCell(dateString, date, moodEntry, isToday, language) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    if (isToday) {
        cell.classList.add('today');
    }

    if (moodEntry) {
        const color = LEVEL_TO_COLOR[moodEntry.level];
        cell.style.background = color;
        cell.classList.add('logged');

        const formattedDate = formatDateForDisplay(date, language);
        const mood = getMoodLabel(color, language);
        cell.setAttribute('data-tooltip', `${formattedDate} • ${mood}`);
    }

    return cell;
}

/**
 * Renders the year grid with mood data
 * @param {Object} moods - The moods map from data
 * @param {string} language - Current language code
 * @returns {number} - Number of logged days
 */
function renderYearGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';

    const viewYear = getViewYear();
    const currentYear = getActualYear();
    const today = getTodayDateString();
    const yearDates = generateYearDates(viewYear);

    let loggedCount = 0;

    yearDates.forEach(({ date, dateString }) => {
        const moodEntry = moods[dateString];
        const isToday = dateString === today && viewYear === currentYear;

        const cell = createDayCell(dateString, date, moodEntry, isToday, language);
        grid.appendChild(cell);

        if (moodEntry) {
            loggedCount++;
        }
    });

    return loggedCount;
}

/**
 * Creates a large day cell for month/week view
 * @param {string} _dateString - Date in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @param {Object|null} moodEntry - { level, timestamp } or null
 * @param {boolean} isToday
 * @param {string} viewMode - 'month' or 'week'
 * @param {string} language - Current language code
 * @returns {HTMLElement}
 */
function createLargeDayCell(_dateString, date, moodEntry, isToday, viewMode, language) {
    const cell = document.createElement('div');
    cell.className = `day-cell-large day-cell-${viewMode}`;

    if (isToday) {
        cell.classList.add('today');
    }

    const dayNum = document.createElement('span');
    dayNum.className = 'day-num';
    dayNum.textContent = date.getDate();
    cell.appendChild(dayNum);

    if (moodEntry) {
        const color = LEVEL_TO_COLOR[moodEntry.level];
        cell.style.background = color;
        cell.classList.add('logged');

        const mood = getMoodLabel(color, language);
        cell.setAttribute('data-tooltip', mood);

        if (viewMode === 'week') {
            cell.dataset.level = moodEntry.level;
        }
    }

    return cell;
}

/**
 * Renders the month grid with mood data
 * @param {Object} moods - The moods map
 * @param {string} language - Current language code
 * @returns {number} - Number of logged days in month
 */
function renderMonthGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'month-grid';

    const viewYear = getViewYear();
    const viewMonth = getViewMonth();
    const today = getTodayDateString();

    // Add day headers
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dayNames.forEach(name => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = name;
        grid.appendChild(header);
    });

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell-empty';
        grid.appendChild(empty);
    }

    let loggedCount = 0;

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(viewYear, viewMonth, day);
        const dateString = formatDateString(date);
        const moodEntry = moods[dateString];
        const isToday = dateString === today;

        const cell = createLargeDayCell(dateString, date, moodEntry, isToday, 'month', language);
        grid.appendChild(cell);

        if (moodEntry) {
            loggedCount++;
        }
    }

    return loggedCount;
}

/**
 * Renders the week grid with mood data (vertical layout)
 * @param {Object} moods - The moods map
 * @param {string} language - Current language code
 * @returns {number} - Number of logged days in week
 */
function renderWeekGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'week-grid';

    const weekStart = getViewWeekStart();
    const today = getTodayDateString();

    const dayNames = getDayNames(language);

    let loggedCount = 0;

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = formatDateString(date);
        const moodEntry = moods[dateString];
        const isToday = dateString === today;

        const row = document.createElement('div');
        row.className = 'week-day-row';

        const dayName = document.createElement('span');
        dayName.className = 'day-name-week';
        dayName.textContent = dayNames[i];
        row.appendChild(dayName);

        const cell = createLargeDayCell(dateString, date, moodEntry, isToday, 'week', language);
        row.appendChild(cell);

        grid.appendChild(row);

        if (moodEntry) {
            loggedCount++;
        }
    }

    return loggedCount;
}

/**
 * Gets localized short day names (Mon, Tue, etc.)
 * @param {string} language
 * @returns {string[]}
 */
function getDayNames(language) {
    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
    const locale = localeMap[language] || 'en-US';
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push(new Date(2000, 0, 3 + i).toLocaleDateString(locale, { weekday: 'short' }));
    }
    return days;
}

/**
 * Updates the display header based on view mode
 * @param {number} loggedCount
 * @param {Object} data - The full miAura_v2 data object
 */
function updateDisplayHeader(loggedCount, data) {
    const yearDisplay = document.getElementById('yearDisplay');
    const language = data.settings.language;
    const calendarView = data.settings.calendarView;

    if (yearDisplay) {
        if (calendarView === 'year') {
            yearDisplay.textContent = getViewYear();
        } else if (calendarView === 'month') {
            const monthNames = getMonthNames(language);
            yearDisplay.textContent = `${monthNames[getViewMonth()]} ${getViewYear()}`;
        } else if (calendarView === 'week') {
            const weekStart = getViewWeekStart();
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            yearDisplay.textContent = `${formatDateForDisplay(weekStart, language)} - ${formatDateForDisplay(weekEnd, language)}`;
        }
    }

    // Update stats badge
    const loggedDays = document.getElementById('loggedDays');
    const counterMode = data.settings.counterMode;

    if (loggedDays) {
        if (counterMode === 'streak') {
            const streak = calculateStreakFromMoods(data.moods);
            const heatLevel = getStreakHeatLevel(streak);
            const streakText = t('dayStreak', language);

            loggedDays.innerHTML = `
                <span class="days-count">${streak}</span>
                <span class="days-word">${streakText}</span>
            `;
            loggedDays.title = `${streak} ${t('dayStreak', language)}`;
            loggedDays.className = 'streak-badge';
            loggedDays.dataset.heatLevel = heatLevel;
        } else {
            const daysText = t('daysLogged', language).split(' ');
            loggedDays.innerHTML = `
                <span class="days-count">${loggedCount}</span>
                <span class="days-word">${daysText[0]}</span>
            `;
            loggedDays.title = t('daysLogged', language);
            loggedDays.className = '';
            delete loggedDays.dataset.heatLevel;
        }
    }
}

/**
 * Gets localized month names
 * @param {string} language
 * @returns {string[]}
 */
function getMonthNames(language) {
    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
    const locale = localeMap[language] || 'en-US';
    const months = [];
    for (let i = 0; i < 12; i++) {
        months.push(new Date(2000, i, 1).toLocaleDateString(locale, { month: 'short' }));
    }
    return months;
}

/**
 * Full grid load - renders grid based on view mode and updates stats.
 * Accepts an optional data parameter to avoid redundant storage reads.
 * @param {Object} [data] - Pre-loaded miAura_v2 data; fetched if omitted
 */
export async function loadYearGrid(data = null) {
    if (!data) {
        data = await loadData();
    }

    const calendarView = data.settings.calendarView;
    const language = data.settings.language;
    const moods = data.moods;
    const grid = document.getElementById('yearGrid');
    let loggedCount = 0;

    // Reset grid class
    if (grid) {
        grid.className = 'year-grid';
    }

    if (calendarView === 'month') {
        loggedCount = renderMonthGrid(moods, language);
    } else if (calendarView === 'week') {
        loggedCount = renderWeekGrid(moods, language);
    } else {
        loggedCount = renderYearGrid(moods, language);
    }

    updateDisplayHeader(loggedCount, data);
}
