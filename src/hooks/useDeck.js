import { useState, useCallback, useMemo } from "react";
import {
  addToDeck,
  removeFromDeck,
  getDeckCount,
  getDeckTotal,
  getDynastyCount,
  getFateCount,
  getUniqueCount,
  getDeckValidation,
  getDeckByType,
  exportDeck,
  clearDeck,
  importDeck,
} from "../services/deckService";

export const useDeck = (cards) => {
  const [deck, setDeck] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [missingCards, setMissingCards] = useState([]);

  // Deck management functions
  const handleAddToDeck = useCallback((card) => {
    setDeck((prev) => addToDeck(prev, card));
  }, []);

  const handleRemoveFromDeck = useCallback((cardId) => {
    setDeck((prev) => removeFromDeck(prev, cardId));
  }, []);

  const handleClearDeck = useCallback(() => {
    setDeck(clearDeck());
  }, []);

  const handleExportDeck = () => {
    const deckText = exportDeck(deck);
    navigator.clipboard.writeText(deckText).then(() => {
      alert("Deck copied to clipboard!");
    });
  };

  const handleImportDeck = () => {
    if (!importText.trim()) return;

    try {
      const {
        deck: importedDeck,
        missingCards: missing,
        bannedCards: banned,
      } = importDeck(importText, cards);
      setDeck(importedDeck);
      setMissingCards(missing);
      setShowImport(false);
      setImportText("");

      let message = `Imported ${importedDeck.length} cards to deck!`;
      if (missing.length > 0) {
        message += ` ${missing.length} cards not found.`;
      }
      if (banned.length > 0) {
        message += ` ${banned.length} banned cards detected: ${banned
          .map((c) => c.name)
          .join(", ")}`;
      }
      alert(message);
    } catch (error) {
      console.error("Error importing deck:", error);
      alert("Error importing deck. Please check the format.");
    }
  };

  const deckStats = useMemo(() => ({
    total: getDeckTotal(deck),
    dynasty: getDynastyCount(deck),
    fate: getFateCount(deck),
    unique: getUniqueCount(deck),
  }), [deck]);

  const deckValidation = useMemo(() => getDeckValidation(deck), [deck]);

  const deckByType = useMemo(() => getDeckByType(deck), [deck]);

  return {
    deck,
    setDeck,
    showImport,
    setShowImport,
    importText,
    setImportText,
    missingCards,
    setMissingCards,
    handleAddToDeck,
    handleRemoveFromDeck,
    handleClearDeck,
    handleExportDeck,
    handleImportDeck,
    deckStats,
    deckValidation,
    deckByType,
    getDeckCount,
  };
};
