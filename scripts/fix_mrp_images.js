/**
 * fix_mrp_images.js
 *
 * Updates imagePath in cards_v3.json so every card uses its Most Recent Printing.
 * For each card, iterates the release order from newest → oldest and uses the
 * first set for which an image file exists on disk.
 *
 * Run: node fix_mrp_images.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = path.join(__dirname, "public", "cards_v3.json");
const IMAGES_ROOT = path.join(__dirname, "public", "images");

// ─── Set code → image folder name ────────────────────────────────────────────
// Apostrophes become hyphens in folder names on disk.
const SET_FOLDER = {
  // Pre-Imperial
  pre:           "Pre-Imperial Edition",

  // Imperial block
  Imperial:      "Imperial Edition",
  Emerald:       "Emerald Edition",
  Obsidian:      "Obsidian Edition",
  SL:            "Shadowlands",
  AoD:           "Anvil of Despair",
  FL:            "Forgotten Legacy",
  TotV:          "Time of the Void",
  BoBP:          "Battle of Beiden Pass",
  HE1:           "Hidden Emperor 1",
  HE2:           "Hidden Emperor 2",
  HE3:           "Hidden Emperor 3",
  HE4:           "Hidden Emperor 4",
  HE5:           "Hidden Emperor 5",
  HE6:           "Hidden Emperor 6",
  DJH:           "The Dark Journey Home",

  // Jade block
  Jade:          "Jade Edition",
  HV:            "Honor-s Veil",
  AD:            "Ambition-s Debt",
  Pearl:         "Pearl Edition",
  CJ:            "Crimson and Jade",

  // Gold block
  Gold:          "Gold Edition",
  APC:           "A Perfect Cut",
  AOF:           "An Oni-s Fury",
  DA:            "Dark Allies",
  BB:            "Broken Blades",
  FOU:           "The Fall of Otosan Uchi",
  HaE:           "Heaven and Earth",
  WoC:           "Winds of Change",
  DoW:           "Drums of War",

  // Diamond block
  Diamond:       "Diamond Edition",
  SoD:           "Seeds of Decay",
  WoL:           "Web of Lies",
  ThA:           "The Awakening",
  WoE:           "The War of Spirits",
  KYD:           "1,000 Years of Darkness",
  HC:            "Hidden City",
  RoB:           "Reign of Blood",
  RotS:          "Rise of the Shogun",

  // Lotus block
  Lotus:         "Lotus Edition",
  TTT:           "The Truest Test",
  STS:           "Stronger Than Steel",
  PotD:          "Path of the Destroyer",
  PoH:           "Path of Hope",
  FK:            "Forbidden Knowledge",
  CoB:           "Code of Bushido",

  // Samurai block
  TG:            "Training Grounds",
  TG2:           "Training Grounds 2",
  Samurai:       "Samurai Edition",
  SW:            "Samurai Edition Banzai",
  WaD:           "Words and Deeds",
  THW:           "The Heaven-s Will",
  GotE:          "Glory of the Empire",
  DaK:           "Death at Koten",
  IG1:           "The Imperial Gift 1",
  KD:            "Khan-s Defiance",
  Tomorrow:      "Tomorrow",

  // Celestial block
  Celestial:     "Celestial Edition",
  CE15:          "Celestial Edition 15th Anniversary",
  IG2:           "The Imperial Gift 2",
  TH:            "The Harbinger",
  TPW:           "The Plague War",
  IG3:           "The Imperial Gift 3",
  SOMP:          "Storms Over Matsu Palace",
  EaW:           "Empire at War",
  TDoW:          "The Dead of Winter",
  BtD:           "Before the Dawn",

  // Emperor block
  SC:            "Second City",
  Emperor:       "Emperor Edition",
  EoW:           "Embers of War",
  TSE:           "The Shadow-s Embrace",
  HaT:           "Honor and Treachery",
  EEGempukku:    "Emperor Edition Gempukku",
  GoC:           "Gates of Chaos",
  AM:            "Aftermath",
  AMoH:          "A Matter of Honor",

  // Ivory block
  Ivory:         "Ivory Edition",
  TCS:           "The Coming Storm",
  ALitS:         "A Line in the Sand",
  TNO:           "The New Order",
  TCW:           "The Currency of War",
  TwentyFestivals: "Twenty Festivals",
  TA:            "Thunderous Acclaim",
  EP:            "Evil Portents",
};

// ─── Release order: oldest → newest ──────────────────────────────────────────
// Index = priority; higher index = more recent = preferred.
const SET_ORDER = [
  "pre",
  "Imperial", "Emerald", "Obsidian",
  "SL", "AoD", "FL", "TotV",
  "BoBP", "HE1", "HE2", "HE3", "HE4", "HE5", "HE6", "DJH",
  "Jade", "HV", "AD", "Pearl", "CJ",
  "Gold", "APC", "AOF", "DA", "BB", "FOU", "HaE", "WoC", "DoW",
  "Diamond", "SoD", "WoL", "ThA", "WoE", "KYD", "HC", "RoB", "RotS",
  "Lotus", "TTT", "STS", "PotD", "PoH", "FK", "CoB",
  "TG", "TG2", "Samurai", "SW", "WaD", "THW", "GotE", "DaK", "IG1", "KD", "Tomorrow",
  "Celestial", "CE15", "IG2", "TH", "TPW", "IG3", "SOMP", "EaW", "TDoW", "BtD",
  "SC", "Emperor", "EoW", "TSE", "HaT", "EEGempukku", "GoC", "AM", "AMoH",
  "Ivory", "TCS", "ALitS", "TNO", "TCW", "TwentyFestivals", "TA", "EP",
];

const SET_PRIORITY = Object.fromEntries(SET_ORDER.map((code, i) => [code, i]));

function imageExists(folder, filename) {
  const p = path.join(IMAGES_ROOT, folder, filename + ".jpg");
  return fs.existsSync(p);
}

function findMRPImagePath(card) {
  const sets = card.set || [];
  if (sets.length === 0) return null;

  const filename = card.puretexttitle || card.formattedtitle || card.title?.[0];
  if (!filename) return null;

  // Sort this card's sets by release priority, newest first
  const sorted = [...sets]
    .filter((s) => SET_PRIORITY[s] !== undefined)
    .sort((a, b) => SET_PRIORITY[b] - SET_PRIORITY[a]);

  for (const setCode of sorted) {
    const folder = SET_FOLDER[setCode];
    if (!folder) continue;
    if (!fs.existsSync(path.join(IMAGES_ROOT, folder))) continue;
    if (imageExists(folder, filename)) {
      return `/images/${folder}/${filename}.jpg`;
    }
  }

  return null; // no image found for any set
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const cards = JSON.parse(fs.readFileSync(CARDS_PATH, "utf8"));

let updated = 0;
let unchanged = 0;
let noImage = 0;

for (const card of cards) {
  const mrp = findMRPImagePath(card);

  if (!mrp) {
    noImage++;
    continue;
  }

  if (card.imagePath !== mrp) {
    console.log(`  ${card.puretexttitle}: ${card.imagePath} → ${mrp}`);
    card.imagePath = mrp;
    updated++;
  } else {
    unchanged++;
  }
}

fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2));

console.log(`\nDone. Updated: ${updated} | Unchanged: ${unchanged} | No image found: ${noImage}`);
