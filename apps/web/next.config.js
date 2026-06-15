const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-apis",
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: /\/api\/v1\/content\/resources/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-resources",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/api\/v1\/learning/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-learning",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 2 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

module.exports = withPWA(nextConfig);
