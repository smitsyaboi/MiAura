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

/**
 * Gets the counter mode preference (streak or total)
 * @returns {string} - Counter mode ('streak' or 'total')
 */
export function getCounterMode() {
    return localStorage.getItem('counterMode') || 'streak';
}

/**
 * Saves the counter mode preference
 * @param {string} mode - Counter mode to save ('streak' or 'total')
 */
export function setCounterMode(mode) {
    localStorage.setItem('counterMode', mode);
}

/**
 * Gets the calendar view mode preference (year, month, week)
 * @returns {string} - View mode ('year', 'month', or 'week')
 */
export function getCalendarView() {
    return localStorage.getItem('calendarView') || 'year';
}

/**
 * Saves the calendar view mode preference
 * @param {string} view - View mode to save ('year', 'month', or 'week')
 */
export function setCalendarView(view) {
    localStorage.setItem('calendarView', view);
}

/**
 * Calculates the current streak (consecutive days logged ending today or yesterday)
 * @returns {number} - Current streak count
 */
export function calculateStreak() {
    const moodData = getMoodData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    // Check if today is logged, if not start from yesterday
    const todayString = formatDateKey(checkDate);
    if (!moodData[todayString]) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days backwards
    while (true) {
        const dateString = formatDateKey(checkDate);
        if (moodData[dateString]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Formats a date to YYYY-MM-DD string for storage key
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Gets streak heat level (0-4) based on streak length
 * 0 = no streak, 1 = 3-6 days, 2 = 7-13 days, 3 = 14-29 days, 4 = 30+ days
 * @param {number} streak - Current streak count
 * @returns {number} - Heat level 0-4
 */
export function getStreakHeatLevel(streak) {
    if (streak < 3) return 0;
    if (streak < 7) return 1;
    if (streak < 14) return 2;
    if (streak < 30) return 3;
    return 4;
}

/**
 * Sets a test streak by creating fake mood entries (for testing only)
 * @param {number} days - Number of consecutive days to simulate
 */
export function setTestStreak(days) {
    const moodData = getMoodData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear any existing test data marker
    localStorage.removeItem('testStreakDays');

    // Add mood entries for the specified number of days
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = formatDateKey(date);

        // Only add if not already logged
        if (!moodData[dateString]) {
            moodData[dateString] = {
                color: 'rgba(144, 238, 144, 0.9)',
                timestamp: date.toISOString(),
                isTest: true
            };
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(moodData));
    localStorage.setItem('testStreakDays', days.toString());
}

/**
 * Clears test streak data
 */
export function clearTestStreak() {
    const moodData = getMoodData();
    const testDays = localStorage.getItem('testStreakDays');

    if (testDays) {
        // Remove entries marked as test
        const cleaned = {};
        for (const [key, value] of Object.entries(moodData)) {
            if (!value.isTest) {
                cleaned[key] = value;
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        localStorage.removeItem('testStreakDays');
    }
}
