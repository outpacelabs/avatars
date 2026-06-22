import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { codeToHtml } from "shiki";
import { DocsContent } from "@/components/DocsContent";
import { INSTALL, SNIPPETS } from "@/lib/docs-snippets";

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

// shadcn's code theme. Highlighting runs on the server so no Shiki ships to
// the client; the docs receive ready-made HTML.
const CODE_THEME = "github-dark";

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

	// The switcher decodes the command itself (scramble), so it only needs the
	// raw strings — no server highlighting.
	const install = INSTALL.map((m) => ({ id: m.id, command: m.command }));

	// GeistMono.variable exposes --font-geist-mono to the docs subtree.
	return (
		<div className={GeistMono.variable}>
			<DocsContent highlighted={highlighted} install={install} />
		</div>
	);
}
