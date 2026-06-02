import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "../components/layout";
import ModernDeckView from "../components/ModernDeckView";
import CardPreview from "../components/deck/CardPreview";
import { useCards } from "../hooks/useCards";
import { useAuth } from "../hooks/useAuth";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";
import { getDeckByType, getDeckCount } from "../services/deckService";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded-xl w-64" />
      <div className="flex gap-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
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

export default function DeckPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, loading: cardsLoading } = useCards();
  const { getDeckById, duplicateDeck } = useSavedDecks();

  const [deckMeta, setDeckMeta] = useState(null);
  const [deck, setDeck] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (cardsLoading || cards.length === 0) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await getDeckById(id);
      if (cancelled) return;
      if (error || !data) {
        setLoadError(error || "Deck not found.");
        setLoading(false);
        return;
      }
      setIsOwner(!!user && data.user_id === user.id);
      setDeckMeta({
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      setDeck(deserializeDeck(data.cards, cards));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, cardsLoading, cards.length, user?.id]);

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
    <MainLayout>
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
      ) : loading ? (
        <LoadingSkeleton />
      ) : (
        <div>
          {/* ── Header ── */}
          <div className="mb-6">
            <Link
              to={isOwner ? "/my-decks" : "/browse"}
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors"
            >
              ← {isOwner ? "My Decks" : "Browse Decks"}
            </Link>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {deckMeta?.name ?? "Deck"}
                </h1>
                {deckMeta?.description && (
                  <p className="text-slate-500 mt-1 text-sm">{deckMeta.description}</p>
                )}
                <p className="text-slate-400 text-xs mt-1">
                  {total} cards{createdAt ? ` · ${createdAt}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwner ? (
                  <button
                    onClick={() =>
                      navigate("/", {
                        state: {
                          importDeck: deck.map((c) => ({ cardId: c.id, quantity: c.quantity ?? 1 })),
                          importDeckName: deckMeta?.name,
                        },
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    Edit in Deckbuilder
                  </button>
                ) : user ? (
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition-colors"
                  >
                    {duplicating ? "Duplicating…" : "Duplicate to my decks"}
                  </button>
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    Sign in to duplicate
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Deck content ── */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm px-3 py-3">
              {deckByTypeData && (
                <ModernDeckView
                  deckByType={deckByTypeData}
                  deck={deck}
                  getDeckCount={(d, cardId) => getDeckCount(d, cardId)}
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
      )}
    </MainLayout>
  );
}
