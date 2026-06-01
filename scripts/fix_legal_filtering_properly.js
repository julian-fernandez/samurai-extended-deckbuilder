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

function getBaseCardName(cardName) {
  // Remove experienced suffixes to get base name
  return cardName
    .replace(/ - Experienced( \d+)?$/g, "")
    .replace(/ - exp( \d+)?$/g, "")
    .replace(/ - Inexperienced$/g, "")
    .replace(/ - base$/g, "")
    .trim();
}

function filterToLegalCardsProperly() {
  console.log("🔧 Filtering to legal cards with ALL variations...");

  // Get legal cards from XML
  const legalCards = extractLegalCards();

  // Load the cards with images
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Original dataset has ${allCards.length} cards`);

  // Create a set of legal base names
  const legalBaseNames = new Set();
  for (const legalCard of legalCards) {
    const baseName = getBaseCardName(legalCard);
    legalBaseNames.add(baseName);
  }

  console.log(`📊 Found ${legalBaseNames.size} unique legal base names`);

  // Find all cards that match legal base names
  const matchedCards = [];
  const unmatchedCards = [];

  for (const card of allCards) {
    const cardName = card.formattedtitle || card.title?.[0] || card.name;
    if (!cardName) {
      unmatchedCards.push(card);
      continue;
    }

    const baseName = getBaseCardName(cardName);

    if (legalBaseNames.has(baseName)) {
      matchedCards.push(card);
    } else {
      unmatchedCards.push(card);
    }
  }

  console.log(
    `✅ Found ${matchedCards.length} matching cards (including all variations)`
  );
  console.log(`❌ ${unmatchedCards.length} cards not legal`);

  // Count cards with images
  const cardsWithImages = matchedCards.filter(
    (card) => card.imagePath && card.imagePath !== null
  );
  console.log(`🖼️ ${cardsWithImages.length} legal cards have images`);

  // Show some examples of what we found
  console.log("\n📋 Examples of legal cards found:");
  const examples = matchedCards.slice(0, 20);
  examples.forEach((card) => {
    const cardName = card.formattedtitle || card.name;
    const baseName = getBaseCardName(cardName);
    console.log(`  - ${cardName} (base: ${baseName})`);
  });

  // Show some examples of what we didn't find
  console.log("\n📋 Examples of non-legal cards:");
  const nonLegalExamples = unmatchedCards.slice(0, 10);
  nonLegalExamples.forEach((card) => {
    const cardName = card.formattedtitle || card.name;
    const baseName = getBaseCardName(cardName);
    console.log(`  - ${cardName} (base: ${baseName})`);
  });

  // Save the filtered cards
  fs.writeFileSync(cardsPath, JSON.stringify(matchedCards, null, 2));

  console.log(`💾 Saved ${matchedCards.length} legal cards to cards_v2.json`);

  return {
    totalCards: matchedCards.length,
    cardsWithImages: cardsWithImages.length,
    nonLegalCards: unmatchedCards.length,
  };
}

// Run the script
const result = filterToLegalCardsProperly();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with images: ${result.cardsWithImages}`);
console.log(`  Non-legal cards: ${result.nonLegalCards}`);
