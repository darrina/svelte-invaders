<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    LANDSCAPE_SCENE,
    PORTRAIT_SCENE,
    PLAYER_W,
    PLAYER_H,
    PLAYER_SPEED,
    BULLET_SPEED,
    BULLET_H,
    ALIEN_BULLET_SPEED,
    ALIEN_W,
    ALIEN_PAD_X,
    ALIEN_DROP,
    MAX_ALIEN_BULLETS,
    UFO_SPEED,
    UFO_INTERVAL_MIN,
    UFO_INTERVAL_MAX,
    ALIEN_H,
  } from './constants.js';
  import {
    centerPlayerX,
    getPlayerY,
    getShieldY,
    getUfoY,
    shouldUsePortraitLayout,
    rescaleHorizontalPosition,
    getNextUfoInterval,
  } from './utils.js';
  import { playSound, closeAudioContext } from './sound.js';
  import {
    drawHUD,
    drawShields,
    drawAlien,
    drawPlayer,
    drawBullets,
    drawUFO,
    drawExplosions,
    drawStartScreen,
    drawGameOverScreen,
    drawWinScreen,
  } from './rendering.js';
  import { initAliens, updateAlienInterval, initShields } from './entities.js';
  import { checkCollisions } from './collision.js';
  import {
    createInputState,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } from './input.js';

  // Canvas and rendering
  let canvas;
  let ctx;
  let animId;
  let lastTime = 0;
  let scene = { ...LANDSCAPE_SCENE };
  let isPortraitLayout = false;

  // Game state: 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  let gameState = 'start';
  let score = 0;
  let highScore = 0;
  let lives = 3;
  let wave = 1;

  // Input
  const inputState = createInputState();

  // Player
  let player = { x: LANDSCAPE_SCENE.width / 2 - PLAYER_W / 2, dead: false, respawnTimer: 0 };
  let playerBullet = null;
  let playerShootCooldown = 0;

  // Aliens
  let aliens = [];
  let alienDir = 1;
  let alienMoveTimer = 0;
  let alienMoveInterval = 800;
  let alienFrame = 0;
  let alienCurrentIdx = 0;
  let alienBullets = [];
  let alienShootTimer = 0;
  let alienShootInterval = 600;

  // Shields
  let shields = [];

  // UFO
  let ufo = null;
  let ufoTimer = 0;
  let ufoInterval = 20000;

  // Explosion particles
  let explosions = [];

  function syncSceneToViewport() {
    const nextPortraitLayout = shouldUsePortraitLayout();
    const nextScene = nextPortraitLayout ? PORTRAIT_SCENE : LANDSCAPE_SCENE;

    if (
      scene.width === nextScene.width &&
      scene.height === nextScene.height &&
      isPortraitLayout === nextPortraitLayout
    ) {
      return;
    }

    const previousWidth = scene.width;
    const previousHeight = scene.height;
    const previousShieldY = getShieldY(previousHeight, isPortraitLayout);
    const nextShieldY = getShieldY(nextScene.height, nextPortraitLayout);
    const previousUfoY = getUfoY(isPortraitLayout);
    const nextUfoY = getUfoY(nextPortraitLayout);
    const widthRatio = nextScene.width / previousWidth;
    const heightRatio = nextScene.height / previousHeight;

    scene = { ...nextScene };
    isPortraitLayout = nextPortraitLayout;

    player = {
      ...player,
      x: rescaleHorizontalPosition(player.x, previousWidth, nextScene.width, PLAYER_W),
    };

    if (playerBullet) {
      playerBullet = {
        x: playerBullet.x * widthRatio,
        y: playerBullet.y * heightRatio,
      };
    }

    alienBullets = alienBullets.map((bullet) => ({
      x: bullet.x * widthRatio,
      y: bullet.y * heightRatio,
    }));

    aliens = aliens.map((alien) => ({
      ...alien,
      x: alien.x * widthRatio,
      y: alien.y * heightRatio,
    }));

    shields = shields.map((shield) => ({
      ...shield,
      x: shield.x * widthRatio,
      y: nextShieldY + (shield.y - previousShieldY) * heightRatio,
    }));

    if (ufo) {
      ufo = {
        ...ufo,
        x: ufo.x * widthRatio,
        y: nextUfoY + (ufo.y - previousUfoY) * heightRatio,
      };
    }

    explosions = explosions.map((explosion) => ({
      ...explosion,
      x: explosion.x * widthRatio,
      y: explosion.y * heightRatio,
    }));
  }

  function resetAliens() {
    aliens = initAliens(scene, isPortraitLayout);
    alienDir = 1;
    alienMoveTimer = 0;
    alienCurrentIdx = 0;
    alienFrame = 0;
    alienMoveInterval = updateAlienInterval(aliens);
  }

  function resetShields() {
    shields = initShields(scene, isPortraitLayout);
  }

  function initGame() {
    score = 0;
    lives = 3;
    wave = 1;
    player = { x: centerPlayerX(scene.width), dead: false, respawnTimer: 0 };
    playerBullet = null;
    playerShootCooldown = 0;
    alienBullets = [];
    alienShootTimer = 0;
    alienShootInterval = 600;
    ufo = null;
    const ufoDelay = getNextUfoInterval(UFO_INTERVAL_MIN, UFO_INTERVAL_MAX);
    ufoTimer = ufoDelay;
    ufoInterval = ufoDelay;
    explosions = [];
    resetAliens();
    resetShields();
  }

  function startGame() {
    initGame();
    gameState = 'playing';
  }

  function startNextWave() {
    wave++;
    player = { x: centerPlayerX(scene.width), dead: false, respawnTimer: 0 };
    playerBullet = null;
    alienBullets = [];
    explosions = [];
    resetAliens();
    gameState = 'playing';
  }

  function firePlayerBullet() {
    if (gameState !== 'playing' || player.dead || playerBullet || playerShootCooldown > 0) return false;

    playerBullet = {
      x: player.x + PLAYER_W / 2,
      y: getPlayerY(scene.height, isPortraitLayout) - BULLET_H,
    };
    playerShootCooldown = 300;
    playSound('shoot');
    return true;
  }

  function handlePrimaryAction() {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
      return;
    }

    if (gameState === 'win') {
      startNextWave();
      return;
    }

    if (gameState === 'paused') {
      gameState = 'playing';
      return;
    }

    firePlayerBullet();
  }

  function togglePause() {
    if (gameState === 'playing') gameState = 'paused';
    else if (gameState === 'paused') gameState = 'playing';
  }

  function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateAliens(dt);
    updateBullets(dt);
    updateUFO(dt);
    updateExplosions(dt);
    processCollisions();
    checkWinLose();
  }

  function updatePlayer(dt) {
    if (player.dead) {
      player.respawnTimer -= dt * 1000;
      if (player.respawnTimer <= 0) {
        player.dead = false;
        player.x = centerPlayerX(scene.width);
      }
      return;
    }

    if (inputState.keys['ArrowLeft'] || inputState.keys['KeyA']) {
      player.x = Math.max(0, player.x - PLAYER_SPEED * dt);
    }
    if (inputState.keys['ArrowRight'] || inputState.keys['KeyD']) {
      player.x = Math.min(scene.width - PLAYER_W, player.x + PLAYER_SPEED * dt);
    }

    playerShootCooldown -= dt * 1000;
    if (inputState.keys['Space'] || inputState.keys['ArrowUp']) {
      firePlayerBullet();
    }
  }

  function updateAliens(dt) {
    alienMoveTimer -= dt * 1000;
    alienShootTimer -= dt * 1000;

    const liveAliens = aliens.filter(a => a.alive);
    if (liveAliens.length === 0) return;

    // Step aliens one at a time (classic sweep)
    if (alienMoveTimer <= 0) {
      alienMoveTimer = alienMoveInterval;

      // Find next live alien
      let steps = 0;
      while (steps < aliens.length) {
        alienCurrentIdx = (alienCurrentIdx + 1) % aliens.length;
        if (aliens[alienCurrentIdx].alive) break;
        steps++;
      }

      const a = aliens[alienCurrentIdx];
      if (!a.alive) return;

      // Toggle animation frame
      a.frame = (a.frame + 1) % 2;
    }

    // Classic movement: move all aliens together
    // Find edge collisions
    let minX = Infinity, maxX = -Infinity;
    for (const a of liveAliens) {
      minX = Math.min(minX, a.x);
      maxX = Math.max(maxX, a.x + ALIEN_W);
    }

    // Continuous movement
    const alienSpeed = (1000 / alienMoveInterval) * (ALIEN_W + ALIEN_PAD_X) * 0.1;
    const dx = alienDir * alienSpeed * dt;

    let hitEdge = false;
    if (alienDir === 1 && maxX + dx > scene.width - 20) hitEdge = true;
    if (alienDir === -1 && minX + dx < 20) hitEdge = true;

    if (hitEdge) {
      alienDir *= -1;
      for (const a of liveAliens) {
        a.y += ALIEN_DROP;
        // Toggle frame on direction change
        a.frame = (a.frame + 1) % 2;
      }
    } else {
      for (const a of liveAliens) {
        a.x += dx;
      }
    }

    // Alien shooting
    if (alienShootTimer <= 0 && alienBullets.length < MAX_ALIEN_BULLETS) {
      alienShootTimer = alienShootInterval;
      // Find bottom-most aliens per column that can shoot
      const cols = {};
      for (const a of liveAliens) {
        if (!cols[a.col] || a.y > cols[a.col].y) {
          cols[a.col] = a;
        }
      }
      const shooters = Object.values(cols);
      if (shooters.length > 0) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        alienBullets.push({
          x: shooter.x + ALIEN_W / 2,
          y: shooter.y + ALIEN_H,
        });
        playSound('alienShoot');
      }
    }
  }

  function updateBullets(dt) {
    // Player bullet
    if (playerBullet) {
      playerBullet.y -= BULLET_SPEED * dt;
      if (playerBullet.y < 0) {
        playerBullet = null;
      }
    }

    // Alien bullets
    for (const b of alienBullets) {
      b.y += ALIEN_BULLET_SPEED * dt;
    }
    alienBullets = alienBullets.filter(b => b.y < scene.height);
  }

  function updateUFO(dt) {
    ufoTimer -= dt * 1000;

    if (!ufo && ufoTimer <= 0) {
      // Spawn UFO
      const dir = Math.random() > 0.5 ? 1 : -1;
      ufo = {
        x: dir === 1 ? -64 : scene.width + 4,
        y: getUfoY(isPortraitLayout),
        dir,
      };
      ufoTimer = getNextUfoInterval(UFO_INTERVAL_MIN, UFO_INTERVAL_MAX);
      playSound('ufo');
    }

    if (ufo) {
      ufo.x += ufo.dir * UFO_SPEED * dt;
      if (ufo.x > scene.width + 70 || ufo.x < -70) {
        ufo = null;
      }
    }
  }

  function updateExplosions(dt) {
    for (const e of explosions) {
      e.timer += dt * 1000;
    }
    explosions = explosions.filter(e => e.timer < e.maxTimer);
  }

  function processCollisions() {
    const result = checkCollisions(
      playerBullet,
      aliens,
      alienBullets,
      shields,
      ufo,
      player,
      getPlayerY(scene.height, isPortraitLayout),
      score,
      highScore,
      lives,
      () => { alienMoveInterval = updateAlienInterval(aliens); }
    );

    playerBullet = result.playerBullet;
    ufo = result.ufo;
    score = result.score;
    highScore = result.highScore;
    lives = result.lives;
    explosions = [...explosions, ...result.explosions];
  }

  function checkWinLose() {
    if (lives <= 0) {
      gameState = 'gameover';
      playSound('gameOver');
      return;
    }
    const alive = aliens.filter(a => a.alive).length;
    if (alive === 0) {
      gameState = 'win';
    }
  }

  function drawScreen() {
    ctx.clearRect(0, 0, scene.width, scene.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, scene.width, scene.height);

    if (gameState === 'start') {
      drawStartScreen(ctx, scene);
      return;
    }
    if (gameState === 'gameover') {
      drawGameOverScreen(ctx, scene, score, highScore);
      return;
    }
    if (gameState === 'win') {
      drawWinScreen(ctx, scene, wave, score);
      return;
    }

    // Playing / paused
    drawHUD(ctx, scene, score, highScore, wave, lives);
    drawShields(ctx, shields);
    for (const a of aliens) {
      if (a.alive) drawAlien(ctx, a);
    }
    drawPlayer(ctx, player, getPlayerY(scene.height, isPortraitLayout));
    drawBullets(ctx, playerBullet, alienBullets);
    drawUFO(ctx, ufo);
    drawExplosions(ctx, explosions);

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, scene.width, scene.height);
      const uiScale = Math.min(scene.width / LANDSCAPE_SCENE.width, scene.height / LANDSCAPE_SCENE.height);
      ctx.font = `${Math.round(40 * uiScale)}px "Courier New", monospace`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', scene.width / 2, scene.height / 2);
      ctx.font = `${Math.round(18 * uiScale)}px "Courier New", monospace`;
      ctx.fillStyle = '#aaa';
      ctx.fillText('PRESS P TO RESUME', scene.width / 2, scene.height / 2 + 50 * (scene.height / LANDSCAPE_SCENE.height));
      ctx.textAlign = 'left';
    }
  }

  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    drawScreen();
    animId = requestAnimationFrame(loop);
  }

  onMount(() => {
    syncSceneToViewport();
    ctx = canvas.getContext('2d');

    const keyDownHandler = (e) => handleKeyDown(inputState, e, togglePause, handlePrimaryAction);
    const keyUpHandler = (e) => handleKeyUp(inputState, e);

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    window.addEventListener('resize', syncSceneToViewport);

    lastTime = performance.now();
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  });

  onDestroy(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', syncSceneToViewport);
    closeAudioContext();
  });
</script>

<div
  class="game-shell"
  style={`--scene-width: ${scene.width}; --scene-height: ${scene.height};`}
>
  <canvas
    bind:this={canvas}
    width={scene.width}
    height={scene.height}
    on:pointerdown={(e) => handlePointerDown(inputState, canvas, e, scene)}
    on:pointermove={(e) => handlePointerMove(inputState, canvas, e, scene, gameState, player, scene.width)}
    on:pointerup={(e) => handlePointerUp(inputState, canvas, e, scene, handlePrimaryAction)}
    on:pointercancel={(e) => handlePointerCancel(inputState, e)}
  ></canvas>

  <button
    class="touch-pause"
    type="button"
    on:click={togglePause}
    disabled={gameState !== 'playing' && gameState !== 'paused'}
    aria-label={gameState === 'paused' ? 'Resume game' : 'Pause game'}
  >
    {gameState === 'paused' ? '▶' : 'Ⅱ'}
  </button>
</div>

<style>
  .game-shell {
    position: relative;
    width: min(100vw, calc(100dvh * var(--scene-width) / var(--scene-height)));
    height: min(100dvh, calc(100vw * var(--scene-height) / var(--scene-width)));
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    background: #000;
    image-rendering: pixelated;
    touch-action: none;
  }

  .touch-pause {
    position: absolute;
    top: max(12px, env(safe-area-inset-top));
    right: max(12px, env(safe-area-inset-right));
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 1px solid #0f0;
    border-radius: 999px;
    background: rgb(0 0 0 / 75%);
    color: #0f0;
    font: inherit;
    font-size: 18px;
  }

  .touch-pause:disabled {
    opacity: 0.35;
  }

  @media (pointer: coarse) {
    .touch-pause {
      display: inline-flex;
    }
  }
</style>
