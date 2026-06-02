import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";
import { loadCards } from "../services/cardService";
import { getDeckByType, getDeckCount } from "../services/deckService";
import ModernDeckView from "../components/ModernDeckView";
import CardPreview from "../components/deck/CardPreview";
import { MainLayout } from "../components/layout";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SharedDeck() {
  const { token } = useParams();
  const { getDeckByToken } = useSavedDecks();
  const navigate = useNavigate();
  const [deckMeta, setDeckMeta] = useState(null);
  const [deck, setDeck] = useState([]);
  const [deckByTypeData, setDeckByTypeData] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error: fetchError }, cards] = await Promise.all([
        getDeckByToken(token),
        loadCards(),
      ]);
      if (cancelled) return;
      if (fetchError || !data) {
        setError(fetchError || "Deck not found or is private.");
        setLoading(false);
        return;
      }
      const deserialized = deserializeDeck(data.cards, cards);
      setDeckMeta(data);
      setDeck(deserialized);
      setDeckByTypeData(getDeckByType(deserialized));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [token, getDeckByToken]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading deck…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-sm mx-4">
            <h1 className="text-lg font-bold text-gray-900 mb-2">Deck not found</h1>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Go to card search
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const total = deck.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
  const createdAt = deckMeta.created_at
    ? new Date(deckMeta.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Card search
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                {deckMeta.name}
              </h1>
              {deckMeta.description && (
                <p className="text-gray-600 mt-1 text-sm">{deckMeta.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {total} cards{createdAt ? ` · ${createdAt}` : ""}
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/", {
                  state: {
                    importDeck: deck.map((c) => ({ cardId: c.id, quantity: c.quantity ?? 1 })),
                    importDeckName: deckMeta.name,
                  },
                })
              }
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Open in builder ↗
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-4 items-start">

          {/* Left: deck list */}
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

          {/* Right: sticky card preview */}
          <div className="w-72 flex-shrink-0 hidden md:block">
            <div className="sticky top-4 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4">
              <CardPreview card={hoveredCard} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Shared via L5R Samurai Extended Card Search
        </p>
      </div>
    </MainLayout>
  );
}
