/**
 * Grid renderer module - handles year/month/week calendar grid rendering
 */

import { getMoodData, migrateColor, getCounterMode, calculateStreak, getStreakHeatLevel, getCalendarView } from './storage.js';
import { generateYearDates, getTodayDateString, formatDateForDisplay, formatDateString } from './dateUtils.js';
import { getCurrentLanguage, getMoodLabel, getMoodLevel, t } from './localization.js';
import { getViewYear, getActualYear, getViewMonth, getViewWeekStart } from './state.js';
import { getActiveColors } from './colorTemplates.js';

/**
 * Get the current template's color for a given mood level
 * @param {number} level - Mood level (1-5)
 * @returns {string} RGBA color string for the current template
 */
function getColorForLevel(level) {
    const activeColors = getActiveColors();
    const colorMap = {
        1: activeColors.fantastic,
        2: activeColors.fine,
        3: activeColors.okay,
        4: activeColors.low,
        5: activeColors.down
    };
    return colorMap[level]?.rgba || activeColors.okay.rgba;
}

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
        const storedColor = migrateColor(moodEntry.color);
        // Get the mood level from the stored color
        const level = getMoodLevel(storedColor);
        // Get the current template's color for this level
        const currentColor = getColorForLevel(level);

        cell.style.background = currentColor;
        cell.classList.add('logged');

        const language = getCurrentLanguage();
        const formattedDate = formatDateForDisplay(date, language);
        const mood = getMoodLabel(currentColor, language);
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
    const counterMode = getCounterMode();

    if (yearDisplay) {
        yearDisplay.textContent = getViewYear();
    }

    if (loggedDays) {
        if (counterMode === 'streak') {
            const streak = calculateStreak();
            const heatLevel = getStreakHeatLevel(streak);
            const streakText = t('dayStreak', language);

            loggedDays.innerHTML = `
                <span class="days-count">${streak}</span>
                <span class="days-word">${streakText}</span>
            `;
            loggedDays.title = `${streak} ${t('dayStreak', language)}`;

            // Update heat level for bubble animation
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
 * Creates a large day cell for month/week view
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @param {Object|null} moodEntry - Mood data for the date
 * @param {boolean} isToday - Whether this is today's date
 * @param {string} viewMode - 'month' or 'week'
 * @returns {HTMLElement} - The day cell element
 */
function createLargeDayCell(_dateString, date, moodEntry, isToday, viewMode) {
    const cell = document.createElement('div');
    cell.className = `day-cell-large day-cell-${viewMode}`;

    if (isToday) {
        cell.classList.add('today');
    }

    // Add day number
    const dayNum = document.createElement('span');
    dayNum.className = 'day-num';
    dayNum.textContent = date.getDate();
    cell.appendChild(dayNum);

    if (moodEntry) {
        const storedColor = migrateColor(moodEntry.color);
        // Get the mood level from the stored color
        const level = getMoodLevel(storedColor);
        // Get the current template's color for this level
        const currentColor = getColorForLevel(level);

        cell.style.background = currentColor;
        cell.classList.add('logged');

        const language = getCurrentLanguage();
        const mood = getMoodLabel(currentColor, language);
        cell.setAttribute('data-tooltip', mood);

        // Set mood level for bar graph height in week view
        if (viewMode === 'week') {
            cell.dataset.level = level;
        }
    }

    return cell;
}

/**
 * Renders the month grid with mood data
 * @returns {number} - Number of logged days in month
 */
function renderMonthGrid() {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'month-grid';

    const viewYear = getViewYear();
    const viewMonth = getViewMonth();
    const moodData = getMoodData();
    const today = getTodayDateString();

    // Add day headers
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dayNames.forEach(name => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = name;
        grid.appendChild(header);
    });

    // Get first day of month and total days
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday = 0, Sunday = 6 for our grid
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell-empty';
        grid.appendChild(empty);
    }

    let loggedCount = 0;

    // Add day cells
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(viewYear, viewMonth, day);
        const dateString = formatDateString(date);
        const moodEntry = moodData[dateString];
        const isToday = dateString === today;

        const cell = createLargeDayCell(dateString, date, moodEntry, isToday, 'month');
        grid.appendChild(cell);

        if (moodEntry) {
            loggedCount++;
        }
    }

    return loggedCount;
}

/**
 * Renders the week grid with mood data (vertical layout)
 * @returns {number} - Number of logged days in week
 */
function renderWeekGrid() {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'week-grid';

    const weekStart = getViewWeekStart();
    const moodData = getMoodData();
    const today = getTodayDateString();
    const language = getCurrentLanguage();

    // Full day names for vertical layout
    const dayNames = getDayNames(language);

    let loggedCount = 0;

    // Add 7 day rows (vertical)
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = formatDateString(date);
        const moodEntry = moodData[dateString];
        const isToday = dateString === today;

        // Create row container
        const row = document.createElement('div');
        row.className = 'week-day-row';

        // Add day name
        const dayName = document.createElement('span');
        dayName.className = 'day-name-week';
        dayName.textContent = dayNames[i];
        row.appendChild(dayName);

        // Add day cell
        const cell = createLargeDayCell(dateString, date, moodEntry, isToday, 'week');
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
 * @param {string} language - Language code
 * @returns {string[]} - Array of day names starting with Monday
 */
function getDayNames(language) {
    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
    const locale = localeMap[language] || 'en-US';
    const days = [];
    // Start from Monday (Jan 3, 2000 was a Monday)
    for (let i = 0; i < 7; i++) {
        days.push(new Date(2000, 0, 3 + i).toLocaleDateString(locale, { weekday: 'short' }));
    }
    return days;
}

/**
 * Updates the display header based on view mode
 * @param {number} loggedCount - Number of logged days
 */
function updateDisplayHeader(loggedCount) {
    const yearDisplay = document.getElementById('yearDisplay');
    const language = getCurrentLanguage();
    const calendarView = getCalendarView();

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
    const counterMode = getCounterMode();

    if (loggedDays) {
        if (counterMode === 'streak') {
            const streak = calculateStreak();
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
 * @param {string} language - Language code
 * @returns {string[]} - Array of month names
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
 * Full grid load - renders grid based on view mode and updates stats
 */
export function loadYearGrid() {
    const calendarView = getCalendarView();
    const grid = document.getElementById('yearGrid');
    let loggedCount = 0;

    // Reset grid class
    if (grid) {
        grid.className = 'year-grid';
    }

    if (calendarView === 'month') {
        loggedCount = renderMonthGrid();
    } else if (calendarView === 'week') {
        loggedCount = renderWeekGrid();
    } else {
        loggedCount = renderYearGrid();
    }

    updateDisplayHeader(loggedCount);
}
