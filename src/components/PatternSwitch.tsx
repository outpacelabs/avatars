"use client";

import { tap as tapSound } from "@outpacelabs/audio";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Pattern } from "@/lib/avatars/patterns";

/*
 * Floating glass switch (bottom-center of the home page) that flips every
 * avatar between the soft mesh gradient and the crisp dither. Same frosted-pill
 * language as the header. Each option carries a round illustration of the look
 * it switches to, a smooth ramp vs a checkerboard, mirroring the circular
 * avatars, so the choice reads at a glance.
 *
 * The active highlight is a shared-layout `motion` pill: selecting an option
 * springs it across (spring-for-interruptible / physics-spring-for-overshoot),
 * with balanced params for minimal wobble and an instant move under reduced
 * motion.
 */

/** Round swatch with a soft ramp, the mesh gradient. */
function GradientIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 18 18"
			fill="none"
			aria-hidden="true"
		>
			<defs>
				<linearGradient
					id="pf-grad"
					x1="3"
					y1="3"
					x2="15"
					y2="15"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="currentColor" stopOpacity="0.25" />
					<stop offset="1" stopColor="currentColor" />
				</linearGradient>
			</defs>
			<circle cx="9" cy="9" r="6.5" fill="url(#pf-grad)" />
		</svg>
	);
}

/** Round dither swatch: flat square checker cells, clipped to a circle so the
 *  icon's silhouette matches the round avatars (and the gradient swatch). */
function DitherIcon() {
	const n = 4;
	const inset = 2.5;
	const cell = 13 / n;
	const cells: ReactNode[] = [];
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			if ((i + j) % 2 !== 0) continue;
			cells.push(
				<rect
					key={`${i}-${j}`}
					x={inset + i * cell}
					y={inset + j * cell}
					// Slight overlap avoids hairline seams between cells.
					width={cell + 0.3}
					height={cell + 0.3}
					fill="currentColor"
				/>,
			);
		}
	}
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 18 18"
			fill="none"
			aria-hidden="true"
		>
			<clipPath id="pf-dither-round">
				<circle cx="9" cy="9" r="6.5" />
			</clipPath>
			<g clipPath="url(#pf-dither-round)">{cells}</g>
		</svg>
	);
}

const OPTIONS: { value: Pattern; label: string; Icon: () => ReactNode }[] = [
	{ value: "mesh", label: "Gradient", Icon: GradientIcon },
	{ value: "dither", label: "Dither", Icon: DitherIcon },
];

export function PatternSwitch({
	value,
	onChange,
	hidden = false,
	floating = true,
}: {
	value: Pattern;
	onChange: (p: Pattern) => void;
	/** Slide the switch out (e.g. while a toast occupies the same slot). */
	hidden?: boolean;
	/** Fixed bottom-center pill (home) vs. an inline pill (embedded controls). */
	floating?: boolean;
}) {
	const reduced = useReducedMotion();

	const pill = (
		<fieldset
			aria-label="Avatar pattern"
			className="flex items-center gap-1 rounded-full bg-white/[0.08] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
		>
			{OPTIONS.map(({ value: v, label, Icon }) => {
				const active = v === value;
				return (
					<button
						key={v}
						type="button"
						aria-pressed={active}
						onClick={() => {
							if (!active) {
								tapSound();
								onChange(v);
							}
						}}
						className={`relative flex cursor-pointer items-center gap-2 rounded-full py-2 pl-2 pr-3.5 text-sm font-[550] leading-none transition-colors motion-safe:active:scale-[0.97] ${
							active
								? "text-white/[0.96]"
								: "text-white/[0.48] hover:text-white/[0.8]"
						}`}
					>
						{/* Shared-layout highlight: springs from one option to the other
						    when the selection changes. */}
						{active && (
							<motion.span
								layoutId="pattern-switch-pill"
								aria-hidden="true"
								className="absolute inset-0 rounded-full bg-white/[0.14]"
								transition={
									reduced
										? { duration: 0 }
										: { type: "spring", stiffness: 480, damping: 40 }
								}
							/>
						)}
						<span className="relative z-[1] flex items-center gap-1.5">
							<Icon />
							{label}
						</span>
					</button>
				);
			})}
		</fieldset>
	);

	if (!floating) return pill;

	return (
		<div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
			{/* Outer div owns the centering transform; this inner layer slides
			    down and fades out when a toast takes the slot, then returns. */}
			<motion.div
				animate={{ y: hidden ? 16 : 0, opacity: hidden ? 0 : 1 }}
				transition={
					reduced
						? { duration: 0 }
						: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
				}
				aria-hidden={hidden}
				style={{ pointerEvents: hidden ? "none" : "auto" }}
			>
				{pill}
			</motion.div>
		</div>
	);
}
