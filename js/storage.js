/**
 * Storage module - handles all chrome.storage.local operations for mood data
 *
 * Schema (miAura_v2):
 *   { version: 2, settings: { language, counterMode, calendarView }, moods: { "YYYY-MM-DD": { level, timestamp } } }
 */

import { formatDateString } from './dateUtils.js';

const STORAGE_KEY = 'miAura_v2';

/**
 * Color-to-level map used only during migration from the old localStorage schema
 */
const COLOR_TO_LEVEL = {
    'rgba(144, 238, 144, 0.9)': 1,
    'rgba(120, 220, 180, 0.75)': 2,
    'rgba(100, 200, 210, 0.6)': 3,
    'rgba(140, 180, 220, 0.45)': 4,
    'rgba(160, 180, 200, 0.3)': 5,
    '#90ee90': 1,
    '#6eb86e': 2,
    '#528f62': 3,
    '#3d5d55': 4,
    '#252525': 5
};

/**
 * Migrates old localStorage data to chrome.storage.local if needed.
 * Non-destructive: old data is only removed after verification.
 */
export async function migrateIfNeeded() {
    // Step 1 — already migrated?
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) return;

    // Read old mood data
    const oldRaw = localStorage.getItem('moodTracker');
    const oldMoods = oldRaw ? JSON.parse(oldRaw) : {};
    const originalCount = Object.keys(oldMoods).length;

    // Step 3 — convert colours to levels
    const moods = {};
    for (const [date, entry] of Object.entries(oldMoods)) {
        const level = COLOR_TO_LEVEL[entry.color];
        if (level !== undefined) {
            moods[date] = { level, timestamp: entry.timestamp };
            if (entry.isTest) {
                moods[date].isTest = true;
            }
        }
    }

    // Step 4 — read settings
    const settings = {
        language: localStorage.getItem('language') || 'en',
        counterMode: localStorage.getItem('counterMode') || 'streak',
        calendarView: localStorage.getItem('calendarView') || 'year'
    };

    // Step 5 — write new schema
    const newData = { version: 2, settings, moods };
    await chrome.storage.local.set({ [STORAGE_KEY]: newData });

    // Step 6 — verify
    const verification = await chrome.storage.local.get(STORAGE_KEY);
    const verifiedData = verification[STORAGE_KEY];
    const migratedCount = Object.keys(verifiedData.moods).length;

    if (migratedCount !== originalCount) {
        // Step 8 — verification failed, leave old data untouched
        await chrome.storage.local.remove(STORAGE_KEY);
        throw new Error(
            `Migration verification failed: expected ${originalCount} mood entries, got ${migratedCount}. Old data is untouched.`
        );
    }

    // Step 7 — safe to remove old keys
    localStorage.removeItem('moodTracker');
    localStorage.removeItem('language');
    localStorage.removeItem('counterMode');
    localStorage.removeItem('calendarView');
    localStorage.removeItem('testStreakDays');
}

/**
 * Loads the full data object from chrome.storage.local
 * @returns {Promise<Object>} - The miAura_v2 data object
 */
export async function loadData() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {
        version: 2,
        settings: { language: 'en', counterMode: 'streak', calendarView: 'year' },
        moods: {}
    };
}

/**
 * Saves the full data object to chrome.storage.local
 * @param {Object} data - The miAura_v2 data object
 */
export async function saveData(data) {
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

/**
 * Gets mood data for a specific date
 * @param {string} dateString - YYYY-MM-DD
 * @returns {Promise<Object|null>} - { level, timestamp } or null
 */
export async function getMoodForDate(dateString) {
    const data = await loadData();
    return data.moods[dateString] || null;
}

/**
 * Saves mood for a specific date
 * @param {string} dateString - YYYY-MM-DD
 * @param {number} level - Integer 1–5
 */
export async function saveMoodForDate(dateString, level) {
    if (!level) return;
    const data = await loadData();
    data.moods[dateString] = {
        level,
        timestamp: new Date().toISOString()
    };
    await saveData(data);
}

/**
 * Gets a single setting value
 * @param {string} key - Setting key (language, counterMode, calendarView)
 * @returns {Promise<string>}
 */
export async function getSetting(key) {
    const data = await loadData();
    return data.settings[key];
}

/**
 * Sets a single setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export async function setSetting(key, value) {
    const data = await loadData();
    data.settings[key] = value;
    await saveData(data);
}

/**
 * Calculates the current streak (consecutive days logged ending today or yesterday)
 * @returns {Promise<number>}
 */
export async function calculateStreak() {
    const data = await loadData();
    return calculateStreakFromMoods(data.moods);
}

/**
 * Calculates streak from a moods object (sync helper)
 * @param {Object} moods - The moods map
 * @returns {number}
 */
export function calculateStreakFromMoods(moods) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    const todayString = formatDateString(checkDate);
    if (!moods[todayString]) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateString = formatDateString(checkDate);
        if (moods[dateString]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Gets streak heat level (0-4) based on streak length
 * @param {number} streak
 * @returns {number}
 */
export function getStreakHeatLevel(streak) {
    if (streak < 3) return 0;
    if (streak < 7) return 1;
    if (streak < 14) return 2;
    if (streak < 30) return 3;
    return 4;
}

/**
 * Sets a test streak by creating fake mood entries
 * @param {number} days - Number of consecutive days to simulate
 */
export async function setTestStreak(days) {
    const data = await loadData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = formatDateString(date);

        if (!data.moods[dateString]) {
            data.moods[dateString] = {
                level: 1,
                timestamp: date.toISOString(),
                isTest: true
            };
        }
    }

    await saveData(data);
}

/**
 * Clears test streak data
 */
export async function clearTestStreak() {
    const data = await loadData();
    const cleaned = {};
    for (const [key, value] of Object.entries(data.moods)) {
        if (!value.isTest) {
            cleaned[key] = value;
        }
    }
    data.moods = cleaned;
    await saveData(data);
}
