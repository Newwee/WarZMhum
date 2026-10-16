/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double-mounting WebGL contexts during dev
  transpilePackages: ['three'],
};

export default nextConfig;
