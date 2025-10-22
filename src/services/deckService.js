import { CARD_TYPES, DECK_RULES } from "../constants/index.js";

/**
 * Add a card to the deck
 * @param {Array} deck - Current deck array
 * @param {Object} card - Card object to add
 * @returns {Array} Updated deck array
 */
export const addToDeck = (deck, card) => {
  const existingCard = deck.find((d) => d.id === card.id);

  if (existingCard) {
    // Check if card has Unique keyword
    const isUnique = card.keywords && card.keywords.includes("Unique");

    if (isUnique) {
      return deck; // Don't add more copies of unique cards
    }

    if (existingCard.quantity < DECK_RULES.MAX_COPIES) {
      return deck.map((d) =>
        d.id === card.id ? { ...d, quantity: d.quantity + 1 } : d
      );
    }

    return deck; // Max copies reached
  }

  return [...deck, { ...card, quantity: 1 }];
};

/**
 * Remove a card from the deck
 * @param {Array} deck - Current deck array
 * @param {string} cardId - Card ID to remove
 * @returns {Array} Updated deck array
 */
export const removeFromDeck = (deck, cardId) => {
  const existingCard = deck.find((d) => d.id === cardId);

  if (!existingCard) {
    return deck;
  }

  if (existingCard.quantity > 1) {
    return deck.map((d) =>
      d.id === cardId ? { ...d, quantity: d.quantity - 1 } : d
    );
  }

  return deck.filter((d) => d.id !== cardId);
};

/**
 * Get the quantity of a specific card in the deck
 * @param {Array} deck - Current deck array
 * @param {string} cardId - Card ID to check
 * @returns {number} Quantity of the card in the deck
 */
export const getDeckCount = (deck, cardId) => {
  const card = deck.find((d) => d.id === cardId);
  return card ? card.quantity : 0;
};

/**
 * Get total number of cards in the deck
 * @param {Array} deck - Current deck array
 * @returns {number} Total card count
 */
export const getDeckTotal = (deck) => {
  return deck.reduce((total, card) => total + card.quantity, 0);
};

/**
 * Get total number of Dynasty cards in the deck
 * @param {Array} deck - Current deck array
 * @returns {number} Dynasty card count
 */
export const getDynastyCount = (deck) => {
  return deck
    .filter((card) => {
      const cardType = Array.isArray(card.type) ? card.type[0] : card.type;
      return (
        cardType &&
        typeof cardType === "string" &&
        CARD_TYPES.DYNASTY.includes(cardType.toLowerCase())
      );
    })
    .reduce((total, card) => total + card.quantity, 0);
};

/**
 * Get total number of Fate cards in the deck
 * @param {Array} deck - Current deck array
 * @returns {number} Fate card count
 */
export const getFateCount = (deck) => {
  return deck
    .filter((card) => {
      const cardType = Array.isArray(card.type) ? card.type[0] : card.type;
      return (
        cardType &&
        typeof cardType === "string" &&
        CARD_TYPES.FATE.includes(cardType.toLowerCase())
      );
    })
    .reduce((total, card) => total + card.quantity, 0);
};

/**
 * Get the number of unique cards in the deck
 * @param {Array} deck - Current deck array
 * @returns {number} Number of unique cards
 */
export const getUniqueCount = (deck) => {
  return deck.length;
};

/**
 * Validate deck against Samurai Extended format rules
 * @param {Array} deck - Current deck array
 * @returns {Object} Validation results with errors, warnings, and counts
 */
export const getDeckValidation = (deck) => {
  const dynastyCount = getDynastyCount(deck);
  const fateCount = getFateCount(deck);
  const uniqueCount = getUniqueCount(deck);

  const strongholds = deck.filter((card) => {
    const cardType = Array.isArray(card.type) ? card.type[0] : card.type;
    return (
      cardType &&
      typeof cardType === "string" &&
      cardType.toLowerCase() === "stronghold"
    );
  });
  const senseis = deck.filter((card) => {
    const cardType = Array.isArray(card.type) ? card.type[0] : card.type;
    return (
      cardType &&
      typeof cardType === "string" &&
      cardType.toLowerCase() === "sensei"
    );
  });

  const errors = [];
  const warnings = [];

  // Check minimum card counts
  if (dynastyCount < DECK_RULES.MIN_DYNASTY) {
    errors.push(
      `Dynasty deck needs at least ${DECK_RULES.MIN_DYNASTY} cards (currently ${dynastyCount})`
    );
  }

  if (fateCount < DECK_RULES.MIN_FATE) {
    errors.push(
      `Fate deck needs at least ${DECK_RULES.MIN_FATE} cards (currently ${fateCount})`
    );
  }

  // Check stronghold count
  if (strongholds.length === 0) {
    errors.push("Deck must contain exactly 1 Stronghold");
  } else if (strongholds.length > 1) {
    errors.push("Deck can only contain 1 Stronghold");
  }

  // Check sensei count
  if (senseis.length > 1) {
    errors.push("Deck can only contain 1 Sensei");
  }

  // Check for too many copies
  deck.forEach((card) => {
    if (
      card.quantity > DECK_RULES.MAX_COPIES &&
      !card.keywords?.includes("Unique")
    ) {
      errors.push(
        `${card.name} has too many copies (${card.quantity}/${DECK_RULES.MAX_COPIES})`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dynastyCount,
    fateCount,
    uniqueCount,
    strongholdCount: strongholds.length,
    senseiCount: senseis.length,
  };
};

/**
 * Get deck organized by type for display
 * @param {Array} deck - Current deck array
 * @returns {Object} Deck organized by sections (Stronghold, Dynasty, Fate)
 */
export const getDeckByType = (deck) => {
  // First group cards by name to combine quantities
  const groupedDeck = groupCardsByName(deck);

  const sections = {
    Stronghold: [],
    Sensei: [],
    Dynasty: {
      Personalities: [],
      Holdings: [],
      Celestials: [],
      Regions: [],
      Events: [],
    },
    Fate: {
      Strategies: [],
      Spells: [],
      Items: [],
      Followers: [],
      Rings: [],
    },
  };

  groupedDeck.forEach((card) => {
    const cardType = Array.isArray(card.type) ? card.type[0] : card.type;
    const type =
      cardType && typeof cardType === "string" ? cardType.toLowerCase() : "";

    if (type === "stronghold") {
      sections.Stronghold.push(card);
    } else if (type === "sensei") {
      sections.Sensei.push(card);
    } else if (CARD_TYPES.DYNASTY.includes(type)) {
      if (type === "personality") {
        sections.Dynasty.Personalities.push(card);
      } else if (type === "holding") {
        sections.Dynasty.Holdings.push(card);
      } else if (type === "celestial") {
        sections.Dynasty.Celestials.push(card);
      } else if (type === "region") {
        sections.Dynasty.Regions.push(card);
      } else if (type === "event") {
        sections.Dynasty.Events.push(card);
      }
    } else if (CARD_TYPES.FATE.includes(type)) {
      if (type === "strategy") {
        sections.Fate.Strategies.push(card);
      } else if (type === "spell") {
        sections.Fate.Spells.push(card);
      } else if (type === "item") {
        sections.Fate.Items.push(card);
      } else if (type === "follower") {
        sections.Fate.Followers.push(card);
      } else if (type === "ring") {
        sections.Fate.Rings.push(card);
      }
    }
  });

  return sections;
};

/**
 * Export deck to text format for sharing/importing
 * @param {Array} deck - Current deck array
 * @returns {string} Deck in text format with sections and quantities
 */
export const exportDeck = (deck) => {
  const sections = getDeckByType(deck);
  let deckText = "";

  // Stronghold
  if (sections.Stronghold.length > 0) {
    deckText += "# Stronghold\n";
    sections.Stronghold.forEach((card) => {
      deckText += `${card.quantity} ${card.name}\n`;
    });
    deckText += "\n";
  }

  // Sensei
  if (sections.Sensei.length > 0) {
    deckText += "# Sensei\n";
    sections.Sensei.forEach((card) => {
      deckText += `${card.quantity} ${card.name}\n`;
    });
    deckText += "\n";
  }

  // Dynasty
  deckText += "# Dynasty\n";
  Object.entries(sections.Dynasty).forEach(([type, cards]) => {
    if (cards.length > 0) {
      deckText += `# ${type} (${cards.reduce(
        (sum, card) => sum + card.quantity,
        0
      )})\n`;
      cards.forEach((card) => {
        deckText += `${card.quantity} ${card.name}\n`;
      });
    }
  });

  // Fate
  deckText += "\n# Fate\n";
  Object.entries(sections.Fate).forEach(([type, cards]) => {
    if (cards.length > 0) {
      deckText += `# ${type} (${cards.reduce(
        (sum, card) => sum + card.quantity,
        0
      )})\n`;
      cards.forEach((card) => {
        deckText += `${card.quantity} ${card.name}\n`;
      });
    }
  });

  return deckText;
};

/**
 * Check if a card is banned in the current format
 * @param {Object} card - Card object to check
 * @returns {boolean} True if the card is banned
 */
export const isCardBanned = (card) => {
  return card.banned === true;
};

/**
 * Import deck from text format
 * @param {string} deckText - Deck in text format (e.g., "3 Shosuro Kameyoi")
 * @param {Array} allCards - All available cards from the card database
 * @returns {Object} Object containing deck, missingCards, and bannedCards
 */
export const importDeck = (deckText, allCards) => {
  const lines = deckText.split("\n");
  const deck = [];
  const missingCards = [];
  const bannedCards = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    // Parse quantity and card name
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();

      // Find card by exact name match
      const card = allCards.find((c) => {
        // Check both the transformed name field and original data fields
        const nameMatch = c.name === cardName;
        const formattedMatch = c.formattedtitle === cardName;
        const titleMatch = c.title?.[0] === cardName;
        const originalTitleMatch = c.originalData?.title?.[0] === cardName;
        const originalFormattedMatch =
          c.originalData?.formattedtitle === cardName;

        return (
          nameMatch ||
          formattedMatch ||
          titleMatch ||
          originalTitleMatch ||
          originalFormattedMatch
        );
      });

      if (card) {
        // Check if card is banned
        if (isCardBanned(card)) {
          bannedCards.push({
            name: cardName,
            quantity,
            reason:
              card.bannedReason ||
              "This card is banned in Samurai Extended format",
          });
        }

        // Check if this card is already in the deck
        const existingCard = deck.find((d) => d.id === card.id);
        if (existingCard) {
          existingCard.quantity += quantity;
        } else {
          deck.push({ ...card, quantity });
        }
      } else {
        // Track missing cards with quantity
        missingCards.push({ name: cardName, quantity });
      }
    }
  });

  return { deck, missingCards, bannedCards };
};

/**
 * Group cards by name and combine quantities
 * @param {Array} deck - Array of card objects
 * @returns {Array} Grouped cards with combined quantities
 */
export const groupCardsByName = (deck) => {
  const grouped = {};

  deck.forEach((card) => {
    if (grouped[card.name]) {
      grouped[card.name].quantity += card.quantity;
    } else {
      grouped[card.name] = { ...card };
    }
  });

  return Object.values(grouped);
};

/**
 * Clear the deck (remove all cards)
 * @returns {Array} Empty deck array
 */
export const clearDeck = () => {
  return [];
};
