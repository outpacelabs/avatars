"use client";

import { useEffect, useRef } from "react";
import { appleCornerPath } from "./appleCornerPath";

/**
 * Applies Apple-style smoothed corners (Figma 60% smoothing) to an element
 * via `clip-path: path(...)`, regenerated on resize (border-box size, so
 * entrance transforms don't skew the path).
 *
 * The element should keep its CSS border-radius: it is the no-JS /
 * unsupported-browser fallback. Once the clip applies, the inline
 * border-radius is zeroed — the circular arc sits inside the superellipse,
 * so leaving both would intersect to the plain circle and cancel the
 * smoothing. Layout is untouched; only painting is clipped (skill rule:
 * preserve layout, animate the path not the box).
 */
export function useSmoothCorners<T extends HTMLElement>(
	radius: number,
	smoothing = 60,
) {
	const ref = useRef<T | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (
			typeof CSS === "undefined" ||
			!CSS.supports("clip-path", 'path("M0 0H1V1H0Z")')
		) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const box = entries[0]?.borderBoxSize?.[0];
			const width = box ? box.inlineSize : el.offsetWidth;
			const height = box ? box.blockSize : el.offsetHeight;
			el.style.clipPath = `path("${appleCornerPath({ width, height, radius, smoothing })}")`;
			el.style.borderRadius = "0px";
		});
		observer.observe(el);

		return () => {
			observer.disconnect();
			el.style.clipPath = "";
			el.style.borderRadius = "";
		};
	}, [radius, smoothing]);

	return ref;
}
