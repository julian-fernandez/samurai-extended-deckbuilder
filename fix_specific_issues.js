import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the current card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Function to find a card by ID
function findCardById(cardId) {
  return cards.find((card) => card.cardid === cardId);
}

// Function to find cards by name pattern
function findCardsByName(namePattern) {
  return cards.filter(
    (card) => card.title && card.title[0] && card.title[0].includes(namePattern)
  );
}

// Specific fixes for known issues
const fixes = [
  {
    name: "Utaku Yu-Pan - Experienced 2",
    cardId: 19191,
    issue: "Using non-experienced art",
    fix: "Update image path to experienced version",
  },
  {
    name: "Shosuro Kameyoi - Experienced",
    cardId: 17117,
    issue: "Broken by previous script",
    fix: "Restore original image path",
  },
];

console.log("Analyzing specific card issues...\n");

for (const fix of fixes) {
  const card = findCardById(fix.cardId);
  if (card) {
    console.log(`Card: ${card.title[0]} (ID: ${card.cardid})`);
    console.log(`Issue: ${fix.issue}`);
    console.log(`Current image: ${card.imagePath}`);
    console.log(`Fix: ${fix.fix}`);
    console.log(
      `Keywords: ${card.keywords ? card.keywords.join(", ") : "none"}`
    );
    console.log(
      `Stats: Chi=${card.chi ? card.chi[0] : "N/A"}, Force=${
        card.force ? card.force[0] : "N/A"
      }, Cost=${card.cost ? card.cost[0] : "N/A"}`
    );
    console.log("---\n");
  } else {
    console.log(`Card ID ${fix.cardId} not found\n`);
  }
}

// Find all Utaku Yu-Pan cards
const utakuYuPanCards = findCardsByName("Utaku Yu-Pan");
console.log(`Found ${utakuYuPanCards.length} Utaku Yu-Pan cards:`);
utakuYuPanCards.forEach((card) => {
  console.log(
    `- ID ${card.cardid}: "${card.title[0]}" (Keywords: ${
      card.keywords ? card.keywords.join(", ") : "none"
    })`
  );
  console.log(`  Image: ${card.imagePath}`);
  console.log(
    `  Stats: Chi=${card.chi ? card.chi[0] : "N/A"}, Force=${
      card.force ? card.force[0] : "N/A"
    }, Cost=${card.cost ? card.cost[0] : "N/A"}`
  );
});

console.log("\n=== RECOMMENDATIONS ===");
console.log(
  "1. For Utaku Yu-Pan cards, you need to provide the correct experienced image paths"
);
console.log(
  "2. For Shosuro Kameyoi - Experienced, restore the original image path"
);
console.log(
  "3. Verify that experienced images exist in the filesystem before updating paths"
);
console.log(
  "4. Stats should be appropriate for experienced versions (not necessarily higher)"
);
