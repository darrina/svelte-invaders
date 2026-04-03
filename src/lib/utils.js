import { LANDSCAPE_SCENE, PLAYER_W, COLS, ALIEN_W, ALIEN_PAD_X } from './constants.js';

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getSceneWidth(scene) {
  return scene.width;
}

export function getSceneHeight(scene) {
  return scene.height;
}

export function getUIScale(scene) {
  return Math.min(
    getSceneWidth(scene) / LANDSCAPE_SCENE.width,
    getSceneHeight(scene) / LANDSCAPE_SCENE.height
  );
}

export function scaleSceneX(value, scene) {
  return value * (getSceneWidth(scene) / LANDSCAPE_SCENE.width);
}

export function scaleSceneY(value, scene) {
  return value * (getSceneHeight(scene) / LANDSCAPE_SCENE.height);
}

export function centerPlayerX(width) {
  return width / 2 - PLAYER_W / 2;
}

export function getPlayerY(height, portrait) {
  return height - (portrait ? 88 : 60);
}

export function getShieldY(height, portrait) {
  return height - (portrait ? 176 : 120);
}

export function getAlienStartX(width) {
  const formationWidth = COLS * ALIEN_W + (COLS - 1) * ALIEN_PAD_X;
  return Math.max(24, (width - formationWidth) / 2);
}

export function getAlienStartY(portrait) {
  return portrait ? 120 : 80;
}

export function getUfoY(portrait) {
  return portrait ? 72 : 50;
}

export function shouldUsePortraitLayout() {
  return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
}

export function rescaleHorizontalPosition(x, previousWidth, nextWidth, size = 0) {
  const previousRange = Math.max(previousWidth - size, 1);
  const nextRange = Math.max(nextWidth - size, 1);
  return clamp((x / previousRange) * nextRange, 0, nextWidth - size);
}

export function alienTypeForRow(row) {
  if (row === 0) return 0;
  if (row <= 2) return 1;
  return 2;
}

export function getNextUfoInterval(min, max) {
  return min + Math.random() * (max - min);
}
