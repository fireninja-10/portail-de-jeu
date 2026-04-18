const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const playButton = document.getElementById("play-button");

const STORAGE_KEY = "flappy-bird-best-score";
const BASE_PIPE_WIDTH = 102;
const BASE_PIPE_GAP = Math.round(84 * 2.5);
const BASE_SPAWN_INTERVAL = 1.42 * 1.25;
const MIN_SPAWN_INTERVAL = 1.08 * 1.25;
const BASE_CEILING_HEIGHT = 18;
const PIPE_TYPES = {
  rusted: {
    key: "rusted",
    points: 1,
    chance: 0,
    bodyStops: [
      [0, "#4b342c"],
      [0.22, "#8b573f"],
      [0.5, "#b47452"],
      [0.78, "#704837"],
      [1, "#43302a"],
    ],
    capStops: [
      [0, "#55362b"],
      [0.24, "#a66944"],
      [0.5, "#cf8a5d"],
      [0.78, "#7f523c"],
      [1, "#4a3027"],
    ],
    highlightStops: [
      [0, "rgba(255, 242, 221, 0.05)"],
      [0.28, "rgba(255, 217, 181, 0.18)"],
      [0.62, "rgba(135, 69, 34, 0.16)"],
      [1, "rgba(58, 31, 16, 0.2)"],
    ],
    glowColor: "rgba(131, 76, 37, 0.22)",
    stripeColor: "rgba(78, 44, 23, 0.42)",
    capHighlight: "rgba(255, 232, 206, 0.18)",
    capStroke: "rgba(69, 40, 24, 0.38)",
    badgeFill: "rgba(102, 61, 38, 0.94)",
    badgeStroke: "rgba(45, 25, 16, 0.52)",
    badgeText: "#f7dcc4",
  },
  bronze: {
    key: "bronze",
    points: 3,
    chance: 1 / 5,
    bodyStops: [
      [0, "#604120"],
      [0.2, "#a86e2a"],
      [0.5, "#d1903f"],
      [0.8, "#8a5b24"],
      [1, "#58381d"],
    ],
    capStops: [
      [0, "#6c4318"],
      [0.22, "#b77729"],
      [0.5, "#e1a153"],
      [0.8, "#986026"],
      [1, "#673e1b"],
    ],
    highlightStops: [
      [0, "rgba(255, 245, 214, 0.06)"],
      [0.28, "rgba(255, 217, 145, 0.24)"],
      [0.58, "rgba(173, 95, 25, 0.12)"],
      [1, "rgba(78, 43, 9, 0.2)"],
    ],
    glowColor: "rgba(219, 143, 55, 0.26)",
    stripeColor: "rgba(95, 56, 17, 0.44)",
    capHighlight: "rgba(255, 236, 188, 0.24)",
    capStroke: "rgba(104, 62, 17, 0.34)",
    badgeFill: "rgba(185, 116, 42, 0.94)",
    badgeStroke: "rgba(92, 55, 18, 0.48)",
    badgeText: "#fff3da",
  },
  silver: {
    key: "silver",
    points: 5,
    chance: 1 / 10,
    bodyStops: [
      [0, "#63717a"],
      [0.22, "#b0bcc3"],
      [0.5, "#edf3f5"],
      [0.78, "#98a5af"],
      [1, "#58636b"],
    ],
    capStops: [
      [0, "#6f7d86"],
      [0.22, "#c1ccd2"],
      [0.5, "#f7fbfd"],
      [0.8, "#a4b0b8"],
      [1, "#667079"],
    ],
    highlightStops: [
      [0, "rgba(255, 255, 255, 0.08)"],
      [0.3, "rgba(255, 255, 255, 0.3)"],
      [0.62, "rgba(210, 232, 244, 0.12)"],
      [1, "rgba(54, 63, 70, 0.18)"],
    ],
    glowColor: "rgba(216, 236, 245, 0.28)",
    stripeColor: "rgba(77, 90, 100, 0.4)",
    capHighlight: "rgba(255, 255, 255, 0.24)",
    capStroke: "rgba(78, 90, 100, 0.3)",
    badgeFill: "rgba(208, 220, 228, 0.96)",
    badgeStroke: "rgba(92, 106, 116, 0.42)",
    badgeText: "#43505a",
  },
  gold: {
    key: "gold",
    points: 10,
    chance: 1 / 20,
    bodyStops: [
      [0, "#7f5510"],
      [0.2, "#c88f1a"],
      [0.5, "#ffe17b"],
      [0.82, "#be8212"],
      [1, "#6e490c"],
    ],
    capStops: [
      [0, "#8a5d12"],
      [0.22, "#d89c1f"],
      [0.5, "#ffea96"],
      [0.8, "#c68814"],
      [1, "#744d0d"],
    ],
    highlightStops: [
      [0, "rgba(255, 255, 255, 0.06)"],
      [0.28, "rgba(255, 247, 184, 0.35)"],
      [0.58, "rgba(255, 218, 96, 0.16)"],
      [1, "rgba(91, 52, 0, 0.2)"],
    ],
    glowColor: "rgba(255, 210, 84, 0.34)",
    stripeColor: "rgba(113, 71, 8, 0.42)",
    capHighlight: "rgba(255, 246, 203, 0.3)",
    capStroke: "rgba(120, 77, 11, 0.34)",
    badgeFill: "rgba(255, 230, 140, 0.96)",
    badgeStroke: "rgba(125, 83, 11, 0.48)",
    badgeText: "#77500b",
  },
  diamond: {
    key: "diamond",
    points: 25,
    chance: 1 / 50,
    bodyStops: [
      [0, "#165f8f"],
      [0.2, "#40bde7"],
      [0.5, "#d7fdff"],
      [0.8, "#3b96d4"],
      [1, "#11496e"],
    ],
    capStops: [
      [0, "#1a76a8"],
      [0.22, "#54d2f5"],
      [0.5, "#f0ffff"],
      [0.8, "#43a8e1"],
      [1, "#165c84"],
    ],
    highlightStops: [
      [0, "rgba(255, 255, 255, 0.08)"],
      [0.28, "rgba(227, 255, 255, 0.42)"],
      [0.56, "rgba(125, 230, 255, 0.2)"],
      [1, "rgba(10, 54, 89, 0.22)"],
    ],
    glowColor: "rgba(104, 226, 255, 0.42)",
    stripeColor: "rgba(19, 89, 121, 0.42)",
    capHighlight: "rgba(233, 255, 255, 0.34)",
    capStroke: "rgba(31, 105, 138, 0.38)",
    badgeFill: "rgba(221, 252, 255, 0.96)",
    badgeStroke: "rgba(42, 118, 151, 0.44)",
    badgeText: "#11607f",
  },
};
const RARE_PIPE_TYPES = [
  PIPE_TYPES.diamond,
  PIPE_TYPES.gold,
  PIPE_TYPES.silver,
  PIPE_TYPES.bronze,
];

const state = {
  mode: "intro",
  width: 0,
  height: 0,
  ceilingHeight: BASE_CEILING_HEIGHT,
  groundHeight: 94,
  score: 0,
  best: loadBestScore(),
  time: 0,
  pipeTimer: 0,
  pipes: [],
  clouds: [],
  mountainOffset: 0,
  groundOffset: 0,
  deathCause: null,
  explosion: null,
  bird: {
    x: 140,
    y: 220,
    baseY: 220,
    vy: 0,
    rotation: 0,
    radius: 21,
    wingPhase: 0,
  },
};

const physics = {
  gravity: 1680,
  flapVelocity: -535,
  maxFallSpeed: 690,
  pipeWidth: BASE_PIPE_WIDTH,
  pipeGap: BASE_PIPE_GAP,
  pipeSpeed: 172,
  spawnInterval: BASE_SPAWN_INTERVAL,
};

function loadBestScore() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Local storage can be blocked in some private or embedded contexts.
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function applyGradientStops(gradient, stops) {
  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color);
  }
}

function pickPipeType() {
  const roll = Math.random();
  let threshold = 0;

  for (const pipeType of RARE_PIPE_TYPES) {
    threshold += pipeType.chance;
    if (roll < threshold) {
      return pipeType;
    }
  }

  return PIPE_TYPES.rusted;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();

  state.width = rect.width;
  state.height = rect.height;
  state.ceilingHeight = Math.max(14, Math.round(rect.height * 0.03));
  state.groundHeight = Math.max(82, Math.round(rect.height * 0.14));

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.bird.x = Math.round(rect.width * 0.28);
  if (state.mode !== "playing") {
    state.bird.baseY = Math.round(rect.height * 0.43);
    state.bird.y = state.bird.baseY;
  }

  if (state.clouds.length === 0) {
    state.clouds = createClouds();
  }

  syncHUD();
}

function syncHUD() {
  scoreEl.textContent = String(state.score);
  bestEl.textContent = String(state.best);
}

function resetRound() {
  state.score = 0;
  state.time = 0;
  state.pipeTimer = 0.8;
  state.pipes = [];
  state.clouds = createClouds();
  state.mountainOffset = 0;
  state.groundOffset = 0;
  state.deathCause = null;
  state.explosion = null;
  state.bird.vy = 0;
  state.bird.rotation = 0;
  state.bird.wingPhase = 0;
  state.bird.baseY = Math.round(state.height * 0.43);
  state.bird.y = state.bird.baseY;
  state.bird.x = Math.round(state.width * 0.28);
  physics.pipeSpeed = 172;
  physics.pipeGap = BASE_PIPE_GAP;
  physics.spawnInterval = BASE_SPAWN_INTERVAL;
  syncHUD();
}

function createClouds() {
  const count = 6;
  return Array.from({ length: count }, (_, index) => ({
    x: rand(0, state.width),
    y: rand(28, state.height * 0.42),
    scale: rand(0.6, 1.25),
    speed: rand(8, 20) * (index % 2 === 0 ? 1 : 0.75),
  }));
}

function showOverlay({ kicker, title, text }) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.add("is-visible");
}

function hideOverlay() {
  overlay.classList.remove("is-visible");
}

function startGame() {
  resetRound();
  state.mode = "playing";
  hideOverlay();
  state.bird.vy = physics.flapVelocity;
  state.bird.rotation = -0.45;
}

function gameOver(cause = "pipe") {
  if (state.mode === "gameover") {
    return;
  }

  state.mode = "gameover";
  state.deathCause = cause;

  if (state.score > state.best) {
    state.best = state.score;
    saveBestScore(state.best);
  }

  syncHUD();

  const finalScore = state.score;
  const scoreLabel =
    finalScore === 0 ? "aucun point" : `${finalScore} ${finalScore > 1 ? "points" : "point"}`;
  showOverlay({
    kicker: "Partie terminée",
    title: "Fin de partie",
    text: `Tu as marque ${scoreLabel}. Appuie pour rejouer.`,
  });
}

function flap() {
  if (state.mode === "intro" || state.mode === "gameover") {
    startGame();
    return;
  }

  if (state.mode !== "playing") {
    return;
  }

  state.bird.vy = physics.flapVelocity;
  state.bird.rotation = -0.48;
  state.bird.wingPhase = 0.18;
}

function spawnPipe() {
  const playHeight = state.height - state.groundHeight;
  const gap = physics.pipeGap;
  const minCenter = playHeight * 0.24;
  const maxCenter = playHeight * 0.68;
  const center = rand(minCenter, maxCenter);
  const topHeight = clamp(center - gap / 2, 72, playHeight - gap - 88);
  const type = pickPipeType();

  state.pipes.push({
    x: state.width + 110,
    width: physics.pipeWidth,
    topHeight,
    gap,
    type,
    scored: false,
  });
}

function updateDifficulty() {
  const scoreFactor = state.score;
  physics.pipeSpeed = clamp(172 + scoreFactor * 1.8, 172, 228);
  physics.pipeGap = BASE_PIPE_GAP;
  physics.spawnInterval = clamp(
    BASE_SPAWN_INTERVAL - scoreFactor * 0.01,
    MIN_SPAWN_INTERVAL,
    BASE_SPAWN_INTERVAL,
  );
}

function createExplosion(x, y, pipeType) {
  const paletteByType = {
    bronze: ["#fff3da", "#ffcb73", "#d9871e", "#9a5611"],
    silver: ["#ffffff", "#e4f0f6", "#b8c8d3", "#73818a"],
    gold: ["#fff7c2", "#ffd86b", "#ffb029", "#c4730f"],
    diamond: ["#f2ffff", "#9ceeff", "#41bee7", "#1475a7"],
    rusted: ["#ffe0b5", "#f0aa62", "#ba6f38", "#7a4728"],
  };
  const palette = paletteByType[pipeType.key] || paletteByType.rusted;
  const particleCount = 18;

  return {
    x,
    y,
    time: 0,
    duration: 0.52,
    ringColor: palette[1],
    flashColor: palette[0],
    smokeColor: pipeType.glowColor,
    particles: Array.from({ length: particleCount }, (_, index) => ({
      angle: (Math.PI * 2 * index) / particleCount + rand(-0.12, 0.12),
      speed: rand(110, 290),
      size: rand(3.5, 7.5),
      stretch: rand(0.7, 1.45),
      color: palette[index % palette.length],
    })),
  };
}

function updateExplosion(dt) {
  if (!state.explosion) {
    return;
  }

  state.explosion.time += dt;
  if (state.explosion.time >= state.explosion.duration) {
    state.explosion = null;
  }
}

function updatePlaying(dt) {
  updateDifficulty();

  const bird = state.bird;

  bird.vy = clamp(bird.vy + physics.gravity * dt, -900, physics.maxFallSpeed);
  bird.y += bird.vy * dt;
  bird.wingPhase += dt * 16;

  state.pipeTimer -= dt;
  if (state.pipeTimer <= 0) {
    spawnPipe();
    state.pipeTimer = physics.spawnInterval + rand(-0.15, 0.18);
  }

  const horizontalSpeed = physics.pipeSpeed * dt;
  const groundBand = state.groundHeight;
  const ceilingBand = state.ceilingHeight;
  const playBottom = state.height - groundBand;

  if (bird.y - bird.radius < ceilingBand) {
    bird.y = ceilingBand + bird.radius;
    bird.vy = Math.max(0, bird.vy);
  }

  let onGround = false;
  if (bird.y + bird.radius > playBottom) {
    bird.y = playBottom - bird.radius;
    bird.vy = 0;
    onGround = true;
  }

  if (onGround) {
    bird.rotation = 1.05;
  } else if (bird.y - bird.radius <= ceilingBand + 1) {
    bird.rotation = -0.18;
  } else {
    bird.rotation = clamp(bird.vy / 680, -0.5, 1.25);
  }

  for (const pipe of state.pipes) {
    pipe.x -= horizontalSpeed;

    if (!pipe.scored && pipe.x + pipe.width < bird.x - bird.radius) {
      pipe.scored = true;
      state.score += pipe.type.points;
      if (state.score > state.best) {
        state.best = state.score;
        saveBestScore(state.best);
      }
      syncHUD();
    }
  }

  state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.width > -20);

  state.clouds.forEach((cloud, index) => {
    cloud.x -= cloud.speed * dt;
    if (cloud.x < -120) {
      cloud.x = state.width + rand(80, 180);
      cloud.y = rand(24, state.height * 0.4);
      cloud.scale = rand(0.6, 1.2);
      cloud.speed = rand(8, 20) * (index % 2 === 0 ? 1 : 0.75);
    }
  });

  state.groundOffset = (state.groundOffset + physics.pipeSpeed * dt * 0.5) % 48;
  state.mountainOffset = (state.mountainOffset + physics.pipeSpeed * dt * 0.16) % state.width;

  const collidedPipe = checkPipeCollision();
  if (collidedPipe) {
    state.explosion = createExplosion(bird.x, bird.y, collidedPipe.type);
    gameOver("pipe");
  }
}

function updateIntro(dt) {
  state.time += dt;
  state.bird.wingPhase += dt * 8;
  state.bird.y = state.bird.baseY + Math.sin(state.time * 2.2) * 9;
  state.bird.rotation = Math.sin(state.time * 1.4) * 0.08;

  state.clouds.forEach((cloud, index) => {
    cloud.x -= cloud.speed * 0.25 * dt;
    if (cloud.x < -120) {
      cloud.x = state.width + rand(80, 180);
      cloud.y = rand(24, state.height * 0.4);
      cloud.scale = rand(0.6, 1.2);
      cloud.speed = rand(8, 20) * (index % 2 === 0 ? 1 : 0.75);
    }
  });
}

function updateGameOver(dt) {
  updateExplosion(dt);

  if (state.deathCause !== "pipe") {
    state.bird.vy = clamp(state.bird.vy + physics.gravity * dt, -900, physics.maxFallSpeed);
    state.bird.y = Math.min(
      state.bird.y + state.bird.vy * dt,
      state.height - state.groundHeight - state.bird.radius,
    );
    state.bird.rotation = clamp(state.bird.vy / 680, -0.5, 1.3);
    state.bird.wingPhase += dt * 7;
  }

  state.clouds.forEach((cloud, index) => {
    cloud.x -= cloud.speed * 0.18 * dt;
    if (cloud.x < -120) {
      cloud.x = state.width + rand(80, 180);
      cloud.y = rand(24, state.height * 0.4);
      cloud.scale = rand(0.6, 1.2);
      cloud.speed = rand(8, 20) * (index % 2 === 0 ? 1 : 0.75);
    }
  });
}

function checkPipeCollision() {
  const bird = state.bird;
  const birdLeft = bird.x - bird.radius;
  const birdRight = bird.x + bird.radius;
  const birdTop = bird.y - bird.radius;
  const birdBottom = bird.y + bird.radius;

  for (const pipe of state.pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;
    const gapTop = pipe.topHeight;
    const gapBottom = pipe.topHeight + pipe.gap;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < gapTop || birdBottom > gapBottom) {
        return pipe;
      }
    }
  }

  return null;
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBackground() {
  const { width, height } = state;
  const groundY = height - state.groundHeight;

  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#4e88bb");
  sky.addColorStop(0.5, "#8fc8f2");
  sky.addColorStop(0.84, "#d8ecf7");
  sky.addColorStop(1, "#f7f0dd");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const atmosphere = ctx.createLinearGradient(0, groundY - 170, 0, groundY + 12);
  atmosphere.addColorStop(0, "rgba(255, 244, 220, 0)");
  atmosphere.addColorStop(1, "rgba(255, 230, 183, 0.55)");
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, groundY - 170, width, 182);

  drawSun();
  drawMountains();
  drawClouds();
  drawGround();
}

function drawSun() {
  const { width } = state;
  const sunX = width * 0.8;
  const sunY = state.height * 0.19;
  const gradient = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 92);
  gradient.addColorStop(0, "rgba(255, 255, 245, 0.98)");
  gradient.addColorStop(0.28, "rgba(255, 236, 182, 0.94)");
  gradient.addColorStop(0.62, "rgba(255, 214, 141, 0.28)");
  gradient.addColorStop(1, "rgba(255, 214, 141, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 92, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountains() {
  const { width, height } = state;
  const groundY = height - state.groundHeight;
  const offset = state.mountainOffset;

  const layers = [
    {
      color: "#bfd0d0",
      alpha: 0.42,
      base: groundY - 138,
      peaks: [0.08, 0.21, 0.36, 0.58, 0.78, 0.94],
      heights: [0.11, 0.19, 0.13, 0.18, 0.12, 0.16],
      speed: 0.05,
    },
    {
      color: "#8fa8a3",
      alpha: 0.72,
      base: groundY - 82,
      peaks: [0.06, 0.19, 0.33, 0.48, 0.69, 0.84, 0.97],
      heights: [0.11, 0.22, 0.14, 0.24, 0.16, 0.27, 0.15],
      speed: 0.1,
    },
    {
      color: "#627d66",
      alpha: 0.96,
      base: groundY - 28,
      peaks: [0.04, 0.15, 0.26, 0.41, 0.58, 0.74, 0.89, 0.99],
      heights: [0.08, 0.16, 0.1, 0.17, 0.11, 0.2, 0.12, 0.09],
      speed: 0.16,
    },
  ];

  ctx.save();

  layers.forEach((layer) => {
    const shift = (offset * layer.speed) % width;
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha;

    for (let copy = -1; copy <= 1; copy += 1) {
      const startX = copy * width - shift;
      ctx.beginPath();
      ctx.moveTo(startX - 40, groundY);
      ctx.lineTo(startX - 40, layer.base);

      layer.peaks.forEach((peak, index) => {
        const x = startX + width * peak;
        const y = groundY - height * layer.heights[index];
        ctx.lineTo(x, y);
      });

      ctx.lineTo(startX + width + 40, layer.base);
      ctx.lineTo(startX + width + 40, groundY);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.restore();
}

function drawClouds() {
  for (const cloud of state.clouds) {
    drawCloud(cloud.x, cloud.y, cloud.scale);
  }
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(58, 84, 110, 0.12)";
  ctx.beginPath();
  ctx.ellipse(20, 16, 36, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";

  const puffs = [
    [0, 0, 18],
    [16, -9, 16],
    [33, -2, 18],
    [20, 8, 17],
  ];

  for (const [dx, dy, radius] of puffs) {
    ctx.beginPath();
    ctx.arc(dx, dy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const highlight = ctx.createLinearGradient(0, -18, 0, 12);
  highlight.addColorStop(0, "rgba(255, 255, 255, 0.96)");
  highlight.addColorStop(1, "rgba(232, 241, 246, 0.92)");
  ctx.fillStyle = highlight;
  roundedRectPath(0, -2, 52, 18, 12);
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  const { width, height } = state;
  const groundY = height - state.groundHeight;

  const grass = ctx.createLinearGradient(0, groundY, 0, height);
  grass.addColorStop(0, "#90b85c");
  grass.addColorStop(0.12, "#648c43");
  grass.addColorStop(0.42, "#49662f");
  grass.addColorStop(1, "#2d2c20");

  ctx.fillStyle = grass;
  ctx.fillRect(0, groundY, width, state.groundHeight);

  ctx.fillStyle = "#76a04f";
  for (let x = -24 + state.groundOffset; x < width + 30; x += 14) {
    const bladeHeight = 8 + ((x / 14) % 3);
    ctx.beginPath();
    ctx.moveTo(x, groundY + 7);
    ctx.lineTo(x + 5, groundY - bladeHeight);
    ctx.lineTo(x + 10, groundY + 7);
    ctx.closePath();
    ctx.fill();
  }

  const soil = ctx.createLinearGradient(0, groundY + 18, 0, height);
  soil.addColorStop(0, "#715030");
  soil.addColorStop(0.38, "#503821");
  soil.addColorStop(1, "#241712");
  ctx.fillStyle = soil;
  ctx.fillRect(0, groundY + 18, width, height - groundY - 18);

  ctx.fillStyle = "rgba(255, 233, 181, 0.18)";
  ctx.fillRect(0, groundY + 18, width, 4);

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  for (let x = (-36 + state.groundOffset * 0.55) % 32; x < width + 32; x += 32) {
    ctx.fillRect(x, groundY + 30, 18, 4);
  }
}

function drawCeiling() {
  const { width } = state;
  const height = state.ceilingHeight;
  const ceiling = ctx.createLinearGradient(0, 0, 0, height + 10);
  ceiling.addColorStop(0, "#e5eef4");
  ceiling.addColorStop(0.42, "#b6cad7");
  ceiling.addColorStop(1, "#748d9e");

  ctx.fillStyle = ceiling;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fillRect(0, height - 2, width, 2);

  ctx.fillStyle = "rgba(14, 35, 48, 0.18)";
  ctx.fillRect(0, height, width, 5);
}

function drawPipes() {
  for (const pipe of state.pipes) {
    drawPipe(pipe);
  }
}

function drawPipe(pipe) {
  const pipeType = pipe.type;
  const bottomY = pipe.topHeight + pipe.gap;
  const bottomHeight = state.height - state.groundHeight - bottomY;
  const width = pipe.width;
  const capHeight = 24;

  const bodyGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + width, 0);
  applyGradientStops(bodyGradient, pipeType.bodyStops);

  const highlight = ctx.createLinearGradient(pipe.x, 0, pipe.x + width, 0);
  applyGradientStops(highlight, pipeType.highlightStops);

  ctx.save();
  ctx.shadowColor = pipeType.glowColor;
  ctx.shadowBlur = pipeType.key === "rusted" ? 16 : 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = bodyGradient;
  roundedRectPath(pipe.x, 0, width, pipe.topHeight, 16);
  ctx.fill();

  roundedRectPath(pipe.x, bottomY, width, bottomHeight, 16);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = highlight;
  roundedRectPath(pipe.x + 8, 0, width - 16, pipe.topHeight, 12);
  ctx.fill();
  roundedRectPath(pipe.x + 8, bottomY, width - 16, bottomHeight, 12);
  ctx.fill();

  ctx.strokeStyle = pipeType.stripeColor;
  ctx.lineWidth = 2;
  for (let y = 54; y < pipe.topHeight; y += 78) {
    ctx.beginPath();
    ctx.moveTo(pipe.x + 8, y);
    ctx.lineTo(pipe.x + width - 8, y);
    ctx.stroke();
  }

  for (let y = bottomY + 56; y < bottomY + bottomHeight; y += 78) {
    ctx.beginPath();
    ctx.moveTo(pipe.x + 8, y);
    ctx.lineTo(pipe.x + width - 8, y);
    ctx.stroke();
  }

  drawPipeCap(pipe.x - 9, pipe.topHeight - 6, width + 18, capHeight, pipeType);
  drawPipeCap(pipe.x - 9, bottomY - 6, width + 18, capHeight, pipeType);
  if (!pipe.scored) {
    drawPipeBadge(pipe, bottomY, pipeType);
  }
}

function drawPipeCap(x, y, width, height, pipeType) {
  const capGradient = ctx.createLinearGradient(x, 0, x + width, 0);
  applyGradientStops(capGradient, pipeType.capStops);

  ctx.fillStyle = capGradient;
  roundedRectPath(x, y, width, height, 10);
  ctx.fill();

  ctx.fillStyle = pipeType.capHighlight;
  roundedRectPath(x + 8, y + 3, width - 16, height * 0.34, 8);
  ctx.fill();

  ctx.strokeStyle = pipeType.capStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPipeBadge(pipe, bottomY, pipeType) {
  const centerX = pipe.x + pipe.width / 2;
  const badgeY = pipe.topHeight + (bottomY - pipe.topHeight) / 2;
  const badgeRadius = pipeType.key === "diamond" ? 18 : pipeType.key === "gold" ? 17 : 15;

  ctx.save();
  ctx.shadowColor = pipeType.glowColor;
  ctx.shadowBlur = pipeType.key === "rusted" ? 0 : 14;
  ctx.fillStyle = pipeType.badgeFill;
  ctx.beginPath();
  ctx.arc(centerX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = pipeType.badgeStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = pipeType.badgeText;
  ctx.font = pipeType.points >= 10
    ? '900 14px "Trebuchet MS", "Segoe UI", sans-serif'
    : '900 16px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`+${pipeType.points}`, centerX, badgeY + 1);
  ctx.restore();
}

function drawBird() {
  const bird = state.bird;
  const flap = Math.sin(bird.wingPhase) * 0.5 + 0.5;
  const scale = bird.radius / 18;

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
  ctx.beginPath();
  ctx.ellipse(-2, 16, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#705038";
  ctx.beginPath();
  ctx.moveTo(-30, -2);
  ctx.lineTo(-42, -10);
  ctx.lineTo(-36, 0);
  ctx.lineTo(-42, 10);
  ctx.closePath();
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(-26, -14, 28, 18);
  bodyGradient.addColorStop(0, "#7f5a34");
  bodyGradient.addColorStop(0.38, "#c78b4a");
  bodyGradient.addColorStop(0.72, "#d6a55f");
  bodyGradient.addColorStop(1, "#8f643b");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 25, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dbc6a3";
  ctx.beginPath();
  ctx.ellipse(1, 6, 14, 10, 0.16, 0, Math.PI * 2);
  ctx.fill();

  const headGradient = ctx.createLinearGradient(8, -18, 30, 10);
  headGradient.addColorStop(0, "#8f6840");
  headGradient.addColorStop(0.6, "#c39154");
  headGradient.addColorStop(1, "#795634");
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.ellipse(19, -6, 13, 11, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(-7, 5);
  ctx.rotate(-0.45 + flap * 1.05);
  const wingGradient = ctx.createLinearGradient(-16, -4, 12, 14);
  wingGradient.addColorStop(0, "#6e4f35");
  wingGradient.addColorStop(0.55, "#8d6844");
  wingGradient.addColorStop(1, "#503824");
  ctx.fillStyle = wingGradient;
  ctx.beginPath();
  ctx.moveTo(-14, -1);
  ctx.quadraticCurveTo(-2, -16, 10, 3);
  ctx.quadraticCurveTo(1, 14, -12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 244, 228, 0.18)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, 1);
  ctx.quadraticCurveTo(-1, 2, 5, 8);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#f1e8d8";
  ctx.beginPath();
  ctx.arc(23, -8, 4.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1f1a15";
  ctx.beginPath();
  ctx.arc(24, -8.2, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(24.7, -9.1, 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#69503a";
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.quadraticCurveTo(18, -25, 30, -18);
  ctx.lineTo(17, -13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d79a4b";
  ctx.beginPath();
  ctx.moveTo(28, -3);
  ctx.lineTo(42, 1);
  ctx.lineTo(28, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b87d33";
  ctx.beginPath();
  ctx.moveTo(27, 5);
  ctx.lineTo(39, 3);
  ctx.lineTo(28, 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(55, 38, 24, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-20, -2);
  ctx.quadraticCurveTo(-2, -10, 14, -3);
  ctx.stroke();

  ctx.restore();
}

function drawExplosion() {
  const explosion = state.explosion;
  if (!explosion) {
    return;
  }

  const progress = clamp(explosion.time / explosion.duration, 0, 1);
  const eased = 1 - (1 - progress) * (1 - progress);
  const alpha = 1 - progress;

  ctx.save();
  ctx.translate(explosion.x, explosion.y);

  ctx.globalAlpha = alpha * 0.34;
  ctx.fillStyle = explosion.smokeColor;
  ctx.beginPath();
  ctx.arc(0, 0, 18 + eased * 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = explosion.ringColor;
  ctx.lineWidth = 4 * (1 - progress * 0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 12 + eased * 34, 0, Math.PI * 2);
  ctx.stroke();

  for (const particle of explosion.particles) {
    const distance = particle.speed * eased;
    const x = Math.cos(particle.angle) * distance;
    const y = Math.sin(particle.angle) * distance;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(particle.angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size * particle.stretch, particle.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = alpha * 0.92;
  const flash = ctx.createRadialGradient(0, 0, 2, 0, 0, 26 + eased * 18);
  flash.addColorStop(0, explosion.flashColor);
  flash.addColorStop(0.45, "rgba(255, 240, 210, 0.78)");
  flash.addColorStop(1, "rgba(255, 240, 210, 0)");
  ctx.fillStyle = flash;
  ctx.beginPath();
  ctx.arc(0, 0, 26 + eased * 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground();
  drawPipes();
  drawCeiling();
  if (!(state.mode === "gameover" && state.deathCause === "pipe")) {
    drawBird();
  }
  drawExplosion();
}

function loop(timestamp) {
  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const dt = clamp((timestamp - state.lastTimestamp) / 1000, 0, 0.033);
  state.lastTimestamp = timestamp;

  if (state.mode === "playing") {
    updatePlaying(dt);
  } else if (state.mode === "intro") {
    updateIntro(dt);
  } else if (state.mode === "gameover") {
    updateGameOver(dt);
  }

  render();
  requestAnimationFrame(loop);
}

function handlePrimaryAction(event) {
  if (event?.type === "keydown") {
    const code = event.code;
    if (!["Space", "ArrowUp", "Enter", "KeyW", "KeyR"].includes(code)) {
      return;
    }

    event.preventDefault();
    if (code === "KeyR") {
      startGame();
      return;
    }
    flap();
    return;
  }

  flap();
}

window.addEventListener("pointerdown", handlePrimaryAction, { passive: false });
window.addEventListener("keydown", handlePrimaryAction);
window.addEventListener("resize", resize);
playButton.addEventListener("pointerdown", (event) => event.stopPropagation());
playButton.addEventListener("click", startGame);

showOverlay({
  kicker: "Prêt ?",
  title: "Flappy Bird",
  text: "Appuie sur espace, clique ou tape pour démarrer.",
});

resize();
requestAnimationFrame(loop);
