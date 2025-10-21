# 📋 INSTRUCCIONES PASO A PASO - Migración OneDrive

## 🎯 PASO 1: Crear las Carpetas Nuevas

### Opción Más Fácil - Desde la Aplicación:

1. **Abre la aplicación**: http://localhost:3000

2. **Crea una prueba MP de prueba**:
   - Click en "Nueva Prueba"
   - Tipo: Materia Prima
   - Lote: TEST-MP-001
   - Llenar campos mínimos
   - Guardar
   - ✅ Esto crea automáticamente `Aquagold_MP/`

3. **Crea una prueba PT de prueba**:
   - Click en "Nueva Prueba"
   - Tipo: Producto Terminado
   - Lote: TEST-PT-001
   - Llenar campos mínimos
   - Guardar
   - ✅ Esto crea automáticamente `Aquagold_PT/`

4. **Elimina las pruebas de prueba** (opcional)

---

## 📊 PASO 2: Ver Tus Datos Actuales

En la aplicación, anota qué tipo es cada lote:

```
EJEMPLO:
┌──────────────┬─────────────────────────┐
│ Lote         │ Tipo                    │
├──────────────┼─────────────────────────┤
│ 0004692-25   │ MATERIA_PRIMA (MP)      │
│ 0004694-25   │ PRODUCTO_TERMINADO (PT) │
│ 0004696-25   │ MATERIA_PRIMA (MP)      │
└──────────────┴─────────────────────────┘
```

💡 **TIP**: Puedes tomar screenshot o hacer una lista en papel

---

## 🚚 PASO 3: Mover las Carpetas en OneDrive

### En tu navegador:

1. **Abre OneDrive**: https://onedrive.live.com

2. **Busca la carpeta**: `Aquagold_Resistencias`

3. **Para cada lote**, según tu lista:

   **Si es Materia Prima (MP)**:
   ```
   ✅ Selecciona la carpeta (ej: 0004692-25)
   ✅ Click derecho → Mover
   ✅ Selecciona "Aquagold_MP"
   ✅ Confirmar
   ```

   **Si es Producto Terminado (PT)**:
   ```
   ✅ Selecciona la carpeta (ej: 0004694-25)
   ✅ Click derecho → Mover
   ✅ Selecciona "Aquagold_PT"
   ✅ Confirmar
   ```

4. **Verifica** que `Aquagold_Resistencias` quedó vacía

---

## 🔗 PASO 4: Actualizar Enlaces de Fotos

**⚠️ IMPORTANTE**: Las fotos en Firestore tienen URLs viejas.

### Ejecuta este comando en la terminal:

```powershell
npm run migrate-photo-urls
```

**Qué hace este script**:
- ✅ Lee todos los tests de Firestore
- ✅ Cambia las URLs de fotos:
  - `Aquagold_Resistencias/0004692-25/foto_s1.jpg`
  - → `Aquagold_MP/0004692-25/foto_s1.jpg`
- ✅ Guarda los cambios en Firestore
- ✅ Te muestra un resumen de cambios

**Ejemplo de salida**:
```
📦 Lote: 0004692-25
   Tipo: MP
   📸 Muestra 1:
      ANTES: ...Aquagold_Resistencias/0004692-25/foto_s1.jpg
      DESPUÉS: ...Aquagold_MP/0004692-25/foto_s1.jpg
   ✅ URLs actualizadas

🎉 MIGRACIÓN COMPLETADA!
   Total de pruebas: 5
   Pruebas actualizadas: 5
```

---

## ✅ PASO 5: Verificar Todo Funciona

1. **Recarga la aplicación**: http://localhost:3000

2. **Verifica**:
   - ✅ Todas las pruebas aparecen
   - ✅ Todas las fotos se ven correctamente
   - ✅ Puedes abrir cada prueba

3. **Prueba crear una nueva**:
   - ✅ Crea una prueba MP → debe ir a `Aquagold_MP/`
   - ✅ Crea una prueba PT → debe ir a `Aquagold_PT/`

4. **Prueba completar una**:
   - ✅ El Excel debe guardarse en la carpeta correcta

---

## 🗑️ PASO 6: Limpiar (SOLO SI TODO FUNCIONA)

**⚠️ NO HAGAS ESTO HASTA VERIFICAR TODO**

1. Entra a OneDrive
2. Verifica que `Aquagold_Resistencias/` está vacía
3. Elimina la carpeta `Aquagold_Resistencias/`

---

## 📞 ¿Problemas?

### ❌ "No aparecen mis fotos"
**Solución**: 
1. Verifica que moviste las carpetas correctamente en OneDrive
2. Ejecuta de nuevo: `npm run migrate-photo-urls`

### ❌ "Error al ejecutar migrate-photo-urls"
**Solución**: 
1. Verifica que tienes el archivo `.env.local` con las variables de Firebase
2. Verifica que las variables son correctas

### ❌ "No puedo mover carpetas en OneDrive"
**Solución**: 
1. Verifica que tienes permisos de escritura
2. Intenta desde OneDrive Desktop (sincronizado)

---

## 🎯 Resumen Visual

```
ANTES:
OneDrive/
└── Aquagold_Resistencias/
    ├── 0004692-25/  (MP)
    ├── 0004694-25/  (PT)
    └── 0004696-25/  (MP)

DESPUÉS:
OneDrive/
├── Aquagold_MP/
│   ├── 0004692-25/  ← Movido
│   └── 0004696-25/  ← Movido
│
└── Aquagold_PT/
    └── 0004694-25/  ← Movido
```

**URLs actualizadas automáticamente por el script**

---

## ⏱️ Tiempo Estimado

- PASO 1: 2 minutos
- PASO 2: 1 minuto
- PASO 3: 5-10 minutos (depende de cuántos lotes tengas)
- PASO 4: 1 minuto
- PASO 5: 3 minutos
- PASO 6: 1 minuto

**TOTAL: ~15 minutos** ⚡

