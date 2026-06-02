import React from "react";
import Sidebar from "../Sidebar";
import OfflineIndicator from "../OfflineIndicator";
import MobileNav from "../MobileNav";

/**
 * App shell used by every page.
 *
 * sidebarProps    – passed to <Sidebar>
 * showScrollToTop – show the scroll-to-top button
 * onScrollToTop   – scroll handler
 *
 * Mobile nav props (all optional; omit on pages that don't have deck state):
 *   isDeckView    – true when the home page deck panel is open
 *   deckCount     – card count badge on the Deckbuilder tab
 *   onSetDeckView – (bool) => void; toggle home deck/search view
 */
const MainLayout = ({
  children,
  sidebarProps,
  showScrollToTop,
  onScrollToTop,
  isDeckView = false,
  deckCount = 0,
  onSetDeckView,
}) => {
  const onOpenFilters = sidebarProps?.onToggle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <OfflineIndicator />

      <div className="flex min-h-screen">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <Sidebar {...sidebarProps} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* pb-24 on mobile leaves room for the fixed bottom nav */}
          <div className="container mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom nav (mobile only) */}
      <MobileNav
        isDeckView={isDeckView}
        deckCount={deckCount}
        onSetDeckView={onSetDeckView}
        onOpenFilters={onOpenFilters}
      />

      {/* Scroll to top — sits above bottom nav on mobile */}
      {showScrollToTop && (
        <button
          onClick={onScrollToTop}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MainLayout;
