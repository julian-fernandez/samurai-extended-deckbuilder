import { useState, useEffect, useRef } from "react";
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
import Sidebar from "./components/Sidebar";
import ModernDeckView from "./components/ModernDeckView";
import CardPreviewPanel from "./components/CardPreviewPanel";
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
  const [deckImageViewMode, setDeckImageViewMode] = useState("image"); // "text" or "image"
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [viewMode, setViewMode] = useState("image"); // "text" or "image"
  const [uniqueValues, setUniqueValues] = useState({
    clans: [],
    types: [],
    keywords: [],
  });
  const [reloadTick, setReloadTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const prevFiltersRef = useRef({ searchTerm: "", filters: {} });
  const userSwitchedToDeckRef = useRef(false);

  // Load cards on mount
  useEffect(() => {
    loadCardsData();
  }, []);

  // Filter cards when dependencies change
  useEffect(() => {
    filterCardsData();
  }, [cards, searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch to search view when filters change in deck view (but not when user manually switches to deck)
  useEffect(() => {
    if (showDeck && !userSwitchedToDeckRef.current) {
      // Check if filters actually changed (not just on initial load)
      const filtersChanged =
        searchTerm !== prevFiltersRef.current.searchTerm ||
        JSON.stringify(filters) !==
          JSON.stringify(prevFiltersRef.current.filters);

      if (
        filtersChanged &&
        (searchTerm ||
          Object.values(filters).some((value) =>
            Array.isArray(value) ? value.length > 0 : value !== ""
          ))
      ) {
        setShowDeck(false);
      }
    }

    // Update previous filters
    prevFiltersRef.current = { searchTerm, filters };
  }, [searchTerm, filters, showDeck]);

  // Update unique values when cards change
  useEffect(() => {
    if (cards.length > 0) {
      setUniqueValues(getUniqueValues(cards));
    }
  }, [cards]);

  // Reset the user switch flag when filters actually change
  useEffect(() => {
    if (userSwitchedToDeckRef.current) {
      userSwitchedToDeckRef.current = false;
    }
  }, [searchTerm, filters]);

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

  // Mouse tracking for card preview
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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

  const handleCardHover = (card) => {
    setHoveredCard(card);
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

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          addKeyword={addKeyword}
          removeKeyword={removeKeyword}
          uniqueValues={uniqueValues}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
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
                    onClick={() => {
                      if (!showDeck) {
                        userSwitchedToDeckRef.current = true;
                      } else {
                        userSwitchedToDeckRef.current = false;
                      }
                      setShowDeck(!showDeck);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {showDeck ? "Card search" : "Deck view"} ({deckStats.total}{" "}
                    cards)
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            {!showDeck ? (
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
                      deckViewMode={deckViewMode}
                      onCardHover={handleCardHover}
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
                                {hoveredCard.chi && (
                                  <span>Chi: {hoveredCard.chi}</span>
                                )}
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
                                  onClick={() =>
                                    handleRemoveFromDeck(hoveredCard.id)
                                  }
                                  disabled={
                                    getDeckCount(deck, hoveredCard.id) === 0
                                  }
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
      </div>
    </div>
  );
}

export default App;
