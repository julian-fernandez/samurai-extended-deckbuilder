import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function filterToLegalCardsCorrectly() {
  console.log("🔧 Filtering to ONLY cards legal in Samurai Extended format...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Original dataset has ${allCards.length} cards`);

  // Define the ONLY legal legalities for Samurai Extended format
  const legalLegalities = [
    "Samurai&nbsp;Edition",
    "Celestial&nbsp;Edition",
    "Emperor&nbsp;Edition",
    "Ivory&nbsp;Edition",
    "Twenty&nbsp;Festivals",
  ];

  console.log("Legal legalities for Samurai Extended:");
  legalLegalities.forEach((legality) => console.log(`  - ${legality}`));

  // Filter cards to only include those with at least one legal legality
  const legalCards = allCards.filter((card) => {
    if (!card.legality || !Array.isArray(card.legality)) {
      return false;
    }

    // Check if card has ANY legal legality
    const hasLegalLegality = card.legality.some((legality) =>
      legalLegalities.includes(legality)
    );

    return hasLegalLegality;
  });

  console.log(`✅ Found ${legalCards.length} cards legal in Samurai Extended`);
  console.log(
    `❌ Removed ${allCards.length - legalCards.length} illegal cards`
  );

  // Count cards with images
  const cardsWithImages = legalCards.filter(
    (card) => card.imagePath && card.imagePath !== null
  );
  console.log(`🖼️ ${cardsWithImages.length} legal cards have images`);

  // Show some examples of legal cards
  console.log("\n📋 Examples of legal cards:");
  const examples = legalCards.slice(0, 10);
  examples.forEach((card) => {
    const cardName = card.formattedtitle || card.name;
    const legalities = card.legality.join(", ");
    console.log(`  - ${cardName}: ${legalities}`);
  });

  // Show some examples of removed cards
  const removedCards = allCards.filter((card) => {
    if (!card.legality || !Array.isArray(card.legality)) {
      return true;
    }
    return !card.legality.some((legality) =>
      legalLegalities.includes(legality)
    );
  });

  console.log("\n📋 Examples of removed cards:");
  const removedExamples = removedCards.slice(0, 10);
  removedExamples.forEach((card) => {
    const cardName = card.formattedtitle || card.name;
    const legalities = card.legality?.join(", ") || "no legalities";
    console.log(`  - ${cardName}: ${legalities}`);
  });

  // Save the filtered cards
  fs.writeFileSync(cardsPath, JSON.stringify(legalCards, null, 2));

  console.log(`💾 Saved ${legalCards.length} legal cards to cards_v2.json`);

  return {
    totalCards: legalCards.length,
    cardsWithImages: cardsWithImages.length,
    removedCards: allCards.length - legalCards.length,
  };
}

// Run the script
const result = filterToLegalCardsCorrectly();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with images: ${result.cardsWithImages}`);
console.log(`  Removed cards: ${result.removedCards}`);
