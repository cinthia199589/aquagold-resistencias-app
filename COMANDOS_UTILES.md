# 📋 Comandos Útiles - SPA + PWA

## 🛠️ Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Servidor dev accesible desde red local
npm run dev
# Acceso: http://192.168.100.174:8080

# Desarrollo con HTTPS (requiere certificados)
npm run dev:all
```

## 🏗️ Build

```bash
# Build completo SPA + PWA
npm run build:pwa

# Solo build Next.js
npm run build

# Build específico para Vercel
npm run build:vercel
```

## 🚀 Deploy

### Vercel
```bash
# Instalar CLI (una sola vez)
npm i -g vercel

# Login (una sola vez)
vercel login

# Deploy a preview
vercel

# Deploy a producción
vercel --prod

# Ver logs
vercel logs
```

### Netlify
```bash
# Instalar CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy draft
netlify deploy --dir=out

# Deploy a producción
netlify deploy --prod --dir=out
```

### Firebase
```bash
# Instalar CLI
npm i -g firebase-tools

# Login
firebase login

# Inicializar (una sola vez)
firebase init hosting

# Deploy
firebase deploy --only hosting

# Ver URL
firebase open hosting:site
```

## 🧪 Testing Local

```bash
# Servir carpeta out/ (después de build)
npm run start:spa

# O con serve global
npx serve out -p 8080

# O con http-server
npx http-server out -p 8080
```

## 🔍 Debugging

### Service Worker
```bash
# Chrome DevTools
# F12 → Application → Service Workers
# - Ver estado (activated/waiting)
# - Update on reload
# - Bypass for network
# - Unregister

# Ver caché
# F12 → Application → Cache Storage
```

### PWA Manifest
```bash
# Chrome DevTools
# F12 → Application → Manifest
# - Ver manifest.json
# - Verificar iconos
# - Test de instalación
```

### Lighthouse Audit
```bash
# Chrome DevTools
# F12 → Lighthouse
# - Progressive Web App ✓
# - Performance ✓
# - Best Practices ✓
# - Accessibility ✓
# - SEO ✓
# Generate report
```

## 🧹 Limpieza

```bash
# Limpiar node_modules
rm -rf node_modules
npm install --legacy-peer-deps

# Limpiar cache Next.js
rm -rf .next

# Limpiar build output
rm -rf out

# Limpiar todo y reinstalar
rm -rf node_modules .next out
npm install --legacy-peer-deps
npm run build:pwa
```

## 📦 Mantenimiento

```bash
# Ver versión de paquetes
npm list --depth=0

# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Corregir vulnerabilidades
npm audit fix

# Ver tamaño del bundle
npm run build:pwa
# Analizar archivos en out/_next/static/
```

## 🎯 Variables de Entorno

### Desarrollo (.env.local)
```bash
# Ver variables actuales
cat .env.local

# Editar variables
notepad .env.local  # Windows
nano .env.local     # Linux/Mac
```

### Producción (Vercel)
```bash
# Configurar variables en Vercel
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY

# O en el dashboard
# https://vercel.com/tu-usuario/tu-proyecto/settings/environment-variables
```

## 📊 Análisis

### Bundle Size
```bash
# Instalar analyzer
npm install --save-dev @next/bundle-analyzer

# Analizar (requiere config en next.config.mjs)
ANALYZE=true npm run build
```

### Performance
```bash
# Lighthouse CLI
npm install -g lighthouse

# Análisis local
lighthouse http://localhost:8080 --view

# Análisis producción
lighthouse https://tu-app.vercel.app --view
```

## 🔐 Certificados SSL (Dev local)

```bash
# Generar certificados autofirmados
npm run generate-cert

# Iniciar dev server con HTTPS
npm run dev:https

# O ambos (HTTP + HTTPS)
npm run dev:all
```

## 📱 Testing Mobile

### Android (Chrome Remote Debugging)
```bash
# 1. Conectar dispositivo Android por USB
# 2. Habilitar "Depuración USB" en opciones de desarrollador
# 3. Chrome → chrome://inspect
# 4. Seleccionar dispositivo
# 5. Abrir app: http://192.168.100.174:8080
```

### iOS (Safari Web Inspector)
```bash
# 1. Conectar iPhone/iPad
# 2. Habilitar "Inspector Web" en Safari (Ajustes → Safari → Avanzado)
# 3. Safari en Mac → Desarrollador → [Tu dispositivo]
# 4. Abrir app en dispositivo
```

## 🎨 Iconos PWA

```bash
# Generar iconos desde SVG
node generate-icons.js

# Verificar iconos
ls -la public/icon-*
```

## 🔄 Git

```bash
# Estado actual
git status

# Commit cambios
git add .
git commit -m "Convertido a SPA + PWA"

# Push
git push origin main

# Ver historial
git log --oneline
```

## ⚡ Scripts Personalizados

```bash
# Ver todos los scripts disponibles
npm run

# Agregar nuevo script en package.json
# "mi-script": "comando"

# Ejecutar
npm run mi-script
```

## 🆘 Ayuda Rápida

```bash
# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Ver versión de Next.js
npx next --version

# Limpiar npm cache
npm cache clean --force
```

---

💡 **Tip**: Guarda este archivo como referencia rápida de comandos.
