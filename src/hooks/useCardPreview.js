import { useState, useEffect } from "react";

export const useCardPreview = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for card preview
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleCardHover = (card) => {
    setHoveredCard(card);
  };

  return {
    hoveredCard,
    mousePosition,
    handleCardHover,
  };
};
