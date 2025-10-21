# L5R Card Image Path Update Script

This script will scan through all image folders and update the JSON file with correct image paths for every card in the Samurai Extended format.

## 🚀 Quick Start

### Option 1: Run the shell script (recommended)

```bash
./run_image_update.sh
```

### Option 2: Run the Node.js script directly

```bash
node update_image_paths.js
```

## 📋 What the Script Does

1. **Creates a backup** of your original `cards.json` file
2. **Scans all image folders** in `public/images/`
3. **Matches cards to images** using multiple filename variations
4. **Updates the JSON** with `imagePath` properties for each card
5. **Saves the result** to `cards_with_images.json`

## 📁 File Structure

```
l5r-card-search/
├── public/
│   ├── cards.json                    # Original file (backed up)
│   ├── cards_backup.json            # Backup of original
│   ├── cards_with_images.json       # Updated file with image paths
│   └── images/                      # All card images
├── update_image_paths.js            # Main script
├── run_image_update.sh              # Shell wrapper
└── IMAGE_UPDATE_README.md          # This file
```

## 🔍 How It Works

### Image Matching Strategy

1. **Legal Set Priority**: Tries to find images in folders matching the card's legal sets first
2. **Fallback Search**: If not found, searches all available folders
3. **Multiple Filename Variations**: Tries different name formats:
   - Original name
   - HTML entity conversions (`&#149;` → `-`)
   - Experience suffixes (`- exp`, `- exp2`, `- Experienced`)
   - Bullet point variations (`•` → `-`)

### Supported Sets

- **Emperor Edition** (emperor)
- **Celestial Edition** (celestial)
- **Samurai Edition** (samurai)
- **Twenty Festivals** (20F)
- **Ivory Edition** (ivory)

## ⏱️ Expected Runtime

- **~4000 cards** to process
- **~100-200 cards/second** processing rate
- **Total time: 20-40 minutes** (depending on your system)

## 📊 Output

The script will show:

- Progress updates every 100 cards
- ETA (estimated time remaining)
- Final statistics (found/not found)
- Processing rate

## 🔄 After Completion

1. **Review the results**: Check `cards_with_images.json`
2. **If satisfied**: Replace the original file
   ```bash
   cp public/cards_with_images.json public/cards.json
   ```
3. **If issues found**: Restore from backup
   ```bash
   cp public/cards_backup.json public/cards.json
   ```

## 🛠️ Troubleshooting

### Common Issues

- **"No image found"**: Card name doesn't match any image filename
- **"Images directory not found"**: Make sure images are in `public/images/`
- **"JSON file not found"**: Run from the `l5r-card-search` directory

### Manual Fixes

If some cards aren't found, you can:

1. Check the image filename manually
2. Rename the image file to match the card name
3. Re-run the script

## 🎯 Benefits

After running this script:

- ✅ **Faster image loading** - No more searching for images
- ✅ **Better performance** - Images load instantly
- ✅ **Offline capability** - All image paths are cached
- ✅ **Consistent experience** - No more "image not found" errors

## 📝 Notes

- The script only processes cards legal in Samurai Extended format
- It creates a backup before making any changes
- The original file is never modified directly
- You can safely run it multiple times
