/**
 * Grid renderer module - SVG wave graph calendar views (year/month/week)
 */

import { loadData, calculateStreakFromMoods, getStreakHeatLevel } from './storage.js';
import { generateYearDates, getTodayDateString, formatDateForDisplay, formatDateString } from './dateUtils.js';
import { t, getCachedLanguage } from './localization.js';
import { getViewYear, getActualYear, getViewMonth, getViewWeekStart } from './state.js';

const LEVEL_TO_Y = {
    1: 25,
    2: 75,
    3: 125,
    4: 175,
    5: 215,
};
const BASELINE_Y = 240;
const UNLOGGED_Y = 240;

const WAVE_COLORS = {
    1: 'rgba(100, 225, 140, 0.95)',
    2: 'rgba(80, 205, 185, 0.92)',
    3: 'rgba(80, 195, 215, 0.90)',
    4: 'rgba(120, 165, 215, 0.88)',
    5: 'rgba(150, 155, 210, 0.85)',
};

// Maps a (possibly fractional, e.g. weekly-averaged) level to a y coordinate
function levelToY(level) {
    const lo = Math.min(5, Math.max(1, Math.floor(level)));
    const hi = Math.min(5, Math.max(1, Math.ceil(level)));
    return LEVEL_TO_Y[lo] + (LEVEL_TO_Y[hi] - LEVEL_TO_Y[lo]) * (level - lo);
}

// Monotone cubic interpolation (no overshoot, no flat plateaus at each point)
function smoothPath(points) {
    const n = points.length;
    if (n === 0) return '';
    if (n === 1) return `M${points[0].x} ${points[0].y}`;
    let d = `M${points[0].x} ${points[0].y}`;
    if (n === 2) {
        return d + ` L${points[1].x} ${points[1].y}`;
    }

    const dx = [];
    const slope = [];
    for (let i = 0; i < n - 1; i++) {
        dx[i] = points[i + 1].x - points[i].x;
        slope[i] = (points[i + 1].y - points[i].y) / dx[i];
    }

    const m = [slope[0]];
    for (let i = 1; i < n - 1; i++) {
        if (slope[i - 1] * slope[i] <= 0) {
            m[i] = 0;
        } else {
            const w1 = 2 * dx[i] + dx[i - 1];
            const w2 = dx[i] + 2 * dx[i - 1];
            m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
        }
    }
    m[n - 1] = slope[n - 2];

    for (let i = 0; i < n - 1; i++) {
        const h = dx[i];
        const cp1x = (points[i].x + h / 3).toFixed(2);
        const cp1y = (points[i].y + m[i] * h / 3).toFixed(2);
        const cp2x = (points[i + 1].x - h / 3).toFixed(2);
        const cp2y = (points[i + 1].y - m[i + 1] * h / 3).toFixed(2);
        d += ` C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return d;
}

function filledPath(points, baselineY) {
    if (points.length === 0) return '';
    const linePath = smoothPath(points);
    if (points.length === 1) {
        return `${linePath} L${points[0].x} ${baselineY} Z`;
    }
    return `${linePath} L${points[points.length - 1].x} ${baselineY} L${points[0].x} ${baselineY} Z`;
}

// Animates the graph as one continuous left-to-right pass: solid segments
// draw in, dashed gap connectors and dots fade in when the "pen" reaches them.
function animateWavePaths(grid) {
    const strokes = [...grid.querySelectorAll('[data-ax1]')];
    if (strokes.length === 0) return;

    const xs = strokes.flatMap(el => [parseFloat(el.dataset.ax1), parseFloat(el.dataset.ax2)]);
    const minX = Math.min(...xs);
    const span = (Math.max(...xs) - minX) || 1;
    const TOTAL = 0.9;
    const timeAt = x => ((x - minX) / span) * TOTAL;

    strokes.forEach(el => {
        const delay = timeAt(parseFloat(el.dataset.ax1));
        const dur = Math.max(0.15, timeAt(parseFloat(el.dataset.ax2)) - delay);
        if (el.classList.contains('wave-path') && typeof el.getTotalLength === 'function') {
            const length = el.getTotalLength();
            el.style.strokeDasharray = length;
            el.style.strokeDashoffset = length;
            requestAnimationFrame(() => {
                el.style.transition = `stroke-dashoffset ${dur.toFixed(2)}s linear ${delay.toFixed(2)}s`;
                el.style.strokeDashoffset = '0';
            });
        } else {
            // Dashed connectors and area fills fade in (a dashoffset draw would
            // destroy the dash pattern)
            el.style.opacity = '0';
            requestAnimationFrame(() => {
                el.style.transition = `opacity ${dur.toFixed(2)}s ease ${delay.toFixed(2)}s`;
                el.style.opacity = '1';
            });
        }
    });

    grid.querySelectorAll('.mood-dot, .today-halo').forEach(dot => {
        const cx = parseFloat(dot.getAttribute('cx'));
        const delay = Number.isFinite(cx) ? Math.max(0, timeAt(cx) - 0.05) : 0;
        dot.style.opacity = '0';
        requestAnimationFrame(() => {
            dot.style.transition = `opacity 0.25s ease ${delay.toFixed(2)}s`;
            dot.style.opacity = '1';
        });
    });
}

function buildSegments(points) {
    const segments = [];
    let currentSegment = [];

    points.forEach(point => {
        if (point.isLogged) {
            currentSegment.push(point);
        } else {
            if (currentSegment.length > 0) {
                segments.push(currentSegment);
                currentSegment = [];
            }
        }
    });

    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }

    return segments;
}

// Builds fills, dashed gap connectors, solid lines, and dots for a set of
// points. Connectors only bridge the gap between segments (never overlap the
// solid line) and render underneath it.
function buildSegmentPaths(points, gradId, fillGradId, { dots = true } = {}) {
    const segments = buildSegments(points);
    let fills = '';
    let connectors = '';
    let lines = '';
    let dotsSVG = '';

    segments.forEach(segment => {
        if (segment.length >= 2) {
            const ax1 = segment[0].x.toFixed(1);
            const ax2 = segment[segment.length - 1].x.toFixed(1);
            fills += `<path d="${filledPath(segment, BASELINE_Y)}" class="wave-fill" data-ax1="${ax1}" data-ax2="${ax2}" fill="url(#${fillGradId})" opacity="0.4"/>`;
            lines += `<path d="${smoothPath(segment)}" class="wave-path" data-ax1="${ax1}" data-ax2="${ax2}" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round" fill="none"/>`;
        }
    });

    for (let i = 0; i < segments.length - 1; i++) {
        const a = segments[i][segments[i].length - 1];
        const b = segments[i + 1][0];
        connectors += `<path d="M${a.x.toFixed(1)} ${a.y} L${b.x.toFixed(1)} ${b.y}" class="gap-path" data-ax1="${a.x.toFixed(1)}" data-ax2="${b.x.toFixed(1)}" stroke="rgba(26,58,74,0.22)" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>`;
    }

    if (dots) {
        points.filter(p => p.isLogged).forEach(point => {
            const color = WAVE_COLORS[point.level] || WAVE_COLORS[3];
            if (point.isToday) {
                dotsSVG += `<circle cx="${point.x}" cy="${point.y}" r="5" class="today-halo" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
            }
            dotsSVG += `<circle cx="${point.x}" cy="${point.y}" r="3.5" class="mood-dot" fill="${color}" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/>`;
        });
    }

    return fills + connectors + lines + dotsSVG;
}

// todayX overrides the today-marker position for aggregated views, where the
// bucket point containing today sits at the bucket's center, not today's day
function buildWaveSVG(points, width, height, labels, todayX = null) {
    const gradId = 'waveGrad' + Math.random().toString(36).slice(2, 8);
    const fillGradId = 'fillGrad' + Math.random().toString(36).slice(2, 8);

    const todayPoint = points.find(p => p.isToday);
    const loggedPoints = points.filter(p => p.isLogged);

    // Build line gradient stops from all logged points
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
    gridLines += `<line x1="0" y1="160" x2="${width}" y2="160" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;
    gridLines += `<line x1="0" y1="80" x2="${width}" y2="80" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;

    const segmentPaths = buildSegmentPaths(points, gradId, fillGradId);

    // Today marker
    let todayMarker = '';
    const markerX = todayX !== null ? todayX : (todayPoint ? todayPoint.x : null);
    if (markerX !== null) {
        const todayLabel = t('today', getCachedLanguage());
        todayMarker = `<line x1="${markerX}" y1="12" x2="${markerX}" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.2)" stroke-width="0.75" stroke-dasharray="3 2"/>`;
        todayMarker += `<text x="${markerX}" y="10" text-anchor="middle" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.55)">${todayLabel}</text>`;
    }

    const labelsSVG = labels || '';

    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;max-width:100%;overflow:hidden;">
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
        ${segmentPaths}
        ${todayMarker}
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

    const xForIdx = idx => (idx / (yearDates.length - 1)) * 296;

    let loggedCount = 0;
    let todayIdx = -1;
    yearDates.forEach(({ dateString }, idx) => {
        if (moods[dateString]) loggedCount++;
        if (dateString === today && viewYear === currentYear) todayIdx = idx;
    });

    // At year scale, 365 daily points read as noise — aggregate each 7-day
    // chunk into one averaged point so the line stays a wave.
    const points = [];
    for (let start = 0; start < yearDates.length; start += 7) {
        const chunk = yearDates.slice(start, start + 7);
        let sum = 0;
        let count = 0;
        chunk.forEach(({ dateString }) => {
            const moodEntry = moods[dateString];
            if (moodEntry) {
                sum += moodEntry.level;
                count++;
            }
        });
        const x = xForIdx(start + (chunk.length - 1) / 2);
        if (count > 0) {
            const avg = sum / count;
            points.push({ x, y: levelToY(avg), level: Math.round(avg), isLogged: true, isToday: false });
        } else {
            points.push({ x, y: UNLOGGED_Y, level: null, isLogged: false, isToday: false });
        }
    }

    // Month divider ticks, labels, and click hit areas
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const startOfYear = new Date(viewYear, 0, 1);
    const now = new Date();
    let labels = '';
    for (let m = 0; m < 12; m++) {
        const dayOfYear = new Date(viewYear, m, 1);
        const dayIdx = Math.floor((dayOfYear - startOfYear) / 86400000);
        const x = (dayIdx / (yearDates.length - 1)) * 296;
        if (m > 0) {
            labels += `<line x1="${x}" y1="228" x2="${x}" y2="238" stroke="rgba(26,58,74,0.2)" stroke-width="0.5"/>`;
        }
        const labelX = m < 11
            ? x + ((new Date(viewYear, m + 1, 1) - dayOfYear) / 86400000 / (yearDates.length - 1) * 296) / 2
            : x + ((yearDates.length - 1 - dayIdx) / (yearDates.length - 1) * 296) / 2;
        labels += `<text x="${labelX}" y="253" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.45)">${monthLabels[m]}</text>`;

        if (viewYear < currentYear || m <= now.getMonth()) {
            const endIdx = Math.min(
                Math.floor((new Date(viewYear, m + 1, 0) - startOfYear) / 86400000),
                yearDates.length - 1
            );
            const x2 = (endIdx / (yearDates.length - 1)) * 296;
            labels += `<rect x="${x.toFixed(1)}" y="0" width="${(x2 - x).toFixed(1)}" height="${BASELINE_Y}" fill="transparent" class="month-hit" data-month="${m}" data-year="${viewYear}"/>`;
        }
    }

    const loggedPts = points.filter(p => p.isLogged);
    const todayX = todayIdx >= 0 ? xForIdx(todayIdx) : null;
    // Today's dot sits on the aggregated point of the current week
    const todayWeekPt = todayIdx >= 0 ? points[Math.floor(todayIdx / 7)] : null;

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
    gridLines += `<line x1="0" y1="160" x2="296" y2="160" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;
    gridLines += `<line x1="0" y1="80" x2="296" y2="80" stroke="rgba(26,58,74,0.08)" stroke-width="0.5" stroke-dasharray="4 4"/>`;

    // Weekly points get no per-point dots — only today's week is marked
    let segmentPaths = buildSegmentPaths(points, gradId, fillGradId, { dots: false });

    // Today marker and dot (year view shows today dot)
    let todayMarker = '';
    let todayDot = '';
    if (todayX !== null) {
        const todayLabel = t('today', language);
        todayMarker = `<line x1="${todayX}" y1="12" x2="${todayX}" y2="${BASELINE_Y}" stroke="rgba(26,58,74,0.2)" stroke-width="0.75" stroke-dasharray="3 2"/>`;
        todayMarker += `<text x="${todayX}" y="10" text-anchor="middle" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.55)">${todayLabel}</text>`;
        if (todayWeekPt && todayWeekPt.isLogged) {
            const color = WAVE_COLORS[todayWeekPt.level] || WAVE_COLORS[3];
            todayDot = `<circle cx="${todayWeekPt.x}" cy="${todayWeekPt.y}" r="5" class="today-halo" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
            todayDot += `<circle cx="${todayWeekPt.x}" cy="${todayWeekPt.y}" r="3.5" class="mood-dot" fill="${color}" stroke="white" stroke-width="1.5"/>`;
        }
    }

    // Fade mask after today
    let fadeStyle = '';
    if (todayX !== null) {
        const fadeMaskId = 'fadeMask' + Math.random().toString(36).slice(2, 8);
        fadeStyle = `
            <defs>
                <mask id="${fadeMaskId}">
                    <rect width="296" height="260" fill="white"/>
                    <rect x="${todayX + 5}" y="0" width="${296 - todayX}" height="260" fill="black" opacity="0.7"/>
                </mask>
            </defs>`;
        segmentPaths = `<g mask="url(#${fadeMaskId})">${segmentPaths}</g>`;
    }

    const svg = `<svg viewBox="0 0 296 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;max-width:100%;overflow:hidden;">
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
        ${segmentPaths}
        ${todayMarker}
        ${todayDot}
        ${labels}
    </svg>`;

    grid.innerHTML = svg;
    return loggedCount;
}

// --- Month View ---

function renderMonthGrid(moods) {
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

    const xForDay = day => xStart + ((day - 1) / (totalDays - 1)) * xRange;

    // Like the year view's weekly averaging, aggregate 3-day buckets into
    // single points so day-to-day swings read as a wave, not spikes
    const BUCKET_DAYS = 3;
    let loggedCount = 0;
    let todayX = null;
    const points = [];

    for (let start = 1; start <= totalDays; start += BUCKET_DAYS) {
        const end = Math.min(start + BUCKET_DAYS - 1, totalDays);
        let sum = 0;
        let count = 0;
        let hasToday = false;

        for (let day = start; day <= end; day++) {
            const dateString = formatDateString(new Date(viewYear, viewMonth, day));
            if (dateString === today) {
                hasToday = true;
                todayX = xForDay(day);
            }
            const moodEntry = moods[dateString];
            if (moodEntry) {
                loggedCount++;
                sum += moodEntry.level;
                count++;
            }
        }

        const x = xForDay((start + end) / 2);
        if (count > 0) {
            const avg = sum / count;
            points.push({ x, y: levelToY(avg), level: Math.round(avg), isLogged: true, isToday: hasToday });
        } else {
            points.push({ x, y: UNLOGGED_Y, level: null, isLogged: false, isToday: hasToday });
        }
    }

    // Day labels: show 1, 5, 10, 15, 20, 25, last day
    const showDays = [1, 5, 10, 15, 20, 25, totalDays];
    let labels = '';
    showDays.forEach(day => {
        if (day > totalDays) return;
        const x = xForDay(day);
        const dateString = formatDateString(new Date(viewYear, viewMonth, day));
        const isToday = dateString === today;
        const fill = isToday ? 'rgba(26,58,74,0.8)' : 'rgba(26,58,74,0.4)';
        const weight = isToday ? 'font-weight="600"' : '';
        labels += `<text x="${x}" y="253" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="${fill}" ${weight}>${day}</text>`;
    });

    const svg = buildWaveSVG(points, 296, 260, labels, todayX);
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

    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR', de: 'de-DE', sv: 'sv-SE' };
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
    axisLabels += `<text x="4" y="30" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">${t('fantastic', language)}</text>`;
    axisLabels += `<text x="4" y="128" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">${t('okay', language)}</text>`;
    axisLabels += `<text x="4" y="210" font-size="7" font-family="Fredoka, sans-serif" fill="rgba(26,58,74,0.3)">${t('down', language)}</text>`;

    // Day labels below
    let labels = axisLabels;
    dayLabels.forEach(({ x, label, isToday }) => {
        const fill = isToday ? 'rgba(26,58,74,0.8)' : 'rgba(26,58,74,0.4)';
        const weight = isToday ? 'font-weight="600"' : '';
        labels += `<text x="${x}" y="253" text-anchor="middle" font-size="8" font-family="Fredoka, sans-serif" fill="${fill}" ${weight}>${label}</text>`;
        if (isToday) {
            labels += `<circle cx="${x}" cy="258" r="1.5" fill="rgba(26,58,74,0.5)"/>`;
        }
    });

    const svg = buildWaveSVG(points, 296, 260, labels);
    grid.innerHTML = svg;
    return loggedCount;
}

/**
 * Gets localized month names
 */
function getMonthNames(language) {
    const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR', de: 'de-DE', sv: 'sv-SE' };
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
    let loggedCount;

    if (grid) {
        grid.className = 'year-grid';
    }

    if (calendarView === 'month') {
        loggedCount = renderMonthGrid(moods);
    } else if (calendarView === 'week') {
        loggedCount = renderWeekGrid(moods, language);
    } else {
        loggedCount = renderYearGrid(moods, language);
    }

    updateDisplayHeader(loggedCount, data);

    if (grid) {
        animateWavePaths(grid);
        if (calendarView === 'year') {
            grid.querySelectorAll('.month-hit').forEach(rect => {
                rect.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('miaura:yearMonthClick', {
                        detail: {
                            year: parseInt(rect.dataset.year),
                            month: parseInt(rect.dataset.month)
                        }
                    }));
                });
            });
        }
    }
}
