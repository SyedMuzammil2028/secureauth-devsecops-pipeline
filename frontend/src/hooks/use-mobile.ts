import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const updateState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    updateState();
    mediaQuery.addEventListener("change", updateState);

    return () => mediaQuery.removeEventListener("change", updateState);
  }, []);

  return isMobile;
}
