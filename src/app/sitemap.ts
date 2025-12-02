import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://avatars.outpace.systems',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    }
  ];
}
