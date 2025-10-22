import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the current card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const xmlPath = path.join(__dirname, "public", "samuraiextendeddb.xml");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Create a backup
fs.writeFileSync(
  path.join(__dirname, "public", "cards_v2_before_xml_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before XML-based fixes");

// Parse XML data
const xmlData = fs.readFileSync(xmlPath, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
});
const xmlCards = parser.parse(xmlData);

console.log("Parsed XML data");

// Function to find a card by ID
function findCardById(cardId) {
  return cards.find((card) => card.cardid === cardId);
}

// Function to find XML card by name
function findXmlCardByName(name) {
  if (!xmlCards.cards || !xmlCards.cards.card) return null;

  const xmlCardList = Array.isArray(xmlCards.cards.card)
    ? xmlCards.cards.card
    : [xmlCards.cards.card];

  // Look for exact match first
  let card = xmlCardList.find(
    (card) => card.name && card.name.toLowerCase() === name.toLowerCase()
  );

  return card;
}

// Function to check if a card is experienced
function isExperiencedCard(card) {
  return (
    card.keywords &&
    (card.keywords.includes("Experienced") ||
      card.keywords.includes("Experienced 2") ||
      card.keywords.includes("Experienced 3"))
  );
}

// Function to get base name from experienced card
function getBaseName(experiencedCard) {
  let baseName = experiencedCard.title[0];

  // Remove " - Experienced", " - Experienced 2", etc.
  baseName = baseName.replace(/\s*-\s*Experienced\s*\d*\s*$/, "");

  return baseName.trim();
}

// Function to get correct image path for experienced card
function getExperiencedImagePath(baseXmlCard, experiencedCard) {
  if (!baseXmlCard || !baseXmlCard.image) return null;

  // Handle both string and object image formats
  let baseImagePath;
  if (typeof baseXmlCard.image === "string") {
    baseImagePath = baseXmlCard.image;
  } else if (baseXmlCard.image && typeof baseXmlCard.image === "object") {
    baseImagePath = baseXmlCard.image["#text"] || baseXmlCard.image;
  } else {
    return null;
  }

  if (!baseImagePath || typeof baseImagePath !== "string") return null;

  const pathParts = baseImagePath.split("/");
  const filename = pathParts[pathParts.length - 1];
  const directory = pathParts.slice(0, -1).join("/");

  // Create experienced image path
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const ext = filename.match(/\.[^/.]+$/)?.[0] || ".jpg";

  // Check if it's Experienced 2, 3, etc.
  const isExp2 =
    experiencedCard.keywords &&
    experiencedCard.keywords.includes("Experienced 2");
  const isExp3 =
    experiencedCard.keywords &&
    experiencedCard.keywords.includes("Experienced 3");

  let experiencedFilename;
  if (isExp3) {
    experiencedFilename = `${nameWithoutExt} - Experienced 3${ext}`;
  } else if (isExp2) {
    experiencedFilename = `${nameWithoutExt} - Experienced 2${ext}`;
  } else {
    experiencedFilename = `${nameWithoutExt} - Experienced${ext}`;
  }

  return `${directory}/${experiencedFilename}`;
}

// Function to check if image file exists
function imageExists(imagePath) {
  const fullPath = path.join(__dirname, "public", imagePath);
  return fs.existsSync(fullPath);
}

// Main processing
console.log("\n=== FIXING CARDS FROM XML DATA ===");

const experiencedCards = cards.filter(isExperiencedCard);
console.log(`Found ${experiencedCards.length} experienced cards`);

let cardsFixed = 0;
let cardsSkipped = 0;
const fixes = [];

for (const experiencedCard of experiencedCards) {
  const baseName = getBaseName(experiencedCard);
  console.log(
    `\n--- Processing: ${experiencedCard.title[0]} (ID: ${experiencedCard.cardid}) ---`
  );
  console.log(`Base name: "${baseName}"`);

  // Find the base card in XML
  const baseXmlCard = findXmlCardByName(baseName);

  if (!baseXmlCard) {
    console.log(`❌ No base card found in XML for "${baseName}"`);
    cardsSkipped++;
    continue;
  }

  console.log(`✅ Found base card in XML: ${baseXmlCard.name}`);

  const fix = {
    cardId: experiencedCard.cardid,
    name: experiencedCard.title[0],
    baseName: baseName,
    changes: [],
  };

  // Fix stats to match XML (if they exist in XML)
  if (baseXmlCard.force !== undefined) {
    const xmlForce = baseXmlCard.force.toString();
    if (experiencedCard.force && experiencedCard.force[0] !== xmlForce) {
      console.log(
        `📊 Fixing force: ${experiencedCard.force[0]} -> ${xmlForce}`
      );
      experiencedCard.force[0] = xmlForce;
      fix.changes.push(`Force: ${experiencedCard.force[0]} -> ${xmlForce}`);
    }
  }

  if (baseXmlCard.chi !== undefined) {
    const xmlChi = baseXmlCard.chi.toString();
    if (experiencedCard.chi && experiencedCard.chi[0] !== xmlChi) {
      console.log(`📊 Fixing chi: ${experiencedCard.chi[0]} -> ${xmlChi}`);
      experiencedCard.chi[0] = xmlChi;
      fix.changes.push(`Chi: ${experiencedCard.chi[0]} -> ${xmlChi}`);
    }
  }

  if (baseXmlCard.cost !== undefined) {
    const xmlCost = baseXmlCard.cost.toString();
    if (experiencedCard.cost && experiencedCard.cost[0] !== xmlCost) {
      console.log(`📊 Fixing cost: ${experiencedCard.cost[0]} -> ${xmlCost}`);
      experiencedCard.cost[0] = xmlCost;
      fix.changes.push(`Cost: ${experiencedCard.cost[0]} -> ${xmlCost}`);
    }
  }

  // Fix text to match XML
  if (baseXmlCard.text) {
    const xmlText = baseXmlCard.text;
    if (experiencedCard.text && experiencedCard.text[0] !== xmlText) {
      console.log(`📝 Fixing text to match XML`);
      experiencedCard.text[0] = xmlText;
      fix.changes.push("Text updated to match XML");
    }
  }

  // Check and fix image
  const expectedImagePath = getExperiencedImagePath(
    baseXmlCard,
    experiencedCard
  );
  if (expectedImagePath && imageExists(expectedImagePath)) {
    if (experiencedCard.imagePath !== expectedImagePath) {
      console.log(
        `🖼️  Fixing image: ${experiencedCard.imagePath} -> ${expectedImagePath}`
      );
      experiencedCard.imagePath = expectedImagePath;
      fix.changes.push(`Image: ${expectedImagePath}`);
    }
  } else if (expectedImagePath) {
    console.log(`⚠️  Expected image not found: ${expectedImagePath}`);
  }

  if (fix.changes.length > 0) {
    fixes.push(fix);
    cardsFixed++;
    console.log(`✅ Fixed ${fix.changes.length} issues`);
  } else {
    console.log(`✅ No issues found`);
  }
}

// Save the updated cards
console.log(`\n=== SAVING CHANGES ===`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");

console.log(`\n=== SUMMARY ===`);
console.log(`Cards processed: ${experiencedCards.length}`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Cards skipped: ${cardsSkipped}`);

console.log(`\n=== DETAILED FIXES ===`);
fixes.forEach((fix) => {
  console.log(`\n${fix.name} (ID: ${fix.cardId}):`);
  fix.changes.forEach((change) => {
    console.log(`  - ${change}`);
  });
});
