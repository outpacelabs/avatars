import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { codeToHtml } from "shiki";
import { DocsContent } from "@/components/DocsContent";
import { INSTALL, SNIPPETS } from "@/lib/docs-snippets";

const DOCS_DESCRIPTION =
	"Documentation for @outpacelabs/avatars, a React component for generative gradient avatars. Installation, props, examples, and engine helpers.";
const DOCS_OG_DESCRIPTION =
	"A React component for generative gradient avatars. Every seed renders a unique mesh gradient, with no stored images.";

// Next.js replaces `openGraph`/`twitter` per segment wholesale (no deep merge
// with layout.tsx), so both must be defined in full here or the docs page
// silently loses og:image / gets the home page's Twitter copy.
export const metadata: Metadata = {
	title: "Docs",
	description: DOCS_DESCRIPTION,
	alternates: {
		canonical: "https://avatars.outpacestudios.com/docs",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "@outpacelabs/avatars",
		title: "@outpacelabs/avatars | Docs",
		description: DOCS_OG_DESCRIPTION,
		url: "https://avatars.outpacestudios.com/docs",
		images: [
			{
				url: "/meta.jpg",
				width: 1200,
				height: 630,
				alt: "Generative gradient avatars by Outpace Studios",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "@outpacelabs/avatars | Docs",
		description: DOCS_OG_DESCRIPTION,
		images: ["/meta.jpg"],
		site: "@outpacestudios",
		creator: "@outpacestudios",
	},
};

const SITE = "https://avatars.outpacestudios.com";

// Page-scoped structured data: breadcrumb + a TechArticle for the docs. The
// `about`/`author` @ids resolve against the root-layout graph on the same page.
const docsJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "BreadcrumbList",
			"@id": `${SITE}/docs/#breadcrumbs`,
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: SITE },
				{
					"@type": "ListItem",
					position: 2,
					name: "Docs",
					item: `${SITE}/docs`,
				},
			],
		},
		{
			"@type": "TechArticle",
			"@id": `${SITE}/docs/#article`,
			headline: "@outpacelabs/avatars: Documentation",
			description:
				"Installation, props, usage, and engine helpers for @outpacelabs/avatars, a React component for generative gradient avatars.",
			url: `${SITE}/docs`,
			about: { "@id": `${SITE}/#software` },
			author: { "@id": `${SITE}/#organization` },
			license: "https://opensource.org/license/mit",
			inLanguage: "en",
		},
	],
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
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(docsJsonLd) }}
			/>
			<DocsContent highlighted={highlighted} install={install} />
		</div>
	);
}
