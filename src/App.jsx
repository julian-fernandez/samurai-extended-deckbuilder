import { useState, useEffect, useRef } from "react";
import { Routes, Route, Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "./components/layout";
import { CardSearch, DeckBuilder } from "./components/features";
import { useCardSearchPage } from "./hooks/useCardSearchPage";
import { clearImageCache } from "./services/imageCacheService";
import { deserializeDeck } from "./hooks/useSavedDecks";
import DeckPage from "./pages/DeckPage.jsx";
import CardPage from "./pages/CardPage.jsx";
import MyDecksPage from "./pages/MyDecksPage.jsx";
import BrowseDecks from "./pages/BrowseDecks.jsx";

/**
 * Persistent layout wrapper rendered by the layout route.
 * Stays mounted while child routes swap — preserves sidebar state and focus.
 */
function AppShell({ sidebarProps, showScrollToTop, onScrollToTop, deckCount }) {
  return (
    <MainLayout
      sidebarProps={sidebarProps}
      showScrollToTop={showScrollToTop}
      onScrollToTop={onScrollToTop}
      deckCount={deckCount}
    >
      <Outlet />
    </MainLayout>
  );
}

function AppMain() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // showDeck is derived directly from the URL — no local state, no effects, no flicker.
  const showDeck = searchParams.has("deck");

  const {
    cards,
    filteredCards,
    loading,
    deck,
    setDeck,
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
    currentPage,
    totalPages,
    currentCards,
    handlePageChange,
    showScrollToTop,
    scrollToTop,
    hoveredCard,
    handleCardHover,
    searchTerm,
    filters,
    viewMode,
    setViewMode,
    reloadTick,
    setReloadTick,
    sidebarProps,
    hasActiveSearch,
  } = useCardSearchPage({ initialShowDeck: false });

  const handleCardClick = (card) => navigate(`/card/${card.id}`);
  const [deckImageViewMode, setDeckImageViewMode] = useState("image");

  // Auto-navigate to Browse Cards whenever search/filters change from any other page.
  // First call initialises the ref so we don't navigate on mount.
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = { searchTerm, filters };
      return;
    }
    const { searchTerm: prevSearch, filters: prevFilters } = prevFiltersRef.current;
    const changed =
      searchTerm !== prevSearch ||
      JSON.stringify(filters) !== JSON.stringify(prevFilters);
    prevFiltersRef.current = { searchTerm, filters };

    if (changed && (location.pathname !== "/" || showDeck)) {
      navigate("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  // Handle importDeck router state (e.g. loading a shared deck into the builder).
  const processedNavKeyRef = useRef(null);
  useEffect(() => {
    if (location.key === processedNavKeyRef.current) return;
    processedNavKeyRef.current = location.key;

    const { importDeck } = location.state ?? {};
    if (!importDeck) return;

    if (!loading && cards.length > 0) {
      setDeck(deserializeDeck(importDeck, cards));
      navigate("/?deck", { replace: true, state: {} });
    }
  }, [location.key, location.state, loading, cards.length]);

  // Finish importing once cards are available (cold-load case).
  useEffect(() => {
    if (loading || cards.length === 0) return;
    const { importDeck } = location.state ?? {};
    if (!importDeck) return;
    setDeck(deserializeDeck(importDeck, cards));
    navigate("/?deck", { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cards.length]);

  const shellProps = {
    sidebarProps,
    showScrollToTop,
    onScrollToTop: scrollToTop,
    deckCount: deckStats.total,
  };

  const homeContent = loading ? (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-lg text-gray-500">Loading cards…</p>
      </div>
    </div>
  ) : !showDeck ? (
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
      hasActiveSearch={hasActiveSearch}
      onCardClick={handleCardClick}
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
      setDeck={setDeck}
      cards={cards}
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
      onAfterSave={(id) => navigate(`/deck/${id}`)}
    />
  );

  return (
    <Routes>
      {/* Deck page manages its own layout (owner gets editor, others get read-only view) */}
      <Route path="/deck/:id" element={<DeckPage />} />

      {/* Persistent layout — sidebar stays mounted across all child routes */}
      <Route element={<AppShell {...shellProps} />}>
        <Route path="/card/:id" element={<CardPage />} />
        <Route path="/my-decks" element={<MyDecksPage />} />
        <Route path="/browse" element={<BrowseDecks />} />
        <Route path="*" element={homeContent} />
      </Route>
    </Routes>
  );
}

export default AppMain;
