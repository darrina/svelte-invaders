import {
  ALIEN_W,
  ALIEN_H,
  BULLET_W,
  BULLET_H,
  PLAYER_W,
  PLAYER_H,
  ALIEN_POINTS,
  ALIEN_COLORS,
} from './constants.js';
import { playSound } from './sound.js';

export function spawnExplosion(explosions, x, y, color = '#ff0') {
  explosions.push({ x, y, timer: 0, maxTimer: 400, color });
}

export function checkCollisions(
  playerBullet,
  aliens,
  alienBullets,
  shields,
  ufo,
  player,
  playerY,
  score,
  highScore,
  lives,
  updateAlienInterval
) {
  let newPlayerBullet = playerBullet;
  let newUfo = ufo;
  let newScore = score;
  let newHighScore = highScore;
  let newLives = lives;
  const explosions = [];

  // Player bullet vs aliens
  if (newPlayerBullet) {
    for (const a of aliens) {
      if (!a.alive) continue;
      if (
        newPlayerBullet.x >= a.x &&
        newPlayerBullet.x <= a.x + ALIEN_W &&
        newPlayerBullet.y <= a.y + ALIEN_H &&
        newPlayerBullet.y + BULLET_H >= a.y
      ) {
        a.alive = false;
        const pts = ALIEN_POINTS[a.row];
        newScore += pts;
        if (newScore > newHighScore) newHighScore = newScore;
        newPlayerBullet = null;
        spawnExplosion(explosions, a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, ALIEN_COLORS[a.row]);
        playSound('explosion');
        updateAlienInterval();
        break;
      }
    }
  }

  // Player bullet vs UFO
  if (newPlayerBullet && newUfo) {
    if (
      newPlayerBullet.x >= newUfo.x &&
      newPlayerBullet.x <= newUfo.x + 64 &&
      newPlayerBullet.y <= newUfo.y + 32 &&
      newPlayerBullet.y + BULLET_H >= newUfo.y
    ) {
      const pts = [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)];
      newScore += pts;
      if (newScore > newHighScore) newHighScore = newScore;
      spawnExplosion(explosions, newUfo.x + 32, newUfo.y + 16, '#f0f');
      newUfo = null;
      newPlayerBullet = null;
      playSound('ufoExplosion');
    }
  }

  // Player bullet vs shields
  if (newPlayerBullet) {
    for (let i = shields.length - 1; i >= 0; i--) {
      const s = shields[i];
      if (
        newPlayerBullet.x + BULLET_W / 2 >= s.x &&
        newPlayerBullet.x - BULLET_W / 2 <= s.x + s.size &&
        newPlayerBullet.y <= s.y + s.size &&
        newPlayerBullet.y + BULLET_H >= s.y
      ) {
        s.hp--;
        if (s.hp <= 0) shields.splice(i, 1);
        newPlayerBullet = null;
        break;
      }
    }
  }

  // Alien bullets vs player
  if (!player.dead) {
    for (let i = alienBullets.length - 1; i >= 0; i--) {
      const b = alienBullets[i];
      if (
        b.x >= player.x &&
        b.x <= player.x + PLAYER_W &&
        b.y >= playerY &&
        b.y <= playerY + PLAYER_H + 8
      ) {
        alienBullets.splice(i, 1);
        newLives--;
        player.dead = true;
        player.respawnTimer = 2000;
        spawnExplosion(explosions, player.x + PLAYER_W / 2, playerY + PLAYER_H / 2, '#0f0');
        playSound('playerDead');
        break;
      }
    }
  }

  // Alien bullets vs shields
  for (let bi = alienBullets.length - 1; bi >= 0; bi--) {
    const b = alienBullets[bi];
    let hit = false;
    for (let si = shields.length - 1; si >= 0; si--) {
      const s = shields[si];
      if (
        b.x >= s.x &&
        b.x <= s.x + s.size &&
        b.y >= s.y &&
        b.y <= s.y + s.size
      ) {
        s.hp--;
        if (s.hp <= 0) shields.splice(si, 1);
        hit = true;
        break;
      }
    }
    if (hit) alienBullets.splice(bi, 1);
  }

  // Aliens reaching player level
  for (const a of aliens) {
    if (a.alive && a.y + ALIEN_H >= playerY - 10) {
      newLives = 0;
    }
  }

  return {
    playerBullet: newPlayerBullet,
    ufo: newUfo,
    score: newScore,
    highScore: newHighScore,
    lives: newLives,
    explosions,
  };
}
