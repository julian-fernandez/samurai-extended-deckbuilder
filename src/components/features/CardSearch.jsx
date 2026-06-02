import React, { memo } from "react";
import Card from "../Card";
import SearchViewToggle from "../SearchViewToggle";
import Pagination from "../Pagination";

const CardSearch = memo(({
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
  hasActiveSearch,
  onCardClick,
}) => {
  if (!hasActiveSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Search the card database
        </h2>
        <p className="text-gray-400 text-sm">
          Use the filters on the left to find cards
        </p>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            deckCount={getDeckCount(deck, card.id)}
            onAddToDeck={handleAddToDeck}
            onRemoveFromDeck={handleRemoveFromDeck}
            viewMode={viewMode}
            reloadTick={reloadTick}
            onCardClick={onCardClick}
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
});

CardSearch.displayName = "CardSearch";

export default CardSearch;
