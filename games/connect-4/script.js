const ROWS = 6;
const COLS = 7;
const EMPTY = null;

const boardElement = document.getElementById("board");
const currentPlayerElement = document.getElementById("current-player");
const currentTokenElement = document.getElementById("current-token");
const statusMessageElement = document.getElementById("status-message");
const scoreItemRedElement = document.getElementById("score-item-red");
const scoreItemYellowElement = document.getElementById("score-item-yellow");
const scoreLabelRedElement = document.getElementById("score-label-red");
const scoreLabelYellowElement = document.getElementById("score-label-yellow");
const scoreRedElement = document.getElementById("score-red");
const scoreYellowElement = document.getElementById("score-yellow");
const singlePlayerButton = document.getElementById("single-player-button");
const twoPlayerButton = document.getElementById("two-player-button");
const resetScoreButton = document.getElementById("reset-score-button");
const fullscreenButton = document.getElementById("fullscreen-button");

const TEAM_NAMES = {
  red: "Terminator",
  yellow: "Ultimatum",
};

const AI_PLAYER = "yellow";
const HUMAN_PLAYER = "red";
const AI_THINK_DELAY_MS = 120;
const AI_CENTER_WEIGHTS = [3, 4, 6, 8, 6, 4, 3];
const AI_MOVE_VARIANCE = 8;
const AI_NEAR_BEST_MARGIN = 14;
const AI_NEAR_BEST_PICK_CHANCE = 0.3;
const AI_THINK_MESSAGES = [
  "Ultimatum IA prépare un coup...",
  "Ultimatum IA lit la grille...",
  "Ultimatum IA monte un piège...",
  "Ultimatum IA réfléchit...",
];

let board = [];
let currentPlayer = "red";
let gameOver = false;
let gameMode = "single";
let scores = {
  red: 0,
  yellow: 0,
};
let aiTurnTimeout = null;
let hoveredColumn = null;

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function getPlayerName(player) {
  if (player === "yellow" && gameMode === "single") {
    return "Ultimatum IA";
  }

  return TEAM_NAMES[player];
}

function isColumnPlayable(col) {
  return !gameOver && board[0][col] === EMPTY;
}

function isHumanTurn() {
  return gameMode === "multi" || currentPlayer === HUMAN_PLAYER;
}

function getHoveredColumnFromEvent(event) {
  const target = event.target;

  if (target && typeof target.closest === "function") {
    const hoveredCell = target.closest(".cell");

    if (hoveredCell && boardElement.contains(hoveredCell)) {
      const hoveredCellColumn = Number(hoveredCell.dataset.col);

      if (!Number.isNaN(hoveredCellColumn)) {
        return hoveredCellColumn;
      }
    }
  }

  const boardRect = boardElement.getBoundingClientRect();

  if (
    event.clientX < boardRect.left ||
    event.clientX > boardRect.right ||
    event.clientY < boardRect.top ||
    event.clientY > boardRect.bottom
  ) {
    return null;
  }

  let closestColumn = null;
  let closestDistance = Infinity;

  for (let col = 0; col < COLS; col += 1) {
    const columnCell = boardElement.children[col];

    if (!(columnCell instanceof Element)) {
      continue;
    }

    const cellRect = columnCell.getBoundingClientRect();
    const cellCenterX = cellRect.left + (cellRect.width / 2);
    const distance = Math.abs(event.clientX - cellCenterX);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColumn = col;
    }
  }

  return closestColumn;
}

function updateHoveredColumnFromEvent(event) {
  const nextHoveredColumn = getHoveredColumnFromEvent(event);

  if (nextHoveredColumn === hoveredColumn) {
    return;
  }

  hoveredColumn = nextHoveredColumn;

  if (!gameOver && isHumanTurn()) {
    renderBoard();
  }
}

function clearHoveredColumn() {
  if (hoveredColumn === null) {
    return;
  }

  hoveredColumn = null;

  if (!gameOver && isHumanTurn()) {
    renderBoard();
  }
}

function clearAiTurn() {
  if (aiTurnTimeout !== null) {
    window.clearTimeout(aiTurnTimeout);
    aiTurnTimeout = null;
  }
}

function getOtherPlayer(player) {
  return player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getAvailableRow(boardState, col) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (boardState[row][col] === EMPTY) {
      return row;
    }
  }

  return -1;
}

function isBoardFullState(boardState) {
  return boardState[0].every((cell) => cell !== EMPTY);
}

function hasConnectFour(boardState, row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [rowStep, colStep] of directions) {
    let total = 1;
    total += countDirection(boardState, row, col, rowStep, colStep, player);
    total += countDirection(boardState, row, col, -rowStep, -colStep, player);

    if (total >= 4) {
      return true;
    }
  }

  return false;
}

function countDirection(boardState, startRow, startCol, rowStep, colStep, player) {
  let total = 0;
  let row = startRow + rowStep;
  let col = startCol + colStep;

  while (
    row >= 0 &&
    row < ROWS &&
    col >= 0 &&
    col < COLS &&
    boardState[row][col] === player
  ) {
    total += 1;
    row += rowStep;
    col += colStep;
  }

  return total;
}

function wouldPlayerWin(boardState, player, col) {
  const row = getAvailableRow(boardState, col);

  if (row === -1) {
    return false;
  }

  const nextBoard = boardState.map((boardRow) => [...boardRow]);
  nextBoard[row][col] = player;
  return hasConnectFour(nextBoard, row, col, player);
}

function getSimulatedBoard(boardState, player, col) {
  const row = getAvailableRow(boardState, col);

  if (row === -1) {
    return null;
  }

  const nextBoard = boardState.map((boardRow) => [...boardRow]);
  nextBoard[row][col] = player;
  return {
    board: nextBoard,
    row,
  };
}

function getWinningColumns(boardState, player) {
  const winningColumns = [];

  for (let col = 0; col < COLS; col += 1) {
    if (wouldPlayerWin(boardState, player, col)) {
      winningColumns.push(col);
    }
  }

  return winningColumns;
}

function scoreWindow(windowValues, player) {
  const opponent = getOtherPlayer(player);
  const playerCount = windowValues.filter((value) => value === player).length;
  const opponentCount = windowValues.filter((value) => value === opponent).length;
  const emptyCount = windowValues.filter((value) => value === EMPTY).length;

  if (playerCount === 4) {
    return 100000;
  }

  if (playerCount === 3 && emptyCount === 1) {
    return 140;
  }

  if (playerCount === 2 && emptyCount === 2) {
    return 28;
  }

  if (playerCount === 1 && emptyCount === 3) {
    return 5;
  }

  if (opponentCount === 3 && emptyCount === 1) {
    return -125;
  }

  if (opponentCount === 2 && emptyCount === 2) {
    return -20;
  }

  return 0;
}

function scoreBoardPosition(boardState, player) {
  let totalScore = 0;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      totalScore += scoreWindow(boardState[row].slice(col, col + 4), player);
    }
  }

  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      totalScore += scoreWindow([
        boardState[row][col],
        boardState[row + 1][col],
        boardState[row + 2][col],
        boardState[row + 3][col],
      ], player);
    }
  }

  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      totalScore += scoreWindow([
        boardState[row][col],
        boardState[row + 1][col + 1],
        boardState[row + 2][col + 2],
        boardState[row + 3][col + 3],
      ], player);
    }
  }

  for (let row = 3; row < ROWS; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      totalScore += scoreWindow([
        boardState[row][col],
        boardState[row - 1][col + 1],
        boardState[row - 2][col + 2],
        boardState[row - 3][col + 3],
      ], player);
    }
  }

  return totalScore;
}

function chooseAiColumn() {
  const availableColumns = [];

  for (let col = 0; col < COLS; col += 1) {
    if (getAvailableRow(board, col) !== -1) {
      availableColumns.push(col);
    }
  }

  const winningColumns = getWinningColumns(board, AI_PLAYER);
  if (winningColumns.length > 0) {
    return winningColumns[Math.floor(Math.random() * winningColumns.length)];
  }

  const blockingColumns = getWinningColumns(board, HUMAN_PLAYER);
  if (blockingColumns.length > 0) {
    const sortedBlocks = [...blockingColumns].sort((left, right) => AI_CENTER_WEIGHTS[right] - AI_CENTER_WEIGHTS[left]);
    return sortedBlocks[0];
  }

  const scoredMoves = availableColumns
    .map((col) => {
      const simulatedMove = getSimulatedBoard(board, AI_PLAYER, col);

      if (!simulatedMove) {
        return null;
      }

      const opponentWinningReplies = getWinningColumns(simulatedMove.board, HUMAN_PLAYER).length;
      const aiFollowUps = getWinningColumns(simulatedMove.board, AI_PLAYER).length;

      let score = scoreBoardPosition(simulatedMove.board, AI_PLAYER);
      score += AI_CENTER_WEIGHTS[col] * 12;
      score += simulatedMove.row * 2;
      score += aiFollowUps * 45;
      score -= opponentWinningReplies * 80;
      score += Math.random() * AI_MOVE_VARIANCE;

      return { col, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  if (scoredMoves.length === 0) {
    return -1;
  }

  const bestScore = scoredMoves[0].score;
  const nearBestMoves = scoredMoves.filter((move) => bestScore - move.score <= AI_NEAR_BEST_MARGIN);

  if (nearBestMoves.length > 1 && Math.random() < AI_NEAR_BEST_PICK_CHANCE) {
    return getRandomItem(nearBestMoves).col;
  }

  return scoredMoves[0].col;
}

function maybePlayAiTurn() {
  clearAiTurn();

  if (gameMode !== "single" || currentPlayer !== AI_PLAYER || gameOver) {
    return;
  }

  aiTurnTimeout = window.setTimeout(() => {
    aiTurnTimeout = null;

    if (gameMode !== "single" || currentPlayer !== AI_PLAYER || gameOver) {
      return;
    }

    const chosenColumn = chooseAiColumn();

    if (chosenColumn !== -1) {
      playColumn(chosenColumn);
    }
  }, AI_THINK_DELAY_MS);
}

function renderModeButtons() {
  singlePlayerButton.classList.toggle("active", gameMode === "single");
  twoPlayerButton.classList.toggle("active", gameMode === "multi");
}

function renderPlayerLabels() {
  scoreLabelRedElement.textContent = TEAM_NAMES.red;
  scoreLabelYellowElement.textContent = getPlayerName("yellow");
}

function renderBoard(winningCells = []) {
  boardElement.innerHTML = "";
  const winningSet = new Set(winningCells.map(([row, col]) => `${row}-${col}`));
  const previewColumn = isHumanTurn() ? hoveredColumn : null;
  const previewRow =
    previewColumn !== null && isColumnPlayable(previewColumn)
      ? getAvailableRow(board, previewColumn)
      : -1;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div");
      const value = board[row][col];
      cell.className = "cell";

      if (value) {
        cell.classList.add(value);
      }

      if (winningSet.has(`${row}-${col}`)) {
        cell.classList.add("winning");
      }

      if (row === previewRow && col === previewColumn) {
        cell.classList.add("preview", `preview-${currentPlayer}`);
      }

      if (isColumnPlayable(col) && isHumanTurn()) {
        cell.classList.add("playable");
        cell.tabIndex = 0;
        cell.setAttribute("aria-label", `${getCellLabel(row, col, value)}. Clique pour jouer dans la colonne ${col + 1}.`);
        cell.addEventListener("click", () => handleHumanColumnClick(col));
        cell.addEventListener("keydown", (event) => {
          if (event.code === "Enter" || event.code === "Space") {
            event.preventDefault();
            handleHumanColumnClick(col);
          }
        });
      } else {
        cell.setAttribute("aria-label", getCellLabel(row, col, value));
      }

      cell.setAttribute("role", "gridcell");
      cell.dataset.col = String(col);
      boardElement.appendChild(cell);
    }
  }
}

function getCellLabel(row, col, value) {
  if (value === "red") {
    return `Ligne ${row + 1}, colonne ${col + 1}, ${getPlayerName("red")}`;
  }

  if (value === "yellow") {
    return `Ligne ${row + 1}, colonne ${col + 1}, ${getPlayerName("yellow")}`;
  }

  return `Ligne ${row + 1}, colonne ${col + 1}, vide`;
}

function renderScores() {
  renderPlayerLabels();
  scoreRedElement.textContent = String(scores.red);
  scoreYellowElement.textContent = String(scores.yellow);

  if (scores.red > scores.yellow) {
    scoreItemRedElement.style.order = "0";
    scoreItemYellowElement.style.order = "1";
  } else if (scores.yellow > scores.red) {
    scoreItemRedElement.style.order = "1";
    scoreItemYellowElement.style.order = "0";
  } else {
    scoreItemRedElement.style.order = "0";
    scoreItemYellowElement.style.order = "1";
  }
}

function updateStatus(message) {
  currentPlayerElement.textContent = getPlayerName(currentPlayer);
  currentTokenElement.className = `token ${currentPlayer === "red" ? "token-red" : "token-yellow"}`;
  statusMessageElement.textContent = message;
}

function dropToken(col) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row][col] === EMPTY) {
      board[row][col] = currentPlayer;
      return row;
    }
  }

  return -1;
}

function isBoardFull() {
  return isBoardFullState(board);
}

function getWinningCells(row, col) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [rowStep, colStep] of directions) {
    const cells = [[row, col]];
    cells.push(...collectDirection(row, col, rowStep, colStep));
    cells.unshift(...collectDirection(row, col, -rowStep, -colStep));

    if (cells.length >= 4) {
      return cells;
    }
  }

  return null;
}

function collectDirection(startRow, startCol, rowStep, colStep) {
  const cells = [];
  let row = startRow + rowStep;
  let col = startCol + colStep;

  while (
    row >= 0 &&
    row < ROWS &&
    col >= 0 &&
    col < COLS &&
    board[row][col] === currentPlayer
  ) {
    cells.push([row, col]);
    row += rowStep;
    col += colStep;
  }

  return cells;
}

function playColumn(col) {
  if (gameOver) {
    return;
  }

  if (!isColumnPlayable(col)) {
    return;
  }

  clearAiTurn();
  const row = dropToken(col);

  if (row === -1) {
    updateStatus("Cette colonne est pleine. Essaie une autre.");
    return;
  }

  const winningCells = getWinningCells(row, col);

  if (winningCells) {
    gameOver = true;
    scores[currentPlayer] += 1;
    renderBoard(winningCells);
    renderScores();
    updateStatus(`${getPlayerName(currentPlayer)} gagne la partie !`);
    return;
  }

  if (isBoardFull()) {
    gameOver = true;
    renderBoard();
    updateStatus("Match nul, la grille est remplie.");
    return;
  }

  currentPlayer = currentPlayer === "red" ? "yellow" : "red";
  renderBoard();
  if (gameMode === "single" && currentPlayer === AI_PLAYER) {
    updateStatus(getRandomItem(AI_THINK_MESSAGES));
    maybePlayAiTurn();
    return;
  }

  updateStatus(`Au tour de ${getPlayerName(currentPlayer)}.`);
}

function handleHumanColumnClick(col) {
  if (gameOver || (gameMode === "single" && currentPlayer === AI_PLAYER)) {
    return;
  }

  playColumn(col);
}

function setGameMode(mode) {
  gameMode = mode;
  clearAiTurn();
  renderModeButtons();
  renderScores();
  resetGame();
}

function resetGame() {
  clearAiTurn();
  board = createEmptyBoard();
  currentPlayer = "red";
  gameOver = false;
  renderBoard();
  updateStatus(gameMode === "single" ? "Clique dans une colonne pour affronter l'IA." : "Clique dans une colonne pour commencer.");
}

function resetScores() {
  clearAiTurn();
  scores = {
    red: 0,
    yellow: 0,
  };
  renderScores();
  resetGame();
}

function syncFullscreenState() {
  const isFullscreen = document.fullscreenElement !== null;
  document.body.classList.toggle("is-fullscreen", isFullscreen);
}

function enterFullscreen() {
  if (!document.fullscreenEnabled || document.fullscreenElement) {
    return;
  }

  document.documentElement.requestFullscreen().catch(() => {});
}

singlePlayerButton.addEventListener("click", () => setGameMode("single"));
twoPlayerButton.addEventListener("click", () => setGameMode("multi"));
resetScoreButton.addEventListener("click", resetScores);

if (fullscreenButton) {
  if (document.fullscreenEnabled) {
    fullscreenButton.addEventListener("click", enterFullscreen);
  } else {
    fullscreenButton.hidden = true;
  }
}

document.addEventListener("fullscreenchange", syncFullscreenState);
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    resetGame();
  }
});

boardElement.addEventListener("pointerenter", updateHoveredColumnFromEvent);
boardElement.addEventListener("pointermove", updateHoveredColumnFromEvent);
boardElement.addEventListener("pointerleave", clearHoveredColumn);

renderModeButtons();
renderScores();
resetGame();
syncFullscreenState();
