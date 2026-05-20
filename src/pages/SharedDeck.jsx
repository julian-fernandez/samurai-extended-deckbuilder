import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";
import { loadCards } from "../services/cardService";
import { getDeckByType, getDeckCount } from "../services/deckService";
import { findCardImage } from "../services/imageService";
import ModernDeckView from "../components/ModernDeckView";

// ─── Read-only card preview ───────────────────────────────────────────────────
function CardPreview({ card }) {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        <p className="text-xs text-center">Hover a card<br/>to preview</p>
      </div>
    );
  }

  const imageSrc = findCardImage(card);

  return (
    <div className="space-y-3">
      {imageSrc && (
        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <img
            src={imageSrc}
            alt={card.name}
            className="w-full h-auto"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}
      <div className="space-y-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight">{card.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{card.type}</span>
            {card.clan && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{card.clan}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          {card.cost && card.cost !== "0" && <span>Cost: <strong className="text-slate-700">{card.cost}</strong></span>}
          {card.force && card.force !== "0" && <span>Force: <strong className="text-slate-700">{card.force}</strong></span>}
          {card.chi && card.chi !== "0" && <span>Chi: <strong className="text-slate-700">{card.chi}</strong></span>}
        </div>
        {card.text && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-6 border-t border-slate-100 pt-2">
            {card.text.replace(/<[^>]*>/g, "")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SharedDeck() {
  const { token } = useParams();
  const { getDeckByToken } = useSavedDecks();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading deck…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-sm mx-4">
          <p className="text-2xl mb-2">🔒</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Deck not found</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold"
          >
            Go to card search
          </Link>
        </div>
      </div>
    );
  }

  const total = deck.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
  const createdAt = deckMeta.created_at
    ? new Date(deckMeta.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">

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
            <Link
              to="/"
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              Open builder ↗
            </Link>
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
    </div>
  );
}
