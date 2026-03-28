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
