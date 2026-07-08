/**
 * Property tests for the gradient engine. The palette math is pure, so the
 * part of the design users depend on — "the same seed always renders the
 * same avatar" — is testable in Node without a canvas:
 *
 *  - stability: golden palettes for known seeds, byte for byte. If a
 *    refactor changes these, every user's avatars change with it — that
 *    must be a deliberate, versioned decision, never an accident.
 *  - determinism: repeated calls agree; strings route through the same
 *    hash as seedFromString.
 *  - shape: colors are valid hex, harmonies come from the known set.
 *  - spread: distinct seeds actually produce distinct palettes.
 */
import { generatePalette, seedFromString, toSeed } from "../dist/index.js";

let failures = 0;
const check = (name, ok, detail = "") => {
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
	if (!ok) failures++;
};

// Golden palettes, captured from v0.2.1. Changing any of these re-rolls
// avatars in the wild: bump intentionally, alongside a major version.
const GOLDEN = [
	{
		input: "jane@example.com",
		seed: 2231369329,
		harmony: "triadic",
		colors: ["#8659F2", "#FB692C", "#58FD88"],
	},
	{
		input: "acme",
		seed: 2281398667,
		harmony: "complementary",
		colors: ["#40F8A4", "#EA1979", "#0FF2D6", "#EC4258"],
	},
	{
		input: 42,
		seed: 42,
		harmony: "tetradic",
		colors: ["#F38763", "#52F51C", "#29BFF2", "#D160F7"],
	},
	{
		input: 0,
		seed: 0,
		harmony: "triadic",
		colors: ["#E23434", "#46E946", "#4A4AF4"],
	},
	{
		input: "outpace",
		seed: 1754654890,
		harmony: "tetradic",
		colors: ["#FEEB21", "#09F96D", "#2C3DF9", "#E72C99"],
	},
	{
		input: "0",
		seed: 1684187033,
		harmony: "complementary",
		colors: ["#252DF4", "#EFE962", "#7B4EE9", "#A9E121"],
	},
];

for (const g of GOLDEN) {
	const p = generatePalette(g.input);
	check(
		`golden · ${JSON.stringify(g.input)} stable`,
		p.seed === g.seed &&
			p.harmony === g.harmony &&
			JSON.stringify(p.colors) === JSON.stringify(g.colors),
		JSON.stringify(p),
	);
}

// seedFromString anchors (the hash behind every string seed).
check(
	"seedFromString · known anchors",
	seedFromString("jane@example.com") === 2231369329 &&
		seedFromString("") === 1947474976 &&
		seedFromString("a") === 1817065451,
);

// Determinism: repeated calls agree, and strings route through the hash.
{
	const a = generatePalette("determinism");
	const b = generatePalette("determinism");
	check(
		"determinism · same seed, same palette",
		JSON.stringify(a) === JSON.stringify(b),
	);
	check(
		"determinism · string routes through seedFromString",
		generatePalette("acme").seed === seedFromString("acme") &&
			toSeed("acme") === seedFromString("acme"),
	);
	check(
		"determinism · numeric seeds pass through",
		toSeed(42) === 42 && generatePalette(42).seed === 42,
	);
}

// Shape: valid hex colors, known harmony names, sane counts — held across
// a wide sample of seeds.
{
	const HARMONIES = new Set([
		"analogous",
		"triadic",
		"splitComplementary",
		"tetradic",
		"complementary",
	]);
	const hex = /^#[0-9A-F]{6}$/;
	let allHold = true;
	const distinct = new Set();
	for (let i = 0; i < 200; i++) {
		const p = generatePalette(`seed-${i * 7919}`);
		if (!p.colors.every((c) => hex.test(c))) allHold = false;
		if (!HARMONIES.has(p.harmony)) allHold = false;
		if (p.colors.length < 2 || p.colors.length > 6) allHold = false;
		if (!(Number.isInteger(p.seed) && p.seed >= 0)) allHold = false;
		distinct.add(JSON.stringify(p.colors));
	}
	check("shape · 200 seeds all valid (hex, harmony, count, seed)", allHold);
	check(
		"spread · seeds actually differentiate (>190 distinct of 200)",
		distinct.size > 190,
		`${distinct.size}`,
	);
}

console.log(
	failures === 0 ? "\nALL PROPERTY CHECKS PASS" : `\n${failures} FAILURES`,
);
process.exit(failures === 0 ? 0 : 1);
