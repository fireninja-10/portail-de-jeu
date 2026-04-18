const $ = (selector) => document.querySelector(selector);

const els = {
  bankroll: $("#bankroll"),
  rounds: $("#rounds"),
  wins: $("#wins"),
  losses: $("#losses"),
  pushes: $("#pushes"),
  dealerTotal: $("#dealer-total"),
  playerTotal: $("#player-total"),
  dealerHand: $("#dealer-hand"),
  playerHand: $("#player-hand"),
  message: $("#message"),
  betInput: $("#bet-input"),
  allinBtn: $("#allin-btn"),
  dealBtn: $("#deal-btn"),
  hitBtn: $("#hit-btn"),
  standBtn: $("#stand-btn"),
  resetBtn: $("#reset-btn"),
  sfxBtn: $("#sfx-btn"),
};

const minBet = 10;
const startBankroll = 1000;
const startBet = 50;
const bailoutBankroll = 250;

const suits = [
  { key: "spades", short: "S", tone: "black" },
  { key: "hearts", short: "H", tone: "red" },
  { key: "diamonds", short: "D", tone: "red" },
  { key: "clubs", short: "C", tone: "black" },
];

const ranks = [
  { label: "A", value: 11 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 10 },
  { label: "Q", value: 10 },
  { label: "K", value: 10 },
];

const formatChips = new Intl.NumberFormat("fr-CA", {
  maximumFractionDigits: 0,
});

let bankroll = startBankroll;
let rounds = 0;
let wins = 0;
let losses = 0;
let pushes = 0;
let currentBet = startBet;
let status = "idle";
let dealerRevealed = false;
let roundToken = 0;
let deck = [];
let playerHand = [];
let dealerHand = [];
let sfxEnabled = true;
let audioContext = null;

function createDeck() {
  const cards = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push({
        suit,
        label: rank.label,
        value: rank.value,
      });
    }
  }

  return shuffle(cards);
}

function shuffle(cards) {
  const deckCopy = [...cards];

  for (let index = deckCopy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deckCopy[index], deckCopy[swapIndex]] = [deckCopy[swapIndex], deckCopy[index]];
  }

  return deckCopy;
}

function refillDeck() {
  deck = createDeck();
}

function drawCard() {
  if (deck.length < 1) {
    refillDeck();
  }

  return deck.pop();
}

function handValue(hand) {
  let total = 0;
  let aceCount = 0;

  for (const card of hand) {
    total += card.value;
    if (card.label === "A") {
      aceCount += 1;
    }
  }

  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount -= 1;
  }

  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function refillCreditsIfNeeded() {
  if (bankroll >= minBet) {
    return false;
  }

  bankroll = bailoutBankroll;
  currentBet = Math.min(Math.max(startBet, minBet), bankroll);
  els.betInput.value = String(currentBet);

  return true;
}

function setMessage(text, mood = "neutral") {
  els.message.textContent = text;
  els.message.dataset.mood = mood;
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }

    audioContext = new AudioCtor();
  }

  return audioContext;
}

function playTone({ frequency, duration = 0.08, gain = 0.04, type = "square", when = 0 }) {
  if (!sfxEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const amplifier = ctx.createGain();
  const startAt = ctx.currentTime + when;
  const stopAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  amplifier.gain.setValueAtTime(0.0001, startAt);
  amplifier.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
  amplifier.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  oscillator.connect(amplifier);
  amplifier.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(stopAt + 0.02);
}

function playPattern(pattern) {
  for (const note of pattern) {
    playTone(note);
  }
}

function playDealSfx() {
  playPattern([
    { frequency: 220, duration: 0.05, gain: 0.035 },
    { frequency: 330, duration: 0.05, gain: 0.03, when: 0.08 },
  ]);
}

function playHitSfx() {
  playTone({ frequency: 420, duration: 0.05, gain: 0.03 });
}

function playWinSfx() {
  playPattern([
    { frequency: 523.25, duration: 0.08, gain: 0.04 },
    { frequency: 659.25, duration: 0.08, gain: 0.04, when: 0.1 },
    { frequency: 784, duration: 0.1, gain: 0.04, when: 0.2 },
  ]);
}

function playLoseSfx() {
  playPattern([
    { frequency: 196, duration: 0.12, gain: 0.04 },
    { frequency: 146.83, duration: 0.18, gain: 0.04, when: 0.12 },
  ]);
}

function playPushSfx() {
  playPattern([
    { frequency: 349.23, duration: 0.08, gain: 0.03 },
    { frequency: 293.66, duration: 0.08, gain: 0.03, when: 0.08 },
    { frequency: 349.23, duration: 0.08, gain: 0.03, when: 0.16 },
  ]);
}

function createCardElement(card, hidden = false) {
  const element = document.createElement("article");

  if (hidden) {
    element.className = "card card--back";
    element.innerHTML = `
      <span class="card__back-shine"></span>
      <span class="card__brand">RETRO</span>
    `;
    return element;
  }

  element.className = `card card--${card.suit.tone}`;
  const glyph = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
  }[card.suit.key];

  element.innerHTML = `
    <span class="card__corner card__corner--top">
      <span class="card__rank">${card.label}</span>
      <span class="card__suit">${glyph}</span>
    </span>
    <span class="card__pip" aria-hidden="true">${glyph}</span>
    <span class="card__corner card__corner--bottom">
      <span class="card__rank">${card.label}</span>
      <span class="card__suit">${glyph}</span>
    </span>
  `;

  return element;
}

function renderHand(container, hand, hideSecondCard = false) {
  container.innerHTML = "";

  if (hand.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "hand__empty";
    placeholder.textContent = "En attente de la donne...";
    container.appendChild(placeholder);
    return;
  }

  hand.forEach((card, index) => {
    const shouldHide = hideSecondCard && index === 1;
    container.appendChild(createCardElement(card, shouldHide));
  });
}

function updateButtons() {
  const roundActive = status === "playerTurn" || status === "dealerTurn";
  const canStart = bankroll >= minBet && !roundActive;

  els.dealBtn.disabled = !canStart;
  els.allinBtn.disabled = roundActive;
  els.hitBtn.disabled = status !== "playerTurn";
  els.standBtn.disabled = status !== "playerTurn";
  els.betInput.disabled = roundActive;
  els.resetBtn.disabled = false;
  els.sfxBtn.textContent = `SFX: ${sfxEnabled ? "ON" : "OFF"}`;
  els.sfxBtn.setAttribute("aria-pressed", String(sfxEnabled));

  els.dealBtn.title = bankroll < minBet
    ? "Pas assez de crédits pour lancer une manche."
    : "Distribuer une nouvelle donne.";
}

function render() {
  els.bankroll.textContent = formatChips.format(bankroll);
  els.rounds.textContent = String(rounds);
  els.wins.textContent = String(wins);
  els.losses.textContent = String(losses);
  els.pushes.textContent = String(pushes);
  els.playerTotal.textContent = String(handValue(playerHand));
  els.dealerTotal.textContent = dealerRevealed || status === "roundOver"
    ? String(handValue(dealerHand))
    : "??";

  renderHand(els.playerHand, playerHand, false);
  renderHand(els.dealerHand, dealerHand, !dealerRevealed && status !== "roundOver");

  els.betInput.min = String(minBet);
  els.betInput.max = String(Math.max(bankroll, minBet));
  if (!Number.isFinite(Number.parseInt(els.betInput.value, 10))) {
    els.betInput.value = String(currentBet);
  }

  updateButtons();
}

function settleRound(outcome, message, payoutMultiplier = 1) {
  status = "roundOver";
  dealerRevealed = true;

  if (outcome === "player") {
    bankroll += Math.round(currentBet * payoutMultiplier);
    wins += 1;
    playWinSfx();
  } else if (outcome === "push") {
    bankroll += currentBet;
    pushes += 1;
    playPushSfx();
  } else {
    losses += 1;
    playLoseSfx();
  }

  const wasRefilled = refillCreditsIfNeeded();

  if (wasRefilled) {
    setMessage(
      `${message} Plus de crédits: la machine te recharge à ${formatChips.format(bailoutBankroll)}.`,
      "neutral"
    );
  } else {
    setMessage(message, outcome === "player" ? "win" : outcome === "push" ? "push" : "lose");
  }

  render();
}

function nextRoundToken() {
  roundToken += 1;
  return roundToken;
}

async function dealerTurn(expectedToken) {
  if (expectedToken !== roundToken) {
    return;
  }

  status = "dealerTurn";
  dealerRevealed = true;
  setMessage("Le croupier retourne sa carte cachée...", "neutral");
  render();

  await sleep(550);

  while (expectedToken === roundToken && handValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
    playHitSfx();
    setMessage("Le croupier pioche une carte.", "neutral");
    render();
    await sleep(550);
  }

  if (expectedToken !== roundToken) {
    return;
  }

  const dealerScore = handValue(dealerHand);
  const playerScore = handValue(playerHand);

  if (dealerScore > 21) {
    settleRound("player", `Le croupier saute au-dessus de 21. Tu gagnes ${playerScore} contre ${dealerScore}.`, 2);
    return;
  }

  if (dealerScore > playerScore) {
    settleRound("dealer", `Le croupier gagne ${dealerScore} contre ${playerScore}.`);
    return;
  }

  if (dealerScore < playerScore) {
    settleRound("player", `Tu gagnes ${playerScore} contre ${dealerScore}.`, 2);
    return;
  }

  settleRound("push", `Égalité parfaite à ${playerScore}.`);
}

function startRound() {
  if (status === "playerTurn" || status === "dealerTurn") {
    return;
  }

  refillCreditsIfNeeded();

  const rawBet = Number.parseInt(els.betInput.value, 10);
  const bet = Number.isFinite(rawBet) ? Math.max(minBet, Math.min(bankroll, rawBet)) : currentBet;

  currentBet = bet;
  els.betInput.value = String(currentBet);

  if (currentBet > bankroll) {
    currentBet = bankroll;
  }

  if (currentBet < minBet) {
    setMessage(`La mise minimale est de ${formatChips.format(minBet)} crédits.`, "lose");
    render();
    return;
  }

  if (deck.length < 15) {
    refillDeck();
  }

  nextRoundToken();

  bankroll -= currentBet;
  rounds += 1;
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard()];
  dealerRevealed = false;
  status = "playerTurn";

  playDealSfx();
  setMessage("Bonne chance. Le néon est avec toi.", "neutral");
  render();

  const playerBlackjack = isBlackjack(playerHand);
  const dealerBlackjack = isBlackjack(dealerHand);

  if (playerBlackjack || dealerBlackjack) {
    dealerRevealed = true;
    render();

    if (playerBlackjack && dealerBlackjack) {
      settleRound("push", "Double blackjack. Égalité.");
      return;
    }

    if (playerBlackjack) {
      settleRound("player", "Blackjack naturel. Paiement 3:2.", 2.5);
      return;
    }

    settleRound("dealer", "Le croupier a blackjack.");
  }
}

function playerHit() {
  if (status !== "playerTurn") {
    return;
  }

  playerHand.push(drawCard());
  playHitSfx();

  const playerScore = handValue(playerHand);
  setMessage(`Tu tires une carte. Total actuel: ${playerScore}.`, "neutral");

  if (playerScore > 21) {
    dealerRevealed = true;
    render();
    settleRound("dealer", `Tu dépasses 21 avec ${playerScore}. Le croupier encaisse.`);
    return;
  }

  render();

  if (playerScore === 21) {
    void playerStand();
  }
}

async function playerStand() {
  if (status !== "playerTurn") {
    return;
  }

  const token = roundToken;
  await dealerTurn(token);
}

function resetGame() {
  nextRoundToken();

  bankroll = startBankroll;
  rounds = 0;
  wins = 0;
  losses = 0;
  pushes = 0;
  currentBet = startBet;
  status = "idle";
  dealerRevealed = false;
  playerHand = [];
  dealerHand = [];
  deck = createDeck();

  els.betInput.value = String(currentBet);
  setMessage("Nouvelle table prête. Insère une mise et distribue les cartes.", "neutral");
  render();
}

function toggleSfx() {
  sfxEnabled = !sfxEnabled;

  if (sfxEnabled) {
    playTone({ frequency: 660, duration: 0.08, gain: 0.03 });
  }

  render();
}

function setAllInBet() {
  refillCreditsIfNeeded();

  if (status === "playerTurn" || status === "dealerTurn") {
    return;
  }

  currentBet = bankroll;
  els.betInput.value = String(currentBet);
  setMessage(`All-in activé: mise à ${formatChips.format(currentBet)} crédits.`, "neutral");
  render();
}

function isEditableTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLElement && target.isContentEditable
  );
}

document.addEventListener("keydown", (event) => {
  if (isEditableTarget(event.target)) {
    if (event.key.toLowerCase() === "enter" && event.target === els.betInput) {
      event.preventDefault();
      startRound();
    }
    return;
  }

  switch (event.key.toLowerCase()) {
    case "n":
      event.preventDefault();
      startRound();
      break;
    case "h":
      event.preventDefault();
      playerHit();
      break;
    case "s":
      event.preventDefault();
      void playerStand();
      break;
    case "r":
      event.preventDefault();
      resetGame();
      break;
    default:
      break;
  }
});

els.dealBtn.addEventListener("click", startRound);
els.allinBtn.addEventListener("click", setAllInBet);
els.hitBtn.addEventListener("click", playerHit);
els.standBtn.addEventListener("click", () => {
  void playerStand();
});
els.resetBtn.addEventListener("click", resetGame);
els.sfxBtn.addEventListener("click", toggleSfx);

deck = createDeck();
setMessage("Prêt pour la première donne. Distribue quand tu veux.", "neutral");
render();
