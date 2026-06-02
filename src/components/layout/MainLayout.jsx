import React from "react";
import Sidebar from "../Sidebar";
import OfflineIndicator from "../OfflineIndicator";
import MobileNav from "../MobileNav";
import Header from "./Header";

/**
 * App shell.
 *
 * The global nav Header is rendered full-width above the sidebar/content row
 * so it never shifts when the sidebar appears or disappears.
 *
 * Props:
 *   sidebarProps      – if provided, renders the filter Sidebar (Browse Cards only)
 *   showGlobalHeader  – set false on pages with their own header (e.g. DeckPage)
 *   showScrollToTop   – show the scroll-to-top button
 *   onScrollToTop     – scroll handler
 *   isDeckView        – passed to MobileNav for active-tab highlight
 *   deckCount         – card count badge on the Deckbuilder mobile tab
 */
const MainLayout = ({
  children,
  sidebarProps,
  showGlobalHeader = true,
  showScrollToTop,
  onScrollToTop,
  deckCount = 0,
}) => {
  const onOpenFilters = sidebarProps?.onToggle;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <OfflineIndicator />

      {/* Global nav — always full-width, unaffected by sidebar */}
      {showGlobalHeader && (
        <div className="bg-slate-900 px-4 py-3 md:px-8 flex-shrink-0">
          <div className="max-w-[1200px] mx-auto">
            <Header />
          </div>
        </div>
      )}

      {/* Sidebar + content row — fills remaining height */}
      <div className="flex flex-1 min-h-0">
        {sidebarProps && <Sidebar {...sidebarProps} />}

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom nav (mobile only) */}
      <MobileNav
        deckCount={deckCount}
        onOpenFilters={onOpenFilters}
      />

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
