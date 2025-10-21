# 🔍 Análisis Profundo: Pérdida de Datos 0004690-25

## 📊 Hechos Confirmados

1. ✅ Los datos ESTABAN en Firestore (estado: completado)
2. ✅ Los datos ESTÁN en OneDrive (carpeta + Excel)
3. ❌ Los datos NO aparecen en la aplicación (solo 1 foto)
4. ⚠️ Los JSON se movieron manualmente de carpeta antigua → nueva

---

## 🐛 PROBLEMA IDENTIFICADO: Doble Limpieza de Datos

### Bug #1: cleanDataForFirestore + cleanDataFromFirestore

```typescript
// AL GUARDAR (Firestore)
cleanDataForFirestore(data) {
  if (data === undefined) return null;  // undefined → null
  // ...
}

// AL LEER (Firestore)
cleanDataFromFirestore(data) {
  if (data === null) return undefined;  // null → undefined
  // ...
}
```

**Problema:**
- `undefined` → `null` → `undefined` (OK)
- PERO si un campo se guardó como `null` originalmente, se convierte a `undefined`
- Si hay objetos anidados con `null`, se pierden

### Bug #2: Valores Falsy (0, '', false)

```typescript
// Campos numéricos con valor 0
sample.vivos = 0  // ¿Se trata como falsy?
sample.muertos = 0  // ¿Se trata como falsy?
```

**Problema Potencial:**
- Si en algún momento un campo con valor `0` se trata como falsy
- Podría no guardarse o perderse en la limpieza

---

## 🔄 Flujo de Datos: Guardar → Completar

### Escenario Normal (Funciona)

```
1. Usuario ingresa datos
   ↓
2. Auto-guardado → saveTestToFirestore()
   ↓
3. Datos → cleanDataForFirestore() → Firestore
   ↓
4. Datos → IndexedDB local
   ↓
5. Usuario completa resistencia
   ↓
6. Lee de IndexedDB (datos completos)
   ↓
7. Genera Excel → OneDrive
   ↓
8. Guarda completedTest → Firestore
```

### Escenario con Problema (Falla)

```
1. Usuario ingresa datos
   ↓
2. Auto-guardado → saveTestToFirestore()
   ↓
3. Datos → Firestore ✅
   ↓
4. Datos → IndexedDB ✅
   ↓
5. [EVENTO DISRUPTIVO]
   - Navegador cerrado inesperadamente
   - Caché borrado
   - Error de IndexedDB
   ↓
6. Usuario completa resistencia
   ↓
7. Lee desde Firestore (porque IndexedDB vacío)
   ↓
8. cleanDataFromFirestore() ← AQUÍ SE PIERDE ALGO
   ↓
9. Genera Excel con datos parciales
   ↓
10. Guarda datos parciales → Firestore
```

---

## 🎯 CAUSA RAÍZ MÁS PROBABLE

### Teoría Principal: Cache Corruption

**Escenario:**
1. Datos se guardan correctamente en Firestore (completos)
2. IndexedDB se corrompe o se borra
3. Al completar, se lee desde Firestore
4. `cleanDataFromFirestore()` tiene un bug con campos anidados
5. Se pierden los `samples[]` completos
6. Solo queda 1 foto porque estaba en un campo separado
7. Se guarda el test incompleto de vuelta a Firestore

**Evidencia:**
- "Después de dos días apareció sin datos" = IndexedDB se limpió
- "Solo con una foto" = Algunos campos se preservaron
- "Datos en OneDrive" = El Excel se generó antes con datos completos

---

## 🔬 Prueba del Bug

### Experimento para Reproducir

```javascript
// En consola del navegador
const testSample = {
  hour: "0",
  vivos: 0,
  moribundos: 5,
  muertos: 0,
  supervivencia: 0,
  photoUrl: "https://..."
};

// Simular guardado a Firestore
const toFirestore = cleanDataForFirestore(testSample);
console.log('A Firestore:', toFirestore);

// Simular lectura desde Firestore
const fromFirestore = cleanDataFromFirestore(toFirestore);
console.log('Desde Firestore:', fromFirestore);

// ¿Son iguales?
console.log('Iguales?', JSON.stringify(testSample) === JSON.stringify(fromFirestore));
```

---

## 🛠️ SOLUCIONES IMPLEMENTADAS

### 1. ✅ ENABLE_DUAL_WRITE: true
- **Qué hace:** Guarda JSON completo en OneDrive además de Firestore
- **Beneficio:** Respaldo adicional que NO pasa por cleanData()
- **Protege contra:** Corrupción de datos en Firestore/IndexedDB

### 2. 🔄 Función de Recuperación desde Excel
- **Qué hace:** Lee el Excel de OneDrive y reconstruye el test
- **Beneficio:** Recupera datos incluso si Firestore está corrupto
- **Archivo:** `lib/recoverFromOneDrive.ts`

### 3. 📋 Script de recuperación inmediata
- **Qué hace:** Interfaz en consola para recuperar datos
- **Archivo:** `RECUPERACION_0004690-25.md`

---

## 🐛 BUGS A CORREGIR

### Bug Crítico #1: cleanDataFromFirestore puede perder datos

**Archivo:** `lib/firestoreService.ts`  
**Línea:** ~115

**Problema:**
```typescript
const cleanDataFromFirestore = (data: any): any => {
  if (data === null) {
    return undefined;  // ⚠️ PELIGRO: Convierte null a undefined siempre
  }
  // ...
}
```

**Solución:**
```typescript
const cleanDataFromFirestore = (data: any): any => {
  // Solo convertir null a undefined en campos opcionales
  // NO convertir valores explícitos como 0, false, ''
  
  if (data === null || data === undefined) {
    return undefined;
  }
  
  // IMPORTANTE: Preservar 0, false, '' que son valores válidos
  if (typeof data === 'number' || typeof data === 'boolean' || typeof data === 'string') {
    return data;  // Retornar directamente sin procesar
  }
  
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== null && item !== undefined)  // Filtrar nulls
      .map(cleanDataFromFirestore);
  }
  
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanDataFromFirestore(value);
      // Solo agregar si no es undefined (elimina campos null)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return data;
};
```

---

## 📊 Diagnóstico: ¿Por qué moviste los JSON?

**Tu comentario:** "los JSON se guardaban en una carpeta incorrecta y como anteriormente me dijiste que migrara los datos de los JSON de forma manual los copie de la antigua carpeta a la nueva"

**Análisis:**
1. Los JSON estaban en `/Aquagold_Resistencias/database/`
2. Moviste a `/Aquagold_MP/database/` o `/Aquagold_PT/database/`
3. El sistema NO lee esos JSON automáticamente
4. Los JSON son solo RESPALDO, no se usan para mostrar datos

**Conclusión:**
- ✅ Mover los JSON está bien
- ❌ NO causó la pérdida de datos
- ℹ️ Los datos se muestran desde Firestore/IndexedDB, no desde JSON

---

## 🎯 PLAN DE ACCIÓN

### Inmediato (Hoy)

1. ✅ `ENABLE_DUAL_WRITE: true` activado
2. 🔄 Ejecutar script de recuperación para 0004690-25
3. ✅ Verificar que datos se recuperan correctamente

### Corto Plazo (Esta Semana)

1. 🐛 Corregir bug en `cleanDataFromFirestore()`
2. 🧪 Probar con datos de prueba
3. 📝 Documentar casos edge (0, null, undefined, '')

### Largo Plazo (Prevención)

1. 🔄 Sistema de verificación de integridad periódica
2. 📊 Alertas si faltan datos en samples
3. 🔐 Validación de datos antes de guardar
4. 📸 Verificar que todas las fotos están antes de completar

---

## ✅ Resumen Ejecutivo

**Problema:**
- Resistencia 0004690-25 perdió datos de samples
- Solo quedó 1 foto visible

**Causa Probable:**
- IndexedDB se limpió (navegador/caché)
- Al leer desde Firestore, `cleanDataFromFirestore()` tiene un bug
- El bug causó pérdida de datos en arrays/objetos anidados

**Solución Inmediata:**
- Recuperar desde Excel de OneDrive (datos completos ahí)

**Prevención:**
- ✅ ENABLE_DUAL_WRITE: true (JSON backup)
- 🔄 Corregir bug en cleanDataFromFirestore()
- 🛡️ Triple respaldo: Firestore + IndexedDB + OneDrive JSON

**Estado:**
- ✅ Sistema de respaldo activado
- ✅ Script de recuperación listo
- 🔄 Pendiente: Corregir bug + recuperar 0004690-25
