import {
  COLS,
  ROWS,
  ALIEN_W,
  ALIEN_H,
  ALIEN_PAD_X,
  ALIEN_PAD_Y,
  SHIELD_COUNT,
} from './constants.js';
import { alienTypeForRow, getAlienStartX, getAlienStartY, getShieldY } from './utils.js';

export function initAliens(scene, isPortraitLayout) {
  const aliens = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const type = alienTypeForRow(r);
      aliens.push({
        col: c, row: r,
        x: getAlienStartX(scene.width) + c * (ALIEN_W + ALIEN_PAD_X),
        y: getAlienStartY(isPortraitLayout) + r * (ALIEN_H + ALIEN_PAD_Y),
        alive: true,
        frame: 0,
        type,
      });
    }
  }
  return aliens;
}

export function updateAlienInterval(aliens) {
  const alive = aliens.filter(a => a.alive).length;
  const total = COLS * ROWS;
  // Speed goes from 800ms (full) to 80ms (1 left)
  return Math.max(80, 80 + (800 - 80) * (alive / total));
}

export function initShields(scene, isPortraitLayout) {
  const shields = [];
  const shieldW = 56;
  const shieldH = 40;
  const pixelSize = 4;
  const gap = (scene.width - SHIELD_COUNT * shieldW) / (SHIELD_COUNT + 1);
  const shieldY = getShieldY(scene.height, isPortraitLayout);

  // Classic shield shape (14 cols × 10 rows with arch cutout)
  const shape = [
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,1,1],
  ];

  for (let s = 0; s < SHIELD_COUNT; s++) {
    const sx = gap + s * (shieldW + gap);
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          shields.push({
            x: sx + col * pixelSize,
            y: shieldY + row * pixelSize,
            hp: 3,
            size: pixelSize,
          });
        }
      }
    }
  }
  return shields;
}
