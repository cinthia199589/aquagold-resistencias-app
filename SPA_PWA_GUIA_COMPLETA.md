# 🚀 Guía: SPA + PWA - Aquagold Resistencias

## ✅ ¿Qué es una SPA + PWA?

### SPA (Single Page Application)
- **Una sola página** que se carga inicialmente
- Navegación instantánea sin recargas
- Todo el contenido se genera dinámicamente con JavaScript
- Mejor rendimiento y experiencia de usuario

### PWA (Progressive Web App)
- **Se instala como app nativa** en cualquier dispositivo
- Funciona **offline** con datos cacheados
- Notificaciones push
- Actualizaciones automáticas
- Acceso desde el home screen del móvil

## 📦 Cambios Realizados

### 1. **next.config.mjs** - Configuración SPA
```javascript
output: 'export',        // Exportar como SPA estática
distDir: 'out',          // Carpeta de salida
images: { unoptimized: true },
trailingSlash: true,     // URLs amigables
```

### 2. **package.json** - Nuevos Scripts
```json
"build:spa": "next build && npm run postbuild"
"build:pwa": "npm run build:spa && echo '✓ SPA + PWA build completada'"
"start:spa": "npx serve out -p 8080"
```

### 3. **Service Worker Mejorado** (`public/sw.js`)
- ✅ Cache inteligente (Network First + Cache First)
- ✅ Soporte offline completo
- ✅ Sincronización en background
- ✅ Notificaciones push ready
- ✅ Optimizado para Firebase y OneDrive

### 4. **Post-Build Script** (`scripts/post-build.js`)
- Copia automática de archivos PWA
- Genera headers de seguridad
- Optimiza el cache

## 🔨 Cómo Usar

### Desarrollo Local
```bash
# Desarrollo normal (modo servidor)
npm run dev

# Desarrollo en red local
npm run dev
# Accede desde: http://192.168.100.174:8080
```

### Build SPA + PWA
```bash
# Construir SPA + PWA
npm run build:pwa

# La carpeta 'out/' contendrá tu SPA completa
```

### Servir SPA Localmente
```bash
# Servir la SPA construida
npm run start:spa

# O instalar serve globalmente:
npm install -g serve
serve out -p 8080
```

## 🌐 Deployment

### Opción 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Vercel automáticamente:
# - Detecta Next.js con output: 'export'
# - Configura CDN global
# - HTTPS automático
# - Actualizaciones instantáneas
```

### Opción 2: Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Build
npm run build:pwa

# Deploy
netlify deploy --prod --dir=out
```

### Opción 3: Firebase Hosting
```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting
# - Public directory: out
# - Single-page app: Yes
# - GitHub deploys: opcional

# Build
npm run build:pwa

# Deploy
firebase deploy --only hosting
```

### Opción 4: GitHub Pages
```bash
# 1. Build
npm run build:pwa

# 2. Crear .nojekyll en out/
echo "" > out/.nojekyll

# 3. Push a rama gh-pages
git subtree push --prefix out origin gh-pages
```

### Opción 5: Servidor Propio (Apache/Nginx)
```bash
# Build
npm run build:pwa

# Copiar carpeta out/ a tu servidor
scp -r out/* user@server:/var/www/html/resistencias/

# Configurar Apache (.htaccess):
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# O Nginx:
location / {
  try_files $uri $uri/ /index.html;
}
```

## 📱 Instalar como App

### En Android/iOS (Chrome/Safari)
1. Abre la app en el navegador
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. ¡Listo! Ahora funciona como app nativa

### En Windows/Mac (Chrome/Edge)
1. Abre la app en el navegador
2. Icono de instalación (⊕) en la barra de direcciones
3. Clic en "Instalar"

## 🔍 Verificar PWA

### Lighthouse Audit (Chrome DevTools)
```
1. F12 → Lighthouse
2. Seleccionar "Progressive Web App"
3. Click "Analyze page load"
4. Objetivo: Score > 90
```

### PWA Builder
```
https://www.pwabuilder.com/
- Ingresa tu URL
- Analiza PWA score
- Genera packages para stores
```

## 🎯 Características PWA

### ✅ Instalable
- Manifest.json configurado
- Service Worker activo
- HTTPS (en producción)

### ✅ Offline First
- Caché inteligente
- Datos persisten sin conexión
- Sincronización automática

### ✅ App-like
- Sin barra del navegador
- Splash screen
- Iconos nativos

### ✅ Rendimiento
- Carga instantánea (cached)
- Navegación fluida
- Optimizado para móviles

## 📊 Estructura de Archivos SPA

```
out/
├── index.html              # Página principal
├── dashboard.html          # Dashboard
├── dashboard/
│   └── tests/
│       └── new.html        # Nueva resistencia
├── _next/                  # Assets de Next.js
│   ├── static/
│   └── ...
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── icon-192.svg            # Icono PWA
├── icon-512.svg            # Icono PWA
└── _headers                # Headers de seguridad
```

## 🔐 Variables de Entorno

### Para Build SPA
Crear `.env.local`:
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Azure AD / MSAL
NEXT_PUBLIC_MSAL_CLIENT_ID=your-client-id
NEXT_PUBLIC_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
NEXT_PUBLIC_MSAL_REDIRECT_URI=https://your-domain.com
```

⚠️ **IMPORTANTE**: Las variables DEBEN tener prefijo `NEXT_PUBLIC_` para estar disponibles en el cliente (SPA).

## 🐛 Troubleshooting

### Error: "Image optimization requires a server"
✅ Ya configurado: `images: { unoptimized: true }`

### Error: "API routes not supported with output: export"
❌ Las API routes de Next.js no funcionan en SPA
✅ Usa Firebase Functions o servicios externos

### Service Worker no se actualiza
```bash
# 1. Cambiar CACHE_NAME en sw.js
# 2. Rebuild
npm run build:pwa

# 3. En DevTools:
Application → Service Workers → Update
```

### App no se instala
1. Verificar manifest.json
2. Verificar HTTPS (en producción)
3. Verificar Service Worker activo
4. Chrome DevTools → Application → Manifest

### Offline no funciona
1. Verificar Service Worker registrado
2. Check console para errores de cache
3. Application → Cache Storage → verificar archivos

## 📈 Optimizaciones Adicionales

### 1. Code Splitting (Ya incluido por Next.js)
```javascript
// Next.js automáticamente hace code-splitting
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./Component'), {
  loading: () => <p>Cargando...</p>,
});
```

### 2. Lazy Loading de Imágenes
```javascript
// Ya optimizado en Next.js
<Image src="/photo.jpg" alt="..." loading="lazy" />
```

### 3. Comprimir Assets
```bash
# Instalar
npm install -g gzip-static

# Comprimir
gzip-static out/**/*.{js,css,html}
```

## 🎨 Personalización PWA

### Cambiar Colores
Editar `public/manifest.json`:
```json
{
  "theme_color": "#2563eb",      // Color de la barra superior
  "background_color": "#ffffff"   // Color de splash screen
}
```

### Cambiar Iconos
1. Crear iconos 192x192 y 512x512
2. Actualizar en `public/manifest.json`
3. Reconstruir: `npm run build:pwa`

### Personalizar Splash Screen
```json
{
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "display": "standalone"
}
```

## 📚 Recursos

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox (Google PWA Tools)](https://developers.google.com/web/tools/workbox)

## ✅ Checklist Final

- [ ] Build SPA exitoso: `npm run build:pwa`
- [ ] Service Worker activo en DevTools
- [ ] Manifest.json válido
- [ ] Variables de entorno configuradas
- [ ] Lighthouse PWA score > 90
- [ ] Funciona offline
- [ ] Se puede instalar como app
- [ ] HTTPS en producción
- [ ] Deployed en hosting

---

**¡Tu app ahora es una SPA + PWA completa!** 🎉
