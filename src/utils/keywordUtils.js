import { L5R_KEYWORDS } from "../constants/index.js";

/**
 * Return true only if a text segment looks like a keyword block.
 *
 * Two valid forms:
 *   1. Bold-wrapped:  <b>Samurai • Courtier</b>
 *   2. Bare bullets:  Samurai • Courtier • Scout
 *
 * Action-cost lines like "Courtier • Open: Do something" are explicitly
 * rejected: they contain a colon after the bullet tokens, which is never
 * present in a keyword declaration block.
 */
const isKeywordBlock = (raw) => {
  const norm = raw.replace(/&#8226;/g, "\u2022");
  // Bold keyword declaration is always a keyword block.
  if (/^<b>[^<]+<\/b>/.test(norm.trimStart())) return true;
  // Bare bullet list — only if there is no colon (colon signals an action cost).
  const textOnly = norm.replace(/<[^>]*>/g, "").trim();
  return textOnly.includes("\u2022") && !textOnly.includes(":");
};

/**
 * Parse a keyword block into individual keyword tokens present in L5R_KEYWORDS.
 *
 * For bold-wrapped blocks (<b>Samurai • Courtier</b>) only the content inside
 * the <b>…</b> tags is inspected — text that follows on the same line (action
 * cost descriptions like "Bow a Personality") is ignored.
 *
 * For bare bullet blocks (no bold wrapper) the whole segment is parsed, but
 * the word-split fallback only fires when every word in the token is itself a
 * keyword, preventing plain sentences from being mis-tokenised.
 */
const parseKeywordBlock = (raw) => {
  const found = [];

  // For bold-wrapped keyword lines, only parse inside <b>…</b> tags.
  const isBoldWrapped = /^<b>[^<]+<\/b>/.test(raw.trimStart());
  let segment;
  if (isBoldWrapped) {
    segment = [...raw.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1]).join(" \u2022 ");
  } else {
    segment = raw.replace(/&#8226;/g, "\u2022").replace(/<[^>]*>/g, "");
  }

  segment
    .replace(/&#8226;/g, "\u2022")
    .split(/[•·\u2022]/)
    .map((k) => k.trim())
    .filter((k) => k && !k.endsWith(":"))
    .forEach((token) => {
      if (L5R_KEYWORDS.includes(token)) {
        if (!found.includes(token)) found.push(token);
      } else {
        // Fallback word-split for compound tokens like "Ratling Creature".
        // Only fires when every word is a known keyword to prevent sentences
        // like "Bow a Personality" from contributing false keywords.
        const words = token.split(/\s+/);
        if (words.length > 1 && words.every((w) => L5R_KEYWORDS.includes(w))) {
          words.forEach((w) => {
            if (!found.includes(w)) found.push(w);
          });
        }
      }
    });

  return found;
};

/**
 * Card types whose raw `keywords` array stores action requirements
 * ("Bow a Personality", "Target a Samurai") rather than card properties.
 * For these types we skip the raw array and rely solely on text extraction.
 */
const SKIP_RAW_KEYWORDS_TYPES = new Set([
  "strategy", "spell", "ring", "event", "celestial", "region",
]);

/**
 * Extract keywords from card data.
 * @param {Object} card - Card object from JSON
 * @returns {Array} Array of extracted keywords
 */
export const extractKeywords = (card) => {
  const keywords = [];
  const cardType = (card.type?.[0] ?? "").toLowerCase();

  // For action cards the raw `keywords` array contains action requirements
  // (e.g. "Bow", "Personality", "Ashigaru") rather than actual card keywords.
  // Skip it for those types; text extraction below is more reliable.
  if (!SKIP_RAW_KEYWORDS_TYPES.has(cardType) && Array.isArray(card.keywords)) {
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
