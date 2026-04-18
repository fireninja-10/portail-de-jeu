const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const touchButtons = Array.from(document.querySelectorAll("[data-touch-dir]"));

const statScore = document.getElementById("stat-score");
const statLevel = document.getElementById("stat-level");
const statCapture = document.getElementById("stat-capture");
const statLives = document.getElementById("stat-lives");
const statTrace = document.getElementById("stat-trace");
const statHighscore = document.getElementById("stat-highscore");
const statusText = document.getElementById("status-text");

const BOARD = {
  cols: 80,
  rows: 45,
  cell: 12,
  baseArea: (80 - 2) * (45 - 2),
};

const MAX_LIVES = 5;
const TOTAL_LEVELS = 20;
const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, index) => ({
  number: index + 1,
  targetCapture: Math.min(82, 56 + index + Math.floor(index / 2)),
  serpentSpeed: 0.88 + index * 0.045,
  serpentLength: 10 + Math.floor(index * 0.75),
  serpentSpacing: Math.max(8, 12 - Math.floor(index / 4)),
  serpentRadius: index >= 12 ? 7 : 6,
  completionBonus: 300 + index * 100,
}));

const CELL = {
  EMPTY: 0,
  FILLED: 1,
  TRAIL: 2,
};

const STORAGE_KEY = "styx-qix-high-score";
const TAU = Math.PI * 2;

const input = {
  direction: null,
};

const game = {
  state: "menu",
  result: "idle",
  highScore: loadHighScore(),
  score: 0,
  levelIndex: 0,
  capture: 0,
  lives: 3,
  time: 0,
  lastTick: 0,
  moveBudget: 0,
  flash: 0,
  board: createBoard(),
  player: createPlayer(),
  serpent: createSerpent(createBoard(), LEVELS[0]),
  notice: {
    text: "Ferme une zone sans laisser le serpent toucher ta trace.",
    timer: 0,
  },
};

function loadHighScore() {
  try {
    return Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    return;
  }
}

function createBoard() {
  const board = Array.from({ length: BOARD.rows }, () =>
    Array(BOARD.cols).fill(CELL.EMPTY)
  );

  for (let y = 0; y < BOARD.rows; y += 1) {
    for (let x = 0; x < BOARD.cols; x += 1) {
      if (x === 0 || y === 0 || x === BOARD.cols - 1 || y === BOARD.rows - 1) {
        board[y][x] = CELL.FILLED;
      }
    }
  }

  return board;
}

function createPlayer() {
  return {
    x: 0,
    y: Math.floor(BOARD.rows / 2),
    drawing: false,
    trail: [],
  };
}

function createSerpent(board, level) {
  const spawn = findOpenSpawn(board);
  const x = cellCenter(spawn.x);
  const y = cellCenter(spawn.y);
  const vx = Math.random() < 0.5 ? 170 : -170;
  const vy = Math.random() < 0.5 ? 128 : -128;

  return {
    x,
    y,
    vx,
    vy,
    radius: level.serpentRadius,
    spacing: level.serpentSpacing,
    segments: Array.from({ length: level.serpentLength }, () => ({ x, y })),
  };
}

function findOpenSpawn(board) {
  const fallback = { x: Math.floor(BOARD.cols / 2), y: Math.floor(BOARD.rows / 2) };
  if (board[fallback.y]?.[fallback.x] === CELL.EMPTY) {
    return fallback;
  }

  for (let attempt = 0; attempt < 400; attempt += 1) {
    const x = 1 + Math.floor(Math.random() * (BOARD.cols - 2));
    const y = 1 + Math.floor(Math.random() * (BOARD.rows - 2));
    if (board[y][x] === CELL.EMPTY) {
      return { x, y };
    }
  }

  return { x: 1, y: 1 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cellCenter(value) {
  return value * BOARD.cell + BOARD.cell / 2;
}

function pixelToCell(value) {
  return Math.floor(value / BOARD.cell);
}

function insideBoard(x, y) {
  return x >= 0 && x < BOARD.cols && y >= 0 && y < BOARD.rows;
}

function setNotice(text, duration = 1.8) {
  game.notice.text = text;
  game.notice.timer = duration;
}

function currentLevel() {
  return LEVELS[Math.min(game.levelIndex, LEVELS.length - 1)];
}

function nextLevel() {
  return LEVELS[game.levelIndex + 1] ?? null;
}

function setupLevel(levelIndex, { resetProgress = false } = {}) {
  game.levelIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
  game.board = createBoard();
  game.player = createPlayer();
  game.serpent = createSerpent(game.board, currentLevel());
  game.capture = 0;
  game.result = "idle";
  game.moveBudget = 0;
  game.flash = 0;
  if (resetProgress) {
    game.score = 0;
    game.lives = 3;
    game.time = 0;
  }
  setDirection(null);
  recomputeCapture();
  setNotice(
    `Niveau ${currentLevel().number}/${TOTAL_LEVELS} : objectif ${currentLevel().targetCapture}%`,
    2.4
  );
}

function beginGame() {
  setupLevel(0, { resetProgress: true });
  setState("playing");
}

function startNextLevel() {
  const upcoming = nextLevel();
  if (!upcoming) {
    finishRun("won");
    return;
  }
  setupLevel(game.levelIndex + 1);
  setState("playing");
}

function setState(nextState) {
  game.state = nextState;
  syncChrome();
}

function togglePause() {
  if (game.state === "playing") {
    setState("paused");
    return;
  }

  if (game.state === "paused") {
    setState("playing");
  }
}

function finishRun(result) {
  game.result = result;
  if (game.score > game.highScore) {
    game.highScore = game.score;
    saveHighScore(game.highScore);
  }
  setState(result === "won" ? "campaignwon" : "gameover");
}

function recomputeCapture() {
  let filled = 0;
  for (let y = 1; y < BOARD.rows - 1; y += 1) {
    for (let x = 1; x < BOARD.cols - 1; x += 1) {
      if (game.board[y][x] === CELL.FILLED) {
        filled += 1;
      }
    }
  }

  game.capture = (filled / BOARD.baseArea) * 100;
}

function clearTrail() {
  for (const point of game.player.trail) {
    if (insideBoard(point.x, point.y) && game.board[point.y][point.x] === CELL.TRAIL) {
      game.board[point.y][point.x] = CELL.EMPTY;
    }
  }
  game.player.trail = [];
  game.player.drawing = false;
}

function completeLevel() {
  const level = currentLevel();
  const awardLife = level.number % 5 === 0 && level.number < TOTAL_LEVELS;

  game.score += level.completionBonus;
  game.flash = 0.18;
  game.moveBudget = 0;
  setDirection(null);

  if (awardLife) {
    game.lives = Math.min(MAX_LIVES, game.lives + 1);
  }

  if (level.number >= TOTAL_LEVELS) {
    setNotice(
      `Niveau ${level.number} termine. Campagne completee avec ${game.score} points.`,
      2.8
    );
    finishRun("won");
    return;
  }

  setNotice(
    `Niveau ${level.number} termine. Bonus ${level.completionBonus}${awardLife ? " et +1 vie" : ""}.`,
    2.6
  );
  setState("levelclear");
}

function directionVector(name) {
  if (name === "up") {
    return { x: 0, y: -1 };
  }
  if (name === "down") {
    return { x: 0, y: 1 };
  }
  if (name === "left") {
    return { x: -1, y: 0 };
  }
  if (name === "right") {
    return { x: 1, y: 0 };
  }
  return null;
}

function advancePlayer() {
  if (!input.direction) {
    return;
  }

  const vector = directionVector(input.direction);
  const nextX = game.player.x + vector.x;
  const nextY = game.player.y + vector.y;

  if (!insideBoard(nextX, nextY)) {
    return;
  }

  const nextCell = game.board[nextY][nextX];

  if (!game.player.drawing) {
    if (nextCell === CELL.FILLED) {
      game.player.x = nextX;
      game.player.y = nextY;
      return;
    }

    if (nextCell === CELL.EMPTY) {
      game.player.x = nextX;
      game.player.y = nextY;
      game.player.drawing = true;
      game.player.trail = [{ x: nextX, y: nextY }];
      game.board[nextY][nextX] = CELL.TRAIL;
    }
    return;
  }

  if (nextCell === CELL.TRAIL) {
    loseLife("Ta propre trace s'est coupee.");
    return;
  }

  game.player.x = nextX;
  game.player.y = nextY;

  if (nextCell === CELL.EMPTY) {
    game.player.trail.push({ x: nextX, y: nextY });
    game.board[nextY][nextX] = CELL.TRAIL;
    return;
  }

  if (nextCell === CELL.FILLED) {
    sealTrail();
  }
}

function sealTrail() {
  const reachable = Array.from({ length: BOARD.rows }, () =>
    Array(BOARD.cols).fill(false)
  );
  const queue = [];
  const seenSeeds = new Set();

  for (const segment of game.serpent.segments) {
    const cellX = pixelToCell(segment.x);
    const cellY = pixelToCell(segment.y);
    const key = `${cellX}:${cellY}`;

    if (
      insideBoard(cellX, cellY) &&
      game.board[cellY][cellX] === CELL.EMPTY &&
      !seenSeeds.has(key)
    ) {
      seenSeeds.add(key);
      reachable[cellY][cellX] = true;
      queue.push({ x: cellX, y: cellY });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      if (!insideBoard(neighbor.x, neighbor.y)) {
        continue;
      }
      if (reachable[neighbor.y][neighbor.x]) {
        continue;
      }
      if (game.board[neighbor.y][neighbor.x] !== CELL.EMPTY) {
        continue;
      }
      reachable[neighbor.y][neighbor.x] = true;
      queue.push(neighbor);
    }
  }

  const traceLength = game.player.trail.length;
  let captured = 0;

  for (let y = 1; y < BOARD.rows - 1; y += 1) {
    for (let x = 1; x < BOARD.cols - 1; x += 1) {
      if (game.board[y][x] === CELL.TRAIL) {
        game.board[y][x] = CELL.FILLED;
        continue;
      }

      if (game.board[y][x] === CELL.EMPTY && !reachable[y][x]) {
        game.board[y][x] = CELL.FILLED;
        captured += 1;
      }
    }
  }

  game.player.trail = [];
  game.player.drawing = false;
  game.moveBudget = 0;

  if (captured > 0) {
    game.score += captured * 12 + traceLength * 4;
    recomputeCapture();
    game.flash = 0.12;
    setNotice(`Zone verrouillee : ${captured} cellules capturees.`, 1.8);
  } else {
    recomputeCapture();
    setNotice("Trace fermee, mais aucune surface n'a ete capturee.", 1.6);
  }

  if (game.capture >= currentLevel().targetCapture) {
    completeLevel();
  }
}

function loseLife(reason) {
  if (game.state !== "playing") {
    return;
  }

  clearTrail();
  game.lives -= 1;
  game.flash = 0.24;
  game.moveBudget = 0;

  if (game.lives <= 0) {
    setNotice(reason, 2);
    finishRun("lost");
    return;
  }

  game.player = createPlayer();
  game.serpent = createSerpent(game.board, currentLevel());
  setDirection(null);
  setNotice(`${reason} Vie perdue.`, 2);
}

function canSerpentOccupy(x, y) {
  const offsets = [
    { x: 0, y: 0 },
    { x: game.serpent.radius, y: 0 },
    { x: -game.serpent.radius, y: 0 },
    { x: 0, y: game.serpent.radius },
    { x: 0, y: -game.serpent.radius },
  ];

  for (const offset of offsets) {
    const cellX = pixelToCell(x + offset.x);
    const cellY = pixelToCell(y + offset.y);
    if (!insideBoard(cellX, cellY)) {
      return false;
    }
    if (game.board[cellY][cellX] === CELL.FILLED) {
      return false;
    }
  }

  return true;
}

function updateSerpent(dt) {
  const speedBoost = currentLevel().serpentSpeed + game.capture / 180;
  let nextX = game.serpent.x + game.serpent.vx * dt * speedBoost;
  let nextY = game.serpent.y + game.serpent.vy * dt * speedBoost;

  if (!canSerpentOccupy(nextX, game.serpent.y)) {
    game.serpent.vx *= -1;
    nextX = game.serpent.x + game.serpent.vx * dt * speedBoost;
  }

  if (!canSerpentOccupy(game.serpent.x, nextY)) {
    game.serpent.vy *= -1;
    nextY = game.serpent.y + game.serpent.vy * dt * speedBoost;
  }

  if (!canSerpentOccupy(nextX, nextY)) {
    game.serpent.vx *= -1;
    game.serpent.vy *= -1;
    nextX = game.serpent.x + game.serpent.vx * dt * speedBoost;
    nextY = game.serpent.y + game.serpent.vy * dt * speedBoost;
  }

  game.serpent.x = nextX;
  game.serpent.y = nextY;
  game.serpent.segments[0].x = nextX;
  game.serpent.segments[0].y = nextY;

  for (let index = 1; index < game.serpent.segments.length; index += 1) {
    const previous = game.serpent.segments[index - 1];
    const current = game.serpent.segments[index];
    const dx = previous.x - current.x;
    const dy = previous.y - current.y;
    const distance = Math.hypot(dx, dy) || 1;
    const target = game.serpent.spacing;
    if (distance > target) {
      current.x += (dx / distance) * (distance - target);
      current.y += (dy / distance) * (distance - target);
    }
  }
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSquared, 0, 1);
  const closestX = ax + abx * t;
  const closestY = ay + aby * t;
  return Math.hypot(px - closestX, py - closestY);
}

function serpentTouchesTrail() {
  const sampleStep = 4;
  const offsets = [
    { x: 0, y: 0 },
    { x: game.serpent.radius, y: 0 },
    { x: -game.serpent.radius, y: 0 },
    { x: 0, y: game.serpent.radius },
    { x: 0, y: -game.serpent.radius },
  ];

  for (let index = 0; index < game.serpent.segments.length - 1; index += 1) {
    const current = game.serpent.segments[index];
    const next = game.serpent.segments[index + 1];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / sampleStep));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const sampleX = current.x + dx * t;
      const sampleY = current.y + dy * t;

      for (const offset of offsets) {
        const cellX = pixelToCell(sampleX + offset.x);
        const cellY = pixelToCell(sampleY + offset.y);

        if (insideBoard(cellX, cellY) && game.board[cellY][cellX] === CELL.TRAIL) {
          return true;
        }
      }
    }
  }

  return false;
}

function checkSerpentCollisions() {
  const playerX = cellCenter(game.player.x);
  const playerY = cellCenter(game.player.y);
  const hitRadius = 7;

  for (let index = 0; index < game.serpent.segments.length - 1; index += 1) {
    const current = game.serpent.segments[index];
    const next = game.serpent.segments[index + 1];

    if (
      pointToSegmentDistance(
        playerX,
        playerY,
        current.x,
        current.y,
        next.x,
        next.y
      ) < hitRadius + game.serpent.radius
    ) {
      loseLife("Le serpent t'a touche.");
      return;
    }
  }

  if (!game.player.drawing) {
    return;
  }

  if (serpentTouchesTrail()) {
    loseLife("Le serpent a mordu ta trace.");
    return;
  }
}

function update(dt) {
  game.time += dt;
  game.flash = Math.max(0, game.flash - dt * 0.8);

  if (game.notice.timer > 0) {
    game.notice.timer = Math.max(0, game.notice.timer - dt);
  }

  if (game.state === "playing") {
    updateSerpent(dt);
    game.moveBudget += dt * (game.player.drawing ? 12 : 18);

    while (game.moveBudget >= 1 && game.state === "playing") {
      game.moveBudget -= 1;
      advancePlayer();
    }

    if (game.state === "playing") {
      checkSerpentCollisions();
    }
  } else if (
    game.state === "menu" ||
    game.state === "gameover" ||
    game.state === "campaignwon" ||
    game.state === "levelclear"
  ) {
    updateSerpent(dt * 0.45);
  }

  syncHud();
}

function drawBoard() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#05070d");
  gradient.addColorStop(0.5, "#090d17");
  gradient.addColorStop(1, "#04050a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < BOARD.rows; y += 1) {
    for (let x = 0; x < BOARD.cols; x += 1) {
      const cell = game.board[y][x];
      const px = x * BOARD.cell;
      const py = y * BOARD.cell;

      if (cell === CELL.FILLED) {
        ctx.fillStyle = "rgba(87, 196, 255, 0.82)";
        ctx.fillRect(px, py, BOARD.cell, BOARD.cell);
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        ctx.fillRect(px, py, BOARD.cell, 2);
      } else if (cell === CELL.TRAIL) {
        ctx.fillStyle = "rgba(255, 141, 92, 0.95)";
        ctx.fillRect(px + 1, py + 1, BOARD.cell - 2, BOARD.cell - 2);
      }
    }
  }

  ctx.strokeStyle = "rgba(145, 186, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= BOARD.cols; x += 1) {
    const lineX = x * BOARD.cell + 0.5;
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= BOARD.rows; y += 1) {
    const lineY = y * BOARD.cell + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(canvas.width, lineY);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(248, 198, 120, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

function drawTrailGlow() {
  if (game.player.trail.length === 0) {
    return;
  }

  ctx.strokeStyle = "rgba(255, 191, 122, 0.3)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let index = 0; index < game.player.trail.length; index += 1) {
    const point = game.player.trail[index];
    const x = cellCenter(point.x);
    const y = cellCenter(point.y);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function drawSerpent() {
  const outerWidth = game.serpent.radius * 2.7;
  const innerWidth = game.serpent.radius * 1.7;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
  ctx.lineWidth = outerWidth;
  ctx.beginPath();
  for (let index = 0; index < game.serpent.segments.length; index += 1) {
    const segment = game.serpent.segments[index];
    if (index === 0) {
      ctx.moveTo(segment.x, segment.y);
    } else {
      ctx.lineTo(segment.x, segment.y);
    }
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 90, 120, 0.96)";
  ctx.lineWidth = innerWidth;
  ctx.beginPath();
  for (let index = 0; index < game.serpent.segments.length; index += 1) {
    const segment = game.serpent.segments[index];
    if (index === 0) {
      ctx.moveTo(segment.x, segment.y);
    } else {
      ctx.lineTo(segment.x, segment.y);
    }
  }
  ctx.stroke();

  ctx.fillStyle = "#ffe6a6";
  ctx.beginPath();
  ctx.arc(game.serpent.x, game.serpent.y, game.serpent.radius, 0, TAU);
  ctx.fill();
}

function drawPlayer() {
  const x = cellCenter(game.player.x);
  const y = cellCenter(game.player.y);
  const size = 6.4;
  const pulse = 1 + Math.sin(game.time * 9) * 0.08;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);

  ctx.fillStyle = game.player.drawing ? "#fff5d7" : "#ffffff";
  ctx.fillRect(-size * pulse, -size * pulse, size * 2 * pulse, size * 2 * pulse);

  ctx.strokeStyle = game.player.drawing ? "#ff9e6a" : "#86d4ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(-size * pulse, -size * pulse, size * 2 * pulse, size * 2 * pulse);
  ctx.restore();
}

function drawFlash() {
  if (game.flash <= 0) {
    return;
  }

  ctx.fillStyle = `rgba(255, 248, 234, ${game.flash})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTargetText() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.font = '700 14px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillText(
    `NIVEAU ${currentLevel().number}/${TOTAL_LEVELS}  OBJECTIF ${currentLevel().targetCapture}%`,
    16,
    24
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawTrailGlow();
  drawSerpent();
  drawPlayer();
  drawTargetText();
  drawFlash();
}

function frame(timestamp) {
  if (!game.lastTick) {
    game.lastTick = timestamp;
  }

  const dt = Math.min((timestamp - game.lastTick) / 1000, 0.033);
  game.lastTick = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function syncHud() {
  statScore.textContent = String(game.score);
  statLevel.textContent = `${currentLevel().number} / ${TOTAL_LEVELS}`;
  statCapture.textContent = `${Math.floor(game.capture)}%`;
  statLives.textContent = String(game.lives);
  statTrace.textContent = String(game.player.trail.length);
  statHighscore.textContent = String(game.highScore);
  statusText.textContent =
    game.notice.timer > 0
      ? game.notice.text
      : "Ferme une zone sans laisser le serpent toucher ta trace.";
}

function overlayMarkup() {
  if (game.state === "menu") {
    return `
      <div class="overlay-card">
        <p class="eyebrow">Styx, version Qix</p>
        <h2>CAPTURE</h2>
        <p class="overlay-copy">
          Quitte le bord bleu, trace dans la zone noire, puis reviens au bleu
          pour verrouiller une surface. Le serpent rouge ne doit jamais toucher
          ton trace.
        </p>
        <p class="overlay-stats">
          Campagne de ${TOTAL_LEVELS} niveaux. Niveau 1 : objectif ${LEVELS[0].targetCapture}%.
        </p>
        <div class="overlay-buttons">
          <button class="button button-primary" data-action="start" type="button">Lancer la partie</button>
        </div>
      </div>
    `;
  }

  if (game.state === "paused") {
    return `
      <div class="overlay-card">
        <p class="eyebrow">Pause</p>
        <h2>STYX</h2>
        <p class="overlay-copy">
          Niveau ${currentLevel().number}/${TOTAL_LEVELS}, ${Math.floor(game.capture)}% capture, ${game.score} points, ${game.lives} vies restantes.
        </p>
        <div class="overlay-buttons">
          <button class="button button-primary" data-action="resume" type="button">Reprendre</button>
          <button class="button button-secondary" data-action="restart" type="button">Recommencer</button>
        </div>
      </div>
    `;
  }

  if (game.state === "levelclear") {
    const finishedLevel = currentLevel();
    const upcoming = nextLevel();
    const lifeReward = finishedLevel.number % 5 === 0 ? " Une vie bonus a ete accordee." : "";

    return `
      <div class="overlay-card">
        <p class="eyebrow">Niveau ${finishedLevel.number} termine</p>
        <h2>SUIVANT</h2>
        <p class="overlay-copy">
          ${Math.floor(game.capture)}% captures sur ce niveau. Bonus ${finishedLevel.completionBonus}.${lifeReward}
        </p>
        <p class="overlay-stats">
          Prochain niveau : ${upcoming.number}/${TOTAL_LEVELS}, objectif ${upcoming.targetCapture}%.
        </p>
        <div class="overlay-buttons">
          <button class="button button-primary" data-action="next-level" type="button">Niveau suivant</button>
          <button class="button button-secondary" data-action="restart" type="button">Recommencer</button>
        </div>
      </div>
    `;
  }

  if (game.state === "campaignwon") {
    return `
      <div class="overlay-card">
        <p class="eyebrow">Campagne completee</p>
        <h2>VICTOIRE</h2>
        <p class="overlay-copy">
          Tu as termine les ${TOTAL_LEVELS} niveaux et marque ${game.score} points.
        </p>
        <p class="overlay-stats">Record : ${game.highScore}</p>
        <div class="overlay-buttons">
          <button class="button button-primary" data-action="restart" type="button">Rejouer la campagne</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="overlay-card">
      <p class="eyebrow">Le serpent a gagne</p>
      <h2>PERDU</h2>
      <p class="overlay-copy">
        Niveau ${currentLevel().number}/${TOTAL_LEVELS}, ${Math.floor(game.capture)}% capture, ${game.score} points.
      </p>
      <p class="overlay-stats">Record : ${game.highScore}</p>
      <div class="overlay-buttons">
        <button class="button button-primary" data-action="restart" type="button">Rejouer la campagne</button>
      </div>
    </div>
  `;
}

function syncChrome() {
  overlay.classList.toggle("is-hidden", game.state === "playing");
  overlay.innerHTML = game.state === "playing" ? "" : overlayMarkup();
  startButton.textContent = game.state === "playing" ? "Nouvelle campagne" : "Jouer";
  pauseButton.disabled = !(game.state === "playing" || game.state === "paused");
  pauseButton.textContent = game.state === "paused" ? "Reprendre" : "Pause";
  syncHud();
}

function setDirection(name) {
  input.direction = name;

  for (const button of touchButtons) {
    button.classList.toggle("is-active", button.dataset.touchDir === name);
  }
}

function keyToDirection(key) {
  if (key === "ArrowUp" || key === "w" || key === "W") {
    return "up";
  }
  if (key === "ArrowDown" || key === "s" || key === "S") {
    return "down";
  }
  if (key === "ArrowLeft" || key === "a" || key === "A") {
    return "left";
  }
  if (key === "ArrowRight" || key === "d" || key === "D") {
    return "right";
  }
  return null;
}

window.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    (game.state === "menu" || game.state === "gameover" || game.state === "campaignwon")
  ) {
    beginGame();
    return;
  }

  if (event.key === "Enter" && game.state === "levelclear") {
    startNextLevel();
    return;
  }

  if (event.key === "p" || event.key === "P" || event.key === "Escape") {
    togglePause();
    return;
  }

  const direction = keyToDirection(event.key);
  if (direction) {
    event.preventDefault();
    setDirection(direction);
  }
});

for (const button of touchButtons) {
  const direction = button.dataset.touchDir;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setDirection(direction);
  });
}

startButton.addEventListener("click", () => {
  beginGame();
});

pauseButton.addEventListener("click", () => {
  togglePause();
});

overlay.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) {
    return;
  }

  if (action === "start" || action === "restart") {
    beginGame();
    return;
  }

  if (action === "next-level") {
    startNextLevel();
    return;
  }

  if (action === "resume") {
    setState("playing");
  }
});

setupLevel(0, { resetProgress: true });
setState("menu");
requestAnimationFrame(frame);
