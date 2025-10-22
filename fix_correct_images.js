import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the current card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Create a backup
fs.writeFileSync(
  path.join(__dirname, "public", "cards_v2_before_image_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before image fixes");

// Function to find a card by ID
function findCardById(cardId) {
  return cards.find((card) => card.cardid === cardId);
}

// Specific image fixes based on actual files found
const imageFixes = [
  {
    cardId: 9119, // Utaku Yu-Pan (experienced)
    name: "Utaku Yu-Pan",
    currentImage: "/images/Gold Edition/Utaku Yu-Pan.jpg",
    correctImage: "/images/Samurai Edition/Utaku Yu-Pan - Experienced.jpg",
  },
  {
    cardId: 19386, // Utaku Yu-Pan - Experienced
    name: "Utaku Yu-Pan - Experienced",
    currentImage: "/images/Gold Edition/Utaku Yu-Pan.jpg",
    correctImage: "/images/Rise of the Shogun/Utaku Yu-Pan - Experienced.jpg",
  },
  {
    cardId: 19191, // Utaku Yu-Pan - Experienced 2
    name: "Utaku Yu-Pan - Experienced 2",
    currentImage: "/images/Gold Edition/Utaku Yu-Pan.jpg",
    correctImage: "/images/The Plague War/Utaku Yu-Pan - Experienced 2.jpg",
  },
  {
    cardId: 17117, // Shosuro Kameyoi - Experienced
    name: "Shosuro Kameyoi - Experienced",
    currentImage: "/images/Emperor Edition/Shosuro Kameyoi - Experienced.jpg",
    correctImage: "/images/Coils of Madness/Shosuro Kameyoi - Experienced.jpg",
  },
];

console.log("Applying image fixes...\n");

let cardsFixed = 0;

for (const fix of imageFixes) {
  const card = findCardById(fix.cardId);
  if (card) {
    console.log(`Fixing ${card.title[0]} (ID: ${card.cardid})`);
    console.log(`  Current: ${card.imagePath}`);
    console.log(`  Correct: ${fix.correctImage}`);

    if (card.imagePath !== fix.correctImage) {
      card.imagePath = fix.correctImage;
      console.log(`  ✅ Updated image path`);
      cardsFixed++;
    } else {
      console.log(`  ✅ Already correct`);
    }
    console.log("");
  } else {
    console.log(`Card ID ${fix.cardId} not found\n`);
  }
}

// Save the updated cards
console.log(`Saving updated cards...`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");

console.log(`\n=== SUMMARY ===`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Total fixes applied: ${imageFixes.length}`);
