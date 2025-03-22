import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  env: {
    LOCAL_STORAGE_URL: process.env.LOCAL_STORAGE_URL,
  },
  images: {
    domains: [
      'placehold.co',
      'localhost',
      'lh3.googleusercontent.com', // Allow Google profile images
    ],
  },

  
};

export const config = {
  unstable_runtimeJS: true,
};

export default nextConfig;
