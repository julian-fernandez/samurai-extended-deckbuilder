import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the original cards.json as the source of truth
const originalCardsPath = path.join(__dirname, "public", "cards.json");
const cardsPath = path.join(__dirname, "public", "cards_v2.json");

const originalCards = JSON.parse(fs.readFileSync(originalCardsPath, "utf8"));
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(
  `Loaded ${originalCards.length} original cards and ${cards.length} current cards`
);

// Function to find base card for an experienced card
function findBaseCard(experiencedCard) {
  const baseName = experiencedCard.title[0];

  // Look for a card with the same name but without "Experienced" keyword
  return originalCards.find((card) => {
    if (!card.title || !card.title[0]) return false;

    const cardName = card.title[0].trim();
    const isSameName = cardName === baseName;
    const isNotExperienced =
      !card.keywords || !card.keywords.includes("Experienced");
    const isNotExp = !card.puretexttitle || !card.puretexttitle.includes("exp");

    return isSameName && isNotExperienced && isNotExp;
  });
}

// Function to get the correct image path for experienced cards
function getExperiencedImagePath(baseCard, experiencedCard) {
  const baseImagePath = baseCard.imagePath;
  if (!baseImagePath) return null;

  // Extract the directory and filename
  const pathParts = baseImagePath.split("/");
  const filename = pathParts[pathParts.length - 1];
  const directory = pathParts.slice(0, -1).join("/");

  // Create experienced image path
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const ext = filename.match(/\.[^/.]+$/)?.[0] || ".jpg";
  const experiencedFilename = `${nameWithoutExt} - Experienced${ext}`;

  return `${directory}/${experiencedFilename}`;
}

// Main processing
let cardsFixed = 0;
let cardsSkipped = 0;

console.log("Analyzing experienced cards...");

// Find all experienced cards in current data
const experiencedCards = cards.filter(
  (card) => card.keywords && card.keywords.includes("Experienced")
);

console.log(`Found ${experiencedCards.length} experienced cards`);

for (const experiencedCard of experiencedCards) {
  console.log(
    `\nProcessing: ${experiencedCard.title[0]} (ID: ${experiencedCard.cardid})`
  );

  // Find the base version from original data
  const baseCard = findBaseCard(experiencedCard);

  if (!baseCard) {
    console.log(`  ⚠️  No base card found for ${experiencedCard.title[0]}`);
    cardsSkipped++;
    continue;
  }

  console.log(
    `  Base card found: ${baseCard.title[0]} (ID: ${baseCard.cardid})`
  );

  // Check for issues
  const issues = [];

  // Check if using base card's image
  if (experiencedCard.imagePath === baseCard.imagePath) {
    issues.push({
      type: "using_base_image",
      current: experiencedCard.imagePath,
      expected: "needs experienced image",
    });
  }

  if (issues.length > 0) {
    console.log(`  Issues found:`);
    issues.forEach((issue) => {
      console.log(`    - ${issue.type}: ${JSON.stringify(issue)}`);
    });

    // Only fix image path if we can determine the correct one
    const expectedImagePath = getExperiencedImagePath(
      baseCard,
      experiencedCard
    );
    if (expectedImagePath && experiencedCard.imagePath === baseCard.imagePath) {
      console.log(
        `  ⚠️  Would fix image: ${experiencedCard.imagePath} -> ${expectedImagePath}`
      );
      console.log(
        `  ℹ️  Skipping image fix - need to verify correct experienced image exists`
      );
    }

    cardsFixed++;
  } else {
    console.log(`  ✅ No issues found`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Cards processed: ${experiencedCards.length}`);
console.log(`Cards with issues: ${cardsFixed}`);
console.log(`Cards skipped: ${cardsSkipped}`);

console.log("\n=== RECOMMENDATIONS ===");
console.log(
  "1. Verify that experienced images exist in the correct directories"
);
console.log(
  "2. Update image paths only after confirming the images are available"
);
console.log(
  "3. Stats should be different (not necessarily higher) for experienced cards"
);
console.log(
  "4. Experienced cards should have 'Experienced' in keywords but same name in title"
);
