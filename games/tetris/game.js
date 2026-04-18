const COLS = 10;
const ROWS = 20;
const CELL = 32;
const PREVIEW_CELL = 28;
const BASE_DROP_INTERVAL = 900;

const COLORS = {
  I: "#59f4ff",
  J: "#4d83ff",
  L: "#ffb04f",
  O: "#ffe66d",
  S: "#6bf7a0",
  T: "#d282ff",
  Z: "#ff6b87",
  ghost: "rgba(255, 255, 255, 0.22)",
};

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next-canvas");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold-canvas");
const holdCtx = holdCanvas.getContext("2d");

const scoreNode = document.getElementById("score");
const linesNode = document.getElementById("lines");
const levelNode = document.getElementById("level");
const timeNode = document.getElementById("time");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startButton = document.getElementById("start-button");

const state = {
  board: createBoard(),
  current: null,
  queue: [],
  hold: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 1,
  dropInterval: BASE_DROP_INTERVAL,
  dropAccumulator: 0,
  lastFrame: 0,
  gameStarted: false,
  isPaused: false,
  isGameOver: false,
  startTime: 0,
  elapsedBeforePause: 0,
  rafId: 0,
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function rotateMatrix(matrix, direction = 1) {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array(size).fill(0));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (direction > 0) {
        rotated[x][size - 1 - y] = matrix[y][x];
      } else {
        rotated[size - 1 - x][y] = matrix[y][x];
      }
    }
  }

  return rotated;
}

function createBag() {
  const pieces = Object.keys(SHAPES);
  for (let i = pieces.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

function refillQueue() {
  while (state.queue.length < 5) {
    state.queue.push(...createBag());
  }
}

function createPiece(type) {
  const matrix = cloneMatrix(SHAPES[type]);
  return {
    type,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: -getTopPadding(matrix),
  };
}

function getTopPadding(matrix) {
  for (let y = 0; y < matrix.length; y += 1) {
    if (matrix[y].some(Boolean)) {
      return y;
    }
  }
  return 0;
}

function isInside(x, y) {
  return x >= 0 && x < COLS && y < ROWS;
}

function collides(piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) {
        continue;
      }

      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;

      if (boardY < 0) {
        if (boardX < 0 || boardX >= COLS) {
          return true;
        }
        continue;
      }

      if (!isInside(boardX, boardY) || state.board[boardY][boardX]) {
        return true;
      }
    }
  }

  return false;
}

function mergePiece(piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      const boardY = piece.y + y;
      if (boardY >= 0) {
        state.board[boardY][piece.x + x] = piece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (state.board[y].every(Boolean)) {
      state.board.splice(y, 1);
      state.board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (!cleared) {
    return;
  }

  const lineScores = [0, 100, 300, 500, 800];
  state.lines += cleared;
  state.score += lineScores[cleared] * state.level;
  state.level = Math.floor(state.lines / 10) + 1;
  state.dropInterval = Math.max(120, BASE_DROP_INTERVAL - (state.level - 1) * 70);
  updateStats();
}

function spawnNextPiece() {
  refillQueue();
  const nextType = state.queue.shift();
  state.current = createPiece(nextType);
  state.canHold = true;
  drawPreview(nextCtx, state.queue[0]);

  if (collides(state.current)) {
    endGame();
  }
}

function hardDrop() {
  if (!canPlay()) {
    return;
  }

  let distance = 0;
  while (!collides(state.current, 0, distance + 1)) {
    distance += 1;
  }

  state.current.y += distance;
  state.score += distance * 2;
  lockPiece();
  updateStats();
}

function movePiece(direction) {
  if (!canPlay()) {
    return;
  }

  if (!collides(state.current, direction, 0)) {
    state.current.x += direction;
  }
}

function softDrop() {
  if (!canPlay()) {
    return;
  }

  if (!collides(state.current, 0, 1)) {
    state.current.y += 1;
    state.score += 1;
    updateStats();
    return;
  }

  lockPiece();
}

function lockPiece() {
  mergePiece(state.current);
  clearLines();
  spawnNextPiece();
  state.dropAccumulator = 0;
}

function rotatePiece(direction) {
  if (!canPlay()) {
    return;
  }

  const rotated = rotateMatrix(state.current.matrix, direction);
  const offsets = [0, -1, 1, -2, 2];

  for (const offset of offsets) {
    if (!collides(state.current, offset, 0, rotated)) {
      state.current.matrix = rotated;
      state.current.x += offset;
      return;
    }
  }
}

function holdPiece() {
  if (!canPlay() || !state.canHold) {
    return;
  }

  const currentType = state.current.type;
  if (state.hold) {
    state.current = createPiece(state.hold);
    state.hold = currentType;
  } else {
    state.hold = currentType;
    spawnNextPiece();
  }

  state.canHold = false;
  drawPreview(holdCtx, state.hold);

  if (collides(state.current)) {
    endGame();
  }
}

function getGhostPiece() {
  const ghost = {
    ...state.current,
    matrix: state.current.matrix,
    x: state.current.x,
    y: state.current.y,
  };

  while (!collides(ghost, 0, 1)) {
    ghost.y += 1;
  }

  return ghost;
}

function drawCell(ctx, x, y, color, size, alpha = 1) {
  const px = x * size;
  const py = y * size;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(px + 4, py + 4, size - 8, Math.max(4, size * 0.18));

  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
  ctx.restore();
}

function drawGrid() {
  boardCtx.save();
  boardCtx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  boardCtx.lineWidth = 1;

  for (let x = 0; x <= COLS; x += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(x * CELL + 0.5, 0);
    boardCtx.lineTo(x * CELL + 0.5, ROWS * CELL);
    boardCtx.stroke();
  }

  for (let y = 0; y <= ROWS; y += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, y * CELL + 0.5);
    boardCtx.lineTo(COLS * CELL, y * CELL + 0.5);
    boardCtx.stroke();
  }

  boardCtx.restore();
}

function drawBoard() {
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = "#07101b";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawGrid();

  state.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        drawCell(boardCtx, x, y, COLORS[cell], CELL);
      }
    });
  });

  if (state.current) {
    const ghost = getGhostPiece();
    drawPiece(ghost, COLORS.ghost, 0.75);
    drawPiece(state.current);
  }
}

function drawPiece(piece, overrideColor = null, alpha = 1) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      const boardY = piece.y + y;
      if (boardY < 0) {
        return;
      }

      drawCell(
        boardCtx,
        piece.x + x,
        boardY,
        overrideColor || COLORS[piece.type],
        CELL,
        alpha
      );
    });
  });
}

function drawPreview(ctx, type) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#07101b";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!type) {
    return;
  }

  const matrix = SHAPES[type];
  const offsetX = Math.floor((ctx.canvas.width - matrix[0].length * PREVIEW_CELL) / 2 / PREVIEW_CELL);
  const offsetY = Math.floor((ctx.canvas.height - matrix.length * PREVIEW_CELL) / 2 / PREVIEW_CELL);

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      drawCell(ctx, offsetX + x, offsetY + y, COLORS[type], PREVIEW_CELL);
    });
  });
}

function updateStats() {
  scoreNode.textContent = state.score.toString();
  linesNode.textContent = state.lines.toString();
  levelNode.textContent = state.level.toString();
}

function updateTimer(now = performance.now()) {
  if (!state.gameStarted) {
    timeNode.textContent = "00:00";
    return;
  }

  const elapsed = state.isPaused || state.isGameOver
    ? state.elapsedBeforePause
    : state.elapsedBeforePause + (now - state.startTime);

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  timeNode.textContent = `${minutes}:${seconds}`;
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetState() {
  state.board = createBoard();
  state.queue = [];
  state.hold = null;
  state.current = null;
  state.canHold = true;
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.dropInterval = BASE_DROP_INTERVAL;
  state.dropAccumulator = 0;
  state.lastFrame = 0;
  state.gameStarted = true;
  state.isPaused = false;
  state.isGameOver = false;
  state.startTime = performance.now();
  state.elapsedBeforePause = 0;
  updateStats();
  updateTimer();
  refillQueue();
  drawPreview(holdCtx, null);
  spawnNextPiece();
}

function startGame() {
  resetState();
  hideOverlay();
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
  state.elapsedBeforePause += performance.now() - state.startTime;
  state.isGameOver = true;
  state.isPaused = false;
  showOverlay(
    "Partie terminée",
    `Tu as marqué ${state.score} points en nettoyant ${state.lines} ligne(s).`,
    "Rejouer"
  );
}

function togglePause() {
  if (!state.gameStarted || state.isGameOver) {
    return;
  }

  state.isPaused = !state.isPaused;

  if (state.isPaused) {
    state.elapsedBeforePause += performance.now() - state.startTime;
    showOverlay("Pause", "La partie est en pause. Reprends quand tu veux.", "Reprendre");
  } else {
    state.startTime = performance.now();
    hideOverlay();
  }
}

function canPlay() {
  return state.gameStarted && !state.isPaused && !state.isGameOver;
}

function gameLoop(timestamp) {
  if (!state.gameStarted) {
    return;
  }

  if (!state.lastFrame) {
    state.lastFrame = timestamp;
  }

  const delta = timestamp - state.lastFrame;
  state.lastFrame = timestamp;

  if (!state.isPaused && !state.isGameOver) {
    state.dropAccumulator += delta;
    if (state.dropAccumulator >= state.dropInterval) {
      state.dropAccumulator = 0;
      if (!collides(state.current, 0, 1)) {
        state.current.y += 1;
      } else {
        lockPiece();
      }
    }
  }

  drawBoard();
  drawPreview(nextCtx, state.queue[0]);
  drawPreview(holdCtx, state.hold);
  updateTimer(timestamp);
  state.rafId = requestAnimationFrame(gameLoop);
}

function handleAction(action) {
  switch (action) {
    case "left":
      movePiece(-1);
      break;
    case "right":
      movePiece(1);
      break;
    case "down":
      softDrop();
      break;
    case "rotate":
      rotatePiece(1);
      break;
    case "rotate-ccw":
      rotatePiece(-1);
      break;
    case "drop":
      hardDrop();
      break;
    case "hold":
      holdPiece();
      break;
    case "pause":
      if (!state.gameStarted || state.isGameOver) {
        startGame();
      } else {
        togglePause();
      }
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const actionMap = {
    arrowleft: "left",
    arrowright: "right",
    arrowdown: "down",
    arrowup: "rotate",
    a: "left",
    d: "right",
    s: "down",
    w: "rotate",
    x: "rotate",
    z: "rotate-ccw",
    " ": "drop",
    c: "hold",
    p: "pause",
  };

  const action = actionMap[key];
  if (!action) {
    return;
  }

  event.preventDefault();

  if (!state.gameStarted && action !== "pause") {
    startGame();
  }

  handleAction(action);
});

startButton.addEventListener("click", () => {
  if (state.isPaused && !state.isGameOver) {
    togglePause();
  } else {
    startGame();
  }
});

document.querySelectorAll(".touch-controls button").forEach((button) => {
  const action = button.dataset.action;
  const runAction = (event) => {
    event.preventDefault();
    if (!state.gameStarted && action !== "pause") {
      startGame();
    }
    handleAction(action);
  };

  button.addEventListener("pointerdown", runAction);
});

drawBoard();
drawPreview(nextCtx, null);
drawPreview(holdCtx, null);
updateStats();
updateTimer();
