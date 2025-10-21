import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function filterToLegalCardsProperly() {
  console.log("🔧 Filtering to ONLY cards legal in Samurai Extended format...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Original dataset has ${allCards.length} cards`);

  // Define the legal editions for Samurai Extended format
  const legalEditions = [
    "Samurai",
    "Celestial",
    "Emperor",
    "Ivory",
    "Twenty&nbsp;Festivals",
  ];

  console.log("Legal editions for Samurai Extended:");
  legalEditions.forEach((edition) => console.log(`  - ${edition}`));

  // Filter cards to only include those with at least one legal edition
  const legalCards = allCards.filter((card) => {
    if (!card.legality || !Array.isArray(card.legality)) {
      return false;
    }

    // Check if card has ANY legal edition in its legalities
    const hasLegalEdition = card.legality.some((legality) => {
      // Check if any legal edition appears in the legality string
      return legalEditions.some(
        (edition) =>
          legality.includes(`(${edition})`) ||
          legality.includes(`&nbsp;${edition}`) ||
          legality === edition
      );
    });

    return hasLegalEdition;
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
    return !card.legality.some((legality) => {
      return legalEditions.some(
        (edition) =>
          legality.includes(`(${edition})`) ||
          legality.includes(`&nbsp;${edition}`) ||
          legality === edition
      );
    });
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
const result = filterToLegalCardsProperly();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with images: ${result.cardsWithImages}`);
console.log(`  Removed cards: ${result.removedCards}`);
