/**
 * Date utilities module - helper functions for date operations
 */

/**
 * Gets today's date as a YYYY-MM-DD string
 * @returns {string} - Today's date string
 */
export function getTodayDateString() {
    const today = new Date();
    return formatDateString(today);
}

/**
 * Formats a Date object to YYYY-MM-DD string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Gets the current year
 * @returns {number} - Current year
 */
export function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Generates all dates for a given year
 * @param {number} year - The year to generate dates for
 * @returns {Array<{date: Date, dateString: string}>} - Array of date objects
 */
export function generateYearDates(year) {
    const dates = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push({
            date: new Date(d),
            dateString: formatDateString(d)
        });
    }

    return dates;
}

/**
 * Formats a date for display based on locale
 * @param {Date} date - The date to format
 * @param {string} language - Language code (en, fr, pt)
 * @returns {string} - Formatted date for display
 */
export function formatDateForDisplay(date, language) {
    const localeMap = {
        en: 'en-US',
        fr: 'fr-FR',
        pt: 'pt-BR'
    };
    return date.toLocaleDateString(localeMap[language], {
        month: 'short',
        day: 'numeric'
    });
}
