import { useState, useEffect, useRef } from "react";

export const usePagination = (filteredCards, cardsPerPage = 24) => {
  const [currentPage, setCurrentPage] = useState(1);
  const prevFilteredCardsRef = useRef(filteredCards);

  // Reset to first page when filtered cards change
  useEffect(() => {
    if (prevFilteredCardsRef.current !== filteredCards) {
      setCurrentPage(1);
      prevFilteredCardsRef.current = filteredCards;
    }
  }, [filteredCards]);

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    currentPage,
    totalPages,
    currentCards,
    handlePageChange,
  };
};
