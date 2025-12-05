/**
 * MiAura - Main Entry Point
 * A daily mood tracking Chrome extension with Frutiger Aero aesthetic
 */

import { getMoodForDate, migrateColor, getCounterMode, setCounterMode, getCalendarView, setCalendarView, setTestStreak, clearTestStreak } from './js/storage.js';
import { getTodayDateString } from './js/dateUtils.js';
import {
    getCurrentLanguage,
    setCurrentLanguage,
    t,
    getToggleLabel,
    getLabelKey,
    defaultMoodLabels
} from './js/localization.js';
import { getSelectedColor, setSelectedColor, resetViewYear } from './js/state.js';
import { loadYearGrid } from './js/gridRenderer.js';
import { setupAllEventListeners } from './js/eventHandlers.js';
import { initNavigation } from './js/navigation.js';
import { getCurrentTemplate, applyTemplate } from './js/colorTemplates.js';

/**
 * Updates all UI text to the current language
 */
function updateLanguage() {
    const lang = getCurrentLanguage();
    const navBtn = document.getElementById('navBtn');
    const page1 = document.getElementById('page1');

    // Update main UI text
    document.getElementById('mainTitle').textContent = t('title', lang);
    document.getElementById('langToggle').textContent = getToggleLabel(lang);

    // Update settings page text
    document.getElementById('settingsTitle').textContent = t('settings', lang);
    document.getElementById('languageLabel').textContent = t('language', lang);
    document.getElementById('counterModeLabel').textContent = t('counter', lang);
    document.getElementById('calendarViewLabel').textContent = t('view', lang);
    document.getElementById('streakTitle').textContent = t('streak', lang);
    document.getElementById('totalTitle').textContent = t('total', lang);
    document.getElementById('testModeLabel').textContent = t('testMode', lang);
    document.getElementById('exportLabel').textContent = t('dataExport', lang);
    document.getElementById('exportComingSoon').textContent = t('comingSoon', lang);

    // Update language select value
    document.getElementById('languageSelect').value = lang;

    // Update counter mode button active states
    const counterMode = getCounterMode();
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === counterMode);
    });

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
 * Sets up language selection dropdown on settings page
 */
function setupLanguageSelect() {
    const select = document.getElementById('languageSelect');
    select.value = getCurrentLanguage();
    select.addEventListener('change', () => {
        setCurrentLanguage(select.value);
        updateLanguage();
    });
}

/**
 * Sets up counter mode selection buttons on settings page
 */
function setupCounterModeButtons() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            setCounterMode(mode);
            // Update active states
            document.querySelectorAll('[data-mode]').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === mode);
            });
            loadYearGrid();
        });
    });
}

/**
 * Sets up calendar view toggle buttons on settings page
 */
function setupViewToggle() {
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            setCalendarView(view);
            // Update active states
            document.querySelectorAll('[data-view]').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });
            loadYearGrid();
        });
    });

    // Set initial active state
    const currentView = getCalendarView();
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentView);
    });
}

/**
 * Sets up test mode controls on settings page
 * Test mode is hidden by default - tap settings title 5 times to reveal
 */
function setupTestControls() {
    const setBtn = document.getElementById('setTestStreak');
    const clearBtn = document.getElementById('clearTestStreak');
    const input = document.getElementById('testStreakInput');
    const settingsTitle = document.getElementById('settingsTitle');
    const testSection = document.querySelector('.test-section');
    const templateSelect = document.getElementById('colorTemplateSelect');

    // Secret activation: tap settings title 5 times
    let tapCount = 0;
    let tapTimer = null;
    const page3 = document.getElementById('page3');

    if (settingsTitle && testSection) {
        settingsTitle.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimer);

            if (tapCount >= 5) {
                testSection.classList.toggle('visible');
                // Enable scrolling when test mode is visible
                if (page3) {
                    page3.classList.toggle('scrollable', testSection.classList.contains('visible'));
                }
                tapCount = 0;
            } else {
                tapTimer = setTimeout(() => {
                    tapCount = 0;
                }, 1000);
            }
        });
    }

    if (setBtn) {
        setBtn.addEventListener('click', () => {
            const days = parseInt(input.value, 10);
            if (days > 0 && days <= 365) {
                setTestStreak(days);
                loadYearGrid();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearTestStreak();
            loadYearGrid();
        });
    }

    // Color template selector
    if (templateSelect) {
        // Set current template
        const currentTemplate = getCurrentTemplate();
        templateSelect.value = currentTemplate;

        templateSelect.addEventListener('change', (e) => {
            const selectedTemplate = e.target.value;
            applyTemplate(selectedTemplate);
            // Reload the grid to apply new colors to existing moods
            loadYearGrid();
        });
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
    // Apply the saved color template
    const currentTemplate = getCurrentTemplate();
    applyTemplate(currentTemplate);

    resetViewYear();
    checkTodayLogged();
    updateLanguage();
    setupAllEventListeners(updateLanguage);
    setupLanguageSelect();
    setupCounterModeButtons();
    setupViewToggle();
    setupTestControls();
    loadYearGrid();
    initNavigation();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

