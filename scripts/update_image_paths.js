import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Legal sets for Samurai Extended format
const LEGAL_SETS = [
  "samurai edition",
  "stronger than steel",
  "test of the emerald and jade championships",
  "honor's veil",
  "words and deeds",
  "samurai edition banzai",
  "the heaven's will",
  "glory of the empire",
  "the imperial gift 1",
  "death at koten",
  "celestial edition",
  "the imperial gift 2",
  "path of the destroyer",
  "the harbinger",
  "celestial edition 15",
  "the plague war",
  "the imperial gift 3",
  "battle of kyuden tonbo",
  "empire at war",
  "the dead of winter",
  "before the dawn",
  "forgotten legacy",
  "second city",
  "emperor edition",
  "embers of war",
  "the shadow's embrace",
  "seeds of decay",
  "honor and treachery",
  "emperor edition: gempukku",
  "torn asunder",
  "coils of madness",
  "gates of chaos",
  "aftermath",
  "a matter of honor",
  "ivory edition",
  "the coming storm",
  "a line in the sand",
  "the new order",
  "the currency of war",
  "twenty festivals",
  "thunderous acclaim",
  "evil portents",
];

// Map set names to folder names
const SET_FOLDER_MAP = {
  "samurai edition": ["Samurai Edition", "Samurai Edition Banzai"],
  "emperor edition": ["Emperor Edition", "Emperor Edition Gempukku"],
  "celestial edition": [
    "Celestial Edition",
    "Celestial Edition 15th Anniversary",
  ],
  "ivory edition": ["Ivory Edition"],
  "twenty festivals": ["Twenty Festivals"],
  "the shadow's embrace": ["The Shadow-s Embrace"],
  "the plague war": ["The Plague War"],
  "empire at war": ["Empire at War"],
  "battle of kyuden tonbo": ["Battle of Kyuden Tonbo"],
  "the dead of winter": ["The Dead of Winter"],
  "before the dawn": ["Before the Dawn"],
  "forgotten legacy": ["Forgotten Legacy"],
  "second city": ["Second City"],
  "embers of war": ["Embers of War"],
  "seeds of decay": ["Seeds of Decay"],
  "honor and treachery": ["Honor and Treachery"],
  "coils of madness": ["Coils of Madness"],
  "gates of chaos": ["Gates of Chaos"],
  aftermath: ["Aftermath"],
  "a matter of honor": ["A Matter of Honor"],
  "the coming storm": ["The Coming Storm"],
  "a line in the sand": ["A Line in the Sand"],
  "the new order": ["The New Order"],
  "the currency of war": ["The Currency of War"],
  "thunderous acclaim": ["Thunderous Acclaim"],
  "evil portents": ["Evil Portents"],
  "stronger than steel": ["Stronger Than Steel"],
  "test of the emerald and jade championships": [
    "Test of the Emerald and Jade Championships",
  ],
  "honor's veil": ["Honor-s Veil"],
  "words and deeds": ["Words and Deeds"],
  "the heaven's will": ["The Heaven's Will"],
  "glory of the empire": ["Glory of the Empire"],
  "the imperial gift 1": ["The Imperial Gift 1"],
  "death at koten": ["Death at Koten"],
  "the imperial gift 2": ["The Imperial Gift 2"],
  "path of the destroyer": ["Path of the Destroyer"],
  "the harbinger": ["The Harbinger"],
  "the imperial gift 3": ["The Imperial Gift 3"],
  "torn asunder": ["Torn Asunder"],
};

function generateAlternativeFilenames(cardName) {
  const alternatives = [cardName];

  // Handle HTML entities
  alternatives.push(cardName.replace(/&#149;/g, "•"));
  alternatives.push(cardName.replace(/&#8226;/g, "•"));
  alternatives.push(cardName.replace(/•/g, "&#149;"));

  // Handle experience suffixes
  const suffixes = [
    " - exp",
    " - exp 2",
    " - Experienced",
    " - Experienced 2",
    " &#149; Experienced",
    " &#149; Experienced 2",
    " • Experienced",
    " • Experienced 2",
  ];

  suffixes.forEach((suffix) => {
    alternatives.push(cardName + suffix);
  });

  // Handle base names without experience
  const baseName = cardName.replace(/\s*[-•]\s*(exp|experienced).*$/i, "");
  if (baseName !== cardName) {
    alternatives.push(baseName);
    suffixes.forEach((suffix) => {
      alternatives.push(baseName + suffix);
    });
  }

  return [...new Set(alternatives)];
}

function findCardImage(card, allFolders) {
  const cardName = card.title?.[0] || card.formattedtitle || card.name;
  if (!cardName) return null;

  const alternativeNames = generateAlternativeFilenames(cardName);

  // Since all cards are now legal, search ALL folders for every card
  for (const folder of allFolders) {
    for (const altName of alternativeNames) {
      // Try main folder first
      const imagePath = path.join(
        __dirname,
        "public",
        "images",
        folder,
        altName + ".jpg"
      );
      if (fs.existsSync(imagePath)) {
        return `/images/${folder}/${altName}.jpg`;
      }

      // Try nested promotional folders
      if (folder.startsWith("Promotional-")) {
        const nestedFolder = folder.replace(
          "Promotional-",
          "Promotional&ndash;"
        );
        const nestedPath = path.join(
          __dirname,
          "public",
          "images",
          folder,
          nestedFolder,
          altName + ".jpg"
        );
        if (fs.existsSync(nestedPath)) {
          return `/images/${folder}/${nestedFolder}/${altName}.jpg`;
        }
      }

      // Try nested "Heaven & Earth" folder
      if (folder === "Heaven and Earth") {
        const nestedPath = path.join(
          __dirname,
          "public",
          "images",
          folder,
          "Heaven & Earth",
          altName + ".jpg"
        );
        if (fs.existsSync(nestedPath)) {
          return `/images/${folder}/Heaven & Earth/${altName}.jpg`;
        }
      }
    }
  }

  return null;
}

function main() {
  console.log("🚀 Starting L5R Card Image Path Update");
  console.log("⏰ Started at:", new Date().toLocaleString());
  console.log("==================================");

  // Check if we're in the right directory
  if (!fs.existsSync("public/cards.json")) {
    console.log(
      "❌ Error: cards.json not found. Please run this from the l5r-card-search directory."
    );
    process.exit(1);
  }

  if (!fs.existsSync("public/images")) {
    console.log(
      "❌ Error: images directory not found. Please ensure images are in public/images/"
    );
    process.exit(1);
  }

  // Create backup
  if (fs.existsSync("public/cards.json")) {
    fs.copyFileSync("public/cards.json", "public/cards_backup.json");
    console.log("📋 Created backup: public/cards_backup.json");
  }

  // Load cards
  console.log("📖 Loading cards from public/cards.json...");
  const cards = JSON.parse(fs.readFileSync("public/cards.json", "utf8"));
  console.log(`📊 Found ${cards.length} cards to process`);

  // Get all image folders
  const imagesDir = path.join(__dirname, "public", "images");
  const allFolders = fs
    .readdirSync(imagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`📁 Found ${allFolders.length} image folders`);

  // Process cards
  let foundCount = 0;
  let notFoundCount = 0;
  const startTime = Date.now();

  const updatedCards = cards.map((card, index) => {
    if (index % 100 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = index / elapsed;
      const remaining = (cards.length - index) / rate;
      console.log(
        `🔄 Processed ${index}/${cards.length} cards (${Math.round(
          rate
        )}/sec, ETA: ${Math.round(remaining)}s)`
      );
    }

    const imagePath = findCardImage(card, allFolders);
    if (imagePath) {
      foundCount++;
      return { ...card, imagePath };
    } else {
      notFoundCount++;
      return card;
    }
  });

  // Save updated cards
  console.log("💾 Saving updated cards to public/cards_with_images.json...");
  fs.writeFileSync(
    "public/cards_with_images.json",
    JSON.stringify(updatedCards, null, 2)
  );

  const elapsed = (Date.now() - startTime) / 1000;
  console.log("");
  console.log("✅ Image path update completed successfully!");
  console.log("⏰ Finished at:", new Date().toLocaleString());
  console.log(`⏱️  Total time: ${Math.round(elapsed)}s`);
  console.log(
    `📊 Found images: ${foundCount}/${cards.length} (${Math.round(
      (foundCount / cards.length) * 100
    )}%)`
  );
  console.log(`❌ Not found: ${notFoundCount}`);
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Review the updated file: public/cards_with_images.json");
  console.log(
    "2. If satisfied, replace original: cp public/cards_with_images.json public/cards.json"
  );
  console.log(
    "3. If issues found, restore backup: cp public/cards_backup.json public/cards.json"
  );
  console.log("");
  console.log("📊 File sizes:");
  console.log(
    `Original: ${Math.round(
      fs.statSync("public/cards.json").size / 1024 / 1024
    )}MB`
  );
  console.log(
    `Updated:  ${Math.round(
      fs.statSync("public/cards_with_images.json").size / 1024 / 1024
    )}MB`
  );
  console.log(
    `Backup:   ${Math.round(
      fs.statSync("public/cards_backup.json").size / 1024 / 1024
    )}MB`
  );
}

main();
