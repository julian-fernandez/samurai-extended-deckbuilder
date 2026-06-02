import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PWAInstallButton from "../PWAInstallButton";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";

const NAV_LINKS = [
  { label: "Browse Cards", to: "/" },
  { label: "Browse Decks", to: "/browse" },
  { label: "Deckbuilder", to: "/?deck=open" },
  { label: "My Decks", to: "/my-decks" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (to) => {
    if (to === "/?deck=open") return false; // never highlight as "active"
    return location.pathname === to;
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* Desktop header */}
      <div className="hidden md:flex justify-between items-center">
        <div
          className="cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Legend of the Five Rings
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Samurai Extended Format
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PWAInstallButton />

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-default"
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
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex md:hidden items-center justify-between">
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            L5R
          </h1>
          <p className="text-xs text-gray-500">Samurai Extended</p>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          {user ? (
            <button
              onClick={signOut}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
              title={`Signed in as ${user.email} — tap to sign out`}
            >
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default Header;
