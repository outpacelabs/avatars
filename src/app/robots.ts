import type { MetadataRoute } from "next";

// Single-sourced from the canonical host so it can never drift from
// metadataBase (the old static robots.txt pointed at a legacy domain).
const baseUrl = "https://avatars.outpacestudios.com";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{ userAgent: "*", allow: "/", disallow: ["/_next/"] },
			// AI crawlers explicitly welcomed.
			{ userAgent: "GPTBot", allow: "/" },
			{ userAgent: "ChatGPT-User", allow: "/" },
			{ userAgent: "OAI-SearchBot", allow: "/" },
			{ userAgent: "ClaudeBot", allow: "/" },
			{ userAgent: "Claude-Web", allow: "/" },
			{ userAgent: "anthropic-ai", allow: "/" },
			{ userAgent: "PerplexityBot", allow: "/" },
			{ userAgent: "Google-Extended", allow: "/" },
			{ userAgent: "CCBot", allow: "/" },
		],
		sitemap: `${baseUrl}/sitemap.xml`,
		host: baseUrl,
	};
}
