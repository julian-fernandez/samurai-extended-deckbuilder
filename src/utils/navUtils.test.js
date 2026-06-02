import { describe, it, expect, vi } from "vitest";
import { resolveHeaderNavClick, shouldAutoSwitchToSearch } from "./navUtils.js";

// ── isActive helper (mirrors Header logic) ────────────────────────────────────
function isActive(to, label, { isDeckView = false, pathname = "/" } = {}) {
  if (label === "Deckbuilder") return isDeckView;
  if (label === "Browse Cards") return pathname === "/" && !isDeckView;
  if (!to) return false;
  return pathname === to;
}

describe("isActive – nav highlight", () => {
  it("highlights Deckbuilder when isDeckView is true", () => {
    expect(isActive(null, "Deckbuilder", { isDeckView: true })).toBe(true);
  });

  it("does not highlight Deckbuilder when isDeckView is false", () => {
    expect(isActive(null, "Deckbuilder", { isDeckView: false })).toBe(false);
  });

  it("highlights Browse Cards when pathname is / and NOT in deck view", () => {
    expect(isActive("/", "Browse Cards", { pathname: "/", isDeckView: false })).toBe(true);
  });

  it("does NOT highlight Browse Cards when in deck view (even though pathname is /)", () => {
    expect(isActive("/", "Browse Cards", { pathname: "/", isDeckView: true })).toBe(false);
  });

  it("does not highlight Browse Cards when on /browse", () => {
    expect(isActive("/", "Browse Cards", { pathname: "/browse" })).toBe(false);
  });

  it("highlights Browse Decks when pathname is /browse", () => {
    expect(isActive("/browse", "Browse Decks", { pathname: "/browse" })).toBe(true);
  });

  it("highlights My Decks when pathname is /my-decks", () => {
    expect(isActive("/my-decks", "My Decks", { pathname: "/my-decks" })).toBe(true);
  });

  it("Deckbuilder and Browse Cards are never both highlighted", () => {
    // Deck view: Deckbuilder on, Browse Cards off
    expect(isActive(null, "Deckbuilder", { isDeckView: true, pathname: "/" })).toBe(true);
    expect(isActive("/", "Browse Cards", { isDeckView: true, pathname: "/" })).toBe(false);
    // Card search: Browse Cards on, Deckbuilder off
    expect(isActive(null, "Deckbuilder", { isDeckView: false, pathname: "/" })).toBe(false);
    expect(isActive("/", "Browse Cards", { isDeckView: false, pathname: "/" })).toBe(true);
  });
});

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

describe("resolveHeaderNavClick – Deckbuilder", () => {
  it("calls onOpenDeckbuilder when provided (home page)", () => {
    const onOpenDeckbuilder = vi.fn();
    const result = resolveHeaderNavClick({
      label: "Deckbuilder", to: null, onOpenDeckbuilder,
    });
    expect(result).toEqual({ type: "callback", fn: onOpenDeckbuilder });
  });

  it("navigates to / with openDeck state when no callback (other pages)", () => {
    const result = resolveHeaderNavClick({ label: "Deckbuilder", to: null });
    expect(result).toEqual({ type: "navigate", to: "/", state: { openDeck: true } });
  });

  it("navigates to / with openDeck state when callback is not a function", () => {
    const result = resolveHeaderNavClick({
      label: "Deckbuilder", to: null, onOpenDeckbuilder: undefined,
    });
    expect(result).toEqual({ type: "navigate", to: "/", state: { openDeck: true } });
  });
});

describe("resolveHeaderNavClick – Browse Cards", () => {
  it("calls onBrowseCards AND navigates to / when on home page", () => {
    const onBrowseCards = vi.fn();
    const result = resolveHeaderNavClick({ label: "Browse Cards", to: "/", onBrowseCards });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toEqual({ type: "callback", fn: onBrowseCards });
    expect(result[1]).toEqual({ type: "navigate", to: "/" });
  });

  it("navigates with closeDeck state when onBrowseCards is not provided (other pages)", () => {
    const result = resolveHeaderNavClick({ label: "Browse Cards", to: "/" });
    expect(result).toEqual({ type: "navigate", to: "/", state: { closeDeck: true } });
  });
});

describe("resolveHeaderNavClick – other links", () => {
  it("navigates to /browse for Browse Decks", () => {
    const result = resolveHeaderNavClick({ label: "Browse Decks", to: "/browse" });
    expect(result).toEqual({ type: "navigate", to: "/browse" });
  });

  it("navigates to /my-decks for My Decks", () => {
    const result = resolveHeaderNavClick({ label: "My Decks", to: "/my-decks" });
    expect(result).toEqual({ type: "navigate", to: "/my-decks" });
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
