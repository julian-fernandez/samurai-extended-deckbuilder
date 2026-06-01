import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

/**
 * Serialize a deck array (full card objects with quantity) into minimal JSONB
 * format: [{ cardId, quantity }]
 */
function serializeDeck(deck) {
  return deck.map(({ id, quantity }) => ({ cardId: id, quantity }));
}

/**
 * Extract the clan string from a deck by reading the Stronghold card's clan.
 * Returns null if no stronghold is present or has no clan.
 */
function extractClanFromDeck(deck) {
  const stronghold = deck.find((c) => {
    const t = Array.isArray(c.type) ? c.type[0] : c.type;
    return t?.toLowerCase() === "stronghold";
  });
  if (!stronghold) return null;
  const clan = stronghold.clan;
  return (Array.isArray(clan) ? clan[0] : clan) ?? null;
}

/**
 * Reconstruct full deck from minimal JSONB using the cards lookup.
 * cards is the full cards array from useCards().
 */
export function deserializeDeck(serialized, cards) {
  if (!serialized || !cards) return [];
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]));
  return serialized
    .map(({ cardId, quantity }) => {
      const card = cardMap[cardId];
      if (!card) return null;
      return { ...card, quantity };
    })
    .filter(Boolean);
}

export function useSavedDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listDecks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("decks")
      .select("id, name, description, is_public, share_token, clan, created_at, updated_at, cards")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setDecks(data ?? []);
    }
    setLoading(false);
  }, [user]);

  const saveDeck = useCallback(
    async ({ name, description = "", isPublic = false, deck }) => {
      if (!user) return { error: "Not signed in" };
      const { data, error } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic,
          clan: extractClanFromDeck(deck),
          cards: serializeDeck(deck),
        })
        .select()
        .single();

      if (!error) {
        setDecks((prev) => [data, ...prev]);
      }
      return { data, error: error?.message };
    },
    [user]
  );

  const updateDeck = useCallback(
    async ({ id, name, description, isPublic, deck }) => {
      if (!user) return { error: "Not signed in" };
      const patch = {};
      if (name !== undefined) patch.name = name;
      if (description !== undefined) patch.description = description;
      if (isPublic !== undefined) patch.is_public = isPublic;
      if (deck !== undefined) {
        patch.cards = serializeDeck(deck);
        patch.clan = extractClanFromDeck(deck);
      }
      patch.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("decks")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error) {
        setDecks((prev) => prev.map((d) => (d.id === id ? data : d)));
      }
      return { data, error: error?.message };
    },
    [user]
  );

  const deleteDeck = useCallback(
    async (id) => {
      if (!user) return { error: "Not signed in" };
      const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        setDecks((prev) => prev.filter((d) => d.id !== id));
      }
      return { error: error?.message };
    },
    [user]
  );

  const togglePublic = useCallback(
    async (id, currentValue) => {
      return updateDeck({ id, isPublic: !currentValue });
    },
    [updateDeck]
  );

  const getDeckByToken = useCallback(async (token) => {
    const { data, error } = await supabase
      .from("decks")
      .select("id, name, description, cards, created_at")
      .eq("share_token", token)
      .eq("is_public", true)
      .single();

    return { data, error: error?.message };
  }, []);

  const getDeckById = useCallback(async (id) => {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error: error?.message };
  }, []);

  /**
   * Fetch all public decks, optionally filtered by clan.
   * Returns { data, error } directly (not managed state).
   */
  const listPublicDecks = useCallback(async ({ clan } = {}) => {
    let query = supabase
      .from("decks")
      .select("id, name, description, clan, share_token, created_at, cards")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (clan) query = query.eq("clan", clan);

    const { data, error } = await query;
    return { data: data ?? [], error: error?.message };
  }, []);

  return {
    decks,
    loading,
    error,
    listDecks,
    saveDeck,
    updateDeck,
    deleteDeck,
    togglePublic,
    getDeckByToken,
    getDeckById,
    listPublicDecks,
  };
}
