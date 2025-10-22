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
  path.join(__dirname, "public", "cards_v2_before_final_image_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before final image fixes");

// Function to clean formatted title to match actual filenames
function cleanFormattedTitle(formattedTitle) {
  if (!formattedTitle) return null;

  // Replace HTML entities
  let cleaned = formattedTitle
    .replace(/&#149;/g, "•")
    .replace(/&#8226;/g, "•")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

// Function to find the correct image file for any card
function findCorrectImageFile(card) {
  if (!card.formattedtitle) return null;

  const cleanedTitle = cleanFormattedTitle(card.formattedtitle);
  if (!cleanedTitle) return null;

  // Search for the image file in all subdirectories
  const imagesDir = path.join(__dirname, "public", "images");

  try {
    const subdirs = fs
      .readdirSync(imagesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const subdir of subdirs) {
      const imagePath = path.join(imagesDir, subdir, `${cleanedTitle}.jpg`);
      if (fs.existsSync(imagePath)) {
        return `/images/${subdir}/${cleanedTitle}.jpg`;
      }
    }
  } catch (error) {
    console.log(`Error searching for ${cleanedTitle}:`, error.message);
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

  const cleanedTitle = cleanFormattedTitle(card.formattedtitle);
  console.log(`Formatted title: "${card.formattedtitle}"`);
  console.log(`Cleaned title: "${cleanedTitle}"`);

  const correctImagePath = findCorrectImageFile(card);

  if (!correctImagePath) {
    console.log(`❌ Could not find image file for "${cleanedTitle}"`);
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
    cleanedTitle: cleanedTitle,
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
  console.log(`  Cleaned title: ${fix.cleanedTitle}`);
  console.log(`  Old image: ${fix.oldImagePath}`);
  console.log(`  New image: ${fix.newImagePath}`);
});
