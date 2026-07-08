"use client";

import { useEffect, useRef } from "react";
import { drawMeshGradient } from "@/lib/avatars/mesh-gradient";

interface GradientAvatarProps {
	/** Any string or number — each unique seed produces a unique gradient. */
	seed: number | string;
	/** Rendered size in pixels (default: 32). */
	size?: number;
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

/**
 * Renders a deterministic mesh-gradient avatar on a `<canvas>`.
 * The same seed always produces the same gradient.
 */
export function GradientAvatar({
	seed,
	size = 32,
	fill = false,
	className = "",
}: GradientAvatarProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
		drawMeshGradient(ctx, seed, RENDER_SIZE);
	}, [seed]);

	const blurPx = Math.max(1, Math.round(size * BLUR_FRACTION));

	return (
		<span
			className={`inline-block overflow-hidden rounded-full ${className}`}
			style={
				fill ? { width: "100%", height: "100%" } : { width: size, height: size }
			}
		>
			<canvas
				ref={canvasRef}
				role="img"
				aria-label={`Gradient avatar for seed ${seed}`}
				width={RENDER_SIZE}
				height={RENDER_SIZE}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					filter: `blur(${blurPx}px)`,
				}}
			/>
		</span>
	);
}
