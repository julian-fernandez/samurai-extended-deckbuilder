import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the keywords from constants
const constantsPath = path.join(__dirname, "src", "constants", "index.js");
const constantsContent = fs.readFileSync(constantsPath, "utf8");

// Extract keywords from the constants file
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

  // First, extract keywords from <b> tags
  const boldMatches = text.match(/<b>([^<]+)<\/b>/g);
  if (boldMatches) {
    const boldKeywords = boldMatches.map((match) =>
      match.replace(/<\/?b>/g, "").trim()
    );

    // Split by common separators and clean up
    const keywords = [];
    for (const boldText of boldKeywords) {
      const parts = boldText.split(/[•&#8226;&#149;]/);
      for (const part of parts) {
        const cleanPart = part.trim();
        // Skip non-keyword phrases like "Political Reaction:"
        if (cleanPart && cleanPart.endsWith(":")) continue;

        if (
          cleanPart &&
          L5R_KEYWORDS.some(
            (keyword) =>
              cleanPart.toLowerCase().includes(keyword.toLowerCase()) ||
              keyword.toLowerCase().includes(cleanPart.toLowerCase())
          )
        ) {
          keywords.push(cleanPart);
        }
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
    // Remove the <b> tags and their content from the text
    boldMatches.forEach((match) => {
      cleanText = cleanText.replace(match, "");
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

// Function to get image path for a card
function getImagePath(card) {
  // For experienced cards, use the proper naming convention
  if (isExperiencedCard(card)) {
    const baseName = card.name.replace(/ - exp\d*$/, "");
    const expLevel = card.name.includes(" - exp2")
      ? " - Experienced 2"
      : card.name.includes(" - exp3")
      ? " - Experienced 3"
      : card.name.includes(" - exp4")
      ? " - Experienced 4"
      : card.name.includes(" - exp5")
      ? " - Experienced 5"
      : card.name.includes(" - exp")
      ? " - Experienced"
      : "";

    // Get the edition to determine the directory
    const edition = card.edition || "Unknown";
    const editionMap = {
      AD: "Ambition-s Debt",
      AoD: "Anvil of Despair",
      CJ: "Crimson and Jade",
      DJH: "Dark Allies",
      FaS: "Fire and Shadow",
      FK: "Forbidden Knowledge",
      FL: "Forgotten Legacy",
      KD: "Khan-s Defiance",
      Celestial: "Celestial Edition",
      WoE: "Wrath of the Emperor",
      Samurai: "Samurai Edition",
      Lotus: "Lotus Edition",
      APC: "A Perfect Cut",
      Diamond: "Diamond Edition",
      Gold: "Gold Edition",
      Jade: "Jade Edition",
      Ivory: "Ivory Edition",
      Emperor: "Emperor Edition",
      Imperial: "Imperial Edition",
      Obsidian: "Obsidian Edition",
      Pearl: "Pearl Edition",
      "Pre-Imperial": "Pre-Imperial Edition",
      SW: "The War of Spirits",
      RotS: "Rise of the Shogun",
      TPW: "The Plague War",
      TH: "The Harbinger",
      EaW: "Embers of War",
      TDoW: "The Dead of Winter",
      BtD: "Before the Dawn",
      GotE: "Glory of the Empire",
      SotE: "Soul of the Empire",
      TAS: "Torn Asunder",
      WotE: "Wrath of the Emperor",
      EJC: "Test of the Emerald and Jade Championships",
      PD: "Promotional-Diamond",
      PG: "Promotional-Gold",
      PJ: "Promotional-Jade",
      PI: "Promotional-Imperial",
      PC: "Promotional-Celestial",
      PS: "Promotional-Samurai",
      PT: "Promotional-Twenty Festivals",
    };
    const directory = editionMap[edition] || edition;

    // Create the experienced image path using the actual naming convention
    return `/images/${directory}/${baseName}${expLevel}.jpg`;
  }

  // For non-experienced cards, use the original image path logic
  if (!card.image) return null;

  let imagePath = card.image;

  // Handle array of images (multiple editions)
  if (Array.isArray(imagePath)) {
    // Use the first image
    imagePath = imagePath[0];
  }

  // Handle different image formats
  if (typeof imagePath === "object") {
    if (imagePath["#text"]) {
      imagePath = imagePath["#text"];
    } else if (imagePath["@_edition"]) {
      // Handle multiple editions
      const editions = Object.keys(imagePath).filter(
        (key) => key !== "@_edition"
      );
      if (editions.length > 0) {
        imagePath = imagePath[editions[0]];
      }
    }
  }

  if (typeof imagePath !== "string") return null;

  // Convert to web path and map edition codes to actual folder names
  let webPath = imagePath.replace("images/cards/", "/images/");

  // Extract edition code from path (e.g., /images/AD/AD105.jpg -> AD)
  const pathParts = webPath.split("/");
  const editionCode = pathParts[pathParts.length - 2];

  // Map edition code to actual folder name
  const editionMap = {
    AD: "Ambition-s Debt",
    AoD: "Anvil of Despair",
    CJ: "Crimson and Jade",
    DJH: "Dark Allies",
    FaS: "Fire and Shadow",
    FK: "Forbidden Knowledge",
    FL: "Forgotten Legacy",
    KD: "Khan-s Defiance",
    Celestial: "Celestial Edition",
    WoE: "Wrath of the Emperor",
    Samurai: "Samurai Edition",
    Lotus: "Lotus Edition",
    APC: "A Perfect Cut",
    Diamond: "Diamond Edition",
    Gold: "Gold Edition",
    Jade: "Jade Edition",
    Ivory: "Ivory Edition",
    Emperor: "Emperor Edition",
    Imperial: "Imperial Edition",
    Obsidian: "Obsidian Edition",
    Pearl: "Pearl Edition",
    "Pre-Imperial": "Pre-Imperial Edition",
    SW: "The War of Spirits",
    RotS: "Rise of the Shogun",
    TPW: "The Plague War",
    TH: "The Harbinger",
    EaW: "Embers of War",
    TDoW: "The Dead of Winter",
    BtD: "Before the Dawn",
    GotE: "Glory of the Empire",
    SotE: "Soul of the Empire",
    TAS: "Torn Asunder",
    WotE: "Wrath of the Emperor",
    EJC: "Test of the Emerald and Jade Championships",
    PD: "Promotional-Diamond",
    PG: "Promotional-Gold",
    PJ: "Promotional-Jade",
    PI: "Promotional-Imperial",
    PC: "Promotional-Celestial",
    PS: "Promotional-Samurai",
    PT: "Promotional-Twenty Festivals",
  };

  const actualFolder = editionMap[editionCode] || editionCode;
  // Use the card name as the filename instead of the XML filename
  return `/images/${actualFolder}/${card.name}.jpg`;
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

// Function to get experienced image path
function getExperiencedImagePath(card) {
  if (!isExperiencedCard(card)) return null;

  const baseImagePath = getImagePath(card);
  if (!baseImagePath) return null;

  // Extract the base name and create experienced path
  let baseName = card.name;
  if (baseName.includes(" - exp")) {
    baseName = baseName.replace(/ - exp\d*$/, "");
  }

  // Determine experienced level
  let expLevel = "";
  if (card.name.includes(" - exp2")) expLevel = " - Experienced 2";
  else if (card.name.includes(" - exp3")) expLevel = " - Experienced 3";
  else if (card.name.includes(" - exp4")) expLevel = " - Experienced 4";
  else if (card.name.includes(" - exp5")) expLevel = " - Experienced 5";
  else if (card.name.includes(" - exp")) expLevel = " - Experienced";

  // Create the experienced image path
  const pathParts = baseImagePath.split("/");
  const filename = pathParts[pathParts.length - 1];
  const directory = pathParts.slice(0, -1).join("/");
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const ext = filename.match(/\.[^/.]+$/)?.[0] || ".jpg";

  return `${directory}/${nameWithoutExt}${expLevel}${ext}`;
}

// Main processing
console.log("\n=== BUILDING JSON FROM XML V2 ===");

const xmlCardList = Array.isArray(xmlCards.cards.card)
  ? xmlCards.cards.card
  : [xmlCards.cards.card];

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

  // Handle image path
  const imagePath = getImagePath(xmlCard);
  if (imagePath) {
    card.imagePath = imagePath;
  }

  newCards.push(card);
}

console.log(`\n=== SAVING NEW JSON ===`);
console.log(`Created ${newCards.length} cards from XML`);

// Save the new cards
const outputPath = path.join(__dirname, "public", "cards_v3.json");
fs.writeFileSync(outputPath, JSON.stringify(newCards, null, 2));
console.log(`Saved to ${outputPath}`);

// Also save to dist folder
const distPath = path.join(__dirname, "dist", "cards_v3.json");
fs.writeFileSync(distPath, JSON.stringify(newCards, null, 2));
console.log(`Saved to ${distPath}`);

// Show some examples
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
