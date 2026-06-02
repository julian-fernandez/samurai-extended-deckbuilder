import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import DeckPageHeader from "../components/deck/DeckPageHeader";
import { CardSearch } from "../components/features";
import DeckEditor from "../components/deck/DeckEditor";
import ModernDeckView from "../components/ModernDeckView";
import CardPreview from "../components/deck/CardPreview";
import { useCardSearchPage } from "../hooks/useCardSearchPage";
import { useAuth } from "../hooks/useAuth";
import { clearImageCache } from "../services/imageCacheService";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";
import { getDeckByType, getDeckCount } from "../services/deckService";

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
        <div className="hidden md:block w-64 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="aspect-[2/3] bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Read-only view for visitors who don't own this deck ───────────────────────
function ReadOnlyDeckView({ deckMeta, deck, onDuplicate, duplicating }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const deckByTypeData = getDeckByType(deck);
  const total = deck.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
  const createdAt = deckMeta?.created_at
    ? new Date(deckMeta.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              {deckMeta?.name ?? "Deck"}
            </h1>
            {deckMeta?.description && (
              <p className="text-slate-600 mt-1 text-sm">{deckMeta.description}</p>
            )}
            <p className="text-slate-400 text-xs mt-1">
              {total} cards{createdAt ? ` · ${createdAt}` : ""}
            </p>
          </div>

          {onDuplicate ? (
            <button
              onClick={onDuplicate}
              disabled={duplicating}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition-colors"
            >
              {duplicating ? "Duplicating…" : "Duplicate to my decks"}
            </button>
          ) : (
            <span className="flex-shrink-0 text-sm text-slate-400 italic">
              Sign in to duplicate this deck
            </span>
          )}
        </div>
      </div>

      {/* ── Deck list + card preview ── */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm px-3 py-3">
          {deckByTypeData && (
            <ModernDeckView
              deckByType={deckByTypeData}
              deck={deck}
              getDeckCount={(d, id) => getDeckCount(d, id)}
              handleAddToDeck={() => {}}
              handleRemoveFromDeck={() => {}}
              onCardHover={setHoveredCard}
              readOnly
            />
          )}
        </div>

        <div className="w-64 flex-shrink-0 hidden md:block">
          <div className="sticky top-4 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4">
            <CardPreview card={hoveredCard} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDeckById, duplicateDeck } = useSavedDecks();

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
    getDeckCount: getDeckCountHook,
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
  const [isOwner, setIsOwner] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (loading || cards.length === 0) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await getDeckById(id);
      if (cancelled) return;
      if (error || !data) {
        setLoadError(error || "Deck not found.");
        setInitialLoading(false);
        return;
      }
      setIsOwner(!!user && data.user_id === user.id);
      setDeckMeta({
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        shareToken: data.share_token,
        userId: data.user_id,
        created_at: data.created_at,
      });
      setDeck(deserializeDeck(data.cards, cards));
      setInitialLoading(false);
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loading, cards.length, user?.id]);

  async function handleDuplicate() {
    setDuplicating(true);
    const { data, error } = await duplicateDeck(id);
    setDuplicating(false);
    if (error) {
      alert(`Could not duplicate deck: ${error}`);
      return;
    }
    navigate(`/deck/${data.id}`);
  }

  const isLoading = loading || initialLoading;

  // Pass the sidebar only to owners (it's for card searching while building a deck)
  const layoutSidebarProps = isOwner ? sidebarProps : undefined;

  return (
    <MainLayout
      sidebarProps={layoutSidebarProps}
      showScrollToTop={showScrollToTop}
      onScrollToTop={scrollToTop}
    >
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
      ) : isLoading ? (
        <DeckLoadingSkeleton />
      ) : isOwner ? (
        <>
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
              getDeckCount={getDeckCountHook}
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
              getDeckCount={getDeckCountHook}
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
        </>
      ) : (
        <ReadOnlyDeckView
          deckMeta={deckMeta}
          deck={deck}
          deckId={id}
          onDuplicate={user ? handleDuplicate : null}
          duplicating={duplicating}
        />
      )}
    </MainLayout>
  );
}
