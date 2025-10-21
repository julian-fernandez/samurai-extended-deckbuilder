import { useState, useEffect } from "react";
import Card from "./components/Card";
import SearchFilters from "./components/SearchFilters";
import SearchViewToggle from "./components/SearchViewToggle";
import Pagination from "./components/Pagination";
import DeckControls from "./components/DeckControls";
import DeckViewToggle from "./components/DeckViewToggle";
import DeckImport from "./components/DeckImport";
import DeckValidation from "./components/DeckValidation";
import DeckSection from "./components/DeckSection";
import DeckTypeSection from "./components/DeckTypeSection";
import PWAInstallButton from "./components/PWAInstallButton";
import OfflineIndicator from "./components/OfflineIndicator";
import {
  loadCards,
  filterCards,
  getUniqueValues,
} from "./services/cardService";
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
} from "./services/deckService";
import "./App.css";
import { clearImageCache } from "./services/imageService";

function App() {
  // State management
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    clan: "",
    type: "",
    costMin: "",
    costMax: "",
    forceMin: "",
    forceMax: "",
    chiMin: "",
    chiMax: "",
    focusMin: "",
    focusMax: "",
    keywords: [],
  });
  const [deck, setDeck] = useState([]);
  const [showDeck, setShowDeck] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [missingCards, setMissingCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage] = useState(24); // 4 columns × 6 rows
  const [deckViewMode, setDeckViewMode] = useState("compact"); // "compact" or "full"
  const [deckImageViewMode, setDeckImageViewMode] = useState("text"); // "text" or "image"
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [viewMode, setViewMode] = useState("text"); // "text" or "image"
  const [uniqueValues, setUniqueValues] = useState({
    clans: [],
    types: [],
    keywords: [],
  });
  const [reloadTick, setReloadTick] = useState(0);

  // Load cards on mount
  useEffect(() => {
    loadCardsData();
  }, []);

  // Filter cards when dependencies change
  useEffect(() => {
    filterCardsData();
  }, [cards, searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update unique values when cards change
  useEffect(() => {
    if (cards.length > 0) {
      setUniqueValues(getUniqueValues(cards));
    }
  }, [cards]);

  // Reset to first page when filtered cards change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCards]);

  // Global scroll listener for scroll-to-top
  useEffect(() => {
    let ticking = false;

    const handleGlobalScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          setShowScrollToTop(scrollTop > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleGlobalScroll);
    return () => {
      window.removeEventListener("scroll", handleGlobalScroll);
    };
  }, []);

  // Load cards from JSON
  const loadCardsData = async () => {
    setLoading(true);
    try {
      const loadedCards = await loadCards();
      setCards(loadedCards);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cards based on current criteria
  const filterCardsData = () => {
    const filtered = filterCards(cards, { searchTerm, ...filters });
    setFilteredCards(filtered);
  };

  // Keyword management functions
  const addKeyword = (keyword) => {
    if (!filters.keywords.includes(keyword)) {
      setFilters((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
    }
  };

  const removeKeyword = (keyword) => {
    setFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  // Deck management functions
  const handleAddToDeck = (card) => {
    setDeck(addToDeck(deck, card));
  };

  const handleRemoveFromDeck = (cardId) => {
    setDeck(removeFromDeck(deck, cardId));
  };

  const handleClearDeck = () => {
    setDeck(clearDeck());
  };

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

  // Filter deck cards by search term (for future use)
  // const filteredDeckCards = deck.filter(card =>
  //   !deckSearchTerm ||
  //   card.name.toLowerCase().includes(deckSearchTerm.toLowerCase())
  // );

  // Get deck statistics
  const deckStats = {
    total: getDeckTotal(deck),
    dynasty: getDynastyCount(deck),
    fate: getFateCount(deck),
    unique: getUniqueCount(deck),
  };

  // Get deck validation
  const deckValidation = getDeckValidation(deck);

  // Get deck organized by type
  const deckByType = getDeckByType(deck);

  // Pagination logic
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <OfflineIndicator />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Legend of the Five Rings
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Samurai Extended Format
            </p>
          </div>
          <div className="flex items-center gap-4">
            <PWAInstallButton />
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeck(!showDeck)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {showDeck ? "Card search" : "Deck view"} ({deckStats.total} cards)
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!showDeck ? (
          <>
            {/* Search and Filters */}
            <SearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
              addKeyword={addKeyword}
              removeKeyword={removeKeyword}
              uniqueValues={uniqueValues}
            />

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
        ) : (
          /* Deck View */
          <div className="space-y-6">
            {/* Deck Controls */}
            <DeckControls
              deckViewMode={deckViewMode}
              setDeckViewMode={setDeckViewMode}
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

            {/* Deck Content */}
            <div className="space-y-6">
              {/* Stronghold */}
              <DeckSection
                title="Stronghold"
                cards={deckByType.Stronghold}
                deck={deck}
                getDeckCount={getDeckCount}
                handleAddToDeck={handleAddToDeck}
                handleRemoveFromDeck={handleRemoveFromDeck}
                deckImageViewMode={deckImageViewMode}
                reloadTick={reloadTick}
                deckViewMode={deckViewMode}
              />

              {/* Sensei */}
              <DeckSection
                title="Sensei"
                cards={deckByType.Sensei}
                deck={deck}
                getDeckCount={getDeckCount}
                handleAddToDeck={handleAddToDeck}
                handleRemoveFromDeck={handleRemoveFromDeck}
                deckImageViewMode={deckImageViewMode}
                reloadTick={reloadTick}
                deckViewMode={deckViewMode}
              />

              {/* Dynasty Deck */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Dynasty Deck ({deckStats.dynasty} cards)
                </h2>
                {Object.entries(deckByType.Dynasty).map(([type, cards]) => (
                  <DeckTypeSection
                    key={type}
                    type={type}
                    cards={cards}
                    deck={deck}
                    getDeckCount={getDeckCount}
                    handleAddToDeck={handleAddToDeck}
                    handleRemoveFromDeck={handleRemoveFromDeck}
                    deckImageViewMode={deckImageViewMode}
                    reloadTick={reloadTick}
                    deckViewMode={deckViewMode}
                  />
                ))}
              </div>

              {/* Fate Deck */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Fate Deck ({deckStats.fate} cards)
                </h2>
                {Object.entries(deckByType.Fate).map(([type, cards]) => (
                  <DeckTypeSection
                    key={type}
                    type={type}
                    cards={cards}
                    deck={deck}
                    getDeckCount={getDeckCount}
                    handleAddToDeck={handleAddToDeck}
                    handleRemoveFromDeck={handleRemoveFromDeck}
                    deckImageViewMode={deckImageViewMode}
                    reloadTick={reloadTick}
                    deckViewMode={deckViewMode}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
