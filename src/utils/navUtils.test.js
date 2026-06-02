import { describe, it, expect } from "vitest";
import { resolveHeaderNavClick, shouldAutoSwitchToSearch } from "./navUtils.js";

const BASE_FILTERS = {
  clan: "", type: "",
  costMin: "", costMax: "",
  forceMin: "", forceMax: "",
  chiMin: "", chiMax: "",
  focusMin: "", focusMax: "",
  honorMin: "", honorMax: "",
  keywords: [], keywordsMode: "any",
};

// ── resolveHeaderNavClick ─────────────────────────────────────────────────────

describe("resolveHeaderNavClick – all links", () => {
  it("returns a navigate action for Browse Cards", () => {
    expect(resolveHeaderNavClick({ label: "Browse Cards", to: "/" }))
      .toEqual({ type: "navigate", to: "/" });
  });

  it("returns a navigate action for Browse Decks", () => {
    expect(resolveHeaderNavClick({ label: "Browse Decks", to: "/browse" }))
      .toEqual({ type: "navigate", to: "/browse" });
  });

  it("returns a navigate action for Deckbuilder", () => {
    expect(resolveHeaderNavClick({ label: "Deckbuilder", to: "/?deck" }))
      .toEqual({ type: "navigate", to: "/?deck" });
  });

  it("returns a navigate action for My Decks", () => {
    expect(resolveHeaderNavClick({ label: "My Decks", to: "/my-decks" }))
      .toEqual({ type: "navigate", to: "/my-decks" });
  });
});

// ── shouldAutoSwitchToSearch ──────────────────────────────────────────────────

describe("shouldAutoSwitchToSearch", () => {
  it("returns false when deck is not shown", () => {
    expect(shouldAutoSwitchToSearch({
      showDeck: false,
      searchTerm: "dragon",
      filters: BASE_FILTERS,
      prevSearchTerm: "",
      prevFilters: BASE_FILTERS,
    })).toBe(false);
  });

  it("returns false when deck is shown but nothing changed (opening deck view)", () => {
    // prevRef equals current state — effect is triggered by showDeck changing,
    // not by filter changes. No auto-switch should fire.
    expect(shouldAutoSwitchToSearch({
      showDeck: true,
      searchTerm: "",
      filters: BASE_FILTERS,
      prevSearchTerm: "",
      prevFilters: BASE_FILTERS,
    })).toBe(false);
  });

  it("returns true when deck is shown and search term changed", () => {
    expect(shouldAutoSwitchToSearch({
      showDeck: true,
      searchTerm: "dragon",
      filters: BASE_FILTERS,
      prevSearchTerm: "",
      prevFilters: BASE_FILTERS,
    })).toBe(true);
  });

  it("returns true when deck is shown and a filter changed", () => {
    expect(shouldAutoSwitchToSearch({
      showDeck: true,
      searchTerm: "",
      filters: { ...BASE_FILTERS, clan: "crab" },
      prevSearchTerm: "",
      prevFilters: BASE_FILTERS,
    })).toBe(true);
  });

  it("returns true when keyword added while deck is shown", () => {
    expect(shouldAutoSwitchToSearch({
      showDeck: true,
      searchTerm: "",
      filters: { ...BASE_FILTERS, keywords: ["Samurai"] },
      prevSearchTerm: "",
      prevFilters: BASE_FILTERS,
    })).toBe(true);
  });

  it("returns false when deck is shown and prev state already has the same search term", () => {
    // Simulates: navigation carried "dragon" as initial state, prevRef was
    // initialised to the same value. No change → no auto-switch.
    expect(shouldAutoSwitchToSearch({
      showDeck: true,
      searchTerm: "dragon",
      filters: BASE_FILTERS,
      prevSearchTerm: "dragon",
      prevFilters: BASE_FILTERS,
    })).toBe(false);
  });
});
