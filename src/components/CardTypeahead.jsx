import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadCards } from "../services/cardService";

// Module-level cache — cards are loaded once and reused across all instances.
let _cache = null;
let _promise = null;

function ensureCardsLoaded() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = loadCards().then((cards) => {
      _cache = cards;
      return cards;
    });
  }
  return _promise;
}

const MAX_RESULTS = 8;

export default function CardTypeahead({ className = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState(_cache ?? []);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Lazy-load the card catalog on first focus.
  const handleFocus = async () => {
    if (!cards.length) {
      const loaded = await ensureCardsLoaded();
      setCards(loaded);
    }
  };

  // Filter by card name whenever query or cards change.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || !cards.length) {
      setResults([]);
      setOpen(false);
      return;
    }
    const matches = cards
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, MAX_RESULTS);
    setResults(matches);
    setOpen(matches.length > 0);
    setActiveIndex(-1);
  }, [query, cards]);

  // Close when clicking outside.
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (card) => {
    setQuery("");
    setOpen(false);
    navigate(`/card/${card.id}`);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) select(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Find a card…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-400
            bg-white/10 border border-white/20 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15
            transition-all duration-150"
        />
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200
            rounded-xl shadow-lg overflow-hidden z-50"
        >
          {results.map((card, i) => (
            <li key={card.id} role="option" aria-selected={i === activeIndex}>
              <button
                onMouseDown={(e) => e.preventDefault()} // keep input focused
                onClick={() => select(card)}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                  i === activeIndex ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                  <p className="text-xs text-gray-400">
                    {card.type}{card.clan ? ` · ${card.clan}` : ""}
                  </p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
