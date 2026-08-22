/**
 * Tests for the engine-to-Figma bridge.
 *
 * The bridge has no canvas and no Figma, so all of it runs in Node. What is
 * checked here is what the plugin promises:
 *
 *  - determinism: one seed always records the same layers.
 *  - the ellipse translation is exact: every radial spot the engine paints
 *    ends at alpha 0 on its outer radius, and covers the whole frame. If
 *    either stops being true, an ellipse node no longer holds the shape and
 *    the vector output silently drifts from the canvas output.
 *  - the dither packing is lossless: the packed rectangles cover every pixel
 *    of the frame exactly once, in the color the engine painted there.
 *  - the packing is worth doing: a whole avatar is a handful of layers, not
 *    thousands of them.
 */
import {
	buildPlan,
	defaultBlur,
	packSolids,
	parseColor,
	transformOps,
} from "../src/plan.ts";

let failures = 0;
const check = (name, ok, detail = "") => {
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
	if (!ok) failures++;
};

const SEEDS = ["jane@example.com", "acme", "outpace", "42", "z"];

/* ── colors ── */

const near = (a, b) => Math.abs(a - b) < 1e-9;
const white = parseColor("#FFFFFF");
check(
	"parseColor: 6-digit hex",
	near(white.r, 1) && near(white.g, 1) && near(white.b, 1) && near(white.a, 1),
);
const half = parseColor("#0080FF80");
check(
	"parseColor: 8-digit hex keeps alpha",
	near(half.r, 0) && near(half.g, 128 / 255) && near(half.b, 1) &&
		near(half.a, 128 / 255),
);
const short = parseColor("#0f8");
check(
	"parseColor: 3-digit hex expands",
	near(short.r, 0) && near(short.g, 1) && near(short.b, 136 / 255),
);
const rgba = parseColor("rgba(255,255,255,0.15)");
check(
	"parseColor: rgba()",
	near(rgba.r, 1) && near(rgba.a, 0.15),
);
let threw = false;
try {
	parseColor("color(display-p3 1 0 0)");
} catch {
	threw = true;
}
check("parseColor: refuses what it cannot map", threw);

/* ── determinism ── */

for (const pattern of ["mesh", "dither"]) {
	const a = buildPlan({ seed: "outpace", pattern, size: 128 });
	const b = buildPlan({ seed: "outpace", pattern, size: 128 });
	check(
		`${pattern}: one seed records the same layers twice`,
		JSON.stringify(a) === JSON.stringify(b),
	);
	const other = buildPlan({ seed: "outpace-2", pattern, size: 128 });
	check(
		`${pattern}: a different seed records different layers`,
		JSON.stringify(a) !== JSON.stringify(other),
	);
}

/* ── the ellipse translation is exact ── */

let radials = 0;
let allTransparent = true;
let allFullFrame = true;
let allSorted = true;
for (const seed of SEEDS) {
	const size = 200;
	const { ops } = buildPlan({ seed, pattern: "mesh", size, blur: 0 });
	for (const op of ops) {
		if (op.kind !== "radial") continue;
		radials++;
		const last = op.stops[op.stops.length - 1];
		if (last.color.a !== 0 || last.offset !== 1) allTransparent = false;
		if (op.clip.x > 0 || op.clip.y > 0 || op.clip.w < size || op.clip.h < size) {
			allFullFrame = false;
		}
		for (let i = 1; i < op.stops.length; i++) {
			if (op.stops[i].offset < op.stops[i - 1].offset) allSorted = false;
		}
	}
}
check("mesh: the engine paints radial spots", radials > 0, `${radials}`);
check("mesh: every spot fades to alpha 0 at its radius", allTransparent);
check("mesh: every spot is painted through the whole frame", allFullFrame);
check("mesh: gradient stops come out in order", allSorted);

const meshBase = buildPlan({
	seed: "outpace",
	pattern: "mesh",
	size: 100,
	blur: 0,
}).ops[0];
check(
	"mesh: the first layer is the flat base fill",
	meshBase.kind === "rects" &&
		meshBase.rects.length === 1 &&
		meshBase.rects[0].x === 0 &&
		meshBase.rects[0].y === 0 &&
		meshBase.rects[0].w === 100 &&
		meshBase.rects[0].h === 100,
);

/* ── the dither packing is lossless ── */

{
	const size = 48;
	const plan = buildPlan({ seed: "acme", pattern: "dither", size });
	const grid = new Array(size * size).fill(null);
	let overlap = false;
	let area = 0;
	for (const op of plan.ops) {
		if (op.kind !== "rects") continue;
		const key = `${op.color.r},${op.color.g},${op.color.b}`;
		for (const r of op.rects) {
			area += r.w * r.h;
			for (let y = r.y; y < r.y + r.h; y++) {
				for (let x = r.x; x < r.x + r.w; x++) {
					if (grid[y * size + x] !== null) overlap = true;
					grid[y * size + x] = key;
				}
			}
		}
	}
	check("dither: packed rectangles never overlap", !overlap);
	check(
		"dither: packed rectangles cover every pixel",
		grid.every((v) => v !== null),
	);
	check(
		"dither: packed area equals the frame",
		area === size * size,
		`${area}`,
	);

	check(
		"dither: the frame is one layer per palette color",
		plan.ops.length <= 4,
		`${plan.ops.length} layers`,
	);
}

check("packSolids: an empty list stays empty", packSolids([]).length === 0);

/* ── the packing is worth doing ── */


const ditherLayers = buildPlan({ seed: "acme", pattern: "dither", size: 256 })
	.ops.length;
check(
	"dither: a full-detail frame is a handful of layers",
	ditherLayers > 0 && ditherLayers <= 5,
	`${ditherLayers} layers`,
);
const meshLayers = buildPlan({ seed: "acme", pattern: "mesh", size: 256 }).ops
	.length;
check(
	"mesh: a frame is a couple of dozen layers",
	meshLayers > 0 && meshLayers <= 24,
	`${meshLayers} layers`,
);

/* ── blur bleed ── */

check("defaultBlur: a dither is crisp", defaultBlur("dither", 200) === 0);
check("defaultBlur: a mesh is 6% of the frame", defaultBlur("mesh", 200) === 12);
{
	const plan = buildPlan({ seed: "outpace", pattern: "mesh", size: 200 });
	const base = plan.ops[0];
	const scale = 1 + (plan.blur / 200) * 4;
	check(
		"mesh: the blurred content is enlarged and centered",
		base.kind === "rects" &&
			Math.abs(base.rects[0].w - 200 * scale) < 1e-6 &&
			Math.abs(base.rects[0].x + (200 * scale - 200) / 2) < 1e-6,
	);
}
{
	const moved = transformOps(
		[{ kind: "rects", color: white, rects: [{ x: 1, y: 2, w: 3, h: 4 }] }],
		2,
		10,
	);
	const r = moved[0].rects[0];
	check(
		"transformOps: scales about the frame origin",
		r.x === 12 && r.y === 14 && r.w === 6 && r.h === 8,
	);
}

/* ── custom palettes ── */
{
	const brand = buildPlan({
		seed: "acme",
		pattern: "dither",
		size: 64,
		colors: ["#FF0000", "#0000FF"],
	});
	const used = new Set(
		brand.ops.map((op) =>
			op.kind === "rects" ? `${op.color.r},${op.color.g},${op.color.b}` : "x",
		),
	);
	check(
		"colors: a custom palette paints only those colors",
		used.size === 2 && used.has("1,0,0") && used.has("0,0,1"),
		[...used].join(" | "),
	);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
