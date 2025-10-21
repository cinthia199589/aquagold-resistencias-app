# 📦 Plan de Migración de Archivos JSON

## 🎯 Objetivo
Migrar los archivos JSON de respaldo desde la carpeta antigua `Aquagold_Resistencias/database/` a las nuevas carpetas separadas por tipo.

---

## 📊 Estructura Actual vs Nueva

### ANTES (Carpeta Antigua):
```
OneDrive/
└── Aquagold_Resistencias/
    └── database/
        └── tests/
            └── 2025-10/
                ├── test-001.json  (MP)
                ├── test-002.json  (PT)
                ├── test-003.json  (MP)
                └── ...
```

### DESPUÉS (Carpetas Separadas):
```
OneDrive/
├── Aquagold_MP/
│   └── database/
│       └── tests/
│           └── 2025-10/
│               ├── test-001.json  (solo MP)
│               └── test-003.json  (solo MP)
│
└── Aquagold_PT/
    └── database/
        └── tests/
            └── 2025-10/
                └── test-002.json  (solo PT)
```

---

## 🔍 Identificar Tipo de Cada JSON

Cada archivo JSON contiene un campo `testType` que indica si es:
- `"MATERIA_PRIMA"` → va a `Aquagold_MP/database/`
- `"PRODUCTO_TERMINADO"` → va a `Aquagold_PT/database/`

---

## 🚀 Opciones de Migración

### ⚠️ PROBLEMA ACTUAL
El archivo `migrationConfig.ts` tiene hardcodeado:
```typescript
ONEDRIVE_DATABASE_FOLDER: '/Aquagold_MP/database'
```

Esto significa que **todos los JSON se guardarían solo en Aquagold_MP**, independientemente del tipo.

---

### ✅ SOLUCIÓN 1: Migración Manual (RECOMENDADO)

**Ventajas:**
- Control total sobre qué archivos se mueven
- No hay riesgo de sobrescribir datos
- Simple y seguro

**Pasos:**

1. **Crear las carpetas de destino en OneDrive:**
   ```
   Aquagold_MP/database/tests/2025-10/
   Aquagold_PT/database/tests/2025-10/
   ```

2. **Descargar los JSON de `Aquagold_Resistencias/database/tests/2025-10/`**
   - Descarga todos los archivos JSON localmente

3. **Clasificar por tipo:**
   - Abre cada JSON y busca el campo `testType`
   - Si es `"MATERIA_PRIMA"` → lista para Aquagold_MP
   - Si es `"PRODUCTO_TERMINADO"` → lista para Aquagold_PT

4. **Subir a las carpetas correctas:**
   - Sube los JSON de MP a `Aquagold_MP/database/tests/2025-10/`
   - Sube los JSON de PT a `Aquagold_PT/database/tests/2025-10/`

---

### ✅ SOLUCIÓN 2: Script de Migración Automático

Crear un script que:
1. Lea todos los JSON de `Aquagold_Resistencias/database/`
2. Identifique el `testType` de cada uno
3. Los copie a la carpeta correcta (MP o PT)

**Ventajas:**
- Automático
- Rápido

**Desventajas:**
- Requiere permisos de OneDrive
- Más complejo

---

### ✅ SOLUCIÓN 3: Desactivar Sistema JSON (MÁS SIMPLE)

**⚠️ RECOMENDACIÓN: Esta es la mejor opción actualmente**

Los JSON en OneDrive son **respaldos redundantes** porque ya tienes:
1. ✅ **Firestore** (base de datos principal)
2. ✅ **IndexedDB** (caché local en el navegador)

**Ventajas:**
- No necesitas migrar nada
- Simplifica el sistema
- Los datos siguen seguros en Firestore + IndexedDB

**Ya está implementado:**
```typescript
// En migrationConfig.ts (línea 121)
ENABLE_DUAL_WRITE: false  // ✅ YA DESACTIVADO
```

---

## 🎯 RECOMENDACIÓN FINAL

### Opción Recomendada: **NO MIGRAR los JSON**

**Razones:**
1. Los JSON en OneDrive son **respaldos opcionales**
2. Tus datos principales están en **Firestore** (seguro y confiable)
3. El caché local **IndexedDB** ya funciona perfectamente
4. El sistema `ENABLE_DUAL_WRITE: false` ya desactivó los respaldos JSON

**Qué hacer:**
1. ✅ **Dejar los JSON antiguos donde están** (como archivo histórico)
2. ✅ **No crear más JSON en OneDrive** (ya desactivado)
3. ✅ **Confiar en Firestore + IndexedDB** (sistema principal)

---

## 📋 Si Aún Quieres Migrar los JSON

### Opción A: Migración Manual Rápida

```powershell
# 1. Navega a OneDrive en el explorador de archivos
cd "C:\Users\Jaqueline Holguin\OneDrive - AQUAGOLD S.A\Aquagold_Resistencias\database\tests\2025-10"

# 2. Crea las carpetas nuevas
mkdir "..\..\..\..\Aquagold_MP\database\tests\2025-10"
mkdir "..\..\..\..\Aquagold_PT\database\tests\2025-10"

# 3. Abre cada JSON y muévelo manualmente según su tipo
# - Si tiene "testType": "MATERIA_PRIMA" → mueve a Aquagold_MP
# - Si tiene "testType": "PRODUCTO_TERMINADO" → mueve a Aquagold_PT
```

### Opción B: Script Automático (Requiere desarrollo)

Si quieres un script automático, puedo crearlo. Solo confirma que realmente lo necesitas.

---

## 🎯 Resumen

| Aspecto | Estado | Recomendación |
|---------|--------|---------------|
| **JSON antiguos** | En `Aquagold_Resistencias/database/` | ✅ Dejar ahí (archivo histórico) |
| **JSON nuevos** | No se crean (ENABLE_DUAL_WRITE: false) | ✅ Mantener desactivado |
| **Datos principales** | Firestore + IndexedDB | ✅ Sistema confiable |
| **Necesidad de migración** | Baja | ⚠️ Solo si necesitas los JSON en OneDrive |

---

## ❓ Preguntas para Decidir

1. **¿Necesitas realmente los JSON en OneDrive?**
   - Si NO → No hagas nada, los datos están seguros en Firestore
   - Si SÍ → Migración manual o script automático

2. **¿Los JSON son solo para respaldo?**
   - Si SÍ → Firestore ya es tu respaldo principal
   - Si NO → Explícame para qué los usas

3. **¿Prefieres simplicidad?**
   - Si SÍ → Deja el sistema como está (Firestore + IndexedDB)
   - Si NO → Puedo crear un script de migración completo

---

**💡 MI RECOMENDACIÓN**: No migres los JSON. El sistema actual con Firestore + IndexedDB es más confiable y simple.
