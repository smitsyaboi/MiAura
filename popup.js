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
    defaultMoodLabels,
    getMoodLevel
} from './js/localization.js';
import { getSelectedColor, setSelectedColor, resetViewYear } from './js/state.js';
import { loadYearGrid } from './js/gridRenderer.js';
import { setupAllEventListeners } from './js/eventHandlers.js';
import { initNavigation } from './js/navigation.js';
import { getCurrentTemplate, applyTemplate, getActiveColors, colorTemplates } from './js/colorTemplates.js';
import { isTemplateUnlocked, grantPremiumAccess, revokePremiumAccess } from './js/licensing.js';

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
        // Populate dropdown with templates (dynamic to show lock status)
        templateSelect.innerHTML = '';
        Object.entries(colorTemplates).forEach(([key, template]) => {
            const option = document.createElement('option');
            option.value = key;

            const isLocked = template.premium && !isTemplateUnlocked(key);
            const lockIcon = isLocked ? '🔒 ' : '';
            option.textContent = `${lockIcon}${template.name}`;

            if (isLocked) {
                option.setAttribute('data-locked', 'true');
            }

            templateSelect.appendChild(option);
        });

        // Set current template
        const currentTemplate = getCurrentTemplate();
        templateSelect.value = currentTemplate;

        templateSelect.addEventListener('change', (e) => {
            const selectedTemplate = e.target.value;
            const template = colorTemplates[selectedTemplate];

            // Check if template is locked
            if (template.premium && !isTemplateUnlocked(selectedTemplate)) {
                // Show upgrade message
                alert('🔒 Premium Template\n\nThis template requires premium access.\n\nFor testing: Use the "Unlock Premium" button below.');
                // Revert to current template
                templateSelect.value = getCurrentTemplate();
                return;
            }

            applyTemplate(selectedTemplate);
            // Reload the grid to apply new colors to existing moods
            loadYearGrid();
        });
    }

    // Add premium unlock controls (for testing/demo)
    const unlockBtn = document.createElement('button');
    unlockBtn.textContent = 'Unlock Premium (Test)';
    unlockBtn.className = 'test-btn';
    unlockBtn.style.marginTop = '8px';
    unlockBtn.addEventListener('click', () => {
        grantPremiumAccess();
        // Refresh the dropdown
        setupTestControls();
        alert('✨ Premium unlocked! All templates are now available.');
    });

    const lockBtn = document.createElement('button');
    lockBtn.textContent = 'Lock Premium (Test)';
    lockBtn.className = 'test-btn test-btn-clear';
    lockBtn.style.marginTop = '8px';
    lockBtn.addEventListener('click', () => {
        revokePremiumAccess();
        // Refresh the dropdown
        setupTestControls();
        // Reset to default template if current is locked
        const current = getCurrentTemplate();
        if (colorTemplates[current]?.premium) {
            applyTemplate('default');
        }
        alert('🔒 Premium locked. Only free templates available.');
    });

    if (testSection && templateSelect) {
        const templateSelector = templateSelect.closest('.template-selector');
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '8px';
        btnContainer.className = 'premium-test-controls';

        // Remove existing controls if they exist
        const existing = templateSelector.querySelector('.premium-test-controls');
        if (existing) {
            existing.remove();
        }

        btnContainer.appendChild(unlockBtn);
        btnContainer.appendChild(lockBtn);
        templateSelector.appendChild(btnContainer);
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
    const activeColors = getActiveColors();

    if (todayMood) {
        // Today is logged - show that mood using current template colors
        const storedColor = migrateColor(todayMood.color);
        const level = getMoodLevel(storedColor);

        // Get the current template's color for this level
        const colorMap = {
            1: activeColors.fantastic,
            2: activeColors.fine,
            3: activeColors.okay,
            4: activeColors.low,
            5: activeColors.down
        };
        const currentColor = colorMap[level]?.rgba || activeColors.okay.rgba;
        setSelectedColor(currentColor);

        document.querySelectorAll('.color-option').forEach((option) => {
            const optionColor = option.dataset.color;
            if (optionColor === currentColor) {
                const labelKey = getLabelKey(lang);
                const label = option.dataset[labelKey];
                signalBars.className = 'signal-bars level-' + level;
                colorLabel.textContent = label;
                colorLabel.classList.add('visible');
            }
        });
    } else {
        // Not logged yet - default to "Okay" (level 3) using current template
        signalBars.className = 'signal-bars level-3';
        setSelectedColor(activeColors.okay.rgba);
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

