
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para SPA + PWA
  output: 'export', // Exportar como SPA estática
  distDir: 'out', // Directorio de salida
  images: {
    unoptimized: true, // Requerido para export estático
    formats: ['image/avif', 'image/webp'], // Formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ⚡ PERFORMANCE OPTIMIZATIONS
  poweredByHeader: false, // Quitar header X-Powered-By por seguridad
  
  // Permitir conexiones desde la red local
  allowedDevOrigins: ['192.168.100.174'],
  
  // Configuración de trailing slash para compatibilidad
  trailingSlash: true,
  
  // NOTA: swcMinify está habilitado por defecto en Next.js 15+
  // NOTA: compress no funciona con output: 'export' (requiere servidor)
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Configuración del cliente para SPA
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // ⚡ OPTIMIZATION: Code splitting mejorado
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para librerías grandes
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Firebase en chunk separado
            firebase: {
              name: 'firebase',
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              chunks: 'all',
              priority: 30
            },
            // MSAL en chunk separado
            msal: {
              name: 'msal',
              test: /[\\/]node_modules[\\/](@azure\/msal)[\\/]/,
              chunks: 'all',
              priority: 30
            },
            // React y libs comunes
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10
            }
          }
        }
      };
      
      return config;
    }
    
    // En el servidor, excluir módulos problemáticos
    config.externals = config.externals || [];
    config.externals.push({
      'undici': 'commonjs undici',
      '@firebase/storage': 'commonjs @firebase/storage',
    });
    
    // Configurar el cache para que funcione mejor con OneDrive
    if (dev) {
      config.cache = false;
    }
    
    return config;
  },
  
  // NOTA: Los headers de seguridad se configuran en vercel.json o netlify.toml
  // No funcionan con output: 'export' porque requieren un servidor
};

export default nextConfig;
