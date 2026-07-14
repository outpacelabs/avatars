/**
 * Render patterns for the avatar editor.
 *
 * Two engines, both deterministic from the seed and sharing the same
 * harmony-based palette: the original soft mesh gradient, and an ordered
 * (Bayer 8×8) dither *of that same gradient*. The dither reconstructs the exact
 * mesh field (same seed → same spots) and quantizes it to the palette, so the
 * two patterns read as the same avatar — one smooth, one dithered.
 */

import {
	drawMeshGradient,
	generatePalette,
	type MeshOptions,
	seededRandom,
	toSeed,
} from "./mesh-gradient";

export type Pattern = "mesh" | "dither";

export interface PatternMeta {
	id: Pattern;
	label: string;
	/** Reads best with hard edges — the editor defaults its blur to 0. */
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

/* ── dither: reconstruct the mesh field, then ordered-dither it to the palette ── */

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

function hexToRgb(hex: string): [number, number, number] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Alpha of a mesh spot at normalized distance `d`, matching the stop ramp in
 * `drawMeshGradient` (FF → DD → 88 → 00 at 0 / 0.3 / 0.6 / 1).
 */
function spotAlpha(d: number): number {
	if (d <= 0) return 1;
	if (d >= 1) return 0;
	const DD = 221 / 255;
	const EE = 136 / 255;
	if (d < 0.3) return 1 + (DD - 1) * (d / 0.3);
	if (d < 0.6) return DD + (EE - DD) * ((d - 0.3) / 0.3);
	return EE * (1 - (d - 0.6) / 0.4);
}

interface Spot {
	x: number;
	y: number;
	radius: number;
	color: [number, number, number];
}

function drawDither(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	options: PatternOptions,
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s, options);
	const rgb = colors.map(hexToRgb);
	// Same RNG stream as drawMeshGradient → the exact same spots and highlight,
	// so the dither is that gradient, quantized.
	const random = seededRandom(s * 12345);

	const numSpots = 8 + Math.floor(random() * 5);
	const spots: Spot[] = [];
	for (let i = 0; i < numSpots; i++) {
		const angle = random() * Math.PI * 2;
		const distance = random() * size * 0.4;
		const cx = size / 2 + Math.cos(angle) * distance;
		const cy = size / 2 + Math.sin(angle) * distance;
		spots.push({
			x: cx + (random() - 0.5) * size * 0.3,
			y: cy + (random() - 0.5) * size * 0.3,
			radius: size * (0.3 + random() * 0.4),
			color: rgb[i % rgb.length],
		});
	}
	spots.sort((a, b) => b.radius - a.radius);
	const hx = size * 0.3 + random() * size * 0.2;
	const hy = size * 0.3 + random() * size * 0.2;
	const hr = size * 0.3;
	const [br, bg, bb] = rgb[0];

	const cell = Math.max(2, Math.round(size / 80));
	const n = Math.ceil(size / cell);

	for (let gy = 0; gy < n; gy++) {
		for (let gx = 0; gx < n; gx++) {
			const px = (gx + 0.5) * cell;
			const py = (gy + 0.5) * cell;

			// Composite the mesh field at this point (source-over, largest first).
			let r = br;
			let g = bg;
			let b = bb;
			for (const sp of spots) {
				const dx = px - sp.x;
				const dy = py - sp.y;
				const d = Math.sqrt(dx * dx + dy * dy) / sp.radius;
				if (d >= 1) continue;
				const a = spotAlpha(d);
				r = r * (1 - a) + sp.color[0] * a;
				g = g * (1 - a) + sp.color[1] * a;
				b = b * (1 - a) + sp.color[2] * a;
			}
			const dhx = px - hx;
			const dhy = py - hy;
			const dh = Math.sqrt(dhx * dhx + dhy * dhy) / hr;
			if (dh < 1) {
				const a = 0.15 * (1 - dh);
				r = r * (1 - a) + 255 * a;
				g = g * (1 - a) + 255 * a;
				b = b * (1 - a) + 255 * a;
			}

			ctx.fillStyle = colors[ditherIndex(r, g, b, rgb, BAYER[gy % 8][gx % 8])];
			ctx.fillRect(gx * cell, gy * cell, cell + 1, cell + 1);
		}
	}
}

/**
 * Ordered dither of one color to the palette: find its two nearest palette
 * entries, then pick between them by comparing the Bayer threshold to where the
 * color sits on the segment between them. Solid where the field lands on a
 * palette color, cross-hatched in the blends between them.
 */
function ditherIndex(
	r: number,
	g: number,
	b: number,
	rgb: [number, number, number][],
	threshold: number,
): number {
	let i0 = 0;
	let i1 = 0;
	let d0 = Infinity;
	let d1 = Infinity;
	for (let c = 0; c < rgb.length; c++) {
		const dr = r - rgb[c][0];
		const dg = g - rgb[c][1];
		const db = b - rgb[c][2];
		const dd = dr * dr + dg * dg + db * db;
		if (dd < d0) {
			d1 = d0;
			i1 = i0;
			d0 = dd;
			i0 = c;
		} else if (dd < d1) {
			d1 = dd;
			i1 = c;
		}
	}
	const c0 = rgb[i0];
	const c1 = rgb[i1];
	const ex = c1[0] - c0[0];
	const ey = c1[1] - c0[1];
	const ez = c1[2] - c0[2];
	const len2 = ex * ex + ey * ey + ez * ez || 1;
	let t = ((r - c0[0]) * ex + (g - c0[1]) * ey + (b - c0[2]) * ez) / len2;
	if (t < 0) t = 0;
	else if (t > 1) t = 1;
	return t > threshold ? i1 : i0;
}
