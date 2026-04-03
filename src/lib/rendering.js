import {
  ALIEN_W,
  ALIEN_H,
  ALIEN_SHAPES,
  ALIEN_COLORS,
  PLAYER_W,
  PLAYER_H,
  BULLET_W,
  BULLET_H,
} from './constants.js';
import { getUIScale, scaleSceneX, scaleSceneY } from './utils.js';

export function drawPixelText(ctx, text, x, y, size, color) {
  ctx.font = `${size}px "Courier New", monospace`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawAlien(ctx, alien) {
  const shapeIdx = alien.type * 2 + alien.frame;
  const shape = ALIEN_SHAPES[shapeIdx] || ALIEN_SHAPES[0];
  const pw = ALIEN_W / 10;
  const ph = ALIEN_H / 8;
  const color = ALIEN_COLORS[alien.row];

  ctx.fillStyle = color;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        ctx.fillRect(
          alien.x + c * pw,
          alien.y + r * ph,
          pw - 1,
          ph - 1
        );
      }
    }
  }
}

export function drawPlayer(ctx, player, playerY) {
  if (player.dead) return;
  const px = player.x;
  const py = playerY;

  ctx.fillStyle = '#0f0';
  // Body
  ctx.fillRect(px + 16, py, 16, 8);
  // Wings
  ctx.fillRect(px, py + 8, PLAYER_W, 12);
  // Cannon
  ctx.fillRect(px + 21, py - 8, 6, 8);
}

export function drawBullets(ctx, playerBullet, alienBullets) {
  // Player bullet
  if (playerBullet) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerBullet.x - BULLET_W / 2, playerBullet.y, BULLET_W, BULLET_H);
  }
  // Alien bullets
  ctx.fillStyle = '#f33';
  for (const b of alienBullets) {
    // Zigzag bullet
    ctx.fillRect(b.x - 2, b.y, 4, 4);
    ctx.fillRect(b.x + 2, b.y + 4, 4, 4);
    ctx.fillRect(b.x - 2, b.y + 8, 4, 4);
  }
}

export function drawShields(ctx, shields) {
  for (const pixel of shields) {
    const alpha = pixel.hp / 3;
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
    ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
  }
}

export function drawUFO(ctx, ufo) {
  if (!ufo) return;
  const ux = ufo.x;
  const uy = ufo.y;
  ctx.fillStyle = '#f0f';
  // Body
  ctx.fillRect(ux + 12, uy, 40, 12);
  ctx.fillRect(ux + 4, uy + 12, 56, 12);
  ctx.fillRect(ux, uy + 24, 64, 8);
  // Windows
  ctx.fillStyle = '#000';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(ux + 12 + i * 12, uy + 14, 6, 6);
  }
}

export function drawExplosions(ctx, explosions) {
  for (const exp of explosions) {
    const progress = exp.timer / exp.maxTimer;
    const alpha = 1 - progress;
    const r = 20 * progress;
    ctx.strokeStyle = exp.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;

    // Draw starburst
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(exp.x, exp.y);
      ctx.lineTo(exp.x + Math.cos(angle) * r, exp.y + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawHUD(ctx, scene, score, highScore, wave, lives) {
  const uiScale = getUIScale(scene);
  const labelSize = Math.max(12, Math.round(14 * uiScale));
  const valueSize = Math.max(18, Math.round(20 * uiScale));
  const scoreX = scaleSceneX(20, scene);
  const topLabelY = scaleSceneY(24, scene);
  const topValueY = scaleSceneY(44, scene);
  const centerX = scene.width / 2;
  const rightX = scene.width - scaleSceneX(120, scene);

  drawPixelText(ctx, 'SCORE', scoreX, topLabelY, labelSize, '#fff');
  drawPixelText(ctx, String(score).padStart(4, '0'), scoreX, topValueY, valueSize, '#ff0');
  drawPixelText(ctx, 'HI-SCORE', centerX - scaleSceneX(60, scene), topLabelY, labelSize, '#fff');
  drawPixelText(ctx, String(highScore).padStart(4, '0'), centerX - scaleSceneX(40, scene), topValueY, valueSize, '#ff0');
  drawPixelText(ctx, `WAVE ${wave}`, rightX, topLabelY, labelSize, '#fff');
  drawPixelText(ctx, 'LIVES', rightX, topValueY, labelSize, '#fff');

  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = '#0f0';
    const iconX = scene.width - scaleSceneX(110, scene) + i * scaleSceneX(28, scene);
    const iconY = scaleSceneY(50, scene);
    ctx.fillRect(iconX, iconY, scaleSceneX(20, scene), scaleSceneY(8, scene));
    ctx.fillRect(iconX - scaleSceneX(4, scene), iconY + scaleSceneY(8, scene), scaleSceneX(28, scene), scaleSceneY(7, scene));
  }

  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, scene.height - 36);
  ctx.lineTo(scene.width, scene.height - 36);
  ctx.stroke();
}

export function drawStartScreen(ctx, scene) {
  const uiScale = getUIScale(scene);

  ctx.fillStyle = '#0f0';
  ctx.font = `bold ${Math.round(56 * uiScale)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', scene.width / 2, scaleSceneY(120, scene));

  const sampleY = [180, 240, 300].map(y => scaleSceneY(y, scene));
  const sampleTypes = [0, 1, 2];
  const samplePoints = [30, 20, 10];
  for (let i = 0; i < 3; i++) {
    const fakeAlien = {
      x: scene.width / 2 - 18,
      y: sampleY[i],
      frame: 0,
      type: sampleTypes[i],
      row: i === 0 ? 0 : i === 1 ? 1 : 3,
    };
    drawAlien(ctx, fakeAlien);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(20 * uiScale)}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`= ${samplePoints[i]} POINTS`, scene.width / 2 + scaleSceneX(30, scene), sampleY[i] + scaleSceneY(18, scene));
  }

  ctx.fillStyle = '#f0f';
  ctx.fillRect(scene.width / 2 - scaleSceneX(20, scene), scaleSceneY(358, scene), scaleSceneX(40, scene), scaleSceneY(12, scene));
  ctx.fillRect(scene.width / 2 - scaleSceneX(28, scene), scaleSceneY(370, scene), scaleSceneX(56, scene), scaleSceneY(12, scene));
  ctx.fillRect(scene.width / 2 - scaleSceneX(32, scene), scaleSceneY(382, scene), scaleSceneX(64, scene), scaleSceneY(8, scene));
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(20 * uiScale)}px "Courier New", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('= ??? POINTS', scene.width / 2 + scaleSceneX(40, scene), scaleSceneY(375, scene));

  ctx.fillStyle = '#ff0';
  ctx.font = `bold ${Math.round(24 * uiScale)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('PRESS ENTER OR TAP TO START', scene.width / 2, scaleSceneY(460, scene));

  ctx.fillStyle = '#888';
  ctx.font = `${Math.round(16 * uiScale)}px "Courier New", monospace`;
  ctx.fillText('← → MOVE    SPACE SHOOT    P PAUSE', scene.width / 2, scaleSceneY(510, scene));
  ctx.fillText('SWIPE TO MOVE    TAP TO SHOOT', scene.width / 2, scaleSceneY(536, scene));

  ctx.textAlign = 'left';
}

export function drawGameOverScreen(ctx, scene, score, highScore) {
  const uiScale = getUIScale(scene);

  ctx.fillStyle = '#f00';
  ctx.font = `bold ${Math.round(56 * uiScale)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', scene.width / 2, scene.height / 2 - scaleSceneY(60, scene));

  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(28 * uiScale)}px "Courier New", monospace`;
  ctx.fillText(`SCORE: ${score}`, scene.width / 2, scene.height / 2);

  if (score === highScore && score > 0) {
    ctx.fillStyle = '#ff0';
    ctx.font = `${Math.round(22 * uiScale)}px "Courier New", monospace`;
    ctx.fillText('NEW HIGH SCORE!', scene.width / 2, scene.height / 2 + scaleSceneY(44, scene));
  }

  ctx.fillStyle = '#aaa';
  ctx.font = `${Math.round(20 * uiScale)}px "Courier New", monospace`;
  ctx.fillText('PRESS ENTER OR TAP TO PLAY AGAIN', scene.width / 2, scene.height / 2 + scaleSceneY(100, scene));
  ctx.textAlign = 'left';
}

export function drawWinScreen(ctx, scene, wave, score) {
  const uiScale = getUIScale(scene);

  ctx.fillStyle = '#0ff';
  ctx.font = `bold ${Math.round(48 * uiScale)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('EARTH SAVED!', scene.width / 2, scene.height / 2 - scaleSceneY(80, scene));

  ctx.fillStyle = '#ff0';
  ctx.font = `${Math.round(28 * uiScale)}px "Courier New", monospace`;
  ctx.fillText(`WAVE ${wave} CLEARED!`, scene.width / 2, scene.height / 2 - scaleSceneY(20, scene));

  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(24 * uiScale)}px "Courier New", monospace`;
  ctx.fillText(`SCORE: ${score}`, scene.width / 2, scene.height / 2 + scaleSceneY(30, scene));

  ctx.fillStyle = '#0f0';
  ctx.font = `${Math.round(20 * uiScale)}px "Courier New", monospace`;
  ctx.fillText('PRESS ENTER OR TAP FOR NEXT WAVE', scene.width / 2, scene.height / 2 + scaleSceneY(90, scene));
  ctx.textAlign = 'left';
}
