// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    PLAYER_SIZE: 30,
    OBSTACLE_WIDTH: 30,
    GROUND_HEIGHT: 50,
    SCROLL_SPEED: 5,
    NEON_COLORS: {
        player: '#00ffff',
        obstacle: '#ff0055',
        ground: '#ff00ff',
        spike: '#ffff00',
        platform: '#00ff88'
    }
};

// Game State
let canvas, ctx;
let gameState = {
    isPlaying: false,
    currentLevel: 1,
    score: 0,
    highScore: 0
};

let player = {
    x: 100,
    y: 0,
    velocityY: 0,
    rotation: 0,
    isJumping: false,
    trail: []
};

let obstacles = [];
let particles = [];
let distance = 0;
let levelLength = 3000;

// Audio Context for Sound Effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playJumpSound() {
    playSound(440, 0.1, 'square');
}

function playDeathSound() {
    playSound(150, 0.3, 'sawtooth');
}

function playVictorySound() {
    playSound(523.25, 0.1, 'sine');
    setTimeout(() => playSound(659.25, 0.1, 'sine'), 100);
    setTimeout(() => playSound(783.99, 0.2, 'sine'), 200);
}

// Initialize Game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Input handlers
    canvas.addEventListener('click', jump);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.isPlaying) {
            e.preventDefault();
            jump();
        }
    });
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
    particles = [];
    
    player.x = 100;
    player.y = canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.PLAYER_SIZE;
    player.velocityY = 0;
    player.rotation = 0;
    player.trail = [];
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('levelInfo').textContent = `Level ${level}`;
    
    generateLevel(level);
    gameLoop();
}

function generateLevel(level) {
    obstacles = [];
    levelLength = 3000 + (level * 500);
    
    let x = canvas.width;
    const patterns = {
        1: () => generateBasicPattern(x),
        2: () => generateIntermediatePattern(x),
        3: () => generateAdvancedPattern(x)
    };
    
    while (x < levelLength) {
        const pattern = patterns[level] || patterns[1];
        x = pattern();
        x += 200 + Math.random() * 200;
    }
}

function generateBasicPattern(startX) {
    const type = Math.random() > 0.5 ? 'spike' : 'block';
    obstacles.push({
        x: startX,
        y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH,
        width: CONFIG.OBSTACLE_WIDTH,
        height: CONFIG.OBSTACLE_WIDTH,
        type: type
    });
    return startX;
}

function generateIntermediatePattern(startX) {
    const patterns = ['double', 'gap', 'high'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (pattern === 'double') {
        for (let i = 0; i < 2; i++) {
            obstacles.push({
                x: startX + (i * 60),
                y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH,
                width: CONFIG.OBSTACLE_WIDTH,
                height: CONFIG.OBSTACLE_WIDTH,
                type: 'spike'
            });
        }
    } else if (pattern === 'gap') {
        obstacles.push({
            x: startX,
            y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH * 2,
            width: CONFIG.OBSTACLE_WIDTH,
            height: CONFIG.OBSTACLE_WIDTH,
            type: 'block'
        });
    } else {
        obstacles.push({
            x: startX,
            y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH * 3,
            width: CONFIG.OBSTACLE_WIDTH * 3,
            height: CONFIG.OBSTACLE_WIDTH,
            type: 'platform'
        });
    }
    return startX + 60;
}

function generateAdvancedPattern(startX) {
    const patterns = ['stairs', 'tunnel', 'wave'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (pattern === 'stairs') {
        for (let i = 0; i < 3; i++) {
            obstacles.push({
                x: startX + (i * 50),
                y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH * (i + 1),
                width: CONFIG.OBSTACLE_WIDTH,
                height: CONFIG.OBSTACLE_WIDTH,
                type: 'block'
            });
        }
    } else if (pattern === 'tunnel') {
        obstacles.push({
            x: startX,
            y: 0,
            width: CONFIG.OBSTACLE_WIDTH,
            height: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH * 4,
            type: 'spike'
        });
        obstacles.push({
            x: startX,
            y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH,
            width: CONFIG.OBSTACLE_WIDTH,
            height: CONFIG.OBSTACLE_WIDTH,
            type: 'spike'
        });
    } else {
        for (let i = 0; i < 4; i++) {
            obstacles.push({
                x: startX + (i * 60),
                y: canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.OBSTACLE_WIDTH - Math.sin(i) * 50,
                width: CONFIG.OBSTACLE_WIDTH,
                height: CONFIG.OBSTACLE_WIDTH,
                type: 'spike'
            });
        }
    }
    return startX + 200;
}

function jump() {
    if (!gameState.isPlaying) return;
    
    if (!player.isJumping) {
        player.velocityY = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        playJumpSound();
        createParticles(player.x, player.y + CONFIG.PLAYER_SIZE, 5);
    }
}

function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: CONFIG.NEON_COLORS.player
        });
    }
}

function gameLoop() {
    if (!gameState.isPlaying) return;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update player physics
    player.velocityY += CONFIG.GRAVITY;
    player.y += player.velocityY;
    player.rotation += 5;
    
    // Ground collision
    const groundY = canvas.height - CONFIG.GROUND_HEIGHT - CONFIG.PLAYER_SIZE;
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
        player.rotation = 0;
    }
    
    // Update trail
    player.trail.push({x: player.x, y: player.y});
    if (player.trail.length > 10) player.trail.shift();
    
    // Update obstacles
    distance += CONFIG.SCROLL_SPEED;
    for (let obstacle of obstacles) {
        obstacle.x -= CONFIG.SCROLL_SPEED;
    }
    
    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.x > -obs.width);
    
    // Update particles
    for (let particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
    }
    particles = particles.filter(p => p.life > 0);
    
    // Collision detection
    for (let obstacle of obstacles) {
        if (checkCollision(player, obstacle)) {
            gameOver();
            return;
        }
    }
    
    // Check victory
    if (distance >= levelLength) {
        victory();
        return;
    }
    
    // Update progress bar
    const progress = (distance / levelLength) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

function checkCollision(player, obstacle) {
    return player.x < obstacle.x + obstacle.width &&
           player.x + CONFIG.PLAYER_SIZE > obstacle.x &&
           player.y < obstacle.y + obstacle.height &&
           player.y + CONFIG.PLAYER_SIZE > obstacle.y;
}

function draw() {
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    drawGrid();
    
    // Draw player trail
    ctx.strokeStyle = CONFIG.NEON_COLORS.player;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.NEON_COLORS.player;
    ctx.beginPath();
    for (let i = 0; i < player.trail.length; i++) {
        const point = player.trail[i];
        const alpha = i / player.trail.length;
        ctx.globalAlpha = alpha * 0.5;
        if (i === 0) {
            ctx.moveTo(point.x + CONFIG.PLAYER_SIZE/2, point.y + CONFIG.PLAYER_SIZE/2);
        } else {
            ctx.lineTo(point.x + CONFIG.PLAYER_SIZE/2, point.y + CONFIG.PLAYER_SIZE/2);
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw player
    ctx.save();
    ctx.translate(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2);
    ctx.rotate(player.rotation * Math.PI / 180);
    ctx.fillStyle = CONFIG.NEON_COLORS.player;
    ctx.shadowBlur = 30;
    ctx.shadowColor = CONFIG.NEON_COLORS.player;
    ctx.fillRect(-CONFIG.PLAYER_SIZE/2, -CONFIG.PLAYER_SIZE/2, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
    ctx.restore();
    
    // Draw obstacles
    for (let obstacle of obstacles) {
        ctx.shadowBlur = 20;
        
        if (obstacle.type === 'spike') {
            ctx.fillStyle = CONFIG.NEON_COLORS.spike;
            ctx.shadowColor = CONFIG.NEON_COLORS.spike;
            drawSpike(obstacle);
        } else if (obstacle.type === 'block') {
            ctx.fillStyle = CONFIG.NEON_COLORS.obstacle;
            ctx.shadowColor = CONFIG.NEON_COLORS.obstacle;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'platform') {
            ctx.fillStyle = CONFIG.NEON_COLORS.platform;
            ctx.shadowColor = CONFIG.NEON_COLORS.platform;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
    
    // Draw particles
    for (let particle of particles) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.shadowBlur = 15;
        ctx.shadowColor = particle.color;
        ctx.fillRect(particle.x, particle.y, 4, 4);
    }
    ctx.globalAlpha = 1;
    
    // Draw ground
    ctx.fillStyle = CONFIG.NEON_COLORS.ground;
    ctx.shadowBlur = 30;
    ctx.shadowColor = CONFIG.NEON_COLORS.ground;
    ctx.fillRect(0, canvas.height - CONFIG.GROUND_HEIGHT, canvas.width, CONFIG.GROUND_HEIGHT);
    ctx.shadowBlur = 0;
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = (distance % 50); x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawSpike(obstacle) {
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
    ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
    ctx.closePath();
    ctx.fill();
}

function gameOver() {
    gameState.isPlaying = false;
    playDeathSound();
    createParticles(player.x + CONFIG.PLAYER_SIZE/2, player.y + CONFIG.PLAYER_SIZE/2, 20);
    
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('gameOverMessage').textContent = 
        `You traveled ${Math.floor(distance)}m`;
}

function victory() {
    gameState.isPlaying = false;
    playVictorySound();
    
    document.getElementById('victory').style.display = 'block';
    document.getElementById('victoryMessage').textContent = 
        `You completed level ${gameState.currentLevel}!`;
}

function restartLevel() {
    startLevel(gameState.currentLevel);
}

function nextLevel() {
    const next = gameState.currentLevel + 1;
    if (next <= 3) {
        startLevel(next);
    } else {
        backToMenu();
    }
}

function backToMenu() {
    gameState.isPlaying = false;
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';
}

// Initialize on load
window.addEventListener('load', initGame);