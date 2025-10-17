Variable 1:
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyB3DC17qeItdOfnl1r7kl_WzS61MMTDu6g

Variable 2:
Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: studio-6276322063-5d9d6.firebaseapp.com

Variable 3:
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: studio-6276322063-5d9d6

Variable 4:
Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: studio-6276322063-5d9d6.firebasestorage.app

Variable 5:
Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 725463781946

Variable 6:
Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:725463781946:web:57b8c03f42060ec4eb5b03

Variable 7:
Name: NEXT_PUBLIC_MSAL_CLIENT_ID
Value: bf20eec1-debc-4c81-a275-9de5b6f229aa

Variable 8:
Name: NEXT_PUBLIC_MSAL_TENANT_ID
Value: 120c6648-f19f-450e-931f-51a5ff6f2b10

Variable 9:
Name: NEXT_PUBLIC_MSAL_REDIRECT_URI
Value: https://aquagold-shrimp-resistance.vercel.app# 🚀 Deployment en Vercel - Aquagold Resistencias App

## 📱 Para usar como PWA en tu celular

### Paso 1: Preparar el código
Tu aplicación ya está configurada como PWA. Solo necesitas deployar en Vercel.

### Paso 2: Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Inicia sesión con GitHub
3. Conecta tu repositorio

### Paso 3: Configurar Variables de Entorno en Vercel
En el dashboard de Vercel, ve a Settings → Environment Variables y agrega:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB3DC17qeItdOfnl1r7kl_WzS61MMTDu6g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-6276322063-5d9d6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-6276322063-5d9d6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-6276322063-5d9d6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=725463781946
NEXT_PUBLIC_FIREBASE_APP_ID=1:725463781946:web:57b8c03f42060ec4eb5b03

# Azure AD
NEXT_PUBLIC_MSAL_CLIENT_ID=bf20eec1-debc-4c81-a275-9de5b6f229aa
NEXT_PUBLIC_MSAL_TENANT_ID=120c6648-f19f-450e-931f-51a5ff6f2b10
NEXT_PUBLIC_MSAL_REDIRECT_URI=https://tu-app.vercel.app
```

### Paso 4: Deploy inicial
1. Haz push de tu código a GitHub
2. En Vercel, importa el repositorio
3. Vercel detectará automáticamente que es Next.js
4. Deploy automáticamente

### Paso 5: Configurar Azure AD (¡CRÍTICO!)
Una vez que tengas tu URL de Vercel (ej: https://resistencias-aquagold.vercel.app):

1. Ve a Azure Portal: https://portal.azure.com
2. Azure Active Directory → App registrations
3. Busca tu app: `bf20eec1-debc-4c81-a275-9de5b6f229aa`
4. Authentication → Add a platform → Single-page application
5. **Agregar redirect URI: https://resistencias-aquagold.vercel.app**
6. ✅ Guardar

### Paso 6: Actualizar Vercel
1. En Vercel Settings → Environment Variables
2. Actualizar `NEXT_PUBLIC_MSAL_REDIRECT_URI` con tu URL real
3. Redeploy la aplicación

---

## 📱 Instalar como PWA en tu celular

### Android (Chrome):
1. Abre https://tu-app.vercel.app en Chrome
2. Aparecerá "Agregar a pantalla de inicio"
3. Toca "Agregar"
4. ¡La app se instala como aplicación nativa!

### iOS (Safari):
1. Abre la URL en Safari
2. Toca el botón de compartir 
3. "Agregar a pantalla de inicio"
4. ¡Listo!

---

## 🔧 Solución de Problemas

### Error de autenticación:
- ✅ Verificar que el dominio esté agregado en Azure AD
- ✅ Verificar que las variables de entorno estén correctas
- ✅ Verificar que NEXT_PUBLIC_MSAL_REDIRECT_URI sea exactamente tu URL de Vercel

### La PWA no se instala:
- ✅ Verificar que esté en HTTPS (Vercel siempre es HTTPS)
- ✅ Verificar que manifest.json esté accesible
- ✅ Verificar que los iconos existan

### Fotos no se cargan:
- ✅ Verificar permisos de Firebase Storage
- ✅ Verificar permisos de OneDrive

---

## 🎯 URLs de Ejemplo

Después del deployment tendrás algo como:
- **App Principal:** https://resistencias-aquagold.vercel.app
- **Manifest PWA:** https://resistencias-aquagold.vercel.app/manifest.json
- **Iconos:** https://resistencias-aquagold.vercel.app/icon-192.svg

---

## 📋 Checklist Final

### Antes del deployment:
- [ ] Código en GitHub
- [ ] Variables de entorno preparadas
- [ ] Azure AD configurado

### Durante deployment:
- [ ] Vercel conectado a GitHub
- [ ] Variables de entorno configuradas
- [ ] Build exitoso

### Después del deployment:
- [ ] Azure AD actualizado con nueva URL
- [ ] PWA funcional en móvil
- [ ] Autenticación Microsoft funcionando
- [ ] Fotos se cargan correctamente

---

## 🔄 Alternativa: Usar localhost temporalmente

Si tienes problemas con Azure AD en producción, puedes:

1. Mantener localhost para desarrollo
2. Usar ngrok para acceso externo temporal:
   ```bash
   ngrok http 8080
   ```
3. Agregar la URL de ngrok a Azure AD
4. Acceder desde tu celular usando la URL de ngrok

¡La PWA funcionará igual desde cualquier URL HTTPS!