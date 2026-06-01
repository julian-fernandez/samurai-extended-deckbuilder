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
  path.join(__dirname, "public", "cards_v2_before_proper_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before proper image fixes");

// Function to find a card by ID
function findCardById(cardId) {
  return cards.find((card) => card.cardid === cardId);
}

// Function to find a card by name
function findCardByName(name) {
  return cards.find((card) => card.title && card.title[0] === name);
}

// CORRECT image fixes based on actual files and card types
const imageFixes = [
  // Utaku Yu-Pan cards - need to identify which is base vs experienced
  {
    cardId: 9119, // This is actually the experienced version
    name: "Utaku Yu-Pan (experienced)",
    currentImage: "/images/Samurai Edition/Utaku Yu-Pan - Experienced.jpg",
    correctImage: "/images/Gold Edition/Utaku Yu-Pan.jpg", // Should be base image
    reason: "This card has 'Experienced' keyword but should show base image",
  },
  {
    cardId: 19386, // Utaku Yu-Pan - Experienced
    name: "Utaku Yu-Pan - Experienced",
    currentImage: "/images/Rise of the Shogun/Utaku Yu-Pan - Experienced.jpg",
    correctImage: "/images/Rise of the Shogun/Utaku Yu-Pan - Experienced.jpg", // Already correct
    reason: "This is the experienced version",
  },
  {
    cardId: 19191, // Utaku Yu-Pan - Experienced 2
    name: "Utaku Yu-Pan - Experienced 2",
    currentImage: "/images/The Plague War/Utaku Yu-Pan - Experienced 2.jpg",
    correctImage: "/images/The Plague War/Utaku Yu-Pan - Experienced 2.jpg", // Already correct
    reason: "This is the experienced 2 version",
  },
  // Utaku Ji-Yun - Experienced
  {
    cardId: 10329, // Utaku Ji-Yun - Experienced
    name: "Utaku Ji-Yun - Experienced",
    currentImage: "/images/Forgotten Legacy/Utaku Ji-Yun.jpg", // Currently using base image
    correctImage: "/images/Torn Asunder/Utaku Ji-Yun - Experienced.jpg", // Should use experienced image
    reason: "This is the experienced version but showing base image",
  },
];

console.log("Analyzing card issues...\n");

// First, let's understand what we have
const utakuYuPanCards = cards.filter(
  (card) =>
    card.title && card.title[0] && card.title[0].includes("Utaku Yu-Pan")
);

console.log("Utaku Yu-Pan cards found:");
utakuYuPanCards.forEach((card) => {
  const isExperienced = card.keywords && card.keywords.includes("Experienced");
  const isExp2 = card.keywords && card.keywords.includes("Experienced 2");
  console.log(`- ID ${card.cardid}: "${card.title[0]}"`);
  console.log(
    `  Keywords: ${card.keywords ? card.keywords.join(", ") : "none"}`
  );
  console.log(`  Is Experienced: ${isExperienced}, Is Exp2: ${isExp2}`);
  console.log(`  Current image: ${card.imagePath}`);
  console.log("");
});

// Find Utaku Ji-Yun cards
const utakuJiYunCards = cards.filter(
  (card) =>
    card.title && card.title[0] && card.title[0].includes("Utaku Ji-Yun")
);

console.log("Utaku Ji-Yun cards found:");
utakuJiYunCards.forEach((card) => {
  const isExperienced = card.keywords && card.keywords.includes("Experienced");
  console.log(`- ID ${card.cardid}: "${card.title[0]}"`);
  console.log(
    `  Keywords: ${card.keywords ? card.keywords.join(", ") : "none"}`
  );
  console.log(`  Is Experienced: ${isExperienced}`);
  console.log(`  Current image: ${card.imagePath}`);
  console.log("");
});

console.log("Applying correct image fixes...\n");

let cardsFixed = 0;

for (const fix of imageFixes) {
  const card = findCardById(fix.cardId);
  if (card) {
    console.log(`Fixing ${card.title[0]} (ID: ${card.cardid})`);
    console.log(`  Current: ${card.imagePath}`);
    console.log(`  Correct: ${fix.correctImage}`);
    console.log(`  Reason: ${fix.reason}`);

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
