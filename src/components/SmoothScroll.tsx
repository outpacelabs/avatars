"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import posthog from "posthog-js";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Track smooth scroll initialization
    posthog.capture("Smooth Scroll Initialized", {
      scroll_library: "lenis",
      scroll_duration: 1.2,
      scroll_orientation: "vertical",
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
