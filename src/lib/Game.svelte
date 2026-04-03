<script>
  import { onMount, onDestroy } from 'svelte';

  // ── Canvas dimensions ──────────────────────────────────────────────────────
  const LANDSCAPE_SCENE = { width: 800, height: 600 };
  const PORTRAIT_SCENE = { width: 600, height: 960 };

  // ── Game constants ─────────────────────────────────────────────────────────
  const COLS = 11;
  const ROWS = 5;
  const ALIEN_W = 36;
  const ALIEN_H = 24;
  const ALIEN_PAD_X = 16;
  const ALIEN_PAD_Y = 16;
  const PLAYER_W = 48;
  const PLAYER_H = 24;
  const BULLET_W = 3;
  const BULLET_H = 12;
  const PLAYER_SPEED = 280;   // px/s
  const BULLET_SPEED = 420;   // px/s
  const ALIEN_BULLET_SPEED = 240; // px/s
  const ALIEN_DROP = 16;      // px dropped per edge hit
  const MAX_ALIEN_BULLETS = 3;
  const UFO_SPEED = 100;      // px/s
  const UFO_INTERVAL_MIN = 15000; // ms
  const UFO_INTERVAL_MAX = 25000; // ms
  const SHIELD_COUNT = 4;

  // Alien point values per row
  const ALIEN_POINTS = [30, 20, 20, 10, 10];

  // Alien colors per row
  const ALIEN_COLORS = ['#f0f', '#0ff', '#0ff', '#0f0', '#0f0'];

  // Alien shapes: each alien type has 2 animation frames
  // encoded as 8×6 bit grid (true = filled pixel block)
  const ALIEN_SHAPES = [
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

  // ── State ──────────────────────────────────────────────────────────────────
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
  const keys = {};
  // Gesture thresholds in canvas pixels: small movement stays a tap, larger movement becomes a swipe.
  const TAP_MAX_DISTANCE = 18;
  const SWIPE_MOVE_THRESHOLD = 12;
  const SWIPE_VERTICAL_THRESHOLD = 18;
  let touchPointerId = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  // Player
  let player = { x: LANDSCAPE_SCENE.width / 2 - PLAYER_W / 2, dead: false, respawnTimer: 0 };
  let playerBullet = null; // { x, y }
  let playerShootCooldown = 0;

  // Aliens
  let aliens = [];          // { col, row, x, y, alive, frame, type }
  let alienDir = 1;         // 1 = right, -1 = left
  let alienMoveTimer = 0;
  let alienMoveInterval = 800; // ms between alien steps
  let alienFrame = 0;
  let alienCurrentIdx = 0;  // which alien moves next (sweep order)
  let alienBullets = [];    // { x, y }
  let alienShootTimer = 0;
  let alienShootInterval = 600; // ms between alien shots

  // Shields
  let shields = [];         // array of pixel objects { x, y, hp }

  // UFO
  let ufo = null;           // { x, y, dir }
  let ufoTimer = 0;
  let ufoInterval = 20000;

  // Explosion particles
  let explosions = [];      // { x, y, timer, maxTimer, color }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getSceneWidth() {
    return scene.width;
  }

  function getSceneHeight() {
    return scene.height;
  }

  function getUIScale() {
    return Math.min(getSceneWidth() / LANDSCAPE_SCENE.width, getSceneHeight() / LANDSCAPE_SCENE.height);
  }

  function scaleSceneX(value) {
    return value * (getSceneWidth() / LANDSCAPE_SCENE.width);
  }

  function scaleSceneY(value) {
    return value * (getSceneHeight() / LANDSCAPE_SCENE.height);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function centerPlayerX(width = getSceneWidth()) {
    return width / 2 - PLAYER_W / 2;
  }

  function getPlayerY(height = getSceneHeight(), portrait = isPortraitLayout) {
    return height - (portrait ? 88 : 60);
  }

  function getShieldY(height = getSceneHeight(), portrait = isPortraitLayout) {
    return height - (portrait ? 176 : 120);
  }

  function getAlienStartX(width = getSceneWidth()) {
    const formationWidth = COLS * ALIEN_W + (COLS - 1) * ALIEN_PAD_X;
    return Math.max(24, (width - formationWidth) / 2);
  }

  function getAlienStartY(portrait = isPortraitLayout) {
    return portrait ? 120 : 80;
  }

  function getUfoY(portrait = isPortraitLayout) {
    return portrait ? 72 : 50;
  }

  function shouldUsePortraitLayout() {
    return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
  }

  function rescaleHorizontalPosition(x, previousWidth, nextWidth, size = 0) {
    const previousRange = Math.max(previousWidth - size, 1);
    const nextRange = Math.max(nextWidth - size, 1);
    return clamp((x / previousRange) * nextRange, 0, nextRange);
  }

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

  function alienTypeForRow(row) {
    if (row === 0) return 0;
    if (row <= 2) return 1;
    return 2;
  }

  function initAliens() {
    aliens = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = alienTypeForRow(r);
        aliens.push({
          col: c, row: r,
          x: getAlienStartX() + c * (ALIEN_W + ALIEN_PAD_X),
          y: getAlienStartY() + r * (ALIEN_H + ALIEN_PAD_Y),
          alive: true,
          frame: 0,
          type,
        });
      }
    }
    alienDir = 1;
    alienMoveTimer = 0;
    alienCurrentIdx = 0;
    alienFrame = 0;
    updateAlienInterval();
  }

  function updateAlienInterval() {
    const alive = aliens.filter(a => a.alive).length;
    const total = COLS * ROWS;
    // Speed goes from 800ms (full) to 80ms (1 left)
    alienMoveInterval = Math.max(80, 80 + (800 - 80) * (alive / total));
  }

  function initShields() {
    shields = [];
    const shieldW = 56;
    const shieldH = 40;
    const pixelSize = 4;
    const gap = (getSceneWidth() - SHIELD_COUNT * shieldW) / (SHIELD_COUNT + 1);
    const shieldY = getShieldY();

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
  }

  function initGame() {
    score = 0;
    lives = 3;
    wave = 1;
    player = { x: centerPlayerX(), dead: false, respawnTimer: 0 };
    playerBullet = null;
    playerShootCooldown = 0;
    alienBullets = [];
    alienShootTimer = 0;
    alienShootInterval = 600;
    ufo = null;
    const ufoDelay = getNextUfoInterval();
    ufoTimer = ufoDelay;
    ufoInterval = ufoDelay;
    explosions = [];
    initAliens();
    initShields();
  }

  function startGame() {
    initGame();
    gameState = 'playing';
  }

  function startNextWave() {
    wave++;
    player = { x: centerPlayerX(), dead: false, respawnTimer: 0 };
    playerBullet = null;
    alienBullets = [];
    explosions = [];
    initAliens();
    gameState = 'playing';
  }

  function firePlayerBullet() {
    if (gameState !== 'playing' || player.dead || playerBullet || playerShootCooldown > 0) return false;

    playerBullet = {
      x: player.x + PLAYER_W / 2,
      y: getPlayerY() - BULLET_H,
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

  function resetTouchState() {
    touchPointerId = null;
    touchMoved = false;
  }

  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = getSceneWidth() / rect.width;
    const scaleY = getSceneHeight() / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function getNextUfoInterval() {
    return UFO_INTERVAL_MIN + Math.random() * (UFO_INTERVAL_MAX - UFO_INTERVAL_MIN);
  }

  function spawnExplosion(x, y, color = '#ff0') {
    explosions.push({ x, y, timer: 0, maxTimer: 400, color });
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  function drawPixelText(text, x, y, size, color) {
    ctx.font = `${size}px "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawAlien(alien) {
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

  function drawPlayer() {
    if (player.dead) return;
    const px = player.x;
    const py = getPlayerY();

    ctx.fillStyle = '#0f0';
    // Body
    ctx.fillRect(px + 16, py, 16, 8);
    // Wings
    ctx.fillRect(px, py + 8, PLAYER_W, 12);
    // Cannon
    ctx.fillRect(px + 21, py - 8, 6, 8);
  }

  function drawBullets() {
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

  function drawShields() {
    for (const pixel of shields) {
      const alpha = pixel.hp / 3;
      ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
    }
  }

  function drawUFO() {
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

  function drawExplosions() {
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

  function drawHUD() {
    const uiScale = getUIScale();
    const labelSize = Math.max(12, Math.round(14 * uiScale));
    const valueSize = Math.max(18, Math.round(20 * uiScale));
    const scoreX = scaleSceneX(20);
    const topLabelY = scaleSceneY(24);
    const topValueY = scaleSceneY(44);
    const centerX = getSceneWidth() / 2;
    const rightX = getSceneWidth() - scaleSceneX(120);

    drawPixelText('SCORE', scoreX, topLabelY, labelSize, '#fff');
    drawPixelText(String(score).padStart(4, '0'), scoreX, topValueY, valueSize, '#ff0');
    drawPixelText('HI-SCORE', centerX - scaleSceneX(60), topLabelY, labelSize, '#fff');
    drawPixelText(String(highScore).padStart(4, '0'), centerX - scaleSceneX(40), topValueY, valueSize, '#ff0');
    drawPixelText(`WAVE ${wave}`, rightX, topLabelY, labelSize, '#fff');
    drawPixelText('LIVES', rightX, topValueY, labelSize, '#fff');

    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#0f0';
      const iconX = getSceneWidth() - scaleSceneX(110) + i * scaleSceneX(28);
      const iconY = scaleSceneY(50);
      ctx.fillRect(iconX, iconY, scaleSceneX(20), scaleSceneY(8));
      ctx.fillRect(iconX - scaleSceneX(4), iconY + scaleSceneY(8), scaleSceneX(28), scaleSceneY(7));
    }

    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, getSceneHeight() - 36);
    ctx.lineTo(getSceneWidth(), getSceneHeight() - 36);
    ctx.stroke();
  }

  function drawScreen() {
    ctx.clearRect(0, 0, getSceneWidth(), getSceneHeight());
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, getSceneWidth(), getSceneHeight());

    if (gameState === 'start') {
      drawStartScreen();
      return;
    }
    if (gameState === 'gameover') {
      drawGameOverScreen();
      return;
    }
    if (gameState === 'win') {
      drawWinScreen();
      return;
    }

    // Playing / paused
    drawHUD();
    drawShields();
    for (const a of aliens) {
      if (a.alive) drawAlien(a);
    }
    drawPlayer();
    drawBullets();
    drawUFO();
    drawExplosions();

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, getSceneWidth(), getSceneHeight());
      drawPixelText('PAUSED', getSceneWidth() / 2 - scaleSceneX(56), getSceneHeight() / 2, Math.round(40 * getUIScale()), '#fff');
      drawPixelText(
        'PRESS P TO RESUME',
        getSceneWidth() / 2 - scaleSceneX(120),
        getSceneHeight() / 2 + scaleSceneY(50),
        Math.round(18 * getUIScale()),
        '#aaa'
      );
    }
  }

  function drawStartScreen() {
    ctx.fillStyle = '#0f0';
    ctx.font = `bold ${Math.round(56 * getUIScale())}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', getSceneWidth() / 2, scaleSceneY(120));

    const sampleY = [180, 240, 300].map(scaleSceneY);
    const sampleTypes = [0, 1, 2];
    const samplePoints = [30, 20, 10];
    for (let i = 0; i < 3; i++) {
      const fakeAlien = {
        x: getSceneWidth() / 2 - 18,
        y: sampleY[i],
        frame: 0,
        type: sampleTypes[i],
        row: i === 0 ? 0 : i === 1 ? 1 : 3,
      };
      drawAlien(fakeAlien);
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(20 * getUIScale())}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`= ${samplePoints[i]} POINTS`, getSceneWidth() / 2 + scaleSceneX(30), sampleY[i] + scaleSceneY(18));
    }

    ctx.fillStyle = '#f0f';
    ctx.fillRect(getSceneWidth() / 2 - scaleSceneX(20), scaleSceneY(358), scaleSceneX(40), scaleSceneY(12));
    ctx.fillRect(getSceneWidth() / 2 - scaleSceneX(28), scaleSceneY(370), scaleSceneX(56), scaleSceneY(12));
    ctx.fillRect(getSceneWidth() / 2 - scaleSceneX(32), scaleSceneY(382), scaleSceneX(64), scaleSceneY(8));
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(20 * getUIScale())}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('= ??? POINTS', getSceneWidth() / 2 + scaleSceneX(40), scaleSceneY(375));

    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.round(24 * getUIScale())}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER OR TAP TO START', getSceneWidth() / 2, scaleSceneY(460));

    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(16 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText('← → MOVE    SPACE SHOOT    P PAUSE', getSceneWidth() / 2, scaleSceneY(510));
    ctx.fillText('SWIPE TO MOVE    TAP TO SHOOT', getSceneWidth() / 2, scaleSceneY(536));

    ctx.textAlign = 'left';
  }

  function drawGameOverScreen() {
    ctx.fillStyle = '#f00';
    ctx.font = `bold ${Math.round(56 * getUIScale())}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', getSceneWidth() / 2, getSceneHeight() / 2 - scaleSceneY(60));

    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(28 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText(`SCORE: ${score}`, getSceneWidth() / 2, getSceneHeight() / 2);

    if (score === highScore && score > 0) {
      ctx.fillStyle = '#ff0';
      ctx.font = `${Math.round(22 * getUIScale())}px "Courier New", monospace`;
      ctx.fillText('NEW HIGH SCORE!', getSceneWidth() / 2, getSceneHeight() / 2 + scaleSceneY(44));
    }

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.round(20 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText('PRESS ENTER OR TAP TO PLAY AGAIN', getSceneWidth() / 2, getSceneHeight() / 2 + scaleSceneY(100));
    ctx.textAlign = 'left';
  }

  function drawWinScreen() {
    ctx.fillStyle = '#0ff';
    ctx.font = `bold ${Math.round(48 * getUIScale())}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('EARTH SAVED!', getSceneWidth() / 2, getSceneHeight() / 2 - scaleSceneY(80));

    ctx.fillStyle = '#ff0';
    ctx.font = `${Math.round(28 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText(`WAVE ${wave} CLEARED!`, getSceneWidth() / 2, getSceneHeight() / 2 - scaleSceneY(20));

    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(24 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText(`SCORE: ${score}`, getSceneWidth() / 2, getSceneHeight() / 2 + scaleSceneY(30));

    ctx.fillStyle = '#0f0';
    ctx.font = `${Math.round(20 * getUIScale())}px "Courier New", monospace`;
    ctx.fillText('PRESS ENTER OR TAP FOR NEXT WAVE', getSceneWidth() / 2, getSceneHeight() / 2 + scaleSceneY(90));
    ctx.textAlign = 'left';
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateAliens(dt);
    updateBullets(dt);
    updateUFO(dt);
    updateExplosions(dt);
    checkCollisions();
    checkWinLose();
  }

  function updatePlayer(dt) {
    if (player.dead) {
      player.respawnTimer -= dt * 1000;
      if (player.respawnTimer <= 0) {
        player.dead = false;
        player.x = centerPlayerX();
      }
      return;
    }

    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.x = Math.max(0, player.x - PLAYER_SPEED * dt);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      player.x = Math.min(getSceneWidth() - PLAYER_W, player.x + PLAYER_SPEED * dt);
    }

    playerShootCooldown -= dt * 1000;
    if (keys['Space'] || keys['ArrowUp']) {
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

      // Move all aliens together when the full sweep completes
      // Actually, move all at once when sweep resets
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
    if (alienDir === 1 && maxX + dx > getSceneWidth() - 20) hitEdge = true;
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
    alienBullets = alienBullets.filter(b => b.y < getSceneHeight());
  }

  function updateUFO(dt) {
    ufoTimer -= dt * 1000;

    if (!ufo && ufoTimer <= 0) {
      // Spawn UFO
      const dir = Math.random() > 0.5 ? 1 : -1;
      ufo = {
        x: dir === 1 ? -64 : getSceneWidth() + 4,
        y: getUfoY(),
        dir,
      };
      ufoTimer = getNextUfoInterval();
      playSound('ufo');
    }

    if (ufo) {
      ufo.x += ufo.dir * UFO_SPEED * dt;
      if (ufo.x > getSceneWidth() + 70 || ufo.x < -70) {
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

  function checkCollisions() {
    // Player bullet vs aliens
    if (playerBullet) {
      for (const a of aliens) {
        if (!a.alive) continue;
        if (
          playerBullet.x >= a.x &&
          playerBullet.x <= a.x + ALIEN_W &&
          playerBullet.y <= a.y + ALIEN_H &&
          playerBullet.y + BULLET_H >= a.y
        ) {
          a.alive = false;
          const pts = ALIEN_POINTS[a.row];
          score += pts;
          if (score > highScore) highScore = score;
          playerBullet = null;
          spawnExplosion(a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, ALIEN_COLORS[a.row]);
          playSound('explosion');
          updateAlienInterval();
          break;
        }
      }
    }

    // Player bullet vs UFO
    if (playerBullet && ufo) {
      if (
        playerBullet.x >= ufo.x &&
        playerBullet.x <= ufo.x + 64 &&
        playerBullet.y <= ufo.y + 32 &&
        playerBullet.y + BULLET_H >= ufo.y
      ) {
        const pts = [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)];
        score += pts;
        if (score > highScore) highScore = score;
        spawnExplosion(ufo.x + 32, ufo.y + 16, '#f0f');
        ufo = null;
        playerBullet = null;
        playSound('ufoExplosion');
      }
    }

    // Player bullet vs shields
    if (playerBullet) {
      for (let i = shields.length - 1; i >= 0; i--) {
        const s = shields[i];
        if (
          playerBullet.x + BULLET_W / 2 >= s.x &&
          playerBullet.x - BULLET_W / 2 <= s.x + s.size &&
          playerBullet.y <= s.y + s.size &&
          playerBullet.y + BULLET_H >= s.y
        ) {
          s.hp--;
          if (s.hp <= 0) shields.splice(i, 1);
          playerBullet = null;
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
          b.y >= getPlayerY() &&
          b.y <= getPlayerY() + PLAYER_H + 8
        ) {
          alienBullets.splice(i, 1);
          lives--;
          player.dead = true;
          player.respawnTimer = 2000;
          spawnExplosion(player.x + PLAYER_W / 2, getPlayerY() + PLAYER_H / 2, '#0f0');
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
      if (a.alive && a.y + ALIEN_H >= getPlayerY() - 10) {
        lives = 0;
      }
    }
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

  // ── Sound ──────────────────────────────────────────────────────────────────

  let audioCtx;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainVal = 0.3, startTime) {
    try {
      const ac = getAudioCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime || ac.currentTime);
      gain.gain.setValueAtTime(gainVal, startTime || ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, (startTime || ac.currentTime) + duration);
      osc.start(startTime || ac.currentTime);
      osc.stop((startTime || ac.currentTime) + duration);
    } catch (e) {
      // ignore audio errors
    }
  }

  function playSound(name) {
    try {
      switch (name) {
        case 'shoot':
          playTone(600, 'square', 0.08, 0.2);
          break;
        case 'alienShoot':
          playTone(200, 'sawtooth', 0.15, 0.15);
          break;
        case 'explosion':
          playTone(100, 'sawtooth', 0.2, 0.3);
          playTone(80, 'square', 0.25, 0.2);
          break;
        case 'ufo':
          playTone(440, 'sawtooth', 0.3, 0.1);
          playTone(220, 'sawtooth', 0.3, 0.1);
          break;
        case 'ufoExplosion':
          playTone(150, 'sawtooth', 0.4, 0.4);
          playTone(75, 'square', 0.5, 0.3);
          break;
        case 'playerDead':
          playTone(400, 'sawtooth', 0.15, 0.3);
          playTone(200, 'square', 0.3, 0.3);
          playTone(100, 'sawtooth', 0.5, 0.3);
          break;
        case 'gameOver':
          for (let i = 0; i < 8; i++) {
            const ac = getAudioCtx();
            playTone(400 - i * 40, 'sawtooth', 0.15, 0.3, ac.currentTime + i * 0.15);
          }
          break;
      }
    } catch (e) {
      // ignore
    }
  }

  // ── Main loop ──────────────────────────────────────────────────────────────

  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    drawScreen();
    animId = requestAnimationFrame(loop);
  }

  // ── Input handling ─────────────────────────────────────────────────────────

  function handleKeyDown(e) {
    keys[e.code] = true;

    if (e.code === 'Space') e.preventDefault();

    if (e.code === 'KeyP' || e.code === 'Escape') {
      togglePause();
    }

    if (e.code === 'Enter') {
      handlePrimaryAction();
    }
  }

  function handleKeyUp(e) {
    keys[e.code] = false;
  }

  function handlePointerDown(e) {
    if (e.pointerType !== 'touch' || touchPointerId !== null) return;

    e.preventDefault();
    touchPointerId = e.pointerId;

    const point = getCanvasPoint(e);
    touchStartX = point.x;
    touchStartY = point.y;
    touchMoved = false;
  }

  function handlePointerMove(e) {
    if (e.pointerType !== 'touch' || e.pointerId !== touchPointerId) return;

    e.preventDefault();
    const point = getCanvasPoint(e);

    const deltaX = point.x - touchStartX;
    const deltaY = point.y - touchStartY;
    if (Math.abs(deltaX) > SWIPE_MOVE_THRESHOLD || Math.abs(deltaY) > SWIPE_VERTICAL_THRESHOLD) {
      touchMoved = true;
    }

    if (gameState === 'playing' && touchMoved && !player.dead) {
      player.x = Math.max(0, Math.min(getSceneWidth() - PLAYER_W, point.x - PLAYER_W / 2));
    }
  }

  function handlePointerUp(e) {
    if (e.pointerType !== 'touch' || e.pointerId !== touchPointerId) return;

    e.preventDefault();
    const point = getCanvasPoint(e);
    const distance = Math.hypot(point.x - touchStartX, point.y - touchStartY);
    if (!touchMoved && distance <= TAP_MAX_DISTANCE) {
      handlePrimaryAction();
    }

    resetTouchState();
  }

  function handlePointerCancel(e) {
    if (e.pointerType !== 'touch' || e.pointerId !== touchPointerId) return;

    e.preventDefault();
    resetTouchState();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onMount(() => {
    syncSceneToViewport();
    ctx = canvas.getContext('2d');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', syncSceneToViewport);
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', syncSceneToViewport);
    if (audioCtx) audioCtx.close();
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
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerCancel}
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
