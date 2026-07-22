/**
 * Background service worker - schedules the daily-log badge recompute.
 * Minimal by design: this is the extension's only background component.
 * Does not import migrateIfNeeded() - it touches localStorage, which
 * doesn't exist in service workers. Badge state is read with loadData() only.
 */

import { updateBadge } from './js/badge.js';

const ALARM_NAME = 'miaura-badge-recompute';

function scheduleMidnightAlarm() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    chrome.alarms.create(ALARM_NAME, {
        when: nextMidnight.getTime(),
        periodInMinutes: 24 * 60
    });
}

chrome.runtime.onInstalled.addListener(() => {
    scheduleMidnightAlarm();
    updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
    scheduleMidnightAlarm();
    updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        updateBadge();
    }
});
