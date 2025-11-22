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
    viewYear: getCurrentYear()
};

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
