# scripts/

One-off maintenance scripts used to build and repair the card data JSON. None of these are imported by the React app.

Run them from the repo root with `node scripts/<name>.js` unless noted otherwise.

## Card data builders

| Script | Purpose |
|---|---|
| `build_json_from_xml.js` | Initial XML → JSON conversion (v1) |
| `build_json_from_xml_v2.js` | XML → JSON v2 |
| `build_json_from_xml_v3.js` | XML → JSON v3 |
| `build_json_from_xml_v4.js` | XML → JSON v4 (latest) |

## Legality / filtering

| Script | Purpose |
|---|---|
| `extract_legal_cards.js` | Extract legal card list from raw data |
| `filter_legal_cards.js` | Filter dataset to legal cards |
| `careful_legal_filtering.js` | Conservative legality filter pass |
| `fix_legal_filtering_properly.js` | Corrected legality filter |
| `fix_legality_correctly.js` | Additional legality fixes |
| `fix_legality_final.js` | Final legality pass |
| `fix_legality_precise.js` | Precise per-set legality corrections |
| `fix_legality_properly.js` | Earlier legality correction attempt |
| `final_verification.js` | Verify legality output |

## Image path fixes

| Script | Purpose |
|---|---|
| `comprehensive_image_update.js` | Bulk image path update pass |
| `find_actual_images.js` | Locate real image files on disk |
| `fix_all_cards_images.js` | Fix image paths for all cards |
| `fix_correct_images.js` | Targeted image path corrections |
| `fix_correct_images_properly.js` | Revised version of above |
| `fix_images_correctly.js` | Another image correction pass |
| `fix_images_final.js` | Final image path pass |
| `fix_images_properly.js` | Earlier image fix attempt |
| `fix_images_properly_final.js` | Revised final pass |
| `fix_mrp_images.js` | Fix MRP set image paths |
| `fix_null_images.js` | Patch cards with null image paths |
| `fix_samurai_edition_images.js` | Fix Samurai Edition image paths |
| `fix_twenty_festivals_images.js` | Fix Twenty Festivals image paths |
| `fix_experienced_images.js` | Fix Experienced card image paths |
| `fix_experienced_images_ep_tha_scw.js` | Fix Experienced images for EP/THA/SCW sets |
| `match_missing_images.js` | Match cards that still have no image |
| `update_image_paths.js` | Bulk update image path format |
| `update_backside_paths.js` | Update card back image paths |
| `update_legal_images_simple.js` | Simplified legal-image update |

## Experienced-card fixes

| Script | Purpose |
|---|---|
| `fix_all_experienced_cards.js` | Fix all Experienced card data |
| `fix_experienced_cards.js` | Fix Experienced card entries |
| `fix_experienced_cards_final.js` | Final Experienced card pass |
| `fix_experienced_cards_properly.js` | Corrected Experienced fix |

## Text / keyword fixes

| Script | Purpose |
|---|---|
| `fix_cards_from_xml.js` | Patch card text fields from XML source |
| `fix_text_from_xml.js` | Fix text fields using XML data |
| `fix_text_properly.js` | Corrected text fix pass |
| `fix_text_final.js` | Final text patch |
| `audit_keywords.js` | Audit keyword data for anomalies |
| `fix_battle_maiden_keywords.js` | Fix Battle Maiden keyword entries |
| `fix_all_issues_comprehensive.js` | Omnibus fix pass |

## Specific card fixes

| Script | Purpose |
|---|---|
| `fix_battle_maiden_personalities_only.js` | Targeted Battle Maiden personality fix |
| `fix_moto_chen_specifically.js` | Fix Moto Chen card entry |
| `fix_specific_issues.js` | Fix individually-identified card issues |
| `fix_utaku_ji_yun_text.js` | Fix Utaku Ji-Yun card text |
| `fix_utaku_yu_pan.js` | Fix Utaku Yu-Pan card entry |
| `restore_and_fix_cards.js` | Restore from backup and apply fixes |

## Debug / test scripts

| Script | Purpose |
|---|---|
| `debug_import.js` | Debug card data import |
| `simple_import_test.js` | Basic import sanity check |
| `test_import_full.js` | Full import integration test |
| `test_specific_cards.js` | Test specific card data |
| `clear_cache.js` | Clear local dev caches |

## Shell

| Script | Purpose |
|---|---|
| `run_image_update.sh` | Shell wrapper that runs the image update pipeline |

## Generated artifacts

| File | Description |
|---|---|
| `card_image_mapping.json` | Generated mapping of card IDs → image paths |
| `keyword_audit_report.json` | Generated keyword audit output |
