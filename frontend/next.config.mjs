/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境禁用 sourcemap，减小构建体积
  productionBrowserSourceMaps: false,

  // 开发环境优化配置
  experimental: {
    // 减少内存占用
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Webpack 配置（适用于非 Turbopack 模式）
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 开发环境减少内存占用
      config.cache = false; // 禁用持久化缓存
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
