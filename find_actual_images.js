import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the cards_v3.json to get all card names
const cardsPath = path.join(__dirname, "public", "cards_v3.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Found ${cards.length} cards to search for`);

// Function to recursively find all image files
function findImageFiles(dir, imageFiles = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findImageFiles(fullPath, imageFiles);
    } else if (
      item.endsWith(".jpg") ||
      item.endsWith(".jpeg") ||
      item.endsWith(".png")
    ) {
      // Get the relative path from public/images
      const relativePath = fullPath.replace(
        path.join(__dirname, "public", "images") + path.sep,
        ""
      );
      imageFiles.push({
        filename: item,
        folder: path.dirname(relativePath),
        fullPath: fullPath,
        relativePath: relativePath,
      });
    }
  }

  return imageFiles;
}

// Find all image files
const imagesDir = path.join(__dirname, "public", "images");
const allImages = findImageFiles(imagesDir);

console.log(`Found ${allImages.length} image files`);

// Create a mapping of card names to their actual image paths
const cardImageMap = {};

// For each card, try to find its image
for (const card of cards) {
  const cardName = card.title[0];

  // Try different variations of the card name
  const variations = [
    cardName,
    cardName.replace(/ - exp$/, " - Experienced"),
    cardName.replace(/ - exp2$/, " - Experienced 2"),
    cardName.replace(/ - exp3$/, " - Experienced 3"),
    cardName.replace(/ - exp4$/, " - Experienced 4"),
    cardName.replace(/ - exp5$/, " - Experienced 5"),
  ];

  let foundImage = null;

  for (const variation of variations) {
    const imageFile = allImages.find(
      (img) =>
        img.filename === `${variation}.jpg` ||
        img.filename === `${variation}.jpeg` ||
        img.filename === `${variation}.png`
    );

    if (imageFile) {
      foundImage = imageFile;
      break;
    }
  }

  if (foundImage) {
    cardImageMap[cardName] = `/images/${foundImage.relativePath.replace(
      /\\/g,
      "/"
    )}`;
  } else {
    console.log(`❌ No image found for: ${cardName}`);
  }
}

console.log(`\nFound images for ${Object.keys(cardImageMap).length} cards`);

// Save the mapping
const mappingPath = path.join(__dirname, "card_image_mapping.json");
fs.writeFileSync(mappingPath, JSON.stringify(cardImageMap, null, 2));
console.log(`Saved mapping to ${mappingPath}`);

// Show some examples
console.log(`\n=== EXAMPLES ===`);
const examples = Object.entries(cardImageMap).slice(0, 10);
for (const [cardName, imagePath] of examples) {
  console.log(`${cardName}: ${imagePath}`);
}

console.log(`\n=== MISSING IMAGES ===`);
const missingCards = cards.filter((card) => !cardImageMap[card.title[0]]);
console.log(`Missing images for ${missingCards.length} cards:`);
missingCards.slice(0, 10).forEach((card) => {
  console.log(`- ${card.title[0]}`);
});
