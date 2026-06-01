import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testSpecificCards() {
  console.log("🔍 Testing specific card names...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Loaded ${allCards.length} cards`);

  // Test specific card names from the deck
  const testCards = [
    "Midday Shadow Court",
    "Shosuro Kameyoi",
    "Bayushi Shibata",
    "Traveling Peddler",
    "Geisha House",
    "Veiled Menace",
    "Ring of the Void",
  ];

  testCards.forEach((cardName) => {
    console.log(`\nTesting: "${cardName}"`);

    const card = allCards.find((c) => {
      return c.formattedtitle === cardName || c.title?.[0] === cardName;
    });

    if (card) {
      console.log(
        `  ✅ Found: ${card.formattedtitle} (cardid: ${card.cardid})`
      );
    } else {
      console.log(`  ❌ Not found`);

      // Try to find similar names
      const similar = allCards.filter(
        (c) =>
          c.formattedtitle?.toLowerCase().includes(cardName.toLowerCase()) ||
          c.title?.[0]?.toLowerCase().includes(cardName.toLowerCase())
      );

      if (similar.length > 0) {
        console.log(`  -> Similar names found:`);
        similar
          .slice(0, 3)
          .forEach((s) =>
            console.log(`    - "${s.formattedtitle || s.title?.[0]}"`)
          );
      }
    }
  });
}

testSpecificCards();
