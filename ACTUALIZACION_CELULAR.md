# 📱 Guía: ¿Por qué NO se actualiza en el celular?

## 🔍 El Problema

Subiste código a GitHub ✅ pero **NO aparece en el celular** porque:

```
GitHub (Repositorio) ≠ Aplicación en Vivo
```

### Diagrama del Flujo

```
1. Tu computadora
   ↓ (git push)
2. GitHub (repositorio)
   ↓ (deploy trigger)
3. **PLATAFORMA DE HOSTING** ← FALTA ESTO
   ↓ (build automático)
4. Celular ve cambios
```

---

## 🚀 Soluciones

### **Opción 1: Vercel (RECOMENDADO)**

La más fácil y rápida:

```bash
1. Ve a https://vercel.com
2. Login con GitHub
3. Importa tu repositorio
4. Click "Deploy"
5. Vercel hace todo automático:
   - Detecta cambios en GitHub
   - Build automático
   - Deploy instantáneo
```

**Ventajas:**
- ✅ Deploy automático con cada push a GitHub
- ✅ Gratis para proyectos públicos
- ✅ URL predeterminada + custom domain
- ✅ Previews automáticos
- ✅ Muy rápido

**URL que obtendrás:**
```
https://aquagold-resistencias-app.vercel.app
```

### **Opción 2: Netlify**

Similar a Vercel:

```bash
1. Ve a https://netlify.com
2. Login con GitHub
3. Conecta tu repositorio
4. Autoriza y Deploy
```

**URL que obtendrás:**
```
https://aquagold-resistencias.netlify.app
```

### **Opción 3: Servidor propio (Railway, Render, etc.)**

Si tienes servidor propio:

```bash
npm run build
npm run start
# O con PM2:
pm2 start npm -- start
```

---

## 📲 Después del Deploy

### En el Celular (PWA)

1. **Abre la URL en el navegador**
2. **Click en ⋮ (tres puntos)**
3. **"Instalar app"** o **"Add to Home Screen"**
4. ✅ La app se actualiza automáticamente

### Actualización Automática

- Cada vez que hagas `git push` a main
- Vercel/Netlify detecta cambios
- Deploy automático en 1-2 minutos
- El celular ve la nueva versión

---

## ⚡ Checklist Rápido

- [ ] Crear cuenta en Vercel/Netlify
- [ ] Conectar repositorio GitHub
- [ ] Autorizar acceso
- [ ] Deploy
- [ ] Copiar URL pública
- [ ] Probar en celular
- [ ] Instalar como PWA

---

## 🔄 Flujo Futuro

Después de configurar Vercel/Netlify:

```
1. Haces cambios en tu PC
2. git add -A
3. git commit -m "tu mensaje"
4. git push origin main
   ↓
5. GitHub recibe el push
6. Vercel/Netlify se activa automáticamente
7. Build + Deploy en 1-2 minutos
8. Celular recibe la actualización automáticamente
```

---

## 📞 ¿Necesitas ayuda con Vercel?

Si quieres que te ayude a configurar Vercel:

1. Ve a https://vercel.com/signup
2. Crea una cuenta
3. Dame permiso para generar el `.vercel.json` correcto
4. Listo!

---

**Resumen:** GitHub = Código, Vercel/Netlify = La app en vivo que ves en el celular

Necesitas el paso 3 para que se actualice automáticamente. 🚀
