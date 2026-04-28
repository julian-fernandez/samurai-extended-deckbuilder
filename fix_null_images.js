/**
 * fix_null_images.js
 *
 * For every card with a null imagePath, sets it to the latest printing
 * for which a local image file exists.
 *
 * Run: node fix_null_images.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = path.join(__dirname, "public", "cards_v3.json");
const IMAGES_ROOT = path.join(__dirname, "public", "images");

// Set code → folder name (corrected mapping inferred from existing card data)
const SET_FOLDER = {
  pre:             "Pre-Imperial Edition",
  Imperial:        "Imperial Edition",
  Emerald:         "Emerald Edition",
  Obsidian:        "Obsidian Edition",
  SL:              "Shadowlands",
  AoD:             "Anvil of Despair",
  FL:              "Forgotten Legacy",
  TotV:            "Time of the Void",
  BoBP:            "Battle of Beiden Pass",
  HE1:             "Hidden Emperor 1",
  HE2:             "Hidden Emperor 2",
  HE3:             "Hidden Emperor 3",
  HE4:             "Hidden Emperor 4",
  HE5:             "Hidden Emperor 5",
  HE6:             "Hidden Emperor 6",
  DJH:             "The Dark Journey Home",
  SCW:             "Siege: Clan War",
  Jade:            "Jade Edition",
  HV:              "Honor-s Veil",
  AD:              "Ambition-s Debt",
  Pearl:           "Pearl Edition",
  CJ:              "Crimson and Jade",
  Gold:            "Gold Edition",
  APC:             "A Perfect Cut",
  AOF:             "An Oni-s Fury",
  DA:              "Dark Allies",
  BB:              "Broken Blades",
  FOU:             "The Fall of Otosan Uchi",
  HaE:             "Heaven and Earth",
  WoC:             "Winds of Change",
  DoW:             "Drums of War",
  Diamond:         "Diamond Edition",
  SoD:             "Seeds of Decay",
  WoL:             "Web of Lies",
  ThAw:            "The Awakening",
  WoE:             "The War of Spirits",
  KYD:             "1,000 Years of Darkness",
  HC:              "Hidden City",
  RoB:             "Reign of Blood",
  RotS:            "Rise of the Shogun",
  Lotus:           "Lotus Edition",
  TTT:             "The Truest Test",
  STS:             "Stronger Than Steel",
  PotD:            "Path of the Destroyer",
  PoH:             "Path of Hope",
  FK:              "Forbidden Knowledge",
  CoB:             "Code of Bushido",
  TG:              "Training Grounds",
  TG2:             "Training Grounds 2",
  Samurai:         "Samurai Edition",
  SW:              "Samurai Edition Banzai",
  HB:              "Honor Bound",
  WaD:             "Words and Deeds",
  THW:             "The Heaven-s Will",
  GotE:            "Glory of the Empire",
  DaK:             "Death at Koten",
  IG1:             "The Imperial Gift 1",
  KD:              "Khan-s Defiance",
  Tomorrow:        "Tomorrow",
  FaS:             "Fire and Shadow",
  Celestial:       "Celestial Edition",
  CE15:            "Celestial Edition 15th Anniversary",
  IG2:             "The Imperial Gift 2",
  TH:              "The Harbinger",
  TPW:             "The Plague War",
  IG3:             "The Imperial Gift 3",
  SOMP:            "Storms Over Matsu Palace",
  EaW:             "Empire at War",
  TDoW:            "The Dead of Winter",
  SotE:            "Soul of the Empire",
  CoM:             "Coils of Madness",
  BtD:             "Before the Dawn",
  WoH:             "War of Honor",
  SC:              "Second City",
  Emperor:         "Emperor Edition",
  EoW:             "Embers of War",
  TSE:             "The Shadow-s Embrace",
  HaT:             "Honor and Treachery",
  EEGempukku:      "Emperor Edition Gempukku",
  GoC:             "Gates of Chaos",
  AM:              "Aftermath",
  AMoH:            "A Matter of Honor",
  Ivory:           "Ivory Edition",
  TCS:             "The Coming Storm",
  ALitS:           "A Line in the Sand",
  TNO:             "The New Order",
  TCW:             "The Currency of War",
  TwentyFestivals: "Twenty Festivals",
  TA:              "Torn Asunder",
  ThA:             "Thunderous Acclaim",
  EP:              "Evil Portents",
};

// Chronological order: oldest → newest (higher index = more recent = preferred)
const SET_ORDER = [
  "pre",
  "Imperial", "Emerald", "Obsidian",
  "SL", "AoD", "FL", "TotV",
  "SCW", "BoBP", "HE1", "HE2", "HE3", "HE4", "HE5", "HE6", "DJH",
  "Jade", "HV", "AD", "Pearl", "CJ",
  "Gold", "APC", "AOF", "DA", "BB", "FOU", "HaE", "WoC", "DoW",
  "Diamond", "SoD", "WoL", "ThAw", "WoE", "KYD", "HC", "RoB", "RotS",
  "Lotus", "TTT", "STS", "PotD", "PoH", "FK", "CoB",
  "TG", "TG2", "Samurai", "SW", "HB", "WaD", "THW", "GotE", "DaK", "IG1", "KD", "Tomorrow",
  "FaS", "SotE",
  "Celestial", "CE15", "CE15MRP", "IG2", "TH", "TPW", "IG3", "SOMP", "EaW", "TDoW", "CoM", "BtD",
  "WoH", "SC", "Emperor", "EoW", "TSE", "HaT", "EEGempukku", "GoC", "AM", "AMoH",
  "Ivory", "TCS", "ALitS", "TNO", "TCW", "TwentyFestivals", "TA", "ThA", "EP",
];

const SET_PRIORITY = Object.fromEntries(SET_ORDER.map((code, i) => [code, i]));

const PROMO_FOLDERS = [
  "Promotional-Ivory",
  "Promotional-Twenty Festivals",
  "Promotional-Emperor",
  "Promotional-Celestial",
  "Promotional-Samurai",
  "Promotional-Lotus",
  "Promotional-Diamond",
  "Promotional-Gold",
  "Promotional-Jade",
  "Promotional-Imperial",
];

function imageExists(folder, filename) {
  return fs.existsSync(path.join(IMAGES_ROOT, folder, filename + ".jpg"));
}

function findImagePath(card) {
  const filename = card.puretexttitle;
  if (!filename) return null;

  const sets = (card.set || []).filter((s) => SET_PRIORITY[s] !== undefined);
  const sorted = [...sets].sort((a, b) => SET_PRIORITY[b] - SET_PRIORITY[a]);

  for (const setCode of sorted) {
    const folder = SET_FOLDER[setCode];
    if (!folder) continue;
    if (!fs.existsSync(path.join(IMAGES_ROOT, folder))) continue;
    if (imageExists(folder, filename)) {
      return `/images/${folder}/${filename}.jpg`;
    }
  }

  // Fallback: try promo folders if card has Promo set
  if (card.set && card.set.includes("Promo")) {
    for (const folder of PROMO_FOLDERS) {
      if (fs.existsSync(path.join(IMAGES_ROOT, folder)) && imageExists(folder, filename)) {
        return `/images/${folder}/${filename}.jpg`;
      }
    }
  }

  return null;
}

const cards = JSON.parse(fs.readFileSync(CARDS_PATH, "utf8"));

let updated = 0;
let stillNull = 0;

for (const card of cards) {
  if (card.imagePath) continue;
  if (!card.puretexttitle) continue;

  const found = findImagePath(card);
  if (found) {
    card.imagePath = found;
    updated++;
  } else {
    stillNull++;
  }
}

fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2));
console.log(`Done. Fixed: ${updated} | Still no image: ${stillNull}`);
