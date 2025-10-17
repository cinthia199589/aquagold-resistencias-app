# 🚀 Desplegar en NETLIFY (Alternativa a Vercel)

**Usuario:** rpillasagua  
**Repositorio:** cinthia199589/aquagold-resistencias-app  
**Plataforma:** Netlify (gratis)  

---

## ✨ ¿Por Qué NETLIFY?

| Característica | Vercel | Netlify |
|---|---|---|
| **Gratis** | ✅ | ✅ |
| **Deploy automático** | ✅ | ✅ |
| **Next.js** | ✅ Nativo | ✅ Muy bueno |
| **SSL/HTTPS** | ✅ | ✅ |
| **Dominio gratis** | .vercel.app | .netlify.app |
| **Velocidad** | Muy rápido | Muy rápido |
| **Interfaz** | Limpia | Super intuitiva |
| **Predicibilidad** | ⚠️ A veces falla | ✅ Muy estable |

**VENTAJA NETLIFY:** Más estable, menos problemas de compilación

---

## 🎯 En 5 Pasos (10 minutos)

### **1️⃣ Crear Cuenta Netlify**
```
URL: https://app.netlify.com/signup
Opción: "Sign up with GitHub"
```

### **2️⃣ Conectar GitHub**
```
GitHub te pedirá autorización
Click: "Authorize Netlify"
```

### **3️⃣ Importar Repositorio**
```
Netlify mostrará tus repos
Selecciona: aquagold-resistencias-app
```

### **4️⃣ Configurar Build**
```
Build command: npm run build
Publish directory: .next
```

### **5️⃣ Agregar Variables y Deploy**
```
Agregar environment variables
Click: "Deploy site"
¡Listo!
```

---

## 📋 PASO A PASO DETALLADO

### **PASO 1: Crear Cuenta Netlify**

**URL:**
```
https://app.netlify.com/signup
```

**Opciones de signup:**
```
☐ Email/Contraseña
☑ GitHub (RECOMENDADO)
☐ GitLab
☐ Bitbucket
```

**Click en: "Sign up with GitHub"**

```
GitHub te pedirá:
"¿Autorizar Netlify para acceder a tus repos?"
Click: "Authorize netlify-app"
```

**✅ Resultado:** Cuenta Netlify creada conectada a GitHub

---

### **PASO 2: Conectar GitHub**

**Ya debería estar conectado, pero si no:**

```
1. En Netlify Dashboard
2. Click: "Connect to Git"
3. Selecciona: "GitHub"
4. GitHub: "Authorize Netlify"
5. ✅ Conectado
```

---

### **PASO 3: Importar Repositorio**

**En Netlify Dashboard:**

```
1. Click: "Add new site"
2. Opción: "Import an existing project"
3. Selecciona: "GitHub"
4. Netlify mostrará repositorios disponibles
5. Busca: "aquagold-resistencias-app"
6. Click en él
```

**Verás:**
```
Repository: cinthia199589/aquagold-resistencias-app
Owner: cinthia199589
Branch: main
```

**Click: "Connect"**

---

### **PASO 4: Configurar Build**

**Netlify mostrará un formulario:**

```
┌─────────────────────────────────────┐
│ Build settings                      │
│                                     │
│ Branch to deploy:                   │
│ [main]                              │
│                                     │
│ Build command:                      │
│ [npm run build]                     │
│                                     │
│ Publish directory:                  │
│ [.next]                             │
│                                     │
│ Functions directory:                │
│ [api]                               │
└─────────────────────────────────────┘
```

**Valores correctos:**
- Branch to deploy: `main`
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `api` (o dejar vacío)

**Click: "Save"** (todavía no deploya)

---

### **PASO 5: Environment Variables**

**En el mismo formulario, busca:**
```
"Advanced build settings"
Click: "New variable"
```

**O después del deploy:**
```
Site settings → Build & deploy → Environment
```

**Agrega cada variable:**

```
Variable 1:
Key: NEXT_PUBLIC_MSAL_CLIENT_ID
Value: bf20eec1-debc-4c81-a275-9de5b6f229aa

Variable 2:
Key: NEXT_PUBLIC_MSAL_TENANT_ID
Value: 120c6648-f19f-450e-931f-51a5ff6f2b10

Variable 3:
Key: NEXT_PUBLIC_MSAL_REDIRECT_URI
Value: https://aquagold-resistencias-app.netlify.app

Variable 4:
Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: [Tu valor]

... (todas las demás)
```

**⚠️ IMPORTANTE:** Usar EXACTAMENTE los mismos valores que en Vercel/local

---

### **PASO 6: Deploy**

**Opción A: Primer Deploy**
```
Si aún no has hecho deploy:
Click: "Deploy site"
(en la pantalla de configuración)
```

**Opción B: Redeploy Manual**
```
Si ya hiciste deploy:
1. En Netlify Dashboard
2. Click: "Deploys"
3. Click: "Trigger deploy"
4. Selecciona: "Deploy site"
```

**Netlify comenzará a:**
```
Compiling...
├─ Cloning repo
├─ Installing dependencies
├─ Building application
├─ Optimizing
└─ Publishing
```

**Espera 1-2 minutos**

---

## ✅ ¿Funcionó?

**Cuando veas:**
```
✅ Deploy published
Your site is live at: https://aquagold-resistencias-app-[hash].netlify.app
```

**Tu app está en:**
```
https://aquagold-resistencias-app-[hash].netlify.app
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
GitHub notifica a Netlify
  ↓
Netlify compila automáticamente
  ↓
Tu app se actualiza
```

**¡Sin hacer nada más!**

---

## 🔐 Configuración Avanzada (Opcional)

### Dominio Personalizado

**En Netlify Dashboard:**
```
1. Click: "Domain settings"
2. Click: "Add custom domain"
3. Ingresa: tudominio.com
4. Sigue las instrucciones de DNS
5. ✅ Listo en 24-48 horas
```

### Redirecciones

**Crear archivo `_redirects` en root:**
```
/old-page /new-page 301
/api/* /.netlify/functions/:splat 200
```

### Environment por Branch

**Diferentes variables en diferente ramas:**
```
Deploy previews: variables de testing
Production: variables de producción
```

---

## ⚠️ Errores Comunes

### Error: "Build Failed"

```
Solución:
1. Ver logs (Netlify los muestra)
2. Revisar package.json
3. Probar: npm run build (local)
4. Verificar variables de entorno
```

### Error: "Repository not found"

```
Solución:
1. Verificar GitHub conectado
2. Site settings → Build & deploy → Repository
3. Reconectar GitHub
```

### Error: "Cannot find module..."

```
Solución:
1. npm install (local)
2. npm run build (local)
3. Verificar package.json
4. Verificar dependencias
```

### Error: "Timeout"

```
Solución:
1. Netlify espera 15 minutos por defecto
2. Si tarda más, optimizar build
3. Verificar que no hay loops infinitos
```

---

## 📊 URLs en Netlify

| Elemento | URL |
|----------|-----|
| **Dashboard** | https://app.netlify.com |
| **Tu sitio** | https://[nombre]-[hash].netlify.app |
| **Deploys** | https://app.netlify.com/sites/[nombre]/overview |
| **Deploy logs** | https://app.netlify.com/sites/[nombre]/deploys |

---

## 🎯 Comparativa: Vercel vs Netlify

| Aspecto | Vercel | Netlify |
|--------|--------|---------|
| **Precio** | Gratis | Gratis |
| **Estabilidad** | ⚠️ Problemas CSS | ✅ Muy estable |
| **Velocidad** | Muy rápida | Muy rápida |
| **Interface** | Minimalista | Intuitiva |
| **Logs** | Buenos | Excelentes |
| **Soporte** | Bueno | Muy bueno |
| **Predictibilidad** | A veces falla | Muy predecible |
| **Recomendación** | Pro | ⭐ MEJOR OPCIÓN |

---

## 🚀 ¿Por Qué Elegir Netlify?

✅ **Más estable** que Vercel  
✅ **Menos problemas** de compilación  
✅ **Interfaz más intuitiva**  
✅ **Mejor para Next.js** en muchos casos  
✅ **Logs más detallados**  
✅ **Soporte más rápido**  
✅ **Precios similares**  

---

## ✅ Checklist

- [ ] Cuenta Netlify creada (rpillasagua)
- [ ] GitHub conectado
- [ ] Repositorio importado (cinthia/aquagold)
- [ ] Build settings configurados
- [ ] Variables de entorno agregadas
- [ ] Deploy completado
- [ ] App funcionando en URL nueva
- [ ] Deploy automático verificado
- [ ] GitHub sin cambios

---

## 🎉 Resultado Final

```
NETLIFY (rpillasagua): Tu app
    ↓
GITHUB (cinthia199589): Sin cambios
    ↓
APP DESPLEGADA: https://aquagold-[hash].netlify.app
    ↓
DEPLOY AUTOMÁTICO: Sí
```

---

**¡Listo! Tu app estará en Netlify en 15 minutos. 🚀**

Para más detalles: Ver documentación completa en repositorio.
