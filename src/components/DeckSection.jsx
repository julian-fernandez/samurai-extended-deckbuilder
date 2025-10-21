import React from "react";
import Card from "./Card";

const DeckSection = ({
  title,
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card
            key={`${title.toLowerCase()}-${card.id}-${index}`}
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

export default DeckSection;
