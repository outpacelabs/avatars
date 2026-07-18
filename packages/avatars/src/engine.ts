/**
 * Gradient engine for @outpacelabs/avatars.
 *
 * Framework-agnostic mesh-gradient avatar generator. Every seed (string or
 * number) deterministically produces a unique gradient, no stored images,
 * no network. Pure palette/RNG core plus optional Canvas2D render helpers.
 */

export type Harmony =
	| "analogous"
	| "triadic"
	| "splitComplementary"
	| "tetradic"
	| "complementary"
	/** Not a harmony rule, the palette came from caller-supplied `colors`. */
	| "custom";

export interface GradientPalette {
	/** The numeric seed the palette was derived from. */
	seed: number;
	/** Hex color stops used to paint the mesh (`#RRGGBB`). */
	colors: string[];
	/** Which color-harmony rule produced the hues (or `"custom"`). */
	harmony: Harmony;
}

export interface PaletteOptions {
	/**
	 * Bring your own colors instead of the seed-derived harmony. Accepts hex
	 * (`#rgb` or `#rrggbb`, `#` optional); invalid entries are dropped, and an
	 * empty/absent list falls back to seed generation. The seed still drives the
	 * layout and rotates the palette, so each seed stays unique but on-brand.
	 */
	colors?: string[];
}

/** Options shared by the Canvas2D renderers. */
export interface DrawOptions extends PaletteOptions {
	/**
	 * Render in the Display P3 wide-gamut color space. On P3-capable screens the
	 * palette reads more vivid; elsewhere the browser maps it back to sRGB.
	 * Requires the target canvas to be a P3 context, the `renderGradient`,
	 * `gradientTo*`, and `<GradientAvatar>` paths set this up for you.
	 */
	p3?: boolean;
}

/** The generated harmonies, everything except caller-supplied `"custom"`. */
type GeneratedHarmony = Exclude<Harmony, "custom">;

const HARMONY_TYPES: GeneratedHarmony[] = [
	"analogous",
	"triadic",
	"splitComplementary",
	"tetradic",
	"complementary",
];

const GOLDEN_ANGLE = 137.5;

/** Default blur radius as a fraction of the rendered dimension. */
export const DEFAULT_BLUR_FRACTION = 0.06;

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

function harmonyHues(baseHue: number, harmony: GeneratedHarmony): number[] {
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
 * Stable string → 32-bit unsigned hash (FNV-1a + bit-mixing avalanche).
 * Uses the full uint32 range as a seed so similar strings diverge fully.
 */
export function seedFromString(input: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	h ^= h >>> 16;
	h = Math.imul(h, 0x7feb352d) >>> 0;
	h ^= h >>> 15;
	h = Math.imul(h, 0x846ca68b) >>> 0;
	h ^= h >>> 16;
	return h >>> 0;
}

/** Normalize a string or number seed to the numeric seed used internally. */
export function toSeed(seed: number | string): number {
	if (typeof seed === "number") return seed;
	return seedFromString(seed);
}

/** `#rgb`/`#rrggbb` (with or without `#`) → `#RRGGBB`, or null if invalid. */
function normalizeHex(color: string): string | null {
	const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
	if (!m) return null;
	let h = m[1];
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	return `#${h.toUpperCase()}`;
}

/** Validate + normalize a caller-supplied palette, or null to fall back. */
function normalizeColors(colors?: string[]): string[] | null {
	if (!colors?.length) return null;
	const out: string[] = [];
	for (const c of colors) {
		const h = normalizeHex(c);
		if (h) out.push(h);
	}
	return out.length ? out : null;
}

/**
 * Derive the deterministic color palette for a seed. Pass `colors` to override
 * the harmony with your own palette (still placed deterministically per seed).
 */
export function generatePalette(
	seed: number | string,
	options: PaletteOptions = {},
): GradientPalette {
	const s = toSeed(seed);
	const custom = normalizeColors(options.colors);
	if (custom) {
		// Rotate the palette by the seed so different seeds emphasize different
		// colors (colors[0] becomes the dominant base fill) while staying on-brand.
		const offset = s % custom.length;
		const colors = custom.map((_, i) => custom[(i + offset) % custom.length]);
		return { seed: s, colors, harmony: "custom" };
	}
	const random = seededRandom(s);
	const baseHue = (s * GOLDEN_ANGLE) % 360;
	const harmonyIndex = Math.floor(random() * HARMONY_TYPES.length);
	const harmony = HARMONY_TYPES[harmonyIndex];
	const hues = harmonyHues(baseHue, harmony);
	const colors = hues.map((hue) => {
		const saturation = 75 + random() * 25;
		const lightness = 50 + random() * 20;
		return hslToHex(hue, saturation, lightness);
	});
	return { seed: s, colors, harmony };
}

/** `#RRGGBB` → [r, g, b] in 0–1. */
function hexToRgb01(hex: string): [number, number, number] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A palette color at `alpha` (0–1) as a canvas fill string. In P3 mode the hex
 * components are emitted as `color(display-p3 …)`, on a P3 canvas this widens
 * into the P3 gamut (more vivid); off P3 it maps back to the same sRGB color.
 * Otherwise it's the familiar 8-digit hex, so the default output is unchanged.
 */
function fill(hex: string, alpha: number, p3: boolean): string {
	if (p3) {
		const [r, g, b] = hexToRgb01(hex);
		const a = alpha >= 1 ? "" : ` / ${alpha}`;
		return `color(display-p3 ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}${a})`;
	}
	const a = Math.round(alpha * 255)
		.toString(16)
		.padStart(2, "0")
		.toUpperCase();
	return `${hex}${a}`;
}

/** Radial-spot falloff alphas, match the original 0xFF/DD/88/00 stops. */
const SPOT_ALPHAS = [1, 221 / 255, 136 / 255, 0];

/**
 * Minimal Canvas2D context surface the renderer needs. Both
 * `HTMLCanvasElement` and `OffscreenCanvas` 2D contexts satisfy it.
 */
export type GradientContext = {
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
 * The caller is responsible for any blur, apply `filter: blur(…)` on the
 * displayed canvas (≈6% of the rendered dimension) for the signature look,
 * or use {@link renderGradient} / {@link gradientToDataURL} which bake it in.
 */
export function drawMeshGradient(
	ctx: GradientContext,
	seed: number | string,
	size: number,
	options: DrawOptions = {},
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s, options);
	const p3 = options.p3 ?? false;
	const random = seededRandom(s * 12345);

	ctx.fillStyle = fill(colors[0], 1, p3);
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
		g.addColorStop(0, fill(spot.color, SPOT_ALPHAS[0], p3));
		g.addColorStop(0.3, fill(spot.color, SPOT_ALPHAS[1], p3));
		g.addColorStop(0.6, fill(spot.color, SPOT_ALPHAS[2], p3));
		g.addColorStop(1, fill(spot.color, SPOT_ALPHAS[3], p3));
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

/** Which engine paints the avatar. */
export type Pattern = "mesh" | "dither";

/* ── dither: ordered (Bayer 8×8) ramp of the palette along a random axis ── */

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

/**
 * Draw an ordered (Bayer 8×8) dither of the seed's palette into `ctx` at
 * `size` x `size`. A crisp, retro alternative to {@link drawMeshGradient} that
 * shares the same deterministic colors, no blur wanted.
 */
export function drawDither(
	ctx: GradientContext,
	seed: number | string,
	size: number,
	options: DrawOptions = {},
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s, options);
	const p3 = options.p3 ?? false;
	const random = seededRandom((s ^ 0x9e3779b9) >>> 0);
	const cell = Math.max(2, Math.round(size / 72));
	const n = Math.ceil(size / cell);

	// Random gradient axis, normalized to 0..1 across the unit square.
	const angle = random() * Math.PI * 2;
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
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
			ctx.fillStyle = fill(colors[ci], 1, p3);
			ctx.fillRect(gx * cell, gy * cell, cell + 1, cell + 1);
		}
	}
}

export interface RenderOptions extends DrawOptions {
	/**
	 * Blur radius in pixels. Defaults to ~6% of the canvas size for the
	 * signature soft look. Pass `0` to disable. Ignored for the dither pattern,
	 * which is always crisp.
	 */
	blur?: number;
	/** Which engine to paint. Default: `"mesh"`. */
	pattern?: Pattern;
}

/** Get a 2D context in the requested color space (P3 when `p3`). */
function get2d(
	canvas: HTMLCanvasElement | OffscreenCanvas,
	p3?: boolean,
): CanvasRenderingContext2D | null {
	return canvas.getContext("2d", {
		colorSpace: p3 ? "display-p3" : "srgb",
	}) as CanvasRenderingContext2D | null;
}

function blurFor(size: number, blur?: number): number {
	if (blur === 0) return 0;
	return blur ?? Math.round(size * DEFAULT_BLUR_FRACTION);
}

/**
 * Render a seed's gradient into an existing canvas, baking in the soft blur.
 * Draws at the canvas's current `width`/`height`. Browser/OffscreenCanvas only.
 */
export function renderGradient(
	canvas: HTMLCanvasElement | OffscreenCanvas,
	seed: number | string,
	options: RenderOptions = {},
): void {
	const size = canvas.width;
	const blur = blurFor(size, options.blur);

	const ctx = get2d(canvas, options.p3);
	if (!ctx) return;

	// The dither is always crisp, no blur bounce.
	if (options.pattern === "dither") {
		ctx.clearRect(0, 0, size, size);
		drawDither(ctx, seed, size, options);
		return;
	}

	if (blur <= 0) {
		ctx.clearRect(0, 0, size, size);
		drawMeshGradient(ctx, seed, size, options);
		return;
	}

	// Draw the raw mesh on a scratch canvas (same color space so the P3 gamut
	// survives the composite), then blur it back scaled up slightly so the soft
	// edges fall outside the frame (no ring).
	const scratch = createCanvas(size, size);
	const sctx = get2d(scratch, options.p3);
	if (!sctx) return;
	drawMeshGradient(sctx, seed, size, options);

	const scaleUp = 1 + (blur / size) * 4;
	const dw = size * scaleUp;
	const offset = (dw - size) / 2;
	ctx.clearRect(0, 0, size, size);
	if (supportsCanvasFilter()) {
		ctx.filter = `blur(${blur}px)`;
		ctx.drawImage(scratch as CanvasImageSource, -offset, -offset, dw, dw);
		ctx.filter = "none";
		return;
	}
	// 2D-canvas `filter` is a silent no-op on Safari < 17: approximate the
	// gaussian by bouncing through a small canvas. Bilinear resampling on the
	// way down and back up smears by roughly the downscale factor, which is
	// plenty for a mesh that is already smooth gradients.
	const factor = Math.max(2, Math.min(16, blur / 2));
	const sw = Math.max(1, Math.round(size / factor));
	const small = createCanvas(sw, sw);
	const smallCtx = get2d(small, options.p3);
	if (!smallCtx) {
		ctx.drawImage(scratch as CanvasImageSource, -offset, -offset, dw, dw);
		return;
	}
	smallCtx.imageSmoothingEnabled = true;
	smallCtx.imageSmoothingQuality = "high";
	smallCtx.drawImage(scratch as CanvasImageSource, 0, 0, sw, sw);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(small as CanvasImageSource, -offset, -offset, dw, dw);
}

/* Engines that honor 2D-canvas `filter` echo an assigned value back from the
 * property; Safari < 17 ignores the assignment. Probed once, then cached. */
let canvasFilterSupport: boolean | null = null;
function supportsCanvasFilter(): boolean {
	if (canvasFilterSupport !== null) return canvasFilterSupport;
	const probe = createCanvas(1, 1).getContext(
		"2d",
	) as CanvasRenderingContext2D | null;
	if (!probe) {
		canvasFilterSupport = false;
		return canvasFilterSupport;
	}
	probe.filter = "blur(1px)";
	canvasFilterSupport = probe.filter === "blur(1px)";
	return canvasFilterSupport;
}

function createCanvas(
	w: number,
	h: number,
): HTMLCanvasElement | OffscreenCanvas {
	if (typeof OffscreenCanvas !== "undefined") {
		return new OffscreenCanvas(w, h);
	}
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return c;
}

export interface ExportOptions extends RenderOptions {
	/** Output pixel dimensions (square). Default: 512. */
	size?: number;
	/** Image MIME type. Default: "image/png". */
	type?: string;
	/** Quality 0–1 for lossy types. Default: 0.92. */
	quality?: number;
}

/** Render a seed's gradient and return it as a data URL. Browser only. */
export function gradientToDataURL(
	seed: number | string,
	options: ExportOptions = {},
): string {
	const { size = 512, type = "image/png", quality = 0.92 } = options;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	renderGradient(canvas, seed, options);
	return canvas.toDataURL(type, quality);
}

/** Render a seed's gradient and resolve a Blob (or null). Browser only. */
export function gradientToBlob(
	seed: number | string,
	options: ExportOptions = {},
): Promise<Blob | null> {
	const { size = 512, type = "image/png", quality = 0.92 } = options;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	renderGradient(canvas, seed, options);
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
