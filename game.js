// Improved Neon Geometry Dash Clone - Authentic visuals & performance
// --- Configuration ---
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    PLAYER_SIZE: 30,
    SCROLL_SPEED: 7, // Slightly faster, smoother
    NEON_COLORS: {
        block: '#32f8ff',
        player: '#36e200',
        spike: '#fffa32',
        portal: '#ff32d2',
        saw: '#ff7b00',
        background: '#1A1844',
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
    cube: true,
    iconColor: '#36e200'
};
let obstacles = [];
let portals = [];
let backgroundDecor = [];
let particles = [];
let distance = 0;
let levelLength = 4000;

// --- Audio ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playSound(f, d, t = 'sine') {
    const o = audioContext.createOscillator(), g = audioContext.createGain();
    o.connect(g); g.connect(audioContext.destination);
    o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(0.2, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + d);
    o.start(audioContext.currentTime); o.stop(audioContext.currentTime + d);
}
function playJumpSound() { playSound(600, 0.12, 'triangle'); }
function playDeathSound() { playSound(80, 0.33, 'sawtooth'); }
function playPortalSound() { playSound(1200, 0.08, 'square'); }
function playVictorySound() { playSound(950, 0.07, 'sine'); setTimeout(() => playSound(400, 0.07, 'sine'), 80); }

// --- Init ---
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('click', jump);
    document.addEventListener('keydown', (e) => { if (e.code === 'Space' && gameState.isPlaying) jump(); });
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
    player.cube = true;
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
    while (x < levelLength) {
        if (level === 2 && Math.random() < 0.17) {
            portals.push({ x, y: canvas.height - 180, type: 'gravity', color: CONFIG.NEON_COLORS.portal });
            x += 120;
            continue;
        }
        if (level > 1 && Math.random() < 0.18) {
            obstacles.push({ x, y: canvas.height - 95, w: 35, h: 40, type: 'saw' });
        } else if (Math.random() < 0.28) {
            obstacles.push({ x, y: canvas.height - 110, w: 38, h: 38, type: 'cube' });
        } else {
            obstacles.push({ x, y: canvas.height - 110, w: 30, h: 45, type: 'spike' });
        }
        x += 88 + Math.random() * 90;
    }
    // Decorative background
    for (let i = 0; i < 25; i++) {
        backgroundDecor.push({ x: Math.random() * canvas.width * 2, y: Math.random() * (canvas.height - 180), r: 14 + Math.random() * 24, c: i % 2 === 0 ? CONFIG.NEON_COLORS.block : '#2b69fc' });
    }
}

function jump() {
    if (!gameState.isPlaying) return;
    if (!player.isJumping) {
        player.velocityY = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        playJumpSound();
        createParticles(player.x, player.y + CONFIG.PLAYER_SIZE, 7, player.iconColor);
    }
}
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 1, color });
    }
}

// --- Game Loop ---
let lastTime = 0;
function gameLoop(now) {
    if (!gameState.isPlaying) return;
    update((now - lastTime) / 16.5); // Time factor for smooth movement
    draw();
    lastTime = now;
    requestAnimationFrame(gameLoop);
}
function update(timeFactor) {
    // Gravity, physics
    player.velocityY += CONFIG.GRAVITY * timeFactor;
    player.y += player.velocityY * timeFactor;
    player.rotation += (player.isJumping ? 12 : 4) * timeFactor;
    // Ground collision
    if (player.y > canvas.height - 110) {
        player.y = canvas.height - 110;
        player.velocityY = 0;
        player.isJumping = false;
        player.rotation = 0;
    }
    // Obstacles move
    distance += CONFIG.SCROLL_SPEED * timeFactor;
    for (let obs of obstacles) obs.x -= CONFIG.SCROLL_SPEED * timeFactor;
    for (let p of portals) p.x -= CONFIG.SCROLL_SPEED * timeFactor;
    for (let d of backgroundDecor) d.x -= (CONFIG.SCROLL_SPEED / 3) * timeFactor;
    // Remove off-screen
    obstacles = obstacles.filter(o => o.x > -o.w);
    portals = portals.filter(p => p.x > -50);
    backgroundDecor = backgroundDecor.filter(d => d.x > -d.r);
    // Particle update
    for (let prt of particles) {
        prt.x += prt.vx * timeFactor;
        prt.y += prt.vy * timeFactor;
        prt.life -= 0.025 * timeFactor;
    }
    particles = particles.filter(p => p.life > 0);
    // Collision portal
    for (let portal of portals) {
        if (checkCollisionPortal(player, portal)) {
            player.iconColor = portal.color;
            player.cube = !player.cube; // Toggle shape as a simple effect
            playPortalSound();
        }
    }
    // Collision obstacles
    for (let obs of obstacles) {
        if (checkCollision(player, obs)) {
            gameOver();
            return;
        }
    }
    // End/victory
    if (distance >= levelLength) { victory(); return; }
    // Progress bar
    const progress = (distance / levelLength) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}
function checkCollision(player, obs) {
    // Spike = triangle, cube = block, saw = circle
    if (obs.type === 'cube') {
        return player.x < obs.x + obs.w && player.x + CONFIG.PLAYER_SIZE > obs.x && player.y < obs.y + obs.h && player.y + CONFIG.PLAYER_SIZE > obs.y;
    } else if (obs.type === 'spike') {
        // Triangular collision, approximate as block
        return player.x < obs.x + obs.w && player.x + CONFIG.PLAYER_SIZE > obs.x && player.y < obs.y + obs.h && player.y + CONFIG.PLAYER_SIZE > obs.y;
    } else if (obs.type === 'saw') {
        // Circular
        let dx = (player.x + CONFIG.PLAYER_SIZE/2) - (obs.x + obs.w/2);
        let dy = (player.y + CONFIG.PLAYER_SIZE/2) - (obs.y + obs.h/2);
        let d = Math.sqrt(dx*dx + dy*dy);
        return d < (CONFIG.PLAYER_SIZE / 2 + obs.w / 2) - 3;
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
        ctx.beginPath();
        ctx.arc(bd.x, bd.y, bd.r, 0, Math.PI*2);
        ctx.fillStyle = bd.c;
        ctx.globalAlpha = 0.20;
        ctx.shadowBlur = 16;
        ctx.shadowColor = bd.c;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    // Portals
    for (let portal of portals) drawPortal(portal);
    // Obstacles
    for (let obs of obstacles) {
        if (obs.type === 'cube') drawBlock(obs);
        if (obs.type === 'spike') drawSpike(obs);
        if (obs.type === 'saw') drawSaw(obs);
    }
    // Player
    ctx.save();
    ctx.translate(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2);
    ctx.rotate((player.cube ? player.rotation : player.rotation/2) * Math.PI / 180);
    if (player.cube) drawPlayerCube(player.iconColor);
    else drawPlayerBall(player.iconColor);
    ctx.restore();
    // Particles
    for (let prt of particles) {
        ctx.globalAlpha = prt.life;
        ctx.beginPath();
        ctx.arc(prt.x, prt.y, 3 + Math.random() * 2, 0, Math.PI*2);
        ctx.fillStyle = prt.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = prt.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    // Floor
    ctx.fillStyle = '#a100ff';
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#a100ff';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.shadowBlur = 0;
}
// --- Drawing helpers ---
function drawPlayerCube(color) {
    ctx.beginPath();
    ctx.moveTo(-CONFIG.PLAYER_SIZE/2, -CONFIG.PLAYER_SIZE/2);
    ctx.lineTo(CONFIG.PLAYER_SIZE/2, -CONFIG.PLAYER_SIZE/2);
    ctx.lineTo(CONFIG.PLAYER_SIZE/2, CONFIG.PLAYER_SIZE/2);
    ctx.lineTo(-CONFIG.PLAYER_SIZE/2, CONFIG.PLAYER_SIZE/2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 36;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}
function drawPlayerBall(color) {
    ctx.beginPath(); ctx.arc(0, 0, CONFIG.PLAYER_SIZE/2, 0, Math.PI*2);
    ctx.fillStyle = color; ctx.shadowBlur = 36; ctx.shadowColor = color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff'; ctx.stroke();
}
function drawBlock(obs) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y);
    ctx.lineTo(obs.x + obs.w, obs.y);
    ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.lineTo(obs.x, obs.y + obs.h);
    ctx.closePath();
    ctx.fillStyle = CONFIG.NEON_COLORS.block;
    ctx.shadowBlur = 22;
    ctx.shadowColor = CONFIG.NEON_COLORS.block;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
}
function drawSpike(obs) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y + obs.h);
    ctx.lineTo(obs.x + obs.w/2, obs.y);
    ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.closePath();
    ctx.fillStyle = CONFIG.NEON_COLORS.spike;
    ctx.shadowBlur = 14;
    ctx.shadowColor = CONFIG.NEON_COLORS.spike;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
}
function drawSaw(obs) {
    ctx.save();
    ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI*2);
    ctx.fillStyle = CONFIG.NEON_COLORS.saw;
    ctx.shadowBlur = 22;
    ctx.shadowColor = CONFIG.NEON_COLORS.saw;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    // Saw teeth
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        let rx = Math.cos(a) * obs.w/2.1, ry = Math.sin(a) * obs.w/2.1;
        ctx.beginPath(); ctx.moveTo(obs.x+obs.w/2,obs.y+obs.h/2);
        ctx.lineTo(obs.x+obs.w/2+rx,obs.y+obs.h/2+ry);
        ctx.strokeStyle = '#fffa32'; ctx.stroke();
    }
    ctx.restore();
}
function drawPortal(portal) {
    ctx.save();
    ctx.beginPath(); ctx.arc(portal.x + 22, portal.y + 22, 22, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
    ctx.shadowBlur = 32; ctx.shadowColor = portal.color;
    ctx.beginPath(); ctx.arc(portal.x + 22, portal.y + 22, 16, 0, Math.PI * 2);
    ctx.strokeStyle = portal.color; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
}

function gameOver() {
    gameState.isPlaying = false;
    playDeathSound();
    createParticles(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2, 22, '#ff0032');
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('gameOverMessage').textContent = `You traveled ${Math.floor(distance)}m`;
}
function victory() {
    gameState.isPlaying = false;
    playVictorySound();
    document.getElementById('victory').style.display = 'block';
    document.getElementById('victoryMessage').textContent = `You completed level ${gameState.currentLevel}!`;
}
function restartLevel() { startLevel(gameState.currentLevel); }
function nextLevel() { const next = gameState.currentLevel + 1; if (next <= 3) startLevel(next); else backToMenu(); }
function backToMenu() { gameState.isPlaying = false; document.getElementById('menu').style.display = 'flex'; document.getElementById('gameScreen').style.display = 'none'; }
window.addEventListener('load', initGame);
