import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Gradient Avatars by Outpace Studios",
		short_name: "Avatars",
		description: "50 handcrafted gradient avatars, free to use",
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
