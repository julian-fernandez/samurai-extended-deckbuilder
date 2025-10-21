import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function simpleImportTest() {
  console.log("🔍 Testing import logic directly...");

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

  const lines = deckText.split("\n");
  const deck = [];
  const missingCards = [];
  const bannedCards = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    // Parse quantity and card name
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();

      console.log(`Processing: ${quantity}x "${cardName}"`);

      // Find card by exact name match
      const card = allCards.find((c) => {
        return c.formattedtitle === cardName || c.title?.[0] === cardName;
      });

      if (card) {
        console.log(
          `  ✅ Found: ${card.formattedtitle} (cardid: ${card.cardid})`
        );

        // Check if this card is already in the deck
        const existingCard = deck.find((d) => d.cardid === card.cardid);
        if (existingCard) {
          console.log(
            `  -> Adding to existing card (${existingCard.quantity} -> ${
              existingCard.quantity + quantity
            })`
          );
          existingCard.quantity += quantity;
        } else {
          console.log(`  -> Adding new card to deck`);
          deck.push({ ...card, quantity });
        }
      } else {
        console.log(`  ❌ Not found`);
        missingCards.push({ name: cardName, quantity });
      }
    }
  });

  console.log("\n📊 Final Results:");
  console.log(`  Deck length: ${deck.length}`);
  console.log(`  Missing cards: ${missingCards.length}`);

  if (deck.length > 0) {
    console.log("\n📋 Imported cards:");
    deck.forEach((card) => {
      console.log(
        `  - ${card.formattedtitle || card.title?.[0]}: ${
          card.quantity
        }x (cardid: ${card.cardid})`
      );
    });
  }

  if (missingCards.length > 0) {
    console.log("\n❌ Missing cards:");
    missingCards.forEach((card) => {
      console.log(`  - ${card.name}: ${card.quantity}x`);
    });
  }
}

simpleImportTest();
