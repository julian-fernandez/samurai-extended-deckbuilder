import React, { useState } from "react";
import DeckImageExport from "./DeckImageExport";
import { clearAllCaches } from "../services/imageService";

const DeckControls = ({
  deckViewMode,
  setDeckViewMode,
  handleExportDeck,
  showImport,
  setShowImport,
  handleClearDeck,
  deckStats,
  deck,
}) => {
  const [showImageExport, setShowImageExport] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <div className="flex gap-4">
          <button
            onClick={() =>
              setDeckViewMode(deckViewMode === "compact" ? "full" : "compact")
            }
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {deckViewMode === "compact" ? "Full View" : "Compact View"}
          </button>
          <button
            onClick={handleExportDeck}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Export Deck
          </button>
          <button
            onClick={() => setShowImageExport(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Export Images
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Import Deck
          </button>
          <button
            onClick={handleClearDeck}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Clear Deck
          </button>
          <button
            onClick={clearAllCaches}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title="Clear all caches and force reload (use if images are wrong)"
          >
            Clear Caches
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <div>
            Total: {deckStats.total} | Dynasty: {deckStats.dynasty} | Fate:{" "}
            {deckStats.fate}
          </div>
          <div>Unique Cards: {deckStats.unique}</div>
        </div>
      </div>

      {showImageExport && (
        <DeckImageExport
          deck={deck}
          deckStats={deckStats}
          onClose={() => setShowImageExport(false)}
        />
      )}
    </div>
  );
};

export default DeckControls;
