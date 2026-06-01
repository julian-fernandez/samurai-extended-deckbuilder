import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { importDeck } from "./src/services/deckService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testImportFull() {
  console.log("🔍 Testing full import function...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const allCards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Loaded ${allCards.length} cards`);

  // Test deck text
  const deckText = `# Stronghold
1 Midday Shadow Court

# Dynasty
# Personalities (21)
3 Shosuro Kameyoi
3 Shosuro Makiko
2 Shosuro Rin`;

  console.log("Testing import with deck text:");
  console.log(deckText);

  const result = importDeck(deckText, allCards);

  console.log("\n📊 Import Results:");
  console.log(`  Deck length: ${result.deck.length}`);
  console.log(`  Missing cards: ${result.missingCards.length}`);
  console.log(`  Banned cards: ${result.bannedCards.length}`);

  if (result.deck.length > 0) {
    console.log("\n📋 Imported cards:");
    result.deck.forEach((card) => {
      console.log(
        `  - ${card.formattedtitle || card.title?.[0]}: ${
          card.quantity
        }x (cardid: ${card.cardid})`
      );
    });
  }

  if (result.missingCards.length > 0) {
    console.log("\n❌ Missing cards:");
    result.missingCards.forEach((card) => {
      console.log(`  - ${card.name}: ${card.quantity}x`);
    });
  }

  if (result.bannedCards.length > 0) {
    console.log("\n🚫 Banned cards:");
    result.bannedCards.forEach((card) => {
      console.log(`  - ${card.name}: ${card.quantity}x - ${card.reason}`);
    });
  }
}

testImportFull();
