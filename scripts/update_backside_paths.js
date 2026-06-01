import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listBacksideFiles(imagesRoot) {
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/ Backside\.jpg$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  walk(imagesRoot);
  return results;
}

function main() {
  const cardsPath = path.join(__dirname, "public", "cards.json");
  if (!fs.existsSync(cardsPath)) {
    console.error("cards.json not found at", cardsPath);
    process.exit(1);
  }
  const imagesRoot = path.join(__dirname, "public", "images");
  if (!fs.existsSync(imagesRoot)) {
    console.error("images directory not found at", imagesRoot);
    process.exit(1);
  }

  const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
  const backsideFiles = listBacksideFiles(imagesRoot);

  // Build map from front image relative path (folder/Name.jpg) to backside URL
  const relPrefix = path.join("public", "images") + path.sep;
  const frontToBackMap = new Map();
  for (const filePath of backsideFiles) {
    const relFromImages = filePath.split(relPrefix)[1];
    if (!relFromImages) continue;
    const parts = relFromImages.split(path.sep);
    const folder = parts[0];
    const fileName = parts.slice(1).join("/"); // keep inner slashes if any
    const frontName = fileName.replace(/ Backside\.jpg$/i, ".jpg");
    const key = `${folder}/${frontName}`; // e.g., "Twenty Festivals/The Esteemed Palace of the Crane.jpg"
    const url = `/images/${folder}/${fileName}`.replace(/\\/g, "/");
    frontToBackMap.set(key.toLowerCase(), url);
  }

  let updated = 0;
  let skipped = 0;

  for (const card of cards) {
    if (!card || !(card.type && card.type.includes("Stronghold"))) {
      continue;
    }
    const front = card.imagePath;
    if (!front || !front.toLowerCase().startsWith("/images/")) {
      skipped++;
      continue;
    }
    // front format: /images/<folder>/<file>.jpg
    const parts = front.split("/").filter(Boolean); // ["images", folder, ...]
    if (parts.length < 3) {
      skipped++;
      continue;
    }
    const folder = parts[1];
    const fileName = parts.slice(2).join("/");
    const key = `${folder}/${fileName}`.toLowerCase();
    const back = frontToBackMap.get(key);
    if (back) {
      if (card.hasBackside !== true) card.hasBackside = true;
      card.backsideImagePath = back;
      updated++;
    } else {
      skipped++;
    }
  }

  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log(
    `Updated backsideImagePath for ${updated} strongholds. Skipped ${skipped}. Found ${backsideFiles.length} backside files.`
  );
}

main();
