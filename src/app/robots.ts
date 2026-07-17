import { MetadataRoute } from 'next'

const BASE_URL = 'https://promptmaster.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/challenges', '/login', '/signup'],
        disallow: ['/dashboard', '/admin', '/api/', '/certificate-preview'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
