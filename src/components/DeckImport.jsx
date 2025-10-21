import React from "react";

const DeckImport = ({
  showImport,
  setShowImport,
  importText,
  setImportText,
  handleImportDeck,
  missingCards,
  setMissingCards,
}) => {
  return (
    <>
      {/* Deck Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search deck..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Missing Cards Warning */}
      {missingCards.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">
            ⚠️ Cards Not Legal in Samurai Extended:
          </h3>
          <p className="text-orange-700 text-sm mb-2">
            The following cards from your deck list are not legal in the Samurai
            Extended format:
          </p>
          <ul className="text-orange-700 text-sm space-y-1">
            {missingCards.map((card, index) => (
              <li key={index}>
                • {card.quantity}x {card.name}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setMissingCards([])}
            className="mt-3 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Import Form */}
      {showImport && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Import Deck</h3>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste deck list here..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleImportDeck}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setShowImport(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DeckImport;
