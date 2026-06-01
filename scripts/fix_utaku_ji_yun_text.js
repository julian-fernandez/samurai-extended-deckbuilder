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
  path.join(__dirname, "public", "cards_v2_before_text_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before text fixes");

// Function to find a card by ID
function findCardById(cardId) {
  return cards.find((card) => card.cardid === cardId);
}

// Fix Utaku Ji-Yun base version (ID: 10329) - should NOT have "Experienced" keyword
const utakuJiYunBase = findCardById(10329);

if (utakuJiYunBase) {
  console.log("Fixing Utaku Ji-Yun base version (ID: 10329):");
  console.log(`  Current title: "${utakuJiYunBase.title[0]}"`);
  console.log(
    `  Current keywords: ${
      utakuJiYunBase.keywords ? utakuJiYunBase.keywords.join(", ") : "none"
    }`
  );
  console.log(
    `  Current text: ${utakuJiYunBase.text ? utakuJiYunBase.text[0] : "none"}`
  );

  // Remove "Experienced" from keywords if present
  if (
    utakuJiYunBase.keywords &&
    utakuJiYunBase.keywords.includes("Experienced")
  ) {
    utakuJiYunBase.keywords = utakuJiYunBase.keywords.filter(
      (keyword) => keyword !== "Experienced"
    );
    console.log(`  ✅ Removed "Experienced" from keywords`);
  }

  // Update text to match XML
  const correctText =
    "Negate Ji-Yun's dishonoring from other players' cards' effects.";
  if (!utakuJiYunBase.text || utakuJiYunBase.text[0] !== correctText) {
    utakuJiYunBase.text = [correctText];
    console.log(`  ✅ Updated text to: "${correctText}"`);
  }

  // Update keywords to match XML (remove Imperial, Magistrate, Paragon, add correct ones)
  const correctKeywords = [
    "<b>Cavalry</b>",
    "<b>Unique</b>",
    "Battle Maiden",
    "Paragon",
    "Samurai",
    "Unicorn Clan",
  ];

  // Remove incorrect keywords
  const keywordsToRemove = [
    "Emerald Champion",
    "Experienced",
    "Imperial",
    "Magistrate",
  ];
  if (utakuJiYunBase.keywords) {
    utakuJiYunBase.keywords = utakuJiYunBase.keywords.filter(
      (keyword) => !keywordsToRemove.includes(keyword)
    );
  }

  // Add missing keywords
  correctKeywords.forEach((keyword) => {
    if (
      !utakuJiYunBase.keywords ||
      !utakuJiYunBase.keywords.includes(keyword)
    ) {
      if (!utakuJiYunBase.keywords) utakuJiYunBase.keywords = [];
      utakuJiYunBase.keywords.push(keyword);
    }
  });

  console.log(
    `  ✅ Updated keywords to: ${utakuJiYunBase.keywords.join(", ")}`
  );

  console.log(`  Final result:`);
  console.log(`    Title: "${utakuJiYunBase.title[0]}"`);
  console.log(`    Keywords: ${utakuJiYunBase.keywords.join(", ")}`);
  console.log(`    Text: "${utakuJiYunBase.text[0]}"`);
  console.log(`    Image: ${utakuJiYunBase.imagePath}`);
} else {
  console.log("Utaku Ji-Yun base card (ID: 10329) not found");
}

// Save the updated cards
console.log(`\nSaving updated cards...`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");
