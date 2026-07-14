/**
 * MiAura - Main Entry Point
 * A daily mood tracking Chrome extension with Frutiger Aero aesthetic
 */

import { migrateIfNeeded, loadData, saveData, setSetting, saveMoodForDate, setTestStreak, clearTestStreak, markReviewed } from './js/storage.js';
import { clearBadge } from './js/badge.js';
import { MOOD_THEMES } from './js/themes.js';
import { getTodayDateString } from './js/dateUtils.js';
import {
    initLanguageCache,
    setCurrentLanguage,
    getCachedLanguage,
    t
} from './js/localization.js';
import { resetViewYear, setMinViewYear, setViewYear, setViewMonth } from './js/state.js';
import { loadYearGrid } from './js/gridRenderer.js';
import { setupAllEventListeners, setupMoodSelection, showPage, syncNavButtonStates } from './js/eventHandlers.js';
import { initNavigation } from './js/navigation.js';
import { maybeShowReviewPrompt, STORE_URL } from './js/reviewPrompt.js';
import { maybeShowWelcomeBanner } from './js/welcomeBanner.js';

/** Currently selected mood level (null if none) */
let selectedLevel = null;

/**
 * Applies a mood theme to the page, hero orb, glow, and nav bar
 * @param {number} level - Mood level 1-5
 * @param {boolean} isHover - If true, skip particles
 */
function applyMoodTheme(level, isHover = false) {
    const theme = MOOD_THEMES[level] || MOOD_THEMES[3];
    const heroOrb = document.getElementById('heroOrb');
    const heroGlow = document.getElementById('heroGlow');
    const colorLabel = document.getElementById('colorLabel');
    const particles = document.getElementById('particles');
    const tint = document.getElementById('moodTint');

    // Tint overlay
    tint.style.background = `radial-gradient(ellipse at 50% 45%, ${theme.tint} 0%, transparent 70%)`;
    tint.style.opacity = '1';

    // Hero orb
    heroOrb.style.background = theme.orb;
    heroOrb.style.boxShadow = `0 10px 32px ${theme.glow}, 0 0 60px ${theme.glow}`;
    heroOrb.style.animationDuration = theme.floatSpeed;

    // Glow
    heroGlow.style.background = theme.glow;

    // Selector orb active state
    document.querySelectorAll('.mood-orb').forEach(o => {
        o.classList.toggle('active', parseInt(o.dataset.level) === level);
    });

    // Label
    const lang = getCachedLanguage();
    colorLabel.textContent = theme.label[lang] || theme.label.en;
    colorLabel.classList.add('visible');

    // Particles
    particles.innerHTML = '';
    if (theme.particle && !isHover) {
        for (let i = 0; i < 4; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.width = `${Math.random() * 4 + 2}px`;
            p.style.height = p.style.width;
            p.style.left = `${Math.random() * 80 + 10}%`;
            p.style.animationDuration = `${Math.random() * 3 + 3}s`;
            p.style.animationDelay = `${Math.random() * 3}s`;
            particles.appendChild(p);
        }
    }
}

/**
 * Updates all UI text to the current language
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
    document.getElementById('lovingAppLabel').textContent = t('lovingApp', lang);
    document.getElementById('settingsReviewLink').textContent = t('leaveReview', lang);
    const badge = document.getElementById('foundingBadge');
    if (badge && badge.textContent) badge.textContent = t('foundingMember', lang);

    // Update language select value
    document.getElementById('languageSelect').value = lang;

    // Update counter mode button active states
    const counterMode = data ? data.settings.counterMode : (await loadData()).settings.counterMode;
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === counterMode);
    });

    // Update mood label if a level is selected
    if (selectedLevel) {
        const theme = MOOD_THEMES[selectedLevel];
        if (theme) {
            document.getElementById('colorLabel').textContent = theme.label[lang] || theme.label.en;
        }
    }

    // Reload year grid to update tooltips if on calendar page
    const page1 = document.getElementById('page1');
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
 * Sets up calendar view toggle buttons
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
            syncNavButtonStates(view);
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

    const resetBannerBtn = document.getElementById('resetWelcomeBanner');
    if (resetBannerBtn) {
        resetBannerBtn.addEventListener('click', async () => {
            const data = await loadData();
            if (!data.meta) data.meta = {};
            data.meta.seenV11Banner = false;
            data.meta.isFoundingMember = false;
            await saveData(data);
            await maybeShowWelcomeBanner();
        });
    }
}

/**
 * Initializes the application
 */
async function init() {
    await migrateIfNeeded();
    const data = await loadData();

    document.addEventListener('miaura:yearMonthClick', async ({ detail: { year, month } }) => {
        setViewYear(year);
        setViewMonth(month);
        await setSetting('calendarView', 'month');
        document.querySelectorAll('[data-view]').forEach(b => {
            b.classList.toggle('active', b.dataset.view === 'month');
        });
        await loadYearGrid();
        syncNavButtonStates('month');
    });

    // Seed the language cache so sync helpers work immediately
    initLanguageCache(data.settings.language);

    resetViewYear();

    // Compute the earliest year in data to bound the calendar navigator
    const moodDates = Object.keys(data.moods);
    if (moodDates.length > 0) {
        const earliestYear = Math.min(...moodDates.map(d => parseInt(d.slice(0, 4))));
        setMinViewYear(earliestYear);
    }

    // Set mood orb backgrounds from MOOD_THEMES
    document.querySelectorAll('.mood-orb').forEach(orb => {
        const level = parseInt(orb.dataset.level);
        orb.style.background = MOOD_THEMES[level].orb;
    });

    // Check if today is already logged
    const today = getTodayDateString();
    const todayMood = data.moods[today];

    if (todayMood) {
        selectedLevel = todayMood.level;
        applyMoodTheme(todayMood.level);
    } else {
        applyMoodTheme(3);
    }

    await updateLanguage(data);
    setupAllEventListeners(() => updateLanguage());

    // Set up mood selection with hover and select callbacks
    setupMoodSelection(
        // onMoodHover
        (level) => {
            if (level) {
                applyMoodTheme(level, true);
            } else {
                // Restore selected or default
                applyMoodTheme(selectedLevel || 3, !selectedLevel);
            }
        },
        // onMoodSelect
        async (level) => {
            selectedLevel = level;
            applyMoodTheme(level);

            // Save mood
            const today = getTodayDateString();
            await saveMoodForDate(today, level);
            await clearBadge();

            // Navigate to calendar after short delay
            setTimeout(() => {
                showPage('page2');
            }, 400);
        }
    );

    setupLanguageSelect();
    setupCounterModeButtons();
    await setupViewToggle();
    setupTestControls();
    setupSettingsReviewLink();
    await loadYearGrid(data);
    syncNavButtonStates(data.settings.calendarView);
    initNavigation();
    await updateFoundingBadge();
    await maybeShowWelcomeBanner();
    await maybeShowReviewPrompt();
}

/**
 * Sets up the "Leave a review" link in the Settings page
 */
function setupSettingsReviewLink() {
    const link = document.getElementById('settingsReviewLink');
    if (link) {
        link.href = STORE_URL;
        link.addEventListener('click', async () => {
            await markReviewed();
        });
    }
}

/**
 * Shows or hides the Founding Member badge based on stored meta
 */
async function updateFoundingBadge() {
    const data = await loadData();
    if (data.meta?.isFoundingMember) {
        const lang = getCachedLanguage();
        const badge = document.getElementById('foundingBadge');
        const row = document.getElementById('foundingBadgeRow');
        if (badge) badge.textContent = t('foundingMember', lang);
        if (row) row.style.display = 'flex';
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
