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

export interface RenderOptions {
	/**
	 * Blur radius in pixels. Defaults to ~6% of the canvas size for the
	 * signature soft look. Pass `0` to disable.
	 */
	blur?: number;
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
	ctx.filter = `blur(${blur}px)`;
	ctx.drawImage(scratch as CanvasImageSource, -offset, -offset, dw, dw);
	ctx.filter = "none";
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
