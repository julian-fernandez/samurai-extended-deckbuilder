import { useState } from "react";
import SearchFilters from "./SearchFilters";

const Sidebar = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  addKeyword,
  removeKeyword,
  uniqueValues,
  isOpen,
  onToggle,
  isCollapsed,
  onCollapseToggle,
}) => {
  return (
    <>
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg flex-shrink-0 flex flex-col ${
          isCollapsed ? "w-16" : "w-80"
        }`}
        style={{ height: "100vh" }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-gray-800">
              Search & Filters
            </h2>
          )}
          <button
            onClick={onCollapseToggle}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <SearchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
                addKeyword={addKeyword}
                removeKeyword={removeKeyword}
                uniqueValues={uniqueValues}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
