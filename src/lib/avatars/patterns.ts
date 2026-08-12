/**
 * Render patterns for the avatar editor.
 *
 * Two engines, both deterministic from the seed and sharing the same
 * harmony-based palette: the original soft mesh gradient, and an ordered
 * (Bayer 8×8) dither of that palette. Site-only for now, the /create editor
 * previews the dither before it ships to the npm package.
 */

import {
	drawMeshGradient,
	generatePalette,
	type MeshOptions,
	toSeed,
} from "./mesh-gradient";

export type Pattern = "mesh" | "dither";

export interface PatternMeta {
	id: Pattern;
	label: string;
	/** Reads best with hard edges, the editor defaults its blur to 0. */
	crisp: boolean;
}

export const PATTERNS: PatternMeta[] = [
	{ id: "mesh", label: "Mesh", crisp: false },
	{ id: "dither", label: "Dither", crisp: true },
];

export type PatternOptions = MeshOptions;

/** Whether a pattern wants hard edges (no soft blur by default). */
export function isCrisp(pattern: Pattern): boolean {
	return pattern === "dither";
}

/**
 * Paint `pattern` for `seed` into `ctx` at `size` × `size`. `mesh` delegates to
 * the shipped engine; `dither` is editor-only for now.
 */
export function drawPattern(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	pattern: Pattern,
	options: PatternOptions = {},
): void {
	if (pattern === "dither") {
		drawDither(ctx, seed, size, options);
		return;
	}
	drawMeshGradient(ctx, seed, size, options);
}

/* ── dither: ordered (Bayer 8×8) ramp of the palette along a fixed axis ── */

/**
 * Every dither ramps along the same axis so the pattern reads as one
 * consistent family. A 45° diagonal (top-left → bottom-right).
 */
const DITHER_ANGLE = Math.PI / 4;

function makeBayer(n: number): number[][] {
	let m: number[][] = [[0]];
	for (let k = 0; k < n; k++) {
		const s = m.length;
		const next: number[][] = Array.from({ length: s * 2 }, () => []);
		for (let y = 0; y < s * 2; y++) {
			for (let x = 0; x < s * 2; x++) {
				const base = m[y % s][x % s] * 4;
				const add = x < s ? (y < s ? 0 : 3) : y < s ? 2 : 1;
				next[y][x] = base + add;
			}
		}
		m = next;
	}
	const max = m.length * m.length;
	return m.map((row) => row.map((v) => (v + 0.5) / max));
}

const BAYER = makeBayer(3); // 8×8, thresholds in (0,1)

function drawDither(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	options: PatternOptions,
): void {
	const { colors } = generatePalette(toSeed(seed), options);
	const cell = Math.max(2, Math.round(size / 72));
	const n = Math.ceil(size / cell);

	// Shared gradient axis, normalized to 0..1 across the unit square, so every
	// dither ramps the same direction.
	const dx = Math.cos(DITHER_ANGLE);
	const dy = Math.sin(DITHER_ANGLE);
	const min = Math.min(0, dx) + Math.min(0, dy);
	const span = Math.abs(dx) + Math.abs(dy) || 1;

	for (let gy = 0; gy < n; gy++) {
		for (let gx = 0; gx < n; gx++) {
			const px = (gx + 0.5) / n;
			const py = (gy + 0.5) / n;
			const v = (px * dx + py * dy - min) / span; // 0..1
			const scaled = v * (colors.length - 1);
			const idx = Math.floor(scaled);
			const frac = scaled - idx;
			const t = BAYER[gy % 8][gx % 8];
			const ci = frac > t ? Math.min(idx + 1, colors.length - 1) : idx;
			ctx.fillStyle = colors[ci];
			ctx.fillRect(gx * cell, gy * cell, cell + 1, cell + 1);
		}
	}
}
