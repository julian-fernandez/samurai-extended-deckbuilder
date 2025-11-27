import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the cards JSON
const cardsPath = path.join(__dirname, "public", "cards_v3.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

// Read the current mapping
const mappingPath = path.join(__dirname, "card_image_mapping.json");
let cardImageMap = {};
if (fs.existsSync(mappingPath)) {
  cardImageMap = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
}

// Get all images in the Samurai Edition folder
const samuraiEditionDir = path.join(
  __dirname,
  "public",
  "images",
  "Samurai Edition"
);
const imageFiles = fs
  .readdirSync(samuraiEditionDir)
  .filter(
    (file) =>
      file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")
  )
  .map((file) => ({
    filename: file,
    nameWithoutExt: path.basename(file, path.extname(file)),
  }));

console.log(`Found ${imageFiles.length} images in Samurai Edition folder`);

// Get all cards that have "Samurai" in their set array
const samuraiCards = cards.filter(
  (card) => card.set && Array.isArray(card.set) && card.set.includes("Samurai")
);

console.log(`Found ${samuraiCards.length} cards with Samurai set`);

// Function to normalize names for matching
function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// Function to generate name variations
function generateVariations(cardName) {
  const variations = [
    cardName,
    cardName.replace(/ - inexp$/i, " - Inexperienced"),
    cardName.replace(/ - inexp$/i, " - inexperienced"),
    cardName.replace(/ - exp$/i, " - Experienced"),
    cardName.replace(/ - exp2$/i, " - Experienced 2"),
    cardName.replace(/ - exp3$/i, " - Experienced 3"),
    cardName.replace(/ - exp4$/i, " - Experienced 4"),
    cardName.replace(/ - exp5$/i, " - Experienced 5"),
    cardName.replace(/ - Experienced$/i, " - exp"),
    cardName.replace(/ - Experienced 2$/i, " - exp2"),
    cardName.replace(/ - Experienced 3$/i, " - exp3"),
    cardName.replace(/ - Experienced 4$/i, " - exp4"),
    cardName.replace(/ - Experienced 5$/i, " - exp5"),
    cardName.replace(/ - Inexperienced$/i, " - inexp"),
    cardName.replace(/ - inexperienced$/i, " - inexp"),
  ];
  return [...new Set(variations)];
}

let matched = 0;
let updated = 0;

// Try to match each card with an image
for (const card of samuraiCards) {
  const cardName = card.title[0];
  const variations = generateVariations(cardName);

  let foundImage = null;

  for (const variation of variations) {
    const normalizedVariation = normalizeName(variation);

    for (const imageFile of imageFiles) {
      const normalizedImageName = normalizeName(imageFile.nameWithoutExt);

      if (normalizedVariation === normalizedImageName) {
        foundImage = imageFile.filename;
        break;
      }
    }

    if (foundImage) break;
  }

  if (foundImage) {
    const imagePath = `/images/Samurai Edition/${foundImage}`;

    // Only update if it's not already in the mapping or if it's different
    // But prioritize Samurai Edition if the card has multiple sets
    if (!cardImageMap[cardName] || cardImageMap[cardName] !== imagePath) {
      cardImageMap[cardName] = imagePath;
      updated++;
    }
    matched++;
  } else {
    // Only log if the card doesn't already have an image mapped
    if (!cardImageMap[cardName]) {
      console.log(`❌ No image found for: ${cardName}`);
    }
  }
}

console.log(`\nMatched ${matched} cards`);
console.log(`Updated ${updated} mappings`);

// Save the updated mapping
fs.writeFileSync(mappingPath, JSON.stringify(cardImageMap, null, 2));
console.log(`\n✅ Saved updated mapping to ${mappingPath}`);
