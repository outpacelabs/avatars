import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FAQ, SITE } from "@/lib/seo";
import "./globals.css";

// Sans face — Inter (variable), the same as the glass article. next/font
// self-hosts it; the variable font gives continuous weights so the docs' 450
// and 550 render exactly (the old static InterDisplay couldn't).
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-display",
});

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": `${SITE}/#website`,
			url: SITE,
			name: "@outpacelabs/avatars",
			description:
				"Free deterministic gradient avatars — a unique gradient for every seed.",
			publisher: { "@id": `${SITE}/#organization` },
			inLanguage: "en",
		},
		{
			"@type": ["SoftwareApplication", "SoftwareSourceCode"],
			"@id": `${SITE}/#software`,
			name: "@outpacelabs/avatars",
			alternateName: "Gradient Avatars",
			description:
				"A free, open-source React component that renders deterministic mesh-gradient avatars on a canvas. The same seed always produces the same gradient — no stored images, no network. MIT licensed.",
			url: SITE,
			applicationCategory: "DeveloperApplication",
			operatingSystem: "Web, Cross-platform",
			softwareRequirements: "React 18 or newer",
			programmingLanguage: "TypeScript",
			codeRepository: "https://github.com/outpacelabs/avatars",
			license: "https://opensource.org/license/mit",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			author: { "@id": `${SITE}/#organization` },
			publisher: { "@id": `${SITE}/#organization` },
			sameAs: [
				"https://github.com/outpacelabs/avatars",
				"https://www.npmjs.com/package/@outpacelabs/avatars",
			],
		},
		{
			"@type": "WebPage",
			"@id": `${SITE}/#webpage`,
			url: SITE,
			name: "Gradient avatars for every seed",
			description:
				"Deterministic gradient avatars — a unique gradient for every seed, free to use under the MIT license.",
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
		default: "Gradient Avatars for React — a unique gradient for every seed",
		template: "%s — @outpacelabs/avatars",
	},
	applicationName: "@outpacelabs/avatars",
	description:
		"Free, zero-dependency React component for deterministic gradient avatars. Turn any seed — user id, email, username — into a unique mesh gradient on canvas. No stored images, no network. MIT licensed.",
	keywords: [
		"gradient avatars",
		"@outpacelabs/avatars",
		"react avatar component",
		"deterministic avatars",
		"mesh gradient avatar",
		"generate avatar from string",
		"free avatars",
		"open source avatars",
		"profile picture generator",
		"placeholder avatars",
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
		title: "Gradient Avatars for React — a unique gradient for every seed",
		description:
			"Free, zero-dependency React component for deterministic gradient avatars. A unique mesh gradient for every seed — no stored images, no network. MIT licensed.",
		images: [
			{
				url: "/meta.jpg",
				width: 1200,
				height: 630,
				alt: "Gradient avatars by Outpace Studios",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Gradient Avatars for React — a unique gradient for every seed",
		description:
			"Free, zero-dependency React component for deterministic gradient avatars. MIT licensed.",
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
