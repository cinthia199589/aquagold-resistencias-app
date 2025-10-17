
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para SPA + PWA
  output: 'export', // Exportar como SPA estática
  distDir: 'out', // Directorio de salida
  images: {
    unoptimized: true, // Requerido para export estático
  },
  
  // Permitir conexiones desde la red local
  allowedDevOrigins: ['192.168.100.174'],
  
  // Configuración de trailing slash para compatibilidad
  trailingSlash: true,
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Configuración del cliente para SPA
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
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
  
  // Headers de seguridad para PWA
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
