import { L5R_KEYWORDS } from "../constants/index.js";

/**
 * Extract keywords from card data
 * @param {Object} card - Card object from JSON
 * @returns {Array} Array of extracted keywords
 */
/**
 * Parse a raw keyword line (may contain HTML tags and &#8226; entities) into
 * individual keyword tokens that are present in the L5R_KEYWORDS whitelist.
 *
 * Handles compound tokens like "Ratling Creature" (a single bullet segment that
 * is itself not a keyword) by also checking each space-separated word inside it,
 * so both "Ratling" and "Creature" are still extracted.
 */
const parseKeywordLine = (raw) => {
  const found = [];

  raw
    .replace(/&#8226;/g, "\u2022")
    .replace(/<[^>]*>/g, "")
    .split(/[•·\u2022]/)
    .map((k) => k.trim())
    .filter((k) => k && !k.endsWith(":"))
    .forEach((token) => {
      if (L5R_KEYWORDS.includes(token)) {
        if (!found.includes(token)) found.push(token);
      } else {
        // Compound token (e.g. "Ratling Creature"): check each word individually
        token
          .split(/\s+/)
          .filter((word) => L5R_KEYWORDS.includes(word))
          .forEach((word) => {
            if (!found.includes(word)) found.push(word);
          });
      }
    });

  return found;
};

export const extractKeywords = (card) => {
  const keywords = [];

  // Start with the dedicated keywords array (may be incomplete in the data).
  if (card.keywords && Array.isArray(card.keywords)) {
    card.keywords.forEach((keyword) => {
      const cleanKeyword = keyword.replace(/<[^>]*>/g, "").trim();
      if (cleanKeyword && !keywords.includes(cleanKeyword)) {
        keywords.push(cleanKeyword);
      }
    });
  }

  // The top-level `text` field has the keyword line already stripped out.
  // The full original text (with the keyword block) is preserved in each
  // printing's `text` field, e.g.:
  //   "<b>Nonhuman &#8226; Ratling &#8226; One Tribe &#8226; Scavenger</b> <br>…"
  // Parse it to pick up any keywords missing from the dedicated array.
  const printingTexts = card.printing
    ?.map((p) => p.text?.[0])
    .filter(Boolean) ?? [];

  for (const raw of printingTexts) {
    // Extract everything before the first <br> as the keyword line.
    const beforeBr = raw.split(/<br\s*\/?>/i)[0];
    parseKeywordLine(beforeBr).forEach((kw) => {
      if (!keywords.includes(kw)) keywords.push(kw);
    });
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
// mode: "any" (default) = card has at least one selected keyword
//       "all"           = card has every selected keyword
export const filterByKeywords = (cards, selectedKeywords, mode = "any") => {
  if (!selectedKeywords || selectedKeywords.length === 0) {
    return cards;
  }

  return cards.filter((card) => {
    const cardKeywords = card.keywords || [];
    if (mode === "all") {
      return selectedKeywords.every((kw) => cardKeywords.includes(kw));
    }
    return selectedKeywords.some((kw) => cardKeywords.includes(kw));
  });
};
