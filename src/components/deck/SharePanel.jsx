import { useState, useRef, useEffect } from "react";
import { useSavedDecks } from "../../hooks/useSavedDecks";
import { exportDeck, getDeckByType } from "../../services/deckService";

function CopyButton({ label, value, disabled, disabledTip }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (disabled || !value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      title={disabled ? disabledTip : undefined}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-sm ${
        disabled
          ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
          : "border-slate-200 text-slate-700 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
        copied ? "bg-emerald-100 text-emerald-700" : disabled ? "bg-slate-100 text-slate-400" : "bg-indigo-100 text-indigo-600"
      }`}>
        {copied ? "Copied!" : disabled ? "Unavailable" : "Copy"}
      </span>
    </button>
  );
}

export default function SharePanel({ deckId, deckMeta, setDeckMeta, deck, onClose }) {
  const { updateDeck, togglePublic } = useSavedDecks();
  const [togglingPublic, setTogglingPublic] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const shareUrl = deckMeta?.shareToken
    ? `${window.location.origin}/share/${deckMeta.shareToken}`
    : null;

  const textExport = deck?.length > 0 ? exportDeck(deck) : null;

  const handleTogglePublic = async () => {
    if (!deckId) return;
    setTogglingPublic(true);
    const { data } = await togglePublic(deckId, deckMeta?.isPublic);
    if (data && setDeckMeta) {
      setDeckMeta((prev) => ({ ...prev, isPublic: data.is_public, shareToken: data.share_token }));
    }
    setTogglingPublic(false);
  };

  const handlePrint = () => {
    const sections = getDeckByType(deck);

    const renderSection = (title, cards) => {
      if (!cards || cards.length === 0) return "";
      const total = cards.reduce((s, c) => s + c.quantity, 0);
      const rows = cards
        .map((c) => `<tr><td>${c.quantity}x</td><td>${c.name}</td></tr>`)
        .join("");
      return `<h3>${title} (${total})</h3><table>${rows}</table>`;
    };

    const html = `<!DOCTYPE html><html><head><title>Deck List</title>
<style>
  body { font-family: sans-serif; font-size: 13px; padding: 20px; color: #111; }
  h2 { margin: 0 0 16px; font-size: 18px; }
  h3 { margin: 16px 0 4px; font-size: 13px; font-weight: bold; text-transform: uppercase;
       letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 4px; }
  td { padding: 1px 6px 1px 0; }
  td:first-child { width: 32px; font-weight: bold; color: #333; }
  @media print { body { padding: 0; } }
</style></head><body>
<h2>Deck List</h2>
${renderSection("Stronghold", sections.Stronghold)}
${renderSection("Sensei", sections.Sensei)}
${renderSection("Pregame Holdings", sections.PregameHoldings)}
${renderSection("Personalities", sections.Dynasty?.Personalities)}
${renderSection("Holdings", sections.Dynasty?.Holdings)}
${renderSection("Celestials", sections.Dynasty?.Celestials)}
${renderSection("Regions", sections.Dynasty?.Regions)}
${renderSection("Events", sections.Dynasty?.Events)}
${renderSection("Strategies", sections.Fate?.Strategies)}
${renderSection("Spells", sections.Fate?.Spells)}
${renderSection("Items", sections.Fate?.Items)}
${renderSection("Followers", sections.Fate?.Followers)}
${renderSection("Rings", sections.Fate?.Rings)}
</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const isPublic = deckMeta?.isPublic;
  const isSaved = !!deckId;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Share deck</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className="p-4 space-y-3">
        {/* Public toggle */}
        {isSaved && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800">Public link</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPublic ? "Anyone with the link can view" : "Enable to create a shareable link"}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={togglingPublic}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                isPublic ? "bg-indigo-600" : "bg-slate-300"
              } disabled:opacity-60`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPublic ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>
        )}

        {!isSaved && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Save your deck first to get a shareable link.
          </p>
        )}

        {/* Copy share URL */}
        <CopyButton
          label="Copy share URL"
          value={isPublic && shareUrl ? shareUrl : null}
          disabled={!isSaved || !isPublic || !shareUrl}
          disabledTip={!isSaved ? "Save deck first" : "Enable public link above"}
        />

        {/* Copy text export */}
        <CopyButton
          label="Copy deck list (text)"
          value={textExport}
          disabled={!textExport}
          disabledTip="Deck is empty"
        />

        {/* Print / PDF */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm"
        >
          <span className="font-medium">Download / Print PDF</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-600">
            Print
          </span>
        </button>
      </div>
    </div>
  );
}
