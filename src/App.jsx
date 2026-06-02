import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "./components/layout";
import Header from "./components/layout/Header";
import { CardSearch, DeckBuilder } from "./components/features";
import { useCardSearchPage } from "./hooks/useCardSearchPage";
import { clearImageCache } from "./services/imageCacheService";
import { deserializeDeck } from "./hooks/useSavedDecks";
import SharedDeck from "./pages/SharedDeck.jsx";
import DeckPage from "./pages/DeckPage.jsx";
import CardPage from "./pages/CardPage.jsx";
import MyDecksPage from "./pages/MyDecksPage.jsx";
import BrowseDecks from "./pages/BrowseDecks.jsx";

function AppMain() {
  const navigate = useNavigate();
  const location = useLocation();

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
    showDeck,
    setShowDeck,
    viewMode,
    setViewMode,
    reloadTick,
    setReloadTick,
    sidebarProps,
    hasActiveSearch,
  } = useCardSearchPage({ initialShowDeck: false });

  const handleCardClick = (card) => navigate(`/card/${card.id}`);

  const [deckImageViewMode, setDeckImageViewMode] = useState("image");

  // Open deck panel when navigating via ?deck=open (Deckbuilder nav button).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("deck") === "open") {
      setShowDeck(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  // Pre-load a deck passed via router state (e.g. from the shared deck view).
  useEffect(() => {
    if (loading || cards.length === 0) return;
    const { importDeck } = location.state ?? {};
    if (!importDeck) return;
    setDeck(deserializeDeck(importDeck, cards));
    setShowDeck(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [loading, cards.length, location]);

  if (loading) {
    return (
      <Routes>
        <Route path="/share/:token" element={<SharedDeck />} />
        <Route path="/card/:id" element={<CardPage />} />
        <Route path="/my-decks" element={<MyDecksPage />} />
        <Route path="/browse" element={<BrowseDecks />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Loading cards...</p>
              </div>
            </div>
          }
        />
      </Routes>
    );
  }

  const mainApp = (
    <MainLayout
      sidebarProps={sidebarProps}
      showScrollToTop={showScrollToTop}
      onScrollToTop={scrollToTop}
      isDeckView={showDeck}
      deckCount={deckStats.total}
      onSetDeckView={setShowDeck}
    >
      <Header onBrowseCards={() => setShowDeck(false)} />

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
      )}
    </MainLayout>
  );

  return (
    <Routes>
      <Route path="/share/:token" element={<SharedDeck />} />
      <Route path="/deck/:id" element={<DeckPage />} />
      <Route path="/card/:id" element={<CardPage />} />
      <Route path="/my-decks" element={<MyDecksPage />} />
      <Route path="/browse" element={<BrowseDecks />} />
      <Route path="*" element={mainApp} />
    </Routes>
  );
}

export default AppMain;
