/**
 * Themes module - maps mood levels to display colours
 * The data layer stores integer levels (1–5); only the UI knows about colours.
 */

export const LEVEL_TO_COLOR = {
    1: 'rgba(144, 238, 144, 0.9)',
    2: 'rgba(120, 220, 180, 0.75)',
    3: 'rgba(100, 200, 210, 0.6)',
    4: 'rgba(140, 180, 220, 0.45)',
    5: 'rgba(160, 180, 200, 0.3)'
};

export const MOOD_THEMES = {
    1: {
        label: { en: 'Fantastic', fr: 'Fantastique', pt: 'Fantastico' },
        orb: 'radial-gradient(ellipse at 40% 35%, #d8fce8 0%, #90eebb 35%, #48c87a 70%, #30a860 100%)',
        bg: 'radial-gradient(ellipse at 50% 35%, #b8f0cc 0%, #72d4a0 45%, #48b882 100%)',
        glow: 'rgba(144, 238, 187, 0.6)',
        nav: 'linear-gradient(to bottom, rgba(80,170,120,0.92), rgba(40,130,90,0.97))',
        tint: 'rgba(100, 220, 140, 0.18)',
        particle: true,
        floatSpeed: '4s'
    },
    2: {
        label: { en: 'Fine', fr: 'Bien', pt: 'Bem' },
        orb: 'radial-gradient(ellipse at 40% 35%, #d0f8ee 0%, #80ddc0 35%, #38c0a8 70%, #20a090 100%)',
        bg: 'radial-gradient(ellipse at 50% 35%, #a8eedd 0%, #5ecbb0 45%, #38b09a 100%)',
        glow: 'rgba(128, 221, 192, 0.55)',
        nav: 'linear-gradient(to bottom, rgba(60,155,135,0.92), rgba(25,115,100,0.97))',
        tint: 'rgba(80, 200, 185, 0.16)',
        particle: true,
        floatSpeed: '4.5s'
    },
    3: {
        label: { en: 'Okay', fr: 'Correct', pt: 'Ok' },
        orb: 'radial-gradient(ellipse at 40% 35%, #d0f4fc 0%, #78d8f0 35%, #30c0e0 70%, #1898c0 100%)',
        bg: 'radial-gradient(ellipse at 50% 35%, #a0e0f0 0%, #58c8e0 45%, #30aed0 100%)',
        glow: 'rgba(112, 208, 232, 0.5)',
        nav: 'linear-gradient(to bottom, rgba(45,145,180,0.92), rgba(20,108,145,0.97))',
        tint: 'rgba(80, 195, 215, 0.14)',
        particle: false,
        floatSpeed: '5s'
    },
    4: {
        label: { en: 'Low', fr: 'Bas', pt: 'Baixo' },
        orb: 'radial-gradient(ellipse at 40% 35%, #d8e8fc 0%, #90b8e8 35%, #5080d0 70%, #3060b8 100%)',
        bg: 'radial-gradient(ellipse at 50% 35%, #b0c8f0 0%, #6898d8 45%, #4878c0 100%)',
        glow: 'rgba(136, 176, 224, 0.4)',
        nav: 'linear-gradient(to bottom, rgba(70,100,170,0.92), rgba(40,68,140,0.97))',
        tint: 'rgba(100, 140, 210, 0.14)',
        particle: false,
        floatSpeed: '5.5s'
    },
    5: {
        label: { en: 'Down', fr: 'Abattu', pt: 'Deprimido' },
        orb: 'radial-gradient(ellipse at 40% 35%, #e0e4f0 0%, #b0b8d0 35%, #7080b0 70%, #5060a0 100%)',
        bg: 'radial-gradient(ellipse at 50% 35%, #c0c8d8 0%, #8090b0 45%, #6070a0 100%)',
        glow: 'rgba(160, 168, 192, 0.3)',
        nav: 'linear-gradient(to bottom, rgba(90,100,140,0.92), rgba(60,68,110,0.97))',
        tint: 'rgba(130, 130, 190, 0.12)',
        particle: false,
        floatSpeed: '6s'
    }
};
