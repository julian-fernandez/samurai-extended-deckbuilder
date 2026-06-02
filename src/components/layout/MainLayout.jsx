import React from "react";
import Sidebar from "../Sidebar";
import OfflineIndicator from "../OfflineIndicator";
import MobileNav from "../MobileNav";
import Header from "./Header";

/**
 * App shell.
 *
 * The nav bar and all page content are capped at 1200 px and centered.
 * The filter sidebar is position:fixed at the far-left of the viewport —
 * it is NOT in the document flow and does not affect the layout width.
 * On wide screens it sits in the margin space; on narrower screens it
 * overlays the edge of the content. Collapsing hides it to a thin strip.
 *
 * Nav bar height is fixed at h-14 (56 px); the sidebar uses top-14 to
 * start just below it.
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

      {/* Nav bar — full-width dark background, 1200 px content, fixed height h-14 */}
      {showGlobalHeader && (
        <div className="bg-slate-900 flex-shrink-0 h-14 flex items-center">
          <div className="max-w-[1200px] mx-auto px-4 w-full">
            <Header />
          </div>
        </div>
      )}

      {/* Page content — always 1200 px centered, unaffected by sidebar */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto px-6 py-6 pb-24 md:py-8 md:pb-8">
          {children}
        </div>
      </div>

      {/* Fixed sidebar — outside flow, left edge of viewport, below nav */}
      {sidebarProps && <Sidebar {...sidebarProps} />}

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
