/**
 * Persistent cache for card image paths.
 *
 * Responsibilities:
 *  - In-memory Map shared with imageService (findCardImage reads/writes it)
 *  - localStorage read/write helpers (init on load, save on discovery)
 *  - Public cache-clearing exports consumed by App, DeckPage, DeckEditor
 *  - Bulk localStorage save/load used by cardService
 */

const STORAGE_KEY_PATHS = "l5r_image_paths";
const STORAGE_KEY_CARDS = "l5r_cards_with_images";

// In-memory cache shared with imageService via named export
export const imagePathCache = new Map();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function initializeImageCache() {
  try {
    const cachedPaths = localStorage.getItem(STORAGE_KEY_PATHS);
    if (cachedPaths) {
      const imagePaths = JSON.parse(cachedPaths);
      Object.entries(imagePaths).forEach(([cardName, imagePath]) => {
        imagePathCache.set(cardName, imagePath);
      });
    }
  } catch (error) {
    console.warn("Failed to initialize image cache from localStorage:", error);
  }
}

// Populate cache from localStorage on module load
initializeImageCache();

/**
 * Persist a single discovered image path so future page loads skip the lookup.
 * @param {string} cardName
 * @param {string} imagePath
 */
export function saveImagePathToLocalStorage(cardName, imagePath) {
  try {
    const existingPaths = localStorage.getItem(STORAGE_KEY_PATHS);
    const imagePaths = existingPaths ? JSON.parse(existingPaths) : {};
    imagePaths[cardName] = imagePath;
    localStorage.setItem(STORAGE_KEY_PATHS, JSON.stringify(imagePaths));
  } catch (error) {
    console.warn("Failed to save image path to localStorage:", error);
  }
}

// ---------------------------------------------------------------------------
// Cache-clearing exports
// ---------------------------------------------------------------------------

/** Clear the in-memory cache and remove the localStorage entry. */
export function clearImageCache() {
  imagePathCache.clear();
  localStorage.removeItem(STORAGE_KEY_PATHS);
}

/** Clear the in-memory cache without touching localStorage. */
export function clearImagePathCache() {
  imagePathCache.clear();
}

/**
 * Clear all caches (image paths + service-worker caches) and reload the page.
 */
export function clearAllCaches() {
  clearImageCache();

  if ("caches" in window) {
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name)))
      )
      .then(() => window.location.reload());
  } else {
    window.location.reload();
  }
}

// ---------------------------------------------------------------------------
// Bulk card-with-images persistence (used by cardService)
// ---------------------------------------------------------------------------

/**
 * Save cards that have resolved image paths to localStorage.
 * Falls back to saving just the path map when the full card array is too large.
 * @param {Array} cards
 */
export function saveCardsWithImagePaths(cards) {
  try {
    const cardsWithImages = cards.filter((card) => card.imagePath);
    if (cardsWithImages.length > 0) {
      localStorage.setItem(
        STORAGE_KEY_CARDS,
        JSON.stringify(cardsWithImages)
      );
    }
  } catch (error) {
    console.warn("Failed to save cards to localStorage:", error);
    try {
      const imagePaths = {};
      cards.forEach((card) => {
        if (card.imagePath) {
          imagePaths[card.name] = card.imagePath;
        }
      });
      localStorage.setItem(STORAGE_KEY_PATHS, JSON.stringify(imagePaths));
    } catch (fallbackError) {
      console.warn(
        "Failed to save even image paths to localStorage:",
        fallbackError
      );
    }
  }
}

/**
 * Load cached card objects (with imagePath set) from localStorage.
 * @returns {Array|null}
 */
export function loadCardsWithImagePaths() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CARDS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn("Failed to load cards from localStorage:", error);
  }
  return null;
}

/**
 * Load the card-name → image-path map from localStorage.
 * @returns {Object|null}
 */
export function loadImagePaths() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_PATHS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn("Failed to load image paths from localStorage:", error);
  }
  return null;
}

/**
 * Trigger a browser download of the cached cards JSON.
 * Useful for regenerating the shipped card data file after a crawl run.
 */
export function exportCardsWithImagePaths() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CARDS);
    if (cached) {
      const blob = new Blob([cached], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cards_with_images.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.warn("No cached cards found");
    }
  } catch (error) {
    console.error("Failed to export cards:", error);
  }
}
