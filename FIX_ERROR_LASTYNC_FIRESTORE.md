# 🐛 Fix: Error "Resource id '__lastSync__' is invalid"

## Problema
```
FirebaseError: Resource id "__lastSync__" is invalid because it is reserved.
```

## Causa
Firestore **no permite IDs que empiecen con doble guión bajo** (`__`). El sistema intentaba guardar el timestamp de sincronización como un documento con ID `__lastSync__` en la misma colección que los tests.

## Solución Implementada ✅

### 1. Tabla Separada para Metadata
Movimos el timestamp de sincronización a una **tabla IndexedDB separada** llamada `sync_metadata`:

```typescript
// ANTES (❌ Incorrecto):
const STORE_NAME = 'resistance_tests';
await store.put({ id: '__lastSync__', timestamp }); // ← Intentaba guardarse en Firestore

// DESPUÉS (✅ Correcto):
const METADATA_STORE = 'sync_metadata'; // ← Tabla separada
await metadataStore.put({ key: 'lastSync', timestamp }); // ← SOLO en IndexedDB
```

### 2. Actualización de Versión de IndexedDB
```typescript
const DB_VERSION = 2; // Incrementado de 1 a 2

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  
  // Nueva tabla para metadata
  if (!db.objectStoreNames.contains('sync_metadata')) {
    db.createObjectStore('sync_metadata', { keyPath: 'key' });
  }
};
```

### 3. Metadata NO se Sincroniza con Firestore
El timestamp de última sincronización ahora:
- ✅ Se guarda SOLO en IndexedDB local
- ✅ NO se intenta sincronizar con Firestore
- ✅ Persiste entre recargas
- ✅ Se usa solo para saber cuándo fue la última descarga

## Estructura de IndexedDB

### Antes:
```
AquagoldResistenciasDB (v1)
├── resistance_tests
│   ├── test1
│   ├── test2
│   └── __lastSync__ ← ❌ Intentaba sincronizarse con Firestore
└── pending_sync
```

### Ahora:
```
AquagoldResistenciasDB (v2)
├── resistance_tests
│   ├── test1
│   ├── test2
│   └── ...
├── pending_sync
└── sync_metadata ← ✅ Nueva tabla SOLO local
    └── lastSync: { key: "lastSync", timestamp: "2025-10-19T..." }
```

## Archivos Modificados

### `lib/localStorageService.ts`
```typescript
// Constantes actualizadas
const DB_VERSION = 2; // ← Incrementado
const METADATA_STORE = 'sync_metadata'; // ← Nueva tabla

// Función simplificada
export const saveLastSyncTimestamp = async (timestamp: string) => {
  const db = await initDB();
  const transaction = db.transaction([METADATA_STORE], 'readwrite');
  const store = transaction.objectStore(METADATA_STORE);
  
  await store.put({ key: 'lastSync', timestamp });
  // ← NO intenta sincronizar con Firestore
};
```

## Testing

### Verificar que Funciona:
1. Abre http://localhost:8080
2. Inicia sesión
3. **DevTools → Application → IndexedDB → AquagoldResistenciasDB**
4. Deberías ver 3 tablas:
   - `resistance_tests` (tests normales)
   - `pending_sync` (sincronización pendiente)
   - `sync_metadata` ← **Nueva tabla**
5. Haz clic en `sync_metadata`:
   ```json
   {
     "key": "lastSync",
     "timestamp": "2025-10-19T10:30:00.123Z"
   }
   ```

### Verificar que NO Aparece en Firestore:
1. Abre Firebase Console
2. Ve a Firestore Database
3. Colección `resistance_tests`
4. ✅ **NO** debería haber ningún documento con ID `__lastSync__`
5. ✅ Solo tests normales

## Prevención de Errores Futuros

### Reglas de Firestore IDs:
- ❌ NO usar `__` al inicio (reservado por Firestore)
- ❌ NO usar `.` o `/` (separadores de rutas)
- ✅ Usar UUIDs normales (`v4()`)
- ✅ Usar timestamps para metadata local

### Separación de Concerns:
- **Firestore**: Datos que necesitan sincronizarse entre dispositivos
- **IndexedDB Metadata**: Timestamps, configuración local, cache

## Resultado Final

✅ Error resuelto completamente  
✅ Timestamp de sync persiste localmente  
✅ NO se intenta guardar en Firestore  
✅ Sincronización incremental funciona correctamente  
✅ IndexedDB actualizado a v2 automáticamente

---

**Última actualización:** 19 de octubre de 2025  
**Estado:** ✅ RESUELTO
