import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the actual image mapping
const mappingPath = path.join(__dirname, "card_image_mapping.json");
let cardImageMap = {};
if (fs.existsSync(mappingPath)) {
  cardImageMap = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  console.log(`Loaded ${Object.keys(cardImageMap).length} image mappings`);
} else {
  console.log("No image mapping found. Run find_actual_images.js first.");
  process.exit(1);
}

// Load keywords from constants
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

console.log(`Loaded ${L5R_KEYWORDS.length} keywords from constants`);

// Parse XML data
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

// Function to extract keywords from text (improved)
function extractKeywordsFromText(text) {
  if (!text || typeof text !== "string") return [];

  // Only extract keywords from the very beginning of the text (the keyword block)
  // This should be at the very start, before any <br> or <BR> tags
  const firstBrIndex = text.search(/<br>|<BR>/i);
  const keywordText = firstBrIndex > 0 ? text.substring(0, firstBrIndex) : text;

  // Keywords should only be extracted if they're at the VERY START of the text
  // If the text starts with regular words (like "This Personality has the"), skip extraction

  const keywords = [];
  const delimiter = "|||";

  // Remove HTML tags temporarily to check if text starts with regular words
  const textWithoutTags = keywordText.replace(/<[^>]*>/g, "").trim();

  // Check if the text contains keyword separators (bullets) - if so, it's keywords, not a sentence
  const hasKeywordSeparators = /[•&#8226;&#149;]/.test(keywordText);

  // Check if text starts with common sentence patterns (not keywords)
  // "Bow" as a keyword appears as "Bow •" (with bullet), "Bow this card" is a verb (with space + lowercase)
  // Exception: "All Clans" is a valid keyword, not a sentence
  const sentenceStartPatterns = [
    /^This /i,
    /^Your /i,
    /^While /i,
    /^After /i,
    /^When /i,
    /^If /i,
    /^Bow [a-z]/i, // "Bow this card" is a verb (followed by lowercase), not the keyword
  ];

  // Check for two-word patterns that are sentences
  // But if the text has keyword separators (bullets), it's keywords, not a sentence
  // Also exclude known keywords like "All Clans", "Spider Clan", etc.
  const twoWordPattern = /^[A-Z][a-z]+ [a-z]+/i;
  const isTwoWordSentence =
    !hasKeywordSeparators && // If it has bullets, it's keywords
    twoWordPattern.test(textWithoutTags) &&
    !textWithoutTags.match(
      /^(All Clans|Spider Clan|Crane Clan|Dragon Clan|Phoenix Clan|Scorpion Clan|Crab Clan|Lion Clan|Mantis Clan|Unicorn Clan)/i
    );

  const startsWithSentence =
    !hasKeywordSeparators && // If it has bullets, it's keywords, not a sentence
    (sentenceStartPatterns.some((pattern) => pattern.test(textWithoutTags)) ||
      isTwoWordSentence);

  if (startsWithSentence) {
    // Text starts with a sentence, not keywords - don't extract
    return [];
  }

  // Extract keywords from the start of the text
  // Pattern 1: Keywords in <b> tags at the start: <b>Keyword1 • Keyword2</b>
  const boldMatch = keywordText.match(/^<b>([^<]+)<\/b>/i);
  if (boldMatch) {
    let boldText = boldMatch[1].trim();

    // Special case: "All Clans Sensei" should extract "All Clans" as a keyword
    if (boldText.toLowerCase().includes("all clans sensei")) {
      boldText = boldText.replace(/all clans sensei/gi, "All Clans Sensei");
      if (L5R_KEYWORDS.includes("All Clans")) {
        keywords.push("All Clans");
      }
      // Remove "All Clans Sensei" from the text to process the rest
      boldText = boldText.replace(/all clans sensei/gi, "").trim();
    }

    // Handle both bullets and periods as separators (Sensei cards use periods)
    const normalizedText = boldText
      .replace(/&#8226;/g, delimiter)
      .replace(/&#149;/g, delimiter)
      .replace(/•/g, delimiter)
      .replace(/\.\s+/g, delimiter) // Periods followed by space
      .replace(/\./g, delimiter); // Periods
    const parts = normalizedText.split(delimiter);
    for (const part of parts) {
      let cleanPart = part.trim();
      if (!cleanPart || cleanPart.endsWith(":")) continue;

      // Check if it's already a valid keyword
      if (L5R_KEYWORDS.includes(cleanPart)) {
        keywords.push(cleanPart);
      } else {
        // For Sensei cards, check if it's a single-word clan name that should be "X Clan"
        const clanNames = [
          "Crab",
          "Crane",
          "Dragon",
          "Phoenix",
          "Scorpion",
          "Lion",
          "Mantis",
          "Spider",
          "Unicorn",
        ];
        if (clanNames.includes(cleanPart)) {
          const clanKeyword = `${cleanPart} Clan`;
          if (L5R_KEYWORDS.includes(clanKeyword)) {
            keywords.push(clanKeyword);
          }
        }
      }
    }
  }

  // Pattern 2: Keywords before <b> tags: Keyword1 • Keyword2 • <b>Keyword3</b>
  // (like "Bow • Two-Handed • <b>Weapon</b>")
  const beforeBold = keywordText.split(/<b>/)[0].trim();
  if (beforeBold && !startsWithSentence) {
    const normalizedText = beforeBold
      .replace(/&#8226;/g, delimiter)
      .replace(/&#149;/g, delimiter)
      .replace(/•/g, delimiter)
      .replace(/\.\s+/g, delimiter) // Periods followed by space
      .replace(/\./g, delimiter); // Periods
    const parts = normalizedText.split(delimiter);
    for (const part of parts) {
      let cleanPart = part.trim();
      if (!cleanPart || cleanPart.endsWith(":")) continue;

      if (L5R_KEYWORDS.includes(cleanPart)) {
        keywords.push(cleanPart);
      } else {
        // For Sensei cards, check if it's a single-word clan name
        const clanNames = [
          "Crab",
          "Crane",
          "Dragon",
          "Phoenix",
          "Scorpion",
          "Lion",
          "Mantis",
          "Spider",
          "Unicorn",
        ];
        if (clanNames.includes(cleanPart)) {
          const clanKeyword = `${cleanPart} Clan`;
          if (L5R_KEYWORDS.includes(clanKeyword)) {
            keywords.push(clanKeyword);
          }
        }
      }
    }

    // Also extract keywords from <b> tags that appear after the initial keywords
    // (like "Bow • Two-Handed • <b>Weapon</b>")
    const allBoldMatches = keywordText.match(/<b>([^<]+)<\/b>/g);
    if (allBoldMatches) {
      for (const match of allBoldMatches) {
        const boldContent = match.replace(/<\/?b>/g, "").trim();
        const normalizedBold = boldContent
          .replace(/&#8226;/g, delimiter)
          .replace(/&#149;/g, delimiter)
          .replace(/•/g, delimiter)
          .replace(/\.\s+/g, delimiter) // Periods followed by space
          .replace(/\./g, delimiter); // Periods
        const boldParts = normalizedBold.split(delimiter);
        for (const part of boldParts) {
          let cleanPart = part.trim();
          if (!cleanPart || cleanPart.endsWith(":")) continue;

          if (L5R_KEYWORDS.includes(cleanPart)) {
            keywords.push(cleanPart);
          } else {
            // For Sensei cards, check if it's a single-word clan name
            const clanNames = [
              "Crab",
              "Crane",
              "Dragon",
              "Phoenix",
              "Scorpion",
              "Lion",
              "Mantis",
              "Spider",
              "Unicorn",
            ];
            if (clanNames.includes(cleanPart)) {
              const clanKeyword = `${cleanPart} Clan`;
              if (L5R_KEYWORDS.includes(clanKeyword)) {
                keywords.push(clanKeyword);
              }
            }
          }
        }
      }
    }
  }

  return [...new Set(keywords)]; // Remove duplicates
}

// Function to extract card text (non-keyword content)
function extractCardText(text) {
  if (!text || typeof text !== "string") return "";

  // List of action words that should be preserved in text (even if they're also keywords)
  const actionWords = [
    "Limited",
    "Battle",
    "Reaction",
    "Open",
    "Political",
    "Political Reaction",
    "Ninja Open",
    "Ninja Battle",
  ];

  // Find the first <br> or <BR> tag to identify the keyword block
  const firstBrIndex = text.search(/<br>|<BR>/i);
  const keywordBlock = firstBrIndex > 0 ? text.substring(0, firstBrIndex) : "";
  const brLength =
    firstBrIndex > 0
      ? text.substring(firstBrIndex, firstBrIndex + 4).toLowerCase() === "<br>"
        ? 4
        : 4
      : 0;
  const textAfterKeywords =
    firstBrIndex > 0 ? text.substring(firstBrIndex + brLength) : text;

  // Remove the keyword block entirely (it contains only keywords)
  // Start with text after keywords (which may have more <br> tags for line breaks)
  let cleanText = textAfterKeywords;

  // Now process remaining <b> tags - these are action words or other formatting
  const boldMatches = cleanText.match(/<b>([^<]+)<\/b>/g);
  if (boldMatches) {
    boldMatches.forEach((match) => {
      const content = match.replace(/<\/?b>/g, "").trim();

      // Check if this is an action word (even if it's also a keyword)
      const isActionWord = actionWords.some((action) =>
        content.toLowerCase().startsWith(action.toLowerCase())
      );

      // Check if there's already a colon immediately after the tag
      const matchIndex = cleanText.indexOf(match);
      const afterMatch = cleanText.substring(matchIndex + match.length);
      const hasColonAfter = afterMatch.trim().startsWith(":");

      // If it ends with ":" or is an action word, keep the content
      if (content.endsWith(":") || isActionWord) {
        // Keep the content but remove the <b> tags
        // If it doesn't end with ":" and there's no colon after, add ":" if it's an action word
        let replacement = content;
        if (isActionWord && !content.endsWith(":") && !hasColonAfter) {
          replacement = content + ":";
        }
        cleanText = cleanText.replace(match, replacement);
      } else {
        // For other <b> tags, just remove the tags but keep content
        cleanText = cleanText.replace(match, content);
      }
    });
  }

  // Convert <br> and <BR> tags to spaces (for line breaks in text)
  cleanText = cleanText.replace(/<br>|<BR>/gi, " ");

  // Remove any remaining HTML tags but keep content
  cleanText = cleanText.replace(/<[^>]*>/g, "");

  // Remove common keyword separators (bullets) but keep all other text
  // Replace HTML entities first, then bullet characters
  cleanText = cleanText
    .replace(/&#8226;/g, " ") // HTML entity for bullet
    .replace(/&#149;/g, " ") // HTML entity for bullet
    .replace(/•/g, " ") // Unicode bullet character
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
}

// Function to extract gold production from text for holdings
function extractGoldProductionFromText(text, xmlCard) {
  if (!text || typeof text !== "string") return null;
  if (xmlCard["@_type"] !== "holding") return null;

  // Look for patterns like "Produce X Gold" or "produce X Gold"
  // Match patterns like:
  // - "Produce 2 Gold"
  // - "produce 2 Gold"
  // - "Bow this card: Produce 2 Gold"
  // - "Bow the X to produce 2 Gold"
  // Take the first match (for cards with multiple options)
  const patterns = [
    /(?:bow[^:]*:?\s*)?produce\s+(\d+)\s+gold/gi,
    /produce\s+(\d+)\s+gold/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      // Extract the number from the first match
      const numberMatch = match[0].match(/(\d+)/);
      if (numberMatch && numberMatch[1]) {
        return parseInt(numberMatch[1], 10);
      }
    }
  }

  return null;
}

// Function to get image path for a card using actual mapping
function getImagePath(card) {
  const cardName = card.name;
  return cardImageMap[cardName] || null;
}

// Function to determine if a card is experienced
function isExperiencedCard(card) {
  if (!card.name) return false;
  return (
    card.name.includes(" - exp") ||
    card.name.includes(" - Experienced") ||
    card.name.includes(" - exp2") ||
    card.name.includes(" - exp3") ||
    card.name.includes(" - exp4") ||
    card.name.includes(" - exp5")
  );
}

// Function to check if a card is Samurai Extended legal
function isSamuraiExtendedLegal(card) {
  if (!card.legal || !Array.isArray(card.legal)) return false;

  const samuraiExtendedLegalValues = [
    "celestial",
    "emperor",
    "samurai",
    "ivory",
    "20f", // Use lowercase for comparison
  ];

  // Check if card has the required legal tags
  const hasLegalTag = card.legal.some((legalValue) =>
    samuraiExtendedLegalValues.includes(legalValue.toLowerCase())
  );

  if (!hasLegalTag) {
    return false; // Not legal in Samurai Extended format
  }

  // Exclude cards that are ONLY in promo/promotional sets AND don't have other legal editions
  // BUT: If a card is only in promo but has legal tags (like "emperor"), it's still legal
  const editions = Array.isArray(card.edition) ? card.edition : [card.edition];
  const promoEditions = ["promo", "promotional"];
  const isOnlyPromo = editions.every(
    (e) => e && promoEditions.includes(e.toLowerCase())
  );

  // If card is only in promo sets, it's still legal if it has the right legal tags
  // (which we already checked above)
  // So we only exclude if it's ONLY promo AND doesn't have legal tags (already handled above)

  return true; // Card has legal tags, so it's legal
}

console.log("=== BUILDING JSON FROM XML V3 ===");
const xmlCardList = xmlCards.cards.card;
console.log(`Processing ${xmlCardList.length} XML cards`);

const newCards = [];
let processed = 0;

for (const xmlCard of xmlCardList) {
  if (!xmlCard.name) continue;

  // Check if card is Samurai Extended legal
  if (!isSamuraiExtendedLegal(xmlCard)) {
    continue; // Skip cards that are not Samurai Extended legal
  }

  processed++;
  if (processed % 1000 === 0) {
    console.log(`Processed ${processed}/${xmlCardList.length} cards`);
  }

  // Extract basic info
  const card = {
    cardid: xmlCard["@_id"] || `xml_${processed}`,
    title: [xmlCard.name],
    puretexttitle: xmlCard.name,
    formattedtitle: xmlCard.name,
    type: [xmlCard["@_type"] || "unknown"],
    clan: xmlCard.clan
      ? Array.isArray(xmlCard.clan)
        ? xmlCard.clan
        : [xmlCard.clan]
      : [],
    force: xmlCard.force ? [xmlCard.force] : [],
    chi: xmlCard.chi ? [xmlCard.chi] : [],
    // For strategies, default cost to 0 if not present
    cost:
      xmlCard.cost !== undefined && xmlCard.cost !== null && xmlCard.cost !== ""
        ? [xmlCard.cost]
        : xmlCard["@_type"] === "strategy"
        ? [0]
        : [],
    ph: xmlCard.personal_honor ? [xmlCard.personal_honor] : [],
    honor: xmlCard.honor_req ? [xmlCard.honor_req] : [],
    focus: xmlCard.focus ? [xmlCard.focus] : [],
    // Gold production: first try XML field, then extract from text for holdings
    goldProduction: xmlCard.gold_production
      ? [
          String(xmlCard.gold_production).replace(/^\+/, ""), // Remove leading + if present
        ]
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
      xmlCard.type === "personality" ||
      xmlCard.type === "holding" ||
      xmlCard.type === "celestial" ||
      xmlCard.type === "region" ||
      xmlCard.type === "event"
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

  // Extract text and keywords
  if (xmlCard.text) {
    const cardText = extractCardText(xmlCard.text);
    const keywords = extractKeywordsFromText(xmlCard.text);

    if (cardText) {
      card.text = [cardText];
    }

    if (keywords.length > 0) {
      card.keywords = keywords;
    }

    // Special case: Cards with "Shrine" in the name should have "Temple" keyword if missing
    // (Some older cards in XML are missing this keyword)
    if (
      xmlCard.name &&
      xmlCard.name.toLowerCase().includes("shrine") &&
      !card.keywords.includes("Temple")
    ) {
      card.keywords.push("Temple");
    }

    // If gold production is not in XML, try to extract from text
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

  // Handle image path using actual mapping
  const imagePath = getImagePath(xmlCard);
  if (imagePath) {
    card.imagePath = imagePath;
  }

  newCards.push(card);
}

console.log(`\n=== SAVING NEW JSON ===`);
console.log(`Created ${newCards.length} cards from XML`);

const newJsonPath = path.join(__dirname, "public", "cards_v3.json");
const distJsonPath = path.join(__dirname, "dist", "cards_v3.json");

fs.writeFileSync(newJsonPath, JSON.stringify(newCards, null, 2), "utf8");
console.log(`Saved to ${newJsonPath}`);
fs.writeFileSync(distJsonPath, JSON.stringify(newCards, null, 2), "utf8");
console.log(`Saved to ${distJsonPath}`);

console.log(`\n=== EXAMPLES ===`);
console.log(`\nBase Moto Chen:`);
const baseMotoChen = newCards.find(
  (card) => card.title[0] === "Moto Chen" && !isExperiencedCard(card)
);
if (baseMotoChen) {
  console.log(`  Text: "${baseMotoChen.text[0] || "No text"}"`);
  console.log(`  Keywords: [${baseMotoChen.keywords.join(", ")}]`);
  console.log(`  Image: ${baseMotoChen.imagePath}`);
}

console.log(`\nMoto Chen - Experienced:`);
const expMotoChen = newCards.find(
  (card) => card.title[0] === "Moto Chen - exp"
);
if (expMotoChen) {
  console.log(`  Text: "${expMotoChen.text[0] || "No text"}"`);
  console.log(`  Keywords: [${expMotoChen.keywords.join(", ")}]`);
  console.log(`  Image: ${expMotoChen.imagePath}`);
}

console.log(`\nMoto Chen - Experienced 2:`);
const exp2MotoChen = newCards.find(
  (card) => card.title[0] === "Moto Chen - exp2"
);
if (exp2MotoChen) {
  console.log(`  Text: "${exp2MotoChen.text[0] || "No text"}"`);
  console.log(`  Keywords: [${exp2MotoChen.keywords.join(", ")}]`);
  console.log(`  Image: ${exp2MotoChen.imagePath}`);
}

console.log(`\nMoto Chen - Experienced 3:`);
const exp3MotoChen = newCards.find(
  (card) => card.title[0] === "Moto Chen - exp3"
);
if (exp3MotoChen) {
  console.log(`  Text: "${exp3MotoChen.text[0] || "No text"}"`);
  console.log(`  Keywords: [${exp3MotoChen.keywords.join(", ")}]`);
  console.log(`  Image: ${exp3MotoChen.imagePath}`);
}

console.log(`\n=== COMPLETED ===`);
console.log(
  `New JSON file created with ${newCards.length} cards from XML data`
);
