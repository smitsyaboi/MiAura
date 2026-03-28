/**
 * MiAura - Main Entry Point
 * A daily mood tracking Chrome extension with Frutiger Aero aesthetic
 */

import { migrateIfNeeded, loadData, setSetting, setTestStreak, clearTestStreak } from './js/storage.js';
import { LEVEL_TO_COLOR } from './js/themes.js';
import { getTodayDateString } from './js/dateUtils.js';
import {
    initLanguageCache,
    setCurrentLanguage,
    t,
    getLabelKey,
    defaultMoodLabels
} from './js/localization.js';
import { getSelectedColor, setSelectedColor, resetViewYear } from './js/state.js';
import { loadYearGrid } from './js/gridRenderer.js';
import { setupAllEventListeners } from './js/eventHandlers.js';
import { initNavigation } from './js/navigation.js';

/**
 * Updates all UI text to the current language
 * @param {Object} [data] - Optional preloaded data; if omitted grid reload will fetch fresh data
 */
async function updateLanguage(data) {
    const lang = data ? data.settings.language : (await loadData()).settings.language;

    // Update main UI text
    document.getElementById('mainTitle').textContent = t('title', lang);

    // Update settings page text
    document.getElementById('settingsTitle').textContent = t('settings', lang);
    document.getElementById('languageLabel').textContent = t('language', lang);
    document.getElementById('counterModeLabel').textContent = t('counter', lang);
    document.getElementById('streakTitle').textContent = t('streak', lang);
    document.getElementById('totalTitle').textContent = t('total', lang);
    document.getElementById('testModeLabel').textContent = t('testMode', lang);
    document.getElementById('exportLabel').textContent = t('dataExport', lang);
    document.getElementById('exportComingSoon').textContent = t('comingSoon', lang);

    // Update language select value
    document.getElementById('languageSelect').value = lang;

    // Update counter mode button active states
    const counterMode = data ? data.settings.counterMode : (await loadData()).settings.counterMode;
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === counterMode);
    });

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
            loggedDaysEl.innerHTML = `${count[0]}<br>${t('daysLogged', lang)}`;
        }
    }

    // Reload year grid to update tooltips if on calendar page
    if (!page1.classList.contains('active')) {
        await loadYearGrid(data);
    }
}

/**
 * Sets up language selection dropdown on settings page
 */
function setupLanguageSelect() {
    const select = document.getElementById('languageSelect');
    select.addEventListener('change', async () => {
        await setCurrentLanguage(select.value);
        await updateLanguage();
    });
}

/**
 * Sets up counter mode selection buttons on settings page
 */
function setupCounterModeButtons() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mode = btn.dataset.mode;
            await setSetting('counterMode', mode);
            document.querySelectorAll('[data-mode]').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === mode);
            });
            await loadYearGrid();
        });
    });
}

/**
 * Sets up calendar view toggle buttons on settings page
 */
async function setupViewToggle() {
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const view = btn.dataset.view;
            await setSetting('calendarView', view);
            document.querySelectorAll('[data-view]').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });
            await loadYearGrid();
        });
    });

    const data = await loadData();
    const currentView = data.settings.calendarView;
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentView);
    });
}

/**
 * Sets up test mode controls on settings page
 */
function setupTestControls() {
    const setBtn = document.getElementById('setTestStreak');
    const clearBtn = document.getElementById('clearTestStreak');
    const input = document.getElementById('testStreakInput');
    const settingsTitle = document.getElementById('settingsTitle');
    const testSection = document.querySelector('.test-section');

    let tapCount = 0;
    let tapTimer = null;
    const page3 = document.getElementById('page3');

    if (settingsTitle && testSection) {
        settingsTitle.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimer);

            if (tapCount >= 5) {
                testSection.classList.toggle('visible');
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
        setBtn.addEventListener('click', async () => {
            const days = parseInt(input.value, 10);
            if (days > 0 && days <= 365) {
                await setTestStreak(days);
                await loadYearGrid();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            await clearTestStreak();
            await loadYearGrid();
        });
    }
}

/**
 * Checks if today has a mood logged and updates UI accordingly
 * @param {Object} data - The loaded miAura_v2 data
 */
function checkTodayLogged(data) {
    const today = getTodayDateString();
    const todayMood = data.moods[today];
    const colorLabel = document.getElementById('colorLabel');
    const signalBars = document.getElementById('signalBars');
    const lang = data.settings.language;

    if (todayMood) {
        const color = LEVEL_TO_COLOR[todayMood.level];
        setSelectedColor(color);

        document.querySelectorAll('.color-option').forEach((option) => {
            if (option.dataset.color === color) {
                const level = option.dataset.level;
                const labelKey = getLabelKey(lang);
                const label = option.dataset[labelKey];
                signalBars.className = 'signal-bars level-' + level;
                colorLabel.textContent = label;
                colorLabel.classList.add('visible');
            }
        });
    } else {
        signalBars.className = 'signal-bars level-3';
        setSelectedColor('rgba(100, 200, 210, 0.6)');
        colorLabel.textContent = defaultMoodLabels[lang];
        colorLabel.classList.add('visible');
    }
}

/**
 * Initializes the application (async)
 */
async function init() {
    await migrateIfNeeded();
    const data = await loadData();

    // Seed the language cache so sync helpers (t, getLabelKey, …) work immediately
    initLanguageCache(data.settings.language);

    resetViewYear();
    checkTodayLogged(data);
    await updateLanguage(data);
    setupAllEventListeners(() => updateLanguage());
    setupLanguageSelect();
    setupCounterModeButtons();
    await setupViewToggle();
    setupTestControls();
    await loadYearGrid(data);
    initNavigation();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
