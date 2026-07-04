import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FAQ, SITE, TAGLINE } from "@/lib/seo";
import "./globals.css";

// Sans face — Inter (variable), the same as the glass article. next/font
// self-hosts it; the variable font gives continuous weights so the docs' 450
// and 550 render exactly (the old static InterDisplay couldn't).
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-display",
});

// Published version of @outpacelabs/avatars (packages/avatars/package.json),
// surfaced in the SoftwareApplication JSON-LD as a freshness signal.
const PACKAGE_VERSION = "0.2.1";

// Aligned with TAGLINE (the visible H1). "Free & open source" lives in the
// description: with "Beautiful" in the title, a suffix would push it past
// Google's ~60-char truncation point.
const TITLE = "Beautiful Generative Gradient Avatars for React";
const DESCRIPTION =
	"Free, zero-dependency React component for beautiful generative gradient avatars. Any seed becomes a unique mesh gradient, no stored images or network calls.";
const OG_DESCRIPTION =
	"Free, zero-dependency React component for beautiful generative gradient avatars. Any seed becomes a unique mesh gradient, no stored images. MIT licensed.";
const TWITTER_DESCRIPTION =
	"Free, zero-dependency React component for beautiful generative gradient avatars. MIT licensed.";

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": `${SITE}/#website`,
			url: SITE,
			name: "@outpacelabs/avatars",
			description:
				"Free, beautiful generative gradient avatars. A unique gradient for every seed.",
			publisher: { "@id": `${SITE}/#organization` },
			inLanguage: "en",
		},
		{
			"@type": ["SoftwareApplication", "SoftwareSourceCode"],
			"@id": `${SITE}/#software`,
			name: "@outpacelabs/avatars",
			alternateName: "Beautiful Generative Gradient Avatars",
			description:
				"A free, open-source React component that renders beautiful generative, deterministic mesh-gradient avatars on a canvas. The same seed always produces the same gradient, with no stored images and no network calls. MIT licensed.",
			url: SITE,
			applicationCategory: "DeveloperApplication",
			operatingSystem: "Web, Cross-platform",
			softwareRequirements: "React 18 or newer",
			programmingLanguage: "TypeScript",
			softwareVersion: PACKAGE_VERSION,
			codeRepository: "https://github.com/outpacelabs/avatars",
			license: "https://opensource.org/license/mit",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			author: { "@id": `${SITE}/#organization` },
			publisher: { "@id": `${SITE}/#organization` },
			keywords:
				"generative avatars, gradient avatars, react avatar component, mesh gradient, deterministic avatars",
			sameAs: [
				"https://github.com/outpacelabs/avatars",
				"https://www.npmjs.com/package/@outpacelabs/avatars",
			],
		},
		{
			"@type": "WebPage",
			"@id": `${SITE}/#webpage`,
			url: SITE,
			name: `${TAGLINE}, for every seed`,
			description:
				"Beautiful generative gradient avatars, free to use under the MIT license. Every seed renders a unique mesh gradient.",
			isPartOf: { "@id": `${SITE}/#website` },
			about: { "@id": `${SITE}/#software` },
			publisher: { "@id": `${SITE}/#organization` },
			license: "https://opensource.org/license/mit",
			isAccessibleForFree: true,
			inLanguage: "en",
		},
		{
			"@type": "FAQPage",
			"@id": `${SITE}/#faq`,
			isPartOf: { "@id": `${SITE}/#webpage` },
			mainEntity: FAQ.map(({ q, a }) => ({
				"@type": "Question",
				name: q,
				acceptedAnswer: { "@type": "Answer", text: a },
			})),
		},
		{
			"@type": "Organization",
			"@id": `${SITE}/#organization`,
			name: "Outpace Studios",
			url: "https://outpacestudios.com",
			logo: {
				"@type": "ImageObject",
				url: "https://outpacestudios.com/favicon.svg",
			},
			sameAs: [
				"https://www.linkedin.com/company/outpacestudios/",
				"https://twitter.com/outpacestudios",
				"https://github.com/outpacelabs",
			],
		},
	],
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	metadataBase: new URL("https://avatars.outpacestudios.com"),
	title: {
		default: TITLE,
		template: "%s | @outpacelabs/avatars",
	},
	applicationName: "@outpacelabs/avatars",
	description: DESCRIPTION,
	keywords: [
		"generative avatars",
		"generative gradient avatars",
		"gradient avatars",
		"@outpacelabs/avatars",
		"react avatar component",
		"deterministic avatars",
		"mesh gradient avatar",
		"generate avatar from string",
		"free avatars",
		"open source avatars",
		"profile picture generator",
		"boring avatars alternative",
		"dicebear alternative",
	],
	authors: [{ name: "Outpace Studios", url: "https://outpacestudios.com" }],
	creator: "Outpace Studios",
	publisher: "Outpace Studios",
	formatDetection: { email: false, address: false, telephone: false },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://avatars.outpacestudios.com",
		siteName: "@outpacelabs/avatars",
		title: TITLE,
		description: OG_DESCRIPTION,
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
		title: TITLE,
		description: TWITTER_DESCRIPTION,
		images: ["/meta.jpg"],
		site: "@outpacestudios",
		creator: "@outpacestudios",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: "/",
	},
	category: "Developer Tools",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${inter.variable} ${GeistMono.variable}`}>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body>{children}</body>
		</html>
	);
}
