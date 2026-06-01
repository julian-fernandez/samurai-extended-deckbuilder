import fs from "fs";

// Load the cards
const cards = JSON.parse(fs.readFileSync("public/cards_v3.json", "utf8"));

console.log("=== FIXING BATTLE MAIDEN KEYWORDS - PERSONALITIES ONLY ===");

let updatedCount = 0;

// Remove "Battle Maiden" keyword from non-personality cards
for (const card of cards) {
  const cardType = card.type?.[0];
  const currentKeywords = card.keywords || [];

  // Only personalities can be Battle Maidens
  if (cardType !== "personality" && currentKeywords.includes("Battle Maiden")) {
    console.log(`Removing "Battle Maiden" from ${card.title[0]} (${cardType})`);
    card.keywords = currentKeywords.filter(
      (keyword) => keyword !== "Battle Maiden"
    );
    updatedCount++;
  }
}

console.log(
  `\nRemoved "Battle Maiden" from ${updatedCount} non-personality cards`
);

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

// Show some examples of Battle Maiden personalities
console.log("\n=== BATTLE MAIDEN PERSONALITIES ===");
const battleMaidenPersonalities = cards
  .filter(
    (card) =>
      card.type?.[0] === "personality" &&
      card.keywords?.includes("Battle Maiden")
  )
  .slice(0, 10);

battleMaidenPersonalities.forEach((card) => {
  console.log(`${card.title[0]}: ${JSON.stringify(card.keywords)}`);
});
