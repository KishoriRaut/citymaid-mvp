import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://citymaid.com';

  // Add your static routes
  const routes = [
    '',
    '/contact',
    '/find-maids',
    '/find-jobs',
    '/post-job',
    '/login',
    '/employers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
} 