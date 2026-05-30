import type { Metadata, Viewport } from "next";
import "./globals.css";

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebPage",
			"@id": "https://avatars.outpace.systems/#webpage",
			name: "Beautifully handcrafted gradients",
			description:
				"Beautifully handcrafted gradient avatars, free to use under CC BY 4.0",
			url: "https://avatars.outpace.systems",
			publisher: {
				"@id": "https://avatars.outpace.systems/#organization",
			},
			license: "https://creativecommons.org/licenses/by/4.0/",
			isAccessibleForFree: true,
		},
		{
			"@type": "Organization",
			"@id": "https://avatars.outpace.systems/#organization",
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
	metadataBase: new URL("https://avatars.outpace.systems"),
	title: {
		default: "Beautifully handcrafted gradients - Outpace Studios",
		template: "%s - Outpace Studios",
	},
	description:
		"Beautifully handcrafted gradient avatars, free to use. Beautiful colorful profile pictures for apps, products, and brands.",
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
		url: "https://avatars.outpace.systems",
		siteName: "Outpace Studios",
		title: "Beautifully handcrafted gradients - by Outpace Studios",
		description:
			"Beautifully handcrafted gradient avatars, free to use. Beautiful colorful profile pictures for apps, products, and brands",
		images: [
			{
				url: "/meta.jpg",
				width: 1200,
				height: 630,
				alt: "Beautifully handcrafted gradients by Outpace Studios",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Beautifully handcrafted gradients - by Outpace Studios",
		description: "Beautifully handcrafted gradient avatars, free to use.",
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
		canonical: "https://avatars.outpace.systems",
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
