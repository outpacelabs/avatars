/**
 * Gradient engine for @outpacelabs/avatars.
 *
 * Framework-agnostic mesh-gradient avatar generator. Every seed (string or
 * number) deterministically produces a unique gradient — no stored images,
 * no network. Pure palette/RNG core plus optional Canvas2D render helpers.
 */

export type Harmony =
	| "analogous"
	| "triadic"
	| "splitComplementary"
	| "tetradic"
	| "complementary";

export interface GradientPalette {
	/** The numeric seed the palette was derived from. */
	seed: number;
	/** Hex color stops used to paint the mesh. */
	colors: string[];
	/** Which color-harmony rule produced the hues. */
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

/** Derive the deterministic color palette for a seed. */
export function generatePalette(seed: number | string): GradientPalette {
	const s = toSeed(seed);
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
 * The caller is responsible for any blur — apply `filter: blur(…)` on the
 * displayed canvas (≈6% of the rendered dimension) for the signature look,
 * or use {@link renderGradient} / {@link gradientToDataURL} which bake it in.
 */
export function drawMeshGradient(
	ctx: GradientContext,
	seed: number | string,
	size: number,
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s);
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

/** Dither cells across the avatar — chunky enough to survive downscaling. */
const DITHER_CELLS = 34;

function hexToRgb(hex: string): [number, number, number] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Alpha of a mesh spot at normalized distance `d`, matching the stop ramp in
 * {@link drawMeshGradient} (FF → DD → 88 → 00 at 0 / 0.3 / 0.6 / 1).
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

/**
 * Ordered dither of one color to the palette: find its two nearest palette
 * entries, then pick between them by comparing `threshold` to where the color
 * sits on the segment between them.
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

/**
 * Draw a chunky ordered (Bayer 8×8) dither of the seed's gradient into `ctx` at
 * `size` x `size`. A crisp, retro alternative to {@link drawMeshGradient}: it
 * reconstructs the exact same mesh field (same seed → same spots) and quantizes
 * it to the palette on a coarse grid, so mesh and dither read as the same
 * avatar. Render the canvas with `image-rendering: pixelated`. No blur wanted.
 */
export function drawDither(
	ctx: GradientContext,
	seed: number | string,
	size: number,
): void {
	const s = toSeed(seed);
	const { colors } = generatePalette(s);
	const rgb = colors.map(hexToRgb);
	// Same RNG stream as drawMeshGradient → identical spots and highlight.
	const random = seededRandom(s * 12345);

	const numSpots = 8 + Math.floor(random() * 5);
	const spots: Array<{
		x: number;
		y: number;
		radius: number;
		color: [number, number, number];
	}> = [];
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

	const cell = size / DITHER_CELLS;

	for (let gy = 0; gy < DITHER_CELLS; gy++) {
		for (let gx = 0; gx < DITHER_CELLS; gx++) {
			const px = (gx + 0.5) * cell;
			const py = (gy + 0.5) * cell;

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
			ctx.fillRect(
				Math.floor(gx * cell),
				Math.floor(gy * cell),
				Math.ceil(cell) + 1,
				Math.ceil(cell) + 1,
			);
		}
	}
}

export interface RenderOptions {
	/**
	 * Blur radius in pixels. Defaults to ~6% of the canvas size for the
	 * signature soft look. Pass `0` to disable. Ignored for the dither pattern,
	 * which is always crisp.
	 */
	blur?: number;
	/** Which engine to paint. Default: `"mesh"`. */
	pattern?: Pattern;
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

	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
	if (!ctx) return;

	// The dither is always crisp — no blur bounce.
	if (options.pattern === "dither") {
		ctx.clearRect(0, 0, size, size);
		drawDither(ctx, seed, size);
		return;
	}

	if (blur <= 0) {
		ctx.clearRect(0, 0, size, size);
		drawMeshGradient(ctx, seed, size);
		return;
	}

	// Draw the raw mesh on a scratch canvas, then composite it back with blur
	// scaled up slightly so the soft edges fall outside the frame (no ring).
	const scratch = createCanvas(size, size);
	const sctx = scratch.getContext("2d") as CanvasRenderingContext2D | null;
	if (!sctx) return;
	drawMeshGradient(sctx, seed, size);

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
	const smallCtx = small.getContext("2d") as CanvasRenderingContext2D | null;
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
