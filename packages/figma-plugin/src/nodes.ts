/**
 * Recorded operations to Figma nodes.
 *
 * One operation becomes one layer. A flat color becomes a rectangle, or a
 * vector when it holds many cells. A radial spot becomes an ellipse, which is
 * exact: every spot the engine paints reaches alpha 0 on its outer radius, so
 * the circle holds the whole shape and nothing is cut off.
 *
 * Two Figma rules drive the order of the code below:
 *  - `appendChild` keeps a node where it is on the canvas, so a child's x/y
 *    is set after it is appended, never before.
 *  - moving a frame moves its children with it, so the outer frame is
 *    positioned last, once it is complete.
 */

import type { FrameStyle, ImageAvatar, LayerAvatar } from "./messages.ts";
import type { Op, Rect, Rgba } from "./plan.ts";

const HEX = "0123456789ABCDEF";

function hexOf(color: Rgba): string {
	const part = (n: number) => {
		const v = Math.max(0, Math.min(255, Math.round(n * 255)));
		return HEX[v >> 4] + HEX[v & 15];
	};
	return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

function solidPaint(color: Rgba): SolidPaint {
	return {
		type: "SOLID",
		color: { r: color.r, g: color.g, b: color.b },
		opacity: color.a,
	};
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Many separate rectangles as one SVG path, relative to `origin`. */
function pathOf(rects: Rect[], origin: { x: number; y: number }): string {
	const out: string[] = [];
	for (const r of rects) {
		const x0 = round(r.x - origin.x);
		const y0 = round(r.y - origin.y);
		const x1 = round(r.x + r.w - origin.x);
		const y1 = round(r.y + r.h - origin.y);
		out.push(`M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`);
	}
	return out.join(" ");
}

function boundsOf(rects: Rect[]): Rect {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const r of rects) {
		minX = Math.min(minX, r.x);
		minY = Math.min(minY, r.y);
		maxX = Math.max(maxX, r.x + r.w);
		maxY = Math.max(maxY, r.y + r.h);
	}
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Never hand Figma a zero dimension; it refuses to resize to one. */
const atLeast = (n: number) => Math.max(0.01, n);

/** Build the layer for one operation, and where it belongs in the frame. */
function nodeFor(op: Op): { node: SceneNode; x: number; y: number } {
	if (op.kind === "rects") {
		if (op.rects.length === 1) {
			const r = op.rects[0];
			const rect = figma.createRectangle();
			rect.name = hexOf(op.color);
			rect.resizeWithoutConstraints(atLeast(r.w), atLeast(r.h));
			rect.fills = [solidPaint(op.color)];
			return { node: rect, x: r.x, y: r.y };
		}
		const bounds = boundsOf(op.rects);
		const vector = figma.createVector();
		vector.name = `${hexOf(op.color)} · ${op.rects.length} cells`;
		vector.vectorPaths = [
			{ windingRule: "NONZERO", data: pathOf(op.rects, bounds) },
		];
		vector.fills = [solidPaint(op.color)];
		vector.strokes = [];
		return { node: vector, x: bounds.x, y: bounds.y };
	}

	const ellipse = figma.createEllipse();
	ellipse.name = "Spot";
	const diameter = atLeast(op.radius * 2);
	ellipse.resizeWithoutConstraints(diameter, diameter);
	// An identity gradient transform puts a Figma radial gradient at the
	// center of its node, reaching the edge at position 1. On a square node
	// that is exactly the circle the engine drew.
	ellipse.fills = [
		{
			type: "GRADIENT_RADIAL",
			gradientTransform: [
				[1, 0, 0],
				[0, 1, 0],
			],
			gradientStops: op.stops.map((stop) => ({
				position: stop.offset,
				color: {
					r: stop.color.r,
					g: stop.color.g,
					b: stop.color.b,
					a: stop.color.a,
				},
			})),
		},
	];
	return { node: ellipse, x: op.cx - op.radius, y: op.cy - op.radius };
}

/** Cut the corners. A squircle is Figma's own corner smoothing, not a path. */
function applyShape(
	node: FrameNode | RectangleNode,
	style: FrameStyle,
	size: number,
): void {
	if (style.shape === "circle") {
		node.cornerRadius = size / 2;
		node.cornerSmoothing = 0;
		return;
	}
	if (style.shape === "square") {
		node.cornerRadius = 0;
		node.cornerSmoothing = 0;
		return;
	}
	node.cornerRadius = Math.max(0, Math.min(size / 2, style.radius));
	node.cornerSmoothing =
		style.shape === "squircle" ? Math.max(0, Math.min(1, style.smoothing)) : 0;
}

export function avatarName(seed: string): string {
	const clean = seed.trim();
	return clean ? `Avatar · ${clean}` : "Avatar";
}

/** One avatar as a frame full of native, editable layers. */
export function createLayerAvatar(
	avatar: LayerAvatar,
	style: FrameStyle,
): FrameNode {
	const frame = figma.createFrame();
	frame.name = avatarName(avatar.seed);
	frame.resizeWithoutConstraints(avatar.size, avatar.size);
	frame.fills = [];
	frame.clipsContent = true;
	applyShape(frame, style, avatar.size);

	let host = frame;
	if (avatar.blur > 0) {
		// The engine blurs the whole mesh at once, not each spot on its own, so
		// the spots go in a group and the blur sits on the group. The plan has
		// already enlarged them, so the soft edge falls outside the frame.
		const blurred = figma.createFrame();
		blurred.name = "Mesh";
		blurred.resizeWithoutConstraints(avatar.size, avatar.size);
		blurred.fills = [];
		blurred.clipsContent = false;
		blurred.effects = [
			{
				type: "LAYER_BLUR",
				radius: avatar.blur,
				visible: true,
			} as Effect,
		];
		frame.appendChild(blurred);
		blurred.x = 0;
		blurred.y = 0;
		host = blurred;
	}

	for (const op of avatar.ops) {
		const built = nodeFor(op);
		host.appendChild(built.node);
		built.node.x = built.x;
		built.node.y = built.y;
	}
	return frame;
}

/** One avatar as a flat PNG, pixel for pixel what the web renders. */
export function createImageAvatar(
	avatar: ImageAvatar,
	style: FrameStyle,
): RectangleNode {
	const rect = figma.createRectangle();
	rect.name = avatarName(avatar.seed);
	rect.resizeWithoutConstraints(avatar.size, avatar.size);
	rect.fills = [imagePaint(avatar.bytes)];
	applyShape(rect, style, avatar.size);
	return rect;
}

export function imagePaint(bytes: Uint8Array): ImagePaint {
	return {
		type: "IMAGE",
		scaleMode: "FILL",
		imageHash: figma.createImage(bytes).hash,
	};
}

/** Lay a set of avatars out in a row, so a batch arrives tidy. */
export function row(children: SceneNode[], gap: number): FrameNode {
	const frame = figma.createFrame();
	frame.name = `Avatars · ${children.length}`;
	frame.fills = [];
	frame.clipsContent = false;
	frame.layoutMode = "HORIZONTAL";
	frame.primaryAxisSizingMode = "AUTO";
	frame.counterAxisSizingMode = "AUTO";
	frame.counterAxisAlignItems = "CENTER";
	frame.itemSpacing = gap;
	for (const child of children) frame.appendChild(child);
	return frame;
}

/** Drop a finished node in the middle of what the user is looking at. */
export function placeInViewport(node: SceneNode): void {
	const center = figma.viewport.center;
	node.x = Math.round(center.x - node.width / 2);
	node.y = Math.round(center.y - node.height / 2);
}
