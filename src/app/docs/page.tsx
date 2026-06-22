import type { Metadata } from "next";
import { codeToHtml } from "shiki";
import { DocsContent } from "@/components/DocsContent";
import { SNIPPETS } from "@/lib/docs-snippets";

export const metadata: Metadata = {
	title: "Docs",
	description:
		"Documentation for @outpacelabs/avatars — a React component for deterministic mesh-gradient avatars. Installation, props, examples, and engine helpers.",
	alternates: {
		canonical: "https://avatars.outpacestudios.com/docs",
	},
	openGraph: {
		title: "@outpacelabs/avatars — Docs",
		description:
			"A React component for deterministic mesh-gradient avatars. A unique gradient for every seed, no stored images.",
		url: "https://avatars.outpacestudios.com/docs",
	},
};

// Muted, elegant dark theme for the code blocks (echoes the article's calm,
// understated palette). Highlighting runs on the server so no Shiki ships to
// the client; the docs receive ready-made HTML.
const CODE_THEME = "vitesse-dark";

export default async function DocsPage() {
	const entries = await Promise.all(
		Object.entries(SNIPPETS).map(
			async ([key, s]) =>
				[
					key,
					await codeToHtml(s.code, { lang: s.lang, theme: CODE_THEME }),
				] as const,
		),
	);
	const highlighted = Object.fromEntries(entries) as Record<string, string>;
	return <DocsContent highlighted={highlighted} />;
}
