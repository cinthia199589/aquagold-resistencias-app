# 📦 Comandos para subir cambios SPA + PWA a GitHub

## ⚠️ Importante
Git no está instalado o no está en el PATH de tu sistema.

## 🔧 Solución 1: Instalar Git

1. Descargar Git para Windows: https://git-scm.com/download/win
2. Instalar con opciones por defecto
3. Reiniciar terminal
4. Ejecutar comandos abajo

## 🔧 Solución 2: Usar Git Bash (si ya tienes Git)

Abrir **Git Bash** (no PowerShell) y ejecutar:

```bash
cd "c:\Users\lorganoleptico\OneDrive - AQUAGOLD S.A\ARCHIVOS PROGRAMAS\resistencias-app"

# Agregar archivos modificados
git add next.config.mjs
git add package.json
git add vercel.json
git add public/sw.js
git add public/manifest.json
git add README.md

# Agregar archivos nuevos
git add scripts/post-build.js
git add netlify.toml
git add firebase.json
git add SPA_PWA_GUIA_COMPLETA.md
git add SPA_PWA_QUICKSTART.md
git add COMANDOS_UTILES.md
git add RESUMEN_CONVERSION_SPA_PWA.md
git add SSR_VS_SPA_EXPLICADO.md
git add DEPLOY_RAPIDO.md

# Ver qué se va a subir
git status

# Commit
git commit -m "feat: Convertir a SPA + PWA v2.0

- Configuracion Next.js para export estatico (SPA)
- Service Worker mejorado con cache inteligente
- PWA completa (instalable, offline-ready)
- Scripts de build optimizados
- Configuraciones para Vercel, Netlify y Firebase
- Documentacion completa de SPA + PWA"

# Push a GitHub
git push origin main
```

## 🔧 Solución 3: Usar GitHub Desktop

1. Abrir **GitHub Desktop**
2. Seleccionar el repositorio `resistencias-app`
3. Verás todos los archivos modificados en la lista
4. Seleccionar los siguientes archivos:
   - ✓ next.config.mjs
   - ✓ package.json
   - ✓ vercel.json
   - ✓ public/sw.js
   - ✓ public/manifest.json
   - ✓ README.md
   - ✓ scripts/post-build.js
   - ✓ netlify.toml
   - ✓ firebase.json
   - ✓ SPA_PWA_GUIA_COMPLETA.md
   - ✓ SPA_PWA_QUICKSTART.md
   - ✓ COMANDOS_UTILES.md
   - ✓ RESUMEN_CONVERSION_SPA_PWA.md
   - ✓ SSR_VS_SPA_EXPLICADO.md
   - ✓ DEPLOY_RAPIDO.md
5. Escribir mensaje de commit: "feat: Convertir a SPA + PWA v2.0"
6. Click en "Commit to main"
7. Click en "Push origin"

## 🔧 Solución 4: Usar VS Code

1. Abrir el proyecto en VS Code
2. Click en el icono de "Source Control" (Ctrl+Shift+G)
3. Verás la lista de archivos modificados
4. Click en "+" al lado de cada archivo para staged:
   - next.config.mjs
   - package.json
   - vercel.json
   - public/sw.js
   - public/manifest.json
   - README.md
   - scripts/post-build.js
   - netlify.toml
   - firebase.json
   - SPA_PWA_GUIA_COMPLETA.md
   - SPA_PWA_QUICKSTART.md
   - COMANDOS_UTILES.md
   - RESUMEN_CONVERSION_SPA_PWA.md
   - SSR_VS_SPA_EXPLICADO.md
   - DEPLOY_RAPIDO.md
5. Escribir mensaje: "feat: Convertir a SPA + PWA v2.0"
6. Click en ✓ (Commit)
7. Click en "Sync Changes" o "Push"

## 📋 Lista de archivos modificados

### Archivos modificados (6):
- next.config.mjs (configuración SPA)
- package.json (scripts nuevos)
- vercel.json (config deployment)
- public/sw.js (Service Worker mejorado)
- public/manifest.json (ya existía)
- README.md (actualizado con SPA info)

### Archivos nuevos (9):
- scripts/post-build.js
- netlify.toml
- firebase.json
- SPA_PWA_GUIA_COMPLETA.md
- SPA_PWA_QUICKSTART.md
- COMANDOS_UTILES.md
- RESUMEN_CONVERSION_SPA_PWA.md
- SSR_VS_SPA_EXPLICADO.md
- DEPLOY_RAPIDO.md

## ✅ Después de subir

Verifica en GitHub que los archivos estén subidos:
https://github.com/TU_USUARIO/resistencias-app

---

**Nota**: Si usas Visual Studio Code, es la forma más fácil de hacer commit y push sin necesidad de terminal.
