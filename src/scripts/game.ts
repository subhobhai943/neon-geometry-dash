import type { GameConfig, Player, Obstacle, Portal, Particle, BackgroundDecor, GameState } from './types';

// Configuration
const CONFIG: GameConfig = {
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

// Game State
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
const gameState: GameState = {
  isPlaying: false,
  currentLevel: 1,
};

const player: Player = {
  x: 120,
  y: 0,
  velocityY: 0,
  rotation: 0,
  isJumping: false,
  mode: 'cube',
  iconColor: CONFIG.NEON_COLORS.player,
};

let obstacles: Obstacle[] = [];
let portals: Portal[] = [];
let backgroundDecor: BackgroundDecor[] = [];
let particles: Particle[] = [];
let distance = 0;
let levelLength = 4000;
let inputActive = false;
let lastTime = 0;

// Audio Context
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function playSound(f: number, d: number, t: OscillatorType = 'sine'): void {
  const o = audioContext.createOscillator();
  const g = audioContext.createGain();
  o.connect(g);
  g.connect(audioContext.destination);
  o.frequency.value = f;
  o.type = t;
  g.gain.setValueAtTime(0.2, audioContext.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + d);
  o.start(audioContext.currentTime);
  o.stop(audioContext.currentTime + d);
}

const playJumpSound = (): void => playSound(600, 0.12, 'triangle');
const playDeathSound = (): void => playSound(80, 0.33, 'sawtooth');
const playPortalSound = (): void => playSound(1200, 0.08, 'square');
const playShipThrust = (): void => playSound(220, 0.06, 'triangle');
const playVictorySound = (): void => {
  playSound(950, 0.07, 'sine');
  setTimeout(() => playSound(400, 0.07, 'sine'), 80);
};

// Initialize Game
export function initGame(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  
  const context = canvas.getContext('2d');
  if (!context) return;
  ctx = context;
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', userInputDown);
  canvas.addEventListener('mouseup', userInputUp);
  canvas.addEventListener('touchstart', userInputDown);
  canvas.addEventListener('touchend', userInputUp);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.isPlaying) userInputDown();
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') userInputUp();
  });
}

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 100;
}

export function startLevel(level: number): void {
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
  
  const menuEl = document.getElementById('menu');
  const gameScreenEl = document.getElementById('gameScreen');
  const gameOverEl = document.getElementById('gameOver');
  const victoryEl = document.getElementById('victory');
  const levelInfoEl = document.getElementById('levelInfo');
  
  if (menuEl) menuEl.style.display = 'none';
  if (gameScreenEl) gameScreenEl.style.display = 'flex';
  if (gameOverEl) gameOverEl.style.display = 'none';
  if (victoryEl) victoryEl.style.display = 'none';
  if (levelInfoEl) levelInfoEl.textContent = `Level ${level}`;
  
  generateLevel(level);
  lastTime = performance.now();
  gameLoop(performance.now());
}

function generateLevel(level: number): void {
  obstacles = [];
  portals = [];
  levelLength = 4000 + (level * 600);
  let x = canvas.width;
  let toggled = false;
  
  while (x < levelLength) {
    if ((x > canvas.width + 1000 && !toggled) || (x > canvas.width + 2500 && toggled === false && level >= 2)) {
      portals.push({
        x,
        y: canvas.height - 170,
        type: toggled ? 'cube' : 'ship',
        color: toggled ? CONFIG.NEON_COLORS.player : CONFIG.NEON_COLORS.ship
      });
      toggled = !toggled;
      x += 150;
      continue;
    }
    
    if (!toggled) {
      if (Math.random() < 0.25) {
        obstacles.push({ x, y: canvas.height - 110, w: 38, h: 38, type: 'cube' });
      } else {
        obstacles.push({ x, y: canvas.height - 110, w: 30, h: 45, type: 'spike' });
      }
    } else {
      if (Math.random() < 0.22) {
        obstacles.push({ x, y: Math.random() * (canvas.height - 220) + 50, w: 19, h: 90, type: 'ship-wall' });
      }
    }
    x += 100 + Math.random() * 90;
  }
  
  for (let i = 0; i < 25; i++) {
    backgroundDecor.push({
      x: Math.random() * canvas.width * 2,
      y: Math.random() * (canvas.height - 180),
      r: 14 + Math.random() * 24,
      c: i % 2 === 0 ? CONFIG.NEON_COLORS.block : '#2b69fc'
    });
  }
}

function userInputDown(): void {
  inputActive = true;
  if (!gameState.isPlaying) return;
  
  if (player.mode === 'cube' && !player.isJumping) {
    player.velocityY = CONFIG.JUMP_FORCE;
    player.isJumping = true;
    playJumpSound();
    createParticles(player.x, player.y + CONFIG.PLAYER_SIZE, 7, player.iconColor);
  }
}

function userInputUp(): void {
  inputActive = false;
}

function createParticles(x: number, y: number, count: number, color: string): void {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      color
    });
  }
}

function gameLoop(now: number): void {
  if (!gameState.isPlaying) return;
  
  const deltaTime = (now - lastTime) / 16.5;
  update(deltaTime);
  draw();
  lastTime = now;
  requestAnimationFrame(gameLoop);
}

function update(timeFactor: number): void {
  // Player physics
  if (player.mode === 'cube') {
    player.velocityY += CONFIG.GRAVITY * timeFactor;
    player.y += player.velocityY * timeFactor;
    player.rotation += (player.isJumping ? 12 : 4) * timeFactor;
    
    if (player.y > canvas.height - 110) {
      player.y = canvas.height - 110;
      player.velocityY = 0;
      player.isJumping = false;
      player.rotation = 0;
    }
  } else if (player.mode === 'ship') {
    if (inputActive) {
      player.velocityY += CONFIG.SHIP_THRUST * timeFactor;
      playShipThrust();
    } else {
      player.velocityY += CONFIG.SHIP_GRAVITY * timeFactor;
    }
    
    player.velocityY = Math.max(-7, Math.min(6, player.velocityY));
    player.y += player.velocityY * timeFactor * 2;
    player.rotation = player.velocityY * 5;
    
    if (player.y < 0) {
      player.y = 0;
      player.velocityY = 0;
    }
    if (player.y > canvas.height - 130) {
      player.y = canvas.height - 130;
      player.velocityY = 0;
    }
  }
  
  // Move objects
  distance += CONFIG.SCROLL_SPEED * timeFactor;
  obstacles.forEach(obs => obs.x -= CONFIG.SCROLL_SPEED * timeFactor);
  portals.forEach(p => p.x -= CONFIG.SCROLL_SPEED * timeFactor);
  backgroundDecor.forEach(d => d.x -= (CONFIG.SCROLL_SPEED / 3) * timeFactor);
  
  // Remove off-screen
  obstacles = obstacles.filter(o => o.x > -o.w);
  portals = portals.filter(p => p.x > -50);
  backgroundDecor = backgroundDecor.filter(d => d.x > -d.r);
  
  // Update particles
  particles.forEach(prt => {
    prt.x += prt.vx * timeFactor;
    prt.y += prt.vy * timeFactor;
    prt.life -= 0.025 * timeFactor;
  });
  particles = particles.filter(p => p.life > 0);
  
  // Portal collision
  portals.forEach(portal => {
    if (checkCollisionPortal(player, portal)) {
      if ((portal.type === 'ship' && player.mode !== 'ship') || (portal.type === 'cube' && player.mode !== 'cube')) {
        player.mode = portal.type;
        player.iconColor = portal.color;
        playPortalSound();
      }
    }
  });
  
  // Obstacle collision
  for (const obs of obstacles) {
    if (checkCollision(player, obs)) {
      gameOver();
      return;
    }
  }
  
  // Victory check
  if (distance >= levelLength) {
    victory();
    return;
  }
  
  // Update progress bar
  const progress = (distance / levelLength) * 100;
  const progressFillEl = document.getElementById('progressFill');
  if (progressFillEl) progressFillEl.style.width = `${progress}%`;
}

function checkCollision(player: Player, obs: Obstacle): boolean {
  if (obs.type === 'cube' || obs.type === 'spike') {
    return player.x < obs.x + obs.w &&
           player.x + CONFIG.PLAYER_SIZE > obs.x &&
           player.y < obs.y + obs.h &&
           player.y + CONFIG.PLAYER_SIZE > obs.y;
  } else if (obs.type === 'ship-wall') {
    return player.x + CONFIG.PLAYER_SIZE > obs.x &&
           player.x < obs.x + obs.w &&
           player.y < obs.y + obs.h &&
           player.y + CONFIG.PLAYER_SIZE > obs.y;
  }
  return false;
}

function checkCollisionPortal(player: Player, portal: Portal): boolean {
  return player.x < portal.x + 44 &&
         player.x + CONFIG.PLAYER_SIZE > portal.x &&
         player.y < portal.y + 44 &&
         player.y + CONFIG.PLAYER_SIZE > portal.y;
}

function draw(): void {
  ctx.fillStyle = CONFIG.NEON_COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Background decor
  backgroundDecor.forEach(bd => {
    ctx.beginPath();
    ctx.arc(bd.x, bd.y, bd.r, 0, Math.PI * 2);
    ctx.fillStyle = bd.c;
    ctx.globalAlpha = 0.22;
    ctx.shadowBlur = 16;
    ctx.shadowColor = bd.c;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });
  
  // Portals
  portals.forEach(portal => drawPortal(portal));
  
  // Obstacles
  obstacles.forEach(obs => {
    if (obs.type === 'cube') drawBlock(obs);
    if (obs.type === 'spike') drawSpike(obs);
    if (obs.type === 'ship-wall') drawShipWall(obs);
  });
  
  // Player
  ctx.save();
  ctx.translate(player.x + CONFIG.PLAYER_SIZE / 2, player.y + CONFIG.PLAYER_SIZE / 2);
  ctx.rotate((player.mode === 'cube' ? player.rotation : player.rotation / 1.3) * Math.PI / 180);
  if (player.mode === 'cube') drawPlayerCube(player.iconColor);
  else if (player.mode === 'ship') drawShip(player.iconColor);
  ctx.restore();
  
  // Particles
  particles.forEach(prt => {
    ctx.globalAlpha = prt.life;
    ctx.beginPath();
    ctx.arc(prt.x, prt.y, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = prt.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = prt.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });
  
  // Floor
  ctx.fillStyle = CONFIG.NEON_COLORS.ground;
  ctx.shadowBlur = 18;
  ctx.shadowColor = CONFIG.NEON_COLORS.ground;
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
  ctx.shadowBlur = 0;
}

function drawPlayerCube(color: string): void {
  ctx.beginPath();
  ctx.rect(-CONFIG.PLAYER_SIZE / 2, -CONFIG.PLAYER_SIZE / 2, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
  ctx.fillStyle = color;
  ctx.shadowBlur = 36;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function drawBlock(obs: Obstacle): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(obs.x, obs.y, obs.w, obs.h);
  ctx.fillStyle = CONFIG.NEON_COLORS.block;
  ctx.shadowBlur = 22;
  ctx.shadowColor = CONFIG.NEON_COLORS.block;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}

function drawShip(color: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-15, 12);
  ctx.lineTo(0, -16);
  ctx.lineTo(15, 12);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowBlur = 34;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.lineWidth = 3.6;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}

function drawSpike(obs: Obstacle): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(obs.x, obs.y + obs.h);
  ctx.lineTo(obs.x + obs.w / 2, obs.y);
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

function drawShipWall(obs: Obstacle): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(obs.x, obs.y, obs.w, obs.h);
  ctx.fillStyle = CONFIG.NEON_COLORS.ship;
  ctx.shadowBlur = 14;
  ctx.shadowColor = CONFIG.NEON_COLORS.ship;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}

function drawPortal(portal: Portal): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(portal.x + 22, portal.y + 22, 22, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.shadowBlur = 32;
  ctx.shadowColor = portal.color;
  ctx.beginPath();
  ctx.arc(portal.x + 22, portal.y + 22, 16, 0, Math.PI * 2);
  ctx.strokeStyle = portal.color;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
}

function gameOver(): void {
  gameState.isPlaying = false;
  playDeathSound();
  createParticles(player.x + CONFIG.PLAYER_SIZE / 2, player.y + CONFIG.PLAYER_SIZE / 2, 22, '#ff0032');
  
  const gameOverEl = document.getElementById('gameOver');
  const gameOverMsgEl = document.getElementById('gameOverMessage');
  if (gameOverEl) gameOverEl.style.display = 'block';
  if (gameOverMsgEl) gameOverMsgEl.textContent = `You traveled ${Math.floor(distance)}m`;
}

function victory(): void {
  gameState.isPlaying = false;
  playVictorySound();
  
  const victoryEl = document.getElementById('victory');
  const victoryMsgEl = document.getElementById('victoryMessage');
  if (victoryEl) victoryEl.style.display = 'block';
  if (victoryMsgEl) victoryMsgEl.textContent = `You completed level ${gameState.currentLevel}!`;
}

export function restartLevel(): void {
  startLevel(gameState.currentLevel);
}

export function nextLevel(): void {
  const next = gameState.currentLevel + 1;
  if (next <= 3) {
    startLevel(next);
  } else {
    backToMenu();
  }
}

export function backToMenu(): void {
  gameState.isPlaying = false;
  const menuEl = document.getElementById('menu');
  const gameScreenEl = document.getElementById('gameScreen');
  if (menuEl) menuEl.style.display = 'flex';
  if (gameScreenEl) gameScreenEl.style.display = 'none';
}