# 🚀 Deploy Rápido - Aquagold Resistencias SPA + PWA

## ⚡ Deploy en 60 Segundos con Vercel

### Paso 1: Instalar Vercel CLI
```powershell
npm install -g vercel
```

### Paso 2: Login
```powershell
vercel login
```
Se abrirá el navegador para confirmar.

### Paso 3: Deploy
```powershell
cd "c:\Users\lorganoleptico\OneDrive - AQUAGOLD S.A\ARCHIVOS PROGRAMAS\resistencias-app"
vercel --prod
```

### Paso 4: Configurar Variables de Entorno

En el dashboard de Vercel:
1. Ir a tu proyecto
2. Settings → Environment Variables
3. Agregar estas variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_MSAL_CLIENT_ID
NEXT_PUBLIC_MSAL_AUTHORITY
NEXT_PUBLIC_MSAL_REDIRECT_URI
```

4. Redeploy: `vercel --prod`

### ✅ ¡Listo!
Tu app estará en: `https://resistencias-app.vercel.app`

---

## 🎯 Deploy Alternativo: Netlify

### Paso 1: Build Local
```powershell
npm run build:pwa
```

### Paso 2: Deploy con Netlify CLI
```powershell
# Instalar
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=out
```

### Paso 3: Variables de Entorno
```powershell
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "tu-api-key"
netlify env:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "tu-auth-domain"
# ... (resto de variables)
```

---

## 🔥 Deploy con Firebase Hosting

### Paso 1: Instalar Firebase CLI
```powershell
npm install -g firebase-tools
```

### Paso 2: Login
```powershell
firebase login
```

### Paso 3: Inicializar (solo primera vez)
```powershell
firebase init hosting
```
Responder:
- Public directory: `out`
- Single-page app: `Yes`
- GitHub deploys: `No` (opcional)

### Paso 4: Build y Deploy
```powershell
npm run build:pwa
firebase deploy --only hosting
```

### ✅ URL:
`https://tu-proyecto.web.app`

---

## 📋 Checklist Pre-Deploy

- [ ] Build exitoso: `npm run build:pwa`
- [ ] `.env.local` tiene todas las variables
- [ ] Service Worker funciona (test local)
- [ ] PWA instalable (test local)
- [ ] Lighthouse score > 90

---

## 🔧 Configuración de Dominio Personalizado

### Vercel
```powershell
vercel domains add resistencias.aquagold.com
```
Luego configurar DNS en tu proveedor:
```
CNAME  resistencias  cname.vercel-dns.com
```

### Netlify
Dashboard → Domain settings → Add custom domain

### Firebase
```powershell
firebase hosting:channel:deploy production
```

---

## 🔄 Actualizar Deployment

```powershell
# Hacer cambios en código
# ...

# Build
npm run build:pwa

# Deploy
vercel --prod
# O: netlify deploy --prod --dir=out
# O: firebase deploy --only hosting
```

---

## 📊 Monitorear Deployment

### Vercel
```powershell
# Ver deployments
vercel ls

# Ver logs
vercel logs

# Inspeccionar
vercel inspect
```

### Netlify
Dashboard → Deploys → Ver logs

### Firebase
```powershell
firebase hosting:channel:list
```

---

## 🚨 Rollback (si algo sale mal)

### Vercel
Dashboard → Deployments → Click en deployment anterior → Promote to Production

### Netlify
Dashboard → Deploys → Click en deploy anterior → Publish deploy

### Firebase
```powershell
firebase hosting:rollback
```

---

## 💡 Tips de Deploy

1. **Siempre testear localmente primero**
   ```powershell
   npm run build:pwa
   npm run start:spa
   ```

2. **Verificar variables de entorno**
   - Deben tener prefijo `NEXT_PUBLIC_`
   - Copiar de `.env.local`

3. **Cache del navegador**
   - Usuarios deben hacer Ctrl+Shift+R después de deploy
   - O esperar ~5 minutos para auto-actualización

4. **Service Worker**
   - Cambiar versión en `sw.js` si hay problemas
   - `const CACHE_NAME = 'aquagold-resistencias-v2.X.X'`

---

## 🎉 Post-Deploy Checklist

- [ ] App carga correctamente
- [ ] Login con Azure AD funciona
- [ ] Firestore lee/escribe datos
- [ ] OneDrive sube archivos
- [ ] PWA instalable
- [ ] Funciona offline (después de primera carga)
- [ ] Lighthouse PWA score > 90

---

## 📱 Compartir con Usuarios

```
¡Nueva versión disponible! 🎉

URL: https://resistencias-app.vercel.app

Para mejor experiencia:
1. Abrir en Chrome/Safari
2. Click en "Instalar app" (icono ⊕)
3. ¡Usar como app nativa!

Características:
✓ Funciona offline
✓ Más rápida
✓ Instalable en móvil y PC
```

---

## 🔐 Seguridad Post-Deploy

### 1. Restringir API Keys de Firebase
Firebase Console → Settings → Permitir solo tu dominio:
```
https://resistencias-app.vercel.app
https://tu-dominio-personalizado.com
```

### 2. Configurar Azure AD Redirect URIs
Azure Portal → App Registration → Authentication:
```
https://resistencias-app.vercel.app
https://resistencias-app.vercel.app/dashboard
```

### 3. CORS en OneDrive (si aplica)
Asegúrate que tu dominio esté autorizado.

---

## 📈 Analytics (Opcional)

### Google Analytics
1. Crear propiedad en GA4
2. Agregar a `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
3. Agregar script en `app/layout.tsx`

### Vercel Analytics
```powershell
npm install @vercel/analytics
```

---

## 🎯 Siguiente Nivel

### 1. CI/CD Automático
Conectar GitHub a Vercel/Netlify:
- Cada push a `main` → Auto deploy

### 2. Preview Deployments
Cada PR crea URL de preview automática

### 3. Edge Functions (Opcional)
Para lógica server-side adicional

---

## ✅ Tu App Está LIVE!

```
🌐 Production URL: https://resistencias-app.vercel.app
📱 Instalable: Sí
⚡ CDN Global: Sí
🔒 HTTPS: Sí
💾 Offline: Sí
```

**¡Felicidades!** 🎉
