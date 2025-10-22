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
  path.join(__dirname, "public", "cards_v2_before_comprehensive_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before comprehensive fixes");

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

// Function to find all cards with the same base name
function findCardsWithSameBaseName(baseName) {
  return cards.filter((card) => {
    if (!card.title || !card.title[0]) return false;
    const cardName = card.title[0].trim();
    return (
      cardName === baseName || cardName.startsWith(baseName + " - Experienced")
    );
  });
}

// Main processing
console.log("\n=== COMPREHENSIVE FIX FOR ALL CARDS ===");

// First, let's identify all cards that might have issues
const allCards = cards;
let cardsFixed = 0;
let cardsSkipped = 0;
const fixes = [];

// Process all cards, not just experienced ones
for (const card of allCards) {
  const cardName = card.title[0];
  console.log(`\n--- Processing: ${cardName} (ID: ${card.cardid}) ---`);

  // Find the XML version of this card
  const xmlCard = findXmlCardByName(cardName);

  if (!xmlCard) {
    console.log(`❌ No XML card found for "${cardName}"`);
    cardsSkipped++;
    continue;
  }

  console.log(`✅ Found XML card: ${xmlCard.name}`);

  const fix = {
    cardId: card.cardid,
    name: cardName,
    changes: [],
  };

  // Fix stats to match XML (if they exist in XML)
  if (xmlCard.force !== undefined) {
    const xmlForce = xmlCard.force.toString();
    if (card.force && card.force[0] !== xmlForce) {
      console.log(`📊 Fixing force: ${card.force[0]} -> ${xmlForce}`);
      card.force[0] = xmlForce;
      fix.changes.push(`Force: ${card.force[0]} -> ${xmlForce}`);
    }
  }

  if (xmlCard.chi !== undefined) {
    const xmlChi = xmlCard.chi.toString();
    if (card.chi && card.chi[0] !== xmlChi) {
      console.log(`📊 Fixing chi: ${card.chi[0]} -> ${xmlChi}`);
      card.chi[0] = xmlChi;
      fix.changes.push(`Chi: ${card.chi[0]} -> ${xmlChi}`);
    }
  }

  if (xmlCard.cost !== undefined) {
    const xmlCost = xmlCard.cost.toString();
    if (card.cost && card.cost[0] !== xmlCost) {
      console.log(`📊 Fixing cost: ${card.cost[0]} -> ${xmlCost}`);
      card.cost[0] = xmlCost;
      fix.changes.push(`Cost: ${card.cost[0]} -> ${xmlCost}`);
    }
  }

  // Fix text to match XML
  if (xmlCard.text) {
    const xmlText = xmlCard.text;
    if (card.text && card.text[0] !== xmlText) {
      console.log(`📝 Fixing text to match XML`);
      card.text[0] = xmlText;
      fix.changes.push("Text updated to match XML");
    }
  }

  // Fix keywords based on XML text
  if (xmlCard.text) {
    const keywordMatches = xmlCard.text.match(/<b>([^<]+)<\/b>/g);
    if (keywordMatches) {
      const xmlKeywords = keywordMatches.map((match) =>
        match.replace(/<\/?b>/g, "").trim()
      );

      // Check if keywords need updating
      const currentKeywords = card.keywords || [];
      const needsUpdate = !xmlKeywords.every((keyword) =>
        currentKeywords.some((k) => k.includes(keyword))
      );

      if (needsUpdate) {
        console.log(`🏷️  Updating keywords to match XML`);
        // Keep existing keywords but ensure XML ones are present
        const newKeywords = [...new Set([...currentKeywords, ...xmlKeywords])];
        card.keywords = newKeywords;
        fix.changes.push("Keywords updated to match XML");
      }
    }
  }

  // Fix image for experienced cards
  if (isExperiencedCard(card)) {
    const baseName = getBaseName(card);
    const baseXmlCard = findXmlCardByName(baseName);

    if (baseXmlCard) {
      const expectedImagePath = getExperiencedImagePath(baseXmlCard, card);
      if (expectedImagePath && imageExists(expectedImagePath)) {
        if (card.imagePath !== expectedImagePath) {
          console.log(
            `🖼️  Fixing experienced image: ${card.imagePath} -> ${expectedImagePath}`
          );
          card.imagePath = expectedImagePath;
          fix.changes.push(`Image: ${expectedImagePath}`);
        }
      } else if (expectedImagePath) {
        console.log(
          `⚠️  Expected experienced image not found: ${expectedImagePath}`
        );
      }
    }
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
console.log(`Cards processed: ${allCards.length}`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Cards skipped: ${cardsSkipped}`);

console.log(`\n=== DETAILED FIXES ===`);
fixes.forEach((fix) => {
  console.log(`\n${fix.name} (ID: ${fix.cardId}):`);
  fix.changes.forEach((change) => {
    console.log(`  - ${change}`);
  });
});
