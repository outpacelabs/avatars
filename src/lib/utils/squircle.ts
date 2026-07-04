/**
 * Figma-style corner smoothing ("squircle") path generator.
 *
 * CSS border-radius draws a plain circular arc. Figma/Apple corner
 * smoothing keeps a circular arc of the SAME radius at the corner apex and
 * splices a bézier ease between it and the straight edges, so the corner
 * radius reads identically while the transition softens. At smoothing s the
 * arc shrinks to 90°·(1−s) and the transition extends (1+s)·R along each
 * edge.
 *
 * Own implementation of the math Figma published in "Desperately seeking
 * squircles" (also implemented by the MIT figma-squircle package, which
 * this replaces; output verified point-for-point identical before the
 * dependency was dropped). Radius and transition are clamped to half the
 * shorter side; when space is tight, the radius keeps priority and the
 * remaining budget goes to smoothing (Figma's preserve-smoothing behavior).
 */

interface CornerParams {
	a: number;
	b: number;
	c: number;
	d: number;
	p: number;
	arcSectionLength: number;
	radius: number;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;

function cornerParams(
	radius: number,
	smoothing: number,
	budget: number,
): CornerParams {
	// Total transition length along each edge, ideally (1+s)·R.
	let p = (1 + smoothing) * radius;

	// Arc shrinks as smoothing grows: 90° at s=0, 0° at s=1.
	const arcMeasure = 90 * (1 - smoothing);
	const arcSectionLength =
		Math.sin(toRadians(arcMeasure / 2)) * radius * Math.SQRT2;

	// Angle consumed by each bézier ease on either side of the arc.
	const angleAlpha = (90 - arcMeasure) / 2;
	const p3ToP4Distance = radius * Math.tan(toRadians(angleAlpha / 2));

	// Split the ease segment into its x/y components.
	const angleBeta = 45 * smoothing;
	const c = p3ToP4Distance * Math.cos(toRadians(angleBeta));
	const d = c * Math.tan(toRadians(angleBeta));

	let b = (p - arcSectionLength - c - d) / 3;
	let a = 2 * b;

	// Tight budget: keep the radius, redistribute what's left of the
	// transition between the two control lengths (preserve smoothing).
	if (p > budget) {
		const p1ToP3MaxDistance = budget - d - arcSectionLength - c;
		const minA = p1ToP3MaxDistance / 6;
		const maxB = p1ToP3MaxDistance - minA;
		b = Math.min(b, maxB);
		a = p1ToP3MaxDistance - b;
		p = Math.min(p, budget);
	}

	return { a, b, c, d, p, arcSectionLength, radius };
}

const fmt = (n: number) => {
	const r = +n.toFixed(4);
	// Normalize -0 so path strings are stable.
	return Object.is(r, -0) ? 0 : r;
};

/**
 * SVG path (border-box pixels) for a `width`×`height` rectangle with
 * smoothed corners. `smoothing` is 0–1; 0.6 is the Apple/Figma target.
 */
export function squirclePath({
	width,
	height,
	radius,
	smoothing = 0.6,
}: {
	width: number;
	height: number;
	radius: number;
	smoothing?: number;
}): string {
	const w = Math.max(0, width);
	const h = Math.max(0, height);
	if (!w || !h) return "";

	const budget = Math.min(w, h) / 2;
	const r = Math.min(Math.max(0, radius), budget);
	const s = Math.min(Math.max(0, smoothing), 1);
	if (!r) return `M 0 0 L ${fmt(w)} 0 L ${fmt(w)} ${fmt(h)} L 0 ${fmt(h)} Z`;

	const { a, b, c, d, p, arcSectionLength: L } = cornerParams(r, s, budget);

	// One corner's three segments (ease in, arc, ease out), expressed for the
	// top-right corner and mirrored to the others via sign flips.
	const corner = (sx: number, sy: number, swap: boolean) => {
		const seg1 = swap
			? `c 0 ${fmt(sy * a)} 0 ${fmt(sy * (a + b))} ${fmt(sx * d)} ${fmt(sy * (a + b + c))}`
			: `c ${fmt(sx * a)} 0 ${fmt(sx * (a + b))} 0 ${fmt(sx * (a + b + c))} ${fmt(sy * d)}`;
		const arc = `a ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(sx * L)} ${fmt(sy * L)}`;
		const seg3 = swap
			? `c ${fmt(sx * c)} ${fmt(sy * d)} ${fmt(sx * (b + c))} ${fmt(sy * d)} ${fmt(sx * (a + b + c))} ${fmt(sy * d)}`
			: `c ${fmt(sx * d)} ${fmt(sy * c)} ${fmt(sx * d)} ${fmt(sy * (b + c))} ${fmt(sx * d)} ${fmt(sy * (a + b + c))}`;
		return `${seg1} ${arc} ${seg3}`;
	};

	return [
		`M ${fmt(w - p)} 0`,
		corner(1, 1, false), // top-right: ends at (w, p)
		`L ${fmt(w)} ${fmt(h - p)}`,
		corner(-1, 1, true), // bottom-right: ends at (w - p, h)
		`L ${fmt(p)} ${fmt(h)}`,
		corner(-1, -1, false), // bottom-left: ends at (0, h - p)
		`L 0 ${fmt(p)}`,
		corner(1, -1, true), // top-left: ends at (p, 0)
		"Z",
	].join(" ");
}
