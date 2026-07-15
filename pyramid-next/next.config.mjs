/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  
  transpilePackages: ['onnxruntime-web', '@huggingface/transformers'],
  
  // For Next.js 14, external packages for server components are configured under experimental
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node'],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js-only packages from client compilation
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        'onnxruntime-node$': false,
      };

      // Exclude the pre-built ONNX Runtime Web bundle from minification to avoid Terser import.meta syntax errors
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.options) {
            const originalExclude = minimizer.options.exclude;
            minimizer.options.exclude = originalExclude
              ? [].concat(originalExclude, /ort\.bundle\.min/)
              : /ort\.bundle\.min/;
          }
        });
      }
    }
    return config;
  },
};

export default nextConfig;
