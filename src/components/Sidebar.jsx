import { useState } from "react";
import { Select } from "./ui";
import KeywordSearch from "./KeywordSearch";

// ─── Dual-thumb range slider ──────────────────────────────────────────────────
// Two overlapping <input type="range"> elements share a track.
// pointer-events are disabled on the track and enabled only on each thumb.
const DUAL_THUMB_CSS = `
  .dual-thumb {
    position: absolute; inset: 0; width: 100%; height: 100%;
    background: transparent; appearance: none; -webkit-appearance: none;
    pointer-events: none; margin: 0;
  }
  .dual-thumb::-webkit-slider-runnable-track { background: transparent; }
  .dual-thumb::-webkit-slider-thumb {
    pointer-events: all; -webkit-appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: #4f46e5; border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.25); cursor: pointer;
    margin-top: -6px;
  }
  .dual-thumb::-moz-range-track { background: transparent; }
  .dual-thumb::-moz-range-thumb {
    pointer-events: all; width: 14px; height: 14px; border-radius: 50%;
    background: #4f46e5; border: 2px solid #fff; cursor: pointer;
  }
`;

function RangeFilter({ label, minKey, maxKey, ceiling, minVal, maxVal, onChange }) {
  const lo = minVal !== "" ? Number(minVal) : 0;
  const hi = maxVal !== "" ? Number(maxVal) : ceiling;
  const loPercent = ceiling > 0 ? (lo / ceiling) * 100 : 0;
  const hiPercent = ceiling > 0 ? (hi / ceiling) * 100 : 100;
  const isActive = lo > 0 || hi < ceiling;

  const setLo = (v) => {
    const clamped = Math.min(Number(v), hi);
    onChange(minKey, clamped === 0 ? "" : String(clamped));
  };
  const setHi = (v) => {
    const clamped = Math.max(Number(v), lo);
    onChange(maxKey, clamped === ceiling ? "" : String(clamped));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className={`text-sm font-medium ${isActive ? "text-indigo-700" : "text-gray-700"}`}>
          {label}
        </span>
        <span className="text-xs font-mono text-slate-500">{lo} – {hi}</span>
      </div>

      {/* Slider track + two thumbs */}
      <div className="relative mx-1" style={{ height: 20 }}>
        {/* Base track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded" />
        {/* Filled section */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-indigo-500 rounded"
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />
        {/* Min thumb — higher z when near the top to stay draggable */}
        <input type="range" min={0} max={ceiling} value={lo}
          onChange={(e) => setLo(e.target.value)}
          className="dual-thumb"
          style={{ zIndex: lo >= hi ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input type="range" min={0} max={ceiling} value={hi}
          onChange={(e) => setHi(e.target.value)}
          className="dual-thumb"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

// ─── Filter form (shared between desktop + mobile) ────────────────────────────
function FilterForm({ searchTerm, setSearchTerm, filters, setFilters, addKeyword, removeKeyword, uniqueValues, onClear }) {
  const maxV = uniqueValues.maxValues ?? { cost: 20, force: 12, chi: 12, focus: 6, honor: 12 };

  const setRange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const activeCount = [
    filters.clan, filters.type,
    filters.costMin, filters.costMax,
    filters.forceMin, filters.forceMax,
    filters.chiMin, filters.chiMax,
    filters.focusMin, filters.focusMax,
    filters.honorMin, filters.honorMax,
  ].filter(Boolean).length + filters.keywords.length;

  return (
    <div className="p-4 space-y-5">
      <style>{DUAL_THUMB_CSS}</style>
      {/* Text search */}
      <div>
        <input
          type="search"
          placeholder="Search name, text, keywords…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
        />
      </div>

      {/* Clan + Type */}
      <div className="space-y-3">
        <Select
          label="Clan"
          value={filters.clan}
          onChange={(e) => setFilters({ ...filters, clan: e.target.value })}
          options={uniqueValues.clans.map((c) => ({ value: c, label: c }))}
          placeholder="All Clans"
        />
        <Select
          label="Type"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          options={uniqueValues.types.map((t) => ({ value: t, label: t }))}
          placeholder="All Types"
        />
      </div>

      {/* Numeric range sliders */}
      <div className="space-y-4 border-t border-gray-100 pt-4">
        <RangeFilter label="Cost" minKey="costMin" maxKey="costMax"
          ceiling={maxV.cost} minVal={filters.costMin} maxVal={filters.costMax} onChange={setRange} />
        <RangeFilter label="Force" minKey="forceMin" maxKey="forceMax"
          ceiling={maxV.force} minVal={filters.forceMin} maxVal={filters.forceMax} onChange={setRange} />
        <RangeFilter label="Chi" minKey="chiMin" maxKey="chiMax"
          ceiling={maxV.chi} minVal={filters.chiMin} maxVal={filters.chiMax} onChange={setRange} />
        <RangeFilter label="Focus" minKey="focusMin" maxKey="focusMax"
          ceiling={maxV.focus} minVal={filters.focusMin} maxVal={filters.focusMax} onChange={setRange} />
        <RangeFilter label="Honor Requirement" minKey="honorMin" maxKey="honorMax"
          ceiling={maxV.honor} minVal={filters.honorMin} maxVal={filters.honorMax} onChange={setRange} />
      </div>

      {/* Keywords */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Keywords</span>
          {/* ANY / ALL toggle */}
          <button
            onClick={() => setFilters((prev) => ({
              ...prev,
              keywordsMode: prev.keywordsMode === "any" ? "all" : "any",
            }))}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
              filters.keywordsMode === "all"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-500 border-slate-300 hover:border-indigo-400"
            }`}
            title={filters.keywordsMode === "all"
              ? "Showing cards with ALL selected keywords — click for ANY"
              : "Showing cards with ANY selected keyword — click for ALL"}
          >
            {filters.keywordsMode === "all" ? "ALL" : "ANY"}
          </button>
        </div>
        <KeywordSearch
          availableKeywords={uniqueValues.keywords || []}
          selectedKeywords={filters.keywords}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
        />
      </div>

      {/* Active filter summary + clear */}
      {activeCount > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={onClear}
            className="w-full py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Clear {activeCount} active filter{activeCount !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
const Sidebar = ({
  searchTerm, setSearchTerm,
  filters, setFilters,
  addKeyword, removeKeyword,
  uniqueValues,
  isOpen, onToggle,
}) => {
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({
      clan: "", type: "",
      costMin: "", costMax: "",
      forceMin: "", forceMax: "",
      chiMin: "", chiMax: "",
      focusMin: "", focusMax: "",
      honorMin: "", honorMax: "",
      keywords: [],
      keywordsMode: "any",
    });
  };

  const formProps = { searchTerm, setSearchTerm, filters, setFilters, addKeyword, removeKeyword, uniqueValues, onClear: clearAllFilters };

  return (
    <>
      {/* ── Desktop sidebar — always visible, fixed width ── */}
      <div className="hidden md:flex bg-white shadow-lg flex-shrink-0 flex-col self-stretch w-72">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">Search & Filters</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FilterForm {...formProps} />
        </div>
      </div>

      {/* ── Mobile full-screen filter panel ── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
            <h2 className="text-base font-bold text-gray-800">Search & Filters</h2>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-6">
            <FilterForm {...formProps} />
          </div>

          {/* Sticky footer: Apply button */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white safe-area-pb">
            <button
              onClick={onToggle}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
