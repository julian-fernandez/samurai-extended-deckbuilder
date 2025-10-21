import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixLegalityPrecise() {
  console.log("🔧 Precise legality check - only keeping truly legal cards...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Original dataset has ${allCards.length} cards`);

  // Define the ONLY legal editions for Samurai Extended format
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
      // Be more precise - only match if the edition is in parentheses or is the exact string
      const isLegal = legalEditions.some((edition) => {
        // Match patterns like "SetName (Edition)" or "Edition" exactly
        return (
          legality.includes(`(${edition})`) ||
          legality === edition ||
          legality === `${edition}&nbsp;Edition` ||
          legality === `${edition} Edition`
        );
      });

      if (isLegal) {
        console.log(
          `✅ ${card.formattedtitle || card.name}: ${legality} (LEGAL)`
        );
      } else {
        console.log(
          `❌ ${card.formattedtitle || card.name}: ${legality} (ILLEGAL)`
        );
      }

      return isLegal;
    });

    return hasLegalEdition;
  });

  console.log(
    `\n✅ Found ${legalCards.length} cards legal in Samurai Extended`
  );
  console.log(
    `❌ Removed ${allCards.length - legalCards.length} illegal cards`
  );

  // Count cards with images
  const cardsWithImages = legalCards.filter(
    (card) => card.imagePath && card.imagePath !== null
  );
  console.log(`🖼️ ${cardsWithImages.length} legal cards have images`);

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
const result = fixLegalityPrecise();
console.log("\n📊 Final Results:");
console.log(`  Total legal cards: ${result.totalCards}`);
console.log(`  Cards with images: ${result.cardsWithImages}`);
console.log(`  Removed cards: ${result.removedCards}`);
