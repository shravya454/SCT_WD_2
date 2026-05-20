// Stopwatch state
let isRunning    = false;
let startTime    = 0;
let elapsedTime  = 0;   // ms accumulated before the last pause
let lapStartTime = 0;   // elapsedTime value when current lap began
let animFrame    = null;
let laps         = [];

const RING_CIRCUMFERENCE = 816.814;  // 2 * PI * 130 (radius of SVG ring)
const LAP_CYCLE_MS       = 60000;    // ring completes one full loop every 60 seconds

// DOM elements
const timeDisplay   = document.getElementById('timeDisplay');
const timeMs        = document.getElementById('timeMs');
const timeLabel     = document.getElementById('timeLabel');
const startStopBtn  = document.getElementById('startStopBtn');
const startStopIcon = document.getElementById('startStopIcon');
const startStopText = document.getElementById('startStopText');
const lapBtn        = document.getElementById('lapBtn');
const resetBtn      = document.getElementById('resetBtn');
const lapList       = document.getElementById('lapList');
const lapEmpty      = document.getElementById('lapEmpty');
const lapCount      = document.getElementById('lapCount');
const ringFill      = document.getElementById('ringFill');
const timerSection  = document.querySelector('.timer-section');

// Start or pause the stopwatch
function startStop() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    startTime = performance.now();
    isRunning = true;
    animFrame = requestAnimationFrame(tick);

    startStopIcon.textContent = '■';
    startStopText.textContent = 'STOP';
    startStopBtn.classList.add('stop-mode');
    timeLabel.textContent = 'RUNNING';
    timeLabel.className   = 'time-label running';
    timerSection.classList.add('running');
    lapBtn.disabled   = false;
    resetBtn.disabled = true;
    ringFill.classList.remove('paused');
}

function pauseTimer() {
    elapsedTime += performance.now() - startTime;
    cancelAnimationFrame(animFrame);
    isRunning = false;

    startStopIcon.textContent = '▶';
    startStopText.textContent = 'START';
    startStopBtn.classList.remove('stop-mode');
    timeLabel.textContent = 'PAUSED';
    timeLabel.className   = 'time-label paused';
    timerSection.classList.remove('running');
    lapBtn.disabled   = true;
    resetBtn.disabled = false;
    ringFill.classList.add('paused');
}

function resetTimer() {
    cancelAnimationFrame(animFrame);
    isRunning    = false;
    elapsedTime  = 0;
    lapStartTime = 0;
    laps         = [];

    updateDisplay(0);
    ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE;
    ringFill.classList.remove('paused');

    startStopIcon.textContent = '▶';
    startStopText.textContent = 'START';
    startStopBtn.classList.remove('stop-mode');
    timeLabel.textContent = 'READY';
    timeLabel.className   = 'time-label';
    timerSection.classList.remove('running');
    lapBtn.disabled   = true;
    resetBtn.disabled = true;

    renderLaps();
}

// Record current lap
function recordLap() {
    const total   = elapsedTime + (performance.now() - startTime);
    const lapTime = total - lapStartTime;
    lapStartTime  = total;

    laps.unshift({ lapTime, total });
    renderLaps();

    // Quick flash on the lap button as feedback
    lapBtn.style.borderColor = 'var(--accent)';
    lapBtn.style.color = 'var(--accent)';
    setTimeout(() => {
        lapBtn.style.borderColor = '';
        lapBtn.style.color = '';
    }, 200);
}

// Animation loop — called every frame while running
function tick() {
    const total = elapsedTime + (performance.now() - startTime);
    updateDisplay(total);
    updateRing(total - lapStartTime);
    animFrame = requestAnimationFrame(tick);
}

// Update the time shown on screen
function updateDisplay(ms) {
    const h   = Math.floor(ms / 3600000);
    const m   = Math.floor((ms % 3600000) / 60000);
    const s   = Math.floor((ms % 60000) / 1000);
    const ms3 = Math.floor(ms % 1000);

    timeDisplay.textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    timeMs.textContent      = '.' + pad3(ms3);
}

// Move the SVG ring based on how far into the current lap we are
function updateRing(lapMs) {
    const progress = (lapMs % LAP_CYCLE_MS) / LAP_CYCLE_MS;
    const offset   = RING_CIRCUMFERENCE * (1 - progress);
    ringFill.style.strokeDashoffset = offset;
}

// Draw all lap rows in the right panel
function renderLaps() {
    lapCount.textContent = laps.length === 1 ? '1 LAP' : laps.length + ' LAPS';

    if (laps.length === 0) {
        lapList.innerHTML = '';
        lapList.appendChild(lapEmpty);
        return;
    }

    lapList.innerHTML = '';

    laps.forEach((entry, index) => {
        const lapNumber = laps.length - index;

        const row = document.createElement('div');
        row.className = 'lap-row';

        // Lap number
        const numEl = document.createElement('span');
        numEl.className   = 'lap-num';
        numEl.textContent = '#' + pad2(lapNumber);

        // Lap time
        const lapTimeEl = document.createElement('span');
        lapTimeEl.className   = 'lap-time';
        lapTimeEl.textContent = formatLapTime(entry.lapTime);

        // Total time
        const totalTimeEl = document.createElement('span');
        totalTimeEl.className   = 'lap-total';
        totalTimeEl.textContent = formatLapTime(entry.total);

        row.appendChild(numEl);
        row.appendChild(lapTimeEl);
        row.appendChild(totalTimeEl);
        lapList.appendChild(row);
    });
}

// Format milliseconds as MM:SS.cs (centiseconds)
function formatLapTime(ms) {
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return pad2(m) + ':' + pad2(s) + '.' + pad2(cs);
}

// Pad a number to 2 digits
function pad2(n) {
    return String(Math.floor(n)).padStart(2, '0');
}

// Pad a number to 3 digits
function pad3(n) {
    return String(Math.floor(n)).padStart(3, '0');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        startStop();
    } else if (e.code === 'KeyL' && isRunning) {
        recordLap();
    } else if (e.code === 'KeyR' && !isRunning && elapsedTime > 0) {
        resetTimer();
    }
});
