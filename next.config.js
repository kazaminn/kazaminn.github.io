/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  images: {
    loader: 'custom',
    imageSizes: [],
    // コンテンツ用 (モバイルRetina(640), Tailwind lg(1024), 最大(1920))
    deviceSizes: [640, 1024, 1920],
  },
  transpilePackages: ['next-image-export-optimizer'],
  env: {
    nextImageExportOptimizer_imageFolderPath: 'public/images',
    nextImageExportOptimizer_exportFolderPath: 'dist',
    nextImageExportOptimizer_exportFolderName: 'optimized',
    nextImageExportOptimizer_quality: '75',
    nextImageExportOptimizer_storePicturesInWEBP: 'true',
    nextImageExportOptimizer_generateAndUseBlurImages: 'false',
    nextImageExportOptimizer_remoteImageCacheTTL: '0',
  },
};

module.exports = nextConfig;
