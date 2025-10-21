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
}) => {
  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 lg:hidden"
        aria-label="Toggle search sidebar"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex-shrink-0 fixed lg:sticky lg:top-0 z-50 lg:z-auto flex flex-col`}
        style={{ height: "100vh" }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Search & Filters</h2>
          <button
            onClick={onToggle}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close sidebar"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
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
      </div>
    </>
  );
};

export default Sidebar;
