import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSavedDecks } from "../../hooks/useSavedDecks";
import SaveDeckModal from "./SaveDeckModal";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyLinkButton({ deck }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/share/${deck.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!deck.share_token) return null;

  return (
    <button
      onClick={handleCopy}
      title="Copy share link"
      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-xs"
    >
      {copied ? "✓ Copied" : "🔗 Share"}
    </button>
  );
}

export default function SavedDecksList({ onLoadDeck, cards, onClose }) {
  const navigate = useNavigate();
  const { decks, loading, error, listDecks, deleteDeck, togglePublic, updateDeck } =
    useSavedDecks();
  const [editingDeck, setEditingDeck] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    listDecks();
  }, [listDecks]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deck? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteDeck(id);
    setDeletingId(null);
  };

  const handleTogglePublic = async (deck) => {
    await togglePublic(deck.id, deck.is_public);
    if (!deck.is_public) {
      // newly made public — share_token will be set by the DB trigger/default
    }
  };

  const handleLoad = (deck) => {
    // Navigate to the deck's own edit page
    navigate(`/deck/${deck.id}`);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <aside className="h-full w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">My Decks</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <p className="text-center text-sm text-gray-500 py-8">Loading…</p>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {!loading && decks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No saved decks yet.</p>
                <p className="text-gray-400 text-xs mt-1">Build a deck and click Save.</p>
              </div>
            )}

            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{deck.name}</p>
                    {deck.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {deck.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(deck.updated_at)}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      deck.is_public
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {deck.is_public ? "Public" : "Private"}
                  </span>
                </div>

                {/* Card count */}
                <p className="text-xs text-gray-500">
                  {deck.cards?.reduce((acc, c) => acc + (c.quantity ?? 1), 0) ?? 0} cards
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    onClick={() => handleLoad(deck)}
                    className="flex-1 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setEditingDeck(deck)}
                    className="px-2 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublic(deck)}
                    className="px-2 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title={deck.is_public ? "Make private" : "Make public"}
                  >
                    {deck.is_public ? "🔒" : "🌐"}
                  </button>
                  {deck.is_public && deck.share_token && (
                    <CopyLinkButton deck={deck} />
                  )}
                  <button
                    onClick={() => handleDelete(deck.id)}
                    disabled={deletingId === deck.id}
                    className="px-2 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {deletingId === deck.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {editingDeck && (
        <SaveDeckModal
          existingDeck={editingDeck}
          onSave={async ({ name, description, isPublic }) =>
            updateDeck({ id: editingDeck.id, name, description, isPublic })
          }
          onClose={() => setEditingDeck(null)}
        />
      )}
    </>
  );
}
