import DeckEditor from "../deck/DeckEditor";

const DeckBuilder = ({
  handleExportDeck,
  showImport, setShowImport,
  handleClearDeck,
  deckStats,
  deck, setDeck, cards,
  importText, setImportText,
  handleImportDeck,
  missingCards, setMissingCards,
  deckValidation, deckByType, getDeckCount,
  handleAddToDeck, handleRemoveFromDeck,
  onCardHover, hoveredCard,
  onAfterSave,
  // Legacy props (no longer used but kept for compat)
  deckImageViewMode, setDeckImageViewMode, reloadTick, setReloadTick, clearImageCache,
}) => {
  return (
    <DeckEditor
      deck={deck}
      setDeck={setDeck}
      cards={cards}
      deckStats={deckStats}
      deckValidation={deckValidation}
      deckByType={deckByType}
      getDeckCount={getDeckCount}
      handleAddToDeck={handleAddToDeck}
      handleRemoveFromDeck={handleRemoveFromDeck}
      handleClearDeck={handleClearDeck}
      handleExportDeck={handleExportDeck}
      showImport={showImport}
      setShowImport={setShowImport}
      importText={importText}
      setImportText={setImportText}
      handleImportDeck={handleImportDeck}
      missingCards={missingCards}
      setMissingCards={setMissingCards}
      onCardHover={onCardHover}
      hoveredCard={hoveredCard}
      onAfterSave={onAfterSave}
    />
  );
};

export default DeckBuilder;
