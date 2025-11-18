let selectedColor = null;
let currentYear = new Date().getFullYear();
let viewYear = currentYear; // Track which year we're viewing
let currentLanguage = localStorage.getItem('language') || 'en';
let isTransitioning = false;


const translations = {
    en: {
        title: 'Hello, how are you feeling today?',
        yearTitle: 'Your Year',
        daysLogged: 'days logged',
        back: 'Back',
        currentStreak: 'day streak',
        currentStreakPlural: 'day streak',
        longestStreak: 'longest',
        streakDays: 'days'
    },
    fr: {
        title: 'Bonjour, comment allez-vous aujourd\'hui?',
        yearTitle: 'Votre Année',
        daysLogged: 'jours enregistrés',
        back: 'Retour',
        currentStreak: 'jour de suite',
        currentStreakPlural: 'jours de suite',
        longestStreak: 'record',
        streakDays: 'jours'
    },
    pt: {
        title: 'Olá, como você está se sentindo hoje?',
        yearTitle: 'Seu Ano',
        daysLogged: 'dias registrados',
        back: 'Voltar',
        currentStreak: 'dia de sequência',
        currentStreakPlural: 'dias de sequência',
        longestStreak: 'recorde',
        streakDays: 'dias'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    viewYear = currentYear; // Initialize to current year
    checkTodayLogged();
    updateLanguage();
    setupEventListeners();
    loadYearGrid();
    updateStreakDisplay();
});

function updateLanguage() {
    const lang = currentLanguage;
    const navBtn = document.getElementById('navBtn');
    const page1 = document.getElementById('page1');
    
    document.getElementById('mainTitle').textContent = translations[lang].title;
    document.getElementById('yearTitle').textContent = translations[lang].yearTitle;
    const langLabels = { en: 'FR', fr: 'PT', pt: 'EN' };
    document.getElementById('langToggle').textContent = langLabels[lang];
    
    // Update nav button icon based on which page is active
    if (page1.classList.contains('active')) {
        navBtn.textContent = '📅';
    } else {
        navBtn.textContent = '←';
    }
    
    // Update mood label if there's a selected mood
    if (selectedColor) {
        const selectedOption = document.querySelector(`[data-color="${selectedColor}"]`);
        if (selectedOption) {
            const labelKey = `label${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
            const label = selectedOption.dataset[labelKey];
            document.getElementById('colorLabel').textContent = label;
        }
    }
    
    const loggedDaysEl = document.getElementById('loggedDays');
    if (loggedDaysEl.textContent) {
        const count = loggedDaysEl.textContent.match(/\d+/);
        if (count) {
            loggedDaysEl.textContent = `${count[0]} ${translations[lang].daysLogged}`;
        }
    }
    
    // Reload year grid to update tooltips
    if (!page1.classList.contains('active')) {
        loadYearGrid();
    }

    // Update streak display for language change
    updateStreakDisplay();
}

function toggleLanguage() {
    const supportedLanguages = ['en', 'fr', 'pt'];
    const currentIndex = supportedLanguages.indexOf(currentLanguage);
    currentLanguage = supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
}

function setupEventListeners() {
    const signalBars = document.getElementById('signalBars');
    const colorLabel = document.getElementById('colorLabel');
    const navBtn = document.getElementById('navBtn');
    let hoveredLabel = null;
    
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);

    document.getElementById('prevYear').addEventListener('click', () => {
        viewYear--;
        loadYearGrid();
    });

        document.getElementById('nextYear').addEventListener('click', () => {
        viewYear++;
        loadYearGrid();
    });

    navBtn.addEventListener('click', () => {
        const page1 = document.getElementById('page1');
        const page2 = document.getElementById('page2');
        
        if (page1.classList.contains('active')) {
            // On page 1, go to calendar
            showPage('page2');
        } else {
            // On page 2, go back
            showPage('page1');
        }
    });

    document.querySelectorAll('.color-option').forEach((option) => {
        option.addEventListener('mouseenter', () => {
            const level = option.dataset.level;
            const labelKey = `label${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}`;
            const label = option.dataset[labelKey];
            hoveredLabel = label;
            signalBars.className = 'signal-bars level-' + level;
            colorLabel.textContent = label;
            colorLabel.classList.add('visible');
        });
        
        option.addEventListener('mouseleave', () => {
            hoveredLabel = null;
            // If nothing is selected, hide the label
            if (!selectedColor) {
                colorLabel.classList.remove('visible');
            } else {
                // Restore selected mood's label
                const selectedOption = document.querySelector(`[data-color="${selectedColor}"]`);
                if (selectedOption) {
                    const level = selectedOption.dataset.level;
                    const labelKey = `label${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}`;
                    const label = selectedOption.dataset[labelKey];
                    signalBars.className = 'signal-bars level-' + level;
                    colorLabel.textContent = label;
                }
            }
        });
        
        option.addEventListener('click', () => {
            selectedColor = option.dataset.color;
            const labelKey = `label${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}`;
            const label = option.dataset[labelKey];
            colorLabel.textContent = label;
            colorLabel.classList.add('visible');
            saveMood();
            setTimeout(() => {
                showPage('page2');
            }, 300);
        });
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        showPage('page1');
    });
}

function showPage(pageId) {
    const navBtn = document.getElementById('navBtn');
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Update button icon based on page
    if (pageId === 'page1') {
        navBtn.textContent = '📅';
    } else {
        navBtn.textContent = '←';
        loadYearGrid();
    }
}

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function saveMood() {
    if (!selectedColor) return;

    const today = getTodayDateString();
    const moodData = getMoodData();

    moodData[today] = {
        color: selectedColor,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('moodTracker', JSON.stringify(moodData));
    updateStreakDisplay();
}

function getMoodData() {
    const data = localStorage.getItem('moodTracker');
    return data ? JSON.parse(data) : {};
}

function getStreakData() {
    const data = localStorage.getItem('streakData');
    return data ? JSON.parse(data) : {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckDate: null
    };
}

function saveStreakData(streakData) {
    localStorage.setItem('streakData', JSON.stringify(streakData));
}

function calculateStreaks() {
    const moodData = getMoodData();
    const dates = Object.keys(moodData).sort();

    if (dates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateString(yesterday);

    // Calculate longest streak by checking consecutive dates
    for (let i = 0; i < dates.length; i++) {
        if (i > 0) {
            const prevDate = new Date(dates[i - 1]);
            const currDate = new Date(dates[i]);
            const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (dayDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak - must include today or yesterday
    const lastLoggedDate = dates[dates.length - 1];
    if (lastLoggedDate === today || lastLoggedDate === yesterdayStr) {
        currentStreak = 1;
        for (let i = dates.length - 2; i >= 0; i--) {
            const prevDate = new Date(dates[i]);
            const currDate = new Date(dates[i + 1]);
            const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (dayDiff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    return { currentStreak, longestStreak };
}

function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStreakLevel(streak) {
    if (streak >= 100) return 6;
    if (streak >= 30) return 5;
    if (streak >= 14) return 4;
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    if (streak >= 1) return 1;
    return 0;
}

function updateStreakDisplay() {
    const streaks = calculateStreaks();
    const streakData = getStreakData();

    // Update longest streak if current is higher
    if (streaks.longestStreak > streakData.longestStreak) {
        streakData.longestStreak = streaks.longestStreak;
        saveStreakData(streakData);
    }

    const currentStreakEl = document.getElementById('currentStreak');
    const longestStreakEl = document.getElementById('longestStreak');
    const currentStreakEl2 = document.getElementById('currentStreak2');

    const streakLevel = getStreakLevel(streaks.currentStreak);

    // Update Page 1 streak display
    if (currentStreakEl) {
        currentStreakEl.innerHTML = `<span class="streak-emoji">🔥</span><span class="streak-number">${streaks.currentStreak}</span>`;
        currentStreakEl.className = 'streak-display';
        if (streaks.currentStreak > 0) {
            currentStreakEl.classList.add('streak-level-' + streakLevel);
        }
    }

    if (longestStreakEl) {
        const longestText = translations[currentLanguage].longestStreak;
        longestStreakEl.textContent = `${longestText}: ${Math.max(streaks.longestStreak, streakData.longestStreak)}`;
    }

    // Update Page 2 compact streak display
    if (currentStreakEl2) {
        currentStreakEl2.innerHTML = `<span class="streak-emoji">🔥</span><span class="streak-number">${streaks.currentStreak}</span>`;
        currentStreakEl2.className = 'streak-display-compact';
        if (streaks.currentStreak > 0) {
            currentStreakEl2.classList.add('streak-level-' + streakLevel);
        }
    }
}

// Color migration map - converts old hex colors to new rgba colors
function migrateColor(oldColor) {
    const colorMap = {
        '#90ee90': 'rgba(144, 238, 144, 0.9)',      // Fantastic
        '#6eb86e': 'rgba(120, 220, 180, 0.75)',     // Fine
        '#528f62': 'rgba(100, 200, 210, 0.6)',      // Okay
        '#3d5d55': 'rgba(140, 180, 220, 0.45)',     // Low
        '#252525': 'rgba(160, 180, 200, 0.3)'       // Down
    };
    
    return colorMap[oldColor] || oldColor;
}

function loadYearGrid() {
    const grid = document.getElementById('yearGrid');
    grid.innerHTML = '';
    
    const moodData = getMoodData();
    const startDate = new Date(viewYear, 0, 1);
    const endDate = new Date(viewYear, 11, 31);
    const today = getTodayDateString();
    
    // Mood labels for tooltip
    const moodLabels = {
        'rgba(144, 238, 144, 0.9)': { en: 'Fantastic', fr: 'Fantastique', pt: 'Fantástico' },
        'rgba(120, 220, 180, 0.75)': { en: 'Fine', fr: 'Bien', pt: 'Bem' },
        'rgba(100, 200, 210, 0.6)': { en: 'Okay', fr: 'Correct', pt: 'Ok' },
        'rgba(140, 180, 220, 0.45)': { en: 'Low', fr: 'Bas', pt: 'Baixo' },
        'rgba(160, 180, 200, 0.3)': { en: 'Down', fr: 'Abattu', pt: 'Deprimido' }
    };
    
    let loggedCount = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        // Only mark today's cell if viewing current year
        if (dateStr === today && viewYear === currentYear) {
            cell.classList.add('today');
        }
        
        if (moodData[dateStr]) {
            const color = migrateColor(moodData[dateStr].color);
            cell.style.background = color;
            cell.classList.add('logged');
            
            const date = new Date(year, parseInt(month) - 1, parseInt(day));
            const localeMap = { en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };
            const formattedDate = date.toLocaleDateString(localeMap[currentLanguage],
                { month: 'short', day: 'numeric' });
            const mood = moodLabels[color] ? moodLabels[color][currentLanguage] : '';
            cell.setAttribute('data-tooltip', `${formattedDate} • ${mood}`);
            
            loggedCount++;
        }
        
        grid.appendChild(cell);
    }

    document.getElementById('yearDisplay').textContent = viewYear; // Show viewYear
    document.getElementById('loggedDays').textContent = `${loggedCount} ${translations[currentLanguage].daysLogged}`;
}

function checkTodayLogged() {
    const today = getTodayDateString(); // Changed from toISOString()
    const moodData = getMoodData();
    const colorLabel = document.getElementById('colorLabel');
    const signalBars = document.getElementById('signalBars');
    
    if (moodData[today]) {
        // Today is logged - show that mood
        const todayData = moodData[today];
        selectedColor = migrateColor(todayData.color);
        
        document.querySelectorAll('.color-option').forEach((option) => {
            const optionColor = option.dataset.color;
            if (optionColor === selectedColor) {
                const level = option.dataset.level;
                const labelKey = `label${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}`;
                const label = option.dataset[labelKey];
                signalBars.className = 'signal-bars level-' + level;

                colorLabel.textContent = label;
                colorLabel.classList.add('visible');
            }
        });
    } else {
        // Not logged yet - default to "Okay" (level 3)
        signalBars.className = 'signal-bars level-3';
        selectedColor = 'rgba(100, 200, 210, 0.6)';

        const defaultLabels = { en: 'Okay', fr: 'Correct', pt: 'Ok' };
        colorLabel.textContent = defaultLabels[currentLanguage];
        colorLabel.classList.add('visible');
    }
}