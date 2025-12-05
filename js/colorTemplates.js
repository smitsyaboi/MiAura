/**
 * Color Templates Configuration
 * Defines multiple color themes for the mood tracking application
 */

export const colorTemplates = {
    default: {
        name: 'Default',
        background: 'radial-gradient(ellipse at center, #f8f8f8, #e8e8e8)',
        textPrimary: '#2d4a3e',
        textSecondary: '#666',
        containerGradient: 'linear-gradient(0deg, rgb(110 184 110 / 19%), #0054e345)',
        glassBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(240, 240, 240, 0.7))',
        glassBackgroundHover: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 245, 245, 0.8))',
        glassBorder: '1px solid rgba(255, 255, 255, 0.9)',
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
        background: 'radial-gradient(ellipse at center, #e6f3ff, #d0e8ff)',
        textPrimary: '#1e3a5f',
        textSecondary: '#4a6b8a',
        containerGradient: 'linear-gradient(0deg, rgb(100 180 230 / 19%), #0088ff45)',
        glassBackground: 'linear-gradient(135deg, rgba(230, 245, 255, 0.8), rgba(210, 235, 255, 0.7))',
        glassBackgroundHover: 'linear-gradient(135deg, rgba(240, 250, 255, 0.9), rgba(220, 240, 255, 0.8))',
        glassBorder: '1px solid rgba(180, 220, 255, 0.9)',
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
    },
    sunset: {
        name: 'Sunset',
        background: 'radial-gradient(ellipse at center, #fff5e6, #ffe8d0)',
        textPrimary: '#5a3a2d',
        textSecondary: '#8a6a5a',
        containerGradient: 'linear-gradient(0deg, rgb(255 150 100 / 19%), #ff660045)',
        glassBackground: 'linear-gradient(135deg, rgba(255, 245, 230, 0.8), rgba(255, 235, 210, 0.7))',
        glassBackgroundHover: 'linear-gradient(135deg, rgba(255, 250, 240, 0.9), rgba(255, 240, 220, 0.8))',
        glassBorder: '1px solid rgba(255, 220, 180, 0.9)',
        colors: {
            fantastic: {
                rgba: 'rgba(255, 180, 100, 0.9)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(255, 200, 130, 0.95), rgba(255, 180, 100, 0.85))',
                level: 1,
                labels: {
                    en: 'Fantastic',
                    fr: 'Fantastique',
                    pt: 'Fantastico'
                }
            },
            fine: {
                rgba: 'rgba(255, 160, 90, 0.75)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(255, 185, 115, 0.85), rgba(255, 160, 90, 0.7))',
                level: 2,
                labels: {
                    en: 'Fine',
                    fr: 'Bien',
                    pt: 'Bem'
                }
            },
            okay: {
                rgba: 'rgba(240, 140, 100, 0.6)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(250, 165, 125, 0.7), rgba(240, 140, 100, 0.55))',
                level: 3,
                labels: {
                    en: 'Okay',
                    fr: 'Okay',
                    pt: 'Ok'
                }
            },
            low: {
                rgba: 'rgba(220, 130, 110, 0.45)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(235, 150, 130, 0.55), rgba(220, 130, 110, 0.4))',
                level: 4,
                labels: {
                    en: 'Low',
                    fr: 'Bas',
                    pt: 'Baixo'
                }
            },
            down: {
                rgba: 'rgba(200, 120, 100, 0.3)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(215, 135, 115, 0.4), rgba(200, 120, 100, 0.25))',
                level: 5,
                labels: {
                    en: 'Down',
                    fr: 'Mal',
                    pt: 'Mal'
                }
            }
        }
    },
    forest: {
        name: 'Forest',
        background: 'radial-gradient(ellipse at center, #f0f5e8, #e5eed0)',
        textPrimary: '#2d4a2d',
        textSecondary: '#5a6a4a',
        containerGradient: 'linear-gradient(0deg, rgb(100 150 80 / 19%), #55883345)',
        glassBackground: 'linear-gradient(135deg, rgba(240, 250, 235, 0.8), rgba(230, 245, 220, 0.7))',
        glassBackgroundHover: 'linear-gradient(135deg, rgba(245, 255, 240, 0.9), rgba(235, 250, 225, 0.8))',
        glassBorder: '1px solid rgba(200, 230, 180, 0.9)',
        colors: {
            fantastic: {
                rgba: 'rgba(120, 200, 100, 0.9)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(150, 220, 130, 0.95), rgba(120, 200, 100, 0.85))',
                level: 1,
                labels: {
                    en: 'Fantastic',
                    fr: 'Fantastique',
                    pt: 'Fantastico'
                }
            },
            fine: {
                rgba: 'rgba(100, 180, 90, 0.75)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(130, 200, 115, 0.85), rgba(100, 180, 90, 0.7))',
                level: 2,
                labels: {
                    en: 'Fine',
                    fr: 'Bien',
                    pt: 'Bem'
                }
            },
            okay: {
                rgba: 'rgba(90, 160, 80, 0.6)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(115, 180, 105, 0.7), rgba(90, 160, 80, 0.55))',
                level: 3,
                labels: {
                    en: 'Okay',
                    fr: 'Okay',
                    pt: 'Ok'
                }
            },
            low: {
                rgba: 'rgba(80, 140, 70, 0.45)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(105, 165, 95, 0.55), rgba(80, 140, 70, 0.4))',
                level: 4,
                labels: {
                    en: 'Low',
                    fr: 'Bas',
                    pt: 'Baixo'
                }
            },
            down: {
                rgba: 'rgba(70, 120, 60, 0.3)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(95, 145, 85, 0.4), rgba(70, 120, 60, 0.25))',
                level: 5,
                labels: {
                    en: 'Down',
                    fr: 'Mal',
                    pt: 'Mal'
                }
            }
        }
    },
    lavender: {
        name: 'Lavender',
        background: 'radial-gradient(ellipse at center, #f8f0ff, #ede0ff)',
        textPrimary: '#4a3a5a',
        textSecondary: '#6a5a7a',
        containerGradient: 'linear-gradient(0deg, rgb(180 140 220 / 19%), #8844ff45)',
        glassBackground: 'linear-gradient(135deg, rgba(250, 240, 255, 0.8), rgba(245, 230, 255, 0.7))',
        glassBackgroundHover: 'linear-gradient(135deg, rgba(255, 245, 255, 0.9), rgba(250, 235, 255, 0.8))',
        glassBorder: '1px solid rgba(220, 200, 240, 0.9)',
        colors: {
            fantastic: {
                rgba: 'rgba(200, 150, 230, 0.9)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(220, 180, 245, 0.95), rgba(200, 150, 230, 0.85))',
                level: 1,
                labels: {
                    en: 'Fantastic',
                    fr: 'Fantastique',
                    pt: 'Fantastico'
                }
            },
            fine: {
                rgba: 'rgba(180, 140, 210, 0.75)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(200, 165, 225, 0.85), rgba(180, 140, 210, 0.7))',
                level: 2,
                labels: {
                    en: 'Fine',
                    fr: 'Bien',
                    pt: 'Bem'
                }
            },
            okay: {
                rgba: 'rgba(160, 130, 190, 0.6)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(180, 155, 205, 0.7), rgba(160, 130, 190, 0.55))',
                level: 3,
                labels: {
                    en: 'Okay',
                    fr: 'Okay',
                    pt: 'Ok'
                }
            },
            low: {
                rgba: 'rgba(140, 120, 170, 0.45)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(160, 140, 185, 0.55), rgba(140, 120, 170, 0.4))',
                level: 4,
                labels: {
                    en: 'Low',
                    fr: 'Bas',
                    pt: 'Baixo'
                }
            },
            down: {
                rgba: 'rgba(120, 110, 150, 0.3)',
                gradient: 'radial-gradient(ellipse at 30% 30%, rgba(140, 125, 165, 0.4), rgba(120, 110, 150, 0.25))',
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

    // Update mood colors
    Object.entries(template.colors).forEach(([mood, data]) => {
        root.style.setProperty(`--mood-${mood}`, data.rgba);
    });

    // Update theme properties
    root.style.setProperty('--color-background-body', template.background);
    root.style.setProperty('--color-text-primary', template.textPrimary);
    root.style.setProperty('--color-text-secondary', template.textSecondary);
    root.style.setProperty('--color-container-gradient', template.containerGradient);
    root.style.setProperty('--glass-background', template.glassBackground);
    root.style.setProperty('--glass-background-hover', template.glassBackgroundHover);
    root.style.setProperty('--glass-border', template.glassBorder);

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

/**
 * Get mood label for a color from the active template
 * Searches across all templates to find the matching color
 * @param {string} color - RGBA color string
 * @param {string} language - Language code (en, fr, pt)
 * @returns {string} Mood label or empty string if not found
 */
export function getMoodLabelFromTemplate(color, language) {
    // Try current template first
    const currentTemplateKey = getCurrentTemplate();
    const currentTemplate = colorTemplates[currentTemplateKey];

    for (const [moodKey, moodData] of Object.entries(currentTemplate.colors)) {
        if (moodData.rgba === color) {
            return moodData.labels[language] || '';
        }
    }

    // If not found in current template, search all templates (for backwards compatibility)
    for (const templateKey of Object.keys(colorTemplates)) {
        const template = colorTemplates[templateKey];
        for (const [moodKey, moodData] of Object.entries(template.colors)) {
            if (moodData.rgba === color) {
                return moodData.labels[language] || '';
            }
        }
    }

    return '';
}

/**
 * Get mood level for a color from any template
 * @param {string} color - RGBA color string
 * @returns {number} Mood level (1-5) or 3 as default
 */
export function getMoodLevelFromTemplate(color) {
    // Search all templates for the color
    for (const templateKey of Object.keys(colorTemplates)) {
        const template = colorTemplates[templateKey];
        for (const [moodKey, moodData] of Object.entries(template.colors)) {
            if (moodData.rgba === color) {
                return moodData.level;
            }
        }
    }

    return 3; // Default to "okay" level
}
