import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSavedDecks } from "../hooks/useSavedDecks";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "../components/auth/AuthModal";
import SaveDeckModal from "../components/deck/SaveDeckModal";

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
    const url = `${window.location.origin}/deck/${deck.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!deck.is_public) return null;

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

export default function MyDecksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { decks, loading, error, listDecks, deleteDeck, togglePublic, updateDeck } = useSavedDecks();
  const [editingDeck, setEditingDeck] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user) listDecks();
  }, [user, listDecks]);


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deck? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteDeck(id);
    setDeletingId(null);
  };

  const handleTogglePublic = async (deck) => {
    await togglePublic(deck.id, deck.is_public);
  };

  return (
    <>
    <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Decks</h2>

        {!user ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Sign in to view and manage your saved decks.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Sign in
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-24" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        ) : decks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-gray-400 mb-2">No saved decks yet.</p>
            <p className="text-gray-400 text-sm mb-6">Build a deck and click Save.</p>
            <button
              onClick={() => navigate("/?deck=open")}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Open Deckbuilder
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{deck.name}</p>
                    {deck.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{deck.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(deck.updated_at)}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      deck.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {deck.is_public ? "Public" : "Private"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{deck.cards?.reduce((acc, c) => acc + (c.quantity ?? 1), 0) ?? 0} cards</span>
                  {deck.clan && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{deck.clan}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/deck/${deck.id}`)}
                    className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setEditingDeck(deck)}
                    className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublic(deck)}
                    className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    title={deck.is_public ? "Make private" : "Make public"}
                  >
                    {deck.is_public ? "Make private" : "Make public"}
                  </button>
                  {deck.is_public && (
                    <CopyLinkButton deck={deck} />
                  )}
                  <button
                    onClick={() => handleDelete(deck.id)}
                    disabled={deletingId === deck.id}
                    className="px-2.5 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === deck.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
