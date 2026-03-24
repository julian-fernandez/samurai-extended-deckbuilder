import { useState } from "react";
import PWAInstallButton from "../PWAInstallButton";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";

const Header = ({ deckStats, showDeck, onToggleDeckView }) => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

        {/* Auth button */}
        {user ? (
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
              title={user.email}
            >
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Sign in
          </button>
        )}

        <button
          onClick={onToggleDeckView}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          {showDeck ? "Card search" : "Deck view"} ({deckStats.total} cards)
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default Header;
