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

  // Only extract keywords from the very first <b> block (the actual keywords)
  // This should be at the very beginning of the text, before any <br> tags
  const firstBrIndex = text.indexOf("<br>");
  const keywordText = firstBrIndex > 0 ? text.substring(0, firstBrIndex) : text;

  // Look for the first <b> block only
  const firstBoldMatch = keywordText.match(/<b>([^<]+)<\/b>/);
  if (firstBoldMatch) {
    const boldText = firstBoldMatch[1].trim();

    // Split by common separators and clean up
    const keywords = [];
    const parts = boldText.split(/[•&#8226;&#149;]/);
    for (const part of parts) {
      const cleanPart = part.trim();

      // Skip non-keyword phrases that end with ":" (like "Reaction:", "Battle:", etc.)
      if (cleanPart && cleanPart.endsWith(":")) continue;

      // Only include if it's actually in the L5R_KEYWORDS list
      if (cleanPart && L5R_KEYWORDS.includes(cleanPart)) {
        keywords.push(cleanPart);
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  return [];
}

// Function to extract card text (non-keyword content)
function extractCardText(text) {
  if (!text || typeof text !== "string") return "";

  // First, extract keywords from <b> tags to know what to remove
  const boldMatches = text.match(/<b>([^<]+)<\/b>/g);
  let cleanText = text;

  if (boldMatches) {
    // Only remove <b> tags that contain actual keywords, not action words like "Reaction:", "Battle:", etc.
    boldMatches.forEach((match) => {
      const content = match.replace(/<\/?b>/g, "").trim();

      // Don't remove if it's an action word like "Reaction:", "Battle:", "Open:", etc.
      // or if it's a single word that's not a keyword
      if (
        content.endsWith(":") ||
        (content.length < 20 &&
          !L5R_KEYWORDS.some((k) =>
            k.toLowerCase().includes(content.toLowerCase())
          ))
      ) {
        // Keep the content but remove the <b> tags
        cleanText = cleanText.replace(match, content);
      } else {
        // Remove the entire <b> tag and content for actual keywords
        cleanText = cleanText.replace(match, "");
      }
    });
  }

  // Remove HTML tags but keep content
  cleanText = cleanText.replace(/<[^>]*>/g, "");

  // Remove common keyword separators and clean up
  cleanText = cleanText
    .replace(/[•&#8226;&#149;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
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
    "20F",
  ];

  return card.legal.some((legalValue) =>
    samuraiExtendedLegalValues.includes(legalValue.toLowerCase())
  );
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
    cost: xmlCard.cost ? [xmlCard.cost] : [],
    ph: xmlCard.personal_honor ? [xmlCard.personal_honor] : [],
    honor: xmlCard.honor_req ? [xmlCard.honor_req] : [],
    focus: xmlCard.focus ? [xmlCard.focus] : [],
    rarity: xmlCard.rarity ? [xmlCard.rarity] : [],
    set: xmlCard.edition ? [xmlCard.edition] : [],
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
