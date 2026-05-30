import { drawMeshGradient } from "@outpacelabs/gradient-avatars";
import { useEffect, useRef } from "react";

export interface GradientAvatarProps {
	/** Any string or number — each unique seed produces a unique gradient. */
	seed: number | string;
	/** Rendered size in pixels. Default: 32. */
	size?: number;
	/** Additional CSS classes on the wrapper. */
	className?: string;
}

/** Internal render resolution. Higher than display size so the CSS blur is smooth. */
const RENDER_SIZE = 256;
/** Blur radius as a fraction of display size. */
const BLUR_FRACTION = 0.06;

/**
 * Renders a deterministic mesh-gradient avatar on a `<canvas>`.
 * The same seed always produces the same gradient.
 */
export function GradientAvatar({
	seed,
	size = 32,
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
			className={`inline-block overflow-hidden rounded-full ${className}`.trim()}
			style={{ width: size, height: size }}
		>
			<canvas
				ref={canvasRef}
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

export type {
	ExportOptions,
	GradientPalette,
	Harmony,
	RenderOptions,
} from "@outpacelabs/gradient-avatars";
export {
	drawMeshGradient,
	generatePalette,
	gradientToBlob,
	gradientToDataURL,
	renderGradient,
	seedFromString,
	toSeed,
} from "@outpacelabs/gradient-avatars";
