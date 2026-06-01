import { useState } from "react";

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
    honorMin: "",
    honorMax: "",
    keywords: [],
    keywordsMode: "any",
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

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    addKeyword,
    removeKeyword,
  };
};
