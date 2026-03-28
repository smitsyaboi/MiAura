/**
 * Grid renderer module - SVG wave graph calendar views (year/month/week)
 */

import { loadData, calculateStreakFromMoods, getStreakHeatLevel } from './storage.js';
import { generateYearDates, getTodayDateString, formatDateForDisplay, formatDateString } from './dateUtils.js';
import { t } from './localization.js';
import { getViewYear, getActualYear, getViewMonth, getViewWeekStart } from './state.js';

const LEVEL_TO_Y = {
    1: 10,
    2: 30,
    3: 50,
    4: 70,
    5: 85,
};
const BASELINE_Y = 92;
const UNLOGGED_Y = 92;

const WAVE_COLORS = {
    1: 'rgba(100, 225, 140, 0.95)',
    2: 'rgba(80, 205, 185, 0.92)',
    3: 'rgba(80, 195, 215, 0.90)',
    4: 'rgba(120, 165, 215, 0.88)',
    5: 'rgba(150, 155, 210, 0.85)',
};

function smoothPath(points) {
    if (points.length < 2) return '';
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
}

function buildWaveSVG(points, width, height, labels) {
    const gradId = 'waveGrad' + Math.random().toString(36).slice(2, 8);
    const fillGradId = 'fillGrad' + Math.random().toString(36).slice(2, 8);
    const maskId = 'fadeMask' + Math.random().toString(36).slice(2, 8);

    // Separate logged and unlogged segments
    const loggedPoints = points.filter(p => p.isLogged);
    const todayPoint = points.find(p => p.isToday);

    // Build line gradient stops from logged points
    let lineGradStops = '';
    if (loggedPoints.length > 0) {
        const minX = points[0].x;
        const maxX = points[points.length - 1].x;
        const range = maxX - minX || 1;
        loggedPoints.forEach(p => {
            const offset = ((p.x - minX) / range * 100).toFixed(1);
            lineGradStops += `<stop offset="${offset}%" stop-color="${WAVE_COLORS[p.level] || WAVE_COLORS[3]}"/>`;
        });
    }

    // Grid lines
    let gridLines = `<line x1="0" y1="${BASELINE_Y}" x2="${width}" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.15)" stroke-width="0.75"/>`;
    gridLines += `<line x1="0" y1="62" x2="${width}" y2="62" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;
    gridLines += `<line x1="0" y1="32" x2="${width}" y2="32" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;

    // Wave path for logged points
    let wavePath = '';
    let fillPath = '';
    let dashedPath = '';

    if (loggedPoints.length >= 2) {
        const pathD = smoothPath(loggedPoints);
        wavePath = `<path d="${pathD}" fill="none" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round"/>`;

        // Fill area under logged wave
        const fillD = pathD + ` L${loggedPoints[loggedPoints.length - 1].x} ${BASELINE_Y} L${loggedPoints[0].x} ${BASELINE_Y} Z`;
        fillPath = `<path d="${fillD}" fill="url(#${fillGradId})" opacity="0.6"/>`;
    } else if (loggedPoints.length === 1) {
        wavePath = '';
    }

    // Dashed line for unlogged/future segments
    const allPoints = points.map(p => ({
        x: p.x,
        y: p.isLogged ? LEVEL_TO_Y[p.level] || UNLOGGED_Y : UNLOGGED_Y,
    }));

    // Find continuous unlogged segments
    let unloggedSegments = [];
    let currentSeg = [];
    for (let i = 0; i < points.length; i++) {
        if (!points[i].isLogged) {
            // Include the last logged point before this gap as a connector
            if (currentSeg.length === 0 && i > 0 && points[i - 1].isLogged) {
                currentSeg.push({ x: points[i - 1].x, y: LEVEL_TO_Y[points[i - 1].level] || UNLOGGED_Y });
            }
            currentSeg.push({ x: points[i].x, y: UNLOGGED_Y });
        } else {
            if (currentSeg.length > 0) {
                currentSeg.push({ x: points[i].x, y: LEVEL_TO_Y[points[i].level] || UNLOGGED_Y });
                unloggedSegments.push(currentSeg);
                currentSeg = [];
            }
        }
    }
    if (currentSeg.length > 0) unloggedSegments.push(currentSeg);

    unloggedSegments.forEach(seg => {
        if (seg.length >= 2) {
            const d = smoothPath(seg);
            dashedPath += `<path d="${d}" fill="none" stroke="rgba(26,58,74,0.15)" stroke-width="1" stroke-dasharray="4 3" stroke-linecap="round"/>`;
        }
    });

    // Dots
    let dots = '';
    points.forEach(p => {
        if (p.isLogged) {
            const color = WAVE_COLORS[p.level] || WAVE_COLORS[3];
            if (p.isToday) {
                dots += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
            }
            dots += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
        } else if (p.isToday) {
            dots += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="none" stroke="rgba(26,58,74,0.25)" stroke-width="1.5" stroke-dasharray="2 2"/>`;
        }
    });

    // Today marker
    let todayMarker = '';
    if (todayPoint) {
        todayMarker = `<line x1="${todayPoint.x}" y1="5" x2="${todayPoint.x}" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.2)" stroke-width="0.75" stroke-dasharray="3 2"/>`;
        todayMarker += `<text x="${todayPoint.x}" y="5" text-anchor="middle" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.55)">today</text>`;
    }

    // Labels
    let labelsSVG = '';
    if (labels) {
        labelsSVG = labels;
    }

    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;min-height:220px;">
        <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
                ${lineGradStops || '<stop offset="0%" stop-color="rgba(80,195,215,0.9)"/>'}
            </linearGradient>
            <linearGradient id="${fillGradId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(80,210,150,0.45)"/>
                <stop offset="100%" stop-color="rgba(80,210,150,0)"/>
            </linearGradient>
        </defs>
        ${gridLines}
        ${fillPath}
        ${wavePath}
        ${dashedPath}
        ${todayMarker}
        ${dots}
        ${labelsSVG}
    </svg>`;
}

// --- Year View ---

function renderYearGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'year-grid';

    const viewYear = getViewYear();
    const currentYear = getActualYear();
    const today = getTodayDateString();
    const yearDates = generateYearDates(viewYear);

    let loggedCount = 0;
    const points = [];

    yearDates.forEach(({ dateString }, idx) => {
        const moodEntry = moods[dateString];
        const isToday = dateString === today && viewYear === currentYear;
        const x = (idx / (yearDates.length - 1)) * 296;

        if (moodEntry) {
            loggedCount++;
            points.push({ x, y: LEVEL_TO_Y[moodEntry.level], level: moodEntry.level, isLogged: true, isToday });
        } else {
            points.push({ x, y: UNLOGGED_Y, level: null, isLogged: false, isToday });
        }
    });

    // Month divider ticks and labels
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    let labels = '';
    for (let m = 0; m < 12; m++) {
        const dayOfYear = new Date(viewYear, m, 1);
        const startOfYear = new Date(viewYear, 0, 1);
        const dayIdx = Math.floor((dayOfYear - startOfYear) / 86400000);
        const x = (dayIdx / (yearDates.length - 1)) * 296;
        if (m > 0) {
            labels += `<line x1="${x}" y1="88" x2="${x}" y2="95" stroke="rgba(26,58,74,0.2)" stroke-width="0.5"/>`;
        }
        const labelX = m < 11
            ? x + ((new Date(viewYear, m + 1, 1) - dayOfYear) / 86400000 / (yearDates.length - 1) * 296) / 2
            : x + ((yearDates.length - 1 - dayIdx) / (yearDates.length - 1) * 296) / 2;
        labels += `<text x="${labelX}" y="103" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.45)">${monthLabels[m]}</text>`;
    }

    // For year view, only show dots for today, not every day (too dense)
    const yearPoints = points.map(p => ({ ...p, _skipDot: !p.isToday }));

    // Build SVG - for year view we use only logged points for the wave, but show today
    const loggedPts = points.filter(p => p.isLogged);
    const todayPt = points.find(p => p.isToday);

    // Build a simplified SVG for year view (no individual dots except today)
    const gradId = 'yrGrad' + Math.random().toString(36).slice(2, 8);
    const fillGradId = 'yrFill' + Math.random().toString(36).slice(2, 8);

    let lineGradStops = '';
    if (loggedPts.length > 0) {
        const range = 296;
        loggedPts.forEach(p => {
            const offset = (p.x / range * 100).toFixed(1);
            lineGradStops += `<stop offset="${offset}%" stop-color="${WAVE_COLORS[p.level] || WAVE_COLORS[3]}"/>`;
        });
    }

    let gridLines = `<line x1="0" y1="${BASELINE_Y}" x2="296" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.15)" stroke-width="0.75"/>`;
    gridLines += `<line x1="0" y1="62" x2="296" y2="62" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;
    gridLines += `<line x1="0" y1="32" x2="296" y2="32" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;

    let wavePath = '';
    let fillPath = '';
    if (loggedPts.length >= 2) {
        const pathD = smoothPath(loggedPts);
        wavePath = `<path d="${pathD}" fill="none" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round"/>`;
        const fillD = pathD + ` L${loggedPts[loggedPts.length - 1].x} ${BASELINE_Y} L${loggedPts[0].x} ${BASELINE_Y} Z`;
        fillPath = `<path d="${fillD}" fill="url(#${fillGradId})" opacity="0.6"/>`;
    }

    let todayMarker = '';
    let todayDot = '';
    if (todayPt) {
        todayMarker = `<line x1="${todayPt.x}" y1="5" x2="${todayPt.x}" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.2)" stroke-width="0.75" stroke-dasharray="3 2"/>`;
        todayMarker += `<text x="${todayPt.x}" y="5" text-anchor="middle" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.55)">today</text>`;
        if (todayPt.isLogged) {
            const color = WAVE_COLORS[todayPt.level] || WAVE_COLORS[3];
            todayDot = `<circle cx="${todayPt.x}" cy="${todayPt.y}" r="5" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
            todayDot += `<circle cx="${todayPt.x}" cy="${todayPt.y}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`;
        } else {
            todayDot = `<circle cx="${todayPt.x}" cy="${UNLOGGED_Y}" r="3.5" fill="none" stroke="rgba(26,58,74,0.25)" stroke-width="1.5" stroke-dasharray="2 2"/>`;
        }
    }

    // Fade mask after today
    let fadeStyle = '';
    if (todayPt && viewYear === currentYear) {
        const fadeMaskId = 'fadeMask' + Math.random().toString(36).slice(2, 8);
        const todayPct = (todayPt.x / 296 * 100).toFixed(1);
        const fadeStart = Math.min(parseFloat(todayPct) + 2, 100).toFixed(1);
        fadeStyle = `
            <defs>
                <mask id="${fadeMaskId}">
                    <rect width="296" height="105" fill="white"/>
                    <rect x="${todayPt.x + 5}" y="0" width="${296 - todayPt.x}" height="105" fill="black" opacity="0.7"/>
                </mask>
            </defs>`;
        // Wrap wave and fill in a masked group
        const maskedContent = `<g mask="url(#${fadeMaskId})">${fillPath}${wavePath}</g>`;
        fillPath = '';
        wavePath = maskedContent;
    }

    const svg = `<svg viewBox="0 0 296 105" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;min-height:220px;">
        <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
                ${lineGradStops || '<stop offset="0%" stop-color="rgba(80,195,215,0.9)"/>'}
            </linearGradient>
            <linearGradient id="${fillGradId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(80,210,150,0.45)"/>
                <stop offset="100%" stop-color="rgba(80,210,150,0)"/>
            </linearGradient>
        </defs>
        ${fadeStyle}
        ${gridLines}
        ${fillPath}
        ${wavePath}
        ${todayMarker}
        ${todayDot}
        ${labels}
    </svg>`;

    grid.innerHTML = svg;
    return loggedCount;
}

// --- Month View ---

function renderMonthGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'month-grid';

    const viewYear = getViewYear();
    const viewMonth = getViewMonth();
    const today = getTodayDateString();
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    const xStart = 8;
    const xEnd = 288;
    const xRange = xEnd - xStart;

    let loggedCount = 0;
    const points = [];

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(viewYear, viewMonth, day);
        const dateString = formatDateString(date);
        const moodEntry = moods[dateString];
        const isToday = dateString === today;
        const x = xStart + ((day - 1) / (totalDays - 1)) * xRange;

        if (moodEntry) {
            loggedCount++;
            points.push({ x, y: LEVEL_TO_Y[moodEntry.level], level: moodEntry.level, isLogged: true, isToday });
        } else {
            points.push({ x, y: UNLOGGED_Y, level: null, isLogged: false, isToday });
        }
    }

    // Day labels: show 1, 5, 10, 15, 20, 25, last day
    const showDays = [1, 5, 10, 15, 20, 25, totalDays];
    let labels = '';
    showDays.forEach(day => {
        if (day > totalDays) return;
        const x = xStart + ((day - 1) / (totalDays - 1)) * xRange;
        const dateString = formatDateString(new Date(viewYear, viewMonth, day));
        const isToday = dateString === today;
        const fill = isToday ? 'rgba(26,58,74,0.8)' : 'rgba(26,58,74,0.4)';
        const weight = isToday ? 'font-weight="600"' : '';
        labels += `<text x="${x}" y="107" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="${fill}" ${weight}>${day}</text>`;
    });

    const svg = buildWaveSVG(points, 296, 110, labels);
    grid.innerHTML = svg;
    return loggedCount;
}

// --- Week View ---

function renderWeekGrid(moods, language) {
    const grid = document.getElementById('yearGrid');
    if (!grid) return 0;

    grid.innerHTML = '';
    grid.className = 'week-grid';

    const weekStart = getViewWeekStart();
    const today = getTodayDateString();

    const xStart = 42;
    const xEnd = 270;
    const spacing = (xEnd - xStart) / 6;

    let loggedCount = 0;
    const points = [];
    const dayLabels = [];

    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
    const locale = localeMap[language] || 'en-US';

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = formatDateString(date);
        const moodEntry = moods[dateString];
        const isToday = dateString === today;
        const x = xStart + i * spacing;

        if (moodEntry) {
            loggedCount++;
            points.push({ x, y: LEVEL_TO_Y[moodEntry.level], level: moodEntry.level, isLogged: true, isToday });
        } else {
            points.push({ x, y: UNLOGGED_Y, level: null, isLogged: false, isToday });
        }

        const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
        const dayNum = date.getDate();
        dayLabels.push({ x, label: `${dayName} ${dayNum}`, isToday });
    }

    // Y-axis mood labels
    let axisLabels = '';
    axisLabels += `<text x="4" y="14" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">Fantastic</text>`;
    axisLabels += `<text x="4" y="53" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">Okay</text>`;
    axisLabels += `<text x="4" y="83" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">Down</text>`;

    // Day labels below
    let labels = axisLabels;
    dayLabels.forEach(({ x, label, isToday }) => {
        const fill = isToday ? 'rgba(26,58,74,0.8)' : 'rgba(26,58,74,0.4)';
        const weight = isToday ? 'font-weight="600"' : '';
        labels += `<text x="${x}" y="107" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="${fill}" ${weight}>${label}</text>`;
        if (isToday) {
            labels += `<circle cx="${x}" cy="112" r="1.5" fill="rgba(26,58,74,0.5)"/>`;
        }
    });

    const svg = buildWaveSVG(points, 296, 115, labels);
    grid.innerHTML = svg;
    return loggedCount;
}

/**
 * Gets localized month names
 */
function getMonthNames(language) {
    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
    const locale = localeMap[language] || 'en-US';
    const months = [];
    for (let i = 0; i < 12; i++) {
        months.push(new Date(2000, i, 1).toLocaleDateString(locale, { month: 'short' }));
    }
    return months;
}

/**
 * Updates the display header based on view mode
 */
function updateDisplayHeader(loggedCount, data) {
    const yearDisplay = document.getElementById('yearDisplay');
    const language = data.settings.language;
    const calendarView = data.settings.calendarView;

    if (yearDisplay) {
        if (calendarView === 'year') {
            yearDisplay.textContent = getViewYear();
        } else if (calendarView === 'month') {
            const monthNames = getMonthNames(language);
            yearDisplay.textContent = `${monthNames[getViewMonth()]} ${getViewYear()}`;
        } else if (calendarView === 'week') {
            const weekStart = getViewWeekStart();
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            yearDisplay.textContent = `${formatDateForDisplay(weekStart, language)} - ${formatDateForDisplay(weekEnd, language)}`;
        }
    }

    const loggedDays = document.getElementById('loggedDays');
    const counterMode = data.settings.counterMode;

    if (loggedDays) {
        if (counterMode === 'streak') {
            const streak = calculateStreakFromMoods(data.moods);
            const heatLevel = getStreakHeatLevel(streak);
            const streakText = t('dayStreak', language);

            loggedDays.innerHTML = `
                <span class="days-count">${streak}</span>
                <span class="days-word">${streakText}</span>
            `;
            loggedDays.title = `${streak} ${t('dayStreak', language)}`;
            loggedDays.className = 'streak-badge';
            loggedDays.dataset.heatLevel = heatLevel;
        } else {
            const daysText = t('daysLogged', language).split(' ');
            loggedDays.innerHTML = `
                <span class="days-count">${loggedCount}</span>
                <span class="days-word">${daysText[0]}</span>
            `;
            loggedDays.title = t('daysLogged', language);
            loggedDays.className = '';
            delete loggedDays.dataset.heatLevel;
        }
    }
}

/**
 * Full grid load - renders grid based on view mode and updates stats.
 */
export async function loadYearGrid(data = null) {
    if (!data) {
        data = await loadData();
    }

    const calendarView = data.settings.calendarView;
    const language = data.settings.language;
    const moods = data.moods;
    const grid = document.getElementById('yearGrid');
    let loggedCount = 0;

    if (grid) {
        grid.className = 'year-grid';
    }

    if (calendarView === 'month') {
        loggedCount = renderMonthGrid(moods, language);
    } else if (calendarView === 'week') {
        loggedCount = renderWeekGrid(moods, language);
    } else {
        loggedCount = renderYearGrid(moods, language);
    }

    updateDisplayHeader(loggedCount, data);
}
