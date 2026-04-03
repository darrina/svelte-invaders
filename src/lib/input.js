import {
  TAP_MAX_DISTANCE,
  SWIPE_MOVE_THRESHOLD,
  SWIPE_VERTICAL_THRESHOLD,
  PLAYER_W,
} from './constants.js';

export function createInputState() {
  return {
    keys: {},
    touchPointerId: null,
    touchStartX: 0,
    touchStartY: 0,
    touchMoved: false,
  };
}

export function resetTouchState(inputState) {
  inputState.touchPointerId = null;
  inputState.touchMoved = false;
}

export function getCanvasPoint(canvas, e, scene) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = scene.width / rect.width;
  const scaleY = scene.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export function handleKeyDown(inputState, e, togglePause, handlePrimaryAction) {
  inputState.keys[e.code] = true;

  if (e.code === 'Space') e.preventDefault();

  if (e.code === 'KeyP' || e.code === 'Escape') {
    togglePause();
  }

  if (e.code === 'Enter') {
    handlePrimaryAction();
  }
}

export function handleKeyUp(inputState, e) {
  inputState.keys[e.code] = false;
}

export function handlePointerDown(inputState, canvas, e, scene) {
  if (e.pointerType !== 'touch' || inputState.touchPointerId !== null) return;

  e.preventDefault();
  inputState.touchPointerId = e.pointerId;

  const point = getCanvasPoint(canvas, e, scene);
  inputState.touchStartX = point.x;
  inputState.touchStartY = point.y;
  inputState.touchMoved = false;
}

export function handlePointerMove(inputState, canvas, e, scene, gameState, player, sceneWidth) {
  if (e.pointerType !== 'touch' || e.pointerId !== inputState.touchPointerId) return;

  e.preventDefault();
  const point = getCanvasPoint(canvas, e, scene);

  const deltaX = point.x - inputState.touchStartX;
  const deltaY = point.y - inputState.touchStartY;
  if (Math.abs(deltaX) > SWIPE_MOVE_THRESHOLD || Math.abs(deltaY) > SWIPE_VERTICAL_THRESHOLD) {
    inputState.touchMoved = true;
  }

  if (gameState === 'playing' && inputState.touchMoved && !player.dead) {
    player.x = Math.max(0, Math.min(sceneWidth - PLAYER_W, point.x - PLAYER_W / 2));
  }
}

export function handlePointerUp(inputState, canvas, e, scene, handlePrimaryAction) {
  if (e.pointerType !== 'touch' || e.pointerId !== inputState.touchPointerId) return;

  e.preventDefault();
  const point = getCanvasPoint(canvas, e, scene);
  const distance = Math.hypot(point.x - inputState.touchStartX, point.y - inputState.touchStartY);
  if (!inputState.touchMoved && distance <= TAP_MAX_DISTANCE) {
    handlePrimaryAction();
  }

  resetTouchState(inputState);
}

export function handlePointerCancel(inputState, e) {
  if (e.pointerType !== 'touch' || e.pointerId !== inputState.touchPointerId) return;

  e.preventDefault();
  resetTouchState(inputState);
}
