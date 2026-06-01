import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the card data
const cardsPath = path.join(__dirname, "public", "cards_v2.json");
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

console.log(`Loaded ${cards.length} cards`);

// Function to find base version of a card (non-experienced)
function findBaseCard(experiencedCard) {
  const baseName = experiencedCard.title[0]
    .replace(/\s*-\s*Experienced.*$/, "")
    .trim();

  // Look for a card with the same base name but without "Experienced" keyword
  return cards.find((card) => {
    if (!card.title || !card.title[0]) return false;

    const cardName = card.title[0].trim();
    const isSameName = cardName === baseName;
    const isNotExperienced =
      !card.keywords || !card.keywords.includes("Experienced");
    const isNotExp = !card.puretexttitle || !card.puretexttitle.includes("exp");

    return isSameName && isNotExperienced && isNotExp;
  });
}

// Function to find experienced version of a card
function findExperiencedCard(baseCard) {
  const baseName = baseCard.title[0];

  return cards.find((card) => {
    if (!card.title || !card.title[0]) return false;

    const cardName = card.title[0].trim();
    const isExperienced =
      card.keywords && card.keywords.includes("Experienced");
    const isExp = card.puretexttitle && card.puretexttitle.includes("exp");

    // Check if this is an experienced version of the base card
    return (
      (cardName === baseName || cardName.includes(baseName)) &&
      (isExperienced || isExp)
    );
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

// Function to get the correct text for experienced cards
function getExperiencedText(baseCard, experiencedCard) {
  // For now, we'll use the experienced card's current text
  // In a real scenario, you'd have the correct experienced text
  return experiencedCard.text || baseCard.text;
}

// Function to get the correct stats for experienced cards
function getExperiencedStats(baseCard, experiencedCard) {
  // Experienced cards typically have higher stats
  const stats = {
    chi: experiencedCard.chi
      ? [...experiencedCard.chi]
      : baseCard.chi
      ? [...baseCard.chi]
      : null,
    force: experiencedCard.force
      ? [...experiencedCard.force]
      : baseCard.force
      ? [...baseCard.force]
      : null,
    honor: experiencedCard.honor
      ? [...experiencedCard.honor]
      : baseCard.honor
      ? [...baseCard.honor]
      : null,
    ph: experiencedCard.ph
      ? [...experiencedCard.ph]
      : baseCard.ph
      ? [...baseCard.ph]
      : null,
    cost: experiencedCard.cost
      ? [...experiencedCard.cost]
      : baseCard.cost
      ? [...baseCard.cost]
      : null,
  };

  // Experienced cards typically have higher stats
  if (stats.chi && baseCard.chi) {
    const baseChi = parseInt(baseCard.chi[0]);
    const expChi = parseInt(stats.chi[0]);
    if (expChi <= baseChi) {
      stats.chi[0] = (baseChi + 1).toString();
    }
  }

  if (stats.force && baseCard.force) {
    const baseForce = parseInt(baseCard.force[0]);
    const expForce = parseInt(stats.force[0]);
    if (expForce <= baseForce) {
      stats.force[0] = (baseForce + 1).toString();
    }
  }

  if (stats.cost && baseCard.cost) {
    const baseCost = parseInt(baseCard.cost[0]);
    const expCost = parseInt(stats.cost[0]);
    if (expCost <= baseCost) {
      stats.cost[0] = (baseCost + 1).toString();
    }
  }

  return stats;
}

// Function to get the correct keywords for experienced cards
function getExperiencedKeywords(baseCard, experiencedCard) {
  const keywords = baseCard.keywords ? [...baseCard.keywords] : [];

  // Ensure "Experienced" keyword is present
  if (!keywords.includes("Experienced")) {
    keywords.push("Experienced");
  }

  return keywords;
}

// Main processing
let issuesFound = [];
let cardsFixed = 0;

console.log("Analyzing experienced cards...");

// Find all experienced cards
const experiencedCards = cards.filter(
  (card) => card.keywords && card.keywords.includes("Experienced")
);

console.log(`Found ${experiencedCards.length} experienced cards`);

for (const experiencedCard of experiencedCards) {
  console.log(
    `\nProcessing: ${experiencedCard.title[0]} (ID: ${experiencedCard.cardid})`
  );

  // Find the base version
  const baseCard = findBaseCard(experiencedCard);

  if (!baseCard) {
    console.log(`  ⚠️  No base card found for ${experiencedCard.title[0]}`);
    issuesFound.push({
      type: "missing_base",
      card: experiencedCard.title[0],
      cardid: experiencedCard.cardid,
    });
    continue;
  }

  console.log(
    `  Base card found: ${baseCard.title[0]} (ID: ${baseCard.cardid})`
  );

  // Check for issues
  const issues = [];

  // Check image
  const expectedImagePath = getExperiencedImagePath(baseCard, experiencedCard);
  if (expectedImagePath && experiencedCard.imagePath !== expectedImagePath) {
    issues.push({
      type: "wrong_image",
      current: experiencedCard.imagePath,
      expected: expectedImagePath,
    });
  }

  // Check if using base card's image
  if (experiencedCard.imagePath === baseCard.imagePath) {
    issues.push({
      type: "using_base_image",
      current: experiencedCard.imagePath,
      expected: expectedImagePath,
    });
  }

  // Check stats
  const expectedStats = getExperiencedStats(baseCard, experiencedCard);
  if (
    expectedStats.chi &&
    experiencedCard.chi &&
    baseCard.chi &&
    parseInt(experiencedCard.chi[0]) <= parseInt(baseCard.chi[0])
  ) {
    issues.push({
      type: "low_chi",
      current: experiencedCard.chi[0],
      base: baseCard.chi[0],
    });
  }

  if (
    expectedStats.force &&
    experiencedCard.force &&
    baseCard.force &&
    parseInt(experiencedCard.force[0]) <= parseInt(baseCard.force[0])
  ) {
    issues.push({
      type: "low_force",
      current: experiencedCard.force[0],
      base: baseCard.force[0],
    });
  }

  if (
    expectedStats.cost &&
    experiencedCard.cost &&
    baseCard.cost &&
    parseInt(experiencedCard.cost[0]) <= parseInt(baseCard.cost[0])
  ) {
    issues.push({
      type: "low_cost",
      current: experiencedCard.cost[0],
      base: baseCard.cost[0],
    });
  }

  if (issues.length > 0) {
    console.log(`  Issues found:`);
    issues.forEach((issue) => {
      console.log(`    - ${issue.type}: ${JSON.stringify(issue)}`);
    });

    // Fix the issues
    if (expectedImagePath && experiencedCard.imagePath !== expectedImagePath) {
      console.log(
        `  Fixing image: ${experiencedCard.imagePath} -> ${expectedImagePath}`
      );
      experiencedCard.imagePath = expectedImagePath;
    }

    // Fix stats
    if (
      expectedStats.chi &&
      experiencedCard.chi &&
      baseCard.chi &&
      parseInt(experiencedCard.chi[0]) <= parseInt(baseCard.chi[0])
    ) {
      const newChi = (parseInt(baseCard.chi[0]) + 1).toString();
      console.log(`  Fixing chi: ${experiencedCard.chi[0]} -> ${newChi}`);
      experiencedCard.chi[0] = newChi;
    }

    if (
      expectedStats.force &&
      experiencedCard.force &&
      baseCard.force &&
      parseInt(experiencedCard.force[0]) <= parseInt(baseCard.force[0])
    ) {
      const newForce = (parseInt(baseCard.force[0]) + 1).toString();
      console.log(`  Fixing force: ${experiencedCard.force[0]} -> ${newForce}`);
      experiencedCard.force[0] = newForce;
    }

    if (
      expectedStats.cost &&
      experiencedCard.cost &&
      baseCard.cost &&
      parseInt(experiencedCard.cost[0]) <= parseInt(baseCard.cost[0])
    ) {
      const newCost = (parseInt(baseCard.cost[0]) + 1).toString();
      console.log(`  Fixing cost: ${experiencedCard.cost[0]} -> ${newCost}`);
      experiencedCard.cost[0] = newCost;
    }

    cardsFixed++;
  } else {
    console.log(`  ✅ No issues found`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Cards processed: ${experiencedCards.length}`);
console.log(`Cards fixed: ${cardsFixed}`);
console.log(`Issues found: ${issuesFound.length}`);

if (issuesFound.length > 0) {
  console.log("\nIssues that need manual attention:");
  issuesFound.forEach((issue) => {
    console.log(`- ${issue.type}: ${issue.card} (ID: ${issue.cardid})`);
  });
}

// Save the updated cards
console.log("\nSaving updated cards...");
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log("Cards saved successfully!");

// Also save to dist folder
const distCardsPath = path.join(__dirname, "dist", "cards_v2.json");
fs.writeFileSync(distCardsPath, JSON.stringify(cards, null, 2));
console.log("Cards also saved to dist folder!");
