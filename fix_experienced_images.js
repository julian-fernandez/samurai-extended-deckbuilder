import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatCardNameForFile(cardName) {
  return cardName
    .replace(/&#149;/g, " - ")
    .replace(/&#8226;/g, " - ")
    .replace(/•/g, " - ")
    .replace(/ - Experienced( \d+)?/g, (match, p1) =>
      p1 ? ` - Experienced ${p1.trim()}` : " - Experienced"
    )
    .replace(/ - exp( \d+)?/g, (match, p1) =>
      p1 ? ` - Experienced ${p1.trim()}` : " - Experienced"
    )
    .replace(/ - Inexperienced/g, " - Inexperienced")
    .replace(/ - base/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "-")
    .replace(/&apos;/g, "'")
    .replace(/[™®©]/g, "")
    .replace(/[:"\\/?<>|*]/g, "")
    .replace(/\s+/g, " ") // Collapse multiple spaces to single space
    .trim();
}

function findCardImage(card) {
  const imagesDir = path.join(__dirname, "public", "images");

  // Try to get card name from various fields
  let cardName = card.formattedtitle || card.title?.[0] || card.name;
  if (!cardName) return null;

  // First, normalize the card name to handle extra spaces
  const normalizedCardName = cardName.replace(/\s+/g, " ").trim();
  const baseFileName = formatCardNameForFile(normalizedCardName);

  // Get all actual folders that exist
  const allFolders = fs
    .readdirSync(imagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Try each folder
  for (const folder of allFolders) {
    const folderPath = path.join(imagesDir, folder);

    // Try different filename variations
    const variations = [
      baseFileName,
      // Try with the original spacing
      normalizedCardName
        .replace(/&#149;/g, " - ")
        .replace(/&#8226;/g, " - ")
        .replace(/•/g, " - "),
      // Try with HTML entities
      normalizedCardName
        .replace(/&#149;/g, " &#149; ")
        .replace(/&#8226;/g, " &#8226; ")
        .replace(/•/g, " • "),
      // Try with different spacing
      normalizedCardName.replace(/\s+/g, " "),
      normalizedCardName.replace(/\s+/g, ""),
      // Try with different experienced formats
      baseFileName.replace(/ - Experienced/g, " - exp"),
      baseFileName.replace(/ - Experienced/g, " &#149; Experienced"),
      baseFileName.replace(/ - Experienced/g, " • Experienced"),
      baseFileName.replace(/ - exp/g, " - Experienced"),
      baseFileName.replace(/ - exp/g, " &#149; Experienced"),
      baseFileName.replace(/ - exp/g, " • Experienced"),
    ];

    for (const variation of variations) {
      const imagePath = path.join(folderPath, `${variation}.jpg`);
      if (fs.existsSync(imagePath)) {
        return `/images/${folder}/${variation}.jpg`;
      }
    }
  }

  return null;
}

function fixExperiencedImages() {
  console.log("🔧 Fixing image paths for experienced cards...");

  // Load the cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Processing ${cards.length} cards...`);

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundCards = [];

  for (const card of cards) {
    try {
      const imagePath = findCardImage(card);
      if (imagePath) {
        card.imagePath = imagePath;
        updatedCount++;
      } else {
        notFoundCount++;
        notFoundCards.push(card.formattedtitle || card.name);
      }
    } catch (error) {
      console.warn(
        `Failed to process ${card.formattedtitle || card.name}: ${
          error.message
        }`
      );
      notFoundCount++;
      notFoundCards.push(card.formattedtitle || card.name);
    }
  }

  // Save the updated cards
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

  console.log(`✅ Updated ${updatedCount} cards with image paths`);
  console.log(`❌ ${notFoundCount} cards without images`);

  if (notFoundCards.length > 0) {
    console.log("Missing images for (first 20):");
    notFoundCards.slice(0, 20).forEach((card) => console.log(`  - ${card}`));
  }

  console.log(`💾 Saved updated dataset to cards_v2.json`);
}

fixExperiencedImages();
