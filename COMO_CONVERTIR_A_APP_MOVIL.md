# 📱 Cómo Convertir la Aplicación Web en App Móvil

## Opción 1: PWA (Progressive Web App) - ⭐ RECOMENDADA Y MÁS FÁCIL

### ✅ Ventajas:
- **Más fácil y rápido** (no necesitas publicar en tiendas)
- **Funciona en Android e iOS**
- Instalable desde el navegador
- Se actualiza automáticamente
- No necesitas cuenta de desarrollador

### 📝 Pasos:

#### 1. Crear el archivo `manifest.json` en la carpeta `public/`:

```json
{
  "name": "Aquagold Resistencias",
  "short_name": "Resistencias",
  "description": "Sistema de gestión de pruebas de resistencia de camarones",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 2. Crear iconos:
- Crea un ícono cuadrado de 512x512px con el logo de Aquagold
- Guárdalo como `public/icon-512.png`
- Crea una versión de 192x192px y guárdala como `public/icon-192.png`

#### 3. Actualizar `app/layout.tsx`:

Agrega en el `<head>`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2563eb" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

#### 4. Registrar Service Worker (opcional pero recomendado):

Crea `public/sw.js`:
```javascript
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', (event) => {
  // Cache básico
});
```

#### 5. Desplegar en producción:
```bash
npm run build
```

Luego sube a Vercel, Netlify o cualquier hosting que soporte HTTPS.

#### 6. Instalar en el celular:

**Android (Chrome/Edge):**
1. Abre la app en el navegador
2. Presiona el menú (⋮)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! Se verá como una app nativa

**iOS (Safari):**
1. Abre la app en Safari
2. Presiona el botón compartir (□↑)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo!

---

## Opción 2: Capacitor (App Nativa Real)

### ✅ Ventajas:
- App nativa en Play Store / App Store
- Acceso completo a funciones del teléfono
- Mejor rendimiento
- Logo y nombre oficial

### ❌ Desventajas:
- Más complejo
- Necesitas cuentas de desarrollador ($25 Play Store, $99/año App Store)
- Proceso de revisión y aprobación

### 📝 Pasos:

#### 1. Instalar Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

Responde:
- App name: **Aquagold Resistencias**
- Package ID: **com.aquagold.resistencias**
- Web asset directory: **out**

#### 2. Instalar plataformas:
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios  # Solo si tienes Mac para iOS
```

#### 3. Configurar Next.js para exportación estática:

En `next.config.mjs`:
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}
```

#### 4. Build y sincronizar:
```bash
npm run build
npx cap sync
```

#### 5. Abrir en Android Studio / Xcode:
```bash
npx cap open android  # Para Android
npx cap open ios      # Para iOS (solo en Mac)
```

#### 6. Configurar permisos en Android:

Edita `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

#### 7. Generar APK/AAB:
En Android Studio:
- Build → Generate Signed Bundle / APK
- Crea un keystore
- Firma la app
- Sube a Play Store

---

## Opción 3: Expo + React Native (Reescribir desde cero)

### ❌ NO RECOMENDADA para este proyecto
- Tendrías que reescribir TODA la app
- Pierdes todo el código actual
- Más tiempo de desarrollo

---

## 🎯 Recomendación Final

### Para uso interno/empresa: 
**Usa PWA (Opción 1)** - Es la más fácil y funciona perfectamente. Solo necesitas:
1. Crear los archivos manifest e iconos
2. Desplegar en Vercel/Netlify (gratis)
3. Los usuarios instalan desde el navegador

### Para distribución pública en tiendas:
**Usa Capacitor (Opción 2)** - Te da una app nativa real, pero requiere más configuración.

---

## 📞 Soporte

Si necesitas ayuda con alguno de estos pasos, avísame y te ayudo a:
1. Crear los archivos necesarios
2. Configurar el manifest
3. Generar los iconos
4. Desplegar en producción

¿Por cuál opción quieres ir? Te recomiendo empezar con PWA (Opción 1) porque es rápido y funcional.
