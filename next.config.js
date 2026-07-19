/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}
module.exports = nextConfig
