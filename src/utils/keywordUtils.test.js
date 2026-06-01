import { describe, it, expect } from "vitest";
import {
  extractKeywords,
  cleanTextFromKeywords,
  getUniqueKeywords,
  filterByKeywords,
} from "./keywordUtils.js";

// ── isKeywordBlock (tested indirectly via extractKeywords) ──────────────────

describe("extractKeywords", () => {
  it("returns empty array for card with no keywords and no printing text", () => {
    const card = { name: "Test Card" };
    expect(extractKeywords(card)).toEqual([]);
  });

  it("returns keywords from the dedicated keywords array", () => {
    const card = { keywords: ["Unique", "Samurai"] };
    expect(extractKeywords(card)).toEqual(["Unique", "Samurai"]);
  });

  it("strips HTML tags from the dedicated keywords array", () => {
    const card = { keywords: ["<b>Unique</b>", "Samurai"] };
    expect(extractKeywords(card)).toEqual(["Unique", "Samurai"]);
  });

  it("does not add duplicates when printing text repeats keywords array entries", () => {
    const card = {
      keywords: ["Unique"],
      printing: [{ text: ["<b>Unique</b> <br> Some rules text."] }],
    };
    const result = extractKeywords(card);
    expect(result.filter((k) => k === "Unique")).toHaveLength(1);
  });

  it("picks up keywords from bullet-separated printing text", () => {
    // Simulates: <b>Nonhuman • Ratling • Scout</b> <br> rules text
    const card = {
      keywords: [],
      printing: [
        {
          text: [
            "<b>Nonhuman \u2022 Ratling \u2022 Scout</b> <br> Some rules text.",
          ],
        },
      ],
    };
    const result = extractKeywords(card);
    expect(result).toContain("Nonhuman");
    expect(result).toContain("Scout");
  });

  it("picks up keywords encoded as &#8226; bullet entities", () => {
    const card = {
      keywords: [],
      printing: [
        {
          text: [
            "<b>Samurai&#8226;Unique</b> <br> rules.",
          ],
        },
      ],
    };
    const result = extractKeywords(card);
    expect(result).toContain("Samurai");
    expect(result).toContain("Unique");
  });

  it("ignores printing text that is not a keyword block", () => {
    const card = {
      keywords: [],
      printing: [
        {
          text: [
            "After your next Events Phase begins, bow this Personality.",
          ],
        },
      ],
    };
    expect(extractKeywords(card)).toEqual([]);
  });

  it("handles card with no printing field", () => {
    const card = { keywords: ["Ninja"] };
    expect(extractKeywords(card)).toEqual(["Ninja"]);
  });

  it("handles printing entries with no text field", () => {
    const card = {
      keywords: ["Monk"],
      printing: [{}],
    };
    expect(extractKeywords(card)).toEqual(["Monk"]);
  });
});

// ── cleanTextFromKeywords ────────────────────────────────────────────────────

describe("cleanTextFromKeywords", () => {
  it("returns empty string for falsy input", () => {
    expect(cleanTextFromKeywords("")).toBe("");
    expect(cleanTextFromKeywords(null)).toBe("");
    expect(cleanTextFromKeywords(undefined)).toBe("");
  });

  it("removes a leading bold keyword line followed by <br>", () => {
    const text = "<b>Unique</b><br>Bow this card.";
    const result = cleanTextFromKeywords(text);
    expect(result).not.toMatch(/^<b>/);
  });

  it("returns text unchanged if there is no keyword line to strip", () => {
    const text = "After the battle resolves, draw a card.";
    expect(cleanTextFromKeywords(text)).toBe(text);
  });
});

// ── getUniqueKeywords ────────────────────────────────────────────────────────

describe("getUniqueKeywords", () => {
  it("returns sorted unique keywords across all cards", () => {
    const cards = [
      { keywords: ["Unique", "Samurai"] },
      { keywords: ["Samurai", "Ninja"] },
      { keywords: [] },
    ];
    expect(getUniqueKeywords(cards)).toEqual(["Ninja", "Samurai", "Unique"]);
  });

  it("returns empty array when no card has keywords", () => {
    const cards = [{ keywords: [] }, {}];
    expect(getUniqueKeywords(cards)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(getUniqueKeywords([])).toEqual([]);
  });
});

// ── filterByKeywords ─────────────────────────────────────────────────────────

describe("filterByKeywords", () => {
  const cards = [
    { name: "A", keywords: ["Unique", "Samurai"] },
    { name: "B", keywords: ["Ninja", "Shadowlands"] },
    { name: "C", keywords: ["Samurai"] },
  ];

  it("returns all cards when selectedKeywords is empty", () => {
    expect(filterByKeywords(cards, [])).toHaveLength(3);
  });

  it("returns all cards when selectedKeywords is null", () => {
    expect(filterByKeywords(cards, null)).toHaveLength(3);
  });

  it('mode "any" returns cards with at least one matching keyword (default)', () => {
    const result = filterByKeywords(cards, ["Samurai", "Ninja"]);
    expect(result.map((c) => c.name)).toEqual(["A", "B", "C"]);
  });

  it('mode "any" excludes cards with no matching keyword', () => {
    const result = filterByKeywords(cards, ["Ninja"]);
    expect(result.map((c) => c.name)).toEqual(["B"]);
  });

  it('mode "all" returns only cards that have every selected keyword', () => {
    const result = filterByKeywords(cards, ["Unique", "Samurai"], "all");
    expect(result.map((c) => c.name)).toEqual(["A"]);
  });

  it('mode "all" returns empty array when no card matches all keywords', () => {
    const result = filterByKeywords(cards, ["Unique", "Ninja"], "all");
    expect(result).toHaveLength(0);
  });
});
