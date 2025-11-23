import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getCurrentLanguage,
    setCurrentLanguage,
    cycleLanguage,
    t,
    getMoodLabel,
    getMoodLevel,
    getToggleLabel,
    getLabelKey,
    moodLabels,
    defaultMoodLabels
} from '../js/localization.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        clear: vi.fn(() => { store = {}; })
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('localization', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('getCurrentLanguage / setCurrentLanguage', () => {
        it('should return "en" as default language', () => {
            expect(getCurrentLanguage()).toBe('en');
        });

        it('should save language to localStorage', () => {
            setCurrentLanguage('fr');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'fr');
        });

        it('should retrieve saved language', () => {
            localStorageMock.getItem.mockReturnValueOnce('pt');
            expect(getCurrentLanguage()).toBe('pt');
        });
    });

    describe('cycleLanguage', () => {
        it('should cycle from en to fr', () => {
            localStorageMock.getItem.mockReturnValueOnce('en');
            cycleLanguage();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'fr');
        });

        it('should cycle from fr to pt', () => {
            localStorageMock.getItem.mockReturnValueOnce('fr');
            cycleLanguage();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'pt');
        });

        it('should cycle from pt to en', () => {
            localStorageMock.getItem.mockReturnValueOnce('pt');
            cycleLanguage();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en');
        });
    });

    describe('t (translation function)', () => {
        it('should return English title', () => {
            const title = t('title', 'en');
            expect(title).toBe('Hello, how are you feeling today?');
        });

        it('should return French title', () => {
            const title = t('title', 'fr');
            expect(title).toContain('Bonjour');
        });

        it('should return Portuguese title', () => {
            const title = t('title', 'pt');
            expect(title).toContain('Ola');
        });

        it('should return English settings', () => {
            expect(t('settings', 'en')).toBe('Settings');
        });

        it('should return French settings', () => {
            expect(t('settings', 'fr')).toBe('Parametres');
        });

        it('should return streak translation', () => {
            expect(t('dayStreak', 'en')).toBe('streak');
            expect(t('dayStreak', 'fr')).toBe('serie');
            expect(t('dayStreak', 'pt')).toBe('sequencia');
        });

        it('should use current language when not specified', () => {
            localStorageMock.getItem.mockReturnValue('fr');
            const title = t('title');
            expect(title).toContain('Bonjour');
        });
    });

    describe('getMoodLabel', () => {
        it('should return English mood label for Fantastic', () => {
            const label = getMoodLabel('rgba(144, 238, 144, 0.9)', 'en');
            expect(label).toBe('Fantastic');
        });

        it('should return French mood label for Fantastic', () => {
            const label = getMoodLabel('rgba(144, 238, 144, 0.9)', 'fr');
            expect(label).toBe('Fantastique');
        });

        it('should return Portuguese mood label for Fantastic', () => {
            const label = getMoodLabel('rgba(144, 238, 144, 0.9)', 'pt');
            expect(label).toBe('Fantastico');
        });

        it('should return correct labels for all mood levels', () => {
            expect(getMoodLabel('rgba(120, 220, 180, 0.75)', 'en')).toBe('Fine');
            expect(getMoodLabel('rgba(100, 200, 210, 0.6)', 'en')).toBe('Okay');
            expect(getMoodLabel('rgba(140, 180, 220, 0.45)', 'en')).toBe('Low');
            expect(getMoodLabel('rgba(160, 180, 200, 0.3)', 'en')).toBe('Down');
        });

        it('should return falsy value for unknown color', () => {
            const label = getMoodLabel('#unknown', 'en');
            expect(label).toBeFalsy();
        });
    });

    describe('getMoodLevel', () => {
        it('should return level 1 for Fantastic color', () => {
            expect(getMoodLevel('rgba(144, 238, 144, 0.9)')).toBe(1);
        });

        it('should return level 2 for Fine color', () => {
            expect(getMoodLevel('rgba(120, 220, 180, 0.75)')).toBe(2);
        });

        it('should return level 3 for Okay color', () => {
            expect(getMoodLevel('rgba(100, 200, 210, 0.6)')).toBe(3);
        });

        it('should return level 4 for Low color', () => {
            expect(getMoodLevel('rgba(140, 180, 220, 0.45)')).toBe(4);
        });

        it('should return level 5 for Down color', () => {
            expect(getMoodLevel('rgba(160, 180, 200, 0.3)')).toBe(5);
        });

        it('should return default level 3 for unknown color', () => {
            expect(getMoodLevel('#unknown')).toBe(3);
        });
    });

    describe('getToggleLabel', () => {
        it('should return FR when current language is en', () => {
            expect(getToggleLabel('en')).toBe('FR');
        });

        it('should return PT when current language is fr', () => {
            expect(getToggleLabel('fr')).toBe('PT');
        });

        it('should return EN when current language is pt', () => {
            expect(getToggleLabel('pt')).toBe('EN');
        });
    });

    describe('getLabelKey', () => {
        it('should return correct label key for each language', () => {
            expect(getLabelKey('en')).toBe('labelEn');
            expect(getLabelKey('fr')).toBe('labelFr');
            expect(getLabelKey('pt')).toBe('labelPt');
        });
    });

    describe('moodLabels export', () => {
        it('should have all 5 mood colors defined', () => {
            const colors = Object.keys(moodLabels);
            expect(colors.length).toBe(5);
        });

        it('should have all 3 languages for each color', () => {
            Object.values(moodLabels).forEach(labels => {
                expect(labels).toHaveProperty('en');
                expect(labels).toHaveProperty('fr');
                expect(labels).toHaveProperty('pt');
            });
        });
    });

    describe('defaultMoodLabels export', () => {
        it('should have default labels for all languages', () => {
            expect(defaultMoodLabels.en).toBe('Okay');
            expect(defaultMoodLabels.fr).toBe('Correct');
            expect(defaultMoodLabels.pt).toBe('Ok');
        });
    });
});
