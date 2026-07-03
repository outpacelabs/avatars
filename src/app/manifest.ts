import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Beautiful Generative Gradient Avatars by Outpace Studios",
		short_name: "Avatars",
		description:
			"Beautiful generative gradient avatars, free to use. Every seed renders a unique gradient.",
		start_url: "/",
		display: "standalone",
		background_color: "#0A0A0A",
		theme_color: "#0A0A0A",
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png" },
		],
	};
}
