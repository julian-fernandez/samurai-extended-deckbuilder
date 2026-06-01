import fs from "fs";
import { L5R_KEYWORDS } from "./src/constants/index.js";

// Load the cards
const cards = JSON.parse(fs.readFileSync("public/cards_v3.json", "utf8"));

console.log("=== FIXING BATTLE MAIDEN KEYWORDS ===");

let updatedCount = 0;

// Find cards that should have "Battle Maiden" keyword
for (const card of cards) {
  const text = card.text?.[0] || "";
  const title = card.title?.[0] || "";

  // Check if the card mentions "Battle Maiden" in text or if it's a Battle Maiden personality
  const hasBattleMaidenInText = text.includes("Battle Maiden");
  const isBattleMaidenPersonality =
    title.includes("Battle Maiden") ||
    (text.includes("Battle Maiden") && card.type?.[0] === "personality");

  if (hasBattleMaidenInText || isBattleMaidenPersonality) {
    // Check if "Battle Maiden" is already in keywords
    const currentKeywords = card.keywords || [];
    if (!currentKeywords.includes("Battle Maiden")) {
      console.log(`Adding "Battle Maiden" to: ${title}`);
      card.keywords = [...currentKeywords, "Battle Maiden"];
      updatedCount++;
    }
  }
}

console.log(`\nUpdated ${updatedCount} cards with "Battle Maiden" keyword`);

// Save the updated cards
fs.writeFileSync(
  "public/cards_v3.json",
  JSON.stringify(cards, null, 2),
  "utf8"
);
fs.writeFileSync("dist/cards_v3.json", JSON.stringify(cards, null, 2), "utf8");

console.log(
  "Saved updated cards to public/cards_v3.json and dist/cards_v3.json"
);

// Show some examples
console.log("\n=== EXAMPLES ===");
const examples = cards
  .filter((card) => card.keywords?.includes("Battle Maiden"))
  .slice(0, 5);

examples.forEach((card) => {
  console.log(`${card.title[0]}: ${JSON.stringify(card.keywords)}`);
});
