"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Page-transition wrapper. `template.tsx` re-mounts on every navigation, so the
 * enter animation replays as you move between / and /docs.
 *
 * Opacity-only (no transform) on purpose: a transform on this ancestor would
 * create a containing block and break the sticky <SiteHeader>. Ease-out, under
 * 300ms (easing-entrance-ease-out, duration-max-300ms); instant for reduced
 * motion (none-keyboard-navigation / reduced-motion).
 */
export default function Template({ children }: { children: ReactNode }) {
	const reduced = useReducedMotion();

	return (
		<motion.div
			initial={reduced ? false : { opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={
				reduced ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
			}
		>
			{children}
		</motion.div>
	);
}
