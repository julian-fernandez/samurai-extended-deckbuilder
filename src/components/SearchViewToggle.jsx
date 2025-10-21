import React from "react";

const SearchViewToggle = ({
  currentCards,
  filteredCards,
  currentPage,
  totalPages,
  viewMode,
  setViewMode,
  reloadTick,
  setReloadTick,
  clearImageCache,
}) => {
  return (
    <div className="mb-6 flex justify-between items-center">
      <p className="text-lg text-gray-600">
        Showing {currentCards.length} of {filteredCards.length} cards (Page{" "}
        {currentPage} of {totalPages})
      </p>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("text")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === "text"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📄 Text
          </button>
          <button
            onClick={() => {
              console.log("Switching to image view mode");
              setViewMode("image");
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === "image"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🖼️ Image
          </button>
        </div>
        <button
          onClick={() => {
            try {
              clearImageCache();
            } catch {
              /* ignore */
            }
            setReloadTick((t) => t + 1);
          }}
          className="ml-3 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          title="Clear image cache and force reload"
        >
          Reload images
        </button>
      </div>
    </div>
  );
};

export default SearchViewToggle;
