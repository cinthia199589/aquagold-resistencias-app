# 🔧 Fix: Error "No hay cuenta activa en MSAL"

## ❌ Problema Detectado

Al iniciar la app, la migración intentaba ejecutarse **antes** de que el usuario completara el login con MSAL, resultando en 29 errores:

```
❌ [MIGRATION] "Error subiendo test rt-XXXXX a OneDrive:" 
Error: No hay cuenta activa en MSAL
```

### Causa Raíz
El `useEffect` de migración en `app/page.tsx` se ejecutaba inmediatamente cuando:
- `instance` estaba disponible (objeto MSAL inicializado)
- `isOnline` era true

Pero **NO verificaba** si había un usuario autenticado activamente en MSAL.

---

## ✅ Solución Implementada

### 1. **Validación en `app/page.tsx`** (línea ~1633)

```typescript
// 🔄 Iniciar migración en background
useEffect(() => {
  if (!instance || !isOnline) {
    return; // Esperar a tener sesión y conexión
  }

  // ✅ NUEVO: Verificar cuenta activa antes de migrar
  const accounts = instance.getAllAccounts();
  if (!accounts || accounts.length === 0) {
    console.log('⏸️ Esperando autenticación MSAL para iniciar migración...');
    return; // No hay cuenta activa todavía
  }

  // Ahora sí iniciar migración
  const startMigration = async () => {
    try {
      console.log('🚀 Iniciando migración en background...');
      await migrationService.startBackgroundMigration(instance, loginRequest.scopes);
      await loadAllTests();
    } catch (error) {
      console.error('⚠️ Error en migración (datos legacy seguros):', error);
    }
  };
  
  setTimeout(startMigration, 5000); // 5 segundos después de login
}, [instance, isOnline]);
```

**Cambio clave**: Se agrega `instance.getAllAccounts()` para verificar que hay un usuario logueado.

---

### 2. **Validación en `lib/onedriveDataService.ts`** (línea ~44)

```typescript
export const uploadTestToOneDrive = async (
  instance: any,
  scopes: string[],
  test: ResistanceTest
): Promise<string> => {
  try {
    // ✅ NUEVO: Validar cuenta activa
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    
    log.info(`Subiendo test ${test.id} a OneDrive...`);
    
    // ... resto del código
  } catch (error) {
    log.error(`Error subiendo test ${test.id} a OneDrive:`, error);
    throw error;
  }
};
```

**Cambio clave**: Valida cuenta antes de intentar subir archivos.

---

### 3. **Validación en `downloadTestFromOneDrive`** (línea ~92)

```typescript
export const downloadTestFromOneDrive = async (
  instance: any,
  scopes: string[],
  testId: string,
  date: string
): Promise<ResistanceTest> => {
  try {
    // ✅ NUEVO: Validar cuenta activa
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    
    log.info(`Descargando test ${testId} desde OneDrive...`);
    
    // ... resto del código
  } catch (error) {
    log.error(`Error descargando test ${testId}:`, error);
    throw error;
  }
};
```

**Cambio clave**: Valida cuenta antes de intentar descargar.

---

### 4. **Validación en `lib/migrationService.ts`** (línea ~95)

```typescript
async startBackgroundMigration(instance: any, scopes: string[]): Promise<void> {
  if (this.status.isRunning) {
    log.warn('⚠️ La migración ya está en ejecución');
    return;
  }

  this.status.isRunning = true;
  this.status.startedAt = new Date();
  this.abortMigration = false;

  log.success('🚀 Iniciando migración en background...');

  try {
    // ✅ NUEVO: Validar cuenta activa MSAL
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      log.error('❌ No hay cuenta activa en MSAL. La migración se detendrá.');
      this.status.isRunning = false;
      this.status.errors.push({
        testId: 'system',
        error: 'No hay cuenta activa en MSAL. Por favor inicia sesión primero.'
      });
      return;
    }
    
    // ... resto del código de migración
  } catch (error) {
    log.error('❌ Error fatal en migración:', error);
    this.status.isRunning = false;
    throw error;
  }
}
```

**Cambio clave**: Detiene la migración de forma limpia si no hay cuenta.

---

## 🎯 Flujo Corregido

### Antes (❌ CON ERROR):
```
1. Usuario abre http://localhost:8080
2. MSAL inicializa (instance creado)
3. useEffect detecta instance + isOnline
4. 🔴 Intenta migrar SIN usuario logueado
5. Error: "No hay cuenta activa en MSAL" × 29
```

### Ahora (✅ CORRECTO):
```
1. Usuario abre http://localhost:8080
2. MSAL inicializa (instance creado)
3. useEffect detecta instance + isOnline
4. ✅ Verifica: instance.getAllAccounts()
5. Si NO hay cuenta → Log: "⏸️ Esperando autenticación..."
6. Usuario hace login con MSAL
7. useEffect se vuelve a ejecutar (instance actualizado)
8. ✅ Ahora SÍ hay cuenta activa
9. Espera 5 segundos
10. Inicia migración exitosamente
```

---

## 🧪 Cómo Probar

### 1. **Recargar la app**
```bash
# En el navegador, hacer Ctrl+Shift+R (hard refresh)
# O cerrar y abrir http://localhost:8080
```

### 2. **Verificar consola del navegador**
Deberías ver:
```
⏸️ Esperando autenticación MSAL para iniciar migración...
[Usuario hace login]
🚀 Iniciando migración en background...
📊 Tests a migrar: 7
📦 Migrando batch 1/1 (7 tests)
✅ Test rt-XXXXX migrado exitosamente
```

### 3. **Verificar banner de migración**
- Debe aparecer **DESPUÉS** del login
- Mostrar progreso 0% → 100%
- Sin errores en la lista

---

## 📊 Resultado Esperado

### ✅ ÉXITO:
- 0 errores de MSAL
- Migración completa al 100%
- Todos los tests visibles en dashboard
- JSON creados en OneDrive
- Índices creados en Firebase

### ❌ Si aún hay errores:
1. **Verificar que estás logueado**:
   ```javascript
   // En consola del navegador:
   console.log(instance.getAllAccounts())
   // Debe mostrar array con tu cuenta
   ```

2. **Verificar permisos OneDrive**:
   - Ir a Azure Portal
   - API Permissions → `Files.ReadWrite`
   - Admin consent otorgado

3. **Limpiar estado de migración**:
   ```javascript
   // En consola del navegador:
   migrationService.resetStatus()
   migrationService.startBackgroundMigration(instance, loginRequest.scopes)
   ```

---

## 🔄 Archivos Modificados

1. ✅ `app/page.tsx` - Validación en useEffect
2. ✅ `lib/onedriveDataService.ts` - Validación en upload/download
3. ✅ `lib/migrationService.ts` - Validación en inicio de migración
4. ✅ 0 errores de compilación

---

## 💡 Lecciones Aprendidas

### Problema General
**No asumir que `instance` disponible = usuario autenticado**

### Solución
**Siempre verificar**: `instance.getAllAccounts().length > 0`

### Contexto MSAL
```typescript
// ❌ INCORRECTO (puede causar error)
if (instance) {
  await uploadToOneDrive(instance, scopes, data);
}

// ✅ CORRECTO (verifica autenticación)
if (instance && instance.getAllAccounts().length > 0) {
  await uploadToOneDrive(instance, scopes, data);
}
```

---

## 🚀 Próximos Pasos

1. **Testing**: Probar con login real
2. **Validación**: Verificar migración completa
3. **Monitoreo**: Observar costos de Firebase después de 7 días
4. **Optimización**: Desactivar dual-write después de 30 días

---

**Estado**: ✅ CORREGIDO  
**Compilación**: 0 errores  
**Listo para**: Testing con usuario real
