const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const playerScoreNode = document.getElementById("player-score");
const cpuScoreNode = document.getElementById("cpu-score");
const leftLabelNode = document.getElementById("left-label");
const rightLabelNode = document.getElementById("right-label");
const statusTextNode = document.getElementById("status-text");
const startButton = document.getElementById("start-button");
const modeToggle = document.getElementById("mode-toggle");
const soundToggle = document.getElementById("sound-toggle");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const MALLET_RADIUS = 56;
const TABLE_MARGIN = 32;
const GOAL_SIZE = 280;
const GOAL_HALF = GOAL_SIZE / 2;
const WIN_SCORE = 7;
const PLAYER_MALLET_SPEED = 1900;
const MULTI_PLAYER_SPEED = Math.round(PLAYER_MALLET_SPEED / 1.6);
const CPU_MALLET_SPEED = 760;
const CPU_ATTACK_SPEED = 980;
const CPU_CLEAR_SPEED = 1120;
const CPU_MAX_SPEED = 1120;
const CENTER_LANE_HALF = 18;
const PLAYER_ZONE_RIGHT = WIDTH / 2 - CENTER_LANE_HALF;
const CPU_ZONE_LEFT = WIDTH / 2 + CENTER_LANE_HALF;
const PLAYER_HOME_X = WIDTH * 0.18;
const CPU_HOME_X = WIDTH * 0.82;
const HOME_Y = HEIGHT / 2;
const FRICTION = 0.994;
const MAX_PUCK_SPEED = 1700;
const MAX_DT = 1 / 40;

const colors = {
  cyan: "#72efff",
  cyanGlow: "rgba(114, 239, 255, 0.35)",
  pink: "#ff4fd8",
  pinkGlow: "rgba(255, 79, 216, 0.35)",
  gold: "#ffd166",
  line: "rgba(200, 236, 255, 0.72)",
  lineSoft: "rgba(200, 236, 255, 0.16)",
};

const pointer = {
  active: false,
  x: PLAYER_HOME_X,
  y: HOME_Y,
};

const audio = {
  enabled: true,
  context: null,
};

const player = {
  x: PLAYER_HOME_X,
  y: HOME_Y,
  prevX: PLAYER_HOME_X,
  prevY: HOME_Y,
  vx: 0,
  vy: 0,
  radius: MALLET_RADIUS,
  color: colors.cyan,
};

const cpu = {
  x: CPU_HOME_X,
  y: HOME_Y,
  prevX: CPU_HOME_X,
  prevY: HOME_Y,
  vx: 0,
  vy: 0,
  radius: MALLET_RADIUS,
  color: colors.pink,
};

const puck = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  vx: 0,
  vy: 0,
  radius: 24,
  trail: [],
};

const state = {
  running: false,
  matchStarted: false,
  winner: "",
  mode: "solo",
  playerScore: 0,
  cpuScore: 0,
  faceoffTimer: 0,
  nextServeDirection: 1,
};

let lastTime = 0;
let particleId = 0;
const particles = [];
const keyboard = {
  w: false,
  a: false,
  s: false,
  d: false,
  up: false,
  down: false,
  left: false,
  right: false,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function length(x, y) {
  return Math.hypot(x, y);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function updateScoreboard() {
  playerScoreNode.textContent = String(state.playerScore);
  cpuScoreNode.textContent = String(state.cpuScore);
}

function getLeftLabel() {
  return state.mode === "multi" ? "JOUEUR 1" : "JOUEUR";
}

function getRightLabel() {
  return state.mode === "multi" ? "JOUEUR 2" : "CPU";
}

function syncModeUI() {
  leftLabelNode.textContent = getLeftLabel();
  rightLabelNode.textContent = getRightLabel();
  modeToggle.textContent = `Mode: ${state.mode === "multi" ? "Multi" : "Solo"}`;
  modeToggle.setAttribute("aria-pressed", String(state.mode === "multi"));
}

function setStatus(text) {
  statusTextNode.textContent = text;
}

function setMode(mode) {
  state.mode = mode;
  syncModeUI();
  beginMatch();
}

function setKeyState(code, pressed) {
  switch (code) {
    case "KeyW":
      keyboard.w = pressed;
      return true;
    case "KeyA":
      keyboard.a = pressed;
      return true;
    case "KeyS":
      keyboard.s = pressed;
      return true;
    case "KeyD":
      keyboard.d = pressed;
      return true;
    case "ArrowUp":
      keyboard.up = pressed;
      return true;
    case "ArrowDown":
      keyboard.down = pressed;
      return true;
    case "ArrowLeft":
      keyboard.left = pressed;
      return true;
    case "ArrowRight":
      keyboard.right = pressed;
      return true;
    default:
      return false;
  }
}

function getKeyboardVector(keys) {
  let x = 0;
  let y = 0;

  if (keyboard[keys.left]) x -= 1;
  if (keyboard[keys.right]) x += 1;
  if (keyboard[keys.up]) y -= 1;
  if (keyboard[keys.down]) y += 1;

  if (x !== 0 || y !== 0) {
    const magnitude = Math.hypot(x, y);
    x /= magnitude;
    y /= magnitude;
  }

  return { x, y, active: x !== 0 || y !== 0 };
}

function moveMalletWithVector(mallet, vector, speed, dt) {
  const targetX = mallet.x + vector.x * speed;
  const targetY = mallet.y + vector.y * speed;
  moveMalletToward(mallet, targetX, targetY, speed, dt);
}

function getLeftPlayerKeyboardInput() {
  const wasdInput = getKeyboardVector({
    up: "w",
    down: "s",
    left: "a",
    right: "d",
  });
  const arrowInput = state.mode === "solo"
    ? getKeyboardVector({
        up: "up",
        down: "down",
        left: "left",
        right: "right",
      })
    : { x: 0, y: 0, active: false };

  if (state.mode === "solo") {
    const x = wasdInput.x + arrowInput.x;
    const y = wasdInput.y + arrowInput.y;

    if (x !== 0 || y !== 0) {
      const magnitude = Math.hypot(x, y);
      return {
        x: x / magnitude,
        y: y / magnitude,
        active: true,
      };
    }
  }

  return wasdInput.active ? wasdInput : { x: 0, y: 0, active: false };
}

function getRightPlayerKeyboardInput() {
  return getKeyboardVector({
    up: "up",
    down: "down",
    left: "left",
    right: "right",
  });
}

function resetMallets() {
  player.x = PLAYER_HOME_X;
  player.y = HOME_Y;
  player.prevX = player.x;
  player.prevY = player.y;
  player.vx = 0;
  player.vy = 0;

  cpu.x = CPU_HOME_X;
  cpu.y = HOME_Y;
  cpu.prevX = cpu.x;
  cpu.prevY = cpu.y;
  cpu.vx = 0;
  cpu.vy = 0;

  pointer.x = player.x;
  pointer.y = player.y;
}

function resetPuck() {
  puck.x = WIDTH / 2;
  puck.y = HEIGHT / 2;
  puck.vx = 0;
  puck.vy = 0;
  puck.trail.length = 0;
}

function positionPuckForFaceoff(direction) {
  resetPuck();
  state.nextServeDirection = direction;
  state.faceoffTimer = 1;
}

function beginMatch() {
  state.running = true;
  state.matchStarted = true;
  state.winner = "";
  state.playerScore = 0;
  state.cpuScore = 0;
  updateScoreboard();
  resetMallets();
  positionPuckForFaceoff(Math.random() > 0.5 ? 1 : -1);
  syncModeUI();
  setStatus(
    state.mode === "multi"
      ? "Multijoueur actif. J1 = WASD, J2 = fleches. La souris est desactivee."
      : "Solo actif. WASD, fleches ou souris a gauche, CPU a droite.",
  );
}

function startIfNeeded() {
  if (!state.matchStarted || state.winner) {
    beginMatch();
    return;
  }

  if (!state.running) {
    state.running = true;
    setStatus("Reprise du duel. L’IA vise ta cage.");
  }
}

function servePuck() {
  const speed = randomBetween(920, 1080);
  const spread = randomBetween(-190, 190);
  puck.vx = speed * state.nextServeDirection;
  puck.vy = spread;
  playTone(520, 0.07, "triangle", 0.03, 900);
  setStatus("Échange lancé. Protège la gauche et vise la droite.");
}

function ensureAudioContext() {
  if (!audio.enabled) {
    return null;
  }

  if (!audio.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audio.context = new AudioContextClass();
  }

  if (audio.context.state === "suspended") {
    audio.context.resume().catch(() => {});
  }

  return audio.context;
}

function playTone(frequency, duration, type, volume, targetFrequency = frequency) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.linearRampToValueAtTime(targetFrequency, now + duration);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function emitBurst(x, y, color, amount, speedRange) {
  for (let index = 0; index < amount; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(speedRange[0], speedRange[1]);
    particles.push({
      id: particleId += 1,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomBetween(4, 12),
      life: randomBetween(0.3, 0.75),
      maxLife: 0,
      color,
    });
    particles[particles.length - 1].maxLife = particles[particles.length - 1].life;
  }
}

function updateParticles(dt) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= dt;

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  }
}

function drawParticles() {
  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function setPointerPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = clamp(
    ((clientX - rect.left) / rect.width) * WIDTH,
    TABLE_MARGIN + player.radius,
    PLAYER_ZONE_RIGHT - player.radius,
  );
  pointer.y = clamp(
    ((clientY - rect.top) / rect.height) * HEIGHT,
    TABLE_MARGIN + player.radius,
    HEIGHT - TABLE_MARGIN - player.radius,
  );
}

function moveMalletToward(mallet, targetX, targetY, speed, dt) {
  mallet.prevX = mallet.x;
  mallet.prevY = mallet.y;

  const deltaX = targetX - mallet.x;
  const deltaY = targetY - mallet.y;
  const distance = length(deltaX, deltaY);
  const maxStep = speed * dt;

  if (distance > maxStep && distance > 0) {
    mallet.x += (deltaX / distance) * maxStep;
    mallet.y += (deltaY / distance) * maxStep;
  } else {
    mallet.x = targetX;
    mallet.y = targetY;
  }

  mallet.vx = (mallet.x - mallet.prevX) / Math.max(dt, 0.0001);
  mallet.vy = (mallet.y - mallet.prevY) / Math.max(dt, 0.0001);
}

function constrainMallet(mallet, leftLimit, rightLimit) {
  mallet.x = clamp(mallet.x, leftLimit + mallet.radius, rightLimit - mallet.radius);
  mallet.y = clamp(mallet.y, TABLE_MARGIN + mallet.radius, HEIGHT - TABLE_MARGIN - mallet.radius);
}

function updatePlayer(dt) {
  const keyboardInput = getLeftPlayerKeyboardInput();
  const moveSpeed = state.mode === "multi" ? MULTI_PLAYER_SPEED : PLAYER_MALLET_SPEED;

  if (keyboardInput.active) {
    moveMalletWithVector(player, keyboardInput, moveSpeed, dt);
  } else if (state.mode === "multi") {
    // En multi, la palette s'arrête simplement quand aucune touche n'est pressée.
  } else if (pointer.active) {
    moveMalletToward(player, pointer.x, pointer.y, moveSpeed, dt);
  } else {
    pointer.x = lerp(pointer.x, PLAYER_HOME_X, 0.05);
    pointer.y = lerp(pointer.y, HOME_Y, 0.05);
    moveMalletToward(player, pointer.x, pointer.y, moveSpeed, dt);
  }

  constrainMallet(player, TABLE_MARGIN, PLAYER_ZONE_RIGHT);
}

function getPlayerGoalAimY() {
  const targetY = player.y < HEIGHT / 2 ? HEIGHT * 0.67 : HEIGHT * 0.33;
  return clamp(targetY, HEIGHT / 2 - GOAL_HALF + 28, HEIGHT / 2 + GOAL_HALF - 28);
}

function isPuckInCorner() {
  const cornerDepth = 120;
  const nearHorizontalEdge =
    puck.x <= TABLE_MARGIN + cornerDepth || puck.x >= WIDTH - TABLE_MARGIN - cornerDepth;
  const nearVerticalEdge =
    puck.y <= TABLE_MARGIN + cornerDepth || puck.y >= HEIGHT - TABLE_MARGIN - cornerDepth;

  return nearHorizontalEdge && nearVerticalEdge;
}

function getPuckCornerSide() {
  if (!isPuckInCorner()) {
    return null;
  }

  return puck.x < WIDTH / 2 ? "left" : "right";
}

function teleportPuckFromCorner() {
  const cornerSide = getPuckCornerSide();
  if (!cornerSide) {
    return false;
  }

  const destinationSide = cornerSide === "left" ? "right" : "left";
  const destinationX =
    destinationSide === "right"
      ? WIDTH - TABLE_MARGIN - puck.radius - 6
      : TABLE_MARGIN + puck.radius + 6;
  const destinationY = clamp(
    HEIGHT / 2 + randomBetween(-110, 110),
    TABLE_MARGIN + puck.radius + 14,
    HEIGHT - TABLE_MARGIN - puck.radius - 14,
  );
  const launchDirection = destinationSide === "right" ? -1 : 1;
  const launchSpeed = clamp(Math.max(length(puck.vx, puck.vy) * 0.95, 980), 980, 1500);

  puck.x = destinationX;
  puck.y = destinationY;
  puck.vx = launchDirection * launchSpeed;
  puck.vy = randomBetween(-220, 220);
  puck.trail.length = 0;

  emitBurst(puck.x, puck.y, colors.gold, 12, [220, 520]);
  playTone(920, 0.08, "triangle", 0.03, 520);
  return true;
}

function getCpuAttackPlan() {
  const interceptTime = clamp(length(puck.x - cpu.x, puck.y - cpu.y) / CPU_ATTACK_SPEED, 0.05, 0.24);
  const predictedPuckX = clamp(
    puck.x + puck.vx * interceptTime,
    TABLE_MARGIN + puck.radius,
    WIDTH - TABLE_MARGIN - puck.radius,
  );
  const predictedPuckY = clamp(
    puck.y + puck.vy * interceptTime,
    TABLE_MARGIN + puck.radius,
    HEIGHT - TABLE_MARGIN - puck.radius,
  );

  const targetGoalX = TABLE_MARGIN + 14;
  const targetGoalY = getPlayerGoalAimY();
  const shotVectorX = targetGoalX - predictedPuckX;
  const shotVectorY = targetGoalY - predictedPuckY;
  const shotLength = Math.max(length(shotVectorX, shotVectorY), 1);
  const shotDirX = shotVectorX / shotLength;
  const shotDirY = shotVectorY / shotLength;
  const contactOffset = cpu.radius + puck.radius - 8;

  const setupX = predictedPuckX - shotDirX * contactOffset;
  const setupY = predictedPuckY - shotDirY * contactOffset;
  const strikeX = predictedPuckX + shotDirX * 54;
  const strikeY = predictedPuckY + shotDirY * 54;
  const readyToStrike =
    length(cpu.x - setupX, cpu.y - setupY) < 96 ||
    predictedPuckX > WIDTH * 0.72 ||
    (predictedPuckX > WIDTH * 0.58 && puck.vx > -140);

  return {
    x: clamp(readyToStrike ? strikeX : setupX, CPU_ZONE_LEFT + cpu.radius, WIDTH - TABLE_MARGIN - cpu.radius),
    y: clamp(readyToStrike ? strikeY : setupY, TABLE_MARGIN + cpu.radius, HEIGHT - TABLE_MARGIN - cpu.radius),
    speed: predictedPuckX > WIDTH * 0.68 ? CPU_CLEAR_SPEED : readyToStrike ? CPU_ATTACK_SPEED : CPU_MALLET_SPEED,
  };
}

function getCpuCornerPlan() {
  const targetGoalX = TABLE_MARGIN + 14;
  const targetGoalY = HEIGHT / 2;
  const shotVectorX = targetGoalX - puck.x;
  const shotVectorY = targetGoalY - puck.y;
  const shotLength = Math.max(length(shotVectorX, shotVectorY), 1);
  const shotDirX = shotVectorX / shotLength;
  const shotDirY = shotVectorY / shotLength;
  const contactOffset = cpu.radius + puck.radius - 8;

  return {
    x: clamp(puck.x - shotDirX * contactOffset, CPU_ZONE_LEFT + cpu.radius, WIDTH - TABLE_MARGIN - cpu.radius),
    y: clamp(puck.y - shotDirY * contactOffset, TABLE_MARGIN + cpu.radius, HEIGHT - TABLE_MARGIN - cpu.radius),
    speed: CPU_CLEAR_SPEED,
  };
}

function updateCpu(dt) {
  const puckInCpuZone = puck.x >= WIDTH / 2 - 26;
  const puckThreateningCpu = puck.x > WIDTH * 0.38 && puck.vx > -180;
  const shouldAttack = puckInCpuZone || puckThreateningCpu;
  const shouldClearCorner = isPuckInCorner() && puck.x >= WIDTH / 2;

  let targetX = WIDTH * 0.76;
  let targetY = HOME_Y + Math.sin(performance.now() * 0.0018) * 92;
  let moveSpeed = CPU_MALLET_SPEED;

  if (shouldClearCorner) {
    const cornerPlan = getCpuCornerPlan();
    targetX = cornerPlan.x;
    targetY = cornerPlan.y;
    moveSpeed = cornerPlan.speed;
  } else if (shouldAttack) {
    const attackPlan = getCpuAttackPlan();
    targetX = attackPlan.x;
    targetY = attackPlan.y;
    moveSpeed = attackPlan.speed;
  }

  moveSpeed = Math.min(moveSpeed, CPU_MAX_SPEED);
  moveMalletToward(cpu, targetX, targetY, moveSpeed, dt);
  constrainMallet(cpu, CPU_ZONE_LEFT, WIDTH - TABLE_MARGIN);
}

function updateOpponentHuman(dt) {
  const keyboardInput = getRightPlayerKeyboardInput();
  const moveSpeed = MULTI_PLAYER_SPEED;

  if (keyboardInput.active) {
    moveMalletWithVector(cpu, keyboardInput, moveSpeed, dt);
  }

  constrainMallet(cpu, CPU_ZONE_LEFT, WIDTH - TABLE_MARGIN);
}

function resolveMalletCollision(mallet) {
  const deltaX = puck.x - mallet.x;
  const deltaY = puck.y - mallet.y;
  const distance = length(deltaX, deltaY);
  const minDistance = puck.radius + mallet.radius;

  if (distance >= minDistance || distance === 0) {
    return;
  }

  const normalX = deltaX / distance;
  const normalY = deltaY / distance;
  const overlap = minDistance - distance;

  puck.x += normalX * overlap;
  puck.y += normalY * overlap;

  const relativeX = puck.vx - mallet.vx;
  const relativeY = puck.vy - mallet.vy;
  const separatingVelocity = relativeX * normalX + relativeY * normalY;

  if (separatingVelocity < 0) {
    const impulse = -separatingVelocity * 1.08 + 90;
    puck.vx += normalX * impulse + mallet.vx * 0.1;
    puck.vy += normalY * impulse + mallet.vy * 0.1;
  } else {
    puck.vx += normalX * 110;
    puck.vy += normalY * 110;
  }

  const speed = length(puck.vx, puck.vy);
  if (speed > MAX_PUCK_SPEED) {
    const scale = MAX_PUCK_SPEED / speed;
    puck.vx *= scale;
    puck.vy *= scale;
  }

  emitBurst(puck.x, puck.y, mallet.color, 8, [120, 420]);
  playTone(mallet === player ? 740 : 460, 0.06, "square", 0.02, mallet === player ? 520 : 280);
}

function handleGoal(side) {
  state.running = false;
  state.faceoffTimer = 0;

  if (side === "right") {
    state.playerScore += 1;
    state.nextServeDirection = 1;
    emitBurst(WIDTH - TABLE_MARGIN - 26, HEIGHT / 2, colors.cyan, 26, [180, 600]);
    playTone(820, 0.22, "sawtooth", 0.045, 320);
  } else {
    state.cpuScore += 1;
    state.nextServeDirection = -1;
    emitBurst(TABLE_MARGIN + 26, HEIGHT / 2, colors.pink, 26, [180, 600]);
    playTone(260, 0.24, "square", 0.04, 140);
  }

  updateScoreboard();
  if (state.playerScore >= WIN_SCORE || state.cpuScore >= WIN_SCORE) {
    state.winner = state.mode === "multi"
      ? (state.playerScore > state.cpuScore ? "JOUEUR 1" : "JOUEUR 2")
      : (state.playerScore > state.cpuScore ? "JOUEUR" : "CPU");
    setStatus(`${state.winner} remporte la borne. Clique pour rejouer.`);
    return;
  }

  resetMallets();
  positionPuckForFaceoff(state.nextServeDirection);
  state.running = true;
  if (state.mode === "multi") {
    setStatus(side === "right" ? "JOUEUR 1 marque. Nouveau face-off." : "JOUEUR 2 marque. Nouveau face-off.");
  } else {
    setStatus(side === "right" ? "But pour toi. Nouveau face-off." : "L’IA marque dans ta cage. Repars vite.");
  }
}

function updatePuck(dt) {
  if (state.faceoffTimer > 0) {
    state.faceoffTimer -= dt;
    if (state.faceoffTimer <= 0) {
      servePuck();
    }
    return;
  }

  puck.x += puck.vx * dt;
  puck.y += puck.vy * dt;
  puck.vx *= FRICTION;
  puck.vy *= FRICTION;

  const speed = length(puck.vx, puck.vy);
  if (speed > MAX_PUCK_SPEED) {
    const scale = MAX_PUCK_SPEED / speed;
    puck.vx *= scale;
    puck.vy *= scale;
  }

  if (teleportPuckFromCorner()) {
    return;
  }

  if (puck.y <= TABLE_MARGIN + puck.radius) {
    puck.y = TABLE_MARGIN + puck.radius;
    puck.vy = Math.abs(puck.vy) * 0.98;
    playTone(300, 0.045, "triangle", 0.012, 500);
  } else if (puck.y >= HEIGHT - TABLE_MARGIN - puck.radius) {
    puck.y = HEIGHT - TABLE_MARGIN - puck.radius;
    puck.vy = -Math.abs(puck.vy) * 0.98;
    playTone(300, 0.045, "triangle", 0.012, 500);
  }

  const inGoalLane = Math.abs(puck.y - HEIGHT / 2) < GOAL_HALF;

  if (puck.x <= TABLE_MARGIN + puck.radius) {
    if (inGoalLane) {
      handleGoal("left");
      return;
    }

    puck.x = TABLE_MARGIN + puck.radius;
    puck.vx = Math.abs(puck.vx) * 0.98;
    playTone(260, 0.045, "triangle", 0.012, 420);
  } else if (puck.x >= WIDTH - TABLE_MARGIN - puck.radius) {
    if (inGoalLane) {
      handleGoal("right");
      return;
    }

    puck.x = WIDTH - TABLE_MARGIN - puck.radius;
    puck.vx = -Math.abs(puck.vx) * 0.98;
    playTone(260, 0.045, "triangle", 0.012, 420);
  }

  resolveMalletCollision(player);
  resolveMalletCollision(cpu);

  puck.trail.unshift({ x: puck.x, y: puck.y, speed });
  if (puck.trail.length > 16) {
    puck.trail.pop();
  }
}

function update(dt) {
  updatePlayer(dt);
  if (state.mode === "multi") {
    updateOpponentHuman(dt);
  } else {
    updateCpu(dt);
  }
  if (state.running) {
    updatePuck(dt);
  }
  updateParticles(dt);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawGlowLine(x1, y1, x2, y2, color, width, blur) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawGoalMarks(x, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x, HEIGHT / 2 - GOAL_HALF);
  ctx.lineTo(x, HEIGHT / 2 + GOAL_HALF);
  ctx.stroke();
  ctx.restore();
}

function drawTable() {
  const gradient = ctx.createLinearGradient(TABLE_MARGIN, 0, WIDTH - TABLE_MARGIN, 0);
  gradient.addColorStop(0, "#0e284f");
  gradient.addColorStop(0.45, "#08162d");
  gradient.addColorStop(1, "#241033");

  ctx.fillStyle = gradient;
  roundRect(TABLE_MARGIN, TABLE_MARGIN, WIDTH - TABLE_MARGIN * 2, HEIGHT - TABLE_MARGIN * 2, 42);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 3;
  roundRect(TABLE_MARGIN, TABLE_MARGIN, WIDTH - TABLE_MARGIN * 2, HEIGHT - TABLE_MARGIN * 2, 42);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = CENTER_LANE_HALF * 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, TABLE_MARGIN + 42);
  ctx.lineTo(WIDTH / 2, HEIGHT - TABLE_MARGIN - 42);
  ctx.stroke();

  drawGlowLine(WIDTH / 2, TABLE_MARGIN + 42, WIDTH / 2, HEIGHT - TABLE_MARGIN - 42, colors.line, 3, 14);

  ctx.strokeStyle = colors.lineSoft;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = colors.lineSoft;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 28, 0, Math.PI * 2);
  ctx.stroke();

  drawGoalMarks(TABLE_MARGIN, colors.cyan);
  drawGoalMarks(WIDTH - TABLE_MARGIN, colors.pink);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 2;
  for (let x = TABLE_MARGIN + 120; x < WIDTH - TABLE_MARGIN - 90; x += 140) {
    ctx.beginPath();
    ctx.moveTo(x, TABLE_MARGIN + 44);
    ctx.lineTo(x, HEIGHT - TABLE_MARGIN - 44);
    ctx.stroke();
  }
}

function drawMallet(mallet) {
  ctx.save();
  ctx.translate(mallet.x, mallet.y);
  ctx.shadowBlur = 30;
  ctx.shadowColor = mallet.color;

  const outerGradient = ctx.createRadialGradient(0, 0, 6, 0, 0, mallet.radius);
  outerGradient.addColorStop(0, "rgba(255,255,255,0.96)");
  outerGradient.addColorStop(0.16, "rgba(255,255,255,0.92)");
  outerGradient.addColorStop(0.17, mallet.color);
  outerGradient.addColorStop(0.72, mallet.color);
  outerGradient.addColorStop(1, "#081123");

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(0, 0, mallet.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.arc(0, 0, mallet.radius - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, mallet.radius - 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#091324";
  ctx.beginPath();
  ctx.arc(0, 0, mallet.radius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, mallet.radius * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPuck() {
  for (let index = puck.trail.length - 1; index >= 0; index -= 1) {
    const trailPoint = puck.trail[index];
    const alpha = 1 - index / puck.trail.length;
    ctx.save();
    ctx.globalAlpha = alpha * 0.24;
    ctx.fillStyle = colors.gold;
    ctx.shadowBlur = 22;
    ctx.shadowColor = colors.gold;
    ctx.beginPath();
    ctx.arc(trailPoint.x, trailPoint.y, puck.radius * (0.5 + alpha * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(puck.x, puck.y);
  ctx.shadowBlur = 28;
  ctx.shadowColor = colors.gold;

  const puckGradient = ctx.createRadialGradient(-6, -6, 6, 0, 0, puck.radius);
  puckGradient.addColorStop(0, "#fff5d6");
  puckGradient.addColorStop(0.24, colors.gold);
  puckGradient.addColorStop(0.88, "#ff8f3f");
  puckGradient.addColorStop(1, "#4f1600");

  ctx.fillStyle = puckGradient;
  ctx.beginPath();
  ctx.arc(0, 0, puck.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, puck.radius - 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHudInsideTable() {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "700 20px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(getLeftLabel(), TABLE_MARGIN + 24, 66);
  ctx.textAlign = "right";
  ctx.fillText(getRightLabel(), WIDTH - TABLE_MARGIN - 24, 66);
  ctx.restore();
}

function drawOverlayText() {
  if (state.running && !state.faceoffTimer && !state.winner) {
    return;
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.shadowBlur = 24;
  ctx.shadowColor = state.winner ? colors.gold : colors.cyan;

  const title = state.winner
    ? `${state.winner} GAGNE`
    : state.faceoffTimer > 0
      ? "FACE-OFF"
      : "AIR HOCKEY NEON";
  const subtitle = state.winner
    ? "Clique ou touche pour relancer la partie."
    : state.faceoffTimer > 0
      ? `${Math.ceil(state.faceoffTimer)}`
      : state.mode === "multi"
        ? "J1: WASD. J2: fleches."
        : "Clique ou touche pour commencer. Tu joues a gauche avec WASD ou fleches.";

  ctx.font = "800 54px 'Trebuchet MS', sans-serif";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 44);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "600 28px 'Trebuchet MS', sans-serif";
  ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 10);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawTable();
  drawHudInsideTable();
  drawParticles();
  drawPuck();
  drawMallet(cpu);
  drawMallet(player);
  drawOverlayText();
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, MAX_DT);
  lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture?.(event.pointerId);
  pointer.active = true;
  setPointerPosition(event.clientX, event.clientY);
  startIfNeeded();
  ensureAudioContext();
});

canvas.addEventListener("pointermove", (event) => {
  pointer.active = true;
  setPointerPosition(event.clientX, event.clientY);
});

canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

canvas.addEventListener("pointerup", (event) => {
  pointer.active = false;
  canvas.releasePointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointercancel", (event) => {
  pointer.active = false;
  canvas.releasePointerCapture?.(event.pointerId);
});

window.addEventListener("keydown", (event) => {
  if (!setKeyState(event.code, true)) {
    return;
  }
  event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  if (!setKeyState(event.code, false)) {
    return;
  }
  event.preventDefault();
});

window.addEventListener("blur", () => {
  for (const key of Object.keys(keyboard)) {
    keyboard[key] = false;
  }
});

startButton.addEventListener("click", () => {
  ensureAudioContext();
  beginMatch();
});

modeToggle.addEventListener("click", () => {
  ensureAudioContext();
  setMode(state.mode === "multi" ? "solo" : "multi");
});

soundToggle.addEventListener("click", () => {
  audio.enabled = !audio.enabled;
  soundToggle.textContent = `Son: ${audio.enabled ? "ON" : "OFF"}`;
  soundToggle.setAttribute("aria-pressed", String(!audio.enabled));
  if (audio.enabled) {
    ensureAudioContext();
    playTone(620, 0.05, "triangle", 0.02, 780);
  }
});

updateScoreboard();
syncModeUI();
resetMallets();
resetPuck();
setStatus(
  state.mode === "multi"
    ? "Mode multijoueur pret. J1 = WASD, J2 = fleches. La souris est desactivee."
    : "Mode solo pret. WASD ou souris a gauche, CPU a droite. Clique sur Mode pour jouer a deux.",
);
render();
requestAnimationFrame(frame);
