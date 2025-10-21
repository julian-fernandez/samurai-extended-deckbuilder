import { useState, useEffect, useRef } from "react";

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  addKeyword,
  removeKeyword,
  uniqueValues,
}) => {
  const [keywordInput, setKeywordInput] = useState("");
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowKeywordSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
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
    setKeywordInput("");
  };

  const handleKeywordInputChange = (e) => {
    setKeywordInput(e.target.value);
    setShowKeywordSuggestions(true);
  };

  const handleKeywordSelect = (keyword) => {
    addKeyword(keyword);
    setKeywordInput("");
    setShowKeywordSuggestions(false);
  };

  const filteredKeywords = uniqueValues.keywords.filter(
    (keyword) =>
      keyword.toLowerCase().includes(keywordInput.toLowerCase()) &&
      !filters.keywords.includes(keyword)
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 mb-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Search & Filters</h2>

      {/* Search Bar */}
      <div className="mb-4">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search Cards
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, text, or keywords..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clan Filter */}
          <div>
            <label
              htmlFor="clan"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Clan
            </label>
            <select
              id="clan"
              value={filters.clan}
              onChange={(e) => handleFilterChange("clan", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <option value="">All Clans</option>
              {uniqueValues.clans.map((clan) => (
                <option key={clan} value={clan}>
                  {clan.charAt(0).toUpperCase() + clan.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Type
            </label>
            <select
              id="type"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <option value="">All Types</option>
              {uniqueValues.types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Numerical Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cost Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.costMin}
                onChange={(e) => handleFilterChange("costMin", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.costMax}
                onChange={(e) => handleFilterChange("costMax", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Force Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Force Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.forceMin}
                onChange={(e) => handleFilterChange("forceMin", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.forceMax}
                onChange={(e) => handleFilterChange("forceMax", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Chi Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chi Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.chiMin}
                onChange={(e) => handleFilterChange("chiMin", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.chiMax}
                onChange={(e) => handleFilterChange("chiMax", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Focus Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.focusMin}
                onChange={(e) => handleFilterChange("focusMin", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.focusMax}
                onChange={(e) => handleFilterChange("focusMax", e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Keyword Filter */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>

          {/* Selected Keywords Pills */}
          {filters.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Keyword Input with Typeahead */}
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={keywordInput}
              onChange={handleKeywordInputChange}
              onFocus={() => setShowKeywordSuggestions(true)}
              placeholder="Type to search keywords..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            />

            {/* Keyword Suggestions Dropdown */}
            {showKeywordSuggestions &&
              keywordInput &&
              filteredKeywords.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredKeywords.slice(0, 10).map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordSelect(keyword)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
