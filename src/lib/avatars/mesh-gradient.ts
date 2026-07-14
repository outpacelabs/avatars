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

export function seededRandom(seed: number): () => number {
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
	 * Site-only for now — powers the /create editor's harmony control; ships
	 * to the npm package once the prop set is settled.
	 */
	harmony?: Harmony;
}

export function generatePalette(
	seed: number | string,
	options: MeshOptions = {},
): GradientPalette {
	const s = toSeed(seed);
	const random = seededRandom(s);
	const baseHue = (s * GOLDEN_ANGLE) % 360;
	// Consume the harmony roll even when overridden so the per-color rolls
	// below stay identical — overriding with the seed's natural harmony must
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
	const random = seededRandom(s * 12345);

	ctx.fillStyle = colors[0];
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
			color: colors[i % colors.length],
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
