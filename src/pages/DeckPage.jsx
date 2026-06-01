import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import DeckPageHeader from "../components/deck/DeckPageHeader";
import { CardSearch } from "../components/features";
import DeckEditor from "../components/deck/DeckEditor";
import { useCardSearchPage } from "../hooks/useCardSearchPage";
import { clearImageCache } from "../services/imageCacheService";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";

function DeckLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
        <div className="h-7 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-20" />
        <div className="flex-1" />
        <div className="h-7 bg-gray-200 rounded w-20" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="hidden md:block w-96 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="aspect-[2/3] bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function DeckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDeckById } = useSavedDecks();

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
    viewMode,
    setViewMode,
    reloadTick,
    setReloadTick,
    sidebarProps,
    handleToggleDeckView,
    hasActiveSearch,
  } = useCardSearchPage({ initialShowDeck: true });

  const [deckMeta, setDeckMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (loading || cards.length === 0) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await getDeckById(id);
      if (cancelled) return;
      if (error || !data) {
        setLoadError(error || "Deck not found or you don't have access.");
        setInitialLoading(false);
        return;
      }
      setDeckMeta({
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        shareToken: data.share_token,
      });
      setDeck(deserializeDeck(data.cards, cards));
      setInitialLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, loading, cards.length]);

  // Always render the MainLayout shell — content area shows skeleton or content.
  return (
    <MainLayout sidebarProps={sidebarProps} showScrollToTop={showScrollToTop} onScrollToTop={scrollToTop}>
      <DeckPageHeader
        deckMeta={deckMeta}
        setDeckMeta={setDeckMeta}
        deckId={id}
        deckStats={deckStats}
        showDeck={showDeck}
        onToggleDeckView={handleToggleDeckView}
        deck={deck}
        cards={cards}
        onNavigateAway={() => navigate("/")}
      />

      {loadError ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm">
            <h1 className="text-lg font-bold text-slate-900 mb-2">Deck not found</h1>
            <p className="text-slate-500 text-sm mb-6">{loadError}</p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Back to card search
            </button>
          </div>
        </div>
      ) : loading || initialLoading ? (
        <DeckLoadingSkeleton />
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
        />
      ) : (
        <DeckEditor
          deckMeta={deckMeta}
          setDeckMeta={setDeckMeta}
          deckId={id}
          deck={deck}
          setDeck={setDeck}
          cards={cards}
          deckStats={deckStats}
          deckValidation={deckValidation}
          deckByType={deckByType}
          getDeckCount={getDeckCount}
          handleAddToDeck={handleAddToDeck}
          handleRemoveFromDeck={handleRemoveFromDeck}
          handleClearDeck={handleClearDeck}
          handleExportDeck={handleExportDeck}
          showImport={showImport}
          setShowImport={setShowImport}
          importText={importText}
          setImportText={setImportText}
          handleImportDeck={handleImportDeck}
          missingCards={missingCards}
          setMissingCards={setMissingCards}
          reloadTick={reloadTick}
          setReloadTick={setReloadTick}
          clearImageCache={clearImageCache}
          onCardHover={handleCardHover}
          hoveredCard={hoveredCard}
        />
      )}
    </MainLayout>
  );
}
