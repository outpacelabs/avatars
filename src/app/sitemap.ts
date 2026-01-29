import type { MetadataRoute } from "next";

const baseUrl = "https://avatars.outpace.systems";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date().toISOString();

	return [
		{
			url: baseUrl,
			lastModified,
			changeFrequency: "monthly",
			priority: 1,
		},
	];
}
