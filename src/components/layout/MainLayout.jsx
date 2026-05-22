import React from "react";
import Sidebar from "../Sidebar";
import OfflineIndicator from "../OfflineIndicator";

const MainLayout = ({
  children,
  sidebarProps,
  showScrollToTop,
  onScrollToTop,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <OfflineIndicator />

      <div className="flex min-h-screen">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <Sidebar {...sidebarProps} />

        {/* Main Content — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0">
          {/* pb-20 on mobile leaves room for the fixed bottom nav */}
          <div className="container mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
            {children}
          </div>
        </div>
      </div>

      {/* Scroll to Top — shift up above bottom nav on mobile */}
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
