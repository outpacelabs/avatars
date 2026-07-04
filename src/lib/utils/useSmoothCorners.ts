"use client";

import { useEffect, useRef } from "react";
import { squirclePath } from "./squircle";

/**
 * Applies Apple-style smoothed corners (Figma 60% corner smoothing) to an
 * element via `clip-path: path(...)`, regenerated on resize (border-box
 * size, so entrance transforms don't skew the path).
 *
 * Geometry is our own squirclePath — Figma's actual corner-smoothing math:
 * the circular arc at the corner apex keeps the SAME radius, and the
 * smoothing extends the ease-in/out along the straight edges. (A naive
 * superellipse in the r×r corner box hugs the corner tighter than the
 * circle and reads as a SMALLER radius.)
 *
 * The element should keep its CSS border-radius: it is the no-JS /
 * unsupported-browser fallback. Once the clip applies, the inline
 * border-radius is zeroed — the arc and the squircle overlap at the apex,
 * and letting both paint would clip the smoothed edge transition away.
 * Layout is untouched; only painting is clipped.
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
			if (!width || !height) return;
			const d = squirclePath({
				width,
				height,
				radius,
				smoothing: Math.min(Math.max(smoothing, 0), 100) / 100,
			});
			el.style.clipPath = `path("${d}")`;
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
