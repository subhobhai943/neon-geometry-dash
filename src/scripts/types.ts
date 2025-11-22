export interface GameConfig {
  GRAVITY: number;
  JUMP_FORCE: number;
  PLAYER_SIZE: number;
  SCROLL_SPEED: number;
  SHIP_THRUST: number;
  SHIP_GRAVITY: number;
  NEON_COLORS: {
    block: string;
    player: string;
    spike: string;
    portal: string;
    saw: string;
    ground: string;
    background: string;
    ship: string;
  };
}

export interface Player {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
  isJumping: boolean;
  mode: 'cube' | 'ship';
  iconColor: string;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'cube' | 'spike' | 'ship-wall';
}

export interface Portal {
  x: number;
  y: number;
  type: 'cube' | 'ship';
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface BackgroundDecor {
  x: number;
  y: number;
  r: number;
  c: string;
}

export interface GameState {
  isPlaying: boolean;
  currentLevel: number;
}