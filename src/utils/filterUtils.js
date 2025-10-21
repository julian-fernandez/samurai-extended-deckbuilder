/**
 * Filter cards by text search
 * @param {Array} cards - Array of card objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered cards
 */
export const filterByText = (cards, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === "") {
    return cards;
  }

  const term = searchTerm.toLowerCase();

  return cards.filter((card) => {
    // Search in name (transformed field)
    if (card.name && card.name.toLowerCase().includes(term)) {
      return true;
    }

    // Search in text (transformed to string)
    if (card.text && card.text.toLowerCase().includes(term)) {
      return true;
    }

    // Search in keywords (already an array)
    if (card.keywords && Array.isArray(card.keywords)) {
      const keywordMatch = card.keywords.some((keyword) =>
        keyword.toLowerCase().includes(term)
      );
      if (keywordMatch) return true;
    }

    return false;
  });
};

/**
 * Filter cards by clan
 * @param {Array} cards - Array of card objects
 * @param {string} clan - Selected clan
 * @returns {Array} Filtered cards
 */
export const filterByClan = (cards, clan) => {
  if (!clan || clan === "all") {
    return cards;
  }

  return cards.filter((card) => {
    // Check if card has clan alignment (transformed to string)
    if (card.clan && card.clan.toLowerCase() === clan.toLowerCase()) {
      return true;
    }

    // Check keywords for clan
    if (card.keywords && Array.isArray(card.keywords)) {
      return card.keywords.some((keyword) =>
        keyword.toLowerCase().includes(clan.toLowerCase())
      );
    }

    return false;
  });
};

/**
 * Filter cards by type
 * @param {Array} cards - Array of card objects
 * @param {string} type - Selected type
 * @returns {Array} Filtered cards
 */
export const filterByType = (cards, type) => {
  if (!type || type === "all") {
    return cards;
  }

  return cards.filter((card) => {
    // Type is transformed to a string, not an array
    if (card.type && card.type.toLowerCase() === type.toLowerCase()) {
      return true;
    }
    return false;
  });
};

/**
 * Filter cards by numerical range
 * @param {Array} cards - Array of card objects
 * @param {string} field - Field to filter by
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array} Filtered cards
 */
export const filterByRange = (cards, field, min, max) => {
  // If no min/max specified, return all cards
  if (
    (min === undefined || min === null || min === "") &&
    (max === undefined || max === null || max === "")
  ) {
    return cards;
  }

  return cards.filter((card) => {
    const value = card[field];

    if (value === undefined || value === null) {
      return false;
    }

    // Values are already strings in transformed cards
    const numValue = parseInt(value);

    if (isNaN(numValue)) {
      return false;
    }

    // Check min constraint
    if (
      min !== undefined &&
      min !== null &&
      min !== "" &&
      numValue < parseInt(min)
    ) {
      return false;
    }

    // Check max constraint
    if (
      max !== undefined &&
      max !== null &&
      max !== "" &&
      numValue > parseInt(max)
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Get unique values for a field
 * @param {Array} cards - Array of card objects
 * @param {string} field - Field to extract values from
 * @returns {Array} Sorted unique values
 */
export const getUniqueValues = (cards, field) => {
  const valueSet = new Set();

  cards.forEach((card) => {
    const value = card[field];

    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => valueSet.add(v));
      } else {
        valueSet.add(value);
      }
    }
  });

  return Array.from(valueSet).sort();
};
