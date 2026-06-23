/** Shared SEO constants used by metadata, JSON-LD, and the indexable copy. */

export const SITE = "https://avatars.outpacestudios.com";

/**
 * Canonical FAQ. The SAME text feeds the `FAQPage` JSON-LD (layout.tsx) and the
 * indexable copy rendered on the home page (page.tsx) — they must match, or
 * Google may discount the FAQ markup.
 */
export const FAQ: { q: string; a: string }[] = [
	{
		q: "Is @outpacelabs/avatars free?",
		a: "Yes. It is free and open source under the MIT license — use it in commercial or personal projects with no attribution required.",
	},
	{
		q: "How are the gradients generated?",
		a: "Each gradient is derived deterministically from its seed via a hashing function, so the same seed always yields the same gradient. Nothing is stored and no network request is made.",
	},
	{
		q: "Does it make network requests?",
		a: "No. Avatars render entirely client-side on an HTML canvas — nothing is uploaded, hashed to a remote service, or stored. Good for privacy and offline use.",
	},
	{
		q: "Does it work without React?",
		a: "Yes. The bundled engine is re-exported, so you can render gradients to a canvas, data URL, or Blob outside React using helpers like gradientToDataURL and generatePalette.",
	},
	{
		q: "What frameworks does it support?",
		a: "Any React 18+ application, including Next.js. React is the only peer dependency.",
	},
	{
		q: "How is it different from Boring Avatars?",
		a: "Boring Avatars renders SVG shapes; @outpacelabs/avatars renders gradient/mesh fills on an HTML canvas with zero dependencies and no network requests.",
	},
];
