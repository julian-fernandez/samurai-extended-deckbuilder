import { useState } from "react";
import Card from "./Card";

const ModernDeckView = ({
  deckByType,
  deck,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
  deckImageViewMode,
  reloadTick,
  onCardHover,
  hoveredCard,
}) => {
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const handleCardHover = (card) => {
    setHoveredCardId(card.id);
    onCardHover(card);
  };

  const handleCardLeave = () => {
    setHoveredCardId(null);
    onCardHover(null);
  };

  const renderCardSection = (title, cards, bgColor = "bg-white") => {
    if (!cards || cards.length === 0) return null;

    const totalCards = cards.reduce(
      (sum, card) => sum + getDeckCount(deck, card.id),
      0
    );

    return (
      <div className={`${bgColor} rounded-lg shadow-sm border border-gray-200`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">
            {title} ({totalCards} cards, {cards.length} unique)
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => {
              const count = getDeckCount(deck, card.id);
              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100"
                  onMouseEnter={() => handleCardHover(card)}
                  onMouseLeave={handleCardLeave}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-600 min-w-[1.5rem]">
                      {count}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {card.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveFromDeck(card.id)}
                      disabled={count === 0}
                      className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-xs transition-all duration-200 flex items-center justify-center"
                      title="Remove from deck"
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleAddToDeck(card)}
                      className="w-5 h-5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-xs transition-all duration-200 flex items-center justify-center"
                      title="Add to deck"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stronghold */}
      {renderCardSection("Stronghold", deckByType.Stronghold, "bg-purple-50")}

      {/* Sensei */}
      {renderCardSection("Sensei", deckByType.Sensei, "bg-blue-50")}

      {/* Dynasty Deck */}
      {Object.entries(deckByType.Dynasty).map(([type, cards]) => {
        const totalCards = cards.reduce(
          (sum, card) => sum + getDeckCount(deck, card.id),
          0
        );
        return (
          <div
            key={type}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {type} ({totalCards} cards, {cards.length} unique)
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {cards.map((card) => {
                  const count = getDeckCount(deck, card.id);
                  return (
                    <div
                      key={card.id}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100"
                      onMouseEnter={() => handleCardHover(card)}
                      onMouseLeave={handleCardLeave}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-600 min-w-[1.5rem]">
                          {count}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {card.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveFromDeck(card.id)}
                          disabled={count === 0}
                          className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-xs transition-all duration-200 flex items-center justify-center"
                          title="Remove from deck"
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleAddToDeck(card)}
                          className="w-5 h-5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-xs transition-all duration-200 flex items-center justify-center"
                          title="Add to deck"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Fate Deck */}
      {Object.entries(deckByType.Fate).map(([type, cards]) => {
        const totalCards = cards.reduce(
          (sum, card) => sum + getDeckCount(deck, card.id),
          0
        );
        return (
          <div
            key={type}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-orange-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {type} ({totalCards} cards, {cards.length} unique)
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {cards.map((card) => {
                  const count = getDeckCount(deck, card.id);
                  return (
                    <div
                      key={card.id}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100"
                      onMouseEnter={() => handleCardHover(card)}
                      onMouseLeave={handleCardLeave}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-600 min-w-[1.5rem]">
                          {count}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {card.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveFromDeck(card.id)}
                          disabled={count === 0}
                          className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-xs transition-all duration-200 flex items-center justify-center"
                          title="Remove from deck"
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleAddToDeck(card)}
                          className="w-5 h-5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-xs transition-all duration-200 flex items-center justify-center"
                          title="Add to deck"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModernDeckView;
