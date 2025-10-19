
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
  
  // NOTA: Los headers de seguridad se configuran en vercel.json o netlify.toml
  // No funcionan con output: 'export' porque requieren un servidor
};

export default nextConfig;
