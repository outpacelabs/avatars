import type { MetadataRoute } from "next";

const baseUrl = "https://avatars.outpacestudios.com";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date().toISOString();

	return [
		{
			url: baseUrl,
			lastModified,
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${baseUrl}/docs`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];
}
