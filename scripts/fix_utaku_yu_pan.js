import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Find all Utaku Yu-Pan cards
const utakuYuPanCards = cards.filter(
  (card) =>
    card.title && card.title[0] && card.title[0].includes("Utaku Yu-Pan")
);

console.log(`Found ${utakuYuPanCards.length} Utaku Yu-Pan cards:`);
utakuYuPanCards.forEach((card) => {
  console.log(
    `- ID: ${card.cardid}, Title: "${card.title[0]}", Formatted: "${
      card.formattedtitle
    }", Keywords: ${card.keywords ? card.keywords.join(", ") : "none"}`
  );
});

// Find the base version (without Experienced keyword)
const baseCard = utakuYuPanCards.find(
  (card) => !card.keywords || !card.keywords.includes("Experienced")
);

// Find experienced versions
const experiencedCards = utakuYuPanCards.filter(
  (card) => card.keywords && card.keywords.includes("Experienced")
);

console.log(`\nBase card: ${baseCard ? `ID ${baseCard.cardid}` : "Not found"}`);
console.log(`Experienced cards: ${experiencedCards.length}`);

if (baseCard && experiencedCards.length > 0) {
  console.log("\nFixing experienced cards...");

  experiencedCards.forEach((expCard, index) => {
    console.log(
      `\nProcessing experienced card ${index + 1}: ID ${expCard.cardid}`
    );

    // Fix image path - experienced cards should have different images
    const baseImagePath = baseCard.imagePath;
    if (baseImagePath) {
      const pathParts = baseImagePath.split("/");
      const filename = pathParts[pathParts.length - 1];
      const directory = pathParts.slice(0, -1).join("/");
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      const ext = filename.match(/\.[^/.]+$/)?.[0] || ".jpg";
      const experiencedImagePath = `${directory}/${nameWithoutExt} - Experienced${ext}`;

      if (expCard.imagePath === baseImagePath) {
        console.log(
          `  Fixing image: ${expCard.imagePath} -> ${experiencedImagePath}`
        );
        expCard.imagePath = experiencedImagePath;
      }
    }

    // Fix stats - experienced cards should have higher stats
    if (
      expCard.chi &&
      baseCard.chi &&
      parseInt(expCard.chi[0]) <= parseInt(baseCard.chi[0])
    ) {
      const newChi = (parseInt(baseCard.chi[0]) + 1).toString();
      console.log(`  Fixing chi: ${expCard.chi[0]} -> ${newChi}`);
      expCard.chi[0] = newChi;
    }

    if (
      expCard.force &&
      baseCard.force &&
      parseInt(expCard.force[0]) <= parseInt(baseCard.force[0])
    ) {
      const newForce = (parseInt(baseCard.force[0]) + 1).toString();
      console.log(`  Fixing force: ${expCard.force[0]} -> ${newForce}`);
      expCard.force[0] = newForce;
    }

    if (
      expCard.cost &&
      baseCard.cost &&
      parseInt(expCard.cost[0]) <= parseInt(baseCard.cost[0])
    ) {
      const newCost = (parseInt(baseCard.cost[0]) + 1).toString();
      console.log(`  Fixing cost: ${expCard.cost[0]} -> ${newCost}`);
      expCard.cost[0] = newCost;
    }

    // Fix title to clearly indicate it's experienced
    if (!expCard.title[0].includes("Experienced")) {
      const newTitle = `${expCard.title[0]} - Experienced`;
      console.log(`  Fixing title: "${expCard.title[0]}" -> "${newTitle}"`);
      expCard.title[0] = newTitle;
    }

    // Fix formatted title
    if (!expCard.formattedtitle.includes("Experienced")) {
      const newFormattedTitle = `${expCard.formattedtitle} - Experienced`;
      console.log(
        `  Fixing formatted title: "${expCard.formattedtitle}" -> "${newFormattedTitle}"`
      );
      expCard.formattedtitle = newFormattedTitle;
    }
  });

  // Save the updated cards
  console.log("\nSaving updated cards...");
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log("Cards saved successfully!");

  // Also save to dist folder
  const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
  fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
  console.log("Cards also saved to dist folder!");
} else {
  console.log("\nCould not find base card or experienced cards to fix.");
}
