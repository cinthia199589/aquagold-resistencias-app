# 🔄 Guía de Migración - OneDrive

## ✅ Estado Actual

### Carpetas Viejas (ANTES):
```
OneDrive/
└── Aquagold_Resistencias/
    ├── 0004692-25/
    ├── 0004694-25/
    └── ...
```

### Carpetas Nuevas (DESPUÉS):
```
OneDrive/
├── Aquagold_MP/              ← Materia Prima
│   ├── 0004692-25/
│   └── ...
│
└── Aquagold_PT/              ← Producto Terminado
    ├── 0004694-25/
    └── ...
```

---

## 📋 PASO 1: Crear las Carpetas Nuevas

### Opción A: Desde la Aplicación (RECOMENDADO)
1. Abre la aplicación: http://localhost:3000
2. Inicia sesión
3. Crea una prueba de **Materia Prima** (cualquiera)
   - Esto creará automáticamente la carpeta `Aquagold_MP/`
4. Crea una prueba de **Producto Terminado** (cualquiera)
   - Esto creará automáticamente la carpeta `Aquagold_PT/`
5. Puedes eliminar estas pruebas de prueba después

### Opción B: Manualmente en OneDrive
1. Abre OneDrive en el navegador
2. Crea la carpeta `Aquagold_MP`
3. Crea la carpeta `Aquagold_PT`

---

## 📦 PASO 2: Identificar el Tipo de Cada Lote

Abre tu aplicación y revisa cada prueba para saber su tipo:

| Número de Lote | Tipo | Carpeta Destino |
|----------------|------|-----------------|
| 0004692-25 | MATERIA_PRIMA | Aquagold_MP |
| 0004694-25 | PRODUCTO_TERMINADO | Aquagold_PT |
| ... | ... | ... |

💡 **TIP**: Puedes ver el tipo en la aplicación, en cada tarjeta de prueba.

---

## 🚚 PASO 3: Mover las Carpetas

### En OneDrive (navegador):

1. Abre OneDrive: https://onedrive.live.com
2. Navega a `Aquagold_Resistencias/`
3. Para cada carpeta de lote:
   
   **Si es Materia Prima (MP):**
   ```
   Aquagold_Resistencias/0004692-25/  →  Aquagold_MP/0004692-25/
   ```
   - Selecciona la carpeta
   - Click derecho → Mover
   - Selecciona `Aquagold_MP`
   
   **Si es Producto Terminado (PT):**
   ```
   Aquagold_Resistencias/0004694-25/  →  Aquagold_PT/0004694-25/
   ```
   - Selecciona la carpeta
   - Click derecho → Mover
   - Selecciona `Aquagold_PT`

---

## 🔗 PASO 4: Actualizar los Enlaces en Firestore

**⚠️ IMPORTANTE**: Los enlaces de las fotos en Firestore todavía apuntan a las carpetas viejas.

Necesitamos ejecutar un script que actualice los enlaces:

```powershell
npm run migrate-photo-urls
```

Este script:
- Lee todos los tests de Firestore
- Actualiza las URLs de las fotos:
  - `Aquagold_Resistencias/` → `Aquagold_MP/` o `Aquagold_PT/`
- Guarda los cambios en Firestore

---

## ✅ PASO 5: Verificar que Todo Funciona

1. Abre la aplicación
2. Verifica que todas las pruebas aparecen
3. Verifica que todas las fotos se ven correctamente
4. Prueba crear una nueva prueba de cada tipo
5. Prueba completar una prueba (debe generar el Excel en la carpeta correcta)

---

## 🗑️ PASO 6: Limpiar (DESPUÉS de verificar)

**⚠️ SOLO DESPUÉS DE VERIFICAR QUE TODO FUNCIONA:**

1. Verifica que `Aquagold_Resistencias/` está vacía
2. Elimina la carpeta `Aquagold_Resistencias/`

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Carpeta MP | `Aquagold_Resistencias/0004692-25/` | `Aquagold_MP/0004692-25/` |
| Carpeta PT | `Aquagold_Resistencias/0004694-25/` | `Aquagold_PT/0004694-25/` |
| URLs fotos | `.../Aquagold_Resistencias/...` | `.../Aquagold_MP/...` o `.../Aquagold_PT/...` |
| Excel | `.../Aquagold_Resistencias/...` | `.../Aquagold_MP/...` o `.../Aquagold_PT/...` |

---

## 🆘 Solución de Problemas

### ❌ No aparecen las fotos
- Verifica que las carpetas se movieron correctamente
- Ejecuta el script de migración de URLs: `npm run migrate-photo-urls`

### ❌ No se crean pruebas nuevas
- Verifica que iniciaste sesión con OneDrive
- Verifica los permisos de OneDrive

### ❌ Error al completar prueba
- Verifica que la carpeta del tipo correcto existe en OneDrive

---

## � PASO 7: ¿Qué pasa con los archivos JSON?

### 🎯 Los JSON son respaldos opcionales

Los archivos JSON en `Aquagold_Resistencias/database/` son **respaldos redundantes**.

**Tus datos principales están en:**
1. ✅ **Firestore** (base de datos principal en la nube)
2. ✅ **IndexedDB** (caché local en tu navegador)

### ✅ Sistema de Respaldo JSON ACTIVADO

Se activó el sistema de respaldo JSON en OneDrive para:
- ✅ **Triple respaldo:** Firestore + IndexedDB + OneDrive JSON
- ✅ **Prevenir pérdida de datos** como el caso de 0004690-25
- ✅ **Recuperación rápida** desde archivos JSON si hay problemas

**Configuración actual:**
```typescript
ENABLE_DUAL_WRITE: true  // ✅ Sistema JSON ACTIVADO
```

### 📋 Opciones para los JSON Antiguos

**Opción 1: DEJAR COMO ESTÁN (RECOMENDADO)**
- Los JSON antiguos quedan en `Aquagold_Resistencias/database/` como archivo histórico
- No afectan el funcionamiento de la aplicación
- Puedes eliminarlos después si quieres

**Opción 2: MIGRARLOS MANUALMENTE (YA NO NECESARIO)**
- El sistema ahora genera los JSON automáticamente en las carpetas correctas
- Los JSON antiguos son solo historial

**Opción 3: ELIMINARLOS**
- Si no los necesitas (el sistema generará nuevos automáticamente)
- Solo después de verificar que todo funciona

### ✅ SISTEMA JSON ACTIVO - Funcionando Correctamente

**Estado actual:** `ENABLE_DUAL_WRITE: true` ✅

Los JSON ahora se guardan automáticamente en las carpetas correctas:

✅ **Cambios implementados:**
- Los JSON de **Materia Prima** se guardan en: `/Aquagold_MP/database/tests/`
- Los JSON de **Producto Terminado** se guardan en: `/Aquagold_PT/database/tests/`
- El sistema detecta automáticamente el tipo de cada prueba
- Las carpetas se organizan por mes: `/2025-10/`, `/2025-11/`, etc.

**Ejemplo:**
```
Aquagold_MP/
└── database/
    └── tests/
        └── 2025-10/
            ├── test-001.json  (MP)
            └── test-003.json  (MP)

Aquagold_PT/
└── database/
    └── tests/
        └── 2025-10/
            └── test-002.json  (PT)
```

### 💡 RECOMENDACIÓN
**Sistema de respaldo JSON está activo y funcionando.**

✅ **Cada vez que guardes o completes una resistencia:**
- Se guarda en Firestore (base de datos principal)
- Se guarda en IndexedDB (caché local)
- **Se guarda en OneDrive JSON** (respaldo de seguridad)

✅ **Los nuevos archivos van automáticamente a las carpetas correctas (MP o PT).**

**Protección contra pérdida de datos:** Si alguno de los sistemas falla, tienes 2 respaldos adicionales.

---

## 📞 Contacto

Si tienes problemas con la migración, revisa este documento o `PLAN_MIGRACION_JSON.md`.