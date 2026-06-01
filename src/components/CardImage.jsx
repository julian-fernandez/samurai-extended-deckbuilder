import React, { useState } from "react";

/**
 * Card image component with lazy loading and fallback support.
 */
export default function CardImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  onLoad,
  onError,
}) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    onLoad?.(src);
  };

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 min-h-48 ${fallbackClassName}`}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🃏</div>
          <div className="text-xs">No Image</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
