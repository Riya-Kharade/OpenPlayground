
const app = new PIXI.Application({
    view: document.getElementById('pixi-bg'),
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x060810,
    antialias: true,
    resolution: 1,
});

window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

// Grid lines
const grid = new PIXI.Graphics();
app.stage.addChild(grid);

function drawGrid() {
    grid.clear();
    grid.lineStyle(1, 0x1a2540, 0.5);
    const W = app.screen.width, H = app.screen.height;
    const sz = 50;
    for (let x = 0; x < W; x += sz) { grid.moveTo(x, 0); grid.lineTo(x, H); }
    for (let y = 0; y < H; y += sz) { grid.moveTo(0, y); grid.lineTo(W, y); }
}
drawGrid();
window.addEventListener('resize', drawGrid);

// Floating particles
const particles = [];
const particleContainer = new PIXI.Container();
app.stage.addChild(particleContainer);

const COLORS = [0x00f5ff, 0xff2d6b, 0xa855f7, 0x00ff9d];

for (let i = 0; i < 60; i++) {
    const g = new PIXI.Graphics();
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    g.beginFill(c, 0.6);
    g.drawCircle(0, 0, Math.random() * 1.5 + 0.5);
    g.endFill();
    g.x = Math.random() * window.innerWidth;
    g.y = Math.random() * window.innerHeight;
    const speed = Math.random() * 0.4 + 0.1;
    const angle = Math.random() * Math.PI * 2;
    g._vx = Math.cos(angle) * speed;
    g._vy = Math.sin(angle) * speed;
    g._alpha = Math.random();
    g._alphaDir = Math.random() > 0.5 ? 1 : -1;
    particleContainer.addChild(g);
    particles.push(g);
}

// Mouse ripple effect
const ripples = [];
const rippleContainer = new PIXI.Container();
app.stage.addChild(rippleContainer);

let pixiMouseX = 0, pixiMouseY = 0;

function spawnRipple(x, y, color = 0x00f5ff) {
    const r = new PIXI.Graphics();
    rippleContainer.addChild(r);
    ripples.push({ g: r, x, y, radius: 5, maxRadius: 60, alpha: 0.8, color });
}

app.ticker.add(() => {
    const W = app.screen.width, H = app.screen.height;

    particles.forEach(p => {
        p.x += p._vx; p.y += p._vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        p._alpha += p._alphaDir * 0.005;
        if (p._alpha > 1 || p._alpha < 0) p._alphaDir *= -1;
        p.alpha = p._alpha * 0.6;
    });

    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2;
        r.alpha -= 0.025;
        r.g.clear();
        if (r.alpha <= 0) {
            rippleContainer.removeChild(r.g);
            ripples.splice(i, 1);
        } else {
            r.g.lineStyle(1.5, r.color, r.alpha);
            r.g.drawCircle(r.x, r.y, r.radius);
        }
    }
});

// ─── Keyboard Layout ─────────────────────────────────────────────────
const rows = [
    [
        { l: 'Esc', c: 'Escape' }, { l: 'F1', c: 'F1' }, { l: 'F2', c: 'F2' }, { l: 'F3', c: 'F3' }, { l: 'F4', c: 'F4' },
        { l: 'F5', c: 'F5' }, { l: 'F6', c: 'F6' }, { l: 'F7', c: 'F7' }, { l: 'F8', c: 'F8' },
        { l: 'F9', c: 'F9' }, { l: 'F10', c: 'F10' }, { l: 'F11', c: 'F11' }, { l: 'F12', c: 'F12' }
    ],
    [
        { l: '`', c: 'Backquote' }, { l: '1', c: 'Digit1' }, { l: '2', c: 'Digit2' }, { l: '3', c: 'Digit3' },
        { l: '4', c: 'Digit4' }, { l: '5', c: 'Digit5' }, { l: '6', c: 'Digit6' }, { l: '7', c: 'Digit7' },
        { l: '8', c: 'Digit8' }, { l: '9', c: 'Digit9' }, { l: '0', c: 'Digit0' }, { l: '-', c: 'Minus' },
        { l: '=', c: 'Equal' }, { l: '⌫ Back', c: 'Backspace', w: 'wide-2' }
    ],
    [
        { l: 'Tab', c: 'Tab', w: 'wide-15' }, { l: 'Q', c: 'KeyQ' }, { l: 'W', c: 'KeyW' }, { l: 'E', c: 'KeyE' },
        { l: 'R', c: 'KeyR' }, { l: 'T', c: 'KeyT' }, { l: 'Y', c: 'KeyY' }, { l: 'U', c: 'KeyU' }, { l: 'I', c: 'KeyI' },
        { l: 'O', c: 'KeyO' }, { l: 'P', c: 'KeyP' }, { l: '[', c: 'BracketLeft' }, { l: ']', c: 'BracketRight' },
        { l: '\\', c: 'Backslash', w: 'wide-15' }
    ],
    [
        { l: 'Caps', c: 'CapsLock', w: 'wide-2' }, { l: 'A', c: 'KeyA' }, { l: 'S', c: 'KeyS' }, { l: 'D', c: 'KeyD' },
        { l: 'F', c: 'KeyF' }, { l: 'G', c: 'KeyG' }, { l: 'H', c: 'KeyH' }, { l: 'J', c: 'KeyJ' }, { l: 'K', c: 'KeyK' },
        { l: 'L', c: 'KeyL' }, { l: ';', c: 'Semicolon' }, { l: "'", c: 'Quote' },
        { l: 'Enter', c: 'Enter', w: 'wide-25' }
    ],
    [
        { l: '⇧ Shift', c: 'ShiftLeft', w: 'wide-3' }, { l: 'Z', c: 'KeyZ' }, { l: 'X', c: 'KeyX' },
        { l: 'C', c: 'KeyC' }, { l: 'V', c: 'KeyV' }, { l: 'B', c: 'KeyB' }, { l: 'N', c: 'KeyN' }, { l: 'M', c: 'KeyM' },
        { l: ',', c: 'Comma' }, { l: '.', c: 'Period' }, { l: '/', c: 'Slash' },
        { l: '⇧ Shift', c: 'ShiftRight', w: 'wide-3' }
    ],
    [
        { l: 'Ctrl', c: 'ControlLeft', w: 'wide-15' }, { l: '⊞', c: 'MetaLeft', w: 'wide-15' },
        { l: 'Alt', c: 'AltLeft', w: 'wide-15' }, { l: 'SPACE', c: 'Space', w: 'wide-65' },
        { l: 'Alt', c: 'AltRight', w: 'wide-15' }, { l: 'Ctrl', c: 'ControlRight', w: 'wide-15' },
        { l: '◀', c: 'ArrowLeft' }, { l: '▲', c: 'ArrowUp' }, { l: '▼', c: 'ArrowDown' }, { l: '▶', c: 'ArrowRight' }
    ]
];

const kb = document.getElementById('keyboard');
const keyEls = {}; // code -> element

rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'kb-row';
    row.forEach(k => {
        const el = document.createElement('div');
        el.className = 'key' + (k.w ? ' ' + k.w : '');
        el.textContent = k.l;
        el.dataset.code = k.c;
        keyEls[k.c] = el;
        rowDiv.appendChild(el);
    });
    kb.appendChild(rowDiv);
});

// ─── State ────────────────────────────────────────────────────────────
const activeKeys = new Set();
let stats = { keys: 0, clicks: 0, scrolls: 0, maxCombo: 0, events: 0 };
let totalClicks = 0;
const historyItems = [];
const MAX_HISTORY = 40;

const MOUSE_NAMES = ['Left', 'Middle', 'Right', 'Back', 'Forward'];
const MOUSE_COLORS = [0x00f5ff, 0xa855f7, 0xff2d6b, 0xffcc00, 0x00ff9d];

// ─── UI Helpers ───────────────────────────────────────────────────────
function now() {
    const d = new Date();
    return d.toLocaleTimeString('en', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
}

function updateActiveDisplay() {
    const disp = document.getElementById('activeKeysDisplay');
    if (activeKeys.size === 0) {
        disp.innerHTML = '<span class="no-keys">Press any key...</span>';
    } else {
        disp.innerHTML = [...activeKeys].map(k => `<span class="active-badge">${k}</span>`).join('');
    }
    if (activeKeys.size > stats.maxCombo) {
        stats.maxCombo = activeKeys.size;
        document.getElementById('stat-combo').textContent = stats.maxCombo;
    }
}

function addHistory(type, key) {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `<span class="h-time">${now()}</span><span class="h-type ${type}">[${type.toUpperCase()}]</span><span class="h-key">${key}</span>`;
    const list = document.getElementById('historyList');
    list.insertBefore(el, list.firstChild);
    historyItems.push(el);
    if (historyItems.length > MAX_HISTORY) {
        const old = historyItems.shift();
        if (old.parentNode) old.parentNode.removeChild(old);
    }
    stats.events++;
    document.getElementById('stat-events').textContent = stats.events;
}

function clearHistory() {
    document.getElementById('historyList').innerHTML = '';
    historyItems.length = 0;
}

function flashFeed(id) {
    const el = document.getElementById(id);
    el.classList.add('active');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('active'), 300);
}

// ─── Keyboard Events ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    e.preventDefault();
    const label = e.key.length === 1 ? e.key.toUpperCase() : e.key;

    if (!activeKeys.has(label)) {
        activeKeys.add(label);
        stats.keys++;
        document.getElementById('stat-keys').textContent = stats.keys;
        addHistory('kbd', `${label} (${e.code})`);
    }

    if (keyEls[e.code]) keyEls[e.code].classList.add('active');

    document.getElementById('lastKey').textContent = label;
    document.getElementById('lastCode').textContent = e.code;
    flashFeed('lastKey');

    updateActiveDisplay();
    spawnRipple(pixiMouseX, pixiMouseY, 0x00f5ff);
});

document.addEventListener('keyup', e => {
    const label = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    activeKeys.delete(label);
    if (keyEls[e.code]) keyEls[e.code].classList.remove('active');
    updateActiveDisplay();
});

// ─── Mouse Events ─────────────────────────────────────────────────────
const mbEls = [document.getElementById('mb-left'), document.getElementById('mb-right'), document.getElementById('mb-mid')];
const msBtns = [document.getElementById('ms-left'), document.getElementById('ms-right'), document.getElementById('ms-mid')];
const classes = ['', 'right', 'mid'];

document.addEventListener('mousemove', e => {
    pixiMouseX = e.clientX; pixiMouseY = e.clientY;
    document.getElementById('coords').textContent = `${e.clientX}, ${e.clientY}`;
    document.getElementById('ms-x').textContent = e.clientX;
    document.getElementById('ms-y').textContent = e.clientY;
});

document.addEventListener('mousedown', e => {
    const btn = e.button;
    const name = MOUSE_NAMES[btn] || `Btn${btn}`;
    if (btn <= 2) {
        mbEls[btn].classList.add('active', classes[btn]);
        msBtns[btn].textContent = 'DOWN';
    }
    document.getElementById('lastMouse').textContent = `${name} ↓`;
    flashFeed('lastMouse');
    totalClicks++;
    stats.clicks++;
    document.getElementById('ms-clicks').textContent = totalClicks;
    document.getElementById('stat-clicks').textContent = stats.clicks;
    addHistory('mouse', `${name} Button Down`);
    spawnRipple(e.clientX, e.clientY, MOUSE_COLORS[btn] || 0xffffff);
});

document.addEventListener('mouseup', e => {
    const btn = e.button;
    const name = MOUSE_NAMES[btn] || `Btn${btn}`;
    if (btn <= 2) {
        mbEls[btn].classList.remove('active', classes[btn]);
        msBtns[btn].textContent = 'UP';
    }
    document.getElementById('lastMouse').textContent = `${name} ↑`;
});

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('wheel', e => {
    const dir = e.deltaY > 0 ? '▼ DOWN' : '▲ UP';
    document.getElementById('scrollVal').textContent = dir;
    document.getElementById('ms-scroll').textContent = dir;
    flashFeed('scrollVal');
    stats.scrolls++;
    document.getElementById('stat-scrolls').textContent = stats.scrolls;
    addHistory('scroll', `Scroll ${dir} (Δ${Math.round(e.deltaY)})`);
    spawnRipple(pixiMouseX, pixiMouseY, 0xa855f7);
});
