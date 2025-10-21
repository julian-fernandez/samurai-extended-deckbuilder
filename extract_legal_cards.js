import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createLazyImage } from "./src/services/imageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractLegalCards() {
  console.log("🔍 Extracting legal cards from samuraiextendeddb.xml...");

  // Read the XML file
  const xmlPath = path.join(__dirname, "public", "samuraiextendeddb.xml");
  const xmlContent = fs.readFileSync(xmlPath, "utf8");

  // Extract all card names from the XML
  const cardNameRegex = /<name>(.*?)<\/name>/g;
  const legalCards = new Set();
  let match;

  while ((match = cardNameRegex.exec(xmlContent)) !== null) {
    const cardName = match[1].trim();
    legalCards.add(cardName);
  }

  console.log(
    `📊 Found ${legalCards.size} legal cards in samuraiextendeddb.xml`
  );

  // Convert to array and sort
  const legalCardsArray = Array.from(legalCards).sort();

  // Show first 20 cards as examples
  console.log("First 20 legal cards:");
  legalCardsArray.slice(0, 20).forEach((card) => console.log(`  - ${card}`));

  return legalCardsArray;
}

function createCorrectDataset() {
  console.log("🔧 Creating correct dataset with only legal cards...");

  // Get legal cards from XML
  const legalCards = extractLegalCards();

  // Load original cards.json
  const cardsPath = path.join(__dirname, "public", "cards.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Original dataset has ${allCards.length} cards`);

  // Find matching cards
  const matchedCards = [];
  const unmatchedLegalCards = [];

  for (const legalCardName of legalCards) {
    // Try to find matching card in original dataset
    const matchingCard = allCards.find((card) => {
      const cardName = card.formattedtitle || card.title?.[0] || card.name;
      return cardName === legalCardName;
    });

    if (matchingCard) {
      matchedCards.push(matchingCard);
    } else {
      unmatchedLegalCards.push(legalCardName);
    }
  }

  console.log(`✅ Found ${matchedCards.length} matching cards`);
  console.log(
    `❌ ${unmatchedLegalCards.length} legal cards not found in original dataset`
  );

  if (unmatchedLegalCards.length > 0) {
    console.log("Missing legal cards (first 20):");
    unmatchedLegalCards
      .slice(0, 20)
      .forEach((card) => console.log(`  - ${card}`));
  }

  // Update image paths for all matched cards
  console.log("🖼️ Updating image paths for all legal cards...");

  let updatedCount = 0;
  for (const card of matchedCards) {
    try {
      const imagePath = createLazyImage(card);
      if (imagePath) {
        card.imagePath = imagePath;
        updatedCount++;
      }
    } catch (error) {
      console.warn(
        `Failed to find image for ${card.formattedtitle || card.name}: ${
          error.message
        }`
      );
    }
  }

  console.log(`🖼️ Updated image paths for ${updatedCount} cards`);

  // Save the filtered dataset
  const outputPath = path.join(__dirname, "public", "cards_v2.json");
  fs.writeFileSync(outputPath, JSON.stringify(matchedCards, null, 2));

  console.log(`💾 Saved ${matchedCards.length} legal cards to cards_v2.json`);

  return {
    totalCards: matchedCards.length,
    updatedImages: updatedCount,
    missingCards: unmatchedLegalCards.length,
  };
}

// Run the script
const result = createCorrectDataset();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with updated images: ${result.updatedImages}`);
console.log(`  Missing legal cards: ${result.missingCards}`);
