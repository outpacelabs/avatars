/**
 * Mesh Gradient Algorithm
 *
 * Pure, framework-agnostic palette generator + Canvas2D renderer.
 * Every seed produces a unique gradient. Seeds can be `number` or `string`
 * (strings are hashed to a full uint32 via FNV-1a + bit-mixing avalanche).
 */

export type Harmony =
	| "analogous"
	| "triadic"
	| "splitComplementary"
	| "tetradic"
	| "complementary";

export interface GradientPalette {
	seed: number;
	colors: string[];
	harmony: Harmony;
}

const HARMONY_TYPES: Harmony[] = [
	"analogous",
	"triadic",
	"splitComplementary",
	"tetradic",
	"complementary",
];

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

function hslToHex(h: number, s: number, l: number): string {
	h = ((h % 360) + 360) % 360;
	s = Math.max(0, Math.min(100, s)) / 100;
	l = Math.max(0, Math.min(100, l)) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;
	if (h < 60) {
		r = c;
		g = x;
	} else if (h < 120) {
		r = x;
		g = c;
	} else if (h < 180) {
		g = c;
		b = x;
	} else if (h < 240) {
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}

	const toHex = (n: number) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function harmonyHues(baseHue: number, harmony: Harmony): number[] {
	switch (harmony) {
		case "analogous":
			return [baseHue, baseHue + 30, baseHue + 60, baseHue - 30];
		case "triadic":
			return [baseHue, baseHue + 120, baseHue + 240];
		case "splitComplementary":
			return [baseHue, baseHue + 150, baseHue + 210];
		case "tetradic":
			return [baseHue, baseHue + 90, baseHue + 180, baseHue + 270];
		case "complementary":
			return [baseHue, baseHue + 180, baseHue + 20, baseHue + 200];
	}
}

/**
 * Stable string → 32-bit unsigned hash (FNV-ish + bit mixing).
 * Distinct from `hashString` in `utils/colors` because we want the full
 * uint32 range as a seed, not a bucket index.
 */
export function seedFromString(input: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	// Extra avalanche so similar strings diverge fully.
	h ^= h >>> 16;
	h = Math.imul(h, 0x7feb352d) >>> 0;
	h ^= h >>> 15;
	h = Math.imul(h, 0x846ca68b) >>> 0;
	h ^= h >>> 16;
	return h >>> 0;
}

export function toSeed(seed: number | string): number {
	if (typeof seed === "number") return seed;
	return seedFromString(seed);
}

export interface MeshOptions {
	/**
	 * Force a specific color-harmony rule instead of the seed-derived one.
	 * Site-only for now, powers the /create editor's harmony control; ships
	 * to the npm package once the prop set is settled.
	 */
	harmony?: Harmony;
	/**
	 * The size the avatar is shown at on screen, in CSS pixels. Drives the
	 * level of detail (see {@link detailFor}). Defaults to the `size` the
	 * renderer draws at, so set it whenever the render resolution is higher
	 * than the display size, e.g. drawing at 256 px for a 32 px avatar.
	 */
	displaySize?: number;
}

/* ── level of detail: complexity follows the display size ── */

/**
 * Both engines packed the same amount of detail into every avatar, which is
 * right at 160 px and wrong at 24 px: four hues and a dozen soft spots average
 * out into one muddy blob, and dither cells below a screen pixel shimmer. So
 * the complexity ramps with the size the avatar is shown at. Same seed, same
 * palette order, same layout, just fewer and bigger parts when small.
 *
 * Mirrors the shipped engine (`packages/avatars/src/engine.ts`), keep both in
 * step: the site and the package must draw the same avatar.
 */

/** At or below this display size (CSS px), draw the simplest version. */
const DETAIL_MIN_SIZE = 16;
/** At or above this display size (CSS px), draw the full complexity. */
const DETAIL_FULL_SIZE = 160;
/** Colors a simplified avatar keeps, the start of the seed's palette. */
const MIN_COLORS = 2;
/** Mesh spots a simplified avatar keeps, the largest ones. */
const MIN_SPOTS = 4;
/** How far the kept spots move toward the center at the smallest size. */
const CENTER_PULL = 0.15;
/** How much the kept spots grow at the smallest size. */
const RADIUS_BOOST = 0.2;

/**
 * How much complexity a display size can carry, 0 (tiny) to 1 (large).
 * The ramp is logarithmic because what the eye reads is the doubling of the
 * size, not the pixel count.
 */
export function detailFor(displaySize: number): number {
	if (!(displaySize > 0)) return 1;
	const t =
		Math.log2(displaySize / DETAIL_MIN_SIZE) /
		Math.log2(DETAIL_FULL_SIZE / DETAIL_MIN_SIZE);
	return Math.max(0, Math.min(1, t));
}

/**
 * The palette trimmed to the number of colors `detail` can carry. The kept
 * colors are the first ones, so a small avatar is the same avatar with its
 * later accent hues dropped, not a different one.
 */
export function paletteForDetail(colors: string[], detail: number): string[] {
	if (colors.length <= MIN_COLORS) return colors;
	const n = Math.round(MIN_COLORS + detail * (colors.length - MIN_COLORS));
	return colors.slice(0, Math.max(MIN_COLORS, Math.min(colors.length, n)));
}

export function generatePalette(
	seed: number | string,
	options: MeshOptions = {},
): GradientPalette {
	const s = toSeed(seed);
	const random = seededRandom(s);
	const baseHue = (s * GOLDEN_ANGLE) % 360;
	// Consume the harmony roll even when overridden so the per-color rolls
	// below stay identical, overriding with the seed's natural harmony must
	// produce exactly the default palette.
	const harmonyIndex = Math.floor(random() * HARMONY_TYPES.length);
	const harmony = options.harmony ?? HARMONY_TYPES[harmonyIndex];
	const hues = harmonyHues(baseHue, harmony);
	const colors = hues.map((hue) => {
		const saturation = 75 + random() * 25;
		const lightness = 50 + random() * 20;
		return hslToHex(hue, saturation, lightness);
	});
	return { seed: s, colors, harmony };
}

/**
 * Minimal Canvas2D context surface the renderer needs. Both
 * `HTMLCanvasElement` and `OffscreenCanvas` 2D contexts satisfy it.
 */
type Ctx = {
	fillStyle: string | CanvasGradient | CanvasPattern;
	globalCompositeOperation: GlobalCompositeOperation;
	fillRect(x: number, y: number, w: number, h: number): void;
	createRadialGradient(
		x0: number,
		y0: number,
		r0: number,
		x1: number,
		y1: number,
		r1: number,
	): CanvasGradient;
};

/**
 * Draw the mesh gradient for `seed` into `ctx` at `size` x `size`.
 * Caller is responsible for blur (apply `filter: blur(…)` via CSS on the
 * displayed canvas, sized to ~6% of the rendered dimension for parity with
 * the baked images).
 */
export function drawMeshGradient(
	ctx: Ctx,
	seed: number | string,
	size: number,
	options: MeshOptions = {},
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s, options);
	const detail = detailFor(options.displaySize ?? size);
	const palette = paletteForDetail(colors, detail);
	const random = seededRandom(s * 12345);

	ctx.fillStyle = palette[0];
	ctx.fillRect(0, 0, size, size);

	const numSpots = 8 + Math.floor(random() * 5);
	const spots: Array<{ x: number; y: number; radius: number; color: string }> =
		[];

	for (let i = 0; i < numSpots; i++) {
		const angle = random() * Math.PI * 2;
		const distance = random() * size * 0.4;
		const centerX = size / 2 + Math.cos(angle) * distance;
		const centerY = size / 2 + Math.sin(angle) * distance;
		spots.push({
			x: centerX + (random() - 0.5) * size * 0.3,
			y: centerY + (random() - 0.5) * size * 0.3,
			radius: size * (0.3 + random() * 0.4),
			color: palette[i % palette.length],
		});
	}

	spots.sort((a, b) => b.radius - a.radius);

	// Level of detail. The spots are already sorted largest first, so a small
	// avatar keeps the shapes that carry the composition and drops the fine
	// ones. The survivors then grow and pull toward the center, which fills
	// the frame the dropped spots used to cover.
	const keep = Math.max(
		MIN_SPOTS,
		Math.round(MIN_SPOTS + detail * (numSpots - MIN_SPOTS)),
	);
	const spread = 1 - (1 - detail) * CENTER_PULL;
	const grow = 1 + (1 - detail) * RADIUS_BOOST;
	const mid = size / 2;

	ctx.globalCompositeOperation = "source-over";
	for (const raw of spots.slice(0, keep)) {
		const spot = {
			x: mid + (raw.x - mid) * spread,
			y: mid + (raw.y - mid) * spread,
			radius: raw.radius * grow,
			color: raw.color,
		};
		const g = ctx.createRadialGradient(
			spot.x,
			spot.y,
			0,
			spot.x,
			spot.y,
			spot.radius,
		);
		g.addColorStop(0, `${spot.color}FF`);
		g.addColorStop(0.3, `${spot.color}DD`);
		g.addColorStop(0.6, `${spot.color}88`);
		g.addColorStop(1, `${spot.color}00`);
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
