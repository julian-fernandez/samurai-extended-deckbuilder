/**
 * Pure navigation helpers used by Header and MobileNav.
 * Extracted so they can be unit-tested without a DOM.
 *
 * resolveHeaderNavClick returns a descriptor object, not side effects:
 *   { type: "callback", fn }          – call fn(), no navigation
 *   { type: "navigate", to, state? }  – call navigate(to, { state })
 *   [descriptor, descriptor]          – do both, in order
 */
export function resolveHeaderNavClick({ label, to, onBrowseCards, onOpenDeckbuilder }) {
  if (label === "Deckbuilder") {
    if (typeof onOpenDeckbuilder === "function") {
      return { type: "callback", fn: onOpenDeckbuilder };
    }
    // From pages that don't own the deck state, navigate with router state.
    return { type: "navigate", to: "/", state: { openDeck: true } };
  }

  if (to === "/") {
    if (typeof onBrowseCards === "function") {
      return [
        { type: "callback", fn: onBrowseCards },
        { type: "navigate", to: "/" },
      ];
    }
    // From non-home pages: explicitly close deck view when returning to Browse Cards.
    return { type: "navigate", to: "/", state: { closeDeck: true } };
  }

  return { type: "navigate", to };
}

/**
 * Returns true when the deck view should auto-close because the user changed
 * the search / filter state.
 */
export function shouldAutoSwitchToSearch({ showDeck, searchTerm, filters, prevSearchTerm, prevFilters }) {
  if (!showDeck) return false;
  const searchChanged = searchTerm !== prevSearchTerm;
  const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFilters);
  return searchChanged || filtersChanged;
}
