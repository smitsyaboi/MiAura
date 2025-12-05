/**
 * Color Templates Configuration
 * Defines multiple color themes for the mood tracking application
 */

export const colorTemplates = {
    default: {
        name: 'Default',
        colors: {
            fantastic: {
                rgba: 'rgba(144, 238, 144, 0.9)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(200, 245, 200, 0.95), rgba(144, 238, 144, 0.85))',
                level: 1,
                labels: {
                    en: 'Fantastic',
                    fr: 'Fantastique',
                    pt: 'Fantastico'
                }
            },
            fine: {
                rgba: 'rgba(120, 220, 180, 0.75)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(180, 235, 210, 0.85), rgba(120, 220, 180, 0.7))',
                level: 2,
                labels: {
                    en: 'Fine',
                    fr: 'Bien',
                    pt: 'Bem'
                }
            },
            okay: {
                rgba: 'rgba(100, 200, 210, 0.6)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(160, 220, 230, 0.7), rgba(100, 200, 210, 0.55))',
                level: 3,
                labels: {
                    en: 'Okay',
                    fr: 'Okay',
                    pt: 'Ok'
                }
            },
            low: {
                rgba: 'rgba(140, 180, 220, 0.45)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(180, 210, 240, 0.55), rgba(140, 180, 220, 0.4))',
                level: 4,
                labels: {
                    en: 'Low',
                    fr: 'Bas',
                    pt: 'Baixo'
                }
            },
            down: {
                rgba: 'rgba(160, 180, 200, 0.3)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(190, 205, 220, 0.4), rgba(160, 180, 200, 0.25))',
                level: 5,
                labels: {
                    en: 'Down',
                    fr: 'Mal',
                    pt: 'Mal'
                }
            }
        }
    },
    ocean: {
        name: 'Ocean',
        colors: {
            fantastic: {
                rgba: 'rgba(100, 200, 255, 0.9)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(150, 220, 255, 0.95), rgba(100, 200, 255, 0.85))',
                level: 1,
                labels: {
                    en: 'Fantastic',
                    fr: 'Fantastique',
                    pt: 'Fantastico'
                }
            },
            fine: {
                rgba: 'rgba(80, 180, 230, 0.75)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(130, 200, 240, 0.85), rgba(80, 180, 230, 0.7))',
                level: 2,
                labels: {
                    en: 'Fine',
                    fr: 'Bien',
                    pt: 'Bem'
                }
            },
            okay: {
                rgba: 'rgba(70, 160, 200, 0.6)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(110, 180, 220, 0.7), rgba(70, 160, 200, 0.55))',
                level: 3,
                labels: {
                    en: 'Okay',
                    fr: 'Okay',
                    pt: 'Ok'
                }
            },
            low: {
                rgba: 'rgba(60, 140, 180, 0.45)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(90, 160, 200, 0.55), rgba(60, 140, 180, 0.4))',
                level: 4,
                labels: {
                    en: 'Low',
                    fr: 'Bas',
                    pt: 'Baixo'
                }
            },
            down: {
                rgba: 'rgba(50, 120, 160, 0.3)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(80, 140, 180, 0.4), rgba(50, 120, 160, 0.25))',
                level: 5,
                labels: {
                    en: 'Down',
                    fr: 'Mal',
                    pt: 'Mal'
                }
            }
        }
    }
};

/**
 * Get the current active template
 * @returns {string} Template key ('default' or 'ocean')
 */
export function getCurrentTemplate() {
    return localStorage.getItem('colorTemplate') || 'default';
}

/**
 * Set the active template
 * @param {string} templateKey - Template key to activate
 */
export function setCurrentTemplate(templateKey) {
    if (colorTemplates[templateKey]) {
        localStorage.setItem('colorTemplate', templateKey);
        return true;
    }
    return false;
}

/**
 * Get colors for the current active template
 * @returns {Object} Colors object from the active template
 */
export function getActiveColors() {
    const templateKey = getCurrentTemplate();
    return colorTemplates[templateKey].colors;
}

/**
 * Generate CSS variables for a template
 * @param {string} templateKey - Template key
 * @returns {string} CSS variables as a string
 */
export function generateCSSVariables(templateKey) {
    const template = colorTemplates[templateKey];
    if (!template) return '';

    const colors = template.colors;
    let css = ':root {\n';

    Object.entries(colors).forEach(([mood, data]) => {
        css += `  --mood-${mood}: ${data.rgba};\n`;
    });

    css += '}';
    return css;
}

/**
 * Apply a color template to the document
 * @param {string} templateKey - Template key to apply
 */
export function applyTemplate(templateKey) {
    const template = colorTemplates[templateKey];
    if (!template) {
        console.error(`Template "${templateKey}" not found`);
        return;
    }

    // Update CSS variables
    const root = document.documentElement;
    Object.entries(template.colors).forEach(([mood, data]) => {
        root.style.setProperty(`--mood-${mood}`, data.rgba);
    });

    // Update color options in the UI
    const colorOptions = document.querySelectorAll('.color-option');
    const colorKeys = ['fantastic', 'fine', 'okay', 'low', 'down'];

    colorOptions.forEach((option, index) => {
        const colorKey = colorKeys[index];
        const colorData = template.colors[colorKey];

        if (colorData) {
            option.style.background = colorData.gradient;
            option.setAttribute('data-color', colorData.rgba);
            option.setAttribute('data-level', colorData.level);
            option.setAttribute('data-label-en', colorData.labels.en);
            option.setAttribute('data-label-fr', colorData.labels.fr);
            option.setAttribute('data-label-pt', colorData.labels.pt);
        }
    });

    // Save the template selection
    setCurrentTemplate(templateKey);

    console.log(`Applied color template: ${template.name}`);
}
