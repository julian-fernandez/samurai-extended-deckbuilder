import { useState, useRef, useEffect } from "react";
import { L5R_KEYWORDS } from "../constants";

const KeywordSearch = ({
  availableKeywords,
  selectedKeywords,
  onAddKeyword,
  onRemoveKeyword,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredKeywords, setFilteredKeywords] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter keywords based on input
  useEffect(() => {
    if (inputValue.trim()) {
      // Filter from the actual L5R_KEYWORDS list instead of availableKeywords
      const filtered = L5R_KEYWORDS.filter(
        (keyword) =>
          keyword.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedKeywords.includes(keyword)
      ).slice(0, 10); // Limit to 10 suggestions
      setFilteredKeywords(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredKeywords([]);
      setShowSuggestions(false);
    }
  }, [inputValue, selectedKeywords]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle keyword selection
  const handleKeywordSelect = (keyword) => {
    onAddKeyword(keyword);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && filteredKeywords.length > 0) {
      e.preventDefault();
      handleKeywordSelect(filteredKeywords[0]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Keywords
      </label>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for keywords..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onFocus={() => {
          if (filteredKeywords.length > 0) {
            setShowSuggestions(true);
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && filteredKeywords.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredKeywords.map((keyword, index) => (
            <button
              key={keyword}
              onClick={() => handleKeywordSelect(keyword)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                index === 0 ? "bg-gray-50" : ""
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      )}

      {/* Selected keywords */}
      {selectedKeywords.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {keyword}
                <button
                  onClick={() => onRemoveKeyword(keyword)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  title="Remove keyword"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordSearch;
