import type { Metadata, Viewport } from "next";
import "./globals.css";

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebPage",
			"@id": "https://avatars.outpacestudios.com/#webpage",
			name: "A unique gradient for every seed",
			description:
				"Deterministic gradient avatars — a unique gradient for every seed, free to use under the MIT license",
			url: "https://avatars.outpacestudios.com",
			publisher: {
				"@id": "https://avatars.outpacestudios.com/#organization",
			},
			license: "https://opensource.org/license/mit",
			isAccessibleForFree: true,
		},
		{
			"@type": "Organization",
			"@id": "https://avatars.outpacestudios.com/#organization",
			name: "Outpace Studios",
			url: "https://outpacestudios.com",
			logo: {
				"@type": "ImageObject",
				url: "https://outpacestudios.com/favicon.svg",
			},
			sameAs: [
				"https://www.linkedin.com/company/outpacestudios/",
				"https://twitter.com/outpacestudios",
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
		default: "Gradient avatars for every seed - Outpace Studios",
		template: "%s - Outpace Studios",
	},
	description:
		"Deterministic gradient avatars — a unique gradient for every seed. Free, colorful profile pictures for apps, products, and brands.",
	keywords: [
		"gradient avatars",
		"free avatars",
		"profile pictures",
		"colorful avatars",
		"gradient pfp",
		"free profile pics",
		"abstract avatars",
	],
	authors: [{ name: "Outpace Studios", url: "https://outpacestudios.com" }],
	creator: "Outpace Studios",
	publisher: "Outpace Studios",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://avatars.outpacestudios.com",
		siteName: "Outpace Studios",
		title: "Gradient avatars for every seed - by Outpace Studios",
		description:
			"Deterministic gradient avatars — a unique gradient for every seed. Free, colorful profile pictures for apps, products, and brands",
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
		title: "Gradient avatars for every seed - by Outpace Studios",
		description:
			"Deterministic gradient avatars — a unique gradient for every seed. Free to use.",
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
		canonical: "https://avatars.outpacestudios.com",
	},
	category: "Design Resources",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
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
