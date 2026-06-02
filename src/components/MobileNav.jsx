import { useLocation, useNavigate } from "react-router-dom";

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
);

const DeckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const BrowseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const MyDecksIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const FiltersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
  </svg>
);

/**
 * Global bottom navigation for mobile.
 *
 * Props:
 *   deckCount       – badge count on the Deckbuilder tab
 *   isDeckView      – true when the home page is showing the deck panel
 *   onSetDeckView   – (bool) => void, called on home page to toggle deck/search view
 *   onOpenFilters   – () => void, opens the filter panel
 */
export default function MobileNav({
  deckCount = 0,
  isDeckView = false,
  onSetDeckView,
  onOpenFilters,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = (() => {
    const { pathname } = location;
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/my-decks")) return "my-decks";
    if (pathname.startsWith("/deck/") || isDeckView) return "deck";
    return "search";
  })();

  const handleTab = (id) => {
    const onHome = location.pathname === "/";
    switch (id) {
      case "search":
        if (onHome) {
          onSetDeckView?.(false);
        } else {
          navigate("/");
        }
        break;
      case "deck":
        if (onHome) {
          onSetDeckView?.(true);
        } else if (location.pathname.startsWith("/deck/")) {
          // already on a deck page, do nothing
        } else {
          navigate("/?deck=open");
        }
        break;
      case "browse":
        navigate("/browse");
        break;
      case "my-decks":
        navigate("/my-decks");
        break;
      case "filters":
        onOpenFilters?.();
        break;
    }
  };

  const TABS = [
    { id: "search",   label: "Cards",       icon: <SearchIcon /> },
    { id: "deck",     label: "Deckbuilder", icon: <DeckIcon />,    badge: deckCount },
    { id: "browse",   label: "Decks",       icon: <BrowseIcon /> },
    { id: "my-decks", label: "My Decks",    icon: <MyDecksIcon /> },
    { id: "filters",  label: "Filters",     icon: <FiltersIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? "text-indigo-600" : "text-slate-400"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
