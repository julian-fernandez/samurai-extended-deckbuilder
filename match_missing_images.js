import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map set abbreviations to folder names
const SET_FOLDER_MAP = {
  Promo: "Promotional-Emperor", // Promo cards with emperor legal tags go here
  Promotional: "Promotional-Emperor",
  SC: "Second City",
  EP: "Evil Portents",
  ThA: "Thunderous Acclaim",
  SCW: "Siege: Clan War",
  AD: "Ambition-s Debt",
  AoD: "Anvil of Despair",
  CJ: "Crimson and Jade",
  DJH: "Dark Allies",
  FaS: "Fire and Shadow",
  FK: "Forbidden Knowledge",
  FL: "Forgotten Legacy",
  KD: "Khan-s Defiance",
  Celestial: "Celestial Edition",
  WoE: "Wrath of the Emperor",
  Samurai: "Samurai Edition",
  Lotus: "Lotus Edition",
  APC: "A Perfect Cut",
  Diamond: "Diamond Edition",
  Gold: "Gold Edition",
  Jade: "Jade Edition",
  Ivory: "Ivory Edition",
  Emperor: "Emperor Edition",
  Imperial: "Imperial Edition",
  Obsidian: "Obsidian Edition",
  Pearl: "Pearl Edition",
  SW: "The War of Spirits",
  RotS: "Rise of the Shogun",
  TPW: "The Plague War",
  TH: "The Harbinger",
  EaW: "Empire at War",
  TDoW: "The Dead of Winter",
  BtD: "Before the Dawn",
  GotE: "Glory of the Empire",
  SotE: "Soul of the Empire",
  TAS: "Torn Asunder",
  WotE: "Wrath of the Emperor",
  EJC: "Test of the Emerald and Jade Championships",
  TSE: "The Shadow-s Embrace",
  BoBP: "Battle of Beiden Pass",
  BoKT: "Battle of Kyuden Tonbo",
  CoM: "Coils of Madness",
  CotM: "Code of Bushido",
  DoW: "Drums of War",
  HaE: "Heaven and Earth",
  HoR: "Honor Bound",
  PoH: "Path of Hope",
  SoSM: "Stronger Than Steel",
  WaD: "Words and Deeds",
  THW: "The Heaven's Will",
  DaK: "Death at Koten",
  PoD: "Path of the Destroyer",
  EoME: "Enemy of My Enemy",
  FOU: "Fire and Shadow",
  HC: "Hidden City",
  SL: "Stronger Than Steel",
  WoC: "Winds of Change",
  TotV: "Test of the Emerald and Jade Championships",
  WoL: "Wrath of the Emperor",
  HaT: "Honor and Treachery",
  HV: "Honor-s Veil",
  IG2: "The Imperial Gift 2",
  AM: "A Matter of Honor",
  ALitS: "A Line in the Sand",
  AMoH: "Aftermath",
  AOF: "An Oni-s Fury",
  BB: "Broken Blades",
  CE15MRP: "Celestial Edition 15th Anniversary",
  CoB: "Crimson and Jade",
  DA: "Dark Allies",
  DotE: "Dawn of the Empire",
  Tomorrow: "Tomorrow",
  TCW: "The Coming Storm",
  TG2: "The Great Clans",
  HE1: "Hidden Emperor 1",
  HE2: "Hidden Emperor 2",
  HE3: "Hidden Emperor 3",
  HE4: "Hidden Emperor 4",
  HE5: "Hidden Emperor 5",
  HE6: "Hidden Emperor 6",
  STS: "Stronger Than Steel",
  SOMP: "Stronger Than Steel",
  KYD: "Khan-s Defiance",
  WaD: "Words and Deeds",
};

// Recursively find all image files
function findImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Generate card name variations
function generateCardNameVariations(cardName) {
  const variations = [cardName];

  // Try with/without experienced suffixes
  variations.push(cardName.replace(/ - Experienced$/, ""));
  variations.push(cardName.replace(/ - Experienced 2$/, ""));
  variations.push(cardName.replace(/ - Experienced 3$/, ""));
  variations.push(cardName.replace(/ - Experienced 4$/, ""));
  variations.push(cardName.replace(/ - Experienced 5$/, ""));

  // Try with/without hyphens
  variations.push(cardName.replace(/-/g, " "));
  variations.push(cardName.replace(/\s+/g, "-"));

  // Try with/without apostrophes
  variations.push(cardName.replace(/'/g, ""));
  variations.push(cardName.replace(/'/g, "-"));

  // Remove special characters
  variations.push(cardName.replace(/[:"\\/?<>|*]/g, ""));

  return [...new Set(variations)].filter((v) => v && v.length > 0);
}

// Find image for a card
function findImageForCard(card, imageFiles) {
  const cardName = card.title?.[0] || card.puretexttitle || card.formattedtitle;
  if (!cardName) return null;

  const sets = card.set || [];
  const nameVariations = generateCardNameVariations(cardName);

  // First, try folders based on set abbreviations
  for (const set of sets) {
    const folderName = SET_FOLDER_MAP[set] || set;
    for (const nameVar of nameVariations) {
      const possiblePaths = [
        path.join(__dirname, "public", "images", folderName, `${nameVar}.jpg`),
        path.join(__dirname, "public", "images", folderName, `${nameVar}.jpeg`),
        path.join(__dirname, "public", "images", folderName, `${nameVar}.png`),
      ];

      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          const relativePath = path.relative(
            path.join(__dirname, "public"),
            possiblePath
          );
          return `/${relativePath.replace(/\\/g, "/")}`;
        }
      }
    }
  }

  // If not found, search all folders
  for (const imageFile of imageFiles) {
    const fileName = path.basename(imageFile, path.extname(imageFile));
    for (const nameVar of nameVariations) {
      if (
        fileName.toLowerCase() === nameVar.toLowerCase() ||
        fileName.toLowerCase().includes(nameVar.toLowerCase()) ||
        nameVar.toLowerCase().includes(fileName.toLowerCase())
      ) {
        const relativePath = path.relative(
          path.join(__dirname, "public"),
          imageFile
        );
        return `/${relativePath.replace(/\\/g, "/")}`;
      }
    }
  }

  return null;
}

console.log("=== MATCHING MISSING IMAGES ===");

// Load cards
const cardsPath = path.join(__dirname, "public", "cards_v3.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

// Find cards with missing images
const cardsWithoutImages = cards.filter(
  (card) => !card.imagePath || card.imagePath === "" || card.imagePath === false
);

console.log(`Found ${cardsWithoutImages.length} cards without images`);

// Find all image files
const imagesDir = path.join(__dirname, "public", "images");
const imageFiles = findImageFiles(imagesDir);
console.log(`Found ${imageFiles.length} image files to search`);

// Try to match images
let matched = 0;
const updates = [];

for (const card of cardsWithoutImages) {
  const imagePath = findImageForCard(card, imageFiles);
  if (imagePath) {
    card.imagePath = imagePath;
    updates.push({
      card: card.title?.[0] || card.cardid,
      imagePath: imagePath,
    });
    matched++;
  }
}

console.log(`\nMatched ${matched} images`);

if (matched > 0) {
  // Save updated cards
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), "utf8");
  fs.writeFileSync(
    path.join(__dirname, "dist", "cards_v3.json"),
    JSON.stringify(cards, null, 2),
    "utf8"
  );

  console.log("\n=== SAMPLE MATCHES ===");
  updates.slice(0, 20).forEach((update) => {
    console.log(`${update.card}: ${update.imagePath}`);
  });

  if (updates.length > 20) {
    console.log(`... and ${updates.length - 20} more`);
  }

  console.log(`\n✅ Updated cards_v3.json with ${matched} new image paths`);
} else {
  console.log("\n❌ No images matched");
}
