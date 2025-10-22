import { SAMURAI_EXTENDED_SETS } from "../constants/index.js";
import {
  extractKeywords,
  cleanTextFromKeywords,
  filterByKeywords,
} from "../utils/keywordUtils.js";
import {
  filterByText,
  filterByClan,
  filterByType,
  filterByRange,
} from "../utils/filterUtils.js";
import { saveCardsWithImagePaths, loadImagePaths } from "./imageService.js";

/**
 * Load and parse cards from JSON
 * @returns {Promise<Array>} Array of parsed cards
 */
export const loadCards = async () => {
  try {
    // First, try to load cached cards with image paths
    // Temporarily disabled to force fresh load
    // const cachedCards = loadCardsWithImagePaths();
    // if (cachedCards && cachedCards.length > 0) {
    //   console.log(
    //     `Loaded ${cachedCards.length} cards from cache with image paths`
    //   );
    //   return cachedCards;
    // }

    const response = await fetch(`/cards_v3.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid JSON format: expected array of cards");
    }

    // For now, consider all cards legal (no filtering)
    const legalCards = data;

    // Transform cards to our format
    const transformedCards = legalCards.map((card) => ({
      id: card.cardid?.toString() || Math.random().toString(),
      name: card.title?.[0] || "Unknown",
      type: card.type?.[0] || "Unknown",
      clan: card.clan?.[0] || null,
      cost: card.cost?.[0] || "0",
      force: card.force?.[0] || "0",
      chi: card.chi?.[0] || "0",
      focus: card.focus?.[0] || "0",
      personalHonor: card.personalHonor?.[0] || "0",
      honorRequirement: card.honorRequirement?.[0] || "0",
      goldProduction: card.goldProduction?.[0] || "0",
      text: card.text?.[0] || "",
      keywords: extractKeywords(card),
      imagehash: card.imagehash || null,
      imagePath: card.imagePath || null, // Preserve image path from JSON
      hasBackside: card.hasBackside || false,
      backsideImagePath: card.backsideImagePath || null,
      backsideText: card.backsideText || null,
      backsideSet: card.backsideSet || null,
      backsideKeywords: card.backsideKeywords || [],
      banned: card.banned || false,
      bannedReason: card.bannedReason || null,
      deck: card.deck?.[0] || "Dynasty",
      rarity: card.printing?.[0]?.rarity?.[0] || "Unknown",
      artist: card.printing?.[0]?.artist?.[0] || "Unknown",
      set: card.printing?.[0]?.set?.[0] || "Unknown",
      editions: card.printing?.map((p) => p.set?.[0]).filter(Boolean) || [],
      // Keep original data for reference
      originalData: card,
    }));

    console.log(`Loaded ${transformedCards.length} cards from JSON`);

    // Try to load cached image paths and apply them to cards
    const cachedImagePaths = loadImagePaths();
    if (cachedImagePaths) {
      transformedCards.forEach((card) => {
        if (cachedImagePaths[card.name]) {
          card.imagePath = cachedImagePaths[card.name];
        }
      });
      console.log(
        `Applied ${Object.keys(cachedImagePaths).length} cached image paths`
      );
    }

    // Save the cards to cache for future use (only if they have image paths)
    // Temporarily disabled to avoid localStorage quota exceeded error
    // saveCardsWithImagePaths(transformedCards);

    return transformedCards;
  } catch (error) {
    console.error("Error loading cards:", error);
    return [];
  }
};

/**
 * Update cards with new image paths and save to cache
 * @param {Array} cards - Array of cards to update
 * @param {string} cardName - Name of the card to update
 * @param {string} imagePath - New image path
 */
export const updateCardImagePath = (cards, cardName, imagePath) => {
  const updatedCards = cards.map((card) => {
    if (card.name === cardName) {
      return { ...card, imagePath };
    }
    return card;
  });

  // Save updated cards to cache
  saveCardsWithImagePaths(updatedCards);

  return updatedCards;
};

/**
 * Filter cards based on search criteria
 * @param {Array} cards - Array of cards
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered cards
 */
export const filterCards = (cards, filters) => {
  let filteredCards = [...cards];

  // Text search
  if (filters.searchTerm) {
    filteredCards = filterByText(filteredCards, filters.searchTerm);
  }

  // Clan filter
  if (filters.clan && filters.clan !== "all") {
    filteredCards = filterByClan(filteredCards, filters.clan);
  }

  // Type filter
  if (filters.type && filters.type !== "all") {
    filteredCards = filterByType(filteredCards, filters.type);
  }

  // Keyword filter
  if (filters.keywords && filters.keywords.length > 0) {
    filteredCards = filterByKeywords(filteredCards, filters.keywords);
  }

  // Numerical range filters
  if (filters.costMin !== undefined || filters.costMax !== undefined) {
    filteredCards = filterByRange(
      filteredCards,
      "cost",
      filters.costMin,
      filters.costMax
    );
  }

  if (filters.forceMin !== undefined || filters.forceMax !== undefined) {
    filteredCards = filterByRange(
      filteredCards,
      "force",
      filters.forceMin,
      filters.forceMax
    );
  }

  if (filters.chiMin !== undefined || filters.chiMax !== undefined) {
    filteredCards = filterByRange(
      filteredCards,
      "chi",
      filters.chiMin,
      filters.chiMax
    );
  }

  if (filters.focusMin !== undefined || filters.focusMax !== undefined) {
    filteredCards = filterByRange(
      filteredCards,
      "focus",
      filters.focusMin,
      filters.focusMax
    );
  }

  return filteredCards;
};

/**
 * Get unique values for filter dropdowns
 * @param {Array} cards - Array of cards
 * @returns {Object} Unique values for each field
 */
export const getUniqueValues = (cards) => {
  return {
    clans: getUniqueValuesForField(cards, "clan"),
    types: getUniqueValuesForField(cards, "type"),
    keywords: getUniqueKeywords(cards),
  };
};

/**
 * Get unique keywords from all cards
 * @param {Array} cards - Array of cards
 * @returns {Array} Sorted unique keywords
 */
const getUniqueKeywords = (cards) => {
  const keywordSet = new Set();

  cards.forEach((card) => {
    if (card.keywords && Array.isArray(card.keywords)) {
      card.keywords.forEach((keyword) => keywordSet.add(keyword));
    }
  });

  return Array.from(keywordSet).sort();
};

/**
 * Get unique values for a specific field
 * @param {Array} cards - Array of cards
 * @param {string} field - Field name
 * @returns {Array} Sorted unique values
 */
const getUniqueValuesForField = (cards, field) => {
  const valueSet = new Set();

  cards.forEach((card) => {
    const value = card[field];
    if (value) {
      if (Array.isArray(value)) {
        // Handle array fields (like type, clan, etc.)
        value.forEach((item) => valueSet.add(item));
      } else {
        // Handle single value fields
        valueSet.add(value);
      }
    }
  });

  return Array.from(valueSet).sort();
};

/**
 * Format card text by removing keywords
 * @param {string} text - Original text
 * @returns {string} Cleaned text
 */
export const formatCardText = (text) => {
  return cleanTextFromKeywords(text);
};

/**
 * Get card image URL
 * @param {Object} card - Card object
 * @param {string} baseUrl - Base URL for images
 * @returns {string} Image URL
 */
export const getCardImageUrl = (card, baseUrl = "") => {
  if (!card.imagehash) {
    return null;
  }

  return `${baseUrl}/images/cards/${card.imagehash}.jpg`;
};
