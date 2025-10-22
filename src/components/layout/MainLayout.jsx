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
        {/* Sidebar */}
        <Sidebar {...sidebarProps} />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8">{children}</div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={onScrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MainLayout;
