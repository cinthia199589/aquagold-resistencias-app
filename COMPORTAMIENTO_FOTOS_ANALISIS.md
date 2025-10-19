# 📸 Análisis: Comportamiento de Fotos al Resubir

## 🔍 Situación Actual

### ❌ PROBLEMA IDENTIFICADO:
**Cuando un usuario sube una foto equivocada y vuelve a subir otra, la foto anterior NO SE BORRA.**

### Código Actual (graphService.ts - línea 159):
```typescript
export const uploadPhotoToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  photoBlob: Blob
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);

  try {
    const fileName = `foto_${sampleId}.jpg`;
    const uploadEndpoint = `/me/drive/root:/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}:/content`;
    
    // Subir la foto con PUT
    const uploadResponse = await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
    
    // ...resto del código
  }
}
```

### ¿Qué hace el método PUT de OneDrive?
**✅ SOBRESCRIBE el archivo** si ya existe con el mismo nombre.

---

## ✅ COMPORTAMIENTO REAL

### Escenario 1: Primera vez subiendo foto
```
Usuario selecciona foto_equivocada.jpg
    ↓
Se sube a: /Aquagold_Resistencias/LOTE123/foto_muestra1.jpg
    ↓
✅ Archivo creado en OneDrive
```

### Escenario 2: Usuario sube otra foto (corregir error)
```
Usuario selecciona foto_correcta.jpg
    ↓
Se sube a: /Aquagold_Resistencias/LOTE123/foto_muestra1.jpg
    ↓
PUT sobrescribe el archivo ✅
    ↓
⚠️ La foto anterior SE PIERDE (no hay backup)
    ↓
✅ Solo existe la nueva foto
```

---

## 📊 Resultado

| Característica | Estado Actual |
|----------------|---------------|
| ¿Se borra la foto anterior? | ✅ **SÍ** (sobrescrita por PUT) |
| ¿Quedan fotos duplicadas? | ❌ **NO** |
| ¿Hay backup de la anterior? | ❌ **NO** |
| ¿Aumenta el espacio usado? | ❌ **NO** (mismo archivo) |

---

## ✅ CONCLUSIÓN

**Tu pregunta:** "¿Al volver a subir se borra la anterior y se guarda la nueva?"

**Respuesta:** ✅ **SÍ, SE SOBRESCRIBE AUTOMÁTICAMENTE**

### Comportamiento Detallado:
1. **Primera subida:** Crea `foto_muestra1.jpg` en OneDrive
2. **Segunda subida:** **REEMPLAZA** `foto_muestra1.jpg` con la nueva foto
3. **No hay duplicados:** Solo existe 1 archivo por muestra
4. **No hay basura:** El espacio no crece innecesariamente

### Nombre del Archivo:
```typescript
const fileName = `foto_${sampleId}.jpg`;
// Ejemplo: foto_muestra-1.jpg, foto_muestra-2.jpg, etc.
```

**Como el nombre es siempre el mismo para cada muestra, el PUT de OneDrive sobrescribe automáticamente.**

---

## 🔒 Seguridad de Datos

### Ventaja:
✅ No hay duplicados  
✅ Espacio de almacenamiento optimizado  
✅ Siempre la última foto subida es la válida

### Desventaja:
⚠️ **No hay historial de fotos anteriores**  
⚠️ Si el usuario se equivoca, no puede recuperar la foto anterior

---

## 💡 Mejora Opcional (Si lo Deseas)

### Opción A: Mantener Comportamiento Actual (Recomendado)
- **Pros:** Simple, eficiente, sin duplicados
- **Contras:** No hay historial

### Opción B: Guardar Historial con Timestamp
Cambiar el nombre del archivo para incluir timestamp:
```typescript
const timestamp = Date.now();
const fileName = `foto_${sampleId}_${timestamp}.jpg`;
// Resultado: foto_muestra1_1234567890.jpg
```
- **Pros:** Historial completo de fotos
- **Contras:** Acumula archivos, más espacio usado, más complejo limpiar

### Opción C: Mover Anterior a Carpeta "Backup"
Antes de sobrescribir, mover la foto antigua a `/Backup/`:
```typescript
// 1. Verificar si existe foto anterior
// 2. Si existe, moverla a /Backup/lote123_muestra1_old.jpg
// 3. Subir nueva foto con el nombre original
```
- **Pros:** Balance entre historial y orden
- **Contras:** Requiere lógica adicional

---

## 📝 Recomendación

**MANTENER EL COMPORTAMIENTO ACTUAL** por las siguientes razones:

1. ✅ **Simplicidad:** El código es simple y robusto
2. ✅ **Eficiencia:** No hay archivos huérfanos
3. ✅ **UX claro:** El usuario sabe que la última foto subida es la válida
4. ✅ **Menos errores:** No hay confusión sobre qué foto es la correcta
5. ✅ **OneDrive estándar:** PUT con sobrescritura es el comportamiento esperado

### Flujo UX Ideal:
```
Usuario sube foto equivocada
    ↓
Ve la vista previa en la app
    ↓
"Oh, me equivoqué"
    ↓
Vuelve a subir la correcta
    ↓
PUT sobrescribe automáticamente ✅
    ↓
Solo existe la foto correcta
```

---

## 🎯 Respuesta Final

**Pregunta:** "¿Si uno se equivoca de foto al subirla, volviéndola a subir se borra la anterior y se guarda la nueva?"

**Respuesta:** ✅ **SÍ, EXACTAMENTE ASÍ FUNCIONA**

- La foto anterior se **sobrescribe** (no se "borra" técnicamente, se reemplaza)
- Solo queda la **última foto subida**
- **No hay duplicados** en OneDrive
- El comportamiento es **automático** (no requiere código adicional)
- Es el **comportamiento estándar** de PUT en OneDrive API

**Estado del sistema:** ✅ **FUNCIONANDO CORRECTAMENTE** para tu caso de uso.
