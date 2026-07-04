/**
 * Corner smoothing ("squircle") path generator.
 *
 * CSS border-radius draws a plain circular arc: the edge runs at zero
 * curvature and curvature jumps to 1/r the moment the arc starts. Smoothing
 * removes that jump. A circular arc of the SAME radius stays at the corner
 * apex, its sweep shrinking from 90° to 90°·(1−s) as smoothing s rises, and
 * a transition curve eases between the straight edge and the arc over
 * (1+s)·r of edge.
 *
 * The transition is an original derivation, one cubic bézier per side,
 * solved in closed form from two continuity constraints:
 *
 *   1. Zero curvature at the edge junction: the first three control points
 *      are collinear on the edge, so the curve leaves the straight line
 *      with no curvature step.
 *   2. Curvature exactly 1/r at the arc junction, matching the circle's,
 *      so the curve meets the arc with no curvature step either.
 *
 * Both junctions are G2-continuous. The apex always sits on the circular
 * arc, which is why the radius you configure is the radius you see. Radius
 * and transition are clamped to half the shorter side; when space is tight
 * the radius keeps priority and the remaining budget goes to smoothing.
 */

const EPS = 1e-3;

const fmt = (n: number) => {
	const r = +n.toFixed(4);
	// Normalize -0 so path strings are stable.
	return Object.is(r, -0) ? 0 : r;
};

interface Vec {
	x: number;
	y: number;
}

/**
 * Per-corner geometry in the corner's local frame: the corner point is the
 * origin and both edges run along the positive axes. The path enters along
 * the first edge and exits along the second; everything is mirror
 * symmetric about the corner's diagonal.
 */
interface CornerGeometry {
	/** Transition length along each edge from the corner point. */
	p: number;
	/** Collinear cubic control points on the entry edge (x positions). */
	b1x: number;
	b2x: number;
	/** Arc endpoint nearest the entry edge. */
	arc: Vec;
	radius: number;
	/** True when smoothing degenerated to a plain quarter arc. */
	plain: boolean;
}

function cornerGeometry(
	radius: number,
	s: number,
	budget: number,
): CornerGeometry {
	// Radius first, then smoothing gets whatever budget is left:
	// p = (1+s)·r must fit within half the shorter side.
	const r = Math.min(radius, budget);
	const sEff = Math.max(0, Math.min(s, budget / r - 1, 1));

	if (sEff <= EPS) {
		return {
			p: r,
			b1x: r,
			b2x: r,
			arc: { x: r, y: 0 },
			radius: r,
			plain: true,
		};
	}

	// The arc keeps radius r around the plain corner's center (r, r) and
	// shrinks symmetrically about the 45° diagonal: sweep = 90°·(1−s). Its
	// endpoint on the entry-edge side sits at angle φ from that center.
	const sweep = (Math.PI / 2) * (1 - sEff);
	const phi = (-3 * Math.PI) / 4 + sweep / 2;
	const arc: Vec = { x: r + r * Math.cos(phi), y: r + r * Math.sin(phi) };
	// Unit tangent at the arc endpoint, pointing toward the apex.
	const t: Vec = { x: Math.sin(phi), y: -Math.cos(phi) };

	// Cubic B0..B3 from the edge point (p, 0) to the arc endpoint.
	// Constraint 1 (zero curvature at B0): B0, B1, B2 collinear on the
	// edge, so B2 is where the arc endpoint's tangent line meets the edge.
	const l2 = arc.y / t.y;
	const b2x = arc.x - l2 * t.x;
	// Constraint 2 (curvature 1/r at B3): for a cubic,
	// κ(1) = (2/3)·|cross(B3−B2, B1−B2)| / |B3−B2|³, with B3−B2 = l2·t and
	// B1−B2 along the edge, which solves to a closed-form offset.
	const b1x = b2x + (3 * l2 * l2) / (2 * r * t.y);
	const p = (1 + sEff) * r;

	return { p, b1x, b2x, arc, radius: r, plain: false };
}

/**
 * SVG path (border-box pixels) for a `width`×`height` rectangle with
 * smoothed corners. `smoothing` is 0–1; 0.6 is the Apple/Figma target and
 * 0 reproduces plain circular border-radius exactly.
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
	if (!r) return `M 0 0 L ${fmt(w)} 0 L ${fmt(w)} ${fmt(h)} L 0 ${fmt(h)} Z`;

	const s = Math.min(Math.max(0, smoothing), 1);
	const g = cornerGeometry(r, s, budget);

	// One corner, emitted in page coordinates. K is the corner point, e1
	// the unit vector along the entry edge (pointing away from the corner),
	// e2 along the exit edge. The path runs clockwise, so every arc sweeps
	// with flag 1, exactly like a plain rounded rect's corner arcs.
	const corner = (K: Vec, e1: Vec, e2: Vec): string => {
		const at = (u: number, v: number): string =>
			`${fmt(K.x + u * e1.x + v * e2.x)} ${fmt(K.y + u * e1.y + v * e2.y)}`;

		if (g.plain) {
			return `A ${fmt(g.radius)} ${fmt(g.radius)} 0 0 1 ${at(0, g.p)}`;
		}
		return [
			// Ease off the entry edge: B1/B2 stay on the edge (zero curvature).
			`C ${at(g.b1x, 0)} ${at(g.b2x, 0)} ${at(g.arc.x, g.arc.y)}`,
			// The circular apex, radius intact.
			`A ${fmt(g.radius)} ${fmt(g.radius)} 0 0 1 ${at(g.arc.y, g.arc.x)}`,
			// Mirror of the entry ease, onto the exit edge.
			`C ${at(0, g.b2x)} ${at(0, g.b1x)} ${at(0, g.p)}`,
		].join(" ");
	};

	return [
		`M ${fmt(g.p)} 0`,
		`L ${fmt(w - g.p)} 0`,
		corner({ x: w, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }),
		`L ${fmt(w)} ${fmt(h - g.p)}`,
		corner({ x: w, y: h }, { x: 0, y: -1 }, { x: -1, y: 0 }),
		`L ${fmt(g.p)} ${fmt(h)}`,
		corner({ x: 0, y: h }, { x: 1, y: 0 }, { x: 0, y: -1 }),
		`L 0 ${fmt(g.p)}`,
		corner({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }),
		"Z",
	].join(" ");
}
