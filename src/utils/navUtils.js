/**
 * Pure navigation helpers.
 *
 * resolveHeaderNavClick returns a descriptor object:
 *   { type: "navigate", to }  – call navigate(to)
 */
export function resolveHeaderNavClick({ label, to }) {
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
