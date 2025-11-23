/**
 * Event handlers module - organized event listener setup
 */

import { saveMoodForDate, getCalendarView } from './storage.js';
import { getTodayDateString } from './dateUtils.js';
import { cycleLanguage, getLabelKey } from './localization.js';
import { getSelectedColor, setSelectedColor, incrementViewYear, decrementViewYear, incrementViewMonth, decrementViewMonth, incrementViewWeek, decrementViewWeek } from './state.js';
import { loadYearGrid } from './gridRenderer.js';

/**
 * Shows a page and updates navigation button
 * @param {string} pageId - ID of page to show
 */
export function showPage(pageId) {
    const navBtn = document.getElementById('navBtn');

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'page1') {
        navBtn.textContent = String.fromCodePoint(0x1F4C5); // calendar emoji
    } else {
        navBtn.textContent = '\u2190'; // left arrow
        loadYearGrid();
    }
}

/**
 * Sets up language toggle button handler
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function setupLanguageToggle(onLanguageChange) {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            cycleLanguage();
            onLanguageChange();
        });
    }
}

/**
 * Sets up calendar navigation buttons (handles year/month/week based on view)
 */
export function setupYearNavigation() {
    const prevBtn = document.getElementById('prevYear');
    const nextBtn = document.getElementById('nextYear');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const view = getCalendarView();
            if (view === 'month') {
                decrementViewMonth();
            } else if (view === 'week') {
                decrementViewWeek();
            } else {
                decrementViewYear();
            }
            loadYearGrid();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const view = getCalendarView();
            if (view === 'month') {
                incrementViewMonth();
            } else if (view === 'week') {
                incrementViewWeek();
            } else {
                incrementViewYear();
            }
            loadYearGrid();
        });
    }
}

/**
 * Sets up main navigation button (calendar/back)
 */
export function setupMainNavigation() {
    const navBtn = document.getElementById('navBtn');
    if (navBtn) {
        navBtn.addEventListener('click', () => {
            const page1 = document.getElementById('page1');
            if (page1.classList.contains('active')) {
                showPage('page2');
            } else {
                showPage('page1');
            }
        });
    }

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showPage('page1');
        });
    }
}

/**
 * Sets up mood color option handlers
 */
export function setupMoodSelection() {
    const signalBars = document.getElementById('signalBars');
    const colorLabel = document.getElementById('colorLabel');
    let hoveredLabel = null;

    document.querySelectorAll('.color-option').forEach((option) => {
        // Hover enter - show mood preview
        option.addEventListener('mouseenter', () => {
            const level = option.dataset.level;
            const labelKey = getLabelKey();
            const label = option.dataset[labelKey];
            hoveredLabel = label;

            signalBars.className = 'signal-bars level-' + level;
            colorLabel.textContent = label;
            colorLabel.classList.add('visible');
        });

        // Hover leave - restore selected or hide
        option.addEventListener('mouseleave', () => {
            hoveredLabel = null;
            const selectedColor = getSelectedColor();

            if (!selectedColor) {
                colorLabel.classList.remove('visible');
            } else {
                // Restore selected mood's display
                const selectedOption = document.querySelector(`[data-color="${selectedColor}"]`);
                if (selectedOption) {
                    const level = selectedOption.dataset.level;
                    const labelKey = getLabelKey();
                    const label = selectedOption.dataset[labelKey];
                    signalBars.className = 'signal-bars level-' + level;
                    colorLabel.textContent = label;
                }
            }
        });

        // Click - select mood and save
        option.addEventListener('click', () => {
            const color = option.dataset.color;
            setSelectedColor(color);

            const labelKey = getLabelKey();
            const label = option.dataset[labelKey];
            colorLabel.textContent = label;
            colorLabel.classList.add('visible');

            // Save mood
            const today = getTodayDateString();
            saveMoodForDate(today, color);

            // Navigate to calendar after short delay
            setTimeout(() => {
                showPage('page2');
            }, 300);
        });
    });
}

/**
 * Sets up all event listeners
 * @param {Function} onLanguageChange - Callback when language changes
 */
export function setupAllEventListeners(onLanguageChange) {
    setupLanguageToggle(onLanguageChange);
    setupYearNavigation();
    setupMainNavigation();
    setupMoodSelection();
}
