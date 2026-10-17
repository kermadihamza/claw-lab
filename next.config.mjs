/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Les photos de factures/dépenses (uploadées via Server Actions) peuvent peser plusieurs Mo.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
