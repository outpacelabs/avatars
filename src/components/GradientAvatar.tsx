"use client";

import { useLayoutEffect, useRef } from "react";
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
const FADE_MS = 240;

/**
 * Renders a deterministic mesh-gradient avatar on a `<canvas>`.
 * The same seed always produces the same gradient.
 *
 * Exactly ONE live canvas per avatar. Browsers accelerate a limited number of
 * canvases, and a wall of avatars holding two apiece (the old crossfade's
 * standing double buffer) blew that budget — canvas work then intermittently
 * fell back to software, which is what made copy/export feel slow. The
 * pattern crossfade instead uses a transient overlay: snapshot the old look,
 * redraw the single canvas, fade the snapshot out, then free its buffer.
 */
export function GradientAvatar({
	seed,
	size = 32,
	pattern = "mesh",
	fill = false,
	className = "",
}: GradientAvatarProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const overlayRef = useRef<HTMLCanvasElement>(null);
	const shownRef = useRef<{ seed: number | string; pattern: Pattern } | null>(
		null,
	);
	const cleanupTimer = useRef(0);
	const reducedMotion = usePrefersReducedMotion();

	const blurPx = Math.max(1, Math.round(size * BLUR_FRACTION));
	const meshBlur = `blur(${blurPx}px)`;

	// Layout effect: the canvas pixels and its CSS filter must swap in the
	// same paint, or a mesh frame would flash unblurred (and vice versa).
	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const prev = shownRef.current;
		const patternFlip =
			prev !== null && prev.pattern !== pattern && prev.seed === seed;

		// Crossfade: freeze the old look in the overlay and fade it out over
		// the freshly drawn canvas, then zero the overlay's buffer.
		const overlay = overlayRef.current;
		if (patternFlip && !reducedMotion && overlay) {
			const octx = overlay.getContext("2d");
			if (octx) {
				overlay.width = RENDER_SIZE;
				overlay.height = RENDER_SIZE;
				octx.drawImage(canvas, 0, 0);
				// The snapshot copies raw pixels; the old pattern's blur lives
				// in CSS, so carry it over explicitly.
				overlay.style.filter = prev.pattern === "mesh" ? meshBlur : "none";
				overlay.style.transition = "none";
				overlay.style.opacity = "1";
				overlay.style.display = "block";
				requestAnimationFrame(() => {
					overlay.style.transition = `opacity ${FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
					overlay.style.opacity = "0";
				});
				window.clearTimeout(cleanupTimer.current);
				cleanupTimer.current = window.setTimeout(() => {
					overlay.style.display = "none";
					overlay.width = 0;
					overlay.height = 0;
				}, FADE_MS + 60);
			}
		}

		ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
		drawPattern(ctx, seed, RENDER_SIZE, pattern);
		shownRef.current = { seed, pattern };
	}, [seed, pattern, reducedMotion, meshBlur]);

	useLayoutEffect(() => () => window.clearTimeout(cleanupTimer.current), []);

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
				ref={canvasRef}
				width={RENDER_SIZE}
				height={RENDER_SIZE}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					filter: pattern === "mesh" ? meshBlur : undefined,
				}}
			/>
			{/* Transient crossfade snapshot — 0×0 and display:none at rest. */}
			<canvas
				ref={overlayRef}
				width={0}
				height={0}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					display: "none",
					pointerEvents: "none",
				}}
			/>
		</span>
	);
}
