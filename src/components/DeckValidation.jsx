import React from "react";

const DeckValidation = ({ deckValidation }) => {
  return (
    <>
      {/* Deck Validation */}
      {deckValidation.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Deck Errors:</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {deckValidation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {deckValidation.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Deck Warnings:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            {deckValidation.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default DeckValidation;
