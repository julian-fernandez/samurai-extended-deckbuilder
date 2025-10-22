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

// Function to check if image file exists
function imageExists(imagePath) {
  const fullPath = path.join(__dirname, "public", imagePath);
  return fs.existsSync(fullPath);
}

// Function to get correct image path based on formatted title
function getCorrectImagePath(card) {
  if (!card.formattedtitle) return null;

  // Clean the formatted title to get the proper image name
  let imageName = card.formattedtitle;

  // Replace HTML entities
  imageName = imageName.replace(/&#149;/g, "•");
  imageName = imageName.replace(/&#8226;/g, "•");
  imageName = imageName.replace(/&amp;/g, "&");
  imageName = imageName.replace(/&lt;/g, "<");
  imageName = imageName.replace(/&gt;/g, ">");
  imageName = imageName.replace(/&quot;/g, '"');
  imageName = imageName.replace(/&#39;/g, "'");

  // Remove any HTML tags
  imageName = imageName.replace(/<[^>]*>/g, "");

  // Trim whitespace
  imageName = imageName.trim();

  // Create the image path
  const imagePath = `/images/${imageName}.jpg`;

  return imagePath;
}

// Main processing
console.log("\n=== FIXING IMAGE PATHS BASED ON FORMATTED TITLES ===");

let cardsFixed = 0;
let cardsSkipped = 0;
const fixes = [];

for (const card of cards) {
  const cardName = card.title[0];
  console.log(`\n--- Processing: ${cardName} (ID: ${card.cardid}) ---`);

  if (!card.formattedtitle) {
    console.log(`❌ No formatted title found`);
    cardsSkipped++;
    continue;
  }

  console.log(`Formatted title: "${card.formattedtitle}"`);

  const correctImagePath = getCorrectImagePath(card);
  console.log(`Expected image path: ${correctImagePath}`);

  if (!correctImagePath) {
    console.log(`❌ Could not determine correct image path`);
    cardsSkipped++;
    continue;
  }

  // Check if the correct image exists
  if (!imageExists(correctImagePath)) {
    console.log(`⚠️  Expected image not found: ${correctImagePath}`);
    cardsSkipped++;
    continue;
  }

  // Check if the image path needs to be updated
  if (card.imagePath === correctImagePath) {
    console.log(`✅ Image path already correct`);
    continue;
  }

  console.log(`🖼️  Fixing image: ${card.imagePath} -> ${correctImagePath}`);

  const fix = {
    cardId: card.cardid,
    name: cardName,
    formattedTitle: card.formattedtitle,
    oldImagePath: card.imagePath,
    newImagePath: correctImagePath,
  };

  // Update the image path
  card.imagePath = correctImagePath;

  fixes.push(fix);
  cardsFixed++;
  console.log(`✅ Fixed image path`);
}

// Save the updated cards
console.log(`\n=== SAVING CHANGES ===`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");

console.log(`\n=== SUMMARY ===`);
console.log(`Cards processed: ${cards.length}`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Cards skipped: ${cardsSkipped}`);

console.log(`\n=== DETAILED FIXES ===`);
fixes.forEach((fix) => {
  console.log(`\n${fix.name} (ID: ${fix.cardId}):`);
  console.log(`  Formatted title: ${fix.formattedTitle}`);
  console.log(`  Old image: ${fix.oldImagePath}`);
  console.log(`  New image: ${fix.newImagePath}`);
});
