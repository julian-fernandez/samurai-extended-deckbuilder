import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map set abbreviations to folder names
const SET_FOLDER_MAP = {
  EP: "Evil Portents",
  ThA: "Thunderous Acclaim",
  SCW: "Siege: Clan War",
};

// Recursively find all image files in a directory
function findImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push({
        filename: file,
        folder: path.relative(
          path.join(__dirname, "public", "images"),
          path.dirname(filePath)
        ),
        fullPath: filePath,
      });
    }
  });

  return fileList;
}

console.log("=== FIXING EXPERIENCED CARD IMAGES ===");

// Load cards
const cardsPath = path.join(__dirname, "public", "cards_v3.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

// Find all image files
const imagesDir = path.join(__dirname, "public", "images");
const imageFiles = findImageFiles(imagesDir);

// Create a map of card names to image paths for EP, ThA, SCW folders
const imageMap = {};
imageFiles.forEach((img) => {
  const folder = img.folder.replace(/\\/g, "/");
  if (
    folder === "Evil Portents" ||
    folder === "Thunderous Acclaim" ||
    folder === "Siege: Clan War"
  ) {
    const cardName = img.filename.replace(/\.(jpg|jpeg|png)$/i, "");
    const imagePath = `/images/${folder}/${img.filename}`;
    imageMap[cardName] = imagePath;
  }
});

// Find and fix experienced cards
let fixed = 0;
const fixes = [];

cards.forEach((card) => {
  if (!card.title || !card.title[0]) return;
  const title = card.title[0];
  const isExp = title.includes(" - exp") || title.includes(" - Experienced");
  if (!isExp) return;

  const sets = card.set || [];
  const relevantSet = sets.find(
    (s) => s === "EP" || s === "ThA" || s === "SCW"
  );
  if (!relevantSet) return;

  const folder = SET_FOLDER_MAP[relevantSet];
  if (!folder) return;

  // Generate possible filenames
  const baseName = title
    .replace(/ - exp$/, "")
    .replace(/ - exp2$/, "")
    .replace(/ - exp3$/, "")
    .replace(/ - exp4$/, "")
    .replace(/ - exp5$/, "")
    .replace(/ - Experienced$/, "")
    .replace(/ - Experienced 2$/, "")
    .replace(/ - Experienced 3$/, "")
    .replace(/ - Experienced 4$/, "")
    .replace(/ - Experienced 5$/, "");

  const possibleNames = [
    title
      .replace(/ - exp$/, " - Experienced")
      .replace(/ - exp2$/, " - Experienced 2")
      .replace(/ - exp3$/, " - Experienced 3")
      .replace(/ - exp4$/, " - Experienced 4")
      .replace(/ - exp5$/, " - Experienced 5"),
    title
      .replace(/ - exp/, " - Experienced")
      .replace(/ - exp2/, " - Experienced 2")
      .replace(/ - exp3/, " - Experienced 3")
      .replace(/ - exp4/, " - Experienced 4")
      .replace(/ - exp5/, " - Experienced 5"),
    title,
  ];

  // Try to find matching image
  let foundImage = null;
  for (const name of possibleNames) {
    if (imageMap[name]) {
      foundImage = imageMap[name];
      break;
    }
  }

  // Also try searching by base name + experienced variations
  if (!foundImage) {
    const expVariations = [
      `${baseName} - Experienced`,
      `${baseName} - Experienced 2`,
      `${baseName} - Experienced 3`,
      `${baseName} - Experienced 4`,
      `${baseName} - Experienced 5`,
    ];
    for (const expName of expVariations) {
      if (imageMap[expName]) {
        foundImage = imageMap[expName];
        break;
      }
    }
  }

  // Check if current image path is wrong
  const currentPath = card.imagePath || "";
  const shouldBeInFolder = folder;
  if (
    foundImage &&
    (!currentPath.includes(shouldBeInFolder) ||
      !currentPath.includes("Experienced"))
  ) {
    fixes.push({
      title,
      oldPath: currentPath,
      newPath: foundImage,
    });
    card.imagePath = foundImage;
    fixed++;
  }
});

console.log(`\nFixed ${fixed} experienced card images:\n`);
fixes.slice(0, 20).forEach((fix) => {
  console.log(`${fix.title}:`);
  console.log(`  ${fix.oldPath || "(null)"}`);
  console.log(`  -> ${fix.newPath}`);
});
if (fixes.length > 20) {
  console.log(`\n... and ${fixes.length - 20} more`);
}

// Save updated cards
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), "utf8");
fs.writeFileSync(
  path.join(__dirname, "dist", "cards_v3.json"),
  JSON.stringify(cards, null, 2),
  "utf8"
);

console.log(`\n✅ Updated cards_v3.json with ${fixed} fixed image paths`);
