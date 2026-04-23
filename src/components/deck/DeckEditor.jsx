import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModernDeckView from "../ModernDeckView";
import SharePanel from "./SharePanel";
import { useSavedDecks, deserializeDeck } from "../../hooks/useSavedDecks";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";
import SaveDeckModal from "./SaveDeckModal";
import SavedDecksList from "./SavedDecksList";
import { clearAllCaches, findCardImage } from "../../services/imageService";
import { DECK_RULES } from "../../constants/index.js";

// ─── Tiny Stat Badge ───────────────────────────────────────────────────────────
function StatBadge({ label, count, min }) {
  const ok = count >= min;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
      ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
    }`}>
      <span className="hidden sm:inline text-xs font-medium opacity-70">{label}</span>
      <span className="font-mono">{count}/{min}</span>
    </div>
  );
}

// ─── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ importText, setImportText, onImport, onClose, missingCards, setMissingCards }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Import deck list</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>

        <div className="p-5 space-y-3">
          {missingCards.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Cards not found in Samurai Extended:</p>
              <ul className="text-xs text-amber-600 space-y-0.5">
                {missingCards.map((c, i) => <li key={i}>• {c.quantity}× {c.name}</li>)}
              </ul>
              <button onClick={() => setMissingCards([])} className="mt-2 text-xs text-amber-700 underline">Dismiss</button>
            </div>
          )}

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"Paste deck list, one card per line:\n3x Doji Diplomat\n2x Political Rival\n..."}
            className="w-full h-48 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none font-mono"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Import
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card Preview Panel ────────────────────────────────────────────────────────
function CardPreview({ card, getDeckCount, deck, handleAddToDeck, handleRemoveFromDeck }) {
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

  const count = getDeckCount(deck, card.id);
  const imageSrc = findCardImage(card);

  return (
    <div className="space-y-3">
      {/* Image */}
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

      {/* Card details */}
      <div className="space-y-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight">{card.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{card.type}</span>
            {card.clan && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{card.clan}</span>}
          </div>
        </div>

        {/* Stats row */}
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

      {/* Add/remove */}
      <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-100">
        <button
          onClick={() => handleRemoveFromDeck(card.id)}
          disabled={count === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
        >
          −
        </button>
        <span className="text-sm font-bold text-slate-700 w-6 text-center">{count}</span>
        <button
          onClick={() => handleAddToDeck(card)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main DeckEditor ───────────────────────────────────────────────────────────
export default function DeckEditor({
  // deck state
  deck, setDeck, cards,
  deckStats, deckValidation, deckByType, getDeckCount,
  handleAddToDeck, handleRemoveFromDeck, handleClearDeck, handleExportDeck,
  // import
  showImport, setShowImport, importText, setImportText, handleImportDeck,
  missingCards, setMissingCards,
  // card preview
  onCardHover, hoveredCard,
  // persistence (optional — absent means "new unsaved deck")
  deckMeta, setDeckMeta, deckId,
  // callbacks
  onAfterSave,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveDeck, updateDeck } = useSavedDecks();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMyDecks, setShowMyDecks] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const shareRef = useRef(null);

  const isSaved = !!deckId;
  const isValid = deckValidation.errors.length === 0;

  // ── Save / Update ──────────────────────────────────────────────────────────
  const handleSaveClick = () => {
    if (!user) { setShowAuthModal(true); return; }
    if (isSaved) {
      handleUpdateDeck();
    } else {
      setShowSaveModal(true);
    }
  };

  const handleUpdateDeck = async () => {
    setSaving(true);
    await updateDeck({ id: deckId, deck });
    setSaving(false);
  };

  const handleNewSave = async ({ name, description, isPublic }) => {
    setSaving(true);
    const { data, error } = await saveDeck({ name, description, isPublic, deck });
    setSaving(false);
    if (!error && data) {
      if (onAfterSave) onAfterSave(data.id);
      else navigate(`/deck/${data.id}`);
    }
    return { error };
  };

  const handleLoadDeck = (savedDeck) => {
    if (!cards) return;
    setDeck(deserializeDeck(savedDeck.cards, cards));
  };

  const handleClearWithConfirm = () => {
    if (!window.confirm("Clear the entire deck?")) return;
    handleClearDeck();
  };

  const errors = deckValidation.errors;
  const warnings = deckValidation.warnings;
  const bannedInDeck = deckValidation.bannedCards ?? [];

  return (
    <>
      <div className="flex gap-6 min-h-[60vh]">
        {/* ── Left: deck list column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* ── Toolbar ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Stat badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="Dynasty" count={deckStats.dynasty} min={DECK_RULES.MIN_DYNASTY} />
              <StatBadge label="Fate" count={deckStats.fate} min={DECK_RULES.MIN_FATE} />
              <span className="text-xs text-slate-400 font-mono">{deckStats.total} total</span>
            </div>

            {/* Validation summary */}
            {bannedInDeck.length > 0 && (
              <span className="text-xs font-bold text-white bg-red-600 px-2.5 py-1 rounded-full">
                ⊘ {bannedInDeck.length} banned
              </span>
            )}
            {errors.length > bannedInDeck.length && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                ✕ {errors.length - bannedInDeck.length} error{errors.length - bannedInDeck.length !== 1 ? "s" : ""}
              </span>
            )}
            {isValid && deckStats.total > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                ✓ Legal
              </span>
            )}

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* My Decks */}
              <button
                onClick={() => { if (!user) { setShowAuthModal(true); } else { setShowMyDecks(true); } }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                My Decks
              </button>

              {/* Import */}
              <button
                onClick={() => setShowImport(true)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Import
              </button>

              {/* Share */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShowShare((v) => !v)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Share ↗
                </button>
                {showShare && (
                  <SharePanel
                    deckId={deckId}
                    deckMeta={deckMeta}
                    setDeckMeta={setDeckMeta}
                    deck={deck}
                    onClose={() => setShowShare(false)}
                  />
                )}
              </div>

              {/* Clear */}
              {deck.length > 0 && (
                <button
                  onClick={handleClearWithConfirm}
                  className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}

              {/* Primary Save / Update */}
              <button
                onClick={handleSaveClick}
                disabled={saving || deck.length === 0}
                className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? "Saving…" : isSaved ? "Update" : "Save deck"}
              </button>
            </div>
          </div>

          {/* ── Banned cards block ── */}
          {bannedInDeck.length > 0 && (
            <div className="bg-red-600 text-white rounded-xl px-4 py-3">
              <p className="text-xs font-bold mb-1 uppercase tracking-wide">
                ⊘ Banned in Samurai Extended — {bannedInDeck.length} card{bannedInDeck.length !== 1 ? "s" : ""}
              </p>
              <ul className="space-y-0.5 columns-2">
                {bannedInDeck.map((c, i) => (
                  <li key={i} className="text-xs opacity-90">• {c.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Other validation errors ── */}
          {errors.filter(e => !e.includes("is banned in")).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Deck errors</p>
              <ul className="space-y-0.5">
                {errors.filter(e => !e.includes("is banned in")).map((e, i) => (
                  <li key={i} className="text-xs text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Warnings</p>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => <li key={i} className="text-xs text-amber-600">• {w}</li>)}
              </ul>
            </div>
          )}

          {/* ── Card list ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-3 py-3 flex-1">
            <ModernDeckView
              deckByType={deckByType}
              deck={deck}
              getDeckCount={getDeckCount}
              handleAddToDeck={handleAddToDeck}
              handleRemoveFromDeck={handleRemoveFromDeck}
              onCardHover={onCardHover}
            />
          </div>

          {/* ── Utility footer ── */}
          <div className="flex gap-2 text-xs text-slate-400">
            <button
              onClick={handleExportDeck}
              className="hover:text-slate-600 transition-colors"
              title="Copy deck list to clipboard"
            >
              Copy text list
            </button>
            <span>·</span>
            <button
              onClick={() => { try { clearAllCaches(); } catch {} window.location.reload(); }}
              className="hover:text-slate-600 transition-colors"
              title="Clear image caches and force reload"
            >
              Clear image cache
            </button>
          </div>
        </div>

        {/* ── Right: sticky card preview ── */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4">
            <CardPreview
              card={hoveredCard}
              deck={deck}
              getDeckCount={getDeckCount}
              handleAddToDeck={handleAddToDeck}
              handleRemoveFromDeck={handleRemoveFromDeck}
            />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showImport && (
        <ImportModal
          importText={importText}
          setImportText={setImportText}
          onImport={() => { handleImportDeck(); setShowImport(false); }}
          onClose={() => setShowImport(false)}
          missingCards={missingCards}
          setMissingCards={setMissingCards}
        />
      )}

      {showSaveModal && (
        <SaveDeckModal
          onSave={handleNewSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showMyDecks && (
        <SavedDecksList
          onLoadDeck={handleLoadDeck}
          cards={cards}
          onClose={() => setShowMyDecks(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}
