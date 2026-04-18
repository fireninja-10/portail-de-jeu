const chips = [...document.querySelectorAll(".chip")];
const cards = [...document.querySelectorAll(".game-card")];
const searchInput = document.querySelector("#searchInput");

let activeFilter = "all";

function matchesFilter(card) {
  if (activeFilter === "all") {
    return true;
  }

  const categories = (card.dataset.category || "").split(/\s+/);
  return categories.includes(activeFilter);
}

function matchesSearch(card) {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return (card.dataset.search || "").toLowerCase().includes(query);
}

function updateCards() {
  cards.forEach((card) => {
    const visible = matchesFilter(card) && matchesSearch(card);
    card.classList.toggle("is-hidden", !visible);
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "all";

    chips.forEach((item) => {
      item.classList.toggle("is-active", item === chip);
    });

    updateCards();
  });
});

searchInput.addEventListener("input", updateCards);

updateCards();
