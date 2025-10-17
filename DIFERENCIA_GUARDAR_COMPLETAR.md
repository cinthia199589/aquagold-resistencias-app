# 📘 Diferencia entre GUARDAR y COMPLETAR

## 🔵 GUARDAR (Botón Azul "💾 Guardar")

### ¿Qué hace?
- **Guarda los cambios actuales** en Firestore
- La resistencia **sigue EN PROGRESO**
- Puedes **seguir editando** después
- **NO genera el Excel** automáticamente

### ¿Cuándo usar?
- ✅ Cuando estás **ingresando datos poco a poco** (por horas)
- ✅ Cuando quieres **guardar tu progreso** y continuar después
- ✅ Cuando **corregiste un error** y quieres guardarlo
- ✅ Cuando agregaste fotos o datos parciales

### Validaciones:
- ⚠️ **Requiere** que los campos SO2 MW y SO2 BF tengan valores
- ⚠️ Si están vacíos, te pedirá completarlos antes de guardar

### Ejemplo de uso:
```
9:00 AM  → Creas la resistencia (Lote, Proveedor, etc.)
11:00 AM → Ingresas muestra hora 0, 2, 4 → GUARDAR ✅
13:00 PM → Ingresas muestra hora 6, 8   → GUARDAR ✅
15:00 PM → Ingresas muestra hora 10, 12 → GUARDAR ✅
          (Puedes seguir editando al día siguiente)
```

---

## 🟢 COMPLETAR (Botón Verde "✅ Completar")

### ¿Qué hace?
- **Marca la resistencia como COMPLETADA**
- **Genera automáticamente el archivo Excel**
- **Guarda el Excel en OneDrive**
- La resistencia **YA NO se puede editar** (queda bloqueada)
- Sale del dashboard de "En Progreso"

### ¿Cuándo usar?
- ✅ Cuando **terminaste TODAS las muestras**
- ✅ Cuando **ya no vas a modificar nada más**
- ✅ Cuando quieres **generar el reporte oficial**
- ✅ Cuando la resistencia está **100% lista**

### Importante:
- ⚠️ Te pide **confirmación** antes de completar
- 🔒 Después de completar, los campos quedan **bloqueados**
- 📊 El Excel se genera y guarda automáticamente en OneDrive
- 📂 Todavía puedes **verla en el historial completo**

### Ejemplo de uso:
```
Día 1, 15:00 PM → Ya ingresaste todas las muestras
                → Verificaste que todo esté correcto
                → Presionas "COMPLETAR" ✅
                → Se genera el Excel automáticamente
                → Se guarda en OneDrive
                → Sale de "En Progreso"
```

---

## 📊 Resumen Visual

| Característica | GUARDAR 💾 | COMPLETAR ✅ |
|----------------|-----------|-------------|
| **Guarda cambios** | ✅ Sí | ✅ Sí |
| **Sigue editable** | ✅ Sí | ❌ No (se bloquea) |
| **Genera Excel** | ❌ No | ✅ Sí (automático) |
| **Guarda Excel en OneDrive** | ❌ No | ✅ Sí |
| **Sigue en "En Progreso"** | ✅ Sí | ❌ No (sale) |
| **Requiere confirmación** | ❌ No | ✅ Sí |
| **Se puede revertir** | ✅ Sí | ❌ No |

---

## 🎯 Flujo de Trabajo Recomendado

### Opción 1: Trabajo continuo (mismo día)
```
1. Crear Resistencia
2. Ingresar muestras cada 2 horas
3. GUARDAR después de cada grupo de muestras
4. Cuando termines TODO → COMPLETAR
```

### Opción 2: Trabajo en varios días
```
Día 1:
  - Crear Resistencia
  - Ingresar muestras del día
  - GUARDAR al terminar el día
  
Día 2:
  - Abrir la resistencia
  - Continuar ingresando muestras
  - GUARDAR al terminar el día
  
Día 3:
  - Terminar las últimas muestras
  - COMPLETAR (genera Excel)
```

---

## 🔧 ¿Cómo corregir errores?

### Si la resistencia está EN PROGRESO:
1. Abrir la resistencia
2. Corregir los datos (Lote, Proveedor, Piscina, muestras, etc.)
3. Hacer clic en **GUARDAR** 💾
4. Los cambios se guardan, puedes seguir trabajando

### Si la resistencia está COMPLETADA:
- ❌ **No puedes editar** campos bloqueados
- ✅ Puedes **descargar el Excel** y editarlo manualmente
- 🔄 O **crear una nueva resistencia** con los datos correctos

---

## 💡 Consejos

1. **Guarda frecuentemente** mientras trabajas
2. **Verifica todo** antes de COMPLETAR
3. Si tienes dudas, **GUARDA** (es reversible)
4. Solo **COMPLETA** cuando estés 100% seguro
5. Una vez completada, **descarga el Excel** como respaldo

---

¿Tienes más preguntas sobre GUARDAR vs COMPLETAR? ¡Pregunta!
