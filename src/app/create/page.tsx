import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { CreateContent } from "@/components/CreateContent";
import { SITE } from "@/lib/seo";

const CREATE_DESCRIPTION =
	"A visual editor for @outpacelabs/avatars. Tune seed, size, radius, blur, and color harmony live, then copy the code or export the gradient.";
const CREATE_OG_DESCRIPTION =
	"A visual editor for generative gradient avatars. Tune every prop live, then copy the code or export the gradient.";

// Next.js replaces `openGraph`/`twitter` per segment wholesale (no deep merge
// with layout.tsx), so both must be defined in full here or the page silently
// loses og:image / gets the home page's Twitter copy.
export const metadata: Metadata = {
	title: "Create",
	description: CREATE_DESCRIPTION,
	alternates: {
		canonical: `${SITE}/create`,
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "@outpacelabs/avatars",
		title: "Create | @outpacelabs/avatars",
		description: CREATE_OG_DESCRIPTION,
		url: `${SITE}/create`,
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
		title: "Create | @outpacelabs/avatars",
		description: CREATE_OG_DESCRIPTION,
		images: ["/meta.jpg"],
		site: "@outpacestudios",
		creator: "@outpacestudios",
	},
};

const createJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "BreadcrumbList",
			"@id": `${SITE}/create/#breadcrumbs`,
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: SITE },
				{
					"@type": "ListItem",
					position: 2,
					name: "Create",
					item: `${SITE}/create`,
				},
			],
		},
		{
			"@type": "WebApplication",
			"@id": `${SITE}/create/#app`,
			name: "Avatar prop editor",
			description: CREATE_DESCRIPTION,
			url: `${SITE}/create`,
			applicationCategory: "DesignApplication",
			operatingSystem: "Web",
			isPartOf: { "@id": `${SITE}/#website` },
			about: { "@id": `${SITE}/#software` },
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		},
	],
};

export default function CreatePage() {
	// GeistMono.variable exposes --font-geist-mono to the editor subtree
	// (seed input, labels, and the generated code block).
	return (
		<div className={GeistMono.variable}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(createJsonLd) }}
			/>
			<CreateContent />
		</div>
	);
}
