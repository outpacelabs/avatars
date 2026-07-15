"use client";

import { useEffect, useRef } from "react";
import { drawPattern, type Pattern } from "@/lib/avatars/patterns";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

interface GradientAvatarProps {
	/** Any string or number — each unique seed produces a unique gradient. */
	seed: number | string;
	/** Rendered size in pixels (default: 32). */
	size?: number;
	/** Render engine: soft `"mesh"` (default) or crisp `"dither"`. */
	pattern?: Pattern;
	/**
	 * Fill the parent instead of sizing to `size`. Use when a responsive
	 * wrapper owns the dimensions: a fixed inline width/height would
	 * overflow the wrapper at breakpoints where the two disagree (the
	 * mobile grid bug — a 96px avatar in an 80px box sits 8px off-center).
	 * `size` still sets the blur radius basis.
	 */
	fill?: boolean;
	/** Additional CSS classes. */
	className?: string;
}

/** Internal render resolution. Higher than display size so the CSS blur is smooth. */
const RENDER_SIZE = 256;
/** Blur radius as a fraction of display size — matches the baked-image look. */
const BLUR_FRACTION = 0.06;
/** Pattern crossfade — a small state change (duration-small-state, ease-out). */
const FADE = "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Renders a deterministic mesh-gradient avatar on a `<canvas>`.
 * The same seed always produces the same gradient.
 *
 * Both patterns are painted once onto stacked canvases; toggling `pattern`
 * only crossfades their opacity (GPU-composited, no redraw), so the switch
 * animates smoothly instead of snapping.
 */
export function GradientAvatar({
	seed,
	size = 32,
	pattern = "mesh",
	fill = false,
	className = "",
}: GradientAvatarProps) {
	const meshRef = useRef<HTMLCanvasElement>(null);
	const ditherRef = useRef<HTMLCanvasElement>(null);
	const reducedMotion = usePrefersReducedMotion();

	useEffect(() => {
		for (const [ref, p] of [
			[meshRef, "mesh"],
			[ditherRef, "dither"],
		] as const) {
			const canvas = ref.current;
			if (!canvas) continue;
			const ctx = canvas.getContext("2d");
			if (!ctx) continue;
			ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
			drawPattern(ctx, seed, RENDER_SIZE, p);
		}
	}, [seed]);

	// Only the mesh gets the signature soft blur; the dither stays crisp.
	const blurPx = Math.max(1, Math.round(size * BLUR_FRACTION));
	const showDither = pattern === "dither";
	const transition = reducedMotion ? undefined : FADE;

	return (
		<span
			role="img"
			aria-label={`Gradient avatar for seed ${seed}`}
			className={`relative inline-block overflow-hidden rounded-full ${className}`}
			style={
				fill ? { width: "100%", height: "100%" } : { width: size, height: size }
			}
		>
			<canvas
				ref={meshRef}
				aria-hidden="true"
				width={RENDER_SIZE}
				height={RENDER_SIZE}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					filter: `blur(${blurPx}px)`,
					opacity: showDither ? 0 : 1,
					transition,
				}}
			/>
			<canvas
				ref={ditherRef}
				aria-hidden="true"
				width={RENDER_SIZE}
				height={RENDER_SIZE}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					opacity: showDither ? 1 : 0,
					transition,
				}}
			/>
		</span>
	);
}
