# 🔴 BUG CRÍTICO: Reporte Diario Muestra Día Anterior

## 🐛 Problema Identificado

**Síntoma:** 
- Usuario selecciona fecha: 18/10/2025
- Sistema muestra datos del: 17/10/2025
- **Datos INCORRECTOS en reporte** ❌

## 🔍 Análisis de Causa

### Problema 1: Zonas Horarias (TZ)

```typescript
// PROBLEMA EN: lib/firestoreService.ts (línea 157)

const getTestsByDate = async (date: string): Promise<ResistanceTest[]> => {
  const q = query(
    testsRef,
    where('date', '>=', date),           // "2025-10-18"
    where('date', '<', getNextDay(date)) // "2025-10-19"
  );
};

// Y getNextDay hace:
const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);  // ⚠️ PROBLEMA: Interpreta como UTC
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};
```

### ¿Por qué es un problema?

```
Entrada del usuario: "2025-10-18"
↓
JavaScript interpreta como: 2025-10-18T00:00:00Z (UTC)
↓
Si el usuario está en GMT-5 (Ecuador):
Hora local = 2025-10-17T19:00:00 (¡¡ AÚN ES 17 DE OCTUBRE !!)
↓
Firestore guarda con timestamp local
↓
La búsqueda busca 2025-10-18 >= fecha < 2025-10-19
↓
Pero si el test se guardó el 17/10 a las 19:00,
¡¡NO coincide con rango 18/10!!
```

### Problema 2: Inconsistencia en Formato de Fecha

Los tests se guardan con distintos formatos:
```typescript
// En TestDetailPage o NewTestPage, la fecha se guarda como:
date: new Date().toISOString() // "2025-10-18T15:30:45.123Z"

// Pero la comparación busca:
where('date', '>=', '2025-10-18') // Formato: YYYY-MM-DD
```

Esto causa **desajuste en zonas horarias**.

---

## ✅ SOLUCIÓN (3 Opciones)

### **OPCIÓN 1: Usar Fechas en UTC (Recomendado)**

```typescript
// CAMBIO EN: lib/firestoreService.ts

// ANTES - PROBLEMATICO:
const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

// DESPUÉS - CORRECTO:
const getNextDay = (dateStr: string): string => {
  // dateStr viene como "2025-10-18"
  // Convertir a fecha en UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().split('T')[0];
};

export const getTestsByDate = async (date: string): Promise<ResistanceTest[]> => {
  try {
    // date viene como "2025-10-18"
    // Garantizar que es interpretado en UTC
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1));
    
    const startDateStr = startDate.toISOString().split('T')[0]; // "2025-10-18"
    const endDateStr = endDate.toISOString().split('T')[0];     // "2025-10-19"

    const testsRef = collection(db, TESTS_COLLECTION);
    const q = query(
      testsRef,
      where('date', '>=', startDateStr),
      where('date', '<', endDateStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];
    
    console.log(`✅ ${tests.length} pruebas encontradas para ${date} (UTC)`);
    return tests;
  } catch (error: any) {
    console.error('❌ Error al buscar pruebas por fecha:', error);
    throw new Error(`Error al buscar: ${error.message}`);
  }
};
```

### **OPCIÓN 2: Estandarizar Formato de Fecha en Todo el Sistema**

```typescript
// Cuando se crea un test, guardar SIEMPRE en formato "YYYY-MM-DD"
// NO como ISO string con hora

// CAMBIO EN: app/page.tsx y components/NewTestPage.tsx

// ANTES - PROBLEMATICO:
const newTest: ResistanceTest = {
  // ...
  date: new Date().toISOString(), // "2025-10-18T15:30:45.123Z"
};

// DESPUÉS - CORRECTO:
const newTest: ResistanceTest = {
  // ...
  date: new Date().toISOString().split('T')[0], // "2025-10-18"
};
```

### **OPCIÓN 3: Usar Timestamps de Firestore (Más Robusto)**

```typescript
import { Timestamp } from 'firebase/firestore';

// Guardar con Timestamp de Firestore en lugar de string
const newTest: ResistanceTest = {
  // ...
  date: Timestamp.now(),
  dateString: new Date().toISOString().split('T')[0], // Para display
};

// Luego buscar:
export const getTestsByDate = async (date: string): Promise<ResistanceTest[]> => {
  const [year, month, day] = date.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day));
  const endOfDay = new Date(Date.UTC(year, month - 1, day + 1));

  const q = query(
    testsRef,
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<', Timestamp.fromDate(endOfDay))
  );
};
```

---

## 🎯 RECOMENDACIÓN INMEDIATA

**Implementar OPCIÓN 1 (más simple y directa):**

1. ✅ Corrige el bug actual
2. ✅ Garantiza UTC en todas las búsquedas
3. ✅ Menos cambios en código
4. ✅ Compatible con datos existentes

**Pasos:**
1. Cambiar `getTestsByDate()` con parsing UTC correcto
2. Cambiar `getNextDay()` con UTC
3. Testear con fechas en diferentes zonas horarias
4. Verificar reportes anteriores se muestren correctamente

---

## 🧪 Cómo Reproducir el Bug

```
1. Usuario en zona horaria: GMT-5 (Ecuador, Colombia, Perú)
2. Selecciona fecha: 18/10/2025
3. Esperado: Datos del 18/10
4. Real: Muestra datos del 17/10
↓
PORQUE: JavaScript interpreta "2025-10-18" como UTC
        Pero el usuario está en GMT-5, así que son las 19:00 del 17/10
```

---

## ⚠️ Impacto

- 🔴 **CRÍTICO**: Datos incorrectos en reportes
- 🔴 **CRÍTICO**: Decisiones basadas en datos erróneos
- 🟡 **IMPORTANTE**: Afecta a todos los usuarios
- 🟡 **IMPORTANTE**: Especialmente usuarios en diferentes TZ

---

## ✅ Solución Propuesta

Usar UTC explícitamente en todas las búsquedas de fecha. Cambio de ~10 líneas de código.

**Impacto:** Bug FIJO ✅
