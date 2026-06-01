import { describe, it, expect } from "vitest";
import {
  filterByText,
  filterByClan,
  filterByType,
  filterByRange,
} from "./filterUtils.js";

const cards = [
  {
    name: "Shosuro Kameyoi",
    text: "Bow: produce 2 Gold.",
    keywords: ["Ninja", "Unique"],
    clan: "scorpion",
    type: "personality",
    cost: "4",
  },
  {
    name: "Dragon Sensei",
    text: "After a battle begins.",
    keywords: ["Samurai"],
    clan: ["dragon"],
    type: "sensei",
    cost: "0",
  },
  {
    name: "Crab Stronghold",
    text: "Each player draws 2 cards.",
    keywords: ["Crab Clan"],
    clan: "crab",
    type: "stronghold",
    cost: "0",
  },
  {
    name: "Ring of Fire",
    text: "Fire ring.",
    keywords: ["Fire"],
    type: "ring",
    cost: "3",
  },
];

// ── filterByText ──────────────────────────────────────────────────────────────

describe("filterByText", () => {
  it("returns all cards when search term is empty", () => {
    expect(filterByText(cards, "")).toHaveLength(4);
  });

  it("returns all cards when search term is whitespace", () => {
    expect(filterByText(cards, "   ")).toHaveLength(4);
  });

  it("returns all cards when search term is null", () => {
    expect(filterByText(cards, null)).toHaveLength(4);
  });

  it("matches on card name (case-insensitive)", () => {
    const result = filterByText(cards, "kameyoi");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Shosuro Kameyoi");
  });

  it("matches on card text field", () => {
    const result = filterByText(cards, "2 cards");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Crab Stronghold");
  });

  it("matches on a keyword", () => {
    const result = filterByText(cards, "ninja");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Shosuro Kameyoi");
  });

  it("returns empty array when nothing matches", () => {
    expect(filterByText(cards, "xyznotfound")).toHaveLength(0);
  });

  it("matches partial name substring", () => {
    const result = filterByText(cards, "dragon");
    expect(result.map((c) => c.name)).toContain("Dragon Sensei");
  });
});

// ── filterByClan ──────────────────────────────────────────────────────────────

describe("filterByClan", () => {
  it("returns all cards when clan is 'all'", () => {
    expect(filterByClan(cards, "all")).toHaveLength(4);
  });

  it("returns all cards when clan is null or undefined", () => {
    expect(filterByClan(cards, null)).toHaveLength(4);
    expect(filterByClan(cards, undefined)).toHaveLength(4);
  });

  it("matches card with string clan field (case-insensitive)", () => {
    const result = filterByClan(cards, "Scorpion");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Shosuro Kameyoi");
  });

  it("matches card with array clan field", () => {
    const result = filterByClan(cards, "dragon");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Dragon Sensei");
  });

  it("matches card via clan keyword (e.g. 'Crab Clan' keyword)", () => {
    // Crab Stronghold has no clan field but has 'Crab Clan' as a keyword
    const crabCard = { ...cards[2], clan: undefined };
    const result = filterByClan([crabCard], "crab");
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no card belongs to the selected clan", () => {
    expect(filterByClan(cards, "crane")).toHaveLength(0);
  });

  it("does not match clan keyword prefix ('Dragon' keyword should not match 'Dragon Clan')", () => {
    // 'Ring of Fire' has a 'Fire' keyword, not 'Fire Clan'
    const result = filterByClan(cards, "fire");
    expect(result).toHaveLength(0);
  });
});

// ── filterByType ──────────────────────────────────────────────────────────────

describe("filterByType", () => {
  it("returns all cards when type is 'all'", () => {
    expect(filterByType(cards, "all")).toHaveLength(4);
  });

  it("returns all cards when type is null", () => {
    expect(filterByType(cards, null)).toHaveLength(4);
  });

  it("matches cards by type (case-insensitive)", () => {
    const result = filterByType(cards, "Personality");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Shosuro Kameyoi");
  });

  it("returns empty array when no card has the given type", () => {
    expect(filterByType(cards, "spell")).toHaveLength(0);
  });
});

// ── filterByRange ─────────────────────────────────────────────────────────────

describe("filterByRange", () => {
  it("returns all cards when min and max are undefined", () => {
    expect(filterByRange(cards, "cost", undefined, undefined)).toHaveLength(4);
  });

  it("returns all cards when min and max are empty strings", () => {
    expect(filterByRange(cards, "cost", "", "")).toHaveLength(4);
  });

  it("filters by minimum value", () => {
    const result = filterByRange(cards, "cost", 3, undefined);
    expect(result.map((c) => c.name)).toContain("Shosuro Kameyoi");
    expect(result.map((c) => c.name)).toContain("Ring of Fire");
    expect(result.map((c) => c.name)).not.toContain("Dragon Sensei");
  });

  it("filters by maximum value", () => {
    const result = filterByRange(cards, "cost", undefined, 3);
    expect(result.map((c) => c.name)).toContain("Dragon Sensei");
    expect(result.map((c) => c.name)).toContain("Ring of Fire");
    expect(result.map((c) => c.name)).not.toContain("Shosuro Kameyoi");
  });

  it("filters by both min and max range", () => {
    const result = filterByRange(cards, "cost", 3, 3);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ring of Fire");
  });

  it("excludes cards where the field is missing", () => {
    const cardsWithMissing = [
      { name: "No Cost" },
      { name: "Has Cost", cost: "2" },
    ];
    const result = filterByRange(cardsWithMissing, "cost", 1, 5);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Has Cost");
  });

  it("excludes cards where the field value is non-numeric", () => {
    const cardsWithBadValue = [{ name: "Bad", cost: "X" }];
    expect(filterByRange(cardsWithBadValue, "cost", 1, 5)).toHaveLength(0);
  });
});
