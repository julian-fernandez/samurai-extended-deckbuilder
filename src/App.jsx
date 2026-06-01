import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { MainLayout, Header } from "./components/layout";
import { CardSearch, DeckBuilder } from "./components/features";
import { useCardSearchPage } from "./hooks/useCardSearchPage";
import { clearImageCache } from "./services/imageCacheService";
import { deserializeDeck } from "./hooks/useSavedDecks";
import MobileNav from "./components/MobileNav.jsx";
import SharedDeck from "./pages/SharedDeck.jsx";
import DeckPage from "./pages/DeckPage.jsx";

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
    sidebarOpen,
    setSidebarOpen,
    sidebarProps,
    handleToggleDeckView,
  } = useCardSearchPage({ initialShowDeck: false });

  // App-specific state not shared with DeckPage
  const [deckImageViewMode, setDeckImageViewMode] = useState("image");

  // Pre-load a deck passed via router state (e.g. from the shared deck view)
  useEffect(() => {
    if (loading || cards.length === 0) return;
    const { importDeck } = location.state ?? {};
    if (!importDeck) return;
    setDeck(deserializeDeck(importDeck, cards));
    setShowDeck(true);
    // Clear state so a back-navigation doesn't re-import
    navigate(location.pathname, { replace: true, state: {} });
  }, [loading, cards.length, location]);

  // Mobile tab: "search" | "deck" | "filters"
  const mobileTab = showDeck ? "deck" : "search";
  const handleMobileTab = (tab) => {
    if (tab === "filters") {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
      setShowDeck(tab === "deck");
    }
  };

  if (loading) {
    return (
      <Routes>
        <Route path="/share/:token" element={<SharedDeck />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
    >
      <MobileNav
        activeTab={sidebarOpen ? "filters" : mobileTab}
        onTabChange={handleMobileTab}
        deckCount={deckStats.total}
      />
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
      <Route path="*" element={mainApp} />
    </Routes>
  );
}

export default AppMain;
