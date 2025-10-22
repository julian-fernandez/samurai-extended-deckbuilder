import { useState, useEffect, useRef } from "react";

export const useFilters = () => {
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
    handleFilterChange,
  };
};
