/**
 * State management module - centralized application state
 */

import { getCurrentYear } from './dateUtils.js';

/**
 * Application state object
 */
const state = {
    selectedColor: null,
    currentYear: getCurrentYear(),
    viewYear: getCurrentYear(),
    viewMonth: new Date().getMonth(),
    viewWeekStart: getWeekStart(new Date())
};

/**
 * Gets the Monday of the week containing the given date
 * @param {Date} date - Any date
 * @returns {Date} - Monday of that week
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Gets the currently selected mood color
 * @returns {string|null} - Selected color or null
 */
export function getSelectedColor() {
    return state.selectedColor;
}

/**
 * Sets the selected mood color
 * @param {string|null} color - Color to select
 */
export function setSelectedColor(color) {
    state.selectedColor = color;
}

/**
 * Gets the current calendar year (actual year)
 * @returns {number} - Current year
 */
export function getActualYear() {
    return state.currentYear;
}

/**
 * Gets the year being viewed in the calendar
 * @returns {number} - View year
 */
export function getViewYear() {
    return state.viewYear;
}

/**
 * Sets the year being viewed in the calendar
 * @param {number} year - Year to view
 */
export function setViewYear(year) {
    state.viewYear = year;
}

/**
 * Increments the view year by 1
 * @returns {number} - New view year
 */
export function incrementViewYear() {
    state.viewYear++;
    return state.viewYear;
}

/**
 * Decrements the view year by 1
 * @returns {number} - New view year
 */
export function decrementViewYear() {
    state.viewYear--;
    return state.viewYear;
}

/**
 * Resets view year to current year
 */
export function resetViewYear() {
    state.viewYear = state.currentYear;
}

/**
 * Gets the current view month (0-11)
 * @returns {number} - View month
 */
export function getViewMonth() {
    return state.viewMonth;
}

/**
 * Sets the view month
 * @param {number} month - Month (0-11)
 */
export function setViewMonth(month) {
    state.viewMonth = month;
}

/**
 * Increments view month, handling year rollover
 */
export function incrementViewMonth() {
    state.viewMonth++;
    if (state.viewMonth > 11) {
        state.viewMonth = 0;
        state.viewYear++;
    }
}

/**
 * Decrements view month, handling year rollover
 */
export function decrementViewMonth() {
    state.viewMonth--;
    if (state.viewMonth < 0) {
        state.viewMonth = 11;
        state.viewYear--;
    }
}

/**
 * Gets the current view week start date
 * @returns {Date} - Week start date (Monday)
 */
export function getViewWeekStart() {
    return new Date(state.viewWeekStart);
}

/**
 * Increments view week by 7 days
 */
export function incrementViewWeek() {
    state.viewWeekStart.setDate(state.viewWeekStart.getDate() + 7);
}

/**
 * Decrements view week by 7 days
 */
export function decrementViewWeek() {
    state.viewWeekStart.setDate(state.viewWeekStart.getDate() - 7);
}

/**
 * Resets all view states to current date
 */
export function resetAllViews() {
    const now = new Date();
    state.viewYear = state.currentYear;
    state.viewMonth = now.getMonth();
    state.viewWeekStart = getWeekStart(now);
}

// Need to expose getWeekStart for external use
export { getWeekStart };
