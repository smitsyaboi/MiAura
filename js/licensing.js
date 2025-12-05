/**
 * Licensing module - manages premium template access
 */

const STORAGE_KEY = 'miaura_unlocked_templates';
const PREMIUM_TRIAL_KEY = 'miaura_premium_trial';

/**
 * Check if a template is unlocked
 * @param {string} templateKey - Template key to check
 * @returns {boolean} True if unlocked
 */
export function isTemplateUnlocked(templateKey) {
    const unlockedTemplates = getUnlockedTemplates();
    return unlockedTemplates.includes(templateKey);
}

/**
 * Get list of all unlocked templates
 * @returns {Array<string>} Array of unlocked template keys
 */
export function getUnlockedTemplates() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // Default free templates
        return ['default', 'ocean'];
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        return ['default', 'ocean'];
    }
}

/**
 * Unlock a template
 * @param {string} templateKey - Template key to unlock
 */
export function unlockTemplate(templateKey) {
    const unlocked = getUnlockedTemplates();
    if (!unlocked.includes(templateKey)) {
        unlocked.push(templateKey);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    }
}

/**
 * Unlock multiple templates
 * @param {Array<string>} templateKeys - Array of template keys to unlock
 */
export function unlockTemplates(templateKeys) {
    templateKeys.forEach(key => unlockTemplate(key));
}

/**
 * Lock a template (remove from unlocked list)
 * @param {string} templateKey - Template key to lock
 */
export function lockTemplate(templateKey) {
    const unlocked = getUnlockedTemplates();
    const filtered = unlocked.filter(key => key !== templateKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Check if user has premium access (all templates unlocked)
 * @returns {boolean} True if user has premium
 */
export function hasPremiumAccess() {
    const unlocked = getUnlockedTemplates();
    // If user has more than just the free templates, they have premium
    const premiumTemplates = ['sunset', 'forest', 'lavender', 'goc', 'veteran'];
    return premiumTemplates.every(template => unlocked.includes(template));
}

/**
 * Grant premium access (unlock all templates)
 */
export function grantPremiumAccess() {
    const allTemplates = ['default', 'ocean', 'sunset', 'forest', 'lavender', 'goc', 'veteran'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
}

/**
 * Revoke premium access (reset to free templates only)
 */
export function revokePremiumAccess() {
    const freeTemplates = ['default', 'ocean'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freeTemplates));
}

/**
 * Check if premium trial is active
 * @returns {boolean} True if trial is active
 */
export function isTrialActive() {
    const trialData = localStorage.getItem(PREMIUM_TRIAL_KEY);
    if (!trialData) return false;

    try {
        const { expiresAt } = JSON.parse(trialData);
        return Date.now() < expiresAt;
    } catch (e) {
        return false;
    }
}

/**
 * Start a premium trial
 * @param {number} durationDays - Trial duration in days
 */
export function startTrial(durationDays = 7) {
    const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    localStorage.setItem(PREMIUM_TRIAL_KEY, JSON.stringify({
        startedAt: Date.now(),
        expiresAt
    }));
    grantPremiumAccess();
}

/**
 * Get trial information
 * @returns {Object|null} Trial info or null if no trial
 */
export function getTrialInfo() {
    const trialData = localStorage.getItem(PREMIUM_TRIAL_KEY);
    if (!trialData) return null;

    try {
        const data = JSON.parse(trialData);
        const daysRemaining = Math.ceil((data.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        return {
            ...data,
            active: Date.now() < data.expiresAt,
            daysRemaining: Math.max(0, daysRemaining)
        };
    } catch (e) {
        return null;
    }
}

/**
 * End trial (for testing)
 */
export function endTrial() {
    localStorage.removeItem(PREMIUM_TRIAL_KEY);
    revokePremiumAccess();
}
