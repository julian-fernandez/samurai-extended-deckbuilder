import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function carefulLegalFiltering() {
  console.log(
    "🔧 Careful legal filtering - only removing cards with NO legal legalities..."
  );

  // Load the cards JSON
  const cardsPath = path.join(__dirname, "public", "cards_v2.json");
  const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

  let removedCount = 0;
  const removedCards = [];

  // Define ALL the legal legalities for Samurai Extended format
  const legalLegalities = [
    "Samurai&nbsp;Edition",
    "Stronger&nbsp;than&nbsp;Steel",
    "The&nbsp;Hidden&nbsp;Emperor",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Jade)",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Samurai)",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Celestial)",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Emperor)",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Ivory)",
    "The&nbsp;Hidden&nbsp;Emperor&nbsp;(Twenty&nbsp;Festivals)",
    "Race&nbsp;for&nbsp;the&nbsp;Throne",
    "Race&nbsp;for&nbsp;the&nbsp;Throne&nbsp;(Samurai)",
    "Race&nbsp;for&nbsp;the&nbsp;Throne&nbsp;(Celestial)",
    "Race&nbsp;for&nbsp;the&nbsp;Throne&nbsp;(Emperor)",
    "Race&nbsp;for&nbsp;the&nbsp;Throne&nbsp;(Ivory)",
    "Race&nbsp;for&nbsp;the&nbsp;Throne&nbsp;(Twenty&nbsp;Festivals)",
    "The&nbsp;Destroyer&nbsp;War",
    "The&nbsp;Destroyer&nbsp;War&nbsp;(Celestial)",
    "The&nbsp;Destroyer&nbsp;War&nbsp;(Samurai)",
    "The&nbsp;Destroyer&nbsp;War&nbsp;(Emperor)",
    "The&nbsp;Destroyer&nbsp;War&nbsp;(Ivory)",
    "The&nbsp;Destroyer&nbsp;War&nbsp;(Twenty&nbsp;Festivals)",
    "The&nbsp;Four&nbsp;Winds",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Gold)",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Samurai)",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Celestial)",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Emperor)",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Ivory)",
    "The&nbsp;Four&nbsp;Winds&nbsp;(Twenty&nbsp;Festivals)",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest&nbsp;(Emperor)",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest&nbsp;(Celestial)",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest&nbsp;(Samurai)",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest&nbsp;(Ivory)",
    "The&nbsp;Age&nbsp;of&nbsp;Conquest&nbsp;(Twenty&nbsp;Festivals)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Lotus)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Celestial)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Emperor)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Samurai)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Ivory)",
    "The&nbsp;Age&nbsp;of&nbsp;Enlightenment&nbsp;(Twenty&nbsp;Festivals)",
    "Clan&nbsp;Wars",
    "Clan&nbsp;Wars&nbsp;(Imperial)",
    "Clan&nbsp;Wars&nbsp;(Samurai)",
    "Clan&nbsp;Wars&nbsp;(Celestial)",
    "Clan&nbsp;Wars&nbsp;(Emperor)",
    "Clan&nbsp;Wars&nbsp;(Ivory)",
    "Clan&nbsp;Wars&nbsp;(Twenty&nbsp;Festivals)",
    "Torn&nbsp;Asunder",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Twenty&nbsp;Festivals)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Samurai)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Celestial)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Emperor)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Ivory)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Gold)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Jade)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Lotus)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Diamond)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Imperial)",
    "A&nbsp;Brother's&nbsp;Destiny&nbsp;(Modern)",
  ];

  // Test with a few specific cards first
  const testCards = [
    "Sacrifice of Pawns",
    "Bayushi Fuyuko",
    "Bayushi Kaukatsu",
  ];

  console.log("Testing specific cards:");
  for (const testCard of testCards) {
    const card = cards.find(
      (c) =>
        c.formattedtitle === testCard ||
        c.title?.[0] === testCard ||
        c.name === testCard
    );

    if (card) {
      const hasLegalLegality =
        card.legality &&
        card.legality.some((legality) => legalLegalities.includes(legality));
      console.log(
        `  ${testCard}: ${hasLegalLegality ? "KEEP" : "REMOVE"} (${
          card.legality?.join(", ") || "no legalities"
        })`
      );
    } else {
      console.log(`  ${testCard}: NOT FOUND`);
    }
  }

  // Filter cards to only include those with at least one legal legality
  const filteredCards = cards.filter((card) => {
    // Check if card has any legal legality
    const hasLegalLegality =
      card.legality &&
      card.legality.some((legality) => legalLegalities.includes(legality));

    if (!hasLegalLegality) {
      removedCards.push(card.title?.[0] || card.formattedtitle || card.name);
      removedCount++;
      return false; // Remove this card
    }

    return true; // Keep this card
  });

  // Save the filtered cards
  if (removedCount > 0) {
    fs.writeFileSync(cardsPath, JSON.stringify(filteredCards, null, 2));
    console.log(
      `💾 Removed ${removedCount} cards not legal in Samurai Extended format`
    );
    console.log("Removed cards (first 20):");
    removedCards.slice(0, 20).forEach((card) => console.log(`  - ${card}`));
    if (removedCards.length > 20) {
      console.log(`  ... and ${removedCards.length - 20} more`);
    }
  } else {
    console.log("ℹ️ No cards needed filtering");
  }
}

carefulLegalFiltering();
