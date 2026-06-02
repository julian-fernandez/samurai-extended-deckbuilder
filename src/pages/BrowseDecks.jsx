import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSavedDecks } from "../hooks/useSavedDecks";
import { loadCards } from "../services/cardService";

const CLANS = [
  "crab", "crane", "dragon", "lion", "phoenix",
  "scorpion", "unicorn", "mantis", "naga", "shadowlands",
];

const CLAN_COLORS = {
  crab: "bg-blue-600",
  crane: "bg-blue-400",
  dragon: "bg-green-600",
  lion: "bg-yellow-500",
  phoenix: "bg-red-500",
  scorpion: "bg-red-800",
  unicorn: "bg-indigo-500",
  mantis: "bg-green-400",
  naga: "bg-emerald-500",
  shadowlands: "bg-gray-800",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Derive clan from a deck's serialized cards array using the full cards map.
 * Finds the Stronghold entry and reads its clan.
 */
function deriveClан(deckCards, cardMap) {
  if (!deckCards) return null;
  for (const { cardId } of deckCards) {
    const card = cardMap[cardId];
    if (!card) continue;
    const t = Array.isArray(card.type) ? card.type[0] : card.type;
    if (t?.toLowerCase() === "stronghold") {
      const clan = card.clan;
      return (Array.isArray(clan) ? clan[0] : clan) ?? null;
    }
  }
  return null;
}

export default function BrowseDecks() {
  const navigate = useNavigate();
  const { listPublicDecks } = useSavedDecks();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClan, setSelectedClan] = useState("");
  // cardMap is only needed for fallback clan derivation on old rows.
  const [cardMap, setCardMap] = useState(null);

  // Load cards for fallback clan derivation (runs once).
  useEffect(() => {
    loadCards().then((cards) => {
      setCardMap(Object.fromEntries(cards.map((c) => [c.id, c])));
    });
  }, []);

  const fetchDecks = useCallback(
    async (clan) => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await listPublicDecks(clan ? { clan } : {});
      if (fetchError) {
        setError(fetchError);
      } else {
        setDecks(data);
      }
      setLoading(false);
    },
    [listPublicDecks]
  );

  useEffect(() => {
    fetchDecks(selectedClan);
  }, [selectedClan, fetchDecks]);


  // For a deck with no stored clan, try to derive it from the stronghold.
  const resolveClan = (deck) => {
    if (deck.clan) return deck.clan;
    if (cardMap) return deriveClан(deck.cards, cardMap);
    return null;
  };

  const displayedDecks = selectedClan
    ? decks.filter((d) => {
        const clan = resolveClan(d);
        return clan?.toLowerCase() === selectedClan;
      })
    : decks;

  return (
    <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Decks</h2>
        <p className="text-gray-500 text-sm mb-6">Public decks shared by the community.</p>

        {/* Clan filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedClan("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedClan === ""
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Clans
          </button>
          {CLANS.map((clan) => (
            <button
              key={clan}
              onClick={() => setSelectedClan(selectedClan === clan ? "" : clan)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                selectedClan === clan
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {clan}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-32" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        ) : displayedDecks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-gray-400">No public decks found{selectedClan ? ` for ${selectedClan}` : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedDecks.map((deck) => {
              const clan = resolveClan(deck);
              const cardCount = deck.cards?.reduce((acc, c) => acc + (c.quantity ?? 1), 0) ?? 0;
              return (
                <div
                  key={deck.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 leading-tight">{deck.name}</p>
                    {clan && (
                      <span
                        className={`flex-shrink-0 text-xs text-white px-2 py-0.5 rounded capitalize ${
                          CLAN_COLORS[clan.toLowerCase()] ?? "bg-gray-500"
                        }`}
                      >
                        {clan}
                      </span>
                    )}
                  </div>

                  {deck.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{deck.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{cardCount} cards</span>
                    <span>·</span>
                    <span>{formatDate(deck.created_at)}</span>
                  </div>

                  {deck.share_token && (
                    <button
                      onClick={() => navigate(`/share/${deck.share_token}`)}
                      className="mt-auto py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View deck
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
