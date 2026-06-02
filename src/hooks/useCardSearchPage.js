import { useState, useEffect, useRef } from "react";
import { useCards } from "./useCards";
import { useDeck } from "./useDeck";
import { useFilters } from "./useFilters";
import { usePagination } from "./usePagination";
import { useScrollToTop } from "./useScrollToTop";
import { useCardPreview } from "./useCardPreview";
import { shouldAutoSwitchToSearch } from "../utils/navUtils";

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
  // NOTE: showDeck is intentionally NOT in deps — we only want to react to
  // filter/search changes, not to the deck being opened/closed itself.
  useEffect(() => {
    const { searchTerm: prevSearch, filters: prevFilters } = prevFiltersRef.current;
    if (shouldAutoSwitchToSearch({ showDeck, searchTerm, filters, prevSearchTerm: prevSearch, prevFilters })) {
      setShowDeck(false);
    }
    prevFiltersRef.current = { searchTerm, filters };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

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
    // computed
    hasActiveSearch,
    sidebarProps,
    handleToggleDeckView,
  };
}
