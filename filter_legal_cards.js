import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  return Array.from(legalCards);
}

function filterToLegalCards() {
  console.log("🔧 Filtering to only legal cards...");

  // Get legal cards from XML
  const legalCards = extractLegalCards();

  // Load the cards with images
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
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

  console.log(`✅ Found ${matchedCards.length} matching legal cards`);
  console.log(
    `❌ ${unmatchedLegalCards.length} legal cards not found in original dataset`
  );

  // Count cards with images
  const cardsWithImages = matchedCards.filter(
    (card) => card.imagePath && card.imagePath !== null
  );
  console.log(`🖼️ ${cardsWithImages.length} legal cards have images`);

  // Save the filtered cards
  fs.writeFileSync(cardsPath, JSON.stringify(matchedCards, null, 2));

  console.log(`💾 Saved ${matchedCards.length} legal cards to cards_v2.json`);

  return {
    totalCards: matchedCards.length,
    cardsWithImages: cardsWithImages.length,
    missingCards: unmatchedLegalCards.length,
  };
}

// Run the script
const result = filterToLegalCards();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with images: ${result.cardsWithImages}`);
console.log(`  Missing legal cards: ${result.missingCards}`);
