import { useState } from "react";
import { DECK_RULES } from "../constants/index.js";

// ─── Section colour config ────────────────────────────────────────────────────
const SECTION_STYLE = {
  Stronghold:      { border: "border-l-purple-500", bg: "bg-purple-50",  text: "text-purple-700"  },
  Sensei:          { border: "border-l-blue-400",   bg: "bg-blue-50",    text: "text-blue-700"    },
  PregameHoldings: { border: "border-l-indigo-400", bg: "bg-indigo-50",  text: "text-indigo-700"  },
  Dynasty:         { border: "border-l-amber-500",  bg: "bg-amber-50",   text: "text-amber-700"   },
  Fate:            { border: "border-l-sky-500",    bg: "bg-sky-50",     text: "text-sky-700"     },
};

// ─── Single card row ──────────────────────────────────────────────────────────
function CardRow({ card, count, onAdd, onRemove, isHovered, onHover, onLeave }) {
  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
        card.banned
          ? "bg-red-50 hover:bg-red-100"
          : isHovered
          ? "bg-indigo-50"
          : "hover:bg-slate-50"
      }`}
      onMouseEnter={() => onHover(card)}
      onMouseLeave={onLeave}
    >
      <span className="w-4 text-right text-xs font-mono font-bold text-slate-400 flex-shrink-0 select-none">
        {count}
      </span>
      <span className={`flex-1 text-xs truncate ${
        card.banned
          ? "text-red-700 font-semibold line-through"
          : isHovered
          ? "text-indigo-800 font-semibold"
          : "text-slate-800 font-medium"
      }`}>
        {card.name}
      </span>
      {card.banned && (
        <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded">
          banned
        </span>
      )}
      {!card.banned && card.clan && (
        <span className="text-[10px] text-slate-300 hidden lg:block flex-shrink-0 max-w-[60px] truncate">
          {card.clan}
        </span>
      )}
      <div className="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(card.id); }}
          disabled={count === 0}
          className="w-4 h-4 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:cursor-not-allowed transition-colors text-sm leading-none"
        >−</button>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(card); }}
          className="w-4 h-4 flex items-center justify-center rounded text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-sm leading-none"
        >+</button>
      </div>
    </div>
  );
}

// ─── Sub-type group within a deck column ─────────────────────────────────────
function TypeGroup({ type, cards, deck, getDeckCount, handleAddToDeck, handleRemoveFromDeck, deckSearchTerm, hoveredCardId, onHover, onLeave }) {
  const filtered = deckSearchTerm
    ? cards.filter((c) => c.name.toLowerCase().includes(deckSearchTerm.toLowerCase()))
    : cards.filter((c) => getDeckCount(deck, c.id) > 0);

  if (filtered.length === 0) return null;

  const total = filtered.reduce((s, c) => s + getDeckCount(deck, c.id), 0);

  return (
    <div>
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{type}</span>
        <span className="text-[10px] font-mono text-slate-300">{total}</span>
      </div>
      {filtered.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          count={getDeckCount(deck, card.id)}
          onAdd={handleAddToDeck}
          onRemove={handleRemoveFromDeck}
          isHovered={hoveredCardId === card.id}
          onHover={onHover}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────
function ColumnHeader({ title, count, min, style }) {
  const ok = min === 0 || count >= min;
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 border-l-4 ${style.border} ${style.bg} rounded-tr`}>
      <span className={`text-[11px] uppercase tracking-widest font-bold ${style.text} flex-1`}>{title}</span>
      {min > 0 ? (
        <span className={`text-[11px] font-mono font-bold ${ok ? "text-emerald-600" : "text-amber-600"}`}>
          {count}/{min}
        </span>
      ) : (
        <span className="text-[11px] font-mono text-slate-400">{count}</span>
      )}
    </div>
  );
}

// ─── Top strip: Stronghold, Sensei, Pregame (compact horizontal) ──────────────
function TopStrip({ deckByType, deck, getDeckCount, handleAddToDeck, handleRemoveFromDeck, deckSearchTerm, hoveredCardId, onHover, onLeave }) {
  const sections = [
    { key: "Stronghold", label: "Stronghold", cards: deckByType.Stronghold ?? [] },
    { key: "Sensei", label: "Sensei", cards: deckByType.Sensei ?? [] },
    { key: "PregameHoldings", label: "Pregame", cards: deckByType.PregameHoldings ?? [] },
  ].filter(({ cards }) => cards.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="flex gap-3 mb-3 flex-wrap">
      {sections.map(({ key, label, cards }) => {
        const style = SECTION_STYLE[key];
        const total = cards.reduce((s, c) => s + getDeckCount(deck, c.id), 0);
        const filtered = deckSearchTerm
          ? cards.filter((c) => c.name.toLowerCase().includes(deckSearchTerm.toLowerCase()))
          : cards;
        if (filtered.length === 0 && deckSearchTerm) return null;

        return (
          <div key={key} className={`flex-1 min-w-36 rounded-lg overflow-hidden border border-slate-100`}>
            <div className={`flex items-center gap-2 px-2 py-1 border-l-4 ${style.border} ${style.bg}`}>
              <span className={`text-[11px] uppercase tracking-widest font-bold ${style.text} flex-1`}>{label}</span>
              <span className="text-[11px] font-mono text-slate-400">{total}</span>
            </div>
            <div className="bg-white pb-0.5">
              {filtered.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  count={getDeckCount(deck, card.id)}
                  onAdd={handleAddToDeck}
                  onRemove={handleRemoveFromDeck}
                  isHovered={hoveredCardId === card.id}
                  onHover={onHover}
                  onLeave={onLeave}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dynasty column ───────────────────────────────────────────────────────────
function DynastyColumn({ deckByType, deck, getDeckCount, handleAddToDeck, handleRemoveFromDeck, deckSearchTerm, hoveredCardId, onHover, onLeave }) {
  const total = Object.values(deckByType.Dynasty).reduce(
    (s, cards) => s + cards.reduce((cs, c) => cs + getDeckCount(deck, c.id), 0), 0
  );

  const hasAny = Object.values(deckByType.Dynasty).some((cards) =>
    cards.some((c) => getDeckCount(deck, c.id) > 0)
  );

  if (!hasAny && !deckSearchTerm) return (
    <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
      <ColumnHeader title="Dynasty Deck" count={0} min={DECK_RULES.MIN_DYNASTY} style={SECTION_STYLE.Dynasty} />
      <div className="text-center py-8 text-slate-300 text-xs bg-white">No dynasty cards yet</div>
    </div>
  );

  return (
    <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
      <ColumnHeader title="Dynasty Deck" count={total} min={DECK_RULES.MIN_DYNASTY} style={SECTION_STYLE.Dynasty} />
      <div className="bg-white pb-2">
        {Object.entries(deckByType.Dynasty).map(([type, cards]) => (
          <TypeGroup
            key={type}
            type={type}
            cards={cards}
            deck={deck}
            getDeckCount={getDeckCount}
            handleAddToDeck={handleAddToDeck}
            handleRemoveFromDeck={handleRemoveFromDeck}
            deckSearchTerm={deckSearchTerm}
            hoveredCardId={hoveredCardId}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Fate column ──────────────────────────────────────────────────────────────
function FateColumn({ deckByType, deck, getDeckCount, handleAddToDeck, handleRemoveFromDeck, deckSearchTerm, hoveredCardId, onHover, onLeave }) {
  const total = Object.values(deckByType.Fate).reduce(
    (s, cards) => s + cards.reduce((cs, c) => cs + getDeckCount(deck, c.id), 0), 0
  );

  const hasAny = Object.values(deckByType.Fate).some((cards) =>
    cards.some((c) => getDeckCount(deck, c.id) > 0)
  );

  if (!hasAny && !deckSearchTerm) return (
    <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
      <ColumnHeader title="Fate Deck" count={0} min={DECK_RULES.MIN_FATE} style={SECTION_STYLE.Fate} />
      <div className="text-center py-8 text-slate-300 text-xs bg-white">No fate cards yet</div>
    </div>
  );

  return (
    <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden">
      <ColumnHeader title="Fate Deck" count={total} min={DECK_RULES.MIN_FATE} style={SECTION_STYLE.Fate} />
      <div className="bg-white pb-2">
        {Object.entries(deckByType.Fate).map(([type, cards]) => (
          <TypeGroup
            key={type}
            type={type}
            cards={cards}
            deck={deck}
            getDeckCount={getDeckCount}
            handleAddToDeck={handleAddToDeck}
            handleRemoveFromDeck={handleRemoveFromDeck}
            deckSearchTerm={deckSearchTerm}
            hoveredCardId={hoveredCardId}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ModernDeckView({
  deckByType,
  deck,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
  onCardHover,
}) {
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [deckSearchTerm, setDeckSearchTerm] = useState("");

  const onHover = (card) => { setHoveredCardId(card.id); onCardHover(card); };
  const onLeave = () => { setHoveredCardId(null); onCardHover(null); };

  const sharedProps = {
    deck, getDeckCount, handleAddToDeck, handleRemoveFromDeck,
    deckSearchTerm, hoveredCardId, onHover, onLeave,
  };

  const deckIsEmpty = deck.length === 0;

  return (
    <div className="flex flex-col gap-1">
      {/* Filter */}
      <div className="mb-2">
        <input
          type="text"
          value={deckSearchTerm}
          onChange={(e) => setDeckSearchTerm(e.target.value)}
          placeholder="Filter deck…"
          className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300"
        />
      </div>

      {deckIsEmpty && !deckSearchTerm && (
        <div className="text-center py-12 text-slate-300">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-xs">Your deck is empty. Add cards from the search.</p>
        </div>
      )}

      {/* Stronghold / Sensei / Pregame — full-width top strip */}
      <TopStrip deckByType={deckByType} {...sharedProps} />

      {/* Dynasty | Fate — side-by-side columns */}
      {!deckIsEmpty && (
        <div className="flex gap-3">
          <DynastyColumn deckByType={deckByType} {...sharedProps} />
          <FateColumn    deckByType={deckByType} {...sharedProps} />
        </div>
      )}
    </div>
  );
}
