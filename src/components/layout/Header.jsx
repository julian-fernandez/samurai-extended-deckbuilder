import React from "react";
import PWAInstallButton from "../PWAInstallButton";

const Header = ({ deckStats, showDeck, onToggleDeckView }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Legend of the Five Rings
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          Samurai Extended Format
        </p>
      </div>
      <div className="flex items-center gap-4">
        <PWAInstallButton />
        <div className="flex gap-4">
          <button
            onClick={onToggleDeckView}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {showDeck ? "Card search" : "Deck view"} ({deckStats.total} cards)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
