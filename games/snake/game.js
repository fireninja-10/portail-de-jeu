const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const scoreNode = document.querySelector("#score");
const bestScoreNode = document.querySelector("#best-score");
const applesNode = document.querySelector("#apples");
const speedNode = document.querySelector("#speed");

const touchButtons = [...document.querySelectorAll("[data-action]")];

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const bestScoreKey = "snake-best-score";

let animationFrame = 0;
let lastTick = 0;
let tickDelay = 150;
let running = false;
let paused = false;

let snake;
let direction;
let nextDirection;
let apple;
let score;
let apples;

function loadBestScore() {
  const savedScore = window.localStorage.getItem(bestScoreKey);
  return Number.parseInt(savedScore || "0", 10) || 0;
}

let bestScore = loadBestScore();
bestScoreNode.textContent = String(bestScore);

function spawnApple() {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };

    const occupied = snake?.some(
      (segment) => segment.x === candidate.x && segment.y === candidate.y,
    );

    if (!occupied) {
      return candidate;
    }
  }
}

function updateStats() {
  scoreNode.textContent = String(score);
  applesNode.textContent = String(apples);
  speedNode.textContent = `${Math.round((150 / tickDelay) * 10) / 10}x`;

  if (score > bestScore) {
    bestScore = score;
    bestScoreNode.textContent = String(bestScore);
    window.localStorage.setItem(bestScoreKey, String(bestScore));
  }
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function drawBoard() {
  ctx.fillStyle = "#192114";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < tileCount; x += 1) {
    for (let y = 0; y < tileCount; y += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#22301a" : "#1d2816";
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function drawApple() {
  const centerX = apple.x * gridSize + gridSize / 2;
  const centerY = apple.y * gridSize + gridSize / 2;

  ctx.fillStyle = "#d24b32";
  ctx.beginPath();
  ctx.arc(centerX, centerY, gridSize * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#7ab34e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 4);
  ctx.lineTo(centerX + 3, centerY - 12);
  ctx.stroke();

  ctx.fillStyle = "#8fcf61";
  ctx.beginPath();
  ctx.ellipse(centerX + 7, centerY - 10, 5, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;

    ctx.fillStyle = index === 0 ? "#b7f56b" : "#74a14b";
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, gridSize - 4, gridSize - 4, 6);
    ctx.fill();

    if (index === 0) {
      const eyeY = y + gridSize / 2;
      const leftEyeX = direction.x > 0 ? x + 13 : x + 7;
      const rightEyeX = direction.x > 0 ? x + 13 : x + 7;
      const topEyeY = direction.y > 0 ? y + 13 : y + 7;
      const bottomEyeY = direction.y < 0 ? y + 7 : y + 13;

      ctx.fillStyle = "#192114";
      ctx.beginPath();
      if (direction.x !== 0) {
        ctx.arc(leftEyeX, y + 7, 2.2, 0, Math.PI * 2);
        ctx.arc(rightEyeX, y + 13, 2.2, 0, Math.PI * 2);
      } else {
        ctx.arc(x + 7, topEyeY, 2.2, 0, Math.PI * 2);
        ctx.arc(x + 13, bottomEyeY, 2.2, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  });
}

function draw() {
  drawBoard();
  drawApple();
  drawSnake();
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  apple = spawnApple();
  score = 0;
  apples = 0;
  tickDelay = 150;
  running = false;
  paused = false;
  lastTick = 0;
  updateStats();
  draw();
  showOverlay("Lance une partie", "Attrape les pommes rouges pour allonger le serpent.");
}

function setDirection(x, y) {
  if (direction.x === -x && direction.y === -y) {
    return;
  }

  nextDirection = { x, y };
}

function endGame() {
  running = false;
  paused = false;
  showOverlay("Perdu", `Score final: ${score}. Appuie sur Jouer ou Rejouer.`);
}

function step() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitsWall =
    head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
  const hitsSelf = snake.some(
    (segment) => segment.x === head.x && segment.y === head.y,
  );

  if (hitsWall || hitsSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    apples += 1;
    score += 10;
    tickDelay = Math.max(70, tickDelay - 4);
    apple = spawnApple();
  } else {
    snake.pop();
  }

  updateStats();
  draw();
}

function gameLoop(timestamp) {
  if (!running || paused) {
    return;
  }

  if (!lastTick) {
    lastTick = timestamp;
  }

  if (timestamp - lastTick >= tickDelay) {
    step();
    lastTick = timestamp;
  }

  if (running) {
    animationFrame = window.requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  if (!running) {
    running = true;
    paused = false;
    lastTick = 0;
    hideOverlay();
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(gameLoop);
    return;
  }

  if (paused) {
    togglePause();
  }
}

function togglePause() {
  if (!running) {
    return;
  }

  paused = !paused;

  if (paused) {
    showOverlay("Pause", "Appuie sur P ou sur Jouer pour reprendre.");
    return;
  }

  hideOverlay();
  lastTick = 0;
  animationFrame = window.requestAnimationFrame(gameLoop);
}

function restartGame(andStart = true) {
  window.cancelAnimationFrame(animationFrame);
  resetGame();

  if (andStart) {
    startGame();
  }
}

function handleAction(action) {
  if (action === "up") {
    setDirection(0, -1);
  } else if (action === "down") {
    setDirection(0, 1);
  } else if (action === "left") {
    setDirection(-1, 0);
  } else if (action === "right") {
    setDirection(1, 0);
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "z"].includes(key)) {
    event.preventDefault();
    setDirection(0, -1);
  } else if (["arrowdown", "s"].includes(key)) {
    event.preventDefault();
    setDirection(0, 1);
  } else if (["arrowleft", "q"].includes(key)) {
    event.preventDefault();
    setDirection(-1, 0);
  } else if (["arrowright", "d"].includes(key)) {
    event.preventDefault();
    setDirection(1, 0);
  } else if (key === " ") {
    event.preventDefault();
    if (!running) {
      startGame();
    }
  } else if (key === "p") {
    event.preventDefault();
    togglePause();
  }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", () => restartGame(true));

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleAction(button.dataset.action);
  });
});

resetGame();
