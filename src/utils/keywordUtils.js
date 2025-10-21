import { L5R_KEYWORDS } from "../constants/index.js";

/**
 * Extract keywords from card data
 * @param {Object} card - Card object from JSON
 * @returns {Array} Array of extracted keywords
 */
export const extractKeywords = (card) => {
  const keywords = [];

  // Extract from dedicated keywords field if available
  if (card.keywords && Array.isArray(card.keywords)) {
    card.keywords.forEach((keyword) => {
      // Remove HTML tags and clean up
      const cleanKeyword = keyword.replace(/<[^>]*>/g, "").trim();
      if (cleanKeyword && !keywords.includes(cleanKeyword)) {
        keywords.push(cleanKeyword);
      }
    });
  }

  // Extract from text field if no dedicated keywords
  if (keywords.length === 0 && card.text && Array.isArray(card.text)) {
    const text = card.text.join(" ");

    // Look for bullet-separated keywords at the start
    const bulletMatch = text.match(/^([^<]+?)(?=<br|<BR|\n)/);
    if (bulletMatch) {
      const keywordLine = bulletMatch[1];
      const bulletKeywords = keywordLine
        .split(/[•·\u2022]/)
        .map((k) => k.trim())
        .filter((k) => k);

      bulletKeywords.forEach((keyword) => {
        if (L5R_KEYWORDS.includes(keyword) && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      });
    }

    // Look for standalone bold keywords (but exclude mechanics like "Reaction:")
    const boldMatches = text.match(/<b>([^<]+)<\/b>/g);
    if (boldMatches) {
      boldMatches.forEach((match) => {
        const keyword = match.replace(/<[^>]*>/g, "").trim();
        // Exclude mechanics that end with colon (like "Reaction:", "Battle:", etc.)
        if (
          !keyword.endsWith(":") &&
          L5R_KEYWORDS.includes(keyword) &&
          !keywords.includes(keyword)
        ) {
          keywords.push(keyword);
        }
      });
    }
  }

  return keywords;
};

/**
 * Clean text by removing keyword lines
 * @param {string} text - Original text
 * @returns {string} Cleaned text
 */
export const cleanTextFromKeywords = (text) => {
  if (!text) return "";

  // Remove bullet-separated keyword line at start
  let cleaned = text.replace(/^([^<]+?)(?=<br|<BR|\n)/, "");

  // Remove standalone bold keywords at start
  cleaned = cleaned.replace(/^<b>([^<]+)<\/b>(<br>|<BR>|\n)/, "");

  return cleaned.trim();
};

/**
 * Get unique keywords from all cards
 * @param {Array} cards - Array of card objects
 * @returns {Array} Sorted array of unique keywords
 */
export const getUniqueKeywords = (cards) => {
  const keywordSet = new Set();

  cards.forEach((card) => {
    // Use the already-extracted keywords from the card object
    const keywords = card.keywords || [];
    keywords.forEach((keyword) => keywordSet.add(keyword));
  });

  return Array.from(keywordSet).sort();
};

/**
 * Filter cards by keywords
 * @param {Array} cards - Array of card objects
 * @param {Array} selectedKeywords - Array of selected keywords
 * @returns {Array} Filtered cards
 */
export const filterByKeywords = (cards, selectedKeywords) => {
  if (!selectedKeywords || selectedKeywords.length === 0) {
    return cards;
  }

  return cards.filter((card) => {
    // Use the already-extracted keywords from the card object
    const cardKeywords = card.keywords || [];
    return selectedKeywords.some((keyword) => cardKeywords.includes(keyword));
  });
};
