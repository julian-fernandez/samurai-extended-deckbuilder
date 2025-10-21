import React from "react";
import Card from "./Card";

const DeckTypeSection = ({
  type,
  cards,
  deck,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
  deckImageViewMode,
  reloadTick,
  deckViewMode,
}) => {
  if (cards.length === 0) return null;

  const totalQuantity = cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">
        {type} ({totalQuantity})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, cardIndex) => (
          <Card
            key={`${type}-${card.id}-${cardIndex}`}
            card={card}
            deckCount={getDeckCount(deck, card.id)}
            onAddToDeck={handleAddToDeck}
            onRemoveFromDeck={handleRemoveFromDeck}
            viewMode={deckImageViewMode}
            reloadTick={reloadTick}
            cardViewMode={deckViewMode}
            showQuantity={true}
          />
        ))}
      </div>
    </div>
  );
};

export default DeckTypeSection;
