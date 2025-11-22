// Neon Geometry Dash - Expanded for True Geometry Dash Modes (Cube & Ship)
// --- Configuration ---
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    PLAYER_SIZE: 30,
    SCROLL_SPEED: 7,
    SHIP_THRUST: -1.7,
    SHIP_GRAVITY: 0.15,
    NEON_COLORS: {
        block: '#32f8ff',
        player: '#36e200',
        spike: '#fffa32',
        portal: '#ff32d2',
        saw: '#ff7b00',
        ground: '#a100ff',
        background: '#1A1844',
        ship: '#00d4ff',
    }
};

// --- Game State ---
let canvas, ctx;
let gameState = {
    isPlaying: false,
    currentLevel: 1,
};

let player = {
    x: 120,
    y: 0,
    velocityY: 0,
    rotation: 0,
    isJumping: false,
    mode: 'cube', // cube or ship
    iconColor: '#36e200',
};
let obstacles = [];
let portals = [];
let backgroundDecor = [];
let particles = [];
let distance = 0;
let levelLength = 4000;

// --- Audio ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playSound(f, d, t = 'sine') { const o = audioContext.createOscillator(), g = audioContext.createGain(); o.connect(g); g.connect(audioContext.destination); o.frequency.value = f; o.type = t; g.gain.setValueAtTime(0.2, audioContext.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + d); o.start(audioContext.currentTime); o.stop(audioContext.currentTime + d); }
function playJumpSound() { playSound(600, 0.12, 'triangle'); }
function playDeathSound() { playSound(80, 0.33, 'sawtooth'); }
function playPortalSound() { playSound(1200, 0.08, 'square'); }
function playShipThrust() { playSound(220, 0.06, 'triangle'); }
function playVictorySound() { playSound(950, 0.07, 'sine'); setTimeout(() => playSound(400, 0.07, 'sine'), 80); }

// --- Init ---
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', userInputDown);
    canvas.addEventListener('mouseup', userInputUp);
    canvas.addEventListener('touchstart', userInputDown);
    canvas.addEventListener('touchend', userInputUp);
    document.addEventListener('keydown', (e) => { if (e.code === 'Space' && gameState.isPlaying) userInputDown(); });
    document.addEventListener('keyup', (e) => { if (e.code === 'Space') userInputUp(); });
}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;
}

function startLevel(level) {
    gameState.currentLevel = level;
    gameState.isPlaying = true;
    distance = 0;
    obstacles = [];
    portals = [];
    particles = [];
    backgroundDecor = [];
    player.x = 120;
    player.y = canvas.height - 110;
    player.velocityY = 0;
    player.rotation = 0;
    player.mode = 'cube';
    player.iconColor = CONFIG.NEON_COLORS.player;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('levelInfo').textContent = `Level ${level}`;
    generateLevel(level);
    gameLoop(performance.now());
}

// --- Level Generation ---
function generateLevel(level) {
    obstacles = [];
    portals = [];
    levelLength = 4000 + (level * 600);
    let x = canvas.width;
    let toggled = false;
    while (x < levelLength) {
        // Alternate between cube and ship using portals
        if ((x > canvas.width + 1000 && !toggled) || (x > canvas.width + 2500 && toggled === false && level >= 2)) {
            portals.push({ x, y: canvas.height - 170, type: toggled ? 'cube' : 'ship', color: toggled ? CONFIG.NEON_COLORS.player : CONFIG.NEON_COLORS.ship });
            toggled = !toggled;
            x += 150;
            continue;
        }
        // Obstacles for cube mode or ship mode
        if (!toggled) {
            if (Math.random() < 0.25) obstacles.push({ x, y: canvas.height - 110, w: 38, h: 38, type: 'cube' });
            else obstacles.push({ x, y: canvas.height - 110, w: 30, h: 45, type: 'spike' });
        } else {
            // Ship mode: lines/walls/gaps
            if (Math.random() < 0.22) obstacles.push({ x, y: Math.random() * (canvas.height - 220) + 50, w: 19, h: 90, type: 'ship-wall' });
        }
        x += 100 + Math.random() * 90;
    }
    // Decorative background
    for (let i = 0; i < 25; i++) {
        backgroundDecor.push({ x: Math.random() * canvas.width * 2, y: Math.random() * (canvas.height - 180), r: 14 + Math.random() * 24, c: i % 2 === 0 ? CONFIG.NEON_COLORS.block : '#2b69fc' });
    }
}
// --- Input for Cube and Ship Modes ---
let inputActive = false;
function userInputDown() {
    inputActive = true;
    if (!gameState.isPlaying) return;
    if (player.mode === 'cube') {
        if (!player.isJumping) {
            player.velocityY = CONFIG.JUMP_FORCE;
            player.isJumping = true;
            playJumpSound();
            createParticles(player.x, player.y + CONFIG.PLAYER_SIZE, 7, player.iconColor);
        }
    }
    // For ship, thrust is handled in update()
}
function userInputUp() { inputActive = false; }

function createParticles(x, y, count, color) { for (let i = 0; i < count; i++) { particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 1, color }); } }

// --- Game Loop ---
let lastTime = 0;
function gameLoop(now) {
    if (!gameState.isPlaying) return;
    update((now - lastTime) / 16.5);
    draw();
    lastTime = now;
    requestAnimationFrame(gameLoop);
}
function update(timeFactor) {
    // Cube mode
    if (player.mode === 'cube') {
        player.velocityY += CONFIG.GRAVITY * timeFactor;
        player.y += player.velocityY * timeFactor;
        player.rotation += (player.isJumping ? 12 : 4) * timeFactor;
        if (player.y > canvas.height - 110) { player.y = canvas.height - 110; player.velocityY = 0; player.isJumping = false; player.rotation = 0; }
    } else if (player.mode === 'ship') {
        // Ship mode
        if (inputActive) { player.velocityY += CONFIG.SHIP_THRUST * timeFactor; playShipThrust(); }
        else { player.velocityY += CONFIG.SHIP_GRAVITY * timeFactor; }
        // Damp, clamp
        player.velocityY = Math.max(-7, Math.min(6, player.velocityY));
        player.y += player.velocityY * timeFactor * 2;
        player.rotation = player.velocityY * 5;
        if (player.y < 0) { player.y = 0; player.velocityY = 0; }
        if (player.y > canvas.height - 130) { player.y = canvas.height - 130; player.velocityY = 0; }
    }
    // Obstacles, portals, decor move
    distance += CONFIG.SCROLL_SPEED * timeFactor;
    for (let obs of obstacles) obs.x -= CONFIG.SCROLL_SPEED * timeFactor;
    for (let p of portals) p.x -= CONFIG.SCROLL_SPEED * timeFactor;
    for (let d of backgroundDecor) d.x -= (CONFIG.SCROLL_SPEED / 3) * timeFactor;
    obstacles = obstacles.filter(o => o.x > -o.w);
    portals = portals.filter(p => p.x > -50);
    backgroundDecor = backgroundDecor.filter(d => d.x > -d.r);
    for (let prt of particles) { prt.x += prt.vx * timeFactor; prt.y += prt.vy * timeFactor; prt.life -= 0.025 * timeFactor; }
    particles = particles.filter(p => p.life > 0);
    // Collision with portals
    for (let portal of portals) {
        if (checkCollisionPortal(player, portal)) {
            if ((portal.type === 'ship' && player.mode !== 'ship') || (portal.type === 'cube' && player.mode !== 'cube')) {
                player.mode = portal.type;
                player.iconColor = portal.color;
                playPortalSound();
            }
        }
    }
    // Collision with obstacles
    for (let obs of obstacles) { if (checkCollision(player, obs)) { gameOver(); return; } }
    // End/victory
    if (distance >= levelLength) { victory(); return; }
    // Progress bar
    const progress = (distance / levelLength) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}
function checkCollision(player, obs) {
    if (obs.type === 'cube') {
        return player.x < obs.x + obs.w && player.x + CONFIG.PLAYER_SIZE > obs.x && player.y < obs.y + obs.h && player.y + CONFIG.PLAYER_SIZE > obs.y;
    } else if (obs.type === 'spike') {
        return player.x < obs.x + obs.w && player.x + CONFIG.PLAYER_SIZE > obs.x && player.y < obs.y + obs.h && player.y + CONFIG.PLAYER_SIZE > obs.y;
    } else if (obs.type === 'ship-wall') {
        return player.x + CONFIG.PLAYER_SIZE > obs.x && player.x < obs.x + obs.w && player.y < obs.y + obs.h && player.y + CONFIG.PLAYER_SIZE > obs.y;
    }
    return false;
}
function checkCollisionPortal(player, portal) {
    return player.x < portal.x + 44 && player.x + CONFIG.PLAYER_SIZE > portal.x && player.y < portal.y + 44 && player.y + CONFIG.PLAYER_SIZE > portal.y;
}

// --- Draw ---
function draw() {
    ctx.fillStyle = CONFIG.NEON_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Background decor
    for (let bd of backgroundDecor) {
        ctx.beginPath(); ctx.arc(bd.x, bd.y, bd.r, 0, Math.PI*2);
        ctx.fillStyle = bd.c;
        ctx.globalAlpha = 0.22; ctx.shadowBlur = 16; ctx.shadowColor = bd.c;
        ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    // Portals
    for (let portal of portals) drawPortal(portal);
    // Obstacles
    for (let obs of obstacles) {
        if (obs.type === 'cube') drawBlock(obs);
        if (obs.type === 'spike') drawSpike(obs);
        if (obs.type === 'ship-wall') drawShipWall(obs);
    }
    // Player
    ctx.save(); ctx.translate(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2); ctx.rotate((player.mode === 'cube' ? player.rotation : player.rotation/1.3) * Math.PI / 180);
    if (player.mode === 'cube') drawPlayerCube(player.iconColor);
    else if (player.mode === 'ship') drawShip(player.iconColor);
    ctx.restore();
    // Particles
    for (let prt of particles) { ctx.globalAlpha = prt.life; ctx.beginPath(); ctx.arc(prt.x, prt.y, 3 + Math.random() * 2, 0, Math.PI*2); ctx.fillStyle = prt.color; ctx.shadowBlur = 18; ctx.shadowColor = prt.color; ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; }
    // Floor
    ctx.fillStyle = CONFIG.NEON_COLORS.ground; ctx.shadowBlur = 18; ctx.shadowColor = CONFIG.NEON_COLORS.ground; ctx.fillRect(0, canvas.height - 100, canvas.width, 100); ctx.shadowBlur = 0;
}
// --- Drawing helpers ---
function drawPlayerCube(color) { ctx.beginPath(); ctx.rect(-CONFIG.PLAYER_SIZE/2, -CONFIG.PLAYER_SIZE/2, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE); ctx.fillStyle = color; ctx.shadowBlur = 36; ctx.shadowColor = color; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); }
function drawBlock(obs) { ctx.save(); ctx.beginPath(); ctx.rect(obs.x, obs.y, obs.w, obs.h); ctx.fillStyle = CONFIG.NEON_COLORS.block; ctx.shadowBlur = 22; ctx.shadowColor = CONFIG.NEON_COLORS.block; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
function drawShip(color) { ctx.save(); ctx.beginPath(); ctx.moveTo(-15, 12); ctx.lineTo(0, -16); ctx.lineTo(15, 12); ctx.lineTo(0, 4); ctx.closePath(); ctx.fillStyle = color; ctx.shadowBlur = 34; ctx.shadowColor = color; ctx.fill(); ctx.lineWidth = 3.6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
function drawSpike(obs) { ctx.save(); ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.h); ctx.lineTo(obs.x + obs.w/2, obs.y); ctx.lineTo(obs.x + obs.w, obs.y + obs.h); ctx.closePath(); ctx.fillStyle = CONFIG.NEON_COLORS.spike; ctx.shadowBlur = 14; ctx.shadowColor = CONFIG.NEON_COLORS.spike; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
function drawShipWall(obs) { ctx.save(); ctx.beginPath(); ctx.rect(obs.x, obs.y, obs.w, obs.h); ctx.fillStyle = CONFIG.NEON_COLORS.ship; ctx.shadowBlur = 14; ctx.shadowColor = CONFIG.NEON_COLORS.ship; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
function drawPortal(portal) { ctx.save(); ctx.beginPath(); ctx.arc(portal.x + 22, portal.y + 22, 22, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke(); ctx.shadowBlur = 32; ctx.shadowColor = portal.color; ctx.beginPath(); ctx.arc(portal.x + 22, portal.y + 22, 16, 0, Math.PI * 2); ctx.strokeStyle = portal.color; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); }

function gameOver() { gameState.isPlaying = false; playDeathSound(); createParticles(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2, 22, '#ff0032'); document.getElementById('gameOver').style.display = 'block'; document.getElementById('gameOverMessage').textContent = `You traveled ${Math.floor(distance)}m`; }
function victory() { gameState.isPlaying = false; playVictorySound(); document.getElementById('victory').style.display = 'block'; document.getElementById('victoryMessage').textContent = `You completed level ${gameState.currentLevel}!`; }
function restartLevel() { startLevel(gameState.currentLevel); }
function nextLevel() { const next = gameState.currentLevel + 1; if (next <= 3) startLevel(next); else backToMenu(); }
function backToMenu() { gameState.isPlaying = false; document.getElementById('menu').style.display = 'flex'; document.getElementById('gameScreen').style.display = 'none'; }
window.addEventListener('load', initGame);
