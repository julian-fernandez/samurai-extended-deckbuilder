/**
 * Service for resolving card image paths.
 *
 * Responsibilities:
 *  - Map internal set names to image folder names (SET_FOLDER_MAP)
 *  - Build candidate filenames for a card (generateAlternativeFilenames)
 *  - Return the best image URL for a card (findCardImage)
 *
 * Cache read/write and localStorage persistence live in imageCacheService.js.
 * The brute-force folder-walking crawler lives in scripts/imageCrawler.js.
 */

import {
  imagePathCache,
} from "./imageCacheService.js";

// Base URL for images — set VITE_IMAGES_BASE_URL in your .env / Netlify env
// vars to point at your Cloudflare R2 public bucket (e.g. https://pub-xxx.r2.dev).
// Leave empty and images fall back to /images/ served locally.
const IMAGES_BASE_URL = (import.meta.env.VITE_IMAGES_BASE_URL || "").replace(
  /\/$/,
  ""
);

/**
 * Resolve a relative image path to an absolute URL using the configured base.
 * Paths that are already absolute (http/https) are returned unchanged.
 */
function resolveImagePath(path) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return IMAGES_BASE_URL + path;
}

// Map internal set names to the folder names used on the image host
export const SET_FOLDER_MAP = {
  emperor: [
    "Emperor Edition",
    "Emperor Edition Demo Decks",
    "Emperor Edition Gempukku",
    "Promotional-Emperor",
    "Promotional–Emperor",
  ],
  celestial: [
    "Celestial Edition",
    "Celestial Edition 15th Anniversary",
    "Promotional-Celestial",
    "Promotional–Celestial",
  ],
  samurai: ["Samurai Edition", "Samurai Edition Banzai", "Promotional-Samurai"],
  "20F": ["Twenty Festivals", "Promotional-Twenty Festivals"],
  ivory: ["Ivory Edition", "Promotional-Ivory"],
};

/**
 * Generate alternative filenames for cards with special characters.
 * @param {string} cardName
 * @returns {Array<string>}
 */
function generateAlternativeFilenames(cardName) {
  const alternatives = [cardName];

  alternatives.push(cardName.replace(/&#149;/g, "•"));
  alternatives.push(cardName.replace(/&#8226;/g, "•"));
  alternatives.push(cardName.replace(/•/g, "&#149;"));

  const suffixes = [
    " - exp",
    " - exp 2",
    " - Experienced",
    " - Experienced 2",
    " &#149; Experienced",
    " &#149; Experienced 2",
    " • Experienced",
    " • Experienced 2",
  ];

  suffixes.forEach((suffix) => {
    alternatives.push(cardName + suffix);
  });

  const baseName = cardName.replace(/\s*[-•]\s*(exp|experienced).*$/i, "");
  if (baseName !== cardName) {
    alternatives.push(baseName);
    suffixes.forEach((suffix) => {
      alternatives.push(baseName + suffix);
    });
  }

  return [...new Set(alternatives)];
}

/**
 * Return the best image URL for a card.
 *
 * Priority:
 *  1. card.imagePath baked into the JSON data
 *  2. In-memory cache (populated from localStorage by imageCacheService)
 *  3. First plausible path constructed from the card's legal sets
 *
 * @param {Object} card
 * @returns {string|null}
 */
export function findCardImage(card) {
  if (!card) return null;

  const cardName =
    (card.title && card.title[0]) || card.formattedtitle || card.name;
  if (!cardName) return null;

  const cacheKey = cardName;

  // card.imagePath (from JSON) takes priority over any stale localStorage cache
  if (card.imagePath) {
    const resolved = resolveImagePath(card.imagePath);
    imagePathCache.set(cacheKey, resolved);
    return resolved;
  }

  // Fall back to in-memory cache (populated from localStorage) only when
  // the card has no imagePath baked into the JSON data
  if (imagePathCache.has(cacheKey)) {
    return resolveImagePath(imagePathCache.get(cacheKey));
  }

  const legalSets = card.legal || [];

  let alternativeNames;
  if (card.originalData) {
    alternativeNames = [];

    if (card.originalData.formattedtitle) {
      alternativeNames.push(card.originalData.formattedtitle);
      const webFriendlyTitle = card.originalData.formattedtitle
        .replace(/&#149;/g, " -")
        .replace(/&#8226;/g, " -")
        .replace(/•/g, " -")
        .replace(/\s+/g, " ");
      alternativeNames.push(webFriendlyTitle);
    }

    if (card.originalData.puretexttitle) {
      alternativeNames.push(card.originalData.puretexttitle);
    }

    alternativeNames.push(cardName);
  } else {
    alternativeNames = generateAlternativeFilenames(cardName);
  }

  // Try each legal set in order of preference
  for (const set of legalSets) {
    const folders = SET_FOLDER_MAP[set.toLowerCase()];
    if (!folders) continue;

    for (const folder of folders) {
      return resolveImagePath(`/images/${folder}/${alternativeNames[0]}.jpg`);
    }
  }

  // Fallback: try all folders
  const allFolders = Object.values(SET_FOLDER_MAP).flat();
  for (const folder of allFolders) {
    return resolveImagePath(`/images/${folder}/${alternativeNames[0]}.jpg`);
  }

  imagePathCache.set(cacheKey, null);
  return null;
}

/**
 * Return all image folders defined in SET_FOLDER_MAP.
 * @returns {Array<string>}
 */
export function getAvailableImageFolders() {
  return Object.values(SET_FOLDER_MAP).flat();
}
