const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_LABELS = {
  k: "K",
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
  p: "P",
};
const PIECE_NAMES = {
  k: "roi",
  q: "reine",
  r: "tour",
  b: "fou",
  n: "cavalier",
  p: "pion",
};
const SIDE_NAMES = {
  w: "blancs",
  b: "noirs",
};
const PROMOTION_NAMES = {
  q: "Reine",
  r: "Tour",
  b: "Fou",
  n: "Cavalier",
};
const CAPTURE_SORT_ORDER = {
  q: 0,
  r: 1,
  b: 2,
  n: 3,
  p: 4,
  k: 5,
};
const SVG_NS = "http://www.w3.org/2000/svg";
const PIECE_IMAGE_URLS = {
  w: {
    k: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_klt45.svg",
    q: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_qlt45.svg",
    r: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_rlt45.svg",
    b: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_blt45.svg",
    n: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_nlt45.svg",
    p: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_plt45.svg",
  },
  b: {
    k: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_kdt45.svg",
    q: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_qdt45.svg",
    r: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_rdt45.svg",
    b: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_bdt45.svg",
    n: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_ndt45.svg",
    p: "https://commons.wikimedia.org/wiki/Special:FilePath/Chess_pdt45.svg",
  },
};
const PIECE_VALUES = {
  k: 0,
  q: 900,
  r: 500,
  b: 330,
  n: 320,
  p: 100,
};
const AI_LEVELS = [
  { level: 1, elo: 300, depth: 0, pickCount: 8, randomness: 520, branchLimit: 8, delay: 320 },
  { level: 2, elo: 450, depth: 0, pickCount: 6, randomness: 360, branchLimit: 10, delay: 340 },
  { level: 3, elo: 600, depth: 1, pickCount: 5, randomness: 220, branchLimit: 12, delay: 360 },
  { level: 4, elo: 700, depth: 1, pickCount: 3, randomness: 150, branchLimit: 14, delay: 380 },
  { level: 5, elo: 800, depth: 2, pickCount: 3, randomness: 110, branchLimit: 10, delay: 420 },
  { level: 6, elo: 900, depth: 2, pickCount: 2, randomness: 70, branchLimit: 12, delay: 450 },
  { level: 7, elo: 1000, depth: 2, pickCount: 1, randomness: 28, branchLimit: 14, delay: 520 },
  { level: 8, elo: 1200, depth: 3, pickCount: 1, randomness: 10, branchLimit: 12, delay: 620 },
];
const THEME_OPTIONS = [
  { id: "laser", label: "Laser" },
  { id: "ember", label: "Embrasement" },
  { id: "frost", label: "Glace" },
  { id: "emerald", label: "Emeraude" },
  { id: "sand", label: "Sable" },
  { id: "obsidian", label: "Obsidienne" },
];
const THEME_PRESETS = {
  laser: {
    frame: "linear-gradient(145deg, #122348 0%, #08152d 22%, #10265a 50%, #200e3b 78%, #070d1f 100%)",
    light: "#163b63",
    dark: "#101c3d",
    border: "rgba(255, 60, 166, 0.3)",
    frameBorder: "rgba(80, 221, 255, 0.28)",
    boardGlow: "0 0 24px rgba(125, 44, 255, 0.18)",
    lightOverlay: "linear-gradient(180deg, rgba(106, 229, 255, 0.16), rgba(0, 0, 0, 0.08))",
    darkOverlay: "linear-gradient(180deg, rgba(255, 60, 166, 0.08), rgba(0, 0, 0, 0.14))",
    background:
      "linear-gradient(to right, rgba(120, 0, 20, 0.95) 0%, rgba(120, 0, 20, 0.34) 18%, transparent 34%, transparent 66%, rgba(120, 0, 20, 0.34) 82%, rgba(120, 0, 20, 0.95) 100%), linear-gradient(to bottom, rgba(120, 0, 20, 0.92) 0%, rgba(120, 0, 20, 0.3) 18%, transparent 34%, transparent 66%, rgba(120, 0, 20, 0.3) 82%, rgba(120, 0, 20, 0.92) 100%), radial-gradient(ellipse at center, #000000 0%, #000000 34%, #090002 50%, #1a0005 66%, #42000d 84%, #750015 100%)",
    gridColor: "rgba(0, 0, 0, 0.22)",
    gridOpacity: "0.55",
    scanA: "rgba(0, 0, 0, 0.03)",
    scanB: "rgba(0, 0, 0, 0.06)",
    scanOpacity: "0.35",
  },
  ember: {
    frame: "linear-gradient(145deg, #42090e 0%, #220408 22%, #581115 50%, #2f0508 78%, #120103 100%)",
    light: "#7a1f2f",
    dark: "#3b0912",
    border: "rgba(255, 104, 88, 0.34)",
    frameBorder: "rgba(255, 124, 96, 0.28)",
    boardGlow: "0 0 24px rgba(255, 82, 82, 0.18)",
    lightOverlay: "linear-gradient(180deg, rgba(255, 155, 93, 0.16), rgba(0, 0, 0, 0.08))",
    darkOverlay: "linear-gradient(180deg, rgba(255, 60, 60, 0.12), rgba(0, 0, 0, 0.18))",
    background:
      "linear-gradient(to right, rgba(150, 24, 0, 0.88) 0%, rgba(150, 24, 0, 0.28) 20%, transparent 36%, transparent 64%, rgba(150, 24, 0, 0.28) 80%, rgba(150, 24, 0, 0.88) 100%), linear-gradient(to bottom, rgba(255, 102, 35, 0.24) 0%, transparent 26%, transparent 74%, rgba(255, 77, 0, 0.22) 100%), radial-gradient(circle at center, #160302 0%, #250403 28%, #43100a 54%, #7d210d 76%, #d84a18 100%)",
    gridColor: "rgba(36, 0, 0, 0.22)",
    gridOpacity: "0.42",
    scanA: "rgba(255, 90, 0, 0.03)",
    scanB: "rgba(0, 0, 0, 0.08)",
    scanOpacity: "0.26",
    ambientOrbA: "rgba(255, 98, 52, 0.24)",
    ambientOrbB: "rgba(255, 189, 102, 0.18)",
    ambientSunCore: "rgba(255, 243, 220, 0.92)",
    ambientSunMid: "rgba(255, 108, 62, 0.72)",
    ambientSunEdge: "rgba(255, 184, 102, 0.28)",
    ambientGrid: "rgba(255, 126, 66, 0.18)",
    ambientBeamA: "rgba(255, 128, 64, 0.08)",
    ambientBeamB: "rgba(255, 210, 120, 0.08)",
  },
  frost: {
    frame: "linear-gradient(145deg, #d7eef9 0%, #b0d8ea 22%, #eefbff 50%, #9abfd1 78%, #dff4ff 100%)",
    light: "#edf8ff",
    dark: "#7cb0cf",
    border: "rgba(124, 196, 255, 0.42)",
    frameBorder: "rgba(206, 241, 255, 0.52)",
    boardGlow: "0 0 24px rgba(122, 222, 255, 0.18)",
    lightOverlay: "linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(0, 0, 0, 0.04))",
    darkOverlay: "linear-gradient(180deg, rgba(198, 236, 255, 0.18), rgba(0, 0, 0, 0.08))",
    background:
      "linear-gradient(to right, rgba(133, 210, 255, 0.62) 0%, rgba(133, 210, 255, 0.18) 20%, transparent 36%, transparent 64%, rgba(133, 210, 255, 0.18) 80%, rgba(133, 210, 255, 0.62) 100%), linear-gradient(to bottom, rgba(232, 250, 255, 0.4) 0%, transparent 28%, transparent 72%, rgba(176, 232, 255, 0.32) 100%), radial-gradient(circle at center, #f5fdff 0%, #d9f3ff 24%, #9fd0eb 48%, #4b87ab 76%, #16314b 100%)",
    gridColor: "rgba(235, 250, 255, 0.26)",
    gridOpacity: "0.28",
    scanA: "rgba(255, 255, 255, 0.05)",
    scanB: "rgba(41, 85, 112, 0.05)",
    scanOpacity: "0.18",
    ambientOrbA: "rgba(184, 240, 255, 0.24)",
    ambientOrbB: "rgba(138, 198, 255, 0.18)",
    ambientSunCore: "rgba(255, 255, 255, 0.94)",
    ambientSunMid: "rgba(170, 236, 255, 0.74)",
    ambientSunEdge: "rgba(104, 176, 232, 0.28)",
    ambientGrid: "rgba(235, 250, 255, 0.18)",
    ambientBeamA: "rgba(214, 245, 255, 0.08)",
    ambientBeamB: "rgba(144, 196, 235, 0.08)",
  },
  emerald: {
    frame: "linear-gradient(145deg, #0a3f2b 0%, #07271a 22%, #0e5f3e 50%, #093223 78%, #04140d 100%)",
    light: "#a3e5bc",
    dark: "#1c6a47",
    border: "rgba(64, 214, 147, 0.34)",
    frameBorder: "rgba(98, 255, 190, 0.26)",
    boardGlow: "0 0 24px rgba(36, 214, 132, 0.18)",
    lightOverlay: "linear-gradient(180deg, rgba(214, 255, 232, 0.16), rgba(0, 0, 0, 0.06))",
    darkOverlay: "linear-gradient(180deg, rgba(62, 222, 140, 0.12), rgba(0, 0, 0, 0.14))",
    background:
      "linear-gradient(to right, rgba(0, 120, 72, 0.78) 0%, rgba(0, 120, 72, 0.22) 18%, transparent 34%, transparent 66%, rgba(0, 120, 72, 0.22) 82%, rgba(0, 120, 72, 0.78) 100%), linear-gradient(to bottom, rgba(88, 255, 181, 0.14) 0%, transparent 24%, transparent 76%, rgba(25, 166, 102, 0.18) 100%), radial-gradient(circle at center, #04100a 0%, #082516 32%, #0f4c30 56%, #157a4b 78%, #20ba6e 100%)",
    gridColor: "rgba(0, 0, 0, 0.24)",
    gridOpacity: "0.4",
    scanA: "rgba(0, 255, 170, 0.02)",
    scanB: "rgba(0, 0, 0, 0.08)",
    scanOpacity: "0.24",
    ambientOrbA: "rgba(42, 222, 138, 0.22)",
    ambientOrbB: "rgba(137, 255, 214, 0.16)",
    ambientSunCore: "rgba(239, 255, 245, 0.92)",
    ambientSunMid: "rgba(63, 222, 146, 0.64)",
    ambientSunEdge: "rgba(137, 255, 214, 0.24)",
    ambientGrid: "rgba(98, 255, 190, 0.16)",
    ambientBeamA: "rgba(62, 222, 140, 0.08)",
    ambientBeamB: "rgba(152, 255, 212, 0.06)",
  },
  sand: {
    frame: "linear-gradient(145deg, #8f6740 0%, #5f432a 22%, #c1935a 50%, #714d30 78%, #3a2515 100%)",
    light: "#ead8ab",
    dark: "#aa7547",
    border: "rgba(255, 198, 112, 0.3)",
    frameBorder: "rgba(255, 229, 170, 0.22)",
    boardGlow: "0 0 24px rgba(255, 177, 74, 0.14)",
    lightOverlay: "linear-gradient(180deg, rgba(255, 245, 205, 0.14), rgba(0, 0, 0, 0.05))",
    darkOverlay: "linear-gradient(180deg, rgba(255, 201, 122, 0.1), rgba(0, 0, 0, 0.1))",
    background:
      "linear-gradient(to right, rgba(214, 157, 84, 0.7) 0%, rgba(214, 157, 84, 0.22) 18%, transparent 36%, transparent 64%, rgba(214, 157, 84, 0.22) 82%, rgba(214, 157, 84, 0.7) 100%), linear-gradient(to bottom, rgba(255, 239, 196, 0.16) 0%, transparent 28%, transparent 72%, rgba(194, 144, 88, 0.18) 100%), radial-gradient(circle at center, #24170b 0%, #4e311a 30%, #8a5c35 58%, #c49258 82%, #efc786 100%)",
    gridColor: "rgba(52, 28, 6, 0.18)",
    gridOpacity: "0.34",
    scanA: "rgba(255, 245, 220, 0.03)",
    scanB: "rgba(90, 50, 18, 0.05)",
    scanOpacity: "0.2",
    ambientOrbA: "rgba(255, 196, 112, 0.2)",
    ambientOrbB: "rgba(255, 228, 168, 0.14)",
    ambientSunCore: "rgba(255, 247, 225, 0.9)",
    ambientSunMid: "rgba(244, 189, 110, 0.62)",
    ambientSunEdge: "rgba(194, 144, 88, 0.2)",
    ambientGrid: "rgba(255, 214, 140, 0.14)",
    ambientBeamA: "rgba(255, 206, 128, 0.08)",
    ambientBeamB: "rgba(214, 157, 84, 0.06)",
  },
  obsidian: {
    frame: "linear-gradient(145deg, #1c1f2a 0%, #0b0d12 22%, #2d3142 50%, #151821 78%, #020305 100%)",
    light: "#c4cad8",
    dark: "#494f64",
    border: "rgba(156, 174, 220, 0.28)",
    frameBorder: "rgba(115, 133, 186, 0.24)",
    boardGlow: "0 0 24px rgba(156, 174, 220, 0.14)",
    lightOverlay: "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.04))",
    darkOverlay: "linear-gradient(180deg, rgba(173, 187, 222, 0.08), rgba(0, 0, 0, 0.16))",
    background:
      "linear-gradient(to right, rgba(82, 93, 120, 0.54) 0%, rgba(82, 93, 120, 0.18) 18%, transparent 36%, transparent 64%, rgba(82, 93, 120, 0.18) 82%, rgba(82, 93, 120, 0.54) 100%), linear-gradient(to bottom, rgba(210, 218, 240, 0.08) 0%, transparent 26%, transparent 74%, rgba(55, 62, 82, 0.18) 100%), radial-gradient(circle at center, #06070a 0%, #11141b 30%, #202632 58%, #353d4f 82%, #5d677d 100%)",
    gridColor: "rgba(0, 0, 0, 0.26)",
    gridOpacity: "0.44",
    scanA: "rgba(255, 255, 255, 0.015)",
    scanB: "rgba(0, 0, 0, 0.08)",
    scanOpacity: "0.28",
    ambientOrbA: "rgba(120, 134, 172, 0.2)",
    ambientOrbB: "rgba(196, 202, 216, 0.12)",
    ambientSunCore: "rgba(239, 243, 255, 0.9)",
    ambientSunMid: "rgba(141, 153, 191, 0.56)",
    ambientSunEdge: "rgba(93, 103, 125, 0.18)",
    ambientGrid: "rgba(156, 174, 220, 0.14)",
    ambientBeamA: "rgba(173, 187, 222, 0.06)",
    ambientBeamB: "rgba(82, 93, 120, 0.06)",
  },
};
const CUSTOMIZATION = {
  backgroundTheme: "laser",
  boardTheme: "laser",
};

const boardElement = document.querySelector("#board");
const boardFrameElement = document.querySelector(".board-frame");
const turnBadgeElement = document.querySelector("#turnBadge");
const statusTextElement = document.querySelector("#statusText");
const selectionTextElement = document.querySelector("#selectionText");
const moveHistoryElement = document.querySelector("#moveHistory");
const moveCountElement = document.querySelector("#moveCount");
const capturedByWhiteElement = document.querySelector("#capturedByWhite");
const capturedByBlackElement = document.querySelector("#capturedByBlack");
const customizationButton = document.querySelector("#customizationButton");
const customizationPanel = document.querySelector("#customizationPanel");
const closeCustomizationButton = document.querySelector("#closeCustomizationButton");
const backgroundThemeList = document.querySelector("#backgroundThemeList");
const boardThemeList = document.querySelector("#boardThemeList");
const fullscreenButton = document.querySelector("#fullscreenButton");
const newGameButton = document.querySelector("#newGameButton");
const undoButton = document.querySelector("#undoButton");
const randomTeamsButton = document.querySelector("#randomTeamsButton");
const newGameMenu = document.querySelector("#newGameMenu");
const closeNewGameMenuButton = document.querySelector("#closeNewGameMenuButton");
const startSingleplayerButton = document.querySelector("#startSingleplayerButton");
const openMultiplayerButton = document.querySelector("#openMultiplayerButton");
const aiMenuPanel = document.querySelector("#aiMenuPanel");
const closeAiMenuButton = document.querySelector("#closeAiMenuButton");
const aiDifficultyList = document.querySelector("#aiDifficultyList");
const promotionDialog = document.querySelector("#promotionDialog");
const promotionTitle = document.querySelector("#promotionTitle");
const cancelPromotionButton = document.querySelector("#cancelPromotionButton");
const promotionButtons = Array.from(document.querySelectorAll("[data-piece]"));
const endgameDialog = document.querySelector("#endgameDialog");
const endgameBubble = document.querySelector(".endgame-bubble");
const endgameTitle = document.querySelector("#endgameTitle");

let state = createGameState();

function updateFullscreenButtonVisibility() {
  fullscreenButton.classList.toggle("is-hidden", Boolean(document.fullscreenElement));
}

async function enterFullscreen() {
  if (document.fullscreenElement) {
    return;
  }

  try {
    await document.documentElement.requestFullscreen();
  } catch (_error) {
    return;
  }

  updateFullscreenButtonVisibility();
}

function createPiece(color, type) {
  return {
    color,
    type,
    moved: false,
  };
}

function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRank = ["r", "n", "b", "q", "k", "b", "n", "r"];

  backRank.forEach((type, column) => {
    board[0][column] = createPiece("b", type);
    board[7][column] = createPiece("w", type);
  });

  for (let column = 0; column < 8; column += 1) {
    board[1][column] = createPiece("b", "p");
    board[6][column] = createPiece("w", "p");
  }

  return board;
}

function createGameState() {
  return {
    board: createInitialBoard(),
    turn: "w",
    orientation: "w",
    selected: null,
    legalMoves: [],
    history: [],
    snapshots: [],
    enPassant: null,
    capturedBy: {
      w: [],
      b: [],
    },
    lastMove: null,
    pendingPromotion: null,
    gameOver: false,
    winner: null,
    check: false,
    status: "Au tour des blancs.",
    gameMode: "local",
    aiProfile: null,
    aiColor: null,
    aiThinking: false,
    newGameMenuOpen: false,
    aiMenuOpen: false,
    customizationMenuOpen: false,
  };
}

function clonePiece(piece) {
  return piece ? { ...piece } : null;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => clonePiece(piece)));
}

function cloneEnPassant(square) {
  return square ? { ...square } : null;
}

function cloneHistory(history) {
  return history.map((entry) => ({ ...entry }));
}

function cloneCaptured(capturedBy) {
  return {
    w: capturedBy.w.map((piece) => ({ ...piece })),
    b: capturedBy.b.map((piece) => ({ ...piece })),
  };
}

function cloneLastMove(lastMove) {
  if (!lastMove) {
    return null;
  }

  return {
    from: { ...lastMove.from },
    to: { ...lastMove.to },
  };
}

function cloneAiProfile(aiProfile) {
  return aiProfile ? { ...aiProfile } : null;
}

function createSnapshot(currentState) {
  return {
    board: cloneBoard(currentState.board),
    turn: currentState.turn,
    history: cloneHistory(currentState.history),
    enPassant: cloneEnPassant(currentState.enPassant),
    capturedBy: cloneCaptured(currentState.capturedBy),
    lastMove: cloneLastMove(currentState.lastMove),
    gameOver: currentState.gameOver,
    winner: currentState.winner,
    check: currentState.check,
    status: currentState.status,
    gameMode: currentState.gameMode,
    aiProfile: cloneAiProfile(currentState.aiProfile),
    aiColor: currentState.aiColor,
  };
}

function oppositeSide(color) {
  return color === "w" ? "b" : "w";
}

function isWithinBoard(row, column) {
  return row >= 0 && row < 8 && column >= 0 && column < 8;
}

function squareName(row, column) {
  return `${FILES[column]}${8 - row}`;
}

function buildMove(piece, fromRow, fromColumn, toRow, toColumn, extra = {}) {
  return {
    from: { row: fromRow, column: fromColumn },
    to: { row: toRow, column: toColumn },
    pieceColor: piece.color,
    pieceType: piece.type,
    isPromotion:
      extra.isPromotion !== undefined
        ? extra.isPromotion
        : piece.type === "p" && (toRow === 0 || toRow === 7),
    isEnPassant: Boolean(extra.isEnPassant),
    castleSide: extra.castleSide || null,
  };
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = board[row][column];

      if (piece && piece.color === color && piece.type === "k") {
        return { row, column };
      }
    }
  }

  return null;
}

function generatePseudoMoves(board, row, column, gameState, attackOnly = false) {
  const piece = board[row][column];

  if (!piece) {
    return [];
  }

  const moves = [];

  function pushIfValid(targetRow, targetColumn) {
    if (!isWithinBoard(targetRow, targetColumn)) {
      return;
    }

    const targetPiece = board[targetRow][targetColumn];

    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push(buildMove(piece, row, column, targetRow, targetColumn));
    }
  }

  function pushSlidingMoves(directions) {
    directions.forEach(([rowDelta, columnDelta]) => {
      let targetRow = row + rowDelta;
      let targetColumn = column + columnDelta;

      while (isWithinBoard(targetRow, targetColumn)) {
        const targetPiece = board[targetRow][targetColumn];

        if (!targetPiece) {
          moves.push(buildMove(piece, row, column, targetRow, targetColumn));
        } else {
          if (targetPiece.color !== piece.color) {
            moves.push(buildMove(piece, row, column, targetRow, targetColumn));
          }

          break;
        }

        targetRow += rowDelta;
        targetColumn += columnDelta;
      }
    });
  }

  switch (piece.type) {
    case "p": {
      const forward = piece.color === "w" ? -1 : 1;
      const startRow = piece.color === "w" ? 6 : 1;

      if (attackOnly) {
        [-1, 1].forEach((columnOffset) => {
          const targetRow = row + forward;
          const targetColumn = column + columnOffset;

          if (isWithinBoard(targetRow, targetColumn)) {
            moves.push(buildMove(piece, row, column, targetRow, targetColumn));
          }
        });

        break;
      }

      const singleStepRow = row + forward;

      if (isWithinBoard(singleStepRow, column) && !board[singleStepRow][column]) {
        moves.push(buildMove(piece, row, column, singleStepRow, column));

        const doubleStepRow = row + forward * 2;

        if (
          row === startRow &&
          !piece.moved &&
          isWithinBoard(doubleStepRow, column) &&
          !board[doubleStepRow][column]
        ) {
          moves.push(buildMove(piece, row, column, doubleStepRow, column));
        }
      }

      [-1, 1].forEach((columnOffset) => {
        const targetRow = row + forward;
        const targetColumn = column + columnOffset;

        if (!isWithinBoard(targetRow, targetColumn)) {
          return;
        }

        const targetPiece = board[targetRow][targetColumn];

        if (targetPiece && targetPiece.color !== piece.color) {
          moves.push(buildMove(piece, row, column, targetRow, targetColumn));
          return;
        }

        if (
          gameState.enPassant &&
          gameState.enPassant.row === targetRow &&
          gameState.enPassant.column === targetColumn &&
          gameState.enPassant.pawnColor !== piece.color
        ) {
          moves.push(
            buildMove(piece, row, column, targetRow, targetColumn, {
              isEnPassant: true,
            }),
          );
        }
      });
      break;
    }

    case "n":
      [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ].forEach(([rowDelta, columnDelta]) => {
        pushIfValid(row + rowDelta, column + columnDelta);
      });
      break;

    case "b":
      pushSlidingMoves([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]);
      break;

    case "r":
      pushSlidingMoves([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
      break;

    case "q":
      pushSlidingMoves([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
      break;

    case "k":
      [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ].forEach(([rowDelta, columnDelta]) => {
        pushIfValid(row + rowDelta, column + columnDelta);
      });

      if (attackOnly || piece.moved || isKingInCheck(board, piece.color)) {
        break;
      }

      const enemyColor = oppositeSide(piece.color);

      const kingSideRook = board[row][7];
      if (
        kingSideRook &&
        kingSideRook.type === "r" &&
        kingSideRook.color === piece.color &&
        !kingSideRook.moved &&
        !board[row][5] &&
        !board[row][6] &&
        !isSquareAttacked(board, row, 5, enemyColor) &&
        !isSquareAttacked(board, row, 6, enemyColor)
      ) {
        moves.push(
          buildMove(piece, row, column, row, 6, {
            castleSide: "king",
          }),
        );
      }

      const queenSideRook = board[row][0];
      if (
        queenSideRook &&
        queenSideRook.type === "r" &&
        queenSideRook.color === piece.color &&
        !queenSideRook.moved &&
        !board[row][1] &&
        !board[row][2] &&
        !board[row][3] &&
        !isSquareAttacked(board, row, 3, enemyColor) &&
        !isSquareAttacked(board, row, 2, enemyColor)
      ) {
        moves.push(
          buildMove(piece, row, column, row, 2, {
            castleSide: "queen",
          }),
        );
      }
      break;

    default:
      break;
  }

  return moves;
}

function isSquareAttacked(board, targetRow, targetColumn, byColor) {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = board[row][column];

      if (!piece || piece.color !== byColor) {
        continue;
      }

      const moves = generatePseudoMoves(
        board,
        row,
        column,
        { enPassant: null },
        true,
      );

      if (
        moves.some(
          (move) =>
            move.to.row === targetRow && move.to.column === targetColumn,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function isKingInCheck(board, color) {
  const king = findKing(board, color);

  if (!king) {
    return true;
  }

  return isSquareAttacked(board, king.row, king.column, oppositeSide(color));
}

function executeMove(board, move, promotionChoice = "q") {
  const movingPiece = board[move.from.row][move.from.column];
  const updatedPiece = { ...movingPiece, moved: true };
  let capturedPiece = board[move.to.row][move.to.column];

  board[move.from.row][move.from.column] = null;

  if (move.isEnPassant) {
    const captureRow = movingPiece.color === "w" ? move.to.row + 1 : move.to.row - 1;
    capturedPiece = board[captureRow][move.to.column];
    board[captureRow][move.to.column] = null;
  }

  if (move.isPromotion) {
    updatedPiece.type = promotionChoice;
  }

  board[move.to.row][move.to.column] = updatedPiece;

  if (move.castleSide) {
    const rookFromColumn = move.castleSide === "king" ? 7 : 0;
    const rookToColumn = move.castleSide === "king" ? 5 : 3;
    const rook = board[move.to.row][rookFromColumn];

    board[move.to.row][rookFromColumn] = null;
    board[move.to.row][rookToColumn] = {
      ...rook,
      moved: true,
    };
  }

  let nextEnPassant = null;

  if (movingPiece.type === "p" && Math.abs(move.to.row - move.from.row) === 2) {
    nextEnPassant = {
      row: (move.from.row + move.to.row) / 2,
      column: move.from.column,
      pawnColor: movingPiece.color,
    };
  }

  return {
    board,
    capturedPiece,
    enPassant: nextEnPassant,
  };
}

function simulateMove(gameState, move) {
  const board = cloneBoard(gameState.board);
  const result = executeMove(board, move);

  return {
    board,
    enPassant: result.enPassant,
  };
}

function getLegalMovesForPiece(gameState, row, column) {
  const piece = gameState.board[row][column];

  if (!piece) {
    return [];
  }

  const pseudoMoves = generatePseudoMoves(gameState.board, row, column, gameState);

  return pseudoMoves.filter((move) => {
    const simulation = simulateMove(gameState, move);
    return !isKingInCheck(simulation.board, piece.color);
  });
}

function getAllLegalMoves(gameState, color) {
  const moves = [];

  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = gameState.board[row][column];

      if (piece && piece.color === color) {
        moves.push(...getLegalMovesForPiece(gameState, row, column));
      }
    }
  }

  return moves;
}

function evaluatePosition(currentState) {
  const activeColor = currentState.turn;
  const check = isKingInCheck(currentState.board, activeColor);
  const legalMoves = getAllLegalMoves(currentState, activeColor);

  if (legalMoves.length === 0) {
    if (check) {
      return {
        check: true,
        gameOver: true,
        winner: oppositeSide(activeColor),
        status: `Echec et mat. Les ${SIDE_NAMES[oppositeSide(activeColor)]} gagnent.`,
        notationSuffix: "#",
      };
    }

    return {
      check: false,
      gameOver: true,
      winner: null,
      status: "Pat. La partie est nulle.",
      notationSuffix: "",
    };
  }

  return {
    check,
    gameOver: false,
    winner: null,
    status: check
      ? `Echec sur les ${SIDE_NAMES[activeColor]}.`
      : `Au tour des ${SIDE_NAMES[activeColor]}.`,
    notationSuffix: check ? "+" : "",
  };
}

function clearSelection() {
  state.selected = null;
  state.legalMoves = [];
}

function openCustomizationMenu() {
  state.customizationMenuOpen = true;
  state.newGameMenuOpen = false;
  state.aiMenuOpen = false;
  clearSelection();
  render();
}

function closeCustomizationMenu() {
  state.customizationMenuOpen = false;
  render();
}

function openNewGameMenu() {
  if (state.pendingPromotion || state.aiThinking) {
    return;
  }

  state.newGameMenuOpen = true;
  state.aiMenuOpen = false;
  state.customizationMenuOpen = false;
  clearSelection();
  render();
}

function closeNewGameMenus() {
  state.newGameMenuOpen = false;
  state.aiMenuOpen = false;
  render();
}

function openAiMenu() {
  state.newGameMenuOpen = false;
  state.aiMenuOpen = true;
  render();
}

function getBackgroundThemePreset() {
  return THEME_PRESETS[CUSTOMIZATION.backgroundTheme] || THEME_PRESETS.laser;
}

function getBoardThemePreset() {
  return THEME_PRESETS[CUSTOMIZATION.boardTheme] || THEME_PRESETS.laser;
}

function applyTheme() {
  const boardPreset = getBoardThemePreset();
  const backgroundPreset = getBackgroundThemePreset();

  boardFrameElement.style.setProperty("--theme-board-frame", boardPreset.frame);
  boardFrameElement.style.setProperty("--theme-board-frame-border", boardPreset.frameBorder);
  boardElement.style.setProperty("--theme-board-light", boardPreset.light);
  boardElement.style.setProperty("--theme-board-dark", boardPreset.dark);
  boardElement.style.setProperty("--theme-board-border", boardPreset.border);
  boardElement.style.setProperty("--theme-board-glow", boardPreset.boardGlow);
  boardElement.style.setProperty("--theme-board-light-overlay", boardPreset.lightOverlay);
  boardElement.style.setProperty("--theme-board-dark-overlay", boardPreset.darkOverlay);
  document.body.style.setProperty("--theme-app-background", backgroundPreset.background);
  document.body.style.setProperty("--theme-grid-color", backgroundPreset.gridColor);
  document.body.style.setProperty("--theme-grid-opacity", backgroundPreset.gridOpacity);
  document.body.style.setProperty("--theme-scan-a", backgroundPreset.scanA);
  document.body.style.setProperty("--theme-scan-b", backgroundPreset.scanB);
  document.body.style.setProperty("--theme-scan-opacity", backgroundPreset.scanOpacity);
  document.body.style.setProperty("--theme-ambient-orb-a", backgroundPreset.ambientOrbA || "rgba(255, 60, 166, 0.22)");
  document.body.style.setProperty("--theme-ambient-orb-b", backgroundPreset.ambientOrbB || "rgba(122, 231, 255, 0.18)");
  document.body.style.setProperty("--theme-ambient-sun-core", backgroundPreset.ambientSunCore || "rgba(255, 240, 240, 0.92)");
  document.body.style.setProperty("--theme-ambient-sun-mid", backgroundPreset.ambientSunMid || "rgba(255, 60, 166, 0.72)");
  document.body.style.setProperty("--theme-ambient-sun-edge", backgroundPreset.ambientSunEdge || "rgba(122, 231, 255, 0.32)");
  document.body.style.setProperty("--theme-ambient-grid", backgroundPreset.ambientGrid || "rgba(122, 231, 255, 0.18)");
  document.body.style.setProperty("--theme-ambient-beam-a", backgroundPreset.ambientBeamA || "rgba(122, 231, 255, 0.08)");
  document.body.style.setProperty("--theme-ambient-beam-b", backgroundPreset.ambientBeamB || "rgba(255, 60, 166, 0.08)");
}

function setBackgroundTheme(themeId) {
  CUSTOMIZATION.backgroundTheme = themeId;
  applyTheme();
  renderCustomizationPanel();
}

function setBoardTheme(themeId) {
  CUSTOMIZATION.boardTheme = themeId;
  applyTheme();
  renderCustomizationPanel();
}

function getPiecePalette(piece, style) {
  const isWhite = piece.color === "w";

  switch (style) {
    case "neon":
      return isWhite
        ? { fill: "#d9fcff", accent: "#7cf7ff", stroke: "#00f2ff" }
        : { fill: "#2e1348", accent: "#ff4cd6", stroke: "#ff84ee" };
    case "royal":
      return isWhite
        ? { fill: "#fff4d9", accent: "#e3bc63", stroke: "#8f6f2b" }
        : { fill: "#3a234d", accent: "#9b6bd9", stroke: "#f0d2ff" };
    case "steel":
      return isWhite
        ? { fill: "#eef3fa", accent: "#b8c6dd", stroke: "#586579" }
        : { fill: "#273344", accent: "#4f647c", stroke: "#d5dfec" };
    case "mono":
      return isWhite
        ? { fill: "#ffffff", accent: "#d0d0d0", stroke: "#222222" }
        : { fill: "#101010", accent: "#353535", stroke: "#f2f2f2" };
    case "vector":
    default:
      return isWhite
        ? { fill: "#f8f2e2", accent: "#dacaa7", stroke: "#5d4c35" }
        : { fill: "#24180f", accent: "#5e4633", stroke: "#f7ebcf" };
  }
}

function createFreshState(options = {}) {
  const nextState = createGameState();
  nextState.orientation = options.orientation || state.orientation;
  nextState.gameMode = options.gameMode || "local";
  nextState.aiProfile = cloneAiProfile(options.aiProfile);
  nextState.aiColor = options.aiColor || null;
  nextState.status =
    nextState.gameMode === "ai" && nextState.aiProfile
      ? `Au tour des blancs. IA ${nextState.aiProfile.level} - ${nextState.aiProfile.elo} ELO.`
      : "Au tour des blancs.";
  return nextState;
}

function startSingleplayerGame() {
  state = createFreshState({
    gameMode: "local",
  });
  render();
}

function startAiGame(aiProfile) {
  state = createFreshState({
    gameMode: "ai",
    aiProfile,
    aiColor: "b",
    orientation: "w",
  });
  render();
}

function randomizeTeams() {
  if (state.pendingPromotion || state.aiThinking) {
    return;
  }

  state.orientation = Math.random() < 0.5 ? "w" : "b";
  clearSelection();
  render();
}

function getCapturedPieceForMove(gameState, move) {
  if (move.isEnPassant) {
    const captureRow = move.pieceColor === "w" ? move.to.row + 1 : move.to.row - 1;
    return gameState.board[captureRow][move.to.column];
  }

  return gameState.board[move.to.row][move.to.column];
}

function createDerivedState(gameState, move, promotionChoice = "q") {
  const board = cloneBoard(gameState.board);
  const { enPassant } = executeMove(board, move, promotionChoice);

  return {
    board,
    turn: oppositeSide(move.pieceColor),
    enPassant,
  };
}

function getPieceSquareBonus(piece, row, column) {
  const centerControl =
    (3.5 - Math.abs(3.5 - row)) + (3.5 - Math.abs(3.5 - column));
  const progress = piece.color === "w" ? 7 - row : row;

  switch (piece.type) {
    case "p":
      return progress * 6 + centerControl * 3;
    case "n":
      return centerControl * 10;
    case "b":
      return centerControl * 8;
    case "r":
      return progress * 2 + centerControl * 2;
    case "q":
      return centerControl * 5;
    case "k":
      return piece.moved ? -centerControl * 4 + 18 : -centerControl * 8;
    default:
      return 0;
  }
}

function evaluateStaticBoard(gameState, rootColor) {
  let score = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = gameState.board[row][column];

      if (!piece) {
        continue;
      }

      const sign = piece.color === rootColor ? 1 : -1;
      score += sign * (PIECE_VALUES[piece.type] + getPieceSquareBonus(piece, row, column));
    }
  }

  return score;
}

function scoreMoveHeuristic(gameState, move) {
  let score = 0;
  const capturedPiece = getCapturedPieceForMove(gameState, move);

  if (capturedPiece) {
    score += PIECE_VALUES[capturedPiece.type] * 12 - PIECE_VALUES[move.pieceType];
  }

  if (move.isPromotion) {
    score += 800;
  }

  if (move.castleSide) {
    score += 80;
  }

  const targetBonus =
    (3.5 - Math.abs(3.5 - move.to.row)) + (3.5 - Math.abs(3.5 - move.to.column));
  score += targetBonus * 6;

  const nextState = createDerivedState(gameState, move, move.isPromotion ? "q" : "q");
  if (isKingInCheck(nextState.board, nextState.turn)) {
    score += 70;
  }

  return score;
}

function evaluateTerminalState(gameState, legalMoves, rootColor, depth) {
  if (legalMoves.length > 0) {
    return null;
  }

  if (isKingInCheck(gameState.board, gameState.turn)) {
    return gameState.turn === rootColor ? -100000 - depth : 100000 + depth;
  }

  return 0;
}

function negamax(gameState, depth, alpha, beta, rootColor, profile) {
  const legalMoves = getAllLegalMoves(gameState, gameState.turn);
  const terminalScore = evaluateTerminalState(gameState, legalMoves, rootColor, depth);

  if (terminalScore !== null) {
    return terminalScore;
  }

  if (depth === 0) {
    return evaluateStaticBoard(gameState, rootColor);
  }

  const orderedMoves = legalMoves
    .slice()
    .sort((left, right) => scoreMoveHeuristic(gameState, right) - scoreMoveHeuristic(gameState, left))
    .slice(0, profile.branchLimit || legalMoves.length);
  let bestScore = -Infinity;

  for (const move of orderedMoves) {
    const promotionChoice = move.isPromotion ? "q" : "q";
    const nextState = createDerivedState(gameState, move, promotionChoice);
    const score = -negamax(nextState, depth - 1, -beta, -alpha, rootColor, profile);

    if (score > bestScore) {
      bestScore = score;
    }

    if (score > alpha) {
      alpha = score;
    }

    if (alpha >= beta) {
      break;
    }
  }

  return bestScore;
}

function chooseAiMove(gameState, profile) {
  const legalMoves = getAllLegalMoves(gameState, gameState.turn);

  if (legalMoves.length === 0) {
    return null;
  }

  const rootColor = gameState.turn;
  const scoredMoves = legalMoves
    .map((move) => {
      const promotionChoice = move.isPromotion ? "q" : "q";
      const nextState = createDerivedState(gameState, move, promotionChoice);
      let score;

      if (profile.depth === 0) {
        score =
          evaluateStaticBoard(nextState, rootColor) * 0.15 +
          scoreMoveHeuristic(gameState, move);
      } else {
        score = -negamax(
          nextState,
          profile.depth - 1,
          -Infinity,
          Infinity,
          rootColor,
          profile,
        );
      }

      score += scoreMoveHeuristic(gameState, move) * 0.05;
      score += (Math.random() - 0.5) * profile.randomness;

      return {
        move,
        promotionChoice,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const poolSize = Math.min(profile.pickCount || 1, scoredMoves.length);
  const choicePool = scoredMoves.slice(0, poolSize);

  return choicePool[Math.floor(Math.random() * choicePool.length)];
}

function maybeTriggerAiMove() {
  if (
    state.gameMode !== "ai" ||
    !state.aiProfile ||
    state.turn !== state.aiColor ||
    state.gameOver ||
    state.pendingPromotion ||
    state.aiThinking ||
    state.newGameMenuOpen ||
    state.aiMenuOpen
  ) {
    return;
  }

  state.aiThinking = true;
  render();

  window.setTimeout(() => {
    if (
      state.gameMode !== "ai" ||
      !state.aiProfile ||
      state.turn !== state.aiColor ||
      state.gameOver
    ) {
      state.aiThinking = false;
      render();
      return;
    }

    const aiChoice = chooseAiMove(state, state.aiProfile);
    state.aiThinking = false;

    if (!aiChoice) {
      render();
      return;
    }

    commitMove(aiChoice.move, aiChoice.promotionChoice);
  }, state.aiProfile.delay);
}

function formatMove(move, movingPiece, capturedPiece, promotionChoice, evaluation) {
  if (move.castleSide === "king") {
    return `O-O${evaluation.notationSuffix}`;
  }

  if (move.castleSide === "queen") {
    return `O-O-O${evaluation.notationSuffix}`;
  }

  const from = squareName(move.from.row, move.from.column);
  const to = squareName(move.to.row, move.to.column);
  const isCapture = Boolean(capturedPiece) || move.isEnPassant;
  let notation = "";

  if (movingPiece.type === "p") {
    notation = isCapture ? `${FILES[move.from.column]}x${to}` : `${from}-${to}`;
  } else {
    notation = `${PIECE_LABELS[movingPiece.type]}${from}${isCapture ? "x" : "-"}${to}`;
  }

  if (move.isPromotion) {
    notation += `=${PIECE_LABELS[promotionChoice]}`;
  }

  if (move.isEnPassant) {
    notation += " e.p.";
  }

  notation += evaluation.notationSuffix;
  return notation;
}

function commitMove(move, promotionChoice = "q") {
  const movingPiece = state.board[move.from.row][move.from.column];

  if (!movingPiece) {
    return;
  }

  state.snapshots.push(createSnapshot(state));

  const board = cloneBoard(state.board);
  const { capturedPiece, enPassant } = executeMove(board, move, promotionChoice);

  const moverColor = movingPiece.color;

  state.board = board;
  state.turn = oppositeSide(moverColor);
  state.enPassant = enPassant;
  state.lastMove = {
    from: { ...move.from },
    to: { ...move.to },
  };
  state.pendingPromotion = null;
  clearSelection();

  if (capturedPiece) {
    state.capturedBy[moverColor].push({
      type: capturedPiece.type,
      color: capturedPiece.color,
    });
  }

  const evaluation = evaluatePosition(state);
  state.check = evaluation.check;
  state.gameOver = evaluation.gameOver;
  state.winner = evaluation.winner;
  state.status = evaluation.status;

  state.history.push({
    turn: moverColor,
    notation: formatMove(
      move,
      movingPiece,
      capturedPiece,
      promotionChoice,
      evaluation,
    ),
  });

  render();
}

function resetGame() {
  startSingleplayerGame();
}

function undoMove() {
  if (state.snapshots.length === 0 || state.aiThinking) {
    return;
  }

  let steps = 1;

  if (state.gameMode === "ai" && state.aiProfile) {
    steps = state.turn === state.aiColor ? 1 : 2;
  }

  while (steps > 0 && state.snapshots.length > 0) {
    const previousState = state.snapshots[state.snapshots.length - 1];
    const remainingSnapshots = state.snapshots.slice(0, -1);
    const orientation = state.orientation;

    state = {
      ...previousState,
      orientation,
      selected: null,
      legalMoves: [],
      pendingPromotion: null,
      newGameMenuOpen: false,
      aiMenuOpen: false,
      aiThinking: false,
      snapshots: remainingSnapshots,
    };

    steps -= 1;
  }

  render();
}

function handleSquareClick(row, column) {
  if (
    state.gameOver ||
    state.pendingPromotion ||
    state.aiThinking ||
    state.newGameMenuOpen ||
    state.aiMenuOpen ||
    (state.gameMode === "ai" && state.turn === state.aiColor)
  ) {
    return;
  }

  const selectedMove = state.legalMoves.find(
    (move) => move.to.row === row && move.to.column === column,
  );

  if (selectedMove) {
    if (selectedMove.isPromotion) {
      state.pendingPromotion = selectedMove;
      render();
      return;
    }

    commitMove(selectedMove);
    return;
  }

  const piece = state.board[row][column];

  if (
    state.selected &&
    state.selected.row === row &&
    state.selected.column === column
  ) {
    clearSelection();
    render();
    return;
  }

  if (piece && piece.color === state.turn) {
    state.selected = { row, column };
    state.legalMoves = getLegalMovesForPiece(state, row, column);
    render();
    return;
  }

  clearSelection();
  render();
}

function createPieceSvg(piece, style = "vector") {
  const svg = document.createElementNS(SVG_NS, "svg");
  const { fill, accent, stroke } = getPiecePalette(piece, style);

  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("piece-svg");

  const markupByType = {
    p: `
      <circle cx="50" cy="28" r="11" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <path d="M36 74c1-15 7-25 14-31c7 6 13 16 14 31" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <rect x="31" y="74" width="38" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <rect x="24" y="82" width="52" height="8" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />
    `,
    r: `
      <rect x="27" y="18" width="12" height="12" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <rect x="44" y="18" width="12" height="12" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <rect x="61" y="18" width="12" height="12" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <rect x="28" y="30" width="44" height="14" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <path d="M34 44h32l-4 27H38z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <rect x="29" y="71" width="42" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <rect x="22" y="80" width="56" height="8" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />
    `,
    n: `
      <path d="M35 80c1-20 5-39 16-52c5-6 13-8 19-5c3 2 5 6 4 10c-2 6-9 8-12 12c7 2 12 7 14 15l-14 4l-6-8l2 16z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
      <circle cx="61" cy="30" r="2.8" fill="${stroke}" />
      <path d="M33 80h39" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />
      <rect x="24" y="82" width="52" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
    `,
    b: `
      <circle cx="50" cy="20" r="7" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <path d="M43 29l14 18" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />
      <path d="M37 72c0-15 6-26 13-37c7 11 13 22 13 37" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <rect x="33" y="72" width="34" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <rect x="24" y="82" width="52" height="8" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />
    `,
    q: `
      <circle cx="24" cy="24" r="6" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <circle cx="40" cy="18" r="6" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <circle cx="60" cy="18" r="6" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <circle cx="76" cy="24" r="6" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <path d="M24 30l10 30h32l10-30l-15 10l-11-14l-11 14z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <rect x="30" y="60" width="40" height="10" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <rect x="24" y="80" width="52" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
    `,
    k: `
      <path d="M50 12v20" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />
      <path d="M42 20h16" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />
      <path d="M37 34h26l-4 11H41z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <path d="M39 45c0-6 5-11 11-11s11 5 11 11v19H39z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
      <rect x="33" y="64" width="34" height="8" rx="4" fill="${accent}" stroke="${stroke}" stroke-width="4" />
      <rect x="24" y="82" width="52" height="8" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />
    `,
  };

  svg.innerHTML = markupByType[piece.type];
  return svg;
}

function createPieceElement(piece, size = "board") {
  const pieceElement = document.createElement("span");
  const pieceStyle = "classic";

  pieceElement.className = `piece ${piece.color === "w" ? "white" : "black"} piece-${size} piece-style-${pieceStyle}`;
  pieceElement.setAttribute(
    "aria-label",
    `${piece.color === "w" ? "Piece blanche" : "Piece noire"}: ${PIECE_NAMES[piece.type]}`,
  );

  const pieceImage = document.createElement("img");
  pieceImage.className = "piece-image";
  pieceImage.alt = "";
  pieceImage.decoding = "async";
  pieceImage.loading = "eager";
  pieceImage.src = PIECE_IMAGE_URLS[piece.color][piece.type];

  pieceImage.addEventListener(
    "error",
    () => {
      if (!pieceElement.querySelector(".piece-svg")) {
        pieceElement.append(createPieceSvg(piece, pieceStyle));
      }

      pieceImage.remove();
    },
    { once: true },
  );

  pieceElement.append(pieceImage);
  return pieceElement;
}

function renderBoard() {
  boardElement.innerHTML = "";

  const rowOrder =
    state.orientation === "w"
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];
  const columnOrder =
    state.orientation === "w"
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];
  const checkedKing = state.check ? findKing(state.board, state.turn) : null;

  rowOrder.forEach((row, visualRow) => {
    columnOrder.forEach((column, visualColumn) => {
      const squareButton = document.createElement("button");
      const piece = state.board[row][column];
      const isSelected =
        state.selected &&
        state.selected.row === row &&
        state.selected.column === column;
      const legalMove = state.legalMoves.find(
        (move) => move.to.row === row && move.to.column === column,
      );
      const isLastMove =
        state.lastMove &&
        ((state.lastMove.from.row === row &&
          state.lastMove.from.column === column) ||
          (state.lastMove.to.row === row && state.lastMove.to.column === column));
      const isLastMoveTarget =
        state.lastMove &&
        state.lastMove.to.row === row &&
        state.lastMove.to.column === column;
      const isCheckedKing =
        checkedKing &&
        checkedKing.row === row &&
        checkedKing.column === column;

      squareButton.type = "button";
      squareButton.className = `square ${(row + column) % 2 === 0 ? "light" : "dark"}`;
      squareButton.dataset.row = String(row);
      squareButton.dataset.column = String(column);
      squareButton.setAttribute(
        "aria-label",
        piece
          ? `${squareName(row, column)}: ${PIECE_NAMES[piece.type]} ${
              piece.color === "w" ? "blanc" : "noir"
            }`
          : `${squareName(row, column)} vide`,
      );

      if (isSelected) {
        squareButton.classList.add("is-selected");
      }

      if (legalMove) {
        squareButton.classList.add(
          piece || legalMove.isEnPassant ? "is-capture" : "is-legal",
        );
      }

      if (isLastMove) {
        squareButton.classList.add("last-move");
      }

      if (isLastMoveTarget) {
        squareButton.classList.add("last-move-target");
      }

      if (isCheckedKing) {
        squareButton.classList.add("king-in-check");
      }

      if (visualColumn === 0) {
        const rankLabel = document.createElement("span");
        rankLabel.className = "square-rank";
        rankLabel.textContent = String(8 - row);
        squareButton.append(rankLabel);
      }

      if (visualRow === 7) {
        const fileLabel = document.createElement("span");
        fileLabel.className = "square-file";
        fileLabel.textContent = FILES[column];
        squareButton.append(fileLabel);
      }

      if (piece) {
        squareButton.append(createPieceElement(piece));
      }

      boardElement.append(squareButton);
    });
  });
}

function renderHistory() {
  moveHistoryElement.innerHTML = "";

  if (state.history.length === 0) {
    const placeholder = document.createElement("p");
    placeholder.className = "history-empty";
    placeholder.textContent = "Les coups apparaitront ici au fil de la partie.";
    moveHistoryElement.append(placeholder);
    moveCountElement.textContent = "0 coup";
    return;
  }

  for (let index = 0; index < state.history.length; index += 2) {
    const row = document.createElement("div");
    const whiteMove = state.history[index];
    const blackMove = state.history[index + 1];

    row.className = "history-row";

    const moveNumber = document.createElement("span");
    moveNumber.className = "move-number";
    moveNumber.textContent = `${Math.floor(index / 2) + 1}.`;

    const whiteMoveElement = document.createElement("span");
    whiteMoveElement.className = "move-entry";
    whiteMoveElement.textContent = whiteMove ? whiteMove.notation : "";

    const blackMoveElement = document.createElement("span");
    blackMoveElement.className = "move-entry";
    blackMoveElement.textContent = blackMove ? blackMove.notation : "";

    row.append(moveNumber, whiteMoveElement, blackMoveElement);
    moveHistoryElement.append(row);
  }

  moveCountElement.textContent = `${state.history.length} coup${
    state.history.length > 1 ? "s" : ""
  }`;
}

function renderCapturedGroup(element, pieces) {
  element.innerHTML = "";

  if (pieces.length === 0) {
    const empty = document.createElement("span");
    empty.className = "capture-empty";
    empty.textContent = "Aucune";
    element.append(empty);
    return;
  }

  pieces
    .slice()
    .sort((left, right) => CAPTURE_SORT_ORDER[left.type] - CAPTURE_SORT_ORDER[right.type])
    .forEach((piece) => {
      const pill = document.createElement("span");
      pill.className = `capture-pill ${piece.color === "w" ? "white" : "black"}`;
      pill.title = PIECE_NAMES[piece.type];
      pill.append(createPieceElement(piece, "mini"));
      element.append(pill);
    });
}

function renderStatus() {
  if (state.gameOver) {
    turnBadgeElement.textContent = state.winner
      ? `Victoire ${SIDE_NAMES[state.winner]}`
      : "Partie nulle";
  } else if (state.aiThinking && state.aiProfile) {
    turnBadgeElement.textContent = `IA ${state.aiProfile.level} en cours`;
  } else {
    turnBadgeElement.textContent = `Trait: ${SIDE_NAMES[state.turn]}`;
  }

  statusTextElement.textContent = state.status;

  if (state.pendingPromotion) {
    selectionTextElement.textContent =
      "Choisis la piece de promotion pour terminer le coup.";
  } else if (state.aiThinking && state.aiProfile) {
    selectionTextElement.textContent = `IA ${state.aiProfile.level} - ${state.aiProfile.elo} ELO reflechit a son prochain coup.`;
  } else if (state.selected) {
    const piece = state.board[state.selected.row][state.selected.column];
    const moveCount = state.legalMoves.length;
    selectionTextElement.textContent = piece
      ? `${PIECE_NAMES[piece.type]} selectionne sur ${squareName(
          state.selected.row,
          state.selected.column,
        )}. ${moveCount} coup${moveCount > 1 ? "s" : ""} disponible${
          moveCount > 1 ? "s" : ""
        }.`
      : "";
  } else if (!state.gameOver && state.gameMode === "ai" && state.aiProfile) {
    selectionTextElement.textContent = `Mode IA actif: niveau ${state.aiProfile.level}, ${state.aiProfile.elo} ELO. Tu joues les blancs.`;
  } else {
    selectionTextElement.textContent = state.gameOver
      ? "Relance une nouvelle partie ou annule un coup."
      : "Clique sur une piece pour afficher ses coups legaux.";
  }

  undoButton.disabled =
    state.snapshots.length === 0 ||
    Boolean(state.pendingPromotion) ||
    state.aiThinking;
  randomTeamsButton.disabled = Boolean(state.pendingPromotion) || state.aiThinking;
  newGameButton.disabled = Boolean(state.pendingPromotion) || state.aiThinking;
}

function renderPromotionDialog() {
  if (!state.pendingPromotion) {
    promotionDialog.hidden = true;
    return;
  }

  promotionDialog.hidden = false;
  promotionTitle.textContent = `Choisis la promotion des ${SIDE_NAMES[state.pendingPromotion.pieceColor]}`;

  promotionButtons.forEach((button) => {
    const pieceType = button.dataset.piece;
    const token = button.querySelector(".promotion-token");
    const label = button.querySelector(".promotion-label");

    token.innerHTML = "";
    token.append(
      createPieceElement(
        { color: state.pendingPromotion.pieceColor, type: pieceType, moved: true },
        "token",
      ),
    );
    label.textContent = PROMOTION_NAMES[pieceType];
  });
}

function renderEndgameDialog() {
  if (!state.gameOver) {
    endgameDialog.hidden = true;
    return;
  }

  endgameDialog.hidden = false;
  endgameBubble.classList.remove("is-victory", "is-defeat", "is-draw");

  if (state.gameMode === "ai" && state.aiColor) {
    const playerColor = oppositeSide(state.aiColor);

    if (state.winner === playerColor) {
      endgameBubble.classList.add("is-victory");
      endgameTitle.textContent = "Tu as gagne";
      return;
    }

    if (state.winner === state.aiColor) {
      endgameBubble.classList.add("is-defeat");
      endgameTitle.textContent = "Tu as perdu";
      return;
    }
  }

  if (state.winner === "w") {
    endgameBubble.classList.add("is-victory");
    endgameTitle.textContent = "Les blancs gagnent";
    return;
  }

  if (state.winner === "b") {
    endgameBubble.classList.add("is-victory");
    endgameTitle.textContent = "Les noirs gagnent";
    return;
  }

  endgameBubble.classList.add("is-draw");
  endgameTitle.textContent = "Egalite";
}

function renderCustomizationPanel() {
  customizationPanel.hidden = !state.customizationMenuOpen;
  backgroundThemeList.innerHTML = "";
  boardThemeList.innerHTML = "";

  if (!state.customizationMenuOpen) {
    return;
  }

  THEME_OPTIONS.forEach((theme) => {
    const button = document.createElement("button");
    const preview = document.createElement("span");
    const label = document.createElement("span");
    const preset = THEME_PRESETS[theme.id];

    button.type = "button";
    button.className = "custom-option-card background-option-card";
    button.dataset.backgroundTheme = theme.id;
    button.setAttribute("aria-pressed", String(CUSTOMIZATION.backgroundTheme === theme.id));

    if (CUSTOMIZATION.backgroundTheme === theme.id) {
      button.classList.add("is-active");
    }

    preview.className = "background-theme-preview";

    preview.style.setProperty("--preview-background", preset.background);
    preview.style.setProperty("--preview-grid-color", preset.gridColor);
    preview.style.setProperty("--preview-grid-opacity", preset.gridOpacity);
    preview.style.setProperty("--preview-scan-a", preset.scanA);
    preview.style.setProperty("--preview-scan-b", preset.scanB);
    preview.style.setProperty("--preview-scan-opacity", preset.scanOpacity);

    label.className = "custom-option-label";
    label.textContent = theme.label;

    button.append(preview, label);
    backgroundThemeList.append(button);
  });

  THEME_OPTIONS.forEach((theme) => {
    const button = document.createElement("button");
    const preview = document.createElement("span");
    const label = document.createElement("span");
    const preset = THEME_PRESETS[theme.id];

    button.type = "button";
    button.className = "custom-option-card board-option-card";
    button.dataset.boardTheme = theme.id;
    button.setAttribute("aria-pressed", String(CUSTOMIZATION.boardTheme === theme.id));

    if (CUSTOMIZATION.boardTheme === theme.id) {
      button.classList.add("is-active");
    }

    preview.className = "board-theme-preview";
    preview.style.setProperty("--preview-frame", preset.frame);
    preview.style.setProperty("--preview-light", preset.light);
    preview.style.setProperty("--preview-dark", preset.dark);

    label.className = "custom-option-label";
    label.textContent = theme.label;

    button.append(preview, label);
    boardThemeList.append(button);
  });
}

function populateAiDifficultyList() {
  aiDifficultyList.innerHTML = "";

  AI_LEVELS.forEach((profile) => {
    const button = document.createElement("button");
    const title = document.createElement("span");
    const subtitle = document.createElement("span");

    button.type = "button";
    button.className = "ai-level-card";
    button.dataset.aiLevel = String(profile.level);

    title.className = "ai-level-title";
    title.textContent = `IA ${profile.level}`;

    subtitle.className = "ai-level-copy";
    subtitle.textContent = `${profile.elo} ELO`;

    button.append(title, subtitle);
    aiDifficultyList.append(button);
  });
}

function renderNewGameMenus() {
  newGameMenu.hidden = !state.newGameMenuOpen;
  aiMenuPanel.hidden = !state.aiMenuOpen;
}

function render() {
  applyTheme();
  renderBoard();
  renderStatus();
  renderCapturedGroup(capturedByWhiteElement, state.capturedBy.w);
  renderCapturedGroup(capturedByBlackElement, state.capturedBy.b);
  renderHistory();
  renderCustomizationPanel();
  renderNewGameMenus();
  renderPromotionDialog();
  renderEndgameDialog();
  maybeTriggerAiMove();
}

boardElement.addEventListener("click", (event) => {
  const square = event.target.closest(".square");

  if (!square) {
    return;
  }

  handleSquareClick(Number(square.dataset.row), Number(square.dataset.column));
});

fullscreenButton.addEventListener("click", enterFullscreen);

customizationButton.addEventListener("click", () => {
  if (state.customizationMenuOpen) {
    closeCustomizationMenu();
    return;
  }

  openCustomizationMenu();
});

closeCustomizationButton.addEventListener("click", closeCustomizationMenu);

backgroundThemeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-background-theme]");

  if (!button) {
    return;
  }

  setBackgroundTheme(button.dataset.backgroundTheme);
});

boardThemeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-board-theme]");

  if (!button) {
    return;
  }

  setBoardTheme(button.dataset.boardTheme);
});

newGameButton.addEventListener("click", openNewGameMenu);

undoButton.addEventListener("click", () => {
  if (state.pendingPromotion) {
    state.pendingPromotion = null;
    render();
    return;
  }

  undoMove();
});

randomTeamsButton.addEventListener("click", randomizeTeams);

closeNewGameMenuButton.addEventListener("click", closeNewGameMenus);

startSingleplayerButton.addEventListener("click", openAiMenu);

openMultiplayerButton.addEventListener("click", startSingleplayerGame);

closeAiMenuButton.addEventListener("click", () => {
  state.aiMenuOpen = false;
  state.newGameMenuOpen = true;
  render();
});

aiDifficultyList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ai-level]");

  if (!button) {
    return;
  }

  const aiProfile = AI_LEVELS.find(
    (profile) => profile.level === Number(button.dataset.aiLevel),
  );

  if (!aiProfile) {
    return;
  }

  startAiGame(aiProfile);
});

promotionDialog.addEventListener("click", (event) => {
  const choiceButton = event.target.closest("[data-piece]");

  if (choiceButton && state.pendingPromotion) {
    commitMove(state.pendingPromotion, choiceButton.dataset.piece);
    return;
  }
});

cancelPromotionButton.addEventListener("click", () => {
  state.pendingPromotion = null;
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.pendingPromotion) {
    state.pendingPromotion = null;
    render();
    return;
  }

  if (event.key === "Escape" && state.customizationMenuOpen) {
    closeCustomizationMenu();
    return;
  }

  if (event.key === "Escape" && (state.aiMenuOpen || state.newGameMenuOpen)) {
    closeNewGameMenus();
  }
});

document.addEventListener("fullscreenchange", updateFullscreenButtonVisibility);

populateAiDifficultyList();
updateFullscreenButtonVisibility();
render();
