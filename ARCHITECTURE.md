# L5R Card Search & Deckbuilder - Architecture

## 🏗️ **Project Structure**

This is a modern, portfolio-ready React application with a clean, modular architecture.

### 📁 **Directory Structure**

```
src/
├── components/          # React components
│   ├── Card.jsx         # Individual card display
│   ├── SearchFilters.jsx # Search and filter UI
│   ├── PWAInstallButton.jsx # PWA installation
│   └── OfflineIndicator.jsx # Offline status
├── services/            # Business logic services
│   ├── cardService.js   # Card data management
│   └── deckService.js   # Deck management logic
├── utils/               # Utility functions
│   ├── keywordUtils.js  # Keyword extraction & filtering
│   └── filterUtils.js   # Card filtering logic
├── hooks/               # Custom React hooks
│   ├── usePWAInstall.js # PWA installation hook
│   └── useOfflineStatus.js # Offline detection
├── constants/           # Application constants
│   └── index.js         # Samurai Extended sets, keywords, etc.
└── App.jsx              # Main application component
```

## 🔧 **Key Features**

### **Data Management**

- **JSON-based**: Modern JSON data format (replaced XML)
- **Service Layer**: Clean separation of business logic
- **Caching**: Service Worker for offline access
- **Lazy Loading**: Performance optimization for large datasets

### **Deck Building**

- **Validation**: Comprehensive deck rule checking
- **Import/Export**: Text-based deck sharing
- **Organization**: Cards grouped by type and section
- **Search**: Quick deck card lookup

### **Search & Filtering**

- **Text Search**: Full-text search across cards
- **Keyword Filtering**: Typeahead pill-based keyword selection
- **Range Filters**: Numerical value filtering (cost, force, chi, focus)
- **Clan/Type Filters**: Dropdown-based filtering

### **PWA Features**

- **Offline Access**: Full functionality without internet
- **Installable**: Add to home screen
- **Responsive**: Mobile-first design
- **Fast Loading**: Optimized performance

## 🚀 **Technical Stack**

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Service Worker**: Offline capabilities
- **PWA**: Progressive Web App features

## 📊 **Data Flow**

1. **Load**: `cardService.loadCards()` fetches JSON data
2. **Filter**: `cardService.filterCards()` applies search criteria
3. **Display**: Components render filtered results
4. **Deck**: `deckService` manages deck operations
5. **Cache**: Service Worker handles offline storage

## 🎯 **Portfolio Highlights**

- **Clean Architecture**: Separation of concerns
- **Modern Patterns**: Hooks, services, utilities
- **Performance**: Lazy loading, caching, optimization
- **User Experience**: Responsive, accessible, intuitive
- **Maintainable**: Well-documented, modular code

## 🔄 **Migration from XML to JSON**

- **Simplified Parsing**: Direct object access vs DOM parsing
- **Better Performance**: Faster loading and filtering
- **Cleaner Code**: Reduced complexity
- **Modern Standards**: JSON is the web standard
- **Easier Maintenance**: Simpler data handling

## 📱 **PWA Implementation**

- **Manifest**: App metadata and icons
- **Service Worker**: Offline caching strategy
- **Installation**: Browser-based app installation
- **Offline Detection**: User feedback for connectivity
- **Background Sync**: Data updates when online

This architecture demonstrates modern React development practices, clean code organization, and professional software engineering principles suitable for a portfolio project.
