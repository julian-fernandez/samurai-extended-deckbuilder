import React from "react";
import DeckControls from "../DeckControls";
import DeckImport from "../DeckImport";
import DeckValidation from "../DeckValidation";
import DeckViewToggle from "../DeckViewToggle";
import ModernDeckView from "../ModernDeckView";

const DeckBuilder = ({
  deckImageViewMode,
  setDeckImageViewMode,
  reloadTick,
  setReloadTick,
  clearImageCache,
  handleExportDeck,
  showImport,
  setShowImport,
  handleClearDeck,
  deckStats,
  deck,
  importText,
  setImportText,
  handleImportDeck,
  missingCards,
  setMissingCards,
  deckValidation,
  deckByType,
  getDeckCount,
  handleAddToDeck,
  handleRemoveFromDeck,
  onCardHover,
  hoveredCard,
}) => {
  return (
    <div className="space-y-6">
      {/* Deck Controls */}
      <DeckControls
        deckImageViewMode={deckImageViewMode}
        setDeckImageViewMode={setDeckImageViewMode}
        reloadTick={reloadTick}
        setReloadTick={setReloadTick}
        clearImageCache={clearImageCache}
        handleExportDeck={handleExportDeck}
        showImport={showImport}
        setShowImport={setShowImport}
        handleClearDeck={handleClearDeck}
        deckStats={deckStats}
        deck={deck}
      />

      <DeckImport
        showImport={showImport}
        setShowImport={setShowImport}
        importText={importText}
        setImportText={setImportText}
        handleImportDeck={handleImportDeck}
        missingCards={missingCards}
        setMissingCards={setMissingCards}
      />

      <DeckValidation deckValidation={deckValidation} />

      <DeckViewToggle
        deckStats={deckStats}
        deckImageViewMode={deckImageViewMode}
        setDeckImageViewMode={setDeckImageViewMode}
        reloadTick={reloadTick}
        setReloadTick={setReloadTick}
        clearImageCache={clearImageCache}
      />

      {/* Modern Deck View with Side Panel */}
      <div className="flex gap-6">
        {/* Deck List - Left Side */}
        <div className="flex-1">
          <ModernDeckView
            deckByType={deckByType}
            deck={deck}
            getDeckCount={getDeckCount}
            handleAddToDeck={handleAddToDeck}
            handleRemoveFromDeck={handleRemoveFromDeck}
            deckImageViewMode={deckImageViewMode}
            reloadTick={reloadTick}
            onCardHover={onCardHover}
            hoveredCard={hoveredCard}
          />
        </div>

        {/* Card Preview Panel - Right Side */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4">
            {hoveredCard ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                {/* Card Image */}
                <div className="mb-4">
                  <img
                    src={hoveredCard.imagePath}
                    alt={hoveredCard.name}
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center hidden">
                    <span className="text-gray-500 text-sm">
                      Image not available
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {hoveredCard.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {hoveredCard.type}
                      </span>
                      {hoveredCard.cost && (
                        <span>Cost: {hoveredCard.cost}</span>
                      )}
                      {hoveredCard.force && (
                        <span>Force: {hoveredCard.force}</span>
                      )}
                      {hoveredCard.chi && <span>Chi: {hoveredCard.chi}</span>}
                    </div>
                  </div>

                  {hoveredCard.text && (
                    <div className="text-sm text-gray-700">
                      <p className="line-clamp-6">
                        {hoveredCard.text.replace(/<[^>]*>/g, "")}
                      </p>
                    </div>
                  )}

                  {/* Deck Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveFromDeck(hoveredCard.id)}
                        disabled={getDeckCount(deck, hoveredCard.id) === 0}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                        title="Remove from deck"
                      >
                        −
                      </button>
                      <span className="w-8 h-8 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center justify-center border border-blue-200">
                        {getDeckCount(deck, hoveredCard.id)}
                      </span>
                      <button
                        onClick={() => handleAddToDeck(hoveredCard)}
                        className="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200 text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                        title="Add to deck"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  Hover over a card to see details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;
