# 🚀 Desplegar en RAILWAY (Full Stack)

**Usuario:** rpillasagua  
**Repositorio:** cinthia199589/aquagold-resistencias-app  
**Plataforma:** Railway (gratis + $5 crédito/mes)  

---

## ✨ ¿Por Qué RAILWAY?

| Característica | Vercel | Railway |
|---|---|---|
| **Gratis** | ✅ | ✅ ($5 crédito) |
| **Deploy automático** | ✅ | ✅ |
| **Next.js** | ✅ Nativo | ✅ Muy bueno |
| **Base de datos** | ❌ | ✅ PostgreSQL |
| **Full Stack** | ⚠️ Solo frontend | ✅ Completo |
| **Velocidad** | Muy rápido | Muy rápido |
| **Interfaz** | Limpia | Super intuitiva |
| **Mejor para** | Frontend | Full Stack |

**VENTAJA RAILWAY:** Crédito gratis, mejor para desarrollo completo

---

## 🎯 En 5 Pasos (10 minutos)

### **1️⃣ Crear Cuenta Railway**
```
URL: https://railway.app
Opción: "Sign up with GitHub"
```

### **2️⃣ Conectar GitHub**
```
GitHub te pedirá autorización
Click: "Install & Authorize"
```

### **3️⃣ Crear Nuevo Proyecto**
```
"New Project" → "Deploy from GitHub repo"
Selecciona: aquagold-resistencias-app
```

### **4️⃣ Configurar Variables**
```
Agregar environment variables
Railway detecta Next.js automáticamente
```

### **5️⃣ Deploy**
```
Click: "Deploy"
¡Listo!
```

---

## 📋 PASO A PASO DETALLADO

### **PASO 1: Crear Cuenta Railway**

**URL:**
```
https://railway.app
```

**Click en: "Start Free"**

**Opciones de signup:**
```
☐ Email/Contraseña
☑ GitHub (RECOMENDADO)
☐ GitLab
```

**Click en: "Continue with GitHub"**

```
GitHub te pedirá:
"¿Autorizar Railway para acceder a tus repos?"
Click: "Authorize Railway-App"
```

**✅ Resultado:** Cuenta Railway creada

---

### **PASO 2: Crear Nuevo Proyecto**

**En Railway Dashboard:**

```
Opción 1: "New Project"
Opción 2: "+ New" → "Project"
```

**Verás opciones:**
```
☐ Create a new repo
☑ Deploy from GitHub repo (ELEGIR ESTA)
☐ Create from template
```

**Click en: "Deploy from GitHub repo"**

---

### **PASO 3: Seleccionar Repositorio**

**Railway mostrará tus repositorios de GitHub:**

```
Busca: "aquagold-resistencias-app"
Click en él
```

**Verás:**
```
Repository: cinthia199589/aquagold-resistencias-app
Owner: cinthia199589
Branch: main
```

**Click: "Deploy"**

---

### **PASO 4: Railway Auto-Detecta Next.js**

**Railway automáticamente:**
```
✅ Detecta framework: Next.js
✅ Detecta build command: npm run build
✅ Detecta start command: npm start
✅ Configura puerto: 3000
```

**¡No necesitas hacer nada más!**

---

### **PASO 5: Agregar Variables de Entorno**

**En Railway Project:**

```
1. Click en el proyecto
2. Click en la pestaña "Variables"
3. Click en "Raw Editor" (para pegar todo)
   O "Key-Value" (para agregar uno por uno)
```

**Opción A: Raw Editor (Rápido)**

```
Copia y pega todo desde tu .env.local:

NEXT_PUBLIC_MSAL_CLIENT_ID=bf20eec1-debc-4c81-a275-9de5b6f229aa
NEXT_PUBLIC_MSAL_TENANT_ID=120c6648-f19f-450e-931f-51a5ff6f2b10
NEXT_PUBLIC_MSAL_REDIRECT_URI=https://[tu-url].railway.app
NEXT_PUBLIC_FIREBASE_API_KEY=[Tu valor]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[Tu valor]
... (todas)
```

**Opción B: Key-Value (Manual)**

```
1. Click: "Add variable"
2. Key: NEXT_PUBLIC_MSAL_CLIENT_ID
3. Value: bf20eec1-debc-4c81-a275-9de5b6f229aa
4. Repeat para todas
```

**⚠️ IMPORTANTE:** `NEXT_PUBLIC_MSAL_REDIRECT_URI` debe usar tu URL de Railway

---

### **PASO 6: Deploy**

**Railway depliega automáticamente:**

```
1. Al agregar variables, Railway redeploya
   O
2. Cada push en GitHub, Railway redeploya
```

**Verás logs:**
```
Building...
├─ Cloning repo
├─ Installing dependencies
├─ Building application
├─ Starting server
└─ ✅ Deployed
```

**Espera 1-2 minutos**

---

## ✅ ¿Funcionó?

**Cuando veas:**
```
✅ Your service is live
Domain: [algo]-[random].up.railway.app
```

**Tu app está en:**
```
https://[algo]-[random].up.railway.app
```

**Prueba:**
1. Abre en navegador
2. Verifica que cargue
3. Prueba login con Azure AD
4. Verifica fotos en OneDrive

---

## 🔄 Deploy Automático

**Ya está configurado automáticamente:**

```
Cuando hagas push en GitHub:
git push
  ↓
GitHub notifica a Railway
  ↓
Railway compila automáticamente
  ↓
Tu app se actualiza
```

**¡Sin hacer nada más!**

---

## 💰 Planes y Créditos

### Plan Gratuito

```
✅ $5 de crédito GRATIS cada mes
✅ Costo típico: ~$2-3/mes (con crédito cubre)
✅ Deploy ilimitados
✅ Build ilimitados
✅ SSL/HTTPS incluido
✅ Dominio .railway.app gratis
```

### Si Usas Más del Crédito

```
Cargos típicos:
Compute (servicio): $0.22 por CPU/hora
Memory: $0.10 por GB/hora
Storage: Si necesitas BD

Estimado para tu app: $1-3/mes
(El crédito cubre)
```

---

## 🔐 Dominio Personalizado

**En Railway:**

```
1. Project → Settings
2. "Networking"
3. "Add domain"
4. Ingresa tu dominio
5. Sigue instrucciones DNS
6. ✅ Listo
```

**Ejemplo:**
```
tudominio.com → Tu app en Railway
```

---

## 📊 URLs en Railway

| Elemento | URL |
|----------|-----|
| **Dashboard** | https://railway.app |
| **Tu proyecto** | https://railway.app/project/[ID] |
| **Deployments** | https://railway.app/project/[ID]/deployments |
| **Tu app** | https://[nombre]-[random].up.railway.app |

---

## 🎯 Comparativa: Vercel vs Netlify vs Railway

| Aspecto | Vercel | Netlify | Railway |
|--------|--------|---------|---------|
| **Precio** | Gratis | Gratis | Gratis + $5 |
| **Estabilidad** | ⚠️ | ✅ | ✅ |
| **Next.js** | ✅ Nativo | ✅ | ✅ |
| **Full Stack** | ❌ | ❌ | ✅ |
| **DB incluida** | ❌ | ❌ | ✅ |
| **Mejor para** | Frontend | Frontend | Full Stack |
| **Recomendación** | Pro | ⭐⭐ | ⭐⭐⭐ |

---

## ⚠️ Errores Comunes

### Error: "Build Failed"

```
Solución:
1. Ver logs (Railway los muestra en red)
2. Revisar variables de entorno
3. Probar: npm run build (local)
4. Verificar package.json
```

### Error: "Cannot find module..."

```
Solución:
1. npm install (local)
2. npm run build (local)
3. Verificar dependencias
4. Reinstalar: npm install
```

### Error: "Connection refused"

```
Solución:
1. Verificar variables de entorno
2. Revisar que PORT esté correcto
3. Verificar CORS settings
```

---

## 🚀 Ventajas de Railway

✅ **Crédito gratis** ($5/mes)  
✅ **Muy estable**  
✅ **Full Stack** (frontend + backend + BD)  
✅ **Interface limpia**  
✅ **Logs detallados**  
✅ **Deploy muy rápido**  
✅ **Mejor para desarrollo**  
✅ **Escalable** (paga lo que usas)  

---

## ✅ Checklist

- [ ] Cuenta Railway creada (rpillasagua)
- [ ] GitHub conectado
- [ ] Repositorio importado
- [ ] Build configurado (auto)
- [ ] Variables de entorno agregadas
- [ ] Deploy completado
- [ ] App funcionando en URL nueva
- [ ] Deploy automático verificado
- [ ] GitHub sin cambios

---

## 🎉 Resultado Final

```
RAILWAY (rpillasagua): Tu app
    ↓
GITHUB (cinthia199589): Sin cambios
    ↓
APP DESPLEGADA: https://[nombre]-[random].up.railway.app
    ↓
DEPLOY AUTOMÁTICO: Sí
    ↓
CRÉDITO GRATIS: $5/mes
```

---

**¡Listo! Tu app estará en Railway en 10 minutos. 🚀**

Y tendrás $5 de crédito gratis cada mes.
