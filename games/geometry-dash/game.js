const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTag = document.getElementById("overlayTag");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayButton = document.getElementById("overlayButton");

const progressFill = document.getElementById("progressFill");
const attemptLabel = document.getElementById("attemptLabel");
const statusLabel = document.getElementById("statusLabel");
const percentLabel = document.getElementById("percentLabel");

const jumpButton = document.getElementById("jumpButton");
const restartButton = document.getElementById("restartButton");

const VIEW = { width: 960, height: 540 };
const BASELINE = 430;
const FLOOR_HEIGHT = 140;
const PLAYER_SIZE = 32;

const PHYSICS = {
  runSpeed: 340,
  gravity: 2500,
  jumpVelocity: 860,
  coyote: 0.12,
  jumpBuffer: 0.14,
  maxFall: 1600,
};

const COLORS = {
  skyTop: "#08111c",
  skyMid: "#102248",
  skyBottom: "#1d3a64",
  grid: "rgba(176, 233, 255, 0.14)",
  mint: "#79f5df",
  cyan: "#48d8ff",
  gold: "#ffd36e",
  coral: "#ff7f6e",
  deep: "#0a1629",
  panel: "#16335f",
  player: "#ffffff",
  playerCore: "#0c1b31",
};

const input = {
  jumpQueued: 0,
};

const state = {
  mode: "ready",
  attempt: 1,
  progress: 0,
  cameraX: 0,
  lastTime: 0,
  flash: 0,
};

let particles = [];
let player = null;

const parallaxBands = Array.from({ length: 18 }, (_, index) => ({
  x: 160 + index * 420,
  y: 100 + (index % 4) * 54,
  width: 180 + (index % 3) * 80,
  height: 28 + (index % 4) * 14,
  speed: 0.18 + (index % 3) * 0.08,
}));

const skyline = Array.from({ length: 24 }, (_, index) => ({
  x: index * 320 + 60,
  width: 84 + (index % 4) * 24,
  height: 100 + (index % 5) * 36,
  speed: 0.3 + (index % 3) * 0.06,
}));

function buildLevel() {
  const solids = [];
  const hazards = [];
  const pads = [];
  const orbs = [];
  const signs = [];

  function addGround(x, width) {
    solids.push({ x, y: BASELINE, w: width, h: FLOOR_HEIGHT, type: "ground" });
  }

  function addPlatform(x, y, width, height = 20) {
    solids.push({ x, y, w: width, h: height, type: "platform" });
  }

  function addSpikeLine(x, surfaceY, count, size = 36, gap = 8) {
    for (let i = 0; i < count; i += 1) {
      hazards.push({
        x: x + i * (size + gap),
        y: surfaceY - size,
        w: size,
        h: size,
        type: "spike",
      });
    }
  }

  function addPad(x, surfaceY, width = 54, height = 14, power = 1200) {
    pads.push({ x, y: surfaceY - height, w: width, h: height, power });
  }

  function addOrb(x, y, power = 980) {
    orbs.push({ x, y, r: 16, power, used: false, pulse: Math.random() * Math.PI * 2 });
  }

  function addSign(x, y, text, tone = COLORS.mint) {
    signs.push({ x, y, text, tone });
  }

  addGround(0, 640);
  addSpikeLine(260, BASELINE, 1);
  addSpikeLine(420, BASELINE, 2);
  addSign(118, 290, "Espace, clic ou tactile pour sauter");

  addGround(760, 420);
  addSpikeLine(930, BASELINE, 3);
  addSign(788, 292, "Trou + pics = crash");

  addPlatform(1260, 340, 140);
  addPlatform(1470, 300, 160);
  addSign(1270, 254, "Prends de la hauteur", COLORS.gold);

  addGround(1710, 450);
  addSpikeLine(1830, BASELINE, 1);
  addSpikeLine(1960, BASELINE, 2);
  addOrb(2080, 286, 960);
  addSign(1920, 240, "Orbe: resauter en l'air", COLORS.cyan);

  addPlatform(2250, 320, 220);
  addSpikeLine(2330, 320, 1);

  addGround(2520, 580);
  addSpikeLine(2660, BASELINE, 3);
  addOrb(2910, 286, 980);

  addPlatform(3250, 360, 130);
  addPlatform(3440, 310, 170);

  addGround(3680, 620);
  addSpikeLine(3810, BASELINE, 2);
  addSpikeLine(3970, BASELINE, 3);
  addSpikeLine(4140, BASELINE, 1);
  addPad(4240, BASELINE);
  addSign(4045, 282, "Pad de boost", COLORS.coral);

  addPlatform(4400, 260, 300);
  addSpikeLine(4540, 260, 2);

  addGround(4780, 820);
  addSpikeLine(4920, BASELINE, 1);
  addSpikeLine(5100, BASELINE, 2);
  addSpikeLine(5310, BASELINE, 3);
  addSpikeLine(5510, BASELINE, 2);

  addPlatform(5660, 340, 180);
  addPlatform(5920, 300, 180);

  addGround(6180, 720);
  addSpikeLine(6310, BASELINE, 3);
  addSpikeLine(6500, BASELINE, 2);
  addSpikeLine(6670, BASELINE, 1);
  addSign(6275, 250, "Derniere ligne droite", COLORS.gold);

  return {
    solids,
    hazards,
    pads,
    orbs,
    signs,
    goalX: 6880,
    length: 7200,
  };
}

const level = buildLevel();

function createPlayer() {
  return {
    x: 104,
    y: BASELINE - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vx: PHYSICS.runSpeed,
    vy: 0,
    grounded: true,
    coyoteTimer: PHYSICS.coyote,
    rotation: 0,
    trail: [],
    padLock: false,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleRectOverlap(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function spawnBurst(x, y, color, count = 14, speed = 280) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (speed * (0.45 + Math.random() * 0.8)),
      vy: Math.sin(angle) * (speed * (0.45 + Math.random() * 0.8)),
      size: 3 + Math.random() * 6,
      life: 0.45 + Math.random() * 0.45,
      color,
      gravity: 600 + Math.random() * 420,
    });
  }
}

function resetRun() {
  player = createPlayer();
  particles = [];
  input.jumpQueued = 0;
  state.cameraX = 0;
  state.progress = 0;
  state.flash = 0;

  for (const orb of level.orbs) {
    orb.used = false;
    orb.pulse = Math.random() * Math.PI * 2;
  }
}

function startRun() {
  resetRun();
  state.mode = "running";
  updateOverlay();
}

function restartRun() {
  state.attempt += 1;
  resetRun();
  state.mode = "running";
  updateOverlay();
}

function setMode(mode) {
  state.mode = mode;
  updateOverlay();
}

function triggerJump() {
  if (state.mode === "ready") {
    startRun();
    input.jumpQueued = PHYSICS.jumpBuffer;
    return;
  }

  if (state.mode === "dead" || state.mode === "won") {
    restartRun();
    input.jumpQueued = PHYSICS.jumpBuffer;
    return;
  }

  input.jumpQueued = PHYSICS.jumpBuffer;
}

function requestRestart() {
  if (state.mode === "ready") {
    startRun();
    return;
  }

  restartRun();
}

function die() {
  if (state.mode !== "running") {
    return;
  }

  spawnBurst(player.x + player.w / 2, player.y + player.h / 2, COLORS.coral, 24, 380);
  state.flash = 0.18;
  setMode("dead");
}

function win() {
  if (state.mode !== "running") {
    return;
  }

  state.progress = 1;
  spawnBurst(player.x + player.w / 2, player.y + player.h / 2, COLORS.gold, 30, 420);
  state.flash = 0.18;
  setMode("won");
}

function updateOverlay() {
  const views = {
    ready: {
      tag: "Niveau demo",
      title: "Neon Dash",
      body: "Clique, touche ou appuie sur Espace pour lancer la course.",
      button: "Jouer",
    },
    running: null,
    dead: {
      tag: "Crash",
      title: "Repars plus fort",
      body: "Les pics, les murs et les trous sont mortels. Retente la ligne.",
      button: "Recommencer",
    },
    won: {
      tag: "Clear",
      title: "Niveau valide",
      body: "Tu as traverse le parcours. Relance une tentative pour optimiser ta run.",
      button: "Relancer",
    },
  };

  const data = views[state.mode];
  if (!data) {
    overlay.classList.add("hidden");
    return;
  }

  overlay.classList.remove("hidden");
  overlayTag.textContent = data.tag;
  overlayTitle.textContent = data.title;
  overlayBody.textContent = data.body;
  overlayButton.textContent = data.button;
}

function updateHud() {
  const percentage = Math.round(state.progress * 100);
  attemptLabel.textContent = `Tentative ${state.attempt}`;
  percentLabel.textContent = `${percentage}%`;

  const labels = {
    ready: "Pret",
    running: "En course",
    dead: "Crash",
    won: "Clear",
  };

  statusLabel.textContent = labels[state.mode];
  progressFill.style.width = `${percentage}%`;
}

function tryGroundJump() {
  if (input.jumpQueued > 0 && player.coyoteTimer > 0) {
    player.vy = -PHYSICS.jumpVelocity;
    player.grounded = false;
    player.coyoteTimer = 0;
    input.jumpQueued = 0;
    spawnBurst(player.x + player.w / 2, player.y + player.h, COLORS.mint, 8, 140);
  }
}

function tryOrbJump() {
  if (input.jumpQueued <= 0 || player.grounded) {
    return;
  }

  for (const orb of level.orbs) {
    if (orb.used) {
      continue;
    }

    if (circleRectOverlap(orb, player)) {
      orb.used = true;
      player.vy = -orb.power;
      input.jumpQueued = 0;
      spawnBurst(orb.x, orb.y, COLORS.cyan, 16, 260);
      break;
    }
  }
}

function resolveHorizontal(delta) {
  player.x += player.vx * delta;

  for (const solid of level.solids) {
    if (rectsIntersect(player, solid)) {
      die();
      return;
    }
  }
}

function resolveVertical(delta) {
  const previousY = player.y;
  player.vy = Math.min(player.vy + PHYSICS.gravity * delta, PHYSICS.maxFall);
  player.y += player.vy * delta;
  player.grounded = false;

  for (const solid of level.solids) {
    if (!rectsIntersect(player, solid)) {
      continue;
    }

    const previousBottom = previousY + player.h;
    const solidBottom = solid.y + solid.h;

    if (player.vy >= 0 && previousBottom <= solid.y + 4) {
      player.y = solid.y - player.h;
      player.vy = 0;
      player.grounded = true;
      continue;
    }

    if (player.vy < 0 && previousY >= solidBottom - 4) {
      player.y = solidBottom;
      player.vy = 0;
      continue;
    }

    die();
    return;
  }

  if (player.grounded) {
    player.coyoteTimer = PHYSICS.coyote;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - delta);
  }
}

function updatePads() {
  let touchingPad = false;

  for (const pad of level.pads) {
    const aligned =
      player.x + player.w > pad.x + 4 &&
      player.x < pad.x + pad.w - 4 &&
      Math.abs(player.y + player.h - (pad.y + pad.h)) < 5;

    if (player.grounded && aligned) {
      touchingPad = true;
      if (!player.padLock) {
        player.vy = -pad.power;
        player.grounded = false;
        player.coyoteTimer = 0;
        player.padLock = true;
        spawnBurst(player.x + player.w / 2, pad.y, COLORS.coral, 16, 240);
      }
    }
  }

  if (!touchingPad) {
    player.padLock = false;
  }
}

function updateHazards() {
  for (const hazard of level.hazards) {
    if (rectsIntersect(player, hazard)) {
      die();
      return;
    }
  }

  if (player.y > VIEW.height + 140) {
    die();
  }
}

function updateParticles(delta) {
  particles = particles.filter((particle) => particle.life > 0);

  for (const particle of particles) {
    particle.life -= delta;
    particle.vy += particle.gravity * delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
  }
}

function updateTrail(delta) {
  player.trail.push({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    life: 0.42,
  });

  player.trail = player.trail
    .map((point) => ({ ...point, life: point.life - delta }))
    .filter((point) => point.life > 0);
}

function update(delta) {
  updateParticles(delta);

  for (const orb of level.orbs) {
    orb.pulse += delta * 5.8;
  }

  state.flash = Math.max(0, state.flash - delta);

  if (state.mode !== "running") {
    state.cameraX = clamp(player.x - VIEW.width * 0.25, 0, level.length - VIEW.width);
    updateHud();
    return;
  }

  input.jumpQueued = Math.max(0, input.jumpQueued - delta);
  tryGroundJump();
  resolveHorizontal(delta);
  if (state.mode !== "running") {
    updateHud();
    return;
  }

  tryOrbJump();
  resolveVertical(delta);
  if (state.mode !== "running") {
    updateHud();
    return;
  }

  updatePads();
  updateHazards();
  if (state.mode !== "running") {
    updateHud();
    return;
  }

  player.rotation += delta * (player.grounded ? 5.2 : 9.2);
  state.cameraX = clamp(player.x - VIEW.width * 0.28, 0, level.length - VIEW.width);
  state.progress = clamp(player.x / level.goalX, 0, 1);
  updateTrail(delta);

  if (player.x + player.w >= level.goalX) {
    win();
  }

  updateHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(0.56, COLORS.skyMid);
  gradient.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "rgba(121, 245, 223, 0.14)";
  ctx.beginPath();
  ctx.arc(740, 120, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = -state.cameraX * 0.08 % 48; x < VIEW.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }

  for (let y = 20; y < VIEW.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }

  for (const band of parallaxBands) {
    const screenX = band.x - state.cameraX * band.speed;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(screenX, band.y, band.width, band.height);
    ctx.fillStyle = "rgba(121, 245, 223, 0.08)";
    ctx.fillRect(screenX + 10, band.y + 6, band.width - 20, 4);
  }

  for (const building of skyline) {
    const screenX = building.x - state.cameraX * building.speed;
    ctx.fillStyle = "rgba(6, 13, 26, 0.32)";
    ctx.fillRect(screenX, BASELINE - building.height + 20, building.width, building.height);
    ctx.fillStyle = "rgba(72, 216, 255, 0.16)";
    ctx.fillRect(screenX + 10, BASELINE - building.height + 40, 10, 14);
    ctx.fillRect(screenX + 34, BASELINE - building.height + 62, 12, 14);
  }
}

function drawGroundGlow() {
  const glow = ctx.createLinearGradient(0, BASELINE - 12, 0, BASELINE + 54);
  glow.addColorStop(0, "rgba(71, 216, 255, 0.38)");
  glow.addColorStop(1, "rgba(71, 216, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, BASELINE - 12, VIEW.width, 88);
}

function drawSolid(solid) {
  const screenX = solid.x - state.cameraX;
  if (screenX + solid.w < -60 || screenX > VIEW.width + 60) {
    return;
  }

  const topColor = solid.type === "ground" ? "#2b69b2" : "#2e5a94";
  const sideColor = solid.type === "ground" ? COLORS.deep : "#142846";

  ctx.fillStyle = sideColor;
  ctx.fillRect(screenX, solid.y, solid.w, solid.h);

  ctx.fillStyle = topColor;
  ctx.fillRect(screenX, solid.y, solid.w, Math.min(28, solid.h));

  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  ctx.fillRect(screenX + 6, solid.y + 6, Math.max(0, solid.w - 12), 6);

  ctx.strokeStyle = "rgba(121, 245, 223, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, solid.y, solid.w, solid.h);
}

function drawSpike(hazard) {
  const screenX = hazard.x - state.cameraX;
  if (screenX + hazard.w < -40 || screenX > VIEW.width + 40) {
    return;
  }

  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.moveTo(screenX, hazard.y + hazard.h);
  ctx.lineTo(screenX + hazard.w / 2, hazard.y);
  ctx.lineTo(screenX + hazard.w, hazard.y + hazard.h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPad(pad) {
  const screenX = pad.x - state.cameraX;
  if (screenX + pad.w < -40 || screenX > VIEW.width + 40) {
    return;
  }

  ctx.fillStyle = "#ff9c8e";
  ctx.fillRect(screenX, pad.y, pad.w, pad.h);
  ctx.fillStyle = "#ffe9b7";
  ctx.fillRect(screenX + 6, pad.y + 3, pad.w - 12, 4);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, pad.y, pad.w, pad.h);
}

function drawOrb(orb) {
  const screenX = orb.x - state.cameraX;
  if (screenX + orb.r < -40 || screenX - orb.r > VIEW.width + 40) {
    return;
  }

  const pulse = 1 + Math.sin(orb.pulse) * 0.12;
  const radius = orb.r * pulse;

  ctx.globalAlpha = orb.used ? 0.25 : 1;
  ctx.fillStyle = "rgba(72, 216, 255, 0.22)";
  ctx.beginPath();
  ctx.arc(screenX, orb.y, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.arc(screenX, orb.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSigns() {
  ctx.textAlign = "left";
  ctx.font = '700 17px "Trebuchet MS", sans-serif';
  for (const sign of level.signs) {
    const screenX = sign.x - state.cameraX;
    if (screenX < -180 || screenX > VIEW.width + 40) {
      continue;
    }

    ctx.fillStyle = "rgba(7, 15, 30, 0.74)";
    ctx.fillRect(screenX - 10, sign.y - 26, sign.text.length * 8.8, 34);
    ctx.strokeStyle = "rgba(160, 225, 255, 0.16)";
    ctx.strokeRect(screenX - 10, sign.y - 26, sign.text.length * 8.8, 34);
    ctx.fillStyle = sign.tone;
    ctx.fillText(sign.text, screenX, sign.y - 4);
  }
}

function drawGoal() {
  const screenX = level.goalX - state.cameraX;
  if (screenX < -80 || screenX > VIEW.width + 80) {
    return;
  }

  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(screenX, 280, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 211, 110, 0.18)";
  ctx.beginPath();
  ctx.arc(screenX, 280, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(screenX - 4, 180, 8, 150);
  ctx.fillStyle = "#fff4ca";
  ctx.beginPath();
  ctx.moveTo(screenX + 4, 190);
  ctx.lineTo(screenX + 64, 210);
  ctx.lineTo(screenX + 4, 234);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const screenX = player.x - state.cameraX;

  for (const point of player.trail) {
    const alpha = point.life / 0.42;
    ctx.globalAlpha = alpha * 0.22;
    ctx.fillStyle = COLORS.mint;
    ctx.beginPath();
    ctx.arc(point.x - state.cameraX, point.y, 14 * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(screenX + player.w / 2, player.y + player.h / 2);
  ctx.rotate(player.rotation);

  ctx.fillStyle = "rgba(121, 245, 223, 0.28)";
  ctx.fillRect(-22, -22, 44, 44);

  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-16, -16, 32, 32);

  ctx.fillStyle = COLORS.playerCore;
  ctx.fillRect(-9, -9, 18, 18);

  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(-13, -13, 6, 6);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(7, -13, 6, 6);
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 1.6);
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      particle.x - state.cameraX - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size
    );
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawBackground();
  drawGroundGlow();

  for (const solid of level.solids) {
    drawSolid(solid);
  }

  for (const pad of level.pads) {
    drawPad(pad);
  }

  for (const hazard of level.hazards) {
    drawSpike(hazard);
  }

  for (const orb of level.orbs) {
    drawOrb(orb);
  }

  drawGoal();
  drawSigns();
  drawPlayer();
  drawParticles();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 1.9})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function onPointerJump(event) {
  event.preventDefault();
  triggerJump();
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    triggerJump();
  }

  if (event.code === "KeyR") {
    event.preventDefault();
    requestRestart();
  }
});

canvas.addEventListener("pointerdown", onPointerJump);
overlayButton.addEventListener("click", triggerJump);
jumpButton.addEventListener("pointerdown", onPointerJump);
restartButton.addEventListener("click", requestRestart);
overlay.addEventListener("pointerdown", (event) => {
  if (event.target === overlay) {
    onPointerJump(event);
  }
});

function frame(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.022);
  state.lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(frame);
}

resizeCanvas();
resetRun();
setMode("ready");
updateHud();
requestAnimationFrame(frame);
