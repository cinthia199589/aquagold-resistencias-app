# Configuración Vercel - React 19 vs MSAL Fix

## Problema Resuelto
- Conflictos de dependencias entre React 19 y Azure MSAL
- Errores de peer dependencies en Vercel

## Cambios Aplicados

### 1. package.json
```json
{
  "overrides": {
    "@azure/msal-react": {
      "react": "$react",
      "react-dom": "$react-dom"
    },
    "@azure/msal-browser": {
      "react": "$react", 
      "react-dom": "$react-dom"
    }
  },
  "resolutions": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

### 2. .npmrc
```
legacy-peer-deps=true
strict-peer-deps=false
auto-install-peers=true
```

### 3. vercel.json
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps"
}
```

## Variables de Entorno en Vercel

### Configurar en Dashboard Vercel:
1. Ir a tu proyecto → Settings → Environment Variables
2. Agregar estas variables:

```
NEXT_PUBLIC_AZURE_CLIENT_ID=bf20eec1-debc-4c81-a275-9de5b6f229aa
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/common
NEXT_PUBLIC_AZURE_REDIRECT_URI=https://aquagold-shrimp-resistance.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBCcK3zGQlAE-8HQkOxK5DYfGj8XgWsY6c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-6276322063-5d9d6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-6276322063-5d9d6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-6276322063-5d9d6.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=62763220638
NEXT_PUBLIC_FIREBASE_APP_ID=1:62763220638:web:abc123def456ghi789
NEXT_PUBLIC_ONEDRIVE_ROOT_FOLDER=Aquagold_Resistencias
NODE_OPTIONS=--max-old-space-size=4096
NPM_CONFIG_LEGACY_PEER_DEPS=true
```

## Comandos de Verificación

```bash
# Verificar instalación local
npm install --legacy-peer-deps
npm run build

# Limpiar y reinstalar si hay problemas
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

## Status
✅ Configuración aplicada
✅ Dependencias actualizadas
✅ Scripts de instalación configurados
✅ Vercel configurado para resolver conflictos