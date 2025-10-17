# 📸 Paso a Paso Visual: Conectar rpillasagua → cinthia

## 🎯 Flujo Completo

```
TÚ (rpillasagua)
    ↓
    VERCEL (rpillasagua)
    ↓
    GITHUB (cinthia199589) ← NO CAMBIA
    ↓
    CÓDIGO (aquagold-resistencias-app)
    ↓
    APP DESPLEGADA ✅
```

---

## 🔐 PASO 1: Conectar GitHub a Vercel

### En https://vercel.com/rpillasagua

```
┌─────────────────────────────────────────┐
│ Dashboard                               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tu Usuario: rpillasagua      ▼      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Click aquí ↓                            │
│ Settings                                │
└─────────────────────────────────────────┘
```

### En Settings

```
┌─────────────────────────────────────────┐
│ MENÚ IZQUIERDO                          │
│                                         │
│ Account                                 │
│ Teams                                   │
│ Integrations ← AQUÍ                    │
│ Billing                                 │
│ Email                                   │
└─────────────────────────────────────────┘
```

### En Integrations

```
┌─────────────────────────────────────────┐
│ INTEGRATIONS                            │
│                                         │
│ GitHub                                  │
│ ├─ Si ves "Connect":                   │
│ │  └─ Click en "Connect" o "Install"   │
│ └─ Si ves "Connected":                 │
│    └─ Already connected                │
│                                         │
│ Click: "Connect GitHub" o "Install"    │
└─────────────────────────────────────────┘
```

### Autorización GitHub

```
GitHub te mostrará:

┌──────────────────────────────────────────┐
│ Authorize Vercel?                        │
│                                          │
│ ¿Permites a Vercel acceso?              │
│                                          │
│ Selecciona:                              │
│ ○ Solo repositorios específicos          │
│ ● Todos los repositorios (recomendado)  │
│                                          │
│ [Authorize Vercel]                       │
└──────────────────────────────────────────┘

Click: "Authorize Vercel"
```

**✅ Resultado:** GitHub conectado a Vercel (rpillasagua)

---

## 📦 PASO 2: Importar Proyecto

### Vuelve al Dashboard de Vercel

```
┌─────────────────────────────────────────┐
│ Tu Dashboard (rpillasagua)              │
│                                         │
│ [+ Add New] ← AQUÍ                      │
│              ↓                          │
│       ┌─────────────┐                   │
│       │  Project    │                   │
│       │ Repository  │                   │
│       └─────────────┘                   │
│                                         │
│ Click: "+ Add New" → "Project"         │
└─────────────────────────────────────────┘
```

### Vercel mostrará repositorios disponibles

```
┌──────────────────────────────────────────┐
│ Selecciona repositorio                   │
│                                          │
│ Repositorios encontrados:                │
│ ┌──────────────────────────────────────┐ │
│ │ aquagold-resistencias-app            │ │
│ │ (cinthia199589/aquagold...)          │ │
│ │                                       │ │
│ │ Click aquí ↓                          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Seleccionar]                            │
└──────────────────────────────────────────┘
```

**✅ Resultado:** Proyecto seleccionado

---

## ⚙️ PASO 3: Configurar Build

### Vercel auto-detecta Next.js

```
┌──────────────────────────────────────────┐
│ Configure Project                        │
│                                          │
│ Project Name:                            │
│ [aquagold-resistencias-app             │
│                                          │
│ Framework Preset:                        │
│ [Next.js] ← Auto-detectado              │
│                                          │
│ Build Command:                           │
│ [npm run build] ← Auto-llenado          │
│                                          │
│ Output Directory:                        │
│ [.next] ← Auto-llenado                  │
│                                          │
│ Install Command:                         │
│ [npm install] ← Auto-llenado            │
│                                          │
│ Root Directory:                          │
│ [./] ← Auto-llenado                     │
│                                          │
│ ✅ Todo correcto                         │
└──────────────────────────────────────────┘
```

**✅ Resultado:** Build configurado

---

## 🔑 PASO 4: Variables de Entorno

### En el mismo formulario

```
┌──────────────────────────────────────────┐
│ Environment Variables                    │
│                                          │
│ Nombre:  NEXT_PUBLIC_MSAL_CLIENT_ID     │
│ Valor:   bf20eec1-debc-4c81-a275-...   │
│ [Add]                                    │
│                                          │
│ Nombre:  NEXT_PUBLIC_MSAL_TENANT_ID     │
│ Valor:   120c6648-f19f-450e-931f-...   │
│ [Add]                                    │
│                                          │
│ Nombre:  NEXT_PUBLIC_MSAL_REDIRECT_URI  │
│ Valor:   https://aquagold-...vercel.app │
│ [Add]                                    │
│                                          │
│ ... (agregar todas)                      │
│                                          │
│ [Continue]                               │
└──────────────────────────────────────────┘
```

**⚠️ Importante:**
- Copia exactamente desde tu `.env.local`
- No agregues espacios
- Todas las variables que usas

**✅ Resultado:** Variables configuradas

---

## 🚀 PASO 5: Deploy

### Click en Deploy

```
┌──────────────────────────────────────────┐
│ Ready to Deploy?                         │
│                                          │
│ Revisar:                                 │
│ ☑ Framework: Next.js                    │
│ ☑ Build: npm run build                  │
│ ☑ Variables: Todas presentes            │
│ ☑ Repositorio: cinthia/aquagold-...    │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │        [Deploy]                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ¡Click aquí!                             │
└──────────────────────────────────────────┘
```

**Vercel comenzará a:**
1. Clonar repositorio
2. Instalar dependencias
3. Compilar código
4. Optimizar
5. Desplegar

```
Compilando...
├─ Fetching repo
├─ Installing dependencies
├─ Building application
├─ Generating images
├─ Optimizing
└─ Deploying
```

---

## ✅ PASO 6: ¡Listo!

### Si todo funcionó correctamente:

```
┌──────────────────────────────────────────┐
│ Deployment Successful ✅                 │
│                                          │
│ Your site is live at:                    │
│ https://aquagold-resistencias-app-xyz... │
│      .vercel.app                         │
│                                          │
│ Visita:                                  │
│ [Visit]                                  │
│                                          │
│ Revisar:                                 │
│ [Deployments]                            │
│ [Settings]                               │
│ [Logs]                                   │
└──────────────────────────────────────────┘
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### Haz clic en "Visit" o entra en la URL

```
https://aquagold-resistencias-app-[hash].vercel.app

┌──────────────────────────────────────────┐
│ AQUAGOLD RESISTENCIAS                    │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Login con Microsoft                  │ │
│ │                                      │ │
│ │ [Inicia Sesión con Azure AD]         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ✅ Si ves esto, ¡funcionó!              │
└──────────────────────────────────────────┘
```

---

## 📊 Resultado Final

```
TU CUENTA VERCEL: rpillasagua ✅
    ↓
GITHUB: cinthia199589/aquagold-resistencias-app ✅
    ↓
APP DESPLEGADA: https://aquagold-resistencias-app-[hash].vercel.app ✅
    ↓
DEPLOY AUTOMÁTICO: Al hacer push en GitHub ✅
```

---

## 🎯 Lo que Pasó

| Antes | Después |
|-------|---------|
| Vercel: cinthia (viejo) | Vercel: rpillasagua (nuevo) ✅ |
| GitHub: cinthia | GitHub: cinthia (IGUAL) ✅ |
| App: vieja URL | App: nueva URL ✅ |
| Código: igual | Código: igual ✅ |

---

## 🚀 Ventajas de Esta Configuración

✅ GitHub sigue siendo el original (cinthia199589)  
✅ Vercel nuevo (rpillasagua)  
✅ Deploy automático funciona  
✅ Puedes tener múltiples Vercel desplegando  
✅ Control total en tu cuenta Vercel  

---

## 📞 Si Hay Problemas

```
Error: "Repository not found"
→ Verifica GitHub autorizado en Vercel

Error: "Build Failed"
→ Ver logs (Vercel muestra)

Error: "Variables de entorno inválidas"
→ Copiar exacto desde .env.local

Error: "Cannot find module..."
→ npm install localmente y reintentar
```

---

**¡Listo! Tu app estará en Vercel (rpillasagua) en minutos. 🚀**

Para más detalles: `SETUP_VERCEL_NUEVA_CUENTA.md`
