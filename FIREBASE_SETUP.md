# 🔥 Configuración Firebase Firestore Rules

## ⚠️ Si aparece error "Firebase no configurado correctamente"

Necesitas actualizar las reglas de seguridad de Firestore:

### 📋 **Paso 1: Ve a Firebase Console**
1. Ve a: https://console.firebase.google.com
2. Selecciona tu proyecto: `studio-6276322063-5d9d6`
3. **Firestore Database** (en el menú lateral)
4. **Rules** (en la parte superior)

### 🔧 **Paso 2: Actualizar las reglas**

Reemplaza las reglas actuales por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso completo a la colección resistance_tests
    match /resistance_tests/{document=**} {
      allow read, write: if true;
    }
    
    // Reglas más específicas (opcional, para mayor seguridad)
    match /resistance_tests/{testId} {
      allow read, write: if request.auth != null;
      
      match /samples/{sampleId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Permitir acceso a otras colecciones si las usas
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 🚀 **Paso 3: Publicar las reglas**
1. **Clic en "Publish"**
2. **Esperar 1-2 minutos** para que se propaguen
3. **Probar la aplicación nuevamente**

---

## 🔐 **Explicación de las reglas:**

### **Regla permisiva (para desarrollo):**
```javascript
allow read, write: if true;
```
- ✅ Permite todas las operaciones
- ⚠️ Solo para desarrollo/testing

### **Regla con autenticación:**
```javascript
allow read, write: if request.auth != null;
```
- ✅ Solo usuarios autenticados pueden acceder
- 🔒 Más seguro para producción

### **Regla específica por colección:**
```javascript
match /resistance_tests/{testId} {
  allow read, write: if request.auth != null;
}
```
- ✅ Control granular por colección
- 🎯 Específico para resistance_tests

---

## 🧪 **Para probar si funciona:**

Después de actualizar las reglas:

1. **Ve a tu app:** https://aquagold-resistencias-app.vercel.app
2. **Inicia sesión** con Microsoft
3. **Crea una nueva prueba de resistencia**
4. **Intenta guardar datos**
5. **¡Debería funcionar sin errores!**

---

## 🚨 **Si persiste el error:**

### **Verificar variables de entorno en Vercel:**
Asegúrate que estas variables están correctas:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB3DC17qeItdOfnl1r7kl_WzS61MMTDu6g
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-6276322063-5d9d6
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-6276322063-5d9d6.firebaseapp.com
```

### **Verificar permisos de Firebase Storage:**
Si usas fotos, también actualiza Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```