# Configuración de Vercel para Aquagold Resistencias App

## Variables de Entorno en Vercel

Cuando configures tu proyecto en Vercel, debes agregar estas variables:

### Firebase
- NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB3DC17qeItdOfnl1r7kl_WzS61MMTDu6g
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-6276322063-5d9d6.firebaseapp.com
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-6276322063-5d9d6
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-6276322063-5d9d6.firebasestorage.app
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=725463781946
- NEXT_PUBLIC_FIREBASE_APP_ID=1:725463781946:web:57b8c03f42060ec4eb5b03

### Azure AD (MSAL)
- NEXT_PUBLIC_MSAL_CLIENT_ID=bf20eec1-debc-4c81-a275-9de5b6f229aa
- NEXT_PUBLIC_MSAL_TENANT_ID=120c6648-f19f-450e-931f-51a5ff6f2b10

### Redirect URI (Se configura después del deployment)
- NEXT_PUBLIC_MSAL_REDIRECT_URI=https://[tu-dominio].vercel.app

## Pasos para configurar Azure AD

1. Ve al Azure Portal: https://portal.azure.com
2. Busca "Azure Active Directory" → "App registrations"
3. Encuentra tu app (ID: bf20eec1-debc-4c81-a275-9de5b6f229aa)
4. Ve a "Authentication" → "Add a platform" → "Single-page application"
5. Agrega tu URL de Vercel: https://[tu-dominio].vercel.app
6. IMPORTANTE: Azure requiere HTTPS para dominios externos

## Configuración PWA para móvil

La app ya tiene configuración PWA en manifest.json. Cuando esté en Vercel:
1. Abre la app en Chrome móvil
2. Verás "Agregar a pantalla de inicio"
3. Se instalará como una app nativa

## Problemas comunes
- Error de autenticación: Verificar que el dominio esté en Azure AD
- No se instala como PWA: Verificar que esté en HTTPS
- Fotos no se cargan: Verificar permisos de OneDrive/Firebase