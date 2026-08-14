/**
 * Extended color engine for the playground, kept fully separate so the
 * original mesh-gradient engine stays frozen.
 *
 * Colors are generated in OKLCH, the perceptually uniform space: equal
 * lightness/chroma steps look equally different across hues (HSL's L50 yellow
 * glows while its L50 blue is dark; OKLCH fixes that). Colors are emitted as
 * CSS `oklch()` strings, so on a Display P3 canvas high-chroma entries reach
 * into the wide gamut instead of clipping at sRGB.
 *
 * `drawMeshX` replicates the original engine's spot layout (same RNG stream),
 * so deformations behave identically, only the paint differs.
 */

import { type Harmony, toSeed } from "./mesh-gradient";

export interface OklchColor {
	/** Lightness 0..1 */
	l: number;
	/** Chroma 0..~0.37 (values past ~0.25 need P3 to show fully) */
	c: number;
	/** Hue in degrees */
	h: number;
}

/* ── moods: lightness/chroma worlds (perceptual, so they hold per hue) ──── */

export type MoodX = "vivid" | "pastel" | "muted" | "deep" | "neon" | "mono";

export const MOODS_X: { id: MoodX; label: string }[] = [
	{ id: "vivid", label: "Vivid" },
	{ id: "pastel", label: "Pastel" },
	{ id: "muted", label: "Muted" },
	{ id: "deep", label: "Deep" },
	{ id: "neon", label: "Neon" },
	{ id: "mono", label: "Mono" },
];

const MOOD_SPECS: Record<MoodX, { l: [number, number]; c: [number, number] }> =
	{
		vivid: { l: [0.66, 0.78], c: [0.17, 0.25] },
		pastel: { l: [0.87, 0.94], c: [0.045, 0.09] },
		muted: { l: [0.62, 0.74], c: [0.04, 0.09] },
		deep: { l: [0.38, 0.52], c: [0.1, 0.17] },
		// Chroma past sRGB's reach on purpose: pops on P3, gamut-maps elsewhere.
		neon: { l: [0.7, 0.8], c: [0.28, 0.37] },
		mono: { l: [0.35, 0.9], c: [0.1, 0.16] },
	};

/* ── hue ranges: constrain the wheel to a themed window ─────────────────── */

export type HueRange =
	| "full"
	| "warm"
	| "cool"
	| "ocean"
	| "sunset"
	| "forest"
	| "berry";

export const HUE_RANGES: { id: HueRange; label: string }[] = [
	{ id: "full", label: "Full" },
	{ id: "warm", label: "Warm" },
	{ id: "cool", label: "Cool" },
	{ id: "ocean", label: "Ocean" },
	{ id: "sunset", label: "Sunset" },
	{ id: "forest", label: "Forest" },
	{ id: "berry", label: "Berry" },
];

/** OKLCH hue centers/widths (OKLCH hue ≠ HSL hue; 25≈red, 90≈yellow,
 *  145≈green, 230≈blue, 320≈magenta). */
const RANGE_SPECS: Record<
	Exclude<HueRange, "full">,
	{ center: number; width: number }
> = {
	warm: { center: 55, width: 90 },
	cool: { center: 250, width: 120 },
	ocean: { center: 220, width: 70 },
	sunset: { center: 30, width: 85 },
	forest: { center: 140, width: 75 },
	berry: { center: 340, width: 75 },
};

/* ── deterministic generation (mirrors the original engine's streams) ───── */

const HARMONY_TYPES: Harmony[] = [
	"analogous",
	"triadic",
	"splitComplementary",
	"tetradic",
	"complementary",
];

const HARMONY_OFFSETS: Record<Harmony, number[]> = {
	analogous: [0, 30, 60, -30],
	triadic: [0, 120, 240],
	splitComplementary: [0, 150, 210],
	tetradic: [0, 90, 180, 270],
	complementary: [0, 180, 20, 200],
};

const GOLDEN_ANGLE = 137.5;

function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s += 0x6d2b79f5;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function wrapHue(h: number): number {
	return ((h % 360) + 360) % 360;
}

export interface PaletteXOptions {
	harmony?: Harmony;
	mood?: MoodX;
	hueRange?: HueRange;
}

/** Deterministic OKLCH palette for a seed: mood x hue-range x harmony. */
export function generatePaletteX(
	seed: number | string,
	options: PaletteXOptions = {},
): OklchColor[] {
	const s = toSeed(seed);
	const random = seededRandom(s);
	const baseHue = (s * GOLDEN_ANGLE) % 360;
	const harmonyIndex = Math.floor(random() * HARMONY_TYPES.length);
	const harmony = options.harmony ?? HARMONY_TYPES[harmonyIndex];
	const mood = options.mood ?? "vivid";
	const hueRange = options.hueRange ?? "full";
	const spec = MOOD_SPECS[mood];
	const offsets = HARMONY_OFFSETS[harmony];

	let hues: number[];
	if (hueRange === "full") {
		hues = offsets.map((o) => baseHue + o);
	} else {
		// Place the seed inside the themed window, then compress the harmony's
		// spread to fit: offsets span ±180°, mapped onto the window's width.
		const { center, width } = RANGE_SPECS[hueRange];
		const basePos = (baseHue / 360 - 0.5) * width * 0.5;
		hues = offsets.map((o) => {
			const spread = ((((o + 180) % 360) - 180) / 180) * (width / 2);
			return center + basePos + spread;
		});
	}
	// Mono: one hue, spread over a lightness ramp below.
	if (mood === "mono") {
		const h0 = hues[0];
		hues = hues.map((_, i) => h0 + (i - (hues.length - 1) / 2) * 8);
	}

	return hues.map((hue, i) => {
		const lr = random();
		const cr = random();
		const l =
			mood === "mono"
				? spec.l[0] +
					(i / Math.max(1, hues.length - 1)) *
						(spec.l[1] - spec.l[0]) *
						(0.85 + lr * 0.15)
				: spec.l[0] + lr * (spec.l[1] - spec.l[0]);
		const c = spec.c[0] + cr * (spec.c[1] - spec.c[0]);
		return { l, c, h: wrapHue(hue) };
	});
}

/** An OKLCH color as a CSS color string (canvas-compatible). */
export function oklchCss(col: OklchColor, alpha = 1): string {
	const base = `${col.l.toFixed(4)} ${col.c.toFixed(4)} ${col.h.toFixed(2)}`;
	return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${alpha.toFixed(4)})`;
}

/* ── solar-storm base: a clean vertical color stack + a warm glow ────────
 * The reference look is NOT a warped blob mesh: it is 2-4 broad color
 * regions stacked top to bottom with soft wide blends, plus an inner glow
 * low in the frame. The deformer then only has to wave the interfaces. */

export function drawStormBase(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	palette: OklchColor[],
): void {
	const s = toSeed(seed);
	const random = seededRandom((s ^ 0x570a2) >>> 0);

	// Stack at most three colors, the reference reads as 2-3 broad regions;
	// a fourth palette color can come back as the glow accent below. Interior
	// stops get only gentle jitter so every blend stays wide and soft.
	const stack = palette.slice(0, Math.min(3, palette.length));
	const n = stack.length;
	const g = ctx.createLinearGradient(0, 0, 0, size);
	for (let i = 0; i < n; i++) {
		let pos: number;
		if (i === 0) pos = 0;
		else if (i === n - 1) pos = 1;
		else {
			const center = i / (n - 1);
			pos = center + (random() - 0.5) * 0.14;
		}
		g.addColorStop(Math.min(1, Math.max(0, pos)), oklchCss(stack[i]));
	}
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, size, size);

	// The glow: a brightened palette color blooming from the lower half,
	// like the lit core of the reference circles.
	const pick = palette[Math.floor(random() * palette.length) % palette.length];
	const glow: OklchColor = {
		l: Math.min(0.97, pick.l + 0.14),
		c: Math.min(0.37, pick.c * 1.15),
		h: pick.h,
	};
	const gx = size * (0.25 + random() * 0.5);
	const gy = size * (0.6 + random() * 0.28);
	const gr = size * (0.38 + random() * 0.22);
	const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
	rg.addColorStop(0, oklchCss(glow, 0.9));
	rg.addColorStop(0.55, oklchCss(glow, 0.45));
	rg.addColorStop(1, oklchCss(glow, 0));
	ctx.fillStyle = rg;
	ctx.fillRect(0, 0, size, size);
}

/* ── mesh painter (identical layout to the original, OKLCH paint) ───────── */

/** The original radial-spot alpha stops (0xFF, 0xDD, 0x88, 0x00). */
const STOP_ALPHAS = [1, 221 / 255, 136 / 255, 0];

/**
 * Paint the mesh with an OKLCH palette. Spot positions/radii use the exact
 * RNG stream of the original `drawMeshGradient`, so a given seed has the same
 * composition in both engines; only the color space differs.
 */
export function drawMeshX(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	palette: OklchColor[],
): void {
	const s = toSeed(seed);
	const random = seededRandom(s * 12345);

	ctx.fillStyle = oklchCss(palette[0]);
	ctx.fillRect(0, 0, size, size);

	const numSpots = 8 + Math.floor(random() * 5);
	const spots: Array<{
		x: number;
		y: number;
		radius: number;
		col: OklchColor;
	}> = [];

	for (let i = 0; i < numSpots; i++) {
		const angle = random() * Math.PI * 2;
		const distance = random() * size * 0.4;
		const centerX = size / 2 + Math.cos(angle) * distance;
		const centerY = size / 2 + Math.sin(angle) * distance;
		spots.push({
			x: centerX + (random() - 0.5) * size * 0.3,
			y: centerY + (random() - 0.5) * size * 0.3,
			radius: size * (0.3 + random() * 0.4),
			col: palette[i % palette.length],
		});
	}

	spots.sort((a, b) => b.radius - a.radius);

	ctx.globalCompositeOperation = "source-over";
	for (const spot of spots) {
		const g = ctx.createRadialGradient(
			spot.x,
			spot.y,
			0,
			spot.x,
			spot.y,
			spot.radius,
		);
		g.addColorStop(0, oklchCss(spot.col, STOP_ALPHAS[0]));
		g.addColorStop(0.3, oklchCss(spot.col, STOP_ALPHAS[1]));
		g.addColorStop(0.6, oklchCss(spot.col, STOP_ALPHAS[2]));
		g.addColorStop(1, oklchCss(spot.col, STOP_ALPHAS[3]));
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}

	const hx = size * 0.3 + random() * size * 0.2;
	const hy = size * 0.3 + random() * size * 0.2;
	const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, size * 0.3);
	hg.addColorStop(0, "rgba(255,255,255,0.15)");
	hg.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = hg;
	ctx.fillRect(0, 0, size, size);
}
