"use client";

import Lenis from "lenis";
import posthog from "posthog-js";
import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
	const reducedMotion = usePrefersReducedMotion();

	useEffect(() => {
		if (reducedMotion) return;

		const lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
			orientation: "vertical",
			smoothWheel: true,
		});

		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}

		requestAnimationFrame(raf);

		posthog.capture("Smooth Scroll Initialized", {
			scroll_library: "lenis",
			scroll_duration: 1.2,
			scroll_orientation: "vertical",
		});

		return () => {
			lenis.destroy();
		};
	}, [reducedMotion]);

	return <>{children}</>;
}
