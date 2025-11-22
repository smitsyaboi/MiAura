/**
 * Storage module - handles all localStorage operations for mood data
 */

const STORAGE_KEY = 'moodTracker';

/**
 * Color migration map - converts old hex colors to new rgba colors
 */
const COLOR_MIGRATION_MAP = {
    '#90ee90': 'rgba(144, 238, 144, 0.9)',
    '#6eb86e': 'rgba(120, 220, 180, 0.75)',
    '#528f62': 'rgba(100, 200, 210, 0.6)',
    '#3d5d55': 'rgba(140, 180, 220, 0.45)',
    '#252525': 'rgba(160, 180, 200, 0.3)'
};

/**
 * Migrates old hex color format to new rgba format
 * @param {string} oldColor - The color to migrate
 * @returns {string} - The migrated color or original if no migration needed
 */
export function migrateColor(oldColor) {
    return COLOR_MIGRATION_MAP[oldColor] || oldColor;
}

/**
 * Retrieves all mood data from localStorage
 * @returns {Object} - Object with date keys and mood data values
 */
export function getMoodData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

/**
 * Saves mood data for a specific date
 * @param {string} dateString - The date in YYYY-MM-DD format
 * @param {string} color - The mood color
 */
export function saveMoodForDate(dateString, color) {
    if (!color) return;

    const moodData = getMoodData();
    moodData[dateString] = {
        color: color,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(moodData));
}

/**
 * Gets mood data for a specific date
 * @param {string} dateString - The date in YYYY-MM-DD format
 * @returns {Object|null} - Mood data for the date or null
 */
export function getMoodForDate(dateString) {
    const moodData = getMoodData();
    return moodData[dateString] || null;
}

/**
 * Gets the current language preference
 * @returns {string} - Language code (en, fr, pt)
 */
export function getLanguagePreference() {
    return localStorage.getItem('language') || 'en';
}

/**
 * Saves the language preference
 * @param {string} language - Language code to save
 */
export function setLanguagePreference(language) {
    localStorage.setItem('language', language);
}
