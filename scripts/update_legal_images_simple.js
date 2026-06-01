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
    .replace(/\s+/g, " ")
    .trim();
}

function findCardImage(card) {
  const imagesDir = path.join(__dirname, "public", "images");

  // Try to get card name from various fields
  let cardName = card.formattedtitle || card.title?.[0] || card.name;
  if (!cardName) return null;

  const baseFileName = formatCardNameForFile(cardName);

  // Use the actual folders that exist, prioritized by legal sets
  const folders = [
    "Emperor Edition",
    "Celestial Edition",
    "Samurai Edition",
    "Twenty Festivals",
    "Age of Conquest",
    "Age of Enlightenment",
    "A Brother's Destiny",
    "Clan War",
    "Dark Allies",
    "Forgotten Legacy",
    "Heaven and Earth",
    "Path of the Destroyer",
    "Promotional-Emperor",
    "Promotional-Celestial",
    "Promotional-Samurai",
    "Promotional-Twenty Festivals",
    "Race for the Throne",
    "Stronger Than Steel",
    "The Destroyer War",
    "The Four Winds",
    "The Hidden Emperor",
    "The Shadow-s Embrace",
    "The War's Heart",
    "Torn Asunder",
    "War of Honor",
    "Words and Deeds",
    "Honor-s Veil",
    "Coils of Madness",
    "Gold Edition",
    "Lotus Edition",
    "Diamond Edition",
    "Onyx Edition",
    "Jade Edition",
    "Imperial Edition",
    "Shadowlands",
    "Fire and Shadow",
    "Soul of the Empire",
    "The Great Clans",
    "Winds of Change",
    "The Crimson Throne",
    "The Worldwound",
  ];

  // Try each folder
  for (const folder of folders) {
    const folderPath = path.join(imagesDir, folder);
    if (!fs.existsSync(folderPath)) continue;

    // Try different filename variations
    const variations = [
      baseFileName,
      baseFileName.replace(/ - Experienced/g, " - exp"),
      baseFileName.replace(/ - Experienced/g, " &#149; Experienced"),
      baseFileName.replace(/ - Experienced/g, " • Experienced"),
      baseFileName.replace(/ - Experienced/g, " - Experienced"),
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

function updateLegalImages() {
  console.log("🔧 Updating image paths for legal cards...");

  // Load the legal cards
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  console.log(`📊 Processing ${cards.length} legal cards...`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const card of cards) {
    try {
      const imagePath = findCardImage(card);
      if (imagePath) {
        card.imagePath = imagePath;
        updatedCount++;
      } else {
        notFoundCount++;
        if (notFoundCount <= 10) {
          console.log(
            `  ❌ No image found for: ${card.formattedtitle || card.name}`
          );
        }
      }
    } catch (error) {
      console.warn(
        `Failed to process ${card.formattedtitle || card.name}: ${
          error.message
        }`
      );
    }
  }

  // Save the updated cards
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

  console.log(`✅ Updated ${updatedCount} cards with image paths`);
  console.log(`❌ ${notFoundCount} cards without images`);
  console.log(`💾 Saved updated dataset to cards_v2.json`);
}

updateLegalImages();
