import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the backup card data
const backupPath = path.join(__dirname, "public", "cards_v2_backup.json");
const cardsPath = path.join(__dirname, "public", "cards_v2.json");

let cards;
if (fs.existsSync(backupPath)) {
  console.log("Loading from backup...");
  cards = JSON.parse(fs.readFileSync(backupPath, "utf8"));
} else {
  console.log("Loading current cards...");
  cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
}

console.log(`Loaded ${cards.length} cards`);

// Create a backup of current state
fs.writeFileSync(
  path.join(__dirname, "public", "cards_v2_broken_backup.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup of current broken state");

// Function to find the correct base card for Utaku Yu-Pan
function findUtakuYuPanBaseCard() {
  // Look for a card with "Utaku Yu-Pan" in title but without "Experienced" in keywords
  return cards.find((card) => {
    if (!card.title || !card.title[0]) return false;
    const title = card.title[0];
    const hasUtakuYuPan = title.includes("Utaku Yu-Pan");
    const isNotExperienced =
      !card.keywords || !card.keywords.includes("Experienced");
    const isNotExp2 =
      !card.keywords || !card.keywords.includes("Experienced 2");

    return hasUtakuYuPan && isNotExperienced && isNotExp2;
  });
}

// Function to find all Utaku Yu-Pan experienced cards
function findUtakuYuPanExperiencedCards() {
  return cards.filter((card) => {
    if (!card.title || !card.title[0]) return false;
    const title = card.title[0];
    const hasUtakuYuPan = title.includes("Utaku Yu-Pan");
    const isExperienced =
      card.keywords &&
      (card.keywords.includes("Experienced") ||
        card.keywords.includes("Experienced 2"));

    return hasUtakuYuPan && isExperienced;
  });
}

// Find Utaku Yu-Pan cards
const baseCard = findUtakuYuPanBaseCard();
const experiencedCards = findUtakuYuPanExperiencedCards();

console.log(`\nUtaku Yu-Pan Analysis:`);
console.log(
  `Base card: ${
    baseCard ? `ID ${baseCard.cardid} - "${baseCard.title[0]}"` : "Not found"
  }`
);
console.log(`Experienced cards: ${experiencedCards.length}`);
experiencedCards.forEach((card) => {
  console.log(
    `- ID ${card.cardid}: "${card.title[0]}" (Keywords: ${
      card.keywords ? card.keywords.join(", ") : "none"
    })`
  );
});

if (baseCard && experiencedCards.length > 0) {
  console.log(`\nFixing Utaku Yu-Pan cards...`);

  experiencedCards.forEach((expCard, index) => {
    console.log(
      `\nProcessing experienced card ${index + 1}: ID ${expCard.cardid} - "${
        expCard.title[0]
      }"`
    );

    // Only fix if this card is using the base card's image
    if (expCard.imagePath === baseCard.imagePath) {
      console.log(
        `  ⚠️  Card is using base card's image: ${expCard.imagePath}`
      );

      // For now, we'll leave the image path as is since we don't know the correct experienced image
      // The user will need to provide the correct experienced images
      console.log(
        `  ℹ️  Skipping image fix - need correct experienced image path`
      );
    }

    // Fix stats only if they're not higher than base
    if (
      expCard.chi &&
      baseCard.chi &&
      parseInt(expCard.chi[0]) <= parseInt(baseCard.chi[0])
    ) {
      const newChi = (parseInt(baseCard.chi[0]) + 1).toString();
      console.log(`  Fixing chi: ${expCard.chi[0]} -> ${newChi}`);
      expCard.chi[0] = newChi;
    }

    if (
      expCard.force &&
      baseCard.force &&
      parseInt(expCard.force[0]) <= parseInt(baseCard.force[0])
    ) {
      const newForce = (parseInt(baseCard.force[0]) + 1).toString();
      console.log(`  Fixing force: ${expCard.force[0]} -> ${newForce}`);
      expCard.force[0] = newForce;
    }

    if (
      expCard.cost &&
      baseCard.cost &&
      parseInt(expCard.cost[0]) <= parseInt(baseCard.cost[0])
    ) {
      const newCost = (parseInt(baseCard.cost[0]) + 1).toString();
      console.log(`  Fixing cost: ${expCard.cost[0]} -> ${newCost}`);
      expCard.cost[0] = newCost;
    }
  });
}

// Save the updated cards
console.log("\nSaving updated cards...");
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");

console.log("\n=== SUMMARY ===");
console.log(
  "The script has been conservative and only fixed obvious stat issues."
);
console.log("Image paths have been left unchanged to avoid further damage.");
console.log(
  "You'll need to manually provide the correct experienced image paths."
);
