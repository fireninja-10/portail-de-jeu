const wheelOrder = [
  0,
  32,
  15,
  19,
  4,
  21,
  2,
  25,
  17,
  34,
  6,
  27,
  13,
  36,
  11,
  30,
  8,
  23,
  10,
  5,
  24,
  16,
  33,
  1,
  20,
  14,
  31,
  9,
  22,
  18,
  29,
  7,
  28,
  12,
  35,
  3,
  26,
];

const redNumbers = new Set([
  1,
  3,
  5,
  7,
  9,
  12,
  14,
  16,
  18,
  19,
  21,
  23,
  25,
  27,
  30,
  32,
  34,
  36,
]);

const boardRows = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const columnDefinitions = [
  {
    key: "column-1",
    label: "Col 1",
    slipLabel: "Colonne 1",
    multiplier: 3,
    className: "column",
    matches: (number) => number > 0 && number % 3 === 1,
    sortOrder: 400,
  },
  {
    key: "column-2",
    label: "Col 2",
    slipLabel: "Colonne 2",
    multiplier: 3,
    className: "column",
    matches: (number) => number > 0 && number % 3 === 2,
    sortOrder: 401,
  },
  {
    key: "column-3",
    label: "Col 3",
    slipLabel: "Colonne 3",
    multiplier: 3,
    className: "column",
    matches: (number) => number > 0 && number % 3 === 0,
    sortOrder: 402,
  },
];

const outsideDefinitions = [
  {
    key: "red",
    label: "Rouge",
    slipLabel: "Rouge",
    multiplier: 2,
    className: "outside red",
    matches: (number) => number !== 0 && redNumbers.has(number),
    sortOrder: 200,
  },
  {
    key: "black",
    label: "Noir",
    slipLabel: "Noir",
    multiplier: 2,
    className: "outside black",
    matches: (number) => number !== 0 && !redNumbers.has(number),
    sortOrder: 201,
  },
  {
    key: "even",
    label: "Pair",
    slipLabel: "Pair",
    multiplier: 2,
    className: "outside",
    matches: (number) => number !== 0 && number % 2 === 0,
    sortOrder: 202,
  },
  {
    key: "odd",
    label: "Impair",
    slipLabel: "Impair",
    multiplier: 2,
    className: "outside",
    matches: (number) => number % 2 === 1,
    sortOrder: 203,
  },
  {
    key: "low",
    label: "Bas",
    slipLabel: "Bas 1-18",
    multiplier: 2,
    className: "outside",
    matches: (number) => number >= 1 && number <= 18,
    sortOrder: 204,
  },
  {
    key: "high",
    label: "Haut",
    slipLabel: "Haut 19-36",
    multiplier: 2,
    className: "outside",
    matches: (number) => number >= 19 && number <= 36,
    sortOrder: 205,
  },
];

const dozenDefinitions = [
  {
    key: "dozen-1",
    label: "1-12",
    slipLabel: "1re douzaine",
    multiplier: 3,
    className: "dozen",
    matches: (number) => number >= 1 && number <= 12,
    sortOrder: 300,
  },
  {
    key: "dozen-2",
    label: "13-24",
    slipLabel: "2e douzaine",
    multiplier: 3,
    className: "dozen",
    matches: (number) => number >= 13 && number <= 24,
    sortOrder: 301,
  },
  {
    key: "dozen-3",
    label: "25-36",
    slipLabel: "3e douzaine",
    multiplier: 3,
    className: "dozen",
    matches: (number) => number >= 25 && number <= 36,
    sortOrder: 302,
  },
];

const chipValues = [5, 10, 25, 50, 100, 250];
const spinDuration = 5800;
const wheelSlice = 360 / wheelOrder.length;
const moneyFormatter = new Intl.NumberFormat("fr-CA");

const state = {
  balance: 1000,
  selectedChip: 10,
  bets: new Map(),
  actionStack: [],
  spinning: false,
  rotation: 0,
  history: [],
  lastOutcome: null,
  highlightOutcome: null,
};

const els = {
  balanceValue: document.getElementById("balanceValue"),
  stakeValue: document.getElementById("stakeValue"),
  gainValue: document.getElementById("gainValue"),
  resultText: document.getElementById("resultText"),
  resultChip: document.getElementById("resultChip"),
  wheelRotor: document.getElementById("wheelRotor"),
  wheelSvg: document.getElementById("wheelSvg"),
  chipSet: document.getElementById("chipSet"),
  spinBtn: document.getElementById("spinBtn"),
  undoBtn: document.getElementById("undoBtn"),
  clearBtn: document.getElementById("clearBtn"),
  historyList: document.getElementById("historyList"),
  rouletteGrid: document.getElementById("rouletteGrid"),
  outsideGrid: document.getElementById("outsideGrid"),
  dozenGrid: document.getElementById("dozenGrid"),
  slipList: document.getElementById("slipList"),
};

const betDefinitions = new Map();
const betButtons = new Map();

function colorLabel(color) {
  switch (color) {
    case "red":
      return "Rouge";
    case "black":
      return "Noir";
    case "green":
      return "Vert";
    default:
      return "";
  }
}

function getNumberColor(number) {
  if (number === 0) return "green";
  return redNumbers.has(number) ? "red" : "black";
}

function formatMoney(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${moneyFormatter.format(Math.abs(value))}`;
}

function registerDefinition(def) {
  betDefinitions.set(def.key, def);
  return def;
}

function buildDefinitions() {
  registerDefinition({
    key: "num-0",
    label: "0",
    slipLabel: "0",
    boardLabel: "0",
    multiplier: 36,
    className: "zero green",
    matches: (number) => number === 0,
    sortOrder: 0,
  });

  for (let number = 1; number <= 36; number += 1) {
    registerDefinition({
      key: `num-${number}`,
      label: String(number),
      slipLabel: String(number),
      boardLabel: String(number),
      multiplier: 36,
      className: getNumberColor(number),
      matches: (value) => value === number,
      sortOrder: number,
    });
  }

  for (const def of outsideDefinitions) {
    registerDefinition({
      ...def,
      boardLabel: def.label,
    });
  }

  for (const def of dozenDefinitions) {
    registerDefinition({
      ...def,
      boardLabel: def.label,
    });
  }

  for (const def of columnDefinitions) {
    registerDefinition({
      ...def,
      boardLabel: def.label,
    });
  }
}

function polarPoint(angleDeg, radius, cx = 200, cy = 200) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function wedgePath(startAngle, endAngle, innerRadius, outerRadius) {
  const startOuter = polarPoint(startAngle, outerRadius);
  const endOuter = polarPoint(endAngle, outerRadius);
  const startInner = polarPoint(startAngle, innerRadius);
  const endInner = polarPoint(endAngle, innerRadius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function buildWheel() {
  const wheelParts = [];
  const outerRadius = 188;
  const innerRadius = 118;
  const labelRadius = 152;

  wheelParts.push(`
    <defs>
      <radialGradient id="wheelGlow" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#fdf3c8" stop-opacity="0.22" />
        <stop offset="55%" stop-color="#f2c94c" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#0a0f18" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="hubGlow" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="38%" stop-color="#f2c94c" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#d94b45" stop-opacity="0.28" />
      </radialGradient>
    </defs>
  `);

  wheelParts.push(`<circle cx="200" cy="200" r="196" fill="url(#wheelGlow)" />`);
  wheelParts.push(`<circle cx="200" cy="200" r="${outerRadius}" fill="#111824" stroke="rgba(255,255,255,0.12)" stroke-width="2" />`);

  wheelOrder.forEach((number, index) => {
    const startAngle = index * wheelSlice;
    const endAngle = (index + 1) * wheelSlice;
    const midAngle = startAngle + wheelSlice / 2;
    const color = getNumberColor(number);
    const fill =
      color === "red"
        ? "#d94b45"
        : color === "black"
        ? "#1a1f2b"
        : "#1ea86a";
    const textColor = color === "black" ? "#f6f1e8" : "#ffffff";
    const label = String(number);
    const textPoint = polarPoint(midAngle, labelRadius);
    const rotate = midAngle + 90;

    wheelParts.push(
      `<path d="${wedgePath(startAngle, endAngle, innerRadius, outerRadius)}" fill="${fill}" stroke="rgba(255,255,255,0.12)" stroke-width="1.4" />`,
    );
    wheelParts.push(
      `<text x="${textPoint.x}" y="${textPoint.y}" fill="${textColor}" font-family="Courier New, monospace" font-size="16" font-weight="700" text-anchor="middle" dominant-baseline="middle" paint-order="stroke" stroke="rgba(0,0,0,0.65)" stroke-width="2" transform="rotate(${rotate} ${textPoint.x} ${textPoint.y})">${label}</text>`,
    );
  });

  wheelParts.push(`<circle cx="200" cy="200" r="96" fill="#0b1019" stroke="rgba(242,201,76,0.22)" stroke-width="2" />`);
  wheelParts.push(`<circle cx="200" cy="200" r="68" fill="url(#hubGlow)" opacity="0.95" />`);
  wheelParts.push(`<circle cx="200" cy="200" r="32" fill="#fff8df" opacity="0.85" />`);
  wheelParts.push(`<circle cx="200" cy="200" r="18" fill="#0a0f18" opacity="0.95" />`);

  els.wheelSvg.innerHTML = wheelParts.join("");
}

function createBetButton(def) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bet-cell ${def.className}`;
  button.dataset.betKey = def.key;
  button.dataset.sortOrder = String(def.sortOrder ?? 0);
  button.setAttribute("aria-label", `${def.boardLabel}, retour x${def.multiplier}`);
  button.title = `${def.boardLabel} - retour x${def.multiplier}`;
  button.innerHTML = `
    <span class="cell-title">${def.boardLabel}</span>
    <span class="cell-meta">x${def.multiplier}</span>
    <span class="stake-badge"></span>
  `;
  button.addEventListener("click", () => placeBet(def.key));
  betButtons.set(def.key, button);
  return button;
}

function buildBoard() {
  els.rouletteGrid.style.gridTemplateColumns = "84px repeat(12, minmax(64px, 1fr))";
  els.rouletteGrid.style.gridTemplateRows = "repeat(4, minmax(60px, auto))";

  const zeroButton = createBetButton(betDefinitions.get("num-0"));
  zeroButton.classList.add("zero");
  zeroButton.style.gridColumn = "1";
  zeroButton.style.gridRow = "1 / span 3";
  els.rouletteGrid.appendChild(zeroButton);

  boardRows.forEach((row, rowIndex) => {
    row.forEach((number, colIndex) => {
      const button = createBetButton(betDefinitions.get(`num-${number}`));
      button.classList.add("number");
      button.style.gridRow = String(rowIndex + 1);
      button.style.gridColumn = String(colIndex + 2);
      els.rouletteGrid.appendChild(button);
    });
  });

  columnDefinitions.forEach((def, index) => {
    const button = createBetButton(betDefinitions.get(def.key));
    button.style.gridRow = "4";
    button.style.gridColumn = `${2 + index * 4} / span 4`;
    els.rouletteGrid.appendChild(button);
  });

  for (const def of outsideDefinitions) {
    const button = createBetButton(betDefinitions.get(def.key));
    button.classList.add("outside");
    els.outsideGrid.appendChild(button);
  }

  for (const def of dozenDefinitions) {
    const button = createBetButton(betDefinitions.get(def.key));
    button.classList.add("dozen");
    els.dozenGrid.appendChild(button);
  }
}

function buildChipSet() {
  chipValues.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-btn";
    button.dataset.chip = String(value);
    button.innerHTML = `<span>${formatMoney(value)}</span>`;
    button.addEventListener("click", () => {
      if (state.spinning) return;
      state.selectedChip = value;
      render();
    });
    els.chipSet.appendChild(button);
  });
}

function getTotalStake() {
  let total = 0;
  for (const entry of state.bets.values()) {
    total += entry.stake;
  }
  return total;
}

function updateOutcomeLabel() {
  if (state.spinning) {
    els.resultText.textContent = "La roue tourne...";
    els.resultChip.textContent = "...";
    els.resultChip.className = "result-chip";
    return;
  }

  if (!state.lastOutcome) {
    els.resultText.textContent = "Pret a jouer";
    els.resultChip.textContent = "--";
    els.resultChip.className = "result-chip";
    return;
  }

  const { number, color, net } = state.lastOutcome;
  const sign = net >= 0 ? "+" : "";
  els.resultText.textContent = `${number} ${colorLabel(color)}  ${sign}${formatMoney(net)} cr`;
  els.resultChip.textContent = String(number);
  els.resultChip.className = `result-chip ${color}`;
}

function updateTopStats() {
  els.balanceValue.textContent = `${formatMoney(state.balance)} cr`;
  els.stakeValue.textContent = `${formatMoney(getTotalStake())} cr`;
  els.gainValue.textContent = state.lastOutcome
    ? `${state.lastOutcome.net >= 0 ? "+" : ""}${formatMoney(state.lastOutcome.net)} cr`
    : "0 cr";
}

function applySpinLock() {
  document.body.classList.toggle("is-spinning", state.spinning);
  els.spinBtn.disabled = state.spinning || getTotalStake() === 0;
  els.spinBtn.textContent = state.spinning ? "En cours..." : "Lancer";
  els.undoBtn.disabled = state.spinning || state.actionStack.length === 0;
  els.clearBtn.disabled = state.spinning || state.bets.size === 0;

  for (const button of betButtons.values()) {
    button.disabled = state.spinning;
  }

  for (const button of els.chipSet.querySelectorAll("button")) {
    button.disabled = state.spinning;
  }
}

function renderHistory() {
  els.historyList.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "slip-empty";
    empty.textContent = "Aucun tirage pour le moment.";
    els.historyList.appendChild(empty);
    return;
  }

  state.history.slice(0, 7).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const left = document.createElement("div");
    left.className = "history-left";

    const numberLine = document.createElement("strong");
    numberLine.textContent = `${entry.number} ${colorLabel(entry.color)}`;

    const metaLine = document.createElement("span");
    metaLine.textContent = `${entry.wins} pari(s) gagnant(s)`;

    const right = document.createElement("div");
    right.className = "history-right";

    const gain = document.createElement("strong");
    gain.className = `history-gain ${entry.net >= 0 ? "positive" : "negative"}`;
    gain.textContent = `${entry.net >= 0 ? "+" : ""}${formatMoney(entry.net)} cr`;

    const stake = document.createElement("span");
    stake.textContent = `Mise ${formatMoney(entry.stake)} cr`;

    left.append(numberLine, metaLine);
    right.append(gain, stake);
    item.append(left, right);
    els.historyList.appendChild(item);
  });
}

function renderSlip() {
  els.slipList.innerHTML = "";
  const entries = [...state.bets.entries()]
    .map(([key, entry]) => {
      const def = betDefinitions.get(key);
      return {
        key,
        amount: entry.stake,
        def,
      };
    })
    .sort((a, b) => (a.def.sortOrder ?? 0) - (b.def.sortOrder ?? 0));

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "slip-empty";
    empty.textContent = "Pose un jeton sur un numero ou un pari pour commencer.";
    els.slipList.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("article");
    row.className = "slip-item";

    const text = document.createElement("div");
    text.className = "slip-text";

    const title = document.createElement("strong");
    title.textContent = entry.def.slipLabel;

    const subtitle = document.createElement("span");
    subtitle.textContent = `Retour x${entry.def.multiplier}`;

    const actions = document.createElement("div");
    actions.className = "slip-actions";

    const pill = document.createElement("div");
    pill.className = "slip-pill";
    pill.textContent = `${formatMoney(entry.amount)} cr`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-bet";
    remove.textContent = "×";
    remove.addEventListener("click", () => removeBet(entry.key));

    text.append(title, subtitle);
    actions.append(pill, remove);
    row.append(text, actions);
    els.slipList.appendChild(row);
  }
}

function renderBoardState() {
  for (const [key, button] of betButtons.entries()) {
    const def = betDefinitions.get(key);
    const amount = state.bets.get(key)?.stake ?? 0;
    const badge = button.querySelector(".stake-badge");

    button.classList.toggle("has-stake", amount > 0);
    button.setAttribute("aria-pressed", amount > 0 ? "true" : "false");

    if (badge) {
      badge.textContent = amount > 0 ? `${formatMoney(amount)}` : "";
    }

    const isWinner = state.highlightOutcome ? def.matches(state.highlightOutcome.number) : false;
    button.classList.toggle("winner", Boolean(isWinner));
  }
}

function renderChipState() {
  for (const button of els.chipSet.querySelectorAll("button")) {
    const chip = Number(button.dataset.chip);
    button.classList.toggle("active", chip === state.selectedChip);
  }
}

function render() {
  updateTopStats();
  updateOutcomeLabel();
  renderSlip();
  renderHistory();
  renderBoardState();
  renderChipState();
  applySpinLock();
}

function setNotice(message) {
  els.resultText.textContent = message;
}

function flashTopPanel() {
  const panel = document.querySelector(".hero");
  if (!panel) return;
  panel.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(-2px)" },
      { transform: "translateX(0)" },
    ],
    {
      duration: 260,
      easing: "ease-out",
    },
  );
}

function placeBet(key) {
  if (state.spinning) return;

  const def = betDefinitions.get(key);
  if (!def) return;

  const chip = state.selectedChip;
  if (state.balance < chip) {
    setNotice("Solde insuffisant");
    flashTopPanel();
    return;
  }

  const entry = state.bets.get(key) ?? { stake: 0 };
  entry.stake += chip;
  state.bets.set(key, entry);
  state.balance -= chip;
  state.actionStack.push({ key, amount: chip });
  state.highlightOutcome = null;
  render();
}

function removeBet(key) {
  if (state.spinning) return;

  const entry = state.bets.get(key);
  if (!entry) return;

  state.balance += entry.stake;
  state.bets.delete(key);
  state.actionStack = state.actionStack.filter((action) => action.key !== key);
  state.highlightOutcome = null;
  render();
}

function undoLastBet() {
  if (state.spinning) return;

  const lastAction = state.actionStack.pop();
  if (!lastAction) return;

  const entry = state.bets.get(lastAction.key);
  if (!entry) {
    render();
    return;
  }

  entry.stake -= lastAction.amount;
  state.balance += lastAction.amount;

  if (entry.stake <= 0) {
    state.bets.delete(lastAction.key);
  }

  state.highlightOutcome = null;
  render();
}

function clearBets() {
  if (state.spinning) return;

  for (const entry of state.bets.values()) {
    state.balance += entry.stake;
  }

  state.bets.clear();
  state.actionStack = [];
  state.highlightOutcome = null;
  render();
}

function resolveSpin(number) {
  const color = getNumberColor(number);
  const totalStake = getTotalStake();
  let totalPayout = 0;
  let winningCount = 0;

  for (const [key, entry] of state.bets.entries()) {
    const def = betDefinitions.get(key);
    if (!def || !def.matches(number)) continue;

    totalPayout += entry.stake * def.multiplier;
    winningCount += 1;
  }

  const net = totalPayout - totalStake;
  state.balance += totalPayout;
  state.lastOutcome = {
    number,
    color,
    stake: totalStake,
    payout: totalPayout,
    net,
    wins: winningCount,
  };
  state.highlightOutcome = state.lastOutcome;
  state.history.unshift(state.lastOutcome);
  state.history = state.history.slice(0, 7);
  state.bets.clear();
  state.actionStack = [];
}

function targetRotationForNumber(number) {
  const index = wheelOrder.indexOf(number);
  const targetAngle = index * wheelSlice + wheelSlice / 2;
  const normalized = ((state.rotation % 360) + 360) % 360;
  const align = ((360 - normalized - targetAngle) % 360 + 360) % 360;
  const extraTurns = 6 + Math.floor(Math.random() * 3);
  return state.rotation + extraTurns * 360 + align;
}

function spinWheel() {
  if (state.spinning || getTotalStake() === 0) return;

  state.spinning = true;
  state.lastOutcome = null;
  state.highlightOutcome = null;
  render();

  const winningNumber = wheelOrder[Math.floor(Math.random() * wheelOrder.length)];
  const finalRotation = targetRotationForNumber(winningNumber);
  state.rotation = finalRotation;
  els.wheelRotor.style.transform = `rotate(${finalRotation}deg)`;

  window.setTimeout(() => {
    resolveSpin(winningNumber);
    state.spinning = false;
    render();
    els.wheelRotor.style.transform = `rotate(${state.rotation}deg)`;
  }, spinDuration + 120);
}

function bindEvents() {
  els.spinBtn.addEventListener("click", spinWheel);
  els.undoBtn.addEventListener("click", undoLastBet);
  els.clearBtn.addEventListener("click", clearBets);

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const activeElement = document.activeElement;
    const activeTag = activeElement?.tagName ?? "";
    if (activeTag && activeTag !== "BODY" && activeTag !== "HTML") {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      spinWheel();
      return;
    }

    if (event.key === "Backspace") {
      undoLastBet();
    }
  });
}

function init() {
  buildDefinitions();
  buildWheel();
  buildChipSet();
  buildBoard();
  bindEvents();
  state.lastOutcome = null;
  render();
}

init();
