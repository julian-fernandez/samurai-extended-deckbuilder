import { useState } from "react";
import { Link } from "react-router-dom";
import { useSavedDecks } from "../../hooks/useSavedDecks";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";

export default function DeckPageHeader({
  deckMeta, setDeckMeta, deckId,
  deckStats, showDeck, onToggleDeckView,
  deck, cards, onNavigateAway,
}) {
  const { user, signOut } = useAuth();
  const { updateDeck } = useSavedDecks();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(deckMeta?.name ?? "");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNameSave = async () => {
    if (!nameValue.trim()) return;
    setDeckMeta((prev) => ({ ...prev, name: nameValue.trim() }));
    setEditingName(false);
    if (deckId) {
      await updateDeck({ id: deckId, name: nameValue.trim() });
    }
  };

  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div className="flex flex-col gap-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Card Search</Link>
          <span>/</span>
          <button onClick={() => {}} className="hover:text-slate-600">My Decks</button>
          <span>/</span>
          <span className="text-slate-600">{deckMeta?.name ?? "Deck"}</span>
        </nav>

        {/* Deck name (editable) */}
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); if (e.key === "Escape") setEditingName(false); }}
              className="text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 bg-transparent outline-none w-80"
            />
            <button onClick={handleNameSave} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Save</button>
            <button onClick={() => setEditingName(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => { setNameValue(deckMeta?.name ?? ""); setEditingName(true); }}
            className="group flex items-center gap-2 text-left"
            title="Click to rename"
          >
            <h1 className="text-3xl font-bold text-slate-900">{deckMeta?.name ?? "Untitled Deck"}</h1>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {deckMeta?.description && (
          <p className="text-sm text-slate-500">{deckMeta.description}</p>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {user ? (
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
              title={user.email}
            >
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </span>
            <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-sm px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign in
          </button>
        )}

        <button
          onClick={onToggleDeckView}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          {showDeck ? "Card Search" : "Deck View"} ({deckStats.total})
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
