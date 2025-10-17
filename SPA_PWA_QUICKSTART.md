# SPA + PWA - Quick Start Guide

## 🚀 Build & Deploy en 3 Pasos

### 1️⃣ Build
```bash
npm run build:pwa
```

### 2️⃣ Test Local
```bash
npm run start:spa
# Abre: http://localhost:8080
```

### 3️⃣ Deploy

#### Vercel (Más Fácil)
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=out
```

#### Firebase
```bash
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

## ✅ Verificar PWA

1. Chrome DevTools → Lighthouse
2. Seleccionar "Progressive Web App"
3. Click "Generate report"
4. Score debe ser > 90

## 📱 Instalar como App

**Android/iOS:**
Menu → "Agregar a pantalla de inicio"

**Desktop:**
Icono ⊕ en barra de direcciones → "Instalar"

## 🔍 Troubleshooting

### Service Worker no actualiza
```bash
# Cambiar versión en public/sw.js
const CACHE_NAME = 'aquagold-resistencias-v2.X.X';

# Rebuild
npm run build:pwa
```

### App no se instala
1. Verificar HTTPS (en producción)
2. DevTools → Application → Manifest (debe estar ✓)
3. DevTools → Application → Service Workers (debe estar activo)

### Offline no funciona
1. DevTools → Application → Service Workers → debe estar "activated"
2. Verificar en "Cache Storage" que hay archivos cacheados

## 📊 Archivos Importantes

```
out/                    # SPA compilada (deploy esta carpeta)
public/sw.js           # Service Worker
public/manifest.json   # PWA Manifest
scripts/post-build.js  # Script de optimización
```

## 🌐 URLs después de Deploy

- Vercel: `https://tu-proyecto.vercel.app`
- Netlify: `https://tu-proyecto.netlify.app`
- Firebase: `https://tu-proyecto.web.app`

---

Para más detalles, ver: **SPA_PWA_GUIA_COMPLETA.md**
