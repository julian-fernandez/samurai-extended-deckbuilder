import { describe, it, expect } from "vitest";
import {
  addToDeck,
  removeFromDeck,
  getDeckCount,
  getDeckTotal,
  getDynastyCount,
  getFateCount,
  getDeckValidation,
  importDeck,
  groupCardsByName,
  clearDeck,
  isCardBanned,
  exportDeck,
} from "./deckService.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const personality = { id: "p1", name: "Togashi Mitsu", type: "personality", quantity: 1 };
const holding = { id: "h1", name: "Traveling Peddler", type: "holding", quantity: 1 };
const strategy = { id: "s1", name: "Charge!", type: "strategy", quantity: 1 };
const stronghold = { id: "sh1", name: "Dragon Stronghold", type: "stronghold", quantity: 1 };
const sensei = { id: "se1", name: "Togashi Yokuni", type: "sensei", quantity: 1 };
const borderKeep = { id: "bk1", name: "Border Keep", type: "holding", quantity: 1 };
const borderKeepAlt = { id: "bk2", name: "Border Keep (exp)", type: "holding", quantity: 1 };
const bambooHarvesters = { id: "bh1", name: "Bamboo Harvesters", type: "holding", quantity: 1 };
const uniqueCard = { id: "u1", name: "Togashi Mitsu (exp)", type: "personality", keywords: ["Unique"], quantity: 1 };
const bannedCard = { id: "ban1", name: "Banned Person", type: "personality", banned: true, quantity: 1 };

// ── addToDeck ─────────────────────────────────────────────────────────────────

describe("addToDeck", () => {
  it("adds a new card to an empty deck", () => {
    const deck = addToDeck([], personality);
    expect(deck).toHaveLength(1);
    expect(deck[0].id).toBe("p1");
    expect(deck[0].quantity).toBe(1);
  });

  it("increments quantity when adding a duplicate non-unique card", () => {
    const deck = addToDeck([{ ...personality }], personality);
    expect(deck).toHaveLength(1);
    expect(deck[0].quantity).toBe(2);
  });

  it("does not exceed MAX_COPIES (3) for a normal card", () => {
    let deck = [];
    deck = addToDeck(deck, personality);
    deck = addToDeck(deck, personality);
    deck = addToDeck(deck, personality);
    deck = addToDeck(deck, personality); // 4th attempt
    expect(deck[0].quantity).toBe(3);
  });

  it("does not add a second copy of a Unique card", () => {
    const deck = addToDeck([{ ...uniqueCard }], uniqueCard);
    expect(deck).toHaveLength(1);
    expect(deck[0].quantity).toBe(1);
  });

  it("adds Border Keep when not already present", () => {
    const deck = addToDeck([], borderKeep);
    expect(deck).toHaveLength(1);
    expect(deck[0].name).toBe("Border Keep");
  });

  it("replaces existing Border Keep with a new version", () => {
    const deck = addToDeck([{ ...borderKeep }], borderKeepAlt);
    expect(deck).toHaveLength(1);
    expect(deck[0].name).toBe("Border Keep (exp)");
    expect(deck[0].quantity).toBe(1);
  });

  it("adds Bamboo Harvesters when not already present", () => {
    const deck = addToDeck([], bambooHarvesters);
    expect(deck).toHaveLength(1);
    expect(deck[0].name).toBe("Bamboo Harvesters");
  });

  it("Border Keep and Bamboo Harvesters are treated independently", () => {
    const deck = addToDeck([{ ...borderKeep }], bambooHarvesters);
    expect(deck).toHaveLength(2);
  });
});

// ── removeFromDeck ────────────────────────────────────────────────────────────

describe("removeFromDeck", () => {
  it("decrements quantity when card has more than 1 copy", () => {
    const deck = [{ ...personality, quantity: 2 }];
    const result = removeFromDeck(deck, "p1");
    expect(result[0].quantity).toBe(1);
  });

  it("removes the card entry when quantity reaches 0", () => {
    const deck = [{ ...personality, quantity: 1 }];
    const result = removeFromDeck(deck, "p1");
    expect(result).toHaveLength(0);
  });

  it("returns deck unchanged when card ID is not found", () => {
    const deck = [{ ...personality }];
    const result = removeFromDeck(deck, "nonexistent");
    expect(result).toEqual(deck);
  });
});

// ── getDeckCount ──────────────────────────────────────────────────────────────

describe("getDeckCount", () => {
  it("returns the quantity for a card in the deck", () => {
    expect(getDeckCount([{ ...personality, quantity: 3 }], "p1")).toBe(3);
  });

  it("returns 0 when the card is not in the deck", () => {
    expect(getDeckCount([], "p1")).toBe(0);
  });
});

// ── getDeckTotal ──────────────────────────────────────────────────────────────

describe("getDeckTotal", () => {
  it("sums quantities of all cards", () => {
    const deck = [
      { ...personality, quantity: 3 },
      { ...holding, quantity: 2 },
    ];
    expect(getDeckTotal(deck)).toBe(5);
  });

  it("returns 0 for empty deck", () => {
    expect(getDeckTotal([])).toBe(0);
  });
});

// ── getDynastyCount ───────────────────────────────────────────────────────────

describe("getDynastyCount", () => {
  it("counts personality and holding cards (excluding pregame holdings)", () => {
    const deck = [
      { ...personality, quantity: 2 },
      { ...holding, quantity: 3 },
      { ...borderKeep, quantity: 1 },   // excluded — pregame holding
      { ...bambooHarvesters, quantity: 1 }, // excluded — pregame holding
    ];
    expect(getDynastyCount(deck)).toBe(5);
  });

  it("does not count fate cards", () => {
    expect(getDynastyCount([{ ...strategy, quantity: 2 }])).toBe(0);
  });
});

// ── getFateCount ──────────────────────────────────────────────────────────────

describe("getFateCount", () => {
  it("counts strategy and other fate cards", () => {
    const ring = { id: "r1", name: "Ring of Air", type: "ring", quantity: 2 };
    const deck = [{ ...strategy, quantity: 3 }, ring];
    expect(getFateCount(deck)).toBe(5);
  });

  it("does not count dynasty cards", () => {
    expect(getFateCount([{ ...personality, quantity: 2 }])).toBe(0);
  });
});

// ── getDeckValidation ─────────────────────────────────────────────────────────

describe("getDeckValidation", () => {
  const makeDynastyCards = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `dyn${i}`,
      name: `Dynasty Card ${i}`,
      type: "personality",
      quantity: 1,
    }));

  const makeFateCards = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `fate${i}`,
      name: `Fate Card ${i}`,
      type: "strategy",
      quantity: 1,
    }));

  it("reports errors for a completely empty deck", () => {
    const { isValid, errors } = getDeckValidation([]);
    expect(isValid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("is valid with exactly the minimum required cards and 1 of each required card", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { isValid, errors } = getDeckValidation(deck);
    expect(isValid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("flags missing Stronghold", () => {
    const deck = [
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /stronghold/i.test(e))).toBe(true);
  });

  it("flags deck with more than 1 Stronghold", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { id: "sh2", name: "Another Stronghold", type: "stronghold", quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /stronghold/i.test(e))).toBe(true);
  });

  it("flags missing Border Keep", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /border keep/i.test(e))).toBe(true);
  });

  it("flags missing Bamboo Harvesters", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /bamboo harvesters/i.test(e))).toBe(true);
  });

  it("flags insufficient dynasty cards", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(10),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /dynasty/i.test(e))).toBe(true);
  });

  it("flags insufficient fate cards", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(10),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /fate/i.test(e))).toBe(true);
  });

  it("flags a banned card in the deck", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      { ...bannedCard, quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors, bannedCards } = getDeckValidation(deck);
    expect(bannedCards).toHaveLength(1);
    expect(errors.some((e) => /banned/i.test(e))).toBe(true);
  });

  it("allows at most 1 Sensei", () => {
    const deck = [
      { ...stronghold, quantity: 1 },
      { ...borderKeep, quantity: 1 },
      { ...bambooHarvesters, quantity: 1 },
      { ...sensei, quantity: 1 },
      { id: "se2", name: "Another Sensei", type: "sensei", quantity: 1 },
      ...makeDynastyCards(40),
      ...makeFateCards(40),
    ];
    const { errors } = getDeckValidation(deck);
    expect(errors.some((e) => /sensei/i.test(e))).toBe(true);
  });
});

// ── isCardBanned ──────────────────────────────────────────────────────────────

describe("isCardBanned", () => {
  it("returns true for a banned card", () => {
    expect(isCardBanned({ banned: true })).toBe(true);
  });

  it("returns false for a non-banned card", () => {
    expect(isCardBanned({ banned: false })).toBe(false);
    expect(isCardBanned({})).toBe(false);
  });
});

// ── importDeck ────────────────────────────────────────────────────────────────

describe("importDeck", () => {
  const allCards = [
    { id: "p1", name: "Togashi Mitsu", type: "personality" },
    { id: "h1", name: "Traveling Peddler", type: "holding" },
    { id: "ban1", name: "Banned Person", type: "personality", banned: true },
  ];

  it("parses a simple deck text", () => {
    const text = "3 Togashi Mitsu\n2 Traveling Peddler";
    const { deck, missingCards } = importDeck(text, allCards);
    expect(missingCards).toHaveLength(0);
    expect(deck.find((c) => c.id === "p1").quantity).toBe(3);
    expect(deck.find((c) => c.id === "h1").quantity).toBe(2);
  });

  it("skips comment lines starting with #", () => {
    const text = "# Stronghold\n3 Togashi Mitsu";
    const { deck } = importDeck(text, allCards);
    expect(deck).toHaveLength(1);
  });

  it("skips blank lines", () => {
    const text = "\n3 Togashi Mitsu\n\n2 Traveling Peddler\n";
    const { deck } = importDeck(text, allCards);
    expect(deck).toHaveLength(2);
  });

  it("tracks missing cards that are not in allCards", () => {
    const text = "1 Unknown Card";
    const { missingCards } = importDeck(text, allCards);
    expect(missingCards).toHaveLength(1);
    expect(missingCards[0].name).toBe("Unknown Card");
  });

  it("reports banned cards separately", () => {
    const text = "1 Banned Person";
    const { bannedCards, deck } = importDeck(text, allCards);
    expect(bannedCards).toHaveLength(1);
    expect(bannedCards[0].name).toBe("Banned Person");
    // Banned card is still added to the deck so the user can see it
    expect(deck.some((c) => c.id === "ban1")).toBe(true);
  });

  it("accumulates quantity when the same card appears on multiple lines", () => {
    const text = "2 Togashi Mitsu\n1 Togashi Mitsu";
    const { deck } = importDeck(text, allCards);
    const entry = deck.find((c) => c.id === "p1");
    expect(entry.quantity).toBe(3);
  });
});

// ── groupCardsByName ──────────────────────────────────────────────────────────

describe("groupCardsByName", () => {
  it("combines quantities for cards with the same name", () => {
    const deck = [
      { id: "p1a", name: "Togashi Mitsu", quantity: 1 },
      { id: "p1b", name: "Togashi Mitsu", quantity: 2 },
    ];
    const result = groupCardsByName(deck);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it("preserves separate entries for different card names", () => {
    const deck = [
      { id: "p1", name: "Card A", quantity: 1 },
      { id: "p2", name: "Card B", quantity: 1 },
    ];
    expect(groupCardsByName(deck)).toHaveLength(2);
  });
});

// ── clearDeck ─────────────────────────────────────────────────────────────────

describe("clearDeck", () => {
  it("returns an empty array", () => {
    expect(clearDeck()).toEqual([]);
  });
});
