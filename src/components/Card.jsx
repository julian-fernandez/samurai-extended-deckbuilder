import React, { useState } from "react";
import LazyImage from "./LazyImage";
import { findCardImage } from "../services/imageService";

const Card = ({
  card,
  deckCount = 0,
  onAddToDeck,
  onRemoveFromDeck,
  viewMode = "text",
  reloadTick = 0,
  cardViewMode = "full", // "full" or "compact" for deck view
  showQuantity = false, // Show quantity for deck view
}) => {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const formatText = (text) => {
    if (!text) return "";

    // Remove the entire keyword line from the beginning of the text
    // This removes patterns like "Unicorn Clan • Samurai • Cavalry • Commander • Tactician • Experienced • Unique"
    // followed by any line break or end of string
    let cleanedText = text.replace(
      /^[^<]*?(&#8226;|•).*?(<br>|<BR>|\n|$)/i,
      ""
    );

    // Remove standalone keyword lines (like "Weapon" on its own line)
    cleanedText = cleanedText.replace(/^<b>([^<]+)<\/b>\s*(<br>|<BR>|\n)/i, "");

    // Also remove standalone keywords that appear at the start of the text
    cleanedText = cleanedText.replace(/^<b>([^<]+)<\/b>\s*<br>/i, "");

    // If the first line still contains bullets, remove it entirely
    const lines = cleanedText.split(/\n/);
    if (lines.length > 0 && lines[0].includes("•")) {
      lines.shift(); // Remove the first line
      cleanedText = lines.join("\n");
    }

    // Convert HTML-like tags to readable format
    return cleanedText
      .replace(/<b>/g, "**")
      .replace(/<\/b>/g, "**")
      .replace(/<B>/g, "**")
      .replace(/<\/B>/g, "**")
      .replace(/<BR>/g, "\n")
      .replace(/<br>/g, "\n")
      .replace(/<i>/g, "*")
      .replace(/<\/i>/g, "*")
      .replace(/<I>/g, "*")
      .replace(/<\/I>/g, "*")
      .replace(/&#8226;/g, "•"); // Convert bullet entity to bullet point
  };

  const renderFormattedText = (text) => {
    if (!text) return "";
    const formatted = formatText(text);

    // First handle bold text (**text**)
    let parts = formatted.split(/(\*\*.*?\*\*)/g);
    parts = parts.flatMap((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return [part]; // Keep bold text as is
      }
      // Then handle italic text within parentheses
      return part.split(/(\([^)]*\))/g);
    });

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("(") && part.endsWith(")")) {
        return (
          <em key={index} className="italic text-gray-600">
            {part}
          </em>
        );
      }
      return part;
    });
  };

  const getClanBackgroundColor = (clan) => {
    if (!clan) return "bg-gray-50 border-gray-200"; // Default for no clan

    // Handle clan as array or string
    const clanName = Array.isArray(clan) ? clan[0] : clan;
    if (!clanName || typeof clanName !== "string")
      return "bg-gray-50 border-gray-200";

    switch (clanName.toLowerCase()) {
      case "crab":
        return "bg-blue-50 border-blue-200"; // Deep blue for Crab
      case "crane":
        return "bg-blue-50 border-blue-200"; // Light blue for Crane
      case "dragon":
        return "bg-green-50 border-green-200"; // Green for Dragon
      case "lion":
        return "bg-yellow-50 border-yellow-200"; // Gold/Yellow for Lion
      case "phoenix":
        return "bg-red-50 border-red-200"; // Fire red for Phoenix
      case "scorpion":
        return "bg-red-50 border-red-300"; // Dark red for Scorpion
      case "unicorn":
        return "bg-indigo-50 border-indigo-200"; // Purple for Unicorn
      case "mantis":
        return "bg-emerald-50 border-emerald-200"; // Green for Mantis
      case "naga":
        return "bg-emerald-50 border-emerald-200"; // Green for Naga
      case "shadowlands":
        return "bg-gray-50 border-gray-300"; // Dark gray for Shadowlands
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getClanColor = (clan) => {
    if (!clan) return "bg-gray-600"; // Default for no clan

    // Handle clan as array or string
    const clanName = Array.isArray(clan) ? clan[0] : clan;
    if (!clanName || typeof clanName !== "string") return "bg-gray-600";

    switch (clanName.toLowerCase()) {
      case "crab":
        return "bg-blue-600"; // Deep blue for Crab
      case "crane":
        return "bg-blue-400"; // Light blue for Crane
      case "dragon":
        return "bg-green-600"; // Green for Dragon
      case "lion":
        return "bg-yellow-500"; // Gold/Yellow for Lion
      case "phoenix":
        return "bg-red-500"; // Fire red for Phoenix
      case "scorpion":
        return "bg-red-800"; // Dark red for Scorpion
      case "unicorn":
        return "bg-indigo-500"; // Purple for Unicorn
      case "mantis":
        return "bg-green-400"; // Green for Mantis
      case "naga":
        return "bg-emerald-500"; // Green for Naga
      case "shadowlands":
        return "bg-gray-800"; // Dark gray for Shadowlands
      default:
        return "bg-gray-500";
    }
  };

  // Get image path for image view
  // pick front or back image depending on flip state
  const basePath = viewMode === "image" ? findCardImage(card) : null;
  const backPath =
    viewMode === "image" && card.backsideImagePath
      ? `${card.backsideImagePath}?t=${reloadTick}`
      : null;
  const imagePath = showBack && backPath ? backPath : basePath;

  // If in image mode but no image found or image failed to load, fall back to text mode for this card
  const effectiveViewMode =
    viewMode === "image" && (!imagePath || imageLoadFailed) ? "text" : viewMode;

  // Compact view for deck
  if (cardViewMode === "compact") {
    return (
      <div
        className={`${getClanBackgroundColor(
          card.clan
        )} backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform relative p-4`}
      >
        <div className="flex justify-between items-center mb-2 pr-12">
          <h4 className="font-semibold text-sm">{card.name}</h4>
          {showQuantity && (
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              x{card.quantity}
            </span>
          )}
        </div>

        {/* Image View for Compact */}
        {effectiveViewMode === "image" && imagePath && (
          <div className="mb-2">
            <LazyImage
              src={imagePath}
              alt={card.name}
              className="w-full h-auto rounded shadow-sm"
              fallbackClassName="w-full h-32 rounded"
              card={card}
              onError={() => setImageLoadFailed(true)}
            />
            {card.hasBackside && card.backsideImagePath && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setShowBack((v) => !v)}
                  className="p-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  title={showBack ? "Show front" : "Show back"}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Flip button for compact text view */}
        {effectiveViewMode === "text" &&
          card.hasBackside &&
          card.backsideImagePath && (
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setShowBack((v) => !v)}
                className="p-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                title={showBack ? "Show front" : "Show back"}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )}

        {/* Subtle corner buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button
            onClick={() => onRemoveFromDeck(card.id)}
            className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
            title="Remove from deck"
          >
            −
          </button>
          <button
            onClick={() => onAddToDeck(card)}
            className="w-5 h-5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
            title="Add to deck"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getClanBackgroundColor(
        card.clan
      )} backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 transform relative`}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex justify-between items-start mb-2 pr-16">
          <h3 className="text-lg font-bold text-gray-800 leading-tight">
            {card.name}
          </h3>
          {showQuantity && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              x{card.quantity}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600 capitalize">{card.type}</span>
          {card.clan && (
            <span
              className={`px-2 py-1 text-xs text-white rounded ${getClanColor(
                card.clan
              )}`}
            >
              {card.clan}
            </span>
          )}
          {card.banned && (
            <span className="px-2 py-1 text-xs text-white rounded bg-red-600">
              BANNED
            </span>
          )}
        </div>
      </div>

      {/* Image View */}
      {effectiveViewMode === "image" && imagePath && (
        <div className="p-4">
          <LazyImage
            src={imagePath}
            alt={card.name}
            className="w-full h-auto rounded-lg shadow-md"
            fallbackClassName="w-full h-64 rounded-lg"
            card={card}
            onError={() => setImageLoadFailed(true)}
          />
          {card.hasBackside && card.backsideImagePath && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setShowBack((v) => !v)}
                className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                title={showBack ? "Show front" : "Show back"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text View Content */}
      {effectiveViewMode === "text" && (
        <>
          {/* Card Stats */}
          <div className="p-6 min-h-64">
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              {/* Force - for Personalities and Items */}
              {card.force &&
                (card.type === "Personality" || card.type === "Item") && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Force:</span>
                    <span className="font-semibold">{card.force}</span>
                  </div>
                )}
              {/* Chi - for Personalities and Items */}
              {card.chi &&
                (card.type === "Personality" || card.type === "Item") && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chi:</span>
                    <span className="font-semibold">{card.chi}</span>
                  </div>
                )}
              {/* Cost - for Personalities, Holdings, Strategies, and Items */}
              {card.cost &&
                (card.type === "Personality" ||
                  card.type === "Holding" ||
                  card.type === "Strategy" ||
                  card.type === "Item") && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-semibold">{card.cost}</span>
                  </div>
                )}
              {/* Personal Honor - only for Personalities */}
              {card.personalHonor && card.type === "Personality" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Personal Honor:</span>
                  <span className="font-semibold">{card.personalHonor}</span>
                </div>
              )}
              {/* Honor Requirement - only for Personalities */}
              {card.honorRequirement && card.type === "Personality" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Honor Requirement:</span>
                  <span className="font-semibold">{card.honorRequirement}</span>
                </div>
              )}
              {/* Focus - for any card that has it */}
              {card.focus && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Focus:</span>
                  <span className="font-semibold">{card.focus}</span>
                </div>
              )}
              {/* Gold Production - only for Holdings and Strongholds */}
              {card.goldProduction &&
                (card.type === "Holding" || card.type === "Stronghold") && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gold Production:</span>
                    <span className="font-semibold">{card.goldProduction}</span>
                  </div>
                )}
            </div>

            {/* Keywords */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {card.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Card Text - Always visible */}
            {card.text && (
              <div className="mb-3">
                <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="whitespace-pre-line leading-relaxed">
                    {renderFormattedText(card.text)}
                  </div>
                </div>
              </div>
            )}

            {/* Editions */}
            {card.editions && card.editions.length > 0 && (
              <div className="text-xs text-gray-500 mb-3">
                <span className="font-medium">Sets: </span>
                {card.editions.join(", ")}
              </div>
            )}
          </div>

          {/* Flip button for text view */}
          {card.hasBackside && card.backsideImagePath && (
            <div className="p-4 pt-2 flex justify-end">
              <button
                onClick={() => setShowBack((v) => !v)}
                className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                title={showBack ? "Show front" : "Show back"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Deck Controls - Subtle corner buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          onClick={() => onRemoveFromDeck(card.id)}
          disabled={deckCount === 0}
          className="w-6 h-6 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
          title="Remove from deck"
        >
          −
        </button>
        <span className="w-6 h-6 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center justify-center border border-blue-200">
          {deckCount}
        </span>
        <button
          onClick={() => onAddToDeck(card)}
          className="w-6 h-6 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-xs transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
          title="Add to deck"
        >
          +
        </button>
      </div>

      {/* In deck indicator - only show in search view */}
      {deckCount > 0 && cardViewMode === "full" && !showQuantity && (
        <div className="absolute top-10 right-2">
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
            In deck
          </span>
        </div>
      )}
    </div>
  );
};

export default Card;
