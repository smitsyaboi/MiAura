/**
 * MiAura - Main Entry Point
 * A daily mood tracking Chrome extension with Frutiger Aero aesthetic
 */

import { getMoodForDate, migrateColor } from './js/storage.js';
import { getTodayDateString } from './js/dateUtils.js';
import {
    getCurrentLanguage,
    t,
    getToggleLabel,
    getLabelKey,
    defaultMoodLabels
} from './js/localization.js';
import { getSelectedColor, setSelectedColor, resetViewYear } from './js/state.js';
import { loadYearGrid } from './js/gridRenderer.js';
import { setupAllEventListeners } from './js/eventHandlers.js';

/**
 * Updates all UI text to the current language
 */
function updateLanguage() {
    const lang = getCurrentLanguage();
    const navBtn = document.getElementById('navBtn');
    const page1 = document.getElementById('page1');

    // Update main UI text
    document.getElementById('mainTitle').textContent = t('title', lang);
    document.getElementById('yearTitle').textContent = t('yearTitle', lang);
    document.getElementById('langToggle').textContent = getToggleLabel(lang);

    // Update nav button icon based on which page is active
    if (page1.classList.contains('active')) {
        navBtn.textContent = String.fromCodePoint(0x1F4C5); // calendar emoji
    } else {
        navBtn.textContent = '\u2190'; // left arrow
    }

    // Update mood label if there's a selected mood
    const selectedColor = getSelectedColor();
    if (selectedColor) {
        const selectedOption = document.querySelector(`[data-color="${selectedColor}"]`);
        if (selectedOption) {
            const labelKey = getLabelKey(lang);
            const label = selectedOption.dataset[labelKey];
            document.getElementById('colorLabel').textContent = label;
        }
    }

    // Update logged days text
    const loggedDaysEl = document.getElementById('loggedDays');
    if (loggedDaysEl.textContent) {
        const count = loggedDaysEl.textContent.match(/\d+/);
        if (count) {
            loggedDaysEl.innerHTML = `${count[0]}<br>${t('daysLogged', lang)}`; // Changed to innerHTML with <br>
        }
    }

    // Reload year grid to update tooltips if on calendar page
    if (!page1.classList.contains('active')) {
        loadYearGrid();
    }
}

/**
 * Checks if today has a mood logged and updates UI accordingly
 */
function checkTodayLogged() {
    const today = getTodayDateString();
    const todayMood = getMoodForDate(today);
    const colorLabel = document.getElementById('colorLabel');
    const signalBars = document.getElementById('signalBars');
    const lang = getCurrentLanguage();

    if (todayMood) {
        // Today is logged - show that mood
        const color = migrateColor(todayMood.color);
        setSelectedColor(color);

        document.querySelectorAll('.color-option').forEach((option) => {
            const optionColor = option.dataset.color;
            if (optionColor === color) {
                const level = option.dataset.level;
                const labelKey = getLabelKey(lang);
                const label = option.dataset[labelKey];
                signalBars.className = 'signal-bars level-' + level;
                colorLabel.textContent = label;
                colorLabel.classList.add('visible');
            }
        });
    } else {
        // Not logged yet - default to "Okay" (level 3)
        signalBars.className = 'signal-bars level-3';
        setSelectedColor('rgba(100, 200, 210, 0.6)');
        colorLabel.textContent = defaultMoodLabels[lang];
        colorLabel.classList.add('visible');
    }
}

/**
 * Initializes the application
 */
function init() {
    resetViewYear();
    checkTodayLogged();
    updateLanguage();
    setupAllEventListeners(updateLanguage);
    loadYearGrid();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
