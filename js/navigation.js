import { showPage } from './eventHandlers.js'; // Assuming showPage exists here

/**
 * Updates the active state of navigation items
 * @param {string} activeId - ID of the nav item to activate
 */
function updateNavActive(activeId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.getElementById(activeId);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

/**
 * Initializes Vista-style bottom navigation
 */
export function initNavigation() {
    const navToday = document.getElementById('navToday');
    const navCalendar = document.getElementById('navCalendar');
    const navSettings = document.getElementById('navSettings');

    if (navToday) {
        navToday.addEventListener('click', () => {
            showPage('page1');
            updateNavActive('navToday');
        });
    }

    if (navCalendar) {
        navCalendar.addEventListener('click', () => {
            showPage('page2');
            updateNavActive('navCalendar');
        });
    }

    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showPage('page3');
            updateNavActive('navSettings');
        });
    }
}

/**
 * Updates nav state when page changes externally
 * @param {string} pageId - ID of the page being shown
 */
export function syncNavWithPage(pageId) {
    if (pageId === 'page1') {
        updateNavActive('navToday');
    } else if (pageId === 'page2') {
        updateNavActive('navCalendar');
    } else if (pageId === 'page3') {
        updateNavActive('navSettings');
    }
}