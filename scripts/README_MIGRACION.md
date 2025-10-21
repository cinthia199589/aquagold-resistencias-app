# 🔄 Migración de Tipos de Resistencia

## Descripción

Este script asigna el campo `testType` a todos los registros existentes de resistencias que no lo tengan.

## ⚠️ IMPORTANTE - Leer antes de ejecutar

- **CRÍTICO**: Este script modificará datos en producción
- **BACKUP**: Haz backup de Firestore antes de ejecutar
- **UNA VEZ**: Este script debe ejecutarse UNA SOLA VEZ
- **IRREVERSIBLE**: Los cambios no pueden deshacerse fácilmente

## Tipo por Defecto

Por defecto, el script asigna `MATERIA_PRIMA` a todos los registros existentes.

Si necesitas cambiar esto:
1. Abre `scripts/migrate-test-types.ts`
2. Busca la línea `const DEFAULT_TEST_TYPE = 'MATERIA_PRIMA';`
3. Cámbiala a `'PRODUCTO_TERMINADO'` si es necesario

## Pasos para Ejecutar

### 1. Hacer Backup de Firestore

Antes de ejecutar el script, haz backup de tu base de datos:

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Click en "Exportar datos" (en el menú de tres puntos)
5. Guarda la exportación en un lugar seguro

### 2. Instalar Dependencias

Si aún no has instalado las dependencias:

```bash
npm install
```

### 3. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga todas las credenciales de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 4. Ejecutar en Modo Preview (SIN MODIFICAR DATOS)

Primero ejecuta sin confirmar para ver qué registros se migrarán:

```bash
npx tsx scripts/migrate-test-types.ts
```

Esto mostrará:
- Cuántos registros existen
- Cuántos necesitan migración
- Preview de los primeros 10 registros
- **NO modificará ningún dato** (por seguridad, CONFIRMED = false)

### 5. Revisar el Preview

Revisa cuidadosamente:
- ✅ La cantidad de registros a migrar es correcta
- ✅ Los lotes y fechas mostrados corresponden a tus datos
- ✅ El tipo por defecto (`MATERIA_PRIMA`) es el correcto

### 6. Ejecutar la Migración Real

Si todo se ve correcto:

1. Abre `scripts/migrate-test-types.ts`
2. Busca la línea:
   ```typescript
   const CONFIRMED = false; // ⚠️ CAMBIAR A true PARA EJECUTAR
   ```
3. Cámbiala a:
   ```typescript
   const CONFIRMED = true;
   ```
4. Guarda el archivo
5. Ejecuta nuevamente:
   ```bash
   npx tsx scripts/migrate-test-types.ts
   ```

### 7. Verificar Resultados

El script mostrará:
- ✅ Progreso en tiempo real
- ✅ Cantidad de registros migrados exitosamente
- ❌ Errores si los hubo
- 📊 Resumen final
- 🔍 Verificación automática

## Qué Hace el Script

1. **Lee** todos los documentos de la colección `resistance_tests`
2. **Filtra** los que NO tienen el campo `testType`
3. **Muestra** un preview de los registros a migrar
4. **Solicita confirmación** (debes editar el código para confirmar)
5. **Actualiza** cada registro agregando `testType: 'MATERIA_PRIMA'`
6. **Verifica** que todos los registros ahora tengan `testType`
7. **Reporta** errores si los hubo

## Solución de Problemas

### Error: "Cannot find module 'tsx'"

Instala tsx globalmente:

```bash
npm install -g tsx
```

O usa npx (ya incluido en los comandos):

```bash
npx tsx scripts/migrate-test-types.ts
```

### Error: "Firebase credentials not found"

Verifica que tu `.env.local` tenga todas las credenciales de Firebase.

### Error: "Permission denied"

Verifica que tu cuenta de Firebase tenga permisos de escritura en Firestore.

### Algunos registros no se migraron

Revisa la sección de errores en el output del script. Puede que algunos registros tengan problemas de permisos o estén bloqueados.

## Después de la Migración

1. ✅ Verifica en Firebase Console que los registros tengan `testType`
2. ✅ Prueba la aplicación para asegurarte de que funciona correctamente
3. ✅ Cambia `CONFIRMED` de vuelta a `false` para evitar ejecuciones accidentales
4. ✅ Haz commit de los cambios (sin el archivo de migración modificado)

## Contacto

Si tienes dudas o problemas, contacta al equipo de desarrollo.

---

**Última actualización**: Enero 2025
