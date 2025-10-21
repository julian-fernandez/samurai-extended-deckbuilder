import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function debugImport() {
  console.log("🔍 Debugging deck import...");

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
  console.log("Testing import lines:");

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    console.log(`Line ${index + 1}: "${trimmed}"`);

    if (!trimmed || trimmed.startsWith("#")) {
      console.log(`  -> Skipped (empty or comment)`);
      return;
    }

    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();
      console.log(`  -> Parsed: ${quantity}x "${cardName}"`);

      // Find card
      const card = allCards.find((c) => {
        return c.formattedtitle === cardName || c.title?.[0] === cardName;
      });

      if (card) {
        console.log(
          `  -> ✅ Found: ${card.formattedtitle} (cardid: ${card.cardid})`
        );
      } else {
        console.log(`  -> ❌ Not found`);
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
              console.log(`    - ${s.formattedtitle || s.title?.[0]}`)
            );
        }
      }
    } else {
      console.log(`  -> No match pattern`);
    }
  });
}

debugImport();
