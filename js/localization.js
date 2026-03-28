/**
 * Localization module - handles translations and language management
 */

import { getSetting, setSetting } from './storage.js';

/**
 * Cached language — kept in sync by getCurrentLanguage / setCurrentLanguage.
 * Sync helpers (t, getLabelKey, …) read from the cache so they stay synchronous.
 */
let _cachedLanguage = 'en';

/**
 * Supported languages in order of toggle rotation
 */
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'pt', 'de', 'sv'];

/**
 * UI translations for each language
 */
export const translations = {
    en: {
        title: 'Hello, how are you feeling today?',
        yearTitle: 'Year',
        daysLogged: 'days logged',
        dayStreak: 'streak',
        back: 'Back',
        settings: 'Settings',
        language: 'Language',
        view: 'View',
        counter: 'Counter',
        streak: 'Streak',
        total: 'Total',
        testMode: 'Test Mode',
        dataExport: 'Data Export',
        comingSoon: 'Coming Soon ✨',
        today: 'today',
        fantastic: 'Fantastic',
        okay: 'Okay',
        down: 'Down',
        reviewPrompt: 'Loving MiAura? You\'re on a 7-day streak ✦',
        reviewAction: 'Leave a review'
    },
    fr: {
        title: 'Bonjour, comment allez-vous aujourd\'hui?',
        yearTitle: 'Annee',
        daysLogged: 'jours enregistres',
        dayStreak: 'serie',
        back: 'Retour',
        settings: 'Parametres',
        language: 'Langue',
        view: 'Vue',
        counter: 'Compteur',
        streak: 'Serie',
        total: 'Total',
        testMode: 'Mode Test',
        dataExport: 'Exportation',
        comingSoon: 'Bientot disponible ✨',
        today: "aujourd'hui",
        fantastic: 'Fantastique',
        okay: 'Correct',
        down: 'Abattu',
        reviewPrompt: 'Vous aimez MiAura? 7 jours de suite ✦',
        reviewAction: 'Laisser un avis'
    },
    pt: {
        title: 'Ola, como voce esta se sentindo hoje?',
        yearTitle: 'Ano',
        daysLogged: 'dias registrados',
        dayStreak: 'sequencia',
        back: 'Voltar',
        settings: 'Configuracoes',
        language: 'Idioma',
        view: 'Vista',
        counter: 'Contador',
        streak: 'Sequencia',
        total: 'Total',
        testMode: 'Modo de Teste',
        dataExport: 'Exportar Dados',
        comingSoon: 'Em breve ✨',
        today: 'hoje',
        fantastic: 'Fantastico',
        okay: 'Ok',
        down: 'Deprimido',
        reviewPrompt: 'Gostando do MiAura? 7 dias seguidos ✦',
        reviewAction: 'Avaliar'
    },
    de: {
        title: 'Hallo, wie fühlst du dich heute?',
        yearTitle: 'Jahr',
        daysLogged: 'Tage erfasst',
        dayStreak: 'Serie',
        back: 'Zurück',
        settings: 'Einstellungen',
        language: 'Sprache',
        view: 'Ansicht',
        counter: 'Zähler',
        streak: 'Serie',
        total: 'Gesamt',
        testMode: 'Testmodus',
        dataExport: 'Daten exportieren',
        comingSoon: 'Demnächst ✨',
        today: 'heute',
        fantastic: 'Fantastisch',
        okay: 'Okay',
        down: 'Niedergeschlagen',
        reviewPrompt: 'MiAura gefällt dir? 7 Tage in Folge ✦',
        reviewAction: 'Bewertung schreiben'
    },
    sv: {
        title: 'Hej, hur mår du idag?',
        yearTitle: 'År',
        daysLogged: 'dagar loggade',
        dayStreak: 'svit',
        back: 'Tillbaka',
        settings: 'Inställningar',
        language: 'Språk',
        view: 'Vy',
        counter: 'Räknare',
        streak: 'Svit',
        total: 'Totalt',
        testMode: 'Testläge',
        dataExport: 'Exportera data',
        comingSoon: 'Kommer snart ✨',
        today: 'idag',
        fantastic: 'Fantastisk',
        okay: 'Okej',
        down: 'Nedstämd',
        reviewPrompt: 'Gillar du MiAura? 7 dagar i rad ✦',
        reviewAction: 'Skriv en recension'
    }
};

/**
 * Mood labels for each color in all languages
 */
export const moodLabels = {
    'rgba(144, 238, 144, 0.9)': { en: 'Fantastic', fr: 'Fantastique', pt: 'Fantastico', de: 'Fantastisch', sv: 'Fantastisk' },
    'rgba(120, 220, 180, 0.75)': { en: 'Fine', fr: 'Bien', pt: 'Bem', de: 'Gut', sv: 'Bra' },
    'rgba(100, 200, 210, 0.6)': { en: 'Okay', fr: 'Correct', pt: 'Ok', de: 'Okay', sv: 'Okej' },
    'rgba(140, 180, 220, 0.45)': { en: 'Low', fr: 'Bas', pt: 'Baixo', de: 'Niedrig', sv: 'Lågt' },
    'rgba(160, 180, 200, 0.3)': { en: 'Down', fr: 'Abattu', pt: 'Deprimido', de: 'Niedergeschlagen', sv: 'Nedstämd' }
};

/**
 * Maps mood colors to levels (1-5, matching signal bars)
 */
const moodLevels = {
    'rgba(144, 238, 144, 0.9)': 1,
    'rgba(120, 220, 180, 0.75)': 2,
    'rgba(100, 200, 210, 0.6)': 3,
    'rgba(140, 180, 220, 0.45)': 4,
    'rgba(160, 180, 200, 0.3)': 5
};

/**
 * Gets the mood level (1-5) for a color
 * @param {string} color - The mood color
 * @returns {number} - Level 1-5, or 3 as default
 */
export function getMoodLevel(color) {
    return moodLevels[color] || 3;
}

/**
 * Default mood labels when nothing is logged
 */
export const defaultMoodLabels = {
    en: 'Okay',
    fr: 'Correct',
    pt: 'Ok',
    de: 'Okay',
    sv: 'Okej'
};

/**
 * Maps current language to the label shown on toggle button (next language)
 */
const languageToggleLabels = {
    en: 'FR',
    fr: 'PT',
    pt: 'EN'
};

/**
 * Initialises the language cache from already-loaded data.
 * Call once during app init to avoid an extra storage read.
 * @param {string} language
 */
export function initLanguageCache(language) {
    _cachedLanguage = language || 'en';
}

/**
 * Returns the cached language synchronously
 * @returns {string}
 */
export function getCachedLanguage() {
    return _cachedLanguage;
}

/**
 * Gets the current language (async — reads from storage, updates cache)
 * @returns {Promise<string>}
 */
export async function getCurrentLanguage() {
    _cachedLanguage = (await getSetting('language')) || 'en';
    return _cachedLanguage;
}

/**
 * Sets the current language (async — writes to storage, updates cache)
 * @param {string} language
 */
export async function setCurrentLanguage(language) {
    _cachedLanguage = language;
    await setSetting('language', language);
}

/**
 * Cycles to the next language in the supported list
 * @returns {Promise<string>} - The new language code
 */
export async function cycleLanguage() {
    const current = _cachedLanguage;
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(current);
    const newLanguage = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
    await setCurrentLanguage(newLanguage);
    return newLanguage;
}

/**
 * Gets the translation for a key in the current language
 * @param {string} key - Translation key
 * @param {string} [language] - Optional language override
 * @returns {string} - Translated string
 */
export function t(key, language = null) {
    const lang = language || _cachedLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
}

/**
 * Gets the mood label for a color
 * @param {string} color - The mood color
 * @param {string} [language] - Optional language override
 * @returns {string} - Mood label
 */
export function getMoodLabel(color, language = null) {
    const lang = language || _cachedLanguage;
    return moodLabels[color]?.[lang] || '';
}

/**
 * Gets the label key for the current language (for data attributes)
 * @param {string} [language] - Optional language override
 * @returns {string} - Label key like 'labelEn', 'labelFr', etc.
 */
export function getLabelKey(language = null) {
    const lang = language || _cachedLanguage;
    return `label${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
}

/**
 * Gets the toggle button label (shows next language abbreviation)
 * @param {string} [language] - Optional language override
 * @returns {string} - Toggle button label
 */
export function getToggleLabel(language = null) {
    const lang = language || _cachedLanguage;
    return languageToggleLabels[lang];
}
