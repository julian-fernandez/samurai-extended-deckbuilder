import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the current card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const xmlPath = path.join(__dirname, "public", "samuraiextendeddb.xml");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Create a backup
fs.writeFileSync(
  path.join(__dirname, "public", "cards_v2_before_final_text_fix.json"),
  JSON.stringify(cards, null, 2)
);
console.log("Created backup before final text fixes");

// Parse XML data
const xmlData = fs.readFileSync(xmlPath, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
});
const xmlCards = parser.parse(xmlData);

console.log("Parsed XML data");

// Function to find XML card by name (handles experienced versions)
function findXmlCardByName(name) {
  if (!xmlCards.cards || !xmlCards.cards.card) return null;

  const xmlCardList = Array.isArray(xmlCards.cards.card)
    ? xmlCards.cards.card
    : [xmlCards.cards.card];

  // First try exact match
  let card = xmlCardList.find(
    (card) => card.name && card.name.toLowerCase() === name.toLowerCase()
  );

  if (card) return card;

  // If it's an experienced card, try to find the base version
  if (name.includes(" - Experienced")) {
    const baseName = name.replace(/\s*-\s*Experienced\s*\d*\s*$/, "");
    card = xmlCardList.find(
      (card) => card.name && card.name.toLowerCase() === baseName.toLowerCase()
    );
    if (card) return card;
  }

  // Try with " - exp" suffix (XML format)
  if (name.includes(" - Experienced")) {
    const expName = name.replace(/\s*-\s*Experienced\s*\d*\s*$/, " - exp");
    card = xmlCardList.find(
      (card) => card.name && card.name.toLowerCase() === expName.toLowerCase()
    );
    if (card) return card;
  }

  return null;
}

// Function to extract the actual card text (not keywords) from XML
function extractCardTextFromXml(xmlCard) {
  if (!xmlCard || !xmlCard.text) return null;

  let text = xmlCard.text;

  // Handle both string and object text formats
  if (typeof text === "object" && text["#text"]) {
    text = text["#text"];
  }

  if (typeof text !== "string") return null;

  // Remove HTML tags but keep the content
  text = text.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Function to extract keywords from XML (the <b> tags)
function extractKeywordsFromXml(xmlCard) {
  if (!xmlCard || !xmlCard.text) return [];

  let text = xmlCard.text;

  // Handle both string and object text formats
  if (typeof text === "object" && text["#text"]) {
    text = text["#text"];
  }

  if (typeof text !== "string") return [];

  // Extract keywords from the text (they're usually in <b> tags)
  const keywordMatches = text.match(/<b>([^<]+)<\/b>/g);
  if (!keywordMatches) return [];

  return keywordMatches.map((match) => {
    // Remove the <b> tags
    return match.replace(/<\/?b>/g, "").trim();
  });
}

// Main processing
console.log("\n=== FIXING CARD TEXT FINAL ===");

let cardsFixed = 0;
let cardsSkipped = 0;
const fixes = [];

for (const card of cards) {
  const cardName = card.title[0];
  console.log(`\n--- Processing: ${cardName} (ID: ${card.cardid}) ---`);

  // Find the corresponding XML card
  const xmlCard = findXmlCardByName(cardName);

  if (!xmlCard) {
    console.log(`❌ No XML card found for "${cardName}"`);
    cardsSkipped++;
    continue;
  }

  console.log(`Found XML card: ${xmlCard.name}`);

  // Extract text and keywords from XML
  const xmlText = extractCardTextFromXml(xmlCard);
  const xmlKeywords = extractKeywordsFromXml(xmlCard);

  if (!xmlText) {
    console.log(`❌ No text found in XML for "${cardName}"`);
    cardsSkipped++;
    continue;
  }

  console.log(`XML text: "${xmlText}"`);
  console.log(`XML keywords: [${xmlKeywords.join(", ")}]`);

  // Check if we need to update the card
  let needsUpdate = false;
  const fix = {
    cardId: card.cardid,
    name: cardName,
    oldText: card.text,
    newText: xmlText,
    oldKeywords: card.keywords,
    newKeywords: xmlKeywords,
  };

  // Update text if different
  if (!card.text || card.text[0] !== xmlText) {
    console.log(
      `📝 Updating text: "${card.text ? card.text[0] : "null"}" -> "${xmlText}"`
    );
    card.text = [xmlText];
    needsUpdate = true;
  }

  // Update keywords if different
  if (
    !card.keywords ||
    JSON.stringify(card.keywords.sort()) !== JSON.stringify(xmlKeywords.sort())
  ) {
    console.log(
      `🏷️  Updating keywords: [${
        card.keywords ? card.keywords.join(", ") : "null"
      }] -> [${xmlKeywords.join(", ")}]`
    );
    card.keywords = xmlKeywords;
    needsUpdate = true;
  }

  if (needsUpdate) {
    fixes.push(fix);
    cardsFixed++;
    console.log(`✅ Updated card`);
  } else {
    console.log(`✅ Card already correct`);
  }
}

// Save the updated cards
console.log(`\n=== SAVING CHANGES ===`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");

console.log(`\n=== SUMMARY ===`);
console.log(`Cards processed: ${cards.length}`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Cards skipped: ${cardsSkipped}`);

console.log(`\n=== DETAILED FIXES ===`);
fixes.forEach((fix) => {
  console.log(`\n${fix.name} (ID: ${fix.cardId}):`);
  console.log(`  Old text: ${fix.oldText ? fix.oldText[0] : "null"}`);
  console.log(`  New text: ${fix.newText}`);
  console.log(
    `  Old keywords: [${fix.oldKeywords ? fix.oldKeywords.join(", ") : "null"}]`
  );
  console.log(`  New keywords: [${fix.newKeywords.join(", ")}]`);
});
