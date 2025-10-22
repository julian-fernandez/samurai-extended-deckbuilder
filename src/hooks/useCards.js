import { useState, useEffect, useCallback } from "react";
import {
  loadCards,
  filterCards,
  getUniqueValues,
} from "../services/cardService";

export const useCards = () => {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueValues, setUniqueValues] = useState({
    clans: [],
    types: [],
    keywords: [],
  });

  // Load cards on mount
  useEffect(() => {
    const loadCardsData = async () => {
      setLoading(true);
      try {
        const loadedCards = await loadCards();
        setCards(loadedCards);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCardsData();
  }, []);

  // Update unique values when cards change
  useEffect(() => {
    if (cards.length > 0) {
      setUniqueValues(getUniqueValues(cards));
    }
  }, [cards]);

  const filterCardsData = useCallback(
    (searchTerm, filters) => {
      const filtered = filterCards(cards, { searchTerm, ...filters });
      setFilteredCards(filtered);
    },
    [cards]
  );

  return {
    cards,
    filteredCards,
    loading,
    uniqueValues,
    filterCardsData,
  };
};
