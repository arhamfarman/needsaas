/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ }
    ];
    return config;
  },
};

module.exports = nextConfig;
