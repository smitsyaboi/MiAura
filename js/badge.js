/**
 * Badge module - computes and applies the "haven't logged today" toolbar badge
 */

import { loadData } from './storage.js';
import { getTodayDateString, formatDateString } from './dateUtils.js';

const ACTIVE_WINDOW_DAYS = 7;
const BADGE_TEXT = '•';
const BADGE_COLOR = '#5fc9c9'; // soft aqua, matches the mood-okay theme tone (not red — this app doesn't nag)

/**
 * Pure decision function: should the "you haven't logged today" badge be shown?
 * Shows only for users who are actively engaged (logged a real mood within the
 * last 7 days) but haven't logged today yet. Dormant users are never nagged.
 * @param {Object} moods - moods map keyed by YYYY-MM-DD ({ level, timestamp, isTest? })
 * @param {string} todayString - today's date as YYYY-MM-DD
 * @returns {boolean}
 */
export function shouldShowBadge(moods, todayString) {
    if (moods[todayString]) return false;

    const today = new Date(`${todayString}T00:00:00`);
    for (let i = 0; i < ACTIVE_WINDOW_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const entry = moods[formatDateString(d)];
        if (entry && !entry.isTest) return true;
    }
    return false;
}

/**
 * Recomputes badge state from storage and applies it via chrome.action.
 * Reads data with loadData() only - never migrateIfNeeded(), which touches
 * localStorage and is unavailable in the service worker.
 */
export async function updateBadge() {
    const data = await loadData();
    const todayString = getTodayDateString();

    if (shouldShowBadge(data.moods, todayString)) {
        await chrome.action.setBadgeText({ text: BADGE_TEXT });
        await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    } else {
        await chrome.action.setBadgeText({ text: '' });
    }
}

/**
 * Clears the badge immediately (e.g. right after today's mood is saved)
 */
export async function clearBadge() {
    await chrome.action.setBadgeText({ text: '' });
}
