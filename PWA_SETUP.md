# PWA Setup Instructions

Your L5R Card Search app is now a Progressive Web App (PWA) with offline capabilities!

## What's Been Added

### 🔧 **Core PWA Features**

- **Web App Manifest** (`/public/manifest.json`) - Defines app metadata and icons
- **Service Worker** (`/public/sw.js`) - Handles offline caching and background sync
- **PWA Meta Tags** - Added to `index.html` for proper mobile app behavior
- **Install Button** - Appears when the app can be installed on the user's device

### 📱 **Offline Capabilities**

- **XML Data Caching** - The card database is cached for offline use
- **Static Asset Caching** - App files are cached for offline access
- **Offline Indicator** - Shows when the user is offline
- **Background Sync** - Refreshes data when connection is restored

### 🎨 **Icons & Branding**

- **SVG Icon** (`/public/icons/icon.svg`) - Scalable vector icon
- **Icon Generator** (`/public/icons/generate-icons.html`) - Creates PNG icons in all required sizes
- **Browser Config** (`/public/icons/browserconfig.xml`) - Microsoft Edge/IE support

## How to Complete Setup

### 1. Generate PWA Icons

1. Open `/public/icons/generate-icons.html` in your browser
2. Right-click each generated icon and save as PNG with the correct filename:
   - `icon-16x16.png`
   - `icon-32x32.png`
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### 2. Test PWA Features

1. **Install the App**: Look for the "Install App" button in the header
2. **Test Offline**: Disconnect from internet and verify the app still works
3. **Check Caching**: Open DevTools > Application > Storage to see cached data

### 3. Deploy with HTTPS

PWAs require HTTPS in production. Make sure your hosting supports SSL certificates.

## Features

### 🚀 **Installation**

- Users can install the app on their device
- Works on desktop (Chrome, Edge) and mobile (Android, iOS)
- Appears in app launcher/home screen

### 📶 **Offline Support**

- Full card database available offline
- Search and filtering work without internet
- Deck building works offline
- Data syncs when connection returns

### 🔄 **Auto-Updates**

- Service worker automatically updates the app
- Users get notified of new versions
- Background sync keeps data fresh

### 📱 **Mobile Optimized**

- Standalone app experience
- No browser UI when installed
- Optimized for touch interfaces

## Browser Support

- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Samsung Internet

## Development Notes

- Service worker is registered automatically
- Cache strategies are optimized for the card database
- Icons are generated dynamically for easy customization
- Offline detection provides user feedback

Your L5R Card Search app is now a fully functional PWA! 🎌✨
