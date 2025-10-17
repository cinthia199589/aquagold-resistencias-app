# 🚀 Conectar Vercel rpillasagua al Repositorio de cinthia199589

**Nueva Cuenta Vercel:** rpillasagua  
**Repositorio GitHub:** cinthia199589/aquagold-resistencias-app  
**Objetivo:** Desplegar sin cambiar GitHub

---

## ✅ Paso 1: Autorizar Acceso en GitHub

### Desde tu nueva cuenta Vercel rpillasagua:

```
1. Ve a: https://vercel.com/dashboard
2. Click en tu usuario (arriba derecha)
3. Click en "Settings"
4. En el menú izq: "Integrations"
5. Busca: "GitHub"
6. Click en "GitHub"
7. Si no está autorizado:
   - Click: "Connect/Install GitHub App"
   - Selecciona "All repositories"
   - O selecciona específicamente: cinthia/aquagold-resistencias-app
8. GitHub te pedirá autorización
9. Click: "Authorize Vercel"
10. ✅ Listo
```

---

## ✅ Paso 2: Importar el Proyecto

### En Vercel (cuenta rpillasagua):

```
1. Estando en dashboard
2. Click: "+ Add New" → "Project"
3. O Click: "Import Project"
4. Vercel mostrará repositorios disponibles
5. Busca: "aquagold-resistencias-app"
6. Click en él
7. Vercel pre-llenará los datos
```

**Campos que aparecerán:**
```
Project Name:           aquagold-resistencias-app
Framework Preset:       Next.js (auto-detectado)
Build Command:          npm run build (pre-llenado)
Output Directory:       .next
Install Command:        npm install (pre-llenado)
Root Directory:         ./
```

---

## ✅ Paso 3: Configurar Variables de Entorno

### Copiar desde Vercel anterior (si existe) o completar:

```
1. En el formulario de Vercel (rpillasagua)
2. Busca: "Environment Variables"
3. Agrega cada una:

NEXT_PUBLIC_MSAL_CLIENT_ID
Valor: bf20eec1-debc-4c81-a275-9de5b6f229aa

NEXT_PUBLIC_MSAL_TENANT_ID
Valor: 120c6648-f19f-450e-931f-51a5ff6f2b10

NEXT_PUBLIC_MSAL_REDIRECT_URI
Valor: https://aquagold-resistencias-app.vercel.app
(O tu dominio personalizado)

NEXT_PUBLIC_FIREBASE_API_KEY
Valor: [Tu clave Firebase]

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Valor: [Tu dominio Firebase]

NEXT_PUBLIC_FIREBASE_PROJECT_ID
Valor: [Tu project ID]

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Valor: [Tu bucket]

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Valor: [Tu sender ID]

NEXT_PUBLIC_FIREBASE_APP_ID
Valor: [Tu app ID]

... (todas las demás variables que tenías)
```

**Dónde encontrar estas variables:**
```
├─ MSAL: En Azure AD (tu registro)
├─ Firebase: En Firebase Console
├─ OneDrive: En Azure App Registration
└─ Todas: En tu .env.local local
```

---

## ✅ Paso 4: Revisar Configuración

### Antes de hacer Deploy, verifica:

```
☐ Project Name: correcto
☐ Framework: Next.js (auto)
☐ Build Command: npm run build
☐ Output Directory: .next
☐ Root Directory: ./
☐ Environment Variables: Todas presentes
☐ GitHub Repo: cinthia199589/aquagold-resistencias-app
```

---

## ✅ Paso 5: Deploy

### En el formulario de Vercel:

```
1. Revisa todo está correcto
2. Click: "Deploy"
3. Espera que compile (~2-3 minutos)
4. Ver logs de compilación
5. Si todo OK: ✅ Deploy exitoso
```

---

## 🔍 ¿Cómo Saber si Funcionó?

```
Señales de éxito:
✅ Vercel muestra "Deployment Successful"
✅ URL nueva: https://aquagold-resistencias-app-XXX.vercel.app
✅ Página carga sin errores
✅ Formularios funcionan
✅ Login con Azure AD funciona
✅ Fotos se guardan en OneDrive

Señales de error:
❌ Error rojo en Vercel
❌ Build failed (revisar logs)
❌ Página 404
❌ Variables de entorno faltantes
```

---

## 🔗 URLs Importantes

| Elemento | URL |
|----------|-----|
| **Vercel Nueva (rpillasagua)** | https://vercel.com/rpillasagua |
| **Dashboard** | https://vercel.com/dashboard |
| **GitHub Repo** | https://github.com/cinthia199589/aquagold-resistencias-app |
| **Tu app en Vercel nuevo** | https://aquagold-resistencias-app-[hash].vercel.app |

---

## 🆘 Si Hay Errores

### Error: "Repository not found"
```
Solución:
1. En Vercel Settings → Integrations
2. Reconectar GitHub
3. Dar permiso a "cinthia199589/aquagold-resistencias-app"
4. Reintentar import
```

### Error: "Build Failed"
```
Solución:
1. Ver logs (Vercel muestra automáticamente)
2. Revisar variables de entorno
3. Revisar dependencias (package.json)
4. Si es Tailwind: usar CSS puro (ya está hecho)
```

### Error: "Cannot find module..."
```
Solución:
1. Asegurar npm install funcionó
2. Revisar package.json
3. Limpiar .next folder (local)
4. Reinstalar: npm install
5. Probar: npm run build (local)
```

### Error: "Variables de entorno inválidas"
```
Solución:
1. Copiar exactamente desde .env.local
2. No agregar espacios en blanco
3. No usar comillas (a menos que sea necesario)
4. Revisar mayúsculas/minúsculas
5. Guardar y reintentar
```

---

## 📋 Checklist Final

- ✅ Nueva cuenta Vercel creada (rpillasagua)
- ✅ GitHub autorizado en Vercel
- ✅ Repositorio importado
- ✅ Variables de entorno configuradas
- ✅ Build command correcto
- ✅ Framework detectado (Next.js)
- ✅ Deploy exitoso
- ✅ App funcionando en nueva URL
- ✅ GitHub sigue siendo GitHub original

---

## 🎯 Resultado Final

**Tendrás:**
```
✅ GitHub: cinthia199589 (sin cambios)
✅ Vercel: rpillasagua (nueva cuenta)
✅ App: Desplegada y funcionando
✅ Deploy automático: Sí (cada push)
✅ URL: https://aquagold-resistencias-app-[hash].vercel.app
```

---

## 🚀 Próximos Pasos

Una vez desplegado en Vercel (rpillasagua):

1. **Dominio personalizado** (opcional)
   ```
   Vercel Settings → Domains → Add Domain
   Apunta tu dominio personalizado a Vercel
   ```

2. **Alias amigable** (opcional)
   ```
   Project Settings → Domains
   Configura algo como: app.aquagold.com
   ```

3. **Producción vs Preview**
   ```
   Main branch → Production
   Otras branches → Preview URLs
   ```

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Verifica URL GitHub:** https://github.com/cinthia199589/aquagold-resistencias-app
2. **Verifica usuario Vercel:** rpillasagua (en https://vercel.com/rpillasagua)
3. **Revisa logs de deploy** en Vercel (muestra automáticamente)
4. **Verifica variables de entorno** (deben coincidir con .env.local)

---

**¡Listo! Tu app estará desplegada en tu nueva cuenta Vercel en minutos. 🚀**
