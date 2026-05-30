/**
 * Event handlers module - organized event listener setup
 */

import { getSetting } from './storage.js';
import {
    incrementViewYear, decrementViewYear,
    incrementViewMonth, decrementViewMonth,
    incrementViewWeek, decrementViewWeek,
    getViewYear, getActualYear, getMinViewYear,
    getViewMonth, getViewWeekStart, getWeekStart
} from './state.js';
import { loadYearGrid } from './gridRenderer.js';

/**
 * Shows a page and updates navigation button
 * @param {string} pageId - ID of page to show
 */
export function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Fade out mood tint when leaving page 1
    if (pageId !== 'page1') {
        const tint = document.getElementById('moodTint');
        if (tint) tint.style.opacity = '0';
    }

    // Sync nav active state
    const pageNavMap = { 'page1': 'navToday', 'page2': 'navCalendar', 'page3': 'navSettings' };
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navId = pageNavMap[pageId];
    if (navId) document.getElementById(navId)?.classList.add('active');

    if (pageId !== 'page1') loadYearGrid();
}

/**
 * Updates the disabled state of the prev/next navigation buttons based on current view and bounds
 * @param {string} calendarView - 'year' | 'month' | 'week'
 */
export function syncNavButtonStates(calendarView) {
    const prevBtn = document.getElementById('prevYear');
    const nextBtn = document.getElementById('nextYear');
    if (!prevBtn || !nextBtn) return;

    const currentYear = getActualYear();
    const now = new Date();

    if (calendarView === 'month') {
        prevBtn.disabled = getViewYear() <= getMinViewYear() && getViewMonth() === 0;
        nextBtn.disabled = getViewYear() > currentYear ||
            (getViewYear() === currentYear && getViewMonth() >= now.getMonth());
    } else if (calendarView === 'week') {
        const weekStart = getViewWeekStart();
        const currentWeek = getWeekStart(now);
        prevBtn.disabled = weekStart < new Date(getMinViewYear(), 0, 1);
        nextBtn.disabled = weekStart >= currentWeek;
    } else {
        prevBtn.disabled = getViewYear() <= getMinViewYear();
        nextBtn.disabled = getViewYear() >= currentYear;
    }
}

/**
 * Sets up calendar navigation buttons (handles year/month/week based on view)
 */
export function setupYearNavigation() {
    const prevBtn = document.getElementById('prevYear');
    const nextBtn = document.getElementById('nextYear');

    if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            const view = await getSetting('calendarView');
            if (view === 'month') {
                if (getViewYear() <= getMinViewYear() && getViewMonth() === 0) return;
                decrementViewMonth();
            } else if (view === 'week') {
                const weekStart = getViewWeekStart();
                if (weekStart < new Date(getMinViewYear(), 0, 1)) return;
                decrementViewWeek();
            } else {
                if (getViewYear() <= getMinViewYear()) return;
                decrementViewYear();
            }
            syncNavButtonStates(view);
            await loadYearGrid();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            const view = await getSetting('calendarView');
            const currentYear = getActualYear();
            const now = new Date();

            if (view === 'month') {
                if (getViewYear() > currentYear ||
                    (getViewYear() === currentYear && getViewMonth() >= now.getMonth())) return;
                incrementViewMonth();
            } else if (view === 'week') {
                const weekStart = getViewWeekStart();
                const currentWeek = getWeekStart(now);
                if (weekStart >= currentWeek) return;
                incrementViewWeek();
            } else {
                if (getViewYear() >= currentYear) return;
                incrementViewYear();
            }
            syncNavButtonStates(view);
            await loadYearGrid();
        });
    }
}

/**
 * Sets up main navigation button (calendar/back)
 */
export function setupMainNavigation() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('page1');
        });
    }
}

/**
 * Sets up mood orb hover and click handlers
 * @param {Function} onMoodHover - Called with level (or null on leave)
 * @param {Function} onMoodSelect - Called with level on click
 */
export function setupMoodSelection(onMoodHover, onMoodSelect) {
    document.querySelectorAll('.mood-orb').forEach(orb => {
        orb.addEventListener('mouseenter', () => {
            const level = parseInt(orb.dataset.level);
            onMoodHover(level);
        });

        orb.addEventListener('mouseleave', () => {
            onMoodHover(null);
        });

        orb.addEventListener('click', () => {
            const level = parseInt(orb.dataset.level);
            onMoodSelect(level);
        });
    });
}

/**
 * Sets up all event listeners
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function setupAllEventListeners(onLanguageChange) {
    setupYearNavigation();
    setupMainNavigation();
}
