import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCardSearchPage } from "../hooks/useCardSearchPage";
import { MainLayout } from "../components/layout";
import Header from "../components/layout/Header";
import { findCardImage } from "../services/imageService";
import CardImage from "../components/CardImage";

// ── Text helpers (mirrors Card.jsx) ──────────────────────────────────────────

const formatText = (text) => {
  if (!text) return "";
  let cleaned = text.replace(/^[^<]*?(&#8226;|•).*?(<br>|<BR>|\n|$)/i, "");
  cleaned = cleaned.replace(/^<b>([^<]+)<\/b>\s*(<br>|<BR>|\n)/i, "");
  cleaned = cleaned.replace(/^<b>([^<]+)<\/b>\s*<br>/i, "");
  const lines = cleaned.split(/\n/);
  if (lines.length > 0 && lines[0].includes("•")) {
    lines.shift();
    cleaned = lines.join("\n");
  }
  return cleaned
    .replace(/<b>/g, "**").replace(/<\/b>/g, "**")
    .replace(/<B>/g, "**").replace(/<\/B>/g, "**")
    .replace(/<BR>/g, "\n").replace(/<br>/g, "\n")
    .replace(/<i>/g, "*").replace(/<\/i>/g, "*")
    .replace(/<I>/g, "*").replace(/<\/I>/g, "*")
    .replace(/&#8226;/g, "•");
};

const renderFormattedText = (text) => {
  if (!text) return null;
  const formatted = formatText(text);
  let parts = formatted.split(/(\*\*.*?\*\*)/g);
  parts = parts.flatMap((part) => {
    if (part.startsWith("**") && part.endsWith("**")) return [part];
    return part.split(/(\([^)]*\))/g);
  });
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("(") && part.endsWith(")")) {
      return <em key={index} className="italic text-gray-500">{part}</em>;
    }
    return part;
  });
};

const getClanColor = (clan) => {
  const name = (Array.isArray(clan) ? clan[0] : clan)?.toLowerCase() ?? "";
  switch (name) {
    case "crab":        return "bg-blue-600";
    case "crane":       return "bg-blue-400";
    case "dragon":      return "bg-green-600";
    case "lion":        return "bg-yellow-500";
    case "phoenix":     return "bg-red-500";
    case "scorpion":    return "bg-red-800";
    case "unicorn":     return "bg-indigo-500";
    case "mantis":      return "bg-green-400";
    case "naga":        return "bg-emerald-500";
    case "shadowlands": return "bg-gray-800";
    default:            return "bg-gray-500";
  }
};

function StatRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    cards,
    loading: cardsLoading,
    hasActiveSearch,
    sidebarProps,
    showScrollToTop,
    scrollToTop,
  } = useCardSearchPage();

  const [card, setCard] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // When the user types in the sidebar, send them to the search results page.
  useEffect(() => {
    if (hasActiveSearch) navigate("/");
  }, [hasActiveSearch, navigate]);

  // Find the card from the already-loaded cards array.
  useEffect(() => {
    if (cardsLoading) return;
    const found = cards.find((c) => c.id === id);
    if (found) {
      setCard(found);
    } else {
      setNotFound(true);
    }
  }, [cardsLoading, cards, id]);

  const type = card?.type?.toLowerCase() ?? "";
  const isPersonality = type === "personality";
  const isFateDeck = ["strategy", "spell", "item", "follower", "ring"].includes(type);
  const isDynastyDeck = ["personality", "holding", "celestial", "region", "event"].includes(type);
  const imagePath = card ? findCardImage(card) : null;

  const content = () => {
    if (cardsLoading || (!card && !notFound)) {
      return (
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8 animate-pulse">
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="w-full aspect-[2/3] rounded-2xl bg-gray-200" />
          </div>
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-px bg-gray-100" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
            </div>
          </div>
        </div>
      );
    }

    if (notFound) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-sm">
            <h1 className="text-lg font-bold text-gray-900 mb-2">Card not found</h1>
            <p className="text-gray-500 text-sm mb-6">
              This card does not exist in the database.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold"
            >
              Back to search
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
          {/* Left column — card image */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="md:sticky md:top-6">
              {imagePath ? (
                <CardImage
                  src={imagePath}
                  alt={card.name}
                  className="w-full h-auto rounded-2xl shadow-xl"
                  fallbackClassName="w-full rounded-2xl"
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🃏</div>
                    <div className="text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column — card details */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                {card.name}
              </h1>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm text-gray-500 capitalize">{card.type}</span>
                {card.clan && (
                  <span className={`px-2 py-0.5 text-xs text-white rounded ${getClanColor(card.clan)}`}>
                    {Array.isArray(card.clan) ? card.clan[0] : card.clan}
                  </span>
                )}
                {card.banned && (
                  <span className="px-2 py-0.5 text-xs text-white rounded bg-red-600">BANNED</span>
                )}
              </div>
            </div>

            <hr className="mb-4 border-slate-100" />

            {/* Stats */}
            <div className="mb-4">
              {(isPersonality || type === "item" || type === "follower") && (
                <>
                  <StatRow label="Force" value={card.force} />
                  <StatRow label="Chi" value={card.chi} />
                </>
              )}
              {(isDynastyDeck || isFateDeck) && (
                <StatRow label="Cost" value={card.cost ?? "0"} />
              )}
              {isPersonality && (
                <>
                  <StatRow label="Personal Honor" value={card.personalHonor} />
                  {card.honorRequirement && card.honorRequirement !== "0" && (
                    <StatRow label="Honor Requirement" value={card.honorRequirement} />
                  )}
                </>
              )}
              {type === "follower" && (
                <StatRow label="Honor Requirement" value={card.honorRequirement ?? "0"} />
              )}
              {isFateDeck && (
                <StatRow label="Focus" value={card.focus ?? "0"} />
              )}
              {(type === "holding" || type === "stronghold") && (
                <StatRow label="Gold Production" value={card.goldProduction ?? "0"} />
              )}
            </div>

            {/* Keywords */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {card.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Card text */}
            {card.text && (
              <div className="mb-4 text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 whitespace-pre-line leading-relaxed">
                {renderFormattedText(card.text)}
              </div>
            )}

            {/* Sets */}
            {card.editions && card.editions.length > 0 && (
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gray-500">Sets: </span>
                {card.editions.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Rulings */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Rulings</h2>
          <p className="text-sm text-gray-400 italic">No rulings yet for this card.</p>
        </section>
      </>
    );
  };

  return (
    <MainLayout
      sidebarProps={sidebarProps}
      showScrollToTop={showScrollToTop}
      onScrollToTop={scrollToTop}
    >
      <Header />
      {content()}
    </MainLayout>
  );
}
