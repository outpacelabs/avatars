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
		version: "next",
		date: null,
		title: "A visual editor for props",
		summary:
			"A Create page to tune every prop visually and copy the code, with a live preview and 2000×2000 export.",
		changes: [
			{
				kind: "new",
				text: "Create page: live preview for seed, size, shape, and pattern with copy-ready JSX.",
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
				text: 'New pattern prop on GradientAvatar — "mesh" (the default soft gradient) or "dither" (a crisp ordered dither of the same colors).',
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
				text: "A palette-stability test suite locks the deterministic output — the same seed keeps rendering the same gradient across releases.",
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

/** "2026-07-08" → "July 8, 2026" (fixed locale — server/client identical). */
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
