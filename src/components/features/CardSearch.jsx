import React from "react";
import Card from "../Card";
import SearchViewToggle from "../SearchViewToggle";
import Pagination from "../Pagination";

const CardSearch = ({
  currentCards,
  filteredCards,
  currentPage,
  totalPages,
  viewMode,
  setViewMode,
  reloadTick,
  setReloadTick,
  clearImageCache,
  deck,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
  handlePageChange,
}) => {
  return (
    <>
      {/* View Toggle and Results Count */}
      <SearchViewToggle
        currentCards={currentCards}
        filteredCards={filteredCards}
        currentPage={currentPage}
        totalPages={totalPages}
        viewMode={viewMode}
        setViewMode={setViewMode}
        reloadTick={reloadTick}
        setReloadTick={setReloadTick}
        clearImageCache={clearImageCache}
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            deckCount={getDeckCount(deck, card.id)}
            onAddToDeck={() => handleAddToDeck(card)}
            onRemoveFromDeck={() => handleRemoveFromDeck(card.id)}
            viewMode={viewMode}
            reloadTick={reloadTick}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
    </>
  );
};

export default CardSearch;
