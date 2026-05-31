import { L5R_KEYWORDS } from "../constants/index.js";

/**
 * Return true only if a text segment looks like a keyword block, i.e. it
 * contains bullet separators (&#8226; / •) or begins with a <b>…</b> tag.
 * Plain rules sentences ("After your next Events Phase begins…") are rejected
 * so their words are never mistaken for keywords.
 */
const isKeywordBlock = (raw) => {
  const norm = raw.replace(/&#8226;/g, "\u2022");
  return norm.includes("\u2022") || /^<b>[^<]+<\/b>/.test(norm.trimStart());
};

/**
 * Parse a keyword block into individual keyword tokens present in L5R_KEYWORDS.
 *
 * Compound bullet segments like "Ratling Creature" (where the whole token is
 * not itself a keyword) are split word-by-word so "Ratling" and "Creature" are
 * each captured. This is safe here because the caller already verified the
 * segment is a keyword block, not a rules sentence.
 */
const parseKeywordBlock = (raw) => {
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

/**
 * Extract keywords from card data.
 * @param {Object} card - Card object from JSON
 * @returns {Array} Array of extracted keywords
 */
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
    const beforeBr = raw.split(/<br\s*\/?>/i)[0];
    if (!isKeywordBlock(beforeBr)) continue;
    parseKeywordBlock(beforeBr).forEach((kw) => {
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
