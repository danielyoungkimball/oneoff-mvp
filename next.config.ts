/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['cdn.ssense.com', 'img.mytheresa.com', '...'], // whitelist sources
  },
};

export default nextConfig;
