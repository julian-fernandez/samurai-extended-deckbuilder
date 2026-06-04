import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModernDeckView from "../ModernDeckView";
import SharePanel from "./SharePanel";
import DeckImageExport from "../DeckImageExport";
import { useSavedDecks, deserializeDeck } from "../../hooks/useSavedDecks";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";
import SaveDeckModal from "./SaveDeckModal";
import { DECK_RULES } from "../../constants/index.js";
import CardPreview from "./CardPreview";

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

// ─── Deck Stats ───────────────────────────────────────────────────────────────
function computeDeckStats(deck) {
  const costCurve = {};
  const keywords = {};

  for (const card of deck) {
    const qty = card.quantity ?? 1;
    const type = (Array.isArray(card.type) ? card.type[0] : card.type)?.toLowerCase() ?? "";

    if (type === "personality") {
      const cost = parseInt(card.cost, 10);
      const bucket = Number.isFinite(cost) ? cost : 0;
      costCurve[bucket] = (costCurve[bucket] ?? 0) + qty;
    }

    for (const kw of card.keywords ?? []) {
      keywords[kw] = (keywords[kw] ?? 0) + qty;
    }
  }

  const maxCost = Object.keys(costCurve).length
    ? Math.max(...Object.keys(costCurve).map(Number))
    : 0;
  const costs = Array.from({ length: maxCost + 1 }, (_, i) => ({
    cost: i,
    count: costCurve[i] ?? 0,
  }));

  const sortedKeywords = Object.entries(keywords).sort(([, a], [, b]) => b - a);

  return { costs, sortedKeywords };
}

function CostCurve({ costs }) {
  if (costs.length === 0 || costs.every((b) => b.count === 0)) {
    return (
      <p className="text-xs text-slate-400 italic py-2">
        No Personality cards yet.
      </p>
    );
  }
  const peak = Math.max(...costs.map((b) => b.count));
  const BAR_MAX_H = 64; // px

  return (
    <div className="flex items-end gap-1.5 pt-1 pb-2">
      {costs.map(({ cost, count }) => {
        const h = count > 0 ? Math.max(6, Math.round((count / peak) * BAR_MAX_H)) : 0;
        return (
          <div key={cost} className="flex flex-col items-center gap-0.5 min-w-0">
            {count > 0 && (
              <span className="text-[10px] font-mono text-slate-500 leading-none">{count}</span>
            )}
            <div
              className={`w-7 rounded-t transition-all ${count > 0 ? "bg-indigo-400" : "bg-slate-100"}`}
              style={{ height: count > 0 ? `${h}px` : "4px" }}
            />
            <span className="text-[10px] text-slate-400 font-mono leading-none">{cost}</span>
          </div>
        );
      })}
    </div>
  );
}

function DeckStats({ deck }) {
  const { costs, sortedKeywords } = computeDeckStats(deck);
  const isEmpty = costs.every((b) => b.count === 0) && sortedKeywords.length === 0;

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Add cards to see stats.
      </div>
    );
  }

  return (
    <div className="space-y-5 px-1 py-2">
      {/* ── Cost curve ── */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Personality cost curve
        </p>
        <CostCurve costs={costs} />
      </div>

      {/* ── Keywords ── */}
      {sortedKeywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Keywords
          </p>
          <div className="space-y-1">
            {sortedKeywords.map(([keyword, count]) => (
              <div
                key={keyword}
                className="flex items-center justify-between py-0.5"
              >
                <span className="text-sm text-slate-700">{keyword}</span>
                <span className="text-sm font-mono font-semibold text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [showShare, setShowShare] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImageExport, setShowImageExport] = useState(false);
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
      {/* h-[calc(100vh-7.5rem)]: viewport minus sticky nav (h-14 = 3.5rem) minus content padding (py-8 = 4rem) */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-7.5rem)]">
        {/* ── Left: deck list column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">

          {/* ── Toolbar ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
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
                onClick={() => { if (!user) { setShowAuthModal(true); } else { navigate("/my-decks"); } }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                My Decks
              </button>

              {/* Stats */}
              <button
                onClick={() => setShowStats((v) => !v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  showStats
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Stats
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
                    onPrint={() => setShowImageExport(true)}
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
            <div className="bg-red-600 text-white rounded-xl px-4 py-3 flex-shrink-0">
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
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-shrink-0">
              <p className="text-xs font-semibold text-red-700 mb-1">Deck errors</p>
              <ul className="space-y-0.5">
                {errors.filter(e => !e.includes("is banned in")).map((e, i) => (
                  <li key={i} className="text-xs text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-shrink-0">
              <p className="text-xs font-semibold text-amber-700 mb-1">Warnings</p>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => <li key={i} className="text-xs text-amber-600">• {w}</li>)}
              </ul>
            </div>
          )}

          {/* ── Card list / Stats ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-3 py-3 flex-1 overflow-y-auto min-h-0">
            {showStats ? (
              <DeckStats deck={deck} />
            ) : (
              <ModernDeckView
                deckByType={deckByType}
                deck={deck}
                getDeckCount={getDeckCount}
                handleAddToDeck={handleAddToDeck}
                handleRemoveFromDeck={handleRemoveFromDeck}
                onCardHover={onCardHover}
              />
            )}
          </div>
        </div>

        {/* ── Right: card preview (desktop only) ── */}
        <div className="hidden md:flex w-64 flex-shrink-0 flex-col min-h-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 flex-1 overflow-y-auto min-h-0">
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

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showImageExport && (
        <DeckImageExport
          deck={deck}
          onClose={() => setShowImageExport(false)}
        />
      )}
    </>
  );
}
