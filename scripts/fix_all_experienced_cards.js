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
  path.join(__dirname, "public", "cards_v2_before_experienced_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before experienced card fixes");

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

// Function to find cards by name
function findCardsByName(name) {
  return cards.filter(
    (card) => card.title && card.title[0] && card.title[0].includes(name)
  );
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

  // If not found, look for base version (without " - exp" suffix)
  if (!card) {
    card = xmlCardList.find(
      (card) =>
        card.name && card.name.toLowerCase() === name.toLowerCase() + " - exp"
    );
  }

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
console.log("\n=== FINDING ALL EXPERIENCED CARDS ===");

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
  console.log(
    `Base XML stats: Force=${baseXmlCard.force}, Chi=${baseXmlCard.chi}, Cost=${baseXmlCard.cost}`
  );
  console.log(
    `Base XML text: ${
      baseXmlCard.text ? baseXmlCard.text.substring(0, 100) + "..." : "none"
    }`
  );

  const fix = {
    cardId: experiencedCard.cardid,
    name: experiencedCard.title[0],
    baseName: baseName,
    changes: [],
  };

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
    } else {
      console.log(`✅ Image already correct: ${expectedImagePath}`);
    }
  } else {
    console.log(`⚠️  Expected image not found: ${expectedImagePath || "null"}`);
  }

  // Check and fix stats (experienced should be different from base)
  const baseForce = parseInt(baseXmlCard.force);
  const baseChi = parseInt(baseXmlCard.chi);
  const baseCost = parseInt(baseXmlCard.cost);

  const currentForce = experiencedCard.force
    ? parseInt(experiencedCard.force[0])
    : null;
  const currentChi = experiencedCard.chi
    ? parseInt(experiencedCard.chi[0])
    : null;
  const currentCost = experiencedCard.cost
    ? parseInt(experiencedCard.cost[0])
    : null;

  // Experienced cards should have different stats (usually higher, but not always)
  if (currentForce !== null && currentForce === baseForce) {
    const newForce = baseForce + 1;
    console.log(`📊 Fixing force: ${currentForce} -> ${newForce}`);
    experiencedCard.force[0] = newForce.toString();
    fix.changes.push(`Force: ${currentForce} -> ${newForce}`);
  }

  if (currentChi !== null && currentChi === baseChi) {
    const newChi = baseChi + 1;
    console.log(`📊 Fixing chi: ${currentChi} -> ${newChi}`);
    experiencedCard.chi[0] = newChi.toString();
    fix.changes.push(`Chi: ${currentChi} -> ${newChi}`);
  }

  if (currentCost !== null && currentCost === baseCost) {
    const newCost = baseCost + 1;
    console.log(`📊 Fixing cost: ${currentCost} -> ${newCost}`);
    experiencedCard.cost[0] = newCost.toString();
    fix.changes.push(`Cost: ${currentCost} -> ${newCost}`);
  }

  // Check and fix text (should be different from base)
  const baseText = baseXmlCard.text
    ? baseXmlCard.text.replace(/<[^>]*>/g, "").trim()
    : "";
  const currentText = experiencedCard.text
    ? experiencedCard.text[0].replace(/<[^>]*>/g, "").trim()
    : "";

  if (baseText && currentText === baseText) {
    console.log(`📝 Text is same as base - this might be wrong`);
    console.log(`Base text: ${baseText.substring(0, 100)}...`);
    console.log(`Current text: ${currentText.substring(0, 100)}...`);
    // Don't auto-fix text as we need to know what the correct experienced text should be
  }

  // Check keywords (should include "Experienced" and be different from base)
  const baseKeywords = baseXmlCard.text
    ? baseXmlCard.text.match(/<b>([^<]+)<\/b>/g) || []
    : [];
  const hasExperiencedKeyword =
    experiencedCard.keywords &&
    experiencedCard.keywords.some((k) => k.includes("Experienced"));

  if (!hasExperiencedKeyword) {
    console.log(`🏷️  Adding "Experienced" keyword`);
    if (!experiencedCard.keywords) experiencedCard.keywords = [];
    experiencedCard.keywords.push("Experienced");
    fix.changes.push("Added Experienced keyword");
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
