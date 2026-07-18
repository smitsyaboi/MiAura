import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        ignores: ['node_modules/**', 'coverage/**']
    },
    // Popup / UI modules: browser DOM + chrome extension APIs
    {
        files: ['popup.js', 'js/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.webextensions
            }
        },
        rules: {
            eqeqeq: 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'require-await': 'error'
        }
    },
    // Service worker modules (background.js, once it exists): no DOM, no localStorage
    {
        files: ['background.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.serviceworker,
                ...globals.webextensions
            }
        },
        rules: {
            eqeqeq: 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'require-await': 'error'
        }
    },
    // Tests: vitest globals come via imports; node + browser for mocks
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                chrome: 'writable'
            }
        }
    }
];
