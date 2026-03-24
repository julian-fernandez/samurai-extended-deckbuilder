/**
 * build_json_from_xml_v4.js
 *
 * Improved XML → JSON conversion with three bug fixes over v3:
 *
 * FIX 1 — Malformed bold tags in XML source
 *   Some cards have <b>content<b> (missing slash on close) or an orphaned </b>
 *   at the start of the keyword block (missing open tag). Both cause the
 *   keyword regex to silently drop all keywords. Pre-processing normalises them.
 *   Affected example: Weathered Armor (<b>Armor<b>), Tsuruchi - inexp (no <b>).
 *
 * FIX 2 — <i> tags nested inside <b> keyword blocks
 *   Several cards embed an italicised ship/title name inside the keyword bold
 *   block: <b>Mercenary • Naval • Captain of <i>The Tachikaze</i></b>.
 *   The regex [^<]+ used to extract bold content stops at the first '<',
 *   causing ALL keywords in that block to be dropped. Pre-processing strips
 *   inner tags from bold blocks before keyword extraction.
 *   Affected examples: Chun, Yoritomo Hofu.
 *
 * FIX 3 — Two-word traits misclassified as sentence starts
 *   The heuristic /^[A-Z][a-z]+ [a-z]+/i flags "Bushido Virtue" and "Dark Virtue"
 *   as sentence-like text, causing the parser to return [] for those cards.
 *   Fix: before applying the sentence heuristic, check if the full text is itself
 *   a known keyword. If so, return it directly.
 *   Affected examples: Courage, A Warrior's Patience, Will, Wrath, etc. (14 cards).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load L5R_KEYWORDS ───────────────────────────────────────────────────────
const constantsPath = path.join(__dirname, "src", "constants", "index.js");
const constantsContent = fs.readFileSync(constantsPath, "utf8");
const keywordMatches = constantsContent.match(
  /export const L5R_KEYWORDS = \[([\s\S]*?)\];/
);
const L5R_KEYWORDS = keywordMatches
  ? keywordMatches[1]
      .split("\n")
      .map((line) => line.trim().replace(/[",]/g, ""))
      .filter((keyword) => keyword && !keyword.startsWith("//"))
      .map((keyword) => keyword.replace(/^["']|["']$/g, ""))
  : [];
// Also keep as a Set for O(1) lookups in hot paths
const L5R_KEYWORDS_SET = new Set(L5R_KEYWORDS);

console.log(`Loaded ${L5R_KEYWORDS.length} keywords from constants`);

// ─── Load image mapping ───────────────────────────────────────────────────────
const mappingPath = path.join(__dirname, "card_image_mapping.json");
let cardImageMap = {};
if (fs.existsSync(mappingPath)) {
  cardImageMap = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  console.log(`Loaded ${Object.keys(cardImageMap).length} image mappings`);
} else {
  console.log("No image mapping found. Run find_actual_images.js first.");
  process.exit(1);
}

// ─── Parse XML ───────────────────────────────────────────────────────────────
const xmlPath = path.join(__dirname, "public", "samuraiextendeddb.xml");
const xmlData = fs.readFileSync(xmlPath, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
});
const xmlCards = parser.parse(xmlData);
console.log("Parsed XML data");

// ─── FIX 1 + FIX 2: Pre-process XML text ─────────────────────────────────────
// Normalises malformed tags and strips nested <i>/<B> tags inside bold blocks
// so downstream regexes can reliably extract keyword content.
function preProcessText(text) {
  if (!text || typeof text !== "string") return text;

  // Fix 1a: <b>content<b> (missing slash) → <b>content</b>
  // We only do one level; the pattern is: <b> then non-< chars then <b> again
  text = text.replace(/<b>([^<]*)<b>/gi, "<b>$1</b>");

  // Fix 1b: orphaned </b> at the very start of the keyword block (before the
  //          first <br>) — add the missing open tag so the block reads as bold.
  //          Detect: text starts with non-tag chars followed by </b>
  //          e.g. "Mantis Clan • ... • Unique</b> <br>..."
  const firstBrIdx = text.search(/<br\s*\/?>/i);
  const head = firstBrIdx > 0 ? text.substring(0, firstBrIdx) : text;
  // If the head has a </b> but no <b>, prepend <b>
  if (/<\/b>/i.test(head) && !/<b>/i.test(head)) {
    text = "<b>" + text;
  }

  // Fix 2: strip inner tags from inside <b>…</b> blocks so [^<]+ works.
  // Handles: <b>Keyword • Captain of <i>The Tachikaze</i></b>
  // After: <b>Keyword • Captain of The Tachikaze</b>
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, (_match, content) => {
    const stripped = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `<b>${stripped}</b>`;
  });

  return text;
}

// ─── Extract keywords from text ──────────────────────────────────────────────
function extractKeywordsFromText(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const text = preProcessText(rawText);

  // Only extract keywords from the keyword block = before the first <br>/<BR>
  const firstBrIndex = text.search(/<br>|<BR>/i);
  const keywordText = firstBrIndex > 0 ? text.substring(0, firstBrIndex) : text;

  const keywords = [];
  const delimiter = "|||";

  // Strip tags for sentence-start heuristic
  const textWithoutTags = keywordText.replace(/<[^>]*>/g, "").trim();

  // FIX 3: if the entire keyword block (after tag-stripping) is itself a known
  // keyword, return it directly — don't run the sentence-start heuristic.
  if (L5R_KEYWORDS_SET.has(textWithoutTags)) {
    return [textWithoutTags];
  }

  const hasKeywordSeparators = /[•&#8226;&#149;]/.test(keywordText);

  // Sentence-start patterns: these tokens are verbs/pronouns starting ability text
  const sentenceStartPatterns = [
    /^This /i,
    /^Your /i,
    /^While /i,
    /^After /i,
    /^When /i,
    /^If /i,
    /^Bow [a-z]/i,
  ];

  const twoWordPattern = /^[A-Z][a-z]+ [a-z]+/i;
  const isTwoWordSentence =
    !hasKeywordSeparators &&
    twoWordPattern.test(textWithoutTags) &&
    // FIX 3 (secondary): don't flag as sentence if it's in the keyword list
    !L5R_KEYWORDS_SET.has(textWithoutTags) &&
    !textWithoutTags.match(
      /^(All Clans|Spider Clan|Crane Clan|Dragon Clan|Phoenix Clan|Scorpion Clan|Crab Clan|Lion Clan|Mantis Clan|Unicorn Clan|Clan Champion|Bitter Lies|Iron Crane|Death Priest|Witch Hunter|Order of the Spider|One Tribe|Heavy Weapon|Love Letter|Bog Hag|Master Bowman|Geisha House|Topaz Champion|Imperial Explorer|Advisor from the Shogun|Experienced 2|Experienced 3|Experienced 4|Experienced 5)/i
    );

  const startsWithSentence =
    !hasKeywordSeparators &&
    (sentenceStartPatterns.some((pattern) => pattern.test(textWithoutTags)) ||
      isTwoWordSentence);

  if (startsWithSentence) {
    return [];
  }

  // Helper: clean a token and check/add it to the keywords array
  function addIfKeyword(raw) {
    // Strip any residual HTML tags (e.g. orphaned </b> attached to last token)
    let cleanPart = raw.replace(/<[^>]+>/g, "").trim();
    if (!cleanPart || cleanPart.endsWith(":")) return;

    if (L5R_KEYWORDS_SET.has(cleanPart)) {
      keywords.push(cleanPart);
      return;
    }

    // For Sensei cards: single clan name may need " Clan" appended
    const clanNames = [
      "Crab", "Crane", "Phoenix", "Scorpion", "Lion", "Mantis", "Spider", "Unicorn",
    ];
    if (clanNames.includes(cleanPart)) {
      const clanKeyword = `${cleanPart} Clan`;
      if (L5R_KEYWORDS_SET.has(clanKeyword)) {
        keywords.push(clanKeyword);
      }
    }
  }

  // Helper: split a string by all separator variants and call addIfKeyword
  function extractFromString(str) {
    const normalised = str
      .replace(/&#8226;/g, delimiter)
      .replace(/&#149;/g, delimiter)
      .replace(/•/g, delimiter)
      .replace(/\.\s+/g, delimiter)
      .replace(/\.$/g, delimiter)
      .replace(/\./g, delimiter);
    for (const part of normalised.split(delimiter)) {
      addIfKeyword(part);
    }
  }

  // Pattern A: entire keyword block is one <b>…</b> block
  const boldMatch = keywordText.match(/^<b>([^<]+)<\/b>/i);
  if (boldMatch) {
    extractFromString(boldMatch[1].trim());
  }

  // Pattern B: mix of plain text + <b> tags
  //   e.g. "Bow • Two-Handed • <b>Weapon</b>"
  //   or   the whole block with no leading <b>
  const beforeBold = keywordText.split(/<b>/)[0].trim();
  if (beforeBold && !startsWithSentence) {
    extractFromString(beforeBold);

    // Also pick up any <b>…</b> tags that follow
    const allBoldMatches = keywordText.match(/<b>([^<]+)<\/b>/g);
    if (allBoldMatches) {
      for (const match of allBoldMatches) {
        const boldContent = match.replace(/<\/?b>/gi, "").trim();
        extractFromString(boldContent);
      }
    }
  }

  return [...new Set(keywords)];
}

// ─── Extract card text (non-keyword content) ──────────────────────────────────
function extractCardText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  const text = preProcessText(rawText);

  const actionWords = [
    "Limited", "Battle", "Reaction", "Open", "Political",
    "Political Reaction", "Ninja Open", "Ninja Battle",
  ];

  const firstBrIndex = text.search(/<br>|<BR>/i);
  const brLength = 4; // length of "<br>" or "<BR>"
  const textAfterKeywords =
    firstBrIndex > 0 ? text.substring(firstBrIndex + brLength) : text;

  let cleanText = textAfterKeywords;

  const boldMatches = cleanText.match(/<b>([^<]+)<\/b>/g);
  if (boldMatches) {
    boldMatches.forEach((match) => {
      const content = match.replace(/<\/?b>/gi, "").trim();
      const isActionWord = actionWords.some((action) =>
        content.toLowerCase().startsWith(action.toLowerCase())
      );
      const matchIndex = cleanText.indexOf(match);
      const afterMatch = cleanText.substring(matchIndex + match.length);
      const hasColonAfter = afterMatch.trim().startsWith(":");
      if (content.endsWith(":") || isActionWord) {
        let replacement = content;
        if (isActionWord && !content.endsWith(":") && !hasColonAfter) {
          replacement = content + ":";
        }
        cleanText = cleanText.replace(match, replacement);
      } else {
        cleanText = cleanText.replace(match, content);
      }
    });
  }

  cleanText = cleanText.replace(/<br>|<BR>/gi, " ");
  cleanText = cleanText.replace(/<[^>]*>/g, "");
  cleanText = cleanText
    .replace(/&#8226;/g, " ")
    .replace(/&#149;/g, " ")
    .replace(/•/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
}

// ─── Gold production extraction ───────────────────────────────────────────────
function extractGoldProductionFromText(text, xmlCard) {
  if (!text || typeof text !== "string") return null;
  if (xmlCard["@_type"] !== "holding") return null;

  const patterns = [
    /(?:bow[^:]*:?\s*)?produce\s+(\d+)\s+gold/gi,
    /produce\s+(\d+)\s+gold/gi,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const numberMatch = match[0].match(/(\d+)/);
      if (numberMatch) return parseInt(numberMatch[1], 10);
    }
  }
  return null;
}

// ─── Image lookup ─────────────────────────────────────────────────────────────
function getImagePath(card) {
  return cardImageMap[card.name] || null;
}

// ─── Experienced card detection ───────────────────────────────────────────────
function isExperiencedCard(card) {
  if (!card.name) return false;
  return /\s-\s*exp\d*$|\s-\s*Experienced/i.test(card.name);
}

// ─── Samurai Extended legality ────────────────────────────────────────────────
function isSamuraiExtendedLegal(card) {
  if (!card.legal || !Array.isArray(card.legal)) return false;
  const legalValues = new Set(["celestial", "emperor", "samurai", "ivory", "20f"]);
  return card.legal.some((l) => legalValues.has(String(l).toLowerCase()));
}

// ─── Main build loop ──────────────────────────────────────────────────────────
console.log("=== BUILDING JSON FROM XML V4 ===");
const xmlCardList = xmlCards.cards.card;
console.log(`Processing ${xmlCardList.length} XML cards`);

const newCards = [];
let processed = 0;

for (const xmlCard of xmlCardList) {
  if (!xmlCard.name) continue;
  if (!isSamuraiExtendedLegal(xmlCard)) continue;

  processed++;
  if (processed % 1000 === 0) {
    console.log(`Processed ${processed}/${xmlCardList.length} cards`);
  }

  // Fix known name typos
  let cardName = xmlCard.name;
  if (cardName === "Moto Nurgui") cardName = "Moto Nergui";

  const card = {
    cardid: xmlCard["@_id"] || `xml_${processed}`,
    title: [cardName],
    puretexttitle: cardName,
    formattedtitle: cardName,
    type: [xmlCard["@_type"] || "unknown"],
    clan: (() => {
      const cardType = xmlCard["@_type"];
      const needsClan = cardType === "stronghold" || cardType === "personality";
      if (xmlCard.clan) {
        const clanArray = Array.isArray(xmlCard.clan) ? xmlCard.clan : [xmlCard.clan];
        const valid = clanArray.filter((c) => c && c.trim() !== "");
        return valid.length > 0 ? valid : needsClan ? ["Unaligned"] : [];
      }
      return needsClan ? ["Unaligned"] : [];
    })(),
    force: xmlCard.force ? [xmlCard.force] : [],
    chi: xmlCard.chi ? [xmlCard.chi] : [],
    cost:
      xmlCard.cost !== undefined && xmlCard.cost !== null && xmlCard.cost !== ""
        ? [xmlCard.cost]
        : xmlCard["@_type"] === "strategy"
        ? [0]
        : [],
    ph: xmlCard.personal_honor ? [xmlCard.personal_honor] : [],
    honor: xmlCard.honor_req ? [xmlCard.honor_req] : [],
    focus: xmlCard.focus ? [xmlCard.focus] : [],
    goldProduction: xmlCard.gold_production
      ? [String(xmlCard.gold_production).replace(/^\+/, "")]
      : [],
    rarity: xmlCard.rarity ? [xmlCard.rarity] : [],
    set: xmlCard.edition
      ? Array.isArray(xmlCard.edition)
        ? xmlCard.edition
        : [xmlCard.edition]
      : [],
    artist: xmlCard.artist ? [xmlCard.artist] : [],
    flavor: xmlCard.flavor ? [xmlCard.flavor] : [],
    legality: xmlCard.legal
      ? Array.isArray(xmlCard.legal)
        ? xmlCard.legal
        : [xmlCard.legal]
      : [],
    deck:
      xmlCard["@_type"] === "personality" ||
      xmlCard["@_type"] === "holding" ||
      xmlCard["@_type"] === "celestial" ||
      xmlCard["@_type"] === "region" ||
      xmlCard["@_type"] === "event"
        ? ["Dynasty"]
        : ["Fate"],
    keywords: [],
    text: [],
    imagePath: null,
    imagehash: "",
    printing: [
      {
        printingid: "1",
        number: [xmlCard["@_id"] || "1"],
        artnumber: [xmlCard["@_id"] || "1"],
        set: [xmlCard.edition || "Unknown"],
        artist: [xmlCard.artist || "Unknown"],
        flavor: xmlCard.flavor ? [xmlCard.flavor] : [],
        text: xmlCard.text ? [xmlCard.text] : [],
        rarity: [xmlCard.rarity || "Common"],
      },
    ],
    printingprimary: "1",
    "@timestamp": new Date().toISOString(),
    "@SequenceNumber": "0000",
    version_count: 0,
  };

  if (xmlCard.text) {
    const cardText = extractCardText(xmlCard.text);
    const keywords = extractKeywordsFromText(xmlCard.text);

    if (cardText) card.text = [cardText];
    if (keywords.length > 0) card.keywords = keywords;

    // Shrine holdings: ensure "Temple" keyword
    if (
      xmlCard.name &&
      xmlCard.name.toLowerCase().includes("shrine") &&
      !card.keywords.includes("Temple")
    ) {
      card.keywords.push("Temple");
    }

    // Holdings: try to extract gold production from text if not in XML
    if (
      xmlCard["@_type"] === "holding" &&
      (!card.goldProduction || card.goldProduction.length === 0)
    ) {
      const goldFromText = extractGoldProductionFromText(xmlCard.text, xmlCard);
      if (goldFromText !== null) {
        card.goldProduction = [goldFromText];
      }
    }
  }

  const imagePath = getImagePath({ name: cardName });
  if (imagePath) card.imagePath = imagePath;

  newCards.push(card);
}

// ─── Save ─────────────────────────────────────────────────────────────────────
console.log(`\n=== SAVING ===`);
console.log(`Created ${newCards.length} cards from XML`);

const newJsonPath = path.join(__dirname, "public", "cards_v3.json");
const distJsonPath = path.join(__dirname, "dist", "cards_v3.json");

fs.writeFileSync(newJsonPath, JSON.stringify(newCards, null, 2), "utf8");
console.log(`Saved to ${newJsonPath}`);
fs.writeFileSync(distJsonPath, JSON.stringify(newCards, null, 2), "utf8");
console.log(`Saved to ${distJsonPath}`);

// ─── Spot-checks ──────────────────────────────────────────────────────────────
console.log(`\n=== SPOT CHECKS ===`);

const checks = [
  // Fix 1: malformed tag
  { name: "Weathered Armor",     expectKeywords: ["Armor"] },
  // Fix 1: orphaned </b>
  { name: "Tsuruchi - inexp",    expectKeywords: ["Unique", "Samurai", "Scout", "Inexperienced", "Daimyo"] },
  // Fix 2: <i> inside <b>
  { name: "Chun",                expectKeywords: ["Mercenary", "Naval"] },
  { name: "Yoritomo Hofu",       expectKeywords: ["Mantis Clan", "Samurai", "Conqueror", "Magistrate", "Naval"] },
  // Fix 3: two-word plain keyword
  { name: "Courage",             expectKeywords: ["Bushido Virtue"] },
  { name: "Will",                expectKeywords: ["Dark Virtue"] },
  // New keywords
  { name: "Moto Chen - exp2",    expectKeywords: ["Experienced 2"] },
];

let passed = 0;
for (const check of checks) {
  const card = newCards.find((c) => c.puretexttitle === check.name);
  if (!card) {
    console.log(`  ✗  "${check.name}" — not found in output`);
    continue;
  }
  const missing = check.expectKeywords.filter((k) => !card.keywords.includes(k));
  if (missing.length === 0) {
    console.log(`  ✓  "${check.name}" — keywords OK: [${card.keywords.join(", ")}]`);
    passed++;
  } else {
    console.log(`  ✗  "${check.name}" — missing: [${missing.join(", ")}], got: [${card.keywords.join(", ")}]`);
  }
}
console.log(`\n  ${passed}/${checks.length} spot checks passed`);
console.log(`\n=== COMPLETED ===`);
