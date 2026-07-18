/**
 * Storage module - handles all chrome.storage.local operations for mood data
 *
 * Schema (miAura_v2):
 *   { version: 2, settings: { language, counterMode, calendarView }, moods: { "YYYY-MM-DD": { level, timestamp, isTest? } } }
 *
 * Data safety: saveData() validates the object and refuses writes that would
 * drop real logged days; the first save of each day snapshots the previous
 * state to miAura_v2_backup, which loadData()/migrateIfNeeded() restore from
 * if the primary key is ever missing or corrupt.
 */

import { formatDateString } from './dateUtils.js';

const STORAGE_KEY = 'miAura_v2';
export const BACKUP_KEY = 'miAura_v2_backup';
const QUARANTINE_KEY = 'miAura_v2_corrupt';

/** Review prompt schedule: first ask after this many logged days */
export const REVIEW_FIRST_ASK_AT = 5;
/** After a dismissal, re-arm the prompt this many logged days later */
export const REVIEW_REARM_DAYS = 10;
/** Lifetime cap on review asks */
export const REVIEW_MAX_ASKS = 3;

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
 * Structural validity check for a miAura_v2 data object.
 * @param {*} data - Candidate data object
 * @returns {boolean}
 */
function isValidData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (data.version !== 2) return false;
    if (!data.settings || typeof data.settings !== 'object') return false;
    if (!data.moods || typeof data.moods !== 'object' || Array.isArray(data.moods)) return false;
    return Object.values(data.moods).every(entry =>
        entry && typeof entry === 'object' &&
        Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 5
    );
}

/**
 * Migrates old localStorage data to chrome.storage.local if needed.
 * Non-destructive: old data is only removed after verification.
 */
export async function migrateIfNeeded() {
    // Step 1 — already migrated?
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) return;

    // Step 2 — primary key gone but a backup snapshot exists: restore it
    // instead of minting a fresh (empty) store from localStorage
    const backupResult = await chrome.storage.local.get(BACKUP_KEY);
    const backup = backupResult[BACKUP_KEY];
    if (backup && isValidData(backup.data)) {
        await chrome.storage.local.set({ [STORAGE_KEY]: backup.data });
        return;
    }

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
    const newData = {
        version: 2,
        settings,
        moods,
        meta: {
            installDate: new Date().toISOString(),
            totalOpens: 0,
            hasReviewed: false,
            reviewAskCount: 0,
            reviewNextAskAt: REVIEW_FIRST_ASK_AT,
            seenV11Banner: true,
            isFoundingMember: false
        }
    };
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
 * Loads the full data object from chrome.storage.local.
 * If the primary key is missing or corrupt, restores the daily backup
 * (quarantining the corrupt object rather than discarding it).
 * @returns {Promise<Object>} - The miAura_v2 data object
 */
export async function loadData() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY];
    if (stored && isValidData(stored)) return stored;

    const backupResult = await chrome.storage.local.get(BACKUP_KEY);
    const backup = backupResult[BACKUP_KEY];
    if (backup && isValidData(backup.data)) {
        if (stored) {
            await chrome.storage.local.set({ [QUARANTINE_KEY]: stored });
        }
        await chrome.storage.local.set({ [STORAGE_KEY]: backup.data });
        return backup.data;
    }

    return stored || {
        version: 2,
        settings: { language: 'en', counterMode: 'streak', calendarView: 'year' },
        moods: {},
        meta: {
            installDate: new Date().toISOString(),
            totalOpens: 0,
            hasReviewed: false,
            reviewAskCount: 0,
            reviewNextAskAt: REVIEW_FIRST_ASK_AT,
            seenV11Banner: true,
            isFoundingMember: false
        }
    };
}

/**
 * Saves the full data object to chrome.storage.local.
 * Guarded: throws (leaving stored data untouched) if the object is
 * structurally invalid or would drop more than one real logged day.
 * The first save of each calendar day snapshots the previous state to
 * BACKUP_KEY before writing.
 * @param {Object} data - The miAura_v2 data object
 */
export async function saveData(data) {
    if (!isValidData(data)) {
        throw new Error('saveData refused: data failed validation, stored data untouched');
    }

    const result = await chrome.storage.local.get(STORAGE_KEY);
    const current = result[STORAGE_KEY];

    if (current && isValidData(current)) {
        // No operation legitimately removes more than one real (non-test)
        // logged day in a single save
        const currentReal = countLoggedDaysFromMoods(current.moods);
        const nextReal = countLoggedDaysFromMoods(data.moods);
        if (nextReal < currentReal - 1) {
            throw new Error(
                `saveData refused: write would drop ${currentReal - nextReal} logged days (${currentReal} -> ${nextReal}), stored data untouched`
            );
        }

        const today = formatDateString(new Date());
        const backupResult = await chrome.storage.local.get(BACKUP_KEY);
        const backup = backupResult[BACKUP_KEY];
        if (!backup || backup.savedAt !== today) {
            await chrome.storage.local.set({ [BACKUP_KEY]: { savedAt: today, data: current } });
        }
    }

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
    const checkDate = new Date(today);

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
                level: Math.ceil(Math.random() * 5),
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

/**
 * Gets the review/meta metadata object
 * @returns {Promise<Object>}
 */
export async function getReviewMeta() {
    const data = await loadData();
    return data.meta || {};
}

/**
 * Marks that the user has reviewed (clicked the review link)
 */
export async function markReviewed() {
    const data = await loadData();
    if (!data.meta) data.meta = {};
    data.meta.hasReviewed = true;
    await saveData(data);
}

/**
 * Counts genuinely logged days (excludes test-mode entries)
 * @param {Object} moods - The moods map
 * @returns {number}
 */
export function countLoggedDaysFromMoods(moods) {
    return Object.values(moods).filter(m => !m.isTest).length;
}

/**
 * Returns the review prompt schedule, lazily upgrading users from the old
 * streak-based system. Users whose prompts were burned under the old rules
 * (reviewPromptShown / reviewPrompt2Shown) are re-armed for one more ask,
 * 10 logged days from now.
 * @returns {Promise<{loggedDays: number, askCount: number, nextAskAt: number, hasReviewed: boolean}>}
 */
export async function getReviewSchedule() {
    const data = await loadData();
    if (!data.meta) data.meta = {};
    const meta = data.meta;
    const loggedDays = countLoggedDaysFromMoods(data.moods);

    if (meta.reviewNextAskAt === undefined) {
        const burnedUnderOldRules = meta.reviewPromptShown || meta.reviewPrompt2Shown;
        if (burnedUnderOldRules) {
            meta.reviewAskCount = REVIEW_MAX_ASKS - 1;
            meta.reviewNextAskAt = loggedDays + REVIEW_REARM_DAYS;
        } else {
            meta.reviewAskCount = 0;
            meta.reviewNextAskAt = REVIEW_FIRST_ASK_AT;
        }
        await saveData(data);
    }

    return {
        loggedDays,
        askCount: meta.reviewAskCount || 0,
        nextAskAt: meta.reviewNextAskAt,
        hasReviewed: !!meta.hasReviewed
    };
}

/**
 * Records a review prompt dismissal: counts the ask and re-arms the
 * next one for 10 logged days later
 */
export async function recordReviewDismissal() {
    const data = await loadData();
    if (!data.meta) data.meta = {};
    data.meta.reviewAskCount = (data.meta.reviewAskCount || 0) + 1;
    data.meta.reviewNextAskAt = countLoggedDaysFromMoods(data.moods) + REVIEW_REARM_DAYS;
    await saveData(data);
}

/**
 * Marks the v1.1 welcome banner as seen
 */
export async function markV11BannerSeen() {
    const data = await loadData();
    if (!data.meta) data.meta = {};
    data.meta.seenV11Banner = true;
    await saveData(data);
}

/**
 * Marks the user as a founding member
 */
export async function markFoundingMember() {
    const data = await loadData();
    if (!data.meta) data.meta = {};
    data.meta.isFoundingMember = true;
    await saveData(data);
}
