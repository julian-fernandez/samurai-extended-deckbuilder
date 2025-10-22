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
  path.join(__dirname, "public", "cards_v2_before_all_images_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before all images fix");

// Function to find the correct image file for any card
function findCorrectImageFile(card) {
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

  // Search for the image file in all subdirectories
  const imagesDir = path.join(__dirname, "public", "images");

  try {
    const subdirs = fs
      .readdirSync(imagesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const subdir of subdirs) {
      const imagePath = path.join(imagesDir, subdir, `${imageName}.jpg`);
      if (fs.existsSync(imagePath)) {
        return `/images/${subdir}/${imageName}.jpg`;
      }
    }
  } catch (error) {
    console.log(`Error searching for ${imageName}:`, error.message);
  }

  return null;
}

// Main processing
console.log("\n=== FIXING ALL CARD IMAGES ===");

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

  const correctImagePath = findCorrectImageFile(card);

  if (!correctImagePath) {
    console.log(`❌ Could not find image file for "${card.formattedtitle}"`);
    cardsSkipped++;
    continue;
  }

  console.log(`Found image: ${correctImagePath}`);

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
