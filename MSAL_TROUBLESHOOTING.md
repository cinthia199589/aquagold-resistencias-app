# Solución de Problemas de Autenticación MSAL - Azure AD

## Problema
Error al iniciar sesión: La redirect URI no coincide con la registrada en Azure AD.

## Solución

### Paso 1: Verificar Redirect URI en Azure AD

1. Ve a **Azure Portal**: https://portal.azure.com
2. Busca **Azure Active Directory** o ve a tu tenant
3. Ve a **App registrations** → Busca tu app "aquagold-resistencias"
4. En el menú izquierdo, haz clic en **Authentication**
5. Bajo **Redirect URIs**, deberías ver:
   - `http://localhost:8080` (para desarrollo local)
   - `https://aquagold-shrimp-resistance.vercel.app` (para producción)

### Paso 2: Si NO está `http://localhost:8080`, agrégalo

1. En **Authentication**, busca la sección **Redirect URIs**
2. Haz clic en **Add a Redirect URI**
3. Tipo: **Single-page application (SPA)**
4. URI: `http://localhost:8080`
5. Haz clic en **Configure**
6. **Guarda los cambios** (arriba a la derecha)

### Paso 3: Espera 1-2 minutos

Azure AD tarda un poco en sincronizar los cambios.

### Paso 4: Limpia el navegador y vuelve a intentar

1. **Vacía el caché:**
   - **Ctrl + Shift + Delete** (Windows)
   - **Cmd + Shift + Delete** (Mac)
   
2. O abre una **ventana privada/incógnita** en tu navegador

3. Ve a: `http://localhost:8080`

4. Haz clic en **Iniciar sesión**

## Debug

Si sigue sin funcionar, abre la consola del navegador:
- **F12** o **Ctrl + Shift + I**
- Ve a la pestaña **Console**
- Busca el error exacto
- Cópialo y comparte conmigo

## Variables de Entorno Correctas

Asegúrate que en `.env.local` tienes:

```
NEXT_PUBLIC_MSAL_CLIENT_ID=bf20eec1-debc-4c81-a275-9de5b6f229aa
NEXT_PUBLIC_MSAL_TENANT_ID=120c6648-f19f-450e-931f-51a5ff6f2b10
NEXT_PUBLIC_MSAL_REDIRECT_URI=http://localhost:8080
```

## Si aún no funciona

Copia y pega aquí:
1. El error exacto de la consola (F12 → Console)
2. Los valores de `.env.local`
3. Captura de pantalla de la sección de Redirect URIs en Azure Portal
