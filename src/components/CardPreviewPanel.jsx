import { useState, useEffect } from "react";

const CardPreviewPanel = ({ card, isVisible, position }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (card) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [card]);

  if (!isVisible || !card) return null;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm"
      style={{
        top: position.y - 10,
        left: position.x + 20,
        transform: "translateY(-50%)",
      }}
    >
      {/* Card Image */}
      <div className="mb-3">
        {!imageError ? (
          <img
            src={card.imagePath}
            alt={card.name}
            className="w-full h-auto rounded-lg shadow-sm"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? "block" : "none" }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">Image not available</span>
          </div>
        )}

        {!imageLoaded && !imageError && (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-sm">{card.name}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="bg-gray-100 px-2 py-1 rounded">{card.type}</span>
          {card.cost && <span>Cost: {card.cost}</span>}
          {card.force && <span>Force: {card.force}</span>}
          {card.chi && <span>Chi: {card.chi}</span>}
        </div>
        {card.text && (
          <p className="text-xs text-gray-700 line-clamp-3">
            {card.text.replace(/<[^>]*>/g, "")}
          </p>
        )}
      </div>
    </div>
  );
};

export default CardPreviewPanel;
