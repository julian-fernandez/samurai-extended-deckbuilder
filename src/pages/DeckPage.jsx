import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "../components/layout";
import DeckPageHeader from "../components/deck/DeckPageHeader";
import { CardSearch } from "../components/features";
import DeckEditor from "../components/deck/DeckEditor";
import { useCards } from "../hooks/useCards";
import { useDeck } from "../hooks/useDeck";
import { useFilters } from "../hooks/useFilters";
import { usePagination } from "../hooks/usePagination";
import { useScrollToTop } from "../hooks/useScrollToTop";
import { useCardPreview } from "../hooks/useCardPreview";
import { clearImageCache } from "../services/imageService";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";

export default function DeckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDeckById } = useSavedDecks();

  const { cards, filteredCards, loading: cardsLoading, uniqueValues, filterCardsData } = useCards();
  const {
    deck, setDeck,
    showImport, setShowImport,
    importText, setImportText,
    missingCards, setMissingCards,
    handleAddToDeck, handleRemoveFromDeck, handleClearDeck,
    handleExportDeck, handleImportDeck,
    deckStats, deckValidation, deckByType, getDeckCount,
  } = useDeck(cards);

  const { searchTerm, setSearchTerm, filters, setFilters, addKeyword, removeKeyword } = useFilters();
  const { currentPage, totalPages, currentCards, handlePageChange } = usePagination(filteredCards);
  const { showScrollToTop, scrollToTop } = useScrollToTop();
  const { hoveredCard, handleCardHover } = useCardPreview();

  const [showDeck, setShowDeck] = useState(true);
  const [deckImageViewMode] = useState("text");
  const [viewMode, setViewMode] = useState("image");
  const [reloadTick, setReloadTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [deckMeta, setDeckMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const prevFiltersRef = useRef({ searchTerm: "", filters: {} });
  const userSwitchedToDeckRef = useRef(false);

  // Load the saved deck once cards are ready
  useEffect(() => {
    if (cardsLoading || cards.length === 0) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await getDeckById(id);
      if (cancelled) return;
      if (error || !data) {
        setLoadError(error || "Deck not found or you don't have access.");
        setInitialLoading(false);
        return;
      }
      setDeckMeta({ name: data.name, description: data.description, isPublic: data.is_public, shareToken: data.share_token });
      setDeck(deserializeDeck(data.cards, cards));
      setInitialLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, cardsLoading, cards.length]);

  useEffect(() => {
    filterCardsData(searchTerm, filters);
  }, [cards, searchTerm, filters, filterCardsData]);

  useEffect(() => {
    if (showDeck && !userSwitchedToDeckRef.current) {
      const filtersChanged =
        searchTerm !== prevFiltersRef.current.searchTerm ||
        JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current.filters);
      if (filtersChanged && (searchTerm || Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== ""))) {
        setShowDeck(false);
      }
    }
    prevFiltersRef.current = { searchTerm, filters };
  }, [searchTerm, filters, showDeck]);

  useEffect(() => {
    if (userSwitchedToDeckRef.current) userSwitchedToDeckRef.current = false;
  }, [searchTerm, filters]);

  const handleToggleDeckView = () => {
    userSwitchedToDeckRef.current = !showDeck;
    setShowDeck(!showDeck);
  };

  const sidebarProps = {
    searchTerm, setSearchTerm, filters, setFilters, addKeyword, removeKeyword,
    uniqueValues, isOpen: sidebarOpen, onToggle: () => setSidebarOpen(!sidebarOpen),
    isCollapsed: sidebarCollapsed, onCollapseToggle: () => setSidebarCollapsed(!sidebarCollapsed),
  };

  if (cardsLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading deck…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-sm mx-4">
          <p className="text-4xl mb-3">⚠️</p>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Deck not found</h1>
          <p className="text-slate-500 text-sm mb-6">{loadError}</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Back to card search
          </Link>
        </div>
      </div>
    );
  }

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
