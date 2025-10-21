/**
 * Service for finding and loading card images
 */

// Cache for image paths to avoid repeated searches
const imagePathCache = new Map();

// Initialize cache from localStorage on startup
function initializeImageCache() {
  try {
    const cachedPaths = localStorage.getItem("l5r_image_paths");
    if (cachedPaths) {
      const imagePaths = JSON.parse(cachedPaths);
      Object.entries(imagePaths).forEach(([cardName, imagePath]) => {
        imagePathCache.set(cardName, imagePath);
      });
      console.log(
        `Initialized image cache with ${
          Object.keys(imagePaths).length
        } paths from localStorage`
      );
    }
  } catch (error) {
    console.warn("Failed to initialize image cache from localStorage:", error);
  }
}

// Initialize cache on module load
initializeImageCache();

// Clear cache to force fresh image lookups
export function clearImageCache() {
  imagePathCache.clear();
  localStorage.removeItem("l5r_image_paths");
  console.log("Image cache cleared");
}

export function clearAllCaches() {
  // Clear image cache
  clearImageCache();

  // Clear service worker caches
  if ("caches" in window) {
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Clearing cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log("All caches cleared");
        // Force reload to get fresh data
        window.location.reload();
      });
  } else {
    // Fallback: just reload
    window.location.reload();
  }
}

/**
 * Save a single image path to localStorage
 * @param {string} cardName - The card name
 * @param {string} imagePath - The image path
 */
function saveImagePathToLocalStorage(cardName, imagePath) {
  try {
    // Get existing image paths
    const existingPaths = localStorage.getItem("l5r_image_paths");
    const imagePaths = existingPaths ? JSON.parse(existingPaths) : {};

    // Add the new path
    imagePaths[cardName] = imagePath;

    // Save back to localStorage
    localStorage.setItem("l5r_image_paths", JSON.stringify(imagePaths));
  } catch (error) {
    console.warn("Failed to save image path to localStorage:", error);
  }
}

/**
 * Generate alternative filenames for cards with special characters
 * @param {string} cardName - The original card name
 * @returns {Array<string>} - Array of possible filenames
 */
function generateAlternativeFilenames(cardName) {
  const alternatives = [cardName]; // Start with original name

  // Handle HTML entities - convert both ways
  alternatives.push(cardName.replace(/&#149;/g, "•"));
  alternatives.push(cardName.replace(/&#8226;/g, "•"));
  alternatives.push(cardName.replace(/•/g, "&#149;"));

  // Handle common suffixes and variations (only experience-related)
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

  // Add variations with suffixes
  suffixes.forEach((suffix) => {
    alternatives.push(cardName + suffix);
  });

  // Handle cards that might have the suffix already in the name
  const baseName = cardName.replace(/\s*[-•]\s*(exp|experienced).*$/i, "");
  if (baseName !== cardName) {
    alternatives.push(baseName);
    suffixes.forEach((suffix) => {
      alternatives.push(baseName + suffix);
    });
  }

  return [...new Set(alternatives)]; // Remove duplicates
}

// Map our internal set names to folder names
const SET_FOLDER_MAP = {
  emperor: [
    "Emperor Edition",
    "Emperor Edition Demo Decks",
    "Emperor Edition Gempukku",
    "Promotional-Emperor",
    "Promotional–Emperor",
  ],
  celestial: [
    "Celestial Edition",
    "Celestial Edition 15th Anniversary",
    "Promotional-Celestial",
    "Promotional–Celestial",
  ],
  samurai: ["Samurai Edition", "Samurai Edition Banzai", "Promotional-Samurai"],
  "20F": ["Twenty Festivals", "Promotional-Twenty Festivals"],
  ivory: ["Ivory Edition", "Promotional-Ivory"],
};

/**
 * Find the best image path for a card
 * @param {Object} card - The card object
 * @returns {string|null} - The image path or null if not found
 */
export function findCardImage(card) {
  if (!card) return null;

  // Get card name from title, formattedtitle, or name
  const cardName =
    (card.title && card.title[0]) || card.formattedtitle || card.name;
  if (!cardName) {
    console.log("No card name found for card:", card);
    return null;
  }

  // Check cache first
  const cacheKey = cardName;
  if (imagePathCache.has(cacheKey)) {
    const cachedPath = imagePathCache.get(cacheKey);
    return cachedPath;
  }

  // Check if card already has cached image path
  if (card.imagePath) {
    console.log(`Using cached imagePath for ${cardName}: ${card.imagePath}`);
    imagePathCache.set(cacheKey, card.imagePath);
    // Add cache-busting parameter to force reload
    const cacheBuster = `?t=${Date.now()}`;
    return card.imagePath + cacheBuster;
  }

  // Get the sets this card is legal in
  const legalSets = card.legal || [];

  // Use card data if available, otherwise generate alternatives
  let alternativeNames;
  if (card.originalData) {
    alternativeNames = [];

    // Try formattedtitle first (exact match for filenames)
    if (card.originalData.formattedtitle) {
      alternativeNames.push(card.originalData.formattedtitle);
      // Also try converting HTML entities to dashes for web-friendly filenames
      const webFriendlyTitle = card.originalData.formattedtitle
        .replace(/&#149;/g, " -")
        .replace(/&#8226;/g, " -")
        .replace(/•/g, " -")
        .replace(/\s+/g, " "); // Remove extra spaces
      alternativeNames.push(webFriendlyTitle);
    }

    // Try puretexttitle (simpler format)
    if (card.originalData.puretexttitle) {
      alternativeNames.push(card.originalData.puretexttitle);
    }

    // Add original card name
    alternativeNames.push(cardName);
  } else {
    alternativeNames = generateAlternativeFilenames(cardName);
  }

  // Try each legal set in order of preference
  for (const set of legalSets) {
    const folders = SET_FOLDER_MAP[set.toLowerCase()];
    if (!folders) continue;

    for (const folder of folders) {
      const imagePath = `/images/${folder}/${alternativeNames[0]}.jpg`;
      // Don't cache the path yet - let createLazyImage verify it exists
      return imagePath;
    }
  }

  // Fallback: try all folders that contain any of our set names
  const allFolders = Object.values(SET_FOLDER_MAP).flat();
  for (const folder of allFolders) {
    const imagePath = `/images/${folder}/${alternativeNames[0]}.jpg`;
    return imagePath;
  }

  // Cache null result to avoid repeated failed searches
  imagePathCache.set(cacheKey, null);
  return null;
}

/**
 * Create a lazy loading image component
 * @param {string} src - Image source path
 * @param {string} alt - Alt text
 * @param {Object} className - CSS classes
 * @returns {Promise<string>} - Resolves with the image path if found
 */
export function createLazyImage(src, alt, className = "", card = null) {
  // className parameter is for future use with image styling
  void className;
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Cache the successful image path
      if (card && card.name) {
        imagePathCache.set(card.name, src);
        // Update the card object with the found image path
        card.imagePath = src;
      }
      resolve(src);
    };
    img.onerror = () => {
      // Get all available folders from the images directory
      const allFolders = [
        "Emperor Edition",
        "Emperor Edition Demo Decks",
        "Emperor Edition Gempukku",
        "Celestial Edition",
        "Celestial Edition 15th Anniversary",
        "Samurai Edition",
        "Samurai Edition Banzai",
        "Twenty Festivals",
        "Ivory Edition",
        // Additional folders that might contain cards
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

      const originalCardName = src.split("/").pop();
      // Use card name from card object if available, otherwise use the src
      const cardName =
        card &&
        (card.title && card.title[0] ? card.title[0] : card.formattedtitle)
          ? card.title && card.title[0]
            ? card.title[0]
            : card.formattedtitle
          : originalCardName;

      // If we have the card object, use the exact formattedtitle first
      let alternativeNames;
      if (card && card.originalData) {
        alternativeNames = [];

        // Try formattedtitle first (exact match for filenames)
        if (card.originalData.formattedtitle) {
          alternativeNames.push(card.originalData.formattedtitle);
          // Also try converting HTML entities to dashes for web-friendly filenames
          const webFriendlyTitle = card.originalData.formattedtitle
            .replace(/&#149;/g, " -")
            .replace(/&#8226;/g, " -")
            .replace(/•/g, " -")
            .replace(/\s+/g, " "); // Remove extra spaces
          alternativeNames.push(webFriendlyTitle);
        }

        // Try puretexttitle (simpler format)
        if (card.originalData.puretexttitle) {
          alternativeNames.push(card.originalData.puretexttitle);
        }

        // Add original card name
        alternativeNames.push(cardName);

        console.log(`Using card data with alternatives:`, alternativeNames);
      } else {
        alternativeNames = generateAlternativeFilenames(cardName);
        console.log(
          `Searching for "${cardName}" with alternatives:`,
          alternativeNames
        );
      }
      let currentIndex = 0;
      let nameIndex = 0;

      const tryNextFolder = () => {
        if (currentIndex >= allFolders.length) {
          // Try next alternative name
          nameIndex++;
          if (nameIndex >= alternativeNames.length) {
            reject(
              new Error("Image not found in any folder with any name variation")
            );
            return;
          }
          currentIndex = 0; // Reset folder index for new name
        }

        const folder = allFolders[currentIndex];
        const cardName = alternativeNames[nameIndex];

        // Try the main folder first
        let fallbackSrc = `/images/${folder}/${cardName}.jpg`;
        const fallbackImg = new Image();

        fallbackImg.onload = () => {
          console.log(`Found image: ${fallbackSrc}`);
          // Cache the successful image path
          if (card && cardName) {
            imagePathCache.set(cardName, fallbackSrc);
            // Update the card object with the found image path
            card.imagePath = fallbackSrc;
            // Save to localStorage for persistence
            saveImagePathToLocalStorage(cardName, fallbackSrc);
          }
          resolve(fallbackSrc);
        };
        fallbackImg.onerror = () => {
          console.log(`Failed to load: ${fallbackSrc}`);

          // If this is a promotional folder, try the nested HTML entity folder
          if (
            folder.startsWith("Promotional-") &&
            fallbackSrc.includes(folder)
          ) {
            const nestedFolder = folder.replace(
              "Promotional-",
              "Promotional&ndash;"
            );
            const nestedSrc = `/images/${folder}/${nestedFolder}/${cardName}.jpg`;
            console.log(`Trying nested folder: ${nestedSrc}`);

            const nestedImg = new Image();
            nestedImg.onload = () => {
              console.log(`Found image in nested folder: ${nestedSrc}`);
              if (card && cardName) {
                imagePathCache.set(cardName, nestedSrc);
                card.imagePath = nestedSrc;
                saveImagePathToLocalStorage(cardName, nestedSrc);
              }
              resolve(nestedSrc);
            };
            nestedImg.onerror = () => {
              console.log(`Failed to load nested: ${nestedSrc}`);
              currentIndex++;
              tryNextFolder();
            };
            nestedImg.src = nestedSrc;
            return;
          }

          // If this is "Heaven and Earth", try the nested "Heaven & Earth" folder
          if (folder === "Heaven and Earth" && fallbackSrc.includes(folder)) {
            const nestedSrc = `/images/${folder}/Heaven & Earth/${cardName}.jpg`;
            console.log(`Trying nested Heaven & Earth folder: ${nestedSrc}`);

            const nestedImg = new Image();
            nestedImg.onload = () => {
              console.log(
                `Found image in nested Heaven & Earth folder: ${nestedSrc}`
              );
              if (card && cardName) {
                imagePathCache.set(cardName, nestedSrc);
                card.imagePath = nestedSrc;
                saveImagePathToLocalStorage(cardName, nestedSrc);
              }
              resolve(nestedSrc);
            };
            nestedImg.onerror = () => {
              console.log(`Failed to load nested Heaven & Earth: ${nestedSrc}`);
              currentIndex++;
              tryNextFolder();
            };
            nestedImg.src = nestedSrc;
            return;
          }

          currentIndex++;
          tryNextFolder();
        };

        fallbackImg.src = fallbackSrc;
      };

      tryNextFolder();
    };

    img.src = src;
  });
}

/**
 * Get all available image folders for our sets
 * @returns {Array<string>} - Array of folder names
 */
export function getAvailableImageFolders() {
  return Object.values(SET_FOLDER_MAP).flat();
}

/**
 * Save the updated cards with cached image paths to localStorage
 * @param {Array} cards - Array of card objects
 */
export function saveCardsWithImagePaths(cards) {
  try {
    // Only save cards that have image paths to reduce storage size
    const cardsWithImages = cards.filter((card) => card.imagePath);
    if (cardsWithImages.length > 0) {
      localStorage.setItem(
        "l5r_cards_with_images",
        JSON.stringify(cardsWithImages)
      );
      console.log(
        `Saved ${cardsWithImages.length} cards with image paths to localStorage`
      );
    }
  } catch (error) {
    console.warn("Failed to save cards to localStorage:", error);
    // If still too large, try saving just the image paths as a separate object
    try {
      const imagePaths = {};
      cards.forEach((card) => {
        if (card.imagePath) {
          imagePaths[card.name] = card.imagePath;
        }
      });
      localStorage.setItem("l5r_image_paths", JSON.stringify(imagePaths));
      console.log(
        `Saved ${Object.keys(imagePaths).length} image paths to localStorage`
      );
    } catch (fallbackError) {
      console.warn(
        "Failed to save even image paths to localStorage:",
        fallbackError
      );
    }
  }
}

/**
 * Load cards with cached image paths from localStorage
 * @returns {Array|null} - Array of card objects or null if not found
 */
export function loadCardsWithImagePaths() {
  try {
    const cached = localStorage.getItem("l5r_cards_with_images");
    if (cached) {
      const cards = JSON.parse(cached);
      console.log(
        `Loaded ${cards.length} cards with image paths from localStorage`
      );
      return cards;
    }
  } catch (error) {
    console.warn("Failed to load cards from localStorage:", error);
  }
  return null;
}

/**
 * Load just the image paths from localStorage
 * @returns {Object|null} - Object mapping card names to image paths
 */
export function loadImagePaths() {
  try {
    const cached = localStorage.getItem("l5r_image_paths");
    if (cached) {
      const imagePaths = JSON.parse(cached);
      console.log(
        `Loaded ${Object.keys(imagePaths).length} image paths from localStorage`
      );
      return imagePaths;
    }
  } catch (error) {
    console.warn("Failed to load image paths from localStorage:", error);
  }
  return null;
}

/**
 * Clear the image path cache
 */
export function clearImagePathCache() {
  imagePathCache.clear();
}

/**
 * Export the updated cards JSON with image paths
 * This can be used to update the original JSON file
 */
export function exportCardsWithImagePaths() {
  try {
    const cached = localStorage.getItem("l5r_cards_with_images");
    if (cached) {
      const cards = JSON.parse(cached);
      const blob = new Blob([JSON.stringify(cards, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cards_with_images.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("Cards with image paths exported");
    } else {
      console.warn("No cached cards found");
    }
  } catch (error) {
    console.error("Failed to export cards:", error);
  }
}
