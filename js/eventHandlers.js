/**
 * Event handlers module - organized event listener setup
 */

import { getSetting } from './storage.js';
import { incrementViewYear, decrementViewYear, incrementViewMonth, decrementViewMonth, incrementViewWeek, decrementViewWeek } from './state.js';
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

    // Sync nav active state
    const pageNavMap = {
        'page1': 'navToday',
        'page2': 'navCalendar',
        'page3': 'navSettings'
    };
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navId = pageNavMap[pageId];
    if (navId) {
        const navItem = document.getElementById(navId);
        if (navItem) navItem.classList.add('active');
    }

    if (pageId !== 'page1') {
        loadYearGrid();
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
                decrementViewMonth();
            } else if (view === 'week') {
                decrementViewWeek();
            } else {
                decrementViewYear();
            }
            await loadYearGrid();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            const view = await getSetting('calendarView');
            if (view === 'month') {
                incrementViewMonth();
            } else if (view === 'week') {
                incrementViewWeek();
            } else {
                incrementViewYear();
            }
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
