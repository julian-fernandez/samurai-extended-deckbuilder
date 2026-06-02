import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../auth/AuthModal";
import CardTypeahead from "../CardTypeahead";

const NAV_LINKS = [
  { label: "Browse Cards", to: "/" },
  { label: "Browse Decks", to: "/browse" },
  { label: "Deckbuilder", to: "/?deck" },
  { label: "My Decks", to: "/my-decks" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isDeckView = location.pathname === "/" && searchParams.has("deck");

  const isActive = (to) => {
    if (to === "/?deck") return isDeckView;
    if (to === "/") return location.pathname === "/" && !isDeckView;
    return location.pathname === to;
  };

  return (
    <div>
      {/* Desktop nav bar */}
      <div className="hidden md:flex items-center gap-3">

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive(to)
                  ? "bg-white/15 text-white"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <CardTypeahead className="w-44 focus-within:w-56 transition-[width] duration-150" />

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold cursor-default"
                title={user.email}
              >
                {user.email?.[0]?.toUpperCase() ?? "?"}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 border border-slate-600 text-sm font-medium text-slate-300 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden flex-col gap-2">
        <div className="flex items-center gap-2">
          <CardTypeahead className="flex-1" />
          {user ? (
            <button
              onClick={signOut}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              title={`Signed in as ${user.email} — tap to sign out`}
            >
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 border border-slate-600 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
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
