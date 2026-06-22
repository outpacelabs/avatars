"use client";

/*
 * useScrollSpy — universal table-of-contents active-section tracking + click
 * scroll, reusable across pages. Ported from outpacelabs/glass.
 *
 * Detection: scroll-position based, with an in-view line that ramps DOWN the
 * viewport for later sections (0.4vh → 0.9vh). A fixed line can't activate
 * sections that sit below the maximum scroll (short pages / bottom sections);
 * the ramp + top/bottom clamps give EVERY section a real active range and make
 * the last one reachable at the bottom.
 *
 * Click: authoritative. It sets the active index, then LOCKS the spy so the
 * smooth-scroll event stream can't override it (the off-by-one bug). The lock
 * releases on the next user-initiated scroll, after which detection resumes.
 *
 * SSR-safe, reduced-motion aware, resize/dynamic-content aware (ResizeObserver).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollSpyOptions {
	/** Section element ids in document order. */
	ids: string[];
	/** Px from the top a clicked section should land (e.g. fixed-nav height). */
	topOffset?: number;
}

const isBrowser = typeof window !== "undefined";
const prefersReduced = () =>
	isBrowser &&
	!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useScrollSpy({ ids, topOffset = 0 }: ScrollSpyOptions) {
	const idsKey = ids.join("|");
	const [active, setActive] = useState(0);
	const lockRef = useRef(false); // a click is driving the active index
	const rafRef = useRef<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: idsKey is a stable proxy for the ids array
	const compute = useCallback((): number => {
		if (!isBrowser || ids.length === 0) return 0;
		const vh = window.innerHeight;
		const scrollY = window.scrollY;
		const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
		const n = ids.length;
		if (scrollY <= 0) return 0; // first active at the very top
		if (scrollY >= maxScroll - 1) return n - 1; // last active at the very bottom
		let idx = 0;
		for (let i = 0; i < n; i++) {
			const el = document.getElementById(ids[i]);
			if (!el) continue;
			const top = el.getBoundingClientRect().top + scrollY; // fresh doc-top (no stale measure)
			const line = (0.4 + 0.5 * (n > 1 ? i / (n - 1) : 0)) * vh;
			if (top - line <= scrollY) idx = i; // last section we've scrolled past its line
		}
		return idx;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idsKey]);

	const requestUpdate = useCallback(() => {
		if (rafRef.current != null) return;
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			if (lockRef.current) return;
			setActive(compute());
		});
	}, [compute]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: idsKey is a stable proxy for the ids array
	useEffect(() => {
		if (!isBrowser) return;
		requestUpdate();
		window.addEventListener("scroll", requestUpdate, { passive: true });
		window.addEventListener("resize", requestUpdate);
		let ro: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(requestUpdate);
			ro.observe(document.documentElement);
			ids.forEach((id) => {
				const el = document.getElementById(id);
				if (el) ro?.observe(el);
			});
		}
		const t = setTimeout(requestUpdate, 200); // after fonts/reveal layout settles
		return () => {
			window.removeEventListener("scroll", requestUpdate);
			window.removeEventListener("resize", requestUpdate);
			ro?.disconnect();
			clearTimeout(t);
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idsKey, requestUpdate]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: idsKey is a stable proxy for the ids array
	const scrollToId = useCallback(
		(id: string) => {
			if (!isBrowser) return;
			const i = ids.indexOf(id);
			const el = document.getElementById(id);
			if (i < 0 || !el) return;
			setActive(i); // authoritative: clicked item wins
			lockRef.current = true;
			const reduce = prefersReduced();
			const maxScroll = Math.max(
				0,
				document.documentElement.scrollHeight - window.innerHeight,
			);
			const top = el.getBoundingClientRect().top + window.scrollY;
			const target = Math.max(0, Math.min(top - topOffset, maxScroll));
			window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
			// Hold the active index until the user scrolls themselves, then resume.
			const release = () => {
				lockRef.current = false;
				window.removeEventListener("wheel", release);
				window.removeEventListener("touchstart", release);
				window.removeEventListener("keydown", release);
				requestUpdate();
			};
			window.addEventListener("wheel", release, { once: true, passive: true });
			window.addEventListener("touchstart", release, {
				once: true,
				passive: true,
			});
			window.addEventListener("keydown", release, { once: true });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[idsKey, topOffset, requestUpdate],
	);

	const safe = Math.min(active, Math.max(0, ids.length - 1));
	return { active: safe, activeId: ids[safe] ?? "", scrollToId };
}
