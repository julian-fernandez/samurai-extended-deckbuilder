import { useState, useEffect, useRef } from "react";
import { MainLayout, Header } from "./components/layout";
import { CardSearch, DeckBuilder } from "./components/features";
import { useCards } from "./hooks/useCards";
import { useDeck } from "./hooks/useDeck";
import { useFilters } from "./hooks/useFilters";
import { usePagination } from "./hooks/usePagination";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { useCardPreview } from "./hooks/useCardPreview";
import { clearImageCache } from "./services/imageService";
import "./App.css";

function App() {
  // Custom hooks
  const { cards, filteredCards, loading, uniqueValues, filterCardsData } =
    useCards();
  const {
    deck,
    showImport,
    setShowImport,
    importText,
    setImportText,
    missingCards,
    setMissingCards,
    handleAddToDeck,
    handleRemoveFromDeck,
    handleClearDeck,
    handleExportDeck,
    handleImportDeck,
    deckStats,
    deckValidation,
    deckByType,
    getDeckCount,
  } = useDeck(cards);
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
  } = useFilters();
  const { currentPage, totalPages, currentCards, handlePageChange } =
    usePagination(filteredCards);
  const { showScrollToTop, scrollToTop } = useScrollToTop();
  const { hoveredCard, handleCardHover } = useCardPreview();

  // Local state
  const [showDeck, setShowDeck] = useState(false);
  const [deckImageViewMode, setDeckImageViewMode] = useState("image");
  const [viewMode, setViewMode] = useState("image");
  const [reloadTick, setReloadTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Refs for tracking user interactions
  const prevFiltersRef = useRef({ searchTerm: "", filters: {} });
  const userSwitchedToDeckRef = useRef(false);

  // Filter cards when dependencies change
  useEffect(() => {
    filterCardsData(searchTerm, filters);
  }, [cards, searchTerm, filters, filterCardsData]);

  // Switch to search view when filters change in deck view (but not when user manually switches to deck)
  useEffect(() => {
    if (showDeck && !userSwitchedToDeckRef.current) {
      // Check if filters actually changed (not just on initial load)
      const filtersChanged =
        searchTerm !== prevFiltersRef.current.searchTerm ||
        JSON.stringify(filters) !==
          JSON.stringify(prevFiltersRef.current.filters);

      if (
        filtersChanged &&
        (searchTerm ||
          Object.values(filters).some((value) =>
            Array.isArray(value) ? value.length > 0 : value !== ""
          ))
      ) {
        setShowDeck(false);
      }
    }

    // Update previous filters
    prevFiltersRef.current = { searchTerm, filters };
  }, [searchTerm, filters, showDeck]);

  // Reset the user switch flag when filters actually change
  useEffect(() => {
    if (userSwitchedToDeckRef.current) {
      userSwitchedToDeckRef.current = false;
    }
  }, [searchTerm, filters]);

  const handleToggleDeckView = () => {
    if (!showDeck) {
      userSwitchedToDeckRef.current = true;
    } else {
      userSwitchedToDeckRef.current = false;
    }
    setShowDeck(!showDeck);
  };

  const sidebarProps = {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
    uniqueValues,
    isOpen: sidebarOpen,
    onToggle: () => setSidebarOpen(!sidebarOpen),
    isCollapsed: sidebarCollapsed,
    onCollapseToggle: () => setSidebarCollapsed(!sidebarCollapsed),
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      sidebarProps={sidebarProps}
      showScrollToTop={showScrollToTop}
      onScrollToTop={scrollToTop}
    >
      <Header
        deckStats={deckStats}
        showDeck={showDeck}
        onToggleDeckView={handleToggleDeckView}
      />

      {!showDeck ? (
        <CardSearch
          currentCards={currentCards}
          filteredCards={filteredCards}
          currentPage={currentPage}
          totalPages={totalPages}
          viewMode={viewMode}
          setViewMode={setViewMode}
          reloadTick={reloadTick}
          setReloadTick={setReloadTick}
          clearImageCache={clearImageCache}
          deck={deck}
          getDeckCount={getDeckCount}
          handleAddToDeck={handleAddToDeck}
          handleRemoveFromDeck={handleRemoveFromDeck}
          handlePageChange={handlePageChange}
        />
      ) : (
        <DeckBuilder
          deckImageViewMode={deckImageViewMode}
          setDeckImageViewMode={setDeckImageViewMode}
          reloadTick={reloadTick}
          setReloadTick={setReloadTick}
          clearImageCache={clearImageCache}
          handleExportDeck={handleExportDeck}
          showImport={showImport}
          setShowImport={setShowImport}
          handleClearDeck={handleClearDeck}
          deckStats={deckStats}
          deck={deck}
          importText={importText}
          setImportText={setImportText}
          handleImportDeck={handleImportDeck}
          missingCards={missingCards}
          setMissingCards={setMissingCards}
          deckValidation={deckValidation}
          deckByType={deckByType}
          getDeckCount={getDeckCount}
          handleAddToDeck={handleAddToDeck}
          handleRemoveFromDeck={handleRemoveFromDeck}
          onCardHover={handleCardHover}
          hoveredCard={hoveredCard}
        />
      )}
    </MainLayout>
  );
}

export default App;
