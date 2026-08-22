/**
 * The bridge from the avatar engine to Figma layers.
 *
 * The engine paints through a tiny interface (`GradientContext`): a fill
 * style, `fillRect`, and `createRadialGradient`. It never touches a real
 * canvas. So this module hands it a recorder instead of a canvas and keeps
 * the draw calls. The recorded calls become native Figma nodes.
 *
 * The point is that there is no second copy of the palette or the layout
 * math. A vector avatar in Figma and a canvas avatar on the web come out of
 * the same function, on the same seed, in the same order.
 */

import {
	DEFAULT_BLUR_FRACTION,
	type DrawOptions,
	drawDither,
	drawMeshGradient,
	type GradientContext,
	type Pattern,
} from "../../avatars/src/engine.ts";

/** A color in the 0–1 range Figma paints use. */
export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

/** One gradient stop, `offset` measured from the gradient center. */
export interface Stop {
	offset: number;
	color: Rgba;
}

/** An axis-aligned rectangle, in frame pixels. */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** An axis-aligned rectangle of one flat color, as the engine painted it. */
export interface SolidOp extends Rect {
	kind: "solid";
	color: Rgba;
}

/**
 * Every flat rectangle of one color, gathered into a single layer. A dither
 * therefore lands in Figma as one layer per palette color, not one layer per
 * cell. See {@link packSolids}.
 */
export interface RectsOp {
	kind: "rects";
	color: Rgba;
	rects: Rect[];
}

/**
 * A radial gradient spot. The engine paints these through the whole frame,
 * but every one of them ends at alpha 0 on its outer radius, so a circle of
 * that radius holds the complete shape. That is why an ellipse node is an
 * exact translation and not an approximation.
 */
export interface RadialOp {
	kind: "radial";
	cx: number;
	cy: number;
	radius: number;
	stops: Stop[];
	/** The rectangle the engine painted through, for the caller to check. */
	clip: Rect;
}

/** What the plugin puts on the canvas: one operation, one Figma layer. */
export type Op = RectsOp | RadialOp;

/** What the recorder collects, before the flat rectangles are gathered. */
type RawOp = SolidOp | RadialOp;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Parse the color strings the engine emits: `#RRGGBB`, `#RRGGBBAA`, `#RGB`,
 * and `rgba()`. Display P3 is deliberately absent, see the note on
 * {@link buildPlan}.
 */
export function parseColor(input: string): Rgba {
	const value = input.trim();
	const hex = /^#?([0-9a-f]{3,8})$/i.exec(value);
	if (hex) {
		let h = hex[1];
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		if (h.length === 6) h += "FF";
		if (h.length !== 8) throw new Error(`Bad hex color: ${input}`);
		const n = Number.parseInt(h, 16);
		return {
			r: ((n >>> 24) & 255) / 255,
			g: ((n >>> 16) & 255) / 255,
			b: ((n >>> 8) & 255) / 255,
			a: (n & 255) / 255,
		};
	}
	const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
	if (rgb) {
		const parts = rgb[1]
			.split(/[\s,/]+/)
			.filter(Boolean)
			.map(Number);
		if (parts.length < 3 || parts.some(Number.isNaN)) {
			throw new Error(`Bad rgb color: ${input}`);
		}
		return {
			r: clamp01(parts[0] / 255),
			g: clamp01(parts[1] / 255),
			b: clamp01(parts[2] / 255),
			a: parts.length > 3 ? clamp01(parts[3]) : 1,
		};
	}
	throw new Error(`Unsupported color: ${input}`);
}

/** What `createRadialGradient` hands back to the engine. */
class GradientRecording {
	cx: number;
	cy: number;
	innerRadius: number;
	radius: number;
	stops: Stop[] = [];

	constructor(cx: number, cy: number, innerRadius: number, radius: number) {
		this.cx = cx;
		this.cy = cy;
		this.innerRadius = innerRadius;
		this.radius = radius;
	}

	addColorStop(offset: number, color: string): void {
		// A Figma gradient always starts at the center, so a non-zero inner
		// radius is folded into the stop positions.
		const t =
			this.radius <= 0
				? offset
				: (this.innerRadius + offset * (this.radius - this.innerRadius)) /
					this.radius;
		this.stops.push({ offset: clamp01(t), color: parseColor(color) });
	}
}

/** A `GradientContext` that keeps the draw calls instead of painting them. */
export class Recorder implements GradientContext {
	fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
	globalCompositeOperation: GlobalCompositeOperation = "source-over";
	ops: RawOp[] = [];

	createRadialGradient(
		_x0: number,
		_y0: number,
		r0: number,
		x1: number,
		y1: number,
		r1: number,
	): CanvasGradient {
		return new GradientRecording(x1, y1, r0, r1) as unknown as CanvasGradient;
	}

	fillRect(x: number, y: number, w: number, h: number): void {
		if (w <= 0 || h <= 0) return;
		const style = this.fillStyle;
		if (typeof style === "string") {
			this.ops.push({ kind: "solid", x, y, w, h, color: parseColor(style) });
			return;
		}
		if (style instanceof GradientRecording) {
			if (style.radius <= 0 || style.stops.length === 0) return;
			this.ops.push({
				kind: "radial",
				cx: style.cx,
				cy: style.cy,
				radius: style.radius,
				stops: style.stops,
				clip: { x, y, w, h },
			});
			return;
		}
		throw new Error("Unsupported fill style");
	}
}

const colorKey = (c: Rgba) => `${c.r}:${c.g}:${c.b}:${c.a}`;

/**
 * Join neighboring flat rectangles of the same color.
 *
 * The cells of a dither never overlap, so growing one rectangle over its
 * neighbor to the right, and then over the identical run below it, is
 * lossless. Only runs of consecutive flat rectangles merge, so paint order
 * survives.
 */
export function mergeSolids(ops: RawOp[]): RawOp[] {
	const out: RawOp[] = [];
	let run: SolidOp[] = [];
	const flush = () => {
		if (run.length) out.push(...mergeRun(run));
		run = [];
	};
	for (const op of ops) {
		if (op.kind === "solid") run.push(op);
		else {
			flush();
			out.push(op);
		}
	}
	flush();
	return out;
}

function mergeRun(run: SolidOp[]): SolidOp[] {
	const rows: SolidOp[] = [];
	for (const op of run) {
		const last = rows[rows.length - 1];
		if (
			last &&
			last.y === op.y &&
			last.h === op.h &&
			last.x + last.w === op.x &&
			colorKey(last.color) === colorKey(op.color)
		) {
			last.w += op.w;
			continue;
		}
		rows.push({ ...op });
	}

	const out: SolidOp[] = [];
	const columns = new Map<string, number>();
	for (const op of rows) {
		const key = `${op.x}:${op.w}:${colorKey(op.color)}`;
		const at = columns.get(key);
		if (at !== undefined && out[at].y + out[at].h === op.y) {
			out[at].h += op.h;
			continue;
		}
		columns.set(key, out.length);
		out.push(op);
	}
	return out;
}

/**
 * Gather the flat rectangles into one operation per color.
 *
 * A dither at full detail is 64 x 64 cells. Merging neighbors takes that to
 * about two thousand rectangles, which is still a file nobody wants to open.
 * But a Figma vector layer holds any number of separate sub-paths, so all the
 * cells of one color fit in one layer. The result is two to four layers for a
 * whole dither, each one still crisp, still editable, and easy to recolor.
 *
 * Rectangles of different colors are only reordered inside a run of flat
 * fills, and inside such a run the engine never paints one over another.
 */
export function packSolids(ops: RawOp[]): Op[] {
	const out: Op[] = [];
	let run: SolidOp[] = [];
	const flush = () => {
		const groups = new Map<string, RectsOp>();
		for (const op of run) {
			const key = colorKey(op.color);
			let group = groups.get(key);
			if (!group) {
				group = { kind: "rects", color: op.color, rects: [] };
				groups.set(key, group);
				out.push(group);
			}
			group.rects.push({ x: op.x, y: op.y, w: op.w, h: op.h });
		}
		run = [];
	};
	for (const op of ops) {
		if (op.kind === "solid") run.push(op);
		else {
			flush();
			out.push(op);
		}
	}
	flush();
	return out;
}

/** Move and scale every operation about the frame origin. */
export function transformOps(ops: Op[], scale: number, offset: number): Op[] {
	const at = (n: number) => n * scale + offset;
	const rect = (r: Rect): Rect => ({
		x: at(r.x),
		y: at(r.y),
		w: r.w * scale,
		h: r.h * scale,
	});
	return ops.map((op) =>
		op.kind === "rects"
			? { ...op, rects: op.rects.map(rect) }
			: {
					...op,
					cx: at(op.cx),
					cy: at(op.cy),
					radius: op.radius * scale,
					clip: rect(op.clip),
				},
	);
}

export interface AvatarSpec {
	seed: string;
	pattern: Pattern;
	/** Frame size in Figma pixels. Drives the geometry and the detail level. */
	size: number;
	/** Your own palette instead of the seed's harmony. */
	colors?: string[];
	/** Blur radius in pixels. Left out, the engine default applies. */
	blur?: number;
}

export interface AvatarPlan {
	ops: Op[];
	size: number;
	blur: number;
}

/** The blur the engine uses: 6% of the frame for a mesh, none for a dither. */
export function defaultBlur(pattern: Pattern, size: number): number {
	return pattern === "dither" ? 0 : Math.round(size * DEFAULT_BLUR_FRACTION);
}

/**
 * Record one avatar as a list of Figma-ready operations.
 *
 * No Display P3 here. The engine can paint P3, but the Figma plugin API has
 * no wide-gamut paint, so the plugin does not offer the option at all rather
 * than quietly dropping it back to sRGB.
 */
export function buildPlan(spec: AvatarSpec): AvatarPlan {
	const size = Math.max(1, Math.round(spec.size));
	const blur = Math.max(0, spec.blur ?? defaultBlur(spec.pattern, size));
	const recorder = new Recorder();
	const options: DrawOptions = { colors: spec.colors, displaySize: size };
	if (spec.pattern === "dither") {
		drawDither(recorder, spec.seed, size, options);
	} else {
		drawMeshGradient(recorder, spec.seed, size, options);
	}

	let ops = packSolids(mergeSolids(recorder.ops));
	if (blur > 0) {
		// The engine blurs the mesh and draws it back a little enlarged, so the
		// soft edge falls outside the frame and leaves no ring. Same formula.
		const scale = 1 + (blur / size) * 4;
		ops = transformOps(ops, scale, -((size * scale - size) / 2));
	}
	return { ops, size, blur };
}
