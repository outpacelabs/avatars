import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	// Consolidate the legacy domain onto avatars.outpacestudios.com (308, all paths).
	async redirects() {
		return [
			{
				source: "/:path*",
				has: [{ type: "host", value: "avatars.outpace.systems" }],
				destination: "https://avatars.outpacestudios.com/:path*",
				permanent: true,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://us.i.posthog.com/:path*",
			},
		];
	},
	// This is required to support PostHog trailing slash API requests
	skipTrailingSlashRedirect: true,
};

export default nextConfig;
