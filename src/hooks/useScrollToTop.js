import { useState, useEffect } from "react";

export const useScrollToTop = () => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleGlobalScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          setShowScrollToTop(scrollTop > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleGlobalScroll);
    return () => {
      window.removeEventListener("scroll", handleGlobalScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    showScrollToTop,
    scrollToTop,
  };
};
