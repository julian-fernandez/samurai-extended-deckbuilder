import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSavedDecks, deserializeDeck } from "../hooks/useSavedDecks";
import { loadCards } from "../services/cardService";

function groupByType(deck) {
  const groups = {};
  for (const card of deck) {
    const t = card.deck || card.type || "Other";
    if (!groups[t]) groups[t] = [];
    groups[t].push(card);
  }
  return groups;
}

export default function SharedDeck() {
  const { token } = useParams();
  const { getDeckByToken } = useSavedDecks();
  const [deckMeta, setDeckMeta] = useState(null);
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error }, cards] = await Promise.all([
        getDeckByToken(token),
        loadCards(),
      ]);
      if (cancelled) return;
      if (error || !data) {
        setError(error || "Deck not found or is private.");
        setLoading(false);
        return;
      }
      setDeckMeta(data);
      setDeck(deserializeDeck(data.cards, cards));
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

  const groups = groupByType(deck);
  const total = deck.reduce((sum, c) => sum + (c.quantity ?? 1), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Card search
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {deckMeta.name}
          </h1>
          {deckMeta.description && (
            <p className="text-gray-600 mt-2">{deckMeta.description}</p>
          )}
          <p className="text-gray-400 text-sm mt-1">{total} cards total</p>
        </div>

        {/* Deck sections */}
        <div className="space-y-4">
          {Object.entries(groups).map(([type, cards]) => {
            const sectionTotal = cards.reduce((s, c) => s + (c.quantity ?? 1), 0);
            return (
              <div
                key={type}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-800 capitalize">
                    {type} ({sectionTotal} cards, {cards.length} unique)
                  </h2>
                </div>
                <ul className="divide-y divide-gray-100">
                  {cards.map((card) => (
                    <li key={card.id} className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-sm text-gray-900 font-medium">{card.name}</span>
                      <div className="flex items-center gap-3">
                        {card.clan && (
                          <span className="text-xs text-gray-400">{card.clan}</span>
                        )}
                        <span className="text-sm font-bold text-blue-700 min-w-[1.5rem] text-right">
                          ×{card.quantity ?? 1}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Shared via L5R Samurai Extended Card Search
        </p>
      </div>
    </div>
  );
}
