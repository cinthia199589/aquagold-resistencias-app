# Instrucciones para Subir a GitHub

## ✅ Estado Actual

- ✅ Repositorio Git inicializado
- ✅ Todos los archivos agregados
- ✅ Commit realizado con mensaje descriptivo
- ✅ Build exitoso (listo para Vercel)

## 📝 Commit Realizado

```
Fix: Campos decimales aceptan punto y coma + Fix error autenticación MSAL

- Corrección campos SO2 residuales: ahora aceptan punto (.) y coma (,)
- Corrección campos unidades (crudo/cocido): aceptan decimales
- Fix error 'No hay cuenta activa' en subida de fotos
- Mejora autenticación MSAL con recuperación automática
- Optimización para móviles con inputMode decimal
- App lista para despliegue en Vercel (SPA+PWA)
```

## 🚀 Siguiente Paso: Conectar con GitHub

### Opción 1: Si ya tienes el repositorio en GitHub

```powershell
# Agregar el remote
& "C:\Users\lorganoleptico\AppData\Local\GitHubDesktop\app-3.5.3\resources\app\git\cmd\git.exe" remote add origin https://github.com/TU_USUARIO/resistencias-app.git

# Hacer push
& "C:\Users\lorganoleptico\AppData\Local\GitHubDesktop\app-3.5.3\resources\app\git\cmd\git.exe" push -u origin main
```

### Opción 2: Si necesitas crear el repositorio

1. Ve a https://github.com/new
2. Nombre: `resistencias-app` o `aquagold-resistencias`
3. Descripción: "App para pruebas de resistencia de camarón - Aquagold"
4. Visibilidad: Privado (recomendado por seguridad)
5. **NO** marcar "Initialize with README" (ya tenemos archivos)
6. Click en "Create repository"
7. GitHub te mostrará los comandos, úsalos con la ruta completa de Git

### Opción 3: Usar GitHub Desktop (Más fácil)

1. Abre GitHub Desktop
2. File → Add Local Repository
3. Selecciona esta carpeta: `C:\Users\lorganoleptico\OneDrive - AQUAGOLD S.A\ARCHIVOS PROGRAMAS-nuevo\resistencias-app`
4. Click en "Publish repository"
5. Elige nombre y privacidad
6. Click "Publish repository"

## 📦 Deployment en Vercel

Una vez que esté en GitHub:

1. Ve a https://vercel.com
2. Import Project → Import Git Repository
3. Selecciona el repositorio `resistencias-app`
4. **Framework Preset**: Next.js (detectado automáticamente)
5. **Build Command**: `npm run build` (ya configurado)
6. **Output Directory**: `out` (ya configurado en next.config.mjs)
7. Agregar variables de entorno (desde `.env.local`):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_MSAL_CLIENT_ID`
   - `NEXT_PUBLIC_MSAL_TENANT_ID`
8. Click "Deploy"

## 🔧 Cambios Incluidos

### 1. Campos Decimales
- ✅ SO2 MW y SO2 BF: aceptan punto y coma
- ✅ Unidades Crudo/Cocido: aceptan punto y coma
- ✅ `inputMode="decimal"` para teclado móvil optimizado

### 2. Autenticación MSAL
- ✅ Fix error "No hay cuenta activa"
- ✅ Login popup automático cuando expira sesión
- ✅ Recuperación automática de tokens
- ✅ Validación antes de operaciones críticas

### 3. Optimización Móvil
- ✅ Entrada fluida de decimales
- ✅ Teclado numérico en móviles
- ✅ Sin bloqueos al escribir

### 4. SPA + PWA
- ✅ Configurado para `output: 'export'`
- ✅ Service Worker funcional
- ✅ Manifest.json configurado
- ✅ Build optimizado para Vercel

## ✅ Verificación

```powershell
# Ver commits
& "C:\Users\lorganoleptico\AppData\Local\GitHubDesktop\app-3.5.3\resources\app\git\cmd\git.exe" log --oneline

# Ver archivos en staging
& "C:\Users\lorganoleptico\AppData\Local\GitHubDesktop\app-3.5.3\resources\app\git\cmd\git.exe" status
```

---
**Fecha**: 2025-01-17
**Build Status**: ✅ Exitoso
**Ready for**: GitHub Push → Vercel Deploy
