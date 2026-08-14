/**
 * Deformation layer for the mesh-gradient engine.
 *
 * The base mesh is smooth radial flow. `drawDeformed` renders that mesh to an
 * offscreen canvas, then warps it per pixel by displacing the sample
 * coordinates, turning the smooth blobs into liquid streaks, swirls, ripples,
 * folds, and fluted-glass reeds. Everything is deterministic from the seed, so
 * a given seed + settings always renders the same avatar. Browser-only (needs
 * ImageData).
 */

import { drawMeshX, drawStormBase, type OklchColor } from "./colorx";
import { drawMeshGradient, type MeshOptions, toSeed } from "./mesh-gradient";

export type DeformType =
	| "none"
	| "storm"
	| "liquid"
	| "swirl"
	| "twist"
	| "wave"
	| "ripple"
	| "melt"
	| "glass";

export interface DeformMeta {
	id: DeformType;
	label: string;
}

export const DEFORMS: DeformMeta[] = [
	{ id: "none", label: "None" },
	{ id: "storm", label: "Storm" },
	{ id: "liquid", label: "Liquid" },
	{ id: "swirl", label: "Swirl" },
	{ id: "twist", label: "Twist" },
	{ id: "wave", label: "Wave" },
	{ id: "ripple", label: "Ripple" },
	{ id: "melt", label: "Melt" },
	{ id: "glass", label: "Fluted glass" },
];

export interface DeformOptions extends MeshOptions {
	/** Which deformation to apply. Default: `"liquid"`. */
	deform?: DeformType;
	/** Displacement strength, 0 (none) to 1 (extreme). Default: 0.5. */
	amount?: number;
	/** Spatial frequency of the warp field. Higher is busier. Default: 3. */
	scale?: number;
	/** Fractal octaves for the noise-based warps (1 to 6). Default: 4. */
	detail?: number;
	/**
	 * Paint with the extended OKLCH palette (see colorx.ts) instead of the
	 * original hex palette. Same spot layout, wider color range; pair with a
	 * `display-p3` destination canvas for wide gamut.
	 */
	paletteX?: OklchColor[];
}

/* ── deterministic value noise ──────────────────────────────────────────── */

/** Integer-lattice hash to 0..1, seeded so different seeds warp differently. */
function hash2(ix: number, iy: number, seed: number): number {
	let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed) >>> 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Quintic smootherstep, the classic Perlin fade for continuous derivatives. */
function fade(t: number): number {
	return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 2D value noise in 0..1. */
function valueNoise(x: number, y: number, seed: number): number {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = x - ix;
	const fy = y - iy;
	const a = hash2(ix, iy, seed);
	const b = hash2(ix + 1, iy, seed);
	const c = hash2(ix, iy + 1, seed);
	const d = hash2(ix + 1, iy + 1, seed);
	const ux = fade(fx);
	const uy = fade(fy);
	const top = a + (b - a) * ux;
	const bot = c + (d - c) * ux;
	return top + (bot - top) * uy;
}

/** Fractal (summed-octave) value noise in 0..1. */
function fbm(x: number, y: number, seed: number, octaves: number): number {
	let sum = 0;
	let amp = 0.5;
	let freq = 1;
	let norm = 0;
	for (let i = 0; i < octaves; i++) {
		sum += amp * valueNoise(x * freq, y * freq, seed + i * 1013);
		norm += amp;
		amp *= 0.5;
		freq *= 2;
	}
	return sum / norm;
}

/* ── displacement fields ────────────────────────────────────────────────── */

/**
 * For a destination point (u, v) in 0..1, return where to SAMPLE the smooth
 * source (also 0..1). The larger the offset, the more warped the result.
 */
function sampleAt(
	type: DeformType,
	u: number,
	v: number,
	seed: number,
	amount: number,
	scale: number,
	octaves: number,
): [number, number] {
	const dx = u - 0.5;
	const dy = v - 0.5;
	const r = Math.hypot(dx, dy);
	const ang = Math.atan2(dy, dx);

	switch (type) {
		case "none":
			return [u, v];
		case "storm": {
			// Solar storm: the base is already a clean vertical color stack (see
			// drawStormBase), so the deformation only WAVES the interfaces, a
			// low-frequency vertical displacement that undulates across the
			// width, plus a constant gentle tilt. Direction is fixed for every
			// seed; the seed shapes the wave and the palette only.
			// Wave varies across the WIDTH almost exclusively; a vertical
			// dependence would locally compress the stack and print hard crease
			// lines into the soft boundaries.
			const wave =
				(fbm(
					u * scale * 0.4,
					v * scale * 0.04,
					seed + 91,
					Math.min(3, octaves),
				) -
					0.5) *
				amount *
				0.55;
			const tilt = 0.16 * (u - 0.5) * amount;
			return [u, v + wave + tilt];
		}
		case "liquid": {
			// Domain warp: push each point along a fractal noise vector field.
			const wx = fbm(u * scale, v * scale, seed, octaves) - 0.5;
			const wy =
				fbm(u * scale + 5.2, v * scale + 1.3, seed + 777, octaves) - 0.5;
			return [u + amount * wx, v + amount * wy];
		}
		case "swirl": {
			// Rotate around the center, stronger toward the middle.
			const a = ang + amount * 8 * (0.5 - r);
			return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
		}
		case "twist": {
			// Rotate around the center, stronger toward the edge.
			const a = ang + amount * 7 * r;
			return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
		}
		case "wave": {
			// Cross sinusoids, phase offset by the seed noise.
			const p = seed % 1000;
			const sx = Math.sin((v * scale + p) * Math.PI * 2);
			const sy = Math.sin((u * scale + p) * Math.PI * 2);
			return [u + amount * 0.5 * sx, v + amount * 0.5 * sy];
		}
		case "ripple": {
			// Concentric radial displacement, like a pebble in water.
			if (r < 1e-4) return [u, v];
			const off = amount * 0.5 * Math.sin(r * scale * Math.PI * 4);
			return [u + (off * dx) / r, v + (off * dy) / r];
		}
		case "melt": {
			// Mostly vertical drip, a downward noise pull that grows lower down.
			const n = fbm(u * scale, v * scale * 0.5, seed, octaves) - 0.5;
			const nx = fbm(u * scale + 9.1, v * scale, seed + 313, octaves) - 0.5;
			return [u + amount * 0.4 * nx, v + amount * (0.3 * n + 0.5 * v * v)];
		}
		case "glass": {
			// Fluted / reeded glass: the image is seen through vertical reeds,
			// each a cylindrical lens that refracts horizontally. `scale` sets the
			// reed count; each reed samples a slice wider than itself (so it shows
			// a compressed view), and the hard jump at every reed boundary is the
			// ridge between panes. `amount` is the lens strength.
			const flutes = Math.max(2, Math.round(scale * 2.2));
			const p = u * flutes;
			const center = (Math.floor(p) + 0.5) / flutes;
			const local = p - Math.floor(p); // 0..1 across one reed
			const magnify = 1 + amount * 1.8;
			return [center + ((local - 0.5) * magnify) / flutes, v];
		}
	}
}

/* ── render ─────────────────────────────────────────────────────────────── */

function makeCanvas(size: number): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	return c;
}

/** Reflect a coordinate into 0..max-1 so warps that reach past the edge fold
 *  back instead of clamping to a hard band. */
function reflect(i: number, max: number): number {
	const m = max - 1;
	if (m <= 0) return 0;
	let x = i % (2 * m);
	if (x < 0) x += 2 * m;
	return x <= m ? x : 2 * m - x;
}

/** Bilinear sample of the RGB source (normalized u, v) into `out`. */
function sampleSrc(
	src: Uint8ClampedArray,
	size: number,
	u: number,
	v: number,
	out: [number, number, number],
): void {
	const fx = u * size - 0.5;
	const fy = v * size - 0.5;
	const x0 = Math.floor(fx);
	const y0 = Math.floor(fy);
	const tx = fx - x0;
	const ty = fy - y0;
	const x0r = reflect(x0, size);
	const x1r = reflect(x0 + 1, size);
	const y0r = reflect(y0, size);
	const y1r = reflect(y0 + 1, size);
	const i00 = (y0r * size + x0r) * 4;
	const i10 = (y0r * size + x1r) * 4;
	const i01 = (y1r * size + x0r) * 4;
	const i11 = (y1r * size + x1r) * 4;
	const w00 = (1 - tx) * (1 - ty);
	const w10 = tx * (1 - ty);
	const w01 = (1 - tx) * ty;
	const w11 = tx * ty;
	out[0] = src[i00] * w00 + src[i10] * w10 + src[i01] * w01 + src[i11] * w11;
	out[1] =
		src[i00 + 1] * w00 +
		src[i10 + 1] * w10 +
		src[i01 + 1] * w01 +
		src[i11 + 1] * w11;
	out[2] =
		src[i00 + 2] * w00 +
		src[i10 + 2] * w10 +
		src[i01 + 2] * w01 +
		src[i11 + 2] * w11;
}

/**
 * Draw a deformed mesh gradient for `seed` into `ctx` at `size` x `size`.
 * With `deform: "none"` (or amount 0) it is exactly the smooth mesh.
 */
export function drawDeformed(
	ctx: CanvasRenderingContext2D,
	seed: number | string,
	size: number,
	options: DeformOptions = {},
): void {
	const type = options.deform ?? "liquid";
	const amount = options.amount ?? 0.5;
	const scale = options.scale ?? 3;
	const octaves = Math.max(1, Math.min(6, Math.round(options.detail ?? 4)));
	const s = toSeed(seed);

	// Match the destination's color space end-to-end (scratch canvas and both
	// ImageData buffers), so a display-p3 destination keeps its wide gamut
	// through the warp instead of bouncing through sRGB.
	const colorSpace: PredefinedColorSpace =
		ctx.getContextAttributes?.()?.colorSpace ?? "srgb";

	// Render the base onto a scratch canvas. The storm uses its own base, a
	// clean vertical color stack + glow, instead of the blob mesh; everything
	// else deforms the mesh.
	const src = makeCanvas(size);
	const sctx = src.getContext("2d", { colorSpace });
	if (!sctx) return;
	if (options.paletteX && type === "storm") {
		drawStormBase(sctx, seed, size, options.paletteX);
	} else if (options.paletteX) {
		drawMeshX(sctx, seed, size, options.paletteX);
	} else {
		drawMeshGradient(sctx, seed, size, options);
	}

	if (type === "none" || amount <= 0) {
		ctx.clearRect(0, 0, size, size);
		ctx.drawImage(src, 0, 0);
		return;
	}

	const srcData = sctx.getImageData(0, 0, size, size, { colorSpace }).data;
	const out = ctx.createImageData(size, size, { colorSpace });
	const dst = out.data;

	// Fluted glass adds a per-reed sheen on top of the refraction: dark at the
	// seams, brighter at each reed's centre, so the panes read as convex glass.
	const glass = type === "glass";
	const glassFlutes = glass ? Math.max(2, Math.round(scale * 2.2)) : 0;
	const sheen = amount * 0.16;

	const samp: [number, number, number] = [0, 0, 0];
	for (let y = 0; y < size; y++) {
		const v = (y + 0.5) / size;
		for (let x = 0; x < size; x++) {
			const u = (x + 0.5) / size;
			const [su, sv] = sampleAt(type, u, v, s, amount, scale, octaves);
			sampleSrc(srcData, size, su, sv, samp);
			let r = samp[0];
			let g = samp[1];
			let b = samp[2];
			if (glass) {
				const local = u * glassFlutes - Math.floor(u * glassFlutes);
				const shade = 1 - sheen * Math.cos(local * Math.PI * 2);
				r *= shade;
				g *= shade;
				b *= shade;
			}
			const o = (y * size + x) * 4;
			dst[o] = r;
			dst[o + 1] = g;
			dst[o + 2] = b;
			dst[o + 3] = 255;
		}
	}

	ctx.putImageData(out, 0, 0);
}
