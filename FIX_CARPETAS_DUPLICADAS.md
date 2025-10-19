# 🔧 Fix: Carpetas Duplicadas en OneDrive

**Fecha:** 19 de Octubre 2025  
**Problema:** Carpetas duplicadas vacías en `/database/`

---

## ❓ Problema Identificado

### **Estructura ANTES (incorrecta):**
```
database/
├── tests/
│   ├── 2025-10/          ← ✅ 7 archivos JSON (correcta)
│   ├── 2025-10 1/        ← ❌ Vacía (duplicada)
│   ├── 2025-10 2/        ← ❌ Vacía (duplicada)
│   ├── 2025-10 3/        ← ❌ Vacía (duplicada)
│   └── 2025-10 4/        ← ❌ Vacía (duplicada)
├── tests 1/              ← ❌ Vacía (duplicada)
├── tests 2/              ← ❌ Vacía (duplicada)
└── tests 3/              ← ❌ Vacía (duplicada)
```

### **Estructura DESPUÉS (correcta):**
```
database/
└── tests/
    └── 2025-10/          ← ✅ 7 archivos JSON
        ├── test-rt-1760793662626.json
        ├── test-rt-1760794237680.json
        ├── test-rt-1760794393295.json
        ├── test-rt-1760794518744.json
        ├── test-rt-1760794641085.json
        ├── test-rt-1760826195802.json
        └── test-rt-1760827705060.json
```

---

## 🐛 Causa Raíz

### **Código Problemático** (lib/onedriveDataService.ts, línea 399):

```typescript
// ❌ ANTES (causaba duplicados)
'@microsoft.graph.conflictBehavior': 'rename'
```

**Comportamiento:**
- Si la carpeta `2025-10` ya existe → Crea `2025-10 1`
- Si `2025-10 1` existe → Crea `2025-10 2`
- Y así sucesivamente...

### **Por qué ocurría:**
1. Múltiples intentos de migración
2. Cada intento intentaba crear las carpetas
3. OneDrive renombraba automáticamente las duplicadas
4. Resultado: 8 carpetas vacías

---

## ✅ Solución Aplicada

### **1. Fix del Código:**

```typescript
// ✅ DESPUÉS (usa carpeta existente)
'@microsoft.graph.conflictBehavior': 'fail'
```

**Comportamiento:**
- Si la carpeta existe → Usa la existente
- Si no existe → La crea
- No crea duplicados

### **2. Limpieza de Carpetas:**

```powershell
# Eliminadas:
✅ database/tests/2025-10 1/  (vacía)
✅ database/tests/2025-10 2/  (vacía)
✅ database/tests/2025-10 3/  (vacía)
✅ database/tests/2025-10 4/  (vacía)
✅ database/tests 1/          (vacía)
✅ database/tests 2/          (vacía)
✅ database/tests 3/          (vacía)

# Mantenida:
✅ database/tests/2025-10/    (7 archivos JSON)
```

---

## 🧪 Validación

### **Antes:**
```
database/
├── tests/                    ← 1 carpeta
│   ├── 2025-10/             ← 5 subcarpetas (1 con datos, 4 vacías)
│   ├── 2025-10 1/
│   ├── 2025-10 2/
│   ├── 2025-10 3/
│   └── 2025-10 4/
├── tests 1/                  ← 3 carpetas vacías
├── tests 2/
└── tests 3/

Total: 9 carpetas (8 vacías, 1 con datos)
```

### **Después:**
```
database/
└── tests/                    ← 1 carpeta
    └── 2025-10/             ← 1 subcarpeta (con datos)

Total: 2 carpetas (0 vacías, todas útiles)
```

---

## 🔮 Prevención Futura

### **Comportamientos de Microsoft Graph API:**

| Valor | Efecto | Uso |
|-------|--------|-----|
| `'fail'` | Error si existe, no crea duplicado | ✅ **Recomendado** para carpetas de datos |
| `'replace'` | Sobrescribe la existente | ⚠️ Peligroso - puede perder datos |
| `'rename'` | Crea con nombre diferente | ❌ Crea duplicados |

### **Nuevo Flujo:**
1. Sistema intenta crear `/database/tests/2025-10/`
2. Si ya existe → La usa (no crea duplicado)
3. Si no existe → La crea
4. Sube archivo JSON a la carpeta existente/creada

---

## 📊 Impacto

### **Espacio Liberado:**
- ❌ 8 carpetas vacías eliminadas
- ✅ Estructura limpia y organizada

### **Prevención:**
- ❌ No se crearán más carpetas `2025-10 1`, `2025-10 2`, etc.
- ✅ Todos los tests del mismo mes en la misma carpeta

### **Mantenimiento:**
- Noviembre 2025 → `/database/tests/2025-11/` (sin duplicados)
- Diciembre 2025 → `/database/tests/2025-12/` (sin duplicados)

---

## 🎯 Resultado Final

```
✅ Código corregido en onedriveDataService.ts
✅ 8 carpetas duplicadas eliminadas
✅ Estructura OneDrive limpia
✅ Prevención de duplicados futuros
✅ Sistema listo para producción
```

---

## 📝 Notas Técnicas

### **Microsoft Graph API - Folder Creation:**
```typescript
// Endpoint
POST https://graph.microsoft.com/v1.0/me/drive/root:/{parent-path}:/children

// Body
{
  "name": "2025-10",
  "folder": {},
  "@microsoft.graph.conflictBehavior": "fail"  // ← Clave del fix
}
```

### **Respuestas:**
- **200 OK:** Carpeta creada exitosamente
- **409 Conflict:** Carpeta ya existe (esperado con `'fail'`)
- Sistema maneja 409 como éxito (usa la existente)

---

**Fix permanente aplicado** ✅
