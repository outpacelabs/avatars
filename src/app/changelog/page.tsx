import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { ChangelogContent } from "@/components/ChangelogContent";
import { CHANGELOG } from "@/lib/changelog";
import { SITE } from "@/lib/seo";

const CHANGELOG_DESCRIPTION =
	"Release notes for @outpacelabs/avatars: every version of the generative gradient avatar component, what changed, and what is coming next.";
const CHANGELOG_OG_DESCRIPTION =
	"Release notes for @outpacelabs/avatars, every version, what changed, and what is coming next.";

// Next.js replaces `openGraph`/`twitter` per segment wholesale (no deep merge
// with layout.tsx), so both must be defined in full here or the page silently
// loses og:image / gets the home page's Twitter copy.
export const metadata: Metadata = {
	title: "Changelog",
	description: CHANGELOG_DESCRIPTION,
	alternates: {
		canonical: `${SITE}/changelog`,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "@outpacelabs/avatars",
		title: "Changelog | @outpacelabs/avatars",
		description: CHANGELOG_OG_DESCRIPTION,
		url: `${SITE}/changelog`,
		images: [
			{
				url: "/meta.jpg",
				width: 1200,
				height: 630,
				alt: "@outpacelabs/avatars, by Outpace Studios",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Changelog | @outpacelabs/avatars",
		description: CHANGELOG_OG_DESCRIPTION,
		images: ["/meta.jpg"],
		site: "@outpacestudios",
		creator: "@outpacestudios",
	},
};

// Breadcrumbs plus one Article per released version (skips the in-progress
// teaser). `about` resolves against the root-layout software graph.
const changelogJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "BreadcrumbList",
			"@id": `${SITE}/changelog/#breadcrumbs`,
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: SITE },
				{
					"@type": "ListItem",
					position: 2,
					name: "Changelog",
					item: `${SITE}/changelog`,
				},
			],
		},
		...CHANGELOG.filter((entry) => entry.date).map((entry) => ({
			"@type": "Article",
			"@id": `${SITE}/changelog/#v${entry.version}`,
			headline: `@outpacelabs/avatars ${entry.version}: ${entry.title}`,
			description: entry.summary,
			datePublished: entry.date,
			url: `${SITE}/changelog#v${entry.version}`,
			about: { "@id": `${SITE}/#software` },
			author: { "@id": `${SITE}/#organization` },
			inLanguage: "en",
		})),
	],
};

export default function ChangelogPage() {
	// GeistMono.variable exposes --font-geist-mono to the version pills/tags.
	return (
		<div className={GeistMono.variable}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogJsonLd) }}
			/>
			<ChangelogContent />
		</div>
	);
}
