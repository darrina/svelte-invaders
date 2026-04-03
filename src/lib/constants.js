// Canvas dimensions
export const LANDSCAPE_SCENE = { width: 800, height: 600 };
export const PORTRAIT_SCENE = { width: 600, height: 960 };

// Game constants
export const COLS = 11;
export const ROWS = 5;
export const ALIEN_W = 36;
export const ALIEN_H = 24;
export const ALIEN_PAD_X = 16;
export const ALIEN_PAD_Y = 16;
export const PLAYER_W = 48;
export const PLAYER_H = 24;
export const BULLET_W = 3;
export const BULLET_H = 12;
export const PLAYER_SPEED = 280;   // px/s
export const BULLET_SPEED = 420;   // px/s
export const ALIEN_BULLET_SPEED = 240; // px/s
export const ALIEN_DROP = 16;      // px dropped per edge hit
export const MAX_ALIEN_BULLETS = 3;
export const UFO_SPEED = 100;      // px/s
export const UFO_INTERVAL_MIN = 15000; // ms
export const UFO_INTERVAL_MAX = 25000; // ms
export const SHIELD_COUNT = 4;

// Alien point values per row
export const ALIEN_POINTS = [30, 20, 20, 10, 10];

// Alien colors per row
export const ALIEN_COLORS = ['#f0f', '#0ff', '#0ff', '#0f0', '#0f0'];

// Gesture thresholds in canvas pixels
export const TAP_MAX_DISTANCE = 18;
export const SWIPE_MOVE_THRESHOLD = 12;
export const SWIPE_VERTICAL_THRESHOLD = 18;

// Alien shapes: each alien type has 2 animation frames
// encoded as 8×6 bit grid (true = filled pixel block)
export const ALIEN_SHAPES = [
  // Type 0 (top row) – "squid" style
  [
    [0,0,1,0,0,0,1,0,0,0],
    [0,0,0,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,1,0,1,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,1,1,0],
    [1,0,1,1,1,1,1,0,1,0],
    [1,0,1,0,0,0,1,0,1,0],
    [0,0,1,1,0,1,1,0,0,0],
  ],
  [
    [0,0,1,0,0,0,1,0,0,0],
    [1,0,0,1,1,1,0,0,1,0],
    [1,0,1,1,1,1,1,0,1,0],
    [1,1,0,1,0,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,1,0,0,0],
    [0,1,0,0,0,0,0,1,0,0],
  ],
  // Type 1 (rows 1-2) – "crab" style
  [
    [0,0,0,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,0,1,0,0,0,0,1,0,0],
    [0,1,0,1,1,1,1,0,1,0],
    [1,0,1,0,0,0,0,1,0,1],
  ],
  [
    [0,0,0,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,0,0,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0],
    [0,0,1,0,0,0,0,1,0,0],
  ],
  // Type 2 (rows 3-4) – "octopus" style
  [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,0,1,1,1,1,0,1,0],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [0,1,0,0,0,0,0,0,1,0],
  ],
  [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,0,1,1,1,1,0,1,0],
    [0,0,1,1,0,0,1,1,0,0],
    [0,1,0,0,1,1,0,0,1,0],
    [0,0,1,0,0,0,0,1,0,0],
  ],
];
