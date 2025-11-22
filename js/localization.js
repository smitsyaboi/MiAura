/**
 * Localization module - handles translations and language management
 */

import { getLanguagePreference, setLanguagePreference } from './storage.js';

/**
 * Supported languages in order of toggle rotation
 */
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'pt'];

/**
 * UI translations for each language
 */
export const translations = {
    en: {
        title: 'Hello, how are you feeling today?',
        yearTitle: 'Year',
        daysLogged: 'days logged',
        back: 'Back',
        settings: 'Settings',
        language: 'Language'
    },
    fr: {
        title: 'Bonjour, comment allez-vous aujourd\'hui?',
        yearTitle: 'Annee',
        daysLogged: 'jours enregistres',
        back: 'Retour',
        settings: 'Parametres',
        language: 'Langue'
    },
    pt: {
        title: 'Ola, como voce esta se sentindo hoje?',
        yearTitle: 'Ano',
        daysLogged: 'dias registrados',
        back: 'Voltar',
        settings: 'Configuracoes',
        language: 'Idioma'
    }
};

/**
 * Mood labels for each color in all languages
 */
export const moodLabels = {
    'rgba(144, 238, 144, 0.9)': { en: 'Fantastic', fr: 'Fantastique', pt: 'Fantastico' },
    'rgba(120, 220, 180, 0.75)': { en: 'Fine', fr: 'Bien', pt: 'Bem' },
    'rgba(100, 200, 210, 0.6)': { en: 'Okay', fr: 'Correct', pt: 'Ok' },
    'rgba(140, 180, 220, 0.45)': { en: 'Low', fr: 'Bas', pt: 'Baixo' },
    'rgba(160, 180, 200, 0.3)': { en: 'Down', fr: 'Abattu', pt: 'Deprimido' }
};

/**
 * Default mood labels when nothing is logged
 */
export const defaultMoodLabels = {
    en: 'Okay',
    fr: 'Correct',
    pt: 'Ok'
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
 * Gets the current language
 * @returns {string} - Current language code
 */
export function getCurrentLanguage() {
    return getLanguagePreference();
}

/**
 * Sets the current language
 * @param {string} language - Language code to set
 */
export function setCurrentLanguage(language) {
    setLanguagePreference(language);
}

/**
 * Cycles to the next language in the supported list
 * @returns {string} - The new language code
 */
export function cycleLanguage() {
    const current = getCurrentLanguage();
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(current);
    const newLanguage = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
    setCurrentLanguage(newLanguage);
    return newLanguage;
}

/**
 * Gets the translation for a key in the current language
 * @param {string} key - Translation key
 * @param {string} [language] - Optional language override
 * @returns {string} - Translated string
 */
export function t(key, language = null) {
    const lang = language || getCurrentLanguage();
    return translations[lang]?.[key] || translations.en[key] || key;
}

/**
 * Gets the mood label for a color
 * @param {string} color - The mood color
 * @param {string} [language] - Optional language override
 * @returns {string} - Mood label
 */
export function getMoodLabel(color, language = null) {
    const lang = language || getCurrentLanguage();
    return moodLabels[color]?.[lang] || '';
}

/**
 * Gets the label key for the current language (for data attributes)
 * @param {string} [language] - Optional language override
 * @returns {string} - Label key like 'labelEn', 'labelFr', etc.
 */
export function getLabelKey(language = null) {
    const lang = language || getCurrentLanguage();
    return `label${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
}

/**
 * Gets the toggle button label (shows next language abbreviation)
 * @param {string} [language] - Optional language override
 * @returns {string} - Toggle button label
 */
export function getToggleLabel(language = null) {
    const lang = language || getCurrentLanguage();
    return languageToggleLabels[lang];
}
