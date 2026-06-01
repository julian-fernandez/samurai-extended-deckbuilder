import { findCardImage } from "../../services/imageService";

/**
 * Renders a hovered-card preview panel.
 *
 * When `deck`, `getDeckCount`, `handleAddToDeck`, and `handleRemoveFromDeck`
 * are provided the panel shows add/remove controls (editor mode).
 * Omit those props to render a read-only preview (e.g. SharedDeck).
 */
export default function CardPreview({
  card,
  deck,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
}) {
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
  const isEditable = deck && getDeckCount && handleAddToDeck && handleRemoveFromDeck;
  const count = isEditable ? getDeckCount(deck, card.id) : null;

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

      {isEditable && (
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
      )}
    </div>
  );
}
