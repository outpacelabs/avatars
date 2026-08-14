/**
 * Canonical release history for @outpacelabs/avatars. Feeds the /changelog
 * page (visible entries + JSON-LD). Newest first. Dates are ISO strings so
 * the server and client format identically (no locale drift).
 */

export type ChangeKind = "new" | "improved" | "fixed";

export interface Change {
	kind: ChangeKind;
	text: string;
}

export interface ChangelogEntry {
	/** Semver of the npm release, or "next" for the in-progress section. */
	version: string;
	/** ISO date of the release; null while still in progress. */
	date: string | null;
	title: string;
	summary: string;
	changes: Change[];
}

export const CHANGELOG: ChangelogEntry[] = [
	{
		version: "0.5.0",
		date: "2026-08-14",
		title: "Avatars that fit their size",
		summary:
			"Complexity now follows the size an avatar is shown at, so a 24px avatar reads as one clean mark instead of a muddy blob. Plus a Create page to tune every prop visually.",
		changes: [
			{
				kind: "improved",
				text: "Avatars now draw for the size they are shown at: a small one gets fewer colors and fewer, larger shapes instead of blending into a muddy blob, a big one keeps the full detail. Both patterns, driven by the size prop.",
			},
			{
				kind: "new",
				text: "displaySize option on every engine helper: the on-screen size in CSS pixels, for when you draw at a higher resolution than you display.",
			},
			{
				kind: "fixed",
				text: "Dither cells now tile the frame exactly instead of overlapping by a pixel, so no cell edge doubles up.",
			},
			{
				kind: "new",
				text: "Create page: live preview for seed, size, shape, and pattern with copy-ready JSX.",
			},
			{
				kind: "improved",
				text: "Every dither now ramps along the same fixed diagonal, so a set of dithers reads as one family; previously each seed picked a random axis.",
			},
		],
	},
	{
		version: "0.4.0",
		date: "2026-07-18",
		title: "Bring your own colors, and P3",
		summary:
			"Use your own palette instead of the seed-derived harmony, and opt into the wide-gamut Display P3 color space.",
		changes: [
			{
				kind: "new",
				text: "colors prop (and generatePalette option): supply your own hex palette; the seed still drives the layout, so every seed stays unique but on-brand.",
			},
			{
				kind: "new",
				text: "p3 prop: render in the Display P3 wide-gamut color space, more vivid on capable screens, unchanged everywhere else.",
			},
			{
				kind: "improved",
				text: "Every engine helper now takes colors and p3 options, wired through renderGradient, gradientToDataURL, and gradientToBlob.",
			},
		],
	},
	{
		version: "0.3.0",
		date: "2026-07-14",
		title: "The dither pattern",
		summary:
			"A second render engine: an ordered (Bayer 8×8) dither of the same palette, alongside the mesh gradient.",
		changes: [
			{
				kind: "new",
				text: 'New pattern prop on GradientAvatar: "mesh" (the default soft gradient) or "dither" (a crisp ordered dither of the same colors).',
			},
			{
				kind: "new",
				text: "drawDither engine helper, re-exported alongside drawMeshGradient for use outside React.",
			},
			{
				kind: "new",
				text: "Switch every avatar on the home page between gradient and dither with one control.",
			},
		],
	},
	{
		version: "0.2.2",
		date: "2026-07-08",
		title: "Safari blur fallback and typed CJS",
		summary:
			"A compatibility round: exports keep their soft blur everywhere, and CommonJS consumers get real types.",
		changes: [
			{
				kind: "fixed",
				text: "Safari 16 and older silently ignore the 2D-canvas filter; exports now approximate the blur through a downscale bounce, so gradientToDataURL and gradientToBlob keep the signature soft look.",
			},
			{
				kind: "fixed",
				text: "The exports map now points require() at .d.cts type declarations, fixing TypeScript resolution for CommonJS consumers.",
			},
			{
				kind: "improved",
				text: "A palette-stability test suite locks the deterministic output, so the same seed keeps rendering the same gradient across releases.",
			},
		],
	},
	{
		version: "0.2.1",
		date: "2026-06-19",
		title: "MIT license and a proper README",
		summary: "Housekeeping so the package is safe and pleasant to adopt.",
		changes: [
			{
				kind: "new",
				text: "The MIT license now ships inside the package itself.",
			},
			{
				kind: "improved",
				text: "Rewritten README: live playground links, the full props table, and every engine helper documented.",
			},
		],
	},
	{
		version: "0.1.0",
		date: "2026-04-23",
		title: "Initial release",
		summary:
			"Deterministic mesh-gradient avatars for React, with the whole gradient engine bundled in.",
		changes: [
			{
				kind: "new",
				text: "GradientAvatar component: any seed becomes a stable avatar with seed, size, radius, className, and style props.",
			},
			{
				kind: "new",
				text: "Engine helpers re-exported for use outside React: drawMeshGradient, renderGradient, gradientToDataURL, gradientToBlob, generatePalette, seedFromString, and toSeed.",
			},
			{
				kind: "new",
				text: "Zero dependencies, no network requests, MIT licensed.",
			},
		],
	},
];

/** "2026-07-08" → "July 8, 2026" (fixed locale, server/client identical). */
export function formatChangelogDate(iso: string): string {
	const [y, m, d] = iso.split("-").map(Number);
	const MONTHS = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return `${MONTHS[m - 1]} ${d}, ${y}`;
}
