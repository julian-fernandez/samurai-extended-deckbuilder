import { useState } from "react";
import { Input, Select } from "./ui";
import KeywordSearch from "./KeywordSearch";

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
  const clearAllFilters = () => {
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
  };
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
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold text-gray-800">
                Search & Filters
              </h2>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Clear all filters"
              >
                Clear
              </button>
            </div>
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
            <div className="p-4 space-y-6">
              {/* Search Input */}
              <div>
                <Input
                  type="text"
                  placeholder="Search by name, text, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Clan Filter */}
              <div>
                <Select
                  label="Clan"
                  value={filters.clan}
                  onChange={(e) =>
                    setFilters({ ...filters, clan: e.target.value })
                  }
                  options={uniqueValues.clans.map((clan) => ({
                    value: clan,
                    label: clan,
                  }))}
                  placeholder="All Clans"
                />
              </div>

              {/* Type Filter */}
              <div>
                <Select
                  label="Type"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  options={uniqueValues.types.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  placeholder="All Types"
                />
              </div>

              {/* Cost Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.costMin}
                    onChange={(e) =>
                      setFilters({ ...filters, costMin: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.costMax}
                    onChange={(e) =>
                      setFilters({ ...filters, costMax: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Force Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Force Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.forceMin}
                    onChange={(e) =>
                      setFilters({ ...filters, forceMin: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.forceMax}
                    onChange={(e) =>
                      setFilters({ ...filters, forceMax: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Chi Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.chiMin}
                    onChange={(e) =>
                      setFilters({ ...filters, chiMin: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.chiMax}
                    onChange={(e) =>
                      setFilters({ ...filters, chiMax: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Focus Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.focusMin}
                    onChange={(e) =>
                      setFilters({ ...filters, focusMin: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.focusMax}
                    onChange={(e) =>
                      setFilters({ ...filters, focusMax: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Keywords */}
              <KeywordSearch
                availableKeywords={uniqueValues.keywords || []}
                selectedKeywords={filters.keywords}
                onAddKeyword={addKeyword}
                onRemoveKeyword={removeKeyword}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
