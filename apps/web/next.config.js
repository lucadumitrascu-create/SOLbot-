/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@solbot/shared"],
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
