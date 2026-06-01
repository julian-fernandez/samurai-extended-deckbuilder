/**
 * Keyword Audit Script
 *
 * Compares raw keyword blocks extracted from the XML against what
 * ended up in cards_v3.json, reporting any tokens that were silently dropped.
 *
 * Edition formatting patterns handled:
 *   - Gold/Diamond era:   <B>KEYWORD1 &#8226; KEYWORD2.</B>  (HTML entity bullets, uppercase)
 *   - Lotus/Samurai/Celestial: <B>Keyword1 • Keyword2.</B>   (unicode bullets, title case)
 *   - Emperor/Ivory era:  mix of plain + bold: keyword1 • <b>Keyword2</b>
 *   - Sensei cards:       <B>Crane. Dragon. Phoenix. Sensei.</B> (period separators)
 *   - Followers/Items:    Bow • Two-Handed • <b>Weapon</b>  (plain keywords before bold action)
 *
 * Separator between keyword block and ability text:
 *   - Primary:   first <br> or <BR> tag
 *   - Fallback:  first action-word bold tag (<b>Battle:</b>, <b>Limited:</b>, etc.)
 *   - Some older cards have NO separator at all (plain text, no bold keywords)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load L5R_KEYWORDS ───────────────────────────────────────────────────────
const constantsContent = fs.readFileSync(
  path.join(__dirname, "src", "constants", "index.js"),
  "utf8"
);
const keywordMatches = constantsContent.match(
  /export const L5R_KEYWORDS = \[([\s\S]*?)\];/
);
const L5R_KEYWORDS = new Set(
  keywordMatches
    ? keywordMatches[1]
        .split("\n")
        .map((l) => l.trim().replace(/[",]/g, "").replace(/^["']|["']$/g, ""))
        .filter((k) => k && !k.startsWith("//"))
    : []
);
console.log(`Loaded ${L5R_KEYWORDS.size} keywords`);

// ─── Load XML ────────────────────────────────────────────────────────────────
const xmlData = fs.readFileSync(
  path.join(__dirname, "public", "samuraiextendeddb.xml"),
  "utf8"
);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
});
const xmlCards = parser.parse(xmlData).cards.card;
console.log(`Parsed ${xmlCards.length} XML cards`);

// ─── Load JSON ───────────────────────────────────────────────────────────────
const jsonCards = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public", "cards_v3.json"), "utf8")
);
const jsonByName = new Map();
for (const c of jsonCards) {
  jsonByName.set(c.puretexttitle, c);
}
console.log(`Loaded ${jsonCards.length} JSON cards\n`);

// ─── Samurai Extended legal check ────────────────────────────────────────────
const SE_LEGAL = new Set(["celestial", "emperor", "samurai", "ivory", "20f"]);
function isSELegal(card) {
  if (!card.legal) return false;
  const legals = Array.isArray(card.legal) ? card.legal : [card.legal];
  return legals.some((l) => SE_LEGAL.has(String(l).toLowerCase()));
}

// ─── Action word detection ────────────────────────────────────────────────────
// These appear in bold but are NOT keywords — they open the ability text block.
const ACTION_WORDS = [
  "Battle", "Limited", "Open", "Reaction", "Interrupt",
  "Political", "Ninja", "Elemental", "Kiho", "Dynasty",
  "Reserve", "Home", "Terrain",
];
function isActionWord(token) {
  const t = token.replace(/:$/, "").trim();
  return ACTION_WORDS.some((a) => t.toLowerCase().startsWith(a.toLowerCase()));
}

// ─── Extract the raw keyword block from XML text ──────────────────────────────
// Returns the portion of text that should contain only keywords (before abilities).
function getRawKeywordBlock(text) {
  if (!text) return "";

  // Strategy 1: Split at first <br>/<BR> — the most reliable separator.
  // Everything before it is the keyword block.
  const brIdx = text.search(/<br\s*\/?>/i);
  if (brIdx > 0) {
    return text.substring(0, brIdx);
  }

  // Strategy 2: No <br> at all.
  // If the entire text is inside a single <b>...</b> block, the whole thing
  // may be keywords (e.g. a personality with only traits and no abilities).
  // If there's a bold action word somewhere, everything before it is keywords.
  const actionBoldMatch = text.match(
    /<[bB]>\s*(?:Battle|Limited|Open|Reaction|Interrupt|Political|Ninja|Elemental|Kiho|Dynasty|Reserve|Terrain)[^<]*:\s*<\/[bB]>/i
  );
  if (actionBoldMatch) {
    return text.substring(0, text.indexOf(actionBoldMatch[0]));
  }

  // Strategy 3: Fallback — treat the whole text as potentially keywords.
  // (Handles plain-text-only cards: no bold, no <br>)
  return text;
}

// ─── Tokenise a keyword block into individual trait strings ───────────────────
// Handles all separator variants: bullets, periods, commas, HTML entities.
function tokeniseKeywordBlock(block) {
  // Normalise case-insensitive bold tags
  let raw = block
    .replace(/<\/[bB]>/g, "</b>")
    .replace(/<[bB]>/g, "<b>");

  // Strip all HTML tags but preserve text content
  raw = raw.replace(/<[^>]+>/g, " ");

  // Replace all separator variants with a pipe
  raw = raw
    .replace(/&#8226;/g, "|")
    .replace(/&#149;/g, "|")
    .replace(/•/g, "|")
    .replace(/\.\s+/g, "|")   // period followed by space
    .replace(/\.$/, "|")      // trailing period
    .replace(/,\s+/g, "|");   // comma separated (some older cards)

  return raw
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// ─── Main audit loop ──────────────────────────────────────────────────────────
const dropped = [];       // { name, type, edition, token, block }
const unrecognised = [];  // tokens not in L5R_KEYWORDS — new candidates
const tokenFrequency = new Map(); // how often each dropped token appears

for (const xmlCard of xmlCards) {
  if (!xmlCard.name || !isSELegal(xmlCard)) continue;

  const jsonCard = jsonByName.get(xmlCard.name);
  if (!jsonCard) continue; // not in JSON (shouldn't happen for SE-legal cards)

  const rawText = xmlCard.text;
  if (!rawText || typeof rawText !== "string") continue;

  const block = getRawKeywordBlock(rawText);
  const tokens = tokeniseKeywordBlock(block);
  const jsonKeywords = new Set(jsonCard.keywords || []);

  for (const token of tokens) {
    // Skip empty, action words (Limited:, Battle:, etc.)
    if (!token || isActionWord(token)) continue;

    // Skip tokens that are just "Lose X Honor" or other ability text leaking in
    if (/^lose\s/i.test(token) || /^\d+[FC]$/i.test(token)) continue;

    // Is this token in the JSON keywords?
    if (jsonKeywords.has(token)) continue;

    // Is this token a known keyword? If not in L5R_KEYWORDS, it's unrecognised.
    const isKnown = L5R_KEYWORDS.has(token);
    const edition = Array.isArray(xmlCard.edition)
      ? xmlCard.edition[0]
      : xmlCard.edition;
    const type = xmlCard["@_type"];

    const entry = {
      name: xmlCard.name,
      type,
      edition,
      token,
      block: block.replace(/<[^>]+>/g, "").trim().substring(0, 80),
    };

    if (isKnown) {
      dropped.push(entry);
    } else {
      unrecognised.push(entry);
    }

    const freq = tokenFrequency.get(token) || 0;
    tokenFrequency.set(token, freq + 1);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────
console.log("=".repeat(70));
console.log("DROPPED KEYWORDS (in L5R_KEYWORDS list but missing from JSON)");
console.log("=".repeat(70));

if (dropped.length === 0) {
  console.log("  None — all known keywords extracted correctly.\n");
} else {
  // Group by token for readability
  const byToken = new Map();
  for (const d of dropped) {
    if (!byToken.has(d.token)) byToken.set(d.token, []);
    byToken.get(d.token).push(d);
  }
  const sorted = [...byToken.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [token, cards] of sorted) {
    console.log(`\n  "${token}" — dropped on ${cards.length} card(s):`);
    for (const c of cards.slice(0, 5)) {
      console.log(`    [${c.type}] ${c.name} (${c.edition})`);
      console.log(`      block: "${c.block}"`);
    }
    if (cards.length > 5) console.log(`    ... and ${cards.length - 5} more`);
  }
}

console.log("\n" + "=".repeat(70));
console.log("UNRECOGNISED TOKENS (in XML keyword block, NOT in L5R_KEYWORDS)");
console.log("=".repeat(70));
console.log("(These may be valid traits missing from the keyword list)");

if (unrecognised.length === 0) {
  console.log("  None.\n");
} else {
  const byToken = new Map();
  for (const u of unrecognised) {
    if (!byToken.has(u.token)) byToken.set(u.token, []);
    byToken.get(u.token).push(u);
  }
  const sorted = [...byToken.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [token, cards] of sorted.slice(0, 60)) {
    console.log(`\n  "${token}" — appears on ${cards.length} card(s):`);
    for (const c of cards.slice(0, 3)) {
      console.log(`    [${c.type}] ${c.name} (${c.edition})`);
    }
    if (cards.length > 3) console.log(`    ... and ${cards.length - 3} more`);
  }
  if (sorted.length > 60) {
    console.log(`\n  ... and ${sorted.length - 60} more unique unrecognised tokens`);
  }
}

console.log("\n" + "=".repeat(70));
console.log("SUMMARY");
console.log("=".repeat(70));
console.log(`  Dropped known keywords : ${dropped.length} instances across ${new Set(dropped.map(d => d.name)).size} cards`);
console.log(`  Unrecognised tokens    : ${unrecognised.length} instances, ${new Map([...tokenFrequency].filter(([k]) => !L5R_KEYWORDS.has(k))).size} unique`);

// Write full results to file for easier review
const report = {
  dropped: dropped.map(d => ({ name: d.name, type: d.type, edition: d.edition, token: d.token })),
  unrecognised: unrecognised.map(u => ({ name: u.name, type: u.type, edition: u.edition, token: u.token })),
};
fs.writeFileSync(
  path.join(__dirname, "keyword_audit_report.json"),
  JSON.stringify(report, null, 2)
);
console.log("\n  Full report saved to keyword_audit_report.json");
