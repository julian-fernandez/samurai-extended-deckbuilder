import { useState, useCallback } from "react";

export const useCardPreview = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCardHover = useCallback((card) => {
    setHoveredCard(card);
  }, []);

  return {
    hoveredCard,
    handleCardHover,
  };
};
