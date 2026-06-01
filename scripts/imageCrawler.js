/**
 * Brute-force image crawler — browser-only utility.
 *
 * This module is NOT part of the React app bundle; it is imported by one-off
 * maintenance scripts (e.g. extract_legal_cards.js) that must be run in a
 * browser context (e.g. via a browser console or a Playwright/Puppeteer
 * script) because it relies on `new Image()` and `localStorage`.
 *
 * The production image-lookup path lives in src/services/imageService.js
 * (findCardImage), which uses the folder map and card.imagePath without
 * doing any network probing.
 */

import {
  imagePathCache,
  saveImagePathToLocalStorage,
} from "../src/services/imageCacheService.js";

// All known image folders, including historical sets not covered by
// the legal-set folder map in imageService.js.
const ALL_FOLDERS = [
  "Emperor Edition",
  "Emperor Edition Demo Decks",
  "Emperor Edition Gempukku",
  "Celestial Edition",
  "Celestial Edition 15th Anniversary",
  "Samurai Edition",
  "Samurai Edition Banzai",
  "Twenty Festivals",
  "Ivory Edition",
  "The Plague War",
  "A Line in the Sand",
  "A Matter of Honor",
  "A Perfect Cut",
  "Aftermath",
  "Ambition-s Debt",
  "An Oni's Fury",
  "Anvil of Despair",
  "Battle of Beiden Pass",
  "Battle of Kyuden Tonbo",
  "Before the Dawn",
  "Broken Blades",
  "Code of Bushido",
  "Coils of Madness",
  "Crab vs. Lion",
  "Crimson and Jade",
  "Dark Allies",
  "Dawn of the Empire",
  "Death at Koten",
  "Diamond Edition",
  "Drums of War",
  "Embers of War",
  "Emerald Edition",
  "Empire at War",
  "Enemy of My Enemy",
  "Evil Portents",
  "Fire & Shadow",
  "Forbidden Knowledge",
  "Forgotten Legacy",
  "Gates of Chaos",
  "Glory of the Empire",
  "Gold Edition",
  "Heaven & Earth",
  "Heroes of Rokugan",
  "Hidden City",
  "Hidden Emperor 1",
  "Hidden Emperor 2",
  "Hidden Emperor 3",
  "Hidden Emperor 4",
  "Hidden Emperor 5",
  "Hidden Emperor 6",
  "Honor and Treachery",
  "Honor Bound",
  "Honor-s Veil",
  "Imperial Edition",
  "Jade Edition",
  "Khan's Defiance",
  "L5R Experience",
  "Lotus Edition",
  "Obsidian Edition",
  "Oracle of the Void",
  "Path of Hope",
  "Path of the Destroyer",
  "Pearl Edition",
  "Pre-Imperial Edition",
  "Promotional-Samurai",
  "Promotional–Celestial",
  "Promotional–Emperor",
  "Promotional–Imperial",
  "Promotional–Jade",
  "Promotional-Celestial",
  "Promotional-CWF",
  "Promotional-Diamond",
  "Promotional-Emperor",
  "Promotional-Gold",
  "Promotional-Imperial",
  "Promotional-Ivory",
  "Promotional-Jade",
  "Promotional-Lotus",
  "Promotional-Samurai",
  "Promotional-Twenty Festivals",
  "Reign of Blood",
  "Rise of the Shogun",
  "Samurai Edition",
  "Samurai Edition Banzai",
  "Scorpion Clan Coup 1",
  "Scorpion Clan Coup 2",
  "Scorpion Clan Coup 3",
  "Second City",
  "Seeds of Decay",
  "Shadowlands",
  "Siege of Sleeping Mountain",
  "Siege: Clan War",
  "Siege: Heart of Darkness",
  "Soul of the Empire",
  "Storms Over Matsu Palace",
  "Stronger Than Steel",
  "Test of Enlightenment",
  "Test of the Emerald and Jade Championships",
  "The Coming Storm",
  "The Currency of War",
  "The Dark Journey Home",
  "The Dead of Winter",
  "The Fall of Otosan Uchi",
  "The Harbinger",
  "The Heaven's Will",
  "The Imperial Gift 1",
  "The Imperial Gift 2",
  "The Imperial Gift 3",
  "The New Order",
  "The Plague War",
  "The Shadow-s Embrace",
  "The Truest Test",
  "The War of Spirits",
  "Thunderous Acclaim",
  "Time of the Void",
  "Tomorrow",
  "Top Deck Booster Pack",
  "Torn Asunder",
  "Training Grounds",
  "Training Grounds 2",
  "War of Honor",
  "Web of Lies",
  "Winds of Change",
  "Words and Deeds",
  "Wrath of the Emperor",
];

function generateAlternativeFilenames(cardName) {
  const alternatives = [cardName];

  alternatives.push(cardName.replace(/&#149;/g, "•"));
  alternatives.push(cardName.replace(/&#8226;/g, "•"));
  alternatives.push(cardName.replace(/•/g, "&#149;"));

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

  suffixes.forEach((suffix) => alternatives.push(cardName + suffix));

  const baseName = cardName.replace(/\s*[-•]\s*(exp|experienced).*$/i, "");
  if (baseName !== cardName) {
    alternatives.push(baseName);
    suffixes.forEach((suffix) => alternatives.push(baseName + suffix));
  }

  return [...new Set(alternatives)];
}

/**
 * Probe every known image folder until a matching image loads, then cache
 * the result. Falls back through all alternative filenames before giving up.
 *
 * BROWSER ONLY — uses `new Image()` and `localStorage`.
 *
 * @param {string} src - Initial image URL to try
 * @param {string} alt - Alt text (unused; kept for API compat)
 * @param {string} [className] - CSS class (unused; kept for API compat)
 * @param {Object|null} [card] - Card object; updated with resolved imagePath
 * @returns {Promise<string>} Resolves with the found image URL
 */
export function createLazyImage(src, alt, className = "", card = null) {
  void alt;
  void className;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      if (card) {
        const titleKey =
          (card.title && card.title[0]) || card.formattedtitle || card.name;
        if (titleKey) {
          imagePathCache.set(titleKey, src);
        }
        card.imagePath = src;
      }
      resolve(src);
    };

    img.onerror = () => {
      const originalCardName = src.split("/").pop();
      const cardName =
        card &&
        ((card.title && card.title[0]) || card.formattedtitle)
          ? (card.title && card.title[0]) || card.formattedtitle
          : originalCardName;

      let alternativeNames;
      if (card && card.originalData) {
        alternativeNames = [];

        if (card.originalData.formattedtitle) {
          alternativeNames.push(card.originalData.formattedtitle);
          const webFriendlyTitle = card.originalData.formattedtitle
            .replace(/&#149;/g, " -")
            .replace(/&#8226;/g, " -")
            .replace(/•/g, " -")
            .replace(/\s+/g, " ");
          alternativeNames.push(webFriendlyTitle);
        }

        if (card.originalData.puretexttitle) {
          alternativeNames.push(card.originalData.puretexttitle);
        }

        alternativeNames.push(cardName);
      } else {
        alternativeNames = generateAlternativeFilenames(cardName);
      }

      let folderIndex = 0;
      let nameIndex = 0;

      const tryNextFolder = () => {
        if (folderIndex >= ALL_FOLDERS.length) {
          nameIndex++;
          if (nameIndex >= alternativeNames.length) {
            reject(
              new Error("Image not found in any folder with any name variation")
            );
            return;
          }
          folderIndex = 0;
        }

        const folder = ALL_FOLDERS[folderIndex];
        const name = alternativeNames[nameIndex];
        const fallbackSrc = `/images/${folder}/${name}.jpg`;
        const fallbackImg = new Image();

        fallbackImg.onload = () => {
          if (card && name) {
            imagePathCache.set(name, fallbackSrc);
            card.imagePath = fallbackSrc;
            saveImagePathToLocalStorage(name, fallbackSrc);
          }
          resolve(fallbackSrc);
        };

        fallbackImg.onerror = () => {
          if (folder.startsWith("Promotional-")) {
            const nestedFolder = folder.replace(
              "Promotional-",
              "Promotional&ndash;"
            );
            const nestedSrc = `/images/${folder}/${nestedFolder}/${name}.jpg`;
            const nestedImg = new Image();

            nestedImg.onload = () => {
              if (card && name) {
                imagePathCache.set(name, nestedSrc);
                card.imagePath = nestedSrc;
                saveImagePathToLocalStorage(name, nestedSrc);
              }
              resolve(nestedSrc);
            };
            nestedImg.onerror = () => {
              folderIndex++;
              tryNextFolder();
            };
            nestedImg.src = nestedSrc;
            return;
          }

          if (folder === "Heaven and Earth") {
            const nestedSrc = `/images/${folder}/Heaven & Earth/${name}.jpg`;
            const nestedImg = new Image();

            nestedImg.onload = () => {
              if (card && name) {
                imagePathCache.set(name, nestedSrc);
                card.imagePath = nestedSrc;
                saveImagePathToLocalStorage(name, nestedSrc);
              }
              resolve(nestedSrc);
            };
            nestedImg.onerror = () => {
              folderIndex++;
              tryNextFolder();
            };
            nestedImg.src = nestedSrc;
            return;
          }

          folderIndex++;
          tryNextFolder();
        };

        fallbackImg.src = fallbackSrc;
      };

      tryNextFolder();
    };

    img.src = src;
  });
}
