import { useState, useEffect, useRef } from "react";
import { useCards } from "./useCards";
import { useDeck } from "./useDeck";
import { useFilters } from "./useFilters";
import { usePagination } from "./usePagination";
import { useScrollToTop } from "./useScrollToTop";
import { useCardPreview } from "./useCardPreview";

/**
 * Composes all hooks and state shared between the main App route and DeckPage.
 *
 * @param {{ initialShowDeck?: boolean }} options
 *   initialShowDeck – whether the deck panel starts open (default false).
 */
export function useCardSearchPage({ initialShowDeck = false } = {}) {
  const { cards, filteredCards, loading, uniqueValues, filterCardsData } = useCards();
  const deckApi = useDeck(cards);
  const { searchTerm, setSearchTerm, filters, setFilters, addKeyword, removeKeyword } = useFilters();
  const { currentPage, totalPages, currentCards, handlePageChange } = usePagination(filteredCards);
  const { showScrollToTop, scrollToTop } = useScrollToTop();
  const { hoveredCard, handleCardHover } = useCardPreview();

  const [showDeck, setShowDeck] = useState(initialShowDeck);
  const [viewMode, setViewMode] = useState("image");
  const [reloadTick, setReloadTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const prevFiltersRef = useRef({ searchTerm: "", filters: {} });

  // Debounce search term to avoid filtering 6000+ cards on every keystroke;
  // clear instantly so removing a search term feels responsive.
  useEffect(() => {
    const timer = setTimeout(() => {
      filterCardsData(searchTerm, filters);
    }, searchTerm ? 200 : 0);
    return () => clearTimeout(timer);
  }, [cards, searchTerm, filters, filterCardsData]);

  // Any change to search / filters while the deck panel is open switches back
  // to the card search view so the results are immediately visible.
  useEffect(() => {
    if (!showDeck) {
      prevFiltersRef.current = { searchTerm, filters };
      return;
    }
    const filtersChanged =
      searchTerm !== prevFiltersRef.current.searchTerm ||
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current.filters);

    if (filtersChanged) {
      setShowDeck(false);
    }
    prevFiltersRef.current = { searchTerm, filters };
  }, [searchTerm, filters, showDeck]);

  const handleToggleDeckView = () => {
    setShowDeck((prev) => !prev);
  };

  const hasActiveSearch =
    searchTerm !== "" ||
    filters.clan !== "" ||
    filters.type !== "" ||
    filters.keywords.length > 0 ||
    ["costMin", "costMax", "forceMin", "forceMax", "chiMin", "chiMax", "focusMin", "focusMax", "honorMin", "honorMax"].some(
      (k) => filters[k] !== ""
    );

  const sidebarProps = {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
    uniqueValues,
    isOpen: sidebarOpen,
    onToggle: () => setSidebarOpen((prev) => !prev),
    isCollapsed: sidebarCollapsed,
    onCollapseToggle: () => setSidebarCollapsed((prev) => !prev),
  };

  return {
    // cards
    cards,
    filteredCards,
    loading,
    uniqueValues,
    // deck
    ...deckApi,
    // filters
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
    // pagination
    currentPage,
    totalPages,
    currentCards,
    handlePageChange,
    // scroll
    showScrollToTop,
    scrollToTop,
    // card preview
    hoveredCard,
    handleCardHover,
    // ui state
    showDeck,
    setShowDeck,
    viewMode,
    setViewMode,
    reloadTick,
    setReloadTick,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    // computed
    hasActiveSearch,
    sidebarProps,
    handleToggleDeckView,
  };
}
