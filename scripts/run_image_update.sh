#!/bin/bash

# L5R Card Image Path Update Script
# Run this script overnight to update all card image paths

echo "🚀 Starting L5R Card Image Path Update"
echo "⏰ Started at: $(date)"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "public/cards.json" ]; then
    echo "❌ Error: cards.json not found. Please run this from the l5r-card-search directory."
    exit 1
fi

if [ ! -d "public/images" ]; then
    echo "❌ Error: images directory not found. Please ensure images are in public/images/"
    exit 1
fi

# Run the update script
echo "🔄 Running image path update..."
node update_image_paths.js

# Check if the update was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Image path update completed successfully!"
    echo "⏰ Finished at: $(date)"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the updated file: public/cards_with_images.json"
    echo "2. If satisfied, replace original: cp public/cards_with_images.json public/cards.json"
    echo "3. If issues found, restore backup: cp public/cards_backup.json public/cards.json"
    echo ""
    echo "📊 File sizes:"
    echo "Original: $(du -h public/cards.json | cut -f1)"
    echo "Updated:  $(du -h public/cards_with_images.json | cut -f1)"
    echo "Backup:   $(du -h public/cards_backup.json | cut -f1)"
else
    echo "❌ Image path update failed!"
    echo "Check the error messages above."
    exit 1
fi
